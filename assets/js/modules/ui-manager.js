// UI Rendering Module
// Handles all UI rendering and DOM manipulation

class UIManager {
  constructor() {
    this.tableBody = document.getElementById("janitorsTableBody");
  }

  // RENDER JANITORS TABLE
  renderJanitors(data) {
    console.log("Rendering janitors:", data.length, data);
    this.tableBody.innerHTML = "";

    if (data.length === 0) {
      this.tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No janitors found</td></tr>`;
      return;
    }

    data.forEach((janitor, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <div class="janitor-info">
            <div class="janitor-avatar ${this.getAvatarClass(index)}">
              ${this.getFirstLetter(janitor.name)}
            </div>
            <div class="janitor-details">
              <h6>${janitor.name}</h6>
              <p>ID: ${janitor.id.substring(0, 6).toUpperCase()}</p>
            </div>
          </div>
        </td>
        <td>
          <span class="${this.getTableStatusClass(janitor.status)}">
            ${this.getStatusText(janitor.status)}
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
          <span class="shift-badge ${this.getShiftClass(janitor.shift)}">${this.getShiftText(janitor.shift)}</span>
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
      this.tableBody.appendChild(row);
    });
  }

  // POPULATE VIEW MODAL
  populateViewModal(janitor) {
    document.getElementById("viewJanitorName").textContent = janitor.name;
    document.getElementById("viewJanitorId").textContent = janitor.id
      .substring(0, 8)
      .toUpperCase();
    document.getElementById("viewJanitorEmail").textContent = janitor.email;
    document.getElementById("viewJanitorPhone").textContent =
      janitor.phone || "Not provided";
    document.getElementById("viewJanitorShift").textContent = this.getShiftText(
      janitor.shift,
    );
    document.getElementById("viewJanitorArea").textContent =
      janitor.assignedArea || "Not assigned";
    document.getElementById("viewJanitorLastActive").textContent =
      janitor.lastActive || "Never";

    // Set avatar
    const avatarEl = document.getElementById("viewJanitorAvatar");
    avatarEl.textContent = this.getInitials(janitor.name);
    avatarEl.className = `profile-avatar ${this.getAvatarClass(0)}`; // Use first color for modal

    // Set status badge
    const statusEl = document.getElementById("viewJanitorStatus");
    statusEl.textContent = this.getStatusText(janitor.status);
    statusEl.className = `status-badge ${this.getStatusClass(janitor.status).replace("status-badge ", "")}`;

    // Handle notes section
    const notesSection = document.getElementById("viewNotesSection");
    const notesEl = document.getElementById("viewJanitorNotes");
    if (janitor.notes && janitor.notes.trim()) {
      notesEl.textContent = janitor.notes;
      notesSection.style.display = "block";
    } else {
      notesSection.style.display = "none";
    }
  }

  // RENDER ATTENDANCE RECORDS
  renderAttendanceRecords(records) {
    const container = document.getElementById("attendanceRecords");

    if (records.length === 0) {
      container.innerHTML =
        '<div class="no-records">No attendance records found</div>';
      return;
    }

    // Group records by date
    const groupedRecords = {};
    records.forEach((record) => {
      const date = record.timestamp.toLocaleDateString();
      if (!groupedRecords[date]) {
        groupedRecords[date] = [];
      }
      groupedRecords[date].push(record);
    });

    // Sort dates in descending order
    const sortedDates = Object.keys(groupedRecords).sort(
      (a, b) => new Date(b) - new Date(a),
    );

    let html = "";
    sortedDates.forEach((date) => {
      const dayRecords = groupedRecords[date].sort(
        (a, b) => a.timestamp - b.timestamp,
      );

      html += `
        <div class="attendance-record">
          <div class="record-date">${date}</div>
          <div class="record-details">
      `;

      dayRecords.forEach((record) => {
        const time = record.timestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const typeText = attendanceManager.getAttendanceTypeText(record.type);

        html += `
          <div class="record-entry">
            <span class="entry-type">${typeText}</span>
            <span class="entry-time">${time}</span>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // RENDER TODAY'S ATTENDANCE
  renderTodayAttendance(records) {
    const attendanceEl = document.getElementById("viewJanitorAttendance");
    if (records.length === 0) {
      attendanceEl.innerHTML = "<p>No attendance records for today</p>";
      return;
    }

    let html = "<div class='attendance-timeline'>";
    records.forEach((record) => {
      const time = record.timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const icon = attendanceManager.getAttendanceIcon(record.type);
      const label = attendanceManager.getAttendanceLabel(record.type);
      html += `<div class='attendance-item'>
        <i class='${icon}'></i>
        <span>${label} at ${time}</span>
      </div>`;
    });
    html += "</div>";
    attendanceEl.innerHTML = html;
  }

  // UPDATE STATS CARDS
  updateStats(data) {
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

  // UPDATE JANITOR UI WITH SPECIFIC STATUS
  updateJanitorUIWithStatus(janitorId, status, janitorsData) {
    // Update modal status badge if modal is open
    const statusBadge = document.getElementById("viewJanitorStatus");
    if (statusBadge) {
      statusBadge.textContent = this.getStatusText(status);
      statusBadge.className = `status-badge ${this.getStatusClass(status).replace("status-badge ", "")}`;
    }

    // Update break/duty button
    this.updateBreakDutyButtonWithStatus(janitorId, status);

    // Update clock button
    this.updateClockButtonWithStatus(janitorId, status);

    // Update table row status
    this.updateTableRowStatus(janitorId, janitorsData);

    // Update stats overview
    this.updateStats(janitorsData);
  }

  // UPDATE TABLE ROW STATUS
  updateTableRowStatus(janitorId, janitorsData) {
    const janitor = janitorsData.find((j) => j.id === janitorId);
    if (!janitor) return;

    // Find the table row for this janitor
    const tableRows = document.querySelectorAll("#janitorsTableBody tr");
    for (const row of tableRows) {
      // Check if this row belongs to our janitor (by checking the action buttons)
      const viewBtn = row.querySelector(
        `button[onclick*="viewJanitor('${janitorId}')"]`,
      );
      if (viewBtn) {
        // Update the status cell
        const statusCell = row.querySelector("td:nth-child(2)"); // Status is the 2nd column
        if (statusCell) {
          statusCell.innerHTML = `<span class="${this.getTableStatusClass(janitor.status)}">${this.getStatusText(janitor.status)}</span>`;
        }

        // Update the last active cell
        const lastActiveCell = row.querySelector("td:nth-child(5)"); // Last Active is the 5th column
        if (lastActiveCell) {
          lastActiveCell.textContent = janitor.lastActive || "Never";
        }
        break;
      }
    }
  }

  // UPDATE CLOCK BUTTON WITH SPECIFIC STATUS
  updateClockButtonWithStatus(janitorId, status) {
    const btn = document.getElementById("clockBtn");
    if (!btn) return;

    if (status === "off-duty") {
      // Can clock in
      btn.innerHTML = '<i class="fas fa-clock"></i> Clock In';
      btn.classList.remove("disabled");
      btn.disabled = false;
    } else if (status === "active") {
      // Can clock out
      btn.innerHTML = '<i class="fas fa-clock"></i> Clock Out';
      btn.classList.remove("disabled");
      btn.disabled = false;
    } else if (status === "on-break") {
      // Cannot clock out while on break
      btn.innerHTML = '<i class="fas fa-clock"></i> Clock Out';
      btn.classList.add("disabled");
      btn.disabled = true;
    }
  }

  // UPDATE BREAK/DUTY BUTTON WITH SPECIFIC STATUS
  updateBreakDutyButtonWithStatus(janitorId, status) {
    const btn = document.getElementById("breakDutyBtn");
    if (!btn) return;

    if (status === "active") {
      // Can take break
      btn.innerHTML = '<i class="fas fa-coffee"></i> Take Break';
      btn.classList.remove("btn-success", "btn-warning", "disabled");
      btn.classList.add("btn-info");
      btn.disabled = false;
      btn.title = "Click to take a break";
      btn.style.display = "inline-block";
    } else if (status === "on-break") {
      // Can return to duty
      btn.innerHTML = '<i class="fas fa-play"></i> Return to Duty';
      btn.classList.remove("btn-success", "btn-warning", "disabled");
      btn.classList.add("btn-info");
      btn.disabled = false;
      btn.title = "Click to return to active duty";
      btn.style.display = "inline-block";
    } else {
      // Hide button when off-duty
      btn.style.display = "none";
    }
  }

  // UTILITY FUNCTIONS
  getInitials(name) {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : "??";
  }

  getAvatarClass(index) {
    const colors = ["avatar-1", "avatar-2", "avatar-3", "avatar-4", "avatar-5"];
    return colors[index % colors.length];
  }

  getFirstLetter(name) {
    return name ? name.charAt(0).toUpperCase() : "?";
  }

  getStatusClass(status) {
    switch (status) {
      case "active":
        return "status-badge status-active";
      case "on-break":
        return "status-badge status-on-break";
      case "off-duty":
        return "status-badge status-off-duty";
      default:
        return "status-badge status-off-duty";
    }
  }

  getTableStatusClass(status) {
    switch (status) {
      case "active":
        return "status-badge-table status-active";
      case "on-break":
        return "status-badge-table status-on-break";
      case "off-duty":
        return "status-badge-table status-off-duty";
      default:
        return "status-badge-table status-off-duty";
    }
  }

  getStatusText(status) {
    switch (status) {
      case "active":
        return "On Duty";
      case "on-break":
        return "On Break";
      case "off-duty":
        return "Off Duty";
      default:
        return "Unknown";
    }
  }

  getShiftText(shift) {
    if (!shift) return "Unassigned";
    return shift.charAt(0).toUpperCase() + shift.slice(1);
  }

  getShiftClass(shift) {
    switch (shift) {
      case "morning":
        return "shift-morning";
      case "evening":
        return "shift-evening";
      case "night":
        return "shift-night";
      default:
        return "";
    }
  }

  // SHOW ALERT
  showAlert(message, type) {
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
}

// Export for use in main file
const uiManager = new UIManager();
