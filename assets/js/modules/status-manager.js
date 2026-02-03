// Status Management Module
// Handles all status changes and attendance tracking

class StatusManager {
  constructor(firebaseOps, attendanceManager, uiManager) {
    this.firebaseOps = firebaseOps;
    this.attendanceManager = attendanceManager;
    this.uiManager = uiManager;
  }

  // SET JANITOR STATUS
  async setJanitorStatus(id, newStatus, janitorsData) {
    try {
      const janitorIndex = janitorsData.findIndex(j => j.id === id);
      if (janitorIndex === -1) return;

      const janitor = janitorsData[janitorIndex];
      const now = new Date();
      const updateData = {
        status: newStatus,
        lastActive: now.toLocaleString(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      // Handle attendance tracking
      if (newStatus === 'active' && janitor.status !== 'active') {
        // Clocking in - create attendance record
        await this.attendanceManager.createAttendanceRecord(id, 'clock-in', now);
      } else if (newStatus === 'off-duty' && janitor.status === 'active') {
        // Clocking out - create attendance record
        await this.attendanceManager.createAttendanceRecord(id, 'clock-out', now);
      } else if (newStatus === 'on-break' && janitor.status === 'active') {
        // Going on break - create break start record
        await this.attendanceManager.createAttendanceRecord(id, 'break-start', now);
      } else if (newStatus === 'active' && janitor.status === 'on-break') {
        // Returning from break - create break end record
        await this.attendanceManager.createAttendanceRecord(id, 'break-end', now);
      }

      await this.firebaseOps.updateJanitor(id, updateData);

      // Update local data immediately
      janitorsData[janitorIndex] = {
        ...janitor,
        status: newStatus,
        lastActive: now.toLocaleString(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      // Update UI immediately
      this.uiManager.updateJanitorUIWithStatus(id, newStatus, janitorsData);

      this.uiManager.showAlert(`Janitor status updated to ${this.uiManager.getStatusText(newStatus)}`, "success");
    } catch (error) {
      console.error("Error updating status:", error);
      this.uiManager.showAlert("Failed to update status.", "danger");
      // Note: Local data is not reverted here as the real-time listener will update it with correct data
    }
  }

  // TOGGLE CLOCK IN/OUT
  async toggleClockInOut(currentJanitorId, janitorsData) {
    if (!currentJanitorId) {
      return;
    }

    const janitorId = currentJanitorId;
    const janitorIndex = janitorsData.findIndex(j => j.id === janitorId);
    if (janitorIndex === -1) {
      return;
    }

    const janitor = janitorsData[janitorIndex];
    const now = new Date();
    let newStatus;
    let attendanceType;

    // Determine action based on current status
    if (janitor.status === 'off-duty') {
      // Clock in
      newStatus = 'active';
      attendanceType = 'clock-in';
    } else if (janitor.status === 'active') {
      // Clock out
      newStatus = 'off-duty';
      attendanceType = 'clock-out';
    } else if (janitor.status === 'on-break') {
      // Cannot clock out while on break - button should be disabled
      return;
    }

    try {
      const updateData = {
        status: newStatus,
        lastActive: now.toLocaleString(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      // Create attendance record
      await this.attendanceManager.createAttendanceRecord(janitorId, attendanceType, now);

      // Update janitor status
      await this.firebaseOps.updateJanitor(janitorId, updateData);

      // Update local data immediately
      janitorsData[janitorIndex] = {
        ...janitor,
        status: newStatus,
        lastActive: now.toLocaleString(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      // Update UI immediately with the new status
      this.uiManager.updateJanitorUIWithStatus(janitorId, newStatus, janitorsData);

      // Refresh attendance records to show the new entry
      await this.loadJanitorAttendanceForModal(janitorId);

      this.uiManager.showAlert(`Janitor ${attendanceType === 'clock-in' ? 'clocked in' : attendanceType === 'clock-out' ? 'clocked out' : 'started break'} successfully`, "success");

    } catch (error) {
      console.error('Error toggling clock in/out:', error);
      this.uiManager.showAlert('Failed to update attendance', 'danger');
    }
  }

  // LOAD ATTENDANCE DATA FOR MODAL
  async loadJanitorAttendanceForModal(janitorId) {
    try {
      const attendanceData = await this.attendanceManager.loadJanitorAttendance(janitorId);

      // Update work hours display
      document.getElementById("viewJanitorWorkHours").textContent = `${attendanceData.workHours.toFixed(1)} hours`;

      // Render attendance records
      this.uiManager.renderAttendanceRecords(attendanceData.records);

    } catch (error) {
      console.error("Error loading attendance:", error);
      document.getElementById("viewJanitorWorkHours").textContent = "Error loading data";
    }
  }
}

// Export for use in main file
const statusManager = new StatusManager(firebaseOps, attendanceManager, uiManager);