// controllers/reviewController.js
// Handles peer review submission and retrieval

const { db } = require("../config/firebase");

/**
 * POST /api/reviews
 * Submit a review for a paper
 */
const addReview = async (req, res) => {
  const { paperId, comments, decision, scores } = req.body;

  if (!paperId || !comments || !decision) {
    return res.status(400).json({ error: "paperId, comments, and decision are required" });
  }

  const validDecisions = ["accept", "reject", "minor_revision", "major_revision"];
  if (!validDecisions.includes(decision)) {
    return res.status(400).json({ error: `Decision must be: ${validDecisions.join(", ")}` });
  }

  // Verify paper exists and reviewer is assigned
  const paperDoc = await db.collection("papers").doc(paperId).get();
  if (!paperDoc.exists) {
    return res.status(404).json({ error: "Paper not found" });
  }

  const paper = paperDoc.data();
  const isAdmin = ["admin", "editor"].includes(req.user.role);
  const isAssigned = paper.reviewers?.includes(req.user.uid);

  if (!isAdmin && !isAssigned) {
    return res.status(403).json({ error: "You are not assigned to review this paper" });
  }

  // Check if reviewer already submitted a review
  const existingReview = await db.collection("reviews")
    .where("paperId", "==", paperId)
    .where("reviewerId", "==", req.user.uid)
    .get();

  if (!existingReview.empty) {
    return res.status(409).json({ error: "You have already submitted a review for this paper" });
  }

  const review = {
    paperId,
    reviewerId: req.user.uid,
    reviewerName: req.user.name || "",
    comments,
    decision,
    scores: scores || {
      originality: null,
      methodology: null,
      clarity: null,
      significance: null,
    },
    submittedAt: new Date().toISOString(),
    isVisible: false, // Admin can toggle visibility to author
  };

  const docRef = await db.collection("reviews").add(review);

  res.status(201).json({
    message: "Review submitted successfully",
    reviewId: docRef.id,
  });
};

/**
 * GET /api/reviews/paper/:paperId
 * Get all reviews for a paper
 * - Admin/Editor: sees all reviews
 * - Author: only sees visible reviews after decision
 * - Reviewer: sees only their own review
 */
const getReviewsForPaper = async (req, res) => {
  const { paperId } = req.params;
  const isAdmin = ["admin", "editor"].includes(req.user.role);

  const paperDoc = await db.collection("papers").doc(paperId).get();
  if (!paperDoc.exists) {
    return res.status(404).json({ error: "Paper not found" });
  }

  const paper = paperDoc.data();
  const isOwner = paper.authorId === req.user.uid;

  if (!isAdmin && !isOwner && !paper.reviewers?.includes(req.user.uid)) {
    return res.status(403).json({ error: "Access denied" });
  }

  let query = db.collection("reviews").where("paperId", "==", paperId);
  const snapshot = await query.get();

  let reviews = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // Authors only see visible reviews, reviewers only see their own
  if (!isAdmin) {
    if (isOwner) {
      reviews = reviews.filter((r) => r.isVisible);
      // Anonymize reviewer name for blind review
      reviews = reviews.map((r) => ({ ...r, reviewerName: "Anonymous Reviewer", reviewerId: undefined }));
    } else {
      reviews = reviews.filter((r) => r.reviewerId === req.user.uid);
    }
  }

  res.json({ reviews });
};

/**
 * PATCH /api/reviews/:id/visibility
 * Toggle review visibility to author — admin/editor only
 */
const toggleReviewVisibility = async (req, res) => {
  const { id } = req.params;
  const { isVisible } = req.body;

  const doc = await db.collection("reviews").doc(id).get();
  if (!doc.exists) {
    return res.status(404).json({ error: "Review not found" });
  }

  await db.collection("reviews").doc(id).update({
    isVisible: Boolean(isVisible),
    updatedAt: new Date().toISOString(),
  });

  res.json({ message: `Review visibility set to: ${isVisible}` });
};

module.exports = { addReview, getReviewsForPaper, toggleReviewVisibility };
