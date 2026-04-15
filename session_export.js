/**
 * ExamFlow: Fully-Integrated Offline Session Export (Premium Edition)
 * Replicates Reports 1-6 exactly from the main app environment.
 */

const SESSION_EXPORT_JS = {
    LOGO_SVG: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIyIiB5PSIzIiB3aWR0aD0iMjAiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxsaW5lIHgxPSI4IiB5MT0iMjEiIHgyPSIxNiIgeTI9IjIxIj48L2xpbmU+PGxpbmUgeDE9IjEyIiB5MT0iMTciIHgyPSIxMiIgeTI9IjIxIj48L2xpbmU+PC9zdmc+`,

    exportSession: function(sessionKey) {
        if (!sessionKey) return alert("Please select a session first.");

        // 1. COLLECT DATA via Global Bridge
        const [date, time] = sessionKey.split(' | ');
        const streamSelect = document.getElementById('reports-stream-select');
        const stream = streamSelect ? streamSelect.value : 'Regular';
        const collegeName = localStorage.getItem('examCollegeName') || 'ExamFlow Institution';

        const allStudents = (typeof window.getMyAllStudentData === 'function') ? window.getMyAllStudentData() : [];
        const sessionStudents = allStudents.filter(s => s.Date === date && s.Time === time);
        
        if (sessionStudents.length === 0) return alert("❌ No data found! Ensure student data is loaded in the dashboard.");

        const allAllotments = JSON.parse(localStorage.getItem('examRoomAllotment') || '{}');
        const allQPCodes = JSON.parse(localStorage.getItem('examQPCodes') || '{}');
        const allAbsentees = JSON.parse(localStorage.getItem('examAbsenteeList') || '{}');
        const allScribes = JSON.parse(localStorage.getItem('examScribeAllotment') || '{}');
        const scribeList = JSON.parse(localStorage.getItem('examScribeList') || '[]');
        const allInvigs = JSON.parse(localStorage.getItem('examInvigilatorMapping') || '{}');
        const roomConfig = (typeof window.getMyRoomConfig === 'function') ? window.getMyRoomConfig() : {};

        const snapshot = {
            meta: { collegeName, date, time, stream, 
                   generatedAt: new Date().toLocaleString(),
                   examName: (typeof getExamName === 'function') ? getExamName(date, time, stream) : 'Examination Session' },
            students: sessionStudents,
            allotment: allAllotments[sessionKey] || [],
            qpCodes: allQPCodes[sessionKey] || {},
            absentees: allAbsentees[sessionKey] || {},
            scribes: Object.entries(allScribes[sessionKey] || {}).map(([regNo, room]) => {
                const scribeInfo = scribeList.find(s => s.regNo === regNo) || {};
                const studentInfo = sessionStudents.find(s => s['Register Number'] === regNo) || {};
                return { 
                    regNo, 
                    room, 
                    scribeName: scribeInfo.name || 'Not Available',
                    studentName: studentInfo.Name || 'Unknown student'
                };
            }),

            invigilators: allInvigs[sessionKey] || {},
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
            .no-p { display:none !important; }
            .a4 { box-shadow:none; border:none; margin:0; width:100%!important; padding:10mm!important; page-break-after:always; }
            @page { size: A4; margin: 0; }
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
    </style>
</head>
<body>
    <div class="no-p">
        <header>
            <h1 style="margin:0; color:var(--p)">📥 Portable Session Document</h1>
            <div style="display:flex; gap:10px; margin-top:15px">
                <span id="p-date" style="background:#eff6ff; padding:5px 15px; border-radius:20px; font-weight:bold; color:#1e40af">${data.meta.date}</span>
                <span style="background:#eff6ff; padding:5px 15px; border-radius:20px; font-weight:bold; color:#1e40af">${data.meta.time}</span>
                <span style="background:#eff6ff; padding:5px 15px; border-radius:20px; font-weight:bold; color:#1e40af">${data.students.length} Students</span>
            </div>
        </header>

        <div class="qp-box">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px">
                <h3 style="margin:0">1. Question Paper Codes</h3>
                <button onclick="fromClipboard()" class="btn" style="padding:5px 10px; font-size:12px">📋 Sync from Clipboard</button>
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
        </div>
    </div>

    <div id="viewer"></div>

    <script>
        const D = ${JSON.stringify(data)};

        function init() {
            const b = document.getElementById('qb');
            const courses = [...new Set(D.students.map(s => s.Course + '|' + (s.Stream || 'Regular')))];
            courses.forEach(c => {
                const [code, stream] = c.split('|');
                const row = document.createElement('tr');
                row.innerHTML = '<td style="padding:5px; border-bottom:1px solid #eee">' + code + ' (' + stream + ')</td>' + 
                    '<td style="padding:5px; border-bottom:1px solid #eee"><input type="text" data-key="' + c + '" value="' + (D.qpCodes[c] || '') + '" onchange="D.qpCodes[\\'' + c + '\\']=this.value"></td>';
                b.appendChild(row);
            });
        }
        init();

        async function fromClipboard() {
            try {
                const text = await navigator.clipboard.readText();
                const lines = text.split('\\n').map(l => l.trim()).filter(l => l);
                const map = {};
                lines.forEach(l => {
                    const p = l.split(/\\t|,|\\s+-/).map(x => x.trim());
                    if(p.length >= 2) map[p[0]] = p[p.length-1];
                });
                document.querySelectorAll('#qt input').forEach(i => {
                    const k = i.dataset.key.split('|')[0];
                    if(map[k]) { i.value = map[k]; D.qpCodes[i.dataset.key] = map[k]; }
                });
                alert("✨ Successfully matched and updated QP codes!");
            } catch(e) { alert("Clipboard access denied."); }
        }

               function render(type) {
            const v = document.getElementById('viewer'); v.innerHTML = '';
            
            // --- 🎨 SHARED HELPERS ---
            const heading = (title, hall = '', exam = '', page = 1) => {
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

            // --- 📄 REPORT 1: QP SUMMARY ---
            if (type === 'r1') {
                const p = createPage();
                let table = '<table class="rt"><thead><tr><th>SL</th><th>COURSE NAME</th><th>COUNT</th></tr></thead><tbody>';
                const counts = {};
                D.students.forEach(s => { counts[s.Course] = (counts[s.Course] || 0) + 1; });
                Object.entries(counts).sort().forEach(([c, n], i) => {
                    table += '<tr><td>' + (i+1) + '</td><td>' + c + '</td><td style="text-align:center; font-weight:bold">' + n + '</td></tr>';
                });
                p.innerHTML = heading('QUESTION PAPER SUMMARY', '', D.meta.examName) + table + '</tbody></table>' + footer();
                v.appendChild(p);
            }

            // --- 📦 REPORT 2: QP DISTRIBUTION (EXACT CORE LOGIC) ---
            if (type === 'r2') {
                const p = createPage();
                p.innerHTML = heading('QP DISTRIBUTION SUMMARY', '', D.meta.examName);
                const map = {};
                D.allotment.forEach(room => {
                    room.students.forEach(s => {
                        const fs = D.students.find(x => x['Register Number'] === (s.RegisterNo || s['Register Number']));
                        const stream = room.stream || 'Regular';
                        const paperKey = btoa(unescape(encodeURIComponent(`\${fs.Course}|\${stream}`)));
                        if(!map[paperKey]) map[paperKey] = { title: fs.Course, stream, qp: D.qpCodes[fs.Course+'|'+stream] || 'N/A', rooms: {} };
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
                        boxes += '<div class="qp-room-box">' +
                           '<div style="display:flex; align-items:baseline; overflow:hidden">' +
                              '<span style="font-size:16pt; font-weight:900; margin-right:4px">' + info.rooms[r] + '</span>' +
                              '<span style="font-size:9px; font-weight:bold; color:#666; margin-right:8px">Nos</span>' +
                              '<span style="color:#ddd; margin-right:8px">|</span>' +
                              '<span style="font-weight:bold; font-size:11pt; white-space:nowrap">Room ' + r + '</span>' +
                              '<span style="font-size:9px; margin-left:4px; color:#666">' + (displayLoc ? '('+displayLoc+')' : '') + '</span>' +
                           '</div>' +
                           '<div class="qp-room-check"></div>' +
                        '</div>';
                    });

                    p.innerHTML += '<div style="margin-top:15px; border-bottom:1px solid #000; padding:4px; display:flex; justify-content:space-between">' +
                        '<span><b>' + info.title + '</b> (' + info.stream + ')</span>' +
                        '<span>QP: <b>' + info.qp + '</b> | Total: <b>' + Object.values(info.rooms).reduce((a,b)=>a+b,0) + '</b></span>' +
                    '</div>' + boxes + '</div>';
                });
                v.appendChild(p);
            }

            // --- 🏠 REPORT 3: ROOM-WISE (EXACT CORE LOGIC) ---
            if (type === 'r3') {
                D.allotment.forEach(room => {
                    const page1 = createPage();
                    const students = room.students.sort((a,b) => (a.seat || 0) - (b.seat || 0));
                    
                    // 1. Build Course Summary Logic
                    const stats = {};
                    students.forEach(s => {
                        const fs = D.students.find(x => x['Register Number'] === (s.RegisterNo || s['Register Number']));
                        const key = `\${fs.Course}|\${room.stream || 'Regular'}`;
                        if(!stats[key]) stats[key] = { total: 0, scribe: 0 };
                        stats[key].total++;
                        if(D.scribes.some(sc => sc.regNo === (s.RegisterNo || s['Register Number']))) stats[key].scribe++;
                    });

                    let summaryRows = '';
                    let grandTotal = 0;
                    Object.entries(stats).forEach(([key, val]) => {
                        const [c, st] = key.split('|');
                        const paperKey = btoa(unescape(encodeURIComponent(key)));
                        const qpCode = D.qpCodes[key] || "N/A";
                        const booklets = val.total - val.scribe;
                        grandTotal += booklets;
                        summaryRows += `<tr><td>\${qpCode}</td><td style="font-size:8.5pt">\${getSmartName(c)} \${val.scribe > 0 ? '<b>('+val.scribe+' Scribes)</b>' : ''}</td><td style="text-align:center">\${booklets}</td></tr>`;
                    });

                    const customFooter = `
                        <div style="margin-top:15px; font-size:9pt">
                            <b>Course Summary:</b>
                            <table class="rt" style="margin-bottom:10px">
                                <thead style="background:#f0f0f0"><tr><th>QP Code</th><th>Course</th><th>Count</th></tr></thead>
                                <tbody>\${summaryRows}<tr><td colspan="2" style="text-align:right"><b>Total (Excl. Scribes):</b></td><td style="text-align:center"><b>\${grandTotal}</b></td></tr></tbody>
                            </table>
                            <div style="border:1px solid #000; padding:8px; margin-bottom:15px">
                                <b>Booklets Received: ____ | Used: ____ | Balance: ____</b>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:flex-end">
                                <span style="font-size:8pt">* = Scribe Help</span>
                                <div style="width:250px; border-top:1px solid #000; text-align:center; padding-top:5px">
                                    \${D.invigilators[room.roomName] || 'Signature of Invigilator'}
                                </div>
                            </div>
                        </div>`;

                    // 2. Main Page Render
                    page1.innerHTML = heading('ROOM REPORT', room.roomName, D.meta.examName, 1) + 
                        \`<div style="margin-bottom:10px"><b>Location:</b> \${D.roomConfig[room.roomName]?.location || 'Main Block'}</div>\` +
                        '<table class="rt"><thead><tr><th>SEAT</th><th>REG NO</th><th>NAME</th><th>SIGNATURE</th></tr></thead><tbody>';

                    students.slice(0, 20).forEach(s => {
                        const fs = D.students.find(x => x['Register Number'] === (s.RegisterNo || s['Register Number']));
                        const isScribe = D.scribes.some(sc => sc.regNo === (s.RegisterNo || s['Register Number']));
                        page1.querySelector('tbody').innerHTML += '<tr style="height:35px font-size:11pt">' +
                            '<td>' + s.seat + (isScribe ? '*' : '') + '</td>' +
                            '<td style="font-weight:bold">' + (s.RegisterNo || s['Register Number']) + '</td>' +
                            '<td>' + (fs?.Name || '') + '</td><td></td>' +
                        '</tr>';
                    });
                    
                    page1.innerHTML += '</tbody></table>' + (students.length <= 20 ? customFooter : '<div style="text-align:right; font-size:8pt">Continued on Page 2...</div>');
                    v.appendChild(page1);

                    if(students.length > 20) {
                        const page2 = createPage();
                        page2.innerHTML = heading('ROOM REPORT', room.roomName, D.meta.examName, 2) + '<table class="rt"><thead><tr><th>SEAT</th><th>REG NO</th><th>NAME</th><th>SIGNATURE</th></tr></thead><tbody>';
                        students.slice(20).forEach(s => {
                           const fs = D.students.find(x => x['Register Number'] === (s.RegisterNo || s['Register Number']));
                           page2.querySelector('tbody').innerHTML += \`<tr style="height:35px"><td>\${s.seat}</td><td style="font-weight:bold">\${s.RegisterNo || s['Register Number']}</td><td>\${fs?.Name || ''}</td><td></td></tr>\`;
                        });
                        page2.innerHTML += '</tbody></table>' + customFooter;
                        v.appendChild(page2);
                    }
                });
            }

            // --- 📋 REPORT 4: NOTICE BOARD (MERGED LOCATIONS & 2-COL) ---
            if (type === 'r4') {
                const p = createPage();
                p.innerHTML = heading('SEATING DETAILS (ALPHABETICAL)', '', D.meta.examName);
                const sorted = [...D.students].sort((a,b) => a.Name.localeCompare(b.Name));
                const mid = Math.ceil(sorted.length / 2);

                const getTable = (list) => {
                    let rows = [];
                    list.forEach(s => {
                        const room = D.allotment.find(x => x.students.some(st => (st.RegisterNo || st['Register Number']) === s['Register Number']));
                        const st = room?.students.find(x => (x.RegisterNo || x['Register Number']) === s['Register Number'])?.seat || '-';
                        const loc = D.roomConfig[room?.roomName]?.location || room?.roomName || '-';
                        rows.push({ reg: s['Register Number'], name: s.Name.substring(0,22), loc, seat: st, skip: false, span: 1 });
                    });

                    // Logic for Merging Locations
                    for(let i=0; i<rows.length; i++) {
                        if(rows[i].skip) continue;
                        for(let j=i+1; j<rows.length; j++) {
                            if(rows[j].loc !== rows[i].loc) break;
                            rows[i].span++;
                            rows[j].skip = true;
                        }
                    }

                    let html = '<table class="rt" style="font-size:9pt; table-layout:fixed">';
                    html += '<thead style="font-size:8pt"><tr><th style="width:25%">Location</th><th style="width:30%">Reg No</th><th style="width:35%">Name</th><th style="width:10%">Seat</th></tr></thead><tbody>';
                    rows.forEach(r => {
                        let locStyle = r.span > 10 ? 'font-size:1.2em' : (r.span > 5 ? 'font-size:1.1em' : 'font-size:0.9em');
                        html += '<tr>' + 
                           (r.skip ? '' : \`<td rowspan="\${r.span}" style="text-align:center; font-weight:bold; \${locStyle}">\${r.loc}</td>\`) +
                           \`<td style="font-weight:600">\${r.reg}</td><td>\${r.name}</td><td style="text-align:center; font-weight:bold">\${r.seat}</td></tr>\`;
                    });
                    return html + '</tbody></table>';
                };

                p.innerHTML += \`<div style="display:flex; gap:15px">
                    <div style="flex:1">\${getTable(sorted.slice(0, mid))}</div>
                    <div style="flex:1">\${getTable(sorted.slice(mid))}</div>
                </div>\` + footer();
                               v.appendChild(p);
            }

            // --- 🏷️ REPORT 5: ROOM STICKERS (EXACT 135mm LAYOUT) ---
            if (type === 'r5') {
                for(let i=0; i<D.allotment.length; i+=2) {
                    const page = document.createElement('div'); page.className = 'a4 sticker-page';
                    const drawSticker = (idx) => {
                        if (!D.allotment[idx]) return '';
                        const room = D.allotment[idx];
                        let rows = '';
                        room.students.slice(0, 45).forEach(s => {
                            rows += '<div style="display:flex; justify-content:space-between; font-size:9px; border-bottom:1px dotted #ccc; padding:0 2px">' +
                                '<span>' + s.seat + '</span><b>' + (s.RegisterNo||s['Register Number']) + '</b>' +
                            '</div>';
                        });
                        return '<div class="sticker">' +
                            '<div style="text-align:center; border-bottom:1px solid #000; margin-bottom:8px">' +
                                '<h3 style="margin:2px 0">' + D.meta.collegeName + '</h3>' +
                                '<h4 style="margin:2px 0">ROOM ' + room.roomName + '</h4>' +
                                '<div style="font-size:8pt">' + D.meta.date + ' | ' + D.meta.time + '</div>' +
                            '</div>' +
                            '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px; column-gap:15px">' + rows + '</div>' +
                        '</div>';
                    }
                    page.innerHTML = drawSticker(i) + '<div style="height:10mm; border-bottom:1px dashed #ccc; margin:5mm 0"></div>' + drawSticker(i+1);
                    v.appendChild(page);
                }
            }

            // --- ✍️ REPORT 6: SCRIBE PROFORMA (ENRICHED) ---
            if (type === 'r6') {
                if (D.scribes.length === 0) return alert("No Scribes allotted for this session.");
                D.scribes.forEach(s => {
                    const p = createPage();
                    p.innerHTML = heading('SCRIBE SEATING PROFORMA', s.room, D.meta.examName) + 
                        '<table class="rt" style="margin-top:20px">' +
                            '<tr><td style="font-weight:bold; width:40%">Candidate Reg No</td><td>' + s.regNo + '</td></tr>' +
                            '<tr><td style="font-weight:bold">Candidate Name</td><td>' + s.studentName + '</td></tr>' +
                            '<tr><td style="font-weight:bold">Scribe Name</td><td>' + s.scribeName + '</td></tr>' +
                            '<tr><td style="font-weight:bold">Allotted Room</td><td style="font-size:16pt; font-weight:bold">' + s.room + '</td></tr>' +
                            '<tr style="height:100px"><td style="font-weight:bold">Candidate Thumb</td><td></td></tr>' +
                            '<tr style="height:100px"><td style="font-weight:bold">Scribe Thumb</td><td></td></tr>' +
                        '</table>' + footer();
                    v.appendChild(p);
                });
            }
        }
        function createPage() { const d = document.createElement('div'); d.className = 'a4'; return d; }
    </script>
</body>
</html>`;
    }
};

window.SESSION_EXPORT_JS = SESSION_EXPORT_JS;

