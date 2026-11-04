import React, { useEffect, useState } from "react";
import { CreationSheet, CreatorLogo } from "../components/UI";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";
import { apiFetch } from "../lib/api.js";

export default function CreatePage({ onNavigate, onProjectCreated }) {
  const { session } = useAuth();
  const [sheet, setSheet] = useState({
    prompt: "",
    aspectRatio: "9:16",
    style: "cinematic",
    duration: 15,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [quota, setQuota] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(true);

  const loadQuota = async () => {
    try {
      setQuotaLoading(true);

      const {
        data: { session: freshSession },
      } = await supabase.auth.getSession();

      if (!freshSession?.access_token) {
        setQuota(null);
        return;
      }

      const res = await apiFetch("/api/usage/daily", {
        headers: {
          Authorization: `Bearer ${freshSession.access_token}`,
        },
      });

      const data = await readJson(res);

      if (!res.ok) {
        throw new Error(data.error || "Could not load usage.");
      }

      setQuota(data);
    } catch (err) {
      console.error("[CreatePage quota]", err);
      setQuota(null);
    } finally {
      setQuotaLoading(false);
    }
  };

  useEffect(() => {
    loadQuota();
  }, []);

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

  const handleCreate = async () => {
    if (!sheet.prompt?.trim() || isLoading) return;

    setIsLoading(true);
    setError("");
    setStage("Starting");

    try {
      const {
        data: { session: freshSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !freshSession?.access_token) {
        throw new Error("Your login session has expired. Please sign in again.");
      }

      const accessToken = freshSession.access_token;
      const createRes = await apiFetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title:
            sheet.prompt.trim().slice(0, 50) ||
            "New AI Video",
          mode: "create",
          aspectRatio: sheet.aspectRatio,
          style: sheet.style,
          language: "English",
          duration: Number(sheet.duration) || 15,
          prompt: sheet.prompt.trim(),
        }),
      });

      const createData = await readJson(createRes);

      if (!createRes.ok || !createData.project?.id) {
        throw new Error(
          createData.error ||
            createData.message ||
            "Could not create project."
        );
      }

      const projectId = createData.project.id;

      if (onProjectCreated) {
        await onProjectCreated();
      }

      setStage("Saved");

      setIsLoading(false);
      onNavigate(`/projects/${projectId}`);
    } catch (err) {
      console.error("[CreatePage]", err);

      setError(
        err?.message ||
          "Creator AI could not generate this video."
      );

      setIsLoading(false);
      setStage("");
    }
  };

  if (isLoading) {
    return (
      <GeneratingScreen
        stage={stage}
        prompt={sheet.prompt}
      />
    );
  }

  return (
    <section className="create-studio">
      <div className="create-studio__intro">
        <span className="section-eyebrow">
          CREATE WITH AI
        </span>

        <h1>Create your video</h1>

        <p>
          Describe your idea and Creator AI will turn it
          into a complete video.
        </p>
      </div>

      {!quotaLoading && quota && (
        <div className={`daily-quota ${quota.remaining <= 0 ? "daily-quota--empty" : ""}`}>
          <div className="daily-quota__main">
            <span className="daily-quota__icon">◷</span>
            <div>
              <strong>
                {quota.remaining} generation{quota.remaining === 1 ? "" : "s"} remaining
              </strong>
              <small>
                {quota.plan === "pro" ? "Pro" : "Free"} plan · resets tomorrow
              </small>
            </div>
          </div>
          <div className="daily-quota__count">
            {quota.used}/{quota.dailyLimit}
          </div>
        </div>
      )}

      <CreationSheet
        value={sheet}
        onChange={setSheet}
        onSubmit={handleCreate}
        isLoading={false}
      />

      {error && (
        <div className="public-error">
          <div className="public-error__icon">!</div>

          <div className="public-error__content">
            <strong>Couldn't save your project</strong>
            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      <div className="create-trust">
        <div>
          <span>✦</span>
          <strong>AI Director</strong>
          <small>Plans every scene</small>
        </div>

        <div>
          <span>◉</span>
          <strong>Natural Voice</strong>
          <small>Studio narration</small>
        </div>

        <div>
          <span>▣</span>
          <strong>Ready to Post</strong>
          <small>Captions included</small>
        </div>
      </div>
    </section>
  );
}

function GeneratingScreen({ stage, prompt }) {
  const steps = [
    {
      name: "AI Director",
      description: "Planning your story and scenes",
    },
    {
      name: "Visuals",
      description: "Creating visuals for each scene",
    },
    {
      name: "Voiceover",
      description: "Generating natural narration",
    },
    {
      name: "Captions",
      description: "Adding readable captions",
    },
    {
      name: "Rendering",
      description: "Putting everything together",
    },
  ];

  let activeIndex = 0;

  if (stage === "Finalizing") {
    activeIndex = 4;
  }

  if (stage === "Complete") {
    activeIndex = 5;
  }

  return (
    <section className="generating-screen">
      <div className="generating-orbit">
        <div className="generating-orbit__outer" />
        <div className="generating-orbit__middle" />

        <div className="generating-orbit__logo">
          <CreatorLogo compact />
        </div>

        <span className="generating-spark generating-spark--one">
          ✦
        </span>

        <span className="generating-spark generating-spark--two">
          ✦
        </span>
      </div>

      <div className="generating-copy">
        <span className="section-eyebrow">
          CREATOR AI IS WORKING
        </span>

        <h1>Creating your video</h1>

        <p>
          Your idea is being turned into a complete
          short.
        </p>
      </div>

      <div className="generation-steps">
        {steps.map((step, index) => {
          const complete =
            activeIndex > index ||
            stage === "Complete";

          const active =
            !complete &&
            (index === activeIndex ||
              (activeIndex === 0 && index === 0));

          return (
            <div
              key={step.name}
              className={[
                "generation-step",
                complete
                  ? "generation-step--complete"
                  : "",
                active
                  ? "generation-step--active"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="generation-step__state">
                {complete ? "✓" : index + 1}
              </div>

              <div className="generation-step__copy">
                <strong>{step.name}</strong>
                <span>{step.description}</span>
              </div>

              {active && (
                <div className="generation-step__pulse" />
              )}
            </div>
          );
        })}
      </div>

      <div className="generation-idea">
        <span>Your idea</span>
        <p>{prompt}</p>
      </div>

      <p className="generating-note">
        Keep Creator AI open while your video is being
        created.
      </p>
    </section>
  );
}
