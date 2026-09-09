import React, { useEffect, useState } from "react";
import useReveal from "../hooks/useReveal.js";
import { STATS } from "../mockData.js";

function useCountUp(target, active, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = null;
    let frame;

    const step = (ts) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);

  return value;
}

export default function Statistics() {
  const [ref, visible] = useReveal();

  return (
    <section className="lp-stats" ref={ref} data-reveal={visible}>
      {STATS.map((stat) => (
        <StatItem key={stat.label} stat={stat} active={visible} />
      ))}
    </section>
  );
}

function StatItem({ stat, active }) {
  const value = useCountUp(stat.value, active);
  return (
    <div className="lp-stats__item">
      <span className="lp-stats__value">
        {value}
        {stat.suffix}
      </span>
      <span className="lp-stats__label">{stat.label}</span>
    </div>
  );
}