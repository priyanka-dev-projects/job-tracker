import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../App";

import {
  LayoutDashboard,
  Kanban,
  FileText,
  LogOut,
  Menu,
  X,
  BriefcaseIcon,
  Sun,
  Moon,
} from "lucide-react";

const NAV = [
  {
    to: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
  },

  {
    to: "/kanban",
    icon: Kanban,
    label: "Applications",
  },

  {
    to: "/resumes",
    icon: FileText,
    label: "My Resumes",
  },
];

export default function Layout() {
  const { user, logout, theme, siderBarTheme, darkMode, toggleDarkMode } =
    useAuth();

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();

    navigate("/login");
  };

  const iconButtonStyle = {
    width: 32,

    height: 32,

    borderRadius: 8,

    background: "transparent",

    border: "none",

    cursor: "pointer",

    color: siderBarTheme.text,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    flexShrink: 0,

    transition: "background 0.2s ease",
  };

  const SidebarContent = ({ mobile = false }) => (
    <>
      <div
        style={{
          padding:
            sidebarOpen && !mobile
              ? "0.25rem 0.25rem 0.75rem"
              : "0.25rem 0 0.75rem",

          marginBottom: "1rem",

          borderBottom: `1px solid ${siderBarTheme.border}`,
        }}
      >
        {sidebarOpen || mobile ? (
          <>
            <div
              style={{
                display: "flex",

                justifyContent: "flex-end",

                marginBottom: 2,
              }}
            >
              <button
                onClick={toggleDarkMode}
                title={
                  darkMode ? "Switch to light mode" : "Switch to dark mode"
                }
                style={iconButtonStyle}
              >
                {darkMode ? <Sun size={19} /> : <Moon size={19} />}
              </button>
            </div>

            <div
              style={{
                display: "flex",

                alignItems: "center",

                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",

                  alignItems: "center",

                  gap: 10,

                  minWidth: 0,
                }}
              >
                <BriefcaseIcon size={22} color="#2563eb" />

                <span
                  style={{
                    fontWeight: 700,

                    fontSize: 16,

                    color: siderBarTheme.text,

                    overflow: "hidden",

                    whiteSpace: "nowrap",
                  }}
                >
                  JobTracker
                </span>
              </div>

              {!mobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  title="Collapse sidebar"
                  style={iconButtonStyle}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </>
        ) : (
          /* ========================================
             COLLAPSED SIDEBAR

             THEME ICON ABOVE HAMBURGER
          ======================================== */

          <div
            style={{
              display: "flex",

              flexDirection: "column",

              alignItems: "center",

              gap: 5,
            }}
          >
            <button
              onClick={toggleDarkMode}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              style={iconButtonStyle}
            >
              {darkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {/* HAMBURGER */}

            <button
              onClick={() => setSidebarOpen(true)}
              title="Expand sidebar"
              style={iconButtonStyle}
            >
              <Menu size={22} />
            </button>
          </div>
        )}
      </div>

      <nav
        style={{
          display: "flex",

          flexDirection: "column",

          gap: 4,

          flex: 1,

          paddingTop: "0.25rem",
        }}
      >
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={() => {
              if (mobile) {
                setOpen(false);
              }
            }}
            title={!sidebarOpen && !mobile ? label : undefined}
            style={({ isActive }) => ({
              display: "flex",

              alignItems: "center",

              justifyContent: !sidebarOpen && !mobile ? "center" : "flex-start",

              gap: 10,

              padding:
                !sidebarOpen && !mobile ? "0.65rem 0" : "0.65rem 0.75rem",

              borderRadius: 8,

              color: isActive ? "#ffffff" : siderBarTheme.subtext,

              background: isActive ? "#6366f1" : "transparent",

              textDecoration: "none",

              fontSize: 14,

              fontWeight: 500,

              whiteSpace: "nowrap",

              transition: "all 0.2s ease",
            })}
          >
            <Icon size={17} />

            {(sidebarOpen || mobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          marginTop: "auto",

          borderTop: `1px solid ${siderBarTheme.border}`,

          paddingTop: "1rem",
        }}
      >
        {(sidebarOpen || mobile) && (
          <div
            style={{
              fontSize: 12,

              color: siderBarTheme.subtext,

              padding: "0 0.5rem 0.5rem",

              overflow: "hidden",

              textOverflow: "ellipsis",

              whiteSpace: "nowrap",
            }}
          >
            {user?.email}
          </div>
        )}

        <button
          onClick={handleLogout}
          title={!sidebarOpen && !mobile ? "Log out" : undefined}
          style={{
            display: "flex",

            alignItems: "center",

            justifyContent: !sidebarOpen && !mobile ? "center" : "flex-start",

            gap: 8,

            width: "100%",

            padding: !sidebarOpen && !mobile ? "0.65rem 0" : "0.65rem 0.75rem",

            borderRadius: 8,

            background: "transparent",

            border: "none",

            color: "#ef4444",

            cursor: "pointer",

            fontSize: 14,

            fontWeight: 500,

            whiteSpace: "nowrap",
          }}
        >
          <LogOut size={17} />

          {(sidebarOpen || mobile) && <span>Log out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div
      style={{
        display: "flex",

        minHeight: "100vh",

        background: theme.bg,

        color: theme.text,

        fontFamily: "system-ui, sans-serif",

        transition: "background 0.2s ease, color 0.2s ease",
      }}
    >
      <aside
        className="jat-sidebar"
        style={{
          width: sidebarOpen ? 220 : 70,

          transition: "width 0.3s ease",

          background: siderBarTheme.card,

          display: "flex",

          flexDirection: "column",

          padding: "1rem",

          overflow: "hidden",

          boxSizing: "border-box",

          minHeight: "100vh",

          flexShrink: 0,
        }}
      >
        <SidebarContent />
      </aside>

      <div
        className="jat-topbar"
        style={{
          position: "fixed",

          top: 0,

          left: 0,

          right: 0,

          height: 52,

          background: theme.card,

          borderBottom: `1px solid ${theme.border}`,

          display: "flex",

          alignItems: "center",

          padding: "0 1rem",

          boxSizing: "border-box",

          zIndex: 100,

          gap: 10,
        }}
      >
        <button
          onClick={() => setOpen((prev) => !prev)}
          style={{
            background: "none",

            border: "none",

            color: theme.text,

            cursor: "pointer",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",
          }}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <BriefcaseIcon size={18} color="#6366f1" />

        <span
          style={{
            fontWeight: 700,

            color: theme.text,

            fontSize: 15,
          }}
        >
          JobTracker
        </span>

        <button
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            marginLeft: "auto",

            width: 34,

            height: 34,

            borderRadius: 8,

            border: `1px solid ${theme.border}`,

            background: theme.card,

            color: theme.text,

            cursor: "pointer",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",
          }}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {open && (
        <div
          className="jat-mobile-drawer"
          style={{
            position: "fixed",

            top: 52,

            left: 0,

            right: 0,

            bottom: 0,

            background: siderBarTheme.card,

            zIndex: 99,

            padding: "1rem",

            boxSizing: "border-box",

            display: "flex",

            flexDirection: "column",

            overflowY: "auto",
          }}
        >
          <SidebarContent mobile />
        </div>
      )}

      <main
        className="jat-main"
        style={{
          flex: 1,

          minWidth: 0,

          background: theme.bg,

          color: theme.text,

          overflowX: "hidden",

          transition: "background 0.2s ease, color 0.2s ease",
        }}
      >
        <div
          style={{
            maxWidth: 1200,

            margin: "0 auto",

            padding: "1.5rem",
          }}
        >
          <Outlet />
        </div>
      </main>

      <style>
        {`

          .jat-sidebar {
            display: flex !important;
          }


          .jat-topbar {
            display: none !important;
          }


          .jat-main {
            padding-top: 0 !important;
          }


          @media (max-width: 768px) {

            .jat-sidebar {
              display: none !important;
            }


            .jat-topbar {
              display: flex !important;
            }


            .jat-main {
              padding-top: 52px !important;
            }

          }

        `}
      </style>
    </div>
  );
}
