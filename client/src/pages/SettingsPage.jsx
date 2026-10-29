import React from "react";
import { Button } from "../components/UI";

export default function SettingsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px 0" }}>Settings</h2>
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: "0.85rem" }}>
          Configure your studio & professional defaults.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <section>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "12px" }}>Account</h3>
          <div
            style={{
              padding: "16px",
              background: "var(--bg-1)",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--line-0)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>Professional Studio</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>
                Active Session • Termux
              </div>
            </div>
            <Button size="sm" variant="secondary">
              Manage
            </Button>
          </div>
        </section>

        <section>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "12px" }}>Default Style</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-1)" }}>Output Format</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button size="sm" variant="primary">
                MP4 (Best Compat)
              </Button>
              <Button size="sm" variant="secondary">
                MOV
              </Button>
              <Button size="sm" variant="secondary">
                WebM
              </Button>
            </div>
          </div>
        </section>

        <section>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "12px" }}>AI Backend</h3>
          <div
            style={{
              padding: "12px 14px",
              background: "rgba(155, 108, 255, 0.05)",
              border: "1px solid var(--accent-soft)",
              borderRadius: "var(--r-md)",
              fontSize: "0.8rem",
              color: "var(--accent-2)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>✨</span>
            <span>Connected to FreeLLMAPI (GPT-OSS-120B)</span>
          </div>
        </section>
      </div>

      <footer style={{ marginTop: "20px", textAlign: "center", opacity: 0.3 }}>
        <div style={{ fontSize: "0.75rem" }}>Creator AI V2.0.0-alpha</div>
        <div style={{ fontSize: "0.7rem" }}>Optimized for Android Termux</div>
      </footer>
    </div>
  );
}
