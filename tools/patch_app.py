import sys

def patch_app_js():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # --- Phase 1: getIsoDateLocal ---
    content = content.replace(".toISOString().split('T')[0]", "getIsoDateLocal()")
    content = content.replace(".toISOString().slice(0, 10)", "getIsoDateLocal()")

    # --- Phase 2: deleteSlotsFromCloud ---
    # 1. autoCleanPastGhostData
    t1 = """        if (typeof syncDataToCloud === 'function') {
            // 🛡️ [AUDIT FIX]: Disabled in app.js to prevent unintended cloud wipes. 
            // Invigilation management is now authoritative within invigilation.js
            // await syncDataToCloud('slots', "FORCE_OVERWRITE"); 
        }"""
    r1 = t1 + "\n\n        // 🛡️ [AUDIT FIX]: Use the authoritative sharded sync instead of the deprecated legacy sync\n        // to permanently delete expired slots from the cloud shards.\n        if (deletedSlotIds.length > 0 && typeof window.deleteSlotsFromCloud === 'function') {\n            window.deleteSlotsFromCloud(deletedSlotIds).catch(e => console.warn(`Failed to sync cleaned slots:`, e));\n        }"
    if t1 not in content: print("T1 not found")
    content = content.replace(t1, r1)

    # 2. executeBulkDelete (slots sync)
    t2 = """            // This prevents stale data from re-poisoning the local database on refresh.
            await syncDataToCloud('baseData');
        }"""
    r2 = t2 + "\n\n        // 🛡️ [SHARD SYNC FIX]: Push bulk-deleted slot requirements to the daily shards immediately\n        // so that the next reload doesn't resurrect old slot requirements.\n        if (typeof window.deleteSlotsFromCloud === 'function') {\n            await window.deleteSlotsFromCloud(sessionsToDelete);\n        }"
    if t2 not in content: print("T2 not found")
    content = content.replace(t2, r2)


    # --- Phase 2: IDB Bump & Helpers ---
    t3 = """/* Bumping to version 2 to force the missing store creation */
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
}"""
    r3 = """/* Bumping to version 3 to force the missing store creation */
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
};"""
    if t3 not in content: print("T3 not found")
    content = content.replace(t3, r3)


    # --- Phase 2: loadScribeAllotment IDB Sync ---
    t4 = """    // NEW FUNCTION: This loads the scribe allotment data for the session
    function loadScribeAllotment(sessionKey) {
        // *** FIX: Ensure global scribe list is loaded before checking length ***
        if (globalScribeList.length === 0) {
            globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
        }
        // **********************************************************************

        if (sessionKey && globalScribeList.length > 0) {
            // Load the allotments for this session (🛡️ [V12.8 FIX]: Prioritize V1 Manual Saves over V2 Historical context)
            const v1 = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
            const v2 = JSON.parse(localStorage.getItem('examScribeAllotmentV2') || '{}');
            
            // Unify keys: Manual Save (v1) should always win over historical data (v2)
            const allAllotments = { ...v2, ...v1 }; 
            currentScribeAllotment = allAllotments[sessionKey] || {};

            // 🛡️ [V12.8]: If we found data in V2 that isn't in V1, migrate it back to V1 for persistence
            if (v2[sessionKey] && !v1[sessionKey]) {
                v1[sessionKey] = v2[sessionKey];
                localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(v1));
            }

            scribeAllotmentListSection.classList.remove('hidden');
            renderScribeAllotmentList(sessionKey);
        } else {
            scribeAllotmentListSection.classList.add('hidden');
            if(scribeAllotmentList) scribeAllotmentList.innerHTML = "";
        }
    }"""
    r4 = """    // NEW FUNCTION: This loads the scribe allotment data for the session
    async function loadScribeAllotment(sessionKey) {
        // *** FIX: Ensure global scribe list is loaded before checking length ***
        if (globalScribeList.length === 0) {
            globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
        }
        // **********************************************************************

        if (sessionKey && globalScribeList.length > 0) {
            const vaultKey = `scrAllot_` + sessionKey.replace(/\\s/g, '_');
            const isDirty = localStorage.getItem('hasUnsavedScribes_' + sessionKey.replace(/\\s/g, '_')) === 'true';

            // 🛡️ [V3 IDB UPGRADE]: Multi-Tiered Load (Bidirectional Sync)
            // 1. Get from Legacy (The shared mirrors)
            const v1 = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
            const v2 = JSON.parse(localStorage.getItem('examScribeAllotmentV2') || '{}');
            const legacyData = v1[sessionKey] || v2[sessionKey] || null;

            // 2. Get from Private IDB (The Source of Truth)
            const dbData = await getScribeAllotmentIDB(sessionKey);

            // 3. Comparison Logic
            if (!isDirty && legacyData && JSON.stringify(legacyData) !== JSON.stringify(dbData)) {
                // External change detected (from V2 PC or Cloud Sync) -> Adoption
                console.log("🔄 V3: Adoption triggered. Syncing IDB from Legacy changes...");
                await saveScribeAllotmentIDB(sessionKey, legacyData);
                currentScribeAllotment = legacyData;
            } else {
                // Use DB if available, fallback to Legacy
                currentScribeAllotment = dbData || legacyData || {};
            }

            // Sync Local Cache (Vault) for UI speed
            try { localStorage.setItem(vaultKey, JSON.stringify(currentScribeAllotment)); } catch(e) {}

            scribeAllotmentListSection.classList.remove('hidden');
            renderScribeAllotmentList(sessionKey);
        } else {
            scribeAllotmentListSection.classList.add('hidden');
            if(scribeAllotmentList) scribeAllotmentList.innerHTML = "";
        }
    }"""
    if t4 not in content: print("T4 not found")
    content = content.replace(t4, r4)


    # --- Phase 2: saveScribeBtn logic ---
    t5 = """        // 🛡️ [PERSISTENCE FIX]: Explicitly save to localStorage for Basic Users
        if (typeof SCRIBE_ALLOTMENT_KEY !== 'undefined') {
            const allScribeAllots = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
            allScribeAllots[sessionKey] = currentScribeAllotment;
            localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(allScribeAllots));
        }"""
    r5 = """        // 🛡️ [PERSISTENCE FIX]: Explicitly save to localStorage for Basic Users
        if (typeof SCRIBE_ALLOTMENT_KEY !== 'undefined') {
            // 1. Try LocalStorage (Cache & Bridge) - Fail-safe
            try {
                // 🛡️ [VAULT UPGRADE]: Save to isolated vault
                const vaultKey = `scrAllot_` + sessionKey.replace(/\\s/g, '_');
                localStorage.setItem(vaultKey, JSON.stringify(currentScribeAllotment));

                // Legacy fallback
                const allScribeAllots = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
                allScribeAllots[sessionKey] = currentScribeAllotment;
                localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(allScribeAllots));
            } catch (e) {
                console.warn("⚠️ LocalStorage full. Bridge data not updated, but proceeding to IDB...", e);
            }

            // 2. Primary Save (IndexedDB) - AUTHORITATIVE
            try {
                await saveScribeAllotmentIDB(sessionKey, currentScribeAllotment);
            } catch (e) {
                console.error("❌ CRITICAL: IndexedDB save failed!", e);
                alert("❌ Error: Could not save to Database. Your changes may be lost.");
            }
        }"""
    if t5 not in content: print("T5 not found")
    content = content.replace(t5, r5)


    # --- Phase 2: deleteKeyInStorage (deleteSessionFromCloud helper) ---
    t6 = """                // 2. Helper to Delete Key
                const deleteKeyInStorage = (storageKey) => {
                    const raw = localStorage.getItem(storageKey);
                    if (!raw) return;
                    const data = JSON.parse(raw);
                    if (data[currentSession]) {
                        delete data[currentSession];
                        localStorage.setItem(storageKey, JSON.stringify(data));
                    }
                };

                // 3. Delete Associated Data
                deleteKeyInStorage('examRoomAllotment');
                deleteKeyInStorage('examScribeAllotment');"""
    r6 = """                // 2. Helper to Delete Key
                const deleteKeyInStorage = async (storageKey) => {
                    const raw = localStorage.getItem(storageKey);
                    if (!raw) return;
                    const data = JSON.parse(raw);
                    if (data[currentSession]) {
                        delete data[currentSession];
                        localStorage.setItem(storageKey, JSON.stringify(data));
                    }
                    
                    // 🛡️ [V3 IDB UPGRADE]: Clean up isolated vaults & IDB
                    if (storageKey === 'examScribeAllotment') {
                        const vaultKey = `scrAllot_` + currentSession.replace(/\\s/g, '_');
                        const dirtyKey = `hasUnsavedScribes_` + currentSession.replace(/\\s/g, '_');
                        localStorage.removeItem(vaultKey);
                        localStorage.removeItem(dirtyKey);
                        
                        // IDB Deletion
                        try {
                            const db = await openExamDB();
                            const tx = db.transaction('scribeVault', 'readwrite');
                            tx.objectStore('scribeVault').delete(currentSession);
                        } catch(e) { console.error("IDB Cleanup failed", e); }
                    }
                };

                // 3. Delete Associated Data
                await deleteKeyInStorage('examRoomAllotment');
                await deleteKeyInStorage('examScribeAllotment');"""
    if t6 not in content: print("T6 not found")
    content = content.replace(t6, r6)


    # --- Phase 2: executeBulkDelete (IDB Cleanup) ---
    t7 = """            auxKeys.forEach(key => {
                const raw = localStorage.getItem(key);
                if(raw) {
                    const data = JSON.parse(raw);
                    let changed = false;
                    sessionsToDelete.forEach(s => {
                        if(data[s]) { delete data[s]; changed = true; }
                    });
                    if(changed) localStorage.setItem(key, JSON.stringify(data));
                }
            });
        }"""
    r7 = """            auxKeys.forEach(key => {
                const raw = localStorage.getItem(key);
                if(raw) {
                    const data = JSON.parse(raw);
                    let changed = false;
                    sessionsToDelete.forEach(s => {
                        if(data[s]) { delete data[s]; changed = true; }
                    });
                    if(changed) localStorage.setItem(key, JSON.stringify(data));
                }
            });

            // Clean up Scribe Vaults and Dirty Flags
            sessionsToDelete.forEach(async (s) => {
                const safeKey = s.replace(/\\s/g, '_');
                localStorage.removeItem('scrAllot_' + safeKey);
                localStorage.removeItem('hasUnsavedScribes_' + safeKey);
                
                // 🛡️ [V3 IDB UPGRADE]: Clean IDB Vault
                try {
                    const db = await openExamDB();
                    const tx = db.transaction('scribeVault', 'readwrite');
                    tx.objectStore('scribeVault').delete(s);
                } catch(e) { console.error("Bulk IDB cleanup failed", e); }
            });
        }"""
    if t7 not in content: print("T7 not found")
    content = content.replace(t7, r7)


    # --- Phase 2: clearAllScribeAllotments ---
    t8 = """    window.clearAllScribeAllotments = function () {
        if (isScribeAllotmentLocked) return alert("Scribe Allotment is Locked. Unlock first to clear."); 
        
        const count = Object.keys(currentScribeAllotment).length;
        if (count === 0) return alert("No allotments to clear.");

        if (!confirm(`Are you sure you want to CLEAR ALL ${count} scribe allotments for this session? This cannot be undone.`)) return;

        // 1. Clear current session mapping
        currentScribeAllotment = {};

        // 2. Save to Local Storage
        const allAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        allAllotments[currentSessionKey] = currentScribeAllotment;
        localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(allAllotments));

        // 3. Sync & Refresh
        hasUnsavedScribes = true;
        if (typeof updateSyncStatus === 'function') {
            updateSyncStatus("Unsaved Changes", "warning");
        }
        renderScribeAllotmentList(currentSessionKey);

        alert("✅ All scribe allotments for this session have been cleared.");
    };"""
    r8 = """    window.clearAllScribeAllotments = function () {
        if (isScribeAllotmentLocked) return alert("Scribe Allotment is Locked. Unlock first to clear."); 
        
        const count = Object.keys(currentScribeAllotment).length;
        if (count === 0) return alert("No allotments to clear.");

        if (!confirm(`Are you sure you want to CLEAR ALL ${count} scribe allotments for this session? This cannot be undone.`)) return;

        // 1. Clear current session mapping
        currentScribeAllotment = {};

        // 🛡️ [VAULT UPGRADE]: Save to session-specific vault
        const sessionKey = window.currentSessionKey || (typeof allotmentSessionSelect !== 'undefined' ? allotmentSessionSelect.value : '');
        const vaultKey = `scrAllot_` + sessionKey.replace(/\\s/g, '_');
        localStorage.setItem(vaultKey, JSON.stringify(currentScribeAllotment));

        // 2. Save back to legacy Local Storage for compatibility
        const allAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        allAllotments[sessionKey] = currentScribeAllotment;
        localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(allAllotments));
        
        // 🛡️ [V3 IDB UPGRADE]: Clear IDB Vault
        try {
            saveScribeAllotmentIDB(sessionKey, currentScribeAllotment);
        } catch(e) { console.error("IDB clear failed", e); }
        hasUnsavedScribes = true;
        localStorage.setItem('hasUnsavedScribes_' + sessionKey.replace(/\\s/g, '_'), 'true'); // Cross-script dirty flag
        if (typeof updateSyncStatus === 'function') {
            updateSyncStatus("Unsaved Changes", "warning");
        }
        renderScribeAllotmentList(sessionKey);

        // Force Drive Sync for Basic Users
        if (typeof window.triggerDriveAutoSync === 'function') window.triggerDriveAutoSync(true);

        alert("✅ All scribe allotments for this session have been cleared.");
    };"""
    if t8 not in content: print("T8 not found")
    content = content.replace(t8, r8)

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print("Patch applied.")

if __name__ == '__main__':
    patch_app_js()
