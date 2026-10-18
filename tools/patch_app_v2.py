import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Fix Syntax Error
code = code.replace('new Date()getIsoDateLocal()', 'window.getIsoDateLocal(new Date())')

# 2. Fix floating promises in deleteKeyInStorage
old_str = """                deleteKeyInStorage('examAbsenteeList');
                deleteKeyInStorage('examInvigilatorMapping');
                deleteKeyInStorage('examInvigilationSlots');
                deleteKeyInStorage('examQPCodes');"""
new_str = """                await deleteKeyInStorage('examAbsenteeList');
                await deleteKeyInStorage('examInvigilatorMapping');
                await deleteKeyInStorage('examInvigilationSlots');
                await deleteKeyInStorage('examQPCodes');"""
code = code.replace(old_str, new_str)

# 3. Fix floating saveScribeAllotmentIDB
code = code.replace('saveScribeAllotmentIDB(sessionKey, currentScribeAllotment);', 'await saveScribeAllotmentIDB(sessionKey, currentScribeAllotment);')

# 4. Fix forEach in executeBulkDelete
old_forEach = """            sessionsToDelete.forEach(async (s) => {
                const safeKey = s.replace(/\s/g, '_');
                localStorage.removeItem('scrAllot_' + safeKey);
                localStorage.removeItem('hasUnsavedScribes_' + safeKey);
                
                // [V3 IDB UPGRADE]: Clean IDB Vault
                try {
                    const db = await openExamDB();
                    const tx = db.transaction('scribeVault', 'readwrite');
                    tx.objectStore('scribeVault').delete(s);
                } catch(e) { console.error("Bulk IDB cleanup failed", e); }
            });"""
new_for = """            for (const s of sessionsToDelete) {
                const safeKey = s.replace(/\s/g, '_');
                localStorage.removeItem('scrAllot_' + safeKey);
                localStorage.removeItem('hasUnsavedScribes_' + safeKey);
                
                // [V3 IDB UPGRADE]: Clean IDB Vault
                try {
                    const db = await openExamDB();
                    const tx = db.transaction('scribeVault', 'readwrite');
                    tx.objectStore('scribeVault').delete(s);
                } catch(e) { console.error("Bulk IDB cleanup failed", e); }
            }"""
code = code.replace(old_forEach, new_for)

# 5. Fix deleteSlotsFromCloud
code = code.replace('await window.deleteSlotsFromCloud(sessionsToDelete);', 'await window.deleteSlotsFromCloud(sessionsToDelete, JSON.parse(localStorage.getItem(\'examInvigilationSlots\') || \'{}\'));')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print('App.js patched successfully')
