// routes/papers.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  submitPaper,
  getAllPapers,
  getPublishedPapers,
  getPaperById,
  updatePaperStatus,
  assignReviewer,
  deletePaper,
} = require("../controllers/paperController");
const { verifyToken, requireRole } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

// Multer config — store in memory, max 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// Public routes
router.get("/published", asyncHandler(getPublishedPapers));

// Protected routes (require login)
router.post("/submit", verifyToken, upload.single("pdf"), asyncHandler(submitPaper));
router.get("/", verifyToken, asyncHandler(getAllPapers));
router.get("/:id", verifyToken, asyncHandler(getPaperById));
router.delete("/:id", verifyToken, asyncHandler(deletePaper));

// Admin/Editor only routes
router.patch("/:id/status", verifyToken, requireRole(["admin", "editor"]), asyncHandler(updatePaperStatus));
router.patch("/:id/assign-reviewer", verifyToken, requireRole(["admin", "editor"]), asyncHandler(assignReviewer));

module.exports = router;
