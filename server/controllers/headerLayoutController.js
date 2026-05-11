const prisma = require("../config/db");

/**
 * GET /api/header-layout?journal=JournalName
 * Returns the stored layout JSON for the given journal name.
 */
const getLayout = async (req, res) => {
  try {
    const journalName = req.query.journal;
    if (!journalName) {
      return res.status(400).json({ error: "Missing journal query parameter" });
    }
    const layout = await prisma.headerLayout.findUnique({
      where: { journalName },
    });
    if (!layout) {
      return res.status(404).json({ error: "Layout not found for journal" });
    }
    res.json({ layout: layout.layout });
  } catch (err) {
    console.error("Error fetching header layout", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * POST /api/header-layout
 * Body: { journalName: string, layout: [] }
 * Upserts the layout for a journal.
 */
const saveLayout = async (req, res) => {
  try {
    const { journalName, layout } = req.body;
    if (!journalName || !Array.isArray(layout)) {
      return res.status(400).json({ error: "Invalid payload" });
    }
    const upserted = await prisma.headerLayout.upsert({
      where: { journalName },
      update: { layout },
      create: { journalName, layout },
    });
    res.json({ message: "Layout saved", layout: upserted.layout });
  } catch (err) {
    console.error("Error saving header layout", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getLayout, saveLayout };
