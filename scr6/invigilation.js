import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, orderBy, onSnapshot }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let designationsConfig = {};
let rolesConfig = {};
let currentCalDate = new Date();
let isAdmin = false;
let cloudUnsubscribe = null;
let advanceUnavailability = {}; // Stores { "DD.MM.YYYY": { FN: [], AN: [] } }
let globalDutyTarget = 2; // Default
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
        await handleLogin(user);
    } else {
        currentUser = null;
        isAdmin = false;
        if (cloudUnsubscribe) cloudUnsubscribe();
        showView('login');
        document.getElementById('auth-section').classList.add('hidden');
    }
});

document.getElementById('login-btn').addEventListener('click', () => signInWithPopup(auth, provider));
document.getElementById('logout-btn').addEventListener('click', () => signOut(auth).then(() => window.location.reload()));

// --- CORE FUNCTIONS ---

async function handleLogin(user) {
    document.getElementById('login-btn').innerText = "Verifying...";

    // 1. Check Admin Access (allowedUsers)
    const collegesRef = collection(db, "colleges");
    const qAdmin = query(collegesRef, where("allowedUsers", "array-contains", user.email));
    const adminSnap = await getDocs(qAdmin);

    if (!adminSnap.empty) {
        // ADMIN LOGIN
        const docSnap = adminSnap.docs[0];
        currentCollegeId = docSnap.id;
        isAdmin = true;
        setupLiveSync(currentCollegeId, 'admin');
        return;
    }

    // 2. Check Staff Access (staffAccessList) - NEW
    const qStaff = query(collegesRef, where("staffAccessList", "array-contains", user.email));
    const staffSnap = await getDocs(qStaff);

    if (!staffSnap.empty) {
        // STAFF LOGIN (Auto Detected)
        const docSnap = staffSnap.docs[0];
        currentCollegeId = docSnap.id;
        isAdmin = false;
        setupLiveSync(currentCollegeId, 'staff');
        return;
    }

    // 3. Fallback: Check Link ID
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('id');
    if (urlId) {
        const docRef = doc(db, "colleges", urlId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const sList = JSON.parse(snap.data().examStaffData || '[]');
            const me = sList.find(s => s.email.toLowerCase() === user.email.toLowerCase());
            if (me) {
                currentCollegeId = urlId;
                isAdmin = false;
                setupLiveSync(currentCollegeId, 'staff');
            } else { alert("Access Denied: Email not in staff list."); signOut(auth); }
        } else { alert("Invalid Link."); signOut(auth); }
    } else {
        alert("Access Denied. You are not listed as Admin or Staff.");
        signOut(auth);
    }
}

function setupLiveSync(collegeId, mode) {
    if (cloudUnsubscribe) cloudUnsubscribe();

    const docRef = doc(db, "colleges", collegeId);

    cloudUnsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            updateSyncStatus("Synced", "success");
            collegeData = docSnap.data();

            // CONFIGS
            designationsConfig = JSON.parse(collegeData.invigDesignations || JSON.stringify(DEFAULT_DESIGNATIONS));
            const savedRoles = JSON.parse(collegeData.invigRoles || '{}');
            rolesConfig = { ...DEFAULT_ROLES, ...savedRoles };
            googleScriptUrl = collegeData.invigGoogleScriptUrl || "";
            departmentsConfig = JSON.parse(collegeData.invigDepartments || JSON.stringify(DEFAULT_DEPARTMENTS));

            // DATA
            staffData = JSON.parse(collegeData.examStaffData || '[]');
            invigilationSlots = JSON.parse(collegeData.examInvigilationSlots || '{}');
            advanceUnavailability = JSON.parse(collegeData.invigAdvanceUnavailability || '{}');

            // LOAD GLOBAL TARGET
            if (collegeData.invigGlobalTarget !== undefined) {
                globalDutyTarget = parseInt(collegeData.invigGlobalTarget);
            } else {
                globalDutyTarget = 2; // Default
            }

            googleScriptUrl = collegeData.invigGoogleScriptUrl || "";

            if (mode === 'admin') {
                // --- ADMIN MODE ---
                if (document.getElementById('view-admin').classList.contains('hidden') &&
                    document.getElementById('view-staff').classList.contains('hidden')) {
                    initAdminDashboard();
                } else {
                    updateAdminUI();
                    renderSlotsGridAdmin();
                    renderAdminTodayStats();

                    // Update "View as Staff" Live
                    if (!document.getElementById('view-staff').classList.contains('hidden')) {
                        const me = staffData.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase());
                        if (me) {
                            renderStaffCalendar(me.email);
                            renderStaffRankList(me.email);
                            if (typeof renderExchangeMarket === "function") renderExchangeMarket(me.email);
                            if (typeof renderStaffUpcomingSummary === "function") renderStaffUpcomingSummary(me.email);
                        }
                    }
                }
            } else {
                // --- STAFF MODE ---
                const me = staffData.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase());
                if (me) {
                    if (document.getElementById('view-staff').classList.contains('hidden')) {
                        initStaffDashboard(me);
                    } else {
                        // LIVE REFRESH
                        renderStaffCalendar(me.email);
                        renderStaffRankList(me.email);
                        if (typeof renderExchangeMarket === "function") renderExchangeMarket(me.email);
                        if (typeof renderStaffUpcomingSummary === "function") renderStaffUpcomingSummary(me.email);

                        // UPDATE STATS
                        const done = getDutiesDoneCount(me.email);
                        const pending = Math.max(0, calculateStaffTarget(me) - done);

                        document.getElementById('staff-view-pending').textContent = pending;
                        const completedEl = document.getElementById('staff-view-completed');
                        if (completedEl) completedEl.textContent = done;
                    }
                } else {
                    alert("Your staff profile was removed.");
                    window.location.reload();
                }
            }
        }
    });
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
            const availableDays = staff.preferredDays || [1, 2, 3, 4, 5, 6];
            const dayCount = availableDays.length;

            // Formula: (Available Days / 5 Standard Days) * Global Target
            monthlyRate = (dayCount / 5) * globalDutyTarget;
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

// --- AUTOMATIC EMAIL SYSTEM (Google Apps Script - Fixed) ---
window.sendSingleEmail = function (btn, email, name, subject, message) {
    if (!email) return alert("No email address for this faculty.");
    if (!googleScriptUrl) return alert("⚠️ Email Service Not Configured.\n\nPlease go to 'Settings & Roles' and paste your Google Apps Script Web App URL.");

    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Sending`;
    btn.classList.remove('bg-gray-700', 'hover:bg-gray-800');
    btn.classList.add('bg-gray-400', 'cursor-wait');

    // Convert newlines to <br> for HTML email
    const htmlBody = message.replace(/\n/g, '<br>');

    // Send via Proxy (Google Script)
    // FIX: Use 'text/plain' to avoid CORS Preflight issues
    fetch(googleScriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
            to: email,
            subject: subject,
            body: htmlBody
        })
    })
        .then(() => {
            // Success Assumption (no-cors hides actual response)
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
// --- RENDER ADMIN SLOTS (Responsive Header + Scroll Fix) ---
function renderSlotsGridAdmin() {
    if (!ui.adminSlotsGrid) return;
    ui.adminSlotsGrid.innerHTML = '';

    // 1. Date Headers
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthStr = monthNames[currentAdminDate.getMonth()];
    const currentYear = currentAdminDate.getFullYear();

    // --- NAVIGATION BAR (Compact for Mobile) ---
    const navHtml = `
        <div class="col-span-full flex justify-between items-center bg-white p-2 md:p-3 rounded-lg border border-gray-200 shadow-sm mb-2 sticky top-0 z-30 mx-1 mt-1">
            <button onclick="changeAdminMonth(-1)" class="px-2 py-1.5 md:px-3 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded border border-gray-300 flex items-center gap-1 transition">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                <span class="hidden md:inline">Prev</span>
            </button>
            
            <h3 class="text-sm md:text-lg font-black text-indigo-800 uppercase tracking-wide flex items-center gap-1 md:gap-2 whitespace-nowrap">
                <span>📅</span> ${currentMonthStr} <span class="text-gray-500 text-xs md:text-lg">'${String(currentYear).slice(-2)}</span>
            </h3>
            
            <button onclick="changeAdminMonth(1)" class="px-2 py-1.5 md:px-3 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded border border-gray-300 flex items-center gap-1 transition">
                <span class="hidden md:inline">Next</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
    `;
    ui.adminSlotsGrid.innerHTML = navHtml;

    // 2. Filter Data for Current Month
    const slotItems = [];
    Object.keys(invigilationSlots).forEach(key => {
        const date = parseDate(key);
        if (date.getMonth() === currentAdminDate.getMonth() && date.getFullYear() === currentAdminDate.getFullYear()) {
            slotItems.push({ key, date: date, slot: invigilationSlots[key] });
        }
    });

    // 3. Empty State
    if (slotItems.length === 0) {
        ui.adminSlotsGrid.innerHTML += `
            <div class="col-span-full text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 m-2">
                <p class="text-gray-400 font-medium mb-2">No exam sessions scheduled for ${currentMonthStr}.</p>
                <button onclick="openAddSlotModal()" class="text-indigo-600 font-bold hover:underline text-sm flex items-center justify-center gap-1 mx-auto">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                    Add Slot
                </button>
            </div>`;
        return;
    }

    // 4. Group by Week
    const groupedSlots = {};
    slotItems.forEach(item => {
        const mStr = item.date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const weekNum = getWeekOfMonth(item.date);
        const groupKey = `${mStr}-W${weekNum}`;
        if (!groupedSlots[groupKey]) {
            groupedSlots[groupKey] = { month: mStr, week: weekNum, items: [] };
        }
        groupedSlots[groupKey].items.push(item);
    });

    // 5. Sort Groups
    const sortedGroupKeys = Object.keys(groupedSlots).sort((a, b) => {
        const dateA = groupedSlots[a].items[0].date;
        const dateB = groupedSlots[b].items[0].date;
        return dateA - dateB;
    });

    // 6. Render Groups
    sortedGroupKeys.forEach(gKey => {
        const group = groupedSlots[gKey];

        // Week Header (Compact)
        ui.adminSlotsGrid.innerHTML += `
            <div class="col-span-full mt-3 mb-1 flex flex-wrap justify-between items-center bg-indigo-50 px-3 py-2 rounded border border-indigo-100 shadow-sm mx-1">
                <span class="text-indigo-900 text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-indigo-100">
                    Week ${group.week}
                </span>
                <div class="flex gap-1">
                    <button onclick="openWeeklyNotificationModal('${group.month}', ${group.week})" 
                        class="text-[10px] bg-green-600 text-white border border-green-700 px-2 py-1 rounded hover:bg-green-700 font-bold transition shadow-sm flex items-center gap-1">
                        📢 Notify
                    </button>

                    <button onclick="runWeeklyAutoAssign('${group.month}', ${group.week})" 
                        class="text-[10px] bg-indigo-600 text-white border border-indigo-700 px-2 py-1 rounded hover:bg-indigo-700 font-bold transition shadow-sm flex items-center gap-1">
                        ⚡ Auto
                    </button>
                    
                    <div class="flex rounded shadow-sm">
                        <button onclick="toggleWeekLock('${group.month}', ${group.week}, true)" class="text-[10px] bg-white border border-gray-300 text-red-600 px-2 py-1 rounded-l hover:bg-red-50 font-bold border-r-0">🔒</button>
                        <button onclick="toggleWeekLock('${group.month}', ${group.week}, false)" class="text-[10px] bg-white border border-gray-300 text-green-600 px-2 py-1 rounded-r hover:bg-green-50 font-bold">🔓</button>
                    </div>
                </div>
            </div>`;

        // Render Slots
        group.items.sort((a, b) => a.date - b.date);

        group.items.forEach(({ key, slot }) => {
            const filled = slot.assigned.length;
            let statusColor = slot.isLocked ? "border-red-500 bg-red-50" : (filled >= slot.required ? "border-green-400 bg-green-50" : "border-orange-300 bg-orange-50");
            let statusIcon = slot.isLocked ? "🔒" : (filled >= slot.required ? "✅" : "🔓");

            // Unavailability Button
            let unavButton = "";
            if (slot.unavailable && slot.unavailable.length > 0) {
                unavButton = `<button onclick="openInconvenienceModal('${key}')" class="mt-1.5 w-full flex items-center justify-center gap-1 bg-white text-red-700 border border-red-200 px-2 py-1 rounded-[4px] text-[10px] font-bold hover:bg-red-50 transition shadow-sm"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> ${slot.unavailable.length} Issue(s)</button>`;
            }

            const hasLog = slot.allocationLog ? "" : "opacity-50 cursor-not-allowed";

            ui.adminSlotsGrid.innerHTML += `
                <div class="border-l-4 ${statusColor} bg-white p-3 rounded shadow-sm slot-card flex flex-col justify-between transition-all mx-1 mb-2">
                    <div>
                        <div class="flex justify-between items-start mb-1.5">
                            <h4 class="font-bold text-gray-800 text-xs w-2/3 break-words leading-tight">${statusIcon} ${key}</h4>
                            <div class="flex items-center bg-white border border-gray-300 rounded text-[10px] shadow-sm shrink-0">
                                <button onclick="changeSlotReq('${key}', -1)" class="px-1.5 py-0.5 hover:bg-gray-100 border-r text-gray-600 font-bold">-</button>
                                <span class="px-1.5 font-bold text-gray-800" title="Filled / Required">${filled}/${slot.required}</span>
                                <button onclick="changeSlotReq('${key}', 1)" class="px-1.5 py-0.5 hover:bg-gray-100 border-l text-gray-600 font-bold">+</button>
                            </div>
                        </div>
                        <div class="text-[10px] text-gray-600 mb-1 leading-tight">
                            <strong>Staff:</strong> ${slot.assigned.map(email => getNameFromEmail(email)).join(', ') || "<span class='text-gray-400'>None</span>"}
                        </div>
                        ${unavButton}
                    </div>
                    
                    <div class="grid grid-cols-4 gap-1 mt-2">
                         <button onclick="openSlotReminderModal('${key}')" class="col-span-1 text-[10px] bg-green-50 text-green-700 border border-green-200 rounded py-1 hover:bg-green-100 font-bold transition text-center" title="Reminder">🔔</button>
                         <button onclick="printSessionReport('${key}')" class="col-span-1 text-[10px] bg-gray-100 text-gray-700 border border-gray-300 rounded py-1 hover:bg-gray-200 font-bold transition text-center" title="Print">🖨️</button>
                         <button onclick="openManualAllocationModal('${key}')" class="col-span-1 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 rounded py-1 hover:bg-indigo-100 font-bold transition text-center" title="Edit">Edit</button>
                         <button onclick="viewSlotHistory('${key}')" class="col-span-1 text-[10px] bg-orange-50 text-orange-700 border border-orange-200 rounded py-1 hover:bg-orange-100 font-bold transition text-center ${hasLog}" title="Log">📜</button>
                    </div>
                    <div class="flex gap-1 mt-1.5">
                        <button onclick="toggleLock('${key}')" class="flex-1 text-[10px] border border-gray-300 rounded py-1 hover:bg-gray-50 text-gray-700 font-medium transition shadow-sm bg-white">${slot.isLocked ? 'Unlock' : 'Lock'}</button>
                        <button onclick="openRescheduleModal('${key}')" class="px-2 text-[10px] border border-orange-200 rounded py-1 hover:bg-orange-50 text-orange-600 font-bold transition shadow-sm bg-white" title="Reschedule">📅</button>
                        <button onclick="deleteSlot('${key}')" class="px-2 text-[10px] border border-red-200 rounded py-1 hover:bg-red-50 text-red-600 font-bold transition shadow-sm bg-white" title="Delete">🗑️</button>
                    </div>                
                </div>`;
        });
    });

    // 7. BOTTOM SPACER (The Fix)
    // Adds 32 (8rem / 128px) of empty space at the bottom so the last card scrolls above any mobile bars
    ui.adminSlotsGrid.innerHTML += `<div class="col-span-full h-32 w-full"></div>`;
}
// Updated: Render Staff List with Clickable Done Count
function renderStaffTable() {
    if (!ui.staffTableBody) return;
    ui.staffTableBody.innerHTML = '';

    const filter = document.getElementById('staff-search').value.toLowerCase();
    const today = new Date();

    // 1. Filter & Map Data (Updated to include Designation search)
    const filteredItems = staffData
        .map((staff, i) => ({ ...staff, originalIndex: i }))
        .filter(item => {
            if (item.status === 'archived') return false;

            // Search Logic: Name OR Dept OR Designation
            if (filter) {
                const matchName = item.name.toLowerCase().includes(filter);
                const matchDept = item.dept.toLowerCase().includes(filter);
                const matchDesig = (item.designation || "").toLowerCase().includes(filter); // <--- NEW CHECK

                if (!matchName && !matchDept && !matchDesig) return false;
            }
            return true;
        });

    // 2. Pagination Logic
    const totalPages = Math.ceil(filteredItems.length / STAFF_PER_PAGE) || 1;
    if (currentStaffPage > totalPages) currentStaffPage = totalPages;
    if (currentStaffPage < 1) currentStaffPage = 1;

    const start = (currentStaffPage - 1) * STAFF_PER_PAGE;
    const end = start + STAFF_PER_PAGE;
    const pageItems = filteredItems.slice(start, end);

    // ... rest of the function remains the same ...

    // Update Controls
    const pageInfo = document.getElementById('staff-page-info');
    if (pageInfo) pageInfo.textContent = `Page ${currentStaffPage} of ${totalPages} (${filteredItems.length} Staff)`;
    const prevBtn = document.getElementById('btn-staff-prev');
    const nextBtn = document.getElementById('btn-staff-next');
    if (prevBtn) prevBtn.disabled = (currentStaffPage === 1);
    if (nextBtn) nextBtn.disabled = (currentStaffPage === totalPages);

    // 3. Render Rows
    pageItems.forEach((staff) => {
        const index = staff.originalIndex;

        const target = calculateStaffTarget(staff);
        const done = getDutiesDoneCount(staff.email);
        const pending = Math.max(0, target - done);

        // Role Label
        let activeRoleLabel = "";
        if (staff.roleHistory && staff.roleHistory.length > 0) {
            const activeRole = staff.roleHistory.find(r => {
                const start = new Date(r.start);
                const end = new Date(r.end);
                return start <= today && end >= today;
            });
            if (activeRole) {
                activeRoleLabel = `<span class="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded ml-1 border border-purple-200 font-bold">${activeRole.role}</span>`;
            }
        }

        const statusColor = pending > 3 ? 'text-red-600 font-bold' : (pending > 0 ? 'text-orange-600' : 'text-green-600');

        // Lock Logic
        let actionButtons = "";
        if (isStaffListLocked) {
            actionButtons = `<div class="w-full text-center md:text-right pt-2 md:pt-0 border-t border-gray-100 md:border-0 mt-2 md:mt-0"><span class="text-gray-400 text-xs italic mr-2">Locked</span></div>`;
        } else {
            actionButtons = `
                <div class="flex gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t border-gray-100 md:border-0 mt-2 md:mt-0">
                    <button onclick="editStaff(${index})" class="flex-1 md:flex-none text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded border border-blue-100 transition text-xs font-bold text-center">Edit</button>
                    <button onclick="openRoleAssignmentModal(${index})" class="flex-1 md:flex-none text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded border border-indigo-100 transition text-xs font-bold text-center">Role</button>
                    <button onclick="deleteStaff(${index})" class="flex-1 md:flex-none text-red-500 hover:text-red-700 font-bold px-3 py-1.5 rounded hover:bg-red-50 transition bg-white border border-red-100 text-center">&times;</button>
                </div>
            `;
        }

        const row = document.createElement('tr');
        row.className = "block md:table-row bg-white md:hover:bg-gray-50 border border-gray-200 md:border-0 md:border-b md:border-gray-100 rounded-xl md:rounded-none shadow-sm md:shadow-none mb-4 md:mb-0 p-4 md:p-0";

        row.innerHTML = `
            <td class="block md:table-cell px-0 md:px-6 py-0 md:py-3 border-b-0 md:border-b border-gray-100 w-full md:w-auto">
                
                <div class="hidden md:flex items-center">
                    <div class="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs mr-3 shrink-0">
                        ${staff.name.charAt(0)}
                    </div>
                    <div>
                        <div class="text-sm font-bold text-gray-800">${staff.name}</div>
                        <div class="text-xs text-gray-500 mt-0.5">
                            <span class="font-semibold text-gray-600">${staff.dept}</span> | ${staff.designation} ${activeRoleLabel}
                        </div>
                    </div>
                </div>

                <div class="md:hidden">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-3">
                             <div class="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm">
                                ${staff.name.charAt(0)}
                            </div>
                            <div>
                                <div class="text-sm font-bold text-gray-900">${staff.name}</div>
                                <div class="text-xs text-gray-500 font-medium">${staff.dept} ${activeRoleLabel}</div>
                                <div class="text-[10px] text-gray-400">${staff.designation}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-2 mb-3 text-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <div>
                            <div class="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Target</div>
                            <div class="font-mono text-sm font-bold text-gray-700">${target}</div>
                        </div>
                        <div class="border-l border-gray-200">
                            <div class="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Done</div>
                            <div class="font-mono text-sm font-bold text-blue-600 cursor-pointer hover:underline hover:text-blue-800 transition-colors" 
                                 onclick="openCompletedDutiesModal('${staff.email}')" title="Click to view history">
                                ${done}
                            </div>
                        </div>
                        <div class="border-l border-gray-200">
                            <div class="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Pending</div>
                            <div class="font-mono text-sm font-bold ${statusColor}">${pending}</div>
                        </div>
                    </div>
                </div>
            </td>

            <td class="hidden md:table-cell px-6 py-3 text-center font-mono text-sm text-gray-600">${target}</td>

            <td class="hidden md:table-cell px-6 py-3 text-center font-mono text-sm font-bold">
                <button onclick="openCompletedDutiesModal('${staff.email}')" 
                        class="text-blue-600 hover:text-blue-800 hover:underline decoration-blue-400 underline-offset-2 transition-all cursor-pointer focus:outline-none" 
                        title="View Duty History">
                    ${done}
                </button>
            </td>

            <td class="hidden md:table-cell px-6 py-3 text-center font-mono text-sm ${statusColor}">${pending}</td>

            <td class="block md:table-cell px-0 md:px-6 py-0 md:py-3 md:text-right md:whitespace-nowrap">
                ${actionButtons}
            </td>
        `;
        ui.staffTableBody.appendChild(row);
    });

    const spacer = document.createElement('tr');
    spacer.className = "block md:hidden h-32 border-none bg-transparent pointer-events-none";
    spacer.innerHTML = `<td class="block border-none p-0"></td>`;
    ui.staffTableBody.appendChild(spacer);
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

    if (ui.calTitle) ui.calTitle.textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Group Slots
    const slotsByDate = {};
    Object.keys(invigilationSlots).forEach(key => {
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
    for (let i = 0; i < firstDayIndex; i++) {
        html += `<div class="bg-gray-50 border border-gray-100 min-h-[5rem] md:min-h-[7rem]"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${String(day).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}.${year}`;
        const slots = slotsByDate[day] || [];

        let dayContent = `<div class="text-right font-bold text-xs md:text-sm p-0.5 text-gray-400">${day}</div>`;
        let bgClass = "bg-white";
        let borderClass = "border-gray-200";

        // --- RENDER SLOTS ---
        if (slots.length > 0) {
            dayContent += `<div class="flex flex-col gap-0.5 px-0.5 pb-0.5">`;
            slots.sort((a, b) => a.sessionType === "FN" ? -1 : 1);

            slots.forEach(slot => {
                const filled = slot.assigned.length;
                const needed = slot.required;
                const available = Math.max(0, needed - filled);

                // Pass slot.key to isUserUnavailable
                const isUnavailable = isUserUnavailable(slot, myEmail, slot.key);
                const isAssigned = slot.assigned.includes(myEmail);
                const isPostedByMe = slot.exchangeRequests && slot.exchangeRequests.includes(myEmail);
                const isMarketAvailable = slot.exchangeRequests && slot.exchangeRequests.length > 0 && !isAssigned;
                const isCompleted = slot.attendance && slot.attendance.includes(myEmail);

                let badgeColor = "bg-green-100 text-green-700 border-green-200";
                let statusText = `${available}/${needed}`;

                if (isCompleted) { badgeColor = "bg-green-600 text-white border-green-600"; statusText = "Done"; }
                else if (isPostedByMe) { badgeColor = "bg-orange-100 text-orange-700 border-orange-300"; statusText = "⏳ Posted"; }
                else if (isAssigned) { badgeColor = "bg-blue-600 text-white border-blue-600"; statusText = "Assigned"; }
                else if (isMarketAvailable) { badgeColor = "bg-purple-100 text-purple-700 border-purple-300 animate-pulse"; statusText = "♻️ Market"; }
                else if (isUnavailable) { badgeColor = "bg-red-50 text-red-600 border-red-200"; statusText = "Unavail"; }
                else if (slot.isLocked) { badgeColor = "bg-gray-100 text-gray-500 border-gray-300"; statusText = "Locked"; }
                else if (filled >= needed) { badgeColor = "bg-gray-100 text-gray-400 border-gray-200"; statusText = "Full"; }

                dayContent += `
                    <div class="text-[8px] md:text-[10px] font-bold p-0.5 rounded border ${badgeColor} flex flex-col md:flex-row justify-between items-center text-center md:text-left h-auto gap-0.5 shadow-sm leading-none">
                        <span>${slot.sessionType}</span>
                        <span class="whitespace-nowrap">${statusText}</span>
                    </div>`;
            });
            dayContent += `</div>`;
            bgClass = "bg-white hover:bg-gray-50 cursor-pointer transition";
        }
        else {
            // --- NO SLOTS: CHECK ADVANCE UNAVAILABILITY ---
            const adv = advanceUnavailability[dateStr];
            let advBadges = "";

            if (adv) {
                // UPDATED CHECKS: use .some()
                if (adv.FN && adv.FN.some(u => u.email === myEmail)) {
                    advBadges += `<div class="text-[8px] font-bold p-0.5 rounded bg-red-50 text-red-600 border border-red-200 text-center mb-0.5">FN: Unavail</div>`;
                }
                if (adv.AN && adv.AN.some(u => u.email === myEmail)) {
                    advBadges += `<div class="text-[8px] font-bold p-0.5 rounded bg-red-50 text-red-600 border border-red-200 text-center">AN: Unavail</div>`;
                }
            }

            if (advBadges) {
                dayContent += `<div class="flex flex-col px-0.5 mt-1">${advBadges}</div>`;
                bgClass = "bg-red-50 hover:bg-red-100 cursor-pointer transition"; // Highlight day
            } else {
                // Empty day, but still clickable to add OD/DL
                bgClass = "bg-white hover:bg-gray-50 cursor-pointer transition";
            }
        }

        // Always clickable now
        const clickAction = `onclick="openDayModal('${dateStr}', '${myEmail}')"`;
        html += `<div class="border min-h-[5rem] md:min-h-[7rem] h-auto ${borderClass} ${bgClass} flex flex-col relative" ${clickAction}>${dayContent}</div>`;
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

window.openDayModal = function (dateStr, email) {
    document.getElementById('modal-day-title').textContent = dateStr;
    const container = document.getElementById('modal-sessions-container');
    container.innerHTML = '';

    // TRACK ASSIGNMENTS FOR THIS DAY
    let isAssignedFN = false;
    let isAssignedAN = false;

    // 1. RENDER EXISTING EXAM SESSIONS
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
            const isPostedByMe = slot.exchangeRequests && slot.exchangeRequests.includes(email);
            const marketOffers = slot.exchangeRequests ? slot.exchangeRequests.filter(e => e !== email) : [];

            // Determine Session Time for Button Logic
            const t = key.split(' | ')[1].toUpperCase();
            const isAN = (t.includes("PM") || t.startsWith("12:") || t.startsWith("12."));
            const sessLabel = isAN ? "AFTERNOON (AN)" : "FORENOON (FN)";

            // Update Daily Flags
            if (isAssigned) {
                if (isAN) isAssignedAN = true;
                else isAssignedFN = true;
            }

            // --- Action Buttons (Existing Logic) ---
            let actionHtml = "";
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

            // Reserve Logic
            const reserves = getSlotReserves(key);
            const reserveEmails = reserves.map(r => r.email);

            // Staff List
            let staffListHtml = '';
            if (slot.assigned.length > 0) {
                const listItems = slot.assigned.map(st => {
                    const s = staffData.find(sd => sd.email === st);
                    if (!s) return '';
                    const isExchanging = slot.exchangeRequests && slot.exchangeRequests.includes(st);
                    const statusIcon = isExchanging ? "⏳" : "✅";

                    const isReserve = reserveEmails.includes(st);
                    const reserveBadge = isReserve ? `<span class="bg-yellow-100 text-yellow-800 text-[10px] px-1 rounded ml-1 border border-yellow-200">Reserve</span>` : "";
                    const rowClass = isReserve ? "bg-yellow-50/50" : "bg-white";

                    return `<div class="flex justify-between items-center text-xs ${rowClass} p-1.5 rounded border border-gray-100 mb-1"><span class="font-bold text-gray-700 flex items-center">${statusIcon} <span class="ml-1">${s.name}</span>${reserveBadge}</span></div>`;
                }).join('');

                let notifyBtn = "";
                if (isAdmin && reserves.length > 0) {
                    notifyBtn = `<button onclick="notifySlotReserves('${key}')" class="text-[10px] text-indigo-600 font-bold hover:bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Notify ${reserves.length} Reserves</button>`;
                }

                staffListHtml = `<div class="mt-3 pt-2 border-t border-gray-200"><div class="flex justify-between items-center mb-1.5"><div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Staff</div>${notifyBtn}</div><div class="space-y-0.5 max-h-24 overflow-y-auto custom-scroll">${listItems}</div></div>`;
            }

            container.innerHTML += `<div class="bg-gray-50 p-3 rounded border border-gray-200 mb-2"><div class="flex justify-between items-center mb-2"><span class="font-bold text-gray-800 text-sm">${sessLabel} <span class="text-[10px] text-gray-500 font-normal ml-1">${key.split('|')[1]}</span></span><span class="text-xs bg-white border px-2 py-0.5 rounded">${filled}/${slot.required}</span></div><div class="mt-2">${actionHtml}</div>${staffListHtml}</div>`;
        });
    } else {
        container.innerHTML = `<p class="text-gray-400 text-sm text-center py-4 bg-gray-50 rounded border border-gray-100 mb-4">No exam sessions scheduled.</p>`;
    }

    // 2. ADVANCE / SESSION UNAVAILABILITY SECTION (With Logic to Disable if Assigned)
    const adv = advanceUnavailability[dateStr] || { FN: [], AN: [] };

    // Current Status
    const fnUnavail = adv.FN && adv.FN.some(u => u.email === email);
    const anUnavail = adv.AN && adv.AN.some(u => u.email === email);
    const bothUnavail = fnUnavail && anUnavail;

    // Helper to generate button styles/states
    const getBtnState = (isAssigned, isMarked, label) => {
        if (isAssigned) {
            return {
                disabled: 'disabled',
                class: 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed',
                text: `🚫 On Duty (${label})`
            };
        }
        if (isMarked) {
            return {
                disabled: '',
                class: 'bg-red-600 text-white border-red-700 hover:bg-red-700',
                text: `🚫 ${label} Unavailable`
            };
        }
        return {
            disabled: '',
            class: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
            text: `Mark ${label}`
        };
    };

    const fnBtn = getBtnState(isAssignedFN, fnUnavail, "FN");
    const anBtn = getBtnState(isAssignedAN, anUnavail, "AN");

    // Disable Whole Day if Assigned to ANY part of the day
    const anyDuty = isAssignedFN || isAssignedAN;
    const wholeClass = anyDuty
        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
        : (bothUnavail ? 'bg-red-800 text-white border-red-900' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-100');

    const wholeText = anyDuty ? "🚫 Cannot Mark Whole Day (On Duty)" : (bothUnavail ? '🚫 Clear Whole Day Unavailability' : '📅 Mark Whole Day Unavailable');
    const wholeDisabled = anyDuty ? "disabled" : "";

    container.innerHTML += `
        <div class="mt-4 pt-4 border-t border-gray-200">
            <h4 class="text-xs font-bold text-indigo-900 uppercase mb-2 flex items-center gap-2">
                <span>🗓️</span> General Unavailability (OD/DL/Leave)
            </h4>
            <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <p class="text-[10px] text-gray-600 mb-3">
                    Mark leave for sessions or the whole day.
                </p>
                <div class="grid grid-cols-2 gap-2 mb-2">
                    <button onclick="toggleAdvance('${dateStr}', '${email}', 'FN')" ${fnBtn.disabled}
                        class="py-2 text-[10px] font-bold rounded border transition flex items-center justify-center gap-1 ${fnBtn.class}">
                        ${fnBtn.text}
                    </button>
                    
                    <button onclick="toggleAdvance('${dateStr}', '${email}', 'AN')" ${anBtn.disabled}
                        class="py-2 text-[10px] font-bold rounded border transition flex items-center justify-center gap-1 ${anBtn.class}">
                        ${anBtn.text}
                    </button>
                </div>
                
                <button onclick="toggleWholeDay('${dateStr}', '${email}')" ${wholeDisabled}
                    class="w-full py-2 text-xs font-bold rounded border transition flex items-center justify-center gap-2 ${wholeClass}">
                    ${wholeText}
                </button>
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
        const ref = doc(db, "colleges", currentCollegeId);
        await updateDoc(ref, { examInvigilationSlots: JSON.stringify(invigilationSlots) });
        updateSyncStatus("Synced", "success");
    } catch (e) {
        console.error(e);
        updateSyncStatus("Save Failed", "error");
        alert("⚠️ Failed to save slots. Please check your internet connection.");
    }
}

async function syncStaffToCloud() {
    updateSyncStatus("Saving...", "neutral");
    try {
        const ref = doc(db, "colleges", currentCollegeId);
        await updateDoc(ref, { examStaffData: JSON.stringify(staffData) });
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

    await syncSlotsToCloud();
    window.closeModal('add-slot-modal');
    renderSlotsGridAdmin();
}

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

window.toggleAdvance = async function (dateStr, email, session) {
    if (!advanceUnavailability[dateStr]) advanceUnavailability[dateStr] = { FN: [], AN: [] };
    if (!advanceUnavailability[dateStr][session]) advanceUnavailability[dateStr][session] = [];

    const list = advanceUnavailability[dateStr][session];
    const existingEntry = list.find(u => u.email === email);

    if (existingEntry) {
        // REMOVE (Simple Confirm)
        if (confirm(`Remove 'Unavailable' status for ${session}?`)) {
            advanceUnavailability[dateStr][session] = list.filter(u => u.email !== email);

            logActivity("Advance Unavailability Removed", `Removed ${getNameFromEmail(email)} from ${dateStr} (${session}) unavailability list.`);

            await saveAdvanceUnavailability();
            renderStaffCalendar(email);

            // 1. Update List Live
            if (typeof renderStaffUpcomingSummary === 'function') renderStaffUpcomingSummary(email);

            // 2. CLOSE MODAL (Updated)
            window.closeModal('day-detail-modal');
        }
    } else {
        // ADD (Open Modal for Reason)
        document.getElementById('unav-key').value = `ADVANCE|${dateStr}|${session}`;
        document.getElementById('unav-email').value = email;

        document.getElementById('unav-reason').value = "";
        document.getElementById('unav-details').value = "";
        document.getElementById('unav-details-container').classList.add('hidden');

        window.closeModal('day-detail-modal');
        window.openModal('unavailable-modal');
    }
}

async function saveAdvanceUnavailability() {
    updateSyncStatus("Saving...", "neutral");
    try {
        const ref = doc(db, "colleges", currentCollegeId);
        await updateDoc(ref, { invigAdvanceUnavailability: JSON.stringify(advanceUnavailability) });
        updateSyncStatus("Synced", "success");
    } catch (e) {
        console.error(e);
        updateSyncStatus("Save Failed", "error");
    }
}
window.toggleWholeDay = async function (dateStr, email) {
    if (!advanceUnavailability[dateStr]) advanceUnavailability[dateStr] = { FN: [], AN: [] };

    const fnList = advanceUnavailability[dateStr].FN || [];
    const anList = advanceUnavailability[dateStr].AN || [];
    const isFullDay = fnList.some(u => u.email === email) && anList.some(u => u.email === email);

    if (isFullDay) {
        // CLEAR BOTH
        if (confirm("Clear unavailability for the WHOLE DAY?")) {
            advanceUnavailability[dateStr].FN = fnList.filter(u => u.email !== email);
            advanceUnavailability[dateStr].AN = anList.filter(u => u.email !== email);

            logActivity("Advance Unavailability Removed", `Removed ${getNameFromEmail(email)} from Whole Day ${dateStr}.`);

            await saveAdvanceUnavailability();
            renderStaffCalendar(email);

            // 1. Update List Live
            if (typeof renderStaffUpcomingSummary === 'function') renderStaffUpcomingSummary(email);

            // 2. CLOSE MODAL (Updated)
            window.closeModal('day-detail-modal');
        }
    } else {
        // MARK BOTH
        document.getElementById('unav-key').value = `ADVANCE|${dateStr}|WHOLE`;
        document.getElementById('unav-email').value = email;

        document.getElementById('unav-reason').value = "";
        document.getElementById('unav-details').value = "";
        document.getElementById('unav-details-container').classList.add('hidden');

        window.closeModal('day-detail-modal');
        window.openModal('unavailable-modal');
    }
}
// --- STANDARD EXPORTS ---
window.toggleLock = async function (key) {
    invigilationSlots[key].isLocked = !invigilationSlots[key].isLocked;
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

    if (!reason) return alert("Select a reason.");
    if (['OD', 'DL', 'Medical'].includes(reason) && !details) return alert("Details required.");

    const entry = { email, reason, details: details || "" };

    if (key.startsWith('ADVANCE|')) {
        // --- CASE A: ADVANCE / GENERAL UNAVAILABILITY ---
        const [_, dateStr, session] = key.split('|');

        // Ensure structure
        if (!advanceUnavailability[dateStr]) advanceUnavailability[dateStr] = { FN: [], AN: [] };
        if (!advanceUnavailability[dateStr].FN) advanceUnavailability[dateStr].FN = [];
        if (!advanceUnavailability[dateStr].AN) advanceUnavailability[dateStr].AN = [];

        if (session === 'WHOLE') {
            // Remove existing to avoid duplicates
            advanceUnavailability[dateStr].FN = advanceUnavailability[dateStr].FN.filter(u => u.email !== email);
            advanceUnavailability[dateStr].AN = advanceUnavailability[dateStr].AN.filter(u => u.email !== email);

            advanceUnavailability[dateStr].FN.push(entry);
            advanceUnavailability[dateStr].AN.push(entry);

            logActivity("Advance Unavailability", `Marked ${getNameFromEmail(email)} unavailable for WHOLE DAY on ${dateStr}. Reason: ${reason}`);
        } else {
            // Single Session
            if (!advanceUnavailability[dateStr][session]) advanceUnavailability[dateStr][session] = [];
            advanceUnavailability[dateStr][session] = advanceUnavailability[dateStr][session].filter(u => u.email !== email);
            advanceUnavailability[dateStr][session].push(entry);

            logActivity("Advance Unavailability", `Marked ${getNameFromEmail(email)} unavailable for ${dateStr} (${session}). Reason: ${reason}`);
        }

        await saveAdvanceUnavailability();

        // --- FIXES APPLIED HERE ---
        window.closeModal('unavailable-modal');
        window.closeModal('day-detail-modal'); // Ensure previous modal is closed
        renderStaffCalendar(email);

        // 1. LIVE UPDATE LIST
        if (typeof renderStaffUpcomingSummary === 'function') renderStaffUpcomingSummary(email);
        // 2. DO NOT RE-OPEN MODAL (Issue 2 Fix)
        // openDayModal(dateStr, email); <--- REMOVED
        // --------------------------

    } else {
        // --- CASE B: SLOT SPECIFIC ---
        if (!invigilationSlots[key].unavailable) invigilationSlots[key].unavailable = [];
        invigilationSlots[key].unavailable.push(entry);

        logActivity("Session Unavailability", `Marked ${getNameFromEmail(email)} unavailable for ${key}. Reason: ${reason}`);

        await syncSlotsToCloud();
        window.closeModal('unavailable-modal');
        window.closeModal('day-detail-modal'); // Ensure previous modal is closed

        renderStaffCalendar(email);
        // 1. LIVE UPDATE LIST
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
window.calculateSlotsFromSchedule = async function () {
    const btn = document.querySelector('button[onclick="calculateSlotsFromSchedule()"]');
    if (btn) { btn.disabled = true; btn.innerText = "Checking Cloud..."; }

    try {
        // 1. Fetch Data
        const mainRef = doc(db, "colleges", currentCollegeId);
        const mainSnap = await getDoc(mainRef);
        if (!mainSnap.exists()) throw new Error("Cloud data unavailable.");

        let fullData = mainSnap.data();
        const dataColRef = collection(db, "colleges", currentCollegeId, "data");
        const q = query(dataColRef, orderBy("index"));
        const querySnapshot = await getDocs(q);
        let fullPayload = "";
        querySnapshot.forEach(doc => { if (doc.data().payload) fullPayload += doc.data().payload; });
        if (fullPayload) fullData = { ...fullData, ...JSON.parse(fullPayload) };

        const students = JSON.parse(fullData.examBaseData || '[]');
        const scribeList = JSON.parse(fullData.examScribeList || '[]');
        const scribeRegNos = new Set(scribeList.map(s => s.regNo));

        if (students.length === 0) throw new Error("No exam data found.");

        // 2. Advanced Calculation
        const sessions = {};
        students.forEach(s => {
            const key = `${s.Date} | ${s.Time}`;
            if (!sessions[key]) {
                sessions[key] = { streams: {}, scribeCount: 0, totalStudents: 0 };
            }

            sessions[key].totalStudents++;

            if (scribeRegNos.has(s['Register Number'])) {
                sessions[key].scribeCount++;
            } else {
                const strm = s.Stream || "Regular";
                if (!sessions[key].streams[strm]) sessions[key].streams[strm] = 0;
                sessions[key].streams[strm]++;
            }
        });

        let changesLog = [];
        let removalLog = [];
        let newSlots = { ...invigilationSlots };
        let hasChanges = false;

        // --- A. CLEANUP LEGACY DATA (Remove 'courses' field) ---
        Object.keys(newSlots).forEach(k => {
            if (newSlots[k].courses) {
                delete newSlots[k].courses; // Remove unwanted data
                hasChanges = true; // Mark for save
            }
        });
        // -------------------------------------------------------

        Object.keys(sessions).forEach(key => {
            const data = sessions[key];
            const [datePart, timePart] = key.split(' | ');

            // --- B. CALCULATE REQUIREMENTS ---
            let calculatedReq = 0;

            // 1. Regular Streams (1:30)
            Object.values(data.streams).forEach(count => {
                calculatedReq += Math.ceil(count / 30);
            });

            // 2. Scribes (1:5 RULE)
            if (data.scribeCount > 0) {
                calculatedReq += Math.ceil(data.scribeCount / 5);
            }

            // 3. Reserve (10% of base)
            const reserve = Math.ceil(calculatedReq * 0.10);
            const finalReq = calculatedReq + reserve;

            // --- C. Fetch Official Exam Name (Robust Stream Check) ---
            let officialExamName = "";
            if (typeof window.getExamName === "function") {
                // 1. Try streams actually present in this session
                const streamsInSession = Object.keys(data.streams);
                for (const strm of streamsInSession) {
                    officialExamName = window.getExamName(datePart, timePart, strm);
                    if (officialExamName) break; // Found a match!
                }

                // 2. Fallbacks
                if (!officialExamName) officialExamName = window.getExamName(datePart, timePart, "Regular");
                if (!officialExamName) officialExamName = window.getExamName(datePart, timePart, "All Streams");
            }

            // --- D. Update Slot ---
            if (!newSlots[key]) {
                newSlots[key] = {
                    required: finalReq,
                    assigned: [],
                    unavailable: [],
                    isLocked: true,
                    examName: officialExamName,
                    scribeCount: data.scribeCount,
                    studentCount: data.totalStudents
                };
                changesLog.push(`🆕 ${key}: Added (Req: ${finalReq})`);
                hasChanges = true;
            } else {
                // Update Metadata
                if (newSlots[key].scribeCount !== data.scribeCount || newSlots[key].studentCount !== data.totalStudents) {
                    newSlots[key].scribeCount = data.scribeCount;
                    newSlots[key].studentCount = data.totalStudents;
                    hasChanges = true;
                }

                if (officialExamName && newSlots[key].examName !== officialExamName) {
                    newSlots[key].examName = officialExamName;
                    hasChanges = true;
                }

                if (newSlots[key].required !== finalReq) {
                    changesLog.push(`🔄 ${key}: ${newSlots[key].required} ➝ ${finalReq}`);
                    hasChanges = true;
                    newSlots[key].required = finalReq;

                    if (finalReq < newSlots[key].assigned.length) {
                        const excessCount = newSlots[key].assigned.length - finalReq;
                        const removed = pruneAssignments(newSlots[key], excessCount);
                        removed.forEach(r => removalLog.push({ session: key, ...r }));
                    }
                }
            }
        });

        // 3. Confirm
        if (!hasChanges) {
            alert("✅ Cloud data checked. No changes.");
        } else {
            let msg = "⚠️ UPDATES FOUND ⚠️\n\n" + changesLog.join('\n');
            if (removalLog.length > 0) msg += `\n\n🚨 REDUCTION ALERT: ${removalLog.length} staff will be removed.`;

            // Note about cleanup
            if (msg === "⚠️ UPDATES FOUND ⚠️\n\n") msg = "✅ Optimization: Cleaning up old course data from slots.";

            if (confirm(msg + "\n\nProceed with update?")) {
                invigilationSlots = newSlots;
                await syncSlotsToCloud();
                renderSlotsGridAdmin();
                if (removalLog.length > 0) showRemovalNotification(removalLog);
                else alert("Slots updated successfully!");
            }
        }

    } catch (e) {
        console.error(e);
        alert("Error: " + e.message);
    } finally {
        if (btn) { btn.disabled = false; btn.innerText = "Sync Cloud / Generate Slots"; }
    }
}


// --- Helper: Smart Removal (Lowest Priority First) ---
function pruneAssignments(slot, countToRemove) {
    // 1. Map emails to staff objects with "Pending" score
    // Higher pending = Higher priority to KEEP.
    // Lower pending = Has done enough/more duties = Remove First.

    let assignedStaff = slot.assigned.map(email => {
        const s = staffData.find(st => st.email === email);
        if (!s) return { email, pending: -999, name: email, phone: "" }; // Ghost user
        const target = calculateStaffTarget(s);
        const pending = target - (s.dutiesDone || 0);
        return { email, pending, name: s.name, phone: s.phone };
    });

    // 2. Sort: Lowest Pending First (Ascending)
    assignedStaff.sort((a, b) => a.pending - b.pending);

    // 3. Pick victims
    const toRemove = assignedStaff.slice(0, countToRemove);
    const keep = assignedStaff.slice(countToRemove);

    // 4. Update Slot
    slot.assigned = keep.map(s => s.email);

    // 5. Return details for notification
    return toRemove;
}
// --- Helper: Show Removal Notification ---
function showRemovalNotification(log) {
    const list = document.getElementById('inconvenience-list');
    const modalTitle = document.getElementById('inconvenience-modal-subtitle');

    if (list && modalTitle) {
        document.querySelector('#inconvenience-modal h3').textContent = "⚠️ Auto-Removal Notification";
        modalTitle.textContent = "The following staff were removed due to slot reduction. Please notify them.";

        list.innerHTML = '';
        log.forEach(item => {
            // Fix Phone Format
            let phone = item.phone ? item.phone.replace(/\D/g, '') : "";
            if (phone.length === 10) phone = "91" + phone;
            const hasValidPhone = phone.length >= 10;

            const msg = encodeURIComponent(`Exam Duty Update: Your invigilation duty for ${item.session} has been CANCELLED due to a reduction in required slots.`);
            const waLink = hasValidPhone ? `https://wa.me/${phone}?text=${msg}` : "#";

            list.innerHTML += `
                <div class="bg-orange-50 border border-orange-200 p-3 rounded-lg flex justify-between items-center">
                    <div>
                        <div class="font-bold text-gray-800 text-sm">${item.name}</div>
                        <div class="text-xs text-gray-500">${item.session}</div>
                    </div>
                    ${hasValidPhone ?
                    `<a href="${waLink}" target="_blank" class="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-green-700 shadow-sm">Notify WA</a>` :
                    `<span class="text-xs text-gray-400">No Phone</span>`
                }
                </div>
            `;
        });

        window.openModal('inconvenience-modal');
    } else {
        alert("Staff removed: \n" + log.map(l => `${l.name} (${l.session})`).join('\n'));
    }
}

// --- RESERVE LOGIC ---
// --- RESERVE LOGIC ---

// --- HELPER: Get Slot Reserves (Session-Based) ---
window.getSlotReserves = function (key) {
    const slot = invigilationSlots[key];
    if (!slot || !slot.assigned || slot.assigned.length === 0) return [];

    // Map to Staff Objects
    const staffList = slot.assigned.map(e => staffData.find(s => s.email === e)).filter(s => s);

    // 10% Cutoff (Rounded Up)
    if (staffList.length < 2) return [];
    const reserveCount = Math.ceil(staffList.length * 0.10);

    // Sort: Pending High -> Low (Top are Active, Bottom are Reserve)
    staffList.sort((a, b) => {
        const pA = calculateStaffTarget(a) - getDutiesDoneCount(a.email);
        const pB = calculateStaffTarget(b) - getDutiesDoneCount(b.email);
        if (pA !== pB) return pB - pA; // Descending
        return 0;
    });

    // The LAST 'reserveCount' are reserves
    return staffList.slice(-reserveCount);
}

window.notifySlotReserves = async function (key) {
    const reserves = getSlotReserves(key);
    if (reserves.length === 0) return alert("No reserves identified for this session.");

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
        const targetCount = Math.ceil(slot.required * 1.10);
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
        // Only respect checkboxes for Guest Faculty
        availableDays = Array.from(document.querySelectorAll('.stf-day-chk:checked')).map(c => parseInt(c.value));
    }
    // -----------------------------

    if (!name || !email) return alert("Name and Email are required.");

    if (isEditMode) {
        // --- UPDATE EXISTING STAFF ---
        const oldData = staffData[index];
        const oldEmail = oldData.email;

        // 1. FULL EMAIL MIGRATION LOGIC
        if (oldEmail !== email) {
            if (staffData.some(s => s.email === email && s !== oldData)) {
                return alert("This email is already used by another staff member.");
            }
            if (!confirm(`Change email from ${oldEmail} to ${email}?\n\nThis will update their system access AND migrate all their past records.`)) return;

            await removeStaffAccess(oldEmail);
            await addStaffAccess(email);

            // Deep Find & Replace in Slots (Migration)
            let slotsChanged = false;
            Object.keys(invigilationSlots).forEach(key => {
                const slot = invigilationSlots[key];
                if (slot.assigned.includes(oldEmail)) { slot.assigned = slot.assigned.map(e => e === oldEmail ? email : e); slotsChanged = true; }
                if (slot.attendance && slot.attendance.includes(oldEmail)) { slot.attendance = slot.attendance.map(e => e === oldEmail ? email : e); slotsChanged = true; }
                if (slot.exchangeRequests && slot.exchangeRequests.includes(oldEmail)) { slot.exchangeRequests = slot.exchangeRequests.map(e => e === oldEmail ? email : e); slotsChanged = true; }
                if (slot.supervision) { if (slot.supervision.cs === oldEmail) { slot.supervision.cs = email; slotsChanged = true; } if (slot.supervision.sas === oldEmail) { slot.supervision.sas = email; slotsChanged = true; } }
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

        // 2. Update Local Array
        staffData[index] = {
            ...oldData,
            name, email, phone, dept, designation, joiningDate: date,
            preferredDays: availableDays // <--- SAVED HERE
        };
        alert("Staff profile updated successfully.");

    } else {
        // --- ADD NEW STAFF ---
        if (staffData.some(s => s.email === email)) return alert("Staff with this email already exists.");

        const newObj = {
            name, email, phone, dept, designation, joiningDate: date,
            dutiesDone: 0, roleHistory: [],
            preferredDays: availableDays
        };
        staffData.push(newObj);
        await addStaffAccess(email);
        alert("New staff added successfully.");
    }

    await syncStaffToCloud();
    window.closeModal('add-staff-modal');

    if (!isAdmin) window.location.reload();
    else {
        renderStaffTable();
        updateAdminUI();
    }
}





window.deleteStaff = async function (index) {
    const staff = staffData[index];
    if (!staff) return;

    if (confirm(`Archive ${staff.name}?\n\nThey will be hidden from new duty assignments, but their past attendance records will remain for reports.`)) {
        // Soft Delete
        staffData[index].status = 'archived';
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
    await syncStaffToCloud();
    window.closeModal('role-assignment-modal');
    renderStaffTable();
}

window.removeRoleFromStaff = async function (sIdx, rIdx) {
    staffData[sIdx].roleHistory.splice(rIdx, 1);
    await syncStaffToCloud();
    window.closeModal('role-assignment-modal');
    renderStaffTable();
}



window.openInconvenienceModal = function (key) {
    const slot = invigilationSlots[key];
    if (!slot || !slot.unavailable) return;
    document.getElementById('inconvenience-modal-subtitle').textContent = key;
    const list = document.getElementById('inconvenience-list');
    list.innerHTML = '';

    slot.unavailable.forEach(u => {
        const email = (typeof u === 'string') ? u : u.email;
        const reason = (typeof u === 'object' && u.reason) ? u.reason : "N/A";
        const details = (typeof u === 'object' && u.details) ? u.details : "No details.";
        const s = staffData.find(st => st.email === email) || { name: email, phone: "", dept: "Unknown" };

        // Fix Phone Format
        let phone = s.phone ? s.phone.replace(/\D/g, '') : "";
        if (phone.length === 10) phone = "91" + phone;
        const hasPhone = phone.length >= 10;

        list.innerHTML += `<div class="bg-red-50 border border-red-100 p-3 rounded-lg"><div class="flex justify-between items-start mb-1"><div><div class="font-bold text-gray-800 text-sm">${s.name}</div><div class="text-[10px] text-gray-500 uppercase font-bold">${s.dept}</div></div><span class="bg-white text-red-600 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200 shadow-sm">${reason}</span></div><div class="text-xs text-gray-700 bg-white p-2 rounded border border-gray-100 italic mb-2">"${details}"</div><div class="text-right">${hasPhone ? `<a href="https://wa.me/${phone}" target="_blank" class="text-green-600 hover:text-green-800 text-xs font-bold flex items-center justify-end gap-1">WhatsApp</a>` : ''}</div></div>`;
    });
    window.openModal('inconvenience-modal');
}

// --- MISSING HELPER FUNCTIONS ---

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
        targetInput.disabled = true; // <--- NEW
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
    if (isNaN(newGlobal)) return alert("Invalid Global Target");

    globalDutyTarget = newGlobal;

    // CAPTURE URL
    const newUrl = document.getElementById('google-script-url').value.trim();
    googleScriptUrl = newUrl;

    // Save to Cloud
    const ref = doc(db, "colleges", currentCollegeId);
    await updateDoc(ref, {
        invigRoles: JSON.stringify(rolesConfig),
        invigDepartments: JSON.stringify(departmentsConfig),
        invigGlobalTarget: globalDutyTarget,
        invigGoogleScriptUrl: googleScriptUrl // <--- SAVED HERE
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
    div.className = `group flex flex-col md:flex-row justify-between items-start md:items-center p-3 rounded-lg border shadow-sm transition mb-2 gap-2 md:gap-4 ${isLocked ? 'border-green-200 bg-green-50' : 'bg-white border-gray-200'}`;

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

    // --- NEW: SEND NOTIFICATION EMAIL TO SELLER ---
    if (seller && seller.email && googleScriptUrl) {
        const subject = `Duty Exchange Accepted: ${key}`;
        const body = `
            <p>Dear ${seller.name},</p>
            <p>Good news! Your request to exchange the invigilation duty for <b>${key}</b> has been accepted by <b>${buyer.name}</b>.</p>
            <p>You have been removed from this duty assignment.</p>
            <hr>
            <p style="font-size:12px; color:#666;">Exam Cell Notification</p>
        `;

        // Non-blocking fetch (Fire and Forget)
        fetch(googleScriptUrl, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to: seller.email,
                subject: subject,
                body: body
            })
        }).then(() => console.log("Notification email triggered."))
            .catch(e => console.error("Email failed", e));
    }
    // ----------------------------------------------

    // 5. Sync
    await syncSlotsToCloud();
    await syncStaffToCloud();

    alert(`Success! You have accepted the duty from ${sellerName}. A notification has been sent to them.`);

    window.closeModal('day-detail-modal');
    renderStaffCalendar(buyerEmail);
    renderExchangeMarket(buyerEmail);
    initStaffDashboard(buyer);
}
window.postForExchange = async function (key, email) {
    // 1. Confirm Action
    if (!confirm("Post this duty for exchange?\n\nNOTE: You remain responsible (and assigned) until someone else accepts it.")) return;

    const slot = invigilationSlots[key];
    if (!slot.exchangeRequests) slot.exchangeRequests = [];

    if (!slot.exchangeRequests.includes(email)) {
        // 2. Update Local Data
        slot.exchangeRequests.push(email);

        // 3. LOGGING
        logActivity("Exchange Posted", `${getNameFromEmail(email)} posted ${key} for exchange.`);

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

window.withdrawExchange = async function (key, email) {
    // 1. ADDED CONFIRMATION CHECK
    if (!confirm("Are you sure you want to withdraw this request and keep the duty?")) return;

    const slot = invigilationSlots[key];
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
    renderDepartmentsList();

    nameInput.value = '';
    emailInput.value = '';
}

window.deleteDepartment = function (name) {
    if (confirm(`Delete department "${name}"?`)) {
        departmentsConfig = departmentsConfig.map(d => (typeof d === 'string') ? { name: d, email: "" } : d);
        departmentsConfig = departmentsConfig.filter(d => d.name !== name);
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





// Updated: Show Completed Duties Modal (AY Filtered + Neat UI)
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

            // Neat styling for list items
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

    window.openModal('completed-duties-modal');
}

// --- WEEKLY AUTO-ASSIGN ALGORITHM (Generates Logic Reports) ---
window.runWeeklyAutoAssign = async function (monthStr, weekNum) {
    // 1. CHECK: Confirm Intent
    if (!confirm(`⚡ Run Auto-Assignment for ${monthStr}, Week ${weekNum}?\n\nIMPORTANT: This will only fill LOCKED slots (Admin Mode).\n\nRules Applied:\n1. Max 3 duties/week\n2. Avoid Same Day & Adjacent Days\n3. Dept Cap: Max 60% of a dept per session\n4. "Show Must Go On" - Rules break if necessary.`)) return;

    // 2. Identify Target Slots (MUST BE LOCKED)
    const targetSlots = [];
    Object.keys(invigilationSlots).forEach(key => {
        const date = parseDate(key);
        const mStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const wNum = getWeekOfMonth(date);
        const slot = invigilationSlots[key];

        if (mStr === monthStr && wNum === weekNum && slot.isLocked) {
            targetSlots.push({ key, date, slot });
        }
    });

    if (targetSlots.length === 0) {
        return alert(`⚠️ No LOCKED slots found in Week ${weekNum}.\n\nPlease click "🔒 Lock Week" first to enable Admin Auto-Assignment.`);
    }

    // 3. Sort Slots Chronologically
    targetSlots.sort((a, b) => a.date - b.date);

    // 4. Prepare Staff Stats
    const deptCounts = {};
    let eligibleStaff = staffData.map(s => {
        if (s.status !== 'archived') deptCounts[s.dept] = (deptCounts[s.dept] || 0) + 1;
        return {
            ...s,
            pending: calculateStaffTarget(s) - getDutiesDoneCount(s.email),
            // Track weekly load dynamically
            weeklyLoad: {} // Key: "Month-Week" -> count
        };
    });

    // Pre-fill existing assignments into tracker
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

    const logEntries = [];
    let assignedCount = 0;
    const timestamp = new Date().toLocaleString();

    // 5. Process Each Slot
    for (const target of targetSlots) {
        const { key, date, slot } = target;
        const needed = slot.required - slot.assigned.length;

        if (needed <= 0) continue;

        // Contexts
        const mStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const wNum = getWeekOfMonth(date);
        const currentWeekKey = `${mStr}-${wNum}`;

        const prevDate = new Date(date); prevDate.setDate(date.getDate() - 1);
        const nextDate = new Date(date); nextDate.setDate(date.getDate() + 1);

        const slotDeptCounts = {};
        slot.assigned.forEach(email => {
            const s = staffData.find(st => st.email === email);
            if (s && s.dept) slotDeptCounts[s.dept] = (slotDeptCounts[s.dept] || 0) + 1;
        });

        // We need to run the selection loop 'needed' times
        // For each pick, we re-evaluate because the context (dept count) changes
        for (let i = 0; i < needed; i++) {

            // Score Candidates
            const candidates = eligibleStaff.map(s => {
                let score = s.pending * 100;
                let warnings = [];

                // --- HARD CONSTRAINTS ---
                if (slot.assigned.includes(s.email)) return null;
                if (isUserUnavailable(slot, s.email, key)) return null;
                if (s.status === 'archived') return null;

                // --- SOFT CONSTRAINTS ---
                // 1. Weekly Limit
                const dutiesThisWeek = s.weeklyLoad[currentWeekKey] || 0;
                if (dutiesThisWeek >= 3) {
                    score -= 5000;
                    warnings.push("Max 3/wk");
                }

                // 2. Same Day Conflict (Check DB directly for speed)
                const sameDayKeys = targetSlots.filter(t =>
                    t.date.toDateString() === date.toDateString() && t.key !== key
                ).map(t => t.key);

                if (sameDayKeys.some(sdk => invigilationSlots[sdk].assigned.includes(s.email))) {
                    score -= 2000;
                    warnings.push("Same Day");
                }

                // 3. Dept Saturation
                const dTotal = deptCounts[s.dept] || 0;
                if (dTotal > 1) {
                    const dAssigned = slotDeptCounts[s.dept] || 0;
                    if (dAssigned >= Math.ceil(dTotal * 0.6)) {
                        score -= 4000;
                        warnings.push("Dept Saturation");
                    }
                }

                // 4. Adjacent Day (Check DB)
                // Simplified check against current batch of target slots
                let hasAdjacent = false;
                targetSlots.forEach(t => {
                    if ((t.date.toDateString() === prevDate.toDateString() || t.date.toDateString() === nextDate.toDateString())
                        && t.slot.assigned.includes(s.email)) {
                        hasAdjacent = true;
                    }
                });
                if (hasAdjacent) {
                    score -= 1000;
                    warnings.push("Adjacent");
                }

                return { staff: s, score, warnings };
            }).filter(c => c !== null);

            // Sort High to Low
            candidates.sort((a, b) => b.score - a.score);

            if (candidates.length > 0) {
                const choice = candidates[0];

                // Assign
                slot.assigned.push(choice.staff.email);

                // Update Tracker
                choice.staff.pending--;
                if (!choice.staff.weeklyLoad[currentWeekKey]) choice.staff.weeklyLoad[currentWeekKey] = 0;
                choice.staff.weeklyLoad[currentWeekKey]++;

                slotDeptCounts[choice.staff.dept] = (slotDeptCounts[choice.staff.dept] || 0) + 1;

                assignedCount++;

                // --- GENERATE LOGIC REPORT FOR THIS SLOT ---
                // We append this decision to the slot's log history
                let logEntry = `
                    <div class="text-xs border-b border-gray-100 pb-1 mb-1">
                        <span class="text-green-700 font-bold">Auto-Assigned:</span> <b>${choice.staff.name}</b> 
                        <span class="text-gray-500">(Score: ${choice.score})</span>
                        ${choice.warnings.length > 0 ? `<span class="text-red-500 ml-1">[${choice.warnings.join(', ')}]</span>` : ""}
                    </div>`;

                // Add Skipped Candidates context
                const skipped = candidates.slice(1, 4); // Next 3 best
                if (skipped.length > 0) {
                    logEntry += `<div class="text-[10px] text-gray-500 ml-2 mb-2">Skipped: ` +
                        skipped.map(s => `${s.staff.name} (${s.score})`).join(', ') + `</div>`;
                }

                // Create/Append Log
                if (!slot.allocationLog) slot.allocationLog = `<div class="mb-2 pb-2 border-b"><div class="font-bold">Auto-Assign Run (${timestamp})</div></div>`;
                slot.allocationLog += logEntry;

                if (choice.warnings.length > 0) {
                    logEntries.push({
                        type: "WARN",
                        msg: `Assigned ${choice.staff.name} to ${key}. Breached: ${choice.warnings.join(", ")}`
                    });
                }
            }
        }
    }

    // 6. Save Global Log
    if (logEntries.length > 0) {
        const logRef = doc(db, "colleges", currentCollegeId);
        const newLogs = logEntries.map(e => `[${timestamp}] ${e.type}: ${e.msg}`);
        try { await updateDoc(logRef, { autoAssignLogs: arrayUnion(...newLogs) }); } catch (e) { }
    }

    logActivity("Auto-Assign Week", `Run for ${monthStr} Week ${weekNum}. Filled ${assignedCount} slots.`);

    // 7. Save Slots & Refresh
    await syncSlotsToCloud();
    renderSlotsGridAdmin();

    let alertMsg = `✅ Auto-Assign Complete!\nFilled ${assignedCount} positions.`;
    if (logEntries.length > 0) {
        alertMsg += `\n\n⚠️ ${logEntries.length} alerts generated (Rules Broken). Check Logs.`;
    }
    alert(alertMsg);
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
// --- ACTIVITY LOGGING SYSTEM (1MB Limit + FIFO) ---
async function logActivity(action, details) {
    try {
        const userEmail = currentUser ? currentUser.email : "Unknown";
        const timestamp = new Date().toISOString();

        // Short keys to save space: t=time, u=user, a=action, d=details
        const newEntry = { t: timestamp, u: userEmail, a: action, d: details };

        const logRef = doc(db, "colleges", currentCollegeId, "logs", "activity_log");
        const snap = await getDoc(logRef);

        let entries = [];
        if (snap.exists()) {
            entries = snap.data().entries || [];
        }

        entries.push(newEntry);

        // SIZE CHECK: Keep under ~1MB (approx 950k chars)
        while (JSON.stringify(entries).length > 950000) {
            entries.shift(); // Remove oldest
        }

        await setDoc(logRef, { entries: entries });

    } catch (e) {
        console.error("Logging Error:", e);
    }
}

// --- LIVE ACTIVITY LOG LOGIC ---
let activityLogUnsubscribe = null;
let currentLogData = [];

window.viewActivityLogs = function () {
    const list = document.getElementById('inconvenience-list');
    const titleEl = document.querySelector('#inconvenience-modal h3');
    const subtitleEl = document.getElementById('inconvenience-modal-subtitle');

    // 1. Setup Modal UI
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

    // 2. Attach Search Listener
    const searchInput = document.getElementById('act-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderLiveLogs(e.target.value));
    }

    // 3. Open Modal & Show Loading
    window.openModal('inconvenience-modal');
    list.innerHTML = '<div class="text-center py-6 text-gray-400 italic text-xs">Connecting to live feed...</div>';

    // 4. Start Real-Time Listener
    if (activityLogUnsubscribe) activityLogUnsubscribe(); // Clean up old listener

    const logRef = doc(db, "colleges", currentCollegeId, "logs", "activity_log");

    activityLogUnsubscribe = onSnapshot(logRef, (snap) => {
        if (snap.exists() && snap.data().entries) {
            currentLogData = snap.data().entries.reverse(); // Newest first

            // Render with current search term (preserves filter updates)
            const currentQuery = document.getElementById('act-search') ? document.getElementById('act-search').value : "";
            renderLiveLogs(currentQuery);
        } else {
            currentLogData = [];
            list.innerHTML = '<div class="text-center py-6 text-gray-400 italic text-xs">No activity logs found.</div>';
        }
    }, (error) => {
        console.error("Log Sync Error:", error);
        list.innerHTML = '<div class="text-center py-6 text-red-400 italic text-xs">Connection lost. Logs will reappear when online.</div>';
    });
};

// Helper to Render Logs
function renderLiveLogs(query = "") {
    const list = document.getElementById('inconvenience-list');
    if (!list) return;

    const q = query.toLowerCase();
    const filtered = currentLogData.filter(e =>
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
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = dateObj.toLocaleDateString();

        let borderClass = "border-l-4 border-gray-300";
        let bgClass = "bg-white";

        // Dynamic Coloring
        if (e.a.includes("Assigned") || e.a.includes("Booked") || e.a.includes("Available")) {
            borderClass = "border-l-4 border-green-500";
            bgClass = "bg-green-50";
        }
        if (e.a.includes("Removed") || e.a.includes("Cancelled") || e.a.includes("Withdraw")) {
            borderClass = "border-l-4 border-red-500";
            bgClass = "bg-red-50";
        }
        if (e.a.includes("Unavailable") || e.a.includes("Exchange")) {
            borderClass = "border-l-4 border-orange-500";
            bgClass = "bg-orange-50";
        }
        if (e.a.includes("Auto")) {
            borderClass = "border-l-4 border-blue-500";
            bgClass = "bg-blue-50";
        }

        const userDisplay = e.u.includes('@') ? e.u.split('@')[0] : e.u;

        return `
            <div class="p-3 mb-2 rounded shadow-sm border border-gray-200 ${borderClass} ${bgClass} text-xs transition-all hover:shadow-md">
                <div class="flex justify-between text-gray-500 mb-1 border-b border-gray-200/50 pb-1">
                    <span class="font-bold text-gray-700 truncate" title="${e.u}">${userDisplay}</span>
                    <span class="font-mono text-[10px]">${dateStr} ${timeStr}</span>
                </div>
                <div class="font-bold text-gray-900 mt-1">${e.a}</div>
                <div class="text-gray-600 mt-0.5 leading-relaxed">${e.d}</div>
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
// 📢 MESSAGING & ALERTS SYSTEM
// ==========================================
window.openWeeklyNotificationModal = function (monthStr, weekNum) {
    const list = document.getElementById('notif-list-container');
    const title = document.getElementById('notif-modal-title');
    const subtitle = document.getElementById('notif-modal-subtitle');

    title.textContent = `📢 Notify Week ${weekNum} (${monthStr})`;
    subtitle.textContent = "Send detailed professional emails (Faculty + Consolidated Dept Summary).";
    list.innerHTML = '';

    currentEmailQueue = [];

    // ... (Keep existing duty gathering logic) ...
    // 1. Gather Duties
    const facultyDuties = {};
    Object.keys(invigilationSlots).forEach(key => {
        const date = parseDate(key);
        const mStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const wNum = getWeekOfMonth(date);
        if (mStr === monthStr && wNum === weekNum) {
            const slot = invigilationSlots[key];
            const [dStr, tStr] = key.split(' | ');
            const isAN = (tStr.includes("PM") || tStr.startsWith("12"));
            const sessionCode = isAN ? "AN" : "FN";
            const dayName = date.toLocaleString('en-us', { weekday: 'short' });
            slot.assigned.forEach(email => {
                if (!facultyDuties[email]) facultyDuties[email] = [];
                facultyDuties[email].push({ date: dStr, day: dayName, session: sessionCode, time: tStr });
            });
        }
    });

    if (Object.keys(facultyDuties).length === 0) {
        list.innerHTML = `<div class="text-center text-gray-400 py-8 italic">No duties assigned in this week yet.</div>`;
        window.openModal('notification-modal');
        return;
    }
    // ... (End gathering logic) ...

    // 2. Add Bulk Buttons (WITH CANCEL BUTTON)
    list.innerHTML = `
        <div class="mb-4 pb-4 border-b border-gray-100 flex justify-between items-center">
            <div class="text-xs text-gray-500">
                Queue: <b>${Object.keys(facultyDuties).length}</b> Faculty + Dept Copies.
            </div>
            <div class="flex gap-2">
                <button id="btn-cancel-bulk" onclick="cancelBulkSending()" class="hidden bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-4 py-2 rounded shadow-sm hover:bg-red-200 transition flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    Stop / Cancel
                </button>
                
                <button id="btn-bulk-email-week" onclick="sendBulkEmails('btn-bulk-email-week')" 
                    class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded shadow-md transition flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    Send Bulk Emails
                </button>
            </div>
        </div>
    `;

    // ... (Rest of the function: Sorting, Aggregating Depts, Rendering List) ...
    // (Copy the rest of the logic from previous turn or your file here)

    // --- SHORTCUT FOR COPYING ---
    // Just use the loop logic from the previous `openWeeklyNotificationModal`
    // The only change was the `list.innerHTML = ...` block above.

    const deptAggregator = {};
    const sortedEmails = Object.keys(facultyDuties).sort((a, b) => getNameFromEmail(a).localeCompare(getNameFromEmail(b)));

    sortedEmails.forEach((email, index) => {
        const duties = facultyDuties[email];
        duties.sort((a, b) => a.date.split('.').reverse().join('').localeCompare(b.date.split('.').reverse().join('')));
        const dutyString = duties.map(d => `(${d.date}-${d.day}-${d.session})`).join(', ');
        const staff = staffData.find(s => s.email === email);
        const fullName = staff ? staff.name : email;
        const firstName = getFirstName(fullName);
        const staffEmail = staff ? staff.email : "";

        let phone = staff ? (staff.phone || "") : "";
        phone = phone.replace(/\D/g, '');
        if (phone.length === 10) phone = "91" + phone;

        // Emails
        const emailSubject = `Invigilation Duty: Week ${weekNum} (${monthStr})`;
        const emailBody = generateProfessionalEmail(fullName, duties, "Upcoming Invigilation Duties");
        const btnId = `email-btn-${index}`;

        if (staffEmail) {
            currentEmailQueue.push({ email: staffEmail, name: fullName, subject: emailSubject, body: emailBody, btnId: btnId });
        }

        // Dept Aggregation
        if (staff && staff.dept) {
            if (!deptAggregator[staff.dept]) deptAggregator[staff.dept] = [];
            deptAggregator[staff.dept].push({ name: fullName, duties: duties });
        }

        // WhatsApp (Elaborate & Detailed)
        const waMsg = generateWeeklyWhatsApp(fullName, duties);
        const waLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}` : "#";
        // SMS (Shortest Possible)
        const smsMsg = generateWeeklySMS(firstName, duties);
        const smsLink = phone ? `sms:${phone}?body=${encodeURIComponent(smsMsg)}` : "#";
        // *** NEW: Update Preview Box (Show 1st person's message) ***
        if (index === 0) {
            const previewEl = document.getElementById('notif-message-preview');
            if (previewEl) {
                previewEl.textContent = "--- WhatsApp Format ---\n" + waMsg + "\n\n--- SMS Format ---\n" + smsMsg;
            }
        }

        const shortDutyStr = dutyString.length > 100 ? dutyString.substring(0, 97) + "..." : dutyString;


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
                    <div class="text-xs text-gray-500 mt-1 font-mono truncate">${dutyString}</div>
                    ${staff && staff.dept ? `<div class="text-[9px] text-gray-400">${staff.dept}</div>` : ''}
                </div>
                <div class="flex gap-2 shrink-0">
                    <button id="${btnId}" onclick="sendSingleEmail(this, '${staffEmail}', '${safeName}', '${safeSubject}', '${safeBody}')" ${emailDisabled} class="bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded shadow transition flex items-center gap-1">Mail</button>
                    <a href="${smsLink}" target="_blank" ${phoneDisabled} class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded shadow transition">SMS</a>
                    <a href="${waLink}" target="_blank" ${phoneDisabled} onclick="markAsSent(this)" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded shadow transition">WA</a>
                </div>
            </div>
        `;
    });

    // Dept Emails
    const cleanDepts = departmentsConfig.map(d => (typeof d === 'string') ? { name: d, email: "" } : d);
    Object.keys(deptAggregator).forEach(deptName => {
        const deptObj = cleanDepts.find(d => d.name === deptName);
        if (deptObj && deptObj.email) {
            const facultyList = deptAggregator[deptName];
            const deptSubject = `Consolidated Duty List: ${deptName} - Week ${weekNum}`;
            const deptBody = generateDepartmentConsolidatedEmail(deptName, facultyList, weekNum, monthStr);
            currentEmailQueue.push({ email: deptObj.email, name: `HOD ${deptName}`, subject: deptSubject, body: deptBody, btnId: null });
            list.insertAdjacentHTML('beforeend', `<div class="bg-indigo-50 border border-indigo-100 p-2 rounded text-xs text-indigo-800 text-center mt-1"><span class="font-bold">queued:</span> Consolidated email for <b>${deptName}</b> (${deptObj.email})</div>`);
        }
    });

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
        const emailBody = generateProfessionalEmail(fullName, duties, "Duty Reminder");
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
        const shortDate = d.date.slice(0, 5); // "01.12"
        return `${shortDate}(${d.session})`;
    }).join(', ');

    return `${firstName}: Duties: ${shortList}. Portal: gvc.ac.in/exam -CS`;
}

// 3. Daily WhatsApp (Elaborate & Formal - Safe Emojis)
function generateDailyWhatsApp(name, dateStr, duties) {
    let dutyList = "";
    duties.forEach(d => {
        const rTime = calculateReportTime(d.time);
        // Using ▪️ (Square) and 🕒 (Clock) instead of complex emojis
        dutyList += `\n▪️ *Session:* ${d.session} (${d.time})\n   🕒 *Report by:* ${rTime}\n`;
    });

    // Using 🔔 (Bell) and ➡️ (Arrow) which are standard
    return `🔔 *INVIGILATION DUTY REMINDER* 🔔\n\nDear *${name}*,\n\nThis is to inform you that you have invigilation duty scheduled for tomorrow, *${dateStr}*.\n\n*Duty Details:*${dutyList}\n➡️ *Instructions:*\n1. Kindly abide by the rules and regulations of the University.\n2. Please report to the Chief Superintendent's office *before the stipulated time*.\n3. In case of any inconvenience/leave, you are strictly requested to *arrange a replacement* to ensure the examination is conducted uninterrupted.\n\nThank you for your cooperation.\n\n- Chief Superintendent\nExam Wing`;
}

// 4. Daily SMS (Shortest)
function generateDailySMS(firstName, dateStr, duties) {
    // Format: "John: Duty Tmrw 01.12 (FN). Report 9:00 AM. -CS"
    const shortDate = dateStr.slice(0, 5);
    const sessions = duties.map(d => d.session).join('&');
    const firstTime = calculateReportTime(duties[0].time);

    return `${firstName}: Duty Tmrw ${shortDate} (${sessions}). Report ${firstTime}. -CS`;
}

function calculateReportTime(timeStr) {
    try {
        let [time, mod] = timeStr.split(' ');
        let [h, m] = time.split(':');
        let date = new Date();
        date.setHours(parseInt(h) + (mod === 'PM' && h !== '12' ? 12 : 0));
        date.setMinutes(parseInt(m));

        // Subtract 30 mins
        date.setMinutes(date.getMinutes() - 30);

        // Format back
        let rh = date.getHours();
        let rm = date.getMinutes();
        let rMod = rh >= 12 ? 'PM' : 'AM';
        rh = rh % 12;
        rh = rh ? rh : 12;
        return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')} ${rMod}`;
    } catch (e) { return timeStr; }
}

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
                preferredDays: []
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




// --- HELPER: Professional Email Template ---
function generateProfessionalEmail(name, dutiesArray, title) {
    const collegeName = collegeData.examCollegeName || "Government Victoria College";

    let rows = dutiesArray.map(d => {
        // Calculate Report Time
        const reportTime = calculateReportTime(d.time);
        return `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${d.date}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${d.session} (${d.time})</td>
            <td style="padding: 8px; border: 1px solid #ddd; color: #c0392b; font-weight: bold;">${reportTime}</td>
        </tr>`;
    }).join('');

    return `
    <div style="font-family: Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
        <p>Dear <b>${name}</b>,</p>
        <p>This is an official intimation regarding your ${title} at <b>${collegeName}</b>.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
            <thead>
                <tr style="background-color: #f8f9fa; text-align: left;">
                    <th style="padding: 8px; border: 1px solid #ddd;">Date</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Session</th>
                    <th style="padding: 8px; border: 1px solid #ddd;">Reporting Time</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>

        <div style="background-color: #eef2ff; padding: 10px; border-radius: 5px; margin: 20px 0; font-size: 13px;">
            <strong>Instructions:</strong><br>
            Please report to the Chief Superintendent's office 30 minutes prior to the commencement of the examination.<br>
            <a href="https://bit.ly/gvc-exam" style="color: #4f46e5;">View General Instructions</a>
        </div>

        <p style="font-size: 13px; color: #666;">
            <em>For adjustments, please post in the <a href="http://www.gvc.ac.in/exam" style="color: #666;">Exam Portal</a>.</em><br>
            <span style="color: #c0392b; font-weight: bold;">Important: If your Exchange Request is not picked up, you must arrange a replacement personally.</span>
        </p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">
            <b>Exam Cell, ${collegeName}</b><br>
            <i>This is an automated system alert. Please do not reply directly to this email.</i>
        </p>
    </div>
    `;
}
// --- HELPER: Convert WhatsApp Text to HTML for Email ---
function formatMessageForEmail(text) {
    if (!text) return "";
    let html = text
        .replace(/\n/g, '<br>')
        .replace(/\*(.*?)\*/g, '<b>$1</b>')       // Bold *text*
        .replace(/_(.*?)_/g, '<i>$1</i>');       // Italic _text_
    return html;
}
// --- BULK EMAIL SENDER (With Cancel Option) ---
window.sendBulkEmails = async function (btnId) {
    const btn = document.getElementById(btnId);
    const cancelBtn = document.getElementById('btn-cancel-bulk'); // Get the cancel button

    if (!btn) return;

    if (currentEmailQueue.length === 0) return alert("No valid emails found to send.");
    if (!confirm(`Send detailed emails to ${currentEmailQueue.length} faculty members?`)) return;

    // 1. Reset State
    isBulkSendingCancelled = false;
    const originalText = btn.innerHTML;
    btn.disabled = true;

    // 2. Show Cancel Button
    if (cancelBtn) {
        cancelBtn.classList.remove('hidden');
        cancelBtn.disabled = false;
        cancelBtn.textContent = "Stop / Cancel";
        cancelBtn.classList.remove('opacity-50');
    }

    let sentCount = 0;
    let cancelled = false;

    // 3. Process Queue
    for (let i = 0; i < currentEmailQueue.length; i++) {

        // --- CHECK FOR CANCELLATION ---
        if (isBulkSendingCancelled) {
            cancelled = true;
            break; // Stop the loop
        }

        const item = currentEmailQueue[i];

        // Update Button Progress
        btn.innerHTML = `<svg class="animate-spin h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Sending ${i + 1}/${currentEmailQueue.length}...`;

        // Find individual button
        const indBtn = document.getElementById(item.btnId);
        if (indBtn) {
            indBtn.innerHTML = "Sending...";
            indBtn.classList.add('bg-gray-400');
        }

        try {
            // Send via Google Script
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

            // Success Update
            if (indBtn) {
                indBtn.innerHTML = "Sent";
                indBtn.classList.remove('bg-gray-400', 'bg-gray-700');
                indBtn.classList.add('bg-green-600', 'cursor-default');
            }
            sentCount++;

            // Delay to prevent rate limiting
            await new Promise(r => setTimeout(r, 800)); // Increased to 800ms for safety

        } catch (e) {
            console.error(`Failed to send to ${item.email}`, e);
            if (indBtn) indBtn.innerHTML = "Failed";
        }
    }

    // 4. Cleanup
    if (cancelBtn) cancelBtn.classList.add('hidden'); // Hide Cancel button

    if (cancelled) {
        btn.innerHTML = `⚠️ Stopped (${sentCount}/${currentEmailQueue.length})`;
        btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        btn.classList.add('bg-orange-600', 'cursor-default');
        alert(`Sending Cancelled.\nSuccessfully sent: ${sentCount}\nRemaining: ${currentEmailQueue.length - sentCount}`);
    } else {
        btn.innerHTML = `✅ Sent ${sentCount} Emails`;
        btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        btn.classList.add('bg-green-600', 'cursor-default');

        if (typeof logActivity === 'function') logActivity("Bulk Email", `Sent ${sentCount} automated emails to faculty.`);
        alert(`Batch Complete! ${sentCount} emails sent.`);
    }
}

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
    const btn = document.getElementById('global-target-lock-btn');

    if (input) {
        input.disabled = isGlobalTargetLocked;
        // Visual feedback
        if (!isGlobalTargetLocked) {
            input.classList.remove('text-gray-600');
            input.classList.add('text-black', 'bg-white');
            input.focus();
        } else {
            input.classList.add('text-gray-600');
            input.classList.remove('text-black', 'bg-white');
        }
    }
    if (btn) updateLockIcon('global-target-lock-btn', isGlobalTargetLocked);
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

    // 1. First Warning (Click OK)
    if (!confirm("⚠️ CRITICAL WARNING ⚠️\n\nThis will OVERWRITE all current system data including:\n- Staff List\n- Duty Assignments\n- Settings & Roles\n- Unavailability Records\n\nThis action cannot be undone. Do you want to proceed?")) {
        input.value = "";
        return;
    }

    // 2. Second Warning (Type CONFIRM)
    const check = prompt("🔴 FINAL SAFETY CHECK\n\nTo overwrite the database, please type 'CONFIRM' in the box below:");

    if (check !== "CONFIRM") {
        alert("❌ Restore Aborted.\nThe confirmation code was incorrect.");
        input.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const backup = JSON.parse(e.target.result);

            // Validation
            if (!backup.data || !backup.data.staffData) {
                throw new Error("Invalid backup file: Missing core data.");
            }

            // 1. Update Local State
            const d = backup.data;
            staffData = d.staffData || [];
            invigilationSlots = d.invigilationSlots || {};
            advanceUnavailability = d.advanceUnavailability || {};
            rolesConfig = d.rolesConfig || {};
            designationsConfig = d.designationsConfig || {};
            departmentsConfig = d.departmentsConfig || [];
            globalDutyTarget = d.globalDutyTarget || 2;
            googleScriptUrl = d.googleScriptUrl || "";

            // 2. Save to Cloud (Atomic Update)
            const ref = doc(db, "colleges", currentCollegeId);
            await updateDoc(ref, {
                examStaffData: JSON.stringify(staffData),
                examInvigilationSlots: JSON.stringify(invigilationSlots),
                invigAdvanceUnavailability: JSON.stringify(advanceUnavailability),
                invigRoles: JSON.stringify(rolesConfig),
                invigDesignations: JSON.stringify(designationsConfig),
                invigDepartments: JSON.stringify(departmentsConfig),
                invigGlobalTarget: globalDutyTarget,
                invigGoogleScriptUrl: googleScriptUrl
            });

            // 3. Refresh UI
            updateAdminUI();
            renderSlotsGridAdmin();
            alert("✅ System successfully restored from backup.");

        } catch (err) {
            console.error("Restore Error:", err);
            alert("Restore Failed: " + err.message);
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
// --- MANUAL ALLOCATION (Auto-Select Top N Candidates) ---
window.openManualAllocationModal = function (key) {
    const slot = invigilationSlots[key];

    // 1. Lock Check
    if (!slot.isLocked) {
        alert("⚠️ Please LOCK this slot first.\n\nManual allocation is only allowed in Locked mode to prevent conflicts.");
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

    // Force Integer for Requirement
    const requiredCount = parseInt(slot.required) || 0;
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

            // Penalties (Push to bottom)
            if (ctx.weekCount >= 3) { score -= 5000; badges.push("Max 3/wk"); }
            if (ctx.hasSameDay) { score -= 2000; badges.push("Same Day"); }
            if (ctx.hasAdjacent) { score -= 1000; badges.push("Adjacent"); }

            return { ...s, pending, score, badges };
        })
        .sort((a, b) => b.score - a.score); // Highest Score First

    // Capture Snapshot
    if (typeof lastManualRanking !== 'undefined') lastManualRanking = rankedStaff;

    // --- 5. RENDER & AUTO-SELECT ---
    const availList = document.getElementById('manual-available-list');
    availList.innerHTML = '';

    // AUTO-SELECT LOGIC
    const assignedList = slot.assigned || [];
    const isFreshAllocation = (assignedList.length === 0);
    let slotsToFill = isFreshAllocation ? requiredCount : 0;
    let currentSelectionCount = 0;

    rankedStaff.forEach(s => {
        // 1. Check Availability (If unavailable, skip and never select)
        if (isUserUnavailable(slot, s.email, key)) return;

        let isChecked = false;

        if (isFreshAllocation) {
            // Auto-select if we still need people
            if (slotsToFill > 0) {
                isChecked = true;
                slotsToFill--;
            }
        } else {
            // Keep existing assignments
            if (assignedList.includes(s.email)) {
                isChecked = true;
            }
        }

        if (isChecked) currentSelectionCount++;

        const checkState = isChecked ? 'checked' : '';
        const rowClass = isChecked ? 'bg-indigo-50' : 'hover:bg-gray-50';
        const pendingColor = s.pending > 0 ? 'text-red-600' : 'text-green-600';

        const warningHtml = s.badges.map(b =>
            `<span class="ml-1 text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded border border-orange-200">${b}</span>`
        ).join('');

        availList.innerHTML += `
            <tr class="${rowClass} border-b last:border-0 transition">
                <td class="px-3 py-2 text-center w-10">
                    <input type="checkbox" class="manual-chk w-4 h-4 text-indigo-600" value="${s.email}" ${checkState} onchange="window.updateManualCounts()">
                </td>
                <td class="px-3 py-2">
                    <div class="flex items-center flex-wrap">
                        <span class="font-bold text-gray-800 mr-2">${s.name}</span>
                        ${warningHtml}
                    </div>
                    <div class="text-[10px] text-gray-500">${s.dept} | ${s.designation}</div>
                </td>
                <td class="px-3 py-2 text-center font-mono font-bold ${pendingColor} w-16">
                    ${s.pending}
                </td>
            </tr>`;
    });

    if (availList.innerHTML === "") {
        availList.innerHTML = `<tr><td colspan="3" class="text-center p-4 text-gray-500 italic">No available staff found.</td></tr>`;
    }

    // 6. Render Unavailable List
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
                <div class="bg-white p-2 rounded border border-red-200 text-xs shadow-sm mb-1">
                    <div class="font-bold text-red-700">${s.name}</div>
                    <div class="text-gray-600 font-medium mt-0.5">${reason}</div>
                </div>`;
        });
    } else {
        unavList.innerHTML = `<div class="text-center text-gray-400 text-xs py-4 italic">No requests.</div>`;
    }

    // 7. Update Counters & Open
    document.getElementById('manual-sel-count').textContent = currentSelectionCount;
    // *** FIX: Update the Required count in the footer as well ***
    const reqCountEl = document.getElementById('manual-req-count');
    if (reqCountEl) reqCountEl.textContent = requiredCount;
    // ************************************************************
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
        const timestamp = new Date().toLocaleString();
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
        // Removed 'min-h' and fixed height classes. Now using flex-col for structure.
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

            // Determine Action based on status
            // If Posted -> Click to Withdraw. If Duty -> Click to Post.
            const action = isPosted ? `withdrawExchange('${key}', '${email}')` : `postForExchange('${key}', '${email}')`;
            const hint = isPosted ? "Click to Withdraw Request" : "Click to Post for Exchange";

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

    // Unavailability Warning (Compact)
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
    // - max-height: 60vh (Limits tall lists)
    // - h-auto (Shrinks for short lists)
    // - overflow-y-auto (Scrolls only when needed)
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

            // Added cursor-pointer and onclick handler
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
                            ${item.label.includes('Posted') ? 'Withdraw' : 'Exchange'} ➝
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
        // Structure: { "YYYY-MM-DD": { dateObj, dateStr, FN: { assigned: [], posted: [], unavailable: [] }, AN: { ... } } }
        const schedule = {};

        const getDayEntry = (dateObj, dateStr) => {
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

        // A. Process Invigilation Slots (Duties & Slot-Specific Leaves)
        Object.keys(invigilationSlots).forEach(key => {
            const date = parseDate(key);
            if (date < today) return; // Filter Past

            const [dStr, tStr] = key.split(' | ');
            const isAN = (tStr.includes("PM") || tStr.startsWith("12:") || tStr.startsWith("12."));
            const sess = isAN ? "AN" : "FN";

            const dayEntry = getDayEntry(date, dStr);
            const slot = invigilationSlots[key];

            // Assigned & Posted (Exchange)
            slot.assigned.forEach(email => {
                if (deptStaffEmails.has(email)) {
                    dayEntry[sess].assigned.push(email);
                    // Check if they posted it for exchange
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

        // B. Process Advance Unavailability (General Leaves)
        Object.keys(advanceUnavailability).forEach(dateStr => {
            const [d, m, y] = dateStr.split('.');
            const date = new Date(y, m - 1, d);

            if (date < today) return;

            const dayEntry = getDayEntry(date, dateStr);

            ['FN', 'AN'].forEach(sess => {
                if (advanceUnavailability[dateStr][sess]) {
                    advanceUnavailability[dateStr][sess].forEach(u => {
                        if (deptStaffEmails.has(u.email)) {
                            // Avoid duplicates if already caught in slot-specific above
                            const exists = dayEntry[sess].unavailable.some(x => x.email === u.email);
                            if (!exists) {
                                dayEntry[sess].unavailable.push({ email: u.email, reason: u.reason });
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

            // Only render if there is data for this day
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
// This makes functions available to HTML onclick="" events
window.toggleLock = toggleLock;
window.waNotify = waNotify;
window.volunteer = volunteer;
window.cancelDuty = cancelDuty;
window.setAvailability = setAvailability;
window.openDayModal = openDayModal;
window.confirmUnavailable = confirmUnavailable;
window.toggleUnavDetails = toggleUnavDetails;
window.switchToStaffView = switchToStaffView;
window.initAdminDashboard = initAdminDashboard;
window.calculateSlotsFromSchedule = calculateSlotsFromSchedule;
window.runAutoAllocation = runAutoAllocation;
window.openInconvenienceModal = openInconvenienceModal;
window.openManualAllocationModal = openManualAllocationModal;
window.saveManualAllocation = saveManualAllocation;
window.saveNewStaff = saveNewStaff;
window.deleteStaff = deleteStaff;
window.openRoleAssignmentModal = openRoleAssignmentModal;
window.saveRoleAssignment = saveRoleAssignment;
window.removeRoleFromStaff = removeRoleFromStaff;
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');
window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
window.toggleUnavDetails = toggleUnavDetails;
window.changeSlotReq = changeSlotReq;
window.updateManualCounts = updateManualCounts;
window.openRoleConfigModal = openRoleConfigModal;
window.addNewRoleConfig = addNewRoleConfig;
window.deleteRoleConfig = deleteRoleConfig;
window.saveRoleConfig = saveRoleConfig;
window.editRoleConfig = editRoleConfig;
window.lockAllSessions = lockAllSessions;
window.changeSlotReq = changeSlotReq;
window.openAddSlotModal = openAddSlotModal;
window.saveManualSlot = saveManualSlot;
window.loadSessionAttendance = loadSessionAttendance;
window.addSubstituteToAttendance = addSubstituteToAttendance;
window.updateAttCount = updateAttCount;
window.saveAttendance = saveAttendance;
window.openDutyNormsModal = openDutyNormsModal;
window.acceptExchange = acceptExchange;
window.toggleAdvance = toggleAdvance;
window.toggleWholeDay = toggleWholeDay;
window.addNewDepartment = addNewDepartment;
window.deleteDepartment = deleteDepartment;
window.toggleAttendanceLock = toggleAttendanceLock;
window.toggleWeekLock = toggleWeekLock;
window.printSessionReport = printSessionReport;
window.renderAdminTodayStats = renderAdminTodayStats;
window.openCompletedDutiesModal = openCompletedDutiesModal;
window.runWeeklyAutoAssign = runWeeklyAutoAssign;
window.viewAutoAssignLogs = viewAutoAssignLogs;
window.viewActivityLogs = viewActivityLogs;
window.openWeeklyNotificationModal = openWeeklyNotificationModal;
window.openSlotReminderModal = openSlotReminderModal;
window.markAsSent = markAsSent;
window.sendSessionSMS = sendSessionSMS;
window.downloadAttendanceCSV = downloadAttendanceCSV;
window.downloadStaffTemplate = downloadStaffTemplate;
window.handleStaffCSVUpload = handleStaffCSVUpload;
window.clearOldData = clearOldData;
window.openAddStaffModal = openAddStaffModal;
window.editStaff = editStaff;
window.sendSingleEmail = sendSingleEmail;
window.sendBulkEmails = sendBulkEmails;
window.getFirstName = getFirstName;
window.toggleStaffListLock = toggleStaffListLock;
window.toggleEmailConfigLock = toggleEmailConfigLock;
window.toggleGlobalTargetLock = toggleGlobalTargetLock;
window.downloadMasterBackup = downloadMasterBackup;
window.handleMasterRestore = handleMasterRestore;
window.downloadAttendanceTemplate = downloadAttendanceTemplate;
window.handleAttendanceCSVUpload = handleAttendanceCSVUpload;
window.filterManualStaff = filterManualStaff;
window.changeAdminMonth = changeAdminMonth;
window.cancelBulkSending = cancelBulkSending;
window.viewSlotHistory = viewSlotHistory;
window.filterStaffTable = function () {
    currentStaffPage = 1; // Reset to first page on search
    renderStaffTable();
}
window.switchAdminTab = function (tabName) {
    // Hide All
    document.getElementById('tab-content-staff').classList.add('hidden');
    document.getElementById('tab-content-slots').classList.add('hidden');
    document.getElementById('tab-content-attendance').classList.add('hidden'); // <--- NEW

    // Reset Buttons
    document.getElementById('tab-btn-staff').classList.replace('border-indigo-600', 'border-transparent');
    document.getElementById('tab-btn-slots').classList.replace('border-indigo-600', 'border-transparent');
    document.getElementById('tab-btn-attendance').classList.replace('border-indigo-600', 'border-transparent'); // <--- NEW

    // Show Target
    document.getElementById(`tab-content-${tabName}`).classList.remove('hidden');
    document.getElementById(`tab-btn-${tabName}`).classList.replace('border-transparent', 'border-indigo-600');
}


function showView(viewName) {
    Object.values(views).forEach(el => el.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
}

