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
} from './features/invigilation-panel.js'; // <--- NEW IMPORTS

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

console.log("✅ Legacy Bridge Active: Globals injected.");
