const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
const firebaseAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
const firebaseStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();
const firebaseMessagingSenderId =
  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
const firebaseAppId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();
const firebaseMeasurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim();

function assertEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  apiBaseUrl: assertEnv("VITE_API_BASE_URL", apiBaseUrl),
  firebase: {
    apiKey: assertEnv("VITE_FIREBASE_API_KEY", firebaseApiKey),
    authDomain: assertEnv("VITE_FIREBASE_AUTH_DOMAIN", firebaseAuthDomain),
    projectId: assertEnv("VITE_FIREBASE_PROJECT_ID", firebaseProjectId),
    storageBucket: assertEnv("VITE_FIREBASE_STORAGE_BUCKET", firebaseStorageBucket),
    messagingSenderId: assertEnv(
      "VITE_FIREBASE_MESSAGING_SENDER_ID",
      firebaseMessagingSenderId
    ),
    appId: assertEnv("VITE_FIREBASE_APP_ID", firebaseAppId),
    measurementId: firebaseMeasurementId || undefined
  }
};
