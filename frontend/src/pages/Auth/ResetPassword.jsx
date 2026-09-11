import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import "../styles/auth.css";
import { api } from "../../api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Lien invalide ou expiré.");
      return;
    }
    if (password.length < 8) {
      setError("8 caractères minimum.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-screen">
        <div className="auth-content">
          <div className="auth-card">
            <h1 className="auth-title">Lien invalide</h1>
            <p className="auth-subtitle">
              Ce lien de réinitialisation est invalide ou incomplet.
            </p>
            <Link to="/login" className="auth-link">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-content">
        <div className="auth-card">
          <h1 className="auth-title">Nouveau mot de passe</h1>
          <p className="auth-subtitle">
            Choisissez un nouveau mot de passe pour votre compte.
          </p>

          {success ? (
            <p className="auth-error" style={{ color: "#16a34a" }}>
              Mot de passe mis à jour. Redirection…
            </p>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label className="auth-field">
                <span className="auth-label">Nouveau mot de passe</span>
                <span className="auth-input">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </span>
              </label>

              <label className="auth-field">
                <span className="auth-label">Confirmer le mot de passe</span>
                <span className="auth-input">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                </span>
              </label>

              {error && <span className="auth-error">{error}</span>}

              <button
                className="auth-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Un instant…" : "Réinitialiser le mot de passe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
