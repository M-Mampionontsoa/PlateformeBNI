import React from "react";
import { Routes, Route } from "react-router-dom";
import "./dashboardShell.css";

import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";

import Dashboard from "../pages/Dashboard.jsx";
import Datasets from "../pages/Datasets.jsx";
import Exploration from "../pages/Exploration.jsx";
import Analyses from "../pages/Analyses.jsx";
import Visualizations from "../pages/Visualizations.jsx";
import MlScoring from "../pages/MlScoring.jsx";
import FraudDetection from "../pages/FraudDetection.jsx";
import Administration from "../pages/Administration.jsx";

export default function Shell({ onLogout, user }) {
  return (
    <div className="ds-shell">
      <Sidebar onLogout={onLogout} user={user} />

      <div className="ds-main">
        <Header />

        <div className="ds-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/datasets" element={<Datasets />} />
            <Route path="/exploration" element={<Exploration />} />
            <Route path="/analyses" element={<Analyses />} />
            <Route path="/visualizations" element={<Visualizations />} />
            <Route path="/ml-scoring" element={<MlScoring />} />
            <Route path="/fraud-detection" element={<FraudDetection />} />
            <Route path="/administration" element={<Administration />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}