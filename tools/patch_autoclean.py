import sys

def patch():
    with open('app.js', 'r', encoding='utf-8') as f:
        app = f.read()

    # We need to inject the deletion hook into autoCleanPastGhostData
    target = """         if (typeof syncDataToCloud === 'function') {
            // 🛡 [AUDIT FIX]: Disabled in app.js to prevent unintended cloud wipes. 
            // Invigilation management is now authoritative within invigilation.js
            // await syncDataToCloud('slots', "FORCE_OVERWRITE"); 
        }"""
    
    # But wait! I know app.js uses unicode, so I will find the exact string without unicode:
    target_clean = """if (typeof syncDataToCloud === 'function') {"""
    
    # Let's find the exact block around line 280
    idx = app.find("if (typeof syncDataToCloud === 'function') {")
    if idx == -1:
        print("Failed to find syncDataToCloud block.")
        return
        
    idx2 = app.find("console.log(`🧹 Maintenance: Cleaned up ${deletedCount} local records older than 30 days.`);", idx)
    
    if idx2 != -1:
        # We will insert our hook right before console.log
        hook = """
        // [AUDIT FIX]: Use the authoritative sharded sync instead of the deprecated legacy sync
        // to permanently delete expired slots from the cloud shards.
        if (deletedCount > 0 && typeof window.deleteSlotsFromCloud === 'function') {
            // We need the keys of the deleted slots.
            // Wait, the original code used deletedSlotIds, let me make sure it exists!
            if (typeof deletedSlotIds !== 'undefined' && deletedSlotIds.length > 0) {
                window.deleteSlotsFromCloud(deletedSlotIds).catch(e => console.warn(`Failed to sync cleaned slots:`, e));
            }
        }
        """
        app = app[:idx2] + hook + app[idx2:]
        with open('app.js', 'w', encoding='utf-8') as f:
            f.write(app)
        print("Injected autoClean hook!")
    else:
        print("Failed to find console.log maintenance.")

if __name__ == '__main__':
    patch()
