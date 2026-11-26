import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { Alert, Button, ErrorState, LoadingState, PageHeader, useToast } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";
import { useAuth } from "@/presentation/context/useAuth";
import { serverMessageKey } from "@/presentation/utils/serverMessages";

function getErrorKind(error, action) {
  const status = error.response?.status;
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  if (status === 400) return "validation";
  return action === "load" ? "loadFailed" : "sendFailed";
}

function isUnreadReceivedMessage(message, userId) {
  return String(message.receiver_id) === String(userId) && (message.is_read === false || Number(message.is_read) === 0);
}

function MessagingFeature({ role }) {
  const { t } = useTranslation();
  const { dateTime } = useFormatDate();
  const toast = useToast();
  const { messaging } = useApplicationServices();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [conversationState, setConversationState] = useState({ loading: true, error: "" });
  const [reloadKey, setReloadKey] = useState(0);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [historyReloadKey, setHistoryReloadKey] = useState(0);
  const [historyState, setHistoryState] = useState({ key: "", messages: [], error: "", readWarning: false });

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => String(conversation.participant.id) === selectedUserId) ?? null,
    [conversations, selectedUserId],
  );

  const retryConversations = useCallback(() => {
    setConversationState({ loading: true, error: "" });
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let active = true;
    messaging.listConversations()
      .then((response) => {
        if (!active) return;
        const list = response?.data?.conversations ?? [];
        setConversations(list);
        setConversationState({ loading: false, error: "" });
        setSelectedUserId((currentId) => (
          currentId && list.some((conversation) => String(conversation.participant.id) === currentId)
            ? currentId
            : ""
        ));
      })
      .catch((error) => {
        if (active) setConversationState({ loading: false, error: getErrorKind(error, "load") });
      })
      .finally(() => {
        if (active) setConversationState((current) => ({ ...current, loading: false }));
      });
    return () => { active = false; };
  }, [messaging, reloadKey]);

  useEffect(() => {
    if (!selectedUserId) return undefined;
    let active = true;
    const requestKey = `${selectedUserId}:${historyReloadKey}`;
    messaging.getConversationHistory(selectedUserId)
      .then(async (response) => {
        const history = response?.data?.messages ?? [];
        if (active) setHistoryState({ key: requestKey, messages: history, error: "", readWarning: false });
        const unread = history.filter((message) => isUnreadReceivedMessage(message, user.id));
        const results = await Promise.allSettled(unread.map((message) => messaging.markMessageRead(message.id)));
        if (!active) return;
        const readMessages = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value?.data?.message)
          .filter(Boolean);
        if (readMessages.length) {
          const readById = new Map(readMessages.map((message) => [String(message.id), message]));
          setHistoryState((current) => ({ ...current, messages: current.messages.map((message) => readById.get(String(message.id)) ?? message) }));
        }
        if (results.some((result) => result.status === "rejected")) setHistoryState((current) => ({ ...current, readWarning: true }));
      })
      .catch((error) => {
        if (active) setHistoryState({ key: requestKey, messages: [], error: getErrorKind(error, "load"), readWarning: false });
      });
    return () => { active = false; };
  }, [messaging, selectedUserId, user.id, historyReloadKey]);

  const conversationLoading = conversationState.loading;
  const listError = conversationState.error;
  const historyKey = `${selectedUserId}:${historyReloadKey}`;
  const historyBelongsToSelection = Boolean(selectedUserId) && historyState.key === historyKey;
  const messages = historyBelongsToSelection ? historyState.messages : [];
  const historyLoading = Boolean(selectedUserId) && !historyBelongsToSelection;
  const historyError = historyBelongsToSelection ? historyState.error : "";
  const readWarning = historyBelongsToSelection && historyState.readWarning;

  function selectConversation(participantId) {
    setSelectedUserId(String(participantId));
    setSendError("");
    setMessageText("");
    setReadOnly(false);
  }

  function retryHistory() {
    setHistoryReloadKey((key) => key + 1);
  }

  async function handleSend(event) {
    event.preventDefault();
    const text = messageText.trim();
    if (!selectedConversation || !text || sending || readOnly) return;
    if (new TextEncoder().encode(text).length > 65535) {
      setSendError("validation");
      return;
    }

    setSending(true);
    setSendError("");
    try {
      const response = await messaging.sendMessage({
        receiver_id: selectedConversation.participant.id,
        message_text: text,
      });
      const sentMessage = response?.data?.message;
      if (sentMessage) setHistoryState((current) => ({ ...current, messages: [...current.messages, sentMessage] }));
      setMessageText("");
      toast.success({ key: "messaging.sent" });
      retryConversations();
    } catch (error) {
      const messageKey = serverMessageKey(error.response?.data?.message);
      setSendError(messageKey === "serverMessages.activeAssignmentRequired"
        ? "activeAssignmentRequired"
        : getErrorKind(error, "send"));
      if (error.response?.status === 403) setReadOnly(true);
      if (error.response?.status === 404) retryConversations();
    } finally {
      setSending(false);
    }
  }

  const roleKey = role.toLowerCase();
  const title = t(`roleNavigation.${roleKey}.messages`);

  return (
    <section aria-labelledby="messaging-title" className="mx-auto max-w-6xl">
      <PageHeader id="messaging-title" eyebrow={t("messaging.eyebrow")} title={title} description={t("messaging.description")} />

      <div className="grid min-h-[32rem] overflow-hidden rounded-2xl border border-border bg-surface md:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)]">
        <aside aria-label={t("messaging.conversationList")} className={`${selectedUserId ? "hidden md:block" : "block"} border-b border-border md:border-b-0 md:border-e`}>
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <h2 className="font-bold">{t("messaging.conversationList")}</h2>
            <Button variant="secondary" size="sm" onClick={retryConversations} disabled={conversationLoading}>{t("messaging.refresh")}</Button>
          </div>
          {conversationLoading ? <LoadingState label={t("messaging.loadingConversations")} />
            : listError ? <LoadError t={t} errorKind={listError} onRetry={retryConversations} />
              : conversations.length === 0 ? <p role="status" className="p-5 text-sm leading-6 text-text-secondary">{t("messaging.emptyConversations")}</p>
                : <ul className="divide-y divide-border">{conversations.map((conversation) => (
                  <li key={conversation.participant.id}>
                    <button
                      type="button"
                      aria-pressed={selectedUserId === String(conversation.participant.id)}
                      onClick={() => selectConversation(conversation.participant.id)}
                      className="w-full px-4 py-4 text-start hover:bg-background focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary aria-pressed:bg-primary/10"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate font-semibold">{conversation.participant.full_name}</span>
                        <span className="shrink-0 text-xs text-text-secondary">{dateTime(conversation.last_message?.sent_at)}</span>
                      </span>
                      <span className="mt-1 block text-xs text-text-secondary">{t(`roleHome.roles.${conversation.participant.role.toLowerCase()}.label`)}</span>
                      <span className="mt-2 block truncate text-sm text-text-secondary">{conversation.last_message?.message_text || ""}</span>
                    </button>
                  </li>
                ))}</ul>}
        </aside>

        <div className={`${selectedUserId ? "flex" : "hidden md:flex"} min-h-[32rem] min-w-0 flex-col`}>
          {selectedConversation ? <>
            <header className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-6">
              <Button variant="secondary" size="sm" onClick={() => setSelectedUserId("")} className="md:hidden">{t("messaging.backToConversations")}</Button>
              <div className="min-w-0"><h2 className="truncate font-bold">{selectedConversation.participant.full_name}</h2><p className="mt-1 text-xs text-text-secondary">{t(`roleHome.roles.${selectedConversation.participant.role.toLowerCase()}.label`)}</p></div>
            </header>
            {historyLoading ? <LoadingState className="flex-1" label={t("messaging.loadingMessages")} />
              : historyError ? <LoadError t={t} errorKind={historyError} onRetry={retryHistory} />
                : <>
                  <div aria-live="polite" aria-label={t("messaging.messagesLabel")} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                    {readWarning && <p role="status" className="rounded-lg bg-warning/10 p-3 text-sm text-text-secondary">{t("messaging.readWarning")}</p>}
                    {messages.length === 0 ? <p role="status" className="py-8 text-center text-sm text-text-secondary">{t("messaging.emptyMessages")}</p>
                      : messages.map((message) => {
                        const ownMessage = String(message.sender_id) === String(user.id);
                        return <article key={message.id} className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${ownMessage ? "bg-primary text-white" : "border border-border bg-background text-text-primary"}`}>
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.message_text}</p>
                            <time dateTime={message.sent_at} className={`mt-2 block text-xs ${ownMessage ? "text-white/80" : "text-text-secondary"}`}>{dateTime(message.sent_at)}</time>
                          </div>
                        </article>;
                      })}
                  </div>
                  {sendError && <Alert tone="error" className="mx-4 mb-3 sm:mx-6">{t(`messaging.errors.${sendError}`)}</Alert>}
                  {readOnly && <p role="status" className="mx-4 mb-3 rounded-lg bg-background p-3 text-sm text-text-secondary sm:mx-6">{t("messaging.readOnly")}</p>}
                  <form onSubmit={handleSend} className="border-t border-border p-4 sm:p-6">
                    <label htmlFor="message-composer" className="sr-only">{t("messaging.messageLabel")}</label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <textarea id="message-composer" rows={3} value={messageText} onChange={(event) => { setMessageText(event.target.value); setSendError(""); }} disabled={readOnly || sending} placeholder={t("messaging.messagePlaceholder")} className="min-h-24 min-w-0 flex-1 resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60" />
                      <Button type="submit" disabled={readOnly || !messageText.trim() || historyLoading} loading={sending} loadingText={t("messaging.sending")}>{t("messaging.send")}</Button>
                    </div>
                  </form>
                </>}
          </> : <div className="hidden flex-1 items-center justify-center p-8 text-center text-sm text-text-secondary md:flex">{t("messaging.selectConversation")}</div>}
        </div>
      </div>
    </section>
  );
}

function LoadError({ t, errorKind, onRetry }) {
  return <ErrorState className="m-4" message={t(`messaging.errors.${errorKind}`)} onRetry={onRetry} retryLabel={t("messaging.retry")} />;
}

export default MessagingFeature;
