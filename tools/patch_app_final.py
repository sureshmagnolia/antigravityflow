import sys

def patch():
    with open('app.js', 'r', encoding='utf-8') as f:
        app = f.read()
    with open('temp_app.js', 'r', encoding='utf-16') as f:
        temp = f.read()

    # 1. extract loadScribeAllotment from temp_app.js
    start1 = "    // NEW FUNCTION: This loads the scribe allotment data for the session\n    async function loadScribeAllotment(sessionKey) {"
    end1 = "            scribeAllotmentListSection.classList.add('hidden');\n            if(scribeAllotmentList) scribeAllotmentList.innerHTML = \"\";\n        }\n    }"
    idx1 = temp.find(start1)
    idx2 = temp.find(end1, idx1)
    if idx1 != -1 and idx2 != -1:
        load_new = temp[idx1:idx2+len(end1)]
        
        # find target in app.js
        t_start1 = "    // NEW FUNCTION: This loads the scribe allotment data for the session\n    function loadScribeAllotment(sessionKey) {"
        t_end1 = "            scribeAllotmentListSection.classList.add('hidden');\n            scribeAllotmentList.innerHTML = \"\";\n        }\n    }"
        t_idx1 = app.find(t_start1)
        t_idx2 = app.find(t_end1, t_idx1)
        if t_idx1 != -1 and t_idx2 != -1:
            app = app[:t_idx1] + load_new + app[t_idx2+len(t_end1):]
            print("loadScribeAllotment patched")

    # 2. extract saveScribeBtn
    start2 = "        // ðŸ›¡ï¸ [PERSISTENCE FIX]: Explicitly save to localStorage for Basic Users"
    end2 = "                alert(\"âŒ Error: Could not save to Database. Your changes may be lost.\");\n            }\n        }"
    idx1 = temp.find(start2)
    idx2 = temp.find(end2, idx1)
    if idx1 != -1 and idx2 != -1:
        save_new = temp[idx1:idx2+len(end2)]
        
        t_start2 = "        // ??? [PERSISTENCE FIX]: Explicitly save to localStorage for Basic Users\n        if (typeof SCRIBE_ALLOTMENT_KEY !== 'undefined') {"
        t_end2 = "            localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(allScribeAllots));\n        }"
        t_idx1 = app.find(t_start2)
        t_idx2 = app.find(t_end2, t_idx1)
        if t_idx1 != -1 and t_idx2 != -1:
            app = app[:t_idx1] + save_new + app[t_idx2+len(t_end2):]
            print("saveScribeBtn patched")

    # 3. extract deleteKeyInStorage
    start3 = "                // 2. Helper to Delete Key\n                const deleteKeyInStorage = async (storageKey) => {"
    end3 = "                await deleteKeyInStorage('examRoomAllotment');\n                await deleteKeyInStorage('examScribeAllotment');"
    idx1 = temp.find(start3)
    idx2 = temp.find(end3, idx1)
    if idx1 != -1 and idx2 != -1:
        del_new = temp[idx1:idx2+len(end3)]
        
        t_start3 = "                // 2. Helper to Delete Key\n                const deleteKeyInStorage = (storageKey) => {"
        t_end3 = "                deleteKeyInStorage('examRoomAllotment');\n                deleteKeyInStorage('examScribeAllotment');"
        t_idx1 = app.find(t_start3)
        t_idx2 = app.find(t_end3, t_idx1)
        if t_idx1 != -1 and t_idx2 != -1:
            app = app[:t_idx1] + del_new + app[t_idx2+len(t_end3):]
            print("deleteKeyInStorage patched")

    # 4. extract executeBulkDelete IDB Cleanup
    start4 = "            // Clean up Scribe Vaults and Dirty Flags\n            sessionsToDelete.forEach(async (s) => {"
    end4 = "                } catch(e) { console.error(\"Bulk IDB cleanup failed\", e); }\n            });\n        }"
    idx1 = temp.find(start4)
    idx2 = temp.find(end4, idx1)
    if idx1 != -1 and idx2 != -1:
        bulk_new = temp[idx1:idx2+len(end4)]
        
        t_start4 = "                    if(changed) localStorage.setItem(key, JSON.stringify(data));\n                }\n            });\n        }"
        t_idx1 = app.find(t_start4)
        if t_idx1 != -1:
            app = app.replace(t_start4, "                    if(changed) localStorage.setItem(key, JSON.stringify(data));\n                }\n            });\n\n" + bulk_new)
            print("executeBulkDelete patched")

    # 5. extract clearAllScribeAllotments
    start5 = "    window.clearAllScribeAllotments = function () {"
    end5 = "        alert(\"âœ… All scribe allotments for this session have been cleared.\");\n    };"
    idx1 = temp.find(start5)
    idx2 = temp.find(end5, idx1)
    if idx1 != -1 and idx2 != -1:
        clear_new = temp[idx1:idx2+len(end5)]
        
        t_start5 = "    window.clearAllScribeAllotments = function () {"
        t_end5 = "        alert(\"âœ… All scribe allotments for this session have been cleared.\");\n    };"
        t_idx1 = app.find(t_start5)
        t_idx2 = app.find(t_end5, t_idx1)
        if t_idx1 != -1 and t_idx2 != -1:
            app = app[:t_idx1] + clear_new + app[t_idx2+len(t_end5):]
            print("clearAllScribeAllotments patched")

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app)

if __name__ == '__main__':
    patch()
