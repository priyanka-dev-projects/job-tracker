import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Link } from "react-router-dom";
import { appAPI } from "../api/client";
import toast from "react-hot-toast";
import { Plus, X, ExternalLink } from "lucide-react";

const COLUMNS = [
  { id:"wishlist",  label:"Wishlist",  color:"#3b82f6" },
  { id:"applied",   label:"Applied",   color:"#f59e0b" },
  { id:"screening", label:"Screening", color:"#f97316" },
  { id:"interview", label:"Interview", color:"#22c55e" },
  { id:"offer",     label:"Offer",     color:"#a855f7" },
  { id:"rejected",  label:"Rejected",  color:"#ef4444" },
];

function Modal({ onClose }) {
  const [form, setForm] = useState({ company:"", role:"", job_url:"", status:"wishlist", notes:"" });
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => appAPI.create(form),
    onSuccess: () => { qc.invalidateQueries(["apps"]); qc.invalidateQueries(["stats"]); toast.success("Application added!"); onClose(); },
    onError: () => toast.error("Failed to create"),
  });

  const inp = { width:"100%", padding:"0.6rem 0.75rem", borderRadius:8, border:"1px solid #e2e8f0", fontSize:13, outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:200, padding:"1rem" }}>
      <div style={{ background:"#fff", borderRadius:18, padding:"1.75rem", width:"100%", maxWidth:440, boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#0f172a" }}>New application</h2>
          <button onClick={onClose} style={{ background:"#f1f5f9", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={16} color="#64748b"/>
          </button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            { key:"company", label:"Company *", type:"text", placeholder:"Google" },
            { key:"role",    label:"Role *",    type:"text", placeholder:"Software Engineer" },
            { key:"job_url", label:"Job URL",   type:"url",  placeholder:"https://…" },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>{label}</label>
              <input style={inp} type={type} placeholder={placeholder} value={form[key]}
                onChange={e => setForm(f=>({...f,[key]:e.target.value}))} />
            </div>
          ))}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Stage</label>
            <select style={inp} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              {COLUMNS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:"#374151", display:"block", marginBottom:4 }}>Notes</label>
            <textarea style={{ ...inp, minHeight:60, resize:"vertical" }} placeholder="Any initial notes…"
              value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
          </div>
          <button disabled={!form.company || !form.role || mutation.isPending}
            onClick={() => mutation.mutate()}
            style={{ padding:"0.75rem", background:"#6366f1", color:"#fff", border:"none",
              borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:14,
              opacity:(!form.company||!form.role||mutation.isPending)?0.6:1, marginTop:4 }}>
            {mutation.isPending ? "Adding…" : "Add application"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppCard({ app, index }) {
  return (
    <Draggable draggableId={app.id} index={index}>
      {(prov, snap) => (
        <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
          style={{ background: snap.isDragging ? "#eef2ff" : "#fff", border:"1px solid #e2e8f0",
            borderRadius:10, padding:"0.9rem 1rem", marginBottom:7, cursor:"grab",
            boxShadow: snap.isDragging ? "0 6px 20px rgba(99,102,241,0.2)" : "0 1px 3px rgba(0,0,0,0.05)",
            ...prov.draggableProps.style }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{app.company}</div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{app.role}</div>
            </div>
            <Link to={`/apps/${app.id}`} onClick={e=>e.stopPropagation()}
              style={{ color:"#94a3b8", flexShrink:0, display:"flex", padding:2 }}>
              <ExternalLink size={13} />
            </Link>
          </div>
          {(app.match_score != null || app.skill_gaps?.length > 0) && (
            <div style={{ display:"flex", gap:5, marginTop:8, flexWrap:"wrap" }}>
              {app.match_score != null && (
                <span style={{ fontSize:10, fontWeight:700, color:"#6366f1", background:"#eef2ff",
                  padding:"2px 6px", borderRadius:5 }}>{app.match_score}% match</span>
              )}
              {app.skill_gaps?.length > 0 && (
                <span style={{ fontSize:10, color:"#ef4444", background:"#fef2f2",
                  padding:"2px 6px", borderRadius:5, fontWeight:600 }}>{app.skill_gaps.length} gaps</span>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanPage() {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["apps"], queryFn: () => appAPI.list().then(r => r.data),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => appAPI.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries(["apps"]); qc.invalidateQueries(["stats"]); },
    onError: () => toast.error("Status update failed"),
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    const app = apps.find(a => a.id === result.draggableId);
    if (!app || app.status === newStatus) return;
    statusMut.mutate({ id: result.draggableId, status: newStatus });
  };

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = apps.filter(a => a.status === col.id);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#0f172a" }}>Applications</h1>
          <p style={{ margin:"3px 0 0", color:"#64748b", fontSize:13 }}>{apps.length} total · drag cards to update stage</p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"0.6rem 1.1rem",
            background:"#6366f1", color:"#fff", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:13 }}>
          <Plus size={15}/> Add
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign:"center", padding:"3rem", color:"#94a3b8" }}>Loading…</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:"1rem", alignItems:"flex-start" }}>
            {COLUMNS.map(col => (
              <div key={col.id} style={{ minWidth:210, flex:"0 0 210px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8, padding:"0 2px" }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:col.color }} />
                  <span style={{ fontSize:12, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:0.4 }}>{col.label}</span>
                  <span style={{ marginLeft:"auto", fontSize:11, color:"#94a3b8", background:"#f1f5f9",
                    padding:"1px 7px", borderRadius:10, fontWeight:600 }}>{grouped[col.id].length}</span>
                </div>
                <Droppable droppableId={col.id}>
                  {(prov, snap) => (
                    <div ref={prov.innerRef} {...prov.droppableProps}
                      style={{ minHeight:120, borderRadius:10, padding:7, transition:"all 0.15s",
                        background: snap.isDraggingOver ? "#eff6ff" : "#f8fafc",
                        border: `1.5px solid ${snap.isDraggingOver ? "#bfdbfe" : "#e2e8f0"}` }}>
                      {grouped[col.id].map((app, i) => <AppCard key={app.id} app={app} index={i} />)}
                      {prov.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  );
}
