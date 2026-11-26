import { useTranslation } from "react-i18next";
import { cx } from "@/presentation/components/ui/cx";
import { STATUS_TONES } from "@/presentation/components/ui/styles";

const TONES = {
  neutral: "bg-background text-text-secondary ring-1 ring-border",
  info: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-amber-700 dark:text-warning",
  danger: "bg-danger/10 text-danger",
};

/**
 * Small pill that never stretches or wraps, whatever its container does.
 * <Badge tone="success">Active</Badge>
 */
function Badge({ tone = "neutral", className, children, ...props }) {
  return (
    <span
      className={cx(
        "inline-flex h-fit w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold leading-5",
        TONES[tone] || TONES.neutral,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Translated status with its standard tone.
 * <StatusBadge status="PENDING_ASSIGNMENT" labelPrefix="patientWorkspace.alertStatuses" />
 */
export function StatusBadge({ status, labelPrefix, tone, className, ...props }) {
  const { t } = useTranslation();
  return (
    <Badge tone={tone || STATUS_TONES[status] || "neutral"} className={className} {...props}>
      {labelPrefix ? t(`${labelPrefix}.${status}`, { defaultValue: status }) : status}
    </Badge>
  );
}

export default Badge;
