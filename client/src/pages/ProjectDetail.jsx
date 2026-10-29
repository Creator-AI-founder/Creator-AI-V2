import React, { useState, useEffect } from "react";
import { VideoPreview, EditPlan, StatusPill, Button, VideoUploader } from "../components/UI";

export default function ProjectDetail({ projectId, onNavigate, onProjectUpdated }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [rendering, setRendering] = useState(false);

  const loadProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (res.ok) {
        setProject(data.project);
      } else {
        alert("Project not found");
        onNavigate("/projects");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) loadProject();
  }, [projectId]);

  const handleReanalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/analyze`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setProject(data.project);
        if (onProjectUpdated) onProjectUpdated();
      }
    } catch (err) {
      alert("Analysis failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRender = async () => {
    setRendering(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/render`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setProject(data.project);
        if (onProjectUpdated) onProjectUpdated();
      } else {
        alert("Render failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Render request failed: " + err.message);
    } finally {
      setRendering(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (onProjectUpdated) onProjectUpdated();
      onNavigate("/projects");
    } catch (err) {
      alert("Delete failed");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-2)" }}>
        Loading project details...
      </div>
    );
  }

  if (!project) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <Button size="sm" variant="ghost" onClick={() => onNavigate("/projects")}>
            ← Back
          </Button>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "8px 0 4px 0" }}>
            {project.title}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <StatusPill status={project.status} />
            <span style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>
              {project.aspectRatio} • {project.mode.toUpperCase()}
            </span>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={handleDelete} style={{ color: "var(--danger)" }}>
          Delete
        </Button>
      </div>

      {/* Video Preview Section */}
      <VideoPreview
        src={
          project.renderedVideo?.url ||
          project.sourceVideo?.url ||
          null
        }
      />

      {/* Actions Bar */}
      <div style={{ display: "flex", gap: "10px" }}>
        <Button
          fullWidth
          variant="secondary"
          onClick={handleReanalyze}
          disabled={analyzing}
        >
          {analyzing ? "Analyzing..." : "🔄 Re-Analyze AI"}
        </Button>
        <Button
          fullWidth
          variant="primary"
          onClick={handleRender}
          disabled={rendering}
        >
          {rendering ? "Rendering..." : "⚡ Render & Export"}
        </Button>
      </div>

      {/* AI Insights & Blueprint */}
      {project.analysis?.summary && (
        <div
          style={{
            padding: "14px 16px",
            background: "var(--bg-1)",
            border: "1px solid var(--line-0)",
            borderRadius: "var(--r-md)",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: "4px" }}>
            AI Summary
          </div>
          <p style={{ margin: 0, color: "var(--text-1)" }}>{project.analysis.summary}</p>
        </div>
      )}

      <EditPlan blueprint={project.blueprint || project.analysis?.blueprint} />
    </div>
  );
}
