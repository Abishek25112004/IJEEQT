import React, { useState, useEffect } from "react";
import { contentAPI } from "../../services/api";
import { Card, Spinner, Alert } from "../../components/common";

const SECTIONS = [
  { id: "call_for_papers", label: "Call for Papers" },
  { id: "indexing_abstracting", label: "Indexing & Abstracting" },
  { id: "editorial_board", label: "Editorial Board" },
  { id: "contacts", label: "Contacts" },
];

const SiteContentManager = () => {
  const [activeSection, setActiveSection] = useState("call_for_papers");
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadContent = async (key) => {
    setLoading(true);
    setErr("");
    setMsg("");
    try {
      const res = await contentAPI.getContent(key);
      setContent(res.value);
    } catch (error) {
      if (error.message.includes("not found")) {
        // Initialize with default
        setContent({});
      } else {
        setErr("Failed to load content: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent(activeSection);
  }, [activeSection]);

  const handleSave = async (value) => {
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      await contentAPI.updateContent(activeSection, value);
      setMsg("Content saved successfully");
    } catch (error) {
      setErr("Failed to save content: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === sec.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {msg && <Alert type="success" message={msg} onClose={() => setMsg("")} />}
      {err && <Alert type="error" message={err} onClose={() => setErr("")} />}

      <Card className="p-6">
        {loading ? (
          <Spinner center />
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-3 capitalize">
              Edit {activeSection.replace(/_/g, " ")}
            </h3>
            
            {/* dynamic forms based on activeSection */}
            {activeSection === "call_for_papers" && (
              <CallForPapersForm data={content} onSave={handleSave} saving={saving} />
            )}
            {activeSection === "indexing_abstracting" && (
              <IndexingForm data={content} onSave={handleSave} saving={saving} />
            )}
            {activeSection === "editorial_board" && (
              <EditorialBoardForm data={content} onSave={handleSave} saving={saving} />
            )}
            {activeSection === "contacts" && (
              <ContactsForm data={content} onSave={handleSave} saving={saving} />
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── Call For Papers Form ──────────────────────────────────────────────────
const CallForPapersForm = ({ data, onSave, saving }) => {
  const [form, setForm] = useState({
    volume: "12",
    issue: "2",
    submissionDeadline: "March 31, 2025",
    reviewNotification: "Within 4–6 weeks",
    publication: "June 2025",
    apc: "₹5,000 / $60 USD",
    ...data,
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium mb-1">Volume</label><input name="volume" value={form.volume} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Issue</label><input name="issue" value={form.issue} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Submission Deadline</label><input name="submissionDeadline" value={form.submissionDeadline} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Review Notification</label><input name="reviewNotification" value={form.reviewNotification} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Publication Date</label><input name="publication" value={form.publication} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">APC (Processing Charges)</label><input name="apc" value={form.apc} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
      </div>
      <button onClick={() => onSave(form)} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
};

// ─── Indexing Form ─────────────────────────────────────────────────────────
const IndexingForm = ({ data, onSave, saving }) => {
  const [items, setItems] = useState(
    Array.isArray(data) && data.length > 0 ? data : ["Scopus", "Web of Science", "DOAJ", "CrossRef", "Google Scholar", "PubMed"]
  );
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => { if (newItem.trim()) { setItems([...items, newItem.trim()]); setNewItem(""); } };
  const handleRemove = (idx) => setItems(items.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-gray-100 border rounded-full px-3 py-1 flex items-center gap-2 text-sm">
            {item}
            <button onClick={() => handleRemove(idx)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 max-w-sm">
        <input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder="Add new index name..." className="flex-1 border rounded px-3 py-2 text-sm" />
        <button onClick={handleAdd} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">+</button>
      </div>
      <button onClick={() => onSave(items)} disabled={saving} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
};

// ─── Editorial Board Form (Raw JSON wrapper for now for complex logic) ──────
const EditorialBoardForm = ({ data, onSave, saving }) => {
  const [jsonText, setJsonText] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (Object.keys(data || {}).length === 0) {
      // Default structure
      setJsonText(JSON.stringify({
        "Editor-in-Chief": [
          { name: "Prof. Dr. Rajesh Kumar", institution: "IIT Delhi", country: "India", specialization: "AI" }
        ],
        "Associate Editors": [],
        "Editorial Board Members": []
      }, null, 2));
    } else {
      setJsonText(JSON.stringify(data, null, 2));
    }
  }, [data]);

  const handleSave = () => {
    setErr("");
    try {
      const parsed = JSON.parse(jsonText);
      onSave(parsed);
    } catch (e) {
      setErr("Invalid JSON format");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
        Edit the categories and members here. Use strict JSON formatting.
      </p>
      {err && <div className="text-red-500 text-sm font-bold">{err}</div>}
      <textarea
        className="w-full h-96 p-4 border rounded font-mono text-sm bg-gray-50 focus:bg-white transition-colors"
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
      />
      <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50">
        {saving ? "Saving..." : "Save JSON"}
      </button>
    </div>
  );
};

// ─── Contacts Form ──────────────────────────────────────────────────────────
const ContactsForm = ({ data, onSave, saving }) => {
  const [jsonText, setJsonText] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (Object.keys(data || {}).length === 0) {
      setJsonText(JSON.stringify([
        { icon: "📧", label: "Editorial Email", value: "editor@ijart.org" },
        { icon: "📧", label: "Submissions", value: "submit@ijart.org" },
        { icon: "📞", label: "Phone", value: "+91 8072287692" },
        { icon: "📍", label: "Address", value: "Academic Research Press\\n123, Science Park, New Delhi – 110016, India" },
        { icon: "🕒", label: "Office Hours", value: "Mon–Fri, 9:00 AM – 5:30 PM IST" }
      ], null, 2));
    } else {
      setJsonText(JSON.stringify(data, null, 2));
    }
  }, [data]);

  const handleSave = () => {
    setErr("");
    try {
      const parsed = JSON.parse(jsonText);
      onSave(parsed);
    } catch (e) {
      setErr("Invalid JSON format");
    }
  };

  return (
    <div className="space-y-4">
       <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
        Edit the contact list using JSON. Each Object should have `icon`, `label`, and `value`.
      </p>
      {err && <div className="text-red-500 text-sm font-bold">{err}</div>}
      <textarea
        className="w-full h-80 p-4 border rounded font-mono text-sm bg-gray-50 focus:bg-white transition-colors"
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
      />
      <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50">
         {saving ? "Saving..." : "Save JSON"}
      </button>
    </div>
  );
};

export default SiteContentManager;
