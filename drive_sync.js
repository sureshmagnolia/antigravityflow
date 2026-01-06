/* drive_sync.js - Robust Persistence & Folders */

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

// --- INITIALIZATION ---
function gapiLoaded() { gapi.load('client', intializeGapiClient); }
async function intializeGapiClient() {
    await gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
    gapiInited = true;
    checkAuth();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, focus: false, scope: SCOPES, callback: '', // Dynamic callback
    });
    gisInited = true;
    checkAuth();
}

function checkAuth() {
    if (gapiInited && gisInited) {
        document.getElementById('btn-connect-drive').classList.remove('hidden');
        if (localStorage.getItem('isDriveConnected') === 'true') {
            console.log("Found Drive flag, attempting release...");
            restoreSession();
        }
    }
}

function restoreSession() {
    // 1. Define Callback for Silent Auth
    tokenClient.callback = async (resp) => {
        if (resp.error) {
            console.warn("Silent auth failed:", resp);
            localStorage.removeItem('isDriveConnected');
        } else {
            console.log("Silent auth success!");
            // CRITICAL FIX: Tell GAPI about the new token
            if (resp.access_token) gapi.client.setToken(resp);
            showConnectedState();
        }
    };
    // 2. Request Token Silently
    tokenClient.requestAccessToken({ prompt: '' });
}

// --- AUTH HANDLERS ---
function handleAuthClick() {
    const isConnected = localStorage.getItem('isDriveConnected') === 'true';

    if (isConnected) {
        // DISCONNECT
        const token = gapi.client.getToken();
        if (token) google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken(null);
        localStorage.removeItem('isDriveConnected');
        
        // Reset UI
        document.getElementById('drive-controls').classList.add('hidden');
        document.getElementById('last-sync-time').textContent = "";
        const btn = document.getElementById('btn-connect-drive');
        btn.innerHTML = "🔗 Connect Google Drive";
        btn.classList.remove('bg-green-600', 'hover:bg-green-700');
        btn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        
    } else {
        // CONNECT
        tokenClient.callback = async (resp) => {
            if (resp.error) throw resp;
            // CRITICAL FIX: Set Token Here too
            if (resp.access_token) gapi.client.setToken(resp);
            
            localStorage.setItem('isDriveConnected', 'true');
            showConnectedState();
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
}

function showConnectedState() {
    const btn = document.getElementById('btn-connect-drive');
    btn.innerHTML = "❌ Disconnect Drive";
    btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
    btn.classList.add('bg-green-600', 'hover:bg-green-700');
    document.getElementById('drive-controls').classList.remove('hidden');
    // Also try to find backup info to show stats
    findLatestBackupTime(); 
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
            const last = new Date(res.result.files[0].createdTime).toLocaleString();
            document.getElementById('last-sync-time').textContent = last;
        } else {
            document.getElementById('last-sync-time').textContent = "No backups yet";
        }
    } catch(e) { console.error(e); }
}

// --- FOLDER & SYNC LOGIC ---

async function getBackupFolder() {
    const q = "mimeType='application/vnd.google-apps.folder' and name='ExamFlow_Backups' and trashed=false";
    const res = await gapi.client.drive.files.list({ q: q, fields: 'files(id)' });
    
    if (res.result.files.length > 0) {
        return res.result.files[0].id;
    } else {
        const meta = { 'name': 'ExamFlow_Backups', 'mimeType': 'application/vnd.google-apps.folder' };
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
        const folderId = await getBackupFolder();

        const localData = {};
        DATA_KEYS.forEach(k => {
            const v = localStorage.getItem(k);
            if(v) { try { localData[k] = JSON.parse(v); } catch(e) { localData[k] = v; } }
        });
        const content = JSON.stringify(localData, null, 2);
        // Format: YYYY-MM-DD_HH-mm-ss
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        const fileName = `Backup_${dateStr}_${timeStr}.json`;
        
        const fileMeta = { 'name': fileName, 'parents': [folderId] };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(fileMeta)], { type: 'application/json' }));
        form.append('file', new Blob([content], { type: 'application/json' }));

        const accessToken = gapi.client.getToken().access_token;
        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: form
        });

        await manageRetention(folderId);

        localStorage.setItem('lastGoogleSync', Date.now());
        document.getElementById('last-sync-time').textContent = now.toLocaleString();
        
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
    const q = `'${folderId}' in parents and trashed=false`;
    const res = await gapi.client.drive.files.list({
        q: q,
        orderBy: 'createdTime desc',
        fields: 'files(id)', // Only need ID to delete
    });
    
    const files = res.result.files;
    if (files.length > 5) {
        const toDelete = files.slice(5);
        for (const f of toDelete) {
            await gapi.client.drive.files.delete({ fileId: f.id });
        }
    }
}

// --- RESTORE UI ---

async function restoreFromDrive() {
    // Firebase Check
    if (typeof currentCollegeId !== 'undefined' && currentCollegeId && navigator.onLine) {
        const proceed = confirm("⚠️ FIREBASE ACTIVE: Restoring will overwrite local data. Continue?");
        if (!proceed) return;
    }

    try {
        const folderId = await getBackupFolder();
        const res = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            orderBy: 'createdTime desc',
            fields: 'files(id, name, createdTime)'
        });
        
        const files = res.result.files;
        if (files.length === 0) return alert("No backups found.");
        showRestoreModal(files);

    } catch (e) {
        alert("Error fetching backups: " + e.message);
    }
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
        Object.keys(cloudData).forEach(key => {
            if (DATA_KEYS.includes(key)) {
                const val = cloudData[key];
                if (typeof val === 'object') localStorage.setItem(key, JSON.stringify(val));
                else localStorage.setItem(key, val);
            }
        });
        alert("✅ Restored successfully! Reloading...");
        location.reload();
    } catch (e) { alert("Restore Error: " + e.message); }
};

// Add fade-in animation style
const style = document.createElement('style');
style.innerHTML = `@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-fadeIn { animation: fadeIn 0.2s ease-out; }`;
document.head.appendChild(style);
