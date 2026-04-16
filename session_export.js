/**
 * ExamFlow: Fully-Integrated Offline Session Export (Premium Edition)
 * Replicates Reports 1-6 exactly from the main app environment.
 */

const SESSION_EXPORT_JS = {
    LOGO_SVG: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIyIiB5PSIzIiB3aWR0aD0iMjAiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxsaW5lIHgxPSI4IiB5MT0iMjEiIHgyPSIxNiIgeTI9IjIxIj48L2xpbmU+PGxpbmUgeDE9IjEyIiB5MT0iMTciIHgyPSIxMiIgeTI9IjIxIj48L2xpbmU+PC9zdmc+`,

    exportSession: function(sessionKey) {
        if (!sessionKey) return alert("Please select a session first.");

        // 🛡️ ROBUST DATA SPLIT: Handles varying space-pipe formats
        const [date, time] = sessionKey.split('|').map(x => x.trim());
        const streamSelect = document.getElementById('reports-stream-select');
        const stream = streamSelect ? streamSelect.value : 'Regular';
        const collegeName = localStorage.getItem('examCollegeName') || 'ExamFlow Institution';

        // 🛡️ CASE-INSENSITIVE FILTER: Handles both s.Date and s.date from different data sources
        const allStudents = (typeof window.getMyAllStudentData === 'function') ? window.getMyAllStudentData() : [];
        const sessionStudents = allStudents.filter(s => {
            const sDate = (s.Date || s.date || '').trim();
            const sTime = (s.Time || s.time || '').trim();
            return sDate === date && sTime === time;
        });
        
        if (sessionStudents.length === 0) {
            console.error("Exporter Filter Failed:", { targetDate: date, targetTime: time, sample: allStudents[0] });
            return alert("❌ No matching student data found! Ensure the dashboard is showing students for this session before exporting.");
        }


        // 🛡️ PREFER LIVE BRIDGE: Get QP codes from memory if dashboard is active
        const allQPCodes = (typeof window.getMyQPCodes === 'function') ? window.getMyQPCodes() : JSON.parse(localStorage.getItem('examQPCodes') || '{}');
        const allAllotments = JSON.parse(localStorage.getItem('examRoomAllotment') || '{}');

        // 🛡️ UNIVERSAL SESSION MATCHER: Finds data by Label, ID, or Fuzzy Match
        const getSessionData = (masterMap, targetLabel) => {
            if (!masterMap || typeof masterMap !== 'object') return null;
            if (masterMap[targetLabel]) return masterMap[targetLabel];
            
            // 1. Try Fuzzy Space-Agnostic Match (e.g., '30.03 | 10:00' matches '30.03|10:00')
            const cleanTarget = targetLabel.replace(/\s/g, '');
            const fuzzyKey = Object.keys(masterMap).find(k => k.replace(/\s/g, '') === cleanTarget);
            if (fuzzyKey) return masterMap[fuzzyKey];

            // 2. Try ID Patterns (Checks if data is stored by Firebase ID instead of Label)
            const datePart = targetLabel.split('|')[0].trim();
            const idKey = datePart.split('.').reverse().join(''); // Converts 30.03.2026 to 20260330
            const foundIdKey = Object.keys(masterMap).find(k => k.includes(idKey));
            return foundIdKey ? masterMap[foundIdKey] : null;
        };

        const sessionQPCodes = getSessionData(allQPCodes, sessionKey) || {};
        const sessionAllotment = getSessionData(allAllotments, sessionKey) || [];
        const sessionAbsentees = getSessionData(JSON.parse(localStorage.getItem('examAbsenteeList') || '{}'), sessionKey) || {};
        const sessionScribes = getSessionData(JSON.parse(localStorage.getItem('examScribeAllotment') || '{}'), sessionKey) || {};
        const sessionInvigs = getSessionData(JSON.parse(localStorage.getItem('examInvigilatorMapping') || '{}'), sessionKey) || {};

        const scribeList = JSON.parse(localStorage.getItem('examScribeList') || '[]');
        const roomConfig = (typeof window.getMyRoomConfig === 'function') ? window.getMyRoomConfig() : {};


        const snapshot = {
            meta: { collegeName, date, time, stream, 
                   generatedAt: new Date().toLocaleString(),
                   examName: (typeof getExamName === 'function') ? getExamName(date, time, stream) : 'Examination Session' },
            students: sessionStudents,
            allotment: sessionAllotment,
            qpCodes: sessionQPCodes,
            absentees: sessionAbsentees,
            scribes: Object.entries(sessionScribes).map(([regNo, room]) => {
                const scribeInfo = scribeList.find(s => s.regNo === regNo) || {};
                const studentInfo = sessionStudents.find(s => (s['Register Number'] || s.regNo) === regNo) || {};
                return { 
                    regNo, 
                    room, 
                    scribeName: scribeInfo.name || 'Not Available',
                    studentName: studentInfo.Name || studentInfo.name || 'Unknown student'
                };
            }),

            invigilators: sessionInvigs,
            roomConfig: roomConfig
        };


        const htmlContent = this.getTemplate(snapshot);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ExamFlow_${date.replace(/\./g, '-')}_${time.replace(/:/g, '-')}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    getTemplate: function(data) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${data.meta.collegeName} - Portable Session Document</title>
    <style>
        :root { --p: #1e3a8a; --bg: #f3f4f6; --txt: #111827; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--txt); margin: 0; padding: 20px; }
        .no-p { max-width: 1000px; margin: 0 auto 30px; display: flex; flex-direction: column; gap: 20px; }
        header { background: white; padding: 30px; border-radius: 15px; border: 1px solid #ddd; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .grid-6 { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .btn { cursor:pointer; background: var(--p); color:white; border:none; padding:15px; border-radius:10px; font-weight:bold; font-size:14px; text-align:left; transition: 0.2s; }
        .btn:hover { filter: contrast(1.2); transform: translateY(-2px); }
        .qp-box { background:white; padding:20px; border-radius:12px; border:1px solid #ddd; }
        input { width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:monospace; font-weight:bold; color:var(--p); }

        #viewer { margin-top: 40px; }
        .a4 { background:white; width:210mm; min-height:297mm; padding:15mm; margin:0 auto 20px; box-shadow:0 0 20px rgba(0,0,0,0.1); box-sizing:border-box; position:relative; }
        
        @media print {
            html, body { height: 100%; margin: 0 !important; padding: 0 !important; }
            .no-p { display: none !important; }
            /* Strict pagination to prevent single-page overflow */
            .a4 { 
                box-shadow: none !important; 
                border: none !important; 
                margin: 0 !important; 
                width: 100% !important; 
                padding: 10mm !important; 
                height: auto !important;
                min-height: auto !important; 
                break-inside: auto;
                break-after: page; 
                page-break-after: always; 
            }
            .a4:last-of-type { break-after: auto; page-break-after: auto; }
            @page { size: A4 portrait; margin: 0; }
        }


        /* Report Styles */
        .rt { width: 100%; border-collapse: collapse; font-family: serif; font-size: 11pt; }
        .rt th { border: 1px solid #000; padding: 8px; background: #f0f0f0; text-transform: uppercase; }
        .rt td { border: 1px solid #000; padding: 6px 8px; }
        .rh { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .rh h1 { font-size: 18pt; margin: 0; text-transform: uppercase; }
        .rf { margin-top: 40px; display: flex; justify-content: space-between; font-weight: bold; }

        /* QP Boxes Styling (Report 2) */
        .qp-room-box { border: 1px solid #444; padding: 6px; background: #fff; display: flex; align-items: center; justify-content: space-between; border-radius: 4px; box-shadow: 1px 1px 3px rgba(0,0,0,0.1); }
        .qp-room-count { font-size: 14pt; font-weight: 900; }
        .qp-room-check { width: 16px; height: 16px; border: 2px solid #000; }

        /* Stickers Grid */
        .sticker-page { padding: 5mm!important; display: flex; flex-direction: column; justify-content: space-between; height: 297mm; box-sizing: border-box; }
        .sticker { border: 2px dashed #000; padding: 10px; height: 135mm; box-sizing: border-box; display: flex; flex-direction: column; }
        /* Highlighting Logic */
        .scribe-row-highlight { background-color: #f1f5f9 !important; font-weight: bold; }
    </style>
</head>
<body>
    <div class="no-p">
        <header>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h1 style="margin:0; color:var(--p)">📥 Portable Session Document</h1>
                <button onclick="window.print()" class="btn" style="background:#10b981; padding:10px 20px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);">🖨️ Print Report</button>
            </div>
            <div style="display:flex; gap:10px; margin-top:15px">
                <span id="p-date" style="background:#eff6ff; padding:5px 15px; border-radius:20px; font-weight:bold; color:#1e40af">${data.meta.date}</span>
                <span style="background:#eff6ff; padding:5px 15px; border-radius:20px; font-weight:bold; color:#1e40af">${data.meta.time}</span>
                <span style="background:#eff6ff; padding:5px 15px; border-radius:20px; font-weight:bold; color:#1e40af">${data.students.length} Students</span>
            </div>
        </header>

        <div class="qp-box">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px">
                <h3 style="margin:0">1. Question Paper Codes</h3>
                <div>
                    <button onclick="fromClipboard()" class="btn" style="padding:5px 10px; font-size:12px; margin-right:5px; background:#4b5563">📋 Sync from Clipboard</button>
                    <button onclick="saveStateToFile()" class="btn" style="padding:5px 10px; font-size:12px; background:#059669">💾 Save Codes to File</button>
                </div>
            </div>

            <table style="width:100%; border-collapse:collapse" id="qt">
                <tbody id="qb"></tbody>
            </table>
        </div>

        <div class="grid-6">
            <button class="btn" onclick="render('r1')">📄 1. QP Summary Report</button>
            <button class="btn" onclick="render('r2')">📦 2. QP Dist. (Boxed)</button>
            <button class="btn" onclick="render('r3')">🏠 3. Room-wise Seating</button>
            <button class="btn" onclick="render('r4')">📋 4. Notice Board (2-Col)</button>
            <button class="btn" onclick="render('r5')">🏷️ 5. Room Stickers (2/pg)</button>
            <button class="btn" onclick="render('r6')">✍️ 6. Scribe Proforma</button>
            <button class="btn" onclick="render('r7')">🤝 7. Scribe Assistance Summary</button>
        </div>
        
        <div style="display:flex; justify-content:center; padding-top:10px; border-top:1px solid #ddd;">
            <button onclick="window.print()" class="btn" style="background:#10b981; padding:12px 30px; font-size:16px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);">
                🖨️ Print Generated Report
            </button>
        </div>
    </div>

    <div id="viewer"></div>


    <script>
        // 🛡️ TEMPLATE SHIELD: Prevents special characters in data from crashing the HTML script block
        const D = ${JSON.stringify(data).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')};
        function init() {
            const b = document.getElementById('qb');
            const courses = [...new Set(D.students.map(s => s.Course + '|' + (s.Stream || 'Regular')))];
            courses.forEach(c => {
                const [code, stream] = c.split('|');
                const row = document.createElement('tr');
                
                // 🛡️ KEY UNIFIER: Handles both Raw text and Base64 encoded keys (cleaned)
                const encodedKey = btoa(unescape(encodeURIComponent(c)));
                const qpValue = D.qpCodes[encodedKey] || D.qpCodes[c] || '';

                row.innerHTML = '<td style="padding:5px; border-bottom:1px solid #eee">' + code + ' (' + stream + ')</td>' + 
                    '<td style="padding:5px; border-bottom:1px solid #eee"><input type="text" data-key="' + c + '" value="' + qpValue + '" onchange="D.qpCodes[\\'' + c + '\\']=this.value"></td>';

                b.appendChild(row);
            });
        }
        init();

        async function fromClipboard() {
            try {
                const text = await navigator.clipboard.readText();
                if (!text || text.trim().length === 0) return alert("Clipboard is empty.");

                const rawPrefix = prompt("Enter alphabetical prefix for these QP Codes (e.g. K, Z) to auto-prepend, or leave empty to skip:", "");
                if (rawPrefix === null) return; 
                const prefix = rawPrefix.trim().toUpperCase();

                const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
                const parsedPairs = [];

                lines.forEach(line => {
                    const tabParts = line.split('\\t').map(p => p.trim()).filter(p => p);
                    const dashParts = line.split(/\\s+-\\s+/).map(p => p.trim()).filter(p => p);
                    const commaParts = line.split(',').map(p => p.trim()).filter(p => p);

                    let searchString = null, qpCode = null;

                    if (tabParts.length >= 4 && line.includes('--(')) {
                        qpCode = tabParts[0]; 
                        searchString = tabParts[1].toUpperCase(); 
                    } else if (tabParts.length >= 2) {
                        searchString = tabParts[0].toUpperCase();
                        qpCode = tabParts[tabParts.length - 1]; 
                    } else if (dashParts.length === 2) {
                        searchString = dashParts[0].toUpperCase();
                        qpCode = dashParts[1];
                    } else if (commaParts.length >= 2) {
                        searchString = commaParts[0].toUpperCase();
                        qpCode = commaParts[commaParts.length - 1];
                    }

                    if (searchString && qpCode && qpCode !== searchString) {
                        let finalQpCode = qpCode.trim().toUpperCase().replace(/\\s+/g, '');
                        if (prefix && !finalQpCode.startsWith(prefix)) {
                            finalQpCode = prefix + finalQpCode;
                        }
                        
                        parsedPairs.push({
                            searchText: searchString, 
                            code: finalQpCode,
                            isEde: finalQpCode.endsWith('A')
                        });
                    }
                });

                let matched = 0;
                document.querySelectorAll('#qt input').forEach(input => {
                    const keyParts = input.dataset.key.split('|');
                    const uiCourseName = keyParts[0].trim().toUpperCase();
                    const streamName = (keyParts[1] || "").toUpperCase();
                    const isEdeStream = streamName.includes("EDE");
                    
                    let validPairs = parsedPairs.filter(p => p.isEde === isEdeStream);
                    if (validPairs.length === 0) validPairs = parsedPairs;

                    let bestMatch = validPairs.find(p => p.searchText.includes(uiCourseName) || uiCourseName.includes(p.searchText));

                    if (!bestMatch) {
                        const words = uiCourseName.split(/[\\s,.-]+/).filter(w => w.length > 2);
                        if (words.length > 0) {
                            let bestScore = 0;
                            validPairs.forEach(p => {
                                let score = 0;
                                words.forEach(w => { if (p.searchText.includes(w)) score++; });
                                if (score > bestScore) {
                                    bestScore = score;
                                    bestMatch = p;
                                }
                            });
                            if (bestScore < 1) bestMatch = null; 
                        }
                    }

                    if (bestMatch) {
                        input.value = bestMatch.code;
                        D.qpCodes[input.dataset.key] = bestMatch.code;
                        matched++;
                    }
                });

                if (matched > 0) alert("✨ Successfully matched and updated " + matched + " QP codes using Fuzzy Logic!");
                else alert("Could not find any matches for the courses in this session.");
                
            } catch(e) { 
                console.error(e); 
                alert("Clipboard access denied or format error."); 
            }
        }


        // --- NEW: Self-Mutating HTML Saver ---
        function saveStateToFile() {
            // 1. Clear viewer on current screen to save memory
            document.getElementById('viewer').innerHTML = '';
            
            // 2. Clone the current document's source structure
            const docClone = document.documentElement.cloneNode(true);
            
            // 3. ERASER FIX: Strip generated outputs from the clone before saving
            // This prevents duplication since the init() script rebuilds them on open.
            docClone.querySelector('#qb').innerHTML = '';
            docClone.querySelector('#viewer').innerHTML = '';

            // 4. Locate and rewrite the 'const D =' variable block in the raw string
            const docHtml = docClone.outerHTML;
            const newDataString = 'const D = ' + JSON.stringify(D) + ';';
            const updatedHtml = '<!DOCTYPE html>\\n' + docHtml.replace(/const D = \\{.*?\\};/s, newDataString);
            
            // 5. Trigger download of the new self-contained file
            const blob = new Blob([updatedHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = D.meta.date.replace(/\\./g, '-') + '_' + D.meta.time.replace(/:/g, '') + '_[Updated].html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert("✅ Updated HTML file has been downloaded.\\n\\nYou can now send this new file to other computers; the QP codes are permanently saved inside it!");
        }

    function render(type) {
    // 🛡️ QP KEY UNIFIER: Handles both Raw and Base64 Encoded keys
    const getActualQPValue = (course, stream) => {
        const rawKey = course + '|' + (stream || 'Regular');
        const encodedKey = btoa(unescape(encodeURIComponent(rawKey)));
        return D.qpCodes[encodedKey] || D.qpCodes[rawKey] || 'N/A';
    };

            const v = document.getElementById('viewer'); v.innerHTML = '';
            
            // --- 🎨 SHARED HELPERS ---
            const heading = (title, hall, exam, page) => {
               if (!page) page = 1;
               const examTitle = exam ? '<div style="font-size: 14pt; font-weight: bold; margin: 2px 0; text-align:center;">' + exam + '</div>' : '';
               const hallInfo = hall ? '<h2 style="margin: 2px 0; text-align:center;">Hall: ' + hall + ' &nbsp;|&nbsp; ' + D.meta.date + ' &nbsp;|&nbsp; ' + D.meta.time + '</h2>' : 
                                     '<h2 style="margin: 2px 0; text-align:center;">' + D.meta.date + ' | ' + D.meta.time + ' | ' + title + '</h2>';
               return '<div class="rh">' +
                  '<div style="position: absolute; top: 15mm; left: 15mm; font-weight: bold;">Page ' + page + '</div>' +
                  '<h1>' + D.meta.collegeName + '</h1>' +
                  examTitle +
                  hallInfo +
               '</div>';
            };

            const footer = () => '<div class="rf"><span>Date: ' + D.meta.date + '</span><span>Chief Superintendent Signature</span></div>';

            const getSmartName = (name) => {
                let clean = name.replace(/\[.*?\]/g, '').replace(/\s-\s$/, '').trim();
                const w = clean.split(/\s+/);
                return w.length <= 4 ? clean : w.slice(0, 3).join(' ') + ' ... ' + w[w.length -1];
            };

            // --- 📄 REPORT 1: QP SUMMARY (STREAM-WISE) ---
            if (type === 'r1') {
                const p = createPage();
                let contentHtml = '';
                
                // 1. Group by Stream
                const streams = {};
                D.students.forEach(s => {
                    const st = s.Stream || 'Regular';
                    if (!streams[st]) streams[st] = {};
                    streams[st][s.Course] = (streams[st][s.Course] || 0) + 1;
                });

                // 2. Sort Streams (Regular first)
                const sortedStreams = Object.keys(streams).sort((a, b) => {
                    if (a === 'Regular') return -1;
                    if (b === 'Regular') return 1;
                    return a.localeCompare(b);
                });

                sortedStreams.forEach(stName => {
                    const courses = streams[stName];
                    let totalInStream = 0;
                    let tableRows = '';
                    
                    Object.entries(courses).sort().forEach(([c, n], i) => {
                        totalInStream += n;
                        tableRows += '<tr><td>' + (i + 1) + '</td><td>' + c + '</td><td style="text-align:center; font-weight:bold">' + n + '</td></tr>';
                    });

                    contentHtml += '<h3 style="margin-top:20px; border-bottom:2px solid #000; display:inline-block">Stream: ' + stName + '</h3>' +
                        '<table class="rt" style="margin-bottom:20px"><thead><tr><th>SL</th><th style="width:70%">COURSE NAME</th><th>COUNT</th></tr></thead>' +
                        '<tbody>' + tableRows + '</tbody>' +
                        '<tfoot><tr><td colspan="2" style="text-align:right"><b>Total (' + stName + '):</b></td><td style="text-align:center"><b>' + totalInStream + '</b></td></tr></tfoot>' +
                        '</table>';
                });

                p.innerHTML = heading('QUESTION PAPER SUMMARY', '', D.meta.examName) + contentHtml + footer();
                v.appendChild(p);
            }


            // --- 📦 REPORT 2: QP DISTRIBUTION ---
            if (type === 'r2') {
                const p = createPage();
                p.innerHTML = heading('QP DISTRIBUTION SUMMARY', '', D.meta.examName);
                const map = {};
                D.allotment.forEach(room => {
                    room.students.forEach(s => {
                        const fs = D.students.find(x => x['Register Number'] === (s.RegisterNo || s['Register Number']));
                        const stream = room.stream || 'Regular';
                        const paperKey = btoa(unescape(encodeURIComponent(fs.Course + '|' + stream)));
                        if(!map[paperKey]) map[paperKey] = { title: fs.Course, stream: stream, qp: D.qpCodes[fs.Course+'|'+stream] || 'N/A', rooms: {} };
                        map[paperKey].rooms[room.roomName] = (map[paperKey].rooms[room.roomName] || 0) + 1;
                    });
                });

                Object.values(map).sort((a,b) => a.title.localeCompare(b.title)).forEach(info => {
                    let boxes = '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:8px">';
                    const sortedRooms = Object.keys(info.rooms).sort((a,b) => (D.roomConfig[a]?.serial || 0) - (D.roomConfig[b]?.serial || 0));
                    sortedRooms.forEach(r => {
                        let loc = (D.roomConfig[r]?.location || "");
                        const words = loc.split(' ');
                        const displayLoc = words.length > 2 ? words.slice(0,2).join(' ') + '..' : loc;
                        
                        // Use Serial Number to match Core App (e.g., Room #23)
                        const serialNo = D.roomConfig[r]?.serial || '-';
                        
                        boxes += '<div class="qp-room-box">' +
                           '<div style="display:flex; align-items:baseline; overflow:hidden">' +
                              '<span style="font-size:16pt; font-weight:900; margin-right:4px">' + info.rooms[r] + '</span>' +
                              '<span style="font-size:9px; font-weight:bold; color:#666; margin-right:8px">Nos</span>' +
                              '<span style="color:#ddd; margin-right:8px">|</span>' +
                              '<span style="font-weight:bold; font-size:11pt; white-space:nowrap">Room #' + serialNo + '</span>' +
                              '<span style="font-size:9px; margin-left:4px; color:#666">' + (displayLoc ? '('+displayLoc+')' : '') + '</span>' +
                           '</div><div class="qp-room-check"></div></div>';
                    });

                    p.innerHTML += '<div style="margin-top:15px; border-bottom:1px solid #000; padding:4px; display:flex; justify-content:space-between">' +
                        '<span><b>' + info.title + '</b> (' + info.stream + ')</span>' +
                        '<span>QP: <b>' + info.qp + '</b> | Total: <b>' + Object.values(info.rooms).reduce((a,b)=>a+b,0) + '</b></span>' +
                    '</div>' + boxes + '</div>';
                });
                v.appendChild(p);
            }

            // --- 🏠 REPORT 3: ROOM-WISE ---
            if (type === 'r3') {
                D.allotment.forEach(room => {
                    const page1 = createPage();
                    const st = room.students.sort((a,b) => (a.seat || 0) - (b.seat || 0));
                    const stats = {};
                    st.forEach(s => {
                        const fs = D.students.find(x => x['Register Number'] === (s.RegisterNo || s['Register Number']));
                        const key = fs.Course + '|' + (room.stream || 'Regular');
                        if(!stats[key]) stats[key] = { total: 0, scribe: 0 };
                        stats[key].total++;
                        if(D.scribes.some(sc => sc.regNo === (s.RegisterNo || s['Register Number']))) stats[key].scribe++;
                    });

                    let summ = ''; let gTot = 0;
                    Object.entries(stats).forEach(([k, v]) => {
                        const [c, stream] = k.split('|');
                        const qp = D.qpCodes[k] || "N/A";
                        const bks = v.total - v.scribe; gTot += bks;
                        summ += '<tr><td>' + qp + '</td><td style="font-size:8.5pt">' + getSmartName(c) + (v.scribe > 0 ? ' <b>(' + v.scribe + ' Scribes)</b>' : '') + '</td><td style="text-align:center">' + bks + '</td></tr>';
                    });

                    // --- ADVANCED ACCOUNTING FOOTER ---
                    let uniqueQPs = [...new Set(Object.keys(stats).map(k => D.qpCodes[k] || 'N/A'))].filter(q => q !== 'N/A');
                    let qpChecklist = '';
                    uniqueQPs.forEach(q => { qpChecklist += '<span style="margin-right:15px">' + q + ': ____</span>'; });

                    const cFoot = '<div style="margin-top:10px; font-size:9pt"><b>Course Summary:</b>' +
                        '<table class="rt" style="margin-bottom:8px"><thead style="background:#f0f0f0"><tr><th>QP Code</th><th>Course</th><th>Count</th></tr></thead><tbody>' + summ + 
                        '<tr><td colspan="2" style="text-align:right"><b>Total (Excl. Scribes):</b></td><td style="text-align:center"><b>' + gTot + '</b></td></tr></tbody></table>' +
                        '<div style="border:1px solid #000; padding:5px; margin-bottom:8px">' +
                            '<div style="display:flex; justify-content:space-between; border-bottom:1px dotted #ccc; padding-bottom:3px; margin-bottom:3px">' +
                                '<span>Booklets Received: ________</span><span>Used: ________</span><span>Balance Returned: ________</span>' +
                            '</div>' +
                            '<div><b>Written Booklets (QP Wise):</b> ' + qpChecklist + '</div>' +
                        '</div>' +
                        '<div style="display:flex; justify-content:space-between; align-items:flex-end">' +
                            '<span style="font-size:8pt">* = Scribe Assistance</span>' +
                            '<div style="width:250px; text-align:center">' +
                                '<div style="border-top:1px solid #000; padding-top:4px">' + (D.invigilators[room.roomName] || 'Name & Signature of Invigilator') + '</div>' +
                            '</div>' +
                        '</div></div>';


                    // --- 🏠 REPORT 3 REFACTORED: 1:1 CORE PARITY ---
                    const renderTableRows = (list, isPageTwo) => {
                        let rows = '';
                        let prevC = '';
                        list.forEach(s => {
                            const fs = D.students.find(x => x['Register Number'] === (s.RegisterNo || s['Register Number']));
                            const reg = s.RegisterNo || s['Register Number'];
                            const isScr = D.scribes.some(sc => sc.regNo === reg);
                            const qp = getActualQPValue(fs.Course, room.stream);
                            
                            // Apply Deep Charcoal Style for Scribes
                            const rowClass = isScr ? 'class="scribe-row-highlight"' : '';
                            const scribeRemark = isScr ? 'SCRIBE' : '';

                            // Ditto marks for Course
                            const courseDisplay = (fs.Course === prevC) ? '<div style="text-align:center">"</div>' : 
                                '<div style="font-size:8.5pt"><b>' + qp + '</b> ' + getSmartName(fs.Course) + '</div>';
                            prevC = fs.Course;

                            // RegNo Font Sizing
                            const fSize = (/[a-zA-Z]/.test(reg)) ? '9pt' : (reg.length > 7 ? '11pt' : '12pt');

                            rows += '<tr ' + rowClass + ' style="height:35px">' +
                                '<td style="text-align:center">' + s.seat + (isScr ? '*' : '') + '</td>' +
                                '<td>' + courseDisplay + '</td>' +
                                '<td style="font-weight:bold; font-size:' + fSize + '">' + reg + '</td>' +
                                '<td>' + (fs?.Name || '') + '</td>' +
                                '<td style="text-align:center; font-weight:bold; font-size:8pt">' + scribeRemark + '</td>' +
                                '<td></td></tr>';
                        });
                        return rows;
                    };

                    const tHead = '<table class="rt"><thead><tr><th style="width:8%">SEAT</th><th style="width:30%">COURSE (QP)</th><th style="width:18%">REG NO</th><th style="width:24%">NAME</th><th style="width:10%">REMARK</th><th style="width:10%">SIGN</th></tr></thead><tbody>';

                    // Page 1
                    page1.innerHTML = heading('ROOM REPORT', room.roomName, D.meta.examName, 1) + 
                        '<div style="margin-bottom:10px"><b>Location:</b> ' + (D.roomConfig[room.roomName]?.location || 'Main Block') + '</div>' +
                        tHead + renderTableRows(st.slice(0, 20)) + '</tbody></table>' + 
                        (st.length <= 20 ? cFoot : '<div style="text-align:right; font-size:8pt">Continued on Page 2...</div>');
                    v.appendChild(page1);

                    // Page 2 (if exists)
                    if(st.length > 20) {
                        const p2 = createPage();
                        p2.innerHTML = heading('ROOM REPORT', room.roomName, D.meta.examName, 2) + 
                            tHead + renderTableRows(st.slice(20)) + '</tbody></table>' + cFoot;
                        v.appendChild(p2);
                    }

                });
            }

            // --- 📋 REPORT 4: SEATING DETAILS (PAPER-WISE GROUPING) ---
            if (type === 'r4') {
                const p = createPage();
                p.innerHTML = heading('SEATING DETAILS (PAPER-WISE)', '', D.meta.examName);
                
                // 1. Enrich data with Room Info for sorting
                const enriched = D.students.map(s => {
                    const room = D.allotment.find(x => x.students.some(st => (st.RegisterNo || st['Register Number']) === s['Register Number']));
                    const seat = room?.students.find(x => (x.RegisterNo || x['Register Number']) === s['Register Number'])?.seat || '-';
                    const loc = (D.roomConfig[room?.roomName]?.location || room?.roomName || '-');
                    const rSerial = (D.roomConfig[room?.roomName]?.serial || 999);
                    return { ...s, roomName: room?.roomName, loc: loc, seat: seat, rSerial: rSerial };
                });

                // 2. Sort by Course -> Room Serial -> Register Number
                enriched.sort((a,b) => {
                    if(a.Course !== b.Course) return a.Course.localeCompare(b.Course);
                    if(a.rSerial !== b.rSerial) return a.rSerial - b.rSerial;
                    return a['Register Number'].localeCompare(b['Register Number']);
                });

                    // --- HARD PAGINATION ENGINE (90 Students Per A4 Page) ---
                const CHUNK_SIZE = 90; 
                for(let i=0; i < enriched.length; i += CHUNK_SIZE) {
                    const chunk = enriched.slice(i, i + CHUNK_SIZE);
                    const pg = createPage();
                    pg.innerHTML = heading('SEATING DETAILS (PAPER-WISE)', '', D.meta.examName, Math.floor(i/CHUNK_SIZE)+1);
                    
                    const mid = Math.ceil(chunk.length / 2);
                    
                    const getTable = (list) => {
                         let rowsHtml = '';
                         let prevCourse = '';
                         let tempRows = [];
                         
                         // Calculate rowspans cleanly within this specific column slice
                         list.forEach(item => {
                             const isNewCourse = item.Course !== prevCourse;
                             tempRows.push({ ...item, isNewCourse, skip: false, span: 1 });
                             prevCourse = item.Course;
                         });

                         for(let j=0; j < tempRows.length; j++) {
                             if(tempRows[j].skip) continue;
                             for(let k=j+1; k < tempRows.length; k++) {
                                 if(tempRows[k].isNewCourse || tempRows[k].loc !== tempRows[j].loc) break;
                                 tempRows[j].span++;
                                 tempRows[k].skip = true;
                             }
                         }

                         tempRows.forEach(r => {
                             if(r.isNewCourse) {
                                 rowsHtml += '<tr><td colspan="4" style="background:#ddd; font-weight:bold; font-size:7.5pt; padding:2px 4px">' + r.Course + '</td></tr>';
                             }
                             // DYNAMIC FONT SIZING: Shrinks font if text is extremely dense for the given cell span
                             let dynFontSize = 9;
                             const charLen = r.loc.length;
                             if (r.span > 4) {
                                 // Vertical cell mapping (Allows ~4 chars per row span at 9pt)
                                 const maxChars = r.span * 4;
                                 if (charLen > maxChars + 8) dynFontSize = 6.5;
                                 else if (charLen > maxChars) dynFontSize = 7.5;
                             } else {
                                 // Horizontal cell mapping
                                 if (charLen > 25) dynFontSize = 6.5;
                                 else if (charLen > 15) dynFontSize = 7.5;
                             }

                             // ROTATED TEXT STYLING
                             const tdStyles = r.span > 4 
                                ? 'writing-mode:vertical-rl; transform:rotate(180deg); text-align:center; padding:4px; max-height:100%; white-space:nowrap; line-height:1.1; margin:auto;' 
                                : 'text-align:center; padding:1px; white-space:normal; word-wrap:break-word; margin:auto;';
                             
                             // TIGHT PADDING + DYNAMIC FONT (Fixed Border Issue)
                             rowsHtml += '<tr style="line-height:1.1">' + 
                                 (r.skip ? '' : '<td rowspan="' + r.span + '" style="vertical-align:middle; padding:0; background:#fff; border:1px solid #000; overflow:hidden;"><div style="' + tdStyles + ' font-weight:bold; font-size:' + dynFontSize + 'pt;">' + r.loc + '</div></td>') +

                                 '<td style="font-weight:700; font-size:8.5pt; padding:1px 4px; border:1px solid #000; white-space:nowrap; overflow:hidden;">' + r['Register Number'] + '</td>' +
                                 '<td style="font-size:7.5pt; padding:1px 4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:0; border:1px solid #000;">' + r.Name + '</td>' +
                                 '<td style="text-align:center; font-weight:bold; padding:1px 4px; border:1px solid #000;">' + r.seat + '</td></tr>';
                         });
                         
                         return '<table class="rt" style="font-size:8.5pt; table-layout:fixed; width:100%; border-collapse:collapse;">' +
                                '<thead style="font-size:7.5pt"><tr><th style="width:45px; border:1px solid #000;">Loc</th><th style="width:85px; border:1px solid #000;">Reg No</th><th style="width:auto; border:1px solid #000;">Name</th><th style="width:32px; border:1px solid #000;">Seat</th></tr></thead>' +
                                '<tbody>' + rowsHtml + '</tbody></table>';
                    };

                    pg.innerHTML += '<div style="display:flex; gap:10px">' +
                        '<div style="flex:1; width:50%; overflow:hidden;">' + getTable(chunk.slice(0, mid)) + '</div>' +
                        '<div style="flex:1; width:50%; overflow:hidden;">' + getTable(chunk.slice(mid)) + '</div>' +
                    '</div>' + footer();
                    v.appendChild(pg);
                }
            }



            // --- 🏷️ REPORT 5: ROOM STICKERS (DYNAMIC GRID & GROUPS) ---
            if (type === 'r5') {
                const getTruncName = (name) => (!name) ? "" : (name.length <= 20 ? name : name.substring(0, 20) + "..");

                for(let i=0; i < D.allotment.length; i+=2) {
                    const pg = createPage(); 
                    pg.className = 'a4 sticker-page';
                    pg.style.padding = '5mm';

                    const drawSticker = (idx) => {
                        const r = D.allotment[idx]; 
                        if(!r) return '';

                        // Group students by Course
                        const byCourse = {};
                        r.students.forEach(s => {
                            const fs = D.students.find(x => x['Register Number'] === (s.RegisterNo || s['Register Number']));
                            const cName = fs ? fs.Course : 'Unknown';
                            if(!byCourse[cName]) byCourse[cName] = [];
                            // Check Scribe Status
                            const isScr = D.scribes.some(sc => sc.regNo === (s.RegisterNo || s['Register Number']));
                            byCourse[cName].push({ ...s, fullName: fs?.Name || '', isScribe: isScr });
                        });

                        const sortedCourses = Object.keys(byCourse).sort();
                        
                        // Dynamic layout adjustments for dense rooms
                        const isDense = sortedCourses.length > 6;
                        const rowPad = isDense ? "0px" : "1px";
                        const fReg = isDense ? "8.5pt" : "9pt";
                        const fName = isDense ? "8pt" : "8.5pt";

                        let blocksHtml = '';
                        sortedCourses.forEach(c => {
                            const courseStudents = byCourse[c].sort((a,b) => (a.seat || 999) - (b.seat || 999));
                            let gridHtml = '';
                            
                            courseStudents.forEach(st => {
                                const sBadge = st.isScribe ? '<span style="font-size:0.6em; color:white; padding:0 2px; border-radius:2px; background:black; margin-left:2px;">S</span>' : '';
                                gridHtml += 
                                    '<div style="display:grid; grid-template-columns:25px max-content 1fr; align-items:center; border-bottom:1px dotted #ccc; padding:' + rowPad + ' 0; font-size:' + fReg + ';">' +
                                        '<div style="text-align:center; font-weight:bold; border-right:1px solid #ddd;">' + (st.seat || '-') + '</div>' +
                                        '<div style="text-align:left; font-weight:bold; padding:0 5px; border-right:1px solid #ddd; white-space:nowrap;">' + (st.RegisterNo || st['Register Number']) + '</div>' +
                                        '<div style="padding-left:5px; font-size:' + fName + '; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; color:#333;">' + getTruncName(st.fullName) + sBadge + '</div>' +
                                    '</div>';
                            });

                            blocksHtml += 
                                '<div style="margin-bottom:4px; break-inside:avoid; border:1px solid #eee; padding:2px; background:#fafafa;">' +
                                    '<div style="font-weight:bold; font-size:8.5pt; background:#e5e7eb; padding:1px 4px; margin-bottom:1px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">' +
                                        c + ' <span style="background:#fff; padding:0 3px; border-radius:4px; margin-left:3px; font-size:8pt; border:1px solid #ccc;">' + courseStudents.length + '</span>' +
                                    '</div>' +
                                    '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">' + gridHtml + '</div>' +
                                '</div>';
                        });

                        const roomTitle = (D.roomConfig[r.roomName]?.location) ? D.roomConfig[r.roomName].location + ' <span style="font-size:14pt; margin-left:5px">(' + r.roomName + ')</span>' : r.roomName;

                        return '' +
                        '<div class="sticker" style="border:2px dashed #000; padding:6px 8px; height:135mm; overflow:hidden; display:flex; flex-direction:column; box-sizing:border-box; background:white; width:100%;">' +
                            '<div style="text-align:center; margin-bottom:3px; flex-shrink:0; border-bottom:2px solid #000; padding-bottom:3px;">' +
                                '<h1 style="font-size:12pt; font-weight:bold; margin:0; text-transform:uppercase; line-height:1.1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + D.meta.collegeName + '</h1>' +
                                '<div style="font-size:9pt; font-weight:bold; margin-top:1px; color:#444;">' + D.meta.date + ' | ' + D.meta.time + '</div>' +
                                '<div style="margin-top:3px; border:2px solid #000; padding:2px 6px; display:flex; justify-content:center; align-items:center;">' +
                                    '<span style="font-size:12pt; font-weight:bold; line-height:1.1; text-align:center;">' + roomTitle + '</span>' +
                                '</div>' +
                            '</div>' +
                            '<div style="flex:1 1 auto; overflow:hidden; min-height:0; padding-top:2px;">' +
                                '<div style="display:block;">' + blocksHtml + '</div>' +
                            '</div>' +
                            '<div style="text-align:center; font-size:9pt; color:#000; margin-top:2px; flex-shrink:0; border-top:2px solid #000; padding-top:2px; font-weight:bold; background:#f0f0f0;">' +
                                'Total Candidates: ' + r.students.length + 
                            '</div>' +
                        '</div>';
                    };

                    pg.innerHTML = drawSticker(i) + (D.allotment[i+1] ? '<div style="height:10mm; border-bottom:1px dotted #ccc; margin-bottom:10mm;"></div>' + drawSticker(i+1) : '');
                    v.appendChild(pg);
                }
            }


            // --- ✍️ REPORT 6: SCRIBE PROFORMA (CORE SYSTEM REPLICA) ---
            if (type === 'r6') {
                if (D.scribes.length === 0) return alert("No Scribes allotted.");
                
                const scribeRoomNames = [...new Set(D.scribes.map(s => s.room))];
                scribeRoomNames.sort((a,b) => (D.roomConfig[a]?.serial || 0) - (D.roomConfig[b]?.serial || 0));
                const scrLabelMap = {};
                scribeRoomNames.forEach((name, idx) => { scrLabelMap[name] = 'SCR' + (idx+1); });

                D.scribes.forEach(s => {
                    const p = createPage();
                    const label = scrLabelMap[s.room] || 'SCR?';
                    
                    // Dig out Core Student Information
                    const fs = D.students.find(x => x['Register Number'] === s.regNo) || {};
                    const courseDisplay = fs.Course || 'Unknown Course';
                    
                    // Trace back to original allotment
                    let origRoomDisplay = 'N/A';
                    let streamName = 'Regular';
                    const origRoom = D.allotment.find(rm => rm.students.some(st => (st.RegisterNo || st['Register Number']) === s.regNo));
                    if (origRoom) {
                        const stDat = origRoom.students.find(st => (st.RegisterNo || st['Register Number']) === s.regNo);
                        streamName = origRoom.stream || 'Regular';
                        const orgSerial = D.roomConfig[origRoom.roomName]?.serial || '-';
                        origRoomDisplay = orgSerial + ' - ' + origRoom.roomName + ' (Seat: ' + stDat.seat + ')';
                    }
                    
                    const qp = getActualQPValue(courseDisplay, streamName);
                    const scrSerial = D.roomConfig[s.room]?.serial || '-';
                    const scrLoc = D.roomConfig[s.room]?.location ? ' (' + D.roomConfig[s.room].location + ')' : '';
                    const scribeRoomDisplay = '<strong><span style="color:#2563eb;">' + label + '</span> - #' + scrSerial + ' - ' + s.room + '</strong>' + scrLoc;
                    p.innerHTML = '<div style="text-align:center; border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:20px;">' +
                        '<h1 style="margin:0; font-size:18pt;">' + D.meta.collegeName + '</h1>' +
                        '<h2 style="margin:4px 0; font-size:14pt;">Scribe Assistance Proforma</h2>' +
                        '<h3 style="margin:0; font-size:11pt; font-weight:normal;">' + D.meta.date + ' &nbsp;|&nbsp; ' + D.meta.time + '</h3>' +
                    '</div>' +
                    '<table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:11pt;">' +
                        '<tbody>' +
                            '<tr><td style="padding:10px; border:1px solid #000; width:35%; font-weight:bold;">Name of Candidate:</td><td style="padding:10px; border:1px solid #000;">' + s.studentName + '</td></tr>' +
                            '<tr><td style="padding:10px; border:1px solid #000; font-weight:bold;">Register Number:</td><td style="padding:10px; border:1px solid #000; font-weight:bold; font-size:13pt;">' + s.regNo + '</td></tr>' +
                            '<tr><td style="padding:10px; border:1px solid #000; font-weight:bold;">Course:</td><td style="padding:10px; border:1px solid #000;">' + courseDisplay + '</td></tr>' +
                            '<tr><td style="padding:10px; border:1px solid #000; font-weight:bold;">QP Code:</td><td style="padding:10px; border:1px solid #000; font-weight:bold;">' + qp + '</td></tr>' +
                            '<tr><td style="padding:10px; border:1px solid #000; font-weight:bold;">Original Allotment:</td><td style="padding:10px; border:1px solid #000;">' + origRoomDisplay + '</td></tr>' +
                            '<tr><td style="padding:10px; border:1px solid #000; font-weight:bold;">Scribe Room (New):</td><td style="padding:10px; border:1px solid #000; background-color:#eff6ff;">' + scribeRoomDisplay.replace(/"/g, "'") + '</td></tr>' +
                            '<tr><td style="padding:10px; border:1px solid #000; font-weight:bold;">Name of Scribe:</td><td style="padding:10px; border:1px solid #000;">' + s.scribeName + '</td></tr>' +
                        '</tbody>' +
                    '</table>' +
                    '<div style="display:flex; justify-content:space-between; margin-top:40px;">' +
                        '<div style="border:1px solid #000; width:150px; height:100px; text-align:center; padding-top:10px; color:#666; font-size:9pt;">Candidate<br>Thumb Impression</div>' +
                        '<div style="border:1px solid #000; width:150px; height:100px; text-align:center; padding-top:10px; color:#666; font-size:9pt;">Scribe<br>Thumb Impression</div>' +
                    '</div>' +
                    '<div style="margin-top:60px; text-align:right; font-weight:bold;">Signature of Chief Superintendent</div>';
                    v.appendChild(p);
                });
            }
            // --- 🤝 REPORT 7: SCRIBE ASSISTANCE SUMMARY ---
            if (type === 'r7') {
                if (!D.scribes || D.scribes.length === 0) return alert("No Scribes allotted for this session.");
                
                let rowsHtml = '';
                D.scribes.forEach((s, idx) => {
                    // Try to dig out the exact Course (QP) data
                    const fs = D.students.find(x => x['Register Number'] === s.regNo);
                    const courseDisplay = fs ? getSmartName(fs.Course) : '';
                    
                    rowsHtml += '<tr style="line-height:1.4">' +
                        '<td style="text-align:center">' + (idx + 1) + '</td>' +
                        '<td style="font-weight:bold">' + s.regNo + '</td>' +
                        '<td>' + (s.studentName || '') + '</td>' +
                        '<td>' + courseDisplay + '</td>' +
                        '<td style="font-weight:bold; color:#059669">' + (s.scribeName || '') + '</td>' +
                        '<td style="text-align:center; font-weight:bold; font-size:10pt">' + s.room + '</td>' +
                        '<td></td></tr>';
                });

                const thead = '<thead><tr><th style="width:5%">Sl</th><th style="width:15%">Reg No</th><th style="width:25%">Candidate Name</th><th style="width:15%">Course</th><th style="width:20%">Scribe Name</th><th style="width:10%">Room</th><th style="width:10%">Sign</th></tr></thead>';
                
                const pg = createPage();
                pg.innerHTML = heading('SCRIBE ASSISTANCE SUMMARY', '', D.meta.examName) + 
                    '<table class="rt" style="font-size:9pt">' + thead + '<tbody>' + rowsHtml + '</tbody></table>' + footer();
                v.appendChild(pg);
            }
        }


        function createPage() { const d = document.createElement('div'); d.className = 'a4'; return d; }
    </script>
</body>
</html>`;
    }
};

window.SESSION_EXPORT_JS = SESSION_EXPORT_JS;

