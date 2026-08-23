import React from "react";
import useReveal from "../hooks/useReveal.js";
import { DATA_FAMILIES } from "../mockData.js";

export default function DataCategories() {
  const [headRef, headVisible] = useReveal();

  return (
    <section id="donnees" className="lp-section">
      <div className="lp-section__head" ref={headRef} data-reveal={headVisible}>
        <span className="lp-eyebrow">Données &amp; modèles</span>
        <h2>Un modèle adapté à chaque type de donnée.</h2>
        <p className="lp-section__desc">
          L'entrepôt combine plusieurs familles de données ; chacune appelle
          une famille de modèles différente pour rester performante.
        </p>
      </div>

      <div className="lp-grid lp-grid--3">
        {DATA_FAMILIES.map((fam, i) => (
          <FamilyCard key={fam.id} fam={fam} index={i} />
        ))}
      </div>
    </section>
  );
}

function FamilyCard({ fam, index }) {
  const [ref, visible] = useReveal();
  return (
    <article
      className="lp-family-card"
      ref={ref}
      data-reveal={visible}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <h3>{fam.title}</h3>
      <p className="lp-family-card__models">{fam.models}</p>
      <p>{fam.description}</p>
    </article>
  );
}