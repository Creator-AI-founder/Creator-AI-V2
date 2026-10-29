import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import { Layout } from "./components/UI";
import Home from "./pages/Home";
import EditPage from "./pages/EditPage";
import CreatePage from "./pages/CreatePage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetail from "./pages/ProjectDetail";
import SettingsPage from "./pages/SettingsPage";

import "./styles/global.css";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [projects, setProjects] = useState([]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.warn("Failed to connect to Creator AI backend API:", err.message);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Helper for ProjectDetail route matching (/projects/:id)
  const isProjectDetail = location.pathname.startsWith("/projects/") && location.pathname !== "/projects";
  const currentProjectId = isProjectDetail ? location.pathname.split("/")[2] : null;

  return (
    <Layout currentPath={location.pathname} onNavigate={(path) => navigate(path)}>
      <Routes>
        <Route
          path="/"
          element={<Home onNavigate={(p) => navigate(p)} projects={projects} />}
        />
        <Route
          path="/edit"
          element={
            <EditPage
              onNavigate={(p) => navigate(p)}
              onProjectCreated={fetchProjects}
            />
          }
        />
        <Route
          path="/create"
          element={
            <CreatePage
              onNavigate={(p) => navigate(p)}
              onProjectCreated={fetchProjects}
            />
          }
        />
        <Route
          path="/projects"
          element={<ProjectsPage projects={projects} onNavigate={(p) => navigate(p)} />}
        />
        <Route
          path="/projects/:id"
          element={
            <ProjectDetail
              projectId={currentProjectId}
              onNavigate={(p) => navigate(p)}
              onProjectUpdated={fetchProjects}
            />
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}
