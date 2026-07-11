// errorReview.js
// Renders the post-submit "Error Review" section: original paragraph,
// typed paragraph, and a word-by-word breakdown with color coding + hover
// tooltips showing the expected word for mistakes. Pure rendering - all
// classification comes from stats.diffWords().

const STATUS_CLASS = {
  correct: "word-correct",
  wrong: "word-wrong",
  missing: "word-missing",
  extra: "word-extra"
};

/**
 * @param {HTMLElement} container
 * @param {ReturnType<import('./stats.js').diffWords>} diff
 */
export function renderErrorReview(container, diff) {
  container.innerHTML = "";

  const typedBlock = document.createElement("div");
  typedBlock.className = "error-review-block";
  const typedHeading = document.createElement("h3");
  typedHeading.textContent = "Your Typed Text (word-by-word review)";
  typedBlock.appendChild(typedHeading);

  const wordsWrap = document.createElement("p");
  wordsWrap.className = "word-diff";

  diff.words.forEach((w) => {
    const span = document.createElement("span");
    span.className = `word-chip ${STATUS_CLASS[w.status]}`;
    if (w.status === "missing") {
      span.textContent = w.original;
      span.title = "Missing - you did not type this word";
    } else if (w.status === "extra") {
      span.textContent = w.typed;
      span.title = "Extra - not present in the original text";
    } else if (w.status === "wrong") {
      span.textContent = w.typed;
      span.title = `Expected: "${w.original}"`;
      span.tabIndex = 0;
    } else {
      span.textContent = w.typed;
    }
    wordsWrap.appendChild(span);
    wordsWrap.appendChild(document.createTextNode(" "));
  });

  typedBlock.appendChild(wordsWrap);

  const legend = document.createElement("div");
  legend.className = "word-legend";
  legend.innerHTML = `
    <span class="legend-item"><span class="swatch word-correct"></span> Correct</span>
    <span class="legend-item"><span class="swatch word-wrong"></span> Wrong (hover for expected word)</span>
    <span class="legend-item"><span class="swatch word-missing"></span> Missing</span>
    <span class="legend-item"><span class="swatch word-extra"></span> Extra</span>
  `;

  const originalBlock = document.createElement("div");
  originalBlock.className = "error-review-block";
  const originalHeading = document.createElement("h3");
  originalHeading.textContent = "Original Paragraph";
  const originalText = document.createElement("p");
  originalText.className = "original-text";
  originalText.textContent = diff.originalWords.join(" ");
  originalBlock.appendChild(originalHeading);
  originalBlock.appendChild(originalText);

  container.appendChild(originalBlock);
  container.appendChild(typedBlock);
  container.appendChild(legend);
}
