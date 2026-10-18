import os
import re
import sys

def main():
    app_path = 'app.js'
    with open(app_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define the new top-level Two-Tier Storage Shield block
    storage_shield_block = '''
// --- TWO-TIER STORAGE SHIELD & LOCALSTORAGE INTERCEPTOR ---
// Initialize originalSetItem immediately at top level to prevent TDZ ReferenceErrors
const originalSetItem = localStorage.setItem;

function compactRoomAllotmentObject(allAllotments) {
    if (!allAllotments || typeof allAllotments !== 'object') return { allAllotments, changed: false };
    let changed = false;
    for (const sessionKey in allAllotments) {
        const rooms = allAllotments[sessionKey];
        if (Array.isArray(rooms)) {
            for (let r = 0; r < rooms.length; r++) {
                const room = rooms[r];
                if (room && Array.isArray(room.students)) {
                    for (let i = 0; i < room.students.length; i++) {
                        const s = room.students[i];
                        if (s && typeof s === 'object') {
                            if ('Source File' in s || 'sourceFile' in s || 'Exam Name' in s || 'Date' in s || 'Time' in s) {
                                delete s['Source File'];
                                delete s['sourceFile'];
                                delete s['Exam Name'];
                                delete s['Date'];
                                delete s['Time'];
                                changed = true;
                            }
                        }
                    }
                }
            }
        }
    }
    return { allAllotments, changed };
}
window.compactRoomAllotmentObject = compactRoomAllotmentObject;

function compactRoomAllotmentsInStorage() {
    try {
        const raw = localStorage.getItem('examRoomAllotment');
        if (!raw) return;
        const data = JSON.parse(raw);
        const { allAllotments, changed } = compactRoomAllotmentObject(data);
        if (changed) {
            console.log('🧹 [Storage Optimizer]: Compacted examRoomAllotment to free up quota.');
            try {
                if (typeof originalSetItem === 'function') {
                    originalSetItem.call(localStorage, 'examRoomAllotment', JSON.stringify(allAllotments));
                } else {
                    localStorage.setItem('examRoomAllotment', JSON.stringify(allAllotments));
                }
            } catch(e) {
                console.warn('Storage Optimizer write error:', e);
            }
        }
    } catch (e) {
        console.warn('Storage compact check failed:', e);
    }
}
window.compactRoomAllotmentsInStorage = compactRoomAllotmentsInStorage;

function pruneLocalStorageAllotments(allAllotments, keepSessionKey = null) {
    if (!allAllotments || typeof allAllotments !== 'object') return allAllotments;
    const sessionKeys = Object.keys(allAllotments);
    const MAX_LOCAL_SESSIONS = 10;
    if (sessionKeys.length <= MAX_LOCAL_SESSIONS) return allAllotments;

    const parseSessionDate = (k) => {
        try {
            const rawDate = k.split(' | ')[0].trim();
            const p = rawDate.replace(/[\\/-]/g, '.').split('.');
            if (p.length === 3) {
                return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])).getTime();
            }
        } catch(e) {}
        return 0;
    };

    sessionKeys.sort((a, b) => parseSessionDate(b) - parseSessionDate(a));

    const activeKeys = new Set(sessionKeys.slice(0, MAX_LOCAL_SESSIONS));
    if (keepSessionKey) activeKeys.add(keepSessionKey);
    if (typeof window !== 'undefined' && window.currentSessionKey) activeKeys.add(window.currentSessionKey);

    const pruned = {};
    for (const k of activeKeys) {
        if (allAllotments[k]) pruned[k] = allAllotments[k];
    }
    return pruned;
}
window.pruneLocalStorageAllotments = pruneLocalStorageAllotments;

async function ensureSessionInLocalStorage(sessionKey) {
    if (!sessionKey) return;
    try {
        let allAllotments = JSON.parse(localStorage.getItem('examRoomAllotment') || '{}');
        if (allAllotments[sessionKey] && Array.isArray(allAllotments[sessionKey]) && allAllotments[sessionKey].length > 0) {
            return; // Already present in active window
        }
        if (typeof window.getRoomAllotmentIDB === 'function') {
            const vaultedRooms = await window.getRoomAllotmentIDB(sessionKey);
            if (vaultedRooms && Array.isArray(vaultedRooms) && vaultedRooms.length > 0) {
                allAllotments = JSON.parse(localStorage.getItem('examRoomAllotment') || '{}');
                allAllotments[sessionKey] = vaultedRooms;
                const trimmed = window.pruneLocalStorageAllotments(allAllotments, sessionKey);
                try {
                    localStorage.setItem('examRoomAllotment', JSON.stringify(trimmed));
                    console.log(`🛡️ [Storage Shield]: Hydrated "${sessionKey}" from IndexedDB Vault into localStorage.`);
                } catch(e) {
                    console.warn('Storage Shield hydration save warning:', e);
                }
            }
        }
    } catch (e) {
        console.warn("Storage Shield ensureSession failed:", e);
    }
}
window.ensureSessionInLocalStorage = ensureSessionInLocalStorage;

async function initTwoTierStorageShield() {
    try {
        const raw = localStorage.getItem('examRoomAllotment');
        if (!raw) return;
        const allAllotments = JSON.parse(raw);
        if (!allAllotments || typeof allAllotments !== 'object') return;

        const sessionKeys = Object.keys(allAllotments);
        if (sessionKeys.length === 0) return;

        // 1. Vault all existing sessions safely in IndexedDB
        for (const sk of sessionKeys) {
            const rooms = allAllotments[sk];
            if (rooms && Array.isArray(rooms) && rooms.length > 0) {
                if (typeof window.saveRoomAllotmentIDB === 'function') {
                    await window.saveRoomAllotmentIDB(sk, rooms);
                }
            }
        }

        // 2. Prune localStorage to the top 10 sessions (Sliding Window)
        if (sessionKeys.length > 10) {
            const activeSession = (typeof allotmentSessionSelect !== 'undefined' && allotmentSessionSelect) ? allotmentSessionSelect.value : (typeof window !== 'undefined' ? window.currentSessionKey : null);
            const pruned = window.pruneLocalStorageAllotments(allAllotments, activeSession);
            try {
                if (typeof originalSetItem === 'function') {
                    originalSetItem.call(localStorage, 'examRoomAllotment', JSON.stringify(pruned));
                } else {
                    localStorage.setItem('examRoomAllotment', JSON.stringify(pruned));
                }
                console.log(`🛡️ [Storage Shield]: Archived ${sessionKeys.length - Object.keys(pruned).length} older sessions to IndexedDB Vault. Active window: ${Object.keys(pruned).length} sessions.`);
            } catch(e) {
                console.warn('Storage Shield startup trim warning:', e);
            }
        }
    } catch (e) {
        console.error("Storage Shield init error:", e);
    }
}
window.initTwoTierStorageShield = initTwoTierStorageShield;

// --- INTERCEPT LOCALSTORAGE FOR DRIVE SYNC & QUOTA RECOVERY ---
localStorage.setItem = function(key, value) {
    try {
        originalSetItem.apply(this, arguments);
    } catch (e) {
        if ((e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) && key === 'examRoomAllotment') {
            console.warn('⚠️ QuotaExceededError detected for examRoomAllotment. Applying emergency compaction...');
            try {
                const parsed = JSON.parse(value);
                const { allAllotments } = compactRoomAllotmentObject(parsed);
                const compactedStr = JSON.stringify(allAllotments);
                originalSetItem.call(this, key, compactedStr);
                value = compactedStr;
                console.log('✅ Emergency compaction successful. Saved to localStorage.');
            } catch (compactErr) {
                console.error('Emergency compaction failed:', compactErr);
                throw e;
            }
        } else {
            throw e;
        }
    }
    // 🛡️ SEPARATION: !window.currentCollegeId ensures this NEVER runs for Firebase Pro users.
    // window.isDriveRestoringData ensures Drive restores don't trigger auto-sync loops.
    if (typeof window !== 'undefined' && !window.isDriveRestoringData && key !== 'lastUpdated' && typeof window.triggerDriveAutoSync === 'function' && !window.currentCollegeId && window.DATA_KEYS && window.DATA_KEYS.includes(key)) {
        // Automatically update the timestamp for conflict detection
        try { originalSetItem.apply(this, ['lastUpdated', new Date().toISOString()]); } catch(e) {}
        window.triggerDriveAutoSync();
    }
};
'''

    # Top-level openExamDB definition to ensure all IDB helpers have access
    open_exam_db_block = '''
function openExamDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(IDB_NAME, 4);
        req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
            if (!db.objectStoreNames.contains('scribeVault')) db.createObjectStore('scribeVault');
            if (!db.objectStoreNames.contains('allotmentVault')) db.createObjectStore('allotmentVault');
        };
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e.target.error);
    });
}
window.openExamDB = openExamDB;
'''

    # 1. Place openExamDB before window.saveScribeAllotmentIDB if not already there
    idb_marker = "window.saveScribeAllotmentIDB = function(sessionKey, allotment) {"
    if "window.openExamDB = openExamDB;" not in content:
        if idb_marker in content:
            content = content.replace(idb_marker, open_exam_db_block + "\n" + idb_marker, 1)
            print("Added top-level openExamDB before saveScribeAllotmentIDB.")
        else:
            print("Warning: idb_marker not found!")

    # 2. Insert storage_shield_block after window.deleteRoomAllotmentIDB
    delete_marker = "window.deleteRoomAllotmentIDB = function(sessionKey) {\n        return new Promise((resolve) => {\n            openExamDB().then(db => {\n                try {\n                    const tx = db.transaction('allotmentVault', 'readwrite');\n                    tx.objectStore('allotmentVault').delete(sessionKey);\n                    tx.oncomplete = () => { db.close(); resolve(true); };\n                    tx.onerror = () => { db.close(); resolve(false); };\n                } catch(e) {\n                    db.close();\n                    resolve(false);\n                }\n            }).catch(() => resolve(false));\n        });\n    };"
    
    if delete_marker in content:
        content = content.replace(delete_marker, delete_marker + "\n" + storage_shield_block, 1)
        print("Inserted storage_shield_block after window.deleteRoomAllotmentIDB.")
    else:
        # Try regex search for deleteRoomAllotmentIDB
        pattern = r"(window\.deleteRoomAllotmentIDB\s*=\s*function\(sessionKey\)\s*\{[\s\S]*?\n\s*\};\s*\n)"
        m = re.search(pattern, content)
        if m:
            content = content[:m.end()] + "\n" + storage_shield_block + "\n" + content[m.end():]
            print("Inserted storage_shield_block after window.deleteRoomAllotmentIDB via regex.")
        else:
            print("ERROR: Could not find deleteRoomAllotmentIDB!")
            sys.exit(1)

    # 3. Remove old block from lines ~704 to ~878
    old_block_pattern = r"// --- COMPACT ROOM ALLOTMENT OBJECT \(Removes redundant metadata to stay within 5MB Quota\) ---[\s\S]*?window\.triggerDriveAutoSync\(\);\s*\n\s*\}\s*;\s*\n"
    matches = list(re.finditer(old_block_pattern, content))
    print(f"Found {len(matches)} occurrences of old storage block.")
    if len(matches) > 0:
        # The second occurrence is the one down in the file (if we already inserted the first one at top)
        # Or remove the one before pruneOldDataForBasicUsers
        prune_marker = "// --- NEW: BASIC USER AUTO-PRUNER ---"
        idx_prune = content.find(prune_marker)
        if idx_prune != -1:
            # Find the match that ends right before idx_prune
            for match in matches:
                if abs(match.end() - idx_prune) < 50:
                    content = content[:match.start()] + content[match.end():]
                    print("Successfully removed old storage block before BASIC USER AUTO-PRUNER.")
                    break

    # 4. In DOMContentLoaded, make the calls safe:
    content = content.replace(
        "compactRoomAllotmentsInStorage();\n    initTwoTierStorageShield();",
        "if (typeof compactRoomAllotmentsInStorage === 'function') compactRoomAllotmentsInStorage();\n    if (typeof initTwoTierStorageShield === 'function') initTwoTierStorageShield();"
    )

    # 5. In finalizeAppLoad, make calls safe:
    content = content.replace(
        "compactRoomAllotmentsInStorage();\n    await initTwoTierStorageShield();",
        "if (typeof compactRoomAllotmentsInStorage === 'function') compactRoomAllotmentsInStorage();\n    if (typeof initTwoTierStorageShield === 'function') await initTwoTierStorageShield();"
    )

    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated app.js successfully.")

if __name__ == '__main__':
    main()
