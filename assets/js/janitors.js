// Janitors management functionality - uses Firebase config from firebase-config.js
// Global Variables to manage state
let janitorsData = []; // Store data locally for filtering
let isEditing = false;
let currentEditId = null;

// 3. DOM Elements
const tableBody = document.getElementById("janitorsTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const shiftFilter = document.getElementById("shiftFilter");
let modalElement;
let viewModalElement;

// Add missing addNewJanitor function
window.addNewJanitor = function () {
  resetModalState();
  modalElement.show();
};

// 4. Initialize: Listen for Real-time Updates
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Bootstrap modal
  modalElement = new bootstrap.Modal(
    document.getElementById("addJanitorModal"),
  );

  // Initialize view modal
  viewModalElement = new bootstrap.Modal(
    document.getElementById("viewJanitorModal"),
  );

  fetchJanitors();

  // Attach Event Listeners for filters
  searchInput.addEventListener("input", filterJanitors);
  statusFilter.addEventListener("change", filterJanitors);
  shiftFilter.addEventListener("change", filterJanitors);
});

// --- CORE FIREBASE FUNCTIONS ---

// READ: Fetch data in real-time
function fetchJanitors() {
  // onSnapshot provides real-time updates automatically
  db.collection("users")
    .where("role", "==", "janitor")
    .onSnapshot(
      (snapshot) => {
        janitorsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by createdAt in JavaScript to avoid composite index requirement
        janitorsData.sort((a, b) => {
          const aTime = a.createdAt?.toDate() || new Date(0);
          const bTime = b.createdAt?.toDate() || new Date(0);
          return bTime - aTime; // Descending order (newest first)
        });

        console.log("Fetched janitors:", janitorsData.length); // Debug log
        renderJanitors(janitorsData);
        updateStats(janitorsData);
      },
      (error) => {
        console.error("Error fetching janitors:", error);
        showAlert("Error loading data: " + error.message, "danger");

        // Fallback: try to fetch all users to see if any exist
        db.collection("users")
          .limit(5)
          .get()
          .then((snapshot) => {
            console.log("Total users in collection:", snapshot.size);
            snapshot.forEach((doc) => {
              console.log("User:", doc.id, doc.data());
            });
          });
      },
    );
}

// CREATE or UPDATE: Handle form submission
window.createJanitor = async function () {
  const btn = document.getElementById("createJanitorBtn");
  const form = document.getElementById("addJanitorForm");

  // Get values
  const name = document.getElementById("janitorName").value;
  const email = document.getElementById("janitorEmail").value;
  const phone = document.getElementById("janitorPhone").value;
  const shift = document.getElementById("janitorShift").value;
  const area = document.getElementById("janitorArea").value;
  const password = document.getElementById("janitorPassword").value;
  const notes = document.getElementById("janitorNotes").value;

  // Basic Validation
  if (!name || !email || !shift || (!isEditing && !password)) {
    showAlert("Please fill in all required fields.", "warning");
    return;
  }

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  btn.disabled = true;

  try {
    const janitorData = {
      name,
      email,
      phone,
      shift,
      assignedArea: area,
      notes,
      role: "janitor", // Add role field
      // If creating, set defaults. If editing, keep existing or update.
      status: isEditing
        ? janitorsData.find((j) => j.id === currentEditId)?.status || "off-duty"
        : "active",
      assignedBins: isEditing
        ? janitorsData.find((j) => j.id === currentEditId)?.assignedBins || 0
        : 0,
      lastActive: new Date().toLocaleString(), // Simple string timestamp for display
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // Note: We are saving the password to Firestore for this demo.
    // In a real app, you should create an Auth user via Cloud Functions to avoid security risks.
    if (password) janitorData.tempPassword = password;

    if (isEditing) {
      // Update existing document
      await db.collection("users").doc(currentEditId).update(janitorData);
      showAlert("Janitor updated successfully!", "success");
    } else {
      // Create new document
      janitorData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("users").add(janitorData);
      showAlert("Janitor created successfully!", "success");
    }

    // Reset and Close
    form.reset();
    modalElement.hide();
    resetModalState();
  } catch (error) {
    console.error("Error saving janitor:", error);
    showAlert(error.message, "danger");
  } finally {
    btn.innerHTML =
      '<i class="fas fa-plus"></i> ' +
      (isEditing ? "Update Janitor" : "Create Janitor");
    btn.disabled = false;
  }
};

// DELETE
window.deleteJanitor = async function (id) {
  if (
    confirm(
      "Are you sure you want to delete this janitor? This action cannot be undone.",
    )
  ) {
    try {
      await db.collection("users").doc(id).delete();
      showAlert("Janitor deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting:", error);
      showAlert("Failed to delete janitor.", "danger");
    }
  }
};

// PREPARE EDIT
window.editJanitor = function (id) {
  const janitor = janitorsData.find((j) => j.id === id);
  if (!janitor) return;

  isEditing = true;
  currentEditId = id;

  // Populate Form
  document.getElementById("janitorName").value = janitor.name;
  document.getElementById("janitorEmail").value = janitor.email;
  document.getElementById("janitorPhone").value = janitor.phone;
  document.getElementById("janitorShift").value = janitor.shift;
  document.getElementById("janitorArea").value = janitor.assignedArea || "";
  document.getElementById("janitorNotes").value = janitor.notes || "";

  // Password is usually not retrieved for security, user can leave blank to keep current
  document.getElementById("janitorPassword").placeholder =
    "Leave blank to keep current password";
  document.getElementById("janitorPassword").required = false;

  // Change Button Text
  document.getElementById("createJanitorBtn").innerHTML =
    '<i class="fas fa-save"></i> Update Janitor';
  document.getElementById("addJanitorModalLabel").innerHTML =
    '<i class="fas fa-user-edit"></i> Edit Janitor';

  // Show Modal
  modalElement.show();
};

// VIEW DETAILS - Show detailed view in modal
window.viewJanitor = function (id) {
  const janitor = janitorsData.find((j) => j.id === id);
  if (!janitor) return;

  // Populate modal with janitor data
  document.getElementById("viewJanitorName").textContent = janitor.name;
  document.getElementById("viewJanitorId").textContent = janitor.id
    .substring(0, 8)
    .toUpperCase();
  document.getElementById("viewJanitorEmail").textContent = janitor.email;
  document.getElementById("viewJanitorPhone").textContent =
    janitor.phone || "Not provided";
  document.getElementById("viewJanitorShift").textContent = getShiftText(
    janitor.shift,
  );
  document.getElementById("viewJanitorArea").textContent =
    janitor.assignedArea || "Not assigned";
  document.getElementById("viewJanitorBins").textContent =
    `${janitor.assignedBins || 0} bins`;
  document.getElementById("viewJanitorLastActive").textContent =
    janitor.lastActive || "Never";

  // Set avatar
  const avatarEl = document.getElementById("viewJanitorAvatar");
  avatarEl.textContent = getInitials(janitor.name);
  avatarEl.className = `profile-avatar ${getAvatarClass(janitorsData.indexOf(janitor))}`;

  // Set status badge
  const statusEl = document.getElementById("viewJanitorStatus");
  statusEl.textContent = getStatusText(janitor.status);
  statusEl.className = `status-badge ${getStatusClass(janitor.status).replace("status-badge ", "")}`;

  // Handle notes section
  const notesSection = document.getElementById("viewNotesSection");
  const notesEl = document.getElementById("viewJanitorNotes");
  if (janitor.notes && janitor.notes.trim()) {
    notesEl.textContent = janitor.notes;
    notesSection.style.display = "block";
  } else {
    notesSection.style.display = "none";
  }

  // Store current janitor ID for edit functionality
  viewModalElement.currentJanitorId = id;

  // Show modal
  viewModalElement.show();
};

// Edit janitor from view modal
window.editJanitorFromView = function () {
  if (viewModalElement.currentJanitorId) {
    viewModalElement.hide();
    // Small delay to allow view modal to close before opening edit modal
    setTimeout(() => {
      editJanitor(viewModalElement.currentJanitorId);
    }, 300);
  }
};

// --- HELPER FUNCTIONS ---

// Handle Modal Close/Reset
const myModalEl = document.getElementById("addJanitorModal");
myModalEl.addEventListener("hidden.bs.modal", function () {
  resetModalState();
});

function resetModalState() {
  document.getElementById("addJanitorForm").reset();
  isEditing = false;
  currentEditId = null;
  document.getElementById("createJanitorBtn").innerHTML =
    '<i class="fas fa-plus"></i> Create Janitor';
  document.getElementById("addJanitorModalLabel").innerHTML =
    '<i class="fas fa-user-plus"></i> Add New Janitor';
  document.getElementById("janitorPassword").required = true;
  document.getElementById("janitorPassword").placeholder =
    "Enter temporary password";
}

// Render the Table (Using your exact template)
function renderJanitors(data) {
  console.log("Rendering janitors:", data.length, data); // Debug log
  tableBody.innerHTML = "";

  if (data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No janitors found</td></tr>`;
    return;
  }

  data.forEach((janitor, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>
                <div class="janitor-info">
                    <div class="${getAvatarClass(index)}">
                        ${getInitials(janitor.name)}
                    </div>
                    <div class="janitor-details">
                        <h6>${janitor.name}</h6>
                        <p>ID: ${janitor.id.substring(0, 6).toUpperCase()}</p>
                    </div>
                </div>
            </td>
            <td>
                <span class="${getStatusClass(janitor.status)}">
                    ${getStatusText(janitor.status)}
                </span>
            </td>
            <td>
                <div class="contact-info">
                    <div class="contact-item">
                        <i class="fas fa-phone"></i>
                        <span>${janitor.phone || "N/A"}</span>
                    </div>
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <span>${janitor.email}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="shift-badge">${getShiftText(janitor.shift)}</span>
            </td>
            <td>
                <div class="assigned-bins">
                    <i class="fas fa-trash-alt"></i>
                    <span>${janitor.assignedBins} bins</span>
                </div>
            </td>
            <td>${janitor.lastActive || "Never"}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-view" onclick="viewJanitor('${janitor.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-edit" onclick="editJanitor('${janitor.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteJanitor('${janitor.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
    tableBody.appendChild(row);
  });
}

// Filter Logic
function filterJanitors() {
  const term = searchInput.value.toLowerCase();
  const status = statusFilter.value;
  const shift = shiftFilter.value;

  const filtered = janitorsData.filter((janitor) => {
    const matchesTerm =
      janitor.name.toLowerCase().includes(term) ||
      janitor.email.toLowerCase().includes(term) ||
      janitor.phone.includes(term);
    const matchesStatus = status === "all" || janitor.status === status;
    const matchesShift = shift === "all" || janitor.shift === shift;

    return matchesTerm && matchesStatus && matchesShift;
  });

  renderJanitors(filtered);
}

// Update Stats Cards
function updateStats(data) {
  document.getElementById("totalJanitors").innerText = data.length;
  document.getElementById("activeJanitors").innerText = data.filter(
    (j) => j.status === "active",
  ).length;
  document.getElementById("onBreakJanitors").innerText = data.filter(
    (j) => j.status === "on-break",
  ).length;
  document.getElementById("offDutyJanitors").innerText = data.filter(
    (j) => j.status === "off-duty",
  ).length;
}

// UI Helpers (Required for your template)
function getInitials(name) {
  return name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "??";
}

function getAvatarClass(index) {
  const colors = [
    "avatar-blue",
    "avatar-green",
    "avatar-purple",
    "avatar-orange",
  ];
  return `avatar-circle ${colors[index % colors.length]}`;
}

function getStatusClass(status) {
  switch (status) {
    case "active":
      return "status-badge status-active";
    case "on-break":
      return "status-badge status-warning"; // changed to warning for visibility
    case "off-duty":
      return "status-badge status-inactive";
    default:
      return "status-badge status-inactive";
  }
}

function getStatusText(status) {
  if (!status) return "Unknown";
  return status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function getShiftText(shift) {
  if (!shift) return "Unassigned";
  return shift.charAt(0).toUpperCase() + shift.slice(1);
}

// Alert Helper
function showAlert(message, type) {
  const alertPlaceholder = document.getElementById("alertContainer");
  const wrapper = document.createElement("div");
  wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible" role="alert">`,
    `   <div>${message}</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    "</div>",
  ].join("");

  alertPlaceholder.append(wrapper);

  // Auto remove after 3 seconds
  setTimeout(() => {
    wrapper.remove();
  }, 3000);
}
