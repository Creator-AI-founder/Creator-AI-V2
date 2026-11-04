import React, { useState } from "react";
import { CreationSheet } from "../components/UI";
import { apiRequest, isLocalEngine } from "../services/cloudApi";

export default function CreatePage({ onNavigate, onProjectCreated }) {
  const [sheet, setSheet] = useState({ prompt: "", aspectRatio: "9:16", style: "bold" });
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const handleCreate = async () => {
    setIsLoading(true); setNotice("");
    try {
      const createRes = await apiRequest("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sheet.prompt.slice(0, 30) || "New Video Creation",
          mode: "create", aspectRatio: sheet.aspectRatio, style: sheet.style, prompt: sheet.prompt
        })
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData?.error?.message || createData?.error || "Project creation failed.");
      const project = createData.project;
      if (isLocalEngine) {
        const analysis = await apiRequest(`/projects/${project.id}/analyze`, { method: "POST" });
        if (!analysis.ok) throw new Error("Project saved, but local analysis failed.");
      } else {
        setNotice("Project saved to your account. AI analysis and rendering remain on your local engine.");
      }
      if (onProjectCreated) await onProjectCreated();
      onNavigate(`/projects/${project.id}`);
    } catch (err) { alert("Creation failed: " + err.message); }
    finally { setIsLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px 0" }}>Create Video Concept</h2>
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: "0.85rem" }}>Turn ideas into full edit plans with hook, pacing, and visual cues.</p>
      </div>
      {notice && <p style={{ color: "var(--text-2)", fontSize: 13 }}>{notice}</p>}
      <CreationSheet value={sheet} onChange={setSheet} onSubmit={handleCreate} isLoading={isLoading} />
    </div>
  );
}
