import React from "react";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section id="top" className="lp-hero">
      <div className="lp-hero__bg" aria-hidden="true">
        <svg className="lp-hero__grid" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="lp-grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.15" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#lp-grid)" />
        </svg>
        <div className="lp-hero__halo lp-hero__halo--1" />
        <div className="lp-hero__halo lp-hero__halo--2" />
      </div>

      <div className="lp-hero__inner">
        <div className="lp-hero__copy">
          <span className="lp-badge">Entrepôt de données</span>

          <h1 className="lp-hero__title">
            Chaque décision de crédit,
            <br />
            <span className="lp-gradient-text">éclairée par la donnée.</span>
          </h1>

          <p className="lp-hero__desc">
            Entrepôt centralise vos données clients, internes et externes, les
            transforme en pipeline fiable, et alimente des modèles de scoring
            et de détection de fraude prêts pour la production.
          </p>

          <div className="lp-hero__cta">
            <a href="#apercu" className="lp-btn lp-btn--primary lp-btn--lg">
              Explorer la plateforme
            </a>
            <button
              type="button"
              className="lp-btn lp-btn--outline lp-btn--lg"
              onClick={() => navigate("/login", { state: { mode: "register" } })}
            >
              Créer un compte
            </button>
          </div>
        </div>

        <div className="lp-hero__visual" aria-hidden="true">
          <div className="lp-decision-card lp-decision-card--main">
            <div className="lp-decision-card__head">
              <span>Client CL-4471</span>
              <span className="lp-pill lp-pill--accepte">Accepté</span>
            </div>
            <div className="lp-decision-card__score">
              <div className="lp-gauge">
                <svg viewBox="0 0 120 68">
                  <path
                    d="M10 60 A50 50 0 0 1 110 60"
                    fill="none"
                    stroke="var(--lp-surface-tint)"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 60 A50 50 0 0 1 110 60"
                    fill="none"
                    stroke="var(--lp-accent)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="157"
                    strokeDashoffset="27"
                  />
                </svg>
                <div className="lp-gauge__value">
                  742
                  <span>score</span>
                </div>
              </div>
              <ul className="lp-decision-card__meta">
                <li>
                  <span>Montant</span>4 200 000 Ar
                </li>
                <li>
                  <span>Explicabilité</span>SHAP · stable
                </li>
                <li>
                  <span>Anomalie</span>Aucune détectée
                </li>
              </ul>
            </div>
          </div>

          <div className="lp-float-card lp-float-card--alert">
            <span className="lp-float-card__dot" />
            Fraude potentielle détectée — CL-4473
          </div>

          <div className="lp-float-card lp-float-card--tag">Pipeline : 100% validé</div>
        </div>
      </div>
    </section>
  );
}