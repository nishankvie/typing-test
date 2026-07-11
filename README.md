# Typing Practice

A personal, offline typing-speed practice site for Hindi/English typing tests,
modeled on the format used for DSSSB / Delhi Police exam typing test prep.
Plain HTML/CSS/JS, no build step, no server, no external dependencies. All
data is stored locally in the browser via `localStorage` — nothing is sent
anywhere.

## Running it locally

Because pages load JS as ES modules (`<script type="module">`), opening the
HTML files directly via `file://` will be blocked by the browser's CORS
rules for modules. Serve the folder with any static file server, e.g.:

```bash
cd typing-practice
python3 -m http.server 8080
# then open http://localhost:8080
```

or `npx serve .`, or the VS Code "Live Server" extension — anything that
serves static files works.

## Pages

- `index.html` — Home: pick a language + duration and jump straight into a
  test, plus Personal Best + Dashboard summary cards.
- `test.html` — Typing Test: paragraph-based test with timer, live stats,
  results, and error review. While a test is running, the paragraph sits in
  a fixed-height box that auto-scrolls to keep the current word visible;
  the page itself never scrolls (Monkeytype-style) — only that box does.
- `history.html` — History: search, sort, paginate, delete, export/import.

## Note on caching during local development

If you edit the JS/CSS and your browser doesn't seem to pick up the
change, it's very likely the browser's HTTP cache (Python's built-in server
doesn't send `Cache-Control` headers, so browsers apply heuristic caching).
Each `<link>`/`<script src>` tag has a `?v=N` query suffix for exactly this
reason — bump the number after editing `style.css` if a change doesn't show
up, or just hard-refresh (Cmd/Ctrl+Shift+R).

## Module structure (`js/`)

Each feature lives in its own module. No global variables are used — state
is passed explicitly between functions/modules.

| Module | Responsibility |
|---|---|
| `paragraphs.js` | Text corpus (English/Hindi) for the typing test. Add more paragraphs/languages here without touching other files. |
| `history.js` | Sole owner of the `localStorage` history collection (CRUD, import/replace/clear). |
| `stats.js` | Pure functions only. Word-diff (correct/wrong/missing/extra), per-test speed/accuracy formulas, and aggregate Personal Best / Dashboard numbers — always derived live from history, nothing hardcoded. |
| `testEngine.js` | Orchestrates one test run: timer, keystroke counting, paragraph selection, and saving the finished result via `history.js` + `stats.js`. |
| `liveStats.js` | Ticks every second while a test runs and reports live accuracy/speed/word/keystroke/mistake counts. |
| `liveHighlight.js` | Renders the paragraph as per-word spans and re-colors them as you type, scrolling only the paragraph box (never the page) to keep the current word visible. |
| `errorReview.js` | Renders the post-submit word-by-word diff (color-coded, with hover tooltips on wrong words). |
| `exportImport.js` | Export history to JSON/CSV files; parse an imported JSON file back into records. |
| `theme.js` | Light/Dark theme, persisted to `localStorage`. |
| `shortcuts.js` | Keyboard shortcuts (Ctrl+Enter submit, Escape cancel, F11 fullscreen) and the "unsaved test" `beforeunload` warning. |
| `testLauncher.js` | Wires the Home page's language/duration picker to jump into `test.html` with the right query params, and reads those params back on the Typing Test page to auto-start. |
| `home.js`, `testPage.js`, `historyPage.js` | Per-page controllers that wire the modules above into each HTML page's DOM. Contain UI glue only — no business logic. |

## Speed formulas used

Exact official formulas vary slightly by exam notification; these follow the
commonly published methods and are documented with comments directly above
`computeTestStats()` in `js/stats.js`:

- **Stroke Speed** (key depression method): `(totalKeystrokes / 5) / minutes`
- **Space Speed** (word/space-bar method): `totalWordsTyped / minutes`
- **DSSSB Speed**: gross (space) speed minus a per-minute mistake penalty:
  `max(0, spaceSpeed - mistakes / minutes)`
- **Delhi Police Speed**: correct words minus wrong words, divided by time:
  `max(0, (correctWords - wrongWords) / minutes)`
- **Accuracy**: `(correctWords / totalWordsTyped) * 100`

## Extending it (adding tests/modes/formulas later)

- New paragraph or language → add to `PARAGRAPHS` in `paragraphs.js`.
- New test duration/mode → add an `<option>` in `test.html`'s selects;
  `testEngine.js` and `stats.js` already work off the raw duration value.
- New scoring formula → add a pure function in `stats.js` and include it in
  the object returned by `computeTestStats()`; `testEngine.js` will pick it
  up automatically when building the history record.
- New history field → add it to the record shape in `testEngine.js` and to
  `CSV_COLUMNS` in `exportImport.js` if it should appear in CSV exports.

## Performance at scale

The History page paginates (25 rows/page) instead of rendering the entire
table at once, so it stays smooth even with 1000+ stored records. Personal
Best / Dashboard aggregates are simple linear scans over the array, which
stays fast well past that size.
