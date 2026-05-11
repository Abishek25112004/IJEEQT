const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

/**
 * Stamps a PDF buffer with a header and footer.
 *
 * Strategy for clearing:
 *   Instead of painting a large full-width white rectangle that can hide
 *   paper content, we calculate the exact bounding box of the content we
 *   are about to stamp (logo + text height + small padding) and draw the
 *   white background ONLY behind that area.  The rest of the page — including
 *   the paper title and body — is never touched.
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

  // Fetch logo bytes for embedding once (outside the page loop)
  let logoImage = null;
  try {
    const logoUrl =
      "https://res.cloudinary.com/ddiv16uib/image/upload/v1778417116/assets/journal_logo.png";
    const logoResponse = await fetch(logoUrl);
    const logoBytes = await logoResponse.arrayBuffer();
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch (e) {
    console.warn("Failed to fetch or embed logo for PDF stamping:", e.message);
  }

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    // ─────────────────────────────────────────────
    //  HEADER
    // ─────────────────────────────────────────────
    const headerFontSize = 8;
    const padding = 4; // small breathing room around our stamped content

    // Pre-compute logo dimensions so we can size the clear area correctly
    let logoDims = null;
    if (logoImage) {
      logoDims = logoImage.scale(0.03); // approx 31×31 pt
    }

    // The tallest element in the header row (logo height vs font cap-height)
    const headerContentHeight = logoDims
      ? Math.max(logoDims.height, headerFontSize)
      : headerFontSize;

    // headerY is the baseline of the text (and vertical-center anchor for logo)
    // Position it so the block sits entirely within the top margin
    const headerY = height - padding - headerContentHeight + topMarginOffset;

    // ── Clear ONLY the area our header occupies ──────────────────────────────
    // Top of the block = headerY + headerContentHeight (for the logo top)
    // We add an extra 'padding' above and below for a little whitespace buffer
    const clearHeaderTop = headerY + headerContentHeight + padding;
    const clearHeaderBottom = headerY - padding; // separator line sits just below
    const clearHeaderHeight = clearHeaderTop - clearHeaderBottom;

    page.drawRectangle({
      x: 0,
      y: clearHeaderBottom,
      width: width,
      height: clearHeaderHeight,
      color: rgb(1, 1, 1), // white — only as tall as our own content
    });

    // ── Draw Logo ────────────────────────────────────────────────────────────
    let logoDrawnX = 40;
    let textStartX = 40; // fallback if no logo

    if (logoImage && logoDims) {
      // Vertically center logo with the text baseline
      const logoY =
        headerY + headerFontSize / 2 - logoDims.height / 2;

      page.drawImage(logoImage, {
        x: logoDrawnX,
        y: logoY,
        width: logoDims.width,
        height: logoDims.height,
      });

      // Text starts right after the logo with a small gap
      textStartX = logoDrawnX + logoDims.width + 6;
    }

    // ── Draw Journal Name ────────────────────────────────────────────────────
    const headerTextWidth = fontBold.widthOfTextAtSize(
      journalName,
      headerFontSize
    );
    const headerTextX = logoImage
      ? textStartX
      : (width - headerTextWidth) / 2;

    page.drawText(journalName, {
      x: headerTextX,
      y: headerY,
      size: headerFontSize,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.4),
    });

    // ── Header separator line (just below the cleared block) ─────────────────
    const headerLineY = clearHeaderBottom;
    page.drawLine({
      start: { x: 40, y: headerLineY },
      end: { x: width - 40, y: headerLineY },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    // ─────────────────────────────────────────────
    //  FOOTER
    // ─────────────────────────────────────────────
    const footerFontSize = 9;
    const footerTextLeft = `Vol. ${volume}, Issue ${issue}, ${year}`;
    const footerTextRight = `DOI: ${doi}`;
    const rightTextWidth = font.widthOfTextAtSize(footerTextRight, footerFontSize);

    // footerY is the text baseline
    const footerY = 10 + bottomMarginOffset;

    // Clear ONLY the area occupied by footer text + separator line
    const footerLineY = footerY + footerFontSize + padding;
    const clearFooterHeight = footerLineY + 2 + padding - 0; // from y=0
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: clearFooterHeight,
      color: rgb(1, 1, 1),
    });

    // ── Footer separator line ────────────────────────────────────────────────
    page.drawLine({
      start: { x: 40, y: footerLineY },
      end: { x: width - 40, y: footerLineY },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    // ── Footer Text ──────────────────────────────────────────────────────────
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
