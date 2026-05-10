require('dotenv').config({ path: '../server/.env' });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_URL.split('@')[1],
  api_key: process.env.CLOUDINARY_URL.split('://')[1].split(':')[0],
  api_secret: process.env.CLOUDINARY_URL.split('://')[1].split(':')[1].split('@')[0]
});

// Helper to extract config from URL if the above regex is too fragile
const cloudConfig = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
if (cloudConfig) {
  cloudinary.config({
    cloud_name: cloudConfig[3],
    api_key: cloudConfig[1],
    api_secret: cloudConfig[2]
  });
}

async function uploadLogo() {
  try {
    const result = await cloudinary.uploader.upload('public/assets/logo.png', {
      folder: 'assets',
      public_id: 'journal_logo',
      overwrite: true,
      resource_type: 'image'
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
