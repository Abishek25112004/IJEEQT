require('dotenv').config();
const cloudinary = require('./config/cloudinary');
const path = require('path');

async function uploadLogo() {
  try {
    const logoPath = path.join(__dirname, '../client/public/assets/logo.png');
    const result = await cloudinary.uploader.upload(logoPath, {
      folder: 'assets',
      public_id: 'journal_logo',
      overwrite: true,
      resource_type: 'image',
      format: 'png'
    });
    console.log('Logo uploaded successfully!');
    console.log('URL:', result.secure_url);
    process.exit(0);
  } catch (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  }
}

uploadLogo();
