import json

with open(r'C:\Users\sures\Downloads\ExamFLowErros\ExamFlow_Full_Backup_2026-10-17 (2).json', 'r', encoding='utf-8') as f:
    data = json.load(f)

sess_key = '02.11.2026 | 02:00 PM'
date, time = sess_key.split(' | ')

base_data = data.get('examBaseData', [])
if isinstance(base_data, str):
    base_data = json.loads(base_data)

allotments = data.get('examRoomAllotment', {})
if isinstance(allotments, str):
    allotments = json.loads(allotments)

rooms = allotments.get(sess_key, [])

# Check students matching session
matching_students = []
for s in base_data:
    s_date = str(s.get('Date', '')).strip()
    s_time = str(s.get('Time', '')).strip()
    if s_date == date and s_time == time:
        matching_students.append(s)

print(f"Matching students count for {sess_key}:", len(matching_students))

# Check sample student
if matching_students:
    print("Sample student record keys:", list(matching_students[0].keys()))
    print("Sample student:", matching_students[0])

# Streams present
streams = set(s.get('Stream', 'Regular') for s in matching_students)
print("Streams present in matching students:", streams)

# Courses present
courses = {}
for s in matching_students:
    c = s.get('Course', 'Unknown')
    courses[c] = courses.get(c, 0) + 1
print("Courses present in matching students:", courses)

# Check rooms
for idx, r in enumerate(rooms):
    r_name = r.get("roomName")
    r_cap = r.get("capacity")
    r_count = len(r.get("students", []))
    r_stream = r.get("stream")
    print(f"Room {idx+1}: {r_name}, cap: {r_cap}, students: {r_count}, stream: {r_stream}")
