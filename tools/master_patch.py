import sys

def patch():
    with open('app.js', 'r', encoding='utf-8') as f:
        app = f.read()

    app = app.replace('\r\n', '\n')

    # Phase 1: Dates
    app = app.replace(".toISOString().split('T')[0]", "getIsoDateLocal()")
    app = app.replace(".toISOString().slice(0, 10)", "getIsoDateLocal()")

    # Phase 2 - Block 1: autoCleanPastGhostData (Cloud sync override)
    t1 = """        // Call the external cloud sync hook if available (Pro users)
        if (typeof syncDataToCloud === 'function') {
            await syncDataToCloud('slots', "FORCE_OVERWRITE"); 
        }"""
    r1 = """        // Call the external cloud sync hook if available (Pro users)
        if (typeof syncDataToCloud === 'function') {
            await syncDataToCloud('slots', "FORCE_OVERWRITE"); 
        }

        // 🛡️ [AUDIT FIX]: Use the authoritative sharded sync instead of the deprecated legacy sync
        // to permanently delete expired slots from the cloud shards.
        if (deletedSlotIds.length > 0 && typeof window.deleteSlotsFromCloud === 'function') {
            window.deleteSlotsFromCloud(deletedSlotIds).catch(e => console.warn(`Failed to sync cleaned slots:`, e));
        }"""
    app = app.replace(t1, r1)

    # Phase 2 - Block 2: executeBulkDelete (Cloud Sync Override + IDB Cleanup)
    t2_idx = app.find("window.executeBulkDelete = async function() {")
    if t2_idx != -1:
        # Part A: Cloud Sync
        t2a = """            // This prevents stale data from re-poisoning the local database on refresh.
            await syncDataToCloud('baseData');
        }"""
        r2a = """            // This prevents stale data from re-poisoning the local database on refresh.
            await syncDataToCloud('baseData');
        }

        // 🛡️ [SHARD SYNC FIX]: Push bulk-deleted slot requirements to the daily shards immediately
        // so that the next reload doesn't resurrect old slot requirements.
        if (typeof window.deleteSlotsFromCloud === 'function') {
            await window.deleteSlotsFromCloud(sessionsToDelete);
        }"""
        t2a_start = app.find(t2a, t2_idx)
        if t2a_start != -1:
            app = app[:t2a_start] + r2a + app[t2a_start + len(t2a):]

        # Part B: IDB Cleanup
        t2b = """                    if(changed) localStorage.setItem(key, JSON.stringify(data));
                }
            });
        }"""
        r2b = """                    if(changed) localStorage.setItem(key, JSON.stringify(data));
                }
            });

            // Clean up Scribe Vaults and Dirty Flags
            sessionsToDelete.forEach(async (s) => {
                const safeKey = s.replace(/\\s/g, '_');
                localStorage.removeItem('scrAllot_' + safeKey);
                localStorage.removeItem('hasUnsavedScribes_' + safeKey);
                
                // [V3 IDB UPGRADE]: Clean IDB Vault
                try {
                    const db = await openExamDB();
                    const tx = db.transaction('scribeVault', 'readwrite');
                    tx.objectStore('scribeVault').delete(s);
                } catch(e) { console.error("Bulk IDB cleanup failed", e); }
            });
        }"""
        # Search again because indices shifted
        t2_idx_new = app.find("window.executeBulkDelete = async function() {")
        t2b_start = app.find(t2b, t2_idx_new)
        if t2b_start != -1:
            app = app[:t2b_start] + r2b + app[t2b_start + len(t2b):]

    # Phase 2 - Block 3: openExamDB
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
    app = app.replace(t3, r3)

    # Phase 2 - Block 4: loadScribeAllotment
    t4 = """    // NEW FUNCTION: This loads the scribe allotment data for the session
    function loadScribeAllotment(sessionKey) {"""
    end4 = """        } else {
            scribeAllotmentListSection.classList.add('hidden');
            scribeAllotmentList.innerHTML = "";
        }
    }"""
    t4_idx = app.find(t4)
    if t4_idx != -1:
        end4_idx = app.find(end4, t4_idx)
        if end4_idx != -1:
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
            app = app[:t4_idx] + r4 + app[end4_idx + len(end4):]

    # Phase 2 - Block 5: saveScribeBtn
    t5_idx = app.find("Explicitly save to localStorage for Basic Users")
    if t5_idx != -1:
        t5_start = app.rfind("        //", 0, t5_idx)
        t5_end = app.find("        }", t5_idx) + 9
        r5 = """        // 🛡️ [PERSISTENCE FIX]: Explicitly save to localStorage for Basic Users
        if (typeof SCRIBE_ALLOTMENT_KEY !== 'undefined') {
            // 1. Try LocalStorage (Cache & Bridge) - Fail-safe
            try {
                // [VAULT UPGRADE]: Save to isolated vault
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
        app = app[:t5_start] + r5 + app[t5_end:]

    # Phase 2 - Block 6: deleteKeyInStorage
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

                    // [V3 IDB UPGRADE]: Clean up isolated vaults & IDB
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
    app = app.replace(t6, r6)

    # Phase 2 - Block 7: clearAllScribeAllotments
    t7_idx = app.find("window.clearAllScribeAllotments = function () {")
    if t7_idx != -1:
        t7_inner = app.find("        // 2. Save to Local Storage", t7_idx)
        if t7_inner != -1:
            t7_end = app.find("        hasUnsavedScribes = true;", t7_inner) + 33
            r7 = """        // [VAULT UPGRADE]: Save to session-specific vault
        const sessionKey = window.currentSessionKey || (typeof allotmentSessionSelect !== 'undefined' ? allotmentSessionSelect.value : '');
        const vaultKey = `scrAllot_` + sessionKey.replace(/\\s/g, '_');
        localStorage.setItem(vaultKey, JSON.stringify(currentScribeAllotment));

        // 2. Save back to legacy Local Storage for compatibility
        const allAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        allAllotments[sessionKey] = currentScribeAllotment;
        localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(allAllotments));
        
        // [V3 IDB UPGRADE]: Clear IDB Vault
        try {
            saveScribeAllotmentIDB(sessionKey, currentScribeAllotment);
        } catch(e) { console.error("IDB clear failed", e); }
        hasUnsavedScribes = true;
        localStorage.setItem('hasUnsavedScribes_' + sessionKey.replace(/\\s/g, '_'), 'true'); // Cross-script dirty flag"""
            app = app[:t7_inner] + r7 + app[t7_end:]

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app)
        
    print("ALL PHASE 2 PATCHES APPLIED PERFECTLY.")

if __name__ == '__main__':
    patch()
