import sys

with open('invigilation.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = -1
end = -1
for i, line in enumerate(lines):
    if 'window.clearOldData = async function () {' in line:
        start = i
    if start != -1 and i > start and line.startswith('}'):
        end = i
        break

if start != -1 and end != -1:
    new_logic = """// --- MAINTENANCE: MANAGE HISTORICAL DATA ---

window.openManageHistoricalDataModal = function() {
    const currentAY = getCurrentAcademicYear();
    const historicalAYs = {}; // label -> { acYear, recordCount }

    // Aggregate records by Academic Year
    Object.keys(invigilationSlots).forEach(key => {
        const dateObj = parseDate(key);
        const acYear = getAcademicYearForDate(dateObj);
        
        // Skip current Academic Year (Protection)
        if (acYear.label === currentAY.label) return;

        if (!historicalAYs[acYear.label]) {
            historicalAYs[acYear.label] = { acYear, recordCount: 0 };
        }
        historicalAYs[acYear.label].recordCount++;
    });

    const labels = Object.keys(historicalAYs).sort(); // Sort chronological

    if (labels.length === 0) {
        return alert("No past Academic Year data is available for deletion.\\n(The Current Academic Year is protected).");
    }

    const selectEl = document.getElementById('historical-ay-select');
    if (selectEl) {
        selectEl.innerHTML = '';
        labels.forEach(label => {
            const count = historicalAYs[label].recordCount;
            const option = document.createElement('option');
            option.value = label;
            option.textContent = `${label} (${count} records)`;
            selectEl.appendChild(option);
        });
    }

    window.openModal('historical-data-modal');
};

window.confirmDeleteHistoricalData = async function() {
    const selectEl = document.getElementById('historical-ay-select');
    if (!selectEl) return;
    
    const targetLabel = selectEl.value;
    if (!targetLabel) return;

    if (!confirm(`⚠️ CRITICAL WARNING: You are about to PERMANENTLY DELETE all data for Academic Year ${targetLabel}.\\n\\nHave you downloaded all necessary reports and certificates for this year?\\n\\nClick OK to permanently delete.`)) {
        return;
    }

    if (!confirm(`FINAL CONFIRMATION:\\nAre you absolutely sure you want to delete ${targetLabel}? This cannot be undone.`)) {
        return;
    }

    const newSlots = {};
    let removedCount = 0;

    Object.keys(invigilationSlots).forEach(key => {
        const dateObj = parseDate(key);
        const acYear = getAcademicYearForDate(dateObj);

        // Keep slots that DO NOT match the target academic year
        if (acYear.label !== targetLabel) {
            newSlots[key] = invigilationSlots[key];
        } else {
            removedCount++;
        }
    });

    if (removedCount > 0) {
        logActivity("Data Cleanup", `Admin surgically deleted ${removedCount} records for AY ${targetLabel}.`);
        invigilationSlots = newSlots;
        
        // Use authoritative sync
        await syncSlotsToCloud("FORCE_OVERWRITE"); 
        
        window.closeModal('historical-data-modal');
        renderSlotsGridAdmin();
        alert(`✅ Surgical Cleanup Complete.\\n\\nPermanently removed ${removedCount} records for Academic Year ${targetLabel}.`);
    } else {
        alert("No records found for that academic year.");
        window.closeModal('historical-data-modal');
    }
};
"""
    # Replace the block and append a normal newline
    lines[start-1:end+1] = [new_logic + '\n']
    
    with open('invigilation.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("SUCCESS")
else:
    print("COULD NOT FIND clearOldData")
