type AuthVisualMode = "login" | "register" | "landing";

const MODE_COPY: Record<
  AuthVisualMode,
  {
    title: string;
    subtitle: string;
  }
> = {
  login: {
    title: "Trace your thinking, not just your score.",
    subtitle: "Every run becomes a signal that helps you fix patterns faster."
  },
  register: {
    title: "Build mastery from attempt history.",
    subtitle: "Start with guided feedback loops built for deliberate practice."
  },
  landing: {
    title: "Practice with structured feedback loops.",
    subtitle: "Run, submit, analyze, and iterate with a timeline that explains progress."
  }
};

export function AuthVisual({ mode }: { mode: AuthVisualMode }) {
  const copy = MODE_COPY[mode];

  return (
    <aside className="auth-visual" aria-hidden="true">
      <p className="visual-tag">Deep Analysis Engine</p>
      <h2>{copy.title}</h2>
      <p className="visual-subtitle">{copy.subtitle}</p>

      <div className="signal-wrapper">
        <svg className="signal-svg" viewBox="0 0 680 420" role="presentation">
          <defs>
            <linearGradient id="signal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff7a18" />
              <stop offset="45%" stopColor="#ffbf47" />
              <stop offset="100%" stopColor="#ffe3a3" />
            </linearGradient>
            <linearGradient id="arc-gradient" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#f3efe7" stopOpacity="0" />
              <stop offset="45%" stopColor="#f3efe7" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#f3efe7" stopOpacity="0" />
            </linearGradient>
            <filter id="soft-blur">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>

          <path className="signal-grid" d="M 0 360 Q 220 320 460 350 T 680 335" />
          <path
            className="signal-path"
            d="M 20 280 C 105 255, 140 145, 208 155 C 278 165, 280 292, 348 292 C 418 292, 432 116, 503 120 C 572 126, 594 258, 662 248"
          />

          <path className="signal-arc" d="M 8 202 Q 336 28 670 192" />
          <path className="signal-arc sweep" d="M 8 202 Q 336 28 670 192" />

          <circle className="signal-node node-a" cx="208" cy="155" r="11" />
          <circle className="signal-node node-b" cx="348" cy="292" r="11" />
          <circle className="signal-node node-c" cx="503" cy="120" r="11" />

          <circle className="signal-glow glow-a" cx="208" cy="155" r="21" filter="url(#soft-blur)" />
          <circle className="signal-glow glow-b" cx="503" cy="120" r="22" filter="url(#soft-blur)" />
        </svg>
      </div>

      <ul className="visual-list">
        <li>Session-level timeline across attempts</li>
        <li>Concept extraction with gap highlights</li>
        <li>Failure patterns converted into next actions</li>
      </ul>
    </aside>
  );
}
