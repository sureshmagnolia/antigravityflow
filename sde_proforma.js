/**
 * sde_proforma.js
 * Calicut University SDE / Distance / EDE Stream Remuneration & Contingency Package
 * Specifically designed for School of Distance Education examinations matching:
 * - Proforma I (Consolidated Statement of Expenditure)
 * - Annexure I (Aquittance Roll - generated only if invigilator attendance is recorded)
 * - Annexure II (Receipt for Contingent Charges @ Rs. 2.00/- per candidate per session)
 * - Annexure IV (Centre Declaration)
 * - Amanuensis (Acquittance of Scribes @ Rs. 150/- per session)
 *
 * NOTE: Names are fully configurable and never hardcoded to any specific college.
 */

(function (window) {
    'use strict';

    const SDE_OFFICIALS_KEY = 'examSdeOfficials';
    let currentActiveSdeSubTab = 'all';

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

    const SdeProforma = {
        // --- 1. Officials Management (NO HARDCODING) ---
        // Helper: Find Staff by Role checking active dates in roleHistory and designation
        findStaffByRole: function (staffData, roleType, refDate = new Date()) {
            if (!Array.isArray(staffData) || staffData.length === 0) return '';
            const now = (refDate instanceof Date && !isNaN(refDate)) ? refDate.getTime() : Date.now();

            const isRoleActive = (roleObj) => {
                if (!roleObj) return false;
                if (roleObj.start) {
                    const s = new Date(roleObj.start).getTime();
                    if (!isNaN(s) && now < s) return false;
                }
                if (roleObj.end) {
                    const e = new Date(roleObj.end).getTime();
                    if (!isNaN(e) && now > e + 86400000) return false;
                }
                return true;
            };

            const matchesRoleType = (rName) => {
                if (!rName || typeof rName !== 'string') return false;
                const clean = rName.trim().toLowerCase();
                if (roleType === 'principal') {
                    // Must contain principal, but EXCLUDE vice principal
                    return clean.includes('principal') && !clean.includes('vice');
                }
                if (roleType === 'chief') {
                    return clean.includes('chief sup') || clean.includes('chief superintendent') || clean === 'cs';
                }
                if (roleType === 'sas') {
                    return clean.includes('senior asst') || clean.includes('senior assistant') || 
                           clean.includes('senior sup') || clean.includes('senior superintendent') || clean === 'sas';
                }
                if (roleType === 'clerk') {
                    return clean.includes('clerk') || clean.includes('ldc') || clean.includes('udc');
                }
                if (roleType === 'peon') {
                    return clean.includes('peon') || clean.includes('office attendant') || clean === 'oa';
                }
                if (roleType === 'sweeper') {
                    return clean.includes('sweeper') || clean.includes('cleaning');
                }
                return false;
            };

            const activeMatches = [];
            const pastMatches = [];

            staffData.forEach(st => {
                const name = (st.name || '').trim();
                if (!name) return;

                if (matchesRoleType(st.role) || matchesRoleType(st.designation) || matchesRoleType(st.Designation)) {
                    activeMatches.push(name);
                    return;
                }

                if (Array.isArray(st.roleHistory)) {
                    st.roleHistory.forEach(rh => {
                        if (matchesRoleType(rh.role)) {
                            if (isRoleActive(rh)) {
                                activeMatches.push(name);
                            } else {
                                pastMatches.push(name);
                            }
                        }
                    });
                }
            });

            if (activeMatches.length > 0) return activeMatches[0];
            if (pastMatches.length > 0) return pastMatches[pastMatches.length - 1];
            return '';
        },

        getOfficials: function () {
            const saved = localStorage.getItem(SDE_OFFICIALS_KEY);
            let conf = saved ? JSON.parse(saved) : {};

            const collegeName = localStorage.getItem('examCollegeName') || '';
            const staffData = JSON.parse(localStorage.getItem('examStaffData') || '[]');

            const isSaved = (val) => val !== undefined && val !== null && String(val).trim().length > 0 && String(val).trim().toLowerCase() !== 'principal';

            return {
                collegeName: conf.collegeName !== undefined ? conf.collegeName : collegeName,
                period: conf.period || '',
                examName: conf.examName || '',
                chiefSupdt: isSaved(conf.chiefSupdt) ? conf.chiefSupdt.trim() : this.findStaffByRole(staffData, 'chief'),
                seniorSupdt: isSaved(conf.seniorSupdt) ? conf.seniorSupdt.trim() : this.findStaffByRole(staffData, 'sas'),
                clerk: isSaved(conf.clerk) ? conf.clerk.trim() : this.findStaffByRole(staffData, 'clerk'),
                peon: isSaved(conf.peon) ? conf.peon.trim() : this.findStaffByRole(staffData, 'peon'),
                sweeper: isSaved(conf.sweeper) ? conf.sweeper.trim() : this.findStaffByRole(staffData, 'sweeper'),
                principal: isSaved(conf.principal) ? conf.principal.trim() : this.findStaffByRole(staffData, 'principal'),
                paymentInFavourOf: conf.paymentInFavourOf || (collegeName ? `The Principal, ${collegeName}` : '')
            };
        },

        saveOfficials: function (newOfficials) {
            localStorage.setItem(SDE_OFFICIALS_KEY, JSON.stringify(newOfficials));
        },

        // --- 1b. Rate Card Config Integration for SDE ---
        getRates: function () {
            let savedConfig = {};
            try {
                if (typeof window !== 'undefined' && window.allRates && typeof window.allRates === 'object' && Object.keys(window.allRates).length > 0) {
                    savedConfig = window.allRates;
                } else {
                    const raw = localStorage.getItem('examRemunerationConfig');
                    if (raw) savedConfig = JSON.parse(raw);
                }
            } catch (e) {}

            // Match direct key or search through keys
            let sde = savedConfig['EDE'] || savedConfig['SDE'] || savedConfig['Distance'] || savedConfig['Other'] || savedConfig['SDE_Default'];

            if (!sde) {
                for (const k of Object.keys(savedConfig)) {
                    const lk = k.toLowerCase();
                    if (lk === 'ede' || lk === 'sde' || lk === 'distance' || lk === 'other' || lk.includes('sde') || lk.includes('distance') || lk.includes('ede')) {
                        sde = savedConfig[k];
                        break;
                    }
                    if (savedConfig[k] && savedConfig[k].is_sde_mode) {
                        sde = savedConfig[k];
                        break;
                    }
                }
            }
            if (!sde) sde = {};

            return {
                invigilator: (Number(sde.invigilator) > 0) ? Number(sde.invigilator) : 350,
                chiefSingle: (Number(sde.chief_supdt_single) > 0) ? Number(sde.chief_supdt_single) : 500,
                chiefDouble: (Number(sde.chief_supdt_double) > 0) ? Number(sde.chief_supdt_double) : 800,
                seniorSingle: (Number(sde.senior_supdt_single) > 0) ? Number(sde.senior_supdt_single) : 400,
                seniorDouble: (Number(sde.senior_supdt_double) > 0) ? Number(sde.senior_supdt_double) : 700,
                clerkSingle: (Number(sde.clerk_single) > 0) ? Number(sde.clerk_single) : 300,
                clerkDouble: (Number(sde.clerk_double) > 0) ? Number(sde.clerk_double) : 500,
                peonSingle: (Number(sde.peon_single) > 0) ? Number(sde.peon_single) : 250,
                peonDouble: (Number(sde.peon_double) > 0) ? Number(sde.peon_double) : 400,
                sweeperSingle: (Number(sde.sweeper_single) > 0) ? Number(sde.sweeper_single) : 225,
                sweeperDouble: (Number(sde.sweeper_double) > 0) ? Number(sde.sweeper_double) : 350,
                scribeRate: (Number(sde.scribe_rate || sde.amanuensis_rate) > 0) ? Number(sde.scribe_rate || sde.amanuensis_rate) : 150,
                contingencyPerSession: (Number(sde.contingent_charge || sde.contingency_rate) > 0) ? Number(sde.contingent_charge || sde.contingency_rate) : 2.00
            };
        },

        // --- 2. Auto-Detect from Staff Directory ---
        autoDetectFromStaff: function (showToast) {
            const staffData = JSON.parse(localStorage.getItem('examStaffData') || '[]');
            const collegeName = localStorage.getItem('examCollegeName') || '';

            const detected = {
                collegeName: collegeName,
                period: document.getElementById('tab-sde-period')?.value || '',
                examName: document.getElementById('tab-sde-exam-name')?.value || '',
                chiefSupdt: this.findStaffByRole(staffData, 'chief'),
                seniorSupdt: this.findStaffByRole(staffData, 'sas'),
                clerk: this.findStaffByRole(staffData, 'clerk'),
                peon: this.findStaffByRole(staffData, 'peon'),
                sweeper: this.findStaffByRole(staffData, 'sweeper'),
                principal: this.findStaffByRole(staffData, 'principal'),
                paymentInFavourOf: collegeName ? `The Principal, ${collegeName}` : ''
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
            const examSelect = document.getElementById('sde-exam-select');
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

            const sdeStudents = all.filter(s => {
                const stream = (s.Stream || s.stream || '').trim().toLowerCase();
                return stream === 'ede' || stream === 'sde' || stream === 'distance';
            });

            const examMap = {};
            const allDates = [];

            sdeStudents.forEach(s => {
                const exName = (s['Exam Name'] || s.examName || 'SDE Examination').trim();
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
            examSelect.innerHTML = '<option value="">-- All SDE / Distance Examinations --</option>';

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

                const startInput = document.getElementById('sde-start-date');
                const endInput = document.getElementById('sde-end-date');
                if (startInput && !startInput.value) startInput.value = minISO;
                if (endInput && !endInput.value) endInput.value = maxISO;
            }
        },

        onFilterModeChange: function () {
            const mode = document.getElementById('sde-filter-mode')?.value || 'all';
            const examContainer = document.getElementById('sde-exam-dropdown-container');
            const periodContainer = document.getElementById('sde-date-range');

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
            const mode = document.getElementById('sde-filter-mode')?.value || 'all';
            const summaryEl = document.getElementById('sde-filter-summary');
            const examSelect = document.getElementById('sde-exam-select');

            const data = this.aggregateData();

            if (summaryEl) {
                if (!data || data.dateRows.length === 0) {
                    summaryEl.innerHTML = '<span class="text-rose-600 font-semibold">⚠️ No SDE/EDE examination records found matching current filter</span>';
                } else if (mode === 'exam') {
                    const exName = examSelect?.value || 'All SDE Examinations';
                    summaryEl.innerHTML = `Showing Exam: <strong>${exName}</strong> (${data.dateRows.length} exam dates, ${data.totalCandidates} candidate appearances, ₹${data.grandTotal.toLocaleString('en-IN')} total claim)`;
                } else if (mode === 'period') {
                    summaryEl.innerHTML = `Showing Period: <strong>${data.startDateDot} to ${data.endDateDot}</strong> (${data.dateRows.length} exam dates, ${data.totalCandidates} candidate appearances, ₹${data.grandTotal.toLocaleString('en-IN')} total claim)`;
                } else {
                    summaryEl.innerHTML = `Showing all SDE / Distance examination sessions (${data.dateRows.length} exam dates, ${data.totalCandidates} candidate appearances, ₹${data.grandTotal.toLocaleString('en-IN')} total claim)`;
                }
            }

            if (data && data.period) {
                const periodInput = document.getElementById('tab-sde-period');
                if (periodInput && (!periodInput.value || periodInput.dataset.autoManaged === 'true')) {
                    periodInput.value = data.period;
                    periodInput.dataset.autoManaged = 'true';
                }
            }
            if (data && data.examName) {
                const examNameInput = document.getElementById('tab-sde-exam-name');
                if (examNameInput && (!examNameInput.value || examNameInput.dataset.autoManaged === 'true')) {
                    examNameInput.value = data.examName;
                    examNameInput.dataset.autoManaged = 'true';
                }
            }

            this.refreshDocumentRender();
        },

        resetFilters: function () {
            const modeSelect = document.getElementById('sde-filter-mode');
            if (modeSelect) modeSelect.value = 'all';

            const examSelect = document.getElementById('sde-exam-select');
            if (examSelect) examSelect.value = '';

            const startInput = document.getElementById('sde-start-date');
            const endInput = document.getElementById('sde-end-date');
            if (startInput) startInput.value = '';
            if (endInput) endInput.value = '';

            this.populateExamDropdown();
            this.onFilterModeChange();
        },

        // --- 3. Data Aggregator for SDE / Distance Stream ---
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
                    const stream = (s.Stream || s.stream || '').trim().toLowerCase();
                    return stream === 'ede' || stream === 'sde' || stream === 'distance';
                });

                const filterMode = document.getElementById('sde-filter-mode')?.value || 'all';
                if (filterMode === 'exam') {
                    const selectedExam = (document.getElementById('sde-exam-select')?.value || '').trim();
                    if (selectedExam) {
                        students = students.filter(s => (s['Exam Name'] || s.examName || '').trim().toLowerCase() === selectedExam.toLowerCase());
                    }
                } else if (filterMode === 'period') {
                    const startVal = document.getElementById('sde-start-date')?.value;
                    const endVal = document.getElementById('sde-end-date')?.value;
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

            // Scribe Lookups
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

            // Invigilation Lookups
            const invigMapping = JSON.parse(localStorage.getItem('examInvigilatorMapping') || '{}');
            const roomAllotments = JSON.parse(localStorage.getItem('examRoomAllotment') || '{}');
            const invigSlots = JSON.parse(localStorage.getItem('examInvigilationSlots') || '{}');
            const staffData = JSON.parse(localStorage.getItem('examStaffData') || '[]');

            // Group by date
            const dateMap = {};
            const examNamesSet = new Set();
            const datesList = [];

            students.forEach(s => {
                const rawDate = (s.Date || s.date || '').trim();
                const rawTime = (s.Time || s.time || '').trim().toUpperCase();
                const regNo = (s['Register Number'] || s['Register No'] || s['Register No.'] || s.RegisterNo || s.regNo || s.reg_no || s.Name || s.name || '').trim();
                const examName = (s['Exam Name'] || s.examName || 'Calicut University SDE Examination').trim();

                if (!rawDate) return;
                examNamesSet.add(examName);

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
                        fnSessions: new Set(),
                        anSessions: new Set(),
                        exams: new Set()
                    };
                    datesList.push(dateMap[dateKey]);
                }

                dateMap[dateKey].exams.add(examName);
                const isFN = rawTime.includes('AM') || (rawTime.split(/[:.]/)[0] && parseInt(rawTime.split(/[:.]/)[0], 10) < 12 && !rawTime.includes('PM'));
                const sessKey = `${dateKey} | ${rawTime}`;

                if (isFN) dateMap[dateKey].fnSessions.add(sessKey);
                else dateMap[dateKey].anSessions.add(sessKey);

                const isScribe = (s.Scribe === 'Yes' || s.isScribe || (regNo && scribeRegSet.has(regNo.toLowerCase())));

                if (isFN) {
                    if (isScribe) dateMap[dateKey].fnScribes++;
                    else dateMap[dateKey].fnStudents++;
                } else {
                    if (isScribe) dateMap[dateKey].anScribes++;
                    else dateMap[dateKey].anStudents++;
                }
            });

            datesList.sort((a, b) => a.dateObj - b.dateObj);

            const minDate = datesList[0] ? datesList[0].dateObj : new Date();
            const maxDate = datesList[datesList.length - 1] ? datesList[datesList.length - 1].dateObj : new Date();
            const defaultPeriod = `${formatMonthYear(minDate)} to ${formatMonthYear(maxDate)}`;
            if (!officials.period) officials.period = defaultPeriod;

            const examNameTitle = Array.from(examNamesSet).join(', ') || 'Undergraduate / Postgraduate Examination';
            if (!officials.examName) officials.examName = examNameTitle;

            // Track unique scribes
            const uniqueScribeRegs = new Set();
            const scribeRows = [];
            students.forEach(s => {
                const regNo = (s['Register Number'] || s['Register No'] || s['Register No.'] || s.RegisterNo || s.regNo || s.reg_no || s.Name || s.name || '').trim();
                const isScribe = (s.Scribe === 'Yes' || s.isScribe || (regNo && scribeRegSet.has(regNo.toLowerCase())));
                if (isScribe && regNo && !uniqueScribeRegs.has(regNo.toLowerCase())) {
                    uniqueScribeRegs.add(regNo.toLowerCase());
                    const scInfo = scribeListRaw.find(sc => (sc.regNo || sc.registerNo || '').trim().toLowerCase() === regNo.toLowerCase());
                    scribeRows.push({
                        slNo: uniqueScribeRegs.size,
                        candidateName: s.Name || s.name || regNo,
                        regNo: regNo,
                        scribeName: scInfo ? (scInfo.name || scInfo.scribeName || 'Amanuensis') : 'Amanuensis',
                        rate: rates.scribeRate
                    });
                }
            });

            // Track staff duties
            const staffDutyCounts = {};
            const staffInfoMap = {};
            staffData.forEach(st => {
                if (st.name) staffInfoMap[st.name.toLowerCase()] = st;
                if (st.email) staffInfoMap[st.email.toLowerCase()] = st;
            });

            const dateRows = [];
            let sumTotalCandidates = 0;
            let sumTotalInvigDuties = 0;
            let sumTotalInvigAmt = 0;
            let sumClerkAmt = 0;
            let sumPeonAmt = 0;
            let sumSweeperAmt = 0;
            let singleDayCount = 0;
            let doubleDayCount = 0;

            datesList.forEach((dItem, idx) => {
                const fnCand = dItem.fnStudents + dItem.fnScribes;
                const anCand = dItem.anStudents + dItem.anScribes;
                const totalCand = fnCand + anCand;

                const hasFN = fnCand > 0;
                const hasAN = anCand > 0;
                const isDouble = hasFN && hasAN;

                if (isDouble) doubleDayCount++;
                else singleDayCount++;

                // Invigilation count for FN and AN
                let fnInvig = 0;
                let anInvig = 0;
                const dateStaffInvolved = new Set();

                const countForSessions = (sessionsSet) => {
                    let count = 0;
                    sessionsSet.forEach(sessKey => {
                        const rooms = roomAllotments[sessKey] || [];
                        const mapping = invigMapping[sessKey] || {};

                        if (rooms.length > 0) {
                            rooms.forEach(r => {
                                const hasRelevantStudents = !r.students || r.students.length === 0 || r.students.some(st => {
                                    const reg = (st['Register Number'] || st['Register No'] || st['Register No.'] || st.RegisterNo || st.regNo || st.Name || '').trim().toLowerCase();
                                    return filteredRegSet.has(reg);
                                });
                                if (hasRelevantStudents) {
                                    count++;
                                    const teacherKey = mapping[r.roomName];
                                    if (teacherKey) dateStaffInvolved.add(teacherKey);
                                }
                            });
                        } else if (invigSlots[sessKey] && Array.isArray(invigSlots[sessKey].assigned)) {
                            count += invigSlots[sessKey].assigned.length;
                            invigSlots[sessKey].assigned.forEach(st => dateStaffInvolved.add(st));
                        }
                    });
                    return count;
                };

                fnInvig = countForSessions(dItem.fnSessions);
                anInvig = countForSessions(dItem.anSessions);

                // Fallback: estimate from candidates (1 invigilator per 30 candidates)
                if (fnInvig === 0 && fnCand > 0) fnInvig = Math.ceil(fnCand / 30);
                if (anInvig === 0 && anCand > 0) anInvig = Math.ceil(anCand / 30);

                dateStaffInvolved.forEach(stKey => {
                    staffDutyCounts[stKey] = (staffDutyCounts[stKey] || 0) + 1;
                });

                const totalInvigDuties = fnInvig + anInvig;
                const invigTotalAmt = totalInvigDuties * rates.invigilator;

                // Support Staff Rates for SDE
                const clerkAmt = isDouble ? rates.clerkDouble : rates.clerkSingle;
                const peonAmt = isDouble ? rates.peonDouble : rates.peonSingle;
                const sweeperAmt = isDouble ? rates.sweeperDouble : rates.sweeperSingle;

                sumTotalCandidates += totalCand;
                sumTotalInvigDuties += totalInvigDuties;
                sumTotalInvigAmt += invigTotalAmt;
                sumClerkAmt += clerkAmt;
                sumPeonAmt += peonAmt;
                sumSweeperAmt += sweeperAmt;

                dateRows.push({
                    slNo: idx + 1,
                    dateObj: dItem.dateObj,
                    dateDisplay: dItem.dateDisplay,
                    fnCandidates: fnCand,
                    anCandidates: anCand,
                    totalCandidates: totalCand,
                    fnInvigCount: fnInvig,
                    anInvigCount: anInvig,
                    totalInvigCount: totalInvigDuties,
                    invigRate: rates.invigilator,
                    fnInvigAmt: fnInvig * rates.invigilator,
                    anInvigAmt: anInvig * rates.invigilator,
                    invigTotalAmt: invigTotalAmt,
                    isDouble: isDouble,
                    clerkAmt: clerkAmt,
                    peonAmt: peonAmt,
                    sweeperAmt: sweeperAmt
                });
            });

            // Chief & Senior Assistant Supdt amounts
            const chiefAmt = (singleDayCount * rates.chiefSingle) + (doubleDayCount * rates.chiefDouble);
            const seniorAmt = (singleDayCount * rates.seniorSingle) + (doubleDayCount * rates.seniorDouble);

            // Scribes
            let totalScribeDuties = 0;
            datesList.forEach(d => { totalScribeDuties += d.fnScribes + d.anScribes; });
            const amanuensisAmt = totalScribeDuties * rates.scribeRate;

            // Contingency Charges (@ Rs. 2.00/- per candidate per session)
            const contingencyAmt = sumTotalCandidates * rates.contingencyPerSession;

            // Grand Total
            const grandTotal = chiefAmt + seniorAmt + sumTotalInvigAmt + sumClerkAmt + sumPeonAmt + sumSweeperAmt + amanuensisAmt + contingencyAmt;

            // Invigilator Acquittance Rows
            const invigilatorRows = [];
            const staffKeys = Object.keys(staffDutyCounts).sort();
            const hasInvigilationAttendance = staffKeys.length > 0;

            if (hasInvigilationAttendance) {
                staffKeys.forEach((key, idx) => {
                    const dCount = staffDutyCounts[key];
                    const info = staffInfoMap[key.toLowerCase()] || { name: key };
                    const parsed = splitTitleAndName(info.name);
                    const amt = dCount * rates.invigilator;
                    invigilatorRows.push({
                        slNo: idx + 6,
                        title: parsed.title,
                        name: parsed.name,
                        designation: 'Invigilator',
                        duties: dCount,
                        rate: rates.invigilator,
                        amount: amt
                    });
                });
            }

            const aquittanceTotal = hasInvigilationAttendance
                ? (chiefAmt + seniorAmt + sumClerkAmt + sumPeonAmt + sumSweeperAmt + sumTotalInvigAmt)
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
                examName: officials.examName,
                dateRows: dateRows,
                singleDayCount: singleDayCount,
                doubleDayCount: doubleDayCount,
                totalExamDays: dateRows.length,
                totalCandidates: sumTotalCandidates,
                sumTotalInvigDuties: sumTotalInvigDuties,
                sumTotalInvigAmt: sumTotalInvigAmt,
                sumClerkAmt: sumClerkAmt,
                sumPeonAmt: sumPeonAmt,
                sumSweeperAmt: sumSweeperAmt,
                chiefAmt: chiefAmt,
                seniorAmt: seniorAmt,
                totalScribeDuties: totalScribeDuties,
                uniqueScribesCount: uniqueScribeRegs.size,
                amanuensisAmt: amanuensisAmt,
                scribeRows: scribeRows,
                contingencyAmt: contingencyAmt,
                contingencyWords: numberToIndianWords(contingencyAmt),
                grandTotal: grandTotal,
                grandTotalWords: numberToIndianWords(grandTotal),
                invigilatorRows: invigilatorRows,
                aquittanceTotal: aquittanceTotal,
                aquittanceTotalWords: numberToIndianWords(aquittanceTotal)
            };
        },

        // --- 4. Multi-Sheet Excel Workbook Builder matching 5th sem 25 SDE.xlsx ---
        buildWorkbook: function (data) {
            if (!data) data = this.aggregateData();
            if (!data) return null;
            if (typeof XLSX === 'undefined') {
                alert("SheetJS library is not loaded.");
                return null;
            }

            const wb = XLSX.utils.book_new();
            const N = data.dateRows.length;
            const offName = (val) => (val && val.trim()) ? val.trim() : "";

            // SHEET 1: Proforma (Consolidated statement of expenditure)
            const wsP_data = [];
            wsP_data.push(["PROFORMA  I"]);
            wsP_data.push([`Consolidated  statement  of  expenditure  for  the conduct  of   ${data.examName} {SDE}`]);
            wsP_data.push(["Date of Exam", "No.of\nCandidates", "", "Invigilator", "", "", "Clerk", "", "Peon", "", "Sweeper", ""]);
            wsP_data.push(["", "", "", "Nos", `amount ${data.rates.invigilator}`, "Total", "Nos.", "Amount\n", "Nos.", "Amount", "Nos.", "Amount"]);

            let curRow = 5;
            data.dateRows.forEach((r, idx) => {
                const rFN = curRow;
                const rAN = curRow + 1;

                // FN Row
                wsP_data.push([
                    r.dateDisplay,
                    "FN",
                    r.fnCandidates > 0 ? r.fnCandidates : "",
                    r.fnInvigCount > 0 ? r.fnInvigCount : "",
                    r.fnInvigCount > 0 ? { t: 'n', f: `D${rFN}*${data.rates.invigilator}`, v: r.fnInvigAmt } : "",
                    { t: 'n', f: `E${rFN}+E${rAN}`, v: r.invigTotalAmt },
                    1,
                    r.clerkAmt,
                    1,
                    r.peonAmt,
                    1,
                    r.sweeperAmt
                ]);

                // AN Row
                wsP_data.push([
                    "",
                    "AN",
                    r.anCandidates > 0 ? r.anCandidates : "",
                    r.anInvigCount > 0 ? r.anInvigCount : "",
                    r.anInvigCount > 0 ? { t: 'n', f: `D${rAN}*${data.rates.invigilator}`, v: r.anInvigAmt } : "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    ""
                ]);

                curRow += 2;
            });

            const totRowIdx = curRow;
            wsP_data.push([
                "Total",
                "",
                { t: 'n', f: `SUM(C5:C${totRowIdx - 1})`, v: data.totalCandidates },
                { t: 'n', f: `SUM(D5:D${totRowIdx - 1})`, v: data.sumTotalInvigDuties },
                "",
                { t: 'n', f: `SUM(F5:F${totRowIdx - 1})`, v: data.sumTotalInvigAmt },
                { t: 'n', f: `SUM(G5:G${totRowIdx - 1})`, v: data.totalExamDays },
                { t: 'n', f: `SUM(H5:H${totRowIdx - 1})`, v: data.sumClerkAmt },
                { t: 'n', f: `SUM(I5:I${totRowIdx - 1})`, v: data.totalExamDays },
                { t: 'n', f: `SUM(J5:J${totRowIdx - 1})`, v: data.sumPeonAmt },
                { t: 'n', f: `SUM(K5:K${totRowIdx - 1})`, v: data.totalExamDays },
                { t: 'n', f: `SUM(L5:L${totRowIdx - 1})`, v: data.sumSweeperAmt }
            ]);

            wsP_data.push([]); // blank row

            // Summary items 1 to 8 matching 5th sem 25 SDE.xlsx
            const chiefFormulaStr = `${data.doubleDayCount}*${data.rates.chiefDouble}, ${data.singleDayCount}*${data.rates.chiefSingle}`;
            const sasFormulaStr = `${data.doubleDayCount}*${data.rates.seniorDouble}, ${data.singleDayCount}*${data.rates.seniorSingle}`;

            const rS = totRowIdx + 2; // summary start row
            wsP_data.push(["1. Remuneration to Chief Superintendent", "", "", "", "", "", "", chiefFormulaStr, "", data.chiefAmt]);
            wsP_data.push(["2. Remuneration to Senior Assistant Superintendent", "", "", "", "", "", "", sasFormulaStr, "", data.seniorAmt]);
            wsP_data.push(["3. Remuneration to Invigilators", "", "", "", "", "", "", `${data.sumTotalInvigDuties}*${data.rates.invigilator}`, "", { t: 'n', f: `F${totRowIdx}`, v: data.sumTotalInvigAmt }]);
            wsP_data.push(["4. Remuneration to Clerks", "", "", "", "", "", "", "", "", { t: 'n', f: `H${totRowIdx}`, v: data.sumClerkAmt }]);
            wsP_data.push(["5. Remuneration to Peon", "", "", "", "", "", "", "", "", { t: 'n', f: `J${totRowIdx}`, v: data.sumPeonAmt }]);
            wsP_data.push(["6. Remuneration to Sweepers", "", "", "", "", "", "", "", "", { t: 'n', f: `L${totRowIdx}`, v: data.sumSweeperAmt }]);
            wsP_data.push(["7. Remuneration to Amanuensis", "", "", "", "", "", "", `${data.totalScribeDuties}*${data.rates.scribeRate}`, "", data.amanuensisAmt]);
            wsP_data.push([`8. Contingent charges (@ ${data.rates.contingencyPerSession.toFixed(2)} /- per student per session)`, "", "", "", "", "", "", `${data.totalCandidates} * ${data.rates.contingencyPerSession}`, "", data.contingencyAmt]);

            const finalTotRow = rS + 8;
            wsP_data.push(["Total", "", "", "", "", "", "", "", "", { t: 'n', f: `SUM(J${rS}:J${finalTotRow - 1})`, v: data.grandTotal }]);
            wsP_data.push([`(Rupees ${data.grandTotalWords} only)`]);
            wsP_data.push([`Please make payment in favour of        : ${data.officials.paymentInFavourOf}`]);
            wsP_data.push(["JOINT CONTROLLER OF EXAMINATIONS-VIII", "", "", "", "", "", "", "", "", "", "CHIEF SUPERINTENDENT"]);
            wsP_data.push([]);
            wsP_data.push(["(Office Seal)", "* Strike out whichever is not applicable", "", "", "", "", "", "", "", "", offName(data.officials.chiefSupdt)]);

            const wsP = XLSX.utils.aoa_to_sheet(wsP_data);
            wsP['!cols'] = [
                { wch: 14 }, { wch: 6 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 },
                { wch: 6 }, { wch: 10 }, { wch: 6 }, { wch: 10 }, { wch: 6 }, { wch: 10 }
            ];

            // Add merges
            const pMerges = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
                { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
                { s: { r: 2, c: 1 }, e: { r: 3, c: 2 } },
                { s: { r: 2, c: 3 }, e: { r: 2, c: 5 } },
                { s: { r: 2, c: 6 }, e: { r: 2, c: 7 } },
                { s: { r: 2, c: 8 }, e: { r: 2, c: 9 } },
                { s: { r: 2, c: 10 }, e: { r: 2, c: 11 } }
            ];

            for (let i = 0; i < N; i++) {
                const r0 = 4 + i * 2;
                pMerges.push({ s: { r: r0, c: 0 }, e: { r: r0 + 1, c: 0 } }); // Date
                pMerges.push({ s: { r: r0, c: 5 }, e: { r: r0 + 1, c: 5 } }); // Invig total
                pMerges.push({ s: { r: r0, c: 6 }, e: { r: r0 + 1, c: 6 } }); // Clerk nos
                pMerges.push({ s: { r: r0, c: 7 }, e: { r: r0 + 1, c: 7 } }); // Clerk amt
                pMerges.push({ s: { r: r0, c: 8 }, e: { r: r0 + 1, c: 8 } }); // Peon nos
                pMerges.push({ s: { r: r0, c: 9 }, e: { r: r0 + 1, c: 9 } }); // Peon amt
                pMerges.push({ s: { r: r0, c: 10 }, e: { r: r0 + 1, c: 10 } }); // Sweeper nos
                pMerges.push({ s: { r: r0, c: 11 }, e: { r: r0 + 1, c: 11 } }); // Sweeper amt
            }

            wsP['!merges'] = pMerges;
            XLSX.utils.book_append_sheet(wb, wsP, "Proforma");

            // SHEET 2: Aquittance (Annexure-I) - Only if attendance data exists
            if (data.hasInvigilationAttendance) {
                const chiefParsed = splitTitleAndName(data.officials.chiefSupdt);
                const sasParsed = splitTitleAndName(data.officials.seniorSupdt);
                const clerkParsed = splitTitleAndName(data.officials.clerk);
                const peonParsed = splitTitleAndName(data.officials.peon);
                const sweeperParsed = splitTitleAndName(data.officials.sweeper);

                const wsAq_data = [
                    ["Annexure-I"],
                    ["AQUITTANCE"],
                    [`Name of the Examination Centre : ${offName(data.officials.collegeName)}`],
                    [`Name of the Examination : ${data.examName} {SDE}`],
                    [`Dates of Examinations: ${data.dateRows.map(r => r.dateDisplay).join(', ')}`],
                    [],
                    ["Sl. No", "Name & Designation", "Nature of Duty", "No. of Sessions", "Rate / Breakdown", "Amount", "Signature"],
                    [1, `${chiefParsed.title} ${chiefParsed.name}`.trim(), "Chief Superintendent", data.totalExamDays, chiefFormulaStr, { t: 'n', f: `Proforma!J${rS}`, v: data.chiefAmt }, ""],
                    [2, `${sasParsed.title} ${sasParsed.name}`.trim(), "Senior Assistant Superintendent", data.totalExamDays, sasFormulaStr, { t: 'n', f: `Proforma!J${rS + 1}`, v: data.seniorAmt }, ""],
                    [3, `${clerkParsed.title} ${clerkParsed.name}`.trim(), "Clerk", data.totalExamDays, "", { t: 'n', f: `Proforma!J${rS + 3}`, v: data.sumClerkAmt }, ""],
                    [4, `${peonParsed.title} ${peonParsed.name}`.trim(), "Peon", data.totalExamDays, "", { t: 'n', f: `Proforma!J${rS + 4}`, v: data.sumPeonAmt }, ""],
                    [5, `${sweeperParsed.title} ${sweeperParsed.name}`.trim(), "Sweeper", data.totalExamDays, "", { t: 'n', f: `Proforma!J${rS + 5}`, v: data.sumSweeperAmt }, ""]
                ];

                data.invigilatorRows.forEach((inv, i) => {
                    wsAq_data.push([
                        inv.slNo,
                        `${inv.title} ${inv.name}`.trim(),
                        "Invigilator",
                        inv.duties,
                        inv.rate,
                        inv.amount,
                        ""
                    ]);
                });

                const aqTotRow = 8 + 5 + data.invigilatorRows.length;
                wsAq_data.push(["Total:", "", "", "", "", { t: 'n', f: `SUM(F8:F${aqTotRow - 1})`, v: data.aquittanceTotal }, ""]);
                wsAq_data.push([]);
                wsAq_data.push([`Paid an amount of Rs. ${data.aquittanceTotal}/- (Rupees ${data.aquittanceTotalWords} only) towards the remuneration for attending duties of Calicut University ${data.examName} {SDE}.`]);
                wsAq_data.push([]);
                wsAq_data.push(["Office Seal", "", "", "", "Signature\nPrincipal / Chief Superintendent\n(Name & Designation)"]);

                const wsAq = XLSX.utils.aoa_to_sheet(wsAq_data);
                wsAq['!cols'] = [{ wch: 8 }, { wch: 28 }, { wch: 26 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 16 }];
                XLSX.utils.book_append_sheet(wb, wsAq, "Aquittance");
            }

            // SHEET 3: Annexure II (Receipt for Contingency)
            const wsA2_data = [
                [],
                ["ANNEXURE  II"],
                ["RECEIPT"],
                [],
                [`Received from Finance Officer, Calicut University an amount of Rs. ${data.contingencyAmt}/- (${data.contingencyWords} only) being the contingent charges @ Rs. ${data.rates.contingencyPerSession.toFixed(2)}/- per candidates per session for the conduct of ${data.examName} {SDE}.`],
                [],
                [],
                ["Total No. of Candidates", data.totalCandidates],
                ["Total Sessions", data.totalExamDays],
                ["Total Amount", `Rs. ${data.contingencyAmt}/- (${data.contingencyWords} only)`],
                [],
                ["", "Signature"],
                ["", "Principal / Chief Superintendent"],
                ["Office Seal", "Name & Designation"]
            ];
            const wsA2 = XLSX.utils.aoa_to_sheet(wsA2_data);
            wsA2['!cols'] = [{ wch: 28 }, { wch: 36 }, { wch: 14 }, { wch: 14 }];
            XLSX.utils.book_append_sheet(wb, wsA2, "Annexure II");

            // SHEET 4: Annexure IV (Declaration)
            const wsA4_data = [
                [],
                ["ANNEXURE  IV"],
                ["DECLARATION"],
                [`This is to certify that, this institution is a centre of ${data.examName} Examination {SDE} conducted on ${data.dateRows.map(r => r.dateDisplay).join(', ')}, and the claims towards such examinations only is forwarded herewith.`],
                [],
                [],
                ["", "", "", "", "Signature"],
                ["(Office Seal)", "", "", "", "PRINCIPAL / CHIEF SUPERINTENDENT"],
                ["", "", "", "", "Name & Designation"]
            ];
            const wsA4 = XLSX.utils.aoa_to_sheet(wsA4_data);
            wsA4['!cols'] = [{ wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 32 }];
            XLSX.utils.book_append_sheet(wb, wsA4, "Annexure IV");

            // SHEET 5: Amanuensis (Acquittance of Amanuensis)
            const wsAm_data = [
                [],
                [],
                [],
                [],
                [`Acquittance of Amanuensis - ${data.examName} {SDE}`],
                ["Sl. No.", "Names of Candidates", "Register No.", "Names of Amanuensis", "Total Days", "Amount", "Total", "Signature"]
            ];

            if (data.scribeRows.length > 0) {
                data.scribeRows.forEach(sc => {
                    wsAm_data.push([
                        sc.slNo,
                        sc.candidateName,
                        sc.regNo,
                        sc.scribeName,
                        1,
                        sc.rate,
                        sc.rate,
                        ""
                    ]);
                });
            } else {
                wsAm_data.push([1, "NIL", "-", "NIL", 0, data.rates.scribeRate, 0, ""]);
            }

            const amTotRow = 7 + (data.scribeRows.length || 1);
            wsAm_data.push(["Total", "", "", "", "", "", { t: 'n', f: `SUM(G7:G${amTotRow - 1})`, v: data.amanuensisAmt }, ""]);
            wsAm_data.push([]);
            wsAm_data.push([]);
            wsAm_data.push([]);
            wsAm_data.push(["", "", "", "", "", "Chief Superintendent / Principal"]);

            const wsAm = XLSX.utils.aoa_to_sheet(wsAm_data);
            wsAm['!cols'] = [{ wch: 8 }, { wch: 24 }, { wch: 16 }, { wch: 22 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 16 }];
            XLSX.utils.book_append_sheet(wb, wsAm, "Amanuensis");

            return wb;
        },

        // --- 5. Export Excel File ---
        exportExcel: function (data) {
            if (!data) data = this.aggregateData();
            if (!data) return;

            const wb = this.buildWorkbook(data);
            if (!wb) return;

            const cleanExam = (data.examName || 'SDE').replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileName = `Calicut_University_SDE_Proforma_${cleanExam}.xlsx`;

            if (typeof XLSX.writeFile === 'function') {
                XLSX.writeFile(wb, fileName);
            } else if (typeof XLSX.write === 'function' && typeof require !== 'undefined') {
                const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
                const fs = require('fs');
                fs.writeFileSync(fileName, buf);
            }
        },

        // --- 6. Interactive HTML Printable Preview Generator ---
        renderHTML: function (data, activeTab) {
            if (!data) data = this.aggregateData();
            if (!data || !data.dateRows || data.dateRows.length === 0) {
                return `
                    <div class="p-12 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300 my-6">
                        <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-emerald-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <h4 class="text-base font-bold text-gray-700">No SDE / Distance Examination Records Found</h4>
                        <p class="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                            There are no sessions or candidates matching the selected filter in the SDE / EDE / Distance Stream.
                            Please select a different filter or ensure SDE examination data is uploaded.
                        </p>
                        <button type="button" onclick="SdeProforma.resetFilters()" class="mt-4 px-4 py-2 bg-emerald-700 text-white rounded font-medium text-xs hover:bg-emerald-800 transition">
                            Reset Filter to All SDE Sessions
                        </button>
                    </div>
                `;
            }

            const currentTab = activeTab || currentActiveSdeSubTab || 'all';

            const printStyles = `
                <style>
                    .sde-container {
                        font-family: 'Times New Roman', Times, serif;
                        color: #000;
                        background: #fff;
                        max-width: 900px;
                        margin: 0 auto;
                        padding: 24px;
                    }
                    .sde-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 9.5pt;
                        margin-top: 10px;
                        margin-bottom: 12px;
                    }
                    .sde-table th, .sde-table td {
                        border: 1px solid #000;
                        padding: 4px 6px;
                    }
                    .sde-table th {
                        background-color: #f3f3f3;
                        font-weight: bold;
                        text-align: center;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .text-left { text-align: left; }
                    .font-bold { font-weight: bold; }
                    .header-main { text-align: center; line-height: 1.35; margin-bottom: 16px; }
                    .sign-block {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 40px;
                        font-weight: bold;
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
                        .sde-container { padding: 0 !important; max-width: 100% !important; }
                    }
                </style>
            `;

            const dispName = (n, defaultBlank = "................................") => {
                if (n && n.trim()) return n.trim();
                return `<span class="blank-entry">${defaultBlank}</span>`;
            };

            // 1. Proforma I (Consolidated Statement)
            const renderProforma = () => `
                <div class="sde-page">
                    <div class="header-main">
                        <div class="font-bold text-lg">PROFORMA - I</div>
                        <div class="font-bold text-base">Consolidated statement of expenditure for the conduct of ${data.examName} {SDE}</div>
                        <div class="text-sm font-semibold">${dispName(data.officials.collegeName, '[College Name]')} Centre</div>
                        <div class="text-xs text-gray-600">Period: ${data.period}</div>
                    </div>

                    <table class="sde-table">
                        <thead>
                            <tr>
                                <th rowspan="2" style="width: 13%;">Date of Exam</th>
                                <th rowspan="2" style="width: 6%;">Sess</th>
                                <th rowspan="2" style="width: 9%;">No. of Cands</th>
                                <th colspan="3" style="width: 27%;">Invigilator</th>
                                <th colspan="2" style="width: 15%;">Clerk</th>
                                <th colspan="2" style="width: 15%;">Peon</th>
                                <th colspan="2" style="width: 15%;">Sweeper</th>
                            </tr>
                            <tr>
                                <th style="width: 7%;">Nos</th>
                                <th style="width: 10%;">@ ₹${data.rates.invigilator}</th>
                                <th style="width: 10%;">Total</th>
                                <th style="width: 6%;">Nos</th>
                                <th style="width: 9%;">Amt</th>
                                <th style="width: 6%;">Nos</th>
                                <th style="width: 9%;">Amt</th>
                                <th style="width: 6%;">Nos</th>
                                <th style="width: 9%;">Amt</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.dateRows.map(r => `
                                <tr>
                                    <td rowspan="2" class="text-center font-mono text-xs">${r.dateDisplay}</td>
                                    <td class="text-center font-bold">FN</td>
                                    <td class="text-center font-mono">${r.fnCandidates > 0 ? r.fnCandidates : '-'}</td>
                                    <td class="text-center font-mono">${r.fnInvigCount > 0 ? r.fnInvigCount : '-'}</td>
                                    <td class="text-right font-mono">${r.fnInvigAmt > 0 ? '₹' + r.fnInvigAmt : '-'}</td>
                                    <td rowspan="2" class="text-right font-mono font-bold">₹${r.invigTotalAmt.toLocaleString('en-IN')}</td>
                                    <td rowspan="2" class="text-center">1</td>
                                    <td rowspan="2" class="text-right font-mono">₹${r.clerkAmt}</td>
                                    <td rowspan="2" class="text-center">1</td>
                                    <td rowspan="2" class="text-right font-mono">₹${r.peonAmt}</td>
                                    <td rowspan="2" class="text-center">1</td>
                                    <td rowspan="2" class="text-right font-mono">₹${r.sweeperAmt}</td>
                                </tr>
                                <tr>
                                    <td class="text-center font-bold">AN</td>
                                    <td class="text-center font-mono">${r.anCandidates > 0 ? r.anCandidates : '-'}</td>
                                    <td class="text-center font-mono">${r.anInvigCount > 0 ? r.anInvigCount : '-'}</td>
                                    <td class="text-right font-mono">${r.anInvigAmt > 0 ? '₹' + r.anInvigAmt : '-'}</td>
                                </tr>
                            `).join('')}
                            <tr class="font-bold" style="background: #f7f7f7;">
                                <td colspan="2" class="text-center">Total</td>
                                <td class="text-center font-mono">${data.totalCandidates}</td>
                                <td class="text-center font-mono">${data.sumTotalInvigDuties}</td>
                                <td></td>
                                <td class="text-right font-mono">₹${data.sumTotalInvigAmt.toLocaleString('en-IN')}</td>
                                <td class="text-center">${data.totalExamDays}</td>
                                <td class="text-right font-mono">₹${data.sumClerkAmt.toLocaleString('en-IN')}</td>
                                <td class="text-center">${data.totalExamDays}</td>
                                <td class="text-right font-mono">₹${data.sumPeonAmt.toLocaleString('en-IN')}</td>
                                <td class="text-center">${data.totalExamDays}</td>
                                <td class="text-right font-mono">₹${data.sumSweeperAmt.toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="max-width: 650px; margin: 20px auto; border: 1px solid #000; padding: 14px; font-size: 10pt;">
                        <div class="flex justify-between py-1">
                            <span>1. Remuneration to Chief Superintendent (${data.doubleDayCount} double @ ₹${data.rates.chiefDouble}, ${data.singleDayCount} single @ ₹${data.rates.chiefSingle})</span>
                            <span class="font-mono font-bold">= ₹${data.chiefAmt.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="flex justify-between py-1 border-t border-gray-200">
                            <span>2. Remuneration to Senior Assistant Superintendent (${data.doubleDayCount} double @ ₹${data.rates.seniorDouble}, ${data.singleDayCount} single @ ₹${data.rates.seniorSingle})</span>
                            <span class="font-mono font-bold">= ₹${data.seniorAmt.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="flex justify-between py-1 border-t border-gray-200">
                            <span>3. Remuneration to Invigilators (${data.sumTotalInvigDuties} duties @ ₹${data.rates.invigilator})</span>
                            <span class="font-mono font-bold">= ₹${data.sumTotalInvigAmt.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="flex justify-between py-1 border-t border-gray-200">
                            <span>4. Remuneration to Clerks</span>
                            <span class="font-mono font-bold">= ₹${data.sumClerkAmt.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="flex justify-between py-1 border-t border-gray-200">
                            <span>5. Remuneration to Peon</span>
                            <span class="font-mono font-bold">= ₹${data.sumPeonAmt.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="flex justify-between py-1 border-t border-gray-200">
                            <span>6. Remuneration to Sweepers</span>
                            <span class="font-mono font-bold">= ₹${data.sumSweeperAmt.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="flex justify-between py-1 border-t border-gray-200">
                            <span>7. Remuneration to Amanuensis / Scribe (${data.totalScribeDuties} duties @ ₹${data.rates.scribeRate})</span>
                            <span class="font-mono font-bold">= ₹${data.amanuensisAmt.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="flex justify-between py-1 border-t border-gray-200">
                            <span>8. Contingent charges (@ ₹${data.rates.contingencyPerSession.toFixed(2)} per student per session, ${data.totalCandidates} cands)</span>
                            <span class="font-mono font-bold">= ₹${data.contingencyAmt.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="flex justify-between py-1.5 border-t-2 border-black font-bold text-base mt-1">
                            <span>TOTAL CLAIM</span>
                            <span class="font-mono">= ₹${data.grandTotal.toLocaleString('en-IN')}/-</span>
                        </div>
                    </div>

                    <div class="text-sm italic font-bold text-center mb-4">
                        (Rupees ${data.grandTotalWords} only)
                    </div>

                    <div class="text-xs text-gray-700 mt-2">
                        <div><strong>Please make payment in favour of:</strong> ${dispName(data.officials.paymentInFavourOf, '[Enter Payment Beneficiary]')}</div>
                    </div>

                    <div class="sign-block" style="margin-top: 50px;">
                        <div>
                            <div>( Office Seal )</div>
                            <div class="text-xs text-gray-500 font-normal mt-1">* Strike out whichever is not applicable</div>
                        </div>
                        <div class="text-center">
                            <div>${dispName(data.officials.chiefSupdt, '................................')}</div>
                            <div>CHIEF SUPERINTENDENT</div>
                        </div>
                    </div>
                </div>
            `;

            // 2. Aquittance (Annexure I) - Only if attendance data exists
            const renderAquittance = () => {
                if (!data.hasInvigilationAttendance) {
                    return `
                        <div class="sde-page" style="text-align: center; padding: 60px 24px;">
                            <div style="font-size: 36px; margin-bottom: 12px;">📋</div>
                            <div class="font-bold text-xl text-gray-800 uppercase tracking-wide">Annexure-I (AQUITTANCE)</div>
                            <div class="text-sm font-semibold text-emerald-800 mt-3 max-w-md mx-auto bg-emerald-50 border border-emerald-200 rounded p-3">
                                ⚠️ Aquittance Roll is omitted for this claim because individual invigilator duty or attendance mapping data is not recorded in the software.
                            </div>
                            <div class="text-xs text-gray-600 mt-4 max-w-lg mx-auto bg-gray-50 p-4 border border-gray-300 rounded text-left leading-relaxed">
                                <strong>Calicut University SDE Regulation Note:</strong><br>
                                The Aquittance Roll is an individual voucher roll where teachers sign upon receiving cash/cheque disbursement.
                                When colleges disburse invigilation remuneration offline or have not mapped invigilators inside ExamFlow,
                                <strong>Proforma I (Consolidated), Annexure II (Receipt), and Annexure IV (Declaration)</strong> constitute the complete valid university submission.
                            </div>
                        </div>
                    `;
                }

                const chiefFormulaStr = `${data.doubleDayCount}*${data.rates.chiefDouble}, ${data.singleDayCount}*${data.rates.chiefSingle}`;
                const sasFormulaStr = `${data.doubleDayCount}*${data.rates.seniorDouble}, ${data.singleDayCount}*${data.rates.seniorSingle}`;

                return `
                    <div class="sde-page">
                        <div class="header-main">
                            <div class="font-bold text-lg">Annexure-I</div>
                            <div class="font-bold text-xl tracking-wide">AQUITTANCE</div>
                            <div class="text-sm font-semibold mt-1">Name of the Examination Centre: ${dispName(data.officials.collegeName, '[College Name]')}</div>
                            <div class="text-sm font-bold">Name of the Examination: ${data.examName} {SDE}</div>
                            <div class="text-xs text-gray-600 mt-1">Dates of Examinations: ${data.dateRows.map(r => r.dateDisplay).join(', ')}</div>
                        </div>

                        <table class="sde-table">
                            <thead>
                                <tr>
                                    <th style="width: 6%;">Sl.No</th>
                                    <th style="width: 32%;">Name & Designation</th>
                                    <th style="width: 22%;">Nature of Duty</th>
                                    <th style="width: 12%;">No. of Sessions</th>
                                    <th style="width: 14%;">Amount (Rs.)</th>
                                    <th style="width: 14%;">Signature</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="text-center">1</td>
                                    <td>${dispName(data.officials.chiefSupdt)}</td>
                                    <td>Chief Superintendent</td>
                                    <td class="text-center">${data.totalExamDays} days</td>
                                    <td class="text-right font-mono font-bold">₹${data.chiefAmt.toLocaleString('en-IN')}</td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td class="text-center">2</td>
                                    <td>${dispName(data.officials.seniorSupdt)}</td>
                                    <td>Senior Assistant Superintendent</td>
                                    <td class="text-center">${data.totalExamDays} days</td>
                                    <td class="text-right font-mono font-bold">₹${data.seniorAmt.toLocaleString('en-IN')}</td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td class="text-center">3</td>
                                    <td>${dispName(data.officials.clerk)}</td>
                                    <td>Clerk</td>
                                    <td class="text-center">${data.totalExamDays} days</td>
                                    <td class="text-right font-mono font-bold">₹${data.sumClerkAmt.toLocaleString('en-IN')}</td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td class="text-center">4</td>
                                    <td>${dispName(data.officials.peon)}</td>
                                    <td>Peon</td>
                                    <td class="text-center">${data.totalExamDays} days</td>
                                    <td class="text-right font-mono font-bold">₹${data.sumPeonAmt.toLocaleString('en-IN')}</td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td class="text-center">5</td>
                                    <td>${dispName(data.officials.sweeper)}</td>
                                    <td>Sweeper</td>
                                    <td class="text-center">${data.totalExamDays} days</td>
                                    <td class="text-right font-mono font-bold">₹${data.sumSweeperAmt.toLocaleString('en-IN')}</td>
                                    <td></td>
                                </tr>
                                ${data.invigilatorRows.map(inv => `
                                    <tr>
                                        <td class="text-center">${inv.slNo}</td>
                                        <td>${inv.title ? inv.title + ' ' : ''}${inv.name}</td>
                                        <td>Invigilator</td>
                                        <td class="text-center">${inv.duties}</td>
                                        <td class="text-right font-mono">₹${inv.amount.toLocaleString('en-IN')}</td>
                                        <td></td>
                                    </tr>
                                `).join('')}
                                <tr class="font-bold" style="background: #f7f7f7;">
                                    <td colspan="4" class="text-center">TOTAL</td>
                                    <td class="text-right font-mono">₹${data.aquittanceTotal.toLocaleString('en-IN')}/-</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>

                        <div class="mt-4 p-3 border border-black bg-gray-50 text-xs leading-relaxed text-justify">
                            Paid an amount of <strong>Rs. ${data.aquittanceTotal.toLocaleString('en-IN')}/-</strong>
                            (Rupees <em>${data.aquittanceTotalWords}</em> only) towards the remuneration for attending duties of Calicut University
                            <strong>${data.examName} {SDE}</strong> conducted on ${data.dateRows.map(r => r.dateDisplay).join(', ')}.
                        </div>

                        <div class="text-xs text-gray-500 italic mt-2">
                            * Please affix revenue stamps for individual claims exceeding ₹5,000/-
                        </div>

                        <div class="sign-block" style="margin-top: 50px;">
                            <div>( Office Seal )</div>
                            <div class="text-center">
                                <div>${dispName(data.officials.principal || data.officials.chiefSupdt, '................................')}</div>
                                <div>Principal / Chief Superintendent</div>
                            </div>
                        </div>
                    </div>
                `;
            };

            // 3. Annexure II (Receipt for Contingency)
            const renderAnnexureII = () => `
                <div class="sde-page" style="padding-top: 30px;">
                    <div class="header-main">
                        <div class="font-bold text-lg">ANNEXURE II</div>
                        <div class="font-bold text-xl mt-1 tracking-wide">RECEIPT</div>
                    </div>

                    <div class="mt-8 text-justify leading-relaxed text-base" style="text-indent: 40px;">
                        Received from Finance Officer, Calicut University an amount of <strong>Rs. ${data.contingencyAmt.toLocaleString('en-IN')}/-</strong>
                        (Rupees <em>${data.contingencyWords}</em> only) being the contingent charges @ <strong>Rs. ${data.rates.contingencyPerSession.toFixed(2)}/-</strong>
                        per candidates per session for the conduct of <strong>${data.examName} {SDE}</strong>.
                    </div>

                    <div style="max-width: 450px; margin: 30px auto; border: 1px solid #000; padding: 12px; font-size: 11pt;">
                        <div class="flex justify-between py-1">
                            <span class="font-bold">Total No. of Candidates:</span>
                            <span class="font-mono">${data.totalCandidates}</span>
                        </div>
                        <div class="flex justify-between py-1 border-t border-gray-300">
                            <span class="font-bold">Total Exam Days / Sessions:</span>
                            <span class="font-mono">${data.totalExamDays}</span>
                        </div>
                        <div class="flex justify-between py-1 border-t-2 border-black font-bold text-base">
                            <span>Total Amount:</span>
                            <span class="font-mono">Rs. ${data.contingencyAmt.toLocaleString('en-IN')}/-</span>
                        </div>
                    </div>

                    <div class="text-sm italic font-bold text-center">
                        (Rupees ${data.contingencyWords} only)
                    </div>

                    <div class="sign-block" style="margin-top: 80px;">
                        <div>( Office Seal )</div>
                        <div class="text-center">
                            <div>${dispName(data.officials.principal || data.officials.chiefSupdt, '................................')}</div>
                            <div>Principal / Chief Superintendent</div>
                        </div>
                    </div>
                </div>
            `;

            // 4. Annexure IV (Declaration)
            const renderAnnexureIV = () => `
                <div class="sde-page" style="padding-top: 40px;">
                    <div class="header-main">
                        <div class="font-bold text-lg">ANNEXURE IV</div>
                        <div class="font-bold text-xl mt-1 tracking-wide">DECLARATION</div>
                    </div>

                    <div class="mt-10 text-justify leading-relaxed text-base" style="text-indent: 40px;">
                        This is to certify that, this institution is a centre of <strong>${data.examName} Examination {SDE}</strong>
                        conducted on <strong>${data.dateRows.map(r => r.dateDisplay).join(', ')}</strong>, and the claims towards such examinations only is forwarded herewith.
                    </div>

                    <div class="sign-block" style="margin-top: 100px;">
                        <div>( Office Seal )</div>
                        <div class="text-center">
                            <div>${dispName(data.officials.principal || data.officials.chiefSupdt, '................................')}</div>
                            <div>PRINCIPAL / CHIEF SUPERINTENDENT</div>
                        </div>
                    </div>
                </div>
            `;

            // 5. Amanuensis (Acquittance of Scribes)
            const renderAmanuensis = () => `
                <div class="sde-page" style="padding-top: 30px;">
                    <div class="header-main">
                        <div class="font-bold text-lg">ACQUITTANCE OF AMANUENSIS</div>
                        <div class="font-bold text-base mt-1">${data.examName} {SDE}</div>
                        <div class="text-sm font-semibold">${dispName(data.officials.collegeName, '[College Name]')} Centre</div>
                    </div>

                    <table class="sde-table">
                        <thead>
                            <tr>
                                <th style="width: 8%;">Sl.No</th>
                                <th style="width: 25%;">Name of Candidate</th>
                                <th style="width: 18%;">Register No.</th>
                                <th style="width: 22%;">Name of Amanuensis</th>
                                <th style="width: 9%;">Days</th>
                                <th style="width: 9%;">Rate</th>
                                <th style="width: 9%;">Total (Rs.)</th>
                                <th style="width: 15%;">Signature</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.scribeRows.length > 0 ? data.scribeRows.map(sc => `
                                <tr>
                                    <td class="text-center">${sc.slNo}</td>
                                    <td>${sc.candidateName}</td>
                                    <td class="text-center font-mono">${sc.regNo}</td>
                                    <td>${sc.scribeName}</td>
                                    <td class="text-center">1</td>
                                    <td class="text-right font-mono">₹${sc.rate}</td>
                                    <td class="text-right font-mono font-bold">₹${sc.rate}</td>
                                    <td></td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="8" class="text-center py-4 text-gray-500 italic">No candidates required Amanuensis/Scribe for this examination.</td>
                                </tr>
                            `}
                            <tr class="font-bold" style="background: #f7f7f7;">
                                <td colspan="6" class="text-center">Total</td>
                                <td class="text-right font-mono font-bold">₹${data.amanuensisAmt.toLocaleString('en-IN')}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="sign-block" style="margin-top: 80px;">
                        <div>( Office Seal )</div>
                        <div class="text-center">
                            <div>${dispName(data.officials.principal || data.officials.chiefSupdt, '................................')}</div>
                            <div>Chief Superintendent / Principal</div>
                        </div>
                    </div>
                </div>
            `;

            // Tab router
            let bodyHTML = '';
            if (currentTab === 'all') {
                bodyHTML = `
                    ${renderProforma()}
                    ${data.hasInvigilationAttendance ? `<div class="page-break"></div>` + renderAquittance() : ''}
                    <div class="page-break"></div>
                    ${renderAnnexureII()}
                    <div class="page-break"></div>
                    ${renderAnnexureIV()}
                    <div class="page-break"></div>
                    ${renderAmanuensis()}
                `;
            } else if (currentTab === 'proforma') {
                bodyHTML = renderProforma();
            } else if (currentTab === 'aquittance') {
                bodyHTML = renderAquittance();
            } else if (currentTab === 'annexureII') {
                bodyHTML = renderAnnexureII();
            } else if (currentTab === 'annexureIV') {
                bodyHTML = renderAnnexureIV();
            } else if (currentTab === 'amanuensis') {
                bodyHTML = renderAmanuensis();
            }

            return `
                <div class="sde-container">
                    ${printStyles}
                    ${bodyHTML}
                </div>
            `;
        },

        // --- 7. DOM Population & In-Tab Management ---
        populateTabInputs: function (officials) {
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el && val !== undefined) el.value = val;
            };
            setVal('tab-sde-college-name', officials.collegeName);
            setVal('tab-sde-period', officials.period);
            setVal('tab-sde-exam-name', officials.examName);
            setVal('tab-sde-principal', officials.principal);
            setVal('tab-sde-chief', officials.chiefSupdt);
            setVal('tab-sde-sas', officials.seniorSupdt);
            setVal('tab-sde-clerk', officials.clerk);
            setVal('tab-sde-peon', officials.peon);
            setVal('tab-sde-sweeper', officials.sweeper);
            setVal('tab-sde-payment-favour', officials.paymentInFavourOf);
        },

        getTabInputs: function () {
            const getVal = (id) => (document.getElementById(id)?.value || '').trim();
            return {
                collegeName: getVal('tab-sde-college-name'),
                period: getVal('tab-sde-period'),
                examName: getVal('tab-sde-exam-name'),
                principal: getVal('tab-sde-principal'),
                chiefSupdt: getVal('tab-sde-chief'),
                seniorSupdt: getVal('tab-sde-sas'),
                clerk: getVal('tab-sde-clerk'),
                peon: getVal('tab-sde-peon'),
                sweeper: getVal('tab-sde-sweeper'),
                paymentInFavourOf: getVal('tab-sde-payment-favour')
            };
        },

        resetOfficialsToDefault: function () {
            localStorage.removeItem(SDE_OFFICIALS_KEY);
            const defaults = this.getOfficials();
            this.populateTabInputs(defaults);
            this.refreshDocumentRender();
            if (window.UiModal && typeof window.UiModal.toast === 'function') {
                window.UiModal.toast('Reset to default staff designations.');
            }
        },

        saveTabOfficials: function (showToast) {
            const updated = this.getTabInputs();
            this.saveOfficials(updated);
            this.refreshDocumentRender();
            if (showToast && window.UiModal && typeof window.UiModal.toast === 'function') {
                window.UiModal.toast('Signatories and SDE college details saved successfully!');
            }
        },

        onTabFieldChange: function () {
            if (this._fieldDebounce) clearTimeout(this._fieldDebounce);
            this._fieldDebounce = setTimeout(() => {
                const updated = this.getTabInputs();
                this.saveOfficials(updated);
                this.refreshDocumentRender();
            }, 300);
        },

        refreshDocumentRender: function () {
            const container = document.getElementById('tab-sde-document-render');
            if (!container) return;
            const data = this.aggregateData();
            container.innerHTML = `<div class="bg-white shadow-xl mx-auto rounded">${this.renderHTML(data, currentActiveSdeSubTab)}</div>`;
        },

        renderInPageTab: function () {
            const officials = this.getOfficials();
            this.populateExamDropdown();
            this.populateTabInputs(officials);
            this.onFilterChange();
        },

        setSubTab: function (subTabId) {
            currentActiveSdeSubTab = subTabId;
            const buttons = document.querySelectorAll('#subview-remun-sde .sde-doc-tab-btn');
            buttons.forEach(btn => {
                const tab = btn.getAttribute('data-subtab');
                if (tab === subTabId) {
                    btn.className = 'sde-doc-tab-btn px-3 py-1.5 rounded-lg font-bold bg-emerald-700 text-white shadow-sm transition';
                } else {
                    btn.className = 'sde-doc-tab-btn px-3 py-1.5 rounded-lg font-semibold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition';
                }
            });
            this.refreshDocumentRender();
        },

        printCurrentTab: function () {
            const data = this.aggregateData();
            if (!data) return;
            const fullHTML = this.renderHTML(data, currentActiveSdeSubTab);
            const examStr = (data.examName || 'SDE').replace(/[^a-zA-Z0-9_-]/g, '_');
            if (typeof window.openPdfPreview === 'function') {
                window.openPdfPreview(fullHTML, `Calicut_University_SDE_Proforma_${examStr}`);
            } else {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head><title>Calicut University SDE Proforma - ${data.examName}</title></head>
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
    window.switchSdeDocTab = function (subTabId) {
        SdeProforma.setSubTab(subTabId);
    };

    window.downloadSdeExcelFromTab = function () {
        const data = SdeProforma.aggregateData();
        SdeProforma.exportExcel(data);
    };

    window.printSdePackageFromTab = function () {
        SdeProforma.printCurrentTab();
    };

    window.SdeProforma = SdeProforma;

})(window);
