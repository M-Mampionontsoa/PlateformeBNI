// En local, on garde le proxy Vite (/api -> localhost:8000).
// En production statique (Cloudflare Pages/Vercel), les appels doivent
// viser directement l'API publique, car le frontend n'a pas de proxy /api.
const configuredOrigin = (import.meta.env.VITE_API_ORIGIN || "").replace(/\/$/, "");
export const API_ORIGIN = configuredOrigin || "http://localhost:8000";
const BASE = configuredOrigin ? `${API_ORIGIN}/api` : "/api";

const TOKEN_KEY = "access_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token, remember) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Erreur ${res.status}`);
  }
  return res.json();
}

export const api = {
  // --- Auth ---
  register: (full_name, email, password) =>
    request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name, email, password }),
    }),

  login: async (email, password, remember = false) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    formData.append("remember", remember ? "true" : "false");

    const data = await request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    setToken(data.access_token, remember);
    return data;
  },

  logout: () => {
    clearToken();
  },

  getCurrentUser: () => request("/auth/me"),

  // --- Existant ---
  listDatasets: () => request("/datasets"),
  getDataset: (id) => request(`/datasets/${id}`),
  getData: (id, page = 1, pageSize = 25) =>
    request(`/datasets/${id}/data?page=${page}&page_size=${pageSize}`),
  getSummary: (id) => request(`/datasets/${id}/summary`),
  getGraph: () => request(`/graph/overview`),
  listJobs: () => request(`/ingestion/jobs`),
  getJob: (id) => request(`/ingestion/jobs/${id}`),
  uploadFile: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const token = getToken();
    const res = await fetch(`${BASE}/ingestion/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Erreur ${res.status}`);
    }
    return res.json();
  },
};
