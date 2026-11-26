import { cx } from "@/presentation/components/ui/cx";

/**
 * The one page title (h1) of a screen, with optional eyebrow, description,
 * and actions on the end side. Every routed page should start with it.
 * <PageHeader eyebrow="Patient workspace" title="Reminders" description="…" actions={<Button/>} />
 */
function PageHeader({ eyebrow, title, description, actions, id, className }) {
  return (
    <header className={cx("mb-8 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="text-sm font-semibold text-primary">{eyebrow}</p>}
        <h1 id={id} className={cx("text-2xl font-bold leading-tight sm:text-3xl", eyebrow && "mt-1")}>{title}</h1>
        {description && <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

export default PageHeader;
