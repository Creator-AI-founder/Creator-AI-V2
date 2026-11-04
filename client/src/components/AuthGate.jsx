import React, { useState } from "react";
import { signIn, signUp } from "../services/cloudApi";

export default function AuthGate({ onAuthenticated }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const result = mode === "signin"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
      if (result.access_token) onAuthenticated(result);
      else setMessage("Account created. Check your email to confirm your address, then sign in.");
    } catch (err) { setError(err.message || "Something went wrong."); }
    finally { setBusy(false); }
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 20, background: "var(--bg-0, #0a0a0f)", color: "var(--text-0, #fff)" }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 420, boxSizing: "border-box", padding: 24, borderRadius: 20, border: "1px solid var(--line-0, #282333)", background: "var(--bg-1, #12111a)", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 12, letterSpacing: 2, color: "#a78bfa", fontWeight: 800 }}>✦ CREATOR AI</div>
        <h1 style={{ margin: 0, fontSize: 26 }}>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p style={{ margin: 0, color: "var(--text-2, #aaa)", fontSize: 14 }}>Sign in to save projects and manage your studio.</p>
        <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Email
          <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} style={fieldStyle} placeholder="you@example.com" />
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: 13 }}>Password
          <input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} style={fieldStyle} placeholder="At least 8 characters" />
        </label>
        {error && <p role="alert" style={{ margin: 0, color: "#ff8585", fontSize: 13 }}>{error}</p>}
        {message && <p role="status" style={{ margin: 0, color: "#a7e8bd", fontSize: 13 }}>{message}</p>}
        <button disabled={busy} type="submit" style={primaryStyle}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
        <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }} style={switchStyle}>
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
        <small style={{ color: "var(--text-3, #777)", lineHeight: 1.5 }}>Your account is protected by Supabase authentication. Keep your password private.</small>
      </form>
    </main>
  );
}
const fieldStyle = { width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 10, border: "1px solid var(--line-1, #393345)", background: "var(--bg-0, #09090d)", color: "inherit", fontSize: 15 };
const primaryStyle = { border: 0, borderRadius: 10, padding: 13, background: "linear-gradient(100deg,#8b5cf6,#6d55db)", color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer" };
const switchStyle = { border: 0, background: "transparent", color: "#b9a3ff", padding: 8, cursor: "pointer", fontSize: 13 };
