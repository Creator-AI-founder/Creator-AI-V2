import React, { useState } from "react";
import { CreatorLogo } from "../components/UI.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isSignUp = mode === "signup";

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setBusy(true);

      if (isSignUp) {
        const data = await signUp({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
        });

        if (!data.session) {
          setMessage(
            "Account created. Check your email to confirm your account, then sign in."
          );
          setMode("signin");
        }
      } else {
        await signIn({
          email: email.trim(),
          password,
        });
      }
    } catch (err) {
      setError(err?.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <CreatorLogo />
        </div>

        <div className="auth-heading">
          <p className="auth-eyebrow">AI VIDEO STUDIO</p>

          <h1>
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>

          <p>
            {isSignUp
              ? "Start creating and managing your AI video projects."
              : "Sign in to continue to Creator AI."}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "signin" ? "active" : ""}
            onClick={() => changeMode("signin")}
            disabled={busy}
          >
            Sign in
          </button>

          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => changeMode("signup")}
            disabled={busy}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <label>
              <span>Name</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                disabled={busy}
              />
            </label>
          )}

          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={busy}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={6}
              required
              disabled={busy}
            />
          </label>

          {error && (
            <div className="auth-notice auth-notice--error">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-notice auth-notice--success">
              {message}
            </div>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={busy}
          >
            {busy
              ? "Please wait..."
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          Your projects stay connected to your Creator AI account.
        </p>

        <div className="auth-meta">
          <div className="auth-meta__links">
            <button type="button" onClick={() => window.location.assign("/privacy")}>
              Privacy
            </button>

            <button type="button" onClick={() => window.location.assign("/terms")}>
              Terms
            </button>

            <a href="mailto:itscommon14@gmail.com">
              Contact
            </a>
          </div>

          <p className="auth-made-by">
            Made by <strong>Leen</strong>
          </p>
        </div>
      </section>
    </main>
  );
}
