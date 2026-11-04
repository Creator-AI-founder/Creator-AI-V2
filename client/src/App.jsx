import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { Layout } from "./components/UI";
import { apiFetch } from "./lib/api.js";
import { useAuth } from "./auth/AuthContext.jsx";

import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home";
import EditPage from "./pages/EditPage";
import CreatePage from "./pages/CreatePage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetail from "./pages/ProjectDetail";
import SettingsPage from "./pages/SettingsPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

import "./styles/global.css";

function LoadingScreen() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-heading">
          <p className="auth-eyebrow">CREATOR AI</p>
          <h1>Loading...</h1>
          <p>Restoring your Creator AI session.</p>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    session,
    user,
    loading,
    isAuthenticated,
    signOut,
  } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      setProjects([]);
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const isPrivacy = location.pathname === "/privacy";
  const isTerms = location.pathname === "/terms";
  const isPublicLegalPage = isPrivacy || isTerms;

  const fetchProjects = async () => {
    if (!session?.access_token) {
      setProjects([]);
      return;
    }

    try {
      const res = await apiFetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.status === 401) {
        setProjects([]);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load projects");
      }

      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch (err) {
      console.warn(
        "Failed to connect to Creator AI backend API:",
        err.message
      );
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    } else {
      setProjects([]);
    }
  }, [isAuthenticated, session?.access_token]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (isPublicLegalPage) {
    return (
      <Routes>
        <Route
          path="/privacy"
          element={<PrivacyPage onNavigate={(path) => navigate(path)} />}
        />

        <Route
          path="/terms"
          element={<TermsPage onNavigate={(path) => navigate(path)} />}
        />
      </Routes>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  const isProjectDetail =
    location.pathname.startsWith("/projects/") &&
    location.pathname !== "/projects";

  const currentProjectId = isProjectDetail
    ? location.pathname.split("/")[2]
    : null;

  return (
    <Layout
      currentPath={location.pathname}
      onNavigate={(path) => navigate(path)}
      topActions={
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Signing out..." : "Log out"}
        </button>
      }
    >
      <Routes>
        <Route
          path="/"
          element={
            <Home
              onNavigate={(path) => navigate(path)}
              projects={projects}
            />
          }
        />

        <Route
          path="/edit"
          element={
            <EditPage
              onNavigate={(path) => navigate(path)}
              onProjectCreated={fetchProjects}
            />
          }
        />

        <Route
          path="/create"
          element={
            <CreatePage
              onNavigate={(path) => navigate(path)}
              onProjectCreated={fetchProjects}
            />
          }
        />

        <Route
          path="/projects"
          element={
            <ProjectsPage
              projects={projects}
              onNavigate={(path) => navigate(path)}
            />
          }
        />

        <Route
          path="/projects/:id"
          element={
            <ProjectDetail
              projectId={currentProjectId}
              onNavigate={(path) => navigate(path)}
              onProjectUpdated={fetchProjects}
            />
          }
        />

        <Route
          path="/settings"
          element={<SettingsPage />}
        />

        <Route
          path="/privacy"
          element={<Navigate to="/privacy" replace />}
        />

        <Route
          path="/terms"
          element={<Navigate to="/terms" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Layout>
  );
}
