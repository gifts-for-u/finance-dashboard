// Firebase configuration loader
// Priority:
// 1. Environment variables (Vite import.meta.env)
// 2. Window runtime config (window.__FIREBASE_CONFIG__ or window.firebaseConfig)
// 3. HTML meta tag (meta[name="firebase-config"])
// 4. Firebase Hosting init endpoint (/__/firebase/init.json)

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

function getMissingConfigFallback() {
  if (typeof import.meta !== "undefined" && import.meta.env?.MODE === "test") {
    return {
      apiKey: "test-api-key",
      authDomain: "localhost",
      projectId: "demo-finance-dashboard",
    };
  }

  console.error(
    "[firebase-config] Missing Firebase configuration. Supply VITE_FIREBASE_* in .env or deploy to Firebase Hosting (/__/firebase/init.json)."
  );
  return {
    apiKey: "missing-api-key",
    authDomain: "localhost",
    projectId: "missing-project-id",
  };
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

  return getMissingConfigFallback();
}

export function getFirebaseConfigSync() {
  for (const source of CONFIG_SOURCES) {
    const config = normaliseConfig(source?.());
    if (config) {
      return config;
    }
  }

  return getMissingConfigFallback();
}
