import React, { useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { FileText, Upload, Trash2, Eye, Download } from "lucide-react";

import toast from "react-hot-toast";

import { resumeAPI } from "../api/client";

import { useAuth } from "../App";

import Loader from "../components/Loader";

export default function ResumeParser() {
  const { user, theme } = useAuth();

  const queryClient = useQueryClient();

  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);

  const [previewingId, setPreviewingId] = useState(null);

  const [downloadingId, setDownloadingId] = useState(null);

  // =========================================================
  // GET RESUMES
  // =========================================================

  const {
    data: resumes = [],

    isLoading,
  } = useQuery({
    queryKey: ["resumes", user?.id],

    // queryFn: async () => {
    //   const data = await resumeAPI.list();

    //   return Array.isArray(data) ? data : [];
    // },

    queryFn: async () => {
      const response = await resumeAPI.list();

      console.log("RESUME LIST RESPONSE:", response);

      return Array.isArray(response.data) ? response.data : [];
    },

    enabled: !!user?.id,
  });

  // =========================================================
  // UPLOAD MUTATION
  // =========================================================

  const uploadMutation = useMutation({
    mutationFn: (file) => resumeAPI.upload(file),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["resumes", user?.id],
        exact: true,
      });

      toast.success("Resume uploaded successfully");
    },

    onError: (error) => {
      console.error("UPLOAD ERROR:", error);

      toast.error(error.message || "Resume upload failed");
    },
  });

  // =========================================================
  // DELETE MUTATION
  // =========================================================

  const deleteMutation = useMutation({
    mutationFn: (resumeId) => resumeAPI.delete(resumeId),

    onSuccess: (response, deletedResumeId) => {
      console.log("DELETE RESPONSE:", response);
      console.log("DELETED ID:", deletedResumeId);

      queryClient.setQueryData(["resumes", user?.id], (oldResumes = []) =>
        oldResumes.filter((resume) => resume.id !== deletedResumeId),
      );

      toast.success("Resume deleted successfully");
    },

    onError: (error) => {
      console.error("DELETE ERROR:", error);

      toast.error(error.message || "Failed to delete resume");
    },
  });

  // =========================================================
  // VALIDATE + UPLOAD FILE
  // =========================================================

  const handleFile = (file) => {
    if (!file) {
      return;
    }

    const allowedExtensions = [".pdf", ".docx", ".txt"];

    const lowerFilename = file.name.toLowerCase();

    const validExtension = allowedExtensions.some((extension) =>
      lowerFilename.endsWith(extension),
    );

    if (!validExtension) {
      toast.error("Only PDF, DOCX and TXT files are supported");

      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      toast.error("Maximum file size is 10 MB");

      return;
    }

    uploadMutation.mutate(file);
  };

  // =========================================================
  // FILE INPUT
  // =========================================================

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];

    handleFile(file);

    event.target.value = "";
  };

  // =========================================================
  // DROP
  // =========================================================

  const handleDrop = (event) => {
    event.preventDefault();

    setDragging(false);

    const file = event.dataTransfer.files?.[0];

    handleFile(file);
  };

  // =========================================================
  // PREVIEW
  // =========================================================

  const handlePreview = async (resume) => {
    if (!resume?.id) {
      toast.error("Resume ID missing");
      return;
    }

    const previewWindow = window.open("", "_blank");

    setPreviewingId(resume.id);

    try {
      const response = await resumeAPI.preview(resume.id);

      const blob = response.data;

      if (!(blob instanceof Blob)) {
        throw new Error("Invalid preview response");
      }

      const blobUrl = URL.createObjectURL(blob);

      if (previewWindow) {
        previewWindow.location.href = blobUrl;
      } else {
        window.open(blobUrl, "_blank");
      }

      setTimeout(
        () => {
          URL.revokeObjectURL(blobUrl);
        },
        5 * 60 * 1000,
      );
    } catch (error) {
      console.error("PREVIEW ERROR:", error);

      if (previewWindow) {
        previewWindow.close();
      }

      toast.error(error.message || "Preview failed");
    } finally {
      setPreviewingId(null);
    }
  };

  // =========================================================
  // DOWNLOAD
  // =========================================================

  const handleDownload = async (resume) => {
    if (!resume?.id) {
      toast.error("Resume ID missing");
      return;
    }

    setDownloadingId(resume.id);

    try {
      const response = await resumeAPI.download(resume.id);

      console.log("DOWNLOAD RESPONSE:", response);

      // Axios stores the Blob inside response.data
      const blob = response.data;

      if (!(blob instanceof Blob)) {
        console.error("INVALID DOWNLOAD BLOB:", blob);
        throw new Error("Invalid download response");
      }

      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;

      link.download = resume.original_filename || "resume";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      toast.success("Resume downloaded");
    } catch (error) {
      console.error("DOWNLOAD ERROR:", error);

      toast.error(
        error.response?.data?.detail || error.message || "Download failed",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = (resumeId) => {
    if (!resumeId) {
      toast.error("Resume ID missing");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this resume?",
    );

    if (!confirmed) {
      return;
    }

    console.log("DELETING RESUME ID:", resumeId);

    deleteMutation.mutate(resumeId);
  };

  return (
    <div>
      <div
        style={{
          marginBottom: "1.5rem",
        }}
      >
        <h1
          style={{
            margin: 0,

            fontSize: 22,

            fontWeight: 800,

            color: theme.text,
          }}
        >
          Resumes
        </h1>

        <p
          style={{
            margin: "4px 0 0",

            color: theme.subtext,

            fontSize: 13,
          }}
        >
          Upload and manage your resumes
        </p>
      </div>

      {/* UPLOAD AREA */}

      <div
        onDragOver={(event) => {
          event.preventDefault();

          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: dragging
            ? "2px dashed #6366f1"
            : `2px dashed ${theme.border}`,

          borderRadius: 14,

          padding: "2.2rem",

          textAlign: "center",

          cursor: "pointer",

          background: dragging ? "#eef2ff" : theme.card,

          marginBottom: 18,

          transition: "0.2s",
        }}
      >
        <Upload size={32} color="#6366f1" />

        <div
          style={{
            marginTop: 10,

            fontWeight: 700,

            color: theme.text,
          }}
        >
          {uploadMutation.isPending
            ? "Uploading resume..."
            : "Drop your resume here or click to browse"}
        </div>

        <div
          style={{
            marginTop: 5,

            fontSize: 12,

            color: theme.subtext,
          }}
        >
          PDF, DOCX or TXT · Maximum 10 MB
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          hidden
          onChange={handleInputChange}
        />
      </div>

      {/* CONTENT */}

      {isLoading ? (
        <Loader text="Loading resumes..." />
      ) : resumes.length === 0 ? (
        <div
          style={{
            textAlign: "center",

            padding: "2rem",

            color: "#94a3b8",

            fontSize: 14,
          }}
        >
          No resumes yet. Upload one above to get started.
        </div>
      ) : (
        <div
          style={{
            background: theme.card,

            border: `1px solid ${theme.border}`,

            borderRadius: 14,

            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",

              borderCollapse: "collapse",

              minWidth: 750,

              fontSize: 13,
            }}
          >
            {/* TABLE HEADER */}

            <thead>
              <tr
                style={{
                  background: theme.bg,
                }}
              >
                <th
                  style={{
                    padding: 14,

                    textAlign: "left",

                    color: theme.subtext,
                  }}
                >
                  Resume Name
                </th>

                <th
                  style={{
                    padding: 14,

                    textAlign: "left",

                    color: theme.subtext,
                  }}
                >
                  Skills Found
                </th>

                <th
                  style={{
                    padding: 14,

                    textAlign: "left",

                    color: theme.subtext,
                  }}
                >
                  Uploaded On
                </th>

                <th
                  style={{
                    padding: 14,

                    textAlign: "right",

                    color: theme.subtext,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            {/* TABLE BODY */}

            <tbody>
              {resumes.map((resume) => {
                const skills = resume.parsed?.skills || [];

                return (
                  <tr key={resume.id}>
                    {/* RESUME NAME */}

                    <td
                      style={{
                        padding: 14,

                        borderTop: `1px solid ${theme.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",

                          alignItems: "center",

                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 36,

                            height: 36,

                            borderRadius: 8,

                            background: "#eef2ff",

                            display: "flex",

                            alignItems: "center",

                            justifyContent: "center",

                            flexShrink: 0,
                          }}
                        >
                          <FileText size={17} color="#6366f1" />
                        </div>

                        <span
                          style={{
                            fontWeight: 600,

                            color: theme.text,
                          }}
                        >
                          {resume.original_filename}
                        </span>
                      </div>
                    </td>

                    {/* SKILLS */}

                    <td
                      style={{
                        padding: 14,

                        borderTop: `1px solid ${theme.border}`,
                      }}
                    >
                      <span
                        style={{
                          background: "#eef2ff",

                          color: "#6366f1",

                          padding: "5px 10px",

                          borderRadius: 20,

                          fontWeight: 600,
                        }}
                      >
                        {skills.length} Skills
                      </span>
                    </td>

                    {/* DATE */}

                    <td
                      style={{
                        padding: 14,

                        borderTop: `1px solid ${theme.border}`,

                        color: theme.subtext,

                        whiteSpace: "nowrap",
                      }}
                    >
                      {resume.created_at
                        ? new Date(resume.created_at).toLocaleDateString(
                            "en-IN",

                            {
                              timeZone: "Asia/Kolkata",

                              day: "2-digit",

                              month: "short",

                              year: "numeric",
                            },
                          )
                        : "-"}
                    </td>

                    {/* ACTIONS */}

                    <td
                      style={{
                        padding: 14,

                        borderTop: `1px solid ${theme.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",

                          justifyContent: "flex-end",

                          gap: 7,
                        }}
                      >
                        {/* PREVIEW */}

                        <button
                          onClick={() => handlePreview(resume)}
                          disabled={previewingId === resume.id}
                          style={{
                            padding: "6px 10px",

                            borderRadius: 7,

                            background: "#eef2ff",

                            color: "#6366f1",

                            border: "none",

                            cursor: "pointer",

                            fontWeight: 600,

                            display: "flex",

                            alignItems: "center",

                            gap: 5,
                          }}
                        >
                          <Eye size={14} />

                          {previewingId === resume.id
                            ? "Opening..."
                            : "Preview"}
                        </button>

                        {/* DOWNLOAD */}

                        <button
                          onClick={() => handleDownload(resume)}
                          disabled={downloadingId === resume.id}
                          style={{
                            padding: "6px 10px",

                            borderRadius: 7,

                            background: theme.bg,

                            color: theme.subtext,

                            border: `1px solid ${theme.border}`,

                            cursor: "pointer",

                            fontWeight: 600,

                            display: "flex",

                            alignItems: "center",

                            gap: 5,
                          }}
                        >
                          <Download size={14} />

                          {downloadingId === resume.id
                            ? "Downloading..."
                            : "Download"}
                        </button>

                        {/* DELETE */}

                        <button
                          onClick={() => handleDelete(resume.id)}
                          disabled={
                            deleteMutation.isPending &&
                            deleteMutation.variables === resume.id
                          }
                          style={{
                            padding: "6px 8px",

                            borderRadius: 7,

                            background: "#fef2f2",

                            border: "1px solid #fecaca",

                            cursor: "pointer",

                            display: "flex",

                            alignItems: "center",
                          }}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
