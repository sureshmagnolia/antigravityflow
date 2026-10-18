import re

def extract_block(file_content, start_pattern, end_pattern):
    match = re.search(f'({start_pattern}.*?{end_pattern})', file_content, re.DOTALL)
    if match:
        return match.group(1)
    return None

def patch_app_js():
    with open('app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()
    with open('temp_app.js', 'r', encoding='utf-16') as f:
        temp_app = f.read()

    # --- Phase 1: getIsoDateLocal ---
    app_js = app_js.replace(".toISOString().split('T')[0]", "getIsoDateLocal()")
    app_js = app_js.replace(".toISOString().slice(0, 10)", "getIsoDateLocal()")

    # --- Phase 2: deleteSlotsFromCloud ---
    # 1. autoCleanPastGhostData
    t1 = """        if (typeof syncDataToCloud === 'function') {
            // \ud83d\udee1\ufe0f [AUDIT FIX]: Disabled in app.js to prevent unintended cloud wipes. 
            // Invigilation management is now authoritative within invigilation.js
            // await syncDataToCloud('slots', "FORCE_OVERWRITE"); 
        }"""
    r1 = t1 + "\n\n        // \ud83d\udee1\ufe0f [AUDIT FIX]: Use the authoritative sharded sync instead of the deprecated legacy sync\n        // to permanently delete expired slots from the cloud shards.\n        if (deletedSlotIds.length > 0 && typeof window.deleteSlotsFromCloud === 'function') {\n            window.deleteSlotsFromCloud(deletedSlotIds).catch(e => console.warn(`Failed to sync cleaned slots:`, e));\n        }"
    app_js = app_js.replace(t1, r1)
    # Also handle emoji encoded differently
    t1_alt = t1.replace("\ud83d\udee1\ufe0f", "???")
    r1_alt = r1.replace("\ud83d\udee1\ufe0f", "???")
    app_js = app_js.replace(t1_alt, r1_alt)

    # 2. executeBulkDelete (slots sync)
    t2 = """            // This prevents stale data from re-poisoning the local database on refresh.
            await syncDataToCloud('baseData');
        }"""
    r2 = t2 + "\n\n        // \ud83d\udee1\ufe0f [SHARD SYNC FIX]: Push bulk-deleted slot requirements to the daily shards immediately\n        // so that the next reload doesn't resurrect old slot requirements.\n        if (typeof window.deleteSlotsFromCloud === 'function') {\n            await window.deleteSlotsFromCloud(sessionsToDelete);\n        }"
    app_js = app_js.replace(t2, r2)


    # --- Phase 2: IDB Bump & Helpers (openExamDB) ---
    t3 = extract_block(app_js, r'/\* Bumping to version 2 to force the missing store creation \*/', r'req\.onerror = e => reject\(e\.target\.error\);\r?\n    \}\);\r?\n\}')
    r3 = extract_block(temp_app, r'/\* Bumping to version 3 to force the missing store creation \*/', r'req\.onerror = \(\) => resolve\(null\);\r?\n            \} catch \(e\) \{ resolve\(null\); \}\r?\n        \}\);\r?\n    \} catch \(e\) \{ console\.warn\("getScribeAllotmentIDB failed:", e\); return null; \}\r?\n\};')
    if t3 and r3:
        app_js = app_js.replace(t3, r3)
    else:
        print("Failed to extract T3/R3")

    # --- Phase 2: loadScribeAllotment ---
    t4 = extract_block(app_js, r'    // NEW FUNCTION: This loads the scribe allotment data for the session\r?\n    function loadScribeAllotment\(sessionKey\) \{', r'            scribeAllotmentListSection\.classList\.add\(\'hidden\'\);\r?\n            if\(scribeAllotmentList\) scribeAllotmentList\.innerHTML = "";\r?\n        \}\r?\n    \}')
    if not t4:
        # Fallback without if(scribeAllotmentList)
        t4 = extract_block(app_js, r'    // NEW FUNCTION: This loads the scribe allotment data for the session\r?\n    function loadScribeAllotment\(sessionKey\) \{', r'            scribeAllotmentListSection\.classList\.add\(\'hidden\'\);\r?\n            scribeAllotmentList\.innerHTML = "";\r?\n        \}\r?\n    \}')
    
    r4 = extract_block(temp_app, r'    // NEW FUNCTION: This loads the scribe allotment data for the session\r?\n    async function loadScribeAllotment\(sessionKey\) \{', r'            scribeAllotmentListSection\.classList\.add\(\'hidden\'\);\r?\n            if\(scribeAllotmentList\) scribeAllotmentList\.innerHTML = "";\r?\n        \}\r?\n    \}')
    if not r4:
        r4 = extract_block(temp_app, r'    // NEW FUNCTION: This loads the scribe allotment data for the session\r?\n    async function loadScribeAllotment\(sessionKey\) \{', r'            scribeAllotmentListSection\.classList\.add\(\'hidden\'\);\r?\n            scribeAllotmentList\.innerHTML = "";\r?\n        \}\r?\n    \}')

    if t4 and r4:
        app_js = app_js.replace(t4, r4)
    else:
        print("Failed to extract T4/R4")


    # --- Phase 2: saveScribeBtn ---
    # In V2, it is:
    t5 = extract_block(app_js, r'        // [^\r\n]+?\[PERSISTENCE FIX\]: Explicitly save to localStorage for Basic Users', r'            localStorage\.setItem\(SCRIBE_ALLOTMENT_KEY, JSON\.stringify\(allScribeAllots\)\);\r?\n        \}')
    r5 = extract_block(temp_app, r'        // [^\r\n]+?\[PERSISTENCE FIX\]: Explicitly save to localStorage for Basic Users', r'            \} catch \(e\) \{\r?\n                console\.error\("Ã¢ÂÅ’ CRITICAL: IndexedDB save failed!", e\);\r?\n                alert\("Ã¢ÂÅ’ Error: Could not save to Database\. Your changes may be lost\."\);\r?\n            \}\r?\n        \}')
    
    if not r5:
         r5 = extract_block(temp_app, r'        // [^\r\n]+?\[PERSISTENCE FIX\]: Explicitly save to localStorage for Basic Users', r'alert\("Ã¢ÂÅ’ Error: Could not save to Database\. Your changes may be lost\."\);\r?\n            \}\r?\n        \}')

    # Add a fallback for r5 to match any emoji chars
    if not r5:
        r5 = extract_block(temp_app, r'        // [^\r\n]+?\[PERSISTENCE FIX\]: Explicitly save to localStorage for Basic Users', r'            \} catch \(e\) \{\r?\n                console\.error\("[^\r\n]+?CRITICAL: IndexedDB save failed!", e\);\r?\n                alert\("[^\r\n]+?Error: Could not save to Database\. Your changes may be lost\."\);\r?\n            \}\r?\n        \}')

    if t5 and r5:
        app_js = app_js.replace(t5, r5)
    else:
        print("Failed to extract T5/R5")

    # --- Phase 2: deleteKeyInStorage ---
    t6 = extract_block(app_js, r'                // 2\. Helper to Delete Key\r?\n                const deleteKeyInStorage = \(storageKey\) => \{', r'                deleteKeyInStorage\(\'examRoomAllotment\'\);\r?\n                deleteKeyInStorage\(\'examScribeAllotment\'\);')
    r6 = extract_block(temp_app, r'                // 2\. Helper to Delete Key\r?\n                const deleteKeyInStorage = async \(storageKey\) => \{', r'                await deleteKeyInStorage\(\'examRoomAllotment\'\);\r?\n                await deleteKeyInStorage\(\'examScribeAllotment\'\);')
    if t6 and r6:
        app_js = app_js.replace(t6, r6)
    else:
        print("Failed to extract T6/R6")

    # --- Phase 2: executeBulkDelete IDB Cleanup ---
    t7 = extract_block(app_js, r'            auxKeys\.forEach\(key => \{\r?\n                const raw = localStorage\.getItem\(key\);', r'                    if\(changed\) localStorage\.setItem\(key, JSON\.stringify\(data\)\);\r?\n                \}\r?\n            \}\);\r?\n        \}')
    r7 = extract_block(temp_app, r'            auxKeys\.forEach\(key => \{\r?\n                const raw = localStorage\.getItem\(key\);', r'                try \{\r?\n                    const db = await openExamDB\(\);\r?\n                    const tx = db\.transaction\(\'scribeVault\', \'readwrite\'\);\r?\n                    tx\.objectStore\(\'scribeVault\'\)\.delete\(s\);\r?\n                \} catch\(e\) \{ console\.error\("Bulk IDB cleanup failed", e\); \}\r?\n            \}\);\r?\n        \}')
    if t7 and r7:
        app_js = app_js.replace(t7, r7)
    else:
        print("Failed to extract T7/R7")

    # --- Phase 2: clearAllScribeAllotments ---
    t8 = extract_block(app_js, r'    window\.clearAllScribeAllotments = function \(\) \{', r'renderScribeAllotmentList\(currentSessionKey\);\r?\n\r?\n        alert\("Ã¢Å“â€¦ All scribe allotments for this session have been cleared\."\);\r?\n    \};')
    if not t8:
        t8 = extract_block(app_js, r'    window\.clearAllScribeAllotments = function \(\) \{', r'renderScribeAllotmentList\(currentSessionKey\);\r?\n\r?\n        alert\("[^\r\n]+? All scribe allotments for this session have been cleared\."\);\r?\n    \};')
        
    r8 = extract_block(temp_app, r'    window\.clearAllScribeAllotments = function \(\) \{', r'renderScribeAllotmentList\(sessionKey\);\r?\n\r?\n        // Force Drive Sync for Basic Users\r?\n        if \(typeof window\.triggerDriveAutoSync === \'function\'\) window\.triggerDriveAutoSync\(true\);\r?\n\r?\n        alert\("Ã¢Å“â€¦ All scribe allotments for this session have been cleared\."\);\r?\n    \};')
    if not r8:
         r8 = extract_block(temp_app, r'    window\.clearAllScribeAllotments = function \(\) \{', r'renderScribeAllotmentList\(sessionKey\);\r?\n\r?\n        // Force Drive Sync for Basic Users\r?\n        if \(typeof window\.triggerDriveAutoSync === \'function\'\) window\.triggerDriveAutoSync\(true\);\r?\n\r?\n        alert\("[^\r\n]+? All scribe allotments for this session have been cleared\."\);\r?\n    \};')

    if t8 and r8:
        app_js = app_js.replace(t8, r8)
    else:
        print("Failed to extract T8/R8")

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app_js)

    print("Extraction and replacement complete.")

if __name__ == '__main__':
    patch_app_js()
