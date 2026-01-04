import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, deleteField, collection, query, where, getDocs, orderBy, onSnapshot, serverTimestamp, limit }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// --- NEW IMPORTS FOR RECAPTCHA (Add this) ---
import { initializeAppCheck, ReCaptchaV3Provider } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";
import { getApp } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

// --- INITIALIZE APP CHECK ---
const app = getApp(); 

// 1. DYNAMIC DEBUG MODE
// This automatically detects if you are running locally or on the live web.
const hostname = window.location.hostname;

if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes("192.168.")) {
    // DEVELOPMENT MODE: Use Debug Token
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    console.log(`🛡️ App Check: Debug Mode Enabled for ${hostname}`);
} else {
    // PRODUCTION MODE: Use Real reCAPTCHA
    console.log("🛡️ App Check: Production Mode (Live Site)");
}

// 2. START APP CHECK
const appCheck = initializeAppCheck(app, {
    // Your public Site Key
    provider: new ReCaptchaV3Provider('6LcMiSQsAAAAABfK5nXqVJ_vo6GwU4DFfBN7-u5K'),

    // Automatically refresh the token in the background
    isTokenAutoRefreshEnabled: true 
});
const auth = window.firebase.auth;
const db = window.firebase.db;
const provider = window.firebase.provider;

// --- CONFIG ---
const DEFAULT_DESIGNATIONS = { "Assistant Professor": 2, "Associate Professor": 1, "Guest Lecturer": 4, "Professor": 0 };

// CANONICAL ROLE NAMES (The "Official" System Names)
const ROLE_CS = "Chief Superintendent";
const ROLE_SAS = "Senior Asst. Superintendent";
const ROLE_PRINCIPAL = "Principal";

// Protected Roles (Cannot be deleted)
const SYSTEM_ROLES = [ROLE_CS, ROLE_SAS, ROLE_PRINCIPAL];

// Default Config (Uses the constants)
const DEFAULT_ROLES = {
    "Vice Principal": 0,
    "HOD": 1,
    "Warden": 0,
    "Exam Chief": 0,
    [ROLE_CS]: 0,
    [ROLE_SAS]: 0,
    [ROLE_PRINCIPAL]: 0
};

// Add with other defaults
const DEFAULT_DEPARTMENTS = [
    { name: "English", email: "" },
    { name: "Malayalam", email: "" },
    { name: "Commerce", email: "" },
    { name: "Mathematics", email: "" },
    { name: "Physics", email: "" },
    { name: "Computer Science", email: "" },
    { name: "Botany", email: "" },
    { name: "Zoology", email: "" },
    { name: "History", email: "" },
    { name: "Economics", email: "" }
];

// Add with other state variables
let departmentsConfig = [];

// --- STATE ---
let currentUser = null;
let currentCollegeId = null;
let collegeData = null;
let staffData = [];
let invigilationSlots = {};
let collegeName = 'Loading College...';
let collegeSettings = {};
let designationsConfig = {};
let rolesConfig = {};
let currentCalDate = new Date();
let isAdmin = false;
let cloudUnsubscribe = null;
let slotsUnsubscribe = null;
let staffUnsubscribe = null;
let allocUnsubscribe = null; // For invigilation mapping
let advanceUnavailability = {}; // Stores { "DD.MM.YYYY": { FN: [], AN: [] } }
let globalDutyTarget = 2; // Default
let guestGlobalTarget = 2; // Default (Guest Lecturer Base)
let googleScriptUrl = "";
let isEmailConfigLocked = true; // <--- NEW
let isRoleLocked = true;
let isDeptLocked = true;
let isStaffListLocked = true; // Default to Locked
let currentSubstituteCandidate = null; // Stores selected staff for substitution
let isGlobalTargetLocked = true; // <--- NEW
let currentAdminDate = new Date(); // Tracks the currently viewed month in Admin
let tempAttendanceBatch = {}; // Stores parsed CSV data grouped by session key
let isBulkSendingCancelled = false; // <--- NEW FLAG
let lastManualRanking = []; // Stores the scoring snapshot for the open modal
let currentEmailQueue = []; // Stores the list for bulk sending
let vacationStart = "";
let vacationEnd = "";
let vacationExtraHolidays = new Set();
let currentStaffPage = 1;
const STAFF_PER_PAGE = 20;
let currentRankPage = 1;
const RANK_PER_PAGE = 20;
// --- DOM ELEMENTS ---
const views = { login: document.getElementById('view-login'), admin: document.getElementById('view-admin'), staff: document.getElementById('view-staff') };
const ui = {
    headerName: document.getElementById('header-college-name'), authSection: document.getElementById('auth-section'),
    userName: document.getElementById('user-name'), userRole: document.getElementById('user-role'),
    staffTableBody: document.getElementById('staff-table-body'),
    adminSlotsGrid: document.getElementById('admin-slots-grid'),
    staffSlotsGrid: document.getElementById('staff-slots-grid'),
    calGrid: document.getElementById('calendar-grid'),
    calTitle: document.getElementById('cal-month-title'),
    staffRankList: document.getElementById('staff-rank-list'),
    attSessionSelect: document.getElementById('attendance-session-select'),
    attArea: document.getElementById('attendance-area'),
    attList: document.getElementById('attendance-list'),
    attPlaceholder: document.getElementById('attendance-placeholder'),
    attSubSelect: document.getElementById('att-substitute-select')
};

// --- AUTHENTICATION ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        // Fix: Verify function exists before calling
        if (typeof handleLogin === 'function') {
            await handleLogin(user);
        } else {
            console.error("Critical Error: handleLogin function is missing!");
            alert("System Error: Login function not found. Please refresh.");
        }
    } else {
        // Logout Cleanup
        currentUser = null;
        isAdmin = false;
        if (cloudUnsubscribe) cloudUnsubscribe();
        if (slotsUnsubscribe) slotsUnsubscribe();
        if (staffUnsubscribe) staffUnsubscribe();
        
        showView('login');
        document.getElementById('auth-section').classList.add('hidden');
    }
});

document.getElementById('login-btn').addEventListener('click', () => signInWithPopup(auth, provider));
document.getElementById('logout-btn').addEventListener('click', () => signOut(auth).then(() => window.location.reload()));

// --- CORE FUNCTIONS ---

async function handleLogin(user) {
    document.getElementById('login-btn').innerText = "Verifying...";
    console.log("👤 Handling login for:", user.email);

    // 1. URL ID Check (Highest Priority)
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('id');
    if (urlId) {
        await verifyAndLaunch(urlId, user);
        return;
    }

    // 2. Cache Check (Optimization - Zero Reads)
    const cachedId = localStorage.getItem('my_college_id');
    if (cachedId) {
        console.log("⚡ Fast Login via Cache:", cachedId);
        await verifyAndLaunch(cachedId, user);
        return;
    }

    // 3. Database Search (Fallback - Costs Reads)
    try {
        const collegesRef = collection(db, "colleges");
        const [adminSnap, staffSnap] = await Promise.all([
            getDocs(query(collegesRef, where("allowedUsers", "array-contains", user.email))),
            getDocs(query(collegesRef, where("staffAccessList", "array-contains", user.email)))
        ]);

        if (!adminSnap.empty) {
            await verifyAndLaunch(adminSnap.docs[0].id, user);
            return;
        }
        if (!staffSnap.empty) {
            await verifyAndLaunch(staffSnap.docs[0].id, user);
            return;
        }

        alert("⛔ Access Denied. Your email is not found in any college.");
        signOut(auth);
        document.getElementById('login-btn').innerText = "Login with Google";

    } catch (e) {
        console.error("Login Error:", e);
        alert("Login Error: " + e.message);
    }
}

// Helper: Verify permission and launch dashboard
async function verifyAndLaunch(collegeId, user) {
    try {
        const docRef = doc(db, "colleges", collegeId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            const data = snap.data();
            
            // Check Role
            const isAdmin = data.allowedUsers?.includes(user.email);
            const isStaff = data.staffAccessList?.includes(user.email);
            const sList = JSON.parse(data.examStaffData || '[]');
            const isStaffData = sList.some(s => s.email.toLowerCase() === user.email.toLowerCase());

            if (isAdmin || isStaff || isStaffData) {
                // Success: Cache ID and Start
                localStorage.setItem('my_college_id', collegeId);
                const role = isAdmin ? "Admin" : "Staff";
                initializeSession(collegeId, isAdmin, role);
            } else {
                throw new Error("Permission Denied.");
            }
        } else {
            throw new Error("College not found.");
        }
    } catch (e) {
        console.error("Launch Error:", e);
        localStorage.removeItem('my_college_id'); // Clear invalid cache
        alert("⛔ Login Failed: " + e.message);
        signOut(auth);
        document.getElementById('login-btn').innerText = "Login with Google";
    }
}

function initializeSession(id, adminStatus, roleName) {
    console.log(`✅ Initializing Session: ${id} as ${roleName}`);
    currentCollegeId = id;
    isAdmin = adminStatus;

    if (typeof window.initLivePresence === 'function') {
        window.initLivePresence(currentUser.email, currentUser.displayName || roleName, isAdmin);
    }

    // Start Data Sync (This loads the dashboard)
    setupLiveSync(currentCollegeId, isAdmin ? 'admin' : 'staff');
}

function setupLiveSync(collegeId, mode) {
    console.log(`📡 Setting up Live Sync in ${mode} mode for ${collegeId}`);
    
    // Clear any existing listeners to prevent leaks
    if (cloudUnsubscribe) cloudUnsubscribe();
    if (slotsUnsubscribe) slotsUnsubscribe();
    if (staffUnsubscribe) staffUnsubscribe(); 

    // --- 1. LISTEN TO COLLEGE CONFIG (Always Live) ---
    const docRef = doc(db, "colleges", collegeId);
    
    cloudUnsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            updateSyncStatus("Synced", "success");
            const data = docSnap.data();
            
            // 1. Update Global Variables
            collegeName = data.examCollegeName || "College";
            // Store settings safely
            if (data.invigSettings) collegeSettings = JSON.parse(data.invigSettings || '{}');

            // 2. TRIGGER DASHBOARD (This was missing!)
            // We call applyCollegeConfig which handles opening the correct view (Admin vs Staff)
            applyCollegeConfig(data, mode, true);
        }
    });

    // --- 2. LISTEN TO SLOTS (Always Live, High Priority) ---
    const slotsRef = doc(db, "colleges", collegeId, "system_data", "slots");
    slotsUnsubscribe = onSnapshot(slotsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            invigilationSlots = JSON.parse(data.examInvigilationSlots || '{}');
            advanceUnavailability = JSON.parse(data.invigAdvanceUnavailability || '{}');
            localStorage.setItem('examInvigilationSlots', JSON.stringify(invigilationSlots));

            // Dynamic UI Refresh based on what is visible
            const adminView = document.getElementById('view-admin');
            const staffView = document.getElementById('view-staff');

            if (adminView && !adminView.classList.contains('hidden')) {
                renderSlotsGridAdmin();
                renderAdminTodayStats();
                populateAttendanceSessions(); // 🟢 ADD THIS LINE HERE
            } else if (staffView && !staffView.classList.contains('hidden')) {
                // If staff view is open, refresh calendar
                let emailToRender = currentUser ? currentUser.email : null;
                if (staffData.length > 0 && currentUser) {
                     const me = staffData.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase());
                     if (me) emailToRender = me.email;
                }
                if (emailToRender) {
                    renderStaffCalendar(emailToRender);
                    if (typeof renderExchangeMarket === "function") renderExchangeMarket(emailToRender);
                }
            }
        }
    });

    // --- 3. STAFF DATA (Optimized: Live for Admin, Once for Staff) ---
    const staffRef = doc(db, "colleges", collegeId, "system_data", "staff");

    if (mode === 'admin') {
        // ADMIN: Needs live updates for adding/removing staff
        console.log("👥 Staff List: Using Live Listener (Admin Mode)");
        staffUnsubscribe = onSnapshot(staffRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                staffData = JSON.parse(data.examStaffData || '[]');
                localStorage.setItem('examStaffData', data.examStaffData || '[]');
                
                // Update Admin UI immediately
                renderStaffTable();
                updateAdminUI();
            }
        });
    } else {
        // STAFF: Fetch ONCE to save reads
        console.log("👥 Staff List: Using Fetch Once (Staff Mode)");
        getDoc(staffRef).then((docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                staffData = JSON.parse(data.examStaffData || '[]');
                localStorage.setItem('examStaffData', data.examStaffData || '[]');

                // If user is just logging in, initialize their dashboard now
                if (currentUser) {
                    const me = staffData.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase());
                    if (me && document.getElementById('view-staff').classList.contains('hidden')) {
                         initStaffDashboard(me);
                    }
                }
            }
        });
    }
}

// Helper to apply config (Shared by Cache & Live)
function applyCollegeConfig(data, mode, triggerRender) {
    collegeData = data;
    designationsConfig = JSON.parse(collegeData.invigDesignations || JSON.stringify(DEFAULT_DESIGNATIONS));
    const savedRoles = JSON.parse(collegeData.invigRoles || '{}');
    rolesConfig = { ...DEFAULT_ROLES, ...savedRoles };
    googleScriptUrl = collegeData.invigGoogleScriptUrl || "";
    departmentsConfig = JSON.parse(collegeData.invigDepartments || JSON.stringify(DEFAULT_DEPARTMENTS));
    
    const vacConfig = JSON.parse(collegeData.invigVacationConfig || '{}');
    vacationStart = vacConfig.start || "";
    vacationEnd = vacConfig.end || "";
    vacationExtraHolidays = new Set(vacConfig.holidays || []);
    
    if (collegeData.invigGlobalTarget !== undefined) globalDutyTarget = parseInt(collegeData.invigGlobalTarget);
    if (collegeData.invigGuestTarget !== undefined) guestGlobalTarget = parseInt(collegeData.invigGuestTarget);

    if (triggerRender && mode === 'admin') {
        if (document.getElementById('view-admin').classList.contains('hidden') &&
            document.getElementById('view-staff').classList.contains('hidden')) {
            initAdminDashboard();
        }
        updateAdminUI();
    }
}

function initAdminDashboard() {
    ui.headerName.textContent = collegeData.examCollegeName;
    ui.userName.textContent = currentUser.displayName;
    ui.userRole.textContent = "ADMIN";
    document.getElementById('auth-section').classList.remove('hidden');
    updateHeaderButtons('admin');
    updateAdminUI();
    renderSlotsGridAdmin();
    populateAttendanceSessions();

    // NEW CALL
    renderAdminTodayStats();

    showView('admin');
}
// Updated: Calculate Duties Done based on actual attendance (Filtered by Current AY)
function getDutiesDoneCount(email) {
    let count = 0;
    const acYear = getCurrentAcademicYear();

    // Iterate through all slots to find confirmed attendance
    Object.keys(invigilationSlots).forEach(key => {
        const slot = invigilationSlots[key];
        const dateObj = parseDate(key);

        // Filter by Academic Year (Ignore old duties)
        if (dateObj < acYear.start || dateObj > acYear.end) return;

        if (slot.attendance && slot.attendance.includes(email)) {
            count++;
        }
    });
    return count;
}


function calculateStaffTarget(staff) {
    // 1. Get Academic Year Boundaries (June 1st to May 31st)
    const acYear = getCurrentAcademicYear();
    const today = new Date();

    // 2. Determine Calculation Period
    let calcEnd = (today < acYear.end) ? today : acYear.end;
    const joinDate = new Date(staff.joiningDate);
    let calcStart = (joinDate > acYear.start) ? joinDate : acYear.start;

    if (calcStart > calcEnd) return 0;

    let totalTarget = 0;
    let cursor = new Date(calcStart);

    // 3. Iterate Month by Month
    while (cursor <= calcEnd) {
        const currentMonthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const currentMonthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

        // --- STEP A: SET BASELINE ---
        let monthlyRate = globalDutyTarget;

        // *** NEW: Guest Lecturer Proportional Logic ***
        if (staff.designation === "Guest Lecturer") {
            // Default to 6 days if data missing, otherwise count checked days
            let availableDays = staff.preferredDays || [];
            if (availableDays.length === 0) availableDays = [1, 2, 3, 4, 5, 6]; // Fallback to FULL availability

            const dayCount = availableDays.length;

            // Formula: (Available Days / 5 Standard Days) * Guest Global Target
            monthlyRate = (dayCount / 5) * guestGlobalTarget;
        }
        // ***********************************************

        // --- STEP B: CHECK FOR ROLE OVERRIDE ---
        if (staff.roleHistory && staff.roleHistory.length > 0) {
            const activeRoles = staff.roleHistory.filter(r => {
                const rStart = new Date(r.start);
                const rEnd = new Date(r.end);
                return rStart <= currentMonthEnd && rEnd >= currentMonthStart;
            });

            if (activeRoles.length > 0) {
                let bestRoleTarget = monthlyRate;
                let hasApplicableRole = false;

                activeRoles.forEach(r => {
                    if (rolesConfig[r.role] !== undefined) {
                        const t = rolesConfig[r.role];
                        if (t < bestRoleTarget) {
                            bestRoleTarget = t;
                        }
                        hasApplicableRole = true;
                    }
                });

                if (hasApplicableRole) {
                    monthlyRate = bestRoleTarget;
                }
            }
        }

        // Add to total
        totalTarget += monthlyRate;

        // Move to next month
        cursor.setDate(1);
        cursor.setMonth(cursor.getMonth() + 1);

        if (cursor.getFullYear() > calcEnd.getFullYear() + 1) break;
    }

    // *** UPDATED: Round UP to nearest whole number ***
    return Math.ceil(totalTarget);
}


function initStaffDashboard(me) {
    ui.headerName.textContent = collegeData.examCollegeName;
    ui.userName.textContent = me.name;
    ui.userRole.textContent = isAdmin ? "ADMIN (View as Staff)" : "INVIGILATOR";
    document.getElementById('auth-section').classList.remove('hidden');

    document.getElementById('staff-view-name').textContent = me.name;

    // --- CALCULATE STATS ---
    const target = calculateStaffTarget(me);
    const done = getDutiesDoneCount(me.email);
    const pending = Math.max(0, target - done); // FIX: No negative values

    // Update UI
    document.getElementById('staff-view-pending').textContent = pending;
    const completedEl = document.getElementById('staff-view-completed');
    if (completedEl) completedEl.textContent = done;

    const completedCard = document.getElementById('staff-completed-card');
    if (completedCard) {
        completedCard.onclick = () => window.openCompletedDutiesModal(me.email);
    }

    updateHeaderButtons('staff');
    renderStaffCalendar(me.email);
    renderStaffRankList(me.email);

    if (typeof renderExchangeMarket === "function") {
        renderExchangeMarket(me.email);
    }

    // --- CHECK FOR HoD ROLE & SHOW MONITOR BUTTON ---
    const btnMonitor = document.getElementById('btn-hod-monitor');
    if (btnMonitor) {
        // 1. Get "Today" at 00:00:00 to match the Role Start Date format
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isHoD = me.roleHistory && me.roleHistory.some(r => {
            // 2. Parse Role Dates
            const start = new Date(r.start);
            start.setHours(0, 0, 0, 0); // Normalize Start to Midnight

            const end = new Date(r.end);
            end.setHours(23, 59, 59, 999); // Fix: Set End Date to the VERY END of the day

            // 3. Check Role Name (Case Insensitive)
            const roleName = r.role.toUpperCase().trim();
            const isHeadRole = roleName === 'HOD' || roleName.includes('HEAD');

            // 4. Validate Date Range
            return isHeadRole && (today >= start && today <= end);
        });

        if (isHoD) {
            btnMonitor.classList.remove('hidden');
        } else {
            btnMonitor.classList.add('hidden');
        }
    }


    renderStaffUpcomingSummary(me.email);
    showView('staff');

    document.getElementById('cal-prev').onclick = () => {
        currentCalDate.setMonth(currentCalDate.getMonth() - 1);
        renderStaffCalendar(me.email);
        if (typeof renderExchangeMarket === "function") renderExchangeMarket(me.email);
    };
    document.getElementById('cal-next').onclick = () => {
        currentCalDate.setMonth(currentCalDate.getMonth() + 1);
        renderStaffCalendar(me.email);
        if (typeof renderExchangeMarket === "function") renderExchangeMarket(me.email);
    };
}


// --- HELPERS ---
function isUserUnavailable(slot, email, key) {
    // 1. Check Global Weekly Preference (Applies to Guest Lecturers ONLY)
    if (key) {
        const date = parseDate(key);
        const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon ... 6=Sat
        const staff = staffData.find(s => s.email === email);

        if (staff) {
            // *** LOGIC FIX: Only check days if Guest Lecturer ***
            // Regular staff are assumed available Mon-Sat (1-6) regardless of saved preference
            if (staff.designation === "Guest Lecturer") {
                const allowedDays = staff.preferredDays || [1, 2, 3, 4, 5, 6];
                if (!allowedDays.includes(dayOfWeek)) {
                    return true; // Unavailable on this day
                }
            }
        }
    }

    // 2. Check Slot Specific Unavailability (Manual Calendar Blocks)
    // Handles mixed data types (string vs object)
    if (slot && slot.unavailable && slot.unavailable.some(u => (typeof u === 'string' ? u === email : u.email === email))) return true;

    // 3. Check Advance Unavailability (OD/DL/Leave)
    if (key) {
        const [dateStr, timeStr] = key.split(' | ');
        if (advanceUnavailability[dateStr]) {
            let session = "FN";
            const t = timeStr ? timeStr.toUpperCase() : "";
            if (t.includes("PM") || t.startsWith("12:") || t.startsWith("12.")) session = "AN";

            const list = advanceUnavailability[dateStr][session];
            if (list) {
                return list.some(u => (typeof u === 'string' ? u === email : u.email === email));
            }
        }
    }
    return false;
}



// --- DATE HELPERS ---
function parseDate(key) {
    try {
        const [dStr, tStr] = key.split(' | ');
        const [d, m, y] = dStr.split('.');
        let [time, mod] = tStr.split(' ');
        let [h, min] = time.split(':');
        h = parseInt(h);
        if (mod === 'PM' && h !== 12) h += 12;
        if (mod === 'AM' && h === 12) h = 0;
        return new Date(y, m - 1, d, h, parseInt(min));
    } catch (e) { return new Date(0); }
}

function getWeekOfMonth(date) {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    const startOffset = dayOfWeek;
    const dayOfMonth = date.getDate();
    return Math.ceil((dayOfMonth + startOffset) / 7);
}
function updateAdminUI() {
    document.getElementById('stat-total-staff').textContent = staffData.length;
    const acYear = getCurrentAcademicYear();
    document.getElementById('lbl-academic-year').textContent = `AY: ${acYear.label}`;

    // Populate Designation Dropdown (Existing)
    const desigSelect = document.getElementById('stf-designation');
    if (desigSelect) desigSelect.innerHTML = Object.keys(designationsConfig).map(r => `<option value="${r}">${r}</option>`).join('');

    // NEW: Populate Department Dropdown
    populateDepartmentSelect();

    renderStaffTable();
}
// --- HELPER: Get First Name ---
function getFirstName(fullName) {
    if (!fullName) return "";
    return fullName.split(' ')[0]; // "Abdul Raheem" -> "Abdul"
}

// --- AUTOMATIC EMAIL SYSTEM (Google Apps Script) ---
window.sendSingleEmail = function (btn, email, name, subject, message) {
    if (!email) return alert("No email address for this faculty.");
    // Use the global variable from your settings
    if (!googleScriptUrl) return alert("⚠️ Email Service Not Configured.\n\nPlease go to 'Settings & Roles' and paste your Google Apps Script Web App URL.");

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Sending`;
    btn.classList.remove('bg-gray-700', 'hover:bg-gray-800');
    btn.classList.add('bg-gray-400', 'cursor-wait');

    // Convert newlines to <br> for HTML email if the script expects HTML
    // Or send as is if it handles text. Based on your "beautiful" request, HTML is better.
    const htmlBody = message.replace(/\n/g, '<br>');

    // Send via Proxy (Google Script)
    fetch(googleScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" }, // Changed to json for body
        body: JSON.stringify({
            to: email,
            subject: subject,
            body: htmlBody 
        })
    })
    .then(() => {
        console.log('Request sent to Google Script');
        btn.innerHTML = `
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Sent
        `;
        btn.classList.remove('bg-gray-400', 'cursor-wait');
        btn.classList.add('bg-green-600', 'hover:bg-green-700', 'cursor-default');

        // Log Activity
        if (typeof logActivity === 'function') logActivity("Email Sent", `Auto-email sent to ${name} (${email}).`);
    })
    .catch(error => {
        console.error('FAILED...', error);
        alert("Network Error: Could not reach Google Script.\nCheck your internet or the Script URL.");
        btn.disabled = false;
        btn.innerHTML = originalText;
        btn.classList.add('bg-red-600');
    });
}

// --- NEW: ADMIN POSTING LOCK FUNCTIONS ---

window.toggleAdminLock = async function (key) {
    if (!invigilationSlots[key]) return;
    
    // Toggle state
    invigilationSlots[key].isAdminLocked = !invigilationSlots[key].isAdminLocked;
    
    // Force Standard Lock on if Admin Locked
    if (invigilationSlots[key].isAdminLocked) {
        invigilationSlots[key].isLocked = true;
    }
    
    // 1. Render immediately (Optimistic UI update)
    renderSlotsGridAdmin();
    
    const status = invigilationSlots[key].isAdminLocked ? "LOCKED" : "UNLOCKED";
    logActivity("Admin Posting Lock", `Admin ${status} slot ${key} for posting.`);
    
    // 2. Sync to Cloud
    await syncSlotsToCloud();
}

window.toggleWeekAdminLock = async function (monthStr, weekNum, lockState) {
    if (!confirm(`${lockState ? '🔒 LOCK' : '🔓 UNLOCK'} Admin Posting for ${monthStr} Week ${weekNum}?\n\nThis will prevent staff from adding unavailability.`)) return;

    let changed = false;
    Object.keys(invigilationSlots).forEach(key => {
        const date = parseDate(key);
        const mStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const wNum = getWeekOfMonth(date);

        if (mStr === monthStr && wNum === weekNum) {
            // Apply Admin Lock State
            if (!!invigilationSlots[key].isAdminLocked !== lockState) {
                invigilationSlots[key].isAdminLocked = lockState;
                
                // LOGIC CHANGE: If Locking Admin, also enforce Standard Lock
                if (lockState === true) {
                    invigilationSlots[key].isLocked = true;
                }
                
                changed = true;
            }
        }
    });

    if (changed) {
        logActivity("Weekly Admin Lock", `Admin ${lockState ? 'LOCKED' : 'UNLOCKED'} posting for ${monthStr} Week ${weekNum}.`);
        await syncSlotsToCloud();
        renderSlotsGridAdmin();
    } else {
        alert("No changes needed.");
    }
}





function renderSlotsGridAdmin() {
    if (!ui.adminSlotsGrid) return;
    ui.adminSlotsGrid.innerHTML = '';

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthStr = monthNames[currentAdminDate.getMonth()];
    const currentYear = currentAdminDate.getFullYear();

    // 1. Navigation Bar
    const navHtml = `
        <div class="col-span-full flex justify-between items-center glass-panel p-2 md:p-3 rounded-lg border-0 shadow-sm mb-2 sticky top-0 z-30 mx-1 mt-1">
            <button onclick="changeAdminMonth(-1)" class="px-2 py-1.5 md:px-3 text-xs font-bold text-gray-700 hover:bg-white/50 rounded border border-gray-200/50 flex items-center gap-1 transition">
                <span class="hidden md:inline">Prev</span> ⬅️
            </button>
            <h3 class="text-sm md:text-lg font-black text-indigo-800 uppercase tracking-wide flex items-center gap-1 md:gap-2 whitespace-nowrap">
                <span>📅</span> ${currentMonthStr} <span class="text-gray-500 text-xs md:text-lg">'${String(currentYear).slice(-2)}</span>
            </h3>
            <button onclick="changeAdminMonth(1)" class="px-2 py-1.5 md:px-3 text-xs font-bold text-gray-700 hover:bg-white/50 rounded border border-gray-200/50 flex items-center gap-1 transition">
                ➡️ <span class="hidden md:inline">Next</span>
            </button>
        </div>`;
    ui.adminSlotsGrid.innerHTML = navHtml;

    const slotItems = [];

    // 2A. COLLECT REAL SLOTS
    Object.keys(invigilationSlots).forEach(key => {
        if (invigilationSlots[key].isHidden) return; // Skip deleted

        const date = parseDate(key);
        if (date.getMonth() === currentAdminDate.getMonth() && date.getFullYear() === currentAdminDate.getFullYear()) {
            slotItems.push({ key, date: date, slot: invigilationSlots[key], type: 'REAL' });
        }
    });

    // 2B. COLLECT GHOST SLOTS (Unavailability without Exam)
    if (typeof advanceUnavailability !== 'undefined') {
        Object.keys(advanceUnavailability).forEach(dateStr => {
            const [d, m, y] = dateStr.split('.').map(Number);
            if (m - 1 !== currentAdminDate.getMonth() || y !== currentAdminDate.getFullYear()) return;

            const dateObj = new Date(y, m - 1, d);
            const leaves = advanceUnavailability[dateStr];

            const hasRealSlot = (sessionType) => {
                return slotItems.some(item => {
                    if (item.type !== 'REAL') return false;
                    const [kDate, kTime] = item.key.split(' | ');
                    if (kDate !== dateStr) return false;
                    
                    let [h] = kTime.trim().split(':')[0].split(' '); 
                    let t = kTime.trim().toUpperCase();
                    if (t.includes('PM') && !t.startsWith('12')) h = parseInt(h) + 12;
                    if (t.includes('AM') && parseInt(h) === 12) h = 0;
                    
                    const slotPeriod = h < 13 ? 'FN' : 'AN';
                    return slotPeriod === sessionType;
                });
            };

            if (leaves.FN && leaves.FN.length > 0 && !hasRealSlot('FN')) {
                slotItems.push({ key: `${dateStr} | FN`, date: dateObj, type: 'GHOST', session: 'FN', count: leaves.FN.length, list: leaves.FN });
            }
            if (leaves.AN && leaves.AN.length > 0 && !hasRealSlot('AN')) {
                slotItems.push({ key: `${dateStr} | AN`, date: dateObj, type: 'GHOST', session: 'AN', count: leaves.AN.length, list: leaves.AN });
            }
        });
    }

    if (slotItems.length === 0) {
        ui.adminSlotsGrid.innerHTML += `<div class="col-span-full text-center py-16 text-gray-400">No sessions this month. <button onclick="openAddSlotModal()" class="text-indigo-600 font-bold hover:underline">Add Slot</button></div>`;
        return;
    }

    // 3. Group by Week
    const groupedSlots = {};
    slotItems.forEach(item => {
        const mStr = item.date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const weekNum = getWeekOfMonth(item.date);
        const groupKey = `${mStr}-W${weekNum}`;
        if (!groupedSlots[groupKey]) groupedSlots[groupKey] = { month: mStr, week: weekNum, items: [] };
        groupedSlots[groupKey].items.push(item);
    });

    const sortedGroupKeys = Object.keys(groupedSlots).sort((a, b) => groupedSlots[a].items[0].date - groupedSlots[b].items[0].date);

    // 4. Render Groups
    sortedGroupKeys.forEach(gKey => {
        const group = groupedSlots[gKey];

        ui.adminSlotsGrid.innerHTML += `
            <div class="glass-card col-span-full mt-3 mb-1 flex flex-wrap justify-between items-center bg-indigo-50/50 px-3 py-2 rounded border border-indigo-100/50 shadow-sm mx-1">
                <span class="text-indigo-900 text-[10px] font-bold uppercase tracking-wider bg-white/60 px-2 py-0.5 rounded border border-indigo-100/30">
                    Week ${group.week}
                </span>
                <div class="flex gap-2">
                    <div class="flex rounded shadow-sm">
                        <button onclick="toggleWeekLock('${group.month}', ${group.week}, true)" class="text-[10px] bg-white border border-gray-300 text-gray-500 px-2 py-1 rounded-l hover:bg-gray-50 font-bold border-r-0" title="Lock Standard Booking">🔒 Std</button>
                        <button onclick="toggleWeekLock('${group.month}', ${group.week}, false)" class="text-[10px] bg-white border border-gray-300 text-gray-500 px-2 py-1 rounded-r hover:bg-gray-50 font-bold" title="Unlock Standard Booking">🔓</button>
                    </div>
                    <div class="flex rounded shadow-sm">
                        <button onclick="toggleWeekAdminLock('${group.month}', ${group.week}, true)" class="text-[10px] bg-amber-100 border border-amber-300 text-amber-700 px-2 py-1 rounded-l hover:bg-amber-200 font-bold border-r-0" title="Lock Admin Posting">🛡️ Admin</button>
                        <button onclick="toggleWeekAdminLock('${group.month}', ${group.week}, false)" class="text-[10px] bg-amber-100 border border-amber-300 text-amber-700 px-2 py-1 rounded-r hover:bg-amber-200 font-bold" title="Unlock Admin Posting">🔓</button>
                    </div>
                    <button onclick="runWeeklyAutoAssign('${group.month}', ${group.week})" class="text-[10px] bg-indigo-600 text-white border border-indigo-700 px-2 py-1 rounded hover:bg-indigo-700 font-bold shadow-sm">⚡ Auto</button>
                    
                    <button onclick="openWeeklyNotificationModal('${group.month}', ${group.week})" class="text-[10px] bg-green-600 text-white border border-green-700 px-2 py-1 rounded hover:bg-green-700 font-bold shadow-sm flex items-center gap-1">📢 Notify</button>
                </div>
            </div>`;

        group.items.sort((a, b) => {
            if (a.date - b.date !== 0) return a.date - b.date;
            const aS = a.key.includes('FN') || (a.key.includes('AM') && !a.key.includes('12:')) ? 0 : 1;
            const bS = b.key.includes('FN') || (b.key.includes('AM') && !b.key.includes('12:')) ? 0 : 1;
            return aS - bS;
        });

        group.items.forEach((item) => {
            if (item.type === 'GHOST') {
                const encodedList = encodeURIComponent(JSON.stringify(item.list));
                ui.adminSlotsGrid.innerHTML += `
                    <div class="relative border-l-[6px] border-gray-300 bg-gray-50 p-3 rounded-xl shadow-sm hover:shadow-md transition w-full mb-3 opacity-90 border border-gray-200 border-l-gray-400">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-bold text-gray-500 text-xs flex items-center gap-1">
                                <span class="text-sm">🗓️</span> 
                                <span>${item.key}</span>
                            </h4>
                            <span class="text-[9px] uppercase font-bold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">No Exam</span>
                        </div>
                        <div class="text-[10px] text-gray-500 mb-3 italic">No exam scheduled, but staff have reported unavailability.</div>
                        <button onclick="openGhostUnavailabilityModal('${item.key}', '${encodedList}')" class="w-full bg-white text-red-600 border border-red-200 px-2 py-1.5 rounded-lg text-[10px] font-bold hover:bg-red-50 flex items-center justify-center gap-1 shadow-sm">⛔ View ${item.count} Unavailability</button>
                    </div>`;
                return;
            }

            const { key, slot } = item;
            const filled = slot.assigned.length;
            const isAdminLocked = slot.isAdminLocked || false;

            // --- 🟢 NEW: Calculate TOTAL Issues (Session + Advance) ---
            const [dateStr, timeStr] = key.split(' | ');
            let session = "FN";
            const t = timeStr ? timeStr.toUpperCase() : "";
            if (t.includes("PM") || t.startsWith("12:") || t.startsWith("12.")) session = "AN";

            const uniqueIssues = new Set();
            
            // 1. Add Session Specific
            if (slot.unavailable) {
                slot.unavailable.forEach(u => uniqueIssues.add(typeof u === 'string' ? u : u.email));
            }
            
            // 2. Add Advance Leave
            if (typeof advanceUnavailability !== 'undefined' && advanceUnavailability[dateStr] && advanceUnavailability[dateStr][session]) {
                advanceUnavailability[dateStr][session].forEach(u => uniqueIssues.add(typeof u === 'string' ? u : u.email));
            }
            
            const totalIssues = uniqueIssues.size;
            // -----------------------------------------------------------

            let themeClasses = "border-orange-400 bg-gradient-to-br from-white via-orange-50 to-orange-100";
            let statusIcon = "🔓";
            
            if (isAdminLocked) {
                themeClasses = "border-amber-500 bg-gradient-to-br from-white via-amber-50 to-amber-100 shadow-amber-100";
                statusIcon = "🛡️";
            } else if (slot.isLocked) {
                themeClasses = "border-red-500 bg-gradient-to-br from-white via-red-50 to-red-100 shadow-red-100";
                statusIcon = "🔒";
            } else if (filled >= slot.required) {
                themeClasses = "border-green-500 bg-gradient-to-br from-white via-green-50 to-green-100 shadow-green-100";
                statusIcon = "✅";
            }

            const adminBtnStyle = isAdminLocked 
                ? "bg-amber-600 text-white border-amber-700 hover:bg-amber-700" 
                : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50";

            ui.adminSlotsGrid.innerHTML += `
                <div class="relative border-l-[6px] ${themeClasses} p-3 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full mb-3 group">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-black text-gray-800 text-xs w-2/3 flex items-center gap-1">
                            <span class="text-sm shadow-sm bg-white/50 rounded-full w-6 h-6 flex items-center justify-center border border-white/50">${statusIcon}</span> 
                            <span>${key}</span>
                        </h4>
                        <div class="flex items-center bg-white/90 border border-gray-200 rounded-lg text-[10px] overflow-hidden">
                            <button onclick="changeSlotReq('${key}', -1)" class="px-2 py-1 hover:bg-gray-100 border-r border-gray-200 font-bold">-</button>
                            <span class="px-2 font-bold text-gray-800">${filled}/${slot.required}</span>
                            <button onclick="changeSlotReq('${key}', 1)" class="px-2 py-1 hover:bg-gray-100 border-l border-gray-200 font-bold">+</button>
                        </div>
                    </div>
                    
                    <div class="text-[10px] text-gray-600 mb-2 bg-white/40 p-1.5 rounded-lg border border-white/50 shadow-sm min-h-[1.5rem]">
                        <strong>Staff:</strong> ${slot.assigned.map(email => getNameFromEmail(email)).join(', ') || "None"}
                    </div>
                    
                    ${isAdminLocked ? '<div class="text-[9px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded border border-amber-200 mb-2 text-center">🛡️ Posting Restricted (Admin)</div>' : ''}
                    
                    ${totalIssues > 0 ? `<button onclick="openInconvenienceModal('${key}')" class="mt-2 w-full bg-white/80 text-red-700 border border-red-200 px-2 py-1.5 rounded-lg text-[10px] font-bold hover:bg-red-50 mb-2 shadow-sm transition">⛔ ${totalIssues} Issue(s) Reported</button>` : ''}
                    
                    <div class="flex gap-1.5 mt-2">
                        <button onclick="toggleLock('${key}')" class="flex-1 text-[10px] border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 text-gray-700 font-bold bg-white shadow-sm">
                            ${slot.isLocked ? '🔓 Open Std' : '🔒 Lock Std'}
                        </button>
                        <button onclick="toggleAdminLock('${key}')" class="flex-1 text-[10px] border rounded-lg py-1.5 font-bold shadow-sm ${adminBtnStyle}">
                            ${isAdminLocked ? '🔓 Open Admin' : '🛡️ Lock Admin'}
                        </button>
                    </div>

                    <div class="grid grid-cols-4 gap-1.5 mt-2">
                         <button onclick="openSlotReminderModal('${key}')" class="bg-white text-green-700 border border-green-200 rounded py-1 hover:bg-green-50 text-[10px]">🔔</button>
                         <button onclick="printSessionReport('${key}')" class="bg-white text-gray-700 border border-gray-300 rounded py-1 hover:bg-gray-50 text-[10px]">🖨️</button>
                         <button onclick="openManualAllocationModal('${key}')" class="bg-white text-indigo-700 border border-indigo-200 rounded py-1 hover:bg-indigo-50 text-[10px]">Edit</button>
                         <button onclick="deleteSlot('${key}')" class="bg-white text-red-600 border border-red-200 rounded py-1 hover:bg-red-50 text-[10px]">🗑️</button>
                    </div>
                </div>`;
        });
    });
    ui.adminSlotsGrid.innerHTML += `<div class="col-span-full h-32 w-full"></div>`;
}









// REPLACE your existing renderStaffTable function with this SAFE version
function renderStaffTable() {
    if (!ui.staffTableBody) return;
    ui.staffTableBody.innerHTML = '';

    const filterInput = document.getElementById('staff-search');
    const filter = filterInput ? filterInput.value.toLowerCase() : "";
    const today = new Date();

    // 1. Filter & Map Data (SAFE MODE)
    const filteredItems = staffData
        .map((staff, i) => ({ ...staff, originalIndex: i }))
        .filter(item => {
            if (item.status === 'archived') return false;

            // --- THE FIX: Handle missing data safely ---
            if (filter) {
                const name = (item.name || "").toLowerCase();
                const dept = (item.dept || "").toLowerCase();
                const desig = (item.designation || "").toLowerCase();
                const email = (item.email || "").toLowerCase(); // Also search email

                if (!name.includes(filter) && 
                    !dept.includes(filter) && 
                    !desig.includes(filter) && 
                    !email.includes(filter)) {
                    return false;
                }
            }
            return true;
        })
        .sort((a, b) => {
            // 1. Live Status Priority (Online > Idle > Offline)
            const getStatusRank = (email) => {
                // FIX: Access the local 'globalLiveUsers' variable directly (removed 'window.')
                // Also handle case-insensitivity to be safe
                if (!globalLiveUsers) return 0;
                
                const key = email; 
                // Try exact match, then lowercase match if needed
                const user = globalLiveUsers[key] || globalLiveUsers[key.toLowerCase()];
                
                if (!user) return 0; // Offline (Gray)

                const s = user.status;
                if (s === 'online') return 2; // Highest Priority (Green)
                if (s === 'idle') return 1;   // Medium Priority (Yellow)
                return 0;                     // Lowest Priority (Gray)
            };

            const rankA = getStatusRank(a.email);
            const rankB = getStatusRank(b.email);

            // If ranks are different, put higher rank first
            if (rankA !== rankB) return rankB - rankA;

            // 2. Secondary Sort: Department (A-Z)
            const deptA = (a.dept || "").toLowerCase();
            const deptB = (b.dept || "").toLowerCase();
            if (deptA < deptB) return -1;
            if (deptA > deptB) return 1;

            // 3. Tertiary Sort: Name (A-Z)
            return (a.name || "").localeCompare(b.name || "");
        });

    // 2. Pagination Logic
    const totalPages = Math.ceil(filteredItems.length / STAFF_PER_PAGE) || 1;
    if (currentStaffPage > totalPages) currentStaffPage = totalPages;
    if (currentStaffPage < 1) currentStaffPage = 1;

    const start = (currentStaffPage - 1) * STAFF_PER_PAGE;
    const end = start + STAFF_PER_PAGE;
    const pageItems = filteredItems.slice(start, end);

    // Update Controls
    const pageInfo = document.getElementById('staff-page-info');
    if (pageInfo) pageInfo.textContent = `Page ${currentStaffPage} of ${totalPages} (${filteredItems.length} Staff)`;
    
    // 3. Render Rows
    pageItems.forEach((staff) => {
        const index = staff.originalIndex;
        // Fallback for missing names
        const safeName = staff.name || staff.email.split('@')[0];
        const safeDept = staff.dept || "General";

        const target = calculateStaffTarget(staff);
        const done = getDutiesDoneCount(staff.email);
        const pending = Math.max(0, target - done);
        const liveIcon = window.getLiveStatusIcon ? window.getLiveStatusIcon(staff.email) : '';
        const statusColor = pending > 3 ? 'text-red-600 font-bold' : (pending > 0 ? 'text-orange-600' : 'text-green-600');

        let activeRoleLabel = "";
        if (staff.roleHistory && staff.roleHistory.length > 0) {
            const activeRole = staff.roleHistory.find(r => {
                const start = new Date(r.start);
                const end = new Date(r.end);
                return start <= today && end >= today;
            });
            if (activeRole) activeRoleLabel = `<span class="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded ml-1 border border-purple-200 font-bold">${activeRole.role}</span>`;
        }

        let actionButtons = "";
        if (isStaffListLocked) {
            actionButtons = `<div class="w-full text-center md:text-right pt-2 md:pt-0 border-t border-gray-100 md:border-0 mt-2 md:mt-0"><span class="text-gray-400 text-xs italic mr-2">Locked</span></div>`;
        } else {
            actionButtons = `
                <div class="flex gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t border-gray-100 md:border-0 mt-2 md:mt-0">
                    <button onclick="editStaff(${index})" class="flex-1 md:flex-none text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded border border-blue-100 transition text-xs font-bold text-center">Edit</button>
                    <button onclick="openRoleAssignmentModal(${index})" class="flex-1 md:flex-none text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded border border-indigo-100 transition text-xs font-bold text-center">Role</button>
                    <button onclick="deleteStaff(${index})" class="flex-1 md:flex-none text-red-500 hover:text-red-700 font-bold px-3 py-1.5 rounded hover:bg-red-50 transition bg-white border border-red-100 text-center">&times;</button>
                </div>`;
        }

        const row = document.createElement('tr');
        row.className = "block md:table-row bg-white/80 backdrop-blur md:hover:bg-gray-50 border border-white/40 md:border-0 md:border-b md:border-gray-100 rounded-xl md:rounded-none shadow-sm md:shadow-none mb-4 md:mb-0 p-4 md:p-0";

        row.innerHTML = `
            <td class="block md:table-cell px-0 md:px-6 py-0 md:py-3 border-b-0 md:border-b border-gray-100 w-full md:w-auto">
                <div class="hidden md:flex items-center">
                    <div class="mr-2">${liveIcon}</div> 
                    <div class="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs mr-3 shrink-0">${safeName.charAt(0)}</div>
                    <div>
                        <div class="text-sm font-bold text-gray-800">${safeName}</div>
                        <div class="text-xs text-gray-500 mt-0.5"><span class="font-semibold text-gray-600">${safeDept}</span> | ${staff.designation || ""} ${activeRoleLabel}</div>
                    </div>
                </div>

<div class="md:hidden">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-3">
                             <div class="mr-1">${liveIcon}</div> 
                             <div class="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm">${safeName.charAt(0)}</div>
                            <div>
                                <div class="text-sm font-bold text-gray-900">${safeName}</div>
                                <div class="text-xs text-gray-500 font-medium">${safeDept} ${activeRoleLabel}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs mb-3">
                        <div class="text-center w-1/3">
                            <div class="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Target</div>
                            <div class="font-mono text-gray-600 font-bold text-sm">${target}</div>
                        </div>
                        <div class="text-center w-1/3 border-l border-gray-200">
                            <div class="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Done</div>
                            <div>
                                <button onclick="openCompletedDutiesModal('${staff.email}')" 
                                        class="font-mono text-blue-600 font-bold text-sm hover:underline decoration-blue-300">
                                    ${done}
                                </button>
                            </div>
                        </div>
                        <div class="text-center w-1/3 border-l border-gray-200">
                            <div class="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Pending</div>
                            <div class="font-mono font-bold text-sm ${statusColor}">${pending}</div>
                        </div>
                    </div>
                </div>





                
            </td>


            <td class="hidden md:table-cell px-6 py-3 text-center font-mono text-sm text-gray-600" title="Target Duty Load">${target}</td>
            
            <td class="hidden md:table-cell px-6 py-3 text-center font-mono text-sm font-bold">
                <button onclick="openCompletedDutiesModal('${staff.email}')" 
                        class="text-blue-600 hover:text-blue-800 hover:underline decoration-blue-300 underline-offset-4 transition px-2 py-1 rounded hover:bg-blue-50" 
                        title="Click to view duty history">
                    ${done}
                </button>
            </td>
            
            <td class="hidden md:table-cell px-6 py-3 text-center font-mono text-sm ${statusColor}" title="Pending Duties">${pending}</td>






            <td class="block md:table-cell px-0 md:px-6 py-0 md:py-3 md:text-right md:whitespace-nowrap">${actionButtons}</td>
        `;
        ui.staffTableBody.appendChild(row);
    });
}

function renderStaffRankList(myEmail) {
    // 1. Calculate and Sort
    const rankedStaff = staffData
        .filter(s => s.status !== 'archived')
        .map(s => {
            const target = calculateStaffTarget(s);
            const done = getDutiesDoneCount(s.email);
            const pending = target - done;
            return { ...s, done, pending };
        })
        .sort((a, b) => {
            if (b.pending !== a.pending) return b.pending - a.pending;
            return a.name.localeCompare(b.name);
        });

    // 2. Pagination Logic
    const totalPages = Math.ceil(rankedStaff.length / RANK_PER_PAGE) || 1;
    if (currentRankPage > totalPages) currentRankPage = totalPages;
    if (currentRankPage < 1) currentRankPage = 1;

    const start = (currentRankPage - 1) * RANK_PER_PAGE;
    const end = start + RANK_PER_PAGE;
    const pageItems = rankedStaff.slice(start, end);

    // 3. Generate List HTML
    const listHtml = pageItems.map((s, i) => {
        const absoluteIndex = start + i;
        const isMe = s.email === myEmail;
        const bgClass = isMe ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-transparent hover:bg-gray-100";
        const textClass = isMe ? "text-indigo-700 font-bold" : "text-gray-700";
        const rankBadge = absoluteIndex < 3 ? `text-orange-500 font-black` : `text-gray-400 font-medium`;
        const displayPending = Math.max(0, s.pending);

        let roleBadge = "";
        if (s.roleHistory) {
            const today = new Date();
            const activeRole = s.roleHistory.find(r => new Date(r.start) <= today && new Date(r.end) >= today);
            if (activeRole) roleBadge = `<span class="ml-1 text-[8px] uppercase font-bold bg-purple-100 text-purple-700 px-1 py-0.5 rounded border border-purple-200">${activeRole.role}</span>`;
        }

        return `
            <div class="flex items-center justify-between p-2 rounded border ${bgClass} text-xs transition mb-1">
                <div class="flex items-center gap-2 overflow-hidden">
                    <span class="${rankBadge} w-6 text-center shrink-0 text-[10px]">${absoluteIndex + 1}</span>
                    <div class="flex flex-col min-w-0">
                        <div class="flex items-center gap-1">
                            <span class="truncate ${textClass}">${s.name}</span>
                            ${roleBadge}
                        </div>
                        <span class="text-[9px] text-gray-400 truncate">${s.dept}</span>
                    </div>
                </div>
                
                <div class="text-right flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-100 shadow-sm shrink-0">
                     <span class="font-mono font-bold text-green-600" title="Completed Duties">${s.done}</span>
                     <span class="text-gray-300 text-[10px]">/</span>
                     <span class="font-mono font-bold ${displayPending > 0 ? 'text-red-600' : 'text-gray-400'}" title="Pending Duties">${displayPending}</span>
                </div>
            </div>`;
    }).join('');

    // 4. Generate Pagination HTML (Updated with extra padding)
    const prevDisabled = (currentRankPage === 1) ? "disabled opacity-50 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer";
    const nextDisabled = (currentRankPage === totalPages) ? "disabled opacity-50 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer";

    const paginationHtml = `
        <div class="flex justify-between items-center w-full bg-white py-2">
            <button onclick="changeRankPage(-1)" ${prevDisabled} class="px-3 py-1.5 rounded border border-gray-200 text-gray-600 text-[10px] font-bold transition flex items-center gap-1 bg-white shadow-sm">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                Prev
            </button>
            
            <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded border border-gray-100">
                ${currentRankPage} <span class="text-gray-300">/</span> ${totalPages}
            </span>
            
            <button onclick="changeRankPage(1)" ${nextDisabled} class="px-3 py-1.5 rounded border border-gray-200 text-gray-600 text-[10px] font-bold transition flex items-center gap-1 bg-white shadow-sm">
                Next
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
    `;

    // 5. Inject Content into respective containers

    // Desktop
    const deskList = document.getElementById('staff-rank-list');
    const deskPag = document.getElementById('staff-rank-pagination');
    if (deskList) { deskList.innerHTML = listHtml; deskList.scrollTop = 0; }
    if (deskPag) deskPag.innerHTML = paginationHtml;

    // Mobile
    const mobList = document.getElementById('staff-rank-list-mobile');
    const mobPag = document.getElementById('staff-rank-mobile-pagination');
    if (mobList) { mobList.innerHTML = listHtml; mobList.scrollTop = 0; }
    if (mobPag) mobPag.innerHTML = paginationHtml;
}


// --- ADD THIS NEW FUNCTION AT THE END OR WITH OTHER EXPORTS ---

window.changeRankPage = function (delta) {
    currentRankPage += delta;
    // Refresh list using current user email for highlighting
    const myEmail = currentUser ? currentUser.email : "";
    renderStaffRankList(myEmail);
}

function renderStaffCalendar(myEmail) {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    if (ui.calTitle) ui.calTitle.innerHTML = `<span class="text-gray-400 font-light">Calendar</span> <span class="text-indigo-800 font-black tracking-tight">${monthNames[month]} ${year}</span>`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // --- 1. CURRENT TIME CHECK ---
    const now = new Date();

    // Group Slots
    const slotsByDate = {};
    Object.keys(invigilationSlots).forEach(key => {
        // 🟢 HIDE SOFT-DELETED SLOTS
        if (invigilationSlots[key].isHidden) return;

        const [dStr, tStr] = key.split(' | ');
        const [dd, mm, yyyy] = dStr.split('.');
        if (parseInt(mm) === month + 1 && parseInt(yyyy) === year) {
            const dayNum = parseInt(dd);
            if (!slotsByDate[dayNum]) slotsByDate[dayNum] = [];
            let sessionType = "FN";
            const t = tStr.toUpperCase();
            if (t.includes("PM") || t.startsWith("12:") || t.startsWith("12.")) sessionType = "AN";
            slotsByDate[dayNum].push({ key, sessionType, ...invigilationSlots[key] });
        }
    });

    let html = "";
    // Empty cells for previous month
    for (let i = 0; i < firstDayIndex; i++) {
        html += `<div class="bg-gray-50/30 border border-gray-100/50 min-h-[4.5rem] md:min-h-[8rem] rounded-md md:rounded-xl m-0.5 backdrop-blur-sm"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${String(day).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}.${year}`;
        const slots = slotsByDate[day] || [];
        const today = new Date();
        const isToday = (day === today.getDate() && month === today.getMonth() && year === today.getFullYear());

        let cellClass = "relative bg-white/80 hover:bg-white border border-white/60 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[4.5rem] md:min-h-[8rem] rounded-md md:rounded-xl m-px md:m-0.5 overflow-hidden group flex flex-col shadow-sm backdrop-blur-md";
        let dateClass = isToday
            ? "absolute top-1 md:top-2 left-1/2 -translate-x-1/2 w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full bg-red-700 text-[10px] md:text-xs font-bold text-white transition-colors duration-300 shadow-lg border border-red-800 z-20"
            : "absolute top-1 md:top-2 left-1/2 -translate-x-1/2 w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full bg-white/90 text-[10px] md:text-xs font-bold text-gray-800 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-md border border-gray-200 group-hover:border-indigo-400 z-20";

        let contentHtml = "";

        if (slots.length > 0) {
            contentHtml += `<div class="flex flex-col gap-0.5 md:gap-1.5 p-0.5 md:p-2 mt-7 md:mt-8 w-full">`;
            slots.sort((a, b) => a.sessionType === "FN" ? -1 : 1);

            slots.forEach(slot => {
                const filled = slot.assigned.length;
                const needed = slot.required;
                const available = Math.max(0, needed - filled);

                // --- 2. TIME & STATUS CALCULATIONS ---
                const slotDateObj = parseDate(slot.key);
                // Assume session ends 3 hours after start for visual purposes
                const sessionEndTime = new Date(slotDateObj);
                sessionEndTime.setHours(sessionEndTime.getHours() + 3);
                const isPast = sessionEndTime < now;

                const isUnavailable = isUserUnavailable(slot, myEmail, slot.key);
                const isAssigned = slot.assigned.includes(myEmail);
                const isPostedByMe = slot.exchangeRequests && slot.exchangeRequests.includes(myEmail);
                const isMarketAvailable = slot.exchangeRequests && slot.exchangeRequests.length > 0 && !isAssigned;
                const isAdminLocked = slot.isAdminLocked || false;
                
                // --- 3. SMART COMPLETION CHECK ---
                // It is "Done" if: 
                // A) Attendance explicitly marked OR 
                // B) I was assigned AND the time has passed
                const isCompleted = (slot.attendance && slot.attendance.includes(myEmail)) || (isAssigned && isPast);

                let badgeClass = "bg-gradient-to-br from-green-50 to-green-100 text-green-800 border-green-200";
                let icon = "🟢";
                let statusText = `<span class="md:hidden text-[8px] font-bold">${available}</span><span class="hidden md:inline">${available} Left</span>`;
                let glowClass = "";

                if (isCompleted) {
                    // COMPLETED / PAST DUTY -> DARK GREEN
                    badgeClass = "bg-green-800 text-white border-green-900 md:bg-gradient-to-br md:from-green-700 md:to-green-800 md:border-green-600";
                    icon = "✅"; 
                    statusText = ""; // Minimal text
                    glowClass = "md:shadow-lg md:shadow-green-900";
                }
                else if (isPostedByMe) {
                    if (isAdminLocked) {
                        badgeClass = "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 border-amber-300";
                        icon = "🛡️";
                        statusText = "Frozen";
                    } else {
                        badgeClass = "bg-gradient-to-br from-orange-400 to-orange-500 text-white border-orange-300";
                        icon = "⏳";
                        statusText = "Posted";
                    }
                }
                else if (isAssigned) {
                     if (isAdminLocked) {
                        badgeClass = "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800 border-blue-300 font-bold ring-1 ring-amber-300";
                        icon = "🛡️";
                        statusText = "Duty";
                    } else if (slot.isLocked) {
                        badgeClass = "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800 border-blue-300 font-bold";
                        icon = "🔒";
                        statusText = "Duty";
                        glowClass = "shadow-sm shadow-blue-100";
                    } else {
                        badgeClass = "bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-400 font-bold";
                        icon = "👮";
                        statusText = "Duty";
                        glowClass = "shadow-lg shadow-blue-200 ring-1 ring-blue-300";
                    }
                }
                else if (isMarketAvailable) {
                    badgeClass = "bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-400 animate-pulse";
                    icon = "♻️";
                    statusText = "Exchange";
                }
                else if (isUnavailable) {
                    badgeClass = "bg-gradient-to-br from-red-50 to-red-100 text-red-600 border-red-200 opacity-60 grayscale-[50%]";
                    icon = "⛔";
                    statusText = "Unavail";
                }
                else if (isAdminLocked) {
                    badgeClass = "bg-gradient-to-br from-amber-50 to-amber-100 text-amber-400 border-amber-200";
                    icon = "🛡️"; 
                    statusText = "Paused"; 
                }
                else if (slot.isLocked) {
                    badgeClass = "bg-gray-100 text-gray-400 border-gray-200";
                    icon = "🔒";
                    statusText = "Locked";
                }
                // --- 4. PAST UNASSIGNED SLOTS (Fixes "Light Green" Issue) ---
                else if (isPast) {
                    badgeClass = "bg-gray-50 text-gray-400 border-gray-100 opacity-75";
                    icon = "⏹️";
                    statusText = "Done";
                }
                else if (filled >= needed) {
                    badgeClass = "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400 border-gray-200";
                    icon = "🈵";
                    statusText = "Full";
                }

                const paddingClass = isCompleted ? "p-[2px] md:p-1.5" : "p-0.5 md:p-1.5";

                contentHtml += `
                    <div class="relative overflow-hidden rounded md:rounded-lg border ${badgeClass} ${paddingClass} shadow-sm transition-transform active:scale-95 md:hover:scale-105 ${glowClass} flex items-center justify-center md:justify-between gap-0.5 md:gap-1 group/badge cursor-pointer min-h-[18px] md:min-h-0" onclick="openDayDetail('${dateStr}', '${myEmail}')">
                        <div class="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none hidden md:block"></div>
                        <div class="flex items-center gap-0.5 z-10">
                            <span class="text-[8px] md:text-[10px] uppercase font-black tracking-wider opacity-90">${slot.sessionType}</span>
                        </div>
                        <div class="flex items-center gap-0.5 md:gap-1 z-10">
                            <span class="text-[9px] font-bold opacity-90 whitespace-nowrap leading-tight">${statusText}</span>
                            <span class="text-[8px] md:text-[10px] filter drop-shadow-sm flex-shrink-0">${icon}</span>
                        </div>
                    </div>`;
            });
            contentHtml += `</div>`;
        } else {
            // Check Advance Unavailability
            const adv = advanceUnavailability[dateStr];
            if (adv) {
                let hasUnavail = false;
                let unavailHtml = `<div class="flex flex-col gap-0.5 p-0.5 md:p-2 mt-7 md:mt-8 w-full">`;

                if (adv.FN && adv.FN.some(u => (typeof u === 'string' ? u === myEmail : u.email === myEmail))) {
                    hasUnavail = true;
                    unavailHtml += `<div onclick="openDayDetail('${dateStr}', '${myEmail}')" class="bg-red-50/80 border border-red-100 text-red-500 rounded md:rounded-lg p-0.5 md:p-1 text-[8px] md:text-[9px] font-bold text-center shadow-sm cursor-pointer hover:bg-red-100 transition truncate"><span class="md:hidden">FN ⛔</span><span class="hidden md:inline">FN ⛔ Unavail</span></div>`;
                }
                if (adv.AN && adv.AN.some(u => (typeof u === 'string' ? u === myEmail : u.email === myEmail))) {
                    hasUnavail = true;
                    unavailHtml += `<div onclick="openDayDetail('${dateStr}', '${myEmail}')" class="bg-red-50/80 border border-red-100 text-red-500 rounded md:rounded-lg p-0.5 md:p-1 text-[8px] md:text-[9px] font-bold text-center shadow-sm cursor-pointer hover:bg-red-100 transition truncate"><span class="md:hidden">AN ⛔</span><span class="hidden md:inline">AN ⛔ Unavail</span></div>`;
                }
                unavailHtml += `</div>`;

                if (hasUnavail) contentHtml += unavailHtml;
            }
        }

        let clickAttr = `onclick="openDayDetail('${dateStr}', '${myEmail}')"`;
        html += `
            <div class="${cellClass}" ${clickAttr}>
                <div class="${dateClass}">${day}</div>
                ${contentHtml}
            </div>
        `;
    }
    if (ui.calGrid) ui.calGrid.innerHTML = html;
}



function renderExchangeMarket(myEmail) {
    const list = document.getElementById('staff-market-list');
    const badge = document.getElementById('market-count-badge');
    if (!list) return;

    // Get Search Query
    const searchInput = document.getElementById('exchange-search-input');
    const filterText = searchInput ? searchInput.value.toLowerCase() : "";

    list.innerHTML = '';

    // 1. Find all slots with active exchange requests
    let marketSlots = [];
    Object.keys(invigilationSlots).forEach(key => {
        const slot = invigilationSlots[key];
        if (slot.isAdminLocked) return;
        if (slot.exchangeRequests && slot.exchangeRequests.length > 0) {
            // *** CHANGE: Show ALL requests, including my own ***
            slot.exchangeRequests.forEach(sellerEmail => {
                marketSlots.push({
                    key: key,
                    seller: sellerEmail,
                    slotData: slot
                });
            });
        }
    });

    // 2. Sort by Date
    marketSlots.sort((a, b) => {
        const dateA = a.key.split('|')[0].split('.').reverse().join('-');
        const dateB = b.key.split('|')[0].split('.').reverse().join('-');
        return dateA.localeCompare(dateB);
    });

    // Filter List based on Search
    if (filterText) {
        marketSlots = marketSlots.filter(item => {
            const sellerName = getNameFromEmail(item.seller).toLowerCase();
            return sellerName.includes(filterText);
        });
    }

    // 3. Update Badge
    if (badge) {
        badge.textContent = marketSlots.length;
    }

    // 4. Render
    if (marketSlots.length === 0) {
        list.innerHTML = `<p class="text-xs text-gray-400 italic text-center py-2">No duties available for exchange.</p>`;
        return;
    }

    marketSlots.forEach(item => {
        const isMe = (item.seller === myEmail);
        const sellerName = isMe ? "You (Your Post)" : getNameFromEmail(item.seller);
        const [date, time] = item.key.split(' | ');

        const sameDaySessions = Object.keys(invigilationSlots).filter(k => k.startsWith(date) && k !== item.key);
        const hasConflict = sameDaySessions.some(k => invigilationSlots[k].assigned.includes(myEmail));
        const amAlreadyAssigned = item.slotData.assigned.includes(myEmail);

        let actionBtn = "";
        let bgClass = "bg-white border-indigo-100"; // Default style
        let sellerColor = "bg-indigo-100 text-indigo-600";

        if (isMe) {
            // *** MY POST: Show Withdraw Button ***
            bgClass = "bg-orange-50 border-orange-200"; // Highlight my posts
            sellerColor = "bg-orange-100 text-orange-700";

            actionBtn = `
                <button onclick="withdrawExchange('${item.key}', '${myEmail}')" 
                    class="bg-white text-red-600 border border-red-200 text-[10px] px-3 py-1.5 rounded font-bold hover:bg-red-50 shadow-sm transition flex items-center gap-1" title="Take back this duty">
                    Withdraw
                </button>`;
        } else if (amAlreadyAssigned) {
            actionBtn = `<span class="text-[10px] text-gray-400 font-medium">You are on this duty</span>`;
        } else if (hasConflict) {
            actionBtn = `<span class="text-[10px] text-red-400 font-medium">Time Conflict</span>`;
        } else {
            // Others' Post: Show Accept
            actionBtn = `
                <button onclick="acceptExchange('${item.key}', '${myEmail}', '${item.seller}')" 
                    class="bg-indigo-600 text-white text-[10px] px-3 py-1.5 rounded font-bold hover:bg-indigo-700 shadow-sm transition flex items-center gap-1">
                    Accept
                </button>`;
        }

        list.innerHTML += `
            <div class="${bgClass} p-2.5 rounded border shadow-sm hover:shadow-md transition mb-2">
                <div class="flex justify-between items-start mb-1">
                    <div class="font-bold text-gray-800 text-xs">${date}</div>
                    <div class="text-[10px] text-gray-500 bg-gray-100 px-1.5 rounded">${time}</div>
                </div>
                <div class="flex justify-between items-center mt-2">
                    <div class="flex items-center gap-1.5">
                        <div class="w-5 h-5 rounded-full ${sellerColor} flex items-center justify-center text-[10px] font-bold">
                            ${sellerName.charAt(0)}
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] text-gray-500 leading-none">Request by</span>
                            <span class="text-xs font-bold text-gray-700 leading-none truncate max-w-[100px]">${sellerName}</span>
                        </div>
                    </div>
                    ${actionBtn}
                </div>
            </div>
        `;
    });
}

window.openDayDetail = function (dateStr, email) {
    document.getElementById('modal-day-title').textContent = dateStr;
    const container = document.getElementById('modal-sessions-container');
    container.innerHTML = '';

    // --- 1. DATE VALIDATION CHECK ---
    const [dd, mm, yyyy] = dateStr.split('.');
    const currentD = new Date(yyyy, mm - 1, dd);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const maxDate = new Date(today);
    maxDate.setMonth(today.getMonth() + 3); 

    const isPast = currentD < today;
    const isTooFar = currentD > maxDate;
    const isRestricted = isPast || isTooFar;
    
    let restrictLabel = "";
    if (isPast) restrictLabel = "(Past Date - Locked)";
    if (isTooFar) restrictLabel = "(>3 Months - Locked)";

    // TRACK ASSIGNMENTS & ADMIN LOCKS
    let isAssignedFN = false;
    let isAssignedAN = false;
    let adminLockFN = false;
    let adminLockAN = false;

    // 2. RENDER EXAM SESSIONS
    const sessions = Object.keys(invigilationSlots).filter(k => k.startsWith(dateStr));

    if (sessions.length > 0) {
        sessions.forEach(key => {
            const slot = invigilationSlots[key];
            const filled = slot.assigned.length;
            const needed = slot.required - filled;

            // Status Checks
            const isUnavailable = isUserUnavailable(slot, email, key);
            const isAssigned = slot.assigned.includes(email);
            const isLocked = slot.isLocked;
            const isAdminLocked = slot.isAdminLocked || false;
            const isPostedByMe = slot.exchangeRequests && slot.exchangeRequests.includes(email);
            const marketOffers = slot.exchangeRequests ? slot.exchangeRequests.filter(e => e !== email) : [];

            const t = key.split(' | ')[1].toUpperCase();
            const isAN = (t.includes("PM") || t.startsWith("12:") || t.startsWith("12."));
            const sessLabel = isAN ? "AFTERNOON (AN)" : "FORENOON (FN)";

            if (isAssigned) {
                if (isAN) isAssignedAN = true;
                else isAssignedFN = true;
            }
            
            // Track Admin Locks
            if (isAdminLocked) {
                if (isAN) adminLockAN = true;
                else adminLockFN = true;
            }

            // --- Action Buttons ---
            let actionHtml = "";
            
            if (isRestricted) {
                 if (isAssigned) {
                     actionHtml = `<div class="w-full bg-gray-100 text-gray-500 border border-gray-200 text-xs py-2 rounded font-bold text-center">✅ Duty Assigned ${restrictLabel}</div>`;
                 } else if (isUnavailable) {
                     actionHtml = `<div class="w-full bg-red-50 text-red-500 border border-red-100 text-xs py-2 rounded font-bold text-center">⛔ Marked Unavailable ${restrictLabel}</div>`;
                 } else {
                     actionHtml = `<div class="w-full bg-gray-50 text-gray-400 border border-gray-100 text-xs py-2 rounded text-center italic">Actions Disabled ${restrictLabel}</div>`;
                 }
            } 
            else if (isAdminLocked) {
                 if (isAssigned) {
                     if (isPostedByMe) {
                         actionHtml = `<div class="w-full bg-orange-50 p-2 rounded border border-orange-200"><div class="text-xs text-orange-700 font-bold mb-1 text-center">⏳ Posted for Exchange</div><button onclick="withdrawExchange('${key}', '${email}')" class="w-full bg-white text-orange-700 border border-orange-300 text-xs py-2 rounded font-bold hover:bg-orange-100 shadow-sm transition">↩️ Withdraw Request</button></div>`;
                     } else {
                         actionHtml = `<div class="w-full bg-green-50 text-green-700 border border-green-200 text-xs py-2 rounded font-bold text-center flex flex-col items-center gap-1"><span>✅ Assigned</span><span class="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded">🛡️ Admin Finalizing</span></div>`;
                     }
                 } else {
                     actionHtml = `<div class="w-full bg-amber-50 text-amber-600 border border-amber-200 text-xs py-3 rounded font-bold text-center flex items-center justify-center gap-2 shadow-sm"><span>🛡️</span> Posting Restricted by Admin</div>`;
                 }
            }
            else {
                if (isAssigned) {
                    if (isPostedByMe) {
                         actionHtml = `<div class="w-full bg-orange-50 p-2 rounded border border-orange-200"><div class="text-xs text-orange-700 font-bold mb-1 text-center">⏳ Posted for Exchange</div><p class="text-[10px] text-orange-600 text-center mb-2 leading-tight">You remain liable until accepted.</p><button onclick="withdrawExchange('${key}', '${email}')" class="w-full bg-white text-orange-700 border border-orange-300 text-xs py-2 rounded font-bold hover:bg-orange-100 shadow-sm transition">↩️ Withdraw Request</button></div>`;
                    } else if (isLocked) {
                        actionHtml = `<button onclick="postForExchange('${key}', '${email}')" class="w-full bg-purple-100 text-purple-700 border border-purple-300 text-xs py-2 rounded font-bold hover:bg-purple-200 transition shadow-sm">♻️ Post for Exchange</button>`;
                    } else {
                        actionHtml = `<button onclick="cancelDuty('${key}', '${email}', false)" class="w-full bg-green-100 text-green-700 border border-green-300 text-xs py-2 rounded font-bold">✅ Assigned (Click to Cancel)</button>`;
                    }
                } else if (marketOffers.length > 0) {
                     let offersHtml = marketOffers.map(seller => `<div class="flex justify-between items-center bg-purple-50 p-2 rounded border border-purple-100 mb-1"><span class="text-xs font-bold text-purple-800">${getNameFromEmail(seller)}</span><button onclick="acceptExchange('${key}', '${email}', '${seller}')" class="bg-purple-600 text-white text-[10px] px-2 py-1 rounded font-bold">Take</button></div>`).join('');
                     actionHtml = `<div class="w-full mb-1">${offersHtml}</div>`;
                } else if (isUnavailable) {
                    actionHtml = `<button onclick="setAvailability('${key}', '${email}', true)" class="w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-2 rounded transition">Undo "Unavailable"</button>`;
                } else {
                    const unavBtn = `<button onclick="setAvailability('${key}', '${email}', false)" class="bg-white border border-red-200 text-red-600 text-xs py-2 px-4 rounded font-bold">Unavailable</button>`;
                    if (isLocked) actionHtml = `<div class="flex gap-2 w-full"><div class="flex-1 bg-gray-100 text-gray-500 text-xs py-2 rounded font-bold text-center border border-gray-200">🔒 Locked</div>${unavBtn}</div>`;
                    else if (needed <= 0) actionHtml = `<div class="flex gap-2 w-full"><div class="flex-1 bg-gray-50 text-gray-400 text-xs py-2 rounded font-bold text-center border border-gray-200">Full</div>${unavBtn}</div>`;
                    else actionHtml = `<div class="flex gap-2 w-full"><button onclick="volunteer('${key}', '${email}')" class="flex-1 bg-indigo-600 text-white text-xs py-2 rounded font-bold">Volunteer</button>${unavBtn}</div>`;
                }
            }

            // --- STAFF LIST RENDER (FIXED) ---
            let staffListHtml = '';
            if (slot.assigned.length > 0) {
                const listItems = slot.assigned.map(st => {
                    const s = staffData.find(sd => sd.email === st);
                    if (!s) return '';
                    const isExchanging = slot.exchangeRequests && slot.exchangeRequests.includes(st);
                    const statusIcon = isExchanging ? "⏳" : "✅";
                    
                    // Fixed: Removed Reference to reserveBadge
                    return `<div class="flex justify-between items-center text-xs bg-white p-1.5 rounded border border-gray-100 mb-1"><span class="font-bold text-gray-700 flex items-center">${statusIcon} <span class="ml-1">${s.name}</span></span></div>`;
                }).join('');
                
                staffListHtml = `<div class="mt-3 pt-2 border-t border-gray-200"><div class="flex justify-between items-center mb-1.5"><div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Staff</div></div><div class="space-y-0.5 max-h-24 overflow-y-auto custom-scroll">${listItems}</div></div>`;
            }

            container.innerHTML += `<div class="bg-gray-50 p-3 rounded border border-gray-200 mb-2"><div class="flex justify-between items-center mb-2"><span class="font-bold text-gray-800 text-sm">${sessLabel} <span class="text-[10px] text-gray-500 font-normal ml-1">${key.split('|')[1]}</span></span><span class="text-xs bg-white border px-2 py-0.5 rounded">${filled}/${slot.required}</span></div><div class="mt-2">${actionHtml}</div>${staffListHtml}</div>`;
        });
    } else {
        container.innerHTML = `<p class="text-gray-400 text-sm text-center py-4 bg-gray-50 rounded border border-gray-100 mb-4">No exam sessions scheduled.</p>`;
    }

    // 3. ADVANCE / GENERAL UNAVAILABILITY SECTION
    if (isRestricted) {
         let reasonMsg = isPast ? "Date in Past" : "Date > 3 Months ahead";
         container.innerHTML += `<div class="mt-4 pt-4 border-t border-gray-200"><div class="bg-gray-100 p-3 rounded-lg border border-gray-200 text-center"><p class="text-xs text-gray-500 font-bold italic">🚫 Unavailability Editing Locked (${reasonMsg})</p></div></div>`;
         window.openModal('day-detail-modal');
         return;
    }

    const adv = advanceUnavailability[dateStr] || { FN: [], AN: [] };
    const fnUnavail = adv.FN && adv.FN.some(u => (typeof u === 'string' ? u === email : u.email === email));
    const anUnavail = adv.AN && adv.AN.some(u => (typeof u === 'string' ? u === email : u.email === email));
    const bothUnavail = fnUnavail && anUnavail;

    const getBtnState = (isAssigned, isMarked, label, isAdminLocked) => {
        if (isAdminLocked && !isMarked) return { disabled: 'disabled', class: 'bg-amber-50 text-amber-500 border-amber-100 cursor-not-allowed', text: `🛡️ ${label} Admin Locked` };
        if (isAssigned) return { disabled: 'disabled', class: 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed', text: `🚫 On Duty (${label})` };
        if (isMarked) return { disabled: '', class: 'bg-red-600 text-white border-red-700 hover:bg-red-700', text: `🚫 ${label} Unavailable` };
        return { disabled: '', class: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50', text: `Mark ${label}` };
    };

    const fnBtn = getBtnState(isAssignedFN, fnUnavail, "FN", adminLockFN);
    const anBtn = getBtnState(isAssignedAN, anUnavail, "AN", adminLockAN);

    const anyDuty = isAssignedFN || isAssignedAN;
    const anyAdminLock = adminLockFN || adminLockAN;

    let wholeClass, wholeText, wholeDisabled;
    if (anyAdminLock) {
        wholeClass = "bg-amber-50 text-amber-500 border-amber-100 cursor-not-allowed";
        wholeText = "🛡️ Whole Day Locked by Admin";
        wholeDisabled = "disabled";
    } else if (anyDuty) {
        wholeClass = "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed";
        wholeText = "🚫 Cannot Mark Whole Day (On Duty)";
        wholeDisabled = "disabled";
    } else {
        wholeClass = bothUnavail ? 'bg-red-800 text-white border-red-900' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-100';
        wholeText = bothUnavail ? '🚫 Clear Whole Day Unavailability' : '📅 Mark Whole Day Unavailable';
        wholeDisabled = "";
    }

    container.innerHTML += `
        <div class="mt-4 pt-4 border-t border-gray-200">
            <h4 class="text-xs font-bold text-indigo-900 uppercase mb-2 flex items-center gap-2"><span>🗓️</span> General Unavailability (OD/DL/Leave)</h4>
            <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <p class="text-[10px] text-gray-600 mb-3">Mark leave for sessions or the whole day.</p>
                <div class="grid grid-cols-2 gap-2 mb-2">
                    <button onclick="toggleAdvance('${dateStr}', '${email}', 'FN')" ${fnBtn.disabled} class="py-2 text-[10px] font-bold rounded border transition flex items-center justify-center gap-1 ${fnBtn.class}">${fnBtn.text}</button>
                    <button onclick="toggleAdvance('${dateStr}', '${email}', 'AN')" ${anBtn.disabled} class="py-2 text-[10px] font-bold rounded border transition flex items-center justify-center gap-1 ${anBtn.class}">${anBtn.text}</button>
                </div>
                <button onclick="toggleWholeDay('${dateStr}', '${email}')" ${wholeDisabled} class="w-full py-2 text-xs font-bold rounded border transition flex items-center justify-center gap-2 ${wholeClass}">${wholeText}</button>
            </div>
        </div>
    `;

    window.openModal('day-detail-modal');
}


// --- HELPERS & ACTIONS ---
function updateHeaderButtons(currentView) {
    const container = document.getElementById('auth-section');
    const existingBtn = document.getElementById('switch-view-btn');
    if (existingBtn) existingBtn.remove();

    if (isAdmin) {
        const btn = document.createElement('button');
        btn.id = 'switch-view-btn';
        btn.className = "bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded text-sm font-bold hover:bg-indigo-200 transition";
        btn.innerHTML = (currentView === 'admin') ? `Switch to My Duties` : `Back to Admin`;
        btn.onclick = (currentView === 'admin') ? switchToStaffView : initAdminDashboard;
        container.insertBefore(btn, document.getElementById('logout-btn'));
    }
}

// --- HELPER: Change Month ---
window.changeAdminMonth = function (delta) {
    currentAdminDate.setMonth(currentAdminDate.getMonth() + delta);
    renderSlotsGridAdmin();
}
function switchToStaffView() {
    const me = staffData.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase());
    if (me) initStaffDashboard(me);
    else {
        if (confirm("No staff profile found. Create one?")) {
            openModal('add-staff-modal');
            document.getElementById('stf-email').value = currentUser.email;
            document.getElementById('stf-email').disabled = true;
        }
    }
}

async function syncSlotsToCloud() {
    updateSyncStatus("Saving...", "neutral");
    try {
        // Write to 'system_data/slots'
        const ref = doc(db, "colleges", currentCollegeId, "system_data", "slots");
        await setDoc(ref, { 
            examInvigilationSlots: JSON.stringify(invigilationSlots) 
        }, { merge: true });
        updateSyncStatus("Synced", "success");
    } catch (e) {
        console.error(e);
        updateSyncStatus("Save Failed", "error");
        alert("⚠️ Failed to save slots.");
    }
}

async function syncStaffToCloud() {
    updateSyncStatus("Saving...", "neutral");
    try {
        // Write to 'system_data/staff'
        const ref = doc(db, "colleges", currentCollegeId, "system_data", "staff");
        // Note: We only save staffData here. InvigMapping is saved separately or merged if needed.
        await setDoc(ref, { 
            examStaffData: JSON.stringify(staffData) 
        }, { merge: true });
        updateSyncStatus("Synced", "success");
    } catch (e) {
        console.error(e);
        updateSyncStatus("Save Failed", "error");
    }
}

// --- NEW: ADD STAFF ACCESS (SEPARATE FIELD) ---
async function addStaffAccess(email) {
    try {
        const ref = doc(db, "colleges", currentCollegeId);
        // Add to 'staffAccessList' instead of 'allowedUsers'
        await updateDoc(ref, { staffAccessList: arrayUnion(email) });
    } catch (e) { console.error(e); }
}

async function removeStaffAccess(email) {
    try {
        const ref = doc(db, "colleges", currentCollegeId);
        await updateDoc(ref, { staffAccessList: arrayRemove(email) });
    } catch (e) { console.error(e); }
}
// --- NEW: MANUAL SLOT ADDITION ---

// --- NEW: MANUAL SLOT ADDITION (Time Based) ---

function openAddSlotModal() {
    document.getElementById('manual-slot-date').valueAsDate = new Date();
    // Set default time to 09:30
    const timeInput = document.getElementById('manual-slot-time');
    if (timeInput) timeInput.value = "09:30";

    document.getElementById('manual-slot-req').value = 5;
    window.openModal('add-slot-modal');
}

async function saveManualSlot() {
    const dateInput = document.getElementById('manual-slot-date').value;
    // CHANGED: Get value from Time Input instead of Select
    const timeInput = document.getElementById('manual-slot-time').value;
    const reqInput = parseInt(document.getElementById('manual-slot-req').value);

    if (!dateInput || !timeInput || isNaN(reqInput) || reqInput < 1) {
        alert("Please enter a valid date, time, and required count.");
        return;
    }

    // 1. Format Date: YYYY-MM-DD -> DD.MM.YYYY
    const [y, m, d] = dateInput.split('-');
    const formattedDate = `${d}.${m}.${y}`;

    // 2. Format Time: HH:MM -> hh:mm AM/PM
    let [hours, minutes] = timeInput.split(':');
    hours = parseInt(hours);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    // 3. Generate Key
    const key = `${formattedDate} | ${formattedTime}`;

    // 4. Check for existing
    if (invigilationSlots[key]) {
        if (!confirm(`A slot for ${key} already exists (Req: ${invigilationSlots[key].required}).\n\nOverwrite with ${reqInput}?`)) {
            return;
        }
    }

    // 5. Create/Update Slot
    const existing = invigilationSlots[key] || { assigned: [], unavailable: [], isLocked: true };

    invigilationSlots[key] = {
        ...existing,
        required: reqInput,
        assigned: existing.assigned || [],
        unavailable: existing.unavailable || [],
        isLocked: existing.isLocked !== undefined ? existing.isLocked : true
    };
    logActivity("Session Created", `Admin created/updated session: ${key} (Req: ${reqInput}).`);
    await syncSlotsToCloud();
    window.closeModal('add-slot-modal');
    renderSlotsGridAdmin();
}

// Expose to window for HTML onclick handlers
window.openAddSlotModal = openAddSlotModal;
window.saveManualSlot = saveManualSlot;

// --- NEW: Delete Slot Function ---
window.deleteSlot = async function (key) {
    // 1. Security Check
    if (!confirm(`⚠️ DANGER ZONE ⚠️\n\nAre you sure you want to PERMANENTLY DELETE this slot?\n\nSlot: ${key}\n\nThis will remove all assigned staff and records for this session.`)) return;

    // 2. Delete from local object
    if (invigilationSlots[key]) {
        delete invigilationSlots[key];

        // 3. Save to Cloud
        await syncSlotsToCloud();

        // 4. Refresh Grid
        renderSlotsGridAdmin();

        // 5. Log it
        if (typeof logActivity === 'function') logActivity("Slot Deleted", `Admin deleted slot: ${key}`);
    }
}


// --- MISSING HELPER FUNCTIONS ---

async function saveAdvanceUnavailability() {
    updateSyncStatus("Saving...", "neutral");
    try {
        // Write to 'system_data/slots' (grouped with slots)
        const ref = doc(db, "colleges", currentCollegeId, "system_data", "slots");
        await setDoc(ref, { 
            invigAdvanceUnavailability: JSON.stringify(advanceUnavailability) 
        }, { merge: true });
        updateSyncStatus("Synced", "success");
    } catch (e) {
        console.error("Save Error:", e);
        updateSyncStatus("Save Failed", "error");
    }
}
// Function to toggle the "Details" box in the unavailability modal
window.toggleUnavDetails = function() {
    const reasonEl = document.getElementById('unav-reason');
    const container = document.getElementById('unav-details-container');
    if (!reasonEl || !container) return;
    
    const reason = reasonEl.value;
    // Show details box only for specific reasons
    if (['OD', 'DL', 'Medical', 'Other'].includes(reason)) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}


window.toggleAdvance = async function(dateStr, email, session) {
    // [VALIDATION CHECK]
    if (!isActionAllowed(dateStr)) return;

    // --- NEW: ADMIN POSTING LOCK CHECK ---
    // Look for ANY slot on this specific Date and Session that is Admin Locked
    const hasAdminLock = Object.keys(invigilationSlots).some(k => {
        // 1. Check Date Match
        if (!k.startsWith(dateStr)) return false;

        // 2. Check Session Match (FN/AN)
        const tPart = k.split(' | ')[1] || "";
        const t = tPart.toUpperCase();
        const slotSession = (t.includes("PM") || t.startsWith("12:") || t.startsWith("12.")) ? "AN" : "FN";

        // 3. Return true if session matches AND it is locked by Admin
        return slotSession === session && invigilationSlots[k].isAdminLocked;
    });

    if (hasAdminLock) {
        return alert(`🚫 Posting Locked! The Admin has locked the ${session} session on ${dateStr} for manual assignment. You cannot change unavailability now.`);
    }
    // -------------------------------------

    // 1. Safety check for data structure
    if (!advanceUnavailability[dateStr]) advanceUnavailability[dateStr] = { FN: [], AN: [] };
    if (!advanceUnavailability[dateStr][session]) advanceUnavailability[dateStr][session] = [];

    const list = advanceUnavailability[dateStr][session];
    // Ensure we handle mixed data types (legacy strings vs objects)
    const existingEntry = list.find(u => (typeof u === 'string' ? u === email : u.email === email));

    if (existingEntry) {
        // REMOVE (Simple Confirm)
        if(confirm(`Remove 'Unavailable' status for ${session}?`)) {
            // A. UPDATE LOCAL DATA INSTANTLY
            advanceUnavailability[dateStr][session] = list.filter(u => (typeof u === 'string' ? u !== email : u.email !== email));
            
            // B. UPDATE UI INSTANTLY
            try {
                if(typeof renderStaffCalendar === 'function') renderStaffCalendar(email);
                if(typeof renderStaffUpcomingSummary === 'function') renderStaffUpcomingSummary(email);
            } catch(e) { console.error("UI Update failed", e); }

            // C. CLOSE MODAL INSTANTLY
            window.closeModal('day-detail-modal'); 

            // D. SYNC TO CLOUD (Background)
            try {
                // Logging (Safe)
                try {
                    const staffName = getNameFromEmail(email);
                    logActivity("Advance Unavailability Removed", `Removed ${staffName} from ${dateStr} (${session}) unavailability list.`);
                } catch (e) {}

                await saveAdvanceUnavailability();
            } catch (err) {
                console.error("Cloud Save Error:", err);
                updateSyncStatus("Save Failed", "error");
            }
        }
    } else {
        // ADD (Open Modal for Reason)
        document.getElementById('unav-key').value = `ADVANCE|${dateStr}|${session}`; 
        document.getElementById('unav-email').value = email;
        
        document.getElementById('unav-reason').value = "";
        document.getElementById('unav-details').value = "";
        const detailsContainer = document.getElementById('unav-details-container');
        if(detailsContainer) detailsContainer.classList.add('hidden');
        
        window.closeModal('day-detail-modal');
        window.openModal('unavailable-modal');
    }
}

window.toggleWholeDay = async function(dateStr, email) {
    // [VALIDATION CHECK 1: Date Restrictions]
    if (!isActionAllowed(dateStr)) return;

    // --- NEW: ADMIN POSTING LOCK CHECK ---
    // Check if ANY slot on this date is locked by the Admin.
    // If even one session (FN or AN) is locked, we block "Whole Day" changes.
    const hasAdminLock = Object.keys(invigilationSlots).some(k => {
        // 1. Check if key starts with the date (e.g. "01.12.2025")
        if (!k.startsWith(dateStr)) return false;

        // 2. Check if this specific slot is Admin Locked
        return invigilationSlots[k].isAdminLocked;
    });

    if (hasAdminLock) {
        return alert(`🚫 Posting Locked! The Admin has locked sessions on ${dateStr} for manual assignment. You cannot change 'Whole Day' unavailability right now.`);
    }
    // -------------------------------------

    // 1. Safety check for data structure
    if (!advanceUnavailability[dateStr]) advanceUnavailability[dateStr] = { FN: [], AN: [] };
    
    const fnList = advanceUnavailability[dateStr].FN || [];
    const anList = advanceUnavailability[dateStr].AN || [];
    
    // Check if user is in BOTH lists
    const isFn = fnList.some(u => (typeof u === 'string' ? u === email : u.email === email));
    const isAn = anList.some(u => (typeof u === 'string' ? u === email : u.email === email));
    const isFullDay = isFn && isAn;

    if (isFullDay) {
        // CLEAR BOTH
        if(confirm("Clear unavailability for the WHOLE DAY?")) {
            // A. UPDATE LOCAL DATA INSTANTLY
            advanceUnavailability[dateStr].FN = fnList.filter(u => (typeof u === 'string' ? u !== email : u.email !== email));
            advanceUnavailability[dateStr].AN = anList.filter(u => (typeof u === 'string' ? u !== email : u.email !== email));
            
            // B. UPDATE UI INSTANTLY
            try {
                if(typeof renderStaffCalendar === 'function') renderStaffCalendar(email);
                if(typeof renderStaffUpcomingSummary === 'function') renderStaffUpcomingSummary(email);
            } catch(e) { console.error("UI Update failed", e); }

            // C. CLOSE MODAL INSTANTLY
            window.closeModal('day-detail-modal');

            // D. SYNC TO CLOUD (Background)
            try {
                try {
                    const staffName = getNameFromEmail(email);
                    logActivity("Advance Unavailability Removed", `Removed ${staffName} from Whole Day ${dateStr}.`);
                } catch (e) {}

                await saveAdvanceUnavailability();
            } catch (err) {
                console.error("Cloud Save Error:", err);
                updateSyncStatus("Save Failed", "error");
            }
        }
    } else {
        // MARK BOTH
        document.getElementById('unav-key').value = `ADVANCE|${dateStr}|WHOLE`; 
        document.getElementById('unav-email').value = email;
        
        document.getElementById('unav-reason').value = "";
        document.getElementById('unav-details').value = "";
        const detailsContainer = document.getElementById('unav-details-container');
        if(detailsContainer) detailsContainer.classList.add('hidden');
        
        window.closeModal('day-detail-modal');
        window.openModal('unavailable-modal');
    }
}



// --- STANDARD EXPORTS ---
window.toggleLock = async function (key) {
    if (!invigilationSlots[key]) return;

    invigilationSlots[key].isLocked = !invigilationSlots[key].isLocked;
    
    // 1. Render immediately
    renderSlotsGridAdmin();

    const status = invigilationSlots[key].isLocked ? "LOCKED" : "UNLOCKED";
    logActivity("Session Lock Toggle", `Admin ${status} session ${key}.`);
    
    await syncSlotsToCloud();
}

// --- NEW: Lock All Function ---
window.lockAllSessions = async function () {
    if (!confirm("🔒 Are you sure you want to LOCK ALL sessions?\n\nInvigilators will not be able to volunteer for any session.")) return;

    let changed = false;
    Object.keys(invigilationSlots).forEach(key => {
        if (!invigilationSlots[key].isLocked) {
            invigilationSlots[key].isLocked = true;
            changed = true;
        }
    });

    if (!confirm("Confirm duty?")) return;

    const slot = invigilationSlots[key];
    slot.assigned.push(email);

    const me = staffData.find(s => s.email === email);
    if (me) me.dutiesAssigned = (me.dutiesAssigned || 0) + 1;
    logActivity("Slot Booked", `${getNameFromEmail(email)} volunteered for ${key}.`);
    await syncSlotsToCloud();
    await syncStaffToCloud();
    window.closeModal('day-detail-modal');
    renderStaffCalendar(email); // Refresh
}

window.changeSlotReq = async function (key, delta) {
    const slot = invigilationSlots[key];
    const newReq = slot.required + delta;
    if (newReq < slot.assigned.length) return alert("Cannot reduce slots below assigned count.");
    if (newReq < 1) return;
    slot.required = newReq;
    await syncSlotsToCloud();
    renderSlotsGridAdmin();
}


window.cancelDuty = async function (key, email, isLocked) {
    if (isLocked) return alert("🚫 Slot Locked! Contact Admin.");
    if (confirm("Cancel duty?")) {
        invigilationSlots[key].assigned = invigilationSlots[key].assigned.filter(e => e !== email);
        const me = staffData.find(s => s.email === email);
        if (me && me.dutiesAssigned > 0) me.dutiesAssigned--;
        logActivity("Duty Cancelled", `${getNameFromEmail(email)} cancelled duty for ${key}.`);
        await syncSlotsToCloud();
        await syncStaffToCloud();
        window.closeModal('day-detail-modal');
    }
}
function toggleUnavDetails() {
    const reasonEl = document.getElementById('unav-reason');
    const container = document.getElementById('unav-details-container');
    if (!reasonEl || !container) return;

    const reason = reasonEl.value;
    if (['OD', 'DL', 'Medical'].includes(reason)) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

window.setAvailability = async function (key, email, isAvailable) {
    // [VALIDATION CHECK 1: Date Restrictions]
    const [dateStr] = key.split(' | ');
    if (!isActionAllowed(dateStr)) return;

    // [VALIDATION CHECK 2: Admin Posting Lock]
    // If trying to mark UNAVAILABLE and Admin Lock is ON -> BLOCK IT
    const slot = invigilationSlots[key];
    if (!isAvailable && slot && slot.isAdminLocked) {
        alert("🚫 Posting Locked! You cannot mark unavailability for this slot as the Admin is finalizing assignments.");
        return;
    }

    if (isAvailable) {
        if (confirm("Mark available?")) {
            invigilationSlots[key].unavailable = invigilationSlots[key].unavailable.filter(u => (typeof u === 'string' ? u !== email : u.email !== email));
            logActivity("Marked Available", `${getNameFromEmail(email)} marked as available for ${key}.`);
            await syncSlotsToCloud();

            // *** FIX: Update List Live ***
            if (typeof renderStaffUpcomingSummary === 'function') renderStaffUpcomingSummary(email);

            window.closeModal('day-detail-modal');
            renderStaffCalendar(email); // Update calendar colors
        }
    } else {
        document.getElementById('unav-key').value = key;
        document.getElementById('unav-email').value = email;
        document.getElementById('unav-reason').value = "";
        document.getElementById('unav-details').value = "";
        document.getElementById('unav-details-container').classList.add('hidden');
        window.closeModal('day-detail-modal');
        window.openModal('unavailable-modal');
    }
}

window.confirmUnavailable = async function () {
    const key = document.getElementById('unav-key').value;
    const email = document.getElementById('unav-email').value;
    const reason = document.getElementById('unav-reason').value;
    const details = document.getElementById('unav-details').value.trim();

    // 1. Validation
    // Check Admin Lock
    if (invigilationSlots[key] && invigilationSlots[key].isAdminLocked) {
        return alert("🚫 Posting Locked! Admin has locked this slot.");
    }
    
    if (!reason) return alert("Select a reason.");
    if (['OD', 'DL', 'Medical'].includes(reason) && !details) return alert("Details required.");

    const entry = { email, reason, details: details || "" };

    if (key.startsWith('ADVANCE|')) {
        // --- CASE A: ADVANCE / GENERAL UNAVAILABILITY ---
        const [_, dateStr, session] = key.split('|');

        if (!advanceUnavailability[dateStr]) advanceUnavailability[dateStr] = { FN: [], AN: [] };
        if (!advanceUnavailability[dateStr].FN) advanceUnavailability[dateStr].FN = [];
        if (!advanceUnavailability[dateStr].AN) advanceUnavailability[dateStr].AN = [];

        if (session === 'WHOLE') {
            // Clear both sessions first
            advanceUnavailability[dateStr].FN = advanceUnavailability[dateStr].FN.filter(u => u.email !== email);
            advanceUnavailability[dateStr].AN = advanceUnavailability[dateStr].AN.filter(u => u.email !== email);
            
            advanceUnavailability[dateStr].FN.push(entry);
            advanceUnavailability[dateStr].AN.push(entry);
            
            logActivity("Advance Unavailability", `Marked ${getNameFromEmail(email)} unavailable for WHOLE DAY on ${dateStr}.`);
        } else {
            // Single Session
            if (!advanceUnavailability[dateStr][session]) advanceUnavailability[dateStr][session] = [];
            
            // Safety: Remove existing before pushing
            advanceUnavailability[dateStr][session] = advanceUnavailability[dateStr][session].filter(u => u.email !== email);
            advanceUnavailability[dateStr][session].push(entry);

            logActivity("Advance Unavailability", `Marked ${getNameFromEmail(email)} unavailable for ${dateStr} (${session}).`);
        }

        await saveAdvanceUnavailability();
        
        window.closeModal('unavailable-modal');
        window.closeModal('day-detail-modal'); 
        renderStaffCalendar(email);
        if (typeof renderStaffUpcomingSummary === 'function') renderStaffUpcomingSummary(email);

    } else {
        // --- CASE B: SLOT SPECIFIC (The Bug was Here) ---
        if (!invigilationSlots[key].unavailable) invigilationSlots[key].unavailable = [];
        
        // *** FIX: Remove existing entry for this email before adding ***
        invigilationSlots[key].unavailable = invigilationSlots[key].unavailable.filter(u => 
            (typeof u === 'string' ? u !== email : u.email !== email)
        );

        // Now push the new entry (Guaranteed unique)
        invigilationSlots[key].unavailable.push(entry);

        logActivity("Session Unavailability", `Marked ${getNameFromEmail(email)} unavailable for ${key}. Reason: ${reason}`);

        await syncSlotsToCloud();
        
        window.closeModal('unavailable-modal');
        window.closeModal('day-detail-modal'); 

        renderStaffCalendar(email);
        if (typeof renderStaffUpcomingSummary === 'function') renderStaffUpcomingSummary(email);
    }
}

window.waNotify = function (key) {
    const slot = invigilationSlots[key];
    if (!slot || slot.assigned.length === 0) return alert("No staff assigned.");

    // Get first valid phone with prefix
    let phone = "";
    for (const email of slot.assigned) {
        const s = staffData.find(st => st.email === email);
        if (s && s.phone) {
            let p = s.phone.replace(/\D/g, '');
            if (p.length === 10) p = "91" + p;
            if (p.length >= 10) {
                phone = p;
                break;
            }
        }
    }

    if (!phone) return alert("No valid phone numbers found.");
    const msg = encodeURIComponent(`Exam Duty: ${key}.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
}

// LIGHTWEIGHT VERSION: Just refreshes the slots from the cloud
window.calculateSlotsFromSchedule = async function () {
    const btn = document.querySelector('button[onclick="calculateSlotsFromSchedule()"]');
    if (btn) { btn.disabled = true; btn.innerText = "⏳ Refreshing Slots..."; }

    try {
        if(!currentCollegeId) throw new Error("You are not logged in.");

        updateSyncStatus("Fetching Slots...", "neutral");
        
        // 1. Fetch ONLY the slots document
        const { db, doc, getDoc } = window.firebase;
        const slotsRef = doc(db, "colleges", currentCollegeId, "system_data", "slots");
        const snapshot = await getDoc(slotsRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            const cloudSlots = JSON.parse(data.examInvigilationSlots || '{}');
            
            // 2. Update Local State
            invigilationSlots = cloudSlots;
            localStorage.setItem('examInvigilationSlots', JSON.stringify(invigilationSlots));
            
            if (data.invigAdvanceUnavailability) {
                advanceUnavailability = JSON.parse(data.invigAdvanceUnavailability || '{}');
                localStorage.setItem('invigAdvanceUnavailability', data.invigAdvanceUnavailability);
            }

            // 3. Update UI
            if (typeof renderSlotsGridAdmin === 'function') renderSlotsGridAdmin();
            
            alert("✅ Synced! Loaded latest invigilation requirements from cloud.");
            updateSyncStatus("Synced", "success");
        } else {
            alert("⚠️ No slot data found in cloud. Please save data in the main Exam App first.");
        }

    } catch (e) {
        console.error("Slot Sync Error:", e);
        alert("❌ Error: " + e.message);
        updateSyncStatus("Sync Failed", "error");
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = "Check Cloud for Updates"; }
    }
}



// --- HELPER: Get Slot Reserves (Last N assigned staff) ---
window.getSlotReserves = function (key) {
    const slot = invigilationSlots[key];
    if (!slot || !slot.assigned) return [];

    // 1. Determine Reserve Count
    let rCount = slot.reserveCount;
    
    // Fallback if 'reserveCount' missing (Legacy Data)
    if (rCount === undefined) {
        // Formula: Base = floor(Total / 1.1)
        const estBase = Math.floor(slot.required / 1.1);
        rCount = Math.max(0, slot.required - estBase);
    }

    // 2. Calculate Base Requirement (Active Duty)
    const baseReq = slot.required - rCount;

    // 3. Identification:
    // Reserves are any staff assigned AFTER the Base Requirement is met.
    if (slot.assigned.length <= baseReq) return []; // Slot not full enough to have reserves

    const reserveEmails = slot.assigned.slice(baseReq);
    return reserveEmails.map(e => staffData.find(s => s.email === e)).filter(s => s);
}

window.notifySlotReserves = async function (key) {
    const reserves = getSlotReserves(key);
    if (reserves.length === 0) return alert("No reserves identified (Assigned <= Required).");

    const names = reserves.map(r => r.name).join(", ");
    if (!confirm(`Send Notifications to ${reserves.length} Reserves?\n\n${names}`)) return;

    updateSyncStatus("Sending...", "neutral");
    // Email Logic Reuse
    let sent = 0;
    for (const r of reserves) {
        try {
            await sendSingleEmail(null, r.email, r.name, "Reserve Duty Alert", `You are on RESERVE duty for ${key}. Please be available.`);
            sent++;
        } catch (e) { }
    }
    updateSyncStatus("Done", "success");
    alert(`Sent ${sent} notifications.`);
}

// --- REFINED AUTO-ALLOCATION (Session-Based Reserves) ---
window.runAutoAllocation = async function () {
    if (!confirm("⚡ Run SESSION-BASED Auto-Assignment?\n\nThis will fill slots to REQUIRED + 10% (Reserves).\n\nRules:\n1. Highest Pending First.\n2. Exclude Adjacent Days (Rules applied to EVERYONE).\n3. Dept Saturation (Exempt Single Faculty).\n\nAssign?")) return;

    // 1. Identify Target Slots
    const targetSlots = [];
    Object.keys(invigilationSlots).forEach(key => {
        const slot = invigilationSlots[key];
        if (!slot.isLocked) {
            targetSlots.push({ key, date: parseDate(key), slot });
        }
    });

    if (targetSlots.length === 0) return alert("No unlocked slots found.");

    targetSlots.sort((a, b) => a.date - b.date);

    // 2. Prepare Staff Stats
    const deptCounts = {};
    const singleFacultyDepts = new Set();

    // First Pass: Count Depts
    staffData.forEach(s => {
        if (s.status !== 'archived') {
            deptCounts[s.dept] = (deptCounts[s.dept] || 0) + 1;
        }
    });

    Object.keys(deptCounts).forEach(d => {
        if (deptCounts[d] === 1) singleFacultyDepts.add(d);
    });

    let eligibleStaff = staffData.map(s => ({
        ...s,
        pending: calculateStaffTarget(s) - getDutiesDoneCount(s.email),
        weeklyLoad: {}
    }));

    // Pre-fill existing assignment load
    Object.keys(invigilationSlots).forEach(k => {
        const d = parseDate(k);
        const mStr = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        const wNum = getWeekOfMonth(d);
        const weekKey = `${mStr}-${wNum}`;

        invigilationSlots[k].assigned.forEach(email => {
            const s = eligibleStaff.find(st => st.email === email);
            if (s) {
                if (!s.weeklyLoad[weekKey]) s.weeklyLoad[weekKey] = 0;
                s.weeklyLoad[weekKey]++;
            }
        });
    });

    let assignedCount = 0;
    const logEntries = [];

    // 3. Process Slots
    for (const target of targetSlots) {
        const { key, date, slot } = target;

        // TARGET: Required + 10%
        const targetCount = slot.required;
        const needed = targetCount - slot.assigned.length;

        if (needed <= 0) continue;

        const currentWeekKey = `${date.toLocaleString('default', { month: 'long', year: 'numeric' })}-${getWeekOfMonth(date)}`;

        // Context for Adjacent Rule (Global Check)
        const prevDate = new Date(date); prevDate.setDate(date.getDate() - 1);
        const nextDate = new Date(date); nextDate.setDate(date.getDate() + 1);

        const prevKeyStart = `${prevDate.getDate().toString().padStart(2, '0')}.${(prevDate.getMonth() + 1).toString().padStart(2, '0')}.${prevDate.getFullYear()}`;
        const nextKeyStart = `${nextDate.getDate().toString().padStart(2, '0')}.${(nextDate.getMonth() + 1).toString().padStart(2, '0')}.${nextDate.getFullYear()}`;

        // Lookup adjacent assignments
        const adjacentAssigned = new Set();
        Object.keys(invigilationSlots).forEach(k => {
            if (k.startsWith(prevKeyStart) || k.startsWith(nextKeyStart)) {
                invigilationSlots[k].assigned.forEach(e => adjacentAssigned.add(e));
            }
        });

        // Dept Context
        const slotDeptCounts = {};
        slot.assigned.forEach(email => {
            const s = staffData.find(st => st.email === email);
            if (s && s.dept) slotDeptCounts[s.dept] = (slotDeptCounts[s.dept] || 0) + 1;
        });

        // Score Candidates
        const candidates = eligibleStaff.map(s => {
            if (s.status === 'archived') return null;
            if (slot.assigned.includes(s.email)) return null;
            if (isUserUnavailable(slot, s.email, key)) return null;

            // --- EXEMPTION LOGIC ---
            const isSingleFaculty = singleFacultyDepts.has(s.dept);

            // 1. Adjacent Day Rule (Applies to ALL, logic: Skip if adjacent)
            if (adjacentAssigned.has(s.email)) return null;

            // 2. Dept Saturation (Skip if > 50%, UNLESS Single Faculty)
            const dTotal = deptCounts[s.dept] || 0;
            if (!isSingleFaculty && dTotal > 1) {
                const dAssigned = slotDeptCounts[s.dept] || 0;
                if (dAssigned >= Math.ceil(dTotal * 0.5)) return null;
            }

            let score = s.pending * 100;
            let warnings = [];

            // Weekly Soft Limit
            if (s.weeklyLoad[currentWeekKey] >= 3) {
                score -= 5000;
                warnings.push("Max 3/wk");
            }

            return { staff: s, score, warnings };
        }).filter(c => c !== null);

        // Sort: Highest Pending First
        candidates.sort((a, b) => b.score - a.score);

        // Take Top candidates
        const toAssign = candidates.slice(0, needed);

        toAssign.forEach(choice => {
            slot.assigned.push(choice.staff.email);
            choice.staff.pending--;
            if (!choice.staff.weeklyLoad[currentWeekKey]) choice.staff.weeklyLoad[currentWeekKey] = 0;
            choice.staff.weeklyLoad[currentWeekKey]++;

            slotDeptCounts[choice.staff.dept] = (slotDeptCounts[choice.staff.dept] || 0) + 1;
            assignedCount++;
        });
    }

    // 5. Logging
    if (assignedCount > 0) {
        logActivity("Global Auto-Assign", `Admin ran session-based auto-assign. Filled ${assignedCount} slots.`);
    }

    await syncSlotsToCloud();
    renderSlotsGridAdmin();

   alert(`✅ Session Auto-Assign Complete!\nFilled ${assignedCount} positions.`);
}
//-------------------


window.saveNewStaff = async function () {
    // 1. Capture Inputs
    const indexStr = document.getElementById('stf-edit-index').value;
    const isEditMode = (indexStr !== "");
    const index = isEditMode ? parseInt(indexStr) : -1;

    const name = document.getElementById('stf-name').value.trim();
    const email = document.getElementById('stf-email').value.trim();
    const phone = document.getElementById('stf-phone').value.trim();
    const dept = document.getElementById('stf-dept').value;
    const designation = document.getElementById('stf-designation').value;
    const date = document.getElementById('stf-join').value;

    // --- LOGIC: Available Days ---
    let availableDays = [1, 2, 3, 4, 5, 6]; // Default: Full Availability

    if (designation === "Guest Lecturer") {
        availableDays = Array.from(document.querySelectorAll('.stf-day-chk:checked')).map(c => parseInt(c.value));
    }

    // 2. Validation
    if (!name || !email) return alert("Name and Email are required.");

    // Change Button to Loading State
    const saveBtn = document.querySelector('#add-staff-modal button[onclick="saveNewStaff()"]');
    const originalText = saveBtn ? saveBtn.innerText : "Save";
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = "Saving...";
    }

    try {
        if (isEditMode) {
            // --- UPDATE EXISTING STAFF ---
            const oldData = staffData[index];
            const oldEmail = oldData.email;

            // Email Migration Logic
            if (oldEmail !== email) {
                if (staffData.some(s => s.email === email && s !== oldData)) {
                    throw new Error("This email is already used by another staff member.");
                }
                if (!confirm(`Change email from ${oldEmail} to ${email}?\n\nThis will update their system access AND migrate all their past records.`)) {
                    throw new Error("Cancelled by user.");
                }

                await removeStaffAccess(oldEmail);
                await addStaffAccess(email);

                // Deep Find & Replace in Slots (Migration)
                let slotsChanged = false;
                Object.keys(invigilationSlots).forEach(key => {
                    const slot = invigilationSlots[key];
                    if (slot.assigned.includes(oldEmail)) { slot.assigned = slot.assigned.map(e => e === oldEmail ? email : e); slotsChanged = true; }
                    if (slot.attendance && slot.attendance.includes(oldEmail)) { slot.attendance = slot.attendance.map(e => e === oldEmail ? email : e); slotsChanged = true; }
                    if (slot.exchangeRequests && slot.exchangeRequests.includes(oldEmail)) { slot.exchangeRequests = slot.exchangeRequests.map(e => e === oldEmail ? email : e); slotsChanged = true; }
                    if (slot.supervision) {
                        if (slot.supervision.cs === oldEmail) { slot.supervision.cs = email; slotsChanged = true; }
                        if (slot.supervision.sas === oldEmail) { slot.supervision.sas = email; slotsChanged = true; }
                    }
                    if (slot.unavailable) {
                        let unavChanged = false;
                        slot.unavailable = slot.unavailable.map(u => {
                            if (typeof u === 'string' && u === oldEmail) { unavChanged = true; return email; }
                            if (typeof u === 'object' && u.email === oldEmail) { unavChanged = true; return { ...u, email: email }; }
                            return u;
                        });
                        if (unavChanged) slotsChanged = true;
                    }
                });
                if (slotsChanged) await syncSlotsToCloud();

                // Migrate Advance Unavailability
                let advanceChanged = false;
                Object.keys(advanceUnavailability).forEach(dateKey => {
                    ['FN', 'AN'].forEach(sess => {
                        if (advanceUnavailability[dateKey] && advanceUnavailability[dateKey][sess]) {
                            advanceUnavailability[dateKey][sess] = advanceUnavailability[dateKey][sess].map(u => {
                                if (u.email === oldEmail) { advanceChanged = true; return { ...u, email: email }; }
                                return u;
                            });
                        }
                    });
                });
                if (advanceChanged) await saveAdvanceUnavailability();
            }

            logActivity("Staff Profile Updated", `Admin updated profile for ${name} (${email}).`);
            
            // Update Local Array
            staffData[index] = {
                ...oldData,
                name, email, phone, dept, designation, joiningDate: date,
                preferredDays: availableDays
            };

        } else {
            // --- ADD NEW STAFF ---
            if (staffData.some(s => s.email === email)) throw new Error("Staff with this email already exists.");

            const newObj = {
                name, email, phone, dept, designation, joiningDate: date,
                dutiesDone: 0, roleHistory: [],
                preferredDays: availableDays
            };
            
            // 1. Update Permissions First
            await addStaffAccess(email);
            
            // 2. Update Local Data
            staffData.push(newObj);
            logActivity("New Staff Added", `Admin added new staff: ${name} (${email}).`);
        }

        // --- CRITICAL FIX: SYNC BEFORE CLOSING ---
        await syncStaffToCloud(); 
        
        // --- UI Updates ---
        window.closeModal('add-staff-modal');
        
        if (!isAdmin) {
            window.location.reload();
        } else {
            renderStaffTable();
            updateAdminUI();
            alert(isEditMode ? "Staff profile updated successfully." : "New staff added successfully.");
        }

    } catch (e) {
        console.error(e);
        if (e.message !== "Cancelled by user.") {
            alert("❌ Error: " + e.message);
        }
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = originalText;
        }
    }
}




window.deleteStaff = async function (index) {
    const staff = staffData[index];
    if (!staff) return;

    if (confirm(`Archive ${staff.name}?\n\nThey will be hidden from new duty assignments, but their past attendance records will remain for reports.`)) {
        // Soft Delete
        staffData[index].status = 'archived';
        logActivity("Staff Archived", `Admin archived staff member: ${staff.name} (${staff.email}).`);
        await syncStaffToCloud();
        await removeStaffAccess(staff.email); // Optional: Block login
        renderStaffTable();
        alert("Staff archived successfully.");
    }
}
window.openRoleAssignmentModal = function (index) {
    const staff = staffData[index];
    const modal = document.getElementById('role-assignment-modal');
    document.getElementById('role-assign-name').textContent = staff.name;
    document.getElementById('role-assign-index').value = index;
    const select = document.getElementById('assign-role-select');
    select.innerHTML = Object.keys(rolesConfig).map(r => `<option value="${r}">${r}</option>`).join('');
    const hist = document.getElementById('role-history-list');
    hist.innerHTML = (staff.roleHistory || []).map((h, i) => `<div class="flex justify-between text-xs p-1 bg-gray-50 mb-1"><span>${h.role}</span> <button onclick="removeRoleFromStaff(${index},${i})" class="text-red-500">&times;</button></div>`).join('');
    modal.classList.remove('hidden');
}

window.saveRoleAssignment = async function () {
    const idx = document.getElementById('role-assign-index').value;
    const role = document.getElementById('assign-role-select').value;
    const start = document.getElementById('assign-start-date').value;
    const end = document.getElementById('assign-end-date').value;
    if (!start) return alert("Dates required");
    if (!staffData[idx].roleHistory) staffData[idx].roleHistory = [];
    staffData[idx].roleHistory.push({ role, start, end });
    logActivity("Role Assigned", `Assigned role '${role}' to ${staffData[idx].name}.`);
    await syncStaffToCloud();
    window.closeModal('role-assignment-modal');
    renderStaffTable();
}

window.removeRoleFromStaff = async function (sIdx, rIdx) {
    // 1. Capture the role name BEFORE deleting it
    const roleName = staffData[sIdx].roleHistory[rIdx].role; 
    
    // 2. Delete the role
    staffData[sIdx].roleHistory.splice(rIdx, 1);
    
    // 3. Log it (Now roleName is defined)
    logActivity("Role Removed", `Removed role '${roleName}' from ${staffData[sIdx].name}.`);
    
    await syncStaffToCloud();
    window.closeModal('role-assignment-modal');
    renderStaffTable();
}

// [In invigilation.js]

window.openInconvenienceModal = function (key) {
    const slot = invigilationSlots[key];
    if (!slot) return;

    // 1. Gather Slot Specific Unavailability
    const allUnavailable = [];
    if (slot.unavailable) {
        slot.unavailable.forEach(u => {
            const entry = (typeof u === 'string') ? { email: u, reason: "Unspecified" } : u;
            allUnavailable.push({ ...entry, type: 'Session' });
        });
    }

    // 2. Gather Advance Unavailability (OD/DL/Leave)
    const [dateStr, timeStr] = key.split(' | ');
    let session = "FN";
    const t = timeStr ? timeStr.toUpperCase() : "";
    if (t.includes("PM") || t.startsWith("12:") || t.startsWith("12.")) session = "AN";

    if (advanceUnavailability && advanceUnavailability[dateStr] && advanceUnavailability[dateStr][session]) {
        advanceUnavailability[dateStr][session].forEach(u => {
            const email = (typeof u === 'string') ? u : u.email;
            // Prevent duplicates if user is in both lists
            if (!allUnavailable.some(existing => existing.email === email)) {
                const entry = (typeof u === 'string') ? { email: u, reason: "Leave/OD", details: "Advance Leave" } : u;
                allUnavailable.push({ ...entry, type: 'Advance' }); // Mark source
            }
        });
    }

    if (allUnavailable.length === 0) return alert("No unavailability issues found.");

    document.getElementById('inconvenience-modal-subtitle').textContent = key;
    const list = document.getElementById('inconvenience-list');
    list.innerHTML = '';

    allUnavailable.forEach(u => {
        const s = staffData.find(st => st.email === u.email) || { name: u.email, phone: "", dept: "Unknown" };
        let phone = s.phone ? s.phone.replace(/\D/g, '') : "";
        if (phone.length === 10) phone = "91" + phone;
        const hasPhone = phone.length >= 10;

        const reason = u.reason || "N/A";
        const details = u.details || "No details provided.";
        
        // Visual distinction for Advance Leave
        const badgeColor = u.type === 'Advance' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-red-50 text-red-600 border-red-200';
        const sourceType = u.type === 'Advance' ? '(General Leave)' : '(Session Specific)';

        list.innerHTML += `
            <div class="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-2">
                <div class="flex justify-between items-start mb-1">
                    <div>
                        <div class="font-bold text-gray-800 text-sm">${s.name}</div>
                        <div class="text-[10px] text-gray-500 uppercase font-bold">${s.dept} <span class="text-gray-400 font-normal">${sourceType}</span></div>
                    </div>
                    <span class="${badgeColor} text-[10px] font-bold px-2 py-0.5 rounded border shadow-sm">${reason}</span>
                </div>
                <div class="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic mb-2">"${details}"</div>
                <div class="text-right">
                    ${hasPhone ? `<a href="https://wa.me/${phone}" target="_blank" class="text-green-600 hover:text-green-800 text-xs font-bold flex items-center justify-end gap-1">WhatsApp</a>` : ''}
                </div>
            </div>`;
    });
    window.openModal('inconvenience-modal');
}



// --- MISSING HELPER FUNCTIONS ---

// 0. Modal Helpers (Restored)
window.openModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
    else console.error("Modal not found:", id);
}

window.closeModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

// 1. Get Name from Email (Fixes your console error)
function getNameFromEmail(email) {
    if (!staffData || staffData.length === 0) return email.split('@')[0];
    const s = staffData.find(st => st.email === email);
    return s ? s.name : email.split('@')[0]; // Return Name or Email prefix if not found
}

// 2. Calculate Academic Year (Needed for stats)
function getCurrentAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    // Academic Year starts June 1st (Month 5)
    // If we are in Jan-May (0-4), the AY started in the previous year.
    const startYear = (month < 5) ? year - 1 : year;

    return {
        label: `${startYear}-${startYear + 1}`,
        start: new Date(startYear, 5, 1), // June 1st
        end: new Date(startYear + 1, 4, 31) // May 31st
    };
}
// --- ROLE EDITOR FUNCTIONS ---
window.openRoleConfigModal = function () {
    // 1. Reset ALL Locks
    isRoleLocked = true;
    isDeptLocked = true;
    isEmailConfigLocked = true;
    isGlobalTargetLocked = true; // <--- NEW

    // 2. Update UI for Locks
    updateLockIcon('role-lock-btn', true);
    updateLockIcon('dept-lock-btn', true);
    updateLockIcon('email-config-lock-btn', true);
    updateLockIcon('global-target-lock-btn', true); // <--- NEW

    toggleInputVisibility('role-input-row', true);
    toggleInputVisibility('dept-input-row', true);

    // 3. Configure Inputs (Locked by default)
    const urlInput = document.getElementById('google-script-url');
    if (urlInput) { urlInput.value = googleScriptUrl; urlInput.disabled = true; }

    const targetInput = document.getElementById('global-duty-target');
    if (targetInput) {
        targetInput.value = globalDutyTarget;
        targetInput.disabled = true;
    }

    const guestInput = document.getElementById('guest-duty-target');
    if (guestInput) {
        guestInput.value = guestGlobalTarget;
        guestInput.disabled = true;
    }

    // 4. Render Lists
    renderRolesList();
    if (typeof renderDepartmentsList === "function") renderDepartmentsList();

    window.openModal('role-config-modal');
}

function renderRolesList() {
    const container = document.getElementById('roles-list-container');
    if (!container) return;

    container.innerHTML = '';
    const sortedRoles = Object.entries(rolesConfig).sort((a, b) => a[0].localeCompare(b[0]));

    if (sortedRoles.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-xs text-center py-2">No custom roles defined.</p>';
        return;
    }

    sortedRoles.forEach(([role, target]) => {
        // Check if this is a Protected System Role
        const isSystemRole = SYSTEM_ROLES.includes(role);

        let actionButtons = '';

        if (!isRoleLocked) {
            // If System Role -> Hide Delete Button
            const deleteBtn = isSystemRole
                ? `<span class="text-gray-300 text-[10px] cursor-not-allowed px-1.5" title="System Default">🚫</span>`
                : `<button onclick="deleteRoleConfig('${role}')" class="text-red-500 hover:text-red-700 font-bold px-1.5">&times;</button>`;

            actionButtons = `
                <div class="flex items-center gap-2">
                    <button onclick="editRoleConfig('${role}', ${target})" class="text-indigo-600 hover:text-indigo-900 text-[10px] font-bold bg-indigo-50 px-2 py-0.5 rounded">✎</button>
                    ${deleteBtn}
                </div>`;
        }

        const tag = isSystemRole ? `<span class="ml-1 text-[8px] bg-gray-100 text-gray-500 px-1 rounded border">Sys</span>` : "";

        container.innerHTML += `
            <div class="flex justify-between items-center text-xs bg-white p-2 rounded border mb-1 border-gray-100">
                <span class="font-bold text-gray-700 flex items-center">${role} ${tag}</span>
                <div class="flex items-center gap-3">
                    <span class="bg-gray-50 text-gray-600 px-2 py-0.5 rounded font-mono font-bold text-[10px]">${target}/mo</span>
                    ${actionButtons}
                </div>
            </div>`;
    });
}

window.addNewRoleConfig = function () {
    const name = document.getElementById('new-role-name').value.trim();
    const target = parseInt(document.getElementById('new-role-target').value);

    if (!name) return alert("Enter a Role Name");
    if (isNaN(target)) return alert("Enter a Target Number");

    rolesConfig[name] = target;
    renderRolesList();

    document.getElementById('new-role-name').value = '';
    document.getElementById('new-role-target').value = '';
}

window.editRoleConfig = function (role, currentTarget) {
    const newTarget = prompt(`Update monthly duty target for "${role}":`, currentTarget);

    if (newTarget === null) return; // Cancelled

    const targetNum = parseInt(newTarget);
    if (isNaN(targetNum) || targetNum < 0) {
        alert("Please enter a valid number (0 or greater).");
        return;
    }

    // Update Config
    rolesConfig[role] = targetNum;

    // Refresh List
    renderRolesList();
}

window.deleteRoleConfig = function (role) {
    if (SYSTEM_ROLES.includes(role)) {
        return alert("⚠️ Cannot delete System Default roles (CS, SAS, Principal).");
    }
    if (confirm(`Delete role "${role}"? This will affect calculations for staff assigned this role.`)) {
        delete rolesConfig[role];
        renderRolesList();
    }
}

window.saveRoleConfig = async function () {
    const newGlobal = parseInt(document.getElementById('global-duty-target').value);
    const newGuest = parseInt(document.getElementById('guest-duty-target').value);

    if (isNaN(newGlobal) || newGlobal < 0) return alert("Invalid Global Target");
    if (isNaN(newGuest) || newGuest < 0) return alert("Invalid Guest Target");

    globalDutyTarget = newGlobal;
    guestGlobalTarget = newGuest;

    // CAPTURE URL
    const newUrl = document.getElementById('google-script-url').value.trim();
    googleScriptUrl = newUrl;
    logActivity("Settings Updated", `Admin updated Global Target to ${globalDutyTarget} and Guest Target to ${guestGlobalTarget}.`);
    // Save to Cloud
    const ref = doc(db, "colleges", currentCollegeId);
    await updateDoc(ref, {
        invigRoles: JSON.stringify(rolesConfig),
        invigDepartments: JSON.stringify(departmentsConfig),
        invigGlobalTarget: globalDutyTarget,
        invigGuestTarget: guestGlobalTarget, // <--- SAVED HERE
        invigGoogleScriptUrl: googleScriptUrl
    });

    window.closeModal('role-config-modal');
    updateAdminUI();
}

// --- NEW: Open Norms Modal (Shows Roles & Global Target) ---
window.openDutyNormsModal = function () {
    // 1. Set Global Target
    const globalTargetEl = document.getElementById('ref-global-target');
    if (globalTargetEl) globalTargetEl.textContent = globalDutyTarget; // e.g. "2"

    // 2. List Special Roles (Warden, VP, etc.)
    const container = document.getElementById('ref-roles-list');
    if (!container) return;

    container.innerHTML = '';

    if (Object.keys(rolesConfig).length === 0) {
        container.innerHTML = '<p class="text-gray-400 italic text-xs text-center py-2">No special roles defined.</p>';
    } else {
        // Sort alphabetically
        const sortedRoles = Object.entries(rolesConfig).sort((a, b) => a[0].localeCompare(b[0]));

        sortedRoles.forEach(([role, target]) => {
            // Highlight exemptions (0 target)
            const isExempt = target === 0;
            const bgClass = isExempt ? "bg-green-50 border-green-100" : "bg-white border-gray-100";
            const textClass = isExempt ? "text-green-700" : "text-gray-700";
            const countDisplay = isExempt ? "EXEMPT" : `<b>${target}</b> / mo`;

            container.innerHTML += `
                <div class="flex justify-between items-center text-xs p-2.5 rounded border ${bgClass} mb-1.5">
                    <span class="${textClass} font-bold">${role}</span>
                    <span class="text-gray-600 ${isExempt ? 'font-bold text-green-600 text-[10px]' : ''}">${countDisplay}</span>
                </div>
            `;
        });
    }

    window.openModal('norms-modal');
}

// --- ATTENDANCE MARKING LOGIC ---

function populateAttendanceSessions() {
    if (!ui.attSessionSelect) return;

    // Sort Sessions: Latest Date/Time First (Descending)
    const sortedKeys = Object.keys(invigilationSlots).sort((a, b) => {
        const dateA = parseDate(a); // Uses the helper to get full Date object with time
        const dateB = parseDate(b);
        return dateB - dateA; // Descending (B - A)
    });

    ui.attSessionSelect.innerHTML = '<option value="">-- Select Session --</option>';

    sortedKeys.forEach(key => {
        const slot = invigilationSlots[key];
        // Add checkmark if attendance has been marked (array exists and not empty)
        const mark = (slot.attendance && slot.attendance.length > 0) ? "✅ " : "";

        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `${mark}${key}`;
        ui.attSessionSelect.appendChild(opt);
    });
}

window.loadSessionAttendance = function () {
    const key = ui.attSessionSelect.value;
    if (!key) {
        ui.attArea.classList.add('hidden');
        ui.attPlaceholder.classList.remove('hidden');
        return;
    }

    const slot = invigilationSlots[key];
    const isLocked = slot.attendanceLocked || false;

    ui.attArea.classList.remove('hidden');
    ui.attPlaceholder.classList.add('hidden');
    ui.attList.innerHTML = '';

    // --- RESET SEARCH INPUTS ---
    const inputs = ['att-substitute-search', 'att-cs-search', 'att-sas-search'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = "";
            el.disabled = isLocked;
            if (isLocked) el.classList.add('bg-gray-100', 'cursor-not-allowed');
            else el.classList.remove('bg-gray-100', 'cursor-not-allowed');
        }
    });

    // Clear Hidden IDs
    document.getElementById('att-cs-email').value = "";
    document.getElementById('att-sas-email').value = "";
    currentSubstituteCandidate = null;

    // --- 1. SUPERVISION LOGIC (Robust & Date-Aware) ---
    const sessionDate = parseDate(key);
    const startOfDay = new Date(sessionDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sessionDate); endOfDay.setHours(23, 59, 59, 999);

    let defaultCS = "";
    let defaultSAS = "";

    // Helper for Role Matching
    const isCS = (r) => { const s = r.toLowerCase().trim(); return s === "cs" || s.includes("chief"); };
    const isSAS = (r) => { const s = r.toLowerCase().trim(); return s === "sas" || s.includes("senior"); };

    staffData.forEach(s => {
        if (s.roleHistory) {
            const activeRole = s.roleHistory.find(r => {
                const rStart = new Date(r.start); rStart.setHours(0, 0, 0, 0);
                const rEnd = new Date(r.end); rEnd.setHours(23, 59, 59, 999);
                return rStart <= endOfDay && rEnd >= startOfDay && (isCS(r.role) || isSAS(r.role));
            });

            if (activeRole) {
                if (isCS(activeRole.role)) defaultCS = s.email;
                if (isSAS(activeRole.role)) defaultSAS = s.email;
            }
        }
    });

    const savedSup = slot.supervision || {};
    const currentCS = savedSup.cs || defaultCS;
    const currentSAS = savedSup.sas || defaultSAS;

    // --- POPULATE SEARCH INPUTS ---
    if (currentCS) {
        const s = staffData.find(st => st.email === currentCS);
        if (s) {
            document.getElementById('att-cs-search').value = s.name;
            document.getElementById('att-cs-email').value = s.email;
        }
    }
    if (currentSAS) {
        const s = staffData.find(st => st.email === currentSAS);
        if (s) {
            document.getElementById('att-sas-search').value = s.name;
            document.getElementById('att-sas-email').value = s.email;
        }
    }

    // --- 2. ATTENDANCE LIST ---
    let presentSet = new Set(slot.attendance || slot.assigned || []);

    // Auto-Mark CS/SAS as Present
    if (currentCS && !presentSet.has(currentCS)) presentSet.add(currentCS);
    if (currentSAS && !presentSet.has(currentSAS)) presentSet.add(currentSAS);

    presentSet.forEach(email => {
        addAttendanceRow(email, isLocked);
    });

    // --- 3. LOCK STATE UI ---
    const addBtn = document.getElementById('btn-att-add');
    const saveBtn = document.getElementById('btn-att-save');
    const lockBtn = document.getElementById('btn-att-lock');
    const statusText = document.getElementById('att-lock-status');

    if (isLocked) {
        if (addBtn) { addBtn.disabled = true; addBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
            saveBtn.innerHTML = `<span>✅ Saved & Locked</span>`;
        }
        if (lockBtn) {
            lockBtn.innerHTML = `<span>🔓</span> Unlock Register`;
            lockBtn.className = "bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded shadow-sm hover:bg-red-100 font-bold text-sm flex items-center gap-2 transition";
            lockBtn.onclick = () => window.toggleAttendanceLock(key, false);
        }
        if (statusText) statusText.textContent = "Attendance is finalized and locked.";
    } else {
        if (addBtn) { addBtn.disabled = false; addBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
            saveBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Confirm & Update Counts`;
        }
        if (lockBtn) {
            lockBtn.innerHTML = `<span>🔒</span> Lock Register`;
            lockBtn.className = "bg-gray-100 text-gray-600 border border-gray-300 px-4 py-2 rounded shadow-sm hover:bg-gray-200 font-bold text-sm flex items-center gap-2 transition";
            lockBtn.onclick = () => window.toggleAttendanceLock(key, true);
        }
        if (statusText) statusText.textContent = "Editing allowed.";
    }

    updateAttCount();
}

function addAttendanceRow(email, isLocked) {
    const s = staffData.find(st => st.email === email);
    if (!s) return;

    const div = document.createElement('div');
    // Responsive Layout: Column on Mobile (Card), Row on Desktop
    div.className = `group flex flex-col md:flex-row justify-between items-start md:items-center p-3 rounded-lg border shadow-sm transition mb-2 gap-2 md:gap-4 ${isLocked ? 'border-green-200 bg-green-50' : 'glass-card bg-white/70 backdrop-blur border-white/40'}`;

    // Checkbox State
    const chkState = isLocked ? "disabled" : "onchange='window.updateAttCount()'";

    // Render Action Button (Full width on mobile, Auto on desktop)
    let actionHtml = "";
    if (!isLocked) {
        actionHtml = `
            <div class="w-full md:w-auto pt-2 md:pt-0 border-t md:border-0 border-gray-100 md:border-transparent">
                <button class="text-xs font-bold px-3 py-1.5 rounded border transition w-full md:w-auto text-center flex items-center justify-center gap-1 bg-white text-red-600 border-red-200 hover:bg-red-50 cursor-pointer" 
                    onclick="this.closest('.group').remove(); window.updateAttCount();">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    Remove
                </button>
            </div>
        `;
    }

    div.innerHTML = `
        <div class="flex items-center gap-3 w-full md:w-auto">
            <input type="checkbox" class="att-chk w-5 h-5 text-green-600 rounded focus:ring-green-500 shrink-0" value="${email}" checked ${chkState}>
            <div class="min-w-0 flex-1">
                <div class="font-bold text-gray-800 text-sm truncate">${s.name}</div>
                <div class="text-xs text-gray-500 truncate">${s.dept}</div>
            </div>
        </div>
        ${actionHtml}
    `;
    ui.attList.appendChild(div);
}

window.addSubstituteToAttendance = function () {
    // Check if a user was selected from search
    if (!currentSubstituteCandidate) {
        return alert("Please search and select a faculty member first.");
    }

    const email = currentSubstituteCandidate.email;

    // Check duplicates
    const existing = Array.from(document.querySelectorAll('.att-chk')).map(c => c.value);
    if (existing.includes(email)) {
        return alert("This person is already in the attendance list.");
    }

    addAttendanceRow(email);

    // Reset Search
    const searchInput = document.getElementById('att-substitute-search');
    if (searchInput) searchInput.value = "";
    currentSubstituteCandidate = null;

    updateAttCount();
}

window.updateAttCount = function () {
    const count = document.querySelectorAll('.att-chk:checked').length;
    document.getElementById('att-count-display').textContent = `${count} Present`;
}
window.saveAttendance = async function () {
    const key = ui.attSessionSelect.value;
    if (!key) return;

    // GET VALUES FROM HIDDEN INPUTS
    const csVal = document.getElementById('att-cs-email').value;
    const sasVal = document.getElementById('att-sas-email').value;

    // Validate
    if (!csVal || !sasVal) {
        alert("⚠️ Mandatory Fields Missing\n\nPlease search and select both a Chief Superintendent (CS) and a Senior Assistant Superintendent (SAS).");
        return;
    }

    if (!confirm(`Confirm attendance for ${key}?\n\nThis will update the 'Duties Done' count for all checked staff.`)) return;

    const presentEmails = Array.from(document.querySelectorAll('.att-chk:checked')).map(c => c.value);

    // Update Cloud Data
    invigilationSlots[key].attendance = presentEmails;
    invigilationSlots[key].supervision = { cs: csVal, sas: sasVal };

    // LOGGING
    logActivity("Attendance Marked", `Marked ${presentEmails.length} staff present for ${key}. CS: ${getNameFromEmail(csVal)}, SAS: ${getNameFromEmail(sasVal)}`);

    await syncSlotsToCloud();

    populateAttendanceSessions();
    renderStaffTable();
    alert("Attendance & Supervision Saved!");
}

window.toggleAttendanceLock = async function (key, lockState) {
    if (lockState && !confirm("Lock this attendance register? \n\nNo further changes will be allowed unless you unlock it.")) return;

    if (!invigilationSlots[key]) return;

    // Save state
    invigilationSlots[key].attendanceLocked = lockState;
    logActivity("Attendance Register Lock", `Admin ${lockState ? 'LOCKED' : 'UNLOCKED'} attendance for ${key}.`);
    // If locking, ensure we save the current list too, just in case
    if (lockState) {
        const presentEmails = Array.from(document.querySelectorAll('.att-chk:checked')).map(c => c.value);
        invigilationSlots[key].attendance = presentEmails;
    }

    await syncSlotsToCloud();
    loadSessionAttendance(); // Refresh UI
}

// 3. Updated Volunteer (Handles Picking Up Exchange)
async function volunteer(key, email) {
    const slot = invigilationSlots[key];
    // 1. NEW CHECK: Admin Lock
    if (slot.isAdminLocked) {
        return alert("🚫 Posting Locked! This slot is reserved for manual assignment by the Admin.");
    }
    
    // 2. Standard Lock
    if (slot.isLocked) {
        return alert("🚫 Slot Locked! Contact Admin.");
    }
    
    const [datePart] = key.split(' | ');

    // Check conflicts
    const sameDaySessions = Object.keys(invigilationSlots).filter(k => k.startsWith(datePart) && k !== key);
    const conflict = sameDaySessions.some(k => invigilationSlots[k].assigned.includes(email));
    if (conflict && !confirm("🦸‍♂️ SUPERHERO ALERT! 🦸‍♀️\n\nYou are already on duty that day. Taking a double shift?\n\nWe appreciate your dedication! Click OK to confirm.")) return;

    // CHECK IF TAKING AN EXCHANGE
    if (slot.exchangeRequests && slot.exchangeRequests.length > 0) {
        // Pick the first person offering
        const originalOwner = slot.exchangeRequests[0];

        if (confirm(`Accept duty exchange from ${getNameFromEmail(originalOwner)}?`)) {
            // Remove Original
            slot.assigned = slot.assigned.filter(e => e !== originalOwner);
            slot.exchangeRequests = slot.exchangeRequests.filter(e => e !== originalOwner);

            // Update Original Owner Stats
            const ownerObj = staffData.find(s => s.email === originalOwner);
            if (ownerObj && ownerObj.dutiesAssigned > 0) ownerObj.dutiesAssigned--;

            // Add New (You)
            slot.assigned.push(email);
            const me = staffData.find(s => s.email === email);
            if (me) me.dutiesAssigned = (me.dutiesAssigned || 0) + 1;

            await syncSlotsToCloud();
            await syncStaffToCloud();
            window.closeModal('day-detail-modal');
            renderStaffCalendar(email);
            return;
        } else {
            return; // Cancelled
        }
    }

    // Standard Volunteer Logic
    if (!confirm("Confirm duty?")) return;
    slot.assigned.push(email);
    const me = staffData.find(s => s.email === email);
    if (me) me.dutiesAssigned = (me.dutiesAssigned || 0) + 1;

    await syncSlotsToCloud();
    await syncStaffToCloud();
    window.closeModal('day-detail-modal');
}
async function acceptExchange(key, buyerEmail, sellerEmail) {
    const slot = invigilationSlots[key];
    const sellerName = getNameFromEmail(sellerEmail);

    // --- NEW: ADMIN LOCK CHECK ---
    if (slot.isAdminLocked) {
        return alert("🛡️ Market Suspended.\n\nThe Admin has locked this slot for manual assignment. Exchanges cannot be processed right now.");
    }
    // -----------------------------

    if (!confirm(`Are you sure you want to take over ${sellerName}'s duty on ${key}?`)) return;

    // 1. Validation
    if (!slot.assigned.includes(sellerEmail)) {
        alert("This user is no longer assigned to this slot.");
        renderExchangeMarket(buyerEmail);
        return;
    }

    // 2. Perform Swap
    slot.assigned = slot.assigned.filter(e => e !== sellerEmail);
    slot.exchangeRequests = slot.exchangeRequests.filter(e => e !== sellerEmail);
    slot.assigned.push(buyerEmail);

    // 3. Update Stats
    const seller = staffData.find(s => s.email === sellerEmail);
    const buyer = staffData.find(s => s.email === buyerEmail);

    if (seller && seller.dutiesAssigned > 0) seller.dutiesAssigned--;
    if (buyer) buyer.dutiesAssigned = (buyer.dutiesAssigned || 0) + 1;

    // 4. LOGGING
    logActivity("Exchange Accepted", `${getNameFromEmail(buyerEmail)} took duty ${key} from ${getNameFromEmail(sellerEmail)}.`);

    // --- NOTIFICATION EMAIL TO SELLER ---
    if (seller && seller.email && googleScriptUrl) {
        const subject = `Duty Exchange Accepted: ${key}`;
        const body = `
            <p>Dear ${seller.name},</p>
            <p>Good news! Your request to exchange the invigilation duty for <b>${key}</b> has been accepted by <b>${buyer.name}</b>.</p>
            <p>You have been removed from this duty assignment.</p>
            <hr>
            <p style="font-size:12px; color:#666;">Exam Cell Notification</p>
        `;

        fetch(googleScriptUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: seller.email, subject: subject, body: body })
        }).catch(e => console.error("Email failed", e));
    }

    // 5. Sync
    await syncSlotsToCloud();
    await syncStaffToCloud();

    alert(`Success! You have accepted the duty from ${sellerName}.`);
    
    window.closeModal('day-detail-modal');
    renderStaffCalendar(buyerEmail);
    renderExchangeMarket(buyerEmail);
    initStaffDashboard(buyer);
}

window.postForExchange = async function (key, email) {
    const slot = invigilationSlots[key];
    
    // 1. ADMIN LOCK CHECK
    if (slot.isAdminLocked) {
        return alert("🛡️ Action Denied.\n\nThe Admin is currently finalizing assignments for this slot. New exchange requests are disabled.");
    }

    // 2. STANDARD LOCK CHECK (Must be locked to exchange)
    if (!slot.isLocked) {
        alert("⚠️ Action Denied.\n\nThis slot is currently OPEN (Unlocked). Use 'Cancel Duty' if you cannot attend.");
        return;
    }

    if (!confirm("Post this duty for exchange?\n\nNOTE: You remain responsible until someone else accepts it.")) return;

    if (!slot.exchangeRequests) slot.exchangeRequests = [];

    if (!slot.exchangeRequests.includes(email)) {
        slot.exchangeRequests.push(email);
        logActivity("Exchange Posted", `${getNameFromEmail(email)} posted ${key} for exchange.`);
        
        try {
            renderStaffCalendar(email);
            if (typeof renderExchangeMarket === "function") renderExchangeMarket(email);
            if (typeof renderStaffUpcomingSummary === "function") renderStaffUpcomingSummary(email);
            window.closeModal('day-detail-modal');
        } catch (e) { }

        await syncSlotsToCloud();
    }
}
window.withdrawExchange = async function (key, email) {
    const slot = invigilationSlots[key];

    // --- NEW: ADMIN LOCK CHECK ---
    // Freezes the market state. Users cannot enter OR leave the market.
    if (slot.isAdminLocked) {
        return alert("🛡️ Action Denied.\n\nThe Admin is currently finalizing assignments for this slot. Withdrawal is disabled to prevent roster changes.");
    }
    // -----------------------------

    // 1. CONFIRMATION CHECK
    if (!confirm("Are you sure you want to withdraw this request and keep the duty?")) return;

    if (slot.exchangeRequests) {
        // 2. Update Local Data
        slot.exchangeRequests = slot.exchangeRequests.filter(e => e !== email);

        // 3. LOGGING
        logActivity("Exchange Withdrawn", `${getNameFromEmail(email)} withdrew request for ${key}.`);

        // 4. IMMEDIATE UI UPDATES
        try {
            renderStaffCalendar(email);
            if (typeof renderExchangeMarket === "function") renderExchangeMarket(email);
            window.closeModal('day-detail-modal');
        } catch (e) { console.error("UI Update Error:", e); }

        // 5. Save to Cloud
        await syncSlotsToCloud();
    }
}

// --- EXPOSE DUTY FUNCTIONS TO WINDOW FOR HTML ONCLICK ---
window.volunteer = volunteer;
window.acceptExchange = acceptExchange;
window.postForExchange = postForExchange;
window.withdrawExchange = withdrawExchange;

// --- DEPARTMENT MANAGEMENT FUNCTIONS ---

function populateDepartmentSelect() {
    const select = document.getElementById('stf-dept');
    if (!select) return;

    // Convert & Sort
    const cleanDepts = departmentsConfig.map(d => (typeof d === 'string') ? { name: d, email: "" } : d);
    cleanDepts.sort((a, b) => a.name.localeCompare(b.name));

    select.innerHTML = `<option value="">Select Department...</option>` +
        cleanDepts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
}

function renderDepartmentsList() {
    const container = document.getElementById('dept-list-container');
    if (!container) return;

    container.innerHTML = '';

    // Handle legacy string data (convert to object on fly if needed)
    const cleanDepts = departmentsConfig.map(d => (typeof d === 'string') ? { name: d, email: "" } : d);

    cleanDepts.sort((a, b) => a.name.localeCompare(b.name));

    cleanDepts.forEach(dept => {
        // If Locked: Hide 'x' button
        const deleteBtn = isDeptLocked ? '' :
            `<button onclick="deleteDepartment('${dept.name}')" class="text-red-400 hover:text-red-600 font-bold ml-1 hover:bg-red-50 rounded px-1">&times;</button>`;

        const emailBadge = dept.email ? `<span class="text-[9px] text-gray-400 ml-1">&lt;${dept.email}&gt;</span>` : "";

        container.innerHTML += `
            <div class="flex items-center gap-1 bg-white px-2 py-1 rounded text-xs border border-gray-200 shadow-sm" title="${dept.email || 'No Email'}">
                <span class="font-bold text-gray-700">${dept.name}</span>
                ${emailBadge}
                ${deleteBtn}
            </div>`;
    });
}

window.addNewDepartment = function () {
    const nameInput = document.getElementById('new-dept-name');
    const emailInput = document.getElementById('new-dept-email');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name) return alert("Enter department name");

    // Convert legacy strings if present
    departmentsConfig = departmentsConfig.map(d => (typeof d === 'string') ? { name: d, email: "" } : d);

    if (departmentsConfig.some(d => d.name.toLowerCase() === name.toLowerCase())) {
        return alert("Department already exists");
    }

    departmentsConfig.push({ name: name, email: email });
    logActivity("Department Added", `Admin added new department: ${name}.`);
    renderDepartmentsList();

    nameInput.value = '';
    emailInput.value = '';
}

window.deleteDepartment = function (name) {
    if (confirm(`Delete department "${name}"?`)) {
        departmentsConfig = departmentsConfig.map(d => (typeof d === 'string') ? { name: d, email: "" } : d);
        departmentsConfig = departmentsConfig.filter(d => d.name !== name);
        logActivity("Department Deleted", `Admin deleted department: ${name}.`);
        renderDepartmentsList();
    }
}
window.toggleRoleLock = function () {
    isRoleLocked = !isRoleLocked;
    renderRolesList(); // Re-render list
    toggleInputVisibility('role-input-row', isRoleLocked); // Hide/Show Inputs
    updateLockIcon('role-lock-btn', isRoleLocked); // Update Icon
}

window.toggleDeptLock = function () {
    isDeptLocked = !isDeptLocked;
    renderDepartmentsList();
    toggleInputVisibility('dept-input-row', isDeptLocked);
    updateLockIcon('dept-lock-btn', isDeptLocked);
}

function toggleInputVisibility(id, isLocked) {
    const el = document.getElementById(id);
    if (el) isLocked ? el.classList.add('hidden') : el.classList.remove('hidden');
}

function updateLockIcon(btnId, isLocked) {
    const btn = document.getElementById(btnId);
    if (btn) btn.textContent = isLocked ? "🔒 Locked" : "🔓 Editing";
    if (btn) btn.className = isLocked
        ? "text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-200 transition"
        : "text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200 hover:bg-red-100 transition font-bold";
}
window.toggleWeekLock = async function (monthStr, weekNum, lockState) {
    if (!confirm(`${lockState ? '🔒 Lock' : '🔓 Unlock'} all slots in ${monthStr} - Week ${weekNum}?`)) return;

    let changed = false;
    Object.keys(invigilationSlots).forEach(key => {
        const date = parseDate(key);
        const mStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const wNum = getWeekOfMonth(date);

        // Check if slot belongs to the target Week & Month
        if (mStr === monthStr && wNum === weekNum) {
            // Only update if state is different
            if (invigilationSlots[key].isLocked !== lockState) {
                invigilationSlots[key].isLocked = lockState;
                changed = true;
            }
        }
    });

    if (changed) {
        logActivity("Weekly Lock Toggle", `Admin ${lockState ? 'LOCKED' : 'UNLOCKED'} all slots for ${monthStr} Week ${weekNum}.`);
        await syncSlotsToCloud();
        renderSlotsGridAdmin();
        alert(`Week ${weekNum} has been ${lockState ? 'LOCKED' : 'UNLOCKED'}.`);
    } else {
        alert("No slots needed updating in this week.");
    }
}
window.printSessionReport = function (key) {
    const slot = invigilationSlots[key];
    if (!slot) return alert("Error: Slot not found.");

    const [datePart, timePart] = key.split(' | ');
    const collegeName = collegeData.examCollegeName || "College Name";
    const sessionName = (timePart.includes("AM") || timePart.startsWith("09") || timePart.startsWith("10")) ? "FORENOON SESSION" : "AFTERNOON SESSION";

    // 1. Exam Name
    let examName = slot.examName;
    if (!examName && typeof window.getExamName === "function") {
        examName = window.getExamName(datePart, timePart, "Regular");
    }
    if (!examName) examName = "University Examinations";

    // 2. CALCULATE ROWS (The 1:1 Math)
    // Candidates need 1:30, Scribes need 1:1
    const scribes = slot.scribeCount || 0;
    const totalStudents = slot.studentCount || 0;
    const regularStudents = Math.max(0, totalStudents - scribes);

    const regularInvigs = Math.ceil(regularStudents / 30);
    const scribeInvigs = scribes; // 1:1 Ratio
    const theoreticalNeed = regularInvigs + scribeInvigs;

    // Ensure we have enough rows for:
    // A. Already assigned staff
    // B. The theoretical 1:1 requirement
    // C. Minimum of 20 (for standard A4)
    const totalRowsToPrint = Math.max(slot.assigned.length + 3, theoreticalNeed + 2, 20);

    // 3. Generate Rows
    let rowsHtml = "";

    // A. Assigned Staff
    slot.assigned.forEach((email, index) => {
        const staff = staffData.find(s => s.email === email) || { name: getNameFromEmail(email), dept: "" };
        rowsHtml += `
            <tr>
                <td style="text-align:center;">${index + 1}</td>
                <td>${staff.name}</td>
                <td>${staff.dept}</td>
                <td></td> <td></td> <td></td> <td></td> <td></td> <td></td>
            </tr>
        `;
    });

    // B. Blank Rows
    for (let i = slot.assigned.length; i < totalRowsToPrint; i++) {
        rowsHtml += `
            <tr>
                <td style="text-align:center;">${i + 1}</td>
                <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td>
            </tr>
        `;
    }

    // 4. Print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Invigilation Report - ${datePart}</title>
            <style>
                @page { size: A4 portrait; margin: 15mm; }
                body { font-family: 'Times New Roman', serif; margin: 0; padding: 0; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; }
                .header h2 { margin: 5px 0; font-size: 14px; font-weight: bold; }
                .meta { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 15px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid black; padding: 8px 4px; }
                th { background-color: #f0f0f0; }
                .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 14px; }
                .footer div { text-align: center; width: 40%; border-top: 1px solid black; padding-top: 5px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${collegeName}</h1>
                <h2>Invigilation Duty List</h2>
                <h2 style="text-transform: uppercase; margin-top:5px;">${examName}</h2>
            </div>
            
            <div class="meta">
                <span>Date: ${datePart}</span>
                <span>Session: ${sessionName} (${timePart})</span>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 30px;">Sl</th>
                        <th style="width: 150px;">Name of Invigilator</th>
                        <th style="width: 80px;">Dept</th>
                        <th style="width: 50px;">RNBB</th>
                        <th style="width: 50px;">Asgd<br>Script</th>
                        <th style="width: 50px;">Used<br>Script</th>
                        <th style="width: 50px;">Retd<br>Script</th>
                        <th>Remarks</th>
                        <th style="width: 80px;"></th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div class="footer">
                <div>Senior Assistant Superintendent</div>
                <div>Chief Superintendent</div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}




function renderAdminTodayStats() {
    const container = document.getElementById('admin-today-container');
    if (!container) return;

    // 1. Calculate Dates
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayStr = `${dd}.${mm}.${yyyy}`;

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const ddT = String(tomorrow.getDate()).padStart(2, '0');
    const mmT = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const yyyyT = tomorrow.getFullYear();
    const tomorrowStr = `${ddT}.${mmT}.${yyyyT}`;

    // 2. Find Sessions
    const todaySessions = Object.keys(invigilationSlots).filter(k => k.startsWith(todayStr));
    const tomorrowSessions = Object.keys(invigilationSlots).filter(k => k.startsWith(tomorrowStr));

    // 3. Hide if empty
    if (todaySessions.length === 0 && tomorrowSessions.length === 0) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    container.classList.remove('hidden');
    container.innerHTML = '';

    // --- PART 1: TODAY'S EXAMS (View & Bulk SMS) ---
    if (todaySessions.length > 0) {
        todaySessions.sort();
        let buttonsHtml = '';
        todaySessions.forEach(key => {
            const timePart = key.split(' | ')[1];

            // Grouped Container for Time + Buttons
            buttonsHtml += `
                <div class="flex items-center gap-2 bg-white/10 p-1.5 rounded-lg border border-white/20 w-full sm:w-auto justify-between sm:justify-start">
                    <span class="text-white text-xs font-bold mr-1 ml-1 whitespace-nowrap">${timePart}</span>
                    
                    <div class="flex gap-2">
                        <button onclick="openDashboardInvigModal('${key}')" class="bg-white text-indigo-700 hover:bg-indigo-50 font-bold py-1.5 px-3 rounded shadow-sm text-xs flex items-center gap-1 transition" title="View Staff List">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            View
                        </button>
                        
                        <button onclick="sendSessionSMS('${key}')" class="bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 px-3 rounded shadow-sm text-xs flex items-center gap-1 transition" title="Send Bulk SMS">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            SMS
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML += `
            <div class="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg shadow-md p-4 text-white mb-4">
                <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div class="flex items-center gap-3">
                        <div class="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        </div>
                        <div>
                            <h2 class="text-lg font-bold leading-tight">Exams Today (${todayStr})</h2>
                            <p class="text-indigo-100 text-xs font-medium">${todaySessions.length} Session(s) Active</p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 justify-center md:justify-end w-full md:w-auto">
                        ${buttonsHtml}
                    </div>
                </div>
            </div>
        `;
    }

    // --- PART 2: TOMORROW'S EXAMS (Unchanged) ---
    if (tomorrowSessions.length > 0) {
        tomorrowSessions.sort();
        let buttonsHtml = '';
        tomorrowSessions.forEach(key => {
            const timePart = key.split(' | ')[1];
            buttonsHtml += `
                <div class="flex items-center gap-2 bg-white/10 p-2 rounded-lg border border-white/20">
                    <span class="text-white text-sm font-bold mr-1">${timePart}</span>
                    <button onclick="openSlotReminderModal('${key}')" class="bg-white text-orange-700 hover:bg-orange-50 font-bold py-1.5 px-3 rounded shadow-sm text-xs flex items-center gap-1 transition">Notify</button>
                    <button onclick="printDutyNotification('${key}')" class="bg-blue-600 text-white hover:bg-blue-700 font-bold py-1.5 px-3 rounded shadow-sm text-xs flex items-center gap-1 transition">PDF</button>
                </div>
            `;
        });

        container.innerHTML += `
            <div class="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-md p-4 text-white">
                <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div class="flex items-center gap-3">
                        <div class="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <h2 class="text-lg font-bold leading-tight">Exams Tomorrow</h2>
                             <p class="text-orange-100 text-xs font-medium">${tomorrowSessions.length} Session(s) Scheduled</p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 justify-center md:justify-end">
                        ${buttonsHtml}
                    </div>
                </div>
            </div>
        `;
    }
}



// Updated: Show Completed Duties Modal (AY Filtered + Neat UI + Admin-Only WhatsApp Share)
window.openCompletedDutiesModal = function (email) {
    const list = document.getElementById('completed-duties-list');
    if (!list) return;

    list.innerHTML = '';
    const history = [];
    const acYear = getCurrentAcademicYear();
    const staffName = getNameFromEmail(email);

    // Update Modal Header with Name & AY
    const headerTitle = document.querySelector('#completed-duties-modal h3');
    const headerSub = document.querySelector('#completed-duties-modal p');
    if (headerTitle) headerTitle.innerHTML = `Duty History: <span class="text-indigo-700">${staffName}</span>`;
    if (headerSub) headerSub.textContent = `Verified Records for AY ${acYear.label}`;

    // 1. Scan for completed duties in current AY
    Object.keys(invigilationSlots).forEach(key => {
        const slot = invigilationSlots[key];
        const dateObj = parseDate(key);

        // Filter by Academic Year
        if (dateObj < acYear.start || dateObj > acYear.end) return;

        if (slot.attendance && slot.attendance.includes(email)) {
            // Determine Role
            let role = "Invigilator";
            if (slot.supervision) {
                if (slot.supervision.cs === email) role = "Chief Supt.";
                else if (slot.supervision.sas === email) role = "Senior Asst.";
            }
            history.push({ key, role, dateObj });
        }
    });

    // 2. Sort (Newest First)
    history.sort((a, b) => b.dateObj - a.dateObj);

    // 3. Render Neat List
    if (history.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p class="text-gray-400 text-xs italic">No duties completed in this Academic Year.</p>
            </div>`;
    } else {
        history.forEach(item => {
            const [date, time] = item.key.split(' | ');
            const isSup = item.role !== "Invigilator";

            const itemHtml = `
                <div class="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition shadow-sm mb-2">
                    <div class="flex items-center gap-3">
                        <div class="flex flex-col items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
                            <span class="text-[10px] font-bold uppercase leading-none">${item.dateObj.toLocaleString('default', { month: 'short' })}</span>
                            <span class="text-sm font-black leading-none">${item.dateObj.getDate()}</span>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-gray-800">${date}</div>
                            <div class="text-[10px] text-gray-500">${time}</div>
                        </div>
                    </div>
                    
                    <span class="text-[9px] font-bold uppercase px-2 py-1 rounded-full border ${isSup ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-green-100 text-green-700 border-green-200'}">
                        ${item.role}
                    </span>
                </div>`;

            list.innerHTML += itemHtml;
        });
    }

    // --- 4. NEW: INJECT WHATSAPP SHARE BUTTON (ADMIN ONLY) ---
    const footer = document.querySelector('#completed-duties-modal .text-right');
    
    if (footer) {
        let waBtn = '';
        
        // CHECK isAdmin HERE
        if (history.length > 0 && typeof isAdmin !== 'undefined' && isAdmin) {
            // Find staff phone
            const staff = staffData.find(s => s.email === email);
            const phone = staff && staff.phone ? staff.phone.replace(/\D/g, '') : "";
            const validPhone = phone.length >= 10 ? (phone.length === 10 ? "91" + phone : phone) : "";
            
            // Build Message
            let msg = `*Duty History: ${staffName}*\nAY: ${acYear.label}\n----------------\n`;

            history.forEach((h, i) => {
                const [dStr, tStr] = h.key.split(' | ');
                const [d, m, y] = dStr.split('.'); // Get full date components
                const shortYear = y.slice(-2);     // Extract last 2 digits (e.g., 2025 -> 25)
                
                const isAN = (tStr.includes("PM") || tStr.startsWith("12"));
                const sess = isAN ? "AN" : "FN";
                
                // Format: DD.MM.YY
                msg += `${i+1}. ${d}.${m}.${shortYear} (${sess}) - ${h.role}\n`;
            });



            
            msg += `----------------\n*Total: ${history.length}*`;
            
            const link = validPhone ? `https://wa.me/${validPhone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
            
            waBtn = `
                <a href="${link}" target="_blank" class="inline-flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded transition shadow-sm mr-2 no-underline">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    WhatsApp
                </a>`;
        }
        
        // Update Footer HTML
        footer.innerHTML = `
            ${waBtn}
            <button onclick="closeModal('completed-duties-modal')" class="text-sm text-gray-500 hover:underline">Close</button>
        `;
    }

    window.openModal('completed-duties-modal');
}








window.runWeeklyAutoAssign = async function (monthStr, weekNum) {
    // 1. CHECK: Confirm Intent
    if (!confirm(`⚡ Run Auto-Assignment for ${monthStr}, Week ${weekNum}?\n\nIMPORTANT: This will only fill slots with ADMIN LOCK (🛡️).\n\nRules Applied:\n1. Max 3 duties/week\n2. Avoid Same Day & Adjacent Days\n3. Dept Cap: Max 50% (Soft Limit)`)) return;

    // 2. Identify Target Slots (MUST BE ADMIN LOCKED)
    const targetSlots = [];
    Object.keys(invigilationSlots).forEach(key => {
        const date = parseDate(key);
        const mStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const wNum = getWeekOfMonth(date);
        const slot = invigilationSlots[key];

        // Check for isAdminLocked
        if (mStr === monthStr && wNum === weekNum && slot.isAdminLocked) {
            targetSlots.push({ key, date, slot });
        }
    });

    if (targetSlots.length === 0) {
        return alert(`⚠️ No ADMIN LOCKED (🛡️) slots found in Week ${weekNum}.\n\nPlease lock the week using the '🛡️ Admin' button first.`);
    }

    // 3. Sort Slots Chronologically
    targetSlots.sort((a, b) => a.date - b.date);

    // 4. Prepare Staff Stats
    const deptCounts = {};
    const singleFacultyDepts = new Set();

    // First Pass: Count Depts
    staffData.forEach(s => {
        if (s.status !== 'archived') {
            deptCounts[s.dept] = (deptCounts[s.dept] || 0) + 1;
        }
    });

    Object.keys(deptCounts).forEach(d => {
        if (deptCounts[d] === 1) singleFacultyDepts.add(d);
    });

    let eligibleStaff = staffData.map(s => ({
        ...s,
        pending: calculateStaffTarget(s) - getDutiesDoneCount(s.email),
        weeklyLoad: {}
    }));

    // Pre-fill existing assignment load
    Object.keys(invigilationSlots).forEach(k => {
        const d = parseDate(k);
        const mStr = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        const wNum = getWeekOfMonth(d);
        const weekKey = `${mStr}-${wNum}`;

        invigilationSlots[k].assigned.forEach(email => {
            const s = eligibleStaff.find(st => st.email === email);
            if (s) {
                if (!s.weeklyLoad[weekKey]) s.weeklyLoad[weekKey] = 0;
                s.weeklyLoad[weekKey]++;
            }
        });
    });

    let assignedCount = 0;
    const logEntries = [];
    const timestamp = new Date().toLocaleString('en-GB');

    // 5. Process Each Slot
    for (const target of targetSlots) {
        const { key, date, slot } = target;

        // TARGET: Fill to Required (Already includes 10% reserve)
        const targetCount = slot.required;
        const needed = targetCount - slot.assigned.length;

        if (needed <= 0) continue;

        const currentWeekKey = `${date.toLocaleString('default', { month: 'long', year: 'numeric' })}-${getWeekOfMonth(date)}`;

        // Contexts
        const prevDate = new Date(date); prevDate.setDate(date.getDate() - 1);
        const nextDate = new Date(date); nextDate.setDate(date.getDate() + 1);

        const slotDeptCounts = {};
        slot.assigned.forEach(email => {
            const s = staffData.find(st => st.email === email);
            if (s && s.dept) slotDeptCounts[s.dept] = (slotDeptCounts[s.dept] || 0) + 1;
        });

        // Loop 'needed' times to fill
        for (let i = 0; i < needed; i++) {
            const candidates = eligibleStaff.map(s => {
                // Hard Constraints (Must Fail)
                if (s.status === 'archived') return null;
                if (slot.assigned.includes(s.email)) return null;
                if (isUserUnavailable(slot, s.email, key)) return null;

                let score = s.pending * 100;
                let warnings = [];

                // --- 1. Adjacent Day Rule ---
                let hasAdjacent = false;
                const prevDateStr = prevDate.toDateString();
                const nextDateStr = nextDate.toDateString();
                
                targetSlots.forEach(t => {
                   if ((t.date.toDateString() === prevDateStr || t.date.toDateString() === nextDateStr) && t.slot.assigned.includes(s.email)) {
                       hasAdjacent = true;
                   }
                });
                
                if (hasAdjacent) { 
                    score -= 1000; 
                    warnings.push("Adjacent"); 
                }

                // --- 2. Same Day Rule ---
                const sameDayKeys = targetSlots.filter(t => t.date.toDateString() === date.toDateString() && t.key !== key).map(t => t.key);
                if (sameDayKeys.some(sdk => invigilationSlots[sdk].assigned.includes(s.email))) { 
                    score -= 2000; 
                    warnings.push("Same Day"); 
                }

                // --- 3. Weekly Soft Limit ---
                const dutiesThisWeek = s.weeklyLoad[currentWeekKey] || 0;
                if (dutiesThisWeek >= 3) { 
                    score -= 5000; 
                    warnings.push("Max 3/wk"); 
                }

                // --- 4. Dept Saturation (Soft Penalty) ---
                const dTotal = deptCounts[s.dept] || 0;
                const isSingleFaculty = singleFacultyDepts.has(s.dept);
                
                if (!isSingleFaculty && dTotal > 1) {
                    const dAssigned = slotDeptCounts[s.dept] || 0;
                    const totalAssignedInSlot = slot.assigned.length + (i + 1);
                    const potentialRatio = (dAssigned + 1) / targetCount;
                    
                    if (potentialRatio > 0.5) {
                        score -= 4000; 
                        warnings.push("Dept Saturation");
                    }
                }
                
                // Add score penalty for unassigned staff (who have zero duties) if the pending count is already 0
                // This is a subtle tie-breaker to prevent over-assigning staff who hit their target (pending=0)
                if (s.pending <= 0) {
                     score -= 50;
                }
                
                // Final score rounding for cleaner logs
                score = Math.round(score);

                return { staff: s, score, warnings };
            }).filter(c => c !== null);

            // Sort: Highest Score First
            candidates.sort((a, b) => b.score - a.score);

            if (candidates.length > 0) {
                const choice = candidates[0];
                slot.assigned.push(choice.staff.email);
                
                // Update internal load tracking
                choice.staff.pending--;
                if (!choice.staff.weeklyLoad[currentWeekKey]) choice.staff.weeklyLoad[currentWeekKey] = 0;
                choice.staff.weeklyLoad[currentWeekKey]++;

                slotDeptCounts[choice.staff.dept] = (slotDeptCounts[choice.staff.dept] || 0) + 1;
                assignedCount++;

                // --- ENHANCED LOGGING ---
                const warningText = choice.warnings.length > 0 
                    ? `<span class="text-red-500 ml-1">(${choice.warnings.join(", ")})</span>` 
                    : '<span class="text-gray-400 ml-1">(No Breaches)</span>';

                let logEntry = `<div class="text-[10px] border-b border-gray-100/50 pb-1 mb-1">
                    <span class="text-green-700 font-bold">Assigned:</span> <b>${choice.staff.name}</b> 
                    <span class="text-gray-500">(Score: ${choice.score})</span> 
                    ${warningText}
                </div>`;
                
                if (!slot.allocationLog) slot.allocationLog = `<div class="mb-2 pb-2 border-b border-gray-200/50"><div class="font-bold text-gray-700 text-xs">Auto-Assign Run (${timestamp})</div></div>`;
                slot.allocationLog += logEntry;

                if (choice.warnings.length > 0) {
                    logEntries.push({ type: "WARN", msg: `Assigned ${choice.staff.name} to ${key}. Breached: ${choice.warnings.join(", ")}` });
                }
            } else {
                 // Log failure to fill slot
                 let logEntry = `<div class="text-[10px] border-b border-gray-100/50 pb-1 mb-1">
                    <span class="text-red-700 font-bold">Failed:</span> Could not find an eligible staff member for position ${slot.assigned.length + 1}.
                </div>`;
                if (!slot.allocationLog) slot.allocationLog = `<div class="mb-2 pb-2 border-b border-gray-200/50"><div class="font-bold text-gray-700 text-xs">Auto-Assign Run (${timestamp})</div></div>`;
                slot.allocationLog += logEntry;
            }
        }
    }

    // 6. Final Sync and Alerts
    if (logEntries.length > 0) {
        // (Existing cloud log update logic, assuming this uses Firebase/Firestore)
        // const logRef = doc(db, "colleges", currentCollegeId);
        // const newLogs = logEntries.map(e => `[${timestamp}] ${e.type}: ${e.msg}`);
        // try { await updateDoc(logRef, { autoAssignLogs: arrayUnion(...newLogs) }); } catch (e) { }
    }

    logActivity("Auto-Assign Week", `Run for ${monthStr} Week ${weekNum}. Filled ${assignedCount} slots.`);
    await syncSlotsToCloud();
    renderSlotsGridAdmin();

    // --- Bulk Reserve Notification Check (Unchanged) ---
    alert(`✅ Session Auto-Assign Complete!\nFilled ${assignedCount} positions.`);
}

window.viewAutoAssignLogs = async function () {
    const ref = doc(db, "colleges", currentCollegeId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        const logs = snap.data().autoAssignLogs || [];
        if (logs.length === 0) return alert("No logs found.");

        // Show in a simple modal or reuse 'inconvenience-modal'
        const list = document.getElementById('inconvenience-list');
        const title = document.getElementById('inconvenience-modal-subtitle');
        document.querySelector('#inconvenience-modal h3').textContent = "📜 Auto-Assign Logs";
        title.textContent = "History of automated decisions & overrides.";

        list.innerHTML = logs.reverse().map(l => {
            const isWarn = l.includes("WARN");
            const isErr = l.includes("ERROR");
            const color = isErr ? "text-red-600 bg-red-50" : (isWarn ? "text-orange-600 bg-orange-50" : "text-gray-600");
            return `<div class="text-xs p-2 border-b border-gray-100 ${color} font-mono">${l}</div>`;
        }).join('');

        window.openModal('inconvenience-modal');
    }
}
// --- OPTIMIZED ACTIVITY LOGGING (Sub-Collection Strategy) ---
async function logActivity(action, details) {
    if (!currentCollegeId) return;

    try {
        const userEmail = currentUser ? currentUser.email : "Unknown";
        const timestamp = new Date().toISOString();

        // Create a new document reference in the 'logs' sub-collection
        const logsColRef = collection(db, "colleges", currentCollegeId, "logs");
        
        // Write a new document (Infinite scaling, no 1MB limit)
        await setDoc(doc(logsColRef), {
            t: timestamp,
            u: userEmail,
            a: action,
            d: details
        });

    } catch (e) {
        console.error("Logging Error:", e);
        // Optional: Alert user if permission denied (helps debug "missing users")
        if (e.code === 'permission-denied') {
            console.warn("User not authorized to log activity.");
        }
    }
}


// --- UPDATED LIVE LOG VIEWER (Scalable Version) ---
let activityLogUnsubscribe = null;

window.viewActivityLogs = function () {
    const list = document.getElementById('inconvenience-list');
    const titleEl = document.querySelector('#inconvenience-modal h3');
    const subtitleEl = document.getElementById('inconvenience-modal-subtitle');

    // 1. Setup UI
    titleEl.textContent = "🕒 Live Activity Feed";
    subtitleEl.innerHTML = `
        <div class="flex gap-2 mt-2">
            <input type="text" id="act-search" placeholder="Search logs..." class="flex-1 p-2 border border-gray-300 rounded text-xs shadow-inner focus:outline-none focus:border-indigo-500">
            <div class="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 rounded border border-green-100">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                LIVE
            </div>
        </div>
    `;

    window.openModal('inconvenience-modal');
    list.innerHTML = '<div class="text-center py-6 text-gray-400 italic text-xs">Loading latest activities...</div>';

    // 2. Attach Search Listener
    const searchInput = document.getElementById('act-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterDisplayedLogs(e.target.value));
    }

    // 3. Start Listener (Query last 100 docs)
    if (activityLogUnsubscribe) activityLogUnsubscribe();

    const logsColRef = collection(db, "colleges", currentCollegeId, "logs");
    // This query is much faster and safer than downloading the whole file
    const q = query(logsColRef, orderBy("t", "desc"), limit(100)); 

    activityLogUnsubscribe = onSnapshot(q, (snapshot) => {
        const logs = [];
        snapshot.forEach(doc => {
            logs.push(doc.data());
        });
        
        // Cache data for search filtering
        window.cachedLogs = logs; 
        filterDisplayedLogs(""); // Render all initially
        
    }, (error) => {
        console.error("Log Read Error:", error);
        list.innerHTML = '<div class="text-center py-6 text-red-400 italic text-xs">Access Denied or Connection Lost.</div>';
    });
};

// Helper to render the logs (Paste this below viewActivityLogs)
function filterDisplayedLogs(query) {
    const list = document.getElementById('inconvenience-list');
    if (!list || !window.cachedLogs) return;

    const q = query.toLowerCase();
    const filtered = window.cachedLogs.filter(e =>
        (e.u && e.u.toLowerCase().includes(q)) ||
        (e.a && e.a.toLowerCase().includes(q)) ||
        (e.d && e.d.toLowerCase().includes(q))
    );

    if (filtered.length === 0) {
        list.innerHTML = '<div class="text-center py-6 text-gray-400 italic text-xs">No matching records found.</div>';
        return;
    }

    list.innerHTML = filtered.map(e => {
        const dateObj = new Date(e.t);
        const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        
        // Handle cases where email might be missing or short
        const userDisplay = e.u ? e.u.split('@')[0] : "Unknown";

        let borderClass = "border-l-4 border-gray-300";
        if (e.a.includes("Assigned")) borderClass = "border-l-4 border-green-500";
        if (e.a.includes("Removed") || e.a.includes("Cancelled")) borderClass = "border-l-4 border-red-500";
        if (e.a.includes("Unavailable")) borderClass = "border-l-4 border-orange-500";

        return `
            <div class="p-3 mb-2 rounded shadow-sm border border-gray-200 ${borderClass} bg-white text-xs">
                <div class="flex justify-between text-gray-500 mb-1">
                    <span class="font-bold text-gray-700">${userDisplay}</span>
                    <span class="font-mono text-[10px]">${dateStr} ${timeStr}</span>
                </div>
                <div class="font-bold text-gray-900">${e.a}</div>
                <div class="text-gray-600 mt-0.5">${e.d}</div>
            </div>
        `;
    }).join('');
}

// --- LISTENER FOR EXCHANGE SEARCH ---
const exchangeSearch = document.getElementById('exchange-search-input');
if (exchangeSearch) {
    exchangeSearch.addEventListener('input', () => {
        if (currentUser) renderExchangeMarket(currentUser.email);
    });
}

// ==========================================
// 📢 MESSAGING MENU (Selection Screen)
// ==========================================
window.openWeeklyNotificationModal = function (monthStr, weekNum) {
    const list = document.getElementById('notif-list-container');
    const title = document.getElementById('notif-modal-title');
    const subtitle = document.getElementById('notif-modal-subtitle');

    title.textContent = `📢 Notify Week ${weekNum} (${monthStr})`;
    subtitle.textContent = "Select category to proceed.";
    list.innerHTML = ''; 

    // Check for duties first
    let totalDuties = 0;
    Object.keys(invigilationSlots).forEach(key => {
        if (invigilationSlots[key].isHidden) return;
        const date = parseDate(key);
        const mStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const wNum = getWeekOfMonth(date);
        if (mStr === monthStr && wNum === weekNum) totalDuties++;
    });

    if (totalDuties === 0) {
        list.innerHTML = `<div class="text-center text-gray-400 py-12 italic">No duties found for this week.</div>`;
        window.openModal('notification-modal');
        return;
    }

    // Render Two Big Options
    list.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div onclick="triggerBulkStaffEmail('${monthStr}', ${weekNum})" 
                 class="group bg-white border border-gray-200 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 rounded-xl p-5 cursor-pointer transition-all shadow-sm">
                <div class="flex items-center gap-4 mb-3">
                    <div class="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        👮
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800 text-lg group-hover:text-indigo-700">Invigilators</h3>
                        <p class="text-xs text-gray-500">Individual Alerts (WhatsApp/Email)</p>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mb-4">Send personalized duty reminders to each faculty member.</p>
                <div class="text-right text-xs font-bold text-indigo-600 uppercase tracking-wide group-hover:underline">Open List &rarr;</div>
            </div>

            <div onclick="triggerBulkDeptEmail('${monthStr}', ${weekNum})" 
                 class="group bg-white border border-gray-200 hover:border-teal-500 hover:ring-1 hover:ring-teal-500 rounded-xl p-5 cursor-pointer transition-all shadow-sm">
                <div class="flex items-center gap-4 mb-3">
                    <div class="h-12 w-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        🏢
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800 text-lg group-hover:text-teal-700">Departments</h3>
                        <p class="text-xs text-gray-500">Consolidated Summaries</p>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mb-4">Send one email per department to HoDs with full list.</p>
                <div class="text-right text-xs font-bold text-teal-600 uppercase tracking-wide group-hover:underline">Open List &rarr;</div>
            </div>
        </div>
    `;

    window.openModal('notification-modal');
}

window.openSlotReminderModal = function (key) {
    const list = document.getElementById('notif-list-container');
    const title = document.getElementById('notif-modal-title');
    const subtitle = document.getElementById('notif-modal-subtitle');

    // ... (Keep existing Date/Slot logic) ...
    // Identify Date
    const [targetDateStr] = key.split(' | ');
    title.textContent = `🔔 Daily Reminder: ${targetDateStr}`;
    subtitle.textContent = "Send reminders for ALL duties on this day.";
    list.innerHTML = '';
    currentEmailQueue = [];

    // Find ALL Sessions for this Date
    const dailyDuties = {};
    Object.keys(invigilationSlots).forEach(slotKey => {
        if (slotKey.startsWith(targetDateStr)) {
            const slot = invigilationSlots[slotKey];
            const [d, t] = slotKey.split(' | ');
            const isAN = (t.includes("PM") || t.startsWith("12"));
            const sessionCode = isAN ? "AN" : "FN";
            slot.assigned.forEach(email => {
                if (!dailyDuties[email]) dailyDuties[email] = [];
                dailyDuties[email].push({ date: d, time: t, session: sessionCode });
            });
        }
    });

    if (Object.keys(dailyDuties).length === 0) return alert("No duties assigned for this date.");

    // ADD BULK BUTTONS (WITH CANCEL)
    list.innerHTML = `
        <div class="mb-4 pb-4 border-b border-gray-100 flex justify-between items-center">
            <div class="text-xs text-gray-500">Queue: <b>${Object.keys(dailyDuties).length}</b> faculty.</div>
            <div class="flex gap-2">
                <button id="btn-cancel-bulk" onclick="cancelBulkSending()" class="hidden bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-4 py-2 rounded shadow-sm hover:bg-red-200 transition flex items-center gap-2">
                    Stop / Cancel
                </button>
                <button id="btn-bulk-email-day" onclick="sendBulkEmails('btn-bulk-email-day')" 
                    class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded shadow-md transition flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    Send Bulk Emails
                </button>
            </div>
        </div>
    `;

    // ... (Rest of the loop logic is same as previous) ...
    // (Use the loop from the previous openSlotReminderModal)
    const sortedEmails = Object.keys(dailyDuties).sort((a, b) => getNameFromEmail(a).localeCompare(getNameFromEmail(b)));

    sortedEmails.forEach((email, index) => {
        const duties = dailyDuties[email];
        duties.sort((a, b) => a.time.localeCompare(b.time));

        const staff = staffData.find(s => s.email === email);
        const fullName = staff ? staff.name : email;
        const firstName = getFirstName(fullName);
        const staffEmail = staff ? staff.email : "";

        let phone = staff ? (staff.phone || "") : "";
        phone = phone.replace(/\D/g, '');
        if (phone.length === 10) phone = "91" + phone;

        const emailSubject = `Reminder: Exam Duty Tomorrow (${targetDateStr})`;
        const emailBody = generateProfessionalEmail(fullName, duties, "Invigilation Duty");
        const btnId = `email-btn-${index}`;

        if (staffEmail) {
            currentEmailQueue.push({ email: staffEmail, name: fullName, subject: emailSubject, body: emailBody, btnId: btnId });
        }

        // *** UPDATED: Generate detailed daily message ***
        // WhatsApp (Elaborate & Detailed)
        const sessionsStr = duties.map(d => d.session).join(' & ');
        const waMsg = generateDailyWhatsApp(fullName, targetDateStr, duties);
        const waLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}` : "#";

        // SMS (Shortest Possible)
        const smsMsg = generateDailySMS(firstName, targetDateStr, duties);
        const smsLink = phone ? `sms:${phone}?body=${encodeURIComponent(smsMsg)}` : "#";
        // *** NEW: Update Preview Box (Show 1st person's message) ***
        if (index === 0) {
            const previewEl = document.getElementById('notif-message-preview');
            if (previewEl) {
                previewEl.textContent = "--- WhatsApp Format ---\n" + waMsg + "\n\n--- SMS Format ---\n" + smsMsg;
            }
        }
        const shortDate = targetDateStr.slice(0, 5);


        const phoneDisabled = phone ? "" : "disabled";
        const emailDisabled = staffEmail ? "" : "disabled";
        const noEmailWarning = staffEmail ? "" : `<span class="text-red-500 text-xs ml-2">(No Email)</span>`;
        const safeName = fullName.replace(/'/g, "\\'");
        const safeSubject = emailSubject.replace(/'/g, "\\'");
        const safeBody = emailBody.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '');

        list.innerHTML += `
            <div class="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-lg shadow-sm hover:shadow-md transition mt-2">
                <div class="flex-1 min-w-0 pr-2">
                    <div class="font-bold text-gray-800 truncate">${fullName} ${noEmailWarning}</div>
                    <div class="text-xs text-gray-500 mt-1 font-bold text-indigo-600">Sessions: ${sessionsStr}</div>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button id="${btnId}" onclick="sendSingleEmail(this, '${staffEmail}', '${safeName}', '${safeSubject}', '${safeBody}')" ${emailDisabled} class="bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded shadow transition flex items-center gap-1">Mail</button>
                    <a href="${smsLink}" target="_blank" ${phoneDisabled} class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded shadow transition">SMS</a>
                    <a href="${waLink}" target="_blank" ${phoneDisabled} onclick="markAsSent(this)" class="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-2 rounded shadow transition">Remind</a>
                </div>
            </div>
        `;
    });

    window.openModal('notification-modal');
}


// --- MESSAGE GENERATORS ---

// --- MESSAGE GENERATORS (Split for SMS & WhatsApp) ---

// 1. Weekly WhatsApp (Safe Emojis)
function generateWeeklyWhatsApp(name, duties) {
    const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();

    let dutyList = "";
    duties.forEach(d => {
        const rTime = calculateReportTime(d.time);
        // Using 🗓️ (Calendar) and ➡️ (Arrow)
        dutyList += `\n🗓️ *${d.date}* (${d.day}) | ${d.session}\n   ➡️ Report by: *${rTime}*\n`;
    });

    return `⚠️ *${name}*: Invigilation Duty Update (${now})\n${dutyList}\n✅ *Instructions:* https://bit.ly/gvc-exam\n\n_Adjustments:_ http://www.gvc.ac.in/exam\n-Chief Supt.`;
}

// 2. Weekly SMS (Shortest)
function generateWeeklySMS(firstName, duties) {
    // Format: "John: Duties: 01.12(FN), 03.12(AN). Portal: gvc.ac.in/exam -CS"
   const shortList = duties.map(d => {
        const [dd, mm, yyyy] = d.date.split('.');
        const shortDate = `${dd}.${mm}.${yyyy.slice(-2)}`;
        return `${shortDate}(${d.session})`;
    }).join(', ');

    return `${firstName}: Duties: ${shortList}. Portal: gvc.ac.in/exam -CS`;
}

// --- HELPER: Generate Daily WhatsApp (Reminder) ---
window.generateDailyWhatsApp = function(name, dateStr, duties) {
    const college = (typeof currentCollegeName !== 'undefined' ? currentCollegeName : localStorage.getItem('examCollegeName')) || "Exam Cell";

    let dutyList = "";
    duties.forEach(d => {
        const rTime = calculateReportTime(d.time);
        dutyList += `\n▪️ *Session:* ${d.session} (${d.time})\n   🕒 *Report by:* ${rTime}\n`;
    });

    return `🔔 *DUTY REMINDER FOR TOMORROW* 🔔\n\n` +
           `Dear *${name}*,\n\n` +
           `This is a reminder regarding your invigilation duty scheduled for tomorrow, *${dateStr}*.\n\n` +
           `*Duty Details:*${dutyList}\n` +
           `🛑 *INSTRUCTIONS:*\n` +
           `1. Report to Chief Supdt office *30 mins before* exam.\n` +
           `2. Keep mobile phones in *silent mode*.\n\n` +
           `♻️ *Portal:* https://examflow-de08f.web.app/invigilation.html\n\n` +
           `Thank you,\n` +
           `*Chief Superintendent*\n${college}\n` + 
           `_Automated Alert_`;
};

// 4. Daily SMS (Shortest)
function generateDailySMS(firstName, dateStr, duties) {
    // Format: "John: Duty Tmrw 01.12 (FN). Report 9:00 AM. -CS"
    const [dd, mm, yyyy] = dateStr.split('.');
    const shortDate = `${dd}.${mm}.${yyyy.slice(-2)}`;
    const sessions = duties.map(d => d.session).join('&');
    const firstTime = calculateReportTime(duties[0].time);

    return `${firstName}: Duty Tmrw ${shortDate} (${sessions}). Report ${firstTime}. -CS`;
}

// --- HELPER: Time Calculation (Global) ---
window.calculateReportTime = function(timeStr) {
    try {
        let [time, mod] = timeStr.split(' ');
        let [h, m] = time.split(':');
        let date = new Date();
        
        let hour = parseInt(h);
        if (mod === 'PM' && hour !== 12) hour += 12;
        if (mod === 'AM' && hour === 12) hour = 0;
        
        date.setHours(hour);
        date.setMinutes(parseInt(m));

        // Subtract 30 mins
        date.setMinutes(date.getMinutes() - 30);

        // Format back
        let rh = date.getHours();
        let rm = date.getMinutes();
        let rMod = rh >= 12 ? 'PM' : 'AM';
        rh = rh % 12;
        rh = rh ? rh : 12; // 0 becomes 12
        
        return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')} ${rMod}`;
    } catch (e) { 
        return timeStr; // Fallback if parsing fails
    }
};
// --- UI Helper: Mark button as sent ---
window.markAsSent = function (btn) {
    btn.classList.remove('bg-blue-600', 'bg-orange-600', 'hover:bg-blue-700', 'hover:bg-orange-700');
    btn.classList.add('bg-green-600', 'hover:bg-green-700', 'cursor-default');
    btn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        Sent
    `;
    // Optional: Disable click after sending to prevent double-send? 
    // User might want to re-send if it failed, so we keep it clickable but green.
}
window.sendSessionSMS = function (key) {
    const slot = invigilationSlots[key];
    if (!slot || slot.assigned.length === 0) return alert("No staff assigned to this session.");

    // 1. Get Data
    const [dateStr, timeStr] = key.split(' | ');
    const reportTime = calculateReportTime(timeStr);

    // 2. Gather Phones (With Country Code)
    const phones = [];
    slot.assigned.forEach(email => {
        const s = staffData.find(st => st.email === email);
        if (s && s.phone) {
            let p = s.phone.replace(/\D/g, '');
            // Ensure 10 digit numbers get 91 prepended
            if (p.length === 10) p = `91${p}`;
            phones.push(p);
        }
    });

    if (phones.length === 0) return alert("No valid phone numbers found for assigned staff.");

    // 3. Create Short Message (Optimized for 1 SMS segment if possible)
    // Format: "Duty: DD.MM.YY HH:MM. Report: HH:MM. -CS GVC"
    const shortDate = dateStr.slice(0, 5); // DD.MM
    const msg = `Duty: ${dateStr} ${timeStr}. Report: ${reportTime}. -CS GVC`;

    // 4. Launch Native SMS App
    // Note: Most phones allow selecting SIM card when the app opens.
    // Android standard: comma separated numbers
    window.location.href = `sms:${phones.join(',')}?body=${encodeURIComponent(msg)}`;
}

// --- YEARLY ATTENDANCE CSV EXPORT (Updated Status) ---
window.downloadAttendanceCSV = function () {
    if (!confirm("Download the full attendance register for the current Academic Year?")) return;

    const acYear = getCurrentAcademicYear();
    const rows = [];

    // Header Row
    rows.push(['Date', 'Session', 'Exam Name', 'Faculty Name', 'Department', 'Designation', 'Duty Status', 'Phone']);

    // 1. Get Sorted Sessions
    const sortedKeys = Object.keys(invigilationSlots).sort((a, b) => {
        const dateA = parseDate(a);
        const dateB = parseDate(b);
        return dateA - dateB;
    });

    sortedKeys.forEach(key => {
        const slot = invigilationSlots[key];
        const dateObj = parseDate(key);

        // Filter by Academic Year
        if (dateObj < acYear.start || dateObj > acYear.end) return;

        // Only process if attendance is marked
        if (!slot.attendance || slot.attendance.length === 0) return;

        const [dateStr, timeStr] = key.split(' | ');
        const sessionType = (timeStr.includes("PM") || timeStr.startsWith("12")) ? "AN" : "FN";
        const examName = slot.examName || "University Examination";

        // Identify Supervision
        const csEmail = slot.supervision ? slot.supervision.cs : "";
        const sasEmail = slot.supervision ? slot.supervision.sas : "";

        slot.attendance.forEach(email => {
            const staff = staffData.find(s => s.email === email);
            const name = staff ? staff.name : getNameFromEmail(email);
            const dept = staff ? staff.dept : "N/A";
            const desig = staff ? staff.designation : "N/A";
            const phone = staff ? (staff.phone || "") : "";

            // Determine Role (Updated Abbreviations)
            let status = "Invigilator";
            if (email === csEmail) status = "CS";
            else if (email === sasEmail) status = "SAS";

            // Add Row
            rows.push([
                dateStr,
                sessionType,
                `"${examName}"`,
                `"${name}"`,
                `"${dept}"`,
                `"${desig}"`,
                status,
                phone
            ]);
        });
    });

    if (rows.length <= 1) {
        return alert("No attendance records found for this Academic Year.");
    }

    // Generate CSV
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Register_${acYear.label}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
// ==========================================
// 📤 BULK STAFF UPLOAD LOGIC
// ==========================================

// 1. Download Template (Updated for DD-MM-YY)
window.downloadStaffTemplate = function () {
    // Header clearly indicates format
    const headers = ["Name", "Email", "Phone", "Department", "Designation", "Joining Date (DD-MM-YY)"];
    // Sample follows the format
    const sample = ["John Doe,john@example.com,9876543210,Physics,Assistant Professor,01-06-23"];

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + sample.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Staff_Upload_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 2. Global Vars for Upload State
let tempStaffData = [];
let tempUniqueStaff = [];

// 3. Handle File Selection
window.handleStaffCSVUpload = function (input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        processStaffCSV(text);
        input.value = ''; // Reset
    };
    reader.readAsText(file);
}

// 4. Parse & Analyze CSV (Robust Date Parsing)
function processStaffCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return alert("CSV is empty or invalid.");

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]+/g, ''));

    // Column Mapping
    const getIndex = (possibleNames) => headers.findIndex(h => possibleNames.some(name => h.includes(name)));

    const nameIdx = getIndex(['name', 'staff name', 'faculty']);
    const emailIdx = getIndex(['email', 'gmail', 'mail']);
    const phoneIdx = getIndex(['phone', 'mobile', 'whatsapp']);
    const deptIdx = getIndex(['dept', 'department']);
    const desigIdx = getIndex(['designation', 'role']);
    const joinIdx = getIndex(['joining date', 'join date', 'doj', 'date of joining']);

    if (nameIdx === -1 || emailIdx === -1 || deptIdx === -1) {
        alert(`Error: Missing required columns (Name, Email, Department).\nFound headers: ${headers.join(', ')}`);
        return;
    }

    const parsedData = [];

    // --- FIXED DATE HELPER (Handles DD-MM-YY & DD-MM-YYYY) ---
    const formatDate = (dateStr) => {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        try {
            let cleanStr = dateStr.replace(/[./]/g, '-').trim();
            let parts = cleanStr.split('-');

            let y, m, d;
            if (parts.length !== 3) return new Date().toISOString().split('T')[0];

            // Case 1: YYYY-MM-DD
            if (parts[0].length === 4) { y = parts[0]; m = parts[1]; d = parts[2]; }
            // Case 2: DD-MM-YYYY
            else if (parts[2].length === 4) { y = parts[2]; m = parts[1]; d = parts[0]; }
            // Case 3: DD-MM-YY (Auto-add "20")
            else if (parts[2].length === 2) { y = "20" + parts[2]; m = parts[1]; d = parts[0]; }
            else { return new Date().toISOString().split('T')[0]; }

            // Pad single digits (6 -> 06)
            m = m.padStart(2, '0');
            d = d.padStart(2, '0');

            return `${y}-${m}-${d}`; // HTML5 Input Standard
        } catch (e) {
            return new Date().toISOString().split('T')[0];
        }
    };

    // Parse Rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/; // Handle commas in quotes
        const row = line.split(regex).map(val => val.trim().replace(/^"|"$/g, ''));

        const name = row[nameIdx];
        const email = row[emailIdx];

        if (name && email) {
            parsedData.push({
                name: name,
                email: email,
                phone: phoneIdx !== -1 ? row[phoneIdx] : "",
                dept: deptIdx !== -1 ? row[deptIdx] : "",
                designation: desigIdx !== -1 ? row[desigIdx] : "Assistant Professor",
                joiningDate: joinIdx !== -1 ? formatDate(row[joinIdx]) : new Date().toISOString().split('T')[0],
                // Defaults
                dutiesDone: 0,
                roleHistory: [],
                preferredDays: [1, 2, 3, 4, 5, 6] // Default Full Availability
            });
        }
    }

    if (parsedData.length === 0) {
        alert("No valid data found in CSV.");
        return;
    }

    // Analyze Conflicts
    tempStaffData = parsedData;
    const existingEmails = new Set(staffData.map(s => s.email.toLowerCase()));
    tempUniqueStaff = parsedData.filter(s => !existingEmails.has(s.email.toLowerCase()));

    // Show Modal
    document.getElementById('staff-existing-count').textContent = staffData.length;
    document.getElementById('staff-new-count').textContent = parsedData.length;
    document.getElementById('staff-unique-count').textContent = tempUniqueStaff.length;

    window.openModal('staff-conflict-modal');
}

// 5. Modal Button Listeners
document.getElementById('btn-staff-merge').addEventListener('click', async () => {
    if (tempUniqueStaff.length === 0) {
        alert("No new unique staff to add.");
        window.closeModal('staff-conflict-modal');
        return;
    }

    staffData = [...staffData, ...tempUniqueStaff];
    await syncStaffToCloud();

    // Optional: Grant access if using whitelist
    if (typeof addStaffAccess === 'function') {
        for (const s of tempUniqueStaff) { await addStaffAccess(s.email); }
    }

    alert(`✅ Successfully added ${tempUniqueStaff.length} new staff members.`);
    window.closeModal('staff-conflict-modal');
    renderStaffTable();
    updateAdminUI();
});

// 5. Replace Logic (Overwrite Database) - FIXED
document.getElementById('btn-staff-replace').addEventListener('click', async () => {
    if (confirm("⚠️ WARNING: This will DELETE all existing staff data and replace it with the CSV data.\n\nAre you sure?")) {
        staffData = tempStaffData;
        await syncStaffToCloud();

        // *** FIX: Grant Access to New List ***
        if (typeof addStaffAccess === 'function') {
            // Optional: Clear old access list first if you want strict replacement
            // For now, we just ensure new people get access
            let count = 0;
            for (const s of staffData) {
                await addStaffAccess(s.email);
                count++;
            }
            console.log(`Access granted to ${count} staff.`);
        }
        // **************************************

        alert("✅ Database replaced successfully & Permissions updated.");
        window.closeModal('staff-conflict-modal');
        renderStaffTable();
        updateAdminUI();
    }
});

// --- MAINTENANCE: CLEAR OLD DATA ---
window.clearOldData = async function () {
    const acYear = getCurrentAcademicYear();
    const cutoffDate = acYear.start; // June 1st of Current AY

    if (!confirm(`⚠️ MAINTENANCE: Clear Previous Year Data? ⚠️\n\nThis will DELETE all attendance slots and duty records BEFORE ${cutoffDate.toDateString()}.\n\n1. Please DOWNLOAD the Attendance Register (.csv) first as a backup.\n2. This action cannot be undone.`)) return;

    if (!confirm("Are you absolutely sure you have a backup?")) return;

    const newSlots = {};
    let removedCount = 0;

    Object.keys(invigilationSlots).forEach(key => {
        const date = parseDate(key);

        // Keep slots that are ON or AFTER the cutoff
        if (date >= cutoffDate) {
            newSlots[key] = invigilationSlots[key];
        } else {
            removedCount++;
        }
    });

    if (removedCount > 0) {
        logActivity("Data Cleanup", `Admin cleared ${removedCount} old session records from previous AY.`);
        invigilationSlots = newSlots;
        await syncSlotsToCloud();
        renderSlotsGridAdmin();
        alert(`✅ Cleanup Complete.\n\nRemoved ${removedCount} old session records.\nSystem is ready for AY ${acYear.label}.`);
    } else {
        alert("No old data found to clear.");
    }
}


// --- STAFF MANAGEMENT: ADD & EDIT ---

// Helper to toggle weekly days visibility
function toggleDaysVisibility() {
    const desig = document.getElementById('stf-designation').value;
    const wrapper = document.getElementById('weekly-availability-section');
    if (wrapper) {
        if (desig === "Guest Lecturer") {
            wrapper.classList.remove('hidden');
        } else {
            wrapper.classList.add('hidden');
        }
    }
}

window.openAddStaffModal = function () {
    // Clear Form
    document.getElementById('stf-edit-index').value = "";
    document.getElementById('stf-name').value = "";
    document.getElementById('stf-email').value = "";
    document.getElementById('stf-email').disabled = false;
    document.getElementById('stf-phone').value = "";
    document.getElementById('stf-dept').value = "";
    document.getElementById('stf-designation').value = "";
    document.getElementById('stf-join').value = "";

    // Reset Days
    document.querySelectorAll('.stf-day-chk').forEach(c => c.checked = true);

    // Attach Listener for Designation Change
    const desigSelect = document.getElementById('stf-designation');
    if (desigSelect) {
        desigSelect.onchange = toggleDaysVisibility;
    }
    toggleDaysVisibility(); // Run once to set initial state

    document.getElementById('staff-modal-title').textContent = "Add New Invigilator";
    window.openModal('add-staff-modal');
}

window.editStaff = function (index) {
    const staff = staffData[index];
    if (!staff) return;

    // Populate Form
    document.getElementById('stf-edit-index').value = index;
    document.getElementById('stf-name').value = staff.name;
    document.getElementById('stf-email').value = staff.email;
    document.getElementById('stf-email').disabled = false;
    document.getElementById('stf-phone').value = staff.phone || "";
    document.getElementById('stf-dept').value = staff.dept;
    document.getElementById('stf-designation').value = staff.designation;
    document.getElementById('stf-join').value = staff.joiningDate || "";

    // Populate Days
    const days = staff.preferredDays || [1, 2, 3, 4, 5, 6];
    document.querySelectorAll('.stf-day-chk').forEach(c => {
        c.checked = days.includes(parseInt(c.value));
    });

    // Attach Listener
    const desigSelect = document.getElementById('stf-designation');
    if (desigSelect) {
        desigSelect.onchange = toggleDaysVisibility;
    }
    toggleDaysVisibility(); // Run once to set correct state

    document.getElementById('staff-modal-title').textContent = "Edit Staff Profile";
    window.openModal('add-staff-modal');
}


// --- HELPER: Generate Professional HTML Email ---
window.generateProfessionalEmail = function(name, dutiesArray, title) {
    const collegeName = (typeof currentCollegeName !== 'undefined' ? currentCollegeName : localStorage.getItem('examCollegeName')) || "Government Victoria College";

    let rows = dutiesArray.map(d => {
        const reportTime = calculateReportTime(d.time);
        return `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; border: 1px solid #e5e7eb; color: #374151;">
                <strong>${d.date}</strong> <br> 
                <span style="font-size: 11px; color: #6b7280; text-transform: uppercase;">${d.day}</span>
            </td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; color: #374151;">
                <span style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">${d.session}</span> 
                ${d.time}
            </td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; color: #c0392b; font-weight: bold;">
                ${reportTime}
            </td>
        </tr>`;
    }).join('');

    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px;">${collegeName}</h2>
            <p style="margin: 5px 0 0; font-size: 13px; opacity: 0.9;">${title}</p>
        </div>

        <div style="padding: 25px;">
            <p style="font-size: 15px; color: #111827; margin-top: 0;">Dear <b>${name}</b>,</p>
            <p style="color: #4b5563; line-height: 1.6; font-size: 14px;">
                This is an official intimation regarding your invigilation duties. Please find your schedule below:
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
                <thead>
                    <tr style="background-color: #f9fafb; text-align: left;">
                        <th style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #4b5563;">Date</th>
                        <th style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #4b5563;">Session</th>
                        <th style="padding: 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #4b5563;">Reporting Time</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>

            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-top: 20px;">
                <strong style="color: #92400e; font-size: 13px;">🛑 Instructions:</strong>
                <ul style="margin: 8px 0 0 20px; padding: 0; color: #78350f; font-size: 13px; line-height: 1.6;">
                    <li>Please report to the <strong>Chief Superintendent's office 30 minutes prior</strong> to the commencement of the examination.</li>
                    <li>Mobile phones should be in <strong>silent mode</strong> inside the hall.</li>
                    <li><a href="https://bit.ly/gvc-exam" style="color: #d97706; text-decoration: underline;">View General Instructions</a></li>
                </ul>
            </div>

            <div style="margin-top: 15px; padding: 10px; background-color: #f3f4f6; border-radius: 4px; font-size: 13px; color: #374151;">
                <p style="margin: 0 0 8px 0;">
                    ♻️ For adjustments, please post in the <a href="https://examflow-de08f.web.app/invigilation.html" style="color: #4f46e5; font-weight: bold;">Exam Portal</a>.
                </p>
                <p style="margin: 0; color: #dc2626; font-weight: bold;">
                    Important: If your Exchange Request is not picked up, you must arrange a replacement personally.
                </p>
            </div>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.4;">
                <strong>Exam Cell, ${collegeName}, Palakkad</strong><br>
                This is an automated system alert. Please do not reply directly to this email.
            </p>
        </div>
    </div>
    `;
};


// --- HELPER: Convert WhatsApp Text to HTML for Email ---
function formatMessageForEmail(text) {
    if (!text) return "";
    let html = text
        .replace(/\n/g, '<br>')
        .replace(/\*(.*?)\*/g, '<b>$1</b>')       // Bold *text*
        .replace(/_(.*?)_/g, '<i>$1</i>');       // Italic _text_
    return html;
}

window.sendBulkEmails = async function (btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    if (window.currentEmailQueue.length === 0) return alert("No emails in queue.");
    if (!confirm(`Send ${window.currentEmailQueue.length} emails to faculty members via the system?`)) return;

    // UI Setup
    const progressBar = document.getElementById('bulk-progress-bar');
    const progressFill = document.getElementById('bulk-progress-fill');
    const statusText = document.getElementById('bulk-status-text');
    const cancelBtn = document.getElementById('btn-cancel-bulk'); // If you add one

    btn.classList.add('hidden'); // Hide start button
    if (progressBar) progressBar.classList.remove('hidden');
    if (statusText) statusText.classList.remove('hidden');

    let sentCount = 0;
    
    for (let i = 0; i < window.currentEmailQueue.length; i++) {
        const item = window.currentEmailQueue[i];
        
        // Update Status
        if (statusText) statusText.textContent = `Sending ${i+1} of ${window.currentEmailQueue.length} to ${item.name}...`;
        if (progressFill) progressFill.style.width = `${Math.round(((i+1) / window.currentEmailQueue.length) * 100)}%`;

        // Update Individual Button Row
        const rowBtn = document.getElementById(item.btnId);
        if (rowBtn) {
            rowBtn.textContent = "...";
            rowBtn.disabled = true;
        }

        // Send
        try {
            await fetch(googleScriptUrl, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: item.email,
                    subject: item.subject,
                    body: item.body // Send the HTML body
                })
            });

            // Success UI
            if (rowBtn) {
                rowBtn.innerHTML = "✅";
                rowBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
                rowBtn.classList.add('bg-green-600', 'cursor-default');
            }
            sentCount++;
            
            // Delay
            await new Promise(r => setTimeout(r, 800)); 

        } catch (e) {
            console.error(e);
            if (rowBtn) {
                rowBtn.textContent = "Failed";
                rowBtn.classList.add('bg-red-600');
            }
        }
    }

    if (statusText) statusText.textContent = `Done! Sent ${sentCount} emails.`;
    alert(`Batch Process Complete.\nSent: ${sentCount}`);
    
    // Reset (Optional)
    // btn.classList.remove('hidden');
    // if (progressBar) progressBar.classList.add('hidden');
};


// --- HELPER: Consolidated Department Email Template ---
function generateDepartmentConsolidatedEmail(deptName, facultyData, weekNum, monthStr) {
    const collegeName = collegeData.examCollegeName || "Government Victoria College";

    let tableRows = "";

    // 1. Build Table Rows
    // facultyData is an array of { name: "John", duties: [ {date, session, time}, ... ] }
    facultyData.sort((a, b) => a.name.localeCompare(b.name));

    facultyData.forEach((f, index) => {
        const bgClass = index % 2 === 0 ? "#ffffff" : "#f9fafb";

        // Rowspan for Faculty Name
        const rowSpan = f.duties.length;

        f.duties.forEach((d, dIndex) => {
            const nameCell = (dIndex === 0)
                ? `<td rowspan="${rowSpan}" style="padding: 8px; border: 1px solid #ddd; font-weight: bold; vertical-align: top; background-color: ${bgClass};">${f.name}</td>`
                : "";

            tableRows += `
            <tr style="background-color: ${bgClass};">
                ${nameCell}
                <td style="padding: 8px; border: 1px solid #ddd;">${d.date}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${d.session}</td>
                <td style="padding: 8px; border: 1px solid #ddd; color: #555;">${d.time}</td>
            </tr>`;
        });
    });

    return `
    <div style="font-family: Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; max-width: 800px;">
        <p>Dear Head of Department (<b>${deptName}</b>),</p>
        <p>Please find below the consolidated invigilation duty list for faculty members of your department for <b>Week ${weekNum} (${monthStr})</b>.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
            <thead>
                <tr style="background-color: #4f46e5; color: white; text-align: left;">
                    <th style="padding: 10px; border: 1px solid #4f46e5; width: 30%;">Faculty Name</th>
                    <th style="padding: 10px; border: 1px solid #4f46e5;">Date</th>
                    <th style="padding: 10px; border: 1px solid #4f46e5;">Session</th>
                    <th style="padding: 10px; border: 1px solid #4f46e5;">Time</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>

        <p style="font-size: 13px; color: #666;">
            <i>Note: Individual notifications have been sent to the respective faculty members.</i>
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">
            <b>Exam Cell, ${collegeName}</b>
        </p>
    </div>
    `;
}
window.toggleStaffListLock = function () {
    isStaffListLocked = !isStaffListLocked;
    const btn = document.getElementById('btn-staff-list-lock');

    if (btn) {
        if (isStaffListLocked) {
            btn.innerHTML = `<span>🔒</span> Locked`;
            btn.className = "bg-gray-100 text-gray-500 border border-gray-300 px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 hover:bg-gray-200";
        } else {
            btn.innerHTML = `<span>🔓</span> Editing`;
            btn.className = "bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 hover:bg-red-100 animate-pulse";
        }
    }
    renderStaffTable();
}

window.toggleEmailConfigLock = function () {
    isEmailConfigLocked = !isEmailConfigLocked;
    const input = document.getElementById('google-script-url');
    const btn = document.getElementById('email-config-lock-btn');

    if (input) input.disabled = isEmailConfigLocked;
    if (btn) updateLockIcon('email-config-lock-btn', isEmailConfigLocked);
}

// --- SUBSTITUTE SEARCH LOGIC ---
const subInput = document.getElementById('att-substitute-search');
const subResults = document.getElementById('att-substitute-results');

if (subInput) {
    subInput.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        currentSubstituteCandidate = null; // Reset selection on typing

        if (query.length < 3) {
            subResults.classList.add('hidden');
            return;
        }

        // Get currently listed staff to exclude them
        const presentEmails = Array.from(document.querySelectorAll('.att-chk')).map(c => c.value);

        const matches = staffData.filter(s =>
            (s.name.toLowerCase().includes(query) || s.dept.toLowerCase().includes(query)) &&
            !presentEmails.includes(s.email) &&
            s.status !== 'archived'
        );

        subResults.innerHTML = '';
        if (matches.length === 0) {
            subResults.innerHTML = `<div class="p-2 text-xs text-gray-400 italic text-center">No matches found.</div>`;
        } else {
            matches.forEach(s => {
                const div = document.createElement('div');
                div.className = "p-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition";
                div.innerHTML = `
                    <div class="font-bold text-gray-800 text-xs">${s.name}</div>
                    <div class="text-[10px] text-gray-500 uppercase">${s.dept}</div>
                `;
                div.onclick = () => {
                    subInput.value = s.name;
                    currentSubstituteCandidate = s;
                    subResults.classList.add('hidden');
                };
                subResults.appendChild(div);
            });
        }
        subResults.classList.remove('hidden');
    });

    // Hide results on click outside
    document.addEventListener('click', function (e) {
        if (!subInput.contains(e.target) && !subResults.contains(e.target)) {
            subResults.classList.add('hidden');
        }
    });
}
window.toggleGlobalTargetLock = function () {
    isGlobalTargetLocked = !isGlobalTargetLocked;
    const input = document.getElementById('global-duty-target');
    const guestInput = document.getElementById('guest-duty-target');
    const btn = document.getElementById('global-target-lock-btn');

    if (input) {
        input.disabled = isGlobalTargetLocked;
        // Visual feedback
        if (!isGlobalTargetLocked) {
            input.classList.remove('text-gray-600');
            input.classList.add('text-black', 'bg-white');
        } else {
            input.classList.add('text-gray-600');
            input.classList.remove('text-black', 'bg-white');
        }
    }

    if (guestInput) {
        guestInput.disabled = isGlobalTargetLocked;
        if (!isGlobalTargetLocked) {
            guestInput.classList.remove('text-gray-600');
            guestInput.classList.add('text-black', 'bg-white');
        } else {
            guestInput.classList.add('text-gray-600');
            guestInput.classList.remove('text-black', 'bg-white');
        }
    }

    if (btn) updateLockIcon('global-target-lock-btn', isGlobalTargetLocked);
    if (!isGlobalTargetLocked && input) input.focus();
}
// ==========================================
// 💾 MASTER BACKUP & RESTORE SYSTEM
// ==========================================

window.downloadMasterBackup = function () {
    const collegeName = collegeData ? collegeData.examCollegeName : "Exam_System";
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    const backup = {
        meta: {
            version: "1.0",
            timestamp: new Date().toISOString(),
            college: collegeName
        },
        data: {
            staffData,
            invigilationSlots,
            advanceUnavailability,
            rolesConfig,
            designationsConfig,
            departmentsConfig,
            globalDutyTarget,
            googleScriptUrl
        }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `Invigilation_MASTER_BACKUP_${collegeName}_${timestamp}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.handleMasterRestore = function (input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const backup = JSON.parse(e.target.result);

            // Validation
            if (!backup.data || !backup.data.staffData) {
                throw new Error("Invalid backup file: Missing core data.");
            }

            // 1. Ask User for Mode
            const mode = prompt(
                "♻️ RESTORE OPTIONS\n\n" +
                "Type '1' for FULL RESTORE (Overwrites everything)\n" +
                "Type '2' for VOLUNTEERS & INCONVENIENCE ONLY (Merges into current slots)\n\n" +
                "Enter choice (1 or 2):"
            );

            if (mode !== '1' && mode !== '2') {
                input.value = "";
                return; // Cancelled silently or invalid
            }

            // 2. Safety Check
            const confirmMsg = (mode === '1') 
                ? "⚠️ CRITICAL WARNING ⚠️\n\nThis will OVERWRITE ALL system data (Staff, Settings, Duties).\nThis cannot be undone.\n\nType 'CONFIRM' to proceed:"
                : "⚠️ PARTIAL RESTORE ⚠️\n\nThis will OVERWRITE duty assignments and unavailability in the current schedule using data from the backup.\n\nType 'CONFIRM' to proceed:";

            if (prompt(confirmMsg) !== "CONFIRM") {
                input.value = "";
                return alert("Restore Cancelled. Incorrect code.");
            }

            updateSyncStatus("Restoring...", "neutral");
            const d = backup.data;
            const ref = doc(db, "colleges", currentCollegeId);
            let updatePayload = {};

            if (mode === '1') {
                // --- FULL RESTORE ---
                staffData = d.staffData || [];
                invigilationSlots = d.invigilationSlots || {};
                advanceUnavailability = d.advanceUnavailability || {};
                rolesConfig = d.rolesConfig || {};
                designationsConfig = d.designationsConfig || {};
                departmentsConfig = d.departmentsConfig || [];
                globalDutyTarget = d.globalDutyTarget || 2;
                googleScriptUrl = d.googleScriptUrl || "";

                // Prepare Full Payload
                updatePayload = {
                    examStaffData: JSON.stringify(staffData),
                    examInvigilationSlots: JSON.stringify(invigilationSlots),
                    invigAdvanceUnavailability: JSON.stringify(advanceUnavailability),
                    invigRoles: JSON.stringify(rolesConfig),
                    invigDesignations: JSON.stringify(designationsConfig),
                    invigDepartments: JSON.stringify(departmentsConfig),
                    invigGlobalTarget: globalDutyTarget,
                    invigGoogleScriptUrl: googleScriptUrl
                };
            } 
            else {
                // --- PARTIAL RESTORE (Volunteers & Inconvenience) ---
                
                // 1. Restore Advance Unavailability (General Leave)
                if (d.advanceUnavailability) {
                    advanceUnavailability = d.advanceUnavailability;
                }

                // 2. Restore Slot Specific Data (Merge into existing)
                const backupSlots = d.invigilationSlots || {};
                let restoreCount = 0;

                Object.keys(backupSlots).forEach(key => {
                    const bSlot = backupSlots[key];
                    
                    // Only restore if the slot exists in the current system (e.g. correct date/time matches)
                    if (invigilationSlots[key]) {
                        invigilationSlots[key].assigned = bSlot.assigned || [];
                        invigilationSlots[key].unavailable = bSlot.unavailable || [];
                        invigilationSlots[key].exchangeRequests = bSlot.exchangeRequests || [];
                        
                        // Optional: Restore attendance if needed, otherwise skip
                        // invigilationSlots[key].attendance = bSlot.attendance || [];
                        
                        restoreCount++;
                    }
                });

                console.log(`Partial Restore: Updated duty data for ${restoreCount} slots.`);

                // Prepare Partial Payload
                updatePayload = {
                    examInvigilationSlots: JSON.stringify(invigilationSlots),
                    invigAdvanceUnavailability: JSON.stringify(advanceUnavailability)
                };
            }

            // 3. Save to Cloud
            await updateDoc(ref, updatePayload);

            // 4. Refresh UI
            updateAdminUI();
            renderSlotsGridAdmin();
            updateSyncStatus("Restored", "success");
            alert(`✅ System successfully restored (${mode === '1' ? 'Full' : 'Partial'}).`);

        } catch (err) {
            console.error("Restore Error:", err);
            alert("Restore Failed: " + err.message);
            updateSyncStatus("Error", "error");
        }
        input.value = ""; // Reset input
    };
    reader.readAsText(file);
}

// ==========================================
// 📥 BULK ATTENDANCE UPLOAD LOGIC
// ==========================================

// 1. Download Template
window.downloadAttendanceTemplate = function () {
    const headers = ["Date (DD-MM-YY)", "Session (FN/AN)", "Staff Email", "Duty Role (Invigilator/CS/SAS)"];
    const sample = ["01-12-25,FN,teacher@gmail.com,Invigilator", "01-12-25,FN,chief@gmail.com,CS"];

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + sample.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Attendance_Upload_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 2. Handle Upload
window.handleAttendanceCSVUpload = function (input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        processAttendanceCSV(text);
        input.value = '';
    };
    reader.readAsText(file);
}

// 3. Process CSV (Auto-Create Slots for Past Duties)
async function processAttendanceCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return alert("CSV is empty or invalid.");

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const dateIdx = headers.findIndex(h => h.includes('date'));
    const sessIdx = headers.findIndex(h => h.includes('session'));
    const emailIdx = headers.findIndex(h => h.includes('email'));
    const roleIdx = headers.findIndex(h => h.includes('role') || h.includes('status'));

    if (dateIdx === -1 || sessIdx === -1 || emailIdx === -1) {
        return alert("Error: CSV must have Date, Session, and Staff Email columns.");
    }

    tempAttendanceBatch = {}; // Reset batch
    let totalRecords = 0;
    let createdSlots = 0;
    const unknownEmails = new Set();

    // --- DATE PARSER ---
    const parseDateKey = (dateStr) => {
        if (!dateStr) return null;
        try {
            let clean = dateStr.replace(/[./]/g, '-').trim();
            let parts = clean.split('-');
            let d, m, y;
            if (parts.length !== 3) return null;

            if (parts[0].length === 4) { y = parts[0]; m = parts[1]; d = parts[2]; }
            else if (parts[2].length === 4) { d = parts[0]; m = parts[1]; y = parts[2]; }
            else if (parts[2].length === 2) { d = parts[0]; m = parts[1]; y = "20" + parts[2]; }
            else return null;

            d = d.padStart(2, '0');
            m = m.padStart(2, '0');
            return `${d}.${m}.${y}`;
        } catch (e) { return null; }
    };

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const row = line.split(',').map(v => v.trim());
        const rawDate = row[dateIdx];
        const sessionType = row[sessIdx] ? row[sessIdx].toUpperCase() : "FN";
        const email = row[emailIdx];
        const role = roleIdx !== -1 ? row[roleIdx].toUpperCase() : "INVIGILATOR";
        // Update Role (Robust CSV Matching)
        if (role === "CS" || role === "CHIEF" || role === "CHIEF SUPERINTENDENT") {
            slot.supervision.cs = email;
        }
        if (role === "SAS" || role === "SENIOR" || role === "SENIOR ASST. SUPERINTENDENT" || role === "SAS") {
            slot.supervision.sas = email;
        }
        if (!rawDate || !email) continue;

        const dateStr = parseDateKey(rawDate);
        if (!dateStr) continue;

        // 1. Try to Find Existing Slot
        let matchingKey = Object.keys(invigilationSlots).find(key => {
            if (!key.startsWith(dateStr)) return false;
            const tStr = key.split(' | ')[1].toUpperCase();
            const isAN = (tStr.includes("PM") || tStr.startsWith("12"));
            const slotSession = isAN ? "AN" : "FN";
            return slotSession === sessionType;
        });

        // 2. If Not Found, CREATE VIRTUAL SLOT
        if (!matchingKey) {
            // Default Times: FN = 09:30 AM, AN = 01:30 PM
            const defaultTime = (sessionType === "AN" || sessionType.includes("PM")) ? "01:30 PM" : "09:30 AM";
            matchingKey = `${dateStr} | ${defaultTime}`;

            // Add to System immediately (so next row finds it)
            if (!invigilationSlots[matchingKey]) {
                invigilationSlots[matchingKey] = {
                    required: 0, // No requirement, just a record
                    assigned: [],
                    attendance: [], // Will fill below
                    unavailable: [],
                    isLocked: true,
                    isVirtual: true, // Mark as auto-created
                    examName: "Previous Duty Record"
                };
                createdSlots++;
            }
        }

        // 3. Add to Batch
        if (!tempAttendanceBatch[matchingKey]) {
            tempAttendanceBatch[matchingKey] = { attendance: [], supervision: { cs: "", sas: "" } };
        }

        tempAttendanceBatch[matchingKey].attendance.push(email);
        if (role === "CS" || role === "CHIEF") tempAttendanceBatch[matchingKey].supervision.cs = email;
        if (role === "SAS" || role === "SENIOR") tempAttendanceBatch[matchingKey].supervision.sas = email;

        if (!staffData.some(s => s.email.toLowerCase() === email.toLowerCase())) {
            unknownEmails.add(email);
        }

        totalRecords++;
    }

    if (totalRecords === 0) {
        return alert("No valid records found in CSV.");
    }

    if (unknownEmails.size > 0) {
        alert(`⚠️ Warning: ${unknownEmails.size} emails are not in your Staff Database.\nThey will be marked present, but details will be missing in reports.`);
    }

    // Show Conflict Modal
    document.getElementById('att-csv-count').textContent = totalRecords;
    document.getElementById('att-session-count').textContent = Object.keys(tempAttendanceBatch).length;

    // Add note about created slots
    if (createdSlots > 0) {
        const note = document.createElement('p');
        note.className = "text-xs text-indigo-600 font-bold mt-2";
        note.textContent = `ℹ️ ${createdSlots} new 'Virtual Slots' will be created for past dates.`;
        document.getElementById('att-session-count').parentNode.appendChild(note);
    }

    window.openModal('att-conflict-modal');
}

// 4. Merge Logic (Add Missing)
document.getElementById('btn-att-merge').addEventListener('click', async () => {
    let updatedCount = 0;

    Object.keys(tempAttendanceBatch).forEach(key => {
        const slot = invigilationSlots[key];
        const batch = tempAttendanceBatch[key];

        if (!slot.attendance) slot.attendance = [];
        if (!slot.supervision) slot.supervision = { cs: "", sas: "" };

        // Add unique emails
        batch.attendance.forEach(email => {
            if (!slot.attendance.includes(email)) {
                slot.attendance.push(email);
                updatedCount++;
            }
        });

        // Update Supervision (Overwrite if present in CSV)
        if (batch.supervision.cs) slot.supervision.cs = batch.supervision.cs;
        if (batch.supervision.sas) slot.supervision.sas = batch.supervision.sas;
    });

    await finishAttendanceUpload(updatedCount, "Merged");
});

// 5. Replace Logic (Overwrite Lists)
document.getElementById('btn-att-replace').addEventListener('click', async () => {
    if (!confirm("⚠️ This will OVERWRITE the attendance lists for the affected sessions with data from the CSV.\n\nAre you sure?")) return;

    let updatedCount = 0;

    Object.keys(tempAttendanceBatch).forEach(key => {
        const slot = invigilationSlots[key];
        const batch = tempAttendanceBatch[key];

        // Overwrite
        slot.attendance = batch.attendance; // Replaces entire array
        updatedCount += batch.attendance.length;

        if (!slot.supervision) slot.supervision = { cs: "", sas: "" };
        if (batch.supervision.cs) slot.supervision.cs = batch.supervision.cs;
        if (batch.supervision.sas) slot.supervision.sas = batch.supervision.sas;
    });

    await finishAttendanceUpload(updatedCount, "Replaced");
});

async function finishAttendanceUpload(count, action) {
    await syncSlotsToCloud();
    window.closeModal('att-conflict-modal');
    alert(`✅ Success! ${action} attendance records for ${count} entries.`);
    populateAttendanceSessions();
    if (ui.attSessionSelect && ui.attSessionSelect.value) {
        loadSessionAttendance();
    }
}
// --- MANUAL ALLOCATION SEARCH ---
window.filterManualStaff = function () {
    const query = document.getElementById('manual-staff-search').value.toLowerCase();
    const rows = document.querySelectorAll('#manual-available-list tr');
    const noResults = document.getElementById('manual-no-results');
    let hasVisible = false;

    rows.forEach(row => {
        // The Name is in the second column (index 1), inside a div
        // The Dept is in the same cell, inside a div with text-[10px]
        const textContent = row.innerText.toLowerCase(); // Simple check of all text in row

        if (textContent.includes(query)) {
            row.classList.remove('hidden');
            hasVisible = true;
        } else {
            row.classList.add('hidden');
        }
    });

    if (noResults) {
        if (hasVisible) noResults.classList.add('hidden');
        else noResults.classList.remove('hidden');
    }
}



// [In invigilation.js]
// Replace the existing openManualAllocationModal function with this:

window.openManualAllocationModal = function (key) {
    const slot = invigilationSlots[key];
    const requiredCount = parseInt(slot.required) || 0; 

    // 1. Admin Lock Check
    if (!slot.isAdminLocked) {
        alert("⚠️ Action Denied.\n\nManual allocation requires the ADMIN POSTING LOCK.\nPlease click the '🛡️ Admin' lock button for this slot first.");
        return;
    }

    // 2. Reset Search
    const searchInput = document.getElementById('manual-staff-search');
    if (searchInput) searchInput.value = "";
    const noResults = document.getElementById('manual-no-results');
    if (noResults) noResults.classList.add('hidden');

    // 3. Setup Modal Header
    document.getElementById('manual-session-key').value = key;
    document.getElementById('manual-modal-title').textContent = key;
    document.getElementById('manual-modal-req').textContent = requiredCount;

    // --- 4. SMART SORTING ---
    const targetDate = parseDate(key);
    const monthStr = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const weekNum = getWeekOfMonth(targetDate);
    const targetDateString = targetDate.toDateString();
    const prevDate = new Date(targetDate); prevDate.setDate(targetDate.getDate() - 1);
    const nextDate = new Date(targetDate); nextDate.setDate(targetDate.getDate() + 1);
    const prevDateStr = prevDate.toDateString();
    const nextDateStr = nextDate.toDateString();

    const staffContext = {};
    staffData.forEach(s => staffContext[s.email] = { weekCount: 0, hasSameDay: false, hasAdjacent: false });

    // Build Context (Check conflicts with other slots)
    Object.keys(invigilationSlots).forEach(k => {
        if (k === key) return;
        const sSlot = invigilationSlots[k];
        const sDate = parseDate(k);
        const sDateString = sDate.toDateString();

        const sMonth = sDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        const sWeek = getWeekOfMonth(sDate);
        const isSameWeek = (sMonth === monthStr && sWeek === weekNum);
        const isSameDay = (sDateString === targetDateString);
        const isAdjacent = (sDateString === prevDateStr || sDateString === nextDateStr);

        (sSlot.assigned || []).forEach(email => {
            if (staffContext[email]) {
                if (isSameWeek) staffContext[email].weekCount++;
                if (isSameDay) staffContext[email].hasSameDay = true;
                if (isAdjacent) staffContext[email].hasAdjacent = true;
            }
        });
    });

    // Score Staff
    const rankedStaff = staffData
        .filter(s => s.status !== 'archived')
        .map(s => {
            const done = getDutiesDoneCount(s.email);
            const target = calculateStaffTarget(s);
            const pending = Math.max(0, target - done);

            const ctx = staffContext[s.email] || { weekCount: 0, hasSameDay: false, hasAdjacent: false };

            // Base Score: Pending Duty Priority
            let score = pending * 100;
            let badges = [];

            // Penalties
            if (ctx.weekCount >= 3) { score -= 5000; badges.push("Max 3/wk"); }
            if (ctx.hasSameDay) { score -= 2000; badges.push("Same Day"); }
            if (ctx.hasAdjacent) { score -= 1000; badges.push("Adjacent"); }

            // Dept Saturation Check
            const assignedList = slot.assigned || [];
            const totalAssigned = assignedList.length;
            const myDeptCount = assignedList.filter(email => {
                const member = staffData.find(st => st.email === email);
                return member && member.dept === s.dept;
            }).length;

            const totalInDept = staffData.filter(st => st.dept === s.dept).length;
            const isExempt = (totalInDept === 1);

            if (!isExempt) {
                const potentialRatio = (myDeptCount + 1) / (totalAssigned + 1);
                if (potentialRatio > 0.5) {
                    score -= 500;
                    badges.push("Dept Saturation");
                }
            }

            return { ...s, pending, score, badges };
        })
        .sort((a, b) => b.score - a.score); // Highest Score First

    if (typeof lastManualRanking !== 'undefined') lastManualRanking = rankedStaff;

    // --- 5. RENDER & SELECTION LOGIC ---
    const availList = document.getElementById('manual-available-list');
    availList.innerHTML = '';

    // 🟢 FIX: Prioritize Volunteers (Existing Assignments)
    const assignedSet = new Set(slot.assigned || []);
    let currentSelectionCount = 0;
    
    // Count how many assigned people are actually valid/ranked
    let preFilledCount = 0;
    rankedStaff.forEach(s => {
         if(assignedSet.has(s.email)) preFilledCount++;
    });

    // Determine how many *more* slots we need to auto-fill
    let slotsToAutoFill = Math.max(0, requiredCount - preFilledCount);

    rankedStaff.forEach(s => {
        const isUnavailable = isUserUnavailable(slot, s.email, key);
        const isAssigned = assignedSet.has(s.email);

        // Filter: Hide unavailable staff, UNLESS they are already assigned (keep them visible/checked)
        if (isUnavailable && !isAssigned) return;

        let isChecked = false;

        // SELECTION RULE 1: If they volunteered/are assigned, ALWAYS check them.
        if (isAssigned) {
            isChecked = true;
        } 
        // SELECTION RULE 2: If we still have space, auto-check the top ranked staff.
        else if (slotsToAutoFill > 0) {
            isChecked = true;
            slotsToAutoFill--;
        }

        if (isChecked) currentSelectionCount++;

        const checkState = isChecked ? 'checked' : '';
        const rowClass = isChecked ? 'bg-indigo-50' : 'hover:bg-gray-50';
        const pendingColor = s.pending > 0 ? 'text-red-600' : 'text-green-600';

        const warningHtml = s.badges.map(b =>
            `<span class="ml-1 text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded border border-orange-200">${b}</span>`
        ).join('');

        availList.innerHTML += `
            <tr class="${rowClass} border-b last:border-0 transition text-xs">
                <td class="px-1 py-2 md:px-3 text-center w-8 md:w-10">
                    <input type="checkbox" class="manual-chk w-4 h-4 text-indigo-600 rounded" value="${s.email}" ${checkState} onchange="window.updateManualCounts()">
                </td>
                <td class="px-2 py-2 md:px-3">
                    <div class="flex flex-col md:flex-row md:items-center">
                        <div class="flex items-center">
                            <span class="font-bold text-gray-800 mr-1.5 truncate text-xs md:text-sm">${s.name}</span>
                            <div class="flex flex-wrap gap-0.5">${warningHtml}</div>
                        </div>
                        <div class="text-[10px] text-gray-500 leading-tight mt-0.5 md:mt-0 md:ml-1">
                            <span class="md:hidden">• </span>${s.dept} <span class="hidden md:inline">| ${s.designation}</span>
                        </div>
                    </div>
                </td>
                <td class="px-2 py-2 md:px-3 text-center font-mono font-bold ${pendingColor} w-10 md:w-16 text-xs md:text-sm">
                    ${s.pending}
                </td>
            </tr>`;
    });

    if (availList.innerHTML === "") {
        availList.innerHTML = `<tr><td colspan="3" class="text-center p-4 text-gray-500 italic">No available staff found.</td></tr>`;
    }

    // 6. Render Unavailable List (Unchanged)
    const unavList = document.getElementById('manual-unavailable-list');
    unavList.innerHTML = '';

    const allUnavailable = [];
    if (slot.unavailable) slot.unavailable.forEach(u => allUnavailable.push(u));

    const [dateStr, timeStr] = key.split(' | ');
    let session = "FN";
    const t = timeStr ? timeStr.toUpperCase() : "";
    if (t.includes("PM") || t.startsWith("12:") || t.startsWith("12.")) session = "AN";

    if (advanceUnavailability && advanceUnavailability[dateStr] && advanceUnavailability[dateStr][session]) {
        advanceUnavailability[dateStr][session].forEach(u => {
            if (!allUnavailable.some(existing => (typeof existing === 'string' ? existing : existing.email) === u.email)) {
                allUnavailable.push(u);
            }
        });
    }

    if (allUnavailable.length > 0) {
        allUnavailable.forEach(u => {
            const email = (typeof u === 'string') ? u : u.email;
            const reason = (typeof u === 'object' && u.reason) ? u.reason : "Marked Unavailable";
            const s = staffData.find(st => st.email === email) || { name: email };

            unavList.innerHTML += `
                <div class="bg-white p-2 rounded border border-red-100 text-[10px] md:text-xs shadow-sm mb-1 flex justify-between items-center">
                    <div class="font-bold text-red-700 truncate mr-2">${s.name}</div>
                    <div class="text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded whitespace-nowrap">${reason}</div>
                </div>`;
        });
    } else {
        unavList.innerHTML = `<div class="text-center text-gray-400 text-xs py-4 italic">No requests.</div>`;
    }

    // 7. Update Counters & Open
    document.getElementById('manual-sel-count').textContent = currentSelectionCount;
    const reqCountEl = document.getElementById('manual-req-count');
    if (reqCountEl) reqCountEl.textContent = requiredCount;
    window.openModal('manual-allocation-modal');
}



window.updateManualCounts = function () {
    const count = document.querySelectorAll('.manual-chk:checked').length;
    document.getElementById('manual-sel-count').textContent = count;
}
window.saveManualAllocation = async function () {
    const key = document.getElementById('manual-session-key').value;
    const selectedEmails = Array.from(document.querySelectorAll('.manual-chk:checked')).map(c => c.value);

    if (invigilationSlots[key]) {
        // --- 1. GENERATE LOGIC REPORT ---
        const timestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase();
        const adminName = currentUser ? currentUser.email : "Admin";

        // We use the 'lastManualRanking' global variable we captured when opening the modal
        // If it's empty (e.g. page reload), we can't generate a detailed log, so we skip.
        let logHtml = "";

        if (typeof lastManualRanking !== 'undefined' && lastManualRanking.length > 0) {
            logHtml = `
                <div class="mb-3 pb-2 border-b border-gray-200">
                    <div class="font-bold text-gray-800">Assignment Logic Report</div>
                    <div class="text-[10px] text-gray-500">${timestamp} by ${adminName}</div>
                </div>
                <div class="mb-3">
                    <div class="text-xs font-bold text-green-700 uppercase mb-1">Assigned Staff (${selectedEmails.length})</div>
            `;

            // Details of Assigned
            selectedEmails.forEach((email, i) => {
                const rankData = lastManualRanking.find(s => s.email === email);
                if (rankData) {
                    const warnings = rankData.badges.length > 0 ? `<span class="text-red-600 font-bold ml-1">[${rankData.badges.join(', ')}]</span>` : "";
                    logHtml += `<div class="text-xs mb-1">${i + 1}. <b>${rankData.name}</b> <span class="text-gray-500">(Score: ${rankData.score})</span> ${warnings}</div>`;
                } else {
                    logHtml += `<div class="text-xs mb-1">${i + 1}. ${getNameFromEmail(email)} (Manually Added)</div>`;
                }
            });

            // Details of Top Skipped (Why were they ignored?)
            const skipped = lastManualRanking.filter(s => !selectedEmails.includes(s.email)).slice(0, 3); // Top 3 skipped

            if (skipped.length > 0) {
                logHtml += `</div><div class="mb-2"><div class="text-xs font-bold text-orange-700 uppercase mb-1">Top Candidates Skipped</div>`;
                skipped.forEach(s => {
                    const warnings = s.badges.length > 0 ? `[${s.badges.join(', ')}]` : "[No Conflicts]";
                    logHtml += `<div class="text-xs mb-1 text-gray-600"><b>${s.name}</b> (Score: ${s.score}) - ${warnings}</div>`;
                });
            }

            logHtml += `</div><div class="text-[10px] text-gray-400 italic mt-2 border-t pt-1">Score = Pending Duty * 100 - Penalties.</div>`;
        } else {
            logHtml = `<div class="text-gray-500 italic">Log not available (Session reloaded).</div>`;
        }

        // Save to Slot
        invigilationSlots[key].allocationLog = logHtml;
        invigilationSlots[key].assigned = selectedEmails;

        // --- 2. STANDARD LOGGING & SAVE ---
        if (typeof logActivity === 'function') logActivity("Manual Assignment", `Assigned ${selectedEmails.length} staff to session ${key}`);

        await syncSlotsToCloud();
        window.closeModal('manual-allocation-modal');
        renderSlotsGridAdmin();

       
    }
}
window.switchAdminTab = function (tabName) {
    const tabs = ['staff', 'slots', 'attendance'];

    tabs.forEach(t => {
        const content = document.getElementById(`tab-content-${t}`);
        const btn = document.getElementById(`tab-btn-${t}`);

        if (t === tabName) {
            // --- ACTIVE STATE (White Card + Shadow) ---
            if (content) content.classList.remove('hidden');
            if (btn) {
                btn.className = "flex-1 py-2 px-2 text-xs md:text-sm font-bold rounded-lg transition shadow bg-white text-indigo-600 text-center";
            }
        } else {
            // --- INACTIVE STATE (Gray + No Shadow) ---
            if (content) content.classList.add('hidden');
            if (btn) {
                btn.className = "flex-1 py-2 px-2 text-xs md:text-sm font-bold rounded-lg transition text-gray-500 hover:bg-gray-200 text-center";
            }
        }
    });
}

// --- MANUAL ALLOCATION HELPER: Unselect All ---
window.unselectAllManualStaff = function () {
    const checkboxes = document.querySelectorAll('.manual-chk');
    checkboxes.forEach(chk => {
        chk.checked = false;
    });
    // Update the "Selected/Required" counter immediately
    window.updateManualCounts();
}

// --- BULK CANCEL FUNCTION ---
window.cancelBulkSending = function () {
    if (confirm("Stop sending remaining emails?")) {
        isBulkSendingCancelled = true;
        const btn = document.getElementById('btn-cancel-bulk');
        if (btn) {
            btn.disabled = true;
            btn.textContent = "Stopping...";
            btn.classList.add('opacity-50');
        }
    }
}

// --- UNIFIED SEARCH HANDLER (CS, SAS, SUBSTITUTE) ---
function setupSearchHandler(inputId, resultsId, hiddenId, excludeCurrentList) {
    const input = document.getElementById(inputId);
    const results = document.getElementById(resultsId);
    const hidden = hiddenId ? document.getElementById(hiddenId) : null;

    if (!input || !results) return;

    input.addEventListener('input', function () {
        const query = this.value.toLowerCase();

        // Clear hidden value on type (force re-selection)
        if (hidden) hidden.value = "";

        if (query.length < 2) {
            results.classList.add('hidden');
            return;
        }

        // Filter Logic
        let matches = staffData.filter(s => s.status !== 'archived');

        // Exclude those already in attendance (Only for Substitute search)
        if (excludeCurrentList) {
            const presentEmails = Array.from(document.querySelectorAll('.att-chk')).map(c => c.value);
            matches = matches.filter(s => !presentEmails.includes(s.email));
        }

        // Search Name or Dept
        matches = matches.filter(s => s.name.toLowerCase().includes(query) || s.dept.toLowerCase().includes(query));

        // SORT ALPHABETICALLY
        matches.sort((a, b) => a.name.localeCompare(b.name));

        results.innerHTML = '';
        if (matches.length === 0) {
            results.innerHTML = `<div class="p-2 text-xs text-gray-400 italic text-center">No matches found.</div>`;
        } else {
            matches.forEach(s => {
                const div = document.createElement('div');
                div.className = "p-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition flex justify-between items-center";
                div.innerHTML = `
                    <span class="font-bold text-gray-800 text-xs">${s.name}</span>
                    <span class="text-[9px] text-gray-500 uppercase bg-gray-50 px-1 rounded">${s.dept}</span>
                `;

                div.onclick = () => {
                    input.value = s.name;
                    if (hidden) hidden.value = s.email;

                    // Special case for Substitute (Global Var)
                    if (inputId === 'att-substitute-search') {
                        currentSubstituteCandidate = s;
                    }

                    results.classList.add('hidden');
                };
                results.appendChild(div);
            });
        }
        results.classList.remove('hidden');
    });

    // Hide on click outside
    document.addEventListener('click', function (e) {
        if (!input.contains(e.target) && !results.contains(e.target)) {
            results.classList.add('hidden');
        }
    });
}
window.viewSlotHistory = function (key) {
    const slot = invigilationSlots[key];
    if (!slot || !slot.allocationLog) return alert("No logic log available for this slot.\n(Try re-assigning via Manual Allocation to generate one).");

    const list = document.getElementById('inconvenience-list');
    const title = document.getElementById('inconvenience-modal-subtitle');

    // Reuse the Inconvenience Modal
    document.querySelector('#inconvenience-modal h3').textContent = "📜 Allocation Logic";
    title.textContent = `Justification for ${key}`;

    list.innerHTML = slot.allocationLog;
    window.openModal('inconvenience-modal');
}

// --- NEW: SYNC STAFF PERMISSIONS BUTTON ---
window.syncAllStaffPermissions = async function () {
    if (!staffData || staffData.length === 0) return alert("No staff data to sync.");

    if (!confirm(`🛡️ Sync Permissions?\n\nThis will iterate through all ${staffData.length} staff members in your database and ensure they have "Staff Access" in Firebase.\n\nUse this if people cannot log in.`)) return;

    const btn = document.getElementById('btn-sync-perms');
    const originalText = btn ? btn.innerHTML : "Sync Permissions";
    if (btn) { btn.disabled = true; btn.innerHTML = "Syncing..."; }

    let count = 0;
    try {
        for (const staff of staffData) {
            if (staff.email && staff.email.includes('@')) {
                await addStaffAccess(staff.email);
                count++;
            }
        }
        alert(`✅ Success! Permissions verified/added for ${count} staff members.`);
    } catch (e) {
        console.error(e);
        alert("Error syncing permissions: " + e.message);
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
    }
};

// --- SYNC STATUS & NETWORK LOGIC ---

function updateSyncStatus(msg, type) {
    const el = document.getElementById('sync-status');
    if (!el) return;

    let color = "bg-gray-400";
    let textClass = "text-gray-500";

    if (type === 'success') {
        color = "bg-green-500";
        textClass = "text-green-600";
    } else if (type === 'error') {
        color = "bg-red-500";
        textClass = "text-red-600";
    } else if (type === 'neutral') {
        color = "bg-blue-500 animate-pulse";
        textClass = "text-blue-600";
    }

    el.className = `text-[10px] font-bold ${textClass} flex items-center gap-1`;
    el.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${color}"></span> ${msg}`;
}

// ==========================================
// 🗓️ RESCHEDULE & ALERT SYSTEM
// ==========================================

window.openRescheduleModal = function (key) {
    if (!invigilationSlots[key]) return;

    document.getElementById('reschedule-old-key').value = key;
    document.getElementById('reschedule-current-key').textContent = key;

    // Pre-fill current values for easier editing
    const [datePart, timePart] = key.split(' | ');

    // Convert DD.MM.YYYY -> YYYY-MM-DD for input
    const [d, m, y] = datePart.split('.');
    document.getElementById('reschedule-new-date').value = `${y}-${m}-${d}`;

    // Convert Time (e.g., 09:30 AM -> 09:30)
    // Basic parser (assuming standard format)
    let time24 = "";
    const match = timePart.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
        let [_, h, min, p] = match;
        h = parseInt(h);
        if (p.toUpperCase() === 'PM' && h < 12) h += 12;
        if (p.toUpperCase() === 'AM' && h === 12) h = 0;
        time24 = `${String(h).padStart(2, '0')}:${min}`;
    }
    document.getElementById('reschedule-new-time').value = time24;

    window.openModal('reschedule-modal');
}

window.executeReschedule = async function () {
    const oldKey = document.getElementById('reschedule-old-key').value;
    const dateInput = document.getElementById('reschedule-new-date').value;
    const timeInput = document.getElementById('reschedule-new-time').value;

    if (!dateInput || !timeInput) return alert("Please select new Date and Time.");

    // 1. Generate New Key
    const [y, m, d] = dateInput.split('-');
    const formattedDate = `${d}.${m}.${y}`;

    let [hours, minutes] = timeInput.split(':');
    hours = parseInt(hours);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    const newKey = `${formattedDate} | ${formattedTime}`;

    if (newKey === oldKey) return alert("New time is the same as the old time.");
    if (invigilationSlots[newKey]) {
        if (!confirm(`Slot ${newKey} already exists! Merge staff into it?`)) return;
    }

    // 2. Move Data
    const oldSlot = invigilationSlots[oldKey];
    const affectedStaff = [...oldSlot.assigned]; // Copy list for notification

    if (!invigilationSlots[newKey]) {
        // Create new
        invigilationSlots[newKey] = JSON.parse(JSON.stringify(oldSlot));
    } else {
        // Merge
        const newSlot = invigilationSlots[newKey];
        oldSlot.assigned.forEach(email => {
            if (!newSlot.assigned.includes(email)) newSlot.assigned.push(email);
        });
        // Merge Scribes/Counts if needed logic here...
    }

    // 3. Delete Old
    delete invigilationSlots[oldKey];
    logActivity("Session Rescheduled", `Admin moved session from ${oldKey} to ${newKey}. Staff moved: ${affectedStaff.length}.`);
    // 4. Save & Close
    await syncSlotsToCloud();
    window.closeModal('reschedule-modal');
    renderSlotsGridAdmin();

    // 5. Trigger Notification Modal
    if (affectedStaff.length > 0) {
        setTimeout(() => openRescheduleNotification(affectedStaff, oldKey, newKey), 500);
    } else {
        alert(`✅ Session moved to ${newKey}. (No staff were assigned).`);
    }
}



// --- Reschedule Notification Modal ---
function openRescheduleNotification(staffList, oldKey, newKey) {
    const list = document.getElementById('notif-list-container');
    const title = document.getElementById('notif-modal-title');
    const subtitle = document.getElementById('notif-modal-subtitle');
    const previewEl = document.getElementById('notif-message-preview');

    title.textContent = "⚠️ Send Reschedule Alerts";
    subtitle.textContent = `Notify ${staffList.length} staff about the time change.`;
    list.innerHTML = '';
    currentEmailQueue = [];

    staffList.forEach((email, index) => {
        const staff = staffData.find(s => s.email === email);
        const fullName = staff ? staff.name : email;
        const phone = staff ? (staff.phone || "").replace(/\D/g, '') : "";
        const validPhone = phone.length >= 10 ? (phone.length === 10 ? "91" + phone : phone) : "";
        const staffEmail = staff ? staff.email : "";

        // --- GENERATE MESSAGES ---
        const waMsg = `⚠️ *URGENT: EXAM RESCHEDULED* ⚠️\n\nDear *${fullName}*,\n\nThe exam session originally scheduled for:\n❌ *${oldKey}*\n\nHas been moved to:\n✅ *${newKey}*\n\nYour invigilation duty has been transferred to this new time. Please adjust your calendar accordingly.\n\n- Exam Wing`;

        const emailBody = `
            <div style="font-family:Arial,sans-serif; color:#333;">
                <h2 style="color:#c0392b;">⚠️ Exam Reschedule Alert</h2>
                <p>Dear <b>${fullName}</b>,</p>
                <p>This is to inform you that an exam session has been rescheduled.</p>
                <div style="background:#fff5f5; border-left:4px solid #c0392b; padding:15px; margin:15px 0;">
                    <p style="margin:0;"><b>Previous Schedule:</b> <strike>${oldKey}</strike></p>
                    <p style="margin:5px 0 0 0; font-size:1.1em;"><b>New Schedule:</b> <span style="color:#c0392b;">${newKey}</span></p>
                </div>
                <p>Your duty assignment has been automatically moved to the new slot.</p>
                <p>Regards,<br><b>Chief Superintendent</b></p>
            </div>
        `;

        const waLink = validPhone ? `https://wa.me/${validPhone}?text=${encodeURIComponent(waMsg)}` : "#";
        const btnId = `email-btn-${index}`;

        if (staffEmail) {
            currentEmailQueue.push({
                email: staffEmail,
                name: fullName,
                subject: "URGENT: Invigilation Duty Rescheduled",
                body: emailBody,
                btnId: btnId
            });
        }

        // Show preview for first user
        if (index === 0 && previewEl) {
            previewEl.textContent = waMsg;
        }

        list.innerHTML += `
            <div class="flex justify-between items-center bg-orange-50 border border-orange-200 p-3 rounded-lg shadow-sm mb-2">
                <div>
                    <div class="font-bold text-gray-800">${fullName}</div>
                    <div class="text-xs text-orange-700">Moved to: ${newKey.split('|')[0]}</div>
                </div>
                <div class="flex gap-2">
                     <button id="${btnId}" onclick="sendSingleEmail(this, '${staffEmail}', '${fullName}', 'URGENT: Reschedule Alert', '${emailBody.replace(/"/g, '&quot;')}')" ${staffEmail ? '' : 'disabled'} class="bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded shadow transition">Mail</button>
                     <a href="${waLink}" target="_blank" ${validPhone ? '' : 'disabled'} class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded shadow transition">WA Alert</a>
                </div>
            </div>
        `;
    });

    // Add Bulk Button Logic
    list.insertAdjacentHTML('afterbegin', `
        <div class="mb-3 flex justify-end">
            <button onclick="sendBulkEmails('btn-bulk-reschedule')" id="btn-bulk-reschedule" class="bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded shadow hover:bg-orange-700 transition flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                Send All Emails
            </button>
        </div>
    `);

    window.openModal('notification-modal');
}

// ==========================================
// 📄 DUTY NOTIFICATION PREVIEW (No Signature, No Blank Page)
// ==========================================

window.printDutyNotification = function (key) {
    const slot = invigilationSlots[key];
    if (!slot || slot.assigned.length === 0) return alert("No staff assigned to this session.");

    // 1. DATA PREPARATION
    const [dateStr, timeStr] = key.split(' | ');
    const [d, m, y] = dateStr.split('.');
    const examDate = new Date(`${y}-${m}-${d}`);

    const excelBaseDate = new Date(1899, 11, 30);
    const dayDiff = Math.floor((examDate - excelBaseDate) / (1000 * 60 * 60 * 24));

    const isAN = (timeStr.includes("PM") || timeStr.startsWith("12:") || timeStr.startsWith("12."));
    const sessionCode = isAN ? "AN" : "FN";
    const reportTime = calculateReportTime(timeStr);
    const logoUrl = "logo.png";

    // 2. LAYOUT LOGIC (Limit 20)
    const totalStaff = slot.assigned.length;
    const useTwoColumns = totalStaff > 20;

    const generateRow = (email, idx) => {
        const staff = staffData.find(s => s.email === email) || { name: getNameFromEmail(email), dept: "", phone: "" };
        let phone = staff.phone || "-";
        let nameDisplay = staff.name.length > 28 ? staff.name.substring(0, 26) + ".." : staff.name;

        return `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>
                    <div style="font-weight: bold;">${nameDisplay}</div>
                    <div style="font-size: 9pt; color: #444;">${staff.dept}</div>
                </td>
                <td style="text-align: center; font-size: 9pt;">${phone}</td>
            </tr>
        `;
    };

    let tableContentHtml = "";

    if (useTwoColumns) {
        // --- 2 COLUMN LAYOUT (No Signature) ---
        const mid = Math.ceil(totalStaff / 2);
        const leftList = slot.assigned.slice(0, mid);
        const rightList = slot.assigned.slice(mid);

        const renderMiniTable = (list, startIdx) => `
            <table class="staff-table" style="width: 100%; font-size: 9pt;">
                <thead>
                    <tr>
                        <th style="width: 25px;">No</th>
                        <th>Name & Dept</th>
                        <th style="width: 80px;">Mobile</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.map((email, i) => generateRow(email, startIdx + i)).join('')}
                </tbody>
            </table>
        `;

        tableContentHtml = `
            <div style="display: flex; gap: 15px; align-items: flex-start;">
                <div style="flex: 1;">
                    ${renderMiniTable(leftList, 0)}
                </div>
                <div style="flex: 1;">
                    ${renderMiniTable(rightList, mid)}
                </div>
            </div>
        `;
    } else {
        // --- 1 COLUMN LAYOUT (No Signature) ---
        tableContentHtml = `
            <table class="staff-table" style="width: 100%; margin-top: 10px;">
                <thead>
                    <tr>
                        <th style="width: 40px;">SL. NO</th>
                        <th>Name and Department of the Invigilator</th>
                        <th style="width: 120px;">Mobile</th>
                    </tr>
                </thead>
                <tbody>
                    ${slot.assigned.map((email, i) => generateRow(email, i)).join('')}
                </tbody>
            </table>
        `;
    }

    // 3. OPEN PREVIEW WINDOW
    const w = window.open('', '_blank');
    w.document.write(`
        <html>
        <head>
            <title>Notification_${dateStr}_${sessionCode}</title>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
                
                body { font-family: 'Times New Roman', serif; background: #f3f4f6; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
                
                /* CONTROL BAR */
                #controls {
                    margin-bottom: 20px; background: white; padding: 10px 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .btn {
                    padding: 10px 20px; font-weight: bold; border: none; border-radius: 4px; cursor: pointer; font-family: sans-serif; font-size: 14px; margin: 0 5px;
                }
                .btn-print { background-color: #374151; color: white; }
                .btn-download { background-color: #2563eb; color: white; }
                .btn:hover { opacity: 0.9; }

                /* CONTENT CONTAINER */
                .content-wrapper {
                    width: 100%; 
                    max-width: 200mm; /* Fits safely inside A4 */
                    /* CHANGED FROM min-height: 297mm TO auto */
                    height: auto; 
                    min-height: 100mm; 
                    background: white;
                    padding: 10mm 15mm;
                    box-sizing: border-box;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                }

                .header { text-align: center; margin-bottom: 15px; }
                .header img { height: 60px; width: auto; margin-bottom: 5px; }
                .college-name { font-size: 14pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; }
                .address { font-size: 9pt; }
                .meta { font-size: 9pt; font-weight: bold; margin-top: 4px; border-bottom: 1px solid #000; padding-bottom: 8px; }
                
                .title-section { margin: 12px 0; display: flex; justify-content: space-between; align-items: flex-end; }
                .designation { font-weight: bold; font-size: 11pt; text-align: left; line-height: 1.2; }
                .doc-number { font-weight: bold; font-size: 11pt; text-align: right; line-height: 1.2; }
                
                .body-text { font-size: 11pt; text-align: justify; margin-bottom: 12px; line-height: 1.3; }
                
                .highlight-box { 
                    font-weight: bold; margin: 12px 0; font-size: 10pt; 
                    border: 1px solid #000; padding: 6px; text-align: center; background: #f9f9f9; 
                }
                
                /* TABLE */
                .staff-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                .staff-table th, .staff-table td { border: 1px solid black; padding: 5px; vertical-align: middle; }
                .staff-table th { background-color: #f0f0f0; text-align: center; font-weight: bold; font-size: 10pt; }
                
                .footer { margin-top: 40px; text-align: right; font-weight: bold; font-size: 11pt; }
                .signature-line { display: inline-block; text-align: center; }

                /* PRINT HIDING */
                @media print {
                    body { background: white; padding: 0; }
                    #controls { display: none !important; }
                    .content-wrapper { box-shadow: none; width: 100%; margin: 0; padding: 0; }
                    @page { margin: 15mm; }
                }
            </style>
        </head>
        <body>
            
            <div id="controls">
                <button class="btn btn-print" onclick="window.print()">🖨️ Print</button>
                <button class="btn btn-download" onclick="downloadPDF()">⬇️ Download PDF</button>
            </div>

            <div class="content-wrapper" id="pdf-content">
                <div class="header">
                    <img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'"> 
                    <div class="college-name">GOVERNMENT VICTORIA COLLEGE, PALAKKAD</div>
                    <div class="address">Kerala, India, PIN 678001 | Affiliation: University of Calicut</div>
                    <div class="meta">📞 0491 2576773 | ✉️ victoriapkd@gmail.com | 🌐 www.gvc.ac.in</div>
                </div>

                <div class="title-section">
                    <div class="designation">Chief Superintendent,<br>University Examinations</div>
                    <div class="doc-number">No: EXAM/${dayDiff}${sessionCode}<br>Date: ${new Date().toLocaleDateString('en-GB')}</div>
                </div>

                <div class="body-text">
                    The following teachers have been assigned invigilation duty for the upcoming Calicut University examinations. 
                    Invigilators are requested to report to the Chief Superintendent's office <strong>30 minutes before</strong> the commencement of the exam.
                    In case of any inconvenience, invigilators must arrange for a substitute and inform the office accordingly.
                </div>

                <div class="highlight-box">
                    EXAM DATE: ${dateStr} &nbsp;|&nbsp; SESSION: ${sessionCode} (${timeStr}) &nbsp;|&nbsp; REPORT BY: ${reportTime}
                </div>

                ${tableContentHtml}

                <div class="footer">
                    <div class="signature-line">Chief Superintendent</div>
                </div>
            </div>

            <script>
                function downloadPDF() {
                    const element = document.getElementById('pdf-content');
                    const btn = document.querySelector('.btn-download');
                    btn.textContent = "Generating...";
                    btn.disabled = true;

                    const opt = {
                        margin: 10, 
                        filename: 'Duty_Notification_${dateStr}.pdf',
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                    };

                    html2pdf().set(opt).from(element).save().then(() => {
                        btn.textContent = "✅ Downloaded";
                        setTimeout(() => { 
                            btn.textContent = "⬇️ Download PDF"; 
                            btn.disabled = false; 
                        }, 2000);
                    });
                }
            <\/script>
        </body>
        </html>
    `);
    w.document.close();
}


// Network Listeners
window.addEventListener('online', () => {
    updateSyncStatus("Back Online", "success");
    // Optional: Trigger a re-fetch if needed, or just let Firestore reconnect automatically
});

window.addEventListener('offline', () => {
    updateSyncStatus("No Internet", "error");
});

// ==========================================
// 📋 STAFF UPCOMING SCHEDULE (Interactive & Auto-Height)
// ==========================================
function renderStaffUpcomingSummary(email) {
    const viewStaff = document.getElementById('view-staff');
    if (!viewStaff) return;

    // 1. Cleanup Old
    const oldBox = document.getElementById('my-upcoming-duties');
    if (oldBox) oldBox.remove();

    // 2. Create/Find Container
    let container = document.getElementById('staff-upcoming-summary');
    if (!container) {
        const statsGrid = viewStaff.querySelector('.grid');
        container = document.createElement('div');
        container.id = 'staff-upcoming-summary';
        container.className = "mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col";

        if (statsGrid && statsGrid.nextSibling) {
            statsGrid.parentNode.insertBefore(container, statsGrid.nextSibling);
        } else {
            viewStaff.appendChild(container);
        }
    }

    // 3. Gather Data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingDuties = [];
    const unavailableDates = [];

    // A. Gather Assignments
    Object.keys(invigilationSlots).forEach(key => {
        const slot = invigilationSlots[key];
        const date = parseDate(key);

        if (date >= today && slot.assigned.includes(email)) {
            const isPosted = slot.exchangeRequests && slot.exchangeRequests.includes(email);
            const label = isPosted ? "⏳ Posted" : "✅ Duty";
            const style = isPosted ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-green-100 text-green-700 border-green-200";

            // --- FIXED ACTION LOGIC ---
            let action = "";
            let hint = "";

            if (isPosted) {
                action = `withdrawExchange('${key}', '${email}')`;
                hint = "Click to Withdraw Request";
            } else if (slot.isLocked) {
                // Only allow exchange if locked
                action = `postForExchange('${key}', '${email}')`;
                hint = "Click to Post for Exchange";
            } else {
                // If unlocked, open details (to allow Cancel)
                const [dStr] = key.split(' | ');
                action = `openDayDetail('${dStr}', '${email}')`;
                hint = "Slot Open: Click to View/Cancel";
            }
            // --------------------------

            upcomingDuties.push({
                date: date,
                key: key,
                label: label,
                style: style,
                details: slot.examName || "University Exam",
                action: action,
                hint: hint,
                isDuty: true
            });
        }
    });

    // B. Gather Inconveniences (Slot Specific)
    Object.keys(invigilationSlots).forEach(key => {
        const slot = invigilationSlots[key];
        const date = parseDate(key);
        const isUnav = slot.unavailable && slot.unavailable.some(u => (typeof u === 'string' ? u === email : u.email === email));

        if (date >= today && isUnav) {
            const [dStr, tStr] = key.split(' | ');
            const sess = tStr.includes("PM") || tStr.startsWith("12") ? "AN" : "FN";
            unavailableDates.push(`${dStr} (${sess})`);
        }
    });

    // C. Gather Inconveniences (Advance)
    Object.keys(advanceUnavailability).forEach(dateStr => {
        const d = parseDate(dateStr + " | 00:00 AM");
        if (d >= today) {
            const entry = advanceUnavailability[dateStr];
            const sessions = [];
            if (entry.FN && entry.FN.some(u => u.email === email)) sessions.push("FN");
            if (entry.AN && entry.AN.some(u => u.email === email)) sessions.push("AN");

            if (sessions.length === 2) {
                unavailableDates.push(`${dateStr} (Whole Day)`);
            } else if (sessions.length > 0) {
                unavailableDates.push(`${dateStr} (${sessions.join(',')})`);
            }
        }
    });

    // 4. Sort
    upcomingDuties.sort((a, b) => a.date - b.date);
    const uniqueUnav = [...new Set(unavailableDates)];

    // 5. Render HTML
    let htmlContent = `
        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-800 text-sm flex justify-between items-center sticky top-0 z-20 shadow-sm">
            <span class="flex items-center gap-2">📋 Your Upcoming Schedule</span>
            <span class="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full shadow-sm">${upcomingDuties.length}</span>
        </div>
    `;

    // Unavailability Warning
    if (uniqueUnav.length > 0) {
        htmlContent += `
            <div class="bg-red-50 px-4 py-3 border-b border-red-100 flex items-start gap-2">
                <span class="text-xs font-bold text-red-600 shrink-0 mt-0.5">⛔ Unavailable:</span>
                <div class="text-xs text-red-700 leading-relaxed font-medium">
                    ${uniqueUnav.join(', ')}
                </div>
            </div>
        `;
    }

    // Duty List Container
    htmlContent += `<div class="overflow-y-auto custom-scroll bg-white" style="max-height: 60vh; height: auto;">`;

    if (upcomingDuties.length === 0) {
        htmlContent += `
            <div class="flex flex-col items-center justify-center py-8 text-center text-gray-400 text-sm italic">
                <svg class="w-10 h-10 mb-2 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                No upcoming duties assigned.
            </div>`;
    } else {
        htmlContent += `<div class="divide-y divide-gray-100">`;
        upcomingDuties.forEach(item => {
            let title = item.key;
            if (item.key.includes('|')) {
                title = item.key.split('|')[1].trim();
            }

            const isToday = item.date.toDateString() === new Date().toDateString();
            const rowBg = isToday ? "bg-blue-50/50" : "hover:bg-indigo-50";

            htmlContent += `
                <div class="p-3 flex items-center justify-between transition cursor-pointer group ${rowBg}" 
                     onclick="${item.action}" title="${item.hint}">
                    
                    <div class="flex items-center gap-3 overflow-hidden">
                         <div class="flex flex-col items-center justify-center w-12 h-12 rounded-lg border border-gray-200 bg-white shadow-sm shrink-0 group-hover:border-indigo-300 transition">
                            <span class="text-[9px] text-red-500 font-bold uppercase leading-none mt-1">${item.date.toLocaleString('en-us', { month: 'short' })}</span>
                            <span class="text-lg font-black text-gray-800 leading-none my-0.5">${item.date.getDate()}</span>
                            <span class="text-[9px] text-gray-400 font-bold uppercase leading-none mb-1">${item.date.toLocaleString('en-us', { weekday: 'short' })}</span>
                        </div>
                        <div class="min-w-0">
                            <div class="text-sm font-bold text-gray-800 truncate group-hover:text-indigo-700 transition">${title}</div>
                            <div class="text-xs text-gray-500 truncate" title="${item.details}">${item.details}</div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col items-end gap-1">
                        <div class="text-[10px] font-bold px-2 py-1 rounded border ${item.style} shrink-0 whitespace-nowrap shadow-sm">
                            ${item.label}
                        </div>
                        <div class="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition">
                            ${item.label.includes('Posted') ? 'Withdraw' : (item.action.includes('postForExchange') ? 'Exchange ➝' : 'Details ➝')}
                        </div>
                    </div>
                </div>
            `;
        });
        htmlContent += `</div>`;
    }

    htmlContent += `</div>`;
    container.innerHTML = htmlContent;
}


// --- STAFF PAGINATION LISTENERS ---
const btnStaffPrev = document.getElementById('btn-staff-prev');
const btnStaffNext = document.getElementById('btn-staff-next');

if (btnStaffPrev) {
    btnStaffPrev.addEventListener('click', () => {
        if (currentStaffPage > 1) {
            currentStaffPage--;
            renderStaffTable();
        }
    });
}

if (btnStaffNext) {
    btnStaffNext.addEventListener('click', () => {
        // Logic to check max page is inside renderStaffTable, 
        // but we simply re-render and let it handle boundaries or just increment here
        // To be safe, we increment and render, the function handles bounds.
        currentStaffPage++;
        renderStaffTable();
    });
}

// --- INSTANT SEARCH LISTENER ---
const staffSearchInput = document.getElementById('staff-search');
if (staffSearchInput) {
    staffSearchInput.addEventListener('input', () => {
        currentStaffPage = 1; // Always reset to Page 1 on new search
        renderStaffTable();
    });
}

// --- HoD MONITORING LOGIC (Day & Session Wise) ---
window.openHodMonitorModal = function () {
    const me = staffData.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase());
    if (!me) return;

    const dept = me.dept;
    document.getElementById('hod-dept-name').textContent = `${dept} Department Schedule (Upcoming)`;

    const list = document.getElementById('hod-monitor-list');
    list.innerHTML = '<div class="text-center py-10"><span class="animate-spin text-2xl inline-block">⏳</span> <span class="block mt-2 text-sm text-gray-500">Processing schedule...</span></div>';

    window.openModal('hod-monitor-modal');

    setTimeout(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Identify Dept Staff Emails
        const deptStaffEmails = new Set(
            staffData.filter(s => s.dept === dept && s.status !== 'archived').map(s => s.email)
        );

        if (deptStaffEmails.size === 0) {
            list.innerHTML = '<div class="text-center text-gray-400 py-8 italic">No staff found in this department.</div>';
            return;
        }

        // 2. Aggregate Data by Day & Session
        const schedule = {};

        const getDayEntry = (dateObj, dateStr) => {
            // Safety Check: Ensure dateObj is valid before calling toISOString
            if (isNaN(dateObj.getTime())) return null;

            const key = dateObj.toISOString().split('T')[0];
            if (!schedule[key]) {
                schedule[key] = {
                    dateObj: dateObj,
                    dateStr: dateStr,
                    FN: { assigned: [], posted: [], unavailable: [] },
                    AN: { assigned: [], posted: [], unavailable: [] }
                };
            }
            return schedule[key];
        };

        // A. Process Invigilation Slots
        Object.keys(invigilationSlots).forEach(key => {
            // Safety: Ensure key has date part
            if (!key.includes(' | ')) return;

            const date = parseDate(key);
            if (isNaN(date.getTime()) || date < today) return; // Skip Invalid/Past

            const [dStr, tStr] = key.split(' | ');
            const isAN = (tStr.includes("PM") || tStr.startsWith("12:") || tStr.startsWith("12."));
            const sess = isAN ? "AN" : "FN";

            const dayEntry = getDayEntry(date, dStr);
            if (!dayEntry) return;

            const slot = invigilationSlots[key];

            // Assigned & Posted
            slot.assigned.forEach(email => {
                if (deptStaffEmails.has(email)) {
                    dayEntry[sess].assigned.push(email);
                    if (slot.exchangeRequests && slot.exchangeRequests.includes(email)) {
                        dayEntry[sess].posted.push(email);
                    }
                }
            });

            // Slot Unavailable
            if (slot.unavailable) {
                slot.unavailable.forEach(u => {
                    const email = (typeof u === 'string' ? u : u.email);
                    const reason = (typeof u === 'object' ? u.reason : "Unspecified");
                    if (deptStaffEmails.has(email)) {
                        dayEntry[sess].unavailable.push({ email, reason });
                    }
                });
            }
        });

        // B. Process Advance Unavailability (The Fix is Here)
        Object.keys(advanceUnavailability).forEach(dateStr => {
            // 1. Validate Format (Must have dots)
            if (!dateStr || !dateStr.includes('.')) return;

            const [d, m, y] = dateStr.split('.');
            const date = new Date(y, m - 1, d);

            // 2. Validate Date Object
            if (isNaN(date.getTime())) return; 
            if (date < today) return;

            const dayEntry = getDayEntry(date, dateStr);
            if (!dayEntry) return;

            ['FN', 'AN'].forEach(sess => {
                if (advanceUnavailability[dateStr][sess]) {
                    advanceUnavailability[dateStr][sess].forEach(u => {
                        // Handle legacy string vs new object format
                        const email = (typeof u === 'string' ? u : u.email);
                        const reason = (typeof u === 'object' ? u.reason : "OD/Leave");

                        if (deptStaffEmails.has(email)) {
                            // Avoid duplicates
                            const exists = dayEntry[sess].unavailable.some(x => x.email === email);
                            if (!exists) {
                                dayEntry[sess].unavailable.push({ email: email, reason: reason });
                            }
                        }
                    });
                }
            });
        });

        // 3. Sort & Render
        const sortedKeys = Object.keys(schedule).sort();
        let html = "";

        sortedKeys.forEach(dateKey => {
            const dayData = schedule[dateKey];
            const dayName = dayData.dateObj.toLocaleString('en-us', { weekday: 'long' });

            const hasFN = dayData.FN.assigned.length > 0 || dayData.FN.unavailable.length > 0;
            const hasAN = dayData.AN.assigned.length > 0 || dayData.AN.unavailable.length > 0;

            if (!hasFN && !hasAN) return;

            const renderSession = (sessName, data) => {
                if (data.assigned.length === 0 && data.unavailable.length === 0) return "";

                let assignedHtml = "";
                if (data.assigned.length > 0) {
                    assignedHtml = `<div class="mb-2"><span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned / Posted</span><div class="flex flex-wrap gap-1 mt-1">`;
                    data.assigned.forEach(email => {
                        const name = getNameFromEmail(email);
                        const isPosted = data.posted.includes(email);
                        const style = isPosted ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-green-50 text-green-700 border-green-200";
                        const icon = isPosted ? "⏳" : "✅";
                        assignedHtml += `<span class="px-2 py-1 rounded border ${style} text-xs font-bold flex items-center gap-1">${icon} ${name}</span>`;
                    });
                    assignedHtml += `</div></div>`;
                }

                let unavHtml = "";
                if (data.unavailable.length > 0) {
                    unavHtml = `<div><span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unavailable</span><div class="flex flex-wrap gap-1 mt-1">`;
                    data.unavailable.forEach(u => {
                        const name = getNameFromEmail(u.email);
                        unavHtml += `<span class="px-2 py-1 rounded border bg-red-50 text-red-700 border-red-100 text-xs flex items-center gap-1" title="${u.reason}">⛔ ${name} <span class="text-[9px] opacity-75">(${u.reason})</span></span>`;
                    });
                    unavHtml += `</div></div>`;
                }

                return `
                    <div class="flex-1 min-w-[250px] border-l-4 ${sessName.includes('Forenoon') ? 'border-indigo-400' : 'border-purple-400'} bg-white p-3 rounded shadow-sm border border-gray-100">
                        <h5 class="font-bold text-gray-800 text-sm mb-2 border-b border-gray-100 pb-1">${sessName}</h5>
                        ${assignedHtml}
                        ${unavHtml}
                    </div>
                `;
            };

            html += `
                <div class="mb-6 bg-gray-50/50 p-2 rounded-xl">
                    <div class="flex items-center gap-2 mb-2 ml-1">
                        <div class="bg-gray-800 text-white font-bold px-3 py-1 rounded text-xs uppercase tracking-wide shadow-sm">
                            ${dayData.dateStr}
                        </div>
                        <span class="text-xs font-bold text-gray-500 uppercase">${dayName}</span>
                    </div>
                    <div class="flex flex-wrap gap-3">
                        ${renderSession("Forenoon (FN)", dayData.FN)}
                        ${renderSession("Afternoon (AN)", dayData.AN)}
                    </div>
                </div>
            `;
        });

        list.innerHTML = html || '<div class="text-center text-gray-400 py-8 italic border-2 border-dashed border-gray-200 rounded-lg">No upcoming duties or leaves found for this department.</div>';

    }, 50);
}


// --- NEW: Open Dashboard Modal (Admin Side) ---
window.openDashboardInvigModal = function (sessionKey) {
    const slot = invigilationSlots[sessionKey];
    if (!slot) return;

    const [datePart, timePart] = sessionKey.split(' | ');
    document.getElementById('dash-modal-title').textContent = timePart;
    document.getElementById('dash-modal-subtitle').textContent = `${datePart} • ${slot.assigned.length} Staff Assigned`;

    const listContainer = document.getElementById('dash-invig-list');
    listContainer.innerHTML = '';

    if (!slot.assigned || slot.assigned.length === 0) {
        listContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8 text-gray-400">
                <svg class="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                <p class="text-sm">No invigilators assigned yet.</p>
            </div>`;
    } else {
        // Sort alphabetically by name
        const sortedEmails = [...slot.assigned].sort((a, b) => {
            const nameA = (staffData.find(s => s.email === a) || {}).name || a;
            const nameB = (staffData.find(s => s.email === b) || {}).name || b;
            return nameA.localeCompare(nameB);
        });

        sortedEmails.forEach(email => {
            const staff = staffData.find(s => s.email === email) || { name: email.split('@')[0], dept: "Unknown", phone: "" };

            // Phone & WhatsApp Logic (Force +91)
            let waLink = "#";
            let waClass = "opacity-50 cursor-not-allowed grayscale";

            if (staff.phone) {
                let cleanNum = staff.phone.replace(/\D/g, '');
                if (cleanNum.length === 10) cleanNum = '91' + cleanNum; // Add Prefix

                if (cleanNum.length >= 10) {
                    waLink = `https://wa.me/${cleanNum}`;
                    waClass = "hover:bg-green-600 hover:text-white text-green-600 bg-green-50 border-green-200";
                }
            }

            const card = document.createElement('div');
            card.className = "bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition";

            card.innerHTML = `
                <div class="flex items-center gap-3 min-w-0">
                    <div class="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                        ${staff.name.charAt(0)}
                    </div>
                    <div class="min-w-0">
                        <h4 class="font-bold text-gray-800 text-sm truncate">${staff.name}</h4>
                        <p class="text-xs text-gray-500 truncate">${staff.dept}</p>
                    </div>
                </div>
                
                <div class="flex items-center gap-2 pl-2">
                    ${staff.phone ? `<a href="tel:${staff.phone}" class="p-2 rounded-full bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 border border-gray-100 transition"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></a>` : ''}
                    
                    <a href="${waLink}" target="_blank" class="p-2 rounded-full border transition flex items-center justify-center ${waClass}">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </a>
                </div>
            `;
            listContainer.appendChild(card);
        });
    }

    document.getElementById('dashboard-invig-modal').classList.remove('hidden');
}


// Initialize Listeners
setupSearchHandler('att-cs-search', 'att-cs-results', 'att-cs-email', false);
setupSearchHandler('att-sas-search', 'att-sas-results', 'att-sas-email', false);
setupSearchHandler('att-substitute-search', 'att-substitute-results', null, true);

window.filterStaffTable = function () {
    currentStaffPage = 1; // Reset to first page on search
    renderStaffTable();
}
window.switchAdminTab = function (tabName) {
    // 1. Hide All Content
    ['staff', 'slots', 'attendance'].forEach(t => {
        document.getElementById(`tab-content-${t}`).classList.add('hidden');
    });

    // 2. Manage Button Styles
    const tabs = ['staff', 'slots', 'attendance'];
    const activeClasses = ['bg-white', 'text-indigo-600', 'shadow'];
    const inactiveClasses = ['text-gray-500', 'hover:bg-gray-200'];

    tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        if (t === tabName) {
            // activate
            btn.classList.add(...activeClasses);
            btn.classList.remove(...inactiveClasses);
        } else {
            // deactivate
            btn.classList.remove(...activeClasses);
            btn.classList.add(...inactiveClasses);
        }
    });

    // 3. Show Target Content
    document.getElementById(`tab-content-${tabName}`).classList.remove('hidden');
}



function showView(viewName) {
    Object.values(views).forEach(el => el.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
}

// --- VALIDATION HELPER ---
function isActionAllowed(dateInput) {
    let d;
    // Parse DD.MM.YYYY string
    if (typeof dateInput === 'string') {
        const [dd, mm, yyyy] = dateInput.split('.');
        d = new Date(yyyy, mm - 1, dd);
    } else {
        d = dateInput;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(d);
    checkDate.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setMonth(today.getMonth() + 3);

    // 1. Block Past Dates
    if (checkDate < today) {
        alert("🚫 Action Denied: Cannot modify records for past dates.");
        return false;
    }
    // 2. Block Dates > 3 Months in Future
    if (checkDate > maxDate) {
        alert("🚫 Action Denied: You can only manage availability up to 3 months in advance.");
        return false;
    }
    return true;
}

// ==========================================
// 🏖️ VACATION DUTY & SURRENDER REPORT LOGIC (Cloud Sync)
// ==========================================

// NOTE: 'vacationExtraHolidays', 'vacationStart', 'vacationEnd' are defined in Global State at top.

window.openVacationReportModal = function() {
    // 1. Set Inputs from Saved State (or defaults)
    const today = new Date();
    const year = today.getFullYear();
    
    // Use saved values if they exist, otherwise default to April-May
    const startVal = vacationStart || `${year}-04-01`;
    const endVal = vacationEnd || `${year}-05-31`;

    const startInput = document.getElementById('vac-start');
    const endInput = document.getElementById('vac-end');

    startInput.value = startVal;
    endInput.value = endVal;

    // 2. Attach Auto-Save Listeners
    startInput.onchange = saveVacationConfig;
    endInput.onchange = saveVacationConfig;
    
    // 3. Clear Input & Render
    document.getElementById('vac-holiday-input').value = "";
    renderVacationHolidays();
    
    window.openModal('vacation-report-modal');
}

// --- CLOUD SAVING FUNCTION ---
async function saveVacationConfig() {
    const s = document.getElementById('vac-start').value;
    const e = document.getElementById('vac-end').value;
    
    // Update Global State
    vacationStart = s;
    vacationEnd = e;

    const config = {
        start: s,
        end: e,
        holidays: Array.from(vacationExtraHolidays)
    };

    try {
        const ref = doc(db, "colleges", currentCollegeId);
        await updateDoc(ref, { invigVacationConfig: JSON.stringify(config) });
        // Optional: console.log("Vacation config saved.");
    } catch(err) {
        console.error("Failed to save vacation config", err);
    }
}

window.addVacationHoliday = async function() {
    const input = document.getElementById('vac-holiday-input');
    const dateVal = input.value; // YYYY-MM-DD
    
    if (!dateVal) return;

    if (vacationExtraHolidays.has(dateVal)) {
        alert("This date is already in the list.");
        return;
    }

    vacationExtraHolidays.add(dateVal);
    renderVacationHolidays();
    input.value = ""; // Clear input
    
    await saveVacationConfig(); // Save to Cloud
}

window.removeVacationHoliday = async function(dateStr) {
    vacationExtraHolidays.delete(dateStr);
    renderVacationHolidays();
    await saveVacationConfig(); // Save to Cloud
}

function renderVacationHolidays() {
    const list = document.getElementById('vac-holiday-list');
    list.innerHTML = '';

    if (vacationExtraHolidays.size === 0) {
        list.innerHTML = '<span class="text-xs text-gray-400 italic self-center pl-1">No additional holidays added.</span>';
        return;
    }

    // Sort dates for display
    const sortedDates = Array.from(vacationExtraHolidays).sort();

    sortedDates.forEach(dateStr => {
        // Format YYYY-MM-DD -> DD.MM.YYYY
        const [y, m, d] = dateStr.split('-');
        const displayDate = `${d}.${m}.${y}`;

        const item = document.createElement('div');
        item.className = "inline-flex items-center gap-2 bg-white border border-indigo-200 text-indigo-700 px-3 py-1 rounded-full shadow-sm text-xs font-bold";
        item.innerHTML = `
            <span>${displayDate}</span>
            <button onclick="removeVacationHoliday('${dateStr}')" class="text-indigo-400 hover:text-red-500 font-black leading-none transition text-sm focus:outline-none">&times;</button>
        `;
        list.appendChild(item);
    });
}

window.generateVacationReport = function() {
    const startStr = document.getElementById('vac-start').value;
    const endStr = document.getElementById('vac-end').value;

    if (!startStr || !endStr) return alert("Please select start and end dates.");

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    
    // Helper: Check if date is Holiday
    const isHoliday = (d) => {
        const day = d.getDay();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateString = `${yyyy}-${mm}-${dd}`; // Check against YYYY-MM-DD format in Set

        // Saturday (6) or Sunday (0) OR in Extra List
        return (day === 0 || day === 6 || vacationExtraHolidays.has(dateString));
    };

    const reportData = [];

    // 1. ITERATE ALL STAFF
    staffData.forEach(staff => {
        if (staff.status === 'archived') return;

        // 2. FIND DUTIES IN RANGE
        const dutyDates = []; // Stores Date objects (Unique Days)
        const rawSessions = []; // Stores objects for sorting

        Object.keys(invigilationSlots).forEach(key => {
            const slot = invigilationSlots[key];
            const dateObj = parseDate(key);
            
            // Check Range & Attendance
            if (dateObj >= startDate && dateObj <= endDate && slot.attendance && slot.attendance.includes(staff.email)) {
                // Determine Session
                const [dStr, tStr] = key.split(' | ');
                const isAN = (tStr.includes("PM") || tStr.startsWith("12:") || tStr.startsWith("12."));
                const sessCode = isAN ? "AN" : "FN";
                
                // Store raw data for sorting
                rawSessions.push({
                    dateObj: dateObj,
                    isAN: isAN,
                    str: `${dStr} (${sessCode})`
                });

                // Add to unique date list
                const dateKey = dateObj.toDateString();
                if (!dutyDates.some(d => d.toDateString() === dateKey)) {
                    dutyDates.push(dateObj);
                }
            }
        });

        if (dutyDates.length === 0) return; // Skip if no duty

        // 3. SORT DATES & SESSIONS
        dutyDates.sort((a, b) => a - b);
        
        // Sort sessions: Date ASC, then FN before AN
        rawSessions.sort((a, b) => {
            const timeDiff = a.dateObj - b.dateObj;
            if (timeDiff !== 0) return timeDiff;
            return a.isAN ? 1 : -1;
        });

        // 4. CALCULATE INTERVENING HOLIDAYS
        const interveningDates = [];
        
        for (let i = 0; i < dutyDates.length - 1; i++) {
            const current = dutyDates[i];
            const next = dutyDates[i+1];

            // Get dates between
            let temp = new Date(current);
            temp.setDate(temp.getDate() + 1);

            const gapDates = [];
            let isGapValid = true;

            while (temp < next) {
                if (!isHoliday(temp)) {
                    isGapValid = false; // Gap broken by a working day
                    break; 
                }
                gapDates.push(new Date(temp));
                temp.setDate(temp.getDate() + 1);
            }

            // If gap contains ONLY holidays, add them
            if (isGapValid && gapDates.length > 0) {
                gapDates.forEach(gd => interveningDates.push(gd));
            }
        }

        // 5. PREPARE ROW DATA
        const dutyDaysCount = dutyDates.length;
        const interveningCount = interveningDates.length;
        const totalEligible = dutyDaysCount + interveningCount;
        
        // Formats
        const dutyDatesStr = dutyDates.map(d => d.toLocaleDateString('en-GB')).join(', ');
        const sessionsStr = rawSessions.map(s => s.str).join(', ');
        const interveningStr = interveningDates.map(d => d.toLocaleDateString('en-GB')).join(', ');

        reportData.push({
            name: staff.name,
            desig: staff.designation,
            dept: staff.dept,
            phone: staff.phone || "-",
            sessions: sessionsStr,
            dutyDates: dutyDatesStr,
            interveningDates: interveningStr,
            interveningCount: interveningCount,
            totalEligible: totalEligible
        });
    });

    if (reportData.length === 0) return alert("No duty records found for the selected period.");

    // --- SORT REPORT DATA BY DEPARTMENT THEN NAME ---
    reportData.sort((a, b) => {
        const deptA = (a.dept || "").toLowerCase();
        const deptB = (b.dept || "").toLowerCase();
        
        // Primary Sort: Department
        if (deptA < deptB) return -1;
        if (deptA > deptB) return 1;
        
        // Secondary Sort: Name
        return a.name.localeCompare(b.name);
    });

    printVacationReport(reportData, startStr, endStr);
    window.closeModal('vacation-report-modal');
}


function printVacationReport(data, start, end) {
    const collegeName = collegeData.examCollegeName || "_______________ College";
    const [y1, m1, d1] = start.split('-');
    const [y2, m2, d2] = end.split('-');
    const rangeStr = `${d1}.${m1}.${y1} to ${d2}.${m2}.${y2}`;

    let rowsHtml = "";
    data.forEach((row, i) => {
        rowsHtml += `
            <tr>
                <td style="text-align:center;">${i+1}</td>
                <td>
                    <b>${row.name}</b><br>
                    ${row.desig}<br>
                    ${row.dept}<br>
                    <span style="font-size:8pt">Ph: ${row.phone}</span>
                </td>
                <td>${row.sessions}</td>
                <td>${row.dutyDates}</td>
                <td>${row.interveningDates || "-"}</td>
                <td style="text-align:center;">${row.interveningCount}</td>
                <td style="text-align:center; font-weight:bold; font-size:11pt;">${row.totalEligible}</td>
            </tr>
        `;
    });

    const w = window.open('', '_blank');
    w.document.write(`
        <html>
        <head>
            <title>Vacation_Duty_Report</title>
            <style>
                @page { size: A4 landscape; margin: 10mm; }
                body { font-family: 'Times New Roman', serif; padding: 20px; }
                h1, h2, h3 { text-align: center; margin: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10pt; }
                th, td { border: 1px solid black; padding: 6px; vertical-align: top; }
                th { background-color: #f0f0f0; }
                
                .no-print {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .btn-print {
                    background-color: #4F46E5; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 5px; 
                    font-weight: bold; 
                    cursor: pointer;
                    font-size: 14px;
                }
                .btn-print:hover { background-color: #4338CA; }

                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="no-print">
                <button onclick="window.print()" class="btn-print">🖨️ Print Report</button>
            </div>

            <h1>${collegeName}</h1>
            <h2>Vacation Duty & Earned Leave Report</h2>
            <h3>Period: ${rangeStr}</h3>
            
            <table>
                <thead>
                    <tr>
                        <th width="3%">#</th>
                        <th width="20%">Staff Details</th>
                        <th width="35%">Sessions Attended</th>
                        <th width="20%">Duty Dates (Unique)</th>
                        <th width="20%">Intervening Holidays (Claimable)</th>
                        <th width="7%">Hol. Count</th>
                        <th width="10%">Total Eligible</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
            
            <div style="margin-top:50px; display:flex; justify-content:flex-end; padding-right: 50px;">
                <div><b>Chief Superintendent</b></div>
            </div>
        </body>
        </html>
    `);
    w.document.close();
}

// ==========================================
// 🎓 NEW ACADEMIC YEAR LOGIC
// ==========================================

window.startNewAcademicYear = async function() {
    // 1. Initial Warning
    if(!confirm("⚠️ START NEW ACADEMIC YEAR ⚠️\n\nThis will:\n- Reset all Duty Counts to 0\n- Reset all Staff Joining Dates to June 1st\n- Delete all Exam Slots & Attendance records\n- Clear Unavailability & Logs\n\nIt will KEEP:\n- All Staff Profiles (Name, Dept, Phone)\n- Role History & Designations\n- System Settings\n\nDo you want to DOWNLOAD A BACKUP ARCHIVE first? (Highly Recommended)")) {
        return;
    }

    // 2. Trigger Backup
    downloadMasterBackup();

    // 3. Final Security Check
    const check = prompt("🔴 FINAL CONFIRMATION\n\nTo reset duty data for the new year, please type 'RESET' in the box below:");
    if (check !== "RESET") {
        return alert("❌ Action Cancelled. Incorrect confirmation code.");
    }

    const btn = document.querySelector('button[onclick="startNewAcademicYear()"]');
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = "♻️ Resetting System...";
    }
    
    updateSyncStatus("Wiping Session Data...", "neutral");

    try {
        // 4. Reset Local State (Preserving Profiles & Configs)
        
        // A. Calculate New Start Date (June 1st of Current Cycle)
        const acYear = getCurrentAcademicYear();
        const y = acYear.start.getFullYear();
        const m = String(acYear.start.getMonth() + 1).padStart(2, '0');
        const d = String(acYear.start.getDate()).padStart(2, '0');
        const newJoinDate = `${y}-${m}-${d}`; // YYYY-MM-DD format

        // B. Reset Staff Counters & Dates
        staffData = staffData.map(s => ({
            ...s,
            dutiesDone: 0, 
            dutiesAssigned: 0,
            joiningDate: newJoinDate, // <--- RESET JOIN DATE
            // Keep: name, email, phone, dept, designation, roleHistory, preferredDays
        }));

        // C. Wipe Transactional Data
        invigilationSlots = {};
        advanceUnavailability = {};
        vacationStart = "";
        vacationEnd = "";
        vacationExtraHolidays.clear();

        // 5. Update Main Cloud Document
        const collegeRef = doc(db, "colleges", currentCollegeId);
        
        // Update specific fields (Configurations like Roles/Targets are PRESERVED automatically by updateDoc)
        await updateDoc(collegeRef, {
            examStaffData: JSON.stringify(staffData), // Save the reset staff list
            examInvigilationSlots: "{}",              // Wipe slots
            invigAdvanceUnavailability: "{}",         // Wipe leaves
            invigVacationConfig: "{}",                // Wipe vacation settings
            autoAssignLogs: []                        // Clear logic logs
            // NOTE: We do NOT clear 'staffAccessList' so staff can still log in.
        });

        // 6. Clear Activity Log (Sub-collection)
        const logRef = doc(db, "colleges", currentCollegeId, "logs", "activity_log");
        await setDoc(logRef, { entries: [] });

        // 7. Log the Fresh Start (New Log Item)
        await logActivity("System Reset", `Started New Academic Year. Reset duty counts and set all staff joining dates to ${newJoinDate}.`);

        updateSyncStatus("Year Started", "success");
        alert(`✅ New Academic Year Started Successfully.\n\n- All staff joining dates reset to ${newJoinDate}.\n- Duty counts reset to 0.\n- Previous sessions & logs cleared.`);
        
        window.location.reload();

    } catch (e) {
        console.error(e);
        alert("Error resetting system: " + e.message);
        updateSyncStatus("Reset Failed", "error");
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = "⚠️ Start New Academic Year";
        }
    }
}


// ==========================================
// 🟢 LIVE STAFF PRESENCE SYSTEM (Final Corrected Version)
// ==========================================
let globalLiveUsers = {}; 
let presenceUnsubscribe = null;

// OPTIMIZED: Only fetches users active in the last 24 hours
window.initLivePresence = function(myEmail, myName, isAdmin) {
    if (!currentCollegeId || !myEmail) return;

    const myRef = doc(db, "colleges", currentCollegeId, "live_presence", myEmail);
    const platform = window.innerWidth < 768 ? "Mobile" : "Desktop";
    
    const sendHeartbeat = (statusOverride) => {
        const status = statusOverride || 'online';
        setDoc(myRef, {
            name: myName,
            email: myEmail,
            lastSeen: serverTimestamp(), // Server-side time
            device: platform,
            status: status
        }, { merge: true });
    };

    sendHeartbeat('online');
    setInterval(() => {
        if (document.visibilityState === 'visible') sendHeartbeat('online');
    }, 5 * 60 * 1000); 

    window.addEventListener('beforeunload', () => sendHeartbeat('offline'));
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') sendHeartbeat('idle');
        else sendHeartbeat('online');
    });

    // --- ADMIN LISTENER OPTIMIZATION ---
    if (isAdmin) {
        console.log("🟢 Live Presence: Admin Mode (Optimized Listener)");
        
        // 1. Calculate Timestamp for "24 Hours Ago"
        // We only want to download docs of people who have been active recently.
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        const presenceCol = collection(db, "colleges", currentCollegeId, "live_presence");
        
        // 2. Create Query: lastSeen > yesterday
        const q = query(presenceCol, where("lastSeen", ">", yesterday));

        if (presenceUnsubscribe) presenceUnsubscribe();
        
        presenceUnsubscribe = onSnapshot(q, (snapshot) => {
            const now = Date.now();
            globalLiveUsers = {}; 
            let onlineCount = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                if (!data.lastSeen) return;

                // Handle Firestore Timestamp vs Date
                const lastSeenTime = data.lastSeen.toMillis ? data.lastSeen.toMillis() : new Date(data.lastSeen).getTime();
                const diffMinutes = (now - lastSeenTime) / 1000 / 60;

                if (data.status === 'offline') {
                     globalLiveUsers[data.email] = { status: 'offline', device: data.device || 'Desktop' };
                } else if (diffMinutes < 6) { 
                    globalLiveUsers[data.email] = { status: data.status || 'online', device: data.device || 'Desktop' };
                    if (data.status !== 'idle') onlineCount++;
                } else if (diffMinutes < 30) {
                    globalLiveUsers[data.email] = { status: 'idle', device: data.device || 'Desktop' };
                } else {
                    globalLiveUsers[data.email] = { status: 'offline', device: data.device || 'Desktop' };
                }
            });

            updateLiveStaffWidget(onlineCount);
            
            // Debounced Render (prevent spam updates)
            if (window.renderTimeout) clearTimeout(window.renderTimeout);
            window.renderTimeout = setTimeout(() => {
                if (typeof renderSlotsGridAdmin === 'function') renderSlotsGridAdmin();
                if (typeof renderStaffTable === 'function') renderStaffTable(); 
            }, 500);
        });

    } else {
        console.log("🟢 Live Presence: Staff Mode (Broadcasting only)");
    }
};

// 2. HELPER: Get Status Dot
window.getLiveStatusIcon = function(email) {
    const user = globalLiveUsers[email];
    if (!user) return `<span class="text-gray-300 opacity-20" title="Offline">⚪</span>`;

    if (user.status === 'online') {
        const icon = user.device === 'Mobile' ? '📱' : '🟢';
        return `<span class="animate-pulse text-green-500 font-bold" title="Online now">${icon}</span>`;
    } 
    if (user.status === 'idle') {
        return `<span class="text-yellow-500" title="Idle">🟡</span>`;
    }
    return `<span class="text-gray-300 opacity-20" title="Offline">⚪</span>`;
};

// 3. UI: Floating Widget
function updateLiveStaffWidget(count) {
    let widget = document.getElementById('live-staff-widget');
    
    if (!widget) {
        widget = document.createElement('div');
        widget.id = 'live-staff-widget';
        widget.className = "fixed bottom-4 left-4 bg-white/95 backdrop-blur border border-green-200 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 z-50 cursor-pointer hover:scale-105 transition-transform group";
        widget.onclick = showLiveStaffModal;
        document.body.appendChild(widget);
    }

    if (count > 0) {
        widget.innerHTML = `
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span class="text-xs font-bold text-green-800">${count} Staff Online</span>
        `;
        widget.classList.remove('hidden');
    } else {
        widget.classList.add('hidden');
    }
}

// 4. UI: Show List Modal
window.showLiveStaffModal = function() {
    const online = [];
    Object.keys(globalLiveUsers).forEach(email => {
        const u = globalLiveUsers[email];
        const staffRec = staffData.find(s => s.email === email);
        const name = staffRec ? staffRec.name : (u.name || email.split('@')[0]);
        if (u.status === 'online') online.push({name, device: u.device});
    });

    let html = `
        <div class="space-y-2">
            <h4 class="font-bold text-green-700 border-b pb-1 mb-2">Active Staff (${online.length})</h4>
            <div class="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                ${online.map(u => `
                    <div class="flex items-center gap-2 text-sm p-1 hover:bg-gray-50 rounded">
                        <span>${u.device === 'Mobile' ? '📱' : '💻'}</span>
                        <span class="font-medium">${u.name}</span>
                    </div>
                `).join('')}
                ${online.length === 0 ? '<div class="text-gray-400 italic text-xs">No active staff.</div>' : ''}
            </div>
        </div>
    `;

    if(typeof UiModal !== 'undefined') UiModal.show("Live Status", html);
    else alert(online.map(o => o.name).join('\n'));
};
// ==========================================
// 📄 PDF GENERATION LOGIC (Added V25)
// ==========================================

// 1. ATTENDANCE REGISTER PDF
window.downloadAttendancePDF = function () {
    if (!confirm("Download Attendance Register PDF?")) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const acYear = getCurrentAcademicYear();
    const collegeName = collegeData.examCollegeName || "Government Victoria College";
    
    // --- Data Gathering (Same as Print) ---
    const facultyMap = new Map();
    const sortedKeys = Object.keys(invigilationSlots).sort((a, b) => parseDate(a) - parseDate(b));

    sortedKeys.forEach(key => {
        const slot = invigilationSlots[key];
        const dateObj = parseDate(key);
        if (dateObj < acYear.start || dateObj > acYear.end) return;
        if (!slot.attendance || slot.attendance.length === 0) return;

        const [dateStr, timeStr] = key.split(' | ');
        const sessionType = (timeStr.includes("PM") || timeStr.startsWith("12")) ? "AN" : "FN";

        slot.attendance.forEach(email => {
            if (!facultyMap.has(email)) {
                const staff = staffData.find(s => s.email === email);
                facultyMap.set(email, {
                    name: staff ? staff.name : getNameFromEmail(email),
                    dept: staff ? staff.dept : "N/A",
                    designation: staff ? staff.designation : "N/A",
                    sessions: []
                });
            }
            facultyMap.get(email).sessions.push(`${dateStr} (${sessionType})`);
        });
    });

    const facultyData = Array.from(facultyMap.values()).sort((a, b) => {
        if (a.dept !== b.dept) return a.dept.localeCompare(b.dept);
        return a.name.localeCompare(b.name);
    });

    if (facultyData.length === 0) return alert("No attendance records found.");

    // --- Table Body ---
    const tableData = facultyData.map((f, index) => [
        index + 1,
        f.name,
        f.dept,
        f.designation,
        f.sessions.length,
        f.sessions.join(', ')
    ]);

    // --- Generate PDF ---
    // Header
    doc.setFillColor(30, 41, 59); // Dark Blue Header
    doc.rect(0, 0, 210, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(collegeName.toUpperCase(), 14, 10);
    
    doc.setFontSize(10);
    doc.text(`Faculty Attendance Register: AY ${acYear.label}`, 14, 18);
    
    // Table
    doc.autoTable({
        head: [['#', 'Name', 'Dept', 'Desig', 'Count', 'Sessions Attended']],
        body: tableData,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 40 },
            4: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
            5: { cellWidth: 'auto' }
        }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text("Senior Asst. Superintendent", 14, finalY);
    doc.text("Chief Superintendent", 150, finalY);

    doc.save(`Attendance_Register_${acYear.label}.pdf`);
};


// 2. VACATION REPORT PDF (Corrected: 7 Columns)
window.downloadVacationPDF = function() {
    const startStr = document.getElementById('vac-start').value;
    const endStr = document.getElementById('vac-end').value;

    if (!startStr || !endStr) return alert("Please select start and end dates.");
    
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    // Helper: Check for Holidays (Sundays, Saturdays, Extra Holidays)
    const isHoliday = (d) => {
        const day = d.getDay();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateString = `${yyyy}-${mm}-${dd}`;
        return (day === 0 || day === 6 || vacationExtraHolidays.has(dateString));
    };

    const reportData = [];

    // --- 1. GATHER DATA (Exact match to Print Logic) ---
    staffData.forEach(staff => {
        if (staff.status === 'archived') return;

        const dutyDates = [];   // For unique dates count
        const rawSessions = []; // For displaying FN/AN details

        Object.keys(invigilationSlots).forEach(key => {
            const slot = invigilationSlots[key];
            const dateObj = parseDate(key);
            
            // Check Range & Attendance
            if (dateObj >= startDate && dateObj <= endDate && slot.attendance && slot.attendance.includes(staff.email)) {
                const [dStr, tStr] = key.split(' | ');
                const isAN = (tStr.includes("PM") || tStr.startsWith("12:") || tStr.startsWith("12."));
                const sessCode = isAN ? "AN" : "FN";
                
                // Add Session Detail
                rawSessions.push({
                    dateObj: dateObj,
                    isAN: isAN,
                    str: `${dStr} (${sessCode})`
                });

                // Add to Unique Dates
                const dateKey = dateObj.toDateString();
                if (!dutyDates.some(d => d.toDateString() === dateKey)) {
                    dutyDates.push(dateObj);
                }
            }
        });

        if (dutyDates.length === 0) return;

        // Sort Dates & Sessions
        dutyDates.sort((a, b) => a - b);
        rawSessions.sort((a, b) => {
            const timeDiff = a.dateObj - b.dateObj;
            if (timeDiff !== 0) return timeDiff;
            return a.isAN ? 1 : -1;
        });

        // Calculate Intervening Holidays
        const interveningDates = [];
        for (let i = 0; i < dutyDates.length - 1; i++) {
            const current = dutyDates[i];
            const next = dutyDates[i+1];
            let temp = new Date(current); temp.setDate(temp.getDate() + 1);
            const gapDates = [];
            let isGapValid = true;

            while (temp < next) {
                if (!isHoliday(temp)) { isGapValid = false; break; }
                gapDates.push(new Date(temp));
                temp.setDate(temp.getDate() + 1);
            }
            if (isGapValid && gapDates.length > 0) {
                gapDates.forEach(gd => interveningDates.push(gd));
            }
        }

        // Formats
        const sessionsStr = rawSessions.map(s => s.str).join(', ');
        const dutyDatesStr = dutyDates.map(d => d.toLocaleDateString('en-GB')).join(', ');
        const interveningStr = interveningDates.map(d => d.toLocaleDateString('en-GB')).join(', ');

        reportData.push({
            name: staff.name,
            desig: staff.designation || "",
            dept: staff.dept || "",
            phone: staff.phone || "-",
            sessions: sessionsStr,
            dutyDates: dutyDatesStr,
            interveningDates: interveningStr || "-",
            interveningCount: interveningDates.length,
            total: dutyDates.length + interveningDates.length
        });
    });

    if (reportData.length === 0) return alert("No duties found in range.");

    // Sort by Dept, then Name
    reportData.sort((a, b) => a.dept.localeCompare(b.dept) || a.name.localeCompare(b.name));

    // --- 2. GENERATE PDF ---
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" }); 
    const collegeName = collegeData.examCollegeName || "College";

    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 297, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(collegeName.toUpperCase(), 14, 10);
    
    doc.setFontSize(12);
    doc.text(`Vacation Duty & Earned Leave Report`, 14, 18);
    doc.text(`${startStr} to ${endStr}`, 240, 18);

    // Table Body (7 Columns)
    const tableBody = reportData.map((r, i) => [
        i + 1,
        `${r.name}\n${r.desig}\n${r.dept}\nPh: ${r.phone}`, // Combined Staff Details
        r.sessions,         // Sessions Attended
        r.dutyDates,        // Unique Dates
        r.interveningDates, // Intervening Holidays
        r.interveningCount, // Hol. Count
        r.total             // Total Eligible
    ]);

    doc.autoTable({
        head: [['#', 'Staff Details', 'Sessions Attended', 'Duty Dates', 'Intervening Holidays', 'Hol.', 'Total']],
        body: tableBody,
        startY: 30,
        theme: 'grid',
        headStyles: { 
            fillColor: [30, 41, 59], 
            textColor: 255, 
            fontStyle: 'bold',
            halign: 'center'
        },
        styles: { 
            fontSize: 9, 
            cellPadding: 3, 
            valign: 'top', // Top align for multiline text
            overflow: 'linebreak'
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' }, // Index
            1: { cellWidth: 50 },                   // Staff Details (Wider)
            2: { cellWidth: 60 },                   // Sessions (Widest)
            3: { cellWidth: 40 },                   // Duty Dates
            4: { cellWidth: 40 },                   // Intervening
            5: { cellWidth: 15, halign: 'center' }, // Count
            6: { cellWidth: 20, halign: 'center', fontStyle: 'bold', fillColor: [240, 253, 244] } // Total (Greenish)
        }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text("Chief Superintendent", 250, finalY);

    doc.save(`Vacation_Report_${startStr}_${endStr}.pdf`);
    window.closeModal('vacation-report-modal');
};

//handles the "View List" click from the ghost card.

window.openGhostUnavailabilityModal = function(title, encodedList) {
    try {
        const list = JSON.parse(decodeURIComponent(encodedList));
        
        let htmlContent = `<div class="p-4"><h3 class="font-bold text-lg mb-3 border-b pb-2">⛔ Unavailability: ${title}</h3>`;
        
        if (list.length === 0) {
            htmlContent += `<p class="text-gray-500">No records found.</p>`;
        } else {
            htmlContent += `<div class="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">`;
            list.forEach(u => {
                const email = (typeof u === 'string') ? u : u.email;
                const reason = (typeof u === 'object' && u.reason) ? u.reason : "Marked Unavailable";
                const name = getNameFromEmail(email) || email;
                
                htmlContent += `
                    <div class="flex justify-between items-center bg-red-50 p-2 rounded border border-red-100">
                        <span class="font-bold text-red-900 text-sm">${name}</span>
                        <span class="text-xs text-red-600 bg-white px-2 py-1 rounded border border-red-100 shadow-sm">${reason}</span>
                    </div>`;
            });
            htmlContent += `</div>`;
        }
        
        htmlContent += `<div class="mt-4 text-right"><button onclick="closeModal('custom-ghost-modal')" class="bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-700">Close</button></div></div>`;

        // Use a generic modal container if available, or create one dynamically
        let modal = document.getElementById('custom-ghost-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-ghost-modal';
            modal.className = "fixed inset-0 bg-black/50 z-50 flex items-center justify-center hidden backdrop-blur-sm";
            modal.innerHTML = `<div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all" id="custom-ghost-content"></div>`;
            document.body.appendChild(modal);
        }
        
        document.getElementById('custom-ghost-content').innerHTML = htmlContent;
        modal.classList.remove('hidden');

    } catch (e) {
        alert("Error opening list: " + e.message);
    }
};

// Helper to close the specific ghost modal
window.closeModal = function(id) {
    const m = document.getElementById(id);
    if(m) m.classList.add('hidden');
};




// ==========================================
// 📧 BULK EMAIL LOGIC HANDLERS
// ==========================================

// Global Queue
window.currentEmailQueue = [];


// --- 1. STAFF BULK MESSAGING UI (Fixed) ---
window.triggerBulkStaffEmail = function(monthStr, weekNum) {
    const list = document.getElementById('notif-list-container');
    const subtitle = document.getElementById('notif-modal-subtitle');
    
    subtitle.textContent = "Review drafts. Use 'Send All' to auto-email via System.";
    list.innerHTML = '<div class="text-center py-8"><span class="animate-spin text-2xl">⏳</span></div>';

    // 1. Gather & Group Data
    const dutiesByEmail = {};
    window.currentEmailQueue = []; // Reset Queue

    // --- FIX: Safe College Name Retrieval ---
    const collegeName = localStorage.getItem('examCollegeName') || "University of Calicut";

    Object.keys(invigilationSlots).forEach(key => {
        if (invigilationSlots[key].isHidden) return;
        const date = parseDate(key);
        const mStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const wNum = getWeekOfMonth(date);

        if (mStr === monthStr && wNum === weekNum) {
            const [dStr, tStr] = key.split(' | ');
            const isAN = (tStr.includes("PM") || tStr.startsWith("12:") || tStr.startsWith("13:") || tStr.startsWith("14:"));
            const sessionCode = isAN ? "AN" : "FN";
            const dayName = date.toLocaleString('en-us', { weekday: 'short' });
            
            invigilationSlots[key].assigned.forEach(email => {
                if (!dutiesByEmail[email]) dutiesByEmail[email] = [];
                dutiesByEmail[email].push({ date: dStr, day: dayName, session: sessionCode, time: tStr });
            });
        }
    });

    if (Object.keys(dutiesByEmail).length === 0) {
        list.innerHTML = `<div class="text-center text-gray-500 py-8">No invigilation duties found for this week.</div>`;
        return;
    }

    // 2. Prepare Data & Queue
    const sortedEmails = Object.keys(dutiesByEmail).sort((a, b) => getNameFromEmail(a).localeCompare(getNameFromEmail(b)));

    sortedEmails.forEach((email, index) => {
        const duties = dutiesByEmail[email].sort((a, b) => {
            const d1 = a.date.split('.').reverse().join('');
            const d2 = b.date.split('.').reverse().join('');
            return d1.localeCompare(d2) || a.session.localeCompare(b.session);
        });

        const staff = staffData.find(s => s.email === email);
        const name = staff ? staff.name : getNameFromEmail(email);

        // Generate Beautiful Email Body (HTML)
        const dutyLines = duties.map(d => `   • ${d.date} (${d.day}) - ${d.session} [${d.time}]`).join('<br>'); // Use <br> for HTML email
        const subject = `Exam Duty Assignment - Week ${weekNum}`;
        const btnId = `email-btn-${index}`;
        
        // Use the HTML Email Generator Helper (Defined below)
        const bodyHTML = window.generateHtmlEmailBody(name, duties);

        // Add to Queue
        window.currentEmailQueue.push({
            id: index,
            email: email,
            name: name,
            subject: subject,
            body: bodyHTML, // Send HTML to Apps Script
            duties: duties,  // Keep raw data for WhatsApp generation
            btnId: btnId,
            status: 'pending'
        });
    });

    // 3. Render List with Bulk Button
    let html = `
    <div class="flex flex-col gap-3 mb-4 border-b border-gray-100 pb-4">
        <div class="flex items-center justify-between">
            <button onclick="openWeeklyNotificationModal('${monthStr}', ${weekNum})" class="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg> Back
            </button>
            <span class="text-xs font-bold text-gray-500">${window.currentEmailQueue.length} Staff Members</span>
        </div>
        
        <button onclick="confirmBulkSend()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transition transform active:scale-95">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            Send Emails to All (${window.currentEmailQueue.length})
        </button>
        
        <div id="bulk-progress-container" class="hidden mt-2">
            <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div id="bulk-progress-fill" class="bg-indigo-600 h-2.5 rounded-full" style="width: 0%"></div>
            </div>
            <p id="bulk-status-text" class="text-xs text-center text-gray-500 mt-1">Ready</p>
        </div>
    </div>

    <div class="space-y-3 max-h-[55vh] overflow-y-auto pr-1 custom-scroll">`;

    // 4. Render Individual Items
    window.currentEmailQueue.forEach((item, index) => {
        const staff = staffData.find(s => s.email === item.email);
        const phone = staff ? (staff.phone || "") : "";
        
        // WA Logic
        let waLink = "#";
        let waClass = "opacity-30 cursor-not-allowed grayscale bg-gray-100 text-gray-400";
        
        if (phone) {
            let cleanNum = phone.replace(/\D/g, '');
            if (cleanNum.length === 10) cleanNum = '91' + cleanNum;
            if (cleanNum.length >= 10) {
                // Use the NEW generator for the link
                const waMsg = generateWeeklyWhatsApp(item.name, item.duties);
                waLink = `https://wa.me/${cleanNum}?text=${encodeURIComponent(waMsg)}`;
                waClass = "bg-[#25D366] hover:bg-[#128C7E] text-white border-transparent";
            }
        }

        const emailBtnState = item.email ? "bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50" : "bg-gray-100 text-gray-400 cursor-not-allowed";

        html += `
        <div class="bg-white border border-gray-200 p-3 rounded-lg shadow-sm hover:shadow-md transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <div class="font-bold text-gray-800 text-sm truncate">${item.name}</div>
                    ${!phone ? '<span class="text-[9px] text-red-400 bg-red-50 px-1 rounded">No Phone</span>' : ''}
                </div>
                <div class="text-xs text-gray-500 mt-0.5">${item.duties.length} Session(s)</div>
                <div id="status-msg-${item.id}" class="text-[9px] text-gray-400 mt-1">Pending</div>
            </div>
            
            <div class="flex gap-2 w-full sm:w-auto">
                <a href="${waLink}" target="_blank" class="${waClass} px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center justify-center gap-1 flex-1 sm:flex-none transition border">
                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></path></svg>
                    WhatsApp
                </a>

                <button id="${item.btnId}" onclick="sendIndividualEmail(${index})" ${item.email ? '' : 'disabled'} class="${emailBtnState} px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center justify-center gap-1 flex-1 sm:flex-none transition">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    Email
                </button>
            </div>
        </div>`;
    });

    html += `</div>`;
    list.innerHTML = html;
};


// Global Queue for Departments
window.currentDeptEmailQueue = [];


// --- 2. DEPARTMENT BULK MESSAGING UI (APPS SCRIPT) ---
window.triggerBulkDeptEmail = function(monthStr, weekNum) {
    const list = document.getElementById('notif-list-container');
    const subtitle = document.getElementById('notif-modal-subtitle');

    subtitle.textContent = "Send consolidated summaries via System (AppScript).";
    list.innerHTML = '<div class="text-center py-8"><span class="animate-spin text-2xl">⏳</span></div>';

    // 1. Gather Raw Duty Data by Dept
    const rawDeptDuties = {}; 
    window.currentDeptEmailQueue = []; // Reset Queue
    
    Object.keys(invigilationSlots).forEach(key => {
        if (invigilationSlots[key].isHidden) return;
        const date = parseDate(key);
        const mStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const wNum = getWeekOfMonth(date);

        if (mStr === monthStr && wNum === weekNum) {
            const [dStr, tStr] = key.split(' | ');
            const isAN = (tStr.includes("PM") || tStr.startsWith("12:"));
            const session = isAN ? "AN" : "FN";

            invigilationSlots[key].assigned.forEach(email => {
                const staff = staffData.find(s => s.email === email);
                const dept = staff ? (staff.dept || "Unassigned") : "Unassigned";
                const name = staff ? staff.name : getNameFromEmail(email);

                if (!rawDeptDuties[dept]) rawDeptDuties[dept] = [];
                // Store raw duty info
                rawDeptDuties[dept].push({ name, date: dStr, session, time: tStr });
            });
        }
    });

    if (Object.keys(rawDeptDuties).length === 0) {
        list.innerHTML = `<div class="text-center text-gray-500 py-8">No department data found.</div>`;
        return;
    }

    // 2. Process Departments
    const sortedDepts = Object.keys(rawDeptDuties).sort();
    
    sortedDepts.forEach((dept, index) => {
        const entries = rawDeptDuties[dept];
        
        // 2.1 GROUP BY FACULTY NAME (Crucial Step for Generator)
        // Transform [ {name:'A',...}, {name:'A',...} ]  -->  [ {name:'A', duties:[...]} ]
        const facultyMap = {};
        entries.forEach(e => {
            if (!facultyMap[e.name]) {
                facultyMap[e.name] = { name: e.name, duties: [] };
            }
            facultyMap[e.name].duties.push({ date: e.date, session: e.session, time: e.time });
        });
        const groupedFacultyList = Object.values(facultyMap); // This is what the generator expects

        // Find HOD Email
        let hodEmail = "";
        if (typeof departmentsConfig !== 'undefined') {
            const deptCfg = departmentsConfig.find(d => (typeof d === 'object' ? d.name : d) === dept);
            if (deptCfg && deptCfg.email) hodEmail = deptCfg.email;
        }

        // Generate HTML Body
        const htmlBody = generateDepartmentConsolidatedEmail(dept, groupedFacultyList, weekNum, monthStr);
        const subject = `Consolidated Duty List: ${dept} - Week ${weekNum}`;

        // Add to Queue
        window.currentDeptEmailQueue.push({
            id: index,
            dept: dept,
            email: hodEmail,
            subject: subject,
            body: htmlBody,
            count: groupedFacultyList.length, // Count of distinct faculty
            status: 'pending',
            btnId: `btn-dept-${index}`,
            statusId: `status-dept-${index}`
        });
    });

    // 3. Render List with Bulk Button
    let html = `
    <div class="flex flex-col gap-3 mb-4 border-b border-gray-100 pb-4 sticky top-0 bg-white z-10 pt-2">
        <div class="flex items-center justify-between">
            <button onclick="openWeeklyNotificationModal('${monthStr}', ${weekNum})" class="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg> Back
            </button>
            <span class="text-xs font-bold text-gray-500">${window.currentDeptEmailQueue.length} Departments</span>
        </div>
        
        <button id="btn-bulk-dept-send" onclick="sendBulkDeptEmails()" class="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transition transform active:scale-95">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            Send All to Departments
        </button>
        <div id="dept-progress-bar" class="hidden mt-3 w-full bg-gray-200 rounded-full h-2.5">
            <div id="dept-progress-fill" class="bg-teal-600 h-2.5 rounded-full" style="width: 0%"></div>
        </div>
        <p id="dept-status-text" class="text-xs text-center text-gray-500 mt-2 hidden">Initializing...</p>
    </div>

    <div class="space-y-3 max-h-[55vh] overflow-y-auto pr-1 custom-scroll">`;

    // 4. Render Individual Cards
    window.currentDeptEmailQueue.forEach((item) => {
        const noEmail = !item.email;
        const btnState = noEmail ? "disabled opacity-50 bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-600 hover:text-white";
        const emailLabel = noEmail ? "No Email" : "Send Mail";

        html += `
        <div class="bg-white border border-gray-200 p-3 rounded-lg shadow-sm hover:shadow-md transition flex justify-between items-center group">
            <div class="min-w-0 pr-2">
                <div class="font-bold text-gray-800 text-sm truncate">${item.dept}</div>
                <div class="text-xs text-gray-500 mt-0.5 truncate">${item.count} Faculty Involved</div>
                <div class="text-[10px] ${noEmail ? 'text-red-500 italic' : 'text-teal-600'} mt-1">
                    ${noEmail ? 'Email address not found' : item.email}
                </div>
                <div id="${item.statusId}" class="text-[10px] text-gray-400 mt-1 font-mono hidden"></div>
            </div>
            
            <button id="${item.btnId}" onclick="sendSingleDeptEmail(${item.id})" class="${btnState} px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center gap-1 transition shrink-0 border">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <span>${emailLabel}</span> 
            </button>
        </div>`;
    });

    html += `</div>`;
    list.innerHTML = html;
};





// --- HELPER: Generate Weekly WhatsApp (Professional + Exchange Link) ---
window.generateWeeklyWhatsApp = function(name, duties) {
    const now = new Date();
    const hours = now.getHours();
    
    // 1. Polite Time-Based Greeting
    let greeting = "Greetings";
    if (hours < 12) greeting = "Good Morning";
    else if (hours < 16) greeting = "Good Afternoon";
    else greeting = "Good Evening";

    // 2. Get College Name
    const college = (typeof currentCollegeName !== 'undefined' ? currentCollegeName : localStorage.getItem('examCollegeName')) || "GOVERNMENT VICTORIA COLLEGE";
    
    // 3. Build Message
    let msg = `🏛️ *${college.toUpperCase()}*\n`;
    msg += `📝 *INVIGILATION DUTY INTIMATION*\n`;
    msg += `─────────────────────\n\n`;
    
    msg += `${greeting} *${name}*,\n\n`;
    msg += `This is an official intimation regarding your invigilation duties for the upcoming week. Please find the schedule below:\n\n`;

    // 4. Loop through duties
    duties.forEach(d => {
        // Calculate Reporting Time (assumed helper function exists)
        const rTime = window.calculateReportTime ? window.calculateReportTime(d.time) : d.time;

        msg += `🗓 *${d.date}* (${d.day})\n`;
        msg += `⏰ ${d.session} Session  |  ${d.time}\n`;
        msg += `↪️ Report by: *${rTime}*\n`;
        msg += `─────────────────────\n`;
    });

    // 5. General Instructions
    msg += `\n🛑 *GENERAL INSTRUCTIONS:*\n`;
    msg += `1️⃣ Please report to the Chief Superintendent's office *30 minutes prior* to the commencement of the examination.\n`;
    msg += `2️⃣ Mobile phones must be kept in *silent mode* inside the examination hall.\n`;
    msg += `3️⃣ View detailed guidelines: https://bit.ly/gvc-exam\n\n`;
    
    // 6. Exchange Instructions & Link
    msg += `♻️ *DUTY EXCHANGE / ADJUSTMENTS:*\n`;
    msg += `If you are unable to attend a session, please post a request in the Exam Portal:\n`;
    msg += `🔗 *Portal Link:* https://examflow-de08f.web.app/invigilation.html\n\n`;
    msg += `⚠️ *Important:* Posting a request does not exempt you from duty. You remain responsible until a colleague accepts your request.\n\n`;
    
    // 7. Footer
    msg += `Thank you for your cooperation.\n\n`;
    msg += `Regards,\n`;
    msg += `*Chief Superintendent*\n`;
    msg += `Exam Cell, ${college}`;

    return msg;
};



// --- DEPARTMENT SENDING LOGIC (API) ---

// 1. Single Send
window.sendSingleDeptEmail = async function(index) {
    const item = window.currentDeptEmailQueue[index];
    if (!item || !item.email) return;

    if (!googleScriptUrl) return alert("⚠️ Google Apps Script URL not found in settings.");

    if (!confirm(`Send consolidated duty list to ${item.dept} (${item.email})?`)) return;

    const btn = document.getElementById(item.btnId);
    const status = document.getElementById(item.statusId);

    if (btn) { btn.disabled = true; btn.textContent = "..."; }
    if (status) { status.classList.remove('hidden'); status.textContent = "Sending..."; }

    try {
        await fetch(googleScriptUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to: item.email,
                subject: item.subject,
                body: item.body // HTML Body
            })
        });

        // Success Update
        item.status = 'sent';
        if (btn) { 
            btn.innerHTML = "✅ Sent"; 
            btn.classList.remove('bg-teal-50', 'text-teal-700', 'hover:bg-teal-600', 'hover:text-white');
            btn.classList.add('bg-green-100', 'text-green-800', 'border-green-200');
        }
        if (status) { status.textContent = "Sent via System"; status.classList.add('text-green-600'); }
        
        // Log it
        if (typeof logActivity === 'function') logActivity("Dept Email Sent", `Sent consolidated list to ${item.dept}`);

    } catch (e) {
        console.error(e);
        if (btn) { btn.disabled = false; btn.textContent = "Retry"; }
        if (status) { status.textContent = "Failed"; status.classList.add('text-red-500'); }
        alert("Failed to send email. Check internet or API URL.");
    }
};

// 2. Bulk Send
window.sendBulkDeptEmails = async function() {
    const pendingItems = window.currentDeptEmailQueue.filter(i => i.status === 'pending' && i.email);

    if (pendingItems.length === 0) return alert("No valid pending emails to send.");
    if (!confirm(`Start bulk sending to ${pendingItems.length} Departments?`)) return;

    // UI Setup
    const mainBtn = document.getElementById('btn-bulk-dept-send');
    const progressBar = document.getElementById('dept-progress-bar');
    const progressFill = document.getElementById('dept-progress-fill');
    const statusText = document.getElementById('dept-status-text');
    
    // Allow cancellation
    const isCancelled = { value: false }; 
    // You can add a cancel button UI here if desired, similar to staff bulk

    if(mainBtn) mainBtn.classList.add('hidden');
    if(progressBar) progressBar.classList.remove('hidden');
    if(statusText) { statusText.classList.remove('hidden'); statusText.textContent = "Initializing..."; }

    let successCount = 0;

    for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i];
        
        // Update Status
        if(statusText) statusText.textContent = `Sending to ${item.dept} (${i+1}/${pendingItems.length})...`;
        if(progressFill) progressFill.style.width = `${Math.round(((i+1)/pendingItems.length)*100)}%`;

        // Update Row UI
        const rowBtn = document.getElementById(item.btnId);
        const rowStatus = document.getElementById(item.statusId);
        
        if(rowBtn) { rowBtn.textContent = "..."; rowBtn.disabled = true; }
        if(rowStatus) { rowStatus.classList.remove('hidden'); rowStatus.textContent = "Sending..."; }

        try {
            await fetch(googleScriptUrl, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: item.email,
                    subject: item.subject,
                    body: item.body
                })
            });

            successCount++;
            item.status = 'sent';
            
            if(rowBtn) { 
                rowBtn.innerHTML = "✅"; 
                rowBtn.className = "bg-green-100 text-green-800 border-green-200 px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center gap-1 transition shrink-0 border cursor-default";
            }
            if(rowStatus) { rowStatus.textContent = "Sent"; rowStatus.className = "text-[10px] text-green-600 mt-1 font-mono font-bold"; }

        } catch (e) {
            console.error(e);
            if(rowBtn) { rowBtn.textContent = "Failed"; rowBtn.disabled = false; }
            if(rowStatus) { rowStatus.textContent = "Error"; rowStatus.className = "text-[10px] text-red-500 mt-1 font-mono"; }
        }

        // Delay to handle rate limits
        await new Promise(r => setTimeout(r, 1000));
    }

    if(statusText) statusText.textContent = "Completed.";
    alert(`Batch Complete.\nSent to ${successCount} departments.`);
    
    // Log Bulk Action
    if (typeof logActivity === 'function') logActivity("Bulk Dept Email", `Sent consolidated lists to ${successCount} departments.`);
    
    // Reset UI (Optional, keeping progress bar visible shows completion)
};



window.sendSingleEmailFromQueue = function(index) {
    const item = window.currentEmailQueue[index];
    if (!item) return;
    
    // Get the button element
    const btn = document.getElementById(item.btnId);
    
    if (confirm(`Send email to ${item.name}?`)) {
        // Call the main send function
        // Note: 'item.body' contains HTML, so we pass it directly
        // The main function expects (btn, email, name, subject, message)
        // We can pass the HTML as 'message'. The main function might try to replace \n with <br>, 
        // but if we pass HTML, it should be fine or we adjust the main function.
        // Let's adjust the main function call to handle this.
        
        sendSingleEmail(btn, item.email, item.name, item.subject, item.body);
    }
};




// --- HELPER: Send Email via Apps Script ---
async function sendEmailViaAppsScript(to, subject, body) {
    if (!googleScriptUrl) return false;
    try {
        await fetch(googleScriptUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to, subject, body })
        });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

// --- LOGIC: Send Individual Item ---
window.sendIndividualEmail = async function(index) {
    const item = window.currentEmailQueue[index];
    if (!item) return;

    if (!confirm(`Send official email to ${item.name}?`)) return;

    const btn = document.getElementById(item.btnId);
    const statusMsg = document.getElementById(`status-msg-${item.id}`);

    if (btn) { btn.disabled = true; btn.textContent = "..."; }
    if (statusMsg) statusMsg.textContent = "Sending...";

    const success = await sendEmailViaAppsScript(item.email, item.subject, item.body);

    // With no-cors we assume success if no network error thrown
    item.status = 'sent';
    if (statusMsg) { statusMsg.textContent = "✅ Sent"; statusMsg.className = "text-[10px] text-green-600 mt-0.5 font-bold"; }
    if (btn) { btn.innerHTML = "Done"; btn.classList.add('opacity-50'); }
};

// --- LOGIC: Bulk Queue Processor ---
window.processBulkQueue = async function() {
    const pendingItems = window.currentEmailQueue.filter(i => i.status === 'pending' && i.email);
    
    if (pendingItems.length === 0) return alert("No pending emails to send.");
    if (!confirm(`Start bulk sending to ${pendingItems.length} recipients?\n\nKeep this window open until finished.`)) return;

    // UI Setup
    document.getElementById('btn-bulk-send').classList.add('hidden');
    document.getElementById('bulk-progress-container').classList.remove('hidden');
    
    window.isBulkSendingCancelled = false;
    let sentCount = 0;

    for (let i = 0; i < pendingItems.length; i++) {
        if (window.isBulkSendingCancelled) {
            alert(`Process Stopped.\nSent: ${sentCount}`);
            break;
        }

        const item = pendingItems[i];
        
        // Update Status UI
        document.getElementById('bulk-status-text').textContent = `Sending ${i+1}/${pendingItems.length}: ${item.name}`;
        document.getElementById('bulk-progress-fill').style.width = `${((i+1) / pendingItems.length) * 100}%`;

        // Update Row UI
        const rowStatus = document.getElementById(`status-msg-${item.id}`);
        const rowBtn = document.getElementById(item.btnId);
        if(rowStatus) rowStatus.textContent = "Sending...";
        if(rowBtn) { rowBtn.textContent = "..."; rowBtn.disabled = true; }

        await sendEmailViaAppsScript(item.email, item.subject, item.body);

        // Update Row Success
        item.status = 'sent';
        sentCount++;
        if(rowStatus) { rowStatus.textContent = "✅ Sent"; rowStatus.className = "text-[10px] text-green-600 mt-0.5 font-bold"; }
        if(rowBtn) { rowBtn.innerHTML = "Done"; rowBtn.classList.add('opacity-50'); }

        // Delay 1.2s
        await new Promise(r => setTimeout(r, 1200)); 
    }

    document.getElementById('bulk-status-text').textContent = "Process Finished.";
    if (!window.isBulkSendingCancelled) {
        alert(`✅ Bulk Email Complete.\nSuccessfully sent: ${sentCount} emails.`);
    }
    
    // Reset UI
    document.getElementById('btn-bulk-send').classList.remove('hidden');
    document.getElementById('bulk-progress-container').classList.add('hidden');
};

window.cancelBulkSending = function() {
    window.isBulkSendingCancelled = true;
    document.getElementById('bulk-status-text').textContent = "Stopping...";
};

// ==========================================
// 📧 EMAIL HTML GENERATORS
// ==========================================

// 1. Generate HTML for Staff Email (Individual)
window.generateHtmlEmailBody = function(name, duties) {
    const college = localStorage.getItem('examCollegeName') || "EXAMINATION CELL";
    
    let rows = duties.map(d => 
        `<tr>
            <td style="padding:8px;border:1px solid #ddd;font-size:14px;">${d.date}<br><span style="font-size:11px;color:#666;">${d.day}</span></td>
            <td style="padding:8px;border:1px solid #ddd;font-size:14px;"><b>${d.session}</b><br><span style="font-size:11px;color:#666;">${d.time}</span></td>
        </tr>`
    ).join('');

    return `
    <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        <div style="background:#4f46e5;color:white;padding:20px;text-align:center;">
            <h2 style="margin:0;font-size:18px;text-transform:uppercase;">${college}</h2>
            <p style="margin:5px 0 0;font-size:13px;opacity:0.9;">Invigilation Duty Intimation</p>
        </div>
        <div style="padding:20px;">
            <p style="font-size:15px;">Dear <b>${name}</b>,</p>
            <p style="line-height:1.5;">You have been assigned the following exam invigilation duties for this week:</p>
            
            <table style="width:100%;border-collapse:collapse;margin:15px 0;background:#f9fafb;">
                <thead>
                    <tr style="background:#eef2ff;text-align:left;">
                        <th style="padding:10px;border:1px solid #ddd;font-size:12px;color:#4f46e5;">DATE</th>
                        <th style="padding:10px;border:1px solid #ddd;font-size:12px;color:#4f46e5;">SESSION</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>

            <div style="background:#fff1f2;border-left:4px solid #f43f5e;padding:15px;margin-top:20px;font-size:13px;color:#881337;">
                <strong>⚠️ Important Instructions:</strong>
                <ul style="margin:5px 0 0 20px;padding:0;">
                    <li>Please report to the Exam Cell <strong>30 minutes</strong> before the start time.</li>
                    <li>Mobile phones are strictly prohibited inside the exam hall.</li>
                </ul>
            </div>
            
            <p style="font-size:13px;color:#666;margin-top:20px;border-top:1px solid #eee;padding-top:10px;">
                <em>This is an automated system alert. Please do not reply directly to this email.</em>
            </p>
        </div>
    </div>`;
};


// --- ATTENDANCE REPORT - PRINTABLE/PDF ---
window.printAttendanceReport = function () {
    const acYear = getCurrentAcademicYear();
    const facultyMap = new Map();
    const sortedKeys = Object.keys(invigilationSlots).sort((a, b) => parseDate(a) - parseDate(b));

    sortedKeys.forEach(key => {
        const slot = invigilationSlots[key];
        const dateObj = parseDate(key);
        if (dateObj < acYear.start || dateObj > acYear.end) return;
        if (!slot.attendance || slot.attendance.length === 0) return;

        const [dateStr, timeStr] = key.split(' | ');
        const sessionType = (timeStr.includes("PM") || timeStr.startsWith("12")) ? "AN" : "FN";

        slot.attendance.forEach(email => {
            if (!facultyMap.has(email)) {
                const staff = staffData.find(s => s.email === email);
                facultyMap.set(email, {
                    name: staff ? staff.name : getNameFromEmail(email),
                    dept: staff ? staff.dept : "N/A",
                    designation: staff ? staff.designation : "N/A",
                    sessions: []
                });
            }
            facultyMap.get(email).sessions.push({ date: dateStr, session: sessionType });
        });
    });

    const facultyData = Array.from(facultyMap.values()).sort((a, b) => {
        if (a.dept !== b.dept) return a.dept.localeCompare(b.dept);
        return a.name.localeCompare(b.name);
    });

    if (facultyData.length === 0) {
        return alert("No attendance records found for the current Academic Year.");
    }

    const collegeName = collegeData.examCollegeName || "Government Victoria College";
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    let tableRows = '';
    facultyData.forEach((faculty, index) => {
        const sessionsList = faculty.sessions.map(s => {
        const [d, m, y] = s.date.split('.');
        return `${d}.${m}.${y.slice(-2)} (${s.session})`;
    }).join(' ');
        tableRows += `<tr class="report-row"><td class="text-center">${index + 1}</td><td><div class="font-semibold">${faculty.name}</div></td><td>${faculty.dept}</td><td class="text-center">${faculty.designation}</td><td class="text-center font-bold">${faculty.sessions.length}</td><td class="text-xs sessions-cell">${sessionsList}</td></tr>`;
    });

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Faculty Attendance Report - ${acYear.label}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;padding:20px;background:#f5f5f5}.report-container{max-width:1200px;margin:0 auto;background:white;padding:30px;box-shadow:0 2px 10px rgba(0,0,0,0.1);border-radius:8px}.report-header{text-align:center;margin-bottom:30px;border-bottom:3px solid #4F46E5;padding-bottom:20px}.college-name{font-size:24px;font-weight:bold;color:#1F2937;margin-bottom:10px}.report-title{font-size:20px;font-weight:600;color:#4F46E5;margin-bottom:8px}.report-subtitle{font-size:14px;color:#6B7280}.report-table{width:100%;border-collapse:collapse;margin-top:20px}.report-table th{background:#4F46E5;color:white;padding:12px 10px;text-align:left;font-size:13px;font-weight:600;border:1px solid #4338CA}.report-table td{padding:10px;border:1px solid #E5E7EB;font-size:12px;color:#374151}.report-row:nth-child(even){background:#F9FAFB}.report-row:hover{background:#EEF2FF}.sessions-cell{line-height:1.6;color:#6B7280;white-space:normal;word-wrap:break-word}.report-footer{margin-top:30px;padding-top:20px;border-top:1px solid #E5E7EB;text-align:center;font-size:11px;color:#9CA3AF}.control-panel{position:sticky;top:10px;background:white;padding:15px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);margin-bottom:20px;text-align:center;z-index:1000}.print-btn{background:#4F46E5;color:white;border:none;padding:12px 24px;border-radius:6px;font-weight:600;cursor:pointer;font-size:14px;box-shadow:0 2px 4px rgba(79,70,229,0.3)}.print-btn:hover{background:#4338CA}@media print{body{background:white;padding:0}.control-panel{display:none!important}.report-container{box-shadow:none;border-radius:0;padding:10mm;max-width:100%}.report-table{page-break-inside:auto}.report-table td{font-size:10px}.sessions-cell{font-size:9px;line-height:1.4}.report-row{page-break-inside:avoid;page-break-after:auto}.report-table thead{display:table-header-group}.report-table tfoot{display:table-footer-group}@page{margin:15mm;size:A4}}</style></head><body><div class="control-panel"><button onclick="window.print()" class="print-btn">🖨️ Print / Save as PDF</button></div><div class="report-container"><div class="report-header"><div class="college-name">${collegeName}</div><div class="report-title">FACULTY ATTENDANCE REPORT</div><div class="report-subtitle">Academic Year: ${acYear.label} | Generated: ${today}</div></div><table class="report-table"><thead><tr><th style="width:5%;">#</th><th style="width:25%;">Name</th><th style="width:15%;">Department</th><th style="width:15%;">Designation</th><th style="width:10%;text-align:center;">Duties</th><th style="width:30%;">Sessions</th></tr></thead><tbody>${tableRows}</tbody></table><div class="report-footer"><div>Total Faculty: ${facultyData.length} | Total Duty Records: ${facultyData.reduce((sum, f) => sum + f.sessions.length, 0)}</div><div>Generated by Invigilation Management System | ${collegeName}</div></div></div></body></html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
};
