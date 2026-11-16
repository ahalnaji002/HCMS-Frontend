import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";

function isRead(notification) {
  return notification.is_read === true || notification.is_read === 1 || notification.is_read === "1";
}

function formatDate(value, locale) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale || undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getErrorKind(error) {
  if (!error.response) return "network";
  if (error.response.status === 401) return "unauthorized";
  if (error.response.status === 403) return "forbidden";
  return "loadFailed";
}

function NotificationsFeature({ role }) {
  const { t, i18n } = useTranslation();
  const { notifications } = useApplicationServices();
  const [state, setState] = useState({ loading: true, error: "", items: [] });
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    notifications.listNotifications()
      .then((response) => {
        if (!active) return;
        setState({ loading: false, error: "", items: response?.data?.notifications ?? [] });
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: getErrorKind(error), items: [] });
      });
    return () => { active = false; };
  }, [notifications, reloadKey]);

  const roleKey = role.toLowerCase();
  const title = t(`roleNavigation.${roleKey}.notifications`);
  const unreadCount = state.items.filter((notification) => !isRead(notification)).length;
  const isBusy = Boolean(busyId) || markingAll;

  function retry() {
    setState((current) => ({ ...current, loading: true, error: "" }));
    setActionError("");
    setNotice("");
    setReloadKey((key) => key + 1);
  }

  async function markRead(notification) {
    if (isBusy || isRead(notification)) return;
    setBusyId(String(notification.id));
    setActionError("");
    setNotice("");
    try {
      const response = await notifications.markNotificationRead(notification.id);
      const updated = response?.data?.notification ?? { ...notification, is_read: true };
      setState((current) => ({
        ...current,
        items: current.items.map((item) => String(item.id) === String(notification.id) ? updated : item),
      }));
      setNotice("readOne");
    } catch {
      setActionError("actionFailed");
    } finally {
      setBusyId("");
    }
  }

  async function markAllRead() {
    if (isBusy || unreadCount === 0) return;
    setMarkingAll(true);
    setActionError("");
    setNotice("");
    try {
      await notifications.markAllNotificationsRead();
      setState((current) => ({
        ...current,
        items: current.items.map((notification) => (isRead(notification)
          ? notification
          : { ...notification, is_read: true })),
      }));
      setNotice("readAll");
    } catch {
      setActionError("actionFailed");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <section aria-labelledby="notifications-title" className="mx-auto max-w-4xl">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">{t("notifications.eyebrow")}</p>
          <h1 id="notifications-title" className="mt-2 text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-text-secondary">{t("notifications.unreadCount", { count: unreadCount })}</p>
        </div>
        <button type="button" onClick={markAllRead} disabled={state.loading || unreadCount === 0 || isBusy} className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
          {markingAll ? t("notifications.markingAll") : t("notifications.markAllRead")}
        </button>
      </header>

      {actionError && <p role="alert" className="mb-4 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{t(`notifications.errors.${actionError}`)}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl bg-primary/10 p-4 text-sm text-primary">{t(`notifications.notices.${notice}`)}</p>}

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {state.loading ? <p role="status" className="p-6 text-sm text-text-secondary">{t("notifications.loading")}</p>
          : state.error ? <div role="alert" className="p-6">
            <p className="text-sm text-danger">{t(`notifications.errors.${state.error}`)}</p>
            <button type="button" onClick={retry} className="mt-4 min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold">{t("notifications.retry")}</button>
          </div>
            : state.items.length === 0 ? <p role="status" className="p-6 text-sm text-text-secondary">{t("notifications.empty")}</p>
              : <ul className="divide-y divide-border">{state.items.map((notification) => {
                const read = isRead(notification);
                const rowBusy = busyId === String(notification.id);
                return <li key={notification.id} className={`p-5 sm:p-6 ${read ? "bg-surface" : "bg-primary/[0.04]"}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <article className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold">{notification.title}</h2>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${read ? "bg-background text-text-secondary" : "bg-primary/10 text-primary"}`}>{t(read ? "notifications.read" : "notifications.unread")}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-text-secondary">{notification.message}</p>
                      <time dateTime={notification.created_at} className="mt-3 block text-xs text-text-secondary">{formatDate(notification.created_at, i18n.language)}</time>
                    </article>
                    {!read && <button type="button" onClick={() => markRead(notification)} disabled={isBusy} className="min-h-10 shrink-0 self-start rounded-lg border border-border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
                      {rowBusy ? t("notifications.markingRead") : t("notifications.markRead")}
                    </button>}
                  </div>
                </li>;
              })}</ul>}
      </div>
    </section>
  );
}

export default NotificationsFeature;
