// storage.js — Manages app data persistence
const STORAGE_KEY = "uocExamAppData";

document.addEventListener("DOMContentLoaded", () => {
  loadAppState();

  // Auto-save when user changes any input
  document.querySelectorAll("input, textarea, select").forEach((el) => {
    el.addEventListener("change", debounce(saveAppState, 500));
  });
});

/* ---- Save all form data ---- */
function saveAppState() {
  const data = {
    examName: document.getElementById("exam-name")?.value || "",
    examDate: document.getElementById("exam-date")?.value || "",
    rooms: document.getElementById("room-settings")?.value || "",
    qpCodes: document.getElementById("qp-codes")?.value || "",
    absentees: document.getElementById("absentee-list")?.value || ""
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log("✅ Data saved to localStorage");
  } catch (err) {
    console.error("❌ Failed to save data:", err);
  }
}

/* ---- Load stored data ---- */
function loadAppState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const data = JSON.parse(saved);

    if (data.examName) document.getElementById("exam-name").value = data.examName;
    if (data.examDate) document.getElementById("exam-date").value = data.examDate;
    if (data.rooms) document.getElementById("room-settings").value = data.rooms;
    if (data.qpCodes) document.getElementById("qp-codes").value = data.qpCodes;
    if (data.absentees) document.getElementById("absentee-list").value = data.absentees;

    console.log("✅ Data restored from localStorage");
  } catch (err) {
    console.warn("⚠️ Could not parse localStorage data:", err);
    localStorage.removeItem(STORAGE_KEY);
  }
}

/* ---- Debounce Helper ---- */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
