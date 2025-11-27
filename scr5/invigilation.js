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

// --- DOM ELEMENTS ---
const views = { login: document.getElementById('view-login'), admin: document.getElementById('view-admin'), staff: document.getElementById('view-staff') };
const ui = {
    headerName: document.getElementById('header-college-name'), authSection: document.getElementById('auth-section'),
    userName: document.getElementById('user-name'), userRole: document.getElementById('user-role'),
    staffTableBody: document.getElementById('staff-table-body'),
    adminSlotsGrid: document.getElementById('admin-slots-grid'),
    staffSlotsGrid: document.getElementById('staff-slots-grid'),
    calGrid: document.getElementById('calendar-grid'),
    calTitle: document.getElementById('cal-month-title')
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
    
    const collegesRef = collection(db, "colleges");
    const q = query(collegesRef, where("allowedUsers", "array-contains", user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // ADMIN LOGIN
        const docSnap = querySnapshot.docs[0];
        currentCollegeId = docSnap.id;
        isAdmin = true; 
        setupLiveSync(currentCollegeId, 'admin'); 
    } else {
        // STAFF LOGIN
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
                } else {
                    alert("Access Denied: Email not in staff list."); signOut(auth);
                }
            } else {
                alert("Invalid Link."); signOut(auth);
            }
        } else { 
            alert("Access Denied. Invigilators need a specific college link."); 
            signOut(auth); 
        }
    }
}

function setupLiveSync(collegeId, mode) {
    if (cloudUnsubscribe) cloudUnsubscribe(); 

    const docRef = doc(db, "colleges", collegeId);
    
    cloudUnsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            collegeData = docSnap.data();
            designationsConfig = JSON.parse(collegeData.invigDesignations || JSON.stringify(DEFAULT_DESIGNATIONS));
            rolesConfig = JSON.parse(collegeData.invigRoles || JSON.stringify(DEFAULT_ROLES));
            staffData = JSON.parse(collegeData.examStaffData || '[]');
            invigilationSlots = JSON.parse(collegeData.examInvigilationSlots || '{}');
            
            if (mode === 'admin') {
                if (document.getElementById('view-admin').classList.contains('hidden') && 
                    document.getElementById('view-staff').classList.contains('hidden')) {
                    initAdminDashboard();
                } else {
                    updateAdminUI();
                    renderSlotsGridAdmin();
                    if (!document.getElementById('view-staff').classList.contains('hidden')) {
                         const me = staffData.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase());
                         if(me) renderStaffCalendar(me.email);
                    }
                }
            } else {
                const me = staffData.find(s => s.email.toLowerCase() === currentUser.email.toLowerCase());
                if (me) {
                    if (document.getElementById('view-staff').classList.contains('hidden')) {
                        initStaffDashboard(me);
                    } else {
                        renderStaffCalendar(me.email);
                        const pending = calculateStaffTarget(me) - (me.dutiesDone || 0);
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
    showView('admin');
}

function initStaffDashboard(me) {
    ui.headerName.textContent = collegeData.examCollegeName;
    ui.userName.textContent = me.name;
    ui.userRole.textContent = isAdmin ? "ADMIN (View as Staff)" : "INVIGILATOR";
    document.getElementById('auth-section').classList.remove('hidden');
    
    document.getElementById('staff-view-name').textContent = me.name;
    const pending = calculateStaffTarget(me) - (me.dutiesDone || 0);
    document.getElementById('staff-view-pending').textContent = pending > 0 ? pending : "0 (Done)";
    
    updateHeaderButtons('staff');
    renderStaffCalendar(me.email);
    showView('staff');
    
    document.getElementById('cal-prev').onclick = () => { currentCalDate.setMonth(currentCalDate.getMonth()-1); renderStaffCalendar(me.email); };
    document.getElementById('cal-next').onclick = () => { currentCalDate.setMonth(currentCalDate.getMonth()+1); renderStaffCalendar(me.email); };
}

function updateAdminUI() {
    document.getElementById('stat-total-staff').textContent = staffData.length;
    const acYear = getCurrentAcademicYear();
    document.getElementById('lbl-academic-year').textContent = `AY: ${acYear.label}`;
    const desigSelect = document.getElementById('stf-designation');
    if(desigSelect) desigSelect.innerHTML = Object.keys(designationsConfig).map(r => `<option value="${r}">${r}</option>`).join('');
    renderStaffTable(); 
}

function renderStaffTable() {
    if(!ui.staffTableBody) return;
    ui.staffTableBody.innerHTML = '';
    const filter = document.getElementById('staff-search').value.toLowerCase();

    staffData.forEach((staff, index) => {
        if (filter && !staff.name.toLowerCase().includes(filter)) return;
        const target = calculateStaffTarget(staff);
        const done = staff.dutiesDone || 0; 
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
            <td class="px-6 py-3 text-right text-xs font-medium flex justify-end gap-2">
                <button onclick="openRoleAssignmentModal(${index})" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded">Role</button>
                <button onclick="deleteStaff(${index})" class="text-red-500 hover:text-red-700">&times;</button>
            </td>
        `;
        ui.staffTableBody.appendChild(row);
    });
}

function renderSlotsGridAdmin() {
    if(!ui.adminSlotsGrid) return;
    ui.adminSlotsGrid.innerHTML = '';
    Object.keys(invigilationSlots).sort().forEach(key => {
        const slot = invigilationSlots[key];
        const filled = slot.assigned.length;
        const statusColor = filled >= slot.required ? "border-green-400 bg-green-50" : "border-orange-300 bg-orange-50";
        
        ui.adminSlotsGrid.innerHTML += `
            <div class="border-l-4 ${statusColor} bg-white p-4 rounded shadow-sm slot-card">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-gray-800 text-sm">${key}</h4>
                    <span class="text-xs font-bold px-2 py-1 rounded bg-white border">${filled} / ${slot.required}</span>
                </div>
                <div class="text-xs text-gray-600 mb-3"><strong>Assigned:</strong> ${slot.assigned.map(email => getNameFromEmail(email)).join(', ') || "None"}</div>
                <div class="flex gap-2">
                    <button onclick="toggleLock('${key}')" class="flex-1 text-xs border border-gray-300 rounded py-1 hover:bg-gray-50">${slot.isLocked ? '🔒 Unlock' : '🔓 Lock'}</button>
                    <button onclick="waNotify('${key}')" class="flex-1 text-xs bg-green-600 text-white rounded py-1 hover:bg-green-700">WhatsApp</button>
                </div>
            </div>
        `;
    });
}

function renderStaffCalendar(myEmail) {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    ui.calTitle.textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
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

    const upcomingList = document.getElementById('staff-upcoming-list');
    upcomingList.innerHTML = '';
    let upcomingCount = 0;

    Object.keys(invigilationSlots).sort().forEach(key => {
        const slot = invigilationSlots[key];
        if(slot.assigned.includes(myEmail)) {
            upcomingCount++;
            const btnColor = slot.isLocked ? "bg-gray-100 text-gray-600 cursor-not-allowed" : "bg-white text-red-600 border border-red-200 hover:bg-red-50";
            const btnText = slot.isLocked ? "Locked" : "Cancel";
            const clickAction = `onclick="cancelDuty('${key}', '${myEmail}', ${slot.isLocked})"`
            
            upcomingList.innerHTML += `
                <div class="bg-blue-50 p-3 rounded-md border-l-4 border-blue-500 flex justify-between items-center group">
                    <div>
                        <div class="font-bold text-sm text-gray-800">${key}</div>
                        <div class="text-xs text-blue-600 font-semibold mt-1">You are assigned</div>
                    </div>
                    <button ${clickAction} class="${btnColor} text-[10px] font-bold px-2 py-1 rounded transition shadow-sm opacity-0 group-hover:opacity-100">
                        ${btnText}
                    </button>
                </div>
            `;
        }
    });
    if(upcomingCount === 0) upcomingList.innerHTML = `<p class="text-gray-400 text-sm italic">No upcoming duties assigned.</p>`;

    let html = "";
    for (let i = 0; i < firstDayIndex; i++) html += `<div class="bg-gray-50 border border-gray-100 h-24"></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
        const slots = slotsByDate[day] || [];
        let dayContent = `<div class="text-right font-bold text-sm p-1 text-gray-400">${day}</div>`;
        let bgClass = "bg-white"; 
        let borderClass = "border-gray-200";

        if (slots.length > 0) {
            dayContent += `<div class="flex flex-col gap-1 px-1 mt-1">`;
            
            slots.sort((a, b) => a.sessionType === "FN" ? -1 : 1);

            slots.forEach(slot => {
                const filled = slot.assigned.length;
                const needed = slot.required;
                const available = Math.max(0, needed - filled);
                const isFull = filled >= needed;
                const isAssigned = slot.assigned.includes(myEmail);
                const isUnavailable = slot.unavailable.includes(myEmail);
                
                let badgeColor = "bg-green-100 text-green-700 border-green-200"; 
                let statusText = `${available}/${needed}`; 

                if (isAssigned) { badgeColor = "bg-blue-600 text-white border-blue-600"; statusText = "Assigned"; }
                else if (isUnavailable) { badgeColor = "bg-red-50 text-red-600 border-red-200"; statusText = "Unavail"; }
                else if (isFull) { badgeColor = "bg-gray-100 text-gray-400 border-gray-200"; statusText = `0/${needed}`; }

                dayContent += `
                    <div class="text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeColor} flex justify-between items-center">
                        <span>${slot.sessionType}</span>
                        <span>${statusText}</span>
                    </div>`;
            });
            dayContent += `</div>`;
            bgClass = "bg-white hover:bg-gray-50 cursor-pointer";
        }

        const dateStr = `${String(day).padStart(2,'0')}.${String(month+1).padStart(2,'0')}.${year}`;
        const clickAction = slots.length > 0 ? `onclick="openDayModal('${dateStr}', '${myEmail}')"` : "";

        html += `<div class="border h-28 ${borderClass} ${bgClass} flex flex-col relative" ${clickAction}>${dayContent}</div>`;
    }
    ui.calGrid.innerHTML = html;
}

// --- INTERACTION FUNCTIONS (Define these as standard functions) ---

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

async function addUserToWhitelist(email) {
    try {
        const ref = doc(db, "colleges", currentCollegeId);
        await updateDoc(ref, { allowedUsers: arrayUnion(email) });
    } catch(e) { console.error(e); }
}

function toggleLock(key) {
    invigilationSlots[key].isLocked = !invigilationSlots[key].isLocked;
    syncSlotsToCloud(); // Fire & Forget (Live sync handles update)
}

function volunteer(key, email) {
    const [datePart] = key.split(' | ');
    const sameDaySessions = Object.keys(invigilationSlots).filter(k => k.startsWith(datePart) && k !== key);
    const conflict = sameDaySessions.some(k => invigilationSlots[k].assigned.includes(email));

    if (conflict && !confirm("Whoa! You're already on duty today. Double shift? 🦸‍♂️")) return;
    if (!conflict && !confirm("Confirm duty?")) return;

    invigilationSlots[key].assigned.push(email);
    const me = staffData.find(s => s.email === email);
    if(me) me.dutiesAssigned = (me.dutiesAssigned || 0) + 1;
    
    syncSlotsToCloud();
    syncStaffToCloud(); 
    window.closeModal('day-detail-modal');
}

function cancelDuty(key, email, isLocked) {
    if (isLocked) return alert("🚫 Slot Locked! Contact Admin.");
    if (confirm("Cancel duty?")) {
        invigilationSlots[key].assigned = invigilationSlots[key].assigned.filter(e => e !== email);
        const me = staffData.find(s => s.email === email);
        if(me && me.dutiesAssigned > 0) me.dutiesAssigned--;
        syncSlotsToCloud();
        syncStaffToCloud();
        window.closeModal('day-detail-modal');
    }
}

function setAvailability(key, email, isAvailable) {
    if(isAvailable) invigilationSlots[key].unavailable = invigilationSlots[key].unavailable.filter(e => e !== email);
    else invigilationSlots[key].unavailable.push(email);
    syncSlotsToCloud();
    window.closeModal('day-detail-modal');
}

function waNotify(key) {
    const slot = invigilationSlots[key];
    if(slot.assigned.length === 0) return alert("No staff assigned.");
    const phones = slot.assigned.map(email => {
        const s = staffData.find(st => st.email === email);
        return s ? s.phone : "";
    }).filter(p => p);
    if(phones.length === 0) return alert("No phones found.");
    const msg = encodeURIComponent(`Exam Duty: You are assigned for ${key}.`);
    window.open(`https://wa.me/${phones[0]}?text=${msg}`, '_blank');
}

// --- DAY DETAIL MODAL (Updated: With Contact List) ---
window.openDayModal = function(dateStr, email) {
    document.getElementById('modal-day-title').textContent = dateStr;
    const container = document.getElementById('modal-sessions-container');
    container.innerHTML = '';
    
    const sessions = Object.keys(invigilationSlots).filter(k => k.startsWith(dateStr));
    
    sessions.forEach(key => {
        const slot = invigilationSlots[key];
        const filled = slot.assigned.length;
        const needed = slot.required - filled;
        const isAssigned = slot.assigned.includes(email);
        const isUnavailable = slot.unavailable.includes(email);
        const isLocked = slot.isLocked;

        const t = key.split(' | ')[1].toUpperCase();
        const sessLabel = (t.includes("PM") || t.startsWith("12")) ? "AFTERNOON (AN)" : "FORENOON (FN)";

        // --- NEW: GENERATE ASSIGNED STAFF LIST ---
        let staffListHtml = '';
        if (slot.assigned.length > 0) {
            const listItems = slot.assigned.map(staffEmail => {
                // Find staff details from global data
                const s = staffData.find(st => st.email === staffEmail);
                if (!s) return ''; 
                
                return `
                    <div class="flex justify-between items-center text-xs bg-white p-2 rounded border border-gray-100 mb-1 shadow-sm">
                        <div>
                            <div class="font-bold text-gray-700">${s.name}</div>
                            <div class="text-[10px] text-gray-500">${s.dept}</div>
                        </div>
                        <a href="https://wa.me/${s.phone}" target="_blank" class="text-green-600 hover:text-green-800 font-medium flex items-center gap-1" title="Contact via WhatsApp">
                            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                            ${s.phone}
                        </a>
                    </div>
                `;
            }).join('');

            staffListHtml = `
                <div class="mt-3 pt-2 border-t border-gray-200">
                    <div class="text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Assigned Invigilators</div>
                    <div class="space-y-1 max-h-32 overflow-y-auto pr-1">
                        ${listItems}
                    </div>
                </div>
            `;
        }
        // -------------------------------

        let actionHtml = "";
        
        if (isAssigned) {
            if (isLocked) {
                 actionHtml = `<button onclick="cancelDuty('${key}', '${email}', true)" class="w-full bg-gray-100 text-gray-600 border border-gray-300 text-xs py-2 rounded font-bold cursor-pointer" title="Locked by Admin">🔒 Assigned (Locked)</button>`;
            } else {
                 actionHtml = `<button onclick="cancelDuty('${key}', '${email}', false)" class="w-full bg-green-100 text-green-700 border border-green-300 text-xs py-2 rounded font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition">✅ Assigned (Click to Cancel)</button>`;
            }
        } else if (isUnavailable) {
             actionHtml = `
                <button onclick="setAvailability('${key}', '${email}', true)" class="text-xs text-blue-600 hover:underline">
                    Undo "Unavailable"
                </button>`;
        } else if (isLocked && !isAssigned) {
            actionHtml = `<span class="text-gray-400 text-xs font-bold">🔒 Slot Locked</span>`;
        } else {
            if (needed > 0) {
                actionHtml = `
                    <div class="flex gap-2 w-full">
                        <button onclick="volunteer('${key}', '${email}')" class="flex-1 bg-indigo-600 text-white text-xs py-2 rounded font-bold hover:bg-indigo-700 shadow-sm transition">
                            Volunteer
                        </button>
                        <button onclick="setAvailability('${key}', '${email}', false)" class="flex-1 bg-white border border-red-300 text-red-600 text-xs py-2 rounded font-medium hover:bg-red-50">
                            Unavailable
                        </button>
                    </div>
                `;
            } else {
                actionHtml = `
                    <div class="flex justify-between items-center w-full">
                        <span class="text-xs text-gray-500 italic">Slots Full</span>
                        <button onclick="setAvailability('${key}', '${email}', false)" class="text-xs text-red-500 hover:underline">Mark Unavailable</button>
                    </div>
                `;
            }
        }

        container.innerHTML += `
            <div class="bg-gray-50 p-3 rounded border border-gray-200">
                <div class="flex justify-between items-center mb-2">
                    <div>
                        <span class="font-bold text-gray-800 block text-sm">${sessLabel}</span>
                        <span class="text-[10px] text-gray-500">${key.split('|')[1]}</span>
                    </div>
                    <span class="text-xs bg-white border px-2 py-0.5 rounded ${needed > 0 ? 'text-green-600 border-green-200' : 'text-gray-400'}">${filled}/${slot.required} Filled</span>
                </div>
                <div class="flex items-center justify-between mt-2">
                    ${actionHtml}
                </div>
                ${staffListHtml}
            </div>
        `;
    });

    window.openModal('day-detail-modal');
}

async function saveNewStaff() {
    const name = document.getElementById('stf-name').value;
    const email = document.getElementById('stf-email').value;
    const phone = document.getElementById('stf-phone').value;
    const dept = document.getElementById('stf-dept').value;
    const designation = document.getElementById('stf-designation').value;
    const date = document.getElementById('stf-join').value;

    if(!name || !email) return alert("Fill all fields");

    const newObj = { name, email, phone, dept, designation, joiningDate: date, dutiesDone: 0, roleHistory: [], preferredDays: [1,2,3,4,5] };
    staffData.push(newObj);
    await syncStaffToCloud();
    await addUserToWhitelist(email);
    window.closeModal('add-staff-modal');
    
    if(!isAdmin) window.location.reload();
    else renderStaffTable();
}

async function deleteStaff(index) {
    if(confirm("Delete staff?")) {
        staffData.splice(index, 1);
        await syncStaffToCloud();
        renderStaffTable();
    }
}

async function saveRoleAssignment() {
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

async function removeRoleFromStaff(sIdx, rIdx) {
    staffData[sIdx].roleHistory.splice(rIdx, 1);
    await syncStaffToCloud();
    window.closeModal('role-assignment-modal');
    renderStaffTable();
}

function openRoleAssignmentModal(index) {
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

function calculateStaffTarget(staff) {
    const roleTarget = designationsConfig[staff.designation] || 2;
    if (staff.roleHistory) {
        const today = new Date();
        const active = staff.roleHistory.find(r => new Date(r.start) <= today && new Date(r.end) >= today);
        if(active && rolesConfig[active.role] !== undefined) return rolesConfig[active.role] * 5; 
    }
    return roleTarget * 5; 
}

function getNameFromEmail(email) {
    const s = staffData.find(st => st.email === email);
    return s ? s.name.split(' ')[0] : email.split('@')[0];
}

function getCurrentAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); 
    let startYear = (month < 5) ? year - 1 : year;
    return { label: `${startYear}-${startYear+1}`, start: new Date(startYear, 5, 1), end: new Date(startYear+1, 4, 31) };
}

// --- HELPERS FOR HTML ---
window.calculateSlotsFromSchedule = async function() {
    alert("Slots are automatically calculated from the Main App. Go to Main App > Room Allotment > Save to update.");
    const docRef = doc(db, "colleges", currentCollegeId);
    const snap = await getDoc(docRef);
    if(snap.exists()) {
        collegeData = snap.data();
        invigilationSlots = JSON.parse(collegeData.examInvigilationSlots || '{}');
        renderSlotsGridAdmin();
    }
}

window.runAutoAllocation = async function() {
    if(!confirm("Auto-Assign duties?")) return;
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
                if (slot.unavailable.includes(s.email)) return false;
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

window.filterStaffTable = renderStaffTable;
window.switchAdminTab = function(tabName) {
    document.getElementById('tab-content-staff').classList.add('hidden');
    document.getElementById('tab-content-slots').classList.add('hidden');
    document.getElementById('tab-btn-staff').classList.replace('border-indigo-600', 'border-transparent');
    document.getElementById('tab-btn-slots').classList.replace('border-indigo-600', 'border-transparent');
    document.getElementById(`tab-content-${tabName}`).classList.remove('hidden');
    document.getElementById(`tab-btn-${tabName}`).classList.replace('border-transparent', 'border-indigo-600');
}

window.openModal = (id) => document.getElementById(id).classList.remove('hidden');
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');
window.switchToStaffView = switchToStaffView;
window.initAdminDashboard = initAdminDashboard;

function showView(viewName) {
    Object.values(views).forEach(el => el.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
}

// --- EXPORT TO WINDOW ---
window.saveNewStaff = saveNewStaff;
window.deleteStaff = deleteStaff;
window.openRoleAssignmentModal = openRoleAssignmentModal;
window.saveRoleAssignment = saveRoleAssignment;
window.removeRoleFromStaff = removeRoleFromStaff;
window.toggleLock = toggleLock;
window.waNotify = waNotify;
window.volunteer = volunteer;
window.cancelDuty = cancelDuty;
window.setAvailability = setAvailability;
window.openDayModal = openDayModal;
