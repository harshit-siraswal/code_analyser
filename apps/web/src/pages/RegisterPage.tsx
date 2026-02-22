import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthVisual } from "../components/AuthVisual";
import { GoogleLogo } from "../components/GoogleLogo";

export function RegisterPage() {
  const { signUpWithEmail, signInWithGoogle, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await signUpWithEmail(email, password);
      navigate("/login", {
        replace: true,
        state: {
          verificationNotice: `Verification email sent to ${email}. Verify your email before signing in.`
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogleClick() {
    setGoogleSubmitting(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate("/problems", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-layout">
        <AuthVisual mode="register" />

        <section className="auth-card">
          <p className="eyebrow">Create Account</p>
          <h1>Start with Code Analyser</h1>
          <p className="subtitle">Track attempts, detect patterns, and improve with deliberate loops.</p>

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
            <span>or create an email account</span>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />

            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />

            <label htmlFor="register-confirm-password">Confirm password</label>
            <input
              id="register-confirm-password"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />

            <button type="submit" className="cta-btn form-btn" disabled={submitting}>
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {error ? <p className="error-text">{error}</p> : null}
          {authError ? <p className="error-text">{authError}</p> : null}

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </section>
      </section>
    </main>
  );
}
