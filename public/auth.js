import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "FIREBASE_API",
  authDomain: "finance-dashboard-10nfl.firebaseapp.com",
  projectId: "finance-dashboard-10nfl",
  storageBucket: "finance-dashboard-10nfl.firebasestorage.app",
  messagingSenderId: "875656039609",
  appId: "1:875656039609:web:4f5e11a81c58de312f9f68",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const provider = new GoogleAuthProvider();

// Configure Google provider
provider.addScope("email");
provider.addScope("profile");

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
function checkPageAccess() {
  const currentPath = window.location.pathname;
  const protectedPaths = ["/index.html", "/dashboard", "/"];

  // If on login page, no need to check
  if (currentPath.includes("login.html")) {
    return;
  }

  // If on protected path, check authentication
  if (protectedPaths.includes(currentPath) || currentPath === "/") {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (!user) {
          // Not authenticated, redirect to login
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
      default:
        errorMessage += error.message;
    }

    showError(errorMessage);
  }
}

// Check Authentication State
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log("User already signed in, redirecting to dashboard");

    // Check if user is on login page
    if (window.location.pathname.includes("login.html")) {
      // Update login timestamp
      localStorage.setItem("loginTimestamp", Date.now().toString());
      window.location.href = "/dashboard";
    }
  } else {
    // User is signed out
    console.log("User not authenticated");

    // Clear user data from localStorage
    localStorage.removeItem("userDisplayName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhotoURL");
    localStorage.removeItem("loginTimestamp");

    // If not on login page, redirect to login
    if (!window.location.pathname.includes("login.html")) {
      window.location.href = "/login.html";
    } else {
      hideLoading();
    }
  }
});

// Make functions available globally
window.signInWithGoogle = signInWithGoogle;
window.toggleTheme = toggleTheme;

// Initialize theme and check page access on load
document.addEventListener("DOMContentLoaded", () => {
  loadTheme();
  checkPageAccess();
});
