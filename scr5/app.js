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

// --- Helper to split large strings for Cloud Storage ---
function chunkString(str, size) {
    const numChunks = Math.ceil(str.length / size);
    const chunks = [];
    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
        chunks.push(str.substr(o, size));
    }
    return chunks;
}

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

// --- MAIN APP LOGIC ---
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
window.finalizeAppLoad = function() {
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
 
// *** MOVED HERE TO FIX ERROR ***
const EXAM_RULES_KEY = 'examRulesConfig'; 
let currentExamRules = []; 
let isExamRulesLocked = true; // <--- ADD THIS NEW VARIABLE
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
    EXAM_RULES_KEY // <--- ADD THIS LINE (To include in Backup/Restore)
];
// **********************************
    
// --- Debounce Helper Function ---
function debounce(func, delay) {
    let timeout;
    return function(...args) {
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
const adminModal = document.getElementById('admin-modal');
const closeAdminModal = document.getElementById('close-admin-modal');
const newUserEmailInput = document.getElementById('new-user-email');
const addUserBtn = document.getElementById('add-user-btn');
const userListContainer = document.getElementById('user-list');
const absenteeQpFilter = document.getElementById('absentee-qp-filter');
    
    // *** MOVED HERE TO FIX ERROR ***
const SUPER_ADMIN_EMAIL = "sureshmagnolia@gmail.com"; 
// ******************************

let currentUser = null;
let currentCollegeId = null; // The shared document ID
let currentCollegeData = null; // Holds the full data including permissions
let isSyncing = false;
let cloudSyncUnsubscribe = null; // [NEW] To track the active listener

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
    logoutBtn.addEventListener('click', () => {
        const { auth, signOut } = window.firebase;
        if (confirm("Log out?")) {
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
            userInfoDiv.classList.remove('hidden');
            userNameDisplay.textContent = user.displayName || "User";
            
            // START: Find or Create College
            findMyCollege(user); // findMyCollege will call finalizeAppLoad on success/fail
        } else {
            currentUser = null;
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            userInfoDiv.classList.add('hidden');
            adminBtn.classList.add('hidden'); // Hide admin button

            // --- FIX: Load Local Data even if not logged in ---
            loadInitialData(); 
            // -------------------------------------------------

            // CRITICAL: Finalize if user is not authenticated
            finalizeAppLoad(); 
        }
    });
}
// ------------------------------------------

async function createNewCollege(user) {
    // 1. ASK FOR NAME
    let newName = prompt("Please enter the Official Name of your College/Institution:");
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
        if(val) initialData[key] = val;
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
        alert(`✅ Database Created for "${newName}"!\nYou are the Admin.`);
        syncDataFromCloud(currentCollegeId); 
    } catch (e) {
        console.error("Creation failed:", e);
        alert("Failed to create database. " + e.message);
    }
}


// ==========================================
// ☁️ CLOUD SYNC FUNCTIONS (Fixed & Updated)
// ==========================================

// 5. CLOUD DOWNLOAD FUNCTION (Network Aware)
function syncDataFromCloud(collegeId) {
    // 1. Cleanup previous listener if exists (prevents duplicates on reconnect)
    if (cloudSyncUnsubscribe) {
        cloudSyncUnsubscribe();
        cloudSyncUnsubscribe = null;
    }

    // 2. Offline Check
    if (!navigator.onLine) {
        console.log("⚠️ Offline Mode. Loading local data.");
        updateSyncStatus("Offline Mode", "error");
        loadInitialData();
        if (typeof finalizeAppLoad === 'function') finalizeAppLoad();
        return;
    }

    updateSyncStatus("Connecting...", "neutral");
    const { db, doc, onSnapshot, collection, getDocs, query, orderBy } = window.firebase;
    
    const mainRef = doc(db, "colleges", collegeId);
    
    // 3. Assign listener to global variable
    cloudSyncUnsubscribe = onSnapshot(mainRef, async (docSnap) => {
        if (docSnap.exists()) {
            const mainData = docSnap.data();
            currentCollegeData = mainData; 

            // Admin Permission Check
            if (currentCollegeData.admins && currentUser && currentCollegeData.admins.includes(currentUser.email)) {
                if(adminBtn) adminBtn.classList.remove('hidden');
            } else {
                if(adminBtn) adminBtn.classList.add('hidden');
            }

            // === TIMESTAMP CHECK ===
            const localTime = localStorage.getItem('lastUpdated');
            
            if (localTime && mainData.lastUpdated) {
                if (localTime === mainData.lastUpdated) {
                    updateSyncStatus("Synced", "success");
                    loadInitialData(); 
                    if (typeof finalizeAppLoad === 'function') finalizeAppLoad(); 
                    return; 
                }
                if (localTime > mainData.lastUpdated) {
                    console.log("⚠️ Local data is newer than cloud.");
                    updateSyncStatus("Unsaved Changes", "neutral"); 
                    loadInitialData(); 
                    if (typeof finalizeAppLoad === 'function') finalizeAppLoad();
                    return;
                }
            }

            console.log("☁️ New cloud data detected. Downloading...");
            
            // 1. Save Main Keys
            [
                'examRoomConfig', 'examStreamsConfig', 'examCollegeName', 
                'examQPCodes', 'examScribeList', 'examScribeAllotment', 
                'examAbsenteeList', 'examSessionNames', 'lastUpdated', 'examRulesConfig'
            ].forEach(key => {
                if (mainData[key]) localStorage.setItem(key, mainData[key]);
            });
            updateHeaderCollegeName(); // <--- ADD THIS LINE HERE

            // -------------------------------------------------------
            // 🔄 LEGACY MIGRATION: Auto-Prompt for Missing Name
            // -------------------------------------------------------
            // Check if Name is missing OR is the default, AND if user is Admin
            const currentName = mainData.examCollegeName || "University of Calicut";
            const isDefault = (currentName === "University of Calicut");
            const isAdmin = (currentUser && mainData.admins && mainData.admins.includes(currentUser.email));

            if (isDefault && isAdmin) {
                setTimeout(() => {
                    const newName = prompt("⚠️ SYSTEM UPDATE ⚠️\n\nYour College Name is not set.\nPlease enter the Official Name of your College to display on the header and reports:");
                    
                    if (newName && newName.trim() !== "") {
                        // 1. Save Locally
                        localStorage.setItem(COLLEGE_NAME_KEY, newName);
                        currentCollegeName = newName;
                        
                        // 2. Update UI
                        updateHeaderCollegeName();
                        if (typeof collegeNameInput !== 'undefined') collegeNameInput.value = newName;

                        // 3. Force Sync to Cloud (Saves it forever)
                        syncDataToCloud();
                        alert("✅ Name Updated! It will now appear on all screens.");
                    }
                }, 1000); // Small delay to let the UI load first
            }
            // -------------------------------------------------------
            
            // 2. FETCH CHUNKS
            try {
                const dataColRef = collection(db, "colleges", collegeId, "data");
                const q = query(dataColRef, orderBy("index")); 
                const querySnapshot = await getDocs(q);
                
                let fullPayload = "";
                querySnapshot.forEach((doc) => {
                    if (doc.id.startsWith("chunk_")) {
                        fullPayload += doc.data().payload;
                    }
                });

                if (fullPayload) {
                    const bulkData = JSON.parse(fullPayload);
                    ['examBaseData', 'examRoomAllotment'].forEach(key => {
                        if (bulkData[key]) localStorage.setItem(key, bulkData[key]);
                    });
                }
            } catch (err) {
                console.error("Bulk fetch error:", err);
            }

            // 3. Refresh UI
            updateSyncStatus("Synced", "success");
            loadInitialData();
            
            if (typeof viewRoomAllotment !== 'undefined' && !viewRoomAllotment.classList.contains('hidden') && allotmentSessionSelect.value) {
                 allotmentSessionSelect.dispatchEvent(new Event('change'));
            }
            
            if (typeof finalizeAppLoad === 'function') finalizeAppLoad();

        } else {
            updateSyncStatus("No Cloud Data", "neutral");
            loadInitialData(); 
            if (typeof finalizeAppLoad === 'function') finalizeAppLoad();
        }
    }, (error) => {
        console.error("Sync Error:", error);
        // Handle offline/permission errors gracefully
        updateSyncStatus("Offline / Error", "error");
        loadInitialData(); 
        if (typeof finalizeAppLoad === 'function') finalizeAppLoad();
    });
}
// 4. CLOUD UPLOAD FUNCTION (Network Aware)
async function syncDataToCloud() {
    if (!currentUser || !currentCollegeId) return;
    if (isSyncing) return;
    
    // [NEW] Offline Check
    if (!navigator.onLine) {
        updateSyncStatus("Offline - Saved Locally", "error");
        console.log("⚠️ Offline. Data saved to LocalStorage only.");
        return;
    }
    
    isSyncing = true;
    updateSyncStatus("Saving...", "neutral");

    const { db, doc, writeBatch, getDoc } = window.firebase; 
    
    try {
        const batch = writeBatch(db);
        const mainRef = doc(db, "colleges", currentCollegeId);

        // --- STEP 1: Fetch Current Cloud State ---
        const cloudSnap = await getDoc(mainRef);
        let cloudData = {};
        if (cloudSnap.exists()) {
            cloudData = cloudSnap.data();
        }

// --- STEP 2: Smart Merge Helpers ---
        const isEmptyOrDefault = (key, val) => {
            if (!val) return true;
            if (key === 'examCollegeName') return val === "University of Calicut";
            if (key === 'examStreamsConfig') return val.includes('["Regular"]');
            if (key === 'examRoomConfig') return val.length < 2000 && val.includes("Room 30"); 
            if (key === 'examScribeList') return val === '[]';
            if (key === 'examQPCodes') return val === '{}';
            if (key === 'examAbsenteeList') return val === '{}';
            if (key === 'examSessionNames') return val === '{}';
            // if (key === 'examRulesConfig') return val === '[]'; // <--- ADD THIS LINE
            if (key === 'examRoomAllotment' || key === 'examScribeAllotment') return val === '{}' || val.length < 5; 
            return false;
        };

        const pickRobusterValue = (key, localVal, cloudVal) => {
            if (!localVal) {
                if (cloudVal) {
                    localStorage.setItem(key, cloudVal); 
                    return cloudVal;
                }
                return null;
            }
            if (!cloudVal) return localVal;
            
            if (isEmptyOrDefault(key, localVal) && !isEmptyOrDefault(key, cloudVal)) {
                localStorage.setItem(key, cloudVal); 
                return cloudVal;
            }
            return localVal;
        };

        // --- STEP 3: Prepare Main Data ---
        const timestamp = new Date().toISOString();
        localStorage.setItem('lastUpdated', timestamp);

        const settingsKeys = [
            'examCollegeName', 
            'examStreamsConfig', 
            'examRoomConfig', 
            'examQPCodes', 
            'examScribeList', 
            'examScribeAllotment', 
            'examAbsenteeList',
            'examSessionNames',
            'examRulesConfig' // <--- ADD THIS LINE (To save to Cloud)
        ];

        const finalMainData = { lastUpdated: timestamp };

        settingsKeys.forEach(key => {
            const localVal = localStorage.getItem(key);
            const cloudVal = cloudData[key];
            const bestVal = pickRobusterValue(key, localVal, cloudVal);
            if (bestVal) finalMainData[key] = bestVal;
        });

        // --- STEP 4: Prepare Bulk Data ---
        const localBaseData = localStorage.getItem('examBaseData');
        let localAllotment = localStorage.getItem('examRoomAllotment');
        
        const bulkDataObj = {};
        if (localBaseData) bulkDataObj['examBaseData'] = localBaseData;
        
        if (localAllotment && localAllotment !== '{}') {
            bulkDataObj['examRoomAllotment'] = localAllotment;
        }
        
        const bulkString = JSON.stringify(bulkDataObj);

        // 🛑 LIMIT CHECK LOGIC STARTS HERE 🛑
        // 1. Calculate Size (in Bytes)
        const payloadSize = new Blob([bulkString]).size;
        const payloadSizeMB = (payloadSize / (1024 * 1024)).toFixed(2);

        // 2. Get Limit from Cloud Data (Default to 15MB if not set)
        // 'storageLimitBytes' is the field Super Admin will set
        const limitBytes = currentCollegeData.storageLimitBytes || (15 * 1024 * 1024); 
        const limitMB = (limitBytes / (1024 * 1024)).toFixed(2);

        console.log(`Data Size: ${payloadSizeMB} MB / Limit: ${limitMB} MB`);

        if (payloadSize > limitBytes) {
            alert(`⚠️ STORAGE LIMIT EXCEEDED ⚠️\n\nYour data size (${payloadSizeMB} MB) exceeds the allowed limit (${limitMB} MB) for your college.\n\nAction Required:\n1. Go to 'Danger Zone' or 'Settings'.\n2. Delete old student data or clear Absentees/Room Allotments.\n3. Try syncing again.`);
            
            updateSyncStatus("Over Limit", "error");
            isSyncing = false;
            return; // <--- STOP THE UPLOAD
        }
        // 🛑 LIMIT CHECK ENDS 🛑

        const chunks = chunkString(bulkString, 800000);

        // --- STEP 5: Commit ---
        batch.update(mainRef, finalMainData);

        chunks.forEach((chunkStr, index) => {
            const chunkRef = doc(db, "colleges", currentCollegeId, "data", `chunk_${index}`);
            batch.set(chunkRef, { payload: chunkStr, index: index, totalChunks: chunks.length });
        });
        
        await batch.commit();
        
        console.log(`Data synced!`);
        updateSyncStatus("Saved", "success");
        loadInitialData(); 

    } catch (e) {
        console.error("Sync Up Error:", e);
        if (e.code === 'not-found') {
             try {
                 await window.firebase.setDoc(window.firebase.doc(db, "colleges", currentCollegeId), { lastUpdated: new Date().toISOString() });
             } catch (retryErr) {}
        }
        // Check if error is network related
        if (e.code === 'unavailable' || !navigator.onLine) {
             updateSyncStatus("Offline - Saved Locally", "error");
        } else {
             updateSyncStatus("Save Fail", "error");
        }
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
    if (!newEmail.includes('@')) { alert("Invalid email"); return; }

    const { db, doc, updateDoc, arrayUnion } = window.firebase;
    
    try {
        const docRef = doc(db, "colleges", currentCollegeId);
        await updateDoc(docRef, {
            allowedUsers: arrayUnion(newEmail) // Atomically add email
        });
        
        // Update local cache
        if(!currentCollegeData.allowedUsers.includes(newEmail)) {
             currentCollegeData.allowedUsers.push(newEmail);
        }
        
        newUserEmailInput.value = '';
        renderUserList();
        alert(`User ${newEmail} added! They can now log in with their Google Account to see this data.`);
    } catch (e) {
        console.error("Add User Error:", e);
        alert("Failed to add user: " + e.message);
    }
});

// Remove User
window.removeUser = async function(email) {
    if (!confirm(`Remove access for ${email}?`)) return;
    
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
        alert("Failed to remove: " + e.message);
    }
}

// Helper for status UI
function updateSyncStatus(status, type) {
    if (!syncStatusDisplay) return;
    syncStatusDisplay.textContent = status;
    syncStatusDisplay.className = type === 'success' ? 'text-xs text-green-400' : (type === 'error' ? 'text-xs text-red-400' : 'text-xs text-yellow-400');
}

// --- Global var to hold data from the last *report run* ---
let lastGeneratedRoomData = [];
let lastGeneratedReportType = "";
let currentStreamConfig = ["Regular"]; // Default

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

// [In app.js - Replace the previous Exam Name logic with this]

const EXAM_NAMES_KEY = 'examSessionNames';
let currentExamNames = {}; 

// ==========================================
// 🗓️ EXAM SCHEDULER (DATABASE MODE)
// ==========================================

// Helper to determine if a time string is FN or AN
function getSessionType(timeStr) {
    if (!timeStr) return "FN"; // Default
    const t = timeStr.toUpperCase();
    // Logic: If PM or 12:xx, it's AN. Else FN.
    if (t.includes("PM") || t.startsWith("12:") || t.startsWith("12.")) return "AN";
    return "FN";
}

// Helper to convert Date+Session to a comparable number
// Returns timestamp + 0 (FN) or + 43200000 (AN - 12 hours)
function getSessionValue(dateStr, sessionType) {
    // dateStr format: "YYYY-MM-DD" (from input) OR "DD.MM.YYYY" (from csv)
    let d;
    if (dateStr.includes('-')) {
        d = new Date(dateStr); // YYYY-MM-DD
    } else {
        const [dd, mm, yyyy] = dateStr.split('.');
        d = new Date(`${yyyy}-${mm}-${dd}`); // Convert to ISO
    }
    // Set to noon to avoid timezone edge cases
    d.setHours(12, 0, 0, 0); 
    
    let val = d.getTime();
    // If AN, add 1 "tick" (we just need it to be > FN)
    if (sessionType === "AN") val += 1; 
    return val;
}

// --- CORE: Get Exam Name by checking Rules Database ---
function getExamName(date, time, stream) {
    // 1. Load Rules if empty (Safety)
    if (!currentExamRules || currentExamRules.length === 0) {
        const saved = localStorage.getItem(EXAM_RULES_KEY);
        if (saved) currentExamRules = JSON.parse(saved);
    }

    if (currentExamRules.length === 0) return "";

    // 2. Calculate Value for Current Student Record
    const currentSession = getSessionType(time);
    const currentValue = getSessionValue(date, currentSession);
    const currentStream = stream || "Regular";

    // 3. Find Matching Rule
    // We iterate in reverse to let newer rules (added last) take priority if overlaps exist
    for (let i = currentExamRules.length - 1; i >= 0; i--) {
        const rule = currentExamRules[i];
        
        // Stream Check
        if (rule.stream !== "All Streams" && rule.stream !== currentStream) continue;

        // Date/Session Range Check
        const startVal = getSessionValue(rule.startDate, rule.startSession);
        const endVal = getSessionValue(rule.endDate, rule.endSession);

        if (currentValue >= startVal && currentValue <= endVal) {
            return rule.examName;
        }
    }

    return ""; // No match found
}

// --- UI: Render the Scheduler Interface (Updated with Lock) ---
function renderExamNameSettings() {
    const container = document.getElementById('exam-names-grid');
    const section = document.getElementById('exam-names-section');
    
    // Load Rules
    const saved = localStorage.getItem(EXAM_RULES_KEY);
    currentExamRules = saved ? JSON.parse(saved) : [];

    if (!container || !section) return;

    section.classList.remove('hidden');
    container.innerHTML = '';

    // --- 1. ADD NEW ENTRY FORM ---
    const streams = (typeof currentStreamConfig !== 'undefined') ? currentStreamConfig : ["Regular"];
    const streamOptions = streams.map(s => `<option value="${s}">${s}</option>`).join('');
    
    const formHtml = `
        <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm mb-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-base font-bold text-gray-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-indigo-600"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                    Schedule New Exam
                </h3>
                <button id="toggle-exam-rules-lock" class="text-xs flex items-center gap-1 px-3 py-1 rounded transition shadow-sm ${isExamRulesLocked ? 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="${isExamRulesLocked ? 'M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25 2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z' : 'M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z'}" />
                    </svg>
                    <span>${isExamRulesLocked ? 'List Locked' : 'Unlocked'}</span>
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div class="md:col-span-4">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Exam Name</label>
                    <input type="text" id="rule-name" class="block w-full p-2 border border-gray-300 rounded text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. 5th Semester B.Sc">
                </div>

                <div class="md:col-span-2">
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Stream</label>
                    <select id="rule-stream" class="block w-full p-2 border border-gray-300 rounded text-sm bg-white">
                        <option value="All Streams">All Streams</option>
                        ${streamOptions}
                    </select>
                </div>

                <div class="md:col-span-3 bg-gray-50 p-2 rounded border border-gray-200">
                    <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">From</label>
                    <div class="flex gap-1">
                        <input type="date" id="rule-start-date" class="w-full p-1.5 border border-gray-300 rounded text-xs cursor-pointer" onclick="this.showPicker()">
                        <select id="rule-start-session" class="w-16 p-1.5 border border-gray-300 rounded text-xs">
                            <option value="FN">FN</option>
                            <option value="AN">AN</option>
                        </select>
                    </div>
                </div>

                <div class="md:col-span-3 bg-gray-50 p-2 rounded border border-gray-200">
                    <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">To</label>
                    <div class="flex gap-1">
                        <input type="date" id="rule-end-date" class="w-full p-1.5 border border-gray-300 rounded text-xs cursor-pointer" onclick="this.showPicker()">
                        <select id="rule-end-session" class="w-16 p-1.5 border border-gray-300 rounded text-xs">
                            <option value="AN" selected>AN</option>
                            <option value="FN">FN</option>
                        </select>
                    </div>
                </div>

                <div class="md:col-span-12 flex justify-end mt-2">
                    <button id="add-rule-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded text-sm font-medium shadow-sm transition">
                        + Add to Schedule
                    </button>
                </div>
            </div>
        </div>
    `;

    // --- 2. LIST EXISTING RULES (Database View) ---
    let listHtml = '';
    if (currentExamRules.length > 0) {
        const sortedRules = [...currentExamRules].sort((a, b) => {
            return new Date(a.startDate) - new Date(b.startDate);
        });

        let rows = '';
        sortedRules.forEach((rule) => {
            const fmt = (d) => d.split('-').reverse().slice(0, 2).join('/');
            
            // CHECK LOCK STATE FOR DELETE BUTTON
            const btnState = isExamRulesLocked 
                ? 'disabled opacity-30 cursor-not-allowed text-gray-400' 
                : 'text-red-500 hover:text-red-700 cursor-pointer';
            
            const onclickAction = isExamRulesLocked ? '' : `onclick="deleteExamRule('${rule.id}')"`;

            rows += `
                <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <td class="px-4 py-3 text-sm font-bold text-gray-800">${rule.examName}</td>
                    <td class="px-4 py-3 text-xs text-gray-600">
                        <span class="bg-gray-100 px-2 py-1 rounded border border-gray-200">${rule.stream}</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        ${fmt(rule.startDate)} <span class="text-xs font-bold text-orange-600">${rule.startSession}</span>
                        <span class="text-gray-400 mx-2">➝</span>
                        ${fmt(rule.endDate)} <span class="text-xs font-bold text-indigo-600">${rule.endSession}</span>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <button class="p-1 ${btnState}" ${onclickAction} title="${isExamRulesLocked ? 'Unlock list to delete' : 'Delete'}">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                        </button>
                    </td>
                </tr>
            `;
        });

        listHtml = `
            <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Exam Name</th>
                            <th class="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Stream</th>
                            <th class="px-4 py-2 text-xs font-bold text-gray-500 uppercase">Schedule Range</th>
                            <th class="px-4 py-2 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    } else {
        listHtml = `<div class="text-center text-gray-400 italic py-4 bg-white border border-dashed border-gray-300 rounded-lg">No exams scheduled yet. Add one above.</div>`;
    }

    container.innerHTML = formHtml + listHtml;

    // --- ATTACH LOCK LISTENER ---
    const lockBtn = document.getElementById('toggle-exam-rules-lock');
    if(lockBtn) {
        lockBtn.addEventListener('click', () => {
            isExamRulesLocked = !isExamRulesLocked;
            renderExamNameSettings(); // Re-render UI to reflect new state
        });
    }

    // --- ATTACH ADD BUTTON LISTENER ---
    const addBtn = document.getElementById('add-rule-btn');
    if(addBtn) {
        addBtn.addEventListener('click', () => {
            const name = document.getElementById('rule-name').value.trim();
            const stream = document.getElementById('rule-stream').value;
            const sDate = document.getElementById('rule-start-date').value;
            const sSess = document.getElementById('rule-start-session').value;
            const eDate = document.getElementById('rule-end-date').value;
            const eSess = document.getElementById('rule-end-session').value;

            if (!name || !sDate || !eDate) {
                alert("Please fill in Name, Start Date, and End Date.");
                return;
            }

            if (new Date(sDate) > new Date(eDate)) {
                alert("Start Date cannot be after End Date.");
                return;
            }

            // Create Rule Object
            const newRule = {
                id: Date.now().toString(),
                examName: name,
                stream: stream,
                startDate: sDate,
                startSession: sSess,
                endDate: eDate,
                endSession: eSess
            };

            currentExamRules.push(newRule);
            localStorage.setItem(EXAM_RULES_KEY, JSON.stringify(currentExamRules));
            
            renderExamNameSettings();
            if (typeof syncDataToCloud === 'function') syncDataToCloud();
        });
    }
}

// Global Delete Function for Rules
window.deleteExamRule = function(id) {
    if(confirm("Remove this exam schedule?")) {
        currentExamRules = currentExamRules.filter(r => r.id !== id);
        localStorage.setItem(EXAM_RULES_KEY, JSON.stringify(currentExamRules));
        renderExamNameSettings();
        if (typeof syncDataToCloud === 'function') syncDataToCloud();
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

// --- Helper function to create a new room row HTML (Updated Placeholder) ---
function createRoomRowHtml(roomName, capacity, location, isLast = false, isLocked = true) {
    const disabledAttr = isLocked ? 'disabled' : '';
    const bgClass = isLocked ? 'bg-gray-50 text-gray-500' : 'bg-white';

    // Edit Button
    const editBtnHtml = `
        <button class="edit-room-btn text-blue-600 hover:text-blue-800 p-1" title="Edit Row">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
        </button>
    `;

    const removeButtonHtml = isLast ? 
        `<button class="remove-room-button ml-2 text-sm text-red-600 hover:text-red-800 font-medium">&times; Remove</button>` : 
        `<div class="w-[70px]"></div>`;

    // Capacity Tag Logic
    let capBadge = "";
    const capNum = parseInt(capacity) || 0;
    if (capNum > 30) {
        capBadge = `<span class="ml-2 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200" title="Above Standard">▲ ${capNum}</span>`;
    } else if (capNum < 30) {
        capBadge = `<span class="ml-2 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200" title="Below Standard">▼ ${capNum}</span>`;
    }
    
    return `
        <div class="room-row flex items-center gap-2 p-2 border-b border-gray-200" data-room-name="${roomName}">
            <label class="room-name-label font-medium text-gray-700 w-24 shrink-0">${roomName}:</label>
            
            <div class="flex items-center">
                <input type="number" class="room-capacity-input block w-20 p-2 border border-gray-300 rounded-md shadow-sm text-sm ${bgClass}" 
                       value="${capacity}" min="1" placeholder="30" ${disabledAttr}>
                ${capBadge}
            </div>
            
            <input type="text" class="room-location-input block flex-grow p-2 border border-gray-300 rounded-md shadow-sm text-sm ${bgClass}" 
                   value="${location}" placeholder="e.g., 101 - Commerce Block" ${disabledAttr}>
            
            ${editBtnHtml}
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
// --- *** CENTRAL ALLOCATION FUNCTION (Manual Only) *** ---
function performOriginalAllocation(data) {
    const allAllotments = JSON.parse(localStorage.getItem(ROOM_ALLOTMENT_KEY) || '{}');
    const scribeRegNos = new Set((JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]')).map(s => s.regNo));
    
    // Helper to track seat numbers per room
    const sessionRoomOccupancy = {}; 

    const processed_rows_with_rooms = [];
    
    data.forEach(row => {
        const sessionKey = `${row.Date}_${row.Time}`;
        const sessionKeyPipe = `${row.Date} | ${row.Time}`;
        const isScribe = scribeRegNos.has(row['Register Number']);

        if (!sessionRoomOccupancy[sessionKey]) sessionRoomOccupancy[sessionKey] = {};

        let assignedRoomName = "Unallotted";
        let seatNumber = "N/A";

        // 1. Check Manual Allotment
        const manualAllotment = allAllotments[sessionKeyPipe];
        if (manualAllotment) {
            for (const room of manualAllotment) {
                // Check if student is in this room's list
                if (room.students.includes(row['Register Number'])) {
                    assignedRoomName = room.roomName;
                    
                    // Generate Seat Number
                    sessionRoomOccupancy[sessionKey][assignedRoomName] = (sessionRoomOccupancy[sessionKey][assignedRoomName] || 0) + 1;
                    seatNumber = sessionRoomOccupancy[sessionKey][assignedRoomName];
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
        if(dashContainer) dashContainer.classList.add('hidden');
        if(todayContainer) todayContainer.classList.add('hidden');
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

    if(dashStudent) dashStudent.textContent = totalStudents.toLocaleString();
    if(dashCourse) dashCourse.textContent = uniqueCourses.toLocaleString();
    if(dashDay) dashDay.textContent = uniqueDays.length.toLocaleString();
    if(dashContainer) dashContainer.classList.remove('hidden');

    // Ensure scribe list is loaded
    if (globalScribeList.length === 0) {
        globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
    }

    // 2. UPDATE "TODAY'S EXAM" STATS
    const today = new Date();
    const todayStr = formatDateToCSV(today); 
    
    if(todayDateDisplay) todayDateDisplay.textContent = today.toDateString();
    
    const todayHtml = generateSessionCardsHtml(todayStr);
    
    if (todayContainer) {
        if (todayHtml) {
            // Show Cards
            if(todayGrid) todayGrid.innerHTML = todayHtml;
            todayContainer.classList.remove('hidden');
        } else {
            // Show "No Exams" Message (Instead of hiding)
            if(todayGrid) todayGrid.innerHTML = `
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
                link.setAttribute("download", `ExamFlow_Full_Data_${new Date().toISOString().slice(0,10)}.csv`);
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

// --- Calendar Render Logic (Optimized: Slices + Blue Center + Smart Tooltip) ---

// --- Calendar Render Logic (Optimized: Explicit Requirements in Tooltips) ---
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
        
        const cellIndex = firstDayIndex + day - 1;
        const rowIndex = Math.floor(cellIndex / 7);
        const isTopRow = rowIndex === 0; 

        // --- FIX: Responsive Classes (Small on Mobile, Big on Desktop) ---
    const baseClass = "min-h-[60px] md:min-h-[90px] bg-white border-r border-b border-gray-200 flex flex-col items-center justify-center relative hover:bg-blue-50 transition group";
    
    // Changed: w-10 h-10 text-sm (Mobile) -> md:w-20 md:h-20 md:text-3xl (Desktop)
    let circleClass = "w-10 h-10 text-sm md:w-20 md:h-20 md:text-3xl rounded-full flex flex-col items-center justify-center relative font-bold text-gray-700 bg-transparent border border-transparent overflow-hidden";
    
    let circleStyle = "";
    let tooltipHtml = "";

    let dateNumberHtml = `<span class="z-10">${day}</span>`;
    if (isToday) {
        // Changed: w-8 h-8 text-sm (Mobile) -> md:w-12 md:h-12 md:text-2xl (Desktop)
        dateNumberHtml = `<span class="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-md z-20 text-sm md:text-2xl">${day}</span>`;
    }

    if (data) {
        const hasFN = data.am.students > 0;
        const hasAN = data.pm.students > 0;
        
        if (hasFN || hasAN) {
            // Update the colored circle class too
            circleClass = "w-10 h-10 text-sm md:w-20 md:h-20 md:text-3xl rounded-full flex flex-col items-center justify-center relative font-bold text-red-900 border border-red-200 overflow-hidden shadow-sm";
                const cLight = "#fee2e2"; 
                const cDark = "#fca5a5"; 

                if (hasFN && hasAN) {
                    circleStyle = `background: linear-gradient(to bottom, ${cDark} 0%, ${cDark} 35%, ${cLight} 35%, ${cLight} 65%, ${cDark} 65%, ${cDark} 100%);`;
                    dateNumberHtml = `
                        <span class="absolute top-1 text-[9px] text-red-900 font-extrabold leading-none opacity-80">FN</span>
                        ${dateNumberHtml}
                        <span class="absolute bottom-1 text-[9px] text-red-900 font-extrabold leading-none opacity-80">AN</span>
                    `;
                } else if (hasFN) {
                    circleStyle = `background: linear-gradient(to bottom, ${cDark} 0%, ${cDark} 35%, ${cLight} 35%, ${cLight} 100%);`;
                    dateNumberHtml = `
                        <span class="absolute top-1 text-[9px] text-red-900 font-extrabold leading-none opacity-80">FN</span>
                        ${dateNumberHtml}
                    `;
                } else if (hasAN) {
                    circleStyle = `background: linear-gradient(to bottom, ${cLight} 0%, ${cLight} 65%, ${cDark} 65%, ${cDark} 100%);`;
                    dateNumberHtml = `
                        ${dateNumberHtml}
                        <span class="absolute bottom-1 text-[9px] text-red-900 font-extrabold leading-none opacity-80">AN</span>
                    `;
                }
            }

            // Tooltip Generation (Explicit Requirements & Total)
            if (hasFN) {
                const regReq = Math.ceil(data.am.regCount / 30);
                const othReq = Math.ceil(data.am.othCount / 30);
                const scribeReq = Math.ceil(data.am.scribeCount / 5);
                const totalReq = regReq + othReq + scribeReq;
                
                let details = `Reg: ${regReq}`;
                if(othReq > 0) details += ` | Oth: ${othReq}`;
                if(scribeReq > 0) details += ` | Scr: ${scribeReq}`;

                tooltipHtml += `
                    <div class='mb-2 pb-2 border-b border-gray-200'>
                        <div class="flex justify-between items-center">
                            <strong class='text-red-600 uppercase text-[10px]'>Morning (FN)</strong>
                            <span class='text-gray-900 font-bold text-[10px]'>${data.am.students} Students</span>
                        </div>
                        <div class="mt-1 bg-gray-50 p-1 rounded border border-gray-100">
                            <div class="flex justify-between text-[10px] font-bold text-gray-700">
                                <span>Est. Rooms/Inv:</span>
                                <span class="text-blue-700 text-[11px]">${totalReq}</span>
                            </div>
                            <div class="text-[9px] text-gray-400 text-right font-normal">${details}</div>
                        </div>
                    </div>`;
            }
            if (hasAN) {
                const regReq = Math.ceil(data.pm.regCount / 30);
                const othReq = Math.ceil(data.pm.othCount / 30);
                const scribeReq = Math.ceil(data.pm.scribeCount / 5);
                const totalReq = regReq + othReq + scribeReq;
                
                let details = `Reg: ${regReq}`;
                if(othReq > 0) details += ` | Oth: ${othReq}`;
                if(scribeReq > 0) details += ` | Scr: ${scribeReq}`;

                tooltipHtml += `
                    <div>
                        <div class="flex justify-between items-center">
                            <strong class='text-red-600 uppercase text-[10px]'>Afternoon (AN)</strong>
                            <span class='text-gray-900 font-bold text-[10px]'>${data.pm.students} Students</span>
                        </div>
                        <div class="mt-1 bg-gray-50 p-1 rounded border border-gray-100">
                            <div class="flex justify-between text-[10px] font-bold text-gray-700">
                                <span>Est. Rooms/Inv:</span>
                                <span class="text-blue-700 text-[11px]">${totalReq}</span>
                            </div>
                            <div class="text-[9px] text-gray-400 text-right font-normal">${details}</div>
                        </div>
                    </div>`;
            }
        } else if (isToday) {
            // Update the "Empty Today" circle class
            circleClass = "w-10 h-10 text-sm md:w-20 md:h-20 md:text-3xl rounded-full flex flex-col items-center justify-center relative font-bold bg-blue-600 text-white shadow-md overflow-hidden";
            dateNumberHtml = `<span class="z-10">${day}</span>`;
        }

        const posClass = isTopRow ? "top-full mt-2" : "bottom-full mb-2";
        const arrowClass = isTopRow ? "bottom-full border-b-white" : "top-full border-t-white";

        const tooltip = tooltipHtml ? `
            <div class="absolute ${posClass} left-1/2 transform -translate-x-1/2 w-56 bg-white text-gray-800 text-xs rounded-lg p-3 shadow-xl z-50 hidden group-hover:block pointer-events-none border border-red-200 ring-1 ring-red-100">
                ${tooltipHtml}
                <div class="absolute ${arrowClass} left-1/2 transform -translate-x-1/2 border-4 border-transparent"></div>
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

    // 3. Get Scribe Allotment (NEW ADDITION)
    const allScribeAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
    const scribeMap = allScribeAllotments[sessionKey] || {};

    // 4. Count unique allotted students (Regular + Scribes)
    const allottedRegNos = new Set();
    
    // Add Regular Allotments
    manualAllotment.forEach(room => {
        room.students.forEach(regNo => {
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
        alert(`Error: Not all students are allotted.\n\nTotal Students: ${totalUniqueStudents}\nAllotted (Regular + Scribe): ${allottedStudentCount}\nRemaining to Allot: ${remaining}\n\nPlease complete the allotment.`);
        return false;
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
                            <div style="border-top: 1px solid #000; padding-top: 4px;">Name & Signature of Invigilator</div>
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
            if (a === "Regular") return -1;
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
                const prevCourse = (index === 0) ? "" : studentChunk[index-1].Course;
                const isCourseHeader = (student.Course !== prevCourse);

                let roomName = student['Room No'];
                let seatNo = student.seatNumber;
                let rowStyle = '';

                if (student.isScribe) {
                    const sessionKeyPipe = `${student.Date} | ${student.Time}`;
                    const scribeRoom = allScribeAllotments[sessionKeyPipe]?.[student['Register Number']];
                    if(scribeRoom) roomName = scribeRoom;
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
        if(!scribesByRoom[newRoom]) scribesByRoom[newRoom] = [];
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



// 4. Helper: Scribe Rows
function prepareScribeSummaryRows_Notice(scribes, session, allotments) {
    const scribesByRoom = {};
    scribes.forEach(s => {
        const sessionKeyPipe = `${session.Date} | ${session.Time}`;
        const newRoom = allotments[sessionKeyPipe]?.[s['Register Number']] || "Unallotted";
        if(!scribesByRoom[newRoom]) scribesByRoom[newRoom] = [];
        scribesByRoom[newRoom].push(s);
    });
    const rows = [];
    Object.keys(scribesByRoom).sort().forEach(roomName => {
        const students = scribesByRoom[roomName];
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








// 2. Attach Listeners to New Buttons
const btn1Col = document.getElementById('generate-daywise-1col-btn');
const btn2Col = document.getElementById('generate-daywise-2col-btn');

if(btn1Col) btn1Col.addEventListener('click', () => generateNoticeBoardReport(1));
if(btn2Col) btn2Col.addEventListener('click', () => generateNoticeBoardReport(2));


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

// --- Helper: Scribe Rows ---
function prepareScribeSummaryRows(scribes, session, allotments) {
    const scribesByRoom = {};
    scribes.forEach(s => {
        const sessionKeyPipe = `${session.Date} | ${session.Time}`;
        const newRoom = allotments[sessionKeyPipe]?.[s['Register Number']] || "Unallotted";
        if(!scribesByRoom[newRoom]) scribesByRoom[newRoom] = [];
        scribesByRoom[newRoom].push(s);
    });
    const rows = [];
    Object.keys(scribesByRoom).sort().forEach(roomName => {
        const students = scribesByRoom[roomName];
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

// --- Helper: Render 2-Column Page (Header Centered + Page #) ---
function render2ColPage(col1, col2, streamName, session, numCols) {
    const renderTable = (items) => {
        if (!items || items.length === 0) return "";
        let html = "";
        let lastLocation = ""; 

        items.forEach((row, idx) => {
            if (row.type === 'header') {
                html += `
                    <tr class="bg-gray-200 print:bg-gray-200">
                        <td colspan="4" style="font-weight: bold; font-size: 0.85em; padding: 3px 4px; border: 1px solid #000; text-align: left; border-top: 2px solid #000;">
                            ${row.text}
                        </td>
                    </tr>`;
                lastLocation = ""; 
            } else if (row.type === 'student') {
                const sClass = row.isScribe ? 'font-bold text-orange-700' : '';
                let locContent = "";
                let rowBorder = "border-top: 1px solid #ddd;"; 
                
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
                html += `<tr><td colspan="4" style="height:8px; border:0;"></td></tr>`;
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
                <tbody>${renderTable(col1)}</tbody>
            </table>`;
    } else {
        bodyContent = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; align-items: start;">
                <div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        ${tableHeader}
                        <tbody>${renderTable(col1)}</tbody>
                    </table>
                </div>
                <div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        ${tableHeader}
                        <tbody>${renderTable(col2)}</tbody>
                    </table>
                </div>
            </div>`;
    }

    return `
        <div class="print-page print-page-daywise" style="height: 100%; position: relative;">
            
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
            
            <div style="width: 100%;">
                ${bodyContent}
            </div>
            
            <div style="position: absolute; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8pt; color: #666; border-top: 1px solid #eee; padding-top: 2px;">
                Page {{PAGE_NO}} - Generated by ExamFlow System
            </div>
        </div>
    `;
}


// --- Helper: Render 2-Column Page (Centered Header + Page No) ---
function render2ColPage(col1, col2, streamName, session, numCols) {
    const renderTable = (items) => {
        if (!items || items.length === 0) return "";
        let html = "";
        let lastLocation = ""; 

        items.forEach((row, idx) => {
            if (row.type === 'header') {
                html += `
                    <tr class="bg-gray-200 print:bg-gray-200">
                        <td colspan="4" style="font-weight: bold; font-size: 0.85em; padding: 3px 4px; border: 1px solid #000; text-align: left; border-top: 2px solid #000;">
                            ${row.text}
                        </td>
                    </tr>`;
                lastLocation = ""; 
            } else if (row.type === 'student') {
                const sClass = row.isScribe ? 'font-bold text-orange-700' : '';
                let locContent = "";
                let rowBorder = "border-top: 1px solid #ddd;"; 
                
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
                <tbody>${renderTable(col1)}</tbody>
            </table>`;
    } else {
        // GRID LAYOUT for precise 2-column
        bodyContent = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; align-items: start;">
                <div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        ${tableHeader}
                        <tbody>${renderTable(col1)}</tbody>
                    </table>
                </div>
                <div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        ${tableHeader}
                        <tbody>${renderTable(col2)}</tbody>
                    </table>
                </div>
            </div>`;
    }

    return `
        <div class="print-page print-page-daywise" style="height: 100%; display: flex; flex-direction: column;">
            
            <div class="print-header-group" style="width: 100%; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; position: relative;">
                
                <div style="position: absolute; top: 0; left: 0; border: 2px solid #000; padding: 2px 8px; background: #fff;">
                    <span style="font-size: 10pt; font-weight: bold;">Page</span><br>
                    <span style="font-size: 14pt; font-weight: bold;">{{PAGE_NO}}</span>
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
            
            <div style="position: absolute; bottom: 5px; left: 0; right: 0; text-align: center; font-size: 8pt; color: #666; border-top: 1px solid #eee; padding-top: 2px;">
                Generated by ExamFlow System
            </div>
        </div>
    `;
}

// --- Helper: Render 2-Column Page (Centered Header + Prominent Page No) ---
function render2ColPage(col1, col2, streamName, session, numCols) {
    
    const renderTable = (items) => {
        if (!items || items.length === 0) return "";

        let html = "";
        let lastLocation = ""; 

        items.forEach((row, idx) => {
            if (row.type === 'header') {
                html += `
                    <tr class="bg-gray-200 print:bg-gray-200">
                        <td colspan="4" style="font-weight: bold; font-size: 0.85em; padding: 3px 4px; border: 1px solid #000; text-align: left; border-top: 2px solid #000;">
                            ${row.text}
                        </td>
                    </tr>`;
                lastLocation = ""; 
            } else if (row.type === 'student') {
                const sClass = row.isScribe ? 'font-bold text-orange-700' : '';
                
                let locContent = "";
                let rowBorder = "border-top: 1px solid #ddd;"; 
                
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
                <tbody>${renderTable(col1)}</tbody>
            </table>`;
    } else {
        bodyContent = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; align-items: start;">
                <div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        ${tableHeader}
                        <tbody>${renderTable(col1)}</tbody>
                    </table>
                </div>
                <div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        ${tableHeader}
                        <tbody>${renderTable(col2)}</tbody>
                    </table>
                </div>
            </div>`;
    }

    // Calculate Page Number (We need to pass this or calculate it outside, 
    // but since this function returns a string, we'll use a placeholder or remove it if passed from main loop)
    // NOTE: To make it robust, we rely on the main loop to count pages, 
    // but here we can add a placeholder div that the main loop could replace, 
    // OR simply rely on the fact that this function builds the INNER content.
    
    return `
        <div class="print-page print-page-daywise" style="height: 100%; display: flex; flex-direction: column;">
            
            <div class="print-header-group" style="margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; position: relative;">
                
                <div style="position: absolute; top: 0; left: 0; font-weight: bold; font-size: 16pt; border: 2px solid #000; padding: 2px 8px; background: #fff;">
                    Page <span class="page-number-placeholder"></span>
                </div>

                <div style="position: absolute; top: 0; right: 0; font-weight: bold; font-size: 11pt; border: 1px solid #000; padding: 2px 6px; background: #eee;">
                    ${streamName}
                </div>

                <div style="text-align: center; margin-top: 5px;"> <h1 style="font-size: 16pt; font-weight: bold; margin: 0; text-transform: uppercase;">${currentCollegeName}</h1>
                    <h2 style="font-size: 12pt; margin: 5px 0 0 0; font-weight: bold;">Seating Details for Candidates</h2>
                    <h3 style="font-size: 11pt; margin: 2px 0 0 0;">${session.Date} &nbsp;|&nbsp; ${session.Time}</h3>
                </div>
            </div>
            
            <div style="flex-grow: 1;">
                ${bodyContent}
            </div>
            
            <div style="margin-top: auto; padding-top: 2px; font-size: 7pt; text-align: center; color: #888;">
                Generated by ExamFlow System
            </div>
        </div>
    `;
}

// --- Helper: Scribe Rows ---
function prepareScribeSummaryRows(scribes, session, allotments) {
    const scribesByRoom = {};
    scribes.forEach(s => {
        const sessionKeyPipe = `${session.Date} | ${session.Time}`;
        const newRoom = allotments[sessionKeyPipe]?.[s['Register Number']] || "Unallotted";
        if(!scribesByRoom[newRoom]) scribesByRoom[newRoom] = [];
        scribesByRoom[newRoom].push(s);
    });
    const rows = [];
    Object.keys(scribesByRoom).sort().forEach(roomName => {
        const students = scribesByRoom[roomName];
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

// --- Helper: Render 2-Column Page (Grid Layout + No Rowspan) ---
function render2ColPage(col1, col2, streamName, session, numCols) {
    
    const renderTable = (items) => {
        if (!items || items.length === 0) return "";

        let html = "";
        let lastLocation = ""; // Track location change manually

        items.forEach((row, idx) => {
            if (row.type === 'header') {
                html += `
                    <tr class="bg-gray-200 print:bg-gray-200">
                        <td colspan="4" style="font-weight: bold; font-size: 0.85em; padding: 3px 4px; border: 1px solid #000; text-align: left; border-top: 2px solid #000;">
                            ${row.text}
                        </td>
                    </tr>`;
                lastLocation = ""; // Reset on header
            } else if (row.type === 'student') {
                const sClass = row.isScribe ? 'font-bold text-orange-700' : '';
                
                // Location Logic: Show only if changed
                let locContent = "";
                let rowBorder = "border-top: 1px solid #ddd;"; // Light border for same room
                
                if (row.locationRaw !== lastLocation) {
                    locContent = row.locationDisplay;
                    rowBorder = "border-top: 2px solid #000;"; // Heavy border for new room
                    lastLocation = row.locationRaw;
                } else {
                    locContent = ""; // Empty cell for repeated room
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
                <th style="border: 1px solid #000; padding: 2px; font-size:0.85em;">Seat</th>
            </tr>
        </thead>`;

    // GRID LAYOUT (The real fix for PDF alignment)
    let bodyContent = "";
    if (numCols === 1) {
        bodyContent = `
            <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                ${tableHeader}
                <tbody>${renderTable(col1)}</tbody>
            </table>`;
    } else {
        // Use GRID instead of Flex to ensure equal column widths and alignment in PDF
        bodyContent = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; align-items: start;">
                <div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        ${tableHeader}
                        <tbody>${renderTable(col1)}</tbody>
                    </table>
                </div>
                <div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        ${tableHeader}
                        <tbody>${renderTable(col2)}</tbody>
                    </table>
                </div>
            </div>`;
    }

    return `
        <div class="print-page print-page-daywise" style="height: 100%; display: flex; flex-direction: column;">
            <div class="print-header-group" style="margin-bottom: 4px; border-bottom: 1px solid #000; padding-bottom: 2px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <h1 style="font-size: 12pt; font-weight: bold; margin: 0;">${currentCollegeName}</h1>
                        <h2 style="font-size: 10pt; margin: 0;">Seating Details: ${session.Date} (${session.Time})</h2>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 10pt; border: 1px solid #000; padding: 1px 4px; display: inline-block;">
                            ${streamName}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="flex-grow: 1;">
                ${bodyContent}
            </div>
            
            <div style="margin-top: auto; padding-top: 2px; font-size: 7pt; text-align: center; color: #888;">
                ExamFlow System
            </div>
        </div>
    `;
}

// --- Helper: Scribe Rows ---
function prepareScribeSummaryRows(scribes, session, allotments) {
    const scribesByRoom = {};
    scribes.forEach(s => {
        const sessionKeyPipe = `${session.Date} | ${session.Time}`;
        const newRoom = allotments[sessionKeyPipe]?.[s['Register Number']] || "Unallotted";
        if(!scribesByRoom[newRoom]) scribesByRoom[newRoom] = [];
        scribesByRoom[newRoom].push(s);
    });
    const rows = [];
    Object.keys(scribesByRoom).sort().forEach(roomName => {
        const students = scribesByRoom[roomName];
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

// --- Helper: Render 2-Column Page (Grid Layout + No Rowspan) ---
function render2ColPage(col1, col2, streamName, session, numCols) {
    
    const renderTable = (items) => {
        if (!items || items.length === 0) return "";

        let html = "";
        let lastLocation = ""; // Track location change manually

        items.forEach((row, idx) => {
            if (row.type === 'header') {
                html += `
                    <tr class="bg-gray-200 print:bg-gray-200">
                        <td colspan="4" style="font-weight: bold; font-size: 0.85em; padding: 3px 4px; border: 1px solid #000; text-align: left; border-top: 2px solid #000;">
                            ${row.text}
                        </td>
                    </tr>`;
                lastLocation = ""; // Reset on header
            } else if (row.type === 'student') {
                const sClass = row.isScribe ? 'font-bold text-orange-700' : '';
                
                // Location Logic: Show only if changed
                let locContent = "";
                let rowBorder = "border-top: 1px solid #ddd;"; // Light border for same room
                
                if (row.locationRaw !== lastLocation) {
                    locContent = row.locationDisplay;
                    rowBorder = "border-top: 2px solid #000;"; // Heavy border for new room
                    lastLocation = row.locationRaw;
                } else {
                    locContent = ""; // Empty cell for repeated room
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
                <th style="border: 1px solid #000; padding: 2px; font-size:0.85em;">Seat</th>
            </tr>
        </thead>`;

    // GRID LAYOUT (The real fix for PDF alignment)
    let bodyContent = "";
    if (numCols === 1) {
        bodyContent = `
            <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
                ${tableHeader}
                <tbody>${renderTable(col1)}</tbody>
            </table>`;
    } else {
        // Use GRID instead of Flex to ensure equal column widths and alignment in PDF
        bodyContent = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; align-items: start;">
                <div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        ${tableHeader}
                        <tbody>${renderTable(col1)}</tbody>
                    </table>
                </div>
                <div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
                        ${tableHeader}
                        <tbody>${renderTable(col2)}</tbody>
                    </table>
                </div>
            </div>`;
    }

    return `
        <div class="print-page print-page-daywise" style="height: 100%; display: flex; flex-direction: column;">
            <div class="print-header-group" style="margin-bottom: 4px; border-bottom: 1px solid #000; padding-bottom: 2px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <h1 style="font-size: 12pt; font-weight: bold; margin: 0;">${currentCollegeName}</h1>
                        <h2 style="font-size: 10pt; margin: 0;">Seating Details: ${session.Date} (${session.Time})</h2>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 10pt; border: 1px solid #000; padding: 1px 4px; display: inline-block;">
                            ${streamName}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="flex-grow: 1;">
                ${bodyContent}
            </div>
            
            <div style="margin-top: auto; padding-top: 2px; font-size: 7pt; text-align: center; color: #888;">
                ExamFlow System
            </div>
        </div>
    `;
}

// --- Helper: Scribe Rows ---
function prepareScribeSummaryRows(scribes, session, allotments) {
    const scribesByRoom = {};
    scribes.forEach(s => {
        const sessionKeyPipe = `${session.Date} | ${session.Time}`;
        const newRoom = allotments[sessionKeyPipe]?.[s['Register Number']] || "Unallotted";
        if(!scribesByRoom[newRoom]) scribesByRoom[newRoom] = [];
        scribesByRoom[newRoom].push(s);
    });

    const rows = [];
    Object.keys(scribesByRoom).sort().forEach(roomName => {
        const students = scribesByRoom[roomName];
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

// --- Helper: Render 2-Column Page ---
function render2ColPage(col1, col2, streamName, session) {
    const renderTable = (items) => {
        if (!items || items.length === 0) return "";

        // Rowspan Logic
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
                        <td colspan="4" style="font-weight: bold; font-size: 0.85em; padding: 2px 4px; border: 1px solid #000; text-align: left; border-top: 2px solid #000;">
                            ${row.text}
                        </td>
                    </tr>`;
            } else if (row.type === 'student') {
                const sClass = row.isScribe ? 'font-bold text-orange-700' : '';
                let locCell = '';
                if (locSpans[idx] > 0) {
                    const rs = locSpans[idx] > 1 ? `rowspan="${locSpans[idx]}"` : '';
                    locCell = `<td ${rs} style="border: 1px solid #000; padding: 2px; width: 25%; vertical-align: middle; text-align: center; background-color: #fff; font-size:0.8em; line-height:1.1;">${row.locationDisplay}</td>`;
                }
                html += `
                    <tr class="${sClass}">
                        ${locCell}
                        <td style="border: 1px solid #000; padding: 2px; width: 20%; text-align:left; font-size: 0.85em;">${row.reg}</td>
                        <td style="border: 1px solid #000; padding: 2px 4px; width: 45%; font-size: 0.8em; overflow: hidden; text-overflow: ellipsis;">${row.name}</td>
                        <td style="border: 1px solid #000; padding: 2px; width: 10%; text-align: center; font-weight: bold; font-size: 0.85em;">${row.seat}</td>
                    </tr>`;
            } else if (row.type === 'divider') {
                html += `<tr><td colspan="4" style="border-bottom: 2px double #000; font-weight: bold; text-align: center; padding: 5px 0 2px; font-size:0.9em;">${row.text}</td></tr>`;
            } else if (row.type === 'scribe-room') {
                html += `<tr><td colspan="4" style="border: 1px solid #000; padding: 4px; font-size: 0.8em;"><strong>${row.roomDisplay}:</strong> ${row.content}</td></tr>`;
            } else if (row.type === 'spacer') {
                html += `<tr><td colspan="4" style="height:6px; border:0;"></td></tr>`;
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

    return `
        <div class="print-page print-page-daywise" style="height: 100%; display: flex; flex-direction: column;">
            <div class="print-header-group" style="margin-bottom: 4px; border-bottom: 1px solid #000; padding-bottom: 2px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <h1 style="font-size: 12pt; font-weight: bold; margin: 0;">${currentCollegeName}</h1>
                        <h2 style="font-size: 10pt; margin: 0;">Seating: ${session.Date} (${session.Time})</h2>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 10pt; border: 1px solid #000; padding: 1px 4px; display: inline-block;">
                            ${streamName}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="flex-grow: 1; display: flex; gap: 10px;">
                <div style="flex: 1;">
                    <table style="width: 100%; border-collapse: collapse;">
                        ${tableHeader}
                        <tbody>${renderTable(col1)}</tbody>
                    </table>
                </div>
                <div style="flex: 1;">
                    ${col2.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse;">
                        ${tableHeader}
                        <tbody>${renderTable(col2)}</tbody>
                    </table>` : ''}
                </div>
            </div>
            
            <div style="margin-top: auto; padding-top: 2px; font-size: 7pt; text-align: center; color: #888;">
                ExamFlow System
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
        if(!scribesByRoom[newRoom]) scribesByRoom[newRoom] = [];
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

    } catch(e) {
        console.error(e);
        alert("Error: " + e.message);
    } finally {
        generateQPaperReportButton.disabled = false;
        generateQPaperReportButton.textContent = "Generate Question Paper Report";
    }
});

// --- Event listener for "Generate QP Distribution Report" (Final Ergonomic Tweaks) ---
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

                // Split into Regular and Other
                const regularPapers = paperArray.filter(p => p.stream === "Regular");
                const otherPapers = paperArray.filter(p => p.stream !== "Regular");

                // Sort Helper
                const sortPapers = (arr) => arr.sort((a, b) => a.courseName.localeCompare(b.courseName));
                sortPapers(regularPapers);
                sortPapers(otherPapers);

                // --- SECTION RENDERER ---
                const renderSection = (papers, title, bgClass, borderClass) => {
                    let html = '';
                    if (papers.length > 0) {
                        html += `<div class="font-bold text-sm uppercase border-b-2 border-black mt-4 mb-2 pb-1">${title}</div>`;
                        
                        for (const paper of papers) {
                            const qpBadge = paper.qpCode !== 'N/A' 
                                ? `<span class="bg-white text-black px-1.5 rounded text-xs font-bold border border-black shadow-sm">${paper.qpCode}</span>` 
                                : `<span class="text-gray-400 text-[10px] italic">(QP Missing)</span>`;
                            
                            html += `
                                <div style="margin-top: 8px; padding: 4px; page-break-inside: avoid; border-radius: 4px; ${borderClass}; background: ${bgClass};">
                                    <div class="flex justify-between items-start border-b border-dotted border-gray-400 pb-1 mb-1.5">
                                        <div class="w-[90%]">
                                            <div class="font-bold text-xs leading-tight text-gray-900 mb-0.5">${paper.courseName}</div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-[10px] font-semibold text-gray-600">QP: ${qpBadge}</span>
                                                ${title === 'Other Streams' ? `<span class="text-[9px] font-bold text-purple-700">(${paper.stream})</span>` : ''}
                                            </div>
                                        </div>
                                        <div class="w-[10%] text-right">
                                            <span class="text-xs font-black border border-black px-1.5 py-0.5 bg-white block text-center">${paper.total}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="grid grid-cols-4 gap-2">
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
                                
                                // Truncate Location (Keep it concise)
                                if (loc.length > 15) loc = loc.substring(0, 13) + "..";
                                const displayLoc = loc ? `(${loc})` : "";
                                const serialNo = roomSerialMap[roomName] || '-';
                                
                                // --- NEW BOX LAYOUT ---
                                html += `
                                    <div class="border border-gray-400 rounded p-1 bg-white h-[42px] flex flex-col justify-center relative shadow-sm px-2">
                                        
                                        <div class="flex items-baseline justify-between mb-0.5 leading-none">
                                            <div class="flex items-baseline gap-1.5 whitespace-nowrap">
                                                <span>
                                                    <span class="text-lg font-black text-black">${count}</span>
                                                    <span class="text-[10px] font-bold text-gray-600">Nos</span>
                                                </span>
                                                
                                                <span class="text-lg font-black text-black">Room #${serialNo}</span>
                                            </div>
                                            
                                            <span class="w-4 h-4 border-2 border-black bg-white rounded-sm shrink-0 ml-1"></span>
                                        </div>
                                        
                                        <div class="text-[10px] leading-none font-bold text-gray-800 truncate">
                                            ${displayLoc}
                                        </div>
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

                // Render Regular Section
                allPagesHtml += renderSection(regularPapers, "Regular Stream", "#fff", "border: 1px solid #000");
                
                // Render Other Streams Section (Dashed, Yellow)
                allPagesHtml += renderSection(otherPapers, "Other Streams", "#fffbeb", "border: 2px dashed #000");

                allPagesHtml += `</div>`; 
            }
            
            reportOutputArea.innerHTML = allPagesHtml;
            reportOutputArea.style.display = 'block'; 
            reportStatus.textContent = `Generated QP Distribution Report.`;
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
    if(viewToShow && viewToShow.id && buttonToActivate && buttonToActivate.id) {
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
                 locationInput.addEventListener('input', function() {
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
        if (typeof syncDataToCloud === 'function') syncDataToCloud();
        
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
        
        if (typeof syncDataToCloud === 'function') syncDataToCloud();
    });
}

 // --- (V79) Load data into dynamic form (in Settings) ---
function loadRoomConfig() {
    // V48: Load College Name
    currentCollegeName = localStorage.getItem(COLLEGE_NAME_KEY) || "University of Calicut";
    if (collegeNameInput) {
        collegeNameInput.value = currentCollegeName;
        collegeNameInput.disabled = true; // Ensure locked on load
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
        
        // *** FIX: Handle missing location in legacy data (convert undefined to "") ***
        // This ensures the validation logic sees it as empty and forces an update.
        const safeLocation = roomData.location || "";

        const rowHtml = createRoomRowHtml(roomName, roomData.capacity, safeLocation, isLast, true);
        roomConfigContainer.insertAdjacentHTML('beforeend', rowHtml);
    });
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

// --- (V79) Remove Room Button (Event Delegation for all rows, in Settings) ---
// --- Remove OR Edit Room Button (Event Delegation) ---
roomConfigContainer.addEventListener('click', (e) => {
    // HANDLE REMOVE
    if (e.target.classList.contains('remove-room-button')) {
        e.target.closest('.room-row').remove();
        saveRoomConfigButton.click(); // Auto-save and re-render
    }
    
    // HANDLE EDIT (Unlock Row)
    const editBtn = e.target.closest('.edit-room-btn');
    if (editBtn) {
        const row = editBtn.closest('.room-row');
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            input.disabled = false;
            input.classList.remove('bg-gray-50', 'text-gray-500');
            input.classList.add('bg-white', 'text-black');
        });
        inputs[0].focus(); // Focus on capacity
    }
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
    syncDataToCloud();
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
        currentAbsenteeListDiv.innerHTML = `<em class="text-gray-500">No absentees marked for this session.</em>`;
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
            name: s.Name // Capture name for deletion confirmation
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

        // 2. Determine Button State based on Lock
        const btnDisabled = isAbsenteeListLocked ? 'disabled' : '';
        const btnClass = isAbsenteeListLocked 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-red-600 hover:text-red-800 cursor-pointer';

        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-2 bg-white border border-gray-200 rounded';
        
        item.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="font-medium">${regNo}</span>
                <span class="text-xs text-gray-600 hidden sm:inline">(${roomData.name})</span>
                <span class="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-1.5 rounded border border-purple-100">${strm}</span>
            </div>
            <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500">${roomDisplay}</span>
                <button class="text-xs font-medium ${btnClass}" ${btnDisabled}>&times; Remove</button>
            </div>
        `;
        
        // 3. Attach Delete Event with Name
        if (!isAbsenteeListLocked) {
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
        syncDataToCloud();
    }
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

// V92: Renders the QP Code list (Grouped by Stream)
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
            // Add a spacer if it's not the first group
            const marginTop = currentStream ? "mt-6" : "mt-0";
            
            htmlChunks.push(`
                <div class="${marginTop} mb-2 bg-indigo-50 p-2 font-bold text-indigo-800 border-b border-indigo-200 rounded-t-md">
                    ${item.stream} Stream
                </div>
            `);
            currentStream = item.stream;
        }

        // Generate Key using Helper (ensure getQpKey exists in your code)
        const base64Key = getQpKey(item.course, item.stream);
        const savedCode = sessionCodes[base64Key] || "";

       htmlChunks.push(`
        <div class="flex items-center gap-3 p-2 border-b border-gray-200 hover:bg-gray-50">
            <label class="font-medium text-gray-700 w-2/3 text-sm">
                ${item.course}
            </label>
            <input type="text" 
                   class="qp-code-input block w-1/3 p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500" 
                   value="${savedCode}" 
                   data-course-key="${base64Key}"
                   placeholder="QP Code">
        </div>
       `);
    });
    
    qpCodeContainer.innerHTML = htmlChunks.join('');
    saveQpCodesButton.disabled = false;
    qpCodeStatus.textContent = '';
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
    syncDataToCloud(); // <--- ADD THIS
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
                link.setAttribute("download", `Master_Exam_Data_${new Date().toISOString().slice(0,10)}.csv`);
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
window.real_populate_room_allotment_session_dropdown = function() {
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

// Update the display with current allotment status
// Update the display with current allotment status (Stream-wise)
function updateAllotmentDisplay() {
    const [date, time] = currentSessionKey.split(' | ');
    const sessionStudentRecords = allStudentData.filter(s => s.Date === date && s.Time === time);
    const scribeRegNos = new Set((JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]')).map(s => s.regNo));
    
    const container = document.getElementById('allotment-student-count-section');
    container.innerHTML = ''; // Clear previous
    container.className = "mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"; // Grid layout
    container.classList.remove('hidden');

    // 1. Calculate Stats Per Stream
    const streamStats = {};
    
    // Initialize with configured streams so they appear even if empty
    currentStreamConfig.forEach(stream => {
        streamStats[stream] = { total: 0, allotted: 0 };
    });
    // Ensure "Regular" exists as fallback
    if (!streamStats["Regular"]) streamStats["Regular"] = { total: 0, allotted: 0 };

// Count Totals (Including Scribes)
sessionStudentRecords.forEach(s => {
    // Removed scribe exclusion check here
    const strm = s.Stream || "Regular";
    if (!streamStats[strm]) streamStats[strm] = { total: 0, allotted: 0 };
    streamStats[strm].total++;
});

    // Count Allotted
    currentSessionAllotment.forEach(room => {
        const roomStream = room.stream || "Regular";
        if (!streamStats[roomStream]) streamStats[roomStream] = { total: 0, allotted: 0 };
        streamStats[roomStream].allotted += room.students.length;
    });

    // 2. Generate Cards
    Object.keys(streamStats).forEach(streamName => {
        const stats = streamStats[streamName];
        const remaining = stats.total - stats.allotted;
        
        // Visual Cues
        const isComplete = (remaining <= 0 && stats.total > 0);
        const borderColor = isComplete ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50";
        const titleColor = isComplete ? "text-green-800" : "text-blue-800";

        const cardHtml = `
            <div class="${borderColor} border p-4 rounded-lg shadow-sm">
                <h3 class="text-lg font-bold ${titleColor} mb-3 border-b border-gray-200 pb-1 flex justify-between">
                    ${streamName} Stream
                    ${isComplete ? '<span class="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Completed</span>' : ''}
                </h3>
                <div class="flex justify-between items-center text-sm">
                    <div class="text-center">
                        <p class="text-gray-500 font-medium">Total</p>
                        <p class="text-xl font-bold text-gray-800">${stats.total}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-gray-500 font-medium">Allotted</p>
                        <p class="text-xl font-bold text-blue-600">${stats.allotted}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-gray-500 font-medium">Remaining</p>
                        <p class="text-xl font-bold ${remaining > 0 ? 'text-orange-600' : 'text-gray-400'}">${remaining}</p>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });

    // Show/Hide Add Button based on global remaining
    const totalRemaining = Object.values(streamStats).reduce((sum, s) => sum + (s.total - s.allotted), 0);
    const addSection = document.getElementById('add-room-section');
    if (totalRemaining > 0) {
        addSection.classList.remove('hidden');
    } else {
        // Optional: Hide button if totally finished, or keep it to allow edits
        addSection.classList.remove('hidden'); 
    }

    // Render Rooms
    renderAllottedRooms();
    
    // Show Save Section
    const saveSection = document.getElementById('save-allotment-section');
    const allottedSection = document.getElementById('allotted-rooms-section');
    if (currentSessionAllotment.length > 0) {
        allottedSection.classList.remove('hidden');
        saveSection.classList.remove('hidden');
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

// Delete a room from allotment
window.deleteRoom = function(index) {
    if (confirm('Are you sure you want to remove this room allotment?')) {
        currentSessionAllotment.splice(index, 1);
        updateAllotmentDisplay();
    }
};

// Show room selection modal (Updated: Excludes Scribe Rooms)
function showRoomSelectionModal() {
    getRoomCapacitiesFromStorage();
    roomSelectionList.innerHTML = '';

    // 1. Smart Default Stream Logic (Existing)
    const [date, time] = currentSessionKey.split(' | ');
    const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
    
    const stats = {};
    currentStreamConfig.forEach(s => stats[s] = { needed: 0, allotted: 0 });
    if(!stats["Regular"]) stats["Regular"] = { needed: 0, allotted: 0 };

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

// Select a room and allot students (Fixed: Adds Save Step)
function selectRoomForAllotment(roomName, capacity, targetStream) {
    const [date, time] = currentSessionKey.split(' | ');
    
    // 1. Get all students for this session
    const sessionStudentRecords = allStudentData.filter(s => s.Date === date && s.Time === time);
    
    // 2. Get already allotted RegNos (Global for session)
    const allottedRegNos = new Set();
    currentSessionAllotment.forEach(room => {
        room.students.forEach(regNo => allottedRegNos.add(regNo));
    });

    // 3. Find unallotted students MATCHING THE TARGET STREAM
    const candidates = [];
    // Sort first to ensure consistent filling (Stream -> Course -> RegNo)
    sessionStudentRecords.sort((a, b) => {
        if (a.Course !== b.Course) return a.Course.localeCompare(b.Course);
        return a['Register Number'].localeCompare(b['Register Number']);
    });

    for (const student of sessionStudentRecords) {
        const regNo = student['Register Number'];
        const studentStream = student.Stream || "Regular"; // Default

        // Condition: Not Allotted AND Matches Selected Stream (Scribes allowed)
        if (!allottedRegNos.has(regNo) && studentStream === targetStream) {
            candidates.push(regNo);
        }
    }
    
    // 4. Allot up to capacity
    const newStudentRegNos = candidates.slice(0, capacity);
    
    if (newStudentRegNos.length === 0) {
        alert(`No unallotted students found for stream: ${targetStream}`);
        return;
    }

    // 5. Add to allotment
    currentSessionAllotment.push({
        roomName: roomName,
        capacity: capacity,
        students: newStudentRegNos,
        stream: targetStream // Save the stream tag for this room
    });
    
    // --- FIX: SAVE TO LOCAL STORAGE IMMEDIATELY ---
    saveRoomAllotment(); 
    // ----------------------------------------------

    roomSelectionModal.classList.add('hidden');
    updateAllotmentDisplay();
    
    if (typeof syncDataToCloud === 'function') syncDataToCloud();
}


// Event Listeners for Room Allotment
allotmentSessionSelect.addEventListener('change', () => {
    const sessionKey = allotmentSessionSelect.value;
    populateAbsenteeQpFilter(sessionKey);
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
    syncDataToCloud(); // <--- ADD THIS
});

// --- END ROOM ALLOTMENT FUNCTIONALITY ---

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
window.real_loadGlobalScribeList = function() {
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
window.real_loadGlobalScribeList = function() {
    globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
    renderGlobalScribeList();
}

// 2. Render the global list (Updated with Lock Logic & Stream)
function renderGlobalScribeList() {
    if (!currentScribeListDiv) return; 
    currentScribeListDiv.innerHTML = "";
    
    if (globalScribeList.length === 0) {
        currentScribeListDiv.innerHTML = `<em class="text-gray-500">No students added to the scribe list.</em>`;
        return;
    }
    
    globalScribeList.forEach(student => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center p-2 bg-white border border-gray-200 rounded';
        
        const strm = student.stream || "Regular";
        
        // Determine button state based on Lock
        const btnDisabled = isScribeListLocked ? 'disabled' : '';
        const btnClass = isScribeListLocked 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-red-600 hover:text-red-800 cursor-pointer';

        item.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="font-medium">${student.regNo}</span>
                <span class="text-sm text-gray-600">${student.name}</span>
                <span class="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 rounded border border-gray-200">${strm}</span>
            </div>
            <button class="text-xs font-medium ${btnClass}" ${btnDisabled}>&times; Remove</button>
        `;
        
        // Only attach click event if unlocked
        if (!isScribeListLocked) {
            item.querySelector('button').onclick = () => removeScribeStudent(student.regNo, student.name);
        }
        
        currentScribeListDiv.appendChild(item);
    });
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
        
        if(typeof syncDataToCloud === 'function') syncDataToCloud();
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
    syncDataToCloud(); // <--- ADD THIS
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

    // --- NEW: Update Count Header with Badge ---
    const headerEl = document.getElementById('scribe-session-header');
    if (headerEl) {
        headerEl.innerHTML = `Scribe Students for this Session: <span class="ml-2 bg-orange-100 text-orange-800 text-sm font-bold px-2 py-0.5 rounded-full border border-orange-200">${uniqueSessionScribeStudents.length}</span>`;
    }
    // -------------------------------------------
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
    syncDataToCloud(); // <--- ADD THIS
}

scribeCloseRoomModal.addEventListener('click', () => {
    scribeRoomModal.classList.add('hidden');
    studentToAllotScribeRoom = null;
});

// **********************************

// --- Helper function to disable all report buttons ---
window.real_disable_all_report_buttons = function(disabled) {
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
    editDataContainer.innerHTML = '';
    editPaginationControls.classList.add('hidden');
    editSaveSection.classList.add('hidden');
    addNewStudentBtn.classList.add('hidden');
    
    // Hide Bulk Container
    const bulkContainer = document.getElementById('bulk-course-update-container');
    if(bulkContainer) bulkContainer.classList.add('hidden');

    if (currentEditSession) {
        const [date, time] = currentEditSession.split(' | ');
        const sessionStudents = allStudentData.filter(s => s.Date === date && s.Time === time);
        
        // Identify Unique Pairs: Course + Stream
        const uniquePairs = [];
        const seen = new Set();
        
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
    }
});

// 2. Course selection (Updated: Parses Composite Key)
editCourseSelect.addEventListener('change', () => {
    const selectedValue = editCourseSelect.value; // "CourseName|StreamName"
    editCurrentPage = 1;
    hasUnsavedEdits = false; 

    let countDisplay = document.getElementById('edit-student-count');
    if (!countDisplay && addNewStudentBtn) {
        countDisplay = document.createElement('div');
        countDisplay.id = 'edit-student-count';
        countDisplay.className = 'mb-2 font-bold text-blue-700 text-sm';
        addNewStudentBtn.parentNode.insertBefore(countDisplay, addNewStudentBtn);
    }

    if (selectedValue) {
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
        
        // Hide Bulk if open
        const bulk = document.getElementById('bulk-course-update-container');
        if(bulk) bulk.classList.add('hidden');
    }
});

// 3. Render Table (Updated with Stream Column)
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
                    <th>Sl No</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Stream</th> <th>Course</th>
                    <th>Register Number</th>
                    <th>Name</th>
                    <th class="actions-cell">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    pageStudents.forEach((student, index) => {
        const uniqueRowIndex = start + index; 
        const serialNo = uniqueRowIndex + 1;
        // Default to "Regular" if stream is missing
        const streamDisplay = student.Stream || "Regular";
        
        tableHtml += `
            <tr data-row-index="${uniqueRowIndex}">
                <td>${serialNo}</td>
                <td>${student.Date}</td>
                <td>${student.Time}</td>
                <td class="font-medium text-indigo-600">${streamDisplay}</td> <td>${student.Course}</td>
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
        if(!dStr) return "";
        const [y, m, d] = dStr.split('-');
        return `${d}.${m}.${y}`;
    };
    
    const processTime = (tStr) => {
        if(!tStr) return "";
        const [h, min] = tStr.split(':');
        let hours = parseInt(h);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        // FIX: Force 2 digits (09 instead of 9)
        const paddedHours = String(hours).padStart(2, '0');
        return `${paddedHours}:${min} ${ampm}`;
    };

    // 3. MERGE LOGIC (The Fix)
    let studentObj = {};

    if (currentlyEditingIndex !== null) {
        // --- EDIT MODE: OPTIONAL FIELDS ---
        const original = currentCourseStudents[currentlyEditingIndex];
        
        // If input is empty, keep original. Else, process new input.
        finalDate = rawDate ? processDate(rawDate) : original.Date;
        finalTime = rawTime ? processTime(rawTime) : original.Time;
        
        studentObj = {
            Date: finalDate,
            Time: finalTime,
            Course: newCourse || original.Course,
            'Register Number': newRegNo || original['Register Number'],
            Name: newName || original.Name,
            Stream: newStream || original.Stream || "Regular" // Dropdown usually has value, but safe fallback
        };

    } else {
        // --- ADD MODE: STRICT VALIDATION ---
        if (!newRegNo || !newName || !rawDate || !rawTime || !newCourse) {
            alert('For a new student, all fields are required.');
            return;
        }
        studentObj = {
            Date: processDate(rawDate),
            Time: processTime(rawTime),
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
        if(typeof syncDataToCloud === 'function') syncDataToCloud();
        
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

// 11. Helper function to manage "unsaved" status (Unchanged)
function setUnsavedChanges(status) {
    hasUnsavedEdits = status;
    if (status) {
        editDataStatus.textContent = 'You have unsaved changes. Click "Save All Changes" to commit.';
    } else {
        editDataStatus.textContent = 'All changes saved.'; // Give clear feedback
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
            if(bulkUpdateContainer) bulkUpdateContainer.classList.remove('hidden');
            
            // Use Global Variable for clean name display
            if(bulkTargetCourseName) bulkTargetCourseName.textContent = `${currentEditCourse} (${currentEditStream})`;
            
            // RESET STATE: Lock Inputs
            if(bulkInputsWrapper) {
                bulkInputsWrapper.classList.add('opacity-50', 'pointer-events-none');
            }
            
            // Lock all inputs
            [bulkNewCourseInput, bulkNewDateInput, bulkNewTimeInput, bulkNewStreamSelect, btnBulkApply].forEach(el => {
                if(el) {
                    el.disabled = true;
                    if(el.tagName !== 'BUTTON') el.classList.add('bg-gray-50');
                }
            });

            if(bulkEditModeBtn) {
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
                if(bulkNewDateInput) bulkNewDateInput.value = bulkDateToInput(currDate);
                if(bulkNewTimeInput) bulkNewTimeInput.value = bulkTimeToInput(currTime);
            }
            
            // Pre-fill Course Name (Use Global)
            if(bulkNewCourseInput) bulkNewCourseInput.value = currentEditCourse;
            
            // Populate Stream Dropdown
            if (bulkNewStreamSelect) {
                const streamOptions = currentStreamConfig.map(s => `<option value="${s}">${s}</option>`).join('');
                bulkNewStreamSelect.innerHTML = `<option value="">-- No Change --</option>` + streamOptions;
                bulkNewStreamSelect.value = ""; 
            }
        } else {
            if(bulkUpdateContainer) bulkUpdateContainer.classList.add('hidden');
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
            if(bulkInputsWrapper) {
                bulkInputsWrapper.classList.remove('opacity-50', 'pointer-events-none');
            }
            inputsToToggle.forEach(el => {
                if(el) {
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
            if(bulkInputsWrapper) {
                bulkInputsWrapper.classList.add('opacity-50', 'pointer-events-none');
            }
            inputsToToggle.forEach(el => {
                if(el) {
                    el.disabled = true;
                    // Add gray background (Locking)
                    el.classList.add('bg-gray-50'); 
                    if(el.id === 'delete-course-btn') el.classList.add('text-gray-400'); // Dim text
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
            const [h, min] = rawTime.split(':');
            let hours = parseInt(h);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            // FIX: Force 2 digits
            const paddedHours = String(hours).padStart(2, '0');
            newTime = `${paddedHours}:${min} ${ampm}`;
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
            alert(`Successfully updated ${updateCount} records.\nThe page will now reload.`);
            
            if (typeof syncDataToCloud === 'function') await syncDataToCloud();
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
window.real_disable_all_report_buttons = function(disabled) {
    if(originalDisableFunc) originalDisableFunc(disabled);
    const btn = document.getElementById('generate-sticker-button');
    if(btn) btn.disabled = disabled;
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
            if(searchModeSessionRadio.checked) {
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

// 3B. Show Global Details (Stream-Aware)
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
        
        // *** FIX: Use Stream-Aware Key ***
        const streamDisplay = exam.Stream || "Regular";
        const courseKey = getQpKey(exam.Course, streamDisplay);
        const qpCode = sessionQPCodes[courseKey] || "";
        const qpDisplay = qpCode ? `[QP: ${qpCode}]` : "";
        // *********************************

        const sessionStudents = allStudentData.filter(s => s.Date === exam.Date && s.Time === exam.Time);
        const allocatedSession = performOriginalAllocation(sessionStudents);
        const studentAlloc = allocatedSession.find(s => s['Register Number'] === regNo);

        let roomDisplay = "Not Allotted";
        let rowClass = "";

        if (studentAlloc && studentAlloc['Room No'] !== "Unallotted") {
            const roomName = studentAlloc['Room No'];
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
        if(rowClass) tr.className = rowClass;
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

// 3B. Show Global Details (Stream-Aware)
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
        
        // *** FIX: Use Stream-Aware Key ***
        const streamDisplay = exam.Stream || "Regular";
        const courseKey = getQpKey(exam.Course, streamDisplay);
        const qpCode = sessionQPCodes[courseKey] || "";
        const qpDisplay = qpCode ? `[QP: ${qpCode}]` : "";
        // *********************************

        const sessionStudents = allStudentData.filter(s => s.Date === exam.Date && s.Time === exam.Time);
        const allocatedSession = performOriginalAllocation(sessionStudents);
        const studentAlloc = allocatedSession.find(s => s['Register Number'] === regNo);

        let roomDisplay = "Not Allotted";
        let rowClass = "";

        if (studentAlloc && studentAlloc['Room No'] !== "Unallotted") {
            const roomName = studentAlloc['Room No'];
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
        if(rowClass) tr.className = rowClass;
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
            if(rowClass) tr.className = rowClass;
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
            if(!confirm("Are you absolutely sure?")) return;

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
            
            if (typeof syncDataToCloud === 'function') await syncDataToCloud();
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
    if (user.email === SUPER_ADMIN_EMAIL) {
        if(superAdminBtn) superAdminBtn.classList.remove('hidden');
    } else {
        if(superAdminBtn) superAdminBtn.classList.add('hidden');
    }
}

// 2. OPEN MODAL & LOAD LIST
if(superAdminBtn) {
    superAdminBtn.addEventListener('click', () => {
        superAdminModal.classList.remove('hidden');
        loadWhitelist();
        loadAllCollegesForAdmin(); // <--- ADD THIS LINE
    });
}

if(closeSuperModal) {
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
if(addWhitelistBtn) {
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
window.removeFromWhitelist = async function(email) {
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

if(setLimitBtn) {
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
                if(confirm("No existing database found for your account, but you are AUTHORIZED.\n\nClick OK to create a new College Database.")) {
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

                } catch(e) {
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
                'Time': values[timeIndex],
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
        if(btn) btn.disabled = false;
    });

    // 5. Sync
    if (typeof syncDataToCloud === 'function') syncDataToCloud();

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

window.handlePythonExtraction = function(jsonString) {
    console.log("Received data from Python...");
    
    const pdfStreamSelect = document.getElementById('pdf-stream-select');
    const selectedStream = pdfStreamSelect ? (pdfStreamSelect.value || "Regular") : "Regular";

    try {
        let parsedData = JSON.parse(jsonString);
        
        // INJECT STREAM TAG INTO PYTHON DATA
        parsedData = parsedData.map(item => ({
            ...item,
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

    } catch(e) {
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

    // Render Settings List
    function renderStreamSettings() {
        if (!streamContainer) return;
        streamContainer.innerHTML = '';
        currentStreamConfig.forEach((stream, index) => {
            const div = document.createElement('div');
            div.className = "flex justify-between items-center bg-white border p-2 rounded text-sm";
            div.innerHTML = `
                <span class="font-medium">${stream}</span>
                ${index > 0 ? `<button class="text-red-500 hover:text-red-700" onclick="deleteStream('${stream}')">&times;</button>` : '<span class="text-xs text-gray-400">(Default)</span>'}
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
    
    // Expose globally
    window.populateRemunerationDropdowns = populateStreamDropdowns;
    
    
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
                syncDataToCloud(); // Sync setting change
            } else if (currentStreamConfig.includes(name)) {
                alert("Stream already exists.");
            }
        });
    }

// Delete Stream (Safe Version)
    window.deleteStream = function(name) {
        if (currentStreamConfig.length <= 1) {
            alert("You must have at least one stream defined (e.g., Regular).");
            return;
        }

        if (confirm(`Delete stream "${name}"?`)) {
            currentStreamConfig = currentStreamConfig.filter(s => s !== name);
            localStorage.setItem(STREAM_CONFIG_KEY, JSON.stringify(currentStreamConfig));
            loadStreamConfig();
            syncDataToCloud();
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

// Also update real_disable_all_report_buttons to include the new button
const originalDisableFuncV2 = window.real_disable_all_report_buttons;
window.real_disable_all_report_buttons = function(disabled) {
    if(originalDisableFuncV2) originalDisableFuncV2(disabled);
    const btn = document.getElementById('generate-room-summary-button');
    if(btn) btn.disabled = disabled;
};

// ==========================================
// ☢️ NUKE & SETTINGS MANAGER
// ==========================================

const nukeBtn = document.getElementById('nuke-it-all-btn');
const backupSettingsBtn = document.getElementById('backup-settings-btn');
const restoreSettingsBtn = document.getElementById('restore-settings-btn');
const restoreSettingsInput = document.getElementById('restore-settings-input');

// 1. NUKE IT ALL (Smart Choice + Funny Alerts)
if (nukeBtn) {
    nukeBtn.addEventListener('click', async () => {
        // Level 1: Initial Warning
        if (!confirm("⚠ NUCLEAR LAUNCH DETECTED ⚠\n\nYou are initiating a destructive sequence that affects both Local and Cloud storage.\n\nAre you sure you want to proceed?")) {
            return;
        }

        // Level 2: Choice Selection
        const choice = prompt(
            "☢️ SELECT PAYLOAD YIELD ☢️\n\n" +
            "Type 'DATA' for Tactical Strike (Wipes Students, Keeps Settings)\n" +
            "Type 'FULL' for Total Annihilation (Factory Reset)\n\n" +
            "Enter payload type below:"
        );

        if (!choice) return;
        const mode = choice.trim().toUpperCase();

        if (mode !== 'DATA' && mode !== 'FULL') {
            alert("🚫 LAUNCH ABORTED 🚫\n\nInvalid payload type selected.\nSystem returning to safe mode.");
            return;
        }

        // Level 3: Final Confirmation Code
        const confirmCode = prompt(`⚠ FINAL SECURITY CHECK ⚠\n\nTo authorize this ${mode} reset, type 'DELETE' in the box below:`);
        
        if (confirmCode !== 'DELETE') {
            // *** THE FUNNY ABORT MESSAGE ***
            alert("🚫 ACCESS DENIED 🚫\n\nIncorrect launch code entered.\nThe nuclear payload has been disarmed.\n\n(Phew, that was close!)");
            return;
        }

        // --- EXECUTION ---
        nukeBtn.textContent = "🚀 MISSILES FIRED...";
        nukeBtn.disabled = true;

        try {
            const { db, doc, writeBatch, setDoc, collection, getDocs } = window.firebase;
            
            if (mode === 'DATA') {
                // -----------------------------------------
                // OPTION A: TACTICAL STRIKE (Data Only)
                // -----------------------------------------
                
                // 1. Clear Local Data Keys
                const keysToRemove = [
                    BASE_DATA_KEY, ROOM_ALLOTMENT_KEY, SCRIBE_ALLOTMENT_KEY,
                    ABSENTEE_LIST_KEY, QP_CODE_LIST_KEY, 'examBaseData'
                ];
                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                // 2. Force Wipe Cloud Data
                if (currentCollegeId) {
                    const batch = writeBatch(db);
                    const mainRef = doc(db, "colleges", currentCollegeId);
                    
                    batch.update(mainRef, {
                        examQPCodes: "{}",
                        examScribeAllotment: "{}",
                        examAbsenteeList: "{}",
                        lastUpdated: new Date().toISOString()
                    });

                    const dataColRef = collection(db, "colleges", currentCollegeId, "data");
                    const chunkSnaps = await getDocs(dataColRef);
                    chunkSnaps.forEach(chunk => batch.delete(chunk.ref));

                    await batch.commit();
                }
                
                alert("💥 TACTICAL STRIKE SUCCESSFUL 💥\n\nStudent data has been vaporized.\nInfrastructure (Settings) remains intact.");

            } else if (mode === 'FULL') {
                // -----------------------------------------
                // OPTION B: TOTAL ANNIHILATION (Full Reset)
                // -----------------------------------------
                
                localStorage.clear();
                
                if (currentCollegeId) {
                    const mainRef = doc(db, "colleges", currentCollegeId);
                    
                    // Overwrite with barebones data
                    await setDoc(mainRef, {
                        admins: [currentUser.email],
                        allowedUsers: [currentUser.email], 
                        lastUpdated: new Date().toISOString(),
                        examCollegeName: "University of Calicut" 
                    });

                    const batch = writeBatch(db);
                    const dataColRef = collection(db, "colleges", currentCollegeId, "data");
                    const chunkSnaps = await getDocs(dataColRef);
                    chunkSnaps.forEach(chunk => batch.delete(chunk.ref));
                    await batch.commit();
                }

                alert("💥 KABOOM! 💥\n\nTotal annihilation complete.\nThe system is now a blank slate.");
            }

            window.location.reload();

        } catch (e) {
            console.error("Nuke failed:", e);
            alert("⚠️ LAUNCH FAILURE ⚠️\n\nAn error occurred during the sequence: " + e.message);
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
        link.download = `ExamFlow_Settings_Backup_${new Date().toISOString().slice(0,10)}.json`;
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

                    // Sync
                    if (typeof syncDataToCloud === 'function') await syncDataToCloud();
                    
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
         if(restoreBtn) restoreBtn.click();
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
                    if(typeof disable_absentee_tab === 'function') disable_absentee_tab(false);
                    if(typeof disable_qpcode_tab === 'function') disable_qpcode_tab(false);
                    if(typeof disable_room_allotment_tab === 'function') disable_room_allotment_tab(false);
                    if(typeof disable_scribe_settings_tab === 'function') disable_scribe_settings_tab(false);
                    if(typeof disable_edit_data_tab === 'function') disable_edit_data_tab(false);
                    if(typeof disable_all_report_buttons === 'function') disable_all_report_buttons(false); 
                    
                    if(typeof populate_session_dropdown === 'function') populate_session_dropdown();
                    if(typeof populate_qp_code_session_dropdown === 'function') populate_qp_code_session_dropdown();
                    if(typeof populate_room_allotment_session_dropdown === 'function') populate_room_allotment_session_dropdown();
                    if(typeof loadGlobalScribeList === 'function') loadGlobalScribeList();
                    if(typeof updateDashboard === 'function') updateDashboard();
                    
                    // NOTE: renderExamNameSettings was removed from here because it's now in Step 1

                    console.log(`Successfully loaded ${savedData.length} records.`);
                    const statusLog = document.getElementById("status-log");
                    if(statusLog) statusLog.innerHTML = `<p class="mb-1 text-green-700">&gt; Data loaded from memory.</p>`;
                }
            } catch(e) {
                console.error("Failed to parse saved student data:", e);
            }
        }
    } catch (criticalError) {
        console.error("CRITICAL APP STARTUP ERROR:", criticalError);
        if (typeof finalizeAppLoad === 'function') finalizeAppLoad();
    }
}

    // ==========================================
    // 💰 REMUNERATION LOGIC (FINAL - DYNAMIC STREAMS)
    // ==========================================

    // 1. Navigation Listener
    if (navRemuneration) {
        navRemuneration.addEventListener('click', () => {
            showView(viewRemuneration, navRemuneration);
            // Initialize the separate module logic
            if (typeof initRemunerationModule === 'function') {
                initRemunerationModule();
            }
        });
    }

    // 2. Handle Grouping Mode Change (Show/Hide Dates)
    const billModeSelect = document.getElementById('bill-mode-select');
    const billDateRange = document.getElementById('bill-date-range');
    
    if (billModeSelect) {
        billModeSelect.addEventListener('change', () => {
            if (billModeSelect.value === 'period') {
                billDateRange.classList.remove('hidden');
                billDateRange.classList.add('grid');
            } else {
                billDateRange.classList.add('hidden');
                billDateRange.classList.remove('grid');
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

            // Inputs
            const selectedStream = document.getElementById('bill-stream-select').value;
            const mode = document.getElementById('bill-mode-select').value;
            
            if (!selectedStream) {
                alert("Please select a stream.");
                return;
            }

            // A. Filter Data by Exact Stream Name
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
                // Date Range Check (for Period Mode)
                if (mode === 'period' && (startDateInput || endDateInput)) {
                    const sDate = parseDate(s.Date);
                    if (startDateInput && sDate < startDateInput) return; // Skip
                    if (endDateInput && sDate > endDateInput) return; // Skip
                }

                const sessionKey = `${s.Date} | ${s.Time}`;
                let groupKey = "Consolidated Bill";

                // Grouping Logic
                if (mode === 'exam') {
                    groupKey = getExamName(s.Date, s.Time, s.Stream) || "Unknown / Other Exams";
                } else {
                    const sStr = document.getElementById('bill-start-date').value || "Start";
                    const eStr = document.getElementById('bill-end-date').value || "End";
                    groupKey = `Period: ${sStr} to ${eStr}`;
                }

                if (!billGroups[groupKey]) billGroups[groupKey] = {};
                
                // Initialize Session Stats
                if (!billGroups[groupKey][sessionKey]) {
                    billGroups[groupKey][sessionKey] = { 
                        date: s.Date, 
                        time: s.Time, 
                        normalCount: 0, 
                        scribeCount: 0 
                    };
                }

                // Load Scribe List for accurate counting
                const scribeListRaw = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
                const scribeRegNos = new Set(scribeListRaw.map(s => s.regNo));

                if (scribeRegNos.has(s['Register Number'])) {
                    billGroups[groupKey][sessionKey].scribeCount++;
                } else {
                    billGroups[groupKey][sessionKey].normalCount++;
                }
            });

            // C. Process Groups -> Calculate Bill
            const outputContainer = document.getElementById('remuneration-output');
            outputContainer.innerHTML = '';
            outputContainer.classList.remove('hidden');

            const groupKeys = Object.keys(billGroups).sort();
            
            if (groupKeys.length === 0) {
                outputContainer.innerHTML = '<p class="text-red-500 text-center p-4">No data found for the selected criteria.</p>';
                if(btnPrintBill) btnPrintBill.classList.add('hidden');
                return;
            }

            groupKeys.forEach(title => {
                // Convert session map to array for the calculator
                const sessionMap = billGroups[title];
                const sessionArray = Object.values(sessionMap).sort((a,b) => {
                    const d1 = a.date.split('.').reverse().join('');
                    const d2 = b.date.split('.').reverse().join('');
                    return d1.localeCompare(d2) || a.time.localeCompare(b.time);
                });

                // CALL ENGINE (from remuneration.js)
                const bill = generateBillForSessions(title, sessionArray, selectedStream);
                
                if (bill) {
                    renderBillHTML(bill, outputContainer);
                }
            });

            // Show Print Button
            if (btnPrintBill) btnPrintBill.classList.remove('hidden');
        });
    }

    // 4. Print Button Listener
    if (btnPrintBill) {
        btnPrintBill.addEventListener('click', () => {
            document.body.classList.add('printing-bill');
            window.print();
            setTimeout(() => {
                document.body.classList.remove('printing-bill');
            }, 500);
        });
    }

    // 5. Render Function (Smart Columns: Regular vs Other)
    function renderBillHTML(bill, container) {
        
        // Determine Table Structure based on Stream Type (Regular vs SDE)
        // Regular: Has Office Supdt (OS), No Peon
        // Other: Has Peon, No OS
        const isRegular = (bill.stream === "Regular");
        const hasPeon = bill.has_peon; // Driven by remuneration.js config

        // Define Column Widths
        let colGroup = "";
        if (isRegular) {
            // 9 Columns
            colGroup = `<col style="width: 16%;"><col style="width: 12%;"><col style="width: 10%;"><col style="width: 8%;"><col style="width: 8%;"><col style="width: 10%;"><col style="width: 10%;"><col style="width: 10%;"><col style="width: 12%;">`;
        } else {
            // 9 Columns (Swapping OS for Peon)
            colGroup = `<col style="width: 16%;"><col style="width: 12%;"><col style="width: 10%;"><col style="width: 8%;"><col style="width: 8%;"><col style="width: 8%;"><col style="width: 10%;"><col style="width: 10%;"><col style="width: 12%;">`;
        }

        // Headers
        const osHeader = isRegular ? '<th class="p-1 border border-black text-center">OS</th>' : '';
        const peonHeader = hasPeon ? '<th class="p-1 border border-black text-center">Peon</th>' : '';

        // Rows
        const rows = bill.details.map(d => {
            let studentDetail = `${d.total_students}`;
            if (d.scribe_students > 0) {
                studentDetail += ` <span class="text-orange-600 font-bold text-[10px]" style="white-space:nowrap;">(Incl ${d.scribe_students} Scr)</span>`;
            }
            
            let invigDetail = `${d.invig_count_normal}`;
            if (d.invig_count_scribe > 0) {
                invigDetail += ` + <span class="text-orange-600 font-bold">${d.invig_count_scribe}</span>`;
            }

            // Calculate Line Total (Row specific)
            const lineTotal = d.invig_cost + d.clerk_cost + d.sweeper_cost + (d.peon_cost||0) + d.supervision_cost;
            
            // Conditional Cells
            const osCell = isRegular ? `<td class="p-1 border align-middle text-xs text-gray-700">₹${d.os_cost}</td>` : '';
            const peonCell = hasPeon ? `<td class="p-1 border align-middle text-xs">₹${d.peon_cost}</td>` : '';

            return `
                <tr class="border-b hover:bg-gray-50 text-center">
                    <td class="p-1 border text-left align-middle">${d.date} <br><span class="text-[10px] text-gray-500">${d.time}</span></td>
                    <td class="p-1 border align-middle font-bold text-xs">${studentDetail}</td>
                    <td class="p-1 border align-middle text-xs">${invigDetail}<br><span class="text-gray-500 text-[10px]">(₹${d.invig_cost})</span></td>
                    <td class="p-1 border align-middle text-xs">₹${d.clerk_cost}</td>
                    ${peonCell}
                    <td class="p-1 border align-middle text-xs">₹${d.sweeper_cost}</td>
                    <td class="p-1 border align-middle text-xs text-gray-700">₹${d.cs_cost}</td>
                    <td class="p-1 border align-middle text-xs text-gray-700">₹${d.sas_cost}</td>
                    ${osCell}
                    <td class="p-1 border align-middle text-xs font-bold bg-gray-100">₹${lineTotal}</td>
                </tr>
            `;
        }).join('');

        // Footers
        const osFooter = isRegular ? `<td class="p-2 border border-black">₹${bill.supervision_breakdown.office.total}</td>` : '';
        const peonFooter = hasPeon ? `<td class="p-2 border border-black">₹${bill.peon}</td>` : '';
        
        // Calculate Net Total for Footer (Exclude allowances to match line totals)
        const tableTotal = bill.invigilation + bill.clerical + bill.sweeping + bill.peon + bill.supervision;

        // Supervision Summary Block (Split Line)
        let supSummaryHTML = '';
        if (isRegular) {
            supSummaryHTML = `
                CS: ₹${bill.supervision_breakdown.chief.total}, 
                SAS: ₹${bill.supervision_breakdown.senior.total}, 
                OS: ₹${bill.supervision_breakdown.office.total}, 
                <strong class="text-black">Total: ₹${bill.supervision}</strong>
            `;
        } else {
            supSummaryHTML = `
                Chief Supdt: ₹${bill.supervision_breakdown.chief.total}, 
                Senior Supdt: ₹${bill.supervision_breakdown.senior.total}, 
                <strong class="text-black">Total: ₹${bill.supervision}</strong>
            `;
        }

        const html = `
            <div class="bg-white border-2 border-gray-800 shadow-xl p-8 print-page mb-8 relative">
                
                <div class="text-center border-b-2 border-black pb-4 mb-4">
                    <h2 class="text-xl font-bold uppercase leading-tight">${currentCollegeName}</h2>
                    <h3 class="text-lg font-semibold mt-1">Remuneration Bill: ${bill.title}</h3>
                    <p class="text-sm text-gray-600 mt-1">Stream: ${bill.stream} | Generated on ${new Date().toLocaleDateString()}</p>
                </div>

                <table class="w-full border-collapse border border-black text-sm mb-4 table-fixed">
                    <colgroup>${colGroup}</colgroup>
                    <thead class="bg-gray-100 text-xs uppercase">
                        <tr>
                            <th class="p-1 border border-black text-left">Session</th>
                            <th class="p-1 border border-black text-center">Candidates</th>
                            <th class="p-1 border border-black text-center">Invig</th>
                            <th class="p-1 border border-black text-center">Clerk</th>
                            ${peonHeader}
                            <th class="p-1 border border-black text-center">Swpr</th>
                            <th class="p-1 border border-black text-center">CS</th>
                            <th class="p-1 border border-black text-center">SAS</th>
                            ${osHeader}
                            <th class="p-1 border border-black text-center font-bold">Total</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                    <tfoot class="bg-gray-100 font-bold text-xs text-center">
                        <tr>
                            <td colspan="2" class="p-2 border border-black text-right">Subtotals:</td>
                            <td class="p-2 border border-black">₹${bill.invigilation}</td>
                            <td class="p-2 border border-black">₹${bill.clerical}</td>
                            ${peonFooter}
                            <td class="p-2 border border-black">₹${bill.sweeping}</td>
                            <td class="p-2 border border-black">₹${bill.supervision_breakdown.chief.total}</td>
                            <td class="p-2 border border-black">₹${bill.supervision_breakdown.senior.total}</td>
                            ${osFooter}
                            <td class="p-2 border border-black text-lg">₹${tableTotal}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="summary-box grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm border-t-2 border-black pt-4 break-inside-avoid">
                    
                    <div class="bg-gray-50 p-3 rounded border border-gray-200 print:border-0 print:bg-transparent print:p-0">
                        <div class="font-bold text-gray-700 border-b border-gray-300 mb-2 pb-1">1. Supervision Breakdown</div>
                        <div class="text-xs text-gray-600 leading-relaxed">
                            ${supSummaryHTML}
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div class="flex justify-between border-b border-dotted pb-1 font-bold text-gray-700">2. Other Allowances</div>
                        <div class="flex justify-between border-b border-dotted pb-1"><span>Contingency:</span> <span class="font-mono font-bold">₹${bill.contingency.toFixed(2)}</span></div>
                        <div class="flex justify-between border-b border-dotted pb-1"><span>Data Entry Operator:</span> <span class="font-mono font-bold">₹${bill.data_entry}</span></div>
                        <div class="flex justify-between border-b border-dotted pb-1"><span>Accountant:</span> <span class="font-mono font-bold">₹${(allRates[bill.stream] ? allRates[bill.stream].accountant : 0)}</span></div>
                    </div>
                </div>

                <div class="summary-box mt-6 p-3 bg-gray-100 border border-black flex justify-between items-center break-inside-avoid print:bg-transparent">
                    <span class="text-lg font-bold uppercase">Grand Total Claim</span>
                    <span class="text-2xl font-bold font-mono">₹${bill.grand_total.toFixed(2)}</span>
                </div>

                <div class="summary-box mt-12 flex justify-between text-sm font-bold break-inside-avoid">
                    <div class="border-t border-black w-1/3 text-center pt-2">Assistant</div>
                    <div class="border-t border-black w-1/3 text-center pt-2">Chief Superintendent</div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', html);
    }
    
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
