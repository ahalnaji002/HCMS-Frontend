import { useId } from "react";
import { cx } from "@/presentation/components/ui/cx";

const TONES = {
  default: "border-border",
  danger: "border-danger/40",
  info: "border-primary/30",
};

/**
 * Content block with an optional header (title, description, actions).
 * Renders a labelled <section> by default; use as="article" for list items.
 * <Card title="Medical record" description="…" actions={<Button/>}>…</Card>
 */
function Card({ as: Element = "section", title, titleLevel = 2, description, actions, tone = "default", padding = "md", className, children, ...props }) {
  const titleId = useId();
  const Heading = `h${titleLevel}`;
  const hasHeader = title || description || actions;

  return (
    <Element
      aria-labelledby={title ? titleId : undefined}
      className={cx(
        "rounded-2xl border bg-surface",
        TONES[tone] || TONES.default,
        padding === "sm" ? "p-4 sm:p-5" : "p-5 sm:p-8",
        className,
      )}
      {...props}
    >
      {hasHeader && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <Heading id={titleId} className={cx("font-bold leading-snug", titleLevel === 2 ? "text-xl" : "text-lg", tone === "danger" && "text-danger")}>
                {title}
              </Heading>
            )}
            {description && <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children && <div className={hasHeader ? "mt-5" : undefined}>{children}</div>}
    </Element>
  );
}

export default Card;
