import React from "react";
import "../styles/landing.css";

import Navbar from "./sections/Navbar.jsx";
import Hero from "./sections/Hero.jsx";
import WhyPlatform from "./sections/WhyPlatform.jsx";
import HowItWorks from "./sections/HowItWorks.jsx";
import DataCategories from "./sections/DataCategories.jsx";
import DataPreview from "./sections/DataPreview.jsx";
import Statistics from "./sections/Statistics.jsx";
import CTA from "./sections/CTA.jsx";
import Footer from "./sections/Footer.jsx";

export default function Landing() {
  return (
    <div className="lp-page">
      <Navbar />
      <Hero />
      <WhyPlatform />
      <HowItWorks />
      <DataCategories />
      <DataPreview />
      <Statistics />
      <CTA />
      <Footer />
    </div>
  );
}