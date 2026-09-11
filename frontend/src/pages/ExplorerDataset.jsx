// frontend/src/pages/ExplorerDataset.jsx

import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiBell,
  FiSettings,
  FiChevronDown,
  FiChevronRight,
  FiDownload,
  FiShare2,
  FiLock,
  FiUnlock,
  FiDatabase,
  FiFileText,
  FiUser,
  FiFolder,
  FiClock,
  FiActivity,
  FiInfo,
  FiMaximize2,
  FiZoomIn,
  FiZoomOut,
  FiRefreshCw,
  FiArrowRight,
  FiGrid,
  FiBarChart2,
} from "react-icons/fi";
import { api } from "../api.js";
import "./styles/explorerDataset.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const EMPTY_TABS = [
  "Données",
  "Relations",
  "Statistiques",
  "Qualité",
  "Versions",
  "Provenance",
  "Accès",
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("fr-FR");
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function getInitials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0])
      .join("")
      .toUpperCase() || "SC"
  );
}

/*
 * =========================================================
 * DONNÉES RÉELLES
 * =========================================================
 * Le type vient de l'API si disponible.
 *
 * "Parquet" = DONNÉE FICTIVE DE SECOURS.
 */
function getFileType(dataset) {
  const value =
    dataset?.type ||
    dataset?.format ||
    dataset?.file_type ||
    dataset?.extension ||
    "Parquet";

  return String(value)
    .replace(".", "")
    .replace("parquet", "Parquet");
}

/*
 * =========================================================
 * DONNÉES RÉELLES
 * =========================================================
 * Le nom vient de l'API si disponible.
 *
 * "Q4_Revenue_Projections" = DONNÉE FICTIVE DE SECOURS.
 */
function getDatasetName(dataset) {
  return (
    dataset?.name ||
    dataset?.filename ||
    dataset?.file_name ||
    "Q4_Revenue_Projections"
  );
}

/*
 * =========================================================
 * DONNÉES RÉELLES
 * =========================================================
 * Le nombre de lignes vient de l'API si disponible.
 *
 * 2400000 = DONNÉE FICTIVE DE SECOURS.
 */
function getRows(dataset, data) {
  return (
    dataset?.row_count ??
    dataset?.rows_count ??
    data?.total ??
    data?.row_count ??
    2400000
  );
}

/*
 * =========================================================
 * DONNÉES RÉELLES
 * =========================================================
 * Le nombre de colonnes vient de l'API si disponible.
 *
 * 28 = DONNÉE FICTIVE DE SECOURS.
 */
function getColumns(dataset, data) {
  return (
    dataset?.column_count ??
    dataset?.columns_count ??
    data?.columns?.length ??
    28
  );
}

/*
 * =========================================================
 * APERÇU DES DONNÉES
 * =========================================================
 *
 * DONNÉES RÉELLES :
 * Si l'API renvoie data.rows + data.columns,
 * les lignes affichées viennent directement de l'API.
 *
 * DONNÉES FICTIVES :
 * Les lignes ci-dessous sont uniquement utilisées
 * lorsque l'API ne renvoie aucune donnée.
 */
function buildPreviewRows(data) {
  // DONNÉES RÉELLES
  if (data?.rows?.length && data?.columns?.length) {
    return data.rows.slice(0, 5).map((row) =>
      data.columns.slice(0, 6).reduce((acc, column) => {
        acc[column] = row[column];
        return acc;
      }, {})
    );
  }

  // =======================================================
  // DONNÉES FICTIVES DE SECOURS
  // =======================================================
  return [
    {
      date: "2023-10-01",
      region: "North America",
      product: "Product A",
      revenue: "135,000.00",
      cost: "75,000.00",
      profit: "60,000.00",
      units_sold: "1,250",
    },
    {
      date: "2023-10-01",
      region: "Europe",
      product: "Product B",
      revenue: "98,000.00",
      cost: "60,000.00",
      profit: "38,000.00",
      units_sold: "980",
    },
    {
      date: "2023-10-01",
      region: "Asia",
      product: "Product A",
      revenue: "158,000.00",
      cost: "89,000.00",
      profit: "69,000.00",
      units_sold: "1,540",
    },
    {
      date: "2023-10-01",
      region: "South America",
      product: "Product C",
      revenue: "67,000.00",
      cost: "41,000.00",
      profit: "26,000.00",
      units_sold: "670",
    },
    {
      date: "2023-10-01",
      region: "Africa",
      product: "Product B",
      revenue: "42,000.00",
      cost: "25,000.00",
      profit: "17,000.00",
      units_sold: "420",
    },
  ];
}

export default function ExplorerDataset() {
  const { id } = useParams();

  const [dataset, setDataset] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("Aperçu");
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  const COLUMN_TYPES = [
    { label: "Numérique", count: 14, percent: "50%" },
    { label: "Catégorie", count: 8, percent: "28.6%" },
    { label: "Date", count: 4, percent: "14.3%" },
    { label: "Texte", count: 2, percent: "7.1%" },
  ];

  const MISSING_VALUES = [
    { column: "customer_id", percent: "0.5%" },
    { column: "discount", percent: "1.2%" },
    { column: "region", percent: "0.3%" },
    { column: "cost", percent: "2.1%" },
    { column: "autres colonnes", percent: "0.8%" },
  ];

  /*
   * =======================================================
   * DONNÉES RÉELLES
   * =======================================================
   *
   * GET /api/datasets
   * GET /api/datasets/{id}/data
   */
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const datasetId = Number(id);

        const [datasets, datasetData] = await Promise.all([
          api.listDatasets(),
          api.getData(datasetId, 1, 5),
        ]);

        if (!mounted) return;

        const found = datasets.find(
          (item) => Number(item.id) === datasetId
        );

        // DONNÉES RÉELLES
        setDataset(found || datasets[0] || null);

        // DONNÉES RÉELLES
        setData(datasetData || null);
      } catch {
        if (mounted) {
          setDataset(null);
          setData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [id]);

  /*
   * DONNÉES RÉELLES SI L'API LES FOURNIT.
   * Certaines fonctions possèdent une donnée fictive
   * de secours si l'API ne renvoie rien.
   */
  const name = getDatasetName(dataset);
  const rows = getRows(dataset, data);
  const columns = getColumns(dataset, data);
  const fileType = getFileType(dataset);

  /*
   * DONNÉES RÉELLES SI DISPONIBLES.
   *
   * "Sarah Chen" = DONNÉE FICTIVE DE SECOURS.
   */
  const owner =
    dataset?.owner ||
    dataset?.owner_name ||
    dataset?.created_by ||
    "Sarah Chen";

  /*
   * DONNÉES RÉELLES SI DISPONIBLES.
   *
   * "Finance" = DONNÉE FICTIVE DE SECOURS.
   */
  const category =
    dataset?.category ||
    dataset?.category_name ||
    "Finance";

  /*
   * DONNÉES RÉELLES SI DISPONIBLES.
   *
   * Description = DONNÉE FICTIVE DE SECOURS.
   */
  const description =
    dataset?.description ||
    "Revenue projections and financial metrics for Q4 2023 across all regions.";

  /*
   * DONNÉES RÉELLES OU FICTIVES SELON buildPreviewRows().
   */
  const previewRows = useMemo(
    () => buildPreviewRows(data),
    [data]
  );

  /*
   * DONNÉES RÉELLES :
   * si l'API fournit data.columns.
   *
   * Sinon les noms ci-dessous sont FICTIFS DE SECOURS.
   */
  const previewColumns = useMemo(() => {
    if (data?.columns?.length) {
      return data.columns.slice(0, 6);
    }

    return [
      "date",
      "region",
      "product",
      "revenue",
      "cost",
      "profit",
    ];
  }, [data]);

  /*
   * DONNÉES RÉELLES SI DISPONIBLES.
   *
   * "2023-10-24T10:00:00" = DONNÉE FICTIVE DE SECOURS.
   */
  const lastUpdated =
    dataset?.updated_at ||
    dataset?.updatedAt ||
    dataset?.last_updated ||
    "2023-10-24T10:00:00";

  /*
   * DONNÉES RÉELLES SI DISPONIBLES.
   *
   * "2023-10-24" = DONNÉE FICTIVE DE SECOURS.
   */
  const createdAt =
    dataset?.created_at ||
    dataset?.createdAt ||
    dataset?.uploaded_at ||
    "2023-10-24";

  // Telechargement pdf-------------------------------------------------

  function handleDownloadPdf() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    let y;

    // ---- En-tête ----
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(name, marginX, 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `Données financières  •  Ajouté le ${formatDate(createdAt)}  •  par ${owner}`,
      marginX,
      21,
    );

    doc.setFillColor(13, 148, 136);
    doc.roundedRect(pageWidth - marginX - 26, 9, 26, 8, 2, 2, "F");
    doc.setFontSize(8);
    doc.text("Published", pageWidth - marginX - 13, 14.5, { align: "center" });

    y = 38;

    // ---- Description ----
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    const descLines = doc.splitTextToSize(description, pageWidth - marginX * 2);
    doc.text(descLines, marginX, y);
    y += descLines.length * 5 + 4;

    // ---- Tags ----
    let tagX = marginX;
    ["finance", "revenue", "forecast", "+2"].forEach((tag) => {
      const tagWidth = doc.getTextWidth(tag) + 6;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(tagX, y - 4, tagWidth, 6, 1.5, 1.5, "F");
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8);
      doc.text(tag, tagX + 3, y);
      tagX += tagWidth + 3;
    });
    y += 10;

    // ---- Infos générales (2 colonnes) ----
    const infoLeft = [
      ["Type", fileType],
      ["Taille", dataset?.size || "42.5 MB"],
      ["Lignes", formatNumber(rows)],
      ["Colonnes", String(columns)],
    ];
    const infoRight = [
      ["Propriétaire", owner],
      ["Catégorie", category],
      ["Dernière mise à jour", `${formatDate(lastUpdated)} à 10:00`],
      ["Statut", "Published"],
    ];

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, y, pageWidth - marginX * 2, 30, 2, 2, "FD");

    const colWidth = (pageWidth - marginX * 2) / 2;
    infoLeft.forEach(([label, value], i) => {
      const rowY = y + 6 + i * 6.5;
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text(label, marginX + 4, rowY);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.text(String(value), marginX + 40, rowY);
    });
    infoRight.forEach(([label, value], i) => {
      const rowY = y + 6 + i * 6.5;
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text(label, marginX + colWidth + 4, rowY);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.text(String(value), marginX + colWidth + 45, rowY);
    });

    y += 38;

    // ---- Aperçu des données ----
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Aperçu des données", marginX, y);
    doc.setFont("helvetica", "normal");
    y += 5;

    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [previewColumns],
      body: previewRows.map((row) =>
        previewColumns.map((column) =>
          row[column] === null || row[column] === undefined
            ? "—"
            : String(row[column]),
        ),
      ),
      styles: { fontSize: 8, textColor: [51, 65, 85], cellPadding: 2 },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    y = doc.lastAutoTable.finalY + 12;

    // ---- Statistiques générales ----
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Statistiques générales", marginX, y);
    doc.setFont("helvetica", "normal");
    y += 6;

    const stats = [
      { label: "Lignes", value: formatNumber(rows) },
      { label: "Colonnes", value: String(columns) },
      { label: "Valeurs manquantes", value: "2.1%" },
      { label: "Taille", value: dataset?.size || "42.5 MB" },
    ];

    const boxWidth = (pageWidth - marginX * 2 - 9) / 4;
    stats.forEach((stat, i) => {
      const boxX = marginX + i * (boxWidth + 3);
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(boxX, y, boxWidth, 18, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text(stat.value, boxX + 4, y + 8);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7.5);
      doc.text(stat.label, boxX + 4, y + 14);
    });

    y += 26;

    // ---- Colonnes par type ----
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("Colonnes par type", marginX, y);
    doc.setFont("helvetica", "normal");
    y += 5;

    const halfWidth = (pageWidth - marginX * 2) / 2 - 3;

    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      tableWidth: halfWidth,
      head: [["Type", "Colonnes", "Part"]],
      body: COLUMN_TYPES.map((t) => [t.label, String(t.count), t.percent]),
      styles: { fontSize: 8, textColor: [51, 65, 85], cellPadding: 2 },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [51, 65, 85],
        fontStyle: "bold",
      },
    });

    // ---- Valeurs manquantes ----
    autoTable(doc, {
      startY: y,
      margin: { left: marginX + halfWidth + 6, right: marginX },
      tableWidth: halfWidth,
      head: [["Colonne", "Manquant"]],
      body: MISSING_VALUES.map((m) => [m.column, m.percent]),
      styles: { fontSize: 8, textColor: [51, 65, 85], cellPadding: 2 },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [51, 65, 85],
        fontStyle: "bold",
      },
    });

    doc.save(`${name}.pdf`);
  }

  return (
    <div className="ed-page">

      {/* =====================================================
          SIDEBAR
          -----------------------------------------------------
          VRAI COMPOSANT DE L'APPLICATION.
          Réutilisation de Sidebar.jsx.
      ===================================================== */}

 

      <div className="ed-main">

        {/* ===================================================
            HEADER GLOBAL
            ---------------------------------------------------
            VRAI COMPOSANT DE L'APPLICATION.
            Réutilisation de Header.jsx.
        =================================================== */}


        {/* ===================================================
            BREADCRUMB DE L'EXPLORATEUR
        =================================================== */}

        <div className="ed-topbar">

          <div className="ed-breadcrumb">

            <Link to="/app/datasets">
              Datasets
            </Link>

            <FiChevronRight />

            <span>{name}</span>

            <FiChevronRight />

            <strong>Explorer</strong>

          </div>


        </div>

        {/* =====================================================
            DATASET HEADER
        ===================================================== */}

        <section className="ed-dataset-header">

          <div className="ed-dataset-main">

            <div className="ed-dataset-icon">
              <FiBarChart2 />
            </div>

            <div className="ed-dataset-description">

              <div className="ed-title-line">

                <h1>{name}</h1>

                {/* DONNÉE FICTIVE :
                    "Published" est actuellement codé en dur. */}
                <span className="ed-status">
                  Published
                </span>

              </div>

              <div className="ed-meta-line">

                {/* DONNÉE FICTIVE */}
                Données financières

                <span>•</span>

                {/* DONNÉE RÉELLE SI DISPONIBLE */}
                Ajouté le {formatDate(createdAt)}

                <span>•</span>

                {/* DONNÉE RÉELLE SI DISPONIBLE */}
                par {owner}

              </div>

              {/* RÉELLE SI DISPONIBLE, SINON FICTIVE */}
              <p>{description}</p>

              {/* =================================================
                  TAGS
                  -------------------------------------------------
                  DONNÉES FICTIVES :
                  finance / revenue / forecast / +2
              ================================================= */}

              <div className="ed-tags">
                <span>finance</span>
                <span>revenue</span>
                <span>forecast</span>
                <span>+2</span>
              </div>

            </div>

          </div>

          {/* ===================================================
              ACTIONS
              ---------------------------------------------------
              INTERFACE FRONTEND.
              Pas encore reliée au backend.
          =================================================== */}

          <div className="ed-header-buttons">

            <button className="ed-action-button" onClick={handleDownloadPdf}>
              <FiDownload />
              Télécharger
            </button>

            <button className="ed-action-button">
              <FiShare2 />
              Partager
            </button>

            <button className="ed-access-button">
              <FiLock />
              Demander l'accès
            </button>

          </div>

          {/* ===================================================
              INFORMATIONS DU DATASET
          =================================================== */}

          <div className="ed-dataset-info">

            <div className="ed-info-column">

              <div className="ed-info-item">
                <FiFileText />

                <div>
                  <span>Type</span>

                  {/* RÉEL SI API, SINON FICTIF */}
                  <strong>{fileType}</strong>
                </div>

              </div>

              <div className="ed-info-item">
                <FiFileText />

                <div>
                  <span>Taille</span>

                  {/* RÉEL SI API, SINON 42.5 MB = FICTIF */}
                  <strong>
                    {dataset?.size || "42.5 MB"}
                  </strong>
                </div>

              </div>

              <div className="ed-info-item">
                <FiActivity />

                <div>
                  <span>Lignes</span>

                  {/* RÉEL SI API, SINON 2 400 000 = FICTIF */}
                  <strong>
                    {formatNumber(rows)}
                  </strong>
                </div>

              </div>

              <div className="ed-info-item">
                <FiGrid />

                <div>
                  <span>Colonnes</span>

                  {/* RÉEL SI API, SINON 28 = FICTIF */}
                  <strong>{columns}</strong>
                </div>

              </div>

            </div>

            <div className="ed-info-column">

              <div className="ed-info-item">
                <FiUser />

                <div>
                  <span>Propriétaire</span>

                  {/* RÉEL SI API, SINON Sarah Chen = FICTIF */}
                  <strong>{owner}</strong>
                </div>

              </div>

              <div className="ed-info-item">
                <FiFolder />

                <div>
                  <span>Catégorie</span>

                  {/* RÉEL SI API, SINON Finance = FICTIF */}
                  <strong>{category}</strong>
                </div>

              </div>

              <div className="ed-info-item">
                <FiClock />

                <div>
                  <span>Dernière mise à jour</span>

                  {/* RÉEL SI API, SINON DATE FICTIVE */}
                  <strong>
                    {formatDate(lastUpdated)} à 10:00
                  </strong>
                </div>

              </div>

              <div className="ed-info-item">
                <FiUnlock />

                <div>
                  <span>Statut</span>

                  {/* DONNÉE FICTIVE */}
                  <strong className="ed-published">
                    ● Published
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            TABS
        ===================================================== */}

        <nav className="ed-tabs">

          <button
            className={activeTab === "Aperçu" ? "active" : ""}
            onClick={() => setActiveTab("Aperçu")}
          >
            Aperçu
          </button>

          {EMPTY_TABS.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}

        </nav>

        {/* =====================================================
            EMPTY TABS
            -----------------------------------------------------
            PLACEHOLDER.
        ===================================================== */}

        {activeTab !== "Aperçu" && (
          <div className="ed-empty-tab">

            <FiDatabase />

            <h2>{activeTab}</h2>

            <p>
              Cette section sera disponible prochainement.
            </p>

          </div>
        )}

        {/* =====================================================
            OVERVIEW
        ===================================================== */}

        {activeTab === "Aperçu" && (
          <main className="ed-content">

            {/* =================================================
                ROW 1
                -------------------------------------------------
                Aperçu des données = largeur totale
            ================================================= */}

            <div className="ed-grid ed-grid-top">

              {/* =================================================
                  APERÇU DES DONNÉES
                  -------------------------------------------------
                  DONNÉES RÉELLES si l'API renvoie les lignes.
                  Sinon données fictives de secours.
              ================================================= */}

              <section className="ed-card ed-preview-card">

                <div className="ed-card-header">

                  <div>

                    <h2>
                      Aperçu des données
                      <FiInfo />
                    </h2>

                    <p>
                      Affichage des 5 premières lignes
                    </p>

                  </div>

                </div>

                {loading ? (

                  <div className="ed-loading">
                    Chargement des données…
                  </div>

                ) : (

                  <div className="ed-preview-table-wrap">

                    <table className="ed-preview-table">

                      <thead>

                        <tr>

                          {previewColumns.map((column) => (
                            <th key={column}>
                              {column}
                            </th>
                          ))}

                          <th>...</th>

                        </tr>

                      </thead>

                      <tbody>

                        {previewRows.map((row, index) => (

                          <tr key={index}>

                            {previewColumns.map((column) => (

                              <td key={column}>

                                {row[column] === null ||
                                row[column] === undefined
                                  ? "—"
                                  : String(row[column])}

                              </td>

                            ))}

                            <td>...</td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                )}

                <button className="ed-outline-link">

                  Voir toutes les données

                  <FiArrowRight />

                </button>

              </section>

            </div>

            {/* =================================================
                ROW 2
                -------------------------------------------------
                STATISTIQUES GÉNÉRALES UNIQUEMENT
                -------------------------------------------------
                Le bloc "Aperçu des distributions" a été
                SUPPRIMÉ comme demandé.
            ================================================= */}

            <div className="ed-grid ed-grid-bottom ed-grid-single">

              {/* =================================================
                  STATISTIQUES GÉNÉRALES
                  -------------------------------------------------
                  Lignes / Colonnes / Taille :
                  RÉELLES si disponibles dans l'API.
                  
                  Valeurs manquantes :
                  FICTIVE actuellement.
                  
                  Colonnes par type :
                  FICTIVES actuellement.
                  
                  Valeurs manquantes par colonne :
                  FICTIVES actuellement.
              ================================================= */}

              <section className="ed-card ed-stats-card">

                <div className="ed-card-header">

                  <h2>
                    Statistiques générales
                  </h2>

                </div>

                <div className="ed-stat-boxes">

                  {/* =================================================
                      RÉEL SI API DISPONIBLE
                  ================================================= */}

                  <div className="ed-stat-box">

                    <FiActivity />

                    <div>

                      <strong>
                        {formatNumber(rows)}
                      </strong>

                      <span>
                        Lignes
                      </span>

                    </div>

                  </div>

                  {/* =================================================
                      RÉEL SI API DISPONIBLE
                  ================================================= */}

                  <div className="ed-stat-box">

                    <FiGrid />

                    <div>

                      <strong>
                        {columns}
                      </strong>

                      <span>
                        Colonnes
                      </span>

                    </div>

                  </div>

                  {/* =================================================
                      FICTIF
                  ================================================= */}

                  <div className="ed-stat-box">

                    <FiActivity />

                    <div>

                      <strong>
                        2.1%
                      </strong>

                      <span>
                        Valeurs manquantes
                      </span>

                    </div>

                  </div>

                  {/* =================================================
                      RÉEL SI dataset.size EXISTE
                      SINON 42.5 MB = FICTIF
                  ================================================= */}

                  <div className="ed-stat-box">

                    <FiFileText />

                    <div>

                      <strong>
                        {dataset?.size || "42.5 MB"}
                      </strong>

                      <span>
                        Taille
                      </span>

                    </div>

                  </div>

                </div>

                <div className="ed-stat-details">

                  {/* =================================================
                      COLONNES PAR TYPE
                      -------------------------------------------------
                      TOUTES LES VALEURS SONT FICTIVES.
                  ================================================= */}

                  <div className="ed-column-types">

                    <h3>
                      Colonnes par type
                    </h3>

                    <div className="ed-donut-area">

                      <div className="ed-donut">

                        <div>

                          {/* Le nombre total de colonnes
                              peut être RÉEL grâce à {columns}. */}

                          <strong>
                            {columns}
                          </strong>

                          <span>
                            colonnes
                          </span>

                        </div>

                      </div>

                      <div className="ed-donut-legend">

                        {/* FICTIF */}

                        <span>
                          <i className="numeric" />
                          Numérique&nbsp; 14 (50%)
                        </span>

                        {/* FICTIF */}

                        <span>
                          <i className="category" />
                          Catégorie&nbsp; 8 (28.6%)
                        </span>

                        {/* FICTIF */}

                        <span>
                          <i className="date" />
                          Date&nbsp; 4 (14.3%)
                        </span>

                        {/* FICTIF */}

                        <span>
                          <i className="text" />
                          Texte&nbsp; 2 (7.1%)
                        </span>

                      </div>

                    </div>

                  </div>

                  {/* =================================================
                      VALEURS MANQUANTES
                      -------------------------------------------------
                      TOUTES LES VALEURS SONT FICTIVES.
                  ================================================= */}

                  <div className="ed-missing">

                    <h3>
                      Valeurs manquantes
                    </h3>

                    {/* FICTIF */}

                    <div className="ed-missing-row">

                      <span>
                        customer_id
                      </span>

                      <div>
                        <i style={{ width: "10%" }} />
                      </div>

                      <strong>
                        0.5%
                      </strong>

                    </div>

                    {/* FICTIF */}

                    <div className="ed-missing-row">

                      <span>
                        discount
                      </span>

                      <div>
                        <i style={{ width: "18%" }} />
                      </div>

                      <strong>
                        1.2%
                      </strong>

                    </div>

                    {/* FICTIF */}

                    <div className="ed-missing-row">

                      <span>
                        region
                      </span>

                      <div>
                        <i style={{ width: "7%" }} />
                      </div>

                      <strong>
                        0.3%
                      </strong>

                    </div>

                    {/* FICTIF */}

                    <div className="ed-missing-row">

                      <span>
                        cost
                      </span>

                      <div>
                        <i style={{ width: "30%" }} />
                      </div>

                      <strong>
                        2.1%
                      </strong>

                    </div>

                    {/* FICTIF */}

                    <div className="ed-missing-row">

                      <span>
                        autres colonnes
                      </span>

                      <div>
                        <i style={{ width: "15%" }} />
                      </div>

                      <strong>
                        0.8%
                      </strong>

                    </div>

                  </div>

                </div>

              </section>

            </div>

          </main>
        )}

      </div>

    </div>
  );
}