import { cx } from "@/presentation/components/ui/cx";

const TONES = {
  error: "border-danger/30 bg-danger/5 text-danger",
  warning: "border-warning/40 bg-warning/10 text-amber-800 dark:text-warning",
  info: "border-primary/30 bg-primary/5 text-primary",
  success: "border-success/30 bg-success/5 text-success",
};

/**
 * Inline message tied to a place on the page (a form error, a load failure,
 * a note). For "it worked" feedback after an action, use useToast() instead.
 * Errors are announced (role="alert"); other tones are polite (role="status").
 * <Alert tone="error" title="…" action={<Button size="sm">Retry</Button>}>Details</Alert>
 */
function Alert({ tone = "info", title, action, className, children }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx("flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4 text-sm leading-6", TONES[tone] || TONES.info, className)}
    >
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-1" : undefined}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export default Alert;
