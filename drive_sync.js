/* drive_sync.js - Google Drive Sync Logic */
const CLIENT_ID = '1097009779148-nkdd0ovfphsdo4uj9a6bbu09fnsd607j.apps.googleusercontent.com'; // <--- PASTE YOUR CLIENT ID
const API_KEY = 'YOUR_OPTIONAL_API_KEY'; // (Optional for Drive API, mostly needed for Discovery)
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
let tokenClient;
let gapiInited = false;
let gisInited = false;
let driveFileId = null; // ID of examflow_backup.json
const DATA_KEYS = [
    'examRoomConfig', 'examStreamsConfig', 'examCollegeName', 
    'examAbsenteeList', 'examQPCodes', 'examBaseData', 
    'examRoomAllotment', 'examScribeList', 'examScribeAllotment', 
    'examRulesConfig', 'examInvigilationSlots', 'examStaffData', 
    'examInvigilatorMapping'
];
/**
 * 1. Initialize Google Identity Services
 */
function gapiLoaded() {
    gapi.load('client', intializeGapiClient);
}
async function intializeGapiClient() {
    await gapi.client.init({
        // apiKey: API_KEY, // Optional
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    checkAuth();
}
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later look at requestAccessToken
    });
    gisInited = true;
    checkAuth();
}
function checkAuth() {
    if (gapiInited && gisInited) {
        document.getElementById('btn-connect-drive').classList.remove('hidden');
    }
}
/**
 * 2. Connect (Login)
 */
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error) throw resp;
        document.getElementById('btn-connect-drive').innerHTML = "✅ Connected to Drive";
        document.getElementById('drive-controls').classList.remove('hidden');
        await findBackupFile(); // Check if file exists
    };
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}
/**
 * 3. Find Existing Backup File
 */
async function findBackupFile() {
    try {
        const response = await gapi.client.drive.files.list({
            q: "name = 'examflow_backup.json' and trashed = false",
            fields: 'files(id, name, modifiedTime)',
        });
        const files = response.result.files;
        if (files && files.length > 0) {
            driveFileId = files[0].id;
            console.log('Found Backup:', files[0]);
            document.getElementById('last-sync-time').textContent = new Date(files[0].modifiedTime).toLocaleString();
        } else {
            console.log('No backup found. A new one will be created on Sync.');
            driveFileId = null;
        }
    } catch (err) {
        console.error('Error finding file:', err);
    }
}
/**
 * 4. SYNC LOGIC (The Core Request)
 */
async function syncData() {
    const btn = document.getElementById('btn-manual-sync');
    btn.innerHTML = "⏳ Syncing...";
    btn.disabled = true;
    try {
        // A. Prepare Local Data
        const localData = {};
        DATA_KEYS.forEach(key => {
            const val = localStorage.getItem(key);
            if (val) localData[key] = JSON.parse(val);
        });
        const blob = new Blob([JSON.stringify(localData)], { type: 'application/json' });
        // B. Check Cloud Version
        let cloudIsNewer = false;
        if (driveFileId) {
            const fileMeta = await gapi.client.drive.files.get({
                fileId: driveFileId,
                fields: 'modifiedTime'
            });
            const cloudTime = new Date(fileMeta.result.modifiedTime).getTime();
            const localTimeStr = localStorage.getItem('lastGoogleSync');
            const localTime = localTimeStr ? parseInt(localTimeStr) : 0;
            
            // Simple logic: If Cloud is > 1 min newer than last sync, ask user
            // (Or just implement "Cloud Wins" or "Local Wins" buttons)
            // Here we assume "Push" (Overwrite Cloud) for simplicity unless implemented as a merge.
            // But per request: "Sync latest data".
            
            // DOWNLOAD to compare?
            // Real sync is complex. Let's do: Download -> Compare -> Ask.
            // For now, we'll implement "Push" (Save to Drive) and "Pull" (Restore).
            // This button will be "Push".
        }
        // C. Upload (Update or Create)
        const metadata = {
            'name': 'examflow_backup.json',
            'mimeType': 'application/json'
        };
        const func = driveFileId ? updateFile : createFile;
        await func(driveFileId, metadata, blob);
        localStorage.setItem('lastGoogleSync', Date.now());
        btn.innerHTML = "🔄 Sync Now";
        alert("✅ Data Saved to Google Drive!");
        await findBackupFile(); // Refresh time
    } catch (err) {
        console.error("Sync Error:", err);
        alert("Sync Failed: " + err.message);
        btn.innerHTML = "🔄 Sync Now";
    }
    btn.disabled = false;
}
// Helper: Multipart Upload
async function createFile(id, metadata, blob) {
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
// Helper: Update Existing File
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
/**
 * 5. RESTORE (Pull from Cloud)
 */
async function restoreFromDrive() {
    if (!driveFileId) return alert("No backup found in Drive.");
    if (!confirm("This will OVERWRITE all local data with the version from Google Drive. Continue?")) return;
    try {
        const response = await gapi.client.drive.files.get({
            fileId: driveFileId,
            alt: 'media'
        });
        const cloudData = response.result;
        
        // Restore Keys
        Object.keys(cloudData).forEach(key => {
            if (DATA_KEYS.includes(key)) {
                localStorage.setItem(key, JSON.stringify(cloudData[key]));
            }
        });
        
        alert("✅ Data Restored! Reloading...");
        location.reload();
        
    } catch (err) {
        console.error(err);
        alert("Restore failed.");
    }
}
