import {
  initializeApp,
  getApps,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { loadFirebaseConfig } from "./firebase-config.js";

const GLOBAL_STATE_KEY = "__FINANCE_DASHBOARD_FIREBASE__";

const firebaseState =
  typeof window !== "undefined" && window[GLOBAL_STATE_KEY]
    ? window[GLOBAL_STATE_KEY]
    : {
        promise: null,
        app: null,
        db: null,
        auth: null,
      };

if (typeof window !== "undefined") {
  window[GLOBAL_STATE_KEY] = firebaseState;
}

export function ensureFirebase() {
  if (!firebaseState.promise) {
    firebaseState.promise = initialiseFirebase();
  }
  return firebaseState.promise;
}

async function initialiseFirebase() {
  const config = await loadFirebaseConfig();
  if (!config?.apiKey) {
    throw new Error(
      "Firebase configuration is missing. Provide a valid config before using Firebase services.",
    );
  }

  const existingApp = getApps()[0];
  const appInstance = existingApp ?? initializeApp(config);
  const dbInstance = getFirestore(appInstance);
  const authInstance = getAuth(appInstance);

  firebaseState.app = appInstance;
  firebaseState.db = dbInstance;
  firebaseState.auth = authInstance;

  return {
    app: appInstance,
    db: dbInstance,
    auth: authInstance,
  };
}

export function getFirebaseAppSync() {
  return firebaseState.app;
}

export function getFirestoreSync() {
  return firebaseState.db;
}

export function getAuthSync() {
  return firebaseState.auth;
}
