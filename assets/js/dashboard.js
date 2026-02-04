// Dashboard functionality - uses Firebase config from firebase-config.js
// Global Variables
let binsData = [];
let janitorsData = [];

// Initialize Dashboard
document.addEventListener("DOMContentLoaded", function () {
  fetchDashboardData();
  initializeEventListeners();
});

// Fetch all data for dashboard
function fetchDashboardData() {
  // Fetch bins data
  db.collection("bins")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        binsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        updateDashboardStats();
        renderBinsRequiringAttention();
      },
      (error) => {
        console.error("Error fetching bins:", error);
        showAlert("Error loading bins data", "danger");
      },
    );

  // Fetch janitors data
  db.collection("users")
    .where("role", "==", "janitor")
    .onSnapshot(
      (snapshot) => {
        janitorsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        updateJanitorsStats();
      },
      (error) => {
        console.error("Error fetching janitors:", error);
        showAlert("Error loading janitors data", "danger");
      },
    );
}

// Update dashboard statistics
function updateDashboardStats() {
  // Update total bins
  document.getElementById("totalBins").textContent = binsData.length;

  // Calculate status counts based on combined wet + dry level
  const criticalBins = binsData.filter((bin) => {
    const totalLevel = (bin.wetLevel || 0) + (bin.dryLevel || 0);
    return totalLevel >= 75; // Critical and Urgent combined
  }).length;

  const warningBins = binsData.filter((bin) => {
    const totalLevel = (bin.wetLevel || 0) + (bin.dryLevel || 0);
    return totalLevel >= 50 && totalLevel < 75;
  }).length;

  // Update stats
  document.getElementById("criticalAlerts").textContent = criticalBins;
  document.getElementById("warningAlerts").textContent = warningBins;

  // Update bins requiring attention badge
  const attentionCount = criticalBins + warningBins;
  const badgeElement = document.querySelector(".badge-count");
  if (badgeElement) {
    badgeElement.textContent = `${attentionCount} bins`;
  }
}

// Update janitors statistics
function updateJanitorsStats() {
  const activeJanitors = janitorsData.filter(
    (janitor) => janitor.status === "active" || janitor.status === "available",
  ).length;

  const janitorsElement = document.getElementById("activeJanitors");
  if (janitorsElement) {
    janitorsElement.textContent = activeJanitors;
  }
}

// Render bins that require attention (warning or critical)
function renderBinsRequiringAttention() {
  const container = document.getElementById("binsContainer");
  if (!container) return;

  // Filter bins that need attention
  const attentionBins = binsData.filter((bin) => {
    const totalLevel = (bin.wetLevel || 0) + (bin.dryLevel || 0);
    return totalLevel >= 50; // Warning, Critical, or Urgent
  });

  container.innerHTML = "";

  if (attentionBins.length === 0) {
    container.innerHTML = `
      <div class="text-center" style="grid-column: 1 / -1; padding: 40px;">
        <i class="fas fa-check-circle" style="font-size: 48px; color: #4CAF50; margin-bottom: 15px;"></i>
        <h5>All bins are in good condition!</h5>
        <p class="text-muted">No bins require immediate attention.</p>
      </div>
    `;
    return;
  }

  // Sort by priority (highest total level first)
  attentionBins.sort((a, b) => {
    const totalA = (a.wetLevel || 0) + (a.dryLevel || 0);
    const totalB = (b.wetLevel || 0) + (b.dryLevel || 0);
    return totalB - totalA;
  });

  attentionBins.forEach((bin) => {
    const binCard = document.createElement("div");
    binCard.className = "bin-card";

    const totalLevel = (bin.wetLevel || 0) + (bin.dryLevel || 0);
    const status = calculateBinStatus(totalLevel);
    const statusClass = getStatusClass(status);
    const statusText = getStatusText(status);

    binCard.innerHTML = `
      <span class="status-badge ${statusClass}">${statusText}</span>
      <div class="bin-header">
        <div class="bin-icon-container">
          <i class="fas fa-trash-alt"></i>
        </div>
        <div class="bin-info">
          <h5>${bin.name}</h5>
          <span class="waste-type">Mixed Waste</span>
        </div>
      </div>
      <div class="bin-details">
        <div class="detail-item">
          <i class="fas fa-map-marker-alt"></i>
          <span>${bin.location}</span>
        </div>
        <div class="detail-item">
          <i class="far fa-clock"></i>
          <span>Last collected: ${bin.lastCollected || "Never"}</span>
        </div>
      </div>
      <div class="fill-level-container">
        <div class="fill-level-header">
          <span>Wet Level</span>
          <span class="percentage">${bin.wetLevel || 0}%</span>
        </div>
        <div class="progress" style="height: 8px; margin-bottom: 10px;">
          <div class="progress-bar bg-info wet-progress ${getProgressClass(bin.wetLevel || 0)}" role="progressbar" style="width: 0%"></div>
        </div>
        <div class="fill-level-header">
          <span>Dry Level</span>
          <span class="percentage">${bin.dryLevel || 0}%</span>
        </div>
        <div class="progress" style="height: 8px;">
          <div class="progress-bar bg-secondary dry-progress ${getProgressClass(bin.dryLevel || 0)}" role="progressbar" style="width: 0%"></div>
        </div>
      </div>
      <div class="bin-id">ID: ${bin.id.substring(0, 8).toUpperCase()}</div>
    `;

    container.appendChild(binCard);

    // Animate progress bars
    setTimeout(() => {
      const wetProgressBar = binCard.querySelector(".wet-progress");
      const dryProgressBar = binCard.querySelector(".dry-progress");

      if (wetProgressBar) {
        wetProgressBar.style.transition = "width 1s ease-in-out";
        wetProgressBar.style.width = (bin.wetLevel || 0) + "%";
      }

      if (dryProgressBar) {
        dryProgressBar.style.transition = "width 1s ease-in-out";
        dryProgressBar.style.width = (bin.dryLevel || 0) + "%";
      }
    }, 100);
  });
}

// Calculate bin status based on total level (wet + dry)
function calculateBinStatus(totalLevel) {
  if (totalLevel >= 75) return "critical";
  if (totalLevel >= 50) return "warning";
  return "normal";
}

// Get status CSS class
function getStatusClass(status) {
  switch (status) {
    case "critical":
      return "status-critical";
    case "warning":
      return "status-warning";
    default:
      return "status-normal";
  }
}

// Get status display text
function getStatusText(status) {
  switch (status) {
    case "urgent":
      return "Critical";
    case "critical":
      return "Critical";
    case "warning":
      return "Warning";
    default:
      return "Normal";
  }
}

// Get progress bar CSS class based on level
function getProgressClass(level) {
  if (level >= 90) return "progress-critical";
  if (level >= 70) return "progress-warning";
  return "progress-normal";
}

// Initialize event listeners
function initializeEventListeners() {
  // Navigation links
  const navLinks = document.querySelectorAll(".nav-link-custom");
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (this.getAttribute("href") === "#") {
        e.preventDefault();
      }
    });
  });

  // Optional: Add click handlers for bin cards to show details
  document.addEventListener("click", function (e) {
    const binCard = e.target.closest(".bin-card");
    if (binCard) {
      // Could navigate to bins page or show modal with details
      console.log("Bin card clicked");
    }
  });
}

// Alert helper function
function showAlert(message, type) {
  // Create alert at top of page
  const alertContainer = document.createElement("div");
  alertContainer.className = "position-fixed top-0 start-50 translate-middle-x";
  alertContainer.style.zIndex = "9999";
  alertContainer.style.marginTop = "20px";

  const wrapper = document.createElement("div");
  wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible fade show" role="alert">`,
    `   <div>${message}</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    "</div>",
  ].join("");

  alertContainer.append(wrapper);
  document.body.appendChild(alertContainer);

  // Auto remove after 3 seconds
  setTimeout(() => {
    alertContainer.remove();
  }, 3000);
}

// Refresh dashboard data periodically (every 30 seconds)
setInterval(() => {
  console.log("Dashboard data refreshed");
}, 30000);
