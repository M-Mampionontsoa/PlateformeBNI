import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import "./styles/dashboard.css";

const STATUS_LABEL = {
  pending: "En attente",
  parsing: "Analyse",
  validating: "Validation",
  storing: "Stockage",
  completed: "Terminé",
  failed: "Échec",
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

  const totalRows = datasets.reduce(
    (acc, d) => acc + (d.row_count || 0),
    0
  );

  return (
    <div className="dashboard-page">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Vue d'ensemble de l'entrepôt de données et des dernières
            ingestions.
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="dashboard-kpi-grid">

        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">
              Datasets
            </span>
            <span className="dashboard-kpi-icon">▦</span>
          </div>

          <div className="dashboard-kpi-value">
            {loading ? "…" : datasets.length}
          </div>

          <div className="dashboard-kpi-footer">
            Jeux de données disponibles
          </div>
        </div>

        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">
              Lignes ingérées
            </span>
            <span className="dashboard-kpi-icon">≡</span>
          </div>

          <div className="dashboard-kpi-value">
            {loading
              ? "…"
              : totalRows.toLocaleString("fr-FR")}
          </div>

          <div className="dashboard-kpi-footer">
            Données actuellement disponibles
          </div>
        </div>

        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">
              Ingestions récentes
            </span>
            <span className="dashboard-kpi-icon">↗</span>
          </div>

          <div className="dashboard-kpi-value">
            {loading ? "…" : jobs.length}
          </div>

          <div className="dashboard-kpi-footer">
            Dernières opérations
          </div>
        </div>

        <div className="dashboard-kpi-card dashboard-kpi-highlight">
          <div className="dashboard-kpi-top">
            <span className="dashboard-kpi-label">
              État de la plateforme
            </span>
            <span className="dashboard-status-dot" />
          </div>

          <div className="dashboard-kpi-value dashboard-kpi-status">
            Opérationnel
          </div>

          <div className="dashboard-kpi-footer">
            Entrepôt de données
          </div>
        </div>

      </div>

      {/* Main content */}
      <div className="dashboard-main-grid">

        {/* Datasets */}
        <section className="dashboard-card dashboard-datasets-card">

          <div className="dashboard-card-header">
            <div>
              <h2>Datasets disponibles</h2>
              <p>
                Les jeux de données actuellement présents dans
                l'entrepôt.
              </p>
            </div>

            <Link
              to="/app/datasets"
              className="dashboard-card-link"
            >
              Voir tous
            </Link>
          </div>

          <div className="dashboard-list">

            {datasets.length === 0 && !loading && (
              <div className="dashboard-empty">
                <div className="dashboard-empty-icon">▦</div>

                <p>
                  Aucun dataset pour le moment.
                </p>

                <Link to="/app/datasets">
                  Importer un dataset
                </Link>
              </div>
            )}

            {datasets.map((ds) => (
              <div
                key={ds.id}
                className="dashboard-list-row"
              >
                <div className="dashboard-list-left">

                  <div className="dashboard-dataset-icon">
                    ▦
                  </div>

                  <div>
                    <div className="dashboard-item-title">
                      {ds.name}
                    </div>

                    <div className="dashboard-item-subtitle">
                      Dataset
                    </div>
                  </div>
                </div>

                <div className="dashboard-list-value">
                  {(ds.row_count || 0).toLocaleString("fr-FR")}
                  <span> lignes</span>
                </div>
              </div>
            ))}

          </div>
        </section>

        {/* Ingestions */}
        <section className="dashboard-card">

          <div className="dashboard-card-header">
            <div>
              <h2>Dernières ingestions</h2>
              <p>
                État des dernières opérations d'ingestion.
              </p>
            </div>
          </div>

          <div className="dashboard-list">

            {jobs.length === 0 && !loading && (
              <div className="dashboard-empty">
                <div className="dashboard-empty-icon">↗</div>

                <p>
                  Aucune ingestion récente.
                </p>
              </div>
            )}

            {jobs.map((job) => (
              <div
                key={job.id}
                className="dashboard-list-row"
              >
                <div className="dashboard-list-left">

                  <div className="dashboard-job-icon">
                    ↗
                  </div>

                  <div>
                    <div className="dashboard-item-title">
                      {job.filename}
                    </div>

                    <div className="dashboard-item-subtitle">
                      Ingestion
                    </div>
                  </div>
                </div>

                <span
                  className={`dashboard-status dashboard-status-${job.status}`}
                >
                  {STATUS_LABEL[job.status] || job.status}
                </span>
              </div>
            ))}

          </div>
        </section>

      </div>

      {/* Bottom information */}
      <div className="dashboard-bottom-grid">

        <section className="dashboard-card dashboard-info-card">
          <div className="dashboard-info-icon">
            ◫
          </div>

          <div>
            <h3>Entrepôt de données</h3>
            <p>
              Centralisez et consultez les datasets disponibles
              dans votre plateforme Data.
            </p>
          </div>
        </section>

        <section className="dashboard-card dashboard-info-card">
          <div className="dashboard-info-icon">
            ✓
          </div>

          <div>
            <h3>Suivi des ingestions</h3>
            <p>
              Consultez l'état des dernières opérations et
              l'évolution des données intégrées.
            </p>
          </div>
        </section>

      </div>

    </div>
  );
}