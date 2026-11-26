import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cx } from "@/presentation/components/ui/cx";
import { ToastContext } from "@/presentation/components/ui/toastContext";

const SUCCESS_TIMEOUT_MS = 6000;

function ToastItem({ toast, onDismiss, dismissLabel }) {
  useEffect(() => {
    if (toast.tone === "error") return undefined;
    const timer = setTimeout(() => onDismiss(toast.id), SUCCESS_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const isError = toast.tone === "error";
  return (
    <div
      className={cx(
        "pointer-events-auto flex w-full items-start justify-between gap-4 rounded-xl border bg-surface p-4 text-sm font-semibold shadow-2xl",
        isError ? "border-danger/40 text-danger" : "border-success/40 text-success",
      )}
    >
      <p role={isError ? "alert" : "status"} className="leading-6">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={dismissLabel}
        className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-text-secondary transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-primary"
      >
        ×
      </button>
    </div>
  );
}

/**
 * One feedback system for the whole app. Success toasts close after 6 s;
 * error toasts stay until dismissed. Mounted once in App.
 */
export function ToastProvider({ children }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const show = useCallback((tone, message) => {
    if (!message) return;
    const id = nextId.current++;
    // Keep the newest three; a repeated message replaces the old copy.
    setToasts((current) => [...current.filter((toast) => toast.message !== message), { id, tone, message }].slice(-3));
  }, []);

  const api = useMemo(() => ({
    success: (message) => show("success", message),
    error: (message) => show("error", message),
    dismissAll: () => setToasts([]),
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 top-20 z-50 flex flex-col items-center gap-3">
        <div className="flex w-full max-w-xl flex-col gap-3">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} dismissLabel={t("roleHome.dismissMessage")} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
