// Leaderboard functionality - fetches from "points" collection
// Global Variables
let pointsData = [];

// DOM Elements
const searchInput = document.getElementById("searchInput");
const sortFilter = document.getElementById("sortFilter");
const timeFilter = document.getElementById("timeFilter");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  fetchLeaderboard();

  // Attach Event Listeners for filters
  searchInput.addEventListener("input", filterLeaderboard);
  sortFilter.addEventListener("change", filterLeaderboard);
  timeFilter.addEventListener("change", filterLeaderboard);

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

// Fetch leaderboard data
function fetchLeaderboard() {
  db.collection("points").onSnapshot(
    (snapshot) => {
      pointsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      filterLeaderboard();
    },
    (error) => {
      console.error("Error fetching leaderboard:", error);
      showAlert("Error loading leaderboard", "danger");
    },
  );
}

// Filter and sort leaderboard
function filterLeaderboard() {
  const term = searchInput.value.toLowerCase();
  const sortBy = sortFilter.value;
  const timePeriod = timeFilter.value;

  // Calculate start date for time filter
  let startDate = null;
  if (timePeriod !== "all") {
    const now = new Date();
    if (timePeriod === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (timePeriod === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timePeriod === "week") {
      const dayOfWeek = now.getDay(); // 0 = Sunday
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
    }
  }

  let filtered = pointsData.filter((user) => {
    const matchesTerm =
      (user.name || "").toLowerCase().includes(term) ||
      (user.email || "").toLowerCase().includes(term);

    let matchesTime = timePeriod === "all";
    if (timePeriod !== "all" && user.timestamp) {
      const userDate = user.timestamp.toDate();
      matchesTime = userDate >= startDate;
    }

    return matchesTerm && matchesTime;
  });

  // Sort
  if (sortBy === "points") {
    filtered.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  } else {
    filtered.sort((a, b) => (b.collectedbins || 0) - (a.collectedbins || 0));
  }

  renderLeaderboard(filtered, sortBy);
}

// Render the leaderboard table
function renderLeaderboard(data, sortBy) {
  const tbody = document.getElementById("leaderboardBody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">No data available</td></tr>`;
    return;
  }

  const getScoreValue = (user) =>
    sortBy === "points" ? user.totalPoints || 0 : user.collectedbins || 0;

  const getMedalHtml = (rank) => {
    if (rank === 1) {
      return '<span class="rank-medal gold" aria-label="Gold medal"><i class="fas fa-medal"></i></span>';
    }
    if (rank === 2) {
      return '<span class="rank-medal silver" aria-label="Silver medal"><i class="fas fa-medal"></i></span>';
    }
    if (rank === 3) {
      return '<span class="rank-medal bronze" aria-label="Bronze medal"><i class="fas fa-medal"></i></span>';
    }
    return "";
  };

  let currentRank = 0;
  let previousScore = null;

  data.forEach((user, index) => {
    const scoreValue = getScoreValue(user);
    if (previousScore === null || scoreValue !== previousScore) {
      currentRank = index + 1;
      previousScore = scoreValue;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="rank-cell"><span class="rank-number">${currentRank}</span>${getMedalHtml(currentRank)}</td>
      <td>${user.name || "N/A"}</td>
      <td>${user.collectedbins || 0}</td>
      <td>${user.totalPoints || 0}</td>
    `;
    tbody.appendChild(row);
  });
}

// View user information modal
function viewUserInfo(userId) {
  // Fetch user details from data collection
  db.collection("data")
    .doc(userId)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        document.getElementById("viewUserName").textContent =
          userData.name || "N/A";
        document.getElementById("viewUserEmail").textContent =
          userData.email || "N/A";
        document.getElementById("viewUserPhone").textContent =
          userData.phone || "N/A";
      } else {
        // If no user doc, use from points
        const user = pointsData.find((u) => u.id === userId);
        document.getElementById("viewUserName").textContent = user
          ? user.name || "N/A"
          : "N/A";
        document.getElementById("viewUserEmail").textContent = user
          ? user.email || "N/A"
          : "N/A";
        document.getElementById("viewUserPhone").textContent = "N/A";
      }

      // Points data
      const user = pointsData.find((u) => u.id === userId);
      document.getElementById("viewCollectedBins").textContent = user
        ? user.collectedbins || 0
        : 0;
      document.getElementById("viewTotalPoints").textContent = user
        ? user.totalPoints || 0
        : 0;
      document.getElementById("viewLastUpdated").textContent =
        user && user.timestamp
          ? user.timestamp.toDate().toLocaleString()
          : "N/A";

      // Show modal
      const modal = new bootstrap.Modal(
        document.getElementById("viewUserModal"),
      );
      modal.show();
    })
    .catch((error) => {
      console.error("Error fetching user:", error);
      showAlert("Error loading user information", "danger");
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
