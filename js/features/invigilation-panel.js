// ==========================================
// 👮 INVIGILATOR ASSIGNMENT PANEL
// Handles UI rendering, Swaps, Manual Assignment, and Auto-Assign
// ==========================================

import { STORAGE_KEYS } from '../core/constants.js';

let swapSourceRoom = null; // Local State

export function renderInvigilationPanel() {
    const section = document.getElementById('invigilator-assignment-section');
    const list = document.getElementById('invigilator-list-container');
    const sessionKey = document.getElementById('allotment-session-select')?.value;

    if (!sessionKey) {
        if (section) section.classList.add('hidden');
        return;
    }

    // A. Consolidate Rooms
    // dependency: window.currentSessionAllotment
    const roomDataMap = {};
    if (window.currentSessionAllotment && window.currentSessionAllotment.length > 0) {
        window.currentSessionAllotment.forEach(room => {
            if (!roomDataMap[room.roomName]) roomDataMap[room.roomName] = { name: room.roomName, count: 0, streams: new Set(), isScribe: false };
            roomDataMap[room.roomName].count += room.students.length;
            roomDataMap[room.roomName].streams.add(room.stream || "Regular");
        });
    }
    const allScribeAllotments = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCRIBE_ALLOTMENT) || '{}'); // Used literal SCRIBE_ALLOTMENT_KEY in old code, mapping to constant
    const sessionScribeMap = allScribeAllotments[sessionKey] || {};
    Object.values(sessionScribeMap).forEach(roomName => {
        if (!roomDataMap[roomName]) roomDataMap[roomName] = { name: roomName, count: 0, streams: new Set(), isScribe: true };
        roomDataMap[roomName].count += 1;
        roomDataMap[roomName].streams.add("Scribe");
    });

    const allRooms = Object.values(roomDataMap);
    if (allRooms.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    list.innerHTML = '';

    const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVIGILATOR_MAPPING) || '{}');
    // dependency: window.currentInvigMapping
    window.currentInvigMapping = allMappings[sessionKey] || {};

    // dependency: window.getRoomSerialMap (Check if exists, else fallback)
    const serialMap = (typeof window.getRoomSerialMap === 'function') ? window.getRoomSerialMap(sessionKey) : {};

    allRooms.sort((a, b) => (serialMap[a.name] || 999) - (serialMap[b.name] || 999));

    // --- SWAP MODE BANNER ---
    if (swapSourceRoom) {
        list.innerHTML += `
        <div class="bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold p-3 rounded-lg mb-3 flex justify-between items-center shadow-sm sticky top-0 z-10 animate-fade-in-down">
            <div class="flex items-center gap-2">
                <span class="animate-pulse text-xl">🔄</span> 
                <div>
                    <div class="uppercase text-[10px] opacity-70 tracking-wider">Swap Mode Active</div>
                    <div>Select a target room for <strong>${swapSourceRoom}</strong></div>
                </div>
            </div>
            <button onclick="window.handleSwapClick('${swapSourceRoom.replace(/'/g, "\\'")}')" class="bg-white border border-orange-200 text-orange-700 px-3 py-1.5 rounded-md hover:bg-orange-100 transition text-xs font-bold shadow-sm">Cancel</button>
        </div>
    `;
    }

    // C. Render Rows
    // dependency: window.currentRoomConfig
    const config = window.currentRoomConfig || {};

    allRooms.forEach(room => {
        const roomName = room.name;
        const assignedName = window.currentInvigMapping[roomName];
        const serial = serialMap[roomName] || '-';

        const roomInfo = config[room.name] || {};
        const location = roomInfo.location || "";
        const safeRoomName = roomName.replace(/'/g, "\\'");

        const streamBadges = Array.from(room.streams).map(s => {
            let color = "bg-blue-50 text-blue-700 border-blue-100";
            if (s === "Scribe") color = "bg-orange-50 text-orange-700 border-orange-100";
            else if (s !== "Regular") color = "bg-purple-50 text-purple-700 border-purple-100";
            return `<span class="text-[9px] px-1.5 py-0.5 rounded border ${color} font-bold uppercase tracking-wide whitespace-nowrap">${s}</span>`;
        }).join(' ');

        let cardBorder = assignedName ? "border-l-4 border-l-green-500 border-y border-r border-gray-200 bg-white" : "border-l-4 border-l-gray-300 border-y border-r border-gray-200 bg-gray-50/50";
        if (swapSourceRoom === roomName) cardBorder = "border-l-4 border-l-orange-500 border-y border-r border-orange-200 bg-orange-50 ring-2 ring-orange-100";

        // --- SMART NAME DISPLAY ---
        const getNameHtml = (name) => `
        <div class="flex items-center gap-2.5 mb-3 sm:mb-0 bg-green-50/80 p-2 sm:p-0 rounded-lg sm:bg-transparent border sm:border-0 border-green-100 w-full sm:w-auto h-full">
                <div class="bg-green-100 text-green-700 p-1.5 rounded-full shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="text-[10px] text-green-600 uppercase font-bold tracking-wider leading-none mb-0.5 sm:hidden">Invigilator</div>
                    <div class="text-sm font-bold text-gray-800 sm:text-green-800 break-words sm:truncate" title="${name}">${name}</div>
                </div>
        </div>`;

        let actionHtml = "";

        if (swapSourceRoom) {
            // === SWAP MODE ===
            if (swapSourceRoom === roomName) {
                actionHtml = `
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full h-full gap-2">
                    <div class="flex-1">${getNameHtml(assignedName)}</div>
                    <button onclick="window.handleSwapClick('${safeRoomName}')" class="w-full sm:w-auto bg-gray-500 text-white border border-transparent px-4 py-2 rounded text-xs font-bold hover:bg-gray-600 transition shadow-sm h-full">
                        Cancel Swap
                    </button>
                </div>`;
            } else {
                const btnLabel = assignedName ? "Swap Here" : "Move Here";
                const btnColor = assignedName ? "bg-indigo-600 hover:bg-indigo-700" : "bg-green-600 hover:bg-green-700";

                const btnHtml = `
                <button onclick="window.handleSwapClick('${safeRoomName}')" class="w-full h-full ${btnColor} text-white border border-transparent px-4 py-2 rounded text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    ${btnLabel}
                </button>`;

                actionHtml = assignedName ?
                    `<div class="flex flex-col sm:flex-row items-stretch w-full h-full gap-2">
                        <div class="flex-1">${getNameHtml(assignedName)}</div>
                        <div class="sm:w-32">${btnHtml}</div>
                    </div>` : btnHtml;
            }
        } else {
            // === NORMAL MODE ===
            if (assignedName) {
                // STACKED BUTTONS: Grid on Mobile (1 row), Flex-Col on PC (Vertical Stack)
                actionHtml = `
                <div class="flex flex-col sm:flex-row items-stretch w-full h-full gap-3">
                    
                    <!-- Name Area (Middle) -->
                    <div class="flex-1 flex items-center">
                        ${getNameHtml(assignedName)}
                    </div>

                    <!-- Button Stack (Right - Fixed Width on PC) -->
                    <div class="sm:border-l border-gray-100 sm:pl-3 w-full sm:w-28 flex flex-col justify-center">
                        <div class="grid grid-cols-3 sm:flex sm:flex-col gap-1.5 w-full">     
                            <button type="button" onclick="window.openInvigModal('${safeRoomName}')" class="flex-1 sm:flex-none flex items-center justify-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1.5 rounded hover:bg-indigo-100 transition border border-indigo-200" title="Change Staff">
                                Change
                            </button>
                            
                            <button type="button" onclick="window.openReplaceInvigModal('${safeRoomName}')" class="flex-1 sm:flex-none flex items-center justify-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-1.5 rounded hover:bg-teal-100 transition border border-teal-200" title="Replace Staff">
                                Replace
                            </button>
                            
                            ${allRooms.length > 1 ? `
                            <button type="button" onclick="window.handleSwapClick('${safeRoomName}')" class="flex-1 sm:flex-none flex items-center justify-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-1.5 rounded hover:bg-orange-100 transition border border-orange-200" title="Swap">
                                Swap
                            </button>` : ''}
                        </div>
                    </div>
                </div>
            `;
            } else {
                actionHtml = `
                <button type="button" onclick="window.openInvigModal('${safeRoomName}')" class="w-full h-full sm:h-auto mt-2 sm:mt-0 bg-white border-2 border-dashed border-indigo-300 text-indigo-600 px-4 py-3 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:border-indigo-400 transition shadow-sm flex items-center justify-center gap-2 group">
                    <span class="bg-indigo-100 text-indigo-600 rounded-full w-5 h-5 flex items-center justify-center group-hover:bg-indigo-200 transition">+</span>
                    Assign Invigilator
                </button>
            `;
            }
        }

        // PC LAYOUT: 3 Columns [Room Info | Separator | Actions]
        list.innerHTML += `
        <div class="bg-white rounded-xl shadow-sm ${cardBorder} transition-all duration-200 hover:shadow-md mb-3 overflow-hidden">
            <div class="flex flex-col sm:flex-row sm:items-stretch min-h-[85px]">
                
                <!-- LEFT PANEL: Room Info (Fixed 40% on PC) -->
                <div class="p-3 sm:p-4 flex items-start gap-3 sm:w-[40%] min-w-0 border-b sm:border-b-0 sm:border-r border-gray-100">
                    <div class="flex flex-col items-center justify-center w-12 h-12 bg-white text-gray-700 rounded-xl font-bold text-sm border-2 border-gray-100 shadow-sm shrink-0">
                        <span class="text-[9px] text-gray-400 uppercase leading-none mb-0.5 font-bold">Hall</span>
                        <span>${serial}</span>
                    </div>
                    <div class="min-w-0 flex-1 pt-0.5">
                        <div class="font-bold text-gray-800 text-base leading-tight break-words">
                            ${roomName}
                        </div>
                            ${location ? `<div class="text-xs text-gray-500 font-medium mt-0.5 truncate flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>${location}</div>` : ''}
                        
                        <div class="flex flex-wrap items-center gap-2 mt-2">
                            <span class="text-[10px] text-gray-600 font-bold bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 whitespace-nowrap flex items-center gap-1">
                                <span>👥</span> ${room.count}
                            </span>
                            ${streamBadges}
                        </div>
                    </div>
                </div>

                <!-- RIGHT PANEL: Actions (Flex-1) -->
                <div class="p-3 sm:px-4 sm:py-2 flex-1 bg-gray-50/20 sm:bg-white flex flex-col justify-center">
                    ${actionHtml}
                </div>
            </div>
        </div>
    `;
    });
}

// 2. Handle Swap Interaction
export function handleSwapClick(roomName) {
    if (swapSourceRoom === roomName) {
        swapSourceRoom = null;
    } else if (swapSourceRoom) {
        performSwap(swapSourceRoom, roomName);
        return;
    } else {
        swapSourceRoom = roomName;
    }
    renderInvigilationPanel();
}

// 3. Execute Swap Logic
export function performSwap(roomA, roomB) {
    const sessionKey = document.getElementById('allotment-session-select')?.value;
    const invigNameA = window.currentInvigMapping[roomA];
    const invigNameB = window.currentInvigMapping[roomB];

    // Update Mapping
    if (invigNameB) {
        window.currentInvigMapping[roomA] = invigNameB;
    } else {
        delete window.currentInvigMapping[roomA];
    }

    if (invigNameA) {
        window.currentInvigMapping[roomB] = invigNameA;
    } else {
        delete window.currentInvigMapping[roomB];
    }

    // Save & Sync
    const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVIGILATOR_MAPPING) || '{}');
    allMappings[sessionKey] = window.currentInvigMapping;
    localStorage.setItem(STORAGE_KEYS.INVIGILATOR_MAPPING, JSON.stringify(allMappings));

    if (typeof window.syncDataToCloud === 'function') window.syncDataToCloud('staff');

    swapSourceRoom = null;
    renderInvigilationPanel();
}

// 4. Open Modal
export function openInvigModal(roomName) {
    const modal = document.getElementById('invigilator-select-modal');
    const list = document.getElementById('invig-options-list');
    const input = document.getElementById('invig-search-input');
    const sessionKey = document.getElementById('allotment-session-select')?.value;

    if (document.getElementById('invig-modal-subtitle')) {
        document.getElementById('invig-modal-subtitle').textContent = `Assigning to: ${roomName}`;
    }

    input.value = "";
    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 100);

    const invigSlots = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVIGILATION_SLOTS) || '{}');
    const staffData = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF_DATA) || '[]');
    const slot = invigSlots[sessionKey];

    if (!slot || !slot.assigned || slot.assigned.length === 0) {
        list.innerHTML = '<p class="text-xs text-red-500 text-center py-4 bg-red-50 rounded border border-red-100">No staff assigned to this session in Invigilation Portal.</p>';
        return;
    }

    const assignedSet = new Set(Object.values(window.currentInvigMapping));

    const renderList = (filter = "") => {
        let html = "";
        const q = filter.toLowerCase();
        let hasResults = false;

        slot.assigned.forEach(email => {
            const staff = staffData.find(s => s.email === email) || { name: email.split('@')[0], dept: 'Unknown' };

            if (staff.name.toLowerCase().includes(q)) {
                hasResults = true;
                const isTaken = assignedSet.has(staff.name) && window.currentInvigMapping[roomName] !== staff.name;

                const bgClass = isTaken ? "bg-gray-50 opacity-60 cursor-not-allowed" : "hover:bg-indigo-50 cursor-pointer bg-white";
                const status = isTaken
                    ? '<span class="text-[9px] text-red-500 font-bold bg-red-50 px-1 rounded border border-red-100">Busy</span>'
                    : '<span class="text-[9px] text-green-600 font-bold bg-green-50 px-1 rounded border border-green-100">Select</span>';

                const safeRoom = roomName.replace(/'/g, "\\'");
                const safeName = staff.name.replace(/'/g, "\\'");

                const clickAction = isTaken ? "" : `onclick="window.saveInvigAssignment('${safeRoom}', '${safeName}')"`;

                html += `
                <div ${clickAction} class="p-2 rounded border-b border-gray-100 last:border-0 flex justify-between items-center transition ${bgClass}">
                    <div>
                        <div class="text-sm font-bold text-gray-800">${staff.name}</div>
                        <div class="text-[10px] text-gray-500">${staff.dept}</div>
                    </div>
                    ${status}
                </div>
            `;
            }
        });

        if (!hasResults) {
            html = '<p class="text-center text-gray-400 text-xs py-2">No matching invigilators found.</p>';
        }
        list.innerHTML = html;
    };

    renderList();
    input.oninput = (e) => renderList(e.target.value);
}

// 5. Save Assignment
export function saveInvigAssignment(room, name) {
    const sessionKey = document.getElementById('allotment-session-select')?.value;
    if (!sessionKey) return;

    window.currentInvigMapping[room] = name;

    const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVIGILATOR_MAPPING) || '{}');
    allMappings[sessionKey] = window.currentInvigMapping;
    localStorage.setItem(STORAGE_KEYS.INVIGILATOR_MAPPING, JSON.stringify(allMappings));

    if (typeof window.syncDataToCloud === 'function') window.syncDataToCloud('staff');

    document.getElementById('invigilator-select-modal').classList.add('hidden');
    renderInvigilationPanel();
}

// 6. Auto-Assign
export function autoAssignInvigilators() {
    const sessionKey = document.getElementById('allotment-session-select')?.value;
    if (!sessionKey) return;

    const invigSlots = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVIGILATION_SLOTS) || '{}');
    const staffData = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF_DATA) || '[]');
    const slot = invigSlots[sessionKey];

    if (!slot || !slot.assigned) return alert("No staff available in portal.");

    const availableStaff = [...slot.assigned];
    const usedNames = new Set(Object.values(window.currentInvigMapping));

    let changeCount = 0;

    const allRoomNames = new Set();
    if (window.currentSessionAllotment) window.currentSessionAllotment.forEach(r => allRoomNames.add(r.roomName));
    const allScribeAllotments = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCRIBE_ALLOTMENT) || '{}');
    const sessionScribeMap = allScribeAllotments[sessionKey] || {};
    Object.values(sessionScribeMap).forEach(r => allRoomNames.add(r));

    const serialMap = (typeof window.getRoomSerialMap === 'function') ? window.getRoomSerialMap(sessionKey) : {};
    const sortedRooms = Array.from(allRoomNames).sort((a, b) => (serialMap[a] || 999) - (serialMap[b] || 999));

    sortedRooms.forEach(roomName => {
        if (!window.currentInvigMapping[roomName]) {
            const freeEmail = availableStaff.find(e => {
                const name = (staffData.find(s => s.email === e) || {}).name || e;
                return !usedNames.has(name);
            });

            if (freeEmail) {
                const name = (staffData.find(s => s.email === freeEmail) || {}).name || freeEmail;
                window.currentInvigMapping[roomName] = name;
                usedNames.add(name);
                changeCount++;
            }
        }
    });

    if (changeCount > 0) {
        const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVIGILATOR_MAPPING) || '{}');
        allMappings[sessionKey] = window.currentInvigMapping;
        localStorage.setItem(STORAGE_KEYS.INVIGILATOR_MAPPING, JSON.stringify(allMappings));
        if (typeof window.syncDataToCloud === 'function') window.syncDataToCloud('staff');
        renderInvigilationPanel();
        alert(`Auto-assigned ${changeCount} invigilators.`);
    } else {
        alert("No additional free staff found to assign.");
    }
}

// 7. Unassign All
export function unassignAllInvigilators() {
    const sessionKey = document.getElementById('allotment-session-select')?.value;
    if (!sessionKey) return;

    const currentCount = Object.keys(window.currentInvigMapping).length;
    if (currentCount === 0) return alert("No invigilators assigned to clear.");

    if (confirm(`Are you sure you want to REMOVE ALL ${currentCount} invigilator assignments for this session?\n\nThis action cannot be undone.`)) {
        window.currentInvigMapping = {};

        const allMappings = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVIGILATOR_MAPPING) || '{}');
        allMappings[sessionKey] = window.currentInvigMapping;
        localStorage.setItem(STORAGE_KEYS.INVIGILATOR_MAPPING, JSON.stringify(allMappings));

        if (typeof window.syncDataToCloud === 'function') window.syncDataToCloud('staff');

        renderInvigilationPanel();
        alert("All invigilator assignments cleared for this session.");
    }
}

// 8. Open Replace Modal
export function openReplaceInvigModal(roomName) {
    const modal = document.getElementById('invigilator-select-modal');
    const list = document.getElementById('invig-options-list');
    const input = document.getElementById('invig-search-input');
    const subtitle = document.getElementById('invig-modal-subtitle');

    if (subtitle) {
        subtitle.textContent = `Global Replace for: ${roomName}`;
        subtitle.classList.add('text-teal-600');
    }

    input.value = "";
    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 100);

    const staffData = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF_DATA) || '[]');
    const assignedSet = new Set(Object.values(window.currentInvigMapping));

    const renderList = (filter = "") => {
        let html = "";
        const q = filter.toLowerCase();
        let hasResults = false;

        staffData.sort((a, b) => a.name.localeCompare(b.name));

        staffData.forEach(staff => {
            if (window.currentInvigMapping[roomName] === staff.name) return; // Skip self

            if (staff.name.toLowerCase().includes(q)) {
                hasResults = true;
                const isTaken = assignedSet.has(staff.name);

                let statusBadge = "";
                let rowClass = "bg-white";

                if (isTaken) {
                    statusBadge = '<span class="text-[9px] text-red-500 font-bold bg-red-50 px-1 rounded border border-red-100">Busy</span>';
                    rowClass = "bg-gray-50 opacity-75";
                } else {
                    statusBadge = '<span class="text-[9px] text-teal-600 font-bold bg-teal-50 px-1 rounded border border-teal-100">Global</span>';
                }

                const clickAction = `onclick="window.replaceInvigilator('${roomName.replace(/'/g, "\\'")}', '${staff.name.replace(/'/g, "\\'")}')"`;

                html += `
                <div ${clickAction} class="p-2 rounded border-b border-gray-100 flex justify-between items-center transition ${rowClass} cursor-pointer hover:bg-teal-50">
                    <div>
                        <div class="text-sm font-bold text-gray-800">${staff.name}</div>
                        <div class="text-[10px] text-gray-500">${staff.dept || ""}</div>
                    </div>
                    ${statusBadge}
                </div>`;
            }
        });
        list.innerHTML = hasResults ? html : '<p class="text-center text-gray-400 text-xs py-2">No staff found.</p>';
    };
    renderList();
    input.oninput = (e) => renderList(e.target.value);
}

// 9. Replace Invigilator
export function replaceInvigilator(room, name) {
    if (!confirm(`Confirm replace with ${name}?`)) return;
    saveInvigAssignment(room, name);

    const subtitle = document.getElementById('invig-modal-subtitle');
    if (subtitle) {
        subtitle.classList.remove('text-orange-600');
        subtitle.textContent = "";
    }
}
