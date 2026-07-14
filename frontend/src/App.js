// import React, { createContext, useContext, useState } from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "react-hot-toast";
// import { useQueryClient } from "@tanstack/react-query";
// import { lightTheme, darkTheme } from "./theme";
// import { Sun, Moon } from "lucide-react";

// import LoginPage from "./pages/LoginPage";
// import RegisterPage from "./pages/RegisterPage";
// import DashboardPage from "./pages/DashboardPage";
// import KanbanPage from "./pages/KanbanPage";
// import ResumePage from "./pages/ResumePage";
// import SkillsPage from "./pages/SkillsPage";
// import AppDetailPage from "./pages/AppDetailPage";
// import Layout from "./components/Layout";

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: 1,
//       staleTime: 0,
//       refetchOnMount: true,
//       refetchOnWindowFocus: true,
//       refetchOnReconnect: true,
//     },
//   },
// });

// export const AuthContext = createContext(null);
// export const useAuth = () => useContext(AuthContext);

// function AuthProvider({ children }) {
//   const qc = useQueryClient();

//   const [user, setUser] = useState(() => {
//     try {
//       return JSON.parse(localStorage.getItem("jat_user"));
//     } catch {
//       return null;
//     }
//   });

//   const [darkMode, setDarkMode, sideBarDarkMode, setSideBarDarkMode] = useState(() => {
//     return localStorage.getItem("jat_dark_mode") === "true";
//   });

//   const toggleDarkMode = () => {
//     setDarkMode((prev) => {
//       localStorage.setItem("jat_dark_mode", !prev);
//       return !prev;
//     });
//   };

//   const theme = darkMode ? darkTheme : lightTheme;

//   const siderBarTheme = darkMode ? lightTheme : darkTheme;

//   // const login = (userData, token) => {
//   //   qc.clear();
//   //   localStorage.setItem("jat_token", token);
//   //   localStorage.setItem("jat_user", JSON.stringify(userData));
//   //   setUser(userData);
//   // };

//   const login = (userData, token) => {
//     qc.clear();

//     localStorage.clear();

//     sessionStorage.clear();

//     localStorage.setItem("jat_token", token);
//     localStorage.setItem("jat_user", JSON.stringify(userData));

//     setUser(userData);

//     window.location.reload();
//   };

//   // const logout = () => {
//   //   qc.clear();
//   //   localStorage.removeItem("jat_token");
//   //   localStorage.removeItem("jat_user");
//   //   setUser(null);
//   // };

//   const logout = () => {
//     qc.clear();

//     localStorage.clear();

//     sessionStorage.clear();

//     setUser(null);

//     window.location.reload();
//   };

//   return (
//     <AuthContext.Provider
//       value={{ user, login, logout, darkMode, toggleDarkMode, theme, siderBarTheme }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// function PrivateRoute({ children }) {
//   const { user } = useAuth();
//   return user ? children : <Navigate to="/login" replace />;
// }

// function AppContent() {
//   const { darkMode, toggleDarkMode, theme } = useAuth();

//   return (
//     <BrowserRouter>
//       <div
//         style={{
//           background: theme.bg,
//           minHeight: "100vh",
//           color: theme.text,
//           transition: "all 0.2s ease",
//         }}
//       >
//         {/* Dark mode button */}
//         {/* <div
//           style={{
//             position: "fixed",
//             top: 16,
//             right: 16,
//             zIndex: 999,
//           }}
//         >
//           <button
//             onClick={toggleDarkMode}
//             style={{
//               width: 44,
//               height: 44,
//               borderRadius: 12,
//               border: `1px solid ${theme.border}`,
//               background: theme.card,
//               color: theme.text,
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//               cursor: "pointer",
//               boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
//             }}
//           >
//             {darkMode ? <Sun size={18} /> : <Moon size={18} />}
//           </button>
//         </div> */}

//         <Toaster position="top-right" />

//         <Routes>
//           <Route path="/login" element={<LoginPage />} />
//           <Route path="/register" element={<RegisterPage />} />

//           <Route
//             path="/"
//             element={
//               <PrivateRoute>
//                 <Layout />
//               </PrivateRoute>
//             }
//           >
//             <Route index element={<DashboardPage />} />
//             <Route path="kanban" element={<KanbanPage />} />
//             <Route path="resumes" element={<ResumePage />} />
//             <Route path="skills" element={<SkillsPage />} />
//             <Route path="apps/:id" element={<AppDetailPage />} />
//           </Route>
//         </Routes>
//       </div>
//     </BrowserRouter>
//   );
// }

// export default function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <AuthProvider>
//         <AppContent />
//       </AuthProvider>
//     </QueryClientProvider>
//   );
// }




import React, { createContext, useContext, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import { lightTheme, darkTheme } from "./theme";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import KanbanPage from "./pages/KanbanPage";
import ResumePage from "./pages/ResumePage";
import SkillsPage from "./pages/SkillsPage";
import AppDetailPage from "./pages/AppDetailPage";
import Layout from "./components/Layout";

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: 1,
//       staleTime: 0,
//       refetchOnMount: true,
//       refetchOnWindowFocus: true,
//       refetchOnReconnect: true,
//     },
//   },
// });


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnMount: true,

      // IMPORTANT:
      // Opening Preview should not automatically
      // refetch the resume list.
      refetchOnWindowFocus: false,

      refetchOnReconnect: true,
    },
  },
});

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const qc = useQueryClient();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("jat_user"));
    } catch {
      return null;
    }
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("jat_dark_mode") === "true";
  });

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const nextMode = !prev;

      localStorage.setItem(
        "jat_dark_mode",
        String(nextMode)
      );

      return nextMode;
    });
  };

  const theme = darkMode ? darkTheme : lightTheme;

  const siderBarTheme = darkMode ? lightTheme : darkTheme;

  const login = (userData, token) => {
    qc.clear();

    /*
      Do NOT use localStorage.clear() here.

      localStorage.clear() deletes jat_dark_mode,
      so the user's theme preference gets removed.
    */

    localStorage.removeItem("jat_token");
    localStorage.removeItem("jat_user");

    sessionStorage.clear();

    localStorage.setItem("jat_token", token);

    localStorage.setItem(
      "jat_user",
      JSON.stringify(userData)
    );

    setUser(userData);
  };

  const logout = () => {
    qc.clear();

    /*
      Keep jat_dark_mode when logging out.
    */

    localStorage.removeItem("jat_token");
    localStorage.removeItem("jat_user");

    sessionStorage.clear();

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,

        login,

        logout,

        darkMode,

        toggleDarkMode,

        theme,
        siderBarTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function PrivateRoute({ children }) {
  const { user } = useAuth();

  return user ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
}

function AppContent() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />

      <Routes>
        {/* PUBLIC ROUTES */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        {/* PRIVATE APPLICATION ROUTES */}

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route
            index
            element={<DashboardPage />}
          />

          <Route
            path="kanban"
            element={<KanbanPage />}
          />

          <Route
            path="resumes"
            element={<ResumePage />}
          />

          <Route
            path="skills"
            element={<SkillsPage />}
          />

          <Route
            path="apps/:id"
            element={<AppDetailPage />}
          />
        </Route>

        {/* UNKNOWN ROUTES */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}