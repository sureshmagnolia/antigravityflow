/* drive_sync.js - Persistent Google Drive Sync */

const CLIENT_ID = '1097009779148-nkdd0ovfphsdo4uj9a6bbu09fnsd607j.apps.googleusercontent.com'; 
const API_KEY = ''; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let driveFileId = null;

// Complete Data Keys
const DATA_KEYS = [
    'examRoomConfig', 'examStreamsConfig', 'examCollegeName', 
    'examAbsenteeList', 'examQPCodes', 'examBaseData', 
    'examRoomAllotment', 'examScribeList', 'examScribeAllotment', 
    'examRulesConfig', 'examInvigilationSlots', 'examStaffData', 
    'examInvigilatorMapping', 'invigAdvanceUnavailability',
    'examSessionNames', 'examRemunerationConfig'
];

// 1. Initialize Google API Client (GAPI)
function gapiLoaded() {
    gapi.load('client', intializeGapiClient);
}

async function intializeGapiClient() {
    await gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
    gapiInited = true;
    checkAuth();
}

// 2. Initialize Google Identity Services (GIS)
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // Set dynamically
    });
    gisInited = true;
    checkAuth();
}

// 3. Check Auth & Auto-Reconnect
function checkAuth() {
    if (gapiInited && gisInited) {
        const btn = document.getElementById('btn-connect-drive');
        if (btn) btn.classList.remove('hidden');

        // AUTO-CONNECT if previously connected
        if (localStorage.getItem('isDriveConnected') === 'true') {
            restoreSession();
        }
    }
}

function restoreSession() {
    tokenClient.callback = async (resp) => {
        if (resp.error) {
            console.warn("Silent auth failed", resp);
            localStorage.removeItem('isDriveConnected'); // Reset if invalid
            return;
        }
        showConnectedState();
        await findBackupFile();
    };
    // Prompt: '' allows silent auth if consent exists
    tokenClient.requestAccessToken({ prompt: '' });
}

// 4. Manual Connect / Disconnect Toggle
function handleAuthClick() {
    const isConnected = localStorage.getItem('isDriveConnected') === 'true';

    if (isConnected) {
        // DISCONNECT LOGIC
        const token = gapi.client.getToken();
        if (token) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken(null);
        }
        localStorage.removeItem('isDriveConnected');
        document.getElementById('btn-connect-drive').innerHTML = "🔗 Connect Google Drive";
        document.getElementById('btn-connect-drive').classList.remove('bg-green-600', 'hover:bg-green-700');
        document.getElementById('btn-connect-drive').classList.add('bg-blue-600', 'hover:bg-blue-700');
        document.getElementById('drive-controls').classList.add('hidden');
        document.getElementById('last-sync-time').textContent = "Not Synced";
    } else {
        // CONNECT LOGIC
        tokenClient.callback = async (resp) => {
            if (resp.error) throw resp;
            localStorage.setItem('isDriveConnected', 'true');
            showConnectedState();
            await findBackupFile(); 
        };
        // Prompt 'consent' forces layout to ensure refresh token logic works if needed
        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    }
}

function showConnectedState() {
    const btn = document.getElementById('btn-connect-drive');
    btn.innerHTML = "❌ Disconnect Drive";
    btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
    btn.classList.add('bg-green-600', 'hover:bg-green-700');
    document.getElementById('drive-controls').classList.remove('hidden');
}

// 5. Find Existing Backup
async function findBackupFile() {
    try {
        const response = await gapi.client.drive.files.list({
            q: "name = 'examflow_backup.json' and trashed = false",
            fields: 'files(id, name, modifiedTime)',
        });
        const files = response.result.files;
        if (files && files.length > 0) {
            driveFileId = files[0].id;
            const lastMod = new Date(files[0].modifiedTime).toLocaleString();
            document.getElementById('last-sync-time').textContent = lastMod;
        } else {
            driveFileId = null;
            document.getElementById('last-sync-time').textContent = "No backup found";
        }
    } catch (err) {
        console.error('Error finding file:', err);
    }
}

// 6. SYNC DATA (Upload)
async function syncData() {
    const btn = document.getElementById('btn-manual-sync');
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Syncing...";
    btn.disabled = true;

    try {
        const localData = {};
        DATA_KEYS.forEach(key => {
            const val = localStorage.getItem(key);
            if (val) {
                try { localData[key] = JSON.parse(val); } 
                catch (e) { localData[key] = val; }
            }
        });
        
        const blob = new Blob([JSON.stringify(localData, null, 2)], { type: 'application/json' });
        const metadata = { 'name': 'examflow_backup.json', 'mimeType': 'application/json' };

        if (driveFileId) {
            await updateFile(driveFileId, metadata, blob);
        } else {
            await createFile(metadata, blob);
        }

        localStorage.setItem('lastGoogleSync', Date.now());
        btn.innerHTML = "✅ Sync Complete";
        setTimeout(() => btn.innerHTML = originalText, 3000);
        alert("✅ Backup Successful!");
        await findBackupFile(); 

    } catch (err) {
        console.error("Sync Error:", err);
        alert("Sync Failed: " + err.message);
        btn.innerHTML = "❌ Failed";
        setTimeout(() => btn.innerHTML = originalText, 3000);
    }
    btn.disabled = false;
}

// Upload Helpers
async function createFile(metadata, blob) {
    const accessToken = gapi.client.getToken().access_token;
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form
    });
    const val = await res.json();
    driveFileId = val.id;
}

async function updateFile(id, metadata, blob) {
    const accessToken = gapi.client.getToken().access_token;
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify({ mimeType: 'application/json' })], { type: 'application/json' }));
    form.append('file', blob);

    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=multipart`, {
        method: 'PATCH',
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form
    });
}

// 7. RESTORE DATA
async function restoreFromDrive() {
    if (!driveFileId) return alert("No backup found in Drive.");
    if (!confirm("⚠️ OVERWRITE WARNING\n\nThis will replace all local data with the Drive backup.\nAre you sure?")) return;

    try {
        const response = await gapi.client.drive.files.get({
            fileId: driveFileId,
            alt: 'media'
        });
        const cloudData = response.result;
        
        Object.keys(cloudData).forEach(key => {
            if (DATA_KEYS.includes(key)) {
                const val = cloudData[key];
                if (typeof val === 'object') {
                   localStorage.setItem(key, JSON.stringify(val));
                } else {
                   localStorage.setItem(key, val);
                }
            }
        });
        
        alert("✅ Restore Complete! Reloading...");
        location.reload();
        
    } catch (err) {
        console.error(err);
        alert("Restore failed: " + err.message);
    }
}
