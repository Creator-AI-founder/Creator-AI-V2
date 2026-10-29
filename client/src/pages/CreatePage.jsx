import React, { useState } from "react";
import { CreationSheet } from "../components/UI";

export default function CreatePage({ onNavigate, onProjectCreated }) {
  const [sheet, setSheet] = useState({ prompt: "", aspectRatio: "9:16", style: "bold" });
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      // Create project
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sheet.prompt.slice(0, 30) || "New Video Creation",
          mode: "create",
          aspectRatio: sheet.aspectRatio,
          style: sheet.style,
          prompt: sheet.prompt,
        }),
      });
      const { project } = await createRes.json();

      // Trigger AI analysis / script & blueprint generation
      await fetch(`/api/projects/${project.id}/analyze`, {
        method: "POST",
      });

      if (onProjectCreated) onProjectCreated();
      onNavigate(`/projects/${project.id}`);
    } catch (err) {
      alert("Creation failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px 0" }}>
          Create Video Concept
        </h2>
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: "0.85rem" }}>
          Turn ideas into full edit plans with hook, pacing, and visual cues.
        </p>
      </div>

      <CreationSheet
        value={sheet}
        onChange={setSheet}
        onSubmit={handleCreate}
        isLoading={isLoading}
      />
    </div>
  );
}
