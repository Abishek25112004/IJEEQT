// src/components/common/index.js
// Reusable UI primitives used across all pages

import React from "react";

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

// ─── Paper Card ────────────────────────────────────────────────────────────────
export const PaperCard = ({ paper, showStatus = false }) => (
  <Card className="p-4" hover>
    <div className="flex justify-between items-start gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug hover:text-blue-700 transition-colors">
          {paper.title}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {paper.authorName}
          {paper.institution && ` — ${paper.institution}`}
        </p>
        {paper.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {paper.keywords.slice(0, 5).map((kw, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{kw}</span>
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
      <p className="text-xs text-gray-600 mt-3 leading-relaxed line-clamp-3">{paper.abstract}</p>
    )}
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
      <span className="text-xs text-gray-400">
        {paper.submittedAt ? new Date(paper.submittedAt).toLocaleDateString() : ""}
        {paper.volume && ` · Vol. ${paper.volume}, Issue ${paper.issue}`}
      </span>
      {paper.fileUrl && (
        <a
          href={paper.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          📄 PDF
        </a>
      )}
    </div>
  </Card>
);

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
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(profile?.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};
