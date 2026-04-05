// routes/reviews.js
const express = require("express");
const router = express.Router();
const { addReview, getReviewsForPaper, toggleReviewVisibility } = require("../controllers/reviewController");
const { verifyToken, requireRole } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

router.post("/", verifyToken, asyncHandler(addReview));
router.get("/paper/:paperId", verifyToken, asyncHandler(getReviewsForPaper));
router.patch("/:id/visibility", verifyToken, requireRole(["admin", "editor"]), asyncHandler(toggleReviewVisibility));

module.exports = router;
