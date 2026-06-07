// src/pages/EditorialBoard.js
import React, { useState, useEffect } from "react";
import { PageHero, Card, Spinner } from "../components/common";
import { contentAPI } from "../services/api";

const DEFAULT_BOARD = {
  "Editor-in-Chief": [
    {
      name: "Prof. Dr. Rajesh Kumar",
      role: "Editor-in-Chief",
      institution: "Indian Institute of Technology, Delhi",
      country: "India",
      specialization: "Artificial Intelligence, Machine Learning",
    },
  ],
  "Associate Editors": [
    {
      name: "Dr. Sarah Johnson",
      institution: "MIT, Cambridge",
      country: "USA",
      specialization: "Computer Vision, Deep Learning",
    },
    {
      name: "Prof. Hiroshi Tanaka",
      institution: "University of Tokyo",
      country: "Japan",
      specialization: "Robotics, Control Systems",
    },
    {
      name: "Dr. Maria Garcia",
      email: "m.garcia@upm.es",
      institution: "Technical University of Madrid",
      country: "Spain",
      specialization: "Renewable Energy Systems",
    },
  ],
  "Editorial Board Members": [
    { name: "Prof. David Chen", email: "d.chen@stanford.edu", institution: "Stanford University", country: "USA", specialization: "Nanomaterials" },
    { name: "Dr. Amara Diallo", email: "a.diallo@ucad.sn", institution: "University of Dakar", country: "Senegal", specialization: "Biomedical Engineering" },
    { name: "Prof. Elena Petrova", email: "e.petrova@mstu.ru", institution: "Moscow State Technical University", country: "Russia", specialization: "Applied Mathematics" },
    { name: "Dr. James Wilson", email: "j.wilson@cam.ac.uk", institution: "University of Cambridge", country: "UK", specialization: "Structural Engineering" },
    { name: "Prof. Li Wei", email: "li.wei@tsinghua.edu.cn", institution: "Tsinghua University", country: "China", specialization: "Electronics & VLSI" },
    { name: "Dr. Fatima Al-Hassan", email: "f.alhassan@kaust.edu.sa", institution: "King Abdullah University", country: "Saudi Arabia", specialization: "Chemical Engineering" },
    { name: "Prof. Carlos Mendez", email: "c.mendez@usp.br", institution: "University of São Paulo", country: "Brazil", specialization: "Environmental Engineering" },
    { name: "Dr. Ananya Sharma", email: "a.sharma@iisc.ac.in", institution: "IISc Bangalore", country: "India", specialization: "Computational Biology" },
  ],
};

const MemberCard = ({ member }) => (
  <Card className="p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
        {(member?.name || "U").split(" ").pop()[0] || "U"}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 text-sm leading-snug">{member.name}</p>
        <p className="text-gray-600 text-xs mt-0.5">{member.institution}</p>
        {member.email && (
          <a href={`mailto:${member.email}`} className="text-blue-500 hover:underline text-[10px] block mt-0.5">
            {member.email}
          </a>
        )}
        <p className="text-gray-400 text-xs">{member.country}</p>
        <p className="text-blue-600 text-xs mt-1 italic">{member.specialization}</p>
      </div>
    </div>
  </Card>
);

const EditorialBoard = () => {
  const [board, setBoard] = useState(DEFAULT_BOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentAPI.getContent("editorial_board")
      .then((res) => {
        if (Object.keys(res.value || {}).length > 0) {
          setBoard(res.value);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
    <PageHero
      title="Editorial Board"
      subtitle="Our distinguished panel of international experts ensures the quality and integrity of every publication."
      breadcrumb="Home / Editorial Board"
    />
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
      {loading ? (
        <Spinner center />
      ) : (
        (Array.isArray(board)
          ? board
          : Object.entries(board || {}).map(([category, members]) => ({ category, members }))
        ).map(({ category, members }) => (
          <div key={category}>
            <h2 className="text-lg font-bold text-gray-900 border-l-4 border-blue-700 pl-3 mb-5">
              {category}
            </h2>
            <div className={`grid gap-4 ${category === "Editor-in-Chief" ? "grid-cols-1 max-w-md" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
              {Array.isArray(members) && members.map((m, idx) => (
                <MemberCard key={m?.name || idx} member={m} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
  );
};

export default EditorialBoard;
