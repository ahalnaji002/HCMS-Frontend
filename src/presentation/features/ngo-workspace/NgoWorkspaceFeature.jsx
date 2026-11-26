import { useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { ButtonLink, Card, ConfirmAction, DescriptionList, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, useToast } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";
import RoleDashboard from "@/presentation/features/role-dashboard/RoleDashboard";
import NotificationsFeature from "@/presentation/features/notifications/NotificationsFeature";
import NgoResourceAllocationsSection from "@/presentation/features/ngo-workspace/NgoResourceAllocationsSection";
import useNgoAssistanceRequests from "@/presentation/features/ngo-workspace/useNgoAssistanceRequests";

const STATUS_TRANSITIONS = {
  PENDING: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["COMPLETED"],
};

const STATUS_ACTION_KEYS = {
  UNDER_REVIEW: "startReview",
  APPROVED: "approve",
  REJECTED: "reject",
  COMPLETED: "complete",
};

// UX-16: an NGO sees the case number (the request number) only, never the
// patient's or doctor's internal IDs. Patient details may be added later.
function RequestList() {
  const { t } = useTranslation();
  const { requests, loading, errorKind, retry } = useNgoAssistanceRequests();

  return (
    <section aria-labelledby="ngo-assistance-requests-title">
      <PageHeader id="ngo-assistance-requests-title" eyebrow={t("ngoAssistance.eyebrow")} title={t("roleNavigation.ngo.assistanceRequests")} description={t("ngoAssistance.description")} />

      {loading ? <LoadingState label={t("ngoAssistance.loading")} />
        : errorKind ? <ErrorState message={t(`ngoAssistance.errors.${errorKind}`)} onRetry={retry} retryLabel={t("ngoAssistance.retry")} />
          : requests.length === 0 ? <EmptyState title={t("ngoAssistance.empty")} />
            : (
              <ul className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {requests.map((item) => <li key={item.id}><RequestCard request={item} /></li>)}
              </ul>
            )}
    </section>
  );
}

function RequestCard({ request }) {
  const { t } = useTranslation();
  const { dateTime } = useFormatDate();
  return (
    <Card
      as="article"
      padding="sm"
      title={t("ngoAssistance.requestNumber", { id: request.id })}
      actions={<StatusBadge status={request.status} labelPrefix="ngoAssistance.statuses" />}
    >
      <DescriptionList
        items={[
          { label: t("ngoAssistance.requestType"), value: request.request_type },
          { label: t("ngoAssistance.submittedAt"), value: dateTime(request.submitted_at) },
        ]}
      />
      <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{request.description}</p>
      <ButtonLink to={`/ngo/assistance-requests/${request.id}`} className="mt-5">{t("ngoAssistance.viewDetails")}</ButtonLink>
    </Card>
  );
}

function RequestDetail() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const { dateTime } = useFormatDate();
  const { ngoWorkspace } = useApplicationServices();
  const toast = useToast();
  const { request, resources, resourceErrorKind, loading, errorKind, retry } = useNgoAssistanceRequests(requestId);
  const [isUpdating, setIsUpdating] = useState(false);

  const back = <ButtonLink to="/ngo/assistance-requests" variant="ghost" size="sm" className="mb-4">{t("ngoAssistance.backToList")}</ButtonLink>;
  if (loading) return <>{back}<LoadingState label={t("ngoAssistance.loading")} /></>;
  if (errorKind || !request) return <>{back}<ErrorState message={t(`ngoAssistance.errors.${errorKind || "notFound"}`)} onRetry={retry} retryLabel={t("ngoAssistance.retry")} /></>;

  const availableTransitions = (STATUS_TRANSITIONS[request.status] ?? []).filter(
    (status) => status !== "COMPLETED" || (!resourceErrorKind && resources.length > 0),
  );

  async function updateStatus(nextStatus) {
    setIsUpdating(true);
    try {
      await ngoWorkspace.updateAssistanceRequestStatus(request.id, nextStatus);
      toast.success({ key: "ngoAssistance.statusUpdated" });
      retry();
    } catch (error) {
      const statusCode = error.response?.status;
      const serverMessage = error.response?.data?.message;
      const messageKey = serverMessage === "At least one resource allocation is required before completing the assistance request."
        ? "completionNeedsAllocation"
        : statusCode === 400 ? "statusValidation"
          : statusCode === 403 ? "statusForbidden"
            : statusCode === 404 ? "statusNotFound"
              : statusCode === 409 ? "statusConflict"
                : "statusUpdateFailed";
      toast.error({ key: `ngoAssistance.errors.${messageKey}` });
      if (statusCode === 409) retry();
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section aria-labelledby="ngo-assistance-detail-title" className="mx-auto max-w-3xl">
      {back}
      <Card as="article">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">{t("ngoAssistance.eyebrow")}</p>
            <h1 id="ngo-assistance-detail-title" className="mt-1 text-2xl font-bold">{t("ngoAssistance.requestNumber", { id: request.id })}</h1>
          </div>
          <StatusBadge status={request.status} labelPrefix="ngoAssistance.statuses" />
        </div>
        <DescriptionList
          className="mt-6"
          columns={2}
          items={[
            { label: t("ngoAssistance.requestType"), value: request.request_type },
            { label: t("ngoAssistance.submittedAt"), value: dateTime(request.submitted_at) },
            { label: t("ngoAssistance.updatedAt"), value: dateTime(request.updated_at) },
            { label: t("ngoAssistance.reviewedAt"), value: dateTime(request.reviewed_at) },
          ]}
        />
        <div className="mt-7 border-t border-border pt-6">
          <h2 className="text-lg font-bold">{t("ngoAssistance.descriptionLabel")}</h2>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-text-secondary">{request.description}</p>
        </div>
        {(availableTransitions.length > 0 || (!resourceErrorKind && request.status === "APPROVED" && resources.length === 0)) && (
          <div className="mt-7 border-t border-border pt-6">
            <h2 className="text-lg font-bold">{t("ngoAssistance.reviewActions")}</h2>
            {request.status === "APPROVED" && resources.length === 0 ? (
              <p role="status" className="mt-3 rounded-xl bg-background p-4 text-sm text-text-secondary">{t("ngoAssistance.allocationRequired")}</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3">
                {availableTransitions.map((status) => (
                  <ConfirmAction
                    key={status}
                    tone={status === "REJECTED" ? "danger" : "primary"}
                    label={t(`ngoAssistance.actions.${STATUS_ACTION_KEYS[status]}`)}
                    title={t(`ngoAssistance.confirm.${status}`)}
                    confirmLabel={t("ui.confirm")}
                    loading={isUpdating}
                    disabled={isUpdating}
                    onConfirm={() => updateStatus(status)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <NgoResourceAllocationsSection request={request} resources={resources} resourceErrorKind={resourceErrorKind} onRetry={retry} />
      </Card>
    </section>
  );
}

function NgoWorkspaceFeature() {
  const { t } = useTranslation();
  const overview = <RoleDashboard role="NGO" eyebrow={t("ngoAssistance.eyebrow")} />;
  return <Routes>
    <Route index element={overview} />
    <Route path="assistance-requests" element={<RequestList />} />
    <Route path="assistance-requests/:requestId" element={<RequestDetail />} />
    <Route path="notifications" element={<NotificationsFeature role="NGO" />} />
    <Route path="*" element={<Navigate to="/ngo" replace />} />
  </Routes>;
}

export default NgoWorkspaceFeature;
