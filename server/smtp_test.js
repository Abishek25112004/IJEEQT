require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('Testing SMTP connection...');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ SMTP Error:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  } else {
    console.log('✅ SMTP connection verified! Emails will be delivered.');
    process.exit(0);
  }
});
