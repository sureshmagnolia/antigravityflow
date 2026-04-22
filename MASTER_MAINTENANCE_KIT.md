# 🛠️ ExamFlow Master Maintenance & Recovery Kit

This document contains the "Emergency Tools" required to migrate, backup, and restore the ExamFlow ecosystem.  
**Location:** c:\Users\sures\OneDrive\Documents\Antigravity\SCR5\uocexam\MASTER_MAINTENANCE_KIT.md

---

## 📦 1. The Ultimate Backup (v3)
**Use this for:** Creating a 100% complete snapshot of your entire database (Staff, Sessions, Students, Attendance, and Settings).
**How to use:** Paste into the browser console on `index.html`.

```javascript
(async () => {
    try {
        console.log("🚀 Initializing ULTIMATE Backup (v3)...");
        const { doc, getDoc, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const db = window.firebase.db;
        const collegeId = localStorage.getItem('my_college_id');
        
        if (!collegeId) return alert("❌ Login first to run backup.");

        const backup = {
            timestamp: new Date().toISOString(),
            collegeId: collegeId,
            firestore: {
                collegeDoc: {},
                subcollections: {},
                publicSeating: {},
                globalWhitelist: null
            }
        };

        // 1. BACKUP: Main College Document
        console.log("📡 Downloading Admin Infrastructure...");
        const collegeSnap = await getDoc(doc(db, "colleges", collegeId));
        if (collegeSnap.exists()) backup.firestore.collegeDoc = collegeSnap.data();

        // 2. BACKUP: ALL Possible Sub-Collections
        const collections = ["sessions", "system_data", "student_data", "session_students", "data", "logs", "settings"];
        for (const colName of collections) {
            console.log(`📡 Fetching folder: ${colName}...`);
            const colRef = collection(db, "colleges", collegeId, colName);
            const colSnap = await getDocs(colRef);
            backup.firestore.subcollections[colName] = colSnap.docs.map(d => ({ id: d.id, data: d.data() }));
            console.log(`✅ SUCCESS: Found ${colSnap.size} documents in '${colName}'.`);
        }

        // 3. BACKUP: Public Student Portal Data
        console.log("📡 Discovering Public Student Seating...");
        const indexSnap = await getDoc(doc(db, 'public_seating', collegeId));
        if (indexSnap.exists()) {
            const indexData = indexSnap.data();
            backup.firestore.publicSeating[collegeId] = indexData;
            const sessionLinks = indexData.sessions || {};
            const docIds = Object.values(sessionLinks).map(s => s.docId).filter(id => Boolean(id));
            
            console.log(`📡 Downloading ${docIds.length} Public Student Payloads...`);
            for (const docId of docIds) {
                const sSnap = await getDoc(doc(db, 'public_seating', docId));
                if (sSnap.exists()) backup.firestore.publicSeating[docId] = sSnap.data();
            }
        }

        // 4. BACKUP: Global Whitelist (Super Admins)
        console.log("📡 Downloading Global Whitelist...");
        const whitelistSnap = await getDoc(doc(db, "global", "whitelist"));
        if (whitelistSnap.exists()) {
            backup.firestore.globalWhitelist = whitelistSnap.data();
        }

        // 5. DOWNLOAD
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ExamFlow_ULTIMATE_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        alert("🎉 ULTIMATE BACKUP COMPLETE!");
    } catch (e) { console.error("❌ Backup Failed:", e); }
})();
```

---

## 🆘 2. The Ultimate Restore (v3)
**Use this for:** Recovering your entire system from an Ultimate Backup JSON file.
**How to use:** Paste into the browser console on `index.html`.

```javascript
(async () => {
    try {
        console.log("🚀 Initializing ULTIMATE Restore (v3)...");
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const db = window.firebase.db;
        const currentCollegeId = localStorage.getItem('my_college_id');
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = async (event) => {
                const backup = JSON.parse(event.target.result);
                if (!backup.firestore) return alert("❌ Invalid format.");
                if (prompt(`⚠️ OVERWRITE College ID: ${currentCollegeId}?\nType 'CONFIRM' to proceed:`) !== "CONFIRM") return;

                console.log("🛠️ Restoring Main Settings...");
                await setDoc(doc(db, "colleges", currentCollegeId), backup.firestore.collegeDoc, { merge: true });

                for (const [colName, docs] of Object.entries(backup.firestore.subcollections || {})) {
                    console.log(`📦 Restoring ${docs.length} docs in ${colName}...`);
                    for (const docObj of docs) {
                        await setDoc(doc(db, "colleges", currentCollegeId, colName, docObj.id), docObj.data, { merge: true });
                    }
                }

                console.log("📡 Restoring Public Seating...");
                for (const [docId, data] of Object.entries(backup.firestore.publicSeating || {})) {
                    await setDoc(doc(db, "public_seating", docId), data, { merge: true });
                }

                if (backup.firestore.globalWhitelist) {
                    console.log("🌍 Restoring Global Whitelist...");
                    await setDoc(doc(db, "global", "whitelist"), backup.firestore.globalWhitelist, { merge: true });
                }

                alert("🎉 SYSTEM FULLY RESTORED!");
                window.location.reload();
            };
            reader.readAsText(file);
        };
        input.click();
    } catch (e) { console.error("❌ Restore Failed:", e); }
})();
```

---

## ⚙️ 3. Global Configuration Sync
**Use this for:** Pulling specific settings (Targets, Vacation Dates, Script URLs) from the old US database.

```javascript
(async () => {
    try {
        const { initializeApp, getApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
        const { getFirestore, doc, getDoc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        
        const oldConfig = { apiKey: "AIzaSyBu1CD5Kv55e0avayUUyAbDFC_ek4lEgJM", authDomain: "examflow-de08f.firebaseapp.com", projectId: "examflow-de08f" };
        const oldApp = getApps().length > 1 ? getApp("OldApp") : initializeApp(oldConfig, "OldApp");
        const oldDb = getFirestore(oldApp);
        const newDb = window.firebase.db;
        const newCollegeId = localStorage.getItem('my_college_id');
        const oldCollegeId = "VuNPiQvJoeqpi0KaYM82";
        
        const collegeSnap = await getDoc(doc(oldDb, "colleges", oldCollegeId));
        if (!collegeSnap.exists()) return alert("Old DB not found!");
        
        const masterData = collegeSnap.data();
        const configKeys = ["examCollegeName", "invigSettings", "invigDesignations", "invigRoles", "invigGoogleScriptUrl", "invigDepartments", "invigVacationConfig", "invigGlobalTarget", "invigGuestTarget", "invigVacationTarget", "invigVacationDutyDates", "allowedUsers", "staffAccessList", "examStaffData"];
        const updatePayload = {};
        configKeys.forEach(key => { if (masterData[key] !== undefined) updatePayload[key] = masterData[key]; });

        await setDoc(doc(newDb, "colleges", newCollegeId), updatePayload, { merge: true });
        alert("✅ CONFIG SYNC COMPLETE!");
        window.location.reload();
    } catch (e) { console.error(e); }
})();
```

---

## 👤 4. Staff Visibility Fixer
**Use this for:** When staff exist in the database but are not appearing in the list.

```javascript
(async () => {
    const { doc, getDoc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const db = window.firebase.db;
    const collegeId = localStorage.getItem('my_college_id');
    const docRef = doc(db, "colleges", collegeId);
    const snap = await getDoc(docRef);
    if (snap.exists() && typeof snap.data().examStaffData === 'object') {
        await setDoc(docRef, { examStaffData: JSON.stringify(snap.data().examStaffData) }, { merge: true });
        alert("✅ Staff list fixed!");
        window.location.reload();
    }
})();
```
