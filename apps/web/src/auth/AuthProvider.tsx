import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
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

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    const credential = await signInWithEmailAndPassword(auth, email, password);
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
    await signInWithPopup(auth, provider);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    const credential = await createUserWithEmailAndPassword(auth, email, password);
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
