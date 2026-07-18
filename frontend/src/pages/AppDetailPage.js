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

  const matchMut = useMutation({
    mutationFn: () => matchAPI.match(selectedResume, id, jdText),
    onSuccess: (res) => {
      setMatch(res.data);
      setScore(res.data.match_score);

      localStorage.setItem(`matchResult-${id}`, JSON.stringify(res.data));

      qc.invalidateQueries({
        queryKey: ["app", user?.id, id],
      });

      toast.success(`Match: ${res.data.match_score}%`);
    },
    onError: () =>
      toast.error("Match failed — ensure resume and JD are provided"),
  });

  useEffect(() => {
    localStorage.setItem("jdText", jdText);
  }, [jdText]);

  useEffect(() => {
    localStorage.setItem("selectedResume", selectedResume);
  }, [selectedResume]);

  // const handleReset = () => {
  //   setSelectedResume("");
  //   setJdText("");
  //   setMatch(null);

  //   localStorage.removeItem("jdText");
  //   localStorage.removeItem("selectedResume");
  //   localStorage.removeItem(`matchResult-${id}`);
  // };

  const handleReset = () => {
    setSelectedResume("");
    setJdText("");

    setMatch({
      match_score: 0,
      matched_skills: [],
      missing_skills: [],
      recommendation: "",
    });

    setScore(0);

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

  const deleteMut = useMutation({
    mutationFn: () => appAPI.delete(id),

    onSuccess: async () => {
      qc.removeQueries({
        queryKey: ["app", user?.id, id],
        exact: true,
      });

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

  const result = matchResult || {
    matched_skills: [],
    // missing_skills: app.skill_gaps || [],
    missing_skills: [],
  };
  // const score = app.match_score;

  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem(`matchResult-${id}`);

    if (saved) {
      return JSON.parse(saved).match_score;
    }

    return app?.match_score ?? 0;
  });

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

  if (isLoading) return <Loader text="Loading applications..." />;
  if (!app)
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "#ef4444" }}>
        Not found
      </div>
    );

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      {/* Header */}
      <div
        className="detail-header"
        style={{
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
          <div
            className="edit-fields"
            style={{
              flex: 1,
            }}
          >
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
          className="details-grid"
          style={{
            display: "grid",
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
        </div>
      </div>

      <div
        className="detail-layout"
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Application Progress */}

          <div
            className="responsive-card"
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
              className="progress-container"
              style={{
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

          {/* Status History */}

          <div
            className="responsive-card"
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
                  minWidth: 500,
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
              className="jd-textarea"
              placeholder="Paste the full job description here…"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              style={{
                ...inp,
                // minHeight: 150,
                lineHeight: 1.6,
                fontSize: 14,
                padding: "14px",
                resize: "vertical",
                marginBottom: 10,
              }}
            />
            <div
              className="button-group"
              style={{
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
                  width: "160px",
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

              <div className="skills-grid">
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

          <div className="summary-container">
            {/* MATCH SCORE */}

            <div
              className="summary-card"
              style={{
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
              className="summary-card"
              style={{
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
              className="summary-card"
              style={{
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

      <style>{`

.detail-layout{
grid-template-columns:1fr 1fr;
}

.detail-header{
display:flex;
align-items:center;
gap:10px;
}

.edit-fields{
display:flex;
gap:8px;
flex-wrap:wrap;
}

.details-grid{
grid-template-columns:180px 1fr 180px 1fr;
}

.progress-container{
display:flex;
justify-content:space-between;
align-items:center;
}

.button-group{
display:flex;
gap:10px;
margin-top:15px;
}

.skills-grid{
display:grid;
grid-template-columns:1fr 1fr;
gap:20px;
}

.summary-container{
display:flex;
justify-content:center;
align-items:stretch;
gap:18px;
flex-wrap:wrap;
}

.summary-card{
flex:1;
min-width:150px;
max-width:220px;
}

@media(max-width:900px){

.detail-layout{
grid-template-columns:1fr;
}

.details-grid{
grid-template-columns:140px 1fr;
}

}

@media(max-width:768px){

.detail-header{
flex-wrap:wrap;
}

.skills-grid{
grid-template-columns:1fr;
}

.progress-container{
overflow-x:auto;
padding-bottom:10px;
}

.jd-textarea{
min-height:140px;
}

.button-group{
flex-direction:column;
}

.button-group button{
width:100%;
}

.reset-btn{
width:100%;
}

.responsive-card{
padding:16px !important;
}

.summary-card{
min-width:100%;
}

}

@media(max-width:600px){

.edit-fields{
flex-direction:column;
}

.button-group{
flex-direction:column;
}

.button-group button{
width:100%;
}

.summary-card{
min-width:100%;
max-width:100%;
}

.responsive-card{
padding:16px !important;
}

.jd-textarea{
min-height:220px;
}


}

`}</style>
    </div>
  );
}
