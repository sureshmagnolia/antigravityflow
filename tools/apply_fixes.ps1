$content = Get-Content app.js -Raw -Encoding UTF8

# Phase 1: getIsoDateLocal
$content = $content -replace '\.toISOString\(\)\.split\(''T''\)\[0\]', 'getIsoDateLocal()'
$content = $content -replace '\.toISOString\(\)\.slice\(0, 10\)', 'getIsoDateLocal()'

# Phase 2: Shard Deletion Hook 1
$target1 = @"
        if (typeof syncDataToCloud === 'function') {
            // 🛡️ [AUDIT FIX]: Disabled in app.js to prevent unintended cloud wipes. 
            // Invigilation management is now authoritative within invigilation.js
            // await syncDataToCloud('slots', "FORCE_OVERWRITE"); 
        }
"@
$replacement1 = $target1 + "`r`n`r`n        // 🛡️ [AUDIT FIX]: Use the authoritative sharded sync instead of the deprecated legacy sync`r`n        // to permanently delete expired slots from the cloud shards.`r`n        if (deletedSlotIds.length > 0 && typeof window.deleteSlotsFromCloud === 'function') {`r`n            window.deleteSlotsFromCloud(deletedSlotIds).catch(e => console.warn(`"Failed to sync cleaned slots:`", e));`r`n        }"
$content = $content.Replace($target1, $replacement1)

# Phase 2: Shard Deletion Hook 2
$target2 = @"
            // This prevents stale data from re-poisoning the local database on refresh.
            await syncDataToCloud('baseData');
        }
"@
$replacement2 = $target2 + "`r`n`r`n        // 🛡️ [SHARD SYNC FIX]: Push bulk-deleted slot requirements to the daily shards immediately`r`n        // so that the next reload doesn't resurrect old slot requirements.`r`n        if (typeof window.deleteSlotsFromCloud === 'function') {`r`n            await window.deleteSlotsFromCloud(sessionsToDelete);`r`n        }"
$content = $content.Replace($target2, $replacement2)


# Phase 2: IDB Bump & Helpers
$target3 = @"
/* Bumping to version 2 to force the missing store creation */
function openExamDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(IDB_NAME, 2);
        req.onupgradeneeded = e => {
            const db = e.target.result;
            // Safe check: create the store if it doesn't exist
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                db.createObjectStore(IDB_STORE);
            }
        };
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e.target.error);
    });
}
"@
$replacement3 = @"
/* Bumping to version 3 to force the missing store creation */
function openExamDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(IDB_NAME, 3); // BUMPED TO 3
        req.onupgradeneeded = e => {
            const db = e.target.result;
            // Safe check: create the store if it doesn't exist
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                db.createObjectStore(IDB_STORE);
            }
            if (!db.objectStoreNames.contains('scribeVault')) {
                db.createObjectStore('scribeVault');
            }
        };
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e.target.error);
    });
}

// 🛡️ [V3 IDB UPGRADE]: Helpers for Scribe Isolation
window.saveScribeAllotmentIDB = async function(sessionKey, allotment) {
    try {
        const db = await openExamDB();
        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction('scribeVault', 'readwrite');
                tx.objectStore('scribeVault').put(allotment, sessionKey);
                tx.oncomplete = () => resolve(true);
                tx.onerror = e => reject(e.target.error);
            } catch (e) { reject(e); }
        });
    } catch (e) { console.warn("saveScribeAllotmentIDB failed:", e); return false; }
};

window.getScribeAllotmentIDB = async function(sessionKey) {
    try {
        const db = await openExamDB();
        return new Promise((resolve, reject) => {
            try {
                const tx = db.transaction('scribeVault', 'readonly');
                const req = tx.objectStore('scribeVault').get(sessionKey);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            } catch (e) { resolve(null); }
        });
    } catch (e) { console.warn("getScribeAllotmentIDB failed:", e); return null; }
};
"@
$content = $content.Replace($target3, $replacement3)


# Output the fixed content
Set-Content app.js -Value $content -Encoding UTF8
