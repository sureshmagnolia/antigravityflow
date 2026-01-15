# Developer Training Manual & Codebase Map

## 1. Project Overview
**AntigravityFlow** is a comprehensive Exam Invigilation Management System. It handles staff allocation, room allotment, student seating, absentee reporting, and remuneration.

### **Architecture**
- **Frontend**: Vanilla HTML/JS with TailwindCSS for styling.
- **Backend/Database**: Firebase Firestore (NoSQL) & Authentication.
- **Hosting**: Firebase Hosting.
- **Python Integration**: Uses PyScript for client-side Python execution (likely for complex parsing logic, e.g., CSV imports).

### **Data Flow**
1.  **Initialization**: `index.html` initializes Firebase and exposes definitions globally.
2.  **Logic loading**: `invigilation.js` and `app.js` load.
3.  **Bootstrapping**: `DOMContentLoaded` events in both files trigger data fetching from Firebase.
4.  **State Management**: Heavy reliance on global variables (`staffData`, `invigilationSlots`, `currentUser`) and `localStorage` for caching.

---

## 2. Core Modules & File Roles

### **A. Entry Point (`index.html`)**
- **Role**: The skeleton of the application.
- **Key Actions**:
    - Loads external libraries (Tailwind, jsPDF, PyScript, Google APIs).
    - **Initializes Firebase**: Creates the `window.firebase` object with Auth and Firestore instances.
    - Defines the main DOM structure (Login View, Admin Dashboard, Staff Dashboard).

### **B. Invigilation Logic (`invigilation.js`)**
**Primary Role**: Handles User Authentication, Staff Management, and Exam Duty Allocation.

#### **Key Functional Groups:**
1.  **Authentication**:
    - `handleLogin(user)`: Validates user email against the database. Determines if Admin or Staff.
    - `verifyAndLaunch(...)`: Routes the user to the correct dashboard.

2.  **Dashboard Initialization**:
    - `initAdminDashboard()`: Loads data for the Admin view (Staff list, Slots grid).
    - `initStaffDashboard(me)`: Loads the personal view for a staff member (My Duties, Remuneration).

3.  **Slot Management** (The Grid):
    - `renderSlotsGridAdmin()`: The massive function that draws the main calendar grid.
    - `toggleAdminLock(key)`: Locks sessions to prevent staff from changing their availability.

4.  **Manual Allocation**:
    - `setupSearchHandler(...)`: Generic logic for searching staff (CS/SAS/Invigilators) with auto-complete.
    - `saveManualAllocation()`: Commits manual staff assignments to Firestore.

5.  **Data Sync**:
    - `syncSlotsToCloud()`: Pushes `invigilationSlots` to Firebase.
    - `syncStaffToCloud()`: Pushes `staffData` to Firebase.

### **C. App Logic (`app.js`)**
**Primary Role**: Handles Room Allotment, Student Data (Parsing), QP Codes, and Absentees. This file bridges the gap between raw student data and the exam execution.

#### **Key Functional Groups:**
1.  **Data Parsing (Python Bridge)**:
    - `upload_and_process_csv()`: (Likely calls Python) Parses uploaded student CSVs.
    - `finalizeAppLoad()`: Called when data is ready.

2.  **Room Allotment**:
    - `renderRoomAllotmentPanel()`: UI for assigning students to rooms.
    - `autoAllotRooms()`: Algorithmic logic to distribute students into rooms based on capacity and stream mixing rules.

3.  **QP Code Management**:
    - `loadQPCodes()`: Reads QP codes from storage.
    - `subscribeToQPSession(sessionKey)`: **[Real-Time]** Listens to Firebase for live QP code updates.

4.  **Absentee Management**:
    - `markAbsentee(...)`: Toggles student attendance.
    - `generateAbsenteeReport(...)`: Creates the textual report for printing.

5.  **Printing**:
    - `printDashboardSession(...)`: Generates a clean, print-friendly version of the session dashboard.

### **D. Helpers**
- **`ui-modal.js`**:
    - `openModal(id)` / `closeModal(id)`: Standardized logic for showing/hiding popups.
    - `setupModalClosers()`: Closes modals on Escape key or outside click.
- **`remuneration.js`**:
    - Calculates payments based on duties performed.

---

## 3. Key Inter-linkages (How it works together)

### **1. The "Global" State**
The app relies on `window` globals to share data between `invigilation.js` and `app.js`.
- **`window.firebase`**: Defined in `index.html`, used by *everyone* to talk to the DB.
- **`window.currentCollegeId`**: Set by `invigilation.js` (Auth), used by `app.js` to know path to save data.
- **`window.staffData`**: Loaded by `invigilation.js`, used by `app.js` for dropdowns/validations.

### **2. The Sync Loop**
1.  **User Action**: User assigns a staff member in `invigilation.js`.
2.  **Local Update**: `invigilationSlots` object is updated in memory.
3.  **Cloud Sync**: `syncSlotsToCloud()` is called.
4.  **Persistence**: Firestore updates `colleges/{id}/system_data/slots`.

### **3. Real-Time Logic (The "Listener")**
- **QP Codes**: `app.js` establishes a `onSnapshot` listener (`subscribeToQPSession`). When Cloud data changes (e.g., another admin updates a code), the listener fires, updates `qpCodeMap`, and re-renders the UI immediately.

### **4. Python Integration**
- `index.html` loads PyScript.
- `app.js` defines global functions (e.g., `window.populate_session_dropdown`) that Python scripts can call to manipulate the DOM after processing heavy data.

## 4. Specific Function Deep-Dives

### **`getDutiesDoneCount(email)`**
- **Why**: To ensure fair distribution of work.
- **Logic**: Filters all past exam sessions. Checks if `slot.attendance` contains the email. Returns the integer count.

### **`renderSlotsGridAdmin()`**
- **Why**: The heart of the admin UI.
- **Logic**:
    1.  Iterates through every day in the academic calendar.
    2.  Check for "Sessions" (FN/AN) on that day.
    3.  Draws the "Card" for that slot.
    4.  Calculates status (Full/Empty/Locked).
    5.  Attaches click handlers for standard actions.

### **`setupSearchHandler(inputId, ...)`**
- **Why**: Reusable logic for autocomplete search boxes.
- **Logic**:
    - Listens to `input` event.
    - Filters `staffData` by name/dept.
    - Renders dropdown.
    - **Crucial Feature**: On selection, it can trigger callbacks (like `addAttendanceRow`) to auto-update lists.

### **`finalizeAppLoad()`**
- **Why**: The "Ready" signal.
- **Logic**:
    - Hides the loading screen.
    - Checks `localStorage` configuration.
    - Initializes the main view state.

---
**Maintained by**: Development Team (Automated Generation)
**Last Updated**: 2026-01-14

---

## 5. Complete Function Reference

This annexure exhaustively lists every function found in the codebase. (Auto-Generated 2026-01-14)

### A. invigilation.js

| Function Name | Role / Description (Context) |
| :--- | :--- |
| **`acceptExchange(key, buyerEmail, sellerEmail)`** | Utility / Helper function. |
| **`addAttendanceRow(email, isLocked)`** | Utility / Helper function. |
| **`addNewDepartment()`** | Utility / Helper function. |
| **`addNewRoleConfig()`** | Utility / Helper function. |
| **`addStaffAccess(email)`** | Utility / Helper function. |
| **`addSubstituteToAttendance()`** | Utility / Helper function. |
| **`addVacationHoliday()`** | Utility / Helper function. |
| **`adminMarkUnavailable(key, email)`** | Utility / Helper function. |
| **`adminRemoveUnavailable(key, email, isAdvance)`** | Utility / Helper function. |
| **`applyCollegeConfig(data, mode, triggerRender)`** | [Config] Applies dynamic college settings (Name, Departments, Rules) from Firestore to the UI. |
| **`calculateReportTime(timeStr)`** | Utility / Helper function. |
| **`calculateSlotsFromSchedule()`** | [Doc] LIGHTWEIGHT VERSION: Just refreshes the slots from the cloud |
| **`calculateStaffTarget(staff)`** | [Logic] Retrieves or calculates 'calculateStaffTar'. |
| **`cancelBulkSending()`** | Utility / Helper function. |
| **`cancelDuty(key, email, isLocked)`** | Utility / Helper function. |
| **`changeAdminMonth(delta)`** | Utility / Helper function. |
| **`changeRankPage(delta)`** | Utility / Helper function. |
| **`changeSlotReq(key, delta)`** | Utility / Helper function. |
| **`clearOldData()`** | Utility / Helper function. |
| **`closeModal(id)`** | [UI] Standard utility to hide a modal. |
| **`confirmUnavailable()`** | Utility / Helper function. |
| **`deleteDepartment(name)`** | Utility / Helper function. |
| **`deleteRoleConfig(role)`** | Utility / Helper function. |
| **`deleteSlot(key)`** | Utility / Helper function. |
| **`deleteStaff(index)`** | [Action] Soft-deletes a staff member (marks as removing access). |
| **`downloadAttendanceCSV()`** | [Data] Loads 'downAttendanceCSV' from storage/cloud. |
| **`downloadAttendancePDF()`** | [Doc] 1. ATTENDANCE REGISTER PDF |
| **`downloadAttendanceTemplate()`** | [Doc] 1. Download Template |
| **`downloadMasterBackup()`** | [Doc] 💾 MASTER BACKUP & RESTORE SYSTEM |
| **`downloadPDF()`** | [Data] Loads 'downPDF' from storage/cloud. |
| **`downloadStaffTemplate()`** | [Doc] 1. Download Template (Updated for DD-MM-YY) |
| **`downloadVacationPDF()`** | [Doc] 2. VACATION REPORT PDF (Corrected: 7 Columns) |
| **`editRoleConfig(role, currentTarget)`** | Utility / Helper function. |
| **`editStaff(index)`** | Utility / Helper function. |
| **`executeReschedule()`** | Utility / Helper function. |
| **`expects(btn, email, name, subject, message)`** | [Doc] Note: 'item.body' contains HTML, so we pass it directly |
| **`filterDisplayedLogs(query)`** | [Doc] Helper to render the logs (Paste this below viewActivityLogs) |
| **`filterManualStaff()`** | Utility / Helper function. |
| **`filterStaffTable()`** | Utility / Helper function. |
| **`findEntry(list)`** | [Doc] Helper to find entry |
| **`finishAttendanceUpload(count, action)`** | [Data] Loads 'finishAttendanceUp' from storage/cloud. |
| **`formatDate(dateStr)`** | [Helper] Formats 'Date' strings/dates. |
| **`formatMessageForEmail(text)`** | [Helper] Formats 'MessageForEmail' strings/dates. |
| **`generateDailySMS(firstName, dateStr, duties)`** | Utility / Helper function. |
| **`generateDailyWhatsApp(name, dateStr, duties)`** | Utility / Helper function. |
| **`generateDepartmentConsolidatedEmail(deptName, facultyData, weekNum, monthStr)`** | Utility / Helper function. |
| **`generateHtmlEmailBody(name, duties)`** | [Doc] 1. Generate HTML for Staff Email (Individual) |
| **`generateProfessionalEmail(name, dutiesArray, title)`** | Utility / Helper function. |
| **`generateRow(email, idx)`** | Utility / Helper function. |
| **`generateVacationReport()`** | Utility / Helper function. |
| **`generateWeeklySMS(firstName, duties)`** | Utility / Helper function. |
| **`generateWeeklyWhatsApp(name, duties)`** | Utility / Helper function. |
| **`generateWelcomeText(name, dept)`** | [Doc] 👋 WELCOME MESSAGE SYSTEM |
| **`getBtnState(isAssigned, isMarked, label, isAdminLocked)`** | [Logic] Retrieves or calculates 'BtnState'. |
| **`getCurrentAcademicYear()`** | [Doc] 2. Calculate Academic Year (Needed for stats) |
| **`getDayEntry(dateObj, dateStr)`** | [Logic] Retrieves or calculates 'DayEntry'. |
| **`getDutiesDoneCount(email)`** | [Fairness] Calcs total duties performed by a staff member by scanning past attendance logs. |
| **`getFirstName(fullName)`** | [Logic] Retrieves or calculates 'FirstName'. |
| **`getIndex(possibleNames)`** | [Doc] Column Mapping |
| **`getLiveStatusIcon(email)`** | [Doc] 2. HELPER: Get Status Dot |
| **`getNameFromEmail(email)`** | [Doc] 1. Get Name from Email (Fixes your console error) |
| **`getRolePhone(role)`** | [Logic] Retrieves or calculates 'RolePhone'. |
| **`getSlotReserves(key)`** | [Logic] Retrieves or calculates 'SlotReserves'. |
| **`getSourceBadge(source)`** | [Doc] Helper to get badge based on source |
| **`getStatusRank(email)`** | [Doc] 1. Live Status Priority (Online > Idle > Offline) |
| **`getWeekOfMonth(date)`** | [Logic] Retrieves or calculates 'WeekOfMonth'. |
| **`handleAttendanceCSVUpload(input)`** | [Doc] 2. Handle Upload |
| **`handleLogin(user)`** | [Auth] Authenticates user via Firebase, determines role (Admin/Staff), and loads initial college data. |
| **`handleMasterRestore(input)`** | Utility / Helper function. |
| **`handleStaffCSVUpload(input)`** | [Doc] 3. Handle File Selection |
| **`hasRealSlot(sessionType)`** | Utility / Helper function. |
| **`initAdminDashboard()`** | [Core] Bootstraps the Admin interface. Fetches heavy data (slots, staff) and renders the main grid. |
| **`initLivePresence(myEmail, myName, isAdmin)`** | [Doc] OPTIMIZED: Only fetches users active in the last 24 hours |
| **`initStaffDashboard(me)`** | [Core] Bootstraps the Staff interface. Filters data to show only the logged-in user's duties and remuneration. |
| **`initializeSession(id, adminStatus, roleName)`** | [Init] Sets global session state (collegeID, isAdmin) and triggers the live sync process. |
| **`isActionAllowed(dateInput)`** | Utility / Helper function. |
| **`isCS(r)`** | [Doc] Helper for Role Matching |
| **`isHoliday(d)`** | [Doc] Helper: Check if date is Holiday |
| **`isSAS(r)`** | Utility / Helper function. |
| **`isUserUnavailable(slot, email, key)`** | [Logic] Checks if a staff is busy (Leave/OD/Exam) for a specific slot. Returns boolean. |
| **`loadSessionAttendance()`** | [Data] Loads 'SessionAttendance' from storage/cloud. |
| **`lockAllSessions()`** | Utility / Helper function. |
| **`logActivity(action, details)`** | Utility / Helper function. |
| **`markAsSent(btn)`** | Utility / Helper function. |
| **`notifySlotReserves(key)`** | Utility / Helper function. |
| **`openAddSlotModal()`** | [UI] Opens the 'AddSlot' modal dialog. |
| **`openAddStaffModal()`** | [UI] Opens the 'AddStaff' modal dialog. |
| **`openCompletedDutiesModal(email)`** | [Doc] Updated: Show Completed Duties Modal (AY Filtered + Neat UI + Admin-Only WhatsApp Share) |
| **`openDashboardInvigModal(sessionKey)`** | [UI] Opens the 'DashboardInvig' modal dialog. |
| **`openDayDetail(dateStr, email)`** | Utility / Helper function. |
| **`openDutyNormsModal()`** | [UI] Opens the 'DutyNorms' modal dialog. |
| **`openGhostUnavailabilityModal(title, encodedList)`** | [Doc] handles the "View List" click from the ghost card. |
| **`openHodMonitorModal()`** | [UI] Opens the 'HodMonitor' modal dialog. |
| **`openInconvenienceModal(key)`** | [Doc] [In invigilation.js] |
| **`openManualAllocationModal(key)`** | [UI] Opens the 'ManualAllocation' modal dialog. |
| **`openModal(id)`** | [UI] Standard utility to show a modal with animation. |
| **`openRescheduleModal(key)`** | [Doc] 🗓️ RESCHEDULE & ALERT SYSTEM |
| **`openRescheduleNotification(staffList, oldKey, newKey)`** | Utility / Helper function. |
| **`openRoleAssignmentModal(index)`** | [UI] Opens the 'RoleAssignment' modal dialog. |
| **`openRoleConfigModal()`** | [UI] Opens the 'RoleConfig' modal dialog. |
| **`openSlotReminderModal(key)`** | [UI] Opens the 'SlotReminder' modal dialog. |
| **`openVacationReportModal()`** | [Doc] NOTE: 'vacationExtraHolidays', 'vacationStart', 'vacationEnd' are defined in Global State at top. |
| **`openWeeklyNotificationModal(monthStr, weekNum)`** | [Doc] 📢 MESSAGING MENU (Selection Screen) |
| **`parseDate(key)`** | Utility / Helper function. |
| **`parseDateKey(dateStr)`** | Utility / Helper function. |
| **`populateAttendanceSessions()`** | Utility / Helper function. |
| **`populateDepartmentSelect()`** | Utility / Helper function. |
| **`postForExchange(key, email)`** | Utility / Helper function. |
| **`printAttendanceReport()`** | [Print] Generates a print view for 'AttendanceReport'. |
| **`printDutyNotification(key)`** | [Doc] 📄 DUTY NOTIFICATION PREVIEW (No Signature, No Blank Page) |
| **`printSessionReport(key)`** | [Print] Generates a print view for 'SessionReport'. |
| **`printVacationReport(data, start, end)`** | [Print] Generates a print view for 'VacationReport'. |
| **`processAttendanceCSV(csvText)`** | [Doc] 3. Process CSV (Auto-Create Slots for Past Duties) |
| **`processBulkQueue()`** | Utility / Helper function. |
| **`processStaffCSV(csvText)`** | [Doc] 4. Parse & Analyze CSV (Robust Date Parsing) |
| **`removeRoleFromStaff(sIdx, rIdx)`** | Utility / Helper function. |
| **`removeStaffAccess(email)`** | Utility / Helper function. |
| **`removeVacationHoliday(dateStr)`** | Utility / Helper function. |
| **`renderAdminTodayStats()`** | [UI] Renders the 'AdminTodayStats' component/view. |
| **`renderDepartmentsList()`** | [UI] Renders the 'DepartmentsList' component/view. |
| **`renderExchangeMarket(myEmail)`** | [UI] Renders the 'ExchangeMarket' component/view. |
| **`renderMiniTable(list, startIdx)`** | [UI] Renders the 'MiniTable' component/view. |
| **`renderRolesList()`** | [UI] Renders the 'RolesList' component/view. |
| **`renderSession(sessName, data)`** | [UI] Renders a single session card within the grid, showing status icons (Locked, Full, Alert). |
| **`renderSlotsGridAdmin()`** | [UI] **The Matrix**. Renders the main calendar grid, handling date logic, session types (FN/AN), and slot status. |
| **`renderStaffCalendar(myEmail)`** | [UI] Renders the 'StaffCalendar' component/view. |
| **`renderStaffRankList(myEmail)`** | [UI] Renders the 'StaffRankList' component/view. |
| **`renderStaffTable()`** | [UI] Renders the "Staff List" tab with search, filters, and "Edit" capabilities. |
| **`renderStaffUpcomingSummary(email)`** | [Doc] 📋 STAFF UPCOMING SCHEDULE (Interactive & Auto-Height) |
| **`renderVacationHolidays()`** | [UI] Renders the 'VacationHolidays' component/view. |
| **`runAutoAllocation()`** | Utility / Helper function. |
| **`runWeeklyAutoAssign(monthStr, weekNum)`** | Utility / Helper function. |
| **`saveAdvanceUnavailability()`** | [Action] Persists 'AdvanceUnavailability' data to storage. |
| **`saveAttendance()`** | [Action] Saves the "Present" staff list for a specific session (Attendance Register). |
| **`saveManualAllocation()`** | [Action] Commits changes from the "Manual Allocation" modal to the cloud. |
| **`saveManualSlot()`** | [Action] Persists 'ManualSlot' data to storage. |
| **`saveNewStaff()`** | [Action] Saves a new staff member to the database. |
| **`saveRoleAssignment()`** | [Action] Persists 'RoleAssignment' data to storage. |
| **`saveRoleConfig()`** | [Action] Persists 'RoleConfig' data to storage. |
| **`saveVacationConfig()`** | [Action] Persists 'VacationConfig' data to storage. |
| **`sendBulkDeptEmails()`** | [Doc] 2. Bulk Send |
| **`sendBulkEmails(btnId)`** | Utility / Helper function. |
| **`sendEmailViaAppsScript(to, subject, body)`** | Utility / Helper function. |
| **`sendHeartbeat(statusOverride)`** | Utility / Helper function. |
| **`sendIndividualEmail(index)`** | Utility / Helper function. |
| **`sendSessionSMS(key)`** | Utility / Helper function. |
| **`sendSingleDeptEmail(index)`** | [Doc] 1. Single Send |
| **`sendSingleEmail(btn, email, name, subject, message)`** | [Comms] Triggers Google Apps Script (via fetch) to send email notifications. |
| **`sendSingleEmailFromQueue(index)`** | Utility / Helper function. |
| **`sendWelcomeMessage(email)`** | Utility / Helper function. |
| **`setAvailability(key, email, isAvailable)`** | Utility / Helper function. |
| **`setupLiveSync(collegeId, mode)`** | [Sync] **Critical**. Sets up real-time `onSnapshot` listeners for Staff, Slots, and Config modifications. |
| **`setupSearchHandler(inputId, resultsId, hiddenId, excludeCurrentList)`** | [Helper] **Power Search**. precise autocomplete logic used in Manual Allocation and Staff Search. |
| **`showLiveStaffModal()`** | [Doc] 4. UI: Show List Modal |
| **`showView(viewName)`** | Utility / Helper function. |
| **`startNewAcademicYear()`** | [Doc] 🎓 NEW ACADEMIC YEAR LOGIC |
| **`switchAdminTab(tabName)`** | Utility / Helper function. |
| **`switchToStaffView()`** | Utility / Helper function. |
| **`syncAllStaffPermissions()`** | [Sync] Synchronizes 'AllStaffPermissions' data with the cloud. |
| **`syncSlotsToCloud()`** | [Sync] Persists the entire `invigilationSlots` state to Firestore `system_data/slots`. |
| **`syncStaffToCloud()`** | [Sync] Persists `staffData` array to Firestore `system_data/staff`. |
| **`toggleAdminLock(key)`** | [Action] Admin: Locks a session. Prevents staff from volunteering or withdrawing. |
| **`toggleAdvance(dateStr, email, session)`** | [Action] Toggles the state of 'Advance'. |
| **`toggleAttendanceLock(key, lockState)`** | [Action] Toggles the state of 'AttendanceLock'. |
| **`toggleDaysVisibility()`** | [Doc] Helper to toggle weekly days visibility |
| **`toggleDeptLock()`** | [Action] Toggles the state of 'DeptLock'. |
| **`toggleEmailConfigLock()`** | [Action] Toggles the state of 'EmailConfigLock'. |
| **`toggleGlobalTargetLock()`** | [Logic] Retrieves or calculates 'toggleGlobalTarLock'. |
| **`toggleInputVisibility(id, isLocked)`** | [Action] Toggles the state of 'InputVisibility'. |
| **`toggleLock(key)`** | [Action] Toggles the state of 'Lock'. |
| **`toggleRoleLock()`** | [Action] Toggles the state of 'RoleLock'. |
| **`toggleStaffListLock()`** | [Action] Toggles the state of 'StaffListLock'. |
| **`toggleUnavDetails()`** | [Doc] Function to toggle the "Details" box in the unavailability modal |
| **`toggleWeekAdminLock(monthStr, weekNum, lockState)`** | [Action] Admin: Bulk locks all sessions in a specific week. |
| **`toggleWeekLock(monthStr, weekNum, lockState)`** | [Action] Toggles the state of 'WeekLock'. |
| **`toggleWholeDay(dateStr, email)`** | [Action] Toggles the state of 'WholeDay'. |
| **`triggerBulkDeptEmail(monthStr, weekNum)`** | Utility / Helper function. |
| **`triggerBulkStaffEmail(monthStr, weekNum)`** | Utility / Helper function. |
| **`unselectAllManualStaff()`** | Utility / Helper function. |
| **`updateAdminUI()`** | [UI] Refreshes header stats (Total Duties, Pending Requests) without re-rendering the whole grid. |
| **`updateAssignmentMeta(slot, email, source)`** | Utility / Helper function. |
| **`updateAttCount()`** | Utility / Helper function. |
| **`updateHeaderButtons(currentView)`** | Utility / Helper function. |
| **`updateLiveStaffWidget(count)`** | [Doc] 3. UI: Floating Widget |
| **`updateLockIcon(btnId, isLocked)`** | Utility / Helper function. |
| **`updateManualCounts()`** | Utility / Helper function. |
| **`updateSyncStatus(msg, type)`** | [Sync] Synchronizes 'updateSyncStatus' data with the cloud. |
| **`verifyAndLaunch(collegeId, user)`** | [Auth] Routing logic. Checks if user is in `allowedUsers` or `staffAccessList` and redirect to dashboard. |
| **`viewActivityLogs()`** | Utility / Helper function. |
| **`viewAutoAssignLogs()`** | Utility / Helper function. |
| **`viewSlotHistory(key)`** | Utility / Helper function. |
| **`volunteer(key, email)`** | [Doc] 3. Updated Volunteer (Handles Picking Up Exchange) |
| **`waNotify(key)`** | Utility / Helper function. |
| **`withdrawExchange(key, email)`** | Utility / Helper function. |


### B. app.js

| Function Name | Role / Description (Context) |
| :--- | :--- |
| **`autoAssignInvigilators()`** | [Doc] 6. Auto-Assign |
| **`autoCleanPastGhostData()`** | [Maintenance] Auto-deletes exam data older than 30 days to keep the system fast. |
| **`buildColumnTable(studentChunk)`** | [Doc] Helper to build a small table for one column (Fixed Widths for PDF) |
| **`bulkDateToInput(dateStr)`** | Utility / Helper function. |
| **`bulkTimeToInput(timeStr)`** | Utility / Helper function. |
| **`cancelExamEdit()`** | Utility / Helper function. |
| **`checkManualAllotment(sessionKey)`** | Utility / Helper function. |
| **`checkSuperAdminAccess(user)`** | [Doc] 1. CHECK IF USER IS SUPER ADMIN |
| **`chunkString(str, size)`** | Utility / Helper function. |
| **`clean(text)`** | Utility / Helper function. |
| **`clearReport()`** | Utility / Helper function. |
| **`clearScribeSearch()`** | Utility / Helper function. |
| **`clearSearch()`** | Utility / Helper function. |
| **`clear_csv_upload_status()`** | [Doc] to be available when Python loads. |
| **`closeDialModal()`** | [UI] Closes the modal/dialog. |
| **`closeModal(modalId)`** | [UI] Standard utility to hide a modal. |
| **`closeRoomSettingsModal()`** | [UI] Closes the modal/dialog. |
| **`closeStudentEditModal()`** | [Doc] 8. NEW Function: Close the modal |
| **`commitGroup()`** | Utility / Helper function. |
| **`compareSessionStrings(a, b)`** | Utility / Helper function. |
| **`confirmDialSelection()`** | Utility / Helper function. |
| **`convertToCSV(objArray)`** | Utility / Helper function. |
| **`createNewCollege(user)`** | Utility / Helper function. |
| **`createRoomRowHtml(roomName, capacity, location, isLast = false, isLocked = true)`** | Utility / Helper function. |
| **`debounce(func, delay)`** | [Doc] ********************************** |
| **`deleteExamRule(id)`** | Utility / Helper function. |
| **`deleteKeyInStorage(storageKey)`** | [Doc] 2. Helper to Delete Key |
| **`deleteRoom(index)`** | [Doc] Delete a room from allotment (Fixed: Actually removes the room now) |
| **`deleteStream(name)`** | [Doc] Delete Stream (Safe Version) |
| **`disable_absentee_tab(disabled)`** | Utility / Helper function. |
| **`disable_all_report_buttons(disabled)`** | Utility / Helper function. |
| **`disable_edit_data_tab(disabled)`** | Utility / Helper function. |
| **`disable_qpcode_tab(disabled)`** | Utility / Helper function. |
| **`disable_room_allotment_tab(disabled)`** | Utility / Helper function. |
| **`disable_scribe_settings_tab(disabled)`** | Utility / Helper function. |
| **`dismissLoader()`** | [Data] Loads 'dismissLoader' from storage/cloud. |
| **`displayCourseCell(qp, fullCourse, isDitto)`** | Utility / Helper function. |
| **`downloadInvigilationListPDF()`** | [Data] Loads 'downInvigilationListPDF' from storage/cloud. |
| **`downloadReportPDF()`** | [Data] Loads 'downReportPDF' from storage/cloud. |
| **`downloadRoomCsv()`** | [Data] Loads 'downRoomCsv' from storage/cloud. |
| **`drawColumnHeader(x, y)`** | Utility / Helper function. |
| **`drawDataColumn(pdf, rows, xBase, yStart, colW, rowH, headerH)`** | Utility / Helper function. |
| **`drawHeader()`** | Utility / Helper function. |
| **`drawMainHeader(pageEl)`** | Utility / Helper function. |
| **`drawReportHeader(stream, date, time, title, collegeName)`** | Utility / Helper function. |
| **`drawSmartText(text, x, centerY, w, h, align = "left", isBold = false, maxFontSize = 8)`** | Utility / Helper function. |
| **`editExamRule(id)`** | Utility / Helper function. |
| **`executeBulkDelete()`** | [Doc] 2. Execute Delete Function (Preserves Invigilation Data) |
| **`fetchHeavyData()`** | [Doc] 7. FETCH HEAVY DATA (HYBRID V2/V1 STRATEGY) |
| **`finalizeAppLoad()`** | [Init] The final handshake. Clears loaders and renders the initial view once data is ready. |
| **`findAvailableRooms(sessionKey)`** | [Doc] Find available rooms for scribes |
| **`findMyCollege(user)`** | Utility / Helper function. |
| **`fixStorageKeys(keyName, type)`** | [Doc] type: 'array' (Allotment), 'object' (Scribe/Mapping), 'slot' (Invig Slots) |
| **`formatDateToCSV(dateObj)`** | [Helper] Formats 'DateToCSV' strings/dates. |
| **`formatMetric3(rem, past, total, label)`** | [Doc] Helper: "455 / 100 / 555" |
| **`formatRegNoList(regNos)`** | [Doc] *** NEW: Helper for Absentee Report (Text-Based / No Gaps) *** |
| **`generateDayWisePDF()`** | Utility / Helper function. |
| **`generateInvigilatorSummaryPDF()`** | Utility / Helper function. |
| **`generateQPDistributionPDF()`** | Utility / Helper function. |
| **`generateQuestionPaperReportPDF()`** | Utility / Helper function. |
| **`generateQuestionPaperSummaryPDF()`** | Utility / Helper function. |
| **`generateRemunerationBillPDF()`** | [Report] Complex PDF generation for staff payment bills. |
| **`generateRoomStickersPDF()`** | [Report] Generates "Door Stickers" for exam rooms. |
| **`generateRoomWisePDF()`** | Utility / Helper function. |
| **`generateScribeProformaPDF()`** | Utility / Helper function. |
| **`generateSessionCardsHtml(dateStr)`** | Utility / Helper function. |
| **`generateSessionId(sessionKey)`** | Utility / Helper function. |
| **`generateTableRows(studentList)`** | Utility / Helper function. |
| **`get(k)`** | [Logic] Retrieves or calculates ''. |
| **`getBase64CourseKey(courseName)`** | [Doc] *** NEW: Universal Base64 key generator *** |
| **`getDefaultButtonContent()`** | [Logic] Retrieves or calculates 'DefaultButtonContent'. |
| **`getExamName(date, time, stream)`** | [Doc] This is kept for backward compatibility to prevent crashes. |
| **`getFilteredReportData(reportType)`** | [Doc] Helper function to filter data based on selected report filter |
| **`getHeader(pageNum)`** | [Logic] Retrieves or calculates 'Header'. |
| **`getJsSortKey(row)`** | [Doc] *** NEW: Helper function to sort CSV data just like Python sort *** |
| **`getNameHtml(name)`** | [Logic] Retrieves or calculates 'NameHtml'. |
| **`getNumericSortKey(key)`** | [Logic] Retrieves or calculates 'NumericSortKey'. |
| **`getOfficial(role)`** | [Doc] Helper to get official (ensure this helper exists or use internal logic) |
| **`getOfficialForDate(roleName, dateObj)`** | [Logic] Retrieves or calculates 'OfficialForDate'. |
| **`getOfficialName(role)`** | [Doc] 1. Fetch Names Logic |
| **`getPeriod(timeStr)`** | [Doc] Helper to check Period (FN < 1 PM <= AN) |
| **`getQpKey(courseName, streamName)`** | [Logic] Retrieves or calculates 'QpKey'. |
| **`getRecordKey(row)`** | [Doc] We compare only Date, Time, and Register Number (User Requirement) |
| **`getRoomCapacitiesFromStorage()`** | [Logic] Retrieves or calculates 'RoomCapacitiesFromStorage'. |
| **`getRoomSerialMap(sessionKey)`** | [Logic] Retrieves or calculates 'RoomSerialMap'. |
| **`getSessionType(timeStr)`** | [Doc] Helper to determine if a time string is FN or AN |
| **`getSessionValue(dateStr, sessionType)`** | [Doc] Helper to convert Date+Session to a strictly comparable number (YYYYMMDDS) |
| **`getSmartCourseName(fullName)`** | [Logic] Retrieves or calculates 'SmartCourseName'. |
| **`getTruncatedName(name, maxLen = 18)`** | [Doc] Helper: Truncate Name |
| **`getX(i)`** | [Logic] Retrieves or calculates 'X'. |
| **`handlePythonExtraction(jsonString)`** | [Doc] 🐍 PYTHON INTEGRATION (With Stream-Aware Merge) |
| **`handleSwapClick(roomName)`** | [Doc] 2. Handle Swap Interaction |
| **`initCalendar()`** | Utility / Helper function. |
| **`initSessionStyles()`** | [Doc] 🎡 MODAL-BASED SESSION SELECTOR UI |
| **`injectDialModal()`** | Utility / Helper function. |
| **`injectSelfCheckButton()`** | Utility / Helper function. |
| **`loadAbsenteeList(sessionKey)`** | [Data] Loads 'AbsenteeList' from storage/cloud. |
| **`loadAllCollegesForAdmin()`** | [Data] Loads 'AllCollegesForAdmin' from storage/cloud. |
| **`loadGlobalScribeList()`** | [Data] Loads 'GlobalScribeList' from storage/cloud. |
| **`loadInitialData()`** | [Data] Loads 'InitialData' from storage/cloud. |
| **`loadQPCodes()`** | [Doc] V89: Loads the *entire* QP code map from localStorage into the global var |
| **`loadRoomAllotment(sessionKey)`** | [Doc] Load Room Allotment for a session |
| **`loadRoomConfig()`** | [Data] Loads 'RoomConfig' from storage/cloud. |
| **`loadScribeAllotment(sessionKey)`** | [Doc] NEW FUNCTION: This loads the scribe allotment data for the session |
| **`loadStorageStats()`** | [Doc] Fetch & Calculate Stats |
| **`loadStreamConfig()`** | [Doc] Load Streams |
| **`loadStudentData(dataArray, sessionsToSync = null)`** | [Doc] 🚀 SMART LOADER (Targeted Cloud Sync) |
| **`loadWhitelist()`** | [Doc] 3. LOAD WHITELIST |
| **`loadRoomConfig()`** | [Data] Loads 'RoomConfig' from storage/cloud. |
| **`log(status, title, message)`** | Utility / Helper function. |
| **`moveKeyInStorage(storageKey, type)`** | Utility / Helper function. |
| **`normTime(tStr)`** | [Doc] 1. Helper: Ensure 2-digit Hour (Reuse global if avail, else local) |
| **`normalizeTime(timeStr)`** | Utility / Helper function. |
| **`numToWords(n)`** | Utility / Helper function. |
| **`onload()`** | [Data] Loads 'on' from storage/cloud. |
| **`openDashboardInvigModal(sessionKey)`** | [UI] Opens the 'DashboardInvig' modal dialog. |
| **`openDialModal(selectId)`** | [UI] Opens the 'Dial' modal dialog. |
| **`openExamRulesModal()`** | [Doc] 2. MODAL CONTROLS |
| **`openInvigModal(roomName)`** | [Doc] 4. Open Modal (Populates List) |
| **`openManualNewTab()`** | [Doc] USER MANUAL FUNCTION (New Tab) |
| **`openModal(modalId)`** | [UI] Standard utility to show a modal with animation. |
| **`openPdfPreview(contentHtml, filenamePrefix)`** | [Doc] 📄 GLOBAL PDF PREVIEW (FIXED COLUMNS & PRINTING) |
| **`openReplaceInvigModal(roomName)`** | [UI] Opens the 'ReplaceInvig' modal dialog. |
| **`openRoomSettingsModal()`** | [UI] Opens the 'RoomSettings' modal dialog. |
| **`openScribeRoomModal(regNo, studentName)`** | [Doc] Open the Scribe Room Modal |
| **`openStudentEditModal(rowIndex)`** | [Doc] 7. NEW Function: Open the Edit/Add Modal |
| **`pad(n)`** | Utility / Helper function. |
| **`parseCsvAndLoadData(csvText)`** | [Doc] V34: INTERACTIVE DIFF MERGE (With Add/Delete Permissions) |
| **`parseCsvRaw(csvText, streamName = "Regular")`** | Utility / Helper function. |
| **`parseDate(dStr)`** | Utility / Helper function. |
| **`parseTime(t)`** | Utility / Helper function. |
| **`performOriginalAllocation(data)`** | Utility / Helper function. |
| **`performSmartBackup(folderHandle)`** | Utility / Helper function. |
| **`performSmartRestore(fileHandle)`** | Utility / Helper function. |
| **`performSwap(roomA, roomB)`** | [Doc] 3. Execute Swap Logic |
| **`performSyncCheck(rootHandle, isInteractive)`** | [Sync] Synchronizes 'performSyncCheck' data with the cloud. |
| **`populateAbsenteeQpFilter(sessionKey)`** | Utility / Helper function. |
| **`populateAllExamDropdowns()`** | Utility / Helper function. |
| **`populateBillExamDropdown()`** | [Doc] Helper: Populate Exam Name Dropdown |
| **`populateStreamDropdowns()`** | [Doc] Populate Dropdowns (Fixed: Variable Name Typo) |
| **`populateUploadExamDropdown()`** | [Data] Loads 'populateUpExamDropdown' from storage/cloud. |
| **`populate_qp_code_session_dropdown()`** | Utility / Helper function. |
| **`populate_room_allotment_session_dropdown()`** | Utility / Helper function. |
| **`populate_session_dropdown()`** | [UI] Fills the main session selector after student data is loaded. |
| **`prepareScribeSummaryRows(scribes, session, allotments)`** | Utility / Helper function. |
| **`printDashboardSession(key, slot)`** | [Print] Generates a printer-friendly "New Tab" view of the current session. |
| **`printInvigilatorList()`** | [Print] Generates the "Staff Duty List" PDF/Print view. |
| **`processDate(dStr)`** | [Doc] 2. Helper: Date/Time Converters |
| **`processTime(tStr)`** | Utility / Helper function. |
| **`real_disable_all_report_buttons(disabled)`** | [Doc] ********************************** |
| **`real_loadGlobalScribeList()`** | [Doc] *** FIX: This is the REAL implementation of the function Python calls *** |
| **`real_populate_qp_code_session_dropdown()`** | Utility / Helper function. |
| **`real_populate_room_allotment_session_dropdown()`** | [Doc] *** FIX: This is the REAL implementation of the function Python calls *** |
| **`real_populate_session_dropdown()`** | Utility / Helper function. |
| **`removeAbsentee(regNo, name)`** | Utility / Helper function. |
| **`removeFromWhitelist(email)`** | [Doc] 5. REMOVE FROM WHITELIST |
| **`removeScribeRoom(regNo)`** | Utility / Helper function. |
| **`removeScribeStudent(regNo, name)`** | [Doc] 3. Remove a student (Updated with Confirmation) |
| **`removeUser(email)`** | [Doc] Remove User |
| **`render2ColPage(col1, col2, streamName, session, numCols)`** | [UI] Renders the '2ColPage' component/view. |
| **`renderAbsenteeList()`** | [Doc] Render Absentee List (Responsive: Card on Mobile, Row on PC) |
| **`renderAllottedRooms()`** | [Doc] Render the list of allotted rooms (WITH CAPACITY TAGS & LOCK) |
| **`renderBillHTML(bill, container)`** | [Doc] 5. Render Function (Strictly Black & White - No Date) |
| **`renderCalendar()`** | [UI] Renders the 'Calendar' component/view. |
| **`renderColumn(rows)`** | [Doc] Sub-helper to render a single column table |
| **`renderDashboardInvigilation()`** | [Doc] Updated: Dashboard Invigilation Widget (Opens Modal instead of Print) |
| **`renderDensePage(rows, streamName, session, numCols)`** | [UI] Renders the 'DensePage' component/view. |
| **`renderEditPagination(totalStudents)`** | [Doc] 4. Render Pagination (Same as before) |
| **`renderExamNameSettings()`** | [Doc] 1. DASHBOARD WIDGET (Settings Tab) |
| **`renderExamRulesInModal()`** | [Doc] 3. RENDER MODAL CONTENT (Simplified: Name Only) |
| **`renderGlobalScribeList()`** | [Doc] 2. Render the global list (Paginated) |
| **`renderInvigilationPanel()`** | [Doc] 1. Render the Main Assignment Panel (Vertical Buttons on PC) |
| **`renderList(filter = "")`** | [Doc] Render Function |
| **`renderNoticePage(col1, col2, streamName, session, numCols)`** | [UI] Renders the 'NoticePage' component/view. |
| **`renderPage(rows, streamName, session, rowCount)`** | [UI] Renders the 'Page' component/view. |
| **`renderScribeAllotmentList(sessionKey)`** | [Doc] Render the list of scribe students for the selected session (Lock-Aware + Auto-Save) |
| **`renderScribeSummaryBlock(scribes, session, allotments)`** | [Doc] Helper for Scribe Block at bottom of report |
| **`renderScribeSummaryPage(scribes, streamName, session, allotments)`** | [Doc] Helper: Generate a dedicated Scribe Page with Dynamic Sizing |
| **`renderSection(papers, title, bgClass, borderClass)`** | [UI] Renders the 'Section' component/view. |
| **`renderSmartPage(rows, streamName, session, unitsUsed, maxUnits)`** | [UI] Renders the 'SmartPage' component/view. |
| **`renderStreamSettings()`** | [Doc] Render Settings List (Lock-Aware) |
| **`renderStudentEditTable()`** | [Doc] 3. Render Table (Responsive: Cute Card on Mobile, Table on PC) |
| **`renderTable(items)`** | [UI] Renders the 'Table' component/view. |
| **`renderUserList()`** | [UI] Renders the 'UserList' component/view. |
| **`render_qp_code_list(sessionKey)`** | [Doc] V93: Renders the QP Code list (Regular First, then Alphabetical) |
| **`replaceInvigilator(room, name)`** | Utility / Helper function. |
| **`restoreActiveTab()`** | Utility / Helper function. |
| **`runSystemHealthCheck()`** | [Doc] 🩺 EXAMFLOW PRE-FLIGHT CHECK (FINAL FIX) |
| **`saveAbsenteeList(sessionKey)`** | [Action] Persists 'AbsenteeList' data to storage. |
| **`saveInvigAssignment(room, name)`** | [Doc] 5. Save Assignment (And Close Modal) |
| **`saveRoomAllotment()`** | [Doc] Save Room Allotment for a session |
| **`selectRoomForAllotment(roomName, capacity, targetStream)`** | [Doc] Select a room and allot students (Auto-Save & Sync enabled) |
| **`selectScribeRoom(roomName)`** | [Doc] Select a room from the modal |
| **`selectScribeStudent(student)`** | Utility / Helper function. |
| **`selectStudent(student)`** | Utility / Helper function. |
| **`setExamScheduleMode(isAdding)`** | [Doc] 4. HELPER FUNCTIONS |
| **`setUnsavedChanges(status)`** | [Doc] 11. Helper function to manage "unsaved" status (Auto-Disable Button) |
| **`setupSessionSelector(selectId)`** | Utility / Helper function. |
| **`showGlobalStudentDetails(regNo)`** | [Doc] 3B. Show Global Details (Updated with Location) |
| **`showRoomSelectionModal()`** | [Doc] Show room selection modal (Updated: Excludes Scribe Rooms) |
| **`showStudentDetailsModal(regNo, sessionKey)`** | [Doc] 3A. Show Single Session Details (Stream-Aware + Invigilator Info) |
| **`showView(viewToShow, buttonToActivate)`** | Utility / Helper function. |
| **`startCloudPolling(handle)`** | [Sync] Polling fallback for QP Code updates if listeners fail. |
| **`subscribeToQPSession(sessionKey)`** | [Sync] **Real-Time**. Listens for changes to QP Codes in the current session (Collaboration). |
| **`syncDataFromCloud(collegeId)`** | [Doc] 5. CLOUD DOWNLOAD FUNCTION (Hybrid V2/V1 Support) |
| **`syncDataToCloud(targetSection)`** | [Doc] Removed 'heavy' default. Now requires explicit target. |
| **`syncLocal(dataObj)`** | [Sync] Synchronizes 'Local' data with the cloud. |
| **`syncSessionToCloud(sessionKey)`** | [Sync] Synchronizes 'SessionToCloud' data with the cloud. |
| **`toInputDate(dateStr)`** | [Doc] Helper to convert DD.MM.YYYY -> YYYY-MM-DD |
| **`toInputTime(timeStr)`** | [Doc] Helper to convert HH:MM AM/PM -> HH:MM (24h) |
| **`toggleBulkLock()`** | [Doc] 1. Toggle Lock Function |
| **`toggleFutureFilterVisibility()`** | [Action] Toggles the state of 'FutureFilterVisibility'. |
| **`toggleSearchMode()`** | [Doc] 0. Toggle Search Modes |
| **`triggerSafetyBackup()`** | Utility / Helper function. |
| **`truncate(str, n)`** | Utility / Helper function. |
| **`unassignAllInvigilators()`** | [Doc] 7. Unassign All Invigilators |
| **`updateActiveItem(list)`** | Utility / Helper function. |
| **`updateAllotmentDisplay()`** | [Doc] Update display (Auto-Save Version + Button Disable Logic) |
| **`updateButtonState(state, extraInfo)`** | Utility / Helper function. |
| **`updateDashboard()`** | Utility / Helper function. |
| **`updateEditLockUI()`** | Utility / Helper function. |
| **`updateHeaderCollegeName()`** | Utility / Helper function. |
| **`updateLocalSlotsFromStudents()`** | Utility / Helper function. |
| **`updateSessionOpsLockUI()`** | Utility / Helper function. |
| **`updateSpecificDateGrid(dateStr, gridElement)`** | Utility / Helper function. |
| **`updateStudentPortalLink()`** | [Doc] 🔗 STUDENT PORTAL LINK GENERATOR |
| **`updateSyncStatus(status, type)`** | [Doc] Helper for status UI (Updates Desktop & Mobile) |
| **`updateTriggerText(select, trigger)`** | Utility / Helper function. |
| **`updateUniqueStudentList()`** | Utility / Helper function. |
| **`verifyPermission(fileHandle, withWrite)`** | Utility / Helper function. |
