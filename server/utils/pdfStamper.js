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
    const headerFontSize = 8; // Smaller font
    const headerY = height - 15 + topMarginOffset; 

    // CLEAR the area first to prevent "overwriting" if already stamped
    // Reduced to 20pt to avoid covering the paper's main title
    page.drawRectangle({
      x: 0,
      y: height - 20,
      width: width,
      height: 20,
      color: rgb(1, 1, 1), // Pure white
    });
    // Clear footer area too
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: 20,
      color: rgb(1, 1, 1), // Pure white
    });

    // Draw Logo if available
    if (logoImage) {
      const logoDims = logoImage.scale(0.03); // Slightly smaller
      page.drawImage(logoImage, {
        x: 40,
        y: headerY - 1, // Align with text baseline more accurately
        width: logoDims.width,
        height: logoDims.height,
      });
    }

    const headerText = journalName;
    const headerTextWidth = fontBold.widthOfTextAtSize(headerText, headerFontSize);

    // Draw Header (Right-aligned or offset from logo)
    page.drawText(headerText, {
      x: logoImage ? 100 : (width - headerTextWidth) / 2, 
      size: headerFontSize,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.4), 
      y: headerY,
    });

    // Draw Header line separator - REDUCED THICKNESS AND MOVED UP
    page.drawLine({
      start: { x: 40, y: headerY - 5 },
      end: { x: width - 40, y: headerY - 5 },
      thickness: 0.3,
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
