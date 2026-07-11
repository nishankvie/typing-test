// theme.js
// Light/Dark theme, persisted to localStorage. Applies the theme by setting
// a data-theme attribute on <html>, which style.css keys off of.

const STORAGE_KEY = "typingPractice.theme.v1";

export function getStoredTheme() {
  return localStorage.getItem(STORAGE_KEY) || "light";
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const toggleButtons = document.querySelectorAll("[data-theme-toggle]");
  toggleButtons.forEach((btn) => {
    btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    btn.textContent = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
  });
}

export function setTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function toggleTheme() {
  const current = getStoredTheme();
  setTheme(current === "dark" ? "light" : "dark");
}

// Call once per page on load.
export function initTheme() {
  applyTheme(getStoredTheme());
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", toggleTheme);
  });
}
