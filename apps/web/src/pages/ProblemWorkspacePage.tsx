import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";

type ProblemExample = {
  input: string;
  output: string;
  explanation?: string;
};

type VisibleTestCase = {
  id: string;
  input: string;
  expectedOutput: string;
  note?: string;
};

type ProblemDetail = {
  id: number;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  summary: string;
  description: string;
  concepts: string[];
  constraints: string[];
  starterCode: string;
  examples: ProblemExample[];
  visibleTests: VisibleTestCase[];
};

type ProblemDetailResponse = {
  problem: ProblemDetail;
};

type RunTestResult = {
  id: string;
  note?: string;
  passed: boolean;
  statusId: number;
  statusDescription: string;
  input: string;
  expectedOutput: string;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  time: string | null;
  memory: number | null;
};

type RunResponse = {
  problem: {
    id: number;
    slug: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    summary: string;
    concepts: string[];
  };
  overallStatus: "accepted" | "failed";
  passedCount: number;
  totalCount: number;
  tests: RunTestResult[];
};

export function ProblemWorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProblem(nextSlug: string) {
      setLoading(true);
      setError(null);
      setRunError(null);
      setRunResult(null);

      try {
        const response = await apiFetch<ProblemDetailResponse>(`/problems/${nextSlug}`);
        if (!isMounted) {
          return;
        }
        setProblem(response.problem);
        setCode(response.problem.starterCode);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Could not load problem.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (slug) {
      void loadProblem(slug);
    } else {
      setLoading(false);
      setError("Missing problem slug.");
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const flowSteps = useMemo(
    () => [
      { title: "Understand", done: true },
      { title: "Code", done: code.trim().length > 0 },
      { title: "Run Visible Tests", done: Boolean(runResult) },
      { title: "Refine", done: runResult?.overallStatus === "accepted" }
    ],
    [code, runResult]
  );

  async function onRunVisibleTests() {
    if (!problem) {
      return;
    }

    setRunning(true);
    setRunError(null);

    try {
      const response = await apiFetch<RunResponse>(`/problems/${problem.slug}/run`, {
        method: "POST",
        body: { code }
      });
      setRunResult(response);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Could not run tests.");
    } finally {
      setRunning(false);
    }
  }

  function onResetStarter() {
    if (!problem) {
      return;
    }

    setCode(problem.starterCode);
    setRunResult(null);
    setRunError(null);
  }

  return (
    <main className="page workspace-page">
      <header className="workspace-header card">
        <div>
          <p className="eyebrow">Problem Workspace</p>
          <h1>{problem?.title ?? "Loading..."}</h1>
          <p className="workspace-subtitle">
            Redefined user flow: understand the statement, run visible tests quickly, then iterate.
          </p>
        </div>
        <Link to="/problems" className="ghost-btn">
          Back To Catalog
        </Link>
      </header>

      <section className="workspace-stepper card">
        {flowSteps.map((step, index) => (
          <div key={step.title} className={`workspace-step ${step.done ? "done" : ""}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{step.title}</p>
          </div>
        ))}
      </section>

      {loading ? <p className="status-text">Loading workspace...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error && problem ? (
        <section className="workspace-layout">
          <article className="workspace-problem-panel card">
            <p className="problem-difficulty">{problem.difficulty}</p>
            <h2>{problem.summary}</h2>
            <p>{problem.description}</p>

            <div className="workspace-tag-row">
              {problem.concepts.map((concept) => (
                <span key={concept}>{concept}</span>
              ))}
            </div>

            <section className="workspace-block">
              <h3>Constraints</h3>
              <ul>
                {problem.constraints.map((constraint) => (
                  <li key={constraint}>{constraint}</li>
                ))}
              </ul>
            </section>

            <section className="workspace-block">
              <h3>Examples</h3>
              <div className="workspace-example-grid">
                {problem.examples.map((example, index) => (
                  <article key={`${example.input}-${index}`} className="workspace-example-card">
                    <p>
                      <strong>Input:</strong> {example.input}
                    </p>
                    <p>
                      <strong>Output:</strong> {example.output}
                    </p>
                    {example.explanation ? (
                      <p>
                        <strong>Explanation:</strong> {example.explanation}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </article>

          <article className="workspace-editor-panel card">
            <div className="workspace-editor-toolbar">
              <p>Language: Python</p>
              <div className="workspace-editor-actions">
                <button type="button" className="ghost-btn" onClick={onResetStarter}>
                  Reset Starter
                </button>
                <button
                  type="button"
                  className="cta-btn"
                  disabled={running || code.trim().length === 0}
                  onClick={() => void onRunVisibleTests()}
                >
                  {running ? "Running..." : "Run Visible Tests"}
                </button>
              </div>
            </div>

            <textarea
              className="code-editor"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck={false}
              aria-label="Code editor"
            />

            {runError ? <p className="error-text">{runError}</p> : null}

            {runResult ? (
              <section className="workspace-results">
                <header className="workspace-results-head">
                  <h3>
                    Result: {runResult.overallStatus === "accepted" ? "Accepted" : "Needs Work"}
                  </h3>
                  <p>
                    Passed {runResult.passedCount} / {runResult.totalCount} visible tests
                  </p>
                </header>

                <div className="workspace-test-grid">
                  {runResult.tests.map((test) => (
                    <article
                      key={test.id}
                      className={`workspace-test-card ${test.passed ? "passed" : "failed"}`}
                    >
                      <p className="workspace-test-title">
                        {test.id} - {test.passed ? "Pass" : "Fail"}
                      </p>
                      <p className="workspace-test-meta">{test.statusDescription}</p>
                      {test.note ? <p className="workspace-test-meta">{test.note}</p> : null}

                      <p>
                        <strong>Input:</strong> {test.input}
                      </p>
                      <p>
                        <strong>Expected:</strong> {test.expectedOutput}
                      </p>
                      <p>
                        <strong>Stdout:</strong> {test.stdout ?? "null"}
                      </p>
                      {test.stderr ? (
                        <p>
                          <strong>Stderr:</strong> {test.stderr}
                        </p>
                      ) : null}
                      {test.compileOutput ? (
                        <p>
                          <strong>Compile Output:</strong> {test.compileOutput}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </article>
        </section>
      ) : null}
    </main>
  );
}
