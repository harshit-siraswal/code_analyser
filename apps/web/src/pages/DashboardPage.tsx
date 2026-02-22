export function DashboardPage() {
  return (
    <main className="page">
      <header className="section-head">
        <h1>Dashboard</h1>
        <p>Your tracked progress will appear here once attempts are submitted.</p>
      </header>

      <section className="kpi-grid">
        <article className="kpi-card">
          <p>Problems Solved</p>
          <strong>0</strong>
        </article>
        <article className="kpi-card">
          <p>Attempts Logged</p>
          <strong>0</strong>
        </article>
        <article className="kpi-card">
          <p>Weak Concepts</p>
          <strong>0</strong>
        </article>
      </section>
    </main>
  );
}

