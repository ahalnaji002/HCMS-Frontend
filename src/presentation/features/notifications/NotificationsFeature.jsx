import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, useToast } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";

function isRead(notification) {
  return notification.is_read === true || notification.is_read === 1 || notification.is_read === "1";
}

// The server stores English text. When it also sends the event, build the
// text in the reader's language; otherwise show what the server sent.
function notificationText(t, notification) {
  const { event, event_status: status, reference_id: id } = notification;
  if (!event || !t(`notifications.events.${event}.title`, { defaultValue: "" })) {
    return { title: notification.title, message: notification.message };
  }
  const values = { id, status: status ? t(`notifications.statuses.${status}`, { defaultValue: status }) : "" };
  return {
    title: t(`notifications.events.${event}.title`, values),
    message: t(`notifications.events.${event}.message`, values),
  };
}

function getErrorKind(error) {
  if (!error.response) return "network";
  if (error.response.status === 401) return "unauthorized";
  if (error.response.status === 403) return "forbidden";
  return "loadFailed";
}

function NotificationsFeature({ role }) {
  const { t } = useTranslation();
  const { dateTime } = useFormatDate();
  const { notifications } = useApplicationServices();
  const toast = useToast();
  const [state, setState] = useState({ loading: true, error: "", items: [] });
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

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
  const unreadCount = state.items.filter((notification) => !isRead(notification)).length;
  const isBusy = Boolean(busyId) || markingAll;

  function retry() {
    setState((current) => ({ ...current, loading: true, error: "" }));
    setReloadKey((key) => key + 1);
  }

  async function markRead(notification) {
    if (isBusy || isRead(notification)) return;
    setBusyId(String(notification.id));
    try {
      const response = await notifications.markNotificationRead(notification.id);
      const updated = response?.data?.notification ?? { ...notification, is_read: true };
      setState((current) => ({
        ...current,
        items: current.items.map((item) => (String(item.id) === String(notification.id) ? updated : item)),
      }));
      toast.success({ key: "notifications.notices.readOne" });
    } catch {
      toast.error({ key: "notifications.errors.actionFailed" });
    } finally {
      setBusyId("");
    }
  }

  async function markAllRead() {
    if (isBusy || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await notifications.markAllNotificationsRead();
      setState((current) => ({
        ...current,
        items: current.items.map((notification) => (isRead(notification) ? notification : { ...notification, is_read: true })),
      }));
      toast.success({ key: "notifications.notices.readAll" });
    } catch {
      toast.error({ key: "notifications.errors.actionFailed" });
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <section aria-labelledby="notifications-title" className="mx-auto max-w-4xl">
      <PageHeader
        id="notifications-title"
        eyebrow={t("notifications.eyebrow")}
        title={t(`roleNavigation.${roleKey}.notifications`)}
        description={t("notifications.unreadCount", { count: unreadCount })}
        actions={(
          <Button variant="secondary" onClick={markAllRead} disabled={state.loading || unreadCount === 0 || isBusy} loading={markingAll} loadingText={t("notifications.markingAll")}>
            {t("notifications.markAllRead")}
          </Button>
        )}
      />

      {state.loading ? <LoadingState label={t("notifications.loading")} />
        : state.error ? <ErrorState message={t(`notifications.errors.${state.error}`)} onRetry={retry} retryLabel={t("notifications.retry")} />
          : state.items.length === 0 ? <EmptyState title={t("notifications.empty")} />
            : (
              <Card padding="sm">
                <ul className="divide-y divide-border">
                  {state.items.map((notification) => {
                    const read = isRead(notification);
                    const text = notificationText(t, notification);
                    return (
                      <li key={notification.id} className={`-mx-2 rounded-xl px-2 py-4 first:pt-2 last:pb-2 ${read ? "" : "bg-primary/[0.04]"}`}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <article className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="font-bold">{text.title}</h2>
                              <Badge tone={read ? "neutral" : "info"}>{t(read ? "notifications.read" : "notifications.unread")}</Badge>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-text-secondary">{text.message}</p>
                            <time dateTime={notification.created_at} className="mt-3 block text-xs text-text-secondary">{dateTime(notification.created_at)}</time>
                          </article>
                          {!read && (
                            <Button variant="secondary" size="sm" loading={busyId === String(notification.id)} loadingText={t("notifications.markingRead")} disabled={isBusy} onClick={() => markRead(notification)}>
                              {t("notifications.markRead")}
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
    </section>
  );
}

export default NotificationsFeature;
