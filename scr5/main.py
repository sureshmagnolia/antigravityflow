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
# 🧠 SMART PARSING HELPERS
# ==========================================

def clean_text(text):
    """Removes newlines and extra spaces."""
    if not text: return ""
    return str(text).replace('\n', ' ').strip()

def find_date_in_text(text):
    """Scans text for Date patterns (DD.MM.YYYY, DD-MM-YYYY, etc.)"""
    # Matches: 24.11.2025, 24-11-2025, 24/11/2025
    match = re.search(r'(\d{2}[./-]\d{2}[./-]\d{4})', text)
    if match:
        # Standardize to DD.MM.YYYY
        return match.group(1).replace('-', '.').replace('/', '.')
    return "Unknown"

def find_time_in_text(text):
    """Scans text for Time patterns (09:30 AM, 2.00 PM, etc.)"""
    text = text.upper().replace('.', ':')
    # Matches: 09:30 AM, 2:00 PM, 02:00PM
    match = re.search(r'(\d{1,2}:\d{2})\s*(AM|PM)', text)
    if match:
        h, m = match.group(1).split(':')
        p = match.group(2)
        return f"{int(h):02d}:{m} {p}"
    return "Unknown"

def find_course_name(text):
    """Scans text for Course Name patterns."""
    # Strategy 1: Look for "Course:" or "Paper:" labels
    match = re.search(r'(?:Course|Paper|Subject)\s*[:\-]?\s*([A-Z0-9\s\(\)\[\]\-]{5,})', text, re.IGNORECASE)
    if match:
        return clean_text(match.group(1))
    
    # Strategy 2: Look for course codes (e.g., ENG1A01)
    match = re.search(r'([A-Z]{3,}\d[A-Z]\d{2,}.*?(\[.*?\]|\(.*\)))', text)
    if match:
        return clean_text(match.group(0))
        
    return "Unknown"

def detect_columns(header_row):
    """
    Analyzes a header row to find indices for RegNo and Name.
    Returns: (reg_idx, name_idx)
    """
    reg_idx = -1
    name_idx = -1
    
    # Convert to lowercase for comparison
    row_lower = [str(cell).lower().strip() if cell else "" for cell in header_row]
    
    for i, col in enumerate(row_lower):
        # Detect Register Number Column
        if "reg" in col or "register" in col or "roll" in col:
            reg_idx = i
        # Detect Name Column
        elif "name" in col or "candidate" in col or "student" in col:
            name_idx = i
            
    return reg_idx, name_idx

# ==========================================
# 🚀 MAIN PROCESSING LOGIC
# ==========================================

async def process_file(file):
    try:
        array_buffer = await file.arrayBuffer()
        file_bytes = array_buffer.to_bytes()
        pdf_file = io.BytesIO(file_bytes)
        extracted_data = []

        with pdfplumber.open(pdf_file) as pdf:
            
            # --- 1. Extract Global Header Info (Date/Time/Course) ---
            # We scan the first page text to find these details once for the whole file
            first_page_text = ""
            if len(pdf.pages) > 0:
                first_page_text = pdf.pages[0].extract_text() or ""
            
            global_date = find_date_in_text(first_page_text)
            global_time = find_time_in_text(first_page_text)
            global_course = find_course_name(first_page_text)

            # --- 2. Iterate Pages ---
            for page_num, page in enumerate(pdf.pages):
                
                # Try "Lattice" strategy first (Grid lines)
                tables = page.extract_tables({
                    "vertical_strategy": "lines", 
                    "horizontal_strategy": "lines"
                })
                
                # Fallback: If no grid tables found, try "Text" strategy (Whitespace)
                if not tables:
                    tables = page.extract_tables({
                        "vertical_strategy": "text", 
                        "horizontal_strategy": "text"
                    })

                if not tables: continue

                # --- 3. Iterate Tables ---
                for table in tables:
                    # Reset indices for every table (headers might repeat)
                    reg_idx, name_idx = -1, -1
                    
                    # Pre-scan: Try to find header row
                    for row in table:
                        r_idx, n_idx = detect_columns(row)
                        if r_idx != -1 and n_idx != -1:
                            reg_idx, name_idx = r_idx, n_idx
                            break
                    
                    # Fallback: If no header found, assume standard positions (4 & 5) or (1 & 2)
                    if reg_idx == -1: 
                        # Heuristic: Look for a cell that looks like a RegNo
                        for i, row in enumerate(table):
                            clean_row = [str(c).strip() if c else "" for c in row]
                            if len(clean_row) > 4: reg_idx = 4; name_idx = 5; break # Standard UOC
                            if len(clean_row) > 1: reg_idx = 1; name_idx = 2; break # Simple list

                    # Process Rows
                    for row in table:
                        clean_row = [str(cell).strip() if cell else "" for cell in row]
                        
                        # Skip empty or short rows
                        if not any(clean_row) or len(clean_row) <= max(reg_idx, name_idx): 
                            continue

                        # Skip Header Rows (if they repeat)
                        row_str = " ".join(clean_row).lower()
                        if "register" in row_str or "name" in row_str:
                            continue

                        # Extract Values using dynamic indices
                        reg_no = clean_row[reg_idx]
                        name = clean_row[name_idx]

                        # VALIDATION: Reg No must be significant length
                        if len(reg_no) < 3: continue
                        # Name must be letters
                        if len(name) < 2: continue

                        extracted_data.append({
                            "Date": global_date,
                            "Time": global_time,
                            "Course": global_course,
                            "Register Number": reg_no,
                            "Name": name
                        })

        return extracted_data

    except Exception as e:
        js.console.error(f"Python Error: {e}")
        return []

async def start_extraction(event):
    file_input = document.getElementById("pdf-file")
    file_list = file_input.files
    
    if file_list.length == 0:
        js.alert("Please select at least one PDF file.")
        return

    # UI Feedback
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
            
            data = await process_file(file)
            all_exam_rows.extend(data)
            
        # SORTING
        status_div.innerText = "Sorting data..."
        
        def sort_key(row):
            try:
                d = datetime.strptime(row["Date"], "%d.%m.%Y")
            except:
                d = datetime.min
            return (d, row["Course"], row["Register Number"])

        all_exam_rows.sort(key=sort_key)

        # --- HANDOFF TO JAVASCRIPT ---
        json_data = json.dumps(all_exam_rows)
        js.window.handlePythonExtraction(json_data)
        # -----------------------------

        status_div.innerText = f"Done! Extracted {len(all_exam_rows)} candidates."

    except Exception as e:
        js.alert(f"An error occurred: {str(e)}")
        status_div.innerText = "Error occurred."
        
    finally:
        run_button.disabled = False
        run_button.classList.remove("opacity-50", "cursor-not-allowed")
        spinner.classList.add("hidden")
        button_text.innerText = "Run Batch Extraction"

# Expose function to HTML
window.start_extraction = start_extraction
