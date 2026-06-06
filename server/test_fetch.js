require('dotenv').config();
const cloudinary = require('./config/cloudinary');
const fs = require('fs');

async function test() {
  const publicId = 'papers/73a3efa6-e629-408d-848d-278cc709034a.pdf';
  // Download using zip trick first to get a PDF buffer
  const AdmZip = require('adm-zip');
  const zipUrl = cloudinary.utils.download_zip_url({ public_ids: [publicId], resource_type: "raw" });
  const resZip = await fetch(zipUrl);
  const bufZip = Buffer.from(await resZip.arrayBuffer());
  const zip = new AdmZip(bufZip);
  const pdfBuf = zip.getEntries()[0].getData();
  
  // Write to temp file
  fs.writeFileSync('temp.pdf', pdfBuf);
  
  // Upload as image
  const uploadRes = await cloudinary.uploader.upload('temp.pdf', {
    resource_type: 'image',
    public_id: 'temp_pdf_as_image'
  });
  
  console.log('Uploaded URL:', uploadRes.secure_url);
  
  // Fetch it
  const res = await fetch(uploadRes.secure_url);
  console.log('Status:', res.status, res.statusText);
}
test();
