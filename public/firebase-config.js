const FALLBACK_CONFIG = {
  apiKey: "AIzaSyDxmGNxzxbX8UGBm82jn3PmzhiGq0GQT7Y",
  authDomain: "finance-dashboard-10nfl.firebaseapp.com",
  projectId: "finance-dashboard-10nfl",
  storageBucket: "finance-dashboard-10nfl.firebasestorage.app",
  messagingSenderId: "875656039609",
  appId: "1:875656039609:web:4f5e11a81c58de312f9f68",
};

const CONFIG_SOURCES = [
  () => window.__FIREBASE_CONFIG__,
  () => window.firebaseConfig,
  () => {
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

  console.warn(
    "Falling back to default Firebase configuration. Update public/firebase-config.js or provide a runtime config.",
  );
  return { ...FALLBACK_CONFIG };
}

export function getFirebaseConfigSync() {
  for (const source of CONFIG_SOURCES) {
    const config = normaliseConfig(source?.());
    if (config) {
      return config;
    }
  }

  return { ...FALLBACK_CONFIG };
}
