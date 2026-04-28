// routes/admin.js
const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getDashboardStats,
  getReviewers,
  getReviewerProfiles,
  getReviewAssignments,
  getSubmittedReviews,
} = require("../controllers/adminController");
const { verifyToken, requireRole } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

// All admin routes require authentication + admin/editor/manager role
router.use(verifyToken, requireRole(["admin", "editor", "manager"]));

router.get("/stats", asyncHandler(getDashboardStats));
router.get("/users", asyncHandler(getAllUsers));
router.get("/reviewers", asyncHandler(getReviewers));
router.get("/reviewer-profiles", asyncHandler(getReviewerProfiles));
router.get("/review-assignments", asyncHandler(getReviewAssignments));
router.get("/submitted-reviews", asyncHandler(getSubmittedReviews));
router.patch("/users/:uid/role", requireRole(["admin"]), asyncHandler(updateUserRole));
router.delete("/users/:uid", requireRole(["admin"]), asyncHandler(deleteUser));

module.exports = router;
