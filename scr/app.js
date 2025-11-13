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

// --- *** NEW CENTRAL ALLOCATION FUNCTION *** ---
// This function performs the *original* (non-scribe) allotment and assigns
// a definitive seat number to every student.
function performOriginalAllocation(data) {
    // 1. Get CURRENT room capacities
    const { roomNames: masterRoomNames, roomCapacities: masterRoomCaps } = getRoomCapacitiesFromStorage();
    
    // 2. Check for manual room allotments
    const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');

    // 3. Get Scribe List (to mark them)
    // *** FIX: We can't call loadGlobalScribeList() here as it updates the UI. Read from storage directly. ***
    const scribeRegNos = new Set( (JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]')).map(s => s.regNo) );
    
    // 4. Perform Room Allocation
    const processed_rows_with_rooms = [];
    const sessionRoomFills = {}; // Tracks { "Room 1": 0, "Room 2": 0 }
    const sessionRoomStudentCount = {}; // Tracks { "Room 1": 0, "Room 2": 0 } for seat number
    const DEFAULT_OVERFLOW_CAPACITY = 30;
    
    for (const row of data) {
        const sessionKey = `${row.Date}_${row.Time}`;
        const sessionKeyPipe = `${row.Date} | ${row.Time}`;
        
        let assignedRoomName = "";
        
        // 4a. Check if student is a scribe.
        const isScribe = scribeRegNos.has(row['Register Number']);
        
        // 4b. Check if manual allotment exists for this session
        const manualAllotment = allAllotments[sessionKeyPipe];
        if (manualAllotment && manualAllotment.length > 0) {
            for (const room of manualAllotment) {
                if (room.students.includes(row['Register Number'])) {
                    assignedRoomName = room.roomName;
                    break;
                }
            }
        }
        
        // 4c. If no manual allotment, use automatic allocation
        if (assignedRoomName === "") {
            if (!sessionRoomFills[sessionKey]) {
                sessionRoomFills[sessionKey] = new Array(masterRoomCaps.length).fill(0);
            }
            
            const currentFills = sessionRoomFills[sessionKey];
            
            // Try to fill configured rooms
            for (let i = 0; i < masterRoomCaps.length; i++) {
                // *** FIX: Use capacity from masterRoomCaps[i] ***
                if (currentFills[i] < masterRoomCaps[i]) {
                    assignedRoomName = masterRoomNames[i];
                    // *** FIX: Increment fill count for ALL students (including scribes) ***
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
                        // *** FIX: Increment fill count for ALL students (including scribes) ***
                        currentFills[i]++;
                        foundOverflowSpot = true;
                        break;
                    }
                }
                
                // If no existing overflow has space, create a *new* overflow
                if (!foundOverflowSpot) {
                    assignedRoomName = `Room ${currentFills.length + 1}`; // FIX: Use .length + 1 for new room
                    // *** FIX: Increment fill count for ALL students (including scribes) ***
                    currentFills.push(1); 
                }
            }
        }
        
        // 4d. Assign the *original* seat number
        const roomSessionKey = `${sessionKey}_${assignedRoomName}`;
        if (!sessionRoomStudentCount[roomSessionKey]) {
            sessionRoomStudentCount[roomSessionKey] = 0;
        }
        sessionRoomStudentCount[roomSessionKey]++;
        const seatNumber = sessionRoomStudentCount[roomSessionKey];

        processed_rows_with_rooms.push({ 
            ...row, 
            'Room No': assignedRoomName,
            'seatNumber': seatNumber, // This is the key: e.g., 1, 2, 3...
            'isScribe': isScribe 
        });
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
        
        // 2. Get the ORIGINAL allocation with seat numbers
        const processed_rows_with_rooms = performOriginalAllocation(data);

        // *** NEW: Load scribe data and create final list ***
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        
        const final_student_list_for_report = [];
        
        for (const student of processed_rows_with_rooms) {
            if (student.isScribe) {
                // This is a scribe student. Find their allotted scribe room.
                const sessionKeyPipe = `${student.Date} | ${student.Time}`;
                const sessionScribeAllotment = allScribeAllotments[sessionKeyPipe] || {};
                const scribeRoom = sessionScribeAllotment[student['Register Number']] || 'N/A';
                
                // *** FIX: Add a 'remark' property instead of changing the name ***
                final_student_list_for_report.push({ 
                    ...student, 
                    Name: student.Name, // Keep original name
                    remark: `${scribeRoom}`, // *** Add remark (Room Number only) ***
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
            
            // *** FIX: Changed "Sl No" to "Seat No" and swapped Remarks/Signature ***
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
                    // *** FIX: Use student.seatNumber and add asterisk ***
                    const seatNumber = student.seatNumber;
                    const asterisk = student.isPlaceholder ? '*' : '';
                    
                    // *** NEW: Get QP Code ***
                    const sessionKey = `${student.Date} | ${student.Time}`;
                    const sessionQPCodes = qpCodeMap[sessionKey] || {};
                    const courseKey = cleanCourseKey(student.Course);
                    const qpCode = sessionQPCodes[courseKey] || "";
                    
                    // *** FIX: QP Code first, then course name ***
                    const qpCodePrefix = qpCode ? `(${qpCode}) ` : ""; // e.g., "(QP123) "
                    
                    // Truncate the course name (student.Course)
                    const courseWords = student.Course.split(/\s+/);
                    const truncatedCourse = courseWords.slice(0, 4).join(' ') + (courseWords.length > 4 ? '...' : '');
                    
                    // Combine them
                    const tableCourseName = qpCodePrefix + truncatedCourse;
                    // ************************
                    
                    let displayCourseName = (tableCourseName === previousCourseName) ? '"' : tableCourseName;
                    if (tableCourseName !== previousCourseName) previousCourseName = tableCourseName;

                    // *** FIX: Use class for highlighting ***
                    const rowClass = student.isPlaceholder ? 'class="scribe-row-highlight"' : '';
                    
                    // *** FIX: Added Remarks Column Data, Swapped Remarks/Signature ***
                    const remarkText = student.remark || ''; // Get remark or empty string
                    rowsHtml += `
                        <tr ${rowClass}>
                            <td class="sl-col">${seatNumber}${asterisk}</td>
                            <td class="course-col">${displayCourseName}</td>
                            <td class="reg-col">${student['Register Number']}</td>
                            <td class="name-col">${student.Name}</td>
                            <td class="remarks-col">${remarkText}</td>
                            <td class="signature-col"></td>
                        </tr>
                    `;
                });
                return rowsHtml;
            }
            
            // *** FIX: Use student.seatNumber for sorting ***
            const studentsWithIndex = session.students.sort((a, b) => a.seatNumber - b.seatNumber);
            
            const studentsPage1 = studentsWithIndex.slice(0, 20); // Keep 20 per page for A4 portrait
            const studentsPage2 = studentsWithIndex.slice(20);

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
        const processed_rows_with_rooms = performOriginalAllocation(data); // <-- FIX: Use original allocation

        // 3. Group by Day/Session
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

        // *** NEW: Get scribe allotments ***
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        
        // 7. Build the HTML
        let allPagesHtml = '';
        let totalPagesGenerated = 0;
        // *** FIX: Changed to 35 rows per column for A4 fit ***
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

                // *** FIX: Get correct room and seat no for scribes ***
                let roomName = student['Room No'];
                let seatNo = student.seatNumber; // Use the original seat number
                let rowStyle = '';

                if (student.isScribe) {
                    const sessionKeyPipe = `${student.Date} | ${student.Time}`;
                    const sessionScribeAllotment = allScribeAllotments[sessionKeyPipe] || {};
                    roomName = sessionScribeAllotment[student['Register Number']] || 'N/A'; // Get new scribe room
                    seatNo = 'Scribe'; // Scribes don't have a seat number in the new room
                    rowStyle = 'font-weight: bold; color: #c2410c;'; // Style for scribe
                }
                // *****************************************************

                // Add the student row
                const roomInfo = currentRoomConfig[roomName];
                const location = (roomInfo && roomInfo.location) ? roomInfo.location : "";
                const roomDisplay = location ? `${roomName} (${location})` : roomName;

                // V48: Check if same as above
                const displayRoom = (roomDisplay === previousRoomDisplay) ? '"' : roomDisplay;
                previousRoomDisplay = roomDisplay; // Update for next iteration
                
                rowsHtml += `
                    <tr style="${rowStyle}">
                        <td>${student['Register Number']}</td>
                        <td>${student.Name}</td>
                        <td>${displayRoom}</td>
                        <td style="text-align: center;">${seatNo}</td>
                    </tr>
                `;
            });

            // (V30) Updated table header to remove Course
            // (V32) Updated widths
            // *** FIX: Changed Sl to Seat No ***
            return `
                <table class="daywise-report-table">
                    <thead>
                        <tr>
                            <th style="width: 25%;">Register No</th>
                            <th style="width: 35%;">Name</th>
                            <th style="width: 30%;">Room (Location)</th>
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
            
            // *** FIX: Sort students by Course, then Reg No for this report ***
            session.students.sort((a, b) => {
                if (a.Course !== b.Course) return a.Course.localeCompare(b.Course);
                return a['Register Number'].localeCompare(b['Register Number']);
            });
            
            for (let i = 0; i < session.students.length; i += STUDENTS_PER_PAGE) {
                const pageStudents = session.students.slice(i, i + STUDENTS_PER_PAGE);
                totalPagesGenerated++;
                
                const col1Students = pageStudents.slice(0, STUDENTS_PER_COLUMN);
                const col2Students = pageStudents.slice(STUDENTS_PER_COLUMN); 
                
                let columnHtml = '';
                if (col1Students.length > 0 && col2Students.length === 0) {
                    // Only column 1 needed
                    columnHtml = `<div class="column">${buildColumnTable(col1Students)}</div>`;
                } else if (col1Students.length > 0 && col2Students.length > 0) {
                    // Two columns needed
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
                
                // *** NEW: Scribe summary logic ***
                let scribeListHtml = '';
                // Check if this is the last page for the session
                if (i + STUDENTS_PER_PAGE >= session.students.length) {
                    const sessionScribes = session.students.filter(s => s.isScribe);
                    if (sessionScribes.length > 0) {
                        scribeListHtml = '<div class="scribe-summary-box" style="margin-top: 2rem; padding: 1rem; border: 2px solid #f97316; background: #fffbeb; border-radius: 8px;">';
                        scribeListHtml += '<h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 0.5rem; color: #c2410c;">Scribe Assistance Summary</h3>';
                        
                        sessionScribes.forEach(scribe => {
                            const sessionKeyPipe = `${scribe.Date} | ${scribe.Time}`;
                            const sessionScribeAllotment = allScribeAllotments[sessionKeyPipe] || {};
                            const newRoom = sessionScribeAllotment[scribe['Register Number']] || 'N/A';
                            
                            scribeListHtml += `<p style="font-size: 9pt; margin-bottom: 4px;"><strong>${scribe.Name}</strong> (${scribe['Register Number']})<br>Original: ${scribe['Room No']} (Seat ${scribe.seatNumber}) &rarr; <strong>New Room: ${newRoom}</strong></p>`;
                        });
                        scribeListHtml += '</div>';
                    }
                }
                // ******************************

                allPagesHtml += `
                    <div class="print-page print-page-daywise">
                        <div class="print-header-group">
                            <h1>Seating Details for Candidates</h1>
                            <h2>${currentCollegeName} &nbsp;|&nbsp; ${session.Date} &nbsp;|&nbsp; ${session.Time}</h2>
                        </div>
                        ${columnHtml}
                        ${scribeListHtml} 
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
    
    regNos.forEach((regNo, index) => {
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
            alert("No students have been added to the Scribe List in Scribe Assistance.");
            return;
        }
        const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));
        
        // 3. Get all scribe students from the main data
        const allScribeStudents = allData.filter(s => scribeRegNos.has(s['Register Number']));
        
        // 4. Get Original Room Allotments (by running the "original" allocation logic)
        const originalAllotments = performOriginalAllocation(allData); // Use the central function
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


// --- NAVIGATION VIEW-SWITCHING LOGIC (REORDERED) ---
navExtractor.addEventListener('click', () => showView(viewExtractor, navExtractor));
navScribeSettings.addEventListener('click', () => showView(viewScribeSettings, navScribeSettings));
navRoomAllotment.addEventListener('click', () => showView(viewRoomAllotment, navRoomAllotment));
navScribeAllotment.addEventListener('click', () => showView(viewScribeAllotment, navScribeAllotment));
navQPCodes.addEventListener('click', () => showView(viewQPCodes, navQPCodes));
navReports.addEventListener('click', () => showView(viewReports, navReports));
navAbsentees.addEventListener('click', () => showView(viewAbsentees, navAbsentees));
navSettings.addEventListener('click', () => showView(viewSettings, navSettings));
// document.getElementById('nav-room-settings').addEventListener('click', ...); // Removed

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


// --- Q-PAPER REPORT LOGIC ---
// Listener moved above

// --- (V33) NEW CSV UPLOAD LOGIC ---

// V33: Function called by Python to clear the CSV upload status
// *** FIX: Attached to window object ***
window.clear_csv_upload_status = function() {
    csvLoadStatus.textContent = "";
    if (correctedCsvUpload) {
        correctedCsvUpload.value = ""; // Clear the file input
    }
}

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
        generateDaywiseReportButton.disabled = false;
        generateScribeReportButton.disabled = false; // <-- NEW
        
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
        disable_scribe_tabs(false);
        populate_scribe_session_dropdown();
        loadGlobalScribeList();
        // *****************************
        
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

// *** FIX: Attach to window object ***
window.disable_absentee_tab = function(disabled) {
    navAbsentees.disabled = disabled;
    if (disabled) {
        absenteeLoader.classList.remove('hidden');
        absenteeContentWrapper.classList.add('hidden');
        navAbsentees.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        absenteeLoader.classList.add('hidden');
        absenteeContentWrapper.classList.remove('hidden');
        navAbsentees.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// *** FIX: Attach to window object ***
window.populate_session_dropdown = function() {
    try {
        allStudentData = JSON.parse(jsonDataStore.innerHTML || '[]');
        if (allStudentData.length === 0) {
            disable_absentee_tab(true);
            return;
        }
        
        // Get unique sessions
        const sessions = new Set(allStudentData.map(s => `${s.Date} | ${s.Time}`));
        allStudentSessions = Array.from(sessions).sort();
        
        sessionSelect.innerHTML = '<option value="">-- Select a Session --</option>'; // Clear
        reportsSessionSelect.innerHTML = '<option value="all">All Sessions</option>'; // V68: Clear and set default for reports
        
        // Find today's session
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-GB').replace(/\//g, '.'); // DD.MM.YYYY
        let defaultSession = "";
        
        allStudentSessions.forEach(session => {
            sessionSelect.innerHTML += `<option value="${session}">${session}</option>`;
            reportsSessionSelect.innerHTML += `<option value="${session}">${session}</option>`; // V68
            if (session.startsWith(todayStr)) {
                defaultSession = session;
            }
        });
        
        if (defaultSession) {
            sessionSelect.value = defaultSession;
            sessionSelect.dispatchEvent(new Event('change')); // Trigger change to load list
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

// *** FIX: Attach to window object ***
window.disable_qpcode_tab = function(disabled) {
    navQPCodes.disabled = disabled;
    if (disabled) {
        qpcodeLoader.classList.remove('hidden');
        qpcodeContentWrapper.classList.add('hidden');
        navQPCodes.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        qpcodeLoader.classList.add('hidden');
        qpcodeContentWrapper.classList.remove('hidden');
        navQPCodes.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// V89: Loads the *entire* QP code map from localStorage into the global var
function loadQPCodes() {
    qpCodeMap = JSON.parse(localStorage.getItem(QP_CODE_LIST_KEY) || '{}');
}

// V61: Populates the QP Code session dropdown
// *** FIX: Attach to window object ***
window.populate_qp_code_session_dropdown = function() {
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
        const cleanKey = cleanCourseKey(courseName);

        // V90 FIX: If the course name cleans to an empty string,
        // don't render an input for it as it cannot be saved.
        if (!cleanKey) {
            console.warn(`Skipping QP code input for un-keyable course: ${courseName}`);
            return; // Skip this iteration
        }
        
        // V89: Look up the code in the session-specific map
        const savedCode = sessionCodes[cleanKey] || "";
        
        htmlChunks.push(`
            <div class="flex items-center gap-3 p-2 border-b border-gray-200">
                <label class="font-medium text-gray-700 w-2/3 text-sm">${courseName}</label>
                <input type="text" 
                       class="qp-code-input block w-1/3 p-2 border border-gray-300 rounded-md shadow-sm text-sm" 
                       value="${savedCode}" 
                       data-course="${cleanKey}" 
                       placeholder="Enter QP Code">
            </div>
        `);
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
    
    for (let i = 0; i < qpInputs.length; i++) {
        const input = qpInputs[i];
        const courseKey = input.dataset.course; // Already cleaned
        const qpCode = input.value.trim();

        if (courseKey && qpCode) {
            thisSessionCodes[courseKey] = qpCode;
        }
    }

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
// *** FIX: Attach to window object ***
window.disable_room_allotment_tab = function(disabled) {
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
// *** FIX: Attach to window object ***
window.populate_room_allotment_session_dropdown = function() {
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
// *** FIX: Attach to window object ***
window.disable_scribe_tabs = function(disabled) {
    navScribeSettings.disabled = disabled;
    navScribeAllotment.disabled = disabled;
    
    if (disabled) {
        scribeLoader.classList.remove('hidden');
        scribeContentWrapper.classList.add('hidden');
        scribeAllotmentLoader.classList.remove('hidden');
        scribeAllotmentContentWrapper.classList.add('hidden');
        [navScribeSettings, navScribeAllotment].forEach(nav => nav.classList.add('opacity-50', 'cursor-not-allowed'));
    } else {
        // *** FIX: This logic was inverted, causing the "loader" bug ***
        scribeLoader.classList.add('hidden');
        scribeContentWrapper.classList.remove('hidden');
        scribeAllotmentLoader.classList.add('hidden');
        scribeAllotmentContentWrapper.classList.remove('hidden');
        // ***************************************************************
        [navScribeSettings, navScribeAllotment].forEach(nav => nav.classList.remove('opacity-50', 'cursor-not-allowed'));
    }
}

// Load the global list from localStorage
// *** FIX: Attach to window object ***
window.loadGlobalScribeList = function() {
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
        autocompleteResults.innerHTML = '';
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
// *** FIX: Attach to window object ***
window.populate_scribe_session_dropdown = function() {
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
    
    // *** FIX: Scribes should NOT be part of this auto-allot simulation ***
    const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));
    const studentsForAutoAllot = sessionStudents.filter(s => 
        !manuallyAllottedRegNos.has(s['Register Number']) && 
        !scribeRegNos.has(s['Register Number'])
    );
    
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
// *** FIX: Attach to window object ***
window.disable_all_report_buttons = function(disabled) {
    generateReportButton.disabled = disabled;
    generateQPaperReportButton.disabled = disabled;
    generateDaywiseReportButton.disabled = disabled;
    generateScribeReportButton.disabled = disabled;
}


// --- Run on initial page load ---
loadInitialData();
