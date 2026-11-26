import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { translateServerMessage } from "@/presentation/utils/serverMessages";
import { cx } from "@/presentation/components/ui/cx";
import { ToastContext } from "@/presentation/components/ui/toastContext";

const SUCCESS_TIMEOUT_MS = 6000;

// A message is either plain text or a descriptor translated on every render,
// so it follows a language switch: { key, values } or { server, key } (known
// server text is translated; unknown text falls back to `key`).
function resolveMessage(t, message) {
  if (typeof message === "string") return message;
  if (message.server) return translateServerMessage(t, message.server, message.key);
  return t(message.key, message.values);
}

function ToastItem({ toast, onDismiss, dismissLabel }) {
  const { t } = useTranslation();
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
      <p role={isError ? "alert" : "status"} className="leading-6">{resolveMessage(t, toast.message)}</p>
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
 * error toasts stay until dismissed; all close when the page changes.
 * Mounted once in App (inside the router).
 */
export function ToastProvider({ children }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  // A message belongs to the page where the action happened: each toast
  // remembers its page and is only shown there.
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);
  const dismiss = useCallback((id) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const show = useCallback((tone, message) => {
    if (!message) return;
    const id = nextId.current++;
    // One message at a time: the result of the latest action replaces any
    // earlier one, so a stale error never sits next to a later success.
    setToasts([{ id, tone, message, path: pathRef.current }]);
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
          {toasts.filter((toast) => toast.path === pathname).map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} dismissLabel={t("roleHome.dismissMessage")} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
