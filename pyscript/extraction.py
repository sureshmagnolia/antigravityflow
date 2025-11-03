"""
extraction.py — PyScript module for extracting student data from PDF nominal rolls.
UOC Exam Management (Modular Version)
"""

from js import document, console, localStorage, URL, FileReader
from pyodide.ffi import create_proxy
import asyncio
import re
import json

# -----------------------------------------------
# Utility Functions
# -----------------------------------------------

def log(msg: str):
    """Append a message to the status log <pre> element."""
    status_el = document.getElementById("status")
    if not status_el:
        console.warn("Status element missing")
        return
    status_el.innerHTML += f"&gt; {msg}<br>"
    status_el.scrollTop = status_el.scrollHeight


async def read_pdf_text(file) -> str:
    """
    Reads a PDF file as text using pdf.js if available, otherwise as base64.
    This function acts as a placeholder for browser-side parsing.
    """
    future = asyncio.Future()

    def onload(event):
        result = event.target.result
        future.set_result(result)

    reader = FileReader.new()
    reader.onload = create_proxy(onload)
    reader.readAsText(file)
    return await future


# -----------------------------------------------
# Main Extraction Logic
# -----------------------------------------------

async def start_extraction(event=None):
    """
    Main batch extraction entry point. Called from 'Run Batch Extraction' button.
    """
    log("Starting batch extraction...")
    spinner = document.getElementById("spinner")
    button = document.getElementById("run-button")
    pdf_input = document.getElementById("pdf-file")

    if not pdf_input or not pdf_input.files.length:
        log("No PDF files selected.")
        return

    spinner.classList.remove("hidden")
    button.disabled = True

    combined_data = []
    total_files = pdf_input.files.length
    log(f"Found {total_files} file(s) to process.")

    for i in range(total_files):
        pdf_file = pdf_input.files.item(i)
        log(f"--- Processing file {i+1}/{total_files}: {pdf_file.name} ---")

        try:
            # Read PDF text (placeholder)
            text = await read_pdf_text(pdf_file)

            # Simulate data extraction
            extracted = extract_students_from_text(text)
            combined_data.extend(extracted)

            log(f"✓ Found {len(extracted)} student record(s).")

        except Exception as e:
            log(f"❌ Error processing {pdf_file.name}: {e}")

        # Yield to UI event loop
        await asyncio.sleep(0.05)

    # Save combined data to localStorage
    save_to_local_storage(combined_data)

    # Enable download
    create_csv_download(combined_data)

    spinner.classList.add("hidden")
    button.disabled = False
    log("✅ Extraction complete. Data saved to localStorage and ready for download.")


# -----------------------------------------------
# Simulated PDF Parsing (replace with pdfminer if needed)
# -----------------------------------------------

def extract_students_from_text(text: str):
    """
    Mock function that simulates extracting students from a PDF page text.
    This can be replaced with pdfminer.six-based parsing when supported.
    """
    # Example pattern: "12345 John Doe BOT3CJ201"
    pattern = r"(\d{5,})\s+([A-Za-z][A-Za-z\s]+)\s+([A-Z]{3}\d+[A-Z]*\d*)"
    matches = re.findall(pattern, text)
    students = [
        {"reg_no": reg.strip(), "name": name.strip(), "course_code": code.strip()}
        for reg, name, code in matches
    ]
    return students


# -----------------------------------------------
# Data Saving & CSV Generation
# -----------------------------------------------

def save_to_local_storage(data):
    """Save extracted data to localStorage as JSON."""
    try:
        localStorage.setItem("uocExam_extractedData", json.dumps(data))
    except Exception as e:
        log(f"⚠️ Failed to save to localStorage: {e}")


def create_csv_download(data):
    """Create and attach a downloadable CSV link to the page."""
    if not data:
        log("No data to save.")
        return

    # Convert list of dicts to CSV text
    keys = ["reg_no", "name", "course_code"]
    header = ",".join(keys)
    rows = [header] + [",".join(str(item.get(k, "")) for k in keys) for item in data]
    csv_text = "\n".join(rows)

    # Create Blob and download link
    blob = __new__(Blob([csv_text], { "type": "text/csv" }))
    url = URL.createObjectURL(blob)
    link = document.createElement("a")
    link.href = url
    link.download = "Combined_Nominal_Roll.csv"
    link.textContent = "📥 Download Combined_Nominal_Roll.csv"
    link.classList.add("mt-4", "block", "text-indigo-600", "font-semibold")

    output_div = document.getElementById("status")
    output_div.innerHTML += "<br>"
    output_div.appendChild(link)


# -----------------------------------------------
# Register Python callback for PyScript
# -----------------------------------------------
# This line connects the <button py-click="start_extraction"> in HTML
# to this Python function.
