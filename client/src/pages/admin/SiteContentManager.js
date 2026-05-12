import React, { useState, useEffect } from "react";
import { contentAPI } from "../../services/api";
import { Card, Spinner, Alert } from "../../components/common";
import { COUNTRIES } from "../../constants/countries";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

// Helper for unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

const SECTIONS = [
  { id: "call_for_papers", label: "Call for Papers" },
  { id: "indexing_abstracting", label: "Indexing & Abstracting" },
  { id: "editorial_board", label: "Editorial Board" },
  { id: "contacts", label: "Contacts" },
];

// ─── Sortable Wrapper Component ───────────────────────────────────────────
const SortableItem = ({ id, children, className = "" }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative group ${isDragging ? "shadow-2xl ring-2 ring-blue-500 rounded-xl bg-white" : ""} ${className}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-[-24px] sm:left-[-32px] top-1/2 -translate-y-1/2 p-2 text-gray-400 cursor-grab active:cursor-grabbing hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 z-20"
        title="Drag to reorder"
      >
        <GripVertical size={20} />
      </div>
      {children}
    </div>
  );
};

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
    
    // Clean up internal IDs before saving
    let cleanedValue = JSON.parse(JSON.stringify(value));
    
    const removeIds = (obj) => {
      if (Array.isArray(obj)) {
        obj.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            delete item.uId;
            removeIds(item);
          }
        });
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(val => removeIds(val));
      }
    };

    if (activeSection === "indexing_abstracting" && Array.isArray(cleanedValue)) {
      cleanedValue = cleanedValue.map(item => typeof item === 'object' ? item.name : item);
    } else {
      removeIds(cleanedValue);
    }

    try {
      await contentAPI.updateContent(activeSection, cleanedValue);
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
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 capitalize">
                Edit {activeSection.replace(/_/g, " ")}
              </h3>
              <p className="text-xs text-gray-400 italic">💡 Hint: Drag handle appears on hover to reorder rows</p>
            </div>
            
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
    indianAmount: 5000,
    internationalAmount: 50,
    announcementTitle: "📢 Submissions Now Open",
    announcementText: "IJEEQT invites original research manuscripts for Volume 12, Issue 2.",
    importantDates: [],
    ...data,
  });

  useEffect(() => {
    if (data) {
      setForm(prev => ({
        ...prev,
        ...data,
        importantDates: Array.isArray(data.importantDates) ? data.importantDates.map(d => ({ ...d, uId: d.uId || generateId() })) : (prev.importantDates || []),
      }));
    }
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setForm((prev) => {
        const oldIndex = prev.importantDates.findIndex((d) => d.uId === active.id);
        const newIndex = prev.importantDates.findIndex((d) => d.uId === over.id);
        return { ...prev, importantDates: arrayMove(prev.importantDates, oldIndex, newIndex) };
      });
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addImportantDate = () => {
    setForm({ 
      ...form, 
      importantDates: [...form.importantDates, { uId: generateId(), event: "New Event", date: "", done: false }] 
    });
  };

  const updateImportantDate = (uId, field, value) => {
    setForm({
      ...form,
      importantDates: form.importantDates.map(d => d.uId === uId ? { ...d, [field]: value } : d)
    });
  };

  const removeImportantDate = (uId) => {
    setForm({ 
      ...form, 
      importantDates: form.importantDates.filter(d => d.uId !== uId) 
    });
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
        <div><label className="block text-sm font-medium mb-1">Indian Amount (₹)</label><input type="number" name="indianAmount" value={form.indianAmount} onChange={(e) => setForm({...form, indianAmount: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full border rounded px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">International Amount ($)</label><input type="number" name="internationalAmount" value={form.internationalAmount} onChange={(e) => setForm({...form, internationalAmount: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full border rounded px-3 py-2" /></div>
      </div>

      <div className="p-4 border border-gray-200 rounded-xl space-y-4">
        <h4 className="font-bold text-gray-800">Announcement Banner</h4>
        <div><label className="block text-sm font-medium mb-1">Title</label><input name="announcementTitle" value={form.announcementTitle} onChange={handleChange} className="w-full border rounded px-3 py-2" /></div>
        <div><label className="block text-sm font-medium mb-1">Text</label><textarea name="announcementText" value={form.announcementText} onChange={handleChange} rows="2" className="w-full border rounded px-3 py-2" /></div>
      </div>

      <div className="p-4 sm:ml-8 border border-gray-200 rounded-xl space-y-4 bg-gray-50/50">
        <h4 className="font-bold text-gray-800">Important Dates List</h4>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={form.importantDates.map(d => d.uId)} strategy={verticalListSortingStrategy}>
            {form.importantDates?.map((d) => (
              <SortableItem key={d.uId} id={d.uId}>
                <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded border shadow-sm items-start sm:items-center">
                  <div className="w-full sm:w-1/2">
                    <label className="block text-xs text-gray-500 mb-1">Event Name</label>
                    <input value={d.event} onChange={(e) => updateImportantDate(d.uId, "event", e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                  </div>
                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs text-gray-500 mb-1">Date</label>
                    <input type="date" value={d.date} onChange={(e) => updateImportantDate(d.uId, "date", e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-center mt-2 sm:mt-5">
                    <label className="flex items-center text-sm mr-4 cursor-pointer">
                      <input type="checkbox" checked={d.done} onChange={(e) => updateImportantDate(d.uId, "done", e.target.checked)} className="mr-2" />
                      Done
                    </label>
                    <button onClick={() => removeImportantDate(d.uId)} className="text-red-500 hover:text-red-700 font-bold ml-auto">&times;</button>
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
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
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    const raw = Array.isArray(data) && data.length > 0 ? data : ["Scopus", "Web of Science", "DOAJ", "CrossRef", "Google Scholar", "PubMed"];
    setItems(raw.map(name => ({ uId: generateId(), name })));
  }, [data]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.uId === active.id);
        const newIndex = prev.findIndex((i) => i.uId === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleAdd = () => { if (newItem.trim()) { setItems([...items, { uId: generateId(), name: newItem.trim() }]); setNewItem(""); } };
  const handleRemove = (uId) => setItems(items.filter((i) => i.uId !== uId));

  return (
    <div className="space-y-4">
      <div className="sm:ml-8">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.uId)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2 mb-4 max-w-md">
              {items.map((item) => (
                <SortableItem key={item.uId} id={item.uId}>
                  <div className="bg-white border rounded-lg px-4 py-2 flex items-center justify-between shadow-sm">
                    <span className="text-sm font-medium">{item.name}</span>
                    <button onClick={() => handleRemove(item.uId)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      <div className="flex gap-2 max-w-sm ml-0 sm:ml-8">
        <input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder="Add new index name..." className="flex-1 border rounded px-3 py-2 text-sm" />
        <button onClick={handleAdd} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">Add</button>
      </div>
      <button onClick={() => onSave(items)} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50">
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
          uId: generateId(),
          category: "Editor-in-Chief",
          members: [{ uId: generateId(), name: "Prof. Dr. Rajesh Kumar", email: "editor@ijart.org", institution: "IIT Delhi", country: "India", specialization: "AI" }]
        }
      ]);
    } else {
      const arr = Object.keys(data || {}).map(key => {
        const membersRaw = data[key];
        const membersArray = Array.isArray(membersRaw) ? membersRaw : [];
        return {
          uId: generateId(),
          category: key,
          members: membersArray.map(m => (typeof m === 'object' && m !== null ? { ...m, uId: generateId() } : { uId: generateId(), name: String(m) }))
        };
      });
      setCategories(arr);
    }
  }, [data]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragCategory = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setCategories((prev) => {
        const oldIndex = prev.findIndex((c) => c.uId === active.id);
        const newIndex = prev.findIndex((c) => c.uId === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleDragMember = (catId, event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setCategories((prev) => prev.map(cat => {
        if (cat.uId !== catId) return cat;
        const oldIndex = cat.members.findIndex(m => m.uId === active.id);
        const newIndex = cat.members.findIndex(m => m.uId === over.id);
        return { ...cat, members: arrayMove(cat.members, oldIndex, newIndex) };
      }));
    }
  };

  const handleSave = () => {
    const output = {};
    categories.forEach(c => { if (c.category.trim()) output[c.category.trim()] = c.members; });
    onSave(output);
  };

  return (
    <div className="space-y-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragCategory}>
        <SortableContext items={categories.map(c => c.uId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-6 sm:ml-8">
            {categories.map((cat, cIdx) => (
              <SortableItem key={cat.uId} id={cat.uId}>
                <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-gray-200 pb-3">
                    <input 
                      value={cat.category} 
                      onChange={(e) => {
                        const newCats = [...categories];
                        newCats[cIdx].category = e.target.value;
                        setCategories(newCats);
                      }}
                      className="font-bold text-lg text-gray-800 bg-transparent px-1 py-1 outline-none focus:ring-2 focus:ring-blue-500 rounded w-full sm:max-w-sm transition-all border border-transparent hover:border-gray-300 focus:bg-white"
                      placeholder="Category Name"
                    />
                    <button onClick={() => setCategories(categories.filter(c => c.uId !== cat.uId))} className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-red-200 shrink-0">
                      Remove Category
                    </button>
                  </div>
                  
                  <div className="space-y-3 sm:ml-8">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragMember(cat.uId, e)}>
                      <SortableContext items={cat.members.map(m => m.uId)} strategy={verticalListSortingStrategy}>
                        {cat.members.map((mem, mIdx) => (
                          <SortableItem key={mem.uId} id={mem.uId}>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                              <div className="col-span-12 sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                <input value={mem.name} onChange={(e) => {
                                  const newCats = [...categories];
                                  newCats[cIdx].members[mIdx].name = e.target.value;
                                  setCategories(newCats);
                                }} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                              </div>
                              <div className="col-span-12 sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                <input value={mem.email || ""} onChange={(e) => {
                                  const newCats = [...categories];
                                  newCats[cIdx].members[mIdx].email = e.target.value;
                                  setCategories(newCats);
                                }} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Optional" />
                              </div>
                              <div className="col-span-12 sm:col-span-3">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Institution</label>
                                <input value={mem.institution} onChange={(e) => {
                                  const newCats = [...categories];
                                  newCats[cIdx].members[mIdx].institution = e.target.value;
                                  setCategories(newCats);
                                }} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                              </div>
                              <div className="col-span-12 sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
                                <select value={mem.country} onChange={(e) => {
                                  const newCats = [...categories];
                                  newCats[cIdx].members[mIdx].country = e.target.value;
                                  setCategories(newCats);
                                }} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
                                  <option value="">Select Country</option>
                                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              <div className="col-span-12 sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Specialization</label>
                                <input value={mem.specialization} onChange={(e) => {
                                  const newCats = [...categories];
                                  newCats[cIdx].members[mIdx].specialization = e.target.value;
                                  setCategories(newCats);
                                }} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                              </div>
                              <div className="col-span-12 sm:col-span-1 flex justify-center mt-2 sm:mt-5">
                                <button onClick={() => {
                                  const newCats = [...categories];
                                  newCats[cIdx].members.splice(mIdx, 1);
                                  setCategories(newCats);
                                }} className="text-gray-400 hover:text-red-500 transition-colors">&times;</button>
                              </div>
                            </div>
                          </SortableItem>
                        ))}
                      </SortableContext>
                    </DndContext>
                    <button onClick={() => {
                      const newCats = [...categories];
                      newCats[cIdx].members.push({ uId: generateId(), name: "", email: "", institution: "", country: "", specialization: "" });
                      setCategories(newCats);
                    }} className="mt-2 text-blue-600 hover:bg-blue-50 text-sm font-medium px-4 py-2 rounded-lg border border-dashed border-blue-200">
                      + Add Member
                    </button>
                  </div>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 mt-6">
        <button onClick={() => setCategories([...categories, { uId: generateId(), category: "New Category", members: [] }])} className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-semibold">
          + Add Category
        </button>
        <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold">
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
    const raw = Array.isArray(data) ? data : [
      { icon: "📧", label: "Editorial Email", value: "editor@ijart.org" },
      { icon: "📧", label: "Submissions", value: "submit@ijart.org" },
      { icon: "📞", label: "Phone", value: "+91 8072287692" },
      { icon: "📍", label: "Address", value: "Academic Research Press" }
    ];
    setContacts(raw.map(c => (typeof c === 'object' && c !== null ? { ...c, uId: generateId() } : { uId: generateId(), label: "Detail", value: String(c) })));
  }, [data]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setContacts((prev) => {
        const oldIndex = prev.findIndex((c) => c.uId === active.id);
        const newIndex = prev.findIndex((c) => c.uId === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const updateContact = (uId, field, val) => {
    setContacts(contacts.map(c => c.uId === uId ? { ...c, [field]: val } : c));
  };

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={contacts.map(c => c.uId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4 sm:ml-8">
            {contacts.map((contact) => (
              <SortableItem key={contact.uId} id={contact.uId}>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-stretch bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex-shrink-0">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Icon</label>
                    <input value={contact.icon} onChange={(e) => updateContact(contact.uId, "icon", e.target.value)} className="w-14 border border-gray-300 rounded-md px-2 py-2 text-center text-lg bg-white" />
                  </div>
                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
                    <input value={contact.label} onChange={(e) => updateContact(contact.uId, "label", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white font-medium" />
                  </div>
                  <div className="w-full sm:flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Value</label>
                    <textarea value={contact.value} onChange={(e) => updateContact(contact.uId, "value", e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white min-h-[42px]" rows={2} />
                  </div>
                  <div className="flex justify-end w-full sm:w-auto sm:self-center mt-2 sm:mt-5">
                    <button onClick={() => setContacts(contacts.filter(c => c.uId !== contact.uId))} className="text-gray-400 hover:text-red-500 transition-colors">&times;</button>
                  </div>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 mt-6">
        <button onClick={() => setContacts([...contacts, { uId: generateId(), icon: "📌", label: "New Detail", value: "" }])} className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 text-sm font-semibold">
          + Add Contact
        </button>
        <button onClick={() => onSave(contacts)} disabled={saving} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold">
          {saving ? "Saving..." : "Save Contacts"}
        </button>
      </div>
    </div>
  );
};

export default SiteContentManager;

