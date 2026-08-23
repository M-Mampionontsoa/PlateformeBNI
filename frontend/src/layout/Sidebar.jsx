import React from "react";
import { NavLink } from "react-router-dom";

export const NAV = [
  { to: "/app", label: "Dashboard", icon: "dashboard" },
  { to: "/app/datasets", label: "Datasets", icon: "datasets" },
  { to: "/app/exploration", label: "Exploration", icon: "exploration" },
  { to: "/app/analyses", label: "Analyses", icon: "analyses" },
  { to: "/app/visualizations", label: "Visualizations", icon: "visualizations" },
  { to: "/app/ml-scoring", label: "ML & Scoring", icon: "ml" },
  { to: "/app/fraud-detection", label: "Fraud Detection", icon: "fraud" },
  { to: "/app/administration", label: "Administration", icon: "admin" },
];

const ICON_PATHS = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.5" />
      <rect x="13" y="10" width="7.5" height="10.5" rx="1.5" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  datasets: (
    <>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.5" />
      <path d="M4.5 5.5v6c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-6" />
      <path d="M4.5 11.5v6c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-6" />
    </>
  ),
  exploration: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.3 15.3L20.5 20.5" strokeLinecap="round" />
    </>
  ),
  analyses: (
    <>
      <path d="M4 20V10M11 20V4M18 20v-7" strokeLinecap="round" />
      <path d="M3 20h18" strokeLinecap="round" />
    </>
  ),
  visualizations: (
    <>
      <path d="M12 3a9 9 0 1 0 9 9h-9V3z" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </>
  ),
  ml: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" strokeLinecap="round" />
    </>
  ),
  fraud: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />,
  admin: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V19.5a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H4.5a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 6.15 9.4a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10.6a1.7 1.7 0 0 0 1.04-1.56V4.5a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10.6a1.7 1.7 0 0 0 1.56 1.04h.09a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.04z" />
    </>
  ),
};

function NavIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      {ICON_PATHS[name]}
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M12 3v18M4 7.5l8 4.5 8-4.5" />
    </svg>
  );
}

function SidebarIllustration() {
  return (
    <svg viewBox="0 0 240 190" fill="none" aria-hidden="true">
      {/* réseau de points, en écho au pipeline de données */}
      <g stroke="var(--accent)" strokeWidth="1" opacity="0.28">
        <line x1="18" y1="18" x2="55" y2="42" />
        <line x1="55" y1="42" x2="30" y2="70" />
        <line x1="55" y1="42" x2="95" y2="30" />
        <line x1="30" y1="70" x2="70" y2="88" />
      </g>
      <g fill="var(--accent)" opacity="0.55">
        <circle cx="18" cy="18" r="2.5" />
        <circle cx="55" cy="42" r="2.5" />
        <circle cx="95" cy="30" r="2" />
        <circle cx="30" cy="70" r="2" />
        <circle cx="70" cy="88" r="2" />
      </g>

      {/* cubes isométriques empilés */}
      <g transform="translate(20 92)">
        <g opacity="0.9">
          <polygon points="40,0 70,15 40,30 10,15" fill="var(--accent)" opacity="0.85" />
          <polygon points="10,15 40,30 40,58 10,43" fill="var(--accent)" opacity="0.55" />
          <polygon points="70,15 40,30 40,58 70,43" fill="var(--accent)" opacity="0.35" />
        </g>
        <g transform="translate(-16 40)" opacity="0.75">
          <polygon points="28,0 50,11 28,22 6,11" fill="var(--accent)" opacity="0.7" />
          <polygon points="6,11 28,22 28,42 6,31" fill="var(--accent)" opacity="0.45" />
          <polygon points="50,11 28,22 28,42 50,31" fill="var(--accent)" opacity="0.3" />
        </g>
        <g transform="translate(46 8)" opacity="0.6">
          <polygon points="20,0 36,8 20,16 4,8" fill="var(--accent)" opacity="0.6" />
          <polygon points="4,8 20,16 20,30 4,22" fill="var(--accent)" opacity="0.4" />
          <polygon points="36,8 20,16 20,30 36,22" fill="var(--accent)" opacity="0.25" />
        </g>
      </g>
    </svg>
  );
}

function getInitials(fullName) {
  if (!fullName) return "…";
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function Sidebar({ onLogout, user }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <aside className="ds-sidebar">
      <div className="ds-sidebar__brand">
        <span className="ds-brand__mark" aria-hidden="true">
          <BrandIcon />
        </span>
        <span className="ds-brand__text">
          Entrepôt
          <span>data warehouse mvp</span>
        </span>
      </div>

      <nav className="ds-sidebar__nav" aria-label="Navigation principale">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/app"}
            className={({ isActive }) => "ds-nav-item" + (isActive ? " active" : "")}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="ds-sidebar__illustration">
        <SidebarIllustration />
      </div>

      <div className="ds-sidebar__footer">
        {menuOpen && (
          <div className="ds-user-menu">
            <button type="button" onClick={onLogout}>
              Déconnexion
            </button>
          </div>
        )}
        <button
          type="button"
          className="ds-user-card"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
        >
          <span className="ds-user-avatar">{getInitials(user?.full_name)}</span>
          <span className="ds-user-card__meta">
            <strong>{user?.full_name || "Chargement…"}</strong>
            <span>{user?.email || ""}</span>
          </span>
          <svg className="ds-user-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </aside>
  );
}