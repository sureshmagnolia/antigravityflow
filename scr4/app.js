// --- FUNCTIONS FOR PYTHON BRIDGE ---
// These 11 functions MUST be outside the DOMContentLoaded listener
// to be available when Python loads.

function clear_csv_upload_status() {
    const csvLoadStatusElement = document.getElementById('csv-load-status');
    const correctedCsvUploadElement = document.getElementById('corrected-csv-upload');
    
    if (csvLoadStatusElement) {
        csvLoadStatusElement.textContent = "";
    }
    if (correctedCsvUploadElement) {
        correctedCsvUploadElement.value = "";
    }
}
window.clear_csv_upload_status = clear_csv_upload_status;

function disable_absentee_tab(disabled) {
    const navAbsentees = document.getElementById('nav-absentees');
    const absenteeLoader = document.getElementById('absentee-loader');
    const absenteeContentWrapper = document.getElementById('absentee-content-wrapper');

    if (!navAbsentees) return; // Guard clause in case elements aren't ready

    navAbsentees.disabled = disabled;
    if (disabled) {
        absenteeLoader?.classList.remove('hidden');
        absenteeContentWrapper?.classList.add('hidden');
        navAbsentees.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        absenteeLoader?.classList.add('hidden');
        absenteeContentWrapper?.classList.remove('hidden');
        navAbsentees.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}
window.disable_absentee_tab = disable_absentee_tab;

function populate_session_dropdown() {
    // This function's body is complex and relies on DOM elements.
    // It will be called *after* extraction, so the elements *should* exist.
    // We will define its full logic inside the DOMContentLoaded.
    // This top-level function will just call the *real* one.
    if (window.real_populate_session_dropdown) {
        window.real_populate_session_dropdown();
    }
}
window.populate_session_dropdown = populate_session_dropdown;

function disable_qpcode_tab(disabled) {
    const navQPCodes = document.getElementById('nav-qpcodes');
    const qpcodeLoader = document.getElementById('qpcode-loader');
    const qpcodeContentWrapper = document.getElementById('qpcode-content-wrapper');

    if (!navQPCodes) return;

    navQPCodes.disabled = disabled;
    if (disabled) {
        qpcodeLoader?.classList.remove('hidden');
        qpcodeContentWrapper?.classList.add('hidden');
        navQPCodes.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        qpcodeLoader?.classList.add('hidden');
        qpcodeContentWrapper?.classList.remove('hidden');
        navQPCodes.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}
window.disable_qpcode_tab = disable_qpcode_tab;

function populate_qp_code_session_dropdown() {
    if (window.real_populate_qp_code_session_dropdown) {
        window.real_populate_qp_code_session_dropdown();
    }
}
window.populate_qp_code_session_dropdown = populate_qp_code_session_dropdown;

function disable_room_allotment_tab(disabled) {
    const navRoomAllotment = document.getElementById('nav-room-allotment');
    const roomAllotmentLoader = document.getElementById('room-allotment-loader');
    const roomAllotmentContentWrapper = document.getElementById('room-allotment-content-wrapper');
    
    if (!navRoomAllotment) return;

    navRoomAllotment.disabled = disabled;
    if (disabled) {
        roomAllotmentLoader?.classList.remove('hidden');
        roomAllotmentContentWrapper?.classList.add('hidden');
        navRoomAllotment.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        roomAllotmentLoader?.classList.add('hidden');
        roomAllotmentContentWrapper?.classList.remove('hidden');
        navRoomAllotment.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}
window.disable_room_allotment_tab = disable_room_allotment_tab;

function populate_room_allotment_session_dropdown() {
    if (window.real_populate_room_allotment_session_dropdown) {
        window.real_populate_room_allotment_session_dropdown();
    }
}
window.populate_room_allotment_session_dropdown = populate_room_allotment_session_dropdown;

function disable_scribe_settings_tab(disabled) {
    const navScribeSettings = document.getElementById('nav-scribe-settings');
    const scribeLoader = document.getElementById('scribe-loader');
    const scribeContentWrapper = document.getElementById('scribe-content-wrapper');
    
    if (!navScribeSettings) return;

    navScribeSettings.disabled = disabled;
    if (disabled) {
        scribeLoader?.classList.remove('hidden');
        scribeContentWrapper?.classList.add('hidden');
        navScribeSettings.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        scribeLoader?.classList.add('hidden');
        scribeContentWrapper?.classList.remove('hidden');
        navScribeSettings.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}
window.disable_scribe_settings_tab = disable_scribe_settings_tab;

function loadGlobalScribeList() {
    if (window.real_loadGlobalScribeList) {
        window.real_loadGlobalScribeList();
    }
}
window.loadGlobalScribeList = loadGlobalScribeList;

function disable_all_report_buttons(disabled) {
    if (window.real_disable_all_report_buttons) {
        window.real_disable_all_report_buttons(disabled);
    }
}
window.disable_all_report_buttons = disable_all_report_buttons;

function disable_edit_data_tab(disabled) {
    const navEditData = document.getElementById('nav-edit-data');
    const editDataLoader = document.getElementById('edit-data-loader');
    const editDataContentWrapper = document.getElementById('edit-data-content-wrapper');
    
    if (!navEditData) return;
    
    navEditData.disabled = disabled;
    if (disabled) {
        editDataLoader?.classList.remove('hidden');
        editDataContentWrapper?.classList.add('hidden');
        navEditData.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        editDataLoader?.classList.add('hidden');
        editDataContentWrapper?.classList.remove('hidden');
        navEditData.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}
window.disable_edit_data_tab = disable_edit_data_tab;

// --- END FUNCTIONS FOR PYTHON BRIDGE ---


// --- MAIN APP LOGIC ---
document.addEventListener('DOMContentLoaded', () => {

// --- Debounce Helper Function ---
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// --- Global localStorage Key ---
const ROOM_CONFIG_KEY = 'examRoomConfig';
const COLLEGE_NAME_KEY = 'examCollegeName';
const ABSENTEE_LIST_KEY = 'examAbsenteeList';
const QP_CODE_LIST_KEY = 'examQPCodes';
const BASE_DATA_KEY = 'examBaseData';
const ROOM_ALLOTMENT_KEY = 'examRoomAllotment';
// *** NEW SCRIBE KEYS ***
const SCRIBE_LIST_KEY = 'examScribeList';
const SCRIBE_ALLOTMENT_KEY = 'examScribeAllotment';
// ***********************
// *** NEW: All keys for backup/restore ***
const ALL_DATA_KEYS = [
    ROOM_CONFIG_KEY,
    COLLEGE_NAME_KEY,
    ABSENTEE_LIST_KEY,
    QP_CODE_LIST_KEY,
    BASE_DATA_KEY,
    ROOM_ALLOTMENT_KEY,
    SCRIBE_LIST_KEY,
    SCRIBE_ALLOTMENT_KEY
];
// **********************************
// --- Global var to hold data from the last *report run* ---
let lastGeneratedRoomData = [];
let lastGeneratedReportType = "";

// --- (V28) Global var to hold room config map for report generation ---
let currentRoomConfig = {};

// --- (V48) Global var for college name ---
let currentCollegeName = "University of Calicut";

// --- (V56) Global var for absentee data ---
let allStudentData = []; // Holds all students from PDF/CSV
let allStudentSessions = []; // Holds unique sessions
let currentAbsenteeList = [];
let selectedStudent = null;

// --- (V58) Global var for QP Code data ---
let qpCodeMap = {}; 

// --- Room Allotment Data ---
let currentSessionAllotment = [];
let currentSessionKey = '';

// *** NEW SCRIBE GLOBALS ***
let globalScribeList = []; // Array of { regNo: "...", name: "..." }
let currentScribeAllotment = {}; // For the selected session, { regNo: "RoomName" }
let studentToAllotScribeRoom = null; // Holds regNo of student being allotted
let allUniqueStudentsForScribeSearch = []; // <-- ADDED: For fast scribe search
// **************************


// --- Get references to all Report elements ---
const generateReportButton = document.getElementById('generate-report-button');
const jsonDataStore = document.getElementById('json-data-store');
const reportControls = document.getElementById('report-controls');
const reportOutputArea = document.getElementById('report-output-area');
const reportStatus = document.getElementById('report-status');
const finalPrintButton = document.getElementById('final-print-button');
const clearReportButton = document.getElementById('clear-report-button');
const roomCsvDownloadContainer = document.getElementById('room-csv-download-container');
const statusLogDiv = document.getElementById('status-log');
// --- Get references to all Navigation elements ---
const viewExtractor = document.getElementById('view-extractor');
const viewSettings = document.getElementById('view-settings');
const viewQPCodes = document.getElementById('view-qpcodes');
const viewReports = document.getElementById('view-reports');
const viewAbsentees = document.getElementById('view-absentees');
const navExtractor = document.getElementById('nav-extractor');
const navEditData = document.getElementById('nav-edit-data'); // <-- ADD THIS
const navSettings = document.getElementById('nav-settings');
const navQPCodes = document.getElementById('nav-qpcodes');
const navReports = document.getElementById('nav-reports');
const navAbsentees = document.getElementById('nav-absentees');
const navScribeSettings = document.getElementById('nav-scribe-settings');
const navRoomAllotment = document.getElementById('nav-room-allotment');
const viewRoomAllotment = document.getElementById('view-room-allotment');
const viewScribeSettings = document.getElementById('view-scribe-settings');

// *** NEW SEARCH ELEMENTS ***
const navSearch = document.getElementById('nav-search');
const viewSearch = document.getElementById('view-search');
const searchSessionSelect = document.getElementById('search-session-select');
const studentSearchSection = document.getElementById('student-search-section');
const studentSearchInput = document.getElementById('student-search-input');
const studentSearchAutocomplete = document.getElementById('student-search-autocomplete');
const studentSearchStatus = document.getElementById('student-search-status');

// Search Result Modal Elements
const searchResultModal = document.getElementById('student-search-result-modal');
const searchResultName = document.getElementById('search-result-name');
const searchResultRegNo = document.getElementById('search-result-regno');
const searchResultCourse = document.getElementById('search-result-course');
const searchResultQPCode = document.getElementById('search-result-qpcode');
const searchResultRoom = document.getElementById('search-result-room');
const searchResultSeat = document.getElementById('search-result-seat');
const searchResultScribeBlock = document.getElementById('search-result-scribe-block');
const searchResultScribeRoom = document.getElementById('search-result-scribe-room');
const searchResultRoomLocationBlock = document.getElementById('search-result-room-location-block');
const searchResultRoomLocation = document.getElementById('search-result-room-location');
const searchResultScribeLocationBlock = document.getElementById('search-result-scribe-location-block');
const searchResultScribeRoomLocation = document.getElementById('search-result-scribe-room-location');
const modalCloseSearchResult = document.getElementById('modal-close-search-result');
// ***************************

const viewEditData = document.getElementById('view-edit-data');
const allNavButtons = [navExtractor, navEditData, navScribeSettings, navRoomAllotment, navQPCodes, navSearch, navReports, navAbsentees, navSettings];
const allViews = [viewExtractor, viewEditData, viewScribeSettings, viewRoomAllotment, viewQPCodes, viewSearch, viewReports, viewAbsentees, viewSettings];

// --- (V26) Get references to NEW Room Settings elements (Now in Settings Tab) ---
const collegeNameInput = document.getElementById('college-name-input');
const saveCollegeNameButton = document.getElementById('save-college-name-button'); 
const collegeNameStatus = document.getElementById('college-name-status');
const roomConfigContainer = document.getElementById('room-config-container');
const addRoomButton = document.getElementById('add-room-button');
const saveRoomConfigButton = document.getElementById('save-room-config-button');
const roomConfigStatus = document.getElementById('room-config-status');

// --- Get references to Q-Paper Report elements ---
const qPaperDataStore = document.getElementById('q-paper-data-store');
const generateQPaperReportButton = document.getElementById('generate-qpaper-report-button');
const generateQpDistributionReportButton = document.getElementById('generate-qp-distribution-report-button');
const generateScribeReportButton = document.getElementById('generate-scribe-report-button');
const generateScribeProformaButton = document.getElementById('generate-scribe-proforma-button');
const generateInvigilatorReportButton = document.getElementById('generate-invigilator-report-button');
const generateDaywiseReportButton = document.getElementById('generate-daywise-report-button');

// --- Get references to CSV Upload elements ---
const correctedCsvUpload = document.getElementById('corrected-csv-upload');
const loadCsvButton = document.getElementById('load-csv-button');
const csvLoadStatus = document.getElementById('csv-load-status');

// --- (V56) Get references to Absentee elements ---
const absenteeLoader = document.getElementById('absentee-loader');
const absenteeContentWrapper = document.getElementById('absentee-content-wrapper');
const sessionSelect = document.getElementById('session-select');
const absenteeSearchSection = document.getElementById('absentee-search-section');
const absenteeSearchInput = document.getElementById('absentee-search');
const autocompleteResults = document.getElementById('autocomplete-results');
const selectedStudentDetails = document.getElementById('selected-student-details');
const selectedStudentName = document.getElementById('selected-student-name');
const selectedStudentCourse = document.getElementById('selected-student-course');
const selectedStudentRoom = document.getElementById('selected-student-room');
const addAbsenteeButton = document.getElementById('add-absentee-button');
const absenteeListSection = document.getElementById('absentee-list-section');
const currentAbsenteeListDiv = document.getElementById('current-absentee-list');
const generateAbsenteeReportButton = document.getElementById('generate-absentee-report-button');

// --- (V58) Get references to QP Code elements ---
const qpcodeLoader = document.getElementById('qpcode-loader');
const qpcodeContentWrapper = document.getElementById('qpcode-content-wrapper');
const sessionSelectQP = document.getElementById('session-select-qp');
const qpEntrySection = document.getElementById('qp-entry-section');
const qpCodeContainer = document.getElementById('qp-code-container');
const qpCodeStatus = document.getElementById('qp-code-status');
const saveQpCodesButton = document.getElementById('save-qp-codes-button');

// --- V68 Report Filter Elements ---
const reportFilterSection = document.getElementById('report-filter-section');
const filterAllRadio = document.getElementById('filter-all');
const filterSessionRadio = document.getElementById('filter-session');
const reportsSessionDropdownContainer = document.getElementById('reports-session-dropdown-container');
const reportsSessionSelect = document.getElementById('reports-session-select');

// --- Room Allotment Elements ---
const roomAllotmentLoader = document.getElementById('room-allotment-loader');
const roomAllotmentContentWrapper = document.getElementById('room-allotment-content-wrapper');
const allotmentSessionSelect = document.getElementById('allotment-session-select');
const allotmentStudentCountSection = document.getElementById('allotment-student-count-section');
const totalStudentsCount = document.getElementById('total-students-count');
const remainingStudentsCount = document.getElementById('remaining-students-count');
const allottedStudentsCount = document.getElementById('allotted-students-count');
const addRoomSection = document.getElementById('add-room-section');
const addRoomAllotmentButton = document.getElementById('add-room-allotment-button');
const roomSelectionModal = document.getElementById('room-selection-modal');
const roomSelectionList = document.getElementById('room-selection-list');
const closeRoomModal = document.getElementById('close-room-modal');
const allottedRoomsSection = document.getElementById('allotted-rooms-section');
const allottedRoomsList = document.getElementById('allotted-rooms-list');
const saveAllotmentSection = document.getElementById('save-allotment-section');
const saveRoomAllotmentButton = document.getElementById('save-room-allotment-button');
const roomAllotmentStatus = document.getElementById('room-allotment-status');

// *** NEW SCRIBE SETTINGS ELEMENTS ***
const scribeLoader = document.getElementById('scribe-loader');
const scribeContentWrapper = document.getElementById('scribe-content-wrapper');
const scribeSearchInput = document.getElementById('scribe-search');
const scribeAutocompleteResults = document.getElementById('scribe-autocomplete-results');
const scribeSelectedStudentDetails = document.getElementById('scribe-selected-student-details');
const scribeSelectedStudentName = document.getElementById('scribe-selected-student-name');
const scribeSelectedStudentRegno = document.getElementById('scribe-selected-student-regno');
const addScribeStudentButton = document.getElementById('add-scribe-student-button');
const currentScribeListDiv = document.getElementById('current-scribe-list');
// ************************************

// *** MODIFIED: SCRIBE ALLOTMENT ELEMENTS (Now part of Room Allotment view) ***
const scribeAllotmentListSection = document.getElementById('scribe-allotment-list-section');
const scribeAllotmentList = document.getElementById('scribe-allotment-list');
const scribeRoomModal = document.getElementById('scribe-room-modal');
const scribeRoomModalTitle = document.getElementById('scribe-room-modal-title');
const scribeRoomSelectionList = document.getElementById('scribe-room-selection-list');
const scribeCloseRoomModal = document.getElementById('scribe-close-room-modal');
// *************************************
// *** NEW RESET BUTTONS ***
const resetStudentDataButton = document.getElementById('reset-student-data-button');
const masterResetButton = document.getElementById('master-reset-button');
// *************************
// *** NEW EDIT DATA ELEMENTS ***
const editDataContentWrapper = document.getElementById('edit-data-content-wrapper');
const editDataLoader = document.getElementById('edit-data-loader');
const editSessionSelect = document.getElementById('edit-session-select');
const editCourseSelectContainer = document.getElementById('edit-course-select-container');
const editCourseSelect = document.getElementById('edit-course-select');
const editDataContainer = document.getElementById('edit-data-container');
const editPaginationControls = document.getElementById('edit-pagination-controls');
const editPrevPage = document.getElementById('edit-prev-page');
const editNextPage = document.getElementById('edit-next-page');
const editPageInfo = document.getElementById('edit-page-info');
const editSaveSection = document.getElementById('edit-save-section');
const saveEditDataButton = document.getElementById('save-edit-data-button');
const editDataStatus = document.getElementById('edit-data-status');
// ****************************

// *** NEW BACKUP/RESTORE BUTTONS ***
const backupDataButton = document.getElementById('backup-data-button');
const restoreFileInput = document.getElementById('restore-file-input');
const restoreDataButton = document.getElementById('restore-data-button');
const restoreStatus = document.getElementById('restore-status');
// *********************************
// --- NEW: Sidebar Toggle Logic ---
const toggleButton = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('main-nav');

if (toggleButton && sidebar) {
    toggleButton.addEventListener('click', () => {
        // Toggle sidebar width
        sidebar.classList.toggle('w-64'); // Full width
        sidebar.classList.toggle('w-20'); // Collapsed width

        // Toggle padding
        sidebar.classList.toggle('p-4');
        sidebar.classList.toggle('p-2'); // Use smaller padding when collapsed

        // Toggle visibility of all text spans inside the nav buttons
        sidebar.querySelectorAll('.nav-button span').forEach(span => {
            span.classList.toggle('hidden');
        });

        // Toggle centering for the icons
        sidebar.querySelectorAll('.nav-button').forEach(button => {
            button.classList.toggle('justify-center');
        });
    });
}
// --- END: Sidebar Toggle Logic ---
// *** NEW: Universal Base64 key generator ***
function getBase64CourseKey(courseName) {
    try {
        // This creates a stable Base64 key from the full course name
        return btoa(unescape(encodeURIComponent(courseName)));
    } catch (e) {
        console.warn("Could not create Base64 key for:", courseName, e);
        return null; // Return null on failure
    }
}
      
// --- Helper function to numerically sort room keys ---
function getNumericSortKey(key) {
    const parts = key.split('_'); // Date_Time_Room 1
    const roomPart = parts[2] || "Room 0";
    const roomNumber = parseInt(roomPart.replace('Room ', ''), 10);
    return `${parts[0]}_${parts[1]}_${String(roomNumber).padStart(4, '0')}`;
}

// --- (V28) Helper function to create a new room row HTML (with location) ---
function createRoomRowHtml(roomName, capacity, location, isLast = false) {
    const removeButtonHtml = isLast ? 
        `<button class="remove-room-button ml-auto text-sm text-red-600 hover:text-red-800 font-medium">&times; Remove</button>` : 
        `<div class="w-[84px]"></div>`; // Placeholder for alignment
    
    return `
        <div class="room-row flex items-center gap-3 p-2 border-b border-gray-200" data-room-name="${roomName}">
            <label class="room-name-label font-medium text-gray-700 w-24 shrink-0">${roomName}:</label>
            <input type="number" class="room-capacity-input block w-20 p-2 border border-gray-300 rounded-md shadow-sm text-sm" value="${capacity}" min="1" placeholder="30">
            <input type="text" class="room-location-input block flex-grow p-2 border border-gray-300 rounded-md shadow-sm text-sm" value="${location}" placeholder="e.g., Commerce Block">
            ${removeButtonHtml}
        </div>
    `;
}

// --- (V69) FIX: Robust Room Config Loading (handles NULL) ---
function getRoomCapacitiesFromStorage() {
    // V48: Load College Name (Read, but do not update UI here)
    currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
    
    // Load Room Config
    let savedConfigJson = localStorage.getItem(ROOM_CONFIG_KEY);
    let roomConfig = {}; // V69: Initialize to empty object to prevent crash
    
    if (savedConfigJson) {
        try {
            roomConfig = JSON.parse(savedConfigJson);
        } catch (e) {
            console.error("Error parsing room config from localStorage:", e);
            // roomConfig already {}
        }
    }
    
    // (V28) Store in global var for report generation
    currentRoomConfig = roomConfig; 
    
    let roomNames = [];
    let roomCapacities = [];
    
    if (Object.keys(roomConfig).length === 0) {
        // *** (V27): Default to 30 rooms ***
        console.log("Using default room config (30 rooms of 30)");
        let config = {}; // <-- Fix: was missing 'let'
        for (let i = 1; i <= 30; i++) {
            config[`Room ${i}`] = { capacity: 30, location: "" };
        }
        localStorage.setItem(ROOM_CONFIG_KEY, JSON.stringify(config));
        currentRoomConfig = config; // Update global var
    } else {
        console.log("Using saved room config:", roomConfig);
        const sortedRoomKeys = Object.keys(roomConfig).sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });
        roomNames = sortedRoomKeys;
        // (V28) Get capacity from the new object structure
        roomCapacities = sortedRoomKeys.map(key => roomConfig[key].capacity);
    }
    return { roomNames, roomCapacities };
}

// --- *** NEW CENTRAL ALLOCATION FUNCTION *** ---
// This function performs the *original* (non-scribe) allotment and assigns
// a definitive seat number to every student.
function performOriginalAllocation(data) {
    // 1. Get CURRENT room capacities
    const { roomNames: masterRoomNames, roomCapacities: masterRoomCaps } = getRoomCapacitiesFromStorage();
    
    // 2. Get manual room allotments
    const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');

    // 3. Get Scribe List
    const scribeRegNos = new Set( (JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]')).map(s => s.regNo) );
    
    // 4. Pre-process data to populate sessionRoomFills with MANUAL allotments
    //    This is the FIX for the 50-in-30 bug.
    const sessionRoomFills = {}; // Tracks { "Room 1": 0, "Room 2": 0 }
    const processed_data_with_manual = []; // Will hold data with manual rooms pre-assigned

    for (const row of data) {
        const sessionKey = `${row.Date}_${row.Time}`;
        const sessionKeyPipe = `${row.Date} | ${row.Time}`;
        let assignedRoomName = ""; // Start blank

        // Find manual allotment
        const manualAllotment = allAllotments[sessionKeyPipe];
        if (manualAllotment && manualAllotment.length > 0) {
            for (const room of manualAllotment) {
                if (room.students.includes(row['Register Number'])) {
                    assignedRoomName = room.roomName;
                    break;
                }
            }
        }

        // If manually assigned, increment the fill count for that room
        if (assignedRoomName !== "") {
            if (!sessionRoomFills[sessionKey]) {
                sessionRoomFills[sessionKey] = new Array(masterRoomCaps.length).fill(0);
            }
            
            const roomIndex = masterRoomNames.indexOf(assignedRoomName);
            if (roomIndex !== -1) {
                // Increment the count. This respects manual allotment.
                sessionRoomFills[sessionKey][roomIndex]++; 
            }
        }
        
        processed_data_with_manual.push({ ...row, assignedRoomName }); // Store intermediate result
    }

    // 5. Perform FINAL allocation (automatic for remaining)
    const processed_rows_with_rooms = [];
    const sessionRoomStudentCount = {}; // Tracks seat numbers
    const DEFAULT_OVERFLOW_CAPACITY = 30;

    for (const row_data of processed_data_with_manual) {
        const sessionKey = `${row_data.Date}_${row_data.Time}`;
        let assignedRoomName = row_data.assignedRoomName; // Get pre-assigned room
        const isScribe = scribeRegNos.has(row_data['Register Number']);

        // If no manual room, run automatic allocation
        const sessionKeyPipe = `${row_data.Date} | ${row_data.Time}`;
        const sessionManualAllotment = allAllotments[sessionKeyPipe];
        if (assignedRoomName === "") {
            if (assignedRoomName === "" && (!sessionManualAllotment || sessionManualAllotment.length === 0)) {
                sessionRoomFills[sessionKey] = new Array(masterRoomCaps.length).fill(0);
            }
            
            const currentFills = sessionRoomFills[sessionKey];
            
            // Try to fill configured rooms
            for (let i = 0; i < masterRoomCaps.length; i++) {
                if (currentFills[i] < masterRoomCaps[i]) {
                    assignedRoomName = masterRoomNames[i];
                    currentFills[i]++;
                    break;
                }
            }
            
            // If all configured rooms are full, create overflow
            if (assignedRoomName === "") {
                let foundOverflowSpot = false;
                for (let i = masterRoomCaps.length; i < currentFills.length; i++) {
                    if (currentFills[i] < DEFAULT_OVERFLOW_CAPACITY) {
                        assignedRoomName = `Room ${i + 1}`;
                        currentFills[i]++;
                        foundOverflowSpot = true;
                        break;
                    }
                }
                
                // If no existing overflow has space, create a *new* overflow
                if (!foundOverflowSpot) {
                    assignedRoomName = `Room ${currentFills.length + 1}`;
                    currentFills.push(1); 
                }
            }
        }
        
        // 5d. Assign the *original* seat number
        const roomSessionKey = `${sessionKey}_${assignedRoomName}`;
        if (!sessionRoomStudentCount[roomSessionKey]) {
            sessionRoomStudentCount[roomSessionKey] = 0;
        }
        sessionRoomStudentCount[roomSessionKey]++;
        const seatNumber = sessionRoomStudentCount[roomSessionKey];

        processed_rows_with_rooms.push({ 
            ...row_data, 
            'Room No': assignedRoomName,
            'seatNumber': seatNumber, 
            'isScribe': isScribe 
        });
    }
    return processed_rows_with_rooms;
}

// --- NEW: Helper to generate Room Serial Numbers (1, 2, 3...) ---
function getRoomSerialMap(sessionKey) {
    const serialMap = {};
    let counter = 1;

    // 1. Regular Allotment (Respects order in the array "Top to Bottom")
    const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
    const regularRooms = allAllotments[sessionKey] || [];

    regularRooms.forEach(roomObj => {
        // Only assign if not already assigned (handles duplicates if any)
        if (!serialMap[roomObj.roomName]) { 
            serialMap[roomObj.roomName] = counter++;
        }
    });

    // 2. Scribe Allotment (Continue numbering)
    const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
    const scribeMap = allScribeAllotments[sessionKey] || {};
    
    // Collect unique scribe rooms
    const uniqueScribeRooms = new Set(Object.values(scribeMap));
    
    // Remove rooms that were already counted in Regular Allotment
    // (e.g., if a Scribe is placed in a Regular Room, it keeps the Regular serial number)
    regularRooms.forEach(r => uniqueScribeRooms.delete(r.roomName));

    // Sort remaining Scribe Rooms numerically/alphabetically
    const sortedScribeRooms = Array.from(uniqueScribeRooms).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
    });

    // Assign serial numbers to Scribe Rooms
    sortedScribeRooms.forEach(roomName => {
        serialMap[roomName] = counter++;
    });

    return serialMap;
}
    
// V68: Helper function to filter data based on selected report filter
function getFilteredReportData(reportType) {
    const data = JSON.parse(jsonDataStore.innerHTML || '[]');
    if (data.length === 0) return [];
    
    if (filterAllRadio.checked) {
        // Return all data
        return data;
    } else if (filterSessionRadio.checked) {
        const sessionKey = reportsSessionSelect.value;
        if (!sessionKey || sessionKey === 'all') { // Fallback if somehow 'all' is selected here
            return data; 
        }
        const [date, time] = sessionKey.split(' | ');
        
        // Filter by selected session
        return data.filter(s => s.Date === date && s.Time === time);
    }
    return [];
}

// ### NEW HELPER FUNCTION ###
// ### NEW HELPER FUNCTION (REPLACING THE OLD ONE) ###
function checkManualAllotment(sessionKey) {
    if (!sessionKey || sessionKey === 'all') {
        alert('Please select a specific session to generate this report.');
        return false;
    }

    // 1. Get total unique students for the session (scribes included)
    const [date, time] = sessionKey.split(' | ');
    const sessionStudentRecords = allStudentData.filter(s => s.Date === date && s.Time === time);
    const totalUniqueStudents = new Set(sessionStudentRecords.map(s => s['Register Number'])).size;

    if (totalUniqueStudents === 0) {
        alert('No students found for this session.');
        return false;
    }

    // 2. Get total manually allotted students for the session
    const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
    const manualAllotment = allAllotments[sessionKey] || [];

    if (!manualAllotment || manualAllotment.length === 0) {
        alert('Error: No manual room allotment found for this session. Please complete the allotment on the "Room Allotment" tab before generating reports.');
        return false;
    }

    // 3. Count unique allotted students
    const allottedRegNos = new Set();
    manualAllotment.forEach(room => {
        room.students.forEach(regNo => {
            allottedRegNos.add(regNo);
        });
    });
    const allottedStudentCount = allottedRegNos.size;

    // 4. Compare counts
    if (allottedStudentCount < totalUniqueStudents) {
        alert(`Error: Not all students are allotted.\n\nTotal Students: ${totalUniqueStudents}\nManually Allotted: ${allottedStudentCount}\nRemaining to Allot: ${totalUniqueStudents - allottedStudentCount}\n\nPlease complete the allotment.`);
        return false;
    }

    // This check is good. All students are allotted.
    return true;
}

// --- 1. Event listener for the "Generate Room-wise Report" button ---
generateReportButton.addEventListener('click', async () => {
    const sessionKey = reportsSessionSelect.value; 
    if (filterSessionRadio.checked && !checkManualAllotment(sessionKey)) { return; }
    
    generateReportButton.disabled = true;
    generateReportButton.textContent = "Allocating Rooms & Generating Report...";
    reportOutputArea.innerHTML = "";
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = "";
    lastGeneratedRoomData = [];
    lastGeneratedReportType = ""; 
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        getRoomCapacitiesFromStorage(); 
        loadQPCodes(); 
        
        // 1. Get FILTERED RAW student data
        const data = getFilteredReportData('room-wise');
        if (data.length === 0) {
            alert("No data found for the selected filter/session."); 
            return;
        }
        
        // 2. Get the ORIGINAL allocation with seat numbers
        const processed_rows_with_rooms = performOriginalAllocation(data);

        // 3. Load scribe data and create final list
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        const final_student_list_for_report = [];
        
        for (const student of processed_rows_with_rooms) {
            if (student.isScribe) {
                const sessionKeyPipe = `${student.Date} | ${student.Time}`;
                const sessionScribeAllotment = allScribeAllotments[sessionKeyPipe] || {};
                const scribeRoom = sessionScribeAllotment[student['Register Number']] || 'N/A';
                
                final_student_list_for_report.push({ 
                    ...student, 
                    Name: student.Name, 
                    remark: `${scribeRoom}`, 
                    isPlaceholder: true 
                });
            } else {
                final_student_list_for_report.push(student);
            }
        }
        
        // 4. Store data for CSV
        lastGeneratedRoomData = processed_rows_with_rooms; 
        lastGeneratedReportType = "Roomwise_Seating_Report";

        // 5. Group data for Report Generation
        const sessions = {};
        loadQPCodes(); 
        final_student_list_for_report.forEach(student => {
            const key = `${student.Date}_${student.Time}_${student['Room No']}`;
            if (!sessions[key]) {
                sessions[key] = {
                    Date: student.Date,
                    Time: student.Time,
                    Room: student['Room No'],
                    students: [],
                    courseCounts: {}
                };
            }
            sessions[key].students.push(student);
            
            const course = student.Course;
            if (!sessions[key].courseCounts[course]) {
                sessions[key].courseCounts[course] = 0;
            }
            sessions[key].courseCounts[course]++;
        });

        let allPagesHtml = '';
        let totalPagesGenerated = 0;
        
        const sortedSessionKeys = Object.keys(sessions).sort((a, b) => {
            return getNumericSortKey(a).localeCompare(getNumericSortKey(b));
        });

        // 6. Build the HTML report pages
        sortedSessionKeys.forEach(key => {
            const session = sessions[key];
            
            // Get location
            const roomInfo = currentRoomConfig[session.Room];
            const location = (roomInfo && roomInfo.location) ? roomInfo.location : "";
            const locationHtml = location ? `<div class="report-location-header">Location: ${location}</div>` : "";

            // Get Serial Number
            const sessionKeyPipe = `${session.Date} | ${session.Time}`;
            const roomSerialMap = getRoomSerialMap(sessionKeyPipe);
            const serialNo = roomSerialMap[session.Room] || '-';

            const sessionQPCodes = qpCodeMap[sessionKeyPipe] || {};

            // --- Prepare Course Summary (UPDATED: No Bold, Smaller Font) ---
            let courseSummaryHtml = '';
            const uniqueQPCodesInRoom = new Set();

            for (const [courseName, count] of Object.entries(session.courseCounts)) {
                const courseKey = getBase64CourseKey(courseName);
                const qpCode = sessionQPCodes[courseKey];
                
                // Add to QP List for Balance section
                if (qpCode) uniqueQPCodesInRoom.add(qpCode);
                else uniqueQPCodesInRoom.add(courseName.substring(0, 15)); 

                const qpDisplay = qpCode ? ` (QP: ${qpCode})` : "";
                
                // *** FIX: Removed 'font-weight: bold' and set font-size to 9pt ***
                courseSummaryHtml += `<div style="font-size: 9pt; margin-bottom: 2px;">${courseName}${qpDisplay}: <strong>${count}</strong></div>`; 
            }
            
            // Build the Balance Split-up HTML
            let qpBalanceHtml = '';
            uniqueQPCodesInRoom.forEach(code => {
                qpBalanceHtml += `<span style="white-space: nowrap;">${code}: __________</span> &nbsp;&nbsp; `;
            });
            // --------------------------------------------
            
            const pageHeaderHtml = `
                <div class="print-header-group">
                    <h1>${currentCollegeName}</h1> 
                    <h2>${serialNo} &nbsp;|&nbsp; ${session.Date} &nbsp;|&nbsp; ${session.Time} &nbsp;|&nbsp; ${session.Room}</h2>
                    ${locationHtml} 
                </div>
            `;
            
            const tableHeaderHtml = `
                <table class="print-table">
                    <thead>
                        <tr>
                            <th class="sl-col">Seat No</th>
                            <th class="course-col">Course (QP Code)</th>
                            <th class="reg-col">Register Number</th>
                            <th class="name-col">Name</th>
                            <th class="remarks-col">Remarks</th>
                            <th class="signature-col">Signature</th>
                        </tr>
                    </thead>
                    <tbody>
            `; 
            
            const hasScribe = session.students.some(s => s.isPlaceholder);
            const scribeFootnote = hasScribe ? '<div class="scribe-footnote">* = Scribe Assistance</div>' : '';

            const invigilatorFooterHtml = `
                <div class="invigilator-footer" style="margin-top: 1.5rem;"> <div class="course-summary-footer" style="padding: 6px;">
                        <strong style="font-size: 10pt;">Course Summary:</strong>
                        <div style="margin-top: 4px;">${courseSummaryHtml}</div>
                    </div>
                    
                    <div style="font-size: 9pt; line-height: 1.4;"> <div><strong>Answer Booklets Received:</strong> _________________</div>
                        <div><strong>Answer Booklets Used:</strong> _________________</div>
                        
                        <div style="margin-top: 4px; margin-bottom: 4px;">
                            <strong>Answer Booklets Returned (Balance):</strong><br>
                            <div style="margin-top: 4px;">
                                ${qpBalanceHtml}
                                <span style="font-weight: bold; white-space: nowrap;">Total: __________</span>
                            </div>
                        </div>
                    </div>

                    <div class="signature" style="margin-left: auto; text-align: center;">
                        Name and Dated Signature of the Invigilator
                    </div>
                    ${scribeFootnote}
                </div>
            `;

            let previousCourseName = ""; 
            let previousRegNoPrefix = ""; 
            const regNoRegex = /^([A-Z]+)(\d+)$/; 

            function generateTableRows(studentList) {
                let rowsHtml = '';
                studentList.forEach((student) => { 
                    const seatNumber = student.seatNumber;
                    const asterisk = student.isPlaceholder ? '*' : '';
                    
                    const courseKey = getBase64CourseKey(student.Course);
                    const qpCode = sessionQPCodes[courseKey] || "";
                    const qpCodePrefix = qpCode ? `(${qpCode}) ` : ""; 
                    
                    const courseWords = student.Course.split(/\s+/);
                    const truncatedCourse = courseWords.slice(0, 4).join(' ') + (courseWords.length > 4 ? '...' : '');
                    const tableCourseName = qpCodePrefix + truncatedCourse;
                    
                    let displayCourseName = (tableCourseName === previousCourseName) ? '"' : tableCourseName;
                    if (tableCourseName !== previousCourseName) previousCourseName = tableCourseName;

                    const regNo = student['Register Number'];
                    let displayRegNo = regNo;
                    const match = regNo.match(regNoRegex);
                    
                    if (match) {
                        const prefix = match[1];
                        const number = match[2];
                        if (prefix === previousRegNoPrefix) {
                            displayRegNo = number; 
                        }
                        previousRegNoPrefix = prefix; 
                    } else {
                        previousRegNoPrefix = ""; 
                    }

                    const rowClass = student.isPlaceholder ? 'class="scribe-row-highlight"' : '';
                    const remarkText = student.remark || ''; 
                    
                    rowsHtml += `
                        <tr ${rowClass}>
                            <td class="sl-col">${seatNumber}${asterisk}</td>
                            <td class="course-col">${displayCourseName}</td>
                            <td class="reg-col">${displayRegNo}</td>
                            <td class="name-col">${student.Name}</td>
                            <td class="remarks-col">${remarkText}</td>
                            <td class="signature-col"></td>
                        </tr>
                    `;
                });
                return rowsHtml;
            }
            
            const studentsWithIndex = session.students.sort((a, b) => a.seatNumber - b.seatNumber);
            
            const studentsPage1 = studentsWithIndex.slice(0, 20); 
            const studentsPage2 = studentsWithIndex.slice(20);

            previousCourseName = ""; 
            previousRegNoPrefix = ""; 
            const tableRowsPage1 = generateTableRows(studentsPage1);
            allPagesHtml += `<div class="print-page">${pageHeaderHtml}${tableHeaderHtml}${tableRowsPage1}</tbody></table>`; 
            if (studentsPage2.length === 0) allPagesHtml += invigilatorFooterHtml;
            allPagesHtml += `</div>`; 
            totalPagesGenerated++;
            
            if (studentsPage2.length > 0) {
                previousCourseName = ""; 
                previousRegNoPrefix = ""; 
                const tableRowsPage2 = generateTableRows(studentsPage2);
                allPagesHtml += `<div class="print-page">${tableHeaderHtml}${tableRowsPage2}</tbody></table>${invigilatorFooterHtml}</div>`; 
                totalPagesGenerated++;
            }
        });

        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated ${totalPagesGenerated} total pages for ${sortedSessionKeys.length} room sessions.`;
        reportControls.classList.remove('hidden');
        
        roomCsvDownloadContainer.innerHTML = `
            <button id="download-room-csv-button" class="w-full inline-flex justify-center items-center rounded-md border border-gray-300 bg-white py-3 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                Download Room Allocation Report (.csv)
            </button>
        `;
        document.getElementById('download-room-csv-button').addEventListener('click', downloadRoomCsv);

    } catch (e) {
        console.error("Error generating room-wise report:", e);
        reportStatus.textContent = "An error occurred while generating the report.";
        reportControls.classList.remove('hidden');
    } finally {
        generateReportButton.disabled = false;
        generateReportButton.textContent = "Generate Room-wise Seating Report";
    }
});
    
// --- (V29) Event listener for the "Day-wise Student List" button ---
generateDaywiseReportButton.addEventListener('click', async () => {
    const sessionKey = reportsSessionSelect.value; if (filterSessionRadio.checked && !checkManualAllotment(sessionKey)) { return; }
    generateDaywiseReportButton.disabled = true;
    generateDaywiseReportButton.textContent = "Generating...";
    reportOutputArea.innerHTML = "";
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = "";
    lastGeneratedRoomData = []; 
    lastGeneratedReportType = ""; 
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        getRoomCapacitiesFromStorage(); 
        
        const data = getFilteredReportData('day-wise');
        if (data.length === 0) {
            alert("No data found for the selected filter/session.");
            return;
        }
        
        const processed_rows_with_rooms = performOriginalAllocation(data); 

        const daySessions = {};
        processed_rows_with_rooms.forEach(student => {
            const key = `${student.Date}_${student.Time}`;
            if (!daySessions[key]) {
                daySessions[key] = {
                    Date: student.Date,
                    Time: student.Time,
                    students: []
                };
            }
            daySessions[key].students.push(student);
        });

        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        
        let allPagesHtml = '';
        let totalPagesGenerated = 0;
        const STUDENTS_PER_COLUMN = 45; 
        const COLUMNS_PER_PAGE = 1; 
        const STUDENTS_PER_PAGE = STUDENTS_PER_COLUMN * COLUMNS_PER_PAGE; 

        function buildColumnTable(studentChunk) {
            let rowsHtml = '';
            let currentCourse = ""; 
            let previousRoomDisplay = ""; 

            studentChunk.forEach(student => {
                if (student.Course !== currentCourse) {
                    currentCourse = student.Course;
                    previousRoomDisplay = ""; 
                    rowsHtml += `
                        <tr>
                            <td colspan="4" style="background-color: #ddd; font-weight: bold; padding: 4px 2px; border: 1px solid #999;">
                                ${student.Course}
                            </td>
                        </tr>
                    `;
                }

                let roomName = student['Room No'];
                let seatNo = student.seatNumber; 
                let rowStyle = '';

                if (student.isScribe) {
                    const sessionKeyPipe = `${student.Date} | ${student.Time}`;
                    const sessionScribeAllotment = allScribeAllotments[sessionKeyPipe] || {};
                    roomName = sessionScribeAllotment[student['Register Number']] || 'N/A'; 
                    seatNo = 'Scribe'; 
                    rowStyle = 'font-weight: bold; color: #c2410c;'; 
                }

                const roomInfo = currentRoomConfig[roomName];
                const roomDisplay = (roomInfo && roomInfo.location) ? roomInfo.location : roomName;
                const displayRoom = roomDisplay;
                
                rowsHtml += `
                    <tr style="${rowStyle}">
                        <td>${student['Register Number']}</td>
                        <td>${student.Name}</td>
                        <td>${displayRoom}</td>
                        <td style="text-align: center;">${seatNo}</td>
                    </tr>
                `;
            });

            return `
                <table class="daywise-report-table">
                    <thead>
                        <tr>
                            <th style="width: 15%;">Register No</th>
                            <th style="width: 25%;">Name</th>
                            <th style="width: 60%;">Location</th>
                            <th style="width: 10%;">Seat No</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            `;
        }

        const sortedSessionKeys = Object.keys(daySessions).sort();

        sortedSessionKeys.forEach(key => {
            const session = daySessions[key];
            
            session.students.sort((a, b) => {
                if (a.Course !== b.Course) return a.Course.localeCompare(b.Course);
                return a['Register Number'].localeCompare(b['Register Number']);
            });
            
            for (let i = 0; i < session.students.length; i += STUDENTS_PER_PAGE) {
                const pageStudents = session.students.slice(i, i + STUDENTS_PER_PAGE);
                totalPagesGenerated++; // Increment page count
                
                const col1Students = pageStudents.slice(0, STUDENTS_PER_COLUMN);
                const col2Students = pageStudents.slice(STUDENTS_PER_COLUMN); 
                
                let columnHtml = '';
                if (col1Students.length > 0 && col2Students.length === 0) {
                    columnHtml = `<div class="column">${buildColumnTable(col1Students)}</div>`;
                } else if (col1Students.length > 0 && col2Students.length > 0) {
                    columnHtml = `
                        <div class="column-container">
                            <div class="column">${buildColumnTable(col1Students)}</div>
                            <div class="column">${buildColumnTable(col2Students)}</div>
                        </div>
                    `;
                }
                
                // Scribe Summary Logic
                let scribeListHtml = '';
                if (i + STUDENTS_PER_PAGE >= session.students.length) {
                    const sessionScribes = session.students.filter(s => s.isScribe);
                    if (sessionScribes.length > 0) {
                        
                        const scribesByRoom = {};
                        sessionScribes.forEach(scribe => {
                            const sessionKeyPipe = `${scribe.Date} | ${scribe.Time}`;
                            const sessionScribeAllotment = allScribeAllotments[sessionKeyPipe] || {};
                            const newRoom = sessionScribeAllotment[scribe['Register Number']] || 'Not Allotted';
                            
                            if (!scribesByRoom[newRoom]) scribesByRoom[newRoom] = [];
                            scribesByRoom[newRoom].push(scribe);
                        });

                        scribeListHtml = '<div class="scribe-summary-box" style="margin-top: 2rem; padding: 1.5rem; border: 3px solid #ea580c; background: #fff7ed; border-radius: 8px;">';
                        scribeListHtml += '<h1 style="font-size: 18pt; font-weight: bold; margin-bottom: 1.5rem; color: #9a3412; text-align: center; text-transform: uppercase; border-bottom: 2px solid #ea580c; padding-bottom: 0.5rem;">Scribe Assistance Summary (Location Wise)</h1>';

                        const sortedRooms = Object.keys(scribesByRoom).sort((a, b) => {
                             const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
                             const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
                             return numA - numB;
                        });

                        sortedRooms.forEach(roomName => {
                            const roomInfo = currentRoomConfig[roomName];
                            const location = (roomInfo && roomInfo.location) ? roomInfo.location : "";
                            const locationDisplay = location ? ` <span style="font-weight: normal; font-style: italic;">(${location})</span>` : "";

                            scribeListHtml += `
                                <div style="margin-bottom: 1.5rem; page-break-inside: avoid;">
                                    <h2 style="font-size: 16pt; font-weight: bold; color: #000; background-color: #fed7aa; padding: 8px; border-left: 6px solid #ea580c; margin-bottom: 10px;">
                                        ${roomName}${locationDisplay}
                                    </h2>
                                    <div style="padding-left: 1rem;">
                            `;
                            scribesByRoom[roomName].forEach(s => {
                                scribeListHtml += `
                                    <div style="font-size: 11pt; margin-bottom: 6px; border-bottom: 1px dashed #ccc; padding-bottom: 4px;">
                                        <strong>${s.Name}</strong> &nbsp; [${s['Register Number']}] 
                                        &nbsp;&nbsp; 
                                        <span style="font-weight: bold; color: #555;">(Original: ${s['Room No']}, Seat: ${s.seatNumber})</span>
                                    </div>
                                `;
                            });
                            scribeListHtml += `</div></div>`;
                        });
                        scribeListHtml += '</div>';
                    }
                }

            allPagesHtml += `
                <div class="print-page print-page-daywise">
                    <div style="text-align: left; font-weight: bold; font-size: 14pt; margin-bottom: 5px;">Page: ${totalPagesGenerated}</div>
                    
                    <div class="print-header-group">
                        <h1>Seating Details for Candidates</h1>
                        <h2>${currentCollegeName} &nbsp;|&nbsp; ${session.Date} &nbsp;|&nbsp; ${session.Time}</h2>
                    </div>
                    ${columnHtml}
                </div>
            `;

            if (scribeListHtml) {
                totalPagesGenerated++; // Increment page count for scribe page
                allPagesHtml += `
                    <div class="print-page">
                        <div style="text-align: left; font-weight: bold; font-size: 14pt; margin-bottom: 5px;">Page: ${totalPagesGenerated}</div>
                        
                        <div class="print-header-group">
                            <h1>Scribe Assistance Summary</h1>
                            <h2>${currentCollegeName} &nbsp;|&nbsp; ${session.Date} &nbsp;|&nbsp; ${session.Time}</h2>
                        </div>
                        ${scribeListHtml} 
                    </div>
                `;
            }
        }
    });

        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated ${totalPagesGenerated} compact pages for ${sortedSessionKeys.length} sessions.`;
        reportControls.classList.remove('hidden');
        roomCsvDownloadContainer.innerHTML = ""; 
        lastGeneratedReportType = "Daywise_Seating_Details"; 

    } catch (e) {
        console.error("Error generating day-wise report:", e);
        reportStatus.textContent = "An error occurred while generating the report.";
        reportControls.classList.remove('hidden');
    } finally {
        generateDaywiseReportButton.disabled = false;
        generateDaywiseReportButton.textContent = "Generate Seating Details for Candidates (Compact)";
    }
});
// --- V91: Event listener for "Generate Question Paper Report" (Added report type set) ---
generateQPaperReportButton.addEventListener('click', async () => {
    generateQPaperReportButton.disabled = true;
    generateQPaperReportButton.textContent = "Generating...";
    reportOutputArea.innerHTML = "";
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = "";
    lastGeneratedReportType = ""; // V91: Reset report type
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
        // *** V95 FIX: Refresh college name from local storage BEFORE generation ***
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        
        // V68: Get Filtered data
        const filteredData = getFilteredReportData('q-paper');
        
        // Group the filtered data to generate the Q-Paper summary dynamically
        const qPaperSummary = {};
        filteredData.forEach(item => {
            const key = `${item.Date}_${item.Time}`;
            if (!qPaperSummary[key]) {
                qPaperSummary[key] = { Date: item.Date, Time: item.Time, courses: {} };
            }
            const courseKey = item.Course;
            if (!qPaperSummary[key].courses[courseKey]) {
                qPaperSummary[key].courses[courseKey] = 0;
            }
            qPaperSummary[key].courses[courseKey]++;
        });

        const sessions = qPaperSummary;
        
        if (Object.keys(sessions).length === 0) {
            alert("No question paper data found for the selected filter/session.");
            return;
        }
        
        let allPagesHtml = '';
        let totalPages = 0;
        const sortedSessionKeys = Object.keys(sessions).sort((a, b) => a.localeCompare(b));
        
        sortedSessionKeys.forEach(key => {
            const session = sessions[key];
            totalPages++;
            let totalStudentsInSession = 0;
            
            let tableRowsHtml = '';
            const sortedCourses = Object.keys(session.courses).sort();

            sortedCourses.forEach((courseName, index) => {
                const count = session.courses[courseName];
                totalStudentsInSession += count;
                tableRowsHtml += `
                    <tr>
                        <td class="sl-col">${index + 1}</td>
                        <td class="course-col">${courseName}</td>
                        <td class="count-col">${count}</td>
                    </tr>
                `;
            });
            
            const pageHtml = `
                <div class="print-page">
                    <div class="print-header-group">
                        <h1>${currentCollegeName}</h1> <h2>Question Paper Summary</h2>
                        <h3>${session.Date} &nbsp;|&nbsp; ${session.Time}</h3>
                    </div>
                    
                    <table class="q-paper-table print-table">
                        <thead>
                            <tr>
                                <th class="sl-col">Sl No</th>
                                <th class="course-col">Course Name</th>
                                <th class="count-col">Student Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="text-align: right;"><strong>Total Students</strong></td>
                                <td class="count-col"><strong>${totalStudentsInSession}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
            allPagesHtml += pageHtml;
        });
        
        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated ${totalPages} summary pages for ${sortedSessionKeys.length} sessions.`;
        reportControls.classList.remove('hidden');
        lastGeneratedReportType = "Question_Paper_Summary"; // V91: Set report type

    } catch(e) {
        console.error("Error generating Q-Paper report:", e);
        reportStatus.textContent = "An error occurred generating the report.";
        reportControls.classList.remove('hidden');
    } finally {
        generateQPaperReportButton.disabled = false;
        generateQPaperReportButton.textContent = "Generate Question Paper Report";
    }
});


// *** UPDATED: Event listener for QP Distribution by QP-Code Report (Aggregated by QP Code) ***
generateQpDistributionReportButton.addEventListener('click', async () => {
    const sessionKey = reportsSessionSelect.value; 
    if (filterSessionRadio.checked && !checkManualAllotment(sessionKey)) { return; }
    
    generateQpDistributionReportButton.disabled = true;
    generateQpDistributionReportButton.textContent = "Generating...";
    reportOutputArea.innerHTML = "";
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = "";
    lastGeneratedReportType = "";
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        getRoomCapacitiesFromStorage(); 
        
        const data = getFilteredReportData('qp-distribution');
        if (data.length === 0) {
            alert("No data found for the selected filter/session.");
            generateQpDistributionReportButton.disabled = false;
            generateQpDistributionReportButton.textContent = "Generate QP Distribution by QP-Code Report";
            return;
        }

        const processed_rows_with_rooms = performOriginalAllocation(data);
        loadQPCodes(); 

        const sessions = {};
        for (const student of processed_rows_with_rooms) {
            const sessionKey = `${student.Date}_${student.Time}`;
            const roomName = student['Room No'];
            const courseName = student.Course;

            // Use Base64 Key
            const courseKey = getBase64CourseKey(courseName);
            const sessionKeyPipe = `${student.Date} | ${student.Time}`;
            const sessionQPCodes = qpCodeMap[sessionKeyPipe] || {};
            const qpCode = sessionQPCodes[courseKey] || 'N/A'; 

            if (!sessions[sessionKey]) {
                sessions[sessionKey] = { Date: student.Date, Time: student.Time, qps: {} };
            }
            
            // Initialize QP Code entry if not exists
            if (!sessions[sessionKey].qps[qpCode]) {
                sessions[sessionKey].qps[qpCode] = {
                    courseNames: new Set(), // *** FIX: Store unique course names in a Set ***
                    rooms: {},
                    total: 0
                };
            }
            
            // Add course name to the Set
            sessions[sessionKey].qps[qpCode].courseNames.add(courseName);

            if (!sessions[sessionKey].qps[qpCode].rooms[roomName]) {
                sessions[sessionKey].qps[qpCode].rooms[roomName] = 0;
            }
            
            sessions[sessionKey].qps[qpCode].rooms[roomName]++;
            sessions[sessionKey].qps[qpCode].total++;
        }
        
        let allPagesHtml = '';
        const sortedSessionKeys = Object.keys(sessions).sort();
        
        if (sortedSessionKeys.length === 0) {
            alert("No data to report.");
            generateQpDistributionReportButton.disabled = false;
            generateQpDistributionReportButton.textContent = "Generate QP Distribution by QP-Code Report";
            return;
        }

        for (const sessionKey of sortedSessionKeys) {
            const session = sessions[sessionKey];
            
            // Get Room Serial Numbers
            const sessionKeyPipe = `${session.Date} | ${session.Time}`;
            const roomSerialMap = getRoomSerialMap(sessionKeyPipe);

            allPagesHtml += `
                <div class="print-page">
                    <div class="print-header-group">
                        <h1>${currentCollegeName}</h1>
                        <h2>Question Paper Distribution by QP Code</h2>
                        <h3>${session.Date} &nbsp;|&nbsp; ${session.Time}</h3>
                    </div>
            `;
            
            const sortedQPCodes = Object.keys(session.qps).sort();

            for (const qpCode of sortedQPCodes) {
                const qpData = session.qps[qpCode];
                
                // *** FIX: Join all course names ***
                const courseList = Array.from(qpData.courseNames).sort().join(', ');
                
                allPagesHtml += `<h4 class="qp-header">QP Code: ${qpCode} &nbsp; <span style="font-weight:normal; font-size: 0.9em;">(Courses: ${courseList})</span></h4>`;
                
                allPagesHtml += `
                    <table class="qp-distribution-table">
                        <thead>
                            <tr>
                                <th style="width: 80%;">Room</th>
                                <th style="width: 20%;">Student Count</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                
                const sortedRoomKeys = Object.keys(qpData.rooms).sort((a, b) => {
                    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
                    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
                    return numA - numB;
                });

                for (const roomName of sortedRoomKeys) {
                    const count = qpData.rooms[roomName];
                    
                    const roomInfo = currentRoomConfig[roomName];
                    const location = (roomInfo && roomInfo.location) ? ` <span style="font-size: 0.85em; color: #555;">(${roomInfo.location})</span>` : "";
                    const serialNo = roomSerialMap[roomName] || '-';

                    allPagesHtml += `
                        <tr>
                            <td><strong>${serialNo} | ${roomName}</strong>${location}</td>
                            <td>${count}</td>
                        </tr>
                    `;
                }
                
                allPagesHtml += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style="text-align: right; font-weight: bold;">Total</td>
                            <td style="font-weight: bold;">${qpData.total}</td>
                        </tr>
                    </tfoot>
                    </table>
                `;
            }
            allPagesHtml += `</div>`; 
        }
        
        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated QP Distribution Report for ${sortedSessionKeys.length} sessions.`;
        reportControls.classList.remove('hidden');
        lastGeneratedReportType = "QP_Distribution_Report";

    } catch (e) {
        console.error("Error generating QP Distribution report:", e);
        reportStatus.textContent = "An error occurred generating the report.";
        reportControls.classList.remove('hidden');
    } finally {
        generateQpDistributionReportButton.disabled = false;
        generateQpDistributionReportButton.textContent = "Generate QP Distribution by QP-Code Report";
    }
});


// *** NEW: Helper for Absentee Report (V10.1 FIX) ***
function formatRegNoList(regNos) {
    if (!regNos || regNos.length === 0) return '<em>None</em>';
    
    const outputHtml = [];
    // Regex to split letters from numbers (e.g., "VPAYSZO" and "007")
    const regEx = /^([A-Z]+)(\d+)$/; 

    regNos.sort(); 
    
    let currentPrefix = "";
    let numberGroup = []; // To hold numbers for the current prefix

    // Helper function to commit a completed group of numbers
    function commitGroup() {
        if (numberGroup.length > 0) {
            let groupString = "";
            if (currentPrefix) {
                // This is a standard prefix group (e.g., VPAYSZO)
                // The first item in numberGroup is the full regNo, the rest are just numbers
                const firstNum = numberGroup.shift(); // e.g., "VPAYSZO006"
                groupString = firstNum; // "VPAYSZO006"
                if (numberGroup.length > 0) {
                     // Add the rest, e.g., "011", "025"
                    groupString += ", " + numberGroup.join(", ");
                }
            } else {
                // This is a group of non-matching (fallback) numbers
                groupString = numberGroup.join(", ");
            }
            
            // Push this whole string as one single span
            outputHtml.push(`<span>${groupString}</span>`);
        }
        numberGroup = []; // Reset the group
    }

    regNos.forEach((regNo) => {
        const match = regNo.match(regEx);
        
        if (match) {
            const prefix = match[1];
            const number = match[2];
            
            if (prefix === currentPrefix) {
                // Same prefix, just add the number
                numberGroup.push(number);
            } else {
                // New prefix!
                // 1. Commit the previous group
                commitGroup();
                // 2. Start a new group
                currentPrefix = prefix;
                numberGroup.push(regNo); // Push the full regNo as the first item
            }
        } else {
            // Fallback for non-matching regNo
            // 1. Commit any existing prefix group
            commitGroup();
            // 2. Reset prefix and start a "non-match" group
            currentPrefix = ""; 
            numberGroup.push(regNo);
            // 3. Commit this non-match group immediately
            commitGroup(); 
        }
    });
    
    // Commit any remaining group after the loop
    commitGroup();
    
    // Join the spans with a line break. The CSS flex-gap will now be
    // between the entire groups, not the individual numbers.
    return outputHtml.join('<br>');
}
        
// --- (V56) Event listener for "Generate Absentee Statement" (QP Code Wise) ---
generateAbsenteeReportButton.addEventListener('click', async () => {
    const sessionKey = sessionSelect.value;
    if (!sessionKey) {
        alert("Please select a session first.");
        return;
    }

    generateAbsenteeReportButton.disabled = true;
    generateAbsenteeReportButton.textContent = "Generating...";
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        
        const [date, time] = sessionKey.split(' | ');
        const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
        const allAbsentees = JSON.parse(localStorage.getItem(ABSENTEE_LIST_KEY) || '{}');
        const absenteeRegNos = new Set(allAbsentees[sessionKey] || []);
        loadQPCodes(); 
        
        // 3. Group students by QP CODE -> Then by COURSE
        const qpGroups = {};
        
        for (const student of sessionStudents) {
            const courseDisplay = student.Course;
            
            // Get QP Code
            const courseKey = getBase64CourseKey(courseDisplay);
            const sessionCodes = qpCodeMap[sessionKey] || {};
            const qpCode = sessionCodes[courseKey] || "Not Entered"; // Default grouping
            
            if (!qpGroups[qpCode]) {
                qpGroups[qpCode] = {
                    code: qpCode,
                    courses: {}, // Will hold data per course
                    grandTotalPresent: 0,
                    grandTotalAbsent: 0
                };
            }
            
            if (!qpGroups[qpCode].courses[courseDisplay]) {
                qpGroups[qpCode].courses[courseDisplay] = {
                    name: courseDisplay,
                    present: [],
                    absent: []
                };
            }
            
            if (absenteeRegNos.has(student['Register Number'])) {
                qpGroups[qpCode].courses[courseDisplay].absent.push(student['Register Number']);
                qpGroups[qpCode].grandTotalAbsent++;
            } else {
                qpGroups[qpCode].courses[courseDisplay].present.push(student['Register Number']);
                qpGroups[qpCode].grandTotalPresent++;
            }
        }
        
        // 4. Build Report Pages
        let allPagesHtml = '';
        let totalPages = 0;
        const sortedQpKeys = Object.keys(qpGroups).sort();
        
        for (const qpCode of sortedQpKeys) {
            totalPages++;
            const qpData = qpGroups[qpCode];
            
            // Build rows for each course under this QP Code
            const sortedCourses = Object.keys(qpData.courses).sort();
            let tableRowsHtml = '';
            
            for (const courseName of sortedCourses) {
                const courseData = qpData.courses[courseName];
                const presentListHtml = formatRegNoList(courseData.present);
                const absentListHtml = formatRegNoList(courseData.absent);
                
                tableRowsHtml += `
                    <tr style="background-color: #f9fafb;">
                        <td colspan="2" style="font-weight: bold; border-bottom: 2px solid #ccc;">Course: ${courseData.name}</td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top; width: 25%;"><strong>Present (${courseData.present.length})</strong></td>
                        <td class="regno-list" style="vertical-align: top;">${presentListHtml}</td>
                    </tr>
                    <tr>
                        <td style="vertical-align: top;"><strong>Absent (${courseData.absent.length})</strong></td>
                        <td class="regno-list" style="vertical-align: top;">${absentListHtml}</td>
                    </tr>
                `;
            }
            
            // Add Total Row for the QP Code
            tableRowsHtml += `
                <tr style="background-color: #eee; border-top: 3px double #000;">
                    <td colspan="2" style="padding: 10px;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1em;">
                            <span>TOTAL FOR QP CODE: ${qpCode}</span>
                            <span>Present: ${qpData.grandTotalPresent} &nbsp;|&nbsp; Absent: ${qpData.grandTotalAbsent}</span>
                        </div>
                    </td>
                </tr>
            `;
            
            // *** FIX: Reverted signature to "Chief Superintendent" ***
            allPagesHtml += `
                <div class="print-page">
                    <div class="print-header-group">
                        <h1>${currentCollegeName}</h1>
                        <h2>Absentee Statement</h2>
                        <h3>${date} &nbsp;|&nbsp; ${time}</h3>
                        <h3 style="border: 1px solid black; padding: 5px; display: inline-block; margin-top: 5px;">QP Code: ${qpCode}</h3>
                    </div>
                
                    <table class="absentee-report-table" style="margin-top: 1rem;">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Register Numbers</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                    </table>
                    
                    <div class="absentee-footer">
                        <div class="signature">
                            Chief Superintendent
                        </div>
                    </div>
                </div>
            `;
        }

        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated ${totalPages} page(s) for ${sortedQpKeys.length} QP Codes.`;
        reportControls.classList.remove('hidden');
        roomCsvDownloadContainer.innerHTML = ""; 
        lastGeneratedReportType = `Absentee_Statement_${date.replace(/\./g, '_')}_${time.replace(/\s/g, '')}`; 

    } catch (e) {
        console.error("Error generating absentee report:", e);
        reportStatus.textContent = "An error occurred while generating the report.";
        reportControls.classList.remove('hidden');
    } finally {
        generateAbsenteeReportButton.disabled = false;
        generateAbsenteeReportButton.textContent = "Generate Absentee Statement";
    }
});

// *** UPDATED: Event listener for "Generate Scribe Report" ***

// *** CORRECTED: Event listener for "Generate Scribe Report" ***
generateScribeReportButton.addEventListener('click', async () => {
    const sessionKey = reportsSessionSelect.value; 
    if (filterSessionRadio.checked && !checkManualAllotment(sessionKey)) { return; }
    
    generateScribeReportButton.disabled = true;
    generateScribeReportButton.textContent = "Generating...";
    reportOutputArea.innerHTML = "";
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = "";
    lastGeneratedReportType = "";
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        getRoomCapacitiesFromStorage(); 
        
        // 1. Get FILTERED data
        const data = getFilteredReportData('scribe-report'); 
        if (!data || data.length === 0) {
            alert("No data found for the selected filter/session.");
            return;
        }
        
        // 2. Get global scribe list
        loadGlobalScribeList();
        if (globalScribeList.length === 0) {
            alert("No students have been added to the Scribe List in Scribe Assistance.");
            return;
        }
        const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));
        
        // 3. Get all scribe students from the filtered data
        const allScribeStudents = data.filter(s => scribeRegNos.has(s['Register Number']));
        if (allScribeStudents.length === 0) {
            alert("No scribe students found in the selected data.");
            return;
        }
        
        // 4. Get Original Room Allotments
        // We use 'data' here (which is already filtered by session) to generate correct seat numbers
        const originalAllotments = performOriginalAllocation(data); 
        
        // *** FIX 1: Use COMPOSITE KEY (Date|Time|RegNo) to prevent overwriting ***
        const originalRoomMap = originalAllotments.reduce((map, s) => {
            const key = `${s.Date}|${s.Time}|${s['Register Number']}`;
            map[key] = { room: s['Room No'], seat: s.seatNumber };
            return map;
        }, {});

        // 5. Load Scribe Allotments and QP Codes
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        loadQPCodes(); 

        // 6. Collate all data
        const reportRows = [];
        for (const s of allScribeStudents) {
            const sessionKey = `${s.Date} | ${s.Time}`;
            const sessionScribeRooms = allScribeAllotments[sessionKey] || {};
            const sessionQPCodes = qpCodeMap[sessionKey] || {};
            
            // Use Base64 Key
            const courseKey = getBase64CourseKey(s.Course);
            
            // *** FIX 2: Look up using the COMPOSITE KEY ***
            const lookupKey = `${s.Date}|${s.Time}|${s['Register Number']}`;
            const originalRoomData = originalRoomMap[lookupKey] || { room: 'N/A', seat: 'N/A' };
            
            // --- Get Room Serial Map for this session ---
            const roomSerialMap = getRoomSerialMap(sessionKey);
            
            // --- Format Original Room with Serial ---
            const orgSerial = roomSerialMap[originalRoomData.room] || '-';
            const originalRoomDisplay = `${orgSerial} - ${originalRoomData.room} (Seat: ${originalRoomData.seat})`;
            
            // --- Format Scribe Room with Serial & Location ---
            const rawScribeRoom = sessionScribeRooms[s['Register Number']];
            let scribeRoomDisplay = 'Not Allotted';
            
            if (rawScribeRoom) {
                const rInfo = currentRoomConfig[rawScribeRoom];
                const rLoc = (rInfo && rInfo.location) ? ` (${rInfo.location})` : ""; 
                
                // Get Serial for Scribe Room
                const scribeSerial = roomSerialMap[rawScribeRoom] || '-';
                scribeRoomDisplay = `${scribeSerial} - ${rawScribeRoom}${rLoc}`;
            }

            reportRows.push({
                Date: s.Date,
                Time: s.Time,
                RegisterNumber: s['Register Number'],
                Name: s.Name,
                Course: s.Course,
                OriginalRoom: originalRoomDisplay, // Correct Data
                ScribeRoom: scribeRoomDisplay,     // Correct Data
                QPCode: sessionQPCodes[courseKey] || 'N/A'
            });
        }
        
        // 7. Group by Session
        const sessions = {};
        for (const row of reportRows) {
            const key = `${row.Date}_${row.Time}`;
            if (!sessions[key]) {
                sessions[key] = { Date: row.Date, Time: row.Time, students: [] };
            }
            sessions[key].students.push(row);
        }

        // 8. Build HTML
        let allPagesHtml = '';
        let totalPages = 0;
        const sortedSessionKeys = Object.keys(sessions).sort();

        sortedSessionKeys.forEach(key => {
            const session = sessions[key];
            totalPages++;
            
            let tableRowsHtml = '';
            session.students.forEach((student, index) => {
                tableRowsHtml += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${student.RegisterNumber}</td>
                        <td>${student.Name}</td>
                        <td>${student.Course}</td>
                        <td>${student.QPCode}</td>
                        <td>${student.OriginalRoom}</td>
                        <td>${student.ScribeRoom}</td>
                    </tr>
                `;
            });
            
            allPagesHtml += `
                <div class="print-page">
                    <div class="print-header-group">
                        <h1>${currentCollegeName}</h1>
                        <h2>Scribe Assistance Report</h2>
                        <h3>${session.Date} &nbsp;|&nbsp; ${session.Time}</h3>
                    </div>
                    <table class="scribe-report-table">
                        <thead>
                            <tr>
                                <th style="width: 5%;">Sl</th>
                                <th style="width: 15%;">Register No</th>
                                <th style="width: 20%;">Name</th>
                                <th style="width: 20%;">Course / Paper</th>
                                <th style="width: 10%;">QP Code</th>
                                <th style="width: 15%;">Original Room</th>
                                <th style="width: 15%;">Scribe Room</th>
                            </tr>
                        </thead>
                        <tbody>${tableRowsHtml}</tbody>
                    </table>
                </div>
            `;
        });
        
        // 9. Show report
        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated ${totalPages} scribe report pages for ${sortedSessionKeys.length} sessions.`;
        reportControls.classList.remove('hidden');
        lastGeneratedReportType = "Scribe_Assistance_Report";

    } catch (e) {
        console.error("Error generating scribe report:", e);
        alert("Error generating report: " + e.message);
        reportStatus.textContent = "Generation failed.";
        reportControls.classList.remove('hidden');
    } finally {
        generateScribeReportButton.disabled = false;
        generateScribeReportButton.textContent = "Generate Scribe Assistance Report";
    }
});

// *******************************************************

// --- ROBUST VERSION: Scribe Proforma Report (With Serial Numbers) ---

// --- ROBUST VERSION: Scribe Proforma Report (With Serial Numbers) ---
generateScribeProformaButton.addEventListener('click', async () => {
    generateScribeProformaButton.disabled = true;
    generateScribeProformaButton.textContent = "Generating...";
    reportOutputArea.innerHTML = "";
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = "";
    lastGeneratedReportType = "";
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
        if (typeof getRoomCapacitiesFromStorage === 'function') getRoomCapacitiesFromStorage(); 
        if (typeof loadQPCodes === 'function') loadQPCodes(); 
        
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        
        const data = getFilteredReportData('scribe-proforma');
        if (!data || data.length === 0) throw new Error("No student data found for the selected session.");
        
        const globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
        if (globalScribeList.length === 0) throw new Error("Scribe List is empty.");
        const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));
        
        const allScribeStudents = data.filter(s => scribeRegNos.has(s['Register Number']));
        if (allScribeStudents.length === 0) throw new Error("No scribe students found in the selected session.");
        
        const originalAllotments = performOriginalAllocation(data); 
        const originalRoomMap = originalAllotments.reduce((map, s) => {
            map[s['Register Number']] = { room: s['Room No'], seat: s.seatNumber };
            return map;
        }, {});

        const reportRows = [];
        
        for (const s of allScribeStudents) {
            const sessionKey = `${s.Date} | ${s.Time}`;
            const sessionScribeRooms = allScribeAllotments[sessionKey] || {};
            const sessionQPCodes = qpCodeMap[sessionKey] || {};
            
            // *** FIX: Use getBase64CourseKey (No cleanCourseKey) ***
            const courseKey = getBase64CourseKey(s.Course);
            
            const originalRoomData = originalRoomMap[s['Register Number']] || { room: 'N/A', seat: 'N/A' };
            const roomSerialMap = getRoomSerialMap(sessionKey);

            // --- Format Original Room ---
            const orgSerial = roomSerialMap[originalRoomData.room] || '-';
            const originalRoomDisplay = `${orgSerial} - ${originalRoomData.room} (Seat: ${originalRoomData.seat})`;

            // --- Format Scribe Room ---
            const rawScribeRoom = sessionScribeRooms[s['Register Number']];
            let scribeRoomDisplay = '<span style="color:red;">Not Allotted</span>';
            
            if (rawScribeRoom) {
                let locText = "";
                if (typeof currentRoomConfig !== 'undefined' && currentRoomConfig[rawScribeRoom]) {
                    const rLoc = currentRoomConfig[rawScribeRoom].location;
                    if (rLoc) locText = ` (${rLoc})`;
                }
                const scribeSerial = roomSerialMap[rawScribeRoom] || '-';
                scribeRoomDisplay = `<strong>${scribeSerial} - ${rawScribeRoom}</strong>${locText}`;
            }

            reportRows.push({
                Date: s.Date,
                Time: s.Time,
                RegisterNumber: s['Register Number'],
                Name: s.Name,
                Course: s.Course,
                OriginalRoom: originalRoomDisplay,
                ScribeRoom: scribeRoomDisplay,
                QPCode: sessionQPCodes[courseKey] || 'N/A'
            });
        }
        
        let allPagesHtml = '';
        reportRows.forEach(student => {
            allPagesHtml += `
                <div class="print-page">
                    <div class="print-header-group">
                        <h1>${currentCollegeName}</h1>
                        <h2>Scribe Assistance Proforma</h2>
                        <h3>${student.Date} &nbsp;|&nbsp; ${student.Time}</h3>
                    </div>
                    
                    <table class="proforma-table">
                        <tbody>
                            <tr>
                                <td class="label">Name of Candidate:</td>
                                <td class="data">${student.Name}</td>
                            </tr>
                            <tr>
                                <td class="label">Register Number:</td>
                                <td class="data">${student.RegisterNumber}</td>
                            </tr>
                            <tr>
                                <td class="label">Course / Paper:</td>
                                <td class="data">${student.Course}</td>
                            </tr>
                            <tr>
                                <td class="label">QP Code:</td>
                                <td class="data">${student.QPCode}</td>
                            </tr>
                            <tr>
                                <td class="label">Original Allotted Room:</td>
                                <td class="data">${student.OriginalRoom}</td>
                            </tr>
                            <tr>
                                <td class="label">Scribe Allotted Room:</td>
                                <td class="data" style="font-size: 1.1em;">${student.ScribeRoom}</td>
                            </tr>
                            <tr>
                                <td class="label">Sign or Thumb Impression of Candidate:</td>
                                <td class="data fillable"></td>
                            </tr>
                            <tr>
                                <td class="label">Name of Scribe Assistant:</td>
                                <td class="data fillable"></td>
                            </tr>
                            <tr>
                                <td class="label">Scribe Assistant ID Card & No:</td>
                                <td class="data fillable"></td>
                            </tr>
                            <tr>
                                <td class="label">Signature of Scribe Assistant:</td>
                                <td class="data fillable"></td>
                            </tr>
                            <tr>
                                <td class="label">Name & Signature of Invigilator:</td>
                                <td class="data fillable"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        });
        
        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated ${reportRows.length} Scribe Proforma pages.`;
        reportControls.classList.remove('hidden');
        lastGeneratedReportType = "Scribe_Proforma";

    } catch (e) {
        console.error("Scribe Report Error:", e);
        alert("Error generating report: " + e.message); 
        reportStatus.textContent = "Generation failed.";
    } finally {
        generateScribeProformaButton.disabled = false;
        generateScribeProformaButton.textContent = "Generate Scribe Proforma (One Page Per Scribe)";
    }
});

// --- V96: Removed PDF Download Functionality (Replaced with native Print) ---
// downloadPdfButton.addEventListener('click', ... removed ...)

// --- Event listener for the "Print" button ---
finalPrintButton.addEventListener('click', () => {
    // This button now exclusively uses the native browser print function
    window.print();
}); 
// --- Event listener for the "Clear" button ---
clearReportButton.addEventListener('click', clearReport);

// --- Centralized logic for clearing reports ---
function clearReport() {
    reportOutputArea.innerHTML = "";
    reportOutputArea.style.display = 'none'; 
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = ""; // Clear CSV button
    lastGeneratedRoomData = []; // Clear data
    lastGeneratedReportType = ""; // V91: Clear report type
}

// --- Function to download the room-allocated CSV ---
function downloadRoomCsv() {
    if (!lastGeneratedRoomData || lastGeneratedRoomData.length === 0) {
        alert("No room data to download.");
        return;
    }
    
    // (V28) Add Location to CSV
    const headers = ['Date', 'Time', 'Course', 'Register Number', 'Name', 'Room No', 'Location'];
    let csvContent = headers.join(",") + "\n";
    
    lastGeneratedRoomData.forEach(row => {
        // (V28) Get location for this row
        const roomInfo = currentRoomConfig[row['Room No']];
        const location = (roomInfo && roomInfo.location) ? row['Location'] || roomInfo.location.toString() : ""; // V91 FIX: Use row location if present
        
        const values = headers.map(header => {
            let val = row[header] ? row[header].toString() : "";
            if (header === 'Location') { val = location; } // V91 FIX: Explicitly set location
            
            val = val.replace(/"/g, '""');
            if (val.includes(',') || val.includes('\n')) {
                val = `"${val}"`;
            }
            return val;
        });
        csvContent += values.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Room_Allocation_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// --- NAVIGATION VIEW-SWITCHING LOGIC (REORDERED) ---
navExtractor.addEventListener('click', () => showView(viewExtractor, navExtractor));
navEditData.addEventListener('click', () => showView(viewEditData, navEditData)); // <-- ADD THIS
navScribeSettings.addEventListener('click', () => showView(viewScribeSettings, navScribeSettings));
navRoomAllotment.addEventListener('click', () => showView(viewRoomAllotment, navRoomAllotment));
navQPCodes.addEventListener('click', () => showView(viewQPCodes, navQPCodes));
navSearch.addEventListener('click', () => showView(viewSearch, navSearch)); // <-- ADD THIS
navReports.addEventListener('click', () => showView(viewReports, navReports));
navAbsentees.addEventListener('click', () => showView(viewAbsentees, navAbsentees));
navSettings.addEventListener('click', () => showView(viewSettings, navSettings));

function showView(viewToShow, buttonToActivate) {
    allViews.forEach(view => view.classList.add('hidden'));
    allNavButtons.forEach(btn => {
        btn.classList.add('nav-button-inactive');
        btn.classList.remove('nav-button-active');
    });
    viewToShow.classList.remove('hidden');
    buttonToActivate.classList.remove('nav-button-inactive');
    buttonToActivate.classList.add('nav-button-active');
    
    clearReport(); // Always clear reports when switching views
}

// --- (V97) College Name Save Logic (in Settings) ---
saveCollegeNameButton.addEventListener('click', () => {
    const collegeName = collegeNameInput.value.trim() || "University of Calicut";
    localStorage.setItem(COLLEGE_NAME_KEY, collegeName);
    currentCollegeName = collegeName; // Update global var immediately
    
    collegeNameStatus.textContent = "College name saved!";
    setTimeout(() => { collegeNameStatus.textContent = ""; }, 2000);
});

// --- (V48) Save from dynamic form (in Settings) ---
saveRoomConfigButton.addEventListener('click', () => {
    try {
        // NOTE: College Name saving is now handled by saveCollegeNameButton
        
        // Save Room Config
        const newConfig = {};
        // V79: Get all rows, re-read and save
        const roomRows = roomConfigContainer.querySelectorAll('.room-row');
        
        roomRows.forEach(row => {
            // V79: Read current values (name label is the source of truth for the room key)
            const roomName = row.querySelector('.room-name-label').textContent.replace(':', '').trim();
            let capacity = parseInt(row.querySelector('.room-capacity-input').value, 10);
            let location = row.querySelector('.room-location-input').value.trim();
            
            // Default to 30 if blank or invalid
            if (isNaN(capacity) || capacity <= 0) {
                capacity = 30;
            }
            
            if (roomName) {
                // V79: Re-save all rooms with new sequential names and updated data
                newConfig[roomName] = {
                    capacity: capacity,
                    location: location
                };
            }
        });
        
        localStorage.setItem(ROOM_CONFIG_KEY, JSON.stringify(newConfig));
        
        // Show success message
        roomConfigStatus.textContent = "Settings saved successfully!";
        setTimeout(() => { roomConfigStatus.textContent = ""; }, 2000);
        
        // V79: RE-RENDER the list to fix numbering and apply UX rules (remove button on last row only)
        loadRoomConfig();
        
    } catch (e) {
        roomConfigStatus.textContent = "Error saving settings.";
        console.error("Error saving room config:", e);
    }
});

// --- (V79) Load data into dynamic form (in Settings) ---
function loadRoomConfig() {
    // V48: Load College Name
    currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
    // *** V91 FIX: Populate the input field with the saved value ***
    if (collegeNameInput) collegeNameInput.value = currentCollegeName; 
    
    // Load Room Config
    let savedConfigJson = localStorage.getItem(ROOM_CONFIG_KEY);
    let config;
    
    if (savedConfigJson) {
        try {
            config = JSON.parse(savedConfigJson);
        } catch (e) {
            console.error("Error parsing saved config, resetting.", e);
            config = {};
        }
    } else {
        config = {};
    }
    
    // (V28) Store in global var for other functions to use
    currentRoomConfig = config;
    
    if (Object.keys(config).length === 0) {
        // *** (V27): Default to 30 rooms ***
        console.log("Using default room config (30 rooms of 30)");
        config = {};
        for (let i = 1; i <= 30; i++) {
            config[`Room ${i}`] = { capacity: 30, location: "" };
        }
        localStorage.setItem(ROOM_CONFIG_KEY, JSON.stringify(config));
        currentRoomConfig = config; // Update global var
    }
    
    // Populate the dynamic form
    roomConfigContainer.innerHTML = ''; // Clear existing rows
    const sortedKeys = Object.keys(config).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
    });
    
    // V79: Add rows, determining if 'isLast' is true
    sortedKeys.forEach((roomName, index) => {
        const roomData = config[roomName];
        const isLast = (index === sortedKeys.length - 1);
        const rowHtml = createRoomRowHtml(roomName, roomData.capacity, roomData.location, isLast);
        roomConfigContainer.insertAdjacentHTML('beforeend', rowHtml);
    });
}

// --- (V28) Add New Room Button (in Settings) ---
addRoomButton.addEventListener('click', () => {
    const allRows = roomConfigContainer.querySelectorAll('.room-row');
    let newName = "Room 1";
    
    if (allRows.length > 0) {
        const lastRow = allRows[allRows.length - 1];
        const lastName = lastRow.querySelector('.room-name-label').textContent.replace(':', '').trim();
        let lastNum = 0;
        try {
            lastNum = parseInt(lastName.match(/(\d+)/)[0], 10);
        } catch(e) {
            lastNum = allRows.length; // Fallback
        }
        newName = `Room ${lastNum + 1}`;
    }
    
    // V79: Before adding new row, remove remove button from the current last row
    const currentLastRow = roomConfigContainer.lastElementChild;
    if (currentLastRow) {
        const removeButton = currentLastRow.querySelector('.remove-room-button');
        if (removeButton) {
            const placeholder = document.createElement('div');
            placeholder.className = 'w-[84px]'; // Match the button width for alignment
            removeButton.parentNode.replaceChild(placeholder, removeButton);
        }
    }

    const newRowHtml = createRoomRowHtml(newName, 30, "", true); // Add new row as the last row
    roomConfigContainer.insertAdjacentHTML('beforeend', newRowHtml);
});

// --- (V79) Remove Room Button (Event Delegation for all rows, in Settings) ---
roomConfigContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-room-button')) {
        e.target.closest('.room-row').remove();
        
        // Re-save configuration to update the room names and persist the deletion
        saveRoomConfigButton.click(); // Triggers re-saving and re-rendering to fix numbering and buttons
    }
});
// --- (V33) NEW CSV UPLOAD LOGIC ---

// V33: Add event listener for the new "Load CSV" button
loadCsvButton.addEventListener('click', () => {
    const file = correctedCsvUpload.files[0];
    if (!file) {
        csvLoadStatus.textContent = "Please select a CSV file first.";
        return;
    }
    
    // *** WORKFLOW FIX: Removed logic that disables PDF buttons ***

    const reader = new FileReader();
    reader.onload = (event) => {
        const csvText = event.target.result;
        parseCsvAndLoadData(csvText);
    };
    reader.onerror = () => {
        csvLoadStatus.textContent = "Error reading file.";
        // *** WORKFLOW FIX: Removed logic that disables PDF buttons ***
    };
    reader.readAsText(file);
});

// *** NEW: Helper function to sort CSV data just like Python sort ***
function getJsSortKey(row) {
    let dateObj, timeObj, courseName;
    
    // 1. Parse Date (DD.MM.YYYY)
    try {
        const parts = row.Date.split('.');
        dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
    } catch (e) {
        dateObj = new Date(0); // Epoch
    }
    
    // 2. Parse Time (HH:MM AM/PM)
    try {
        let timeStr = row.Time.toUpperCase().replace(" ", "");
        if (timeStr.length === 7) { // 9:30AM -> 09:30AM
            timeStr = "0" + timeStr;
        }
        
        let hour = parseInt(timeStr.substring(0, 2), 10);
        const minute = timeStr.substring(3, 5);
        const modifier = timeStr.substring(5);

        if (modifier === 'PM' && hour !== 12) {
            hour += 12;
        }
        if (modifier === 'AM' && hour === 12) {
            hour = 0;
        }
        
        timeObj = new Date(2000, 0, 1, hour, parseInt(minute, 10));
    } catch (e) {
        console.warn("Could not parse time for sorting:", row.Time, e);
        timeObj = new Date(0); // Epoch
    }
    
    // 3. Course Name
    courseName = row.Course || '';
    
    return { dateObj, timeObj, courseName };
}
// V33: This function parses the CSV and overwrites the data stores
function parseCsvAndLoadData(csvText) {
    try {
        const lines = csvText.trim().split('\n');
        const headersLine = lines.shift().trim();
        const headers = headersLine.split(',');

        // Find indices, this is more robust
        const dateIndex = headers.indexOf('Date');
        const timeIndex = headers.indexOf('Time');
        const courseIndex = headers.indexOf('Course');
        const regNumIndex = headers.indexOf('Register Number');
        const nameIndex = headers.indexOf('Name');

        if (regNumIndex === -1 || nameIndex === -1 || courseIndex === -1) {
            csvLoadStatus.textContent = "Error: CSV must contain 'Register Number', 'Name', and 'Course' headers.";
            csvLoadStatus.classList.add('text-red-600');
            csvLoadStatus.classList.remove('text-green-600');
            // *** WORKFLOW FIX: Removed logic that re-enables PDF buttons ***
            return;
        }

        const jsonData = [];
        const qPaperSummary = {}; // Use an object for quick lookup

        for (const line of lines) {
            if (!line.trim()) continue;
            
            // Regex parser that handles quoted fields (commas inside courses)
            const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            const values = line.split(regex).map(val => val.trim().replace(/^"|"$/g, '')); // Trim and remove surrounding quotes

            if (values.length !== headers.length) {
                console.warn("Skipping malformed CSV line:", line);
                continue;
            }

            const student = {
                'Date': values[dateIndex],
                'Time': values[timeIndex],
                'Course': values[courseIndex], // V60: This name should be normalized already
                'Register Number': values[regNumIndex],
                'Name': values[nameIndex]
            };
            
            jsonData.push(student);
            
            // --- Regenerate Q-Paper Summary ---
            const key = `${student.Date}_${student.Time}_${student.Course}`;
            if (!qPaperSummary[key]) {
                qPaperSummary[key] = { 
                    Date: student.Date, 
                    Time: student.Time, 
                    Course: student.Course, 
                    'Student Count': 0 
                };
            }
            qPaperSummary[key]['Student Count']++;
        }
        
      const qPaperArray = Object.values(qPaperSummary);

        // --- NEW: Sort the loaded CSV data by Date, Time, and Course ---
        try {
            jsonData.sort((a, b) => {
                const keyA = getJsSortKey(a);
                const keyB = getJsSortKey(b);
                
                if (keyA.dateObj.getTime() !== keyB.dateObj.getTime()) {
                    return keyA.dateObj - keyB.dateObj;
                }
                if (keyA.timeObj.getTime() !== keyB.timeObj.getTime()) {
                    return keyA.timeObj - keyB.timeObj;
                }
                return keyA.courseName.localeCompare(keyB.courseName);
            });
        } catch (e) {
            console.error("Error during CSV sorting:", e);
            // Don't block, just log the error
        }
        // --- END NEW ---

        // --- Update Data Stores ---
        jsonDataStore.innerHTML = JSON.stringify(jsonData);
        qPaperDataStore.innerHTML = JSON.stringify(qPaperArray);
        
        // V65: Save the base data to localStorage
        localStorage.setItem(BASE_DATA_KEY, JSON.stringify(jsonData));

        // --- Update UI ---
        csvLoadStatus.textContent = `Successfully loaded and parsed ${jsonData.length} student records.`;
        csvLoadStatus.classList.remove('text-red-600');
        csvLoadStatus.classList.add('text-green-600');
        
        // Enable report buttons
        generateReportButton.disabled = false;
        generateQPaperReportButton.disabled = false;
        generateQpDistributionReportButton.disabled = false; // <-- ADD THIS
        generateDaywiseReportButton.disabled = false;
        generateScribeReportButton.disabled = false; // <-- NEW
        generateScribeProformaButton.disabled = false; // <-- ADD THIS
        generateInvigilatorReportButton.disabled = false; // <-- ADD THIS
        
        // V56: Enable and populate absentee tab
        disable_absentee_tab(false);
        populate_session_dropdown();
        
        // V61: Enable and populate QP Code tab
        disable_qpcode_tab(false);
        populate_qp_code_session_dropdown();
        
        // Enable and populate Room Allotment tab
        disable_room_allotment_tab(false);
        populate_room_allotment_session_dropdown();

        // *** NEW: Enable Scribe Tabs ***
        disable_scribe_settings_tab(false); // MODIFIED
        loadGlobalScribeList();
        // *****************************
        // *** NEW: Enable Edit Data Tab ***
        disable_edit_data_tab(false);
        // *********************************
        // *** WORKFLOW FIX: Removed logic that re-enables PDF buttons ***


    } catch (e) {
        console.error("Error parsing CSV:", e);
        csvLoadStatus.textContent = "Error parsing CSV file. See console for details.";
        csvLoadStatus.classList.add('text-red-600');
        csvLoadStatus.classList.remove('text-green-600');
        // *** WORKFLOW FIX: Removed logic that re-enables PDF buttons ***
    }
}


// --- (V56) NEW ABSENTEE LOGIC ---

// *** FIX: This is the REAL implementation of the function Python calls ***
window.real_populate_session_dropdown = function() {
    try {
        allStudentData = JSON.parse(jsonDataStore.innerHTML || '[]');
        if (allStudentData.length === 0) {
            disable_absentee_tab(true);
            return;
        }

        // ### NEW: Data Analysis and Reporting ###
        const totalRows = allStudentData.length;
        const seenKeys = new Set();
        const uniqueStudentEntries = []; // We will store the clean data here
        let duplicateCount = 0;

        allStudentData.forEach(row => {
            // This key checks for a unique student *per session*, just as you described
            const key = `${row.Date}|${row.Time}|${row['Register Number']}`;
            
            if (seenKeys.has(key)) {
                duplicateCount++;
            } else {
                seenKeys.add(key);
                uniqueStudentEntries.push(row); // Store the first unique entry
            }
        });

        // If duplicates were found, report it to the Status Log
        if (duplicateCount > 0) {
            const uniqueCount = seenKeys.size;
            const warningMsg = `
                <p class="mb-1 text-red-600">&gt; <strong>Data Validation Warning:</strong></p>
                <p class="mb-1 text-red-600" style="padding-left: 1rem;">- Total rows extracted: <strong>${totalRows}</strong></p>
                <p class="mb-1 text-red-600" style="padding-left: 1rem;">- Unique student entries: <strong>${uniqueCount}</strong></p>
                <p class="mb-1 text-red-600" style="padding-left: 1rem;">- Found <strong>${duplicateCount} duplicate entries.</strong></p>
                <p class="mb-1 text-yellow-600" style="padding-left: 1rem;">&gt; This may be due to uploading a duplicate PDF file. The app will proceed using only the <strong>${uniqueCount}</strong> unique entries. If this is unexpected, please re-extract your data.</p>
            `;
            
            if (statusLogDiv) {
                statusLogDiv.innerHTML += warningMsg;
                statusLogDiv.scrollTop = statusLogDiv.scrollHeight;
            }
            
            // IMPORTANT: Fix the data for the rest of the app
            // This ensures the 692 (unique) count is used everywhere
            allStudentData = uniqueStudentEntries;
        }
        // ### END: Data Analysis and Reporting ###

        
        updateUniqueStudentList(); // This will now use the clean 'allStudentData'
        
        // Get unique sessions (from the clean data)
        const sessions = new Set(allStudentData.map(s => `${s.Date} | ${s.Time}`));
        allStudentSessions = Array.from(sessions).sort();
        
        sessionSelect.innerHTML = '<option value="">-- Select a Session --</option>'; // Clear
        reportsSessionSelect.innerHTML = '<option value="all">All Sessions</option>'; // V68: Clear and set default for reports
        editSessionSelect.innerHTML = '<option value="">-- Select a Session --</option>'; // <-- ADD THIS
        searchSessionSelect.innerHTML = '<option value="">-- Select a Session --</option>'; // <-- ADD THIS
        
        // Find today's session
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-GB').replace(/\//g, '.'); // DD.MM.YYYY
        let defaultSession = "";
        
            allStudentSessions.forEach(session => {
            sessionSelect.innerHTML += `<option value="${session}">${session}</option>`;
            reportsSessionSelect.innerHTML += `<option value="${session}">${session}</option>`; // V68
            editSessionSelect.innerHTML += `<option value="${session}">${session}</option>`; // <-- ADD THIS
            searchSessionSelect.innerHTML += `<option value="${session}">${session}</option>`; // <-- ADD THIS
            if (session.startsWith(todayStr)) {
                defaultSession = session;
            }
        });
        
        if (defaultSession) {
            // 1. Default Absentee Tab
            sessionSelect.value = defaultSession;
            sessionSelect.dispatchEvent(new Event('change')); 
            
            // 2. Default Search Tab
            if (searchSessionSelect) {
                searchSessionSelect.value = defaultSession;
                searchSessionSelect.dispatchEvent(new Event('change')); 
            }
            
            // 3. Default Edit Data Tab (FIXED: Now triggers change to load courses)
            if (editSessionSelect) {
                editSessionSelect.value = defaultSession;
                editSessionSelect.dispatchEvent(new Event('change')); // <--- ADDED THIS
            }
        }
        
        // V68: Ensure report filters are visible and default set
        reportFilterSection.classList.remove('hidden');
        // V81: Set Specific Session as default
        filterSessionRadio.checked = true;
        reportsSessionDropdownContainer.classList.remove('hidden');
        // Ensure the report select box defaults to today's session if found
        reportsSessionSelect.value = defaultSession || reportsSessionSelect.options[1]?.value || "all";

    } catch (e) {
        console.error("Failed to populate sessions:", e);
        disable_absentee_tab(true);
    }
}

sessionSelect.addEventListener('change', () => {
    const sessionKey = sessionSelect.value;
    if (sessionKey) {
        absenteeSearchSection.classList.remove('hidden');
        absenteeListSection.classList.remove('hidden');
        generateAbsenteeReportButton.disabled = false;
        loadAbsenteeList(sessionKey);
    } else {
        absenteeSearchSection.classList.add('hidden');
        absenteeListSection.classList.add('hidden');
        generateAbsenteeReportButton.disabled = true;
        currentAbsenteeListDiv.innerHTML = "";
    }
    clearSearch();
});

absenteeSearchInput.addEventListener('input', () => {
    const query = absenteeSearchInput.value.trim().toUpperCase();
    if (query.length < 3) {
        autocompleteResults.classList.add('hidden');
        return;
    }
    
    const sessionKey = sessionSelect.value;
    if (!sessionKey) return;
    const [date, time] = sessionKey.split(' | ');
    
    // Filter students for this session
    const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
    
    // Filter by search query
    const matches = sessionStudents.filter(s => s['Register Number'].toUpperCase().includes(query)).slice(0, 10);
    
    if (matches.length > 0) {
        autocompleteResults.innerHTML = '';
        matches.forEach(student => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerHTML = student['Register Number'].replace(new RegExp(query, 'gi'), '<strong>$&</strong>') + ` (${student.Name})`;
            item.onclick = () => selectStudent(student);
            autocompleteResults.appendChild(item);
        });
        autocompleteResults.classList.remove('hidden');
    } else {
        autocompleteResults.classList.add('hidden');
    }
});

function selectStudent(student) {
    selectedStudent = student;
    absenteeSearchInput.value = student['Register Number'];
    autocompleteResults.classList.add('hidden');
    
    // V87 FIX: Allocate rooms for the *entire* session to find the correct room
    const sessionKey = sessionSelect.value;
    const [date, time] = sessionKey.split(' | ');
    const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
    
    // Perform allocation on the *entire* session
    // *** THIS NOW USES THE MAIN ALLOCATION, WHICH IS SCRIBE-AWARE ***
    const allocatedSessionData = performOriginalAllocation(sessionStudents);
    
    // Find our selected student in the allocated list
    const allocatedStudent = allocatedSessionData.find(s => s['Register Number'] === student['Register Number']);
    
    const roomNo = allocatedStudent ? allocatedStudent['Room No'] : 'N/A';
    const roomInfo = currentRoomConfig[roomNo];
    const location = (roomInfo && roomInfo.location) ? `(${roomInfo.location})` : "";
    
    selectedStudentName.textContent = student.Name;
    selectedStudentCourse.textContent = student.Course;
    selectedStudentRoom.textContent = `Room: ${roomNo} ${location}`; // Use the correctly allocated room
    if (allocatedStudent && allocatedStudent.isScribe) { // <-- NEW
        selectedStudentRoom.textContent += ' (Scribe)';
    }
    selectedStudentDetails.classList.remove('hidden');
}

function clearSearch() {
    selectedStudent = null;
    absenteeSearchInput.value = "";
    autocompleteResults.classList.add('hidden');
    selectedStudentDetails.classList.add('hidden');
}

// --- ADDED: New helper function for Scribe Search ---
function updateUniqueStudentList() {
    console.log("Updating unique student list for search...");
    const seenRegNos = new Set();
    allUniqueStudentsForScribeSearch = []; // Clear it
    if (!allStudentData || allStudentData.length === 0) {
        console.log("No student data to build unique list from.");
        return;
    }
    for (const student of allStudentData) {
        if (!seenRegNos.has(student['Register Number'])) {
            seenRegNos.add(student['Register Number']);
            // Store just what's needed
            allUniqueStudentsForScribeSearch.push({ 
                regNo: student['Register Number'], 
                name: student.Name 
            });
        }
    }
    console.log(`Updated unique student list: ${allUniqueStudentsForScribeSearch.length} students found.`);
}
// --- END: New helper function ---


addAbsenteeButton.addEventListener('click', () => {
    if (!selectedStudent) return;
    
    const sessionKey = sessionSelect.value;
    const regNo = selectedStudent['Register Number'];
    
    if (currentAbsenteeList.includes(regNo)) {
        alert(`${regNo} is already on the absentee list.`);
        clearSearch();
        return;
    }
    
    // Add to list and save
    currentAbsenteeList.push(regNo);
    saveAbsenteeList(sessionKey);
    renderAbsenteeList();
    clearSearch();
});

function loadAbsenteeList(sessionKey) {
    const allAbsentees = JSON.parse(localStorage.getItem(ABSENTEE_LIST_KEY) || '{}');
    currentAbsenteeList = allAbsentees[sessionKey] || [];
    renderAbsenteeList();
}

function saveAbsenteeList(sessionKey) {
    const allAbsentees = JSON.parse(localStorage.getItem(ABSENTEE_LIST_KEY) || '{}');
    allAbsentees[sessionKey] = currentAbsenteeList;
    localStorage.setItem(ABSENTEE_LIST_KEY, JSON.stringify(allAbsentees));
}

function renderAbsenteeList() {
    getRoomCapacitiesFromStorage(); // <-- ADD THIS LINE
    const sessionKey = sessionSelect.value;
    currentAbsenteeListDiv.innerHTML = "";
    
    if (currentAbsenteeList.length === 0) {
        currentAbsenteeListDiv.innerHTML = `<em class="text-gray-500">No absentees marked for this session.</em>`;
        return;
    }

    // V81 FIX: Allocate rooms for the entire session first to get correct room numbers
    const [date, time] = sessionKey.split(' | ');
    const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
    const allocatedSessionData = performOriginalAllocation(sessionStudents);
    const allocatedMap = allocatedSessionData.reduce((map, s) => {
        map[s['Register Number']] = { room: s['Room No'], isScribe: s.isScribe }; // <-- NEW
        return map;
    }, {});

    currentAbsenteeList.forEach(regNo => {
        const roomData = allocatedMap[regNo] || { room: 'N/A', isScribe: false };
        const room = roomData.room;
        const roomInfo = currentRoomConfig[room];
        const location = (roomInfo && roomInfo.location) ? `(${roomInfo.location})` : "";
        let roomDisplay = `${room} ${location}`;
        if (roomData.isScribe) roomDisplay += ' (Scribe)'; // <-- NEW
        
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-2 bg-white border border-gray-200 rounded';
        item.innerHTML = `
            <span class="font-medium">${regNo}</span>
            <span class="text-sm text-gray-500">${roomDisplay}</span>
            <button class="text-xs text-red-600 hover:text-red-800 font-medium">&times; Remove</button>
        `;
        item.querySelector('button').onclick = () => removeAbsentee(regNo);
        currentAbsenteeListDiv.appendChild(item);
    });
}

function removeAbsentee(regNo) {
    currentAbsenteeList = currentAbsenteeList.filter(r => r !== regNo);
    saveAbsenteeList(sessionSelect.value);
    renderAbsenteeList();
}
// --- (V89) NEW QP CODE LOGIC (DIFFERENT STRATEGY) ---

// V89: Loads the *entire* QP code map from localStorage into the global var
function loadQPCodes() {
    qpCodeMap = JSON.parse(localStorage.getItem(QP_CODE_LIST_KEY) || '{}');
}

// V61: Populates the QP Code session dropdown
// *** FIX: This is the REAL implementation of the function Python calls ***
window.real_populate_qp_code_session_dropdown = function() {
    try {
        if (allStudentData.length === 0) {
             allStudentData = JSON.parse(jsonDataStore.innerHTML || '[]');
        }
        if (allStudentData.length === 0) {
            disable_qpcode_tab(true);
            return;
        }
        
        // Get unique sessions
        const sessions = new Set(allStudentData.map(s => `${s.Date} | ${s.Time}`));
        allStudentSessions = Array.from(sessions).sort();
        
        sessionSelectQP.innerHTML = '<option value="">-- Select a Session --</option>'; // Clear
        
        // Find today's session
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-GB').replace(/\//g, '.'); // DD.MM.YYYY
        let defaultSession = "";
        
        allStudentSessions.forEach(session => {
            sessionSelectQP.innerHTML += `<option value="${session}">${session}</option>`;
            if (session.startsWith(todayStr)) {
                defaultSession = session;
            }
        });
        
        if (defaultSession) {
            sessionSelectQP.value = defaultSession;
            sessionSelectQP.dispatchEvent(new Event('change')); // Trigger change to load course list
        }

    } catch (e) {
        console.error("Failed to populate QP sessions:", e);
        disable_qpcode_tab(true);
    }
}

// V61: Event listener for the QP Code session dropdown
sessionSelectQP.addEventListener('change', () => {
    const sessionKey = sessionSelectQP.value;
    if (sessionKey) {
        qpEntrySection.classList.remove('hidden');
        render_qp_code_list(sessionKey);
    } else {
        qpEntrySection.classList.add('hidden');
        qpCodeContainer.innerHTML = '';
        qpCodeStatus.textContent = '';
        saveQpCodesButton.disabled = true; // V62: Disable save button
    }
});

// V61: Renders the course list for the selected session
function render_qp_code_list(sessionKey) {
    
    // 1. Filter students for this specific session
    const [date, time] = sessionKey.split(' | ');
    const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
    
    // 2. Get unique courses for this session
    const sessionCourses = new Set(sessionStudents.map(s => s.Course));
    const uniqueCoursesArray = Array.from(sessionCourses).sort();
    
    // 3. V89: Load *all* codes, then get the ones for *this* session
    loadQPCodes();
    const sessionCodes = qpCodeMap[sessionKey] || {};
    
    // 4. Populate the UI
    const htmlChunks = [];
    
    if (uniqueCoursesArray.length === 0) {
        qpCodeContainer.innerHTML = '<p class="text-center text-gray-500">No courses found for this session.</p>';
        saveQpCodesButton.disabled = true; 
        return;
    }

    uniqueCoursesArray.forEach(courseName => {
        // --- MODIFIED TO USE Base64 KEY ---
        // 1. Create the new Base64 key
        const base64Key = getBase64CourseKey(courseName); 
        if (!base64Key) {
            console.warn(`Skipping QP code input for un-keyable course: ${courseName}`);
            return; // Skip this iteration
        }

        // 2. Look up the code using the Base64 key
        const savedCode = sessionCodes[base64Key] || "";

       htmlChunks.push(`
        <div class="flex items-center gap-3 p-2 border-b border-gray-200">
            <label class="font-medium text-gray-700 w-2/3 text-sm">${courseName}</label>
            <input type="text" 
                   class="qp-code-input block w-1/3 p-2 border border-gray-300 rounded-md shadow-sm text-sm" 
                   value="${savedCode}" 
                   data-course-key="${base64Key}"
                   placeholder="Enter QP Code">
        </div>
       `);
       // --- END MODIFICATION ---
    });
    
    qpCodeContainer.innerHTML = htmlChunks.join('');
    
    saveQpCodesButton.disabled = false;
    qpCodeStatus.textContent = ''; // Clear status on new load
}

// V89: NEW SAVE STRATEGY
saveQpCodesButton.addEventListener('click', () => {
    const sessionKey = sessionSelectQP.value;
    if (!sessionKey) {
        alert("No session selected.");
        return;
    }
    
    // V90 FIX: Ensure qpCodeMap is initialized before loading from storage
    if (typeof qpCodeMap === 'undefined') {
        qpCodeMap = {};
    }

    // 1. Load the entire master map from storage
    // This ensures we don't overwrite other sessions
    loadQPCodes(); 
    
    // 2. Create a new, empty map *just for this session's data*
    const thisSessionCodes = {};
    
    // 3. Read all inputs from the DOM
    const qpInputs = qpCodeContainer.querySelectorAll('.qp-code-input');
    
    // --- MODIFIED TO USE Base64 KEY ---
    for (let i = 0; i < qpInputs.length; i++) {
        const input = qpInputs[i];
        const base64Key = input.dataset.courseKey; // Read the Base64 key
        const qpCode = input.value.trim();

        if (base64Key && qpCode) {
            // Save using the Base64 key
            thisSessionCodes[base64Key] = qpCode;
        }
    }
    // --- END MODIFICATION ---

    // 4. Update the master map with the new data for this session
    qpCodeMap[sessionKey] = thisSessionCodes;

    // 5. Save the *entire* master map back to localStorage
    localStorage.setItem(QP_CODE_LIST_KEY, JSON.stringify(qpCodeMap));

    // 6. Show success message
    qpCodeStatus.classList.remove('text-red-600');
    qpCodeStatus.classList.add('text-green-600');
    qpCodeStatus.textContent = `QP Codes saved successfully!`;
    setTimeout(() => { qpCodeStatus.textContent = ""; }, 2000);
});

// V89: NEW INPUT STRATEGY
// The input listener is now *only* for user feedback.
// It does NOT update any data.
qpCodeContainer.addEventListener('input', (e) => {
    if (e.target.classList.contains('qp-code-input')) {
        // Show pending status
        qpCodeStatus.classList.remove('text-green-600');
        qpCodeStatus.classList.add('text-red-600');
        qpCodeStatus.textContent = 'Unsaved changes... Click SAVE QP CODES to commit.';
    }
});


// --- V68: Report Filter Logic ---
filterSessionRadio.addEventListener('change', () => {
    if (filterSessionRadio.checked) {
        reportsSessionDropdownContainer.classList.remove('hidden');
        reportsSessionSelect.value = reportsSessionSelect.options[1]?.value || ""; // Default to first session
    }
});

filterAllRadio.addEventListener('change', () => {
    if (filterAllRadio.checked) {
        reportsSessionDropdownContainer.classList.add('hidden');
        reportsSessionSelect.value = reportsSessionSelect.options[0]?.value || "all"; // Reset to All
    }
});

// --- NEW/MODIFIED RESET LOGIC (in Settings) ---
  
    // 1. Reset Student Data Only
    if (resetStudentDataButton) {
        resetStudentDataButton.addEventListener('click', () => {
            const confirmReset = confirm('Are you sure you want to reset all student data? This will clear the main data, absentees, QP codes, and all room allotments. Your College Name and Room Settings will be kept.');
            if (confirmReset) {
                localStorage.removeItem(BASE_DATA_KEY);
                localStorage.removeItem(ABSENTEE_LIST_KEY);
                localStorage.removeItem(QP_CODE_LIST_KEY);
                localStorage.removeItem(ROOM_ALLOTMENT_KEY);
                localStorage.removeItem(SCRIBE_LIST_KEY);
                localStorage.removeItem(SCRIBE_ALLOTMENT_KEY);
                alert('All student data and allotments have been cleared. The app will now reload.');
                window.location.reload();
            }
        });
    }

    // 2. Master Reset
    if (masterResetButton) {
        masterResetButton.addEventListener('click', () => {
            const step1 = confirm('WARNING: This will clear ALL saved data (Rooms, College Name, Absentees, QP Codes, and Base Data) from your browser. Continue?');
            if (!step1) return;
            
            const step2 = confirm('ARE YOU ABSOLUTELY SURE? This action cannot be undone.');
            if (step2) {
                localStorage.clear();
                alert('All local data cleared. The application will now reload.');
                window.location.reload();
            }
        });
    }
    // 3. Backup All Data
    if (backupDataButton) {
        backupDataButton.addEventListener('click', () => {
            const backupData = {};
            ALL_DATA_KEYS.forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    backupData[key] = data;
                }
            });

            if (Object.keys(backupData).length === 0) {
                alert("No data found in local storage to back up.");
                return;
            }

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            link.download = `UOC_Exam_Backup_${date}.json`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        });
    }

    // 4. Restore All Data
    if (restoreDataButton) {
        restoreDataButton.addEventListener('click', () => {
            const file = restoreFileInput.files[0];
            restoreStatus.textContent = '';

            if (!file) {
                restoreStatus.textContent = 'Please select a backup file first.';
                return;
            }

            if (!confirm('Are you sure you want to restore? This will OVERWRITE all current data.')) {
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const jsonString = event.target.result;
                    const restoredData = JSON.parse(jsonString);

                    // Clear existing data first
                    localStorage.clear();

                    // Restore data
                    for (const key in restoredData) {
                        if (Object.hasOwnProperty.call(restoredData, key)) {
                            localStorage.setItem(key, restoredData[key]);
                        }
                    }

                    alert('Restore successful! The application will now reload to apply the new data.');
                    window.location.reload();

                } catch (e) {
                    console.error("Error parsing restore file:", e);
                    restoreStatus.textContent = 'Error: The selected file is not a valid backup.';
                }
            };
            reader.onerror = () => {
                restoreStatus.textContent = 'Error reading the file.';
            };
            reader.readAsText(file);
        });
    }


// --- V65: Initial Data Load on Startup ---
function loadInitialData() {
    // 1. Load configuration and UI elements (Room settings, college name)
    // *** V91 FIX: Call loadRoomConfig to ensure collegeNameInput is populated ***
    loadRoomConfig(); 
    
    // 2. Check for base student data persistence
    const savedDataJson = localStorage.getItem(BASE_DATA_KEY);
    if (savedDataJson) {
        try {
            const savedData = JSON.parse(savedDataJson);
            if (savedData && savedData.length > 0) {
                
                // We create dummy data stores to allow reports to run
                const qPaperSummary = {};
                
                savedData.forEach(student => {
                    const key = `${student.Date}_${student.Time}_${student.Course}`;
                    if (!qPaperSummary[key]) {
                        qPaperSummary[key] = { 
                            Date: student.Date, 
                            Time: student.Time, 
                            Course: student.Course, 
                            'Student Count': 0 
                        };
                    }
                    qPaperSummary[key]['Student Count']++;
                });
                
                // Update JSON Data Stores
                jsonDataStore.innerHTML = JSON.stringify(savedData);
                qPaperDataStore.innerHTML = JSON.stringify(Object.values(qPaperSummary));
                
                // Enable UI tabs
                generateReportButton.disabled = false;
                generateQPaperReportButton.disabled = false;
                generateQpDistributionReportButton.disabled = false; // <-- ADD THIS
                generateDaywiseReportButton.disabled = false;
                generateScribeReportButton.disabled = false; // <-- NEW
                generateScribeProformaButton.disabled = false; // <-- ADD THIS
                generateInvigilatorReportButton.disabled = false; // <-- ADD THIS
                disable_absentee_tab(false);
                disable_qpcode_tab(false);
                disable_room_allotment_tab(false);
                disable_scribe_settings_tab(false); // <-- MODIFIED
                
                populate_session_dropdown();
                populate_qp_code_session_dropdown();
                populate_room_allotment_session_dropdown();
                loadGlobalScribeList(); // <-- NEW
                // *** NEW: Enable Edit Data Tab ***
                disable_edit_data_tab(false);
                // *********************************
                console.log(`Successfully loaded ${savedData.length} records from local storage.`);
                
                // Update log status (Optional, good for user feedback)
                document.getElementById("status-log").innerHTML = `<p class="mb-1 text-green-700">&gt; [${new Date().toLocaleTimeString()}] Successfully loaded data from previous session.</p>`;
                document.getElementById("status-log").scrollTop = document.getElementById("status-log").scrollHeight;


            }
        } catch(e) {
            console.error("Failed to load BASE_DATA_KEY from localStorage. Clearing key.", e);
            localStorage.removeItem(BASE_DATA_KEY);
        }
    }
}

// --- ROOM ALLOTMENT FUNCTIONALITY ---

// *** FIX: This is the REAL implementation of the function Python calls ***
window.real_populate_room_allotment_session_dropdown = function() {
    try {
        if (allStudentData.length === 0) {
            allStudentData = JSON.parse(jsonDataStore.innerHTML || '[]');
        }
        if (allStudentData.length === 0) {
            disable_room_allotment_tab(true);
            return;
        }
        
        // Get unique sessions
        const sessions = new Set(allStudentData.map(s => `${s.Date} | ${s.Time}`));
        allStudentSessions = Array.from(sessions).sort();
        
        allotmentSessionSelect.innerHTML = '<option value="">-- Select a Session --</option>';
        
        // Find today's session
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-GB').replace(/\//g, '.'); // DD.MM.YYYY
        let defaultSession = "";
        
        allStudentSessions.forEach(session => {
            allotmentSessionSelect.innerHTML += `<option value="${session}">${session}</option>`;
            if (session.startsWith(todayStr)) {
                defaultSession = session;
            }
        });
        
        // Set default to today if found
        if (defaultSession) {
            allotmentSessionSelect.value = defaultSession;
            allotmentSessionSelect.dispatchEvent(new Event('change'));
        }
        
        disable_room_allotment_tab(false);
    } catch (e) {
        console.error("Failed to populate room allotment sessions:", e);
        disable_room_allotment_tab(true);
    }
}

// Load Room Allotment for a session
function loadRoomAllotment(sessionKey) {
    currentSessionKey = sessionKey;
    const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
    currentSessionAllotment = allAllotments[sessionKey] || [];
    updateAllotmentDisplay();
}

// Save Room Allotment for a session
function saveRoomAllotment() {
    const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
    allAllotments[currentSessionKey] = currentSessionAllotment;
    localStorage.setItem(ROOM_ALLOTMENT_KEY, JSON.stringify(allAllotments));
}

// Update the display with current allotment status
function updateAllotmentDisplay() {
    const [date, time] = currentSessionKey.split(' | ');
    const sessionStudentRecords = allStudentData.filter(s => s.Date === date && s.Time === time);    
    // *** FIX: Include scribe students in count - they occupy space in original room ***
    const uniqueRegNos = new Set(sessionStudentRecords.map(s => s['Register Number']));
    const totalStudents = uniqueRegNos.size;    // ***************************************************
    
    // Calculate allotted students
    let allottedCount = 0;
    currentSessionAllotment.forEach(room => {
        allottedCount += room.students.length;
    });
    
    const remainingCount = totalStudents - allottedCount;
    
    // Update counts
    totalStudentsCount.textContent = totalStudents;
    allottedStudentsCount.textContent = allottedCount;
    remainingStudentsCount.textContent = remainingCount;
    
    // Show/hide sections
    allotmentStudentCountSection.classList.remove('hidden');
    
    if (remainingCount > 0) {
        addRoomSection.classList.remove('hidden');
    } else {
        addRoomSection.classList.add('hidden');
    }
    
    // Render allotted rooms
    renderAllottedRooms();
    
    // Show save section if there are allotments
    if (currentSessionAllotment.length > 0) {
        allottedRoomsSection.classList.remove('hidden');
        saveAllotmentSection.classList.remove('hidden');
    } else {
        allottedRoomsSection.classList.add('hidden');
        saveAllotmentSection.classList.add('hidden');
    }
}

// Render the list of allotted rooms (WITH SERIAL NUMBER)
function renderAllottedRooms() {
    allottedRoomsList.innerHTML = '';
    
    // --- NEW: Get Serial Map ---
    const roomSerialMap = getRoomSerialMap(currentSessionKey);
    // ---------------------------

    if (currentSessionAllotment.length === 0) {
        allottedRoomsList.innerHTML = '<p class="text-gray-500 text-sm">No rooms allotted yet.</p>';
        return;
    }
    
    currentSessionAllotment.forEach((room, index) => {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'bg-gray-50 border border-gray-200 rounded-lg p-4';
        
        const roomInfo = currentRoomConfig[room.roomName];
        const location = (roomInfo && roomInfo.location) ? ` (${roomInfo.location})` : '';
        
        // --- NEW: Get Serial Number ---
        const serialNo = roomSerialMap[room.roomName] || '-';
        
        roomDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-grow">
                    <h4 class="font-semibold text-gray-800">${serialNo} | ${room.roomName}${location}</h4>
                    <p class="text-sm text-gray-600">Capacity: ${room.capacity} | Allotted: ${room.students.length}</p>
                </div>
                <button class="text-red-600 hover:text-red-800 font-medium text-sm" onclick="deleteRoom(${index})">
                    Delete
                </button>
            </div>
        `;
        
        allottedRoomsList.appendChild(roomDiv);
    });
}

// Delete a room from allotment
window.deleteRoom = function(index) {
    if (confirm('Are you sure you want to remove this room allotment?')) {
        currentSessionAllotment.splice(index, 1);
        updateAllotmentDisplay();
    }
};

// Show room selection modal
function showRoomSelectionModal() {
    // Get room config
    getRoomCapacitiesFromStorage();
    
    roomSelectionList.innerHTML = '';
    
    // Get already allotted room names
    const allottedRoomNames = currentSessionAllotment.map(r => r.roomName);
    
    // Sort rooms numerically
    const sortedRoomNames = Object.keys(currentRoomConfig).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
    });
    
    sortedRoomNames.forEach(roomName => {
        const room = currentRoomConfig[roomName];
        const location = room.location ? ` (${room.location})` : '';
        
        // Check if already allotted
        const isAllotted = allottedRoomNames.includes(roomName);
        
        const roomOption = document.createElement('div');
        roomOption.className = `p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-blue-50 ${isAllotted ? 'opacity-50 cursor-not-allowed' : ''}`;
        roomOption.innerHTML = `
            <div class="font-medium text-gray-800">${roomName}${location}</div>
            <div class="text-sm text-gray-600">Capacity: ${room.capacity}</div>
            ${isAllotted ? '<div class="text-xs text-red-600 mt-1">Already allotted</div>' : ''}
        `;
        
        if (!isAllotted) {
            roomOption.onclick = () => selectRoomForAllotment(roomName, room.capacity);
        }
        
        roomSelectionList.appendChild(roomOption);
    });
    
    roomSelectionModal.classList.remove('hidden');
}

// Select a room and allot students
function selectRoomForAllotment(roomName, capacity) {
    const [date, time] = currentSessionKey.split(' | ');
    const sessionStudentRecords = allStudentData.filter(s => s.Date === date && s.Time === time);
    const uniqueSessionRegNos = new Set(sessionStudentRecords.map(s => s['Register Number']));
    
    // *** FIX: Check if this room already has students allocated ***
    const existingRoom = currentSessionAllotment.find(r => r.roomName === roomName);
    if (existingRoom) {
        alert(`Room ${roomName} already has ${existingRoom.students.length} students allocated. Please delete the existing allocation first if you want to reallocate.`);
        roomSelectionModal.classList.add('hidden');
        return;
    }
    // ******************************************************
    
    // Get already allotted student register numbers
    const allottedRegNos = new Set();
    currentSessionAllotment.forEach(room => {
        room.students.forEach(regNo => allottedRegNos.add(regNo));
    });

    // Get unallotted students (including scribes)
    const unallottedRegNos = [];
for (const regNo of uniqueSessionRegNos) {
    if (!allottedRegNos.has(regNo)) {
        unallottedRegNos.push(regNo);
    }
}
    
    // Allot up to capacity
    const regNosToAllot = unallottedRegNos.slice(0, capacity);
    
    // *** FIX: Renamed this variable from 'allottedRegNos' to 'newStudentRegNos' ***
    const newStudentRegNos = regNosToAllot;
    
    // Add to current session allotment
    currentSessionAllotment.push({
        roomName: roomName,
        capacity: capacity,
        students: newStudentRegNos // <-- Use the new, correct variable name
    });
    
    // Close modal and update display
    roomSelectionModal.classList.add('hidden');
    updateAllotmentDisplay();
}

// Event Listeners for Room Allotment
allotmentSessionSelect.addEventListener('change', () => {
    const sessionKey = allotmentSessionSelect.value;
    if (sessionKey) {
        loadRoomAllotment(sessionKey);
        loadScribeAllotment(sessionKey); // <-- ADDED: Load scribe data at the same time
    } else {
        // Hide all sections
        allotmentStudentCountSection.classList.add('hidden');
        addRoomSection.classList.add('hidden');
        allottedRoomsSection.classList.add('hidden');
        saveAllotmentSection.classList.add('hidden');
        scribeAllotmentListSection.classList.add('hidden'); // <-- ADDED
    }
});

addRoomAllotmentButton.addEventListener('click', () => {
    showRoomSelectionModal();
});

closeRoomModal.addEventListener('click', () => {
    roomSelectionModal.classList.add('hidden');
});

saveRoomAllotmentButton.addEventListener('click', () => {
    saveRoomAllotment();
    roomAllotmentStatus.textContent = 'Room allotment saved successfully!';
    setTimeout(() => { roomAllotmentStatus.textContent = ''; }, 2000);
});

// --- END ROOM ALLOTMENT FUNCTIONALITY ---


// *** NEW: SCRIBE FUNCTIONALITY ***

// *** FIX: This is the REAL implementation of the function Python calls ***
window.real_loadGlobalScribeList = function() {
    globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
    renderGlobalScribeList();
}

// Render the global list in "Scribe Settings"
function renderGlobalScribeList() {
    if (!currentScribeListDiv) return; // Guard clause
    currentScribeListDiv.innerHTML = "";
    if (globalScribeList.length === 0) {
        currentScribeListDiv.innerHTML = `<em class="text-gray-500">No students added to the scribe list.</em>`;
        return;
    }
    
    globalScribeList.forEach(student => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-2 bg-white border border-gray-200 rounded';
        item.innerHTML = `
            <div>
                <span class="font-medium">${student.regNo}</span>
                <span class="text-sm text-gray-600 ml-2">${student.name}</span>
            </div>
            <button class="text-xs text-red-600 hover:text-red-800 font-medium">&times; Remove</button>
        `;
        item.querySelector('button').onclick = () => removeScribeStudent(student.regNo);
        currentScribeListDiv.appendChild(item);
    });
}

// Remove a student from the global list
function removeScribeStudent(regNo) {
    globalScribeList = globalScribeList.filter(s => s.regNo !== regNo);
    localStorage.setItem(SCRIBE_LIST_KEY, JSON.stringify(globalScribeList));
    renderGlobalScribeList();
    // Also re-render allotment list if that view is active
    if (allotmentSessionSelect.value) { // MODIFIED: Check the main allotment dropdown
        renderScribeAllotmentList(allotmentSessionSelect.value);
    }
}

// Scribe Search Autocomplete
// --- THIS IS THE REPLACED, CORRECTED FUNCTION ---
scribeSearchInput.addEventListener('input', () => {
    const query = scribeSearchInput.value.trim().toUpperCase();
    scribeAutocompleteResults.innerHTML = ''; // Clear previous results

    if (query.length < 2) { // Start searching after 2 characters
        scribeAutocompleteResults.classList.add('hidden');
        return;
    }
    
    // Filter the *unique* list by RegNo or Name
    const matches = allUniqueStudentsForScribeSearch.filter(s => 
        s.regNo.toUpperCase().includes(query) || 
        s.name.toUpperCase().includes(query)
    ).slice(0, 50); // Limit to 50 results for performance
    
    if (matches.length > 0) {
        matches.forEach(student => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            
            // Create a safe regex to highlight the query
            const queryRegex = new RegExp(query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
            
            // Highlight matching parts in both RegNo and Name
            const regDisplay = student.regNo.replace(queryRegex, '<strong>$&</strong>');
            const nameDisplay = student.name.replace(queryRegex, '<strong>$&</strong>');
            
            item.innerHTML = `${regDisplay} (${nameDisplay})`;
            
            // When clicked, pass the student object to the select function
            item.onclick = () => selectScribeStudent({ 
                'Register Number': student.regNo, 
                'Name': student.name 
            });
            scribeAutocompleteResults.appendChild(item);
        });
        scribeAutocompleteResults.classList.remove('hidden');
    } else {
        scribeAutocompleteResults.classList.add('hidden');
    }
});
// --- END OF REPLACED FUNCTION ---


// Select a student from autocomplete
let selectedScribeStudent = null;
function selectScribeStudent(student) {
    selectedScribeStudent = student;
    scribeSearchInput.value = student['Register Number'];
    scribeAutocompleteResults.classList.add('hidden');
    
    scribeSelectedStudentName.textContent = student.Name;
    scribeSelectedStudentRegno.textContent = student['Register Number'];
    scribeSelectedStudentDetails.classList.remove('hidden');
}

// Add Scribe Student button click
addScribeStudentButton.addEventListener('click', () => {
    if (!selectedScribeStudent) return;
    
    const regNo = selectedScribeStudent['Register Number'];
    
    // Check if already on list
    if (globalScribeList.some(s => s.regNo === regNo)) {
        alert(`${regNo} is already on the scribe list.`);
        clearScribeSearch();
        return;
    }
    
    // Add to list and save
    globalScribeList.push({ regNo: regNo, name: selectedScribeStudent.Name });
    localStorage.setItem(SCRIBE_LIST_KEY, JSON.stringify(globalScribeList));
    
    renderGlobalScribeList();
    clearScribeSearch();
});

function clearScribeSearch() {
    selectedScribeStudent = null;
    scribeSearchInput.value = "";
    scribeAutocompleteResults.classList.add('hidden');
    scribeSelectedStudentDetails.classList.add('hidden');
}

// --- Scribe Allotment Page Logic (MOVED) ---

// NEW FUNCTION: This loads the scribe allotment data for the session
function loadScribeAllotment(sessionKey) {
    // *** FIX: Ensure global scribe list is loaded before checking length ***
    if (globalScribeList.length === 0) {
        globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
    }
    // **********************************************************************

    if (sessionKey && globalScribeList.length > 0) {
        // Load the allotments for this session
        const allAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        currentScribeAllotment = allAllotments[sessionKey] || {};
        
        scribeAllotmentListSection.classList.remove('hidden');
        renderScribeAllotmentList(sessionKey);
    } else {
        scribeAllotmentListSection.classList.add('hidden');
        scribeAllotmentList.innerHTML = "";
    }
}


// Render the list of scribe students for the selected session (WITH SERIAL NUMBER)
function renderScribeAllotmentList(sessionKey) {
    const [date, time] = sessionKey.split(' | ');
    const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
    
    // Filter to get only scribe students *in this session*
    const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));
    const sessionScribeStudents = sessionStudents.filter(s => scribeRegNos.has(s['Register Number']));

    scribeAllotmentList.innerHTML = '';
    if (sessionScribeStudents.length === 0) {
        scribeAllotmentList.innerHTML = '<p class="text-gray-500 text-sm">No students from the global scribe list are in this session.</p>';
        return;
    }

    const uniqueSessionScribeStudents = [];
    const seenRegNos = new Set();
    for (const student of sessionScribeStudents) {
        if (!seenRegNos.has(student['Register Number'])) {
            seenRegNos.add(student['Register Number']);
            uniqueSessionScribeStudents.push(student);
        }
    }
    
    uniqueSessionScribeStudents.sort((a,b) => a['Register Number'].localeCompare(b['Register Number']));

    // --- NEW: Get Serial Map (Needed to look up serial number when rendering) ---
    const roomSerialMap = getRoomSerialMap(sessionKey);
    // ---------------------------------------------------------------------------

    uniqueSessionScribeStudents.forEach(student => {
        const regNo = student['Register Number'];
        const allottedRoom = currentScribeAllotment[regNo];
        
        const item = document.createElement('div');
        item.className = 'bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center';
        
        let roomHtml = '';
        if (allottedRoom) {
            // --- NEW: Format Room Display with Serial Number ---
            const serialNo = roomSerialMap[allottedRoom] || '-';
            const roomInfo = currentRoomConfig[allottedRoom];
            const location = (roomInfo && roomInfo.location) ? ` (${roomInfo.location})` : '';
            const displayRoom = `${serialNo} | ${allottedRoom}${location}`;
            // ----------------------------------------------------

            roomHtml = `
                <div>
                    <span class="text-sm font-medium text-gray-700">Allotted Room:</span>
                    <span class="font-bold text-blue-600 ml-2">${displayRoom}</span>
                </div>
                <button class="ml-4 inline-flex justify-center items-center rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        onclick="openScribeRoomModal('${regNo}', '${student.Name}')">
                    Change
                </button>
            `;
        } else {
            roomHtml = `
                <button class="inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 py-2 px-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                        onclick="openScribeRoomModal('${regNo}', '${student.Name}')">
                    Assign Room
                </button>
            `;
        }
        
        item.innerHTML = `
            <div>
                <h4 class="font-semibold text-gray-800">${regNo}</h4>
                <p class="text-sm text-gray-600">${student.Name}</p>
            </div>
            <div class="flex items-center">
                ${roomHtml}
            </div>
        `;
        scribeAllotmentList.appendChild(item);
    });
}

// Find available rooms for scribes
async function findAvailableRooms(sessionKey) {
    
    // 1. Get all "master" rooms from your settings
    getRoomCapacitiesFromStorage(); // Populates currentRoomConfig
    const masterRoomNames = new Set(Object.keys(currentRoomConfig));

    // 2. Get all rooms used by "Manual Allotment" FOR THIS SESSION
    const allManualAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
    const sessionManualAllotment = allManualAllotments[sessionKey] || [];
    
    // 3. Remove only the manually allotted rooms from the list
    sessionManualAllotment.forEach(room => {
        masterRoomNames.delete(room.roomName);
    });
    
    // 4. Return the remaining list, sorted numerically
    return Array.from(masterRoomNames).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
    });
}


// Open the Scribe Room Modal
window.openScribeRoomModal = async function(regNo, studentName) {
    studentToAllotScribeRoom = regNo;
    scribeRoomModalTitle.textContent = `Select Room for ${studentName} (${regNo})`;
    
    const sessionKey = allotmentSessionSelect.value; // MODIFIED: Use main allotment selector

    // --- NEW: Calculate current scribe room counts ---
    const roomCounts = {};
    // currentScribeAllotment is already loaded for this session
    for (const studentRegNo in currentScribeAllotment) {
        const roomName = currentScribeAllotment[studentRegNo];
        if (roomName) {
            roomCounts[roomName] = (roomCounts[roomName] || 0) + 1;
        }
    }
    // --- END NEW ---
    
    const availableRooms = await findAvailableRooms(sessionKey);
    
    scribeRoomSelectionList.innerHTML = '';
    if (availableRooms.length === 0) {
        scribeRoomSelectionList.innerHTML = '<p class="text-center text-red-600">No available rooms found for this session.</p>';
    } else {
        availableRooms.forEach(roomName => {
            const room = currentRoomConfig[roomName];
            const location = room.location ? ` (${room.location})` : '';
            
            // --- NEW: Get the count for this room ---
            const count = roomCounts[roomName] || 0;
            // --- END NEW ---

            const roomOption = document.createElement('div');
            roomOption.className = 'p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-blue-50';
            
// --- MODIFIED: Add count to innerHTML ---
            roomOption.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="font-medium text-gray-800">${roomName}${location}</div>
                    <div class="text-sm font-bold text-blue-600">Allotted: ${count}</div>
                </div>
                <div class="text-sm text-gray-600">Capacity: ${room.capacity}</div>
            `;
            // --- END MODIFIED ---
            
            roomOption.onclick = () => selectScribeRoom(roomName);
            scribeRoomSelectionList.appendChild(roomOption);
        });
    }
    
    scribeRoomModal.classList.remove('hidden');
}

// Select a room from the modal
function selectScribeRoom(roomName) {
    if (!studentToAllotScribeRoom) return;
    
    const sessionKey = allotmentSessionSelect.value; // MODIFIED: Use main allotment selector
    
    // Add to this session's allotment
    currentScribeAllotment[studentToAllotScribeRoom] = roomName;
    
    // Save back to localStorage
    const allAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
    allAllotments[sessionKey] = currentScribeAllotment;
    localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(allAllotments));
    
    // Close modal and re-render list
    scribeRoomModal.classList.add('hidden');
    renderScribeAllotmentList(sessionKey);
    studentToAllotScribeRoom = null;
}

scribeCloseRoomModal.addEventListener('click', () => {
    scribeRoomModal.classList.add('hidden');
    studentToAllotScribeRoom = null;
});

// **********************************

// --- Helper function to disable all report buttons ---
// *** FIX: This is the REAL implementation of the function Python calls ***
window.real_disable_all_report_buttons = function(disabled) {
    if (generateReportButton) generateReportButton.disabled = disabled;
    if (generateQPaperReportButton) generateQPaperReportButton.disabled = disabled;
    if (generateDaywiseReportButton) generateDaywiseReportButton.disabled = disabled;
    if (generateScribeReportButton) generateScribeReportButton.disabled = disabled;
    if (generateScribeProformaButton) generateScribeProformaButton.disabled = disabled;
    if (generateQpDistributionReportButton) generateQpDistributionReportButton.disabled = disabled;
    if (generateInvigilatorReportButton) generateInvigilatorReportButton.disabled = disabled;
}

// --- NEW: STUDENT DATA EDIT FUNCTIONALITY (MODAL VERSION) ---

let editCurrentPage = 1;
const STUDENTS_PER_EDIT_PAGE = 10;
let currentEditSession = '';
let currentEditCourse = '';
let currentCourseStudents = []; // This will hold the "working copy" of students
let hasUnsavedEdits = false;
let currentlyEditingIndex = null; // Store the index of the student being edited

// Get the "Add Student" button from the HTML
const addNewStudentBtn = document.getElementById('add-new-student-btn');

// Get references to the new modal elements
const studentEditModal = document.getElementById('student-edit-modal');
const modalTitle = document.getElementById('student-edit-modal-title');
const modalDate = document.getElementById('modal-edit-date');
const modalTime = document.getElementById('modal-edit-time');
const modalCourse = document.getElementById('modal-edit-course');
const modalRegNo = document.getElementById('modal-edit-regno');
const modalName = document.getElementById('modal-edit-name');
const modalSaveBtn = document.getElementById('modal-save-student');
const modalCancelBtn = document.getElementById('modal-cancel-student');

// 1. Session selection (Same as before)
editSessionSelect.addEventListener('change', () => {
    currentEditSession = editSessionSelect.value;
    editDataContainer.innerHTML = '';
    editPaginationControls.classList.add('hidden');
    editSaveSection.classList.add('hidden');
    addNewStudentBtn.classList.add('hidden');
    
    if (currentEditSession) {
        // Populate course dropdown
        const [date, time] = currentEditSession.split(' | ');
        const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
        const courses = [...new Set(sessionStudents.map(s => s.Course))].sort();
        
    editCourseSelect.innerHTML = ''; // Clear it completely
    // Add the default "Select" option
    editCourseSelect.appendChild(new Option('-- Select a Course --', ''));
    // Add each course option safely
    courses.forEach(course => {
        // new Option(text, value)
        editCourseSelect.appendChild(new Option(course, course));
    });

    editCourseSelectContainer.classList.remove('hidden');
    } else {
        editCourseSelectContainer.classList.add('hidden');
    }
});

// 2. Course selection (Updated with Student Count)
editCourseSelect.addEventListener('change', () => {
    currentEditCourse = editCourseSelect.value;
    editCurrentPage = 1;
    hasUnsavedEdits = false; 

    // Get reference to count display or create it
    let countDisplay = document.getElementById('edit-student-count');
    if (!countDisplay && addNewStudentBtn) {
        countDisplay = document.createElement('div');
        countDisplay.id = 'edit-student-count';
        countDisplay.className = 'mb-2 font-bold text-blue-700 text-sm';
        // Insert just before the "Add New Student" button
        addNewStudentBtn.parentNode.insertBefore(countDisplay, addNewStudentBtn);
    }

    if (currentEditCourse) {
        const [date, time] = currentEditSession.split(' | ');
        currentCourseStudents = allStudentData
            .filter(s => s.Date === date && s.Time === time && s.Course === currentEditCourse)
            .map(s => ({ ...s })); 
        
        // Update Count Text
        if (countDisplay) {
            countDisplay.textContent = `Total Students Mapped: ${currentCourseStudents.length}`;
            countDisplay.classList.remove('hidden');
        }
        
        renderStudentEditTable();
        editSaveSection.classList.remove('hidden');
        addNewStudentBtn.classList.remove('hidden');
    } else {
        editDataContainer.innerHTML = '';
        editPaginationControls.classList.add('hidden');
        editSaveSection.classList.add('hidden');
        addNewStudentBtn.classList.add('hidden');
        if (countDisplay) countDisplay.classList.add('hidden');
    }
});

// 3. Render Table (NEW: With Serial Number)
function renderStudentEditTable() {
    editDataContainer.innerHTML = '';
    if (currentCourseStudents.length === 0) {
        editDataContainer.innerHTML = '<p class="text-gray-500">No students found for this course.</p>';
        editPaginationControls.classList.add('hidden');
        return;
    }

    const start = (editCurrentPage - 1) * STUDENTS_PER_EDIT_PAGE;
    const end = start + STUDENTS_PER_EDIT_PAGE;
    const pageStudents = currentCourseStudents.slice(start, end);

    let tableHtml = `
        <table class="edit-data-table">
            <thead>
                <tr>
                    <th>Sl No</th> <th>Date</th>
                    <th>Time</th>
                    <th>Course</th>
                    <th>Register Number</th>
                    <th>Name</th>
                    <th class="actions-cell">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    pageStudents.forEach((student, index) => {
        const uniqueRowIndex = start + index; 
        const serialNo = uniqueRowIndex + 1; // Calculate Serial Number
        
        tableHtml += `
            <tr data-row-index="${uniqueRowIndex}">
                <td>${serialNo}</td> <td>${student.Date}</td>
                <td>${student.Time}</td>
                <td>${student.Course}</td>
                <td>${student['Register Number']}</td>
                <td>${student.Name}</td>
                <td class="actions-cell">
                    <button class="edit-row-btn text-sm text-blue-600 hover:text-blue-800">Edit</button>
                    <button class="delete-row-btn text-sm text-red-600 hover:text-red-800 ml-2">Delete</button>
                </td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    editDataContainer.innerHTML = tableHtml;
    renderEditPagination(currentCourseStudents.length);
}

// 4. Render Pagination (Same as before)
function renderEditPagination(totalStudents) {
    if (totalStudents <= STUDENTS_PER_EDIT_PAGE) {
        editPaginationControls.classList.add('hidden');
        return;
    }
    editPaginationControls.classList.remove('hidden');
    const totalPages = Math.ceil(totalStudents / STUDENTS_PER_EDIT_PAGE);
    editPageInfo.textContent = `Page ${editCurrentPage} of ${totalPages}`;
    editPrevPage.disabled = (editCurrentPage === 1);
    editNextPage.disabled = (editCurrentPage === totalPages);
}
editPrevPage.addEventListener('click', () => {
    if (editCurrentPage > 1) {
        editCurrentPage--;
        renderStudentEditTable();
    }
});
editNextPage.addEventListener('click', () => {
    const totalPages = Math.ceil(currentCourseStudents.length / STUDENTS_PER_EDIT_PAGE);
    if (editCurrentPage < totalPages) {
        editCurrentPage++;
        renderStudentEditTable();
    }
});

// 5. "Add New Student" button listener (NEW: Opens modal)
addNewStudentBtn.addEventListener('click', () => {
    openStudentEditModal(null); // Pass null to indicate a new student
});

// 6. Handle Edit/Delete Clicks (NEW: Opens modal)
editDataContainer.addEventListener('click', (e) => {
    const target = e.target;
    if (!target.closest('tr')) return; // Guard clause if click is not on a row
    const rowIndex = target.closest('tr').dataset.rowIndex;
    if (rowIndex === undefined) return; // Guard clause

    if (target.classList.contains('edit-row-btn')) {
        // --- Open Edit Modal ---
        openStudentEditModal(rowIndex);

    } else if (target.classList.contains('delete-row-btn')) {
        // --- Delete Row ---
        if (confirm('Are you sure you want to delete this student record? This change will be temporary until you click "Save All Changes".')) {
            currentCourseStudents.splice(rowIndex, 1); // Remove from the array
            renderStudentEditTable(); // Re-render the table
            setUnsavedChanges(true);
        }
    }
});

// 7. NEW Function: Open the Edit/Add Modal
function openStudentEditModal(rowIndex) {
    if (rowIndex === null) {
        // --- ADDING A NEW STUDENT ---
        modalTitle.textContent = "Add New Student";
        currentlyEditingIndex = null; // Signal that this is a new student
        
        // Pre-fill with session defaults
        const [date, time] = currentEditSession.split(' | ');
        modalDate.value = date;
        modalTime.value = time;
        modalCourse.value = currentEditCourse;
        modalRegNo.value = "ENTER_REG_NO";
        modalName.value = "New Student";

    } else {
        // --- EDITING AN EXISTING STUDENT ---
        modalTitle.textContent = "Edit Student Details";
        currentlyEditingIndex = rowIndex; // Store the index
        
        // Get the student data and pre-fill the form
        const student = currentCourseStudents[rowIndex];
        modalDate.value = student.Date;
        modalTime.value = student.Time;
        modalCourse.value = student.Course;
        modalRegNo.value = student['Register Number'];
        modalName.value = student.Name;
    }
    // Show the modal
    studentEditModal.classList.remove('hidden');
}

// 8. NEW Function: Close the modal
function closeStudentEditModal() {
    studentEditModal.classList.add('hidden');
    currentlyEditingIndex = null;
}

// 9. NEW Event Listeners for Modal Buttons
modalCancelBtn.addEventListener('click', closeStudentEditModal);

modalSaveBtn.addEventListener('click', () => {
    // Read all values from the modal
    const newDate = modalDate.value.trim();
    const newTime = modalTime.value.trim();
    const newCourse = modalCourse.value.trim();
    const newRegNo = modalRegNo.value.trim();
    const newName = modalName.value.trim();

    if (!newRegNo || !newName || !newDate || !newTime || !newCourse) {
        alert('All fields must be filled.');
        return;
    }

    // Ask for confirmation
    if (confirm("Are you sure you want to save these changes?")) {
        
        if (currentlyEditingIndex !== null) {
            // --- We are EDITING an existing student ---
            currentCourseStudents[currentlyEditingIndex] = {
                Date: newDate,
                Time: newTime,
                Course: newCourse,
                'Register Number': newRegNo,
                Name: newName
            };
        } else {
            // --- We are ADDING a new student ---
            currentCourseStudents.push({
                Date: newDate,
                Time: newTime,
                Course: newCourse,
                'Register Number': newRegNo,
                Name: newName
            });
        }
        
        setUnsavedChanges(true); // Mark that we have unsaved work
        closeStudentEditModal(); // Close the modal
        renderStudentEditTable(); // Re-render the table to show changes
    }
});

// 10. Save All Changes to LocalStorage (The "Master Save" - Unchanged)
saveEditDataButton.addEventListener('click', () => {
    if (!hasUnsavedEdits) {
        editDataStatus.textContent = 'No changes to save.';
        setTimeout(() => { editDataStatus.textContent = ''; }, 3000);
        return;
    }

    if (confirm('This will permanently save all edits, additions, and deletions for this course/session to the main data source. Continue?')) {
        
        const [date, time] = currentEditSession.split(' | ');
        const course = currentEditCourse;

        // 1. Filter out ALL students from the original data that match this session/course
        const otherStudents = allStudentData.filter(s => 
            !(s.Date === date && s.Time === time && s.Course === course)
        );

        // 2. Create the new master list
        const updatedAllStudentData = [...otherStudents, ...currentCourseStudents];
        
        // 3. Update the global variable and localStorage
        allStudentData = updatedAllStudentData;
        localStorage.setItem(BASE_DATA_KEY, JSON.stringify(allStudentData));
        
        editDataStatus.textContent = 'All changes saved successfully!';
        setUnsavedChanges(false);
        setTimeout(() => { editDataStatus.textContent = ''; }, 3000);
        
        // 4. Reload other parts of the app
        jsonDataStore.innerHTML = JSON.stringify(allStudentData);
        updateUniqueStudentList();
        populate_session_dropdown();
        populate_qp_code_session_dropdown();
        populate_room_allotment_session_dropdown();

        // 5. Reload the current view
        currentCourseStudents = allStudentData
            .filter(s => s.Date === date && s.Time === time && s.Course === course)
            .map(s => ({ ...s }));
        
        renderStudentEditTable();
    }
});

// 11. Helper function to manage "unsaved" status (Unchanged)
function setUnsavedChanges(status) {
    hasUnsavedEdits = status;
    if (status) {
        editDataStatus.textContent = 'You have unsaved changes. Click "Save All Changes" to commit.';
    } else {
        editDataStatus.textContent = 'All changes saved.'; // Give clear feedback
    }
}

// --- END: STUDENT DATA EDIT FUNCTIONALITY ---


// *** NEW: Event listener for Invigilator Report ***
generateInvigilatorReportButton.addEventListener('click', async () => {
    generateInvigilatorReportButton.disabled = true;
    generateInvigilatorReportButton.textContent = "Calculating...";
    reportOutputArea.innerHTML = "";
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = "";
    lastGeneratedReportType = "";
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
        loadGlobalScribeList(); // <-- ADD THIS LINE
        // 1. Get College Name
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        
        // 2. Get FILTERED RAW student data
        const data = getFilteredReportData('invigilator-summary');
        if (data.length === 0) {
            alert("No data found for the selected filter/session.");
            return;
        }
        
        // 3. Get global scribe list
        const globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
        const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));
        
        // 4. Collate stats for each session
        const sessionStats = {};
        
        for (const student of data) {
            const sessionKey = `${student.Date} | ${student.Time}`;
            
            // Initialize session if it's new
            if (!sessionStats[sessionKey]) {
                sessionStats[sessionKey] = {
                    date: student.Date,
                    time: student.Time,
                    regularStudents: 0,
                    scribeStudents: 0
                };
            }

            // 5. Check if student is a scribe
            const isScribe = scribeRegNos.has(student['Register Number']);
            
            if (isScribe) {
                sessionStats[sessionKey].scribeStudents++;
            } else {
                sessionStats[sessionKey].regularStudents++;
            }
        }
        
        // 6. Calculate invigilators for the report
        const reportData = [];
        for (const sessionKey in sessionStats) {
            const stats = sessionStats[sessionKey];
            
            // Logic: 1 invigilator per 30 regular students
            const regularInvigilators = Math.ceil(stats.regularStudents / 30);
            
            // Logic: 1 invigilator per 5 scribe students
            const scribeInvigilators = Math.ceil(stats.scribeStudents / 5);
            
            const totalInvigilators = regularInvigilators + scribeInvigilators;
            
            reportData.push({
                session: sessionKey,
                regularStudents: stats.regularStudents,
                regularInvigilators: regularInvigilators,
                scribeStudents: stats.scribeStudents,
                scribeInvigilators: scribeInvigilators,
                totalInvigilators: totalInvigilators
            });
        }
        
        // Sort by session
        reportData.sort((a, b) => a.session.localeCompare(b.session));
        
        // 7. Build HTML
        let allPagesHtml = '';
        
        allPagesHtml += `
            <div class="print-page">
                <div class="print-header-group">
                    <h1>${currentCollegeName}</h1>
                    <h2>Invigilator Requirement Summary</h2>
                    <h3 style="font-size: 11pt; font-style: italic;">
                        Calculation: 1 per 30 Regular Students, 1 per 5 Scribe Students
                    </h3>
                </div>
                
                <table class="invigilator-report-table">
                    <thead>
                        <tr>
                            <th>Session (Date | Time)</th>
                            <th>Regular Students</th>
                            <th>Regular Invigilators</th>
                            <th>Scribe Students</th>
                            <th>Scribe Invigilators</th>
                            <th>Total Invigilators</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        let totalRegular = 0;
        let totalScribe = 0;
        let totalAll = 0;

        reportData.forEach(row => {
            allPagesHtml += `
                <tr>
                    <td>${row.session}</td>
                    <td>${row.regularStudents}</td>
                    <td>${row.regularInvigilators}</td>
                    <td>${row.scribeStudents}</td>
                    <td>${row.scribeInvigilators}</td>
                    <td>${row.totalInvigilators}</td>
                </tr>
            `;
            totalRegular += row.regularInvigilators;
            totalScribe += row.scribeInvigilators;
            totalAll += row.totalInvigilators;
        });

        // Add Total Row
        allPagesHtml += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <td><strong>Total</strong></td>
                            <td colspan="1"></td>
                            <td><strong>${totalRegular}</strong></td>
                            <td colspan="1"></td>
                            <td><strong>${totalScribe}</strong></td>
                            <td><strong>${totalAll}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
        
        // 8. Show report
        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated Invigilator Requirement Summary.`;
        reportControls.classList.remove('hidden');
        lastGeneratedReportType = "Invigilator_Summary";

    } catch (e) {
        console.error("Error generating invigilator report:", e);
        reportStatus.textContent = "An error occurred generating the report.";
        reportControls.classList.remove('hidden');
    } finally {
        generateInvigilatorReportButton.disabled = false;
        generateInvigilatorReportButton.textContent = "Generate Invigilator Requirement Summary";
    }
});
// --- NEW: STUDENT SEARCH FUNCTIONALITY ---

let searchSessionStudents = []; // Holds students for the selected search session
let debounceTimer; // <-- ADD THIS
// 1. Listen for session change
searchSessionSelect.addEventListener('change', () => {
    const sessionKey = searchSessionSelect.value;
    studentSearchInput.value = '';
    studentSearchAutocomplete.classList.add('hidden');
    
    if (sessionKey) {
        const [date, time] = sessionKey.split(' | ');
        // Get all students for this session
        searchSessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
        studentSearchSection.classList.remove('hidden');
        studentSearchStatus.textContent = `Loaded ${searchSessionStudents.length} students for this session.`;
    } else {
        studentSearchSection.classList.add('hidden');
        studentSearchStatus.textContent = '';
        searchSessionStudents = [];
    }
});

// 2. Autocomplete for search input (DEBOUNCED)
studentSearchInput.addEventListener('input', () => {
    // Clear any existing timer
    clearTimeout(debounceTimer);

    // Start a new timer
    debounceTimer = setTimeout(() => {
        const query = studentSearchInput.value.trim().toUpperCase();
        if (query.length < 2) {
            studentSearchAutocomplete.classList.add('hidden');
            return;
        }

        // Filter students by register number
        const matches = searchSessionStudents.filter(s => s['Register Number'].toUpperCase().includes(query)).slice(0, 10);

        if (matches.length > 0) {
            studentSearchAutocomplete.innerHTML = ''; // Clear previous results
            matches.forEach(student => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.innerHTML = student['Register Number'].replace(new RegExp(query, 'gi'), '<strong>$&</strong>') + ` (${student.Name})`;
                // When clicked, fetch details and show modal
                item.onclick = () => {
                    studentSearchInput.value = student['Register Number'];
                    studentSearchAutocomplete.classList.add('hidden');
                    showStudentDetailsModal(student['Register Number'], searchSessionSelect.value);
                };
                studentSearchAutocomplete.appendChild(item);
            });
            studentSearchAutocomplete.classList.remove('hidden');
        } else {
            studentSearchAutocomplete.classList.add('hidden');
        }
    }, 250); // Wait 250ms after user stops typing
});

// 3. Main function to fetch all student details
function showStudentDetailsModal(regNo, sessionKey) {
    const [date, time] = sessionKey.split(' | ');
    
    // 1. Find the base student record
    const student = allStudentData.find(s => 
        s.Date === date && s.Time === time && s['Register Number'] === regNo
    );
    
    if (!student) {
        alert("Could not find student details.");
        return;
    }

    // 2. Get Room & Seat: Run allocation for the *entire* session
    const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
    const allocatedSessionData = performOriginalAllocation(sessionStudents);
    const allocatedStudent = allocatedSessionData.find(s => s['Register Number'] === regNo);

    // 3. Get Scribe Room (if any)
    const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
    const sessionScribeAllotment = allScribeAllotments[sessionKey] || {};
    const scribeRoom = sessionScribeAllotment[regNo];

    // 4. Get QP Code (if any)
    loadQPCodes(); // Ensures qpCodeMap is populated
    const sessionQPCodes = qpCodeMap[sessionKey] || {};
    
    // --- MODIFIED TO USE Base64 KEY ---
    const courseKey = getBase64CourseKey(student.Course);
    const qpCode = sessionQPCodes[courseKey] || "Not Entered";
    // --- END MODIFICATION ---

   // 5. Populate Modal
    searchResultName.textContent = student.Name;
    searchResultRegNo.textContent = student['Register Number'];
    searchResultCourse.textContent = student.Course;
    searchResultQPCode.textContent = qpCode;

    // --- NEW: Handle Room and Location ---
    if (allocatedStudent) {
        const roomName = allocatedStudent['Room No'];
        searchResultRoom.textContent = roomName;
        searchResultSeat.textContent = allocatedStudent.seatNumber;
        
        // Get room location
        const roomInfo = currentRoomConfig[roomName];
        const location = (roomInfo && roomInfo.location) ? roomInfo.location : "N/A";
        searchResultRoomLocation.textContent = location;
        searchResultRoomLocationBlock.classList.remove('hidden');
    } else {
        searchResultRoom.textContent = "Not Allotted";
        searchResultSeat.textContent = "N/A";
        searchResultRoomLocation.textContent = "N/A";
        searchResultRoomLocationBlock.classList.add('hidden');
    }

    // --- NEW: Handle Scribe Room and Location ---
    if (scribeRoom) {
        searchResultScribeRoom.textContent = scribeRoom;
        
        // Get scribe room location
        const scribeRoomInfo = currentRoomConfig[scribeRoom];
        const scribeLocation = (scribeRoomInfo && scribeRoomInfo.location) ? scribeRoomInfo.location : "N/A";
        searchResultScribeRoomLocation.textContent = scribeLocation;

        searchResultScribeBlock.classList.remove('hidden');
    } else {
        searchResultScribeRoom.textContent = "N/A";
        searchResultScribeRoomLocation.textContent = "N/A";
        searchResultScribeBlock.classList.add('hidden'); // Hide if not a scribe
    }


    // 6. Show Modal
    searchResultModal.classList.remove('hidden');
}

// 4. Close modal button
modalCloseSearchResult.addEventListener('click', () => {
    searchResultModal.classList.add('hidden');
});

// --- END: STUDENT SEARCH FUNCTIONALITY ---
// --- Run on initial page load ---
loadInitialData();
});
