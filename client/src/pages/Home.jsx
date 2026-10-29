import React from "react";
import { ModeCard, ProjectCard, Button } from "../components/UI";

export default function Home({ onNavigate, projects }) {
  const recentProjects = (projects || []).slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0 0 6px 0", background: "linear-gradient(to right, #fff, #9b6cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Create it. Edit it. Make it better.
        </h1>
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: "0.95rem" }}>
          Professional AI Video Studio.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Start Editing</h2>
        <ModeCard
          icon="✂️"
          title="EDIT EXISTING VIDEO"
          description="Upload raw video clip. AI detects silence, hooks, speaker timing & auto-cuts."
          onClick={() => onNavigate("/edit")}
        />
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "8px 0 0 0" }}>New Project</h2>
        <ModeCard
          icon="✨"
          title="CREATE FROM CONCEPT"
          description="Transform an idea into a full script, timeline & edit blueprint."
          onClick={() => onNavigate("/create")}
        />
      </div>

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>Recent Projects</h3>
          {recentProjects.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => onNavigate("/projects")}>
              View All
            </Button>
          )}
        </div>

        {recentProjects.length === 0 ? (
          <div
            style={{
              padding: "24px",
              background: "var(--bg-1)",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--line-0)",
              textAlign: "center",
              color: "var(--text-2)",
              fontSize: "0.85rem",
            }}
          >
            No active projects yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => onNavigate(`/projects/${p.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
