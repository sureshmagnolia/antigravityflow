const fs = require('fs');

const backupPath = 'C:/Users/sures/OneDrive/Documents/Downloads/InvigBackupandLogs/Invigilation_MASTER_BACKUP_Government Victoria College_2026-05-25T07-05-24.json';
const logPath = 'C:/Users/sures/OneDrive/Documents/Downloads/InvigBackupandLogs/Full_Activity_Logs_ieMIUkBBiiuGUUd0PXSQ_2026-05-26.json';
const outputPath = 'C:/Users/sures/OneDrive/Documents/Downloads/InvigBackupandLogs/Restored_Invig_MASTER_Backup_June_Onwards.json';

const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
const logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));

// We only want to reconstruct data for June 2026 onwards.
const targetMonth = 6;
const targetYear = 2026;

function isTargetDate(dStr) {
    if (!dStr) return false;
    const parts = dStr.split('.');
    if (parts.length < 3) return false;
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    return y > targetYear || (y === targetYear && m >= targetMonth);
}

function extractDateAndTime(str) {
    const timeMatch = str.match(/(\d{2}\.\d{2}\.\d{4} \| \d{2}:\d{2} [AP]M)/);
    if (timeMatch) return timeMatch[1];
    return null;
}

function timeToSession(timeStr) {
    const upper = timeStr.toUpperCase();
    if (upper.includes("PM") || upper.includes("12:") || upper.includes("12.")) return "AN";
    return "FN";
}

// Ensure base objects exist in the Master Backup structure
if (!backupData.data) backupData.data = {};
if (!backupData.data.invigilationSlots) backupData.data.invigilationSlots = {};
if (!backupData.data.invigAdvanceUnavailability) backupData.data.invigAdvanceUnavailability = {};

// Process logs from oldest to newest
logs.reverse().forEach(log => {
    const a = log.a;
    const d = log.d || "";
    const email = log.u;

    if (!email) return;

    if (a === 'Volunteered' || a === 'Admin Override Add') {
        const dt = extractDateAndTime(d);
        if (dt && isTargetDate(dt.split(' | ')[0])) {
            if (!backupData.data.invigilationSlots[dt]) {
                backupData.data.invigilationSlots[dt] = { assigned: [], unavailable: [] };
            }
            if (!backupData.data.invigilationSlots[dt].assigned) backupData.data.invigilationSlots[dt].assigned = [];
            if (!backupData.data.invigilationSlots[dt].assigned.includes(email)) {
                backupData.data.invigilationSlots[dt].assigned.push(email);
            }
        }
    } 
    else if (a === 'Duty Cancelled' || a === 'Admin Force Remove' || a === 'Admin Removed (Exchange Cleared)') {
        const dt = extractDateAndTime(d);
        if (dt && isTargetDate(dt.split(' | ')[0])) {
            if (backupData.data.invigilationSlots[dt] && backupData.data.invigilationSlots[dt].assigned) {
                backupData.data.invigilationSlots[dt].assigned = backupData.data.invigilationSlots[dt].assigned.filter(e => e !== email);
            }
        }
    }
    else if (a === 'Advance Unavailability' || a === 'Session Unavailability' || d.includes('unavailable')) {
        let dates = [];
        const wholeMatch = d.match(/WHOLE DAY on (\d{2}\.\d{2}\.\d{4})/i);
        const fnanMatch = d.match(/(\d{2}\.\d{2}\.\d{4})\s*\((FN|AN)\)/i);
        const dtMatch = extractDateAndTime(d);

        if (wholeMatch && isTargetDate(wholeMatch[1])) {
            dates.push({ date: wholeMatch[1], session: 'FN' });
            dates.push({ date: wholeMatch[1], session: 'AN' });
        } else if (fnanMatch && isTargetDate(fnanMatch[1])) {
            dates.push({ date: fnanMatch[1], session: fnanMatch[2] });
        } else if (dtMatch) {
            const split = dtMatch.split(' | ');
            if (isTargetDate(split[0])) {
                dates.push({ date: split[0], session: timeToSession(split[1]) });
            }
        }

        dates.forEach(({date, session}) => {
            if (!backupData.data.invigAdvanceUnavailability[date]) backupData.data.invigAdvanceUnavailability[date] = { FN: [], AN: [] };
            if (!backupData.data.invigAdvanceUnavailability[date][session]) backupData.data.invigAdvanceUnavailability[date][session] = [];
            if (!backupData.data.invigAdvanceUnavailability[date][session].includes(email)) {
                backupData.data.invigAdvanceUnavailability[date][session].push(email);
            }
        });
    }
    else if (a === 'Advance Unavailability Removed') {
        let dates = [];
        const wholeMatch = d.match(/Whole Day (\d{2}\.\d{2}\.\d{4})/i);
        const fnanMatch = d.match(/(\d{2}\.\d{2}\.\d{4})\s*\((FN|AN)\)/i);

        if (wholeMatch && isTargetDate(wholeMatch[1])) {
            dates.push({ date: wholeMatch[1], session: 'FN' });
            dates.push({ date: wholeMatch[1], session: 'AN' });
        } else if (fnanMatch && isTargetDate(fnanMatch[1])) {
            dates.push({ date: fnanMatch[1], session: fnanMatch[2] });
        }

        dates.forEach(({date, session}) => {
            if (backupData.data.invigAdvanceUnavailability[date] && backupData.data.invigAdvanceUnavailability[date][session]) {
                backupData.data.invigAdvanceUnavailability[date][session] = backupData.data.invigAdvanceUnavailability[date][session].filter(e => e !== email);
            }
        });
    }
});

fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2), 'utf8');
console.log('✅ Master Recovery Backup generated successfully at: ' + outputPath);