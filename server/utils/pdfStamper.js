const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

/**
 * Stamps a PDF buffer with a header and footer.
 * Supports a custom drag-and-drop layout (array of elements with absolute positions).
 *
 * Layout element types:
 *   - { type: "logo",  id, x, y, scale }
 *   - { type: "text",  id, x, y, fontSize, bold, text }
 *   - { type: "line",  id, x1, x2, y, thickness }
 *
 * Text elements support placeholders: {volume}, {issue}, {year}, {doi}
 *
 * @param {Buffer} pdfBuffer - The original PDF buffer.
 * @param {Object} options - Formatting options
 * @param {string} options.journalName - The journal name for fallback header.
 * @param {string} options.volume - Volume string.
 * @param {string} options.issue - Issue string.
 * @param {string} options.year - Year string.
 * @param {string} options.doi - DOI string.
 * @param {Array}  options.headerLayout - Optional layout array from the drag-and-drop editor.
 * @returns {Promise<Buffer>} - The stamped PDF as a buffer.
 */
async function stampPdf(pdfBuffer, options = {}) {
  const {
    journalName = "International Journal of Engineering Education and Quality Technologies (IJEEQT)",
    volume = "",
    issue = "",
    year = "",
    doi = "",
    headerLayout = null,
  } = options;

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  // Load logo once – reused across pages
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

  // Helper: replace placeholders in text
  const substitutePlaceholders = (text) => {
    return text
      .replace(/\{volume\}/gi, volume)
      .replace(/\{issue\}/gi, issue)
      .replace(/\{year\}/gi, year)
      .replace(/\{doi\}/gi, doi);
  };

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    if (headerLayout && Array.isArray(headerLayout) && headerLayout.length > 0) {
      // ─── Custom drag-and-drop layout ───────────────────────────────────
      // Canvas coordinates are top-left origin (like CSS).
      // PDF coordinates are bottom-left origin.
      // Conversion: pdfY = pageHeight - canvasY

      // First pass: draw white clearing rectangles behind each element
      headerLayout.forEach((el) => {
        const pdfY = height - (el.y || 0);

        if (el.type === "logo" && logoImage) {
          const scale = el.scale || 0.03;
          const dims = logoImage.scale(scale);
          // Clear area behind logo
          page.drawRectangle({
            x: (el.x || 0) - 2,
            y: pdfY - dims.height - 2,
            width: dims.width + 4,
            height: dims.height + 4,
            color: rgb(1, 1, 1),
          });
        } else if (el.type === "text" && el.text) {
          const size = el.fontSize || 8;
          const resolvedText = substitutePlaceholders(el.text);
          const useBold = el.bold || false;
          const textFont = useBold ? fontBold : font;
          const textWidth = textFont.widthOfTextAtSize(resolvedText, size);
          // Clear area behind text
          page.drawRectangle({
            x: (el.x || 0) - 2,
            y: pdfY - size - 2,
            width: textWidth + 4,
            height: size + 6,
            color: rgb(1, 1, 1),
          });
        } else if (el.type === "line") {
          const x1 = el.x1 || 40;
          const x2 = el.x2 || (width - 40);
          const thickness = el.thickness || 0.5;
          // Clear area behind line
          page.drawRectangle({
            x: x1 - 1,
            y: pdfY - thickness - 2,
            width: (x2 - x1) + 2,
            height: thickness + 4,
            color: rgb(1, 1, 1),
          });
        }
      });

      // Second pass: draw the actual elements
      headerLayout.forEach((el) => {
        const pdfY = height - (el.y || 0);

        if (el.type === "logo" && logoImage) {
          const scale = el.scale || 0.03;
          const dims = logoImage.scale(scale);
          page.drawImage(logoImage, {
            x: el.x || 0,
            y: pdfY - dims.height,
            width: dims.width,
            height: dims.height,
          });
        } else if (el.type === "text" && el.text) {
          const size = el.fontSize || 8;
          const resolvedText = substitutePlaceholders(el.text);
          const useBold = el.bold || false;
          page.drawText(resolvedText, {
            x: el.x || 0,
            y: pdfY - size, // baseline sits below the top coordinate
            size,
            font: useBold ? fontBold : font,
            color: rgb(0.1, 0.1, 0.4),
          });
        } else if (el.type === "line") {
          const x1 = el.x1 || 40;
          const x2 = el.x2 || (width - 40);
          const thickness = el.thickness || 0.5;
          page.drawLine({
            start: { x: x1, y: pdfY },
            end: { x: x2, y: pdfY },
            thickness,
            color: rgb(0.8, 0.8, 0.8),
          });
        }
      });
    } else {
      // ─── Fallback: fixed layout (no custom layout saved) ─────────────
      const headerFontSize = 8;
      const padding = 4;

      let logoDims = null;
      if (logoImage) {
        logoDims = logoImage.scale(0.03);
      }

      const headerContentHeight = logoDims
        ? Math.max(logoDims.height, headerFontSize)
        : headerFontSize;
      const headerY = height - padding - headerContentHeight;

      // Clear header area
      const clearHeaderTop = headerY + headerContentHeight + padding;
      const clearHeaderBottom = headerY - padding;
      const clearHeaderHeight = clearHeaderTop - clearHeaderBottom;
      page.drawRectangle({
        x: 0,
        y: clearHeaderBottom,
        width,
        height: clearHeaderHeight,
        color: rgb(1, 1, 1),
      });

      // Draw logo
      let textStartX = 40;
      if (logoImage && logoDims) {
        const logoY = headerY + headerFontSize / 2 - logoDims.height / 2;
        page.drawImage(logoImage, {
          x: 40,
          y: logoY,
          width: logoDims.width,
          height: logoDims.height,
        });
        textStartX = 40 + logoDims.width + 6;
      }

      // Draw journal name
      const headerTextWidth = fontBold.widthOfTextAtSize(journalName, headerFontSize);
      const headerTextX = logoImage ? textStartX : (width - headerTextWidth) / 2;
      page.drawText(journalName, {
        x: headerTextX,
        y: headerY,
        size: headerFontSize,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.4),
      });

      // Header separator line
      const headerLineY = clearHeaderBottom;
      page.drawLine({
        start: { x: 40, y: headerLineY },
        end: { x: width - 40, y: headerLineY },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      // ── Footer (fallback) ──
      const footerFontSize = 9;
      const footerTextLeft = `Vol. ${volume}, Issue ${issue}, ${year}`;
      const footerTextRight = `DOI: ${doi}`;
      const rightTextWidth = font.widthOfTextAtSize(footerTextRight, footerFontSize);
      const footerY = 10;
      const footerLineY = footerY + footerFontSize + padding;
      const clearFooterHeight = footerLineY + 2 + padding;

      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height: clearFooterHeight,
        color: rgb(1, 1, 1),
      });
      page.drawLine({
        start: { x: 40, y: footerLineY },
        end: { x: width - 40, y: footerLineY },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      page.drawText(footerTextLeft, {
        x: 40,
        y: footerY,
        size: footerFontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawText(footerTextRight, {
        x: width - 40 - rightTextWidth,
        y: footerY,
        size: footerFontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = { stampPdf };
