import { useTranslation } from "react-i18next";
import useJoinRequests from "@/presentation/features/admin-workspace/useJoinRequests";

function formatDate(value, locale) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function RequestMetadata({ request }) {
  const { t, i18n } = useTranslation();
  const professional = request.request_type === "DOCTOR" ? request.doctor : request.ngo;

  return (
    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
      <Metadata label={t("adminJoinRequests.email")} value={request.user?.email} />
      <Metadata label={t("adminJoinRequests.phone")} value={request.user?.phone} />
      <Metadata label={t("adminJoinRequests.accountStatus")} value={request.user?.account_status} />
      <Metadata label={t("adminJoinRequests.submittedAt")} value={formatDate(request.created_at, i18n.language)} />
      {request.request_type === "DOCTOR" ? (
        <>
          <Metadata label={t("adminJoinRequests.specialization")} value={professional?.specialization} />
          <Metadata label={t("adminJoinRequests.licenseNumber")} value={professional?.license_number} />
        </>
      ) : (
        <>
          <Metadata label={t("adminJoinRequests.organizationName")} value={professional?.organization_name} />
          <Metadata label={t("adminJoinRequests.registrationNumber")} value={professional?.registration_number} />
          <Metadata label={t("adminJoinRequests.address")} value={professional?.address} />
          <Metadata label={t("adminJoinRequests.contactPhone")} value={professional?.contact_phone} />
        </>
      )}
    </dl>
  );
}

function Metadata({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <dt className="text-xs font-semibold text-text-secondary">{label}</dt>
      <dd className="mt-1 break-words text-text-primary">{value || "—"}</dd>
    </div>
  );
}

function JoinRequestsSection() {
  const { t, i18n } = useTranslation();
  const {
    requests, selectedRequest, loading, detailLoading, busyId, activeRejectionId,
    rejectionDrafts, rejectionError, error, notice, refresh, selectRequest,
    approve, reject, setActiveRejectionId, changeRejectionDraft,
  } = useJoinRequests();

  return (
    <section id="admin-join-requests" className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">{t("adminJoinRequests.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-bold">{t("adminJoinRequests.title")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">{t("adminJoinRequests.description")}</p>
        </div>
        <button type="button" onClick={refresh} className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          {t("adminJoinRequests.refresh")}
        </button>
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl bg-primary/10 p-4 text-sm text-primary">{notice}</p>}

      {loading ? <p className="mt-6 text-sm text-text-secondary">{t("adminJoinRequests.loading")}</p> : requests.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-background p-5 text-sm text-text-secondary">{t("adminJoinRequests.empty")}</p>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <div className="space-y-3" aria-label={t("adminJoinRequests.pendingListLabel")}>
            {requests.map((request) => (
              <article key={request.id} className={`rounded-xl border p-4 ${selectedRequest?.id === request.id ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{request.user?.full_name}</p>
                    <p className="mt-1 text-sm text-text-secondary">{request.user?.email}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{t(`adminJoinRequests.type.${request.request_type}`)}</span>
                </div>
                <p className="mt-3 text-xs text-text-secondary">{t("adminJoinRequests.submittedAt")}: {formatDate(request.created_at, i18n.language)}</p>
                <button type="button" onClick={() => selectRequest(request)} className="mt-4 min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  {t("adminJoinRequests.viewDetails")}
                </button>
              </article>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-background p-5">
            {!selectedRequest ? <p className="text-sm text-text-secondary">{t("adminJoinRequests.selectRequest")}</p> : detailLoading ? <p className="text-sm text-text-secondary">{t("adminJoinRequests.loadingDetails")}</p> : (
              <article aria-labelledby="join-request-detail-title">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 id="join-request-detail-title" className="text-lg font-bold">{selectedRequest.user?.full_name}</h3>
                    <p className="mt-1 text-sm text-text-secondary">{t(`adminJoinRequests.type.${selectedRequest.request_type}`)}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{t("adminJoinRequests.pending")}</span>
                </div>
                <RequestMetadata request={selectedRequest} />
                <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
                  <button type="button" disabled={busyId === selectedRequest.id} onClick={() => approve(selectedRequest)} className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    {busyId === selectedRequest.id ? t("adminJoinRequests.working") : t("adminJoinRequests.approve")}
                  </button>
                  <button type="button" disabled={busyId === selectedRequest.id} onClick={() => setActiveRejectionId(activeRejectionId === selectedRequest.id ? null : selectedRequest.id)} className="min-h-11 rounded-lg border border-danger/40 px-4 py-2 text-sm font-semibold text-danger disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger">
                    {t("adminJoinRequests.reject")}
                  </button>
                </div>
                {activeRejectionId === selectedRequest.id && (
                  <div className="mt-5 rounded-xl border border-danger/20 bg-danger/5 p-4">
                    <label htmlFor={`rejection-${selectedRequest.id}`} className="block text-sm font-semibold">{t("adminJoinRequests.rejectionReason")}</label>
                    <textarea id={`rejection-${selectedRequest.id}`} rows={4} maxLength={500} value={rejectionDrafts[selectedRequest.id] || ""} onChange={(event) => changeRejectionDraft(selectedRequest.id, event.target.value)} aria-invalid={Boolean(rejectionError)} aria-describedby={rejectionError ? `rejection-error-${selectedRequest.id}` : undefined} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15" />
                    <p className="mt-2 text-xs text-text-secondary">{(rejectionDrafts[selectedRequest.id] || "").length}/500</p>
                    {rejectionError && <p id={`rejection-error-${selectedRequest.id}`} className="mt-2 text-sm text-danger">{rejectionError}</p>}
                    <button type="button" disabled={busyId === selectedRequest.id} onClick={() => reject(selectedRequest)} className="mt-4 min-h-11 rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger">
                      {busyId === selectedRequest.id ? t("adminJoinRequests.working") : t("adminJoinRequests.confirmReject")}
                    </button>
                  </div>
                )}
              </article>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default JoinRequestsSection;
