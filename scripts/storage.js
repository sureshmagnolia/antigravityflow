const STORAGE_KEY = "uocExamAppData";

document.addEventListener("DOMContentLoaded", () => {
  loadAppState();
  document.querySelectorAll("input, textarea").forEach(el =>
    el.addEventListener("change", debounce(saveAppState, 400))
  );
});

function saveAppState() {
  const data = {
    examName: document.getElementById("exam-name").value,
    examDate: document.getElementById("exam-date").value,
    rooms: document.getElementById("room-settings").value,
    qpCodes: document.getElementById("qp-codes").value,
    absentees: document.getElementById("absentee-list").value
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  console.log("Settings saved");
}

function loadAppState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  const data = JSON.parse(saved);
  for (const [k,v] of Object.entries(data)) {
    const el = document.getElementById(k.replace(/([A-Z])/g,"-$1").toLowerCase());
    if (el) el.value = v;
  }
}

function debounce(fn, delay) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); };
}
