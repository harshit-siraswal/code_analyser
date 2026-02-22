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

export function LandingPage() {
  const { user, signOutUser } = useAuth();

  return (
    <main className="landing-page startup-landing fintech-theme">
      <header className="landing-nav startup-nav">
        <Link className="brand startup-brand" to="/">
          Code Analyser
        </Link>

        <div className="landing-nav-actions startup-nav-actions">
          <ThemeToggleButton compact />
          {user ? (
            <>
              <Link className="link-pill" to="/problems">
                Problems
              </Link>
              <Link className="link-pill" to="/dashboard">
                Dashboard
              </Link>
              <button type="button" className="ghost-btn compact" onClick={() => void signOutUser()}>
                Sign out
              </button>
            </>
          ) : (
            <>
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
          <h1>Train like a serious engineering team.</h1>
          <p className="subtitle startup-subtitle">
            Faster feedback loops, cleaner submissions, clearer next steps.
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
