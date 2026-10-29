import React from "react";
import { ProjectCard, Button } from "../components/UI";

export default function ProjectsPage({ projects, onNavigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 2px 0" }}>
            Your Projects
          </h2>
          <p style={{ margin: 0, color: "var(--text-2)", fontSize: "0.82rem" }}>
            {(projects || []).length} project{projects?.length === 1 ? "" : "s"} total
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button size="sm" onClick={() => onNavigate("/edit")}>
            + Edit
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onNavigate("/create")}>
            + Create
          </Button>
        </div>
      </div>

      {!projects || projects.length === 0 ? (
        <div
          style={{
            padding: "36px 20px",
            background: "var(--bg-1)",
            borderRadius: "var(--r-lg)",
            border: "1px dashed var(--line-1)",
            textAlign: "center",
            color: "var(--text-2)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📁</div>
          <p style={{ margin: "0 0 16px 0", fontSize: "0.9rem" }}>No projects created yet.</p>
          <Button size="sm" onClick={() => onNavigate("/edit")}>
            Start First Project
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => onNavigate(`/projects/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
