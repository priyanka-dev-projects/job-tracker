// import axios from "axios";

// const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

// // const client = axios.create({ baseURL: API_BASE });

// const client = axios.create({
//   baseURL: API_BASE,
//   timeout: 15000,
// });

// client.interceptors.request.use((config) => {
//   const token = localStorage.getItem("jat_token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// client.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     if (err.response?.status === 401) {
//       localStorage.removeItem("jat_token");
//       localStorage.removeItem("jat_user");
//       window.location.href = "/login";
//     }
//     return Promise.reject(err);
//   },
// );

// export const authAPI = {
//   register: (data) => client.post("/auth/register", data),
//   login: (email, password) =>
//     client.post(
//       "/auth/login",
//       new URLSearchParams({ username: email, password }),
//       {
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       },
//     ),
//   me: () => client.get("/auth/me"),
// };

// export const resumeAPI = {
//   upload: (file) => {
//     const form = new FormData();
//     form.append("file", file);
//     // return client.post("/resume/upload", form);
//     return client.post("/resumes/upload", form, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//         "X-User-ID": JSON.parse(localStorage.getItem("jat_user"))?.id,
//       },
//     });
//   },
//   // list: () => client.get("/resume"),
//   list: () => client.get("/resumes"),
//   // // list: () =>
//   // //   client.get("/resume/list", {
//   //     headers: {
//   //       "X-User-ID": JSON.parse(localStorage.getItem("jat_user"))?.id,
//   //     },
//   // //   }),
//   get: (id) => client.get(`/resumes/${id}`),
//   delete: (id) => client.delete(`/resumes/${id}`),
// };

// export const appAPI = {
//   // list: () => client.get("/applications"),
//   list: (status = "all", search = "") =>
//     client.get("/applications", {
//       params: { status, search },
//     }),
//   get: (id) => client.get(`/applications/${id}`),
//   create: (data) => client.post("/applications", data),
//   update: (id, data) => client.patch(`/applications/${id}`, data),
//   delete: (id) => client.delete(`/applications/${id}`),
//   updateStatus: (id, status, note) =>
//     client.patch(`/applications/${id}/status`, { status, note }),
//   stats: () => client.get("/applications/stats/overview"),
// };

// export const matchAPI = {
//   match: (resume_id, application_id, jd_text) =>
//     client.post("/match", { resume_id, application_id, jd_text }),
//   gaps: (application_id) => client.get(`/gaps/${application_id}`),
//   dashboard: () => client.get("/dashboard/skills"),
// };

// export default client;

// const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
const API_BASE = process.env.REACT_APP_API_URL || "https://jat-frontend-1m06.onrender.com";

// ============================================================
// HELPERS
// ============================================================

const getToken = () => {
  return localStorage.getItem("jat_token");
};

const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("jat_user") || "null");

    return user?.id || "";
  } catch {
    return "";
  }
};

const buildHeaders = (customHeaders = {}, isFormData = false) => {
  const headers = {
    ...customHeaders,
  };

  const token = getToken();

  const userId = getUserId();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (userId) {
    headers["X-User-ID"] = userId;
  }

  /*
    IMPORTANT

    Do not manually set Content-Type for FormData.

    Browser automatically creates:

    multipart/form-data; boundary=....
  */

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

// ============================================================
// HANDLE UNAUTHORIZED
// ============================================================

const handleUnauthorized = () => {
  localStorage.removeItem("jat_token");

  localStorage.removeItem("jat_user");

  window.location.href = "/login";
};

// ============================================================
// RESPONSE PARSER
// ============================================================

const parseResponse = async (response, responseType = "json") => {
  if (response.status === 401) {
    handleUnauthorized();

    throw new Error("Session expired");
  }

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;

    try {
      const errorData = await response.json();

      errorMessage = errorData?.detail || errorData?.message || errorMessage;
    } catch {
      // Response was not JSON
    }

    const error = new Error(errorMessage);

    error.status = response.status;

    throw error;
  }

  if (responseType === "blob") {
    const blob = await response.blob();

    return {
      data: blob,

      status: response.status,

      headers: response.headers,
    };
  }

  if (response.status === 204) {
    return {
      data: null,

      status: response.status,

      headers: response.headers,
    };
  }

  const data = await response.json();

  /*
    Axios-compatible response shape.

    Existing code can continue using:

    response.data
  */

  return {
    data,

    status: response.status,

    headers: response.headers,
  };
};

// ============================================================
// REQUEST FUNCTION
// ============================================================

const request = async (
  endpoint,
  {
    method = "GET",

    body,

    headers = {},

    responseType = "json",
  } = {},
) => {
  // const isFormData = body instanceof FormData;
  const isFormData = body instanceof FormData;

  const isURLSearchParams = body instanceof URLSearchParams;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,

    headers: buildHeaders(headers, isFormData),

    body:
      body == null
        ? undefined
        : // : isFormData
          isFormData || isURLSearchParams
          ? body
          : JSON.stringify(body),
  });

  return parseResponse(response, responseType);
};

// ============================================================
// AUTH API
// ============================================================

export const authAPI = {
  register: (data) =>
    request("/auth/register", {
      method: "POST",

      body: data,
    }),

  login: (email, password) => {
    const form = new URLSearchParams();

    form.append("username", email);

    form.append("password", password);

    return request("/auth/login", {
      method: "POST",

      body: form,

      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  },

  me: () => request("/auth/me"),
};

// ============================================================
// RESUME API
// ============================================================

export const resumeAPI = {
  upload: (file) => {
    const form = new FormData();

    form.append("file", file);

    return request("/resumes/upload", {
      method: "POST",

      body: form,
    });
  },

  list: () => request("/resumes"),

  get: (id) => request(`/resumes/${id}`),

  preview: (id) =>
    request(`/resumes/${id}/preview`, {
      responseType: "blob",
    }),

  download: (id) =>
    request(`/resumes/${id}/download`, {
      responseType: "blob",
    }),

  delete: (id) =>
    request(`/resumes/${id}`, {
      method: "DELETE",
    }),
};

// ============================================================
// APPLICATION API
// ============================================================

export const appAPI = {
  list: (status = "all", search = "") => {
    const params = new URLSearchParams();

    params.set("status", status);

    params.set("search", search);

    return request(`/applications?${params.toString()}`);
  },

  get: (id) => request(`/applications/${id}`),

  create: (data) =>
    request("/applications", {
      method: "POST",

      body: data,
    }),

  update: (id, data) =>
    request(`/applications/${id}`, {
      method: "PATCH",

      body: data,
    }),

  delete: (id) =>
    request(`/applications/${id}`, {
      method: "DELETE",
    }),

  updateStatus: (id, status, note) =>
    request(`/applications/${id}/status`, {
      method: "PATCH",

      body: {
        status,

        note,
      },
    }),

  stats: () => request("/applications/stats/overview"),
};

// ============================================================
// MATCH API
// ============================================================

export const matchAPI = {
  match: (resume_id, application_id, jd_text) =>
    request("/match", {
      method: "POST",

      body: {
        resume_id,

        application_id,

        jd_text,
      },
    }),

  gaps: (application_id) => request(`/gaps/${application_id}`),

  dashboard: () => request("/dashboard/skills"),
};

// ============================================================
// DEFAULT CLIENT
// ============================================================

const client = {
  get: (endpoint, options = {}) =>
    request(endpoint, {
      method: "GET",

      ...options,
    }),

  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: "POST",

      body,

      ...options,
    }),

  patch: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: "PATCH",

      body,

      ...options,
    }),

  delete: (endpoint, options = {}) =>
    request(endpoint, {
      method: "DELETE",

      ...options,
    }),
};

export default client;
