import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { env } from "./env";

const app = initializeApp({
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  measurementId: env.firebase.measurementId,
  appId: env.firebase.appId
});

export const auth = getAuth(app);

export async function enableAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") {
    return null;
  }

  if (!env.firebase.measurementId) {
    return null;
  }

  const supported = await isSupported();
  if (!supported) {
    return null;
  }

  return getAnalytics(app);
}
