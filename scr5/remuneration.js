// remuneration.js

// --- 1. DEFAULT RATE CARDS ---
const DEFAULT_RATES = {
    "Regular": {
        // Supervision
        chief_supdt: 113,       // Per Session
        senior_supdt: 105,      // Per Session
        office_supdt: 90,       // Per Session
        
        // Execution
        invigilator: 90,        // Rate per Duty
        invigilator_ratio: 30,  // 1 per 30 Students (Includes Scribes in count)
        invigilator_min_fraction: 0, // Any fraction > 0 adds 1 invigilator
        
        // Scribe Logic
        scribe_invigilator_ratio: 1, // 1 Additional Invigilator per Scribe

        // Clerk (Sliding Scale)
        clerk_full_slab: 113, 
        clerk_slab_1: 38, 
        clerk_slab_2: 75,
        
        // Sweeper
        sweeper_rate: 25, 
        sweeper_min: 35,
        
        // Fixed
        data_entry_operator: 890, 
        accountant: 1000, 
        contingent_charge: 0.40
    },
    "Other": {
        // Default values for other streams
        chief_supdt: 113, senior_supdt: 105, office_supdt: 90,
        invigilator: 90, invigilator_ratio: 30, invigilator_min_fraction: 0,
        scribe_invigilator_ratio: 1,
        clerk_full_slab: 113, clerk_slab_1: 38, clerk_slab_2: 75,
        sweeper_rate: 25, sweeper_min: 35,
        data_entry_operator: 890, accountant: 1000, contingent_charge: 0.40
    }
};

const REMUNERATION_CONFIG_KEY = 'examRemunerationConfig';
let allRates = {};
let isRatesLocked = true;

// --- 2. INITIALIZATION ---
function initRemunerationModule() {
    loadRates();
    renderRateConfigForm();
}

function loadRates() {
    const saved = localStorage.getItem(REMUNERATION_CONFIG_KEY);
    if (saved) {
        allRates = JSON.parse(saved);
        // Auto-update logic for existing users
        if(allRates["Regular"]) {
            if(allRates["Regular"].invigilator_ratio === 25) {
                allRates["Regular"].invigilator_ratio = 30;
                allRates["Regular"].invigilator_min_fraction = 0;
            }
            if(!allRates["Regular"].senior_supdt) allRates["Regular"].senior_supdt = 105;
        }
    } else {
        allRates = JSON.parse(JSON.stringify(DEFAULT_RATES));
        localStorage.setItem(REMUNERATION_CONFIG_KEY, JSON.stringify(allRates));
    }
}

// --- 3. UI: RATE SETTINGS FORM ---
function renderRateConfigForm() {
    const container = document.getElementById('rate-config-container');
    const selector = document.getElementById('rate-stream-selector');
    
    if (!container || !selector) return;
    
    const currentStream = selector.value || "Regular";
    const rates = allRates[currentStream];

    const disabledAttr = isRatesLocked ? 'disabled' : '';
    const bgClass = isRatesLocked ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-900 border-blue-400 ring-1 ring-blue-200';

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div class="space-y-3">
                <h4 class="font-semibold text-xs text-blue-600 uppercase border-b pb-1">Supervision (Per Session)</h4>
                ${createRateInput('Chief Supdt', 'chief_supdt', rates.chief_supdt, disabledAttr, bgClass)}
                ${createRateInput('Senior Supdt', 'senior_supdt', rates.senior_supdt, disabledAttr, bgClass)}
                ${createRateInput('Office Supdt', 'office_supdt', rates.office_supdt, disabledAttr, bgClass)}
            </div>
            <div class="space-y-3">
                <h4 class="font-semibold text-xs text-blue-600 uppercase border-b pb-1">Duty Staff</h4>
                ${createRateInput('Invigilator Rate', 'invigilator', rates.invigilator, disabledAttr, bgClass)}
                ${createRateInput('Invig Ratio (Reg)', 'invigilator_ratio', rates.invigilator_ratio, disabledAttr, bgClass)}
                ${createRateInput('Invig Ratio (Scribe)', 'scribe_invigilator_ratio', rates.scribe_invigilator_ratio, disabledAttr, bgClass)}
                
                <div class="pt-2 border-t border-gray-200"></div>
                ${createRateInput('Clerk (Full Slab)', 'clerk_full_slab', rates.clerk_full_slab, disabledAttr, bgClass)}
                <div class="grid grid-cols-2 gap-2">
                    ${createRateInput('Clerk (<30)', 'clerk_slab_1', rates.clerk_slab_1, disabledAttr, bgClass)}
                    ${createRateInput('Clerk (<60)', 'clerk_slab_2', rates.clerk_slab_2, disabledAttr, bgClass)}
                </div>
                ${createRateInput('Sweeper (Per 100)', 'sweeper_rate', rates.sweeper_rate, disabledAttr, bgClass)}
            </div>
            <div class="space-y-3">
                <h4 class="font-semibold text-xs text-blue-600 uppercase border-b pb-1">Fixed / Allowances</h4>
                ${createRateInput('Data Entry (Sem)', 'data_entry_operator', rates.data_entry_operator, disabledAttr, bgClass)}
                ${createRateInput('Accountant (Sem)', 'accountant', rates.accountant, disabledAttr, bgClass)}
                ${createRateInput('Contingency (Student)', 'contingent_charge', rates.contingent_charge, disabledAttr, bgClass)}
            </div>
        </div>
    `;

    if (!isRatesLocked) {
        container.querySelectorAll('.rate-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const key = e.target.dataset.key;
                allRates[currentStream][key] = parseFloat(e.target.value);
            });
        });
    }
    
    const lockBtn = document.getElementById('toggle-rate-lock');
    if(lockBtn) {
        lockBtn.innerHTML = isRatesLocked 
            ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Edit Rates` 
            : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Save Changes`;
        
        lockBtn.className = isRatesLocked 
            ? "text-xs flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-200 transition"
            : "text-xs flex items-center gap-1 bg-green-50 text-green-700 border border-green-300 px-3 py-1 rounded hover:bg-green-100 transition animate-pulse";
    }
}

function createRateInput(label, key, value, disabled, bgClass) {
    return `
        <div class="flex justify-between items-center">
            <label class="text-xs text-gray-600">${label}</label>
            <input type="number" data-key="${key}" value="${value}" ${disabled} 
                   class="rate-input w-16 text-right p-1 border rounded text-xs ${bgClass}">
        </div>
    `;
}

window.toggleRemunerationLock = function() {
    if (!isRatesLocked) {
        localStorage.setItem(REMUNERATION_CONFIG_KEY, JSON.stringify(allRates));
        if(typeof syncDataToCloud === 'function') syncDataToCloud();
    }
    isRatesLocked = !isRatesLocked;
    renderRateConfigForm();
};

// --- 4. CORE ENGINE: CALCULATE BILL (Updated Logic) ---
function generateBillForSessions(billTitle, sessionData, streamType) {
    if (Object.keys(allRates).length === 0) loadRates();

    const rates = allRates[streamType] || allRates["Regular"];
    if (!rates) {
        alert(`Error: Rates for stream '${streamType}' not found.`);
        return null;
    }
    
    const scribeRatio = rates.scribe_invigilator_ratio || 1;

    let bill = {
        title: billTitle,
        stream: streamType,
        supervision: 0,
        invigilation: 0,
        clerical: 0,
        sweeping: 0,
        supervision_breakdown: {
            chief: { count: 0, rate: rates.chief_supdt, total: 0 },
            senior: { count: 0, rate: rates.senior_supdt, total: 0 },
            office: { count: 0, rate: rates.office_supdt, total: 0 }
        },
        details: []
    };

    sessionData.forEach(session => {
        const normalStudents = session.normalCount || 0;
        const scribeStudents = session.scribeCount || 0;
        const totalStudents = normalStudents + scribeStudents;
        
        // 1. Invigilators
        
        // A. General Invigilators (Calculated on TOTAL Students)
        // Scribes are physically assigned to the hall initially, so they count here.
        let normalInvigs = 0;
        if (totalStudents > 0) {
            normalInvigs = Math.floor(totalStudents / rates.invigilator_ratio);
            if ((totalStudents % rates.invigilator_ratio) > rates.invigilator_min_fraction) normalInvigs++;
            if (normalInvigs === 0) normalInvigs = 1; 
        }

        // B. Scribe Invigilators (Additional Special Duty)
        let scribeInvigs = 0;
        if (scribeStudents > 0) {
            scribeInvigs = Math.ceil(scribeStudents / scribeRatio);
        }

        const totalInvigs = normalInvigs + scribeInvigs;
        const invigCost = totalInvigs * rates.invigilator;

        // 2. Clerk (Based on TOTAL students)
        let clerkCost = 0;
        const clerkFullBatches = Math.floor(totalStudents / 100);
        const clerkRemainder = totalStudents % 100;
        clerkCost += clerkFullBatches * rates.clerk_full_slab;
        if (clerkRemainder > 0) {
            if (clerkRemainder <= 30) clerkCost += rates.clerk_slab_1;
            else if (clerkRemainder <= 60) clerkCost += rates.clerk_slab_2;
            else clerkCost += rates.clerk_full_slab;
        }

        // 3. Sweeper (Based on TOTAL students)
        let sweeperCost = Math.ceil(totalStudents / 100) * rates.sweeper_rate;
        if (sweeperCost < rates.sweeper_min) sweeperCost = rates.sweeper_min;

        // 4. Supervision
        const chiefCost = rates.chief_supdt;
        const seniorCost = rates.senior_supdt;
        const officeCost = rates.office_supdt;
        const supervisionCost = chiefCost + seniorCost + officeCost;

        bill.supervision_breakdown.chief.count++;
        bill.supervision_breakdown.chief.total += chiefCost;
        
        bill.supervision_breakdown.senior.count++;
        bill.supervision_breakdown.senior.total += seniorCost;
        
        bill.supervision_breakdown.office.count++;
        bill.supervision_breakdown.office.total += officeCost;

        bill.supervision += supervisionCost;
        bill.invigilation += invigCost;
        bill.clerical += clerkCost;
        bill.sweeping += sweeperCost;

        bill.details.push({
            date: session.date,
            time: session.time,
            normal_students: normalStudents,
            scribe_students: scribeStudents,
            total_students: totalStudents,
            invig_count_normal: normalInvigs,
            invig_count_scribe: scribeInvigs,
            invig_cost: invigCost,
            clerk_cost: clerkCost,
            sweeper_cost: sweeperCost,
            supervision_cost: supervisionCost
        });
    });

    const totalRegistered = sessionData.reduce((sum, s) => sum + (s.normalCount + s.scribeCount), 0);
    bill.contingency = totalRegistered * rates.contingent_charge;
    bill.data_entry = rates.data_entry_operator;
    
    bill.grand_total = bill.supervision + bill.invigilation + bill.clerical + bill.sweeping + bill.contingency + bill.data_entry;
    
    return bill;
}

window.initRemunerationModule = initRemunerationModule;
window.renderRateConfigForm = renderRateConfigForm;
window.generateBillForSessions = generateBillForSessions;

// Auto-Init
loadRates();
