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

// ─── PDF Download Proxy (bypasses Cloudinary CORS) ─────────────────────────────
// Authenticated download — any logged-in user with access to the paper
router.get("/:id/download", verifyToken, asyncHandler(async (req, res) => {
  const prisma = require("../config/db");
  const paper = await prisma.paper.findUnique({ where: { id: req.params.id } });

  if (!paper || !paper.fileUrl) {
    return res.status(404).json({ error: "Paper or file not found" });
  }

  // Fetch PDF from Cloudinary
  const response = await fetch(paper.fileUrl);
  if (!response.ok) {
    return res.status(502).json({ error: "Failed to fetch file from storage" });
  }

  const fileName = paper.title
    ? paper.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf'
    : 'paper.pdf';

  const buffer = Buffer.from(await response.arrayBuffer());

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
}));

// Public download for published papers (no auth needed)
router.get("/:id/download-public", asyncHandler(async (req, res) => {
  const prisma = require("../config/db");
  const paper = await prisma.paper.findUnique({ where: { id: req.params.id } });

  if (!paper || !paper.fileUrl || paper.status !== "published") {
    return res.status(404).json({ error: "Published paper or file not found" });
  }

  const response = await fetch(paper.fileUrl);
  if (!response.ok) {
    return res.status(502).json({ error: "Failed to fetch file from storage" });
  }

  const fileName = paper.title
    ? paper.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf'
    : 'paper.pdf';

  const buffer = Buffer.from(await response.arrayBuffer());

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
}));

module.exports = router;
