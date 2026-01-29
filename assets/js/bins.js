// Bins management functionality - uses Firebase config from firebase-config.js
// Global Variables to manage state
let binsData = []; // Store data locally for filtering
let isEditing = false;
let currentEditBin = null;
let addBinModal, viewBinModal;

// DOM Elements
const tableBody = document.getElementById("binsContainer");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

// Initialize: Listen for Real-time Updates
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Bootstrap modals
  addBinModal = new bootstrap.Modal(document.getElementById("addBinModal"));
  viewBinModal = new bootstrap.Modal(document.getElementById("viewBinModal"));

  fetchBins();

  // Attach Event Listeners for filters
  searchInput.addEventListener("input", filterBins);
  statusFilter.addEventListener("change", filterBins);

  // Navigation
  const navLinks = document.querySelectorAll(".nav-link-custom");
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (this.getAttribute("href") === "#") {
        e.preventDefault();
      }
    });
  });
});

// --- CORE FIREBASE FUNCTIONS ---

// READ: Fetch data in real-time
function fetchBins() {
  // onSnapshot provides real-time updates automatically
  db.collection("bins")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        binsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        renderBins(binsData);
        updateStats(binsData);
      },
      (error) => {
        console.error("Error fetching bins:", error);
        showAlert("Error loading data", "danger");
      },
    );
}

// CREATE or UPDATE: Handle form submission
window.submitBinForm = async function () {
  const btn = document.getElementById("submitBtn");
  const form = document.getElementById("binForm");

  // Get values
  const name = document.getElementById("binName").value;
  const location = document.getElementById("binLocation").value;
  const wetLevel = parseInt(document.getElementById("binWetLevel")?.value || 0);
  const dryLevel = parseInt(document.getElementById("binDryLevel")?.value || 0);

  // Basic Validation
  if (!name || !location) {
    showAlert("Please fill in all required fields.", "warning");
    return;
  }

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  btn.disabled = true;

  try {
    // Calculate status based on wet level
    let status;
    if (wetLevel + dryLevel >= 95) {
      status = "urgent";
    } else if (wetLevel + dryLevel >= 75) {
      status = "critical";
    } else if (wetLevel + dryLevel >= 50) {
      status = "warning";
    } else {
      status = "normal";
    }

    const binData = {
      name,
      location,
      wetLevel,
      dryLevel,
      status,
      lastCollected: new Date().toLocaleString(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (isEditing) {
      // Update existing document
      await db.collection("bins").doc(currentEditBin.id).update(binData);
      showAlert("Bin updated successfully!", "success");
    } else {
      // Create new document
      binData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("bins").add(binData);
      showAlert("Bin created successfully!", "success");
    }

    // Reset and Close
    form.reset();
    addBinModal.hide();
    resetModalState();
  } catch (error) {
    console.error("Error saving bin:", error);
    showAlert(error.message, "danger");
  } finally {
    btn.innerHTML =
      '<i class="fas fa-plus"></i> ' + (isEditing ? "Update Bin" : "Add Bin");
    btn.disabled = false;
  }
};

// DELETE
window.deleteBin = async function () {
  if (!currentEditBin) return;

  if (
    confirm(
      `Are you sure you want to delete ${currentEditBin.name}? This action cannot be undone.`,
    )
  ) {
    try {
      await db.collection("bins").doc(currentEditBin.id).delete();
      showAlert("Bin deleted successfully.", "success");
      viewBinModal.hide();
    } catch (error) {
      console.error("Error deleting:", error);
      showAlert("Failed to delete bin.", "danger");
    }
  }
};

// PREPARE EDIT
window.editBin = function () {
  if (!currentEditBin) return;

  isEditing = true;

  // Populate Form
  document.getElementById("binName").value = currentEditBin.name;
  document.getElementById("binLocation").value = currentEditBin.location;
  if (document.getElementById("binWetLevel")) {
    document.getElementById("binWetLevel").value = currentEditBin.wetLevel || 0;
  }
  if (document.getElementById("binDryLevel")) {
    document.getElementById("binDryLevel").value = currentEditBin.dryLevel || 0;
  }

  // Change Button Text
  document.getElementById("submitBtn").innerHTML =
    '<i class="fas fa-save"></i> Update Bin';
  document.getElementById("modalTitle").innerHTML = "Edit Bin";

  // Show Modal
  viewBinModal.hide();
  addBinModal.show();
};

// ADD NEW BIN
window.addNewBin = function () {
  resetModalState();
  addBinModal.show();
};

// VIEW BIN DETAILS
window.viewBinDetails = function (bin) {
  document.getElementById("viewBinName").textContent = bin.name;
  document.getElementById("viewBinLocation").textContent = bin.location;
  document.getElementById("viewBinStatus").innerHTML =
    `<span class="status-badge ${getStatusClass(bin.status)}">${getStatusText(bin.status)}</span>`;
  document.getElementById("viewBinWetLevel").textContent =
    (bin.wetLevel || 0) + "%";
  document.getElementById("viewBinDryLevel").textContent =
    (bin.dryLevel || 0) + "%";
  document.getElementById("viewBinLastCollected").textContent =
    bin.lastCollected || "Never";
  document.getElementById("viewBinId").textContent = bin.id;

  // Update wet level progress bar
  const viewWetProgressBar = document.getElementById("viewWetProgressBar");
  viewWetProgressBar.className = `progress-bar bg-info ${getProgressClass(bin.wetLevel || 0)}`;
  viewWetProgressBar.style.width = (bin.wetLevel || 0) + "%";

  // Update dry level progress bar
  const viewDryProgressBar = document.getElementById("viewDryProgressBar");
  viewDryProgressBar.className = `progress-bar bg-secondary ${getProgressClass(bin.dryLevel || 0)}`;
  viewDryProgressBar.style.width = (bin.dryLevel || 0) + "%";

  // Store current bin for edit/delete operations
  currentEditBin = bin;
  viewBinModal.show();
};

// --- HELPER FUNCTIONS ---

function resetModalState() {
  document.getElementById("binForm").reset();
  isEditing = false;
  currentEditBin = null;
  document.getElementById("submitBtn").innerHTML =
    '<i class="fas fa-plus"></i> Add Bin';
  document.getElementById("modalTitle").innerHTML = "Add New Bin";
}

// Render the Bins Grid
function renderBins(data) {
  const container = document.getElementById("binsContainer");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = `<div class="text-center" style="grid-column: 1 / -1; padding: 40px;"><p>No bins found</p></div>`;
    return;
  }

  data.forEach((bin) => {
    const binCard = document.createElement("div");
    binCard.className = "bin-card";
    binCard.style.cursor = "pointer";
    binCard.onclick = () => viewBinDetails(bin);
    binCard.innerHTML = `
            <span class="status-badge ${getStatusClass(bin.status)}">${getStatusText(bin.status)}</span>
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

      wetProgressBar.style.transition = "width 1s ease-in-out";
      wetProgressBar.style.width = (bin.wetLevel || 0) + "%";

      dryProgressBar.style.transition = "width 1s ease-in-out";
      dryProgressBar.style.width = (bin.dryLevel || 0) + "%";
    }, 100);
  });
}

// Filter Logic
function filterBins() {
  const term = searchInput.value.toLowerCase();
  const status = statusFilter.value;

  const filtered = binsData.filter((bin) => {
    const matchesTerm =
      bin.name.toLowerCase().includes(term) ||
      bin.location.toLowerCase().includes(term) ||
      bin.id.toLowerCase().includes(term);
    const matchesStatus = status === "all" || bin.status === status;

    return matchesTerm && matchesStatus;
  });

  renderBins(filtered);
  updateStats(filtered);
}

// Update Stats Cards
function updateStats(data) {
  document.getElementById("totalBins").innerText = data.length;
  document.getElementById("criticalBins").innerText = data.filter(
    (b) => b.status === "critical" || b.status === "urgent",
  ).length;
  document.getElementById("warningBins").innerText = data.filter(
    (b) => b.status === "warning",
  ).length;
  document.getElementById("normalBins").innerText = data.filter(
    (b) => b.status === "normal",
  ).length;
}

// UI Helpers
function getStatusClass(status) {
  return `status-${status}`;
}

function getStatusText(status) {
  if (!status) return "Unknown";
  if (status === "urgent") return "Must Collect";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getProgressClass(fillLevel) {
  if (fillLevel >= 90) return "progress-critical";
  if (fillLevel >= 70) return "progress-warning";
  return "progress-normal";
}

// Alert Helper
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
