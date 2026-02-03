// Attendance Module
// Handles all attendance-related operations and calculations

class AttendanceManager {
  constructor(firebaseOps) {
    this.firebaseOps = firebaseOps;
  }

  // CREATE ATTENDANCE RECORD
  async createAttendanceRecord(janitorId, type, timestamp) {
    try {
      console.log(`AttendanceManager: Creating attendance record for janitor ${janitorId}, type: ${type}, timestamp: ${timestamp}`);
      const attendanceData = {
        janitorId,
        type, // 'clock-in', 'clock-out', 'break-start', 'break-end'
        timestamp: firebase.firestore.Timestamp.fromDate(timestamp),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await this.firebaseOps.createAttendanceRecord(attendanceData);
      console.log(`AttendanceManager: Successfully created attendance record`);
    } catch (error) {
      console.error("Error creating attendance record:", error);
      throw error;
    }
  }

  // CALCULATE WORK HOURS FROM ATTENDANCE RECORDS
  calculateWorkHours(attendanceRecords) {
    const workSessions = [];
    let currentSession = null;

    attendanceRecords.sort((a, b) => a.timestamp - b.timestamp);

    for (const record of attendanceRecords) {
      if (record.type === 'clock-in') {
        currentSession = { start: record.timestamp, breaks: [] };
      } else if (record.type === 'clock-out' && currentSession) {
        currentSession.end = record.timestamp;
        workSessions.push(currentSession);
        currentSession = null;
      } else if (record.type === 'break-start' && currentSession) {
        currentSession.breaks.push({ start: record.timestamp });
      } else if (record.type === 'break-end' && currentSession && currentSession.breaks.length > 0) {
        currentSession.breaks[currentSession.breaks.length - 1].end = record.timestamp;
      }
    }

    let totalHours = 0;
    for (const session of workSessions) {
      if (session.start && session.end) {
        let sessionHours = (session.end - session.start) / (1000 * 60 * 60); // hours

        // Subtract break time
        for (const breakPeriod of session.breaks) {
          if (breakPeriod.start && breakPeriod.end) {
            sessionHours -= (breakPeriod.end - breakPeriod.start) / (1000 * 60 * 60);
          }
        }

        totalHours += Math.max(0, sessionHours); // Ensure non-negative
      }
    }

    return totalHours;
  }

  // GET ATTENDANCE ICON
  getAttendanceIcon(type) {
    switch (type) {
      case 'clock-in': return 'fas fa-sign-in-alt';
      case 'clock-out': return 'fas fa-sign-out-alt';
      case 'break-start': return 'fas fa-pause-circle';
      case 'break-end': return 'fas fa-play-circle';
      default: return 'fas fa-clock';
    }
  }

  // GET ATTENDANCE LABEL
  getAttendanceLabel(type) {
    switch (type) {
      case 'clock-in': return 'Clocked In';
      case 'clock-out': return 'Clocked Out';
      case 'break-start': return 'Started Break';
      case 'break-end': return 'Ended Break';
      default: return type;
    }
  }

  // GET ATTENDANCE TYPE TEXT
  getAttendanceTypeText(type) {
    switch (type) {
      case 'clock-in': return 'Clock In';
      case 'clock-out': return 'Clock Out';
      case 'break-start': return 'Break Start';
      case 'break-end': return 'Break End';
      default: return type;
    }
  }

  // LOAD ATTENDANCE DATA FOR JANITOR
  async loadJanitorAttendance(janitorId) {
    try {
      console.log(`AttendanceManager: Loading attendance for janitor ${janitorId}`);
      const attendanceRecords = await this.firebaseOps.getJanitorAttendance(janitorId, 30);
      console.log(`AttendanceManager: Retrieved ${attendanceRecords.length} records from Firebase`);
      const workHours = this.calculateWorkHours(attendanceRecords);
      console.log(`AttendanceManager: Calculated ${workHours} work hours`);

      return {
        records: attendanceRecords,
        workHours: workHours
      };
    } catch (error) {
      console.error("Error loading attendance:", error);
      throw error;
    }
  }

  // LOAD TODAY'S ATTENDANCE
  async loadTodayAttendance(janitorId) {
    try {
      return await this.firebaseOps.getTodayAttendance(janitorId);
    } catch (error) {
      console.error("Error loading today's attendance:", error);
      return [];
    }
  }
}

// Export for use in main file
const attendanceManager = new AttendanceManager(firebaseOps);