import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";
import { api, API_ORIGIN } from "../../api";

const TABS = [
  { key: "signin", label: "Connexion" },
  { key: "register", label: "Inscription" },
];

function IconShelf() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" strokeLinecap="round" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
      <path d="M4.5 7l7.5 6 7.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
      <path d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7" strokeLinecap="round" />
    </svg>
  );
}

function IconGoogle() {
  return (
    <svg viewBox="0 0 18 18" width="16" height="16">
      <path fill="#4285F4" d="M17.6 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.66-3.87 2.66-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.42 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

function IconMicrosoft() {
  return (
    <svg viewBox="0 0 18 18" width="16" height="16">
      <rect x="1" y="1" width="7.5" height="7.5" fill="#F35325" />
      <rect x="9.5" y="1" width="7.5" height="7.5" fill="#81BC06" />
      <rect x="1" y="9.5" width="7.5" height="7.5" fill="#05A6F0" />
      <rect x="9.5" y="9.5" width="7.5" height="7.5" fill="#FFBA08" />
    </svg>
  );
}

export default function Auth({ onAuth }) {
  const [tab, setTab] = useState("signin");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const switchTab = (key) => {
    setTab(key);
    setErrors({});
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = "L'adresse email est requise.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Adresse email invalide.";

    if (!form.password) next.password = "Le mot de passe est requis.";
    else if (form.password.length < 8) next.password = "8 caractères minimum.";

    if (tab === "register") {
      if (!form.name.trim()) next.name = "Le nom complet est requis.";
      if (form.confirm !== form.password) next.confirm = "Les mots de passe ne correspondent pas.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (tab === "signin") {
        await api.login(form.email, form.password);
      } else {
        await api.register(form.name, form.email, form.password);
        // Après inscription, on connecte directement l'utilisateur
        await api.login(form.email, form.password);
      }
      onAuth?.(form);
    } catch (err) {
      setErrors({ form: err.message || "Une erreur est survenue. Réessayez." });
    } finally {
      setSubmitting(false);
    }
};

  return (
    <div className="auth-screen">
      <div className="auth-glow" aria-hidden="true" />

      <Link to="/" className="auth-back">
        <IconArrowLeft />
        Retour à l'accueil
      </Link>

      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-mark">
              <IconShelf />
            </span>
            Entrepot
          </div>

          <h1 className="auth-title">{tab === "signin" ? "Bon retour" : "Créer un compte"}</h1>
          <p className="auth-subtitle">
            {tab === "signin"
              ? "Connectez-vous pour accéder à votre entrepôt de données."
              : "Quelques informations suffisent pour commencer."}
          </p>

          <div className="auth-tabs" role="tablist" aria-label="Authentification">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={"auth-tab" + (tab === t.key ? " active" : "")}
                onClick={() => switchTab(t.key)}
              >
                {t.label}
              </button>
            ))}
            <span className={"auth-tab-indicator " + tab} aria-hidden="true" />
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {tab === "register" && (
              <label className="auth-field">
                <span className="auth-label">Nom complet</span>
                <span className={"auth-input" + (errors.name ? " has-error" : "")}>
                  <IconUser />
                  <input
                    type="text"
                    placeholder="Rakoto Andry"
                    value={form.name}
                    onChange={update("name")}
                    autoComplete="name"
                  />
                </span>
                {errors.name && <span className="auth-error">{errors.name}</span>}
              </label>
            )}

            <label className="auth-field">
              <span className="auth-label">Adresse email</span>
              <span className={"auth-input" + (errors.email ? " has-error" : "")}>
                <IconMail />
                <input
                  type="email"
                  placeholder="nom@bni.mg"
                  value={form.email}
                  onChange={update("email")}
                  autoComplete="email"
                />
              </span>
              {errors.email && <span className="auth-error">{errors.email}</span>}
            </label>

            <label className="auth-field">
              <span className="auth-label-row">
                <span className="auth-label">Mot de passe</span>
                {tab === "signin" && (
                  <a className="auth-link" href="#forgot">
                    Mot de passe oublié ?
                  </a>
                )}
              </span>
              <span className={"auth-input" + (errors.password ? " has-error" : "")}>
                <IconLock />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={update("password")}
                  autoComplete={tab === "signin" ? "current-password" : "new-password"}
                />
              </span>
              {errors.password && <span className="auth-error">{errors.password}</span>}
            </label>

            {tab === "register" && (
              <label className="auth-field">
                <span className="auth-label">Confirmer le mot de passe</span>
                <span className={"auth-input" + (errors.confirm ? " has-error" : "")}>
                  <IconLock />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={update("confirm")}
                    autoComplete="new-password"
                  />
                </span>
                {errors.confirm && <span className="auth-error">{errors.confirm}</span>}
              </label>
            )}

            {tab === "signin" && (
              <label className="auth-remember">
                <input type="checkbox" checked={form.remember} onChange={update("remember")} />
                Rester connecté pendant 30 jours
              </label>
            )}

            {errors.form && <span className="auth-error">{errors.form}</span>}

            <button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? "Un instant…" : tab === "signin" ? "Se connecter" : "Créer mon compte"}
              {!submitting && (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>ou continuer avec</span>
          </div>

          <div className="auth-social">
            <button
              type="button"
              className="auth-social-btn"
              onClick={() => {
                window.location.href = `${API_ORIGIN}/api/auth/google/login`;
              }}
            >
              <IconGoogle /> Google
            </button>
            <button type="button" className="auth-social-btn">
              <IconMicrosoft /> Microsoft
            </button>
          </div>

          <p className="auth-switch">
            {tab === "signin" ? (
              <>
                Pas encore de compte ?{" "}
                <button type="button" onClick={() => switchTab("register")}>
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{" "}
                <button type="button" onClick={() => switchTab("signin")}>
                  Se connecter
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}