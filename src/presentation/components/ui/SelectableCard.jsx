import { cx } from "@/presentation/components/ui/cx";

/**
 * A list item that selects something (a patient, a plan). Compact, with a
 * clear selected state; never stretches to the container height.
 * <SelectableCard selected={id === current} onClick={…} title="Asthma plan" meta="Active · 5 Nov" />
 */
function SelectableCard({ selected = false, title, meta, aside, className, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        "flex h-fit w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-start transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        selected ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-primary/50 hover:bg-primary/5",
        className,
      )}
      {...props}
    >
      <span className="min-w-0">
        <span className={cx("block truncate font-semibold", selected && "text-primary")}>{title}</span>
        {meta && <span className="mt-0.5 block truncate text-xs text-text-secondary">{meta}</span>}
      </span>
      {aside}
    </button>
  );
}

export default SelectableCard;
