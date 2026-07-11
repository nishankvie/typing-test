// testEngine.js
// Orchestrates a single typing test: paragraph selection, timer, keystroke
// tracking, and handing off to stats.js / history.js at submit time. Built
// as a small state machine so new modes/durations only mean new config,
// not new engine logic (requirement 20: "Future Ready").

import { getRandomParagraph, getParagraphByIndex } from "./paragraphs.js";
import { computeTestStats } from "./stats.js";
import { addHistoryRecord } from "./history.js";

const STATUS = { IDLE: "idle", RUNNING: "running", FINISHED: "finished" };

export function createTypingTest({ language, durationSeconds, pageName, paragraphIndex }) {
  let status = STATUS.IDLE;
  let originalText =
    paragraphIndex === null || paragraphIndex === undefined
      ? getRandomParagraph(language)
      : getParagraphByIndex(language, paragraphIndex);
  let typedText = "";
  let keystrokes = 0;
  let startTime = null;
  let endTime = null;
  let timerId = null;
  let remainingSeconds = durationSeconds;

  const listeners = { tick: [], finish: [] };

  function on(event, handler) {
    listeners[event].push(handler);
    return () => {
      listeners[event] = listeners[event].filter((h) => h !== handler);
    };
  }

  function emit(event, payload) {
    listeners[event].forEach((h) => h(payload));
  }

  function start() {
    if (status !== STATUS.IDLE) return;
    status = STATUS.RUNNING;
    startTime = Date.now();
    remainingSeconds = durationSeconds;
    timerId = setInterval(() => {
      remainingSeconds -= 1;
      emit("tick", { remainingSeconds });
      if (remainingSeconds <= 0) {
        finish();
      }
    }, 1000);
  }

  function recordKeystroke() {
    if (status === STATUS.RUNNING) keystrokes += 1;
  }

  function updateTypedText(value) {
    typedText = value;
  }

  function getElapsedSeconds() {
    if (!startTime) return 0;
    const end = endTime || Date.now();
    return Math.max(1, Math.round((end - startTime) / 1000));
  }

  function finish() {
    if (status !== STATUS.RUNNING) return null;
    status = STATUS.FINISHED;
    endTime = Date.now();
    clearInterval(timerId);

    const actualDuration = getElapsedSeconds();
    const stats = computeTestStats({
      originalText,
      typedText,
      durationSeconds: actualDuration,
      totalKeystrokes: keystrokes
    });

    const now = new Date();
    const record = {
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      pageName: pageName || "Typing Test",
      durationSeconds: actualDuration,
      typingMode: `${language === "hindi" ? "Hindi" : "English"} - ${Math.round(durationSeconds / 60)} Min`,
      language,
      correctWords: stats.correctWords,
      missingWords: stats.missingWords,
      wrongWords: stats.wrongWords,
      extraWords: stats.extraWords,
      mistakes: stats.mistakes,
      accuracy: stats.accuracy,
      strokeSpeed: stats.strokeSpeed,
      spaceSpeed: stats.spaceSpeed,
      dsssbSpeed: stats.dsssbSpeed,
      delhiPoliceSpeed: stats.delhiPoliceSpeed,
      totalWordsTyped: stats.totalWordsTyped,
      totalKeystrokes: keystrokes,
      originalText,
      typedText
    };

    const saved = addHistoryRecord(record);
    emit("finish", { stats, record: saved });
    return { stats, record: saved };
  }

  function cancel() {
    if (timerId) clearInterval(timerId);
    status = STATUS.IDLE;
  }

  return {
    on,
    start,
    finish,
    cancel,
    recordKeystroke,
    updateTypedText,
    getOriginalText: () => originalText,
    getTypedText: () => typedText,
    getKeystrokes: () => keystrokes,
    getElapsedSeconds,
    getRemainingSeconds: () => remainingSeconds,
    isRunning: () => status === STATUS.RUNNING,
    isFinished: () => status === STATUS.FINISHED
  };
}
