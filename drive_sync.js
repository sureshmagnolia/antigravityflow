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
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
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
    tokenClient.requestAccessToken({ prompt: '' });
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
        q: `'${folderId}' in parents and trashed=false`, // Fixed Q
        orderBy: 'createdTime desc',
        fields: 'files(id)'
    });
    if (res.result.files.length > 5) {
        for (const f of res.result.files.slice(5)) await gapi.client.drive.files.delete({ fileId: f.id });
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


    
                if (typeof val === 'object') localStorage.setItem(key, JSON.stringify(val));
                else localStorage.setItem(key, val);
            }
        }
    }

    // KILL GHOST DATA BEFORE RELOAD
        localStorage.removeItem('examBaseData');
        localStorage.removeItem('examData_v2');

        
        localStorage.setItem('pendingDriveRestoreSync', 'true'); // 🚨 CRITICAL FLAG
        alert("✅ Restored successfully! Reloading...");
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
            const sessionDataChunk = await response.json();

            // Cache into IndexedDB for subsequent rapid clicks
            const existingCache = await loadExamDataIDB();
            const merged = [...existingCache, ...sessionDataChunk];
            
            await saveExamDataIDB(merged, true); 

            // Track loaded dates to manage memory limits
            this.recentDatesLoaded.add(cleanDate);
            if(this.recentDatesLoaded.size > 10) {
                 console.warn("☁️ Cache Warning: More than 10 historical dates loaded for Cloud User.");
            }

            document.getElementById('cloud-lazy-loader').remove();
            return sessionDataChunk;

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
    const fileInput = document.getElementById('historical-json-upload');
    if (!fileInput.files.length) {
        alert("Please select a JSON file first.");
        return;
    }

    if (!currentCollegeId) {
        alert("System not fully initialized. Please ensure you are logged in.");
        return;
    }

    const { storage, ref, uploadString } = window.firebase;
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const fullData = JSON.parse(e.target.result);
            if (!Array.isArray(fullData)) {
                alert("Invalid JSON format. Expected an array of student records.");
                return;
            }

            // 1. Group records by Date
            const groupedByDate = {};
            fullData.forEach(student => {
                const d = student.Date ? student.Date.trim() : "Unknown_Date";
                if (!groupedByDate[d]) groupedByDate[d] = [];
                groupedByDate[d].push(student);
            });

            const uniqueDates = Object.keys(groupedByDate);
            if (!confirm(`Found ${uniqueDates.length} unique dates in your data. Ready to upload them in chunks to Firebase Storage?`)) return;

            // 2. Upload Chunks loop
            let successCount = 0;
            const btn = document.querySelector('button[onclick="window.startHistoricalMigration()"]');
            const originalText = btn.innerHTML;

            for (let i = 0; i < uniqueDates.length; i++) {
                const dateKey = uniqueDates[i];
                if (dateKey === "Unknown_Date") continue; // Skip bad data

                btn.innerHTML = `Uploading: ${i + 1} / ${uniqueDates.length}...`;
                
                // Format the chunk
                const chunkData = JSON.stringify(groupedByDate[dateKey]);
                
                // Path: historical_sessions/COLLEGE_ID/DD.MM.YYYY.json
                const fileRef = ref(storage, `historical_sessions/${currentCollegeId}/${dateKey}.json`);
                
                // Upload text content directly to Storage
                await uploadString(fileRef, chunkData, 'raw', { contentType: 'application/json' });
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
