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

type MonthlyReportResponse = {
  month: string;
  period: {
    start: string;
    end: string;
  };
  totals: {
    attempts: number;
    sessionsAnalyzed: number;
    uniqueSessions: number;
    problemsSolved: number;
  };
  topicShifts: Array<{
    concept: string;
    startConfidence: number;
    endConfidence: number;
    delta: number;
    status: "improved" | "weakened" | "stable";
    attempts: number;
  }>;
  mostPracticed: Array<{
    concept: string;
    attempts: number;
  }>;
  leastPracticed: Array<{
    concept: string;
    attempts: number;
  }>;
  transitions: {
    weakToStrong: string[];
    strongToWeak: string[];
  };
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
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
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportResponse | null>(null);

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

        const [overviewResponse, monthlyResponse] = await Promise.all([
          apiFetch<DashboardResponse>("/dashboard/overview", {
            token
          }),
          apiFetch<MonthlyReportResponse>("/dashboard/monthly-report", {
            token
          })
        ]);

        if (!isMounted) {
          return;
        }

        setData(overviewResponse);
        setMonthlyReport(monthlyResponse);
      } catch (err) {
        if (isMounted) {
          setData(null);
          setMonthlyReport(null);
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

  const improvedTopics = useMemo(() => {
    if (!monthlyReport) {
      return [];
    }
    return monthlyReport.topicShifts
      .filter((topic) => topic.status === "improved")
      .sort((left, right) => right.delta - left.delta)
      .slice(0, 5);
  }, [monthlyReport]);

  const weakenedTopics = useMemo(() => {
    if (!monthlyReport) {
      return [];
    }
    return monthlyReport.topicShifts
      .filter((topic) => topic.status === "weakened")
      .sort((left, right) => left.delta - right.delta)
      .slice(0, 5);
  }, [monthlyReport]);

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

          {monthlyReport ? (
            <section className="card dashboard-monthly-report">
              <header>
                <h2>Monthly Learning Report ({monthlyReport.month})</h2>
                <p>
                  Attempts {monthlyReport.totals.attempts} | Sessions analyzed {monthlyReport.totals.sessionsAnalyzed}
                </p>
              </header>

              <div className="dashboard-monthly-grid">
                <article className="dashboard-monthly-card">
                  <h3>Topics Improved</h3>
                  {improvedTopics.length > 0 ? (
                    <ul>
                      {improvedTopics.map((topic) => (
                        <li key={`improved-${topic.concept}`}>
                          {toReadableLabel(topic.concept)} (+{Math.round(topic.delta * 100)} pts)
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="workspace-test-meta">No major topic improvements detected yet.</p>
                  )}
                </article>

                <article className="dashboard-monthly-card">
                  <h3>Topics Weakened</h3>
                  {weakenedTopics.length > 0 ? (
                    <ul>
                      {weakenedTopics.map((topic) => (
                        <li key={`weakened-${topic.concept}`}>
                          {toReadableLabel(topic.concept)} ({Math.round(topic.delta * 100)} pts)
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="workspace-test-meta">No weakening trend detected this month.</p>
                  )}
                </article>

                <article className="dashboard-monthly-card">
                  <h3>Most Practiced</h3>
                  {monthlyReport.mostPracticed.length > 0 ? (
                    <ul>
                      {monthlyReport.mostPracticed.map((topic) => (
                        <li key={`most-${topic.concept}`}>
                          {toReadableLabel(topic.concept)} ({topic.attempts} attempts)
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="workspace-test-meta">No practiced-topic data yet.</p>
                  )}
                </article>

                <article className="dashboard-monthly-card">
                  <h3>Least Practiced</h3>
                  {monthlyReport.leastPracticed.length > 0 ? (
                    <ul>
                      {monthlyReport.leastPracticed.map((topic) => (
                        <li key={`least-${topic.concept}`}>
                          {toReadableLabel(topic.concept)} ({topic.attempts} attempts)
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="workspace-test-meta">No practiced-topic data yet.</p>
                  )}
                </article>
              </div>

              <div className="dashboard-swot-grid">
                <article className="dashboard-swot-card">
                  <h3>Strengths</h3>
                  <ul>
                    {(monthlyReport.swot.strengths.length > 0
                      ? monthlyReport.swot.strengths
                      : ["No clear strengths identified yet."]).map((item) => (
                      <li key={`strength-${item}`}>{item}</li>
                    ))}
                  </ul>
                </article>

                <article className="dashboard-swot-card">
                  <h3>Weaknesses</h3>
                  <ul>
                    {(monthlyReport.swot.weaknesses.length > 0
                      ? monthlyReport.swot.weaknesses
                      : ["No major weaknesses flagged."]).map((item) => (
                      <li key={`weakness-${item}`}>{item}</li>
                    ))}
                  </ul>
                </article>

                <article className="dashboard-swot-card">
                  <h3>Opportunities</h3>
                  <ul>
                    {(monthlyReport.swot.opportunities.length > 0
                      ? monthlyReport.swot.opportunities
                      : ["No specific opportunities generated yet."]).map((item) => (
                      <li key={`opportunity-${item}`}>{item}</li>
                    ))}
                  </ul>
                </article>

                <article className="dashboard-swot-card">
                  <h3>Threats</h3>
                  <ul>
                    {(monthlyReport.swot.threats.length > 0
                      ? monthlyReport.swot.threats
                      : ["No immediate threats detected."]).map((item) => (
                      <li key={`threat-${item}`}>{item}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>
          ) : null}

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
