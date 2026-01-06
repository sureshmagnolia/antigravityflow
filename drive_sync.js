/* drive_sync.js - Google Drive Sync Logic */

const CLIENT_ID = '1097009779148-nkdd0ovfphsdo4uj9a6bbu09fnsd607j.apps.googleusercontent.com'; 
const API_KEY = ''; // Optional
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let driveFileId = null;

const DATA_KEYS = [
    'examRoomConfig', 'examStreamsConfig', 'examCollegeName', 
    'examAbsenteeList', 'examQPCodes', 'examBaseData', 
    'examRoomAllotment', 'examScribeList', 'examScribeAllotment', 
    'examRulesConfig', 'examInvigilationSlots', 'examStaffData', 
    'examInvigilatorMapping'
];

// 1. Initialize Google API Client (GAPI)
function gapiLoaded() {
    gapi.load('client', intializeGapiClient);
}

async function intializeGapiClient() {
    await gapi.client.init({
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    checkAuth();
}

// 2. Initialize Google Identity Services (GIS)
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // Defined explicitly in handleAuthClick
    });
    gisInited = true;
    checkAuth();
}

function checkAuth() {
    if (gapiInited && gisInited) {
        const btn = document.getElementById('btn-connect-drive');
        if (btn) btn.classList.remove('hidden');
    }
}

// 3. Connect (Login)
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error) throw resp;
        document.getElementById('btn-connect-drive').innerHTML = "✅ Connected to Drive";
        document.getElementById('drive-controls').classList.remove('hidden');
        await findBackupFile(); 
    };
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// 4. Find Existing Backup
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
        }
    } catch (err) {
        console.error('Error finding file:', err);
    }
}

// 5. SYNC LOGIC (With Safety Checks)
async function syncData() {
    const btn = document.getElementById('btn-manual-sync');
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Syncing...";
    btn.disabled = true;

    try {
        // A. Prepare Local Data
        const localData = {};
        DATA_KEYS.forEach(key => {
            const val = localStorage.getItem(key);
            if (val) {
                try {
                    // Try to parse as JSON (e.g. objects, arrays)
                    localData[key] = JSON.parse(val);
                } catch (e) {
                    // Fallback: It's a raw string (e.g. College Name)
                    localData[key] = val;
                }
            }
        });
        const blob = new Blob([JSON.stringify(localData, null, 2)], { type: 'application/json' });

        // B. Upload
        const metadata = {
            'name': 'examflow_backup.json',
            'mimeType': 'application/json'
        };

        if (driveFileId) {
            await updateFile(driveFileId, metadata, blob);
        } else {
            await createFile(metadata, blob);
        }

        localStorage.setItem('lastGoogleSync', Date.now());
        btn.innerHTML = "✅ Sync Complete";
        setTimeout(() => btn.innerHTML = originalText, 3000);
        alert("✅ Data Saved to Google Drive!");
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

// 6. RESTORE (Pull from Cloud)
async function restoreFromDrive() {
    if (!driveFileId) return alert("No backup found in Drive.");
    if (!confirm("Overwrite local data with Google Drive backup?")) return;

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
        
        alert("✅ Restored! Reloading...");
        location.reload();
        
    } catch (err) {
        console.error(err);
        alert("Restore failed.");
    }
}
