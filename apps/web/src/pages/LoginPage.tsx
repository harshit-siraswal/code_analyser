import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthVisual } from "../components/AuthVisual";
import { GoogleLogo } from "../components/GoogleLogo";

type LoginLocationState = {
  from?: string;
  verificationNotice?: string;
};

export function LoginPage() {
  const { signInWithEmail, signInWithGoogle, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LoginLocationState | null) ?? null;
  const nextPath = locationState?.from ?? "/problems";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await signInWithEmail(email, password);
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogleClick() {
    setGoogleSubmitting(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-layout">
        <AuthVisual mode="login" />

        <section className="auth-card">
          <p className="eyebrow">Welcome Back</p>
          <h1>Sign in to Code Analyser</h1>
          <p className="subtitle">Continue your sessions and inspect attempt-level patterns.</p>

          {locationState?.verificationNotice ? (
            <p className="info-text">{locationState.verificationNotice}</p>
          ) : null}

          <button
            type="button"
            className="google-btn"
            disabled={googleSubmitting}
            onClick={() => void onGoogleClick()}
          >
            <GoogleLogo />
            <span>{googleSubmitting ? "Connecting..." : "Continue with Google"}</span>
          </button>

          <div className="auth-divider" aria-hidden="true">
            <span>or sign in with email</span>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />

            <button type="submit" className="cta-btn form-btn" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {error ? <p className="error-text">{error}</p> : null}
          {authError ? <p className="error-text">{authError}</p> : null}

          <p className="auth-footer">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </section>
      </section>
    </main>
  );
}
