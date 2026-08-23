import React from "react";
import useReveal from "../hooks/useReveal.js";
import { PREVIEW_CLIENTS, PREVIEW_STATUS_LABEL, PREVIEW_TAGS } from "../mockData.js";

export default function DataPreview() {
  const [ref, visible] = useReveal();

  return (
    <section id="apercu" className="lp-section lp-section--tint">
      <div className="lp-preview" ref={ref} data-reveal={visible}>
        <div className="lp-preview__copy">
          <span className="lp-eyebrow">Aperçu</span>
          <h2>Le dashboard de décision, en direct.</h2>
          <p className="lp-section__desc">
            Chaque client scoré arrive avec une recommandation claire —
            accepter, vérifier ou refuser — et sa justification. Les données
            ci-dessous sont un aperçu de démonstration.
          </p>
          <ul className="lp-preview__tags">
            {PREVIEW_TAGS.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>

        <div className="lp-preview__table" role="table" aria-label="Aperçu des décisions clients">
          <div className="lp-preview__row lp-preview__row--head" role="row">
            <span role="columnheader">Client</span>
            <span role="columnheader">Score</span>
            <span role="columnheader">Montant</span>
            <span role="columnheader">Décision</span>
          </div>
          {PREVIEW_CLIENTS.map((c) => (
            <div className="lp-preview__row" role="row" key={c.id}>
              <span role="cell">{c.id}</span>
              <span role="cell" className="lp-preview__score">
                {c.score}
              </span>
              <span role="cell">{c.amount}</span>
              <span role="cell">
                <span className={`lp-pill lp-pill--${c.status}`}>
                  {PREVIEW_STATUS_LABEL[c.status]}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}