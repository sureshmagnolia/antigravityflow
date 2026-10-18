$content = Get-Content app.js -Raw -Encoding UTF8

# 1. loadScribeAllotment
$target1 = @"
    // NEW FUNCTION: This loads the scribe allotment data for the session
    function loadScribeAllotment(sessionKey) {
        // *** FIX: Ensure global scribe list is loaded before checking length ***
        if (globalScribeList.length === 0) {
            globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
        }
        // **********************************************************************

        if (sessionKey && globalScribeList.length > 0) {
            // Load the allotments for this session (dY>,? [V12.8 FIX]: Prioritize V1 Manual Saves over V2 Historical context)
            const v1 = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
            const v2 = JSON.parse(localStorage.getItem('examScribeAllotmentV2') || '{}');
            
            // Unify keys: Manual Save (v1) should always win over historical data (v2)
            const allAllotments = { ...v2, ...v1 }; 
            currentScribeAllotment = allAllotments[sessionKey] || {};

            // dY>,? [V12.8]: If we found data in V2 that isn't in V1, migrate it back to V1 for persistence
            if (v2[sessionKey] && !v1[sessionKey]) {
                v1[sessionKey] = v2[sessionKey];
                localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(v1));
            }

            scribeAllotmentListSection.classList.remove('hidden');
            renderScribeAllotmentList(sessionKey);
        } else {
            scribeAllotmentListSection.classList.add('hidden');
            if(scribeAllotmentList) scribeAllotmentList.innerHTML = "";
        }
    }
"@
$replacement1 = @"
    // NEW FUNCTION: This loads the scribe allotment data for the session
    async function loadScribeAllotment(sessionKey) {
        // *** FIX: Ensure global scribe list is loaded before checking length ***
        if (globalScribeList.length === 0) {
            globalScribeList = JSON.parse(localStorage.getItem(SCRIBE_LIST_KEY) || '[]');
        }
        // **********************************************************************

        if (sessionKey && globalScribeList.length > 0) {
            const vaultKey = `scrAllot_` + sessionKey.replace(/\s/g, '_');
            const isDirty = localStorage.getItem('hasUnsavedScribes_' + sessionKey.replace(/\s/g, '_')) === 'true';

            // 🛡️ [V3 IDB UPGRADE]: Multi-Tiered Load (Bidirectional Sync)
            // 1. Get from Legacy (The shared mirrors)
            const v1 = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
            const v2 = JSON.parse(localStorage.getItem('examScribeAllotmentV2') || '{}');
            const legacyData = v1[sessionKey] || v2[sessionKey] || null;

            // 2. Get from Private IDB (The Source of Truth)
            const dbData = await getScribeAllotmentIDB(sessionKey);

            // 3. Comparison Logic
            if (!isDirty && legacyData && JSON.stringify(legacyData) !== JSON.stringify(dbData)) {
                // External change detected (from V2 PC or Cloud Sync) -> Adoption
                console.log("🔄 V3: Adoption triggered. Syncing IDB from Legacy changes...");
                await saveScribeAllotmentIDB(sessionKey, legacyData);
                currentScribeAllotment = legacyData;
            } else {
                // Use DB if available, fallback to Legacy
                currentScribeAllotment = dbData || legacyData || {};
            }

            // Sync Local Cache (Vault) for UI speed
            try { localStorage.setItem(vaultKey, JSON.stringify(currentScribeAllotment)); } catch(e) {}

            scribeAllotmentListSection.classList.remove('hidden');
            renderScribeAllotmentList(sessionKey);
        } else {
            scribeAllotmentListSection.classList.add('hidden');
            if(scribeAllotmentList) scribeAllotmentList.innerHTML = "";
        }
    }
"@
$content = $content.Replace($target1, $replacement1)


# 2. saveScribeBtn logic
$target2 = @"
        // dY>,? [PERSISTENCE FIX]: Explicitly save to localStorage for Basic Users
        if (typeof SCRIBE_ALLOTMENT_KEY !== 'undefined') {
            const allScribeAllots = JSON.parse(localStorage.getItem(SCRIBE_ALLOTMENT_KEY) || '{}');
            allScribeAllots[sessionKey] = currentScribeAllotment;
            localStorage.setItem(SCRIBE_ALLOTMENT_KEY, JSON.stringify(allScribeAllots));
        }
"@
$replacement2 = @"
        // 🛡️ [PERSISTENCE FIX]: Explicitly save to localStorage for Basic Users
        if (typeof SCRIBE_ALLOTMENT_KEY !== 'undefined') {
            // 1. Try LocalStorage (Cache & Bridge) - Fail-safe
            try {
                // 🛡️ [VAULT UPGRADE]: Save to isolated vault
                const vaultKey = `scrAllot_` + sessionKey.replace(/\s/g, '_');
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
        }
"@
$content = $content.Replace($target2, $replacement2)


# 3. deleteKeyInStorage cleanup
$target3 = @"
                // 2. Helper to Delete Key
                const deleteKeyInStorage = (storageKey) => {
                    const raw = localStorage.getItem(storageKey);
                    if (!raw) return;
                    const data = JSON.parse(raw);
                    if (data[currentSession]) {
                        delete data[currentSession];
                        localStorage.setItem(storageKey, JSON.stringify(data));
                    }
                };

                // 3. Delete Associated Data
                deleteKeyInStorage('examRoomAllotment');
                deleteKeyInStorage('examScribeAllotment');
"@
$replacement3 = @"
                // 2. Helper to Delete Key
                const deleteKeyInStorage = async (storageKey) => {
                    const raw = localStorage.getItem(storageKey);
                    if (!raw) return;
                    const data = JSON.parse(raw);
                    if (data[currentSession]) {
                        delete data[currentSession];
                        localStorage.setItem(storageKey, JSON.stringify(data));
                    }
                    
                    // 🛡️ [V3 IDB UPGRADE]: Clean up isolated vaults & IDB
                    if (storageKey === 'examScribeAllotment') {
                        const vaultKey = `scrAllot_` + currentSession.replace(/\s/g, '_');
                        const dirtyKey = `hasUnsavedScribes_` + currentSession.replace(/\s/g, '_');
                        localStorage.removeItem(vaultKey);
                        localStorage.removeItem(dirtyKey);
                        
                        // IDB Deletion
                        try {
                            const db = await openExamDB();
                            const tx = db.transaction('scribeVault', 'readwrite');
                            tx.objectStore('scribeVault').delete(currentSession);
                        } catch(e) { console.error("IDB Cleanup failed", e); }
                    }
                };

                // 3. Delete Associated Data
                await deleteKeyInStorage('examRoomAllotment');
                await deleteKeyInStorage('examScribeAllotment');
"@
$content = $content.Replace($target3, $replacement3)


# Output the fixed content
Set-Content app.js -Value $content -Encoding UTF8
