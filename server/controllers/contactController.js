const { sendEmail } = require("../utils/mailer");

const submitContactForm = async (req, res) => {
  const { name, email, subject, message, isSubmission, paperId } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (isSubmission && !paperId) {
    return res.status(400).json({ error: "Paper ID is required for submission queries" });
  }

  const targetEmail = isSubmission ? "supports@ijeeqt.org" : "supports@ijeeqt.org"; // Assuming all go to supports@ijeeqt.org based on request, or modify if needed. The request said "also the message sent from this section should be recieved to supports@ijeeqt.org".

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #1d4ed8; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">New Contact Form Message</h2>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0;"><strong>From Name:</strong> ${name}</p>
        <p style="margin: 0 0 10px 0;"><strong>From Email:</strong> ${email}</p>
        <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
        ${isSubmission ? `<p style="margin: 0 0 10px 0; color: #b91c1c;"><strong>Paper ID:</strong> ${paperId}</p>` : ""}
      </div>

      <h3 style="color: #4b5563; margin-bottom: 10px;">Message:</h3>
      <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; white-space: pre-wrap; line-height: 1.6;">
        ${message}
      </div>
    </div>
  `;

  try {
    await sendEmail(
      targetEmail,
      `[Contact Form] ${subject}${isSubmission ? ` (Paper ID: ${paperId})` : ""}`,
      "New Contact Form Submission",
      emailHtml,
      "supports@ijeeqt.org" // From
    );
    res.json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ error: "Failed to send message. Please try again later." });
  }
};

module.exports = { submitContactForm };
