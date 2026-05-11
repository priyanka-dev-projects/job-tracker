import React, { createContext, useContext, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

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
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
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

  // const login = (userData, token) => {
  //   qc.clear();
  //   localStorage.setItem("jat_token", token);
  //   localStorage.setItem("jat_user", JSON.stringify(userData));
  //   setUser(userData);
  // };

  const login = (userData, token) => {
    qc.clear();

    localStorage.clear();

    sessionStorage.clear();

    localStorage.setItem("jat_token", token);
    localStorage.setItem("jat_user", JSON.stringify(userData));

    setUser(userData);

    window.location.reload();
  };

  // const logout = () => {
  //   qc.clear();
  //   localStorage.removeItem("jat_token");
  //   localStorage.removeItem("jat_user");
  //   setUser(null);
  // };

  const logout = () => {
    qc.clear();

    localStorage.clear();

    sessionStorage.clear();

    setUser(null);

    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter key={localStorage.getItem("jat_token")}>
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
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
