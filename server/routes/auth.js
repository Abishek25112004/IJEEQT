// routes/auth.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { register, getProfile, updateProfile } = require("../controllers/authController");
const { sendOtp, verifyOtp } = require("../controllers/otpController");
const { verifyToken } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

// Validation rules for registration
const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

// OTP routes (public)
router.post("/send-otp", asyncHandler(sendOtp));
router.post("/verify-otp", asyncHandler(verifyOtp));

// Auth routes
router.post("/register", registerValidation, asyncHandler(register));
router.get("/profile", verifyToken, asyncHandler(getProfile));
router.put("/profile", verifyToken, asyncHandler(updateProfile));

module.exports = router;
