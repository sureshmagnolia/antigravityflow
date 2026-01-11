// ==========================================
// 🌉 LEGACY BRIDGE
// Connects modern ES6 Modules to the Global Scope for HTML compatibility
// ==========================================

import { STORAGE_KEYS, BACKUP_KEYS, APP_INFO } from './core/constants.js';
import { compareSessionStrings, debounce, parseDateString } from './utils/date-utils.js';
import { downloadInvigilationListPDF } from './features/pdf-generator.js';
import {
    renderInvigilationPanel, handleSwapClick, performSwap,
    openInvigModal, saveInvigAssignment, autoAssignInvigilators,
    unassignAllInvigilators, openReplaceInvigModal, replaceInvigilator
} from './features/invigilation-panel.js';
import {
    renderRoomAllotment, populate_room_allotment_session_dropdown,
    saveRoomAllotment, autoAllotRooms, clearAllotmentForSession,
    downloadAllotmentCSV, printRoomAllotment, viewRoomAllotmentStatus,
    openManualAllocationModal, closeManualAllocationModal,
    saveManualAllocation, deleteManualAllocation, allocateOneRoom
} from './features/room-allotment.js';

console.log(`🌉 Legacy Bridge Initializing - ${APP_INFO.VERSION}`);

// 1. Expose Constants
window.STORAGE_KEYS = STORAGE_KEYS;
window.BACKUP_KEYS = BACKUP_KEYS;
window.APP_INFO = APP_INFO;

// 2. Expose Utilities
window.compareSessionStrings = compareSessionStrings;
window.debounce = debounce;
window.parseDateString = parseDateString;

// 3. Expose Features
window.downloadInvigilationListPDF = downloadInvigilationListPDF;

// Room Allotment Panel exposure
window.renderInvigilationPanel = renderInvigilationPanel;
window.handleSwapClick = handleSwapClick;
window.performSwap = performSwap;
window.openInvigModal = openInvigModal;
window.saveInvigAssignment = saveInvigAssignment;
window.autoAssignInvigilators = autoAssignInvigilators;
window.unassignAllInvigilators = unassignAllInvigilators;
window.openReplaceInvigModal = openReplaceInvigModal;
window.replaceInvigilator = replaceInvigilator;

// Room Allotment exposure
window.renderRoomAllotment = renderRoomAllotment;
window.populate_room_allotment_session_dropdown = populate_room_allotment_session_dropdown;
window.saveRoomAllotment = saveRoomAllotment;
window.autoAllotRooms = autoAllotRooms;
window.clearAllotmentForSession = clearAllotmentForSession;
window.downloadAllotmentCSV = downloadAllotmentCSV;
window.printRoomAllotment = printRoomAllotment;
window.viewRoomAllotmentStatus = viewRoomAllotmentStatus;
window.openManualAllocationModal = openManualAllocationModal;
window.closeManualAllocationModal = closeManualAllocationModal;
window.saveManualAllocation = saveManualAllocation;
window.deleteManualAllocation = deleteManualAllocation;
window.allocateOneRoom = allocateOneRoom;

console.log("✅ Legacy Bridge Active: Globals injected.");
