// src/pages/Home.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { papersAPI, contentAPI } from "../services/api";
import { PaperCard, Spinner, Card } from "../components/common";
import { formatDate } from "../utils/dateUtils";

const Home = () => {
  const [latestPapers, setLatestPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dynamic Content States
  const [statsData, setStatsData] = useState({
    publishedCount: 0,
    editorialCount: 0,
  });
  const [cfp, setCfp] = useState({
    volume: "12", issue: "2",
    submissionDeadline: "March 31, 2025",
    reviewNotification: "Within 4–6 weeks",
    publication: "June 2025",
    indianAmount: 5000,
    internationalAmount: 50,
  });
  const [indexing, setIndexing] = useState([
    "Scopus", "Web of Science", "DOAJ", "CrossRef", "Google Scholar", "PubMed"
  ]);
  const [showAllIndexing, setShowAllIndexing] = useState(false);

  useEffect(() => {
    papersAPI.getPublished()
      .then((res) => {
        const papers = res.papers || [];
        setStatsData((prev) => ({ ...prev, publishedCount: papers.length }));
        setLatestPapers(papers.slice(0, 3)); // Display latest 3
      })
      .catch(() => setLatestPapers([]))
      .finally(() => setLoading(false));

    // Fetch dynamic content
    contentAPI.getContent("call_for_papers").then((res) => setCfp(res.value)).catch(() => {});
    contentAPI.getContent("indexing_abstracting").then((res) => {
      if (res.value && res.value.length > 0) setIndexing(res.value);
    }).catch(() => {});
    contentAPI.getContent("editorial_board").then((res) => {
      if (res.value) {
        let count = 0;
        Object.values(res.value).forEach((members) => {
          if (Array.isArray(members)) count += members.length;
        });
        setStatsData((prev) => ({ ...prev, editorialCount: count }));
      }
    }).catch(() => {});
  }, []);

  const journalName = process.env.REACT_APP_JOURNAL_NAME || "International Journal of Engineering Excellence In Quantum Technologies";
  const abbr = process.env.REACT_APP_JOURNAL_ABBR || "IJEEQT";

  const stats = [
    { value: statsData.publishedCount.toString(), label: "Published Articles" },
    { value: statsData.editorialCount.toString(), label: "Editorial Board" },
    { value: "4.52", label: "Impact Factor" },
    { value: "120+", label: "Countries Reached" },
  ];

  const subjects = [
    "Computer Science & AI", "Electrical Engineering", "Mechanical Engineering",
    "Civil Engineering", "Biotechnology", "Environmental Science",
    "Materials Science", "Information Technology",
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-block bg-blue-700 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
              Open Access · Peer-Reviewed
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              {journalName}
            </h1>
            <p className="text-blue-100 text-base leading-relaxed mb-8">
              A premier international platform for publishing cutting-edge research
              in engineering, science, and technology. Indexed in Scopus, Web of Science,
              and DOAJ.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/submit-paper"
                className="bg-white text-blue-800 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                Submit Manuscript
              </Link>
              <Link
                to="/archives"
                className="border border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Archives
              </Link>
            </div>
          </div>

          {/* Announcement Box */}
          <div className="bg-blue-800 bg-opacity-50 rounded-xl p-6 border border-blue-600">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              Call for Papers — Volume {cfp.volume}, Issue {cfp.issue}
            </h3>
            <ul className="space-y-3 text-sm text-blue-100">
              <li className="flex gap-3">
                <span className="text-yellow-400 shrink-0">📅</span>
                <span><strong className="text-white">Submission Deadline:</strong> {formatDate(cfp.submissionDeadline)}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-400 shrink-0">🔬</span>
                <span><strong className="text-white">Review Notification:</strong> {cfp.reviewNotification}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-400 shrink-0">📖</span>
                <span><strong className="text-white">Publication:</strong> {formatDate(cfp.publication)}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-400 shrink-0">💰</span>
                <span><strong className="text-white">APC:</strong> ₹{(cfp.indianAmount || 5000).toLocaleString()} / ${cfp.internationalAmount || 50} USD</span>
              </li>
            </ul>
            <Link
              to="/call-for-papers"
              className="mt-5 inline-block text-xs font-semibold bg-yellow-400 text-blue-900 px-4 py-2 rounded-lg hover:bg-yellow-300 transition-colors"
            >
              View Full CFP →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-50 py-8 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-blue-800">{s.value}</p>
              <p className="text-gray-600 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-10">
        {/* Latest Papers */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900 border-l-4 border-blue-700 pl-3">
              Latest Publications
            </h2>
            <Link to="/archives" className="text-blue-600 text-sm hover:underline">
              View All Publications →
            </Link>
          </div>

          {loading ? (
            <Spinner center />
          ) : latestPapers.length > 0 ? (
            <div className="space-y-4">
              {latestPapers.map((p) => (
                <PaperCard key={p.id} paper={p} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-gray-500">
              <p className="text-4xl mb-3">📚</p>
              <p className="font-medium">No published papers yet.</p>
              <p className="text-sm mt-1">Be the first to submit your research!</p>
              <Link to="/submit-paper" className="mt-4 inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
                Submit Paper
              </Link>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Scope */}
          <Card className="p-5">
            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide border-b pb-2">
              Subjects Covered
            </h3>
            <ul className="space-y-1">
              {subjects.map((s) => (
                <li key={s} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>

          {/* Indexing */}
          <Card className="p-5">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                Indexing & Abstracting
              </h3>
              {indexing.length > 0 && (
                <button onClick={() => setShowAllIndexing(true)} className="text-blue-600 text-xs font-semibold hover:underline bg-blue-50 px-2 py-1 rounded">
                  View All →
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {indexing.slice(0, 6).map((idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded text-xs text-center py-2 font-medium text-gray-700">
                  {idx}
                </div>
              ))}
            </div>
          </Card>

          {/* Submit CTA */}
          <div className="bg-blue-700 text-white rounded-lg p-5">
            <h3 className="font-bold mb-2">Ready to Publish?</h3>
            <p className="text-blue-100 text-sm mb-4">
              Submit your manuscript for peer review. Fast turnaround, rigorous process.
            </p>
            <Link
              to="/submit-paper"
              className="block text-center bg-white text-blue-700 font-semibold text-sm py-2 rounded hover:bg-blue-50 transition-colors"
            >
              Submit Now
            </Link>
          </div>
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
    </div>
  );
};

export default Home;
