import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getFirebaseConfigSync } from '../firebase-config';

const firebaseConfig = getFirebaseConfigSync();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Firebase App Check if site key is configured
const recaptchaSiteKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RECAPTCHA_SITE_KEY) ||
  (typeof window !== 'undefined' && window.__RECAPTCHA_SITE_KEY__);

let appCheck = null;
if (typeof window !== 'undefined' && recaptchaSiteKey) {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      // In dev mode, allow debug token
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn('Firebase App Check initialization skipped/failed:', error);
  }
}

export { app, db, auth, appCheck };
