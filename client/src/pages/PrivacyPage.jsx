import React from "react";

export default function PrivacyPage({ onNavigate }) {
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
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: October 31, 2026</p>

        <h2>Information we collect</h2>
        <p>
          Creator AI may process account information such as your email
          address and display name, along with projects, prompts, uploaded
          media, generated media, and technical information needed to operate
          the service.
        </p>

        <h2>How information is used</h2>
        <p>
          Information is used to authenticate users, save and manage projects,
          provide AI video features, operate and secure the service, enforce
          usage limits, diagnose errors, and improve Creator AI.
        </p>

        <h2>Project content</h2>
        <p>
          Content you submit may be processed by the services required to
          generate or edit your requested media. Avoid uploading confidential
          information that is not necessary for your project.
        </p>

        <h2>Storage and security</h2>
        <p>
          Creator AI uses account-based access controls and protected storage
          where available. No internet service can guarantee absolute
          security, so reasonable safeguards are used to reduce risk.
        </p>

        <h2>Third-party services</h2>
        <p>
          Creator AI may rely on infrastructure and AI providers to perform
          features such as authentication, storage, generation, and media
          processing. Those providers may process information required to
          deliver those features.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about privacy can be sent to{" "}
          <a href="mailto:itscommon14@gmail.com">
            itscommon14@gmail.com
          </a>.
        </p>

        <footer className="legal-footer">Made by Leen</footer>
      </section>
    </main>
  );
}
