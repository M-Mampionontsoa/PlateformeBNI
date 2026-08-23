import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import "./styles/data.css";

export default function Exploration() {
  const [datasets, setDatasets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.listDatasets().then((ds) => {
      setDatasets(ds);
      if (ds.length > 0) setSelected(ds[0].id);
    });
  }, []);

  useEffect(() => {
    if (selected == null) return;
    api.getSummary(selected).then(setSummary);
  }, [selected]);

  return (
    <div className="ds-content-inner">
      <div className="dp-header">
        <h1 className="ds-page-title">Exploration</h1>
        <p>Resume automatique des donnees - types, valeurs manquantes et statistiques descriptives, a la maniere de Kaggle.</p>
      </div>

      {datasets.length === 0 && <p className="dp-empty">Aucun dataset a explorer. Importez-en un depuis l'onglet Datasets.</p>}

      {datasets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <select className="dp-select" value={selected ?? ""} onChange={(e) => setSelected(Number(e.target.value))}>
            {datasets.map((ds) => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </select>
        </div>
      )}

      {summary && (
        <>
          <div className="dp-grid dp-grid-3" style={{ marginBottom: 24 }}>
            <div className="dp-card">
              <div className="dp-stat-label">Lignes</div>
              <div className="dp-stat-value">{summary.row_count}</div>
            </div>
            <div className="dp-card">
              <div className="dp-stat-label">Colonnes</div>
              <div className="dp-stat-value">{summary.column_count}</div>
            </div>
            <div className="dp-card">
              <div className="dp-stat-label">Valeurs manquantes (moy.)</div>
              <div className="dp-stat-value">
                {(summary.columns.reduce((a, c) => a + c.missing_pct, 0) / (summary.columns.length || 1)).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="dp-grid dp-grid-auto">
            {summary.columns.map((col) => (
              <div className="dp-card dp-col-card" key={col.name}>
                <h4>{col.name}</h4>
                <div className="dp-dtype">{col.dtype}</div>

                <div className="dp-metric-row"><span>Valeurs uniques</span><span>{col.unique_count}</span></div>
                <div className="dp-metric-row"><span>Manquantes</span><span>{col.missing_count} ({col.missing_pct}%)</span></div>
                <div className="dp-missing-bar">
                  <div className="dp-missing-bar-fill" style={{ width: `${Math.min(100, col.missing_pct)}%` }} />
                </div>

                {col.mean !== null && col.mean !== undefined && (
                  <>
                    <div className="dp-metric-row" style={{ marginTop: 10 }}><span>Moyenne</span><span>{col.mean}</span></div>
                    <div className="dp-metric-row"><span>Mediane</span><span>{col.median}</span></div>
                    <div className="dp-metric-row"><span>Ecart-type</span><span>{col.std}</span></div>
                    <div className="dp-metric-row"><span>Min / Max</span><span>{col.min} / {col.max}</span></div>
                  </>
                )}

                {col.top_values && col.top_values.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {col.top_values.map((tv) => (
                      <div className="dp-metric-row" key={tv.value}><span>{tv.value}</span><span>{tv.count}</span></div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
