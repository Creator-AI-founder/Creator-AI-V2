import React, { useEffect, useState } from "react";
import { Button } from "../components/UI";
import { apiRequest, isLocalEngine } from "../services/cloudApi";

export default function SettingsPage() {
  const [usage, setUsage] = useState(null);
  const [usageError, setUsageError] = useState("");

  useEffect(() => {
    if (isLocalEngine) return;
    let active = true;
    apiRequest("/usage/daily")
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message || "Usage information unavailable.");
        if (active) setUsage(data);
      })
      .catch(error => { if (active) setUsageError(error.message); });
    return () => { active = false; };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 4px 0" }}>Settings</h2>
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: "0.85rem" }}>Configure your studio & professional defaults.</p>
      </div>

      <section>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "12px" }}>Plan & Usage</h3>
        <div style={{ padding: 16, background: "var(--bg-1)", borderRadius: "var(--r-md)", border: "1px solid var(--line-0)", display: "grid", gap: 8 }}>
          {usage ? <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ textTransform: "capitalize" }}>{usage.plan} plan</strong>
              <span style={{ color: "var(--text-2)", fontSize: 13 }}>{usage.remaining} remaining today</span>
            </div>
            <div style={{ height: 8, borderRadius: 20, overflow: "hidden", background: "var(--line-0)" }}>
              <div style={{ height: "100%", width: Math.min(100, usage.dailyLimit ? usage.used / usage.dailyLimit * 100 : 0) + "%", background: "var(--accent, #9b6cff)" }} />
            </div>
            <small style={{ color: "var(--text-2)" }}>{usage.used} of {usage.dailyLimit} daily generations used</small>
            {usage.plan !== "pro" && <small style={{ color: "var(--text-3)" }}>Pro plan limit: 30 generations/day. Upgrade checkout is not connected yet.</small>}
          </> : <span style={{ color: "var(--text-2)", fontSize: 13 }}>{usageError || (isLocalEngine ? "Cloud usage details are available on the deployed app." : "Loading usage…")}</span>}
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "12px" }}>Default Style</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--text-1)" }}>Output Format</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button size="sm" variant="primary">MP4 (Best Compat)</Button>
            <Button size="sm" variant="secondary">MOV</Button>
            <Button size="sm" variant="secondary">WebM</Button>
          </div>
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "12px" }}>AI Backend</h3>
        <div style={{ padding: "12px 14px", background: "rgba(155, 108, 255, 0.05)", border: "1px solid var(--accent-soft)", borderRadius: "var(--r-md)", fontSize: "0.8rem", color: "var(--accent-2)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>✨</span><span>Connected to FreeLLMAPI (GPT-OSS-120B)</span>
        </div>
      </section>

      <footer style={{ marginTop: "20px", textAlign: "center", opacity: 0.3 }}>
        <div style={{ fontSize: "0.75rem" }}>Creator AI V2.0.0-alpha</div>
        <div style={{ fontSize: "0.7rem" }}>Optimized for Android Termux</div>
      </footer>
    </div>
  );
}
