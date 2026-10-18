import json
import re

with open(r'C:\Users\sures\Downloads\ExamFLowErros\ExamFlow_Full_Backup_2026-10-17 (2).json', 'r', encoding='utf-8') as f:
    data = json.load(f)

sess_key = '02.11.2026 | 02:00 PM'
date, time = sess_key.split(' | ')

allStudentData = json.loads(data['examBaseData']) if isinstance(data['examBaseData'], str) else data['examBaseData']
room_cfg = json.loads(data['examRoomConfig']) if isinstance(data['examRoomConfig'], str) else data['examRoomConfig']

def getRegNo(s):
    if not s: return ""
    if isinstance(s, str): return s.strip()
    return str(s.get('Register Number') or s.get('RegisterNo') or s.get('regNo') or '').strip()

sessionStudents = [s for s in allStudentData if s.get('Date') == date and s.get('Time') == time]
print(f"Session students: {len(sessionStudents)}")

for strategy in ['ratio_1_1', 'ratio_2_1']:
    print(f"\n================ TESTING STRATEGY: {strategy} ================")
    # Sort like precomputeSessionParts:
    streamStudents = sorted(
        [s for s in sessionStudents if (s.get('Stream') or 'Regular') == 'Regular'],
        key=lambda s: (s.get('Course') or '', getRegNo(s))
    )
    total = len(streamStudents)
    splitAt = round(total * (2/3)) if strategy == 'ratio_2_1' else round(total * 0.5)
    
    streamPart = {
        'partA': streamStudents[:splitAt],
        'partB': streamStudents[splitAt:],
        'pA': 0,
        'pB': 0
    }
    print(f"partA length: {len(streamPart['partA'])}, partB length: {len(streamPart['partB'])}")

    allottedRegNos = set()
    currentAllotment = []

    # Allot Rooms 1 to 10:
    # Capacities: Room 1..4 (32), Room 5..6 (30), Room 7..10 (32)
    rooms_to_test = [
        ('Room 1', 32), ('Room 2', 32), ('Room 3', 32), ('Room 4', 32),
        ('Room 5', 30), ('Room 6', 30), ('Room 7', 32), ('Room 8', 32),
        ('Room 9', 32), ('Room 10', 32)
    ]

    for r_name, cap in rooms_to_test:
        # Candidates:
        candidates = [s for s in streamStudents if getRegNo(s) not in allottedRegNos]
        limit = cap
        leftoverThreshold = max(limit, 33)

        newStudents = []
        if len(candidates) <= leftoverThreshold:
            newStudents = candidates[:]
            rule = f"Guard 1 (Leftover: {len(candidates)} <= {leftoverThreshold})"
        elif len(streamPart['partB']) == 0:
            newStudents = candidates[:limit]
            rule = "Guard 2"
        elif strategy in ['ratio_1_1', 'ratio_2_1']:
            ratio = (2/3) if strategy == 'ratio_2_1' else 0.5
            takeA = round(limit * ratio)
            takeB = limit - takeA

            sliceA = streamPart['partA'][streamPart['pA'] : streamPart['pA'] + takeA]
            sliceB = streamPart['partB'][streamPart['pB'] : streamPart['pB'] + takeB]

            if len(sliceA) < takeA or len(sliceB) < takeB:
                newStudents = candidates[:len(candidates)]
                rule = f"Guard 3 (Exhausted! sliceA={len(sliceA)}/{takeA}, sliceB={len(sliceB)}/{takeB}, candidates={len(candidates)})"
            else:
                newStudents = sliceA + sliceB
                streamPart['pA'] += len(sliceA)
                streamPart['pB'] += len(sliceB)
                rule = f"Mix (takeA={takeA}, takeB={takeB}, pA={streamPart['pA']}, pB={streamPart['pB']})"
        else:
            newStudents = candidates[:limit]
            rule = "No mix"

        for s in newStudents:
            allottedRegNos.add(getRegNo(s))

        print(f"{r_name} (cap {cap}): allotted {len(newStudents)} students using [{rule}]. Remaining candidates: {len(streamStudents) - len(allottedRegNos)}")
        if len(newStudents) == 0:
            print(f"*** ALERT TRIGGERED: No unallotted students found! ***")
            break
