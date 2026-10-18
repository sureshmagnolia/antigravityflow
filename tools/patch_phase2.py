import sys

def patch():
    with open('app.js', 'r', encoding='utf-8') as f:
        app = f.read()
    app = app.replace('\r\n', '\n')

    # Fix 1: Bump IDB Version
    t_idb = "const req = indexedDB.open(IDB_NAME, 2);"
    r_idb = "const req = indexedDB.open(IDB_NAME, 3);"
    if t_idb in app:
        app = app.replace(t_idb, r_idb)
        print("Bumped IDB to v3")
    
    # Fix 2: Scribe Vault Definition
    t_vault = "db.createObjectStore(IDB_STORE);"
    r_vault = """db.createObjectStore(IDB_STORE);
                    }
                    if (!db.objectStoreNames.contains('scribeVault')) {
                        db.createObjectStore('scribeVault');"""
    if t_vault in app:
        app = app.replace(t_vault, r_vault)
        print("Added scribeVault")

    # Fix 3: Scribe IDB functions
    t_helpers = "window.IDB_STORE = 'examStore';"
    r_helpers = """window.IDB_STORE = 'examStore';

// [V3 IDB UPGRADE]: Helpers for Scribe Isolation
window.saveScribeAllotmentIDB = function(sessionKey, allotment) {
    return new Promise((resolve) => {
        openExamDB().then(db => {
            const tx = db.transaction('scribeVault', 'readwrite');
            tx.objectStore('scribeVault').put(allotment, sessionKey);
            tx.oncomplete = () => { db.close(); resolve(true); };
            tx.onerror = () => { db.close(); resolve(false); };
        });
    });
};

window.getScribeAllotmentIDB = function(sessionKey) {
    return new Promise((resolve) => {
        openExamDB().then(db => {
            const tx = db.transaction('scribeVault', 'readonly');
            const req = tx.objectStore('scribeVault').get(sessionKey);
            req.onsuccess = () => { db.close(); resolve(req.result || null); };
            req.onerror = () => { db.close(); resolve(null); };
        }).catch(() => resolve(null));
    });
};"""
    if t_helpers in app:
        # Prevent double adding
        if "window.saveScribeAllotmentIDB" not in app:
            app = app.replace(t_helpers, r_helpers)
            print("Added Scribe Helpers")

    # Fix 4: Scribe Hybrid Load
    t_hybrid_load = """            let currentScribeAllotment = JSON.parse(localStorage.getItem('examScribeAllotment') || '{}');
            let legacyData = null;"""
    r_hybrid_load = """            let currentScribeAllotment = JSON.parse(localStorage.getItem('examScribeAllotment') || '{}');
            let legacyData = null;

            // [V3 IDB UPGRADE]: Multi-Tiered Load (Bidirectional Sync)
            // 1. Get from UI Cache
            const uiCache = currentScribeAllotment[sessionKey];
            
            // 2. Get from Private IDB (The Source of Truth)
            const dbData = await window.getScribeAllotmentIDB(sessionKey);
            
            if (dbData) {
                // IDB wins.
                currentScribeAllotment[sessionKey] = dbData;
            } else if (uiCache) {
                // IDB is empty, but UI cache has it. This happens during the initial V3 migration
                // when we first boot up the app after the patch. We must adopt the legacy data.
                console.log("V3: Adoption triggered. Syncing IDB from Legacy changes...");
                await window.saveScribeAllotmentIDB(sessionKey, uiCache);
            }"""
    if t_hybrid_load in app and "uiCache" not in app:
        app = app.replace(t_hybrid_load, r_hybrid_load)
        print("Added Scribe Hybrid Load")

    # Fix 5: Scribe Clear
    t_clear_scribe = """    // 5. Clear Local Storage
    localStorage.removeItem('examScribeAllotment');"""
    r_clear_scribe = """    // 5. Clear Local Storage
    localStorage.removeItem('examScribeAllotment');
    // [V3 IDB UPGRADE]: Clear IDB Vault
    try {
        openExamDB().then(db => {
            const tx = db.transaction('scribeVault', 'readwrite');
            tx.objectStore('scribeVault').clear();
        });
    } catch(e) { console.error("IDB clear failed", e); }"""
    if t_clear_scribe in app and "scribeVault" not in app.split(t_clear_scribe)[1][:100]:
        app = app.replace(t_clear_scribe, r_clear_scribe)
        print("Added Scribe Clear Vault")

    # Fix 6: Scribe Save button hook
    t_save_hook = """                localStorage.setItem('examScribeAllotment', JSON.stringify(currentScribeAllotment));"""
    r_save_hook = """                localStorage.setItem('examScribeAllotment', JSON.stringify(currentScribeAllotment));
                try {
                    if (window.saveScribeAllotmentIDB) {
                        await window.saveScribeAllotmentIDB(sessionKey, currentScribeAllotment[sessionKey]);
                    }
                } catch(e) {}"""
    if t_save_hook in app and "window.saveScribeAllotmentIDB" not in app.split(t_save_hook)[1][:100]:
        app = app.replace(t_save_hook, r_save_hook)
        print("Added Scribe Save Hook")

    # Fix 7: Sharded Deletion Safety Check in recalculateInvigilationSlotsBtn
    t_recalc_abort = """        let allSlots = [];
        try {
            allSlots = JSON.parse(localStorage.getItem('examInvigilationSlots') || '[]');
        } catch(e) {}"""
    r_recalc_abort = """        let allSlots = [];
        try {
            allSlots = JSON.parse(localStorage.getItem('examInvigilationSlots') || '[]');
        } catch(e) {}

        if (allSlots.length === 0) {
            alert('SAFETY ABORT: Your local slot cache is empty. \\n\\nPlease open the "Staff & Invigilation" tab briefly to allow the system to fully sync the cloud database shards before recalculating slots.');
            return;
        }"""
    if t_recalc_abort in app and "SAFETY ABORT" not in app:
        app = app.replace(t_recalc_abort, r_recalc_abort)
        print("Added Safety Abort")

    # Write output
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app)
    print("Done")

if __name__ == '__main__':
    patch()
