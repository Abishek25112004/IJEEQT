import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";

import { useLocation } from "react-router-dom";
import { adminAPI, papersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { BM25 } from "../../utils/bm25";
import { PageHero, StatusBadge, Spinner, Card, Alert, EmptyState, HighlightText } from "../../components/common";

const ALL_ROLES = ["author", "reviewer", "editor", "manager", "admin"];

// ─── Multi-Role Checkbox Dropdown ─────────────────────────────────────────────
const RoleMultiSelect = ({ userRoles, uid, onSave, disabled }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(userRoles || ["author"]);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (role) => {
    setSelected((prev) =>
      prev.includes(role)
        ? prev.length > 1 ? prev.filter((r) => r !== role) : prev // must keep ≥1 role
        : [...prev, role]
    );
  };

  const handleSave = () => {
    onSave(uid, selected);
    setOpen(false);
  };

  const roleColors = {
    admin: "bg-red-100 text-red-700",
    editor: "bg-purple-100 text-purple-700",
    manager: "bg-indigo-100 text-indigo-700",
    reviewer: "bg-blue-100 text-blue-700",
    author: "bg-gray-100 text-gray-700",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="flex flex-wrap gap-1 max-w-[220px] border border-gray-200 rounded-lg px-2 py-1 min-h-[32px] hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
      >
        {selected.map((r) => (
          <span key={r} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[r] || "bg-gray-100 text-gray-700"}`}>
            {r}
          </span>
        ))}
        <span className="text-gray-400 text-xs self-center ml-auto">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-2 w-44">
          {ALL_ROLES.map((role) => (
            <label key={role} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm capitalize">
              <input type="checkbox" checked={selected.includes(role)} onChange={() => toggle(role)}
                className="w-4 h-4 accent-blue-600" />
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[role]}`}>{role}</span>
            </label>
          ))}
          <div className="border-t border-gray-100 mt-2 pt-2 px-3">
            <button onClick={handleSave}
              className="w-full bg-blue-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
              Save Roles
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Reviewer Multi-Select ───────────────────────────────────────────────────
const ReviewerMultiSelect = ({ availableReviewers, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (uid) => {
    if (selected.includes(uid)) {
      onChange(selected.filter((id) => id !== uid));
    } else {
      onChange([...selected, uid]);
    }
  };

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex flex-wrap gap-1 max-w-[250px] border border-gray-300 rounded text-xs px-2 py-1.5 min-h-[32px] hover:border-blue-400 bg-white transition-colors text-left"
      >
        {selected.length === 0 ? (
          <span className="text-gray-500">Select Reviewers...</span>
        ) : (
          selected.map((uid) => {
            const rev = availableReviewers.find(r => r.uid === uid);
            return (
              <span key={uid} className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">
                {rev?.name || uid.slice(0,6)}
                <span className="ml-1 hover:text-blue-500 cursor-pointer font-bold" onClick={(e) => { e.stopPropagation(); toggle(uid); }}>×</span>
              </span>
            );
          })
        )}
      </button>

      {open && (
        <div className="absolute z-20 top-full right-0 sm:left-0 sm:right-auto mt-1 bg-white border border-gray-200 rounded shadow-lg py-1 w-64 max-h-60 overflow-y-auto">
          {availableReviewers.map((r) => (
            <label key={r.uid} className="flex items-start gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs">
              <input type="checkbox" checked={selected.includes(r.uid)} onChange={() => toggle(r.uid)}
                className="w-3.5 h-3.5 mt-0.5 accent-blue-600 rounded" />
              <div>
                <p className="font-medium text-gray-800">{r.name}</p>
                <p className="text-gray-500 text-[10px]">{r.email} ({(r.roles || [r.role]).join(", ")})</p>
              </div>
            </label>
          ))}
          {availableReviewers.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500">No reviewers available.</div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Search Bar ───────────────────────────────────────────────────────────────
const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
    />
    {value && (
      <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
    )}
  </div>
);

// ─── Publish Form ─────────────────────────────────────────────────────────────
const PublishForm = ({ paperId, onPublish }) => {
  const [open, setOpen] = useState(false);
  const [vol, setVol] = useState("");
  const [iss, setIss] = useState("");
  const [yr, setYr] = useState(new Date().getFullYear().toString());
  const [doi, setDoi] = useState("");

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1.5 rounded hover:bg-emerald-200 font-medium">
        Publish
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
      <input placeholder="Vol" value={vol} onChange={(e) => setVol(e.target.value)} className="border rounded px-2 py-1 text-xs w-10" />
      <input placeholder="Issue" value={iss} onChange={(e) => setIss(e.target.value)} className="border rounded px-2 py-1 text-xs w-12" />
      <input placeholder="Year" value={yr} onChange={(e) => setYr(e.target.value)} className="border rounded px-2 py-1 text-xs w-14" type="number" />
      <input placeholder="DOI" value={doi} onChange={(e) => setDoi(e.target.value)} className="border rounded px-2 py-1 text-xs w-28" />
      <button onClick={() => { onPublish({ volume: vol, issue: iss, year: yr, doi }); setOpen(false); }}
        className="bg-emerald-600 text-white text-xs px-2 py-1 rounded font-medium">✓ Publish</button>
      <button onClick={() => setOpen(false)} className="text-gray-400 text-xs px-1">✕</button>
    </div>
  );
};

// ─── Main Admin Panel ─────────────────────────────────────────────────────────
const AdminPanel = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [papers, setPapers] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("papers");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Search state
  const [paperSearch, setPaperSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [paperStatusFilter, setPaperStatusFilter] = useState("all");
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [expandedReviewerId, setExpandedReviewerId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { uid, name } or null

  const isAdmin = profile?.roles?.includes("admin") || profile?.role === "admin";

  // Reviewer oversight state
  const [reviewerProfiles, setReviewerProfiles] = useState([]);
  const [reviewAssignments, setReviewAssignments] = useState([]);
  const [submittedReviews, setSubmittedReviews] = useState([]);
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [expandedPaperIdForReviews, setExpandedPaperIdForReviews] = useState(null);
  const [selectedReviewersForPaper, setSelectedReviewersForPaper] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, papersRes, usersRes, reviewersRes, profilesRes, assignRes, reviewsRes] = await Promise.all([
        adminAPI.getStats(),
        papersAPI.getAll(),
        adminAPI.getUsers(),
        adminAPI.getReviewers(),
        adminAPI.getReviewerProfiles().catch(() => ({ profiles: [] })),
        adminAPI.getReviewAssignments().catch(() => ({ assignments: [] })),
        adminAPI.getSubmittedReviews().catch(() => ({ reviews: [] })),
      ]);
      setStats(statsRes);
      setPapers(papersRes.papers || []);
      setUsers(usersRes.users || []);
      setReviewers(reviewersRes.reviewers || []);
      setReviewerProfiles(profilesRes.profiles || []);
      setReviewAssignments(assignRes.assignments || []);
      setSubmittedReviews(reviewsRes.reviews || []);
    } catch (e) {
      setErr("Failed to load admin data: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Filtered lists (client-side search, BM25) ──────────────────────────────
  const filteredPapers = useMemo(() => {
    let result = papers;
    if (paperStatusFilter !== "all") {
      result = result.filter((p) => p.status === paperStatusFilter);
    }
    if (!paperSearch.trim()) return result;
    
    const bm25 = new BM25(result, (p) => [
      p.title,
      p.authorName,
      p.authorEmail,
      p.status,
      ...(p.keywords || [])
    ]);
    return bm25.search(paperSearch);
  }, [papers, paperSearch, paperStatusFilter]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const lowerQ = userSearch.toLowerCase();
    return users.filter((u) => {
      const combined = [
        u.name,
        u.email,
        ...(Array.isArray(u.roles) ? u.roles : [u.role || "author"])
      ].join(" ").toLowerCase();
      return combined.includes(lowerQ);
    });
  }, [users, userSearch]);

  const filteredReviewerProfiles = useMemo(() => {
    if (!reviewerSearch.trim()) return reviewerProfiles;
    const lowerQ = reviewerSearch.toLowerCase();
    return reviewerProfiles.filter((rp) => {
      const combined = [
        rp.user?.name,
        rp.user?.email,
        rp.university,
        rp.specialization
      ].join(" ").toLowerCase();
      return combined.includes(lowerQ);
    });
  }, [reviewerProfiles, reviewerSearch]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleStatusUpdate = async (paperId, status, extra = {}) => {
    setErr(""); setMsg("");
    try {
      await papersAPI.updateStatus(paperId, { status, ...extra });
      setMsg(`Paper status updated to: ${status}`);
      load();
    } catch (e) { setErr(e.message); }
  };

  const handleAssignReviewer = async (paperId, reviewerId) => {
    if (!reviewerId) return;
    setErr(""); setMsg("");
    try {
      await papersAPI.assignReviewer(paperId, reviewerId);
      setMsg("Reviewer assigned successfully");
      load();
    } catch (e) { setErr(e.message); }
  };

  const handleRoleChange = async (uid, roles) => {
    setErr(""); setMsg("");
    try {
      await adminAPI.updateUserRole(uid, roles);
      setMsg("Roles updated: " + roles.join(", "));
      load();
    } catch (e) { setErr(e.message); }
  };

  const tabs = ["stats", "papers", "users", "reviewers"];

  const getPaperCount = (status) => {
    if (status === "all") return papers.length;
    return papers.filter(p => p.status === status).length;
  };

  return (
    <div>
      <PageHero title="Admin Panel" subtitle="Manage papers, users, and editorial workflow." breadcrumb="Home / Admin" />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {msg && <Alert type="success" message={msg} onClose={() => setMsg("")} />}
        {err && <Alert type="error" message={err} onClose={() => setErr("")} />}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            {tabs.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === t ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {t} ({t === "papers" ? papers.length : t === "users" ? users.length : t === "reviewers" ? reviewerProfiles.length : "stats"})
              </button>
            ))}
          </div>
        </div>

        {loading ? <Spinner center /> : (
          <>
            {/* ── Stats ── */}
            {activeTab === "stats" && stats && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <Card className="p-5">
                  <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">Papers by Status</h3>
                  {Object.entries(stats.papers?.byStatus || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1.5 border-b border-gray-100 text-sm last:border-0">
                      <StatusBadge status={k} /><span className="font-bold text-gray-700">{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1.5 text-sm font-bold mt-1">
                    <span>Total</span><span>{stats.papers?.total}</span>
                  </div>
                </Card>
                <Card className="p-5">
                  <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">Users by Role</h3>
                  {Object.entries(stats.users?.byRole || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1.5 border-b border-gray-100 text-sm last:border-0 capitalize">
                      <span className="text-gray-600">{k}</span><span className="font-bold">{v}</span>
                    </div>
                  ))}
                </Card>
                <Card className="p-5">
                  <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">Reviews</h3>
                  <p className="text-4xl font-bold text-blue-700">{stats.reviews?.total || 0}</p>
                  <p className="text-gray-500 text-sm mt-1">Total reviews submitted</p>
                </Card>
              </div>
            )}

            {/* ── Papers ── */}
            {activeTab === "papers" && (
              <div className="space-y-4">
                <SearchBar value={paperSearch} onChange={setPaperSearch} placeholder="Search by title, author, status, or keyword…" />
                
                {/* Paper Status Filters */}
                <div className="flex flex-wrap gap-2 mb-2 mt-2">
                  {[
                    { id: "all", label: "All" },
                    { id: "submitted", label: "Submitted" },
                    { id: "under_review", label: "Under Review" },
                    { id: "accepted", label: "Accepted" },
                    { id: "revision_required", label: "Revised" },
                    { id: "rejected", label: "Rejected" },
                    { id: "published", label: "Published" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setPaperStatusFilter(f.id)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                        paperStatusFilter === f.id
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {f.label} ({getPaperCount(f.id)})
                    </button>
                  ))}
                </div>

                <div className="text-xs text-gray-400">{filteredPapers.length} of {papers.length} papers</div>
                {filteredPapers.length > 0 ? (
                  filteredPapers.map((p) => {
                    const localReviewers = selectedReviewersForPaper[p.id] || p.reviewers || [];
                    return (
                    <Card key={p.id} className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <StatusBadge status={p.status} />
                            <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                              <HighlightText text={p.title} highlight={paperSearch} />
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            <HighlightText text={p.authorName} highlight={paperSearch} /> · <HighlightText text={p.authorEmail} highlight={paperSearch} />
                          </p>
                          <p className="text-xs text-gray-400">{new Date(p.submittedAt).toLocaleDateString()}</p>
                          {p.status === "under_review" && p.reviewers?.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1 font-medium">
                              Reviewer(s): {p.reviewers.map(rid => reviewers.find(r => r.uid === rid)?.name || "Unknown").join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {["submitted", "under_review"].includes(p.status) && (
                            <ReviewerMultiSelect 
                              availableReviewers={reviewers.filter((r) => (r.roles || [r.role]).includes("reviewer"))}
                              selected={localReviewers}
                              onChange={(newSelection) => setSelectedReviewersForPaper(prev => ({ ...prev, [p.id]: newSelection }))}
                            />
                          )}

                          {p.status === "submitted" && (
                            <button 
                              onClick={async () => {
                                if (localReviewers.length === 0) {
                                  setErr("You must assign at least one reviewer before sending for review.");
                                  return;
                                }
                                setErr(""); setMsg("Sending for review...");
                                try {
                                  // Assign any newly selected reviewers
                                  const alreadyAssigned = p.reviewers || [];
                                  const toAssign = localReviewers.filter(uid => !alreadyAssigned.includes(uid));
                                  await Promise.all(toAssign.map(uid => papersAPI.assignReviewer(p.id, uid)));
                                  
                                  // Update status
                                  await papersAPI.updateStatus(p.id, { status: "under_review" });
                                  setMsg("Paper sent for review successfully!");
                                  setSelectedReviewersForPaper(prev => {
                                    const next = {...prev}; delete next[p.id]; return next;
                                  });
                                  load();
                                } catch (e) { setErr(e.message); }
                              }}
                              className={`text-xs px-3 py-1.5 rounded font-medium ${
                                localReviewers.length > 0 
                                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              Send for Review
                            </button>
                          )}

                          {p.status === "under_review" && (() => {
                            // Check if there are newly selected reviewers not yet assigned
                            const toAssign = localReviewers.filter(uid => !(p.reviewers || []).includes(uid));
                            if (toAssign.length > 0) {
                              return (
                                <button 
                                  onClick={async () => {
                                    setErr(""); setMsg("Assigning reviewers...");
                                    try {
                                      await Promise.all(toAssign.map(uid => papersAPI.assignReviewer(p.id, uid)));
                                      setMsg("Reviewers assigned successfully!");
                                      setSelectedReviewersForPaper(prev => {
                                        const next = {...prev}; delete next[p.id]; return next;
                                      });
                                      load();
                                    } catch (e) { setErr(e.message); }
                                  }}
                                  className="text-xs px-3 py-1.5 rounded font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                >
                                  Save Reviewers
                                </button>
                              );
                            }

                            const hasReview = submittedReviews.some((r) => r.paperId === p.id);
                            const baseClasses = "text-xs px-3 py-1.5 rounded font-medium transition-colors";
                            return (
                              <>
                                <button 
                                  onClick={() => hasReview ? handleStatusUpdate(p.id, "accepted") : setErr("Cannot accept until at least one review is submitted.")} 
                                  className={`${baseClasses} ${hasReview ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                                  title={hasReview ? "" : "Waiting for review"}
                                >
                                  Accept
                                </button>
                                <button 
                                  onClick={() => hasReview ? handleStatusUpdate(p.id, "revision_required") : setErr("Cannot request revision until at least one review is submitted.")} 
                                  className={`${baseClasses} ${hasReview ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                                  title={hasReview ? "" : "Waiting for review"}
                                >
                                  Revise
                                </button>
                                <button 
                                  onClick={() => hasReview ? handleStatusUpdate(p.id, "rejected") : setErr("Cannot reject until at least one review is submitted.")} 
                                  className={`${baseClasses} ${hasReview ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                                  title={hasReview ? "" : "Waiting for review"}
                                >
                                  Reject
                                </button>
                              </>
                            );
                          })()}
                          {p.status === "accepted" && (
                            <PublishForm paperId={p.id} onPublish={(extra) => handleStatusUpdate(p.id, "published", extra)} />
                          )}
                        </div>
                      </div>
                      {p.keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {p.keywords.map((kw, i) => (
                            <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                              <HighlightText text={kw} highlight={paperSearch} />
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Reviews Section inside Paper */}
                      {(() => {
                        const paperReviews = submittedReviews.filter(r => r.paperId === p.id);
                        if (paperReviews.length > 0) {
                          const isExpanded = expandedPaperIdForReviews === p.id;
                          return (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <button
                                onClick={() => setExpandedPaperIdForReviews(isExpanded ? null : p.id)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                {isExpanded ? "▼ Hide Reviews" : `▶ View Reviews (${paperReviews.length})`}
                              </button>
                              
                              {isExpanded && (
                                <div className="mt-4 space-y-4">
                                  {paperReviews.map(rv => (
                                    <div key={rv.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                              rv.decision === "accept" ? "bg-green-100 text-green-800" :
                                              rv.decision === "reject" ? "bg-red-100 text-red-800" :
                                              rv.decision === "minor_revision" ? "bg-yellow-100 text-yellow-800" :
                                              "bg-orange-100 text-orange-800"
                                            }`}>
                                              {rv.decision === "accept" ? "Accept" : rv.decision === "reject" ? "Reject" : rv.decision === "minor_revision" ? "Minor Revision" : "Major Revision"}
                                            </span>
                                            {rv.confidenceLevel && (
                                              <span className="text-xs text-gray-400">Confidence: {rv.confidenceLevel}</span>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-500 mt-2">Reviewed by: {rv.reviewer?.name} ({rv.reviewer?.email}) · {new Date(rv.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                          onClick={() => setExpandedReviewId(expandedReviewId === rv.id ? null : rv.id)}
                                          className="bg-white border border-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded hover:bg-gray-100 font-medium shrink-0"
                                        >
                                          {expandedReviewId === rv.id ? "Hide Details" : "View Details"}
                                        </button>
                                      </div>

                                      {expandedReviewId === rv.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                                          {rv.positives && (
                                            <div className="bg-green-50 border-l-4 border-green-400 rounded-r p-3">
                                              <p className="text-xs font-semibold text-green-700 mb-1">✅ Positive Aspects</p>
                                              <p className="text-xs text-gray-700 whitespace-pre-wrap">{rv.positives}</p>
                                            </div>
                                          )}
                                          {rv.negatives && (
                                            <div className="bg-red-50 border-l-4 border-red-400 rounded-r p-3">
                                              <p className="text-xs font-semibold text-red-700 mb-1">❌ Weaknesses</p>
                                              <p className="text-xs text-gray-700 whitespace-pre-wrap">{rv.negatives}</p>
                                            </div>
                                          )}
                                          {rv.corrections && (
                                            <div className="bg-orange-50 border-l-4 border-orange-400 rounded-r p-3">
                                              <p className="text-xs font-semibold text-orange-700 mb-1">🔧 Corrections Required</p>
                                              <p className="text-xs text-gray-700 whitespace-pre-wrap">{rv.corrections}</p>
                                            </div>
                                          )}
                                          {rv.suggestions && (
                                            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r p-3">
                                              <p className="text-xs font-semibold text-blue-700 mb-1">💡 Suggestions</p>
                                              <p className="text-xs text-gray-700 whitespace-pre-wrap">{rv.suggestions}</p>
                                            </div>
                                          )}
                                          {rv.overallComments && (
                                            <div className="bg-gray-50 border-l-4 border-gray-400 rounded-r p-3">
                                              <p className="text-xs font-semibold text-gray-700 mb-1">📝 Additional Comments</p>
                                              <p className="text-xs text-gray-700 whitespace-pre-wrap">{rv.overallComments}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </Card>
                  );
                })
                ) : (
                  <EmptyState title={paperSearch ? "No matching papers" : "No papers submitted"} message={paperSearch ? `No papers match "${paperSearch}"` : "Papers will appear here once authors submit them."} />
                )}
              </div>
            )}

            {/* ── Users ── */}
            {activeTab === "users" && (
              <div className="space-y-4">
                <SearchBar value={userSearch} onChange={setUserSearch} placeholder="Search by name, email, or role…" />
                <div className="text-xs text-gray-400">{filteredUsers.length} of {users.length} users</div>
                <div className="rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                      <tr>
                        {["Name", "Email", "Roles", "Joined", ...(isAdmin ? ["Actions"] : [])].map((h) => (
                          <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                        <tr key={u.uid} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                          <td className="px-4 py-3 text-gray-600">{u.email}</td>
                          <td className="px-4 py-3">
                            {isAdmin ? (
                              <RoleMultiSelect
                                userRoles={Array.isArray(u.roles) ? u.roles : [u.role || "author"]}
                                uid={u.uid}
                                onSave={handleRoleChange}
                              />
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {(Array.isArray(u.roles) ? u.roles : [u.role || "author"]).map((r) => (
                                  <span key={r} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full capitalize">{r}</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setDeleteConfirm({ uid: u.uid, name: u.name })}
                                className="text-red-500 text-xs hover:underline">
                                Delete
                              </button>
                            </td>
                          )}
                        </tr>
                      )) : (
                        <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-400 text-sm">
                          {userSearch ? `No users match "${userSearch}"` : "No users found"}
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Reviewers Tab ── */}
            {activeTab === "reviewers" && (
              <div className="space-y-4">
                <SearchBar value={reviewerSearch} onChange={setReviewerSearch} placeholder="Search by name, email, university, or specialization…" />
                <div className="text-xs text-gray-400 mb-2">{filteredReviewerProfiles.length} of {reviewerProfiles.length} reviewer profile(s)</div>
                {filteredReviewerProfiles.length > 0 ? (
                  <div className="rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                        <tr>
                          {["Name", "Email", "Phone", "University", "Specialization", "Experience", "Joined"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredReviewerProfiles.map((rp) => {
                          const isExpanded = expandedReviewerId === rp.uid;
                          const assignments = reviewAssignments.filter((a) => a.reviewerId === rp.uid);
                          
                          return (
                            <React.Fragment key={rp.uid}>
                              <tr 
                                onClick={() => setExpandedReviewerId(isExpanded ? null : rp.uid)}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                                  <span className="text-gray-400 text-[10px]">
                                    {isExpanded ? "▼" : "▶"}
                                  </span>
                                  {rp.user?.name || "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-600">{rp.user?.email || "—"}</td>
                                <td className="px-4 py-3 text-gray-600">{rp.phone || "—"}</td>
                                <td className="px-4 py-3 text-gray-600">{rp.university || "—"}</td>
                                <td className="px-4 py-3 text-gray-600">{rp.specialization || "—"}</td>
                                <td className="px-4 py-3">
                                  {rp.hasExperience ? (
                                    <span className="text-green-700 text-xs font-medium" title={rp.experienceDetails || ""}>✓ Yes</span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">No</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-xs">
                                  {rp.completedAt ? new Date(rp.completedAt).toLocaleDateString() : "—"}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-gray-50/50">
                                  <td colSpan="7" className="p-0 border-t border-gray-100">
                                    <div className="px-10 py-4">
                                      <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">Paper Assignments ({assignments.length})</h4>
                                      {assignments.length > 0 ? (
                                        <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                                          <table className="w-full text-xs">
                                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                              <tr>
                                                <th className="text-left px-3 py-2 font-semibold">Paper Title</th>
                                                <th className="text-left px-3 py-2 font-semibold">Status</th>
                                                <th className="text-left px-3 py-2 font-semibold">Assigned</th>
                                                <th className="text-left px-3 py-2 font-semibold">Responded</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                              {assignments.map(a => (
                                                <tr key={a.id}>
                                                  <td className="px-3 py-2 font-medium text-gray-800">{a.paper?.title || "—"}</td>
                                                  <td className="px-3 py-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                                                      a.status === "accepted" ? "bg-green-100 text-green-800" :
                                                      a.status === "declined" ? "bg-red-100 text-red-800" :
                                                      "bg-yellow-100 text-yellow-800"
                                                    }`}>{a.status}</span>
                                                  </td>
                                                  <td className="px-3 py-2 text-gray-500">{new Date(a.assignedAt).toLocaleDateString()}</td>
                                                  <td className="px-3 py-2 text-gray-500">{a.respondedAt ? new Date(a.respondedAt).toLocaleDateString() : "—"}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-400 bg-white p-3 border border-gray-200 rounded-md">No papers assigned to this reviewer yet.</p>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState title="No reviewer profiles" message={reviewerSearch ? "No profiles match your search." : "Reviewer profiles will appear here once reviewers complete their onboarding."} />
                )}
              </div>
            )}


            {/* ── Tabs Content Ends ── */}
          </>
        )}
      </div>

      {/* Delete User Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete User</h3>
              <p className="text-sm text-gray-500 text-center">
                Are you sure you want to delete <strong className="text-gray-900">{deleteConfirm.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex border-t border-gray-200">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  adminAPI.deleteUser(deleteConfirm.uid)
                    .then(() => { setMsg(`User "${deleteConfirm.name}" deleted successfully.`); load(); })
                    .catch((e) => setErr(e.message));
                  setDeleteConfirm(null);
                }}
                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
