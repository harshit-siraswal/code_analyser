import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthVisual } from "../components/AuthVisual";

const HIGHLIGHTS = [
  {
    title: "Attempt Timeline",
    description: "See how each revision changes behavior across visible and hidden tests."
  },
  {
    title: "Concept Signals",
    description: "Track concept usage and identify weak spots from real submissions."
  },
  {
    title: "Actionable Summaries",
    description: "Get concise next steps instead of generic correctness-only feedback."
  }
];

export function LandingPage() {
  const { user, signOutUser } = useAuth();

  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="brand" to="/">
          Code Analyser
        </Link>

        <div className="landing-nav-actions">
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
                Start Free
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Deliberate Coding Practice</p>
          <h1>Learn from every failed attempt, not just accepted solutions.</h1>
          <p className="subtitle">
            Code Analyser captures your attempt history and converts it into session-level insights that
            make your next iteration sharper.
          </p>
          <div className="hero-cta">
            <Link className="cta-btn" to={user ? "/problems" : "/register"}>
              {user ? "Go To Problems" : "Create Account"}
            </Link>
            <Link className="ghost-btn hero-secondary" to={user ? "/dashboard" : "/login"}>
              {user ? "View Dashboard" : "Sign In"}
            </Link>
          </div>
        </div>

        <AuthVisual mode="landing" />
      </section>

      <section className="feature-grid">
        {HIGHLIGHTS.map((item) => (
          <article key={item.title} className="feature-card">
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
