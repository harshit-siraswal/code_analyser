import { type FormEventHandler, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

type ProblemSummary = {
  id: number;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  summary: string;
  concepts: string[];
};

type ProblemsResponse = {
  problems: ProblemSummary[];
  total?: number;
  page?: number;
  limit?: number;
};

const difficultyOptions: Array<"All" | "Easy" | "Medium" | "Hard"> = ["All", "Easy", "Medium", "Hard"];
const PAGE_SIZE = 20;

export function ProblemsPage() {
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof difficultyOptions)[number]>("All");

  useEffect(() => {
    let isMounted = true;

    async function loadProblems() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE)
        });

        if (query) {
          params.set("search", query);
        }

        const response = await apiFetch<ProblemsResponse>(`/problems?${params.toString()}`);

        let nextProblems = response.problems;
        let nextTotal = typeof response.total === "number" ? response.total : response.problems.length;

        // Compatibility fallback for environments still returning full list responses.
        if (
          (typeof response.page !== "number" || typeof response.limit !== "number") &&
          nextProblems.length > PAGE_SIZE
        ) {
          const start = (page - 1) * PAGE_SIZE;
          nextTotal = nextProblems.length;
          nextProblems = nextProblems.slice(start, start + PAGE_SIZE);
        }

        if (isMounted) {
          setProblems(nextProblems);
          setTotal(nextTotal);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Could not load problem catalog.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadProblems();

    return () => {
      isMounted = false;
    };
  }, [page, query]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return problems.filter((problem) => {
      const matchesDifficulty = difficulty === "All" || problem.difficulty === difficulty;
      if (!matchesDifficulty) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = `${problem.title} ${problem.summary} ${problem.concepts.join(" ")}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [difficulty, problems, query]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const submitSearch: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    setPage(1);
    setQuery(queryInput.trim());
  };

  const clearSearch = () => {
    setPage(1);
    setQueryInput("");
    setQuery("");
  };

  return (
    <main className="page problems-catalog-page">
      <header className="section-head catalog-head">
        <p className="eyebrow">Problem Workspace</p>
        <h1>Pick a problem and run visible tests with Judge0-backed execution.</h1>
        <p>
          Redesigned flow: choose a problem, code in workspace, run visible tests, then iterate before
          final submission.
        </p>
      </header>

      <form className="catalog-controls card" onSubmit={submitSearch}>
        <label className="catalog-input">
          <span>Search</span>
          <input
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search by title, summary, or concept"
          />
        </label>

        <label className="catalog-select">
          <span>Difficulty</span>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}>
            {difficultyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="catalog-action-row">
          <button type="submit" className="ghost-btn compact">
            Search
          </button>
          <button type="button" className="ghost-btn compact" onClick={clearSearch}>
            Clear
          </button>
        </div>
      </form>

      {loading ? <p className="status-text">Loading problems...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {!loading && !error ? <p className="catalog-meta">Showing {filtered.length} of {total} problems</p> : null}

      {!loading && !error ? (
        <>
          <section className="problem-grid catalog-grid">
          {filtered.length === 0 ? (
            <article className="card">
              <h2>No matching problems</h2>
              <p>Try a different search query or remove filters.</p>
            </article>
          ) : null}

          {filtered.map((problem) => (
            <article key={problem.slug} className="problem-card catalog-card">
              <div className="catalog-card-head">
                <p className="problem-difficulty">{problem.difficulty}</p>
                <h2>{problem.title}</h2>
              </div>

              <p className="catalog-summary">{problem.summary}</p>

              <div className="catalog-tags">
                {problem.concepts.map((concept) => (
                  <span key={`${problem.slug}-${concept}`}>{concept}</span>
                ))}
              </div>

              <Link className="cta-btn compact catalog-open-btn" to={`/problems/${problem.slug}`}>
                Open Workspace
              </Link>
            </article>
          ))}
          </section>

          <section className="catalog-pagination">
            <button
              type="button"
              className="ghost-btn compact"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <p>
              Page {page} of {totalPages}
            </p>
            <button
              type="button"
              className="ghost-btn compact"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </section>
        </>
      ) : null}
    </main>
  );
}
