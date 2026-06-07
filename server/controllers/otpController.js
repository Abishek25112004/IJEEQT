// controllers/otpController.js
// Handles sending and verifying email OTPs — strictly via email, no UI exposure

const { sendViaBrevo } = require("../utils/mailer");

// In-memory OTP store: { email -> { otp, expiresAt, attempts } }
const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5; // rate-limit wrong guesses

/**
 * POST /api/auth/send-otp
 * Sends a 6-digit OTP to the given email.
 * OTP is NEVER returned in the response — always email-only.
 */
const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  if (!process.env.BREVO_API_KEY) {
    return res.status(503).json({
      error: "Email service is not configured. Please contact the administrator.",
    });
  }

  // Generate cryptographically-reasonable 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  // Store OTP (overwrite any previous one)
  otpStore.set(email.toLowerCase(), { otp, expiresAt, attempts: 0 });

  const journalName = process.env.JOURNAL_NAME || "IJEEQT";

  try {
    await sendViaBrevo({
      to: email,
      subject: `Your OTP for ${journalName} — Expires in 5 minutes`,
      from: "editorsinchief@ijeeqt.org",
      fromName: journalName,
      replyTo: "editorsinchief@ijeeqt.org",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; padding: 0; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%); padding: 32px 32px 24px; text-align: center;">
            <div style="display: inline-block; background: rgba(255,255,255,0.15); padding: 8px 20px; border-radius: 8px; color: white; font-weight: 800; font-size: 20px; letter-spacing: 1px;">
              ${journalName}
            </div>
            <p style="color: rgba(255,255,255,0.8); margin: 12px 0 0; font-size: 14px;">International Journal of Engineering Excellence in Quantum Technology</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px; background: white;">
            <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 0 0 8px; text-align: center;">Email Verification</h2>
            <p style="color: #64748b; text-align: center; margin: 0 0 28px; font-size: 14px; line-height: 1.6;">
              Use the one-time password below to verify your email address.
            </p>

            <!-- OTP Box -->
            <div style="background: #f1f5f9; border: 2px dashed #3b82f6; border-radius: 14px; padding: 28px; text-align: center; margin-bottom: 24px;">
              <p style="color: #94a3b8; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 12px;">One-Time Password</p>
              <div style="font-size: 48px; font-weight: 900; letter-spacing: 14px; color: #1e3a8a; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
            </div>

            <!-- Warning -->
            <div style="background: #fef9c3; border-left: 4px solid #eab308; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
              <p style="color: #713f12; font-size: 13px; margin: 0; font-weight: 500;">
                ⚠️ This OTP expires in <strong>5 minutes</strong>. Do not share it with anyone.
              </p>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">&copy; ${new Date().getFullYear()} ${journalName}. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    // ✅ Never return OTP in response
    return res.json({ message: "OTP sent successfully. Please check your email." });
  } catch (err) {
    console.error("Email send error:", err.message);
    // Remove the unsent OTP from store
    otpStore.delete(email.toLowerCase());
    return res.status(500).json({
      error: "Failed to send OTP email. Please check your email address and try again.",
    });
  }
};

/**
 * Internal helper to validate and consume OTP
 * Returns { valid: boolean, error?: string }
 */
const validateAndConsumeOtp = (email, otp, consume = true) => {
  if (!email || !otp) return { valid: false, error: "Email and OTP are required" };
  
  const stored = otpStore.get(email.toLowerCase());
  if (!stored) return { valid: false, error: "No OTP found for this email. Please request a new one." };
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, error: "OTP has expired. Please request a new one." };
  }
  
  if (stored.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(email.toLowerCase());
    return { valid: false, error: "Too many failed attempts. Please request a new OTP." };
  }
  
  if (stored.otp !== otp.toString().trim()) {
    otpStore.set(email.toLowerCase(), { ...stored, attempts: stored.attempts + 1 });
    const remaining = MAX_ATTEMPTS - stored.attempts - 1;
    return {
      valid: false,
      error: remaining > 0 ? `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` : "Too many failed attempts. Please request a new OTP."
    };
  }
  
  if (consume) {
    otpStore.delete(email.toLowerCase());
  }
  return { valid: true };
};

/**
 * POST /api/auth/verify-otp
 * Verifies the OTP for the given email
 */
const verifyOtp = async (req, res) => {
  const { email, otp, consume = true } = req.body;
  
  const result = validateAndConsumeOtp(email, otp, consume);
  if (!result.valid) {
    const isRateLimit = result.error.includes("Too many");
    return res.status(isRateLimit ? 429 : 400).json({ error: result.error });
  }

  return res.json({ message: "OTP verified successfully", verified: true });
};

module.exports = { sendOtp, verifyOtp, validateAndConsumeOtp };
