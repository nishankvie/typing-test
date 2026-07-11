// liveStats.js
// Drives the "Live Statistics" panel while a test is running. Reads state
// through a callback (no globals) and re-computes derived numbers every
// second using the same word-diff logic as the final results, so what the
// user sees live is consistent with the saved history record.

import { splitWords } from "./stats.js";

/**
 * @param {Function} getState - returns { originalText, typedText, keystrokes, elapsedSeconds }
 * @param {Function} onUpdate - called every tick with the computed live stats
 * @returns {Function} stop function
 */
export function startLiveStats(getState, onUpdate) {
  function tick() {
    const { originalText, typedText, keystrokes, elapsedSeconds } = getState();
    const minutes = Math.max(elapsedSeconds, 1) / 60;

    const originalWords = splitWords(originalText);
    const typedWords = splitWords(typedText);

    let correct = 0;
    let mistakes = 0;
    for (let i = 0; i < typedWords.length; i++) {
      if (typedWords[i] === originalWords[i]) correct++;
      else mistakes++;
    }

    const accuracy = typedWords.length > 0 ? Math.round((correct / typedWords.length) * 1000) / 10 : 100;
    const strokeSpeed = Math.round(((keystrokes / 5) / minutes) * 10) / 10;

    onUpdate({
      accuracy,
      strokeSpeed,
      typedWords: typedWords.length,
      keystrokes,
      mistakes
    });
  }

  tick();
  const intervalId = setInterval(tick, 1000);
  return () => clearInterval(intervalId);
}
