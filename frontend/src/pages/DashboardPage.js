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
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

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

function Card({ icon: Icon, label, value, color = "#6366f1", sub }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "1.25rem 1.5rem",
        border: "1px solid #e2e8f0",
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
            color: "#64748b",
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
            color: "#0f172a",
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
  const { user } = useAuth();
  const { data: stats } = useQuery({
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

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}
        >
          Good to see you, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
          Here's your job search snapshot
        </p>
      </div>

      {/* Stat cards */}
      <div
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
        />
        <Card
          icon={TrendingUp}
          label="Avg Match"
          value={stats?.avg_match_score ? `${stats.avg_match_score}%` : null}
          color="#0ea5e9"
        />
        <Card
          icon={CheckCircle}
          label="Offers"
          value={by.offer}
          color="#16a34a"
        />
        <Card
          icon={Clock}
          label="Interviews"
          value={by.interview}
          color="#f59e0b"
        />
        <Card
          icon={XCircle}
          label="Rejected"
          value={by.rejected}
          color="#ef4444"
        />
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: "1.5rem",
          marginTop: "1.5rem",
          border: "1px solid #e2e8f0",
          marginBottom: "1.75rem",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#0f172a",
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
                label
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
      </div>

      {/* Pipeline funnel */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
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
            color: "#0f172a",
          }}
        >
          Application pipeline
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
                      color: "#64748b",
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
                    <ArrowRight size={14} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Recent apps */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
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
              color: "#0f172a",
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
                    i < recent.length - 1 ? "1px solid #f1f5f9" : "none",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f8fafc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div>
                  <div
                    style={{ fontWeight: 600, color: "#0f172a", fontSize: 14 }}
                  >
                    {app.company}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
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
      </div>
    </div>
  );
}
