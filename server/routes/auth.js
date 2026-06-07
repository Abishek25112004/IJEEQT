// routes/auth.js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { register, getProfile, updateProfile, resetPassword } = require("../controllers/authController");
const { sendOtp, verifyOtp } = require("../controllers/otpController");
const { verifyToken } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

// ─── Strong Password Validation Rules ────────────────────────────────────────
const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email address is required"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one special character"),
];

// ─── OTP Routes (public) ─────────────────────────────────────────────────────
router.post("/send-otp", asyncHandler(sendOtp));
router.post("/verify-otp", asyncHandler(verifyOtp));
router.post("/reset-password", asyncHandler(resetPassword));

// ─── Auth Routes ─────────────────────────────────────────────────────────────
router.post("/register", registerValidation, asyncHandler(register));
router.get("/profile", verifyToken, asyncHandler(getProfile));
router.put("/profile", verifyToken, asyncHandler(updateProfile));

module.exports = router;
