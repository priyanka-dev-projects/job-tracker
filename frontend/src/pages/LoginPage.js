import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import { authAPI } from "../api/client";
import toast from "react-hot-toast";
import { BriefcaseIcon, Eye, EyeOff } from "lucide-react";

const S = {
  wrap:  { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#f0f4ff 0%,#faf5ff 100%)", padding:"1rem" },
  card:  { width:"100%", maxWidth:400, background:"#fff", borderRadius:20, padding:"2.5rem 2rem", boxShadow:"0 8px 40px rgba(99,102,241,0.12)" },
  label: { fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:4 },
  input: { width:"100%", padding:"0.7rem 0.85rem", borderRadius:10, border:"1.5px solid #e2e8f0",
           fontSize:14, outline:"none", boxSizing:"border-box", transition:"border 0.15s" },
  btn:   { width:"100%", padding:"0.8rem", borderRadius:10, background:"#6366f1", color:"#fff",
           border:"none", fontWeight:700, fontSize:15, cursor:"pointer", marginTop:4 },
};

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(email, password);
      login({ id: res.data.user_id, name: res.data.name, email: res.data.email }, res.data.access_token);
      toast.success(`Welcome back, ${res.data.name}!`);
      window.location.href = "/";
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:52, height:52, borderRadius:14, background:"#eef2ff", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
            <BriefcaseIcon size={26} color="#6366f1" />
          </div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:"#0f172a" }}>JobTracker</h1>
          <p style={{ margin:"6px 0 0", color:"#64748b", fontSize:14 }}>Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <div>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" value={email} onChange={e=>setEmail(e.target.value)}
              required placeholder="you@example.com" autoComplete="email" />
          </div>
          <div>
            <label style={S.label}>Password</label>
            <div style={{ position:"relative" }}>
              <input style={{ ...S.input, paddingRight:"2.5rem" }} type={showPw?"text":"password"}
                value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(p=>!p)}
                style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer", color:"#94a3b8", display:"flex" }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p style={{ textAlign:"center", marginTop:"1.25rem", fontSize:13, color:"#64748b" }}>
          No account?{" "}
          <Link to="/register" style={{ color:"#6366f1", fontWeight:600, textDecoration:"none" }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
