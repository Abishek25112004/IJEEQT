import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { headerLayoutAPI } from "../../services/api";
import { PageHero, Alert, Spinner } from "../../components/common";

// ─── Constants ────────────────────────────────────────────────────────────────
// A4 at 72 DPI = 595 × 842 pt. We use a scaled canvas for display.
const PDF_WIDTH = 595;
const PDF_HEIGHT = 842;
const CANVAS_SCALE = 0.85; // display scale
const CANVAS_W = Math.round(PDF_WIDTH * CANVAS_SCALE);
const CANVAS_H = Math.round(PDF_HEIGHT * CANVAS_SCALE);

const JOURNAL_NAME = "International Journal of Engineering Education and Quality Technologies (IJEEQT)";

// Default layout elements
const DEFAULT_LAYOUT = [
  { id: "logo", type: "logo", x: 40, y: 8, scale: 0.03, label: "Journal Logo" },
  { id: "journalName", type: "text", text: JOURNAL_NAME, x: 78, y: 14, fontSize: 8, bold: true, label: "Journal Name" },
  { id: "headerLine", type: "line", x1: 40, x2: 555, y: 34, thickness: 0.5, label: "Header Line" },
  { id: "footerLine", type: "line", x1: 40, x2: 555, y: 815, thickness: 0.5, label: "Footer Line" },
  { id: "footerLeft", type: "text", text: "Vol. {volume}, Issue {issue}, {year}", x: 40, y: 828, fontSize: 9, bold: false, label: "Footer Left" },
  { id: "footerRight", type: "text", text: "DOI: {doi}", x: 450, y: 828, fontSize: 9, bold: false, label: "Footer Right" },
];

// Element colors for visual distinction on canvas
const ELEMENT_COLORS = {
  logo: { bg: "rgba(16, 185, 129, 0.12)", border: "#10b981", text: "#065f46" },
  journalName: { bg: "rgba(59, 130, 246, 0.12)", border: "#3b82f6", text: "#1e40af" },
  headerLine: { bg: "rgba(156, 163, 175, 0.15)", border: "#9ca3af", text: "#374151" },
  footerLine: { bg: "rgba(156, 163, 175, 0.15)", border: "#9ca3af", text: "#374151" },
  footerLeft: { bg: "rgba(249, 115, 22, 0.12)", border: "#f97316", text: "#9a3412" },
  footerRight: { bg: "rgba(168, 85, 247, 0.12)", border: "#a855f7", text: "#6b21a8" },
};

// ─── Draggable Element ────────────────────────────────────────────────────────
const DraggableElement = ({ element, isSelected, onSelect, onDrag, canvasScale }) => {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, elX: 0, elY: 0 });

  const colors = ELEMENT_COLORS[element.id] || { bg: "rgba(0,0,0,0.05)", border: "#888", text: "#333" };

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    onSelect(element.id);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: element.x || element.x1 || 0,
      elY: element.y,
    };
  }, [element, onSelect]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const dx = (e.clientX - dragStartRef.current.mouseX) / canvasScale;
      const dy = (e.clientY - dragStartRef.current.mouseY) / canvasScale;
      const newX = Math.max(0, Math.min(PDF_WIDTH - 20, Math.round(dragStartRef.current.elX + dx)));
      const newY = Math.max(0, Math.min(PDF_HEIGHT - 10, Math.round(dragStartRef.current.elY + dy)));
      onDrag(element.id, newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, element.id, onDrag, canvasScale]);

  // Position and size on canvas
  const left = ((element.x || element.x1 || 0) / PDF_WIDTH) * 100;
  const top = ((element.y || 0) / PDF_HEIGHT) * 100;

  // Calculate display dimensions
  let displayW, displayH;
  if (element.type === "line") {
    const lineWidth = (element.x2 || 555) - (element.x1 || 40);
    displayW = (lineWidth / PDF_WIDTH) * 100;
    displayH = "3px";
  } else if (element.type === "logo") {
    displayW = "36px";
    displayH = "36px";
  } else {
    // Text — approximate width
    const approxCharWidth = (element.fontSize || 8) * 0.5;
    const textWidth = Math.min((element.text || "").length * approxCharWidth, PDF_WIDTH - (element.x || 0));
    displayW = (textWidth / PDF_WIDTH) * 100;
    displayH = `${Math.max(16, (element.fontSize || 8) * 1.8)}px`;
  }

  const style = {
    position: "absolute",
    left: `${left}%`,
    top: `${top}%`,
    width: element.type === "line" ? `${displayW}%` : element.type === "logo" ? displayW : `${Math.max(displayW, 5)}%`,
    height: displayH,
    background: colors.bg,
    border: `1.5px ${isSelected ? "solid" : "dashed"} ${colors.border}`,
    borderRadius: element.type === "line" ? "1px" : "4px",
    cursor: isDragging ? "grabbing" : "grab",
    zIndex: isDragging ? 50 : isSelected ? 40 : 10,
    display: "flex",
    alignItems: "center",
    justifyContent: element.type === "logo" ? "center" : "flex-start",
    padding: element.type === "line" ? "0" : "0 4px",
    userSelect: "none",
    transition: isDragging ? "none" : "box-shadow 0.15s ease",
    boxShadow: isSelected ? `0 0 0 2px ${colors.border}40, 0 2px 8px rgba(0,0,0,0.12)` : "none",
    overflow: "hidden",
  };

  return (
    <div
      ref={ref}
      style={style}
      onMouseDown={handleMouseDown}
      title={`${element.label} — Drag to reposition`}
    >
      {element.type === "logo" && (
        <span style={{ fontSize: "18px" }}>🖼️</span>
      )}
      {element.type === "text" && (
        <span style={{
          fontSize: `${Math.max(9, (element.fontSize || 8) * canvasScale)}px`,
          fontWeight: element.bold ? 700 : 400,
          color: colors.text,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: 1,
        }}>
          {element.text}
        </span>
      )}
      {element.type === "line" && (
        <div style={{ width: "100%", height: "1px", background: colors.border }} />
      )}
    </div>
  );
};

// ─── Properties Panel ─────────────────────────────────────────────────────────
const PropertiesPanel = ({ element, onChange }) => {
  if (!element) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        <span className="text-2xl block mb-2">👆</span>
        Click an element on the canvas to edit its properties
      </div>
    );
  }

  const colors = ELEMENT_COLORS[element.id] || { bg: "#f3f4f6", border: "#888", text: "#333" };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ background: colors.border }} />
        <h4 className="font-semibold text-gray-800 text-sm">{element.label}</h4>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{element.type}</span>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        {element.type === "line" ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">X Start</label>
              <input
                type="number" value={element.x1 || 0}
                onChange={e => onChange({ ...element, x1: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">X End</label>
              <input
                type="number" value={element.x2 || 555}
                onChange={e => onChange({ ...element, x2: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">X</label>
            <input
              type="number" value={element.x || 0}
              onChange={e => onChange({ ...element, x: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Y</label>
          <input
            type="number" value={element.y || 0}
            onChange={e => onChange({ ...element, y: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Type-specific properties */}
      {element.type === "text" && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Text Content</label>
            <input
              type="text" value={element.text || ""}
              onChange={e => onChange({ ...element, text: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Use <code className="bg-gray-100 px-1 rounded">{"{volume}"}</code>, <code className="bg-gray-100 px-1 rounded">{"{issue}"}</code>, <code className="bg-gray-100 px-1 rounded">{"{year}"}</code>, <code className="bg-gray-100 px-1 rounded">{"{doi}"}</code> as placeholders
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Font Size (pt)</label>
              <input
                type="number" min={4} max={24} value={element.fontSize || 8}
                onChange={e => onChange({ ...element, fontSize: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer py-1.5">
                <input
                  type="checkbox" checked={!!element.bold}
                  onChange={e => onChange({ ...element, bold: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                Bold
              </label>
            </div>
          </div>
        </>
      )}

      {element.type === "logo" && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Scale</label>
          <input
            type="number" min={0.01} max={0.2} step={0.005} value={element.scale || 0.03}
            onChange={e => onChange({ ...element, scale: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Logo size multiplier (0.03 ≈ 31×31px)</p>
        </div>
      )}

      {element.type === "line" && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Thickness (pt)</label>
          <input
            type="number" min={0.25} max={3} step={0.25} value={element.thickness || 0.5}
            onChange={e => onChange({ ...element, thickness: Number(e.target.value) })}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
        </div>
      )}

      {/* Coordinate hint */}
      <div className="bg-gray-50 rounded-lg p-2.5 mt-2">
        <p className="text-xs text-gray-500">
          📐 Canvas: <strong>{PDF_WIDTH} × {PDF_HEIGHT}</strong> pt (A4 at 72 DPI)
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Top-left is (0, 0). Y increases downward.
        </p>
      </div>
    </div>
  );
};

// ─── Main Editor Component ────────────────────────────────────────────────────
const HeaderFooterLayoutEditor = () => {
  const navigate = useNavigate();
  const [elements, setElements] = useState(DEFAULT_LAYOUT.map(el => ({ ...el })));
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const canvasRef = useRef(null);

  // Load existing layout on mount
  useEffect(() => {
    const loadLayout = async () => {
      try {
        const res = await headerLayoutAPI.getLayout(JOURNAL_NAME);
        if (res.layout && Array.isArray(res.layout) && res.layout.length > 0) {
          // Merge saved positions with default labels/types (in case new elements were added)
          const merged = DEFAULT_LAYOUT.map(def => {
            const saved = res.layout.find(s => s.id === def.id);
            return saved ? { ...def, ...saved, label: def.label } : { ...def };
          });
          setElements(merged);
        }
      } catch (e) {
        // 404 = no layout saved yet, use defaults
        if (!e.message?.includes("404") && !e.message?.includes("not found")) {
          console.warn("Failed to load layout:", e.message);
        }
      } finally {
        setLoading(false);
      }
    };
    loadLayout();
  }, []);

  // Handle drag position updates
  const handleDrag = useCallback((id, newX, newY) => {
    setElements(prev => prev.map(el => {
      if (el.id !== id) return el;
      if (el.type === "line") {
        // Move the line horizontally by adjusting x1, keeping width
        const lineWidth = (el.x2 || 555) - (el.x1 || 40);
        return { ...el, x1: newX, x2: newX + lineWidth, y: newY };
      }
      return { ...el, x: newX, y: newY };
    }));
  }, []);

  // Handle property changes from the panel
  const handlePropertyChange = useCallback((updatedElement) => {
    setElements(prev => prev.map(el => el.id === updatedElement.id ? updatedElement : el));
  }, []);

  // Save layout
  const handleSave = async () => {
    setSaving(true);
    setErr(""); setMsg("");
    try {
      // Strip labels before saving (they're UI-only)
      const layoutToSave = elements.map(({ label, ...rest }) => rest);
      await headerLayoutAPI.saveLayout({ journalName: JOURNAL_NAME, layout: layoutToSave });
      setMsg("Layout saved successfully! It will be used for all future PDF formatting.");
    } catch (e) {
      setErr("Failed to save layout: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setElements(DEFAULT_LAYOUT.map(el => ({ ...el })));
    setSelectedId(null);
    setMsg("Layout reset to defaults. Click Save to persist.");
  };

  const selectedElement = elements.find(el => el.id === selectedId) || null;

  if (loading) {
    return (
      <div>
        <PageHero title="PDF Layout Editor" subtitle="Loading layout..." breadcrumb="Home / Admin / Layout Editor" />
        <div className="flex justify-center py-20"><Spinner center /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHero
        title="PDF Header & Footer Layout"
        subtitle="Drag elements to position them exactly where you want on the PDF. Save to apply globally."
        breadcrumb="Home / Admin / Layout Editor"
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {msg && <Alert type="success" message={msg} onClose={() => setMsg("")} />}
        {err && <Alert type="error" message={err} onClose={() => setErr("")} />}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              ← Back to Admin
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "💾 Save Layout"}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Canvas */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  📄 PDF Page Canvas <span className="text-gray-400 font-normal">({PDF_WIDTH} × {PDF_HEIGHT} pt)</span>
                </h3>
                <div className="flex gap-3">
                  {elements.map(el => {
                    const c = ELEMENT_COLORS[el.id] || { border: "#888" };
                    return (
                      <button
                        key={el.id}
                        onClick={() => setSelectedId(el.id)}
                        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-all ${
                          selectedId === el.id ? "ring-2 ring-offset-1" : "opacity-70 hover:opacity-100"
                        }`}
                        style={{
                          background: ELEMENT_COLORS[el.id]?.bg,
                          borderColor: c.border,
                          color: ELEMENT_COLORS[el.id]?.text,
                          ringColor: c.border,
                        }}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ background: c.border }} />
                        {el.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Canvas area */}
              <div
                ref={canvasRef}
                className="relative mx-auto bg-white border-2 border-gray-300 rounded shadow-inner"
                style={{
                  width: `${CANVAS_W}px`,
                  height: `${CANVAS_H}px`,
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
                  `,
                  backgroundSize: `${CANVAS_W / 20}px ${CANVAS_H / 20}px`,
                }}
                onClick={(e) => {
                  // Deselect if clicking on canvas background
                  if (e.target === canvasRef.current) setSelectedId(null);
                }}
              >
                {/* Page margin guides */}
                <div
                  className="absolute border border-dashed border-blue-200 pointer-events-none"
                  style={{
                    left: `${(40 / PDF_WIDTH) * 100}%`,
                    top: `${(40 / PDF_HEIGHT) * 100}%`,
                    right: `${(40 / PDF_WIDTH) * 100}%`,
                    bottom: `${(40 / PDF_HEIGHT) * 100}%`,
                  }}
                />

                {/* Simulated paper content area */}
                <div
                  className="absolute pointer-events-none flex flex-col items-center justify-start pt-6 px-8"
                  style={{
                    left: `${(72 / PDF_WIDTH) * 100}%`,
                    top: `${(55 / PDF_HEIGHT) * 100}%`,
                    right: `${(72 / PDF_WIDTH) * 100}%`,
                    bottom: `${(80 / PDF_HEIGHT) * 100}%`,
                    opacity: 0.2,
                  }}
                >
                  <div className="w-3/4 h-3 bg-gray-400 rounded mb-3" />
                  <div className="w-1/2 h-2 bg-gray-300 rounded mb-6" />
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-full h-1.5 bg-gray-200 rounded mb-2" />
                  ))}
                </div>

                {/* Draggable Elements */}
                {elements.map(el => (
                  <DraggableElement
                    key={el.id}
                    element={el}
                    isSelected={selectedId === el.id}
                    onSelect={setSelectedId}
                    onDrag={handleDrag}
                    canvasScale={CANVAS_SCALE}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="lg:w-72 xl:w-80">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sticky top-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
                ⚙️ Element Properties
              </h3>
              <PropertiesPanel
                element={selectedElement}
                onChange={handlePropertyChange}
              />
            </div>

            {/* Quick guide */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 mt-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 How it works</h4>
              <ul className="text-xs text-blue-700 space-y-1.5">
                <li>• <strong>Drag</strong> any element on the canvas to reposition</li>
                <li>• <strong>Click</strong> an element to edit its properties</li>
                <li>• Use <strong>placeholders</strong> like {"{volume}"} in text</li>
                <li>• <strong>Save</strong> to apply layout to all future PDFs</li>
                <li>• The layout applies to header <strong>and</strong> footer</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderFooterLayoutEditor;
