import React, { useEffect, useRef, useState } from "react";
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

export default function Datasets() {
  const [jobs, setJobs] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const pollRef = useRef(null);

  const [datasets, setDatasets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const refreshJobs = async () => {
    try {
      const jobsData = await api.listJobs();
      setJobs(jobsData);
      return jobsData;
    } catch {
      return [];
    }
  };

  const refreshDatasets = async () => {
    try {
      const ds = await api.listDatasets();
      setDatasets(ds);
      setSelected((current) => current ?? (ds.length > 0 ? ds[0].id : null));
    } catch {
      /* silencieux */
    }
  };

  useEffect(() => {
    refreshJobs();
    refreshDatasets();
    pollRef.current = setInterval(refreshJobs, 900);
    return () => clearInterval(pollRef.current);
  }, []);

  // Quand une ingestion se termine, on rafraichit la liste des datasets
  const prevJobsRef = useRef([]);
  useEffect(() => {
    const wasRunning = prevJobsRef.current.some((j) => !["completed", "failed"].includes(j.status));
    const stillRunning = jobs.some((j) => !["completed", "failed"].includes(j.status));
    if (wasRunning && !stillRunning) refreshDatasets();
    prevJobsRef.current = jobs;
  }, [jobs]);

  useEffect(() => {
    if (selected == null) return;
    api.getData(selected, page, pageSize).then(setData);
  }, [selected, page]);

  const handleFiles = async (fileList) => {
    const file = fileList[0];
    if (!file) return;
    try {
      await api.uploadFile(file);
      refreshJobs();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div className="ds-content-inner">
      <div className="dp-header">
        <h1 className="ds-page-title">Datasets</h1>
        <p>Importez un fichier CSV, suivez l'ingestion, et explorez les donnees ligne par ligne.</p>
      </div>

      <div className="dp-card" style={{ marginBottom: 24 }}>
        <div
          className={"dp-dropzone" + (dragging ? " drag" : "")}
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          Deposez un fichier CSV ici, ou cliquez pour parcourir.
          <small>Le schema et les types de colonnes sont detectes automatiquement.</small>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {jobs.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 14, margin: "0 0 12px" }}>Historique des ingestions</h3>
          {jobs.map((job) => (
            <div className="dp-job-row" key={job.id}>
              <span className={`dp-status-badge dp-status-${job.status}`}>
                {STATUS_LABEL[job.status] || job.status}
              </span>
              <span className="dp-job-name">{job.filename}</span>
              <span className="dp-job-message">{job.message || "-"}</span>
              <div className="dp-progress-track">
                <div
                  className={"dp-progress-fill" + (job.status === "failed" ? " failed" : "")}
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ fontSize: 14, margin: "0 0 12px" }}>Explorer les donnees</h3>

      {datasets.length === 0 && <p className="dp-empty">Aucun dataset importe pour le moment.</p>}

      {datasets.length > 0 && (
        <>
          <div style={{ marginBottom: 14, display: "flex", gap: 12, alignItems: "center" }}>
            <select
              className="dp-select"
              value={selected ?? ""}
              onChange={(e) => { setSelected(Number(e.target.value)); setPage(1); }}
            >
              {datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>{ds.name} ({ds.row_count} lignes)</option>
              ))}
            </select>
            {data && <span className="dp-pill">{data.total} lignes - {data.columns.length} colonnes</span>}
          </div>

          {data && (
            <>
              <div className="dp-table-scroll">
                <table className="dp-table">
                  <thead>
                    <tr>{data.columns.map((c) => <th key={c}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => (
                      <tr key={i}>
                        {data.columns.map((c) => (
                          <td key={c}>{row[c] === null || row[c] === undefined ? "—" : String(row[c])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="dp-pagination">
                <button className="dp-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Precedent</button>
                <span>Page {page} / {totalPages}</span>
                <button className="dp-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Suivant</button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
