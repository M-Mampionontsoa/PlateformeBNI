import React from "react";
import useReveal from "../hooks/useReveal.js";
import { PIPELINE_STEPS } from "../mockData.js";

export default function HowItWorks() {
  const [headRef, headVisible] = useReveal();

  return (
    <section id="pipeline" className="lp-section lp-section--tint">
      <div className="lp-section__head" ref={headRef} data-reveal={headVisible}>
        <span className="lp-eyebrow">Pipeline de données</span>
        <h2>De la source brute à la donnée exploitable.</h2>
        <p className="lp-section__desc">
          Chaque donnée qui entre dans l'entrepôt suit le même parcours,
          tracé et contrôlé, avant d'être mise à disposition des équipes.
        </p>
      </div>

      <ol className="lp-pipeline">
        {PIPELINE_STEPS.map((step, i) => (
          <PipelineStep key={step.index} step={step} index={i} />
        ))}
      </ol>
    </section>
  );
}

function PipelineStep({ step, index }) {
  const [ref, visible] = useReveal();
  return (
    <li
      className="lp-pipeline__step"
      ref={ref}
      data-reveal={visible}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <span className="lp-pipeline__index">{step.index}</span>
      <div className="lp-pipeline__body">
        <h3>{step.title}</h3>
        <p>{step.description}</p>
      </div>
    </li>
  );
}