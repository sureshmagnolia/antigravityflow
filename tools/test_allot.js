const fs = require('fs');

const raw = fs.readFileSync('C:\\Users\\sures\\Downloads\\ExamFLowErros\\ExamFlow_Full_Backup_2026-10-17 (2).json', 'utf8');
const backup = JSON.parse(raw);

const allStudentData = typeof backup.examBaseData === 'string' ? JSON.parse(backup.examBaseData) : backup.examBaseData;
const allRoomAllotments = typeof backup.examRoomAllotment === 'string' ? JSON.parse(backup.examRoomAllotment) : backup.examRoomAllotment;

const currentSessionKey = '02.11.2026 | 02:00 PM';
const currentSessionAllotment = allRoomAllotments[currentSessionKey] || [];

function getRegNo(s) {
    if (!s) return "";
    if (typeof s === 'string') return s.trim();
    const reg = s['Register Number'] || s.RegisterNo || s.regNo || s['Reg No'] || s['RegNo'] || s.RegisterNo_ || s.reg_no || "";
    return reg.toString().trim();
}

const window = {
    getStudentsForSession: function(allData, targetDate, targetTime) {
        if (!allData || !targetDate || !targetTime) return [];
        const dateRaw = targetDate.trim().replace(/[./-]/g, '');
        const timeRaw = targetTime.trim().toUpperCase();

        return allData.filter(s => {
            const studentDateNorm = (s.Date || "").replace(/[./-]/g, '');
            const dateMatch = studentDateNorm === dateRaw;
            let timeMatch = s.Time === timeRaw;
            if (!timeMatch) {
                const isAN = timeRaw.includes("AN") || timeRaw.includes("PM") || 
                             timeRaw.startsWith("12:") || timeRaw.startsWith("13:");
                const sTime = (s.Time || "").toUpperCase();
                const sIsAN = sTime.includes("PM") || sTime.includes("AN") || 
                              sTime.startsWith("12:") || sTime.startsWith("13:") || 
                              sTime.startsWith("14:") || sTime.startsWith("15:") || 
                              sTime.startsWith("16:");
                timeMatch = (isAN === sIsAN);
            }
            return dateMatch && timeMatch;
        });
    }
};

console.log("Current rooms in session:", currentSessionAllotment.length);
currentSessionAllotment.forEach((r, idx) => {
    console.log(`Room ${idx+1}: ${r.roomName}, capacity: ${r.capacity}, students: ${r.students.length}, stream: ${r.stream}`);
});

// Now simulate selectRoomForAllotment in pre-cf74cbc code (7a3eeb3)
function test_old_selectRoom(roomName, capacity, targetStream) {
    const [date, time] = currentSessionKey.split(' | ');

    // OLD CODE:
    const sessionStudentRecords = allStudentData.filter(s => s.Date === date && s.Time === time);
    console.log("\n[OLD CODE] sessionStudentRecords length:", sessionStudentRecords.length);

    const allottedRegNos = new Set();
    currentSessionAllotment.forEach(room => {
        room.students.forEach(s => {
            const reg = (typeof s === 'object') ? getRegNo(s) : s;
            allottedRegNos.add(reg);
        });
    });
    console.log("[OLD CODE] allottedRegNos size:", allottedRegNos.size);

    const candidates = [];
    for (const student of sessionStudentRecords) {
        const regNo = getRegNo(student);
        const studentStream = student.Stream || "Regular";
        if (!allottedRegNos.has(regNo) && studentStream === targetStream) {
            candidates.push(student);
        }
    }
    console.log("[OLD CODE] candidates count:", candidates.length);

    let limit = parseInt(capacity) || 30;
    let newStudents = [];
    // If mixingParts was not populated or empty:
    // mixingActiveStrategy: 'none'
    const leftoverThreshold = Math.max(limit, 33);
    if (candidates.length <= leftoverThreshold) {
        newStudents = candidates.slice();
    } else {
        newStudents = candidates.slice(0, limit);
    }
    console.log("[OLD CODE] newStudents length (when strategy=none):", newStudents.length);
}

test_old_selectRoom("Room 10", 32, "Regular");
