// src/pages/Archives.js
import React, { useEffect, useState } from "react";
import { papersAPI } from "../services/api";
import { PageHero, PaperCard, Spinner, EmptyState } from "../components/common";

const Archives = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVolume, setSelectedVolume] = useState("all");
  const [selectedIssue, setSelectedIssue] = useState("all");

  useEffect(() => {
    papersAPI.getPublished()
      .then((res) => setPapers(res.papers || []))
      .catch(() => setPapers([]))
      .finally(() => setLoading(false));
  }, []);

  // Derive available volumes/issues from papers
  const volumes = [...new Set(papers.map((p) => p.volume).filter(Boolean))].sort((a, b) => b - a);
  const issues = [...new Set(
    papers.filter((p) => selectedVolume === "all" || p.volume === Number(selectedVolume))
      .map((p) => p.issue).filter(Boolean)
  )].sort((a, b) => b - a);

  const filtered = papers.filter((p) => {
    if (selectedVolume !== "all" && p.volume !== Number(selectedVolume)) return false;
    if (selectedIssue !== "all" && p.issue !== Number(selectedIssue)) return false;
    return true;
  });

  return (
    <div>
      <PageHero title="Archives" subtitle="Browse all published volumes and issues." breadcrumb="Home / Archives" />
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={selectedVolume}
            onChange={(e) => { setSelectedVolume(e.target.value); setSelectedIssue("all"); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Volumes</option>
            {volumes.map((v) => <option key={v} value={v}>Volume {v}</option>)}
          </select>
          <select
            value={selectedIssue}
            onChange={(e) => setSelectedIssue(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Issues</option>
            {issues.map((i) => <option key={i} value={i}>Issue {i}</option>)}
          </select>
          <span className="text-sm text-gray-500 self-center ml-2">
            {filtered.length} article{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <Spinner center />
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((p) => <PaperCard key={p.id} paper={p} />)}
          </div>
        ) : (
          <EmptyState
            title="No published papers"
            message="Papers will appear here once published by the editorial team."
          />
        )}
      </div>
    </div>
  );
};

export default Archives;
