import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
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

type ExecutionTestResult = {
  id: string;
  note?: string;
  isHidden?: boolean;
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
  tests: ExecutionTestResult[];
};

type SubmitResponse = {
  sessionId: string;
  overallStatus: "accepted" | "failed";
  passedCount: number;
  totalCount: number;
  tests: ExecutionTestResult[];
  attempt: {
    id: number;
    status: string;
    submittedAt: string;
  };
};

type SessionAttemptSnapshot = {
  id: number;
  code: string;
  status: string;
  errorType: string | null;
  submittedAt: string;
};

type AnalyzeResponse = {
  analysis: {
    id: number;
    sessionId: string;
    summary: string;
    conceptBreakdown: Record<string, { count: number; confidence: number }>;
    attemptTimeline: Array<{
      attempt_id: number;
      status: string;
      error_type: string | null;
      submitted_at: string | null;
      lines_added?: number;
      lines_removed?: number;
      change_summary?: string;
    }>;
    recommendations: string[];
    timeComplexity: string | null;
    createdAt: string;
  };
  attempts: SessionAttemptSnapshot[];
};

function toReadableLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toReadableEnum(value: string): string {
  return toReadableLabel(value.toLowerCase());
}

type DiffRow = {
  leftNumber: number | null;
  rightNumber: number | null;
  leftText: string;
  rightText: string;
  kind: "same" | "added" | "removed" | "changed";
};

function buildDiffRows(previousCode: string, currentCode: string): DiffRow[] {
  const previousLines = previousCode.split("\n");
  const currentLines = currentCode.split("\n");

  const rows: DiffRow[] = [];
  let previousIndex = 0;
  let currentIndex = 0;

  while (previousIndex < previousLines.length || currentIndex < currentLines.length) {
    const previousLine = previousLines[previousIndex];
    const currentLine = currentLines[currentIndex];

    if (previousLine === currentLine) {
      rows.push({
        leftNumber: previousIndex + 1,
        rightNumber: currentIndex + 1,
        leftText: previousLine ?? "",
        rightText: currentLine ?? "",
        kind: "same"
      });
      previousIndex += 1;
      currentIndex += 1;
      continue;
    }

    if (previousLines[previousIndex + 1] === currentLine) {
      rows.push({
        leftNumber: previousIndex + 1,
        rightNumber: null,
        leftText: previousLine ?? "",
        rightText: "",
        kind: "removed"
      });
      previousIndex += 1;
      continue;
    }

    if (previousLine === currentLines[currentIndex + 1]) {
      rows.push({
        leftNumber: null,
        rightNumber: currentIndex + 1,
        leftText: "",
        rightText: currentLine ?? "",
        kind: "added"
      });
      currentIndex += 1;
      continue;
    }

    rows.push({
      leftNumber: previousIndex < previousLines.length ? previousIndex + 1 : null,
      rightNumber: currentIndex < currentLines.length ? currentIndex + 1 : null,
      leftText: previousLine ?? "",
      rightText: currentLine ?? "",
      kind: "changed"
    });
    previousIndex += previousIndex < previousLines.length ? 1 : 0;
    currentIndex += currentIndex < currentLines.length ? 1 : 0;
  }

  return rows;
}

export function ProblemWorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  const { getIdToken } = useAuth();
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunResponse | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse["analysis"] | null>(null);
  const [attemptSnapshots, setAttemptSnapshots] = useState<SessionAttemptSnapshot[]>([]);
  const [leftAttemptId, setLeftAttemptId] = useState<number | null>(null);
  const [rightAttemptId, setRightAttemptId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProblem(nextSlug: string) {
      setLoading(true);
      setError(null);
      setRunError(null);
      setRunResult(null);
      setSubmitError(null);
      setSubmitResult(null);
      setSessionId(null);
      setAnalysisError(null);
      setAnalysisResult(null);
      setAttemptSnapshots([]);
      setLeftAttemptId(null);
      setRightAttemptId(null);

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
      { title: "Submit", done: Boolean(submitResult) },
      { title: "Analyze", done: Boolean(analysisResult) }
    ],
    [analysisResult, code, runResult, submitResult]
  );

  const selectedLeftAttempt = useMemo(
    () => attemptSnapshots.find((attempt) => attempt.id === leftAttemptId) ?? null,
    [attemptSnapshots, leftAttemptId]
  );
  const selectedRightAttempt = useMemo(
    () => attemptSnapshots.find((attempt) => attempt.id === rightAttemptId) ?? null,
    [attemptSnapshots, rightAttemptId]
  );
  const diffRows = useMemo(() => {
    if (!selectedLeftAttempt || !selectedRightAttempt) {
      return [];
    }
    return buildDiffRows(selectedLeftAttempt.code, selectedRightAttempt.code);
  }, [selectedLeftAttempt, selectedRightAttempt]);

  useEffect(() => {
    if (attemptSnapshots.length === 0) {
      setLeftAttemptId(null);
      setRightAttemptId(null);
      return;
    }

    if (!leftAttemptId || !attemptSnapshots.some((attempt) => attempt.id === leftAttemptId)) {
      const defaultLeft = attemptSnapshots[Math.max(0, attemptSnapshots.length - 2)];
      setLeftAttemptId(defaultLeft?.id ?? attemptSnapshots[0]?.id ?? null);
    }

    if (!rightAttemptId || !attemptSnapshots.some((attempt) => attempt.id === rightAttemptId)) {
      const defaultRight = attemptSnapshots[attemptSnapshots.length - 1];
      setRightAttemptId(defaultRight?.id ?? attemptSnapshots[0]?.id ?? null);
    }
  }, [attemptSnapshots, leftAttemptId, rightAttemptId]);

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

  async function onSubmitSolution() {
    if (!problem) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setAnalysisError(null);

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("You need to sign in before submitting.");
      }
      const response = sessionId
        ? await apiFetch<SubmitResponse>(`/problems/${problem.slug}/submit`, {
            method: "POST",
            token,
            body: { code, sessionId }
          })
        : await apiFetch<SubmitResponse>(`/problems/${problem.slug}/submit`, {
            method: "POST",
            token,
            body: { code }
          });

      setSubmitResult(response);
      setSessionId(response.sessionId);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not submit solution.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onAnalyzeSession() {
    if (!sessionId) {
      setAnalysisError("Submit at least once to create a session before analyzing.");
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("You need to sign in before analyzing.");
      }

      const response = await apiFetch<AnalyzeResponse>(`/sessions/${sessionId}/analyze`, {
        method: "POST",
        token,
        body: {}
      });
      setAnalysisResult(response.analysis);
      setAttemptSnapshots(response.attempts);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Could not analyze session.");
    } finally {
      setAnalyzing(false);
    }
  }

  function onResetStarter() {
    if (!problem) {
      return;
    }

    setCode(problem.starterCode);
    setRunResult(null);
    setRunError(null);
            setSubmitResult(null);
            setSubmitError(null);
            setSessionId(null);
            setAnalysisResult(null);
            setAnalysisError(null);
            setAttemptSnapshots([]);
            setLeftAttemptId(null);
            setRightAttemptId(null);
          }

  return (
    <main className="page workspace-page">
      <header className="workspace-header card">
        <div>
          <p className="eyebrow">Problem Workspace</p>
          <h1>{problem?.title ?? "Loading..."}</h1>
          <p className="workspace-subtitle">
            End-to-end flow: run visible tests, submit full evaluation, then analyze your session.
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
                  className="ghost-btn"
                  disabled={running || code.trim().length === 0}
                  onClick={() => void onRunVisibleTests()}
                >
                  {running ? "Running..." : "Run Visible Tests"}
                </button>
                <button
                  type="button"
                  className="cta-btn"
                  disabled={submitting || code.trim().length === 0}
                  onClick={() => void onSubmitSolution()}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={analyzing || !sessionId}
                  onClick={() => void onAnalyzeSession()}
                >
                  {analyzing ? "Analyzing..." : "Analyze"}
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
            {submitError ? <p className="error-text">{submitError}</p> : null}
            {analysisError ? <p className="error-text">{analysisError}</p> : null}

            {runResult ? (
              <section className="workspace-results">
                <header className="workspace-results-head">
                  <h3>
                    Visible Tests:{" "}
                    {runResult.overallStatus === "accepted" ? "Accepted" : "Needs Work"}
                  </h3>
                  <p>
                    Passed {runResult.passedCount} / {runResult.totalCount}
                  </p>
                </header>
                <div className="workspace-test-grid">
                  {runResult.tests.map((test) => (
                    <article
                      key={`run-${test.id}`}
                      className={`workspace-test-card ${test.passed ? "passed" : "failed"}`}
                    >
                      <p className="workspace-test-title">
                        {test.id} - {test.passed ? "Pass" : "Fail"}
                      </p>
                      <p className="workspace-test-meta">{test.statusDescription}</p>
                      {test.note ? <p className="workspace-test-meta">{test.note}</p> : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {submitResult ? (
              <section className="workspace-results submit-results">
                <header className="workspace-results-head">
                  <h3>
                    Full Submit:{" "}
                    {submitResult.overallStatus === "accepted" ? "Accepted" : "Needs Work"}
                  </h3>
                  <p>
                    Passed {submitResult.passedCount} / {submitResult.totalCount} (visible + hidden)
                  </p>
                  <p className="workspace-test-meta">Session: {submitResult.sessionId}</p>
                </header>

                <div className="workspace-test-grid">
                  {submitResult.tests.map((test) => (
                    <article
                      key={`submit-${test.id}`}
                      className={`workspace-test-card ${test.passed ? "passed" : "failed"}`}
                    >
                      <p className="workspace-test-title">
                        {test.id}
                        {test.isHidden ? " (Hidden)" : " (Visible)"} - {test.passed ? "Pass" : "Fail"}
                      </p>
                      <p className="workspace-test-meta">{test.statusDescription}</p>
                      {test.stderr ? (
                        <p>
                          <strong>Stderr:</strong> {test.stderr}
                        </p>
                      ) : null}
                      {test.compileOutput ? (
                        <p>
                          <strong>Compile:</strong> {test.compileOutput}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {analysisResult ? (
              <section className="workspace-results analysis-results">
                <header className="workspace-results-head">
                  <h3>AI Analysis</h3>
                  <p>{analysisResult.summary}</p>
                  <p className="workspace-test-meta">
                    Estimated Complexity: {analysisResult.timeComplexity ?? "Unknown"}
                  </p>
                </header>

                <div className="analysis-concepts">
                  {Object.entries(analysisResult.conceptBreakdown).map(([concept, details]) => (
                    <article key={concept} className="analysis-concept-card">
                      <p className="analysis-concept-name">{toReadableLabel(concept)}</p>
                      <p>Count: {details.count}</p>
                      <p>Confidence: {(details.confidence * 100).toFixed(0)}%</p>
                    </article>
                  ))}
                </div>

                <section className="analysis-recommendations">
                  <h4>Recommendations</h4>
                  <ul>
                    {analysisResult.recommendations.map((recommendation) => (
                      <li key={recommendation}>{recommendation}</li>
                    ))}
                  </ul>
                </section>

                <section className="analysis-timeline">
                  <h4>Attempt Timeline</h4>
                  <div className="analysis-timeline-list">
                    {analysisResult.attemptTimeline.map((entry) => (
                      <article key={entry.attempt_id} className="analysis-timeline-item">
                        <div className="analysis-timeline-head">
                          <p>Attempt #{entry.attempt_id}</p>
                          <span>{toReadableEnum(entry.status)}</span>
                        </div>
                        <p className="workspace-test-meta">
                          {entry.error_type
                            ? `Error: ${toReadableEnum(entry.error_type)}`
                            : "No execution error recorded."}
                        </p>
                        <p className="workspace-test-meta">
                          {entry.submitted_at
                            ? `Submitted: ${new Date(entry.submitted_at).toLocaleString()}`
                            : "Submitted time unavailable."}
                        </p>
                        <p className="workspace-test-meta">
                          {entry.change_summary ?? "Change summary unavailable."}
                        </p>
                        <p className="workspace-test-meta">
                          Delta: +{entry.lines_added ?? 0} / -{entry.lines_removed ?? 0} lines
                        </p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="analysis-diff">
                  <div className="analysis-diff-head">
                    <h4>Attempt Diff Viewer</h4>
                    <div className="analysis-diff-controls">
                      <label>
                        From
                        <select
                          value={leftAttemptId ?? ""}
                          onChange={(event) => setLeftAttemptId(Number(event.target.value))}
                        >
                          {attemptSnapshots.map((attempt) => (
                            <option key={`left-${attempt.id}`} value={attempt.id}>
                              Attempt #{attempt.id}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        To
                        <select
                          value={rightAttemptId ?? ""}
                          onChange={(event) => setRightAttemptId(Number(event.target.value))}
                        >
                          {attemptSnapshots.map((attempt) => (
                            <option key={`right-${attempt.id}`} value={attempt.id}>
                              Attempt #{attempt.id}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  {selectedLeftAttempt && selectedRightAttempt ? (
                    <div className="analysis-diff-table" role="table" aria-label="Attempt code diff">
                      {diffRows.map((row, index) => (
                        <div key={`${index}-${row.kind}`} className={`analysis-diff-row ${row.kind}`} role="row">
                          <div className="analysis-diff-cell" role="cell">
                            <span>{row.leftNumber ?? ""}</span>
                            <code>{row.leftText || " "}</code>
                          </div>
                          <div className="analysis-diff-cell" role="cell">
                            <span>{row.rightNumber ?? ""}</span>
                            <code>{row.rightText || " "}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="workspace-test-meta">Submit attempts to compare code versions.</p>
                  )}
                </section>
              </section>
            ) : null}
          </article>
        </section>
      ) : null}
    </main>
  );
}
