import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { apiFetch } from "../lib/api";

type DashboardResponse = {
  kpis: {
    problemsSolved: number;
    problemsAttempted: number;
    attemptsLogged: number;
    successRate: number;
    avgSubmitMinutes: number;
  };
  weeklyActivity: Array<{
    day: string;
    count: number;
  }>;
  focusAreas: Array<{
    concept: string;
    progress: number;
  }>;
  recentSessions: Array<{
    sessionId: string;
    title: string;
    slug: string | null;
    status: string;
    durationMinutes: number;
    attempts: number;
    insight: string;
  }>;
  problems: Array<{
    id: number;
    slug: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    summary: string;
    concepts: string[];
    status: "solved" | "attempted" | "not_started";
  }>;
};

function toReadableLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function DashboardPage() {
  const { user, getIdToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      if (!user) {
        if (isMounted) {
          setLoading(false);
          setData(null);
          setError("Sign in to view your dashboard analytics.");
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = await getIdToken();
        if (!token) {
          throw new Error("Could not read auth token.");
        }

        const response = await apiFetch<DashboardResponse>("/dashboard/overview", {
          token
        });

        if (!isMounted) {
          return;
        }

        setData(response);
      } catch (err) {
        if (isMounted) {
          setData(null);
          setError(err instanceof Error ? err.message : "Could not load dashboard.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [getIdToken, user]);

  const kpiItems = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        label: "Problems solved",
        value: data.kpis.problemsSolved.toString(),
        delta: `${data.kpis.problemsAttempted} attempted`
      },
      {
        label: "Attempts logged",
        value: data.kpis.attemptsLogged.toString(),
        delta: "Session history tracked"
      },
      {
        label: "Success rate",
        value: `${data.kpis.successRate}%`,
        delta: "Accepted / total submissions"
      },
      {
        label: "Avg. submit time",
        value: `${data.kpis.avgSubmitMinutes}m`,
        delta: "Per session"
      }
    ];
  }, [data]);

  return (
    <main className="page dashboard-page">
      <header className="dashboard-head card">
        <div>
          <p className="eyebrow">Performance Dashboard</p>
          <h1>{user?.email ? `${user.email.split("@")[0]}'s Progress` : "Your Progress"}</h1>
          <p>Track every problem, every attempt, and concept confidence in one view.</p>
        </div>
        <Link to="/problems" className="ghost-btn compact">
          Open Problem Catalog
        </Link>
      </header>

      {loading ? <p className="status-text">Loading dashboard...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && data ? (
        <>
          <section className="dashboard-kpi-grid">
            {kpiItems.map((item) => (
              <article key={item.label} className="dashboard-kpi-card">
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                <span>{item.delta}</span>
              </article>
            ))}
          </section>

          <section className="dashboard-main-grid">
            <article className="card dashboard-chart-card">
              <header>
                <h2>Weekly Activity</h2>
                <p>Attempts completed in the last 7 days</p>
              </header>
              <div className="dashboard-bar-track" aria-label="Weekly activity chart">
                {data.weeklyActivity.map((entry) => (
                  <div key={`${entry.day}-${entry.count}`} className="dashboard-bar-col">
                    <div style={{ height: `${Math.max(8, entry.count * 7)}px` }} className="dashboard-bar" />
                    <span>{entry.day}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="card dashboard-focus-card">
              <header>
                <h2>Focus Areas</h2>
                <p>Lowest-confidence concepts from recent analyses</p>
              </header>
              <div className="dashboard-progress-list">
                {data.focusAreas.length > 0 ? (
                  data.focusAreas.map((area) => (
                    <div key={area.concept} className="dashboard-progress-item">
                      <div className="dashboard-progress-head">
                        <p>{toReadableLabel(area.concept)}</p>
                        <span>{area.progress}%</span>
                      </div>
                      <div className="dashboard-progress-rail">
                        <div style={{ width: `${area.progress}%` }} className="dashboard-progress-fill" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="workspace-test-meta">
                    Generate session analyses to populate concept focus areas.
                  </p>
                )}
              </div>
            </article>
          </section>

          <section className="card dashboard-session-card">
            <header>
              <h2>Recent Sessions</h2>
              <p>Latest attempt clusters with analysis notes</p>
            </header>

            <div className="dashboard-session-list">
              {data.recentSessions.length > 0 ? (
                data.recentSessions.map((session) => (
                  <article key={session.sessionId} className="dashboard-session-item">
                    <div>
                      <h3>{session.title}</h3>
                      <p>{session.insight}</p>
                    </div>
                    <div className="dashboard-session-meta">
                      <span className={session.status === "ACCEPTED" ? "accepted" : "review"}>
                        {toReadableLabel(session.status)}
                      </span>
                      <small>
                        {session.durationMinutes}m - {session.attempts} attempt(s)
                      </small>
                      {session.slug ? (
                        <Link
                          to={`/problems/${session.slug}?sessionId=${encodeURIComponent(session.sessionId)}&autoAnalyze=1`}
                          className="ghost-btn compact"
                        >
                          Open Analysis
                        </Link>
                      ) : (
                        <small>Problem slug unavailable</small>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <p className="workspace-test-meta">No sessions yet. Submit a problem to create one.</p>
              )}
            </div>
          </section>

          <section className="card dashboard-all-problems">
            <header>
              <h2>All Questions In Your Bank</h2>
              <p>Every available problem with solve status.</p>
            </header>
            <div className="dashboard-all-problems-list">
              {data.problems.map((problem) => (
                <article key={problem.slug} className="dashboard-all-problems-item">
                  <div>
                    <h3>{problem.title}</h3>
                    <p>{problem.summary}</p>
                  </div>
                  <div className="dashboard-all-problems-meta">
                    <span>{problem.difficulty}</span>
                    <strong className={problem.status}>{toReadableLabel(problem.status)}</strong>
                    <Link to={`/problems/${problem.slug}`}>Open</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
