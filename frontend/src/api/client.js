export const resumeAPI = {
  upload: (file) => {
    const form = new FormData();
    form.append("file", file);

    return client.post("/resume/upload", form, {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-User-ID": JSON.parse(localStorage.getItem("jat_user"))?.id,
      },
    });
  },

  list: () =>
    client.get("/resume/list", {
      headers: {
        "X-User-ID": JSON.parse(localStorage.getItem("jat_user"))?.id,
      },
    }),

  get: (id) =>
    client.get(`/resume/${id}`, {
      headers: {
        "X-User-ID": JSON.parse(localStorage.getItem("jat_user"))?.id,
      },
    }),

  delete: (id) =>
    client.delete(`/resume/${id}`, {
      headers: {
        "X-User-ID": JSON.parse(localStorage.getItem("jat_user"))?.id,
      },
    }),
};