require('dotenv').config();
const { notifyAdminAssignmentResponse } = require('./utils/mailer');

async function test() {
  console.log("Sending test email...");
  await notifyAdminAssignmentResponse(
    "abisheksecondary2@gmail.com", // recipient
    "Test Reviewer",
    "Test Paper Title",
    "accepted"
  );
  console.log("Done");
}

test();
