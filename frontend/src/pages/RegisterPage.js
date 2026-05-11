import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import { authAPI } from "../api/client";
import toast from "react-hot-toast";
import { BriefcaseIcon } from "lucide-react";
import { lightTheme, darkTheme } from "../theme";

const getStyles = (theme, darkMode) => ({
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: darkMode ? theme.bg : "linear-gradient(135deg,#f0f4ff 0%,#faf5ff 100%)",
    padding: "1rem",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    background: theme.card,
    borderRadius: 20,
    padding: "2.5rem 2rem",
    boxShadow: "0 8px 40px rgba(99,102,241,0.12)",
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: theme.text,
    display: "block",
    marginBottom: 4,
  },
  input: {
    width: "100%",
    padding: "0.7rem 0.85rem",
    borderRadius: 10,
    border: "1.5px solid #e2e8f0",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  btn: {
    width: "100%",
    padding: "0.8rem",
    borderRadius: 10,
    background: "#6366f1",
    color: "#fff",
    border: "none",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    marginTop: 4,
  },
});

export default function RegisterPage() {
  const { login, theme, darkMode } = useAuth();
  const S = getStyles(theme, darkMode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      login(
        { id: res.data.user_id, name: res.data.name, email: res.data.email },
        res.data.access_token,
      );
      toast.success("Account created! Welcome 🎉");
      window.location.href = "/";
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      key: "name",
      label: "Full name",
      type: "text",
      placeholder: "Ada Lovelace",
    },
    {
      key: "email",
      label: "Email",
      type: "email",
      placeholder: "you@example.com",
    },
    {
      key: "password",
      label: "Password",
      type: "password",
      placeholder: "Min. 6 characters",
    },
  ];

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#eef2ff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <BriefcaseIcon size={26} color="#6366f1" />
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: theme.text,
            }}
          >
            Create account
          </h1>
          <p style={{ margin: "6px 0 0", color: theme.subtext, fontSize: 14 }}>
            Start tracking your job search
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label style={S.label}>{label}</label>
              <input
                style={S.input}
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                required
              />
            </div>
          ))}
          <button
            style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <p
          style={{
            textAlign: "center",
            marginTop: "1.25rem",
            fontSize: 13,
            color: theme.subtext,
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#6366f1",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
