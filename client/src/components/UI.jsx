import React from "react";

/* =========================
   CREATOR AI BRAND LOGO
========================= */

export function CreatorLogo({ compact = false }) {
  return (
    <div className={`creator-logo ${compact ? "creator-logo--compact" : ""}`}>
      <div className="creator-logo__mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" role="img">
          <defs>
            <linearGradient id="creatorLogoGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c06cff" />
              <stop offset="55%" stopColor="#8b43ff" />
              <stop offset="100%" stopColor="#6424e8" />
            </linearGradient>
          </defs>

          <path
            d="M45 12.5A23 23 0 1 0 47.5 48"
            fill="none"
            stroke="url(#creatorLogoGradient)"
            strokeWidth="9"
            strokeLinecap="round"
          />

          <path
            d="M27 23.5L43 32L27 40.5Z"
            fill="url(#creatorLogoGradient)"
          />

          <path
            d="M49 7L51.5 12.5L57 15L51.5 17.5L49 23L46.5 17.5L41 15L46.5 12.5Z"
            fill="#d89aff"
          />
        </svg>
      </div>

      {!compact && (
        <div className="creator-logo__wordmark">
          <span>Creator</span>
          <strong>AI</strong>
        </div>
      )}
    </div>
  );
}

/* =========================
   TOP BAR
========================= */

export function TopBar({ actions }) {
  return (
    <header className="topbar">
      <CreatorLogo />
      {actions && <div className="topbar__actions">{actions}</div>}
    </header>
  );
}

/* =========================
   BOTTOM NAVIGATION
========================= */

export function BottomNav({ currentPath, onNavigate }) {
  const items = [
    {
      path: "/",
      label: "Home",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M3 11.5L12 4l9 7.5V21h-6v-6H9v6H3z" />
        </svg>
      ),
    },
    {
      path: "/projects",
      label: "Projects",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M4 6h6l2 2h8v11H4z" />
        </svg>
      ),
    },
    {
      path: "/create",
      label: "Create",
      special: true,
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
        </svg>
      ),
    },
    {
      path: "/edit",
      label: "Edit",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M5 4h14v16H5zM9 9l7 3-7 3z" />
        </svg>
      ),
    },
    {
      path: "/settings",
      label: "Settings",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 4-2.1-1.2.1-2.4-2.3-1.3-2 1.3L12.6 7 12 4.6H9.4L8.8 7 6.7 8.4l-2-1.3-2.3 1.3.1 2.4L.5 12l2 1.2-.1 2.4 2.3 1.3 2-1.3L8.8 17l.6 2.4H12l.6-2.4 2.1-1.4 2 1.3 2.3-1.3-.1-2.4z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const active =
          currentPath === item.path ||
          (item.path === "/projects" &&
            currentPath.startsWith("/projects/"));

        return (
          <button
            type="button"
            key={item.path}
            className={[
              "bottom-nav__item",
              active ? "bottom-nav__item--active" : "",
              item.special ? "bottom-nav__item--special" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onNavigate(item.path)}
          >
            <span className="bottom-nav__icon">
              {item.icon}
            </span>

            <span className="bottom-nav__label">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* =========================
   LAYOUT
========================= */

export function Layout({
  children,
  currentPath,
  onNavigate,
  topActions,
}) {
  return (
    <div className="app-container">
      <TopBar actions={topActions} />

      <main className="main-content">
        {children}
      </main>

      <BottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
      />
    </div>
  );
}

/* =========================
   BUTTON
========================= */

export function Button({
  children,
  variant = "primary",
  size,
  fullWidth,
  onClick,
  disabled,
  style,
}) {
  const classNames = [
    "btn",
    `btn--${variant}`,
    size ? `btn--${size}` : "",
    fullWidth ? "btn--full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}

/* =========================
   STATUS
========================= */

export function StatusPill({ status }) {
  return (
    <span
      className={`status-pill status-pill--${
        status || "draft"
      }`}
    >
      {status || "draft"}
    </span>
  );
}

/* =========================
   MODE CARD
========================= */

export function ModeCard({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      className="mode-card"
      onClick={onClick}
    >
      <div className="mode-card__icon">{icon}</div>

      <div className="mode-card__copy">
        <h3 className="mode-card__title">
          {title}
        </h3>

        <p className="mode-card__desc">
          {description}
        </p>
      </div>

      <span className="mode-card__arrow">›</span>
    </button>
  );
}

/* =========================
   PROJECT CARD
========================= */

export function ProjectCard({ project, onClick }) {
  const dateStr = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString()
    : "Recently";

  return (
    <button
      type="button"
      className="project-card"
      onClick={onClick}
    >
      <div className="project-card__thumb">
        <CreatorLogo compact />
      </div>

      <div className="project-card__info">
        <h4 className="project-card__title">
          {project.title || "Untitled Project"}
        </h4>

        <span className="project-card__meta">
          {project.duration || 15}s ·{" "}
          {project.aspectRatio || "9:16"} ·{" "}
          {project.style || "Cinematic"}
        </span>

        <StatusPill status={project.status} />
      </div>

      <span className="project-card__arrow">
        ›
      </span>
    </button>
  );
}

/* =========================
   VIDEO UPLOADER
========================= */

export function VideoUploader({
  onFileSelect,
  isUploading,
}) {
  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <label className="video-uploader">
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        hidden
        disabled={isUploading}
      />

      <div className="video-uploader__icon">
        {isUploading ? "◌" : "↑"}
      </div>

      <div className="video-uploader__title">
        {isUploading
          ? "Uploading Video..."
          : "Upload your video"}
      </div>

      <div className="video-uploader__hint">
        MP4, MOV or WEBM · up to 250MB
      </div>
    </label>
  );
}

/* =========================
   VIDEO PREVIEW
========================= */

export function VideoPreview({ src, poster }) {
  return (
    <div className="video-preview">
      {src ? (
        <video
          src={src}
          controls
          playsInline
          poster={poster}
        />
      ) : (
        <div className="video-preview__placeholder">
          <CreatorLogo compact />
          <span>Your video will appear here</span>
        </div>
      )}
    </div>
  );
}

/* =========================
   EDIT PLAN
========================= */

export function EditPlan({ blueprint }) {
  if (
    !blueprint ||
    !Array.isArray(blueprint.actions)
  ) {
    return null;
  }

  const formatTime = (sec) => {
    const value = Number(sec || 0);
    const mins = Math.floor(value / 60);
    const secs = (value % 60).toFixed(1);

    return `${mins
      .toString()
      .padStart(2, "0")}:${secs.padStart(4, "0")}`;
  };

  return (
    <section className="edit-plan">
      <div className="edit-plan__header">
        <div>
          <span className="section-eyebrow">
            AI DIRECTOR
          </span>

          <h3 className="edit-plan__title">
            Production plan
          </h3>
        </div>

        <span className="edit-plan__count">
          {blueprint.actions.length} actions
        </span>
      </div>

      {blueprint.actions.map((act, i) => (
        <div
          key={act.id || i}
          className={`action-card action-card--${act.type}`}
        >
          <div>
            <div className="action-card__head">
              <span className="action-card__badge">
                {act.type}
              </span>

              <span className="action-card__time">
                {formatTime(act.start)} –{" "}
                {formatTime(act.end)}
              </span>
            </div>

            {act.note && (
              <div className="action-card__note">
                {act.note}
              </div>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

/* =========================
   CREATION SHEET
========================= */

export function CreationSheet({
  value,
  onChange,
  onSubmit,
  isLoading,
  stage,
}) {
  return (
    <div className="creation-sheet">
      <div className="creation-sheet__group">
        <label className="creation-sheet__label">
          Your idea
        </label>

        <textarea
          rows={5}
          maxLength={1000}
          placeholder="3 mysterious facts about the ocean..."
          value={value.prompt || ""}
          onChange={(e) =>
            onChange({
              ...value,
              prompt: e.target.value,
            })
          }
        />

        <div className="creation-sheet__counter">
          {(value.prompt || "").length}/1000
        </div>
      </div>

      <div className="creation-sheet__heading">
        Video Settings
      </div>

      <div className="creation-settings">
        <label className="creation-setting">
          <span className="creation-setting__icon">
            ◷
          </span>

          <span className="creation-setting__name">
            Duration
          </span>

          <select
            value={value.duration || 15}
            onChange={(e) =>
              onChange({
                ...value,
                duration: Number(e.target.value),
              })
            }
          >
            <option value={15}>15 sec</option>
            <option value={30}>30 sec</option>
            <option value={45}>45 sec</option>
            <option value={60}>60 sec</option>
          </select>
        </label>

        <label className="creation-setting">
          <span className="creation-setting__icon">
            ▯
          </span>

          <span className="creation-setting__name">
            Format
          </span>

          <select
            value={value.aspectRatio || "9:16"}
            onChange={(e) =>
              onChange({
                ...value,
                aspectRatio: e.target.value,
              })
            }
          >
            <option value="9:16">
              9:16 Shorts
            </option>
            <option value="16:9">
              16:9 Landscape
            </option>
            <option value="1:1">
              1:1 Square
            </option>
          </select>
        </label>

        <label className="creation-setting">
          <span className="creation-setting__icon">
            ◇
          </span>

          <span className="creation-setting__name">
            Style
          </span>

          <select
            value={value.style || "cinematic"}
            onChange={(e) =>
              onChange({
                ...value,
                style: e.target.value,
              })
            }
          >
            <option value="cinematic">
              Cinematic
            </option>
            <option value="clean">
              Clean Studio
            </option>
            <option value="bold">
              Bold Creator
            </option>
            <option value="minimal">
              Minimal
            </option>
          </select>
        </label>
      </div>

      <button
        type="button"
        className="generate-button"
        onClick={onSubmit}
        disabled={
          isLoading || !value.prompt?.trim()
        }
      >
        <span>✦</span>
        {isLoading
          ? stage || "Creating Video..."
          : "Generate Video"}
      </button>

      <div className="creation-sheet__footer">
        AI Director · Kokoro Voice · Auto Captions
      </div>
    </div>
  );
}
