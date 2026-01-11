
import { STORAGE_KEYS } from '../core/constants.js';

// ==========================================
// STATE VARIABLES
// ==========================================
let currentSessionKey = "";
let currentSessionAllotment = [];
let hasUnsavedAllotment = false;
let isQPLocked = false;
let isAllotmentLocked = false;
let isScribeListLocked = true;
let globalScribeList = [];
let currentScribeAllotment = {};
let studentToAllotScribeRoom = null;
let hasUnsavedScribes = false;
let qpCodeMap = {};

// Constants
const ROOM_ALLOTMENT_KEY = 'examRoomAllotment';
const SCRIBE_ALLOTMENT_KEY = 'examScribeAllotment';
const SCRIBE_LIST_KEY = 'examScribeList';
const QP_CODE_LIST_KEY = 'examQPCodes';
const INVIG_MAPPING_KEY = 'examInvigilatorMapping';

// ==========================================
// EXPORTED FUNCTIONS
// ==========================================

export function populate_room_allotment_session_dropdown() {
    const allotmentSessionSelect = document.getElementById('allotment-session-select');
    if (!allotmentSessionSelect) return;

    try {
        let allStudentData = window.allStudentData || [];
        // Fallback if empty
        if (allStudentData.length === 0 && document.getElementById('json-data-store')) {
            allStudentData = JSON.parse(document.getElementById('json-data-store').innerHTML || '[]');
            window.allStudentData = allStudentData;
        }

        if (allStudentData.length === 0) {
            disable_room_allotment_tab(true);
            return;
        }

        const previousSelection = allotmentSessionSelect.value;
        const sessions = new Set(allStudentData.map(s => `${s.Date} | ${s.Time}`));
        // Assuming compareSessionStrings is global or we need to import it. 
        // app.js should have exposed it, but if not we use a simple sort.
        const allStudentSessions = Array.from(sessions).sort((a, b) => {
            if (window.compareSessionStrings) return window.compareSessionStrings(a, b);
            return a.localeCompare(b);
        });

        allotmentSessionSelect.innerHTML = '<option value="">-- Select a Session --</option>';

        // Smart Default Logic
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-GB').replace(/\//g, '.');
        const nowTime = now.getTime();
        let activeTodaySession = null;
        let nextUpcomingSession = null;
        let minDiff = Infinity;

        allStudentSessions.forEach(session => {
            allotmentSessionSelect.innerHTML += `<option value="${session}">${session}</option>`;

            const [datePart, timePart] = session.split('|').map(s => s.trim());
            if (!datePart || !timePart) return;
            const [dd, mm, yyyy] = datePart.split('.');
            const [timeStr, period] = timePart.split(' ');
            let [hours, minutes] = timeStr.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            const sessionStart = new Date(yyyy, mm - 1, dd, hours, minutes);
            const sessionEndWindow = new Date(sessionStart.getTime() + (60 * 60 * 1000));

            if (datePart === todayStr && nowTime < sessionEndWindow.getTime()) {
                if (!activeTodaySession) activeTodaySession = session;
            }
            const diff = sessionStart.getTime() - nowTime;
            if (diff > 0 && diff < minDiff) {
                minDiff = diff;
                nextUpcomingSession = session;
            }
        });

        let defaultSession = activeTodaySession || nextUpcomingSession || allStudentSessions[0] || "";
        const targetVal = (previousSelection && allStudentSessions.includes(previousSelection)) ? previousSelection : defaultSession;

        if (targetVal) {
            allotmentSessionSelect.value = targetVal;
            // We manually trigger the change logic to ensure state loads
            // But we don't want to dispatch event if it causes loops.
            // Safe to call renderRoomAllotment directly.
            renderRoomAllotment(targetVal);
        }

        disable_room_allotment_tab(false);

        // Apply modern modal-based session selector (same as QP Codes and Search)
        if (window.setupSessionSelector) {
            window.setupSessionSelector('allotment-session-select');
        }

    } catch (e) {
        console.error("Failed to populate room allotment sessions:", e);
        disable_room_allotment_tab(true);
    }
}

export function renderRoomAllotment(sessionKey = null) {
    if (!sessionKey) {
        const select = document.getElementById('allotment-session-select');
        if (select) sessionKey = select.value;
    }

    if (!sessionKey) return;

    currentSessionKey = sessionKey;

    // Load Room Allotment
    const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
    currentSessionAllotment = allAllotments[sessionKey] || [];

    // Load Scribe Allotment
    const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
    currentScribeAllotment = allScribeAllotments[sessionKey] || {};

    // Load Scribe List
    globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');

    updateAllotmentDisplay();

    // Update other panels
    if (window.renderInvigilationPanel) window.renderInvigilationPanel();

    // Load Scribe List UI
    const scribeSection = document.getElementById('scribe-allotment-list-section');
    if (scribeSection) {
        scribeSection.classList.remove('hidden');
        renderScribeAllotmentList(sessionKey);
    }
}

export function saveRoomAllotment() {
    if (!currentSessionKey) return;

    const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
    allAllotments[currentSessionKey] = currentSessionAllotment;
    localStorage.setItem(ROOM_ALLOTMENT_KEY, JSON.stringify(allAllotments));

    const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
    allScribeAllotments[currentSessionKey] = currentScribeAllotment;
    localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(allScribeAllotments));

    // Reset Dirty Flag
    hasUnsavedAllotment = false;

    // Sync to Cloud (if function exists)
    if (window.syncSessionToCloud) {
        window.syncSessionToCloud(currentSessionKey);
    }

    // UI Feedback
    const status = document.getElementById('room-allotment-status');
    if (status) {
        status.textContent = 'Allotment Saved Successfully!';
        setTimeout(() => { status.textContent = ''; }, 2000);
    }

    updateAllotmentDisplay();
}

export function autoAllotRooms() {
    alert("Auto-allotment feature coming soon!");
}

export function clearAllotmentForSession() {
    if (!confirm("Are you sure you want to clear ALL room allotments for this session? This cannot be undone.")) return;

    currentSessionAllotment = [];
    hasUnsavedAllotment = true;
    saveRoomAllotment();
    renderRoomAllotment(currentSessionKey);
}

export function downloadAllotmentCSV() {
    if (!currentSessionKey) return alert("Select a session first.");

    const [date, time] = currentSessionKey.split(' | ');
    const sessionStudents = (window.allStudentData || []).filter(s => s.Date === date && s.Time === time);

    if (sessionStudents.length === 0) return alert("No students in this session.");

    const rows = [];
    // Recalculate allocation state locally to ensure freshness
    // Or simpler: iterate through students and find their room in `currentSessionAllotment`.

    // Build a map of RegNo -> Room
    const regToRoom = {};
    currentSessionAllotment.forEach(r => {
        r.students.forEach(s => {
            const reg = (typeof s === 'object') ? s['Register Number'] : s;
            regToRoom[reg] = r.roomName;
        });
    });

    sessionStudents.forEach(s => {
        const reg = s['Register Number'];
        const room = regToRoom[reg] || "Unassigned";

        rows.push([
            s.Date,
            s.Time,
            s['Exam Name'] || '',
            s.Course,
            s.Stream || "Regular",
            reg,
            s.Name,
            room
        ]);
    });

    // CSV Header
    let csvContent = "Date,Time,Exam Name,Course,Stream,Register Number,Name,Room\n";
    rows.forEach(r => {
        const rowStr = r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
        csvContent += rowStr + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `RoomAllotment_${date}_${time.replace(/:/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function printRoomAllotment() {
    window.print();
}

export function viewRoomAllotmentStatus() {
    // Scroll to status section
    const el = document.getElementById('allotment-student-count-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

export function openManualAllocationModal() {
    showRoomSelectionModal();
}

export function closeManualAllocationModal() {
    const modal = document.getElementById('room-selection-modal');
    if (modal) modal.classList.add('hidden');
}

export function saveManualAllocation() {
    // This is handled efficiently inside selectRoomForAllotment
}

export function deleteManualAllocation(index) {
    window.deleteRoom(index);
}

export function allocateOneRoom() {
    showRoomSelectionModal();
}


// ==========================================
// INTERNAL HELPER FUNCTIONS
// ==========================================

function disable_room_allotment_tab(disabled) {
    const tab = document.getElementById('nav-room-allotment');
    if (tab) {
        if (disabled) {
            tab.classList.add('opacity-50', 'cursor-not-allowed');
            tab.style.pointerEvents = 'none';
        } else {
            tab.classList.remove('opacity-50', 'cursor-not-allowed');
            tab.style.pointerEvents = 'auto';
        }
    }
}

function updateAllotmentDisplay() {
    const allStudentData = window.allStudentData || [];
    const [date, time] = currentSessionKey.split(' | ');
    const sessionStudentRecords = allStudentData.filter(s => s.Date === date && s.Time === time);

    const container = document.getElementById('allotment-student-count-section');
    if (!container) return;

    container.innerHTML = '';
    container.className = "mb-6 grid grid-cols-1 md:grid-cols-2 gap-4";
    container.classList.remove('hidden');

    // 1. Calculate Stats
    const streamStats = {};
    const currentStreamConfig = window.currentStreamConfig || ["Regular", "Supplementary"];

    currentStreamConfig.forEach(stream => {
        streamStats[stream] = { total: 0, allotted: 0, roomsUsed: 0 };
    });
    if (!streamStats["Regular"]) streamStats["Regular"] = { total: 0, allotted: 0, roomsUsed: 0 };

    sessionStudentRecords.forEach(s => {
        const strm = s.Stream || "Regular";
        if (!streamStats[strm]) streamStats[strm] = { total: 0, allotted: 0, roomsUsed: 0 };
        streamStats[strm].total++;
    });

    currentSessionAllotment.forEach(room => {
        const roomStream = room.stream || "Regular";
        if (!streamStats[roomStream]) streamStats[roomStream] = { total: 0, allotted: 0, roomsUsed: 0 };
        streamStats[roomStream].allotted += room.students.length;
        streamStats[roomStream].roomsUsed++;
    });

    // 2. Render Stats Cards
    Object.keys(streamStats).forEach(streamName => {
        const stats = streamStats[streamName];
        const remaining = stats.total - stats.allotted;
        const estimatedRoomsNeeded = Math.ceil(stats.total / 30);

        const isComplete = (remaining <= 0 && stats.total > 0);
        const borderColor = isComplete ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50";
        const titleColor = isComplete ? "text-green-800" : "text-blue-800";

        const cardHtml = `
        <div class="${borderColor} border p-4 rounded-lg shadow-sm flex flex-col justify-between">
            <div>
                <h3 class="text-lg font-bold ${titleColor} mb-3 border-b border-gray-200 pb-1 flex justify-between">
                    ${streamName} Stream
                    ${isComplete ? '<span class="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Completed</span>' : ''}
                </h3>
                <div class="flex justify-between items-center text-sm mb-3">
                    <div class="text-center"><p class="text-gray-500 font-medium text-xs uppercase">Total</p><p class="text-xl font-bold text-gray-800">${stats.total}</p></div>
                    <div class="text-center"><p class="text-gray-500 font-medium text-xs uppercase">Allotted</p><p class="text-xl font-bold text-blue-600">${stats.allotted}</p></div>
                    <div class="text-center"><p class="text-gray-500 font-medium text-xs uppercase">Remaining</p><p class="text-xl font-bold ${remaining > 0 ? 'text-orange-600' : 'text-gray-400'}">${remaining}</p></div>
                </div>
            </div>
        </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });

    // 3. Handle Add Room Button State
    const totalRemaining = Object.values(streamStats).reduce((sum, s) => sum + (s.total - s.allotted), 0);
    const addSection = document.getElementById('add-room-section');
    if (addSection) addSection.classList.remove('hidden');

    const addBtn = document.getElementById('add-room-allotment-button');
    if (addBtn) {
        if (totalRemaining <= 0) {
            addBtn.disabled = true;
            addBtn.classList.add('opacity-50', 'cursor-not-allowed');
            addBtn.textContent = "All Students Allotted";
        } else {
            addBtn.disabled = false;
            addBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            addBtn.textContent = "+ Add Room";
        }
    }

    renderAllottedRooms();
}

function renderAllottedRooms() {
    const allottedRoomsList = document.getElementById('allotted-rooms-list');
    if (!allottedRoomsList) return;

    allottedRoomsList.innerHTML = '';

    if (currentSessionAllotment.length === 0) {
        allottedRoomsList.innerHTML = '<p class="text-gray-500 text-sm">No rooms allotted yet.</p>';
        return;
    }

    currentSessionAllotment.forEach((room, index) => {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow mb-2';

        roomDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                     <span class="font-bold text-lg text-gray-800">${room.roomName}</span>
                     <span class="text-sm text-gray-500">(${room.students.length}/${room.capacity})</span>
                     <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${room.stream || 'Regular'}</span>
                </div>
                <button onclick="window.deleteRoom(${index})" class="text-red-500 hover:text-red-700 p-2">Delete</button>
            </div>
        `;
        allottedRoomsList.appendChild(roomDiv);
    });
}

// Window functions for HTML onclick
window.deleteRoom = function (index) {
    if (!confirm('Remove this room allotment?')) return;
    currentSessionAllotment.splice(index, 1);
    hasUnsavedAllotment = true;
    saveRoomAllotment();
}

function showRoomSelectionModal() {
    const modal = document.getElementById('room-selection-modal');
    if (modal) modal.classList.remove('hidden');

    const list = document.getElementById('room-selection-list');
    if (list) {
        list.innerHTML = '';
        const currentRoomConfig = window.currentRoomConfig || {};

        Object.keys(currentRoomConfig).forEach(roomName => {
            const room = currentRoomConfig[roomName];
            const div = document.createElement('div');
            div.className = "p-3 border border-gray-300 rounded mb-2 cursor-pointer hover:bg-blue-50";
            div.innerHTML = `<strong>${roomName}</strong> (Cap: ${room.capacity})`;
            div.onclick = () => selectRoomForAllotment(roomName, room.capacity, 'Regular'); // Default to Regular
            list.appendChild(div);
        });
    }
}

function selectRoomForAllotment(roomName, capacity, stream) {
    const allStudentData = window.allStudentData || [];
    const [date, time] = currentSessionKey.split(' | ');

    // Find students for this session & stream who are NOT allotted
    const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time && (s.Stream || "Regular") === stream);

    const allottedRegNos = new Set();
    currentSessionAllotment.forEach(r => {
        r.students.forEach(s => {
            const reg = (typeof s === 'object') ? s['Register Number'] : s;
            allottedRegNos.add(reg);
        });
    });

    const candidates = sessionStudents.filter(s => !allottedRegNos.has(s['Register Number']));

    if (candidates.length === 0) {
        alert("No students left to allot for this stream.");
        return;
    }

    const toAllot = candidates.slice(0, capacity);

    currentSessionAllotment.push({
        roomName,
        capacity,
        students: toAllot,
        stream
    });

    closeManualAllocationModal();
    hasUnsavedAllotment = true;
    saveRoomAllotment();
}

function renderScribeAllotmentList(sessionKey) {
    // Basic stub - needs full implementation from recovered code if needed
}

