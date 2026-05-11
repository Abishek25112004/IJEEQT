const express = require('express');
const router = express.Router();
const { getLayout, saveLayout } = require('../controllers/headerLayoutController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public GET (no auth) – retrieve layout for a journal
router.get('/', async (req, res) => {
  // Expect ?journal=Name
  await getLayout(req, res);
});

// Protected POST – save/upsert layout (admin/editor)
router.post('/', verifyToken, requireRole(['admin', 'editor']), async (req, res) => {
  await saveLayout(req, res);
});

module.exports = router;
