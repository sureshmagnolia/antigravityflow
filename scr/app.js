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

// --- Get references to all Navigation elements ---
const viewExtractor = document.getElementById('view-extractor');
const viewSettings = document.getElementById('view-settings');
const viewQPCodes = document.getElementById('view-qpcodes');
const viewReports = document.getElementById('view-reports');
const viewAbsentees = document.getElementById('view-absentees');
// const viewRoomSettings = document.getElementById('view-room-settings'); // <-- No longer a main view
const navExtractor = document.getElementById('nav-extractor');
const navSettings = document.getElementById('nav-settings');
const navQPCodes = document.getElementById('nav-qpcodes');
const navReports = document.getElementById('nav-reports');
const navAbsentees = document.getElementById('nav-absentees');
// const navRoomSettings = document.getElementById('nav-room-settings'); // <-- No longer a main view
// *** NEW SCRIBE NAV ***
const navScribeSettings = document.getElementById('nav-scribe-settings');
const navScribeAllotment = document.getElementById('nav-scribe-allotment');
// **********************
const navRoomAllotment = document.getElementById('nav-room-allotment');
const viewRoomAllotment = document.getElementById('view-room-allotment');
// *** NEW SCRIBE VIEWS ***
const viewScribeSettings = document.getElementById('view-scribe-settings');
const viewScribeAllotment = document.getElementById('view-scribe-allotment');
// **********************
// *** UPDATED allNavButtons and allViews TO MATCH NEW ORDER ***
const allNavButtons = [navExtractor, navScribeSettings, navRoomAllotment, navScribeAllotment, navQPCodes, navReports, navAbsentees, navSettings];
const allViews = [viewExtractor, viewScribeSettings, viewRoomAllotment, viewScribeAllotment, viewQPCodes, viewReports, viewAbsentees, viewSettings];

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
// *** NEW SCRIBE REPORT BUTTON ***
const generateScribeReportButton = document.getElementById('generate-scribe-report-button');
// ****************************

// --- Get references to Day-wise Report elements ---
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

// *** NEW SCRIBE ALLOTMENT ELEMENTS ***
const scribeAllotmentLoader = document.getElementById('scribe-allotment-loader');
const scribeAllotmentContentWrapper = document.getElementById('scribe-allotment-content-wrapper');
const scribeSessionSelect = document.getElementById('scribe-session-select');
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


// --// V90 FIX: Aggressive Key Cleaning Function (Fixes key collision) ---
function cleanCourseKey(courseName) {
    if (typeof courseName !== 'string') return '';
    // V90 FIX: Keep only alphanumeric characters and the course code part
    // The course code is the most unique part (e.g., BOT3CJ201)
    let cleaned = courseName.toUpperCase();
    
    // 1. Extract the course code (e.g., BOT3CJ201) and the syllabus year (e.g., 2024)
    const codeMatch = cleaned.match(/([A-Z]{3}\d[A-Z]{2}\d{3})/);
    const syllabusMatch = cleaned.match(/(\d{4})\s+SYLLABUS/);
    
    let key = '';
    if (codeMatch) {
        key += codeMatch[1];
    }
    if (syllabusMatch) {
        key += syllabusMatch[1];
    }
    
    // Fallback: If no code is found, use the old aggressive cleaning method
    if (!key) {
        // Remove all non-standard chars (including BOM, non-breaking spaces, and control chars)
        cleaned = cleaned.replace(/[\ufeff\u00A0\u200B\u200C\u200D\u200E\u200F\uFEFF]/g, ' ').toUpperCase(); 
        // Remove ALL non-alphanumeric chars (except spaces, - ( ) [ ] / & , ; .)
        cleaned = cleaned.replace(/[^\w\s\-\(\)\[\]\/&,;.]/g, ''); 
        // Replace multiple spaces with one, then trim
        key = cleaned.replace(/\s+/g, ' ').trim();
    }
    
    return key;
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

// --- (V29) Central Allocation Function (to be used by multiple reports) ---
function performRoomAllocation(data) {
    // 1. Get CURRENT room capacities
    const { roomNames: masterRoomNames, roomCapacities: masterRoomCaps } = getRoomCapacitiesFromStorage();
    
    // 2. Check for manual room allotments
    const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');

    // *** NEW: Load Scribe Allotments ***
    const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
    
    // 3. Perform Room Allocation
    const processed_rows_with_rooms = [];
    const sessionRoomFills = {};
    const DEFAULT_OVERFLOW_CAPACITY = 30;
    
    for (const row of data) {
        const sessionKey = `${row.Date}_${row.Time}`;
        const sessionKeyPipe = `${row.Date} | ${row.Time}`; // Format used in allotment storage
        
        let assignedRoomName = "";
        let isScribe = false; // <-- NEW

        // *** NEW: 3a. Check for Scribe Allotment FIRST ***
        const sessionScribeAllotment = allScribeAllotments[sessionKeyPipe] || {};
        const scribeRoom = sessionScribeAllotment[row['Register Number']];
        if (scribeRoom) {
            assignedRoomName = scribeRoom;
            isScribe = true;
            processed_rows_with_rooms.push({ ...row, 'Room No': assignedRoomName, 'isScribe': isScribe });
            continue; // This student is done, skip other allotment logic
        }
        // ***********************************************
        
        // 3b. Check if manual allotment exists for this session
        const manualAllotment = allAllotments[sessionKeyPipe];
        if (manualAllotment && manualAllotment.length > 0) {
            // Use manual allotment
            for (const room of manualAllotment) {
                if (room.students.includes(row['Register Number'])) {
                    assignedRoomName = room.roomName;
                    break;
                }
            }
        }
        
        // 3c. If no manual allotment, use automatic allocation
        if (assignedRoomName === "") {
            if (!sessionRoomFills[sessionKey]) {
                sessionRoomFills[sessionKey] = new Array(masterRoomCaps.length).fill(0);
            }
            
            const currentFills = sessionRoomFills[sessionKey];
            
            // Try to fill configured rooms
            for (let i = 0; i < masterRoomCaps.length; i++) {
                if (currentFills[i] < masterRoomCaps[i]) {
                    currentFills[i]++;
                    assignedRoomName = masterRoomNames[i];
                    break;
                }
            }
            
            // If all configured rooms are full, create overflow
            if (assignedRoomName === "") {
                let foundOverflowSpot = false;
                for (let i = masterRoomCaps.length; i < currentFills.length; i++) {
                    if (currentFills[i] < DEFAULT_OVERFLOW_CAPACITY) {
                        currentFills[i]++;
                        assignedRoomName = `Room ${i + 1}`;
                        foundOverflowSpot = true;
                        break;
                    }
                }
                
                // If no existing overflow has space, create a *new* overflow
                if (!foundOverflowSpot) {
                    currentFills.push(1); 
                    assignedRoomName = `Room ${currentFills.length}`;
                }
            }
        }
        
        processed_rows_with_rooms.push({ ...row, 'Room No': assignedRoomName, 'isScribe': isScribe });
    }
    return processed_rows_with_rooms;
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


// --- 1. Event listener for the "Generate Room-wise Report" button ---
generateReportButton.addEventListener('click', async () => {
    
    generateReportButton.disabled = true;
    generateReportButton.textContent = "Allocating Rooms & Generating Report...";
    reportOutputArea.innerHTML = "";
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = "";
    lastGeneratedRoomData = [];
    lastGeneratedReportType = ""; // V91: Reset report type
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        // *** V95 FIX: Refresh college name from local storage BEFORE generation ***
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        
        // 1. Get FILTERED RAW student data
        const data = getFilteredReportData('room-wise');

        if (data.length === 0) {
            // V70 FIX: Use alert instead of custom modal
            alert("No data found for the selected filter/session."); 
            return;
        }
        
        // 2. Perform "Original" Room Allocation (This function now IGNORES scribes)
        // *** We need a version of allocation that does NOT know about scribes ***
        // Let's create a temporary copy for this report
        const performOriginalAllocation = (data) => {
            const { roomNames: masterRoomNames, roomCapacities: masterRoomCaps } = getRoomCapacitiesFromStorage();
            const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
            const processed_rows_with_rooms = [];
            const sessionRoomFills = {};
            const DEFAULT_OVERFLOW_CAPACITY = 30;
            
            for (const row of data) {
                const sessionKey = `${row.Date}_${row.Time}`;
                const sessionKeyPipe = `${row.Date} | ${row.Time}`;
                let assignedRoomName = "";
                
                // Check manual allotment
                const manualAllotment = allAllotments[sessionKeyPipe];
                if (manualAllotment && manualAllotment.length > 0) {
                    for (const room of manualAllotment) {
                        if (room.students.includes(row['Register Number'])) {
                            assignedRoomName = room.roomName;
                            break;
                        }
                    }
                }
                
                // Automatic allocation
                if (assignedRoomName === "") {
                    if (!sessionRoomFills[sessionKey]) {
                        sessionRoomFills[sessionKey] = new Array(masterRoomCaps.length).fill(0);
                    }
                    const currentFills = sessionRoomFills[sessionKey];
                    for (let i = 0; i < masterRoomCaps.length; i++) {
                        if (currentFills[i] < masterRoomCaps[i]) {
                            currentFills[i]++;
                            assignedRoomName = masterRoomNames[i];
                            break;
                        }
                    }
                    if (assignedRoomName === "") {
                        let foundOverflowSpot = false;
                        for (let i = masterRoomCaps.length; i < currentFills.length; i++) {
                            if (currentFills[i] < DEFAULT_OVERFLOW_CAPACITY) {
                                currentFills[i]++;
                                assignedRoomName = `Room ${i + 1}`;
                                foundOverflowSpot = true;
                                break;
                            }
                        }
                        if (!foundOverflowSpot) {
                            currentFills.push(1); 
                            assignedRoomName = `Room ${currentFills.length}`;
                        }
                    }
                }
                processed_rows_with_rooms.push({ ...row, 'Room No': assignedRoomName });
            }
            return processed_rows_with_rooms;
        };
        
        const processed_rows_with_rooms = performOriginalAllocation(data);

        // *** NEW: Load scribe data and create final list ***
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        loadGlobalScribeList(); // Ensure globalScribeList is populated
        const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));
        
        const final_student_list_for_report = [];
        
        for (const student of processed_rows_with_rooms) {
            const regNo = student['Register Number'];
            if (scribeRegNos.has(regNo)) {
                // This is a scribe student. Find their allotted scribe room.
                const sessionKeyPipe = `${student.Date} | ${student.Time}`;
                const sessionScribeAllotment = allScribeAllotments[sessionKeyPipe] || {};
                const scribeRoom = sessionScribeAllotment[regNo] || 'N/A';
                
                // *** FIX: Add a 'remark' property instead of changing the name ***
                final_student_list_for_report.push({ 
                    ...student, 
                    Name: student.Name, // Keep original name
                    remark: `${scribeRoom}*`, // *** Add remark (Room + Asterisk) ***
                    isPlaceholder: true // Keep this for styling
                });
            } else {
                // Not a scribe, add as normal
                final_student_list_for_report.push(student);
            }
        }
        // *************************************************

        
        // 3. Store data for CSV (use original allocation for CSV)
        lastGeneratedRoomData = processed_rows_with_rooms; 
        lastGeneratedReportType = "Roomwise_Seating_Report";

        // 4. Group data for Report Generation (use the NEW final list)
        const sessions = {};
        loadQPCodes(); // *** NEW: Load QP Codes for the report ***
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

        // 5. Build the HTML report pages
        sortedSessionKeys.forEach(key => {
            const session = sessions[key];
            const studentsPerPage = 20;
            
            // (V28) Get location for this room
            const roomInfo = currentRoomConfig[session.Room];
            const location = (roomInfo && roomInfo.location) ? roomInfo.location : "";
            const locationHtml = location ? `<div class="report-location-header">Location: ${location}</div>` : "";

            // V98: Prepare Course Summary for the FOOTER
            let courseSummaryHtml = '';
            for (const [courseName, count] of Object.entries(session.courseCounts)) {
                courseSummaryHtml += `<div style="font-weight: bold;">${courseName}: ${count} Student(s)</div>`; // V38: Show full course name
            }
            
            // *** COLLEGE NAME IS CORRECTLY REFLECTED HERE ***
            const pageHeaderHtml = `
                <div class="print-header-group">
                    <h1>${currentCollegeName}</h1> <h2>${session.Date} &nbsp;|&nbsp; ${session.Time} &nbsp;|&nbsp; ${session.Room}</h2>
                    ${locationHtml} </div>
            `;
            
            // *** FIX: Added Remarks Column Header ***
            const tableHeaderHtml = `
                <table class="print-table">
                    <thead>
                        <tr>
                            <th class="sl-col">Sl No</th>
                            <th class="course-col">Course (QP Code)</th>
                            <th class="reg-col">Register Number</th>
                            <th class="name-col">Name</th>
                            <th class="signature-col">Signature</th>
                            <th class="remarks-col">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
            `; 
            
            // *** NEW: Check for scribes on this page to add footnote ***
            const hasScribe = session.students.some(s => s.isPlaceholder);
            const scribeFootnote = hasScribe ? '<div class="scribe-footnote">* = Scribe Assistance</div>' : '';

            const invigilatorFooterHtml = `
                <div class="invigilator-footer">
                    <div class="course-summary-footer">
                        <strong>Course Summary:</strong>
                        ${courseSummaryHtml}
                    </div>
                    <div><strong>Answer Booklets Received:</strong> _________________</div>
                    <div><strong>Answer Booklets Used:</strong> _________________</div>
                    <div><strong>Answer Booklets Returned (Balance):</strong> _________________</div>
                    <div class="signature">
                        Chief Superintendent
                    </div>
                    ${scribeFootnote}
                </div>
            `;

            let previousCourseName = ""; 
            function generateTableRows(studentList) {
                let rowsHtml = '';
                studentList.forEach((student) => { 
                    // *** FIX: Add asterisk to Sl. No. ***
                    const studentNumber = student.isPlaceholder ? `${student.originalIndex + 1}*` : student.originalIndex + 1;
                    
                    // *** NEW: Get QP Code ***
                    const sessionKey = `${student.Date} | ${student.Time}`;
                    const sessionQPCodes = qpCodeMap[sessionKey] || {};
                    const courseKey = cleanCourseKey(student.Course);
                    const qpCode = sessionQPCodes[courseKey] || "";
                    const qpCodeDisplay = qpCode ? ` (${qpCode})` : "";
                    const tableCourseName = student.Course + qpCodeDisplay; // Course + QP Code
                    // ************************
                    
                    // V97 FIX: Truncate Course Name (now with QP code)
                    const words = tableCourseName.split(/\s+/);
                    const truncatedCourseName = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
                    
                    let displayCourseName = (truncatedCourseName === previousCourseName) ? '"' : truncatedCourseName;
                    if (truncatedCourseName !== previousCourseName) previousCourseName = truncatedCourseName;

                    // *** FIX: Use class for highlighting ***
                    const rowClass = student.isPlaceholder ? 'class="scribe-row-highlight"' : '';
                    
                    // *** FIX: Added Remarks Column Data ***
                    const remarkText = student.remark || ''; // Get remark or empty string
                    rowsHtml += `
                        <tr ${rowClass}>
                            <td class="sl-col">${studentNumber}</td>
                            <td class="course-col">${displayCourseName}</td>
                            <td class="reg-col">${student['Register Number']}</td>
                            <td class="name-col">${student.Name}</td>
                            <td class="signature-col"></td>
                            <td class="remarks-col">${remarkText}</td>
                        </tr>
                    `;
                });
                return rowsHtml;
            }
            
            const studentsWithIndex = session.students.map((student, index) => ({
                ...student,
                originalIndex: index 
            }));
            
            const studentsPage1 = studentsWithIndex.slice(0, studentsPerPage);
            const studentsPage2 = studentsWithIndex.slice(studentsPerPage);

            previousCourseName = ""; 
            const tableRowsPage1 = generateTableRows(studentsPage1);
            // V92 FIX: Ensure table is properly closed on every page
            allPagesHtml += `<div class="print-page">${pageHeaderHtml}${tableHeaderHtml}${tableRowsPage1}</tbody></table>`; 
            if (studentsPage2.length === 0) allPagesHtml += invigilatorFooterHtml;
            allPagesHtml += `</div>`; 
            totalPagesGenerated++;
            
            if (studentsPage2.length > 0) {
                previousCourseName = ""; 
                const tableRowsPage2 = generateTableRows(studentsPage2);
                // V92 FIX: Ensure table is properly closed on every page
                allPagesHtml += `<div class="print-page">${tableHeaderHtml}${tableRowsPage2}</tbody></table>${invigilatorFooterHtml}</div>`; 
                totalPagesGenerated++;
            }
        });

        // 6. Show report and controls
        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated ${totalPagesGenerated} total pages for ${sortedSessionKeys.length} room sessions.`;
        reportControls.classList.remove('hidden');
        
        // 7. Add download button
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
    generateDaywiseReportButton.disabled = true;
    // V49: Button text updated
    generateDaywiseReportButton.textContent = "Generating...";
    reportOutputArea.innerHTML = "";
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = "";
    lastGeneratedRoomData = []; // This report doesn't use the room CSV
    lastGeneratedReportType = ""; // V91: Reset report type
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        // *** V95 FIX: Refresh college name from local storage BEFORE generation ***
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        
        // 1. Get FILTERED RAW student data
        const data = getFilteredReportData('day-wise');

        if (data.length === 0) {
            alert("No data found for the selected filter/session.");
            return;
        }
        
        // 2. Perform Room Allocation (V29 - uses central function)
        // *** THIS NOW CORRECTLY HANDLES SCRIBES AND SHOWS THEIR NEW ROOM ***
        const processed_rows_with_rooms = performRoomAllocation(data);

        // 3. Group by Room to get SL No.
        const roomSessions = {};
        processed_rows_with_rooms.forEach(student => {
            const key = `${student.Date}_${student.Time}_${student['Room No']}`;
            if (!roomSessions[key]) {
                roomSessions[key] = {
                    Date: student.Date,
                    Time: student.Time,
                    Room: student['Room No'],
                    students: []
                };
            }
            roomSessions[key].students.push(student);
        });
        
        const daySessions = {}; // V72 FIX: Added definition here

        // 4. Create new flat list with SlNoInRoom
        let flatStudentList = [];
        Object.values(roomSessions).forEach(roomSession => {
            // *** NEW: Sort scribe students to the end of the room list ***
            roomSession.students.sort((a, b) => {
                if (a.isScribe && !b.isScribe) return 1;
                if (!a.isScribe && b.isScribe) return -1;
                return 0; // Keep original order otherwise
            });
            
            roomSession.students.forEach((student, index) => {
                flatStudentList.push({ 
                    ...student, 
                    slNoInRoom: student.isScribe ? 'Scribe' : index + 1, // <-- NEW
                    roomName: roomSession.Room 
                });
            });
        });
        
        // 5. Sort this new list by Date, Time, Course, then Register Number
        flatStudentList.sort((a, b) => {
            if (a.Date !== b.Date) return a.Date.localeCompare(b.Date);
            if (a.Time !== b.Time) return a.Time.localeCompare(b.Time, 'en', { numeric: true }); // Handle 10:00 AM vs 2:00 PM
            if (a.Course !== b.Course) return a.Course.localeCompare(b.Course);
            return a['Register Number'].localeCompare(b['Register Number']);
        });

        // 6. Group this sorted list by Day/Session
        flatStudentList.forEach(student => {
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
        
        // 7. Build the HTML
        let allPagesHtml = '';
        let totalPagesGenerated = 0;
        // V77: Updated for better fit (35 per column)
        const STUDENTS_PER_COLUMN = 35; 
        const COLUMNS_PER_PAGE = 2; 
        const STUDENTS_PER_PAGE = STUDENTS_PER_COLUMN * COLUMNS_PER_PAGE; 

        // (V30) Helper to build a table for a column, NOW WITH COURSE GROUPING
        function buildColumnTable(studentChunk) {
            let rowsHtml = '';
            let currentCourse = ""; // Track the current course
            let previousRoomDisplay = ""; // V48: Track previous room

            studentChunk.forEach(student => {
                // Check if the course has changed
                if (student.Course !== currentCourse) {
                    currentCourse = student.Course;
                    previousRoomDisplay = ""; // V48: Reset for new course
                    // Add a course heading row
                    rowsHtml += `
                        <tr>
                            <td colspan="4" style="background-color: #ddd; font-weight: bold; padding: 4px 2px; border: 1px solid #999;">
                                ${student.Course}
                            </td>
                        </tr>
                    `;
                }

                // Add the student row
                const roomInfo = currentRoomConfig[student.roomName];
                const location = (roomInfo && roomInfo.location) ? roomInfo.location : "";
                const roomDisplay = location ? `${student.roomName} (${location})` : student.roomName;

                // V48: Check if same as above
                const displayRoom = (roomDisplay === previousRoomDisplay) ? '"' : roomDisplay;
                previousRoomDisplay = roomDisplay; // Update for next iteration
                
                // *** NEW: Style for scribe ***
                const rowStyle = student.isScribe ? 'font-weight: bold; color: #c2410c;' : '';

                rowsHtml += `
                    <tr style="${rowStyle}">
                        <td>${student['Register Number']}</td>
                        <td>${student.Name}</td>
                        <td>${displayRoom}</td>
                        <td style="text-align: center;">${student.slNoInRoom}</td>
                    </tr>
                `;
            });

            // (V30) Updated table header to remove Course
            // (V32) Updated widths
            return `
                <table class="daywise-report-table">
                    <thead>
                        <tr>
                            <th style="width: 25%;">Register No</th>
                            <th style="width: 35%;">Name</th>
                            <th style="width: 30%;">Room (Location)</th>
                            <th style="width: 10%;">Sl</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            `;
        }

        const sortedSessionKeys = Object.keys(daySessions).sort();

        sortedSessionKeys.forEach(key => {
            const session = daySessions[key];
            
            for (let i = 0; i < session.students.length; i += STUDENTS_PER_PAGE) {
                const pageStudents = session.students.slice(i, i + STUDENTS_PER_PAGE);
                totalPagesGenerated++;
                
                // V92 FIX: For compact report, render as a single column for PDF export if many pages are needed.
                const col1Students = pageStudents.slice(0, STUDENTS_PER_COLUMN);
                const col2Students = pageStudents.slice(STUDENTS_PER_COLUMN); 
                
                // To ensure PDF doesn't break tables, we will manually merge the two columns if they exist.
                // This allows the table to flow naturally and use the existing page break CSS rules.
                // However, on-screen display still uses flex/columns via CSS.
                
                let columnHtml = '';
                if (col1Students.length > 0 && col2Students.length === 0) {
                    // Only column 1 needed
                    columnHtml = `<div class="column">${buildColumnTable(col1Students)}</div>`;
                } else if (col1Students.length > 0 && col2Students.length > 0) {
                    // Two columns needed (default screen view). We use the container for display on screen,
                    // but CSS print media handles how they break/flow for print.
                    columnHtml = `
                        <div class="column-container">
                            <div class="column">
                                ${buildColumnTable(col1Students)}
                            </div>
                            <div class="column">
                                ${buildColumnTable(col2Students)}
                            </div>
                        </div>
                    `;
                }


                allPagesHtml += `
                    <div class="print-page print-page-daywise">
                        <div class="print-header-group">
                            <h1>Seating Details for Candidates</h1>
                            <h2>${currentCollegeName} &nbsp;|&nbsp; ${session.Date} &nbsp;|&nbsp; ${session.Time}</h2>
                        </div>
                        ${columnHtml}
                    </div>
                `;
            }
        });

        // 8. Show report and controls
        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated ${totalPagesGenerated} compact pages for ${sortedSessionKeys.length} sessions.`;
        reportControls.classList.remove('hidden');
        roomCsvDownloadContainer.innerHTML = ""; // This report has no CSV
        lastGeneratedReportType = "Daywise_Seating_Details"; // V91: Set report type

    } catch (e) {
        console.error("Error generating day-wise report:", e);
        reportStatus.textContent = "An error occurred while generating the report.";
        reportControls.classList.remove('hidden');
    } finally {
        generateDaywiseReportButton.disabled = false;
        // V49: Button text updated
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

// *** NEW: Helper for Absentee Report ***
function formatRegNoList(regNos) {
    if (!regNos || regNos.length === 0) return '<em>None</em>';
    
    let lastPrefix = "";
    const outputHtml = [];
    // Regex to split letters from numbers (e.g., "VPAYSBO" and "007")
    const regEx = /^([A-Z]+)(\d+)$/; 

    regNos.sort(); 
    
    regNos.forEach(regNo => {
        const match = regNo.match(regEx);
        if (match) {
            const prefix = match[1];
            const number = match[2];
            
            if (prefix === lastPrefix) {
                // Same prefix, only show number with a comma
                outputHtml.push(`<span>, ${number}</span>`);
            } else {
                // New prefix, show full register number
                lastPrefix = prefix;
                // Add a line break if this isn't the very first item
                if(outputHtml.length > 0) {
                     outputHtml.push('<br>');
                }
                outputHtml.push(`<span>${regNo}</span>`);
            }
        } else {
            // Fallback for non-matching register numbers (e.g., old numbers)
            if(outputHtml.length > 0) {
                 outputHtml.push('<br>');
            }
            outputHtml.push(`<span>${regNo}</span>`);
            lastPrefix = ""; // Reset prefix
        }
    });
    
    return outputHtml.join('');
}
        
// --- (V56) Event listener for "Generate Absentee Statement" ---
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
        // *** V95 FIX: Refresh college name from local storage BEFORE generation ***
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        
        // 1. Get all students for this session
        const [date, time] = sessionKey.split(' | ');
        const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
        
        // 2. Get absentee register numbers for this session
        const allAbsentees = JSON.parse(localStorage.getItem(ABSENTEE_LIST_KEY) || '{}');
        const absenteeRegNos = new Set(allAbsentees[sessionKey] || []);
        
        // 3. Group students by Course
        const courses = {};
        for (const student of sessionStudents) {
            const courseDisplay = student.Course;
            const courseKey = cleanCourseKey(courseDisplay); // V64 FIX: Ensure course key is aggressively cleaned
            
            if (!courses[courseKey]) {
                courses[courseKey] = {
                    name: courseDisplay,
                    present: [],
                    absent: []
                };
            }
            
            if (absenteeRegNos.has(student['Register Number'])) {
                courses[courseKey].absent.push(student['Register Number']);
            } else {
                courses[courseKey].present.push(student['Register Number']);
            }
        }
        
        // 4. Build Report Pages
        let allPagesHtml = '';
        let totalPages = 0;
        const sortedCourseKeys = Object.keys(courses).sort();
        
        // V58: Load QP codes
        loadQPCodes(); // Ensure qpCodeMap is up-to-date
        
        for (const courseKey of sortedCourseKeys) {
            totalPages++;
            const courseData = courses[courseKey];
            // V64 FIX: Use the clean key for lookup
            // V89: Load session-specific codes
            const sessionCodes = qpCodeMap[sessionKey] || {};
            const qpCode = sessionCodes[courseKey] || "____"; 
            
            // *** NEW: Use formatting function ***
            const presentListHtml = formatRegNoList(courseData.present);
            const absentListHtml = formatRegNoList(courseData.absent);
            
            // V57: Add page break logic. Each course is a new page.
            allPagesHtml += `
                <div class="print-page">
                    <div class="print-header-group">
                        <h1>${currentCollegeName}</h1>
                        <h2>Absentee Statement</h2>
                        <h3>${date} &nbsp;|&nbsp; ${time}</h3>
                    </div>
                
                    <table class="absentee-report-table">
                        <thead>
                            <tr>
                                <th colspan="2">Course: ${courseData.name} &nbsp;&nbsp; [ QP Code: ${qpCode} ]</th>
                            </tr>
                            <tr>
                                <th>Status</th>
                                <th>Register Numbers</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Present (${courseData.present.length})</strong></td>
                                <td class="regno-list">
                                    ${presentListHtml}
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Absent (${courseData.absent.length})</strong></td>
                                <td class="regno-list">
                                    ${absentListHtml}
                                </td>
                            </tr>
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

        // 5. Show report and controls
        reportOutputArea.innerHTML = allPagesHtml;
        reportOutputArea.style.display = 'block'; 
        reportStatus.textContent = `Generated ${totalPages} page(s) for ${sortedCourseKeys.length} courses.`;
        reportControls.classList.remove('hidden');
        roomCsvDownloadContainer.innerHTML = ""; // This report has no CSV
        lastGeneratedReportType = `Absentee_Statement_${date.replace(/\./g, '_')}_${time.replace(/\s/g, '')}`; // V91: Set report type

    } catch (e) {
        console.error("Error generating absentee report:", e);
        reportStatus.textContent = "An error occurred while generating the report.";
        reportControls.classList.remove('hidden');
    } finally {
        generateAbsenteeReportButton.disabled = false;
        generateAbsenteeReportButton.textContent = "Generate Absentee Statement";
    }
});

// --- (V68) Report Filter Logic ---
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
document.addEventListener('DOMContentLoaded', () => {
    
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
});


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
                generateDaywiseReportButton.disabled = false;
                generateScribeReportButton.disabled = false; // <-- NEW
                disable_absentee_tab(false);
                disable_qpcode_tab(false);
                disable_room_allotment_tab(false);
                disable_scribe_tabs(false); // <-- NEW
                
                populate_session_dropdown();
                populate_qp_code_session_dropdown();
                populate_room_allotment_session_dropdown();
                populate_scribe_session_dropdown(); // <-- NEW
                loadGlobalScribeList(); // <-- NEW
                
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

// *** WORKFLOW FIX: Removed the event listeners that disabled/enabled buttons ***
// Both PDF and CSV upload are always available.


// --- ROOM ALLOTMENT FUNCTIONALITY ---

// Disable/Enable Room Allotment Tab
function disable_room_allotment_tab(disabled) {
    navRoomAllotment.disabled = disabled;
    if (disabled) {
        roomAllotmentLoader.classList.remove('hidden');
        roomAllotmentContentWrapper.classList.add('hidden');
        navRoomAllotment.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        roomAllotmentLoader.classList.add('hidden');
        roomAllotmentContentWrapper.classList.remove('hidden');
        navRoomAllotment.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Populate Room Allotment Session Dropdown
function populate_room_allotment_session_dropdown() {
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
    const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
    
    // *** NEW: Exclude scribe students from this count ***
    loadGlobalScribeList();
    const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));
    const nonScribeSessionStudents = sessionStudents.filter(s => !scribeRegNos.has(s['Register Number']));
    const totalStudents = nonScribeSessionStudents.length;
    // ***************************************************
    
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

// Render the list of allotted rooms
function renderAllottedRooms() {
    allottedRoomsList.innerHTML = '';
    
    if (currentSessionAllotment.length === 0) {
        allottedRoomsList.innerHTML = '<p class="text-gray-500 text-sm">No rooms allotted yet.</p>';
        return;
    }
    
    currentSessionAllotment.forEach((room, index) => {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'bg-gray-50 border border-gray-200 rounded-lg p-4';
        
        const roomInfo = currentRoomConfig[room.roomName];
        const location = (roomInfo && roomInfo.location) ? ` (${roomInfo.location})` : '';
        
        roomDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-grow">
                    <h4 class="font-semibold text-gray-800">${room.roomName}${location}</h4>
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
    const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
    
    // Get already allotted student register numbers
    const allottedRegNos = new Set();
    currentSessionAllotment.forEach(room => {
        room.students.forEach(regNo => allottedRegNos.add(regNo));
    });

    // *** NEW: Exclude scribe students from this allotment ***
    loadGlobalScribeList();
    const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));
    
    // Get unallotted *non-scribe* students
    const unallottedStudents = sessionStudents.filter(s => 
        !allottedRegNos.has(s['Register Number']) && 
        !scribeRegNos.has(s['Register Number'])
    );
    // ******************************************************
    
    // Allot up to capacity
    const studentsToAllot = unallottedStudents.slice(0, capacity);
    
    // *** FIX: Renamed this variable from 'allottedRegNos' to 'newStudentRegNos' ***
    const newStudentRegNos = studentsToAllot.map(s => s['Register Number']);
    
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
    } else {
        allotmentStudentCountSection.classList.add('hidden');
        addRoomSection.classList.add('hidden');
        allottedRoomsSection.classList.add('hidden');
        saveAllotmentSection.classList.add('hidden');
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

// Disable/Enable Scribe Tabs
function disable_scribe_tabs(disabled) {
    navScribeSettings.disabled = disabled;
    navScribeAllotment.disabled = disabled;
    
    if (disabled) {
        scribeLoader.classList.remove('hidden');
        scribeContentWrapper.classList.add('hidden');
        scribeAllotmentLoader.classList.remove('hidden');
        scribeAllotmentContentWrapper.classList.add('hidden');
        [navScribeSettings, navScribeAllotment].forEach(nav => nav.classList.add('opacity-50', 'cursor-not-allowed'));
    } else {
        scribeLoader.classList.add('hidden');
        scribeContentWrapper.classList.remove('hidden');
        scribeAllotmentLoader.classList.add('hidden');
        scribeAllotmentContentWrapper.classList.remove('hidden');
        [navScribeSettings, navScribeAllotment].forEach(nav => nav.classList.remove('opacity-50', 'cursor-not-allowed'));
    }
}

// Load the global list from localStorage
function loadGlobalScribeList() {
    globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
    renderGlobalScribeList();
}

// Render the global list in "Scribe Settings"
function renderGlobalScribeList() {
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
    if (scribeSessionSelect.value) {
        renderScribeAllotmentList(scribeSessionSelect.value);
    }
}

// Scribe Search Autocomplete
scribeSearchInput.addEventListener('input', () => {
    const query = scribeSearchInput.value.trim().toUpperCase();
    if (query.length < 3) {
        scribeAutocompleteResults.classList.add('hidden');
        return;
    }
    
    // Search ALL students
    const matches = allStudentData.filter(s => s['Register Number'].toUpperCase().includes(query)).slice(0, 10);
    
    // Get unique register numbers from matches
    const uniqueMatches = [];
    const seenRegNos = new Set();
    for (const student of matches) {
        if (!seenRegNos.has(student['Register Number'])) {
            seenRegNos.add(student['Register Number']);
            uniqueMatches.push(student);
        }
    }
    
    if (uniqueMatches.length > 0) {
        scribeAutocompleteResults.innerHTML = '';
        uniqueMatches.forEach(student => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerHTML = student['Register Number'].replace(new RegExp(query, 'gi'), '<strong>$&</strong>') + ` (${student.Name})`;
            item.onclick = () => selectScribeStudent(student);
            scribeAutocompleteResults.appendChild(item);
        });
        scribeAutocompleteResults.classList.remove('hidden');
    } else {
        scribeAutocompleteResults.classList.add('hidden');
    }
});

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

// --- Scribe Allotment Page Logic ---

// Populate Scribe Allotment Session Dropdown
function populate_scribe_session_dropdown() {
    try {
        if (allStudentData.length === 0) {
            allStudentData = JSON.parse(jsonDataStore.innerHTML || '[]');
        }
        if (allStudentData.length === 0) {
            disable_scribe_tabs(true);
            return;
        }
        
        scribeSessionSelect.innerHTML = '<option value="">-- Select a Session --</option>';
        let defaultSession = "";
        const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
        
        allStudentSessions.forEach(session => {
            scribeSessionSelect.innerHTML += `<option value="${session}">${session}</option>`;
            if (session.startsWith(todayStr)) {
                defaultSession = session;
            }
        });
        
        if (defaultSession) {
            scribeSessionSelect.value = defaultSession;
            scribeSessionSelect.dispatchEvent(new Event('change'));
        }
        
    } catch (e) {
        console.error("Failed to populate scribe allotment sessions:", e);
        disable_scribe_tabs(true);
    }
}

// Scribe session dropdown change
scribeSessionSelect.addEventListener('change', () => {
    const sessionKey = scribeSessionSelect.value;
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
});

// Render the list of scribe students for the selected session
function renderScribeAllotmentList(sessionKey) {
    const [date, time] = sessionKey.split(' | ');
    // Get all students for this session
    const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
    
    // Filter to get only scribe students *in this session*
    const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));
    const sessionScribeStudents = sessionStudents.filter(s => scribeRegNos.has(s['Register Number']));

    scribeAllotmentList.innerHTML = '';
    if (sessionScribeStudents.length === 0) {
        scribeAllotmentList.innerHTML = '<p class="text-gray-500 text-sm">No students from the global scribe list are in this session.</p>';
        return;
    }

    // Get unique students for this session (in case of multiple papers)
    const uniqueSessionScribeStudents = [];
    const seenRegNos = new Set();
    for (const student of sessionScribeStudents) {
        if (!seenRegNos.has(student['Register Number'])) {
            seenRegNos.add(student['Register Number']);
            uniqueSessionScribeStudents.push(student);
        }
    }
    
    uniqueSessionScribeStudents.sort((a,b) => a['Register Number'].localeCompare(b['Register Number']));

    uniqueSessionScribeStudents.forEach(student => {
        const regNo = student['Register Number'];
        const allottedRoom = currentScribeAllotment[regNo];
        
        const item = document.createElement('div');
        item.className = 'bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center';
        
        let roomHtml = '';
        if (allottedRoom) {
            roomHtml = `
                <div>
                    <span class="text-sm font-medium text-gray-700">Allotted Room:</span>
                    <span class="font-bold text-blue-600 ml-2">${allottedRoom}</span>
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
    const [date, time] = sessionKey.split(' | ');
    const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
    
    // 1. Get all "master" rooms
    getRoomCapacitiesFromStorage(); // Populates currentRoomConfig
    const masterRoomNames = new Set(Object.keys(currentRoomConfig));

    // 2. Get all rooms used by "Manual Allotment"
    const allManualAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
    const sessionManualAllotment = allManualAllotments[sessionKey] || [];
    sessionManualAllotment.forEach(room => {
        masterRoomNames.delete(room.roomName);
    });

    // 3. Get all rooms used by "Automatic Allotment" (for students NOT in manual allotment)
    const manuallyAllottedRegNos = new Set();
    sessionManualAllotment.forEach(room => {
        room.students.forEach(regNo => manuallyAllottedRegNos.add(regNo));
    });
    
    const studentsForAutoAllot = sessionStudents.filter(s => !manuallyAllottedRegNos.has(s['Register Number']));
    
    // Run a lightweight auto-allot simulation
    const sessionRoomFills = {};
    const masterRoomCaps = getRoomCapacitiesFromStorage().roomCapacities; // Re-get array
    const masterRoomNamesArray = getRoomCapacitiesFromStorage().roomNames; // Re-get array

    studentsForAutoAllot.forEach(student => {
        for (let i = 0; i < masterRoomCaps.length; i++) {
            const roomName = masterRoomNamesArray[i];
            if (!sessionRoomFills[roomName]) sessionRoomFills[roomName] = 0;
            
            if (sessionRoomFills[roomName] < masterRoomCaps[i]) {
                sessionRoomFills[roomName]++;
                masterRoomNames.delete(roomName); // This room is now used
                break;
            }
        }
        // We ignore overflow rooms for this calculation
    });
    
    // *** FIX: Removed the block that deleted rooms already used by other scribes ***
    // This allows multiple scribes to be assigned to the same room.

    return Array.from(masterRoomNames).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
    });
}

// Open the Scribe Room Modal
async function openScribeRoomModal(regNo, studentName) {
    studentToAllotScribeRoom = regNo;
    scribeRoomModalTitle.textContent = `Select Room for ${studentName} (${regNo})`;
    
    const sessionKey = scribeSessionSelect.value;
    const availableRooms = await findAvailableRooms(sessionKey);
    
    scribeRoomSelectionList.innerHTML = '';
    if (availableRooms.length === 0) {
        scribeRoomSelectionList.innerHTML = '<p class="text-center text-red-600">No available rooms found for this session.</p>';
    } else {
        availableRooms.forEach(roomName => {
            const room = currentRoomConfig[roomName];
            const location = room.location ? ` (${room.location})` : '';
            
            const roomOption = document.createElement('div');
            roomOption.className = 'p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-blue-50';
            roomOption.innerHTML = `
                <div class="font-medium text-gray-800">${roomName}${location}</div>
                <div class="text-sm text-gray-600">Capacity: ${room.capacity}</div>
            `;
            roomOption.onclick = () => selectScribeRoom(roomName);
            scribeRoomSelectionList.appendChild(roomOption);
        });
    }
    
    scribeRoomModal.classList.remove('hidden');
}

// Select a room from the modal
function selectScribeRoom(roomName) {
    if (!studentToAllotScribeRoom) return;
    
    const sessionKey = scribeSessionSelect.value;
    
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
function disable_all_report_buttons(disabled) {
    generateReportButton.disabled = disabled;
    generateQPaperReportButton.disabled = disabled;
    generateDaywiseReportButton.disabled = disabled;
    generateScribeReportButton.disabled = disabled;
}


// --- Run on initial page load ---
loadInitialData();
