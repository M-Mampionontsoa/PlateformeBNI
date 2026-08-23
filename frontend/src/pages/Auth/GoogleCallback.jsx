import { useEffect } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";


export default function GoogleCallback({ onAuth }) {

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();


  useEffect(() => {

    const token = searchParams.get("token");

    console.log(
      "Google callback - token reçu :",
      !!token
    );


    // ===================================================
    // TOKEN GOOGLE/JWT REÇU
    // ===================================================

    if (token) {

      localStorage.setItem(
        "access_token",
        token
      );

      // Informer App.jsx que l'utilisateur est connecté
      if (onAuth) {
        onAuth();
      } else {
        // Sécurité supplémentaire
        navigate("/", {
          replace: true,
        });
      }

      return;
    }


    // ===================================================
    // ERREUR
    // ===================================================

    console.error(
      "Google callback : aucun token reçu"
    );

    navigate(
      "/login?error=google_auth_failed",
      {
        replace: true,
      }
    );

  }, [
    searchParams,
    navigate,
    onAuth,
  ]);


  return (

    <div className="auth-screen">

      <div
        className="auth-card"
        style={{
          textAlign: "center",
          padding: "60px 40px",
        }}
      >

        <p>
          Connexion avec Google en cours…
        </p>

      </div>

    </div>

  );
}