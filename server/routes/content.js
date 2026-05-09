const express = require("express");
const prisma = require("../config/db");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Only admin and manager can update content
const requireManagerOrAdmin = (req, res, next) => {
  const roles = req.user.roles || [req.user.role];
  if (!roles.includes("admin") && !roles.includes("manager")) {
    return res.status(403).json({ error: "Access denied. Admins or Managers only." });
  }
  next();
};

// GET /api/content/:key
router.get("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const content = await prisma.siteContent.findUnique({
      where: { key }
    });
    if (!content) {
      // Return empty default instead of 404 — avoids console errors on unconfigured keys
      return res.json({ key, value: null });
    }
    res.json(content);
  } catch (error) {
    console.error("GET /api/content/:key error:", error);
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

// GET /api/content to fetch multiple keys (optional but useful)
// Not implemented now, keeping it simple as params

// PUT /api/content/:key
router.put("/:key", verifyToken, requireManagerOrAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const content = await prisma.siteContent.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    
    res.json(content);
  } catch (error) {
    console.error("PUT /api/content/:key error:", error);
    res.status(500).json({ error: "Failed to update content" });
  }
});

module.exports = router;
