/* drive_sync.js - Versioned Backups (Last 5) */

const CLIENT_ID = '1097009779148-nkdd0ovfphsdo4uj9a6bbu09fnsd607j.apps.googleusercontent.com'; 
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let backupFolderId = null;

// Complete Data Keys
const DATA_KEYS = [
    'examRoomConfig', 'examStreamsConfig', 'examCollegeName', 
    'examAbsenteeList', 'examQPCodes', 'examBaseData', 
    'examRoomAllotment', 'examScribeList', 'examScribeAllotment', 
    'examRulesConfig', 'examInvigilationSlots', 'examStaffData', 
    'examInvigilatorMapping', 'invigAdvanceUnavailability',
    'examSessionNames', 'examRemunerationConfig'
];

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
        if (localStorage.getItem('isDriveConnected') === 'true') restoreSession();
    }
}

function restoreSession() {
    tokenClient.callback = async (resp) => {
        if (resp.error) localStorage.removeItem('isDriveConnected');
        else showConnectedState();
    };
    tokenClient.requestAccessToken({ prompt: '' });
}

// --- AUTH HANDLERS ---
function handleAuthClick() {
    if (localStorage.getItem('isDriveConnected') === 'true') {
        const token = gapi.client.getToken();
        if (token) google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken(null);
        localStorage.removeItem('isDriveConnected');
        document.getElementById('drive-controls').classList.add('hidden');
        const btn = document.getElementById('btn-connect-drive');
        btn.innerHTML = "🔗 Connect Google Drive";
        btn.classList.replace('bg-green-600', 'bg-blue-600');
        btn.classList.replace('hover:bg-green-700', 'hover:bg-blue-700');
    } else {
        tokenClient.callback = async (resp) => {
            if (resp.error) throw resp;
            localStorage.setItem('isDriveConnected', 'true');
            showConnectedState();
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
}

function showConnectedState() {
    const btn = document.getElementById('btn-connect-drive');
    btn.innerHTML = "❌ Disconnect Drive";
    btn.classList.replace('bg-blue-600', 'bg-green-600');
    btn.classList.replace('hover:bg-blue-700', 'hover:bg-green-700');
    document.getElementById('drive-controls').classList.remove('hidden');
}

// --- FOLDER & SYNC LOGIC ---

async function getBackupFolder() {
    // 1. Check if folder exists
    const q = "mimeType='application/vnd.google-apps.folder' and name='ExamFlow_Backups' and trashed=false";
    const res = await gapi.client.drive.files.list({ q: q, fields: 'files(id)' });
    
    if (res.result.files.length > 0) {
        return res.result.files[0].id;
    } else {
        // 2. Create if missing
        const meta = {
            'name': 'ExamFlow_Backups',
            'mimeType': 'application/vnd.google-apps.folder'
        };
        const createRes = await gapi.client.drive.files.create({ resource: meta, fields: 'id' });
        return createRes.result.id;
    }
}

async function syncData() {
    const btn = document.getElementById('btn-manual-sync');
    const originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Saving...";
    btn.disabled = true;

    try {
        // 1. Get Folder
        const folderId = await getBackupFolder();

        // 2. Prepare Payload
        const localData = {};
        DATA_KEYS.forEach(k => {
            const v = localStorage.getItem(k);
            if(v) {
                try { localData[k] = JSON.parse(v); } catch(e) { localData[k] = v; }
            }
        });
        const content = JSON.stringify(localData, null, 2);
        const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        
        // 3. Upload New File
        const fileMeta = {
            'name': fileName,
            'parents': [folderId]
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(fileMeta)], { type: 'application/json' }));
        form.append('file', new Blob([content], { type: 'application/json' }));

        const accessToken = gapi.client.getToken().access_token;
        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: form
        });

        // 4. Cleanup Old Files (Keep 5)
        await manageRetention(folderId);

        localStorage.setItem('lastGoogleSync', Date.now());
        document.getElementById('last-sync-time').textContent = new Date().toLocaleString();
        
        btn.innerHTML = "✅ Saved!";
        setTimeout(() => btn.innerHTML = originalText, 2000);
        
    } catch (e) {
        console.error(e);
        alert("Backup Failed: " + e.message);
        btn.innerHTML = "❌ Error";
        setTimeout(() => btn.innerHTML = originalText, 2000);
    }
    btn.disabled = false;
}

async function manageRetention(folderId) {
    // List all backup files in folder, sorted by createdTime
    const q = `'${folderId}' in parents and trashed=false`;
    const res = await gapi.client.drive.files.list({
        q: q,
        orderBy: 'createdTime desc',
        fields: 'files(id, name, createdTime)'
    });
    
    const files = res.result.files;
    if (files.length > 5) {
        // Delete extras
        const toDelete = files.slice(5);
        for (const f of toDelete) {
            await gapi.client.drive.files.delete({ fileId: f.id });
        }
    }
}

// --- RESTORE UI & LOGIC ---

async function restoreFromDrive() {
    // 1. Firebase Conflict Check
    if (typeof currentCollegeId !== 'undefined' && currentCollegeId && navigator.onLine) {
        const proceed = confirm(
            "⚠️ FIREBASE SYNC ACTIVE ⚠️\n\n" +
            "You are currently connected to the live database.\n" +
            "Restoring a backup will OVERWRITE your local data and may conflict with the cloud.\n\n" +
            "Are you sure you want to proceed?"
        );
        if (!proceed) return;
    }

    try {
        const folderId = await getBackupFolder();
        const q = `'${folderId}' in parents and trashed=false`;
        const res = await gapi.client.drive.files.list({
            q: q,
            orderBy: 'createdTime desc',
            fields: 'files(id, name, createdTime)'
        });
        
        const files = res.result.files;
        if (files.length === 0) return alert("No backups found.");

        // Show Selection UI
        showRestoreModal(files);

    } catch (e) {
        alert("Error fetching backups: " + e.message);
    }
}

function showRestoreModal(files) {
    // Basic Modal HTML injection
    let listHtml = files.map(f => `
        <div class="p-3 border-b hover:bg-gray-100 cursor-pointer flex justify-between items-center" 
             onclick="executeRestore('${f.id}')">
            <div>
                <div class="font-bold text-sm">${f.name}</div>
                <div class="text-xs text-gray-500">${new Date(f.createdTime).toLocaleString()}</div>
            </div>
            <button class="bg-blue-500 text-white px-3 py-1 rounded text-xs">Restore</button>
        </div>
    `).join('');

    const modal = document.createElement('div');
    modal.id = "drive-restore-modal";
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] overflow-hidden flex flex-col">
            <div class="p-4 bg-gray-100 border-b flex justify-between items-center">
                <h3 class="font-bold">Select Version to Restore</h3>
                <button onclick="document.getElementById('drive-restore-modal').remove()" class="text-xl">&times;</button>
            </div>
            <div class="overflow-y-auto flex-1">
                ${listHtml}
            </div>
            <div class="p-2 text-center text-xs text-gray-400 border-t">
                Displaying last ${files.length} backups
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

window.executeRestore = async function(fileId) {
    document.getElementById('drive-restore-modal').remove();
    
    if(!confirm("Are you sure you want to restore this version?")) return;

    try {
        const response = await gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
        const cloudData = response.result;

        Object.keys(cloudData).forEach(key => {
            if (DATA_KEYS.includes(key)) {
                const val = cloudData[key];
                if (typeof val === 'object') localStorage.setItem(key, JSON.stringify(val));
                else localStorage.setItem(key, val);
            }
        });

        alert("✅ Restored logic applied! Reloading...");
        location.reload();

    } catch (e) {
        alert("Restore Error: " + e.message);
    }
};
