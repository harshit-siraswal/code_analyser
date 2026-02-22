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
  onAuthStateChanged,
  signInWithEmailAndPassword,
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          await syncBackendSession(nextUser);
          setError(null);
        } catch (err) {
          // Backend sync endpoint may not exist yet during early setup.
          // Keep frontend auth usable and proceed with Firebase session.
          console.warn("Backend session sync skipped.", err);
          setError(null);
        }
      } else {
        setError(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    await createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const getIdToken = useCallback(async () => user?.getIdToken() ?? null, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      signInWithEmail,
      signUpWithEmail,
      signOutUser,
      getIdToken
    }),
    [error, getIdToken, loading, signInWithEmail, signOutUser, signUpWithEmail, user]
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
