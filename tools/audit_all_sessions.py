import json

with open(r'C:\Users\sures\Downloads\ExamFLowErros\ExamFlow_Full_Backup_2026-10-17 (2).json', 'r', encoding='utf-8') as f:
    data = json.load(f)

base = json.loads(data['examBaseData']) if isinstance(data['examBaseData'], str) else data['examBaseData']
allotments = json.loads(data['examRoomAllotment']) if isinstance(data['examRoomAllotment'], str) else data['examRoomAllotment']

# Count students per session in base data
session_student_counts = {}
for s in base:
    d = str(s.get('Date', '')).strip()
    t = str(s.get('Time', '')).strip()
    key = f"{d} | {t}"
    session_student_counts[key] = session_student_counts.get(key, 0) + 1

print("--- AUDIT OF ALL SESSIONS IN BACKUP ---")
for sess, rooms in allotments.items():
    tot_needed = session_student_counts.get(sess, 0)
    allotted_stus = sum(len(r.get('students', [])) for r in rooms)
    remaining = tot_needed - allotted_stus
    status = "COMPLETE" if remaining == 0 else f"INCOMPLETE (Rem: {remaining})"
    if remaining > 0:
        print(f"SESSION: {sess} | Needed: {tot_needed} | Allotted: {allotted_stus} | Rooms: {len(rooms)} | Status: {status}")
