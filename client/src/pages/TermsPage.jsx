import React from "react";

export default function TermsPage({ onNavigate }) {
  return (
    <main className="legal-page">
      <section className="legal-card">
        <button
          className="legal-back"
          type="button"
          onClick={() => onNavigate("/")}
        >
          ← Back to Creator AI
        </button>

        <p className="legal-eyebrow">CREATOR AI</p>
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: October 31, 2026</p>

        <h2>Using Creator AI</h2>
        <p>
          Creator AI provides tools for creating, editing, and managing
          AI-assisted video projects. You are responsible for how you use the
          service and the content you submit.
        </p>

        <h2>Your account</h2>
        <p>
          Keep your account credentials secure and provide accurate
          information when creating an account. You are responsible for
          activity performed through your account.
        </p>

        <h2>Your content</h2>
        <p>
          You retain responsibility for content you upload or submit. Only use
          material you have permission to use and respect copyright, privacy,
          and other applicable rights.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Do not use Creator AI for unlawful activity, harmful abuse,
          impersonation intended to deceive others, attempts to compromise the
          service, or unauthorized access to other users' information.
        </p>

        <h2>AI-generated results</h2>
        <p>
          AI systems can make mistakes. Generated scripts, images, audio,
          videos, and other results should be reviewed before publication or
          important use.
        </p>

        <h2>Availability</h2>
        <p>
          Features, usage limits, and availability may change as Creator AI is
          developed. Temporary interruptions may occur during testing,
          maintenance, or provider outages.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a href="mailto:itscommon14@gmail.com">
            itscommon14@gmail.com
          </a>.
        </p>

        <footer className="legal-footer">Made by Leen</footer>
      </section>
    </main>
  );
}
