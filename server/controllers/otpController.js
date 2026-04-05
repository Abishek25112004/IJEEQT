// controllers/otpController.js
// Handles sending and verifying email OTPs

const nodemailer = require("nodemailer");

// In-memory OTP store: { email -> { otp, expiresAt } }
const otpStore = new Map();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Create a nodemailer transporter from env vars
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * POST /api/auth/send-otp
 * Sends a 6-digit OTP to the given email
 */
const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  // Store OTP
  otpStore.set(email.toLowerCase(), { otp, expiresAt });

  try {
    const transporter = createTransporter();
    const journalName = process.env.JOURNAL_NAME || "IJEEQT";

    await transporter.sendMail({
      from: `"${journalName}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Your OTP for ${journalName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: #1e3a8a; color: white; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 18px;">
              ${journalName}
            </div>
          </div>
          <h2 style="color: #1e293b; text-align: center; margin-bottom: 8px;">Email Verification</h2>
          <p style="color: #64748b; text-align: center; margin-bottom: 32px;">Use the OTP below to verify your email address.</p>
          <div style="background: white; border: 2px dashed #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 8px;">Your One-Time Password</p>
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #1e3a8a;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        </div>
      `,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Email send error:", err.message);
    // In development, return OTP directly so devs can test without SMTP
    if (process.env.NODE_ENV === "development") {
      return res.json({ message: "OTP sent (dev mode)", devOtp: otp });
    }
    res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
};

/**
 * POST /api/auth/verify-otp
 * Verifies the OTP for the given email
 */
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const stored = otpStore.get(email.toLowerCase());

  if (!stored) {
    return res.status(400).json({ error: "No OTP found for this email. Please request a new one." });
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({ error: "OTP has expired. Please request a new one." });
  }

  if (stored.otp !== otp.toString()) {
    return res.status(400).json({ error: "Invalid OTP. Please try again." });
  }

  // OTP verified — remove from store
  otpStore.delete(email.toLowerCase());
  res.json({ message: "OTP verified successfully", verified: true });
};

module.exports = { sendOtp, verifyOtp };
