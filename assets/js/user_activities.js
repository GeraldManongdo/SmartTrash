// User Activities functionality - fetches from "user_activities" collection
// Global Variables
let activitiesData = [];
let viewActivityModal;

// DOM Elements
const searchInput = document.getElementById("searchInput");
const sortFilter = document.getElementById("sortFilter");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Bootstrap modals
  viewActivityModal = new bootstrap.Modal(document.getElementById("viewActivityModal"));

  fetchActivities();

  // Attach Event Listeners for filters
  searchInput.addEventListener("input", filterActivities);
  sortFilter.addEventListener("change", filterActivities);

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

// Fetch activities data
function fetchActivities() {
  db.collection("user_activities")
    .onSnapshot(
      (snapshot) => {
        activitiesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        filterActivities();
      },
      (error) => {
        console.error("Error fetching activities:", error);
        showAlert("Error loading activities", "danger");
      },
    );
}

// Filter and sort activities
function filterActivities() {
  const term = searchInput.value.toLowerCase();
  const sortBy = sortFilter.value;

  let filtered = activitiesData.filter((activity) => {
    const matchesTerm =
      (activity.email || "").toLowerCase().includes(term) ||
      (activity.activity || "").toLowerCase().includes(term);
    return matchesTerm;
  });

  // Sort
  if (sortBy === "activity") {
    filtered.sort((a, b) => (a.activity || "").localeCompare(b.activity || ""));
  } else {
    // timestamp descending
    filtered.sort((a, b) => {
      const aTime = a.timestamp ? a.timestamp.seconds : 0;
      const bTime = b.timestamp ? b.timestamp.seconds : 0;
      return bTime - aTime;
    });
  }

  renderActivities(filtered);
}

// VIEW ACTIVITY DETAILS
window.viewActivityDetails = function (activity) {
  const timestamp = activity.timestamp ? new Date(activity.timestamp.seconds * 1000).toLocaleString() : "N/A";
  document.getElementById("viewTimestamp").textContent = timestamp;
  document.getElementById("viewEmail").textContent = activity.email || "N/A";
  document.getElementById("viewActivity").textContent = activity.activity || "N/A";
  document.getElementById("viewPage").textContent = activity.page || "N/A";
  document.getElementById("viewUserAgent").textContent = activity.userAgent || "N/A";
  document.getElementById("viewUserId").textContent = activity.userId || "N/A";

  viewActivityModal.show();
};

// DELETE ACTIVITY
window.deleteActivity = async function (id) {
  if (confirm("Are you sure you want to delete this activity? This action cannot be undone.")) {
    try {
      await db.collection("user_activities").doc(id).delete();
      showAlert("Activity deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting activity:", error);
      showAlert("Error deleting activity.", "danger");
    }
  }
};

// Render the activities table
function renderActivities(data) {
  const tbody = document.getElementById("activitiesBody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center">No activities found</td></tr>`;
    return;
  }

  data.forEach((activity) => {
    const row = document.createElement("tr");
    const timestamp = activity.timestamp ? new Date(activity.timestamp.seconds * 1000).toLocaleString() : "N/A";
    row.innerHTML = `
      <td>${timestamp}</td>
      <td>${activity.email || "N/A"}</td>
      <td>${activity.activity || "N/A"}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn btn-view" onclick="viewActivityDetails(${JSON.stringify(activity).replace(/"/g, '&quot;')})" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn btn-delete" onclick="deleteActivity('${activity.id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
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