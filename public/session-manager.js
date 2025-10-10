// Session Manager for handling user sessions and auto-logout
class SessionManager {
  constructor() {
    this.INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
    this.WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before logout
    this.inactivityTimer = null;
    this.warningTimer = null;
    this.lastActivity = Date.now();
    this.isWarningShown = false;
    this.hasExpired = false;
    this.ACTIVITY_STORAGE_KEY = "lastActivityTimestamp";
    this.LOGIN_TIMESTAMP_KEY = "loginTimestamp";
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    // Bind methods to preserve 'this' context
    this.resetTimer = this.resetTimer.bind(this);
    this.handleUserActivity = this.handleUserActivity.bind(this);
    this.showWarning = this.showWarning.bind(this);
    this.forceLogout = this.forceLogout.bind(this);
  }

  // Initialize session management
  init(auth, signOutCallback) {
    this.auth = auth;
    this.signOutCallback = signOutCallback;

    // Restore persisted activity timestamp if available
    const persistedActivity = this.getStoredTimestamp(this.ACTIVITY_STORAGE_KEY);
    if (persistedActivity) {
      this.lastActivity = persistedActivity;
    } else {
      this.persistTimestamp(this.ACTIVITY_STORAGE_KEY, this.lastActivity);
    }

    if (!this.isSessionActive()) {
      this.handleExpiredSession();
      return;
    }

    // Start activity monitoring
    this.startActivityMonitoring();

    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    // Reset timer on initialization
    this.resetTimer();

    console.log("Session manager initialized");
  }

  // Start monitoring user activity
  startActivityMonitoring() {
    // Events that indicate user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "touchmove",
      "click",
      "keydown",
    ];

    // Add event listeners for user activity
    activityEvents.forEach((eventType) => {
      document.addEventListener(eventType, this.handleUserActivity, true);
    });

    // Also monitor focus/blur events
    window.addEventListener("focus", this.handleUserActivity);
    window.addEventListener("blur", this.handleUserActivity);
  }

  // Handle user activity
  handleUserActivity() {
    this.lastActivity = Date.now();
    this.persistTimestamp(this.ACTIVITY_STORAGE_KEY, this.lastActivity);

    // Hide warning if it's shown
    if (this.isWarningShown) {
      this.hideWarning();
    }

    // Reset the inactivity timer
    this.resetTimer();
  }

  // Reset the inactivity timer
  resetTimer() {
    this.lastActivity = Date.now();
    this.persistTimestamp(this.ACTIVITY_STORAGE_KEY, this.lastActivity);

    // Clear existing timers
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }

    // Set warning timer (5 minutes before logout)
    this.warningTimer = setTimeout(() => {
      this.showWarning();
    }, this.INACTIVITY_TIMEOUT - this.WARNING_TIME);

    // Set logout timer (1 hour)
    this.inactivityTimer = setTimeout(() => {
      this.forceLogout();
    }, this.INACTIVITY_TIMEOUT);
  }

  // Show inactivity warning
  showWarning() {
    if (this.isWarningShown) return;

    this.isWarningShown = true;

    // Create warning modal
    const warningModal = document.createElement("div");
    warningModal.id = "inactivityWarning";
    warningModal.className = "modal show";
    warningModal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fas fa-clock" style="color: var(--warning-color);"></i>
            Sesi Akan Berakhir
          </h3>
        </div>
        <div style="text-align: center; padding: 20px 0;">
          <p style="margin-bottom: 20px;">
            Sesi Anda akan berakhir dalam <span id="countdownTimer">5:00</span> karena tidak ada aktivitas.
          </p>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 20px;">
            Klik tombol di bawah untuk melanjutkan sesi.
          </p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="btn" onclick="window.sessionManager.extendSession()">
              <i class="fas fa-refresh"></i> Perpanjang Sesi
            </button>
            <button class="btn btn-secondary" onclick="window.sessionManager.logoutNow()">
              <i class="fas fa-sign-out-alt"></i> Logout Sekarang
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(warningModal);

    // Start countdown
    this.startCountdown();

    console.log("Inactivity warning shown");
  }

  // Start countdown timer in warning modal
  startCountdown() {
    let timeLeft = this.WARNING_TIME / 1000; // 5 minutes in seconds

    const countdown = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;

      const countdownElement = document.getElementById("countdownTimer");
      if (countdownElement) {
        countdownElement.textContent = `${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`;
      }

      timeLeft--;

      if (timeLeft < 0 || !this.isWarningShown) {
        clearInterval(countdown);
      }
    }, 1000);
  }

  // Hide warning modal
  hideWarning() {
    this.isWarningShown = false;
    const warningModal = document.getElementById("inactivityWarning");
    if (warningModal) {
      warningModal.remove();
    }
  }

  // Extend session (called when user clicks continue)
  extendSession() {
    this.hideWarning();
    this.resetTimer();
    this.showToast("Sesi berhasil diperpanjang", "success");
  }

  handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      if (!this.isSessionActive()) {
        this.handleExpiredSession();
      }
    }
  }

  handleExpiredSession() {
    if (this.hasExpired) {
      return;
    }

    this.hasExpired = true;
    this.showToast("Sesi berakhir karena tidak ada aktivitas", "warning");
    setTimeout(() => {
      this.signOutCallback(true);
    }, 500);
  }

  // Force logout due to inactivity
  forceLogout() {
    console.log("Force logout due to inactivity");
    this.hideWarning();
    this.showToast("Sesi berakhir karena tidak ada aktivitas", "warning");

    // Delay logout to show toast message
    setTimeout(() => {
      this.signOutCallback(true); // true indicates forced logout
    }, 2000);
  }

  // Logout immediately (called when user clicks logout now)
  logoutNow() {
    this.hideWarning();
    this.signOutCallback(false); // false indicates manual logout
  }

  // Show toast message
  showToast(message, type = "info") {
    // Try to use existing toast function if available
    if (typeof showToast === "function") {
      showToast(message, type);
      return;
    }

    // Try to use global window function
    if (window.showToast && typeof window.showToast === "function") {
      window.showToast(message, type);
      return;
    }

    // Fallback: create simple toast
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--bg-card);
      color: var(--text-primary);
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: var(--shadow);
      z-index: 1001;
      border-left: 4px solid var(--${
        type === "success" ? "success" : type === "warning" ? "warning" : "info"
      }-color);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // Get remaining session time
  getRemainingTime() {
    const elapsed = Date.now() - this.lastActivity;
    const remaining = this.INACTIVITY_TIMEOUT - elapsed;
    return Math.max(0, remaining);
  }

  // Clean up timers and event listeners
  destroy() {
    // Clear timers
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }

    // Remove event listeners
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "touchmove",
      "click",
      "keydown",
    ];

    activityEvents.forEach((eventType) => {
      document.removeEventListener(eventType, this.handleUserActivity, true);
    });

    window.removeEventListener("focus", this.handleUserActivity);
    window.removeEventListener("blur", this.handleUserActivity);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);

    this.hideWarning();

    this.hasExpired = false;

    console.log("Session manager destroyed");
  }

  // Update inactivity timeout (for customization)
  setInactivityTimeout(minutes) {
    this.INACTIVITY_TIMEOUT = minutes * 60 * 1000;
    this.WARNING_TIME = Math.min(5 * 60 * 1000, this.INACTIVITY_TIMEOUT / 2);
    this.resetTimer();
    console.log(`Inactivity timeout updated to ${minutes} minutes`);
  }

  isSessionActive() {
    const now = Date.now();
    const loginTimestamp = this.getStoredTimestamp(this.LOGIN_TIMESTAMP_KEY);
    const lastActivity = this.getStoredTimestamp(this.ACTIVITY_STORAGE_KEY);
    const referenceTime = lastActivity ?? loginTimestamp;

    if (!referenceTime) {
      return true;
    }

    return now - referenceTime <= this.INACTIVITY_TIMEOUT;
  }

  getStoredTimestamp(key) {
    try {
      const value = window?.localStorage?.getItem(key);
      return value ? Number.parseInt(value, 10) : null;
    } catch (error) {
      console.warn("Unable to read from localStorage:", error);
      return null;
    }
  }

  persistTimestamp(key, value) {
    try {
      window?.localStorage?.setItem(key, String(value));
    } catch (error) {
      console.warn("Unable to persist session timestamp:", error);
    }
  }
}

// Create global instance
if (typeof window !== "undefined") {
  window.sessionManager = new SessionManager();
}

// Export for ES6 modules
export default SessionManager;
