import React from "react";

export default function PagePlaceholder({ title }) {
  return (
    <div className="ds-content-inner">
      <h1 className="ds-page-title">{title}</h1>
      <p className="ds-page-placeholder">Contenu à venir.</p>
    </div>
  );
}