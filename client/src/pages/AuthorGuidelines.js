// src/pages/AuthorGuidelines.js
import React, { useState, useEffect } from "react";
import { PageHero, Card } from "../components/common";
import { contentAPI } from "../services/api";

const AuthorGuidelines = () => {
  const [apc, setApc] = useState({ indianAmount: 5000, internationalAmount: 50 });

  useEffect(() => {
    contentAPI.getContent("call_for_papers").then((res) => {
      if (res.value?.indianAmount) {
        setApc({ indianAmount: res.value.indianAmount, internationalAmount: res.value.internationalAmount || 50 });
      }
    }).catch(() => {});
  }, []);

  const sections = [
    {
      title: "1. General Information",
      content: `Manuscripts must be original, unpublished work not currently under review elsewhere. All authors must have made a substantial contribution to the work. The journal accepts original research articles, review articles, and short communications.`,
    },
    {
      title: "2. Manuscript Preparation",
      content: `Manuscripts must be prepared in Microsoft Word or LaTeX format (IEEE template preferred). The paper should include: Title, Abstract (150–250 words), Keywords (4–8 terms), Introduction, Methodology, Results and Discussion, Conclusion, References, and Author Biography. Maximum length: 8,000 words excluding references.`,
    },
    {
      title: "3. File Format for Submission",
      content: `Upload your manuscript as a single PDF file (max 10 MB). Figures should be embedded in the document. High-resolution images (300 DPI minimum) are required. Supplementary data can be submitted as separate files.`,
    },
    {
      title: "4. References",
      content: `Use IEEE citation style. References should be numbered in square brackets [1], [2]. All references must be cited in the text. Include DOI links where available. Minimum 15 references for full-length papers.`,
    },
    {
      title: "5. Ethical Guidelines",
      content: `All research involving human subjects must have ethical approval. Authors must declare all conflicts of interest. Data fabrication, falsification, and plagiarism are grounds for immediate rejection. Similarity index must be below 20%.`,
    },
    {
      title: "6. Peer Review Process",
      content: `All manuscripts undergo double-blind peer review by at least two independent reviewers. Authors should expect an initial decision within 4–6 weeks. Revisions must be submitted within 4 weeks. Final proofs are sent to the corresponding author before publication.`,
    },
    {
      title: "7. Article Processing Charge (APC)",
      content: `Upon acceptance, authors pay an APC of ₹${apc.indianAmount.toLocaleString()} (India) or $${apc.internationalAmount} USD (International). The journal offers waivers for authors from developing countries on request. APC covers editorial processing, typesetting, and permanent hosting.`,
    },
  ];

  return (
    <div>
      <PageHero title="Author Guidelines" subtitle="Instructions for manuscript preparation and submission." breadcrumb="Home / Author Guidelines" />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        {sections.map((sec) => (
          <Card key={sec.title} className="p-5">
            <h2 className="text-base font-bold text-blue-800 mb-2">{sec.title}</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{sec.content}</p>
          </Card>
        ))}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-sm">
          <p className="font-semibold text-blue-800 mb-1">📥 Download Templates</p>
          <ul className="text-blue-700 space-y-1 mt-2">
            <li>• <a href="/templates/ieee-template.docx" download className="underline cursor-pointer">IEEE Manuscript Template (.docx)</a></li>
            <li>• <a href="/templates/latex-template.zip" download className="underline cursor-pointer">LaTeX Template (.zip)</a></li>
            <li>• When working in Overleaf, the template is available at <a href="https://www.overleaf.com/gallery/tagged/ieee-official" target="_blank" rel="noopener noreferrer" className="underline cursor-pointer text-blue-800 font-medium">IEEE Official Gallery</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuthorGuidelines;
