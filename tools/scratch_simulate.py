import json
import re

with open(r'C:\Users\sures\Downloads\ExamFLowErros\ExamFlow_Full_Backup_2026-10-17 (2).json', 'r', encoding='utf-8') as f:
    data = json.load(f)

sess_key = '02.11.2026 | 02:00 PM'
date, time = sess_key.split(' | ')

allStudentData = data.get('examBaseData', [])
if isinstance(allStudentData, str):
    allStudentData = json.loads(allStudentData)

allotments = data.get('examRoomAllotment', {})
if isinstance(allotments, str):
    allotments = json.loads(allotments)

currentSessionAllotment = allotments.get(sess_key, [])

def getRegNo(s):
    if not s:
        return ""
    if isinstance(s, str):
        return s.strip()
    reg = s.get('Register Number') or s.get('RegisterNo') or s.get('regNo') or s.get('Reg No') or s.get('RegNo') or s.get('RegisterNo_') or s.get('reg_no') or ""
    return str(reg).strip()

def getStudentsForSession(allData, targetDate, targetTime):
    if not allData or not targetDate or not targetTime:
        return []
    dateRaw = re.sub(r'[./-]', '', targetDate.strip())
    timeRaw = targetTime.strip().upper()

    res = []
    for s in allData:
        sDate = re.sub(r'[./-]', '', str(s.get('Date', '')).strip())
        dateMatch = (sDate == dateRaw)
        sTime = str(s.get('Time', '')).strip().upper()
        timeMatch = (sTime == timeRaw)
        if dateMatch and timeMatch:
            res.append(s)
    return res

print(f"Total students in base: {len(allStudentData)}")
print(f"Rooms allotted: {len(currentSessionAllotment)}")

allottedRegNos = set()
for room in currentSessionAllotment:
    for s in room.get('students', []):
        r = getRegNo(s)
        if r:
            allottedRegNos.add(r)

print(f"Allotted unique RegNos: {len(allottedRegNos)}")

# 1. OLD CODE SIMULATION:
# In old code:
# const sessionStudentRecords = allStudentData.filter(s => s.Date === date && s.Time === time);
sessionRecords_old = [s for s in allStudentData if s.get('Date') == date and s.get('Time') == time]
print(f"OLD code sessionStudentRecords count: {len(sessionRecords_old)}")

candidates_old = []
targetStream = "Regular"
for s in sessionRecords_old:
    regNo = getRegNo(s)
    studentStream = s.get('Stream') or "Regular"
    if regNo not in allottedRegNos and studentStream == targetStream:
        candidates_old.append(s)

print(f"OLD code candidates count: {len(candidates_old)}")

# 2. NEW CODE SIMULATION:
sessionRecords_new = getStudentsForSession(allStudentData, date, time)
print(f"NEW code sessionStudentRecords count: {len(sessionRecords_new)}")

candidates_new = []
targetStreamNorm = (targetStream or "Regular").strip().lower()
for s in sessionRecords_new:
    regNo = getRegNo(s)
    studentStream = (s.get('Stream') or "Regular").strip().lower()
    if regNo not in allottedRegNos and studentStream == targetStreamNorm:
        candidates_new.append(s)

print(f"NEW code candidates count: {len(candidates_new)}")
