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
  formatPdf,
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
router.post("/:id/format-pdf", verifyToken, requireRole(["admin", "editor"]), asyncHandler(formatPdf));

// ─── PDF Download Proxy (bypasses Cloudinary delivery restrictions) ──────────
// Helper: Download PDF from Cloudinary using signed ZIP archive and cache it
async function downloadPdfFromCloudinary(paper) {
  const cloudinary = require("../config/cloudinary");
  const AdmZip = require("adm-zip");
  const fs = require("fs");
  const os = require("os");
  const path = require("path");
  
  let publicId = paper.fileName;
  if (!publicId && paper.fileUrl && paper.fileUrl.includes("res.cloudinary.com")) {
    const match = paper.fileUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (match) publicId = match[1];
  }
  
  if (!publicId) throw new Error("Missing Cloudinary public_id (fileName)");

  // Check local cache first
  const safeId = publicId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const cachePath = path.join(os.tmpdir(), `ijeeqt_pdf_${safeId}.pdf`);
  
  if (fs.existsSync(cachePath)) {
    try {
      return fs.readFileSync(cachePath);
    } catch (err) {
      console.warn("Failed to read from cache", err);
    }
  }

  const zipUrl = cloudinary.utils.download_zip_url({
    public_ids: [publicId],
    resource_type: "raw",
  });
  const zipRes = await fetch(zipUrl);
  if (!zipRes.ok) throw new Error(`ZIP download failed: ${zipRes.status}`);
  const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
  const zip = new AdmZip(zipBuffer);
  const pdfEntry = zip.getEntries().find(e => e.entryName.endsWith(".pdf"));
  if (!pdfEntry) throw new Error("PDF not found in archive");
  
  const pdfBuffer = pdfEntry.getData();
  
  // Save to cache
  try {
    fs.writeFileSync(cachePath, pdfBuffer);
  } catch (err) {
    console.warn("Failed to write to cache", err);
  }
  
  return pdfBuffer;
}

// Authenticated download — any logged-in user with access to the paper
router.get("/:id/download", verifyToken, asyncHandler(async (req, res) => {
  const prisma = require("../config/db");
  const paper = await prisma.paper.findUnique({ where: { id: req.params.id } });

  if (!paper || !paper.fileUrl) {
    return res.status(404).json({ error: "Paper or file not found" });
  }

  const buffer = await downloadPdfFromCloudinary(paper);

  const fileName = paper.title
    ? paper.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf'
    : 'paper.pdf';

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

  const buffer = await downloadPdfFromCloudinary(paper);

  const fileName = paper.title
    ? paper.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf'
    : 'paper.pdf';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
}));

module.exports = router;
