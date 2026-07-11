// testPage.js - Typing Test page controller. Wires together testEngine,
// liveStats, errorReview, shortcuts and theme for the test.html page.
import { initTheme } from "./theme.js";
import { createTypingTest } from "./testEngine.js";
import { startLiveStats } from "./liveStats.js";
import { renderErrorReview } from "./errorReview.js";
import { registerShortcuts, registerUnsavedWarning, toggleFullscreen } from "./shortcuts.js";
import { splitWords } from "./stats.js";
import { renderTypingParagraph, updateTypingHighlight } from "./liveHighlight.js";
import { readLaunchParams } from "./testLauncher.js";

initTheme();

const languageSelect = document.getElementById("language-select");
const durationSelect = document.getElementById("duration-select");
const startBtn = document.getElementById("start-btn");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const newTestBtn = document.getElementById("new-test-btn");
const timerDisplay = document.getElementById("timer-display");
const modeReadout = document.getElementById("mode-readout");
const paragraphDisplay = document.getElementById("paragraph-display");
const typingArea = document.getElementById("typing-area");
const resultsSection = document.getElementById("results-section");
const resultsGrid = document.getElementById("results-grid");
const errorReviewEl = document.getElementById("error-review");
const setupBar = document.getElementById("setup-bar");

const LANGUAGE_LABELS = { english: "English", hindi: "Hindi" };

let engine = null;
let stopLiveStats = null;
let originalWords = [];
let wordEls = [];
let launchParagraphIndex = null;

const liveEls = {
  accuracy: document.getElementById("live-accuracy"),
  strokeSpeed: document.getElementById("live-stroke-speed"),
  words: document.getElementById("live-words"),
  keystrokes: document.getElementById("live-keystrokes"),
  mistakes: document.getElementById("live-mistakes")
};

function formatTimer(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.max(0, totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function resetToSetup() {
  document.body.classList.remove("test-locked");
  setupBar.querySelectorAll("select, button").forEach((el) => (el.disabled = false));
  modeReadout.hidden = true;
  typingArea.disabled = true;
  typingArea.value = "";
  submitBtn.disabled = true;
  cancelBtn.disabled = true;
  timerDisplay.textContent = formatTimer(Number(durationSelect.value));
  paragraphDisplay.innerHTML = "";
  paragraphDisplay.textContent = "Click “Start Test” to load a paragraph.";
  originalWords = [];
  wordEls = [];
  resultsSection.hidden = true;
  Object.values(liveEls).forEach((el) => (el.textContent = "0"));
}

function startTest() {
  const language = languageSelect.value;
  const durationSeconds = Number(durationSelect.value);

  // Only honor a specific passage for the launch that requested it - any
  // later "Start Another Test" click on this page goes back to random.
  const paragraphIndex = launchParagraphIndex;
  launchParagraphIndex = null;

  engine = createTypingTest({ language, durationSeconds, pageName: "Typing Test", paragraphIndex });

  document.body.classList.add("test-locked");
  languageSelect.disabled = true;
  durationSelect.disabled = true;
  startBtn.disabled = true;
  modeReadout.hidden = false;
  modeReadout.textContent = `${LANGUAGE_LABELS[language] || language} · ${Math.round(durationSeconds / 60)} Min`;
  typingArea.disabled = false;
  typingArea.value = "";
  submitBtn.disabled = false;
  cancelBtn.disabled = false;
  resultsSection.hidden = true;

  originalWords = splitWords(engine.getOriginalText());
  wordEls = renderTypingParagraph(paragraphDisplay, originalWords);
  timerDisplay.textContent = formatTimer(durationSeconds);

  engine.on("tick", ({ remainingSeconds }) => {
    timerDisplay.textContent = formatTimer(remainingSeconds);
  });
  engine.on("finish", ({ stats }) => showResults(stats));

  engine.start();

  // Requirement 11: Auto Focus - no mouse click required to start typing.
  typingArea.focus();

  stopLiveStats = startLiveStats(
    () => ({
      originalText: engine.getOriginalText(),
      typedText: engine.getTypedText(),
      keystrokes: engine.getKeystrokes(),
      elapsedSeconds: engine.getElapsedSeconds()
    }),
    (live) => {
      liveEls.accuracy.textContent = `${live.accuracy}%`;
      liveEls.strokeSpeed.textContent = live.strokeSpeed;
      liveEls.words.textContent = live.typedWords;
      liveEls.keystrokes.textContent = live.keystrokes;
      liveEls.mistakes.textContent = live.mistakes;
    }
  );
}

function showResults(stats) {
  if (stopLiveStats) stopLiveStats();
  document.body.classList.remove("test-locked");
  typingArea.disabled = true;
  submitBtn.disabled = true;
  cancelBtn.disabled = true;

  resultsGrid.innerHTML = "";
  const cards = [
    ["Correct Words", stats.correctWords],
    ["Missing Words", stats.missingWords],
    ["Wrong Words", stats.wrongWords],
    ["Extra Words", stats.extraWords],
    ["Mistakes", stats.mistakes],
    ["Accuracy", `${stats.accuracy}%`],
    ["Stroke Speed", stats.strokeSpeed],
    ["Space Speed", stats.spaceSpeed],
    ["DSSSB Speed", stats.dsssbSpeed],
    ["Delhi Police Speed", stats.delhiPoliceSpeed]
  ];
  cards.forEach(([label, value]) => {
    const div = document.createElement("div");
    div.className = "card stat-card";
    div.innerHTML = `<div class="stat-value">${value}</div><div class="stat-label">${label}</div>`;
    resultsGrid.appendChild(div);
  });

  renderErrorReview(errorReviewEl, stats.diff);
  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function submitTest() {
  if (!engine || !engine.isRunning()) return;
  engine.finish();
}

function cancelTest({ skipConfirm = false } = {}) {
  if (!engine || !engine.isRunning()) return;
  if (!skipConfirm && !confirm("Cancel this test? Your progress will not be saved.")) return;
  if (stopLiveStats) stopLiveStats();
  engine.cancel();
  resetToSetup();
}

startBtn.addEventListener("click", startTest);
submitBtn.addEventListener("click", submitTest);
cancelBtn.addEventListener("click", () => cancelTest());
fullscreenBtn.addEventListener("click", () => {
  if (!toggleFullscreen()) alert("Fullscreen is not supported in this browser.");
});
newTestBtn.addEventListener("click", resetToSetup);
durationSelect.addEventListener("change", () => {
  timerDisplay.textContent = formatTimer(Number(durationSelect.value));
});

typingArea.addEventListener("input", (e) => {
  if (!engine) return;
  engine.updateTypedText(e.target.value);
  updateTypingHighlight(paragraphDisplay, wordEls, originalWords, e.target.value);
});
typingArea.addEventListener("keydown", (e) => {
  if (engine && engine.isRunning() && e.key.length === 1) engine.recordKeystroke();
  if (engine && engine.isRunning() && (e.key === "Backspace" || e.key === " " || e.key === "Enter")) {
    engine.recordKeystroke();
  }
});

registerShortcuts({
  onSubmit: submitTest,
  onCancel: () => cancelTest(),
  onFullscreen: () => toggleFullscreen()
});

registerUnsavedWarning(() => engine !== null && engine.isRunning());

// Confirmation before navigating away mid-test (requirement 14).
document.querySelectorAll(".nav-links a, .brand").forEach((link) => {
  link.addEventListener("click", (e) => {
    if (engine && engine.isRunning()) {
      if (!confirm("A test is currently running. Leave this page? Your progress will not be saved.")) {
        e.preventDefault();
      }
    }
  });
});

function applyLaunchParams() {
  const { language, duration, autostart, paragraphIndex } = readLaunchParams();
  if (language && [...languageSelect.options].some((o) => o.value === language)) {
    languageSelect.value = language;
  }
  if (duration && [...durationSelect.options].some((o) => o.value === duration)) {
    durationSelect.value = duration;
  }
  launchParagraphIndex = Number.isInteger(paragraphIndex) ? paragraphIndex : null;
  return autostart;
}

const shouldAutostart = applyLaunchParams();
resetToSetup();
if (shouldAutostart) startTest();
