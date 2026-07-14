import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { appAPI } from "../api/client";
import { useAuth } from "../App";
import {
  Briefcase,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Plus,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Loader from "../components/Loader";

const STATUS_STYLE = {
  wishlist: { bg: "#eff6ff", text: "#3b82f6", dot: "#3b82f6" },
  applied: { bg: "#fefce8", text: "#ca8a04", dot: "#f59e0b" },
  screening: { bg: "#fff7ed", text: "#ea580c", dot: "#f97316" },
  interview: { bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" },
  offer: { bg: "#faf5ff", text: "#9333ea", dot: "#a855f7" },
  rejected: { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
};

const CHART_COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#ef4444",
];

function Card({ icon: Icon, label, value, color = "#6366f1", sub, theme }) {
  return (
    <div
      style={{
        background: theme.card,
        borderRadius: 14,
        padding: "1.25rem 1.5rem",
        border: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={21} color={color} />
      </div>
      <div>
        <div
          style={{
            fontSize: 12,
            color: theme.subtext,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: theme.text,
            lineHeight: 1.1,
          }}
        >
          {value ?? "—"}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.applied;
  return (
    <span
      style={{
        fontSize: 11,
        padding: "3px 9px",
        borderRadius: 20,
        background: s.bg,
        color: s.text,
        fontWeight: 600,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { user, theme } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats", user?.id],
    queryFn: () => appAPI.stats().then((r) => r.data),
    enabled: !!user?.id,
  });

  const chartData = [
    { name: "Wishlist", value: stats?.by_status?.wishlist || 0 },
    { name: "Applied", value: stats?.by_status?.applied || 0 },
    { name: "Screening", value: stats?.by_status?.screening || 0 },
    { name: "Interview", value: stats?.by_status?.interview || 0 },
    { name: "Offer", value: stats?.by_status?.offer || 0 },
    { name: "Rejected", value: stats?.by_status?.rejected || 0 },
  ];
  const { data: apps } = useQuery({
    queryKey: ["apps", user?.id],
    queryFn: () => appAPI.list().then((r) => r.data),
    enabled: !!user?.id,
  });

  const recent = (apps || []).slice(0, 6);
  const by = stats?.by_status || {};
  const PIPELINE = [
    "wishlist",
    "applied",
    "screening",
    "interview",
    "offer",
    "rejected",
  ];

  if (isLoading) {
    return <Loader text="Loading applications..." />;
  }

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
            color: theme.text,
          }}
        >
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ margin: "4px 0 0", color: theme.subtext, fontSize: 14 }}>
          Track your job applications and progress from one place.
        </p>
      </div>

      {/* Stat cards */}
      {/* <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
          gap: 12,
          marginBottom: "1.75rem",
        }}
      >
        <Card
          icon={Briefcase}
          label="Total"
          value={stats?.total}
          color="#6366f1"
          theme={theme}
        />
        <Card
          icon={TrendingUp}
          label="Avg Match"
          value={stats?.avg_match_score ? `${stats.avg_match_score}%` : null}
          color="#0ea5e9"
          theme={theme}
        />
        <Card
          icon={CheckCircle}
          label="Offers"
          value={by.offer}
          color="#16a34a"
          theme={theme}
        />
        <Card
          icon={Clock}
          label="Interviews"
          value={by.interview}
          color="#f59e0b"
          theme={theme}
        />
        <Card
          icon={XCircle}
          label="Rejected"
          value={by.rejected}
          color="#ef4444"
          theme={theme}
        />
      </div>

      <div
        style={{
          background: theme.card,
          borderRadius: 18,
          padding: "1.5rem",
          marginTop: "1.5rem",
          border: `1px solid ${theme.border}`,
          marginBottom: "1.75rem",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: theme.text,
            marginBottom: "1rem",
          }}
        >
          Applications Overview
        </div>

        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div> */}

      {/* <div
        style={{
          marginBottom: 18,
          fontSize: 15,
          color: theme.subtext,
        }}
      >
        Total Applications
        <span
          style={{
            marginLeft: 10,
            fontWeight: 700,
            color: theme.text,
            fontSize: 22,
          }}
        >
          {stats?.total || 0}
        </span>
      </div> */}

      {/* Pipeline funnel */}
      <div
        style={{
          background: theme.card,
          borderRadius: 14,
          border: `1px solid ${theme.border}`,
          padding: "1.5rem",
          marginBottom: "1.75rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <h2
          style={{
            margin: "0 0 1rem",
            fontSize: 15,
            fontWeight: 700,
            color: theme.text,
          }}
        >
          Application Tracker
        </h2>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PIPELINE.map((s, i) => {
            const st = STATUS_STYLE[s];
            const count = by[s] || 0;
            return (
              <React.Fragment key={s}>
                <div
                  style={{
                    flex: "1 1 70px",
                    textAlign: "center",
                    padding: "0.85rem 0.5rem",
                    borderRadius: 10,
                    background: st.bg,
                    minWidth: 70,
                  }}
                >
                  <div
                    style={{ fontSize: 22, fontWeight: 800, color: st.text }}
                  >
                    {count}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: theme.subtext,
                      textTransform: "capitalize",
                      marginTop: 2,
                      fontWeight: 500,
                    }}
                  >
                    {s}
                  </div>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: "#cbd5e1",
                    }}
                  >
                    {/* <ArrowRight size={14} /> */}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Recent apps */}
      {/* <div
        style={{
          background: theme.card,
          borderRadius: 14,
          border: `1px solid ${theme.border}`,
          padding: "1.5rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: theme.text,
            }}
          >
            Recent applications
          </h2>
          <Link
            to="/kanban"
            style={{
              fontSize: 13,
              color: "#6366f1",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem 1rem",
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            No applications yet.{" "}
            <Link
              to="/kanban"
              style={{
                color: "#6366f1",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Add your first one
            </Link>
          </div>
        ) : (
          recent.map((app, i) => (
            <Link
              key={app.id}
              to={`/apps/${app.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 0.5rem",
                  borderRadius: 8,
                  borderBottom:
                    i < recent.length - 1 ? `1px solid ${theme.border}` : "none",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = theme.bg)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div>
                  <div
                    style={{ fontWeight: 600, color: theme.text, fontSize: 14 }}
                  >
                    {app.company}
                  </div>
                  <div style={{ fontSize: 12, color: theme.subtext, marginTop: 1 }}>
                    {app.role}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {app.match_score != null && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#6366f1",
                        background: "#eef2ff",
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {app.match_score}%
                    </span>
                  )}
                  <StatusBadge status={app.status} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div> */}
      <div
        style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 20,
          boxShadow: theme.boxShadow,
          overflowX: "auto",
        }}
      >
        {/* <h3
          style={{
            marginBottom: 16,
            color: theme.text,
          }}
        >
          Recent Applications
        </h3> */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          {/* <Link
            to="/kanban"
            style={{
              color: "#6366f1",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            View All →
          </Link> */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 10,
              width: "100%",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: theme.text,
              }}
            >
              Recent Applications
            </h3>

            <Link
              to="/kanban"
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#6366f1",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              {/* <Plus size={16} /> */}
              Add Application
            </Link>

            {apps?.length > 0 && (
              <Link
                to="/kanban"
                style={{
                  marginLeft: 12,
                  color: "#6366f1",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                View All →
              </Link>
            )}
          </div>
        </div>

        {apps?.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
            }}
          >
            <Briefcase size={60} color="#cbd5e1" />

            <h3
              style={{
                color: theme.text,
                marginTop: 20,
              }}
            >
              No applications yet
            </h3>

            <p
              style={{
                color: theme.subtext,
                marginBottom: 25,
              }}
            >
              Start tracking your job applications.
            </p>

            <Link
              to="/applications"
              style={{
                background: "#6366f1",
                color: "#fff",
                padding: "12px 20px",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                flexWrap: "wrap"

              }}
            >
              Add Your First Application
            </Link>
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: `2px solid ${theme.border}`,
                  color: theme.subtext,
                  textAlign: "left",
                }}
              >
                {/* <th style={{ padding: "12px" }}>Company</th>
              <th style={{ padding: "12px" }}>Role</th>
              <th style={{ padding: "12px" }}>Status</th>
              <th style={{ padding: "12px" }}>Applied Date</th> */}

                <th style={{ padding: "12px", width: "35%" }}>Company</th>
                <th style={{ padding: "12px", width: "35%" }}>Role</th>
                <th style={{ padding: "12px", width: "15%" }}>Status</th>
                <th style={{ padding: "12px", width: "15%" }}>Applied Date</th>
              </tr>
            </thead>

            <tbody>
              {(apps || [])
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5)
                .map((app) => (
                  // <tr
                  //   // key={app.id}
                  //   key={app.id || app._id}
                  //   style={{
                  //     borderBottom: `1px solid ${theme.border}`,
                  //   }}
                  // >
                  // <tr
                  //   key={app.id || app._id}
                  //   onClick={() =>
                  //     (window.location.href = `/apps/${app.id || app._id}`)
                  //   }
                  //   style={{
                  //     borderBottom: `1px solid ${theme.border}`,
                  //     cursor: "pointer",
                  //   }}
                  // >

                  <tr
                    key={app.id || app._id}
                    onClick={() =>
                      (window.location.href = `/apps/${app.id || app._id}`)
                    }
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = theme.bg)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      cursor: "pointer",
                    }}
                  >
                    {/* <td style={{ padding: "12px", color: theme.text }}>
                  {app.company}
                </td> */}

                    <td
                      style={{
                        padding: "12px",
                        color: theme.text,
                        width: "35%",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {app.company}
                    </td>

                    {/* <td style={{ padding: "12px", color: theme.text }}>
                  {app.role}
                </td> */}

                    <td
                      style={{
                        padding: "12px",
                        color: theme.text,
                        width: "35%",
                      }}
                    >
                      {app.role}
                    </td>

                    {/* <td style={{ padding: "12px" }}>
                  <span
                    style={{
                      background:
                        app.status === "Applied"
                          ? "#3b82f6"
                          : app.status === "Interview"
                            ? "#f59e0b"
                            : app.status === "Offer"
                              ? "#10b981"
                              : "#ef4444",
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                    }}
                  >
                    {app.status}
                  </span>
                </td> */}
                    <td style={{ padding: "12px" }}>
                      <StatusBadge status={app.status?.toLowerCase()} />
                    </td>

                    <td style={{ padding: "12px", color: theme.subtext }}>
                      {/* {new Date(app.created_at).toLocaleDateString()} */}
                      {app.created_at
                        ? new Date(app.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
