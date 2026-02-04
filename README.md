# Smart Trash Admin Panel

## Overview

**Smart Trash** is a comprehensive waste management and environmental sustainability platform designed to manage trash bins, monitor sanitation workers (janitors), track performance, and maintain activity logs. The system uses QR-based management with real-time monitoring capabilities to streamline trash collection operations and promote a cleaner environment.

---

## 🎯 What This System Does

Smart Trash is an **Admin Control Center** that allows managers and supervisors to:

- **Monitor Trash Bins** in real-time with fill level tracking
- **Manage Janitor Teams** and assign tasks
- **Track Performance** through a competitive leaderboard system
- **Log All Activities** for transparency and accountability
- **Receive Alerts** when bins require immediate attention
- **Generate Insights** through dashboard statistics

This system empowers organizations to optimize waste collection operations, improve response times, and create a culture of cleanliness and responsibility.

---

## 📋 Key Features

### 1. **Dashboard** (Main Overview)

- **Real-time Statistics**
  - Total number of trash bins in the system
  - Active janitors currently working
  - Critical alerts requiring immediate action
  - Warning alerts for bins nearing capacity
- **At-a-Glance Information**
  - Bins requiring attention (high fill levels)
  - Status indicators for each bin
  - Last collection timestamps
  - Wet level percentages

### 2. **Trash Bins Management**

- **Create New Bins** - Add new trash bin locations to the system
- **View All Bins** - Complete list with location and status information
- **Monitor Fill Levels** - Track wet waste and dry waste levels separately
- **Status Tracking**
  - Normal (Good condition)
  - Warning (50-74% full)
  - Critical (75% or higher)
  - Urgent (95% or higher)
- **Search & Filter** - Find bins by name, location, or ID
- **Status-based Filtering** - View bins by their condition
- **Edit Bins** - Update bin information (name, location, capacity levels)
- **Delete Bins** - Remove bins from the system
- **Last Collection Tracking** - Know when bins were last emptied

### 3. **Janitors Management**

- **Add New Janitors** - Register new staff members
- **Manage Janitor Profiles** - Update personal information and contact details
- **Track Janitor Status**
  - Active (Currently working)
  - Available (On duty but not assigned)
  - On Break (Taking a break)
  - Off Duty (Scheduled day off)
- **Shift Management** - Assign work shifts (Morning, Afternoon, Night)
- **Search & Filter** - Find janitors by name, ID, or phone number
- **Status-based Filtering** - View janitors by their current status
- **Attendance Tracking** - Monitor clock-in and clock-out times
- **Delete Janitors** - Remove staff from the system

### 4. **Leaderboard** (Performance Tracking)

- **Ranked Janitors** - Display top performers based on contribution
- **Collected Bins Counter** - How many bins each janitor has emptied
- **Total Points System** - Gamified rewards for productivity
- **Multiple Sort Options**
  - Sort by Bins Collected
  - Sort by Total Points Earned
- **Time Period Filtering**
  - All-time records
  - This year
  - This month
  - This week
- **Search Functionality** - Find specific janitors by name or email
- **Performance Motivation** - Encourages healthy competition and productivity

### 5. **User Activities Log**

- **Complete Activity History** - Track all user actions in the system
- **Activity Details Recorded**
  - User email/ID
  - Action performed
  - Page accessed
  - Timestamp of action
  - Device information (User Agent)
- **Search Activities** - Find specific actions by email or activity type
- **Sort Options**
  - By timestamp (most recent first)
  - By activity type
- **Activity Viewing** - Click any activity for detailed information
- **Activity Deletion** - Remove activity logs when necessary
- **Audit Trail** - Full transparency for management review

---

## 🛠️ How It Works

### **System Architecture**

1. **Authentication**
   - Secure admin login with email and password
   - Firebase-based authentication for safety
   - Session management to protect data

2. **Real-time Data Updates**
   - All data syncs instantly across the platform
   - Changes reflect immediately without page refresh
   - Live monitoring of bin statuses and janitor activities

3. **Data Flow**
   ```
   Admin Login → Dashboard Overview → Manage Bins/Janitors → Track Performance → Review Activities
   ```

### **Bin Management Workflow**

1. Admin creates or registers new trash bins with locations
2. System monitors fill levels automatically
3. When bins reach warning threshold (50%), alerts are generated
4. Critical alerts trigger when bins reach 75% capacity
5. Janitors collect waste and update collection status
6. Dashboard reflects updated bin status in real-time

### **Janitor Management Workflow**

1. New janitors are registered in the system
2. Status tracking shows their availability and work schedule
3. Performance is measured by bins collected and points earned
4. Leaderboard motivates competition and excellence
5. Attendance is logged automatically with clock-in/out times

### **Performance Tracking Workflow**

1. Each bin collection action earns points
2. Points accumulate in janitor's profile
3. Leaderboard ranks janitors by performance
4. Time-based filtering allows comparing performance periods
5. Top performers can be recognized and rewarded

---

## 👤 User Roles

### **Admin/Supervisor**

- Full system access
- Can create, edit, and delete bins
- Can manage janitor staff
- Can view all activities and performance metrics
- Can make system-wide decisions

---

## 📊 Dashboard Statistics Explained

| Metric                       | Description                                         |
| ---------------------------- | --------------------------------------------------- |
| **Total Bins**               | Count of all trash bins in the system               |
| **Active Janitors**          | Number of janitors currently on duty                |
| **Critical Alerts**          | Bins at 75%+ capacity requiring immediate attention |
| **Warning Alerts**           | Bins at 50-74% capacity that need monitoring        |
| **Bins Requiring Attention** | Combined critical and warning bins                  |

---

## 🚨 Alert System

The system uses a **three-level alert system** based on fill levels:

### **Status Levels**

- 🟢 **Normal** (0-49%) - Good condition, no action needed
- 🟡 **Warning** (50-74%) - Monitor closely, schedule collection soon
- 🔴 **Critical** (75-94%) - Immediate attention required
- 🔴 **Urgent** (95-100%) - Priority collection needed immediately

---

## 🔐 Security & Data Privacy

- **Secure Authentication** - Only authorized admins can access the system
- **Role-based Access** - Different permission levels for different users
- **Activity Logging** - All actions are tracked for audit purposes
- **Data Encryption** - Sensitive information is protected
- **Real-time Backup** - Firebase ensures data is always backed up

---

## 📱 Responsive Design

The admin panel is built with modern web standards and works across:

- Desktop computers and laptops
- Tablets
- Responsive interface that adapts to any screen size

---

## 🎨 User Interface Features

- **Intuitive Sidebar Navigation** - Easy access to all modules
- **Search Functionality** - Quick access to specific records
- **Filtering Options** - Sort and filter data by multiple criteria
- **Modal Dialogs** - View and edit details in focused windows
- **Real-time Updates** - See changes instantly without refreshing
- **Status Badges** - Visual indicators for quick status recognition
- **Alert System** - Toast notifications for user feedback
- **Professional Design** - Clean, modern, and easy to navigate

---

## 🔧 Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework**: Bootstrap 5.3 for responsive design
- **Icons**: Font Awesome 6.4 for visual elements
- **Database**: Firebase Firestore for real-time data storage
- **Authentication**: Firebase Authentication
- **Architecture**: Modular JavaScript with specialized modules for:
  - Firebase Operations
  - Form Management
  - UI Management
  - Status Management
  - Attendance Tracking

---

## 📖 Pages Overview

| Page                     | Purpose                               |
| ------------------------ | ------------------------------------- |
| **index.html**           | Admin login page                      |
| **dashboard.html**       | Overview and quick statistics         |
| **bins.html**            | Full trash bin management             |
| **janitors.html**        | Janitor staff management              |
| **leaderboard.html**     | Performance rankings and achievements |
| **user_activities.html** | Complete activity audit log           |

---

## ✅ Getting Started

1. **Login** - Access the system with admin credentials on the login page
2. **View Dashboard** - Check real-time statistics and alerts
3. **Add Bins** - Create entries for each trash location
4. **Add Janitors** - Register staff members
5. **Monitor Operations** - Track performance and respond to alerts
6. **Review Activities** - Check activity logs for accountability

---

## 📞 Support & Maintenance

- The system uses Firebase as the backend, providing:
  - Automatic data synchronization
  - Cloud storage and backup
  - Real-time database updates
  - Built-in security rules

- Regular monitoring of:
  - Critical alerts
  - Janitor attendance
  - System performance
  - Activity logs

---

## 🌍 Benefits of Smart Trash

✅ **Operational Efficiency** - Optimize waste collection routes and schedules
✅ **Cost Reduction** - Prevent overflow incidents and unnecessary collections
✅ **Environmental Impact** - Promote cleanliness and sustainability
✅ **Staff Motivation** - Leaderboard creates friendly competition
✅ **Data Transparency** - Complete audit trail of all activities
✅ **Real-time Insights** - Make informed decisions based on live data
✅ **Scalability** - Manage multiple locations and teams
✅ **Accountability** - Track who did what and when

---

## 📝 Summary

Smart Trash is a powerful, easy-to-use platform that transforms trash management from reactive to proactive. By providing real-time monitoring, performance tracking, and complete activity logging, it enables organizations to maintain cleaner spaces, optimize resources, and build a culture of responsibility.

**Built for sustainability. Designed for efficiency. Powered by data.**

---

_Last Updated: February 2026_
_Version: 1.0_
