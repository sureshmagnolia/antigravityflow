/**
 * university_proforma.js
 * Calicut University Proforma I & II Remuneration & Contingency Package
 * Specifically designed for Regular Stream examinations:
 * - Proforma I (Parts A to F)
 * - Annexure I (Acquittance Roll)
 * - Proforma II (Contingent Charges @ Rs.4/- per candidate)
 * - Consolidated Statement
 * - Annexure II (Receipt for Contingent Charges)
 * - Certificates (1 & 2 for Senior Supdt & Head Accountant posts)
 *
 * NOTE: Names are fully configurable and never hardcoded to any specific college.
 */

(function (window) {
    'use strict';

    const PROFORMA_OFFICIALS_KEY = 'examProformaOfficials';
    let currentActiveSubTab = 'all';

    // Helper: Number to Indian Words Converter
    function numberToIndianWords(num) {
        if (num === null || num === undefined || isNaN(num)) return 'Zero';
        num = Math.floor(Math.abs(Number(num)));
        if (num === 0) return 'Zero';

        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        function twoDigits(n) {
            if (n < 20) return ones[n];
            const t = Math.floor(n / 10);
            const o = n % 10;
            return tens[t] + (o ? ' ' + ones[o] : '');
        }

        function threeDigits(n) {
            const h = Math.floor(n / 100);
            const rem = n % 100;
            let str = '';
            if (h > 0) str += ones[h] + ' Hundred';
            if (rem > 0) {
                str += (str ? ' and ' : '') + twoDigits(rem);
            }
            return str;
        }

        let words = '';
        const crore = Math.floor(num / 10000000);
        let rem = num % 10000000;
        const lakh = Math.floor(rem / 100000);
        rem = rem % 100000;
        const thousand = Math.floor(rem / 1000);
        rem = rem % 1000;

        if (crore > 0) words += twoDigits(crore) + ' Crore ';
        if (lakh > 0) words += twoDigits(lakh) + ' Lakh ';
        if (thousand > 0) words += twoDigits(thousand) + ' Thousand ';
        if (rem > 0) {
            if (words && rem < 100) words += 'and ';
            words += threeDigits(rem);
        }
        return words.trim() || 'Zero';
    }

    // Helper: Split name into Title and Display Name
    function splitTitleAndName(fullName) {
        if (!fullName) return { title: '', name: '' };
        const clean = fullName.trim();
        const prefixes = ['Dr.', 'Dr', 'Prof.', 'Prof', 'Sri.', 'Sri', 'Smt.', 'Smt', 'Ms.', 'Ms', 'Mr.', 'Mr'];
        for (const p of prefixes) {
            if (clean.toLowerCase().startsWith(p.toLowerCase() + ' ') || clean.toLowerCase().startsWith(p.toLowerCase() + '.')) {
                const normTitle = p.endsWith('.') ? p : p + '.';
                const rest = clean.substring(p.length).replace(/^[.\s]+/, '').trim();
                return { title: normTitle, name: rest };
            }
        }
        return { title: '', name: clean };
    }

    // Helper: Parse DD.MM.YYYY or YYYY-MM-DD into Date object (Local Time)
    function parseDateStr(str) {
        if (!str) return new Date();
        const parts = str.trim().split(/[.\-\/]/);
        if (parts.length === 3) {
            let d = parts[0], m = parts[1], y = parts[2];
            if (d.length === 4) [y, m, d] = [d, m, y];
            return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        }
        return new Date(str);
    }

    // Helper: Format Date to DD/MM/YYYY
    function formatDateSlash(dateObj) {
        if (!(dateObj instanceof Date) || isNaN(dateObj)) return '';
        const d = String(dateObj.getDate()).padStart(2, '0');
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const y = dateObj.getFullYear();
        return `${d}/${m}/${y}`;
    }

    // Helper: Format Date to DD.MM.YYYY
    function formatDateDot(dateObj) {
        if (!(dateObj instanceof Date) || isNaN(dateObj)) return '';
        const d = String(dateObj.getDate()).padStart(2, '0');
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const y = dateObj.getFullYear();
        return `${d}.${m}.${y}`;
    }

    // Helper: Month Year string
    function formatMonthYear(dateObj) {
        if (!(dateObj instanceof Date) || isNaN(dateObj)) return '';
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    }

    const UniversityProforma = {
        // --- 1. Officials Management (NO HARDCODING) ---
        // --- 1b. Rate Card Config Integration ---
        getRates: function () {
            let savedConfig = {};
            try {
                if (typeof window !== 'undefined' && window.allRates && window.allRates['Regular']) {
                    savedConfig = window.allRates;
                } else {
                    const raw = localStorage.getItem('examRemunerationConfig');
                    if (raw) savedConfig = JSON.parse(raw);
                }
            } catch (e) {}

            const reg = savedConfig['Regular'] || {};

            return {
                chiefSupdt: (Number(reg.chief_supdt) > 0) ? Number(reg.chief_supdt) : 123,
                seniorSupdt: (Number(reg.senior_supdt) > 0) ? Number(reg.senior_supdt) : 105,
                officeSupdt: (Number(reg.office_supdt) > 0) ? Number(reg.office_supdt) : 90,
                invigilator: (Number(reg.invigilator) > 0) ? Number(reg.invigilator) : 90,
                clerkFull: (Number(reg.clerk_full_slab) > 0) ? Number(reg.clerk_full_slab) : 113,
                clerkSlab1: (Number(reg.clerk_slab_1) > 0) ? Number(reg.clerk_slab_1) : 38,
                clerkSlab2: (Number(reg.clerk_slab_2) > 0) ? Number(reg.clerk_slab_2) : 75,
                peonFull: (Number(reg.peon_full_slab || reg.clerk_full_slab) > 0) ? Number(reg.peon_full_slab || reg.clerk_full_slab) : 113,
                peonSlab1: (Number(reg.peon_slab_1 || reg.clerk_slab_1) > 0) ? Number(reg.peon_slab_1 || reg.clerk_slab_1) : 38,
                peonSlab2: (Number(reg.peon_slab_2 || reg.clerk_slab_2) > 0) ? Number(reg.peon_slab_2 || reg.clerk_slab_2) : 75,
                sweeperRate: (Number(reg.sweeper_rate) > 0) ? Number(reg.sweeper_rate) : 35,
                sweeperMin: (Number(reg.sweeper_min) > 0) ? Number(reg.sweeper_min) : 25,
                dataEntryOperator: (Number(reg.data_entry_operator) > 0) ? Number(reg.data_entry_operator) : 890,
                headAccountant: (Number(reg.accountant) > 0) ? Number(reg.accountant) : 1000,
                scribeRate: (Number(reg.scribe_rate || reg.amanuensis_rate) > 0) ? Number(reg.scribe_rate || reg.amanuensis_rate) : 150,
                contingencyPerCandidate: (Number(reg.contingent_charge_regular || reg.contingency_rate) > 0) ? Number(reg.contingent_charge_regular || reg.contingency_rate) : 4.00
            };
        },


        getOfficials: function () {
            const saved = localStorage.getItem(PROFORMA_OFFICIALS_KEY);
            let conf = saved ? JSON.parse(saved) : {};

            const collegeName = localStorage.getItem('examCollegeName') || '';
            const staffData = JSON.parse(localStorage.getItem('examStaffData') || '[]');

            const findStaffName = (roleKeywords) => {
                for (const kw of roleKeywords) {
                    const q = kw.toLowerCase();
                    const found = staffData.find(s => {
                        if (s.roleHistory && Array.isArray(s.roleHistory)) {
                            if (s.roleHistory.some(r => r.role && r.role.toLowerCase().includes(q))) return true;
                        }
                        if (s.role && s.role.toLowerCase().includes(q)) return true;
                        if (s.designation && s.designation.toLowerCase().includes(q)) return true;
                        if (s.Designation && s.Designation.toLowerCase().includes(q)) return true;
                        return false;
                    });
                    if (found) return found.name;
                }
                return '';
            };

            return {
                collegeName: conf.collegeName !== undefined ? conf.collegeName : collegeName,
                period: conf.period || '',
                chiefSupdt: conf.chiefSupdt !== undefined ? conf.chiefSupdt : findStaffName(['chief supdt', 'chief superintendent']),
                seniorSupdt: conf.seniorSupdt !== undefined ? conf.seniorSupdt : findStaffName(['senior assistant', 'senior supdt', 'sas']),
                officeSupdt: conf.officeSupdt !== undefined ? conf.officeSupdt : findStaffName(['office supdt', 'office superintendent', 'os']),
                headAccountant: conf.headAccountant !== undefined ? conf.headAccountant : findStaffName(['head accountant', 'accountant']),
                dataEntryOperator: conf.dataEntryOperator !== undefined ? conf.dataEntryOperator : findStaffName(['data entry', 'deo']),
                clerk: conf.clerk !== undefined ? conf.clerk : findStaffName(['clerk', 'office clerk', 'ld clerk', 'ud clerk']),
                peon: conf.peon !== undefined ? conf.peon : findStaffName(['peon', 'office attendant', 'oa']),
                sweeper: conf.sweeper !== undefined ? conf.sweeper : findStaffName(['sweeper', 'cleaning staff']),
                principal: conf.principal !== undefined ? conf.principal : (findStaffName(['principal']) || 'Principal'),
                advanceReceived: conf.advanceReceived !== undefined ? Number(conf.advanceReceived) : 0,
                advanceDetails: conf.advanceDetails !== undefined ? conf.advanceDetails : 'Vide Cheque No. .............. dated ...........',
                certSeniorSupdtNo: conf.certSeniorSupdtNo || '',
                certHeadAcctNo: conf.certHeadAcctNo || ''
            };
        },

        saveOfficials: function (newOfficials) {
            localStorage.setItem(PROFORMA_OFFICIALS_KEY, JSON.stringify(newOfficials));
        },

        // --- 2. Auto-Detect from Staff Directory ---
        autoDetectFromStaff: function (showToast) {
            const staffData = JSON.parse(localStorage.getItem('examStaffData') || '[]');
            const collegeName = localStorage.getItem('examCollegeName') || '';

            const findStaffName = (roleKeywords) => {
                for (const kw of roleKeywords) {
                    const q = kw.toLowerCase();
                    const found = staffData.find(s => {
                        if (s.roleHistory && Array.isArray(s.roleHistory)) {
                            if (s.roleHistory.some(r => r.role && r.role.toLowerCase().includes(q))) return true;
                        }
                        if (s.role && s.role.toLowerCase().includes(q)) return true;
                        if (s.designation && s.designation.toLowerCase().includes(q)) return true;
                        if (s.Designation && s.Designation.toLowerCase().includes(q)) return true;
                        return false;
                    });
                    if (found) return found.name;
                }
                return '';
            };

            const detected = {
                collegeName: collegeName,
                period: document.getElementById('tab-prof-period')?.value || '',
                chiefSupdt: findStaffName(['chief supdt', 'chief superintendent']),
                seniorSupdt: findStaffName(['senior assistant', 'senior supdt', 'sas']),
                officeSupdt: findStaffName(['office supdt', 'office superintendent', 'os']),
                headAccountant: findStaffName(['head accountant', 'accountant']),
                dataEntryOperator: findStaffName(['data entry', 'deo']),
                clerk: findStaffName(['clerk', 'office clerk', 'ld clerk', 'ud clerk']),
                peon: findStaffName(['peon', 'office attendant', 'oa']),
                sweeper: findStaffName(['sweeper', 'cleaning staff']),
                principal: findStaffName(['principal']) || 'Principal',
                advanceReceived: Number(document.getElementById('tab-prof-advance')?.value) || 0,
                advanceDetails: document.getElementById('tab-prof-advance-details')?.value || 'Vide Cheque No. .............. dated ...........'
            };

            this.saveOfficials(detected);
            this.populateTabInputs(detected);
            this.refreshDocumentRender();

            if (showToast && window.UiModal && typeof window.UiModal.toast === 'function') {
                window.UiModal.toast('Auto-detected staff designations applied successfully!');
            }
        },

        // --- 2b. Filtering (By Exam Name or Period) ---
        populateExamDropdown: function () {
            const examSelect = document.getElementById('prof-exam-select');
            if (!examSelect) return;

            let all = [];
            if (typeof window.getMyAllStudentData === 'function' && window.getMyAllStudentData().length > 0) {
                all = window.getMyAllStudentData();
            } else if (window.allStudentData && Array.isArray(window.allStudentData) && window.allStudentData.length > 0) {
                all = window.allStudentData;
            } else {
                try {
                    const raw = localStorage.getItem('examBaseData');
                    all = raw ? JSON.parse(raw) : [];
                } catch (e) {
                    all = [];
                }
            }

            const regularStudents = all.filter(s => (s.Stream || s.stream || 'Regular').trim().toLowerCase() === 'regular');

            const examMap = {};
            const allDates = [];

            regularStudents.forEach(s => {
                const exName = (s['Exam Name'] || s.examName || 'Regular Examination').trim();
                const regNo = (s['Register Number'] || s['Register No'] || s['Register No.'] || s.RegisterNo || s.regNo || s.reg_no || s.Name || '').trim();
                const rawDate = (s.Date || s.date || '').trim();

                if (!examMap[exName]) {
                    examMap[exName] = { candidates: new Set(), dates: new Set() };
                }
                if (regNo) examMap[exName].candidates.add(regNo.toLowerCase());
                if (rawDate) {
                    examMap[exName].dates.add(rawDate);
                    const d = parseDateStr(rawDate);
                    allDates.push(d);
                }
            });

            const currentVal = examSelect.value;
            examSelect.innerHTML = '<option value="">-- All Regular Examinations --</option>';

            const sortedExams = Object.keys(examMap).sort();
            sortedExams.forEach(name => {
                const info = examMap[name];
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = `${name} (${info.candidates.size} Candidates, ${info.dates.size} Days)`;
                if (name === currentVal) opt.selected = true;
                examSelect.appendChild(opt);
            });

            if (allDates.length > 0) {
                allDates.sort((a, b) => a - b);
                const toISODate = (d) => {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                };
                const minISO = toISODate(allDates[0]);
                const maxISO = toISODate(allDates[allDates.length - 1]);

                const startInput = document.getElementById('prof-start-date');
                const endInput = document.getElementById('prof-end-date');
                if (startInput && !startInput.value) startInput.value = minISO;
                if (endInput && !endInput.value) endInput.value = maxISO;
            }
        },

        onFilterModeChange: function () {
            const mode = document.getElementById('prof-filter-mode')?.value || 'all';
            const examContainer = document.getElementById('prof-exam-dropdown-container');
            const periodContainer = document.getElementById('prof-date-range');

            if (examContainer) {
                if (mode === 'exam') examContainer.classList.remove('hidden');
                else examContainer.classList.add('hidden');
            }
            if (periodContainer) {
                if (mode === 'period') periodContainer.classList.remove('hidden');
                else periodContainer.classList.add('hidden');
            }

            this.onFilterChange();
        },

        onFilterChange: function () {
            const mode = document.getElementById('prof-filter-mode')?.value || 'all';
            const summaryEl = document.getElementById('prof-filter-summary');
            const examSelect = document.getElementById('prof-exam-select');

            const data = this.aggregateData();

            if (summaryEl) {
                if (!data || data.partARows.length === 0) {
                    summaryEl.innerHTML = '<span class="text-rose-600 font-semibold">⚠️ No examination records found matching current filter</span>';
                } else if (mode === 'exam') {
                    const exName = examSelect?.value || 'All Regular Examinations';
                    summaryEl.innerHTML = `Showing Exam: <strong>${exName}</strong> (${data.partARows.length} examination dates, ${data.totalContingencyCandidates} registered candidates)`;
                } else if (mode === 'period') {
                    summaryEl.innerHTML = `Showing Period: <strong>${data.startDateDot} to ${data.endDateDot}</strong> (${data.partARows.length} examination dates, ${data.totalContingencyCandidates} registered candidates)`;
                } else {
                    summaryEl.innerHTML = `Showing all regular examination sessions (${data.partARows.length} examination dates, ${data.totalContingencyCandidates} registered candidates)`;
                }
            }

            if (data && data.period) {
                const periodInput = document.getElementById('tab-prof-period');
                if (periodInput && (!periodInput.value || periodInput.dataset.autoManaged === 'true')) {
                    periodInput.value = data.period;
                    periodInput.dataset.autoManaged = 'true';
                    const off = this.getOfficials();
                    off.period = data.period;
                    this.saveOfficials(off);
                }
            }

            this.refreshDocumentRender();
        },

        resetFilters: function () {
            const modeSelect = document.getElementById('prof-filter-mode');
            if (modeSelect) modeSelect.value = 'all';

            const examSelect = document.getElementById('prof-exam-select');
            if (examSelect) examSelect.value = '';

            const startInput = document.getElementById('prof-start-date');
            const endInput = document.getElementById('prof-end-date');
            if (startInput) startInput.value = '';
            if (endInput) endInput.value = '';

            this.populateExamDropdown();
            this.onFilterModeChange();
        },

        // --- 3. Data Aggregator for Regular Stream ---
        aggregateData: function (filteredStudents) {
            const officials = this.getOfficials();
            const rates = this.getRates();
            let students = filteredStudents;

            if (!students) {
                let all = [];
                if (typeof window.getMyAllStudentData === 'function' && window.getMyAllStudentData().length > 0) {
                    all = window.getMyAllStudentData();
                } else if (window.allStudentData && Array.isArray(window.allStudentData) && window.allStudentData.length > 0) {
                    all = window.allStudentData;
                } else {
                    try {
                        const raw = localStorage.getItem('examBaseData');
                        all = raw ? JSON.parse(raw) : [];
                    } catch (e) {
                        all = [];
                    }
                }

                students = all.filter(s => {
                    const stream = (s.Stream || s.stream || 'Regular').trim().toLowerCase();
                    return stream === 'regular';
                });

                const filterMode = document.getElementById('prof-filter-mode')?.value || 'all';
                if (filterMode === 'exam') {
                    const selectedExam = (document.getElementById('prof-exam-select')?.value || '').trim();
                    if (selectedExam) {
                        students = students.filter(s => (s['Exam Name'] || s.examName || '').trim().toLowerCase() === selectedExam.toLowerCase());
                    }
                } else if (filterMode === 'period') {
                    const startVal = document.getElementById('prof-start-date')?.value;
                    const endVal = document.getElementById('prof-end-date')?.value;
                    const startDate = startVal ? parseDateStr(startVal) : null;
                    if (startDate) startDate.setHours(0, 0, 0, 0);
                    const endDate = endVal ? parseDateStr(endVal) : null;
                    if (endDate) endDate.setHours(23, 59, 59, 999);

                    if (startDate || endDate) {
                        students = students.filter(s => {
                            const rawDate = (s.Date || s.date || '').trim();
                            if (!rawDate) return false;
                            const d = parseDateStr(rawDate);
                            d.setHours(12, 0, 0, 0);
                            if (startDate && d < startDate) return false;
                            if (endDate && d > endDate) return false;
                            return true;
                        });
                    }
                }
            }

            if (!students || students.length === 0) return null;

            const filteredRegSet = new Set(students.map(s => (s['Register Number'] || s['Register No'] || s['Register No.'] || s.RegisterNo || s.regNo || s.reg_no || s.Name || s.name || '').trim().toLowerCase()).filter(Boolean));

            // External lookups
            const scribeListRaw = JSON.parse(localStorage.getItem('examScribeList') || '[]');
            const scribeAllotmentRaw = JSON.parse(localStorage.getItem('examScribeAllotment') || '{}');
            const scribeRegSet = new Set(scribeListRaw.map(sc => (sc.regNo || sc.registerNo || sc.candidateRegNo || '').trim().toLowerCase()).filter(Boolean));
            Object.values(scribeAllotmentRaw).forEach(allotMap => {
                if (allotMap && typeof allotMap === 'object') {
                    Object.keys(allotMap).forEach(r => {
                        if (r && r.trim()) scribeRegSet.add(r.trim().toLowerCase());
                    });
                }
            });
            const invigMapping = JSON.parse(localStorage.getItem('examInvigilatorMapping') || '{}');
            const roomAllotments = JSON.parse(localStorage.getItem('examRoomAllotment') || '{}');
            const invigSlots = JSON.parse(localStorage.getItem('examInvigilationSlots') || '{}');
            const staffData = JSON.parse(localStorage.getItem('examStaffData') || '[]');

            // Group by normalized date
            const dateMap = {};
            const examRegistrations = {}; // examName -> Set of student registers
            const datesList = [];

            students.forEach(s => {
                const rawDate = (s.Date || s.date || '').trim();
                const rawTime = (s.Time || s.time || '').trim().toUpperCase();
                const regNo = (s['Register Number'] || s['Register No'] || s['Register No.'] || s.RegisterNo || s.regNo || s.reg_no || s.Name || s.name || '').trim();
                const examName = (s['Exam Name'] || s.examName || 'Calicut University Examination').trim();

                if (!rawDate) return;

                // Normalize date key to DD.MM.YYYY
                const dObj = parseDateStr(rawDate);
                const dateKey = formatDateDot(dObj);

                if (!dateMap[dateKey]) {
                    dateMap[dateKey] = {
                        dateObj: dObj,
                        dateStr: dateKey,
                        dateDisplay: formatDateDot(dObj),
                        fnStudents: 0,
                        anStudents: 0,
                        fnScribes: 0,
                        anScribes: 0,
                        totalStudents: 0,
                        sessions: new Set(),
                        exams: new Set()
                    };
                    datesList.push(dateMap[dateKey]);
                }

                // Track exam registration count
                if (!examRegistrations[examName]) examRegistrations[examName] = new Set();
                if (regNo) examRegistrations[examName].add(regNo);
                dateMap[dateKey].exams.add(examName);

                // Is morning (FN) or afternoon (AN)
                const isFN = rawTime.includes('AM') || (rawTime.split(/[:.]/)[0] && parseInt(rawTime.split(/[:.]/)[0]) < 12 && !rawTime.includes('PM'));
                dateMap[dateKey].sessions.add(`${dateKey} | ${rawTime}`);

                // Scribe check
                const isScribe = (s.Scribe === 'Yes' || s.isScribe || (regNo && scribeRegSet.has(regNo.toLowerCase())));

                if (isFN) {
                    if (isScribe) dateMap[dateKey].fnScribes++;
                    else dateMap[dateKey].fnStudents++;
                } else {
                    if (isScribe) dateMap[dateKey].anScribes++;
                    else dateMap[dateKey].anStudents++;
                }
            });

            // Sort dates chronologically
            datesList.sort((a, b) => a.dateObj - b.dateObj);

            // Determine default period string if not set
            const minDate = datesList[0] ? datesList[0].dateObj : new Date();
            const maxDate = datesList[datesList.length - 1] ? datesList[datesList.length - 1].dateObj : new Date();
            const defaultPeriod = `${formatMonthYear(minDate)} to ${formatMonthYear(maxDate)}`;
            if (!officials.period) officials.period = defaultPeriod;

            // Track unique scribes
            const uniqueScribeRegs = new Set();
            students.forEach(s => {
                const regNo = (s['Register Number'] || s['Register No'] || s['Register No.'] || s.RegisterNo || s.regNo || s.reg_no || s.Name || s.name || '').trim();
                const isScribe = (s.Scribe === 'Yes' || s.isScribe || (regNo && scribeRegSet.has(regNo.toLowerCase())));
                if (isScribe && regNo) uniqueScribeRegs.add(regNo.toLowerCase());
            });
            const totalUniqueScribeCount = uniqueScribeRegs.size;

            // Track invigilators and duties
            const staffDutyCounts = {};
            const staffInfoMap = {};

            // Calculate Part A rows
            const partARows = [];
            let sumFN = 0, sumAN = 0, sumScribe = 0, sumTotal = 0;
            let sumInvigCount = 0, sumInvigAmt = 0;
            let sumClerkAmt = 0, sumPeonAmt = 0, sumSweeperAmt = 0;
            let sumFNSessions = 0, sumANSessions = 0;

            datesList.forEach((dItem, idx) => {
                const fn = dItem.fnStudents;
                const an = dItem.anStudents;
                const scribe = dItem.fnScribes + dItem.anScribes;
                const total = fn + an + scribe;

                let dateInvigCount = 0;
                const dateStaffInvolved = new Set();

                dItem.sessions.forEach(sessKey => {
                    const rooms = roomAllotments[sessKey] || [];
                    const mapping = invigMapping[sessKey] || {};

                    if (rooms.length > 0) {
                        rooms.forEach(r => {
                            const hasRelevantStudents = !r.students || r.students.length === 0 || r.students.some(st => {
                                const reg = (st['Register Number'] || st['Register No'] || st['Register No.'] || st.RegisterNo || st.regNo || st.Name || '').trim().toLowerCase();
                                return filteredRegSet.has(reg);
                            });
                            if (hasRelevantStudents) {
                                dateInvigCount++;
                                const teacherKey = mapping[r.roomName];
                                if (teacherKey) dateStaffInvolved.add(teacherKey);
                            }
                        });
                    } else if (invigSlots[sessKey] && Array.isArray(invigSlots[sessKey].assigned)) {
                        dateInvigCount += invigSlots[sessKey].assigned.length;
                        invigSlots[sessKey].assigned.forEach(st => dateStaffInvolved.add(st));
                    }
                });

                // Fallback: If rooms/slots not yet mapped in software, estimate invigilators from candidate counts
                if (dateInvigCount === 0) {
                    const fnHalls = fn > 0 ? Math.ceil(fn / 25) : 0;
                    const anHalls = an > 0 ? Math.ceil(an / 25) : 0;
                    dateInvigCount = fnHalls + anHalls + scribe;
                }

                // Add to staff duty counts
                dateStaffInvolved.forEach(stKey => {
                    staffDutyCounts[stKey] = (staffDutyCounts[stKey] || 0) + 1;
                });

                // Math according to Calicut University rules using configured Rate Card
                const invigAmt = dateInvigCount * rates.invigilator;

                // Clerk & Peon formula:
                // FullSlab * INT(Total/100) + Slab(rem)
                const rem = total % 100;
                let clerkSlab = rates.clerkSlab1;
                if (rem > 60) clerkSlab = rates.clerkFull;
                else if (rem > 30) clerkSlab = rates.clerkSlab2;
                else if (rem === 0) clerkSlab = 0;

                let peonSlab = rates.peonSlab1;
                if (rem > 60) peonSlab = rates.peonFull;
                else if (rem > 30) peonSlab = rates.peonSlab2;
                else if (rem === 0) peonSlab = 0;

                const clerkAmt = (rates.clerkFull * Math.floor(total / 100)) + (total > 0 ? clerkSlab : 0);
                const peonAmt = (rates.peonFull * Math.floor(total / 100)) + (total > 0 ? peonSlab : 0);

                // Sweeper formula: MAX(baseRate, CEILING(Total/100) * per100Rate)
                const sweeperAmt = total > 0 ? Math.max(rates.sweeperRate, Math.ceil(total / 100) * rates.sweeperMin) : 0;

                const hasFN = (fn + dItem.fnScribes) > 0 ? 1 : 0;
                const hasAN = (an + dItem.anScribes) > 0 ? 1 : 0;

                sumFN += fn;
                sumAN += an;
                sumScribe += scribe;
                sumTotal += total;
                sumInvigCount += dateInvigCount;
                sumInvigAmt += invigAmt;
                sumClerkAmt += clerkAmt;
                sumPeonAmt += peonAmt;
                sumSweeperAmt += sweeperAmt;
                sumFNSessions += hasFN;
                sumANSessions += hasAN;

                partARows.push({
                    slNo: idx + 1,
                    date: dItem.dateDisplay,
                    rawDate: dItem.dateObj,
                    fn: fn > 0 ? fn : '',
                    an: an > 0 ? an : '',
                    scribe: scribe > 0 ? scribe : '',
                    total: total,
                    invigCount: dateInvigCount,
                    invigAmt: invigAmt,
                    clerkCount: total > 0 ? 1 : 0,
                    clerkAmt: clerkAmt,
                    peonCount: total > 0 ? 1 : 0,
                    peonAmt: peonAmt,
                    sweeperCount: total > 0 ? 1 : 0,
                    sweeperAmt: sweeperAmt,
                    isFN: hasFN,
                    isAN: hasAN
                });
            });

            const partATotalAmt = sumInvigAmt + sumClerkAmt + sumPeonAmt + sumSweeperAmt;

            // Part B: Supervision (from Rate Card)
            const totalSessions = sumFNSessions + sumANSessions;
            const csAmt = totalSessions * rates.chiefSupdt;
            const sasAmt = totalSessions * rates.seniorSupdt;
            const osAmt = totalSessions * rates.officeSupdt;
            const partBTotalAmt = csAmt + sasAmt + osAmt;

            // Part C: Data Entry Operator (from Rate Card)
            const partCAmt = rates.dataEntryOperator;

            // Part D: Amanuensis / Scribes (from Rate Card / U.O. No.2433/2022/PB)
            const scribeDuties = sumScribe;
            const scribeRate = rates.scribeRate;
            const partDAmt = scribeDuties * scribeRate;

            // Part E: Accountant (from Rate Card)
            const partEAmt = rates.headAccountant;

            // Part F: Grand Total
            const grandTotalProformaI = partATotalAmt + partBTotalAmt + partCAmt + partDAmt + partEAmt;

            // Proforma II: Contingency (@ Rs. 4/- or from Rate Card)
            const examList = Object.keys(examRegistrations).sort();
            const proformaIIRows = [];
            let totalContingencyCandidates = 0;
            let totalContingencyAmt = 0;

            examList.forEach((eName, idx) => {
                const count = examRegistrations[eName].size;
                const amt = count * rates.contingencyPerCandidate;
                totalContingencyCandidates += count;
                totalContingencyAmt += amt;
                proformaIIRows.push({
                    slNo: idx + 1,
                    examName: eName,
                    count: count,
                    rate: rates.contingencyPerCandidate,
                    amount: amt
                });
            });

            // Consolidated Statement
            const consolidatedTotal = grandTotalProformaI + totalContingencyAmt;
            const advanceReceived = officials.advanceReceived || 0;
            const balanceClaim = consolidatedTotal - advanceReceived;

            // Build Annexure I Invigilator rows
            const invigilatorRows = [];
            let invigDutyTally = 0;

            staffData.forEach(st => {
                if (st.name) staffInfoMap[st.name.toLowerCase()] = st;
                if (st.email) staffInfoMap[st.email.toLowerCase()] = st;
            });

            const staffKeys = Object.keys(staffDutyCounts).sort();
            const hasInvigilationAttendance = staffKeys.length > 0;

            if (hasInvigilationAttendance) {
                staffKeys.forEach((key) => {
                    const dCount = staffDutyCounts[key];
                    const info = staffInfoMap[key.toLowerCase()] || { name: key };
                    const parsed = splitTitleAndName(info.name);
                    const amount = dCount * rates.invigilator;
                    invigDutyTally += dCount;
                    invigilatorRows.push({
                        title: parsed.title,
                        name: parsed.name,
                        designation: 'Invigilator',
                        duties: dCount,
                        rate: rates.invigilator,
                        amount: amount
                    });
                });
            }

            // Annexure I total is only non-zero if invigilation attendance data exists
            const annexureITotal = hasInvigilationAttendance
                ? (partBTotalAmt + partCAmt + partEAmt + sumClerkAmt + sumPeonAmt + sumSweeperAmt + sumInvigAmt)
                : 0;

            return {
                officials: officials,
                rates: rates,
                hasInvigilationAttendance: hasInvigilationAttendance,
                startDateStr: formatDateSlash(minDate),
                endDateStr: formatDateSlash(maxDate),
                startDateDot: formatDateDot(minDate),
                endDateDot: formatDateDot(maxDate),
                period: officials.period,
                partARows: partARows,
                sumFN: sumFN,
                sumAN: sumAN,
                sumScribe: sumScribe,
                sumTotal: sumTotal,
                sumInvigCount: sumInvigCount,
                sumInvigAmt: sumInvigAmt,
                sumClerkAmt: sumClerkAmt,
                sumPeonAmt: sumPeonAmt,
                sumSweeperAmt: sumSweeperAmt,
                sumFNSessions: sumFNSessions,
                sumANSessions: sumANSessions,
                partATotalAmt: partATotalAmt,
                partATotalWords: numberToIndianWords(partATotalAmt),
                totalSessions: totalSessions,
                csAmt: csAmt,
                sasAmt: sasAmt,
                osAmt: osAmt,
                partBTotalAmt: partBTotalAmt,
                partBTotalWords: numberToIndianWords(partBTotalAmt),
                partCAmt: partCAmt,
                partCWords: numberToIndianWords(partCAmt),
                uniqueScribesCount: totalUniqueScribeCount || (sumScribe > 0 ? Math.ceil(sumScribe / 2) : 0),
                scribeDuties: scribeDuties,
                scribeRate: scribeRate,
                partDAmt: partDAmt,
                partDWords: numberToIndianWords(partDAmt),
                partEAmt: partEAmt,
                partEWords: numberToIndianWords(partEAmt),
                grandTotalProformaI: grandTotalProformaI,
                grandTotalProformaIWords: numberToIndianWords(grandTotalProformaI),
                invigilatorRows: invigilatorRows,
                annexureITotal: annexureITotal,
                annexureITotalWords: numberToIndianWords(annexureITotal),
                proformaIIRows: proformaIIRows,
                totalContingencyCandidates: totalContingencyCandidates,
                totalContingencyAmt: totalContingencyAmt,
                totalContingencyWords: numberToIndianWords(totalContingencyAmt),
                consolidatedTotal: consolidatedTotal,
                consolidatedTotalWords: numberToIndianWords(consolidatedTotal),
                advanceReceived: advanceReceived,
                balanceClaim: balanceClaim,
                balanceClaimWords: numberToIndianWords(balanceClaim)
            };
        },

        // --- 4. Multi-Sheet Excel Workbook Builder ---
        buildWorkbook: function (data) {
            if (!data) data = this.aggregateData();
            if (!data) return null;
            if (typeof XLSX === 'undefined') {
                alert("SheetJS library is not loaded.");
                return null;
            }

            const wb = XLSX.utils.book_new();
            const N = data.partARows.length;
            const S = 10 + N;

            // Helper to get formatted name or blank
            const offName = (val) => (val && val.trim()) ? val.trim() : "";

            // SHEET 1: Part A
            const wsA_data = [];
            wsA_data.push(["PROFORMA -1"]);
            wsA_data.push(["Theory Examinations  - Remuneration  - Human Resources"]);
            wsA_data.push([`Statement  for the conduct of Calicut University Examinations held at \n${offName(data.officials.collegeName)}\nFrom ${data.period}`]);
            wsA_data.push([]);
            wsA_data.push(["Part - A"]);
            wsA_data.push(["Sl.No", "Date", "No.of Candidates", "", "", "", "Invigilator", "", "Clerk", "", "Peon", "", "Sweeper", ""]);
            wsA_data.push([]);
            wsA_data.push(["", "", "FN", "AN", "Scribe", "Total", "No.", "Amount", "No.", "Amount", "No.", "Amount", "No.", "Amount"]);
            wsA_data.push([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

            data.partARows.forEach((r, idx) => {
                const rowNum = 10 + idx;
                wsA_data.push([
                    r.slNo,
                    r.date,
                    r.fn,
                    r.an,
                    r.scribe,
                    { t: 'n', f: `SUM(C${rowNum}:E${rowNum})`, v: r.total },
                    r.invigCount,
                    { t: 'n', f: `G${rowNum}*${data.rates.invigilator}`, v: r.invigAmt },
                    r.clerkCount,
                    { t: 'n', f: `${data.rates.clerkFull}*INT(F${rowNum}/100) + IF(F${rowNum}-100*INT(F${rowNum}/100) <= 30, ${data.rates.clerkSlab1}, IF(F${rowNum}-100*INT(F${rowNum}/100) <= 60, ${data.rates.clerkSlab2}, ${data.rates.clerkFull}))`, v: r.clerkAmt },
                    r.peonCount,
                    { t: 'n', f: `${data.rates.peonFull}*INT(F${rowNum}/100) + IF(F${rowNum}-100*INT(F${rowNum}/100) <= 30, ${data.rates.peonSlab1}, IF(F${rowNum}-100*INT(F${rowNum}/100) <= 60, ${data.rates.peonSlab2}, ${data.rates.peonFull}))`, v: r.peonAmt },
                    r.sweeperCount,
                    { t: 'n', f: `MAX(${data.rates.sweeperRate}, CEILING(F${rowNum}/100, 1) * ${data.rates.sweeperMin})`, v: r.sweeperAmt }
                ]);
            });

            const sumRow = new Array(26).fill("");
            sumRow[0] = "";
            sumRow[1] = "Total";
            sumRow[4] = { t: 'n', f: `SUM(E10:E${S - 1})`, v: data.sumScribe };
            sumRow[5] = { t: 'n', f: `SUM(F10:F${S - 1})`, v: data.sumTotal };
            sumRow[6] = { t: 'n', f: `SUM(G10:G${S - 1})`, v: data.sumInvigCount };
            sumRow[7] = { t: 'n', f: `SUM(H10:H${S - 1})`, v: data.sumInvigAmt };
            sumRow[9] = { t: 'n', f: `SUM(J10:J${S - 1})`, v: data.sumClerkAmt };
            sumRow[11] = { t: 'n', f: `SUM(L10:L${S - 1})`, v: data.sumPeonAmt };
            sumRow[13] = { t: 'n', f: `SUM(N10:N${S - 1})`, v: data.sumSweeperAmt };
            sumRow[24] = { t: 'n', f: `SUM(Y10:Y${S - 1})`, v: data.sumFNSessions };
            sumRow[25] = { t: 'n', f: `SUM(Z10:Z${S - 1})`, v: data.sumANSessions };
            wsA_data.push(sumRow);

            wsA_data.push([]);
            const totAmtRow = new Array(14).fill("");
            totAmtRow[1] = "Total Amount ( Column 8+10+12+14)       =";
            totAmtRow[9] = { t: 'n', f: `H${S}+J${S}+L${S}+N${S}`, v: data.partATotalAmt };
            totAmtRow[10] = "/-";
            wsA_data.push(totAmtRow);

            const wordsRow = new Array(14).fill("");
            wordsRow[1] = `(Rupees ${data.partATotalWords} only)`;
            wsA_data.push(wordsRow);

            const wsA = XLSX.utils.aoa_to_sheet(wsA_data);
            wsA['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
                { s: { r: 2, c: 0 }, e: { r: 3, c: 13 } },
                { s: { r: 4, c: 0 }, e: { r: 4, c: 13 } },
                { s: { r: 5, c: 0 }, e: { r: 7, c: 0 } },
                { s: { r: 5, c: 1 }, e: { r: 7, c: 1 } },
                { s: { r: 5, c: 2 }, e: { r: 6, c: 5 } },
                { s: { r: 5, c: 6 }, e: { r: 6, c: 7 } },
                { s: { r: 5, c: 8 }, e: { r: 6, c: 9 } },
                { s: { r: 5, c: 10 }, e: { r: 6, c: 11 } },
                { s: { r: 5, c: 12 }, e: { r: 6, c: 13 } },
                { s: { r: S + 1, c: 1 }, e: { r: S + 1, c: 8 } },
                { s: { r: S + 2, c: 1 }, e: { r: S + 2, c: 10 } }
            ];
            wsA['!cols'] = [
                { wch: 6 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
                { wch: 8 }, { wch: 10 }, { wch: 6 }, { wch: 10 }, { wch: 6 }, { wch: 10 },
                { wch: 6 }, { wch: 10 }
            ];

            for (let i = 0; i < N; i++) {
                const rNum = 10 + i;
                const dItem = data.partARows[i];
                XLSX.utils.sheet_add_aoa(wsA, [[
                    { t: 'n', f: `IF(C${rNum}<>"",1,0)`, v: dItem.isFN },
                    { t: 'n', f: `IF(D${rNum}<>"",1,0)`, v: dItem.isAN }
                ]], { origin: `Y${rNum}` });
            }

            XLSX.utils.book_append_sheet(wb, wsA, "Part A");

            // SHEET 2: Part B,C
            const wsBC_data = [
                [],
                ["PART B"],
                ["Total No. of Sessions:                      ", "", "FN =  ", { t: 'n', f: `'Part A'!Y${S}`, v: data.sumFNSessions }, "AN=  ", { t: 'n', f: `'Part A'!Z${S}`, v: data.sumANSessions }, "Total=", { t: 'n', f: "D3+F3", v: data.totalSessions }],
                ["Sl.No.", "Designation", "Total   No.   of\nSessions", "", "Amount       per\nsession Rs.", "", "Total\nRs."],
                [1, "Chief Superintendent", { t: 'n', f: "$H$3", v: data.totalSessions }, "", data.rates.chiefSupdt, "", { t: 'n', f: "C5*E5", v: data.csAmt }],
                [2, "Senior Assistant Superintendent", { t: 'n', f: "$H$3", v: data.totalSessions }, "", data.rates.seniorSupdt, "", { t: 'n', f: "C6*E6", v: data.sasAmt }],
                [3, "Office Superintendent", { t: 'n', f: "$H$3", v: data.totalSessions }, "", data.rates.officeSupdt, "", { t: 'n', f: "C7*E7", v: data.osAmt }],
                ["", "Total", "", "", "", "", { t: 'n', f: "SUM(G5:G7)", v: data.partBTotalAmt }],
                [`Rs. ${data.partBTotalAmt}/- ( Rupees ${data.partBTotalWords} only)`],
                ["PART C"],
                ["Designation", `Rate @${data.rates.dataEntryOperator}/- for odd and\neven semester examination`, "Amount\nRs."],
                ["Data Entry Operator", offName(data.officials.dataEntryOperator), data.rates.dataEntryOperator],
                ["Rs.890/-(Rupees Eight hundred and Ninety only)"]
            ];

            const wsBC = XLSX.utils.aoa_to_sheet(wsBC_data);
            wsBC['!cols'] = [{ wch: 8 }, { wch: 32 }, { wch: 16 }, { wch: 6 }, { wch: 14 }, { wch: 6 }, { wch: 14 }];
            XLSX.utils.book_append_sheet(wb, wsBC, "Part B,C");

            // SHEET 3: Part D,E,F
            const chiefLabel = offName(data.officials.chiefSupdt) ? `${offName(data.officials.chiefSupdt)}\nChief Superintendent` : "Chief Superintendent";
            const wsDEF_data = [
                ["PART D"],
                ["Designation", "", "No. of Candidates permitted to\nutilize scribe", "", "Rate", "", "Total No. of Duties performed", "", "Total Amount"],
                ["Amanuensis", "", data.uniqueScribesCount, "", data.rates.scribeRate, "", { t: 'n', f: `'Part A'!E${S}`, v: data.scribeDuties }, "", { t: 'n', f: "E3*G3", v: data.partDAmt }],
                ["Total", "", "", "", "", "", "", "", { t: 'n', f: "SUM(I3)", v: data.partDAmt }],
                ["* U. O. No.2433/2022/PB dtd.28.11.2022"],
                ["Scribe orders are attached"],
                [],
                ["PART E"],
                ["Designation", "", "", `Rate @${data.rates.headAccountant}/- for odd and\neven semester examination`, "", "", "", "Amount\nRs."],
                ["Accountant", "", "", offName(data.officials.headAccountant), "", "", "", data.rates.headAccountant],
                ["Rs.1000/-(Rupees One Thousand only)"],
                [],
                [],
                ["( Office Seal)            ", "", "", "", "", "", chiefLabel],
                [],
                [],
                ["PART - F"],
                ["PROFORMA I - GRAND TOTAL"],
                ["Part A", "=", { t: 'n', f: `'Part A'!J${S + 2}`, v: data.partATotalAmt }, "/-"],
                ["Part B", "=", { t: 'n', f: `'Part B,C'!G8`, v: data.partBTotalAmt }, "/-"],
                ["Part C", "=", { t: 'n', f: `'Part B,C'!C12`, v: data.partCAmt }, "/-"],
                ["Part D", "=", { t: 'n', f: "I4", v: data.partDAmt }, "/-"],
                ["Part E", "=", { t: 'n', f: "H10", v: data.partEAmt }, "/-"],
                ["Total", "=", { t: 'n', f: "SUM(C19:C23)", v: data.grandTotalProformaI }, "/-"],
                ["", "              ==============="],
                [`(Rupees ${data.grandTotalProformaIWords} only)`],
                [],
                [],
                ["( Office Seal)            ", "", "", "", "", "", chiefLabel]
            ];

            const wsDEF = XLSX.utils.aoa_to_sheet(wsDEF_data);
            wsDEF['!cols'] = [{ wch: 14 }, { wch: 4 }, { wch: 16 }, { wch: 20 }, { wch: 8 }, { wch: 4 }, { wch: 16 }, { wch: 10 }, { wch: 14 }];
            XLSX.utils.book_append_sheet(wb, wsDEF, "Part D,E,F");

            // SHEET 4: Annexure I (Acquittance Roll)
            const chiefParsed = splitTitleAndName(data.officials.chiefSupdt);
            const sasParsed = splitTitleAndName(data.officials.seniorSupdt);
            const osParsed = splitTitleAndName(data.officials.officeSupdt);
            const acctParsed = splitTitleAndName(data.officials.headAccountant);
            const deoParsed = splitTitleAndName(data.officials.dataEntryOperator);
            const clerkParsed = splitTitleAndName(data.officials.clerk);
            const peonParsed = splitTitleAndName(data.officials.peon);
            const sweeperParsed = splitTitleAndName(data.officials.sweeper);

            const wsAnn1_data = [
                ["ANNEXURE - I"],
                ["Theory Examinations - Remuneration - Human Resources"],
                [`Aquittance for conduct of Calicut University Examinations From ${data.period} at  ${offName(data.officials.collegeName)} Centre`],
                ["Sl.\nNo", "Name", "", "Designation", "Amount\nRs.", "Signature"],
                [1, chiefParsed.title, chiefParsed.name, "Chief Supdt.", { t: 'n', f: `'Part B,C'!G5`, v: data.csAmt }, ""],
                [2, sasParsed.title, sasParsed.name, "SAS", { t: 'n', f: `'Part B,C'!G6`, v: data.sasAmt }, ""],
                [3, osParsed.title, osParsed.name, "Office\nSupdt.", { t: 'n', f: `'Part B,C'!G7`, v: data.osAmt }, ""],
                [4, acctParsed.title, acctParsed.name, "Head Accountant", 1000, ""],
                [5, deoParsed.title, deoParsed.name, "Data  Entry\nOperator", 890, ""],
                [6, clerkParsed.title, clerkParsed.name, "Clerk", { t: 'n', f: `'Part A'!J${S}`, v: data.sumClerkAmt }, ""],
                [7, peonParsed.title, peonParsed.name, "Office attendant", { t: 'n', f: `'Part A'!L${S}`, v: data.sumPeonAmt }, ""],
                [8, sweeperParsed.title, sweeperParsed.name, "Sweeper", { t: 'n', f: `'Part A'!N${S}`, v: data.sumSweeperAmt }, ""]
            ];

            const invigStartRow = 13;
            data.invigilatorRows.forEach((inv, idx) => {
                const rNum = invigStartRow + idx;
                wsAnn1_data.push([
                    9 + idx,
                    inv.title,
                    inv.name,
                    "Invigilator",
                    { t: 'n', f: `L${rNum}`, v: inv.amount },
                    "",
                    "",
                    "",
                    inv.title,
                    inv.name,
                    inv.duties,
                    { t: 'n', f: `K${rNum}*90`, v: inv.amount }
                ]);
            });

            const totalInvRow = 13 + data.invigilatorRows.length;
            wsAnn1_data.push([
                "Total", "", "", "", { t: 'n', f: `SUM(E5:E${totalInvRow - 1})`, v: data.annexureITotal }, ""
            ]);

            wsAnn1_data.push([]);
            wsAnn1_data.push([
                "", "", "( Office Seal)", "", "", chiefLabel
            ]);

            if (data.hasInvigilationAttendance) {
                const wsAnn1 = XLSX.utils.aoa_to_sheet(wsAnn1_data);
                wsAnn1['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
                    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
                    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
                    { s: { r: 3, c: 1 }, e: { r: 3, c: 2 } },
                    { s: { r: totalInvRow - 1, c: 0 }, e: { r: totalInvRow - 1, c: 3 } }
                ];
                wsAnn1['!cols'] = [
                    { wch: 6 }, { wch: 8 }, { wch: 24 }, { wch: 18 }, { wch: 12 }, { wch: 16 },
                    { wch: 4 }, { wch: 4 }, { wch: 8 }, { wch: 24 }, { wch: 8 }, { wch: 10 }
                ];
                XLSX.utils.book_append_sheet(wb, wsAnn1, "Annexure I");
            }

            // SHEET 5: Proforma II (Contingency)
            const wsII_data = [
                ["PROFORMA - II"],
                ["Theory Examinations - Contingent Charges"],
                [`Statement   for  the  conduct   of   Calicut  University  Examinations  From ${data.period} at  ${offName(data.officials.collegeName)}  Centre.`],
                ["Sl.\nNo.", "Name of Examination", "Total No. of candidates registered for the Examination", "Rate per Candidate @ Rs.4/-", "Total Amount Rs."]
            ];

            const K = data.proformaIIRows.length;
            data.proformaIIRows.forEach((ex, idx) => {
                const rNum = 5 + idx;
                wsII_data.push([
                    ex.slNo,
                    ex.examName,
                    ex.count,
                    "",
                    { t: 'n', f: `C${rNum}*${data.rates.contingencyPerCandidate}`, v: ex.amount }
                ]);
            });

            const totIIRowNum = 5 + K;
            wsII_data.push([
                "", "Total", { t: 'n', f: `SUM(C5:C${totIIRowNum - 1})`, v: data.totalContingencyCandidates }, "", { t: 'n', f: `SUM(E5:E${totIIRowNum - 1})`, v: data.totalContingencyAmt }
            ]);
            wsII_data.push([`Rs.${data.totalContingencyAmt}/- ( Rupees ${data.totalContingencyWords} only)`]);
            wsII_data.push([]);
            wsII_data.push(["( Office Seal)", "", chiefLabel]);

            const wsII = XLSX.utils.aoa_to_sheet(wsII_data);
            wsII['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
                { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
                { s: { r: totIIRowNum, c: 0 }, e: { r: totIIRowNum, c: 4 } }
            ];
            wsII['!cols'] = [{ wch: 6 }, { wch: 55 }, { wch: 20 }, { wch: 14 }, { wch: 14 }];
            XLSX.utils.book_append_sheet(wb, wsII, "Proforma II");

            // SHEET 6: Consolidated
            const wsCons_data = [
                [`Consolidated Statement  for the  conduct  of  Calicut  University  Examinations\n From ${data.period} at  ${offName(data.officials.collegeName)} Centre`],
                ["Sl.\nNo", "Particulars", "", "", "", "Amount in Rs."],
                [1, "Theory Examinations  - Remuneration- Human Resources  (Proforma. I)", "", "", "", { t: 'n', f: `'Part D,E,F'!C24`, v: data.grandTotalProformaI }],
                [2, "Theory Examinations - Contingent Charges (Proforma II)", "", "", "", { t: 'n', f: `'Proforma II'!E${totIIRowNum}`, v: data.totalContingencyAmt }],
                ["Total ", "", "", "", "", { t: 'n', f: "SUM(F3:F4)", v: data.consolidatedTotal }],
                [`Rs.${data.consolidatedTotal.toLocaleString('en-IN')}/-`, "", `( Rupees ${data.consolidatedTotalWords} only)`],
                ["Total Expenditure", "", "=", `Rs.${data.consolidatedTotal.toLocaleString('en-IN')}/-`],
                ["Advanced received", "", "=", `Rs.${data.advanceReceived.toFixed(2)} ${data.officials.advanceDetails}`],
                ["Balance Amount", "", "=", `Rs.${data.balanceClaim.toLocaleString('en-IN')}/-`],
                [`( Rupees ${data.balanceClaimWords} only)`],
                [],
                [],
                [],
                ["( Office Seal)            ", "", "", chiefLabel]
            ];

            const wsCons = XLSX.utils.aoa_to_sheet(wsCons_data);
            wsCons['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
                { s: { r: 1, c: 1 }, e: { r: 1, c: 4 } },
                { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } },
                { s: { r: 3, c: 1 }, e: { r: 3, c: 4 } },
                { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } },
                { s: { r: 5, c: 2 }, e: { r: 5, c: 5 } },
                { s: { r: 9, c: 0 }, e: { r: 9, c: 5 } }
            ];
            wsCons['!cols'] = [{ wch: 8 }, { wch: 45 }, { wch: 4 }, { wch: 25 }, { wch: 10 }, { wch: 16 }];
            XLSX.utils.book_append_sheet(wb, wsCons, "Consolidated");

            // SHEET 7: receipt (Annexure II)
            const wsRec_data = [
                [],
                [],
                ["ANNEXURE  - II"],
                ["RECEIPT"],
                [`Received from the Finance Officer, University of Calicut an amount of Rs.${data.totalContingencyAmt}/- (Rupees ${data.totalContingencyWords} only) being the contingent charges @ Rs. 4/- per candidate for the conduct of ${data.period} theory examinations during the period from ${data.startDateStr}  to ${data.endDateStr}.`],
                [],
                ["( Office Seal)            ", "", "", "", "", chiefLabel]
            ];

            const wsRec = XLSX.utils.aoa_to_sheet(wsRec_data);
            wsRec['!merges'] = [
                { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
                { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } },
                { s: { r: 4, c: 0 }, e: { r: 4, c: 8 } },
                { s: { r: 6, c: 0 }, e: { r: 6, c: 2 } },
                { s: { r: 6, c: 5 }, e: { r: 6, c: 8 } }
            ];
            XLSX.utils.book_append_sheet(wb, wsRec, "receipt");

            // SHEET 8: certificates
            const princLabel = offName(data.officials.principal) || "Principal";
            const wsCert_data = [
                [],
                [],
                [`No. ${data.officials.certSeniorSupdtNo}`, "", "", "", "", offName(data.officials.collegeName)],
                ["", "", "", "", "", "Dated:"],
                [],
                [],
                [],
                ["CERTIFICATE-1"],
                [],
                [],
                ["Certified that the Post of Senior Superintendent for whom remuneration is claimed for University Examinations are existing in this college."],
                [],
                [],
                [],
                [],
                ["", "", "", "", "", "", "", princLabel],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [`No. ${data.officials.certHeadAcctNo}`, "", "", "", "", offName(data.officials.collegeName)],
                ["", "", "", "", "", "Dated:"],
                [],
                [],
                [],
                ["CERTIFICATE-2"],
                [],
                [],
                ["Certified that the Post of Head Accountant for whom remuneration is claimed for University Examinations are existing in this college."],
                [],
                [],
                [],
                [],
                ["", "", "", "", "", "", "", princLabel]
            ];

            const wsCert = XLSX.utils.aoa_to_sheet(wsCert_data);
            wsCert['!merges'] = [
                { s: { r: 2, c: 5 }, e: { r: 2, c: 8 } },
                { s: { r: 7, c: 0 }, e: { r: 7, c: 8 } },
                { s: { r: 10, c: 0 }, e: { r: 10, c: 8 } },
                { s: { r: 23, c: 5 }, e: { r: 23, c: 8 } },
                { s: { r: 28, c: 0 }, e: { r: 28, c: 8 } },
                { s: { r: 31, c: 0 }, e: { r: 31, c: 8 } }
            ];
            XLSX.utils.book_append_sheet(wb, wsCert, "certificates");

            return wb;
        },

        exportExcel: function (data) {
            if (!data) data = this.aggregateData();
            if (!data) {
                alert("No student data available to generate Excel.");
                return;
            }
            const wb = this.buildWorkbook(data);
            if (!wb) return;
            const cleanPeriod = (data.period || 'Regular').replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileName = `Calicut_University_Proforma_${cleanPeriod}.xlsx`;
            XLSX.writeFile(wb, fileName);
        },

        // --- 5. Interactive HTML Printable Preview Generator ---
        renderHTML: function (data, activeTab) {
            if (!data) data = this.aggregateData();
            if (!data || !data.partARows || data.partARows.length === 0) {
                return `
                    <div class="p-12 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300 my-6">
                        <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-purple-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h4 class="text-base font-bold text-gray-700">No Regular Examination Records Found</h4>
                        <p class="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                            There are no sessions or candidates matching the selected filter in the Regular Stream.
                            Please select a different filter or ensure regular examination student data is loaded.
                        </p>
                        <button type="button" onclick="UniversityProforma.resetFilters()" class="mt-4 px-4 py-2 bg-purple-700 text-white rounded font-medium text-xs hover:bg-purple-800 transition">
                            Reset Filter to All Regular Sessions
                        </button>
                    </div>
                `;
            }

            const currentTab = activeTab || currentActiveSubTab || 'all';

            const printStyles = `
                <style>
                    .proforma-container {
                        font-family: 'Times New Roman', Times, serif;
                        color: #000;
                        background: #fff;
                        max-width: 900px;
                        margin: 0 auto;
                        padding: 24px;
                    }
                    .proforma-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10pt;
                        margin-top: 10px;
                        margin-bottom: 12px;
                    }
                    .proforma-table th, .proforma-table td {
                        border: 1px solid #000;
                        padding: 4px 6px;
                    }
                    .proforma-table th {
                        background-color: #f3f3f3;
                        font-weight: bold;
                        text-align: center;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .text-left { text-align: left; }
                    .font-bold { font-weight: bold; }
                    .uppercase { text-transform: uppercase; }
                    .header-main { text-align: center; line-height: 1.35; margin-bottom: 16px; }
                    .sign-block {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        margin-top: 40px;
                        font-weight: bold;
                        page-break-inside: avoid;
                    }
                    .page-break {
                        page-break-before: always;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px dashed #ccc;
                    }
                    .blank-entry {
                        color: #999;
                        font-style: italic;
                    }
                    @media print {
                        body { background: #fff !important; }
                        .no-print { display: none !important; }
                        .page-break { page-break-before: always; border-top: none; }
                        .proforma-container { padding: 0 !important; max-width: 100% !important; }
                    }
                </style>
            `;

            const dispName = (n, defaultBlank = "................................") => {
                if (n && n.trim()) return n.trim();
                return `<span class="blank-entry">${defaultBlank}</span>`;
            };

            // HTML Section: Part A
            const renderPartA = () => `
                <div class="proforma-page">
                    <div class="header-main">
                        <div class="font-bold text-lg">PROFORMA - 1</div>
                        <div class="font-bold text-base">Theory Examinations - Remuneration - Human Resources</div>
                        <div class="text-sm mt-1">Statement for the conduct of Calicut University Examinations held at</div>
                        <div class="font-bold text-base">${dispName(data.officials.collegeName, '[College Name]')}</div>
                        <div class="text-sm font-semibold">From ${data.period}</div>
                        <div class="font-bold text-left mt-2">Part - A</div>
                    </div>

                    <table class="proforma-table">
                        <thead>
                            <tr>
                                <th rowspan="3" style="width: 4%;">Sl.<br>No</th>
                                <th rowspan="3" style="width: 12%;">Date</th>
                                <th colspan="4" style="width: 24%;">No. of Candidates</th>
                                <th colspan="2" style="width: 16%;">Invigilator</th>
                                <th colspan="2" style="width: 15%;">Clerk</th>
                                <th colspan="2" style="width: 15%;">Peon</th>
                                <th colspan="2" style="width: 14%;">Sweeper</th>
                            </tr>
                            <tr>
                                <th rowspan="2" style="width: 6%;">FN</th>
                                <th rowspan="2" style="width: 6%;">AN</th>
                                <th rowspan="2" style="width: 6%;">Scribe</th>
                                <th rowspan="2" style="width: 6%;">Total</th>
                                <th style="width: 5%;">No.</th>
                                <th style="width: 11%;">Amount</th>
                                <th style="width: 4%;">No.</th>
                                <th style="width: 11%;">Amount</th>
                                <th style="width: 4%;">No.</th>
                                <th style="width: 11%;">Amount</th>
                                <th style="width: 4%;">No.</th>
                                <th style="width: 10%;">Amount</th>
                            </tr>
                            <tr style="font-size: 8pt; background: #fafafa;">
                                <th>7</th><th>8</th><th>9</th><th>10</th><th>11</th><th>12</th><th>13</th><th>14</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.partARows.map(r => `
                                <tr>
                                    <td class="text-center">${r.slNo}</td>
                                    <td class="text-center">${r.date}</td>
                                    <td class="text-center">${r.fn || ''}</td>
                                    <td class="text-center">${r.an || ''}</td>
                                    <td class="text-center">${r.scribe || ''}</td>
                                    <td class="text-center font-bold">${r.total}</td>
                                    <td class="text-center">${r.invigCount}</td>
                                    <td class="text-right">₹${r.invigAmt}</td>
                                    <td class="text-center">${r.clerkCount}</td>
                                    <td class="text-right">₹${r.clerkAmt}</td>
                                    <td class="text-center">${r.peonCount}</td>
                                    <td class="text-right">₹${r.peonAmt}</td>
                                    <td class="text-center">${r.sweeperCount}</td>
                                    <td class="text-right">₹${r.sweeperAmt}</td>
                                </tr>
                            `).join('')}
                            <tr class="font-bold" style="background-color: #f7f7f7;">
                                <td colspan="2" class="text-center">Total</td>
                                <td class="text-center">${data.sumFN || ''}</td>
                                <td class="text-center">${data.sumAN || ''}</td>
                                <td class="text-center">${data.sumScribe || ''}</td>
                                <td class="text-center">${data.sumTotal}</td>
                                <td class="text-center">${data.sumInvigCount}</td>
                                <td class="text-right">₹${data.sumInvigAmt.toLocaleString('en-IN')}</td>
                                <td class="text-center">-</td>
                                <td class="text-right">₹${data.sumClerkAmt.toLocaleString('en-IN')}</td>
                                <td class="text-center">-</td>
                                <td class="text-right">₹${data.sumPeonAmt.toLocaleString('en-IN')}</td>
                                <td class="text-center">-</td>
                                <td class="text-right">₹${data.sumSweeperAmt.toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="mt-4 p-2 border border-black font-bold flex justify-between">
                        <span>Total Amount (Column 8 + 10 + 12 + 14) =</span>
                        <span class="text-base">₹${data.partATotalAmt.toLocaleString('en-IN')}/-</span>
                    </div>
                    <div class="text-sm italic font-bold mt-1 text-right">
                        (Rupees ${data.partATotalWords} only)
                    </div>
                </div>
            `;

            // HTML Section: Part B & C
            const renderPartBC = () => `
                <div class="proforma-page">
                    <div class="header-main">
                        <div class="font-bold text-lg">PROFORMA - 1 (Continued)</div>
                        <div class="font-bold text-left text-base mt-2">PART B: Supervisory Staff</div>
                    </div>

                    <div class="mb-3 p-2 bg-gray-50 border border-black text-sm flex justify-around font-semibold">
                        <span><strong>Total No. of Sessions:</strong></span>
                        <span>FN = <strong>${data.sumFNSessions}</strong></span>
                        <span>AN = <strong>${data.sumANSessions}</strong></span>
                        <span>Total Sessions = <strong>${data.totalSessions}</strong></span>
                    </div>

                    <table class="proforma-table">
                        <thead>
                            <tr>
                                <th style="width: 8%;">Sl.No.</th>
                                <th style="width: 42%;">Designation</th>
                                <th style="width: 18%;">Total Sessions</th>
                                <th style="width: 16%;">Rate per Session</th>
                                <th style="width: 16%;">Total (Rs.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="text-center">1</td>
                                <td>Chief Superintendent</td>
                                <td class="text-center">${data.totalSessions}</td>
                                <td class="text-right">₹${data.rates.chiefSupdt}</td>
                                <td class="text-right font-bold">₹${data.csAmt.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                                <td class="text-center">2</td>
                                <td>Senior Assistant Superintendent</td>
                                <td class="text-center">${data.totalSessions}</td>
                                <td class="text-right">₹${data.rates.seniorSupdt}</td>
                                <td class="text-right font-bold">₹${data.sasAmt.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                                <td class="text-center">3</td>
                                <td>Office Superintendent</td>
                                <td class="text-center">${data.totalSessions}</td>
                                <td class="text-right">₹${data.rates.officeSupdt}</td>
                                <td class="text-right font-bold">₹${data.osAmt.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr class="font-bold" style="background: #f7f7f7;">
                                <td colspan="2" class="text-center">Total Part B</td>
                                <td class="text-center">${data.totalSessions}</td>
                                <td></td>
                                <td class="text-right text-base">₹${data.partBTotalAmt.toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="text-sm italic font-bold text-right mb-6">
                        (Rupees ${data.partBTotalWords} only)
                    </div>

                    <div class="font-bold text-left text-base mt-6">PART C: Data Entry Operator</div>
                    <table class="proforma-table">
                        <thead>
                            <tr>
                                <th style="width: 35%;">Designation</th>
                                <th style="width: 45%;">Name / Details</th>
                                <th style="width: 20%;">Amount (Rs.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Data Entry Operator</td>
                                <td>${dispName(data.officials.dataEntryOperator, '[Enter DEO Name]')} (Rate @${data.rates.dataEntryOperator}/- for odd & even sem)</td>
                                <td class="text-right font-bold">₹${data.partCAmt}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="text-sm italic font-bold text-right">
                        (Rupees ${data.partCWords} only)
                    </div>
                </div>
            `;

            // HTML Section: Part D, E, F
            const renderPartDEF = () => `
                <div class="proforma-page">
                    <div class="header-main">
                        <div class="font-bold text-lg">PROFORMA - 1 (Continued)</div>
                    </div>

                    <div class="font-bold text-left text-base">PART D: Amanuensis / Scribe Charges</div>
                    <table class="proforma-table">
                        <thead>
                            <tr>
                                <th style="width: 25%;">Designation</th>
                                <th style="width: 25%;">Candidates Permitted</th>
                                <th style="width: 15%;">Rate</th>
                                <th style="width: 15%;">Duties Performed</th>
                                <th style="width: 20%;">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Amanuensis</td>
                                <td class="text-center">${data.uniqueScribesCount}</td>
                                <td class="text-right">₹${data.scribeRate}</td>
                                <td class="text-center">${data.scribeDuties}</td>
                                <td class="text-right font-bold">₹${data.partDAmt.toLocaleString('en-IN')}*</td>
                            </tr>
                            <tr class="font-bold" style="background: #f7f7f7;">
                                <td colspan="4" class="text-center">Total Part D</td>
                                <td class="text-right">₹${data.partDAmt.toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="text-xs text-gray-700 italic mt-1">
                        * U. O. No. 2433/2022/PB dtd. 28.11.2022 (Scribe orders attached).
                    </div>
                    <div class="text-sm italic font-bold text-right">
                        (Rupees ${data.partDWords} only)
                    </div>

                    <div class="font-bold text-left text-base mt-6">PART E: Accountant</div>
                    <table class="proforma-table">
                        <thead>
                            <tr>
                                <th style="width: 25%;">Designation</th>
                                <th style="width: 55%;">Name / Remarks</th>
                                <th style="width: 20%;">Amount (Rs.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Accountant</td>
                                <td>${dispName(data.officials.headAccountant, '[Enter Accountant Name]')} (Rate @${data.rates.headAccountant}/- for odd & even sem)</td>
                                <td class="text-right font-bold">₹${data.partEAmt}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="text-sm italic font-bold text-right">
                        (Rupees ${data.partEWords} only)
                    </div>

                    <div class="mt-8 border-t-2 border-black pt-4">
                        <div class="font-bold text-center text-base mb-3">PART - F: PROFORMA I - GRAND TOTAL</div>
                        <div style="max-width: 450px; margin: 0 auto;">
                            <table class="proforma-table">
                                <tbody>
                                    <tr><td><strong>Part A</strong> (Human Resources Daily Statement)</td><td class="text-center">=</td><td class="text-right font-mono">₹${data.partATotalAmt.toLocaleString('en-IN')}</td></tr>
                                    <tr><td><strong>Part B</strong> (Supervisory Staff)</td><td class="text-center">=</td><td class="text-right font-mono">₹${data.partBTotalAmt.toLocaleString('en-IN')}</td></tr>
                                    <tr><td><strong>Part C</strong> (Data Entry Operator)</td><td class="text-center">=</td><td class="text-right font-mono">₹${data.partCAmt.toLocaleString('en-IN')}</td></tr>
                                    <tr><td><strong>Part D</strong> (Amanuensis / Scribes)</td><td class="text-center">=</td><td class="text-right font-mono">₹${data.partDAmt.toLocaleString('en-IN')}</td></tr>
                                    <tr><td><strong>Part E</strong> (Accountant)</td><td class="text-center">=</td><td class="text-right font-mono">₹${data.partEAmt.toLocaleString('en-IN')}</td></tr>
                                    <tr style="background: #f3f3f3; font-weight: bold; font-size: 11pt;">
                                        <td>TOTAL PROFORMA - I</td><td class="text-center">=</td><td class="text-right font-mono">₹${data.grandTotalProformaI.toLocaleString('en-IN')}/-</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div class="text-sm italic font-bold text-center mt-2">
                                (Rupees ${data.grandTotalProformaIWords} only)
                            </div>
                        </div>
                    </div>

                    <div class="sign-block">
                        <div>( Office Seal )</div>
                        <div class="text-center">
                            <div>${dispName(data.officials.chiefSupdt, '................................')}</div>
                            <div>Chief Superintendent</div>
                        </div>
                    </div>
                </div>
            `;

            // HTML Section: Annexure I (Acquittance Roll) - Only if attendance data exists
            const renderAnnexureI = () => {
                if (!data.hasInvigilationAttendance) {
                    return `
                        <div class="proforma-page" style="text-align: center; padding: 60px 24px;">
                            <div style="font-size: 36px; margin-bottom: 12px;">📋</div>
                            <div class="font-bold text-xl text-gray-800 uppercase tracking-wide">ANNEXURE - I (Acquittance Roll)</div>
                            <div class="text-sm font-semibold text-amber-800 mt-3 max-w-md mx-auto bg-amber-50 border border-amber-200 rounded p-3">
                                ⚠️ Annexure I is omitted for this claim because individual invigilator duty or attendance mapping data is not recorded in the software.
                            </div>
                            <div class="text-xs text-gray-600 mt-4 max-w-lg mx-auto bg-gray-50 p-4 border border-gray-300 rounded text-left leading-relaxed">
                                <strong>Calicut University Regulation Note:</strong><br>
                                Annexure I is an individual voucher roll where teachers sign upon receiving cash/cheque disbursement.
                                When colleges disburse invigilation remuneration offline or have not mapped invigilators inside ExamFlow,
                                <strong>Proforma I (Parts A to F), Proforma II, and the Consolidated Statement</strong> constitute the complete valid university submission.
                            </div>
                        </div>
                    `;
                }
                return `
                <div class="proforma-page">
                    <div class="header-main">
                        <div class="font-bold text-lg">ANNEXURE - I</div>
                        <div class="font-bold text-base">Theory Examinations - Remuneration - Human Resources</div>
                        <div class="font-bold text-sm">Acquittance Roll for the conduct of Calicut University Examinations</div>
                        <div class="text-sm font-semibold">From ${data.period} at ${dispName(data.officials.collegeName, '[College Name]')} Centre</div>
                    </div>

                    <table class="proforma-table">
                        <thead>
                            <tr>
                                <th style="width: 6%;">Sl.No</th>
                                <th style="width: 36%;">Name of Official / Invigilator</th>
                                <th style="width: 22%;">Designation</th>
                                <th style="width: 10%;">Duties</th>
                                <th style="width: 12%;">Amount (Rs.)</th>
                                <th style="width: 14%;">Signature</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="text-center">1</td>
                                <td>${dispName(data.officials.chiefSupdt)}</td>
                                <td>Chief Superintendent</td>
                                <td class="text-center">${data.totalSessions} sess</td>
                                <td class="text-right font-bold">₹${data.csAmt.toLocaleString('en-IN')}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="text-center">2</td>
                                <td>${dispName(data.officials.seniorSupdt)}</td>
                                <td>Senior Assistant Supdt.</td>
                                <td class="text-center">${data.totalSessions} sess</td>
                                <td class="text-right font-bold">₹${data.sasAmt.toLocaleString('en-IN')}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="text-center">3</td>
                                <td>${dispName(data.officials.officeSupdt)}</td>
                                <td>Office Superintendent</td>
                                <td class="text-center">${data.totalSessions} sess</td>
                                <td class="text-right font-bold">₹${data.osAmt.toLocaleString('en-IN')}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="text-center">4</td>
                                <td>${dispName(data.officials.headAccountant)}</td>
                                <td>Head Accountant</td>
                                <td class="text-center">-</td>
                                <td class="text-right font-bold">₹${data.partEAmt}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="text-center">5</td>
                                <td>${dispName(data.officials.dataEntryOperator)}</td>
                                <td>Data Entry Operator</td>
                                <td class="text-center">-</td>
                                <td class="text-right font-bold">₹${data.partCAmt}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="text-center">6</td>
                                <td>${dispName(data.officials.clerk)}</td>
                                <td>Clerk</td>
                                <td class="text-center">-</td>
                                <td class="text-right font-bold">₹${data.sumClerkAmt.toLocaleString('en-IN')}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="text-center">7</td>
                                <td>${dispName(data.officials.peon)}</td>
                                <td>Office Attendant / Peon</td>
                                <td class="text-center">-</td>
                                <td class="text-right font-bold">₹${data.sumPeonAmt.toLocaleString('en-IN')}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="text-center">8</td>
                                <td>${dispName(data.officials.sweeper)}</td>
                                <td>Sweeper</td>
                                <td class="text-center">-</td>
                                <td class="text-right font-bold">₹${data.sumSweeperAmt.toLocaleString('en-IN')}</td>
                                <td></td>
                            </tr>
                            ${data.invigilatorRows.map((inv, i) => `
                                <tr>
                                    <td class="text-center">${9 + i}</td>
                                    <td>${inv.title ? inv.title + ' ' : ''}${inv.name}</td>
                                    <td>Invigilator</td>
                                    <td class="text-center">${inv.duties}</td>
                                    <td class="text-right font-mono">₹${inv.amount.toLocaleString('en-IN')}</td>
                                    <td></td>
                                </tr>
                            `).join('')}
                            <tr class="font-bold" style="background: #f7f7f7; font-size: 10pt;">
                                <td colspan="4" class="text-center">TOTAL ACQUITTANCE CLAIM</td>
                                <td class="text-right">₹${data.annexureITotal.toLocaleString('en-IN')}/-</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="text-sm italic font-bold text-right mb-6">
                        (Rupees ${data.annexureITotalWords} only)
                    </div>

                    <div class="sign-block">
                        <div>( Office Seal )</div>
                        <div class="text-center">
                            <div>${dispName(data.officials.chiefSupdt, '................................')}</div>
                            <div>Chief Superintendent</div>
                        </div>
                    </div>
                </div>
                `;
            };

            // HTML Section: Proforma II (Contingency)
            const renderProformaII = () => `
                <div class="proforma-page">
                    <div class="header-main">
                        <div class="font-bold text-lg">PROFORMA - II</div>
                        <div class="font-bold text-base">Theory Examinations - Contingent Charges</div>
                        <div class="text-sm mt-1">Statement for the conduct of Calicut University Examinations</div>
                        <div class="text-sm font-semibold">From ${data.period} at ${dispName(data.officials.collegeName, '[College Name]')} Centre</div>
                    </div>

                    <table class="proforma-table">
                        <thead>
                            <tr>
                                <th style="width: 8%;">Sl.No.</th>
                                <th style="width: 52%;">Name of Examination</th>
                                <th style="width: 15%;">Candidates Registered</th>
                                <th style="width: 10%;">Rate</th>
                                <th style="width: 15%;">Total Amount (Rs.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.proformaIIRows.map(ex => `
                                <tr>
                                    <td class="text-center">${ex.slNo}</td>
                                    <td>${ex.examName}</td>
                                    <td class="text-center font-bold">${ex.count}</td>
                                    <td class="text-center">@ ₹${data.rates.contingencyPerCandidate}/-</td>
                                    <td class="text-right font-mono font-bold">₹${ex.amount.toLocaleString('en-IN')}</td>
                                </tr>
                            `).join('')}
                            <tr class="font-bold" style="background: #f7f7f7; font-size: 10pt;">
                                <td colspan="2" class="text-center">Total</td>
                                <td class="text-center">${data.totalContingencyCandidates}</td>
                                <td></td>
                                <td class="text-right">₹${data.totalContingencyAmt.toLocaleString('en-IN')}/-</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="mt-4 p-2 border border-black font-bold flex justify-between">
                        <span>Total Contingent Charges Claimed =</span>
                        <span class="text-base">₹${data.totalContingencyAmt.toLocaleString('en-IN')}/-</span>
                    </div>
                    <div class="text-sm italic font-bold mt-1 text-right">
                        (Rupees ${data.totalContingencyWords} only)
                    </div>

                    <div class="sign-block">
                        <div>( Office Seal )</div>
                        <div class="text-center">
                            <div>${dispName(data.officials.chiefSupdt, '................................')}</div>
                            <div>Chief Superintendent</div>
                        </div>
                    </div>
                </div>
            `;

            // HTML Section: Consolidated Statement
            const renderConsolidated = () => `
                <div class="proforma-page">
                    <div class="header-main">
                        <div class="font-bold text-lg">CONSOLIDATED STATEMENT</div>
                        <div class="text-sm mt-1">For the conduct of Calicut University Examinations</div>
                        <div class="text-sm font-semibold">From ${data.period} at ${dispName(data.officials.collegeName, '[College Name]')} Centre</div>
                    </div>

                    <table class="proforma-table">
                        <thead>
                            <tr>
                                <th style="width: 10%;">Sl.No</th>
                                <th style="width: 65%;">Particulars</th>
                                <th style="width: 25%;">Amount in Rs.</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="text-center">1</td>
                                <td>Theory Examinations - Remuneration - Human Resources (Proforma I)</td>
                                <td class="text-right font-mono font-bold">₹${data.grandTotalProformaI.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                                <td class="text-center">2</td>
                                <td>Theory Examinations - Contingent Charges (Proforma II)</td>
                                <td class="text-right font-mono font-bold">₹${data.totalContingencyAmt.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr class="font-bold" style="background: #f7f7f7; font-size: 10pt;">
                                <td colspan="2" class="text-center">Total Expenditure</td>
                                <td class="text-right text-base">₹${data.consolidatedTotal.toLocaleString('en-IN')}/-</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="text-sm italic font-bold text-center mt-2 mb-6">
                        (Rupees ${data.consolidatedTotalWords} only)
                    </div>

                    <div style="max-width: 600px; margin: 20px auto; border: 1px solid #000; padding: 12px;">
                        <div class="flex justify-between py-1">
                            <span class="font-bold">Total Expenditure</span>
                            <span>=</span>
                            <span class="font-bold font-mono">₹${data.consolidatedTotal.toLocaleString('en-IN')}/-</span>
                        </div>
                        <div class="flex justify-between py-1 border-t border-gray-300">
                            <span class="font-bold">Advance Received</span>
                            <span>=</span>
                            <span class="font-mono">₹${data.advanceReceived.toFixed(2)} ${data.officials.advanceDetails}</span>
                        </div>
                        <div class="flex justify-between py-1 border-t-2 border-black font-bold text-base">
                            <span>Balance Amount Claimed</span>
                            <span>=</span>
                            <span class="font-mono">₹${data.balanceClaim.toLocaleString('en-IN')}/-</span>
                        </div>
                    </div>
                    <div class="text-sm italic font-bold text-center">
                        (Rupees ${data.balanceClaimWords} only)
                    </div>

                    <div class="sign-block">
                        <div>( Office Seal )</div>
                        <div class="text-center">
                            <div>${dispName(data.officials.chiefSupdt, '................................')}</div>
                            <div>Chief Superintendent</div>
                        </div>
                    </div>
                </div>
            `;

            // HTML Section: Receipt (Annexure II)
            const renderReceipt = () => `
                <div class="proforma-page" style="padding-top: 40px;">
                    <div class="header-main">
                        <div class="font-bold text-lg">ANNEXURE - II</div>
                        <div class="font-bold text-xl mt-2 tracking-wide">RECEIPT</div>
                    </div>

                    <div class="mt-8 text-justify leading-relaxed text-base" style="text-indent: 40px;">
                        Received from the Finance Officer, University of Calicut an amount of <strong>Rs. ${data.totalContingencyAmt.toLocaleString('en-IN')}/-</strong>
                        (Rupees <em>${data.totalContingencyWords}</em> only) being the contingent charges @ Rs. 4/- per candidate for the conduct of
                        <strong>${data.period}</strong> theory examinations during the period from <strong>${data.startDateStr}</strong> to <strong>${data.endDateStr}</strong>.
                    </div>

                    <div class="sign-block" style="margin-top: 100px;">
                        <div>( Office Seal )</div>
                        <div class="text-center">
                            <div>${dispName(data.officials.chiefSupdt, '................................')}</div>
                            <div>Chief Superintendent</div>
                        </div>
                    </div>
                </div>
            `;

            // HTML Section: Certificates (1 & 2)
            const renderCertificates = () => `
                <div class="proforma-page">
                    <!-- Certificate 1 -->
                    <div class="flex justify-between text-sm mb-6">
                        <div>No. <strong>${data.officials.certSeniorSupdtNo || '............................'}</strong></div>
                        <div class="text-right">
                            <div class="font-bold">${dispName(data.officials.collegeName, '[College Name]')}</div>
                            <div>Dated: ............................</div>
                        </div>
                    </div>

                    <div class="text-center font-bold text-base my-4">CERTIFICATE - 1</div>

                    <div class="text-justify leading-relaxed text-sm my-6 p-4 border border-gray-400 bg-gray-50">
                        Certified that the Post of <strong>Senior Superintendent</strong> for whom remuneration is claimed for University Examinations is existing in this college.
                    </div>

                    <div class="flex justify-end mt-12 mb-16">
                        <div class="text-center">
                            <div class="font-bold">${dispName(data.officials.principal, 'Principal')}</div>
                            <div>Principal</div>
                        </div>
                    </div>

                    <hr class="border-t border-dashed border-gray-500 my-10">

                    <!-- Certificate 2 -->
                    <div class="flex justify-between text-sm mb-6">
                        <div>No. <strong>${data.officials.certHeadAcctNo || '............................'}</strong></div>
                        <div class="text-right">
                            <div class="font-bold">${dispName(data.officials.collegeName, '[College Name]')}</div>
                            <div>Dated: ............................</div>
                        </div>
                    </div>

                    <div class="text-center font-bold text-base my-4">CERTIFICATE - 2</div>

                    <div class="text-justify leading-relaxed text-sm my-6 p-4 border border-gray-400 bg-gray-50">
                        Certified that the Post of <strong>Head Accountant</strong> for whom remuneration is claimed for University Examinations is existing in this college.
                    </div>

                    <div class="flex justify-end mt-12">
                        <div class="text-center">
                            <div class="font-bold">${dispName(data.officials.principal, 'Principal')}</div>
                            <div>Principal</div>
                        </div>
                    </div>
                </div>
            `;

            // Router by Tab
            let bodyHTML = '';
            if (currentTab === 'all') {
                bodyHTML = `
                    ${renderPartA()}
                    <div class="page-break"></div>
                    ${renderPartBC()}
                    <div class="page-break"></div>
                    ${renderPartDEF()}
                    ${data.hasInvigilationAttendance ? `<div class="page-break"></div>` + renderAnnexureI() : ''}
                    <div class="page-break"></div>
                    ${renderProformaII()}
                    <div class="page-break"></div>
                    ${renderConsolidated()}
                    <div class="page-break"></div>
                    ${renderReceipt()}
                    <div class="page-break"></div>
                    ${renderCertificates()}
                `;
            } else if (currentTab === 'partA') {
                bodyHTML = renderPartA();
            } else if (currentTab === 'partBC') {
                bodyHTML = renderPartBC();
            } else if (currentTab === 'partDEF') {
                bodyHTML = renderPartDEF();
            } else if (currentTab === 'annexureI') {
                bodyHTML = renderAnnexureI();
            } else if (currentTab === 'proformaII') {
                bodyHTML = renderProformaII();
            } else if (currentTab === 'consolidated') {
                bodyHTML = renderConsolidated();
            } else if (currentTab === 'receipt') {
                bodyHTML = renderReceipt();
            } else if (currentTab === 'certificates') {
                bodyHTML = renderCertificates();
            }

            return `
                ${printStyles}
                <div class="proforma-container">
                    ${bodyHTML}
                </div>
            `;
        },

        // --- 6. In-Page Tab Controller ---
        populateTabInputs: function (officials) {
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val !== undefined ? val : '';
            };

            setVal('tab-prof-college-name', officials.collegeName);
            setVal('tab-prof-period', officials.period);
            setVal('tab-prof-principal', officials.principal);
            setVal('tab-prof-chief', officials.chiefSupdt);
            setVal('tab-prof-sas', officials.seniorSupdt);
            setVal('tab-prof-os', officials.officeSupdt);
            setVal('tab-prof-acct', officials.headAccountant);
            setVal('tab-prof-deo', officials.dataEntryOperator);
            setVal('tab-prof-clerk', officials.clerk);
            setVal('tab-prof-peon', officials.peon);
            setVal('tab-prof-sweeper', officials.sweeper);
            setVal('tab-prof-advance', officials.advanceReceived);
            setVal('tab-prof-advance-details', officials.advanceDetails);
        },

        getTabInputs: function () {
            const getVal = (id) => (document.getElementById(id)?.value || '').trim();
            return {
                collegeName: getVal('tab-prof-college-name'),
                period: getVal('tab-prof-period'),
                principal: getVal('tab-prof-principal'),
                chiefSupdt: getVal('tab-prof-chief'),
                seniorSupdt: getVal('tab-prof-sas'),
                officeSupdt: getVal('tab-prof-os'),
                headAccountant: getVal('tab-prof-acct'),
                dataEntryOperator: getVal('tab-prof-deo'),
                clerk: getVal('tab-prof-clerk'),
                peon: getVal('tab-prof-peon'),
                sweeper: getVal('tab-prof-sweeper'),
                advanceReceived: Number(document.getElementById('tab-prof-advance')?.value) || 0,
                advanceDetails: getVal('tab-prof-advance-details')
            };
        },

        saveTabOfficials: function (showToast) {
            const updated = this.getTabInputs();
            this.saveOfficials(updated);
            this.refreshDocumentRender();
            if (showToast && window.UiModal && typeof window.UiModal.toast === 'function') {
                window.UiModal.toast('Signatories and college details saved successfully!');
            }
        },

        onTabFieldChange: function () {
            // Debounce save and refresh
            if (this._fieldDebounce) clearTimeout(this._fieldDebounce);
            this._fieldDebounce = setTimeout(() => {
                const updated = this.getTabInputs();
                this.saveOfficials(updated);
                this.refreshDocumentRender();
            }, 300);
        },

        refreshDocumentRender: function () {
            const container = document.getElementById('tab-proforma-document-render');
            if (!container) return;
            const data = this.aggregateData();
            container.innerHTML = `<div class="bg-white shadow-xl mx-auto rounded">${this.renderHTML(data, currentActiveSubTab)}</div>`;
        },

        renderInPageTab: function () {
            const officials = this.getOfficials();
            this.populateExamDropdown();
            this.populateTabInputs(officials);
            this.onFilterChange();
        },

        setSubTab: function (subTabId) {
            currentActiveSubTab = subTabId;
            const buttons = document.querySelectorAll('#subview-remun-proforma .doc-tab-btn');
            buttons.forEach(btn => {
                const tab = btn.getAttribute('data-subtab');
                if (tab === subTabId) {
                    btn.className = 'doc-tab-btn px-3 py-1.5 rounded-lg font-bold bg-purple-700 text-white shadow-sm transition';
                } else {
                    btn.className = 'doc-tab-btn px-3 py-1.5 rounded-lg font-semibold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition';
                }
            });
            this.refreshDocumentRender();
        },

        printCurrentTab: function () {
            const data = this.aggregateData();
            if (!data) return;
            const fullHTML = this.renderHTML(data, currentActiveSubTab);
            const periodStr = (data.period || 'Regular').replace(/[^a-zA-Z0-9_-]/g, '_');
            if (typeof window.openPdfPreview === 'function') {
                window.openPdfPreview(fullHTML, `Calicut_University_Proforma_${periodStr}`);
            } else {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head><title>Calicut University Proforma - ${data.period}</title></head>
                    <body>
                        ${fullHTML}
                        <script>window.onload = function() { window.print(); };<\/script>
                    </body>
                    </html>
                `);
                printWindow.document.close();
            }
        }
    };

    // Global helper functions
    window.switchProformaDocTab = function (subTabId) {
        UniversityProforma.setSubTab(subTabId);
    };

    window.downloadProformaExcelFromTab = function () {
        const data = UniversityProforma.aggregateData();
        UniversityProforma.exportExcel(data);
    };

    window.printProformaPackageFromTab = function () {
        UniversityProforma.printCurrentTab();
    };

    window.switchRemunerationTab = function (tab) {
        const btnStandard = document.getElementById('tab-btn-remun-standard');
        const btnProforma = document.getElementById('tab-btn-remun-proforma');
        const btnSde = document.getElementById('tab-btn-remun-sde');
        const subviewStandard = document.getElementById('subview-remun-standard');
        const subviewProforma = document.getElementById('subview-remun-proforma');
        const subviewSde = document.getElementById('subview-remun-sde');

        if (!btnStandard || !subviewStandard) return;

        // Reset all buttons to inactive style
        btnStandard.className = 'remun-tab-btn px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-50';
        if (btnProforma) btnProforma.className = 'remun-tab-btn px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 bg-white text-purple-700 border border-purple-500 hover:bg-purple-50';
        if (btnSde) btnSde.className = 'remun-tab-btn px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 bg-white text-emerald-700 border border-emerald-500 hover:bg-emerald-50';

        // Hide all subviews
        subviewStandard.classList.add('hidden');
        if (subviewProforma) subviewProforma.classList.add('hidden');
        if (subviewSde) subviewSde.classList.add('hidden');

        if (tab === 'sde') {
            if (btnSde) btnSde.className = 'remun-tab-btn px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2 bg-emerald-700 text-white';
            if (subviewSde) subviewSde.classList.remove('hidden');
            if (window.SdeProforma && typeof window.SdeProforma.renderInPageTab === 'function') {
                window.SdeProforma.renderInPageTab();
            }
        } else if (tab === 'proforma') {
            if (btnProforma) btnProforma.className = 'remun-tab-btn px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2 bg-purple-700 text-white';
            if (subviewProforma) subviewProforma.classList.remove('hidden');
            UniversityProforma.renderInPageTab();
        } else {
            btnStandard.className = 'remun-tab-btn px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center gap-2 bg-indigo-600 text-white';
            subviewStandard.classList.remove('hidden');
        }
    };

    window.UniversityProforma = UniversityProforma;

})(window);
