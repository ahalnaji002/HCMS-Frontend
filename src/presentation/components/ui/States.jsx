import { useTranslation } from "react-i18next";
import Button from "@/presentation/components/ui/Button";
import { cx } from "@/presentation/components/ui/cx";

/** Shown while a list or page loads. */
export function LoadingState({ label, className }) {
  const { t } = useTranslation();
  return (
    <div role="status" className={cx("flex items-center justify-center gap-3 py-12 text-sm text-text-secondary", className)}>
      <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {label || t("ui.loading")}
    </div>
  );
}

/** Nothing to show yet, with an optional next step. */
export function EmptyState({ title, description, action, className }) {
  return (
    <div role="status" className={cx("rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center", className)}>
      <p className="font-semibold">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** A load failed; offer a retry. */
export function ErrorState({ message, onRetry, retrying = false, retryLabel, className }) {
  const { t } = useTranslation();
  return (
    <div className={cx("flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4", className)}>
      <p role="alert" className="text-sm text-danger">{message || t("ui.loadError")}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} loading={retrying}>
          {retryLabel || t("ui.retry")}
        </Button>
      )}
    </div>
  );
}
