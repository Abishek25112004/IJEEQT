// src/components/common/index.js
// Reusable UI primitives used across all pages

import React from "react";
import { formatDate, formatDateTime } from "../../utils/dateUtils";

// ─── PDF download helper (uses backend proxy to bypass Cloudinary CORS) ──────
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function downloadPaperPdf(paper) {
  try {
    const { auth } = await import("../../services/firebase");
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();
      window.location.href = `${API_URL}/papers/${paper.id}/download?token=${token}`;
    } else {
      window.location.href = `${API_URL}/papers/${paper.id}/download-public`;
    }
  } catch (err) {
    if (paper.fileUrl) {
      window.open(paper.fileUrl, "_blank");
    }
  }
}

// ─── Highlight Text ─────────────────────────────────────────────────────────────
export const HighlightText = ({ text, highlight }) => {
  if (!highlight || !highlight.trim() || !text) {
    return <>{text}</>;
  }
  
  const tokens = highlight.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return <>{text}</>;

  const escapedTokens = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
  const parts = text.toString().split(regex);

  return (
    <>
      {parts.map((part, i) =>
        escapedTokens.some(t => new RegExp(`^${t}$`, 'i').test(part)) ? (
          <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

// ─── Page Hero Banner ──────────────────────────────────────────────────────────
export const PageHero = ({ title, subtitle, breadcrumb }) => (
  <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-10 px-4">
    <div className="max-w-7xl mx-auto">
      {breadcrumb && (
        <p className="text-blue-200 text-sm mb-2">{breadcrumb}</p>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
      {subtitle && <p className="text-blue-100 mt-2 text-sm max-w-2xl">{subtitle}</p>}
    </div>
  </div>
);

// ─── Status Badge ──────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const styles = {
    submitted: "bg-yellow-100 text-yellow-800",
    under_review: "bg-blue-100 text-blue-800",
    revision_required: "bg-orange-100 text-orange-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    published: "bg-emerald-100 text-emerald-800",
    pending: "bg-gray-100 text-gray-700",
    paid: "bg-green-100 text-green-800",
  };
  const labels = {
    submitted: "Submitted",
    under_review: "Under Review",
    revision_required: "Revision Required",
    accepted: "Accepted",
    rejected: "Rejected",
    published: "Published",
    pending: "Pending",
    paid: "Paid",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {labels[status] || status}
    </span>
  );
};

// ─── Loading Spinner ───────────────────────────────────────────────────────────
export const Spinner = ({ size = "md", center = false }) => {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className={center ? "flex justify-center items-center py-12" : ""}>
      <div className={`${sizes[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
    </div>
  );
};

// ─── Alert Box ─────────────────────────────────────────────────────────────────
export const Alert = ({ type = "info", message, onClose }) => {
  const styles = {
    info: "bg-blue-50 border-blue-400 text-blue-800",
    success: "bg-green-50 border-green-400 text-green-800",
    error: "bg-red-50 border-red-400 text-red-800",
    warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
  };
  return (
    <div className={`border-l-4 p-4 rounded-r flex justify-between items-start ${styles[type]}`}>
      <p className="text-sm">{message}</p>
      {onClose && (
        <button onClick={onClose} className="ml-4 text-current opacity-60 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  );
};

// ─── Card ──────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = "", hover = false }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${hover ? "hover:shadow-md transition-shadow cursor-pointer" : ""} ${className}`}>
    {children}
  </div>
);

// ─── Section Title ─────────────────────────────────────────────────────────────
export const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-gray-900 border-l-4 border-blue-700 pl-3">{title}</h2>
    {subtitle && <p className="text-gray-500 text-sm mt-1 pl-4">{subtitle}</p>}
  </div>
);

// ─── Cite Modal ─────────────────────────────────────────────────────────────────
export const CiteModal = ({ paper, onClose }) => {
  const [activeTab, setActiveTab] = React.useState("plain");
  const [copied, setCopied] = React.useState(false);
  const [includeAbstract, setIncludeAbstract] = React.useState(false);

  const getCitations = (p, inclAbs) => {
    const authorName = p.authorName || "Author";
    const title = p.title || "Paper Title";
    const year = p.year || (p.submittedAt ? new Date(p.submittedAt).getFullYear() : new Date().getFullYear());
    const volume = p.volume || "1";
    const issue = p.issue || "1";
    const doi = p.doi || "";
    const journalName = process.env.REACT_APP_JOURNAL_NAME || "International Journal of Engineering Excellence in Quantum Technology";
    
    let plain = `${authorName}, "${title}," in ${journalName}, vol. ${volume}, no. ${issue}, ${year}.${doi ? ` doi: ${doi}.` : ''}`;
    if (inclAbs && p.abstract) plain += `\n\nAbstract: ${p.abstract}`;
    
    let bibtex = `@article{${p.id ? p.id.substring(0,8) : 'paper'},
  author={${authorName}},
  journal={${journalName}},
  title={${title}},
  year={${year}},
  volume={${volume}},
  number={${issue}},${doi ? `\n  doi={${doi}},` : ''}${inclAbs && p.abstract ? `\n  abstract={${p.abstract}}` : ''}
}`;

    let ris = `TY  - JOUR
AU  - ${authorName}
TI  - ${title}
JO  - ${journalName}
VL  - ${volume}
IS  - ${issue}
PY  - ${year}${doi ? `\nDO  - ${doi}` : ''}${inclAbs && p.abstract ? `\nAB  - ${p.abstract}` : ''}
ER  - `;

    let refworks = `RT Journal Article
A1 ${authorName}
T1 ${title}
JF ${journalName}
YR ${year}
VO ${volume}
IS ${issue}${doi ? `\nDO ${doi}` : ''}${inclAbs && p.abstract ? `\nAB ${p.abstract}` : ''}`;

    return { plain, bibtex, ris, refworks };
  };

  const citations = getCitations(paper, includeAbstract);

  const handleCopy = () => {
    navigator.clipboard.writeText(citations[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackdropClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={handleContentClick}>
        <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-sm font-bold text-gray-800">Cite This</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl font-bold leading-none">&times;</button>
        </div>
        
        <div className="flex border-b overflow-x-auto no-scrollbar">
          {[
            { id: "plain", label: "Plain Text" },
            { id: "bibtex", label: "BibTeX" },
            { id: "ris", label: "RIS" },
            { id: "refworks", label: "Refworks" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[100px] py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-700 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="bg-gray-50 p-4 rounded border text-sm text-gray-700 whitespace-pre-wrap font-mono min-h-[150px]">
            {citations[activeTab]}
          </div>
        </div>
        
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center flex-wrap gap-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={includeAbstract}
              onChange={(e) => setIncludeAbstract(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Citation & Abstract</span>
          </label>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-sm bg-white border border-gray-300 shadow-sm px-4 py-1.5 rounded hover:bg-gray-50 transition-colors text-blue-700 font-medium"
          >
            {copied ? (
              <span className="text-green-600">✓ Copied</span>
            ) : (
              <>
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Paper Card ────────────────────────────────────────────────────────────────
export const PaperCard = ({ paper, showStatus = false, searchTerm = "" }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [citeModalOpen, setCiteModalOpen] = React.useState(false);

  return (
    <>
      <Card className="p-4 relative" hover>
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug hover:text-blue-700 transition-colors">
              <HighlightText text={paper.title} highlight={searchTerm} />
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              <HighlightText text={paper.authorName} highlight={searchTerm} />
            </p>
            {paper.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {paper.keywords.slice(0, 5).map((kw, i) => (
                  <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                    <HighlightText text={kw} highlight={searchTerm} />
                  </span>
                ))}
              </div>
            )}
          </div>
          {showStatus && (
            <div className="shrink-0">
              <StatusBadge status={paper.status} />
            </div>
          )}
        </div>
        {paper.abstract && (
          <div className="mt-3">
            <p className={`text-xs text-gray-600 leading-relaxed text-justify ${expanded ? "" : "line-clamp-3"}`}>
              <HighlightText text={paper.abstract} highlight={searchTerm} />
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 hover:underline"
            >
              {expanded ? "Hide ▲" : "View ▼"}
            </button>
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {paper.submittedAt ? formatDate(paper.submittedAt) : ""}
            {paper.volume && ` · Vol. ${paper.volume}, Issue ${paper.issue}`}
          </span>
          <div className="flex gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCiteModalOpen(true);
              }}
              className="text-xs text-blue-700 font-medium hover:underline flex items-center gap-1"
            >
              ❝ Cite This
            </button>
            {paper.fileUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadPaperPdf(paper);
                }}
                className="text-xs text-blue-700 font-medium hover:underline flex items-center gap-1"
              >
                📄 Download PDF
              </button>
            )}
          </div>
        </div>
      </Card>
      
      {citeModalOpen && (
        <CiteModal paper={paper} onClose={() => setCiteModalOpen(false)} />
      )}
    </>
  );
};

// ─── Empty State ────────────────────────────────────────────────────────────────
export const EmptyState = ({ title, message, action }) => (
  <div className="text-center py-16 text-gray-500">
    <div className="text-5xl mb-4">📭</div>
    <h3 className="font-semibold text-gray-700 text-lg mb-2">{title}</h3>
    <p className="text-sm max-w-sm mx-auto">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ─── Protected Route ──────────────────────────────────────────────────────────
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <Spinner center />;
  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    // Support both new roles[] array and legacy role string
    const userRoles = Array.isArray(profile?.roles) && profile.roles.length > 0
      ? profile.roles
      : [profile?.role || "author"];
    const hasAccess = userRoles.some((r) => allowed.includes(r));
    if (!hasAccess) return <Navigate to="/" replace />;
  }

  return children;
};
