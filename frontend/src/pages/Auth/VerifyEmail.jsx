import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/auth.css";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Lien de verification invalide.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || "Le lien de verification est invalide ou a expire.");
        }
        return res.json();
      })
      .then(() => {
        setStatus("success");
        setMessage("Votre adresse email a ete verifiee avec succes.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [searchParams]);

  return (
    <div className="auth-screen">
      <div className="auth-glow" aria-hidden="true" />
      <div className="auth-content">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h1 className="auth-title">Verification de l'email</h1>
          <p className="auth-subtitle">
            {status === "loading" && "Verification en cours…"}
            {status !== "loading" && message}
          </p>
          <Link to="/login" className="auth-submit" style={{ display: "inline-flex", marginTop: 20 }}>
            Retour a la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
