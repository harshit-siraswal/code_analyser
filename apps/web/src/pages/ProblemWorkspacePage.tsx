import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
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

type LanguageOption = {
  id: number;
  name: string;
};

type LanguagesResponse = {
  languages: LanguageOption[];
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
    analysisMode?: string;
    llmProvider?: string | null;
    createdAt: string;
  };
  attempts: SessionAttemptSnapshot[];
};

const FALLBACK_LANGUAGES: LanguageOption[] = [
  { id: 71, name: "Python (3.x)" },
  { id: 50, name: "C (GCC)" },
  { id: 54, name: "C++ (GCC)" },
  { id: 62, name: "Java (OpenJDK)" }
];

function toReadableLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toReadableEnum(value: string): string {
  return toReadableLabel(value.toLowerCase());
}

function compactOutput(value: string | null): string {
  if (!value) {
    return "";
  }
  return value.trim().replace(/\s+/g, " ").slice(0, 240);
}

function formatIo(value: string | null | undefined): string {
  const normalized = (value ?? "").replace(/\r\n/g, "\n").trimEnd();
  return normalized.length > 0 ? normalized : "<empty>";
}

function buildStarterCode(problem: ProblemDetail, languageId: number): string {
  if (languageId === 71) {
    return problem.starterCode;
  }

  if (languageId === 50) {
    return `#include <stdio.h>

int main() {
    // Read from stdin and print to stdout exactly as expected by tests.
    return 0;
}`;
  }

  if (languageId === 54) {
    return `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Read from stdin and print to stdout exactly as expected by tests.
    return 0;
}`;
  }

  if (languageId === 62) {
    return `import java.io.*;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // Read input from br and print exact expected output.
    }
}`;
  }

  return problem.starterCode;
}

function formatTerminal(
  action: "run" | "submit",
  languageName: string,
  payload: { overallStatus: string; passedCount: number; totalCount: number; tests: ExecutionTestResult[] }
): string[] {
  const lines = [
    `$ ${action} --language "${languageName}"`,
    `status: ${payload.overallStatus}`,
    `passed: ${payload.passedCount}/${payload.totalCount}`,
    ""
  ];

  for (const test of payload.tests.slice(0, 8)) {
    lines.push(`${test.id}${test.isHidden ? " [hidden]" : ""}: ${test.statusDescription}`);

    const stdout = compactOutput(test.stdout);
    if (stdout) {
      lines.push(`  stdout: ${stdout}`);
    }

    const stderr = compactOutput(test.stderr);
    if (stderr) {
      lines.push(`  stderr: ${stderr}`);
    }

    const compileOutput = compactOutput(test.compileOutput);
    if (compileOutput) {
      lines.push(`  compile: ${compileOutput}`);
    }
  }

  return lines;
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
  const [searchParams] = useSearchParams();
  const hydratedSessionRef = useRef<string | null>(null);
  const workspaceRef = useRef<HTMLElement | null>(null);
  const requestedSessionId = searchParams.get("sessionId");
  const shouldAutoAnalyze = searchParams.get("autoAnalyze") === "1";
  const [focusMode, setFocusMode] = useState(false);
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [code, setCode] = useState("");
  const [languages, setLanguages] = useState<LanguageOption[]>(FALLBACK_LANGUAGES);
  const [languageId, setLanguageId] = useState<number>(71);
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
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "Terminal ready. Select a language and run visible tests."
  ]);

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
      hydratedSessionRef.current = null;
      setTerminalLines(["Terminal ready. Select a language and run visible tests."]);

      try {
        const problemPromise = apiFetch<ProblemDetailResponse>(`/problems/${nextSlug}`);
        const languagesPromise = apiFetch<LanguagesResponse>("/languages").catch(() => ({
          languages: FALLBACK_LANGUAGES
        }));

        const [problemResponse, languagesResponse] = await Promise.all([problemPromise, languagesPromise]);
        if (!isMounted) {
          return;
        }

        const availableLanguages =
          languagesResponse.languages.length > 0 ? languagesResponse.languages : FALLBACK_LANGUAGES;
        const defaultLanguage =
          availableLanguages.find((language) => language.id === 71) ?? availableLanguages[0];

        if (!defaultLanguage) {
          throw new Error("No supported language available.");
        }

        setLanguages(availableLanguages);
        setLanguageId(defaultLanguage.id);
        setProblem(problemResponse.problem);
        setCode(buildStarterCode(problemResponse.problem, defaultLanguage.id));
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

  const selectedLanguage = useMemo(() => {
    return languages.find((language) => language.id === languageId) ?? languages[0] ?? null;
  }, [languageId, languages]);

  const visibleSubmitTests = useMemo(
    () => (submitResult ? submitResult.tests.filter((test) => !test.isHidden) : []),
    [submitResult]
  );

  const hiddenSubmitTests = useMemo(
    () => (submitResult ? submitResult.tests.filter((test) => Boolean(test.isHidden)) : []),
    [submitResult]
  );

  const hiddenSubmitPassed = useMemo(
    () => hiddenSubmitTests.filter((test) => test.passed).length,
    [hiddenSubmitTests]
  );

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

  function applyAnalysisResult(
    targetSessionId: string,
    response: AnalyzeResponse,
    commandLabel: string
  ) {
    setSessionId(targetSessionId);
    setAnalysisResult(response.analysis);
    setAttemptSnapshots(response.attempts);
    setTerminalLines([
      commandLabel,
      `summary: ${response.analysis.summary}`,
      `complexity: ${response.analysis.timeComplexity ?? "Unknown"}`,
      `recommendations: ${response.analysis.recommendations.length}`
    ]);
  }

  async function generateAnalysisForSession(targetSessionId: string) {
    const token = await getIdToken();
    if (!token) {
      throw new Error("You need to sign in before analyzing.");
    }

    const response = await apiFetch<AnalyzeResponse>(`/sessions/${targetSessionId}/analyze`, {
      method: "POST",
      token,
      body: {}
    });

    applyAnalysisResult(targetSessionId, response, `$ analyze --session ${targetSessionId}`);
  }

  async function loadOrGenerateAnalysis(targetSessionId: string) {
    const token = await getIdToken();
    if (!token) {
      throw new Error("You need to sign in before analyzing.");
    }

    try {
      const saved = await apiFetch<AnalyzeResponse>(`/sessions/${targetSessionId}/analysis`, {
        token
      });
      applyAnalysisResult(targetSessionId, saved, `$ analyze --session ${targetSessionId} --load`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (!message.includes("not generated")) {
        throw error;
      }
    }

    const generated = await apiFetch<AnalyzeResponse>(`/sessions/${targetSessionId}/analyze`, {
      method: "POST",
      token,
      body: {}
    });
    applyAnalysisResult(targetSessionId, generated, `$ analyze --session ${targetSessionId}`);
  }

  async function onRunVisibleTests() {
    if (!problem) {
      return;
    }

    setRunning(true);
    setRunError(null);

    try {
      const selectedLanguageName = selectedLanguage?.name ?? "Unknown";
      const response = await apiFetch<RunResponse>(`/problems/${problem.slug}/run`, {
        method: "POST",
        body: { code, languageId }
      });
      setRunResult(response);
      setTerminalLines(formatTerminal("run", selectedLanguageName, response));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not run tests.";
      setRunError(message);
      setTerminalLines([`$ run --language "${selectedLanguage?.name ?? "Unknown"}"`, `error: ${message}`]);
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
            body: { code, sessionId, languageId }
          })
        : await apiFetch<SubmitResponse>(`/problems/${problem.slug}/submit`, {
            method: "POST",
            token,
            body: { code, languageId }
          });

      setSubmitResult(response);
      setSessionId(response.sessionId);
      setTerminalLines(formatTerminal("submit", selectedLanguage?.name ?? "Unknown", response));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit solution.";
      setSubmitError(message);
      setTerminalLines([`$ submit --language "${selectedLanguage?.name ?? "Unknown"}"`, `error: ${message}`]);
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
      await generateAnalysisForSession(sessionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not analyze session.";
      setAnalysisError(message);
      setTerminalLines([`$ analyze --session ${sessionId}`, `error: ${message}`]);
    } finally {
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    if (!problem || loading || Boolean(error) || !requestedSessionId) {
      return;
    }

    if (hydratedSessionRef.current === requestedSessionId) {
      return;
    }

    hydratedSessionRef.current = requestedSessionId;
    setSessionId(requestedSessionId);

    if (!shouldAutoAnalyze) {
      setTerminalLines([
        `$ session ${requestedSessionId}`,
        "Session restored from dashboard. Click Analyze to refresh insights."
      ]);
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    void loadOrGenerateAnalysis(requestedSessionId)
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Could not analyze session.";
        setAnalysisError(message);
        setTerminalLines([`$ analyze --session ${requestedSessionId}`, `error: ${message}`]);
      })
      .finally(() => {
        setAnalyzing(false);
      });
  }, [error, loading, problem, requestedSessionId, shouldAutoAnalyze]);

  useEffect(() => {
    const onFullScreenChange = () => {
      setFocusMode(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullScreenChange);
    };
  }, []);

  async function onToggleFocusMode() {
    try {
      if (!document.fullscreenElement) {
        await workspaceRef.current?.requestFullscreen?.();
        setFocusMode(true);
      } else {
        await document.exitFullscreen();
        setFocusMode(false);
      }
    } catch {
      setFocusMode((current) => !current);
    }
  }

  function onResetStarter() {
    if (!problem) {
      return;
    }

    setCode(buildStarterCode(problem, languageId));
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
    setTerminalLines(["Starter template restored."]);
  }

  function onLanguageChange(nextLanguageId: number) {
    setLanguageId(nextLanguageId);

    if (!problem) {
      return;
    }

    setCode(buildStarterCode(problem, nextLanguageId));
    setRunResult(null);
    setSubmitResult(null);
    setAnalysisResult(null);
    setAttemptSnapshots([]);
    setLeftAttemptId(null);
    setRightAttemptId(null);

    const selected = languages.find((language) => language.id === nextLanguageId);
    setTerminalLines([`Language switched to ${selected?.name ?? nextLanguageId}. Starter template loaded.`]);
  }

  return (
    <main
      ref={workspaceRef}
      className={`page workspace-page${focusMode ? " focus-mode" : ""}`}
    >
      <header className="workspace-header card">
        <div>
          <p className="eyebrow">Problem Workspace</p>
          <h1>{problem?.title ?? "Loading..."}</h1>
          <p className="workspace-subtitle">
            End-to-end flow: run visible tests, submit full evaluation, then analyze your session.
          </p>
        </div>
        <div className="workspace-header-actions">
          <button type="button" className="ghost-btn" onClick={() => void onToggleFocusMode()}>
            {focusMode ? "Exit Focus Mode" : "Focus Mode"}
          </button>
          <Link to="/problems" className="ghost-btn">
            Back To Catalog
          </Link>
        </div>
      </header>

      {!focusMode ? (
        <section className="workspace-stepper card">
          {flowSteps.map((step, index) => (
            <div key={step.title} className={`workspace-step ${step.done ? "done" : ""}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{step.title}</p>
            </div>
          ))}
        </section>
      ) : null}

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
              <label className="workspace-language-picker">
                <span>Language</span>
                <select
                  value={languageId}
                  onChange={(event) => onLanguageChange(Number(event.target.value))}
                >
                  {languages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.name}
                    </option>
                  ))}
                </select>
              </label>
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

            {!focusMode ? (
              <section className="workspace-terminal">
                <header className="workspace-terminal-head">
                  <h4>Terminal</h4>
                  <p>{selectedLanguage?.name ?? "Language unavailable"}</p>
                </header>
                <pre>{terminalLines.join("\n")}</pre>
              </section>
            ) : null}

            {runError ? <p className="error-text">{runError}</p> : null}
            {submitError ? <p className="error-text">{submitError}</p> : null}
            {analysisError ? <p className="error-text">{analysisError}</p> : null}

            {!focusMode && runResult ? (
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
                      <p className="workspace-test-meta">Input</p>
                      <pre className="workspace-io-block">{formatIo(test.input)}</pre>
                      <p className="workspace-test-meta">Expected Output</p>
                      <pre className="workspace-io-block">{formatIo(test.expectedOutput)}</pre>
                      <p className="workspace-test-meta">Your Output</p>
                      <pre className="workspace-io-block">{formatIo(test.stdout)}</pre>
                      {test.stderr ? (
                        <>
                          <p className="workspace-test-meta">Runtime Error</p>
                          <pre className="workspace-io-block">{formatIo(test.stderr)}</pre>
                        </>
                      ) : null}
                      {test.compileOutput ? (
                        <>
                          <p className="workspace-test-meta">Compile Output</p>
                          <pre className="workspace-io-block">{formatIo(test.compileOutput)}</pre>
                        </>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {!focusMode && submitResult ? (
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
                  {visibleSubmitTests.map((test) => (
                    <article
                      key={`submit-${test.id}`}
                      className={`workspace-test-card ${test.passed ? "passed" : "failed"}`}
                    >
                      <p className="workspace-test-title">
                        {test.id} (Visible) - {test.passed ? "Pass" : "Fail"}
                      </p>
                      <p className="workspace-test-meta">{test.statusDescription}</p>
                      <p className="workspace-test-meta">Input</p>
                      <pre className="workspace-io-block">{formatIo(test.input)}</pre>
                      <p className="workspace-test-meta">Expected Output</p>
                      <pre className="workspace-io-block">{formatIo(test.expectedOutput)}</pre>
                      <p className="workspace-test-meta">Your Output</p>
                      <pre className="workspace-io-block">{formatIo(test.stdout)}</pre>
                      {test.stderr ? (
                        <>
                          <p className="workspace-test-meta">Runtime Error</p>
                          <pre className="workspace-io-block">{formatIo(test.stderr)}</pre>
                        </>
                      ) : null}
                      {test.compileOutput ? (
                        <>
                          <p className="workspace-test-meta">Compile Output</p>
                          <pre className="workspace-io-block">{formatIo(test.compileOutput)}</pre>
                        </>
                      ) : null}
                    </article>
                  ))}
                </div>

                {hiddenSubmitTests.length > 0 ? (
                  <div className="workspace-hidden-summary">
                    <p>
                      Hidden tests passed {hiddenSubmitPassed} / {hiddenSubmitTests.length}
                    </p>
                    <p>Hidden test inputs and expected outputs are intentionally not shown.</p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {!focusMode && analysisResult ? (
              <section className="workspace-results analysis-results">
                <header className="workspace-results-head">
                  <h3>AI Analysis</h3>
                  <p>{analysisResult.summary}</p>
                  <p className="workspace-test-meta">
                    Estimated Complexity: {analysisResult.timeComplexity ?? "Unknown"}
                  </p>
                  {analysisResult.analysisMode ? (
                    <p className="workspace-test-meta">
                      Analysis Mode: {toReadableLabel(analysisResult.analysisMode)}
                      {analysisResult.llmProvider ? ` (${analysisResult.llmProvider})` : ""}
                    </p>
                  ) : null}
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
