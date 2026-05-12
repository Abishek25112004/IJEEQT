const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

// ── Default layout (used when no custom layout is saved in the database) ─────
// These are the same defaults shown in the drag-and-drop editor canvas.
// Canvas coordinates: top-left origin, Y increases downward.
const DEFAULT_LAYOUT = [
  { id: "logo", type: "logo", x: 40, y: 8, scale: 0.03 },
  { id: "journalName", type: "text", text: "{journalName}", x: 78, y: 14, fontSize: 8, bold: true },
  { id: "headerLine", type: "line", x1: 40, x2: 555, y: 34, thickness: 0.5 },
  { id: "footerLine", type: "line", x1: 40, x2: 555, y: 815, thickness: 0.5 },
  { id: "footerLeft", type: "text", text: "Vol. {volume}, Issue {issue}, {year}", x: 40, y: 828, fontSize: 9, bold: false },
  { id: "footerRight", type: "text", text: "DOI: {doi}", x: 450, y: 828, fontSize: 9, bold: false },
];

/**
 * Stamps a PDF buffer with header and footer using the drag-and-drop layout.
 *
 * Strategy: creates a brand-new PDF, embeds each original page fully,
 * then draws branding elements on top at the exact positions from the layout.
 *
 * @param {Buffer} pdfBuffer - The original PDF buffer.
 * @param {Object} options
 * @param {string} options.journalName
 * @param {string} options.volume
 * @param {string} options.issue
 * @param {string} options.year
 * @param {string} options.doi
 * @param {Array}  options.headerLayout - Layout from the drag-and-drop editor (or null for defaults).
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

  // Use saved layout or fall back to built-in defaults
  const layout = (headerLayout && Array.isArray(headerLayout) && headerLayout.length > 0)
    ? headerLayout
    : DEFAULT_LAYOUT;

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

  // ── Helper: replace all placeholders ───────────────────────────────────────
  const sub = (text) =>
    text
      .replace(/\{journalName\}/gi, journalName)
      .replace(/\{volume\}/gi, volume)
      .replace(/\{issue\}/gi, issue)
      .replace(/\{year\}/gi, year)
      .replace(/\{doi\}/gi, doi);

  // ── Process each page ──────────────────────────────────────────────────────
  for (let i = 0; i < srcPages.length; i++) {
    const srcPage = srcPages[i];
    const { width: srcW, height: srcH } = srcPage.getSize();

    // Embed the full original page — no clipping, no white rectangles
    const embeddedPage = await outDoc.embedPage(srcPage);

    // Create a new page with the same dimensions
    const newPage = outDoc.addPage([srcW, srcH]);

    // Draw the full original content as-is
    newPage.drawPage(embeddedPage, { x: 0, y: 0 });

    // ── Draw layout elements on top ──────────────────────────────────────
    layout.forEach((el) => {
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
  }

  const pdfBytes = await outDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = { stampPdf };
