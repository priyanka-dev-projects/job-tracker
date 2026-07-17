import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appAPI, resumeAPI, matchAPI } from "../api/client";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Zap,
  CheckCircle,
  XCircle,
  ExternalLink,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../App";
import Loader from "../components/Loader";

const STATUS_BG = {
  wishlist: "#dbeafe",
  applied: "#fef3c7",
  screening: "#ffedd5",
  interview: "#dcfce7",
  offer: "#f3e8ff",
  rejected: "#fee2e2",
};

const STATUS_COLOR = {
  wishlist: "#3b82f6",
  applied: "#f59e0b",
  screening: "#f97316",
  interview: "#22c55e",
  offer: "#a855f7",
  rejected: "#ef4444",
};
// const STATUSES = [
//   "wishlist",
//   "applied",
//   "screening",
//   "interview",
//   "offer",
//   "rejected",
// ];

// const STATUS_FLOW = {
//   wishlist: ["wishlist", "applied"],
//   applied: ["applied", "screening"],
//   screening: ["screening", "interview"],
//   interview: ["interview", "offer", "rejected"],
//   offer: ["offer"],
//   rejected: ["rejected"],
// };

const STAGES = [
  "wishlist",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
];

const STATUS_FLOW = {
  wishlist: ["wishlist", "applied"],
  applied: ["applied", "screening"],
  screening: ["screening", "interview"],
  interview: ["interview", "offer", "rejected"],
  offer: ["offer", "rejected"], // <-- allow rejection after offer
  rejected: ["rejected"], // terminal stage
};

export default function AppDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, theme } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // const [jdText, setJdText] = useState("");
  // const [selectedResume, setSelectedResume] = useState("");
  // const [matchResult, setMatch] = useState(null);
  // const [matchResult, setMatch] = useState(() => {
  //   const saved = localStorage.getItem(`matchResult-${id}`);
  //   return saved ? JSON.parse(saved) : null;
  // });
  const [matchResult, setMatch] = useState(() => {
    const saved = localStorage.getItem(`matchResult-${id}`);

    if (!saved) return null;

    const data = JSON.parse(saved);

    // Hide AI Recommendation after page refresh
    data.recommendation = "";

    return data;
  });
  const [jdText, setJdText] = useState(
    () => localStorage.getItem("jdText") || "",
  );

  const [selectedResume, setSelectedResume] = useState(
    () => localStorage.getItem("selectedResume") || "",
  );

  useEffect(() => {
    localStorage.setItem("jdText", jdText);
  }, [jdText]);

  useEffect(() => {
    localStorage.setItem("selectedResume", selectedResume);
  }, [selectedResume]);

  const handleReset = () => {
    setSelectedResume("");
    setJdText("");
    setMatch(null);

    localStorage.removeItem("jdText");
    localStorage.removeItem("selectedResume");
    localStorage.removeItem(`matchResult-${id}`);
  };

  const { data: app, isLoading } = useQuery({
    queryKey: ["app", user?.id, id],
    queryFn: () => appAPI.get(id).then((r) => r.data),
    enabled: !!user?.id,
  });

  const { data: resumes = [] } = useQuery({
    queryKey: ["resumes", user?.id],
    queryFn: () => resumeAPI.list().then((r) => r.data),
    enabled: !!user?.id,
  });

  // const statusMut = useMutation({
  //   mutationFn: (status) => appAPI.updateStatus(id, status),
  //   onSuccess: () => {
  //     qc.invalidateQueries(["app", id]);
  //     qc.invalidateQueries(["apps"]);
  //     qc.invalidateQueries(["stats"]);
  //   },
  //   onError: () => toast.error("Failed to update status"),
  // });

  const statusMut = useMutation({
    mutationFn: (status) => appAPI.updateStatus(id, status),

    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ["app", user?.id, id],
      });

      await qc.invalidateQueries({
        queryKey: ["apps"],
      });

      await qc.invalidateQueries({
        queryKey: ["stats"],
      });

      toast.success("Status updated");
    },

    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const updateMut = useMutation({
    mutationFn: (data) => appAPI.update(id, data),
    onSuccess: () => {
      // qc.invalidateQueries(["app", id]);
      qc.invalidateQueries({
        queryKey: ["app", user?.id, id],
      });
      setEditing(false);
      toast.success("Saved");
    },
    onError: () => toast.error("Update failed"),
  });

  // const deleteMut = useMutation({
  //   mutationFn: () => appAPI.delete(id),
  //   onSuccess: () => {
  //     toast.success("Application deleted");
  //     navigate("/kanban");
  //   },
  //   onError: () => toast.error("Delete failed"),
  // });

  //   const deleteMut = useMutation({
  //   mutationFn: () => appAPI.delete(id),

  //   onSuccess: async () => {
  //     toast.success("Application deleted successfully");

  //     // Refetch application lists so the deleted application disappears.
  //     await queryClient.invalidateQueries({
  //       queryKey: ["applications"],
  //     });

  //     // Remove deleted application's detail cache.
  //     queryClient.removeQueries({
  //       queryKey: ["application", id],
  //       exact: true,
  //     });

  //     // Go back to dashboard after cache is updated.
  //     navigate("/");
  //   },

  //   onError: (error) => {
  //     console.error("DELETE APPLICATION ERROR:", error);

  //     toast.error(
  //       error.message || "Failed to delete application"
  //     );
  //   },
  // });

  const deleteMut = useMutation({
    mutationFn: () => appAPI.delete(id),

    onSuccess: async () => {
      // Remove the deleted application's detail cache.
      qc.removeQueries({
        queryKey: ["app", user?.id, id],
        exact: true,
      });

      // Your application-list query key is ["apps"], not ["applications"].
      await qc.invalidateQueries({
        queryKey: ["apps"],
      });

      // Refresh dashboard statistics.
      await qc.invalidateQueries({
        queryKey: ["stats"],
      });

      toast.success("Application deleted successfully");

      navigate("/");
    },

    onError: (error) => {
      console.error("DELETE APPLICATION ERROR:", error);

      toast.error(error.message || "Failed to delete application");
    },
  });

  const matchMut = useMutation({
    mutationFn: () => matchAPI.match(selectedResume, id, jdText),
    // onSuccess: (res) => {
    //   setMatch(res.data);
    //   // qc.invalidateQueries(["app", id]);
    //   qc.invalidateQueries({
    //     queryKey: ["app", user?.id, id],
    //   });
    //   toast.success(`Match: ${res.data.match_score}%`);
    // },
    onSuccess: (res) => {
      setMatch(res.data);

      localStorage.setItem(`matchResult-${id}`, JSON.stringify(res.data));

      qc.invalidateQueries({
        queryKey: ["app", user?.id, id],
      });

      toast.success(`Match: ${res.data.match_score}%`);
    },
    onError: () =>
      toast.error("Match failed — ensure resume and JD are provided"),
  });

  if (isLoading) return <Loader text="Loading applications..." />;
  if (!app)
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#ef4444" }}>
        Not found
      </div>
    );

  const result = matchResult || {
    matched_skills: [],
    missing_skills: app.skill_gaps || [],
  };
  const score = app.match_score;

  const startEdit = () => {
    setEditForm({
      company: app.company,
      role: app.role,
      job_url: app.job_url || "",
      notes: app.notes || "",
    });
    setEditing(true);
  };
  const inp = {
    width: "100%",
    padding: "0.55rem 0.7rem",
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: "1.5rem",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            color: theme.subtext,
          }}
        >
          <ArrowLeft size={18} />
        </button>
        {editing ? (
          <div style={{ flex: 1, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              style={{
                ...inp,
                flex: "1 1 140px",
                fontSize: 16,
                fontWeight: 700,
              }}
              value={editForm.company}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, company: e.target.value }))
              }
              placeholder="Company"
            />
            <input
              style={{ ...inp, flex: "1 1 140px" }}
              value={editForm.role}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, role: e.target.value }))
              }
              placeholder="Role"
            />
            <input
              style={{ ...inp, flex: "1 1 200px", fontSize: 12 }}
              value={editForm.job_url}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, job_url: e.target.value }))
              }
              placeholder="Job URL"
            />
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: theme.text,
              }}
            >
              {app.company}
            </h1>
            <p style={{ margin: 0, color: theme.subtext, fontSize: 14 }}>
              {app.role}
            </p>
          </div>
        )}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {app.job_url && !editing && (
            <a
              href={app.job_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: "#6366f1",
                background: "#eef2ff",
                padding: "6px 10px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <ExternalLink size={12} /> Posting
            </a>
          )}
          {editing ? (
            <>
              <button
                onClick={() => updateMut.mutate(editForm)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 12px",
                  background: "#6366f1",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <Save size={13} /> Save
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 12px",
                  background: "#f1f5f9",
                  color: "#374151",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                <X size={13} /> Cancel
              </button>
            </>
          ) : (
            <button
              onClick={startEdit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 10px",
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                color: theme.subtext,
              }}
            >
              <Edit2 size={13} /> Edit
            </button>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => {
            if (
              window.confirm(
                "Are you sure you want to delete this application?",
              )
            ) {
              deleteMut.mutate();
            }
          }}
          disabled={deleteMut.isPending}
          style={{
            padding: "0.65rem",
            color: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            background: "#ef4444",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {deleteMut.isPending ? "Deleting..." : "Delete application"}
        </button>
      </div>

      {/* Application Details */}

      <div
        style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: 14,
          padding: "1.25rem",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 18,
          }}
        >
          Application Details
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr 180px 1fr",
            rowGap: 14,
            columnGap: 25,
            fontSize: 14,
          }}
        >
          <strong style={{ color: theme.subtext }}>Company</strong>
          <span>{app.company}</span>

          <strong style={{ color: theme.subtext }}>Role</strong>
          <span>{app.role}</span>

          <strong style={{ color: theme.subtext }}>Current Stage</strong>
          <span
            style={{
              color: STATUS_COLOR[app.status],
              fontWeight: 700,
              textTransform: "capitalize",
            }}
          >
            {app.status}
          </span>

          <strong style={{ color: theme.subtext }}>Match Score</strong>
          <span
            style={{
              fontWeight: 800,
              color:
                score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444",
            }}
          >
            {score != null ? `${score}%` : "Not Analyzed"}
          </span>

          <strong style={{ color: theme.subtext }}>Applied On</strong>
          <span>
            {app.created_at
              ? new Date(app.created_at).toLocaleDateString()
              : "-"}
          </span>

          <strong style={{ color: theme.subtext }}>Last Updated</strong>
          <span>
            {app.updated_at
              ? new Date(app.updated_at).toLocaleDateString()
              : "-"}
          </span>

          {/* <strong style={{ color: theme.subtext }}>Job Posting</strong>

          <span>
            {app.job_url ? (
              <a
                href={app.job_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#2563eb",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Open Posting
              </a>
            ) : (
              "-"
            )}
          </span>

          <strong style={{ color: theme.subtext }}>Notes</strong>

          <span>
            {app.notes ? `${app.notes.substring(0, 60)}...` : "No notes"}
          </span> */}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Status */}
          {/* <div
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 14,
              padding: "1.1rem 1.25rem",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 10,
              }}
            >
              Stage
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.keys(STATUS_COLOR).map((s) => {
                const allowed = STATUS_FLOW[app.status]?.includes(s);

                return (
                  <button
                    key={s}
                    disabled={!allowed}
                    onClick={() => {
                      if (allowed) statusMut.mutate(s);
                    }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: "none",
                      cursor: allowed ? "pointer" : "not-allowed",
                      fontWeight: 600,
                      fontSize: 12,
                      textTransform: "capitalize",
                      transition: "0.2s",
                      opacity: allowed ? 1 : 0.35,
                      background:
                        app.status === s ? STATUS_COLOR[s] : "#f1f5f9",
                      color: app.status === s ? "#fff" : "#374151",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div> */}

          {/* Application Progress */}

          <div
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 14,
              padding: "1.2rem",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#94a3b8",
                marginBottom: 20,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Application Progress
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                marginBottom: 30,
              }}
            >
              {STAGES.map((stage, index) => {
                const currentIndex = STAGES.indexOf(app.status);

                const completed = index < currentIndex;
                const active = index === currentIndex;

                return (
                  <React.Fragment key={stage}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flex: 1,
                        zIndex: 2,
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: completed
                            ? "#22c55e"
                            : active
                              ? STATUS_COLOR[stage]
                              : "#e5e7eb",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 14,
                          margin: "0px 3px 0px 3px",
                        }}
                      >
                        {completed ? "✓" : ""}
                      </div>

                      <span
                        style={{
                          marginTop: 8,
                          fontSize: 11,
                          fontWeight: active ? 700 : 500,
                          textTransform: "capitalize",
                          color: active ? STATUS_COLOR[stage] : theme.subtext,
                        }}
                      >
                        {stage}
                      </span>
                    </div>

                    {index !== STAGES.length - 1 && (
                      <div
                        style={{
                          flex: 1,
                          height: 4,
                          background:
                            index < currentIndex ? "#22c55e" : "#e5e7eb",
                          marginTop: -22,
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div
              style={{
                padding: 15,
                borderRadius: 10,
                background: "#f8fafc",
                border: `1px solid ${theme.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                Current Stage
              </div>

              <div
                style={{
                  display: "inline-block",
                  padding: "5px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: STATUS_COLOR[app.status],
                  color: "#fff",
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                {app.status}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 20,
                  flexWrap: "wrap",
                }}
              >
                {STATUS_FLOW[app.status]
                  ?.filter((s) => s !== app.status)
                  .map((nextStage) => (
                    <button
                      key={nextStage}
                      onClick={() => statusMut.mutate(nextStage)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        background: STATUS_COLOR[nextStage],
                        color: "#fff",
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {nextStage}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Match score */}
          {/* {score != null && (
            <div
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: "1.1rem 1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 10,
                }}
              >
                Match score
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    color:
                      score >= 70
                        ? "#16a34a"
                        : score >= 40
                          ? "#f59e0b"
                          : "#ef4444",
                    lineHeight: 1,
                  }}
                >
                  {score}
                  <span style={{ fontSize: 22 }}>%</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 10,
                      background: "#f1f5f9",
                      borderRadius: 5,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 5,
                        width: `${score}%`,
                        background:
                          score >= 70
                            ? "#16a34a"
                            : score >= 40
                              ? "#f59e0b"
                              : "#ef4444",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    {score >= 70
                      ? "Strong match 🎯"
                      : score >= 40
                        ? "Moderate match"
                        : "Low match — skill gaps present"}
                  </div>
                </div>
              </div>
            </div>
          )} */}

          {/* <div
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 14,
              padding: "1.2rem",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 18,
              }}
            >
              Application Information
            </div>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <tbody>
                <tr>
                  <td style={{ padding: "10px", color: theme.subtext }}>
                    Company
                  </td>

                  <td style={{ padding: "10px", fontWeight: 600 }}>
                    {app.company}
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: "10px", color: theme.subtext }}>
                    Role
                  </td>

                  <td style={{ padding: "10px", fontWeight: 600 }}>
                    {app.role}
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: "10px", color: theme.subtext }}>
                    Current Stage
                  </td>

                  <td style={{ padding: "10px" }}>
                    <span
                      style={{
                        background: STATUS_BG[app.status],
                        color: STATUS_COLOR[app.status],
                        padding: "5px 10px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {app.status}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: "10px", color: theme.subtext }}>
                    Match Score
                  </td>

                  <td
                    style={{
                      padding: "10px",
                      fontWeight: 700,
                    }}
                  >
                    {app.match_score ?? "-"}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div> */}

          {/* Resume Match */}

          {/* {score != null && (
            <div
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: "1.2rem",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 20,
                }}
              >
                Resume Analysis
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  gap: 20,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    border: `8px solid ${
                      score >= 80
                        ? "#22c55e"
                        : score >= 60
                          ? "#f59e0b"
                          : "#ef4444"
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 800,
                    color:
                      score >= 80
                        ? "#22c55e"
                        : score >= 60
                          ? "#f59e0b"
                          : "#ef4444",
                  }}
                >
                  {score}%
                </div>

                <div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      rowGap: 10,
                      fontSize: 14,
                    }}
                  >
                    <span>Matched Skills</span>

                    <strong style={{ color: "#22c55e" }}>
                      {result.matched_skills?.length || 0}
                    </strong>

                    <span>Missing Skills</span>

                    <strong style={{ color: "#ef4444" }}>
                      {result.missing_skills?.length || 0}
                    </strong>

                    <span>Overall Rating</span>

                    <strong
                      style={{
                        color:
                          score >= 80
                            ? "#22c55e"
                            : score >= 60
                              ? "#f59e0b"
                              : "#ef4444",
                      }}
                    >
                      {score >= 80
                        ? "Excellent"
                        : score >= 60
                          ? "Good"
                          : "Needs Improvement"}
                    </strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 20,
                  height: 10,
                  background: "#e5e7eb",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${score}%`,
                    height: "100%",
                    background:
                      score >= 80
                        ? "#22c55e"
                        : score >= 60
                          ? "#f59e0b"
                          : "#ef4444",
                    transition: "0.5s",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: theme.subtext,
                }}
              >
                {score >= 80 &&
                  "Excellent profile match. You have a strong chance for this role."}

                {score >= 60 &&
                  score < 80 &&
                  "Good profile. Learning the missing skills can improve your chances."}

                {score < 60 &&
                  "Several important skills are missing. Consider improving before applying."}
              </div>
            </div>
          )} */}

          {/* Notes */}
          {(app.notes || editing) && (
            <div
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: "1.1rem 1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 8,
                }}
              >
                Notes
              </div>
              {editing ? (
                <textarea
                  style={{ ...inp, minHeight: 80, resize: "vertical" }}
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Notes…"
                />
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#374151",
                    lineHeight: 1.5,
                  }}
                >
                  {app.notes}
                </p>
              )}
            </div>
          )}

          {/* Timeline */}
          {/* <div
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 14,
              padding: "1.1rem 1.25rem",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 12,
              }}
            >
              Timeline
            </div>
            {[...(app.timeline || [])].reverse().map((e, i, arr) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  paddingBottom: i < arr.length - 1 ? 12 : 0,
                  position: "relative",
                  marginLeft: 8,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: -5,
                    top: 4,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: STATUS_COLOR[e.status] || "#94a3b8",
                    border: "2px solid #fff",
                    zIndex: 1,
                  }}
                />
                {i < arr.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: -1,
                      top: 14,
                      bottom: 0,
                      width: 2,
                      background: "#f1f5f9",
                    }}
                  />
                )}
                <div style={{ paddingLeft: 14 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: theme.text,
                      textTransform: "capitalize",
                    }}
                  >
                    {e.status}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    {formatDistanceToNow(new Date(e.timestamp), {
                      addSuffix: true,
                    })}
                  </div>
                  {e.note && (
                    <div
                      style={{
                        fontSize: 12,
                        color: theme.subtext,
                        marginTop: 2,
                      }}
                    >
                      {e.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div> */}
          {/* Status History */}

          <div
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 14,
              padding: "1.2rem",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 18,
              }}
            >
              Status History
            </div>

            <div
              style={{
                maxHeight: "300px", // change to 250px, 350px, etc.
                overflowY: "auto",
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "#f8fafc",
                    zIndex: 1,
                  }}
                >
                  <tr>
                    <th style={{ padding: 10, textAlign: "left" }}>Stage</th>
                    <th style={{ padding: 10, textAlign: "left" }}>Date</th>
                    <th style={{ padding: 10, textAlign: "left" }}>Time</th>
                  </tr>
                </thead>

                <tbody>
                  {[...(app.timeline || [])].reverse().map((item, index) => {
                    const date = new Date(item.timestamp);

                    return (
                      <tr key={index}>
                        <td
                          style={{
                            padding: 10,
                            borderBottom: `1px solid ${theme.border}`,
                          }}
                        >
                          {/* <span
                style={{
                  background: STATUS_COLOR[item.status],
                  color: "#fff",
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 12,
                  textTransform: "capitalize",
                }}
              >
                {item.status}
              </span> */}

                          <span
                            style={{
                              background: STATUS_BG[item.status],
                              color: STATUS_COLOR[item.status],
                              padding: "5px 12px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              textTransform: "capitalize",
                              display: "inline-block",
                            }}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: 10,
                            borderBottom: `1px solid ${theme.border}`,
                          }}
                        >
                          {date.toLocaleDateString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        <td
                          style={{
                            padding: 10,
                            borderBottom: `1px solid ${theme.border}`,
                          }}
                        >
                          {/* {date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })} */}
                          {date.toLocaleTimeString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delete */}
          {/* <button
            onClick={() => {
              if (window.confirm("Delete this application?"))
                deleteMut.mutate();
            }}
            style={{
              padding: "0.65rem",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              color: "#ef4444",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Delete application
          </button> */}
        </div>

        {/* Right — JD matcher */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 14,
              padding: "1.1rem 1.25rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 12,
              }}
            >
              {/* <Zap size={12} color="#6366f1" /> Job description matcher */}
              <Zap size={14} color="#6366f1" />
              AI Resume Analyzer
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                color: theme.text,
              }}
            >
              Resume
            </div>
            <select
              style={{ ...inp, marginBottom: 10 }}
              value={selectedResume}
              onChange={(e) => setSelectedResume(e.target.value)}
            >
              <option value="">— select a resume —</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.original_filename}
                </option>
              ))}
            </select>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                marginTop: 14,
                color: theme.text,
              }}
            >
              Job Description
            </div>
            <textarea
              placeholder="Paste the full job description here…"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              style={{
                ...inp,
                // minHeight: 150,
                minHeight: 220,
                lineHeight: 1.6,
                fontSize: 14,
                padding: "14px",
                resize: "vertical",
                marginBottom: 10,
              }}
            />
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 15,
              }}
            >
              <button
                disabled={
                  !jdText.trim() || !selectedResume || matchMut.isPending
                }
                onClick={() => matchMut.mutate()}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#6366f1",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 700,
                  opacity: !jdText.trim() || !selectedResume ? 0.5 : 1,
                }}
              >
                {matchMut.isPending ? "Analyzing..." : "Analyze Resume"}
              </button>

              <button
                onClick={handleReset}
                style={{
                  padding: "12px 20px",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Reset
              </button>
            </div>
            {/* <button
              disabled={!jdText.trim() || !selectedResume || matchMut.isPending}
              onClick={() => matchMut.mutate()}
              style={{
                width: "100%",
                padding: "0.7rem",
                background: "#6366f1",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                opacity: !jdText.trim() || !selectedResume ? 0.5 : 1,
                padding: "12px",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 12,
                marginTop: 15,
              }}
            >
              {matchMut.isPending ? "Analyzing Resume..." : "Analyze Resume"}
            </button> */}

            {/* {matchResult && (
              // <div
              //   style={{
              //     marginTop: 20,
              //     padding: "18px",
              //     borderRadius: 12,
              //     background: "#f8fafc",
              //     border: `1px solid ${theme.border}`,
              //   }}
              // >
              //   <h4>AI Recommendation</h4>

              //   <p>
              //     {matchResult.match_score >= 80 &&
              //       "Excellent match. Highly recommended to apply."}

              //     {matchResult.match_score >= 60 &&
              //       matchResult.match_score < 80 &&
              //       "Good match. Improve missing skills before interview."}

              //     {matchResult.match_score < 60 &&
              //       "Low match. Consider improving your resume or skills."}
              //   </p>
              // </div>

              <div
  style={{
    padding: 20,
    borderRadius: 12,
    background: theme.bg,
    border: `1px solid ${theme.border}`,
  }}
>
  <div
    style={{
      fontSize: 12,
      color: theme.subtext,
      fontWeight: 600,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 1,
    }}
  >
    Current Status
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    }}
  >
    <span
      style={{
        background: STATUS_BG[app.status],
        color: STATUS_COLOR[app.status],
        padding: "8px 18px",
        borderRadius: 25,
        fontWeight: 700,
        fontSize: 14,
        textTransform: "capitalize",
      }}
    >
      {app.status}
    </span>

    <div
      style={{
        fontSize: 13,
        color: theme.subtext,
      }}
    >
      {app.timeline?.length || 1} Updates
    </div>
  </div>

  <div
    style={{
      fontSize: 13,
      color: theme.subtext,
      lineHeight: 1.6,
      marginBottom: 20,
    }}
  >
    {app.status === "wishlist" &&
      "This application is saved for future submission."}

    {app.status === "applied" &&
      "Application has been submitted successfully."}

    {app.status === "screening" &&
      "Recruiters are reviewing your application."}

    {app.status === "interview" &&
      "Interview process is currently in progress."}

    {app.status === "offer" &&
      "Congratulations! You have received an offer."}

    {app.status === "rejected" &&
      "This application has been closed."}
  </div>

  <div
    style={{
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    }}
  >
    {STATUS_FLOW[app.status]
      ?.filter((s) => s !== app.status)
      .map((nextStage) => (
        <button
          key={nextStage}
          onClick={() => statusMut.mutate(nextStage)}
          style={{
            background: STATUS_COLOR[nextStage],
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {nextStage}
        </button>
      ))}
  </div>
</div>
            )} */}
            {/* {matchResult && (
              <div
                style={{
                  marginTop: 20,
                  padding: "18px",
                  borderRadius: 12,
                  background: theme.bg,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <h4 style={{ color: theme.text }}>AI Recommendation</h4>

                <p style={{ color: theme.subtext }}>
                  {matchResult.recommendation}
                </p>
              </div>
            )} */}

            {matchResult?.recommendation && (
              <div
                style={{
                  marginTop: 20,
                  padding: "18px",
                  borderRadius: 12,
                  background: theme.bg,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <h4 style={{ color: theme.text }}>AI Recommendation</h4>

                <p style={{ color: theme.subtext }}>
                  {matchResult.recommendation}
                </p>
              </div>
            )}
          </div>

          {/* {(result.matched_skills?.length > 0 ||
            result.missing_skills?.length > 0) && (
            <div
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: "1.1rem 1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 12,
                }}
              >
                Skills breakdown
              </div>
              {result.matched_skills?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginBottom: 6,
                    }}
                  >
                    <CheckCircle size={13} color="#16a34a" />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#16a34a",
                      }}
                    >
                      You have ({result.matched_skills.length})
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {result.matched_skills.map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 20,
                          background: "#f0fdf4",
                          color: "#16a34a",
                          fontWeight: 600,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.missing_skills?.length > 0 && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginBottom: 6,
                    }}
                  >
                    <XCircle size={13} color="#ef4444" />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#ef4444",
                      }}
                    >
                      Missing ({result.missing_skills.length})
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {result.missing_skills.map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 20,
                          background: "#fef2f2",
                          color: "#ef4444",
                          fontWeight: 600,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )} */}

          {(result.matched_skills?.length > 0 ||
            result.missing_skills?.length > 0) && (
            <div
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: "1.3rem",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 20,
                }}
              >
                Skill Analysis
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                }}
              >
                {/* Matched */}

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 15,
                    }}
                  >
                    <span
                      style={{
                        color: "#16a34a",
                        fontWeight: 700,
                      }}
                    >
                      ✓ Matched Skills
                    </span>

                    <span
                      style={{
                        color: "#16a34a",
                        fontWeight: 700,
                      }}
                    >
                      {result.matched_skills?.length || 0}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {result.matched_skills?.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          padding: "7px 12px",
                          borderRadius: 20,
                          background: "#dcfce7",
                          color: "#15803d",
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing */}

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 15,
                    }}
                  >
                    <span
                      style={{
                        color: "#dc2626",
                        fontWeight: 700,
                      }}
                    >
                      ✗ Missing Skills
                    </span>

                    <span
                      style={{
                        color: "#dc2626",
                        fontWeight: 700,
                      }}
                    >
                      {result.missing_skills?.length || 0}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {result.missing_skills?.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          padding: "7px 12px",
                          borderRadius: 20,
                          background: "#fee2e2",
                          color: "#b91c1c",
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resume Match */}

      {/* {score != null && (
          <div
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 14,
              padding: "1.2rem",
              width: "100%",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 20,
              }}
            >
              Resume Analysis
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: 20,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  border: `8px solid ${
                    score >= 80
                      ? "#22c55e"
                      : score >= 60
                        ? "#f59e0b"
                        : "#ef4444"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  fontWeight: 800,
                  color:
                    score >= 80
                      ? "#22c55e"
                      : score >= 60
                        ? "#f59e0b"
                        : "#ef4444",
                }}
              >
                {score}%
              </div>

              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    rowGap: 10,
                    fontSize: 14,
                  }}
                >
                  <span>Matched Skills</span>

                  <strong style={{ color: "#22c55e" }}>
                    {result.matched_skills?.length || 0}
                  </strong>

                  <span>Missing Skills</span>

                  <strong style={{ color: "#ef4444" }}>
                    {result.missing_skills?.length || 0}
                  </strong>

                  <span>Overall Rating</span>

                  <strong
                    style={{
                      color:
                        score >= 80
                          ? "#22c55e"
                          : score >= 60
                            ? "#f59e0b"
                            : "#ef4444",
                    }}
                  >
                    {score >= 80
                      ? "Excellent"
                      : score >= 60
                        ? "Good"
                        : "Needs Improvement"}
                  </strong>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                height: 10,
                background: "#e5e7eb",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${score}%`,
                  height: "100%",
                  background:
                    score >= 80
                      ? "#22c55e"
                      : score >= 60
                        ? "#f59e0b"
                        : "#ef4444",
                  transition: "0.5s",
                }}
              />
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                color: theme.subtext,
              }}
            >
              {score >= 80 &&
                "Excellent profile match. You have a strong chance for this role."}

              {score >= 60 &&
                score < 80 &&
                "Good profile. Learning the missing skills can improve your chances."}

              {score < 60 &&
                "Several important skills are missing. Consider improving before applying."}
            </div>
          </div>
        )} */}

      {score != null && (
        <div
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: 14,
            padding: "1.5rem",
            width: "100%",
            boxSizing: "border-box",
            marginTop: 14,
          }}
        >
          {/* HEADING */}

          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            Resume Analysis
          </div>

          {/* SUMMARY */}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "stretch",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            {/* MATCH SCORE */}

            <div
              style={{
                width: 180,
                minHeight: 125,
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color:
                    score >= 80
                      ? "#22c55e"
                      : score >= 60
                        ? "#f59e0b"
                        : "#ef4444",
                }}
              >
                {score}%
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: theme.subtext,
                  fontWeight: 600,
                }}
              >
                Match Score
              </div>
            </div>

            {/* MATCHED SKILLS */}

            <div
              style={{
                width: 180,
                minHeight: 125,
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#22c55e",
                }}
              >
                {result.matched_skills?.length || 0}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: theme.subtext,
                  fontWeight: 600,
                }}
              >
                Matched Skills
              </div>
            </div>

            {/* MISSING SKILLS */}

            <div
              style={{
                width: 180,
                minHeight: 125,
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#ef4444",
                }}
              >
                {result.missing_skills?.length || 0}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: theme.subtext,
                  fontWeight: 600,
                }}
              >
                Missing Skills
              </div>
            </div>
          </div>

          {/* OVERALL RATING */}

          <div
            style={{
              marginTop: 22,
              textAlign: "center",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "6px 16px",
                borderRadius: 20,

                background:
                  score >= 80 ? "#dcfce7" : score >= 60 ? "#fef3c7" : "#fee2e2",

                color:
                  score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626",

                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {score >= 80
                ? "Excellent Match"
                : score >= 60
                  ? "Good Match"
                  : "Needs Improvement"}
            </span>
          </div>

          {/* PROGRESS BAR */}

          <div
            style={{
              maxWidth: 700,
              margin: "24px auto 0",
            }}
          >
            <div
              style={{
                height: 9,
                background: theme.bg,
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${score}%`,
                  height: "100%",

                  background:
                    score >= 80
                      ? "#22c55e"
                      : score >= 60
                        ? "#f59e0b"
                        : "#ef4444",

                  borderRadius: 20,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>

          {/* RECOMMENDATION */}

          <div
            style={{
              maxWidth: 700,
              margin: "14px auto 0",
              textAlign: "center",
              fontSize: 13,
              lineHeight: 1.6,
              color: theme.subtext,
            }}
          >
            {score >= 80 &&
              "Excellent profile match. Your resume aligns strongly with the job requirements."}

            {score >= 60 &&
              score < 80 &&
              "Good profile match. Improving the missing skills can strengthen your application."}

            {score < 60 &&
              "Several important skills are missing. Consider improving the identified skill gaps before applying."}
          </div>
        </div>
      )}

      <style>{`@media(max-width:640px){ .app-detail-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
