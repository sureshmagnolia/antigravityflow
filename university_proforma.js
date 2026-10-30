/**
 * university_proforma.js
 * Calicut University Proforma I & II Remuneration & Contingency Package
 * Specifically designed for Regular Stream examinations matching official format:
 * - Proforma I (Parts A to F)
 * - Annexure I (Acquittance Roll)
 * - Proforma II (Contingent Charges @ Rs.4/- per candidate)
 * - Consolidated Statement
 * - Annexure II (Receipt for Contingent Charges)
 * - Certificates (1 & 2 for Senior Supdt & Head Accountant posts)
 */

(function (window) {
    'use strict';

    const PROFORMA_OFFICIALS_KEY = 'examProformaOfficials';

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
        if (!fullName) return { title: 'Sri.', name: '' };
        const clean = fullName.trim();
        const prefixes = ['Dr.', 'Dr', 'Prof.', 'Prof', 'Sri.', 'Sri', 'Smt.', 'Smt', 'Ms.', 'Ms', 'Mr.', 'Mr'];
        for (const p of prefixes) {
            if (clean.toLowerCase().startsWith(p.toLowerCase() + ' ') || clean.toLowerCase().startsWith(p.toLowerCase() + '.')) {
                const normTitle = p.endsWith('.') ? p : p + '.';
                const rest = clean.substring(p.length).replace(/^[.\s]+/, '').trim();
                return { title: normTitle, name: rest };
            }
        }
        return { title: 'Sri.', name: clean };
    }

    // Helper: Parse DD.MM.YYYY into Date object
    function parseDateStr(str) {
        if (!str) return new Date();
        const parts = str.trim().split(/[.-/]/);
        if (parts.length === 3) {
            let d = parts[0], m = parts[1], y = parts[2];
            if (d.length === 4) [y, m, d] = [d, m, y];
            return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
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
        // --- 1. Officials Management ---
        getOfficials: function () {
            const saved = localStorage.getItem(PROFORMA_OFFICIALS_KEY);
            let conf = saved ? JSON.parse(saved) : {};

            const collegeName = localStorage.getItem('examCollegeName') || 'Sree Neelakanta Government Sanskrit College Pattambi';
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
                collegeName: conf.collegeName || collegeName,
                period: conf.period || '',
                chiefSupdt: conf.chiefSupdt || findStaffName(['chief supdt', 'chief superintendent']) || 'Dr. Vivek PJ',
                seniorSupdt: conf.seniorSupdt || findStaffName(['senior assistant', 'senior supdt', 'sas']) || 'Dr. Hyderali K',
                officeSupdt: conf.officeSupdt || findStaffName(['office supdt', 'office superintendent', 'os']) || 'Smt. Rekha C',
                headAccountant: conf.headAccountant || findStaffName(['head accountant', 'accountant']) || 'Sri. Ashokan',
                dataEntryOperator: conf.dataEntryOperator || findStaffName(['data entry', 'deo']) || 'Smt. Ambili M',
                clerk: conf.clerk || findStaffName(['clerk', 'office clerk', 'ld clerk', 'ud clerk']) || 'Smt. Raseena A',
                peon: conf.peon || findStaffName(['peon', 'office attendant', 'oa']) || 'Sri. Babukuttan',
                sweeper: conf.sweeper || findStaffName(['sweeper', 'cleaning staff']) || 'Sri. Babu C',
                principal: conf.principal || findStaffName(['principal']) || 'Principal',
                advanceReceived: conf.advanceReceived !== undefined ? Number(conf.advanceReceived) : 0,
                advanceDetails: conf.advanceDetails || 'Vide Cheque No. .............. dated ...........',
                certSeniorSupdtNo: conf.certSeniorSupdtNo || '',
                certHeadAcctNo: conf.certHeadAcctNo || ''
            };
        },

        saveOfficials: function (newOfficials) {
            localStorage.setItem(PROFORMA_OFFICIALS_KEY, JSON.stringify(newOfficials));
        },

        // --- 2. Data Aggregator for Regular Stream ---
        aggregateData: function (filteredStudents) {
            const officials = this.getOfficials();
            const students = filteredStudents || (window.allStudentData || []).filter(s => {
                const stream = (s.Stream || s.stream || 'Regular').trim().toLowerCase();
                return stream === 'regular';
            });

            if (!students || students.length === 0) return null;

            // External lookups
            const scribeListRaw = JSON.parse(localStorage.getItem('examScribeList') || '[]');
            const scribeRegSet = new Set(scribeListRaw.map(sc => (sc.regNo || sc.registerNo || sc.candidateRegNo || '').trim().toLowerCase()).filter(Boolean));
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
            const minDate = datesList[0].dateObj;
            const maxDate = datesList[datesList.length - 1].dateObj;
            const defaultPeriod = `${formatMonthYear(minDate)} to ${formatMonthYear(maxDate)}`;
            if (!officials.period) officials.period = defaultPeriod;

            // Track unique scribes
            let totalUniqueScribeCount = 0;
            const uniqueScribeRegs = new Set();
            students.forEach(s => {
                const regNo = (s['Register Number'] || s['Register No'] || s['Register No.'] || s.RegisterNo || s.regNo || s.reg_no || s.Name || s.name || '').trim();
                const isScribe = (s.Scribe === 'Yes' || s.isScribe || (regNo && scribeRegSet.has(regNo.toLowerCase())));
                if (isScribe && regNo) uniqueScribeRegs.add(regNo.toLowerCase());
            });
            totalUniqueScribeCount = uniqueScribeRegs.size;

            // Track invigilators and duties
            const staffDutyCounts = {}; // staffKey -> count
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

                // Invigilators for this date:
                // Check all session keys for this date in invigMapping / roomAllotments
                let dateInvigCount = 0;
                const dateStaffInvolved = new Set();

                dItem.sessions.forEach(sessKey => {
                    const rooms = roomAllotments[sessKey] || [];
                    const mapping = invigMapping[sessKey] || {};

                    if (rooms.length > 0) {
                        rooms.forEach(r => {
                            dateInvigCount++;
                            const teacherKey = mapping[r.roomName];
                            if (teacherKey) dateStaffInvolved.add(teacherKey);
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

                // Math according to Calicut University rules
                const invigAmt = dateInvigCount * 90;

                // Clerk & Peon formula:
                // 113 * INT(Total/100) + IF(MOD(Total, 100) <= 30, 38, IF(MOD(Total, 100) <= 60, 75, 113))
                const rem = total % 100;
                let slab = 38;
                if (rem > 60) slab = 113;
                else if (rem > 30) slab = 75;
                const clerkAmt = (113 * Math.floor(total / 100)) + (total > 0 ? slab : 0);
                const peonAmt = clerkAmt;

                // Sweeper formula:
                // MAX(35, CEILING(Total/100) * 25)
                const sweeperAmt = total > 0 ? Math.max(35, Math.ceil(total / 100) * 25) : 0;

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

            // Part B: Supervision
            const totalSessions = sumFNSessions + sumANSessions;
            const csAmt = totalSessions * 123;
            const sasAmt = totalSessions * 105;
            const osAmt = totalSessions * 90;
            const partBTotalAmt = csAmt + sasAmt + osAmt;

            // Part C: Data Entry Operator
            const partCAmt = 890;

            // Part D: Amanuensis / Scribes
            const scribeDuties = sumScribe;
            const scribeRate = 150;
            const partDAmt = scribeDuties * scribeRate;

            // Part E: Accountant
            const partEAmt = 1000;

            // Part F: Grand Total
            const grandTotalProformaI = partATotalAmt + partBTotalAmt + partCAmt + partDAmt + partEAmt;

            // Proforma II: Contingency
            const examList = Object.keys(examRegistrations).sort();
            const proformaIIRows = [];
            let totalContingencyCandidates = 0;
            let totalContingencyAmt = 0;

            examList.forEach((eName, idx) => {
                const count = examRegistrations[eName].size;
                const amt = count * 4;
                totalContingencyCandidates += count;
                totalContingencyAmt += amt;
                proformaIIRows.push({
                    slNo: idx + 1,
                    examName: eName,
                    count: count,
                    rate: 4,
                    amount: amt
                });
            });

            // Consolidated Statement
            const consolidatedTotal = grandTotalProformaI + totalContingencyAmt;
            const advanceReceived = officials.advanceReceived || 0;
            const balanceClaim = consolidatedTotal - advanceReceived;

            // Build Annexure I Invigilator rows
            // Map teachers from staffDutyCounts or from staffData with duties
            const invigilatorRows = [];
            let invigDutyTally = 0;

            // Build staff lookup
            staffData.forEach(st => {
                if (st.name) staffInfoMap[st.name.toLowerCase()] = st;
                if (st.email) staffInfoMap[st.email.toLowerCase()] = st;
            });

            const staffKeys = Object.keys(staffDutyCounts).sort();
            if (staffKeys.length > 0) {
                staffKeys.forEach((key) => {
                    const dCount = staffDutyCounts[key];
                    const info = staffInfoMap[key.toLowerCase()] || { name: key };
                    const parsed = splitTitleAndName(info.name);
                    const amount = dCount * 90;
                    invigDutyTally += dCount;
                    invigilatorRows.push({
                        title: parsed.title,
                        name: parsed.name,
                        designation: 'Invigilator',
                        duties: dCount,
                        rate: 90,
                        amount: amount
                    });
                });
            } else {
                // If individual staff tracking is absent, generate consolidated invigilation lines
                invigilatorRows.push({
                    title: '',
                    name: 'Allotted Invigilation Staff (Summary)',
                    designation: 'Invigilator',
                    duties: sumInvigCount,
                    rate: 90,
                    amount: sumInvigAmt
                });
                invigDutyTally = sumInvigCount;
            }

            // Annexure I total (Supervisory + Support + Invigilators)
            const annexureITotal = partBTotalAmt + partCAmt + partEAmt + sumClerkAmt + sumPeonAmt + sumSweeperAmt + sumInvigAmt;

            return {
                officials: officials,
                startDateStr: formatDateSlash(minDate),
                endDateStr: formatDateSlash(maxDate),
                startDateDot: formatDateDot(minDate),
                endDateDot: formatDateDot(maxDate),
                period: officials.period,
                // Part A
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
                // Part B
                totalSessions: totalSessions,
                csAmt: csAmt,
                sasAmt: sasAmt,
                osAmt: osAmt,
                partBTotalAmt: partBTotalAmt,
                partBTotalWords: numberToIndianWords(partBTotalAmt),
                // Part C
                partCAmt: partCAmt,
                partCWords: numberToIndianWords(partCAmt),
                // Part D
                uniqueScribesCount: totalUniqueScribeCount || (sumScribe > 0 ? Math.ceil(sumScribe / 2) : 0),
                scribeDuties: scribeDuties,
                scribeRate: scribeRate,
                partDAmt: partDAmt,
                partDWords: numberToIndianWords(partDAmt),
                // Part E
                partEAmt: partEAmt,
                partEWords: numberToIndianWords(partEAmt),
                // Part F
                grandTotalProformaI: grandTotalProformaI,
                grandTotalProformaIWords: numberToIndianWords(grandTotalProformaI),
                // Annexure I
                invigilatorRows: invigilatorRows,
                annexureITotal: annexureITotal,
                annexureITotalWords: numberToIndianWords(annexureITotal),
                // Proforma II
                proformaIIRows: proformaIIRows,
                totalContingencyCandidates: totalContingencyCandidates,
                totalContingencyAmt: totalContingencyAmt,
                totalContingencyWords: numberToIndianWords(totalContingencyAmt),
                // Consolidated
                consolidatedTotal: consolidatedTotal,
                consolidatedTotalWords: numberToIndianWords(consolidatedTotal),
                advanceReceived: advanceReceived,
                balanceClaim: balanceClaim,
                balanceClaimWords: numberToIndianWords(balanceClaim)
            };
        },

        // --- 3. Multi-Sheet Excel Exporter (SheetJS) ---
        buildWorkbook: function (data) {
            if (!data) data = this.aggregateData();
            if (!data) return null;
            if (typeof XLSX === 'undefined') {
                alert("SheetJS library is not loaded.");
                return null;
            }
            if (!data) data = this.aggregateData();
            if (!data) {
                alert("No student data available to generate Excel.");
                return;
            }

            if (typeof XLSX === 'undefined') {
                alert("SheetJS library is not loaded. Please ensure internet connectivity.");
                return;
            }

            const wb = XLSX.utils.book_new();
            const N = data.partARows.length;
            const S = 10 + N; // Total row in Part A

            // ==========================================
            // SHEET 1: Part A
            // ==========================================
            const wsA_data = [];
            wsA_data.push(["PROFORMA -1"]);
            wsA_data.push(["Theory Examinations  - Remuneration  - Human Resources"]);
            wsA_data.push([`Statement  for the conduct of Calicut University Examinations held at \n${data.officials.collegeName}\nFrom ${data.period}`]);
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
                    { t: 'n', f: `G${rowNum}*90`, v: r.invigAmt },
                    r.clerkCount,
                    { t: 'n', f: `113*INT(F${rowNum}/100) + IF(F${rowNum}-100*INT(F${rowNum}/100) <= 30, 38, IF(F${rowNum}-100*INT(F${rowNum}/100) <= 60, 75, 113))`, v: r.clerkAmt },
                    r.peonCount,
                    { t: 'n', f: `113*INT(F${rowNum}/100) + IF(F${rowNum}-100*INT(F${rowNum}/100) <= 30, 38, IF(F${rowNum}-100*INT(F${rowNum}/100) <= 60, 75, 113))`, v: r.peonAmt },
                    r.sweeperCount,
                    { t: 'n', f: `MAX(35, CEILING(F${rowNum}/100, 1) * 25)`, v: r.sweeperAmt }
                ]);
            });

            // Summary row S
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

            wsA_data.push([]); // blank S+1

            // Row S+2: Total Amount
            const totAmtRow = new Array(14).fill("");
            totAmtRow[1] = "Total Amount ( Column 8+10+12+14)       =";
            totAmtRow[9] = { t: 'n', f: `H${S}+J${S}+L${S}+N${S}`, v: data.partATotalAmt };
            totAmtRow[10] = "/-";
            wsA_data.push(totAmtRow);

            // Row S+3: Words
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

            // Add session flags columns Y and Z
            for (let i = 0; i < N; i++) {
                const rNum = 10 + i;
                const dItem = data.partARows[i];
                XLSX.utils.sheet_add_aoa(wsA, [[
                    { t: 'n', f: `IF(C${rNum}<>"",1,0)`, v: dItem.isFN },
                    { t: 'n', f: `IF(D${rNum}<>"",1,0)`, v: dItem.isAN }
                ]], { origin: `Y${rNum}` });
            }

            XLSX.utils.book_append_sheet(wb, wsA, "Part A");

            // ==========================================
            // SHEET 2: Part B,C
            // ==========================================
            const wsBC_data = [
                [],
                ["PART B"],
                ["Total No. of Sessions:                      ", "", "FN =  ", { t: 'n', f: `'Part A'!Y${S}`, v: data.sumFNSessions }, "AN=  ", { t: 'n', f: `'Part A'!Z${S}`, v: data.sumANSessions }, "Total=", { t: 'n', f: "D3+F3", v: data.totalSessions }],
                ["Sl.No.", "Designation", "Total   No.   of\nSessions", "", "Amount       per\nsession Rs.", "", "Total\nRs."],
                [1, "Chief Superintendent", { t: 'n', f: "$H$3", v: data.totalSessions }, "", 123, "", { t: 'n', f: "C5*E5", v: data.csAmt }],
                [2, "Senior Assistant Superintendent", { t: 'n', f: "$H$3", v: data.totalSessions }, "", 105, "", { t: 'n', f: "C6*E6", v: data.sasAmt }],
                [3, "Office Superintendent", { t: 'n', f: "$H$3", v: data.totalSessions }, "", 90, "", { t: 'n', f: "C7*E7", v: data.osAmt }],
                ["", "Total", "", "", "", "", { t: 'n', f: "SUM(G5:G7)", v: data.partBTotalAmt }],
                [`Rs. ${data.partBTotalAmt}/- ( Rupees ${data.partBTotalWords} only)`],
                ["PART C"],
                ["Designation", "Rate @890/- for odd and\neven semester examination", "Amount\nRs."],
                ["Data Entry Operator", data.officials.dataEntryOperator, 890],
                ["Rs.890/-(Rupees Eight hundred and Ninety only)"]
            ];

            const wsBC = XLSX.utils.aoa_to_sheet(wsBC_data);
            wsBC['!cols'] = [{ wch: 8 }, { wch: 32 }, { wch: 16 }, { wch: 6 }, { wch: 14 }, { wch: 6 }, { wch: 14 }];
            XLSX.utils.book_append_sheet(wb, wsBC, "Part B,C");

            // ==========================================
            // SHEET 3: Part D,E,F
            // ==========================================
            const wsDEF_data = [
                ["PART D"],
                ["Designation", "", "No. of Candidates permitted to\nutilize scribe", "", "Rate", "", "Total No. of Duties performed", "", "Total Amount"],
                ["Amanuensis", "", data.uniqueScribesCount, "", 150, "", { t: 'n', f: `'Part A'!E${S}`, v: data.scribeDuties }, "", { t: 'n', f: "E3*G3", v: data.partDAmt }],
                ["Total", "", "", "", "", "", "", "", { t: 'n', f: "SUM(I3)", v: data.partDAmt }],
                ["* U. O. No.2433/2022/PB dtd.28.11.2022"],
                ["Scribe orders are attached"],
                [],
                ["PART E"],
                ["Designation", "", "", "Rate @1000/- for odd and\neven semester examination", "", "", "", "Amount\nRs."],
                ["Accountant", "", "", data.officials.headAccountant, "", "", "", 1000],
                ["Rs.1000/-(Rupees One Thousand only)"],
                [],
                [],
                ["( Office Seal)            ", "", "", "", "", "", `${data.officials.chiefSupdt}\nChief Superintendent`],
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
                ["( Office Seal)            ", "", "", "", "", "", `${data.officials.chiefSupdt}\nChief Superintendent`]
            ];

            const wsDEF = XLSX.utils.aoa_to_sheet(wsDEF_data);
            wsDEF['!cols'] = [{ wch: 14 }, { wch: 4 }, { wch: 16 }, { wch: 20 }, { wch: 8 }, { wch: 4 }, { wch: 16 }, { wch: 10 }, { wch: 14 }];
            XLSX.utils.book_append_sheet(wb, wsDEF, "Part D,E,F");

            // ==========================================
            // SHEET 4: Annexure I (Acquittance Roll)
            // ==========================================
            const wsAnn1_data = [
                ["ANNEXURE - I"],
                ["Theory Examinations - Remuneration - Human Resources"],
                [`Aquittance for conduct of Calicut University Examinations From ${data.period} at  ${data.officials.collegeName} Centre`],
                ["Sl.\nNo", "Name", "", "Designation", "Amount\nRs.", "Signature"],
                [1, splitTitleAndName(data.officials.chiefSupdt).title, splitTitleAndName(data.officials.chiefSupdt).name, "Chief Supdt.", { t: 'n', f: `'Part B,C'!G5`, v: data.csAmt }, ""],
                [2, splitTitleAndName(data.officials.seniorSupdt).title, splitTitleAndName(data.officials.seniorSupdt).name, "SAS", { t: 'n', f: `'Part B,C'!G6`, v: data.sasAmt }, ""],
                [3, splitTitleAndName(data.officials.officeSupdt).title, splitTitleAndName(data.officials.officeSupdt).name, "Office\nSupdt.", { t: 'n', f: `'Part B,C'!G7`, v: data.osAmt }, ""],
                [4, splitTitleAndName(data.officials.headAccountant).title, splitTitleAndName(data.officials.headAccountant).name, "Head Accountant", 1000, ""],
                [5, splitTitleAndName(data.officials.dataEntryOperator).title, splitTitleAndName(data.officials.dataEntryOperator).name, "Data  Entry\nOperator", 890, ""],
                [6, splitTitleAndName(data.officials.clerk).title, splitTitleAndName(data.officials.clerk).name, "Clerk", { t: 'n', f: `'Part A'!J${S}`, v: data.sumClerkAmt }, ""],
                [7, splitTitleAndName(data.officials.peon).title, splitTitleAndName(data.officials.peon).name, "Office attendant", { t: 'n', f: `'Part A'!L${S}`, v: data.sumPeonAmt }, ""],
                [8, splitTitleAndName(data.officials.sweeper).title, splitTitleAndName(data.officials.sweeper).name, "Sweeper", { t: 'n', f: `'Part A'!N${S}`, v: data.sumSweeperAmt }, ""]
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
                "", "", "( Office Seal)", "", "", `${data.officials.chiefSupdt}\nChief Superintendent`
            ]);

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

            // ==========================================
            // SHEET 5: Proforma II (Contingency)
            // ==========================================
            const wsII_data = [
                ["PROFORMA - II"],
                ["Theory Examinations - Contingent Charges"],
                [`Statement   for  the  conduct   of   Calicut  University  Examinations  From ${data.period} at  ${data.officials.collegeName}  Centre.`],
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
                    { t: 'n', f: `C${rNum}*4`, v: ex.amount }
                ]);
            });

            const totIIRowNum = 5 + K;
            wsII_data.push([
                "", "Total", { t: 'n', f: `SUM(C5:C${totIIRowNum - 1})`, v: data.totalContingencyCandidates }, "", { t: 'n', f: `SUM(E5:E${totIIRowNum - 1})`, v: data.totalContingencyAmt }
            ]);
            wsII_data.push([`Rs.${data.totalContingencyAmt}/- ( Rupees ${data.totalContingencyWords} only)`]);
            wsII_data.push([]);
            wsII_data.push(["( Office Seal)", "", `${data.officials.chiefSupdt}\nChief Superintendent`]);

            const wsII = XLSX.utils.aoa_to_sheet(wsII_data);
            wsII['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
                { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
                { s: { r: totIIRowNum, c: 0 }, e: { r: totIIRowNum, c: 4 } }
            ];
            wsII['!cols'] = [{ wch: 6 }, { wch: 55 }, { wch: 20 }, { wch: 14 }, { wch: 14 }];
            XLSX.utils.book_append_sheet(wb, wsII, "Proforma II");

            // ==========================================
            // SHEET 6: Consolidated
            // ==========================================
            const wsCons_data = [
                [`Consolidated Statement  for the  conduct  of  Calicut  University  Examinations\n From ${data.period} at  ${data.officials.collegeName} Centre`],
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
                ["( Office Seal)            ", "", "", `${data.officials.chiefSupdt}\nChief Superintendent`]
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

            // ==========================================
            // SHEET 7: receipt (Annexure II)
            // ==========================================
            const wsRec_data = [
                [],
                [],
                ["ANNEXURE  - II"],
                ["RECEIPT"],
                [`Received from the Finance Officer, University of Calicut an amount of Rs.${data.totalContingencyAmt}/- (Rupees ${data.totalContingencyWords} only) being the contingent charges @ Rs. 4/- per candidate for the conduct of ${data.period} theory examinations during the period from ${data.startDateStr}  to ${data.endDateStr}.`],
                [],
                ["( Office Seal)            ", "", "", "", "", `${data.officials.chiefSupdt}\nChief Superintendent`]
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

            // ==========================================
            // SHEET 8: certificates
            // ==========================================
            const wsCert_data = [
                [],
                [],
                [`No. ${data.officials.certSeniorSupdtNo}`, "", "", "", "", data.officials.collegeName],
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
                ["", "", "", "", "", "", "", data.officials.principal],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [`No. ${data.officials.certHeadAcctNo}`, "", "", "", "", data.officials.collegeName],
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
                ["", "", "", "", "", "", "", data.officials.principal]
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

        // --- 4. Interactive HTML Printable Preview Generator ---
        renderHTML: function (data, activeTab) {
            if (!data) data = this.aggregateData();
            if (!data) return '<p class="text-red-500 font-bold p-6">No data found for the Regular stream.</p>';

            const currentTab = activeTab || 'all';

            // Common Print Styles
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
                        font-size: 11pt;
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
                    @media print {
                        body { background: #fff !important; }
                        .no-print { display: none !important; }
                        .page-break { page-break-before: always; border-top: none; }
                        .proforma-container { padding: 0 !important; max-width: 100% !important; }
                    }
                </style>
            `;

            // HTML Section: Part A
            const renderPartA = () => `
                <div class="proforma-page">
                    <div class="header-main">
                        <div class="font-bold text-lg">PROFORMA - 1</div>
                        <div class="font-bold text-base">Theory Examinations - Remuneration - Human Resources</div>
                        <div class="text-sm mt-1">Statement for the conduct of Calicut University Examinations held at</div>
                        <div class="font-bold text-base">${data.officials.collegeName}</div>
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
                                    <td class="text-right">${r.invigAmt}</td>
                                    <td class="text-center">${r.clerkCount}</td>
                                    <td class="text-right">${r.clerkAmt}</td>
                                    <td class="text-center">${r.peonCount}</td>
                                    <td class="text-right">${r.peonAmt}</td>
                                    <td class="text-center">${r.sweeperCount}</td>
                                    <td class="text-right">${r.sweeperAmt}</td>
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
                                <td class="text-right">₹123</td>
                                <td class="text-right font-bold">₹${data.csAmt.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                                <td class="text-center">2</td>
                                <td>Senior Assistant Superintendent</td>
                                <td class="text-center">${data.totalSessions}</td>
                                <td class="text-right">₹105</td>
                                <td class="text-right font-bold">₹${data.sasAmt.toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                                <td class="text-center">3</td>
                                <td>Office Superintendent</td>
                                <td class="text-center">${data.totalSessions}</td>
                                <td class="text-right">₹90</td>
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
                                <td>${data.officials.dataEntryOperator} (Rate @890/- for odd & even sem)</td>
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
                                <td>${data.officials.headAccountant} (Rate @1000/- for odd & even sem)</td>
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
                                    <tr style="background: #f3f3f3; font-weight: bold; font-size: 12pt;">
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
                            <div>${data.officials.chiefSupdt}</div>
                            <div>Chief Superintendent</div>
                        </div>
                    </div>
                </div>
            `;

            // HTML Section: Annexure I (Acquittance Roll)
            const renderAnnexureI = () => `
                <div class="proforma-page">
                    <div class="header-main">
                        <div class="font-bold text-lg">ANNEXURE - I</div>
                        <div class="font-bold text-base">Theory Examinations - Remuneration - Human Resources</div>
                        <div class="font-bold text-sm">Acquittance Roll for the conduct of Calicut University Examinations</div>
                        <div class="text-sm font-semibold">From ${data.period} at ${data.officials.collegeName} Centre</div>
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
                                <td>${data.officials.chiefSupdt}</td>
                                <td>Chief Superintendent</td>
                                <td class="text-center">${data.totalSessions} sess</td>
                                <td class="text-right font-bold">₹${data.csAmt.toLocaleString('en-IN')}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="text-center">2</td>
                                <td>${data.officials.seniorSupdt}</td>
                                <td>Senior Assistant Supdt.</td>
                                <td class="text-center">${data.totalSessions} sess</td>
                                <td class="text-right font-bold">₹${data.sasAmt.toLocaleString('en-IN')}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="text-center">3</td>
                                <td>${data.officials.officeSupdt}</td>
                                <td>Office Superintendent</td>
                                <td class="text-center">${data.totalSessions} sess</td>
                                <td class="text-right font-bold">₹${data.osAmt.toLocaleString('en-IN')}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="text-center">4</td>
                                <td>${data.officials.headAccountant}</td>
                                <td>Head Accountant</td>
                                <td class="text-center">-</td>
                                <td class="text-right font-bold">₹${data.partEAmt}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="text-center">5</td>
                                <td>${data.officials.dataEntryOperator}</td>
                                <td>Data Entry Operator</td>
                                <td class="text-center">-</td>
                                <td class="text-right font-bold">₹${data.partCAmt}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="text-center">6</td>
                                <td>${data.officials.clerk}</td>
                                <td>Clerk</td>
                                <td class="text-center">-</td>
                                <td class="text-right font-bold">₹${data.sumClerkAmt.toLocaleString('en-IN')}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="text-center">7</td>
                                <td>${data.officials.peon}</td>
                                <td>Office Attendant / Peon</td>
                                <td class="text-center">-</td>
                                <td class="text-right font-bold">₹${data.sumPeonAmt.toLocaleString('en-IN')}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td class="text-center">8</td>
                                <td>${data.officials.sweeper}</td>
                                <td>Sweeper</td>
                                <td class="text-center">-</td>
                                <td class="text-right font-bold">₹${data.sumSweeperAmt.toLocaleString('en-IN')}</td>
                                <td></td>
                            </tr>
                            ${data.invigilatorRows.map((inv, i) => `
                                <tr>
                                    <td class="text-center">${9 + i}</td>
                                    <td>${inv.title} ${inv.name}</td>
                                    <td>Invigilator</td>
                                    <td class="text-center">${inv.duties}</td>
                                    <td class="text-right font-mono">₹${inv.amount.toLocaleString('en-IN')}</td>
                                    <td></td>
                                </tr>
                            `).join('')}
                            <tr class="font-bold" style="background: #f7f7f7; font-size: 11pt;">
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
                            <div>${data.officials.chiefSupdt}</div>
                            <div>Chief Superintendent</div>
                        </div>
                    </div>
                </div>
            `;

            // HTML Section: Proforma II (Contingency)
            const renderProformaII = () => `
                <div class="proforma-page">
                    <div class="header-main">
                        <div class="font-bold text-lg">PROFORMA - II</div>
                        <div class="font-bold text-base">Theory Examinations - Contingent Charges</div>
                        <div class="text-sm mt-1">Statement for the conduct of Calicut University Examinations</div>
                        <div class="text-sm font-semibold">From ${data.period} at ${data.officials.collegeName} Centre</div>
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
                                    <td class="text-center">@ ₹4/-</td>
                                    <td class="text-right font-mono font-bold">₹${ex.amount.toLocaleString('en-IN')}</td>
                                </tr>
                            `).join('')}
                            <tr class="font-bold" style="background: #f7f7f7; font-size: 11pt;">
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
                            <div>${data.officials.chiefSupdt}</div>
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
                        <div class="text-sm font-semibold">From ${data.period} at ${data.officials.collegeName} Centre</div>
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
                            <tr class="font-bold" style="background: #f7f7f7; font-size: 11pt;">
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
                            <div>${data.officials.chiefSupdt}</div>
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
                            <div>${data.officials.chiefSupdt}</div>
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
                            <div class="font-bold">${data.officials.collegeName}</div>
                            <div>Dated: ............................</div>
                        </div>
                    </div>

                    <div class="text-center font-bold text-base my-4">CERTIFICATE - 1</div>

                    <div class="text-justify leading-relaxed text-sm my-6 p-4 border border-gray-400 bg-gray-50">
                        Certified that the Post of <strong>Senior Superintendent</strong> for whom remuneration is claimed for University Examinations is existing in this college.
                    </div>

                    <div class="flex justify-end mt-12 mb-16">
                        <div class="text-center">
                            <div class="font-bold">${data.officials.principal}</div>
                            <div>Principal</div>
                        </div>
                    </div>

                    <hr class="border-t border-dashed border-gray-500 my-10">

                    <!-- Certificate 2 -->
                    <div class="flex justify-between text-sm mb-6">
                        <div>No. <strong>${data.officials.certHeadAcctNo || '............................'}</strong></div>
                        <div class="text-right">
                            <div class="font-bold">${data.officials.collegeName}</div>
                            <div>Dated: ............................</div>
                        </div>
                    </div>

                    <div class="text-center font-bold text-base my-4">CERTIFICATE - 2</div>

                    <div class="text-justify leading-relaxed text-sm my-6 p-4 border border-gray-400 bg-gray-50">
                        Certified that the Post of <strong>Head Accountant</strong> for whom remuneration is claimed for University Examinations is existing in this college.
                    </div>

                    <div class="flex justify-end mt-12">
                        <div class="text-center">
                            <div class="font-bold">${data.officials.principal}</div>
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
                    <div class="page-break"></div>
                    ${renderAnnexureI()}
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

        // --- 5. Modal Signatories Editor ---
        openOfficialsModal: function (onSaveCallback) {
            const current = this.getOfficials();
            const modalId = 'proforma-officials-modal';
            let existing = document.getElementById(modalId);
            if (existing) existing.remove();

            const modalHTML = `
                <div id="${modalId}" class="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div class="bg-indigo-900 text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 class="font-bold text-lg">Proforma Signatories & College Details</h3>
                                <p class="text-xs text-indigo-200">Configure institutional headers and official designations for Regular stream reports</p>
                            </div>
                            <button onclick="document.getElementById('${modalId}').remove()" class="text-gray-300 hover:text-white text-xl font-bold">&times;</button>
                        </div>
                        <div class="p-6 overflow-y-auto space-y-4 text-sm">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="md:col-span-2">
                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">College Name</label>
                                    <input type="text" id="prof-col-name" value="${current.collegeName}" class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Exam Period (e.g. Sept 2025 to Feb 2026)</label>
                                    <input type="text" id="prof-period" value="${current.period}" class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Principal Name</label>
                                    <input type="text" id="prof-principal" value="${current.principal}" class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Chief Superintendent</label>
                                    <input type="text" id="prof-chief" value="${current.chiefSupdt}" class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Senior Assistant Supdt (SAS)</label>
                                    <input type="text" id="prof-sas" value="${current.seniorSupdt}" class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Office Superintendent (OS)</label>
                                    <input type="text" id="prof-os" value="${current.officeSupdt}" class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Head Accountant</label>
                                    <input type="text" id="prof-acct" value="${current.headAccountant}" class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Data Entry Operator</label>
                                    <input type="text" id="prof-deo" value="${current.dataEntryOperator}" class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Clerk</label>
                                    <input type="text" id="prof-clerk" value="${current.clerk}" class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Office Attendant / Peon</label>
                                    <input type="text" id="prof-peon" value="${current.peon}" class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Sweeper</label>
                                    <input type="text" id="prof-sweeper" value="${current.sweeper}" class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Advance Received (Rs.)</label>
                                    <input type="number" id="prof-advance" value="${current.advanceReceived}" class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Advance Cheque / DD Details</label>
                                    <input type="text" id="prof-advance-details" value="${current.advanceDetails}" class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                </div>
                            </div>
                        </div>
                        <div class="bg-gray-100 px-6 py-3 flex justify-end gap-3 border-t">
                            <button onclick="document.getElementById('${modalId}').remove()" class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-200">Cancel</button>
                            <button id="btn-save-proforma-officials" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold shadow">Save Settings</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);

            document.getElementById('btn-save-proforma-officials').addEventListener('click', () => {
                const updated = {
                    collegeName: document.getElementById('prof-col-name').value.trim(),
                    period: document.getElementById('prof-period').value.trim(),
                    principal: document.getElementById('prof-principal').value.trim(),
                    chiefSupdt: document.getElementById('prof-chief').value.trim(),
                    seniorSupdt: document.getElementById('prof-sas').value.trim(),
                    officeSupdt: document.getElementById('prof-os').value.trim(),
                    headAccountant: document.getElementById('prof-acct').value.trim(),
                    dataEntryOperator: document.getElementById('prof-deo').value.trim(),
                    clerk: document.getElementById('prof-clerk').value.trim(),
                    peon: document.getElementById('prof-peon').value.trim(),
                    sweeper: document.getElementById('prof-sweeper').value.trim(),
                    advanceReceived: Number(document.getElementById('prof-advance').value) || 0,
                    advanceDetails: document.getElementById('prof-advance-details').value.trim()
                };
                UniversityProforma.saveOfficials(updated);
                document.getElementById(modalId).remove();
                if (typeof onSaveCallback === 'function') onSaveCallback(updated);
            });
        },

        // --- 6. Full Interactive Preview Modal ---
        openPreviewModal: function (filteredStudents) {
            const modalId = 'university-proforma-preview-modal';
            let existing = document.getElementById(modalId);
            if (existing) existing.remove();

            let activeTab = 'all';
            let data = this.aggregateData(filteredStudents);

            if (!data) {
                alert("No regular stream students found to generate University Proforma.");
                return;
            }

            const tabs = [
                { id: 'all', label: 'All Documents (Print Package)' },
                { id: 'partA', label: 'Part A (Daily HR)' },
                { id: 'partBC', label: 'Part B & C (Supervisory & DEO)' },
                { id: 'partDEF', label: 'Part D, E, F (Scribes & Summary)' },
                { id: 'annexureI', label: 'Annexure I (Acquittance Roll)' },
                { id: 'proformaII', label: 'Proforma II (Contingency)' },
                { id: 'consolidated', label: 'Consolidated Statement' },
                { id: 'receipt', label: 'Receipt (Annexure II)' },
                { id: 'certificates', label: 'Certificates (1 & 2)' }
            ];

            const modalHTML = `
                <div id="${modalId}" class="fixed inset-0 bg-slate-900/80 z-[9990] flex flex-col p-2 sm:p-6 backdrop-blur-sm animate-fade-in">
                    <div class="bg-white rounded-xl shadow-2xl flex-1 flex flex-col overflow-hidden max-w-6xl w-full mx-auto border border-gray-300">
                        <!-- Top Toolbar -->
                        <div class="bg-gray-900 text-white px-5 py-3 flex flex-wrap justify-between items-center gap-3 shrink-0">
                            <div class="flex items-center gap-3">
                                <span class="text-xl">📋</span>
                                <div>
                                    <h2 class="font-bold text-base leading-tight">Calicut University Proforma Package (Regular Stream)</h2>
                                    <p class="text-xs text-gray-300">${data.officials.collegeName} &bull; ${data.period}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <button id="btn-prof-edit-signatories" class="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 font-semibold transition">
                                    ⚙️ Signatories
                                </button>
                                <button id="btn-prof-export-excel" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-1.5 rounded flex items-center gap-1 font-bold shadow transition">
                                    📊 Download Excel (.xlsx)
                                </button>
                                <button id="btn-prof-print" class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-1.5 rounded flex items-center gap-1 font-bold shadow transition">
                                    🖨️ Print / Save PDF
                                </button>
                                <button onclick="document.getElementById('${modalId}').remove()" class="text-gray-400 hover:text-white text-2xl font-bold ml-2 leading-none">&times;</button>
                            </div>
                        </div>

                        <!-- Tab Bar -->
                        <div class="bg-gray-100 border-b border-gray-300 px-4 pt-2 flex gap-1 overflow-x-auto text-xs shrink-0 select-none">
                            ${tabs.map(t => `
                                <button class="tab-btn px-3 py-2 font-bold rounded-t border-t border-l border-r border-transparent transition-colors ${t.id === activeTab ? 'bg-white text-indigo-900 border-gray-300 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}" data-tab="${t.id}">
                                    ${t.label}
                                </button>
                            `).join('')}
                        </div>

                        <!-- Document Body -->
                        <div id="prof-doc-container" class="flex-1 overflow-y-auto bg-slate-200 p-4 sm:p-8">
                            <div class="bg-white shadow-xl mx-auto rounded">
                                ${this.renderHTML(data, activeTab)}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Wire Tabs
            const tabButtons = document.querySelectorAll(`#${modalId} .tab-btn`);
            const docContainer = document.getElementById('prof-doc-container');

            tabButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    tabButtons.forEach(b => {
                        b.classList.remove('bg-white', 'text-indigo-900', 'border-gray-300', 'shadow-sm');
                        b.classList.add('text-gray-600', 'hover:bg-gray-200');
                    });
                    btn.classList.add('bg-white', 'text-indigo-900', 'border-gray-300', 'shadow-sm');
                    btn.classList.remove('text-gray-600', 'hover:bg-gray-200');

                    activeTab = btn.getAttribute('data-tab');
                    data = UniversityProforma.aggregateData(filteredStudents);
                    docContainer.innerHTML = `<div class="bg-white shadow-xl mx-auto rounded">${UniversityProforma.renderHTML(data, activeTab)}</div>`;
                });
            });

            // Wire Excel Download
            document.getElementById('btn-prof-export-excel').addEventListener('click', () => {
                data = UniversityProforma.aggregateData(filteredStudents);
                UniversityProforma.exportExcel(data);
            });

            // Wire Signatories Modal
            document.getElementById('btn-prof-edit-signatories').addEventListener('click', () => {
                UniversityProforma.openOfficialsModal(() => {
                    data = UniversityProforma.aggregateData(filteredStudents);
                    docContainer.innerHTML = `<div class="bg-white shadow-xl mx-auto rounded">${UniversityProforma.renderHTML(data, activeTab)}</div>`;
                });
            });

            // Wire Print Button
            document.getElementById('btn-prof-print').addEventListener('click', () => {
                data = UniversityProforma.aggregateData(filteredStudents);
                const fullHTML = UniversityProforma.renderHTML(data, 'all');
                if (typeof window.openPdfPreview === 'function') {
                    window.openPdfPreview(fullHTML, `Calicut_University_Proforma_${data.officials.period.replace(/\s+/g, '_')}`);
                } else {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Calicut University Proforma - ${data.officials.period}</title>
                        </head>
                        <body>
                            ${fullHTML}
                            <script>
                                window.onload = function() { window.print(); };
                            <\/script>
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                }
            });
        }
    };

    window.UniversityProforma = UniversityProforma;

})(window);
