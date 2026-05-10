const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

/**
 * Stamps a PDF buffer with a header and footer.
 * 
 * @param {Buffer} pdfBuffer - The original PDF buffer.
 * @param {Object} options - Formatting options
 * @param {string} options.journalName - The name of the journal to put in header.
 * @param {string} options.volume - The volume string.
 * @param {string} options.issue - The issue string.
 * @param {string} options.year - The year string.
 * @param {string} options.doi - The DOI string.
 * @param {number} options.topMarginOffset - Additional top margin in points (default: 0).
 * @param {number} options.bottomMarginOffset - Additional bottom margin in points (default: 0).
 * @returns {Promise<Buffer>} - The stamped PDF as a buffer.
 */
async function stampPdf(pdfBuffer, options = {}) {
  const {
    journalName = "International Journal of Engineering Education and Quality Technologies (IJEEQT)",
    volume = "",
    issue = "",
    year = "",
    doi = "",
    topMarginOffset = 0,
    bottomMarginOffset = 0,
  } = options;

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  // Fetch logo bytes for embedding
  let logoImage;
  try {
    const logoUrl = "https://res.cloudinary.com/ddiv16uib/image/upload/v1778417116/assets/journal_logo.png";
    const logoResponse = await fetch(logoUrl);
    const logoBytes = await logoResponse.arrayBuffer();
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch (e) {
    console.warn("Failed to fetch or embed logo for PDF stamping:", e.message);
  }

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    
    // Header setup
    const headerFontSize = 10;
    const headerY = height - 35 + topMarginOffset;

    // Draw Logo if available
    if (logoImage) {
      const logoDims = logoImage.scale(0.04); // Significantly smaller scale
      page.drawImage(logoImage, {
        x: 40,
        y: headerY - 5,
        width: logoDims.width,
        height: logoDims.height,
      });
    }

    const headerText = journalName;
    const headerTextWidth = fontBold.widthOfTextAtSize(headerText, headerFontSize);

    // Draw Header (Right-aligned or offset from logo)
    page.drawText(headerText, {
      x: logoImage ? 110 : (width - headerTextWidth) / 2, // Start after logo if exists
      y: headerY,
      size: headerFontSize,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.4), // Dark blueish
    });

    // Draw Header line separator
    page.drawLine({
      start: { x: 40, y: headerY - 10 },
      end: { x: width - 40, y: headerY - 10 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Footer setup
    const footerTextLeft = `Vol. ${volume}, Issue ${issue}, ${year}`;
    const footerTextRight = `DOI: ${doi}`;
    const footerFontSize = 9;
    const footerY = 20 + bottomMarginOffset;
    const rightTextWidth = font.widthOfTextAtSize(footerTextRight, footerFontSize);

    // Draw Footer line separator
    page.drawLine({
      start: { x: 40, y: footerY + 15 },
      end: { x: width - 40, y: footerY + 15 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Draw Footer Text
    page.drawText(footerTextLeft, {
      x: 40,
      y: footerY,
      size: footerFontSize,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(footerTextRight, {
      x: width - 40 - rightTextWidth,
      y: footerY,
      size: footerFontSize,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = { stampPdf };
