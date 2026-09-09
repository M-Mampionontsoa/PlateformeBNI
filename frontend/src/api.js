const BASE = "/api";
// Origine complete du backend, utilisee uniquement pour les redirections
// pleine page (ex: OAuth Google) qui ne passent pas par le proxy Vite.
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:8000";

async function request(path, options = {}) {
  const token = localStorage.getItem("access_token");
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("access_token");
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

  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const data = await request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    localStorage.setItem("access_token", data.access_token);
    return data;
  },

  logout: () => {
    localStorage.removeItem("access_token");
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
    const token = localStorage.getItem("access_token");
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