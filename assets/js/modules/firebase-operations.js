// Firebase Operations Module
// Handles all database operations for janitors management

class FirebaseOperations {
  constructor() {
    this.db = db; // Assuming db is available globally from firebase-config.js
  }

  // FETCH: Get all janitors with real-time updates
  fetchJanitors(callback) {
    return this.db.collection("users")
      .where("role", "==", "janitor")
      .onSnapshot(
        (snapshot) => {
          const janitors = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Sort by createdAt in JavaScript to avoid composite index requirement
          janitors.sort((a, b) => {
            const aTime = a.createdAt?.toDate() || new Date(0);
            const bTime = b.createdAt?.toDate() || new Date(0);
            return bTime - aTime; // Descending order (newest first)
          });

          callback(janitors);
        },
        (error) => {
          console.error("Error fetching janitors:", error);
          throw error;
        }
      );
  }

  // CREATE: Add new janitor
  async createJanitor(janitorData) {
    console.log(`FirebaseOps: Creating new janitor`, janitorData);

    // Create janitor in users collection
    const docRef = await this.db.collection("users").add(janitorData);
    const janitorId = docRef.id;
    console.log(`FirebaseOps: Janitor created with ID: ${janitorId}`);

    // Create corresponding points record
    const pointsData = {
      userId: janitorId,
      name: janitorData.name,
      email: janitorData.email,
      totalPoints: 0, // Start with 0 points
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await this.db.collection("points").doc(janitorId).set(pointsData);
    console.log(`FirebaseOps: Points record created for janitor ${janitorId}`);

    return janitorId;
  }

  // UPDATE: Update existing janitor
  async updateJanitor(id, updateData) {
    console.log(`FirebaseOps: Updating janitor ${id}`, updateData);

    // Update janitor in users collection
    await this.db.collection("users").doc(id).update(updateData);

    // If name or email was updated, also update the points record
    const pointsUpdateData = {};
    if (updateData.name !== undefined) {
      pointsUpdateData.name = updateData.name;
    }
    if (updateData.email !== undefined) {
      pointsUpdateData.email = updateData.email;
    }

    if (Object.keys(pointsUpdateData).length > 0) {
      pointsUpdateData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      await this.db.collection("points").doc(id).update(pointsUpdateData);
      console.log(`FirebaseOps: Points record updated for janitor ${id}`);
    }
  }

  // DELETE: Remove janitor and all related data
  async deleteJanitor(id) {
    console.log(`FirebaseOps: Starting deletion of janitor ${id} and related data`);

    try {
      // Delete attendance records
      console.log(`FirebaseOps: Deleting attendance records for janitor ${id}`);
      const attendanceQuery = await this.db.collection("attendance")
        .where("janitorId", "==", id)
        .get();

      const attendanceDeletions = attendanceQuery.docs.map(doc => doc.ref.delete());
      await Promise.all(attendanceDeletions);
      console.log(`FirebaseOps: Deleted ${attendanceDeletions.length} attendance records`);

      // Delete points record
      console.log(`FirebaseOps: Deleting points record for janitor ${id}`);
      await this.db.collection("points").doc(id).delete();
      console.log(`FirebaseOps: Points record deleted`);

      // Delete janitor from users collection
      console.log(`FirebaseOps: Deleting janitor from users collection`);
      await this.db.collection("users").doc(id).delete();
      console.log(`FirebaseOps: Janitor deleted successfully`);

    } catch (error) {
      console.error(`FirebaseOps: Error deleting janitor ${id}:`, error);
      throw error;
    }
  }

  // ATTENDANCE: Create attendance record
  async createAttendanceRecord(attendanceData) {
    console.log(`FirebaseOps: Creating attendance record in collection 'attendance'`, attendanceData);
    await this.db.collection("attendance").add(attendanceData);
    console.log(`FirebaseOps: Attendance record created successfully`);
  }

  // ATTENDANCE: Get attendance records for a janitor
  async getJanitorAttendance(janitorId, days = 30) {
    try {
      console.log(`FirebaseOps: Attempting compound query for janitor ${janitorId}`);
      // Try compound query first (requires composite index)
      const attendance = await this.db.collection("attendance")
        .where("janitorId", "==", janitorId)
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();

      const records = attendance.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : new Date(),
      }));

      console.log(`FirebaseOps: Compound query successful, returned ${records.length} records`);
      return records;
    } catch (error) {
      console.error("FirebaseOps: Compound query failed, trying simpler query:", error);

      try {
        console.log(`FirebaseOps: Attempting simple query for janitor ${janitorId}`);
        // Fallback: Get all attendance records for this janitor without ordering
        const attendance = await this.db.collection("attendance")
          .where("janitorId", "==", janitorId)
          .get();

        const records = attendance.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : new Date(),
        }));

        // Sort in JavaScript instead of Firestore
        const sortedRecords = records.sort((a, b) => b.timestamp - a.timestamp);
        console.log(`FirebaseOps: Simple query successful, returned ${sortedRecords.length} records`);
        return sortedRecords;
      } catch (simpleError) {
        console.error("FirebaseOps: Simple query also failed:", simpleError);
        return [];
      }
    }
  }

  // ATTENDANCE: Get today's attendance
  async getTodayAttendance(janitorId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const attendance = await this.db.collection("attendance")
        .where("janitorId", "==", janitorId)
        .where("timestamp", ">=", firebase.firestore.Timestamp.fromDate(today))
        .where("timestamp", "<", firebase.firestore.Timestamp.fromDate(tomorrow))
        .orderBy("timestamp")
        .get();

      return attendance.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      }));
    } catch (error) {
      console.error("Today's attendance compound query failed, trying alternative:", error);

      try {
        // Fallback: Get all records for janitor and filter in JavaScript
        const allAttendance = await this.db.collection("attendance")
          .where("janitorId", "==", janitorId)
          .get();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayRecords = allAttendance.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : new Date(),
          }))
          .filter(record => {
            const recordDate = new Date(record.timestamp);
            return recordDate >= today && recordDate < tomorrow;
          })
          .sort((a, b) => a.timestamp - b.timestamp);

        return todayRecords;
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        return [];
      }
    }
  }
}

// Export for use in main file
const firebaseOps = new FirebaseOperations();