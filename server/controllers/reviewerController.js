// controllers/reviewerController.js
// Handles reviewer profile, assignments, and structured review submission

const prisma = require("../config/db");
const { notifyAdminAssignmentResponse, notifyAdminReviewSubmitted } = require("../utils/mailer");

// ─── GET /api/reviewer/profile ─────────────────────────────────────────────────
const getReviewerProfile = async (req, res) => {
  try {
    const profile = await prisma.reviewerProfile.findUnique({
      where: { uid: req.user.uid },
      include: { user: { select: { name: true, email: true } } },
    });

    res.json({ profile }); // null if not yet created
  } catch (error) {
    console.error("Error fetching reviewer profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── POST /api/reviewer/profile ────────────────────────────────────────────────
const saveReviewerProfile = async (req, res) => {
  const { phone, university, specialization, hasExperience, experienceDetails } = req.body;

  if (!phone || !university || !specialization) {
    return res.status(400).json({ error: "Phone, university, and specialization are required" });
  }

  try {
    const profile = await prisma.reviewerProfile.upsert({
      where: { uid: req.user.uid },
      update: { phone, university, specialization, hasExperience: !!hasExperience, experienceDetails: experienceDetails || null },
      create: {
        uid: req.user.uid,
        phone,
        university,
        specialization,
        hasExperience: !!hasExperience,
        experienceDetails: experienceDetails || null,
      },
    });

    res.json({ message: "Reviewer profile saved successfully", profile });
  } catch (error) {
    console.error("Error saving reviewer profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /api/reviewer/assignments ─────────────────────────────────────────────
const getAssignments = async (req, res) => {
  try {
    const assignments = await prisma.reviewAssignment.findMany({
      where: { reviewerId: req.user.uid },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            abstract: true,
            authorName: true,
            keywords: true,
            submittedAt: true,
            fileUrl: true,
            status: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    // Check which papers already have a review from this reviewer
    const reviewedPaperIds = await prisma.review.findMany({
      where: { reviewerId: req.user.uid },
      select: { paperId: true },
    });
    const reviewedSet = new Set(reviewedPaperIds.map((r) => r.paperId));

    const enriched = assignments.map((a) => ({
      ...a,
      hasReview: reviewedSet.has(a.paperId),
    }));

    res.json({ assignments: enriched });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── PATCH /api/reviewer/assignments/:id ───────────────────────────────────────
const respondToAssignment = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["accepted", "declined"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'accepted' or 'declined'" });
  }

  try {
    const assignment = await prisma.reviewAssignment.findUnique({
      where: { id },
      include: { paper: { select: { title: true } } },
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    if (assignment.reviewerId !== req.user.uid) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (assignment.status !== "pending") {
      return res.status(400).json({ error: `Assignment already ${assignment.status}` });
    }

    await prisma.reviewAssignment.update({
      where: { id },
      data: { status, respondedAt: new Date() },
    });

    // Notify admins/editors
    const admins = await prisma.user.findMany({
      where: { roles: { hasSome: ["admin", "editor"] } },
      select: { email: true },
    });
    for (const admin of admins) {
      notifyAdminAssignmentResponse(admin.email, req.user.name, assignment.paper.title, status).catch(() => {});
    }

    res.json({ message: `Assignment ${status} successfully` });
  } catch (error) {
    console.error("Error responding to assignment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── POST /api/reviewer/review ─────────────────────────────────────────────────
const submitReview = async (req, res) => {
  const { paperId, positives, negatives, corrections, suggestions, decision, confidenceLevel, overallComments } = req.body;

  if (!paperId || !decision) {
    return res.status(400).json({ error: "paperId and decision are required" });
  }

  const validDecisions = ["accept", "reject", "minor_revision", "major_revision"];
  if (!validDecisions.includes(decision)) {
    return res.status(400).json({ error: `Decision must be: ${validDecisions.join(", ")}` });
  }

  if (!positives && !negatives) {
    return res.status(400).json({ error: "Please provide at least positive or negative feedback" });
  }

  try {
    // Verify the reviewer has an accepted assignment for this paper
    const assignment = await prisma.reviewAssignment.findUnique({
      where: { paperId_reviewerId: { paperId, reviewerId: req.user.uid } },
    });

    if (!assignment || assignment.status !== "accepted") {
      return res.status(403).json({ error: "You must accept the assignment before submitting a review" });
    }

    // Check for duplicate review
    const existing = await prisma.review.findFirst({
      where: { paperId, reviewerId: req.user.uid },
    });
    if (existing) {
      return res.status(409).json({ error: "You have already submitted a review for this paper" });
    }

    const paper = await prisma.paper.findUnique({ where: { id: paperId }, select: { title: true } });

    const review = await prisma.review.create({
      data: {
        paperId,
        reviewerId: req.user.uid,
        positives: positives || null,
        negatives: negatives || null,
        corrections: corrections || null,
        suggestions: suggestions || null,
        decision,
        confidenceLevel: confidenceLevel || null,
        overallComments: overallComments || null,
        comments: `Decision: ${decision}`, // legacy compat
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { roles: { hasSome: ["admin", "editor"] } },
      select: { email: true },
    });
    for (const admin of admins) {
      notifyAdminReviewSubmitted(admin.email, req.user.name, paper?.title || "Unknown", decision).catch(() => {});
    }

    res.status(201).json({ message: "Review submitted successfully", reviewId: review.id });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── GET /api/reviewer/reviews ─────────────────────────────────────────────────
const getMyReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { reviewerId: req.user.uid },
      include: {
        paper: { select: { id: true, title: true, authorName: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getReviewerProfile,
  saveReviewerProfile,
  getAssignments,
  respondToAssignment,
  submitReview,
  getMyReviews,
};
