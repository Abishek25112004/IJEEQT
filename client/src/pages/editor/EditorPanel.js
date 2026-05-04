import React, { useEffect, useState, useMemo, useRef } from "react";
import { adminAPI, papersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { BM25 } from "../../utils/bm25";
import { PageHero, StatusBadge, Spinner, Card, Alert, EmptyState, HighlightText } from "../../components/common";

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
                <p className="text-gray-500 text-[10px]">{r.email}</p>
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

const EditorPanel = () => {
  const { profile } = useAuth();
  const [papers, setPapers] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [reviewerProfiles, setReviewerProfiles] = useState([]);
  const [reviewAssignments, setReviewAssignments] = useState([]);
  const [submittedReviews, setSubmittedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("papers");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Search/Filter state
  const [paperSearch, setPaperSearch] = useState("");
  const [paperStatusFilter, setPaperStatusFilter] = useState("all");
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [expandedReviewerId, setExpandedReviewerId] = useState(null);
  const [expandedPaperIdForReviews, setExpandedPaperIdForReviews] = useState(null);
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [selectedReviewersForPaper, setSelectedReviewersForPaper] = useState({});

  const load = async (statusFilter = "all") => {
    setLoading(true);
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const [papersRes, reviewersRes, profilesRes, assignRes, reviewsRes] = await Promise.all([
        papersAPI.getAll(params),
        adminAPI.getReviewers(),
        adminAPI.getReviewerProfiles().catch(() => ({ profiles: [] })),
        adminAPI.getReviewAssignments().catch(() => ({ assignments: [] })),
        adminAPI.getSubmittedReviews().catch(() => ({ reviews: [] })),
      ]);
      setPapers(papersRes.papers || []);
      setReviewers(reviewersRes.reviewers || []);
      setReviewerProfiles(profilesRes.profiles || []);
      setReviewAssignments(assignRes.assignments || []);
      setSubmittedReviews(reviewsRes.reviews || []);
    } catch (e) {
      setErr("Failed to load editor data: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(paperStatusFilter); 
  }, [paperStatusFilter]);

  const filteredPapers = useMemo(() => {
    let result = papers;
    // Local filtering for search only, as status is handled by backend refetch
    if (!paperSearch.trim()) return result;
    
    const bm25 = new BM25(result, (p) => [
      p.title,
      p.authorName,
      p.authorEmail,
      p.status,
      ...(p.keywords || [])
    ]);
    return bm25.search(paperSearch);
  }, [papers, paperSearch]);

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

  const handleStatusUpdate = async (paperId, status) => {
    setErr(""); setMsg("");
    try {
      await papersAPI.updateStatus(paperId, { status });
      setMsg(`Paper status updated to: ${status}`);
      load();
    } catch (e) { setErr(e.message); }
  };

  const tabs = ["papers", "reviewers"];

  return (
    <div>
      <PageHero title="Editor Panel" subtitle="Assign reviewers and manage editorial decisions." breadcrumb="Home / Editor" />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {msg && <Alert type="success" message={msg} onClose={() => setMsg("")} />}
        {err && <Alert type="error" message={err} onClose={() => setErr("")} />}

        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            {tabs.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === t ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? <Spinner center /> : (
          <>
            {activeTab === "papers" && (
              <div className="space-y-4">
                <SearchBar value={paperSearch} onChange={setPaperSearch} placeholder="Search by title, author, or keyword…" />
                
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
                        paperStatusFilter === f.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {filteredPapers.length > 0 ? (
                  filteredPapers.map((p) => {
                    const localReviewers = selectedReviewersForPaper[p.id] || p.reviewers || [];
                    const hasReview = submittedReviews.some((r) => r.paperId === p.id);
                    
                    return (
                      <Card key={p.id} className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <StatusBadge status={p.status} />
                              <h3 className="font-semibold text-gray-900 text-sm">
                                <HighlightText text={p.title} highlight={paperSearch} />
                              </h3>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{p.authorName} · {p.authorEmail}</p>
                            <p className="text-xs text-gray-400">{new Date(p.submittedAt).toLocaleDateString()}</p>
                            {p.status === "published" && (
                              <div className="mt-2 p-2 bg-emerald-50 border border-emerald-100 rounded text-[10px] text-emerald-800 flex flex-wrap gap-x-4 gap-y-1">
                                {p.volume && <span><strong>Vol:</strong> {p.volume}</span>}
                                {p.issue && <span><strong>Issue:</strong> {p.issue}</span>}
                                {p.year && <span><strong>Year:</strong> {p.year}</span>}
                                {p.doi && <span><strong>DOI:</strong> {p.doi}</span>}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            {["submitted", "under_review"].includes(p.status) && (
                              <ReviewerMultiSelect 
                                availableReviewers={reviewers}
                                selected={localReviewers}
                                onChange={(newSelection) => setSelectedReviewersForPaper(prev => ({ ...prev, [p.id]: newSelection }))}
                              />
                            )}

                            {p.status === "submitted" && (
                              <button 
                                onClick={async () => {
                                  if (localReviewers.length === 0) return setErr("Assign a reviewer first.");
                                  try {
                                    const toAssign = localReviewers.filter(uid => !(p.reviewers || []).includes(uid));
                                    await Promise.all(toAssign.map(uid => papersAPI.assignReviewer(p.id, uid)));
                                    await papersAPI.updateStatus(p.id, { status: "under_review" });
                                    setMsg("Paper sent for review!");
                                    load();
                                  } catch (e) { setErr(e.message); }
                                }}
                                className="text-xs px-3 py-1.5 rounded font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                              >
                                Send for Review
                              </button>
                            )}

                            {p.status === "under_review" && (
                              <>
                                <button onClick={() => hasReview ? handleStatusUpdate(p.id, "accepted") : setErr("Wait for reviews")} 
                                  className={`text-xs px-3 py-1.5 rounded font-medium ${hasReview ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>Accept</button>
                                <button onClick={() => hasReview ? handleStatusUpdate(p.id, "revision_required") : setErr("Wait for reviews")}
                                  className={`text-xs px-3 py-1.5 rounded font-medium ${hasReview ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-400"}`}>Revise</button>
                                <button onClick={() => hasReview ? handleStatusUpdate(p.id, "rejected") : setErr("Wait for reviews")}
                                  className={`text-xs px-3 py-1.5 rounded font-medium ${hasReview ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-400"}`}>Reject</button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Reviews Toggle */}
                        {submittedReviews.some(r => r.paperId === p.id) && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <button onClick={() => setExpandedPaperIdForReviews(expandedPaperIdForReviews === p.id ? null : p.id)}
                              className="text-sm font-medium text-blue-600">
                              {expandedPaperIdForReviews === p.id ? "▼ Hide Reviews" : "▶ View Reviews"}
                            </button>
                            {expandedPaperIdForReviews === p.id && (
                              <div className="mt-3 space-y-3">
                                {submittedReviews.filter(r => r.paperId === p.id).map(rv => (
                                  <div key={rv.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className="text-xs font-bold uppercase">{rv.decision.replace("_", " ")}</span>
                                        <p className="text-[10px] text-gray-500">By: {rv.reviewer?.name}</p>
                                      </div>
                                      <button onClick={() => setExpandedReviewId(expandedReviewId === rv.id ? null : rv.id)} className="text-xs text-blue-600">Details</button>
                                    </div>
                                    {expandedReviewId === rv.id && (
                                      <div className="mt-2 text-xs text-gray-700 whitespace-pre-wrap border-t pt-2">{rv.overallComments || rv.comments}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })
                ) : (
                  <EmptyState title="No papers found" message="No active papers to manage." />
                )}
              </div>
            )}

            {activeTab === "reviewers" && (
              <div className="space-y-4">
                <SearchBar value={reviewerSearch} onChange={setReviewerSearch} placeholder="Search reviewers…" />
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Name</th>
                        <th className="text-left px-4 py-3 font-semibold">Email</th>
                        <th className="text-left px-4 py-3 font-semibold">Specialization</th>
                        <th className="text-left px-4 py-3 font-semibold">University</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredReviewerProfiles.map((rp) => (
                        <tr key={rp.uid} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{rp.user?.name}</td>
                          <td className="px-4 py-3 text-gray-600">{rp.user?.email}</td>
                          <td className="px-4 py-3 text-gray-600">{rp.specialization || "—"}</td>
                          <td className="px-4 py-3 text-gray-600">{rp.university || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EditorPanel;
