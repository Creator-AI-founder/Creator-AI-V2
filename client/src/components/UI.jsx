import React from "react";

export function TopBar({ title, actions }) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__logo">✦</span>
        <span>{title || "Creator AI"}</span>
      </div>
      {actions && <div className="topbar__actions">{actions}</div>}
    </header>
  );
}

export function BottomNav({ currentPath, onNavigate }) {
  const items = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/edit", label: "Edit", icon: "✂️" },
    { path: "/create", label: "Create", icon: "✨" },
    { path: "/projects", label: "Projects", icon: "📁" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const isActive = currentPath === item.path;
        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`bottom-nav__item ${isActive ? "bottom-nav__item--active" : ""}`}
          >
            <span className="bottom-nav__icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function Layout({ children, currentPath, onNavigate, topActions }) {
  return (
    <div className="app-container">
      <TopBar actions={topActions} />
      <main className="main-content">{children}</main>
      <BottomNav currentPath={currentPath} onNavigate={onNavigate} />
    </div>
  );
}

export function Button({ children, variant = "primary", size, fullWidth, onClick, disabled }) {
  const classNames = [
    "btn",
    `btn--${variant}`,
    size ? `btn--${size}` : "",
    fullWidth ? "btn--full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classNames} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function StatusPill({ status }) {
  return <span className={`status-pill status-pill--${status || "draft"}`}>{status || "draft"}</span>;
}

export function ModeCard({ icon, title, description, onClick }) {
  return (
    <div className="mode-card" onClick={onClick}>
      <div className="mode-card__icon">{icon}</div>
      <h3 className="mode-card__title">{title}</h3>
      <p className="mode-card__desc">{description}</p>
    </div>
  );
}

export function ProjectCard({ project, onClick }) {
  const dateStr = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString()
    : "Recently";

  return (
    <div className="project-card" onClick={onClick}>
      <div className="project-card__info">
        <h4 className="project-card__title">{project.title || "Untitled Project"}</h4>
        <span className="project-card__meta">
          {project.mode?.toUpperCase()} • {dateStr}
        </span>
      </div>
      <StatusPill status={project.status} />
    </div>
  );
}

export function VideoUploader({ onFileSelect, isUploading }) {
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
        style={{ display: "none" }}
        disabled={isUploading}
      />
      <div className="video-uploader__icon">{isUploading ? "⏳" : "📹"}</div>
      <div className="video-uploader__title">
        {isUploading ? "Uploading Video..." : "Select or Drop Video"}
      </div>
      <div className="video-uploader__hint">MP4, MOV, or WEBM (up to 250MB)</div>
    </label>
  );
}

export function VideoPreview({ src, poster }) {
  return (
    <div className="video-preview">
      {src ? (
        <video src={src} controls poster={poster} />
      ) : (
        <div className="video-preview__placeholder">
          <span style={{ fontSize: "2rem" }}>🎬</span>
          <span>No Video Loaded</span>
        </div>
      )}
    </div>
  );
}

export function EditPlan({ blueprint }) {
  if (!blueprint || !Array.isArray(blueprint.actions)) {
    return (
      <div className="edit-plan">
        <h3 className="edit-plan__title">Edit Blueprint</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-2)" }}>
          No AI edit plan generated yet. Tap "Analyze with AI" to generate structured blueprint.
        </p>
      </div>
    );
  }

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = (sec % 60).toFixed(1);
    return `${mins.toString().padStart(2, "0")}:${secs.padStart(4, "0")}`;
  };

  return (
    <div className="edit-plan">
      <div className="edit-plan__header">
        <h3 className="edit-plan__title">AI Edit Blueprint</h3>
        <span style={{ fontSize: "0.8rem", color: "var(--accent)", fontWeight: 600 }}>
          {blueprint.actions.length} Actions
        </span>
      </div>
      {blueprint.actions.map((act, i) => (
        <div key={act.id || i} className={`action-card action-card--${act.type}`}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="action-card__badge">{act.type}</span>
              <span className="action-card__time">
                {formatTime(act.start)} – {formatTime(act.end)}
              </span>
            </div>
            <div className="action-card__note">{act.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CreationSheet({ value, onChange, onSubmit, isLoading }) {
  return (
    <div className="creation-sheet">
      <div className="creation-sheet__group">
        <label className="creation-sheet__label">Video Concept / Idea</label>
        <textarea
          rows={3}
          placeholder="e.g. 3 habit tips for software developers, fast pace with bold captions..."
          value={value.prompt || ""}
          onChange={(e) => onChange({ ...value, prompt: e.target.value })}
        />
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        <div className="creation-sheet__group" style={{ flex: 1 }}>
          <label className="creation-sheet__label">Aspect Ratio</label>
          <select
            value={value.aspectRatio || "9:16"}
            onChange={(e) => onChange({ ...value, aspectRatio: e.target.value })}
          >
            <option value="9:16">9:16 (Shorts/Reels)</option>
            <option value="16:9">16:9 (Landscape)</option>
            <option value="1:1">1:1 (Square)</option>
          </select>
        </div>
        <div className="creation-sheet__group" style={{ flex: 1 }}>
          <label className="creation-sheet__label">Edit Style</label>
          <select
            value={value.style || "clean"}
            onChange={(e) => onChange({ ...value, style: e.target.value })}
          >
            <option value="clean">Clean Studio</option>
            <option value="bold">Bold Creator</option>
            <option value="minimal">Minimalist</option>
          </select>
        </div>
      </div>
      <Button onClick={onSubmit} disabled={isLoading || !value.prompt?.trim()}>
        {isLoading ? "Generating Blueprint..." : "✨ Create Video Blueprint"}
      </Button>
    </div>
  );
}
