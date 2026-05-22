/* drive_sync.js - Token Caching & Persistent Connection */

const CLIENT_ID = '1097009779148-nkdd0ovfphsdo4uj9a6bbu09fnsd607j.apps.googleusercontent.com'; 
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let isReadyToPush = false; // 🛡️ Safety Lock: Prevent pushing until cloud is checked

const DATA_KEYS = [
      'examRoomConfig', 'examStreamsConfig', 'examCollegeName',
      'examAbsenteeList', 'examQPCodes', 'examBaseData',
      'examRoomAllotment', 'examAllotmentData', 'examScribeList',
      'examScribeAllotment', 'examScribeAllotmentV2',
      'examRulesConfig', 'examInvigilationSlots', 'examStaffData',
      'examInvigilatorMapping', 'invigAdvanceUnavailability',
      'examSessionNames', 'examRemunerationConfig',
      'invigDepartments', 'invigRoles', 'invigGlobalTarget',
      'invigGuestTarget', 'invigVacationTarget', 'invigVacationConfig',
      'invigDesignations', 'invigGoogleScriptUrl',
      'examHistoricalMeta', 'lastUpdated'
  ];
window.DATA_KEYS = DATA_KEYS; // Expose to app.js


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
function saveExamDataIDB(dataArray, skipCloudSync = false) {
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
        // 🛡️ Safety: Only show button if it exists (ExamFlow portal)
        const connectBtn = document.getElementById('btn-connect-drive');
        if (connectBtn) connectBtn.classList.remove('hidden');
        
        const storedToken = localStorage.getItem('drive_access_token');
        const expiry = localStorage.getItem('drive_token_expiry');
        const now = Date.now();

        if (storedToken && expiry && now < parseInt(expiry)) {
            // 1. Token is VALID. Reuse it!
            console.log("Restoring valid session from storage...");
            gapi.client.setToken({ access_token: storedToken });
            localStorage.setItem('isDriveConnected', 'true');
            showConnectedState();
        } 
        else if (localStorage.getItem('isDriveConnected') === 'true') {
            // 2. Token Expired. DO NOT auto-refresh on startup (prevents annoying popups).
            // Instead, just show the Reconnect state.
            console.log("Drive session expired. Showing reconnect option.");
            showReconnectState();
        }
    }
}

function restoreSession() {
    tokenClient.callback = async (resp) => {
        if (resp.error) {
            console.warn("Silent Auth Failed (Expected if browser blocks popups):", resp);
            showReconnectState(); // Show "Reconnect" button for user to click
        } else {
            handleTokenResponse(resp);
        }
    };
    // 🛡️ SILENT REFRESH: Use prompt:'' to try background refresh first without popups
    tokenClient.requestAccessToken({ prompt: '', select_account: false });
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
    const controls = document.getElementById('drive-controls');

    // 🛡️ Safety Guard: Only update UI if elements are loaded in DOM
    if (btn) {
        btn.innerHTML = "❌ Disconnect Drive";
        btn.className = "px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition";
        btn.onclick = disconnectDrive;
    }
    if (controls) controls.classList.remove('hidden');

    const ribbonBtn = document.getElementById('btn-drive-sync-ribbon');
    if(ribbonBtn) ribbonBtn.classList.add('hidden');
    const ribbonStatus = document.getElementById('drive-sync-status-ribbon');
    // 🛡️ Guard: Only show status on ribbon if NOT a Pro user (Firebase)
    const isProUser = !!window.currentCollegeId || localStorage.getItem('isAdminUser') === 'true';
    if (ribbonStatus && !isProUser) {
        ribbonStatus.classList.remove('hidden');
    } else if (ribbonStatus) {
        ribbonStatus.classList.add('hidden');
    }
    
    findLatestBackupTime();

    // 🚀 NEW: Offline Change Audit
    // Detect if work was done while Drive was disconnected
    const lastLocal = parseInt(localStorage.getItem('lastUpdated') || 0);
    const lastCloudSync = parseInt(localStorage.getItem('lastGoogleSync') || 0);
    
    if (lastLocal > lastCloudSync + 5000) { // 5s buffer to avoid jitter
        console.log("📂 Offline work detected. Notifying user to save.");
        const saveBtn = document.getElementById('btn-manual-push');
        const saveBtnText = document.getElementById('save-btn-text');
        if (saveBtn) {
            if (saveBtnText) saveBtnText.textContent = "Offline Changes Found: Save Now";
            saveBtn.classList.replace('bg-gray-700', 'bg-amber-500');
            saveBtn.classList.add('animate-pulse');
        }
    }

    // 🚀 NEW: Auto-check for data the moment Drive is connected
    checkForNewerDataOnDrive(false);
}


function showReconnectState() {
    const btn = document.getElementById('btn-connect-drive');
    const controls = document.getElementById('drive-controls');

    if (btn) {
        btn.innerHTML = "🔄 Reconnect Drive";
        btn.className = "px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition";
        btn.onclick = handleAuthClick;
    }
    if (controls) controls.classList.add('hidden');

    // 🎀 RIBBON FIX: Show reconnect button on top ribbon too
const ribbonBtn = document.getElementById('btn-drive-sync-ribbon');
    const isProUser = !!window.currentCollegeId || localStorage.getItem('isAdminUser') === 'true';
    if (ribbonBtn && !isProUser) {
        ribbonBtn.innerHTML = `<span>🔄 Reconnect Drive</span>`;
        ribbonBtn.classList.remove('hidden');
    } else if (ribbonBtn) {
        ribbonBtn.classList.add('hidden');
    }
    const ribbonStatus = document.getElementById('drive-sync-status-ribbon');
    if (ribbonStatus) ribbonStatus.classList.add('hidden');
}


function showDisconnectedState() {
    const btn = document.getElementById('btn-connect-drive');
    const controls = document.getElementById('drive-controls');
    const lastSyncElem = document.getElementById('last-sync-time');

    if (btn) {
        btn.innerHTML = "🔗 Connect Google Drive";
        btn.className = "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition";
        btn.onclick = handleAuthClick;
    }

    if (controls) controls.classList.add('hidden');
    if (lastSyncElem) lastSyncElem.textContent = "";

const ribbonBtn = document.getElementById('btn-drive-sync-ribbon');
// 🛡️ Guard: Only show "Add Sync" button if NOT a Pro user (Firebase)
    const isProUser = !!window.currentCollegeId || localStorage.getItem('isAdminUser') === 'true';
    if (ribbonBtn && !isProUser) {
        ribbonBtn.classList.remove('hidden');
    } else if (ribbonBtn) {
        ribbonBtn.classList.add('hidden');
    }
    const ribbonStatus = document.getElementById('drive-sync-status-ribbon');
    if(ribbonStatus) ribbonStatus.classList.add('hidden');
}


// --- AUTH ACTIONS ---

window.disconnectDrive = disconnectDrive;
async function disconnectDrive() {
    // 🛡️ Guard: Confirm before disconnecting
    if (!(await UiModal.confirm("Disconnect Drive", "This will stop cloud syncing and remove access to your Google Drive. Your local data will remain safe. Continue?"))) return;

    const token = gapi.client.getToken();
    if (token) {
        try {
            google.accounts.oauth2.revoke(token.access_token);
        } catch (e) {
            console.warn("Token revocation failed (already expired):", e);
        }
    }
    gapi.client.setToken(null);
    localStorage.removeItem('isDriveConnected');
    localStorage.removeItem('drive_access_token');
    localStorage.removeItem('drive_token_expiry');
    showDisconnectedState();
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error) {
            if (resp.error === 'access_denied') {
               alert("❌ Access Denied: You must tick the 'Google Drive' checkbox in the Google login screen to use this feature.");
               return;
            }
            throw resp;
        }
        handleTokenResponse(resp);
    };
    
    // 🛡️ FORCE CONSENT: This is critical. By adding 'consent', we force Google to show the 
    // permission checkbox. This is the only fix for your "403 Forbidden" error.
    tokenClient.requestAccessToken({ prompt: 'select_account consent' });
}

// --- FOLDER & UPLOAD LOGIC ---

// --- FOLDER & UPLOAD LOGIC ---

async function getBackupFolder() {
    // 🛡️ WAIT FOR GAPI: Ensure the drive client is fully loaded before making requests
    let retries = 0;
    while ((!window.gapi || !gapi.client || !gapi.client.drive) && retries < 10) {
        console.log("⏳ Waiting for Google Drive API to finish loading...");
        await new Promise(r => setTimeout(r, 500));
        retries++;
    }
    
    if (!window.gapi || !gapi.client || !gapi.client.drive) {
        throw new Error("Google Drive API failed to initialize. Please refresh the page.");
    }

    const q = "mimeType='application/vnd.google-apps.folder' and name='ExamFlow_Backups' and trashed=false";
    let res;
    try {
        res = await gapi.client.drive.files.list({ q: q, fields: 'files(id)' });
    } catch(e) {
        // 🛡️ FIX: Deeply check for 401 or 403 errors
        const isAuthError = e.status === 401 || e.status === 403 || e.code === 401 || e.code === 403 || (e.result && e.result.error && (e.result.error.code === 401 || e.result.error.code === 403));

        if (isAuthError) {
            localStorage.removeItem('drive_access_token');
            localStorage.removeItem('drive_token_expiry');
            localStorage.removeItem('isDriveConnected');
            gapi.client.setToken(null);
            showReconnectState();

            // Determine if it was specifically a 403 (permissions) or a 401 (expired)
            const isForbidden = e.status === 403 || e.code === 403 || (e.result && e.result.error && e.result.error.code === 403);
            const errMsg = isForbidden ? "Drive permissions missing. Please click 'Reconnect Drive' and ensure you TICK THE CHECKBOX for Drive access in the Google popup." : "Drive session expired. Please reconnect.";

            // Log it, and only alert if they clicked a manual button
            console.warn(errMsg);
            if (!document.getElementById('drive-sync-status-ribbon')?.classList.contains('hidden')) {
                 alert("⚠️ " + errMsg);
            }
            throw new Error(errMsg);
        }
        // For other errors (like API not ready), warn but don't logout
        console.warn("Drive connection check deferred:", e);
        throw e;
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
            q: `('${folderId}' in parents or name contains 'Backup') and mimeType='application/json' and trashed=false`,
            orderBy: 'createdTime desc',
            fields: 'files(createdTime)',
            pageSize: 1
        });
        const syncLabel = document.getElementById('last-sync-time');
        if (syncLabel) {
            if(res.result.files.length > 0) {
                syncLabel.textContent = new Date(res.result.files[0].createdTime).toLocaleString();
            } else {
                syncLabel.textContent = "No backups found";
            }
        }

} catch(e) { console.error(e); }
}

window.syncData = syncData; // 🛡️ Expose to HTML buttons
async function syncData(source = "AUTO") {
    // 🛡️ [AUDIT FIX]: Normalize source prefix to ensure backups are discoverable by restore function
    if (!source.startsWith('ADMIN') && !source.startsWith('INVIG')) {
        const isInvig = window.location.pathname.includes('invigilation');
        source = (isInvig ? 'INVIG_' : 'ADMIN_') + source;
    }

    window.isDriveSyncInProgress = true; // 🛡️ Raise the Busy Flag
    const btn = document.getElementById('btn-manual-sync');
    const originalText = btn ? btn.innerHTML : '';
    
    if (btn) {
        btn.innerHTML = "⏳ Saving...";
        btn.disabled = true;
    }

    try {
        // 🛡️ Safety Guard: Wait for Google API to initialize if it's still waking up
        if (!window.gapi || !gapi.client) {
            console.log("⏳ Google API not ready. Retrying in 2 seconds...");
            await new Promise(r => setTimeout(r, 2000));
            if (!gapi.client) throw new Error("Google Drive API failed to initialize. Please refresh the page.");
        }

        // Check if token is still valid, refresh silently if needed
        const currentToken = gapi.client.getToken();
        if (!currentToken || !currentToken.access_token) {
            if (btn) btn.innerHTML = "🔄 Refreshing login...";
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
                    if (btn) btn.innerHTML = `⏳ Fetching session ${fetchCount}/${allKnownSessions.length}...`;
                    await window.fetchHeavyDataOnDemand(sessionKey);
                    await new Promise(r => setTimeout(r, 300));
                }
            }
        }
        if (btn) btn.innerHTML = "⏳ Mirroring to Firebase...";
        // --- Plan A: Ensure Firebase has the latest Master Chunks ---
        if (window.syncDataToCloud) {
            await window.syncDataToCloud('baseData');
            await window.syncDataToCloud('settings');
            await window.syncDataToCloud('staff');
        }
        if (btn) btn.innerHTML = "⏳ Building Drive backup...";
        // -----------------------------------------------------------
        // -----------------------------------------------------------

        const localData = {};
        
        // 🛡️ Filter keys based on the source of the backup
        let targetKeys = DATA_KEYS;
        if (source.startsWith('INVIG')) {
            targetKeys = [
                'examCollegeName', 
                'examInvigilationSlots', 
                'examStaffData', 
                'examInvigilatorMapping', 
                'invigAdvanceUnavailability',
                'invigDepartments', 
                'invigRoles', 
                'invigGlobalTarget', 
                'invigGuestTarget', 
                'invigVacationTarget', 
                'invigGoogleScriptUrl'
            ];
        }

        for (const k of targetKeys) {
            if (k === 'examBaseData') {
                localData[k] = await loadExamDataIDB();
            } else {
                const v = localStorage.getItem(k);
                if(v) { try { localData[k] = JSON.parse(v); } catch(e) { localData[k] = v; } }
            }
        }


        
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const fileName = `${source}_Backup_${now.toISOString().split('T')[0]}_${timeStr}.json`;

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
        // 🛡️ SYNC FIX: Update local timestamp to NOW so we are in sync with the file we just sent
        const finalTime = now.toISOString();
        localStorage.setItem('lastUpdated', finalTime);
        localStorage.setItem('lastGoogleSync', Date.now());
        const syncLabel = document.getElementById('last-sync-time');
        if (syncLabel) syncLabel.textContent = now.toLocaleString();
        
        if (btn) {
            btn.innerHTML = "✅ Saved!";
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
        }

    } catch (e) {
        console.error(e);
        // Show a friendly message for token/auth errors
        if (e.message && e.message.includes('expired')) {
            alert("⚠️ Google Drive session expired.\n\nPlease click the 'Reconnect Drive' button in Settings and try again.");
        } else {
            alert("Backup Failed: " + e.message);
        }
        if (btn) {
            btn.innerHTML = "❌ Error";
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 3000);
        }
    } finally {
        window.isDriveSyncInProgress = false; // 🛡️ Lower the Busy Flag
        if (btn) btn.disabled = false;
    }
}



// --- ⚡ REACTIVE SYNC (Triggered by data changes) ---
let reactiveSyncTimer = null;
window.triggerReactiveDriveSync = function() {
    const isAdmin = localStorage.getItem('isAdminUser') === 'true';
    const isDriveConnected = localStorage.getItem('isDriveConnected') === 'true';

    // 🛡️ Guard: Only queue if Admin is active, Drive is linked, and Online
    if (!isAdmin || !isDriveConnected || !navigator.onLine) return;

    // Reset the timer (Debounce)
    if (reactiveSyncTimer) clearTimeout(reactiveSyncTimer);
    
    console.log("⚡ Change detected. Google Drive backup queued (60s delay)...");
    
    reactiveSyncTimer = setTimeout(async () => {
        try {
            console.log("🚀 Reactive Auto-Sync: Commencing Drive backup...");
            const source = window.location.pathname.includes('invigilation') ? 'INVIG' : 'ADMIN';
            await syncData(source); 
        } catch (e) {
            console.warn("⚠️ Reactive Sync failed:", e.message);
        }
    }, 60 * 1000); // Wait 60 seconds after the LAST change
};


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



// --- AUTO SYNC & CONFLICT RESOLUTION ---
let autoSyncTimer = null;

window.triggerDriveAutoSync = function(isImmediate = false) {
    if (localStorage.getItem('isDriveConnected') !== 'true' || window.currentCollegeId) return;

    // 🛡️ Guard: If API is missing/expired, prompt reconnect
    if (!window.gapi || !gapi.client || !gapi.client.getToken()) {
        console.warn("Sync Blocked: Drive session expired. Reconnect needed.");
        showReconnectState();
        return;
    }

    // 🛡️ Guard: Prevent pushing if we haven't verified Cloud data yet
    if (!isReadyToPush) {
        console.warn("Sync blocked: Waiting for initial Cloud data check...");
        checkForNewerDataOnDrive(false);
        return;
    }

    const saveBtn = document.getElementById('btn-manual-push');
    const saveBtnText = document.getElementById('save-btn-text');

    if (isImmediate) {
        console.log("Manual trigger: Pushing immediately to Google Drive...");
        if (saveBtnText) saveBtnText.textContent = "Saving...";
        if (saveBtn) {
            saveBtn.classList.replace('bg-amber-500', 'bg-blue-600');
            saveBtn.classList.remove('animate-pulse');
        }
        syncDataSilent();
    } else {
        // Change button to Amber to notify user there are unsaved changes
        if (saveBtn) {
            if (saveBtnText) saveBtnText.textContent = "Save Changes Now";
            saveBtn.classList.replace('bg-gray-700', 'bg-amber-500');
            saveBtn.classList.add('animate-pulse');
        }
    }
};

async function syncDataSilent() {
    try {
        const folderId = await getBackupFolder();
        isReadyToPush = true; // 🔓 UNLOCK: We have successfully talked to the Cloud        
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
        
        // 🛡️ [AUDIT FIX]: Include prefix for silent backups
        const isInvig = window.location.pathname.includes('invigilation');
        const prefix = isInvig ? 'INVIG_AUTO' : 'ADMIN_AUTO';
        const fileName = `${prefix}_Backup_${now.toISOString().split('T')[0]}_${timeStr}.json`;

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
        // 🛡️ SYNC FIX: Update local timestamp to NOW so we are in sync with the file we just sent
        const finalTime = now.toISOString();
        localStorage.setItem('lastUpdated', finalTime);
        localStorage.setItem('lastGoogleSync', Date.now());
        const lastSyncElem = document.getElementById('last-sync-time');
        if(lastSyncElem) lastSyncElem.textContent = now.toLocaleString();

        // Reset Button to Neutral
        const saveBtn = document.getElementById('btn-manual-push');
        const saveBtnText = document.getElementById('save-btn-text');
        if (saveBtn) {
            if (saveBtnText) saveBtnText.textContent = "Cloud Saved: " + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            saveBtn.classList.remove('bg-amber-500', 'bg-blue-600', 'animate-pulse');
            saveBtn.classList.add('bg-gray-700');
        }

        console.log("Manual Sync Complete.");
    } catch(e) {
        console.error("Silent Auto-Sync failed:", e);
    }
}

// Global pointers for the ribbon to call
window.executeDriveRestore = null;
window.checkForNewerDataOnDrive = checkForNewerDataOnDrive;

async function checkForNewerDataOnDrive(isManual = false) {
    // 🛡️ DOUBLE GUARD: Ensure Firebase users NEVER see this
    if (window.currentCollegeId || localStorage.getItem('isAdminUser') === 'true') return;

// 🛡️ API GUARD: If session is explicitly expired, prompt reconnect
    if (localStorage.getItem('isDriveConnected') === 'true' && (!window.gapi || !gapi.client || !gapi.client.getToken())) {
        console.warn("Sync Check Blocked: Drive session expired.");
        showReconnectState();
        return;
    }

    // 🛡️ API GUARD: Still loading GAPI
    if (!window.gapi || !gapi.client || !gapi.client.drive) {
        console.log("⏳ Sync Check: Waiting for Google API to initialize...");
        return;
    }

    const log = document.getElementById('drive-sync-log-ribbon');
    const originalLog = log ? log.textContent : "Linked, Click to check";
    
    if (isManual && log) log.textContent = "Checking...";

    try {
        const folderId = await getBackupFolder();
        const res = await gapi.client.drive.files.list({
            q: `('${folderId}' in parents or name contains 'Backup') and mimeType='application/json' and trashed=false`,
            orderBy: 'createdTime desc',
            fields: 'files(id, name, createdTime)',
            pageSize: 1
        });

        // 💡 FEEDBACK: If no files found at all
        if (res.result.files.length === 0) {
            isReadyToPush = true; // 🔓 UNLOCK: Cloud is empty, so we can push safely
            if (isManual && log) {
                log.textContent = "No Cloud Data Found";
                setTimeout(() => { log.textContent = originalLog; }, 3000);
            }
            return;
        }

        const latestCloudFile = res.result.files[0];
        const cloudTime = new Date(latestCloudFile.createdTime).getTime();

        const localUpdateVal = localStorage.getItem('lastUpdated');        
        let localTime = 0;
        if (localUpdateVal) {
            // Handle both ISO strings and timestamps
            localTime = isNaN(localUpdateVal) ? new Date(localUpdateVal).getTime() : parseInt(localUpdateVal);
        }

// 🛡️ NEW: Check if IndexedDB is actually empty (Total Students)
        const localStudents = await loadExamDataIDB();
        const isLocalEmpty = (!localStudents || localStudents.length === 0);

        // 💡 LOGIC:
        // 1. If local is EMPTY, Cloud ALWAYS wins (New Browser / Cleared Data).
        // 2. Otherwise, Cloud must be newer by at least 1 minute.
        const isCloudNewer = (cloudTime > localTime + 60000);

        console.log(`🔍 Sync Check: Cloud(${new Date(cloudTime).toLocaleString()}) | LocalEmpty: ${isLocalEmpty} | CloudNewer: ${isCloudNewer}`);

    if (isLocalEmpty || isCloudNewer) {
            console.log("📢 Sync Logic: Newer data found on Cloud. Prompting user.");

            // 🚨 CRITICAL PROTECTION: 
            // If browser is BLANK but Cloud has DATA, keep the sync LOCKED 
            // until they restore or overwrite to prevent wiping the cloud.
            if (isLocalEmpty && cloudTime > 0) isReadyToPush = false;

            const mergeBtn = document.getElementById('btn-drive-merge-prompt');
            if (mergeBtn) {
                mergeBtn.classList.remove('hidden');
                window.executeDriveRestore = () => {
                    mergeBtn.classList.add('hidden');
                    window.executeRestore(latestCloudFile.id, latestCloudFile.createdTime);
                };
            }

            if (isManual && log) {
                log.textContent = "Updates Found";
                setTimeout(() => { log.textContent = originalLog; }, 3000); 
            }
        } else {
            console.log("✅ Sync Logic: Local data is up-to-date with Cloud.");
            isReadyToPush = true; // 🔓 UNLOCK: Local is the latest version

            if (isManual && log) {
                log.textContent = "Already Up to Date";
                setTimeout(() => { log.textContent = originalLog; }, 3000); 
            }
        }
    } catch(e) {
        console.error("Drive Check Failed:", e);
        if (isManual && log) {
            log.textContent = "Check Failed";
            setTimeout(() => { log.textContent = originalLog; }, 3000);     
        }
    }
}
// --- RESTORE UI ---
// --- RESTORE UI ---
window.restoreFromDrive = restoreFromDrive;
async function restoreFromDrive() {
    // 🛡️ [AUDIT FIX]: Search based on Module Context (Admin vs Invig) 
    // This ensures Pro users can still see their Admin backups while in the Dashboard.
    const isInvigModule = window.location.pathname.includes('invigilation');
    const prefix = isInvigModule ? 'INVIG_Backup' : 'ADMIN_Backup';

    if (typeof currentCollegeId !== 'undefined' && currentCollegeId && navigator.onLine) {
        if (!(await UiModal.confirm("Drive Restore", "⚠️ FIREBASE ACTIVE: Restoring will overwrite local data. Continue?"))) return;
    }

    try {
        const folderId = await getBackupFolder();
        
        // 🛡️ [LEGACY FIX]: If in Admin module, also include generic 'Backup' and 'MANUAL_Backup' files
        let query = `'${folderId}' in parents and name contains '${prefix}' and mimeType='application/json' and trashed=false`;
        if (!isInvigModule) {
            query = `'${folderId}' in parents and (name contains 'ADMIN_Backup' or name contains 'MANUAL_Backup' or name contains 'Backup_') and mimeType='application/json' and trashed=false`;
        }

        const res = await gapi.client.drive.files.list({
            q: query,
            orderBy: 'createdTime desc',
            fields: 'files(id, name, createdTime)'
        });
        if (res.result.files.length === 0) return alert(`No ${isProUser ? 'Invigilation' : 'ExamFlow'} backups found.`);
        showRestoreModal(res.result.files);
    } catch (e) { alert("Error: " + e.message); }
}

function showRestoreModal(files) {
    let listHtml = files.map((f, i) => `
        <div class="p-4 border-b hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors" 
             onclick="executeRestore('${f.id}', '${f.createdTime}')">
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

window.executeRestore = async function(fileId, cloudTime = null) {
    const modal = document.getElementById('drive-restore-modal');
    if (modal) modal.remove();

    // 1. Fetch File Content First
    let cloudData;
    try {
        const response = await gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
        cloudData = response.result;
        if (typeof cloudData === 'string') {
            try { cloudData = JSON.parse(cloudData); } 
            catch (e) { cloudData = JSON.parse(response.body); }
        }
    } catch (e) { return alert("Fetch Error: " + e.message); }

    // 2. SHOW CUSTOM UI MODAL with Text Confirmation
    const promptModal = document.createElement('div');
    promptModal.id = "drive-restore-prompt";
    promptModal.className = "fixed inset-0 bg-black bg-opacity-80 backdrop-blur-md flex items-center justify-center z-[200]";
    promptModal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl p-7 w-[28rem] border border-gray-100 animate-fadeIn text-center">
            <div class="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h3 class="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Confirm Data Restore</h3>
            <p class="text-xs text-gray-500 mb-6 leading-relaxed px-4">
                You are about to bring cloud data into this browser. This <span class="text-red-600 font-bold">overwrites local changes</span> and cannot be undone.
            </p>

            <div class="mb-6">
                <label class="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest text-left ml-1">Type <span class="text-gray-900">OVERWRITE</span> to enable</label>
                <input type="text" id="restore-confirm-text" 
                       placeholder="Type here..." 
                       class="w-full p-3 border-2 border-gray-100 rounded-xl text-center font-bold text-sm focus:border-blue-500 outline-none transition-all uppercase">
            </div>

            <div class="space-y-3">
                <button id="restore-merge" disabled class="w-full p-4 rounded-xl border-2 border-emerald-50 text-left opacity-30 cursor-not-allowed transition-all group">
                    <div class="font-bold text-emerald-800">🧩 Smart Merge</div>
                    <div class="text-[10px] text-emerald-600 opacity-80">Add only missing data (Safest).</div>
                </button>

                <button id="restore-replace" disabled class="w-full p-4 rounded-xl border-2 border-red-50 text-left opacity-30 cursor-not-allowed transition-all group">
                    <div class="font-bold text-red-800">🔥 Full Overwrite</div>
                    <div class="text-[10px] text-red-600 opacity-80">Wipe and replace everything.</div>
                </button>

                <button id="restore-cancel" class="w-full py-2 text-[10px] font-black text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-[0.2em] mt-2">
                    Cancel (Do Nothing)
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(promptModal);

    // Interaction Logic: Enable buttons only when "OVERWRITE" is typed
    const input = document.getElementById('restore-confirm-text');
    const mergeBtn = document.getElementById('restore-merge');
    const replaceBtn = document.getElementById('restore-replace');

    input.addEventListener('input', (e) => {
        const isValid = e.target.value.trim().toUpperCase() === "OVERWRITE";
        [mergeBtn, replaceBtn].forEach(btn => {
            btn.disabled = !isValid;
            btn.style.opacity = isValid ? "1" : "0.3";
            btn.style.cursor = isValid ? "pointer" : "not-allowed";
            if(isValid) {
               btn.classList.add('hover:shadow-md', 'active:scale-[0.98]');
            } else {
               btn.classList.remove('hover:shadow-md', 'active:scale-[0.98]');
            }
        });
    });

    return new Promise((resolve) => {
        document.getElementById('restore-cancel').onclick = () => { promptModal.remove(); resolve(); };
        mergeBtn.onclick = async () => { promptModal.remove(); await processRestore(cloudData, true, cloudTime); resolve(); };
        replaceBtn.onclick = async () => { promptModal.remove(); await processRestore(cloudData, false, cloudTime); resolve(); };
    });
};

async function processRestore(cloudData, isMerge, cloudTime = null) {
    if (!cloudData || typeof cloudData !== 'object') {
        return alert("Execution Error: Invalid or empty backup data received.");
    }

    window.isDriveRestoringData = true; // 🛡️ STRICT SEPARATION: Only affects Drive. Stops auto-sync loops.

    try {
        // --- 1. CLEANUP ---
        if (!isMerge) {
            // SAFE WIPE: Preserve Drive Connection & Key Settings
            const whitelist = ['isDriveConnected', 'drive_access_token', 'drive_token_expiry', 'lastGoogleSync', 'currentCollegeId', 'isAdminUser'];
            const saved = {};
            whitelist.forEach(k => { const v = localStorage.getItem(k); if(v) saved[k] = v; });

            localStorage.clear();

            // Restore Whitelisted Keys
            Object.keys(saved).forEach(k => localStorage.setItem(k, saved[k]));

            // 🛡️ FIX: Only wipe IndexedDB if the backup actually contains student data.
            // (Prevents INVIG backups from wiping ExamFlow data)
            if (cloudData.hasOwnProperty('examBaseData')) {
                await saveExamDataIDB([]);
            }
        }

        // --- 2. DATA IMPORT ---
        for (const key of Object.keys(cloudData)) {
            if (DATA_KEYS.includes(key)) {
                const val = cloudData[key];
                if (val === null || val === undefined) continue; 

                if (key === 'examBaseData') {
                    if (!Array.isArray(val)) continue; // Safety check
                    if (isMerge) {
                        const existingData = await loadExamDataIDB() || [];
                        const getRowKey = r => `${r.Date || ""} | ${r.Time || ""} | ${r['Register Number'] || ""} | ${r.Stream || "REGULAR"}`.toUpperCase();
                        const existingKeys = new Set(existingData.map(getRowKey));
                        const newUniqueData = val.filter(student => !existingKeys.has(getRowKey(student)));
                        await saveExamDataIDB([...existingData, ...newUniqueData]);
                    } else {
                        await saveExamDataIDB(val);
                    }
                } else {
                    // CONFIG DATA (Staff, Rooms, Settings):
                    // Even in Merge mode, we treat Cloud as the "Truth" for these small files
                    const stringVal = (typeof val === 'object') ? JSON.stringify(val) : val;
                    localStorage.setItem(key, stringVal);
                }
            }
        }

        // --- 3. FINALIZE ---
        if (cloudTime) {
            // 🛡️ SYNC: Update local timestamp to match the Cloud file we just took
            localStorage.setItem('lastUpdated', cloudTime);
        }

        localStorage.removeItem('examBaseData'); // Clean ghost legacy key
        localStorage.setItem('pendingDriveRestoreSync', 'true');

        window.isDriveRestoringData = false;
        alert("✅ Restored successfully! Reloading to apply changes.");
        location.reload();

    } catch (e) { 
        window.isDriveRestoringData = false;
        alert("Execution Error: " + e.message); 
    }

}

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
            const originalText = btn ? btn.innerHTML : '';

            for (let i = 0; i < uniqueDates.length; i++) {
                const dateKey = uniqueDates[i];
                if (dateKey === "Unknown_Date") continue; // Skip bad data

                if (btn) btn.innerHTML = `Uploading: ${i + 1} / ${uniqueDates.length}...`;
                
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

            if (btn) btn.innerHTML = originalText;
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


