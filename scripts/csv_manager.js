// scripts/csv_manager.js
document.addEventListener("DOMContentLoaded", () => {
  const uploadInput = document.getElementById("csv-upload");
  const loadBtn = document.getElementById("load-csv-btn");
  const saveBtn = document.getElementById("save-corrections-btn");
  const downloadBtn = document.getElementById("download-csv-btn");
  const mergeBtn = document.getElementById("merge-corrections-btn");
  const tableContainer = document.getElementById("csv-table-container");

  loadBtn.addEventListener("click", async () => {
    if (!uploadInput.files.length) {
      alert("Please select a CSV file first.");
      return;
    }
    const file = uploadInput.files[0];
    const text = await file.text();
    renderEditableCSV(text);
  });

  saveBtn.addEventListener("click", () => {
    const csv = tableToCSV();
    if (!csv) { alert("No table to save."); return; }
    localStorage.setItem("uocExam_correctedCSV", csv);
    alert("Corrections saved locally.");
  });

  downloadBtn.addEventListener("click", () => {
    const csv = localStorage.getItem("uocExam_correctedCSV");
    if (!csv) { alert("No corrected CSV found."); return; }
    downloadBlob(csv, "Corrected_Nominal_Roll.csv");
  });

  mergeBtn.addEventListener("click", () => {
    const csv = localStorage.getItem("uocExam_correctedCSV");
    if (!csv) { alert("No corrected CSV to merge. Save corrections first."); return; }
    // Convert CSV -> JSON structure for extractedData
    const parsed = csvToObjects(csv);
    if (parsed && parsed.length) {
      localStorage.setItem("uocExam_extractedData", JSON.stringify(parsed));
      alert("Corrected CSV merged into extractedData.");
    } else {
      alert("Could not parse corrected CSV.");
    }
  });

  // auto restore if correctedCSV exists
  const savedCSV = localStorage.getItem("uocExam_correctedCSV");
  if (savedCSV) renderEditableCSV(savedCSV);

  // ---- helpers ----
  function renderEditableCSV(csvText) {
    const rows = csvText.trim().split(/\r?\n/).map(r => r.split(","));
    const table = document.createElement("table");
    table.className = "min-w-full";

    rows.forEach((cols, i) => {
      const tr = document.createElement("tr");
      if (i === 0) tr.innerHTML = cols.map(c => `<th>${escapeHtml(c.trim())}</th>`).join("");
      else {
        tr.innerHTML = cols.map(c => `<td><input class="w-full text-xs border-none" value="${escapeHtml(c.trim())}"/></td>`).join("");
      }
      table.appendChild(tr);
    });

    tableContainer.innerHTML = "";
    tableContainer.appendChild(table);
  }

  function tableToCSV() {
    const table = tableContainer.querySelector("table");
    if (!table) return null;
    const rows = [];
    table.querySelectorAll("tr").forEach((tr, idx) => {
      const cells = Array.from(tr.children).map(td => {
        const inp = td.querySelector("input");
        return inp ? sanitizeCSV(inp.value) : sanitizeCSV(td.textContent || "");
      });
      rows.push(cells.join(","));
    });
    return rows.join("\n");
  }

  function csvToObjects(csv) {
    const lines = csv.trim().split(/\r?\n/);
    if (!lines.length) return [];
    const headers = lines[0].split(",").map(h => h.trim());
    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim());
      if (cols.length === 0 || (cols.length === 1 && cols[0] === "")) continue;
      const obj = {};
      headers.forEach((h, idx) => obj[normalizeKey(h)] = cols[idx] || "");
      // map to expected extractedData keys
      out.push({
        reg_no: obj.reg_no || obj.RegNo || obj["register no"] || obj.register || (cols[0]||""),
        name: obj.name || obj.Name || obj.student || (cols[1]||""),
        course_code: obj.course_code || obj.CourseCode || obj.course || (cols[2]||"")
      });
    }
    return out;
  }

  function normalizeKey(k) { return k.toLowerCase().replace(/\s+/g, "_"); }
  function sanitizeCSV(s){ return (s||"").replace(/,/g," "); }
  function escapeHtml(s){ return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"); }

  function downloadBlob(text, filename) {
    const blob = new Blob([text], {type: "text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
});
