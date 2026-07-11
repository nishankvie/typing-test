// testLauncher.js
// Lets the user pick a language + duration + specific passage on the Home
// page and jump straight into a running test, instead of having to
// reconfigure it again on the Typing Test page.
import { getParagraphCount } from "./paragraphs.js";

export function initTestLauncher({ languageSelector, durationSelector, passageSelector, buttonSelector }) {
  const languageSelect = document.querySelector(languageSelector);
  const durationSelect = document.querySelector(durationSelector);
  const passageSelect = document.querySelector(passageSelector);
  const button = document.querySelector(buttonSelector);
  if (!languageSelect || !durationSelect || !passageSelect || !button) return;

  function populatePassageOptions() {
    const count = getParagraphCount(languageSelect.value);
    passageSelect.innerHTML = "";
    passageSelect.appendChild(new Option("Random", ""));
    for (let i = 0; i < count; i++) {
      passageSelect.appendChild(new Option(`Passage ${i + 1}`, String(i)));
    }
  }

  populatePassageOptions();
  languageSelect.addEventListener("change", populatePassageOptions);

  button.addEventListener("click", () => {
    const params = new URLSearchParams({
      language: languageSelect.value,
      duration: durationSelect.value,
      autostart: "1"
    });
    if (passageSelect.value !== "") params.set("paragraphIndex", passageSelect.value);
    window.location.href = `test.html?${params.toString()}`;
  });
}

/**
 * Reads language/duration/autostart/paragraphIndex out of the current
 * page's URL. Used by the Typing Test page to honor a launch request from
 * the Home page.
 */
export function readLaunchParams() {
  const params = new URLSearchParams(window.location.search);
  const paragraphIndexRaw = params.get("paragraphIndex");
  return {
    language: params.get("language"),
    duration: params.get("duration"),
    autostart: params.get("autostart") === "1",
    paragraphIndex: paragraphIndexRaw === null ? null : Number(paragraphIndexRaw)
  };
}
