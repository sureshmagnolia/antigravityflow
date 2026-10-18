import sys

def patch():
    with open('app.js', 'r', encoding='utf-8') as f:
        app = f.read()

    # 1. Inject the missing deleteSlotsFromCloud function
    # It should go right before syncSlotsToCloud, which is around line 2515
    target1 = "async function syncSlotsToCloud() {"
    replacement1 = """// [NEW] Bulk Slot Deletion (Sharded Cloud Sync)
window.deleteSlotsFromCloud = async function(sessionKeys) {
    if (!window.currentCollegeId) return;
    const { doc, updateDoc, deleteField } = window.firebase;
    
    console.log(`🧹 Cloud Shard Cleanup: Deleting slots for ${sessionKeys.length} sessions...`);
    
    // Group keys by date (shard)
    const shards = {};
    for (const key of sessionKeys) {
        const [date, time] = key.split(' | ').map(s => s.trim());
        if (!date) continue;
        
        // Sanitize date for doc ID
        const cleanDate = date.replace(/\\./g, '-');
        if (!shards[cleanDate]) shards[cleanDate] = [];
        shards[cleanDate].push(key);
    }
    
    // Process each shard
    for (const [date, keys] of Object.entries(shards)) {
        const shardRef = doc(window.firebase.db, 'colleges', window.currentCollegeId, 'slots_daily', date);
        const updates = {};
        
        for (const key of keys) {
            updates[key] = deleteField();
        }
        
        try {
            await updateDoc(shardRef, updates);
            console.log(`✅ Shard [${date}] cleaned.`);
        } catch (e) {
            if (e.code !== 'not-found') {
                console.error(`❌ Shard [${date}] cleanup failed:`, e);
            }
        }
    }
};

async function syncSlotsToCloud() {"""
    
    if "window.deleteSlotsFromCloud = async function" not in app:
        if target1 in app:
            app = app.replace(target1, replacement1)
            print("Injected window.deleteSlotsFromCloud")
        else:
            print("Failed to find syncSlotsToCloud target.")
    else:
        print("window.deleteSlotsFromCloud already exists.")

    # 2. Inject the call into autoCleanPastGhostData
    target2 = """        if (typeof syncDataToCloud === 'function') {
            await syncDataToCloud('slots', "FORCE_OVERWRITE"); 
        }"""
    replacement2 = """        if (typeof syncDataToCloud === 'function') {
            await syncDataToCloud('slots', "FORCE_OVERWRITE"); 
        }

        // [AUDIT FIX]: Use the authoritative sharded sync instead of the deprecated legacy sync
        // to permanently delete expired slots from the cloud shards.
        if (deletedSlotIds.length > 0 && typeof window.deleteSlotsFromCloud === 'function') {
            window.deleteSlotsFromCloud(deletedSlotIds).catch(e => console.warn(`Failed to sync cleaned slots:`, e));
        }"""

    if "deleteSlotsFromCloud(deletedSlotIds)" not in app:
        if target2 in app:
            app = app.replace(target2, replacement2)
            print("Injected autoCleanPastGhostData hook")
        else:
            print("Failed to find autoCleanPastGhostData target.")
    else:
        print("autoClean hook already exists.")

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app)

if __name__ == '__main__':
    patch()
