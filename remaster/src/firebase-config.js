// Firebase configuration loader
// Priority:
// 1. Environment variables (Vite import.meta.env)
// 2. Window runtime config (window.__FIREBASE_CONFIG__ or window.firebaseConfig)
// 3. HTML meta tag (meta[name="firebase-config"])
// 4. Firebase Hosting init endpoint (/__/firebase/init.json)
// 5. LEGACY_FALLBACK_CONFIG (see security notes below)
//
// SECURITY NOTE:
// LEGACY_FALLBACK_CONFIG is a tech-debt fallback retained for backward
// compatibility. It MUST NOT be relied upon for production deployments.
// Production sites on Firebase Hosting should resolve via the init.json
// endpoint (priority 4). Local development should set VITE_FIREBASE_* env
// variables (priority 1). When this fallback is used, a loud console.error
// is emitted so the situation is visible during debugging and audits.

const LEGACY_FALLBACK_CONFIG = {
  apiKey: "AIzaSyDxmGNxzxbX8UGBm82jn3PmzhiGq0GQT7Y",
  authDomain: "finance-dashboard-10nfl.firebaseapp.com",
  projectId: "finance-dashboard-10nfl",
  storageBucket: "finance-dashboard-10nfl.firebasestorage.app",
  messagingSenderId: "875656039609",
  appId: "1:875656039609:web:4f5e11a81c58de312f9f68",
};

const CONFIG_SOURCES = [
  () => {
    if (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_API_KEY) {
      return {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      };
    }
    return null;
  },
  () => (typeof window !== "undefined" ? window.__FIREBASE_CONFIG__ : null),
  () => (typeof window !== "undefined" ? window.firebaseConfig : null),
  () => {
    if (typeof document === "undefined") return null;
    const meta = document.querySelector('meta[name="firebase-config"]');
    if (!meta?.content) return null;
    try {
      return JSON.parse(meta.content);
    } catch (error) {
      console.warn("Unable to parse firebase-config meta tag:", error);
      return null;
    }
  },
];

function normaliseConfig(config) {
  if (!config) return null;
  const normalised = {
    apiKey: config.apiKey || config.api_key,
    authDomain: config.authDomain || config.auth_domain,
    projectId: config.projectId || config.project_id,
    storageBucket: config.storageBucket || config.storage_bucket,
    messagingSenderId:
      config.messagingSenderId || config.messaging_sender_id,
    appId: config.appId || config.app_id,
    measurementId: config.measurementId || config.measurement_id,
  };

  return normalised.apiKey ? normalised : null;
}

async function fetchHostingConfig() {
  try {
    const response = await fetch("/__/firebase/init.json", {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }

    const config = await response.json();
    return normaliseConfig(config);
  } catch (error) {
    console.warn("Unable to load Firebase config from hosting:", error);
    return null;
  }
}

let firebaseConfigPromise = null;

export async function loadFirebaseConfig() {
  if (!firebaseConfigPromise) {
    firebaseConfigPromise = resolveFirebaseConfig();
  }
  return firebaseConfigPromise;
}

async function resolveFirebaseConfig() {
  for (const source of CONFIG_SOURCES) {
    const config = normaliseConfig(source?.());
    if (config) {
      return config;
    }
  }

  const hostingConfig = await fetchHostingConfig();
  if (hostingConfig) {
    return hostingConfig;
  }

  console.error(
    "[firebase-config] All config resolution sources exhausted. " +
    "Falling back to LEGACY_FALLBACK_CONFIG (hardcoded). This is a " +
    "tech-debt fallback — production deployments MUST supply config via " +
    "Firebase Hosting init.json (/__/firebase/init.json) or VITE_FIREBASE_* env vars. " +
    "If you see this in production, audit your config deployment. " +
    "See PRD.md Section 8.3 and AGENTS.md Section 2.2 for details."
  );
  return { ...LEGACY_FALLBACK_CONFIG };
}

export function getFirebaseConfigSync() {
  for (const source of CONFIG_SOURCES) {
    const config = normaliseConfig(source?.());
    if (config) {
      return config;
    }
  }

  console.error(
    "[firebase-config] getFirebaseConfigSync: no config source available, " +
    "returning LEGACY_FALLBACK_CONFIG. See firebase-config.js header for details."
  );
  return { ...LEGACY_FALLBACK_CONFIG };
}
