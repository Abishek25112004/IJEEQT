require('dotenv').config();
const cloudinary = require('./config/cloudinary');

async function testDownload() {
  try {
    const publicId = "papers/test.txt"; // or a valid PDF ID
    console.log("Generating zip URL for:", publicId);
    const zipUrl = cloudinary.utils.download_zip_url({
      public_ids: [publicId],
      resource_type: "raw",
    });
    console.log("ZIP URL:", zipUrl);
    
    const zipRes = await fetch(zipUrl);
    console.log("Fetch Status:", zipRes.status);
    if (!zipRes.ok) {
      console.error("Failed:", await zipRes.text());
    } else {
      console.log("Success! Fetched", (await zipRes.arrayBuffer()).byteLength, "bytes");
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}
testDownload();
