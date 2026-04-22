/**
 * ExamFlow: Pure JS Excel Extraction Engine
 * Optimized for University Portal Nominal Roll Exports
 */

document.addEventListener('DOMContentLoaded', () => {
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

                // 1. Extract Metadata
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
                    }
                }

                if (studentStartIndex === -1) {
                    log(`❌ Could not find student list in ${file.name}`, 'error');
                    continue;
                }

                // 2. Parse Students
                let fileStudentCount = 0;
                for (let i = studentStartIndex; i < rows.length; i++) {
                    const r = rows[i];
                    if (!r[1] || !r[2]) continue; // Skip empty rows

                    const dateParts = (examDate || "").split(' ');
                    const finalDate = dateParts[0] || "";
                    const finalTime = dateParts.slice(1).join(' ') || "";

                    allStudents.push({
                        "Register Number": r[1].toString().trim(),
                        "Name": r[2].toString().trim(),
                        "Date": finalDate,
                        "Time": finalTime,
                        "Course": paperName ? paperName.split('/')[0].trim() : "Unknown Course",
                        "Exam Name": selectedExamName,
                        "Stream": document.getElementById('global-stream-select').value || "Regular",
                        "DOB": r[3] || ""
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
                    alert(`✅ SUCCESS!\n\n${allStudents.length} students loaded and synced via the System Receiver.`);
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
