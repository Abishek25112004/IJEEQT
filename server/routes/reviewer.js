// routes/reviewer.js
const express = require("express");
const router = express.Router();
const {
  getReviewerProfile,
  saveReviewerProfile,
  getAssignments,
  respondToAssignment,
  submitReview,
  getMyReviews,
} = require("../controllers/reviewerController");
const { verifyToken, requireRole } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

// All reviewer routes require auth + reviewer/editor/admin role
router.use(verifyToken, requireRole(["reviewer", "editor", "admin"]));

router.get("/profile", asyncHandler(getReviewerProfile));
router.post("/profile", asyncHandler(saveReviewerProfile));
router.get("/assignments", asyncHandler(getAssignments));
router.patch("/assignments/:id", asyncHandler(respondToAssignment));
router.post("/review", asyncHandler(submitReview));
router.get("/reviews", asyncHandler(getMyReviews));

module.exports = router;
