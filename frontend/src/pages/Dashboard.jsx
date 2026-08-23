import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import "./styles/data.css";

const STATUS_LABEL = {
  pending: "En attente",
  parsing: "Analyse",
  validating: "Validation",
  storing: "Stockage",
  completed: "Termine",
  failed: "Echec",
};

export default function Dashboard() {
  const [datasets, setDatasets] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listDatasets(), api.listJobs()])
      .then(([ds, jb]) => {
        setDatasets(ds);
        setJobs(jb.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  const totalRows = datasets.reduce((acc, d) => acc + (d.row_count || 0), 0);

  return (
    <div className="ds-content-inner">
      <div className="dp-header">
        <h1 className="ds-page-title">Vue d'ensemble</h1>
        <p>Etat de l'entrepot de donnees et des dernieres ingestions.</p>
      </div>

      <div className="dp-grid dp-grid-3" style={{ marginBottom: 24 }}>
        <div className="dp-card">
          <div className="dp-stat-label">Datasets</div>
          <div className="dp-stat-value">{loading ? "…" : datasets.length}</div>
        </div>
        <div className="dp-card">
          <div className="dp-stat-label">Lignes ingerees</div>
          <div className="dp-stat-value">{loading ? "…" : totalRows.toLocaleString("fr-FR")}</div>
        </div>
        <div className="dp-card">
          <div className="dp-stat-label">Ingestions recentes</div>
          <div className="dp-stat-value">{loading ? "…" : jobs.length}</div>
        </div>
      </div>

      <div className="dp-grid dp-grid-2">
        <div className="dp-card">
          <h3 style={{ margin: "0 0 14px", fontSize: 14 }}>Datasets disponibles</h3>
          {datasets.length === 0 && !loading && (
            <p className="dp-empty" style={{ padding: "12px 0" }}>
              Aucun dataset pour le moment. <Link to="/app/datasets">Importez-en un</Link>.
            </p>
          )}
          {datasets.map((ds) => (
            <div key={ds.id} className="dp-metric-row" style={{ padding: "6px 0" }}>
              <span>{ds.name}</span>
              <span>{ds.row_count} lignes</span>
            </div>
          ))}
        </div>

        <div className="dp-card">
          <h3 style={{ margin: "0 0 14px", fontSize: 14 }}>Dernieres ingestions</h3>
          {jobs.length === 0 && !loading && <p className="dp-empty" style={{ padding: "12px 0" }}>Aucune ingestion recente.</p>}
          {jobs.map((job) => (
            <div key={job.id} className="dp-metric-row" style={{ padding: "6px 0" }}>
              <span>{job.filename}</span>
              <span className={`dp-status-badge dp-status-${job.status}`}>
                {STATUS_LABEL[job.status] || job.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
