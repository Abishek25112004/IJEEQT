// src/components/layout/Footer.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { contentAPI } from "../../services/api";

const Footer = () => {
  const journalName = process.env.REACT_APP_JOURNAL_NAME || "International Journal of Engineering Excellence in Quantum Technology";
  const abbr = process.env.REACT_APP_JOURNAL_ABBR || "IJEEQT";

  const [indexing, setIndexing] = useState([
    "Scopus", "Web of Science", "DOAJ", "CrossRef", "Google Scholar"
  ]);
  const [showAllIndexing, setShowAllIndexing] = useState(false);

  useEffect(() => {
    contentAPI.getContent("indexing_abstracting").then((res) => {
      if (res.value && res.value.length > 0) setIndexing(res.value);
    }).catch(() => {});
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Journal Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">{abbr.slice(0, 4)}</span>
              </div>
              <h3 className="text-white font-semibold text-sm">{journalName}</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              A peer-reviewed, open-access international journal publishing high-quality
              research across all domains of engineering, science, and technology.
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>ISSN (Online): 2XXX-XXXX</p>
              <p>Frequency: Quarterly</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: "/about", label: "About Journal" },
                { to: "/editorial-board", label: "Editorial Board" },
                { to: "/call-for-papers", label: "Call for Papers" },
                { to: "/author-guidelines", label: "Author Guidelines" },
                { to: "/archives", label: "Archives" },
                { to: "/contact", label: "Contact Us" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-gray-400 hover:text-blue-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Authors */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">For Authors</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: "/submit-paper", label: "Submit Manuscript" },
                { to: "/author-guidelines", label: "Submission Guidelines" },
                { to: "/dashboard", label: "Track Submission" },
                { to: "/contact", label: "Author Support" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-gray-400 hover:text-blue-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Indexing */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-white font-semibold text-xs uppercase tracking-wider">Indexed In</h4>
                {indexing.length > 4 && (
                  <button onClick={() => setShowAllIndexing(true)} className="text-blue-400 text-xs hover:underline">
                    View All
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {indexing.slice(0, 4).map((idx) => (
                  <span key={idx} className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded">
                    {idx}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} {abbr}. All rights reserved.</p>
        </div>
      </div>

      {/* View All Indexing Modal */}
      {showAllIndexing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="font-bold text-lg text-gray-900">Indexing & Abstracting ({indexing.length})</h3>
              <button onClick={() => setShowAllIndexing(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {indexing.map((idx, i) => (
                  <div key={i} className="bg-blue-50 border border-blue-100 text-blue-800 rounded px-3 py-1.5 text-sm font-medium">
                    {idx}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
