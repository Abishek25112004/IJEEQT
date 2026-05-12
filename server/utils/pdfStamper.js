const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

/**
 * Stamps a PDF buffer with a header and footer using the "fresh page" strategy:
 *   1. Creates a brand-new PDF document
 *   2. Embeds each original page as a clipped content block (header/footer zones excluded)
 *   3. Draws header and footer elements into the clean margin areas
 *
 * This approach guarantees zero overlap between branding and paper content.
 *
 * @param {Buffer} pdfBuffer - The original PDF buffer.
 * @param {Object} options
 * @param {string} options.journalName - Journal name (fallback header).
 * @param {string} options.volume
 * @param {string} options.issue
 * @param {string} options.year
 * @param {string} options.doi
 * @param {Array}  options.headerLayout - Optional layout from the drag-and-drop editor.
 * @returns {Promise<Buffer>}
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

  // ── Load original PDF ──────────────────────────────────────────────────────
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const srcPages = srcDoc.getPages();

  // ── Create a brand-new output PDF ──────────────────────────────────────────
  const outDoc = await PDFDocument.create();
  const font = await outDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await outDoc.embedFont(StandardFonts.HelveticaBold);

  // ── Load logo ──────────────────────────────────────────────────────────────
  let logoImage = null;
  try {
    const logoUrl =
      "https://res.cloudinary.com/ddiv16uib/image/upload/v1778417116/assets/journal_logo.png";
    const logoResponse = await fetch(logoUrl);
    const logoBytes = await logoResponse.arrayBuffer();
    logoImage = await outDoc.embedPng(logoBytes);
  } catch (e) {
    console.warn("Failed to fetch or embed logo for PDF stamping:", e.message);
  }

  // ── Helper: replace placeholders ───────────────────────────────────────────
  const sub = (text) =>
    text
      .replace(/\{volume\}/gi, volume)
      .replace(/\{issue\}/gi, issue)
      .replace(/\{year\}/gi, year)
      .replace(/\{doi\}/gi, doi);

  // ── Determine header/footer zone heights ───────────────────────────────────
  // Canvas coordinates: Y=0 is top, Y=842 is bottom (A4).
  // We split into header zone (top) and footer zone (bottom).
  let headerZoneH = 40; // default header zone in PDF points
  let footerZoneH = 30; // default footer zone in PDF points

  if (headerLayout && Array.isArray(headerLayout) && headerLayout.length > 0) {
    // Header elements: canvas Y < 400 (top half)
    const headerEls = headerLayout.filter((el) => (el.y || 0) < 400);
    const footerEls = headerLayout.filter((el) => (el.y || 0) >= 400);

    if (headerEls.length > 0) {
      // Header zone = max canvas-Y of any header element + padding
      const maxHeaderCanvasY = Math.max(...headerEls.map((el) => {
        if (el.type === "logo") return (el.y || 0) + 40; // logo height approx
        if (el.type === "text") return (el.y || 0) + (el.fontSize || 8) + 4;
        return (el.y || 0) + 4;
      }));
      headerZoneH = maxHeaderCanvasY + 6; // small extra padding
    }

    if (footerEls.length > 0) {
      // Footer zone = distance from lowest footer element to page bottom
      const minFooterCanvasY = Math.min(...footerEls.map((el) => el.y || 842));
      footerZoneH = 842 - minFooterCanvasY + 20; // 20pt padding below
    }
  }

  // ── Process each page ──────────────────────────────────────────────────────
  for (let i = 0; i < srcPages.length; i++) {
    const srcPage = srcPages[i];
    const { width: srcW, height: srcH } = srcPage.getSize();

    // Embed the original page into the output doc, clipping the header and footer
    // PDF coordinates: bottom-left origin. We clip by excluding top and bottom zones.
    const embeddedPage = await outDoc.embedPage(srcPage, {
      left: 0,
      bottom: footerZoneH,       // clip out footer zone
      right: srcW,
      top: srcH - headerZoneH,   // clip out header zone
    });

    // Create a new page with the same dimensions as the original
    const newPage = outDoc.addPage([srcW, srcH]);

    // Fill page white first (clean slate)
    newPage.drawRectangle({
      x: 0, y: 0,
      width: srcW, height: srcH,
      color: rgb(1, 1, 1),
    });

    // Draw the clipped original content in the content zone
    // The embedded page is positioned so its bottom edge starts at the footer zone top
    newPage.drawPage(embeddedPage, {
      x: 0,
      y: footerZoneH,
    });

    // ── Draw header & footer ─────────────────────────────────────────────
    if (headerLayout && Array.isArray(headerLayout) && headerLayout.length > 0) {
      // Custom layout
      headerLayout.forEach((el) => {
        // Convert canvas Y (top-origin) to PDF Y (bottom-origin)
        const pdfY = srcH - (el.y || 0);

        if (el.type === "logo" && logoImage) {
          const scale = el.scale || 0.03;
          const dims = logoImage.scale(scale);
          newPage.drawImage(logoImage, {
            x: el.x || 0,
            y: pdfY - dims.height,
            width: dims.width,
            height: dims.height,
          });
        } else if (el.type === "text" && el.text) {
          const size = el.fontSize || 8;
          const resolvedText = sub(el.text);
          const useBold = el.bold || false;
          newPage.drawText(resolvedText, {
            x: el.x || 0,
            y: pdfY - size,
            size,
            font: useBold ? fontBold : font,
            color: rgb(0.1, 0.1, 0.4),
          });
        } else if (el.type === "line") {
          const x1 = el.x1 || 40;
          const x2 = el.x2 || srcW - 40;
          const thickness = el.thickness || 0.5;
          newPage.drawLine({
            start: { x: x1, y: pdfY },
            end: { x: x2, y: pdfY },
            thickness,
            color: rgb(0.8, 0.8, 0.8),
          });
        }
      });
    } else {
      // ── Fallback fixed layout ──────────────────────────────────────────
      const headerFontSize = 8;
      const padding = 4;

      let logoDims = null;
      if (logoImage) logoDims = logoImage.scale(0.03);

      const headerContentH = logoDims
        ? Math.max(logoDims.height, headerFontSize)
        : headerFontSize;
      const headerY = srcH - padding - headerContentH;

      // Logo
      let textStartX = 40;
      if (logoImage && logoDims) {
        const logoY = headerY + headerFontSize / 2 - logoDims.height / 2;
        newPage.drawImage(logoImage, {
          x: 40, y: logoY,
          width: logoDims.width, height: logoDims.height,
        });
        textStartX = 40 + logoDims.width + 6;
      }

      // Journal name
      const headerTextW = fontBold.widthOfTextAtSize(journalName, headerFontSize);
      const headerTextX = logoImage ? textStartX : (srcW - headerTextW) / 2;
      newPage.drawText(journalName, {
        x: headerTextX, y: headerY,
        size: headerFontSize,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.4),
      });

      // Header line
      const headerLineY = headerY - padding;
      newPage.drawLine({
        start: { x: 40, y: headerLineY },
        end: { x: srcW - 40, y: headerLineY },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });

      // ── Footer ──
      const footerFontSize = 9;
      const footerTextLeft = `Vol. ${volume}, Issue ${issue}, ${year}`;
      const footerTextRight = `DOI: ${doi}`;
      const rightTextW = font.widthOfTextAtSize(footerTextRight, footerFontSize);
      const footerY = 10;
      const footerLineY = footerY + footerFontSize + padding;

      newPage.drawLine({
        start: { x: 40, y: footerLineY },
        end: { x: srcW - 40, y: footerLineY },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      newPage.drawText(footerTextLeft, {
        x: 40, y: footerY,
        size: footerFontSize, font,
        color: rgb(0.3, 0.3, 0.3),
      });
      newPage.drawText(footerTextRight, {
        x: srcW - 40 - rightTextW, y: footerY,
        size: footerFontSize, font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
  }

  const pdfBytes = await outDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = { stampPdf };
