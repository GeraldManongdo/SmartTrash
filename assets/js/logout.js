// Logout functionality and authentication state management
(function () {
  "use strict";

  // Check authentication state on page load
  document.addEventListener("DOMContentLoaded", function () {
    checkAuthState();
    initializeLogout();
    updateUserInfo();
  });

  // Check if user is authenticated
  function checkAuthState() {
    firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        // No user is signed in, redirect to login
        console.log("No user signed in, redirecting to login");

        // Show message and redirect
        showAuthRedirectMessage();
        setTimeout(() => {
          window.location.href = "index.html";
        }, 2000);
      } else {
        console.log("User is authenticated:", user.email);

        // Update last activity
        updateLastActivity(user);

        // Show user info if elements exist
        updateUserDisplayInfo(user);
      }
    });
  }

  // Initialize logout functionality
  function initializeLogout() {
    // Find logout buttons/links
    const logoutElements = document.querySelectorAll(
      "[data-logout], .logout-btn, #logoutBtn",
    );

    logoutElements.forEach((element) => {
      element.addEventListener("click", handleLogout);
    });

    // Add keyboard shortcut for logout (Ctrl+Shift+L)
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.shiftKey && e.key === "L") {
        e.preventDefault();
        handleLogout();
      }
    });
  }

  // Handle logout process
  async function handleLogout(e) {
    if (e) {
      e.preventDefault();
    }

    // Show confirmation dialog
    const confirmed = await showLogoutConfirmation();
    if (!confirmed) return;

    try {
      const user = firebase.auth().currentUser;

      if (user) {
        // Log logout activity before signing out
        await logActivity(user, "logout");
      }

      // Show logout process
      showLogoutProcess();

      // Sign out from Firebase
      await firebase.auth().signOut();

      // Clear any cached data
      clearCachedData();

      // Show success message
      showToast("Logged out successfully!", "success");

      // Redirect to login page
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } catch (error) {
      console.error("Logout error:", error);
      showToast("Error during logout. Please try again.", "danger");

      // Force redirect if auth error persists
      setTimeout(() => {
        window.location.href = "index.html";
      }, 3000);
    }
  }

  // Show logout confirmation dialog
  function showLogoutConfirmation() {
    return new Promise((resolve) => {
      if (confirm("Are you sure you want to log out?")) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  // Show logout process indicator
  function showLogoutProcess() {
    // Update logout buttons
    const logoutElements = document.querySelectorAll(
      "[data-logout], .logout-btn, #logoutBtn",
    );
    logoutElements.forEach((element) => {
      const originalText = element.textContent || element.innerHTML;
      element.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Logging out...';
      element.disabled = true;
      element.style.pointerEvents = "none";
    });

    // Show loading overlay if needed
    showLoadingOverlay("Logging out...");
  }

  // Update user information display
  function updateUserInfo() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        updateUserDisplayInfo(user);
      }
    });
  }

  // Update user display information
  function updateUserDisplayInfo(user) {
    // Update user email displays
    const emailElements = document.querySelectorAll("[data-user-email]");
    emailElements.forEach((element) => {
      element.textContent = user.email;
    });

    // Update user name displays (use email prefix if no display name)
    const nameElements = document.querySelectorAll("[data-user-name]");
    const displayName = user.displayName || user.email.split("@")[0];
    nameElements.forEach((element) => {
      element.textContent = displayName;
    });

    // Update profile pictures if any
    const photoElements = document.querySelectorAll("[data-user-photo]");
    photoElements.forEach((element) => {
      if (user.photoURL) {
        element.src = user.photoURL;
      } else {
        // Set default avatar
        element.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4CAF50&color=fff`;
      }
    });

    // Update user status
    const statusElements = document.querySelectorAll("[data-user-status]");
    statusElements.forEach((element) => {
      element.innerHTML = '<i class="fas fa-circle text-success"></i> Online';
    });
  }

  // Update last activity timestamp
  async function updateLastActivity(user) {
    try {
      await db
        .collection("users")
        .doc(user.uid)
        .set(
          {
            email: user.email,
            displayName: user.displayName || user.email.split("@")[0],
            lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
            isOnline: true,
          },
          { merge: true },
        );
    } catch (error) {
      console.error("Error updating last activity:", error);
    }
  }

  // Log user activity
  async function logActivity(user, activity) {
    try {
      await db.collection("user_activities").add({
        userId: user.uid,
        email: user.email,
        activity: activity,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent,
        page: window.location.pathname,
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }

  // Clear cached data
  function clearCachedData() {
    // Clear localStorage
    try {
      localStorage.removeItem("userPreferences");
      localStorage.removeItem("dashboardCache");
      sessionStorage.clear();
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }

  // Show authentication redirect message
  function showAuthRedirectMessage() {
    const messageHtml = `
      <div class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
           style="background-color: rgba(0,0,0,0.8); z-index: 9999;">
        <div class="card text-center p-4" style="max-width: 400px;">
          <div class="card-body">
            <i class="fas fa-lock text-warning mb-3" style="font-size: 3rem;"></i>
            <h5 class="card-title">Authentication Required</h5>
            <p class="card-text">You need to be logged in to access this page.</p>
            <div class="spinner-border spinner-border-sm me-2"></div>
            <span>Redirecting to login...</span>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", messageHtml);
  }

  // Show loading overlay
  function showLoadingOverlay(message = "Loading...") {
    let overlay = document.getElementById("loadingOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "loadingOverlay";
      overlay.className =
        "position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center";
      overlay.style.cssText =
        "background-color: rgba(0,0,0,0.8); z-index: 9999;";
      overlay.innerHTML = `
        <div class="card text-center p-4">
          <div class="card-body">
            <div class="spinner-border text-primary mb-3"></div>
            <p class="mb-0">${message}</p>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
  }

  // Show toast notification
  function showToast(message, type = "info") {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className =
        "toast-container position-fixed top-0 end-0 p-3";
      toastContainer.style.zIndex = "9999";
      document.body.appendChild(toastContainer);
    }

    // Create toast
    const toastId = "toast-" + Date.now();
    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">
            <i class="fas fa-${getToastIcon(type)} me-2"></i>
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                  data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;

    toastContainer.insertAdjacentHTML("beforeend", toastHtml);

    // Initialize and show toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
      autohide: true,
      delay: 3000,
    });

    toast.show();

    // Clean up after toast is hidden
    toastElement.addEventListener("hidden.bs.toast", () => {
      toastElement.remove();
    });
  }

  // Get appropriate icon for toast type
  function getToastIcon(type) {
    switch (type) {
      case "success":
        return "check-circle";
      case "danger":
      case "error":
        return "exclamation-circle";
      case "warning":
        return "exclamation-triangle";
      case "info":
      default:
        return "info-circle";
    }
  }

  // Auto-logout after period of inactivity (30 minutes)
  let inactivityTimer;
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      showToast("You have been logged out due to inactivity", "warning");
      handleLogout();
    }, INACTIVITY_TIMEOUT);
  }

  // Monitor user activity for auto-logout
  [
    "mousedown",
    "mousemove",
    "keypress",
    "scroll",
    "touchstart",
    "click",
  ].forEach((event) => {
    document.addEventListener(event, resetInactivityTimer, { passive: true });
  });

  // Initialize inactivity timer
  resetInactivityTimer();

  // Handle page visibility change
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      resetInactivityTimer();
      // Check if user is still authenticated when page becomes visible
      const user = firebase.auth().currentUser;
      if (user) {
        updateLastActivity(user);
      }
    }
  });

  // Expose logout function globally
  window.logout = handleLogout;
  window.checkAuth = checkAuthState;
})();
