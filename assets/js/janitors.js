// Janitors Management - Main Module
// Modular implementation for better maintainability

// Import modules
// Note: In a real modular environment, these would be ES6 imports
// For now, we'll load them as separate scripts in the HTML

// Global Variables
let janitorsData = []; // Store data locally for filtering
let viewModalElement; // View modal instance

// DOM Elements (will be initialized in DOMContentLoaded)
let searchInput;
let statusFilter;
let shiftFilter;

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM elements
  searchInput = document.getElementById("searchInput");
  statusFilter = document.getElementById("statusFilter");
  shiftFilter = document.getElementById("shiftFilter");

  // Check if elements exist
  if (!searchInput || !statusFilter || !shiftFilter) {
    console.error("Filter elements not found:", { searchInput, statusFilter, shiftFilter });
    return;
  }

  console.log("Filter elements initialized successfully");

  // Initialize view modal
  viewModalElement = new bootstrap.Modal(
    document.getElementById("viewJanitorModal"),
  );

  // Initialize form manager
  formManager.initializeModals();

  // Start fetching janitors
  fetchJanitors();

  // Attach Event Listeners for filters
  searchInput.addEventListener("input", filterJanitors);
  searchInput.addEventListener("keyup", filterJanitors); // Also listen for keyup as backup
  statusFilter.addEventListener("change", filterJanitors);
  statusFilter.addEventListener("input", filterJanitors); // Also listen for input as backup
  shiftFilter.addEventListener("change", filterJanitors);
  shiftFilter.addEventListener("input", filterJanitors); // Also listen for input as backup

  console.log("Event listeners attached for filters");
});

// FETCH JANITORS WITH REAL-TIME UPDATES
function fetchJanitors() {
  firebaseOps.fetchJanitors((janitors) => {
    janitorsData = janitors;
    console.log("Fetched janitors:", janitorsData.length);
    console.log("Sample janitors data:", janitorsData.slice(0, 3).map(j => ({
      name: j.name,
      shift: j.shift,
      status: j.status
    })));
    uiManager.renderJanitors(janitorsData);
    uiManager.updateStats(janitorsData);

    // If modal is open, update the modal UI with current data
    if (viewModalElement.currentJanitorId) {
      const currentJanitor = janitorsData.find(j => j.id === viewModalElement.currentJanitorId);
      if (currentJanitor) {
        uiManager.updateBreakDutyButtonWithStatus(viewModalElement.currentJanitorId, currentJanitor.status);
        uiManager.updateClockButtonWithStatus(viewModalElement.currentJanitorId, currentJanitor.status);
        // Update status badge
        const statusBadge = document.getElementById("viewJanitorStatus");
        if (statusBadge) {
          statusBadge.textContent = uiManager.getStatusText(currentJanitor.status);
          statusBadge.className = `status-badge ${uiManager.getStatusClass(currentJanitor.status).replace("status-badge ", "")}`;
        }
      }
    }

    // Debug: Check if attendance collection has any documents
    checkAttendanceCollection();
  }).catch((error) => {
    console.error("Error in fetchJanitors:", error);
    uiManager.showAlert("Error loading data: " + error.message, "danger");
  });
}

// DEBUG: Check attendance collection
async function checkAttendanceCollection() {
  try {
    console.log("Checking attendance collection...");
    const attendanceSnapshot = await db.collection("attendance").limit(5).get();
    console.log(`Found ${attendanceSnapshot.size} documents in attendance collection`);
    attendanceSnapshot.forEach(doc => {
      console.log("Sample attendance document:", doc.id, doc.data());
    });
  } catch (error) {
    console.error("Error checking attendance collection:", error);
  }
}

// DEBUG: Test attendance creation and retrieval
window.testAttendance = async function(janitorId) {
  try {
    console.log(`Testing attendance for janitor ${janitorId}`);

    // Create a test attendance record
    const testTimestamp = new Date();
    console.log("Creating test attendance record...");
    await attendanceManager.createAttendanceRecord(janitorId, 'clock-in', testTimestamp);

    // Wait a moment for Firestore to update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Try to retrieve it
    console.log("Retrieving attendance records...");
    const records = await attendanceManager.loadJanitorAttendance(janitorId);
    console.log(`Retrieved ${records.records.length} records after test creation`);

    uiManager.showAlert(`Test completed. Found ${records.records.length} attendance records.`, "info");
  } catch (error) {
    console.error("Test attendance failed:", error);
    uiManager.showAlert("Test attendance failed: " + error.message, "danger");
  }
};

// FILTER JANITORS
function filterJanitors() {
  const term = searchInput.value.toLowerCase().trim();
  const status = statusFilter.value;
  const shift = shiftFilter.value;

  console.log("Filtering with:", { term, status, shift });
  console.log("Total janitors:", janitorsData.length);

  // Debug: Log all unique shifts and statuses
  const uniqueShifts = [...new Set(janitorsData.map(j => j.shift).filter(s => s))];
  const uniqueStatuses = [...new Set(janitorsData.map(j => j.status).filter(s => s))];
  console.log("Available shifts in data:", uniqueShifts);
  console.log("Available statuses in data:", uniqueStatuses);

  const filtered = janitorsData.filter((janitor) => {
    // Search term matching (name, email, phone, or ID)
    const matchesTerm = !term ||
      janitor.name?.toLowerCase().includes(term) ||
      janitor.email?.toLowerCase().includes(term) ||
      janitor.phone?.includes(term) ||
      janitor.id?.toLowerCase().includes(term) || false;

    // Status matching (case-insensitive)
    const matchesStatus = status === "all" ||
      (janitor.status && janitor.status.toLowerCase() === status.toLowerCase());

    // Shift matching (case-insensitive)
    const matchesShift = shift === "all" ||
      (janitor.shift && janitor.shift.toLowerCase() === shift.toLowerCase());

    const result = matchesTerm && matchesStatus && matchesShift;

    // Debug: Log why janitors are filtered out
    if (shift !== "all" && !matchesShift) {
      console.log("Filtered out janitor due to shift:", janitor.name, "shift:", janitor.shift, "filter:", shift);
    }

    return result;
  });

  console.log("Filtered results:", filtered.length);
  uiManager.renderJanitors(filtered);
  uiManager.updateStats(filtered); // Also update stats for filtered results
}

// WINDOW FUNCTIONS (Global event handlers)

// Add new janitor
window.addNewJanitor = function () {
  formManager.resetModalState();
  formManager.modalElement.show();
};

// Create/update janitor
window.createJanitor = function () {
  formManager.createJanitor();
};

// Delete janitor
window.deleteJanitor = function (id) {
  formManager.deleteJanitor(id);
};

// Edit janitor
window.editJanitor = function (id) {
  formManager.editJanitor(id, janitorsData);
};

// View janitor details
window.viewJanitor = async function (id) {
  const janitor = janitorsData.find((j) => j.id === id);
  if (!janitor) return;

  // Populate modal
  uiManager.populateViewModal(janitor);

  // Load attendance data
  try {
    console.log(`Loading attendance for janitor ${id}`);
    const attendanceData = await attendanceManager.loadJanitorAttendance(id);
    console.log(`Loaded ${attendanceData.records.length} attendance records`);
    console.log('Attendance records:', attendanceData.records);

    document.getElementById("viewJanitorWorkHours").textContent = `${attendanceData.workHours.toFixed(1)} hours`;
    uiManager.renderAttendanceRecords(attendanceData.records);

    // Update buttons
    uiManager.updateBreakDutyButtonWithStatus(id, janitor.status);
    uiManager.updateClockButtonWithStatus(id, janitor.status);
  } catch (error) {
    console.error("Error loading attendance:", error);
    document.getElementById("viewJanitorWorkHours").textContent = "Error loading data";
  }

  // Store current janitor ID
  viewModalElement.currentJanitorId = id;
  viewModalElement.show();
};

// Edit janitor from view modal
window.editJanitorFromView = function () {
  if (viewModalElement.currentJanitorId) {
    viewModalElement.hide();
    setTimeout(() => {
      editJanitor(viewModalElement.currentJanitorId);
    }, 300);
  }
};

// Set janitor status
window.setJanitorStatus = function (id, newStatus) {
  statusManager.setJanitorStatus(id, newStatus, janitorsData);
};

// Toggle clock in/out
window.toggleClockInOut = function () {
  statusManager.toggleClockInOut(viewModalElement.currentJanitorId, janitorsData);
};

// Toggle break/duty status
window.toggleBreakDuty = function () {
  if (!viewModalElement.currentJanitorId) {
    return;
  }

  const janitor = janitorsData.find(j => j.id === viewModalElement.currentJanitorId);
  if (!janitor) return;

  // Toggle between active and on-break
  if (janitor.status === 'active') {
    statusManager.setJanitorStatus(viewModalElement.currentJanitorId, 'on-break', janitorsData);
  } else if (janitor.status === 'on-break') {
    statusManager.setJanitorStatus(viewModalElement.currentJanitorId, 'active', janitorsData);
  }
};
