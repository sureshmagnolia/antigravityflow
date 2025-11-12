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
// *** RENAMED AND REORDERED ***
const viewExtractor = document.getElementById('view-extractor');
const viewScribeSettings = document.getElementById('view-scribe-settings'); // Renamed view
const viewRoomAllotment = document.getElementById('view-room-allotment');
const viewScribeAllotment = document.getElementById('view-scribe-allotment');
const viewQPCodes = document.getElementById('view-qpcodes');
const viewReports = document.getElementById('view-reports');
const viewAbsentees = document.getElementById('view-absentees');
const viewSettings = document.getElementById('view-settings');

const navData = document.getElementById('nav-extractor'); // Renamed button
const navScribeAssistance = document.getElementById('nav-scribe-settings'); // Renamed button
const navRoomAllotment = document.getElementById('nav-room-allotment');
const navScribeAllotment = document.getElementById('nav-scribe-allotment');
const navQPCodes = document.getElementById('nav-qpcodes');
const navReports = document.getElementById('nav-reports');
const navAbsentees = document.getElementById('nav-absentees');
const navSettings = document.getElementById('nav-settings');

// *** UPDATED ARRAYS ***
const allNavButtons = [navData, navScribeAssistance, navRoomAllotment, navScribeAllotment, navQPCodes, navReports, navAbsentees, navSettings];
const allViews = [viewExtractor, viewScribeSettings, viewRoomAllotment, viewScribeAllotment, viewQPCodes, viewReports, viewAbsentees, viewSettings];
// ************************

// --- (V26) Get references to NEW Room Settings elements (Now in Settings tab) ---
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
const generateScribeReportButton = document.getElementById('generate-scribe-report-button');

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

// --- Scribe Assistance (Settings) Elements ---
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

// --- Scribe Allotment Elements ---
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
// ************************


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
                    remark: `Scribe, Moved to ${scribeRoom}`, // Add new remark
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
                </div>
            `;

            let previousCourseName = ""; 
            function generateTableRows(studentList) {
                let rowsHtml = '';
                studentList.forEach((student) => { 
                    const studentNumber = student.isPlaceholder ? '*' : student.originalIndex + 1;
                    
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

                    // *** NEW: Style for placeholder ***
                    const rowStyle = student.isPlaceholder ? 'font-style: italic; color: #555;' : '';
                    
                    // *** FIX: Added Remarks Column Data ***
                    const remarkText = student.remark || ''; // Get remark or empty string
                    rowsHtml += `
                        <tr style="${rowStyle}">
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
                                    ${courseData.present.length > 0 ? courseData.present.map(regNo => `<span>${regNo}</span>`).join('') : '<em>None</em>'}
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Absent (${courseData.absent.length})</strong></td>
                                <td class="regno-list">
                                    ${courseData.absent.length > 0 ? courseData.absent.map(regNo => `<span>${regNo}</span>`).join('') : '<em>None</em>'}
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
        
// *** NEW: Event listener for "Generate Scribe Report" ***
generateScribeReportButton.addEventListener('click', async () => {
    generateScribeReportButton.disabled = true;
    generateScribeReportButton.textContent = "Generating...";
    reportOutputArea.innerHTML = "";
    reportControls.classList.add('hidden');
    roomCsvDownloadContainer.innerHTML = "";
    lastGeneratedReportType = "";
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        
        // 1. Get all data
        const allData = JSON.parse(jsonDataStore.innerHTML || '[]');
        if (allData.length === 0) {
            alert("No data loaded.");
            return;
        }
        
        // 2. Get global scribe list
        loadGlobalScribeList();
        if (globalScribeList.length === 0) {
            alert("No students have been added to the Scribe List in Scribe Settings.");
            return;
        }
        const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));
        
        // 3. Get all scribe students from the main data
        const allScribeStudents = allData.filter(s => scribeRegNos.has(s['Register Number']));
        
        // 4. Get Original Room Allotments (by running the "original" allocation logic)
        const performOriginalAllocation = (data) => {
            const { roomNames: masterRoomNames, roomCapacities: masterRoomCaps } = getRoomCapacitiesFromStorage();
            const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
            const processed_rows = [];
            const sessionRoomFills = {};
            const DEFAULT_OVERFLOW_CAPACITY = 30;
            for (const row of data) {
                const sessionKey = `${row.Date}_${row.Time}`;
                const sessionKeyPipe = `${row.Date} | ${row.Time}`;
                let assignedRoomName = "";
                const manualAllotment = allAllotments[sessionKeyPipe];
                if (manualAllotment && manualAllotment.length > 0) {
                    for (const room of manualAllotment) {
                        if (room.students.includes(row['Register Number'])) {
                            assignedRoomName = room.roomName;
                            break;
                        }
                    }
                }
                if (assignedRoomName === "") {
                    if (!sessionRoomFills[sessionKey]) sessionRoomFills[sessionKey] = new Array(masterRoomCaps.length).fill(0);
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
                processed_rows.push({ ...row, 'Room No': assignedRoomName });
            }
            return processed_rows;
        };
        const originalAllotments = performOriginalAllocation(allData);
        const originalRoomMap = originalAllotments.reduce((map, s) => {
            map[s['Register Number']] = s['Room No'];
            return map;
        }, {});

        // 5. Load Scribe Allotments and QP Codes
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        loadQPCodes(); // populates qpCodeMap

        // 6. Collate all data for the report
        const reportRows = [];
        for (const s of allScribeStudents) {
            const sessionKey = `${s.Date} | ${s.Time}`;
            const sessionScribeRooms = allScribeAllotments[sessionKey] || {};
            const sessionQPCodes = qpCodeMap[sessionKey] || {};
            const courseKey = cleanCourseKey(s.Course);
            
            reportRows.push({
                Date: s.Date,
                Time: s.Time,
                RegisterNumber: s['Register Number'],
                Name: s.Name,
                Course: s.Course,
                OriginalRoom: originalRoomMap[s['Register Number']] || 'N/A',
                ScribeRoom: sessionScribeRooms[s['Register Number']] || 'Not Allotted',
                QPCode: sessionQPCodes[courseKey] || 'N/A'
            });
        }
        
        // 7. Group by Session
        const sessions = {};
        for (const row of reportRows) {
            const key = `${row.Date}_${row.Time}`;
            if (!sessions[key]) {
                sessions[key] = {
                    Date: row.Date,
                    Time: row.Time,
                    students: []
                };
            }
            sessions[key].students.push(row);
        }

        // 8. Build HTML
        let allPagesHtml = '';
        let totalPages = 0;
        const sortedSessionKeys = Object.keys(sessions).sort();

        if (sortedSessionKeys.length === 0) {
            alert("No scribe students found for any session with loaded data.");
            return;
        }

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
                                <th style="width: 25%;">Course / Paper</th>
                                <th style="width: 10%;">QP Code</th>
                                <th style="width: 10%;">Original Room</th>
                                <th style="width: 15%;">Scribe Room</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
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
        reportStatus.textContent = "An error occurred generating the report.";
        reportControls.classList.remove('hidden');
    } finally {
        generateScribeReportButton.disabled = false;
        generateScribeReportButton.textContent = "Generate Scribe Assistance Report";
    }
});
// *******************************************************


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


// --- NAVIGATION VIEW-SWITCHING LOGIC ---
// *** UPDATED TO MATCH NEW TAB ORDER AND RENAMES ***
navData.addEventListener('click', () => showView(viewExtractor, navData));
navScribeAssistance.addEventListener('click', () => showView(viewScribeSettings, navScribeAssistance));
navRoomAllotment.addEventListener('click', () => showView(viewRoomAllotment, navRoomAllotment));
navScribeAllotment.addEventListener('click', () => showView(viewScribeAllotment, navScribeAllotment));
navQPCodes.addEventListener('click', () => showView(viewQPCodes, navQPCodes));
navReports.addEventListener('click', () => showView(viewReports, navReports));
navAbsentees.addEventListener('click', () => showView(viewAbsentees, navAbsentees));
navSettings.addEventListener('click', () => showView(viewSettings, navSettings));
// *** REMOVED old nav-room-settings listener ***

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

// --- (V97) College Name Save Logic ---
saveCollegeNameButton.addEventListener('click', () => {
    const collegeName = collegeNameInput.value.trim() || "University of Calicut";
    localStorage.setItem(COLLEGE_NAME_KEY, collegeName);
    currentCollegeName = collegeName; // Update global var immediately
    
    collegeNameStatus.textContent = "College name saved!";
    setTimeout(() => { collegeNameStatus.textContent = ""; }, 2000);
});

// --- (V48) Save from dynamic form (uses new object structure) ---
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

// --- (V79) Load data into dynamic form (with UX Fix) ---
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

// --- (V28) Add New Room Button (with location) ---
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
            removeButton.parentNode.replaceChild(placeholder
