import { Link, useSearchParams } from "react-router-dom";
import "../styles/auth.css";

export default function CheckEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="auth-screen">
      <div className="auth-content">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h1 className="auth-title">Vérifiez votre boîte mail</h1>
          <p className="auth-subtitle">
            {email ? (
              <>
                Un email de confirmation a été envoyé à <strong>{email}</strong>
                .
              </>
            ) : (
              "Un email de confirmation vous a été envoyé."
            )}
            <br />
            Cliquez sur le lien reçu pour définir votre nouveau mot de passe. Le
            lien expire dans 30 minutes.
          </p>
          <Link to="/login" className="auth-link">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
