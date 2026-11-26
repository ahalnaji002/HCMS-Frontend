import { cx } from "@/presentation/components/ui/cx";

// One look for every action. Hover, focus, disabled, and loading states are
// built in, and `h-fit` keeps buttons from stretching inside grid or flex rows.
const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary/90 focus-visible:outline-primary",
  secondary: "border border-border bg-surface text-text-primary hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-primary",
  danger: "bg-danger text-white hover:bg-danger/90 focus-visible:outline-danger",
  "danger-outline": "border border-danger bg-surface text-danger hover:bg-danger/5 focus-visible:outline-danger",
  ghost: "text-primary hover:bg-primary/10 focus-visible:outline-primary",
};

const SIZES = {
  sm: "min-h-10 px-3 py-2 text-sm",
  md: "min-h-11 px-5 py-2.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-base",
};

export function buttonClasses({ variant = "primary", size = "md", fullWidth = false, className } = {}) {
  return cx(
    "inline-flex h-fit shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:pointer-events-none aria-disabled:opacity-60",
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    fullWidth ? "w-full" : "w-fit",
    className,
  );
}

export const controlClasses = cx(
  "w-full min-h-11 rounded-xl border bg-background px-4 py-2.5 text-text-primary transition-colors",
  "placeholder:text-text-secondary/70",
  "focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
  "disabled:cursor-not-allowed disabled:opacity-70",
);

// Status → tone for every workflow in HCMS. One place, so the same status has
// the same color on every screen.
export const STATUS_TONES = {
  // accounts
  ACTIVE: "success",
  INACTIVE: "warning",
  SUSPENDED: "danger",
  // join requests, assistance, corrections
  PENDING: "warning",
  UNDER_REVIEW: "info",
  APPROVED: "success",
  REJECTED: "danger",
  COMPLETED: "success",
  OPEN: "warning",
  RESPONDED: "success",
  RESOLVED: "success",
  // emergency alerts
  PENDING_ASSIGNMENT: "danger",
  ASSIGNED: "warning",
  IN_PROGRESS: "info",
  CANCELLED: "neutral",
  // intakes, plans, appointments, reminders
  SUBMITTED: "warning",
  DOCTOR_ASSIGNED: "success",
  SCHEDULED: "info",
  SENT: "success",
  FAILED: "danger",
};
