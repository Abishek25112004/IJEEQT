// src/pages/About.js
import React from "react";
import { PageHero, Card } from "../components/common";

const About = () => (
  <div>
    <PageHero
      title="About the Journal"
      subtitle="Learn about our mission, scope, and commitment to advancing global research."
      breadcrumb="Home / About"
    />
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <Card className="p-6">
        <h2 className="text-lg font-bold text-blue-800 mb-3">Aim & Scope</h2>
        <p className="text-gray-700 text-sm leading-relaxed text-justify">
          The International Journal of Engineering Excellence in Quantum Technology (IJEEQT) is a rigorously
          peer-reviewed, open-access scholarly journal committed to advancing the frontiers of engineering and
          applied sciences. The journal publishes high-quality original research articles, comprehensive review
          papers, and concise technical communications that contribute novel insights and practical advancements
          across diverse interdisciplinary domains. International Journal of Engineering Excellence in Quantum Technology actively welcomes submissions from researchers,
          academicians, and industry professionals worldwide, fostering a global platform for the exchange of
          innovative ideas and cutting-edge developments.
        </p>
        <p className="text-gray-700 text-sm leading-relaxed mt-3 text-justify">
          International Journal of Engineering Excellence in Quantum Technology upholds a robust, transparent, and efficient peer-review process designed to ensure the highest
          standards of scientific rigor, ethical integrity, and academic excellence. Each submission undergoes
          thorough evaluation by qualified experts to assess its originality, technical soundness, and relevance
          to the field. By maintaining a commitment to timely publication without compromising quality, the
          journal aims to facilitate the rapid dissemination of impactful research that advances knowledge,
          supports technological progress, and addresses real-world challenges.
        </p>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-blue-800 mb-3">Objectives</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {[
              "Foster interdisciplinary research and collaboration",
              "Provide a rapid publication platform for impactful research",
              "Maintain highest standards of scientific rigor and ethics",
              "Promote open access to advance global knowledge",
              "Support early-career researchers and institutions",
            ].map((obj) => (
              <li key={obj} className="flex gap-2">
                <span className="text-blue-600 shrink-0 mt-0.5">✓</span>
                {obj}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-blue-800 mb-3">Journal Details</h2>
          <div className="space-y-3 text-sm">
            {[
              ["Starting Year", "2026"],
              ["Publication Frequency", "Quarterly"],
              ["Publication Format", "Online"],
              ["Language", "English"],
              ["Subject","Computer Science"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-gray-100 pb-2 last:border-0">
                <span className="text-gray-500">{k}</span>
                <span className="font-semibold text-gray-800 text-right">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-blue-800 mb-3">Open Access Policy</h2>
        <p className="text-sm text-gray-700 leading-relaxed text-justify">
          International Journal of Engineering Excellence in Quantum Technology is a fully open-access journal. All articles are freely available online immediately. 
          Authors retain copyright of their work. The journal is funded through Article Processing Charges (APC).
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-blue-800 mb-3">Publication Ethics</h2>
        <p className="text-sm text-gray-700 leading-relaxed text-justify">
          International Journal of Engineering Excellence in Quantum Technology adheres to the ethical guidelines established by the Committee on Publication Ethics (COPE)
          and is committed to maintaining the highest standards of integrity in scholarly publishing. The
          journal enforces strict policies against plagiarism, data fabrication, falsification, and improper
          authorship practices.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mt-3 text-justify">
          All submitted manuscripts undergo rigorous similarity screening using iThenticate to ensure
          originality and prevent academic misconduct. Furthermore, authors, reviewers, and editors are
          required to disclose any potential conflicts of interest to promote transparency and unbiased
          decision-making throughout the publication process.
        </p>
        <p className="text-sm text-gray-700 leading-relaxed mt-3 text-justify">
          By upholding these ethical principles, International Journal of Engineering Excellence in Quantum Technology ensures the credibility, reliability, and academic
          value of all published research.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-blue-800 mb-3">Publisher's details</h2>
        <div className="space-y-3 text-sm">
          {[
            ["Owner Name/ Responsible Person Name", "Abishek M"],
            ["Name of Issuing/ Publishing body", "Abishek M"],
            ["E-mail", "abishek25112004@gmail.com"],
            ["Mobile", "8072287692"],
            ["Address line 1", "3/686-10 Kalliyappa chetty colony"],
            ["Town / City", "Dharmapuri"],
            ["Pin Code", "636701"],
            ["State", "Tamilnadu, India."],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-100 pb-2 last:border-0 gap-1 sm:gap-4">
              <span className="text-gray-500 font-medium">{k}</span>
              <span className="font-semibold text-gray-800 sm:text-right">{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

export default About;
