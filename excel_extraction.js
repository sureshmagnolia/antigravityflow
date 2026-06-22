/**
 * ExamFlow: Pure JS Excel Extraction Engine
 * Optimized for University Portal Nominal Roll Exports
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- SMART PARSING HELPERS (Translated from Python) ---
    function cleanText(text) {
        if (!text) return "";
        let t = String(text).replace(/\n/g, ' ').trim();
        return t.replace(/^[\s\-\)\]\.:,]+/, '').trim();
    }

    function findDateInText(text) {
        const match = text.match(/(\d{2}[./-]\d{2}[./-]\d{4})/);
        if (match) {
            return match[1].replace(/-/g, '.').replace(/\//g, '.');
        }
        return "";
    }

    function findTimeInText(text) {
        let t = text.toUpperCase().replace(/\./g, ':');
        const match = t.match(/(\d{1,2}:\d{2})\s*(AM|PM)/);
        if (match) {
            let h = match[1].split(':')[0];
            let m = match[1].split(':')[1];
            return `${String(parseInt(h)).padStart(2, '0')}:${m} ${match[2]}`;
        }
        return "";
    }

    function findCourseName(text) {
        let t = String(text).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        
        const pgMatch = t.match(/Paper\s*Details\s*[:\-]\s*(.*?)\s*--\s*\((.*?)\)\s*\/\s*(\d{4})/i);
        if (pgMatch) {
            let candidate = `${pgMatch[1].trim()} (${pgMatch[2].trim()}) [${pgMatch[3].trim()} SYLLABUS]`;
            candidate = candidate.replace(/[\s\-\.:,]+$/, '').trim();
            if (candidate.length > 3) return candidate;
        }

        const patternsToRemove = [
            /.*?University\s*of\s*Calicut/gi,
            /College\s*[:\-].*?(?=\s*(?:Course|Paper|Name|Slot|Session|Exam\s*Name|[A-Z]{2,}\d))/gi,
            /\b(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth)\b\s*?(?=\s*[A-Z]{2,}\d)/gi,
            /Nominal\s*Roll/gi, /Examination\s*[\w\s]*?\d{4}/gi, /Semester\s*[A-Za-z0-9]+/gi,
            /\bFirst\b/gi, /Page\s*\d+\s*of\s*\d+/gi, /Course\s*Code\s*[:\-]?/gi,
            /Paper\s*Details\s*[:\-]?/gi, /Name\s*of\s*Course\s*[:\-]?/gi, /\bCourse\b/gi,
            /Exam\s*Name\s*[:\-].*?(?=\s*Paper)/gi, /Exam\s*Name\s*[:\-]?/gi, /Name\s*[:\-]?/gi
        ];

        for (let pattern of patternsToRemove) {
            t = t.replace(pattern, ' ');
        }

        t = t.trim().replace(/^[\s\-\)\]\.:,]+/, '').trim();

        const stopMarkers = [
            /Slot/i, /Session/i, /Exam\s*Date/i, /Date\s*of\s*Exam/i, /Time\s*:/i,
            /\d{2}[./-]\d{2}[./-]\d{4}/, /Register\s*No/i, /Reg\.\s*No/i, /Maximum\s*Marks/i
        ];

        for (let marker of stopMarkers) {
            let parts = t.split(marker);
            if (parts.length > 1) t = parts[0].trim();
        }

        t = t.replace(/^\s*(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth)\s+/i, '');
        return t.length > 3 ? t : "Unknown Course";
    }

    function detectColumns(headerRow) {
        let regIdx = -1, nameIdx = -1;
        let rowLower = headerRow.map(cell => cell ? String(cell).toLowerCase().trim() : "");
        for (let i = 0; i < rowLower.length; i++) {
            let col = rowLower[i];
            if (col.includes("reg") || col.includes("register") || col.includes("roll")) regIdx = i;
            else if (col.includes("name") || col.includes("candidate") || col.includes("student")) nameIdx = i;
        }
        return { regIdx, nameIdx };
    }
    // ------------------------------------------------------
    const excelInput = document.getElementById('excel-file-upload');
    const runBtn = document.getElementById('run-excel-btn');
    const logEl = document.getElementById('excel-status-log');

    const log = (msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const color = type === 'error' ? 'text-red-400' : (type === 'success' ? 'text-green-300' : 'text-green-400');
        logEl.innerHTML += `<div class="${color}">[${timestamp}] ${msg}</div>`;
        logEl.scrollTop = logEl.scrollHeight;
    };

    runBtn.addEventListener('click', async () => {
        const files = excelInput.files;
        if (files.length === 0) {
            alert("Please select at least one Excel file.");
            return;
        }

        const examSelect = document.getElementById('upload-exam-select');
        const selectedExamName = examSelect ? examSelect.value : "";
        
        if (!selectedExamName) {
            alert("⚠️ Please select an Exam Name in the configuration box above first.");
            return;
        }

        runBtn.disabled = true;
        runBtn.innerHTML = "Processing...";
        log(`Starting extraction for ${files.length} file(s)...`);

        let allStudents = [];

        try {
            for (let file of files) {
                log(`Reading: ${file.name}`);
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                // SheetJS automatically detects if it's CSV or Excel
                const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });
                let examDate = "", paperName = "";
                let studentStartIndex = -1;
                let regIdx = 1, nameIdx = 2; // Defaults for PG strict mode

                const allHeaderRows = rows.slice(0, 15).map(r => r.join(' ')).join(' ');

                // 1. Extract Metadata (Strict PG Mode first)
                for (let i = 0; i < Math.min(rows.length, 15); i++) {
                    const rowStr = rows[i].join(" ");
                    if (!examDate && rowStr.includes("Exam Date")) {
                        examDate = rows[i][1] || rowStr.split(/[:,-]/)[1]?.trim();
                    }
                    if (!paperName && rowStr.includes("Paper Details")) {
                        paperName = rows[i][1] || rowStr.split(/[:,-]/)[1]?.trim();
                    }
                    if (rowStr.includes("Sl.No") && rowStr.includes("Reg.No")) {
                        studentStartIndex = i + 1;
                        regIdx = 1;
                        nameIdx = 2;
                    }
                }

                // 2. Dynamic Fallback (UG/FYUG Mode)
                if (studentStartIndex === -1) {
                    log(`⚠️ Strict layout not found. Switching to SMART parsing engine...`, 'warning');
                    
                    if (!examDate) examDate = findDateInText(allHeaderRows);
                    if (!paperName) paperName = findCourseName(allHeaderRows);
                    
                    // Header detection
                    for (let i = 0; i < Math.min(rows.length, 25); i++) {
                        let { regIdx: r, nameIdx: n } = detectColumns(rows[i]);
                        if (r !== -1 && n !== -1) {
                            regIdx = r; nameIdx = n; studentStartIndex = i + 1; break;
                        }
                    }

                    // Regex Data Fallback
                    if (studentStartIndex === -1) {
                        for (let i = 0; i < Math.min(rows.length, 25); i++) {
                            const clean = rows[i].map(c => c ? String(c).trim() : "");
                            if (clean.length > 1 && /[A-Z]+\d+/.test(clean[1])) {
                                regIdx = 1; nameIdx = 2; studentStartIndex = i; break;
                            }
                            if (clean.length > 4 && /[A-Z]+\d+/.test(clean[4])) {
                                regIdx = 4; nameIdx = 5; studentStartIndex = i; break;
                            }
                        }
                    }
                }

                if (studentStartIndex === -1) {
                    log(`❌ Could not find student list or headers in ${file.name}`, 'error');
                    continue;
                }

                // 3. Parse Students
                let fileStudentCount = 0;
                for (let i = studentStartIndex; i < rows.length; i++) {
                    const r = rows[i];
                    if (!r[regIdx] || !r[nameIdx]) continue; // Skip empty rows

                    let finalDate = "", finalTime = "";
                    if (examDate && examDate.includes(" ") && examDate.match(/\d{2}/)) {
                        // Strict parsing: "06.07.2026 10:00 AM"
                        const dateParts = examDate.split(' ');
                        finalDate = (dateParts[0] || "").replace(/[-/]/g, '.');
                        finalTime = dateParts.slice(1).join(' ') || "";
                    } else {
                        // Dynamic Fallback parsing
                        finalDate = examDate || findDateInText(allHeaderRows);
                        finalTime = findTimeInText(allHeaderRows);
                    }

                    // 4. Format Course Name to EXACTLY match PDF output
                    let courseName = paperName ? paperName.trim() : "Unknown Course";
                    if (courseName.includes('/')) {
                        let parts = courseName.split('/');
                        let mainPart = parts[0].trim();
                        let yearPart = parts[1] ? parts[1].replace(/[^0-9]/g, '') : "";
                        
                        mainPart = mainPart.replace(/--\(/g, ' (');
                        mainPart = mainPart.replace(/--/g, ' ');
                        
                        if (yearPart && yearPart.length === 4) {
                            courseName = `${mainPart} [${yearPart} SYLLABUS]`;
                        } else {
                            courseName = mainPart;
                        }
                    } else {
                        courseName = courseName.replace(/--\(/g, ' (').replace(/--/g, ' ');
                    }

                    allStudents.push({
                        "Register Number": cleanText(r[regIdx]),
                        "Name": cleanText(r[nameIdx]).replace(/\s+/g, ' '),
                        "Date": finalDate,
                        "Time": finalTime,
                        "Course": courseName,
                        "Exam Name": selectedExamName,
                        "Stream": document.getElementById('global-stream-select').value || "Regular",
                        "Source File": file.name // Match PDF output metadata
                    });
                    fileStudentCount++;
                }
                log(`✅ Found ${fileStudentCount} students in ${file.name}`, 'success');
            }

            if (allStudents.length > 0) {
                log(`Merging ${allStudents.length} students into database...`);
                
                log(`🚀 Sending ${allStudents.length} students to the System Receiver...`);
                
                // We use the EXACT same function the PDF extractor uses!
                if (typeof window.handlePythonExtraction === 'function') {
                    // We pass the data as a JSON string just like the Python script does
                    await window.handlePythonExtraction(JSON.stringify(allStudents));
                    
                    log(`🎉 Successfully integrated with ExamFlow!`, 'success');
                    alert(`✅ SUCCESS!\n\n${allStudents.length} students loaded.`);
                } else {
                    log(`❌ Error: 'handlePythonExtraction' not found in app.js.`, 'error');
                    // Fallback to basic load if the receiver is missing
                    if (typeof window.loadStudentData === 'function') {
                        await window.loadStudentData(allStudents);
                        log(`⚠️ Used fallback loader.`, 'warning');
                    }
                }
            }

        } catch (err) {
            log(`Critical Error: ${err.message}`, 'error');
            console.error(err);
        } finally {
            runBtn.disabled = false;
            runBtn.innerHTML = "Run Excel Extraction";
        }
    });
});
