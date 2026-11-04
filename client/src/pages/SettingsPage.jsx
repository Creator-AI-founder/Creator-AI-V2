import React from "react";
import { CreatorLogo } from "../components/UI";

export default function SettingsPage() {
  return (
    <section className="public-settings">
      <div className="page-heading">
        <h1>Settings</h1>
        <p>Customize your Creator AI experience.</p>
      </div>

      <section className="settings-section">
        <h2>Video Defaults</h2>

        <div className="settings-card">
          <div className="settings-row">
            <div>
              <strong>Default format</strong>
              <span>Best for Shorts and Reels</span>
            </div>

            <span className="settings-value">
              9:16
            </span>
          </div>

          <div className="settings-row">
            <div>
              <strong>Language</strong>
              <span>AI voice and captions</span>
            </div>

            <span className="settings-value">
              English
            </span>
          </div>

          <div className="settings-row">
            <div>
              <strong>Video quality</strong>
              <span>Final export resolution</span>
            </div>

            <span className="settings-value">
              1080p
            </span>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2>Creator AI</h2>

        <div className="settings-card">
          <div className="settings-about">
            <CreatorLogo />

            <p>
              Turn an idea into a complete video with
              AI-powered planning, visuals, voice and
              captions.
            </p>
          </div>

          <div className="settings-row">
            <div>
              <strong>Version</strong>
            </div>

            <span className="settings-value">
              2.0
            </span>
          </div>
        </div>
      </section>

      <div className="settings-footer">
        Creator AI
      </div>
    </section>
  );
}
