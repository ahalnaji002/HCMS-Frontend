import { Navigate, Route, Routes, Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RoleDashboard from "@/presentation/features/role-dashboard/RoleDashboard";
import useNgoAssistanceRequests from "@/presentation/features/ngo-workspace/useNgoAssistanceRequests";

function RequestList() {
  const { t } = useTranslation();
  const { requests, loading, errorKind, retry } = useNgoAssistanceRequests();

  return (
    <section aria-labelledby="ngo-assistance-requests-title">
      <header className="mb-6">
        <p className="text-sm font-semibold text-primary">{t("ngoAssistance.eyebrow")}</p>
        <h1 id="ngo-assistance-requests-title" className="mt-2 text-3xl font-bold">
          {t("roleNavigation.ngo.assistanceRequests")}
        </h1>
        <p className="mt-2 max-w-3xl leading-7 text-text-secondary">{t("ngoAssistance.description")}</p>
      </header>

      {loading ? <p role="status" aria-live="polite" className="rounded-xl border border-border bg-surface p-5 text-text-secondary">{t("ngoAssistance.loading")}</p>
        : errorKind ? <LoadError errorKind={errorKind} onRetry={retry} />
          : requests.length === 0 ? <p role="status" className="rounded-xl border border-border bg-surface p-5 text-text-secondary">{t("ngoAssistance.empty")}</p>
            : <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {requests.map((item) => <li key={item.id}>
                <RequestCard request={item} />
              </li>)}
            </ul>}
    </section>
  );
}

function RequestCard({ request }) {
  const { t, i18n } = useTranslation();
  return (
    <article className="h-full rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-bold">{t("ngoAssistance.requestNumber", { id: request.id })}</h2>
        <StatusBadge status={request.status} />
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <Metadata label={t("ngoAssistance.requestType")} value={request.request_type} />
        <Metadata label={t("ngoAssistance.patientReference")} value={request.patient_id} />
        <Metadata label={t("ngoAssistance.doctorReference")} value={request.doctor_id} />
        <Metadata label={t("ngoAssistance.submittedAt")} value={formatDate(request.submitted_at, i18n.language)} />
      </dl>
      <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{request.description}</p>
      <Link to={`/ngo/assistance-requests/${request.id}`} className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {t("ngoAssistance.viewDetails")}
      </Link>
    </article>
  );
}

function RequestDetail() {
  const { requestId } = useParams();
  const { t, i18n } = useTranslation();
  const { request, loading, errorKind, retry } = useNgoAssistanceRequests(requestId);

  if (loading) return <p role="status" aria-live="polite" className="rounded-xl border border-border bg-surface p-5 text-text-secondary">{t("ngoAssistance.loading")}</p>;
  if (errorKind) return <LoadError errorKind={errorKind} onRetry={retry} />;
  if (!request) return <LoadError errorKind="notFound" onRetry={retry} />;

  return (
    <section aria-labelledby="ngo-assistance-detail-title" className="mx-auto max-w-3xl">
      <Link to="/ngo/assistance-requests" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {t("ngoAssistance.backToList")}
      </Link>
      <article className="mt-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">{t("ngoAssistance.eyebrow")}</p>
            <h1 id="ngo-assistance-detail-title" className="mt-2 text-2xl font-bold">{t("ngoAssistance.requestNumber", { id: request.id })}</h1>
          </div>
          <StatusBadge status={request.status} />
        </div>
        <dl className="mt-7 grid gap-5 sm:grid-cols-2">
          <Metadata label={t("ngoAssistance.requestType")} value={request.request_type} />
          <Metadata label={t("ngoAssistance.patientReference")} value={request.patient_id} />
          <Metadata label={t("ngoAssistance.doctorReference")} value={request.doctor_id} />
          <Metadata label={t("ngoAssistance.submittedAt")} value={formatDate(request.submitted_at, i18n.language)} />
          <Metadata label={t("ngoAssistance.createdAt")} value={formatDate(request.created_at, i18n.language)} />
          <Metadata label={t("ngoAssistance.updatedAt")} value={formatDate(request.updated_at, i18n.language)} />
          {request.reviewed_at && <Metadata label={t("ngoAssistance.reviewedAt")} value={formatDate(request.reviewed_at, i18n.language)} />}
        </dl>
        <div className="mt-7 border-t border-border pt-6">
          <h2 className="text-lg font-bold">{t("ngoAssistance.descriptionLabel")}</h2>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-text-secondary">{request.description || "—"}</p>
        </div>
      </article>
    </section>
  );
}

function Metadata({ label, value }) {
  return <div className="min-w-0"><dt className="text-xs font-semibold text-text-secondary">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-text-primary">{value ?? "—"}</dd></div>;
}

function StatusBadge({ status }) {
  const { t } = useTranslation();
  return <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">{t(`ngoAssistance.statuses.${status}`, { defaultValue: status })}</span>;
}

function LoadError({ errorKind, onRetry }) {
  const { t } = useTranslation();
  const message = t(`ngoAssistance.errors.${errorKind}`);
  return <div role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-5">
    <p className="text-sm text-danger">{message}</p>
    <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{t("ngoAssistance.retry")}</button>
  </div>;
}

function formatDate(value, locale) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale || undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function NgoWorkspaceFeature() {
  const { t } = useTranslation();
  const overview = <><div className="mb-8"><p className="text-sm font-semibold text-primary">{t("ngoAssistance.eyebrow")}</p><h1 className="mt-2 text-3xl font-bold">{t("roleHome.roles.ngo.title")}</h1></div><RoleDashboard role="NGO" /></>;
  return <Routes>
    <Route index element={overview} />
    <Route path="assistance-requests" element={<RequestList />} />
    <Route path="assistance-requests/:requestId" element={<RequestDetail />} />
    <Route path="*" element={<Navigate to="/ngo" replace />} />
  </Routes>;
}

export default NgoWorkspaceFeature;
