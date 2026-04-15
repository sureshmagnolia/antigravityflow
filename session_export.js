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
            scribes: allScribes[sessionKey] || [],
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
    <title>\${data.meta.collegeName} - Portable Session Document</title>
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
                <span id="p-date" style="background:#eff6ff; padding:5px 15px; border-radius:20px; font-weight:bold; color:#1e40af">\${data.meta.date}</span>
                <span style="background:#eff6ff; padding:5px 15px; border-radius:20px; font-weight:bold; color:#1e40af">\${data.meta.time}</span>
                <span style="background:#eff6ff; padding:5px 15px; border-radius:20px; font-weight:bold; color:#1e40af">\${data.students.length} Students</span>
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
        const D = \${JSON.stringify(data)};

        function init() {
            const b = document.getElementById('qb');
            const courses = [...new Set(D.students.map(s => s.Course + '|' + (s.Stream || 'Regular')))];
            courses.forEach(c => {
                const [code, stream] = c.split('|');
                const row = document.createElement('tr');
                row.innerHTML = '<td style="padding:5px; border-bottom:1px solid #eee">' + code + ' (' + stream + ')</td>' + 
                    '<td style="padding:5px; border-bottom:1px solid #eee"><input type="text" data-key="' + c + '" value="' + (D.qpCodes[c] || '') + '" onchange="D.qpCodes[\'' + c + '\']=this.value"></td>';
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
            const heading = (title) => '<div class="rh"><h1>' + D.meta.collegeName + '</h1><h3>' + D.meta.examName + '</h3><h2>' + D.meta.date + ' | ' + D.meta.time + ' | ' + title + '</h2></div>';
            const footer = () => '<div class="rf"><span>Date: ' + D.meta.date + '</span><span>Chief Superintendent Signature</span></div>';

            if (type === 'r1') { // Question Paper Summary
                const p = createPage();
                let table = '<table class="rt"><thead><tr><th>SL</th><th>COURSE NAME</th><th>COUNT</th></tr></thead><tbody>';
                const counts = {};
                D.students.forEach(s => { counts[s.Course] = (counts[s.Course] || 0) + 1; });
                Object.entries(counts).sort().forEach(([c, n], i) => {
                    table += '<tr><td>'+(i+1)+'</td><td>'+c+'</td><td style="text-align:center; font-weight:bold">'+n+'</td></tr>';
                });
                p.innerHTML = heading('QUESTION PAPER SUMMARY') + table + '</tbody></table>' + footer();
                v.appendChild(p);
            }

            if (type === 'r2') { // QP Distribution
                const p = createPage();
                p.innerHTML = heading('QP DISTRIBUTION SUMMARY');
                const map = {};
                D.allotment.forEach(room => {
                    room.students.forEach(s => {
                        const fs = D.students.find(x => x['Register Number'] === (s.RegisterNo || s['Register Number']));
                        const qp = D.qpCodes[fs.Course+'|Regular'] || D.qpCodes[fs.Course+'|Supplementary'] || 'N/A';
                        if(!map[qp]) map[qp] = { title: fs.Course, rooms: {} };
                        map[qp].rooms[room.roomName] = (map[qp].rooms[room.roomName] || 0) + 1;
                    });
                });
                Object.entries(map).forEach(([qp, info]) => {
                    let boxes = '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:10px">';
                    Object.entries(info.rooms).forEach(([r,n]) => {
                        const loc = (D.roomConfig[r]?.location || '').split(' ').slice(0,2).join(' ');
                        boxes += '<div class="qp-room-box"><div><span class="qp-room-count">'+n+'</span> <span style="font-size:10px">Nos</span> | <b>Room '+r+'</b> <span style="font-size:9px">('+loc+')</span></div><div class="qp-room-check"></div></div>';
                    });
                    p.innerHTML += '<div style="margin-top:20px; border-bottom:1px solid #000; padding:5px"><b>' + qp + '</b> - ' + info.title + '</div>' + boxes + '</div>';
                });
                v.appendChild(p);
            }

            if (type === 'r3') { // Room-wise
                D.allotment.forEach(room => {
                    const p = createPage();
                    p.innerHTML = heading('ROOM: ' + room.roomName) + '<table class="rt"><thead><tr><th>SEAT</th><th>REG NO</th><th>NAME</th><th>SIGNATURE</th></tr></thead><tbody>';
                    room.students.forEach(s => {
                        const fs = D.students.find(x => x['Register Number'] === (s.RegisterNo || s['Register Number']));
                        p.querySelector('tbody').innerHTML += '<tr style="height:32px"><td>'+s.seat+'</td><td style="font-weight:bold">'+(s.RegisterNo || s['Register Number'])+'</td><td>'+(fs?.Name || '')+'</td><td></td></tr>';
                    });
                    p.innerHTML += '</tbody></table>' + footer();
                    v.appendChild(p);
                });
            }

            if (type === 'r4') { // Notice Board (2-Col)
                const p = createPage();
                p.innerHTML = heading('SEATING DETAILS (ALPHABETICAL)');
                const sorted = [...D.students].sort((a,b) => a.Name.localeCompare(b.Name));
                const mid = Math.ceil(sorted.length / 2);
                let html = '<div style="display:flex; gap:20px"><div style="flex:1"><table class="rt"><thead><tr><th>NAME</th><th>REG NO</th><th>ROOM</th><th>SEAT</th></tr></thead><tbody>';
                
                const drawTable = (list) => {
                    let rows = '';
                    list.forEach(s => {
                        const r = D.allotment.find(x => x.students.some(st => (st.RegisterNo || st['Register Number']) === s['Register Number']));
                        const st = r?.students.find(x => (x.RegisterNo || x['Register Number']) === s['Register Number'])?.seat || '-';
                        rows += '<tr style="font-size:9pt"><td>'+s.Name.substring(0,20)+'</td><td>'+s['Register Number']+'</td><td style="text-align:center; font-weight:bold">'+(r?.roomName||'-')+'</td><td style="text-align:center">'+st+'</td></tr>';
                    });
                    return rows;
                };

                p.innerHTML += '<div style="display:flex; gap:20px"><div style="flex:1"><table class="rt"><thead><tr><th>NAME</th><th>REG NO</th><th>ROOM</th></tr></thead><tbody>' + drawTable(sorted.slice(0,mid)) + '</tbody></table></div>' +
                               '<div style="flex:1"><table class="rt"><thead><tr><th>NAME</th><th>REG NO</th><th>ROOM</th></tr></thead><tbody>' + drawTable(sorted.slice(mid)) + '</tbody></table></div></div>' + footer();
                v.appendChild(p);
            }

            if (type === 'r5') { // Stickers
                for(let i=0; i<D.allotment.length; i+=2) {
                    const page = document.createElement('div'); page.className = 'a4 sticker-page';
                    const drawSticker = (idx) => {
                        if (!D.allotment[idx]) return '';
                        const room = D.allotment[idx];
                        let rows = '';
                        room.students.slice(0, 45).forEach(s => {
                            rows += '<div style="display:flex; justify-content:space-between; font-size:9px; border-bottom:1px dotted #ccc"><span>'+s.seat+'</span><b>'+(s.RegisterNo||s['Register Number'])+'</b></div>';
                        });
                        return '<div class="sticker"><div style="text-align:center; border-bottom:1px solid #000; margin-bottom:10px"><h3>'+D.meta.collegeName+'</h3><h4>ROOM '+room.roomName+'</h4></div><div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px">'+rows+'</div></div>';
                    }
                    page.innerHTML = drawSticker(i) + '<div style="height:10mm; border-bottom:1px dashed #ccc"></div>' + drawSticker(i+1);
                    v.appendChild(page);
                }
            }

            if (type === 'r6') { // Scribe Proforma
              D.scribes.forEach(s => {
                  const p = createPage();
                  p.innerHTML = heading('SCRIBE SEATING PROFORMA') + '<table class="rt">' +
                      '<tr><td style="font-weight:bold">Candidate Reg No</td><td>'+s.regNo+'</td></tr>' +
                      '<tr><td style="font-weight:bold">Candidate Name</td><td> - </td></tr>' +
                      '<tr><td style="font-weight:bold">Scribe Name</td><td>'+s.scribeName+'</td></tr>' +
                      '<tr><td style="font-weight:bold">Allotted Room</td><td style="font-size:16pt; font-weight:bold">'+s.room+'</td></tr>' +
                      '<tr><td style="height:60px; font-weight:bold">Candidate Thumb Impression</td><td></td></tr>' +
                      '<tr><td style="height:60px; font-weight:bold">Scribe Thumb Impression</td><td></td></tr>' +
                      '</table>' + footer();
                  v.appendChild(p);
              });
            }
        }

        function createPage() { const d = document.createElement('div'); d.className = 'a4'; return d; }
    </script>
</body>
</html>\`;
    }
};

window.SESSION_EXPORT_JS = SESSION_EXPORT_JS;
