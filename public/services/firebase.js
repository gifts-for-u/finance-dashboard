import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  enableNetwork,
  disableNetwork,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { ensureFirebase } from "../firebase-core.js";

let db = null;
let auth = null;

const firebaseStateReady = ensureFirebase().then((services) => {
  db = services.db;
  auth = services.auth;
  return services;
});

export const firebaseReady = firebaseStateReady;

export function getFirestoreDb() {
  if (!db) {
    throw new Error("Firestore has not been initialised yet.");
  }
  return db;
}

export function getAuthInstance() {
  if (!auth) {
    throw new Error("Firebase Auth has not been initialised yet.");
  }
  return auth;
}

export async function listenToAuthChanges(callback) {
  const { auth: readyAuth } = await firebaseStateReady;
  return onAuthStateChanged(readyAuth, callback);
}

export async function performFirebaseSignOut() {
  const { auth: readyAuth } = await firebaseStateReady;
  return firebaseSignOut(readyAuth);
}

export { enableNetwork, disableNetwork };

const USER_STATE_KEY = "__FINANCE_DASHBOARD_CURRENT_USER__";

export function getCurrentUser() {
  if (typeof window === "undefined") {
    return null;
  }
  return window[USER_STATE_KEY] ?? null;
}

export function setCurrentUser(user) {
  if (typeof window !== "undefined") {
    window[USER_STATE_KEY] = user ?? null;
  }
}

export function requireCurrentUser() {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("No authenticated user is available for this operation.");
  }
  return user;
}
