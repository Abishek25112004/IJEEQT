// src/pages/Contact.js
import React, { useState, useEffect } from "react";
import { PageHero, Alert, Card, Spinner } from "../components/common";
import { contentAPI } from "../services/api";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [contacts, setContacts] = useState([
    { icon: "📧", label: "Editorial Email", value: "editor@ijart.org" },
    { icon: "📧", label: "Submissions", value: "submit@ijart.org" },
    { icon: "📞", label: "Phone", value: "+91 8072287692" },
    { icon: "📍", label: "Address", value: "Academic Research Press\n123, Science Park, New Delhi – 110016, India" },
    { icon: "🕒", label: "Office Hours", value: "Mon–Fri, 9:00 AM – 5:30 PM IST" },
  ]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  useEffect(() => {
    contentAPI.getContent("contacts")
      .then((res) => setContacts(res.value))
      .catch(() => {})
      .finally(() => setLoadingContacts(false));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission (connect to backend/email service as needed)
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div>
      <PageHero title="Contact Us" subtitle="Get in touch with the editorial team." breadcrumb="Home / Contact" />
      <div className="max-w-5xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-10">

        {/* Contact Info */}
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-gray-900 border-l-4 border-blue-700 pl-3">Editorial Office</h2>
          <div className="space-y-4 text-sm text-gray-700">
            {loadingContacts ? <Spinner center /> : contacts.map((c) => (
              <div key={c.label} className="flex gap-3">
                <span className="text-xl shrink-0">{c.icon}</span>
                <div>
                  <p className="font-semibold text-gray-600 text-xs uppercase tracking-wide">{c.label}</p>
                  <p className="whitespace-pre-line">{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm font-semibold text-blue-800 mb-1">For Authors</p>
            <p className="text-sm text-blue-700">
              For submission status queries, contact <strong>submit@ijart.org</strong> with your paper ID.
            </p>
          </Card>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm font-semibold text-blue-800 mb-1">For Reviewers</p>
            <p className="text-sm text-blue-700">
              To join the reviewer panel, email <strong>reviewers@ijart.org</strong> with your CV and areas of expertise.
            </p>
          </Card>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 border-l-4 border-blue-700 pl-3 mb-5">Send a Message</h2>

          {submitted ? (
            <Alert
              type="success"
              message="Your message has been sent! Our editorial team will respond within 2–3 business days."
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name: "name", label: "Your Name", type: "text", placeholder: "Dr. Jane Doe" },
                { name: "email", label: "Email Address", type: "email", placeholder: "jane@university.edu" },
                { name: "subject", label: "Subject", type: "text", placeholder: "Query about submission" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.name]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                    placeholder={f.placeholder}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  rows={5}
                  placeholder="Write your message here..."
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-60 transition-colors text-sm"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
