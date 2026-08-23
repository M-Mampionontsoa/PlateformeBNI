import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NAV_LINKS } from "../mockData.js";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToLogin = (mode) => {
    setMenuOpen(false);
    navigate("/login", { state: { mode } });
  };

  return (
    <header className={"lp-navbar" + (scrolled ? " lp-navbar--scrolled" : "")}>
      <div className="lp-navbar__inner">
        <a href="#top" className="lp-brand">
          <span className="lp-brand__mark" aria-hidden="true" />
          <span className="lp-brand__text">
            Entrepôt
            <span className="lp-brand__sub">Data Warehouse platform</span>
          </span>
        </a>

        <nav className="lp-navbar__links" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="lp-navbar__link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="lp-navbar__auth">
          <button
            type="button"
            className="lp-btn lp-btn--ghost"
            onClick={() => goToLogin("signin")}
          >
            Se connecter
          </button>
          <button
            type="button"
            className="lp-btn lp-btn--primary"
            onClick={() => goToLogin("register")}
          >
            S'inscrire
          </button>
        </div>

        <button
          type="button"
          className={"lp-navbar__burger" + (menuOpen ? " is-open" : "")}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen && (
        <div className="lp-navbar__mobile">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="lp-navbar__mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="lp-navbar__mobile-auth">
            <button
              type="button"
              className="lp-btn lp-btn--ghost"
              onClick={() => goToLogin("signin")}
            >
              Se connecter
            </button>
            <button
              type="button"
              className="lp-btn lp-btn--primary"
              onClick={() => goToLogin("register")}
            >
              S'inscrire
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
