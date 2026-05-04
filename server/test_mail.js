require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.sendMail({
  from: '"IJEEQT" <reviews@ijeeqt.org>',
  to: process.env.SMTP_USER,
  subject: 'Test Email',
  text: 'This is a test to verify alias sending.',
})
.then(info => console.log('Success:', info.messageId))
.catch(err => console.error('SMTP Error:', err.message));
