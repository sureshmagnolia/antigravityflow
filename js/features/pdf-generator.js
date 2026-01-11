// ==========================================
// 📄 PDF GENERATOR: Invigilation List
// ==========================================

import { STORAGE_KEYS } from '../core/constants.js';

export function downloadInvigilationListPDF() {
    const sessionSelect = document.getElementById('allotment-session-select');
    const sessionKey = sessionSelect?.value;

    if (!sessionKey) return alert("Please select a session first.");
    const [date, time] = sessionKey.split(' | ');

    // 1. Data Sources
    // Note: PDF logic uses specific keys that might differ slightly from global configs, preserving exact keys here.
    const invigMap = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVIGILATOR_MAPPING) || '{}');
    const currentSessionInvigs = invigMap[sessionKey] || {};
    const roomConfig = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROOM_CONFIG) || '{}');
    const staffData = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF_DATA) || '[]');
    // Note: 'examData_v2' is used here specifically
    const allStudentData = JSON.parse(localStorage.getItem(STORAGE_KEYS.BASE_DATA) || '[]'); // Assuming BASE_DATA is 'examBaseData', but code used 'examData_v2'??
    // WAIT: app.js L346 says BASE_DATA_KEY = 'examBaseData'. 
    // PDF function L16808 used 'examData_v2'. 
    // If these are different, we must use the literal.
    // Let's use the literal to be safe if we aren't sure.

    const realStudentData = JSON.parse(localStorage.getItem('examData_v2') || '[]');


    // Scribe Data
    // Code used 'examScribeAllotmentV2', constants has 'examScribeAllotment'
    const allScribeAllotments = JSON.parse(localStorage.getItem('examScribeAllotmentV2') || '{}');
    const sessionScribeMap = allScribeAllotments[sessionKey] || {};

    // 2. Room List Builder
    const roomList = [];

    // Check if currentSessionAllotment is available globally (it might not be in module)
    // In app.js it was a global. We should probably fetch it from storage or recalculate.
    // However, for PDF generation, usually reading from 'examRoomAllotment' (old key?) 
    // L16816 checks `currentSessionAllotment`.
    // If we move this, we lose access to `currentSessionAllotment` runtime variable.
    // We must rely on the Fallback: L16819 `localStorage.getItem('examAllotmentData')`.
    // BUT L16819 uses 'examAllotmentData', whereas STORAGE_KEYS.ROOM_ALLOTMENT is 'examRoomAllotment'.
    // This implies the PDF function supports legacy data formats.

    // Let's try to get the allotment from the standard key first if available.
    const allAllotments = JSON.parse(localStorage.getItem('examAllotmentData') || '{}');
    const sessionAllotment = allAllotments[sessionKey];

    if (sessionAllotment && Array.isArray(sessionAllotment)) {
        sessionAllotment.forEach(r => roomList.push({ name: r.roomName, stream: r.stream || "Regular", isScribe: false }));
    } else {
        const mappedRooms = Object.keys(currentSessionInvigs);
        if (mappedRooms.length > 0) {
            mappedRooms.forEach(rName => roomList.push({ name: rName, stream: "Regular", isScribe: false }));
        }
    }

    // Always add Scribe Rooms
    Object.values(sessionScribeMap).forEach(rName => {
        if (!roomList.find(r => r.name === rName)) {
            roomList.push({ name: rName, stream: "Regular", isScribe: true });
        }
    });

    if (roomList.length === 0) {
        console.warn("PDF: No regular rooms found. Check if session has allotment.");
    }

    // 3. Preparation & Sorting
    const streamCounts = {};
    const sessionStudents = realStudentData.filter(s => s.Date === date && s.Time === time);
    let scribeRegNos = new Set();
    const globalScribeList = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCRIBE_LIST) || '[]');
    if (Array.isArray(globalScribeList)) scribeRegNos = new Set(globalScribeList.map(s => s.regNo));

    sessionStudents.forEach(s => {
        const sStream = s.Stream || "Regular";
        if (!streamCounts[sStream]) streamCounts[sStream] = { candidates: 0, scribes: 0 };
        scribeRegNos.has(s['Register Number']) ? streamCounts[sStream].scribes++ : streamCounts[sStream].candidates++;
    });

    const streams = {};
    roomList.forEach(r => {
        const s = r.stream || "Regular";
        if (!streams[s]) streams[s] = [];
        streams[s].push(r);
    });

    // 4. Generate Rows
    const bodyRows = [];
    let srNo = 1;
    const truncate = (str, n) => {
        if (!str) return "";
        const w = str.split(' ');
        return (w.length > n) ? w.slice(0, n).join(' ') + '...' : str;
    };

    const sortedStreamNames = Object.keys(streams).sort();
    if (sortedStreamNames.includes("Regular")) {
        sortedStreamNames.splice(sortedStreamNames.indexOf("Regular"), 1);
        sortedStreamNames.unshift("Regular");
    }

    sortedStreamNames.forEach(streamName => {
        const list = streams[streamName];
        list.sort((a, b) => a.name.localeCompare(b.name));

        // STREAM HEADER ROW
        bodyRows.push([{
            content: (streamName === "Regular" ? "REGULAR STREAM" : streamName.toUpperCase()),
            colSpan: 9,
            styles: { fontStyle: 'bold', halign: 'left', textColor: 0 }
        }]);

        list.forEach(room => {
            const invigName = currentSessionInvigs[room.name] || "-";
            const staff = staffData.find(s => s.name === invigName || s.email === invigName) || {};

            let invigCell = invigName;
            if (invigName !== "-") {
                const meta = [];
                if (staff.dept) meta.push(staff.dept);
                if (staff.phone) meta.push(staff.phone);
                if (meta.length > 0) invigCell += `\n${meta.join(' | ')}`;
            }
            let loc = roomConfig[room.name]?.location || room.name;
            loc = truncate(loc, 5);
            if (room.isScribe) loc += " (Scribe)";

            bodyRows.push([
                srNo++,
                loc,
                { content: invigCell, styles: { fontStyle: 'bold' } },
                "", "", "", "", "", "", ""
            ]);
        });

        // Empty Rows logic
        const stats = streamCounts[streamName] || { candidates: 0, scribes: 0 };
        const totalReq = Math.ceil(stats.candidates / 30) + stats.scribes;
        const emptyRowsNeeded = Math.max(2, totalReq - list.length);
        for (let i = 0; i < emptyRowsNeeded; i++) {
            bodyRows.push([{ content: "-", styles: { halign: 'center', textColor: [200, 200, 200] } }, "", "", "", "", "", "", "", ""]);
        }
    });

    // 5. Reserves
    const invigSlots = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVIGILATION_SLOTS) || '{}');
    const slot = invigSlots[sessionKey];
    if (slot && slot.assigned && slot.assigned.length > 0) {
        const assignedNames = new Set(Object.values(currentSessionInvigs));
        const reserves = [];
        slot.assigned.forEach(email => {
            const staff = staffData.find(s => s.email === email);
            if (staff && !assignedNames.has(staff.name)) reserves.push(staff);
        });
        if (reserves.length > 0) {
            bodyRows.push([{
                content: "RESERVES / RELIEVERS", colSpan: 9,
                styles: { textColor: [154, 52, 18], fontStyle: 'bold', halign: 'center' }
            }]);
            reserves.forEach((staff, idx) => {
                bodyRows.push([
                    { content: idx + 1, halign: 'center' },
                    { content: staff.name, colSpan: 3, styles: { fontStyle: 'bold' } },
                    { content: staff.dept || "", colSpan: 3 },
                    { content: staff.phone || "", colSpan: 2 }
                ]);
            });
        }
    }

    // 6. Final PDF
    if (!window.jspdf) return alert("PDF Library not loaded.");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text(localStorage.getItem(STORAGE_KEYS.COLLEGE_NAME) || "GOVERNMENT VICTORIA COLLEGE", 105, 15, { align: "center" });
    doc.setFontSize(11);
    doc.text("Invigilation Duty List", 105, 22, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Date: ${date}  |  Session: ${time}`, 105, 28, { align: "center" });

    doc.autoTable({
        head: [['Sl', 'Hall / Location', 'Invigilator', 'RNBB', 'Asgd', 'Used', 'Retd', 'Remarks', 'Sign']],
        body: bodyRows,
        startY: 32,
        theme: 'grid',
        headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.1, lineColor: 0, fontStyle: 'bold' },
        styles: { fontSize: 9, lineColor: 0, lineWidth: 0.1, cellPadding: 2, textColor: 0, valign: 'middle' },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 47 },
            2: { cellWidth: 38 },
            3: { cellWidth: 15 },
            4: { cellWidth: 11 },
            5: { cellWidth: 11 },
            6: { cellWidth: 11 },
            7: { cellWidth: 19 },
            8: { cellWidth: 'auto' }
        }
    });

    // --- Footer with Signatories ---
    let finalY = doc.lastAutoTable.finalY || 40;
    if (finalY > 250) { doc.addPage(); finalY = 20; }

    // 1. Fetch Names Logic (Internal Helper)
    const getOfficialName = (role) => {
        const q = role.toLowerCase().replace('.', '').replace('assistant', 'asst');
        const staff = staffData.find(s => {
            if (s.roleHistory && s.roleHistory.some(r => {
                const rName = r.role.toLowerCase().replace('.', '').replace('assistant', 'asst');
                const [d, m, y] = date.split('.');
                const target = new Date(y, m - 1, d); target.setHours(12, 0, 0, 0);
                const start = new Date(r.start); start.setHours(0, 0, 0, 0);
                const end = new Date(r.end); end.setHours(23, 59, 59, 999);
                return rName.includes(q) && target >= start && target <= end;
            })) return true;
            return ((s.role && s.role.toLowerCase().includes(q)) || (s.Designation && s.Designation.toLowerCase().includes(q)));
        });
        return staff ? staff.name : "";
    };

    const seniorName = getOfficialName("Senior Assistant");
    const chiefName = getOfficialName("Chief Superintendent");

    const yPos = finalY + 30;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");

    // Left Sign
    if (seniorName) doc.text(seniorName.toUpperCase(), 40, yPos, { align: "center" });
    else doc.line(20, yPos, 60, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Senior Assistant Superintendent", 40, yPos + 5, { align: "center" });

    // Right Sign
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);

    if (chiefName) doc.text(chiefName.toUpperCase(), 170, yPos, { align: "center" });
    else doc.line(150, yPos, 190, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Chief Superintendent", 170, yPos + 5, { align: "center" });

    doc.save(`Invigilation_List_${date}.pdf`);
}

// ==========================================
// 📄 PLACEHOLDER EXPORTS (To Be Implemented)
// ==========================================

export function generateSeatingPDF() {
    alert("This feature is under development. Please use the Reports tab for now.");
}

export function downloadRoomwiseAttendancePDF() {
    alert("This feature is under development.");
}

export function downloadConsolidatedAttendancePDF() {
    alert("This feature is under development.");
}

export function downloadInvigilationOrderPDF() {
    alert("This feature is under development.");
}

export function downloadSeatingPlanPDF() {
    alert("This feature is under development.");
}

export function downloadSeatingPlanPDF_Alt() {
    alert("This feature is under development.");
}

export function downloadRoomLabelsPDF() {
    alert("This feature is under development.");
}

export function downloadMalpracticeFormPDF() {
    alert("This feature is under development.");
}

export function downloadRelievingOrderPDF() {
    alert("This feature is under development.");
}

export function downloadMessBillPDF() {
    alert("This feature is under development.");
}
