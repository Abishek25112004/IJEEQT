const cloudinary = require('cloudinary').v2;

// Configure Cloudinary using the CLOUDINARY_URL environment variable
// Ensure that CLOUDINARY_URL is present in your .env file
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
  });
  console.log("✅ Cloudinary initialized");
} else {
  console.warn("⚠️ CLOUDINARY_URL missing in .env. File uploads will fail.");
}

module.exports = cloudinary;
