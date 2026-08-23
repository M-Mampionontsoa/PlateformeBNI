import React from "react";
import { FOOTER_COLUMNS } from "../mockData.js";

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer__inner">
        <div className="lp-footer__brand">
          <span className="lp-brand__mark" aria-hidden="true" />
          <div>
            <span className="lp-brand__text">Entrepôt</span>
            <p>
              Data warehouse pour le credit scoring et la détection de
              fraude — un projet mené par une équipe étudiante de la MISA.
            </p>
          </div>
        </div>

        <div className="lp-footer__columns">
          {FOOTER_COLUMNS.map((col) => (
            <div className="lp-footer__col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-footer__bottom">
        <span>© {new Date().getFullYear()} Entrepôt — Projet étudiant MISA</span>
      </div>
    </footer>
  );
}