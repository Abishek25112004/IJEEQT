// src/pages/admin/AdminPanel.js
import React, { useEffect, useState } from "react";
import { adminAPI, papersAPI, reviewsAPI } from "../../services/api";
import { PageHero, StatusBadge, Spinner, Card, Alert, EmptyState } from "../../components/common";

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [papers, setPapers] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("papers");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, papersRes, usersRes, reviewersRes] = await Promise.all([
        adminAPI.getStats(),
        papersAPI.getAll(),
        adminAPI.getUsers(),
        adminAPI.getReviewers(),
      ]);
      setStats(statsRes);
      setPapers(papersRes.papers || []);
      setUsers(usersRes.users || []);
      setReviewers(reviewersRes.reviewers || []);
    } catch (e) {
      setErr("Failed to load admin data: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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

  const handleRoleChange = async (uid, role) => {
    setErr(""); setMsg("");
    try {
      await adminAPI.updateUserRole(uid, role);
      setMsg("Role updated");
      load();
    } catch (e) { setErr(e.message); }
  };

  const tabs = ["papers", "users", "stats"];

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
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === t ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                {t}
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
                      <StatusBadge status={k} />
                      <span className="font-bold text-gray-700">{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1.5 text-sm font-bold mt-1">
                    <span>Total</span>
                    <span>{stats.papers?.total}</span>
                  </div>
                </Card>
                <Card className="p-5">
                  <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">Users by Role</h3>
                  {Object.entries(stats.users?.byRole || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1.5 border-b border-gray-100 text-sm last:border-0 capitalize">
                      <span className="text-gray-600">{k}</span>
                      <span className="font-bold">{v}</span>
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
              papers.length > 0 ? (
                <div className="space-y-4">
                  {papers.map((p) => (
                    <Card key={p.id} className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <StatusBadge status={p.status} />
                            <h3 className="font-semibold text-gray-900 text-sm leading-snug">{p.title}</h3>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{p.authorName} · {p.authorEmail}</p>
                          <p className="text-xs text-gray-400">{new Date(p.submittedAt).toLocaleDateString()}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 shrink-0">
                          {/* Status controls */}
                          {p.status === "submitted" && (
                            <button
                              onClick={() => handleStatusUpdate(p.id, "under_review")}
                              className="bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded hover:bg-blue-200 font-medium"
                            >
                              Send for Review
                            </button>
                          )}
                          {p.status === "under_review" && (
                            <>
                              <button onClick={() => handleStatusUpdate(p.id, "accepted")}
                                className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded hover:bg-green-200 font-medium">
                                Accept
                              </button>
                              <button onClick={() => handleStatusUpdate(p.id, "revision_required")}
                                className="bg-orange-100 text-orange-700 text-xs px-3 py-1.5 rounded hover:bg-orange-200 font-medium">
                                Revise
                              </button>
                              <button onClick={() => handleStatusUpdate(p.id, "rejected")}
                                className="bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded hover:bg-red-200 font-medium">
                                Reject
                              </button>
                            </>
                          )}
                          {p.status === "accepted" && (
                            <PublishForm paperId={p.id} onPublish={(extra) => handleStatusUpdate(p.id, "published", extra)} />
                          )}

                          {/* Assign reviewer dropdown */}
                          {["submitted", "under_review"].includes(p.status) && (
                            <select
                              defaultValue=""
                              onChange={(e) => handleAssignReviewer(p.id, e.target.value)}
                              className="border border-gray-300 rounded text-xs px-2 py-1.5 text-gray-700 max-w-[180px]"
                            >
                              <option value="" disabled>Assign Reviewer</option>
                              {reviewers.map((r) => (
                                <option key={r.uid} value={r.uid}>{r.name} ({r.role})</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {p.keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {p.keywords.map((kw, i) => (
                            <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{kw}</span>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : <EmptyState title="No papers submitted" message="Papers will appear here once authors submit them." />
            )}

            {/* ── Users ── */}
            {activeTab === "users" && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                    <tr>
                      {["Name", "Email", "Institution", "Role", "Joined", "Actions"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.uid} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 text-gray-600">{u.email}</td>
                        <td className="px-4 py-3 text-gray-500 truncate max-w-[160px]">{u.institution || "—"}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                            className="border border-gray-200 rounded px-2 py-1 text-xs"
                          >
                            {["author", "reviewer", "editor", "admin"].map((r) => (
                              <option key={r} value={r} className="capitalize">{r}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => { if (window.confirm(`Delete ${u.name}?`)) adminAPI.deleteUser(u.uid).then(load).catch((e) => setErr(e.message)); }}
                            className="text-red-500 text-xs hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Mini form for publish with volume/issue/doi
const PublishForm = ({ paperId, onPublish }) => {
  const [open, setOpen] = useState(false);
  const [vol, setVol] = useState("");
  const [iss, setIss] = useState("");
  const [doi, setDoi] = useState("");

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1.5 rounded hover:bg-emerald-200 font-medium">
        Publish
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <input placeholder="Vol" value={vol} onChange={(e) => setVol(e.target.value)} className="border rounded px-2 py-1 text-xs w-12" />
      <input placeholder="Issue" value={iss} onChange={(e) => setIss(e.target.value)} className="border rounded px-2 py-1 text-xs w-14" />
      <input placeholder="DOI" value={doi} onChange={(e) => setDoi(e.target.value)} className="border rounded px-2 py-1 text-xs w-28" />
      <button
        onClick={() => { onPublish({ volume: vol, issue: iss, doi }); setOpen(false); }}
        className="bg-emerald-600 text-white text-xs px-2 py-1 rounded"
      >
        ✓
      </button>
      <button onClick={() => setOpen(false)} className="text-gray-400 text-xs px-1">✕</button>
    </div>
  );
};

export default AdminPanel;
