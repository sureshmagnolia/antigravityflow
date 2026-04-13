/* drive_sync.js - Token Caching & Persistent Connection */

const CLIENT_ID = '1097009779148-nkdd0ovfphsdo4uj9a6bbu09fnsd607j.apps.googleusercontent.com'; 
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let tokenClient;
let gapiInited = false;
let gisInited = false;

const DATA_KEYS = [
    'examRoomConfig', 'examStreamsConfig', 'examCollegeName', 
    'examAbsenteeList', 'examQPCodes', 'examBaseData', 
    'examRoomAllotment', 'examScribeList', 'examScribeAllotment', 
    'examRulesConfig', 'examInvigilationSlots', 'examStaffData', 
    'examInvigilatorMapping', 'invigAdvanceUnavailability',
    'examSessionNames', 'examRemunerationConfig'
];

// --- IndexedDB Configuration (Sync with app.js) ---
const IDB_NAME = 'AntigravityDB';
const IDB_STORE = 'examStore';
const IDB_KEY = 'examBaseData';

function openExamDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(IDB_NAME, 2);
        req.onupgradeneeded = e => { const db = e.target.result; if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE); };
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e.target.error);
    });
}
function loadExamDataIDB() {
    return openExamDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readonly');
            const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
            req.onsuccess = e => { db.close(); resolve(e.target.result || []); };
            req.onerror = e => { db.close(); reject(e.target.error); };
        });
    });
}
function saveExamDataIDB(dataArray) {
    return openExamDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).put(dataArray, IDB_KEY);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = e => { db.close(); reject(e.target.error); };
        });
    });
}


// --- INITIALIZATION ---
function gapiLoaded() { gapi.load('client', intializeGapiClient); }
async function intializeGapiClient() {
    await gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
    gapiInited = true;
    checkAuth();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, focus: false, scope: SCOPES, callback: '', 
    });
    gisInited = true;
    checkAuth();
}

function checkAuth() {
    if (gapiInited && gisInited) {
        document.getElementById('btn-connect-drive').classList.remove('hidden');
        
        const storedToken = localStorage.getItem('drive_access_token');
        const expiry = localStorage.getItem('drive_token_expiry');
        const now = Date.now();

        if (storedToken && expiry && now < parseInt(expiry)) {
            // 1. Token is VALID. Reuse it!
            console.log("Restoring valid session from storage...");
            gapi.client.setToken({ access_token: storedToken });
            localStorage.setItem('isDriveConnected', 'true'); // Ensure flag matches
            showConnectedState();
        } 
        else if (localStorage.getItem('isDriveConnected') === 'true') {
            // 2. Token Expired, but was connected. Try refresh.
            console.log("Token expired. Attempting silent refresh...");
            restoreSession();
        }
    }
}

function restoreSession() {
    tokenClient.callback = async (resp) => {
        if (resp.error) {
            console.warn("Silent Auth Failed:", resp);
            showReconnectState(); // Ask user to click
        } else {
            handleTokenResponse(resp);
        }
    };
    tokenClient.requestAccessToken({ prompt: 'consent', select_account: true });

}

function handleTokenResponse(resp) {
    if (resp.access_token) {
        // Save Token & Expiry (Expires in 3599 seconds usually)
        const expiresIn = (resp.expires_in || 3599) * 1000; 
        const expiryTime = Date.now() + expiresIn - 60000; // Buffer 1 min
        
        localStorage.setItem('drive_access_token', resp.access_token);
        localStorage.setItem('drive_token_expiry', expiryTime);
        localStorage.setItem('isDriveConnected', 'true');
        
        gapi.client.setToken(resp);
        showConnectedState();
    }
}

// --- UI STATES ---

function showConnectedState() {
    const btn = document.getElementById('btn-connect-drive');
    btn.innerHTML = "❌ Disconnect Drive";
    btn.className = "px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition";
    btn.onclick = disconnectDrive;
    document.getElementById('drive-controls').classList.remove('hidden');
    findLatestBackupTime();
}

function showReconnectState() {
    const btn = document.getElementById('btn-connect-drive');
    btn.innerHTML = "⚠️ Reconnect Drive";
    btn.className = "px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded transition";
    btn.onclick = handleAuthClick; 
    document.getElementById('drive-controls').classList.add('hidden');
}

function showDisconnectedState() {
    const btn = document.getElementById('btn-connect-drive');
    btn.innerHTML = "🔗 Connect Google Drive";
    btn.className = "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition";
    btn.onclick = handleAuthClick;
    
    document.getElementById('drive-controls').classList.add('hidden');
    document.getElementById('last-sync-time').textContent = "";
}

// --- AUTH ACTIONS ---

function disconnectDrive() {
    const token = gapi.client.getToken();
    if (token) google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken(null);
    localStorage.removeItem('isDriveConnected');
    localStorage.removeItem('drive_access_token');
    localStorage.removeItem('drive_token_expiry');
    showDisconnectedState();
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error) throw resp;
        handleTokenResponse(resp);
    };
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// --- FOLDER & UPLOAD LOGIC ---

async function getBackupFolder() {
    const q = "mimeType='application/vnd.google-apps.folder' and name='ExamFlow_Backups' and trashed=false";
    let res;
    try {
        res = await gapi.client.drive.files.list({ q: q, fields: 'files(id)' });
    } catch(e) {
        localStorage.removeItem('drive_access_token');
        localStorage.removeItem('drive_token_expiry');
        localStorage.removeItem('isDriveConnected');
        gapi.client.setToken(null);
        showReconnectState();
        throw new Error('Drive session expired. Please click Reconnect Drive and try again.');
    }
    if (res.status === 401) {
        localStorage.removeItem('drive_access_token');
        localStorage.removeItem('drive_token_expiry');
        localStorage.removeItem('isDriveConnected');
        gapi.client.setToken(null);
        showReconnectState();
        throw new Error('Drive session expired. Please click Reconnect Drive and try again.');
    }
    if (res.result.files.length > 0) return res.result.files[0].id;
    const meta = { 'name': 'ExamFlow_Backups', 'mimeType': 'application/vnd.google-apps.folder' };
    const createRes = await gapi.client.drive.files.create({ resource: meta, fields: 'id' });
    return createRes.result.id;
}

async function findLatestBackupTime() {
    try {
        const folderId = await getBackupFolder();
        const res = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            orderBy: 'createdTime desc',
            fields: 'files(createdTime)',
            pageSize: 1
        });
        if(res.result.files.length > 0) {
            document.getElementById('last-sync-time').textContent = new Date(res.result.files[0].createdTime).toLocaleString();
        } else {
            document.getElementById('last-sync-time').textContent = "No backups found";
        }
    } catch(e) { console.error(e); }
}

async function syncData() {
    const btn = document.getElementById('btn-manual-sync');
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Saving...";
    btn.disabled = true;

    try {
        // Check if token is still valid, refresh silently if needed
        const currentToken = gapi.client.getToken();
        if (!currentToken || !currentToken.access_token) {
            btn.innerHTML = "🔄 Refreshing login...";
            await new Promise((resolve, reject) => {
                tokenClient.callback = (resp) => {
                    if (resp.error) reject(new Error('Login refresh failed. Please reconnect Drive.'));
                    else { handleTokenResponse(resp); resolve(); }
                };
                tokenClient.requestAccessToken({ prompt: '' });
            });
        }

        const folderId = await getBackupFolder();

        // --- FETCH ALL HISTORICAL STUDENT DATA BEFORE BACKING UP ---
        if (window.fetchHeavyDataOnDemand) {
            const historicalMeta = JSON.parse(localStorage.getItem('examHistoricalMeta') || '{}');
            const allKnownSessions = Object.keys(historicalMeta);
            let fetchCount = 0;
            for (const sessionKey of allKnownSessions) {
                const [d, t] = sessionKey.split(' | ');
                const alreadyLoaded = (await loadExamDataIDB()).some(s => s.Date === d.trim() && s.Time === t.trim());
                if (!alreadyLoaded) {
                    fetchCount++;
                    btn.innerHTML = `⏳ Fetching session ${fetchCount}/${allKnownSessions.length}...`;
                    await window.fetchHeavyDataOnDemand(sessionKey);
                    await new Promise(r => setTimeout(r, 300));
                }
            }
        }
        btn.innerHTML = "⏳ Mirroring to Firebase...";
        // --- Plan A: Ensure Firebase has the latest Master Chunks ---
        if (window.syncDataToCloud) {
            await window.syncDataToCloud('baseData');
            await window.syncDataToCloud('settings');
            await window.syncDataToCloud('staff');
        }
        btn.innerHTML = "⏳ Building Drive backup...";
        // -----------------------------------------------------------
        // -----------------------------------------------------------

        const localData = {};
        for (const k of DATA_KEYS) {
        if (k === 'examBaseData') {
            localData[k] = await loadExamDataIDB();
        } else {
            const v = localStorage.getItem(k);
            if(v) { try { localData[k] = JSON.parse(v); } catch(e) { localData[k] = v; } }
        }
    }

        
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const fileName = `Backup_${now.toISOString().split('T')[0]}_${timeStr}.json`;

        const createRes = await gapi.client.drive.files.create({
            resource: { name: fileName, parents: [folderId], mimeType: 'application/json' },
            fields: 'id'
        });
        
        const accessToken = gapi.client.getToken().access_token;
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${createRes.result.id}?uploadType=media`, {
            method: 'PATCH',
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' }),
            body: JSON.stringify(localData, null, 2)
        });

        await manageRetention(folderId);
        localStorage.setItem('lastGoogleSync', Date.now());
        document.getElementById('last-sync-time').textContent = now.toLocaleString();
        
        btn.innerHTML = "✅ Saved!";
        setTimeout(() => btn.innerHTML = originalText, 2000);
        

} catch (e) {
        console.error(e);
        // Show a friendly message for token/auth errors
        if (e.message && e.message.includes('expired')) {
            alert("⚠️ Google Drive session expired.\n\nPlease click the 'Reconnect Drive' button in Settings and try again.");
        } else {
            alert("Backup Failed: " + e.message);
        }
        btn.innerHTML = "❌ Error";
        setTimeout(() => btn.innerHTML = originalText, 3000);
    }
    btn.disabled = false;
}

async function manageRetention(folderId) {
    const res = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`, 
        orderBy: 'createdTime desc',
        fields: 'files(id, size)' // <-- Crucial: Added 'size' field
    });
    
    const MAX_SIZE_BYTES = 100 * 1024 * 1024; // Exactly 100 MB
    let currentTotalSize = 0;
    
    for (const f of res.result.files) {
        const fileSize = f.size ? parseInt(f.size, 10) : 0; 
        
        // If adding this file pushes total beyond 100 MB, delete the file
        // (The 'currentTotalSize > 0' check ensures we never delete the very first/newest backup by accident)
        if (currentTotalSize + fileSize > MAX_SIZE_BYTES && currentTotalSize > 0) {
            await gapi.client.drive.files.delete({ fileId: f.id });
        } else {
            currentTotalSize += fileSize;
        }
    }
}



// --- RESTORE UI ---

async function restoreFromDrive() {
    if (typeof currentCollegeId !== 'undefined' && currentCollegeId && navigator.onLine) {
        if (!(await UiModal.confirm("Drive Restore", "⚠️ FIREBASE ACTIVE: Restoring will overwrite local data. Continue?"))) return;
    }


    try {
        const folderId = await getBackupFolder();
        const res = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            orderBy: 'createdTime desc',
            fields: 'files(id, name, createdTime)'
        });
        if (res.result.files.length === 0) return alert("No backups found.");
        showRestoreModal(res.result.files);
    } catch (e) { alert("Error: " + e.message); }
}

function showRestoreModal(files) {
    let listHtml = files.map((f, i) => `
        <div class="p-4 border-b hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors" 
             onclick="executeRestore('${f.id}')">
            <div>
                <div class="font-bold text-gray-800">${f.name}</div>
                <div class="text-xs text-gray-500">${new Date(f.createdTime).toLocaleString()} ${i===0?'(Latest)':''}</div>
            </div>
            <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm shadow-sm transition-transform active:scale-95">
                Restore
            </button>
        </div>
    `).join('');

    const modal = document.createElement('div');
    modal.id = "drive-restore-modal";
    modal.className = "fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100]";
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-[28rem] max-h-[80vh] overflow-hidden flex flex-col animate-fadeIn">
            <div class="p-4 bg-gray-50 border-b flex justify-between items-center">
                <div>
                    <h3 class="font-bold text-lg text-gray-800">Restore Backup</h3>
                    <p class="text-xs text-gray-500">Select a version to restore</p>
                </div>
                <button onclick="document.getElementById('drive-restore-modal').remove()" 
                        class="text-gray-400 hover:text-gray-700 text-2xl font-light focus:outline-none">&times;</button>
            </div>
            <div class="overflow-y-auto flex-1 custom-scrollbar">
                ${listHtml}
            </div>
            <div class="p-3 text-center text-xs text-gray-400 bg-gray-50 border-t">
                Displaying last ${files.length} versions
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

window.executeRestore = async function(fileId) {
    document.getElementById('drive-restore-modal').remove();

    try {
        const response = await gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
        const cloudData = response.result;
        
        // Ask user for Restore Mode
        const isMerge = confirm("RESTORE MODE:\n\nClick [OK] to MERGE the imported Google Drive data with your existing local data.\nClick [Cancel] to REPLACE entirely (wiping all existing local data first).");

        // If REPLACE, wipe local data for a clean slate
        if (!isMerge) {
            localStorage.clear();
            await saveExamDataIDB([]); 
        }

        for (const key of Object.keys(cloudData)) {
        if (DATA_KEYS.includes(key)) {
            const val = cloudData[key];
            
            if (key === 'examBaseData') {
                // Smart Merge Logic for Student Data
                if (isMerge) {
                    const existingData = await loadExamDataIDB() || [];
                    const getRowKey = r => `${r.Date || ""} | ${r.Time || ""} | ${r['Register Number'] || ""} | ${r.Stream || "REGULAR"}`.toUpperCase();
                    const existingKeys = new Set(existingData.map(getRowKey));
                    
                    const newUniqueData = val.filter(student => !existingKeys.has(getRowKey(student)));
                    await saveExamDataIDB([...existingData, ...newUniqueData]);
                } else {
                    // Replace strictly
                    await saveExamDataIDB(val);
                }
                        } else {
                // In MERGE mode: preserve all existing local config keys.
                // Only write this key if user chose REPLACE, OR if the key doesn't exist locally yet.
                if (!isMerge) {
                    // REPLACE mode: overwrite everything
                    if (typeof val === 'object') localStorage.setItem(key, JSON.stringify(val));
                    else localStorage.setItem(key, val);
                } else {
                    // MERGE mode: only write if key is completely absent locally
                    // (never overwrite existing Scribe List, Room Allotment, Invigilator data etc.)
                    if (!localStorage.getItem(key)) {
                        if (typeof val === 'object') localStorage.setItem(key, JSON.stringify(val));
                        else localStorage.setItem(key, val);
                    }
                }
            }

        }
    }

    // KILL GHOST DATA BEFORE RELOAD
        localStorage.removeItem('examBaseData');
        localStorage.removeItem('examData_v2');

                // NEW: Offer to also push examBaseData to Firebase Storage as date-chunks
        if (window.currentCollegeId && navigator.onLine && cloudData.examBaseData && Array.isArray(cloudData.examBaseData)) {
            const pushToCloud = confirm("☁️ Cloud Storage Sync:\n\nDo you also want to push the restored student data to Firebase Storage as on-demand date chunks?\n\nThis allows historical data to be lazy-loaded on other devices.\nClick [OK] to Push, [Cancel] to skip.");

            if (pushToCloud) {
                const { storage, ref, uploadString, getDownloadURL } = window.firebase;
                const pushIsMerge = confirm("CLOUD PUSH MODE:\n\nClick [OK] to MERGE with existing cloud chunks.\nClick [Cancel] to OVERWRITE existing cloud chunks.");

                // Group restored data by Date
                const groupedByDate = {};
                cloudData.examBaseData.forEach(student => {
                    const d = student.Date ? student.Date.trim() : "Unknown_Date";
                    if (!groupedByDate[d]) groupedByDate[d] = [];
                    groupedByDate[d].push(student);
                });

                let cloudPushCount = 0;
                for (const dateKey of Object.keys(groupedByDate)) {
                    if (dateKey === "Unknown_Date") continue;
                    const fileRef = ref(storage, `historical_sessions/${currentCollegeId}/${dateKey}.json`);
                    let finalData = groupedByDate[dateKey];

                    if (pushIsMerge) {
                        try {
                            const url = await getDownloadURL(fileRef);
                            const existing = await fetch(url).then(r => r.json());
                            const getKey = r => `${r.Date || ''}|${r.Time || ''}|${r['Register Number'] || ''}`.toUpperCase();
                            const existingKeys = new Set(existing.map(getKey));
                            const newOnly = finalData.filter(r => !existingKeys.has(getKey(r)));
                            finalData = [...existing, ...newOnly];
                        } catch (e) { /* No existing chunk, first upload */ }
                    }

                    await uploadString(fileRef, JSON.stringify(finalData), 'raw', { contentType: 'application/json' });
                    cloudPushCount++;
                }
                alert(`☁️ Cloud Push Complete: ${cloudPushCount} date chunks pushed to Firebase Storage.`);
            }
        }

        localStorage.setItem('pendingDriveRestoreSync', 'true'); // 🚨 CRITICAL FLAG
        alert("✅ Restored successfully! Reloading...");
        // Mark that we just restored from Drive so app.js can "Heal" Firebase
        localStorage.setItem('pendingDriveRestoreSync', 'true');
        location.reload();


    } catch (e) { alert("Restore Error: " + e.message); }
};

if (!document.getElementById('drive-anim-style')) {
    const style = document.createElement('style');
    style.id = 'drive-anim-style';
    style.innerHTML = `@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-fadeIn { animation: fadeIn 0.2s ease-out; }`;
    document.head.appendChild(style);
}


// ==========================================
// ☁️ HYBRID DATA MANAGER (BASIC USERS + CLOUD USERS)
// ==========================================
window.ExamCloudCache = {
    // Stores the last 10 loaded historical dates to prevent memory bloat (for Cloud users)
    recentDatesLoaded: new Set(),

    async fetchHistoricalData(dateKey) {
        // 1. BASIC USER CHECK: If not logged into a college Firebase, use Full Local DB
        if (!window.currentCollegeId) {
            console.log("👤 Basic User Mode: Relying entirely on local IndexedDB.");
            const allLocalData = await loadExamDataIDB();
            // Basic users have everything in IDB. Return the filtered chunk for this date.
            return allLocalData.filter(student => student.Date === dateKey.split(' | ')[0]);
        }

        // 2. CLOUD USER: Offline Check
        if (!navigator.onLine) {
            alert("⚠️ Cannot fetch historical data for " + dateKey + " while offline. Please connect to the internet.");
            return [];
        }

        // 3. CLOUD USER: Fetch from Firebase Storage
        try {
            // Show Loading Indicator
            const loader = document.createElement('div');
            loader.id = 'cloud-lazy-loader';
            loader.className = 'fixed inset-0 bg-black bg-opacity-50 z-[200] flex flex-col items-center justify-center text-white font-bold';
            loader.innerHTML = `<div class="animate-spin rounded-full h-12 w-12 border-b-4 border-white mb-4"></div> Loading Cloud Data for ${dateKey}...`;
            document.body.appendChild(loader);

            const { storage, ref, getDownloadURL } = window.firebase;
            
            // Extract just the Date part (DD.MM.YYYY) from the session key
            const cleanDate = dateKey.includes('|') ? dateKey.split(' | ')[0].trim() : dateKey.trim();
            const fileRef = ref(storage, `historical_sessions/${currentCollegeId}/${cleanDate}.json`);
            
            const url = await getDownloadURL(fileRef);
            const response = await fetch(url);
            
            if (!response.ok) throw new Error("File missing");
            const datePackage = await response.json();

            // Handle both old format (plain array) and new format (object with students key)
            const students = Array.isArray(datePackage) ? datePackage : (datePackage.students || []);

            // Merge only the student records into IDB (allotments stay in memory only)
            // Historical records are tagged with a TTL so they can be evicted after 7 days
            const existingCache = await loadExamDataIDB();
            const getKey = r => `${r.Date||''}|${r.Time||''}|${r['Register Number']||''}`.toUpperCase();
            const existingKeys = new Set(existingCache.map(getKey));
            const thawedAt = new Date().toISOString();
            const newOnly = students.filter(r => !existingKeys.has(getKey(r))).map(r => ({
                ...r,
                _thawedAt: thawedAt  // Tag as cold-thawed for future eviction
            }));
            await saveExamDataIDB([...existingCache, ...newOnly], true);


            // Store the full historical context in memory (NOT in localStorage)
            // This lets the UI read allotments for this date without touching current data
            if (!window.historicalContextCache) window.historicalContextCache = {};
            window.historicalContextCache[cleanDate] = Array.isArray(datePackage) ? {} : datePackage;

            this.recentDatesLoaded.add(cleanDate);
            document.getElementById('cloud-lazy-loader').remove();
            return students;


        } catch (e) {
            if(document.getElementById('cloud-lazy-loader')) document.getElementById('cloud-lazy-loader').remove();
            
            // Only alert if we know it's an actual unexpected error, ignore 404s for empty exam days
            if(e.message !== "File missing" && !e.message.includes("Object 'historical_sessions")) {
                console.error("Cloud Fetch Error:", e);
                alert("Cloud Request Failed: " + e.message);
            }
            return []; 
        }
    }
};



// ==========================================
// 🚀 HISTORICAL DATA MIGRATION LOGIC
// ==========================================
window.startHistoricalMigration = async function() {
    // Only logged-in users can push to cloud
    if (!window.currentCollegeId) {
        alert("Basic Users operate exclusively offline. Cloud Migration requires a Firebase Login.");
        return;
    }

    const fileInput = document.getElementById('historical-json-upload');
    if (!fileInput.files.length) {
        alert("Please select a JSON file first.");
        return;
    }

    const { storage, ref, uploadString } = window.firebase;
    const file = fileInput.files[0];
    const reader = new FileReader();

        reader.onload = async function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            
            // Support both formats:
            // Format A: Array (old-style examBaseData only)
            // Format B: Object (full Drive backup with DATA_KEYS)
            const isFullBackup = !Array.isArray(parsed) && typeof parsed === 'object';
            const studentArray = isFullBackup ? (parsed.examBaseData || []) : parsed;
            
            if (!Array.isArray(studentArray) || studentArray.length === 0) {
                alert("Invalid JSON. No valid student records found.");
                return;
            }

            // Extract session-keyed data maps from full backup (empty if Format A)
            const rawRoomAllotment    = isFullBackup ? (typeof parsed.examRoomAllotment === 'string' ? JSON.parse(parsed.examRoomAllotment) : (parsed.examRoomAllotment || {})) : {};
            const rawScribeAllotment  = isFullBackup ? (typeof parsed.examScribeAllotment === 'string' ? JSON.parse(parsed.examScribeAllotment) : (parsed.examScribeAllotment || {})) : {};
            const rawInvigMapping     = isFullBackup ? (typeof parsed.examInvigilatorMapping === 'string' ? JSON.parse(parsed.examInvigilatorMapping) : (parsed.examInvigilatorMapping || {})) : {};
            const rawQPCodes          = isFullBackup ? (typeof parsed.examQPCodes === 'string' ? JSON.parse(parsed.examQPCodes) : (parsed.examQPCodes || {})) : {};
            const rawAbsentees        = isFullBackup ? (typeof parsed.examAbsenteeList === 'string' ? JSON.parse(parsed.examAbsenteeList) : (parsed.examAbsenteeList || {})) : {};

            // Helper: filter an object by date prefix
            const filterByDate = (obj, dateKey) => {
                const result = {};
                Object.keys(obj).forEach(k => { if (k.startsWith(dateKey)) result[k] = obj[k]; });
                return result;
            };

            // 1. Group student records by Date (DD.MM.YYYY)
            const groupedByDate = {};
            studentArray.forEach(student => {
                const d = student.Date ? student.Date.trim() : "Unknown_Date";
                if (!groupedByDate[d]) groupedByDate[d] = [];
                groupedByDate[d].push(student);
            });


            const uniqueDates = Object.keys(groupedByDate);
            if (!confirm(`Found ${uniqueDates.length} unique dates in your data.\n\nReady to upload to Firebase Storage?`)) return;

            // NEW: Ask Merge or Overwrite for cloud chunks
            const isMergeCloud = confirm("CLOUD UPLOAD MODE:\n\nClick [OK] to MERGE with existing cloud data (safe, keeps old records).\nClick [Cancel] to OVERWRITE — replaces existing cloud chunks entirely.");


            // 2. Upload Chunks loop
            let successCount = 0;
            const btn = document.querySelector('button[onclick="window.startHistoricalMigration()"]');
            const originalText = btn.innerHTML;

            for (let i = 0; i < uniqueDates.length; i++) {
                const dateKey = uniqueDates[i];
                if (dateKey === "Unknown_Date") continue; // Skip bad data

                btn.innerHTML = `Uploading: ${i + 1} / ${uniqueDates.length}...`;
                
                // Format the chunk
                // Build complete date context package
                const datePackage = {
                    students:          groupedByDate[dateKey],
                    roomAllotment:     filterByDate(rawRoomAllotment, dateKey),
                    scribeAllotment:   filterByDate(rawScribeAllotment, dateKey),
                    invigilatorMapping: filterByDate(rawInvigMapping, dateKey),
                    qpCodes:           filterByDate(rawQPCodes, dateKey),
                    absentees:         filterByDate(rawAbsentees, dateKey)
                };
                const chunkData = JSON.stringify(datePackage);

                
                // Path: historical_sessions/COLLEGE_ID/DD.MM.YYYY.json
                const fileRef = ref(storage, `historical_sessions/${currentCollegeId}/${dateKey}.json`);

                let finalChunkData = chunkData; // Default: use incoming data as-is (OVERWRITE)

                if (isMergeCloud) {
                    // MERGE: Try to fetch existing cloud chunk and deduplicate
                    try {
                        const { getDownloadURL } = window.firebase;
                        const url = await getDownloadURL(fileRef);
                        const existing = await fetch(url).then(r => r.json());
                        const getKey = r => `${r.Date || ''}|${r.Time || ''}|${r['Register Number'] || ''}`.toUpperCase();
                        const existingKeys = new Set(existing.map(getKey));
                        const incoming = groupedByDate[dateKey];
                        const newOnly = incoming.filter(r => !existingKeys.has(getKey(r)));
                        finalChunkData = JSON.stringify([...existing, ...newOnly]);
                    } catch (fetchErr) {
                        // No existing chunk found — first upload, proceed normally
                        finalChunkData = chunkData;
                    }
                }

                await uploadString(fileRef, finalChunkData, 'raw', { contentType: 'application/json' });

                successCount++;
            }

            btn.innerHTML = originalText;
            alert(`✅ Migration Complete! Successfully uploaded ${successCount} date chunks to Firebase Storage.`);
            
        } catch (err) {
            console.error("Migration Error:", err);
            alert("Migration Failed: " + err.message);
        }
    };

    reader.readAsText(file);
};


// ==========================================
// ☁️ ONE-CLICK: ARCHIVE ALL PAST SESSIONS TO CLOUD
// ==========================================
window.archiveAllToCloud = async function() {
    if (!window.currentCollegeId) {
        alert("Cloud Archive requires Firebase Login.");
        return;
    }
    if (!navigator.onLine) {
        alert("You are offline. Please connect to the internet first.");
        return;
    }

    const { storage, ref, uploadString, getDownloadURL } = window.firebase;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Load all student data from IDB
    const allStudents = await loadExamDataIDB();
    if (!allStudents || allStudents.length === 0) {
        alert("No student data found in your local database.");
        return;
    }

    // Group students by date — only PAST sessions
    const groupedByDate = {};
    allStudents.forEach(s => {
        const d = s.Date ? s.Date.trim() : null;
        if (!d) return;
        const parts = d.split('.');
        const sessionDate = new Date(parts[2], parts[1] - 1, parts[0]);
        sessionDate.setHours(0, 0, 0, 0);
        if (sessionDate >= today) return; // Skip future/today sessions
        if (!groupedByDate[d]) groupedByDate[d] = [];
        groupedByDate[d].push(s);
    });

    const uniqueDates = Object.keys(groupedByDate);
    if (uniqueDates.length === 0) {
        alert("No past sessions found to archive.");
        return;
    }

    if (!confirm(`Found ${uniqueDates.length} past session date(s) in your local database.\n\nThis will upload them all to Firebase Storage as cold archive.\n\nProceed?`)) return;

    // Load aux data from localStorage
    const rawRoomAllotment      = JSON.parse(localStorage.getItem('examAllotmentData') || '{}');
    const rawInvigMapping       = JSON.parse(localStorage.getItem('examInvigilatorMapping') || '{}');
    const rawScribeAllotment    = JSON.parse(localStorage.getItem('examScribeAllotmentV2') || '{}');
    const rawQPCodes            = JSON.parse(localStorage.getItem('examQPCodes') || '{}');
    const rawAbsentees          = JSON.parse(localStorage.getItem('examAbsenteeList') || '{}');

    const filterByDate = (obj, dateKey) => {
        const result = {};
        Object.keys(obj).forEach(k => { if (k.startsWith(dateKey)) result[k] = obj[k]; });
        return result;
    };

    let successCount = 0;
    const btn = document.querySelector('button[onclick="window.archiveAllToCloud()"]');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) btn.disabled = true;

    for (let i = 0; i < uniqueDates.length; i++) {
        const dateKey = uniqueDates[i];
        if (btn) btn.innerHTML = `Uploading ${i + 1} / ${uniqueDates.length}...`;

        const datePackage = {
            students:           groupedByDate[dateKey],
            roomAllotment:      filterByDate(rawRoomAllotment, dateKey),
            invigilatorMapping: filterByDate(rawInvigMapping, dateKey),
            scribeAllotment:    filterByDate(rawScribeAllotment, dateKey),
            qpCodes:            filterByDate(rawQPCodes, dateKey),
            absentees:          filterByDate(rawAbsentees, dateKey)
        };

        const fileRef = ref(storage, `historical_sessions/${window.currentCollegeId}/${dateKey}.json`);
        await uploadString(fileRef, JSON.stringify(datePackage), 'raw', { contentType: 'application/json' });
        successCount++;
    }

    if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
    alert(`✅ Done! Successfully archived ${successCount} date(s) to Firebase Storage.`);
};


// ==========================================
// 🗑️ DELETE FROM CLOUD ARCHIVE
// ==========================================
window.openCloudDeleteModal = async function() {
    if (!window.currentCollegeId) {
        alert("This requires Firebase Login.");
        return;
    }

    const modal = document.getElementById('cloud-delete-modal');
    const listDiv = document.getElementById('cloud-delete-list');
    modal.classList.remove('hidden');
    listDiv.innerHTML = '<p class="text-gray-400 italic">Scanning Firebase Storage...</p>';

    try {
        const { storage, ref, listAll, deleteObject } = window.firebase;
        const folderRef = ref(storage, `historical_sessions/${window.currentCollegeId}/`);
        const result = await listAll(folderRef);

        if (result.items.length === 0) {
            listDiv.innerHTML = '<p class="text-gray-400 italic">No archived files found in cloud.</p>';
            return;
        }

        listDiv.innerHTML = result.items.map(itemRef => {
            const name = itemRef.name;
            const dateLabel = name.replace('.json', '');
            return `
                <div class="flex justify-between items-center p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <span class="font-bold text-gray-700 text-xs">${dateLabel}</span>
                    <button onclick="window.deleteCloudFile('${itemRef.fullPath}')" 
                        class="px-3 py-1 text-[10px] font-bold text-white bg-red-500 hover:bg-red-700 rounded transition">
                        Delete
                    </button>
                </div>`;
        }).join('');

    } catch (e) {
        listDiv.innerHTML = `<p class="text-red-500 text-xs">Error: ${e.message}</p>`;
    }
};

window.deleteCloudFile = async function(fullPath) {
    if (!confirm(`Delete this file from cloud?\n\n${fullPath}\n\nThis cannot be undone.`)) return;
    try {
        const { storage, ref, deleteObject } = window.firebase;
        const fileRef = ref(storage, fullPath);
        await deleteObject(fileRef);
        // Refresh the list
        await window.openCloudDeleteModal();
    } catch (e) {
        alert("Delete failed: " + e.message);
    }
};


