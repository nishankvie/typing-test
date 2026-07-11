// historyPage.js - History page controller: search, sort, pagination,
// delete/clear (with confirmation), export/import.
import { initTheme } from "./theme.js";
import { getAllHistory, deleteHistoryRecord, clearAllHistory, importHistory } from "./history.js";
import { exportHistoryAsJSON, exportHistoryAsCSV, readImportFile } from "./exportImport.js";
import { formatDuration } from "./stats.js";

initTheme();

const PAGE_SIZE = 25;

const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const tbody = document.getElementById("history-tbody");
const emptyState = document.getElementById("empty-state");
const resultCount = document.getElementById("result-count");
const pagination = document.getElementById("pagination");
const exportJsonBtn = document.getElementById("export-json-btn");
const exportCsvBtn = document.getElementById("export-csv-btn");
const importFileInput = document.getElementById("import-file");
const clearAllBtn = document.getElementById("clear-all-btn");

let currentPage = 1;

const SORTERS = {
  newest: (a, b) => b.id.localeCompare(a.id),
  oldest: (a, b) => a.id.localeCompare(b.id),
  accuracy: (a, b) => (b.accuracy || 0) - (a.accuracy || 0),
  dsssb: (a, b) => (b.dsssbSpeed || 0) - (a.dsssbSpeed || 0),
  delhiPolice: (a, b) => (b.delhiPoliceSpeed || 0) - (a.delhiPoliceSpeed || 0),
  stroke: (a, b) => (b.strokeSpeed || 0) - (a.strokeSpeed || 0)
};

function getFilteredSorted() {
  const query = searchInput.value.trim().toLowerCase();
  const all = getAllHistory();
  const filtered = query
    ? all.filter((r) => {
        const durationText = formatDuration(r.durationSeconds).toLowerCase();
        return (
          (r.date || "").toLowerCase().includes(query) ||
          (r.pageName || "").toLowerCase().includes(query) ||
          durationText.includes(query) ||
          String(Math.round((r.durationSeconds || 0) / 60)).includes(query)
        );
      })
    : all;

  const sorter = SORTERS[sortSelect.value] || SORTERS.newest;
  return filtered.slice().sort(sorter);
}

function renderRow(record) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${record.date || ""}</td>
    <td>${record.time || ""}</td>
    <td>${record.pageName || ""}</td>
    <td>${formatDuration(record.durationSeconds || 0)}</td>
    <td><span class="badge">${record.typingMode || ""}</span></td>
    <td>${record.correctWords ?? ""}</td>
    <td>${record.missingWords ?? ""}</td>
    <td>${record.mistakes ?? ""}</td>
    <td>${record.accuracy ?? ""}%</td>
    <td>${record.strokeSpeed ?? ""}</td>
    <td>${record.spaceSpeed ?? ""}</td>
    <td>${record.dsssbSpeed ?? ""}</td>
    <td>${record.delhiPoliceSpeed ?? ""}</td>
    <td><button type="button" data-delete-id="${record.id}" aria-label="Delete this history record">Delete</button></td>
  `;
  return tr;
}

function render() {
  const filtered = getFilteredSorted();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = "";
  const fragment = document.createDocumentFragment();
  pageItems.forEach((record) => fragment.appendChild(renderRow(record)));
  tbody.appendChild(fragment);

  emptyState.hidden = filtered.length !== 0;
  resultCount.textContent = `${filtered.length} record${filtered.length === 1 ? "" : "s"} found`;

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  pagination.innerHTML = "";
  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "← Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => {
    currentPage--;
    render();
  });

  const label = document.createElement("span");
  label.textContent = `Page ${currentPage} of ${totalPages}`;

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next →";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    currentPage++;
    render();
  });

  pagination.append(prevBtn, label, nextBtn);
}

tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-delete-id]");
  if (!btn) return;
  if (!confirm("Delete this history record? This cannot be undone.")) return;
  deleteHistoryRecord(btn.dataset.deleteId);
  render();
});

searchInput.addEventListener("input", () => {
  currentPage = 1;
  render();
});
sortSelect.addEventListener("change", () => {
  currentPage = 1;
  render();
});

exportJsonBtn.addEventListener("click", () => exportHistoryAsJSON(getAllHistory()));
exportCsvBtn.addEventListener("click", () => exportHistoryAsCSV(getAllHistory()));

importFileInput.addEventListener("change", async () => {
  const file = importFileInput.files[0];
  try {
    const records = await readImportFile(file);
    const { imported, skipped } = importHistory(records);
    alert(`Imported ${imported} record(s).${skipped ? ` Skipped ${skipped} invalid record(s).` : ""}`);
    render();
  } catch (err) {
    alert(err.message);
  } finally {
    importFileInput.value = "";
  }
});

clearAllBtn.addEventListener("click", () => {
  if (getAllHistory().length === 0) return;
  if (!confirm("Clear ALL practice history? This cannot be undone.")) return;
  clearAllHistory();
  currentPage = 1;
  render();
});

render();
