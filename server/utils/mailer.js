// utils/mailer.js
// Shared email utility using Brevo (Sendinblue) HTTP API
// Uses fetch (Node 18+) — no SMTP ports needed, works on Render free tier

const JOURNAL_NAME = process.env.JOURNAL_NAME || "IJEEQT";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Fetch APC amounts from the database (call_for_papers content)
 */
async function getApcAmounts() {
  try {
    const prisma = require("../config/db");
    const content = await prisma.siteContent.findUnique({ where: { key: "call_for_papers" } });
    if (content?.value) {
      const cfp = typeof content.value === "string" ? JSON.parse(content.value) : content.value;
      return {
        indianAmount: cfp.indianAmount || 5000,
        internationalAmount: cfp.internationalAmount || 50,
      };
    }
  } catch (e) {
    console.warn("Could not fetch APC amounts:", e.message);
  }
  return { indianAmount: 5000, internationalAmount: 50 };
}

/**
 * Send an email via Brevo's transactional HTTP API.
 * @param {object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Full HTML body
 * @param {string} [options.from] - Sender email (defaults to SMTP_USER env)
 * @param {string} [options.fromName] - Sender name (defaults to JOURNAL_NAME)
 * @param {string} [options.replyTo] - Reply-to email
 */
async function sendViaBrevo({ to, subject, html, from, fromName, replyTo }) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ BREVO_API_KEY not configured — skipping email to:", to);
    return;
  }

  const payload = {
    sender: {
      name: fromName || JOURNAL_NAME,
      email: from || process.env.SMTP_USER || "noreply@ijeeqt.org",
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  if (replyTo) {
    payload.replyTo = { email: replyTo };
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  console.log(`📧 Email sent to ${to}: ${subject} (messageId: ${result.messageId})`);
  return result;
}

/**
 * Send a styled email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} heading - Main heading in the email body
 * @param {string} bodyHtml - HTML content for the email body section
 * @param {string} [fromOverride] - Optional sender email override
 */
async function sendEmail(to, subject, heading, bodyHtml, fromOverride) {
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
    await sendViaBrevo({
      to,
      subject: `${JOURNAL_NAME} — ${subject}`,
      html,
      from: fromOverride || process.env.SMTP_USER || "noreply@ijeeqt.org",
      replyTo: fromOverride || process.env.SMTP_USER,
    });
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
    `,
    "reviews@ijeeqt.org"
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
    `,
    "reviews@ijeeqt.org"
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
    `,
    "reviews@ijeeqt.org"
  );
}

/**
 * Notify author that their submission was received
 */
async function notifyAuthorSubmissionReceived(authorEmail, authorName, paperTitle) {
  await sendEmail(
    authorEmail,
    "Submission Received",
    "📄 Paper Submission Received",
    `
      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
        Dear <strong>${authorName}</strong>,
      </p>
      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
        Thank you for submitting your paper to ${JOURNAL_NAME}. We have successfully received your manuscript:
      </p>
      <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
        <p style="color: #1e293b; font-size: 15px; font-weight: 600; margin: 0;">${paperTitle}</p>
      </div>
      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
        Your paper is now under preliminary review. We will notify you when its status changes.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard"
           style="display: inline-block; background: #1d4ed8; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Go to Dashboard
        </a>
      </div>
    `,
    "submissions@ijeeqt.org"
  );
}

/**
 * Notify author of a status update (accepted, rejected, published, etc.)
 */
async function notifyAuthorStatusUpdate(authorEmail, authorName, paperTitle, newStatus) {
  const statusLabels = {
    under_review: "Under Review",
    revision_required: "Revision Required",
    accepted: "Accepted",
    rejected: "Rejected",
    published: "Published",
  };
  const label = statusLabels[newStatus] || newStatus;

  // Extra content for accepted papers — include APC info
  let acceptedPaymentBlock = "";
  if (newStatus === "accepted") {
    const apc = await getApcAmounts();
    acceptedPaymentBlock = `
      <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
        <p style="color: #92400e; font-size: 14px; font-weight: 700; margin: 0 0 8px;">💰 Article Processing Charge (APC)</p>
        <p style="color: #78350f; font-size: 14px; margin: 0 0 4px;">
          To proceed with publication, please pay the APC of <strong>₹${apc.indianAmount.toLocaleString()}</strong> (Indian Authors) / <strong>$${apc.internationalAmount}</strong> (International Authors).
        </p>
        <p style="color: #92400e; font-size: 12px; margin: 0;">
          Payment can be made securely via Razorpay from your Dashboard.
        </p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard"
           style="display: inline-block; background: #f59e0b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px;">
          💳 Pay Now & Proceed
        </a>
      </div>
    `;
  } else {
    acceptedPaymentBlock = `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard"
           style="display: inline-block; background: #1d4ed8; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Open Dashboard
        </a>
      </div>
    `;
  }

  await sendEmail(
    authorEmail,
    `Paper Status Update: ${label}`,
    "📝 Paper Status Update",
    `
      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
        Dear <strong>${authorName}</strong>,
      </p>
      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
        There has been an update regarding your submitted paper:
      </p>
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
        <p style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0 0 8px;">${paperTitle}</p>
        <p style="margin: 0; font-size: 14px; font-weight: 700;">New Status: <span style="color: #1d4ed8;">${label}</span></p>
      </div>
      ${newStatus === "accepted" ? `
      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
        🎉 <strong>Congratulations!</strong> Your paper has been accepted for publication in ${JOURNAL_NAME}.
      </p>
      ` : `
      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
        Please log in to your Author Dashboard for more details.
      </p>
      `}
      ${acceptedPaymentBlock}
    `,
    "submissions@ijeeqt.org"
  );
}

module.exports = {
  sendEmail,
  sendViaBrevo,
  notifyReviewerAssigned,
  notifyAdminAssignmentResponse,
  notifyAdminReviewSubmitted,
  notifyAuthorSubmissionReceived,
  notifyAuthorStatusUpdate,
};
