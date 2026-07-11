// stats.js
// Pure functions only. Nothing here touches localStorage, the DOM, or a
// timer directly - every value is derived from arguments passed in, so
// dashboard/personal-best numbers are always computed fresh from whatever
// history currently exists (requirement 18: "nothing should be hardcoded").

/**
 * Splits text into non-empty, whitespace-separated words. Used consistently
 * for both the original paragraph and the user's typed text so word counts
 * and word-by-word comparison line up.
 */
export function splitWords(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean);
}

/**
 * Compares the original paragraph against what the user typed, word by
 * word, at matching positions. This is the standard approach used by
 * paragraph-based typing tests (no re-ordering / fuzzy alignment):
 *   - position exists in both and matches      -> correct
 *   - position exists in both but differs       -> wrong
 *   - position only exists in the original       -> missing (not typed)
 *   - position only exists in what was typed     -> extra (typed beyond original)
 * Returns the per-word classification plus aggregate counts, used by both
 * the results screen (errorReview.js) and the speed/accuracy formulas below.
 */
export function diffWords(originalText, typedText) {
  const originalWords = splitWords(originalText);
  const typedWords = splitWords(typedText);
  const length = Math.max(originalWords.length, typedWords.length);
  const words = [];

  for (let i = 0; i < length; i++) {
    const original = originalWords[i];
    const typed = typedWords[i];
    if (original !== undefined && typed !== undefined) {
      words.push({ index: i, original, typed, status: original === typed ? "correct" : "wrong" });
    } else if (original !== undefined) {
      words.push({ index: i, original, typed: null, status: "missing" });
    } else {
      words.push({ index: i, original: null, typed, status: "extra" });
    }
  }

  const counts = words.reduce(
    (acc, w) => {
      acc[w.status]++;
      return acc;
    },
    { correct: 0, wrong: 0, missing: 0, extra: 0 }
  );

  return {
    words,
    originalWords,
    typedWords,
    correctWords: counts.correct,
    wrongWords: counts.wrong,
    missingWords: counts.missing,
    extraWords: counts.extra
  };
}

/**
 * Computes every metric stored on a single history record from the raw
 * inputs captured while the test ran.
 *
 * Speed formulas (approximated for personal practice - exact official
 * formulas vary slightly by exam notification, but these follow the
 * commonly published methods used by SSC/DSSSB/Delhi Police typing tests):
 *
 * 1. Stroke Speed (Key Depression / Stroke Method):
 *      strokeSpeed = (totalKeystrokes / 5) / timeInMinutes
 *    Every 5 key depressions is conventionally treated as one "word",
 *    regardless of the actual words typed - this rewards raw key speed.
 *
 * 2. Space Speed (Word / Space-bar Method):
 *      spaceSpeed = totalWordsTyped / timeInMinutes
 *    Words are counted the way the space bar naturally separates them
 *    (i.e. splitWords(typedText).length), not divided by 5.
 *
 * 3. DSSSB Net Speed:
 *      grossSpeed = spaceSpeed (word method, as used in DSSSB notifications)
 *      dsssbSpeed = max(0, grossSpeed - (mistakes / timeInMinutes))
 *    Net speed = gross speed minus a per-minute penalty for mistakes.
 *
 * 4. Delhi Police Net Speed:
 *      delhiPoliceSpeed = max(0, (correctWords - wrongWords) / timeInMinutes)
 *    Delhi Police recruitment typing guidelines deduct each wrong word
 *    directly from the correct word count before dividing by time.
 *
 * Accuracy:
 *      accuracy = (correctWords / totalWordsTyped) * 100
 *    where totalWordsTyped = correct + wrong + extra (words the candidate
 *    actually attempted; words never reached are "missing", not inaccurate).
 */
export function computeTestStats({ originalText, typedText, durationSeconds, totalKeystrokes }) {
  const timeInMinutes = Math.max(durationSeconds, 1) / 60;
  const diff = diffWords(originalText, typedText);
  const { correctWords, wrongWords, missingWords, extraWords, typedWords } = diff;

  const totalWordsTyped = typedWords.length;
  const totalCharsTyped = (typedText || "").length;
  const mistakes = wrongWords + extraWords;

  const strokeSpeed = round1((totalKeystrokes / 5) / timeInMinutes);
  const spaceSpeed = round1(totalWordsTyped / timeInMinutes);
  const grossSpeed = spaceSpeed;
  const dsssbSpeed = round1(Math.max(0, grossSpeed - mistakes / timeInMinutes));
  const delhiPoliceSpeed = round1(Math.max(0, (correctWords - wrongWords) / timeInMinutes));
  const accuracy = totalWordsTyped > 0 ? round1((correctWords / totalWordsTyped) * 100) : 0;

  return {
    diff,
    correctWords,
    wrongWords,
    missingWords,
    extraWords,
    mistakes,
    accuracy,
    strokeSpeed,
    spaceSpeed,
    dsssbSpeed,
    delhiPoliceSpeed,
    totalWordsTyped,
    totalCharsTyped
  };
}

function round1(n) {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

function average(nums) {
  if (!nums.length) return 0;
  return round1(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function maxOf(nums) {
  return nums.length ? Math.max(...nums) : 0;
}

/**
 * "Personal best" numbers shown on the Home page. All derived live from
 * whatever is in history - deleting/importing records changes these
 * automatically on next render.
 */
export function getPersonalBests(history) {
  if (!history.length) {
    return {
      bestAccuracy: 0,
      bestDsssbSpeed: 0,
      bestDelhiPoliceSpeed: 0,
      bestStrokeSpeed: 0,
      bestSpaceSpeed: 0,
      fastest5Min: 0,
      fastest10Min: 0,
      fastest15Min: 0
    };
  }

  const byDuration = (seconds) =>
    history.filter((r) => Math.round(r.durationSeconds / 60) === seconds).map((r) => r.dsssbSpeed || 0);

  return {
    bestAccuracy: maxOf(history.map((r) => r.accuracy || 0)),
    bestDsssbSpeed: maxOf(history.map((r) => r.dsssbSpeed || 0)),
    bestDelhiPoliceSpeed: maxOf(history.map((r) => r.delhiPoliceSpeed || 0)),
    bestStrokeSpeed: maxOf(history.map((r) => r.strokeSpeed || 0)),
    bestSpaceSpeed: maxOf(history.map((r) => r.spaceSpeed || 0)),
    fastest5Min: maxOf(byDuration(5)),
    fastest10Min: maxOf(byDuration(10)),
    fastest15Min: maxOf(byDuration(15))
  };
}

/**
 * Dashboard summary cards - averages/totals across all recorded tests.
 */
export function getDashboardSummary(history) {
  if (!history.length) {
    return {
      totalTests: 0,
      averageAccuracy: 0,
      averageDsssbSpeed: 0,
      averageStrokeSpeed: 0,
      averageMistakes: 0,
      totalPracticeTimeSeconds: 0,
      totalWordsTyped: 0
    };
  }

  return {
    totalTests: history.length,
    averageAccuracy: average(history.map((r) => r.accuracy || 0)),
    averageDsssbSpeed: average(history.map((r) => r.dsssbSpeed || 0)),
    averageStrokeSpeed: average(history.map((r) => r.strokeSpeed || 0)),
    averageMistakes: average(history.map((r) => r.mistakes || 0)),
    totalPracticeTimeSeconds: history.reduce((sum, r) => sum + (r.durationSeconds || 0), 0),
    totalWordsTyped: history.reduce((sum, r) => sum + (r.totalWordsTyped || 0), 0)
  };
}

export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m || h) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}
