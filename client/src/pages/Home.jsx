import React from "react";
import {
  CreatorLogo,
  ProjectCard,
} from "../components/UI";

export default function Home({
  onNavigate,
  projects,
}) {
  const recentProjects = (projects || []).slice(0, 2);

  return (
    <section className="home-page">
      <div className="home-welcome">
        <div>
          <h1>Hey Creator! 👋</h1>
          <p>What will we create today?</p>
        </div>

        <button
          type="button"
          className="notification-button"
          aria-label="Notifications"
        >
          ♢
        </button>
      </div>

      <button
        type="button"
        className="hero-card"
        onClick={() => onNavigate("/create")}
      >
        <div className="hero-card__glow" />

        <div className="hero-card__content">
          <span className="hero-card__eyebrow">
            CREATOR AI
          </span>

          <h2>
            Turn Ideas Into
            <br />
            <strong>Stunning Videos</strong>
          </h2>

          <p>
            Script, visuals, voice and captions —
            created together.
          </p>
        </div>

        <div className="hero-card__visual">
          <CreatorLogo compact />
        </div>
      </button>

      <section className="home-section">
        <h2 className="home-section__title">
          Create New
        </h2>

        <div className="quick-actions">
          <button
            type="button"
            className="quick-action"
            onClick={() => onNavigate("/create")}
          >
            <div className="quick-action__icon">
              ✦
            </div>

            <strong>Create from Idea</strong>

            <span>
              AI will write, plan and create
            </span>
          </button>

          <button
            type="button"
            className="quick-action"
            onClick={() => onNavigate("/edit")}
          >
            <div className="quick-action__icon">
              ↑
            </div>

            <strong>Upload Video</strong>

            <span>
              Upload and enhance your video
            </span>
          </button>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section__head">
          <h2 className="home-section__title">
            Recent Projects
          </h2>

          {recentProjects.length > 0 && (
            <button
              type="button"
              className="text-button"
              onClick={() =>
                onNavigate("/projects")
              }
            >
              View All
            </button>
          )}
        </div>

        {recentProjects.length ? (
          <div className="recent-projects">
            {recentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() =>
                  onNavigate(
                    `/projects/${project.id}`
                  )
                }
              />
            ))}
          </div>
        ) : (
          <button
            type="button"
            className="empty-projects"
            onClick={() => onNavigate("/create")}
          >
            <CreatorLogo compact />

            <div>
              <strong>
                Create your first video
              </strong>

              <span>
                Start with any idea →
              </span>
            </div>
          </button>
        )}
      </section>
    </section>
  );
}
