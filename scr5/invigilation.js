import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, orderBy, onSnapshot } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = window.firebase.auth;
const db = window.firebase.db;
const provider = window.firebase.provider;

// --- CONFIG ---
const DEFAULT_DESIGNATIONS = { "Assistant Professor": 2, "Associate Professor": 1, "Guest Lecturer": 4, "Professor": 0 };
// REPLACE the existing DEFAULT_ROLES line with this:
const DEFAULT_ROLES = { 
    "Vice Principal": 0, 
    "HOD": 1, 
    "NSS Officer": 1, 
    "Warden": 0, 
    "Exam Chief": 0,
    "Chief Superintendent": 0,       // <--- NEW
    "Senior Asst. Superintendent": 0 // <--- NEW
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
let currentEmailQueue = []; // Stores the list for bulk sending

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
            collegeData = docSnap.data();
            
            // CONFIGS
            designationsConfig = JSON.parse(collegeData.invigDesignations || JSON.stringify(DEFAULT_DESIGNATIONS));
            rolesConfig = JSON.parse(collegeData.invigRoles || JSON.stringify(DEFAULT_ROLES));
            googleScriptUrl = collegeData.invigGoogleScriptUrl || "";
            departmentsConfig = JSON.parse(collegeData.invigDepartments || JSON.stringify(DEFAULT_DEPARTMENTS));
            globalDutyTarget = parseInt(collegeData.invigGlobalTarget || 2);
            
            // DATA
            staffData = JSON.parse(collegeData.examStaffData || '[]');
            invigilationSlots = JSON.parse(collegeData.examInvigilationSlots || '{}');
            
            // NEW: Load Advance Unavailability
            advanceUnavailability = JSON.parse(collegeData.invigAdvanceUnavailability || '{}');
            // *** FIX: LOAD GLOBAL TARGET (Was Missing) ***
            if (collegeData.invigGlobalTarget !== undefined) {
                globalDutyTarget = parseInt(collegeData.invigGlobalTarget);
            } else {
                globalDutyTarget = 2; // Default if not set
            }
            // *** ADD THIS LINE ***
            googleScriptUrl = collegeData.invigGoogleScriptUrl || "";
            
            if (mode === 'admin') {
                if (document.getElementById('view-admin').classList.contains('hidden') && 
                    document.getElementById('view-staff').classList.contains('hidden')) {
                    initAdminDashboard();
                } else {
                    updateAdminUI();
                    renderSlotsGridAdmin();
                    renderAdminTodayStats();
                    if (!document.getElementById('view-staff').classList.contains('hidden')) {
                         const me = staffData.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase());
                         if(me) { 
                             renderStaffCalendar(me.email); 
                             renderStaffRankList(me.email);
                             if(typeof renderExchangeMarket === "function") renderExchangeMarket(me.email);
                         }
                    }
                }
            } else {
                // STAFF MODE
                const me = staffData.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase());
                if (me) {
                    if (document.getElementById('view-staff').classList.contains('hidden')) {
                        initStaffDashboard(me);
                    } else {
                        // LIVE REFRESH
                        renderStaffCalendar(me.email);
                        renderStaffRankList(me.email);
                        if(typeof renderExchangeMarket === "function") renderExchangeMarket(me.email);
                        
                        // --- UPDATE STATS LIVE ---
                        const done = getDutiesDoneCount(me.email);
                        const pending = Math.max(0, calculateStaffTarget(me) - done); // FIX: No negative
                        
                        document.getElementById('staff-view-pending').textContent = pending;
                        const completedEl = document.getElementById('staff-view-completed');
                        if(completedEl) completedEl.textContent = done;
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
// NEW: Calculate Duties Done based on actual attendance
function getDutiesDoneCount(email) {
    let count = 0;
    // Iterate through all slots to find confirmed attendance
    Object.values(invigilationSlots).forEach(slot => {
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
    // We calculate up to 'today' (or end of AY if today is past it)
    let calcEnd = (today < acYear.end) ? today : acYear.end;
    
    // Start from June 1st OR Joining Date (whichever is later)
    const joinDate = new Date(staff.joiningDate);
    let calcStart = (joinDate > acYear.start) ? joinDate : acYear.start;

    // Safety: Joined in future
    if (calcStart > calcEnd) return 0; 

    let totalTarget = 0;
    let cursor = new Date(calcStart);
    
    // 3. Iterate Month by Month
    while (cursor <= calcEnd) {
        const currentMonthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const currentMonthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        
        // --- STEP A: SET BASELINE (Designation) ---
        // This applies PERMANENTLY unless overridden by a temporary role.
        let monthlyRate = globalDutyTarget; // Default fallback
        
        if (designationsConfig[staff.designation] !== undefined) {
             monthlyRate = designationsConfig[staff.designation];
        }

        // --- STEP B: CHECK FOR TEMPORARY OVERRIDE (Role) ---
        // Only applies if a role is active during THIS specific month.
        if (staff.roleHistory && staff.roleHistory.length > 0) {
            
            const activeRoles = staff.roleHistory.filter(r => {
                const rStart = new Date(r.start);
                const rEnd = new Date(r.end);
                // Check Overlap: Did this role exist during this month?
                return rStart <= currentMonthEnd && rEnd >= currentMonthStart;
            });

            if (activeRoles.length > 0) {
                // If multiple roles active, find the one with the LOWEST target (Max Relaxation)
                let bestRoleTarget = monthlyRate;
                let hasApplicableRole = false;

                activeRoles.forEach(r => {
                    if (rolesConfig[r.role] !== undefined) {
                        const t = rolesConfig[r.role];
                        // Relaxation Logic: Only apply if it REDUCES the duty load
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

        // Add this month's result to total
        totalTarget += monthlyRate;
        
        // --- STEP C: MOVE TO NEXT MONTH ---
        // Set date to 1st of next month to avoid edge cases
        cursor.setDate(1); 
        cursor.setMonth(cursor.getMonth() + 1);
        
        // Stop if we pass the end date
        if (cursor.getFullYear() > calcEnd.getFullYear() + 1) break; 
    }

    return totalTarget;
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
    if(completedEl) completedEl.textContent = done;

    const completedCard = document.getElementById('staff-completed-card');
    if(completedCard) {
        completedCard.onclick = () => window.openCompletedDutiesModal(me.email);
    }
    
    updateHeaderButtons('staff');
    renderStaffCalendar(me.email);
    renderStaffRankList(me.email); 
    
    if(typeof renderExchangeMarket === "function") {
        renderExchangeMarket(me.email);
    }
    
    showView('staff');
    
    document.getElementById('cal-prev').onclick = () => { 
        currentCalDate.setMonth(currentCalDate.getMonth()-1); 
        renderStaffCalendar(me.email); 
        if(typeof renderExchangeMarket === "function") renderExchangeMarket(me.email);
    };
    document.getElementById('cal-next').onclick = () => { 
        currentCalDate.setMonth(currentCalDate.getMonth()+1); 
        renderStaffCalendar(me.email); 
        if(typeof renderExchangeMarket === "function") renderExchangeMarket(me.email);
    };
}

// --- HELPERS ---
function isUserUnavailable(slot, email, key) {
    // 1. Check Slot Specific Unavailability
    if (slot && slot.unavailable && slot.unavailable.some(u => (typeof u === 'string' ? u === email : u.email === email))) return true;

    // 2. Check Advance Unavailability (if key is provided)
    if (key) {
        const [dateStr, timeStr] = key.split(' | ');
        if (advanceUnavailability[dateStr]) {
            // Determine Session
            let session = "FN";
            const t = timeStr ? timeStr.toUpperCase() : "";
            if (t.includes("PM") || t.startsWith("12:") || t.startsWith("12.")) session = "AN";
            
            const list = advanceUnavailability[dateStr][session];
            if (list) {
                // Check if email exists in the list of objects
                return list.some(u => u.email === email);
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
    if(desigSelect) desigSelect.innerHTML = Object.keys(designationsConfig).map(r => `<option value="${r}">${r}</option>`).join('');
    
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
window.sendSingleEmail = function(btn, email, name, subject, message) {
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
        if(typeof logActivity === 'function') logActivity("Email Sent", `Auto-email sent to ${name} (${email}).`);
    })
    .catch(error => {
        console.error('FAILED...', error);
        alert("Network Error: Could not reach Google Script.\nCheck your internet or the Script URL.");
        btn.disabled = false;
        btn.innerHTML = originalText;
        btn.classList.add('bg-red-600');
    });
}
// --- RENDER ADMIN SLOTS (Grouped by Month & Week, Slots Ascending) ---
function renderSlotsGridAdmin() {
    if(!ui.adminSlotsGrid) return;
    ui.adminSlotsGrid.innerHTML = '';
    
    // 1. Prepare Data & Sort
    const slotItems = Object.keys(invigilationSlots).map(key => ({
        key,
        date: parseDate(key),
        slot: invigilationSlots[key]
    }));

    slotItems.sort((a, b) => b.date - a.date);

    let lastMonth = "";

    if (slotItems.length === 0) {
        ui.adminSlotsGrid.innerHTML = `<div class="col-span-full text-center text-gray-400 py-10 italic">No exam slots available. Add a slot to begin.</div>`;
        return;
    }

    // Group Logic
    const groupedSlots = {};
    slotItems.forEach(item => {
        const monthStr = item.date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const weekNum = getWeekOfMonth(item.date);
        const groupKey = `${monthStr}-W${weekNum}`;
        if (!groupedSlots[groupKey]) {
            groupedSlots[groupKey] = { month: monthStr, week: weekNum, items: [] };
        }
        groupedSlots[groupKey].items.push(item);
    });

    // Sort Groups (Newest Week First)
    const sortedGroupKeys = Object.keys(groupedSlots).sort((a, b) => {
        const dateA = groupedSlots[a].items[0].date;
        const dateB = groupedSlots[b].items[0].date;
        return dateB - dateA;
    });

    sortedGroupKeys.forEach(gKey => {
        const group = groupedSlots[gKey];
        
        // Month Header
        if (group.month !== lastMonth) {
            ui.adminSlotsGrid.innerHTML += `
                <div class="col-span-full mt-6 mb-1 border-b border-gray-300 pb-2">
                    <h3 class="text-lg font-bold text-gray-700 flex items-center gap-2">📅 ${group.month}</h3>
                </div>`;
            lastMonth = group.month;
        }

        // Week Header (With NOTIFY Button)
        ui.adminSlotsGrid.innerHTML += `
            <div class="col-span-full mt-3 mb-2 flex flex-wrap justify-between items-center bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 shadow-sm gap-2">
                <span class="text-indigo-900 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <span class="bg-white px-2 py-0.5 rounded border border-indigo-100">Week ${group.week}</span>
                </span>
                <div class="flex gap-2">
                    <button onclick="openWeeklyNotificationModal('${group.month}', ${group.week})" 
                        class="text-[10px] bg-green-600 text-white border border-green-700 px-3 py-1 rounded hover:bg-green-700 font-bold transition shadow-sm flex items-center gap-1">
                        📢 Notify Faculty
                    </button>

                    <button onclick="runWeeklyAutoAssign('${group.month}', ${group.week})" 
                        class="text-[10px] bg-indigo-600 text-white border border-indigo-700 px-3 py-1 rounded hover:bg-indigo-700 font-bold transition shadow-sm flex items-center gap-1">
                        ⚡ Auto-Assign
                    </button>
                    <button onclick="toggleWeekLock('${group.month}', ${group.week}, true)" 
                        class="text-[10px] bg-white border border-red-200 text-red-600 px-3 py-1 rounded hover:bg-red-50 font-bold transition shadow-sm flex items-center gap-1">
                        🔒 Lock
                    </button>
                    <button onclick="toggleWeekLock('${group.month}', ${group.week}, false)" 
                        class="text-[10px] bg-white border border-green-200 text-green-600 px-3 py-1 rounded hover:bg-green-50 font-bold transition shadow-sm flex items-center gap-1">
                        🔓 Unlock
                    </button>
                </div>
            </div>`;

        // Render Slots (Ascending Date Order within Week)
        group.items.sort((a, b) => a.date - b.date);
        
        group.items.forEach(({ key, slot }) => {
            const filled = slot.assigned.length;
            let statusColor = slot.isLocked ? "border-red-500 bg-red-50" : (filled >= slot.required ? "border-green-400 bg-green-50" : "border-orange-300 bg-orange-50");
            let statusIcon = slot.isLocked ? "🔒" : (filled >= slot.required ? "✅" : "🔓");

            let unavButton = "";
            if (slot.unavailable && slot.unavailable.length > 0) {
                unavButton = `<button onclick="openInconvenienceModal('${key}')" class="mt-2 w-full flex items-center justify-center gap-2 bg-white text-red-700 border border-red-200 px-2 py-1.5 rounded text-xs font-bold hover:bg-red-50 transition shadow-sm"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> View ${slot.unavailable.length} Inconvenience(s)</button>`;
            }

            ui.adminSlotsGrid.innerHTML += `
                <div class="border-l-4 ${statusColor} bg-white p-4 rounded shadow-sm slot-card flex flex-col justify-between transition-all">
                    <div>
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-bold text-gray-800 text-sm w-1/2 break-words flex items-center gap-1">${statusIcon} ${key}</h4>
                            <div class="flex items-center bg-white border border-gray-300 rounded text-xs shadow-sm">
                                <button onclick="changeSlotReq('${key}', -1)" class="px-2 py-1 hover:bg-gray-100 border-r text-gray-600 font-bold">-</button>
                                <span class="px-2 font-bold text-gray-800" title="Filled / Required">${filled} / ${slot.required}</span>
                                <button onclick="changeSlotReq('${key}', 1)" class="px-2 py-1 hover:bg-gray-100 border-l text-gray-600 font-bold">+</button>
                            </div>
                        </div>
                        <div class="text-xs text-gray-600 mb-2"><strong>Assigned:</strong> ${slot.assigned.map(email => getNameFromEmail(email)).join(', ') || "None"}</div>
                        ${unavButton}
                    </div>
                    <div class="grid grid-cols-3 gap-2 mt-3">
                        <button onclick="openSlotReminderModal('${key}')" class="col-span-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded py-1.5 hover:bg-green-100 font-bold transition" title="Send Daily Reminder">
                            🔔 Remind
                        </button>
                        <button onclick="printSessionReport('${key}')" class="col-span-1 text-xs bg-gray-100 text-gray-700 border border-gray-300 rounded py-1.5 hover:bg-gray-200 font-bold flex items-center justify-center gap-1 transition" title="Print Report"><span>🖨️</span> Print</button>
                        <button onclick="openManualAllocationModal('${key}')" class="col-span-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded py-1.5 hover:bg-indigo-100 font-bold transition">Manual</button>
                    </div>
                     <button onclick="toggleLock('${key}')" class="w-full mt-2 text-xs border border-gray-300 rounded py-1.5 hover:bg-gray-50 text-gray-700 font-medium transition shadow-sm bg-white">${slot.isLocked ? 'Unlock Slot' : 'Lock Slot'}</button>
                </div>`;
        });
    });
}
function renderStaffTable() {
    if(!ui.staffTableBody) return;
    ui.staffTableBody.innerHTML = '';
    const filter = document.getElementById('staff-search').value.toLowerCase();
    const today = new Date(); // Current timestamp for role check

    staffData.forEach((staff, index) => {
        // Filter out archived
        if (staff.status === 'archived') return;
        
        // Search Filter
        if (filter && !staff.name.toLowerCase().includes(filter)) return;
        
        const target = calculateStaffTarget(staff);
        const done = getDutiesDoneCount(staff.email);
        const pending = Math.max(0, target - done);

        // --- 1. CURRENT ROLE TAG LOGIC ---
        let activeRoleLabel = "";
        if (staff.roleHistory && staff.roleHistory.length > 0) {
            // Find role where TODAY is between Start and End
            const activeRole = staff.roleHistory.find(r => {
                const start = new Date(r.start);
                const end = new Date(r.end);
                return start <= today && end >= today;
            });
            
            if (activeRole) {
                activeRoleLabel = `<span class="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded ml-1 border border-purple-200 font-bold">${activeRole.role}</span>`;
            }
        }
        // ---------------------------------
        
        const statusColor = pending > 3 ? 'text-red-600 font-bold' : (pending > 0 ? 'text-orange-600' : 'text-green-600');
        
        // --- 2. LOCK LOGIC ---
        let actionButtons = "";
        if (isStaffListLocked) {
            actionButtons = `<span class="text-gray-400 text-xs italic mr-2">Locked</span>`;
        } else {
            actionButtons = `
                <button onclick="editStaff(${index})" class="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-100 transition">Edit</button>
                <button onclick="openRoleAssignmentModal(${index})" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 transition">Role</button>
                <button onclick="deleteStaff(${index})" class="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 transition">&times;</button>
            `;
        }

        const row = document.createElement('tr');
        row.className = "hover:bg-gray-50 transition border-b border-gray-100";
        row.innerHTML = `
            <td class="px-6 py-3"><div class="flex items-center"><div class="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs mr-3">${staff.name.charAt(0)}</div><div><div class="text-sm font-bold text-gray-800">${staff.name}</div><div class="text-xs text-gray-500">${staff.designation} ${activeRoleLabel}</div></div></div></td>
            <td class="px-6 py-3 text-center font-mono text-sm text-gray-600">${target}</td>
            <td class="px-6 py-3 text-center font-mono text-sm font-bold">${done}</td>
            <td class="px-6 py-3 text-center font-mono text-sm ${statusColor}">${pending}</td>
            <td class="px-6 py-3 text-right text-xs font-medium flex justify-end gap-2 items-center">
                ${actionButtons}
            </td>
        `;
        ui.staffTableBody.appendChild(row);
    });
}

function renderStaffRankList(myEmail) {
    // Target BOTH lists (Desktop & Mobile)
    const containers = [
        document.getElementById('staff-rank-list'),
        document.getElementById('staff-rank-list-mobile')
    ];
    
    // 1. Calculate and Sort
    const rankedStaff = staffData
        .filter(s => s.status !== 'archived')
        .map(s => ({ 
            ...s, 
            pending: calculateStaffTarget(s) - getDutiesDoneCount(s.email) 
        }))
        .sort((a, b) => {
            if (b.pending !== a.pending) return b.pending - a.pending;
            return a.name.localeCompare(b.name);
        });

    // 2. Generate HTML
    const html = rankedStaff.map((s, i) => {
        const isMe = s.email === myEmail;
        const bgClass = isMe ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-transparent hover:bg-gray-100";
        const textClass = isMe ? "text-indigo-700 font-bold" : "text-gray-700";
        const rankBadge = i < 3 ? `text-orange-500 font-black` : `text-gray-400 font-medium`;
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
                    <span class="${rankBadge} w-4 text-center shrink-0">${i + 1}</span>
                    <div class="flex flex-col min-w-0">
                        <div class="flex items-center gap-1">
                            <span class="truncate ${textClass}">${s.name}</span>
                            ${roleBadge}
                        </div>
                        <span class="text-[9px] text-gray-400 truncate">${s.dept}</span>
                    </div>
                </div>
                <span class="font-mono font-bold ${displayPending > 0 ? 'text-red-600' : 'text-green-600'} ml-2">${displayPending}</span>
            </div>`;
    }).join('');

    // 3. Inject into DOM
    containers.forEach(container => {
        if(container) container.innerHTML = html;
    });
}

function renderStaffCalendar(myEmail) {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    if(ui.calTitle) ui.calTitle.textContent = `${monthNames[month]} ${year}`;

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
        const dateStr = `${String(day).padStart(2,'0')}.${String(month+1).padStart(2,'0')}.${year}`;
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
    if(ui.calGrid) ui.calGrid.innerHTML = html;
}

function renderExchangeMarket(myEmail) {
    const list = document.getElementById('staff-market-list');
    const badge = document.getElementById('market-count-badge');
    if (!list) return;

    list.innerHTML = '';
    
    // 1. Find all slots with active exchange requests
    const marketSlots = [];
    Object.keys(invigilationSlots).forEach(key => {
        const slot = invigilationSlots[key];
        if (slot.exchangeRequests && slot.exchangeRequests.length > 0) {
            // Filter: Don't show my own requests (I can't swap with myself)
            const othersRequests = slot.exchangeRequests.filter(reqEmail => reqEmail !== myEmail);
            
            othersRequests.forEach(sellerEmail => {
                marketSlots.push({
                    key: key,
                    seller: sellerEmail,
                    slotData: slot
                });
            });
        }
    });

    // 2. Sort by Date (Sooner first)
    marketSlots.sort((a, b) => {
        // Parse date for sorting (simplified)
        const dateA = a.key.split('|')[0].split('.').reverse().join('-');
        const dateB = b.key.split('|')[0].split('.').reverse().join('-');
        return dateA.localeCompare(dateB);
    });

    // 3. Update Badge
    if (badge) badge.textContent = marketSlots.length;

    // 4. Render
    if (marketSlots.length === 0) {
        list.innerHTML = `<p class="text-xs text-gray-400 italic text-center py-2">No duties available for exchange.</p>`;
        return;
    }

    marketSlots.forEach(item => {
        const sellerName = getNameFromEmail(item.seller);
        const [date, time] = item.key.split(' | ');
        
        // Check for conflicts
        const sameDaySessions = Object.keys(invigilationSlots).filter(k => k.startsWith(date) && k !== item.key);
        const hasConflict = sameDaySessions.some(k => invigilationSlots[k].assigned.includes(myEmail));
        const amAlreadyAssigned = item.slotData.assigned.includes(myEmail);

        let actionBtn = "";
        
        if (amAlreadyAssigned) {
             actionBtn = `<span class="text-[10px] text-gray-400 font-medium">You are on this duty</span>`;
        } else if (hasConflict) {
             actionBtn = `<span class="text-[10px] text-red-400 font-medium">Time Conflict</span>`;
        } else {
             actionBtn = `
                <button onclick="acceptExchange('${item.key}', '${myEmail}', '${item.seller}')" 
                    class="bg-indigo-600 text-white text-[10px] px-3 py-1.5 rounded font-bold hover:bg-indigo-700 shadow-sm transition flex items-center gap-1">
                    Accept
                </button>`;
        }

        list.innerHTML += `
            <div class="bg-white p-2.5 rounded border border-indigo-100 shadow-sm hover:shadow-md transition">
                <div class="flex justify-between items-start mb-1">
                    <div class="font-bold text-gray-800 text-xs">${date}</div>
                    <div class="text-[10px] text-gray-500 bg-gray-100 px-1.5 rounded">${time}</div>
                </div>
                <div class="flex justify-between items-center mt-2">
                    <div class="flex items-center gap-1.5">
                        <div class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                            ${sellerName.charAt(0)}
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] text-gray-500 leading-none">Request by</span>
                            <span class="text-xs font-bold text-gray-700 leading-none">${sellerName}</span>
                        </div>
                    </div>
                    ${actionBtn}
                </div>
            </div>
        `;
    });
}

window.openDayModal = function(dateStr, email) {
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

            // Staff List
            let staffListHtml = '';
            if (slot.assigned.length > 0) {
                const listItems = slot.assigned.map(st => {
                    const s = staffData.find(sd => sd.email === st);
                    if (!s) return ''; 
                    const isExchanging = slot.exchangeRequests && slot.exchangeRequests.includes(st);
                    const statusIcon = isExchanging ? "⏳" : "✅";
                    return `<div class="flex justify-between items-center text-xs bg-white p-1.5 rounded border border-gray-100 mb-1"><span class="font-bold text-gray-700">${statusIcon} ${s.name}</span></div>`;
                }).join('');
                staffListHtml = `<div class="mt-3 pt-2 border-t border-gray-200"><div class="text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Assigned Staff</div><div class="space-y-0.5 max-h-24 overflow-y-auto custom-scroll">${listItems}</div></div>`;
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
    if(existingBtn) existingBtn.remove();

    if (isAdmin) {
        const btn = document.createElement('button');
        btn.id = 'switch-view-btn';
        btn.className = "bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded text-sm font-bold hover:bg-indigo-200 transition";
        btn.innerHTML = (currentView === 'admin') ? `Switch to My Duties` : `Back to Admin`;
        btn.onclick = (currentView === 'admin') ? switchToStaffView : initAdminDashboard;
        container.insertBefore(btn, document.getElementById('logout-btn'));
    }
}

function switchToStaffView() {
    const me = staffData.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase());
    if (me) initStaffDashboard(me);
    else {
        if(confirm("No staff profile found. Create one?")) {
            openModal('add-staff-modal');
            document.getElementById('stf-email').value = currentUser.email;
            document.getElementById('stf-email').disabled = true;
        }
    }
}

async function syncSlotsToCloud() {
    const ref = doc(db, "colleges", currentCollegeId);
    await updateDoc(ref, { examInvigilationSlots: JSON.stringify(invigilationSlots) });
}

async function syncStaffToCloud() {
    const ref = doc(db, "colleges", currentCollegeId);
    await updateDoc(ref, { examStaffData: JSON.stringify(staffData) });
}

// --- NEW: ADD STAFF ACCESS (SEPARATE FIELD) ---
async function addStaffAccess(email) {
    try {
        const ref = doc(db, "colleges", currentCollegeId);
        // Add to 'staffAccessList' instead of 'allowedUsers'
        await updateDoc(ref, { staffAccessList: arrayUnion(email) });
    } catch(e) { console.error(e); }
}

async function removeStaffAccess(email) {
    try {
        const ref = doc(db, "colleges", currentCollegeId);
        await updateDoc(ref, { staffAccessList: arrayRemove(email) });
    } catch(e) { console.error(e); }
}
// --- NEW: MANUAL SLOT ADDITION ---

// --- NEW: MANUAL SLOT ADDITION (Time Based) ---

function openAddSlotModal() {
    document.getElementById('manual-slot-date').valueAsDate = new Date();
    // Set default time to 09:30
    const timeInput = document.getElementById('manual-slot-time');
    if(timeInput) timeInput.value = "09:30"; 
    
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
// --- NEW: Toggle Advance Unavailability ---
window.toggleAdvance = async function(dateStr, email, session) {
    // 1. Init date object if missing
    if (!advanceUnavailability[dateStr]) advanceUnavailability[dateStr] = { FN: [], AN: [] };
    if (!advanceUnavailability[dateStr][session]) advanceUnavailability[dateStr][session] = [];

    const list = advanceUnavailability[dateStr][session];
    const existingEntry = list.find(u => u.email === email);

    if (existingEntry) {
        // REMOVE (Simple Confirm)
        if(confirm(`Remove 'Unavailable' status for ${session}?`)) {
            advanceUnavailability[dateStr][session] = list.filter(u => u.email !== email);
            
            // LOGGING
            logActivity("Advance Unavailability Removed", `Removed ${getNameFromEmail(email)} from ${dateStr} (${session}) unavailability list.`);
            
            await saveAdvanceUnavailability();
            renderStaffCalendar(email); 
            openDayModal(dateStr, email); 
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
    const ref = doc(db, "colleges", currentCollegeId);
    await updateDoc(ref, { invigAdvanceUnavailability: JSON.stringify(advanceUnavailability) });
}
window.toggleWholeDay = async function(dateStr, email) {
    if (!advanceUnavailability[dateStr]) advanceUnavailability[dateStr] = { FN: [], AN: [] };
    
    // Check if ALREADY marked for both
    const fnList = advanceUnavailability[dateStr].FN || [];
    const anList = advanceUnavailability[dateStr].AN || [];
    const isFullDay = fnList.some(u => u.email === email) && anList.some(u => u.email === email);

    if (isFullDay) {
        // CLEAR BOTH
        if(confirm("Clear unavailability for the WHOLE DAY?")) {
            advanceUnavailability[dateStr].FN = fnList.filter(u => u.email !== email);
            advanceUnavailability[dateStr].AN = anList.filter(u => u.email !== email);
            await saveAdvanceUnavailability();
            renderStaffCalendar(email);
            openDayModal(dateStr, email);
        }
    } else {
        // MARK BOTH (Open Modal with Special Key)
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
window.toggleLock = async function(key) {
    invigilationSlots[key].isLocked = !invigilationSlots[key].isLocked;
    await syncSlotsToCloud();
}

// --- NEW: Lock All Function ---
window.lockAllSessions = async function() {
    if (!confirm("🔒 Are you sure you want to LOCK ALL sessions?\n\nInvigilators will not be able to volunteer for any session.")) return;
    
    let changed = false;
    Object.keys(invigilationSlots).forEach(key => {
        if (!invigilationSlots[key].isLocked) {
            invigilationSlots[key].isLocked = true;
            changed = true;
        }
    });

    if (changed) {
        await syncSlotsToCloud();
        renderSlotsGridAdmin();
        alert("✅ All sessions have been locked.");
    } else {
        alert("All sessions are already locked.");
    }
}

window.volunteer = async function(key, email) {
    const [datePart] = key.split(' | ');
    const sameDaySessions = Object.keys(invigilationSlots).filter(k => k.startsWith(datePart) && k !== key);
    const conflict = sameDaySessions.some(k => invigilationSlots[k].assigned.includes(email));
    
    if (conflict && !confirm("Whoa! You're already on duty today. Double shift? 🦸‍♂️")) return;
    
    // REMOVED OLD EXCHANGE LOGIC FROM HERE

    if (!confirm("Confirm duty?")) return;
    
    const slot = invigilationSlots[key];
    slot.assigned.push(email);
    
    const me = staffData.find(s => s.email === email);
    if(me) me.dutiesAssigned = (me.dutiesAssigned || 0) + 1;
    
    await syncSlotsToCloud();
    await syncStaffToCloud();
    window.closeModal('day-detail-modal');
    renderStaffCalendar(email); // Refresh
}

window.changeSlotReq = async function(key, delta) {
    const slot = invigilationSlots[key];
    const newReq = slot.required + delta;
    if (newReq < slot.assigned.length) return alert("Cannot reduce slots below assigned count.");
    if (newReq < 1) return;
    slot.required = newReq;
    await syncSlotsToCloud();
    renderSlotsGridAdmin();
}


window.cancelDuty = async function(key, email, isLocked) {
    if (isLocked) return alert("🚫 Slot Locked! Contact Admin.");
    if (confirm("Cancel duty?")) {
        invigilationSlots[key].assigned = invigilationSlots[key].assigned.filter(e => e !== email);
        const me = staffData.find(s => s.email === email);
        if(me && me.dutiesAssigned > 0) me.dutiesAssigned--;
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
window.setAvailability = async function(key, email, isAvailable) {
    if (isAvailable) {
        if(confirm("Mark available?")) {
            invigilationSlots[key].unavailable = invigilationSlots[key].unavailable.filter(u => (typeof u === 'string' ? u !== email : u.email !== email));
            await syncSlotsToCloud();
            window.closeModal('day-detail-modal');
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
window.confirmUnavailable = async function() {
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
            
            // LOGGING
            logActivity("Advance Unavailability", `Marked ${getNameFromEmail(email)} unavailable for WHOLE DAY on ${dateStr}. Reason: ${reason}`);
        } else {
            // Single Session
            if (!advanceUnavailability[dateStr][session]) advanceUnavailability[dateStr][session] = [];
            advanceUnavailability[dateStr][session] = advanceUnavailability[dateStr][session].filter(u => u.email !== email);
            advanceUnavailability[dateStr][session].push(entry);

            // LOGGING
            logActivity("Advance Unavailability", `Marked ${getNameFromEmail(email)} unavailable for ${dateStr} (${session}). Reason: ${reason}`);
        }
        
        await saveAdvanceUnavailability();
        
        window.closeModal('unavailable-modal');
        openDayModal(dateStr, email);
        renderStaffCalendar(email);

    } else {
        // --- CASE B: SLOT SPECIFIC ---
        if (!invigilationSlots[key].unavailable) invigilationSlots[key].unavailable = [];
        invigilationSlots[key].unavailable.push(entry);
        
        // LOGGING
        logActivity("Session Unavailability", `Marked ${getNameFromEmail(email)} unavailable for ${key}. Reason: ${reason}`);
        
        await syncSlotsToCloud();
        window.closeModal('unavailable-modal');
        
        try { const [datePart] = key.split(' | '); openDayModal(datePart, email); } catch(e) {}
        renderStaffCalendar(email);
    }
}

window.waNotify = function(key) {
    const slot = invigilationSlots[key];
    if(slot.assigned.length === 0) return alert("No staff assigned.");
    const phones = slot.assigned.map(email => {
        const s = staffData.find(st => st.email === email);
        return s ? s.phone : "";
    }).filter(p => p);
    if(phones.length === 0) return alert("No phones found.");
    const msg = encodeURIComponent(`Exam Duty: ${key}.`);
    window.open(`https://wa.me/${phones[0]}?text=${msg}`, '_blank');
}

window.calculateSlotsFromSchedule = async function() {
    const btn = document.querySelector('button[onclick="calculateSlotsFromSchedule()"]');
    if(btn) { btn.disabled = true; btn.innerText = "Checking Cloud..."; }

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

        if(students.length === 0) throw new Error("No exam data found.");

        // 2. Process Sessions
        const sessions = {};
        students.forEach(s => {
            const key = `${s.Date} | ${s.Time}`;
            if(!sessions[key]) {
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

        Object.keys(sessions).forEach(key => {
            const data = sessions[key];
            const [datePart, timePart] = key.split(' | ');

            // --- A. SLOT CALCULATION (Keep 1:5 for Digital System) ---
            let calculatedReq = 0;
            Object.values(data.streams).forEach(count => {
                calculatedReq += Math.ceil(count / 30);
            });
            if (data.scribeCount > 0) {
                calculatedReq += Math.ceil(data.scribeCount / 5); 
            }
            const reserve = Math.ceil(calculatedReq * 0.10);
            const finalReq = calculatedReq + reserve;

            // --- B. Fetch Exam Name ---
            let officialExamName = "";
            if (typeof window.getExamName === "function") {
                officialExamName = window.getExamName(datePart, timePart, "Regular");
                if (!officialExamName) officialExamName = window.getExamName(datePart, timePart, "All Streams");
            }

            // --- C. Update Slot ---
            if (!newSlots[key]) {
                newSlots[key] = { 
                    required: finalReq, 
                    assigned: [], 
                    unavailable: [], 
                    isLocked: true,
                    examName: officialExamName,
                    scribeCount: data.scribeCount,   // <--- STORED FOR REPORT
                    studentCount: data.totalStudents // <--- STORED FOR REPORT
                };
                changesLog.push(`🆕 ${key}: Added (Req: ${finalReq})`);
                hasChanges = true;
            } else {
                // Update Metadata
                if (newSlots[key].scribeCount !== data.scribeCount || newSlots[key].studentCount !== data.totalStudents) {
                    newSlots[key].scribeCount = data.scribeCount;
                    newSlots[key].studentCount = data.totalStudents;
                    hasChanges = true; // Silent update
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

        if (!hasChanges) {
            alert("✅ Data checked. Metadata updated.");
        } else {
            let msg = "⚠️ UPDATES FOUND ⚠️\n\n" + changesLog.join('\n');
            if (removalLog.length > 0) msg += `\n\n🚨 REDUCTION: ${removalLog.length} staff removed.`;
            if (confirm(msg + "\n\nProceed?")) {
                invigilationSlots = newSlots;
                await syncSlotsToCloud();
                renderSlotsGridAdmin();
                if (removalLog.length > 0) showRemovalNotification(removalLog);
                else alert("Updated successfully!");
            }
        }

    } catch (e) {
        console.error(e);
        alert("Error: " + e.message);
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "Sync Cloud / Generate Slots"; }
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
    // Re-use the Inconvenience Modal for this report
    const list = document.getElementById('inconvenience-list');
    const modalTitle = document.getElementById('inconvenience-modal-subtitle');
    
    if(list && modalTitle) {
        document.querySelector('#inconvenience-modal h3').textContent = "⚠️ Auto-Removal Notification";
        modalTitle.textContent = "The following staff were removed due to slot reduction. Please notify them.";
        
        list.innerHTML = '';
        log.forEach(item => {
            const msg = encodeURIComponent(`Exam Duty Update: Your invigilation duty for ${item.session} has been CANCELLED due to a reduction in required slots.`);
            const waLink = item.phone ? `https://wa.me/${item.phone}?text=${msg}` : "#";
            
            list.innerHTML += `
                <div class="bg-orange-50 border border-orange-200 p-3 rounded-lg flex justify-between items-center">
                    <div>
                        <div class="font-bold text-gray-800 text-sm">${item.name}</div>
                        <div class="text-xs text-gray-500">${item.session}</div>
                    </div>
                    ${item.phone ? 
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

window.runAutoAllocation = async function() {
    if(!confirm("Auto-Assign?")) return;
    let eligibleStaff = [...staffData].map(s => ({ ...s, pending: calculateStaffTarget(s) - (s.dutiesDone || 0) })).sort((a, b) => b.pending - a.pending);
    let assignedCount = 0;
    for (const sessionKey in invigilationSlots) {
        const slot = invigilationSlots[sessionKey];
        if(slot.isLocked) continue;
        const needed = slot.required - slot.assigned.length;
        if (needed <= 0) continue;
        const [dateStr] = sessionKey.split(' | ');
        const parts = dateStr.split('.');
        const examDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        const dayOfWeek = examDate.getDay(); 
        for (let i = 0; i < needed; i++) {
            const candidate = eligibleStaff.find(s => {
                if (slot.assigned.includes(s.email)) return false;
                if (isUserUnavailable(slot, s.email, sessionKey)) return false;
                if (s.designation === "Guest Lecturer" && s.preferredDays && !s.preferredDays.includes(dayOfWeek)) return false;
                return true;
            });
            if (candidate) {
                slot.assigned.push(candidate.email);
                candidate.pending--; 
                eligibleStaff.sort((a, b) => b.pending - a.pending);
                assignedCount++;
            }
        }
    }
    await syncSlotsToCloud();
}

window.saveNewStaff = async function() {
    const indexStr = document.getElementById('stf-edit-index').value;
    const isEditMode = (indexStr !== "");
    const index = isEditMode ? parseInt(indexStr) : -1;

    const name = document.getElementById('stf-name').value.trim();
    const email = document.getElementById('stf-email').value.trim();
    const phone = document.getElementById('stf-phone').value.trim();
    const dept = document.getElementById('stf-dept').value;
    const designation = document.getElementById('stf-designation').value;
    const date = document.getElementById('stf-join').value;

    if (!name || !email) return alert("Name and Email are required.");

    if (isEditMode) {
        // --- UPDATE EXISTING STAFF ---
        const oldData = staffData[index];
        const oldEmail = oldData.email;

        if (oldEmail !== email) {
            // Email Changed: Check for duplicates
            if (staffData.some(s => s.email === email && s !== oldData)) {
                return alert("This email is already used by another staff member.");
            }
            
            if (!confirm(`Change email from ${oldEmail} to ${email}?\n\nThis will update their system access.`)) return;

            // Swap Permissions in Cloud
            await removeStaffAccess(oldEmail);
            await addStaffAccess(email);
        }

        // Update Array
        staffData[index] = {
            ...oldData,
            name, email, phone, dept, designation, joiningDate: date
        };

        alert("Staff profile updated successfully.");

    } else {
        // --- ADD NEW STAFF ---
        if (staffData.some(s => s.email === email)) {
            return alert("Staff with this email already exists.");
        }

        const newObj = { 
            name, email, phone, dept, designation, joiningDate: date, 
            dutiesDone: 0, roleHistory: [], preferredDays: [] 
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

window.deleteStaff = async function(index) {
    const staff = staffData[index];
    if(!staff) return;

    if(confirm(`Archive ${staff.name}?\n\nThey will be hidden from new duty assignments, but their past attendance records will remain for reports.`)) {
        // Soft Delete
        staffData[index].status = 'archived';
        await syncStaffToCloud();
        await removeStaffAccess(staff.email); // Optional: Block login
        renderStaffTable();
        alert("Staff archived successfully.");
    }
}
window.openRoleAssignmentModal = function(index) {
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

window.saveRoleAssignment = async function() {
    const idx = document.getElementById('role-assign-index').value;
    const role = document.getElementById('assign-role-select').value;
    const start = document.getElementById('assign-start-date').value;
    const end = document.getElementById('assign-end-date').value;
    if(!start) return alert("Dates required");
    if(!staffData[idx].roleHistory) staffData[idx].roleHistory = [];
    staffData[idx].roleHistory.push({ role, start, end });
    await syncStaffToCloud();
    window.closeModal('role-assignment-modal');
    renderStaffTable();
}

window.removeRoleFromStaff = async function(sIdx, rIdx) {
    staffData[sIdx].roleHistory.splice(rIdx, 1);
    await syncStaffToCloud();
    window.closeModal('role-assignment-modal');
    renderStaffTable();
}

window.openManualAllocationModal = function(key) {
    const slot = invigilationSlots[key];
    if (!slot.isLocked) {
        alert("⚠️ Please LOCK this slot first.\n\nManual allocation is only allowed in Locked mode to prevent conflicts.");
        return;
    }

    document.getElementById('manual-session-key').value = key;
    document.getElementById('manual-modal-title').textContent = key;
    document.getElementById('manual-modal-req').textContent = slot.required || 0;
    
    // 1. Sort Staff
    const rankedStaff = staffData.map(s => {
        const done = getDutiesDoneCount(s.email);
        const target = calculateStaffTarget(s);
        return {
            ...s,
            pending: target - done
        };
    }).sort((a, b) => b.pending - a.pending);

    // 2. Render Available List
    const availList = document.getElementById('manual-available-list');
    availList.innerHTML = '';
    let selectedCount = 0;

    rankedStaff.forEach(s => {
        const isAssigned = slot.assigned.includes(s.email);
        if (isUserUnavailable(slot, s.email, key)) return; 
        
        if (isAssigned) selectedCount++;
        const checkState = isAssigned ? 'checked' : '';
        const rowClass = isAssigned ? 'bg-indigo-50' : 'hover:bg-gray-50';
        
        // FIX: Display 0 if negative
        const displayPending = Math.max(0, s.pending);
        const pendingColor = displayPending > 0 ? 'text-red-600' : 'text-green-600';

        availList.innerHTML += `
            <tr class="${rowClass} border-b last:border-0 transition">
                <td class="px-3 py-2 text-center w-10">
                    <input type="checkbox" class="manual-chk w-4 h-4 text-indigo-600" value="${s.email}" ${checkState} onchange="window.updateManualCounts()">
                </td>
                <td class="px-3 py-2">
                    <div class="font-bold text-gray-800">${s.name}</div>
                    <div class="text-[10px] text-gray-500">${s.dept} | ${s.designation}</div>
                </td>
                <td class="px-3 py-2 text-center font-mono font-bold ${pendingColor} w-16">
                    ${displayPending}
                </td>
            </tr>`;
    });

    if (rankedStaff.length === 0) {
        availList.innerHTML = `<tr><td colspan="3" class="text-center p-4 text-gray-500 italic">No staff available. Add staff in Settings.</td></tr>`;
    }

    // 3. Render Unavailable List (Same as before)
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
            const reason = (typeof u === 'object' && u.reason) ? u.reason : "N/A";
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

    document.getElementById('manual-sel-count').textContent = selectedCount;
    document.getElementById('manual-req-count').textContent = slot.required || 0;
    
    window.openModal('manual-allocation-modal');
}

window.saveManualAllocation = async function() {
    const key = document.getElementById('manual-session-key').value;
    const selectedEmails = Array.from(document.querySelectorAll('.manual-chk:checked')).map(c => c.value);
    if (invigilationSlots[key]) {
        // LOGGING
        const addedCount = selectedEmails.length;
        logActivity("Manual Assignment", `Assigned ${addedCount} staff to session ${key}`);
        
        invigilationSlots[key].assigned = selectedEmails;
        await syncSlotsToCloud();
        window.closeModal('manual-allocation-modal');
    }
}
window.updateManualCounts = function() {
    const count = document.querySelectorAll('.manual-chk:checked').length;
    document.getElementById('manual-sel-count').textContent = count;
}

window.openInconvenienceModal = function(key) {
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
        list.innerHTML += `<div class="bg-red-50 border border-red-100 p-3 rounded-lg"><div class="flex justify-between items-start mb-1"><div><div class="font-bold text-gray-800 text-sm">${s.name}</div><div class="text-[10px] text-gray-500 uppercase font-bold">${s.dept}</div></div><span class="bg-white text-red-600 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200 shadow-sm">${reason}</span></div><div class="text-xs text-gray-700 bg-white p-2 rounded border border-gray-100 italic mb-2">"${details}"</div><div class="text-right">${s.phone ? `<a href="https://wa.me/${s.phone}" target="_blank" class="text-green-600 hover:text-green-800 text-xs font-bold flex items-center justify-end gap-1">WhatsApp</a>` : ''}</div></div>`;
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
        label: `${startYear}-${startYear+1}`, 
        start: new Date(startYear, 5, 1), // June 1st
        end: new Date(startYear+1, 4, 31) // May 31st
    };
}
// --- ROLE EDITOR FUNCTIONS ---
window.openRoleConfigModal = function() {
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
    if(urlInput) { urlInput.value = googleScriptUrl; urlInput.disabled = true; }

    const targetInput = document.getElementById('global-duty-target');
    if(targetInput) { 
        targetInput.value = globalDutyTarget; 
        targetInput.disabled = true; // <--- NEW
    }

    // 4. Render Lists
    renderRolesList();
    if(typeof renderDepartmentsList === "function") renderDepartmentsList();

    window.openModal('role-config-modal');
}

function renderRolesList() {
    const container = document.getElementById('roles-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    const sortedRoles = Object.entries(rolesConfig).sort((a,b) => a[0].localeCompare(b[0]));

    if (sortedRoles.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-xs text-center py-2">No custom roles defined.</p>';
        return;
    }

    sortedRoles.forEach(([role, target]) => {
        // If Locked: Hide Edit/Delete buttons
        const actionButtons = isRoleLocked ? '' : `
            <div class="flex items-center gap-2">
                <button onclick="editRoleConfig('${role}', ${target})" class="text-indigo-600 hover:text-indigo-900 text-[10px] font-bold bg-indigo-50 px-2 py-0.5 rounded">✎</button>
                <button onclick="deleteRoleConfig('${role}')" class="text-red-500 hover:text-red-700 font-bold px-1.5">&times;</button>
            </div>`;

        container.innerHTML += `
            <div class="flex justify-between items-center text-xs bg-white p-2 rounded border mb-1 border-gray-100">
                <span class="font-bold text-gray-700">${role}</span>
                <div class="flex items-center gap-3">
                    <span class="bg-gray-50 text-gray-600 px-2 py-0.5 rounded font-mono font-bold text-[10px]">${target}/mo</span>
                    ${actionButtons}
                </div>
            </div>`;
    });
}
 
window.addNewRoleConfig = function() {
    const name = document.getElementById('new-role-name').value.trim();
    const target = parseInt(document.getElementById('new-role-target').value);
    
    if(!name) return alert("Enter a Role Name");
    if(isNaN(target)) return alert("Enter a Target Number");
    
    rolesConfig[name] = target;
    renderRolesList();
    
    document.getElementById('new-role-name').value = '';
    document.getElementById('new-role-target').value = '';
}

window.editRoleConfig = function(role, currentTarget) {
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

window.deleteRoleConfig = function(role) {
    if(confirm(`Delete role "${role}"? This will affect calculations for staff assigned this role.`)) {
        delete rolesConfig[role];
        renderRolesList();
    }
}

window.saveRoleConfig = async function() {
    const newGlobal = parseInt(document.getElementById('global-duty-target').value);
    if(isNaN(newGlobal)) return alert("Invalid Global Target");
    
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
window.openDutyNormsModal = function() {
    // 1. Set Global Target
    const globalTargetEl = document.getElementById('ref-global-target');
    if(globalTargetEl) globalTargetEl.textContent = globalDutyTarget; // e.g. "2"

    // 2. List Special Roles (Warden, VP, etc.)
    const container = document.getElementById('ref-roles-list');
    if(!container) return;
    
    container.innerHTML = '';

    if (Object.keys(rolesConfig).length === 0) {
        container.innerHTML = '<p class="text-gray-400 italic text-xs text-center py-2">No special roles defined.</p>';
    } else {
        // Sort alphabetically
        const sortedRoles = Object.entries(rolesConfig).sort((a,b) => a[0].localeCompare(b[0]));
        
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
    if(!ui.attSessionSelect) return;
    
    // Sort Sessions (Newest First)
    const sortedKeys = Object.keys(invigilationSlots).sort((a, b) => {
        // Simple string sort is usually enough if format is consistent, 
        // but for robustness we rely on your existing compare logic or just simple sort for now.
        return b.localeCompare(a); 
    });

    ui.attSessionSelect.innerHTML = '<option value="">-- Select Session --</option>';
    sortedKeys.forEach(key => {
        const slot = invigilationSlots[key];
        // Add checkmark if attendance was already saved
        const mark = slot.attendance ? "✅ " : "";
        
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `${mark}${key}`;
        ui.attSessionSelect.appendChild(opt);
    });
}
window.loadSessionAttendance = function() {
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
    
    // --- RESET SEARCH ---
    const searchInput = document.getElementById('att-substitute-search');
    const searchResults = document.getElementById('att-substitute-results');
    if (searchInput) {
        searchInput.value = "";
        searchInput.disabled = isLocked;
        if(isLocked) searchInput.classList.add('bg-gray-100', 'cursor-not-allowed');
        else searchInput.classList.remove('bg-gray-100', 'cursor-not-allowed');
    }
    if (searchResults) searchResults.classList.add('hidden');
    currentSubstituteCandidate = null;
    // --------------------

    // --- 1. SUPERVISION LOGIC ---
    const today = new Date();
    let defaultCS = "";
    let defaultSAS = "";
    
    staffData.forEach(s => {
        if (s.roleHistory) {
            const activeRole = s.roleHistory.find(r => 
                new Date(r.start) <= today && new Date(r.end) >= today && 
                (r.role === "Chief Superintendent" || r.role === "Exam Chief" || r.role === "Senior Asst. Superintendent")
            );
            if (activeRole) {
                if (activeRole.role === "Chief Superintendent" || activeRole.role === "Exam Chief") defaultCS = s.email;
                if (activeRole.role === "Senior Asst. Superintendent") defaultSAS = s.email;
            }
        }
    });

    const savedSup = slot.supervision || {};
    const currentCS = savedSup.cs || defaultCS;
    const currentSAS = savedSup.sas || defaultSAS;

    const csSelect = document.getElementById('att-cs-select');
    const sasSelect = document.getElementById('att-sas-select');
    
    const populateSup = (select, selectedVal) => {
        select.innerHTML = '<option value="">-- Select --</option>';
        staffData.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.email;
            opt.textContent = s.name;
            if (s.email === selectedVal) opt.selected = true;
            select.appendChild(opt);
        });
        select.disabled = isLocked;
    };

    if (csSelect) populateSup(csSelect, currentCS);
    if (sasSelect) populateSup(sasSelect, currentSAS);

    // --- 2. ATTENDANCE LIST ---
    let presentSet = new Set(slot.attendance || slot.assigned || []);
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
        if(addBtn) { addBtn.disabled = true; addBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
        
        if(saveBtn) {
            saveBtn.disabled = true;
            saveBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
            saveBtn.innerHTML = `<span>✅ Saved & Locked</span>`;
        }

        if(lockBtn) {
            lockBtn.innerHTML = `<span>🔓</span> Unlock Register`;
            lockBtn.className = "bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded shadow-sm hover:bg-red-100 font-bold text-sm flex items-center gap-2 transition";
            lockBtn.onclick = () => window.toggleAttendanceLock(key, false);
        }
        if(statusText) statusText.textContent = "Attendance is finalized and locked.";

    } else {
        if(addBtn) { addBtn.disabled = false; addBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }

        if(saveBtn) {
            saveBtn.disabled = false;
            saveBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
            saveBtn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Confirm & Update Counts`;
        }

        if(lockBtn) {
            lockBtn.innerHTML = `<span>🔒</span> Lock Register`;
            lockBtn.className = "bg-gray-100 text-gray-600 border border-gray-300 px-4 py-2 rounded shadow-sm hover:bg-gray-200 font-bold text-sm flex items-center gap-2 transition";
            lockBtn.onclick = () => window.toggleAttendanceLock(key, true);
        }
        if(statusText) statusText.textContent = "Editing allowed.";
    }
    
    updateAttCount();
}


function addAttendanceRow(email, isLocked) {
    const s = staffData.find(st => st.email === email);
    if(!s) return;
    
    const div = document.createElement('div');
    div.className = `flex justify-between items-center bg-white p-2 rounded border ${isLocked ? 'border-green-100 bg-green-50' : 'border-gray-200'}`;
    
    // Disable inputs if locked
    const chkState = isLocked ? "disabled" : "onchange='window.updateAttCount()'";
    const removeBtn = isLocked ? "" : `<button class="text-red-400 hover:text-red-600 text-xs font-bold px-2" onclick="this.parentElement.remove(); window.updateAttCount();">&times; Remove</button>`;

    div.innerHTML = `
        <div class="flex items-center gap-3">
            <input type="checkbox" class="att-chk w-5 h-5 text-green-600 rounded focus:ring-green-500" value="${email}" checked ${chkState}>
            <div>
                <div class="font-bold text-gray-800 text-sm">${s.name}</div>
                <div class="text-xs text-gray-500">${s.dept}</div>
            </div>
        </div>
        ${removeBtn}
    `;
    ui.attList.appendChild(div);
}

window.addSubstituteToAttendance = function() {
    // Check if a user was selected from search
    if (!currentSubstituteCandidate) {
        return alert("Please search and select a faculty member first.");
    }
    
    const email = currentSubstituteCandidate.email;
    
    // Check duplicates
    const existing = Array.from(document.querySelectorAll('.att-chk')).map(c => c.value);
    if(existing.includes(email)) {
        return alert("This person is already in the attendance list.");
    }
    
    addAttendanceRow(email);
    
    // Reset Search
    const searchInput = document.getElementById('att-substitute-search');
    if(searchInput) searchInput.value = "";
    currentSubstituteCandidate = null;
    
    updateAttCount();
}

window.updateAttCount = function() {
    const count = document.querySelectorAll('.att-chk:checked').length;
    document.getElementById('att-count-display').textContent = `${count} Present`;
}
window.saveAttendance = async function() {
    const key = ui.attSessionSelect.value;
    if (!key) return;
    
    const csVal = document.getElementById('att-cs-select').value;
    const sasVal = document.getElementById('att-sas-select').value;

    if (!csVal || !sasVal) {
        alert("⚠️ Mandatory Fields Missing\n\nPlease select both a Chief Superintendent (CS) and a Senior Assistant Superintendent (SAS) before saving attendance.");
        return;
    }
    
    if(!confirm(`Confirm attendance for ${key}?\n\nThis will update the 'Duties Done' count for all checked staff.`)) return;
    
    const presentEmails = Array.from(document.querySelectorAll('.att-chk:checked')).map(c => c.value);
    
    // Update Cloud Data
    invigilationSlots[key].attendance = presentEmails;
    invigilationSlots[key].supervision = { cs: csVal, sas: sasVal }; 
    
    // LOGGING
    logActivity("Attendance Marked", `Marked ${presentEmails.length} staff present for ${key}. CS: ${getNameFromEmail(csVal)}, SAS: ${getNameFromEmail(sasVal)}`);
    
    await syncSlotsToCloud();
    
    // Refresh UI
    populateAttendanceSessions(); 
    renderStaffTable(); 
    alert("Attendance & Supervision Saved!");
}

window.toggleAttendanceLock = async function(key, lockState) {
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
    if (conflict && !confirm("Whoa! You're already on duty today. Double shift? 🦸‍♂️")) return;

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
            if(ownerObj && ownerObj.dutiesAssigned > 0) ownerObj.dutiesAssigned--;

            // Add New (You)
            slot.assigned.push(email);
            const me = staffData.find(s => s.email === email);
            if(me) me.dutiesAssigned = (me.dutiesAssigned || 0) + 1;

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
    if(me) me.dutiesAssigned = (me.dutiesAssigned || 0) + 1;
    
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

    // 5. Sync
    await syncSlotsToCloud();
    await syncStaffToCloud();

    alert(`Success! You have accepted the duty from ${sellerName}.`);
    
    window.closeModal('day-detail-modal');
    renderStaffCalendar(buyerEmail);
    renderExchangeMarket(buyerEmail);
    initStaffDashboard(buyer); 
}
window.postForExchange = async function(key, email) {
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
            if(typeof renderExchangeMarket === "function") renderExchangeMarket(email);
            window.closeModal('day-detail-modal');
        } catch(e) { console.error("UI Update Error:", e); }

        // 5. Save to Cloud
        await syncSlotsToCloud();
    }
}

window.withdrawExchange = async function(key, email) {
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
            if(typeof renderExchangeMarket === "function") renderExchangeMarket(email);
            window.closeModal('day-detail-modal');
        } catch(e) { console.error("UI Update Error:", e); }

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

window.addNewDepartment = function() {
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

window.deleteDepartment = function(name) {
    if (confirm(`Delete department "${name}"?`)) {
        departmentsConfig = departmentsConfig.map(d => (typeof d === 'string') ? { name: d, email: "" } : d);
        departmentsConfig = departmentsConfig.filter(d => d.name !== name);
        renderDepartmentsList();
    }
}
window.toggleRoleLock = function() {
    isRoleLocked = !isRoleLocked;
    renderRolesList(); // Re-render list
    toggleInputVisibility('role-input-row', isRoleLocked); // Hide/Show Inputs
    updateLockIcon('role-lock-btn', isRoleLocked); // Update Icon
}

window.toggleDeptLock = function() {
    isDeptLocked = !isDeptLocked;
    renderDepartmentsList();
    toggleInputVisibility('dept-input-row', isDeptLocked);
    updateLockIcon('dept-lock-btn', isDeptLocked);
}

function toggleInputVisibility(id, isLocked) {
    const el = document.getElementById(id);
    if(el) isLocked ? el.classList.add('hidden') : el.classList.remove('hidden');
}

function updateLockIcon(btnId, isLocked) {
    const btn = document.getElementById(btnId);
    if(btn) btn.textContent = isLocked ? "🔒 Locked" : "🔓 Editing";
    if(btn) btn.className = isLocked 
        ? "text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-200 transition"
        : "text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200 hover:bg-red-100 transition font-bold";
}
window.toggleWeekLock = async function(monthStr, weekNum, lockState) {
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
window.printSessionReport = function(key) {
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
                        <th style="width: 80px;">Signature</th>
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

    // --- PART 1: TODAY'S EXAMS (Print & Bulk SMS) ---
    if (todaySessions.length > 0) {
        todaySessions.sort();
        let buttonsHtml = '';
        todaySessions.forEach(key => {
            const timePart = key.split(' | ')[1];
            buttonsHtml += `
                <div class="flex items-center gap-2 bg-white/10 p-2 rounded-lg border border-white/20">
                    <span class="text-white text-sm font-bold mr-1">${timePart}</span>
                    
                    <button onclick="printSessionReport('${key}')" class="bg-white text-indigo-700 hover:bg-indigo-50 font-bold py-1.5 px-3 rounded shadow-sm text-xs flex items-center gap-1 transition" title="Print Invigilator List">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Print List
                    </button>
                    
                    <button onclick="sendSessionSMS('${key}')" class="bg-green-500 text-white hover:bg-green-600 font-bold py-1.5 px-3 rounded shadow-sm text-xs flex items-center gap-1 transition" title="Send Bulk SMS to All Staff in this Session">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        Bulk SMS
                    </button>
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
                    <div class="flex flex-wrap gap-2 justify-center md:justify-end">
                        ${buttonsHtml}
                    </div>
                </div>
            </div>
        `;
    }

    // --- PART 2: TOMORROW'S EXAMS (Notifications) ---
    if (tomorrowSessions.length > 0) {
        tomorrowSessions.sort();
        let buttonsHtml = '';
        tomorrowSessions.forEach(key => {
            const timePart = key.split(' | ')[1];
            buttonsHtml += `
                <div class="flex items-center gap-2 bg-white/10 p-2 rounded-lg border border-white/20">
                    <span class="text-white text-sm font-bold mr-1">${timePart}</span>
                    
                    <button onclick="openSlotReminderModal('${key}')" class="bg-white text-orange-700 hover:bg-orange-50 font-bold py-1.5 px-3 rounded shadow-sm text-xs flex items-center gap-1 transition" title="Send Alerts (Email, WhatsApp, SMS)">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        Notify / Remind
                    </button>
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
                            <h2 class="text-lg font-bold leading-tight">Exams Tomorrow (${tomorrowStr})</h2>
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
window.openCompletedDutiesModal = function(email) {
    const list = document.getElementById('completed-duties-list');
    if (!list) return;
    
    list.innerHTML = '';
    const history = [];
    
    // 1. Scan for completed duties
    Object.keys(invigilationSlots).forEach(key => {
        const slot = invigilationSlots[key];
        if (slot.attendance && slot.attendance.includes(email)) {
            // Determine Role (Invigilator vs CS/SAS)
            let role = "Invigilator";
            if (slot.supervision) {
                if (slot.supervision.cs === email) role = "Chief Supt.";
                else if (slot.supervision.sas === email) role = "Senior Asst.";
            }
            history.push({ key, role });
        }
    });

    // 2. Sort (Newest First)
    history.sort((a, b) => {
        // Reuse existing parseDate helper
        const dateA = parseDate(a.key);
        const dateB = parseDate(b.key);
        return dateB - dateA;
    });

    // 3. Render
    if (history.length === 0) {
        list.innerHTML = `<div class="text-center text-gray-400 text-xs py-8 italic bg-gray-50 rounded border border-gray-100">No completed duties found yet.</div>`;
    } else {
        history.forEach(item => {
            const [date, time] = item.key.split(' | ');
            // Color coding for roles
            const isSup = item.role !== "Invigilator";
            const bgClass = isSup ? "bg-purple-50 border-purple-100" : "bg-green-50 border-green-100";
            const textClass = isSup ? "text-purple-900" : "text-green-900";
            const badgeClass = isSup ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-white text-green-600 border-green-200";

            list.innerHTML += `
                <div class="flex justify-between items-center p-3 rounded border ${bgClass} hover:shadow-sm transition">
                    <div>
                        <div class="text-sm font-bold ${textClass}">${date}</div>
                        <div class="text-[10px] text-gray-500 font-medium">${time}</div>
                    </div>
                    <span class="text-[10px] font-bold uppercase px-2 py-1 rounded border ${badgeClass}">
                        ${item.role}
                    </span>
                </div>`;
        });
    }

    window.openModal('completed-duties-modal');
}
// --- WEEKLY AUTO-ASSIGN ALGORITHM (Admin Mode Only + Dept Logic) ---
window.runWeeklyAutoAssign = async function(monthStr, weekNum) {
    // 1. CHECK: Confirm Intent
    if(!confirm(`⚡ Run Auto-Assignment for ${monthStr}, Week ${weekNum}?\n\nIMPORTANT: This will only fill LOCKED slots (Admin Mode).\n\nRules Applied:\n1. Max 3 duties/week\n2. Avoid Same Day & Adjacent Days\n3. Dept Cap: Max 60% of a dept per session (except single-person depts)\n4. "Show Must Go On" - Rules break if necessary.`)) return;

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

    // 4. Prepare Staff Stats & Department Counts
    const deptCounts = {}; // Total staff per dept
    let eligibleStaff = staffData.map(s => {
        // Count Department Totals (Exclude Archived)
        if (s.status !== 'archived') {
            deptCounts[s.dept] = (deptCounts[s.dept] || 0) + 1;
        }
        return {
            ...s,
            pending: calculateStaffTarget(s) - getDutiesDoneCount(s.email),
            assignedThisWeek: 0 // Reset counter for this run
        };
    });

    // Count duties ALREADY assigned in this week (manual ones)
    targetSlots.forEach(t => {
        t.slot.assigned.forEach(email => {
            const s = eligibleStaff.find(st => st.email === email);
            if(s) s.assignedThisWeek++;
        });
    });

    const logEntries = [];
    let assignedCount = 0;

    // 5. Process Each Slot
    for (const target of targetSlots) {
        const { key, date, slot } = target;
        const needed = slot.required - slot.assigned.length;
        
        if (needed <= 0) continue;

        // Track Department counts SPECIFIC TO THIS SLOT
        const slotDeptCounts = {};
        slot.assigned.forEach(email => {
            const s = staffData.find(st => st.email === email);
            if (s && s.dept) {
                slotDeptCounts[s.dept] = (slotDeptCounts[s.dept] || 0) + 1;
            }
        });

        // Iterate to fill needed spots
        for (let i = 0; i < needed; i++) {
            // Score Candidates
            const candidates = eligibleStaff.map(s => {
                let score = s.pending * 100; // Base Score: High Pending = High Priority
                let warnings = [];

                // --- HARD CONSTRAINTS (Must Exclude) ---
                if (slot.assigned.includes(s.email)) return null; // Already in this slot
                if (isUserUnavailable(slot, s.email, key)) return null; // Marked Unavailable

                // --- SOFT CONSTRAINTS (Penalize Score) ---
                
                // Rule 1: Max 3 per week (-5000)
                if (s.assignedThisWeek >= 3) {
                    score -= 5000; 
                    warnings.push("Over Weekly Limit (3)");
                }

                // Rule 2: Department Saturation (-4000)
                // Logic: Max 60% of dept strength, ignored if dept size <= 1
                const deptTotal = deptCounts[s.dept] || 0;
                if (deptTotal > 1) {
                    const currentDeptAssigned = slotDeptCounts[s.dept] || 0;
                    const deptLimit = Math.ceil(deptTotal * 0.60);
                    
                    if (currentDeptAssigned >= deptLimit) {
                        score -= 4000;
                        warnings.push(`Dept Saturation (>60% of ${s.dept})`);
                    }
                }

                // Rule 3: Same Day Conflict (-2000)
                const sameDayKeys = targetSlots.filter(t => 
                    t.date.toDateString() === date.toDateString() && t.key !== key
                ).map(t => t.key);
                
                if (sameDayKeys.some(sdk => invigilationSlots[sdk].assigned.includes(s.email))) {
                    score -= 2000;
                    warnings.push("Same Day Double Duty");
                }

                // Rule 4: Adjacent Day Conflict (-1000)
                const prevDate = new Date(date); prevDate.setDate(date.getDate() - 1);
                const nextDate = new Date(date); nextDate.setDate(date.getDate() + 1);
                
                let hasAdjacent = false;
                targetSlots.forEach(t => {
                    if ((t.date.toDateString() === prevDate.toDateString() || t.date.toDateString() === nextDate.toDateString()) 
                        && t.slot.assigned.includes(s.email)) {
                        hasAdjacent = true;
                    }
                });
                if (hasAdjacent) {
                    score -= 1000;
                    warnings.push("Adjacent Day Duty");
                }

                return { staff: s, score, warnings };
            }).filter(c => c !== null); 

            // Sort by Score (High to Low)
            candidates.sort((a, b) => b.score - a.score);

            if (candidates.length > 0) {
                const choice = candidates[0]; // Best candidate
                
                // Assign
                slot.assigned.push(choice.staff.email);
                choice.staff.assignedThisWeek++;
                choice.staff.pending--; 
                
                // Update Slot Dept Count immediately
                slotDeptCounts[choice.staff.dept] = (slotDeptCounts[choice.staff.dept] || 0) + 1;
                
                assignedCount++;

                // Log Warnings
                if (choice.warnings.length > 0) {
                    logEntries.push({
                        type: "WARN",
                        msg: `Assigned ${choice.staff.name} to ${key}. Breached: ${choice.warnings.join(", ")}`
                    });
                }
            } else {
                logEntries.push({
                    type: "ERROR",
                    msg: `FAILED to fill slot ${key}. No eligible staff available.`
                });
            }
        }
    }

    // 6. Save Log
    if (logEntries.length > 0) {
        const logRef = doc(db, "colleges", currentCollegeId);
        const timestamp = new Date().toLocaleString();
        const newLogs = logEntries.map(e => `[${timestamp}] ${e.type}: ${e.msg}`);
        
        try {
             await updateDoc(logRef, {
                autoAssignLogs: arrayUnion(...newLogs)
            });
        } catch(e) { console.error("Log save failed", e); }
    }

    // 7. Save & Refresh
    logActivity("Auto-Assign Run", `Admin ran auto-assign for ${monthStr} Week ${weekNum}. Filled ${assignedCount} slots.`);
    await syncSlotsToCloud();
    renderSlotsGridAdmin();
    
    let alertMsg = `✅ Auto-Assign Complete!\nFilled ${assignedCount} positions.`;
    if (logEntries.length > 0) {
        alertMsg += `\n\n⚠️ ${logEntries.length} alerts generated (Rules Broken). Check Logs.`;
    }
    alert(alertMsg);
}
window.viewAutoAssignLogs = async function() {
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

// --- ENHANCED ACTIVITY LOG VIEWER (With Search/Filter) ---
window.viewActivityLogs = async function() {
    const logRef = doc(db, "colleges", currentCollegeId, "logs", "activity_log");
    const snap = await getDoc(logRef);
    
    if (!snap.exists() || !snap.data().entries || snap.data().entries.length === 0) {
        return alert("No activity logs found.");
    }
    
    // 1. Get Data & Reverse (Newest First)
    const entries = snap.data().entries.reverse();
    
    // 2. Setup Modal Elements
    const list = document.getElementById('inconvenience-list');
    const titleEl = document.querySelector('#inconvenience-modal h3');
    const subtitleEl = document.getElementById('inconvenience-modal-subtitle');
    
    titleEl.textContent = "🕒 User Activity Log";
    
    // 3. Inject Search Bar into Subtitle Area
    subtitleEl.innerHTML = `
        <input type="text" id="activity-log-search" 
               placeholder="🔍 Search User, Action, or Details..." 
               class="w-full mt-2 p-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-indigo-500 shadow-inner">
    `;
    
    // 4. Render Function
    const renderLogs = (filterText = "") => {
        const search = filterText.toLowerCase();
        
        // Filter Logic
        const filtered = entries.filter(e => 
            (e.u && e.u.toLowerCase().includes(search)) || 
            (e.a && e.a.toLowerCase().includes(search)) || 
            (e.d && e.d.toLowerCase().includes(search))
        );
        
        if (filtered.length === 0) {
            list.innerHTML = `<div class="text-center text-gray-400 text-xs py-8 italic">No matching records found.</div>`;
            return;
        }

        list.innerHTML = filtered.map(e => {
            const dateObj = new Date(e.t);
            const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
            
            let colorClass = "border-l-4 border-gray-400";
            let bgClass = "bg-white";
            
            if (e.a.includes("Assigned")) { colorClass = "border-l-4 border-green-500"; bgClass = "bg-green-50"; }
            if (e.a.includes("Removed") || e.a.includes("Withdraw")) { colorClass = "border-l-4 border-red-500"; bgClass = "bg-red-50"; }
            if (e.a.includes("Unavailable")) { colorClass = "border-l-4 border-orange-500"; bgClass = "bg-orange-50"; }
            if (e.a.includes("Exchange")) { colorClass = "border-l-4 border-purple-500"; bgClass = "bg-purple-50"; }
            if (e.a.includes("Auto")) { colorClass = "border-l-4 border-blue-500"; bgClass = "bg-blue-50"; }

            return `
                <div class="${bgClass} p-3 rounded shadow-sm mb-2 border border-gray-200 ${colorClass} text-xs transition hover:shadow-md">
                    <div class="flex justify-between text-gray-500 mb-1 border-b border-gray-200/50 pb-1">
                        <span class="font-mono text-[10px]">${dateStr}</span>
                        <span class="font-bold text-gray-700 truncate max-w-[150px]" title="${e.u}">${e.u}</span>
                    </div>
                    <div class="font-bold text-gray-800 mt-1 text-sm">${e.a}</div>
                    <div class="text-gray-600 mt-0.5 leading-relaxed font-medium">${e.d}</div>
                </div>
            `;
        }).join('');
    };

    // 5. Attach Real-time Search Listener
    document.getElementById('activity-log-search').addEventListener('input', (e) => {
        renderLogs(e.target.value);
    });
    
    // 6. Initial Render & Open
    renderLogs();
    window.openModal('inconvenience-modal');
}

window.viewActivityLogs = async function() {
    const logRef = doc(db, "colleges", currentCollegeId, "logs", "activity_log");
    const snap = await getDoc(logRef);
    
    if (!snap.exists() || !snap.data().entries || snap.data().entries.length === 0) {
        return alert("No activity logs found.");
    }
    
    const entries = snap.data().entries.reverse(); // Show newest first
    
    const list = document.getElementById('inconvenience-list');
    const title = document.getElementById('inconvenience-modal-subtitle');
    document.querySelector('#inconvenience-modal h3').textContent = "🕒 User Activity Log";
    title.textContent = "History of user actions (Filling, Removal, Unavailability).";
    
    list.innerHTML = entries.map(e => {
        const dateObj = new Date(e.t);
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
        
        let colorClass = "border-l-4 border-gray-400";
        if (e.a.includes("Assigned")) colorClass = "border-l-4 border-green-500";
        if (e.a.includes("Removed") || e.a.includes("Withdraw")) colorClass = "border-l-4 border-red-500";
        if (e.a.includes("Unavailable")) colorClass = "border-l-4 border-orange-500";
        if (e.a.includes("Exchange")) colorClass = "border-l-4 border-purple-500";

        return `
            <div class="bg-white p-2 rounded shadow-sm mb-2 border border-gray-200 ${colorClass} text-xs">
                <div class="flex justify-between text-gray-500 mb-1">
                    <span class="font-mono">${dateStr}</span>
                    <span class="font-bold text-gray-700">${e.u}</span>
                </div>
                <div class="font-bold text-gray-800">${e.a}</div>
                <div class="text-gray-600 mt-0.5">${e.d}</div>
            </div>
        `;
    }).join('');
    
    window.openModal('inconvenience-modal');
}

// ==========================================
// 📢 MESSAGING & ALERTS SYSTEM
// ==========================================
window.openWeeklyNotificationModal = function(monthStr, weekNum) {
    const list = document.getElementById('notif-list-container');
    const title = document.getElementById('notif-modal-title');
    const subtitle = document.getElementById('notif-modal-subtitle');
    const preview = document.getElementById('notif-message-preview');
    
    title.textContent = `📢 Notify Week ${weekNum} (${monthStr})`;
    subtitle.textContent = "Send detailed professional emails (Faculty + Consolidated Dept Summary).";
    list.innerHTML = '';
    
    // Clear Queue
    currentEmailQueue = [];

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
                facultyDuties[email].push({
                    date: dStr,
                    day: dayName,
                    session: sessionCode,
                    time: tStr
                });
            });
        }
    });

    if (Object.keys(facultyDuties).length === 0) {
        list.innerHTML = `<div class="text-center text-gray-400 py-8 italic">No duties assigned in this week yet.</div>`;
        window.openModal('notification-modal');
        return;
    }

    const sampleName = "Abdul Raheem MK";
    preview.textContent = generateWeeklyMessage(sampleName, "(01/12-Mon-FN)...");

    // --- AGGREGATOR FOR DEPARTMENTS ---
    const deptAggregator = {}; // { "English": [ { name: "John", duties: [] }, ... ] }

    const sortedEmails = Object.keys(facultyDuties).sort((a, b) => getNameFromEmail(a).localeCompare(getNameFromEmail(b)));

    // 2. Process Faculty
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

        // A. Add to Faculty Queue
        const emailSubject = `Invigilation Duty: Week ${weekNum} (${monthStr})`;
        const emailBody = generateProfessionalEmail(fullName, duties, "Upcoming Invigilation Duties");
        const btnId = `email-btn-${index}`;

        if (staffEmail) {
            currentEmailQueue.push({
                email: staffEmail,
                name: fullName,
                subject: emailSubject,
                body: emailBody,
                btnId: btnId
            });
        }

        // B. Aggregate for Department
        if (staff && staff.dept) {
            if (!deptAggregator[staff.dept]) deptAggregator[staff.dept] = [];
            deptAggregator[staff.dept].push({
                name: fullName,
                duties: duties
            });
        }

        // UI Rendering (Same as before)
        const waMsg = generateWeeklyMessage(fullName, dutyString);
        const waLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}` : "#";
        const shortDutyStr = dutyString.length > 100 ? dutyString.substring(0, 97) + "..." : dutyString;
        const smsMsg = `${firstName}: Duty ${shortDutyStr}. Check Portal. -CS GVC`;
        const smsLink = phone ? `sms:${phone}?body=${encodeURIComponent(smsMsg)}` : "#";

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
                    <button id="${btnId}" onclick="sendSingleEmail(this, '${staffEmail}', '${safeName}', '${safeSubject}', '${safeBody}')" ${emailDisabled}
                       class="bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded shadow transition flex items-center gap-1" title="Send Individual Email">
                       Mail
                    </button>
                    <a href="${smsLink}" target="_blank" ${phoneDisabled} class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded shadow transition">SMS</a>
                    <a href="${waLink}" target="_blank" ${phoneDisabled} onclick="markAsSent(this)" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded shadow transition">WA</a>
                </div>
            </div>
        `;
    });

    // 3. PROCESS DEPARTMENTS (ADD TO QUEUE)
    const cleanDepts = departmentsConfig.map(d => (typeof d === 'string') ? { name: d, email: "" } : d);
    
    Object.keys(deptAggregator).forEach(deptName => {
        const deptObj = cleanDepts.find(d => d.name === deptName);
        
        if (deptObj && deptObj.email) {
            const facultyList = deptAggregator[deptName];
            
            // Generate Consolidated Email
            const deptSubject = `Consolidated Duty List: ${deptName} - Week ${weekNum}`;
            const deptBody = generateDepartmentConsolidatedEmail(deptName, facultyList, weekNum, monthStr);

            // Add to Queue (No button ID, sends silently with bulk)
            currentEmailQueue.push({
                email: deptObj.email,
                name: `HOD ${deptName}`,
                subject: deptSubject,
                body: deptBody,
                btnId: null 
            });

            // Optional: Add a visual divider in the list to show a dept email will be sent
            list.insertAdjacentHTML('beforeend', `
                <div class="bg-indigo-50 border border-indigo-100 p-2 rounded text-xs text-indigo-800 text-center mt-1">
                    <span class="font-bold">queued:</span> Consolidated email for <b>${deptName}</b> (${deptObj.email})
                </div>
            `);
        }
    });

    // Add Bulk Button at the top
    const bulkBtnHtml = `
        <div class="mb-4 pb-4 border-b border-gray-100 flex justify-between items-center">
            <div class="text-xs text-gray-500">
                Queue: <b>${sortedEmails.length}</b> Faculty + <b>${Object.keys(deptAggregator).filter(d => cleanDepts.find(cd => cd.name === d && cd.email)).length}</b> Dept Emails.
            </div>
            <button id="btn-bulk-email-week" onclick="sendBulkEmails('btn-bulk-email-week')" 
                class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded shadow-md transition flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                Send Bulk Emails
            </button>
        </div>
    `;
    list.insertAdjacentHTML('afterbegin', bulkBtnHtml);

    window.openModal('notification-modal');
}


window.openSlotReminderModal = function(key) {
    const list = document.getElementById('notif-list-container');
    const title = document.getElementById('notif-modal-title');
    const subtitle = document.getElementById('notif-modal-subtitle');
    const preview = document.getElementById('notif-message-preview');
    
    // 1. Identify Target Date
    const [targetDateStr] = key.split(' | ');
    
    title.textContent = `🔔 Daily Reminder: ${targetDateStr}`;
    subtitle.textContent = "Send reminders for ALL duties on this day.";
    list.innerHTML = '';
    currentEmailQueue = [];

    // 2. Find ALL Sessions for this Date
    const dailyDuties = {}; // email -> [{ session, time }]
    
    Object.keys(invigilationSlots).forEach(slotKey => {
        if (slotKey.startsWith(targetDateStr)) {
            const slot = invigilationSlots[slotKey];
            const [d, t] = slotKey.split(' | ');
            const isAN = (t.includes("PM") || t.startsWith("12"));
            const sessionCode = isAN ? "AN" : "FN";
            
            slot.assigned.forEach(email => {
                if (!dailyDuties[email]) dailyDuties[email] = [];
                dailyDuties[email].push({
                    date: d,
                    time: t,
                    session: sessionCode
                });
            });
        }
    });

    if (Object.keys(dailyDuties).length === 0) return alert("No duties assigned for this date.");

    // Preview
    const reportTime = calculateReportTime(key.split(' | ')[1]);
    preview.textContent = generateDailyMessage("Faculty Name", targetDateStr, "FN/AN", reportTime);

    // ADD BULK BUTTON
    list.innerHTML = `
        <div class="mb-4 pb-4 border-b border-gray-100 flex justify-between items-center">
            <div class="text-xs text-gray-500">Queue: <b>${Object.keys(dailyDuties).length}</b> faculty.</div>
            <button id="btn-bulk-email-day" onclick="sendBulkEmails('btn-bulk-email-day')" 
                class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded shadow-md transition flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                Send Bulk Emails
            </button>
        </div>
    `;

    // 3. Render List
    const sortedEmails = Object.keys(dailyDuties).sort((a, b) => getNameFromEmail(a).localeCompare(getNameFromEmail(b)));

    sortedEmails.forEach((email, index) => {
        const duties = dailyDuties[email];
        // Sort FN before AN
        duties.sort((a, b) => a.time.localeCompare(b.time));
        
        const staff = staffData.find(s => s.email === email);
        const fullName = staff ? staff.name : email;
        const firstName = getFirstName(fullName);
        const staffEmail = staff ? staff.email : "";
        
        let phone = staff ? (staff.phone || "") : "";
        phone = phone.replace(/\D/g, ''); 
        if (phone.length === 10) phone = "91" + phone;

        // 1. Professional Email
        const emailSubject = `Reminder: Exam Duty Tomorrow (${targetDateStr})`;
        const emailBody = generateProfessionalEmail(fullName, duties, "Duty Reminder");
        
        // Add to Queue
        const btnId = `email-btn-${index}`;
        if (staffEmail) {
            currentEmailQueue.push({
                email: staffEmail,
                name: fullName,
                subject: emailSubject,
                body: emailBody,
                btnId: btnId
            });
        }

        // 2. WhatsApp/SMS (Consolidated)
        // "FN, AN" or just "FN"
        const sessionsStr = duties.map(d => d.session).join(' & ');
        const firstTime = duties[0].time;
        const reportTime = calculateReportTime(firstTime);
        
        const waMsg = generateDailyMessage(fullName, targetDateStr, sessionsStr, reportTime);
        const waLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}` : "#";

        const shortDate = targetDateStr.slice(0, 5);
        const smsMsg = `${firstName}: Duty ${shortDate} (${sessionsStr}). Report ${reportTime}. -CS GVC`;
        const smsLink = phone ? `sms:${phone}?body=${encodeURIComponent(smsMsg)}` : "#";

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
                    <button id="${btnId}" onclick="sendSingleEmail(this, '${staffEmail}', '${safeName}', '${safeSubject}', '${safeBody}')" ${emailDisabled}
                       class="bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded shadow transition flex items-center gap-1">
                       Mail
                    </button>
                    <a href="${smsLink}" target="_blank" ${phoneDisabled} class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded shadow transition">SMS</a>
                    <a href="${waLink}" target="_blank" ${phoneDisabled} onclick="markAsSent(this)" class="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-2 rounded shadow transition">Remind</a>
                </div>
            </div>
        `;
    });

    window.openModal('notification-modal');
}

// --- MESSAGE GENERATORS ---

function generateWeeklyMessage(name, dutyString) {
    const now = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    
    return `🟡🟡🟡 ${name}: Your invigilation duties updated now (${now}), details of invigilation duties given below.\n\nDate/s and Session/s: *${dutyString}*.\n\n🟢 *Kindly check the General instructions to invigilators here: https://bit.ly/gvc-exam*\n\n_Any inconvenience may kindly be adjusted through internal arrangements using the link http://www.gvc.ac.in/exam and the same may be reported in advance to SAS @ 9447955360 or to EC @ 9074061026. Duties and dates are subjected to change according to University Schedules, which will be intimated to you at the earliest. _-This is an automatically generated early reminder. For any queries contact: 9074061026 or Mail to examinations@gvc.ac.in -Chief Supt.-`;
}

function generateDailyMessage(dateStr, sessionStr, reportTime) {
    return `🔔 REMINDER: Exam Duty Tomorrow (${dateStr})\nSession: ${sessionStr}\n\nPlease report to the office of the CS by *${reportTime}* (30 min prior to start).\n\n- Chief Supt.`;
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
        return `${String(rh).padStart(2,'0')}:${String(rm).padStart(2,'0')} ${rMod}`;
    } catch (e) { return timeStr; }
}

// --- UI Helper: Mark button as sent ---
window.markAsSent = function(btn) {
    btn.classList.remove('bg-blue-600', 'bg-orange-600', 'hover:bg-blue-700', 'hover:bg-orange-700');
    btn.classList.add('bg-green-600', 'hover:bg-green-700', 'cursor-default');
    btn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        Sent
    `;
    // Optional: Disable click after sending to prevent double-send? 
    // User might want to re-send if it failed, so we keep it clickable but green.
}
window.sendSessionSMS = function(key) {
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

// --- YEARLY ATTENDANCE CSV EXPORT ---
window.downloadAttendanceCSV = function() {
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

            // Determine Role
            let status = "Invigilator";
            if (email === csEmail) status = "Chief Superintendent";
            else if (email === sasEmail) status = "Senior Asst. Supt.";

            // Add Row
            rows.push([
                dateStr,
                sessionType,
                `"${examName}"`, // Quote to handle commas
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

// 1. Download Template
window.downloadStaffTemplate = function() {
    const headers = ["Name", "Email", "Phone", "Department", "Designation", "Joining Date (YYYY-MM-DD)"];
    const sample = ["John Doe,john@example.com,9876543210,Physics,Assistant Professor,2023-06-01"];
    
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
window.handleStaffCSVUpload = function(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        processStaffCSV(text);
        // Reset input so same file can be selected again if needed
        input.value = ''; 
    };
    reader.readAsText(file);
}

// 4. Parse & Analyze CSV (Robust Date Fix: Handles DD-MM-YY)
function processStaffCSV(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return alert("CSV is empty or invalid.");

    // Normalize headers: remove quotes and trim
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
    
    // --- FIXED DATE HELPER (Handles DD-MM-YY) ---
    const formatDate = (dateStr) => {
        if (!dateStr) return new Date().toISOString().split('T')[0]; 
        try {
            // Normalize separators: Convert dots (.) and slashes (/) to dashes (-)
            let cleanStr = dateStr.replace(/[./]/g, '-').trim();
            let parts = cleanStr.split('-');
            
            let y, m, d;

            if (parts.length !== 3) return new Date().toISOString().split('T')[0];

            // Case 1: YYYY-MM-DD (e.g. 2025-11-29)
            if (parts[0].length === 4) {
                y = parts[0];
                m = parts[1];
                d = parts[2];
            } 
            // Case 2: DD-MM-YYYY (e.g. 29-11-2025)
            else if (parts[2].length === 4) {
                y = parts[2];
                m = parts[1];
                d = parts[0];
            } 
            // Case 3: DD-MM-YY (e.g. 29-11-25) <--- NEW LOGIC
            else if (parts[2].length === 2) {
                y = "20" + parts[2]; // Assume 2000s
                m = parts[1];
                d = parts[0];
            }
            else {
                return new Date().toISOString().split('T')[0];
            }

            // STRICT PADDING (Ensure 01, 05, etc.)
            m = m.padStart(2, '0');
            d = d.padStart(2, '0');

            return `${y}-${m}-${d}`; // HTML5 Input Standard
        } catch (e) {
            console.error("Date parsing error", e);
            return new Date().toISOString().split('T')[0];
        }
    };
    
    // Parse Rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle quoted values logic (e.g., "Doe, John")
        const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
        const row = line.split(regex).map(val => val.trim().replace(/^"|"$/g, '')); 
        
        // Extract
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

// 5. Action Listeners
document.getElementById('btn-staff-merge').addEventListener('click', async () => {
    if (tempUniqueStaff.length === 0) {
        alert("No new unique staff to add.");
        window.closeModal('staff-conflict-modal');
        return;
    }

    staffData = [...staffData, ...tempUniqueStaff];
    await syncStaffToCloud();
    
    // Grant access to new emails (Optional, if using staff login system)
    // tempUniqueStaff.forEach(s => addStaffAccess(s.email)); 

    alert(`✅ Successfully added ${tempUniqueStaff.length} new staff members.`);
    window.closeModal('staff-conflict-modal');
    renderStaffTable();
    updateAdminUI();
});

document.getElementById('btn-staff-replace').addEventListener('click', async () => {
    if (confirm("⚠️ WARNING: This will DELETE all existing staff data and replace it with the CSV data.\n\nAre you sure?")) {
        staffData = tempStaffData;
        await syncStaffToCloud();
        
        alert("✅ Database replaced successfully.");
        window.closeModal('staff-conflict-modal');
        renderStaffTable();
        updateAdminUI();
    }
});
window.clearOldData = async function() {
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

window.openAddStaffModal = function() {
    // Clear Form
    document.getElementById('stf-edit-index').value = ""; // Empty = New Mode
    document.getElementById('stf-name').value = "";
    document.getElementById('stf-email').value = "";
    document.getElementById('stf-email').disabled = false; // Enable email
    document.getElementById('stf-phone').value = "";
    document.getElementById('stf-dept').value = "";
    document.getElementById('stf-designation').value = "";
    document.getElementById('stf-join').value = "";
    
    document.getElementById('staff-modal-title').textContent = "Add New Invigilator";
    window.openModal('add-staff-modal');
}

window.editStaff = function(index) {
    const staff = staffData[index];
    if (!staff) return;

    // Populate Form
    document.getElementById('stf-edit-index').value = index; // Set Index = Edit Mode
    document.getElementById('stf-name').value = staff.name;
    document.getElementById('stf-email').value = staff.email;
    document.getElementById('stf-email').disabled = false; // Allow email change
    document.getElementById('stf-phone').value = staff.phone || "";
    document.getElementById('stf-dept').value = staff.dept;
    document.getElementById('stf-designation').value = staff.designation;
    document.getElementById('stf-join').value = staff.joiningDate || "";

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
            <em>For any adjustments, please request via the <a href="http://www.gvc.ac.in/exam" style="color: #666;">Exam Portal</a> and inform the SAS/Exam Chief in advance.</em>
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

// --- BULK EMAIL SENDER ---
window.sendBulkEmails = async function(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    if (currentEmailQueue.length === 0) return alert("No valid emails found to send.");
    if (!confirm(`Send detailed emails to ${currentEmailQueue.length} faculty members?`)) return;

    const originalText = btn.innerHTML;
    btn.disabled = true;
    let sentCount = 0;

    // Process Queue
    for (let i = 0; i < currentEmailQueue.length; i++) {
        const item = currentEmailQueue[i];
        
        // Update Button Progress
        btn.innerHTML = `<svg class="animate-spin h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Sending ${i + 1}/${currentEmailQueue.length}...`;

        // Find the individual button to update its status too
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

            // Success Update (Individual)
            if (indBtn) {
                indBtn.innerHTML = "Sent";
                indBtn.classList.remove('bg-gray-400', 'bg-gray-700');
                indBtn.classList.add('bg-green-600', 'cursor-default');
            }
            sentCount++;
            
            // Small delay to prevent rate limiting
            await new Promise(r => setTimeout(r, 500));

        } catch (e) {
            console.error(`Failed to send to ${item.email}`, e);
            if (indBtn) indBtn.innerHTML = "Failed";
        }
    }

    // Final Button State
    btn.innerHTML = `✅ Sent ${sentCount} Emails`;
    btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
    btn.classList.add('bg-green-600', 'cursor-default');
    
    if(typeof logActivity === 'function') logActivity("Bulk Email", `Sent ${sentCount} automated emails to faculty.`);
    alert(`Batch Complete! ${sentCount} emails sent.`);
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
window.toggleStaffListLock = function() {
    isStaffListLocked = !isStaffListLocked;
    const btn = document.getElementById('btn-staff-list-lock');
    
    if(btn) {
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

window.toggleEmailConfigLock = function() {
    isEmailConfigLocked = !isEmailConfigLocked;
    const input = document.getElementById('google-script-url');
    const btn = document.getElementById('email-config-lock-btn');
    
    if(input) input.disabled = isEmailConfigLocked;
    if(btn) updateLockIcon('email-config-lock-btn', isEmailConfigLocked);
}

// --- SUBSTITUTE SEARCH LOGIC ---
const subInput = document.getElementById('att-substitute-search');
const subResults = document.getElementById('att-substitute-results');

if (subInput) {
    subInput.addEventListener('input', function() {
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
    document.addEventListener('click', function(e) {
        if (!subInput.contains(e.target) && !subResults.contains(e.target)) {
            subResults.classList.add('hidden');
        }
    });
}
window.toggleGlobalTargetLock = function() {
    isGlobalTargetLocked = !isGlobalTargetLocked;
    const input = document.getElementById('global-duty-target');
    const btn = document.getElementById('global-target-lock-btn');
    
    if(input) {
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
    if(btn) updateLockIcon('global-target-lock-btn', isGlobalTargetLocked);
}

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
window.filterStaffTable = renderStaffTable;
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
window.switchAdminTab = function(tabName) {
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
