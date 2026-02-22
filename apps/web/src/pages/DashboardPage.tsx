import { useAuth } from "../auth/AuthProvider";

const KPI_ITEMS = [
  { label: "Problems solved", value: "18", delta: "+4 this week" },
  { label: "Attempts logged", value: "63", delta: "10 in last 24h" },
  { label: "Success rate", value: "71%", delta: "+9% vs last week" },
  { label: "Avg. submit time", value: "14m", delta: "-2m trend" }
];

const WEEKLY_ACTIVITY = [6, 8, 5, 10, 12, 9, 13];

const FOCUS_AREAS = [
  { concept: "Edge case checks", progress: 46 },
  { concept: "String windowing", progress: 62 },
  { concept: "Hash map lookups", progress: 78 }
];

const RECENT_SESSIONS = [
  { title: "Two Sum", status: "Accepted", time: "12 min", insight: "Great first-pass logic." },
  {
    title: "Valid Parentheses",
    status: "Needs Work",
    time: "21 min",
    insight: "Stack exit condition still flaky."
  },
  {
    title: "Longest Substring",
    status: "Accepted",
    time: "29 min",
    insight: "Window updates improved after attempt 3."
  }
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <main className="page dashboard-page">
      <header className="dashboard-head card">
        <div>
          <p className="eyebrow">Performance Dashboard</p>
          <h1>{user?.email ? `${user.email.split("@")[0]}'s Progress` : "Your Progress"}</h1>
          <p>Track output, consistency, and focus areas at a glance.</p>
        </div>
        <button type="button" className="ghost-btn compact">
          Export Snapshot
        </button>
      </header>

      <section className="dashboard-kpi-grid">
        {KPI_ITEMS.map((item) => (
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
            <p>Attempts completed per day</p>
          </header>
          <div className="dashboard-bar-track" aria-label="Weekly activity chart">
            {WEEKLY_ACTIVITY.map((value, index) => (
              <div key={`${value}-${index}`} className="dashboard-bar-col">
                <div style={{ height: `${value * 7}px` }} className="dashboard-bar" />
                <span>{["M", "T", "W", "T", "F", "S", "S"][index]}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card dashboard-focus-card">
          <header>
            <h2>Focus Areas</h2>
            <p>Concept confidence this week</p>
          </header>
          <div className="dashboard-progress-list">
            {FOCUS_AREAS.map((area) => (
              <div key={area.concept} className="dashboard-progress-item">
                <div className="dashboard-progress-head">
                  <p>{area.concept}</p>
                  <span>{area.progress}%</span>
                </div>
                <div className="dashboard-progress-rail">
                  <div style={{ width: `${area.progress}%` }} className="dashboard-progress-fill" />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card dashboard-session-card">
        <header>
          <h2>Recent Sessions</h2>
          <p>Latest problem-solving runs with quick AI notes</p>
        </header>

        <div className="dashboard-session-list">
          {RECENT_SESSIONS.map((session) => (
            <article key={`${session.title}-${session.time}`} className="dashboard-session-item">
              <div>
                <h3>{session.title}</h3>
                <p>{session.insight}</p>
              </div>
              <div className="dashboard-session-meta">
                <span className={session.status === "Accepted" ? "accepted" : "review"}>
                  {session.status}
                </span>
                <small>{session.time}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
