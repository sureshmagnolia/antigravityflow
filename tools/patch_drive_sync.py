import sys

def patch():
    with open('drive_sync.js', 'r', encoding='utf-8') as f:
        ds = f.read()

    # The restore logic writes to examScribeAllotmentV2
    # We need to inject window.saveScribeAllotmentIDB(rawScribeAllotment) right after it
    
    t1 = "localStorage.setItem('examScribeAllotmentV2', JSON.stringify(rawScribeAllotment));"
    r1 = """localStorage.setItem('examScribeAllotmentV2', JSON.stringify(rawScribeAllotment));
            // [V3 IDB UPGRADE] Ensure restored scribe data is written to the IndexedDB Vault
            if (typeof window.saveScribeAllotmentIDB === 'function') {
                for (const sessionKey of Object.keys(rawScribeAllotment)) {
                    window.saveScribeAllotmentIDB(sessionKey, rawScribeAllotment[sessionKey]).catch(e => console.error("IDB Restore Failed:", e));
                }
            }"""

    if t1 in ds:
        ds = ds.replace(t1, r1)
        with open('drive_sync.js', 'w', encoding='utf-8') as f:
            f.write(ds)
        print("Injected Scribe Restore into drive_sync.js!")
    else:
        print("Target not found in drive_sync.js")

if __name__ == '__main__':
    patch()
