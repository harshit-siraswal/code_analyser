import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User
} from "firebase/auth";
import { auth } from "../firebase";
import { apiFetch } from "../lib/api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function syncBackendSession(user: User): Promise<void> {
  const token = await user.getIdToken();
  await apiFetch<{ ok: boolean }>("/auth/session", {
    method: "POST",
    token,
    body: {}
  });
}

function requiresVerifiedEmail(user: User): boolean {
  const hasPasswordProvider = user.providerData.some((provider) => provider?.providerId === "password");
  return hasPasswordProvider && !user.emailVerified;
}

function formatAuthError(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : "Authentication failed. Please try again.";
  }

  switch (error.code) {
    case "auth/popup-blocked":
    case "auth/popup-closed-by-user":
      return "Google sign-in popup was blocked or closed. Please try again.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase. Add your Vercel domain in Firebase Auth > Settings > Authorized domains.";
    case "auth/operation-not-allowed":
      return "Google sign-in is disabled in Firebase. Enable Google provider in Authentication > Sign-in method.";
    case "auth/account-exists-with-different-credential":
      return "This email is already linked to a different sign-in method. Use your existing method first.";
    case "auth/network-request-failed":
      return "Network error while signing in. Check your connection and try again.";
    default:
      return error.message || "Authentication failed. Please try again.";
  }
}

function shouldFallbackToRedirect(error: unknown): boolean {
  if (!(error instanceof FirebaseError)) {
    return false;
  }

  const fallbackCodes = new Set([
    "auth/popup-blocked",
    "auth/popup-closed-by-user",
    "auth/cancelled-popup-request",
    "auth/operation-not-supported-in-this-environment"
  ]);

  return fallbackCodes.has(error.code);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        await nextUser.reload();
      } catch (err) {
        console.warn("Could not refresh auth state from Firebase.", err);
      }

      if (requiresVerifiedEmail(nextUser)) {
        setUser(null);
        setError("Verify your email before signing in.");
        setLoading(false);
        await signOut(auth);
        return;
      }

      setUser(nextUser);
      try {
        await syncBackendSession(nextUser);
        setError(null);
      } catch (err) {
        // Backend sync endpoint may not exist yet during early setup.
        // Keep frontend auth usable and proceed with Firebase session.
        console.warn("Backend session sync skipped.", err);
        setError(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function finishRedirectFlow() {
      try {
        await getRedirectResult(auth);
      } catch (err) {
        if (isMounted) {
          setError(formatAuthError(err));
        }
      }
    }

    void finishRedirectFlow();

    return () => {
      isMounted = false;
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    let credential: Awaited<ReturnType<typeof signInWithEmailAndPassword>>;
    try {
      credential = await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error(formatAuthError(err));
    }

    await credential.user.reload();
    if (!requiresVerifiedEmail(credential.user)) {
      return;
    }

    try {
      await sendEmailVerification(credential.user);
    } catch (err) {
      console.warn("Could not send verification email.", err);
    } finally {
      await signOut(auth);
    }

    throw new Error("Verify your email before signing in. A new verification link was sent.");
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (shouldFallbackToRedirect(err)) {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw new Error(formatAuthError(err));
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    let credential: Awaited<ReturnType<typeof createUserWithEmailAndPassword>>;
    try {
      credential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error(formatAuthError(err));
    }

    await sendEmailVerification(credential.user);
    await signOut(auth);
  }, []);

  const signOutUser = useCallback(async () => {
    setError(null);
    await signOut(auth);
  }, []);

  const getIdToken = useCallback(async () => user?.getIdToken() ?? null, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      signInWithEmail,
      signInWithGoogle,
      signUpWithEmail,
      signOutUser,
      getIdToken
    }),
    [error, getIdToken, loading, signInWithEmail, signInWithGoogle, signOutUser, signUpWithEmail, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
