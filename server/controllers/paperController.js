// controllers/paperController.js
// Handles paper submission, retrieval, status updates with PostgreSQL (Prisma) and Cloudinary

const prisma = require("../config/db");
const cloudinary = require("../config/cloudinary");
const { notifyAuthorSubmissionReceived, notifyAuthorStatusUpdate } = require("../utils/mailer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { stampPdf } = require("../utils/pdfStamper");

const uploadToCloudinary = (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // Ideal for PDFs/documents
        public_id: fileName,    // Sets the file name in Cloudinary
        folder: "papers",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * POST /api/papers/submit
 * Submit a new paper with document upload to Cloudinary
 */
const submitPaper = async (req, res) => {
  const { title, abstract, keywords, domain, authorName, authorEmail, institution, coAuthors } = req.body;

  if (!title || !abstract || !keywords) {
    return res.status(400).json({ error: "Title, abstract, and keywords are required" });
  }

  let fileUrl = null;
  let fileName = null;

  try {
    // Handle PDF upload if file is present via Cloudinary
    if (req.file) {
      const fileId = `${uuidv4()}.pdf`;
      const result = await uploadToCloudinary(req.file.buffer, fileId);
      
      fileUrl = result.secure_url;
      fileName = result.public_id; // Keep public_id for future reference/deletion
    }

    // Parse keywords and co-authors
    const keywordsArray = typeof keywords === "string"
      ? keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : keywords;

    const coAuthorsArray = coAuthors
      ? typeof coAuthors === "string" ? JSON.parse(coAuthors) : coAuthors
      : [];
      
    // Verify user exists in PostgreSQL to link relation correctly
    const authorExists = await prisma.user.findUnique({
      where: { uid: req.user.uid }
    });
    
    // In case the user bypassed PostgreSQL insertion (e.g., from old Firebase data),
    // we would handle the error or create the user implicitly. Assuming user exists:
    if (!authorExists) {
      return res.status(404).json({ error: "User profile not synced to PostgreSQL. Please contact admin."});
    }

    const paperData = {
      title,
      abstract,
      keywords: keywordsArray,
      domain: domain || null,
      author: { connect: { uid: req.user.uid } },
      authorName: authorName || req.user.name || "",
      authorEmail: authorEmail || req.user.email || "",
      institution: institution || "",
      coAuthors: coAuthorsArray,
      fileUrl,
      fileName,
      status: "submitted",
    };

    const paper = await prisma.paper.create({
      data: paperData
    });

    // Notify author of submission
    notifyAuthorSubmissionReceived(paper.authorEmail, paper.authorName, paper.title).catch(() => {});

    res.status(201).json({
      message: "Paper submitted successfully",
      paperId: paper.id,
      status: paper.status,
    });
  } catch (error) {
    console.error("Paper submission error:", error);
    res.status(500).json({ error: "Internal server error during paper submission" });
  }
};

/**
 * GET /api/papers
 * Get all papers - admin/editor sees all, authors see own papers
 */
const getAllPapers = async (req, res) => {
  try {
    const { status, onlyOwn, page = 1, limit = 20 } = req.query;
    const isAdmin = (req.user.roles || []).includes("admin") || req.user.role === "admin";
    const isEditor = (req.user.roles || []).includes("editor") || req.user.role === "editor";

    const whereClause = {};

    // Role-based visibility
    if (onlyOwn === "true" || (!isAdmin && !isEditor)) {
      // If explicitly requested or user is just an author, only show their own papers
      whereClause.authorId = req.user.uid;
    } else if (isEditor && !isAdmin) {
      // Editors see all except published papers by default (to avoid mixing with admin's published list)
      // But if they explicitly filter by 'published' or it's their own paper, they can see it.
      if (!status || status !== "published") {
        whereClause.OR = [
          { status: { not: "published" } },
          { authorId: req.user.uid }
        ];
      }
    }

    // Filter by status if provided
    if (status) {
      // If editor tries to fetch published, it will be intersected with the whereClause above by Prisma
      whereClause.status = status;
    }

    const papers = await prisma.paper.findMany({
      where: whereClause,
      orderBy: { submittedAt: 'desc' }
    });

    // Fetch counts for all statuses (for tabs)
    const countsData = await prisma.paper.groupBy({
      by: ['status'],
      where: isAdmin || isEditor ? {} : { authorId: req.user.uid },
      _count: true
    });

    const counts = {};
    countsData.forEach(c => { counts[c.status] = c._count; });
    
    // For editors, 'total' in the 'All' tab should match the papers they see (non-published)
    // For admins, 'total' is everything.
    if (isEditor && !isAdmin) {
      counts.total = Object.entries(counts)
        .filter(([status]) => status !== "published")
        .reduce((sum, [_, count]) => sum + count, 0);
      // We still want to see the published count in the specific tab, so counts.published stays.
    } else {
      counts.total = Object.values(counts).reduce((a, b) => a + b, 0);
    }

    res.json({ papers, total: papers.length, counts });
  } catch (error) {
    console.error("Error fetching papers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/papers/published
 * Public endpoint — returns all published papers
 */
const getPublishedPapers = async (req, res) => {
  try {
    const { volume, issue, year } = req.query;

    const whereClause = { status: "published" };

    if (volume) whereClause.volume = Number(volume);
    if (issue) whereClause.issue = Number(issue);
    if (year) whereClause.year = Number(year);

    const papers = await prisma.paper.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ papers });
  } catch (error) {
    console.error("Error fetching published papers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/papers/:id
 * Get a specific paper by ID
 */
const getPaperById = async (req, res) => {
  try {
    const { id } = req.params;
    const paper = await prisma.paper.findUnique({
      where: { id }
    });

    if (!paper) {
      return res.status(404).json({ error: "Paper not found" });
    }

    const isAdmin = ["admin", "editor"].includes(req.user?.role);
    const isOwner = paper.authorId === req.user?.uid;
    const isReviewer = paper.reviewers?.includes(req.user?.uid);

    // Access control: only admin/editor/owner/assigned reviewer can view
    if (!isAdmin && !isOwner && !isReviewer && paper.status !== "published") {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(paper);
  } catch (error) {
    console.error("Error fetching paper:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * PATCH /api/papers/:id/status
 * Update paper status — admin/editor only
 */
const updatePaperStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, volume, issue, doi, comments, year } = req.body;

    const validStatuses = ["submitted", "under_review", "revision_required", "accepted", "rejected", "published"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be: ${validStatuses.join(", ")}` });
    }

    // Restriction: Editor cannot publish
    const isAdmin = (req.user.roles || []).includes("admin") || req.user.role === "admin";
    if (status === "published" && !isAdmin) {
      return res.status(403).json({ error: "Access denied. Only admins can publish papers." });
    }

    const updates = {
      status,
    };

    if (volume) updates.volume = Number(volume);
    if (issue) updates.issue = Number(issue);
    if (doi) updates.doi = doi;
    if (comments) updates.editorComments = comments;
    if (year) updates.year = Number(year);

    const updatedPaper = await prisma.paper.update({
      where: { id },
      data: updates
    });

    // Notify author if status is accepted, rejected, published, or revision_required
    if (["accepted", "rejected", "published", "revision_required"].includes(status)) {
      notifyAuthorStatusUpdate(updatedPaper.authorEmail, updatedPaper.authorName, updatedPaper.title, status).catch(() => {});
    }

    res.json({ message: `Paper status updated to: ${status}` });
  } catch (error) {
    console.error("Error updating paper status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * PATCH /api/papers/:id/assign-reviewer
 * Assign a reviewer to a paper — admin/editor only
 * Also creates a ReviewAssignment record and sends email notification
 */
const assignReviewer = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerId } = req.body;

    if (!reviewerId) {
      return res.status(400).json({ error: "Reviewer ID is required" });
    }

    // Verify the reviewer exists and has the correct role
    const reviewer = await prisma.user.findUnique({
      where: { uid: reviewerId }
    });
    
    if (!reviewer) {
       return res.status(400).json({ error: "Reviewer not found in PostgreSQL" });
    }
    
    const reviewerRoles = reviewer.roles || [];
    if (!reviewerRoles.some(role => ["reviewer", "editor", "admin"].includes(role))) {
      return res.status(400).json({ error: "Invalid reviewer role" });
    }

    const paper = await prisma.paper.findUnique({ where: { id }});
    if(!paper) return res.status(404).json({ error: "Paper not found" });

    const currentReviewers = paper.reviewers || [];
    const updatedReviewers = currentReviewers.includes(reviewerId) 
                              ? currentReviewers 
                              : [...currentReviewers, reviewerId];

    await prisma.paper.update({
      where: { id },
      data: {
        reviewers: updatedReviewers
      }
    });

    // Create ReviewAssignment record (upsert to avoid duplicates)
    await prisma.reviewAssignment.upsert({
      where: { paperId_reviewerId: { paperId: id, reviewerId } },
      update: {}, // don't change if already exists
      create: {
        paperId: id,
        reviewerId,
        status: "pending",
      },
    });

    // Send email notification to reviewer
    const { notifyReviewerAssigned } = require("../utils/mailer");
    notifyReviewerAssigned(reviewer.email, reviewer.name, paper.title).catch(() => {});

    res.json({ message: "Reviewer assigned successfully" });
  } catch (error) {
    console.error("Error assigning reviewer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * DELETE /api/papers/:id
 * Delete a paper — admin or paper owner (if not published)
 */
const deletePaper = async (req, res) => {
  try {
    const { id } = req.params;
    const paper = await prisma.paper.findUnique({ where: { id }});

    if (!paper) {
      return res.status(404).json({ error: "Paper not found" });
    }

    const isAdmin = ["admin", "editor"].includes(req.user.role);
    const isOwner = paper.authorId === req.user.uid;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (paper.status === "published" && !isAdmin) {
      return res.status(403).json({ error: "Cannot delete a published paper" });
    }

    // Delete file from Cloudinary if exists
    if (paper.fileName) {
      try {
        await cloudinary.uploader.destroy(paper.fileName, { resource_type: "raw" });
      } catch (e) {
        console.warn("Could not delete file from Cloudinary storage:", e.message);
      }
    }

    await prisma.paper.delete({ where: { id } });

    res.json({ message: "Paper deleted successfully" });
  } catch (error) {
    console.error("Error deleting paper:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/papers/:id/format-pdf
 * Format PDF (Preview or Apply Option B)
 */
const formatPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { volume, issue, doi, year, isPreview } = req.body;

    const isAdmin = (req.user.roles || []).includes("admin") || req.user.role === "admin";
    if (!isAdmin) {
      return res.status(403).json({ error: "Access denied. Only admins can format papers." });
    }

    const paper = await prisma.paper.findUnique({ where: { id } });
    if (!paper || !paper.fileUrl) {
      return res.status(404).json({ error: "Paper or file not found" });
    }

    // Download PDF from Cloudinary using ZIP download (bypasses delivery restrictions)
    let pdfBuffer;
    try {
      const AdmZip = require("adm-zip");
      // Generate a signed ZIP download URL via Cloudinary API
      const zipUrl = cloudinary.utils.download_zip_url({
        public_ids: [paper.fileName],
        resource_type: "raw",
      });
      const zipRes = await fetch(zipUrl);
      if (!zipRes.ok) {
        console.error(`Cloudinary ZIP download failed. Status: ${zipRes.status}`);
        return res.status(502).json({ error: "Failed to download file from storage." });
      }
      const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
      // Extract the PDF from the ZIP
      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries();
      const pdfEntry = entries.find(e => e.entryName.endsWith(".pdf"));
      if (!pdfEntry) {
        return res.status(500).json({ error: "PDF not found inside downloaded archive." });
      }
      pdfBuffer = pdfEntry.getData();
    } catch (fetchErr) {
      console.error("Error downloading PDF from Cloudinary:", fetchErr);
      return res.status(502).json({ error: "Failed to download PDF: " + fetchErr.message });
    }

    // Fetch custom layout if exists
    const journalName = "International Journal of Engineering Education and Quality Technologies (IJEEQT)";
    const layoutRecord = await prisma.headerLayout.findUnique({
      where: { journalName }
    });

    // Stamp the PDF using layout positions (no margin offsets needed)
    const stampedBuffer = await stampPdf(pdfBuffer, {
      journalName,
      volume: volume || "",
      issue: issue || "",
      year: year || "",
      doi: doi || "",
      headerLayout: layoutRecord ? layoutRecord.layout : null
    });

    if (isPreview) {
      // Return base64 for preview
      const base64Pdf = stampedBuffer.toString('base64');
      return res.json({ base64: base64Pdf });
    } else {
      // Option B: Overwrite on Cloudinary
      if (!paper.fileName) {
        return res.status(400).json({ error: "Original file name missing. Cannot overwrite." });
      }

      // We use invalidate to clear the Cloudinary cache
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          public_id: paper.fileName, // Use the existing fileName to overwrite
          overwrite: true,
          invalidate: true,
        },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({ error: "Failed to overwrite PDF on Cloudinary" });
          }
          res.json({ message: "Format applied successfully." });
        }
      );
      uploadStream.end(stampedBuffer);
    }
  } catch (error) {
    console.error("Error formatting PDF:", error);
    res.status(500).json({ error: "Internal server error during PDF formatting." });
  }
};

module.exports = {
  submitPaper,
  getAllPapers,
  getPublishedPapers,
  getPaperById,
  updatePaperStatus,
  assignReviewer,
  deletePaper,
  formatPdf,
};
