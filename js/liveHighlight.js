// liveHighlight.js
// Renders the paragraph as word spans inside a fixed-height scrollable box
// and keeps the word currently being typed scrolled into view - only the
// box scrolls, never the page (Monkeytype-style typing view).
import { splitWords } from "./stats.js";

const CLASS_CORRECT = "para-word-correct";
const CLASS_WRONG = "para-word-wrong";
const CLASS_CURRENT = "para-word-current";
const CLASS_PENDING = "para-word-pending";
const ALL_STATE_CLASSES = [CLASS_CORRECT, CLASS_WRONG, CLASS_CURRENT, CLASS_PENDING];

/**
 * Builds one <span> per word inside `container` and returns the list of
 * word elements (in order) so updateTypingHighlight can restyle them
 * cheaply on every keystroke without re-parsing the DOM.
 */
export function renderTypingParagraph(container, originalWords) {
  container.innerHTML = "";
  container.scrollTop = 0;
  return originalWords.map((word, i) => {
    const span = document.createElement("span");
    span.className = `para-word ${CLASS_PENDING}`;
    span.textContent = word;
    container.appendChild(span);
    if (i < originalWords.length - 1) container.appendChild(document.createTextNode(" "));
    return span;
  });
}

/**
 * Re-colors every word span based on what has been typed so far, and
 * scrolls the container (not the page) so the current word stays visible.
 */
export function updateTypingHighlight(container, wordEls, originalWords, typedText) {
  const endsWithSpace = typedText.length > 0 && /\s$/.test(typedText);
  const tokens = splitWords(typedText);
  const completedCount = endsWithSpace ? tokens.length : Math.max(0, tokens.length - 1);
  const currentIndex = Math.min(completedCount, wordEls.length - 1);

  wordEls.forEach((el, i) => {
    el.classList.remove(...ALL_STATE_CLASSES);
    if (i < completedCount) {
      el.classList.add(tokens[i] === originalWords[i] ? CLASS_CORRECT : CLASS_WRONG);
    } else if (i === currentIndex) {
      el.classList.add(CLASS_CURRENT);
    } else {
      el.classList.add(CLASS_PENDING);
    }
  });

  const currentEl = wordEls[currentIndex];
  if (currentEl) scrollWordIntoView(container, currentEl);
}

function scrollWordIntoView(container, wordEl) {
  const visibleTop = container.scrollTop;
  const visibleBottom = visibleTop + container.clientHeight;
  const wordTop = wordEl.offsetTop;
  const wordBottom = wordTop + wordEl.offsetHeight;

  if (wordTop < visibleTop || wordBottom > visibleBottom) {
    container.scrollTop = wordTop - container.clientHeight / 2 + wordEl.offsetHeight / 2;
  }
}
