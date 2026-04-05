// controllers/paperController.js
// Handles paper submission, retrieval, status updates

const { db, bucket } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

/**
 * POST /api/papers/submit
 * Submit a new paper with PDF upload to Firebase Storage
 */
const submitPaper = async (req, res) => {
  const { title, abstract, keywords, authorName, authorEmail, institution, coAuthors } = req.body;

  if (!title || !abstract || !keywords) {
    return res.status(400).json({ error: "Title, abstract, and keywords are required" });
  }

  let fileUrl = null;
  let fileName = null;

  // Handle PDF upload if file is present
  if (req.file) {
    const fileId = uuidv4();
    const ext = path.extname(req.file.originalname) || ".pdf";
    fileName = `papers/${fileId}${ext}`;

    const fileRef = bucket.file(fileName);
    await fileRef.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype || "application/pdf",
        metadata: { uploadedBy: req.user.uid },
      },
    });

    // Make the file publicly accessible
    await fileRef.makePublic();
    fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  }

  // Parse keywords and co-authors
  const keywordsArray = typeof keywords === "string"
    ? keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : keywords;

  const coAuthorsArray = coAuthors
    ? typeof coAuthors === "string" ? JSON.parse(coAuthors) : coAuthors
    : [];

  const paper = {
    title,
    abstract,
    keywords: keywordsArray,
    authorId: req.user.uid,
    authorName: authorName || req.user.name || "",
    authorEmail: authorEmail || req.user.email || "",
    institution: institution || "",
    coAuthors: coAuthorsArray,
    fileUrl,
    fileName,
    status: "submitted", // submitted → under_review → accepted/rejected → published
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewers: [],
    volume: null,
    issue: null,
    doi: null,
  };

  const docRef = await db.collection("papers").add(paper);

  res.status(201).json({
    message: "Paper submitted successfully",
    paperId: docRef.id,
    status: "submitted",
  });
};

/**
 * GET /api/papers
 * Get all papers - admin/editor sees all, authors see own papers
 */
const getAllPapers = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const isAdmin = ["admin", "editor"].includes(req.user.role);

  let query = db.collection("papers").orderBy("submittedAt", "desc");

  // Non-admin authors only see their own papers
  if (!isAdmin) {
    query = query.where("authorId", "==", req.user.uid);
  }

  // Filter by status if provided
  if (status) {
    query = query.where("status", "==", status);
  }

  const snapshot = await query.get();
  const papers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  res.json({ papers, total: papers.length });
};

/**
 * GET /api/papers/published
 * Public endpoint — returns all published papers
 */
const getPublishedPapers = async (req, res) => {
  const { volume, issue } = req.query;

  let query = db.collection("papers").where("status", "==", "published").orderBy("updatedAt", "desc");

  if (volume) query = query.where("volume", "==", Number(volume));
  if (issue) query = query.where("issue", "==", Number(issue));

  const snapshot = await query.get();
  const papers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  res.json({ papers });
};

/**
 * GET /api/papers/:id
 * Get a specific paper by ID
 */
const getPaperById = async (req, res) => {
  const { id } = req.params;
  const doc = await db.collection("papers").doc(id).get();

  if (!doc.exists) {
    return res.status(404).json({ error: "Paper not found" });
  }

  const paper = { id: doc.id, ...doc.data() };
  const isAdmin = ["admin", "editor"].includes(req.user?.role);
  const isOwner = paper.authorId === req.user?.uid;
  const isReviewer = paper.reviewers?.includes(req.user?.uid);

  // Access control: only admin/editor/owner/assigned reviewer can view
  if (!isAdmin && !isOwner && !isReviewer && paper.status !== "published") {
    return res.status(403).json({ error: "Access denied" });
  }

  res.json(paper);
};

/**
 * PATCH /api/papers/:id/status
 * Update paper status — admin/editor only
 */
const updatePaperStatus = async (req, res) => {
  const { id } = req.params;
  const { status, volume, issue, doi, comments } = req.body;

  const validStatuses = ["submitted", "under_review", "revision_required", "accepted", "rejected", "published"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be: ${validStatuses.join(", ")}` });
  }

  const updates = {
    status,
    updatedAt: new Date().toISOString(),
    statusUpdatedBy: req.user.uid,
  };

  if (volume) updates.volume = Number(volume);
  if (issue) updates.issue = Number(issue);
  if (doi) updates.doi = doi;
  if (comments) updates.editorComments = comments;

  await db.collection("papers").doc(id).update(updates);

  res.json({ message: `Paper status updated to: ${status}` });
};

/**
 * PATCH /api/papers/:id/assign-reviewer
 * Assign a reviewer to a paper — admin/editor only
 */
const assignReviewer = async (req, res) => {
  const { id } = req.params;
  const { reviewerId } = req.body;

  if (!reviewerId) {
    return res.status(400).json({ error: "Reviewer ID is required" });
  }

  // Verify the reviewer exists and has the correct role
  const reviewerDoc = await db.collection("users").doc(reviewerId).get();
  if (!reviewerDoc.exists || !["reviewer", "editor", "admin"].includes(reviewerDoc.data().role)) {
    return res.status(400).json({ error: "Invalid reviewer ID" });
  }

  await db.collection("papers").doc(id).update({
    reviewers: require("firebase-admin").firestore.FieldValue.arrayUnion(reviewerId),
    status: "under_review",
    updatedAt: new Date().toISOString(),
  });

  res.json({ message: "Reviewer assigned successfully" });
};

/**
 * DELETE /api/papers/:id
 * Delete a paper — admin or paper owner (if not published)
 */
const deletePaper = async (req, res) => {
  const { id } = req.params;
  const doc = await db.collection("papers").doc(id).get();

  if (!doc.exists) {
    return res.status(404).json({ error: "Paper not found" });
  }

  const paper = doc.data();
  const isAdmin = ["admin", "editor"].includes(req.user.role);
  const isOwner = paper.authorId === req.user.uid;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (paper.status === "published" && !isAdmin) {
    return res.status(403).json({ error: "Cannot delete a published paper" });
  }

  // Delete file from Firebase Storage if exists
  if (paper.fileName) {
    try {
      await bucket.file(paper.fileName).delete();
    } catch (e) {
      console.warn("Could not delete file from storage:", e.message);
    }
  }

  await db.collection("papers").doc(id).delete();

  res.json({ message: "Paper deleted successfully" });
};

module.exports = {
  submitPaper,
  getAllPapers,
  getPublishedPapers,
  getPaperById,
  updatePaperStatus,
  assignReviewer,
  deletePaper,
};
