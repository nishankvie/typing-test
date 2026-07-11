// shortcuts.js
// Generic keyboard-shortcut wiring. Callers pass in the handlers they care
// about; this module owns the single keydown listener and key-matching
// logic so no other module needs to touch document-level key events.

/**
 * @param {Object} handlers
 * @param {Function} [handlers.onSubmit] - Ctrl+Enter
 * @param {Function} [handlers.onCancel] - Escape
 * @param {Function} [handlers.onFullscreen] - F11
 * @returns {Function} cleanup function to remove the listener
 */
export function registerShortcuts({ onSubmit, onCancel, onFullscreen } = {}) {
  function handleKeydown(event) {
    if (onSubmit && event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      onSubmit(event);
      return;
    }
    if (onCancel && event.key === "Escape") {
      event.preventDefault();
      onCancel(event);
      return;
    }
    if (onFullscreen && event.key === "F11") {
      event.preventDefault();
      onFullscreen(event);
    }
  }

  document.addEventListener("keydown", handleKeydown);
  return () => document.removeEventListener("keydown", handleKeydown);
}

export function toggleFullscreen() {
  if (!document.fullscreenEnabled) {
    return false;
  }
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
  return true;
}

/**
 * Wires the "unsaved test in progress" warning (beforeunload). Returns a
 * cleanup function. `isRunning` is called at unload-time to decide whether
 * to prompt, so callers just flip test state elsewhere and this stays in sync.
 */
export function registerUnsavedWarning(isRunning) {
  function handleBeforeUnload(event) {
    if (!isRunning()) return;
    event.preventDefault();
    event.returnValue = "";
    return "";
  }
  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}
