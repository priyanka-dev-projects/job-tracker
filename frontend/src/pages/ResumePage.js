// import React, { useState, useCallback } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useDropzone } from "react-dropzone";
// import { resumeAPI } from "../api/client";
// import toast from "react-hot-toast";
// import { useAuth } from "../App";
// import {
//   Upload,
//   FileText,
//   Trash2,
//   ChevronDown,
//   ChevronUp,
//   Clock,
// } from "lucide-react";
// import { formatDistanceToNow } from "date-fns";
// import Loader from "../components/Loader";

// function Badge({ text, color = "#4f46e5", bg = "#eef2ff" }) {
//   return (
//     <span
//       style={{
//         fontSize: 11,
//         padding: "3px 8px",
//         borderRadius: 20,
//         background: bg,
//         color,
//         fontWeight: 600,
//       }}
//     >
//       {text}
//     </span>
//   );
// }

// function ResumeCard({ resume, onDelete, theme }) {
//   const [open, setOpen] = useState(false);
//   const p = resume.parsed;

//   return (
//     <div
//       style={{
//         background: theme.card,
//         border: `1px solid ${theme.border}`,
//         borderRadius: 14,
//         marginBottom: 10,
//         overflow: "hidden",
//         boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
//       }}
//     >
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: 12,
//           padding: "1.1rem 1.25rem",
//         }}
//       >
//         <div
//           style={{
//             width: 40,
//             height: 40,
//             borderRadius: 10,
//             background: "#eef2ff",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             flexShrink: 0,
//           }}
//         >
//           <FileText size={18} color="#6366f1" />
//         </div>
//         <div style={{ flex: 1, minWidth: 0 }}>
//           <div
//             style={{
//               fontWeight: 700,
//               fontSize: 14,
//               color: theme.text,
//               overflow: "hidden",
//               textOverflow: "ellipsis",
//               whiteSpace: "nowrap",
//             }}
//           >
//             {resume.original_filename}
//           </div>
//           <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>
//             Uploaded{" "}
//             {formatDistanceToNow(new Date(resume.created_at), {
//               addSuffix: true,
//             })}
//             &nbsp;·&nbsp; {p.skills?.length || 0} skills found
//           </div>
//         </div>
//         <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
//           {/* Preview */}
//           <a
//             href={resume.file_url}
//             target="_blank"
//             rel="noreferrer"
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 4,
//               background: "#eef2ff",
//               border: "1px solid #c7d2fe",
//               borderRadius: 8,
//               padding: "5px 10px",
//               fontSize: 12,
//               textDecoration: "none",
//               color: "#6366f1",
//               fontWeight: 600,
//             }}
//           >
//             Preview
//           </a>

//           {/* Download */}
//           <a
//             href={resume.file_url}
//             download
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 4,
//               background: theme.bg,
//               border: `1px solid ${theme.border}`,
//               borderRadius: 8,
//               padding: "5px 10px",
//               fontSize: 12,
//               textDecoration: "none",
//               color: theme.subtext,
//               fontWeight: 600,
//             }}
//           >
//             Download
//           </a>

//           {/* Details */}
//           <button
//             onClick={() => setOpen((o) => !o)}
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 4,
//               background: theme.bg,
//               border: `1px solid ${theme.border}`,
//               borderRadius: 8,
//               padding: "5px 10px",
//               fontSize: 12,
//               cursor: "pointer",
//               color: theme.subtext,
//               fontWeight: 500,
//             }}
//           >
//             {open ? (
//               <>
//                 <ChevronUp size={13} /> Hide
//               </>
//             ) : (
//               <>
//                 <ChevronDown size={13} /> Details
//               </>
//             )}
//           </button>

//           {/* Delete */}
//           <button
//             onClick={() => onDelete(resume.id)}
//             style={{
//               background: "#fef2f2",
//               border: "1px solid #fecaca",
//               borderRadius: 8,
//               padding: "5px 8px",
//               cursor: "pointer",
//               display: "flex",
//               alignItems: "center",
//             }}
//           >
//             <Trash2 size={13} color="#ef4444" />
//           </button>
//         </div>
//       </div>

//       {/* Skills preview always visible */}
//       {p.skills?.length > 0 && (
//         <div
//           style={{
//             display: "flex",
//             flexWrap: "wrap",
//             gap: 4,
//             padding: "0 1.25rem 0.85rem",
//           }}
//         >
//           {p.skills.slice(0, open ? 999 : 10).map((s) => (
//             <Badge key={s} text={s} />
//           ))}
//           {!open && p.skills.length > 10 && (
//             <button
//               onClick={() => setOpen(true)}
//               style={{
//                 fontSize: 11,
//                 color: "#6366f1",
//                 background: "none",
//                 border: "none",
//                 cursor: "pointer",
//                 fontWeight: 600,
//                 padding: "3px 0",
//               }}
//             >
//               +{p.skills.length - 10} more
//             </button>
//           )}
//         </div>
//       )}

//       {/* Expanded details */}
//       {open && (
//         <div
//           style={{
//             borderTop: "1px solid #f1f5f9",
//             padding: "1rem 1.25rem",
//             display: "flex",
//             flexDirection: "column",
//             gap: 14,
//           }}
//         >
//           {(p.name || p.email || p.phone) && (
//             <div>
//               <div
//                 style={{
//                   fontSize: 11,
//                   fontWeight: 700,
//                   color: "#94a3b8",
//                   textTransform: "uppercase",
//                   letterSpacing: 0.6,
//                   marginBottom: 6,
//                 }}
//               >
//                 Contact
//               </div>
//               {p.name && (
//                 <div
//                   style={{ fontSize: 13, fontWeight: 600, color: theme.text }}
//                 >
//                   {p.name}
//                 </div>
//               )}
//               {p.email && (
//                 <div style={{ fontSize: 13, color: "#6366f1" }}>{p.email}</div>
//               )}
//               {p.phone && (
//                 <div style={{ fontSize: 13, color: theme.subtext }}>
//                   {p.phone}
//                 </div>
//               )}
//             </div>
//           )}
//           {p.experience?.length > 0 && (
//             <div>
//               <div
//                 style={{
//                   fontSize: 11,
//                   fontWeight: 700,
//                   color: "#94a3b8",
//                   textTransform: "uppercase",
//                   letterSpacing: 0.6,
//                   marginBottom: 6,
//                 }}
//               >
//                 Experience
//               </div>
//               {p.experience.map((e, i) => (
//                 <div
//                   key={i}
//                   style={{
//                     fontSize: 13,
//                     padding: "4px 0",
//                     borderBottom: "1px solid #f8fafc",
//                   }}
//                 >
//                   <span style={{ fontWeight: 600, color: theme.text }}>
//                     {e.title}
//                   </span>
//                   {e.company && (
//                     <span style={{ color: theme.subtext }}> · {e.company}</span>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//           {p.education?.length > 0 && (
//             <div>
//               <div
//                 style={{
//                   fontSize: 11,
//                   fontWeight: 700,
//                   color: "#94a3b8",
//                   textTransform: "uppercase",
//                   letterSpacing: 0.6,
//                   marginBottom: 6,
//                 }}
//               >
//                 Education
//               </div>
//               {p.education.map((e, i) => (
//                 <div key={i} style={{ fontSize: 13, color: "#374151" }}>
//                   {e.degree}{" "}
//                   {e.year && (
//                     <span style={{ color: "#94a3b8" }}>({e.year})</span>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// export default function ResumePage() {
//   const qc = useQueryClient();
//   const { user, theme } = useAuth();
//   const { data: resumes = [], isLoading } = useQuery({
//     queryKey: ["resumes", user?.id],
//     queryFn: () =>
//       resumeAPI.list().then((r) =>
//         r.data.map((item) => ({
//           ...item,
//           id: item._id || item.id,
//         })),
//       ),
//     enabled: !!user?.id,
//   });

//   const uploadMut = useMutation({
//     mutationFn: (file) => resumeAPI.upload(file),
//     onSuccess: () => {
//       qc.invalidateQueries(["resumes"]);
//       toast.success("Resume parsed successfully!");
//     },
//     onError: (err) =>
//       toast.error(err.response?.data?.detail || "Upload failed"),
//   });

//   const deleteMut = useMutation({
//     mutationFn: (id) => resumeAPI.delete(id),

//     onSuccess: async (_, id) => {
//       qc.setQueryData(["resumes", user?.id], (old = []) =>
//         old.filter((r) => r.id !== id),
//       );

//       await qc.invalidateQueries({
//         queryKey: ["resumes", user?.id],
//       });

//       toast.success("Resume deleted");
//     },

//     onError: () => {
//       toast.error("Delete failed");
//     },
//   });

//   // const deleteMut = useMutation({
//   //   mutationFn: (id) => resumeAPI.delete(id),
//   //   onSuccess: () => {
//   //     qc.invalidateQueries(["resumes"]);
//   //     toast.success("Resume deleted");
//   //   },
//   //   onError: () => toast.error("Delete failed"),
//   // });

//   //   const deleteMut = useMutation({
//   //   mutationFn: (id) => resumeAPI.delete(id),

//   //   onMutate: async (id) => {
//   //     await qc.cancelQueries(["resumes"]);

//   //     const previous = qc.getQueryData(["resumes"]);

//   //     qc.setQueryData(["resumes"], (old = []) =>
//   //       old.filter((r) => r.id !== id)
//   //     );

//   //     return { previous };
//   //   },

//   //   onError: (err, id, context) => {
//   //     qc.setQueryData(["resumes"], context.previous);
//   //     toast.error("Delete failed");
//   //   },

//   //   onSuccess: () => {
//   //     toast.success("Resume deleted");
//   //   },

//   //   // onSettled: () => {
//   //   //   qc.invalidateQueries(["resumes"]);
//   //   // },
//   // });

//   const onDrop = useCallback((accepted) => {
//     if (accepted[0]) uploadMut.mutate(accepted[0]);
//   }, []);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: {
//       "application/pdf": [".pdf"],
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
//         [".docx"],
//     },
//     maxFiles: 1,
//     multiple: false,
//   });

//   const handleDelete = (id) => {
//     console.log("HANDLE DELETE → id:", id);
//     if (window.confirm("Delete this resume?")) deleteMut.mutate(id);
//   };

//   return (
//     <div>
//       <div style={{ marginBottom: "1.5rem" }}>
//         <h1
//           style={{
//             margin: 0,
//             fontSize: 22,
//             fontWeight: 800,
//             color: theme.text,
//           }}
//         >
//           My Resumes
//         </h1>
//         <p style={{ margin: "3px 0 0", color: theme.subtext, fontSize: 13 }}>
//           Upload PDF or DOCX — skills extracted automatically
//         </p>
//       </div>

//       {/* Drop zone */}
//       <div
//         {...getRootProps()}
//         style={{
//           // border: `2px dashed ${isDragActive ? "#6366f1" : "#cbd5e1"}`,
//           border: `2px dashed ${theme.border}`,
//           borderRadius: 16,
//           padding: "2.5rem 1rem",
//           textAlign: "center",
//           cursor: "pointer",
//           background: isDragActive ? "#eef2ff" : "#f8fafc",
//           marginBottom: "1.5rem",
//           transition: "all 0.15s",
//         }}
//       >
//         <input {...getInputProps()} />
//         {uploadMut.isPending ? (
//           <>
//             <Clock size={32} color="#6366f1" style={{ marginBottom: 8 }} />
//             <p
//               style={{
//                 margin: 0,
//                 fontWeight: 700,
//                 color: "#6366f1",
//                 fontSize: 15,
//               }}
//             >
//               Parsing resume…
//             </p>
//             <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
//               Extracting skills, experience, education
//             </p>
//           </>
//         ) : (
//           <>
//             <Upload
//               size={32}
//               color={isDragActive ? "#6366f1" : "#94a3b8"}
//               style={{ marginBottom: 8 }}
//             />
//             <p
//               style={{
//                 margin: 0,
//                 fontWeight: 700,
//                 color: "#374151",
//                 fontSize: 15,
//               }}
//             >
//               {isDragActive ? "Drop it here!" : "Drag & drop your resume"}
//             </p>
//             <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
//               or click to browse · PDF or DOCX only
//             </p>
//           </>
//         )}
//       </div>

//       {/* {isLoading ? (
//         <Loader text="Loading applications..." />
//       ) : resumes.length === 0 ? (
//         <div
//           style={{
//             textAlign: "center",
//             padding: "2rem",
//             color: "#94a3b8",
//             fontSize: 14,
//           }}
//         >
//           No resumes yet. Drop one above to get started.
//         </div>
//       ) : (
//         resumes.map((r) => (
//         <ResumeCard key={r.id} resume={r} onDelete={handleDelete} theme={theme} />
//         ))
//       )} */}

//       {isLoading ? (
//         <Loader text="Loading resumes..." />
//       ) : resumes.length === 0 ? (
//         <div
//           style={{
//             textAlign: "center",
//             padding: "2rem",
//             color: "#94a3b8",
//             fontSize: 14,
//           }}
//         >
//           No resumes yet. Drop one above to get started.
//         </div>
//       ) : (
//         <div
//           style={{
//             background: theme.card,
//             border: `1px solid ${theme.border}`,
//             borderRadius: 14,
//             overflowX: "auto",
//           }}
//         >
//           <table
//             style={{
//               width: "100%",
//               borderCollapse: "collapse",
//               minWidth: 750,
//               fontSize: 13,
//             }}
//           >
//             <thead>
//               <tr
//                 style={{
//                   background: theme.bg,
//                 }}
//               >
//                 <th
//                   style={{
//                     padding: 14,
//                     textAlign: "left",
//                     color: theme.subtext,
//                   }}
//                 >
//                   Resume Name
//                 </th>

//                 <th
//                   style={{
//                     padding: 14,
//                     textAlign: "left",
//                     color: theme.subtext,
//                   }}
//                 >
//                   Skills Found
//                 </th>

//                 <th
//                   style={{
//                     padding: 14,
//                     textAlign: "left",
//                     color: theme.subtext,
//                   }}
//                 >
//                   Uploaded On
//                 </th>

//                 <th
//                   style={{
//                     padding: 14,
//                     textAlign: "right",
//                     color: theme.subtext,
//                   }}
//                 >
//                   Actions
//                 </th>
//               </tr>
//             </thead>

//             <tbody>
//               {resumes.map((resume) => {
//                 const skills = resume.parsed?.skills || [];

//                 return (
//                   <tr key={resume.id}>
//                     <td
//                       style={{
//                         padding: 14,
//                         borderTop: `1px solid ${theme.border}`,
//                       }}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           alignItems: "center",
//                           gap: 10,
//                         }}
//                       >
//                         <div
//                           style={{
//                             width: 36,
//                             height: 36,
//                             borderRadius: 8,
//                             background: "#eef2ff",
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             flexShrink: 0,
//                           }}
//                         >
//                           <FileText size={17} color="#6366f1" />
//                         </div>

//                         <span
//                           style={{
//                             fontWeight: 600,
//                             color: theme.text,
//                           }}
//                         >
//                           {resume.original_filename}
//                         </span>
//                       </div>
//                     </td>

//                     <td
//                       style={{
//                         padding: 14,
//                         borderTop: `1px solid ${theme.border}`,
//                       }}
//                     >
//                       <span
//                         style={{
//                           background: "#eef2ff",
//                           color: "#6366f1",
//                           padding: "5px 10px",
//                           borderRadius: 20,
//                           fontWeight: 600,
//                         }}
//                       >
//                         {skills.length} Skills
//                       </span>
//                     </td>

//                     <td
//                       style={{
//                         padding: 14,
//                         borderTop: `1px solid ${theme.border}`,
//                         color: theme.subtext,
//                         whiteSpace: "nowrap",
//                       }}
//                     >
//                       {new Date(resume.created_at).toLocaleDateString("en-IN", {
//                         timeZone: "Asia/Kolkata",
//                         day: "2-digit",
//                         month: "short",
//                         year: "numeric",
//                       })}
//                     </td>

//                     <td
//                       style={{
//                         padding: 14,
//                         borderTop: `1px solid ${theme.border}`,
//                       }}
//                     >
//                       <div
//                         style={{
//                           display: "flex",
//                           justifyContent: "flex-end",
//                           gap: 7,
//                         }}
//                       >
//                         <a
//                           href={resume.file_url}
//                           target="_blank"
//                           rel="noreferrer"
//                           style={{
//                             padding: "6px 10px",
//                             borderRadius: 7,
//                             background: "#eef2ff",
//                             color: "#6366f1",
//                             textDecoration: "none",
//                             fontWeight: 600,
//                           }}
//                         >
//                           Preview
//                         </a>

//                         <a
//                           href={resume.file_url}
//                           download
//                           style={{
//                             padding: "6px 10px",
//                             borderRadius: 7,
//                             background: theme.bg,
//                             color: theme.subtext,
//                             border: `1px solid ${theme.border}`,
//                             textDecoration: "none",
//                             fontWeight: 600,
//                           }}
//                         >
//                           Download
//                         </a>

//                         <button
//                           onClick={() => handleDelete(resume.id)}
//                           style={{
//                             padding: "6px 8px",
//                             borderRadius: 7,
//                             background: "#fef2f2",
//                             border: "1px solid #fecaca",
//                             cursor: "pointer",
//                             display: "flex",
//                             alignItems: "center",
//                           }}
//                         >
//                           <Trash2 size={14} color="#ef4444" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { FileText, Upload, Trash2, Eye, Download } from "lucide-react";

import toast from "react-hot-toast";

import { resumeAPI } from "../api/client";

import { useAuth } from "../App";

import Loader from "../components/Loader";

export default function ResumeParser() {
  const { user, theme } = useAuth();

  const queryClient = useQueryClient();

  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);

  const [previewingId, setPreviewingId] = useState(null);

  const [downloadingId, setDownloadingId] = useState(null);

  // =========================================================
  // GET RESUMES
  // =========================================================

  const {
    data: resumes = [],

    isLoading,
  } = useQuery({
    queryKey: ["resumes", user?.id],

    // queryFn: async () => {
    //   const data = await resumeAPI.list();

    //   return Array.isArray(data) ? data : [];
    // },

    queryFn: async () => {
      const response = await resumeAPI.list();

      console.log("RESUME LIST RESPONSE:", response);

      return Array.isArray(response.data) ? response.data : [];
    },

    enabled: !!user?.id,
  });

  // =========================================================
  // UPLOAD MUTATION
  // =========================================================

  // const uploadMutation = useMutation({
  //   mutationFn: (file) => resumeAPI.upload(file),

  //   onSuccess: () => {
  //     queryClient.invalidateQueries({
  //       queryKey: ["resumes"],
  //     });

  //     toast.success("Resume uploaded successfully");
  //   },

  //   onError: (error) => {
  //     console.error("UPLOAD ERROR:", error);

  //     toast.error(error.message || "Resume upload failed");
  //   },
  // });

  // const uploadMutation = useMutation({
  //   mutationFn: (file) => resumeAPI.upload(file),

  //   onSuccess: (response) => {
  //     console.log("FULL UPLOAD RESPONSE:", response);

  //     const uploadedResume = response?.data ?? response;

  //     console.log("UPLOADED RESUME:", uploadedResume);

  //     if (!uploadedResume?.id) {
  //       console.error("INVALID UPLOAD RESPONSE:", response);
  //       toast.error("Invalid response from resume server");
  //       return;
  //     }

  //     queryClient.setQueryData(["resumes", user?.id], (oldResumes = []) => {
  //       const exists = oldResumes.some(
  //         (resume) => resume.id === uploadedResume.id,
  //       );

  //       if (exists) {
  //         return oldResumes;
  //       }

  //       return [uploadedResume, ...oldResumes];
  //     });

  //     toast.success("Resume uploaded successfully");
  //   },

  //   onError: (error) => {
  //     console.error("UPLOAD ERROR:", error);
  //     toast.error(error.message || "Resume upload failed");
  //   },
  // });

  const uploadMutation = useMutation({
    mutationFn: (file) => resumeAPI.upload(file),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["resumes", user?.id],
        exact: true,
      });

      toast.success("Resume uploaded successfully");
    },

    onError: (error) => {
      console.error("UPLOAD ERROR:", error);

      toast.error(error.message || "Resume upload failed");
    },
  });

  // =========================================================
  // DELETE MUTATION
  // =========================================================

  // const deleteMutation = useMutation({
  //   mutationFn: (id) => resumeAPI.delete(id),

  //   onSuccess: () => {
  //     queryClient.invalidateQueries({
  //       queryKey: ["resumes"],
  //     });

  //     toast.success("Resume deleted");
  //   },

  //   onError: (error) => {
  //     console.error("DELETE ERROR:", error);

  //     toast.error(error.message || "Delete failed");
  //   },
  // });

  // const deleteMutation = useMutation({
  //   mutationFn: (resumeId) => resumeAPI.delete(resumeId),

  //   onSuccess: async (response, deletedResumeId) => {
  //     console.log("DELETED RESUME ID:", deletedResumeId);
  //     console.log("DELETE RESPONSE:", response);

  //     // Remove ONLY the deleted resume from the current UI.
  //     queryClient.setQueryData(["resumes", user?.id], (oldResumes = []) =>
  //       oldResumes.filter((resume) => resume.id !== deletedResumeId),
  //     );

  //     // Refetch ONLY the current user's resume list.
  //     await queryClient.invalidateQueries({
  //       queryKey: ["resumes", user?.id],
  //       exact: true,
  //     });

  //     toast.success("Resume deleted successfully");
  //   },

  //   onError: (error) => {
  //     console.error("DELETE ERROR:", error);

  //     toast.error(error.message || "Failed to delete resume");
  //   },
  // });

  const deleteMutation = useMutation({
    mutationFn: (resumeId) => resumeAPI.delete(resumeId),

    onSuccess: (response, deletedResumeId) => {
      console.log("DELETE RESPONSE:", response);
      console.log("DELETED ID:", deletedResumeId);

      queryClient.setQueryData(["resumes", user?.id], (oldResumes = []) =>
        oldResumes.filter((resume) => resume.id !== deletedResumeId),
      );

      toast.success("Resume deleted successfully");
    },

    onError: (error) => {
      console.error("DELETE ERROR:", error);

      toast.error(error.message || "Failed to delete resume");
    },
  });

  // =========================================================
  // VALIDATE + UPLOAD FILE
  // =========================================================

  const handleFile = (file) => {
    if (!file) {
      return;
    }

    const allowedExtensions = [".pdf", ".docx", ".txt"];

    const lowerFilename = file.name.toLowerCase();

    const validExtension = allowedExtensions.some((extension) =>
      lowerFilename.endsWith(extension),
    );

    if (!validExtension) {
      toast.error("Only PDF, DOCX and TXT files are supported");

      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      toast.error("Maximum file size is 10 MB");

      return;
    }

    uploadMutation.mutate(file);
  };

  // =========================================================
  // FILE INPUT
  // =========================================================

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];

    handleFile(file);

    event.target.value = "";
  };

  // =========================================================
  // DROP
  // =========================================================

  const handleDrop = (event) => {
    event.preventDefault();

    setDragging(false);

    const file = event.dataTransfer.files?.[0];

    handleFile(file);
  };

  // =========================================================
  // PREVIEW
  // =========================================================

  // const handlePreview = async (resume) => {
  //   if (!resume?.id) {
  //     toast.error("Resume ID missing");

  //     return;
  //   }

  //   const previewWindow = window.open("", "_blank");

  //   setPreviewingId(resume.id);

  //   try {
  //     const blob = await resumeAPI.preview(resume.id);

  //     const blobUrl = URL.createObjectURL(blob);

  //     if (previewWindow) {
  //       previewWindow.location.href = blobUrl;
  //     } else {
  //       window.open(blobUrl, "_blank");
  //     }

  //     setTimeout(() => {
  //       URL.revokeObjectURL(blobUrl);
  //     }, 60000);
  //   } catch (error) {
  //     console.error("PREVIEW ERROR:", error);

  //     if (previewWindow) {
  //       previewWindow.close();
  //     }

  //     toast.error(error.message || "Preview failed");
  //   } finally {
  //     setPreviewingId(null);
  //   }
  // };

  // const handlePreview = async (resume) => {
  //   if (!resume?.id) {
  //     toast.error("Resume ID missing");
  //     return;
  //   }

  //   const previewWindow = window.open("", "_blank");

  //   setPreviewingId(resume.id);

  //   try {
  //     const response = await resumeAPI.preview(resume.id);

  //     console.log("PREVIEW RESPONSE:", response);

  //     // Axios stores the Blob inside response.data
  //     const blob = response.data;

  //     if (!(blob instanceof Blob)) {
  //       console.error("INVALID PREVIEW BLOB:", blob);
  //       throw new Error("Invalid preview response");
  //     }

  //     const blobUrl = URL.createObjectURL(blob);

  //     if (previewWindow) {
  //       previewWindow.location.href = blobUrl;
  //     } else {
  //       window.open(blobUrl, "_blank");
  //     }

  //     setTimeout(() => {
  //       URL.revokeObjectURL(blobUrl);
  //     }, 60000);
  //   } catch (error) {
  //     console.error("PREVIEW ERROR:", error);

  //     if (previewWindow) {
  //       previewWindow.close();
  //     }

  //     toast.error(
  //       error.response?.data?.detail || error.message || "Preview failed",
  //     );
  //   } finally {
  //     setPreviewingId(null);
  //   }
  // };

  const handlePreview = async (resume) => {
    if (!resume?.id) {
      toast.error("Resume ID missing");
      return;
    }

    const previewWindow = window.open("", "_blank");

    setPreviewingId(resume.id);

    try {
      const response = await resumeAPI.preview(resume.id);

      const blob = response.data;

      if (!(blob instanceof Blob)) {
        throw new Error("Invalid preview response");
      }

      const blobUrl = URL.createObjectURL(blob);

      if (previewWindow) {
        previewWindow.location.href = blobUrl;
      } else {
        window.open(blobUrl, "_blank");
      }

      /*
      Do not revoke immediately.

      The new browser tab still needs the Blob URL.
    */
      setTimeout(
        () => {
          URL.revokeObjectURL(blobUrl);
        },
        5 * 60 * 1000,
      );
    } catch (error) {
      console.error("PREVIEW ERROR:", error);

      if (previewWindow) {
        previewWindow.close();
      }

      toast.error(error.message || "Preview failed");
    } finally {
      setPreviewingId(null);
    }
  };

  // =========================================================
  // DOWNLOAD
  // =========================================================

  // const handleDownload = async (resume) => {
  //   if (!resume?.id) {
  //     toast.error("Resume ID missing");

  //     return;
  //   }

  //   setDownloadingId(resume.id);

  //   try {
  //     const blob = await resumeAPI.download(resume.id);

  //     const blobUrl = URL.createObjectURL(blob);

  //     const link = document.createElement("a");

  //     link.href = blobUrl;

  //     link.download = resume.original_filename || "resume";

  //     document.body.appendChild(link);

  //     link.click();

  //     link.remove();

  //     setTimeout(() => {
  //       URL.revokeObjectURL(blobUrl);
  //     }, 1000);

  //     toast.success("Resume downloaded");
  //   } catch (error) {
  //     console.error("DOWNLOAD ERROR:", error);

  //     toast.error(error.message || "Download failed");
  //   } finally {
  //     setDownloadingId(null);
  //   }
  // };

  const handleDownload = async (resume) => {
    if (!resume?.id) {
      toast.error("Resume ID missing");
      return;
    }

    setDownloadingId(resume.id);

    try {
      const response = await resumeAPI.download(resume.id);

      console.log("DOWNLOAD RESPONSE:", response);

      // Axios stores the Blob inside response.data
      const blob = response.data;

      if (!(blob instanceof Blob)) {
        console.error("INVALID DOWNLOAD BLOB:", blob);
        throw new Error("Invalid download response");
      }

      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;

      link.download = resume.original_filename || "resume";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      toast.success("Resume downloaded");
    } catch (error) {
      console.error("DOWNLOAD ERROR:", error);

      toast.error(
        error.response?.data?.detail || error.message || "Download failed",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  // const handleDelete = (id) => {
  //   const confirmed = window.confirm("Delete this resume?");

  //   if (!confirmed) {
  //     return;
  //   }

  //   deleteMutation.mutate(id);
  // };

  const handleDelete = (resumeId) => {
    if (!resumeId) {
      toast.error("Resume ID missing");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this resume?",
    );

    if (!confirmed) {
      return;
    }

    console.log("DELETING RESUME ID:", resumeId);

    deleteMutation.mutate(resumeId);
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div>
      {/* HEADER */}

      <div
        style={{
          marginBottom: "1.5rem",
        }}
      >
        <h1
          style={{
            margin: 0,

            fontSize: 22,

            fontWeight: 800,

            color: theme.text,
          }}
        >
          Resumes
        </h1>

        <p
          style={{
            margin: "4px 0 0",

            color: theme.subtext,

            fontSize: 13,
          }}
        >
          Upload and manage your resumes
        </p>
      </div>

      {/* UPLOAD AREA */}

      <div
        onDragOver={(event) => {
          event.preventDefault();

          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: dragging
            ? "2px dashed #6366f1"
            : `2px dashed ${theme.border}`,

          borderRadius: 14,

          padding: "2.2rem",

          textAlign: "center",

          cursor: "pointer",

          background: dragging ? "#eef2ff" : theme.card,

          marginBottom: 18,

          transition: "0.2s",
        }}
      >
        <Upload size={32} color="#6366f1" />

        <div
          style={{
            marginTop: 10,

            fontWeight: 700,

            color: theme.text,
          }}
        >
          {uploadMutation.isPending
            ? "Uploading resume..."
            : "Drop your resume here or click to browse"}
        </div>

        <div
          style={{
            marginTop: 5,

            fontSize: 12,

            color: theme.subtext,
          }}
        >
          PDF, DOCX or TXT · Maximum 10 MB
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          hidden
          onChange={handleInputChange}
        />
      </div>

      {/* CONTENT */}

      {isLoading ? (
        <Loader text="Loading resumes..." />
      ) : resumes.length === 0 ? (
        <div
          style={{
            textAlign: "center",

            padding: "2rem",

            color: "#94a3b8",

            fontSize: 14,
          }}
        >
          No resumes yet. Upload one above to get started.
        </div>
      ) : (
        <div
          style={{
            background: theme.card,

            border: `1px solid ${theme.border}`,

            borderRadius: 14,

            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",

              borderCollapse: "collapse",

              minWidth: 750,

              fontSize: 13,
            }}
          >
            {/* TABLE HEADER */}

            <thead>
              <tr
                style={{
                  background: theme.bg,
                }}
              >
                <th
                  style={{
                    padding: 14,

                    textAlign: "left",

                    color: theme.subtext,
                  }}
                >
                  Resume Name
                </th>

                <th
                  style={{
                    padding: 14,

                    textAlign: "left",

                    color: theme.subtext,
                  }}
                >
                  Skills Found
                </th>

                <th
                  style={{
                    padding: 14,

                    textAlign: "left",

                    color: theme.subtext,
                  }}
                >
                  Uploaded On
                </th>

                <th
                  style={{
                    padding: 14,

                    textAlign: "right",

                    color: theme.subtext,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            {/* TABLE BODY */}

            <tbody>
              {resumes.map((resume) => {
                const skills = resume.parsed?.skills || [];

                return (
                  <tr key={resume.id}>
                    {/* RESUME NAME */}

                    <td
                      style={{
                        padding: 14,

                        borderTop: `1px solid ${theme.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",

                          alignItems: "center",

                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 36,

                            height: 36,

                            borderRadius: 8,

                            background: "#eef2ff",

                            display: "flex",

                            alignItems: "center",

                            justifyContent: "center",

                            flexShrink: 0,
                          }}
                        >
                          <FileText size={17} color="#6366f1" />
                        </div>

                        <span
                          style={{
                            fontWeight: 600,

                            color: theme.text,
                          }}
                        >
                          {resume.original_filename}
                        </span>
                      </div>
                    </td>

                    {/* SKILLS */}

                    <td
                      style={{
                        padding: 14,

                        borderTop: `1px solid ${theme.border}`,
                      }}
                    >
                      <span
                        style={{
                          background: "#eef2ff",

                          color: "#6366f1",

                          padding: "5px 10px",

                          borderRadius: 20,

                          fontWeight: 600,
                        }}
                      >
                        {skills.length} Skills
                      </span>
                    </td>

                    {/* DATE */}

                    <td
                      style={{
                        padding: 14,

                        borderTop: `1px solid ${theme.border}`,

                        color: theme.subtext,

                        whiteSpace: "nowrap",
                      }}
                    >
                      {resume.created_at
                        ? new Date(resume.created_at).toLocaleDateString(
                            "en-IN",

                            {
                              timeZone: "Asia/Kolkata",

                              day: "2-digit",

                              month: "short",

                              year: "numeric",
                            },
                          )
                        : "-"}
                    </td>

                    {/* ACTIONS */}

                    <td
                      style={{
                        padding: 14,

                        borderTop: `1px solid ${theme.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",

                          justifyContent: "flex-end",

                          gap: 7,
                        }}
                      >
                        {/* PREVIEW */}

                        <button
                          onClick={() => handlePreview(resume)}
                          disabled={previewingId === resume.id}
                          style={{
                            padding: "6px 10px",

                            borderRadius: 7,

                            background: "#eef2ff",

                            color: "#6366f1",

                            border: "none",

                            cursor: "pointer",

                            fontWeight: 600,

                            display: "flex",

                            alignItems: "center",

                            gap: 5,
                          }}
                        >
                          <Eye size={14} />

                          {previewingId === resume.id
                            ? "Opening..."
                            : "Preview"}
                        </button>

                        {/* DOWNLOAD */}

                        <button
                          onClick={() => handleDownload(resume)}
                          disabled={downloadingId === resume.id}
                          style={{
                            padding: "6px 10px",

                            borderRadius: 7,

                            background: theme.bg,

                            color: theme.subtext,

                            border: `1px solid ${theme.border}`,

                            cursor: "pointer",

                            fontWeight: 600,

                            display: "flex",

                            alignItems: "center",

                            gap: 5,
                          }}
                        >
                          <Download size={14} />

                          {downloadingId === resume.id
                            ? "Downloading..."
                            : "Download"}
                        </button>

                        {/* DELETE */}

                        <button
                          onClick={() => handleDelete(resume.id)}
                          disabled={
                            deleteMutation.isPending &&
                            deleteMutation.variables === resume.id
                          }
                          style={{
                            padding: "6px 8px",

                            borderRadius: 7,

                            background: "#fef2f2",

                            border: "1px solid #fecaca",

                            cursor: "pointer",

                            display: "flex",

                            alignItems: "center",
                          }}
                        >
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
