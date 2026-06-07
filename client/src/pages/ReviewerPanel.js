// src/pages/ReviewerPanel.js
// Full reviewer workflow: Profile onboarding → Paper assignments → Review submission
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { reviewerAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/dateUtils";
import { BM25 } from "../utils/bm25";
import { PageHero, StatusBadge, Spinner, Card, Alert, EmptyState, HighlightText } from "../components/common";

// ─── Decision badge colors ────────────────────────────────────────────────────
const DecisionBadge = ({ decision }) => {
  const styles = {
    accept: "bg-green-100 text-green-800",
    minor_revision: "bg-yellow-100 text-yellow-800",
    major_revision: "bg-orange-100 text-orange-800",
    reject: "bg-red-100 text-red-800",
  };
  const labels = {
    accept: "Accept",
    minor_revision: "Minor Revision",
    major_revision: "Major Revision",
    reject: "Reject",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[decision] || "bg-gray-100 text-gray-700"}`}>
      {labels[decision] || decision}
    </span>
  );
};

// ─── Assignment status badge ──────────────────────────────────────────────────
const AssignmentBadge = ({ status }) => {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
};

// ─── Profile Onboarding Form ──────────────────────────────────────────────────
const ProfileOnboarding = ({ profile, onSave, saving }) => {
  const { profile: authProfile } = useAuth();
  const [form, setForm] = useState({
    phone: "",
    university: "",
    specialization: "",
    hasExperience: false,
    experienceDetails: "",
    ...profile,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.phone || !form.university || !form.specialization) return;
    onSave(form);
  };

  return (
    <Card className="max-w-2xl mx-auto p-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">👨‍🔬</div>
        <h2 className="text-xl font-bold text-gray-900">Complete Your Reviewer Profile</h2>
        <p className="text-gray-500 text-sm mt-1">Please fill in your details to start reviewing papers.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Pre-filled fields */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              value={authProfile?.name || ""}
              disabled
              className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              value={authProfile?.email || ""}
              disabled
              className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-500"
            />
          </div>
        </div>

        {/* Editable fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+91 XXXXX XXXXX"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">University / Institution <span className="text-red-500">*</span></label>
          <input
            name="university"
            value={form.university}
            onChange={handleChange}
            placeholder="e.g., IIT Madras"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specialization / Area of Expertise <span className="text-red-500">*</span></label>
          <input
            name="specialization"
            value={form.specialization}
            onChange={handleChange}
            placeholder="e.g., Machine Learning, VLSI Design, Power Systems"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Experience toggle */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="hasExperience"
              checked={form.hasExperience}
              onChange={handleChange}
              className="w-5 h-5 accent-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">I have prior journal reviewing experience</span>
          </label>
          {form.hasExperience && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Please describe your experience (journals, years, etc.)</label>
              <textarea
                name="experienceDetails"
                value={form.experienceDetails}
                onChange={handleChange}
                rows="3"
                placeholder="e.g., Reviewed for IEEE Transactions on Neural Networks (2022–2024), Springer Nature (5 papers)..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile & Continue"}
        </button>
      </form>
    </Card>
  );
};

// ─── Review Submission Form ───────────────────────────────────────────────────
const ReviewForm = ({ paper, reviewerProfile, onSubmit, onCancel, submitting }) => {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    positives: "",
    negatives: "",
    corrections: "",
    suggestions: "",
    decision: "",
    confidenceLevel: "medium",
    overallComments: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.decision || (!form.positives && !form.negatives)) return;
    onSubmit({ paperId: paper.id, ...form });
  };

  return (
    <Card className="p-6 border-2 border-blue-200 bg-blue-50/30">
      <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
        📝 Submit Review
      </h3>

      {/* Paper & Reviewer Info (read-only) */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-2">
        <div className="text-sm">
          <span className="font-medium text-gray-500">Paper: </span>
          <span className="font-semibold text-gray-900">{paper.title}</span>
        </div>
        <div className="text-sm">
          <span className="font-medium text-gray-500">Reviewer: </span>
          <span className="text-gray-700">{profile?.name} ({profile?.email})</span>
        </div>
        {reviewerProfile && (
          <div className="text-sm">
            <span className="font-medium text-gray-500">Specialization: </span>
            <span className="text-gray-700">{reviewerProfile.specialization}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Positive aspects */}
        <div>
          <label className="block text-sm font-semibold text-green-700 mb-1">✅ Positive Aspects / Strengths <span className="text-red-500">*</span></label>
          <textarea
            name="positives"
            value={form.positives}
            onChange={handleChange}
            rows="4"
            placeholder="Describe the strengths, contributions, and positive aspects of this paper..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        {/* Negative aspects */}
        <div>
          <label className="block text-sm font-semibold text-red-700 mb-1">❌ Weaknesses / Negative Aspects <span className="text-red-500">*</span></label>
          <textarea
            name="negatives"
            value={form.negatives}
            onChange={handleChange}
            rows="4"
            placeholder="Describe the weaknesses, gaps, or issues found in this paper..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>

        {/* Corrections */}
        <div>
          <label className="block text-sm font-semibold text-orange-700 mb-1">🔧 Corrections Required Before Publishing</label>
          <textarea
            name="corrections"
            value={form.corrections}
            onChange={handleChange}
            rows="3"
            placeholder="List specific corrections the author must make before this paper can be published..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>

        {/* Suggestions */}
        <div>
          <label className="block text-sm font-semibold text-blue-700 mb-1">💡 Suggestions for Improvement</label>
          <textarea
            name="suggestions"
            value={form.suggestions}
            onChange={handleChange}
            rows="3"
            placeholder="Provide suggestions to improve the paper's quality, methodology, presentation..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Decision + Confidence */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Recommendation <span className="text-red-500">*</span></label>
            <select
              name="decision"
              value={form.decision}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="" disabled>Select recommendation...</option>
              <option value="accept">✅ Accept</option>
              <option value="minor_revision">📝 Minor Revision</option>
              <option value="major_revision">🔄 Major Revision</option>
              <option value="reject">❌ Reject</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confidence Level</label>
            <select
              name="confidenceLevel"
              value={form.confidenceLevel}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="high">High — Expert in this area</option>
              <option value="medium">Medium — Familiar with this area</option>
              <option value="low">Low — Outside my main expertise</option>
            </select>
          </div>
        </div>

        {/* Additional comments */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Comments (optional)</label>
          <textarea
            name="overallComments"
            value={form.overallComments}
            onChange={handleChange}
            rows="2"
            placeholder="Any other remarks for the editor..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !form.decision || (!form.positives && !form.negatives)}
            className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
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

// ─── Main Reviewer Panel ──────────────────────────────────────────────────────
const ReviewerPanel = () => {
  const { profile: authProfile } = useAuth();
  const navigate = useNavigate();
  const [reviewerProfile, setReviewerProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [reviewingPaperId, setReviewingPaperId] = useState(null);
  const [expandedReview, setExpandedReview] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [expandedAbstracts, setExpandedAbstracts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const toggleAbstract = (paperId) => {
    setExpandedAbstracts((prev) => ({ ...prev, [paperId]: !prev[paperId] }));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, assignRes, reviewsRes] = await Promise.all([
        reviewerAPI.getProfile(),
        reviewerAPI.getAssignments().catch(() => ({ assignments: [] })),
        reviewerAPI.getMyReviews().catch(() => ({ reviews: [] })),
      ]);
      setReviewerProfile(profileRes.profile);
      setProfileLoaded(true);
      setAssignments(assignRes.assignments || []);
      setMyReviews(reviewsRes.reviews || []);
    } catch (e) {
      setErr("Failed to load reviewer data: " + e.message);
      setProfileLoaded(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Save profile
  const handleSaveProfile = async (data) => {
    setSaving(true);
    setErr(""); setMsg("");
    try {
      const res = await reviewerAPI.saveProfile(data);
      setReviewerProfile(res.profile);
      setMsg("Profile saved successfully! You can now view your assignments.");
      load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Accept or decline assignment
  const handleRespond = async (assignmentId, status) => {
    setErr(""); setMsg("");
    try {
      await reviewerAPI.respondToAssignment(assignmentId, status);
      setMsg(`Assignment ${status} successfully`);
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  // Submit review
  const handleSubmitReview = async (data) => {
    setSubmitting(true);
    setErr(""); setMsg("");
    try {
      await reviewerAPI.submitReview(data);
      setMsg("Review submitted successfully! The editor has been notified.");
      setReviewingPaperId(null);
      load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const pending = assignments.filter((a) => a.status === "pending").length;
    const accepted = assignments.filter((a) => a.status === "accepted").length;
    const reviewed = assignments.filter((a) => a.hasReview).length;
    return { pending, accepted, reviewed, total: assignments.length };
  }, [assignments]);

  // Lookup review for a paper
  const getReviewForPaper = (paperId) => myReviews.find((r) => r.paperId === paperId);

  const filteredAssignments = useMemo(() => {
    let result = assignments;
    if (filterStatus === "pending") result = result.filter(a => a.status === "pending");
    else if (filterStatus === "accepted") result = result.filter(a => a.status === "accepted");
    else if (filterStatus === "reviews_completed") result = result.filter(a => a.hasReview);

    if (!searchTerm.trim()) return result;
    
    const bm25 = new BM25(result, (a) => [
      a.paper?.title,
      a.paper?.authorName,
      a.paper?.abstract
    ]);
    return bm25.search(searchTerm);
  }, [assignments, filterStatus, searchTerm]);

  if (loading) {
    return (
      <div>
        <PageHero title="Reviewer Panel" subtitle="Manage your review assignments." breadcrumb="Home / Reviewer" />
        <div className="max-w-6xl mx-auto px-4 py-10"><Spinner center /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHero
        title="Reviewer Panel"
        subtitle={`Welcome, ${authProfile?.name || "Reviewer"}. Manage your profile and paper reviews.`}
        breadcrumb="Home / Reviewer"
      />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 mb-6 transition-colors">
          ← Back
        </button>
        {msg && <Alert type="success" message={msg} onClose={() => setMsg("")} />}
        {err && <Alert type="error" message={err} onClose={() => setErr("")} />}

        {/* Step 1: Profile not filled yet */}
        {profileLoaded && !reviewerProfile ? (
          <div className="mt-4">
            <ProfileOnboarding profile={null} onSave={handleSaveProfile} saving={saving} />
          </div>
        ) : (
          <>
            {/* Progress Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 mt-4">
              {[
                { label: "Total Assigned", value: stats.total, color: "blue" },
                { label: "Pending Response", value: stats.pending, color: "yellow" },
                { label: "Accepted", value: stats.accepted, color: "green" },
                { label: "Reviews Completed", value: stats.reviewed, color: "emerald" },
              ].map((s) => (
                <Card key={s.label} className={`p-4 text-center border-t-4 border-${s.color}-500`}>
                  <p className={`text-3xl font-bold text-${s.color}-600`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </Card>
              ))}
            </div>

            {/* Reviewer profile summary (collapsible) */}
            {reviewerProfile && (
              <Card className="p-4 mb-6 bg-gray-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>🏫 {reviewerProfile.university}</span>
                    <span>🔬 {reviewerProfile.specialization}</span>
                    <span>📞 {reviewerProfile.phone}</span>
                    {reviewerProfile.hasExperience && <span className="text-green-700 font-medium">✓ Experienced Reviewer</span>}
                  </div>
                  <button
                    onClick={() => {
                      setReviewerProfile(null); // re-show the form for editing
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit Profile
                  </button>
                </div>
              </Card>
            )}

            {/* Assignments */}
            {assignments.length === 0 ? (
              <EmptyState
                title="No assignments yet"
                message="Papers will appear here once an editor assigns them to you for review."
              />
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 border-l-4 border-blue-700 pl-3 mb-4">
                  Your Assignments
                </h2>

                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by title, author, or abstract…" />

                {/* Status Filters */}
                <div className="flex flex-wrap gap-2 mb-2 mt-2">
                  {[
                    { id: "all", label: "All Assignments" },
                    { id: "pending", label: "Pending Response" },
                    { id: "accepted", label: "Accepted" },
                    { id: "reviews_completed", label: "Reviews Completed" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterStatus(f.id)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                        filterStatus === f.id
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {f.label} ({f.id === "all" ? assignments.length : f.id === "pending" ? stats.pending : f.id === "accepted" ? stats.accepted : stats.reviewed})
                    </button>
                  ))}
                </div>

                <div className="text-xs text-gray-400">{filteredAssignments.length} of {assignments.length} assignments</div>

                {filteredAssignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                    No assignments match your search or filter criteria.
                  </div>
                ) : (
                  filteredAssignments.map((a) => {
                  const review = getReviewForPaper(a.paperId);
                  const isReviewing = reviewingPaperId === a.paperId;

                  return (
                    <div key={a.id}>
                      <Card className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 flex-wrap">
                              <AssignmentBadge status={a.status} />
                              {a.hasReview && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                  ✓ Review Submitted
                                </span>
                              )}
                              <StatusBadge status={a.paper?.status} />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm leading-snug mt-2">
                              <HighlightText text={a.paper?.title} highlight={searchTerm} />
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              By <HighlightText text={a.paper?.authorName} highlight={searchTerm} /> · Assigned {formatDate(a.assignedAt)}
                            </p>
                            {a.paper?.abstract && (
                              <div className="mt-2 text-xs text-gray-500">
                                <p className={expandedAbstracts[a.paperId] ? "text-justify" : "line-clamp-2 text-justify"}>
                                  <HighlightText text={a.paper.abstract} highlight={searchTerm} />
                                </p>
                                {a.paper.abstract.length > 150 && (
                                  <button
                                    onClick={() => toggleAbstract(a.paperId)}
                                    className="text-blue-600 hover:underline font-medium mt-1"
                                  >
                                    {expandedAbstracts[a.paperId] ? "Show Less" : "Read More"}
                                  </button>
                                )}
                              </div>
                            )}
                            {a.paper?.keywords?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {a.paper.keywords.slice(0, 5).map((kw, i) => (
                                  <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                    <HighlightText text={kw} highlight={searchTerm} />
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 shrink-0">
                            {a.paper?.fileUrl && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const fileName = a.paper.title
                                    ? a.paper.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf'
                                    : 'paper.pdf';
                                  try {
                                    const { auth } = await import("../services/firebase");
                                    const user = auth.currentUser;
                                    const token = user ? await user.getIdToken() : null;
                                    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
                                    const res = await fetch(`${API_URL}/papers/${a.paperId}/download`, {
                                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                                    });
                                    if (!res.ok) throw new Error("Download failed");
                                    const blob = await res.blob();
                                    const blobUrl = window.URL.createObjectURL(blob);
                                    const link = document.createElement("a");
                                    link.href = blobUrl;
                                    link.download = fileName;
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                    window.URL.revokeObjectURL(blobUrl);
                                  } catch (err) {
                                    window.open(a.paper.fileUrl, "_blank");
                                  }
                                }}
                                className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded hover:bg-gray-200 font-medium"
                              >
                                📄 Download PDF
                              </button>
                            )}

                            {/* Pending: Accept / Decline */}
                            {a.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleRespond(a.id, "accepted")}
                                  className="bg-green-100 text-green-700 text-xs px-4 py-1.5 rounded hover:bg-green-200 font-medium"
                                >
                                  ✓ Accept
                                </button>
                                <button
                                  onClick={() => handleRespond(a.id, "declined")}
                                  className="bg-red-100 text-red-700 text-xs px-4 py-1.5 rounded hover:bg-red-200 font-medium"
                                >
                                  ✕ Decline
                                </button>
                              </>
                            )}

                            {/* Accepted + no review yet: Complete Review */}
                            {a.status === "accepted" && !a.hasReview && (
                              <button
                                onClick={() => setReviewingPaperId(isReviewing ? null : a.paperId)}
                                className="bg-blue-100 text-blue-700 text-xs px-4 py-1.5 rounded hover:bg-blue-200 font-medium"
                              >
                                {isReviewing ? "Cancel Review" : "📝 Write Review"}
                              </button>
                            )}

                            {/* Already reviewed: View review */}
                            {a.hasReview && review && (
                              <button
                                onClick={() => setExpandedReview(expandedReview === a.paperId ? null : a.paperId)}
                                className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1.5 rounded hover:bg-emerald-200 font-medium"
                              >
                                {expandedReview === a.paperId ? "Hide Review" : "View Review"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expanded review summary */}
                        {expandedReview === a.paperId && review && (
                          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                            <div className="flex items-center gap-2">
                              <DecisionBadge decision={review.decision} />
                              {review.confidenceLevel && (
                                <span className="text-xs text-gray-400">Confidence: {review.confidenceLevel}</span>
                              )}
                              <span className="text-xs text-gray-400">· {formatDate(review.createdAt)}</span>
                            </div>
                            {review.positives && (
                              <div className="bg-green-50 border-l-3 border-green-400 rounded-r p-3">
                                <p className="text-xs font-semibold text-green-700 mb-1">Positives</p>
                                <p className="text-xs text-gray-700 whitespace-pre-wrap">{review.positives}</p>
                              </div>
                            )}
                            {review.negatives && (
                              <div className="bg-red-50 border-l-3 border-red-400 rounded-r p-3">
                                <p className="text-xs font-semibold text-red-700 mb-1">Weaknesses</p>
                                <p className="text-xs text-gray-700 whitespace-pre-wrap">{review.negatives}</p>
                              </div>
                            )}
                            {review.corrections && (
                              <div className="bg-orange-50 border-l-3 border-orange-400 rounded-r p-3">
                                <p className="text-xs font-semibold text-orange-700 mb-1">Corrections Required</p>
                                <p className="text-xs text-gray-700 whitespace-pre-wrap">{review.corrections}</p>
                              </div>
                            )}
                            {review.suggestions && (
                              <div className="bg-blue-50 border-l-3 border-blue-400 rounded-r p-3">
                                <p className="text-xs font-semibold text-blue-700 mb-1">Suggestions</p>
                                <p className="text-xs text-gray-700 whitespace-pre-wrap">{review.suggestions}</p>
                              </div>
                            )}
                            {review.overallComments && (
                              <div className="bg-gray-50 border-l-3 border-gray-400 rounded-r p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-1">Additional Comments</p>
                                <p className="text-xs text-gray-700 whitespace-pre-wrap">{review.overallComments}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>

                      {/* Review form (opens below the card) */}
                      {isReviewing && (
                        <div className="mt-3">
                          <ReviewForm
                            paper={a.paper}
                            reviewerProfile={reviewerProfile}
                            onSubmit={handleSubmitReview}
                            onCancel={() => setReviewingPaperId(null)}
                            submitting={submitting}
                          />
                        </div>
                      )}
                    </div>
                  );
                }))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewerPanel;
