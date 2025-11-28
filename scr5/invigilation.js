import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, orderBy, onSnapshot } 
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = window.firebase.auth;
const db = window.firebase.db;
const provider = window.firebase.provider;

// --- CONFIG ---
const DEFAULT_DESIGNATIONS = { "Assistant Professor": 2, "Associate Professor": 1, "Guest Lecturer": 4, "Professor": 0 };
const DEFAULT_ROLES = { "Vice Principal": 0, "HOD": 1, "NSS Officer": 1, "Warden": 0, "Exam Chief": 0 };
// Add with other defaults
const DEFAULT_DEPARTMENTS = ["English", "Malayalam", "Commerce", "Mathematics", "Physics", "Computer Science", "Botany", "Zoology", "History", "Economics"];

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
            departmentsConfig = JSON.parse(collegeData.invigDepartments || JSON.stringify(DEFAULT_DEPARTMENTS));
            globalDutyTarget = parseInt(collegeData.invigGlobalTarget || 2);
            
            // DATA
            staffData = JSON.parse(collegeData.examStaffData || '[]');
            invigilationSlots = JSON.parse(collegeData.examInvigilationSlots || '{}');
            
            // NEW: Load Advance Unavailability
            advanceUnavailability = JSON.parse(collegeData.invigAdvanceUnavailability || '{}');
            
            if (mode === 'admin') {
                if (document.getElementById('view-admin').classList.contains('hidden') && 
                    document.getElementById('view-staff').classList.contains('hidden')) {
                    initAdminDashboard();
                } else {
                    updateAdminUI();
                    renderSlotsGridAdmin();
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
                        renderStaffCalendar(me.email);
                        renderStaffRankList(me.email);
                        if(typeof renderExchangeMarket === "function") renderExchangeMarket(me.email);
                        
                        const pending = calculateStaffTarget(me) - getDutiesDoneCount(me.email);
                        document.getElementById('staff-view-pending').textContent = pending > 0 ? pending : "0 (Done)";
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
    populateAttendanceSessions(); // <--- ADD THIS LINE
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
    const acYear = getCurrentAcademicYear();
    const today = new Date();
    
    // 1. Determine Calculation Period
    // End: Today (or end of Academic Year if today is later)
    // Start: June 1st (or Joining Date if joined later)
    const calcEnd = (today < acYear.end) ? today : acYear.end;
    const joinDate = new Date(staff.joiningDate);
    const calcStart = (joinDate > acYear.start) ? joinDate : acYear.start;

    if (calcStart > calcEnd) return 0; // Joined in future

    let totalTarget = 0;
    let cursor = new Date(calcStart);
    
    // 2. Iterate Month by Month
    while (cursor <= calcEnd) {
        const currentMonthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
        const currentMonthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        
        // Default: Global Target
        let monthlyRate = globalDutyTarget; 
        
        // Override 1: Designation (If you want designations to have defaults)
        if (designationsConfig[staff.designation] !== undefined) {
             monthlyRate = designationsConfig[staff.designation];
        }

        // Override 2: Functional Roles (Time-Bound)
        if (staff.roleHistory && staff.roleHistory.length > 0) {
            staff.roleHistory.forEach(roleAssign => {
                const roleStart = new Date(roleAssign.start);
                const roleEnd = new Date(roleAssign.end);
                
                // Check if role is active during this specific month
                // Logic: Role Start is before Month End AND Role End is after Month Start
                if (roleStart <= currentMonthEnd && roleEnd >= currentMonthStart) {
                    if (rolesConfig[roleAssign.role] !== undefined) {
                        monthlyRate = rolesConfig[roleAssign.role];
                    }
                }
            });
        }

        totalTarget += monthlyRate;
        
        // Move to next month
        cursor.setMonth(cursor.getMonth() + 1);
        // Safety break
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

    // --- RESTORED CALCULATION LOGIC ---
    // Calculates: Target - (Attended Duties)
    const target = calculateStaffTarget(me);
    const done = getDutiesDoneCount(me.email);
    const pending = target - done;
    
    document.getElementById('staff-view-pending').textContent = pending > 0 ? pending : "0 (Done)";
    // ----------------------------------

    updateHeaderButtons('staff');
    renderStaffCalendar(me.email);
    renderStaffRankList(me.email); 
    
    // Render the Market Widget
    if(typeof renderExchangeMarket === "function") {
        renderExchangeMarket(me.email);
    }
    
    showView('staff');
    
    // Calendar Navigation Listeners
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
// --- RENDER ADMIN SLOTS (Sorted Newest to Oldest) ---
function renderSlotsGridAdmin() {
    if(!ui.adminSlotsGrid) return;
    ui.adminSlotsGrid.innerHTML = '';
    
    // 1. Sort Keys: Date Descending (Newest First)
    const sortedKeys = Object.keys(invigilationSlots).sort((a, b) => {
        const parseDate = (key) => {
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
        };
        // b - a = Descending (Newest to Oldest)
        // a - b = Ascending (Oldest to Newest)
        return parseDate(b) - parseDate(a);
    });

    sortedKeys.forEach(key => {
        const slot = invigilationSlots[key];
        const filled = slot.assigned.length;
        
        // Color Logic
        let statusColor = "";
        let statusIcon = "";
        
        if (slot.isLocked) {
            statusColor = "border-red-500 bg-red-50"; 
            statusIcon = "🔒";
        } else if (filled >= slot.required) {
            statusColor = "border-green-400 bg-green-50"; 
            statusIcon = "✅";
        } else {
            statusColor = "border-orange-300 bg-orange-50"; 
            statusIcon = "🔓";
        }

        // Unavailable Button Logic
        let unavButton = "";
        if (slot.unavailable && slot.unavailable.length > 0) {
            unavButton = `
                <button onclick="openInconvenienceModal('${key}')" class="mt-2 w-full flex items-center justify-center gap-2 bg-white text-red-700 border border-red-200 px-2 py-1.5 rounded text-xs font-bold hover:bg-red-50 transition shadow-sm">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    View ${slot.unavailable.length} Inconvenience(s)
                </button>
            `;
        }

        ui.adminSlotsGrid.innerHTML += `
            <div class="border-l-4 ${statusColor} bg-white p-4 rounded shadow-sm slot-card flex flex-col justify-between transition-all">
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold text-gray-800 text-sm w-1/2 break-words flex items-center gap-1">
                            ${statusIcon} ${key}
                        </h4>
                        
                        <div class="flex items-center bg-white border border-gray-300 rounded text-xs shadow-sm">
                            <button onclick="changeSlotReq('${key}', -1)" class="px-2 py-1 hover:bg-gray-100 border-r text-gray-600 font-bold">-</button>
                            <span class="px-2 font-bold text-gray-800" title="Filled / Required">${filled} / ${slot.required}</span>
                            <button onclick="changeSlotReq('${key}', 1)" class="px-2 py-1 hover:bg-gray-100 border-l text-gray-600 font-bold">+</button>
                        </div>
                    </div>
                    
                    <div class="text-xs text-gray-600 mb-2">
                        <strong>Assigned:</strong> ${slot.assigned.map(email => getNameFromEmail(email)).join(', ') || "None"}
                    </div>
                    ${unavButton}
                </div>
                
                <div class="flex gap-2 mt-3">
                    <button onclick="openManualAllocationModal('${key}')" class="flex-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded py-1.5 hover:bg-indigo-100 font-bold transition">
                        Manual Assign
                    </button>
                    <button onclick="toggleLock('${key}')" class="w-24 text-xs border border-gray-300 rounded py-1.5 hover:bg-gray-50 text-gray-700 font-medium transition shadow-sm bg-white">
                        ${slot.isLocked ? 'Unlock' : 'Lock'}
                    </button>
                </div>
            </div>
        `;
    });
}

function renderStaffTable() {
    if(!ui.staffTableBody) return;
    ui.staffTableBody.innerHTML = '';
    const filter = document.getElementById('staff-search').value.toLowerCase();

    staffData.forEach((staff, index) => {
        if (filter && !staff.name.toLowerCase().includes(filter)) return;
        const target = calculateStaffTarget(staff);
        const done = getDutiesDoneCount(staff.email); // Calculated dynamically
        const pending = target - done;
        let activeRoleLabel = "";
        const today = new Date();
        if (staff.roleHistory) {
            const activeRole = staff.roleHistory.find(r => new Date(r.start) <= today && new Date(r.end) >= today);
            if (activeRole) activeRoleLabel = `<span class="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded ml-1">${activeRole.role}</span>`;
        }
        const statusColor = pending > 3 ? 'text-red-600 font-bold' : (pending > 0 ? 'text-orange-600' : 'text-green-600');
        const row = document.createElement('tr');
        row.className = "hover:bg-gray-50 transition border-b border-gray-100";
        row.innerHTML = `
            <td class="px-6 py-3"><div class="flex items-center"><div class="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs mr-3">${staff.name.charAt(0)}</div><div><div class="text-sm font-bold text-gray-800">${staff.name}</div><div class="text-xs text-gray-500">${staff.designation} ${activeRoleLabel}</div></div></div></td>
            <td class="px-6 py-3 text-center font-mono text-sm text-gray-600">${target}</td>
            <td class="px-6 py-3 text-center font-mono text-sm font-bold">${done}</td>
            <td class="px-6 py-3 text-center font-mono text-sm ${statusColor}">${pending}</td>
            <td class="px-6 py-3 text-right text-xs font-medium flex justify-end gap-2"><button onclick="openRoleAssignmentModal(${index})" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded">Role</button><button onclick="deleteStaff(${index})" class="text-red-500 hover:text-red-700">&times;</button></td>
        `;
        ui.staffTableBody.appendChild(row);
    });
}
function renderStaffRankList(myEmail) {
    const list = document.getElementById('staff-rank-list');
    if (!list) return;
    
    // 1. Calculate and Sort
    const rankedStaff = staffData.map(s => ({ 
        ...s, 
        pending: calculateStaffTarget(s) - getDutiesDoneCount(s.email) 
    })).sort((a, b) => {
        if (b.pending !== a.pending) return b.pending - a.pending;
        return a.name.localeCompare(b.name);
    });

    // 2. Render List
    list.innerHTML = rankedStaff.map((s, i) => {
        const isMe = s.email === myEmail;
        const bgClass = isMe ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-transparent hover:bg-gray-100";
        const textClass = isMe ? "text-indigo-700 font-bold" : "text-gray-700";
        const rankBadge = i < 3 ? `text-orange-500 font-black` : `text-gray-400 font-medium`;
        
        // --- NEW: Active Role Logic ---
        let roleBadge = "";
        if (s.roleHistory) {
            const today = new Date();
            const activeRole = s.roleHistory.find(r => new Date(r.start) <= today && new Date(r.end) >= today);
            if (activeRole) {
                // Small purple badge for the role
                roleBadge = `<span class="ml-1 text-[8px] uppercase font-bold bg-purple-100 text-purple-700 px-1 py-0.5 rounded border border-purple-200">${activeRole.role}</span>`;
            }
        }
        // ------------------------------

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
                <span class="font-mono font-bold ${s.pending > 0 ? 'text-red-600' : 'text-green-600'} ml-2">${s.pending}</span>
            </div>`;
    }).join('');
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
            await saveAdvanceUnavailability();
            renderStaffCalendar(email); 
            openDayModal(dateStr, email); 
        }
    } else {
        // ADD (Open Modal for Reason)
        // We use a special key format: "ADVANCE|DD.MM.YYYY|SESSION"
        document.getElementById('unav-key').value = `ADVANCE|${dateStr}|${session}`; 
        document.getElementById('unav-email').value = email;
        
        // Reset Modal Fields
        document.getElementById('unav-reason').value = "";
        document.getElementById('unav-details').value = "";
        document.getElementById('unav-details-container').classList.add('hidden');
        
        // Switch Modals
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
            // Remove existing to avoid duplicates, then add new
            advanceUnavailability[dateStr].FN = advanceUnavailability[dateStr].FN.filter(u => u.email !== email);
            advanceUnavailability[dateStr].AN = advanceUnavailability[dateStr].AN.filter(u => u.email !== email);
            
            advanceUnavailability[dateStr].FN.push(entry);
            advanceUnavailability[dateStr].AN.push(entry);
        } else {
            // Single Session (FN or AN)
            if (!advanceUnavailability[dateStr][session]) advanceUnavailability[dateStr][session] = [];
            // Remove existing
            advanceUnavailability[dateStr][session] = advanceUnavailability[dateStr][session].filter(u => u.email !== email);
            // Add new
            advanceUnavailability[dateStr][session].push(entry);
        }
        
        await saveAdvanceUnavailability();
        
        window.closeModal('unavailable-modal');
        openDayModal(dateStr, email);
        renderStaffCalendar(email);

    } else {
        // --- CASE B: SLOT SPECIFIC (No Change) ---
        if (!invigilationSlots[key].unavailable) invigilationSlots[key].unavailable = [];
        invigilationSlots[key].unavailable.push(entry);
        
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

// --- INTELLIGENT SLOT MANAGER ---
window.calculateSlotsFromSchedule = async function() {
    const btn = document.querySelector('button[onclick="calculateSlotsFromSchedule()"]');
    if(btn) { btn.disabled = true; btn.innerText = "Checking Cloud..."; }

    try {
        // 1. Fetch Latest Exam Data (Source of Truth)
        const mainRef = doc(db, "colleges", currentCollegeId);
        const mainSnap = await getDoc(mainRef);
        
        if (!mainSnap.exists()) throw new Error("Cloud data unavailable.");
        
        let fullData = mainSnap.data();
        
        // Fetch Chunks (Student Data)
        const dataColRef = collection(db, "colleges", currentCollegeId, "data");
        const q = query(dataColRef, orderBy("index")); 
        const querySnapshot = await getDocs(q);
        let fullPayload = "";
        querySnapshot.forEach(doc => { if (doc.data().payload) fullPayload += doc.data().payload; });
        if (fullPayload) {
            const bulkData = JSON.parse(fullPayload);
            fullData = { ...fullData, ...bulkData };
        }

        const students = JSON.parse(fullData.examBaseData || '[]');
        if(students.length === 0) throw new Error("No exam data found in cloud.");

        // 2. Calculate New Requirements
        const sessions = {};
        students.forEach(s => {
            const key = `${s.Date} | ${s.Time}`;
            if(!sessions[key]) sessions[key] = 0;
            sessions[key]++;
        });

        let changesLog = [];
        let removalLog = []; // Stores { session, name, phone }
        let newSlots = { ...invigilationSlots }; // Start with current state
        let hasChanges = false;

        Object.keys(sessions).forEach(key => {
            const count = sessions[key];
            const base = Math.ceil(count / 30);
            const reserve = Math.ceil(base * 0.10);
            const newReq = base + reserve;
            
            if (!newSlots[key]) {
                // NEW SESSION
                newSlots[key] = { required: newReq, assigned: [], unavailable: [], isLocked: true };
                changesLog.push(`🆕 ${key}: Added (Req: ${newReq})`);
                hasChanges = true;
            } else {
                // EXISTING SESSION
                const currentReq = newSlots[key].required;
                if (currentReq !== newReq) {
                    changesLog.push(`🔄 ${key}: ${currentReq} ➝ ${newReq}`);
                    hasChanges = true;
                    newSlots[key].required = newReq;

                    // CHECK FOR REDUCTION & OVER-BOOKING
                    if (newReq < newSlots[key].assigned.length) {
                        const excessCount = newSlots[key].assigned.length - newReq;
                        const removed = pruneAssignments(newSlots[key], excessCount);
                        removed.forEach(r => removalLog.push({ session: key, ...r }));
                    }
                }
            }
        });

        // 3. Confirm & Apply
        if (!hasChanges) {
            alert("✅ Cloud data checked. No changes in slot requirements.");
        } else {
            let msg = "⚠️ UPDATES FOUND ⚠️\n\n" + changesLog.join('\n');
            if (removalLog.length > 0) {
                msg += `\n\n🚨 SLOT REDUCTION ALERT: ${removalLog.length} staff will be removed from duty based on lowest pending rank.`;
            }
            msg += "\n\nProceed with update?";

            if (confirm(msg)) {
                invigilationSlots = newSlots;
                await syncSlotsToCloud();
                renderSlotsGridAdmin();
                
                // 4. Post-Update Notification
                if (removalLog.length > 0) {
                    showRemovalNotification(removalLog);
                } else {
                    alert("Slots updated successfully!");
                }
            }
        }

    } catch (e) {
        console.error(e);
        alert("Error: " + e.message);
    } finally {
        if(btn) { btn.disabled = false; btn.innerText = "1. Generate Slots"; }
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
    const name = document.getElementById('stf-name').value;
    const email = document.getElementById('stf-email').value;
    const phone = document.getElementById('stf-phone').value;
    const dept = document.getElementById('stf-dept').value;
    const designation = document.getElementById('stf-designation').value;
    const date = document.getElementById('stf-join').value;
    if(!name || !email) return alert("Fill all fields");
    const days = [];
    document.querySelectorAll('.day-chk:checked').forEach(chk => days.push(parseInt(chk.value)));
    const newObj = { name, email, phone, dept, designation, joiningDate: date, dutiesDone: 0, roleHistory: [], preferredDays: days };
    staffData.push(newObj);
    await syncStaffToCloud();
    
    // Use New Access Function
    await addStaffAccess(email);

    window.closeModal('add-staff-modal');
    if(!isAdmin) window.location.reload(); else renderStaffTable();
}

window.deleteStaff = async function(index) {
    if(confirm("Delete staff?")) {
        const email = staffData[index].email;
        staffData.splice(index, 1);
        await syncStaffToCloud();
        await removeStaffAccess(email); // Remove from access list
        renderStaffTable();
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
    document.getElementById('manual-modal-req').textContent = slot.required;
    
    // 1. Sort Staff
    const rankedStaff = staffData.map(s => ({
        ...s,
        pending: calculateStaffTarget(s) - (s.dutiesDone || 0)
    })).sort((a, b) => b.pending - a.pending);

    // 2. Render Available List
    const availList = document.getElementById('manual-available-list');
    availList.innerHTML = '';
    let selectedCount = 0;

    rankedStaff.forEach(s => {
        const isAssigned = slot.assigned.includes(s.email);
        
        // CHECK AVAILABILITY (Includes Advance Check)
        if (isUserUnavailable(slot, s.email, key)) return; 
        
        if (isAssigned) selectedCount++;
        const checkState = isAssigned ? 'checked' : '';
        const rowClass = isAssigned ? 'bg-indigo-50' : 'hover:bg-gray-50';
        const pendingColor = s.pending > 0 ? 'text-red-600' : 'text-green-600';

        availList.innerHTML += `
            <tr class="${rowClass} border-b last:border-0 transition">
                <td class="px-3 py-2 text-center w-10">
                    <input type="checkbox" class="manual-chk w-4 h-4 text-indigo-600" value="${s.email}" ${checkState} onchange="window.updateManualCounts()">
                </td>
                <td class="px-3 py-2">
                    <div class="font-bold text-gray-800">${s.name}</div>
                    <div class="text-[10px] text-gray-500">${s.dept}</div>
                </td>
                <td class="px-3 py-2 text-center font-mono font-bold ${pendingColor} w-16">
                    ${s.pending}
                </td>
            </tr>`;
    });

    // 3. Render Unavailable List (MERGED)
    const unavList = document.getElementById('manual-unavailable-list');
    unavList.innerHTML = '';
    
    // Combine Slot Specific + Advance
    const allUnavailable = [];
    
    // A. Slot Specific
    if (slot.unavailable) slot.unavailable.forEach(u => allUnavailable.push(u));
    
    // B. Advance
    const [dateStr, timeStr] = key.split(' | ');
    let session = "FN";
    const t = timeStr ? timeStr.toUpperCase() : "";
    if (t.includes("PM") || t.startsWith("12:") || t.startsWith("12.")) session = "AN";
    
    if (advanceUnavailability[dateStr] && advanceUnavailability[dateStr][session]) {
        advanceUnavailability[dateStr][session].forEach(u => {
            // Avoid duplicates
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
    window.openModal('manual-allocation-modal');
}

window.saveManualAllocation = async function() {
    const key = document.getElementById('manual-session-key').value;
    const selectedEmails = Array.from(document.querySelectorAll('.manual-chk:checked')).map(c => c.value);
    if (invigilationSlots[key]) {
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
    const month = now.getMonth(); 
    // Academic Year: June (5) to May (4)
    let startYear = (month < 5) ? year - 1 : year;
    return { 
        label: `${startYear}-${startYear+1}`, 
        start: new Date(startYear, 5, 1), 
        end: new Date(startYear+1, 4, 31) 
    };
}
// --- NEW: MANUAL ALLOCATION LOGIC ---

function openManualAllocationModal(key) {
    const slot = invigilationSlots[key];
    if (!slot.isLocked) {
        alert("⚠️ Please LOCK this slot first.\n\nManual allocation is only allowed in Locked mode to prevent conflicts.");
        return;
    }

    document.getElementById('manual-session-key').value = key;
    document.getElementById('manual-modal-title').textContent = key;
    document.getElementById('manual-modal-req').textContent = slot.required;
    
    // 1. Sort Staff by Pending Duty
    const rankedStaff = staffData.map(s => ({
        ...s,
        pending: calculateStaffTarget(s) - (s.dutiesDone || 0)
    })).sort((a, b) => b.pending - a.pending);

    // 2. Render List
    const availList = document.getElementById('manual-available-list');
    availList.innerHTML = '';
    let selectedCount = 0;


    // 3. Render Unavailable
    const unavList = document.getElementById('manual-unavailable-list');
    unavList.innerHTML = '';
    if (slot.unavailable && slot.unavailable.length > 0) {
        slot.unavailable.forEach(u => {
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
    window.openModal('manual-allocation-modal');
}

function updateManualCounts() {
    const count = document.querySelectorAll('.manual-chk:checked').length;
    document.getElementById('manual-sel-count').textContent = count;
}

async function saveManualAllocation() {
    const key = document.getElementById('manual-session-key').value;
    const selectedEmails = Array.from(document.querySelectorAll('.manual-chk:checked')).map(c => c.value);
    
    if (invigilationSlots[key]) {
        invigilationSlots[key].assigned = selectedEmails;
        await syncSlotsToCloud();
        window.closeModal('manual-allocation-modal');
        renderSlotsGridAdmin();
    }
}
// --- ROLE EDITOR FUNCTIONS ---

window.openRoleConfigModal = function() {
    // 1. Load Global Target
    const targetInput = document.getElementById('global-duty-target');
    if(targetInput) targetInput.value = globalDutyTarget;

    // 2. Render Lists
    renderRolesList();
    if(typeof renderDepartmentsList === "function") renderDepartmentsList();

    // 3. Show Modal
    window.openModal('role-config-modal');
}

function renderRolesList() {
    const container = document.getElementById('roles-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Sort roles alphabetically for better UX
    const sortedRoles = Object.entries(rolesConfig).sort((a,b) => a[0].localeCompare(b[0]));

    if (sortedRoles.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-xs text-center py-2">No custom roles defined.</p>';
        return;
    }

    sortedRoles.forEach(([role, target]) => {
        container.innerHTML += `
            <div class="flex justify-between items-center text-xs bg-white p-2 rounded border mb-1 group">
                <span class="font-bold text-gray-700">${role}</span>
                <div class="flex items-center gap-2">
                    <button onclick="editRoleConfig('${role}', ${target})" 
                            class="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono font-bold hover:bg-indigo-100 border border-indigo-100 transition text-[10px]" 
                            title="Click to Edit Target">
                        ${target}/mo ✎
                    </button>
                    
                    <button onclick="deleteRoleConfig('${role}')" class="text-red-400 hover:text-red-600 font-bold px-1.5 py-0.5 rounded hover:bg-red-50 transition" title="Delete Role">&times;</button>
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
    
    // Save to Cloud
    const ref = doc(db, "colleges", currentCollegeId);
    await updateDoc(ref, {
        invigRoles: JSON.stringify(rolesConfig),
        invigDepartments: JSON.stringify(departmentsConfig), // <--- ADDED THIS
        invigGlobalTarget: globalDutyTarget
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
    ui.attArea.classList.remove('hidden');
    ui.attPlaceholder.classList.add('hidden');
    ui.attList.innerHTML = '';
    
    // 1. Decide list source: 'attendance' (Saved) OR 'assigned' (Planned)
    const presentList = slot.attendance || slot.assigned || [];
    
    // 2. Render Rows
    presentList.forEach(email => {
        addAttendanceRow(email);
    });

    // 3. Populate Substitute Dropdown (Exclude those already present)
    ui.attSubSelect.innerHTML = '<option value="">Select Staff...</option>';
    staffData.forEach(s => {
        if (!presentList.includes(s.email)) {
            ui.attSubSelect.innerHTML += `<option value="${s.email}">${s.name}</option>`;
        }
    });
    
    updateAttCount();
}

function addAttendanceRow(email) {
    const s = staffData.find(st => st.email === email);
    if(!s) return;
    
    const div = document.createElement('div');
    div.className = "flex justify-between items-center bg-white p-2 rounded border border-gray-200";
    div.innerHTML = `
        <div class="flex items-center gap-3">
            <input type="checkbox" class="att-chk w-5 h-5 text-green-600 rounded focus:ring-green-500" value="${email}" checked onchange="window.updateAttCount()">
            <div>
                <div class="font-bold text-gray-800 text-sm">${s.name}</div>
                <div class="text-xs text-gray-500">${s.dept}</div>
            </div>
        </div>
        <button class="text-red-400 hover:text-red-600 text-xs font-bold" onclick="this.parentElement.remove(); window.updateAttCount();">Remove</button>
    `;
    ui.attList.appendChild(div);
}

window.addSubstituteToAttendance = function() {
    const email = ui.attSubSelect.value;
    if(!email) return;
    
    // Check duplicates
    const existing = Array.from(document.querySelectorAll('.att-chk')).map(c => c.value);
    if(existing.includes(email)) return alert("Already in list");
    
    addAttendanceRow(email);
    
    // Remove from dropdown to prevent double adding
    ui.attSubSelect.querySelector(`option[value="${email}"]`).remove();
    ui.attSubSelect.value = "";
    
    updateAttCount();
}

window.updateAttCount = function() {
    const count = document.querySelectorAll('.att-chk:checked').length;
    document.getElementById('att-count-display').textContent = `${count} Present`;
}

window.saveAttendance = async function() {
    const key = ui.attSessionSelect.value;
    if (!key) return;
    
    if(!confirm(`Confirm attendance for ${key}?\n\nThis will update the 'Duties Done' count for all checked staff.`)) return;
    
    const presentEmails = Array.from(document.querySelectorAll('.att-chk:checked')).map(c => c.value);
    
    // Update Cloud Data
    invigilationSlots[key].attendance = presentEmails;
    
    await syncSlotsToCloud();
    
    // Refresh UI to show updated counts
    populateAttendanceSessions(); 
    renderStaffTable(); 
    alert("Attendance Saved & Counts Updated!");
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
        renderExchangeMarket(buyerEmail); // Refresh UI
        return;
    }

    // 2. Perform Swap
    // Remove Seller
    slot.assigned = slot.assigned.filter(e => e !== sellerEmail);
    slot.exchangeRequests = slot.exchangeRequests.filter(e => e !== sellerEmail);
    
    // Add Buyer
    slot.assigned.push(buyerEmail);

    // 3. Update Stats (Duties Assigned Count)
    const seller = staffData.find(s => s.email === sellerEmail);
    const buyer = staffData.find(s => s.email === buyerEmail);
    
    if (seller && seller.dutiesAssigned > 0) seller.dutiesAssigned--;
    if (buyer) buyer.dutiesAssigned = (buyer.dutiesAssigned || 0) + 1;

    // 4. Sync
    await syncSlotsToCloud();
    await syncStaffToCloud();

    alert(`Success! You have accepted the duty from ${sellerName}.`);
    
    // 5. Refresh UI
    window.closeModal('day-detail-modal');
    renderStaffCalendar(buyerEmail);
    renderExchangeMarket(buyerEmail);
    initStaffDashboard(buyer); // Full Refresh to update counts
}
window.postForExchange = async function(key, email) {
    // 1. Confirm Action
    if (!confirm("Post this duty for exchange?\n\nNOTE: You remain responsible (and assigned) until someone else accepts it.")) return;
    
    const slot = invigilationSlots[key];
    if (!slot.exchangeRequests) slot.exchangeRequests = [];
    
    if (!slot.exchangeRequests.includes(email)) {
        // 2. Update Local Data (Optimistic)
        slot.exchangeRequests.push(email);
        
        // 3. IMMEDIATE UI UPDATES
        try {
            // Update Background Calendar (to show Orange "Posted")
            renderStaffCalendar(email);
            
            // Update Sidebar Market Widget
            if(typeof renderExchangeMarket === "function") renderExchangeMarket(email);

            // CRITICAL CHANGE: Close Modal Immediately
            window.closeModal('day-detail-modal');
            
        } catch(e) { console.error("UI Update Error:", e); }

        // 4. Save to Cloud (Background Process)
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
        
        // 3. IMMEDIATE UI UPDATES
        try {
            // Update Background Calendar (to show Blue "Assigned")
            renderStaffCalendar(email);

            // Update Sidebar Market Widget
            if(typeof renderExchangeMarket === "function") renderExchangeMarket(email);
            
            // CRITICAL CHANGE: Close Modal Immediately
            window.closeModal('day-detail-modal');

        } catch(e) { console.error("UI Update Error:", e); }

        // 4. Save to Cloud
        await syncSlotsToCloud();
    }
}
// --- DEPARTMENT MANAGEMENT FUNCTIONS ---

function populateDepartmentSelect() {
    const select = document.getElementById('stf-dept');
    if (!select) return;
    
    // Sort alphabetically
    departmentsConfig.sort();
    
    select.innerHTML = `<option value="">Select Department...</option>` + 
        departmentsConfig.map(d => `<option value="${d}">${d}</option>`).join('');
}

function renderDepartmentsList() {
    const container = document.getElementById('dept-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    departmentsConfig.sort().forEach(dept => {
        container.innerHTML += `
            <div class="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">
                <span class="font-bold text-gray-700">${dept}</span>
                <button onclick="deleteDepartment('${dept}')" class="text-red-400 hover:text-red-600 font-bold ml-1">&times;</button>
            </div>`;
    });
}

window.addNewDepartment = function() {
    const name = document.getElementById('new-dept-name').value.trim();
    if (!name) return alert("Enter department name");
    if (departmentsConfig.includes(name)) return alert("Department already exists");
    
    departmentsConfig.push(name);
    renderDepartmentsList();
    document.getElementById('new-dept-name').value = '';
}

window.deleteDepartment = function(name) {
    if (confirm(`Delete department "${name}"?`)) {
        departmentsConfig = departmentsConfig.filter(d => d !== name);
        renderDepartmentsList();
    }
}


// --- EXPORT TO WINDOW (Final Fix) ---
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
