// Contenu basé sur le dossier projet "Credit Scoring & Fraud Detection" (MISA)
// À terme, les valeurs marquées "mock" pourront être branchées sur l'API réelle (src/api.js).

export const NAV_LINKS = [
  { href: "#plateforme", label: "Plateforme" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#donnees", label: "Données & modèles" },
  { href: "#apercu", label: "Aperçu" },
];

export const MODULES = [
  {
    id: "scoring",
    title: "Credit Scoring",
    tag: "ML supervisé",
    description:
      "Classifie chaque client en bon, mauvais ou normal payeur à partir de son historique et de ses données transactionnelles.",
    icon: "gauge",
  },
  {
    id: "fraud",
    title: "Fraud Detection",
    tag: "Anomaly detection + supervisé",
    description:
      "Repère les demandes frauduleuses en combinant détection d'anomalies et modèles supervisés entraînés sur des cas connus.",
    icon: "shield",
  },
  {
    id: "dashboard",
    title: "Dashboard de décision",
    tag: "Accepter · Vérifier · Refuser",
    description:
      "Expose les résultats des modèles via une interface claire, pensée pour l'aide à la décision plutôt que l'automatisation totale.",
    icon: "layout",
  },
  {
    id: "monitoring",
    title: "Monitoring",
    tag: "Model drift · alertes",
    description:
      "Surveille en continu la performance des modèles, la dérive des données et déclenche des alertes en cas d'anomalie.",
    icon: "activity",
  },
];

export const VALUE_PROPS = [
  "Décisions plus rapides et objectives",
  "Moins de pertes liées aux impayés et à la fraude",
  "Modèles fiables dans la durée",
  "Aide à la décision, sans remplacer l'humain",
];

export const PIPELINE_STEPS = [
  {
    index: "01",
    title: "Réception",
    description:
      "Ingestion de sources multiples, internes et externes : données bancaires, clients, transactionnelles, comportementales.",
  },
  {
    index: "02",
    title: "Transformation",
    description:
      "ETL — extraction, nettoyage, standardisation. Les données hétérogènes sont mises à un format exploitable commun.",
  },
  {
    index: "03",
    title: "Contrôle qualité",
    description:
      "Chaque jeu de données est validé et tracé avant d'être mis à disposition des équipes Data et ML.",
  },
  {
    index: "04",
    title: "Exploitation",
    description:
      "Feature engineering, scoring, détection de fraude et monitoring continu des modèles en production.",
  },
];

export const DATA_FAMILIES = [
  {
    id: "tabular",
    title: "Données tabulaires",
    models: "LightGBM · XGBoost · CatBoost",
    description:
      "Les méthodes d'ensemble à arbres de décision (boosting) obtiennent les meilleures performances sur ce type de données.",
  },
  {
    id: "relational",
    title: "Données relationnelles",
    models: "Graph Neural Networks · GraphSAGE",
    description:
      "Les méthodes basées sur les graphes captent les relations entre clients pour évaluer le risque de crédit.",
  },
  {
    id: "textual",
    title: "Données textuelles",
    models: "LIWC",
    description:
      "Extraction de caractéristiques psycholinguistiques à partir de données textuelles pour enrichir les modèles.",
  },
];

export const STATS = [
  { value: 4, suffix: "", label: "Modules produit" },
  { value: 3, suffix: "", label: "Familles de données" },
  { value: 9, suffix: "", label: "Contributeurs sur le projet" },
  { value: 100, suffix: "%", label: "Données contrôlées avant usage" },
];

// mock — aperçu du dashboard de décision, à remplacer par l'API réelle
export const PREVIEW_CLIENTS = [
  { id: "CL-4471", score: 742, amount: "4 200 000 Ar", status: "accepte" },
  { id: "CL-4472", score: 588, amount: "1 800 000 Ar", status: "verifier" },
  { id: "CL-4473", score: 311, amount: "6 500 000 Ar", status: "refuse" },
  { id: "CL-4474", score: 701, amount: "2 950 000 Ar", status: "accepte" },
];

export const PREVIEW_STATUS_LABEL = {
  accepte: "Accepté",
  verifier: "À vérifier",
  refuse: "Refusé",
};

export const PREVIEW_TAGS = ["ETL validé", "SHAP explicable", "Model drift : stable"];

export const FOOTER_COLUMNS = [
  {
    title: "Plateforme",
    links: [
      { href: "#plateforme", label: "Modules" },
      { href: "#pipeline", label: "Pipeline de données" },
      { href: "#donnees", label: "Données & modèles" },
      { href: "#apercu", label: "Aperçu du dashboard" },
    ],
  },
  {
    title: "Projet",
    links: [
      { href: "#", label: "Équipe étudiante MISA" },
    ],
  },
];