import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import { apiFetch } from "../lib/api.js";
import {
  VideoPreview,
  EditPlan,
  StatusPill,
  CreatorLogo,
} from "../components/UI";

export default function ProjectDetail({
  projectId,
  onNavigate,
  onProjectUpdated,
}) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [renderJobs, setRenderJobs] = useState([]);
  const [error, setError] = useState("");
  const { session } = useAuth();

  const readJson = async (res) => {
    const text = await res.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return {
        error: text || `HTTP ${res.status}`,
      };
    }
  };

  const loadRenderJobs = async (accessToken) => {
    try {
      const res = await apiFetch(
        `/api/projects/${projectId}/render-jobs`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await readJson(res);

      if (!res.ok) {
        throw new Error(
          data.error || "Unable to load render history."
        );
      }

      setRenderJobs(Array.isArray(data.jobs) ? data.jobs : []);
    } catch (err) {
      console.error("[ProjectDetail render history]", err);
      setRenderJobs([]);
    }
  };

  const loadProject = async () => {
    setError("");

    try {
      const {
        data: { session: freshSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !freshSession?.access_token) {
        throw new Error("Your login session has expired. Please sign in again.");
      }

      const res = await apiFetch(
        `/api/projects/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${freshSession.access_token}`,
          },
        }
      );

      const data = await readJson(res);

      if (!res.ok || !data.project) {
        throw new Error("Project not found.");
      }

      setProject(data.project);
      await loadRenderJobs(freshSession.access_token);
    } catch (err) {
      setError(
        err?.message ||
          "Creator AI couldn't load this project."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleRender = async () => {
    if (rendering) return;

    setRendering(true);
    setError("");

    try {
      const {
        data: { session: freshSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !freshSession?.access_token) {
        throw new Error("Your login session has expired. Please sign in again.");
      }

      const res = await apiFetch(
        `/api/projects/${projectId}/render`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${freshSession.access_token}`,
          },
        }
      );

      const data = await readJson(res);

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Video generation failed."
        );
      }

      if (data.project) {
        setProject(data.project);
      } else {
        await loadProject();
      }

      await loadRenderJobs(freshSession.access_token);

      if (onProjectUpdated) {
        await onProjectUpdated();
      }
    } catch (err) {
      setError(
        err?.message ||
          "Creator AI couldn't create the video."
      );
    } finally {
      setRendering(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this project permanently?"
    );

    if (!confirmed) return;

    try {
      const {
        data: { session: freshSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !freshSession?.access_token) {
        throw new Error("Your login session has expired. Please sign in again.");
      }

      const res = await apiFetch(
        `/api/projects/${projectId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${freshSession.access_token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Delete failed.");
      }

      if (onProjectUpdated) {
        await onProjectUpdated();
      }

      onNavigate("/projects");
    } catch (err) {
      setError("Couldn't delete this project.");
    }
  };

  if (loading) {
    return (
      <section className="project-loading">
        <div className="project-loading__logo">
          <CreatorLogo compact />
        </div>

        <strong>Opening project</strong>
        <span>Just a moment...</span>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="project-missing">
        <CreatorLogo compact />

        <h2>Project unavailable</h2>

        <p>
          {error ||
            "This project could not be opened."}
        </p>

        <button
          type="button"
          className="result-secondary-button"
          onClick={() => onNavigate("/projects")}
        >
          Back to Projects
        </button>
      </section>
    );
  }

  const videoUrl =
    project.renderedVideo?.url ||
    project.sourceVideo?.url ||
    null;

  const isComplete = Boolean(
    project.renderedVideo?.url
  );

  const duration =
    project.duration ||
    project.renderedVideo?.duration ||
    15;

  const style = project.style || "Cinematic";

  return (
    <section className="result-page">
      <div className="result-header">
        <button
          type="button"
          className="result-back"
          onClick={() => onNavigate("/projects")}
          aria-label="Back"
        >
          ‹
        </button>

        <div>
          <span className="section-eyebrow">
            YOUR CREATION
          </span>

          <h1>
            {isComplete
              ? "Your video is ready!"
              : project.title}
          </h1>
        </div>

        <button
          type="button"
          className="result-menu"
          onClick={handleDelete}
          aria-label="Delete project"
        >
          ···
        </button>
      </div>

      <VideoPreview src={videoUrl} />

      <div className="result-title-block">
        <h2>{project.title}</h2>

        <div className="result-meta">
          <span>{duration} sec</span>
          <span>{project.aspectRatio || "9:16"}</span>
          <span className="result-meta__style">
            {style}
          </span>
        </div>
      </div>

      <div className="result-status-card">
        <div className="result-status-card__icon">
          {isComplete ? "✓" : "✦"}
        </div>

        <div>
          <span>Status</span>
          <strong>
            {isComplete
              ? "Completed"
              : project.status || "Draft"}
          </strong>
        </div>

        <StatusPill
          status={
            isComplete
              ? "completed"
              : project.status
          }
        />
      </div>

      {error && (
        <div className="public-error">
          <div className="public-error__icon">
            !
          </div>

          <div className="public-error__content">
            <strong>Something went wrong</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {isComplete ? (
        <div className="result-actions">
          <a
            className="result-download-button"
            href={videoUrl}
            download
          >
            <span>↓</span>
            Download Video
          </a>

          <button
            type="button"
            className="result-secondary-button"
            onClick={() => onNavigate("/create")}
          >
            ✦ Create Another
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="result-download-button"
          onClick={handleRender}
          disabled={rendering}
        >
          <span>✦</span>
          {rendering
            ? "Creating Video..."
            : renderJobs.some((job) => job.status === "failed")
              ? "Retry Render"
              : "Create Video"}
        </button>
      )}

      {renderJobs.length > 0 && (
        <div
          style={{
            marginTop: "18px",
            padding: "16px",
            background: "var(--bg-1)",
            border: "1px solid var(--line-1)",
            borderRadius: "var(--r-lg)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div>
              <strong style={{ display: "block", fontSize: "0.95rem" }}>
                Render history
              </strong>
              <span
                style={{
                  color: "var(--text-2)",
                  fontSize: "0.76rem",
                }}
              >
                Recent generation attempts
              </span>
            </div>

            <span
              style={{
                color: "var(--text-2)",
                fontSize: "0.75rem",
              }}
            >
              {renderJobs.length}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {renderJobs.map((job) => {
              const status = job.status || "unknown";
              const statusLabel =
                status === "completed"
                  ? "Completed"
                  : status === "running"
                    ? `Rendering ${Math.max(0, Number(job.progress || 0))}%`
                    : status === "failed"
                      ? "Failed"
                      : status === "queued"
                        ? "Queued"
                        : status;

              const when = job.created_at
                ? new Date(job.created_at).toLocaleString()
                : "Unknown time";

              return (
                <div
                  key={job.id}
                  style={{
                    padding: "11px 12px",
                    border: "1px solid var(--line-1)",
                    borderRadius: "12px",
                    background: "var(--bg-0)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <strong style={{ fontSize: "0.8rem" }}>
                      {statusLabel}
                    </strong>

                    <span
                      style={{
                        color: "var(--text-2)",
                        fontSize: "0.7rem",
                      }}
                    >
                      {when}
                    </span>
                  </div>

                  {status === "failed" && job.error_message && (
                    <div
                      style={{
                        marginTop: "6px",
                        color: "var(--text-2)",
                        fontSize: "0.75rem",
                      }}
                    >
                      {job.error_message}
                    </div>
                  )}

                  {status === "running" && (
                    <div
                      style={{
                        marginTop: "8px",
                        height: "4px",
                        borderRadius: "999px",
                        background: "var(--line-1)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, Number(job.progress || 0))
                          )}%`,
                          height: "100%",
                          background: "var(--accent)",
                          transition: "width 300ms ease",
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(project.blueprint ||
        project.analysis?.blueprint) && (
        <div className="result-plan">
          <EditPlan
            blueprint={
              project.blueprint ||
              project.analysis?.blueprint
            }
          />
        </div>
      )}

      <div className="result-brand">
        <CreatorLogo compact />

        <div>
          <strong>Made with Creator AI</strong>
          <span>Your AI co-creator</span>
        </div>
      </div>
    </section>
  );
}
