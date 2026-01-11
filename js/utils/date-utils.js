// ==========================================
// 📅 DATE & TIME UTILITIES
// ==========================================

/**
 * Parses a date string like "DD.MM.YYYY" or "YYYY-MM-DD" into a Date object.
 * @param {string} dateStr 
 * @returns {Date}
 */
export function parseDateString(dateStr) {
    if (!dateStr) return new Date();
    if (dateStr.includes('.')) {
        const [d, m, y] = dateStr.split('.');
        return new Date(`${y}-${m}-${d}`);
    }
    return new Date(dateStr);
}

/**
 * Compares two session strings for chronological sorting.
 * Format expected: "DD.MM.YYYY | HH:MM AM"
 * @param {string} a 
 * @param {string} b 
 * @returns {number} -1, 0, or 1
 */
export function compareSessionStrings(a, b) {
    // Split "DD.MM.YYYY | HH:MM AM"
    // If separator is missing, treat whole string as date
    const splitA = a.includes('|') ? a.split('|') : [a, ''];
    const splitB = b.includes('|') ? b.split('|') : [b, ''];

    const dateAStr = splitA[0].trim();
    const timeAStr = splitA[1].trim();
    const dateBStr = splitB[0].trim();
    const timeBStr = splitB[1].trim();

    // 1. Compare Dates
    const [dA, mA, yA] = dateAStr.split('.');
    const [dB, mB, yB] = dateBStr.split('.');

    const dateA = new Date(yA, mA - 1, dA);
    const dateB = new Date(yB, mB - 1, dB);

    if (dateA < dateB) return -1;
    if (dateA > dateB) return 1;

    // 2. Compare Times (if dates are equal)
    if (timeAStr && timeBStr) {
        const parseTime = (t) => {
            const [time, mod] = t.split(' ');
            let [h, m] = time.split(':');
            h = parseInt(h);
            if (mod === 'PM' && h !== 12) h += 12;
            if (mod === 'AM' && h === 12) h = 0;
            return h * 60 + parseInt(m);
        };
        return parseTime(timeAStr) - parseTime(timeBStr);
    }

    return 0;
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds.
 * @param {Function} func 
 * @param {number} delay 
 * @returns {Function}
 */
export function debounce(func, delay) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}
