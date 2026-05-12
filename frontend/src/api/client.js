import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("jat_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("jat_token");
      localStorage.removeItem("jat_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export const authAPI = {
  register: (data) => client.post("/auth/register", data),
  login: (email, password) =>
    client.post(
      "/auth/login",
      new URLSearchParams({ username: email, password }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    ),
  me: () => client.get("/auth/me"),
};

export const resumeAPI = {
  upload: (file) => {
    const form = new FormData();
    form.append("file", file);
    // return client.post("/resume/upload", form);
    return client.post("/resume/upload", form, {
      headers: {
        "Content-Type": "multipart/form-data",
        // "X-User-ID": JSON.parse(localStorage.getItem("jat_user"))?.id,
      },
    });
  },
  // list: () => client.get("/resume"),
  list: () => client.get("/resume/list"),
  // list: () =>
  //   client.get("/resume/list", {
  //     headers: {
  //       "X-User-ID": JSON.parse(localStorage.getItem("jat_user"))?.id,
  //     },
  //   }),
  get: (id) => client.get(`/resumes/${id}`),
  delete: (id) => client.delete(`/resumes/${id}`),
};

export const appAPI = {
  // list: () => client.get("/applications"),
  list: (status = "all", search = "") =>
    client.get("/applications", {
      params: { status, search },
    }),
  get: (id) => client.get(`/applications/${id}`),
  create: (data) => client.post("/applications", data),
  update: (id, data) => client.patch(`/applications/${id}`, data),
  delete: (id) => client.delete(`/applications/${id}`),
  updateStatus: (id, status, note) =>
    client.patch(`/applications/${id}/status`, { status, note }),
  stats: () => client.get("/applications/stats/overview"),
};

export const matchAPI = {
  match: (resume_id, application_id, jd_text) =>
    client.post("/match", { resume_id, application_id, jd_text }),
  gaps: (application_id) => client.get(`/gaps/${application_id}`),
  dashboard: () => client.get("/dashboard/skills"),
};

export default client;
