import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { api } from "./api.js";

import Landing from "./pages/Landing/Landing.jsx";
import Auth from "./pages/Auth/Auth.jsx";
import GoogleCallback from "./pages/Auth/GoogleCallback.jsx";
import VerifyEmail from "./pages/Auth/VerifyEmail.jsx";
import Shell from "./layout/Shell.jsx";

// Anciennes pages — mises de côté le temps d'intégrer les 8 nouvelles
// sections du dashboard. Rien n'est supprimé, à réintégrer plus tard.
// import Ingestion from "./pages/Ingestion.jsx";
// import DataTable from "./pages/DataTable.jsx";
// import GraphView from "./pages/GraphView.jsx";
// import Summary from "./pages/Summary.jsx";


export default function App() {

  const [isAuthenticated, setIsAuthenticated] =
    useState(
      !!localStorage.getItem("access_token")
    );

  const [user, setUser] = useState(null);

  const navigate = useNavigate();


  // =====================================================
  // AUTHENTIFICATION RÉUSSIE
  // =====================================================

  const handleAuth = () => {

    setIsAuthenticated(true);

    navigate("/app", {
      replace: true,
    });

  };


  // =====================================================
  // DÉCONNEXION
  // =====================================================

  const handleLogout = () => {

    localStorage.removeItem("access_token");

    setIsAuthenticated(false);
    setUser(null);

    navigate("/", {
      replace: true,
    });

  };


  // =====================================================
  // UTILISATEUR CONNECTÉ
  // Récupère /auth/me une fois authentifié. Si le token
  // n'est plus valide (expiré, révoqué...), on déconnecte
  // proprement au lieu de rester bloqué avec un état
  // "authentifié" qui ne l'est plus vraiment.
  // =====================================================

  useEffect(() => {

    if (!isAuthenticated) {
      setUser(null);
      return;
    }

    let cancelled = false;

    api.getCurrentUser()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) handleLogout();
      });

    return () => {
      cancelled = true;
    };

  }, [isAuthenticated]);


  return (

    <Routes>

      {/* =================================================
          LANDING PAGE PUBLIQUE
      ================================================= */}

      <Route
        path="/"
        element={<Landing />}
      />


      {/* =================================================
          LOGIN CLASSIQUE
      ================================================= */}

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate
              to="/app"
              replace
            />
          ) : (
            <Auth
              onAuth={handleAuth}
            />
          )
        }
      />


      {/* =================================================
          VERIFICATION EMAIL
      ================================================= */}

      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />


      {/* =================================================
          CALLBACK GOOGLE
          IMPORTANT :
          cette route doit être traitée AVANT le catch-all
      ================================================= */}

      <Route
        path="/auth/google/callback"
        element={
          <GoogleCallback
            onAuth={handleAuth}
          />
        }
      />


      {/* =================================================
          APPLICATION PROTÉGÉE (sous /app)
      ================================================= */}

      <Route
        path="/app/*"
        element={
          isAuthenticated ? (
            <Shell
              onLogout={handleLogout}
              user={user}
            />
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />


      {/* =================================================
          FALLBACK
      ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>

  );
}