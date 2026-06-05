require('dotenv').config();
const cloudinary = require('./config/cloudinary');

async function testUpload() {
  try {
    console.log("Testing Cloudinary...");
    const result = await cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: "test.txt",
        folder: "papers",
      },
      (error, result) => {
        if (error) console.error("Error:", error);
        else console.log("Success:", result.secure_url);
      }
    );
    result.end(Buffer.from("test file content"));
  } catch (err) {
    console.error("Exception:", err);
  }
}

testUpload();
