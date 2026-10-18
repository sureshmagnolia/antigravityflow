import sys

def patch():
    with open('app.js', 'r', encoding='utf-8') as f:
        app = f.read()
    
    idx1 = app.find("Explicitly save to localStorage for Basic Users")
    if idx1 != -1:
        start_idx = app.rfind("        //", 0, idx1)
        end_idx = app.find("        }", idx1) + 9
        target = app[start_idx:end_idx]
        
        replace1 = """        // 🛡️ [PERSISTENCE FIX]: Explicitly save to localStorage for Basic Users
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
        app = app[:start_idx] + replace1 + app[end_idx:]
        print("saveScribeBtn patched successfully!")

    idx2 = app.find("window.clearAllScribeAllotments = function () {")
    if idx2 != -1:
        start_idx2 = app.find("        // 2. Save to Local Storage", idx2)
        end_idx2 = app.find("        hasUnsavedScribes = true;", idx2) + 33
        target2 = app[start_idx2:end_idx2]

        replace2 = """        // [VAULT UPGRADE]: Save to session-specific vault
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

        app = app[:start_idx2] + replace2 + app[end_idx2:]
        print("clearAllScribeAllotments patched successfully!")

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app)

if __name__ == '__main__':
    patch()
