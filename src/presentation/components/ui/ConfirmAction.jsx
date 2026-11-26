import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/presentation/components/ui/Button";

/**
 * A button for an irreversible action that asks for confirmation in place.
 * <ConfirmAction label="Deactivate" title="Deactivate Sara?" description="…"
 *   confirmLabel="Yes, deactivate" onConfirm={…} loading={busy} />
 * tone="danger" (default) or "primary" for positive but final actions.
 */
function ConfirmAction({ label, title, description, confirmLabel, cancelLabel, onConfirm, tone = "danger", loading = false, disabled = false, size = "md" }) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const titleId = useId();

  if (!confirming) {
    return (
      <Button
        variant={tone === "danger" ? "danger-outline" : "primary"}
        size={size}
        loading={loading}
        disabled={disabled}
        onClick={() => setConfirming(true)}
      >
        {label}
      </Button>
    );
  }

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className={`w-full rounded-xl border p-4 ${tone === "danger" ? "border-danger/30 bg-danger/5" : "border-primary/30 bg-primary/5"}`}
    >
      <p id={titleId} className="font-semibold">{title}</p>
      {description && <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          variant={tone === "danger" ? "danger" : "primary"}
          size="sm"
          disabled={disabled}
          onClick={() => { setConfirming(false); onConfirm(); }}
        >
          {confirmLabel}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>
          {cancelLabel || t("ui.cancel")}
        </Button>
      </div>
    </div>
  );
}

export default ConfirmAction;
