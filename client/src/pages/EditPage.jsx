import React, { useState } from "react";
import { VideoUploader, CreationSheet } from "../components/UI";
import { apiRequest, isLocalEngine } from "../services/cloudApi";

export default function EditPage({ onNavigate, onProjectCreated }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sheet, setSheet] = useState({ prompt: "", aspectRatio: "9:16", style: "clean" });

  const handleUploadAndAnalyze = async (selectedFile) => {
    setIsUploading(true);
    try {
      const createRes = await apiRequest("/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedFile.name.replace(/\.[^/.]+$/, ""),
          mode: "edit", aspectRatio: sheet.aspectRatio, style: sheet.style, prompt: sheet.prompt
        })
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData?.error?.message || createData?.error || "Project creation failed.");
      const project = createData.project;
      const formData = new FormData();
      formData.append("video", selectedFile);
      const uploadRes = await apiRequest(`/projects/${project.id}/upload`, { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData?.error?.message || uploadData?.error || "Upload failed.");
      if (isLocalEngine) {
        const analysis = await apiRequest(`/projects/${project.id}/analyze`, { method: "POST" });
        if (!analysis.ok) throw new Error("Upload succeeded, but local analysis failed.");
      } else {
        alert("Video uploaded securely. Analysis and editing stay on your local engine for now.");
      }
      if (onProjectCreated) await onProjectCreated();
      onNavigate(`/projects/${project.id}`);
    } catch (err) { alert("Error creating edit project: " + err.message); }
    finally { setIsUploading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px 0" }}>Edit Raw Video</h2>
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: "0.85rem" }}>Upload a source clip to your private project storage.</p>
      </div>
      <VideoUploader onFileSelect={(f) => { setFile(f); handleUploadAndAnalyze(f); }} isUploading={isUploading} />
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>Optional Edit Preferences</h3>
        <CreationSheet value={sheet} onChange={setSheet} onSubmit={() => file ? handleUploadAndAnalyze(file) : alert("Please select a video file first.")} isLoading={isUploading} />
      </div>
    </div>
  );
}
