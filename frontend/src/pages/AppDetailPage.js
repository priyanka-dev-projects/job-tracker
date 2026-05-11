import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appAPI, resumeAPI, matchAPI } from "../api/client";
import toast from "react-hot-toast";
import { ArrowLeft, Zap, CheckCircle, XCircle, ExternalLink, Edit2, Save, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../App";

const STATUS_COLOR = {
  wishlist:"#3b82f6", applied:"#f59e0b", screening:"#f97316",
  interview:"#22c55e", offer:"#a855f7", rejected:"#ef4444",
};
const STATUSES = ["wishlist","applied","screening","interview","offer","rejected"];

export default function AppDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [jdText, setJdText] = useState("");
  const [matchResult, setMatch] = useState(null);
  const [selectedResume, setSelectedResume] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const { data: app, isLoading } = useQuery({
    queryKey: ["app", user?.id, id], queryFn: () => appAPI.get(id).then(r => r.data),
    enabled: !!user?.id,
  });

  const { data: resumes = [] } = useQuery({
    queryKey: ["resumes", user?.id,], queryFn: () => resumeAPI.list().then(r => r.data),
    enabled: !!user?.id,
  });

  const statusMut = useMutation({
    mutationFn: (status) => appAPI.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries(["app", id]); qc.invalidateQueries(["apps"]); qc.invalidateQueries(["stats"]); },
    onError: () => toast.error("Failed to update status"),
  });

  const updateMut = useMutation({
    mutationFn: (data) => appAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries(["app", id]); setEditing(false); toast.success("Saved"); },
    onError: () => toast.error("Update failed"),
  });

  const deleteMut = useMutation({
    mutationFn: () => appAPI.delete(id),
    onSuccess: () => { toast.success("Application deleted"); navigate("/kanban"); },
    onError: () => toast.error("Delete failed"),
  });

  const matchMut = useMutation({
    mutationFn: () => matchAPI.match(selectedResume, id, jdText),
    onSuccess: (res) => { setMatch(res.data); qc.invalidateQueries(["app", id]); toast.success(`Match: ${res.data.match_score}%`); },
    onError: () => toast.error("Match failed — ensure resume and JD are provided"),
  });

  if (isLoading) return <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8" }}>Loading…</div>;
  if (!app)      return <div style={{ textAlign:"center", padding:"3rem", color:"#ef4444" }}>Not found</div>;

  const result = matchResult || { matched_skills:[], missing_skills: app.skill_gaps || [] };
  const score  = app.match_score;

  const startEdit = () => { setEditForm({ company: app.company, role: app.role, job_url: app.job_url || "", notes: app.notes || "" }); setEditing(true); };
  const inp = { width:"100%", padding:"0.55rem 0.7rem", borderRadius:8, border:"1px solid #e2e8f0", fontSize:13, outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ maxWidth:900 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:"1.5rem" }}>
        <button onClick={() => navigate(-1)} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8,
          padding:"6px 8px", cursor:"pointer", display:"flex", alignItems:"center", color:"#64748b" }}>
          <ArrowLeft size={18}/>
        </button>
        {editing ? (
          <div style={{ flex:1, display:"flex", gap:8, flexWrap:"wrap" }}>
            <input style={{ ...inp, flex:"1 1 140px", fontSize:16, fontWeight:700 }} value={editForm.company}
              onChange={e=>setEditForm(f=>({...f,company:e.target.value}))} placeholder="Company" />
            <input style={{ ...inp, flex:"1 1 140px" }} value={editForm.role}
              onChange={e=>setEditForm(f=>({...f,role:e.target.value}))} placeholder="Role" />
            <input style={{ ...inp, flex:"1 1 200px", fontSize:12 }} value={editForm.job_url}
              onChange={e=>setEditForm(f=>({...f,job_url:e.target.value}))} placeholder="Job URL" />
          </div>
        ) : (
          <div style={{ flex:1 }}>
            <h1 style={{ margin:0, fontSize:20, fontWeight:800, color:"#0f172a" }}>{app.company}</h1>
            <p style={{ margin:0, color:"#64748b", fontSize:14 }}>{app.role}</p>
          </div>
        )}
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          {app.job_url && !editing && (
            <a href={app.job_url} target="_blank" rel="noreferrer"
              style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#6366f1",
                background:"#eef2ff", padding:"6px 10px", borderRadius:8, textDecoration:"none", fontWeight:600 }}>
              <ExternalLink size={12}/> Posting
            </a>
          )}
          {editing ? (
            <>
              <button onClick={() => updateMut.mutate(editForm)} style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 12px", background:"#6366f1", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700 }}>
                <Save size={13}/> Save
              </button>
              <button onClick={() => setEditing(false)} style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 12px", background:"#f1f5f9", color:"#374151", border:"none", borderRadius:8, cursor:"pointer", fontSize:12 }}>
                <X size={13}/> Cancel
              </button>
            </>
          ) : (
            <button onClick={startEdit} style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 10px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, cursor:"pointer", fontSize:12, color:"#374151" }}>
              <Edit2 size={13}/> Edit
            </button>
          )}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {/* Left */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Status */}
          <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"1.1rem 1.25rem" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 }}>Stage</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {STATUSES.map(s => (
                <button key={s} onClick={() => statusMut.mutate(s)}
                  style={{ padding:"5px 12px", borderRadius:20, border:"none", cursor:"pointer",
                    fontWeight:600, fontSize:12, textTransform:"capitalize", transition:"all 0.1s",
                    background: app.status === s ? STATUS_COLOR[s] : "#f1f5f9",
                    color: app.status === s ? "#fff" : "#374151",
                    boxShadow: app.status === s ? `0 2px 8px ${STATUS_COLOR[s]}40` : "none" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Match score */}
          {score != null && (
            <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"1.1rem 1.25rem" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 }}>Match score</div>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ fontSize:44, fontWeight:900, color: score>=70?"#16a34a":score>=40?"#f59e0b":"#ef4444", lineHeight:1 }}>
                  {score}<span style={{ fontSize:22 }}>%</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ height:10, background:"#f1f5f9", borderRadius:5, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:5, width:`${score}%`,
                      background: score>=70?"#16a34a":score>=40?"#f59e0b":"#ef4444", transition:"width 0.6s ease" }} />
                  </div>
                  <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>
                    {score >= 70 ? "Strong match 🎯" : score >= 40 ? "Moderate match" : "Low match — skill gaps present"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {(app.notes || editing) && (
            <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"1.1rem 1.25rem" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:0.6, marginBottom:8 }}>Notes</div>
              {editing ? (
                <textarea style={{ ...inp, minHeight:80, resize:"vertical" }} value={editForm.notes}
                  onChange={e=>setEditForm(f=>({...f,notes:e.target.value}))} placeholder="Notes…" />
              ) : (
                <p style={{ margin:0, fontSize:13, color:"#374151", lineHeight:1.5 }}>{app.notes}</p>
              )}
            </div>
          )}

          {/* Timeline */}
          <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"1.1rem 1.25rem" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:0.6, marginBottom:12 }}>Timeline</div>
            {[...(app.timeline || [])].reverse().map((e, i, arr) => (
              <div key={i} style={{ display:"flex", gap:10, paddingBottom: i < arr.length-1 ? 12 : 0, position:"relative", marginLeft:8 }}>
                <div style={{ position:"absolute", left:-5, top:4, width:10, height:10, borderRadius:"50%",
                  background: STATUS_COLOR[e.status] || "#94a3b8", border:"2px solid #fff", zIndex:1 }} />
                {i < arr.length-1 && (
                  <div style={{ position:"absolute", left:-1, top:14, bottom:0, width:2, background:"#f1f5f9" }} />
                )}
                <div style={{ paddingLeft:14 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#0f172a", textTransform:"capitalize" }}>{e.status}</div>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>
                    {formatDistanceToNow(new Date(e.timestamp), { addSuffix:true })}
                  </div>
                  {e.note && <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{e.note}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Delete */}
          <button onClick={() => { if(window.confirm("Delete this application?")) deleteMut.mutate(); }}
            style={{ padding:"0.65rem", background:"#fef2f2", border:"1px solid #fecaca",
              borderRadius:10, color:"#ef4444", fontWeight:600, cursor:"pointer", fontSize:13 }}>
            Delete application
          </button>
        </div>

        {/* Right — JD matcher */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"1.1rem 1.25rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, fontWeight:700,
              color:"#94a3b8", textTransform:"uppercase", letterSpacing:0.6, marginBottom:12 }}>
              <Zap size={12} color="#6366f1" /> Job description matcher
            </div>
            <select style={{ ...inp, marginBottom:10 }} value={selectedResume} onChange={e=>setSelectedResume(e.target.value)}>
              <option value="">— select a resume —</option>
              {resumes.map(r => <option key={r.id} value={r.id}>{r.original_filename}</option>)}
            </select>
            <textarea placeholder="Paste the full job description here…"
              value={jdText} onChange={e=>setJdText(e.target.value)}
              style={{ ...inp, minHeight:150, resize:"vertical", marginBottom:10 }} />
            <button 
            disabled={!jdText.trim() || !selectedResume || matchMut.isPending}
              onClick={() => matchMut.mutate()}
              style={{ width:"100%", padding:"0.7rem", background:"#6366f1", color:"#fff",
                border:"none", borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:13,
                opacity:(!jdText.trim()||!selectedResume)?0.5:1 }}>
              {matchMut.isPending ? "Analyzing…" : "⚡ Analyze match"}
            </button>
          </div>

          {(result.matched_skills?.length > 0 || result.missing_skills?.length > 0) && (
            <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:14, padding:"1.1rem 1.25rem" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:0.6, marginBottom:12 }}>
                Skills breakdown
              </div>
              {result.matched_skills?.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:6 }}>
                    <CheckCircle size={13} color="#16a34a" />
                    <span style={{ fontSize:12, fontWeight:700, color:"#16a34a" }}>You have ({result.matched_skills.length})</span>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {result.matched_skills.map(s => (
                      <span key={s} style={{ fontSize:11, padding:"3px 8px", borderRadius:20, background:"#f0fdf4", color:"#16a34a", fontWeight:600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.missing_skills?.length > 0 && (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:6 }}>
                    <XCircle size={13} color="#ef4444" />
                    <span style={{ fontSize:12, fontWeight:700, color:"#ef4444" }}>Missing ({result.missing_skills.length})</span>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {result.missing_skills.map(s => (
                      <span key={s} style={{ fontSize:11, padding:"3px 8px", borderRadius:20, background:"#fef2f2", color:"#ef4444", fontWeight:600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@media(max-width:640px){ .app-detail-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
