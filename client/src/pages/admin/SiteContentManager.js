import React, { useState, useEffect } from "react";
import { contentAPI } from "../../services/api";
import { Card, Spinner, Alert } from "../../components/common";
import { COUNTRIES } from "../../constants/countries";

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
    submissionDeadline: "2025-03-31",
    reviewNotification: "Within 4–6 weeks",
    publication: "2025-06-30",
    apc: "₹5,000 / $60 USD",
    announcementTitle: "📢 Submissions Now Open",
    announcementText: "IJEEQT invites original research manuscripts for Volume 12, Issue 2. All accepted papers will be published online immediately upon acceptance.",
    importantDates: [
      { event: "Submission Portal Opens", date: "2025-01-01", done: true },
      { event: "Full Paper Submission Deadline", date: "2025-03-31", done: false },
      { event: "Review Notification", date: "2025-05-15", done: false },
      { event: "Revised Manuscript Due", date: "2025-06-01", done: false },
      { event: "Final Acceptance Notification", date: "2025-06-10", done: false },
      { event: "Publication Date", date: "2025-06-30", done: false },
    ],
    ...data,
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addImportantDate = () => {
    setForm({ ...form, importantDates: [...form.importantDates, { event: "New Event", date: "", done: false }] });
  };

  const updateImportantDate = (idx, field, value) => {
    const newDates = [...form.importantDates];
    newDates[idx][field] = value;
    setForm({ ...form, importantDates: newDates });
  };

  const removeImportantDate = (idx) => {
    const newDates = [...form.importantDates];
    newDates.splice(idx, 1);
    setForm({ ...form, importantDates: newDates });
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4 p-4 border border-gray-200 bg-gray-50 rounded-xl">
        <h4 className="sm:col-span-2 font-bold text-gray-800">Basic Information</h4>
        <div><label className="block text-sm font-medium mb-1">Volume</label><input name="volume" value={form.volume} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Issue</label><input name="issue" value={form.issue} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Submission Deadline</label><input type="date" name="submissionDeadline" value={form.submissionDeadline} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Review Notification</label><input name="reviewNotification" value={form.reviewNotification} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Publication Date</label><input type="date" name="publication" value={form.publication} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">APC (Processing Charges)</label><input name="apc" value={form.apc} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
      </div>

      <div className="p-4 border border-gray-200 rounded-xl space-y-4">
        <h4 className="font-bold text-gray-800">Announcement Banner</h4>
        <div><label className="block text-sm font-medium mb-1">Title</label><input name="announcementTitle" value={form.announcementTitle} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Text</label><textarea name="announcementText" value={form.announcementText} onChange={handleChange} rows="2" className="w-full border rounded px-3 py-2" /></div>
      </div>

      <div className="p-4 border border-gray-200 rounded-xl space-y-4 bg-gray-50/50">
        <h4 className="font-bold text-gray-800">Important Dates List</h4>
        {form.importantDates?.map((d, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded border shadow-sm items-start sm:items-center">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs text-gray-500 mb-1">Event Name</label>
              <input value={d.event} onChange={(e) => updateImportantDate(idx, "event", e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div className="w-full sm:w-1/3">
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input type="date" value={d.date} onChange={(e) => updateImportantDate(idx, "date", e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center mt-2 sm:mt-5">
              <label className="flex items-center text-sm mr-4 cursor-pointer">
                <input type="checkbox" checked={d.done} onChange={(e) => updateImportantDate(idx, "done", e.target.checked)} className="mr-2" />
                Done
              </label>
              <button onClick={() => removeImportantDate(idx)} className="text-red-500 hover:text-red-700 font-bold ml-auto">&times;</button>
            </div>
          </div>
        ))}
        <button onClick={addImportantDate} className="text-blue-600 border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded text-sm font-medium">
          + Add Date
        </button>
      </div>

      <button onClick={() => onSave(form)} disabled={saving} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 font-medium">
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
        <button onClick={handleAdd} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">Add</button>
      </div>
      <button onClick={() => onSave(items)} disabled={saving} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
};

// ─── Editorial Board Form ──────────────────────────────────────────────────
const EditorialBoardForm = ({ data, onSave, saving }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!data || Object.keys(data).length === 0) {
      setCategories([
        {
          category: "Editor-in-Chief",
          members: [{ name: "Prof. Dr. Rajesh Kumar", institution: "IIT Delhi", country: "India", specialization: "AI" }]
        },
        { category: "Associate Editors", members: [] },
        { category: "Editorial Board Members", members: [] }
      ]);
    } else {
      const arr = Object.keys(data).map(key => ({
        category: key,
        members: data[key] || []
      }));
      setCategories(arr);
    }
  }, [data]);

  const handleSave = () => {
    const output = {};
    categories.forEach(c => {
      if (c.category.trim()) {
        output[c.category.trim()] = c.members;
      }
    });
    onSave(output);
  };

  const addCategory = () => setCategories([...categories, { category: "New Category", members: [] }]);
  
  const removeCategory = (idx) => {
    const newCats = [...categories];
    newCats.splice(idx, 1);
    setCategories(newCats);
  };

  const updateCategoryName = (idx, val) => {
    const newCats = [...categories];
    newCats[idx].category = val;
    setCategories(newCats);
  };

  const addMember = (catIdx) => {
    const newCats = [...categories];
    newCats[catIdx].members.push({ name: "", institution: "", country: "", specialization: "" });
    setCategories(newCats);
  };

  const removeMember = (catIdx, memIdx) => {
    const newCats = [...categories];
    newCats[catIdx].members.splice(memIdx, 1);
    setCategories(newCats);
  };

  const updateMember = (catIdx, memIdx, field, val) => {
    const newCats = [...categories];
    newCats[catIdx].members[memIdx][field] = val;
    setCategories(newCats);
  };

  return (
    <div className="space-y-6">
      {categories.map((cat, cIdx) => (
        <div key={cIdx} className="border border-gray-200 rounded-xl p-5 bg-gray-50/50 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-gray-200 pb-3">
            <input 
              value={cat.category} 
              onChange={(e) => updateCategoryName(cIdx, e.target.value)}
              className="font-bold text-lg text-gray-800 bg-transparent px-1 py-1 outline-none focus:ring-2 focus:ring-blue-500 rounded w-full sm:max-w-sm transition-all border border-transparent hover:border-gray-300 focus:bg-white"
              placeholder="Category Name (e.g. Associate Editors)"
            />
            <button onClick={() => removeCategory(cIdx)} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-red-200 shrink-0">
              Remove Category
            </button>
          </div>
          
          <div className="space-y-3">
            {cat.members.length === 0 && (
              <p className="text-sm text-gray-400 italic px-2">No members in this category.</p>
            )}
            {cat.members.map((mem, mIdx) => (
              <div key={mIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative group">
                <div className="col-span-12 sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input placeholder="Prof. John Doe" value={mem.name} onChange={(e) => updateMember(cIdx, mIdx, "name", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="col-span-12 sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Institution</label>
                  <input placeholder="University Name" value={mem.institution} onChange={(e) => updateMember(cIdx, mIdx, "institution", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="col-span-12 sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
                  <select 
                    value={mem.country} 
                    onChange={(e) => updateMember(cIdx, mIdx, "country", e.target.value)} 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-12 sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Specialization</label>
                  <input placeholder="Area of research" value={mem.specialization} onChange={(e) => updateMember(cIdx, mIdx, "specialization", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="col-span-12 sm:col-span-1 flex justify-end sm:justify-center mt-2 sm:mt-5">
                  <button onClick={() => removeMember(cIdx, mIdx)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" title="Remove Member">
                    <span className="text-xl leading-none">&times;</span>
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => addMember(cIdx)} className="mt-2 text-blue-600 hover:bg-blue-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-dashed border-blue-200 hover:border-blue-300 inline-flex items-center gap-2">
              <span>+</span> Add Member
            </button>
          </div>
        </div>
      ))}
      
      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 mt-6">
        <button onClick={addCategory} className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-semibold transition-colors">
          + Add Category
        </button>
        <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold transition-colors flex items-center gap-2">
          {saving ? "Saving..." : "Save Editorial Board"}
        </button>
      </div>
    </div>
  );
};

// ─── Contacts Form ──────────────────────────────────────────────────────────
const ContactsForm = ({ data, onSave, saving }) => {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    if (!data || Object.keys(data).length === 0) {
      setContacts([
        { icon: "📧", label: "Editorial Email", value: "editor@ijart.org" },
        { icon: "📧", label: "Submissions", value: "submit@ijart.org" },
        { icon: "📞", label: "Phone", value: "+91 8072287692" },
        { icon: "📍", label: "Address", value: "Academic Research Press\n123, Science Park, New Delhi – 110016, India" },
        { icon: "🕒", label: "Office Hours", value: "Mon–Fri, 9:00 AM – 5:30 PM IST" }
      ]);
    } else {
      setContacts(data);
    }
  }, [data]);

  const handleSave = () => {
    onSave(contacts);
  };

  const addContact = () => setContacts([...contacts, { icon: "📌", label: "New Detail", value: "" }]);
  
  const removeContact = (idx) => {
    const newContacts = [...contacts];
    newContacts.splice(idx, 1);
    setContacts(newContacts);
  };

  const updateContact = (idx, field, val) => {
    const newContacts = [...contacts];
    newContacts[idx][field] = val;
    setContacts(newContacts);
  };

  return (
    <div className="space-y-4">
      {contacts.map((contact, idx) => (
        <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-stretch bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex-shrink-0">
            <label className="block text-xs font-medium text-gray-500 mb-1">Icon</label>
            <input 
              placeholder="Emoji" 
              value={contact.icon} 
              onChange={(e) => updateContact(idx, "icon", e.target.value)} 
              className="w-14 border border-gray-300 rounded-md px-2 py-2 text-center text-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" 
              title="Emoji or icon"
            />
          </div>
          <div className="w-full sm:w-1/3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
            <input 
              placeholder="e.g. Phone" 
              value={contact.label} 
              onChange={(e) => updateContact(idx, "label", e.target.value)} 
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium" 
            />
          </div>
          <div className="w-full sm:flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Value</label>
            <textarea 
              placeholder="Enter contact detail..." 
              value={contact.value} 
              onChange={(e) => updateContact(idx, "value", e.target.value)} 
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-h-[42px]" 
              rows={2}
            />
          </div>
          <div className="flex justify-end w-full sm:w-auto sm:self-center mt-2 sm:mt-5">
            <button onClick={() => removeContact(idx)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" title="Remove Contact">
              <span className="text-2xl leading-none">&times;</span>
            </button>
          </div>
        </div>
      ))}
      
      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 mt-6">
        <button onClick={addContact} className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-semibold transition-colors">
          + Add Contact
        </button>
        <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold transition-colors flex items-center gap-2">
          {saving ? "Saving..." : "Save Contacts"}
        </button>
      </div>
    </div>
  );
};

export default SiteContentManager;
