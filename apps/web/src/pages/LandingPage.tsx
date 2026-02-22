import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthVisual } from "../components/AuthVisual";

const TRUSTED_BY = [
  "AlgoBootcamp",
  "PrepCircuit",
  "Campus Stack",
  "CodeSprint Labs",
  "InterviewForge",
  "SkillLoop"
];

const METRICS = [
  { value: "1.2M+", label: "Attempts Analyzed" },
  { value: "74%", label: "Faster Bug Resolution" },
  { value: "38%", label: "Fewer Repeat Errors" },
  { value: "10s", label: "Median Insight Generation" }
];

const PLATFORM_FEATURES = [
  {
    title: "Attempt-First Feedback",
    description:
      "Move beyond accepted/rejected output. Track how each revision changes behavior and failure patterns.",
    tag: "Core"
  },
  {
    title: "Session Timeline",
    description:
      "Understand the progression from syntax issues to logical fixes through a single interactive timeline.",
    tag: "Analysis"
  },
  {
    title: "Concept Coverage Map",
    description:
      "See which concepts your code actually uses and where your implementation avoids or misuses key patterns.",
    tag: "Learning"
  },
  {
    title: "Deliberate Practice Loop",
    description:
      "Run, submit, analyze, refine. Turn every failed attempt into an explicit next action.",
    tag: "Workflow"
  },
  {
    title: "Coach-Ready Dashboards",
    description:
      "Surface weak concepts, repeated errors, and progress trends for students, mentors, and teams.",
    tag: "Dashboard"
  },
  {
    title: "Secure Execution Isolation",
    description:
      "Evaluate code in sandboxed runners with strict resource controls for safe and consistent grading.",
    tag: "Infra"
  }
];

const EXECUTION_STEPS = [
  {
    phase: "01",
    title: "Solve",
    details: "Write and execute code against visible tests with fast local feedback."
  },
  {
    phase: "02",
    title: "Submit",
    details: "Persist immutable snapshots and evaluate against complete hidden+visible cases."
  },
  {
    phase: "03",
    title: "Analyze",
    details: "Generate concept-level diagnostics, diff traces, and error classification."
  },
  {
    phase: "04",
    title: "Iterate",
    details: "Apply recommendations and close the exact misconceptions found in your timeline."
  }
];

const TESTIMONIALS = [
  {
    quote:
      "Our students stopped guessing. They could finally see exactly why each attempt failed and what to change next.",
    person: "Priya Sharma",
    role: "Lead Mentor, AlgoBootcamp"
  },
  {
    quote:
      "The timeline view made debugging behavior visible, not abstract. Review sessions became twice as productive.",
    person: "Daniel Kim",
    role: "Interview Coach, PrepCircuit"
  },
  {
    quote:
      "We used to track outcomes only. Now we track thinking quality, and our completion rates are improving weekly.",
    person: "Maya Rahman",
    role: "Program Director, Campus Stack"
  }
];

export function LandingPage() {
  const { user, signOutUser } = useAuth();

  return (
    <main className="landing-page startup-landing">
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

      <section className="startup-hero">
        <div className="startup-hero-copy">
          <p className="eyebrow">Engineering Better Problem Solvers</p>
          <h1>Build coding confidence with feedback that explains thinking, not only scores.</h1>
          <p className="subtitle startup-subtitle">
            Code Analyser transforms raw attempt history into actionable insight loops for learners,
            coaches, and interview prep teams.
          </p>

          <div className="hero-cta startup-hero-cta">
            <Link className="cta-btn" to={user ? "/problems" : "/register"}>
              {user ? "Open Problem Catalog" : "Create Account"}
            </Link>
            <Link className="ghost-btn hero-secondary" to={user ? "/dashboard" : "/login"}>
              {user ? "View Dashboard" : "Sign In"}
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
          <p className="eyebrow">Platform Highlights</p>
          <h2>Everything you need for high-fidelity coding practice analytics.</h2>
        </header>

        <div className="startup-feature-grid">
          {PLATFORM_FEATURES.map((feature) => (
            <article key={feature.title} className="startup-feature-card">
              <p className="startup-feature-tag">{feature.tag}</p>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="startup-workflow">
        <header className="startup-section-head">
          <p className="eyebrow">How It Works</p>
          <h2>From submission to insight in four deterministic steps.</h2>
        </header>

        <div className="startup-step-grid">
          {EXECUTION_STEPS.map((step) => (
            <article key={step.phase} className="startup-step-card">
              <p className="startup-step-phase">{step.phase}</p>
              <h3>{step.title}</h3>
              <p>{step.details}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="startup-testimonials">
        <header className="startup-section-head">
          <p className="eyebrow">What Teams Say</p>
          <h2>Built for serious learning outcomes and measurable progress.</h2>
        </header>

        <div className="startup-testimonial-grid">
          {TESTIMONIALS.map((testimonial) => (
            <article key={testimonial.person} className="startup-testimonial-card">
              <p className="startup-quote">"{testimonial.quote}"</p>
              <p className="startup-person">{testimonial.person}</p>
              <p className="startup-role">{testimonial.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="startup-final-cta">
        <div>
          <p className="eyebrow">Ready To Upgrade Practice Quality?</p>
          <h2>Turn every failed attempt into a clear learning step.</h2>
          <p>Launch your first analysis session in minutes.</p>
        </div>
        <div className="startup-final-actions">
          <Link className="cta-btn" to={user ? "/problems" : "/register"}>
            {user ? "Start Solving" : "Get Started Free"}
          </Link>
          <Link className="ghost-btn" to={user ? "/dashboard" : "/login"}>
            {user ? "Open Dashboard" : "View Login"}
          </Link>
        </div>
      </section>
    </main>
  );
}
