import sys

def patch():
    with open('app.js', 'r', encoding='utf-8') as f:
        app = f.read()

    app = app.replace('\r\n', '\n')

    # --- 1. autoCleanPastGhostData ---
    # In V2, it does await syncDataToCloud('slots', "FORCE_OVERWRITE")
    target1 = """        if (typeof syncDataToCloud === 'function') {
            // ??? [AUDIT FIX]: Disabled in app.js to prevent unintended cloud wipes. 
            // Invigilation management is now authoritative within invigilation.js
            // await syncDataToCloud('slots', "FORCE_OVERWRITE"); 
        }"""
    replace1 = """        if (typeof syncDataToCloud === 'function') {
            // ??? [AUDIT FIX]: Disabled in app.js to prevent unintended cloud wipes. 
            // Invigilation management is now authoritative within invigilation.js
            // await syncDataToCloud('slots', "FORCE_OVERWRITE"); 
        }

        // 🛡️ [AUDIT FIX]: Use the authoritative sharded sync instead of the deprecated legacy sync
        // to permanently delete expired slots from the cloud shards.
        if (deletedSlotIds.length > 0 && typeof window.deleteSlotsFromCloud === 'function') {
            window.deleteSlotsFromCloud(deletedSlotIds).catch(e => console.warn(`Failed to sync cleaned slots:`, e));
        }"""
    if target1 in app:
        app = app.replace(target1, replace1)
        print("autoCleanPastGhostData patched successfully!")
    else:
        print("autoCleanPastGhostData target not found!")

    # --- 2. executeBulkDelete (slots sync + IDB) ---
    target2 = """            // This prevents stale data from re-poisoning the local database on refresh.
            await syncDataToCloud('baseData');
        }"""
    replace2 = """            // This prevents stale data from re-poisoning the local database on refresh.
            await syncDataToCloud('baseData');
        }

        // 🛡️ [SHARD SYNC FIX]: Push bulk-deleted slot requirements to the daily shards immediately
        // so that the next reload doesn't resurrect old slot requirements.
        if (typeof window.deleteSlotsFromCloud === 'function') {
            await window.deleteSlotsFromCloud(sessionsToDelete);
        }"""
    if target2 in app:
        app = app.replace(target2, replace2)
        print("executeBulkDelete (sync) patched successfully!")
    else:
        print("executeBulkDelete (sync) target not found!")

    # --- 3. executeBulkDelete IDB Cleanup ---
    target3_start = app.find("            auxKeys.forEach(key => {")
    if target3_start != -1:
        target3_end = app.find("            });\n        }", target3_start) + 24
        target3 = app[target3_start:target3_end]
        if "sessionsToDelete.forEach(async (s) => {" not in target3: # avoid double patch
            replace3 = target3.replace("            });\n        }", """            });

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
        }""")
            app = app.replace(target3, replace3)
            print("executeBulkDelete (IDB cleanup) patched successfully!")
        else:
            print("executeBulkDelete (IDB cleanup) already patched!")
    else:
        print("executeBulkDelete (IDB cleanup) target not found!")

    # --- 4. deleteKeyInStorage ---
    target4_start = app.find("                // 2. Helper to Delete Key")
    if target4_start != -1:
        target4_end = app.find("                deleteKeyInStorage('examScribeAllotment');", target4_start) + 58
        target4 = app[target4_start:target4_end]
        
        replace4 = """                // 2. Helper to Delete Key
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

        app = app.replace(target4, replace4)
        print("deleteKeyInStorage patched successfully!")
    else:
        print("deleteKeyInStorage target not found!")


    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app)

if __name__ == '__main__':
    patch()
