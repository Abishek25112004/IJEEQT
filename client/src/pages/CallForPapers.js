// src/pages/CallForPapers.js
import React from "react";
import { Link } from "react-router-dom";
import { PageHero, Card } from "../components/common";

const CallForPapers = () => (
  <div>
    <PageHero title="Call for Papers" subtitle="Volume 12, Issue 2 — June 2025" breadcrumb="Home / Call for Papers" />
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">

      {/* Announcement banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-r-lg">
        <p className="font-bold text-yellow-800 text-sm">📢 Submissions Now Open</p>
        <p className="text-yellow-700 text-sm mt-1">
          IJEEQT invites original research manuscripts for Volume 12, Issue 2. All accepted papers
          will be published online immediately upon acceptance.
        </p>
      </div>

      {/* Important Dates */}
      <Card className="p-5">
        <h2 className="text-base font-bold text-blue-800 mb-4">Important Dates</h2>
        <div className="space-y-3">
          {[
            { event: "Submission Portal Opens", date: "January 1, 2025", done: true },
            { event: "Full Paper Submission Deadline", date: "March 31, 2025", done: false },
            { event: "Review Notification", date: "May 15, 2025", done: false },
            { event: "Revised Manuscript Due", date: "June 1, 2025", done: false },
            { event: "Final Acceptance Notification", date: "June 10, 2025", done: false },
            { event: "Publication Date", date: "June 30, 2025", done: false },
          ].map((d) => (
            <div key={d.event} className="flex justify-between items-center border-b border-gray-100 pb-3 last:border-0">
              <span className={`text-sm flex items-center gap-2 ${d.done ? "text-gray-400 line-through" : "text-gray-700"}`}>
                {d.done ? "✅" : "🔹"} {d.event}
              </span>
              <span className={`text-sm font-semibold ${d.done ? "text-gray-400" : "text-blue-700"}`}>{d.date}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Topics */}
      <Card className="p-5">
        <h2 className="text-base font-bold text-blue-800 mb-4">Topics of Interest</h2>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
          {[
            "Artificial Intelligence & Machine Learning",
            "Internet of Things (IoT)",
            "Cloud Computing & Big Data",
            "Cybersecurity & Cryptography",
            "Renewable Energy Systems",
            "Biomedical Engineering",
            "Robotics & Automation",
            "Advanced Materials & Nanotechnology",
            "Civil & Structural Engineering",
            "Environmental Science & Sustainability",
            "Signal Processing & Communications",
            "VLSI & Embedded Systems",
          ].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              {t}
            </div>
          ))}
        </div>
      </Card>

      {/* Submission info */}
      <Card className="p-5">
        <h2 className="text-base font-bold text-blue-800 mb-3">Submission Information</h2>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• Papers must be submitted electronically via our online submission system.</p>
          <p>• All papers must be in IEEE format (PDF, max 10 MB).</p>
          <p>• Abstract should be 150–250 words; full paper should be 4–8 pages.</p>
          <p>• All submissions will be plagiarism-checked (iThenticate).</p>
          <p>• Blind review: author details must not appear in the submitted manuscript.</p>
        </div>
        <Link
          to="/submit-paper"
          className="mt-5 inline-flex items-center gap-2 bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-blue-800 transition-colors"
        >
          Submit Your Paper →
        </Link>
      </Card>
    </div>
  </div>
);

export default CallForPapers;
