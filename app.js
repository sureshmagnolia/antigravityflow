// --- FUNCTIONS FOR PYTHON  BRIDGE ---
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
function dismissLoader() {
    const loader = document.getElementById('initial-app-loader');
    const msgInterval = window.loaderMessageInterval; // Get the interval ID if defined

    if (msgInterval) clearInterval(msgInterval); // Stop the funny message timer

    if (loader) {
        loader.style.opacity = '0';
        // Delay removal for CSS transition
        setTimeout(() => { loader.remove(); }, 500);
    }
}

// Single function called when data is local, from cloud, or auth fails
function finalizeAppLoad() {
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof renderExamNameSettings === 'function') renderExamNameSettings();
    if (typeof loadGlobalScribeList === 'function') loadGlobalScribeList();
    if (typeof restoreActiveTab === 'function') restoreActiveTab(); // Restore last view
    dismissLoader(); // Safely remove the loader once all is done
}

let currentUser = null;
let currentCollegeId = null; // The shared document ID
let currentCollegeData = null; // Holds the full data including permissions
let isSyncing = false;
let cloudSyncUnsubscribe = null; // [NEW] To track the active listener
let hasUnsavedAllotment = false; // Tracks if room changes need saving
let isScribeAllotmentLocked = true; // Default to Locked
// --- MAIN APP LOGIC ---
// ADD THESE:
let settingsUnsub = null;
let opsUnsub = null;
let allocUnsub = null;
let staffUnsub = null;
let slotsUnsub = null;

document.addEventListener('DOMContentLoaded', () => {

    // --- LOADER ANIMATION LOGIC (New) ---
    const loaderMessages = [
        "Summoning the Exam Spirits... 👻",
        "Convincing the server to cooperate... 🤖",
        "Counting the students... (again) 🧐",
        "Finding the missing QP Codes... 🔍",
        "Waking up the Chief Superintendent... ☕",
        "Aligning the planets for seating... 🪐",
        "Loading faster than campus Wi-Fi... 🚀"
    ];

    // Start the cycle immediately and save ID to window
    const loaderMsgElement = document.getElementById('loader-message');
    let loaderMsgIndex = 0;

    if (loaderMsgElement) {
        window.loaderMessageInterval = setInterval(() => {
            loaderMsgIndex = (loaderMsgIndex + 1) % loaderMessages.length;
            loaderMsgElement.textContent = loaderMessages[loaderMsgIndex];
        }, 800); // Change message every 800ms
    }

    // Ensure this function exists to stop it later
    window.finalizeAppLoad = function () {
        // 1. Run UI Updates
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof renderExamNameSettings === 'function') renderExamNameSettings();
        if (typeof loadGlobalScribeList === 'function') loadGlobalScribeList();
        if (typeof restoreActiveTab === 'function') restoreActiveTab();

        // 2. Stop Animation & Remove Loader
        if (window.loaderMessageInterval) clearInterval(window.loaderMessageInterval);

        const loader = document.getElementById('initial-app-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.remove(); }, 500);
        }
    };

    // ------------------------------------

    // --- Global localStorage Key ---
    const STREAM_CONFIG_KEY = 'examStreamsConfig'; // <-- Add this definition
    const ROOM_CONFIG_KEY = 'examRoomConfig';
    const COLLEGE_NAME_KEY = 'examCollegeName';
    const ABSENTEE_LIST_KEY = 'examAbsenteeList';
    const QP_CODE_LIST_KEY = 'examQPCodes';
    const BASE_DATA_KEY = 'examBaseData';
    const ROOM_ALLOTMENT_KEY = 'examRoomAllotment';
    const INVIG_MAPPING_KEY = 'examInvigilatorMapping';
    let currentInvigMapping = {}; // { "SessionKey": { "RoomName": "StaffName" } }
    const mobileSyncDot = document.getElementById('mobile-sync-dot');
    // *** MOVED HERE TO FIX ERROR ***
    const EXAM_RULES_KEY = 'examRulesConfig';
    let currentExamRules = [];
    let isExamRulesLocked = true; // <--- ADD THIS NEW VARIABLE
    let isAddingExamSchedule = false; // Controls visibility of the schedule form    
    let isAllotmentLocked = true; // Default locked state for Room Allotment
    // ******************************

    // *** NEW SCRIBE KEYS ***
    const SCRIBE_LIST_KEY = 'examScribeList';
    const SCRIBE_ALLOTMENT_KEY = 'examScribeAllotment';
    // ***********************
    // *** NEW: All keys for backup/restore ***
    const ALL_DATA_KEYS = [
        ROOM_CONFIG_KEY,
        STREAM_CONFIG_KEY, // <-- Add this
        COLLEGE_NAME_KEY,
        ABSENTEE_LIST_KEY,
        QP_CODE_LIST_KEY,
        BASE_DATA_KEY,
        ROOM_ALLOTMENT_KEY,
        SCRIBE_LIST_KEY,
        SCRIBE_ALLOTMENT_KEY,
        EXAM_RULES_KEY,
        // --- NEW KEYS FOR MODULAR ARCHITECTURE ---
        'examInvigilationSlots',
        'examStaffData',
        'examInvigilatorMapping'// <--- ADD THIS LINE (To include in Backup/Restore)
    ];
    // **********************************

    // --- Debounce Helper Function ---
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // --- Helper: Chronological Session Sort (Oldest First) ---
    function compareSessionStrings(a, b) {
        // Split "DD.MM.YYYY | HH:MM AM"
        // If separator is missing, treat whole string as date
        const splitA = a.includes('|') ? a.split('|') : [a, ''];
        const splitB = b.includes('|') ? b.split('|') : [b, ''];

        const dateAStr = splitA[0].trim();
        const timeAStr = splitA[1].trim();
        const dateBStr = splitB[0].trim();
        const timeBStr = splitB[1].trim();

        // 1. Compare Dates
        const [dA, mA, yA] = dateAStr.split('.');
        const [dB, mB, yB] = dateBStr.split('.');

        const dateA = new Date(yA, mA - 1, dA);
        const dateB = new Date(yB, mB - 1, dB);

        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;

        // 2. Compare Times (if dates are equal)
        if (timeAStr && timeBStr) {
            const parseTime = (t) => {
                const [time, mod] = t.split(' ');
                let [h, m] = time.split(':');
                h = parseInt(h);
                if (mod === 'PM' && h !== 12) h += 12;
                if (mod === 'AM' && h === 12) h = 0;
                return h * 60 + parseInt(m);
            };
            return parseTime(timeAStr) - parseTime(timeBStr);
        }

        return 0;
    }


    // --- FIREBASE MULTI-USER SYNC LOGIC ---

    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfoDiv = document.getElementById('user-info');
    const userNameDisplay = document.getElementById('user-name');
    const syncStatusDisplay = document.getElementById('sync-status');

    // Admin UI Elements
    const adminBtn = document.getElementById('admin-btn');
    const btnInvigilation = document.getElementById('btn-invigilation-portal'); // <--- ADD THIS
    const adminModal = document.getElementById('admin-modal');
    const closeAdminModal = document.getElementById('close-admin-modal');
    const newUserEmailInput = document.getElementById('new-user-email');
    const addUserBtn = document.getElementById('add-user-btn');
    const userListContainer = document.getElementById('user-list');
    const absenteeQpFilter = document.getElementById('absentee-qp-filter');

    // *** MOVED HERE TO FIX ERROR ***
    const SUPER_ADMIN_EMAIL = "sureshmagnolia@gmail.com";
    // ******************************


    // [NEW] Network Connectivity Listeners
    window.addEventListener('online', () => {
        updateSyncStatus("Back Online", "success");
        // If we are logged in and have a college ID, reconnect the live sync
        if (currentUser && currentCollegeId) {
            console.log("🌐 Network restored. Re-initializing cloud sync...");
            syncDataFromCloud(currentCollegeId);
        }
    });

    window.addEventListener('offline', () => {
        updateSyncStatus("No Connection", "error");
    });

    // --- 1. AUTHENTICATION ---

    // 1. Login Handler
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const { auth, provider, signInWithPopup } = window.firebase;

            // *** NEW LINE: Force Google to show the account picker ***
            provider.setCustomParameters({ prompt: 'select_account' });

            signInWithPopup(auth, provider)
                .then((result) => {
                    console.log("Logged in:", result.user);
                    // Auth listener will handle the rest
                }).catch((error) => {
                    console.error(error);
                    alert("Login Failed: " + error.message);
                });
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const { auth, signOut } = window.firebase;
            if (await UiModal.confirm("Log Out", "Are you sure you want to log out?")) {
                signOut(auth).then(() => location.reload());
            }
        });
    }

    // Auth Listener - REMOVED THE SETTIMEOUT WRAPPER
    if (window.firebase && window.firebase.auth) {
        const { auth, onAuthStateChanged } = window.firebase;
        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUser = user;
                loginBtn.classList.add('hidden');
                logoutBtn.classList.remove('hidden');

                // --- SHOW User Info & Sync Status ---
                userInfoDiv.classList.add('md:block'); // Show on Desktop
                if (mobileSyncDot) mobileSyncDot.classList.remove('hidden'); // Show on Mobile

                userNameDisplay.textContent = user.displayName || "User";

                // START: Find or Create College
                findMyCollege(user);
            } else {
                currentUser = null;
                loginBtn.classList.remove('hidden');
                logoutBtn.classList.add('hidden');

                // --- HIDE User Info & Sync Status ---
                userInfoDiv.classList.remove('md:block'); // Hide on Desktop
                if (mobileSyncDot) mobileSyncDot.classList.add('hidden'); // Hide on Mobile

                adminBtn.classList.add('hidden');

                // Hide Invigilation Button
                if (btnInvigilation) btnInvigilation.classList.add('hidden');

                // Load Local Data & Finalize
                loadInitialData();
                finalizeAppLoad();
            }
        });
    }
    // ------------------------------------------

    async function createNewCollege(user) {
        // 1. ASK FOR NAME
        let newName = await UiModal.prompt("Setup College", "Please enter the Official Name of your College/Institution:", "e.g. Govt Victoria College");
        if (!newName || newName.trim() === "") {
            newName = "My College Exam Database"; // Fallback
        }

        const { db, collection, addDoc } = window.firebase;

        // Prepare initial data from local storage
        const initialData = {};
        const keysToSync = [
            'examRoomConfig',
            'examCollegeName',
            'examAbsenteeList',
            'examQPCodes',
            'examBaseData',
            'examRoomAllotment',
            'examScribeList',
            'examScribeAllotment',
            'examRulesConfig'
        ];
        keysToSync.forEach(key => {
            const val = localStorage.getItem(key);
            if (val) initialData[key] = val;
        });

        // 2. OVERWRITE NAME TO CLOUD DATA
        initialData.examCollegeName = newName;
        localStorage.setItem('examCollegeName', newName);

        // Metadata
        initialData.admins = [user.email];
        initialData.allowedUsers = [user.email];
        initialData.lastUpdated = new Date().toISOString();

        try {
            const docRef = await window.firebase.addDoc(window.firebase.collection(db, "colleges"), initialData);
            currentCollegeId = docRef.id;
            await UiModal.alert("Success", `✅ Database Created for "${newName}"!\nYou are the Admin.`);
            syncDataFromCloud(currentCollegeId);
        } catch (e) {
            console.error("Creation failed:", e);
            await UiModal.alert("Error", "Failed to create database. " + e.message);
        }
    }

// --- HELPER: Calculate Slot Requirements from Student Data ---
function updateLocalSlotsFromStudents() {
    const localBaseData = localStorage.getItem('examBaseData');
    if (!localBaseData) return false; // No data to process

    try {
        const students = JSON.parse(localBaseData);
        const scribeListRaw = JSON.parse(localStorage.getItem('examScribeList') || '[]');
        const scribeRegNos = new Set(scribeListRaw.map(s => s.regNo));
        const sessionStats = {};

        // 1. Count Candidates
        students.forEach(s => {
            const d = s.Date ? s.Date.trim() : "";
            const t = s.Time ? s.Time.trim() : "";
            if (!d || !t) return;

            const key = `${d} | ${t}`;
            if (!sessionStats[key]) {
                sessionStats[key] = {
                    normalStreams: {},
                    scribeStreams: {},
                    totalScribes: 0,
                    totalStudents: 0
                };
            }

            sessionStats[key].totalStudents++;
            const strm = s.Stream || "Regular";

            if (scribeRegNos.has(s['Register Number'])) {
                if (!sessionStats[key].scribeStreams[strm]) sessionStats[key].scribeStreams[strm] = 0;
                sessionStats[key].scribeStreams[strm]++;
                sessionStats[key].totalScribes++;
            } else {
                if (!sessionStats[key].normalStreams[strm]) sessionStats[key].normalStreams[strm] = 0;
                sessionStats[key].normalStreams[strm]++;
            }
        });

        // 2. Merge with Existing Slots
        let existingSlots = JSON.parse(localStorage.getItem('examInvigilationSlots') || '{}');
        let hasChanges = false;

        Object.keys(sessionStats).forEach(key => {
            const stats = sessionStats[key];
            let baseRequirement = 0;

            // Calculate Norms
            Object.values(stats.normalStreams).forEach(count => baseRequirement += Math.ceil(count / 30));
            Object.values(stats.scribeStreams).forEach(count => baseRequirement += Math.ceil(count / 5));
            const reserve = Math.ceil(baseRequirement * 0.10);
            const totalRequired = baseRequirement + reserve;

            if (!existingSlots[key]) {
                // Create New Slot
                existingSlots[key] = {
                    required: totalRequired,
                    reserveCount: reserve,
                    assigned: [],
                    unavailable: [],
                    isLocked: false,
                    scribeCount: stats.totalScribes,
                    studentCount: stats.totalStudents
                };
                hasChanges = true;
            } else {
                // Update Existing (Only if counts changed)
                const slot = existingSlots[key];
                if (slot.required !== totalRequired || slot.studentCount !== stats.totalStudents) {
                    slot.required = totalRequired;
                    slot.reserveCount = reserve;
                    slot.scribeCount = stats.totalScribes;
                    slot.studentCount = stats.totalStudents;
                    hasChanges = true;
                }
            }
        });

        if (hasChanges) {
            localStorage.setItem('examInvigilationSlots', JSON.stringify(existingSlots));
            return true; // Indicates slots were updated
        }
    } catch (e) {
        console.error("Slot Calc Error:", e);
    }
    return false;
}
    // ==========================================
    // ☁️ CLOUD SYNC FUNCTIONS (Fixed & Updated)
    // ==========================================

    // 5. CLOUD DOWNLOAD FUNCTION (Network Aware)
   function syncDataFromCloud(collegeId) {
    if (!navigator.onLine) {
        console.log("⚠️ Offline Mode. Loading local data.");
        updateSyncStatus("Offline Mode", "error");
        loadInitialData();
        if (typeof finalizeAppLoad === 'function') finalizeAppLoad();
        return;
    }

    updateSyncStatus("Connecting...", "neutral");
    const { db, doc, onSnapshot, collection, getDocs, query, orderBy } = window.firebase;

    // Cleanup old listeners (critical for preventing read charges/duplicates)
    if (cloudSyncUnsubscribe) cloudSyncUnsubscribe();
    if (settingsUnsub) settingsUnsub();
    if (opsUnsub) opsUnsub();
    if (allocUnsub) allocUnsub();
    if (staffUnsub) staffUnsub();
    if (slotsUnsub) slotsUnsub();

    // Helper to sync local storage keys from cloud data
    const syncLocal = (dataObj) => {
        if(!dataObj) return;
        Object.keys(dataObj).forEach(key => {
            if(dataObj[key]) localStorage.setItem(key, dataObj[key]);
        });
    };

    // 1. LISTEN TO METADATA & PERMISSIONS (Root Doc) - Low Bandwidth
    // This only contains lightweight administrative metadata (admins, allowedUsers).
    cloudSyncUnsubscribe = onSnapshot(doc(db, "colleges", collegeId), (snap) => {
        if (snap.exists()) {
            currentCollegeData = snap.data();
            
            // Handle permissions and UI buttons (Admin/Invigilation links)
            const isAdminUser = currentCollegeData.admins && currentUser && currentCollegeData.admins.includes(currentUser.email);
            const isTeamMember = currentCollegeData.allowedUsers && currentUser && currentCollegeData.allowedUsers.includes(currentUser.email);

            if (adminBtn) isAdminUser ? adminBtn.classList.remove('hidden') : adminBtn.classList.add('hidden');
            if (btnInvigilation) (isAdminUser || isTeamMember) ? btnInvigilation.classList.remove('hidden') : btnInvigilation.classList.add('hidden');
            
            updateHeaderCollegeName(); // Refresh name
            if (typeof updateStudentPortalLink === 'function') updateStudentPortalLink();
        }
    }, (error) => { console.error("Root Doc Sync Error:", error); });
    
    // 2. LISTEN TO SETTINGS (Config, Streams, Rooms) - Low Updates
    settingsUnsub = onSnapshot(doc(db, "colleges", collegeId, "system_data", "settings"), (snap) => {
        if(snap.exists()) {
            syncLocal(snap.data());
            // Reactively Refresh specific UIs
            if(typeof loadRoomConfig === 'function') loadRoomConfig();
            if(typeof loadStreamConfig === 'function') loadStreamConfig();
            if(typeof renderExamNameSettings === 'function') renderExamNameSettings();
            
            // Check for the college name migration prompt logic here if needed, 
            // but ensure it's wrapped to only run once on app load.
        }
    }, (error) => { console.error("Settings Sync Error:", error); });

    // 3. LISTEN TO OPERATIONS (Absentees, QP Codes) - Medium Updates
    opsUnsub = onSnapshot(doc(db, "colleges", collegeId, "system_data", "operations"), (snap) => {
        if(snap.exists()) syncLocal(snap.data());
    }, (error) => { console.error("Operations Sync Error:", error); });

    // 4. LISTEN TO ALLOCATIONS (Scribes) - Medium Updates
    allocUnsub = onSnapshot(doc(db, "colleges", collegeId, "system_data", "allocation"), (snap) => {
        if(snap.exists()) {
            syncLocal(snap.data());
            if(typeof loadGlobalScribeList === 'function') loadGlobalScribeList();
        }
    }, (error) => { console.error("Allocation Sync Error:", error); });

    // 5. LISTEN TO STAFF (Invigilation Staff Data) - Medium Updates
    staffUnsub = onSnapshot(doc(db, "colleges", collegeId, "system_data", "staff"), (snap) => {
        if(snap.exists()) syncLocal(snap.data());
    }, (error) => { console.error("Staff Sync Error:", error); });
    
    // 6. LISTEN TO SLOTS (Invigilation Slots/Schedule) - High Updates
    slotsUnsub = onSnapshot(doc(db, "colleges", collegeId, "system_data", "slots"), (snap) => {
        if(snap.exists()) syncLocal(snap.data());
    }, (error) => { console.error("Slots Sync Error:", error); });

    // 7. FETCH HEAVY DATA (Students/Seating) - ONE TIME FETCH ONLY
    // We do NOT listen to this constantly. We use the main doc's 'lastUpdated' 
    // to determine when to fetch the chunks (which we will fix in a moment).
    const fetchHeavyData = async () => {
        console.log("☁️ Fetching heavy data chunks...");
        try {
            const dataColRef = collection(db, "colleges", collegeId, "data");
            const q = query(dataColRef, orderBy("index"));
            const querySnapshot = await getDocs(q);
            let fullPayload = "";
            querySnapshot.forEach((doc) => { 
                if (doc.id.startsWith("chunk_")) fullPayload += doc.data().payload; 
            });
            
            if (fullPayload) {
                const bulkData = JSON.parse(fullPayload);
                ['examBaseData', 'examRoomAllotment'].forEach(key => {
                    if (bulkData[key]) localStorage.setItem(key, bulkData[key]);
                });
                updateSyncStatus("Synced", "success");
            } else {
                 updateSyncStatus("Synced", "success");
            }
        } catch (err) {
            console.error("Bulk fetch error:", err);
            updateSyncStatus("Error", "error");
        }
        
        // Final UI Load after all data is locally available
        loadInitialData(); 
        if (typeof finalizeAppLoad === 'function') finalizeAppLoad();
    };

    // The old timestamp logic is now slightly broken. 
    // For simplicity and immediate fix, we run the fetch when we establish connection.
    // In a future optimization, you could use the main doc 'lastUpdated' field, 
    // but only use it to trigger the fetchHeavyData() function.
    fetchHeavyData();

}

   // 4. CLOUD UPLOAD FUNCTION (Optimized with Invigilation Slot Sync)
    // MODULAR SYNC FUNCTION
    // targetSection: 'settings', 'ops', 'allocation', 'staff', 'slots', or 'heavy' (default)
    async function syncDataToCloud(targetSection = 'heavy') {
        if (!currentUser || !currentCollegeId || isSyncing) return;
        if (!navigator.onLine) return updateSyncStatus("Offline", "error");

        isSyncing = true;
        updateSyncStatus("Saving...", "neutral");

        const { db, doc, setDoc, writeBatch, collection } = window.firebase;
        const cid = currentCollegeId;
        const timestamp = new Date().toISOString();

        try {
            // Helper to get data
            const get = (k) => localStorage.getItem(k);

            // 1. SETTINGS (Fast)
            if (targetSection === 'settings') {
                const data = {
                    examCollegeName: get('examCollegeName'),
                    examRoomConfig: get('examRoomConfig'),
                    examStreamsConfig: get('examStreamsConfig'),
                    examSessionNames: get('examSessionNames'),
                    examRulesConfig: get('examRulesConfig'),
                    examRemunerationConfig: get('examRemunerationConfig'),
                    lastUpdated: timestamp
                };
                await setDoc(doc(db, "colleges", cid, "system_data", "settings"), data, { merge: true });
            }

            // 2. OPERATIONS (Fast)
            else if (targetSection === 'ops') {
                const data = {
                    examAbsenteeList: get('examAbsenteeList'),
                    examQPCodes: get('examQPCodes')
                };
                await setDoc(doc(db, "colleges", cid, "system_data", "operations"), data, { merge: true });
            }

            // 3. ALLOCATION (Scribes)
            else if (targetSection === 'allocation') {
                const data = {
                    examScribeList: get('examScribeList'),
                    examScribeAllotment: get('examScribeAllotment')
                };
                await setDoc(doc(db, "colleges", cid, "system_data", "allocation"), data, { merge: true });
            }

            // 4. STAFF (Invigilation)
            else if (targetSection === 'staff') {
                const data = {
                    examStaffData: get('examStaffData'),
                    examInvigilatorMapping: get('examInvigilatorMapping')
                };
                await setDoc(doc(db, "colleges", cid, "system_data", "staff"), data, { merge: true });
            }

            // 5. SLOTS (Invigilation)
            else if (targetSection === 'slots') {
                const data = {
                    examInvigilationSlots: get('examInvigilationSlots'),
                    invigAdvanceUnavailability: get('invigAdvanceUnavailability')
                };
                await setDoc(doc(db, "colleges", cid, "system_data", "slots"), data, { merge: true });
            }

            // 6. HEAVY DATA (Students & Room Allotment) - ONLY on specific actions
            else if (targetSection === 'heavy') {
        
            // --- ADD THIS BLOCK ---
            // 1. Auto-Calculate Slots based on new Student Data
            const slotsUpdated = updateLocalSlotsFromStudents();
        
            // 2. If slots changed, trigger a slot sync immediately
            if (slotsUpdated) {
            // We await this to ensure slots are consistent in cloud
            await syncDataToCloud('slots'); 
            }
                
                
                
                const batch = writeBatch(db);
                const bulkData = {
                    examBaseData: get('examBaseData'),
                    examRoomAllotment: get('examRoomAllotment')
                };
                
                // Chunking Logic
                const jsonStr = JSON.stringify(bulkData);
                const chunks = chunkString(jsonStr, 800000); // Defined in your app.js already
                
                // 1. Update timestamp on main doc to trigger reload for others
                batch.update(doc(db, "colleges", cid), { lastUpdated: timestamp });

                // 2. Write Chunks
                chunks.forEach((chunk, idx) => {
                    const ref = doc(db, "colleges", cid, "data", `chunk_${idx}`);
                    batch.set(ref, { payload: chunk, index: idx, totalChunks: chunks.length });
                });
                
                await batch.commit();
            }

            updateSyncStatus("Saved", "success");

        } catch (e) {
            console.error("Sync Failed:", e);
            updateSyncStatus("Save Error", "error");
        } finally {
            isSyncing = false;
        }
    }
    // --- 3. ADMIN / TEAM MANAGEMENT LOGIC ---

    adminBtn.addEventListener('click', () => {
        renderUserList();
        adminModal.classList.remove('hidden');
    });

    closeAdminModal.addEventListener('click', () => {
        adminModal.classList.add('hidden');
    });

    function renderUserList() {
        if (!currentCollegeData || !currentCollegeData.allowedUsers) return;
        userListContainer.innerHTML = '';

        currentCollegeData.allowedUsers.forEach(email => {
            const isAdmin = currentCollegeData.admins.includes(email);
            const li = document.createElement('li');
            li.className = "flex justify-between items-center bg-gray-50 p-2 rounded";
            li.innerHTML = `
            <span>${email} ${isAdmin ? '<span class="text-xs bg-blue-100 text-blue-800 px-1 rounded">Admin</span>' : ''}</span>
            ${!isAdmin ? `<button class="text-red-500 hover:text-red-700" onclick="removeUser('${email}')">&times;</button>` : ''}
        `;
            userListContainer.appendChild(li);
        });
    }

    // Add New User (Clerk)
    addUserBtn.addEventListener('click', async () => {
        const newEmail = newUserEmailInput.value.trim();
        if (!newEmail) return;
        if (!newEmail.includes('@')) { await UiModal.alert("Error", "Invalid email"); return; }

        const { db, doc, updateDoc, arrayUnion } = window.firebase;

        try {
            const docRef = doc(db, "colleges", currentCollegeId);
            await updateDoc(docRef, {
                allowedUsers: arrayUnion(newEmail) // Atomically add email
            });

            // Update local cache
            if (!currentCollegeData.allowedUsers.includes(newEmail)) {
                currentCollegeData.allowedUsers.push(newEmail);
            }

            newUserEmailInput.value = '';
            renderUserList();
            await UiModal.alert("Success", `User ${newEmail} added! They can now log in with their Google Account to see this data.`);
        } catch (e) {
            console.error("Add User Error:", e);
            await UiModal.alert("Error", "Failed to add user: " + e.message);
        }
    });

    // Remove User
    window.removeUser = async function (email) {
        if (!await UiModal.confirm("Remove User", `Remove access for ${email}?`)) return;

        const { db, doc, updateDoc, arrayRemove } = window.firebase;

        try {
            const docRef = doc(db, "colleges", currentCollegeId);
            await updateDoc(docRef, {
                allowedUsers: arrayRemove(email) // Atomically remove email
            });

            // Update local cache
            currentCollegeData.allowedUsers = currentCollegeData.allowedUsers.filter(e => e !== email);
            renderUserList();
        } catch (e) {
            await UiModal.alert("Error", "Failed to remove: " + e.message);
        }
    }
// --- TIME NORMALIZER (Fixes 2:00 vs 02:00 issue) ---
    // --- UNIVERSAL TIME NORMALIZER (Handles :, ., 24h, 12h) ---
    function normalizeTime(timeStr) {
        if (!timeStr) return "";
        
        const t = timeStr.trim().toUpperCase();
        
        // Regex to find HH, MM, and optional AM/PM
        // Allows ':' or '.' as separators
        // Allows optional space before AM/PM
        const match = t.match(/(\d{1,2})[:.](\d{2})\s*(AM|PM)?/);

        if (!match) return timeStr; // Return original if really weird

        let h = parseInt(match[1], 10);
        const m = match[2];
        let ampm = match[3]; // Might be undefined if 24h format

        // LOGIC A: If AM/PM is present (12-hour format input)
        if (ampm) {
            // Standardize 12-hour formatting (just padding)
        } 
        // LOGIC B: No AM/PM (24-hour format input, e.g. "14:30" or "09:30")
        else {
            ampm = h >= 12 ? "PM" : "AM";
            h = h % 12;
            h = h ? h : 12; // 0 or 12 becomes 12
        }

        // Final Formatting: Always 02:00 PM
        const hh = String(h).padStart(2, '0');
        return `${hh}:${m} ${ampm}`;
    }
    // Helper for status UI (Updates Desktop & Mobile)
    function updateSyncStatus(status, type) {
        // 1. Desktop Status (Text)
        const syncStatusDisplay = document.getElementById('sync-status');
        if (syncStatusDisplay) {
            syncStatusDisplay.textContent = status;
            syncStatusDisplay.className = type === 'success' ? 'text-xs text-green-400' : (type === 'error' ? 'text-xs text-red-400' : 'text-xs text-yellow-400');
        }

        // 2. Mobile Status (Dot Only)
        const mobileDot = document.getElementById('mobile-sync-dot');
        if (mobileDot) {
            if (type === 'success') mobileDot.className = "md:hidden w-2 h-2 rounded-full bg-green-400 mr-1";
            else if (type === 'error') mobileDot.className = "md:hidden w-2 h-2 rounded-full bg-red-500 mr-1";
            else mobileDot.className = "md:hidden w-2 h-2 rounded-full bg-yellow-400 mr-1 animate-pulse";
        }
    }
    // --- Global var to hold data from the last *report run* ---
    let lastGeneratedRoomData = [];
    let lastGeneratedReportType = "";
    let currentStreamConfig = ["Regular"]; // Default
    let isStreamSettingsLocked = true; // Default Locked state for Streams
    // --- (V28) Global var to hold room config map for report generation ---
    let currentRoomConfig = {};


    let isQPLocked = true; // Default Locked
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
    const navHome = document.getElementById('nav-home'); // New
    const viewHome = document.getElementById('view-home'); // New
    const navEditData = document.getElementById('nav-edit-data'); // <-- ADD THIS
    const navSettings = document.getElementById('nav-settings');
    const navQPCodes = document.getElementById('nav-qpcodes');
    const navReports = document.getElementById('nav-reports');
    const navAbsentees = document.getElementById('nav-absentees');
    const navRemuneration = document.getElementById('nav-remuneration');
    const viewRemuneration = document.getElementById('view-remuneration');
    const btnAutoCalcBill = document.getElementById('btn-auto-calculate-bill');
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
    // Update these two lines to include 'navRemuneration' and 'viewRemuneration'
    const allNavButtons = [navHome, navExtractor, navEditData, navScribeSettings, navRoomAllotment, navQPCodes, navSearch, navReports, navAbsentees, navSettings, navRemuneration];
    const allViews = [viewHome, viewExtractor, viewEditData, viewScribeSettings, viewRoomAllotment, viewQPCodes, viewSearch, viewReports, viewAbsentees, viewSettings, viewRemuneration];

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
    // --- NEW: Responsive Sidebar Toggle Logic ---
    const toggleButton = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('main-nav');

    // --- INJECT PRINT BUTTON FOR REPORTS (Replaces Download PDF) ---
    const btnPrintReport = document.createElement('button');
    btnPrintReport.id = 'print-generated-report-btn';
    // Style: Gray/Dark to match Print actions
    btnPrintReport.className = "flex-1 inline-flex justify-center items-center rounded-md border border-transparent bg-gray-700 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800";
    btnPrintReport.innerHTML = `🖨️ Print Report`;

    // FIX: Anchor to 'clearReportButton' because 'finalPrintButton' was removed from HTML
    if (clearReportButton && clearReportButton.parentNode) {
        if (!document.getElementById('print-generated-report-btn')) {
            // Insert BEFORE the Clear button
            clearReportButton.parentNode.insertBefore(btnPrintReport, clearReportButton);
        }
        
        // Cleanup: Remove the old download button if it exists
        const oldBtn = document.getElementById('download-report-pdf-btn');
        if (oldBtn) oldBtn.remove();
    }

    // Attach Listener (Opens the Print Preview Window)
    btnPrintReport.addEventListener('click', () => {
        const content = document.getElementById('report-output-area').innerHTML;
        if (!content.trim()) return UiModal.alert("Info", "No report generated.");

        const filename = (typeof lastGeneratedReportType !== 'undefined' && lastGeneratedReportType)
            ? lastGeneratedReportType
            : "Exam_Report";

        openPdfPreview(content, filename);
    });

    if (toggleButton && sidebar) {
        toggleButton.addEventListener('click', () => {
            // Check if we are on Mobile (window width < 768px)
            const isMobile = window.innerWidth < 768;

            if (isMobile) {
                // On Mobile: Slide the sidebar IN or OUT
                // We toggle the class that hides it off-screen
                sidebar.classList.toggle('-translate-x-full');

                // Optional: Add a click-outside listener to close it
                if (!sidebar.classList.contains('-translate-x-full')) {
                    // Sidebar is open on mobile, adding a simple close logic could be added here
                }
            } else {
                // On Desktop: Do the existing Collapse/Expand logic
                sidebar.classList.toggle('w-64'); // Full width
                sidebar.classList.toggle('w-20'); // Collapsed width

                sidebar.classList.toggle('p-4');
                sidebar.classList.toggle('p-2');

                // Toggle text visibility
                sidebar.querySelectorAll('.nav-button span').forEach(span => {
                    span.classList.toggle('hidden');
                });

                // Toggle centering icons
                sidebar.querySelectorAll('.nav-button').forEach(button => {
                    button.classList.toggle('justify-center');
                });
            }
        });
    }
    // --- NEW: Close Sidebar Button Logic ---
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            // Always hide sidebar when X is clicked
            sidebar.classList.add('-translate-x-full');
        });
    }
    // --- END: Sidebar Toggle Logic ---

    // --- SCRIBE ALLOTMENT LOCK TOGGLE ---
    const toggleScribeAllotmentLockBtn = document.getElementById('toggle-scribe-allotment-lock-btn');
    if (toggleScribeAllotmentLockBtn) {
        toggleScribeAllotmentLockBtn.addEventListener('click', () => {
            isScribeAllotmentLocked = !isScribeAllotmentLocked;

            if (isScribeAllotmentLocked) {
                toggleScribeAllotmentLockBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                <span>List Locked</span>
            `;
                toggleScribeAllotmentLockBtn.className = "text-xs flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-200 transition shadow-sm";
            } else {
                toggleScribeAllotmentLockBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                <span>Unlocked</span>
            `;
                toggleScribeAllotmentLockBtn.className = "text-xs flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-100 transition shadow-sm";
            }

            // Refresh the list to apply disabled state
            if (allotmentSessionSelect && allotmentSessionSelect.value) {
                renderScribeAllotmentList(allotmentSessionSelect.value);
            }
        });
    }


    // [In app.js - Replace the previous Exam Name logic with this]

    const EXAM_NAMES_KEY = 'examSessionNames';
    let currentExamNames = {};

    // ==========================================
    // 🗓️ EXAM SCHEDULER (WITH EDIT & CONFLICT CHECKS)
    // ==========================================

    let editingRuleId = null; // Track which rule is being edited

    // Helper to determine if a time string is FN or AN
    function getSessionType(timeStr) {
        if (!timeStr) return "FN"; // Default
        const t = timeStr.toUpperCase().trim();

        // Logic: PM or 12:xx or 13:xx+ implies AN. Everything else is FN.
        if (t.includes("PM") || t.startsWith("12:") || t.startsWith("12.") ||
            t.startsWith("13:") || t.startsWith("14:") || t.startsWith("15:") || t.startsWith("16:")) {
            return "AN";
        }
        return "FN";
    }

    // Helper to convert Date+Session to a strictly comparable number (YYYYMMDDS)
    function getSessionValue(dateStr, sessionType) {
        if (!dateStr) return 0;

        let y, m, d;
        if (dateStr.includes('-')) {
            [y, m, d] = dateStr.split('-');
        } else if (dateStr.includes('.')) {
            [d, m, y] = dateStr.split('.');
        } else {
            return 0;
        }

        m = String(m).padStart(2, '0');
        d = String(d).padStart(2, '0');
        y = String(y);

        // 1 = FN, 2 = AN
        const sessionBit = (sessionType === 'AN') ? '2' : '1';

        return parseInt(`${y}${m}${d}${sessionBit}`, 10);
    }

    // --- CORE: Get Exam Name by checking Rules Database ---
    function getExamName(date, time, stream) {
        if (!currentExamRules || currentExamRules.length === 0) {
            const saved = localStorage.getItem(EXAM_RULES_KEY);
            if (saved) currentExamRules = JSON.parse(saved);
        }

        if (currentExamRules.length === 0) return "";

        const currentSession = getSessionType(time);
        const currentValue = getSessionValue(date, currentSession);
        const currentStream = stream || "Regular";

        let bestMatch = "";
        let minDuration = Infinity;

        for (let i = currentExamRules.length - 1; i >= 0; i--) {
            const rule = currentExamRules[i];

            if (rule.stream !== "All Streams" && rule.stream !== currentStream) continue;

            const startVal = getSessionValue(rule.startDate, rule.startSession);
            const endVal = getSessionValue(rule.endDate, rule.endSession);

            if (currentValue >= startVal && currentValue <= endVal) {
                const duration = endVal - startVal;
                if (duration < minDuration) {
                    minDuration = duration;
                    bestMatch = rule.examName;
                }
            }
        }

        return bestMatch;
    }

    // --- UI ELEMENTS ---
    const examSettingsModal = document.getElementById('exam-settings-modal');
    const closeExamModalBtn = document.getElementById('close-exam-modal-btn');
    const examModalBody = document.getElementById('exam-modal-body');

    // 1. DASHBOARD WIDGET
    function renderExamNameSettings() {
        const container = document.getElementById('exam-names-grid');
        const section = document.getElementById('exam-names-section');

        const saved = localStorage.getItem(EXAM_RULES_KEY);
        currentExamRules = saved ? JSON.parse(saved) : [];

        if (!container || !section) return;

        section.classList.remove('hidden');

        container.innerHTML = `
        <div class="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-4">
                <div class="p-3 bg-indigo-50 text-indigo-600 rounded-full shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-gray-800">Exam Configuration</h3>
                    <p class="text-sm text-gray-500">
                        <span class="font-bold text-indigo-600">${currentExamRules.length}</span> Active Schedules Defined
                    </p>
                </div>
            </div>
            
            <button onclick="openExamRulesModal()" class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage List
            </button>
        </div>
    `;
    }

    // 2. MODAL CONTROLS
    window.openExamRulesModal = function () {
        examSettingsModal.classList.remove('hidden');
        renderExamRulesInModal();
    }

    if (closeExamModalBtn) {
        closeExamModalBtn.addEventListener('click', () => {
            examSettingsModal.classList.add('hidden');
            renderExamNameSettings();
        });
    }

    // 3. RENDER MODAL CONTENT (Form + List)
    function renderExamRulesInModal() {
        if (!examModalBody) return;
        examModalBody.innerHTML = '';

        // A. Header Toolbar
        const lockBtnHtml = `
        <button id="toggle-exam-rules-lock" class="text-xs flex items-center gap-1 px-3 py-1.5 rounded-full transition shadow-sm font-medium border ${isExamRulesLocked ? 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="${isExamRulesLocked ? 'M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z' : 'M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z'}" />
            </svg>
            <span>${isExamRulesLocked ? 'List Locked' : 'Unlocked to Edit'}</span>
        </button>
    `;

        const headerHtml = `
        <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3 sticky top-0 bg-gray-50 z-10 py-2 border-b border-gray-200">
            <div class="flex items-center gap-2">${lockBtnHtml}</div>
            ${!isAddingExamSchedule ? `
            <button onclick="setExamScheduleMode(true)" class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition flex items-center justify-center gap-2 ${isExamRulesLocked ? 'opacity-50 cursor-not-allowed' : ''}" ${isExamRulesLocked ? 'disabled' : ''}>
                <span>+</span> Add New Exam
            </button>` : ''}
        </div>
    `;

        // B. Form Logic (Add or Edit)
        let formHtml = '';
        if (isAddingExamSchedule) {
            const streams = (typeof currentStreamConfig !== 'undefined') ? currentStreamConfig : ["Regular"];
            const streamOptions = streams.map(s => `<option value="${s}">${s}</option>`).join('');

            // Default Values or Edited Values
            let defName = "", defStream = "All Streams", defSDate = "", defEDate = "", defSSess = "FN", defESess = "AN";
            let formTitle = "Define New Exam";
            let submitBtnText = "Save";

            if (editingRuleId) {
                const rule = currentExamRules.find(r => r.id === editingRuleId);
                if (rule) {
                    defName = rule.examName;
                    defStream = rule.stream;
                    defSDate = rule.startDate;
                    defEDate = rule.endDate;
                    defSSess = rule.startSession;
                    defESess = rule.endSession;
                    formTitle = "Edit Exam Schedule";
                    submitBtnText = "Update Exam";
                }
            }

            formHtml = `
            <div class="bg-white p-4 md:p-6 rounded-xl border border-indigo-200 shadow-lg mb-8 relative ring-4 ring-indigo-50/50">
                <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                    <h4 class="text-sm font-bold text-indigo-800 uppercase tracking-wide">${formTitle}</h4>
                    <button onclick="cancelExamEdit()" class="text-gray-400 hover:text-red-500"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div class="col-span-1 md:col-span-2">
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Exam Name</label>
                        <input type="text" id="rule-name" value="${defName}" class="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="e.g. Third Semester B.Sc">
                    </div>
                    <div class="col-span-1">
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Applied Stream</label>
                        <select id="rule-stream" class="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                            <option value="All Streams" ${defStream === 'All Streams' ? 'selected' : ''}>All Streams (General)</option>
                            ${streams.map(s => `<option value="${s}" ${defStream === s ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="hidden md:block"></div>
                    <div class="col-span-1">
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                        <div class="flex gap-2">
                            <input type="date" id="rule-start-date" value="${defSDate}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onclick="this.showPicker()">
                            <select id="rule-start-session" class="w-20 px-2 py-2 border border-gray-300 bg-gray-50 font-bold text-sm">
                                <option value="FN" ${defSSess === 'FN' ? 'selected' : ''}>FN</option>
                                <option value="AN" ${defSSess === 'AN' ? 'selected' : ''}>AN</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-span-1">
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
                        <div class="flex gap-2">
                            <input type="date" id="rule-end-date" value="${defEDate}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onclick="this.showPicker()">
                            <select id="rule-end-session" class="w-20 px-2 py-2 border border-gray-300 bg-gray-50 font-bold text-sm">
                                <option value="FN" ${defESess === 'FN' ? 'selected' : ''}>FN</option>
                                <option value="AN" ${defESess === 'AN' ? 'selected' : ''}>AN</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="mt-6 flex justify-end gap-3 border-t border-gray-50 pt-3">
                    <button onclick="cancelExamEdit()" class="flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 bg-white border border-gray-200">Cancel</button>
                    <button id="save-rule-btn" class="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md">${submitBtnText}</button>
                </div>
            </div>
        `;
        }

        // C. List View
        let listHtml = '';
        if (currentExamRules.length > 0) {
            const sortedRules = [...currentExamRules].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
            const fmt = (d) => d.split('-').reverse().slice(0, 2).join('/');

            // 1. Mobile Cards HTML
            const mobileCards = sortedRules.map(rule => {
                const actionButtons = isExamRulesLocked ? '' : `
                <div class="absolute top-3 right-3 flex gap-2">
                    <button onclick="editExamRule('${rule.id}')" class="p-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 shadow-sm transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onclick="deleteExamRule('${rule.id}')" class="p-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 shadow-sm transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            `;

                return `
                <div class="bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm relative hover:shadow-md transition">
                    <div class="pr-20"> 
                        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Exam Name</div>
                        <h4 class="font-bold text-gray-900 text-sm leading-snug break-words">${rule.examName}</h4>
                        <span class="inline-block mt-2 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-100 uppercase tracking-wide">
                            ${rule.stream}
                        </span>
                    </div>
                    ${actionButtons}
                    <div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs">
                        <div>
                            <span class="block text-gray-400 font-bold text-[10px] uppercase">Starts</span>
                            <span class="font-mono text-gray-700 font-medium">${fmt(rule.startDate)}</span>
                            <span class="text-[10px] font-bold text-orange-600 bg-orange-50 px-1 rounded ml-1 border border-orange-100">${rule.startSession}</span>
                        </div>
                        <div>
                            <span class="block text-gray-400 font-bold text-[10px] uppercase">Ends</span>
                            <span class="font-mono text-gray-700 font-medium">${fmt(rule.endDate)}</span>
                            <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1 rounded ml-1 border border-indigo-100">${rule.endSession}</span>
                        </div>
                    </div>
                </div>
            `;
            }).join('');

            // 2. Desktop Rows HTML
            const desktopRows = sortedRules.map(rule => {
                const btnClass = isExamRulesLocked ? 'opacity-30 cursor-not-allowed pointer-events-none' : '';
                const editAction = isExamRulesLocked ? '' : `onclick="editExamRule('${rule.id}')"`;
                const deleteAction = isExamRulesLocked ? '' : `onclick="deleteExamRule('${rule.id}')"`;

                return `
                <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition">
                    <td class="px-4 py-3 text-sm font-bold text-gray-800">${rule.examName}</td>
                    <td class="px-4 py-3"><span class="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold border border-indigo-100 uppercase">${rule.stream}</span></td>
                    <td class="px-4 py-3 text-sm whitespace-nowrap text-gray-600">
                        <span class="font-mono font-bold">${fmt(rule.startDate)}</span> <span class="text-[10px] bg-gray-200 px-1 rounded">${rule.startSession}</span>
                        <span class="text-gray-300 mx-2">➜</span>
                        <span class="font-mono font-bold">${fmt(rule.endDate)}</span> <span class="text-[10px] bg-gray-200 px-1 rounded">${rule.endSession}</span>
                    </td>
                    <td class="px-4 py-3 text-right whitespace-nowrap">
                        <div class="flex items-center justify-end gap-2 ${btnClass}">
                            <button class="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition" ${editAction} title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button class="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition" ${deleteAction} title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }).join('');

            listHtml = `
            <div class="md:hidden space-y-2">${mobileCards}</div>
            <div class="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Exam Name</th>
                            <th class="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Stream</th>
                            <th class="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Date Range</th>
                            <th class="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">${desktopRows}</tbody>
                </table>
            </div>
        `;
        } else {
            listHtml = `
            <div class="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                <div class="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                </div>
                <p class="text-gray-600 font-bold text-sm">No exams configured yet.</p>
                <p class="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Click <span class="font-bold text-indigo-600">Add New Exam</span> to start.</p>
            </div>
        `;
        }

        examModalBody.innerHTML = headerHtml + formHtml + listHtml;

        // --- RE-ATTACH LISTENERS ---
        const lockBtn = document.getElementById('toggle-exam-rules-lock');
        if (lockBtn) lockBtn.addEventListener('click', () => { isExamRulesLocked = !isExamRulesLocked; renderExamRulesInModal(); });

        const saveBtn = document.getElementById('save-rule-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const name = document.getElementById('rule-name').value.trim();
                const stream = document.getElementById('rule-stream').value;
                const sDate = document.getElementById('rule-start-date').value;
                const sSess = document.getElementById('rule-start-session').value;
                const eDate = document.getElementById('rule-end-date').value;
                const eSess = document.getElementById('rule-end-session').value;

                if (!name || !sDate || !eDate) { alert("Please fill in Name, Start Date, and End Date."); return; }
                if (new Date(sDate) > new Date(eDate)) { alert("Start Date cannot be after End Date."); return; }

                const newStartVal = getSessionValue(sDate, sSess);
                const newEndVal = getSessionValue(eDate, eSess);

                // Conflict Detection (Ignore SELF if editing)
                const conflicts = currentExamRules.filter(r => {
                    if (editingRuleId && r.id === editingRuleId) return false; // Ignore self

                    const streamOverlap = (stream === "All Streams" || r.stream === "All Streams" || stream === r.stream);
                    if (!streamOverlap) return false;

                    const rStart = getSessionValue(r.startDate, r.startSession);
                    const rEnd = getSessionValue(r.endDate, r.endSession);
                    return (newStartVal <= rEnd && newEndVal >= rStart);
                });

                if (conflicts.length > 0) {
                    const conflictList = conflicts.map(c => `• ${c.examName} (${c.stream})`).join('\n');
                    if (!confirm(`⚠️ CONFLICT DETECTED ⚠️\n\nOverlap with:\n${conflictList}\n\nProceed?`)) return;
                }

                // Save Data
                if (editingRuleId) {
                    // Update Existing
                    const ruleIndex = currentExamRules.findIndex(r => r.id === editingRuleId);
                    if (ruleIndex !== -1) {
                        currentExamRules[ruleIndex] = {
                            ...currentExamRules[ruleIndex],
                            examName: name, stream: stream, startDate: sDate, startSession: sSess, endDate: eDate, endSession: eSess
                        };
                    }
                    editingRuleId = null;
                } else {
                    // Create New
                    const newRule = { id: Date.now().toString(), examName: name, stream: stream, startDate: sDate, startSession: sSess, endDate: eDate, endSession: eSess };
                    currentExamRules.push(newRule);
                }

                localStorage.setItem(EXAM_RULES_KEY, JSON.stringify(currentExamRules));

                isAddingExamSchedule = false;
                renderExamRulesInModal();
                renderExamNameSettings();
                if (typeof syncDataToCloud === 'function') syncDataToCloud('settings');
            });
        }
    }

    // 4. HELPER FUNCTIONS
    window.setExamScheduleMode = function (isAdding) {
        if (isExamRulesLocked && isAdding) return;
        isAddingExamSchedule = isAdding;
        editingRuleId = null; // Clear edit state when clicking "Add New"
        renderExamRulesInModal();
    }

    window.editExamRule = function (id) {
        if (isExamRulesLocked) return;
        editingRuleId = id;
        isAddingExamSchedule = true;
        renderExamRulesInModal();
    }

    window.cancelExamEdit = function () {
        isAddingExamSchedule = false;
        editingRuleId = null;
        renderExamRulesInModal();
    }

    window.deleteExamRule = function (id) {
        if (confirm("Remove this exam schedule?")) {
            currentExamRules = currentExamRules.filter(r => r.id !== id);
            localStorage.setItem(EXAM_RULES_KEY, JSON.stringify(currentExamRules));

            // Reset edit mode if we deleted the item being edited
            if (editingRuleId === id) {
                editingRuleId = null;
                isAddingExamSchedule = false;
            }

            renderExamRulesInModal();
            renderExamNameSettings();
            if (typeof syncDataToCloud === 'function') syncDataToCloud('settings');
        }
    };

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
    // --- Helper: Generate QP Key (Course + Stream) ---
    function getQpKey(courseName, streamName) {
        // Default to Regular if stream is missing/null
        const s = streamName || "Regular";
        // Create a unique key combining both
        return btoa(unescape(encodeURIComponent(`${courseName}|${s}`)));
    }
    // --- Helper function to numerically sort room keys ---
    function getNumericSortKey(key) {
        const parts = key.split('_'); // Date_Time_Room 1
        const roomPart = parts[2] || "Room 0";
        const roomNumber = parseInt(roomPart.replace('Room ', ''), 10);
        return `${parts[0]}_${parts[1]}_${String(roomNumber).padStart(4, '0')}`;
    }


    // --- Helper function to create a new room row HTML (Responsive Card/Row) ---
    function createRoomRowHtml(roomName, capacity, location, isLast = false, isLocked = true) {
        const disabledAttr = isLocked ? 'disabled' : '';
        const bgClass = isLocked ? 'bg-gray-50 text-gray-500' : 'bg-white text-black ring-1 ring-indigo-200';

        // Icon & Button Style Logic
        let iconSvg, btnClasses;

        if (isLocked) {
            // PENCIL ICON (Edit Mode)
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg>`;
            btnClasses = "text-blue-600 hover:text-blue-800 hover:bg-blue-50";
        } else {
            // CHECK ICON (Save Mode)
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-green-600"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;
            btnClasses = "bg-green-50 border border-green-200 hover:bg-green-100";
        }

        // Remove Button
        const removeButtonHtml = isLast ?
            `<button class="remove-room-button text-xs font-bold text-red-600 hover:text-red-800 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition">Remove</button>` :
            `<div class="w-[70px] hidden md:block"></div>`;

        // Capacity Tag
        let capBadge = "";
        const capNum = parseInt(capacity) || 0;
        if (capNum > 30) capBadge = `<span class="ml-2 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 shrink-0">▲ ${capNum}</span>`;
        else if (capNum < 30) capBadge = `<span class="ml-2 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">▼ ${capNum}</span>`;

        return `
        <div class="room-row bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm md:flex md:items-center md:gap-2 md:p-2 md:border-0 md:border-b md:rounded-none md:shadow-none md:mb-0 transition-all hover:bg-gray-50" data-room-name="${roomName}">
            <div class="flex justify-between items-center mb-3 md:mb-0 md:w-24 md:shrink-0 border-b border-gray-100 pb-2 md:border-0 md:pb-0">
                <label class="room-name-label font-bold text-gray-800 text-sm md:font-medium md:text-gray-700">${roomName}</label>
            </div>
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:gap-2 flex-grow">
                <div class="flex items-center justify-between md:justify-start">
                    <span class="text-xs font-semibold text-gray-500 uppercase md:hidden">Capacity</span>
                    <div class="flex items-center">
                        <input type="number" class="room-capacity-input block w-20 p-2 border border-gray-300 rounded-md shadow-sm text-sm ${bgClass} focus:ring-indigo-500 focus:border-indigo-500 transition" 
                               value="${capacity}" min="1" placeholder="30" ${disabledAttr}>
                        ${capBadge}
                    </div>
                </div>
                <div class="flex items-center gap-2 w-full md:w-auto md:flex-grow">
                    <span class="text-xs font-semibold text-gray-500 uppercase md:hidden w-16 shrink-0">Location</span>
                    <input type="text" class="room-location-input block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm ${bgClass} focus:ring-indigo-500 focus:border-indigo-500 transition" 
                           value="${location}" placeholder="e.g., 101 - Commerce Block" ${disabledAttr}>
                </div>
            </div>
            <div class="flex items-center justify-end gap-2 mt-3 md:mt-0 md:w-[90px] border-t pt-2 md:border-0 md:pt-0 border-gray-100">
                <button class="edit-room-btn p-1.5 md:p-1 transition rounded-full ${btnClasses}" title="Toggle Edit/Save">
                    ${iconSvg}
                </button>
                ${removeButtonHtml}
            </div>
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

    // --- *** CENTRAL ALLOCATION FUNCTION (Manual Only - Fixed Seat Numbers) *** ---
    function performOriginalAllocation(data) {
        const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
        const scribeRegNos = new Set((JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]')).map(s => s.regNo));

        const processed_rows_with_rooms = [];

        data.forEach(row => {
            const sessionKeyPipe = `${row.Date} | ${row.Time}`;
            const isScribe = scribeRegNos.has(row['Register Number']);

            let assignedRoomName = "Unallotted";
            let seatNumber = "N/A";

            // 1. Check Manual Allotment
            const manualAllotment = allAllotments[sessionKeyPipe];
            if (manualAllotment) {
                for (const room of manualAllotment) {
                    // FIX: Handle both Object array (New) and String array (Legacy)
                    const studentIndex = room.students.findIndex(s => {
                        const r = (typeof s === 'object') ? s['Register Number'] : s;
                        return r === row['Register Number'];
                    });

                    if (studentIndex !== -1) {
                        assignedRoomName = room.roomName;
                        seatNumber = studentIndex + 1; // 0-based index to 1-based seat
                        break;
                    }
                }
            }

            processed_rows_with_rooms.push({
                ...row,
                'Room No': assignedRoomName,
                'seatNumber': seatNumber,
                'isScribe': isScribe
            });
        });

        return processed_rows_with_rooms;
    }

    // --- NEW: Helper to generate Room Serial Numbers (1, 2, 3...) ---

    // --- Helper: Generate Room Serial Numbers (Grouped by Stream) ---
    function getRoomSerialMap(sessionKey) {
        const serialMap = {};
        let counter = 1;

        const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
        const currentSessionAllotment = allAllotments[sessionKey] || [];

        // 1. Group Regular/Distance Rooms
        // The 'stream' property is now saved in 'currentSessionAllotment'

        // Sort by Stream Priority (Index in config) then Room Name
        currentSessionAllotment.sort((a, b) => {
            const s1 = a.stream || "Regular";
            const s2 = b.stream || "Regular";
            const idx1 = currentStreamConfig.indexOf(s1);
            const idx2 = currentStreamConfig.indexOf(s2);

            if (idx1 !== idx2) return idx1 - idx2;

            // If same stream, numeric sort of room name
            const numA = parseInt(a.roomName.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.roomName.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });

        const usedRegularRooms = new Set();

        // Assign Serials to Regular/Distance
        currentSessionAllotment.forEach(room => {
            if (!serialMap[room.roomName]) {
                serialMap[room.roomName] = counter++;
                usedRegularRooms.add(room.roomName);
            }
        });

        // 2. Scribe Allotment (Always Last)
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        const scribeMap = allScribeAllotments[sessionKey] || {};

        const uniqueScribeRooms = new Set(Object.values(scribeMap));
        usedRegularRooms.forEach(r => uniqueScribeRooms.delete(r)); // Remove duplicates

        const sortedScribeRooms = Array.from(uniqueScribeRooms).sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });

        sortedScribeRooms.forEach(roomName => {
            serialMap[roomName] = counter++;
        });

        return serialMap;
    }

    // --- Helper to split large strings for Cloud Storage ---
    function chunkString(str, size) {
        const numChunks = Math.ceil(str.length / size);
        const chunks = [];
        for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
            chunks.push(str.substr(o, size));
        }
        return chunks;
    }

    function updateHeaderCollegeName() {
        const headerNameEl = document.getElementById('header-college-name');
        // Read from local storage which is kept in sync
        const storedName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";

        if (headerNameEl) {
            headerNameEl.textContent = storedName;
        }
        // Also update global variable if needed
        currentCollegeName = storedName;
    }
    // --- Update Dashboard Function (Global + Today + Smart Date Picker + Data Status) ---
    // [In app.js - Replace the existing updateDashboard function]

    function updateDashboard() {
        const dashContainer = document.getElementById('data-snapshot');
        const dashStudent = document.getElementById('dash-student-count');
        const dashCourse = document.getElementById('dash-course-count');
        const dashDay = document.getElementById('dash-day-count');

        // Today's Stats Elements
        const todayContainer = document.getElementById('today-snapshot-section');
        const todayDateDisplay = document.getElementById('today-date-display');
        const todayGrid = document.getElementById('today-sessions-grid');

        // Smart Date Picker Elements
        const dateSelect = document.getElementById('dashboard-date-select');
        const specificDateGrid = document.getElementById('specific-date-grid');

        // If no data, hide everything
        if (!allStudentData || allStudentData.length === 0) {
            if (dashContainer) dashContainer.classList.add('hidden');
            if (todayContainer) todayContainer.classList.add('hidden');
            return;
        }

        // 1. UPDATE GLOBAL STATS
        const totalStudents = allStudentData.length;
        const uniqueCourses = new Set(allStudentData.map(s => s.Course)).size;
        const uniqueDaysSet = new Set(allStudentData.map(s => s.Date));
        const uniqueDays = Array.from(uniqueDaysSet).sort((a, b) => {
            const d1 = a.split('.').reverse().join('');
            const d2 = b.split('.').reverse().join('');
            return d1.localeCompare(d2);
        });

        if (dashStudent) dashStudent.textContent = totalStudents.toLocaleString();
        if (dashCourse) dashCourse.textContent = uniqueCourses.toLocaleString();
        if (dashDay) dashDay.textContent = uniqueDays.length.toLocaleString();
        if (dashContainer) dashContainer.classList.remove('hidden');

        // Ensure scribe list is loaded
        if (globalScribeList.length === 0) {
            globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
        }

        // 2. UPDATE "TODAY'S EXAM" STATS
        const today = new Date();
        const todayStr = formatDateToCSV(today);

        if (todayDateDisplay) todayDateDisplay.textContent = today.toDateString();

        const todayHtml = generateSessionCardsHtml(todayStr);

        if (todayContainer) {
            if (todayHtml) {
                // Show Cards
                if (todayGrid) todayGrid.innerHTML = todayHtml;
                todayContainer.classList.remove('hidden');
            } else {
                // Show "No Exams" Message (Instead of hiding)
                if (todayGrid) todayGrid.innerHTML = `
                <div class="col-span-full bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                    <p class="text-gray-500 font-medium">No exams scheduled for today (${todayStr}).</p>
                    <p class="text-xs text-gray-400 mt-1">Check the calendar or search for a specific date below.</p>
                </div>`;
                todayContainer.classList.remove('hidden');
            }
        }

        // 3. POPULATE SMART DATE DROPDOWN
        if (dateSelect && specificDateGrid) {
            dateSelect.innerHTML = '<option value="">-- Select a Date --</option>';

            uniqueDays.forEach(dateStr => {
                const option = document.createElement('option');
                option.value = dateStr;
                option.textContent = dateStr;
                dateSelect.appendChild(option);
            });

            // Auto-select tomorrow if applicable (optional feature)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = formatDateToCSV(tomorrow);

            if (uniqueDaysSet.has(tomorrowStr)) {
                // Optional: Pre-select tomorrow if desired
                // dateSelect.value = tomorrowStr;
                // updateSpecificDateGrid(tomorrowStr, specificDateGrid);
            }

            dateSelect.onchange = (e) => {
                updateSpecificDateGrid(e.target.value, specificDateGrid);
            };
        }

        // 4. UPDATE DATA LOADING TAB STATUS
        const dataTabStatusText = document.getElementById('data-tab-status-text');
        const btnDownloadCurrentCsv = document.getElementById('btn-download-current-csv');

        if (dataTabStatusText && btnDownloadCurrentCsv) {
            if (allStudentData && allStudentData.length > 0) {
                dataTabStatusText.textContent = `Data of ${allStudentData.length} Students Loaded (Cloud/Local)`;
                btnDownloadCurrentCsv.classList.remove('hidden');

                btnDownloadCurrentCsv.onclick = () => {
                    const csvContent = convertToCSV(allStudentData);
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `ExamFlow_Full_Data_${new Date().toISOString().slice(0, 10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                };
            } else {
                dataTabStatusText.textContent = "No student data loaded.";
                btnDownloadCurrentCsv.classList.add('hidden');
            }
        }

        // 5. REFRESH CALENDAR & SETTINGS
        if (typeof renderCalendar === 'function') renderCalendar();
        if (typeof renderExamNameSettings === 'function') renderExamNameSettings();

        // --- NEW: Check for Invigilation Slots (Only if Logged In) ---
        if (currentUser) {
            renderDashboardInvigilation();
        } else {
            const invigWrapper = document.getElementById('dashboard-invigilation-wrapper');
            if (invigWrapper) invigWrapper.classList.add('hidden');
        }
    }

    // ==========================================
    // 📅 CALENDAR LOGIC
    // ==========================================

    let currentCalDate = new Date();

    function initCalendar() {
        renderCalendar();

        const prevBtn = document.getElementById('cal-prev-btn');
        const nextBtn = document.getElementById('cal-next-btn');

        // FIX: Use .onclick to prevent stacking multiple listeners
        if (prevBtn) {
            prevBtn.onclick = () => {
                currentCalDate.setMonth(currentCalDate.getMonth() - 1);
                renderCalendar();
            };
        }
        if (nextBtn) {
            nextBtn.onclick = () => {
                currentCalDate.setMonth(currentCalDate.getMonth() + 1);
                renderCalendar();
            };
        }
    }

    // --- Calendar Render Logic (Optimized for Mobile Overflow) ---
    function renderCalendar() {
        const grid = document.getElementById('calendar-days-grid');
        const title = document.getElementById('cal-month-display');
        if (!grid || !title) return;

        const year = currentCalDate.getFullYear();
        const month = currentCalDate.getMonth();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        title.textContent = `${monthNames[month]} ${year}`;

        const firstDayIndex = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        if (globalScribeList.length === 0) {
            const stored = localStorage.getItem(SCRIBE_LIST_KEY);
            if (stored) globalScribeList = JSON.parse(stored);
        }
        const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));

        const monthData = {};

        if (allStudentData && allStudentData.length > 0) {
            const targetMonthStr = String(month + 1).padStart(2, '0');
            const targetYearStr = String(year);

            allStudentData.forEach(s => {
                const [d, m, y] = s.Date.split('.');
                if (m === targetMonthStr && y === targetYearStr) {
                    const dayKey = parseInt(d);
                    const timeStr = s.Time.toUpperCase();
                    const isPM = timeStr.includes("PM") || (timeStr.includes("12:") && !timeStr.includes("AM"));
                    const sessionKey = isPM ? 'pm' : 'am';

                    if (!monthData[dayKey]) monthData[dayKey] = {
                        am: { students: 0, regCount: 0, othCount: 0, scribeCount: 0 },
                        pm: { students: 0, regCount: 0, othCount: 0, scribeCount: 0 }
                    };

                    const stats = monthData[dayKey][sessionKey];
                    stats.students++;

                    if (scribeRegNos.has(s['Register Number'])) {
                        stats.scribeCount++;
                    } else {
                        if (!s.Stream || s.Stream === "Regular") stats.regCount++;
                        else stats.othCount++;
                    }
                }
            });
        }

        let html = "";
        for (let i = 0; i < firstDayIndex; i++) html += `<div class="bg-gray-50 min-h-[90px] border-r border-b border-gray-100"></div>`;

        for (let day = 1; day <= daysInMonth; day++) {
            const data = monthData[day];
            const isToday = (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear());

            // --- NEW: Calculate Grid Position to prevent Overflow ---
            const cellIndex = firstDayIndex + day - 1;
            const rowIndex = Math.floor(cellIndex / 7);
            const colIndex = cellIndex % 7; // 0=Sun, 6=Sat
            const isTopRow = rowIndex === 0;

            // 1. Tooltip Positioning Logic (Smart Anchoring)
            // Mobile: Anchor Left for first 2 cols, Right for last 2 cols, Center for middle
            // Desktop (md): Always Center
            let tooltipPosClass = "left-1/2 -translate-x-1/2"; // Default Center
            let arrowPosClass = "left-1/2 -translate-x-1/2";   // Default Arrow Center

            if (colIndex <= 1) {
                // Left Edge (Sun/Mon): Align Tooltip Left, Arrow Left
                tooltipPosClass = "left-[-4px] md:left-1/2 md:-translate-x-1/2";
                arrowPosClass = "left-6 -translate-x-1/2 md:left-1/2";
            } else if (colIndex >= 5) {
                // Right Edge (Fri/Sat): Align Tooltip Right, Arrow Right
                tooltipPosClass = "right-[-4px] md:left-1/2 md:-translate-x-1/2 md:right-auto md:left-auto";
                arrowPosClass = "right-6 translate-x-1/2 md:left-1/2 md:-translate-x-1/2 md:right-auto md:left-auto";
            }
            // --------------------------------------------------------

            const baseClass = "min-h-[60px] md:min-h-[90px] bg-white border-r border-b border-gray-200 flex flex-col items-center justify-center relative hover:bg-blue-50 transition group";

            // Adjusted circle size for better mobile visibility
            let circleClass = "w-8 h-8 text-sm md:w-20 md:h-20 md:text-3xl rounded-full flex flex-col items-center justify-center relative font-bold text-gray-700 bg-transparent border border-transparent overflow-hidden";

            let circleStyle = "";
            let tooltipHtml = "";

            let dateNumberHtml = `<span class="z-10">${day}</span>`;
            if (isToday) {
                dateNumberHtml = `<span class="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-md z-20 text-sm md:text-2xl">${day}</span>`;
            }

            if (data) {
                const hasFN = data.am.students > 0;
                const hasAN = data.pm.students > 0;

                if (hasFN || hasAN) {
                    circleClass = "w-8 h-8 text-sm md:w-20 md:h-20 md:text-3xl rounded-full flex flex-col items-center justify-center relative font-bold text-red-900 border border-red-200 overflow-hidden shadow-sm";
                    const cLight = "#fee2e2";
                    const cDark = "#fca5a5";

                    if (hasFN && hasAN) {
                        circleStyle = `background: linear-gradient(to bottom, ${cDark} 0%, ${cDark} 35%, ${cLight} 35%, ${cLight} 65%, ${cDark} 65%, ${cDark} 100%);`;
                        dateNumberHtml = `
                        <span class="absolute top-0.5 text-[8px] md:text-[9px] text-red-900 font-extrabold leading-none opacity-80">FN</span>
                        ${dateNumberHtml}
                        <span class="absolute bottom-0.5 text-[8px] md:text-[9px] text-red-900 font-extrabold leading-none opacity-80">AN</span>
                    `;
                    } else if (hasFN) {
                        circleStyle = `background: linear-gradient(to bottom, ${cDark} 0%, ${cDark} 35%, ${cLight} 35%, ${cLight} 100%);`;
                        dateNumberHtml = `
                        <span class="absolute top-0.5 text-[8px] md:text-[9px] text-red-900 font-extrabold leading-none opacity-80">FN</span>
                        ${dateNumberHtml}
                    `;
                    } else if (hasAN) {
                        circleStyle = `background: linear-gradient(to bottom, ${cLight} 0%, ${cLight} 65%, ${cDark} 65%, ${cDark} 100%);`;
                        dateNumberHtml = `
                        ${dateNumberHtml}
                        <span class="absolute bottom-0.5 text-[8px] md:text-[9px] text-red-900 font-extrabold leading-none opacity-80">AN</span>
                    `;
                    }
                }

                // Tooltip Content Generation
                if (hasFN) {
                    const regReq = Math.ceil(data.am.regCount / 30);
                    const othReq = Math.ceil(data.am.othCount / 30);
                    const scribeReq = Math.ceil(data.am.scribeCount / 5);
                    const totalReq = regReq + othReq + scribeReq;
                    let details = `Reg: ${regReq}`;
                    if (othReq > 0) details += ` | Oth: ${othReq}`;
                    if (scribeReq > 0) details += ` | Scr: ${scribeReq}`;

                    tooltipHtml += `
                    <div class='mb-2 pb-2 border-b border-gray-200'>
                        <div class="flex justify-between items-center">
                            <strong class='text-red-600 uppercase text-[10px]'>Morning (FN)</strong>
                            <span class='text-gray-900 font-bold text-[10px]'>${data.am.students}</span>
                        </div>
                        <div class="mt-1 bg-gray-50 p-1 rounded border border-gray-100">
                            <div class="flex justify-between text-[10px] font-bold text-gray-700">
                                <span>Invigs:</span>
                                <span class="text-blue-700 text-[11px]">${totalReq}</span>
                            </div>
                            <div class="text-[9px] text-gray-400 text-right font-normal leading-tight">${details}</div>
                        </div>
                    </div>`;
                }
                if (hasAN) {
                    const regReq = Math.ceil(data.pm.regCount / 30);
                    const othReq = Math.ceil(data.pm.othCount / 30);
                    const scribeReq = Math.ceil(data.pm.scribeCount / 5);
                    const totalReq = regReq + othReq + scribeReq;
                    let details = `Reg: ${regReq}`;
                    if (othReq > 0) details += ` | Oth: ${othReq}`;
                    if (scribeReq > 0) details += ` | Scr: ${scribeReq}`;

                    tooltipHtml += `
                    <div>
                        <div class="flex justify-between items-center">
                            <strong class='text-red-600 uppercase text-[10px]'>Afternoon (AN)</strong>
                            <span class='text-gray-900 font-bold text-[10px]'>${data.pm.students}</span>
                        </div>
                        <div class="mt-1 bg-gray-50 p-1 rounded border border-gray-100">
                            <div class="flex justify-between text-[10px] font-bold text-gray-700">
                                <span>Invigs:</span>
                                <span class="text-blue-700 text-[11px]">${totalReq}</span>
                            </div>
                            <div class="text-[9px] text-gray-400 text-right font-normal leading-tight">${details}</div>
                        </div>
                    </div>`;
                }
            } else if (isToday) {
                circleClass = "w-8 h-8 text-sm md:w-20 md:h-20 md:text-3xl rounded-full flex flex-col items-center justify-center relative font-bold bg-blue-600 text-white shadow-md overflow-hidden";
                dateNumberHtml = `<span class="z-10">${day}</span>`;
            }

            // Apply Vertical Position (Top/Bottom) logic
            const posClass = isTopRow ? "top-full mt-2" : "bottom-full mb-2";
            const arrowVerticalClass = isTopRow ? "bottom-full border-b-white" : "top-full border-t-white";

            const tooltip = tooltipHtml ? `
            <div class="absolute ${posClass} ${tooltipPosClass} w-48 md:w-56 bg-white text-gray-800 text-xs rounded-lg p-3 shadow-xl z-[100] hidden group-hover:block pointer-events-none border border-red-200 ring-1 ring-red-100">
                ${tooltipHtml}
                <div class="absolute ${arrowVerticalClass} ${arrowPosClass} border-4 border-transparent"></div>
            </div>
        ` : "";

            html += `
            <div class="${baseClass}">
                <div class="${circleClass}" style="${circleStyle}">
                    ${dateNumberHtml}
                </div>
                ${tooltip}
            </div>
        `;
        }
        grid.innerHTML = html;
    }

    // Add initialization call to your existing loadInitialData or updateDashboard
    // For now, we'll trigger it once the DOM is ready in app.js logic
    setTimeout(initCalendar, 1000);

    // --- Helper: Update the Specific Date Grid ---
    function updateSpecificDateGrid(dateStr, gridElement) {
        if (!dateStr) {
            gridElement.innerHTML = `<p class="text-gray-400 italic ml-2">Select a date above to see details.</p>`;
            return;
        }

        const html = generateSessionCardsHtml(dateStr);

        if (html) {
            gridElement.innerHTML = html;
        } else {
            gridElement.innerHTML = `<p class="text-gray-500 italic ml-2">No exams found for ${dateStr}.</p>`;
        }
    }

    // --- Helper: Convert JS Date to CSV Format (DD.MM.YYYY) ---
    function formatDateToCSV(dateObj) {
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        return `${dd}.${mm}.${yyyy}`;
    }


    // --- Helper: Generate HTML Cards for a Date (V4: Explicit Requirements & Totals) ---
    function generateSessionCardsHtml(dateStr) {
        const studentsForDate = allStudentData.filter(s => s.Date === dateStr);
        if (studentsForDate.length === 0) return null;

        const sessions = {};
        studentsForDate.forEach(s => {
            if (!sessions[s.Time]) sessions[s.Time] = [];
            sessions[s.Time].push(s);
        });

        if (globalScribeList.length === 0) {
            const stored = localStorage.getItem(SCRIBE_LIST_KEY);
            if (stored) globalScribeList = JSON.parse(stored);
        }
        const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));

        let sessionsHtml = '';
        const sortedTimes = Object.keys(sessions).sort();

        sortedTimes.forEach(time => {
            const students = sessions[time];
            const studentCount = students.length;
            const courseCount = new Set(students.map(s => s.Course)).size;

            let scribeCount = 0;
            const streamCounts = {};

            // 1. Count & Segregate
            students.forEach(s => {
                if (scribeRegNos.has(s['Register Number'])) {
                    scribeCount++;
                } else {
                    const strm = s.Stream || "Regular";
                    streamCounts[strm] = (streamCounts[strm] || 0) + 1;
                }
            });

            // 2. Build Breakdown HTML
            let candidateBreakdownHtml = '';
            let hallsBreakdownHtml = '';
            let totalReqCount = 0; // Track Total Rooms/Invigilators

            const sortedStreams = Object.keys(streamCounts).sort((a, b) => {
                if (a === "Regular") return -1;
                if (b === "Regular") return 1;
                return a.localeCompare(b);
            });

            sortedStreams.forEach(strm => {
                const count = streamCounts[strm];
                // Candidates
                candidateBreakdownHtml += `
                <div class="flex justify-between items-center text-[11px] text-gray-600">
                    <span>${strm}:</span> 
                    <strong class="text-gray-800">${count}</strong>
                </div>`;

                // Requirements (1 per 30)
                const req = Math.ceil(count / 30);
                totalReqCount += req;

                hallsBreakdownHtml += `
                <div class="flex justify-between items-center text-[11px] text-gray-600 gap-3">
                    <span>${strm}:</span> 
                    <strong class="text-indigo-700 bg-indigo-50 px-1.5 rounded" title="Rooms & Invigilators">${req}</strong>
                </div>`;
            });

            // Scribe Requirements (1 per 5)
            if (scribeCount > 0) {
                const scribeReq = Math.ceil(scribeCount / 5);
                totalReqCount += scribeReq;

                hallsBreakdownHtml += `
                <div class="flex justify-between items-center text-[11px] text-gray-600 gap-3 pt-1">
                    <span class="text-orange-600 font-bold">Scribe:</span> 
                    <strong class="text-orange-700 bg-orange-50 px-1.5 rounded" title="Rooms & Invigilators">${scribeReq}</strong>
                </div>`;
            }

            // TOTAL ROW
            hallsBreakdownHtml += `
            <div class="flex justify-between items-center text-[11px] font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                <span>Total:</span> 
                <span class="bg-gray-200 px-1.5 rounded text-gray-800">${totalReqCount}</span>
            </div>
        `;

            // 3. Construct Card
            sessionsHtml += `
            <div class="bg-white border border-indigo-100 rounded-lg shadow-sm p-4 hover:shadow-md transition-all">
                
                <div class="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                    <div class="flex items-center gap-2">
                        <div class="bg-indigo-600 text-white p-2 rounded-lg shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-800 leading-tight">${time}</h3>
                            <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Session</p>
                        </div>
                    </div>

                    <div class="bg-gray-50 rounded-md border border-gray-200 p-2 min-w-[140px]">
                        <div class="text-[9px] font-bold text-gray-500 uppercase mb-1 border-b border-gray-200 pb-1 tracking-wider text-center">
                            Est. Rooms / Invigs
                        </div>
                        <div class="space-y-1">
                            ${hallsBreakdownHtml}
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-2 text-center divide-x divide-gray-100">
                    <div class="px-1 flex flex-col h-full">
                        <div class="text-2xl font-bold text-gray-800">${studentCount}</div>
                        <div class="text-[10px] text-gray-400 font-bold uppercase mb-2">Candidates</div>
                        <div class="mt-auto bg-gray-50 rounded p-2 border border-gray-100 space-y-1 text-left">
                            ${candidateBreakdownHtml}
                        </div>
                    </div>
                    <div class="px-1 flex flex-col justify-start pt-2">
                        <div class="text-2xl font-bold text-gray-800">${courseCount}</div>
                        <div class="text-[10px] text-gray-400 font-bold uppercase">Courses</div>
                    </div>
                    <div class="px-1 flex flex-col justify-start pt-2">
                        <div class="text-2xl font-bold text-gray-800">${scribeCount}</div>
                        <div class="text-[10px] text-gray-400 font-bold uppercase">Scribes</div>
                    </div>
                </div>
            </div>
        `;
        });

        return sessionsHtml;
    }



    // V68: Helper function to filter data based on selected report filter
    // Helper function to filter data based on selected report filter
    function getFilteredReportData(reportType) {
        const data = JSON.parse(jsonDataStore.innerHTML || '[]');
        if (data.length === 0) return [];

        let filteredData = data;

        // 1. Filter by Session
        if (filterSessionRadio.checked) {
            const sessionKey = reportsSessionSelect.value;
            if (sessionKey && sessionKey !== 'all') {
                const [date, time] = sessionKey.split(' | ');
                filteredData = filteredData.filter(s => s.Date === date && s.Time === time);
            }
        }

        // 2. Filter by Stream (NEW)
        const streamFilter = document.getElementById('reports-stream-select');
        if (streamFilter && streamFilter.value !== 'all') {
            const targetStream = streamFilter.value;
            // Strict check for stream match
            filteredData = filteredData.filter(s => (s.Stream || "Regular") === targetStream);
        }

        return filteredData;
    }
    function checkManualAllotment(sessionKey) {
        if (!sessionKey || sessionKey === 'all') {
            alert('Please select a specific session to generate this report.');
            return false;
        }

        // 1. Get total unique students for the session
        const [date, time] = sessionKey.split(' | ');
        const sessionStudentRecords = allStudentData.filter(s => s.Date === date && s.Time === time);
        const totalUniqueStudents = new Set(sessionStudentRecords.map(s => s['Register Number'])).size;

        if (totalUniqueStudents === 0) {
            alert('No students found for this session.');
            return false;
        }

        // 2. Get Manual Allotment (Regular)
        const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
        const manualAllotment = allAllotments[sessionKey] || [];

        // 3. Get Scribe Allotment
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        const scribeMap = allScribeAllotments[sessionKey] || {};

        // 4. Count unique allotted students (Regular + Scribes)
        const allottedRegNos = new Set();

        // Add Regular Allotments (FIXED: Handles Objects vs Strings)
        manualAllotment.forEach(room => {
            room.students.forEach(s => {
                const regNo = (typeof s === 'object') ? s['Register Number'] : s;
                allottedRegNos.add(regNo);
            });
        });

        // Add Scribe Allotments
        Object.keys(scribeMap).forEach(regNo => {
            allottedRegNos.add(regNo);
        });

        const allottedStudentCount = allottedRegNos.size;

        // 5. Compare counts
        if (allottedStudentCount < totalUniqueStudents) {
            const remaining = totalUniqueStudents - allottedStudentCount;
            // Optional: Allow generating even if incomplete, but warn
            if (!confirm(`Warning: Not all students are allotted.\n\nTotal: ${totalUniqueStudents}\nAllotted: ${allottedStudentCount}\nMissing: ${remaining}\n\nGenerate report anyway?`)) {
                return false;
            }
        }

        return true;
    }

    // --- 1. Event listener for the "Generate Room-wise Report" button (V10: Scribe Adjustments) ---
    generateReportButton.addEventListener('click', async () => {
        const sessionKey = reportsSessionSelect.value;
        if (filterSessionRadio.checked && !checkManualAllotment(sessionKey)) { return; }

        generateReportButton.disabled = true;
        generateReportButton.textContent = "Generating Report...";
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

            const data = getFilteredReportData('room-wise');
            if (data.length === 0) { alert("No data found."); return; }

            const processed_rows_with_rooms = performOriginalAllocation(data);
            const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
            const final_student_list_for_report = [];

            for (const student of processed_rows_with_rooms) {
                if (student.isScribe) {
                    const sessionKeyPipe = `${student.Date} | ${student.Time}`;
                    const sessionScribeAllotment = allScribeAllotments[sessionKeyPipe] || {};
                    const scribeRoom = sessionScribeAllotment[student['Register Number']] || 'N/A';
                    final_student_list_for_report.push({ ...student, Name: student.Name, remark: `${scribeRoom}`, isPlaceholder: true });
                } else {
                    final_student_list_for_report.push(student);
                }
            }

            lastGeneratedRoomData = processed_rows_with_rooms;
            lastGeneratedReportType = "Roomwise_Seating_Report";

            const sessions = {};
            loadQPCodes();

            final_student_list_for_report.forEach(student => {
                const key = `${student.Date}_${student.Time}_${student['Room No']}`;
                if (!sessions[key]) {
                    sessions[key] = {
                        Date: student.Date, Time: student.Time, Room: student['Room No'],
                        students: [], courseCounts: {}
                    };
                }
                sessions[key].students.push(student);

                // Count unique QP-Course combos (Separating Scribes)
                const stream = student.Stream || "Regular";
                const uniqueCourseKey = `${student.Course}|${stream}`;

                if (!sessions[key].courseCounts[uniqueCourseKey]) {
                    sessions[key].courseCounts[uniqueCourseKey] = { total: 0, scribe: 0 };
                }
                sessions[key].courseCounts[uniqueCourseKey].total++;

                // Check if this specific student is a scribe (marked as placeholder in this list)
                if (student.isPlaceholder) {
                    sessions[key].courseCounts[uniqueCourseKey].scribe++;
                }
            });

            let allPagesHtml = `
            <style>
                .print-page-room { padding: 15mm !important; }
                .room-report-row { height: 2.1rem !important; }
                .room-report-row td { height: 2.1rem !important; overflow: hidden; white-space: nowrap; }
                @media print {
                    .print-page-room, .print-page { padding: 10mm !important; box-shadow: none !important; border: none !important; }
                }
            </style>
        `;

            let totalPagesGenerated = 0;
            const sortedSessionKeys = Object.keys(sessions).sort((a, b) => {
                const partsA = a.split('_');
                const partsB = b.split('_');

                const dateA = partsA[0]; const timeA = partsA[1];
                const roomA = partsA.slice(2).join('_');

                const dateB = partsB[0]; const timeB = partsB[1];
                const roomB = partsB.slice(2).join('_');

                const sessionA = `${dateA} | ${timeA}`;
                const sessionB = `${dateB} | ${timeB}`;
                const timeDiff = compareSessionStrings(sessionA, sessionB);
                if (timeDiff !== 0) return timeDiff;

                const serialMap = getRoomSerialMap(sessionA);
                const serialA = serialMap[roomA] || 999999;
                const serialB = serialMap[roomB] || 999999;

                return serialA - serialB;
            });

            function getSmartCourseName(fullName) {
                let cleanName = fullName.replace(/\[.*?\]/g, '').trim();
                cleanName = cleanName.replace(/\s-\s$/, '').trim();
                const words = cleanName.split(/\s+/);
                if (words.length <= 4) return cleanName;
                return `${words.slice(0, 3).join(' ')} ... ${words[words.length - 1]}`;
            }

            sortedSessionKeys.forEach(key => {
                const session = sessions[key];
                const roomInfo = currentRoomConfig[session.Room];
                const location = (roomInfo && roomInfo.location) ? roomInfo.location : "";
                const locationHtml = location ? `<div class="report-location-header" style="margin-bottom: 5px; padding-bottom: 5px;">Location: ${location}</div>` : "";

                const sessionKeyPipe = `${session.Date} | ${session.Time}`;
                const roomSerialMap = getRoomSerialMap(sessionKeyPipe);
                const serialNo = roomSerialMap[session.Room] || '-';
                const sessionQPCodes = qpCodeMap[sessionKeyPipe] || {};
                const pageStream = session.students.length > 0 ? (session.students[0].Stream || "Regular") : "Regular";

                const examName = getExamName(session.Date, session.Time, pageStream);
                const examNameHtml = examName ? `<h2 style="font-size:14pt; font-weight:bold; margin:2px 0;">${examName}</h2>` : "";

                // NEW: Get Invigilator Name
                const invigMap = JSON.parse(localStorage.getItem(INVIG_MAPPING_KEY) || '{}');
                const currentSessionInvigs = invigMap[sessionKeyPipe] || {};
                const assignedInvigilatorName = currentSessionInvigs[session.Room] || "Name & Signature of Invigilator";
                // --- 1. Footer Content (Modified for Scribe Reductions) ---
                let courseSummaryRows = '';
                const uniqueQPCodesInRoom = new Set();
                let sessionAdjustedTotal = 0;

                // Iterate through the stats object we built earlier
                for (const [comboKey, stats] of Object.entries(session.courseCounts)) {
                    const [cName, cStream] = comboKey.split('|');

                    const courseKey = getQpKey(cName, cStream);
                    const qpCode = sessionQPCodes[courseKey];
                    const qpDisplay = qpCode || "N/A";

                    if (qpCode) uniqueQPCodesInRoom.add(qpCode);
                    else uniqueQPCodesInRoom.add(cName.substring(0, 10));

                    let smartName = getSmartCourseName(cName);

                    // MATHS: Total Candidates - Scribes = Booklets Needed
                    const totalCount = stats.total;
                    const scribeCount = stats.scribe;
                    const adjustedCount = totalCount - scribeCount;

                    // Add Scribe Note to Name
                    if (scribeCount > 0) {
                        smartName += ` <b>(${scribeCount} Scribes)</b>`;
                    }

                    sessionAdjustedTotal += adjustedCount;

                    courseSummaryRows += `
                    <tr>
                        <td style="border: 1px solid #ccc; padding: 1px 3px; font-weight:bold; width: 15%; text-align:left;">${qpDisplay}</td>
                        <td style="border: 1px solid #ccc; padding: 1px 3px; width: 75%; font-size: 8.5pt;">${smartName}</td>
                        <td style="border: 1px solid #ccc; padding: 1px 3px; text-align: center; font-weight: bold; width: 10%;">${adjustedCount}</td>
                    </tr>`;
                }

                // Add Total Row
                courseSummaryRows += `
                <tr style="background-color: #f9fafb;">
                    <td colspan="2" style="border: 1px solid #ccc; padding: 1px 3px; text-align: right; font-weight: bold;">Total (Excl. Scribes):</td>
                    <td style="border: 1px solid #ccc; padding: 1px 3px; text-align: center; font-weight: bold;">${sessionAdjustedTotal}</td>
                </tr>
            `;

                let writtenScriptsHtml = '';
                uniqueQPCodesInRoom.forEach(code => {
                    writtenScriptsHtml += `<span style="margin-right: 15px; white-space: nowrap;">${code}: <span style="border-bottom: 1px solid #000; display: inline-block; width: 35px;"></span></span> `;
                });

                const hasScribe = session.students.some(s => s.isPlaceholder);
                const scribeFootnote = hasScribe ? '<div class="scribe-footnote" style="margin-top:5px;">* = Scribe Assistance</div>' : '';

                const invigilatorFooterHtml = `
                <div class="invigilator-footer" style="margin-top: 1rem; padding-top: 0; page-break-inside: avoid; font-size: 9pt;">
                    <div style="margin-bottom: 8px;">
                        <div style="font-weight: bold; margin-bottom: 2px;">Course Summary:</div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #f0f0f0;">
                                    <th style="border: 1px solid #ccc; padding: 2px; text-align: left;">QP Code</th>
                                    <th style="border: 1px solid #ccc; padding: 2px; text-align: left;">Course Name</th>
                                    <th style="border: 1px solid #ccc; padding: 2px; text-align: center;">Count</th>
                                </tr>
                            </thead>
                            <tbody>${courseSummaryRows}</tbody>
                        </table>
                    </div>
                    <div style="border: 1px solid #000; padding: 5px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-weight: bold;">
                            <span>Booklets Received: __________</span>
                            <span>Used: __________</span>
                            <span>Balance Returned: __________</span>
                        </div>
                        <div style="border-top: 1px dotted #999; padding-top: 5px; margin-bottom: 5px;">
                            <strong>Written Booklets (QP Wise):</strong><br>
                            <div style="margin-top: 3px; line-height: 1.5;">
                                ${writtenScriptsHtml}
                            </div>
                        </div>
                        <div style="border-top: 1px dotted #999; padding-top: 5px; text-align: right;">
                            <strong>Written Booklets Total:</strong> __________
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                        <div style="font-size: 9pt;">${scribeFootnote}</div>
                        <div class="signature" style="text-align: center; width: 200px;">
                            <div style="border-top: 1px solid #000; padding-top: 4px;">${assignedInvigilatorName}</div>
                        </div>
                    </div>
                </div>
            `;

                // --- 2. Table Row Generator ---
                let previousCourseName = ""; let previousRegNoPrefix = "";
                const regNoRegex = /^([A-Z]+)(\d+)$/;

                function generateTableRows(studentList) {
                    let rowsHtml = '';
                    studentList.forEach((student) => {
                        const seatNumber = student.seatNumber;
                        const asterisk = student.isPlaceholder ? '*' : '';

                        const regNo = student['Register Number'];
                        let displayRegNo = regNo;
                        const match = regNo.match(regNoRegex);
                        if (match) {
                            const prefix = match[1]; const number = match[2];
                            if (prefix === previousRegNoPrefix) displayRegNo = number;
                            previousRegNoPrefix = prefix;
                        } else { previousRegNoPrefix = ""; }

                        const regLen = displayRegNo.length;
                        let regFontSize = "12pt";
                        if (regLen > 12) regFontSize = "10pt";
                        else if (regLen > 10) regFontSize = "11pt";

                        const courseKey = getQpKey(student.Course, student.Stream);
                        const qpCode = sessionQPCodes[courseKey] || "";
                        const qpCodePrefix = qpCode ? `(${qpCode}) ` : "";

                        const courseWords = student.Course.split(/\s+/);
                        const truncatedCourse = courseWords.slice(0, 4).join(' ') + (courseWords.length > 4 ? '...' : '');
                        const tableCourseName = qpCodePrefix + truncatedCourse;

                        let displayCourseName = (tableCourseName === previousCourseName) ? '"' : tableCourseName;
                        if (tableCourseName !== previousCourseName) previousCourseName = tableCourseName;

                        const rowClass = student.isPlaceholder ? 'class="scribe-row-highlight"' : '';
                        const remarkText = student.remark || '';

                        rowsHtml += `
                        <tr ${rowClass} class="room-report-row">
                            <td class="sl-col" style="padding: 0 4px;">${seatNumber}${asterisk}</td>
                            <td class="course-col" style="padding: 0 4px;">${displayCourseCell(qpCode, student.Course, displayCourseName === '"')}</td>
                            <td class="reg-col" style="font-size: ${regFontSize}; font-weight: bold; padding: 0 4px;">${displayRegNo}</td>
                            <td class="name-col" style="padding: 0 4px;">${student.Name}</td>
                            <td class="remarks-col" style="padding: 0 4px;">${remarkText}</td>
                            <td class="signature-col" style="padding: 0 4px;"></td>
                        </tr>
                    `;
                    });
                    return rowsHtml;
                }

                function displayCourseCell(qp, fullCourse, isDitto) {
                    if (isDitto) {
                        return `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><span style="font-weight:bold; margin-right:6px;">${qp}</span> "</div>`;
                    }
                    const smart = getSmartCourseName(fullCourse);
                    return `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><span style="font-weight:bold; margin-right:6px;">${qp}</span> <span style="font-size:0.85em;">${smart}</span></div>`;
                }

                const studentsPage1 = session.students.sort((a, b) => a.seatNumber - b.seatNumber).slice(0, 20);
                const studentsPage2 = session.students.slice(20);

                const getHeader = (pageNum) => {
                    if (pageNum === 1) {
                        return `
                        <div class="print-header-group" style="position: relative; margin-bottom: 5px;">
                            <div style="position: absolute; top: 0; right: 0; font-weight: bold; font-size: 11pt; border: 1px solid #000; padding: 2px 6px;">
                                ${pageStream}
                            </div>
                            <div style="position: absolute; top: 0; left: 0; font-weight: bold; font-size: 12pt;">
                                Page ${pageNum}
                            </div>
                            <h1>${currentCollegeName}</h1> 
                            ${examNameHtml}
                            <h2>${serialNo} &nbsp;|&nbsp; ${session.Date} &nbsp;|&nbsp; ${session.Time}</h2>
                            ${locationHtml} 
                        </div>`;
                    } else {
                        return `
                        <div class="print-header-group" style="margin-bottom: 5px; border-bottom: 1px dashed #ccc; padding-bottom: 2px;">
                            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10pt; color: #444;">
                                <span>Hall: ${serialNo} (${session.Room})</span>
                                <span>Page 2 - ${pageStream}</span>
                            </div>
                        </div>`;
                    }
                };

                const tableHeader = `
                <table class="print-table" style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr>
                            <th class="sl-col" style="padding: 3px;">Seat</th>
                            <th class="course-col" style="padding: 3px;">Course (QP Code)</th>
                            <th class="reg-col" style="padding: 3px;">Register Number</th>
                            <th class="name-col" style="padding: 3px;">Name</th>
                            <th class="remarks-col" style="padding: 3px;">Remarks</th>
                            <th class="signature-col" style="padding: 3px;">Sign</th>
                        </tr>
                    </thead>
                    <tbody>`;

                previousCourseName = ""; previousRegNoPrefix = "";
                const tableRowsPage1 = generateTableRows(studentsPage1);
                allPagesHtml += `
                <div class="print-page print-page-room" style="height: 100%; display: flex; flex-direction: column;">
                    ${getHeader(1)}
                    ${tableHeader}
                    ${tableRowsPage1}
                    </tbody></table>
                    <div style="flex-grow: 1;"></div> 
                    <div style="text-align:right; font-size:8pt; margin-top:2px; color:#666;">Continued on Page 2...</div>
                </div>
            `;
                totalPagesGenerated++;

                previousCourseName = ""; previousRegNoPrefix = "";
                const tableRowsPage2 = generateTableRows(studentsPage2);
                let page2TableContent = studentsPage2.length > 0 ? `${tableHeader}${tableRowsPage2}</tbody></table>` : `<div style="padding: 10px; text-align: center; font-style: italic; border-bottom: 1px solid #ccc;">(End of Student List)</div>`;

                allPagesHtml += `
                <div class="print-page print-page-room" style="height: 100%; display: flex; flex-direction: column;">
                    ${getHeader(2)}
                    ${page2TableContent}
                    ${invigilatorFooterHtml} 
                    <div style="flex-grow: 1;"></div>
                </div>
            `;
                totalPagesGenerated++;
            });

            reportOutputArea.innerHTML = allPagesHtml;
            reportOutputArea.style.display = 'block';
            reportStatus.textContent = `Generated Room-wise Report.`;
            reportControls.classList.remove('hidden');

            roomCsvDownloadContainer.innerHTML = `
            <button id="download-room-csv-button" class="w-full inline-flex justify-center items-center rounded-md border border-gray-300 bg-white py-3 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                Download Room Allocation Report (.csv)
            </button>
        `;
            document.getElementById('download-room-csv-button').addEventListener('click', downloadRoomCsv);

        } catch (e) {
            console.error("Error:", e);
            alert("Error: " + e.message);
        } finally {
            generateReportButton.disabled = false;
            generateReportButton.textContent = "Generate Room-wise Seating Report";
        }
    });
    // --- (V30 Optimized) Event listener for the "Day-wise Student List" (Compact Report) ---
    generateDaywiseReportButton.addEventListener('click', async () => {
        const sessionKey = reportsSessionSelect.value;
        if (filterSessionRadio.checked && !checkManualAllotment(sessionKey)) { return; }

        generateDaywiseReportButton.disabled = true;
        generateDaywiseReportButton.textContent = "Generating...";
        reportOutputArea.innerHTML = "";
        reportControls.classList.add('hidden');
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
            getRoomCapacitiesFromStorage();

            const baseData = getFilteredReportData('day-wise');
            if (baseData.length === 0) { alert("No data found."); return; }

            // 1. Split Data by Stream
            const dataByStream = {};
            const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');

            baseData.forEach(row => {
                const strm = row.Stream || "Regular";
                if (!dataByStream[strm]) dataByStream[strm] = [];
                dataByStream[strm].push(row);
            });

            const sortedStreamNames = Object.keys(dataByStream).sort((a, b) => {
                // Fix: Explicitly handle both sides to ensure Regular is always first
                if (a === "Regular") return -1;
                if (b === "Regular") return 1;
                return a.localeCompare(b);
            });

            // --- CUSTOM STYLES: Remove Shadow/Border in Print ---
            let allPagesHtml = `
            <style>
                @media print {
                    .print-page, .print-page-daywise {
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 auto !important;
                    }
                }
            </style>
        `;

            let totalPagesGenerated = 0;

            // Layout Constants (Dynamic from UI)
            const rowsInput = document.getElementById('daywise-rows');
            const colsInput = document.getElementById('daywise-cols');

            const STUDENTS_PER_COLUMN = rowsInput ? parseInt(rowsInput.value, 10) : 35;
            const COLUMNS_PER_PAGE = colsInput ? parseInt(colsInput.value, 10) : 1;
            const STUDENTS_PER_PAGE = STUDENTS_PER_COLUMN * COLUMNS_PER_PAGE;

            // Helper to build a small table for one column (Fixed Widths for PDF)
            function buildColumnTable(studentChunk) {
                // 1. Pre-process data for RowSpans
                const processedRows = studentChunk.map((student, index) => {
                    const prevCourse = (index === 0) ? "" : studentChunk[index - 1].Course;
                    const isCourseHeader = (student.Course !== prevCourse);

                    let roomName = student['Room No'];
                    let seatNo = student.seatNumber;
                    let rowStyle = '';

                    if (student.isScribe) {
                        const sessionKeyPipe = `${student.Date} | ${student.Time}`;
                        const scribeRoom = allScribeAllotments[sessionKeyPipe]?.[student['Register Number']];
                        if (scribeRoom) roomName = scribeRoom;
                        seatNo = 'Scribe';
                        rowStyle = 'font-weight: bold; color: #c2410c;';
                    }

                    const roomInfo = currentRoomConfig[roomName] || {};
                    const displayRoom = (roomInfo.location && roomInfo.location.trim() !== "") ? roomInfo.location : roomName;

                    return {
                        student, isCourseHeader, displayRoom, seatNo, rowStyle,
                        courseName: student.Course, span: 1, skipLocation: false
                    };
                });

                // 2. Calculate Merges
                for (let i = 0; i < processedRows.length; i++) {
                    if (processedRows[i].skipLocation) continue;
                    let span = 1;
                    for (let j = i + 1; j < processedRows.length; j++) {
                        const current = processedRows[i];
                        const next = processedRows[j];
                        if (next.isCourseHeader || next.displayRoom !== current.displayRoom) break;
                        span++;
                        next.skipLocation = true;
                    }
                    processedRows[i].span = span;
                }

                // 3. Build HTML
                let rowsHtml = '';

                processedRows.forEach(row => {
                    if (row.isCourseHeader) {
                        rowsHtml += `
                        <tr>
                            <td colspan="4" style="background-color: #eee; font-weight: bold; padding: 2px 4px; border: 1px solid #000; font-size: 0.8em;">
                                ${row.courseName}
                            </td>
                        </tr>`;
                    }

                    rowsHtml += `<tr style="${row.rowStyle}">`;

                    if (!row.skipLocation) {
                        const rowspanAttr = row.span > 1 ? `rowspan="${row.span}"` : '';
                        // Center vertically if merged, Top if single (to save space)
                        const valign = row.span > 1 ? 'vertical-align: middle;' : 'vertical-align: top;';

                        // --- NEW: DYNAMIC FONT SIZE LOGIC ---
                        // Scales font based on how many rows (students) are in the room
                        let locFontSize = '0.8em'; // Default small (for single/double rows)

                        if (row.span > 15) locFontSize = '1.4em';       // Very Large for big halls
                        else if (row.span > 10) locFontSize = '1.2em';  // Large
                        else if (row.span > 5) locFontSize = '1.0em';   // Medium
                        else if (row.span > 2) locFontSize = '0.9em';   // Slightly larger than base

                        // Applied styles: Bold, Centered, Dynamic Size
                        rowsHtml += `<td ${rowspanAttr} style="padding: 2px; font-size:${locFontSize}; font-weight:bold; background-color: #fff; ${valign} text-align: center; line-height: 1.1; border: 1px solid #000;">
                        ${row.displayRoom}
                    </td>`;
                    }

                    rowsHtml += `
                        <td style="padding: 1px 4px; font-weight: 600; font-size: 0.9em; border: 1px solid #000;">${row.student['Register Number']}</td>
                        
                        <td style="padding: 1px 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 0; border: 1px solid #000;">
                            ${row.student.Name}
                        </td>
                        
                        <td style="padding: 1px 4px; text-align: center; font-weight: bold; border: 1px solid #000;">${row.seatNo}</td>
                    </tr>
                `;
                });

                return `
                <table class="daywise-report-table" style="width:100%; border-collapse:collapse; font-size:9pt; table-layout: fixed;">
                    <colgroup>
                        <col style="width: 22%;"> <col style="width: 30%;"> <col style="width: 38%;"> <col style="width: 10%;"> </colgroup>
                    <thead>
                        <tr>
                            <th style="border: 1px solid #000;">Location</th>
                            <th style="border: 1px solid #000;">Reg No</th>
                            <th style="border: 1px solid #000;">Name</th>
                            <th style="border: 1px solid #000;">Seat</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            `;
            }

            // Main Loop
            for (const streamName of sortedStreamNames) {
                const streamData = dataByStream[streamName];
                const processed_rows = performOriginalAllocation(streamData);

                const daySessions = {};
                processed_rows.forEach(student => {
                    const key = `${student.Date}_${student.Time}`;
                    if (!daySessions[key]) daySessions[key] = { Date: student.Date, Time: student.Time, students: [] };
                    daySessions[key].students.push(student);
                });

                const sortedSessionKeys = Object.keys(daySessions).sort();

                sortedSessionKeys.forEach(key => {
                    const session = daySessions[key];

                    // --- NEW: Get Exam Name ---
                    // We assume the stream is consistent for this batch (streamName variable from outer loop)
                    const examName = getExamName(session.Date, session.Time, streamName);
                    const examNameHtml = examName ? `<h2 style="font-size:13pt; font-weight:bold; margin:2px 0; text-transform:uppercase;">${examName}</h2>` : "";

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
                        if (col2Students.length === 0) {
                            columnHtml = `<div class="column" style="width:100%">${buildColumnTable(col1Students)}</div>`;
                        } else {
                            columnHtml = `
                        <div class="column-container" style="display:flex; gap:15px;">
                            <div class="column" style="flex:1">${buildColumnTable(col1Students)}</div>
                            <div class="column" style="flex:1">${buildColumnTable(col2Students)}</div>
                        </div>
                    `;
                        }

                        // Add Student Page with Exam Name
                        allPagesHtml += `
                    <div class="print-page print-page-daywise">
                        <div class="print-header-group" style="position: relative; margin-bottom: 10px;">
                            <div style="position: absolute; top: 0; left: 0; font-weight: bold; font-size: 11pt; border: 1px solid #000; padding: 2px 6px;">
                                Page ${totalPagesGenerated}
                            </div>
                            <div style="position: absolute; top: 0; right: 0; font-weight: bold; font-size: 11pt; border: 1px solid #000; padding: 2px 6px;">
                                ${streamName}
                            </div>
                            <h1>${currentCollegeName}</h1>
                            ${examNameHtml} <h2>Seating Details</h2>
                            <h3>${session.Date} &nbsp;|&nbsp; ${session.Time}</h3>
                        </div>
                        ${columnHtml}
                    </div>
                `;
                    }

                    // Generate Separate Scribe Page
                    const sessionScribes = session.students.filter(s => s.isScribe);
                    if (sessionScribes.length > 0 && typeof renderScribeSummaryPage === 'function') {
                        allPagesHtml += renderScribeSummaryPage(sessionScribes, streamName, session, allScribeAllotments);
                    }
                });
            }

            reportOutputArea.innerHTML = allPagesHtml;
            reportOutputArea.style.display = 'block';
            reportStatus.textContent = `Generated ${totalPagesGenerated} pages.`;
            reportControls.classList.remove('hidden');
            lastGeneratedReportType = "Daywise_Seating_Details";

        } catch (e) {
            console.error("Error:", e);
            alert("Error generating report: " + e.message);
        } finally {
            generateDaywiseReportButton.disabled = false;
            generateDaywiseReportButton.textContent = "Generate Seating Details for Candidates (Compact)";
        }
    });

    // Helper for Scribe Block at bottom of report
    function renderScribeSummaryBlock(scribes, session, allotments) {
        const scribesByRoom = {};
        scribes.forEach(s => {
            const sessionKeyPipe = `${session.Date} | ${session.Time}`;
            const newRoom = allotments[sessionKeyPipe]?.[s['Register Number']] || "Unallotted";
            if (!scribesByRoom[newRoom]) scribesByRoom[newRoom] = [];
            scribesByRoom[newRoom].push(s);
        });

        let html = `<div style="margin-top: 15px; border: 2px solid #333; padding: 10px; page-break-inside: avoid;">
        <h3 style="margin:0 0 5px 0; font-size:11pt; text-decoration:underline;">Scribe Assistance Summary</h3>`;

        Object.keys(scribesByRoom).sort().forEach(room => {
            const names = scribesByRoom[room].map(s => `${s.Name} (${s['Register Number']})`).join(', ');
            html += `<div style="font-size:9pt; margin-bottom:4px;"><strong>${room}:</strong> ${names}</div>`;
        });
        html += `</div>`;
        return html;
    }




    // 2. Attach Listeners to New Buttons
    const btn1Col = document.getElementById('generate-daywise-1col-btn');
    const btn2Col = document.getElementById('generate-daywise-2col-btn');

    if (btn1Col) btn1Col.addEventListener('click', () => generateNoticeBoardReport(1));
    if (btn2Col) btn2Col.addEventListener('click', () => generateNoticeBoardReport(2));


    // --- Helper: Render Page ---
    function renderNoticePage(col1, col2, streamName, session, numCols) {

        // Sub-helper to render a single column table
        const renderColumn = (rows) => {
            if (!rows || rows.length === 0) return "";

            let html = "";
            let lastLocation = "";

            rows.forEach((row, idx) => {
                if (row.type === 'header') {
                    html += `
                    <tr class="bg-gray-200 print:bg-gray-200">
                        <td colspan="4" style="font-weight: bold; font-size: 0.85em; padding: 3px 4px; border: 1px solid #000; text-align: left; border-top: 2px solid #000;">
                            ${row.text}
                        </td>
                    </tr>`;
                    lastLocation = ""; // Reset merge on header
                } else if (row.type === 'student') {
                    const sClass = row.isScribe ? 'font-bold text-orange-700' : '';

                    let locContent = "";
                    let rowBorder = "border-top: 1px solid #ddd;";

                    // Visual Merge Logic
                    if (row.locationRaw !== lastLocation) {
                        locContent = row.locationDisplay;
                        rowBorder = "border-top: 2px solid #000;";
                        lastLocation = row.locationRaw;
                    }

                    html += `
                    <tr class="${sClass}">
                        <td style="border-left: 1px solid #000; border-right: 1px solid #000; ${rowBorder} padding: 2px; width: 25%; vertical-align: top; text-align: center; font-size:0.8em; background-color: #fff;">
                            ${locContent}
                        </td>
                        <td style="border: 1px solid #000; padding: 2px; width: 20%; text-align:left; font-size: 0.9em; vertical-align: top;">${row.reg}</td>
                        <td style="border: 1px solid #000; padding: 2px 4px; width: 45%; font-size: 0.8em; overflow: hidden; vertical-align: top;">${row.name}</td>
                        <td style="border: 1px solid #000; padding: 2px; width: 10%; text-align: center; font-weight: bold; font-size: 0.9em; vertical-align: top;">${row.seat}</td>
                    </tr>`;
                } else if (row.type === 'divider') {
                    html += `<tr><td colspan="4" style="border-bottom: 2px double #000; font-weight: bold; text-align: center; padding: 5px 0 2px; font-size:0.9em;">${row.text}</td></tr>`;
                } else if (row.type === 'scribe-room') {
                    html += `<tr><td colspan="4" style="border: 1px solid #000; padding: 4px; font-size: 0.8em;"><strong>${row.roomDisplay}:</strong> ${row.content}</td></tr>`;
                } else if (row.type === 'spacer') {
                    html += `<tr><td colspan="4" style="height:4px; border:0;"></td></tr>`;
                }
            });
            return html;
        };

        const tableHeader = `
        <thead>
            <tr style="background-color: #f3f4f6; border-bottom: 2px solid #000;">
                <th style="border: 1px solid #000; padding: 2px; font-size:0.85em;">Loc</th>
                <th style="border: 1px solid #000; padding: 2px; font-size:0.85em;">Reg No</th>
                <th style="border: 1px solid #000; padding: 2px; font-size:0.85em;">Name</th>
                <th style="border: 1px solid #000; padding: 2px; font-size:0.85em;">St</th>
            </tr>
        </thead>`;

        let bodyContent = "";
        if (numCols === 1) {
            bodyContent = `
            <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                ${tableHeader}
                <tbody>${renderColumn(col1)}</tbody>
            </table>`;
        } else {
            // CSS Grid for perfect 2-column layout
            bodyContent = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; align-items: start;">
                <div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        ${tableHeader}
                        <tbody>${renderColumn(col1)}</tbody>
                    </table>
                </div>
                <div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        ${tableHeader}
                        <tbody>${renderColumn(col2)}</tbody>
                    </table>
                </div>
            </div>`;
        }

        return `
        <div class="print-page print-page-daywise" style="height: 100%; display: flex; flex-direction: column;">
            
            <div class="print-header-group" style="width: 100%; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; position: relative;">
                <div style="position: absolute; top: 0; left: 0; border: 2px solid #000; padding: 4px 10px; background: #fff;">
                    <span style="font-size: 10pt; font-weight: bold;">Page</span><br>
                    <span style="font-size: 16pt; font-weight: bold;">{{PAGE_NO}}</span>
                </div>
                <div style="position: absolute; top: 0; right: 0; font-weight: bold; font-size: 11pt; border: 1px solid #000; padding: 2px 6px; background: #eee;">
                    ${streamName}
                </div>
                <div style="text-align: center; width: 100%;"> 
                    <h1 style="font-size: 16pt; font-weight: bold; margin: 0; text-transform: uppercase;">${currentCollegeName}</h1>
                    <h2 style="font-size: 12pt; margin: 4px 0 0 0; font-weight: bold;">Seating Details for Candidates</h2>
                    <h3 style="font-size: 11pt; margin: 2px 0 0 0;">${session.Date} &nbsp;|&nbsp; ${session.Time}</h3>
                </div>
            </div>
            
            <div style="flex-grow: 1;">
                ${bodyContent}
            </div>
        </div>
    `;
    }



    // --- Helper: Render 2-Column Page ---
    function render2ColPage(col1, col2, streamName, session, numCols) {
        const renderTable = (items) => {
            if (!items || items.length === 0) return "";

            // Calculate Rowspans
            const locSpans = new Array(items.length).fill(0);
            for (let i = 0; i < items.length; i++) {
                if (items[i].type !== 'student') { locSpans[i] = 1; continue; }
                if (locSpans[i] === -1) continue;
                let span = 1;
                for (let j = i + 1; j < items.length; j++) {
                    if (items[j].type === 'student' && items[j].locationRaw === items[i].locationRaw) {
                        span++; locSpans[j] = -1;
                    } else { break; }
                }
                locSpans[i] = span;
            }

            let html = "";
            items.forEach((row, idx) => {
                if (row.type === 'header') {
                    html += `
                    <tr class="bg-gray-200 print:bg-gray-200">
                        <td colspan="4" style="font-weight: bold; font-size: 0.9em; padding: 2px 4px; border: 1px solid #000; text-align: left; border-top: 2px solid #000;">
                            ${row.text}
                        </td>
                    </tr>`;
                } else if (row.type === 'student') {
                    const sClass = row.isScribe ? 'font-bold text-orange-700' : '';
                    let locCell = '';
                    if (locSpans[idx] > 0) {
                        const rs = locSpans[idx] > 1 ? `rowspan="${locSpans[idx]}"` : '';
                        locCell = `<td ${rs} style="border: 1px solid #000; padding: 2px; width: 25%; vertical-align: middle; text-align: center; background-color: #fff; font-size:0.85em;">${row.locationDisplay}</td>`;
                    }
                    html += `
                    <tr class="${sClass}">
                        ${locCell}
                        <td style="border: 1px solid #000; padding: 2px; width: 20%; text-align:left; font-size: 0.9em;">${row.reg}</td>
                        <td style="border: 1px solid #000; padding: 2px 4px; width: 45%; font-size: 0.85em; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${row.name}</td>
                        <td style="border: 1px solid #000; padding: 2px; width: 10%; text-align: center; font-weight: bold; font-size: 0.9em;">${row.seat}</td>
                    </tr>`;
                } else if (row.type === 'divider') {
                    html += `<tr><td colspan="4" style="border-bottom: 3px double #000; font-weight: bold; text-align: center; padding: 10px 0 2px;">${row.text}</td></tr>`;
                } else if (row.type === 'scribe-room') {
                    html += `<tr><td colspan="4" style="border: 1px solid #000; padding: 4px; font-size: 0.85em;"><strong>${row.roomDisplay}:</strong> ${row.content} (${row.studentCount})</td></tr>`;
                } else if (row.type === 'spacer') {
                    // Empty row for spacing
                    html += `<tr><td colspan="4" style="height:8px; border:0;"></td></tr>`;
                }
            });
            return html;
        };

        let bodyContent = "";
        const tableHeader = `
        <thead>
            <tr style="background-color: #f3f4f6; border-bottom: 2px solid #000;">
                <th style="border: 1px solid #000; padding: 2px;">Loc</th>
                <th style="border: 1px solid #000; padding: 2px;">Reg No</th>
                <th style="border: 1px solid #000; padding: 2px;">Name</th>
                <th style="border: 1px solid #000; padding: 2px;">St</th>
            </tr>
        </thead>`;

        if (numCols === 1) {
            bodyContent = `
            <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                ${tableHeader}
                <tbody>${renderTable(col1)}</tbody>
            </table>`;
        } else {
            bodyContent = `
            <div style="display: flex; gap: 15px; width: 100%;">
                <div style="flex: 1;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        ${tableHeader}
                        <tbody>${renderTable(col1)}</tbody>
                    </table>
                </div>
                <div style="flex: 1;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        ${tableHeader}
                        <tbody>${renderTable(col2)}</tbody>
                    </table>
                </div>
            </div>`;
        }

        return `
        <div class="print-page print-page-daywise" style="height: 100%; display: flex; flex-direction: column;">
            <div class="print-header-group" style="margin-bottom: 6px; border-bottom: 2px solid #000; padding-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <h1 style="font-size: 14pt; font-weight: bold; margin: 0;">${currentCollegeName}</h1>
                        <h2 style="font-size: 11pt; margin: 0;">Seating Details: ${session.Date} (${session.Time})</h2>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 11pt; border: 1px solid #000; padding: 1px 6px; display: inline-block;">
                            ${streamName}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="flex-grow: 1;">
                ${bodyContent}
            </div>
            
            <div style="margin-top: auto; padding-top: 5px; font-size: 8pt; text-align: center; color: #666;">
                Page Generated by ExamFlow
            </div>
        </div>
    `;
    }


    // --- Helper: Render Dense Page (1 or 2 Cols) ---
    function renderDensePage(rows, streamName, session, numCols) {
        const renderTable = (items) => {
            if (!items || items.length === 0) return "";

            // Calculate Rowspans
            const locSpans = new Array(items.length).fill(0);
            for (let i = 0; i < items.length; i++) {
                if (items[i].type !== 'student') { locSpans[i] = 1; continue; }
                if (locSpans[i] === -1) continue;
                let span = 1;
                for (let j = i + 1; j < items.length; j++) {
                    if (items[j].type === 'student' && items[j].locationRaw === items[i].locationRaw) {
                        span++; locSpans[j] = -1;
                    } else { break; }
                }
                locSpans[i] = span;
            }

            let html = "";
            items.forEach((row, idx) => {
                if (row.type === 'header') {
                    html += `
                    <tr class="bg-gray-200 print:bg-gray-200">
                        <td colspan="4" style="font-weight: bold; font-size: 0.9em; padding: 2px 4px; border: 1px solid #000; text-align: left; border-top: 2px solid #000;">
                            ${row.text}
                        </td>
                    </tr>`;
                } else if (row.type === 'student') {
                    const sClass = row.isScribe ? 'font-bold text-orange-700' : '';
                    let locCell = '';
                    if (locSpans[idx] > 0) {
                        const rs = locSpans[idx] > 1 ? `rowspan="${locSpans[idx]}"` : '';
                        locCell = `<td ${rs} style="border: 1px solid #000; padding: 2px; width: 25%; vertical-align: middle; text-align: center; background-color: #fff; font-size:0.85em;">${row.locationDisplay}</td>`;
                    }
                    html += `
                    <tr class="${sClass}">
                        ${locCell}
                        <td style="border: 1px solid #000; padding: 2px; width: 15%; text-align:left; font-size: 0.9em;">${row.reg}</td>
                        <td style="border: 1px solid #000; padding: 2px 4px; width: 50%; font-size: 0.85em; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${row.name}</td>
                        <td style="border: 1px solid #000; padding: 2px; width: 10%; text-align: center; font-weight: bold; font-size: 0.9em;">${row.seat}</td>
                    </tr>`;
                } else if (row.type === 'divider') {
                    html += `<tr><td colspan="4" style="border-bottom: 3px double #000; font-weight: bold; text-align: center; padding: 10px 0 2px;">${row.text}</td></tr>`;
                } else if (row.type === 'scribe-room') {
                    html += `<tr><td colspan="4" style="border: 1px solid #000; padding: 4px; font-size: 0.85em;"><strong>${row.roomDisplay}:</strong> ${row.content} (${row.studentCount})</td></tr>`;
                }
            });
            return html;
        };

        // Layout Logic
        let bodyContent = "";
        if (numCols === 1) {
            // Single Column
            bodyContent = `
            <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                <thead>
                    <tr style="background-color: #f3f4f6; border-bottom: 2px solid #000;">
                        <th style="border: 1px solid #000; padding: 4px;">Location</th>
                        <th style="border: 1px solid #000; padding: 4px;">Reg No</th>
                        <th style="border: 1px solid #000; padding: 4px;">Name</th>
                        <th style="border: 1px solid #000; padding: 4px;">Seat</th>
                    </tr>
                </thead>
                <tbody>${renderTable(rows)}</tbody>
            </table>
        `;
        } else {
            // Two Columns (Split Data)
            const mid = Math.ceil(rows.length / 2);
            const col1Rows = rows.slice(0, mid);
            const col2Rows = rows.slice(mid);

            bodyContent = `
            <div style="display: flex; gap: 15px; width: 100%;">
                <div style="flex: 1;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;"> <thead>
                            <tr style="background-color: #f3f4f6; border-bottom: 2px solid #000;">
                                <th style="border: 1px solid #000; padding: 2px;">Loc</th>
                                <th style="border: 1px solid #000; padding: 2px;">Reg No</th>
                                <th style="border: 1px solid #000; padding: 2px;">Name</th>
                                <th style="border: 1px solid #000; padding: 2px;">St</th>
                            </tr>
                        </thead>
                        <tbody>${renderTable(col1Rows)}</tbody>
                    </table>
                </div>
                <div style="flex: 1;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        <thead>
                            <tr style="background-color: #f3f4f6; border-bottom: 2px solid #000;">
                                <th style="border: 1px solid #000; padding: 2px;">Loc</th>
                                <th style="border: 1px solid #000; padding: 2px;">Reg No</th>
                                <th style="border: 1px solid #000; padding: 2px;">Name</th>
                                <th style="border: 1px solid #000; padding: 2px;">St</th>
                            </tr>
                        </thead>
                        <tbody>${renderTable(col2Rows)}</tbody>
                    </table>
                </div>
            </div>
        `;
        }

        return `
        <div class="print-page print-page-daywise" style="height: 100%; display: flex; flex-direction: column;">
            <div class="print-header-group" style="margin-bottom: 6px; border-bottom: 2px solid #000; padding-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <h1 style="font-size: 14pt; font-weight: bold; margin: 0;">${currentCollegeName}</h1>
                        <h2 style="font-size: 11pt; margin: 0;">Seating Details: ${session.Date} (${session.Time})</h2>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 11pt; border: 1px solid #000; padding: 1px 6px; display: inline-block;">
                            ${streamName}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="flex-grow: 1;">
                ${bodyContent}
            </div>
            
            <div style="margin-top: auto; padding-top: 5px; font-size: 8pt; text-align: center; color: #666;">
                Page Generated by ExamFlow
            </div>
        </div>
    `;
    }
    // --- Helper: Prepare Scribe Rows ---
    function prepareScribeSummaryRows(scribes, session, allotments) {
        const scribesByRoom = {};
        scribes.forEach(s => {
            const sessionKeyPipe = `${session.Date} | ${session.Time}`;
            const newRoom = allotments[sessionKeyPipe]?.[s['Register Number']] || "Unallotted";
            if (!scribesByRoom[newRoom]) scribesByRoom[newRoom] = [];
            scribesByRoom[newRoom].push(s);
        });

        const rows = [];
        Object.keys(scribesByRoom).sort().forEach(roomName => {
            const students = scribesByRoom[roomName];
            // Create a comma-separated string
            const studentList = students.map(s => `<b>${s.Name}</b> (${s['Register Number']})`).join(', ');

            const roomInfo = currentRoomConfig[roomName] || {};
            const location = roomInfo.location ? `(${roomInfo.location})` : "";

            rows.push({
                type: 'scribe-room',
                roomDisplay: `${roomName} ${location}`,
                content: studentList,
                studentCount: students.length
            });
        });
        return rows;
    }

    // --- Helper: Render Dense Page ---
    function renderDensePage(rows, streamName, session) {
        let tableBodyHtml = "";

        // Calculate Merges for this specific page
        const locationSpans = new Array(rows.length).fill(0);

        for (let i = 0; i < rows.length; i++) {
            if (rows[i].type !== 'student') {
                locationSpans[i] = 1; continue;
            }
            if (locationSpans[i] === -1) continue;

            let span = 1;
            for (let j = i + 1; j < rows.length; j++) {
                if (rows[j].type === 'student' && rows[j].locationRaw === rows[i].locationRaw) {
                    span++;
                    locationSpans[j] = -1;
                } else {
                    break;
                }
            }
            locationSpans[i] = span;
        }

        rows.forEach((row, index) => {
            if (row.type === 'header') {
                // Course Header
                tableBodyHtml += `
                <tr class="bg-gray-200 print:bg-gray-200">
                    <td colspan="4" style="font-weight: bold; font-size: 0.95em; padding: 3px 6px; border: 1px solid #000; text-align: left; border-top: 2px solid #000;">
                        ${row.text}
                    </td>
                </tr>
            `;
            } else if (row.type === 'student') {
                const scribeClass = row.isScribe ? 'font-bold text-orange-700' : '';
                let locCell = '';

                if (locationSpans[index] > 0) {
                    const rowspan = locationSpans[index] > 1 ? `rowspan="${locationSpans[index]}"` : '';
                    locCell = `<td ${rowspan} style="border: 1px solid #000; padding: 2px 4px; width: 35%; vertical-align: middle; text-align: center; background-color: #fff; font-size:0.9em;">${row.locationDisplay}</td>`;
                }

                tableBodyHtml += `
                <tr class="${scribeClass}">
                    ${locCell}
                    <td style="border: 1px solid #000; padding: 2px 4px; width: 20%; text-align:left;">${row.reg}</td>
                    <td style="border: 1px solid #000; padding: 2px 4px; width: 35%;">${row.name}</td>
                    <td style="border: 1px solid #000; padding: 2px 4px; width: 10%; text-align: center; font-weight: bold;">${row.seat}</td>
                </tr>
            `;
            } else if (row.type === 'divider') {
                // Scribe Section Header
                tableBodyHtml += `
                <tr>
                    <td colspan="4" style="border: 0; padding: 15px 0 5px 0;">
                        <div style="border-bottom: 3px double #000; text-align: center; font-weight: bold; font-size: 1.2em;">
                            ${row.text}
                        </div>
                    </td>
                </tr>
                <tr class="bg-gray-100">
                    <td style="border: 1px solid #000; padding: 4px; font-weight: bold;">Scribe Room</td>
                    <td colspan="2" style="border: 1px solid #000; padding: 4px; font-weight: bold;">Allocated Students</td>
                    <td style="border: 1px solid #000; padding: 4px; font-weight: bold; text-align:center;">Count</td>
                </tr>
            `;
            } else if (row.type === 'scribe-room') {
                // Scribe Row
                tableBodyHtml += `
                <tr>
                    <td style="border: 1px solid #000; padding: 6px; font-weight: bold; vertical-align: top;">${row.roomDisplay}</td>
                    <td colspan="2" style="border: 1px solid #000; padding: 6px; font-size: 0.9em; line-height: 1.3;">${row.content}</td>
                    <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: center; vertical-align: top;">${row.studentCount}</td>
                </tr>
            `;
            }
        });

        return `
        <div class="print-page print-page-daywise" style="height: 100%; display: flex; flex-direction: column;">
            <div class="print-header-group" style="margin-bottom: 8px; border-bottom: 2px solid #000; padding-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <h1 style="font-size: 14pt; font-weight: bold; margin: 0;">${currentCollegeName}</h1>
                        <h2 style="font-size: 11pt; margin: 0;">Seating Details: ${session.Date} (${session.Time})</h2>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 11pt; border: 1px solid #000; padding: 1px 6px; display: inline-block;">
                            ${streamName}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="flex-grow: 1;">
                <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                    <thead>
                        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #000;">
                            <th style="border: 1px solid #000; padding: 4px; text-align: center;">Location / Room</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: left;">Register No</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: left;">Name</th>
                            <th style="border: 1px solid #000; padding: 4px; text-align: center;">Seat</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableBodyHtml}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: auto; padding-top: 5px; font-size: 8pt; text-align: center; color: #666;">
                Page Generated by ExamFlow
            </div>
        </div>
    `;
    }

    // --- Helper: Render Smart Page (Auto-sizing) ---
    function renderSmartPage(rows, streamName, session, unitsUsed, maxUnits) {
        // Dynamic Font Scaling
        // If page is full (> 90%), scale down slightly for breathability
        // If page is sparse (< 60%), scale up for readability
        const fillRatio = unitsUsed / maxUnits;
        let fontSize = "11pt";
        let cellPadding = "4px 6px";

        if (fillRatio > 0.9) {
            fontSize = "10pt";
            cellPadding = "3px 5px"; // Tight
        } else if (fillRatio < 0.6) {
            fontSize = "12pt";
            cellPadding = "6px 8px"; // Relaxed
        }

        let tableBodyHtml = "";

        // Rowspan Calculation
        // We need to calculate rowspans *within this specific page*
        const locationSpans = new Array(rows.length).fill(0);

        for (let i = 0; i < rows.length; i++) {
            if (rows[i].type === 'header') {
                locationSpans[i] = 1;
                continue;
            }
            if (locationSpans[i] === -1) continue;

            let span = 1;
            // Look ahead on THIS page only
            for (let j = i + 1; j < rows.length; j++) {
                // Break if we hit a header or a different location
                if (rows[j].type === 'header' || rows[j].data.locationRaw !== rows[i].data.locationRaw) {
                    break;
                }
                span++;
                locationSpans[j] = -1; // Mark merged
            }
            locationSpans[i] = span;
        }

        // Render Rows
        rows.forEach((rowObj, index) => {
            if (rowObj.type === 'header') {
                tableBodyHtml += `
                <tr class="bg-gray-200 print:bg-gray-200">
                    <td colspan="4" style="font-weight: bold; font-size: 1.1em; padding: ${cellPadding}; border: 1px solid #000; text-align: left; border-top: 2px solid #000;">
                        ${rowObj.text}
                    </td>
                </tr>
            `;
            } else {
                const s = rowObj.data;
                const scribeClass = s.isScribe ? 'font-bold text-orange-700' : '';

                // Location Cell (Merged)
                let locCell = '';
                if (locationSpans[index] > 0) {
                    const rowspan = locationSpans[index] > 1 ? `rowspan="${locationSpans[index]}"` : '';
                    locCell = `<td ${rowspan} style="border: 1px solid #000; padding: ${cellPadding}; width: 30%; vertical-align: middle; text-align: center; background-color: #fff;">${s.locationDisplay}</td>`;
                }

                tableBodyHtml += `
                <tr class="${scribeClass}">
                    ${locCell}
                    <td style="border: 1px solid #000; padding: ${cellPadding}; width: 20%; text-align:center;">${s.reg}</td>
                    <td style="border: 1px solid #000; padding: ${cellPadding}; width: 40%;">${s.name}</td>
                    <td style="border: 1px solid #000; padding: ${cellPadding}; width: 10%; text-align: center; font-weight: bold;">${s.seat}</td>
                </tr>
            `;
            }
        });

        return `
        <div class="print-page print-page-daywise" style="height: 100%; display: flex; flex-direction: column;">
            <div class="print-header-group" style="margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <h1 style="font-size: 16pt; font-weight: bold; margin: 0;">${currentCollegeName}</h1>
                        <h2 style="font-size: 12pt; margin: 0;">Seating Details: ${session.Date} (${session.Time})</h2>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 12pt; border: 1px solid #000; padding: 2px 8px; display: inline-block;">
                            ${streamName}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="flex-grow: 1;">
                <table style="width: 100%; border-collapse: collapse; font-size: ${fontSize};">
                    <thead>
                        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #000;">
                            <th style="border: 1px solid #000; padding: 4px;">Location</th>
                            <th style="border: 1px solid #000; padding: 4px;">Register No</th>
                            <th style="border: 1px solid #000; padding: 4px;">Name</th>
                            <th style="border: 1px solid #000; padding: 4px;">Seat</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableBodyHtml}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: auto; padding-top: 10px; font-size: 9pt; text-align: center; color: #666;">
                Generated by ExamFlow System
            </div>
        </div>
    `;
    }


    // --- Helper: Render Notice Page (Course Wise with Merged Location) ---
    function renderNoticePage(rows, streamName, session, rowCount) {
        let tableBodyHtml = "";

        // 1. Pre-calculate RowSpans for the "Room" column
        // Values: 0 = skip cell, >=1 = print cell with rowspan
        const roomSpans = new Array(rows.length).fill(0);

        for (let i = 0; i < rows.length; i++) {
            if (rows[i].type === 'header') {
                roomSpans[i] = 1; // Headers don't merge
                continue;
            }

            if (roomSpans[i] === -1) continue; // Already processed

            // Start a new group
            let span = 1;
            // Look ahead
            for (let j = i + 1; j < rows.length; j++) {
                if (rows[j].type === 'student' && rows[j].room === rows[i].room) {
                    span++;
                    roomSpans[j] = -1; // Mark as merged (skip)
                } else {
                    break; // Group ended
                }
            }
            roomSpans[i] = span;
        }

        // 2. Build Table Body
        rows.forEach((row, index) => {
            if (row.type === 'header') {
                // Course Header (Spans all 4 columns)
                tableBodyHtml += `
                <tr class="bg-gray-200 print:bg-gray-200">
                    <td colspan="4" style="font-weight: bold; font-size: 1.0em; padding: 4px 8px; border: 1px solid #000; text-align: left;">
                        ${row.text}
                    </td>
                </tr>
            `;
            } else {
                // Student Row
                const scribeStyle = row.isScribe ? 'font-weight:bold; color:#c2410c;' : '';

                // Generate Location Cell (Only if it's the start of a span)
                let roomCellHtml = '';
                if (roomSpans[index] > 0) {
                    const spanAttr = roomSpans[index] > 1 ? `rowspan="${roomSpans[index]}"` : '';
                    roomCellHtml = `<td ${spanAttr} style="border: 1px solid #000; padding: 4px; width: 30%; font-size: 0.9em; vertical-align: middle; background-color: #fff; text-align: center;">${row.room}</td>`;
                }

                tableBodyHtml += `
                <tr style="${scribeStyle}">
                    ${roomCellHtml} <td style="border: 1px solid #000; padding: 2px 6px; width: 20%;">${row.reg}</td>
                    <td style="border: 1px solid #000; padding: 2px 6px; width: 40%;">${row.name}</td>
                    <td style="border: 1px solid #000; padding: 2px 6px; width: 10%; text-align: center; font-weight: bold;">${row.seat}</td>
                </tr>
            `;
            }
        });

        // 3. Return Full Page HTML
        return `
        <div class="print-page print-page-daywise">
            <div class="print-header-group" style="position: relative; margin-bottom: 10px;">
                <div style="position: absolute; top: 0; right: 0; font-weight: bold; font-size: 12pt; border: 1px solid #000; padding: 2px 8px;">
                    Stream: ${streamName}
                </div>
                <h1>Seating Details for Candidates</h1>
                <h2>${currentCollegeName} &nbsp;|&nbsp; ${session.Date} &nbsp;|&nbsp; ${session.Time}</h2>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                <thead>
                    <tr style="background-color: #f3f4f6;">
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">Room / Location</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: left;">Register No</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: left;">Name</th>
                        <th style="border: 1px solid #000; padding: 4px; text-align: center;">Seat</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableBodyHtml}
                </tbody>
            </table>
        </div>
    `;
    }


    // --- Helper: Render a Single Page of Seating Details ---
    function renderPage(rows, streamName, session, rowCount) {
        // Dynamic Font Sizing
        let tableClass = "text-base"; // Default 12pt approx
        if (rowCount > 35) tableClass = "text-sm"; // 10pt approx

        let tableBodyHtml = "";

        rows.forEach(row => {
            if (row.type === 'header') {
                // Merged Header Row for Room
                tableBodyHtml += `
                <tr class="bg-gray-200 print:bg-gray-200">
                    <td colspan="3" style="font-weight: bold; font-size: 1.1em; padding: 6px; border: 1px solid #000; text-align: center;">
                        ${row.text}
                    </td>
                </tr>
            `;
            } else {
                // Student Row
                const scribeStyle = row.isScribe ? 'font-weight:bold; color:#c2410c;' : '';
                tableBodyHtml += `
                <tr style="${scribeStyle}">
                    <td style="border: 1px solid #ccc; padding: 4px 8px; width: 30%;">${row.reg}</td>
                    <td style="border: 1px solid #ccc; padding: 4px 8px; width: 50%;">${row.name}</td>
                    <td style="border: 1px solid #ccc; padding: 4px 8px; width: 20%; text-align: center; font-weight: bold;">${row.seat}</td>
                </tr>
            `;
            }
        });

        return `
        <div class="print-page print-page-daywise">
            <div class="print-header-group" style="position: relative; margin-bottom: 10px;">
                <div style="position: absolute; top: 0; right: 0; font-weight: bold; font-size: 12pt; border: 1px solid #000; padding: 2px 8px;">
                    Stream: ${streamName}
                </div>
                <h1>Seating Details for Candidates</h1>
                <h2>${currentCollegeName} &nbsp;|&nbsp; ${session.Date} &nbsp;|&nbsp; ${session.Time}</h2>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; ${rowCount > 35 ? 'font-size: 10pt;' : 'font-size: 11pt;'}">
                <thead>
                    <tr style="background-color: #f3f4f6;">
                        <th style="border: 1px solid #000; padding: 6px; text-align: left;">Register Number</th>
                        <th style="border: 1px solid #000; padding: 6px; text-align: left;">Name</th>
                        <th style="border: 1px solid #000; padding: 6px; text-align: center;">Seat No</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableBodyHtml}
                </tbody>
            </table>
        </div>
    `;
    }

    // Helper: Generate a dedicated Scribe Page with Dynamic Sizing
    function renderScribeSummaryPage(scribes, streamName, session, allotments) {
        // 1. Group Scribes by Room (using Location logic)
        const scribesByRoom = {};
        scribes.forEach(s => {
            const sessionKeyPipe = `${session.Date} | ${session.Time}`;
            let roomName = allotments[sessionKeyPipe]?.[s['Register Number']] || "Unallotted";

            // Get clean location/room name for grouping
            const roomInfo = currentRoomConfig[roomName] || {};
            const locationDisplay = (roomInfo.location && roomInfo.location.trim() !== "") ?
                `${roomName} <br><span style="font-weight:normal; font-size:0.8em">(${roomInfo.location})</span>` :
                roomName;

            if (!scribesByRoom[locationDisplay]) scribesByRoom[locationDisplay] = [];
            scribesByRoom[locationDisplay].push(s);
        });

        // 2. Calculate Dynamic Font Size based on Volume
        // A4 page can comfortably hold ~25-30 lines at normal size.
        const roomCount = Object.keys(scribesByRoom).length;
        const totalStudents = scribes.length;
        // Heuristic: Rooms take up space (header) + Students take up space (lines)
        const densityScore = (roomCount * 2) + (totalStudents * 0.5);

        let fontSize = '14pt'; // Default Large
        if (densityScore > 15) fontSize = '12pt';
        if (densityScore > 25) fontSize = '11pt';
        if (densityScore > 35) fontSize = '10pt';

        // 3. Build Table Rows
        let rowsHtml = '';
        Object.keys(scribesByRoom).sort().forEach(roomDisplay => {
            const students = scribesByRoom[roomDisplay];
            const studentNames = students.map(s => `<b>${s.Name}</b> (${s['Register Number']})`).join(', ');

            rowsHtml += `
            <tr>
                <td style="width:30%; vertical-align:top; padding: 10px;">${roomDisplay}</td>
                <td style="width:70%; vertical-align:top; padding: 10px; line-height:1.4;">${studentNames}</td>
            </tr>
        `;
        });

        // 4. Return Full Page HTML
        return `
        <div class="print-page" style="display: flex; flex-direction: column; justify-content: center;">
            <div class="print-header-group" style="margin-bottom: 20px; text-align: center;">
                <h1>Scribe Assistance Summary</h1>
                <h2>${currentCollegeName}</h2>
                <h3>${session.Date} &nbsp;|&nbsp; ${session.Time} &nbsp; (${streamName})</h3>
            </div>
            
            <div style="border: 2px solid #000; padding: 5px; flex-grow: 1;">
                <table style="width: 100%; border-collapse: collapse; font-size: ${fontSize};">
                    <thead>
                        <tr style="background-color: #eee; border-bottom: 2px solid #000;">
                            <th style="text-align: left; padding: 10px; border-right: 1px solid #000;">Room Location</th>
                            <th style="text-align: left; padding: 10px;">Candidates</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
            <div style="text-align: right; margin-top: 10px; font-size: 10pt;">
                Total Scribes: <strong>${totalStudents}</strong>
            </div>
        </div>
    `;
    }

    // --- V91: Event listener for "Generate Question Paper Report" (Added report type set) ---
    // --- Event listener for "Generate Question Paper Report" (Stream Wise) ---
    generateQPaperReportButton.addEventListener('click', async () => {
        generateQPaperReportButton.disabled = true;
        generateQPaperReportButton.textContent = "Generating...";
        reportOutputArea.innerHTML = "";
        reportControls.classList.add('hidden');
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
            const filteredData = getFilteredReportData('q-paper');

            // 1. Group by Session -> Then by Stream
            const sessions = {};

            filteredData.forEach(item => {
                const key = `${item.Date}_${item.Time}`;
                const stream = item.Stream || "Regular";

                if (!sessions[key]) sessions[key] = { Date: item.Date, Time: item.Time, streams: {} };
                if (!sessions[key].streams[stream]) sessions[key].streams[stream] = {};

                const courseKey = item.Course;
                if (!sessions[key].streams[stream][courseKey]) sessions[key].streams[stream][courseKey] = 0;
                sessions[key].streams[stream][courseKey]++;
            });

            if (Object.keys(sessions).length === 0) { alert("No data."); return; }

            let allPagesHtml = '';
            let totalPages = 0;
            const sortedSessionKeys = Object.keys(sessions).sort();

            sortedSessionKeys.forEach(key => {
                const session = sessions[key];

                // 2. Sort Streams: Regular First, then alphabetical
                const sortedStreams = Object.keys(session.streams).sort((a, b) => {
                    if (a === "Regular") return -1;
                    if (b === "Regular") return 1;
                    return a.localeCompare(b);
                });

                // Generate Content per Stream
                let streamTablesHtml = '';

                sortedStreams.forEach(streamName => {
                    const courses = session.streams[streamName];
                    const sortedCourses = Object.keys(courses).sort();
                    let totalStudentsInStream = 0;
                    let tableRows = '';

                    sortedCourses.forEach((courseName, index) => {
                        const count = courses[courseName];
                        totalStudentsInStream += count;
                        tableRows += `
                        <tr>
                            <td class="sl-col">${index + 1}</td>
                            <td class="course-col">${courseName}</td>
                            <td class="count-col">${count}</td>
                        </tr>
                    `;
                    });

                    streamTablesHtml += `
                    <h3 style="text-align: left; margin-top: 1.5rem; border-bottom: 2px solid #000; display:inline-block;">Stream: ${streamName}</h3>
                    <table class="q-paper-table print-table" style="margin-bottom: 2rem;">
                        <thead>
                            <tr>
                                <th class="sl-col">Sl No</th>
                                <th class="course-col">Course Name</th>
                                <th class="count-col">Count</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="text-align: right;"><strong>Total (${streamName})</strong></td>
                                <td class="count-col"><strong>${totalStudentsInStream}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                `;
                });

                totalPages++;
                allPagesHtml += `
                <div class="print-page">
                    <div class="print-header-group">
                        <h1>${currentCollegeName}</h1> 
                        <h2>Question Paper Summary</h2>
                        <h3>${session.Date} &nbsp;|&nbsp; ${session.Time}</h3>
                    </div>
                    ${streamTablesHtml}
                </div>
            `;
            });

            reportOutputArea.innerHTML = allPagesHtml;
            reportOutputArea.style.display = 'block';
            reportStatus.textContent = `Generated Question Paper Report.`;
            reportControls.classList.remove('hidden');
            lastGeneratedReportType = "Question_Paper_Summary";

        } catch (e) {
            console.error(e);
            alert("Error: " + e.message);
        } finally {
            generateQPaperReportButton.disabled = false;
            generateQPaperReportButton.textContent = "Generate Question Paper Report";
        }
    });

    // --- Event listener for "Generate QP Distribution Report" (Wider Boxes + 2-Word Loc) ---
    if (generateQpDistributionReportButton) {
        generateQpDistributionReportButton.addEventListener('click', async () => {
            const sessionKey = reportsSessionSelect.value;
            if (filterSessionRadio.checked && !checkManualAllotment(sessionKey)) { return; }

            generateQpDistributionReportButton.disabled = true;
            generateQpDistributionReportButton.textContent = "Generating...";
            reportOutputArea.innerHTML = "";
            reportControls.classList.add('hidden');
            await new Promise(resolve => setTimeout(resolve, 50));

            try {
                currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
                getRoomCapacitiesFromStorage();
                loadQPCodes();

                const data = getFilteredReportData('qp-distribution');
                if (data.length === 0) { alert("No data found."); return; }

                const processed_rows_with_rooms = performOriginalAllocation(data);
                const sessions = {};

                // 1. Grouping Logic
                for (const student of processed_rows_with_rooms) {
                    const sessionKey = `${student.Date}_${student.Time}`;
                    const roomName = student['Room No'];
                    const streamName = student.Stream || "Regular";
                    const paperKey = getQpKey(student.Course, streamName);

                    const sessionKeyPipe = `${student.Date} | ${student.Time}`;
                    const sessionQPCodes = qpCodeMap[sessionKeyPipe] || {};
                    const qpCodeDisplay = sessionQPCodes[paperKey] || 'N/A';

                    if (!sessions[sessionKey]) {
                        sessions[sessionKey] = {
                            Date: student.Date,
                            Time: student.Time,
                            papers: {}
                        };
                    }

                    let paperEntry = sessions[sessionKey].papers[paperKey];

                    if (!paperEntry) {
                        paperEntry = {
                            courseName: student.Course,
                            stream: streamName,
                            qpCode: qpCodeDisplay,
                            total: 0,
                            rooms: {}
                        };
                        sessions[sessionKey].papers[paperKey] = paperEntry;
                    }

                    paperEntry.total++;

                    if (!paperEntry.rooms[roomName]) {
                        paperEntry.rooms[roomName] = 0;
                    }
                    paperEntry.rooms[roomName]++;
                }

                // 2. Rendering Logic
                let allPagesHtml = '';
                const sortedSessionKeys = Object.keys(sessions).sort(compareSessionStrings);

                for (const sessionKey of sortedSessionKeys) {
                    const session = sessions[sessionKey];
                    const sessionKeyPipe = `${session.Date} | ${session.Time}`;
                    const roomSerialMap = getRoomSerialMap(sessionKeyPipe);

                    allPagesHtml += `
                    <div class="print-page" style="padding: 5mm !important;">
                        <div class="print-header-group text-center mb-3 border-b-2 border-black pb-1">
                            <h1 class="text-lg font-bold uppercase leading-tight">${currentCollegeName}</h1>
                            <h2 class="text-base font-semibold">QP Distribution Summary</h2>
                            <h3 class="text-sm">${session.Date} &nbsp;|&nbsp; ${session.Time}</h3>
                        </div>
                `;

                    const paperArray = Object.values(session.papers);

                    // Sort Papers
                    paperArray.sort((a, b) => {
                        const isRegA = a.stream === "Regular";
                        const isRegB = b.stream === "Regular";
                        if (isRegA && !isRegB) return -1;
                        if (!isRegA && isRegB) return 1;
                        if (a.stream !== b.stream) return a.stream.localeCompare(b.stream);
                        return a.courseName.localeCompare(b.courseName);
                    });

                    // --- RENDER SECTION HELPER ---
                    const renderSection = (papers, title, bgClass, borderClass) => {
                        let html = '';
                        if (papers.length > 0) {
                            html += `<div class="font-bold text-sm uppercase border-b-2 border-black mt-4 mb-2 pb-1">${title}</div>`;

                            for (const paper of papers) {
                                const qpBadge = paper.qpCode !== 'N/A'
                                    ? `<span class="bg-white text-black px-1.5 rounded text-xs font-bold border border-black shadow-sm">${paper.qpCode}</span>`
                                    : `<span class="text-gray-400 text-[10px] italic">(QP Missing)</span>`;

                                const streamBadgeClass = (title === 'Regular Stream') ? "text-blue-800 bg-blue-50" : "text-purple-800 bg-purple-50";
                                const streamBadge = `<span class="${streamBadgeClass} px-1 rounded border border-gray-200 text-[9px] font-bold uppercase">${paper.stream}</span>`;

                                html += `
                                <div style="margin-top: 8px; padding: 4px; page-break-inside: avoid; border-radius: 4px; ${borderClass}; background: ${bgClass};">
                                    <div class="flex justify-between items-start border-b border-dotted border-gray-400 pb-1 mb-1.5">
                                        <div class="w-[90%]">
                                            <div class="font-bold text-xs leading-tight text-gray-900 mb-0.5">${paper.courseName}</div>
                                            <div class="flex items-center gap-2">
                                                ${streamBadge}
                                                <span class="text-[10px] font-semibold text-gray-600">QP: ${qpBadge}</span>
                                            </div>
                                        </div>
                                        <div class="w-[10%] text-right">
                                            <span class="text-xs font-black border border-black px-1.5 py-0.5 bg-white block text-center">${paper.total}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="grid grid-cols-3 gap-2">
                            `;

                                const sortedRoomKeys = Object.keys(paper.rooms).sort((a, b) => {
                                    const sA = roomSerialMap[a] || 999;
                                    const sB = roomSerialMap[b] || 999;
                                    return sA - sB;
                                });

                                sortedRoomKeys.forEach(roomName => {
                                    const count = paper.rooms[roomName];
                                    const roomInfo = currentRoomConfig[roomName] || {};
                                    let loc = roomInfo.location || "";

                                    // --- NEW TRUNCATION LOGIC (First 2 Words) ---
                                    if (loc) {
                                        const words = loc.split(' ');
                                        if (words.length > 2) {
                                            loc = words.slice(0, 2).join(' ') + "..";
                                        }
                                    }
                                    const displayLoc = loc ? `(${loc})` : "";
                                    const serialNo = roomSerialMap[roomName] || '-';

                                    // --- BOX LAYOUT ---
                                    html += `
                                    <div class="border border-gray-400 rounded px-1.5 py-0.5 bg-white h-[34px] flex items-center justify-between relative shadow-sm">
                                        
                                        <div class="flex items-baseline overflow-hidden w-full">
                                            <span class="text-lg font-black text-black leading-none mr-0.5">${count}</span>
                                            <span class="text-[9px] font-bold text-gray-500 mr-1.5">Nos</span>
                                            
                                            <span class="text-gray-300 mr-1.5 text-xs">|</span>

                                            <div class="flex items-baseline min-w-0 truncate">
                                                <span class="text-sm font-black text-black leading-none whitespace-nowrap mr-1">Room #${serialNo}</span>
                                                <span class="text-[9px] font-bold text-gray-500 truncate">${displayLoc}</span>
                                            </div>
                                        </div>
                                        
                                        <span class="w-3.5 h-3.5 border-2 border-black bg-white rounded-sm shrink-0 ml-1"></span>
                                    </div>
                                `;
                                });

                                html += `
                                    </div>
                                </div>`;
                            }
                        }
                        return html;
                    };

                    // Render Sections
                    const regularPapers = paperArray.filter(p => p.stream === "Regular");
                    const otherPapers = paperArray.filter(p => p.stream !== "Regular");

                    allPagesHtml += renderSection(regularPapers, "Regular Stream", "#fff", "border: 1px solid #000");
                    allPagesHtml += renderSection(otherPapers, "Other Streams", "#fffbeb", "border: 2px dashed #000");

                    allPagesHtml += `</div>`;
                }

                reportOutputArea.innerHTML = allPagesHtml;
                reportOutputArea.style.display = 'block';
                reportStatus.textContent = `Generated QP Distribution Report (Wide Layout).`;
                reportControls.classList.remove('hidden');
                lastGeneratedReportType = "QP_Distribution_Report";

            } catch (e) {
                console.error("Error:", e);
                alert("Error: " + e.message);
            } finally {
                generateQpDistributionReportButton.disabled = false;
                generateQpDistributionReportButton.textContent = "Generate QP Distribution by QP-Code Report";
            }
        });
    }

    // *** NEW: Helper for Absentee Report (Text-Based / No Gaps) ***
    function formatRegNoList(regNos) {
        if (!regNos || regNos.length === 0) return 'None'; // Changed from <em>None</em> to plain text

        const outputStrings = [];
        const regEx = /^([A-Z]+)(\d+)$/;

        regNos.sort();

        let currentPrefix = "";
        let numberGroup = [];

        function commitGroup() {
            if (numberGroup.length > 0) {
                let groupString = "";
                if (currentPrefix) {
                    const firstNum = numberGroup.shift();
                    groupString = firstNum;
                    if (numberGroup.length > 0) {
                        groupString += ", " + numberGroup.join(", ");
                    }
                } else {
                    groupString = numberGroup.join(", ");
                }
                // FIX 1: Push plain text, NO <span> tags
                outputStrings.push(groupString);
            }
            numberGroup = [];
        }

        regNos.forEach((regNo) => {
            const match = regNo.match(regEx);

            if (match) {
                const prefix = match[1];
                const number = match[2];

                if (prefix === currentPrefix) {
                    numberGroup.push(number);
                } else {
                    commitGroup();
                    currentPrefix = prefix;
                    numberGroup.push(regNo);
                }
            } else {
                commitGroup();
                currentPrefix = "";
                numberGroup.push(regNo);
                commitGroup();
            }
        });

        commitGroup();

        // FIX 2: Join with a simple New Line character (\n)
        return outputStrings.join('\n');
    }

    // --- Event listener for "Generate Absentee Statement" (Clean B&W Style) ---
    if (generateAbsenteeReportButton) {
        generateAbsenteeReportButton.addEventListener('click', async () => {
            const sessionKey = sessionSelect.value;
            if (!sessionKey) { alert("Please select a session first."); return; }

            generateAbsenteeReportButton.disabled = true;
            generateAbsenteeReportButton.textContent = "Generating...";
            reportOutputArea.innerHTML = "";
            reportControls.classList.add('hidden');
            await new Promise(resolve => setTimeout(resolve, 50));

            try {
                currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
                const [date, time] = sessionKey.split(' | ');

                // 1. Get Data for Session
                const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
                const allAbsentees = JSON.parse(localStorage.getItem(ABSENTEE_LIST_KEY) || '{}');
                const absenteeRegNos = new Set(allAbsentees[sessionKey] || []);
                loadQPCodes();

                // 2. Group by QP CODE + STREAM
                const qpStreamGroups = {};

                for (const student of sessionStudents) {
                    // Resolve QP Code
                    const courseKey = getQpKey(student.Course, student.Stream);
                    const sessionQPCodes = qpCodeMap[sessionKey] || {};
                    const qpCode = sessionQPCodes[courseKey] || "Not Entered";

                    // Resolve Stream
                    const streamName = student.Stream || "Regular";

                    const groupKey = `${qpCode}|${streamName}`;

                    if (!qpStreamGroups[groupKey]) {
                        qpStreamGroups[groupKey] = {
                            qpCode: qpCode,
                            stream: streamName,
                            courses: {},
                            grandTotal: 0,
                            grandPresent: 0,
                            grandAbsent: 0
                        };
                    }

                    const group = qpStreamGroups[groupKey];

                    if (!group.courses[student.Course]) {
                        group.courses[student.Course] = { name: student.Course, present: [], absent: [] };
                    }

                    if (absenteeRegNos.has(student['Register Number'])) {
                        group.courses[student.Course].absent.push(student['Register Number']);
                        group.grandAbsent++;
                    } else {
                        group.courses[student.Course].present.push(student['Register Number']);
                        group.grandPresent++;
                    }
                    group.grandTotal++;
                }

                // 3. Generate HTML
                let allPagesHtml = `
                <style>
                    @media print {
                        .print-page {
                            box-shadow: none !important;
                            border: none !important;
                            margin: 0 auto !important;
                        }
                    }
                </style>
            `;
                let totalPages = 0;

                const sortedKeys = Object.keys(qpStreamGroups).sort();
                const selectedFilterQP = absenteeQpFilter ? absenteeQpFilter.value : "all";
                for (const key of sortedKeys) {
                    totalPages++;
                    const data = qpStreamGroups[key];
                    if (selectedFilterQP !== "all" && data.qpCode !== selectedFilterQP) {
                        continue;
                    }
                    const examName = getExamName(date, time, data.stream);
                    const examNameHtml = examName ? `<div style="font-size:14pt; font-weight:bold; margin-top:5px; text-transform:uppercase;">${examName}</div>` : "";

                    // Dynamic Font Size
                    let dynamicFontSize = '12pt';
                    let dynamicLineHeight = '1.5';
                    if (data.grandTotal > 150) { dynamicFontSize = '9pt'; dynamicLineHeight = '1.3'; }
                    else if (data.grandTotal > 100) { dynamicFontSize = '10pt'; dynamicLineHeight = '1.4'; }
                    else if (data.grandTotal > 60) { dynamicFontSize = '11pt'; dynamicLineHeight = '1.5'; }

                    const sortedCourses = Object.keys(data.courses).sort();
                    let tableRowsHtml = '';

                    for (const courseName of sortedCourses) {
                        const courseData = data.courses[courseName];
                        const presentListText = formatRegNoList(courseData.present);
                        const absentListText = formatRegNoList(courseData.absent);

                        tableRowsHtml += `
                        <tr>
                            <td colspan="2" style="font-weight: bold; border: 1px solid #000; padding: 8px;">Course: ${courseData.name}</td>
                        </tr>
                        <tr>
                            <td style="vertical-align: top; width: 20%; padding: 8px; border: 1px solid #000;">
                                <strong>Present (${courseData.present.length})</strong>
                            </td>
                            <td class="regno-list" style="vertical-align: top; padding: 8px; border: 1px solid #000; font-size: ${dynamicFontSize}; line-height: ${dynamicLineHeight}; white-space: pre-wrap;">${presentListText}</td>
                        </tr>
                        <tr>
                            <td style="vertical-align: top; padding: 8px; border: 1px solid #000;">
                                <strong>Absent (${courseData.absent.length})</strong>
                            </td>
                            <td class="regno-list" style="vertical-align: top; padding: 8px; border: 1px solid #000; font-size: ${dynamicFontSize}; line-height: ${dynamicLineHeight}; white-space: pre-wrap;">${absentListText}</td>
                        </tr>
                    `;
                    }

                    // Summary Row (No Fill, Black Border)
                    tableRowsHtml += `
                    <tr style="border-top: 2px solid #000;">
                        <td colspan="2" style="padding: 12px; border: 1px solid #000;">
                            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1em;">
                                <span>QP CODE: ${data.qpCode}</span>
                                <span>Total: ${data.grandTotal} &nbsp;|&nbsp; Present: ${data.grandPresent} &nbsp;|&nbsp; Absent: ${data.grandAbsent}</span>
                            </div>
                        </td>
                    </tr>
                `;

                    allPagesHtml += `
                    <div class="print-page">
                        <div class="print-header-group" style="position: relative; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
                            
                            <div style="position: absolute; top: 0; right: 0; font-weight: bold; font-size: 12pt; border: 2px solid #000; padding: 4px 10px;">
                                ${data.stream}
                            </div>
                            
                            <h1>${currentCollegeName}</h1>
                            ${examNameHtml} <h2>Statement of Answer Scripts</h2>
                            <h3>${date} &nbsp;|&nbsp; ${time}</h3>
                            <div style="margin-top: 10px; font-weight: bold; font-size: 14pt; text-align: center;">
                                QP Code: <span style="padding: 2px 8px; border: 1px solid #000;">${data.qpCode}</span>
                            </div>
                        </div>
                        
                        <table class="absentee-report-table" style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
                            <tbody>
                                ${tableRowsHtml}
                            </tbody>
                        </table>
                        
                        <div class="absentee-footer" style="margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end;">
                            <div style="font-size: 10pt;">
                                <strong>Generated by ExamFlow</strong>
                            </div>
                            <div class="signature" style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 5px;">
                                Chief Superintendent
                            </div>
                        </div>
                    </div>
                `;
                }

                reportOutputArea.innerHTML = allPagesHtml;
                reportOutputArea.style.display = 'block';
                reportStatus.textContent = `Generated ${totalPages} page(s).`;
                reportControls.classList.remove('hidden');
                roomCsvDownloadContainer.innerHTML = "";
                lastGeneratedReportType = "Absentee_Statement";

            } catch (e) {
                console.error("Error generating absentee report:", e);
                reportStatus.textContent = "An error occurred while generating the report.";
                reportControls.classList.remove('hidden');
            } finally {
                generateAbsenteeReportButton.disabled = false;
                generateAbsenteeReportButton.textContent = "Generate Absentee Statement";
            }
        });
    }

    // *** UPDATED: Event listener for "Generate Scribe Report" (Stream Label Added) ***
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

            const data = getFilteredReportData('scribe-report');
            if (!data || data.length === 0) { alert("No data found."); return; }
            loadGlobalScribeList();
            const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));
            const allScribeStudents = data.filter(s => scribeRegNos.has(s['Register Number']));
            if (allScribeStudents.length === 0) { alert("No scribe students found."); return; }

            const allDataRaw = JSON.parse(jsonDataStore.innerHTML || '[]');
            const originalAllotments = performOriginalAllocation(allDataRaw);
            const originalRoomMap = originalAllotments.reduce((map, s) => {
                const key = `${s.Date}|${s.Time}|${s['Register Number']}`;
                map[key] = { room: s['Room No'], seat: s.seatNumber };
                return map;
            }, {});

            const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
            loadQPCodes();

            const reportRows = [];
            for (const s of allScribeStudents) {
                const sessionKey = `${s.Date} | ${s.Time}`;
                const sessionScribeRooms = allScribeAllotments[sessionKey] || {};
                const sessionQPCodes = qpCodeMap[sessionKey] || {};
                const courseKey = getQpKey(s.Course, s.Stream);
                const lookupKey = `${s.Date}|${s.Time}|${s['Register Number']}`;
                const originalRoomData = originalRoomMap[lookupKey] || { room: 'N/A', seat: 'N/A' };
                const roomSerialMap = getRoomSerialMap(sessionKey);
                const orgSerial = roomSerialMap[originalRoomData.room] || '-';
                const originalRoomDisplay = `${orgSerial} - ${originalRoomData.room} (Seat: ${originalRoomData.seat})`;
                const rawScribeRoom = sessionScribeRooms[s['Register Number']];
                let scribeRoomDisplay = 'Not Allotted';

                if (rawScribeRoom) {
                    const rInfo = currentRoomConfig[rawScribeRoom];
                    const rLoc = (rInfo && rInfo.location) ? ` (${rInfo.location})` : "";
                    const scribeSerial = roomSerialMap[rawScribeRoom] || '-';
                    scribeRoomDisplay = `${scribeSerial} - ${rawScribeRoom}${rLoc}`;
                }

                reportRows.push({
                    Date: s.Date, Time: s.Time, RegisterNumber: s['Register Number'],
                    Name: s.Name, Course: s.Course, OriginalRoom: originalRoomDisplay,
                    ScribeRoom: scribeRoomDisplay, QPCode: sessionQPCodes[courseKey] || 'N/A',
                    Stream: s.Stream || "Regular"
                });
            }

            const sessions = {};
            for (const row of reportRows) {
                const key = `${row.Date}_${row.Time}`;
                if (!sessions[key]) sessions[key] = { Date: row.Date, Time: row.Time, students: [] };
                sessions[key].students.push(row);
            }

            let allPagesHtml = '';
            let totalPages = 0;
            const sortedSessionKeys = Object.keys(sessions).sort();

            sortedSessionKeys.forEach(key => {
                const session = sessions[key];
                totalPages++;

                // Determine Stream Label for Header
                const streamsInSession = new Set(session.students.map(s => s.Stream));
                const streamLabel = streamsInSession.size === 1 ? Array.from(streamsInSession)[0] : "Combined";

                // --- NEW: Get Exam Name ---
                // If Combined, we might miss specific names, but we try with the first available stream or fallback
                const lookupStream = (streamLabel !== "Combined") ? streamLabel : "Regular";
                const examName = getExamName(session.Date, session.Time, lookupStream);
                const examNameHtml = examName ? `<h2 style="font-size:13pt; font-weight:bold; margin:2px 0; text-transform:uppercase;">${examName}</h2>` : "";

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
                    <div class="print-header-group" style="position: relative;">
                        <div style="position: absolute; top: 0; right: 0; font-weight: bold; font-size: 12pt; border: 1px solid #000; padding: 2px 8px;">
                            Stream: ${streamLabel}
                        </div>
                        <h1>${currentCollegeName}</h1>
                        ${examNameHtml} <h2>Scribe Assistance Report</h2>
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

            reportOutputArea.innerHTML = allPagesHtml;
            reportOutputArea.style.display = 'block';
            reportStatus.textContent = `Generated ${totalPages} scribe report pages.`;
            reportControls.classList.remove('hidden');
            lastGeneratedReportType = "Scribe_Assistance_Report";
        } catch (e) {
            console.error("Error:", e);
            alert("Error generating report: " + e.message);
            reportControls.classList.remove('hidden');
        } finally {
            generateScribeReportButton.disabled = false;
            generateScribeReportButton.textContent = "Generate Scribe Assistance Report";
        }
    });

    // *******************************************************

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
                const courseKey = getQpKey(s.Course, s.Stream);

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
                    QPCode: sessionQPCodes[courseKey] || 'N/A',
                    // We add ScribeSerial here so we can sort by it below
                    ScribeSerial: (rawScribeRoom && roomSerialMap[rawScribeRoom]) ? parseInt(roomSerialMap[rawScribeRoom]) : 999999
                });
            }

            // --- SORTING LOGIC INSERTED HERE ---
            reportRows.sort((a, b) => {
                // 1. Chronological Session
                const sessionA = `${a.Date} | ${a.Time}`;
                const sessionB = `${b.Date} | ${b.Time}`;
                const timeDiff = compareSessionStrings(sessionA, sessionB);
                if (timeDiff !== 0) return timeDiff;

                // 2. Scribe Room Serial
                if (a.ScribeSerial !== b.ScribeSerial) {
                    return a.ScribeSerial - b.ScribeSerial;
                }

                // 3. Register Number (Tie-breaker)
                return a.RegisterNumber.localeCompare(b.RegisterNumber);
            });
            // -----------------------------------

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
    navHome.addEventListener('click', () => showView(viewHome, navHome));
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
        // 1. Hide all views (Safety Check Added)
        allViews.forEach(view => {
            if (view) view.classList.add('hidden');
        });

        // 2. Deactivate all buttons (Safety Check Added)
        allNavButtons.forEach(btn => {
            if (btn) {
                btn.classList.add('nav-button-inactive');
                btn.classList.remove('nav-button-active');
            }
        });

        // 3. Show target view & activate button
        if (viewToShow) {
            viewToShow.classList.remove('hidden');
        }

        if (buttonToActivate) {
            buttonToActivate.classList.remove('nav-button-inactive');
            buttonToActivate.classList.add('nav-button-active');
        }

        // 4. Clean up previous reports
        if (typeof clearReport === 'function') clearReport();

        // 5. Save the active tab
        if (viewToShow && viewToShow.id && buttonToActivate && buttonToActivate.id) {
            localStorage.setItem('lastActiveViewId', viewToShow.id);
            localStorage.setItem('lastActiveNavId', buttonToActivate.id);
        }

        // --- FIX: AUTO-CLOSE SIDEBAR ON MOBILE ---
        const sidebar = document.getElementById('main-nav');
        if (window.innerWidth < 768 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.add('-translate-x-full');
        }
    }

    // --- (V48) Save from dynamic form (in Settings) ---
    saveRoomConfigButton.addEventListener('click', () => {
        try {
            const newConfig = {};
            const roomRows = roomConfigContainer.querySelectorAll('.room-row');
            let isValid = true; // Flag to track validation

            // Use a standard for loop to allow 'break' on error
            for (const row of roomRows) {
                const roomName = row.querySelector('.room-name-label').textContent.replace(':', '').trim();
                const capacity = parseInt(row.querySelector('.room-capacity-input').value, 10) || 30;

                const locationInput = row.querySelector('.room-location-input');
                const location = locationInput.value.trim();

                // *** VALIDATION CHECK ***
                if (!location) {
                    alert(`Error: Location is missing for ${roomName}.\n\nPlease enter a location (e.g., "101 - Commerce Block").`);
                    locationInput.focus(); // Jump to the empty box
                    locationInput.classList.add('border-red-500', 'ring-1', 'ring-red-500'); // Highlight it

                    // Remove highlight after user starts typing
                    locationInput.addEventListener('input', function () {
                        this.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
                    }, { once: true });

                    isValid = false;
                    break; // Stop processing
                }

                newConfig[roomName] = { capacity, location };
            }

            // Stop if validation failed
            if (!isValid) return;

            // Proceed with Save
            localStorage.setItem(ROOM_CONFIG_KEY, JSON.stringify(newConfig));

            roomConfigStatus.textContent = "Settings saved successfully!";
            setTimeout(() => { roomConfigStatus.textContent = ""; }, 2000);

            // Re-load to LOCK everything
            loadRoomConfig();
            if (typeof syncDataToCloud === 'function') syncDataToCloud('settings');

        } catch (e) {
            console.error(e);
        }
    });


    // --- (V97) College Name Save Logic (Updated with Edit Button) ---
    const editCollegeNameBtn = document.getElementById('edit-college-name-btn');

    if (editCollegeNameBtn) {
        editCollegeNameBtn.addEventListener('click', () => {
            collegeNameInput.disabled = false;
            collegeNameInput.classList.remove('disabled:bg-gray-100', 'disabled:text-gray-500');
            collegeNameInput.focus();
        });
    }

    if (saveCollegeNameButton) {
        saveCollegeNameButton.addEventListener('click', () => {
            const collegeName = collegeNameInput.value.trim() || "University of Calicut";
            localStorage.setItem(COLLEGE_NAME_KEY, collegeName);
            currentCollegeName = collegeName;

            // Lock it again
            collegeNameInput.disabled = true;
            collegeNameInput.classList.add('disabled:bg-gray-100', 'disabled:text-gray-500');

            collegeNameStatus.textContent = "College name saved!";
            setTimeout(() => { collegeNameStatus.textContent = ""; }, 2000);

            if (typeof syncDataToCloud === 'function') syncDataToCloud('settings');
        });
    }


    // --- (Refactored) Load Room Config into Modal ---
    function loadRoomConfig() {
        // V48: Load College Name
        currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
        if (collegeNameInput) {
            collegeNameInput.value = currentCollegeName;
            collegeNameInput.disabled = true;
        }

        // Load Room Config
        let savedConfigJson = localStorage.getItem(ROOM_CONFIG_KEY);
        let config = {};

        try { config = JSON.parse(savedConfigJson || '{}'); } catch (e) { config = {}; }

        if (Object.keys(config).length === 0) {
            for (let i = 1; i <= 30; i++) config[`Room ${i}`] = { capacity: 30, location: "" };
            localStorage.setItem(ROOM_CONFIG_KEY, JSON.stringify(config));
        }

        currentRoomConfig = config;

        // 1. Populate List (Inside Modal)
        if (roomConfigContainer) {
            roomConfigContainer.innerHTML = '';

            const sortedKeys = Object.keys(config).sort((a, b) => {
                const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
                const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
                return numA - numB;
            });

            // Add rows (LOCKED by default)
            sortedKeys.forEach((roomName, index) => {
                const roomData = config[roomName];
                const isLast = (index === sortedKeys.length - 1);
                const safeLocation = roomData.location || "";

                const rowHtml = createRoomRowHtml(roomName, roomData.capacity, safeLocation, isLast, true);
                roomConfigContainer.insertAdjacentHTML('beforeend', rowHtml);
            });
        }

        // 2. Update Dashboard Widget Count (NEW)
        const countDisplay = document.getElementById('room-count-display');
        if (countDisplay) {
            countDisplay.textContent = Object.keys(config).length;
        }
    }


    // --- (V28) Add New Room Button (in Settings) ---
    // --- Add New Room Button ---
    addRoomButton.addEventListener('click', () => {
        const allRows = roomConfigContainer.querySelectorAll('.room-row');
        let newName = "Room 1";

        if (allRows.length > 0) {
            // ... (Keep existing naming logic) ...
            const lastRow = allRows[allRows.length - 1];
            const lastName = lastRow.querySelector('.room-name-label').textContent.replace(':', '').trim();
            let lastNum = parseInt(lastName.match(/(\d+)/)[0], 10) || allRows.length;
            newName = `Room ${lastNum + 1}`;

            // Remove "Remove" button from previous last row
            const removeButton = lastRow.querySelector('.remove-room-button');
            if (removeButton) {
                const placeholder = document.createElement('div');
                placeholder.className = 'w-[70px]';
                removeButton.parentNode.replaceChild(placeholder, removeButton);
            }
        }

        // Create NEW row -> isLocked = FALSE (Editable)
        const newRowHtml = createRoomRowHtml(newName, 30, "", true, false);
        roomConfigContainer.insertAdjacentHTML('beforeend', newRowHtml);
    });

    // --- Remove OR Edit Room Button (Event Delegation: Auto-Save) ---
    if (roomConfigContainer) {
        roomConfigContainer.addEventListener('click', (e) => {

            // 1. HANDLE REMOVE
            if (e.target.classList.contains('remove-room-button')) {
                if (!confirm("Delete this room?")) return;

                const row = e.target.closest('.room-row');
                const roomName = row.getAttribute('data-room-name');

                // Remove from UI
                row.remove();

                // Remove from Data
                if (currentRoomConfig[roomName]) {
                    delete currentRoomConfig[roomName];
                    localStorage.setItem(ROOM_CONFIG_KEY, JSON.stringify(currentRoomConfig));
                    if (typeof syncDataToCloud === 'function') syncDataToCloud('settings');

                    // Update Count
                    const countDisplay = document.getElementById('room-count-display');
                    if (countDisplay) countDisplay.textContent = Object.keys(currentRoomConfig).length;
                }
                return;
            }

            // 2. HANDLE EDIT TOGGLE (Unlock <-> Save)
            const editBtn = e.target.closest('.edit-room-btn');
            if (editBtn) {
                const row = editBtn.closest('.room-row');
                const inputs = row.querySelectorAll('input');
                const isCurrentlyLocked = inputs[0].disabled;

                if (isCurrentlyLocked) {
                    // === STATE: LOCKED -> UNLOCK IT ===
                    inputs.forEach(input => {
                        input.disabled = false;
                        input.classList.remove('bg-gray-50', 'text-gray-500');
                        input.classList.add('bg-white', 'text-black', 'ring-1', 'ring-indigo-200');
                    });
                    inputs[0].focus(); // Focus capacity

                    // Change Icon to CHECK (Green)
                    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-green-600"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;
                    editBtn.className = "edit-room-btn p-1.5 md:p-1 transition rounded-full bg-green-50 border border-green-200 hover:bg-green-100";

                } else {
                    // === STATE: UNLOCKED -> SAVE & LOCK ===
                    const roomName = row.getAttribute('data-room-name');
                    const newCap = parseInt(row.querySelector('.room-capacity-input').value, 10) || 30;
                    const newLoc = row.querySelector('.room-location-input').value.trim();

                    // Basic Validation
                    if (!newLoc) {
                        alert("Please enter a location (e.g., 'Ground Floor').");
                        return;
                    }

                    // Update Config Object
                    if (!currentRoomConfig) currentRoomConfig = {};
                    currentRoomConfig[roomName] = { capacity: newCap, location: newLoc };

                    // Save to Storage
                    localStorage.setItem(ROOM_CONFIG_KEY, JSON.stringify(currentRoomConfig));

                    // Lock Inputs
                    inputs.forEach(input => {
                        input.disabled = true;
                        input.classList.add('bg-gray-50', 'text-gray-500');
                        input.classList.remove('bg-white', 'text-black', 'ring-1', 'ring-indigo-200');
                    });

                    // Revert Icon to PENCIL (Blue)
                    editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg>`;
                    editBtn.className = "edit-room-btn p-1.5 md:p-1 transition rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-50";

                    // Sync
                    if (typeof syncDataToCloud === 'function') syncDataToCloud('settings');

                    // Feedback
                    const status = document.getElementById('room-config-status');
                    if (status) {
                        status.textContent = `Saved ${roomName}`;
                        setTimeout(() => status.textContent = "", 1500);
                    }
                }
            }
        });
    }

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
    window.real_populate_session_dropdown = function () {
        try {
            allStudentData = JSON.parse(jsonDataStore.innerHTML || '[]');
            if (allStudentData.length === 0) {
                disable_absentee_tab(true);
                return;
            }

            const previousSelection = sessionSelect.value;

            // ### Data Analysis (Existing) ###
            const totalRows = allStudentData.length;
            const seenKeys = new Set();
            const uniqueStudentEntries = [];
            let duplicateCount = 0;

            allStudentData.forEach(row => {
                const key = `${row.Date}|${row.Time}|${row['Register Number']}`;
                if (seenKeys.has(key)) {
                    duplicateCount++;
                } else {
                    seenKeys.add(key);
                    uniqueStudentEntries.push(row);
                }
            });

            if (duplicateCount > 0) {
                // ... (Existing warning logic preserved) ...
                const uniqueCount = seenKeys.size;
                if (statusLogDiv) {
                    // ... (Log message logic) ...
                }
                allStudentData = uniqueStudentEntries;
            }

            updateUniqueStudentList();

            const sessions = new Set(allStudentData.map(s => `${s.Date} | ${s.Time}`));
            allStudentSessions = Array.from(sessions).sort(compareSessionStrings);

            sessionSelect.innerHTML = '<option value="">-- Select a Session --</option>';
            reportsSessionSelect.innerHTML = '<option value="all">All Sessions</option>';
            editSessionSelect.innerHTML = '<option value="">-- Select a Session --</option>';
            searchSessionSelect.innerHTML = '<option value="">-- Select a Session --</option>';

            // 2. Time-Based Default Logic
            const today = new Date();
            const todayStr = today.toLocaleDateString('en-GB').replace(/\//g, '.');
            const currentHour = today.getHours();

            let fnSession = "";
            let anSession = "";

            allStudentSessions.forEach(session => {
                const opt = `<option value="${session}">${session}</option>`;
                sessionSelect.innerHTML += opt;
                reportsSessionSelect.innerHTML += opt;
                editSessionSelect.innerHTML += opt;
                searchSessionSelect.innerHTML += opt;

                if (session.startsWith(todayStr)) {
                    const timePart = (session.split('|')[1] || "").toUpperCase();
                    if (timePart.includes("PM") || timePart.trim().startsWith("12")) {
                        if (!anSession) anSession = session;
                    } else {
                        if (!fnSession) fnSession = session;
                    }
                }
            });

            let defaultSession = "";
            if (currentHour >= 12) {
                defaultSession = anSession || fnSession;
            } else {
                defaultSession = fnSession || anSession;
            }

            // 3. Restore Previous OR Set Default
            if (previousSelection && allStudentSessions.includes(previousSelection)) {
                sessionSelect.value = previousSelection;
                sessionSelect.dispatchEvent(new Event('change'));
            } else if (defaultSession) {
                sessionSelect.value = defaultSession;
                sessionSelect.dispatchEvent(new Event('change'));

                if (searchSessionSelect) {
                    searchSessionSelect.value = defaultSession;
                    searchSessionSelect.dispatchEvent(new Event('change'));
                }
                if (editSessionSelect) {
                    editSessionSelect.value = defaultSession;
                    editSessionSelect.dispatchEvent(new Event('change'));
                }
            }

            reportFilterSection.classList.remove('hidden');
            filterSessionRadio.checked = true;
            reportsSessionDropdownContainer.classList.remove('hidden');
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

            // *** FIX: Populate the QP Filter Dropdown ***
            populateAbsenteeQpFilter(sessionKey);
            // ******************************************
        } else {
            absenteeSearchSection.classList.add('hidden');
            absenteeListSection.classList.add('hidden');
            generateAbsenteeReportButton.disabled = true;
            currentAbsenteeListDiv.innerHTML = "";

            // Optional: Reset the filter if no session
            if (typeof populateAbsenteeQpFilter === 'function') {
                populateAbsenteeQpFilter(null);
            }
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
                const strm = student.Stream || "Regular";
                item.innerHTML = `
                <div class="flex justify-between items-center">
                    <span>${student['Register Number'].replace(new RegExp(query, 'gi'), '<strong>$&</strong>')} (${student.Name})</span>
                    <span class="text-xs font-bold text-gray-400 uppercase bg-gray-50 px-1 rounded ml-2">${strm}</span>
                </div>
            `;
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
        selectedStudentCourse.innerHTML = `${student.Course} <span class="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">${student.Stream || "Regular"}</span>`;
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
                // Store just what's needed, NOW INCLUDING STREAM
                allUniqueStudentsForScribeSearch.push({
                    regNo: student['Register Number'],
                    name: student.Name,
                    stream: student.Stream || "Regular" // <--- Added Stream
                });
            }
        }
        console.log(`Updated unique student list: ${allUniqueStudentsForScribeSearch.length} students found.`);
    }
    // --- END: New helper function ---

    // --- ABSENTEE MANAGEMENT LOGIC (Updated: Lock, Count, Confirm) ---

    let isAbsenteeListLocked = true; // Default locked state

    // 1. Toggle Lock Button Logic
    const toggleAbsenteeLockBtn = document.getElementById('toggle-absentee-lock-btn');
    if (toggleAbsenteeLockBtn) {
        toggleAbsenteeLockBtn.addEventListener('click', () => {
            isAbsenteeListLocked = !isAbsenteeListLocked;

            if (isAbsenteeListLocked) {
                toggleAbsenteeLockBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span>List Locked</span>
            `;
                toggleAbsenteeLockBtn.className = "text-xs flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-200 transition shadow-sm";
            } else {
                toggleAbsenteeLockBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span>Unlocked</span>
            `;
                toggleAbsenteeLockBtn.className = "text-xs flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-100 transition shadow-sm";
            }
            renderAbsenteeList(); // Re-render to update button states
        });
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
        syncDataToCloud('ops');
    });

    function loadAbsenteeList(sessionKey) {
        const allAbsentees = JSON.parse(localStorage.getItem(ABSENTEE_LIST_KEY) || '{}');
        currentAbsenteeList = allAbsentees[sessionKey] || [];
        renderAbsenteeList();
    }

    // --- NEW: Populate QP Filter Dropdown for Absentee Tab ---
    function populateAbsenteeQpFilter(sessionKey) {
        if (!absenteeQpFilter) return;

        absenteeQpFilter.innerHTML = '<option value="all">All QP Codes (Bulk)</option>';

        if (!sessionKey) {
            absenteeQpFilter.disabled = true;
            return;
        }

        const [date, time] = sessionKey.split(' | ');
        const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
        loadQPCodes(); // Ensure map is fresh

        const uniqueQPs = new Set();
        const sessionQPCodes = qpCodeMap[sessionKey] || {};

        sessionStudents.forEach(student => {
            const strm = student.Stream || "Regular";
            const courseKey = getQpKey(student.Course, strm);
            const code = sessionQPCodes[courseKey];
            if (code) uniqueQPs.add(code);
        });

        if (uniqueQPs.size > 0) {
            const sortedQPs = Array.from(uniqueQPs).sort();
            sortedQPs.forEach(qp => {
                const opt = document.createElement('option');
                opt.value = qp;
                opt.textContent = qp;
                absenteeQpFilter.appendChild(opt);
            });
            absenteeQpFilter.disabled = false;
        } else {
            absenteeQpFilter.innerHTML = '<option value="all">No QP Codes Found</option>';
            absenteeQpFilter.disabled = true;
        }
    }

    function saveAbsenteeList(sessionKey) {
        const allAbsentees = JSON.parse(localStorage.getItem(ABSENTEE_LIST_KEY) || '{}');
        allAbsentees[sessionKey] = currentAbsenteeList;
        localStorage.setItem(ABSENTEE_LIST_KEY, JSON.stringify(allAbsentees));
    }

    // Render Absentee List (Responsive: Card on Mobile, Row on PC)
    function renderAbsenteeList() {
        getRoomCapacitiesFromStorage();
        const sessionKey = sessionSelect.value;
        const [date, time] = sessionKey.split(' | ');

        // 1. Update Count Badge
        const countBadge = document.getElementById('absentee-count-badge');
        if (countBadge) {
            countBadge.textContent = currentAbsenteeList.length;
        }

        currentAbsenteeListDiv.innerHTML = "";

        if (currentAbsenteeList.length === 0) {
            currentAbsenteeListDiv.innerHTML = `<div class="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 text-xs italic">No absentees marked for this session.</div>`;
            return;
        }

        // Allocate rooms for correct display
        const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
        const allocatedSessionData = performOriginalAllocation(sessionStudents);

        const allocatedMap = allocatedSessionData.reduce((map, s) => {
            map[s['Register Number']] = {
                room: s['Room No'],
                isScribe: s.isScribe,
                stream: s.Stream,
                name: s.Name
            };
            return map;
        }, {});

        currentAbsenteeList.forEach(regNo => {
            const roomData = allocatedMap[regNo] || { room: 'N/A', isScribe: false, stream: 'Regular', name: 'Unknown' };
            const room = roomData.room;
            const roomInfo = currentRoomConfig[room];
            const location = (roomInfo && roomInfo.location) ? `(${roomInfo.location})` : "";
            let roomDisplay = `${room} ${location}`;
            if (roomData.isScribe) roomDisplay += ' (Scribe)';

            const strm = roomData.stream || "Regular";

            const item = document.createElement('div');
            // Mobile: Column (Card), Desktop: Row
            item.className = 'group flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition mb-2 gap-3 md:gap-4';

            // 2. Determine Button State
            const isLocked = isAbsenteeListLocked;
            const btnDisabled = isLocked ? 'disabled' : '';

            const btnBase = "text-xs font-bold px-3 py-1.5 rounded border transition w-full md:w-auto text-center flex items-center justify-center gap-1";
            const btnStyle = isLocked
                ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                : "bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 cursor-pointer";

            const btnIcon = isLocked ? '' : '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
            const btnText = isLocked ? "Locked" : "Remove";

            item.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4 w-full min-w-0">
                <div class="flex items-center justify-between md:justify-start gap-2">
                    <span class="font-mono font-bold text-gray-800 text-sm bg-gray-100 px-2 py-0.5 rounded md:bg-transparent md:p-0">${regNo}</span>
                    <span class="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 tracking-wide">${strm}</span>
                </div>
                
                <div class="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-3 min-w-0">
                    <div class="text-xs text-gray-800 font-medium truncate pl-1 md:pl-0" title="${roomData.name}">
                        ${roomData.name}
                    </div>
                    <div class="text-xs text-gray-400 pl-1 md:pl-0 truncate" title="${roomDisplay}">
                         ${roomDisplay}
                    </div>
                </div>
            </div>
            
            <div class="w-full md:w-auto md:shrink-0 pt-2 md:pt-0 border-t md:border-0 border-gray-100">
                <button class="${btnBase} ${btnStyle}" ${btnDisabled}>
                    ${btnIcon} ${btnText}
                </button>
            </div>
        `;

            // 3. Attach Delete Event with Name
            if (!isLocked) {
                item.querySelector('button').onclick = () => removeAbsentee(regNo, roomData.name);
            }

            currentAbsenteeListDiv.appendChild(item);
        });
    }

    function removeAbsentee(regNo, name) {
        if (isAbsenteeListLocked) return; // Extra safety

        const confirmMsg = `Are you sure you want to remove ${name || regNo} from the Absentee List?`;

        if (confirm(confirmMsg)) {
            currentAbsenteeList = currentAbsenteeList.filter(r => r !== regNo);
            saveAbsenteeList(sessionSelect.value);
            renderAbsenteeList();
            syncDataToCloud('ops');
        }
    }

    // --- (V89) NEW QP CODE LOGIC (DIFFERENT STRATEGY) ---

    // V89: Loads the *entire* QP code map from localStorage into the global var
    function loadQPCodes() {
        qpCodeMap = JSON.parse(localStorage.getItem(QP_CODE_LIST_KEY) || '{}');
    }

    // V61: Populates the QP Code session dropdown
    // *** FIX: This is the REAL implementation of the function Python calls ***
    window.real_populate_qp_code_session_dropdown = function () {
        try {
            if (allStudentData.length === 0) {
                allStudentData = JSON.parse(jsonDataStore.innerHTML || '[]');
            }
            if (allStudentData.length === 0) {
                disable_qpcode_tab(true);
                return;
            }

            // 1. Capture Previous Selection
            const previousSelection = sessionSelectQP.value;

            // Get unique sessions
            const sessions = new Set(allStudentData.map(s => `${s.Date} | ${s.Time}`));
            allStudentSessions = Array.from(sessions).sort(compareSessionStrings);

            sessionSelectQP.innerHTML = '<option value="">-- Select a Session --</option>';

            // 2. Time-Based Default Logic
            const today = new Date();
            const todayStr = today.toLocaleDateString('en-GB').replace(/\//g, '.');
            const currentHour = today.getHours();

            let fnSession = "";
            let anSession = "";

            allStudentSessions.forEach(session => {
                sessionSelectQP.innerHTML += `<option value="${session}">${session}</option>`;

                if (session.startsWith(todayStr)) {
                    const timePart = (session.split('|')[1] || "").toUpperCase();
                    if (timePart.includes("PM") || timePart.trim().startsWith("12")) {
                        if (!anSession) anSession = session;
                    } else {
                        if (!fnSession) fnSession = session;
                    }
                }
            });

            let defaultSession = "";
            if (currentHour >= 12) {
                defaultSession = anSession || fnSession;
            } else {
                defaultSession = fnSession || anSession;
            }

            // 3. Restore Previous OR Set Default
            if (previousSelection && allStudentSessions.includes(previousSelection)) {
                sessionSelectQP.value = previousSelection;
                sessionSelectQP.dispatchEvent(new Event('change'));
            } else if (defaultSession) {
                sessionSelectQP.value = defaultSession;
                sessionSelectQP.dispatchEvent(new Event('change'));
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

    // V93: Renders the QP Code list (Regular First, then Alphabetical)
    function render_qp_code_list(sessionKey) {
        const [date, time] = sessionKey.split(' | ');
        const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);

        // 1. Get Unique Pairs of (Course + Stream)
        const uniquePairs = [];
        const seen = new Set();

        sessionStudents.forEach(s => {
            const strm = s.Stream || "Regular";
            const key = `${s.Course}|${strm}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniquePairs.push({ course: s.Course, stream: strm });
            }
        });

        // 2. Sort: Regular Stream First, then Other Streams Alphabetically, then Course Name
        uniquePairs.sort((a, b) => {
            // Force "Regular" to the top
            if (a.stream === "Regular" && b.stream !== "Regular") return -1;
            if (a.stream !== "Regular" && b.stream === "Regular") return 1;

            // If streams are different (and neither is Regular), sort streams alphabetically
            if (a.stream !== b.stream) return a.stream.localeCompare(b.stream);

            // If streams are the same, sort by Course Name
            return a.course.localeCompare(b.course);
        });

        loadQPCodes();
        const sessionCodes = qpCodeMap[sessionKey] || {};
        const htmlChunks = [];

        if (uniquePairs.length === 0) {
            qpCodeContainer.innerHTML = '<p class="text-center text-gray-500">No courses found for this session.</p>';
            saveQpCodesButton.disabled = true;
            return;
        }

        let currentStream = null;

        uniquePairs.forEach(item => {
            // Add Stream Header if it changes
            if (item.stream !== currentStream) {
                const marginTop = currentStream ? "mt-6" : "mt-0";
                htmlChunks.push(`
                <div class="${marginTop} mb-2 bg-indigo-50 p-2 font-bold text-indigo-800 border-b border-indigo-200 rounded-t-md">
                    ${item.stream} Stream
                </div>
            `);
                currentStream = item.stream;
            }

            // Generate Key
            const base64Key = getQpKey(item.course, item.stream);
            const savedCode = sessionCodes[base64Key] || "";

            // *** NEW LOCK LOGIC ***
            const disabledAttr = isQPLocked ? "disabled" : "";
            const bgClass = isQPLocked ? "bg-gray-50 text-gray-500" : "bg-white";

            htmlChunks.push(`
        <div class="flex items-center gap-3 p-2 border-b border-gray-200 hover:bg-gray-50">
            <label class="font-medium text-gray-700 w-2/3 text-sm">
                ${item.course}
            </label>
            <input type="text" 
                   class="qp-code-input block w-1/3 p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 ${bgClass}" 
                   value="${savedCode}" 
                   data-course-key="${base64Key}"
                   placeholder="QP Code"
                   ${disabledAttr}>
        </div>
       `);
        });

        qpCodeContainer.innerHTML = htmlChunks.join('');

        // Disable Save button if locked
        saveQpCodesButton.disabled = isQPLocked;
        if (isQPLocked) {
            saveQpCodesButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            saveQpCodesButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
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
           syncDataToCloud('ops'); // <--- ADD THIS
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

   // 1. Reset Student Data Only (Safe Wrapper + Cloud Wipe)
    if (resetStudentDataButton) {
        resetStudentDataButton.addEventListener('click', async () => {
            // --- SAFETY PROMPT ---
            if (confirm("🛡️ SAFETY CHECK 🛡️\n\nWould you like to download a FULL BACKUP (CSV + JSON) before clearing student data?\n\nClick OK to Backup & Proceed.\nClick Cancel to Proceed without Backup.")) {
                // Trigger Downloads
                const csvBtn = document.getElementById('master-download-csv-btn');
                const jsonBtn = document.getElementById('backup-data-button');
                
                if (csvBtn) csvBtn.click();
                await new Promise(r => setTimeout(r, 1500));
                
                if (jsonBtn) jsonBtn.click();
                await new Promise(r => setTimeout(r, 1000));
            }
            // ---------------------

            const confirmReset = confirm('🧹 CONFIRM CLEANUP 🧹\n\nAre you sure you want to reset all student data?\n\nThis will clear:\n• Main Student Database\n• Absentee Lists\n• QP Codes\n• Room Allotments\n• Scribe Assignments\n\n(Settings & College Name will be KEPT.)');
            
            if (confirmReset) {
                // 1. Clear Local Storage
                const keysToRemove = [
                    BASE_DATA_KEY, ROOM_ALLOTMENT_KEY, SCRIBE_ALLOTMENT_KEY,
                    SCRIBE_LIST_KEY, ABSENTEE_LIST_KEY, QP_CODE_LIST_KEY
                ];
                keysToRemove.forEach(k => localStorage.removeItem(k));

                // 2. Wipe Cloud Data (The Fix)
                if (currentCollegeId) {
                    try {
                        // Change button text to show activity
                        const originalText = resetStudentDataButton.innerHTML;
                        resetStudentDataButton.innerHTML = "☁️ Wiping Cloud...";
                        resetStudentDataButton.disabled = true;

                        const { db, doc, writeBatch, collection, getDocs } = window.firebase;
                        const batch = writeBatch(db);
                        const mainRef = doc(db, "colleges", currentCollegeId);

                        // A. Reset fields in the main document (Metadata)
                        batch.update(mainRef, {
                            examQPCodes: "{}",
                            examScribeAllotment: "{}",
                            examScribeList: "[]",
                            examAbsenteeList: "{}",
                            lastUpdated: new Date().toISOString()
                        });

                        // B. DELETE SUB-COLLECTIONS (Targeted Wipe)
                        // We wipe Operations (QP/Absentees), Allocation (Scribes), and Slots
                        batch.delete(doc(db, "colleges", currentCollegeId, "system_data", "operations"));
                        batch.delete(doc(db, "colleges", currentCollegeId, "system_data", "allocation"));
                        batch.delete(doc(db, "colleges", currentCollegeId, "system_data", "slots"));

                        // C. Delete all data chunks (Where Student Data & Allotment live)
                        const dataColRef = collection(db, "colleges", currentCollegeId, "data");
                        const chunkSnaps = await getDocs(dataColRef);
                        chunkSnaps.forEach(chunk => batch.delete(chunk.ref));

                        await batch.commit();
                        console.log("Cloud data wiped successfully.");

                    } catch (e) {
                        console.error("Cloud Wipe Error:", e);
                        alert("⚠️ Warning: Local data was cleared, but Cloud wipe failed.\nError: " + e.message);
                    }
                }
                
                alert('✅ Cleanup Successful!\nAll student data and allotments have been cleared from Browser and Cloud.\n\nThe app will now reload.');
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
               reader.onload = async (event) => { //
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

                    alert('Restore successful! Syncing to Cloud...');
                    if (typeof syncDataToCloud === 'function') {
                    await syncDataToCloud('settings');
                    await syncDataToCloud('ops');
                    await syncDataToCloud('allocation');
                    await syncDataToCloud('staff');
                    await syncDataToCloud('slots');
                    await syncDataToCloud('heavy');
                    }
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


    // ==========================================
    // ☁️ ADVANCED SMART SYNC (Auto-Poll & Cache)
    // ==========================================

    let cachedCloudHandle = null; // Stores folder access for this session
    let cloudPollInterval = null; // Stores the timer ID

    const smartSyncBtn = document.getElementById('smart-sync-btn');

    if (smartSyncBtn) {
        smartSyncBtn.addEventListener('click', async () => {
            // 1. Browser Support Check
            if (!('showDirectoryPicker' in window)) {
                alert("Browser not supported. Please use Chrome, Edge, or Opera.");
                return;
            }

            try {
                let rootHandle;

                // 2. GET FOLDER HANDLE (Cached or New)
                if (cachedCloudHandle) {
                    // A. Use Cached Handle
                    // We must verify we still have permission (browsers sometimes revoke it)
                    const perm = await verifyPermission(cachedCloudHandle, true);
                    if (!perm) return; // User denied re-access
                    rootHandle = cachedCloudHandle;
                } else {
                    // B. Open New Picker
                    smartSyncBtn.textContent = "Connecting...";
                    rootHandle = await window.showDirectoryPicker({
                        id: 'examflow_backup_location',
                        mode: 'readwrite',
                        startIn: 'documents'
                    });

                    // Cache it for future clicks and polling
                    cachedCloudHandle = rootHandle;

                    // Start Auto-Polling (Checks every 60 seconds)
                    if (!cloudPollInterval) {
                        startCloudPolling(rootHandle);
                    }
                }

                // 3. RUN SYNC LOGIC
                await performSyncCheck(rootHandle, true); // true = interactive mode (show prompts)

            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error("Sync Error:", err);
                    alert("Sync Error: " + err.message);
                }
                smartSyncBtn.innerHTML = getDefaultButtonContent();
                smartSyncBtn.className = "w-full bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-3 rounded-md text-sm font-bold hover:bg-indigo-100 flex items-center justify-center gap-2 transition shadow-sm mb-2";
            }
        });
    }

    // --- CORE SYNC LOGIC ---
    async function performSyncCheck(rootHandle, isInteractive) {
        try {
            // 1. Get/Create Subfolder
            const projectFolderHandle = await rootHandle.getDirectoryHandle('ExamFlow_Backups', { create: true });

            // 2. Find Latest Cloud File
            let latestFileHandle = null;
            let cloudTime = 0;

            for await (const entry of projectFolderHandle.values()) {
                if (entry.kind === 'file' && entry.name.endsWith('.json') && entry.name.includes('ExamFlow_Backup')) {
                    const file = await entry.getFile();
                    if (file.lastModified > cloudTime) {
                        cloudTime = file.lastModified;
                        latestFileHandle = entry;
                    }
                }
            }

            // 3. Get Local Timestamp
            const localStr = localStorage.getItem('lastUpdated');
            const localTime = localStr ? new Date(localStr).getTime() : 0;

            // 4. Determine State
            const dateOpt = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const cloudDateStr = cloudTime > 0 ? new Date(cloudTime).toLocaleString('en-GB', dateOpt) : "None";

            // UI UPDATES BASED ON STATE
            if (cloudTime > localTime) {
                // STATE: Update Available
                updateButtonState("restore", cloudDateStr);

                if (isInteractive) {
                    const msg = `☁️ NEW UPDATE FOUND!\n\n` +
                        `Cloud File: ${cloudDateStr}\n` +
                        `Your Data:  ${localTime > 0 ? new Date(localTime).toLocaleString('en-GB', dateOpt) : "Empty"}\n\n` +
                        `Do you want to RESTORE this data?`;
                    if (confirm(msg)) {
                        smartSyncBtn.textContent = "Restoring...";
                        await performSmartRestore(latestFileHandle);
                    }
                }
            }
            else if (localTime > cloudTime) {
                // STATE: Unsaved Changes
                updateButtonState("backup");

                if (isInteractive) {
                    const msg = `💾 UNSAVED LOCAL CHANGES\n\n` +
                        `Your data is newer than the backup.\n` +
                        `Do you want to UPDATE the cloud backup?`;
                    if (confirm(msg)) {
                        smartSyncBtn.textContent = "Backing Up...";
                        await performSmartBackup(projectFolderHandle);
                    }
                }
            }
            else {
                // STATE: Synced
                updateButtonState("synced");
                if (isInteractive) {
                    if (confirm(`✅ System is already synced.\n\nForce create a new backup?`)) {
                        smartSyncBtn.textContent = "Backing Up...";
                        await performSmartBackup(projectFolderHandle);
                    }
                }
            }

        } catch (e) {
            console.error("Check Failed", e);
        }
    }

    // --- BACKGROUND POLLING ---
    function startCloudPolling(handle) {
        console.log("Started Cloud Polling...");

        // Run immediately
        performSyncCheck(handle, false); // false = silent mode (no alerts, just button update)

        // Run every 30 seconds
        cloudPollInterval = setInterval(async () => {
            // Verify permission silently
            if ((await handle.queryPermission({ mode: 'read' })) === 'granted') {
                performSyncCheck(handle, false);
            }
        }, 30000);
    }

    // --- UI HELPERS ---
    function updateButtonState(state, extraInfo) {
        if (!smartSyncBtn) return;

        if (state === "restore") {
            // RED ALERT: Incoming Data
            smartSyncBtn.className = "w-full bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm font-bold hover:bg-red-200 flex items-center justify-center gap-2 transition shadow-md mb-2 animate-pulse";
            smartSyncBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            📢 New Update Available! (${extraInfo})
        `;
        } else if (state === "backup") {
            // BLUE ALERT: Unsaved Work
            smartSyncBtn.className = "w-full bg-blue-50 border border-blue-300 text-blue-800 px-4 py-3 rounded-md text-sm font-bold hover:bg-blue-100 flex items-center justify-center gap-2 transition shadow-sm mb-2";
            smartSyncBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            💾 Save Changes to Cloud
        `;
        } else {
            // GREEN: All Good
            smartSyncBtn.className = "w-full bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm font-bold hover:bg-green-100 flex items-center justify-center gap-2 transition shadow-sm mb-2";
            smartSyncBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ✅ System Synced
        `;
        }
    }

    function getDefaultButtonContent() {
        return `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        ☁️ Smart Sync (Backup / Restore)
    `;
    }

    // --- PERMISSION HELPER ---
    async function verifyPermission(fileHandle, withWrite) {
        const options = {};
        if (withWrite) {
            options.mode = 'readwrite';
        }
        if ((await fileHandle.queryPermission(options)) === 'granted') {
            return true;
        }
        if ((await fileHandle.requestPermission(options)) === 'granted') {
            return true;
        }
        return false;
    }

    // --- ACTION HELPERS ---
    async function performSmartBackup(folderHandle) {
        const backupData = {};
        const ALL_DATA_KEYS = [
            'examRoomConfig', 'examStreamsConfig', 'examCollegeName',
            'examAbsenteeList', 'examQPCodes', 'examBaseData',
            'examRoomAllotment', 'examScribeList', 'examScribeAllotment',
            'examRulesConfig', 'examInvigilatorMapping', 'examInvigilationSlots', 'examStaffData'
        ];

        const now = new Date().toISOString();
        localStorage.setItem('lastUpdated', now);

        ALL_DATA_KEYS.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) backupData[key] = data;
        });
        backupData['lastUpdated'] = now;

        const jsonString = JSON.stringify(backupData, null, 2);
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `ExamFlow_Backup_${dateStr}.json`;

        const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(jsonString);
        await writable.close();

        // Update UI immediately
        performSyncCheck(cachedCloudHandle, false);
        alert("✅ Backup Complete!");
    }

    async function performSmartRestore(fileHandle) {
        const file = await fileHandle.getFile();
        const text = await file.text();
        const restoredData = JSON.parse(text);

        for (const key in restoredData) {
            localStorage.setItem(key, restoredData[key]);
        }

        alert(`✅ Restored from ${file.name}.\nPage will reload.`);
        window.location.reload();
    }



    // ==========================================
    // 💍 MASTER CSV DOWNLOAD (ONE RING TO RULE THEM ALL)
    // ==========================================
    const masterDownloadBtn = document.getElementById('master-download-csv-btn');

    if (masterDownloadBtn) {
        masterDownloadBtn.addEventListener('click', async () => {
            if (!allStudentData || allStudentData.length === 0) {
                alert("No data available to export.");
                return;
            }

            masterDownloadBtn.textContent = "Gathering Data...";
            masterDownloadBtn.disabled = true;

            // Allow UI to update
            await new Promise(r => setTimeout(r, 50));

            try {
                // 1. Load ALL Context Data
                const allAbsentees = JSON.parse(localStorage.getItem(ABSENTEE_LIST_KEY) || '{}');
                const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
                const scribeListRaw = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
                const scribeRegNos = new Set(scribeListRaw.map(s => s.regNo));

                // Reload Configs to be safe
                loadQPCodes(); // Refreshes qpCodeMap
                currentExamNames = JSON.parse(localStorage.getItem(EXAM_NAMES_KEY) || '{}');
                getRoomCapacitiesFromStorage(); // Refreshes currentRoomConfig

                // 2. Group Students by Session to run Allocation Logic
                const sessions = {};
                allStudentData.forEach(s => {
                    const key = `${s.Date} | ${s.Time}`;
                    if (!sessions[key]) sessions[key] = [];
                    sessions[key].push(s);
                });

                const masterRows = [];

                // 3. Process Each Session
                for (const [sessionKey, students] of Object.entries(sessions)) {
                    const [date, time] = sessionKey.split(' | ');

                    // Run allocation logic to get Seats & Rooms
                    // (This ensures we get the exact Seat No even if it wasn't saved in basic data)
                    const allocatedStudents = performOriginalAllocation(students);

                    // Helper: Absentee Set for this session
                    const sessionAbsentees = new Set(allAbsentees[sessionKey] || []);

                    // Helper: Scribe Rooms for this session
                    const sessionScribeRooms = allScribeAllotments[sessionKey] || {};

                    // Helper: QP Codes for this session
                    const sessionQPCodes = qpCodeMap[sessionKey] || {};

                    for (const s of allocatedStudents) {
                        // A. Basic Info
                        const regNo = s['Register Number'];
                        const stream = s.Stream || "Regular";
                        const course = s.Course;

                        // B. Exam Name
                        const examName = getExamName(date, time, stream);

                        // C. QP Code
                        const courseKey = getQpKey(course, stream);
                        const qpCode = sessionQPCodes[courseKey] || "N/A";

                        // D. Status (Present/Absent)
                        const status = sessionAbsentees.has(regNo) ? "ABSENT" : "PRESENT";

                        // E. Scribe Info
                        const isScribe = scribeRegNos.has(regNo) ? "YES" : "NO";
                        let scribeRoom = "N/A";
                        if (isScribe === "YES") {
                            scribeRoom = sessionScribeRooms[regNo] || "Not Allotted";
                        }

                        // F. Room & Location
                        let roomNo = s['Room No'];
                        let seatNo = s.seatNumber;

                        const roomInfo = currentRoomConfig[roomNo] || {};
                        const location = roomInfo.location || "";

                        // G. Location for Scribe Room (if applicable)
                        let scribeLocation = "";
                        if (scribeRoom !== "N/A" && scribeRoom !== "Not Allotted") {
                            const sInfo = currentRoomConfig[scribeRoom] || {};
                            scribeLocation = sInfo.location || "";
                        }

                        masterRows.push({
                            "Exam Name": examName,
                            "Date": date,
                            "Time": time,
                            "Stream": stream,
                            "Course": course,
                            "QP Code": qpCode,
                            "Register Number": regNo,
                            "Name": s.Name,
                            "Status": status,
                            "Allotted Hall": roomNo,
                            "Hall Location": location,
                            "Seat No": seatNo,
                            "Scribe Required": isScribe,
                            "Scribe Room": scribeRoom,
                            "Scribe Location": scribeLocation
                        });
                    }
                }

                // 4. Sort Master List (Date > Time > RegNo)
                masterRows.sort((a, b) => {
                    const d1 = a.Date.split('.').reverse().join('');
                    const d2 = b.Date.split('.').reverse().join('');
                    if (d1 !== d2) return d1.localeCompare(d2);
                    if (a.Time !== b.Time) return a.Time.localeCompare(b.Time);
                    return a["Register Number"].localeCompare(b["Register Number"]);
                });

                // 5. Generate CSV Content
                const headers = [
                    "Exam Name", "Date", "Time", "Stream", "Course", "QP Code",
                    "Register Number", "Name", "Status",
                    "Allotted Hall", "Hall Location", "Seat No",
                    "Scribe Required", "Scribe Room", "Scribe Location"
                ];

                let csvContent = headers.join(",") + "\n";

                masterRows.forEach(row => {
                    const rowString = headers.map(header => {
                        let val = row[header] ? row[header].toString() : "";
                        val = val.replace(/"/g, '""'); // Escape quotes
                        if (val.includes(',') || val.includes('\n') || val.includes('"')) {
                            val = `"${val}"`;
                        }
                        return val;
                    }).join(",");
                    csvContent += rowString + "\n";
                });

                // 6. Download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `Master_Exam_Data_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

            } catch (e) {
                console.error("Master CSV Error:", e);
                alert("Failed to generate Master CSV: " + e.message);
            } finally {
                masterDownloadBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 12.75l-3-3m0 0 3-3m-3 3h7.5" />
                    </svg>
                    Download MASTER CSV (The One Ring 💍)
                `;
                masterDownloadBtn.disabled = false;
            }
        });
    }


    // --- ROOM ALLOTMENT FUNCTIONALITY ---

    // *** FIX: This is the REAL implementation of the function Python calls ***
    window.real_populate_room_allotment_session_dropdown = function () {
        try {
            if (allStudentData.length === 0) {
                allStudentData = JSON.parse(jsonDataStore.innerHTML || '[]');
            }
            if (allStudentData.length === 0) {
                disable_room_allotment_tab(true);
                return;
            }

            // 1. Capture Previous Selection
            const previousSelection = allotmentSessionSelect.value;

            // Get unique sessions
            const sessions = new Set(allStudentData.map(s => `${s.Date} | ${s.Time}`));
            allStudentSessions = Array.from(sessions).sort(compareSessionStrings);

            allotmentSessionSelect.innerHTML = '<option value="">-- Select a Session --</option>';

            // 2. Time-Based Default Logic
            const today = new Date();
            const todayStr = today.toLocaleDateString('en-GB').replace(/\//g, '.'); // DD.MM.YYYY
            const currentHour = today.getHours(); // 0-23

            let fnSession = "";
            let anSession = "";

            allStudentSessions.forEach(session => {
                allotmentSessionSelect.innerHTML += `<option value="${session}">${session}</option>`;

                if (session.startsWith(todayStr)) {
                    const timePart = (session.split('|')[1] || "").toUpperCase();
                    // Identify AN (PM or 12:xx) vs FN
                    if (timePart.includes("PM") || timePart.trim().startsWith("12")) {
                        if (!anSession) anSession = session;
                    } else {
                        if (!fnSession) fnSession = session;
                    }
                }
            });

            // Determine Default based on Time
            let defaultSession = "";
            if (currentHour >= 12) {
                defaultSession = anSession || fnSession; // After 12pm? Prefer AN
            } else {
                defaultSession = fnSession || anSession; // Before 12pm? Prefer FN
            }

            // 3. Restore Previous OR Set Default
            if (previousSelection && allStudentSessions.includes(previousSelection)) {
                allotmentSessionSelect.value = previousSelection;
                allotmentSessionSelect.dispatchEvent(new Event('change'));
            } else if (defaultSession) {
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

    // Update display (Auto-Save Version + Button Disable Logic)
    function updateAllotmentDisplay() {
        const [date, time] = currentSessionKey.split(' | ');
        const sessionStudentRecords = allStudentData.filter(s => s.Date === date && s.Time === time);

        const container = document.getElementById('allotment-student-count-section');
        container.innerHTML = '';
        container.className = "mb-6 grid grid-cols-1 md:grid-cols-2 gap-4";
        container.classList.remove('hidden');

        // 1. Calculate Stats
        const streamStats = {};
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
                <div class="bg-white/60 rounded p-2 flex justify-between items-center text-xs border border-gray-200/50 mt-2">
                    <span class="text-gray-600 font-bold uppercase tracking-wide">Rooms Used:</span>
                    <div class="flex items-baseline gap-1">
                        <span class="text-lg font-black text-indigo-700">${stats.roomsUsed}</span>
                        <span class="text-gray-400 font-medium">/</span>
                        <span class="text-gray-600 font-medium">~${estimatedRoomsNeeded} needed</span>
                    </div>
                </div>
            </div>
        `;
            container.insertAdjacentHTML('beforeend', cardHtml);
        });

        // 3. Handle Add Room Button State
        const totalRemaining = Object.values(streamStats).reduce((sum, s) => sum + (s.total - s.allotted), 0);
        const addSection = document.getElementById('add-room-section');

        if (addSection) {
            addSection.classList.remove('hidden');
            const addBtn = document.getElementById('add-room-allotment-button');

            if (addBtn) {
                if (totalRemaining <= 0) {
                    // Disable Button
                    addBtn.disabled = true;
                    addBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
                    addBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
                    addBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    All Students Allotted
                `;
                } else {
                    // Enable Button
                    addBtn.disabled = false;
                    addBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
                    addBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
                    addBtn.textContent = "+ Add Room";
                }
            }
        }

        renderAllottedRooms();

        // Update Save Button to indicate Auto-Save
        const saveSection = document.getElementById('save-allotment-section');
        const allottedSection = document.getElementById('allotted-rooms-section');

        if (currentSessionAllotment.length > 0) {
            allottedSection.classList.remove('hidden');
            saveSection.classList.remove('hidden');

            // Indicate Auto-Save Status
            const saveBtn = document.getElementById('save-room-allotment-button');
            if (saveBtn) {
                saveBtn.innerHTML = `
                <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <span>Auto-Saved</span>
            `;
                saveBtn.classList.add('bg-green-50', 'text-green-700', 'border-green-200', 'cursor-default');
                saveBtn.classList.remove('bg-indigo-600', 'text-white', 'hover:bg-indigo-700');
                saveBtn.disabled = true;
            }
        } else {
            allottedSection.classList.add('hidden');
            saveSection.classList.add('hidden');
        }
    }

    // Render the list of allotted rooms (WITH CAPACITY TAGS & LOCK)
    function renderAllottedRooms() {
        allottedRoomsList.innerHTML = '';
        const roomSerialMap = getRoomSerialMap(currentSessionKey);

        if (currentSessionAllotment.length === 0) {
            allottedRoomsList.innerHTML = '<p class="text-gray-500 text-sm">No rooms allotted yet.</p>';
            return;
        }

        currentSessionAllotment.sort((a, b) => {
            const s1 = a.stream || "Regular";
            const s2 = b.stream || "Regular";
            const idx1 = currentStreamConfig.indexOf(s1);
            const idx2 = currentStreamConfig.indexOf(s2);
            if (idx1 !== idx2) return idx1 - idx2;

            const numA = parseInt(a.roomName.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.roomName.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });

        currentSessionAllotment.forEach((room, index) => {
            const roomDiv = document.createElement('div');
            roomDiv.className = 'bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow';

            const roomInfo = currentRoomConfig[room.roomName];
            const location = (roomInfo && roomInfo.location) ? ` <span class="text-gray-400 text-xs font-normal">(${roomInfo.location})</span>` : '';
            const serialNo = roomSerialMap[room.roomName] || '-';

            const streamName = room.stream || "Regular";
            let badgeColor = "bg-blue-100 text-blue-800";
            if (streamName !== "Regular") badgeColor = "bg-purple-100 text-purple-800";

            let capBadge = "";
            const capNum = parseInt(room.capacity) || 30;
            if (capNum > 30) {
                capBadge = `<span class="ml-1 text-[9px] font-bold text-red-700 bg-red-50 px-1 rounded border border-red-200">▲${capNum}</span>`;
            } else if (capNum < 30) {
                capBadge = `<span class="ml-1 text-[9px] font-bold text-blue-700 bg-blue-50 px-1 rounded border border-blue-200">▼${capNum}</span>`;
            }

            // --- LOCK LOGIC ---
            const btnDisabled = isAllotmentLocked ? 'disabled' : '';
            const btnClass = isAllotmentLocked
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-red-500 hover:text-red-700 cursor-pointer';
            const onclickAction = isAllotmentLocked ? '' : `onclick="deleteRoom(${index})"`;

            roomDiv.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="flex flex-col items-center justify-center w-10 h-10 bg-gray-100 rounded text-gray-600 font-bold text-sm">
                        <span>#${serialNo}</span>
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800 text-base">
                            ${room.roomName} ${location}
                        </h4>
                        <div class="flex gap-2 mt-1 items-center">
                            <span class="text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}">
                                ${streamName}
                            </span>
                            <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center">
                                ${room.students.length} / ${room.capacity} Students ${capBadge}
                            </span>
                        </div>
                    </div>
                </div>
                
                <button class="${btnClass} p-2" ${onclickAction} ${btnDisabled} title="${isAllotmentLocked ? 'List Locked' : 'Remove Room'}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </button>
            </div>
        `;

            allottedRoomsList.appendChild(roomDiv);
        });
    }

    // Delete a room from allotment (Updated: Cleans up Invigilator & Scribe mappings)
    window.deleteRoom = async function (index) {
        if (!confirm('Are you sure you want to remove this room allotment?')) return;

        const roomData = currentSessionAllotment[index];
        const roomName = roomData.roomName; // Capture room name before deletion

        // 1. Cleanup Scribes (Existing)
        if (roomData && roomData.students) {
            roomData.students.forEach(s => {
                const reg = (typeof s === 'object') ? s['Register Number'] : s;
                if (currentScribeAllotment[reg]) {
                    delete currentScribeAllotment[reg];
                }
            });
        }

        // 2. Cleanup Invigilator Assignment (NEW FIX)
        // We must remove the invigilator mapping for this room so they become "Free" again
        const allInvigMappings = JSON.parse(localStorage.getItem(INVIG_MAPPING_KEY) || '{}');

        if (allInvigMappings[currentSessionKey] && allInvigMappings[currentSessionKey][roomName]) {
            // Remove the assignment from storage
            delete allInvigMappings[currentSessionKey][roomName];
            localStorage.setItem(INVIG_MAPPING_KEY, JSON.stringify(allInvigMappings));

            // Update the global variable if it's currently loaded
            if (currentInvigMapping) {
                delete currentInvigMapping[roomName];
            }
        }

        // --- AUTO SAVE & SYNC ---
        // 1. Save Room Allotment (Updates student seating and scribe cleanup)
        saveRoomAllotment(); // Update Local Storage (Room & Scribe)

        if (typeof syncDataToCloud === 'function') {
    // 2. Sync 'heavy' to update the Room Allotment (Student Data Chunks)
            await syncDataToCloud('heavy'); 
    
    // 3. Sync 'slots' to update the Invigilator Mapping (The NEW FIX)
            await syncDataToCloud('slots'); 
        }
// ------------------------
        // ------------------------

        updateAllotmentDisplay();

        // Refresh Invig Panel if it's visible
        if (typeof renderInvigilationPanel === 'function') {
            renderInvigilationPanel();
        }
    };

    // Show room selection modal (Updated: Excludes Scribe Rooms)
    function showRoomSelectionModal() {
        getRoomCapacitiesFromStorage();
        roomSelectionList.innerHTML = '';

        // Clear previous search
        const searchInput = document.getElementById('room-selection-search');
        if (searchInput) searchInput.value = "";

        // 1. Smart Default Stream Logic (Existing)
        const [date, time] = currentSessionKey.split(' | ');
        const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);

        const stats = {};
        currentStreamConfig.forEach(s => stats[s] = { needed: 0, allotted: 0 });
        if (!stats["Regular"]) stats["Regular"] = { needed: 0, allotted: 0 };

        sessionStudents.forEach(s => {
            const strm = s.Stream || "Regular";
            if (!stats[strm]) stats[strm] = { needed: 0, allotted: 0 };
            stats[strm].needed++;
        });

        currentSessionAllotment.forEach(room => {
            const roomStream = room.stream || "Regular";
            if (!stats[roomStream]) stats[roomStream] = { needed: 0, allotted: 0 };
            stats[roomStream].allotted += room.students.length;
        });

        let suggestedStream = currentStreamConfig[0];
        for (const stream of currentStreamConfig) {
            const s = stats[stream];
            if (s && (s.needed - s.allotted) > 0) {
                suggestedStream = stream;
                break;
            }
        }

        const streamSelectHtml = `
        <div class="mb-4 bg-gray-50 p-3 rounded border border-gray-200">
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Fill Room with Stream:</label>
            <select id="allotment-stream-select" class="block w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white">
                ${currentStreamConfig.map(s => `<option value="${s}" ${s === suggestedStream ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
        </div>
    `;
        roomSelectionList.insertAdjacentHTML('beforeend', streamSelectHtml);

        // 2. List Rooms (Updated Logic)

        // A. Regular Allotted Rooms
        const allottedRoomNames = currentSessionAllotment.map(r => r.roomName);

        // B. Scribe Allotted Rooms (NEW CHECK)
        // We fetch the scribe data to ensure we don't double-book a room used by a scribe
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        const sessionScribeMap = allScribeAllotments[currentSessionKey] || {};
        const scribeRoomNames = Object.values(sessionScribeMap); // Array of rooms used by scribes

        const sortedRoomNames = Object.keys(currentRoomConfig).sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });

        sortedRoomNames.forEach(roomName => {
            const room = currentRoomConfig[roomName];
            const location = room.location ? ` (${room.location})` : '';

            // Check Status: Is it used by Regular OR Scribe?
            const isRegularAllotted = allottedRoomNames.includes(roomName);
            const isScribeAllotted = scribeRoomNames.includes(roomName);
            const isUnavailable = isRegularAllotted || isScribeAllotted;

            // Capacity Badge
            let capBadge = "";
            const capNum = parseInt(room.capacity) || 30;
            if (capNum > 30) {
                capBadge = `<span class="ml-2 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">▲ ${capNum}</span>`;
            } else if (capNum < 30) {
                capBadge = `<span class="ml-2 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">▼ ${capNum}</span>`;
            }

            const roomOption = document.createElement('div');
            roomOption.className = `p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-blue-50 mb-2 ${isUnavailable ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`;

            // Status Message Logic
            let statusMsg = "";
            if (isRegularAllotted) {
                statusMsg = '<div class="text-xs text-red-600 mt-1 font-bold">Already Allotted</div>';
            } else if (isScribeAllotted) {
                statusMsg = '<div class="text-xs text-orange-600 mt-1 font-bold">Occupied by Scribe</div>';
            }

            roomOption.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="font-medium text-gray-800">${roomName}${location}</div>
                ${capBadge}
            </div>
            <div class="text-sm text-gray-600 mt-1">Standard Capacity: ${room.capacity}</div>
            ${statusMsg}
        `;

            if (!isUnavailable) {
                roomOption.onclick = () => {
                    const selectedStream = document.getElementById('allotment-stream-select').value;
                    selectRoomForAllotment(roomName, room.capacity, selectedStream);
                };
            }

            roomSelectionList.appendChild(roomOption);
        });

        roomSelectionModal.classList.remove('hidden');
    }

    // Select a room and allot students (Auto-Save & Sync enabled)
    async function selectRoomForAllotment(roomName, capacity, targetStream) {
        const [date, time] = currentSessionKey.split(' | ');

        const sessionStudentRecords = allStudentData.filter(s => s.Date === date && s.Time === time);

        const allottedRegNos = new Set();
        currentSessionAllotment.forEach(room => {
            room.students.forEach(s => {
                const reg = (typeof s === 'object') ? s['Register Number'] : s;
                allottedRegNos.add(reg);
            });
        });

        const candidates = [];

        // Sort: Prefix Descending (Z->Y), Number Ascending (001->002)
        sessionStudentRecords.sort((a, b) => {
            if (a.Course !== b.Course) return a.Course.localeCompare(b.Course);
            const regA = a['Register Number'] ? a['Register Number'].toString().trim() : "";
            const regB = b['Register Number'] ? b['Register Number'].toString().trim() : "";
            const matchA = regA.match(/^([A-Z]+)(\d+)$/i);
            const matchB = regB.match(/^([A-Z]+)(\d+)$/i);
            if (matchA && matchB) {
                const prefixA = matchA[1].toUpperCase();
                const numA = parseInt(matchA[2], 10);
                const prefixB = matchB[1].toUpperCase();
                const numB = parseInt(matchB[2], 10);
                if (prefixA !== prefixB) return prefixB.localeCompare(prefixA);
                return numA - numB;
            }
            return regA.localeCompare(regB);
        });

        for (const student of sessionStudentRecords) {
            const regNo = student['Register Number'];
            const studentStream = student.Stream || "Regular";
            if (!allottedRegNos.has(regNo) && studentStream === targetStream) {
                candidates.push(student);
            }
        }

        const newStudents = candidates.slice(0, capacity);

        if (newStudents.length === 0) {
            alert(`No unallotted students found for stream: ${targetStream}`);
            return;
        }

        currentSessionAllotment.push({
            roomName: roomName,
            capacity: capacity,
            students: newStudents,
            stream: targetStream
        });

        // Update Scribe Map
        newStudents.forEach(s => {
            const reg = s['Register Number'];
            if (globalScribeList.some(g => g.regNo === reg)) {
                currentScribeAllotment[reg] = roomName;
            }
        });

        // --- AUTO SAVE & SYNC ---
        saveRoomAllotment(); // Save to Local Storage (Updates Serial #)

        if (typeof syncDataToCloud === 'function') {
    // 1. Sync Room Allotment (HEAVY bucket)
        await syncDataToCloud('heavy'); 
    
    // 2. Sync Scribe Allotment (ALLOCATION bucket)
        await syncDataToCloud('allocation'); 
        }
        // ------------------------

        roomSelectionModal.classList.add('hidden');
        updateAllotmentDisplay(); // Now reads the saved data and shows Serial #
    }


    // Event Listeners for Room Allotment
    if (allotmentSessionSelect) {
        allotmentSessionSelect.addEventListener('change', () => {
            const sessionKey = allotmentSessionSelect.value;

            // 1. Reset Dirty Flag (New session loaded fresh)
            hasUnsavedAllotment = false;

            populateAbsenteeQpFilter(sessionKey);

            if (sessionKey) {
                loadRoomAllotment(sessionKey);
                loadScribeAllotment(sessionKey);
                renderInvigilationPanel(); // <--- ADD THIS LINE
            } else {
                // Hide all sections
                allotmentStudentCountSection.classList.add('hidden');
                addRoomSection.classList.add('hidden');
                allottedRoomsSection.classList.add('hidden');
                saveAllotmentSection.classList.add('hidden');
                scribeAllotmentListSection.classList.add('hidden');
                document.getElementById('invigilator-assignment-section').classList.add('hidden'); // <--- ADD THIS
            }
        });
    }

    addRoomAllotmentButton.addEventListener('click', () => {
        showRoomSelectionModal();
    });

    closeRoomModal.addEventListener('click', () => {
        roomSelectionModal.classList.add('hidden');
    });

    // --- NEW: Room Search Filter Listener ---
    const roomSearchInput = document.getElementById('room-selection-search');
    if (roomSearchInput) {
        roomSearchInput.addEventListener('input', function () {
            const query = this.value.toLowerCase();
            const items = roomSelectionList.children;

            Array.from(items).forEach(item => {
                // Prevent hiding the "Stream Selection" dropdown (it has a <select> inside)
                if (item.querySelector('select')) return;

                // Filter based on text content (Room Name + Location)
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    }

    if (saveRoomAllotmentButton) {
        saveRoomAllotmentButton.addEventListener('click', () => {
            if (!currentSessionKey) return;

            // 1. Update Global Allotment Objects
            const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
            allAllotments[currentSessionKey] = currentSessionAllotment;

            const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
            allScribeAllotments[currentSessionKey] = currentScribeAllotment;

            // 2. Save to Local Storage
            localStorage.setItem(ROOM_ALLOTMENT_KEY, JSON.stringify(allAllotments));
            localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(allScribeAllotments));

            // 3. Sync to Cloud
            if (currentCollegeId && typeof syncDataToCloud === 'function') {
                syncDataToCloud('heavy');
            }

            // 4. Reset Dirty Flag
            hasUnsavedAllotment = false;

            // 5. UI Feedback
            roomAllotmentStatus.textContent = 'Allotment Saved Successfully!';
            setTimeout(() => { roomAllotmentStatus.textContent = ''; }, 2000);

            // 6. Refresh Display (Button changes to "✅ Saved")
            updateAllotmentDisplay();
        });
    }

    // --- END ROOM ALLOTMENT FUNCTIONALITY ---

    // --- NEW: QP Lock Toggle Listener ---
    const toggleQPLockBtn = document.getElementById('toggle-qp-lock-btn');
    if (toggleQPLockBtn) {
        toggleQPLockBtn.addEventListener('click', () => {
            isQPLocked = !isQPLocked;

            // Update Button UI
            if (isQPLocked) {
                toggleQPLockBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg><span>Codes Locked</span>`;
                toggleQPLockBtn.className = "text-xs flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-200 transition shadow-sm shrink-0 ml-2";
            } else {
                toggleQPLockBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg><span>Unlocked</span>`;
                toggleQPLockBtn.className = "text-xs flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-100 transition shadow-sm shrink-0 ml-2";
            }

            // Re-render list to apply disabled state to inputs
            if (sessionSelectQP.value) {
                render_qp_code_list(sessionSelectQP.value);
            }
        });
    }

    // --- ALLOTMENT LIST LOCK TOGGLE ---
    const toggleAllotmentLockBtn = document.getElementById('toggle-allotment-lock-btn');
    if (toggleAllotmentLockBtn) {
        toggleAllotmentLockBtn.addEventListener('click', () => {
            isAllotmentLocked = !isAllotmentLocked;

            if (isAllotmentLocked) {
                toggleAllotmentLockBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25 2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                <span>List Locked</span>
            `;
                toggleAllotmentLockBtn.className = "text-xs flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-200 transition shadow-sm";
            } else {
                toggleAllotmentLockBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                <span>Unlocked</span>
            `;
                toggleAllotmentLockBtn.className = "text-xs flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-100 transition shadow-sm";
            }
            renderAllottedRooms(); // Re-render to update buttons
        });
    }
    // *** NEW: SCRIBE FUNCTIONALITY ***

    // *** FIX: This is the REAL implementation of the function Python calls ***
    window.real_loadGlobalScribeList = function () {
        globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
        renderGlobalScribeList();
    }
    // *** SCRIBE FUNCTIONALITY WITH SAFETY LOCK ***

    let isScribeListLocked = true; // Default state: Locked

    // 1. Handle Lock Button Click
    const toggleScribeLockBtn = document.getElementById('toggle-scribe-lock-btn');
    if (toggleScribeLockBtn) {
        toggleScribeLockBtn.addEventListener('click', () => {
            isScribeListLocked = !isScribeListLocked;

            if (isScribeListLocked) {
                // Set to Locked UI
                toggleScribeLockBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span>List Locked</span>
            `;
                toggleScribeLockBtn.className = "text-xs flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-200 transition shadow-sm";
            } else {
                // Set to Unlocked UI
                toggleScribeLockBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span>Unlocked</span>
            `;
                toggleScribeLockBtn.className = "text-xs flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-100 transition shadow-sm";
            }

            renderGlobalScribeList(); // Re-render list to enable/disable buttons
        });
    }

    // *** FIX: This is the REAL implementation of the function Python calls ***
    window.real_loadGlobalScribeList = function () {
        globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
        renderGlobalScribeList();
    }

    // --- SCRIBE PAGINATION VARIABLES ---
    let currentScribePage = 1;
    const SCRIBES_PER_PAGE = 10;

    // 2. Render the global list (Paginated)
    function renderGlobalScribeList() {
        if (!currentScribeListDiv) return;
        currentScribeListDiv.innerHTML = "";

        // Elements for pagination
        const paginationControls = document.getElementById('scribe-pagination-controls');
        const pageInfo = document.getElementById('scribe-page-info');
        const prevBtn = document.getElementById('scribe-prev-page');
        const nextBtn = document.getElementById('scribe-next-page');

        if (globalScribeList.length === 0) {
            currentScribeListDiv.innerHTML = `<div class="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 text-xs italic">No scribes added yet.</div>`;
            if (paginationControls) paginationControls.classList.add('hidden');
            return;
        }

        // --- PAGINATION LOGIC ---
        const totalPages = Math.ceil(globalScribeList.length / SCRIBES_PER_PAGE);

        // Safety check: if we deleted items and current page is now empty, go back
        if (currentScribePage > totalPages) currentScribePage = totalPages || 1;

        const startIndex = (currentScribePage - 1) * SCRIBES_PER_PAGE;
        const endIndex = startIndex + SCRIBES_PER_PAGE;
        const pageItems = globalScribeList.slice(startIndex, endIndex);

        // Render Items
        pageItems.forEach(student => {
            const item = document.createElement('div');
            // Mobile: Column (Card), Desktop: Row
            item.className = 'group flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition mb-2 gap-3 md:gap-4';

            const strm = student.stream || "Regular";

            // Determine button styling
            const isLocked = isScribeListLocked;
            const btnDisabled = isLocked ? 'disabled' : '';

            const btnBase = "text-xs font-bold px-3 py-1.5 rounded border transition w-full md:w-auto text-center flex items-center justify-center gap-1";
            const btnStyle = isLocked
                ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                : "bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 cursor-pointer";

            const btnIcon = isLocked ? '' : '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
            const btnText = isLocked ? "Locked" : "Remove";

            item.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 w-full min-w-0">
                <div class="flex items-center justify-between md:justify-start gap-2">
                    <span class="font-mono font-bold text-gray-800 text-sm bg-gray-100 px-2 py-0.5 rounded md:bg-transparent md:p-0">${student.regNo}</span>
                    <span class="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 tracking-wide">${strm}</span>
                </div>
                <div class="text-xs text-gray-600 truncate font-medium pl-1 md:pl-0" title="${student.name}">
                    ${student.name}
                </div>
            </div>
            
            <div class="w-full md:w-auto md:shrink-0 pt-2 md:pt-0 border-t md:border-0 border-gray-100">
                <button class="${btnBase} ${btnStyle}" ${btnDisabled}>
                    ${btnIcon} ${btnText}
                </button>
            </div>
        `;

            if (!isLocked) {
                item.querySelector('button').onclick = () => removeScribeStudent(student.regNo, student.name);
            }

            currentScribeListDiv.appendChild(item);
        });

        // --- UPDATE CONTROLS ---
        if (paginationControls) {
            if (totalPages > 1) {
                paginationControls.classList.remove('hidden');
                pageInfo.textContent = `Page ${currentScribePage} of ${totalPages}`;

                prevBtn.disabled = (currentScribePage === 1);
                nextBtn.disabled = (currentScribePage === totalPages);

                // Re-attach listeners (safe to overwrite onclick)
                prevBtn.onclick = () => {
                    if (currentScribePage > 1) {
                        currentScribePage--;
                        renderGlobalScribeList();
                    }
                };
                nextBtn.onclick = () => {
                    if (currentScribePage < totalPages) {
                        currentScribePage++;
                        renderGlobalScribeList();
                    }
                };
            } else {
                paginationControls.classList.add('hidden');
            }
        }
    }

    // 3. Remove a student (Updated with Confirmation)
    function removeScribeStudent(regNo, name) {
        if (isScribeListLocked) return; // Extra safety check

        const confirmMsg = `Are you sure you want to remove ${name} (${regNo}) from the Scribe List?`;

        if (confirm(confirmMsg)) {
            globalScribeList = globalScribeList.filter(s => s.regNo !== regNo);
            localStorage.setItem(SCRIBE_LIST_KEY, JSON.stringify(globalScribeList));
            renderGlobalScribeList();

            // Also re-render allotment list if that view is active
            if (allotmentSessionSelect.value) {
                renderScribeAllotmentList(allotmentSessionSelect.value);
            }

            if (typeof syncDataToCloud === 'function') syncDataToCloud('allocation');
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
                const strm = student.stream || "Regular";

                item.innerHTML = `
                <div class="flex justify-between items-center">
                    <span>${student.regNo.replace(queryRegex, '<strong>$&</strong>')} (${student.name})</span>
                    <span class="text-xs font-bold text-gray-400 uppercase bg-gray-50 px-1 rounded ml-2">${strm}</span>
                </div>
            `;

                // Pass stream to select function
                item.onclick = () => selectScribeStudent({
                    'Register Number': student.regNo,
                    'Name': student.name,
                    'Stream': strm
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

        const strm = student.Stream || "Regular";
        scribeSelectedStudentName.textContent = student.Name;
        // Show Stream in the selected details
        scribeSelectedStudentRegno.innerHTML = `${student['Register Number']} <span class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">${strm}</span>`;
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

        // Add to list and save (INCLUDE STREAM)
        globalScribeList.push({
            regNo: regNo,
            name: selectedScribeStudent.Name,
            stream: selectedScribeStudent.Stream || "Regular"
        });
        localStorage.setItem(SCRIBE_LIST_KEY, JSON.stringify(globalScribeList));

        renderGlobalScribeList();
        clearScribeSearch();
        syncDataToCloud('allocation'); // <--- ADD THIS
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

    // Render the list of scribe students for the selected session (Lock-Aware)
    function renderScribeAllotmentList(sessionKey) {
        const [date, time] = sessionKey.split(' | ');
        const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);

        // Filter to get only scribe students *in this session*
        const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));
        const sessionScribeStudents = sessionStudents.filter(s => scribeRegNos.has(s['Register Number']));

        scribeAllotmentList.innerHTML = '';
        if (sessionScribeStudents.length === 0) {
            scribeAllotmentList.innerHTML = '<p class="text-gray-500 text-sm text-center py-4 italic">No students from the global scribe list are in this session.</p>';
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

        uniqueSessionScribeStudents.sort((a, b) => a['Register Number'].localeCompare(b['Register Number']));

        // Update Count Header with Badge
        const headerEl = document.getElementById('scribe-session-header');
        if (headerEl) {
            headerEl.innerHTML = `Scribe Students: <span class="ml-2 bg-orange-100 text-orange-800 text-xs font-bold px-2 py-0.5 rounded-full border border-orange-200">${uniqueSessionScribeStudents.length}</span>`;
        }

        const roomSerialMap = getRoomSerialMap(sessionKey);

        uniqueSessionScribeStudents.forEach(student => {
            const regNo = student['Register Number'];
            const allottedRoom = currentScribeAllotment[regNo];

            const item = document.createElement('div');
            item.className = 'bg-white border border-gray-200 rounded-lg p-3 shadow-sm mb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:shadow-md transition';

            let actionContent = '';

            // Check Lock State for Buttons
            if (isScribeAllotmentLocked) {
                // LOCKED STATE
                if (allottedRoom) {
                    const serialNo = roomSerialMap[allottedRoom] || '-';
                    const roomInfo = currentRoomConfig[allottedRoom];
                    const location = (roomInfo && roomInfo.location) ? ` <span class="text-gray-400 font-normal text-xs">(${roomInfo.location})</span>` : '';
                    const displayRoom = `<span class="font-mono font-bold text-gray-500 mr-1">#${serialNo}</span> ${allottedRoom}${location}`;

                    actionContent = `
                    <div class="bg-gray-50 border border-gray-200 rounded p-2 text-sm font-bold text-gray-600 flex items-center gap-2">
                        <span>🔒</span> ${displayRoom}
                    </div>`;
                } else {
                    actionContent = `<span class="text-xs text-gray-400 italic bg-gray-50 px-2 py-1 rounded border border-gray-100">Not Assigned (Locked)</span>`;
                }
            } else {
                // UNLOCKED STATE (Editable)
                if (allottedRoom) {
                    const serialNo = roomSerialMap[allottedRoom] || '-';
                    const roomInfo = currentRoomConfig[allottedRoom];
                    const location = (roomInfo && roomInfo.location) ? ` <span class="text-gray-400 font-normal text-xs">(${roomInfo.location})</span>` : '';
                    const displayRoom = `<span class="font-mono font-bold text-gray-500 mr-1">#${serialNo}</span> ${allottedRoom}${location}`;

                    actionContent = `
                    <div class="w-full md:w-auto bg-green-50 border border-green-100 rounded p-2 md:bg-transparent md:border-0 md:p-0 flex flex-col md:flex-row md:items-center gap-2">
                        <div class="text-xs text-gray-500 uppercase font-bold md:hidden">Allotted Room</div>
                        <div class="text-sm font-bold text-green-700 md:text-gray-800 md:mr-4">${displayRoom}</div>
                        
                        <div class="flex gap-2 w-full md:w-auto">
                            <button class="flex-1 md:flex-none inline-flex justify-center items-center rounded-md border border-gray-300 bg-white py-1.5 px-3 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
                                    onclick="openScribeRoomModal('${regNo}', '${student.Name}')">
                                Change
                            </button>
                            <button class="flex-1 md:flex-none inline-flex justify-center items-center rounded-md border border-red-200 bg-white py-1.5 px-3 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50"
                                    onclick="removeScribeRoom('${regNo}')" title="Unassign Room">
                                Clear
                            </button>
                        </div>
                    </div>
                `;
                } else {
                    actionContent = `
                    <button class="w-full md:w-auto inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onclick="openScribeRoomModal('${regNo}', '${student.Name}')">
                        Assign Room
                    </button>
                `;
                }
            }

            item.innerHTML = `
            <div class="flex items-center gap-3 w-full md:w-auto">
                <div class="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0 border border-orange-200">
                    Scr
                </div>
                <div class="min-w-0">
                    <h4 class="font-bold text-gray-800 text-sm font-mono">${regNo}</h4>
                    <p class="text-xs text-gray-600 truncate font-medium">${student.Name}</p>
                </div>
            </div>
            
            <div class="w-full md:w-auto border-t md:border-0 border-gray-100 pt-2 md:pt-0 mt-1 md:mt-0">
                ${actionContent}
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
    window.openScribeRoomModal = async function (regNo, studentName) {
        if (isScribeAllotmentLocked) return alert("Scribe Allotment is Locked."); // Safety Check
        studentToAllotScribeRoom = regNo;
        scribeRoomModalTitle.textContent = `Select Room for ${studentName} (${regNo})`;
        const searchInput = document.getElementById('scribe-room-search');
        if (searchInput) searchInput.value = "";
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
        syncDataToCloud('allocation'); // <--- ADD THIS
    }

    scribeCloseRoomModal.addEventListener('click', () => {
        scribeRoomModal.classList.add('hidden');
        studentToAllotScribeRoom = null;
    });

    // --- NEW: Scribe Room Search Filter Listener ---
    const scribeRoomSearchInput = document.getElementById('scribe-room-search');
    if (scribeRoomSearchInput) {
        scribeRoomSearchInput.addEventListener('input', function () {
            const query = this.value.toLowerCase();
            const items = document.getElementById('scribe-room-selection-list').children;

            Array.from(items).forEach(item => {
                // Filter based on text content (Room Name)
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    }
    // **********************************

    // --- Helper function to disable all report buttons ---
    window.real_disable_all_report_buttons = function (disabled) {
        const ids = [
            'generate-report-button',
            'generate-daywise-report-button', // <--- Updated to match HTML
            'generate-qpaper-report-button',
            'generate-scribe-report-button',
            'generate-scribe-proforma-button',
            'generate-qp-distribution-report-button',
            'generate-invigilator-report-button',
            'generate-absentee-report-button'
        ];

        ids.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = disabled;
        });
    }

    // --- NEW: STUDENT DATA EDIT FUNCTIONALITY (MODAL VERSION) ---

    let editCurrentPage = 1;
    const STUDENTS_PER_EDIT_PAGE = 10;
    let currentEditSession = '';
    let currentEditCourse = '';
    let currentEditStream = ''; // <--- ADD THIS NEW VARIABLE
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

    // 1. Session selection (Updated: Splits Course by Stream)
    editSessionSelect.addEventListener('change', () => {
        currentEditSession = editSessionSelect.value;
        const sessionOpsContainer = document.getElementById('bulk-session-ops-container');

        // --- NEW: Select the badge element ---
        const opsCountBadge = document.getElementById('session-ops-count-badge');

        if (sessionOpsContainer) {
            if (currentEditSession) {
                sessionOpsContainer.classList.remove('hidden');
                isSessionOpsLocked = true;
                updateSessionOpsLockUI();
            } else {
                sessionOpsContainer.classList.add('hidden');
                // --- NEW: Hide badge if no session selected ---
                if (opsCountBadge) opsCountBadge.classList.add('hidden');
            }
        }

        editDataContainer.innerHTML = '';
        editPaginationControls.classList.add('hidden');
        editSaveSection.classList.add('hidden');
        addNewStudentBtn.classList.add('hidden');

        const bulkContainer = document.getElementById('bulk-course-update-container');
        if (bulkContainer) bulkContainer.classList.add('hidden');

        if (currentEditSession) {
            const [date, time] = currentEditSession.split(' | ');
            const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);

            // --- NEW: Update and Show Badge Count ---
            if (opsCountBadge) {
                opsCountBadge.textContent = `${sessionStudents.length} Students`;
                opsCountBadge.classList.remove('hidden');
            }
            // ----------------------------------------

            const uniquePairs = [];
            const seen = new Set();
            // ... (rest of the existing logic continues unchanged) ...

            sessionStudents.forEach(s => {
                const strm = s.Stream || "Regular";
                const pairKey = `${s.Course}|${strm}`; // Composite Key

                if (!seen.has(pairKey)) {
                    seen.add(pairKey);
                    uniquePairs.push({
                        course: s.Course,
                        stream: strm,
                        value: pairKey
                    });
                }
            });

            // Sort: Regular first, then Alphabetical
            uniquePairs.sort((a, b) => {
                if (a.stream === "Regular" && b.stream !== "Regular") return -1;
                if (a.stream !== "Regular" && b.stream === "Regular") return 1;
                if (a.course !== b.course) return a.course.localeCompare(b.course);
                return a.stream.localeCompare(b.stream);
            });

            editCourseSelect.innerHTML = '';
            editCourseSelect.appendChild(new Option('-- Select a Course --', ''));

            uniquePairs.forEach(item => {
                // Display Format: "Course Name (Stream)"
                const label = `${item.course} (${item.stream})`;
                editCourseSelect.appendChild(new Option(label, item.value));
            });

            editCourseSelectContainer.classList.remove('hidden');
        } else {
            editCourseSelectContainer.classList.add('hidden');
            if (toggleEditDataLockBtn) toggleEditDataLockBtn.classList.add('hidden');
        }
    });

    // 2. Course selection (Updated: Parses Composite Key)
    editCourseSelect.addEventListener('change', () => {
        const selectedValue = editCourseSelect.value; // "CourseName|StreamName"
        editCurrentPage = 1;
        if (typeof setUnsavedChanges === 'function') {
            setUnsavedChanges(false);
        } else {
            hasUnsavedEdits = false;
        }

        let countDisplay = document.getElementById('edit-student-count');
        if (!countDisplay && addNewStudentBtn) {
            countDisplay = document.createElement('div');
            countDisplay.id = 'edit-student-count';
            countDisplay.className = 'mb-2 font-bold text-blue-700 text-sm';
            addNewStudentBtn.parentNode.insertBefore(countDisplay, addNewStudentBtn);
        }

        if (selectedValue) {
            if (toggleEditDataLockBtn) {
                toggleEditDataLockBtn.classList.remove('hidden');
                updateEditLockUI(); // Ensure it reflects the current state (Locked/Unlocked)
            }
            const [date, time] = currentEditSession.split(' | ');

            // Split the key back to Course and Stream
            const parts = selectedValue.split('|');
            const selectedStream = parts.pop(); // Last part is Stream
            const selectedCourse = parts.join('|'); // Rest is Course

            // Update Globals
            currentEditCourse = selectedCourse;
            currentEditStream = selectedStream;

            // Strict Filter
            currentCourseStudents = allStudentData
                .filter(s => {
                    const sStream = s.Stream || "Regular";
                    return s.Date === date &&
                        s.Time === time &&
                        s.Course === selectedCourse &&
                        sStream === selectedStream;
                })
                .map(s => ({ ...s }));

            if (countDisplay) {
                countDisplay.textContent = `Students: ${currentCourseStudents.length} | Stream: ${selectedStream}`;
                countDisplay.classList.remove('hidden');
            }

            renderStudentEditTable();
            editSaveSection.classList.remove('hidden');
            addNewStudentBtn.classList.remove('hidden');
        } else {
            // Reset
            currentEditCourse = '';
            currentEditStream = '';
            editDataContainer.innerHTML = '';
            editPaginationControls.classList.add('hidden');
            editSaveSection.classList.add('hidden');
            addNewStudentBtn.classList.add('hidden');
            if (countDisplay) countDisplay.classList.add('hidden');
            if (toggleEditDataLockBtn) toggleEditDataLockBtn.classList.add('hidden');
            // Hide Bulk if open
            const bulk = document.getElementById('bulk-course-update-container');
            if (bulk) bulk.classList.add('hidden');
        }
    });

    // Find the renderStudentEditTable function (around line 1330) and replace it with this:


    // 3. Render Table (Responsive: Cute Card on Mobile, Table on PC)
    function renderStudentEditTable() {
        editDataContainer.innerHTML = '';

        if (currentCourseStudents.length === 0) {
            editDataContainer.innerHTML = '<div class="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-gray-200 italic">No students found for this course.</div>';
            editPaginationControls.classList.add('hidden');
            return;
        }

        const start = (editCurrentPage - 1) * STUDENTS_PER_EDIT_PAGE;
        const end = start + STUDENTS_PER_EDIT_PAGE;
        const pageStudents = currentCourseStudents.slice(start, end);

        // --- LOCK CHECK ---
        const isLocked = (typeof isEditDataLocked !== 'undefined') ? isEditDataLocked : false;
        const btnState = isLocked ? 'disabled' : '';
        const btnOpacity = isLocked ? 'opacity-50 cursor-not-allowed' : '';

        let tableHtml = `
        <div class="overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table class="min-w-full divide-y divide-gray-200 w-full">
            <thead class="bg-gray-50 hidden md:table-header-group">
                <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sl</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reg No</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stream</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200 block md:table-row-group w-full">
    `;

        pageStudents.forEach((student, index) => {
            const uniqueRowIndex = start + index;
            const serialNo = uniqueRowIndex + 1;
            const streamDisplay = student.Stream || "Regular";

            // --- Desktop Row HTML (Restored) ---
            const desktopRow = `
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${serialNo}
            </td>
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="font-bold">${student.Date}</div>
                <div class="text-xs text-gray-500">${student.Time}</div>
            </td>
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">
                ${student['Register Number']}
            </td>
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${student.Name}
            </td>
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    ${streamDisplay}
                </span>
            </td>
            <td class="hidden md:table-cell px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="edit-row-btn text-indigo-600 hover:text-indigo-900 mr-3 transition ${btnOpacity}" ${btnState}>Edit</button>
                <button class="delete-row-btn text-red-600 hover:text-red-900 transition ${btnOpacity}" ${btnState}>Delete</button>
            </td>
        `;

            // --- Mobile Card HTML (Optimized) ---
            const mobileCard = `
            <td class="md:hidden block p-3 w-full border-b border-gray-100 last:border-0 bg-white">
                
                <div class="flex items-start gap-3 mb-3 w-full">
                    <div class="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-100">
                        ${student.Name ? student.Name.charAt(0) : '?'}
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap justify-between items-start gap-1">
                            <div class="text-sm font-bold text-gray-900 leading-tight break-words pr-1 max-w-full">
                                ${student.Name}
                            </div>
                            <span class="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wide">
                                ${streamDisplay}
                            </span>
                        </div>
                        <div class="text-xs text-gray-500 font-mono mt-1 font-semibold tracking-wide break-all">
                            ${student['Register Number']}
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100 mb-3">
                    <div>
                        <span class="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Date</span>
                        <span class="font-medium text-gray-700 whitespace-nowrap">${student.Date}</span>
                    </div>
                    <div>
                        <span class="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Time</span>
                        <span class="font-medium text-gray-700 whitespace-nowrap">${student.Time}</span>
                    </div>
                    <div class="col-span-2 border-t border-gray-200 pt-1 mt-1">
                        <span class="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Course</span>
                        <span class="font-medium text-gray-700 block break-words whitespace-normal leading-snug" title="${student.Course}">
                            ${student.Course}
                        </span>
                    </div>
                </div>

                <div class="flex gap-2">
                    <button class="edit-row-btn flex-1 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs font-bold py-2 rounded-lg shadow-sm flex items-center justify-center gap-2 transition ${btnOpacity}" ${btnState}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                    </button>
                    <button class="delete-row-btn flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold py-2 rounded-lg shadow-sm flex items-center justify-center gap-2 transition ${btnOpacity}" ${btnState}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Remove
                    </button>
                </div>
            </td>
        `;

            tableHtml += `
            <tr data-row-index="${uniqueRowIndex}" class="block md:table-row bg-white md:border-b border-gray-200 last:border-0">
                ${desktopRow}
                ${mobileCard}
            </tr>
        `;
        });

        tableHtml += `</tbody></table></div>`;
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

    // 7. NEW Function: Open the Edit/Add Modal (With Date/Time Conversion)
    function openStudentEditModal(rowIndex) {
        // Populate Stream Dropdown
        const streamSelect = document.getElementById('modal-edit-stream');
        streamSelect.innerHTML = currentStreamConfig.map(s => `<option value="${s}">${s}</option>`).join('');

        // Helper to convert DD.MM.YYYY -> YYYY-MM-DD
        const toInputDate = (dateStr) => {
            if (!dateStr) return "";
            const [d, m, y] = dateStr.split('.');
            return `${y}-${m}-${d}`;
        };

        // Helper to convert HH:MM AM/PM -> HH:MM (24h)
        const toInputTime = (timeStr) => {
            if (!timeStr) return "";
            const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return "";
            let [_, h, m, p] = match;
            h = parseInt(h);
            if (p.toUpperCase() === 'PM' && h < 12) h += 12;
            if (p.toUpperCase() === 'AM' && h === 12) h = 0;
            return `${String(h).padStart(2, '0')}:${m}`;
        };

        if (rowIndex === null) {
            // --- ADDING A NEW STUDENT ---
            modalTitle.textContent = "Add New Student";
            currentlyEditingIndex = null;

            const [date, time] = currentEditSession.split(' | ');

            modalDate.value = toInputDate(date); // Convert for picker
            modalTime.value = toInputTime(time); // Convert for picker

            modalCourse.value = currentEditCourse;
            modalRegNo.value = "ENTER_REG_NO";
            modalName.value = "New Student";
            streamSelect.value = currentStreamConfig[0];

        } else {
            // --- EDITING AN EXISTING STUDENT ---
            modalTitle.textContent = "Edit Student Details";
            currentlyEditingIndex = rowIndex;

            const student = currentCourseStudents[rowIndex];

            modalDate.value = toInputDate(student.Date); // Convert
            modalTime.value = toInputTime(student.Time); // Convert

            modalCourse.value = student.Course;
            modalRegNo.value = student['Register Number'];
            modalName.value = student.Name;
            streamSelect.value = student.Stream || currentStreamConfig[0];
        }

        studentEditModal.classList.remove('hidden');
    }

    // 8. NEW Function: Close the modal
    function closeStudentEditModal() {
        studentEditModal.classList.add('hidden');
        currentlyEditingIndex = null;
    }

    // 9. NEW Event Listeners for Modal Buttons
    modalCancelBtn.addEventListener('click', closeStudentEditModal);

    // [In app.js]

    modalSaveBtn.addEventListener('click', () => {
        // 1. Capture Inputs
        const rawDate = modalDate.value; // YYYY-MM-DD
        const rawTime = modalTime.value; // HH:MM
        const newCourse = modalCourse.value.trim();
        const newRegNo = modalRegNo.value.trim();
        const newName = modalName.value.trim();
        const newStream = document.getElementById('modal-edit-stream').value;

        let finalDate = "";
        let finalTime = "";

        // 2. Helper: Date/Time Converters
        const processDate = (dStr) => {
            if (!dStr) return "";
            const [y, m, d] = dStr.split('-');
            return `${d}.${m}.${y}`;
        };

        // Use the global normalizer to ensure "2:00 PM" becomes "02:00 PM"
        const processTime = (tStr) => {
             if (typeof normalizeTime === 'function') return normalizeTime(tStr);
             return tStr; 
        };

        // 3. MERGE LOGIC
        let studentObj = {};

        if (currentlyEditingIndex !== null) {
            // --- EDIT MODE ---
            const original = currentCourseStudents[currentlyEditingIndex];

            // Date: Use new if changed, else keep original
            finalDate = rawDate ? processDate(rawDate) : original.Date;
            
            // Time: Use new if changed, else use original... BUT NORMALIZE IT!
            // This fixes the bug where un-edited times stayed as "2:00 PM"
            const timeToProcess = rawTime ? rawTime : original.Time;
            finalTime = processTime(timeToProcess);

            studentObj = {
                Date: finalDate,
                Time: finalTime,
                Course: newCourse || original.Course,
                'Register Number': newRegNo || original['Register Number'],
                Name: newName || original.Name,
                Stream: newStream || original.Stream || "Regular"
            };

        } else {
            // --- ADD MODE ---
            if (!newRegNo || !newName || !rawDate || !rawTime || !newCourse) {
                alert('For a new student, all fields are required.');
                return;
            }
            studentObj = {
                Date: processDate(rawDate),
                Time: processTime(rawTime), // Normalize the new input
                Course: newCourse,
                'Register Number': newRegNo,
                Name: newName,
                Stream: newStream
            };
        }

        // 4. Save & Close
        if (confirm("Save changes?")) {
            if (currentlyEditingIndex !== null) {
                currentCourseStudents[currentlyEditingIndex] = studentObj;
            } else {
                currentCourseStudents.push(studentObj);
            }

            setUnsavedChanges(true);
            closeStudentEditModal();
            renderStudentEditTable();
        }
    });

    // 10. Save All Changes to LocalStorage
    saveEditDataButton.addEventListener('click', () => {
        if (!hasUnsavedEdits) {
            editDataStatus.textContent = 'No changes to save.';
            setTimeout(() => { editDataStatus.textContent = ''; }, 3000);
            return;
        }

        if (confirm('This will permanently save all edits, additions, and deletions for this course/session to the main data source. Continue?')) {

            const [date, time] = currentEditSession.split(' | ');
            const course = currentEditCourse;
            const stream = currentEditStream; // <--- Use Global Stream

            // 1. Filter out matching records (STRICT STREAM CHECK)
            // We keep everything that DOES NOT match our current view
            const otherStudents = allStudentData.filter(s => {
                const sStream = s.Stream || "Regular";
                return !(s.Date === date &&
                    s.Time === time &&
                    s.Course === course &&
                    sStream === stream);
            });

            // 2. Create the new master list
            const updatedAllStudentData = [...otherStudents, ...currentCourseStudents];

            // 3. Update the global variable and localStorage
            allStudentData = updatedAllStudentData;
            localStorage.setItem(BASE_DATA_KEY, JSON.stringify(allStudentData));

            editDataStatus.textContent = 'All changes saved successfully!';
            setUnsavedChanges(false);
            setTimeout(() => { editDataStatus.textContent = ''; }, 3000);
            if (typeof syncDataToCloud === 'function') syncDataToCloud('heavy');

            // 4. Reload other parts of the app
            jsonDataStore.innerHTML = JSON.stringify(allStudentData);
            updateUniqueStudentList();
            populate_session_dropdown();
            populate_qp_code_session_dropdown();
            populate_room_allotment_session_dropdown();

            // 5. Reload the current view
            currentCourseStudents = allStudentData
                .filter(s => {
                    const sStream = s.Stream || "Regular";
                    return s.Date === date &&
                        s.Time === time &&
                        s.Course === course &&
                        sStream === stream;
                })
                .map(s => ({ ...s }));

            renderStudentEditTable();
        }
    });

    // 11. Helper function to manage "unsaved" status (Auto-Disable Button)
    function setUnsavedChanges(status) {
        hasUnsavedEdits = status;
        const btn = document.getElementById('save-edit-data-button');
        const statusText = document.getElementById('edit-data-status');

        if (status) {
            // STATE: CHANGES DETECTED -> ENABLE BUTTON
            if (statusText) statusText.textContent = 'You have unsaved changes.';
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
                btn.classList.add('bg-green-600', 'hover:bg-green-700');
                btn.textContent = "Save All Changes to Local Storage";
            }
        } else {
            // STATE: NO CHANGES -> DISABLE BUTTON
            if (statusText) statusText.textContent = 'No unsaved changes.';
            if (btn) {
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
                btn.classList.remove('bg-green-600', 'hover:bg-green-700');
                btn.textContent = "No Changes to Save";
            }
        }
    }
    // ==========================================
    // ⚡ BULK COURSE UPDATE LOGIC (V3: Course Edit Added)
    // ==========================================

    // 1. Elements
    const bulkUpdateContainer = document.getElementById('bulk-course-update-container');
    const bulkInputsWrapper = document.getElementById('bulk-inputs-wrapper');
    const bulkEditModeBtn = document.getElementById('btn-bulk-edit-mode');
    const bulkTargetCourseName = document.getElementById('bulk-target-course-name');

    // Inputs
    const bulkNewCourseInput = document.getElementById('bulk-new-course'); // <--- NEW
    const bulkNewDateInput = document.getElementById('bulk-new-date');
    const bulkNewTimeInput = document.getElementById('bulk-new-time');
    const bulkNewStreamSelect = document.getElementById('bulk-new-stream');
    const btnBulkApply = document.getElementById('btn-bulk-apply-changes');

    // --- Helpers for Date/Time Conversion ---
    const bulkDateToInput = (dateStr) => {
        if (!dateStr) return "";
        const [d, m, y] = dateStr.split('.');
        return `${y}-${m}-${d}`;
    };

    const bulkTimeToInput = (timeStr) => {
        if (!timeStr) return "";
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return "";
        let [_, h, m, p] = match;
        h = parseInt(h);
        if (p.toUpperCase() === 'PM' && h < 12) h += 12;
        if (p.toUpperCase() === 'AM' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${m}`;
    };

    // 2. Listener to Show/Hide Bulk Section
    if (editCourseSelect) {
        editCourseSelect.addEventListener('change', () => {
            if (editCourseSelect.value) {
                // Show Section
                if (bulkUpdateContainer) bulkUpdateContainer.classList.remove('hidden');

                // Use Global Variable for clean name display
                if (bulkTargetCourseName) bulkTargetCourseName.textContent = `${currentEditCourse} (${currentEditStream})`;

                // RESET STATE: Lock Inputs
                if (bulkInputsWrapper) {
                    bulkInputsWrapper.classList.add('opacity-50', 'pointer-events-none');
                }

                // Lock all inputs
                [bulkNewCourseInput, bulkNewDateInput, bulkNewTimeInput, bulkNewStreamSelect, btnBulkApply].forEach(el => {
                    if (el) {
                        el.disabled = true;
                        if (el.tagName !== 'BUTTON') el.classList.add('bg-gray-50');
                    }
                });

                if (bulkEditModeBtn) {
                    bulkEditModeBtn.classList.remove('hidden');
                    // Reset button text
                    bulkEditModeBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                    </svg> Unlock to Edit
                `;
                }

                // Pre-fill Inputs
                if (editSessionSelect.value) {
                    const [currDate, currTime] = editSessionSelect.value.split(' | ');
                    if (bulkNewDateInput) bulkNewDateInput.value = bulkDateToInput(currDate);
                    if (bulkNewTimeInput) bulkNewTimeInput.value = bulkTimeToInput(currTime);
                }

                // Pre-fill Course Name (Use Global)
                if (bulkNewCourseInput) bulkNewCourseInput.value = currentEditCourse;

                // Populate Stream Dropdown
                if (bulkNewStreamSelect) {
                    const streamOptions = currentStreamConfig.map(s => `<option value="${s}">${s}</option>`).join('');
                    bulkNewStreamSelect.innerHTML = `<option value="">-- No Change --</option>` + streamOptions;
                    bulkNewStreamSelect.value = "";
                }
            } else {
                if (bulkUpdateContainer) bulkUpdateContainer.classList.add('hidden');
            }
        });
    }

    // 3. Handle "Unlock/Lock" Toggle Click
    if (bulkEditModeBtn) {
        bulkEditModeBtn.addEventListener('click', () => {
            const isLocked = bulkNewDateInput.disabled;

            // Add deleteCourseBtn to the list of inputs to toggle
            const inputsToToggle = [
                bulkNewCourseInput,
                bulkNewDateInput,
                bulkNewTimeInput,
                bulkNewStreamSelect,
                btnBulkApply,
                document.getElementById('delete-course-btn') // <--- ADD THIS
            ];

            if (isLocked) {
                // --- ACTION: UNLOCK ---
                if (bulkInputsWrapper) {
                    bulkInputsWrapper.classList.remove('opacity-50', 'pointer-events-none');
                }
                inputsToToggle.forEach(el => {
                    if (el) {
                        el.disabled = false;
                        // Remove gray background (Unlocking)
                        el.classList.remove('bg-gray-50', 'text-gray-400');
                    }
                });

                // Change Button Text to "Lock"
                bulkEditModeBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-red-600">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span class="text-red-600 font-bold">Lock Editing</span>
            `;

            } else {
                // --- ACTION: LOCK ---
                if (bulkInputsWrapper) {
                    bulkInputsWrapper.classList.add('opacity-50', 'pointer-events-none');
                }
                inputsToToggle.forEach(el => {
                    if (el) {
                        el.disabled = true;
                        // Add gray background (Locking)
                        el.classList.add('bg-gray-50');
                        if (el.id === 'delete-course-btn') el.classList.add('text-gray-400'); // Dim text
                    }
                });

                // Revert Button Text to "Unlock"
                bulkEditModeBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                </svg>
                Unlock to Edit
            `;
            }
        });
    }


    // 4. Handle Bulk Apply Click
    // [In app.js]

   if (btnBulkApply) {
        btnBulkApply.addEventListener('click', async () => {
            const rawDate = bulkNewDateInput.value; // YYYY-MM-DD
            const rawTime = bulkNewTimeInput.value; // HH:MM
            const newStream = bulkNewStreamSelect.value; // Might be "" (No Change)
            const newCourseName = bulkNewCourseInput.value.trim();

            const targetCourse = editCourseSelect.value;
            const [oldDate, oldTime] = editSessionSelect.value.split(' | ');

            // Validation: Allow if AT LEAST ONE field is provided
            if (!rawDate && !rawTime && !newCourseName && !newStream) {
                alert("No changes detected. Please edit at least one field (Date, Time, Stream, or Course).");
                return;
            }

            // --- CONVERT ONLY IF PROVIDED ---
            let newDate = null;
            let newTime = null;

            if (rawDate) {
                const [y, m, d] = rawDate.split('-');
                newDate = `${d}.${m}.${y}`;
            }

            if (rawTime) {
                // Input is HH:mm (24h) from picker
                // normalizeTime handles 24h input correctly and ensures 02:00 PM format
                if (typeof normalizeTime === 'function') {
                     newTime = normalizeTime(rawTime);
                } else {
                     // Fallback if normalizeTime is missing (Safety)
                    const [h, min] = rawTime.split(':');
                    let hours = parseInt(h);
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    const paddedHours = String(hours).padStart(2, '0');
                    newTime = `${paddedHours}:${min} ${ampm}`;
                }
            }
            // ----------------------------------

            // Check count
            const recordsToUpdate = allStudentData.filter(s =>
                s.Date === oldDate &&
                s.Time === oldTime &&
                s.Course === targetCourse
            );

            if (recordsToUpdate.length === 0) {
                alert("No records found to update.");
                return;
            }

            const confirmMsg = `
⚠ CONFIRM BULK CHANGE ⚠

Target: ${targetCourse}
Students: ${recordsToUpdate.length}

--- UPDATES ---
Course: ${newCourseName ? newCourseName : "(No Change)"}
Date:   ${newDate ? newDate : "(No Change)"}
Time:   ${newTime ? newTime : "(No Change)"}
Stream: ${newStream ? newStream : "(No Change)"}

Are you sure you want to update these records?
        `;

            if (confirm(confirmMsg)) {
                let updateCount = 0;

                allStudentData.forEach(student => {
                    if (student.Date === oldDate && student.Time === oldTime && student.Course === targetCourse) {
                        // Only update fields that are NOT null/empty
                        if (newDate) student.Date = newDate;
                        if (newTime) student.Time = newTime;
                        if (newStream) student.Stream = newStream;
                        if (newCourseName) student.Course = newCourseName;
                        updateCount++;
                    }
                });

                localStorage.setItem(BASE_DATA_KEY, JSON.stringify(allStudentData));
                // REPLACE "window.location.reload()" at line 7596 with:
                alert('Restore successful! Syncing to Cloud...');

                if (typeof syncDataToCloud === 'function') {
                    await syncDataToCloud('settings');
                    await syncDataToCloud('ops');
                    await syncDataToCloud('allocation');
                    await syncDataToCloud('staff');
                    await syncDataToCloud('slots');
                    await syncDataToCloud('heavy');
                }

                window.location.reload();
            }
        });
    }


    // --- Event listener for Invigilator Report (Stream-Wise V2) ---
    generateInvigilatorReportButton.addEventListener('click', async () => {
        generateInvigilatorReportButton.disabled = true;
        generateInvigilatorReportButton.textContent = "Calculating...";
        reportOutputArea.innerHTML = "";
        reportControls.classList.add('hidden');
        roomCsvDownloadContainer.innerHTML = "";
        lastGeneratedReportType = "";
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            loadGlobalScribeList();
            currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";

            // 1. Get Data
            const data = getFilteredReportData('invigilator-summary');
            if (data.length === 0) {
                alert("No data found for the selected filter/session.");
                return;
            }

            // 2. Get Scribes
            const globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
            const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));

            // 3. Collate Stats (Session -> Stream -> Count)
            const sessionStats = {};

            for (const student of data) {
                const sessionKey = `${student.Date} | ${student.Time}`;

                if (!sessionStats[sessionKey]) {
                    sessionStats[sessionKey] = {
                        streams: {}, // Object to hold stream-wise counts
                        scribeCount: 0
                    };
                }

                const isScribe = scribeRegNos.has(student['Register Number']);

                if (isScribe) {
                    sessionStats[sessionKey].scribeCount++;
                } else {
                    // Separate by Stream
                    const strm = student.Stream || "Regular";
                    if (!sessionStats[sessionKey].streams[strm]) {
                        sessionStats[sessionKey].streams[strm] = 0;
                    }
                    sessionStats[sessionKey].streams[strm]++;
                }
            }

            // 4. Build Report Data
            const sortedSessionKeys = Object.keys(sessionStats).sort(compareSessionStrings);
            let tableRowsHtml = '';

            // Grand Totals
            let grandTotalInvigs = 0;

            sortedSessionKeys.forEach(key => {
                const stats = sessionStats[key];

                // A. Stream Breakdown
                let streamHtmlParts = [];
                let streamInvigTotal = 0;

                // Sort streams (Regular first)
                const sortedStreams = Object.keys(stats.streams).sort((a, b) => {
                    if (a === "Regular") return -1;
                    if (b === "Regular") return 1;
                    return a.localeCompare(b);
                });

                sortedStreams.forEach(strm => {
                    const count = stats.streams[strm];
                    const requiredInvigs = Math.ceil(count / 30); // 1 per 30 rule PER STREAM
                    streamInvigTotal += requiredInvigs;

                    streamHtmlParts.push(`
                    <div class="flex justify-between items-center text-sm mb-1 border-b border-gray-200 pb-1 last:border-0">
                        <span class="font-medium text-gray-700">${strm}:</span>
                        <span class="text-gray-600">
                            <strong>${count}</strong> Students 
                            <span class="text-xs text-gray-400">→</span> 
                            <strong class="text-blue-600">${requiredInvigs}</strong> Inv
                        </span>
                    </div>
                `);
                });

                // B. Scribe Breakdown
                const scribeCount = stats.scribeCount;
                const scribeInvigs = Math.ceil(scribeCount / 5); // 1 per 5 rule

                // C. Session Total
                const sessionTotalInvigs = streamInvigTotal + scribeInvigs;
                grandTotalInvigs += sessionTotalInvigs;

                tableRowsHtml += `
                <tr>
                    <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold;">${key}</td>
                    <td style="border: 1px solid #ccc; padding: 8px; vertical-align: top;">
                        ${streamHtmlParts.join('')}
                    </td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: center; vertical-align: top;">
                        <div class="text-sm">
                            <strong>${scribeCount}</strong> Students<br>
                            <span class="text-xs text-gray-500">↓</span><br>
                            <strong class="text-orange-600">${scribeInvigs}</strong> Inv
                        </div>
                    </td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: center; font-weight: bold; font-size: 1.1em; vertical-align: middle; background-color: #f9fafb;">
                        ${sessionTotalInvigs}
                    </td>
                </tr>
            `;
            });

            // 5. Generate HTML
            const allPagesHtml = `
            <div class="print-page">
                <div class="print-header-group" style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
                    <h1>${currentCollegeName}</h1>
                    <h2>Invigilator Requirement Summary (Stream-Wise)</h2>
                    <h3 style="font-size: 10pt; font-style: italic; margin-top: 5px; color: #555;">
                        <strong>Norms:</strong> 1 Invigilator per 30 Candidates (Calculated separately per stream) | 1 Invigilator per 5 Scribes
                    </h3>
                </div>
                
                <table class="invigilator-report-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f3f4f6;">
                            <th style="border: 1px solid #000; padding: 10px; width: 20%;">Session</th>
                            <th style="border: 1px solid #000; padding: 10px; width: 45%;">Candidate Breakdown (Stream-wise)</th>
                            <th style="border: 1px solid #000; padding: 10px; width: 20%; text-align: center;">Scribe Req.</th>
                            <th style="border: 1px solid #000; padding: 10px; width: 15%; text-align: center;">Total Required</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #eee;">
                            <td colspan="3" style="border: 1px solid #000; padding: 10px; text-align: right; font-weight: bold; text-transform: uppercase;">Grand Total Invigilator Duties:</td>
                            <td style="border: 1px solid #000; padding: 10px; text-align: center; font-weight: bold; font-size: 1.2em;">${grandTotalInvigs}</td>
                        </tr>
                    </tfoot>
                </table>
                
                <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="font-size: 9pt; color: #666;">Generated by ExamFlow</div>
                    <div class="signature" style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 5px;">
                        Chief Superintendent
                    </div>
                </div>
            </div>
        `;

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
   
    // --- Event listener for the "Print" button ---
    if (finalPrintButton) {
        finalPrintButton.addEventListener('click', () => {
            // This button now exclusively uses the native browser print function
            window.print();
        });
    }
    
    
    // --- Event listener for "Generate Room Stickers" (V10: Dynamic RegNo Width) ---
    const generateStickerButton = document.getElementById('generate-sticker-button');

    if (generateStickerButton) {
        generateStickerButton.addEventListener('click', async () => {
            const sessionKey = reportsSessionSelect.value;
            if (filterSessionRadio.checked && !checkManualAllotment(sessionKey)) { return; }

            generateStickerButton.disabled = true;
            generateStickerButton.textContent = "Generating Stickers...";
            reportOutputArea.innerHTML = "";
            reportControls.classList.add('hidden');
            await new Promise(resolve => setTimeout(resolve, 50));

            try {
                currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
                getRoomCapacitiesFromStorage();
                loadQPCodes();

                const data = getFilteredReportData('room-wise');
                if (data.length === 0) { alert("No data found."); return; }

                const processed_rows = performOriginalAllocation(data);
                const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');

                // 1. Group by Session -> Room
                const sessions = {};
                processed_rows.forEach(student => {
                    let roomName = student['Room No'];
                    let isScribe = false;
                    if (student.isScribe) {
                        const sessionKeyPipe = `${student.Date} | ${student.Time}`;
                        const scribeRoom = allScribeAllotments[sessionKeyPipe]?.[student['Register Number']];
                        if (scribeRoom) {
                            roomName = scribeRoom;
                            isScribe = true;
                        }
                    }
                    const key = `${student.Date}_${student.Time}_${roomName}`;
                    if (!sessions[key]) {
                        sessions[key] = {
                            Date: student.Date, Time: student.Time, Room: roomName,
                            students: []
                        };
                    }
                    sessions[key].students.push({ ...student, isScribeDisplay: isScribe });
                });

                const sortedKeys = Object.keys(sessions).sort((a, b) => getNumericSortKey(a).localeCompare(getNumericSortKey(b)));

                // Helper: Truncate Name
                function getTruncatedName(name, maxLen = 18) {
                    if (!name) return "";
                    if (name.length <= maxLen) return name;
                    return name.substring(0, maxLen) + "..";
                }

                // 2. Generate Stickers
                const stickers = [];

                sortedKeys.forEach(key => {
                    const session = sessions[key];
                    if (session.Room === "Unallotted" || session.Room === "N/A") return;

                    const roomInfo = currentRoomConfig[session.Room] || {};

                    // Header Logic
                    const hasLocation = (roomInfo.location && roomInfo.location.trim() !== "");
                    const headerTitle = hasLocation ? roomInfo.location : session.Room;
                    const roomSubTitle = hasLocation ? `<span style="font-size: 14pt; font-weight: bold; margin-left: 5px;">(${session.Room})</span>` : "";

                    // Group Students
                    const studentsByCourse = {};
                    session.students.forEach(s => {
                        if (!studentsByCourse[s.Course]) studentsByCourse[s.Course] = [];
                        studentsByCourse[s.Course].push(s);
                    });

                    const sortedCourses = Object.keys(studentsByCourse).sort();
                    const numCourses = sortedCourses.length;

                    // --- DYNAMIC LAYOUT ---
                    let internalCols = "1fr 1fr 1fr";
                    let rowPadding = "1px";
                    let regFontSize = "9pt";
                    let nameFontSize = "8.5pt";

                    // Tighter padding if very crowded
                    if (numCourses > 6) {
                        rowPadding = "0px";
                        regFontSize = "8.5pt";
                        nameFontSize = "8pt";
                    }

                    let courseBlocksHtml = '';

                    sortedCourses.forEach(courseName => {
                        const students = studentsByCourse[courseName];
                        students.sort((a, b) => (a.seatNumber || 999) - (b.seatNumber || 999));

                        let studentGridHtml = '';

                        students.forEach(s => {
                            const scribeBadge = s.isScribeDisplay ? '<span style="font-size:0.6em; color:white; bg-color:black; padding:0 1px; border-radius:2px; background:black; margin-left:1px;">S</span>' : '';
                            const seatDisplay = s.seatNumber !== undefined ? s.seatNumber : '-';
                            const displayName = getTruncatedName(s.Name, 20);

                            // *** FIXED GRID: 25px | max-content | 1fr ***
                            // max-content makes the middle column exactly as wide as the RegNo text
                            studentGridHtml += `
                            <div style="display: grid; grid-template-columns: 25px max-content 1fr; align-items: center; border-bottom: 1px dotted #ccc; padding: ${rowPadding} 0; font-size: ${regFontSize};">
                                <div style="text-align: center; font-weight: bold; border-right: 1px solid #ddd;">${seatDisplay}</div>
                                <div style="text-align: left; font-weight: bold; padding-left: 5px; padding-right: 5px; border-right: 1px solid #ddd; white-space:nowrap;">${s['Register Number']}</div>
                                <div style="padding-left: 5px; font-size: ${nameFontSize}; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #333;">
                                    ${displayName} ${scribeBadge}
                                </div>
                            </div>
                        `;
                        });

                        courseBlocksHtml += `
                        <div style="margin-bottom: 4px; break-inside: avoid; border: 1px solid #eee; padding: 2px; background: #fafafa;">
                            <div style="font-weight:bold; font-size:8.5pt; background:#e5e7eb; padding:1px 4px; margin-bottom:1px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">
                                ${courseName} <span style="background:#fff; padding:0 3px; border-radius:4px; margin-left:3px; font-size:8pt; border:1px solid #ccc;">${students.length}</span>
                            </div>
                            <div style="display: grid; grid-template-columns: ${internalCols}; column-gap: 8px; row-gap: 0;">
                                ${studentGridHtml}
                            </div>
                        </div>
                    `;
                    });

                    // Sticker HTML (Fixed 135mm)
                    const stickerHtml = `
                    <div class="exam-sticker" style="border: 2px dashed #000; padding: 6px 8px; height: 135mm; overflow: hidden; display: flex; flex-direction: column; box-sizing: border-box; background: white; width: 100%;">
                        
                        <div style="text-align: center; margin-bottom: 3px; flex-shrink: 0; border-bottom: 2px solid #000; padding-bottom: 3px;">
                            <h1 style="font-size: 12pt; font-weight: bold; margin: 0; text-transform: uppercase; line-height: 1.1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${currentCollegeName}</h1>
                            <div style="font-size: 9pt; font-weight: bold; margin-top: 1px; color: #444;">
                                ${session.Date} &nbsp;|&nbsp; ${session.Time}
                            </div>
                            
                            <div style="margin-top: 3px; border: 2px solid #000; padding: 2px 6px; display:flex; justify-content:center; align-items:center;">
                                <span style="font-size: 12pt; font-weight: bold; line-height:1.1; text-align:center;">${headerTitle} ${roomSubTitle}</span>
                            </div>
                        </div>

                        <div style="flex: 1 1 auto; overflow: hidden; min-height: 0; padding-top: 2px;">
                             <div style="display: block;">
                                ${courseBlocksHtml}
                             </div>
                        </div>

                        <div style="text-align: center; font-size: 9pt; color: #000; margin-top: 2px; flex-shrink: 0; border-top: 2px solid #000; padding-top: 2px; font-weight:bold; background:#f0f0f0;">
                            Total Candidates: ${session.students.length}
                        </div>
                    </div>
                `;
                    stickers.push(stickerHtml);
                });

                // 3. Build Pages
                let pagesHtml = `
                <style>
                    /* Screen */
                    .print-page-sticker {
                        width: 210mm; min-height: 297mm; padding: 10mm; margin: 10px auto; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); box-sizing: border-box;
                    }
                    .sticker-gap { height: 10px; border-bottom: 1px dotted #ccc; margin-bottom: 10px; }

                    /* Print */
                    @media print {
                        @page { margin: 0; size: A4 portrait; }
                        .print-page-sticker {
                            padding: 10mm 5mm !important; 
                            margin: 0 !important;
                            border: none !important;
                            box-shadow: none !important;
                            height: 297mm !important;
                            width: 210mm !important;
                            display: flex; flex-direction: column; justify-content: space-between; 
                            box-sizing: border-box;
                        }
                        .sticker-gap { display: none !important; }
                        .exam-sticker {
                            border: 2px dashed #000 !important;
                            height: 135mm !important; 
                            break-inside: avoid;
                            width: 100% !important;
                            box-shadow: none !important;
                        }
                    }
                </style>
            `;

                for (let i = 0; i < stickers.length; i += 2) {
                    const sticker1 = stickers[i];
                    const sticker2 = stickers[i + 1] || '';
                    const gap = sticker2 ? '<div class="sticker-gap"></div>' : '';

                    pagesHtml += `
                    <div class="print-page-sticker">
                        ${sticker1}
                        ${gap}
                        ${sticker2}
                    </div>
                `;
                }

                reportOutputArea.innerHTML = pagesHtml;
                reportOutputArea.style.display = 'block';
                reportStatus.textContent = `Generated ${Math.ceil(stickers.length / 2)} sticker pages.`;
                reportControls.classList.remove('hidden');
                lastGeneratedReportType = "Room_Stickers";

            } catch (e) {
                console.error(e);
                alert("Error: " + e.message);
            } finally {
                generateStickerButton.disabled = false;
                generateStickerButton.textContent = "Generate Room Stickers (2 per Page)";
            }
        });
    }
    // Also update real_disable_all_report_buttons to include the new button ID
    const originalDisableFunc = window.real_disable_all_report_buttons;
    window.real_disable_all_report_buttons = function (disabled) {
        if (originalDisableFunc) originalDisableFunc(disabled);
        const btn = document.getElementById('generate-sticker-button');
        if (btn) btn.disabled = disabled;
    };


    // --- NEW: STUDENT SEARCH FUNCTIONALITY ---

    let searchSessionStudents = [];
    let debounceTimer;

    const searchModeSessionRadio = document.getElementById('search-mode-session');
    const searchModeGlobalRadio = document.getElementById('search-mode-global');
    const searchSessionContainer = document.getElementById('search-session-container');

    // 0. Toggle Search Modes
    function toggleSearchMode() {
        studentSearchInput.value = '';
        studentSearchAutocomplete.classList.add('hidden');
        studentSearchStatus.textContent = '';

        if (searchModeGlobalRadio.checked) {
            // Global Mode
            searchSessionContainer.classList.add('hidden');
            studentSearchInput.disabled = false;
            studentSearchInput.placeholder = "Search entire database (RegNo or Name)...";
            studentSearchStatus.textContent = "Searching across ALL sessions.";
        } else {
            // Session Mode
            searchSessionContainer.classList.remove('hidden');
            if (searchSessionSelect.value) {
                studentSearchInput.disabled = false;
                studentSearchInput.placeholder = "Search in selected session...";
            } else {
                studentSearchInput.disabled = true;
                studentSearchInput.placeholder = "Select a session first...";
            }
        }
    }

    searchModeSessionRadio.addEventListener('change', toggleSearchMode);
    searchModeGlobalRadio.addEventListener('change', toggleSearchMode);

    // 1. Listen for session change (Session Mode Only)
    searchSessionSelect.addEventListener('change', () => {
        const sessionKey = searchSessionSelect.value;
        studentSearchInput.value = '';
        studentSearchAutocomplete.classList.add('hidden');

        if (sessionKey) {
            const [date, time] = sessionKey.split(' | ');
            searchSessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
            studentSearchSection.classList.remove('hidden');
            studentSearchInput.disabled = false;
            studentSearchStatus.textContent = `Loaded ${searchSessionStudents.length} students for this session.`;
        } else {
            if (searchModeSessionRadio.checked) {
                studentSearchInput.disabled = true;
                studentSearchStatus.textContent = '';
                searchSessionStudents = [];
            }
        }
    });

    // 2. Autocomplete for search input (DEBOUNCED)
    studentSearchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            const query = studentSearchInput.value.trim().toUpperCase();
            if (query.length < 2) {
                studentSearchAutocomplete.classList.add('hidden');
                return;
            }

            let sourceArray = [];
            if (searchModeGlobalRadio.checked) {
                // Global Mode
                if (allUniqueStudentsForScribeSearch.length === 0) updateUniqueStudentList();
                sourceArray = allUniqueStudentsForScribeSearch;
            } else {
                // Session Mode
                sourceArray = searchSessionStudents;
            }

            // Filter
            const matches = sourceArray.filter(s => {
                const r = s['Register Number'] || s.regNo;
                const n = s.Name || s.name;
                return (r && r.toUpperCase().includes(query)) || (n && n.toUpperCase().includes(query));
            }).slice(0, 15);

            if (matches.length > 0) {
                studentSearchAutocomplete.innerHTML = '';
                matches.forEach(student => {
                    const regNo = student['Register Number'] || student.regNo;
                    const name = student.Name || student.name;

                    // *** FIX: DEFINE STREAM HERE ***
                    const strm = student.Stream || student.stream || "Regular";
                    // *******************************

                    const item = document.createElement('div');
                    item.className = 'autocomplete-item';
                    item.innerHTML = `
                        <div class="flex justify-between items-center">
                            <span>${regNo.replace(new RegExp(query, 'gi'), '<strong>$&</strong>')} (${name})</span>
                            <span class="text-xs font-bold text-gray-400 uppercase bg-gray-50 px-1 rounded ml-2">${strm}</span>
                        </div>
                        `;

                    item.onclick = () => {
                        studentSearchInput.value = regNo;
                        studentSearchAutocomplete.classList.add('hidden');
                        // Determine which modal view to show
                        if (searchModeGlobalRadio.checked) {
                            showGlobalStudentDetails(regNo);
                        } else {
                            showStudentDetailsModal(regNo, searchSessionSelect.value);
                        }
                    };
                    studentSearchAutocomplete.appendChild(item);
                });
                studentSearchAutocomplete.classList.remove('hidden');
            } else {
                studentSearchAutocomplete.classList.add('hidden');
            }
        }, 250);
    });

    // 3A. Show Single Session Details (Stream-Aware)
    function showStudentDetailsModal(regNo, sessionKey) {
        document.getElementById('search-result-single-view').classList.remove('hidden');
        document.getElementById('search-result-global-view').classList.add('hidden');

        const [date, time] = sessionKey.split(' | ');
        const student = allStudentData.find(s => s.Date === date && s.Time === time && s['Register Number'] === regNo);

        if (!student) { alert("Student not found in this session."); return; }

        const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
        const allocatedSessionData = performOriginalAllocation(sessionStudents);
        const allocatedStudent = allocatedSessionData.find(s => s['Register Number'] === regNo);

        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        const sessionScribeAllotment = allScribeAllotments[sessionKey] || {};
        const scribeRoom = sessionScribeAllotment[regNo];

        loadQPCodes();
        const sessionQPCodes = qpCodeMap[sessionKey] || {};

        // *** FIX: Use Stream-Aware Key ***
        const streamName = student.Stream || "Regular";
        const courseKey = getQpKey(student.Course, streamName);
        const qpCode = sessionQPCodes[courseKey] || "N/A";
        // *********************************

        searchResultName.textContent = student.Name;
        searchResultRegNo.textContent = student['Register Number'];
        document.getElementById('search-result-stream').textContent = streamName;
        document.getElementById('search-result-course').textContent = student.Course;
        document.getElementById('search-result-qpcode').textContent = qpCode;

        if (allocatedStudent && allocatedStudent['Room No'] !== "Unallotted") {
            const roomName = allocatedStudent['Room No'];
            const roomInfo = currentRoomConfig[roomName] || {};
            document.getElementById('search-result-room').textContent = roomName;
            document.getElementById('search-result-seat').textContent = allocatedStudent.seatNumber;
            document.getElementById('search-result-room-location').textContent = roomInfo.location || "N/A";
            document.getElementById('search-result-room-location-block').classList.remove('hidden');
        } else {
            document.getElementById('search-result-room').textContent = "Not Allotted";
            document.getElementById('search-result-seat').textContent = "-";
            document.getElementById('search-result-room-location-block').classList.add('hidden');
        }

        if (scribeRoom) {
            const scribeInfo = currentRoomConfig[scribeRoom] || {};
            document.getElementById('search-result-scribe-room').textContent = scribeRoom;
            document.getElementById('search-result-scribe-room-location').textContent = scribeInfo.location || "N/A";
            document.getElementById('search-result-scribe-block').classList.remove('hidden');
        } else {
            document.getElementById('search-result-scribe-block').classList.add('hidden');
        }

        searchResultModal.classList.remove('hidden');
    }

    // 3B. Show Global Details (Updated with Location)
    function showGlobalStudentDetails(regNo) {
        document.getElementById('search-result-single-view').classList.add('hidden');
        document.getElementById('search-result-global-view').classList.remove('hidden');

        const exams = allStudentData.filter(s => s['Register Number'] === regNo);
        if (exams.length === 0) return;

        exams.sort((a, b) => {
            const d1 = a.Date.split('.').reverse().join('');
            const d2 = b.Date.split('.').reverse().join('');
            return d1.localeCompare(d2) || a.Time.localeCompare(b.Time);
        });

        searchResultName.textContent = exams[0].Name;
        searchResultRegNo.textContent = regNo;

        const tbody = document.getElementById('global-search-table-body');
        tbody.innerHTML = '';

        loadQPCodes();
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');

        exams.forEach(exam => {
            const sessionKey = `${exam.Date} | ${exam.Time}`;
            const sessionQPCodes = qpCodeMap[sessionKey] || {};
            const courseKey = getBase64CourseKey(exam.Course);
            const qpCode = sessionQPCodes[courseKey] || "";
            const qpDisplay = qpCode ? `[QP: ${qpCode}]` : "";
            const streamDisplay = exam.Stream || "Regular";

            // Calculate allocation for this specific session
            const sessionStudents = allStudentData.filter(s => s.Date === exam.Date && s.Time === exam.Time);
            const allocatedSession = performOriginalAllocation(sessionStudents);
            const studentAlloc = allocatedSession.find(s => s['Register Number'] === regNo);

            let roomDisplay = "Not Allotted";
            let rowClass = "";

            if (studentAlloc && studentAlloc['Room No'] !== "Unallotted") {
                const roomName = studentAlloc['Room No'];
                // *** FIX: Get Location ***
                const roomInfo = currentRoomConfig[roomName] || {};
                const location = roomInfo.location ? ` <br><span class="text-xs text-gray-500">(${roomInfo.location})</span>` : "";

                roomDisplay = `<strong>${roomName}</strong> (Seat: ${studentAlloc.seatNumber})${location}`;

                const sessionScribeMap = allScribeAllotments[sessionKey] || {};
                const scribeRoom = sessionScribeMap[regNo];
                if (scribeRoom) {
                    const sInfo = currentRoomConfig[scribeRoom] || {};
                    const sLoc = sInfo.location ? ` (${sInfo.location})` : "";
                    roomDisplay += `<br><span class="text-orange-600 text-xs font-bold">Scribe: ${scribeRoom}${sLoc}</span>`;
                    rowClass = "bg-orange-50";
                }
            }

            const tr = document.createElement('tr');
            if (rowClass) tr.className = rowClass;
            tr.innerHTML = `
                <td class="px-3 py-2 border-b">${exam.Date}</td>
                <td class="px-3 py-2 border-b">${exam.Time}</td>
                <td class="px-3 py-2 border-b text-xs">
                    ${exam.Course}<br>
                    <span class="font-bold text-gray-600">${qpDisplay}</span>
                    <span class="text-indigo-600 ml-1">(${streamDisplay})</span>
                </td>
                <td class="px-3 py-2 border-b text-sm">${roomDisplay}</td>
            `;
            tbody.appendChild(tr);
        });

        searchResultModal.classList.remove('hidden');
    }

    // 4. Close modal button
    modalCloseSearchResult.addEventListener('click', () => {
        searchResultModal.classList.add('hidden');
    });

    // --- END: STUDENT SEARCH FUNCTIONALITY ---
    // ==========================================
    // 🗑️ DELETE COURSE LOGIC
    // ==========================================

    const deleteCourseBtn = document.getElementById('delete-course-btn');

    // 1. Logic to Show/Hide Button (Hook into existing selection logic)
    // We attach a secondary listener to the dropdown for the delete button visibility
    if (editCourseSelect) {
        editCourseSelect.addEventListener('change', () => {
            if (editCourseSelect.value && deleteCourseBtn) {
                deleteCourseBtn.classList.remove('hidden');
            } else if (deleteCourseBtn) {
                deleteCourseBtn.classList.add('hidden');
            }
        });
    }

    // 2. Handle Delete Click
    if (deleteCourseBtn) {
        deleteCourseBtn.addEventListener('click', async () => {
            // Use Globals instead of parsing value again
            const targetCourse = currentEditCourse;
            const targetStream = currentEditStream;
            const sessionVal = editSessionSelect.value;

            if (!targetCourse || !sessionVal) return;

            const [date, time] = sessionVal.split(' | ');

            // Count students to be deleted (Strict Stream Check)
            const studentsToDelete = allStudentData.filter(s => {
                const sStream = s.Stream || "Regular";
                return s.Date === date &&
                    s.Time === time &&
                    s.Course === targetCourse &&
                    sStream === targetStream;
            });

            if (studentsToDelete.length === 0) {
                alert("No students found in this course/stream to delete.");
                return;
            }

            const confirmMsg = `
🛑 DANGER: DELETE COURSE 🛑

Target: ${targetCourse}
Stream: ${targetStream}
Session: ${date} | ${time}
Students: ${studentsToDelete.length} records will be removed.

This action cannot be undone.
Are you sure?
        `;

            if (confirm(confirmMsg)) {
                if (!confirm("Are you absolutely sure?")) return;

                // --- EXECUTE DELETE (Strict Stream Check) ---
                allStudentData = allStudentData.filter(s => {
                    const sStream = s.Stream || "Regular";
                    return !(s.Date === date &&
                        s.Time === time &&
                        s.Course === targetCourse &&
                        sStream === targetStream);
                });

                localStorage.setItem(BASE_DATA_KEY, JSON.stringify(allStudentData));
                alert(`Deleted ${studentsToDelete.length} records.\nThe page will now reload.`);

                if (typeof syncDataToCloud === 'function') {
                // This pushes the updated allStudentData (which is now smaller)
                // to the cloud chunks (the 'heavy' bucket).
                await syncDataToCloud('heavy'); 
                }
                window.location.reload();
            }
        });
    }
    // ==========================================
    // 🚀 SUPER ADMIN LOGIC
    // ==========================================

    const superAdminBtn = document.getElementById('super-admin-btn');
    const superAdminModal = document.getElementById('super-admin-modal');
    const closeSuperModal = document.getElementById('close-super-modal');
    const whitelistInput = document.getElementById('whitelist-email-input');
    const addWhitelistBtn = document.getElementById('add-whitelist-btn');
    const whitelistContainer = document.getElementById('whitelist-container');

    // 1. CHECK IF USER IS SUPER ADMIN
    function checkSuperAdminAccess(user) {
        // FIX: Get element directly to avoid initialization errors
        const btn = document.getElementById('super-admin-btn'); 
        
        if (user.email === SUPER_ADMIN_EMAIL) {
            if (btn) btn.classList.remove('hidden');
        } else {
            if (btn) btn.classList.add('hidden');
        }
    }

    // 2. OPEN MODAL & LOAD LIST
    if (superAdminBtn) {
        superAdminBtn.addEventListener('click', () => {
            superAdminModal.classList.remove('hidden');
            loadWhitelist();
            loadAllCollegesForAdmin(); // <--- ADD THIS LINE
        });
    }

    if (closeSuperModal) {
        closeSuperModal.addEventListener('click', () => {
            superAdminModal.classList.add('hidden');
        });
    }

    // 3. LOAD WHITELIST
    async function loadWhitelist() {
        const { db, doc, getDoc } = window.firebase;
        whitelistContainer.innerHTML = '<li class="text-gray-400 italic">Loading...</li>';

        try {
            const docRef = doc(db, "global", "whitelist");
            const docSnap = await getDoc(docRef);

            whitelistContainer.innerHTML = '';

            if (docSnap.exists()) {
                const data = docSnap.data();
                const emails = data.emails || [];

                if (emails.length === 0) {
                    whitelistContainer.innerHTML = '<li class="text-gray-400 italic">No authorized emails yet.</li>';
                }

                emails.forEach(email => {
                    const li = document.createElement('li');
                    li.className = "flex justify-between items-center border-b border-gray-200 pb-1";
                    li.innerHTML = `
                    <span>${email}</span>
                    <button class="text-red-500 hover:text-red-700 font-bold px-2" onclick="removeFromWhitelist('${email}')">&times;</button>
                `;
                    whitelistContainer.appendChild(li);
                });
            } else {
                whitelistContainer.innerHTML = '<li class="text-gray-400 italic">Whitelist empty. Add first user.</li>';
            }
        } catch (e) {
            console.error("Whitelist Load Error:", e);
            whitelistContainer.innerHTML = '<li class="text-red-500">Error loading list. Check console.</li>';
        }
    }

    // --- NEW: Fetch All Colleges for Dropdown ---
    async function loadAllCollegesForAdmin() {
        const selectEl = document.getElementById('admin-college-select');
        if (!selectEl) return;

        selectEl.innerHTML = '<option>Loading...</option>';
        const { db, collection, getDocs } = window.firebase;

        try {
            const colRef = collection(db, "colleges");
            const snap = await getDocs(colRef);

            if (snap.empty) {
                selectEl.innerHTML = '<option value="">No colleges found</option>';
                return;
            }

            selectEl.innerHTML = '<option value="">-- Select a College --</option>';

            snap.forEach(doc => {
                const data = doc.data();
                const name = data.examCollegeName || "Unnamed College";
                const id = doc.id;

                // Show Name + ID for clarity
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = `${name} (${id})`;
                selectEl.appendChild(opt);
            });

        } catch (e) {
            console.error("Error fetching colleges:", e);
            selectEl.innerHTML = '<option>Error loading list</option>';
        }
    }
    // 4. ADD TO WHITELIST
    if (addWhitelistBtn) {
        addWhitelistBtn.addEventListener('click', async () => {
            const email = whitelistInput.value.trim();
            if (!email || !email.includes('@')) return alert("Invalid Email");

            const { db, doc, setDoc, arrayUnion } = window.firebase;
            addWhitelistBtn.textContent = "Adding...";

            try {
                await setDoc(doc(db, "global", "whitelist"), {
                    emails: arrayUnion(email)
                }, { merge: true });

                whitelistInput.value = '';
                loadWhitelist();
                alert(`✅ ${email} authorized!`);
            } catch (e) {
                alert("Error: " + e.message);
            } finally {
                addWhitelistBtn.textContent = "Add";
            }
        });
    }

    // 5. REMOVE FROM WHITELIST
    window.removeFromWhitelist = async function (email) {
        if (!confirm(`Revoke authorization for ${email}?`)) return;

        const { db, doc, updateDoc, arrayRemove } = window.firebase;
        try {
            await updateDoc(doc(db, "global", "whitelist"), {
                emails: arrayRemove(email)
            });
            loadWhitelist();
        } catch (e) {
            alert("Error: " + e.message);
        }
    };
    // 6. SET STORAGE LIMIT (SUPER ADMIN) - UPDATED
    const setLimitBtn = document.getElementById('set-limit-btn');
    const adminCollegeSelect = document.getElementById('admin-college-select'); // <--- UPDATED ID
    const adminStorageLimitInput = document.getElementById('admin-storage-limit');

    if (setLimitBtn) {
        setLimitBtn.addEventListener('click', async () => {
            // <--- UPDATED: Get value from Select, not Input
            const targetCollegeId = adminCollegeSelect.value;
            const limitMB = parseFloat(adminStorageLimitInput.value);

            if (!targetCollegeId) return alert("Please select a College from the list.");
            if (!limitMB || limitMB <= 0) return alert("Please enter a valid MB limit.");

            const bytes = Math.floor(limitMB * 1024 * 1024);

            const { db, doc, updateDoc } = window.firebase;
            setLimitBtn.textContent = "Updating...";

            try {
                const collegeRef = doc(db, "colleges", targetCollegeId);

                await updateDoc(collegeRef, {
                    storageLimitBytes: bytes
                });

                // Get selected text for nicer alert
                const selectedText = adminCollegeSelect.options[adminCollegeSelect.selectedIndex].text;
                alert(`✅ Success! Limit for '${selectedText}' set to ${limitMB} MB.`);

                adminStorageLimitInput.value = '';
            } catch (e) {
                console.error(e);
                alert("Failed to update limit. " + e.message);
            } finally {
                setLimitBtn.textContent = "Set Limit";
            }
        });
    }
    // --- REPLACEMENT FOR findMyCollege ---
    async function findMyCollege(user) {
        // Run Super Admin Check
        checkSuperAdminAccess(user);

        updateSyncStatus("Searching...", "neutral");
        const { db, collection, query, where, getDocs, doc, getDoc } = window.firebase;
        const email = user.email;

        try {
            // 1. Try to find an EXISTING college where this user is a member
            const collegesRef = collection(db, "colleges");
            const q = query(collegesRef, where("allowedUsers", "array-contains", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // SUCCESS: Found existing college
                const collegeDoc = querySnapshot.docs[0];
                currentCollegeId = collegeDoc.id;
                console.log("Joined College:", currentCollegeId);
                syncDataFromCloud(currentCollegeId);
            } else {
                // FAIL: No college found. 
                // 2. CHECK WHITELIST: Is this user allowed to create a NEW college?
                console.log("Checking whitelist authorization...");
                const whitelistRef = doc(db, "global", "whitelist");
                const whitelistSnap = await getDoc(whitelistRef);

                let isAuthorized = false;
                if (whitelistSnap.exists()) {
                    const allowedEmails = whitelistSnap.data().emails || [];
                    if (allowedEmails.includes(email) || email === SUPER_ADMIN_EMAIL) {
                        isAuthorized = true;
                    }
                } else if (email === SUPER_ADMIN_EMAIL) {
                    // Allow Super Admin to create the very first DB
                    isAuthorized = true;
                }

                if (isAuthorized) {
                    if (confirm("No existing database found for your account, but you are AUTHORIZED.\n\nClick OK to create a new College Database.")) {
                        await createNewCollege(user);
                    }
                } else {
                    // BLOCKED
                    alert("⛔ ACCESS DENIED ⛔\n\nYou are not part of any college team, and you are not authorized to create a new database.\n\nPlease contact the Super Admin to get access.");
                    const { auth, signOut } = window.firebase;
                    signOut(auth).then(() => location.reload());
                }
            }
        } catch (e) {
            console.error("Error finding college:", e);
            updateSyncStatus("Auth Error", "error");
        }
    }
    // 7. SWITCH COLLEGE (SUPER ADMIN)
    const btnAdminSwitch = document.getElementById('btn-admin-switch-college');
    if (btnAdminSwitch) {
        btnAdminSwitch.addEventListener('click', () => {
            const select = document.getElementById('admin-college-select');
            const newCollegeId = select.value;

            if (!newCollegeId) return alert("Please select a college to access.");

            if (confirm(`Switch dashboard to view data for this college?\nID: ${newCollegeId}`)) {
                // 1. Update Global ID
                currentCollegeId = newCollegeId;

                // 2. Trigger Sync
                syncDataFromCloud(newCollegeId);

                // 3. Close Modal
                const modal = document.getElementById('super-admin-modal');
                if (modal) modal.classList.add('hidden');

                alert("✅ Switched! Loading data...");
            }
        });
    }
    // --- Helper: Generate Unique Key for Comparison ---
    // We compare only Date, Time, and Register Number (User Requirement)
    function getRecordKey(row) {
        const d = row.Date ? row.Date.toString().trim().toUpperCase() : "";
        const t = row.Time ? row.Time.toString().trim().toUpperCase() : "";
        const r = row['Register Number'] ? row['Register Number'].toString().trim().toUpperCase() : "";
        // If existing data doesn't have a stream, assume 'Regular' (legacy support)
        const s = row.Stream ? row.Stream.toString().trim().toUpperCase() : "REGULAR";
        return `${d}|${t}|${r}|${s}`;
    }

    // ==========================================
    // 📄 CSV & TEMPLATE LOGIC (Advanced Merge)
    // ==========================================

    const SAMPLE_CSV_CONTENT = `Date,Time,Course,Register Number,Name
24.11.2025,2:00 PM,ARA1FA102 (1) - BASIC ARABIC LANGUAGE SKILLS [ARABIC 2024 SYLLABUS],ABCDEFC001,NAME ONE
24.11.2025,2:00 PM,ARA1FA102 (1) - BASIC ARABIC LANGUAGE SKILLS [ARABIC 2024 SYLLABUS],ABCDEFC002,NAME TWO`;

    // Modal Elements
    const conflictModal = document.getElementById('csv-conflict-modal');
    const conflictExistingCount = document.getElementById('conflict-existing-count');
    const conflictTotalNew = document.getElementById('conflict-total-new');
    const conflictUniqueCount = document.getElementById('conflict-unique-count');
    const btnMerge = document.getElementById('btn-merge-data');
    const btnReplace = document.getElementById('btn-replace-data');
    const btnCancel = document.getElementById('btn-cancel-upload');

    // Temp storage for the uploaded data
    let tempNewData = [];
    let tempUniqueData = [];

    // 1. Download Template Button
    const downloadSampleBtn = document.getElementById('download-sample-csv-btn');
    if (downloadSampleBtn) {
        downloadSampleBtn.addEventListener('click', () => {
            const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "Student_Data_Template.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // 2. Load CSV Button (Primary)
    const mainLoadCsvBtn = document.getElementById('main-load-csv-btn');
    const mainCsvInput = document.getElementById('main-csv-upload');
    const mainCsvStatus = document.getElementById('main-csv-status');

    if (mainLoadCsvBtn) {
        mainLoadCsvBtn.addEventListener('click', () => {
            const file = mainCsvInput.files[0];
            if (!file) {
                mainCsvStatus.textContent = "Please select a CSV file first.";
                mainCsvStatus.className = "text-sm font-medium text-red-600";
                return;
            }

            mainCsvStatus.textContent = "Analyzing file...";
            mainCsvStatus.className = "text-sm font-medium text-blue-600";

            const reader = new FileReader();
            reader.onload = (event) => {
                const csvText = event.target.result;
                // Capture the selected stream
                const selectedStream = csvStreamSelect.value;

                try {
                    // Pass stream to parser
                    tempNewData = parseCsvRaw(csvText, selectedStream);

                    if (tempNewData.length === 0) {
                        throw new Error("No valid data found in CSV.");
                    }

                    // Step B: Check against existing data
                    if (!allStudentData || allStudentData.length === 0) {
                        // No existing data, load directly
                        loadStudentData(tempNewData);
                    } else {
                        // *** UPDATED: Use the new getRecordKey helper ***
                        const existingKeys = new Set(allStudentData.map(getRecordKey));

                        tempUniqueData = tempNewData.filter(s => {
                            return !existingKeys.has(getRecordKey(s));
                        });
                        // ************************************************

                        // Step C: Show Options Modal
                        conflictExistingCount.textContent = allStudentData.length;
                        conflictTotalNew.textContent = tempNewData.length;
                        conflictUniqueCount.textContent = tempUniqueData.length;

                        if (tempUniqueData.length === 0) {
                            btnMerge.innerHTML = "No New Records (All Duplicates)";
                            btnMerge.disabled = true;
                            btnMerge.classList.add('opacity-50', 'cursor-not-allowed');
                            btnMerge.classList.remove('bg-green-600', 'hover:bg-green-700');
                            btnMerge.classList.add('bg-gray-400');
                        } else {
                            btnMerge.innerHTML = `✅ Add <strong>${tempUniqueData.length}</strong> New Records (Merge)`;
                            btnMerge.disabled = false;
                            btnMerge.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
                            btnMerge.classList.add('bg-green-600', 'hover:bg-green-700');
                        }

                        const conflictModal = document.getElementById('csv-conflict-modal');
                        conflictModal.classList.remove('hidden');
                    }

                } catch (e) {
                    console.error(e);
                    mainCsvStatus.textContent = "Error parsing CSV: " + e.message;
                    mainCsvStatus.className = "text-sm font-medium text-red-600";
                }
            };
            reader.onerror = () => {
                mainCsvStatus.textContent = "Error reading file.";
                mainCsvStatus.className = "text-sm font-medium text-red-600";
            };
            reader.readAsText(file);
        });
    }

    // --- Modal Button Handlers ---

    if (btnMerge) {
        btnMerge.addEventListener('click', () => {
            const mergedData = [...allStudentData, ...tempUniqueData];
            loadStudentData(mergedData);
            conflictModal.classList.add('hidden');
        });
    }

    if (btnReplace) {
        btnReplace.addEventListener('click', () => {
            // Ask one last time
            if (confirm("Are you sure you want to overwrite ALL existing data? This cannot be undone.")) {
                loadStudentData(tempNewData);
                conflictModal.classList.add('hidden');
            }
        });
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            conflictModal.classList.add('hidden');
            mainCsvStatus.textContent = "Upload cancelled.";
            mainCsvStatus.className = "text-sm font-medium text-gray-600";
        });
    }

    // --- Helper: Parse CSV String to JSON (Smart Stream & Source) ---
    function parseCsvRaw(csvText, streamName = "Regular") {
        const lines = csvText.trim().split('\n');
        const headersLine = lines.shift().trim();
        const headers = headersLine.split(',');

        const dateIndex = headers.indexOf('Date');
        const timeIndex = headers.indexOf('Time');
        const courseIndex = headers.indexOf('Course');
        const regNumIndex = headers.indexOf('Register Number');
        const nameIndex = headers.indexOf('Name');
        const streamIndex = headers.indexOf('Stream');
        const sourceIndex = headers.indexOf('Source File'); // <--- NEW Check

        if (regNumIndex === -1 || nameIndex === -1 || courseIndex === -1) {
            throw new Error("Missing required headers (Register Number, Name, Course)");
        }

        const parsedData = [];

        for (const line of lines) {
            if (!line.trim()) continue;

            const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            const values = line.split(regex).map(val => val.trim().replace(/^"|"$/g, ''));

            if (values.length === headers.length) {

                // 1. Stream Priority
                let rowStream = streamName;
                if (streamIndex !== -1) {
                    const csvValue = values[streamIndex];
                    if (csvValue && csvValue.trim() !== "") {
                        rowStream = csvValue.trim();
                    }
                }

                // 2. Source File Priority (Capture or Default)
                let rowSource = "Manual Upload";
                if (sourceIndex !== -1) {
                    const sourceVal = values[sourceIndex];
                    if (sourceVal && sourceVal.trim() !== "") {
                        rowSource = sourceVal.trim();
                    }
                }

                parsedData.push({
                    'Date': values[dateIndex],
                    'Time': cleanTime, // <--- USE NORMALIZED TIME
                    'Course': values[courseIndex],
                    'Register Number': values[regNumIndex],
                    'Name': values[nameIndex],
                    'Stream': rowStream,
                    'Source File': rowSource // <--- NEW Field
                });
            }
        }

        // Sort the new data
        try {
            parsedData.sort((a, b) => {
                const keyA = getJsSortKey(a);
                const keyB = getJsSortKey(b);
                if (keyA.dateObj.getTime() !== keyB.dateObj.getTime()) return keyA.dateObj - keyB.dateObj;
                if (keyA.timeObj.getTime() !== keyB.timeObj.getTime()) return keyA.timeObj - keyB.timeObj;
                return keyA.courseName.localeCompare(keyB.courseName);
            });
        } catch (e) { console.warn("Sort failed", e); }

        return parsedData;
    }
    // --- Helper: Convert JSON Data to CSV String (With Source File) ---
    function convertToCSV(objArray) {
        const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;

        // Add 'Source File' to header
        let str = 'Date,Time,Course,Register Number,Name,Stream,Source File\r\n';

        for (let i = 0; i < array.length; i++) {
            let line = '';

            const date = array[i].Date || "";
            const time = array[i].Time || "";
            const course = (array[i].Course || "").replace(/"/g, '""');
            const reg = array[i]['Register Number'] || "";
            const name = (array[i].Name || "").replace(/"/g, '""');
            const stream = array[i].Stream || "Regular";
            const source = (array[i]['Source File'] || "Unknown").replace(/"/g, '""'); // <--- NEW

            // Wrap strings in quotes
            line = `${date},${time},"${course}",${reg},"${name}",${stream},"${source}"`;
            str += line + '\r\n';
        }
        return str;
    }

    // --- Helper: Load Data into App & Cloud ---
    function loadStudentData(dataArray) {
        // 1. Update Global Var
        allStudentData = dataArray;

        // 2. Update Data Stores
        const jsonStr = JSON.stringify(dataArray);
        jsonDataStore.innerHTML = jsonStr;
        localStorage.setItem(BASE_DATA_KEY, jsonStr);

        // 3. Update UI
        updateUniqueStudentList();
        populate_session_dropdown();
        populate_qp_code_session_dropdown();
        populate_room_allotment_session_dropdown();
        updateDashboard();

        // 4. ENABLE ALL TABS AND BUTTONS
        disable_absentee_tab(false);
        disable_qpcode_tab(false);
        disable_room_allotment_tab(false);
        disable_scribe_settings_tab(false);
        disable_edit_data_tab(false);

        // Enable Report Buttons
        const reportBtns = [
            'generate-report-button',
            'generate-daywise-report-button',
            'generate-qpaper-report-button',
            'generate-qp-distribution-report-button',
            'generate-scribe-report-button',
            'generate-scribe-proforma-button',
            'generate-invigilator-report-button',
            'generate-absentee-report-button'
        ];

        reportBtns.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });

        // 5. Sync
        if (typeof syncDataToCloud === 'function') syncDataToCloud('heavy');

        // 6. Feedback
        if (mainCsvStatus) {
            mainCsvStatus.textContent = `Success! Loaded ${allStudentData.length} records.`;
            mainCsvStatus.className = "text-sm font-medium text-green-600";
        }

        // [REMOVED] Step 7. CSV Download Logic
        // This prevents the "Option 2" button from being overwritten with total data.
    }

    // ==========================================
    // 🐍 PYTHON INTEGRATION (Connects PDF to Merge Logic)
    // ==========================================

    window.handlePythonExtraction = function (jsonString) {
        console.log("Received data from Python...");

        const pdfStreamSelect = document.getElementById('pdf-stream-select');
        const selectedStream = pdfStreamSelect ? (pdfStreamSelect.value || "Regular") : "Regular";

        try {
            let parsedData = JSON.parse(jsonString);

            // INJECT STREAM TAG INTO PYTHON DATA
            parsedData = parsedData.map(item => ({
                ...item,
                Time: normalizeTime(item.Time), // <--- FIX APPLIED HERE
                Stream: selectedStream
            }));

            if (parsedData.length === 0) {
                alert("Extraction completed, but no student data was found.");
                return;
            }

            // --- Generate Download Button for JUST this extraction ---
            const downloadContainer = document.getElementById('csv-download-container');
            if (downloadContainer) {
                const csvContent = convertToCSV(parsedData);
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);

                downloadContainer.innerHTML = `
                <a href="${url}" download="New_Extracted_Data_${new Date().getTime()}.csv" 
                   class="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                   <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                   Download Extracted Data Only (${parsedData.length} rows)
                </a>
            `;
            }

            // --- CONFIRMATION STEP (New) ---
            // Allows you to stop here (e.g., just to download CSV) without modifying system data
            const confirmMsg = `✅ Extraction Complete!\n\nFound ${parsedData.length} records for "${selectedStream}" stream.\n\nClick OK to proceed with merging/loading this data into the system.\nClick Cancel to stop (you can still download the CSV).`;

            if (!confirm(confirmMsg)) {
                return;
            }

            // 1. Assign to temp variable
            tempNewData = parsedData;

            // 2. Check against existing data
            if (!allStudentData || allStudentData.length === 0) {
                loadStudentData(tempNewData);
            } else {
                const existingKeys = new Set(allStudentData.map(getRecordKey));

                tempUniqueData = tempNewData.filter(s => {
                    return !existingKeys.has(getRecordKey(s));
                });

                // 3. Show Options Modal
                conflictExistingCount.textContent = allStudentData.length;
                conflictTotalNew.textContent = tempNewData.length;
                conflictUniqueCount.textContent = tempUniqueData.length;

                if (tempUniqueData.length === 0) {
                    btnMerge.innerHTML = "No New Records (All Duplicates)";
                    btnMerge.disabled = true;
                    btnMerge.classList.add('opacity-50', 'cursor-not-allowed');
                    btnMerge.classList.remove('bg-green-600', 'hover:bg-green-700');
                    btnMerge.classList.add('bg-gray-400');
                } else {
                    btnMerge.innerHTML = `✅ Add <strong>${tempUniqueData.length}</strong> New Records (Merge)`;
                    btnMerge.disabled = false;
                    btnMerge.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
                    btnMerge.classList.add('bg-green-600', 'hover:bg-green-700');
                }

                const conflictModal = document.getElementById('csv-conflict-modal');
                conflictModal.classList.remove('hidden');
            }

        } catch (e) {
            console.error("Error processing Python data:", e);
            alert("An error occurred while processing the extracted data.");
        }
    };


    // ==========================================
    // 🌊 STREAM MANAGEMENT LOGIC (Chunk 1)
    // ==========================================

    const streamContainer = document.getElementById('stream-config-container');
    const newStreamInput = document.getElementById('new-stream-input');
    const addStreamBtn = document.getElementById('add-stream-btn');
    const csvStreamSelect = document.getElementById('csv-stream-select');
    const pdfStreamSelect = document.getElementById('pdf-stream-select');

    // Load Streams
    function loadStreamConfig() {
        const saved = localStorage.getItem(STREAM_CONFIG_KEY);
        if (saved) {
            currentStreamConfig = JSON.parse(saved);
        } else {
            currentStreamConfig = ["Regular"]; // Default
            localStorage.setItem(STREAM_CONFIG_KEY, JSON.stringify(currentStreamConfig));
        }
        renderStreamSettings();
        populateStreamDropdowns();
    }

    // Render Settings List (Lock-Aware)
    function renderStreamSettings() {
        if (!streamContainer) return;
        streamContainer.innerHTML = '';
        currentStreamConfig.forEach((stream, index) => {
            const div = document.createElement('div');
            div.className = "flex justify-between items-center bg-white border p-2 rounded text-sm";

            let actionHtml = '';
            if (index === 0) {
                actionHtml = '<span class="text-xs text-gray-400">(Default)</span>';
            } else {
                // Only show delete button if UNLOCKED
                if (!isStreamSettingsLocked) {
                    actionHtml = `<button class="text-red-500 hover:text-red-700 font-bold px-2" onclick="deleteStream('${stream}')">&times;</button>`;
                }
            }

            div.innerHTML = `
                <span class="font-medium">${stream}</span>
                ${actionHtml}
            `;
            streamContainer.appendChild(div);
        });
    }
    // Populate Dropdowns (Fixed: Variable Name Typo)
    function populateStreamDropdowns() {
        const streamsToRender = (currentStreamConfig && currentStreamConfig.length > 0)
            ? currentStreamConfig
            : ["Regular"];

        const optionsHtml = streamsToRender.map(s => `<option value="${s}">${s}</option>`).join('');

        // Logic: Only show dropdown wrappers if more than 1 stream exists
        const shouldShow = streamsToRender.length > 1;

        // 1. CSV Dropdown
        if (csvStreamSelect) {
            csvStreamSelect.innerHTML = optionsHtml;
            const wrapper = document.getElementById('csv-stream-wrapper');
            if (wrapper) {
                if (shouldShow) wrapper.classList.remove('hidden');
                else wrapper.classList.add('hidden');
            }
        }

        // 2. PDF Dropdown
        if (pdfStreamSelect) {
            pdfStreamSelect.innerHTML = optionsHtml;
            const wrapper = document.getElementById('pdf-stream-wrapper');
            if (wrapper) {
                if (shouldShow) wrapper.classList.remove('hidden');
                else wrapper.classList.add('hidden');
            }
        }

        // 3. Report Filter
        const reportStreamSelect = document.getElementById('reports-stream-select');
        const reportWrapper = document.getElementById('reports-stream-dropdown-container');
        if (reportStreamSelect) {
            reportStreamSelect.innerHTML = `<option value="all">All Streams (Combined)</option>` + optionsHtml;
            if (reportWrapper) {
                // FIX: Changed 'wrapper' to 'reportWrapper'
                if (shouldShow) reportWrapper.classList.remove('hidden');
                else reportWrapper.classList.add('hidden');
            }
        }

        // 4. Remuneration: Bill Stream Select
        const billStreamSelect = document.getElementById('bill-stream-select');
        if (billStreamSelect) {
            billStreamSelect.innerHTML = optionsHtml;
        }

        // 5. Remuneration: Rate Card Selector
        const rateStreamSelect = document.getElementById('rate-stream-selector');
        if (rateStreamSelect) {
            rateStreamSelect.innerHTML = optionsHtml;
        }
    }

    // Also expose this function globally if needed by remuneration.js init
    window.populateRemunerationDropdowns = populateStreamDropdowns;


    // Add Stream
    if (addStreamBtn) {
        addStreamBtn.addEventListener('click', () => {
            const name = newStreamInput.value.trim();
            if (name && !currentStreamConfig.includes(name)) {
                currentStreamConfig.push(name);
                localStorage.setItem(STREAM_CONFIG_KEY, JSON.stringify(currentStreamConfig));
                newStreamInput.value = '';
                loadStreamConfig();
                syncDataToCloud('settings'); // Sync setting change
            } else if (currentStreamConfig.includes(name)) {
                alert("Stream already exists.");
            }
        });
    }

    // Delete Stream (Safe Version)
    window.deleteStream = function (name) {
        if (currentStreamConfig.length <= 1) {
            alert("You must have at least one stream defined (e.g., Regular).");
            return;
        }

        if (confirm(`Delete stream "${name}"?`)) {
            currentStreamConfig = currentStreamConfig.filter(s => s !== name);
            localStorage.setItem(STREAM_CONFIG_KEY, JSON.stringify(currentStreamConfig));
            loadStreamConfig();
            syncDataToCloud('settings');
        }
    };
    // --- Event listener for "Generate Room Allotment Summary" ---
    const generateRoomSummaryButton = document.getElementById('generate-room-summary-button');

    if (generateRoomSummaryButton) {
        generateRoomSummaryButton.addEventListener('click', async () => {
            const sessionKey = reportsSessionSelect.value;
            if (filterSessionRadio.checked && !checkManualAllotment(sessionKey)) { return; }

            generateRoomSummaryButton.disabled = true;
            generateRoomSummaryButton.textContent = "Generating...";
            reportOutputArea.innerHTML = "";
            reportControls.classList.add('hidden');
            await new Promise(resolve => setTimeout(resolve, 50));

            try {
                currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
                getRoomCapacitiesFromStorage(); // Ensure config is loaded

                // 1. Get Session Data
                const [date, time] = sessionKey.split(' | ');

                // 2. Fetch Allotments
                const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
                const sessionRegularAllotment = allAllotments[sessionKey] || [];

                const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
                const sessionScribeMap = allScribeAllotments[sessionKey] || {};

                // 3. Get Serial Numbers (Unified)
                const roomSerialMap = getRoomSerialMap(sessionKey);

                // 4. Prepare Data Structure
                const roomGroups = {}; // { "Regular": [rooms], "Distance": [rooms], "Scribe": [rooms] }

                // A. Process Regular/Distance Rooms
                sessionRegularAllotment.forEach(room => {
                    const stream = room.stream || "Regular";
                    if (!roomGroups[stream]) roomGroups[stream] = [];

                    roomGroups[stream].push({
                        serial: roomSerialMap[room.roomName] || 999,
                        name: room.roomName,
                        count: room.students.length,
                        type: 'normal'
                    });
                });

                // B. Process Scribe Rooms
                // Invert map: { roomName: [students] }
                const scribeRoomsInv = {};
                Object.entries(sessionScribeMap).forEach(([regNo, roomName]) => {
                    if (!scribeRoomsInv[roomName]) scribeRoomsInv[roomName] = 0;
                    scribeRoomsInv[roomName]++;
                });

                if (Object.keys(scribeRoomsInv).length > 0) {
                    roomGroups['Scribe'] = [];
                    Object.entries(scribeRoomsInv).forEach(([roomName, count]) => {
                        roomGroups['Scribe'].push({
                            serial: roomSerialMap[roomName] || 999,
                            name: roomName,
                            count: count,
                            type: 'scribe'
                        });
                    });
                }

                // 5. Sort Streams (Regular First)
                const sortedStreams = Object.keys(roomGroups).sort((a, b) => {
                    if (a === "Regular") return -1;
                    if (b === "Regular") return 1;
                    if (a === "Scribe") return 1; // Scribe last
                    if (b === "Scribe") return -1;
                    return a.localeCompare(b);
                });

                // 6. Generate HTML
                let tableContent = '';
                let grandTotalStudents = 0;
                let grandTotalRooms = 0;

                sortedStreams.forEach(stream => {
                    const rooms = roomGroups[stream];
                    // Sort rooms by Serial Number
                    rooms.sort((a, b) => a.serial - b.serial);

                    // Stream Header
                    tableContent += `
                    <tr class="bg-gray-100 print:bg-gray-100">
                        <td colspan="3" style="padding: 8px; font-weight: bold; border: 1px solid #000; text-transform: uppercase; font-size: 0.9em;">
                            ${stream} Stream
                        </td>
                    </tr>
                `;

                    let streamTotal = 0;
                    rooms.forEach(room => {
                        const roomInfo = currentRoomConfig[room.name] || {};
                        const location = roomInfo.location ? `${room.name} <span class="text-xs text-gray-500">(${roomInfo.location})</span>` : room.name;

                        tableContent += `
                        <tr>
                            <td style="padding: 6px; border: 1px solid #000; text-align: center; width: 15%; font-weight: bold;">
                                ${room.serial}
                            </td>
                            <td style="padding: 6px; border: 1px solid #000; width: 65%;">
                                ${location}
                            </td>
                            <td style="padding: 6px; border: 1px solid #000; text-align: center; width: 20%; font-weight: bold;">
                                ${room.count}
                            </td>
                        </tr>
                    `;
                        streamTotal += room.count;
                    });

                    // Stream Subtotal (Optional, but good for checking)
                    // tableContent += `<tr><td colspan="2" class="text-right pr-2 font-bold border border-black">Total:</td><td class="text-center font-bold border border-black">${streamTotal}</td></tr>`;

                    grandTotalStudents += streamTotal;
                    grandTotalRooms += rooms.length;
                });

                const reportHtml = `
                <div class="print-page">
                    <div class="print-header-group" style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
                        <h1>${currentCollegeName}</h1>
                        <h2>Room Allotment Summary</h2>
                        <h3>${date} &nbsp;|&nbsp; ${time}</h3>
                    </div>

                    <table class="w-full border-collapse border border-black text-sm">
                        <thead>
                            <tr class="bg-gray-200 print:bg-gray-200">
                                <th style="padding: 8px; border: 1px solid #000; text-align: center;">Serial No</th>
                                <th style="padding: 8px; border: 1px solid #000; text-align: left;">Location / Room</th>
                                <th style="padding: 8px; border: 1px solid #000; text-align: center;">Students Allotted</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableContent}
                        </tbody>
                        <tfoot>
                            <tr class="bg-gray-100 print:bg-gray-100">
                                <td colspan="2" style="padding: 8px; border: 1px solid #000; text-align: right; font-weight: bold;">
                                    GRAND TOTAL (${grandTotalRooms} Rooms):
                                </td>
                                <td style="padding: 8px; border: 1px solid #000; text-align: center; font-weight: bold; font-size: 1.1em;">
                                    ${grandTotalStudents}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div style="margin-top: 40px; display: flex; justify-content: space-between;">
                        <div class="text-xs text-gray-500">Generated by ExamFlow</div>
                        <div class="text-center">
                            <div style="border-top: 1px solid #000; width: 200px; padding-top: 5px; font-weight: bold;">
                                Chief Superintendent
                            </div>
                        </div>
                    </div>
                </div>
            `;

                reportOutputArea.innerHTML = reportHtml;
                reportOutputArea.style.display = 'block';
                reportStatus.textContent = `Generated summary for ${grandTotalRooms} rooms.`;
                reportControls.classList.remove('hidden');
                lastGeneratedReportType = "Room_Summary";

            } catch (e) {
                console.error(e);
                alert("Error: " + e.message);
            } finally {
                generateRoomSummaryButton.disabled = false;
                generateRoomSummaryButton.textContent = "Generate Room Allotment Summary";
            }
        });
    }
    // --- Stream Lock Toggle Logic ---
    const toggleStreamLockBtn = document.getElementById('toggle-stream-lock-btn');
    const streamInputGroup = document.getElementById('stream-input-group');

    if (toggleStreamLockBtn) {
        toggleStreamLockBtn.addEventListener('click', () => {
            isStreamSettingsLocked = !isStreamSettingsLocked;

            // Update UI based on state
            if (isStreamSettingsLocked) {
                // LOCKED STATE
                toggleStreamLockBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg><span>List Locked</span>`;
                toggleStreamLockBtn.className = "text-xs flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-200 transition shadow-sm";

                if (streamInputGroup) streamInputGroup.classList.add('hidden'); // Hide Add inputs
            } else {
                // UNLOCKED STATE
                toggleStreamLockBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg><span>Unlocked</span>`;
                toggleStreamLockBtn.className = "text-xs flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-100 transition shadow-sm";

                if (streamInputGroup) streamInputGroup.classList.remove('hidden'); // Show Add inputs
            }

            renderStreamSettings(); // Re-render list to show/hide delete buttons
        });
    }
    // Also update real_disable_all_report_buttons to include the new button
    const originalDisableFuncV2 = window.real_disable_all_report_buttons;
    window.real_disable_all_report_buttons = function (disabled) {
        if (originalDisableFuncV2) originalDisableFuncV2(disabled);
        const btn = document.getElementById('generate-room-summary-button');
        if (btn) btn.disabled = disabled;
    };
    // ==========================================
    // ==========================================
    // ☢️ NUKE & SETTINGS MANAGER
    // ==========================================

    const nukeBtn = document.getElementById('nuke-it-all-btn');
    const backupSettingsBtn = document.getElementById('backup-settings-btn');
    const restoreSettingsBtn = document.getElementById('restore-settings-btn');
    const restoreSettingsInput = document.getElementById('restore-settings-input');

    // B. NUKE IT ALL (Master Reset - Selective Wipe)
    if (nukeBtn) {
        nukeBtn.addEventListener('click', async () => {
            // 1. Safety Backup Prompt
            if (confirm("🛡️ CRITICAL SAFETY CHECK 🛡️\n\nBefore you destroy data...\nWould you like to download a FINAL BACKUP (CSV + JSON)?\n\n• Click OK to Backup first.\n• Click Cancel to proceed without backup.")) {
                await triggerSafetyBackup();
            }

            // 2. Level 1 Warning
            if (!confirm("⚠ NUCLEAR LAUNCH DETECTED ⚠\n\nYou are initiating a DESTRUCTIVE sequence for this College Database.\n\nAre you sure you want to proceed?")) {
                return;
            }

            // 3. Payload Selection
            const choice = prompt(
                "☢️ SELECT PAYLOAD YIELD ☢️\n\n" +
                "Type 'DATA' to wipe Students & Allotments (Keeps Rooms/Settings)\n" +
                "Type 'FULL' to wipe All Exam Data, Rooms & College Name (Keeps Invigilators)\n\n" +
                "Enter payload type below:"
            );

            if (!choice) return;
            const mode = choice.trim().toUpperCase();

            if (mode !== 'DATA' && mode !== 'FULL') {
                alert("🚫 LAUNCH ABORTED 🚫\n\nInvalid payload type.\nSystem returning to safe mode.");
                return;
            }

            // 4. Final Security Check
            const confirmCode = prompt(`⚠ FINAL SECURITY CHECK ⚠\n\nTo authorize this ${mode} reset, type 'DELETE' in the box below:`);

            if (confirmCode !== 'DELETE') {
                alert("🚫 ACCESS DENIED 🚫\n\nIncorrect launch code.\nThe nuclear payload has been disarmed.");
                return;
            }

            // 5. EXECUTION
            nukeBtn.textContent = "🚀 MISSILES FIRED...";
            nukeBtn.disabled = true;

            try {
                const { db, doc, writeBatch, updateDoc, collection, getDocs } = window.firebase;
                
                // --- DEFINE TARGET LISTS FOR LOCAL STORAGE ---
                // List 1: Student Data & Operations (Target of DATA mode)
                const dataKeys = [
                    'examBaseData',        // Students
                    'examRoomAllotment',   // Seating
                    'examScribeAllotment', // Scribe Mapping
                    'examAbsenteeList',    // Absentees
                    'examQPCodes',         // QP Codes
                    'examScribeList'       // Scribe List
                ];

                // List 2: Infrastructure & Settings (Target of FULL mode)
                const settingsKeys = [
                    'examRoomConfig',      // Rooms
                    'examStreamsConfig',   // Streams
                    'examSessionNames',    // Exam Names
                    'examRulesConfig',     // Exam Schedule
                    'examCollegeName'      // College Name
                ];

                // Determine what to wipe locally
                let keysToWipe = [...dataKeys]; // DATA mode always wipes data
                if (mode === 'FULL') {
                    keysToWipe = [...dataKeys, ...settingsKeys]; // FULL adds settings
                }

                // --- A. LOCAL WIPE (Browser) ---
                keysToWipe.forEach(key => localStorage.removeItem(key));

                // --- B. CLOUD WIPE (Firebase) ---
                if (currentCollegeId) {
                    const batch = writeBatch(db);
                    const mainRef = doc(db, "colleges", currentCollegeId);
                    const cid = currentCollegeId;

                    // 1. Delete Sub-Collections based on Mode
                    const collectionsToDelete = ['operations', 'allocation', 'slots']; // Always wipe these
                    
                    if (mode === 'FULL') {
                        collectionsToDelete.push('settings'); // Wipe settings too
                        collectionsToDelete.push('staff');    // Wipe staff too (optional, usually kept safe, but FULL implies deep clean)
                    }

                    collectionsToDelete.forEach(type => {
                        batch.delete(doc(db, "colleges", cid, "system_data", type));
                    });

                    // 2. Prepare Update Object (Reset fields in main doc)
                    const updatePayload = {
                        lastUpdated: new Date().toISOString()
                    };

                    keysToWipe.forEach(key => {
                        // Reset to sensible defaults based on key type
                        if (key === 'examCollegeName') updatePayload[key] = "University of Calicut";
                        else if (key === 'examStreamsConfig') updatePayload[key] = '["Regular"]';
                        else if (key.includes('List') || key.includes('Config')) updatePayload[key] = "[]"; // Arrays
                        else updatePayload[key] = "{}"; // Objects/Maps
                    });

                    // Update Main Document (Selective Erase)
                    batch.update(mainRef, updatePayload);

                    // 3. Delete Data Chunks (Always wipe chunks in both modes)
                    const dataColRef = collection(db, "colleges", currentCollegeId, "data");
                    const chunkSnaps = await getDocs(dataColRef);
                    chunkSnaps.forEach(chunk => batch.delete(chunk.ref));

                    await batch.commit();
                }

                if (mode === 'FULL') {
                    alert("💥 KABOOM! 💥\n\nExam Configuration & Student Data wiped.\nInvigilation Module & Staff data are SAFE.");
                } else {
                    alert("💥 TACTICAL STRIKE SUCCESSFUL 💥\n\nStudent Data wiped.\nSettings & Invigilators remain intact.");
                }

                window.location.reload();

            } catch (e) {
                console.error("Nuke failed:", e);
                alert("⚠️ LAUNCH FAILURE ⚠️\n\nAn error occurred: " + e.message);
                nukeBtn.textContent = "☢️ NUKE IT ALL";
                nukeBtn.disabled = false;
            }
        });
    }

    // 2. BACKUP SETTINGS ONLY
    if (backupSettingsBtn) {
        backupSettingsBtn.addEventListener('click', () => {
            const settingsData = {};
            const settingsKeys = [
                ROOM_CONFIG_KEY,     // Room Settings
                STREAM_CONFIG_KEY,   // Stream Settings
                COLLEGE_NAME_KEY,    // College Name
                SCRIBE_LIST_KEY,     // Global Scribe List
                EXAM_RULES_KEY       // <--- ADD THIS LINE (Exam Schedule)
            ];

            settingsKeys.forEach(key => {
                const val = localStorage.getItem(key);
                if (val) settingsData[key] = val;
            });

            const jsonString = JSON.stringify(settingsData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `ExamFlow_Settings_Backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // 3. RESTORE SETTINGS ONLY
    if (restoreSettingsBtn && restoreSettingsInput) {
        restoreSettingsBtn.addEventListener('click', () => {
            const file = restoreSettingsInput.files[0];
            if (!file) {
                alert("Please select a Settings JSON file first.");
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const settingsData = JSON.parse(e.target.result);
                    let loadedCount = 0;

                    // Keys we accept for settings restore
                    const validKeys = [
                        ROOM_CONFIG_KEY,
                        STREAM_CONFIG_KEY,
                        COLLEGE_NAME_KEY,
                        SCRIBE_LIST_KEY,
                        EXAM_RULES_KEY   // <--- ADD THIS LINE
                    ];

                    validKeys.forEach(key => {
                        if (settingsData[key]) {
                            localStorage.setItem(key, settingsData[key]);
                            loadedCount++;
                        }
                    });

                    if (loadedCount > 0) {
                        alert(`Successfully restored settings configurations.\n\nSyncing to cloud...`);

                        // Update Runtime Variables
                        if (typeof loadRoomConfig === 'function') loadRoomConfig();
                        if (typeof loadStreamConfig === 'function') loadStreamConfig();
                        if (typeof loadGlobalScribeList === 'function') loadGlobalScribeList();
                        if (typeof renderExamNameSettings === 'function') renderExamNameSettings(); // Refresh UI

                        // Sync (THE FIX: Force sync settings & allocation)
                        // REPLACE line 8591 with:
                        if (typeof syncDataToCloud === 'function') {
                        await syncDataToCloud('settings');
                        await syncDataToCloud('allocation'); // In case scribe list is in backup
                        await syncDataToCloud('ops');        // In case QP codes are in backup
                        }

                        alert("Settings updated and synced!");
                    } else {
                        alert("No valid settings found in this file.");
                    }

                } catch (err) {
                    console.error(err);
                    alert("Error parsing settings file: " + err.message);
                }
            };
            reader.readAsText(file);
        });
    }

    // 4. RESTORE FULL DATA (Legacy Button Support)
    // You have an existing listener for 'restore-data-button', but if we hid it 
    // or changed the ID in HTML, ensure this connects:
    const triggerFullRestore = document.getElementById('restore-file-input');
    if (triggerFullRestore) {
        triggerFullRestore.addEventListener('change', () => {
            // If user selects a file via the new "Restore Full Backup" text link/button logic
            // You might need to manually trigger the old restore logic or copy it here.
            // For simplicity, I kept the old logic in the HTML structure above 
            // by linking `onclick` to the hidden input, but we need the `change` event to fire the actual restore.

            // Reuse your existing restore logic:
            const restoreBtn = document.getElementById('restore-data-button');
            if (restoreBtn) restoreBtn.click();
        });
    }

    // --- V65: Initial Data Load on Startup (Clean Version) ---
    function loadInitialData() {
        try {
            console.log("Loading Local Data...");
            updateHeaderCollegeName(); // <--- ADD THIS LINE HERE
            // 1. Load configurations (ALWAYS RUN THESE)
            if (typeof loadRoomConfig === 'function') loadRoomConfig();
            if (typeof loadStreamConfig === 'function') loadStreamConfig();
            if (typeof initCalendar === 'function') initCalendar();

            // *** MOVED HERE: Always render Exam Settings, even if no student data exists ***
            if (typeof renderExamNameSettings === 'function') renderExamNameSettings();
            // ******************************************************************************
            if (typeof initRemunerationModule === 'function') initRemunerationModule();
            // 2. Check for base student data persistence
            const savedDataJson = localStorage.getItem(BASE_DATA_KEY);
            if (savedDataJson) {
                try {
                    const savedData = JSON.parse(savedDataJson);
                    if (savedData && savedData.length > 0) {
                        jsonDataStore.innerHTML = JSON.stringify(savedData);

                        // Enable UI
                        if (typeof disable_absentee_tab === 'function') disable_absentee_tab(false);
                        if (typeof disable_qpcode_tab === 'function') disable_qpcode_tab(false);
                        if (typeof disable_room_allotment_tab === 'function') disable_room_allotment_tab(false);
                        if (typeof disable_scribe_settings_tab === 'function') disable_scribe_settings_tab(false);
                        if (typeof disable_edit_data_tab === 'function') disable_edit_data_tab(false);
                        if (typeof disable_all_report_buttons === 'function') disable_all_report_buttons(false);

                        if (typeof populate_session_dropdown === 'function') populate_session_dropdown();
                        if (typeof populate_qp_code_session_dropdown === 'function') populate_qp_code_session_dropdown();
                        if (typeof populate_room_allotment_session_dropdown === 'function') populate_room_allotment_session_dropdown();
                        if (typeof loadGlobalScribeList === 'function') loadGlobalScribeList();
                        if (typeof updateDashboard === 'function') updateDashboard();

                        // NOTE: renderExamNameSettings was removed from here because it's now in Step 1

                        console.log(`Successfully loaded ${savedData.length} records.`);
                        const statusLog = document.getElementById("status-log");
                        if (statusLog) statusLog.innerHTML = `<p class="mb-1 text-green-700">&gt; Data loaded from memory.</p>`;
                    }
                } catch (e) {
                    console.error("Failed to parse saved student data:", e);
                }
            }
        } catch (criticalError) {
            console.error("CRITICAL APP STARTUP ERROR:", criticalError);
            if (typeof finalizeAppLoad === 'function') finalizeAppLoad();
        }
    }

    // ==========================================
    // 💰 REMUNERATION LOGIC (FINAL - B&W + EXAM FILTER)
    // ==========================================

    // 1. Navigation Listener
    if (navRemuneration) {
        navRemuneration.addEventListener('click', () => {
            showView(viewRemuneration, navRemuneration);
            if (typeof initRemunerationModule === 'function') initRemunerationModule();
            // Auto-populate exam names when tab opens
            populateBillExamDropdown();
        });
    }

    // 2. Elements
    const billModeSelect = document.getElementById('bill-mode-select');
    const billDateRange = document.getElementById('bill-date-range');
    const billExamDropdownContainer = document.getElementById('bill-exam-dropdown-container');
    const billExamSelect = document.getElementById('bill-exam-select');
    const billStreamSelect = document.getElementById('bill-stream-select');

    // Helper: Populate Exam Name Dropdown
    function populateBillExamDropdown() {
        if (!billExamSelect) return;

        const selectedStream = billStreamSelect ? billStreamSelect.value : "Regular";

        // 1. Find all unique exam names for the selected stream
        const examNames = new Set();

        // We need to iterate unique sessions to get their exam names
        const sessions = new Set();
        if (allStudentData) {
            allStudentData.forEach(s => {
                // Stream Filter
                const sStream = s.Stream || "Regular";
                if (selectedStream === "Regular" && sStream !== "Regular") return;
                if (selectedStream !== "Regular" && sStream === "Regular") return;

                const sessionKey = `${s.Date} | ${s.Time}`;
                if (!sessions.has(sessionKey)) {
                    sessions.add(sessionKey);
                    // Lookup Exam Name
                    const name = getExamName(s.Date, s.Time, sStream);
                    if (name) examNames.add(name);
                }
            });
        }

        // 2. Populate Select
        billExamSelect.innerHTML = '<option value="">-- Generate All --</option>';
        Array.from(examNames).sort().forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            billExamSelect.appendChild(opt);
        });
    }

    // Listeners for Dropdown Population
    if (billStreamSelect) {
        billStreamSelect.addEventListener('change', populateBillExamDropdown);
    }

    // Handle Grouping Mode Change
    if (billModeSelect) {
        billModeSelect.addEventListener('change', () => {
            if (billModeSelect.value === 'period') {
                billDateRange.classList.remove('hidden');
                billDateRange.classList.add('grid');
                if (billExamDropdownContainer) billExamDropdownContainer.classList.add('hidden');
            } else {
                billDateRange.classList.add('hidden');
                billDateRange.classList.remove('grid');
                if (billExamDropdownContainer) billExamDropdownContainer.classList.remove('hidden');
                populateBillExamDropdown(); // Refresh when switching to exam mode
            }
        });
    }

    // 3. Generate Bill Button
    const btnGenerateBill = document.getElementById('btn-generate-bill');
    const btnPrintBill = document.getElementById('btn-print-bill');

    if (btnGenerateBill) {
        btnGenerateBill.addEventListener('click', () => {
            if (!allStudentData || allStudentData.length === 0) {
                alert("No student data loaded.");
                return;
            }

            const selectedStream = document.getElementById('bill-stream-select').value;
            const mode = document.getElementById('bill-mode-select').value;
            const selectedExamName = document.getElementById('bill-exam-select').value; // Specific filter

            if (!selectedStream) {
                alert("Please select a stream.");
                return;
            }

            // A. Filter Data by Stream
            const filteredData = allStudentData.filter(s => {
                const sStream = s.Stream || "Regular";
                return sStream === selectedStream;
            });

            if (filteredData.length === 0) {
                alert(`No students found for stream: "${selectedStream}"`);
                return;
            }

            // B. Prepare Groups
            const billGroups = {};

            const parseDate = (dStr) => {
                const [d, m, y] = dStr.split('.');
                return new Date(`${y}-${m}-${d}`);
            };

            const startDateInput = document.getElementById('bill-start-date').valueAsDate;
            const endDateInput = document.getElementById('bill-end-date').valueAsDate;

            filteredData.forEach(s => {
                if (mode === 'period' && (startDateInput || endDateInput)) {
                    const sDate = parseDate(s.Date);
                    if (startDateInput && sDate < startDateInput) return;
                    if (endDateInput && sDate > endDateInput) return;
                }

                const sessionKey = `${s.Date} | ${s.Time}`;
                let groupKey = "Consolidated Bill";

                if (mode === 'exam') {
                    // Get the Exam Name
                    const foundName = getExamName(s.Date, s.Time, s.Stream) || "Unknown / Other Exams";

                    // *** FILTER LOGIC ***
                    if (selectedExamName && selectedExamName !== "" && foundName !== selectedExamName) {
                        return; // Skip if it doesn't match selected exam
                    }
                    groupKey = foundName;
                } else {
                    const sStr = document.getElementById('bill-start-date').value || "Start";
                    const eStr = document.getElementById('bill-end-date').value || "End";
                    groupKey = `Period: ${sStr} to ${eStr}`;
                }

                if (!billGroups[groupKey]) billGroups[groupKey] = {};

                if (!billGroups[groupKey][sessionKey]) {
                    billGroups[groupKey][sessionKey] = {
                        date: s.Date, time: s.Time, normalCount: 0, scribeCount: 0
                    };
                }

                const scribeListRaw = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
                const scribeRegNos = new Set(scribeListRaw.map(s => s.regNo));

                if (scribeRegNos.has(s['Register Number'])) {
                    billGroups[groupKey][sessionKey].scribeCount++;
                } else {
                    billGroups[groupKey][sessionKey].normalCount++;
                }
            });

            // C. Process Groups
            const outputContainer = document.getElementById('remuneration-output');
            outputContainer.innerHTML = '';
            outputContainer.classList.remove('hidden');

            const groupKeys = Object.keys(billGroups).sort();

            if (groupKeys.length === 0) {
                outputContainer.innerHTML = '<p class="text-red-500 text-center p-4">No data found for the selected criteria.</p>';
                if (btnPrintBill) btnPrintBill.classList.add('hidden');
                return;
            }

            groupKeys.forEach(title => {
                const sessionMap = billGroups[title];
                const sessionArray = Object.values(sessionMap).sort((a, b) => {
                    const d1 = a.date.split('.').reverse().join('');
                    const d2 = b.date.split('.').reverse().join('');
                    return d1.localeCompare(d2) || a.time.localeCompare(b.time);
                });

                const bill = generateBillForSessions(title, sessionArray, selectedStream);
                if (bill) renderBillHTML(bill, outputContainer);
            });

            if (btnPrintBill) btnPrintBill.classList.remove('hidden');
        });
    }

    // --- REMUNERATION BILL DOWNLOAD ---
    if (btnPrintBill) {
        btnPrintBill.addEventListener('click', () => {
            const billContent = document.getElementById('remuneration-output').innerHTML;
            if (!billContent.trim()) return alert("No bill generated.");

            openPdfPreview(billContent, "Remuneration_Bill");
        });
    }

    // 5. Render Function (Strictly Black & White - No Date)
    function renderBillHTML(bill, container) {
        function numToWords(n) {
            const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
            const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
            if ((n = n.toString()).length > 9) return 'Overflow';
            const n_array = ('000000000' + n).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n_array) return;
            let str = '';
            str += (n_array[1] != 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
            str += (n_array[2] != 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
            str += (n_array[3] != 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
            str += (n_array[4] != 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
            str += (n_array[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
            return str.trim();
        }

        const totalAmount = bill.grand_total.toFixed(2);
        const [rupeesPart, paisePart] = totalAmount.split('.');
        let amountInWords = numToWords(Number(rupeesPart));
        if (Number(paisePart) > 0) {
            const paiseWords = numToWords(Number(paisePart));
            amountInWords += ` and ${paiseWords} Paise`;
        }

        const isRegular = bill.stream === "Regular";
        const hasPeon = bill.has_peon;
        let colGroup = isRegular
            ? `<col style="width: 16%;"><col style="width: 12%;"><col style="width: 10%;"><col style="width: 8%;"><col style="width: 8%;"><col style="width: 10%;"><col style="width: 10%;"><col style="width: 10%;"><col style="width: 12%;">`
            : `<col style="width: 16%;"><col style="width: 12%;"><col style="width: 10%;"><col style="width: 8%;"><col style="width: 8%;"><col style="width: 8%;"><col style="width: 10%;"><col style="width: 10%;"><col style="width: 12%;">`;

        // Added style="background-color:white !important" to force white background
        const osHeader = isRegular ? '<th class="p-1 border border-black text-center text-black" style="background-color: #ffffff !important;">OS</th>' : '';
        const peonHeader = hasPeon ? '<th class="p-1 border border-black text-center text-black" style="background-color: #ffffff !important;">Peon</th>' : '';
        const osFooter = isRegular ? `<td class="p-2 border border-black text-black" style="background-color: #ffffff !important;">₹${bill.supervision_breakdown.office.total}</td>` : '';
        const peonFooter = hasPeon ? `<td class="p-2 border border-black text-black" style="background-color: #ffffff !important;">₹${bill.peon}</td>` : '';
        const tableTotal = bill.invigilation + bill.clerical + bill.sweeping + bill.peon + bill.supervision;

        let supSummaryHTML = isRegular
            ? `CS: ₹${bill.supervision_breakdown.chief.total}, SAS: ₹${bill.supervision_breakdown.senior.total}, OS: ₹${bill.supervision_breakdown.office.total}, <strong class="text-black">Total: ₹${bill.supervision}</strong>`
            : `Chief Supdt: ₹${bill.supervision_breakdown.chief.total}, Senior Supdt: ₹${bill.supervision_breakdown.senior.total}, <strong class="text-black">Total: ₹${bill.supervision}</strong>`;

        const rows = bill.details.map(d => {
            let studentDetail = `${d.total_students}`;
            if (d.scribe_students > 0) studentDetail += ` <span class="text-black font-bold text-[10px]" style="white-space:nowrap;">(Incl ${d.scribe_students} Scr)</span>`;
            let invigDetail = `${d.invig_count_normal}`;
            if (d.invig_count_scribe > 0) invigDetail += ` + <span class="text-black font-bold">${d.invig_count_scribe}</span>`;

            const lineTotal = d.invig_cost + d.clerk_cost + d.sweeper_cost + (d.peon_cost || 0) + d.supervision_cost;
            const osCell = isRegular ? `<td class="p-1 border align-middle text-xs text-black">₹${d.os_cost}</td>` : '';
            const peonCell = hasPeon ? `<td class="p-1 border align-middle text-xs text-black">₹${d.peon_cost}</td>` : '';

            return `
                <tr class="border-b border-black text-center" style="background-color: #ffffff !important;">
                    <td class="p-1 border border-black text-left align-middle text-black">${d.date} <br><span class="text-[10px] text-black">${d.time}</span></td>
                    <td class="p-1 border border-black align-middle font-bold text-xs text-black">${studentDetail}</td>
                    <td class="p-1 border border-black align-middle text-xs text-black">${invigDetail}<br><span class="text-black text-[10px]">(₹${d.invig_cost})</span></td>
                    <td class="p-1 border border-black align-middle text-xs text-black">₹${d.clerk_cost}</td>
                    ${peonCell}
                    <td class="p-1 border border-black align-middle text-xs text-black">₹${d.sweeper_cost}</td>
                    <td class="p-1 border border-black align-middle text-xs text-black">₹${d.cs_cost}</td>
                    <td class="p-1 border border-black align-middle text-xs text-black">₹${d.sas_cost}</td>
                    ${osCell}
                    <td class="p-1 border border-black align-middle text-xs font-bold text-black">₹${lineTotal}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <div class="bg-white border-2 border-black p-8 print-page mb-8 relative text-black shadow-none" style="background-color: #ffffff !important;">
                <div class="text-center border-b-2 border-black pb-4 mb-4">
                    <h2 class="text-xl font-bold uppercase leading-tight text-black">${currentCollegeName}</h2>
                    <h3 class="text-lg font-semibold mt-1 text-black">Remuneration Bill: ${bill.title}</h3>
                    <p class="text-sm text-black mt-1">Stream: ${bill.stream}</p>
                </div>
                <table class="w-full border-collapse border border-black text-sm mb-4 table-fixed text-black" style="background-color: #ffffff !important;">
                    <colgroup>${colGroup}</colgroup>
                    <thead>
                        <tr style="background-color: #ffffff !important;">
                            <th class="p-1 border border-black text-left text-black font-bold" style="background-color: #ffffff !important;">Session</th>
                            <th class="p-1 border border-black text-center text-black font-bold" style="background-color: #ffffff !important;">Candidates</th>
                            <th class="p-1 border border-black text-center text-black font-bold" style="background-color: #ffffff !important;">Invig</th>
                            <th class="p-1 border border-black text-center text-black font-bold" style="background-color: #ffffff !important;">Clerk</th>
                            ${peonHeader}
                            <th class="p-1 border border-black text-center text-black font-bold" style="background-color: #ffffff !important;">Swpr</th>
                            <th class="p-1 border border-black text-center text-black font-bold" style="background-color: #ffffff !important;">CS</th>
                            <th class="p-1 border border-black text-center text-black font-bold" style="background-color: #ffffff !important;">SAS</th>
                            ${osHeader}
                            <th class="p-1 border border-black text-center font-bold text-black" style="background-color: #ffffff !important;">Total</th>
                        </tr>
                    </thead>
                    <tbody style="background-color: #ffffff !important;">${rows}</tbody>
                    <tfoot class="font-bold text-xs text-center" style="background-color: #ffffff !important;">
                        <tr style="background-color: #ffffff !important;">
                            <td colspan="2" class="p-2 border border-black text-right text-black" style="background-color: #ffffff !important;">Subtotals:</td>
                            <td class="p-2 border border-black text-black" style="background-color: #ffffff !important;">₹${bill.invigilation}</td>
                            <td class="p-2 border border-black text-black" style="background-color: #ffffff !important;">₹${bill.clerical}</td>
                            ${peonFooter}
                            <td class="p-2 border border-black text-black" style="background-color: #ffffff !important;">₹${bill.sweeping}</td>
                            <td class="p-2 border border-black text-black" style="background-color: #ffffff !important;">₹${bill.supervision_breakdown.chief.total}</td>
                            <td class="p-2 border border-black text-black" style="background-color: #ffffff !important;">₹${bill.supervision_breakdown.senior.total}</td>
                            ${osFooter}
                            <td class="p-2 border border-black text-lg text-black" style="background-color: #ffffff !important;">₹${tableTotal}</td>
                        </tr>
                    </tfoot>
                </table>
                <div class="summary-box grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm border-t-2 border-black pt-4 break-inside-avoid text-black" style="background-color: #ffffff !important;">
                    <div class="p-3 border border-black" style="background-color: #ffffff !important;">
                        <div class="font-bold text-black border-b border-black mb-2 pb-1">1. Supervision Breakdown</div>
                        <div class="text-xs text-black leading-relaxed">${supSummaryHTML}</div>
                    </div>
                    <div class="space-y-2" style="background-color: #ffffff !important;">
                        <div class="flex justify-between border-b border-dotted border-black pb-1 font-bold text-black">2. Other Allowances</div>
                        <div class="flex justify-between border-b border-dotted border-black pb-1 text-black"><span>Contingency:</span> <span class="font-mono font-bold">₹${bill.contingency.toFixed(2)}</span></div>
                        <div class="flex justify-between border-b border-dotted border-black pb-1 text-black"><span>Data Entry Operator:</span> <span class="font-mono font-bold">₹${bill.data_entry}</span></div>
                        <div class="flex justify-between border-b border-dotted border-black pb-1 text-black"><span>Accountant:</span> <span class="font-mono font-bold">₹${(allRates[bill.stream] ? allRates[bill.stream].accountant : 0)}</span></div>
                    </div>
                </div>
                <div class="summary-box mt-6 p-3 border border-black flex flex-col items-end break-inside-avoid text-black" style="background-color: #ffffff !important;">
                    <div class="flex justify-between w-full items-center">
                        <span class="text-lg font-bold uppercase">Grand Total Claim</span>
                        <span class="text-2xl font-bold font-mono">₹${bill.grand_total.toFixed(2)}</span>
                    </div>
                    <div class="w-full text-right mt-1 border-t border-black pt-1">
                        <span class="text-sm font-bold italic text-black">(Rupees ${amountInWords} Only)</span>
                    </div>
                </div>
                <div class="summary-box mt-12 flex justify-end text-sm font-bold break-inside-avoid text-black" style="background-color: #ffffff !important;">
                    <div class="border-t border-black w-1/3 text-center pt-2">Chief Superintendent</div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    }

    // ==========================================
    // 🔗 STUDENT PORTAL LINK GENERATOR
    // ==========================================

    function updateStudentPortalLink() {
        const linkInput = document.getElementById('student-portal-link');
        if (!linkInput) return;

        if (currentCollegeId) {
            // 1. Get the current base URL
            let currentUrl = window.location.href;
            let baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));

            // 2. Construct Link with the correct ID format
            const studentUrl = `${baseUrl}/student.html?id=/public_seating/${currentCollegeId}`;

            linkInput.value = studentUrl;
            linkInput.classList.remove('text-gray-400', 'italic');
            linkInput.classList.add('text-gray-700');
        } else {
            linkInput.value = "Please log in to generate your unique link.";
            linkInput.classList.add('text-gray-400', 'italic');
        }
    }

    // 1. Update when clicking the Settings Tab
    if (navSettings) {
        navSettings.addEventListener('click', () => {
            updateStudentPortalLink();       // Keep the existing link update
            renderExamNameSettings();        // Add your new Exam List render
        });
    }

    // 2. Copy Button Functionality
    const btnCopyPortal = document.getElementById('copy-portal-btn');
    if (btnCopyPortal) {
        btnCopyPortal.addEventListener('click', () => {
            const linkInput = document.getElementById('student-portal-link');
            if (!linkInput || !linkInput.value.startsWith('http')) return;

            linkInput.select();
            linkInput.setSelectionRange(0, 99999); // For mobile devices

            navigator.clipboard.writeText(linkInput.value).then(() => {
                const originalText = btnCopyPortal.innerHTML;
                btnCopyPortal.innerHTML = `✅ Copied!`;
                btnCopyPortal.classList.remove('bg-teal-600');
                btnCopyPortal.classList.add('bg-green-600');

                setTimeout(() => {
                    btnCopyPortal.innerHTML = originalText;
                    btnCopyPortal.classList.add('bg-teal-600');
                    btnCopyPortal.classList.remove('bg-green-600');
                }, 2000);
            });
        });
    }

    // Updated: Dashboard Invigilation Widget (Opens Modal instead of Print)
    function renderDashboardInvigilation() {
        const wrapper = document.getElementById('dashboard-invigilation-wrapper');
        const container = document.getElementById('dashboard-invigilation-buttons');
        if (!wrapper || !container) return;

        const slotsJson = localStorage.getItem('examInvigilationSlots');
        if (!slotsJson) { wrapper.classList.add('hidden'); return; }

        const slots = JSON.parse(slotsJson);

        // Robust Date Matching (Matches "01.12.2025" or "1.12.2025")
        const today = new Date();
        const d = today.getDate();
        const m = today.getMonth() + 1;
        const y = today.getFullYear();
        const pad = (n) => String(n).padStart(2, '0');

        const todayStrPadded = `${pad(d)}.${pad(m)}.${y}`;
        const todayStrSimple = `${d}.${m}.${y}`;

        const todayKeys = Object.keys(slots).filter(k =>
            k.startsWith(todayStrPadded) || k.startsWith(todayStrSimple)
        );

        if (todayKeys.length === 0) {
            wrapper.classList.add('hidden');
            return;
        }

        container.innerHTML = '';
        todayKeys.sort();

        todayKeys.forEach(key => {
            const timePart = key.split(' | ')[1];
            const btn = document.createElement('button');
            // Styling: Cute, clickable button
            btn.className = "bg-white text-indigo-700 hover:bg-indigo-50 font-bold py-2 px-4 rounded-lg shadow-sm text-xs flex items-center gap-2 transition transform hover:scale-105";

            // Icon: Eye/View instead of Printer
            btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View ${timePart}
        `;

            // Action: Open Modal
            btn.onclick = () => openDashboardInvigModal(key);
            container.appendChild(btn);
        });

        wrapper.classList.remove('hidden');
    }

    // --- NEW: Dashboard Invigilator Modal Logic ---
    window.openDashboardInvigModal = function (sessionKey) {
        const slots = JSON.parse(localStorage.getItem('examInvigilationSlots') || '{}');
        const staffData = JSON.parse(localStorage.getItem('examStaffData') || '[]');
        const slot = slots[sessionKey];

        if (!slot) return;

        const [datePart, timePart] = sessionKey.split(' | ');
        document.getElementById('dash-modal-title').textContent = timePart;
        document.getElementById('dash-modal-subtitle').textContent = `${datePart} • ${slot.assigned.length} Staff Assigned`;

        const listContainer = document.getElementById('dash-invig-list');
        listContainer.innerHTML = '';

        if (!slot.assigned || slot.assigned.length === 0) {
            listContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8 text-gray-400">
                <svg class="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                <p class="text-sm">No invigilators assigned yet.</p>
            </div>`;
        } else {
            // Sort alphabetically
            slot.assigned.sort();

            slot.assigned.forEach(email => {
                const staff = staffData.find(s => s.email === email) || { name: email.split('@')[0], dept: "Unknown", phone: "" };

                // Phone & WhatsApp Logic
                let phoneDisplay = staff.phone || "No Phone";
                let waLink = "#";
                let waClass = "opacity-50 cursor-not-allowed grayscale";

                if (staff.phone) {
                    // Clean number: remove all non-digits
                    let cleanNum = staff.phone.replace(/\D/g, '');

                    // Ensure it has 91 prefix
                    if (cleanNum.length === 10) {
                        cleanNum = '91' + cleanNum;
                    }

                    // Valid length check (10 digit + 91 = 12 digits)
                    if (cleanNum.length >= 10) {
                        waLink = `https://wa.me/${cleanNum}`;
                        waClass = "hover:bg-green-600 hover:text-white text-green-600 bg-green-50 border-green-200";
                    }
                }

                const card = document.createElement('div');
                card.className = "bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition";

                card.innerHTML = `
                <div class="flex items-center gap-3 min-w-0">
                    <div class="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                        ${staff.name.charAt(0)}
                    </div>
                    <div class="min-w-0">
                        <h4 class="font-bold text-gray-800 text-sm truncate">${staff.name}</h4>
                        <p class="text-xs text-gray-500 truncate">${staff.dept}</p>
                    </div>
                </div>
                
                <div class="flex items-center gap-2 pl-2">
                    ${staff.phone ? `<a href="tel:${staff.phone}" class="p-2 rounded-full bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 border border-gray-100 transition"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></a>` : ''}
                    
                    <a href="${waLink}" target="_blank" class="p-2 rounded-full border transition flex items-center justify-center ${waClass}">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    </a>
                </div>
            `;
                listContainer.appendChild(card);
            });
        }

        // Open
        const modal = document.getElementById('dashboard-invig-modal');
        modal.classList.remove('hidden');
    }

    // Standalone Print Function (Does not depend on invigilation.js variables)
    function printDashboardSession(key, slot) {
        const [datePart, timePart] = key.split(' | ');
        const collegeName = localStorage.getItem('examCollegeName') || "Government Victoria College";

        // Load Staff Data for Names
        const staffJson = localStorage.getItem('examStaffData');
        const staffData = staffJson ? JSON.parse(staffJson) : [];

        // Identify Session
        const isAN = (timePart.includes("PM") || timePart.startsWith("12:") || timePart.startsWith("12."));
        const sessionLabel = isAN ? "AFTERNOON SESSION" : "FORENOON SESSION";

        // Exam Name Logic
        let examName = slot.examName || "University Examinations";

        // Prepare Rows
        const scribes = slot.scribeCount || 0;
        const totalStudents = slot.studentCount || 0;
        const regularStudents = Math.max(0, totalStudents - scribes);
        const regularInvigs = Math.ceil(regularStudents / 30);
        const totalRowsToPrint = Math.max((slot.assigned || []).length + 5, regularInvigs + scribes + 2, 20);

        let rowsHtml = "";

        (slot.assigned || []).forEach((email, index) => {
            const staff = staffData.find(s => s.email === email) || { name: email.split('@')[0], dept: "" };
            rowsHtml += `
            <tr>
                <td class="center">${index + 1}</td>
                <td class="bold">${staff.name}</td>
                <td>${staff.dept}</td>
                <td></td> <td></td> <td></td> <td></td> <td></td> <td></td>
            </tr>
        `;
        });

        // Empty Rows
        for (let i = (slot.assigned || []).length; i < totalRowsToPrint; i++) {
            rowsHtml += `<tr><td class="center">${i + 1}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
        }

        // Open Print Window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Invigilation List - ${datePart}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; color: #000; }
                @page { size: A4 portrait; margin: 15mm; }
                .container { width: 100%; max-width: 210mm; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .header h1 { margin: 0; font-size: 16pt; text-transform: uppercase; font-weight: 800; }
                .header h2 { margin: 5px 0 0; font-size: 13pt; font-weight: 600; }
                .header h3 { margin: 5px 0 0; font-size: 11pt; font-weight: normal; text-transform: uppercase; }
                .meta { display: flex; justify-content: space-between; font-size: 11pt; font-weight: bold; margin-bottom: 15px; padding: 5px; background-color: #f3f4f6; border: 1px solid #ddd; }
                table { width: 100%; border-collapse: collapse; font-size: 10pt; }
                th, td { border: 1px solid #000; padding: 8px 4px; vertical-align: middle; }
                th { background-color: #e5e7eb !important; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; }
                .center { text-align: center; }
                .bold { font-weight: 600; }
                .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11pt; font-weight: bold; }
                .footer div { text-align: center; width: 40%; border-top: 1px solid #000; padding-top: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${collegeName}</h1>
                    <h2>Invigilation Duty List</h2>
                    <h3>${examName}</h3>
                </div>
                <div class="meta">
                    <span>Date: ${datePart}</span>
                    <span>${sessionLabel} (${timePart})</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%;">Sl</th>
                            <th style="width: 25%; text-align:left; padding-left:8px;">Name of Invigilator</th>
                            <th style="width: 10%;">Dept</th>
                            <th style="width: 8%;">RNBB</th>
                            <th style="width: 8%;">Asgd<br>Script</th>
                            <th style="width: 8%;">Used<br>Script</th>
                            <th style="width: 8%;">Retd<br>Script</th>
                            <th style="width: 18%;">Remarks</th>
                            <th style="width: 10%;">Sign</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
                <div class="footer">
                    <div>Senior Assistant Superintendent</div>
                    <div>Chief Superintendent</div>
                </div>
            </div>
            <script>window.onload = function() { setTimeout(() => window.print(), 500); };<\/script>
        </body>
        </html>
    `);
        printWindow.document.close();
    }



    // --- EDIT DATA LOCK LOGIC ---
    let isEditDataLocked = true; // Default Locked
    const toggleEditDataLockBtn = document.getElementById('toggle-edit-data-lock-btn');

    if (toggleEditDataLockBtn) {
        toggleEditDataLockBtn.addEventListener('click', () => {
            isEditDataLocked = !isEditDataLocked;
            updateEditLockUI();
            renderStudentEditTable(); // Re-render table to update row buttons
        });
    }

    function updateEditLockUI() {
        if (isEditDataLocked) {
            // Locked State UI
            toggleEditDataLockBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            <span>List Locked</span>
        `;
            toggleEditDataLockBtn.className = "text-xs flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-200 transition shadow-sm";

            // Disable Add Button
            if (addNewStudentBtn) {
                addNewStudentBtn.disabled = true;
                addNewStudentBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        } else {
            // Unlocked State UI
            toggleEditDataLockBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            <span>Unlocked</span>
        `;
            toggleEditDataLockBtn.className = "text-xs flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-100 transition shadow-sm";

            // Enable Add Button
            if (addNewStudentBtn) {
                addNewStudentBtn.disabled = false;
                addNewStudentBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    }

    // ==========================================
    // 🗓️ BULK SESSION OPERATIONS (Reschedule/Delete)
    // ==========================================

    let isSessionOpsLocked = true;

    const btnSessionLock = document.getElementById('btn-session-ops-lock');
    const sessionOpsControls = document.getElementById('session-ops-controls');
    const sessionDateInput = document.getElementById('session-new-date');
    const sessionTimeInput = document.getElementById('session-new-time');
    const btnSessionReschedule = document.getElementById('btn-session-reschedule');
    const btnSessionDelete = document.getElementById('btn-session-delete');

    // 1. Toggle Lock
    if (btnSessionLock) {
        btnSessionLock.addEventListener('click', () => {
            isSessionOpsLocked = !isSessionOpsLocked;
            updateSessionOpsLockUI();
        });
    }

    function updateSessionOpsLockUI() {
        if (!btnSessionLock || !sessionOpsControls) return;

        if (isSessionOpsLocked) {
            // LOCKED STATE
            btnSessionLock.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg><span>Locked</span>`;
            btnSessionLock.className = "text-xs flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-200 transition shadow-sm";

            sessionOpsControls.classList.add('opacity-50', 'pointer-events-none');
            [sessionDateInput, sessionTimeInput, btnSessionReschedule, btnSessionDelete].forEach(el => el.disabled = true);

        } else {
            // UNLOCKED STATE
            btnSessionLock.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg><span>Unlocked</span>`;
            btnSessionLock.className = "text-xs flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded hover:bg-red-100 transition shadow-sm font-bold";

            sessionOpsControls.classList.remove('opacity-50', 'pointer-events-none');
            [sessionDateInput, sessionTimeInput, btnSessionReschedule, btnSessionDelete].forEach(el => el.disabled = false);
        }
    }

 // 2. Reschedule Logic (Smart Merge + Unavailability Check)
    if (btnSessionReschedule) {
        btnSessionReschedule.addEventListener('click', async () => {
            const rawDate = sessionDateInput.value;
            const rawTime = sessionTimeInput.value;
            const currentSession = editSessionSelect.value;

            if (!currentSession) return alert("No session selected.");
            if (!rawDate || !rawTime) return alert("Please select both New Date and New Time.");

            // A. Format New Values
            const [y, m, d] = rawDate.split('-');
            const newDate = `${d}.${m}.${y}`;
            
            let newTime = "";
            if (typeof normalizeTime === 'function') {
                newTime = normalizeTime(rawTime);
            } else {
                const [h, min] = rawTime.split(':');
                let hours = parseInt(h);
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12; hours = hours ? hours : 12;
                newTime = `${String(hours).padStart(2, '0')}:${min} ${ampm}`;
            }

            const newSessionKey = `${newDate} | ${newTime}`;
            const [oldDate, oldTime] = currentSession.split(' | ');

            if (newSessionKey === currentSession) return alert("New date/time is the same as current.");

            const msg = `⚠️ SMART RESCHEDULE ⚠️\n\nMove EVERYTHING from:\n${currentSession}\n\nTo:\n${newSessionKey}?\n\nProceed?`;

            if (!confirm(msg)) return;

            const check = prompt("Type 'CHANGE' to confirm:");
            if (check !== 'CHANGE') return alert("Cancelled.");

            try {
                // 1. Update Students
                let studentCount = 0;
                allStudentData.forEach(s => {
                    if (s.Date === oldDate && s.Time === oldTime) {
                        s.Date = newDate;
                        s.Time = newTime;
                        studentCount++;
                    }
                });
                localStorage.setItem(BASE_DATA_KEY, JSON.stringify(allStudentData));

                // --- PREPARE CONFLICT CHECKER ---
                // Load Advance Unavailability (Leaves)
                const unavJson = localStorage.getItem('invigAdvanceUnavailability');
                const advanceUnav = unavJson ? JSON.parse(unavJson) : {};
                
                // Determine New Session Type (FN/AN)
                const tStr = newTime.toUpperCase();
                const isAN = (tStr.includes("PM") || tStr.startsWith("12:") || tStr.startsWith("12."));
                const newSessCode = isAN ? "AN" : "FN";
                
                // Get list of people unavailable on the NEW DATE & SESSION
                const dateEntry = advanceUnav[newDate] || {};
                const sessionUnav = dateEntry[newSessCode] || []; // Array of {email: "..."} objects
                const blockedEmails = new Set(sessionUnav.map(u => (typeof u === 'string' ? u : u.email)));
                
                let removedStaffLog = [];

                // 2. Helper to Move Data Safely
                const moveKeyInStorage = (storageKey, type) => {
                    const raw = localStorage.getItem(storageKey);
                    if (!raw) return;
                    const data = JSON.parse(raw);

                    if (data[currentSession]) {
                        if (data[newSessionKey]) {
                            // --- COLLISION (MERGE) ---
                            if (type === 'array') {
                                data[newSessionKey] = [...data[newSessionKey], ...data[currentSession]];
                            } 
                            else if (storageKey === 'examInvigilationSlots') {
                                const target = data[newSessionKey];
                                const source = data[currentSession];
                                
                                // Merge Assigned Staff
                                let combined = [...target.assigned, ...source.assigned];
                                
                                // *** FILTER CONFLICTS ***
                                const safeList = [];
                                combined.forEach(email => {
                                    if (blockedEmails.has(email)) {
                                        if (!removedStaffLog.includes(email)) removedStaffLog.push(email);
                                    } else {
                                        safeList.push(email);
                                    }
                                });
                                target.assigned = [...new Set(safeList)]; // Unique only
                                
                                // Reset Unavailability (Old reasons don't apply)
                                // We do NOT merge source.unavailable
                                
                                target.studentCount = (target.studentCount || 0) + (source.studentCount || 0);
                                target.scribeCount = (target.scribeCount || 0) + (source.scribeCount || 0);
                                target.required = Math.max(target.required, source.required);
                            }
                            else {
                                data[newSessionKey] = { ...data[newSessionKey], ...data[currentSession] };
                            }
                        } else {
                            // --- NO COLLISION (SIMPLE MOVE) ---
                            let payload = data[currentSession];

                            // *** FILTER CONFLICTS ***
                            if (storageKey === 'examInvigilationSlots') {
                                payload.unavailable = []; // Reset old reasons
                                
                                const originalCount = payload.assigned.length;
                                payload.assigned = payload.assigned.filter(email => {
                                    if (blockedEmails.has(email)) {
                                        removedStaffLog.push(email);
                                        return false;
                                    }
                                    return true;
                                });
                            }
                            
                            data[newSessionKey] = payload;
                        }
                        
                        // Delete Old Key
                        delete data[currentSession];
                        localStorage.setItem(storageKey, JSON.stringify(data));
                    }
                };

                // 3. Execute Moves
                moveKeyInStorage('examRoomAllotment', 'array');
                moveKeyInStorage('examScribeAllotment', 'object');
                moveKeyInStorage('examAbsenteeList', 'array');
                moveKeyInStorage('examInvigilatorMapping', 'object');
                moveKeyInStorage('examInvigilationSlots', 'object'); 
                moveKeyInStorage('examQPCodes', 'object');

                let alertMsg = `✅ Moved ${studentCount} students to ${newSessionKey}.`;
                
                if (removedStaffLog.length > 0) {
                    alertMsg += `\n\n⚠️ ${removedStaffLog.length} invigilators were UNASSIGNED because they are marked unavailable (Leave/OD) on the new date:\n${removedStaffLog.join(', ')}`;
                }

                alert(alertMsg);

                // REPLACE line 8831:
                if (typeof syncDataToCloud === 'function') {
                await syncDataToCloud('heavy');      // Students & Rooms
                await syncDataToCloud('ops');        // Absentees
                await syncDataToCloud('allocation'); // Scribes
                await syncDataToCloud('staff');      // Invigilators
                await syncDataToCloud('slots');      // Duty Slots
                }
                window.location.reload();

            } catch (e) {
                console.error(e);
                alert("Error: " + e.message);
            }
        });
    }

    // 3. Delete Logic (Wipes Students + Associated Data)
    if (btnSessionDelete) {
        btnSessionDelete.addEventListener('click', async () => {
            const currentSession = editSessionSelect.value;
            if (!currentSession) return alert("No session selected.");

            const [oldDate, oldTime] = currentSession.split(' | ');

            // Count targets
            const targets = allStudentData.filter(s => s.Date === oldDate && s.Time === oldTime);

            const msg = `🛑 CRITICAL WARNING: DELETE SESSION 🛑\n\nYou are about to delete the ENTIRE session:\n${currentSession}\n\nThis will remove:\n• ${targets.length} Student Records\n• All Room Allotments for this session\n• All Duty Assignments for this session\n\nAre you sure?`;

            if (!confirm(msg)) return;

            const check = prompt("Type 'DELETE' to confirm permanent deletion:");
            if (check !== 'DELETE') return alert("Cancelled. Incorrect code.");

            try {
                // 1. Delete Students
                allStudentData = allStudentData.filter(s => !(s.Date === oldDate && s.Time === oldTime));
                localStorage.setItem(BASE_DATA_KEY, JSON.stringify(allStudentData));

                // 2. Helper to Delete Key
                const deleteKeyInStorage = (storageKey) => {
                    const raw = localStorage.getItem(storageKey);
                    if (!raw) return;
                    const data = JSON.parse(raw);
                    if (data[currentSession]) {
                        delete data[currentSession];
                        localStorage.setItem(storageKey, JSON.stringify(data));
                    }
                };

                // 3. Delete Associated Data
                deleteKeyInStorage('examRoomAllotment');
                deleteKeyInStorage('examScribeAllotment');
                deleteKeyInStorage('examAbsenteeList');
                deleteKeyInStorage('examInvigilatorMapping');
                deleteKeyInStorage('examInvigilationSlots');
                deleteKeyInStorage('examQPCodes');

                alert(`✅ Deleted ${targets.length} records and cleaned up all session data.`);

                // REPLACE line 8831:
                if (typeof syncDataToCloud === 'function') {
                await syncDataToCloud('heavy');      // Students & Rooms
                await syncDataToCloud('ops');        // Absentees
                await syncDataToCloud('allocation'); // Scribes
                await syncDataToCloud('staff');      // Invigilators
                await syncDataToCloud('slots');      // Duty Slots
                }
                window.location.reload();

            } catch (e) {
                console.error(e);
                alert("Error during deletion: " + e.message);
            }
        });
    }

     

    // ==========================================
    // 📄 GLOBAL PDF PREVIEW (FIXED COLUMNS & PRINTING)
    // ==========================================
    window.openPdfPreview = function (contentHtml, filenamePrefix) {
        // 1. CLEAN CONTENT
        // Remove fixed heights to allow printing across multiple pages.
        // We DO NOT remove flexbox anymore, to preserve multi-column layouts.
        const cleanContent = contentHtml
            .replace(/min-height:\s*297mm/g, 'min-height: auto')
            .replace(/height:\s*297mm/g, 'height: auto')
            .replace(/height:\s*100%/g, 'height: auto')       // Remove fixed height (Critical for print)
            .replace(/width:\s*210mm/g, 'width: 100%')
            .replace(/padding:\s*2cm/g, 'padding: 15px')
            .replace(/mb-8/g, 'mb-4')
            .replace(/shadow-xl/g, 'shadow-none')
            .replace(/border-2/g, 'border');

        const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
        const filename = `${filenamePrefix}_${dateStr}`;

        // 2. FILTER HEAD CONTENT (Remove app scripts to prevent re-init)
        let headContent = document.head.innerHTML;
        headContent = headContent.replace(/<script[^>]*src="[^"]*app\.js"[^>]*>[\s\S]*?<\/script>/gi, "");
        headContent = headContent.replace(/<script[^>]*src="[^"]*invigilation\.js"[^>]*>[\s\S]*?<\/script>/gi, "");

        const w = window.open('', '_blank');
        w.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            ${headContent}
            <title>${filename}</title>
            <style>
                /* SCREEN PREVIEW STYLES */
                body { 
                    background-color: #525659; 
                    margin: 0; 
                    padding: 20px; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    font-family: sans-serif; 
                }
                
                #print-controls {
                    margin-bottom: 20px; background: white; padding: 10px 20px; 
                    border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    position: sticky; top: 10px; z-index: 9999;
                    display: flex; gap: 10px;
                }

                #pdf-wrapper {
                    width: 210mm; 
                    background: white;
                    padding: 0; 
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                    box-sizing: border-box;
                    height: auto;
                    min-height: 297mm;
                }

                /* REPORT PAGE STYLES */
                /* Force block display on the PAGE wrapper to prevent print cutoff */
                .print-page, .print-page-daywise, .print-page-sticker {
                    width: 100% !important;
                    height: auto !important;
                    min-height: 0 !important;
                    margin: 0 !important;
                    padding: 10mm !important;
                    border: none !important;
                    box-shadow: none !important;
                    display: block !important; 
                    box-sizing: border-box;
                    page-break-after: always;
                    position: relative;
                }
                
                .print-page:last-child { margin-bottom: 0 !important; page-break-after: auto; }

                /* Prevent breaking inside critical elements */
                .summary-box > div, .summary-box > p, tr, .room-row {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                table { 
                    width: 100% !important; 
                    table-layout: fixed !important;
                    border-collapse: collapse !important;
                }
                th, td { 
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                    border: 1px solid #000 !important;
                }

                /* Ensure Columns (Flex containers) behave nicely */
                .column-container {
                    display: flex;
                    gap: 15px;
                }
                .column {
                    flex: 1;
                }

                ::-webkit-scrollbar { display: none; }

                /* PRINT MEDIA QUERY (CRITICAL FIXES) */
                @media print {
                    #print-controls { display: none !important; }
                    
                    body { 
                        display: block !important; 
                        padding: 0; margin: 0; 
                        background: white; 
                        width: 100%; height: auto; 
                        overflow: visible; 
                    }

                    #pdf-wrapper { 
                        width: 100%; box-shadow: none; margin: 0; 
                        overflow: visible; height: auto; 
                    }

                    .print-page {
                        display: block !important; 
                        height: auto !important;
                        overflow: visible !important;
                    }

                    @page { margin: 10mm; size: A4; } 
                }
            </style>
        </head>
        <body>
            <div id="print-controls">
                <button onclick="window.print()" class="bg-gray-700 text-white px-6 py-2 rounded font-bold shadow hover:bg-gray-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Report (Browser)
                </button>
            </div>

            <div id="pdf-wrapper">
                ${cleanContent}
            </div>
        </body>
        </html>
        `);
        w.document.close();
    }


    
    
    // --- NEW: Clear Scribe Room Assignment ---
    window.removeScribeRoom = function (regNo) {
        if (isScribeAllotmentLocked) return alert("Scribe Allotment is Locked."); // Safety Check
        if (!confirm("Unassign this student? They will return to the 'Assign Room' state.")) return;

        // 1. Remove from current session mapping
        delete currentScribeAllotment[regNo];

        // 2. Save to Local Storage
        const allAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        allAllotments[currentSessionKey] = currentScribeAllotment;
        localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(allAllotments));

        // 3. Sync & Refresh
        if (typeof syncDataToCloud === 'function') syncDataToCloud('allocation');
        renderScribeAllotmentList(currentSessionKey);
    };

    // ==========================================
    // 👮 INVIGILATOR ASSIGNMENT MODULE (WITH SWAP)
    // ==========================================

    let swapSourceRoom = null; // Track which room is selected for swapping

    // 1. Render the Main Assignment Panel (Fixed: Keeps Names Visible in Swap Mode)
    window.renderInvigilationPanel = function () {
        const section = document.getElementById('invigilator-assignment-section');
        const list = document.getElementById('invigilator-list-container');
        const sessionKey = allotmentSessionSelect.value;

        if (!sessionKey) {
            if (section) section.classList.add('hidden');
            return;
        }

        // A. Consolidate Rooms
        const roomDataMap = {};
        if (currentSessionAllotment && currentSessionAllotment.length > 0) {
            currentSessionAllotment.forEach(room => {
                if (!roomDataMap[room.roomName]) roomDataMap[room.roomName] = { name: room.roomName, count: 0, streams: new Set(), isScribe: false };
                roomDataMap[room.roomName].count += room.students.length;
                roomDataMap[room.roomName].streams.add(room.stream || "Regular");
            });
        }
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
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

        const allMappings = JSON.parse(localStorage.getItem(INVIG_MAPPING_KEY) || '{}');
        currentInvigMapping = allMappings[sessionKey] || {};
        const serialMap = getRoomSerialMap(sessionKey);
        allRooms.sort((a, b) => (serialMap[a.name] || 999) - (serialMap[b.name] || 999));

        // --- SWAP MODE BANNER ---
        if (swapSourceRoom) {
            list.innerHTML += `
            <div class="bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold p-3 rounded-lg mb-3 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <div class="flex items-center gap-2">
                    <span class="animate-pulse">🔄</span> 
                    <span>Select a target room to swap invigilators.</span>
                </div>
                <button onclick="window.handleSwapClick('${swapSourceRoom.replace(/'/g, "\\'")}')" class="bg-white border border-orange-200 px-3 py-1 rounded hover:bg-orange-100 transition text-[10px]">Cancel</button>
            </div>
        `;
        }

        // C. Render Rows
        allRooms.forEach(room => {
            const roomName = room.name;
            const assignedName = currentInvigMapping[roomName];
            const serial = serialMap[roomName] || '-';

            const roomInfo = currentRoomConfig[room.name] || {};
            const location = roomInfo.location || "";
            const safeRoomName = roomName.replace(/'/g, "\\'");

            const streamBadges = Array.from(room.streams).map(s => {
                let color = "bg-blue-100 text-blue-800 border-blue-200";
                if (s === "Scribe") color = "bg-orange-100 text-orange-800 border-orange-200";
                else if (s !== "Regular") color = "bg-purple-100 text-purple-800 border-purple-200";
                return `<span class="text-[9px] px-1.5 py-0.5 rounded border ${color} font-bold uppercase tracking-wide whitespace-nowrap">${s}</span>`;
            }).join(' ');

            let cardBorder = assignedName ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-white";
            if (swapSourceRoom === roomName) cardBorder = "border-orange-400 ring-2 ring-orange-100 bg-orange-50";

            // --- NAME DISPLAY HELPER ---
            const getNameHtml = (name) => `
            <div class="flex items-center gap-2 min-w-0 mb-2 sm:mb-0 sm:mr-2">
                 <div class="bg-green-100 text-green-700 p-1 rounded-full shrink-0">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <span class="text-xs font-bold text-green-800 truncate max-w-[150px] sm:max-w-[200px]" title="${name}">${name}</span>
            </div>`;

            let actionHtml = "";

            if (swapSourceRoom) {
                // === SWAP MODE ===
                if (swapSourceRoom === roomName) {
                    // SOURCE ROOM (Show Name + Cancel)
                    actionHtml = `
                    <div class="flex flex-col sm:flex-row items-end sm:items-center justify-between w-full sm:w-auto">
                        ${getNameHtml(assignedName)}
                        <button onclick="window.handleSwapClick('${safeRoomName}')" class="w-full sm:w-auto bg-gray-500 text-white border border-transparent px-4 py-1.5 rounded text-xs font-bold hover:bg-gray-600 transition shadow-sm">
                            Cancel
                        </button>
                    </div>`;
                } else {
                    // TARGET ROOM
                    const btnLabel = assignedName ? "Swap Here" : "Move Here";
                    const btnColor = assignedName ? "bg-indigo-600 hover:bg-indigo-700" : "bg-green-600 hover:bg-green-700";

                    const btnHtml = `
                    <button onclick="window.handleSwapClick('${safeRoomName}')" class="w-full sm:w-auto ${btnColor} text-white border border-transparent px-4 py-1.5 rounded text-xs font-bold transition shadow-sm flex items-center justify-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        ${btnLabel}
                    </button>`;

                    if (assignedName) {
                        // Occupied Target: Show Name + Swap Button
                        actionHtml = `
                        <div class="flex flex-col sm:flex-row items-end sm:items-center justify-between w-full sm:w-auto">
                            ${getNameHtml(assignedName)}
                            ${btnHtml}
                        </div>`;
                    } else {
                        // Empty Target: Just Move Button
                        actionHtml = btnHtml;
                    }
                }
            } else {
                // === NORMAL MODE ===
                if (assignedName) {
                    actionHtml = `
                    <div class="flex flex-col sm:flex-row items-end sm:items-center justify-between w-full sm:w-auto gap-2 bg-white sm:bg-transparent p-2 sm:p-0 rounded border sm:border-0 border-green-100 mt-2 sm:mt-0">
                        ${getNameHtml(assignedName)}
                        <div class="flex gap-1 w-full sm:w-auto">
                            <button type="button" onclick="window.openInvigModal('${safeRoomName}')" class="flex-1 sm:flex-none text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition border border-indigo-100">Change</button>
                            <button type="button" onclick="window.handleSwapClick('${safeRoomName}')" class="flex-1 sm:flex-none text-[10px] font-bold text-orange-600 hover:text-orange-800 bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 transition border border-orange-100" title="Swap with another hall">Swap</button>
                        </div>
                    </div>
                `;
                } else {
                    actionHtml = `
                    <button type="button" onclick="window.openInvigModal('${safeRoomName}')" class="w-full sm:w-auto mt-2 sm:mt-0 bg-indigo-600 text-white border border-transparent px-4 py-1.5 rounded text-xs font-bold hover:bg-indigo-700 transition shadow-sm flex items-center justify-center gap-1">
                        <span>+</span> Assign
                    </button>
                `;
                }
            }

            list.innerHTML += `
            <div class="p-3 border rounded-lg shadow-sm ${cardBorder} hover:shadow-md transition mb-2">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                    <div class="flex items-start gap-3 min-w-0">
                        <div class="flex flex-col items-center justify-center w-10 h-10 bg-gray-100 text-gray-600 rounded-lg font-bold text-xs border border-gray-200 shrink-0">
                            <span class="text-[8px] text-gray-400 uppercase leading-none mb-0.5">Hall</span>
                            <span>#${serial}</span>
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="font-bold text-gray-800 text-sm flex flex-wrap items-baseline gap-1">
                                <span class="truncate">${roomName}</span>
                                <span class="text-xs text-gray-400 font-normal truncate">${location ? `(${location})` : ''}</span>
                            </div>
                            <div class="flex flex-wrap items-center gap-2 mt-1.5">
                                <span class="text-[10px] text-gray-500 font-semibold bg-white px-1.5 py-0.5 rounded border border-gray-200 shadow-sm whitespace-nowrap">
                                    👥 ${room.count}
                                </span>
                                ${streamBadges}
                            </div>
                        </div>
                    </div>
                    <div class="sm:text-right min-w-[200px]">
                        ${actionHtml}
                    </div>
                </div>
            </div>
        `;
        });
    }

    // 2. Handle Swap Interaction
    window.handleSwapClick = function (roomName) {
        if (swapSourceRoom === roomName) {
            // Clicked same room -> Cancel Swap
            swapSourceRoom = null;
        } else if (swapSourceRoom) {
            // Clicked different room -> Perform Swap
            performSwap(swapSourceRoom, roomName);
            return; // performSwap calls render
        } else {
            // Start Swap Mode
            swapSourceRoom = roomName;
        }
        renderInvigilationPanel();
    }

    // 3. Execute Swap Logic
    window.performSwap = function (roomA, roomB) {
        const sessionKey = allotmentSessionSelect.value;
        const invigNameA = currentInvigMapping[roomA];
        const invigNameB = currentInvigMapping[roomB];

        // Update Mapping (Swap logic handles empty/unassigned too)
        if (invigNameB) {
            currentInvigMapping[roomA] = invigNameB;
        } else {
            delete currentInvigMapping[roomA];
        }

        if (invigNameA) {
            currentInvigMapping[roomB] = invigNameA;
        } else {
            delete currentInvigMapping[roomB];
        }

        // Save & Sync
        const allMappings = JSON.parse(localStorage.getItem(INVIG_MAPPING_KEY) || '{}');
        allMappings[sessionKey] = currentInvigMapping;
        localStorage.setItem(INVIG_MAPPING_KEY, JSON.stringify(allMappings));
        if (typeof syncDataToCloud === 'function') syncDataToCloud('staff');

        // Reset UI
        swapSourceRoom = null;
        renderInvigilationPanel();

        // Optional Feedback
        // alert("Swapped successfully!"); 
    }

    // 4. Open Modal (Populates List)
    window.openInvigModal = function (roomName) {
        const modal = document.getElementById('invigilator-select-modal');
        const list = document.getElementById('invig-options-list');
        const input = document.getElementById('invig-search-input');
        const sessionKey = allotmentSessionSelect.value;

        if (document.getElementById('invig-modal-subtitle')) {
            document.getElementById('invig-modal-subtitle').textContent = `Assigning to: ${roomName}`;
        }

        input.value = "";
        modal.classList.remove('hidden');
        setTimeout(() => input.focus(), 100);

        // Get Data
        const invigSlots = JSON.parse(localStorage.getItem('examInvigilationSlots') || '{}');
        const staffData = JSON.parse(localStorage.getItem('examStaffData') || '[]');
        const slot = invigSlots[sessionKey];

        if (!slot || !slot.assigned || slot.assigned.length === 0) {
            list.innerHTML = '<p class="text-xs text-red-500 text-center py-4 bg-red-50 rounded border border-red-100">No staff assigned to this session in Invigilation Portal.</p>';
            return;
        }

        const assignedSet = new Set(Object.values(currentInvigMapping));

        // Render Function
        const renderList = (filter = "") => {
            let html = "";
            const q = filter.toLowerCase();
            let hasResults = false;

            slot.assigned.forEach(email => {
                const staff = staffData.find(s => s.email === email) || { name: email.split('@')[0], dept: 'Unknown' };

                if (staff.name.toLowerCase().includes(q)) {
                    hasResults = true;
                    // Check if assigned to another room
                    const isTaken = assignedSet.has(staff.name) && currentInvigMapping[roomName] !== staff.name;

                    const bgClass = isTaken ? "bg-gray-50 opacity-60 cursor-not-allowed" : "hover:bg-indigo-50 cursor-pointer bg-white";
                    const status = isTaken
                        ? '<span class="text-[9px] text-red-500 font-bold bg-red-50 px-1 rounded border border-red-100">Busy</span>'
                        : '<span class="text-[9px] text-green-600 font-bold bg-green-50 px-1 rounded border border-green-100">Select</span>';

                    // Escape strings for safety
                    const safeRoom = roomName.replace(/'/g, "\\'");
                    const safeName = staff.name.replace(/'/g, "\\'");

                    // DIRECT ONCLICK (Fixes the click issue)
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

    // 5. Save Assignment (And Close Modal)
    window.saveInvigAssignment = function (room, name) {
        const sessionKey = allotmentSessionSelect.value;
        if (!sessionKey) return;

        currentInvigMapping[room] = name;

        // Save Global
        const allMappings = JSON.parse(localStorage.getItem(INVIG_MAPPING_KEY) || '{}');
        allMappings[sessionKey] = currentInvigMapping;
        localStorage.setItem(INVIG_MAPPING_KEY, JSON.stringify(allMappings));

        // Sync
        if (typeof syncDataToCloud === 'function') syncDataToCloud('staff');

        // Hide Modal
        document.getElementById('invigilator-select-modal').classList.add('hidden');

        // Refresh UI
        window.renderInvigilationPanel();
    }

    // 6. Auto-Assign
    window.autoAssignInvigilators = function () {
        const sessionKey = allotmentSessionSelect.value;
        if (!sessionKey) return;

        const invigSlots = JSON.parse(localStorage.getItem('examInvigilationSlots') || '{}');
        const staffData = JSON.parse(localStorage.getItem('examStaffData') || '[]');
        const slot = invigSlots[sessionKey];

        if (!slot || !slot.assigned) return alert("No staff available in portal.");

        const availableStaff = [...slot.assigned];
        const usedNames = new Set(Object.values(currentInvigMapping));

        let changeCount = 0;

        // 1. Build Full Room List
        const allRoomNames = new Set();
        if (currentSessionAllotment) currentSessionAllotment.forEach(r => allRoomNames.add(r.roomName));
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        const sessionScribeMap = allScribeAllotments[sessionKey] || {};
        Object.values(sessionScribeMap).forEach(r => allRoomNames.add(r));

        // 2. Sort by Serial
        const serialMap = getRoomSerialMap(sessionKey);
        const sortedRooms = Array.from(allRoomNames).sort((a, b) => (serialMap[a] || 999) - (serialMap[b] || 999));

        // 3. Assign
        sortedRooms.forEach(roomName => {
            if (!currentInvigMapping[roomName]) {
                // Find a free staff
                const freeEmail = availableStaff.find(e => {
                    const name = (staffData.find(s => s.email === e) || {}).name || e;
                    return !usedNames.has(name);
                });

                if (freeEmail) {
                    const name = (staffData.find(s => s.email === freeEmail) || {}).name || freeEmail;
                    currentInvigMapping[roomName] = name;
                    usedNames.add(name);
                    changeCount++;
                }
            }
        });

        if (changeCount > 0) {
            const allMappings = JSON.parse(localStorage.getItem(INVIG_MAPPING_KEY) || '{}');
            allMappings[sessionKey] = currentInvigMapping;
            localStorage.setItem(INVIG_MAPPING_KEY, JSON.stringify(allMappings));
            if (typeof syncDataToCloud === 'function') syncDataToCloud('staff');
            renderInvigilationPanel();
            alert(`Auto-assigned ${changeCount} invigilators.`);
        } else {
            alert("No additional free staff found to assign.");
        }
    }

    // 7. Unassign All Invigilators
    window.unassignAllInvigilators = function () {
        const sessionKey = allotmentSessionSelect.value;
        if (!sessionKey) return;

        // Count current assignments to show in confirmation
        const currentCount = Object.keys(currentInvigMapping).length;
        if (currentCount === 0) return alert("No invigilators assigned to clear.");

        if (confirm(`Are you sure you want to REMOVE ALL ${currentCount} invigilator assignments for this session?\n\nThis action cannot be undone.`)) {
            // Clear current session mapping
            currentInvigMapping = {};

            // Update Global Storage
            const allMappings = JSON.parse(localStorage.getItem(INVIG_MAPPING_KEY) || '{}');
            allMappings[sessionKey] = currentInvigMapping;
            localStorage.setItem(INVIG_MAPPING_KEY, JSON.stringify(allMappings));

            // Sync to Cloud
            if (typeof syncDataToCloud === 'function') syncDataToCloud('staff');

            // Refresh UI
            renderInvigilationPanel();
            alert("All invigilator assignments cleared for this session.");
        }
    }


    // 5. Print List (Final: Stream-Wise Empty Rows + Invig Names + Dept + Mobile)
    window.printInvigilatorList = function () {
        const sessionKey = allotmentSessionSelect.value;
        if (!sessionKey) return;

        const [date, time] = sessionKey.split(' | ');
        const serialMap = getRoomSerialMap(sessionKey);

        // 1. Load Data
        const invigMap = JSON.parse(localStorage.getItem(INVIG_MAPPING_KEY) || '{}');
        const currentSessionInvigs = invigMap[sessionKey] || {};
        const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        const sessionScribeMap = allScribeAllotments[sessionKey] || {};

        // Load Staff Data for Dept & Phone Lookup
        const staffData = JSON.parse(localStorage.getItem('examStaffData') || '[]');
        const staffDetailsMap = {};
        staffData.forEach(s => {
            staffDetailsMap[s.name] = {
                dept: s.dept || "",
                phone: s.phone || ""
            };
        });

        // 2. Build Consolidated Room List
        const roomList = [];

        // A. Regular Allotments
        if (currentSessionAllotment) {
            currentSessionAllotment.forEach(r => {
                roomList.push({
                    name: r.roomName,
                    stream: r.stream || "Regular",
                    isScribe: false,
                    serial: serialMap[r.roomName] || 999
                });
            });
        }

        // B. Prepare Student Counts (For Empty Row Logic)
        const streamCounts = {};
        const scribeStreamMap = {};

        if (allStudentData) {
            const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
            const globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
            const scribeRegNos = new Set(globalScribeList.map(s => s.regNo));

            const regStreamMap = {};
            sessionStudents.forEach(s => {
                const sStream = s.Stream || "Regular";
                regStreamMap[s['Register Number']] = sStream;

                if (!streamCounts[sStream]) streamCounts[sStream] = { candidates: 0, scribes: 0 };

                if (scribeRegNos.has(s['Register Number'])) {
                    streamCounts[sStream].scribes++;
                } else {
                    streamCounts[sStream].candidates++;
                }
            });

            Object.entries(sessionScribeMap).forEach(([regNo, roomName]) => {
                const sStream = regStreamMap[regNo] || "Regular";
                if (!scribeStreamMap[roomName]) scribeStreamMap[roomName] = sStream;
                else if (scribeStreamMap[roomName] !== "Regular" && sStream === "Regular") scribeStreamMap[roomName] = "Regular";
            });
        }

        // C. Scribe Allotments
        const scribeRooms = new Set(Object.values(sessionScribeMap));
        scribeRooms.forEach(roomName => {
            roomList.push({
                name: roomName,
                stream: scribeStreamMap[roomName] || "Regular",
                isScribe: true,
                serial: serialMap[roomName] || 999
            });
        });

        // 3. Group Rooms by Stream
        const streams = {};
        roomList.forEach(r => {
            const s = r.stream || "Regular";
            if (!streams[s]) streams[s] = [];
            streams[s].push(r);
        });

        // 4. Get Exam Name
        let examName = getExamName(date, time, "Regular");
        if (!examName) {
            const otherStreams = Object.keys(streams).filter(s => s !== "Regular");
            if (otherStreams.length > 0) examName = getExamName(date, time, otherStreams[0]);
        }
        if (!examName) examName = "University Examinations";

        // 5. Generate HTML
        let rowsHtml = "";

        const sortedStreamNames = Object.keys(streams).sort((a, b) => {
            if (a === "Regular") return -1;
            if (b === "Regular") return 1;
            return a.localeCompare(b);
        });

        Object.keys(streamCounts).forEach(s => {
            if (!streams[s] && !sortedStreamNames.includes(s)) sortedStreamNames.push(s);
        });

        sortedStreamNames.forEach(streamName => {
            const list = streams[streamName] || [];
            list.sort((a, b) => a.serial - b.serial);

            const title = streamName.toLowerCase().includes('stream') ? streamName : `${streamName} Stream`;

            // A. Stream Header
            rowsHtml += `
            <tr style="background-color:#f3f4f6;">
                <td colspan="9" style="border:1px solid #000; padding:6px; font-weight:bold; text-transform:uppercase; font-size:11pt;">
                    ${title}
                </td>
            </tr>
        `;

            // B. Actual Rooms
            list.forEach(room => {
                const invigName = currentSessionInvigs[room.name] || "-";
                const staffInfo = staffDetailsMap[invigName] || { dept: "", phone: "" };
                const invigDept = staffInfo.dept;
                const invigPhone = staffInfo.phone;

                const roomInfo = currentRoomConfig[room.name] || {};
                const displayLoc = (roomInfo.location && roomInfo.location.trim()) ? roomInfo.location : room.name;
                const scribeBadge = room.isScribe ? `<span style="font-size:8pt; font-weight:bold; margin-left:5px;">(Scribe)</span>` : "";

                // --- FORMAT INFO: Name + Dept | Phone ---
                let metaInfo = invigDept;
                if (invigPhone) {
                    metaInfo = metaInfo ? `${metaInfo} | ${invigPhone}` : invigPhone;
                }

                const invigDisplay = (invigName !== "-")
                    ? `<div style="line-height:1.2;"><strong>${invigName}</strong><br><span style="font-size:8pt; color:#444;">${metaInfo}</span></div>`
                    : "-";

                rowsHtml += `
                <tr>
                    <td style="border:1px solid #000; padding:6px; text-align:center; font-weight:bold;">${room.serial}</td>
                    <td style="border:1px solid #000; padding:6px;">
                        ${displayLoc} ${scribeBadge}
                    </td>
                    <td style="border:1px solid #000; padding:6px;">${invigDisplay}</td>
                    <td style="border:1px solid #000; padding:6px;"></td> <td style="border:1px solid #000; padding:6px;"></td> <td style="border:1px solid #000; padding:6px;"></td> <td style="border:1px solid #000; padding:6px;"></td> <td style="border:1px solid #000; padding:6px;"></td> <td style="border:1px solid #000; padding:6px;"></td> </tr>`;
            });

            // C. Empty Rows
            const stats = streamCounts[streamName] || { candidates: 0, scribes: 0 };
            const candidateReq = Math.ceil(stats.candidates / 30);
            const scribeReq = stats.scribes;
            const totalReq = candidateReq + scribeReq;
            const emptyRowsNeeded = Math.max(2, totalReq - list.length);

            for (let i = 0; i < emptyRowsNeeded; i++) {
                rowsHtml += `
                <tr>
                    <td style="border:1px solid #000; padding:6px; text-align:center; color:#ccc;">-</td>
                    <td style="border:1px solid #000; padding:6px;"></td>
                    <td style="border:1px solid #000; padding:6px;"></td>
                    <td style="border:1px solid #000; padding:6px;"></td>
                    <td style="border:1px solid #000; padding:6px;"></td>
                    <td style="border:1px solid #000; padding:6px;"></td>
                    <td style="border:1px solid #000; padding:6px;"></td>
                    <td style="border:1px solid #000; padding:6px;"></td>
                    <td style="border:1px solid #000; padding:6px;"></td>
                </tr>`;
            }
        });

        // 6. Generate Print Window
        const w = window.open('', '_blank');
        w.document.write(`
        <html>
        <head>
            <title>Invigilation List - ${date}</title>
            <style>
                body { font-family: 'Arial', sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 15px; }
                .header h1 { margin: 0; font-size: 16pt; text-transform: uppercase; }
                .header h2 { margin: 5px 0 0; font-size: 14pt; font-weight: bold; }
                .header h3 { margin: 5px 0 0; font-size: 12pt; }
                
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
                th { background: #eee; border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; }
                td { vertical-align: middle; }
                
                .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11pt; font-weight: bold; }
                .footer div { text-align: center; width: 30%; border-top: 1px solid #000; padding-top: 5px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${currentCollegeName}</h1>
                <h2>${examName}</h2>
                <h3>${date} &nbsp;|&nbsp; ${time}</h3>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">Sl</th>
                        <th style="width: 15%; text-align:left;">Hall / Location</th>
                        <th style="width: 20%; text-align:left;">Invigilator</th>
                        <th style="width: 13%;">RNBB</th>
                        <th style="width: 6%;">Asgd</th>
                        <th style="width: 6%;">Used</th>
                        <th style="width: 6%;">Retd</th>
                        <th style="width: 10%;">Remarks</th>
                        <th style="width: 19%;">Sign</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>

            <div class="footer">
                <div>Senior Assistant Superintendent</div>
                <div>Chief Superintendent</div>
            </div>

            <script>window.onload = () => window.print();<\/script>
        </body>
        </html>
    `);
        w.document.close();
    }

// ==========================================
    // 🔧 DATA NORMALIZATION TOOL (Fixes Time Formats)
    // ==========================================
    const btnNormalizeTime = document.getElementById('btn-normalize-time');
    
    if (btnNormalizeTime) {
        btnNormalizeTime.addEventListener('click', async () => {
            if (!confirm("⚠️ MAINTENANCE: Fix Time Formats?\n\nThis will scan ALL data (Students, Allotments, Invigilation, Scribes) and unify time formats (e.g., '2:00 PM' -> '02:00 PM').\n\nIf you have split sessions, they will be MERGED.\n\nProceed?")) return;

            btnNormalizeTime.disabled = true;
            btnNormalizeTime.textContent = "Processing...";

            try {
                // 1. Helper: Ensure 2-digit Hour (Reuse global if avail, else local)
                const normTime = (tStr) => {
                    if (!tStr) return "";
                    const t = tStr.trim().toUpperCase();
                    // Parse 12h or 24h
                    const match = t.match(/(\d+):(\d+)\s*(AM|PM)?/);
                    if (!match) return tStr;
                    
                    let h = parseInt(match[1]);
                    const m = match[2];
                    const ap = match[3] || (h >= 12 ? "PM" : "AM");
                    
                    // Logic to handle 24h input conversion if needed
                    if (!match[3] && h > 12) { 
                        h -= 12; 
                    } 
                    
                    // Format
                    const hh = String(h).padStart(2, '0');
                    return `${hh}:${m} ${ap}`;
                };

                // 2. Fix Student Data (Base Data)
                let studentUpdateCount = 0;
                if (allStudentData) {
                    allStudentData.forEach(s => {
                        const oldT = s.Time;
                        const newT = normTime(oldT);
                        if (oldT !== newT) {
                            s.Time = newT;
                            studentUpdateCount++;
                        }
                    });
                    localStorage.setItem(BASE_DATA_KEY, JSON.stringify(allStudentData));
                }

                // 3. Fix Object Keys (Slots, Allotments, etc.)
                // type: 'array' (Allotment), 'object' (Scribe/Mapping), 'slot' (Invig Slots)
                const fixStorageKeys = (keyName, type) => {
                    const raw = localStorage.getItem(keyName);
                    if (!raw) return;
                    
                    let data = {};
                    try { data = JSON.parse(raw); } catch(e){ return; }

                    let changed = false;
                    const newData = {};

                    Object.keys(data).forEach(oldKey => {
                        if (oldKey.includes('|')) {
                            const [d, t] = oldKey.split('|');
                            if (d && t) {
                                const newT = normTime(t);
                                const newKey = `${d.trim()} | ${newT}`;
                                
                                if (newKey !== oldKey) {
                                    changed = true;
                                    console.log(`Migrating: ${oldKey} -> ${newKey}`);
                                }

                                if (newData[newKey]) {
                                    // MERGE COLLISION
                                    if (type === 'array') {
                                        // Concatenate arrays (Room Allotments, Absentees)
                                        newData[newKey] = [...newData[newKey], ...data[oldKey]];
                                    } else if (type === 'object') {
                                        // Merge objects (Scribe Maps, Invig Maps)
                                        newData[newKey] = { ...newData[newKey], ...data[oldKey] };
                                    } else if (type === 'slot') {
                                        // Invigilation Slots (Complex Merge)
                                        const target = newData[newKey];
                                        const source = data[oldKey];
                                        // Merge Assigned Staff (Unique)
                                        target.assigned = [...new Set([...target.assigned, ...source.assigned])];
                                        // Merge Unavailable
                                        target.unavailable = [...target.unavailable, ...source.unavailable];
                                        // Sum Counts
                                        target.studentCount += source.studentCount;
                                        target.scribeCount += source.scribeCount;
                                        // Keep strict lock if either was locked
                                        target.isLocked = target.isLocked || source.isLocked;
                                    }
                                } else {
                                    // No collision, just move
                                    newData[newKey] = data[oldKey];
                                }
                            } else {
                                newData[oldKey] = data[oldKey];
                            }
                        } else {
                            newData[oldKey] = data[oldKey];
                        }
                    });

                    if (changed) {
                        localStorage.setItem(keyName, JSON.stringify(newData));
                    }
                };

                // Run Fixers
                fixStorageKeys('examRoomAllotment', 'array');      // Room Allotments
                fixStorageKeys('examAbsenteeList', 'array');       // Absentee Lists
                fixStorageKeys('examScribeAllotment', 'object');   // Scribe Allocations
                fixStorageKeys('examInvigilatorMapping', 'object');// Invig Room Assignments
                fixStorageKeys('examInvigilationSlots', 'slot');   // Invigilation Duty Slots

                // 4. Sync & Reload
                if (typeof syncDataToCloud === 'function') {
                // Sync ALL buckets because times were changed everywhere
                await syncDataToCloud('heavy');      // Student Data & Rooms
                await syncDataToCloud('ops');        // Absentees & QP Codes
                await syncDataToCloud('allocation'); // Scribes
                await syncDataToCloud('staff');      // Invigilator Assignments
                await syncDataToCloud('slots');      // Duty Slots
                }

                alert(`✅ Normalization Complete!\n\n• Updated ${studentUpdateCount} student records.\n• Merged split sessions.\n\nThe page will now reload.`);
                window.location.reload();

            } catch (e) {
                console.error(e);
                alert("Error during normalization: " + e.message);
            } finally {
                btnNormalizeTime.disabled = false;
                btnNormalizeTime.textContent = "Fix/Normalize Time Formats";
            }
        });
    }

    // ==========================================
    // ☁️ SUPER ADMIN: STORAGE MONITOR
    // ==========================================

    const btnStorageStats = document.getElementById('btn-storage-stats');
    const storageModal = document.getElementById('storage-stats-modal');
    const closeStorageModalBtn = document.getElementById('close-storage-modal');
    const storageList = document.getElementById('storage-stats-list');

    // Open Modal
    if (btnStorageStats) {
        btnStorageStats.addEventListener('click', () => {
            storageModal.classList.remove('hidden');
            loadStorageStats();
        });
    }

    // Close Modal
    if (closeStorageModalBtn) {
        closeStorageModalBtn.addEventListener('click', () => {
            storageModal.classList.add('hidden');
        });
    }

    // Fetch & Calculate Stats
    async function loadStorageStats() {
        if (!storageList) return;

        storageList.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 text-gray-500">
            <span class="animate-spin text-3xl mb-3">⏳</span>
            <p class="text-sm font-medium">Scanning database clusters...</p>
            <p class="text-xs text-gray-400">This may take a moment.</p>
        </div>`;

        const { db, collection, getDocs, doc, getDoc } = window.firebase;

        try {
            // 1. Get All Colleges
            const colRef = collection(db, "colleges");
            const snap = await getDocs(colRef);

            if (snap.empty) {
                storageList.innerHTML = '<p class="text-center text-gray-400 py-10">No colleges found in database.</p>';
                return;
            }

            let rowsHtml = "";

            // 2. Process in Parallel
            const promises = snap.docs.map(async (collegeDoc) => {
                const data = collegeDoc.data();
                const name = data.examCollegeName || "Unnamed College";
                const id = collegeDoc.id;
                const limitBytes = data.storageLimitBytes || (15 * 1024 * 1024);
                const limitMB = (limitBytes / (1024 * 1024)).toFixed(1);

                // Calculate Usage via Chunk Metadata
                let totalChunks = 0;
                let sizeMB = 0;
                let statusBadge = '<span class="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded">Empty</span>';

                try {
                    // We only fetch 'chunk_0' to read the 'totalChunks' property
                    // This saves us from downloading the entire 15MB dataset just to check size
                    const chunkRef = doc(db, "colleges", id, "data", "chunk_0");
                    const chunkSnap = await getDoc(chunkRef);

                    if (chunkSnap.exists()) {
                        const chunkData = chunkSnap.data();
                        totalChunks = chunkData.totalChunks || 1;
                        // Each chunk is ~800,000 chars ≈ 0.76 MB
                        sizeMB = (totalChunks * 0.76).toFixed(2);

                        // Determine Status
                        const percentage = (sizeMB / limitMB) * 100;
                        if (percentage > 90) {
                            statusBadge = `<span class="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200">CRITICAL (${Math.round(percentage)}%)</span>`;
                        } else if (percentage > 75) {
                            statusBadge = `<span class="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-200">Warning (${Math.round(percentage)}%)</span>`;
                        } else {
                            statusBadge = `<span class="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200">Healthy (${Math.round(percentage)}%)</span>`;
                        }
                    }
                } catch (e) {
                    console.error(`Access error for ${name}:`, e);
                    statusBadge = `<span class="bg-gray-100 text-red-500 text-[10px] px-2 py-0.5 rounded">Error</span>`;
                }

                return {
                    html: `
                <tr class="hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
                    <td class="px-4 py-3">
                        <div class="font-bold text-gray-800 text-sm">${name}</div>
                        <div class="text-[10px] text-gray-400 font-mono truncate max-w-[150px]" title="${id}">${id}</div>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <div class="text-xs font-mono font-bold text-gray-700">${sizeMB > 0 ? sizeMB + ' MB' : '-'}</div>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <div class="text-xs text-gray-500">${limitMB} MB</div>
                    </td>
                    <td class="px-4 py-3 text-right">
                        ${statusBadge}
                    </td>
                </tr>`,
                    size: parseFloat(sizeMB)
                };
            });

            const results = await Promise.all(promises);

            // Sort by Usage (Highest first)
            results.sort((a, b) => b.size - a.size);

            const tableHtml = `
            <div class="border border-gray-200 rounded-lg overflow-hidden">
                <table class="w-full text-sm text-left">
                    <thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-4 py-2">College / ID</th>
                            <th class="px-4 py-2 text-center">Usage</th>
                            <th class="px-4 py-2 text-center">Limit</th>
                            <th class="px-4 py-2 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 bg-white">
                        ${results.map(r => r.html).join('')}
                    </tbody>
                </table>
            </div>
        `;

            storageList.innerHTML = tableHtml;

        } catch (e) {
            console.error("Stats Error:", e);
            storageList.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded p-4 text-center">
                <p class="text-red-600 font-bold text-sm">Connection Failed</p>
                <p class="text-red-500 text-xs mt-1">${e.message}</p>
            </div>`;
        }
    }

// ==========================================
    // ☢️ CINEMATIC DANGER ZONE LOGIC
    // ==========================================
    
    const btnEnterDanger = document.getElementById('btn-enter-danger-zone');
    
    if (btnEnterDanger) {
        btnEnterDanger.addEventListener('click', async () => {
            // 🎬 Cinematic Alert 1: The Gatekeeper
            // Using standard confirm/alert for now, but phrasing it dramatically
            
            const step1 = confirm(
                "⚠️ HOLD IT RIGHT THERE! ⚠️\n\n" +
                "You are approaching the DANGER ZONE.\n" +
                "Here lie the buttons of destruction, master resets, and the void.\n\n" +
                "Do you have the courage to proceed?"
            );

            if (!step1) return;

            // 🎬 Cinematic Alert 2: The Final Warning
            // We use a small timeout to make it feel like a "system check"
            await new Promise(r => setTimeout(r, 300));
            
            alert(
                "☢️ ACCESS GRANTED... WITH A WARNING ☢️\n\n" +
                "Some actions inside CANNOT be undone.\n" +
                "We are not responsible for lost data, tears, or accidental timeline disruptions.\n\n" +
                "YOU HAVE BEEN WARNED."
            );

            // Open the Modal
            window.openModal('danger-zone-modal');
        });
    }

// ==========================================
    // 🛠️ MODAL HELPERS (Fixes the "not a function" error)
    // ==========================================
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            // Animation handling (optional, matches your CSS)
            modal.classList.remove('opacity-0'); 
            modal.classList.add('opacity-100');
        } else {
            console.error("Modal not found:", modalId);
        }
    };

    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('opacity-100');
            modal.classList.add('opacity-0');
        }
    };
    
    // --- ROOM SETTINGS MODAL LOGIC ---
    const roomSettingsModal = document.getElementById('room-settings-modal');

    window.openRoomSettingsModal = function () {
        roomSettingsModal.classList.remove('hidden');
        loadRoomConfig(); // Refresh list when opening
    }

    window.closeRoomSettingsModal = function () {
        roomSettingsModal.classList.add('hidden');
    }

// ==========================================
    // ☁️ FORCE CLOUD SYNC (Header Button)
    // ==========================================
    const headerSyncStatus = document.getElementById('sync-status');
    
    if (headerSyncStatus) {
        // 1. Visual Cues
        headerSyncStatus.style.cursor = "pointer";
        headerSyncStatus.title = "Click to Force Save to Cloud";
        headerSyncStatus.classList.add("hover:underline"); // Add underline on hover

        // 2. Click Handler
        headerSyncStatus.addEventListener('click', async () => {
            const currentText = headerSyncStatus.textContent;
            
            // Prevent double-clicking if already saving
            if (currentText === "Saving..." || currentText === "Connecting...") return;

            if (confirm("☁️ FORCE SYNC: Save all local data to the Cloud now?")) {
                if (typeof syncDataToCloud === 'function') {
                // Update UI immediately
                updateSyncStatus("Saving...", "neutral");
    
                // Trigger a FULL save of all sections
                await syncDataToCloud('settings');
                await syncDataToCloud('ops');
                await syncDataToCloud('allocation');
                await syncDataToCloud('staff');
                await syncDataToCloud('slots');
                await syncDataToCloud('heavy');
                } else {
                alert("Sync function is not ready yet. Please wait.");
                }
            }
        });
    }
    // Initial Call (in case we start on settings page or refresh)
    updateStudentPortalLink();
    // --- NEW: Restore Last Active Tab ---
    function restoreActiveTab() {
        const savedViewId = localStorage.getItem('lastActiveViewId');
        const savedNavId = localStorage.getItem('lastActiveNavId');

        if (savedViewId && savedNavId) {
            const view = document.getElementById(savedViewId);
            const nav = document.getElementById(savedNavId);
            if (view && nav) {
                // Programmatically switch to the saved tab
                showView(view, nav);
            }
        }
    }

    // Call it after data is loaded
    restoreActiveTab();
});
