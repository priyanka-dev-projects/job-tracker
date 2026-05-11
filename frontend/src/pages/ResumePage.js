import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { resumeAPI } from "../api/client";
import toast from "react-hot-toast";
import { useAuth } from "../App";
import {
  Upload,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Loader from "../components/Loader";

function Badge({ text, color = "#4f46e5", bg = "#eef2ff" }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: "3px 8px",
        borderRadius: 20,
        background: bg,
        color,
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  );
}

function ResumeCard({ resume, onDelete, theme }) {
  const [open, setOpen] = useState(false);
  const p = resume.parsed;

  return (
    <div
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        marginBottom: 10,
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "1.1rem 1.25rem",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FileText size={18} color="#6366f1" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: theme.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {resume.original_filename}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>
            Uploaded{" "}
            {formatDistanceToNow(new Date(resume.created_at), {
              addSuffix: true,
            })}
            &nbsp;·&nbsp; {p.skills?.length || 0} skills found
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {/* Preview */}
          <a
            href={resume.file_url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "#eef2ff",
              border: "1px solid #c7d2fe",
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 12,
              textDecoration: "none",
              color: "#6366f1",
              fontWeight: 600,
            }}
          >
            Preview
          </a>

          {/* Download */}
          <a
            href={resume.file_url}
            download
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 12,
              textDecoration: "none",
              color: theme.subtext,
              fontWeight: 600,
            }}
          >
            Download
          </a>

          {/* Details */}
          <button
            onClick={() => setOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 12,
              cursor: "pointer",
              color: theme.subtext,
              fontWeight: 500,
            }}
          >
            {open ? (
              <>
                <ChevronUp size={13} /> Hide
              </>
            ) : (
              <>
                <ChevronDown size={13} /> Details
              </>
            )}
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(resume.id)}
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "5px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Trash2 size={13} color="#ef4444" />
          </button>
        </div>
      </div>

      {/* Skills preview always visible */}
      {p.skills?.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            padding: "0 1.25rem 0.85rem",
          }}
        >
          {p.skills.slice(0, open ? 999 : 10).map((s) => (
            <Badge key={s} text={s} />
          ))}
          {!open && p.skills.length > 10 && (
            <button
              onClick={() => setOpen(true)}
              style={{
                fontSize: 11,
                color: "#6366f1",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                padding: "3px 0",
              }}
            >
              +{p.skills.length - 10} more
            </button>
          )}
        </div>
      )}

      {/* Expanded details */}
      {open && (
        <div
          style={{
            borderTop: "1px solid #f1f5f9",
            padding: "1rem 1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {(p.name || p.email || p.phone) && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 6,
                }}
              >
                Contact
              </div>
              {p.name && (
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: theme.text }}
                >
                  {p.name}
                </div>
              )}
              {p.email && (
                <div style={{ fontSize: 13, color: "#6366f1" }}>{p.email}</div>
              )}
              {p.phone && (
                <div style={{ fontSize: 13, color: theme.subtext }}>{p.phone}</div>
              )}
            </div>
          )}
          {p.experience?.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 6,
                }}
              >
                Experience
              </div>
              {p.experience.map((e, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    padding: "4px 0",
                    borderBottom: "1px solid #f8fafc",
                  }}
                >
                  <span style={{ fontWeight: 600, color: theme.text }}>
                    {e.title}
                  </span>
                  {e.company && (
                    <span style={{ color: theme.subtext }}> · {e.company}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {p.education?.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 6,
                }}
              >
                Education
              </div>
              {p.education.map((e, i) => (
                <div key={i} style={{ fontSize: 13, color: "#374151" }}>
                  {e.degree}{" "}
                  {e.year && (
                    <span style={{ color: "#94a3b8" }}>({e.year})</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResumePage() {
  const qc = useQueryClient();
  const { user, theme } = useAuth();
  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ["resumes", user?.id],
    queryFn: () =>
      resumeAPI.list().then((r) =>
        r.data.map((item) => ({
          ...item,
          id: item._id || item.id,
        })),
      ),
    enabled: !!user?.id,
  });

  const uploadMut = useMutation({
    mutationFn: (file) => resumeAPI.upload(file),
    onSuccess: () => {
      qc.invalidateQueries(["resumes"]);
      toast.success("Resume parsed successfully!");
    },
    onError: (err) =>
      toast.error(err.response?.data?.detail || "Upload failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => resumeAPI.delete(id),

    onSuccess: async (_, id) => {
      qc.setQueryData(["resumes", user?.id], (old = []) =>
        old.filter((r) => r.id !== id),
      );

      await qc.invalidateQueries({
        queryKey: ["resumes", user?.id],
      });

      toast.success("Resume deleted");
    },

    onError: () => {
      toast.error("Delete failed");
    },
  });

  // const deleteMut = useMutation({
  //   mutationFn: (id) => resumeAPI.delete(id),
  //   onSuccess: () => {
  //     qc.invalidateQueries(["resumes"]);
  //     toast.success("Resume deleted");
  //   },
  //   onError: () => toast.error("Delete failed"),
  // });

  //   const deleteMut = useMutation({
  //   mutationFn: (id) => resumeAPI.delete(id),

  //   onMutate: async (id) => {
  //     await qc.cancelQueries(["resumes"]);

  //     const previous = qc.getQueryData(["resumes"]);

  //     qc.setQueryData(["resumes"], (old = []) =>
  //       old.filter((r) => r.id !== id)
  //     );

  //     return { previous };
  //   },

  //   onError: (err, id, context) => {
  //     qc.setQueryData(["resumes"], context.previous);
  //     toast.error("Delete failed");
  //   },

  //   onSuccess: () => {
  //     toast.success("Resume deleted");
  //   },

  //   // onSettled: () => {
  //   //   qc.invalidateQueries(["resumes"]);
  //   // },
  // });

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) uploadMut.mutate(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleDelete = (id) => {
    console.log("HANDLE DELETE → id:", id);
    if (window.confirm("Delete this resume?")) deleteMut.mutate(id);
  };

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{ margin: 0, fontSize: 22, fontWeight: 800, color: theme.text }}
        >
          My Resumes
        </h1>
        <p style={{ margin: "3px 0 0", color: theme.subtext, fontSize: 13 }}>
          Upload PDF or DOCX — skills extracted automatically
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        style={{
          // border: `2px dashed ${isDragActive ? "#6366f1" : "#cbd5e1"}`,
          border: `2px dashed ${theme.border}`,
          borderRadius: 16,
          padding: "2.5rem 1rem",
          textAlign: "center",
          cursor: "pointer",
          background: isDragActive ? "#eef2ff" : "#f8fafc",
          marginBottom: "1.5rem",
          transition: "all 0.15s",
        }}
      >
        <input {...getInputProps()} />
        {uploadMut.isPending ? (
          <>
            <Clock size={32} color="#6366f1" style={{ marginBottom: 8 }} />
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                color: "#6366f1",
                fontSize: 15,
              }}
            >
              Parsing resume…
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
              Extracting skills, experience, education
            </p>
          </>
        ) : (
          <>
            <Upload
              size={32}
              color={isDragActive ? "#6366f1" : "#94a3b8"}
              style={{ marginBottom: 8 }}
            />
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                color: "#374151",
                fontSize: 15,
              }}
            >
              {isDragActive ? "Drop it here!" : "Drag & drop your resume"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
              or click to browse · PDF or DOCX only
            </p>
          </>
        )}
      </div>

      {isLoading ? (
        <Loader text="Loading applications..." />
      ) : resumes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "#94a3b8",
            fontSize: 14,
          }}
        >
          No resumes yet. Drop one above to get started.
        </div>
      ) : (
        resumes.map((r) => (
        <ResumeCard key={r.id} resume={r} onDelete={handleDelete} theme={theme} />
        ))
      )}
    </div>
  );
}
