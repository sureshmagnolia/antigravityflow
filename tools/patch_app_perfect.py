import sys
import re

def patch_app_js():
    with open('app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # --- Phase 1: getIsoDateLocal ---
    content = content.replace(".toISOString().split('T')[0]", "getIsoDateLocal()")
    content = content.replace(".toISOString().slice(0, 10)", "getIsoDateLocal()")

    # --- Phase 2: deleteSlotsFromCloud ---
    # 1. autoCleanPastGhostData
    content = re.sub(
        r'(\s+if \(typeof syncDataToCloud === \'function\'\) \{\s+//.*?\[AUDIT FIX\]: Disabled in app\.js.*?\s+//.*?await syncDataToCloud\(\'slots\', "FORCE_OVERWRITE"\);\s+\})',
        r'\1\n\n        // [AUDIT FIX]: Use the authoritative sharded sync instead of the deprecated legacy sync\n        // to permanently delete expired slots from the cloud shards.\n        if (deletedSlotIds.length > 0 && typeof window.deleteSlotsFromCloud === \'function\') {\n            window.deleteSlotsFromCloud(deletedSlotIds).catch(e => console.warn(`Failed to sync cleaned slots:`, e));\n        }',
        content, flags=re.DOTALL
    )

    # 2. executeBulkDelete (slots sync)
    content = re.sub(
        r'(\s+// This prevents stale data from re-poisoning the local database on refresh\.\s+await syncDataToCloud\(\'baseData\'\);\s+\})',
        r'\1\n\n        // [SHARD SYNC FIX]: Push bulk-deleted slot requirements to the daily shards immediately\n        // so that the next reload doesn\'t resurrect old slot requirements.\n        if (typeof window.deleteSlotsFromCloud === \'function\') {\n            await window.deleteSlotsFromCloud(sessionsToDelete);\n        }',
        content, flags=re.DOTALL
    )

    # --- Phase 2: IDB Bump & Helpers ---
    bump_target = r'/\* Bumping to version 2 to force the missing store creation \*/\s*function openExamDB\(\) \{\s*return new Promise\(\(resolve, reject\) => \{\s*const req = indexedDB\.open\(IDB_NAME, 2\);\s*req\.onupgradeneeded = e => \{\s*const db = e\.target\.result;\s*// Safe check: create the store if it doesn\'t exist\s*if \(!db\.objectStoreNames\.contains\(IDB_STORE\)\) \{\s*db\.createObjectStore\(IDB_STORE\);\s*\}\s*\};\s*req\.onsuccess = e => resolve\(e\.target\.result\);\s*req\.onerror = e => reject\(e\.target\.error\);\s*\}\);\s*\}'
    bump_replace = """/* Bumping to version 3 to force the missing store creation */
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

// [V3 IDB UPGRADE]: Helpers for Scribe Isolation
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
    content = re.sub(bump_target, bump_replace, content, flags=re.DOTALL)

    # --- Phase 2: loadScribeAllotment ---
    load_target = r'(\s+// NEW FUNCTION: This loads the scribe allotment data for the session\s+)function loadScribeAllotment\(sessionKey\) \{(.*?if \(sessionKey && globalScribeList\.length > 0\) \{)(.*?)(scribeAllotmentListSection\.classList\.remove\(\'hidden\'\);\s+renderScribeAllotmentList\(sessionKey\);\s+\} else \{)(.*?)(scribeAllotmentListSection\.classList\.add\(\'hidden\'\);\s+(?:if\(scribeAllotmentList\) )?scribeAllotmentList\.innerHTML = "";\s+\}\s+\})'
    
    load_inner_replace = """
            const vaultKey = `scrAllot_` + sessionKey.replace(/\\s/g, '_');
            const isDirty = localStorage.getItem('hasUnsavedScribes_' + sessionKey.replace(/\\s/g, '_')) === 'true';

            // [V3 IDB UPGRADE]: Multi-Tiered Load (Bidirectional Sync)
            // 1. Get from Legacy (The shared mirrors)
            const v1 = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
            const v2 = JSON.parse(localStorage.getItem('examScribeAllotmentV2') || '{}');
            const legacyData = v1[sessionKey] || v2[sessionKey] || null;

            // 2. Get from Private IDB (The Source of Truth)
            const dbData = await getScribeAllotmentIDB(sessionKey);

            // 3. Comparison Logic
            if (!isDirty && legacyData && JSON.stringify(legacyData) !== JSON.stringify(dbData)) {
                // External change detected (from V2 PC or Cloud Sync) -> Adoption
                console.log("ðŸ”„ V3: Adoption triggered. Syncing IDB from Legacy changes...");
                await saveScribeAllotmentIDB(sessionKey, legacyData);
                currentScribeAllotment = legacyData;
            } else {
                // Use DB if available, fallback to Legacy
                currentScribeAllotment = dbData || legacyData || {};
            }

            // Sync Local Cache (Vault) for UI speed
            try { localStorage.setItem(vaultKey, JSON.stringify(currentScribeAllotment)); } catch(e) {}

            """
    content = re.sub(load_target, r'\1async function loadScribeAllotment(sessionKey) {\2' + load_inner_replace.replace("\\\", "\\\\\\") + r'\4\5\6', content, flags=re.DOTALL)

    # --- Phase 2: saveScribeBtn ---
    save_target = r'(\s+//.*?\[PERSISTENCE FIX\]: Explicitly save to localStorage for Basic Users\s+if \(typeof SCRIBE_ALLOTMENT_KEY !== \'undefined\'\) \{\s+const allScribeAllots = JSON\.parse\(localStorage\.getItem\(SCRIBE_ALLOTMENT_KEY\) \|\| \'{}\'\);\s+allScribeAllots\[sessionKey\] = currentScribeAllotment;\s+localStorage\.setItem\(SCRIBE_ALLOTMENT_KEY, JSON\.stringify\(allScribeAllots\)\);\s+\})'
    save_replace = """        // [PERSISTENCE FIX]: Explicitly save to localStorage for Basic Users
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
                console.warn("âš ï¸ LocalStorage full. Bridge data not updated, but proceeding to IDB...", e);
            }

            // 2. Primary Save (IndexedDB) - AUTHORITATIVE
            try {
                await saveScribeAllotmentIDB(sessionKey, currentScribeAllotment);
            } catch (e) {
                console.error("âŒ CRITICAL: IndexedDB save failed!", e);
                alert("âŒ Error: Could not save to Database. Your changes may be lost.");
            }
        }"""
    content = re.sub(save_target, save_replace, content, flags=re.DOTALL)

    # --- Phase 2: deleteKeyInStorage ---
    delete_target = r'(\s+// 2\. Helper to Delete Key\s+)const deleteKeyInStorage = \(storageKey\) => \{(.*?delete data\[currentSession\];\s+localStorage\.setItem\(storageKey, JSON\.stringify\(data\)\);\s+\}\s+\};\s+// 3\. Delete Associated Data\s+)deleteKeyInStorage\(\'examRoomAllotment\'\);\s+deleteKeyInStorage\(\'examScribeAllotment\'\);'
    delete_replace = r"""\1const deleteKeyInStorage = async (storageKey) => {\2
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
    content = re.sub(delete_target, delete_replace, content, flags=re.DOTALL)

    # --- Phase 2: executeBulkDelete ---
    bulk_target = r'(\s+auxKeys\.forEach\(key => \{.*?\s+if\(changed\) localStorage\.setItem\(key, JSON\.stringify\(data\)\);\s+\}\s+\}\);\s+\})'
    bulk_replace = r"""\1

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
    # Fix the trailing } in bulk_target
    bulk_target_fix = r'(\s+auxKeys\.forEach\(key => \{.*?\s+if\(changed\) localStorage\.setItem\(key, JSON\.stringify\(data\)\);\s+\}\s+\}\);)(\s+\})'
    content = re.sub(bulk_target_fix, r'\1\n            // Clean up Scribe Vaults and Dirty Flags\n            sessionsToDelete.forEach(async (s) => {\n                const safeKey = s.replace(/\\s/g, \'_\');\n                localStorage.removeItem(\'scrAllot_\' + safeKey);\n                localStorage.removeItem(\'hasUnsavedScribes_\' + safeKey);\n                \n                // [V3 IDB UPGRADE]: Clean IDB Vault\n                try {\n                    const db = await openExamDB();\n                    const tx = db.transaction(\'scribeVault\', \'readwrite\');\n                    tx.objectStore(\'scribeVault\').delete(s);\n                } catch(e) { console.error("Bulk IDB cleanup failed", e); }\n            });\2', content, flags=re.DOTALL)


    # --- Phase 2: clearAllScribeAllotments ---
    clear_target = r'(\s+window\.clearAllScribeAllotments = function \(\) \{.*?currentScribeAllotment = \{\};\s+)// 2\. Save to Local Storage\s+const allAllotments = JSON\.parse\(localStorage\.getItem\(SCRIBE_ALLOTMENT_KEY\) \|\| \'{}\'\);\s+allAllotments\[currentSessionKey\] = currentScribeAllotment;\s+localStorage\.setItem\(SCRIBE_ALLOTMENT_KEY, JSON\.stringify\(allAllotments\)\);\s+// 3\. Sync & Refresh\s+hasUnsavedScribes = true;\s+if \(typeof updateSyncStatus === \'function\'\) \{\s+updateSyncStatus\("Unsaved Changes", "warning"\);\s+\}\s+renderScribeAllotmentList\(currentSessionKey\);\s+alert\(".*?All scribe allotments for this session have been cleared\."\);\s+\};'
    
    clear_replace = r"""\1// [VAULT UPGRADE]: Save to session-specific vault
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
        localStorage.setItem('hasUnsavedScribes_' + sessionKey.replace(/\\s/g, '_'), 'true'); // Cross-script dirty flag
        if (typeof updateSyncStatus === 'function') {
            updateSyncStatus("Unsaved Changes", "warning");
        }
        renderScribeAllotmentList(sessionKey);

        // Force Drive Sync for Basic Users
        if (typeof window.triggerDriveAutoSync === 'function') window.triggerDriveAutoSync(true);

        alert("âœ… All scribe allotments for this session have been cleared.");
    };"""
    content = re.sub(clear_target, clear_replace, content, flags=re.DOTALL)


    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print("Perfect python patch applied.")

if __name__ == '__main__':
    patch_app_js()
