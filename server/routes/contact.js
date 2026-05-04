const express = require("express");
const router = express.Router();
const { submitContactForm } = require("../controllers/contactController");
const { asyncHandler } = require("../middleware/errorHandler");

router.post("/", asyncHandler(submitContactForm));

module.exports = router;
