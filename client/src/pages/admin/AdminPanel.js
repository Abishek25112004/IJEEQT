import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { adminAPI, papersAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { PageHero, StatusBadge, Spinner, Card, Alert, EmptyState } from "../../components/common";

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

  const isAdmin = profile?.roles?.includes("admin") || profile?.role === "admin";

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

  // ── Filtered lists (client-side search, partial match) ────────────────────
  const filteredPapers = useMemo(() => {
    if (!paperSearch.trim()) return papers;
    const q = paperSearch.toLowerCase();
    return papers.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.authorName?.toLowerCase().includes(q) ||
        p.authorEmail?.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q) ||
        p.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  }, [papers, paperSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.roles?.some((r) => r.toLowerCase().includes(q)) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

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
              <button key={t} onClick={() => setActiveTab(t)}
                className={`pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === t ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
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
                <div className="text-xs text-gray-400">{filteredPapers.length} of {papers.length} papers</div>
                {filteredPapers.length > 0 ? (
                  filteredPapers.map((p) => (
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
                        <div className="flex flex-wrap gap-2 shrink-0">
                          {p.status === "submitted" && (
                            <button onClick={() => handleStatusUpdate(p.id, "under_review")}
                              className="bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded hover:bg-blue-200 font-medium">
                              Send for Review
                            </button>
                          )}
                          {p.status === "under_review" && (
                            <>
                              <button onClick={() => handleStatusUpdate(p.id, "accepted")} className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded hover:bg-green-200 font-medium">Accept</button>
                              <button onClick={() => handleStatusUpdate(p.id, "revision_required")} className="bg-orange-100 text-orange-700 text-xs px-3 py-1.5 rounded hover:bg-orange-200 font-medium">Revise</button>
                              <button onClick={() => handleStatusUpdate(p.id, "rejected")} className="bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded hover:bg-red-200 font-medium">Reject</button>
                            </>
                          )}
                          {p.status === "accepted" && (
                            <PublishForm paperId={p.id} onPublish={(extra) => handleStatusUpdate(p.id, "published", extra)} />
                          )}
                          {["submitted", "under_review"].includes(p.status) && (
                            <select defaultValue="" onChange={(e) => handleAssignReviewer(p.id, e.target.value)}
                              className="border border-gray-300 rounded text-xs px-2 py-1.5 text-gray-700 max-w-[180px]">
                              <option value="" disabled>Assign Reviewer</option>
                              {reviewers.map((r) => (
                                <option key={r.uid} value={r.uid}>{r.name} ({(r.roles || [r.role]).join(", ")})</option>
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
                  ))
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
                                onClick={() => { if (window.confirm(`Delete ${u.name}?`)) adminAPI.deleteUser(u.uid).then(load).catch((e) => setErr(e.message)); }}
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
            {/* ── Tabs Content Ends ── */}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
