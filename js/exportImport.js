// exportImport.js
// Converts history records to/from downloadable JSON and CSV files. Has no
// knowledge of localStorage - callers pass the records in/out explicitly.

const CSV_COLUMNS = [
  "date", "time", "pageName", "durationSeconds", "typingMode", "language",
  "correctWords", "missingWords", "wrongWords", "extraWords", "mistakes",
  "accuracy", "strokeSpeed", "spaceSpeed", "dsssbSpeed", "delhiPoliceSpeed"
];

function triggerDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportHistoryAsJSON(records) {
  const json = JSON.stringify(records, null, 2);
  triggerDownload(`typing-history-${Date.now()}.json`, json, "application/json");
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportHistoryAsCSV(records) {
  const header = CSV_COLUMNS.join(",");
  const rows = records.map((r) => CSV_COLUMNS.map((col) => csvEscape(r[col])).join(","));
  const csv = [header, ...rows].join("\n");
  triggerDownload(`typing-history-${Date.now()}.csv`, csv, "text/csv");
}

/**
 * Reads a File (from an <input type="file">) and resolves with the parsed
 * array of history records. Rejects with a descriptive error on bad input.
 */
export function readImportFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file selected."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) {
          reject(new Error("Import file must contain a JSON array of history records."));
          return;
        }
        resolve(data);
      } catch (err) {
        reject(new Error("Import file is not valid JSON."));
      }
    };
    reader.readAsText(file);
  });
}
