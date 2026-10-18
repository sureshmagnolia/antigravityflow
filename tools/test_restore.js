
function parseDate(dStr) { return new Date(); }

async function syncSlotsToCloud(mode, invigilationSlots) {
    let totalSlots = Object.keys(invigilationSlots).length;
    console.log('Diagnostic total slots:', totalSlots);
}

window = {};
window.restoreInvigilationCloudData = async function(rawBackup, mode, showPrompts = true) {
    let d = rawBackup;
    let normalized = {};

    // Determine where the data lives
    if (rawBackup.data) {
        d = rawBackup.data;
    }

    // Now normalize d, regardless of whether it came from root or .data
    normalized = {
        staffData: typeof d.examStaffData === 'string' ? JSON.parse(d.examStaffData) : (d.staffData || d.examStaffData || []),
        invigilationSlots: typeof d.examInvigilationSlots === 'string' ? JSON.parse(d.examInvigilationSlots) : (d.invigilationSlots || d.examInvigilationSlots || {}),
        advanceUnavailability: typeof d.invigAdvanceUnavailability === 'string' ? JSON.parse(d.invigAdvanceUnavailability) : (d.advanceUnavailability || d.invigAdvanceUnavailability || {}),
    };

    let invigilationSlots = normalized.invigilationSlots || {};
    
    await syncSlotsToCloud(mode === '1' ? 'SYSTEM_WIPE' : 'FORCE_OVERWRITE', invigilationSlots);
};

// 1. Drive format
const driveResponse = {
    data: {
        examInvigilationSlots: JSON.stringify({ '15.06.2025': {} })
    }
};

// 2. Manual format
const manualResponse = {
    examInvigilationSlots: { '16.06.2025': {} }
};

console.log('Testing Drive Restore:');
window.restoreInvigilationCloudData(driveResponse, '1', false);

setTimeout(() => {
    console.log('Testing Manual Restore:');
    window.restoreInvigilationCloudData(manualResponse, '1', false);
}, 100);

