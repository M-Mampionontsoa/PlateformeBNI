import React, { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { Link } from "react-router-dom";
import "./styles/datasets.css";
import { FiArrowUpRight } from "react-icons/fi";
const STATUS_LABEL = {
  pending: "En attente",
  parsing: "Analyse",
  validating: "Validation",
  storing: "Stockage",
  completed: "Terminé",
  failed: "Échec",
};

const getDatasetType = (ds) =>
  String(ds.type || ds.file_type || ds.format || "CSV").toUpperCase();

const getOwner = (ds) =>
  ds.owner_name || ds.owner || ds.author || "Équipe Data";

const getCategory = (ds) =>
  ds.category ||
  ds.categorie ||
  ds.category_name ||
  "Non catégorisé";

const getStatus = (ds) =>
  ds.status || ds.dataset_status || "completed";

const getDescription = (ds) =>
  ds.description || ds.summary || "Jeu de données";

export default function Datasets() {
  const [jobs, setJobs] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const pollRef = useRef(null);

  const [datasets, setDatasets] = useState([]);

  // Filtres
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  const prevJobsRef = useRef([]);

  useEffect(() => {
    const wasRunning = prevJobsRef.current.some(
      (j) => !["completed", "failed"].includes(j.status)
    );

    const stillRunning = jobs.some(
      (j) => !["completed", "failed"].includes(j.status)
    );

    if (wasRunning && !stillRunning) {
      refreshDatasets();
    }

    prevJobsRef.current = jobs;
  }, [jobs]);

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

  /*
   * ==========================================================
   * VALEURS DISPONIBLES POUR LES FILTRES
   * ==========================================================
   */

  const types = [
    ...new Set(datasets.map(getDatasetType)),
  ].sort();

  const owners = [
    ...new Set(datasets.map(getOwner)),
  ].sort();

  const categories = [
    ...new Set(datasets.map(getCategory)),
  ].sort();

  const statuses = [
    ...new Set(datasets.map(getStatus)),
  ].sort();

  /*
   * ==========================================================
   * FILTRAGE + RECHERCHE
   * ==========================================================
   */

  const normalizedSearch = search.trim().toLowerCase();

  const filteredDatasets = datasets.filter((ds) => {
    const type = getDatasetType(ds);
    const owner = getOwner(ds);
    const category = getCategory(ds);
    const status = getStatus(ds);
    const description = getDescription(ds);

    const searchableText = [
      ds.name,
      description,
      type,
      owner,
      category,
      status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      searchableText.includes(normalizedSearch);

    const matchesType =
      !typeFilter || type === typeFilter;

    const matchesOwner =
      !ownerFilter || owner === ownerFilter;

    const matchesCategory =
      !categoryFilter || category === categoryFilter;

    const matchesStatus =
      !statusFilter || status === statusFilter;

    return (
      matchesSearch &&
      matchesType &&
      matchesOwner &&
      matchesCategory &&
      matchesStatus
    );
  });

  const hasFilters =
    Boolean(search) ||
    Boolean(typeFilter) ||
    Boolean(ownerFilter) ||
    Boolean(categoryFilter) ||
    Boolean(statusFilter);

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("");
    setOwnerFilter("");
    setCategoryFilter("");
    setStatusFilter("");
  };

  return (
    <div className="datasets-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="datasets-header">

        <div className="datasets-title-block">
          <div className="datasets-title-icon">▦</div>

          <div>
            <h1>Datasets</h1>

            <p>
              Gérez et explorez les jeux de données de votre
              organisation.
            </p>
          </div>
        </div>

        <div className="datasets-header-actions">

          <button
            className="datasets-btn datasets-btn-import"
            onClick={() => fileInput.current?.click()}
          >
            <span className="datasets-btn-icon">↥</span>
            Importer un dataset
          </button>

          <button
            className="datasets-btn datasets-btn-new"
            onClick={() => fileInput.current?.click()}
          >
            <span className="datasets-btn-plus">+</span>
            Nouveau dataset
          </button>

        </div>

      </div>

      <input
        ref={fileInput}
        type="file"
        accept=".csv"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* =====================================================
          FILTER BAR
          ===================================================== */}

      <div className="datasets-filter-card">

        <div className="datasets-filter-top">

          <div className="datasets-filter-title">
            <span className="datasets-filter-title-icon">
              ⚙
            </span>

            <span>Filtres</span>

            {hasFilters && (
              <span className="datasets-active-count">
                Actifs
              </span>
            )}
          </div>

          {hasFilters && (
            <button
              className="datasets-reset-filter"
              onClick={resetFilters}
            >
              Réinitialiser
            </button>
          )}

        </div>

        <div className="datasets-filter-controls">

          <div className="datasets-select-wrapper">
            <span className="datasets-select-label">
              Type
            </span>

            <select
              className="datasets-filter-select"
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
            >
              <option value="">Tous les types</option>

              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <span className="datasets-select-arrow">
             ⌄
            </span>
          </div>

          <div className="datasets-select-wrapper">
            <span className="datasets-select-label">
              Propriétaire
            </span>

            <select
              className="datasets-filter-select"
              value={ownerFilter}
              onChange={(e) =>
                setOwnerFilter(e.target.value)
              }
            >
              <option value="">
                Tous les propriétaires
              </option>

              {owners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>

            <span className="datasets-select-arrow">
             ⌄
            </span>
          </div>

          <div className="datasets-select-wrapper">
            <span className="datasets-select-label">
              Catégorie
            </span>

            <select
              className="datasets-filter-select"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value)
              }
            >
              <option value="">
                Toutes les catégories
              </option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>

            <span className="datasets-select-arrow">
             ⌄
            </span>
          </div>

          <div className="datasets-select-wrapper">
            <span className="datasets-select-label">
              Statut
            </span>

            <select
              className="datasets-filter-select"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="">Tous les statuts</option>

              {statuses.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {STATUS_LABEL[status] || status}
                </option>
              ))}
            </select>

            <span className="datasets-select-arrow">
             ⌄
            </span>
          </div>

          {/* SEARCH */}

          <div className="datasets-search">

            <span className="datasets-search-icon">
             ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Rechercher un dataset..."
            />

            {search && (
              <button
                className="datasets-search-clear"
                onClick={() => setSearch("")}
                aria-label="Effacer la recherche"
              >
                ×
              </button>
            )}

          </div>

        </div>

      </div>

      {/* =====================================================
          RESULT INFO
          ===================================================== */}

      <div className="datasets-result-info">

        <div>
          <strong>
            {filteredDatasets.length}
          </strong>{" "}
          dataset
          {filteredDatasets.length > 1 ? "s" : ""}
          {hasFilters && (
            <span className="datasets-result-muted">
              {" "}correspondant aux critères
            </span>
          )}
        </div>

      </div>

      {/* =====================================================
          TABLE
          ===================================================== */}

      <div className="datasets-table-card">

        <div className="datasets-table-header">

          <div>Nom du dataset</div>
          <div>Type</div>
          <div>Taille</div>
          <div>Importé le</div>
          <div>Propriétaire</div>
          <div className="datasets-actions-header">
            Actions
          </div>

        </div>

        {filteredDatasets.length === 0 ? (

          <div className="datasets-empty">

            <div className="datasets-empty-icon">
             ⌕
            </div>

            <h3>
              {datasets.length === 0
                ? "Aucun dataset"
                : "Aucun résultat"}
            </h3>

            <p>
              {datasets.length === 0
                ? "Importez votre premier dataset pour commencer."
                : "Aucun dataset ne correspond aux critères sélectionnés."}
            </p>

            {datasets.length === 0 ? (

              <button
                className="datasets-btn datasets-btn-new"
                onClick={() =>
                  fileInput.current?.click()
                }
              >
                + Nouveau dataset
              </button>

            ) : (

              <button
                className="datasets-btn datasets-btn-import"
                onClick={resetFilters}
              >
                Réinitialiser les filtres
              </button>

            )}

          </div>

        ) : (

          filteredDatasets.map((ds, index) => {

            const type = getDatasetType(ds);
            const owner = getOwner(ds);

            return (
              <div
                className="datasets-row"
                key={ds.id}
              >

                {/* NOM */}

                <div className="datasets-name-cell">

                  <div className="datasets-type-icon">
                    {type === "JSON"
                      ? "◇"
                      : type === "PARQUET"
                      ? "▥"
                      : "▦"}
                  </div>

                  <div className="datasets-name-content">

                    <div className="datasets-name">
                      {ds.name}
                    </div>

                    <div className="datasets-description">
                      {getDescription(ds)}
                    </div>

                  </div>

                </div>

                {/* TYPE */}

                <div>
                  <span
                    className={`datasets-type-badge datasets-type-${type.toLowerCase()}`}
                  >
                    {type}
                  </span>
                </div>

                {/* SIZE */}

                <div className="datasets-size">
                  {ds.size ||
                    ds.file_size ||
                    "—"}
                </div>

                {/* DATE */}

                <div className="datasets-date">

                  {ds.created_at
                    ? new Date(
                        ds.created_at
                      ).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : ds.updated_at
                    ? new Date(
                        ds.updated_at
                      ).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "—"}

                </div>

                {/* OWNER */}

                <div className="datasets-owner">

                  <div className="datasets-owner-avatar">
                    {String(owner)
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <span>
                    {owner}
                  </span>

                </div>

                {/* ACTIONS */}

                <div className="datasets-actions">

                  

                  <Link
  to={`/app/datasets/${ds.id}/explorer`}
  className="datasets-explore-btn"
>
  Explorer
  <FiArrowUpRight className="datasets-explore-icon" />
</Link>

                  <button
                    className="datasets-menu-btn"
                    aria-label={`Actions pour ${ds.name}`}
                  >
                    ⋮
                  </button>

                </div>

              </div>
            );
          })

        )}

      </div>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      {filteredDatasets.length > 0 && (

        <div className="datasets-footer">

          <span className="datasets-results">
            Affichage de{" "}
            <strong>
              {filteredDatasets.length}
            </strong>{" "}
            sur{" "}
            <strong>
              {datasets.length}
            </strong>{" "}
            dataset
            {datasets.length > 1 ? "s" : ""}
          </span>

        </div>

      )}

    </div>
  );
}