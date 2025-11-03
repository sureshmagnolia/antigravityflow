"""
extraction_real.py — Uses pdfminer.six for real PDF extraction.
Replaces extraction.py when pdfminer is available in PyScript.
"""

from js import document, console, localStorage, FileReader, URL
from pyodide.ffi import create_proxy
import asyncio
import json
from pdfminer.high_level import extract_text

def log(msg):
    status = document.getElementById("status")
    status.innerHTML += f"&gt; {msg}<br>"
    status.scrollTop = status.scrollHeight

async def read_file_to_temp(file):
    """Reads browser file into PyScript virtual FS (/tmp/tmp.pdf)."""
    future = asyncio.Future()

    def onload(evt):
        data = evt.target.result.to_py()
        with open("/tmp/tmp.pdf", "wb") as f:
            f.write(data)
        future.set_result("/tmp/tmp.pdf")

    reader = FileReader.new()
    reader.onload = create_proxy(onload)
    reader.readAsArrayBuffer(file)
    return await future

def parse_pdf(path):
    """Extracts text from PDF using pdfminer."""
    return extract_text(path)

async def start_extraction(event=None):
    log("Starting PDFMiner extraction...")
    input_el = document.getElementById("pdf-file")
    if not input_el.files.length:
        log("No PDF selected.")
        return

    combined = []
    for i in range(input_el.files.length):
        f = input_el.files.item(i)
        path = await read_file_to_temp(f)
        text = parse_pdf(path)
        combined.extend(extract_students_from_text(text))
        await asyncio.sleep(0.05)

    localStorage.setItem("uocExam_extractedData", json.dumps(combined))
    log(f"✅ Saved {len(combined)} records to localStorage.")
    create_csv_download(combined)

def extract_students_from_text(text):
    import re
    pattern = r"(\d{5,})\s+([A-Za-z][A-Za-z\s]+)\s+([A-Z]{3}\d+[A-Z]*\d*)"
    matches = re.findall(pattern, text)
    return [{"reg_no": r, "name": n.strip(), "course_code": c} for r, n, c in matches]

def create_csv_download(data):
    if not data:
        return
    keys = ["reg_no", "name", "course_code"]
    header = ",".join(keys)
    rows = [header] + [",".join(str(d.get(k, "")) for k in keys) for d in data]
    csv_text = "\n".join(rows)
    blob = __new__(Blob([csv_text], { "type": "text/csv" }))
    url = URL.createObjectURL(blob)
    link = document.createElement("a")
    link.href = url
    link.download = "Extracted_Data.csv"
    link.textContent = "📥 Download Extracted_Data.csv"
    document.getElementById("status").appendChild(link)
