import React, { createContext, useContext, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnMount: true,

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

      localStorage.setItem("jat_dark_mode", String(nextMode));

      return nextMode;
    });
  };

  const theme = darkMode ? darkTheme : lightTheme;

  const siderBarTheme = darkMode ? lightTheme : darkTheme;

  const login = (userData, token) => {
    qc.clear();

    /*
      localStorage.clear() deletes jat_dark_mode,
      so the user's theme preference gets removed.
    */

    localStorage.removeItem("jat_token");
    localStorage.removeItem("jat_user");

    sessionStorage.clear();

    localStorage.setItem("jat_token", token);

    localStorage.setItem("jat_user", JSON.stringify(userData));

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

  return user ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />

          <Route path="kanban" element={<KanbanPage />} />

          <Route path="resumes" element={<ResumePage />} />

          <Route path="skills" element={<SkillsPage />} />

          <Route path="apps/:id" element={<AppDetailPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
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
