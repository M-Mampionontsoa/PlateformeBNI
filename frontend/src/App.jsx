import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import { api } from "./api.js";

import Landing from "./pages/Landing/Landing.jsx";
import Auth from "./pages/Auth/Auth.jsx";
import GoogleCallback from "./pages/Auth/GoogleCallback.jsx";
import VerifyEmail from "./pages/Auth/VerifyEmail.jsx";
import ResetPassword from "./pages/Auth/ResetPassword.jsx";
import CheckEmail from "./pages/Auth/CheckEmail.jsx";

import Shell from "./layout/Shell.jsx";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("access_token"),
  );

  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  // =====================================================
  // AUTHENTIFICATION
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
  // =====================================================

  useEffect(() => {
    if (!isAuthenticated) {
      setUser(null);
      return;
    }

    let cancelled = false;

    api
      .getCurrentUser()
      .then((u) => {
        if (!cancelled) {
          setUser(u);
        }
      })
      .catch(() => {
        if (!cancelled) {
          handleLogout();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <Routes>
      {/* =================================================
          LANDING
      ================================================= */}

      <Route path="/" element={<Landing />} />

      {/* =================================================
          LOGIN
      ================================================= */}

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/app" replace />
          ) : (
            <Auth onAuth={handleAuth} />
          )
        }
      />
      {/* =================================================
          RESET PASSWD
      ================================================= */}

      <Route path="/reset-password" element={<ResetPassword />} />

      {/* =================================================
          VERIFICATION MAIL
      ================================================= */}

      <Route path="/check-email" element={<CheckEmail />} />

      {/* =================================================
          VERIFICATION EMAIL
      ================================================= */}

      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* =================================================
          GOOGLE CALLBACK
      ================================================= */}

      <Route
        path="/auth/google/callback"
        element={<GoogleCallback onAuth={handleAuth} />}
      />

      {/* =================================================
          APPLICATION
      ================================================= */}

      <Route
        path="/app/*"
        element={
          isAuthenticated ? (
            <Shell onLogout={handleLogout} user={user} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* =================================================
          EXPLORER DATASET
      ================================================= */}

      {/* =================================================
          FALLBACK
      ================================================= */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
