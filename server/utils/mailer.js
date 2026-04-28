// utils/mailer.js
// Shared email utility using nodemailer — reused across OTP, reviewer notifications, etc.

const nodemailer = require("nodemailer");

const JOURNAL_NAME = process.env.JOURNAL_NAME || "IJEEQT";

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
 * Send a styled email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} heading - Main heading in the email body
 * @param {string} bodyHtml - HTML content for the email body section
 */
async function sendEmail(to, subject, heading, bodyHtml) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ SMTP not configured — skipping email to:", to);
    return;
  }

  const transporter = createTransporter();

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%); padding: 28px 32px; text-align: center;">
        <div style="display: inline-block; background: rgba(255,255,255,0.15); padding: 8px 20px; border-radius: 8px; color: white; font-weight: 800; font-size: 20px; letter-spacing: 1px;">
          ${JOURNAL_NAME}
        </div>
      </div>

      <!-- Body -->
      <div style="padding: 32px; background: white;">
        <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin: 0 0 16px;">${heading}</h2>
        ${bodyHtml}
      </div>

      <!-- Footer -->
      <div style="background: #f8fafc; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">&copy; ${new Date().getFullYear()} ${JOURNAL_NAME}. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${JOURNAL_NAME}" <${process.env.SMTP_USER}>`,
      to,
      subject: `${JOURNAL_NAME} — ${subject}`,
      html,
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
  }
}

/**
 * Notify reviewer of a new paper assignment
 */
async function notifyReviewerAssigned(reviewerEmail, reviewerName, paperTitle) {
  await sendEmail(
    reviewerEmail,
    "New Paper Assigned for Review",
    "📄 New Review Assignment",
    `
      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
        Dear <strong>${reviewerName}</strong>,
      </p>
      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
        You have been assigned a new paper to review:
      </p>
      <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
        <p style="color: #1e293b; font-size: 15px; font-weight: 600; margin: 0;">${paperTitle}</p>
      </div>
      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
        Please log in to your <strong>Reviewer Panel</strong> to accept or decline this assignment.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/reviewer"
           style="display: inline-block; background: #1d4ed8; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Open Reviewer Panel
        </a>
      </div>
    `
  );
}

/**
 * Notify admin/editor that a reviewer responded to an assignment
 */
async function notifyAdminAssignmentResponse(adminEmail, reviewerName, paperTitle, response) {
  const statusColor = response === "accepted" ? "#16a34a" : "#dc2626";
  const statusLabel = response === "accepted" ? "✅ Accepted" : "❌ Declined";

  await sendEmail(
    adminEmail,
    `Reviewer ${response === "accepted" ? "Accepted" : "Declined"} Assignment`,
    "Review Assignment Update",
    `
      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
        Reviewer <strong>${reviewerName}</strong> has responded to a paper assignment:
      </p>
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
        <p style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0 0 8px;">${paperTitle}</p>
        <p style="margin: 0; font-size: 14px; color: ${statusColor}; font-weight: 700;">${statusLabel}</p>
      </div>
    `
  );
}

/**
 * Notify admin that a review has been submitted
 */
async function notifyAdminReviewSubmitted(adminEmail, reviewerName, paperTitle, decision) {
  const decisionLabels = {
    accept: "✅ Accept",
    minor_revision: "📝 Minor Revision",
    major_revision: "🔄 Major Revision",
    reject: "❌ Reject",
  };

  await sendEmail(
    adminEmail,
    "New Review Submitted",
    "📋 Review Submitted",
    `
      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
        Reviewer <strong>${reviewerName}</strong> has submitted a review:
      </p>
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
        <p style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0 0 8px;">${paperTitle}</p>
        <p style="margin: 0; font-size: 14px; font-weight: 600;">Decision: ${decisionLabels[decision] || decision}</p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/admin"
           style="display: inline-block; background: #1d4ed8; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          View in Admin Panel
        </a>
      </div>
    `
  );
}

module.exports = {
  sendEmail,
  notifyReviewerAssigned,
  notifyAdminAssignmentResponse,
  notifyAdminReviewSubmitted,
};
