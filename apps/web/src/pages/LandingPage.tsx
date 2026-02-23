import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthVisual } from "../components/AuthVisual";
import { ThemeToggleButton } from "../components/ThemeToggleButton";

const TRUSTED_BY = [
  "AlgoBootcamp",
  "PrepCircuit",
  "Campus Stack",
  "CodeSprint Labs",
  "InterviewForge"
];

const METRICS = [
  { value: "1.2M+", label: "Attempts processed" },
  { value: "74%", label: "Faster debugging" },
  { value: "10s", label: "Median analysis" },
  { value: "24/7", label: "Practice uptime" }
];

const FEATURES = [
  {
    title: "Run + Submit",
    description: "One workspace for quick checks and full validation."
  },
  {
    title: "Session AI",
    description: "See pattern shifts across attempts, not only final status."
  },
  {
    title: "Concept Signals",
    description: "Know what you used, missed, and should sharpen next."
  }
];

const FLOW = [
  { phase: "01", title: "Solve", details: "Write code and test instantly." },
  { phase: "02", title: "Submit", details: "Store attempt history with verdicts." },
  { phase: "03", title: "Analyze", details: "Get focused recommendations." }
];

const HERO_HEADLINE = "Practice with the rigor of a real engineering team.";
const HERO_SUBTITLE =
  "Run, submit, and analyze in fast feedback loops with clear next actions every session.";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function LandingPage() {
  const { user, signOutUser } = useAuth();
  const [typedHeadline, setTypedHeadline] = useState("");
  const [typedSubtitle, setTypedSubtitle] = useState("");

  useEffect(() => {
    let cancelled = false;

    const typeLine = async (
      fullText: string,
      setText: (value: string) => void,
      speedMs: number
    ) => {
      for (let index = 1; index <= fullText.length; index += 1) {
        if (cancelled) {
          return;
        }
        setText(fullText.slice(0, index));
        await wait(speedMs);
      }
    };

    const runTypingAnimation = async () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        setTypedHeadline(HERO_HEADLINE);
        setTypedSubtitle(HERO_SUBTITLE);
        return;
      }

      setTypedHeadline("");
      setTypedSubtitle("");

      await typeLine(HERO_HEADLINE, setTypedHeadline, 24);
      await wait(180);
      await typeLine(HERO_SUBTITLE, setTypedSubtitle, 16);
    };

    void runTypingAnimation();

    return () => {
      cancelled = true;
    };
  }, []);

  const isHeadlineTyping = typedHeadline.length < HERO_HEADLINE.length;
  const isSubtitleTyping =
    typedHeadline.length === HERO_HEADLINE.length && typedSubtitle.length < HERO_SUBTITLE.length;

  return (
    <main className="landing-page startup-landing fintech-theme">
      <header className="landing-nav startup-nav">
        <Link className="brand startup-brand" to="/">
          Code Analyser
        </Link>

        <div className="landing-nav-actions startup-nav-actions">
          {user ? (
            <>
              <Link className="link-pill" to="/problems">
                Problems
              </Link>
              <Link className="link-pill" to="/dashboard">
                Dashboard
              </Link>
              <div className="topbar-icon-actions">
                <ThemeToggleButton compact />
                <button
                  type="button"
                  className="ghost-btn icon-action-btn compact"
                  title="Sign out"
                  aria-label="Sign out"
                  onClick={() => void signOutUser()}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M10 5H5.5A1.5 1.5 0 0 0 4 6.5v11A1.5 1.5 0 0 0 5.5 19H10M15 16l5-4-5-4M20 12H9"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <>
              <ThemeToggleButton compact />
              <Link className="link-pill" to="/login">
                Sign in
              </Link>
              <Link className="cta-btn compact" to="/register">
                Start free
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="startup-hero">
        <div className="startup-hero-copy">
          <p className="eyebrow">Code Intelligence Studio</p>
          <h1 className={`startup-typed-heading${isHeadlineTyping ? " is-typing" : ""}`}>
            {typedHeadline}
          </h1>
          <p
            className={`subtitle startup-subtitle startup-typed-subline${
              isSubtitleTyping ? " is-typing" : ""
            }`}
          >
            {typedSubtitle}
          </p>

          <div className="hero-cta startup-hero-cta">
            <Link className="cta-btn" to={user ? "/problems" : "/register"}>
              {user ? "Open Problems" : "Create Account"}
            </Link>
            <Link className="ghost-btn hero-secondary" to={user ? "/dashboard" : "/login"}>
              {user ? "Open Dashboard" : "Sign In"}
            </Link>
          </div>

          <div className="startup-mini-metrics">
            {METRICS.map((metric) => (
              <article key={metric.label} className="startup-mini-card">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>
        </div>

        <AuthVisual mode="landing" />
      </section>

      <section className="startup-trust-strip" aria-label="Trusted by programs and teams">
        {TRUSTED_BY.map((name) => (
          <p key={name}>{name}</p>
        ))}
      </section>

      <section className="startup-features">
        <header className="startup-section-head">
          <p className="eyebrow">What You Get</p>
          <h2>Built for high-signal practice.</h2>
        </header>

        <div className="startup-feature-grid lean-feature-grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="startup-feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="startup-workflow">
        <header className="startup-section-head">
          <p className="eyebrow">Flow</p>
          <h2>Short loop. Better outcomes.</h2>
        </header>

        <div className="startup-step-grid lean-step-grid">
          {FLOW.map((step) => (
            <article key={step.phase} className="startup-step-card">
              <p className="startup-step-phase">{step.phase}</p>
              <h3>{step.title}</h3>
              <p>{step.details}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="startup-final-cta">
        <div>
          <p className="eyebrow">Start Today</p>
          <h2>Solve. Submit. Learn faster.</h2>
          <p>Everything in one focused workspace.</p>
        </div>
        <div className="startup-final-actions">
          <Link className="cta-btn" to={user ? "/problems" : "/register"}>
            {user ? "Start Solving" : "Get Started"}
          </Link>
          <Link className="ghost-btn" to={user ? "/dashboard" : "/login"}>
            {user ? "Go To Dashboard" : "View Login"}
          </Link>
        </div>
      </section>
    </main>
  );
}
