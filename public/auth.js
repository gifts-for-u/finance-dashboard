import {
  initializeApp,
  getApps,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { ensureFirebase } from "./firebase-core.js";

import { loadFirebaseConfig } from "./firebase-config.js";

let firebaseApp = null;
let auth = null;
let db = null;
let provider = null;

const firebaseReady = ensureFirebase().then((services) => {
  auth = services.auth;
  db = services.db;
  provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  return { auth, db };
});
const firebaseReady = initializeFirebase();

async function initializeFirebase() {
  const config = await loadFirebaseConfig();
  if (!config?.apiKey) {
    throw new Error(
      "Firebase configuration is missing. Provide a valid config before using auth.js.",
    );
  }

  const existingApp = getApps()[0];
  firebaseApp = existingApp ?? initializeApp(config);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");

  return { auth, db };
}

// Theme Functions
function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  const themeIcon = document.querySelector(".theme-toggle i");
  themeIcon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.setAttribute("data-theme", savedTheme);

  const themeIcon = document.querySelector(".theme-toggle i");
  themeIcon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
}

// Show/Hide Loading
function showLoading() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("googleLoginBtn").style.display = "none";
}

function hideLoading() {
  document.getElementById("loading").style.display = "none";
  document.getElementById("googleLoginBtn").style.display = "flex";
}

// Show Error Message
function showError(message) {
  const errorDiv = document.getElementById("errorMessage");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";

  // Hide error after 5 seconds
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 5000);
}

// Check if user is accessing protected pages without authentication
async function checkPageAccess() {
  const currentPath = window.location.pathname;
  const protectedPaths = ["/index.html", "/dashboard", "/"];

  // If on login page, no need to check
  if (currentPath.includes("login.html")) {
    return;
  }

  // If on protected path, check authentication
  if (protectedPaths.includes(currentPath) || currentPath === "/") {
    await firebaseReady;
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (!user) {
          window.location.href = "/login.html";
        }
        resolve(user);
      });
    });
  }
}

// Data Migration Function - Now only runs if user has existing anonymous data
async function migrateAnonymousData(newUserId) {
  try {
    await firebaseReady;
    // Get the anonymous user ID from localStorage if exists
    const anonymousUserId = localStorage.getItem("anonymousUserId");

    if (!anonymousUserId) {
      console.log("No anonymous data to migrate - user will start fresh");
      return false; // No migration needed
    }

    console.log("Migrating data from anonymous user:", anonymousUserId);

    let migrationCount = 0;

    // Migrate categories
    try {
      const categoriesDoc = await getDoc(
        doc(db, "users", anonymousUserId, "categories", "main")
      );
      if (categoriesDoc.exists()) {
        await setDoc(
          doc(db, "users", newUserId, "categories", "main"),
          categoriesDoc.data()
        );
        console.log("Categories migrated successfully");
        migrationCount++;
      }
    } catch (error) {
      console.warn("No categories to migrate:", error);
    }

    // Migrate templates
    try {
      const templatesDoc = await getDoc(
        doc(db, "users", anonymousUserId, "templates", "recurring")
      );
      if (templatesDoc.exists()) {
        await setDoc(
          doc(db, "users", newUserId, "templates", "recurring"),
          templatesDoc.data()
        );
        console.log("Templates migrated successfully");
        migrationCount++;
      }
    } catch (error) {
      console.warn("No templates to migrate:", error);
    }

    // Migrate monthly data
    try {
      const monthsQuery = query(
        collection(db, "users", anonymousUserId, "months")
      );
      const monthsSnapshot = await getDocs(monthsQuery);

      for (const monthDoc of monthsSnapshot.docs) {
        await setDoc(
          doc(db, "users", newUserId, "months", monthDoc.id),
          monthDoc.data()
        );
        console.log(`Month ${monthDoc.id} migrated successfully`);
        migrationCount++;
      }
    } catch (error) {
      console.warn("No monthly data to migrate:", error);
    }

    // Clear anonymous user ID from localStorage
    localStorage.removeItem("anonymousUserId");

    if (migrationCount > 0) {
      console.log(
        `Data migration completed successfully - ${migrationCount} items migrated`
      );
      return true; // Migration successful
    } else {
      console.log("No data found to migrate - user will start fresh");
      return false; // No data to migrate
    }
  } catch (error) {
    console.error("Error migrating anonymous data:", error);
    return false;
  }
}

// Google Sign-in Function
async function signInWithGoogle() {
  showLoading();

  try {
    await firebaseReady;
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log("User signed in:", user.displayName);

    // Try to migrate anonymous data if exists (but don't force October data)
    const migrationResult = await migrateAnonymousData(user.uid);

    if (migrationResult) {
      console.log("Anonymous data migration completed");
    } else {
      console.log("New user - starting with fresh data");
    }

    // Store user info and login timestamp
    localStorage.setItem("userDisplayName", user.displayName);
    localStorage.setItem("userEmail", user.email);
    localStorage.setItem("userPhotoURL", user.photoURL);
    localStorage.setItem("loginTimestamp", Date.now().toString());
    localStorage.setItem("lastActivityTimestamp", Date.now().toString());

    // Redirect to dashboard
    window.location.href = "/dashboard";
  } catch (error) {
    hideLoading();
    console.error("Sign-in error:", error);

    let errorMessage = "Login gagal. ";

    switch (error.code) {
      case "auth/popup-closed-by-user":
        errorMessage += "Popup login ditutup. Silakan coba lagi.";
        break;
      case "auth/popup-blocked":
        errorMessage +=
          "Popup diblokir browser. Silakan aktifkan popup dan coba lagi.";
        break;
      case "auth/network-request-failed":
        errorMessage += "Koneksi internet bermasalah. Periksa koneksi Anda.";
        break;
      case "auth/too-many-requests":
        errorMessage += "Terlalu banyak percobaan login. Coba lagi nanti.";
        break;
      case "auth/invalid-api-key":
      case "auth/api-key-not-valid":
        errorMessage +=
          "Konfigurasi Firebase tidak valid. Pastikan API key dan kredensial proyek sudah diperbarui.";
        break;
      default:
        errorMessage += error.message;
    }

    showError(errorMessage);
  }
}

firebaseReady
  .then(({ auth: resolvedAuth }) => {
    onAuthStateChanged(resolvedAuth, (user) => {
      if (user) {
        console.log("User already signed in, redirecting to dashboard");

        if (window.location.pathname.includes("login.html")) {
          localStorage.setItem("loginTimestamp", Date.now().toString());
          localStorage.setItem("lastActivityTimestamp", Date.now().toString());
          window.location.href = "/dashboard";
        }
      } else {
        console.log("User not authenticated");

        localStorage.removeItem("userDisplayName");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userPhotoURL");
        localStorage.removeItem("loginTimestamp");
        localStorage.removeItem("lastActivityTimestamp");

        if (!window.location.pathname.includes("login.html")) {
          window.location.href = "/login.html";
        } else {
          hideLoading();
        }
      }
    });
  })
  .catch((error) => {
    console.error("Failed to initialise Firebase auth state listener:", error);
    showError(
      "Konfigurasi Firebase tidak valid. Perbarui pengaturan proyek Anda dan coba lagi.",
    );
    hideLoading();
  });

// Make functions available globally
window.signInWithGoogle = signInWithGoogle;
window.toggleTheme = toggleTheme;

// Initialize theme and check page access on load
document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  checkPageAccess().catch((error) => {
    console.error("Failed to verify authentication status:", error);
  });
});
