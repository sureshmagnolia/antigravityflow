// scripts/navigation.js
document.addEventListener("DOMContentLoaded", () => {
  const navButtons = document.querySelectorAll(".nav-button");
  const views = document.querySelectorAll(".view-section");

  function activate(targetId) {
    navButtons.forEach(b => b.classList.remove("nav-button-active"));
    views.forEach(v => v.classList.remove("active"));
    const btn = Array.from(navButtons).find(b => b.dataset.target === targetId);
    if (btn) btn.classList.add("nav-button-active");
    const view = document.getElementById(targetId);
    if (view) view.classList.add("active");

    try { localStorage.setItem("uocExam_activeTab", targetId); } catch (e) { console.warn(e); }
  }

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => activate(btn.dataset.target));
  });

  const last = localStorage.getItem("uocExam_activeTab");
  if (last && document.getElementById(last)) {
    activate(last);
  } else {
    const first = navButtons[0];
    if (first) activate(first.dataset.target);
  }
});
