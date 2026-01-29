// Authentication functions
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const alertPlaceholder = document.getElementById("alert-placeholder");

  // Check if user is already logged in
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // User is signed in, redirect to dashboard
      console.log("User is signed in:", user.email);
      window.location.href = "dashboard.html";
    }
  });

  // Login form submission
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      // Validate inputs
      if (!email || !password) {
        showAlert("Please enter both email and password", "danger");
        return;
      }

      // Show loading state
      showLoading(true);

      try {
        // Sign in with Firebase Auth
        const userCredential = await firebase
          .auth()
          .signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        console.log("Login successful:", user.email);
        showAlert("Login successful! Redirecting...", "success");

        // Add user login record to Firestore
        await logUserActivity(user.uid, user.email, "login");

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1000);
      } catch (error) {
        console.error("Login error:", error);
        showLoading(false);

        let errorMessage = "Login failed. Please try again.";

        switch (error.code) {
          case "auth/user-not-found":
            errorMessage = "No account found with this email address.";
            break;
          case "auth/wrong-password":
            errorMessage = "Incorrect password. Please try again.";
            break;
          case "auth/invalid-email":
            errorMessage = "Please enter a valid email address.";
            break;
          case "auth/user-disabled":
            errorMessage = "This account has been disabled.";
            break;
          case "auth/too-many-requests":
            errorMessage =
              "Too many failed login attempts. Please try again later.";
            break;
          case "auth/network-request-failed":
            errorMessage =
              "Network error. Please check your connection and try again.";
            break;
          default:
            errorMessage = error.message;
        }

        showAlert(errorMessage, "danger");
      }
    });
  }

  // Show loading state
  function showLoading(isLoading) {
    if (isLoading) {
      loginBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';
      loginBtn.disabled = true;
      emailInput.disabled = true;
      passwordInput.disabled = true;
    } else {
      loginBtn.innerHTML = "Sign in";
      loginBtn.disabled = false;
      emailInput.disabled = false;
      passwordInput.disabled = false;
    }
  }

  // Show alert messages
  function showAlert(message, type) {
    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    alertPlaceholder.innerHTML = alertHtml;

    // Auto-hide success messages
    if (type === "success") {
      setTimeout(() => {
        const alertElement = alertPlaceholder.querySelector(".alert");
        if (alertElement) {
          alertElement.remove();
        }
      }, 3000);
    }
  }

  // Log user activity to Firestore
  async function logUserActivity(userId, email, activity) {
    try {
      await db.collection("user_activities").add({
        userId: userId,
        email: email,
        activity: activity,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        ip: await getUserIP(),
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error("Error logging user activity:", error);
    }
  }

  // Get user IP address
  async function getUserIP() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return "unknown";
    }
  }
});

// Global logout function
window.logout = async function () {
  try {
    const user = firebase.auth().currentUser;

    if (user) {
      // Log logout activity
      await db.collection("user_activities").add({
        userId: user.uid,
        email: user.email,
        activity: "logout",
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Sign out from Firebase
    await firebase.auth().signOut();
    console.log("User signed out successfully");

    // Show success message
    showToast("Logged out successfully", "success");

    // Redirect to login page after a short delay
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } catch (error) {
    console.error("Logout error:", error);
    showToast("Error logging out. Please try again.", "danger");
  }
};

// Show toast notifications
function showToast(message, type) {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container position-fixed top-0 end-0 p-3";
    toastContainer.style.zIndex = "9999";
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toastId = "toast-" + Date.now();
  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML("beforeend", toastHtml);

  // Initialize and show the toast
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: 3000,
  });

  toast.show();

  // Remove toast element after it's hidden
  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove();
  });
}
