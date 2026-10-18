const fs = require('fs');

const raw = fs.readFileSync('C:\\Users\\sures\\Downloads\\ExamFLowErros\\ExamFlow_Full_Backup_2026-10-17 (2).json', 'utf8');
const backup = JSON.parse(raw);

const allStudentData = typeof backup.examBaseData === 'string' ? JSON.parse(backup.examBaseData) : backup.examBaseData;
const allRoomAllotments = typeof backup.examRoomAllotment === 'string' ? JSON.parse(backup.examRoomAllotment) : backup.examRoomAllotment;
const currentStreamConfig = backup.examStreamsConfig || ["Regular", "EDE"];

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

console.log("Testing every session in backup...");

const allSessions = Object.keys(allRoomAllotments);
let failCount = 0;

allSessions.forEach(sessionKey => {
    const currentSessionAllotment = allRoomAllotments[sessionKey] || [];
    const [date, time] = sessionKey.split(' | ');

    const sessionStudentRecords = window.getStudentsForSession(allStudentData, date, time);

    const allottedRegNos = new Set();
    currentSessionAllotment.forEach(room => {
        room.students.forEach(s => {
            const reg = (typeof s === 'object') ? getRegNo(s) : s;
            allottedRegNos.add(reg);
        });
    });

    for (const targetStream of currentStreamConfig) {
        const candidates = [];
        const targetStreamNormalized = (targetStream || "Regular").toString().trim().toLowerCase();
        for (const student of sessionStudentRecords) {
            const regNo = getRegNo(student);
            const studentStream = (student.Stream || "Regular").toString().trim().toLowerCase();
            if (!allottedRegNos.has(regNo) && studentStream === targetStreamNormalized) {
                candidates.push(student);
            }
        }

        let limit = 32;
        let newStudents = [];
        const leftoverThreshold = limit + 3;
        const candidateCourses = [...new Set(candidates.map(s => s.Course || 'Unknown'))];

        if (candidates.length <= leftoverThreshold) {
            newStudents = candidates.slice();
        } else {
            newStudents = candidates.slice(0, limit);
        }

        if (newStudents.length === 0) {
            // Check if there are actually remaining students needed for this stream
            const streamStudents = sessionStudentRecords.filter(s => (s.Stream || "Regular").trim().toLowerCase() === targetStreamNormalized);
            const streamAllotted = currentSessionAllotment.filter(r => (r.stream || "Regular").trim().toLowerCase() === targetStreamNormalized).reduce((sum, r) => sum + r.students.length, 0);
            const remaining = streamStudents.length - streamAllotted;

            if (remaining > 0) {
                console.log(`[ALERT WOULD TRIGGER] Session: ${sessionKey} | Stream: ${targetStream} | Needed: ${streamStudents.length} | Allotted: ${streamAllotted} | Remaining: ${remaining} | Candidates: ${candidates.length}`);
                failCount++;
            }
        }
    }
});

console.log(`Done testing. Incomplete sessions failing: ${failCount}`);
