const sampleProblems = [
  { title: "Two Sum", difficulty: "Easy", concepts: "Arrays, Hash Map" },
  {
    title: "Valid Parentheses",
    difficulty: "Easy",
    concepts: "Stack, Strings"
  },
  {
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    concepts: "Sliding Window, Strings"
  }
];

export function ProblemsPage() {
  return (
    <main className="page">
      <header className="section-head">
        <h1>Problem Catalog</h1>
        <p>Browse and start practice sessions. API integration for live data is next.</p>
      </header>

      <section className="problem-grid">
        {sampleProblems.map((problem) => (
          <article key={problem.title} className="problem-card">
            <p className="problem-difficulty">{problem.difficulty}</p>
            <h2>{problem.title}</h2>
            <p>{problem.concepts}</p>
            <button type="button" className="ghost-btn">
              Open Problem
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

