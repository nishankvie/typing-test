// history.js
// Sole owner of the localStorage "history" collection. Every other module
// reads/writes history exclusively through the functions exported here so
// the storage format can change in one place without breaking callers.

const STORAGE_KEY = "typingPractice.history.v1";

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to read history from localStorage:", err);
    return [];
  }
}

function writeRaw(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (err) {
    console.error("Failed to write history to localStorage:", err);
    return false;
  }
}

function generateId() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Returns all history records, newest first by insertion order in storage
// (callers apply their own sort for display).
export function getAllHistory() {
  return readRaw();
}

export function getHistoryById(id) {
  return readRaw().find((r) => r.id === id) || null;
}

// record shape (see stats.js for how fields are derived):
// { id, date, time, pageName, durationSeconds, typingMode, language,
//   correctWords, missingWords, wrongWords, extraWords, mistakes, accuracy,
//   strokeSpeed, spaceSpeed, dsssbSpeed, delhiPoliceSpeed, totalWordsTyped,
//   totalKeystrokes, originalText, typedText }
export function addHistoryRecord(record) {
  const records = readRaw();
  const withId = { id: generateId(), ...record };
  records.push(withId);
  writeRaw(records);
  return withId;
}

export function deleteHistoryRecord(id) {
  const records = readRaw().filter((r) => r.id !== id);
  return writeRaw(records);
}

export function clearAllHistory() {
  return writeRaw([]);
}

export function replaceAllHistory(records) {
  if (!Array.isArray(records)) return false;
  return writeRaw(records);
}

export function importHistory(records) {
  if (!Array.isArray(records)) return { imported: 0, skipped: 0 };
  const existing = readRaw();
  const existingIds = new Set(existing.map((r) => r.id));
  let imported = 0;
  let skipped = 0;
  const merged = existing.slice();
  for (const rec of records) {
    if (!rec || typeof rec !== "object") {
      skipped++;
      continue;
    }
    const id = existingIds.has(rec.id) ? generateId() : rec.id || generateId();
    merged.push({ ...rec, id });
    existingIds.add(id);
    imported++;
  }
  writeRaw(merged);
  return { imported, skipped };
}

export function getHistoryCount() {
  return readRaw().length;
}
