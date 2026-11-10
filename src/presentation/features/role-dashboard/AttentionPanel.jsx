import { Link } from "react-router-dom";

const TONES = {
  danger: "border-danger/40 bg-danger/5",
  warning: "border-amber-500/40 bg-amber-500/5",
  info: "border-primary/30 bg-primary/5",
  calm: "border-border bg-background",
};

const COUNT_TONES = {
  danger: "text-danger",
  warning: "text-amber-500",
  info: "text-primary",
  calm: "text-text-secondary",
};

/**
 * "What needs my attention now?" cards for a role overview.
 * Items: { id, tone, count?, title, description, href?, actionLabel?, onAction? }
 * Items with a count of 0 are shown calmly after the ones that need action.
 */
function AttentionPanel({ t, items }) {
  if (!items || items.length === 0) return null;
  const pending = items.filter((item) => item.count === undefined || item.count > 0);
  const clear = items.filter((item) => item.count === 0);

  return (
    <section aria-labelledby="attention-title" className="mb-8">
      <h2 id="attention-title" className="text-xl font-bold">{t("attention.title")}</h2>
      {pending.length === 0 && (
        <p role="status" className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">{t("attention.allClear")}</p>
      )}
      {pending.length > 0 && (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {pending.map((item) => (
            <li key={item.id} className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 ${TONES[item.tone] || TONES.info}`}>
              <div className="flex items-start gap-4">
                {item.count !== undefined && (
                  <span className={`text-3xl font-bold leading-none ${COUNT_TONES[item.tone] || COUNT_TONES.info}`}>{item.count}</span>
                )}
                <div>
                  <h3 className="font-bold">{item.title}</h3>
                  {item.description && <p className="mt-1 text-sm leading-6 text-text-secondary">{item.description}</p>}
                </div>
              </div>
              {item.href && (
                <Link
                  to={item.href}
                  onClick={item.onAction}
                  className="w-fit rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {item.actionLabel}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      {clear.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {clear.map((item) => (
            <li key={item.id} className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-secondary">✓ {item.title}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default AttentionPanel;
