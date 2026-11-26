import { useId, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { cx } from "@/presentation/components/ui/cx";

const tabClass = (active) => cx(
  "inline-flex min-h-10 shrink-0 items-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  active ? "bg-primary text-white" : "text-text-secondary hover:bg-primary/10 hover:text-primary",
);

const listClass = "flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1";

/**
 * In-page tabs with keyboard support (arrows follow the reading direction,
 * Home/End). Panels stay mounted only while active.
 * <Tabs label="Patient file" tabs={[{ id: "summary", label: "Summary", content: <…/> }, …]} />
 */
function Tabs({ label, tabs, value, defaultValue, onChange, className }) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.id);
  const active = value ?? internal;
  const refs = useRef({});

  function select(id) {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  }

  function onKeyDown(event) {
    const index = tabs.findIndex((tab) => tab.id === active);
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key];
    let next = null;
    if (step) next = tabs[(index + step + tabs.length) % tabs.length];
    if (event.key === "Home") next = tabs[0];
    if (event.key === "End") next = tabs[tabs.length - 1];
    if (!next) return;
    event.preventDefault();
    select(next.id);
    refs.current[next.id]?.focus();
  }

  const current = tabs.find((tab) => tab.id === active);
  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className={listClass} onKeyDown={onKeyDown}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(node) => { refs.current[tab.id] = node; }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab.id}`}
            aria-selected={tab.id === active}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={tab.id === active ? 0 : -1}
            onClick={() => select(tab.id)}
            className={tabClass(tab.id === active)}
          >
            {tab.label}
            {tab.count !== undefined && <span className="ms-2 rounded-full bg-background/30 px-2 text-xs">{tab.count}</span>}
          </button>
        ))}
      </div>
      {current && (
        <div role="tabpanel" id={`${baseId}-panel-${current.id}`} aria-labelledby={`${baseId}-tab-${current.id}`} tabIndex={0} className="mt-6 focus-visible:outline-none">
          {current.content}
        </div>
      )}
    </div>
  );
}

/**
 * Same look for tabs that are separate routes.
 * <TabLinks label="Management" links={[{ to: "/admin/users", label: "Users" }, …]} />
 */
export function TabLinks({ label, links, className }) {
  return (
    <nav aria-label={label} className={cx(listClass, "w-fit max-w-full", className)}>
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => tabClass(isActive)}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default Tabs;
