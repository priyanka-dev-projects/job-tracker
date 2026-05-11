import React from "react";
import { useQuery } from "@tanstack/react-query";
import { matchAPI } from "../api/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, AlertCircle, Star } from "lucide-react";
import Loader from "../components/Loader";
import { useAuth } from "../App";

const PURPLE = [
  "#6366f1",
  "#7c3aed",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
  "#818cf8",
  "#4f46e5",
  "#4338ca",
  "#3730a3",
  "#312e81",
];
const RED = [
  "#ef4444",
  "#dc2626",
  "#b91c1c",
  "#f87171",
  "#fca5a5",
  "#991b1b",
  "#7f1d1d",
  "#fecaca",
  "#fee2e2",
  "#fef2f2",
];


function HBar({ label, count, max, color }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          width: 100,
          fontSize: 12,
          color: "#374151",
          fontWeight: 600,
          textAlign: "right",
          flexShrink: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          height: 24,
          background: "#f1f5f9",
          borderRadius: 6,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 6,
            transition: "width 0.5s ease",
            display: "flex",
            alignItems: "center",
            paddingLeft: 8,
            minWidth: count > 0 ? 20 : 0,
          }}
        >
          {pct > 15 && (
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>
              {count}
            </span>
          )}
        </div>
      </div>
      {pct <= 15 && (
        <span
          style={{
            fontSize: 11,
            color: theme.subtext,
            minWidth: 16,
            fontWeight: 600,
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

export default function SkillsPage() {
  const { theme } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["skill-dashboard"],
    queryFn: () => matchAPI.dashboard().then((r) => r.data),
  });

  if (isLoading) return <Loader text="Loading applications..." />;

  const demanded = data?.most_demanded || [];
  const missing = data?.most_missing || [];
  const nice = data?.nice_to_have_common || [];
  const maxD = demanded[0]?.[1] || 1;
  const maxM = missing[0]?.[1] || 1;
  const chartData = demanded
    .slice(0, 8)
    .map(([skill, count]) => ({ skill, count }));

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{ margin: 0, fontSize: 22, fontWeight: 800, color: theme.text }}
        >
          Skill Gap Dashboard
        </h1>
        <p style={{ margin: "3px 0 0", color: theme.subtext, fontSize: 13 }}>
          Aggregated across {data?.total_jds_analyzed || 0} skills from all job
          descriptions you've analyzed
        </p>
      </div>

      {demanded.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            background: theme.card,
            borderRadius: 16,
            border: `1px solid ${theme.border}`,
          }}
        >
          <AlertCircle size={36} color="#cbd5e1" style={{ marginBottom: 12 }} />
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              color: "#374151",
              fontSize: 16,
            }}
          >
            No data yet
          </p>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 13,
              color: "#94a3b8",
              maxWidth: 320,
              lineHeight: 1.5,
            }}
          >
            Open an application, paste a job description, and click "Analyze
            match" to start seeing insights here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Bar chart — full width */}
          <div
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 14,
              padding: "1.5rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <h2
              style={{
                margin: "0 0 1.25rem",
                fontSize: 15,
                fontWeight: 700,
                color: theme.text,
              }}
            >
              Most demanded skills across all JDs
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="skill"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={PURPLE[i % PURPLE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            {/* Most demanded list */}
            <div
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: "1.25rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: "1rem",
                }}
              >
                <TrendingUp size={16} color="#6366f1" />
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: theme.text }}
                >
                  Most demanded
                </span>
              </div>
              {demanded.map(([skill, count], i) => (
                <HBar
                  key={skill}
                  label={skill}
                  count={count}
                  max={maxD}
                  color={PURPLE[i % PURPLE.length]}
                />
              ))}
            </div>

            {/* Your gaps */}
            <div
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: "1.25rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: "1rem",
                }}
              >
                <AlertCircle size={16} color="#ef4444" />
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: theme.text }}
                >
                  Your skill gaps
                </span>
              </div>
              {missing.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "1.5rem",
                    color: "#94a3b8",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13 }}>
                    No gaps detected yet!
                  </p>
                </div>
              ) : (
                missing.map(([skill, count], i) => (
                  <HBar
                    key={skill}
                    label={skill}
                    count={count}
                    max={maxM}
                    color={RED[i % RED.length]}
                  />
                ))
              )}
            </div>
          </div>

          {/* Nice to have */}
          {nice.length > 0 && (
            <div
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: "1.25rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: "0.75rem",
                }}
              >
                <Star size={15} color="#f59e0b" />
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: theme.text }}
                >
                  Nice-to-have skills seen across JDs
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {nice.map(([skill, count]) => (
                  <span
                    key={skill}
                    style={{
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: "#fefce8",
                      color: "#92400e",
                      fontWeight: 600,
                      border: "1px solid #fde68a",
                    }}
                  >
                    {skill} <span style={{ opacity: 0.6 }}>×{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@media(max-width:640px){ .skills-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
