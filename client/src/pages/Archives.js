// src/pages/Archives.js
import React, { useEffect, useState, useMemo } from "react";
import { papersAPI } from "../services/api";
import { PageHero, PaperCard, Spinner, EmptyState } from "../components/common";

const Archives = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedVolume, setSelectedVolume] = useState("all");
  const [selectedIssue, setSelectedIssue] = useState("all");

  useEffect(() => {
    papersAPI.getPublished()
      .then((res) => setPapers(res.papers || []))
      .catch(() => setPapers([]))
      .finally(() => setLoading(false));
  }, []);

  // Derive available year, volume, issue options from papers (sorted desc)
  const years = useMemo(
    () => [...new Set(papers.map((p) => p.year).filter(Boolean))].sort((a, b) => b - a),
    [papers]
  );

  const volumes = useMemo(
    () =>
      [...new Set(
        papers
          .filter((p) => selectedYear === "all" || p.year === Number(selectedYear))
          .map((p) => p.volume)
          .filter(Boolean)
      )].sort((a, b) => b - a),
    [papers, selectedYear]
  );

  const issues = useMemo(
    () =>
      [...new Set(
        papers
          .filter(
            (p) =>
              (selectedYear === "all" || p.year === Number(selectedYear)) &&
              (selectedVolume === "all" || p.volume === Number(selectedVolume))
          )
          .map((p) => p.issue)
          .filter(Boolean)
      )].sort((a, b) => b - a),
    [papers, selectedYear, selectedVolume]
  );

  const filtered = useMemo(
    () =>
      papers.filter((p) => {
        if (selectedYear !== "all" && p.year !== Number(selectedYear)) return false;
        if (selectedVolume !== "all" && p.volume !== Number(selectedVolume)) return false;
        if (selectedIssue !== "all" && p.issue !== Number(selectedIssue)) return false;
        return true;
      }),
    [papers, selectedYear, selectedVolume, selectedIssue]
  );

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    setSelectedVolume("all");
    setSelectedIssue("all");
  };

  const handleVolumeChange = (e) => {
    setSelectedVolume(e.target.value);
    setSelectedIssue("all");
  };

  return (
    <div>
      <PageHero title="Archives" subtitle="Browse all published volumes and issues." breadcrumb="Home / Archives" />
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          {/* Year filter */}
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Volume filter */}
          <select
            value={selectedVolume}
            onChange={handleVolumeChange}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Volumes</option>
            {volumes.map((v) => (
              <option key={v} value={v}>Volume {v}</option>
            ))}
          </select>

          {/* Issue filter */}
          <select
            value={selectedIssue}
            onChange={(e) => setSelectedIssue(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Issues</option>
            {issues.map((i) => (
              <option key={i} value={i}>Issue {i}</option>
            ))}
          </select>

          <span className="text-sm text-gray-500 self-center">
            {filtered.length} article{filtered.length !== 1 ? "s" : ""}
            {selectedYear !== "all" && ` · ${selectedYear}`}
            {selectedVolume !== "all" && ` · Vol. ${selectedVolume}`}
            {selectedIssue !== "all" && ` · Issue ${selectedIssue}`}
          </span>

          {/* Clear filters */}
          {(selectedYear !== "all" || selectedVolume !== "all" || selectedIssue !== "all") && (
            <button
              onClick={() => { setSelectedYear("all"); setSelectedVolume("all"); setSelectedIssue("all"); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
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
            message={
              selectedYear !== "all" || selectedVolume !== "all" || selectedIssue !== "all"
                ? "No papers match the selected filters."
                : "Papers will appear here once published by the editorial team."
            }
          />
        )}
      </div>
    </div>
  );
};

export default Archives;
