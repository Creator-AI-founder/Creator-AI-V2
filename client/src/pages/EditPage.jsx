import React, { useState } from "react";
import { VideoUploader, Button, CreationSheet } from "../components/UI";

export default function EditPage({ onNavigate, onProjectCreated }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sheet, setSheet] = useState({ prompt: "", aspectRatio: "9:16", style: "clean" });

  const handleUploadAndAnalyze = async (selectedFile) => {
    setIsUploading(true);
    try {
      // Create project
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedFile.name.replace(/\.[^/.]+$/, ""),
          mode: "edit",
          aspectRatio: sheet.aspectRatio,
          style: sheet.style,
          prompt: sheet.prompt,
        }),
      });
      const { project } = await createRes.json();

      // Upload file
      const formData = new FormData();
      formData.append("video", selectedFile);

      const uploadRes = await fetch(`/api/projects/${project.id}/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      // Trigger initial analysis
      await fetch(`/api/projects/${project.id}/analyze`, {
        method: "POST",
      });

      if (onProjectCreated) onProjectCreated();
      onNavigate(`/projects/${project.id}`);
    } catch (err) {
      alert("Error creating edit project: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px 0" }}>
          Edit Raw Video
        </h2>
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: "0.85rem" }}>
          Upload clip for AI silence removal, hook detection & smart captions.
        </p>
      </div>

      <VideoUploader
        onFileSelect={(f) => {
          setFile(f);
          handleUploadAndAnalyze(f);
        }}
        isUploading={isUploading}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>
          Optional Edit Preferences
        </h3>
        <CreationSheet
          value={sheet}
          onChange={setSheet}
          onSubmit={() => {
            if (file) handleUploadAndAnalyze(file);
            else alert("Please select a video file first.");
          }}
          isLoading={isUploading}
        />
      </div>
    </div>
  );
}
