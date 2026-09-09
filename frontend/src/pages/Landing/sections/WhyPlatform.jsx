import React from "react";
import useReveal from "../hooks/useReveal.js";
import { MODULES, VALUE_PROPS } from "../mockData.js";

const ICONS = {
  gauge: (
    <path d="M12 3a9 9 0 1 0 9 9M12 3v3m0 0a6 6 0 0 1 6 6h3M12 12l4-4" />
  ),
  shield: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />,
  layout: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M9 9v11" />
    </>
  ),
  activity: <path d="M3 12h4l2 7 4-14 2 7h6" />,
};

function ModuleIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

export default function WhyPlatform() {
  const [ref, visible] = useReveal();

  return (
    <section id="plateforme" className="lp-section">
      <div className="lp-section__head" ref={ref} data-reveal={visible}>
        <span className="lp-eyebrow">Ce que fait la plateforme</span>
        <h2>Quatre modules, une seule décision.</h2>
        <p className="lp-section__desc">
          De l'ingestion des données jusqu'au monitoring des modèles en
          production, chaque module couvre une étape du cycle de décision.
        </p>
      </div>

      <div className="lp-grid lp-grid--4">
        {MODULES.map((mod, i) => (
          <ModuleCard key={mod.id} mod={mod} index={i} />
        ))}
      </div>

      <ul className="lp-value-strip">
        {VALUE_PROPS.map((v) => (
          <li key={v}>{v}</li>
        ))}
      </ul>
    </section>
  );
}

function ModuleCard({ mod, index }) {
  const [ref, visible] = useReveal();
  return (
    <article
      className="lp-card"
      ref={ref}
      data-reveal={visible}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <span className="lp-card__icon">
        <ModuleIcon name={mod.icon} />
      </span>
      <span className="lp-card__tag">{mod.tag}</span>
      <h3>{mod.title}</h3>
      <p>{mod.description}</p>
    </article>
  );
}