import pandas as pd
import pdfplumber
import re
import io
import js
from js import document, console, URL, Blob, window, localStorage
import asyncio
import json
from datetime import datetime

# ==========================================
# 🧠 SMART PARSING HELPERS (Universal)
# ==========================================

def clean_text(text):
    """Removes newlines and extra spaces."""
    if not text: return ""
    text = str(text).replace('\n', ' ').strip()
    # Remove broken start chars like : - . ,
    text = re.sub(r'^[\s\-\)\]\.:,]+', '', text).strip()
    return text

def find_date_in_text(text):
    """Scans text for Date patterns (DD.MM.YYYY or DD-MM-YYYY)"""
    match = re.search(r'(\d{2}[./-]\d{2}[./-]\d{4})', text)
    if match:
        return match.group(1).replace('-', '.').replace('/', '.')
    return "Unknown"

def find_time_in_text(text):
    """Scans text for Time patterns (09:30 AM, 2.00 PM)"""
    text = text.upper().replace('.', ':')
    match = re.search(r'(\d{1,2}:\d{2})\s*(AM|PM)', text)
    if match:
        h, m = match.group(1).split(':')
        p = match.group(2)
        return f"{int(h):02d}:{m} {p}"
    return "Unknown"

def find_course_name(text):
    """
    Scans text for Course Name.
    FIX: Uses re.sub ONLY to ensure no text is dropped due to splitting.
    """
    # 1. Flatten the text immediately (Fixes line breaks)
    # This turns: "Computers & \n Computational" -> "Computers &   Computational"
    text = str(text).replace('\n', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    
    # 2. Define patterns to DELETE (Replace with empty space)
    # These are headers that might appear before or *inside* the text stream.
    patterns_to_remove = [
        r"College\s*:\s*[\w\s,]*?PALAKKAD", 
        r"Nominal\s*Roll",
        r"Examination\s*[\w\s]*?\d{4}",
        r"Semester\s*[A-Za-z0-9]+",  # Matches Semester I, Semester FYUG, etc.
        r"Page\s*\d+\s*of\s*\d+",
        r"Course\s*Code\s*[:\-]?",   # Remove the label "Course Code"
        r"Paper\s*Details\s*[:\-]?", # Remove the label "Paper Details"
        r"Name\s*of\s*Course\s*[:\-]?"
    ]
    
    for pattern in patterns_to_remove:
        # We replace with a single space to prevent words from gluing together
        text = re.sub(pattern, ' ', text, flags=re.IGNORECASE)

    # 3. Clean up the start
    # If the text was "Course Code: CSC101", we removed "Course Code:", leaving " CSC101"
    text = text.strip()
    text = re.sub(r'^[\s\-\)\]\.:,]+', '', text).strip()

    # 4. Stop at Metadata (The end of the course name)
    # We use split here only to chop off the footer/metadata that follows the name.
    # We take the FIRST part ([0]) because the name comes BEFORE the date/reg no.
    stop_markers = [
        r"Exam\s*Date",
        r"Date\s*of",
        r"Session",
        r"Time\s*:",
        r"\d{2}[./-]\d{2}[./-]\d{4}", # Date pattern
        r"Register\s*No",
        r"Reg\.\s*No",
        r"Maximum\s*Marks"
    ]
    
    for marker in stop_markers:
        # Split on the marker and keep the left side (the name)
        parts = re.split(marker, text, flags=re.IGNORECASE)
        if len(parts) > 0:
            text = parts[0].strip()

    # 5. Final Cleanup
    return text if len(text) > 3 else "Unknown"

def detect_columns(header_row):
    """Analyzes a header row to find indices for RegNo and Name."""
    reg_idx = -1
    name_idx = -1
    row_lower = [str(cell).lower().strip() if cell else "" for cell in header_row]
    
    for i, col in enumerate(row_lower):
        if "reg" in col or "register" in col or "roll" in col:
            reg_idx = i
        elif "name" in col or "candidate" in col or "student" in col:
            name_idx = i
    return reg_idx, name_idx

# ==========================================
# 🚀 MAIN PROCESSING LOGIC
# ==========================================

async def process_file(file, filename):
    try:
        array_buffer = await file.arrayBuffer()
        file_bytes = array_buffer.to_bytes()
        pdf_file = io.BytesIO(file_bytes)
        extracted_data = []

        with pdfplumber.open(pdf_file) as pdf:
            first_page_text = ""
            if len(pdf.pages) > 0:
                first_page_text = pdf.pages[0].extract_text() or ""
            
            global_date = find_date_in_text(first_page_text)
            global_time = find_time_in_text(first_page_text)
            global_course = find_course_name(first_page_text)

            for page in pdf.pages:
                tables = page.extract_tables({"vertical_strategy": "lines", "horizontal_strategy": "lines"})
                if not tables:
                    tables = page.extract_tables({"vertical_strategy": "text", "horizontal_strategy": "text"})
                if not tables: continue

                for table in tables:
                    reg_idx, name_idx = -1, -1
                    for row in table:
                        r_idx, n_idx = detect_columns(row)
                        if r_idx != -1 and n_idx != -1:
                            reg_idx, name_idx = r_idx, n_idx
                            break
                    
                    if reg_idx == -1: 
                        sample_row = table[0] if table else []
                        if len(sample_row) >= 5:
                            for i, row in enumerate(table):
                                clean = [str(c).strip() if c else "" for c in row]
                                if len(clean) > 1 and re.search(r'[A-Z]+\d+', clean[1]):
                                    reg_idx = 1; name_idx = 2; break
                                if len(clean) > 4 and re.search(r'[A-Z]+\d+', clean[4]):
                                    reg_idx = 4; name_idx = 5; break

                    if reg_idx != -1 and name_idx != -1:
                        for row in table:
                            clean_row = [str(cell).strip() if cell else "" for cell in row]
                            if len(clean_row) <= max(reg_idx, name_idx): continue
                            row_str = " ".join(clean_row).lower()
                            if "register" in row_str or "name" in row_str: continue

                            val_reg = clean_text(clean_row[reg_idx])
                            val_name = clean_text(clean_row[name_idx])

                            if len(val_reg) < 3: continue
                            if len(val_name) < 2: continue

                            extracted_data.append({
                                "Date": global_date,
                                "Time": global_time,
                                "Course": global_course,
                                "Register Number": val_reg,
                                "Name": val_name,
                                "Source File": filename
                            })
        return extracted_data

    except Exception as e:
        js.console.error(f"Python Error in {filename}: {e}")
        return []

async def start_extraction(event):
    file_input = document.getElementById("pdf-file")
    file_list = file_input.files
    
    if file_list.length == 0:
        js.alert("Please select at least one PDF file.")
        return

    run_button = document.getElementById("run-button")
    spinner = document.getElementById("spinner")
    button_text = document.getElementById("button-text")
    status_div = document.getElementById("status")
    
    run_button.disabled = True
    run_button.classList.add("opacity-50", "cursor-not-allowed")
    spinner.classList.remove("hidden")
    button_text.innerText = "Processing..."
    status_div.innerText = "Starting extraction..."

    all_exam_rows = []
    
    try:
        for i in range(file_list.length):
            file = file_list.item(i)
            status_div.innerText = f"Processing file {i+1}/{file_list.length}: {file.name}..."
            
            # Pass filename to process_file
            data = await process_file(file, file.name)
            all_exam_rows.extend(data)
            
        status_div.innerText = "Sorting data..."
        
        def sort_key(row):
            try: d = datetime.strptime(row["Date"], "%d.%m.%Y")
            except: d = datetime.min
            try: t = datetime.strptime(row["Time"], "%I:%M %p")
            except: t = datetime.min
            return (d, t, row["Course"], row["Register Number"])

        all_exam_rows.sort(key=sort_key)

        json_data = json.dumps(all_exam_rows)
        js.window.handlePythonExtraction(json_data)

        status_div.innerText = f"Done! Extracted {len(all_exam_rows)} candidates."

    except Exception as e:
        js.alert(f"An error occurred: {str(e)}")
        status_div.innerText = "Error occurred."
        
    finally:
        run_button.disabled = False
        run_button.classList.remove("opacity-50", "cursor-not-allowed")
        spinner.classList.add("hidden")
        button_text.innerText = "Run Batch Extraction"

window.start_extraction = start_extraction
