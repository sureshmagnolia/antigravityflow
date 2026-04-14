/**
 * Session Export Module for ExamFlow (Professional Offline Edition)
 * Version: 2.1.0
 * 
 * Creates a 100% self-contained, offline-ready HTML document for 
 * individual exam sessions with 9 printable reports and interactive QP entry.
 */

const SESSION_EXPORT_JS = {
    // --- 🖋️ LOGO (Base64 SVG - 100% Offline) ---
    LOGO_SVG: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIyIiB5PSIzIiB3aWR0aD0iMjAiIGhlaWdodD0iMTgiIHJ4PSIyIiByeT0iMiI+PC9yZWN0PjxsaW5lIHgxPSI4IiB5MT0iMjEiIHgyPSIxNiIgeTI9IjIxIj48L2xpbmU+PGxpbmUgeDE9IjEyIiB5MT0iMTciIHgyPSIxMiIgeTI9IjIxIj48L2xpbmU+PC9zdmc+`,

    /**
     * Captures all relevant session data and generates a downloadable HTML file.
     */
    exportSession: function(sessionKey) {
        if (!sessionKey) return alert("Please select a session first.");

        // 1. COLLECT DATA FROM CORE APP
        const [date, time] = sessionKey.split(' | ');
        const streamSelect = document.getElementById('reports-stream-select');
        const stream = streamSelect ? streamSelect.value : 'Regular';
        const collegeName = localStorage.getItem('examCollegeName') || 'ExamFlow Institution';

        // Filters
        const allStudents = typeof allStudentData !== 'undefined' ? allStudentData : [];
        const sessionStudents = allStudents.filter(s => s.Date === date && s.Time === time);
        
        if (sessionStudents.length === 0) {
            return alert("No student data found for this session. Please ensure data is loaded.");
        }

        const allAllotments = JSON.parse(localStorage.getItem('examRoomAllotment') || '{}');
        const sessionAllotment = allAllotments[sessionKey] || [];

        const allQPCodes = JSON.parse(localStorage.getItem('examQPCodes') || '{}');
        const sessionQPCodes = allQPCodes[sessionKey] || {};

        const allAbsentees = JSON.parse(localStorage.getItem('examAbsenteeList') || '{}');
        const sessionAbsentees = allAbsentees[sessionKey] || {};

        const allScribes = JSON.parse(localStorage.getItem('examScribeAllotment') || '{}');
        const sessionScribes = allScribes[sessionKey] || [];

        const allInvigs = JSON.parse(localStorage.getItem('examInvigilatorMapping') || '{}');
        const sessionInvigs = allInvigs[sessionKey] || [];

        const roomConfig = JSON.parse(localStorage.getItem('examRoomConfig') || '{}');

        // 2. CREATE SNAPSHOT
        const snapshot = {
            meta: {
                collegeName,
                date,
                time,
                stream,
                generatedAt: new Date().toLocaleString(),
                examName: (typeof getExamName === 'function') ? getExamName(date, time, stream) : 'Examination session'
            },
            students: sessionStudents,
            allotment: sessionAllotment,
            qpCodes: sessionQPCodes,
            absentees: sessionAbsentees,
            scribes: sessionScribes,
            invigilators: sessionInvigs,
            roomConfig: roomConfig
        };

        // 3. GENERATE HTML
        const htmlContent = this.getTemplate(snapshot);

        // 4. DOWNLOAD
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
        // We use a safe delimiter for template nested backticks to prevent JavaScript syntax errors
        const bt = "`"; 
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.meta.collegeName} - Offline Session Document</title>
    <style>
        :root {
            --primary: #1e3a8a;
            --primary-light: #eff6ff;
            --secondary: #64748b;
            --bg: #f8fafc;
            --card: #ffffff;
            --border: #e2e8f0;
            --text: #0f172a;
        }
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; line-height: 1.5; }
        .container { max-width: 1000px; margin: 0 auto; }
        
        /* UI Styles */
        .no-print { display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px; }
        header { background: var(--card); padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid var(--border); }
        .header-top { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
        .logo { width: 48px; height: 48px; color: var(--primary); }
        h1 { margin: 0; font-size: 24px; color: var(--primary); }
        .session-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; font-size: 14px; }
        .info-pill { background: #eff6ff; padding: 8px 12px; border-radius: 6px; color: #1d4ed8; font-weight: 500; border: 1px solid #dbeafe; }

        .report-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .btn { cursor: pointer; border: none; padding: 14px 18px; border-radius: 10px; font-weight: 700; font-size: 14px; transition: all 0.2s; text-align: left; display: flex; align-items: center; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .btn-primary { background: var(--primary); color: white; }
        .btn-primary:hover { background: #172554; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(30, 58, 138, 0.25); }
        .btn-secondary { background: white; border: 1px solid var(--border); color: var(--secondary); }
        .btn-secondary:hover { background: var(--bg); border-color: var(--secondary); }

        /* QP Section */
        .qp-section { background: white; padding: 24px; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; border-left: 5px solid var(--primary); padding-left: 15px; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; }
        .qp-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .qp-table th { background: #f8fafc; text-align: left; padding: 12px; border-bottom: 2px solid var(--border); color: var(--secondary); font-size: 12px; text-transform: uppercase; }
        .qp-table td { padding: 12px; border-bottom: 1px solid var(--border); }
        input { width: 100%; padding: 10px; border: 2px solid var(--border); border-radius: 6px; font-family: 'JetBrains Mono', 'Courier New', monospace; font-weight: bold; color: var(--primary); }
        input:focus { outline: none; border-color: var(--primary); background: var(--primary-light); }

        /* Report Rendering */
        #report-viewer { margin-top: 40px; }
        .report-page { background: white; padding: 1.5cm; width: 210mm; min-height: 297mm; margin: 0 auto 30px auto; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #ddd; position: relative; }
        
        /* Print Styles */
        @media print {
            body { background: white; padding: 0; }
            .no-print { display: none !important; }
            .report-page { margin: 0; box-shadow: none; width: 100%!important; padding: 0; page-break-after: always; border: none; }
            @page { margin: 1.5cm; size: A4; }
        }

        /* Generic Table Style for all 9 Reports */
        .rt { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; font-family: serif; }
        .rt th { background: #f2f2f2 !important; color: black; border: 1px solid #333; padding: 8px; text-align: center; font-weight: bold; text-transform: uppercase; }
        .rt td { border: 1px solid #333; padding: 8px; vertical-align: top; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .rh { margin-bottom: 30px; text-align: center; border-bottom: 3px double #000; padding-bottom: 15px; }
        .rh h2 { margin: 0; font-size: 22px; text-transform: uppercase; }
        .rh h3 { margin: 8px 0 0 0; font-size: 16px; font-weight: normal; color: #333; }
        .rf { margin-top: 40px; display: flex; justify-content: space-between; font-weight: bold; font-family: serif; }

        /* Stickers Grid */
        .sticker-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10mm; margin-top: 10mm; }
        .sticker { border: 1px solid #222; padding: 10mm 5mm; text-align: center; min-height: 45mm; display: flex; flex-direction: column; justify-content: center; }
        .sticker-reg { font-size: 18pt; font-weight: 900; font-family: monospace; display: block; margin-bottom: 5px; }
        .sticker-room { font-size: 11pt; color: #333; border-top: 1px solid #eee; padding-top: 5px; }
    </style>
</head>
<body>
    <div class="container no-print">
        <header>
            <div class="header-top">
                <img src="\${this.LOGO_SVG}" class="logo" alt="Logo">
                <div>
                    <h1>Portable Session File: \${data.meta.examName}</h1>
                    <div style="font-size: 12px; color: var(--secondary); margin-top: 4px; font-weight: bold; background: #fffbeb; color: #b45309; padding: 2px 8px; border-radius: 4px; display: inline-block;">
                        📶 OFFLINE READY DOCUMENT
                    </div>
                </div>
            </div>
            <div class="session-info">
                <div class="info-pill">📅 \${data.meta.date}</div>
                <div class="info-pill">⏰ \${data.meta.time}</div>
                <div class="info-pill">📚 \${data.meta.stream}</div>
                <div class="info-pill">👤 \${data.students.length} Total Students</div>
            </div>
        </header>

        <section class="qp-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div class="section-title">Step 1: Assign QP Codes</div>
                <button onclick="importFromClipboard()" class="btn btn-secondary">
                    📋 Paste codes from Clipboard
                </button>
            </div>
            <table class="qp-table" id="qt">
                <thead><tr><th>Course Name / Code</th><th>Stream</th><th>Action: Enter QP Code Here</th></tr></thead>
                <tbody id="qb"></tbody>
            </table>
        </section>

        <section>
            <div class="section-title">Step 2: Generate Official Reports</div>
            <div class="report-grid">
                <button class="btn btn-primary" onclick="render('notice')">📢 1. Notice Board (A-Z)</button>
                <button class="btn btn-primary" onclick="render('roomwise')">🏠 2. Room-wise Seating</button>
                <button class="btn btn-primary" onclick="render('qp_dist')">📑 3. QP Dist. Proforma</button>
                <button class="btn btn-primary" onclick="render('qp_sum')">🔢 4. Consolidated QP Sum</button>
                <button class="btn btn-primary" onclick="render('invig')">👮 5. Invigilator Duty List</button>
                <button class="btn btn-primary" onclick="render('scribe')">✍️ 6. Scribe Assignments</button>
                <button class="btn btn-primary" onclick="render('stickers')">🏷️ 7. Desk Stickers (Grid)</button>
                <button class="btn btn-primary" onclick="render('bill')">💰 8. Staff Remuneration Bill</button>
                <button class="btn btn-primary" onclick="render('absentee')">🚫 9. Official Absentee Sheet</button>
            </div>
        </section>

        <div style="text-align: center; color: var(--secondary); font-size: 11px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            This document is a self-contained snapshot from <b>ExamFlow</b>.<br>
            Generated on \${data.meta.generatedAt} for \${data.meta.collegeName}.
        </div>
    </div>

    <div id="report-viewer"></div>

    <script>
        const D = \${JSON.stringify(data)};
        
        // 🛠️ QP Initialization
        function initQP() {
            const b = document.getElementById('qb');
            const courses = [...new Set(D.students.map(s => \`\${s.Course}|\${s.Stream || 'Regular'}\`))];
            courses.forEach(c => {
                const [code, stream] = c.split('|');
                const val = D.qpCodes[c] || '';
                const r = document.createElement('tr');
                r.innerHTML = \`<td>\${code}</td><td>\${stream}</td><td><input type="text" placeholder="e.g. 5432-A" data-key="\${c}" value="\${val}" onchange="D.qpCodes['\${c}']=this.value"></td>\`;
                b.appendChild(r);
            });
        }
        initQP();

        async function importFromClipboard() {
            try {
                const text = await navigator.clipboard.readText();
                const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
                const parsed = {};
                lines.forEach(l => {
                    const parts = l.split(/\\t|,|\\s+-\\s+/).map(p => p.trim()).filter(p => p);
                    if (parts.length >= 2) parsed[parts[0]] = parts[parts.length-1];
                });

                let matched = 0;
                document.querySelectorAll('#qt input').forEach(inp => {
                    const k = inp.dataset.key.split('|')[0];
                    if (parsed[k]) { inp.value = parsed[k]; D.qpCodes[inp.dataset.key] = parsed[k]; matched++; }
                });
                if (matched > 0) alert(\`✅ Success! Auto-filled \${matched} QP codes from clipboard data.\`);
                else alert("Notice: No matching course names found in clipboard. Please copy from university portal.");
            } catch(e) { alert("Access Denied: Please allow clipboard access to use this feature."); }
        }

        // 🖨️ THE MASTER REPORT ENGINE
        function render(type) {
            const v = document.getElementById('report-viewer');
            v.innerHTML = '';
            
            // Header Helper
            const getH = (title) => \`<div class="rh"><h2>\${D.meta.collegeName}</h2><h3>\${D.meta.examName}</h3><h4>\${D.meta.date} | \${D.meta.time} | \${title}</h4></div>\`;
            // Footer Helper
            const getF = () => \`<div class="rf"><span>Date: \${D.meta.date}</span><span>Signature of Chief Superintendent</span></div>\`;

            if (type === 'notice') {
                const p = createPage();
                p.innerHTML = getH('NOTICE BOARD SEATING (ALPHABETICAL)') + '<table class="rt"><thead><tr><th>#</th><th>Reg No</th><th>Candidate Name</th><th>Course</th><th>Room</th><th>Seat</th></tr></thead><tbody id="tb"></tbody></table>' + getF();
                const tb = p.querySelector('#tb');
                [...D.students].sort((a,b) => a.Name.localeCompare(b.Name)).forEach((s, i) => {
                    const room = D.allotment.find(r => r.students.some(st => (st['Register Number'] || st.RegisterNo) === s['Register Number']));
                    const seat = room?.students.find(st => (st['Register Number'] || st.RegisterNo) === s['Register Number'])?.seat || '?';
                    tb.innerHTML += \`<tr><td class="center">\${i+1}</td><td>\${s['Register Number']}</td><td>\${s.Name}</td><td>\${s.Course}</td><td class="center bold">\${room?.roomName || '-'}</td><td class="center bold">\${seat}</td></tr>\`;
                });
                v.appendChild(p);
            }

            if (type === 'roomwise') {
                D.allotment.forEach(room => {
                    const p = createPage();
                    p.innerHTML = getH(\`ROOM: \${room.roomName} (\${room.students.length} Students)\`) + '<table class="rt"><thead><tr><th>#</th><th>Reg No</th><th>Name</th><th>Course</th><th>Seat</th><th>Candidate Signature</th></tr></thead><tbody id="tb"></tbody></table>' + getF();
                    const tb = p.querySelector('#tb');
                    room.students.forEach((s, i) => {
                       const fs = D.students.find(fs => fs['Register Number'] === (s['Register Number'] || s.RegisterNo));
                       tb.innerHTML += \`<tr><td class="center">\${i+1}</td><td>\${s['Register Number'] || s.RegisterNo}</td><td>\${fs?.Name || '-'}</td><td style="font-size:10px">\${fs?.Course || '-'}</td><td class="center bold">\${s.seat || '?'}</td><td></td></tr>\`;
                    });
                    v.appendChild(p);
                });
            }

            if (type === 'qp_dist') {
                const p = createPage();
                p.innerHTML = getH('QUESTION PAPER DISTRIBUTION PROFORMA') + '<table class="rt"><thead><tr><th>Room</th><th>Location</th><th>Course Name</th><th>QP Code</th><th>Required</th><th>Signature</th></tr></thead><tbody id="tb"></tbody></table>' + getF();
                const tb = p.querySelector('#tb');
                D.allotment.forEach(room => {
                    const courses = {};
                    room.students.forEach(s => {
                        const fs = D.students.find(fs => fs['Register Number'] === (s['Register Number'] || s.RegisterNo));
                        if(fs) courses[fs.Course] = (courses[fs.Course] || 0) + 1;
                    });
                    Object.entries(courses).forEach(([c, count]) => {
                        const code = D.qpCodes[\`\${c}|Regular\`] || D.qpCodes[\`\${c}|Supplementary\`] || '???';
                        tb.innerHTML += \`<tr><td class="center bold">\${room.roomName}</td><td>\${D.roomConfig[room.roomName]?.location || '-'}</td><td>\${c}</td><td class="center bold">\${code}</td><td class="center bold">\${count}</td><td></td></tr>\`;
                    });
                });
                v.appendChild(p);
            }

            if (type === 'qp_sum') {
                const p = createPage();
                p.innerHTML = getH('CONSOLIDATED QP SUMMARY') + '<table class="rt"><thead><tr><th>QP Code</th><th>Full Course Name</th><th>Total Count</th><th>Bundles Used</th></tr></thead><tbody id="tb"></tbody></table>' + getF();
                const tb = p.querySelector('#tb');
                const sum = {};
                D.students.forEach(s => {
                   const code = D.qpCodes[\`\${s.Course}|Regular\`] || D.qpCodes[\`\${s.Course}|Supplementary\`] || 'NOT_SET';
                   if(!sum[s.Course]) sum[s.Course] = { code, count: 0 };
                   sum[s.Course].count++;
                });
                Object.entries(sum).forEach(([course, info]) => {
                    tb.innerHTML += \`<tr><td class="center bold">\${info.code}</td><td>\${course}</td><td class="center bold">\${info.count}</td><td></td></tr>\`;
                });
                v.appendChild(p);
            }

            if (type === 'invig') {
                const p = createPage();
                p.innerHTML = getH('INVIGILATOR DUTY LIST') + '<table class="rt"><thead><tr><th>Room</th><th>Location</th><th>Assigned Staff Name</th><th>Assigned By</th><th>Signature</th></tr></thead><tbody id="tb"></tbody></table>' + getF();
                const tb = p.querySelector('#tb');
                D.allotment.forEach(room => {
                    const invig = D.invigilators.find(i => i.room === room.roomName);
                    tb.innerHTML += \`<tr><td class="center bold">\${room.roomName}</td><td>\${D.roomConfig[room.roomName]?.location || '-'}</td><td class="italic">\${invig?.staffName || '(NOT ASSIGNED)'}</td><td class="center text-xs">Admin</td><td></td></tr>\`;
                });
                v.appendChild(p);
            }

            if (type === 'scribe') {
              const p = createPage();
              p.innerHTML = getH('SCRIBE ASSIGNMENT SUMMARY') + '<table class="rt"><thead><tr><th>Hall</th><th>Candidate</th><th>Scribe Name</th><th>Scribe Details</th></tr></thead><tbody id="tb"></tbody></table>' + getF();
              const tb = p.querySelector('#tb');
              if(D.scribes.length === 0) tb.innerHTML = '<tr><td colspan="4" class="center">No Scribe Allotments found for this session.</td></tr>';
              D.scribes.forEach(s => {
                  tb.innerHTML += \`<tr><td class="center">\${s.room}</td><td>\${s.regNo}</td><td>\${s.scribeName}</td><td>\${s.scribeCourse || ''}</td></tr>\`;
              });
              v.appendChild(p);
            }

            if (type === 'stickers') {
                const p = createPage();
                p.innerHTML = getH('DESK SEATING STICKERS') + '<div id="sg" class="sticker-grid"></div>';
                const sg = p.querySelector('#sg');
                D.students.forEach(s => {
                    const room = D.allotment.find(r => r.students.some(st => (st['Register Number'] || st.RegisterNo) === s['Register Number']));
                    const seat = room?.students.find(st => (st['Register Number'] || st.RegisterNo) === s['Register Number'])?.seat || '?';
                    sg.innerHTML += \`<div class="sticker"><span class="sticker-reg">\${s['Register Number']}</span><div class="sticker-room">\${room?.roomName || ''} - Seat \${seat}</div></div>\`;
                });
                v.appendChild(p);
            }

            if (type === 'absentee') {
                const p = createPage();
                p.innerHTML = getH('OFFICIAL ABSENTEE STATEMENT') + '<table class="rt"><thead><tr><th>#</th><th>Register Number</th><th>Candidate Name</th><th>Course</th><th>Seat</th></tr></thead><tbody id="tb"></tbody></table>' + getF();
                let count = 0; const tb = p.querySelector('#tb');
                Object.entries(D.absentees).forEach(([reg, info]) => {
                   const s = D.students.find(st => st['Register Number'] === reg);
                   if(s) { count++; tb.innerHTML += \`<tr><td class="center">\${count}</td><td>\${reg}</td><td>\${s.Name}</td><td>\${s.Course}</td><td class="center">\${info.seat || '-'}</td></tr>\`; }
                });
                if(count===0) tb.innerHTML = '<tr><td colspan="5" class="center italic">All candidates reported present. Nil Absentees.</td></tr>';
                v.appendChild(p);
            }

            if (type === 'bill') {
                const p = createPage();
                p.innerHTML = getH('REMUNERATION BILL SUMMARY') + '<table class="rt"><thead><tr><th>No.</th><th>Description of Duty</th><th>Rate (₹)</th><th>Count</th><th>Total Amount (₹)</th></tr></thead><tbody id="tb"></tbody></table>' + getF();
                const tb = p.querySelector('#tb');
                const iC = D.invigilators.length;
                const sC = D.scribes.length;
                tb.innerHTML += \`<tr><td class="center">1.</td><td>Invigilation Fees for Assistant Superintendents</td><td class="center">350.00</td><td class="center">\${iC}</td><td class="center">\${(iC*350).toFixed(2)}</td></tr>\`;
                tb.innerHTML += \`<tr><td class="center">2.</td><td>Scribe Remuneration Allowance</td><td class="center">150.00</td><td class="center">\${sC}</td><td class="center">\${(sC*150).toFixed(2)}</td></tr>\`;
                tb.innerHTML += \`<tr><td colspan="4" class="bold" style="text-align:right">GRAND TOTAL:</td><td class="center bold">₹ \${(iC*350 + sC*150).toFixed(2)}</td></tr>\`;
                v.appendChild(p);
            }

            window.scrollTo({ top: v.offsetTop - 50, behavior: 'smooth' });
            setTimeout(() => alert("✅ Report layout generated! Review the content below, then press Ctrl+P to print to A4."), 300);
        }

        function createPage() {
            const div = document.createElement('div'); div.className = 'report-page'; return div;
        }
    <\/script>
</body>
</html>\`;
    }
};

window.SESSION_EXPORT_JS = SESSION_EXPORT_JS;
