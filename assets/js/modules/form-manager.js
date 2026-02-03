// Form Handling Module
// Handles all form operations for creating and editing janitors

class FormManager {
  constructor(firebaseOps, uiManager) {
    this.firebaseOps = firebaseOps;
    this.uiManager = uiManager;
    this.isEditing = false;
    this.currentEditId = null;
    this.modalElement = null;
  }

  // INITIALIZE MODALS
  initializeModals() {
    this.modalElement = new bootstrap.Modal(
      document.getElementById("addJanitorModal"),
    );

    // Handle modal close/reset
    const myModalEl = document.getElementById("addJanitorModal");
    myModalEl.addEventListener("hidden.bs.modal", () => {
      this.resetModalState();
    });
  }

  // CREATE OR UPDATE JANITOR
  async createJanitor() {
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
    const dutyStatus = document.getElementById("janitorDutyStatus").value;

    // Basic Validation
    if (!name || !email || !shift || (!this.isEditing && !password)) {
      this.uiManager.showAlert("Please fill in all required fields.", "warning");
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
        role: "janitor",
        status: this.isEditing
          ? janitorsData.find((j) => j.id === this.currentEditId)?.status || dutyStatus || "off-duty"
          : dutyStatus || "off-duty",
        lastActive: new Date().toLocaleString(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (password) janitorData.tempPassword = password;

      if (this.isEditing) {
        await this.firebaseOps.updateJanitor(this.currentEditId, janitorData);
        this.uiManager.showAlert("Janitor updated successfully!", "success");
      } else {
        janitorData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await this.firebaseOps.createJanitor(janitorData);
        this.uiManager.showAlert("Janitor created successfully!", "success");
      }

      // Reset and Close
      form.reset();
      this.modalElement.hide();
      this.resetModalState();
    } catch (error) {
      console.error("Error saving janitor:", error);
      this.uiManager.showAlert(error.message, "danger");
    } finally {
      btn.innerHTML =
        '<i class="fas fa-plus"></i> ' +
        (this.isEditing ? "Update Janitor" : "Create Janitor");
      btn.disabled = false;
    }
  }

  // PREPARE EDIT FORM
  editJanitor(id, janitorsData) {
    const janitor = janitorsData.find((j) => j.id === id);
    if (!janitor) return;

    this.isEditing = true;
    this.currentEditId = id;

    // Populate Form
    document.getElementById("janitorName").value = janitor.name;
    document.getElementById("janitorEmail").value = janitor.email;
    document.getElementById("janitorPhone").value = janitor.phone;
    document.getElementById("janitorShift").value = janitor.shift;
    document.getElementById("janitorArea").value = janitor.assignedArea || "";
    document.getElementById("janitorNotes").value = janitor.notes || "";
    document.getElementById("janitorDutyStatus").value = janitor.status || "off-duty";

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
    this.modalElement.show();
  }

  // RESET MODAL STATE
  resetModalState() {
    document.getElementById("addJanitorForm").reset();
    this.isEditing = false;
    this.currentEditId = null;
    document.getElementById("createJanitorBtn").innerHTML =
      '<i class="fas fa-plus"></i> Create Janitor';
    document.getElementById("addJanitorModalLabel").innerHTML =
      '<i class="fas fa-user-plus"></i> Add New Janitor';
    document.getElementById("janitorPassword").required = true;
    document.getElementById("janitorPassword").placeholder =
      "Enter temporary password";
    // Reset duty status to default
    document.getElementById("janitorDutyStatus").value = "off-duty";
  }

  // DELETE JANITOR
  async deleteJanitor(id) {
    if (
      confirm(
        "Are you sure you want to delete this janitor? This will permanently delete the janitor, all their attendance records, and points data. This action cannot be undone.",
      )
    ) {
      try {
        await this.firebaseOps.deleteJanitor(id);
        this.uiManager.showAlert("Janitor and all related data deleted successfully.", "success");

        // Close the modal if it's open
        const viewModal = bootstrap.Modal.getInstance(document.getElementById("viewJanitorModal"));
        if (viewModal) {
          viewModal.hide();
        }

        // The janitors list should auto-refresh due to real-time listeners,
        // but we can force a refresh if needed
        if (window.fetchJanitors) {
          window.fetchJanitors();
        }

      } catch (error) {
        console.error("Error deleting:", error);
        this.uiManager.showAlert("Failed to delete janitor and related data.", "danger");
      }
    }
  }
}

// Export for use in main file
const formManager = new FormManager(firebaseOps, uiManager);