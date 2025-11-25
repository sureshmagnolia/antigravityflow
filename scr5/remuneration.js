/* remuneration.js - Exam Billing Module with Editable Rates */

const Remuneration = {
    // Default Rates as per U.O.No. 475/2021/PB
    defaults: {
        chiefSupt: 113,
        addlChiefSupt: 113,
        seniorSupt: 105,
        officeSupt: 90,
        invigilatorRate: 90,
        invigilatorRatio: 25,
        clerkRate: 113,
        clerkRatio: 100,
        clerkSlab1: 38, // <= 30 students
        clerkSlab2: 75, // <= 60 students
        sweeperRate: 25,
        sweeperRatio: 100,
        sweeperMin: 35,
        contingent: 4,
        lumpSumDataEntry: 890,
        lumpSumAccountant: 1000
    },

    // Current active rates
    rates: {},

    init: function() {
        this.loadRates();
        this.render();
    },

    loadRates: function() {
        const saved = localStorage.getItem('examBillingRates');
        if (saved) {
            this.rates = JSON.parse(saved);
        } else {
            this.rates = { ...this.defaults };
        }
    },

    saveRates: function(newRates) {
        this.rates = newRates;
        localStorage.setItem('examBillingRates', JSON.stringify(this.rates));
        this.render(); // Re-render everything with new rates
        alert("Rates updated successfully!");
    },

    resetToDefaults: function() {
        if(confirm("Are you sure you want to reset all rates to the 2021 University Order defaults?")) {
            this.rates = { ...this.defaults };
            localStorage.setItem('examBillingRates', JSON.stringify(this.rates));
            this.render();
        }
    },

    // --- Calculation Logic ---

    getData: function() {
        const rawData = localStorage.getItem('examBaseData');
        return rawData ? JSON.parse(rawData) : [];
    },

    getSessionCounts: function(students) {
        const sessions = {};
        students.forEach(student => {
            // Flexible key check for date/session
            let date = student.date || student.Date || student.examDate; 
            let sess = student.session || student.Session;
            if(!date || !sess) return;

            const key = `${date} - ${sess}`;
            if (!sessions[key]) sessions[key] = { date, session: sess, count: 0 };
            sessions[key].count++;
        });
        return sessions;
    },

    calculateSessionCost: function(count) {
        const r = this.rates;
        let costs = {
            fixed: parseFloat(r.chiefSupt) + parseFloat(r.seniorSupt) + parseFloat(r.officeSupt),
            invigilators: 0,
            clerk: 0,
            sweeper: 0,
            contingent: count * r.contingent,
            total: 0
        };

        // Invigilators
        let numInvigilators = Math.floor(count / r.invigilatorRatio);
        if ((count % r.invigilatorRatio) > 5) numInvigilators++;
        if (count > 0 && numInvigilators === 0) numInvigilators = 1;
        costs.invigilators = numInvigilators * r.invigilatorRate;

        // Clerk
        let numClerksFull = Math.floor(count / r.clerkRatio);
        let clerkCost = numClerksFull * r.clerkRate;
        let clerkRem = count % r.clerkRatio;
        if (clerkRem > 0) {
            if (clerkRem <= 30) clerkCost += parseFloat(r.clerkSlab1);
            else if (clerkRem <= 60) clerkCost += parseFloat(r.clerkSlab2);
            else clerkCost += parseFloat(r.clerkRate);
        }
        costs.clerk = clerkCost;

        // Sweeper
        let sweeperUnits = Math.ceil(count / r.sweeperRatio);
        let sweeperCost = sweeperUnits * r.sweeperRate;
        if (sweeperCost < r.sweeperMin) sweeperCost = parseFloat(r.sweeperMin);
        costs.sweeper = sweeperCost;

        costs.total = costs.fixed + costs.invigilators + costs.clerk + costs.sweeper + costs.contingent;
        return costs;
    },

    // --- UI Rendering ---

    toggleEditMode: function(enable) {
        const inputs = document.querySelectorAll('.rate-input');
        inputs.forEach(input => input.disabled = !enable);
        
        document.getElementById('btn-edit-rates').classList.toggle('hidden', enable);
        document.getElementById('btn-save-rates').classList.toggle('hidden', !enable);
        document.getElementById('btn-cancel-rates').classList.toggle('hidden', !enable);
    },

    handleSaveClick: function() {
        const newRates = {};
        const inputs = document.querySelectorAll('.rate-input');
        inputs.forEach(input => {
            newRates[input.name] = parseFloat(input.value);
        });
        this.saveRates(newRates);
    },

    render: function() {
        this.renderConfigPanel();
        this.renderTable();
    },

    renderConfigPanel: function() {
        const container = document.getElementById('billing-config-container');
        if (!container) return;

        const r = this.rates;
        
        container.innerHTML = `
            <div class="bg-gray-50 border border-gray-300 rounded p-4 mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-gray-700 flex items-center">
                        <span class="mr-2">⚙️ Rate Configuration</span>
                        <span class="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded">Locked</span>
                    </h3>
                    <div class="space-x-2">
                        <button id="btn-edit-rates" onclick="Remuneration.toggleEditMode(true)" class="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">Edit Rates</button>
                        <button id="btn-save-rates" onclick="Remuneration.handleSaveClick()" class="hidden text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Save Changes</button>
                        <button id="btn-cancel-rates" onclick="Remuneration.render()" class="hidden text-sm bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400">Cancel</button>
                        <button onclick="Remuneration.resetToDefaults()" class="text-xs text-red-400 hover:text-red-600 underline ml-2">Reset Defaults</button>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><label class="block text-gray-500 text-xs">Chief Supt (₹)</label>
                        <input type="number" name="chiefSupt" value="${r.chiefSupt}" class="rate-input w-full border rounded px-2 py-1" disabled></div>
                    <div><label class="block text-gray-500 text-xs">Snr Supt (₹)</label>
                        <input type="number" name="seniorSupt" value="${r.seniorSupt}" class="rate-input w-full border rounded px-2 py-1" disabled></div>
                    <div><label class="block text-gray-500 text-xs">Office Supt (₹)</label>
                        <input type="number" name="officeSupt" value="${r.officeSupt}" class="rate-input w-full border rounded px-2 py-1" disabled></div>
                    
                    <div class="border-l pl-2"><label class="block text-gray-500 text-xs">Invigilator Rate (₹)</label>
                        <input type="number" name="invigilatorRate" value="${r.invigilatorRate}" class="rate-input w-full border rounded px-2 py-1" disabled></div>
                    <div><label class="block text-gray-500 text-xs">Invig. Ratio (1:X)</label>
                        <input type="number" name="invigilatorRatio" value="${r.invigilatorRatio}" class="rate-input w-full border rounded px-2 py-1" disabled></div>

                    <div class="border-l pl-2"><label class="block text-gray-500 text-xs">Clerk Base (₹)</label>
                        <input type="number" name="clerkRate" value="${r.clerkRate}" class="rate-input w-full border rounded px-2 py-1" disabled></div>
                    <div><label class="block text-gray-500 text-xs">Clerk Slab 1 (≤30)</label>
                        <input type="number" name="clerkSlab1" value="${r.clerkSlab1}" class="rate-input w-full border rounded px-2 py-1" disabled></div>
                    <div><label class="block text-gray-500 text-xs">Clerk Slab 2 (≤60)</label>
                        <input type="number" name="clerkSlab2" value="${r.clerkSlab2}" class="rate-input w-full border rounded px-2 py-1" disabled></div>

                    <div class="border-l pl-2"><label class="block text-gray-500 text-xs">Contingent/Student (₹)</label>
                        <input type="number" name="contingent" value="${r.contingent}" class="rate-input w-full border rounded px-2 py-1" disabled></div>
                    <div><label class="block text-gray-500 text-xs">Data Entry (Sem/₹)</label>
                        <input type="number" name="lumpSumDataEntry" value="${r.lumpSumDataEntry}" class="rate-input w-full border rounded px-2 py-1" disabled></div>
                    <div><label class="block text-gray-500 text-xs">Accountant (Sem/₹)</label>
                        <input type="number" name="lumpSumAccountant" value="${r.lumpSumAccountant}" class="rate-input w-full border rounded px-2 py-1" disabled></div>
                </div>
            </div>
        `;
    },

    renderTable: function() {
        const container = document.getElementById('billing-table-container');
        if(!container) return;

        const students = this.getData();
        if (!students || students.length === 0) {
            container.innerHTML = '<div class="text-center p-8 text-gray-400">No student data found. Please upload exam data first.</div>';
            return;
        }

        const sessionData = this.getSessionCounts(students);
        let grandTotal = 0;
        let html = `
        <table class="w-full text-sm text-left text-gray-500 border">
            <thead class="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                    <th class="px-4 py-3 border">Date / Session</th>
                    <th class="px-4 py-3 border text-center">Count</th>
                    <th class="px-4 py-3 border text-right">Fixed Staff</th>
                    <th class="px-4 py-3 border text-right">Invigilators</th>
                    <th class="px-4 py-3 border text-right">Clerk</th>
                    <th class="px-4 py-3 border text-right">Sweeper</th>
                    <th class="px-4 py-3 border text-right">Contingent</th>
                    <th class="px-4 py-3 border text-right bg-gray-50">Total</th>
                </tr>
            </thead>
            <tbody>
        `;

        Object.keys(sessionData).sort().forEach(key => {
            const data = sessionData[key];
            const cost = this.calculateSessionCost(data.count);
            grandTotal += cost.total;

            html += `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-4 py-2 font-medium text-gray-900">${key}</td>
                    <td class="px-4 py-2 text-center font-bold bg-blue-50 text-blue-600">${data.count}</td>
                    <td class="px-4 py-2 text-right">₹${cost.fixed}</td>
                    <td class="px-4 py-2 text-right">₹${cost.invigilators}</td>
                    <td class="px-4 py-2 text-right">₹${cost.clerk}</td>
                    <td class="px-4 py-2 text-right">₹${cost.sweeper}</td>
                    <td class="px-4 py-2 text-right">₹${cost.contingent}</td>
                    <td class="px-4 py-2 text-right font-bold text-gray-800 bg-gray-50">₹${cost.total}</td>
                </tr>
            `;
        });

        const semCharges = parseFloat(this.rates.lumpSumDataEntry) + parseFloat(this.rates.lumpSumAccountant);
        grandTotal += semCharges;

        html += `
            <tr class="bg-yellow-50 font-semibold border-t-2 border-gray-300">
                <td colspan="7" class="px-4 py-2 text-right">Semester Lump Sum (Data Entry + Accountant)</td>
                <td class="px-4 py-2 text-right">₹${semCharges}</td>
            </tr>
            <tr class="bg-gray-800 text-white font-bold text-lg">
                <td colspan="7" class="px-4 py-3 text-right">GRAND TOTAL</td>
                <td class="px-4 py-3 text-right">₹${grandTotal}</td>
            </tr>
            </tbody>
        </table>
        `;
        container.innerHTML = html;
    }
};
