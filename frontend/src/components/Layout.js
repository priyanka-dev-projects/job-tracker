import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { LayoutDashboard, Kanban, FileText, BarChart2, LogOut, Menu, X, BriefcaseIcon } from "lucide-react";

const NAV = [
  { to: "/",        icon: LayoutDashboard, label: "Dashboard" },
  { to: "/kanban",  icon: Kanban,          label: "Applications" },
  { to: "/resumes", icon: FileText,        label: "My Resumes" },
  { to: "/skills",  icon: BarChart2,       label: "Skill Gaps" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  const SidebarContent = () => (
    <>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 0.5rem 1.5rem", borderBottom:"1px solid #1e293b" }}>
        <BriefcaseIcon size={22} color="#6366f1" />
        <span style={{ fontWeight:700, fontSize:16, color:"#f1f5f9" }}>JobTracker</span>
      </div>
      <nav style={{ display:"flex", flexDirection:"column", gap:2, flex:1, paddingTop:"1rem" }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)}
            style={({ isActive }) => ({
              display:"flex", alignItems:"center", gap:10,
              padding:"0.6rem 0.75rem", borderRadius:8,
              color: isActive ? "#fff" : "#94a3b8",
              background: isActive ? "#6366f1" : "transparent",
              textDecoration:"none", fontSize:14, fontWeight:500,
            })}>
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div style={{ borderTop:"1px solid #1e293b", paddingTop:"1rem" }}>
        <div style={{ fontSize:12, color:"#64748b", padding:"0 0.5rem 0.5rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {user?.email}
        </div>
        <button onClick={handleLogout} style={{
          display:"flex", alignItems:"center", gap:8, width:"100%",
          padding:"0.6rem 0.75rem", borderRadius:8, background:"transparent",
          border:"none", color:"#ef4444", cursor:"pointer", fontSize:14, fontWeight:500,
        }}>
          <LogOut size={16} /> Log out
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"system-ui, sans-serif" }}>
      {/* Desktop sidebar */}
      <aside style={{ width:220, background:"#0f172a", display:"flex", flexDirection:"column", padding:"1.5rem 1rem", gap:4 }}
        className="jat-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile topbar */}
      <div style={{ position:"fixed", top:0, left:0, right:0, height:52, background:"#0f172a",
        display:"flex", alignItems:"center", padding:"0 1rem", zIndex:100, gap:10 }}
        className="jat-topbar">
        <button onClick={() => setOpen(!open)} style={{ background:"none", border:"none", color:"#e2e8f0", cursor:"pointer", display:"flex" }}>
          {open ? <X size={20}/> : <Menu size={20}/>}
        </button>
        <BriefcaseIcon size={18} color="#6366f1" />
        <span style={{ fontWeight:700, color:"#f1f5f9", fontSize:15 }}>JobTracker</span>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{ position:"fixed", top:52, left:0, right:0, bottom:0, background:"#0f172a",
          zIndex:99, padding:"1rem", display:"flex", flexDirection:"column", gap:4 }}>
          <SidebarContent />
        </div>
      )}

      {/* Main */}
      <main style={{ flex:1, background:"#f8fafc", overflowX:"hidden" }} className="jat-main">
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"1.5rem" }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        .jat-sidebar { display: flex !important; }
        .jat-topbar  { display: none !important; }
        .jat-main    { padding-top: 0 !important; }
        @media (max-width: 768px) {
          .jat-sidebar { display: none !important; }
          .jat-topbar  { display: flex !important; }
          .jat-main    { padding-top: 52px !important; }
        }
      `}</style>
    </div>
  );
}
