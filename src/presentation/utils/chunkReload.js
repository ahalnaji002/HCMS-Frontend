// After a new deploy the old JavaScript chunks are gone, so a tab that was
// opened before the deploy fails to load the next page it lazy-loads. One
// automatic reload fetches the new version. The timestamp guard stops a
// reload loop when the failure is something else (e.g. the network is down).

const RELOAD_KEY = "hcms-chunk-reload-at";
const RELOAD_GUARD_MS = 60 * 1000;

const CHUNK_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /Unable to preload CSS/i,
];

export function isChunkLoadError(error) {
  const message = typeof error === "string" ? error : error?.message;
  return typeof message === "string" && CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

// Reloads the page unless it already did so in the last minute.
// Returns true when a reload was started.
export function reloadOnceForNewVersion(now = Date.now()) {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY));
    if (Number.isFinite(last) && now - last < RELOAD_GUARD_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(now));
  } catch {
    // Without storage there is no loop guard, so do not reload automatically.
    return false;
  }
  window.location.reload();
  return true;
}
