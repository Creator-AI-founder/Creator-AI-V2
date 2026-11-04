import React, { useState, useEffect } from "react";
import { VideoPreview, EditPlan, StatusPill, Button } from "../components/UI";
import { apiRequest, isLocalEngine, normalizeProject } from "../services/cloudApi";

export default function ProjectDetail({ projectId, onNavigate, onProjectUpdated }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [rendering, setRendering] = useState(false);

  const loadProject = async () => {
    try {
      const res = await apiRequest(`/projects/${projectId}`);
      const data = await res.json();
      if (res.ok) setProject(normalizeProject(data.project));
      else { alert(data?.error?.message || "Project not found"); onNavigate("/projects"); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (projectId) loadProject(); }, [projectId]);

  const handleReanalyze = async () => {
    if (!isLocalEngine) return;
    setAnalyzing(true);
    try {
      const res = await apiRequest(`/projects/${projectId}/analyze`, { method: "POST" });
      const data = await res.json();
      if (res.ok) { setProject(normalizeProject(data.project)); if (onProjectUpdated) onProjectUpdated(); }
      else alert(data?.error?.message || data.error || "Analysis unavailable.");
    } catch (err) { alert("Analysis failed: " + err.message); }
    finally { setAnalyzing(false); }
  };

  const handleRender = async () => {
    if (!isLocalEngine) return;
    setRendering(true);
    try {
      const res = await apiRequest(`/projects/${projectId}/render`, { method: "POST" });
      const data = await res.json();
      if (res.ok) { setProject(normalizeProject(data.project)); if (onProjectUpdated) onProjectUpdated(); }
      else alert("Render failed: " + (data.message || data?.error?.message || "Unknown error"));
    } catch (err) { alert("Render request failed: " + err.message); }
    finally { setRendering(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await apiRequest(`/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      if (onProjectUpdated) await onProjectUpdated();
      onNavigate("/projects");
    } catch (err) { alert("Delete failed: " + err.message); }
  };

  if (loading) return <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-2)" }}>Loading project details...</div>;
  if (!project) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <Button size="sm" variant="ghost" onClick={() => onNavigate("/projects")}>← Back</Button>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "8px 0 4px 0" }}>{project.title}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <StatusPill status={project.status} />
            <span style={{ fontSize: "0.78rem", color: "var(--text-2)" }}>{project.aspectRatio} • {project.mode.toUpperCase()}</span>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={handleDelete}>Delete</Button>
      </div>
      <VideoPreview src={project.renderedVideo?.url || project.sourceVideo?.url || null} />
      <div style={{ display: "flex", gap: "10px" }}>
        <Button fullWidth variant="secondary" onClick={handleReanalyze} disabled={analyzing || !isLocalEngine}>
          {analyzing ? "Analyzing..." : isLocalEngine ? "🔄 Re-Analyze AI" : "AI analysis: local engine only"}
        </Button>
        <Button fullWidth variant="primary" onClick={handleRender} disabled={rendering || !isLocalEngine}>
          {rendering ? "Rendering..." : isLocalEngine ? "⚡ Render & Export" : "Rendering: local engine only"}
        </Button>
      </div>
      {!isLocalEngine && <p style={{ color: "var(--text-2)", fontSize: 12 }}>Your cloud account stores projects and uploads. Video analysis and rendering remain on your Termux engine; the engine has not been changed.</p>}
      {project.analysis?.summary && <div style={{ padding: "14px 16px", background: "var(--bg-1)", border: "1px solid var(--line-0)", borderRadius: "var(--r-md)", fontSize: "0.85rem" }}>
        <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: "4px" }}>AI Summary</div>
        <p style={{ margin: 0, color: "var(--text-1)" }}>{project.analysis.summary}</p>
      </div>}
      <EditPlan blueprint={project.blueprint || project.analysis?.blueprint} />
    </div>
  );
}
