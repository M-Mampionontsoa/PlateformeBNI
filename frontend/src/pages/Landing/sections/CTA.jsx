import React from "react";
import { useNavigate } from "react-router-dom";
import useReveal from "../hooks/useReveal.js";

export default function CTA() {
  const navigate = useNavigate();
  const [ref, visible] = useReveal();

  return (
    <section className="lp-cta" ref={ref} data-reveal={visible}>
      <div className="lp-cta__bg" aria-hidden="true" />
      <div className="lp-cta__inner">
        <h2>Prêt à explorer l'entrepôt ?</h2>
        <p>
          Rejoignez la plateforme pour ingérer vos données, suivre le pipeline
          et consulter les décisions de scoring et de détection de fraude.
        </p>
        <div className="lp-cta__actions">
          <a href="#apercu" className="lp-btn lp-btn--primary lp-btn--lg">
            Explorer la plateforme
          </a>
          <button
            type="button"
            className="lp-btn lp-btn--outline-light lp-btn--lg"
            onClick={() => navigate("/login", { state: { mode: "register" } })}
          >
            S'inscrire
          </button>
        </div>
      </div>
    </section>
  );
}