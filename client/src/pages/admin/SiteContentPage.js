import React from "react";
import { PageHero } from "../../components/common";
import SiteContentManager from "./SiteContentManager";

const SiteContentPage = () => {
  return (
    <div>
      <PageHero 
        title="Site Content Management" 
        subtitle="Manage dynamic content across the website." 
        breadcrumb="Home / Site Content" 
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <SiteContentManager />
      </div>
    </div>
  );
};

export default SiteContentPage;
