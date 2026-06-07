import React from "react";
import { useNavigate } from "react-router-dom";
import { PageHero } from "../../components/common";
import SiteContentManager from "./SiteContentManager";

const SiteContentPage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <PageHero 
        title="Site Content Management" 
        subtitle="Manage dynamic content across the website." 
        breadcrumb="Home / Site Content" 
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 mb-6 transition-colors">
          ← Back
        </button>
        <SiteContentManager />
      </div>
    </div>
  );
};

export default SiteContentPage;
