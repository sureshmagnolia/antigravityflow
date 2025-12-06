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
    INCLUDES ALL FIXES:
    1. Multi-line protection (College remover lookahead)
    2. "Exam Name" / "Name:" garbage removal
    3. Space-tolerant Priority Regex (e.g., / 2019)
    4. Trailing ')' preservation
    5. Leading Ordinal (Third, First) removal
    """
    # 1. Flatten the text immediately (Fixes line breaks)
    text = str(text).replace('\n', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    
    # 2. PRIORITY EXTRACTION: PG Paper Details Format (NAME--(CODE)/YEAR)
    # FIX: Added \s* around the slash to handle "/ 2019" vs "/2019"
    pg_match = re.search(r"Paper\s*Details\s*[:\-]\s*(.*?)\s*--\s*\((.*?)\)\s*\/\s*\d{4}", text, flags=re.IGNORECASE)

    if pg_match:
        # Reconstruct as "NAME (CODE)"
        course_name = pg_match.group(1).strip()
        course_code = pg_match.group(2).strip()
        candidate = f"{course_name} ({course_code})"
        
        # FIX: Removed ')' and ']' from the cleanup list so we don't delete the closing parenthesis.
        candidate = re.sub(r'[\s\-\.:,]+$', '', candidate).strip()

        if len(candidate) > 3:
            return candidate

    # 3. FALLBACK EXTRACTION: Generic Cleaning (Used for Nominal Rolls & others)
    
    patterns_to_remove = [
        r".*?University\s*of\s*Calicut", 
        
        # FIX: College Remover now stops at "Course", "Paper", "Name", "Slot", "Exam Name"
        # This prevents it from deleting the first line of a 2-line course name.
        r"College\s*[:\-].*?(?=\s*(?:Course|Paper|Name|Slot|Session|Exam\s*Name|[A-Z]{2,}\d))", 
        
        # --- ORDINAL NUMBER REMOVER (Middle of text) ---
        r"\b(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth)\b\s*?(?=\s*[A-Z]{2,}\d)",
        
        # --- GARBAGE REMOVERS ---
        r"Nominal\s*Roll",
        r"Examination\s*[\w\s]*?\d{4}",
        r"Semester\s*[A-Za-z0-9]+",       
        r"\bFirst\b", 
        r"Page\s*\d+\s*of\s*\d+",
        r"Course\s*Code\s*[:\-]?",    
        r"Paper\s*Details\s*[:\-]?", 
        r"Name\s*of\s*Course\s*[:\-]?",
        r"\bCourse\b",
        
        # FIX: Explicitly remove "Exam Name" and "Name:" labels to prevent leakage
        r"Exam\s*Name\s*[:\-].*?(?=\s*Paper)", 
        r"Exam\s*Name\s*[:\-]?",
        r"Name\s*[:\-]?"
    ]
    
    for pattern in patterns_to_remove:
        text = re.sub(pattern, ' ', text, flags=re.IGNORECASE)

    # 4. Clean up the start
    text = text.strip()
    text = re.sub(r'^[\s\-\)\]\.:,]+', '', text).strip()

    # 5. Stop at Metadata (The end of the course name)
    stop_markers = [
        r"Slot",  
        r"Session",
        r"Exam\s*Date",
        r"Date\s*of\s*Exam",
        r"Time\s*:",
        r"\d{2}[./-]\d{2}[./-]\d{4}",
        r"Register\s*No",
        r"Reg\.\s*No",
        r"Maximum\s*Marks"
    ]
    
    for marker in stop_markers:
        parts = re.split(marker, text, flags=re.IGNORECASE)
        if len(parts) > 0:
            text = parts[0].strip()

    # FIX: Final Cleanup - Remove leading Ordinals (e.g., "Third BOT...")
    text = re.sub(r'^\s*(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth)\s+', '', text, flags=re.IGNORECASE)

    # 6. Final check
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
