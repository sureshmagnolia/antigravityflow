$content = Get-Content app.js -Raw -Encoding UTF8

# 4. clearAllScribeAllotments
$target4 = @"
    window.clearAllScribeAllotments = function () {
        if (isScribeAllotmentLocked) return alert("Scribe Allotment is Locked. Unlock first to clear."); 
        
        const count = Object.keys(currentScribeAllotment).length;
        if (count === 0) return alert("No allotments to clear.");

        if (!confirm(`Are you sure you want to CLEAR ALL ` + count + ` scribe allotments for this session? This cannot be undone.`)) return;

        // 1. Clear current session mapping
        currentScribeAllotment = {};

        // 2. Save to Local Storage
        const allAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        allAllotments[currentSessionKey] = currentScribeAllotment;
        localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(allAllotments));

        // 3. Sync & Refresh
        hasUnsavedScribes = true;
        if (typeof updateSyncStatus === 'function') {
            updateSyncStatus("Unsaved Changes", "warning");
        }
        renderScribeAllotmentList(currentSessionKey);

        alert("✅ All scribe allotments for this session have been cleared.");
    };
"@
$replacement4 = @"
    window.clearAllScribeAllotments = function () {
        if (isScribeAllotmentLocked) return alert("Scribe Allotment is Locked. Unlock first to clear."); 
        
        const count = Object.keys(currentScribeAllotment).length;
        if (count === 0) return alert("No allotments to clear.");

        if (!confirm(`Are you sure you want to CLEAR ALL ` + count + ` scribe allotments for this session? This cannot be undone.`)) return;

        // 1. Clear current session mapping
        currentScribeAllotment = {};

        // 🛡️ [VAULT UPGRADE]: Save to session-specific vault
        const sessionKey = window.currentSessionKey || (typeof allotmentSessionSelect !== 'undefined' ? allotmentSessionSelect.value : '');
        const vaultKey = `scrAllot_` + sessionKey.replace(/\s/g, '_');
        localStorage.setItem(vaultKey, JSON.stringify(currentScribeAllotment));

        // 2. Save back to legacy Local Storage for compatibility
        const allAllotments = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
        allAllotments[sessionKey] = currentScribeAllotment;
        localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(allAllotments));
        
        // 🛡️ [V3 IDB UPGRADE]: Clear IDB Vault
        try {
            saveScribeAllotmentIDB(sessionKey, currentScribeAllotment);
        } catch(e) { console.error("IDB clear failed", e); }
        hasUnsavedScribes = true;
        localStorage.setItem('hasUnsavedScribes_' + sessionKey.replace(/\s/g, '_'), 'true'); // Cross-script dirty flag
        if (typeof updateSyncStatus === 'function') {
            updateSyncStatus("Unsaved Changes", "warning");
        }
        renderScribeAllotmentList(sessionKey);

        // Force Drive Sync for Basic Users
        if (typeof window.triggerDriveAutoSync === 'function') window.triggerDriveAutoSync(true);

        alert("✅ All scribe allotments for this session have been cleared.");
    };
"@
# Note: Handled template literals with string concatenation or precise regex if they fail.
# Actually I'll use regex to bypass the template literal evaluation in PowerShell.

# Let's just use regex replace for target4 and target5
$content = $content -replace '(?s)    window\.clearAllScribeAllotments = function \(\) \{.*?    \};', $replacement4


# 5. executeBulkDelete IDB Cleanup
$target5 = @"
            auxKeys.forEach(key => {
                const raw = localStorage.getItem(key);
                if(raw) {
                    const data = JSON.parse(raw);
                    let changed = false;
                    sessionsToDelete.forEach(s => {
                        if(data[s]) { delete data[s]; changed = true; }
                    });
                    if(changed) localStorage.setItem(key, JSON.stringify(data));
                }
            });
        }
"@
$replacement5 = @"
            auxKeys.forEach(key => {
                const raw = localStorage.getItem(key);
                if(raw) {
                    const data = JSON.parse(raw);
                    let changed = false;
                    sessionsToDelete.forEach(s => {
                        if(data[s]) { delete data[s]; changed = true; }
                    });
                    if(changed) localStorage.setItem(key, JSON.stringify(data));
                }
            });

            // Clean up Scribe Vaults and Dirty Flags
            sessionsToDelete.forEach(async (s) => {
                const safeKey = s.replace(/\s/g, '_');
                localStorage.removeItem('scrAllot_' + safeKey);
                localStorage.removeItem('hasUnsavedScribes_' + safeKey);
                
                // 🛡️ [V3 IDB UPGRADE]: Clean IDB Vault
                try {
                    const db = await openExamDB();
                    const tx = db.transaction('scribeVault', 'readwrite');
                    tx.objectStore('scribeVault').delete(s);
                } catch(e) { console.error("Bulk IDB cleanup failed", e); }
            });
        }
"@
$content = $content.Replace($target5, $replacement5)

Set-Content app.js -Value $content -Encoding UTF8
