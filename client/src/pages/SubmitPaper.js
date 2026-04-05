// src/pages/SubmitPaper.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { papersAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { PageHero, Alert, Spinner } from "../components/common";

const SubmitPaper = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    abstract: "",
    keywords: "",
    authorName: profile?.name || "",
    authorEmail: user?.email || "",
    institution: profile?.institution || "",
    coAuthors: [{ name: "", email: "", institution: "" }],
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCoAuthorChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.coAuthors];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, coAuthors: updated };
    });
  };

  const addCoAuthor = () => {
    setForm((prev) => ({
      ...prev,
      coAuthors: [...prev.coAuthors, { name: "", email: "", institution: "" }],
    }));
  };

  const removeCoAuthor = (index) => {
    setForm((prev) => ({
      ...prev,
      coAuthors: prev.coAuthors.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim() || !form.abstract.trim() || !form.keywords.trim()) {
      setError("Title, abstract, and keywords are required.");
      return;
    }
    if (form.abstract.split(/\s+/).length < 50) {
      setError("Abstract must be at least 50 words.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === "coAuthors") {
          formData.append(key, JSON.stringify(val));
        } else {
          formData.append(key, val);
        }
      });
      if (pdfFile) formData.append("pdf", pdfFile);

      const res = await papersAPI.submit(formData);
      setSuccess(`Paper submitted successfully! Your Paper ID: ${res.paperId}. You can track the status from your dashboard.`);
      setTimeout(() => navigate("/dashboard"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sign In Required</h2>
        <p className="text-gray-600 text-sm mb-5">You need to be logged in to submit a paper.</p>
        <Link to="/login" className="bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-800">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHero title="Submit Manuscript" subtitle="Submit your research paper for peer review." breadcrumb="Home / Submit Paper" />
      <div className="max-w-3xl mx-auto px-4 py-10">

        {error && <Alert type="error" message={error} onClose={() => setError("")} />}
        {success && <Alert type="success" message={success} />}

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">

          {/* Paper Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-800 border-b pb-2">Manuscript Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paper Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter the full title of your manuscript"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Abstract <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-2">(150–300 words)</span>
              </label>
              <textarea
                name="abstract"
                value={form.abstract}
                onChange={handleChange}
                rows={6}
                placeholder="Write a structured abstract summarizing the research problem, methodology, results, and conclusions..."
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Word count: {form.abstract.trim() ? form.abstract.trim().split(/\s+/).length : 0}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-2">(comma-separated, 4–8 terms)</span>
              </label>
              <input
                type="text"
                name="keywords"
                value={form.keywords}
                onChange={handleChange}
                placeholder="e.g. machine learning, neural networks, image classification"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Manuscript (PDF) <span className="text-gray-400 font-normal">— Max 10MB</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  {pdfFile ? (
                    <div>
                      <p className="text-green-600 font-medium text-sm">✅ {pdfFile.name}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB — Click to change
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-4xl mb-2">📄</p>
                      <p className="text-sm font-medium text-gray-700">Click to upload PDF</p>
                      <p className="text-xs text-gray-400 mt-1">PDF format only, max 10MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Corresponding Author */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-800 border-b pb-2">Corresponding Author</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { name: "authorName", label: "Full Name", placeholder: "Dr. John Smith", required: true },
                { name: "authorEmail", label: "Email", placeholder: "john@university.edu", required: true, type: "email" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                  <input
                    type={f.type || "text"}
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    required={f.required}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institution / Affiliation</label>
              <input
                type="text"
                name="institution"
                value={form.institution}
                onChange={handleChange}
                placeholder="e.g. Indian Institute of Technology, Delhi"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Co-Authors */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-base font-bold text-gray-800">Co-Authors</h2>
              <button
                type="button"
                onClick={addCoAuthor}
                className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-100 transition"
              >
                + Add Co-Author
              </button>
            </div>

            {form.coAuthors.map((ca, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-4 relative">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Co-Author {idx + 1}</span>
                  {form.coAuthors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCoAuthor(idx)}
                      className="text-red-500 text-xs hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { field: "name", placeholder: "Full Name" },
                    { field: "email", placeholder: "Email" },
                    { field: "institution", placeholder: "Institution" },
                  ].map((f) => (
                    <input
                      key={f.field}
                      type="text"
                      value={ca[f.field]}
                      onChange={(e) => handleCoAuthorChange(idx, f.field, e.target.value)}
                      placeholder={f.placeholder}
                      className="border border-gray-200 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Declarations */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-bold text-gray-700">Declarations</h2>
            {[
              "This manuscript has not been published and is not under review elsewhere.",
              "All authors have approved the submission and take responsibility for the content.",
              "The research complies with all ethical guidelines.",
              "I agree to pay the Article Processing Charge (APC) upon acceptance.",
            ].map((dec) => (
              <label key={dec} className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" required className="mt-0.5 accent-blue-600" />
                <span className="text-xs text-gray-600">{dec}</span>
              </label>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner size="sm" /> Submitting...</> : "Submit Manuscript"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmitPaper;
