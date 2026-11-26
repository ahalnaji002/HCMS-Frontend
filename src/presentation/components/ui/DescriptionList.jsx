import { cx } from "@/presentation/components/ui/cx";

function isEmpty(value) {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

/**
 * Read-only label/value pairs. Empty values are skipped unless `emptyText`
 * is given, so screens never print lone dashes.
 * <DescriptionList columns={2} items={[{ label: "Phone", value: <a…/> }, …]} />
 */
function DescriptionList({ items, columns = 1, emptyText, className }) {
  const visible = items.filter((item) => !item.hidden && (!isEmpty(item.value) || emptyText));
  if (visible.length === 0) return null;

  return (
    <dl className={cx("grid gap-3", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-2 lg:grid-cols-3", className)}>
      {visible.map((item) => (
        <div key={item.key || item.label} className={cx("min-w-0 rounded-xl bg-background p-4", item.wide && "sm:col-span-full")}>
          <dt className="text-xs font-semibold text-text-secondary">{item.label}</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-text-primary">
            {isEmpty(item.value) ? <span className="text-text-secondary">{emptyText}</span> : item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default DescriptionList;
