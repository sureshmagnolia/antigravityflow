import pandas as pd
import pdfplumber
import re
import io
import js # V55: FIX - Import the main js module
from js import document, console, URL, Blob, window, localStorage # V55: FIX - Import specific parts
import asyncio
import json 
import math 
from datetime import datetime 

# --- Get references to our HTML elements ---
status_div = document.getElementById("status")
status_log_div = document.getElementById("status-log")

csv_download_container = document.getElementById("csv-download-container")
generate_report_button = document.getElementById("generate-report-button")
json_data_store = document.getElementById("json-data-store")
report_controls = document.getElementById("report-controls")
report_output_area = document.getElementById("report-output-area")

q_paper_data_store = document.getElementById("q-paper-data-store")
generate_qpaper_report_button = document.getElementById("generate-qpaper-report-button")

generate_daywise_report_button = document.getElementById("generate-daywise-report-button")

run_button = document.getElementById("run-button")
spinner = document.getElementById("spinner")
button_text = document.getElementById("button-text")

# V56: Absentee view elements
absentee_loader = document.getElementById("absentee-loader")
absentee_content_wrapper = document.getElementById("absentee-content-wrapper")
# V58: QP Code view elements
qpcode_loader = document.getElementById("qpcode-loader")
qpcode_content_wrapper = document.getElementById("qpcode-content-wrapper")

ROOM_CONFIG_KEY = 'examRoomConfig'
COLLEGE_NAME_KEY = 'examCollegeName' # V48: New key
BASE_DATA_KEY = 'examBaseData'; # V65: New key for persistent base data

def log_message(message):
    """Helper function to print messages to the HTML (Processing) log."""
    console.log(f"Process Log: {message}")
    status_div.innerHTML += f'<p class="mb-1">&gt; {message}</p>'
    status_div.scrollTop = status_div.scrollHeight

def log_status(message, is_error=False, file_name=None, page=None):
    """Helper function to print messages to the HTML Status log."""
    console.log(f"Status Log: {message}")
    color = "text-red-600" if is_error else "text-green-700"
    
    prefix = ""
    if file_name:
        prefix += f"<strong>{file_name}</strong>"
    if page:
        prefix += f" (Page: {page})"
    if prefix:
        prefix += ": "

    status_log_div.innerHTML += f'<p class="mb-1 {color}">&gt; {prefix}{message}</p>'
    status_log_div.scrollTop = status_log_div.scrollHeight

def show_loader(is_loading):
    """Shows or hides the loader and updates button text."""
    if is_loading:
        run_button.disabled = True
        spinner.classList.remove("hidden")
        button_text.textContent = "Processing..."
    else:
        run_button.disabled = False
        spinner.classList.add("hidden")
        button_text.textContent = "2. Run Batch Extraction"

def get_sort_key(row):
    """Converts DD.MM.YYYY, HH:MM PM, and Course to a sortable format."""
    try:
        # V38: Standardized on DD.MM.YYYY
        date_obj = datetime.strptime(row['Date'], '%d.%m.%Y')
        # V44: Handle inconsistent time formatting
        time_str = row['Time'].replace(" ", "")
        if len(time_str) == 7: # "9:30 AM" -> "09:30 AM"
            time_str = "0" + time_str
        
        time_obj = datetime.strptime(time_str, '%I:%M%p')
        
        # NEW: Add course name to the sort key
        course_name = row.get('Course', '') # Use .get for safety
        
        return (date_obj, time_obj, course_name) # Return a 3-part tuple
    except ValueError as e:
        console.log(f"Sort Error: Could not parse Date '{row['Date']}' or Time '{row['Time']}'. Error: {e}")
        # NEW: Still return 3 parts for consistent sorting
        return (datetime.min, datetime.min, row.get('Course', ''))

# --- V60: COURSE NAME NORMALIZER ---
def normalize_course_name(course_name):
    """Attempts to find a course code and standardize the name."""
    course_name = course_name.strip().replace('\n', ' ')
    
    # 1. Regex to find a course code, e.g., (ECO5B07) or [BCM5B07]
    # This looks for 3 letters, a number, a letter, and 2 numbers
    code_match = re.search(r'[\[\(-]{2}([A-Z]{3}\d[A-Z]\d{2,})[\]\)-]{2}', course_name, re.IGNORECASE)
    if not code_match:
        code_match = re.search(r'([A-Z]{3}\d[A-Z]\d{2,})', course_name, re.IGNORECASE)

    if code_match:
        code = code_match.group(1).upper()
        
        # 2. Extract the "clean name" part
        # Take everything before the match, or before common markers
        clean_name = course_name
        stop_markers = ['(', '[', '/']
        for marker in stop_markers:
            if marker in clean_name:
                clean_name = clean_name.split(marker)[0]
        
        clean_name = clean_name.strip().replace('--', '').replace(':', '').upper()
        
        # 3. Rebuild the standardized name
        return f"{clean_name}--({code})"
    
    # If no code found, just return the cleaned-up original
    return re.sub(r'\s+', ' ', course_name).strip().upper()

# --- V40: STATEFUL PARSER for the "NEW" PDF format ---
def extract_new_format_header(page_text):
    """Extracts header from Page 1 of the new format."""
    date_val, time_val, course_name = "Unknown", "Unknown", "Unknown"
    try:
        # V45: Make regexes handle newlines
        dt_match = re.search(r'Exam Date:\s*(\d{2}-\d{2}-\d{4})\s*(\d{2}:\d{2}\s*[AP]M)', page_text, re.DOTALL)
        if dt_match:
            date_val = dt_match.group(1).replace('-', '.')
            time_val = dt_match.group(2)
        
        course_match = re.search(r'Paper Details:\s*(.*?)/', page_text, re.DOTALL)
        if course_match:
            course_name = course_match.group(1).strip().replace('\n', ' ')
    except Exception:
        pass # Errors will be logged by the caller if fields are "Unknown"
    return date_val, time_val, course_name

def extract_new_format_students(page_text, file_name, page_num):
    """Extracts only students from any page of the new format."""
    page_rows = []
    # V57: FIX - This regex is more robust. It only looks for the first 3 fields
    # and doesn't care about the trailing commas, which are missing on page 2+.
    student_regex = re.compile(
        r'"\d+\s*","([A-Z0-9]+)\s*","(.*?)\s*","', # Match Sl.No, Reg.No, and Name
        re.DOTALL
    )
    for match in student_regex.finditer(page_text):
        try:
            reg_no = match.group(1).strip()
            name = match.group(2).strip().replace('\n', ' ')
            page_rows.append({'Register Number': reg_no, 'Name': name})
        except Exception as e:
            log_status(f"Skipping row. Details: {e}", is_error=True, file_name=file_name, page=page_num)
    return page_rows

# --- V40: STATEFUL PARSER for the "OLD" PDF format (V44: ROBUST) ---
def extract_old_format_header(page_text):
    """Extracts header from Page 1 of the old format."""
    date_val, time_val, course_name = "Unknown", "Unknown", "Unknown"
    try:
        # --- Course Regex ---
        # 1. Try (CORE) or [syllabus]
        course_match = re.search(r'([A-Z0-9]{3,}\d{3,}.*?(\[.*?syllabus\]|\(CORE\)))', page_text, re.DOTALL | re.IGNORECASE)
        if not course_match:
            # 2. Try B.A. ... (CORE)
            course_match = re.search(r'^(B\.?[A-Z]{1,3}\.?\s*.*?\(CORE\))', page_text, re.MULTILINE | re.IGNORECASE)
        if not course_match:
            # 3. Try line with (CCSS)
            course_match = re.search(r'^(.*?\(CCSS.*?\))$', page_text, re.MULTILINE | re.IGNORECASE)
        if not course_match:
            # 4. Try all-caps line with a course code
            course_match = re.search(r'^([A-Z\s\d\(\)\[\]]{10,}\s[A-Z]{3}\d[A-Z]\d{2,})$', page_text, re.MULTILINE)
        
        if course_match:
            course_name = course_match.group(1).strip().replace('\n', ' ')
            course_name = course_name.replace(' Course [', ' [')
        
        # --- Date/Time Regex ---
        datetime_match = None
        
        # 1. Try simple DD.MM.YYYY HH:MM AM/PM
        try:
            datetime_match = re.search(
                r'(\d{2}\.\d{2}\.\d{4})\s+(\d{1,2}:\d{2}\s*[AP]M)', 
                page_text, 
                re.DOTALL | re.IGNORECASE
            )
        except Exception: pass
        
        if not datetime_match:
            # 2. Try 'Date of Examination'
            try:
                datetime_match = re.search(
                    r'Date of Examination.*?:?\s*(\d{2}\.\d{2}\.\d{4})\s*(\d{1,2}:\d{2}\s*[AP]M|002:0 0PM)', 
                    page_text, 
                    re.DOTALL | re.IGNORECASE # Make : optional
                )
            except Exception: pass 
        
        if not datetime_match:
            # 3. Try generic 'Date'
            try:
                datetime_match = re.search(
                    r'Date.*?(\d{2}\.\d{2}\.\d{4})[\s\S]{0,100}?(\d{1,2}:\d{2}\s*[AP]M|002:0 0PM)', 
                    page_text, 
                    re.DOTALL | re.IGNORECASE
                )
            except Exception: pass 
                                
        if datetime_match:
            date_val = datetime_match.group(1).strip()
            time_val = datetime_match.group(2).strip()
            if "002:0 0PM" in time_val: time_val = "02:00 PM"
            if " " not in time_val: # Fix for "09:30AM"
                time_val = time_val.replace("AM", " AM").replace("PM", " PM")
            
            # V44: Standardize time format (e.g., 9:30 AM -> 09:30 AM)
            time_parts = time_val.split(':')
            if len(time_parts) > 0 and len(time_parts[0]) == 1:
                time_val = "0" + time_val

    except Exception:
        pass # Errors will be logged by the caller if fields are "Unknown"
    return date_val, time_val, course_name

def extract_old_format_students(page, file_name, page_num):
    """Extracts only students from any page of the old format."""
    page_rows = []
    reg_num_regex = re.compile(r'([A-Z0-9]{5,}\d{3})')
    tables = page.extract_tables()
    
    for table in tables:
        for row in table:
            try:
                if not row or not row[0]: continue
                if not row[0].strip().isdigit(): continue
                reg_num, name = "Unknown", "Unknown"
                for idx, cell in enumerate(row):
                    if not cell: continue
                    cell_text = cell.strip().replace('\n', ' ')
                    reg_match = reg_num_regex.search(cell_text)
                    if reg_match:
                        reg_num = reg_match.group(1)
                        name_fragment = cell_text.replace(reg_num, '').strip()
                        if name_fragment and not reg_num_regex.search(name_fragment) and not name_fragment.isdigit():
                            name = name_fragment
                            break
                        try:
                            next_cell = row[idx+1]
                            if next_cell and next_cell.strip():
                                name = next_cell.strip().replace('\n', ' ')
                                break
                            next_next_cell = row[idx+2]
                            if next_next_cell and next_next_cell.strip():
                                name = next_next_cell.strip().replace('\n', ' ')
                                break
                        except IndexError: pass
                if reg_num != "Unknown":
                    page_rows.append({'Register Number': reg_num.strip(), 'Name': name.strip()})
            except Exception as e:
                error_msg = f"Skipping row. Details: {e}"
                log_message(f"Warning: {e}")
                log_status(error_msg, is_error=True, file_name=file_name, page=page_num)
    return page_rows

async def start_extraction(event=None):
    """
    This function is the entry point from the "Run" button.
    It calls the main extraction function.
    """
    # V55: No need to import js, it's global
    try:
        show_loader(True)
        await asyncio.sleep(0) # Let loader show
        
        # V33: Clear the CSV upload status
        js.clear_csv_upload_status() # This needs the global 'js'
            
        # Call the main logic function
        await run_extraction_py()
        
    except Exception as e:
        log_message(f"Critical bridge error: {e}")
    finally:
        show_loader(False)

async def run_extraction_py(event=None):
    """
    This is the main extraction logic.
    V40: Re-written to be STATEFUL and FILE-BASED.
    """
    errors_list = []
    try: # <-- CORRECTED SYNTAX
        # --- 1. Reset all UI elements ---
        csv_download_container.innerHTML = ""
        generate_report_button.disabled = True
        generate_qpaper_report_button.disabled = True
        generate_daywise_report_button.disabled = True
        js.disable_absentee_tab(True) # V56: Disable absentee tab
        js.disable_qpcode_tab(True) # V58: Disable QP Code tab
        json_data_store.innerHTML = ""
        q_paper_data_store.innerHTML = ""
        status_div.innerHTML = ""
        status_log_div.innerHTML = "Waiting for extraction to complete..."
        report_controls.classList.add("hidden")
        report_output_area.innerHTML = ""
        report_output_area.style.display = 'none'
        
        log_message("Starting batch extraction...")
        
        file_input = document.getElementById("pdf-file")
        file_list = file_input.files
                        
        if file_list.length == 0:
            log_message("Error: Please select one or more PDF files first.")
            log_status("Error: Please select one or more PDF files first.", is_error=True)
            errors_list.append("No files selected")
            return
        
        # --- 2. PDF Processing Loop (V40 STATEFUL) ---
        all_exam_rows = []
        total_files = file_list.length
        log_message(f"Found {total_files} file(s) to process.")
                        
        for file_index in range(total_files):
            file = file_list.item(file_index)
            file_name = file.name
            log_message(f"--- Processing file {file_index + 1}/{total_files}: {file_name} ---")
            
            try:
                file_bytes = await file.arrayBuffer()
                pdf_file_obj = io.BytesIO(file_bytes.to_py())
                                        
                with pdfplumber.open(pdf_file_obj) as pdf:
                    if not pdf.pages:
                        log_status("File has no pages.", is_error=True, file_name=file_name, page="N/A")
                        errors_list.append("File has no pages")
                        continue

                    # --- V40: STATEFUL LOGIC ---
                    # 1. Read Page 1 to get header and determine format
                    page1_text = pdf.pages[0].extract_text(y_tolerance=3, x_tolerance=3)
                    
                    file_date = "Unknown"
                    file_time = "Unknown"
                    file_course = "Unknown"
                    is_new_format = False

                    # V57: FIX - Robust check for "New Format"
                    # Check for the unique, quoted, CSV-style header.
                    page1_text_flat = page1_text.replace("\n", "")
                    # V57: Now using Reg.No, Name, D.O.B check
                    if '"SI.No","Reg.No","Name","D.O.B"' in page1_text_flat or '"SI.No" ,"Reg.No" ,"Name" ,"D.O.B"' in page1_text_flat:
                        # This is DEFINITELY the NEW format
                        is_new_format = True
                        file_date, file_time, file_course = extract_new_format_header(page1_text)
                        log_message("Detected 'New' PDF format.")
                    else:
                        # Assume OLD format
                        is_new_format = False
                        file_date, file_time, file_course = extract_old_format_header(page1_text)
                        log_message("Detected 'Old' PDF format.")


                    # Log warnings if header info is still unknown
                    if file_date == "Unknown":
                        log_status("Could not determine Exam Date.", is_error=True, file_name=file_name, page=1)
                        errors_list.append("Unknown Date")
                    if file_time == "Unknown":
                        log_status("Could not determine Exam Time.", is_error=True, file_name=file_name, page=1)
                        errors_list.append("Unknown Time")
                    if file_course == "Unknown":
                        log_status("Could not determine Course.", is_error=True, file_name=file_name, page=1)
                        errors_list.append("Unknown Course")

                    # 2. Loop through ALL pages (including page 1) to extract students
                    total_students_in_file = 0
                    for i, page in enumerate(pdf.pages):
                        page_num = i + 1
                        
                        page_students = []
                        if is_new_format:
                            page_text = page.extract_text(y_tolerance=3, x_tolerance=3)
                            page_students = extract_new_format_students(page_text, file_name, page_num)
                        else:
                            page_students = extract_old_format_students(page, file_name, page_num)
                        
                        if page_students:
                            total_students_in_file += len(page_students)
                            # 3. Apply the STORED header info to all students found
                            for student in page_students:
                                all_exam_rows.append({
                                    'Date': file_date,
                                    'Time': file_time,
                                    'Course': file_course, # This is the "dirty" name
                                    'Register Number': student['Register Number'],
                                    'Name': student['Name']
                                })
                        else:
                            log_status(f"No students found on page.", is_error=False, file_name=file_name, page=page_num)
                    
                    log_message(f"Found {total_students_in_file} students in this file.")
                    # --- END V44 STATEFUL LOGIC ---

            except Exception as e:
                error_msg = f"CRITICAL ERROR processing file. Skipping this file. Details: {e}"
                log_message(error_msg)
                log_status(error_msg, is_error=True, file_name=file_name, page="N/A")
                errors_list.append(error_msg) 
        
        log_message("--- Batch processing complete. ---")

        if not all_exam_rows:
            log_message("Error: No data was extracted from any file.")
            return
        
        # --- 3. Sorting ---
        log_message(f"Found {len(all_exam_rows)} total candidates from {total_files} file(s).")
        await asyncio.sleep(0)
        
        # --- 4. V60: NORMALIZE COURSE NAMES ---
        log_message("Normalizing course names...")
        normalized_rows = []
        for row in all_exam_rows:
            normalized_course = normalize_course_name(row['Course'])
            row['Course'] = normalized_course
            normalized_rows.append(row)
        all_exam_rows = normalized_rows
        log_message("Course names normalized.")
        
        log_message("Sorting all entries by Date, Time, and Course...")
        all_exam_rows_sorted = sorted(all_exam_rows, key=get_sort_key)
        await asyncio.sleep(0)
                        
        log_message("Data sorting complete.")
        
        # --- 5. Data Export & UI Update ---
        log_message("Converting to DataFrame...")
        df = pd.DataFrame(all_exam_rows_sorted)
        
        # --- 6. Q-PAPER REPORT SUMMARY ---
        log_message("Generating question paper summary...")
        # V38: Group by all fields to get unique course names
        q_paper_df = df.groupby(['Date', 'Time', 'Course']).size().reset_index(name='Student Count')
        q_paper_summary_json = q_paper_df.to_json(orient='records')
        q_paper_data_store.innerHTML = q_paper_summary_json
        log_message("Question paper summary generated.")

        # --- 7. Create CSV and enable buttons ---
        df_csv = df[['Date', 'Time', 'Course', 'Register Number', 'Name']]
        csv_data = df_csv.to_csv(index=False, encoding='utf-8')
        
        blob = Blob.new([csv_data], {type: "text/csv;charset=utf-8"})
        url = URL.createObjectURL(blob)
        csv_filename = 'Combined_Nominal_Roll.csv'
        
        csv_download_container.innerHTML = f"""
            <a href="{url}" download="{csv_filename}"
               class="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-green-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                Download {csv_filename} ({len(all_exam_rows)} rows)
            </a>
        """
        
        json_data = json.dumps(all_exam_rows_sorted)
        json_data_store.innerHTML = json_data
        
        # V65: Save the base data to localStorage
        localStorage.setItem(BASE_DATA_KEY, json_data)
        
        generate_report_button.disabled = False
        generate_qpaper_report_button.disabled = False
        generate_daywise_report_button.disabled = False
        js.disable_absentee_tab(False) # V56: Enable absentee tab
        js.disable_qpcode_tab(False) # V58: Enable QP Code tab
        js.disable_room_allotment_tab(False) # Enable room allotment tab
        js.populate_session_dropdown() # V56: Populate dropdown
        js.populate_qp_code_session_dropdown() # V61: Populate QP Code dropdown
        js.populate_room_allotment_session_dropdown() # Populate room allotment dropdown
                        
        log_message("Success! Your combined files are ready.")
    
    except Exception as e:
        error_msg = f"An error occurred: {e}"
        log_message(error_msg)
        log_status(error_msg, is_error=True, file_name="Application", page="N/A")
        errors_list.append(error_msg)
    finally:
        # (V18): Log final status message
        if not errors_list:
            if file_list.length > 0: # Only show success if files were processed
                log_status("Success: All files processed with no errors.", is_error=False)
        else:
            log_status(f"Completed with {len(errors_list)} errors/warnings. See details above.", is_error=True)
