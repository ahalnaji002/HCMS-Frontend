import { useEffect } from "react";

const NOTICE_TIMEOUT_MS = 6000;

// Fixed-position feedback for page actions, visible wherever the user has
// scrolled. Success notices close themselves; errors stay until dismissed.
function StatusToast({ error, notice, onDismiss, dismissLabel }) {
  useEffect(() => {
    if (!notice || error) return undefined;
    const timer = setTimeout(onDismiss, NOTICE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [notice, error, onDismiss]);

  if (!error && !notice) return null;
  const isError = Boolean(error);

  return (
    <div className="pointer-events-none fixed inset-x-4 top-20 z-50 flex justify-center">
      <div
        className={`pointer-events-auto flex w-full max-w-xl items-start justify-between gap-4 rounded-xl border p-4 text-sm font-semibold shadow-2xl ${
          isError ? "border-danger/40 bg-surface text-danger" : "border-primary/40 bg-surface text-primary"
        }`}
      >
        <p role={isError ? "alert" : "status"} className="leading-6">{error || notice}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-text-secondary hover:bg-background"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default StatusToast;
