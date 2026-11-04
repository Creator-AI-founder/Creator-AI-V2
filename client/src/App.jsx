import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import { Layout } from "./components/UI";
import Home from "./pages/Home";
import EditPage from "./pages/EditPage";
import CreatePage from "./pages/CreatePage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetail from "./pages/ProjectDetail";
import SettingsPage from "./pages/SettingsPage";
import AuthGate from "./components/AuthGate";
import { apiRequest, currentUser, getSession, normalizeProject, signOut } from "./services/cloudApi";

import "./styles/global.css";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      const res = await apiRequest("/projects");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || data?.error || "Could not load projects.");
      setProjects((data.projects || []).map(normalizeProject));
      setLoadError("");
    } catch (err) {
      setLoadError(err.message || "Could not load projects.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = getSession();
      if (!stored?.access_token) { if (active) setAuthLoading(false); return; }
      const profile = await currentUser(stored).catch(() => null);
      if (active && profile) {
        setSession(stored); setUser(profile);
      }
      if (active) setAuthLoading(false);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (session && user) fetchProjects();
  }, [session, user, fetchProjects]);

  async function handleAuthenticated(nextSession) {
    setSession(nextSession);
    const profile = await currentUser(nextSession);
    setUser(profile);
  }

  async function handleSignOut() {
    await signOut();
    setSession(null); setUser(null); setProjects([]);
    navigate("/");
  }

  if (authLoading) return <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0a0a0f", color: "#aaa" }}>Loading your studio…</div>;
  if (!session || !user) return <AuthGate onAuthenticated={handleAuthenticated} />;

  const isProjectDetail = location.pathname.startsWith("/projects/") && location.pathname !== "/projects";
  const currentProjectId = isProjectDetail ? location.pathname.split("/")[2] : null;

  return (
    <Layout currentPath={location.pathname} onNavigate={(path) => navigate(path)}>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--text-2)" }}>{user.email}</span>
        <button onClick={handleSignOut} style={{ border: "1px solid var(--line-1)", background: "transparent", color: "var(--text-1)", borderRadius: 8, padding: "7px 11px", cursor: "pointer" }}>Sign out</button>
      </div>
      {loadError && <div role="alert" style={{ padding: 10, marginBottom: 12, borderRadius: 8, background: "rgba(255,120,120,.1)", color: "#ff9999", fontSize: 13 }}>{loadError}</div>}
      <Routes>
        <Route path="/" element={<Home onNavigate={(p) => navigate(p)} projects={projects} />} />
        <Route path="/edit" element={<EditPage onNavigate={(p) => navigate(p)} onProjectCreated={fetchProjects} />} />
        <Route path="/create" element={<CreatePage onNavigate={(p) => navigate(p)} onProjectCreated={fetchProjects} />} />
        <Route path="/projects" element={<ProjectsPage projects={projects} onNavigate={(p) => navigate(p)} />} />
        <Route path="/projects/:id" element={<ProjectDetail projectId={currentProjectId} onNavigate={(p) => navigate(p)} onProjectUpdated={fetchProjects} />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}
