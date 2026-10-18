import sys

def patch():
    with open('app.js', 'r', encoding='utf-8') as f:
        app = f.read()

    app = app.replace('\r\n', '\n')

    # 1. Bypass the function definition
    t1 = """        window.fetchSlotsData = async () => {
            const { getDoc, doc } = window.firebase;
            const snap = await getDoc(doc(db, "colleges", collegeId, "system_data", "slots"));
            if (snap.exists()) syncLocal(snap.data());
        };"""
    r1 = """        window.fetchSlotsData = async () => {
            // 🛡️ [AUDIT FIX]: fetchSlotsData is decommissioned. 
            // Authority is now moved to the Sharded Listener in invigilation.js.
            // This prevents legacy root document fetches from overwriting active sharded state.
            console.log("ℹ️ fetchSlotsData bypassed: Sharded Authority Active.");
        };"""
    app = app.replace(t1, r1)

    # 2. Remove from visibilitychange (Line 23872)
    t2 = """        else if (typeof viewRoomAllotment !== 'undefined' && !viewRoomAllotment.classList.contains('hidden')) {
            if (typeof window.fetchSettingsData === 'function') window.fetchSettingsData();
            if (typeof window.fetchSlotsData === 'function') window.fetchSlotsData();
        }"""
    r2 = """        else if (typeof viewRoomAllotment !== 'undefined' && !viewRoomAllotment.classList.contains('hidden')) {
            if (typeof window.fetchSettingsData === 'function') window.fetchSettingsData();
        }"""
    app = app.replace(t2, r2)

    # 3. Remove other arbitrary calls to it
    app = app.replace("          if (typeof fetchSlotsData === 'function') fetchSlotsData();\n", "")
    app = app.replace("        if (typeof window.fetchSlotsData === 'function') window.fetchSlotsData(); \n", "")
    app = app.replace("""        if (typeof window.fetchSlotsData === 'function') {
            await window.fetchSlotsData();
        }\n""", "")

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app)
        
    print("fetchSlotsData bypassed successfully.")

if __name__ == '__main__':
    patch()
