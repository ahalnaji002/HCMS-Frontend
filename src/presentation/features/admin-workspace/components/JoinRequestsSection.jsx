import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, DescriptionList, EmptyState, ErrorState, LoadingState, TextareaField } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";
import { useSpecializationLabel } from "@/presentation/hooks/useSpecializationLabel";
import useJoinRequests from "@/presentation/features/admin-workspace/useJoinRequests";

function RequestDetails({ request }) {
  const { t } = useTranslation();
  const { dateTime } = useFormatDate();
  const specializationLabel = useSpecializationLabel();
  const professional = request.request_type === "DOCTOR" ? request.doctor : request.ngo;
  const status = request.user?.account_status;

  return (
    <DescriptionList
      columns={2}
      items={[
        { label: t("adminJoinRequests.email"), value: request.user?.email },
        { label: t("adminJoinRequests.phone"), value: request.user?.phone },
        { label: t("adminJoinRequests.accountStatus"), value: status && t(`userManagement.statuses.${status}`, { defaultValue: status }) },
        { label: t("adminJoinRequests.submittedAt"), value: dateTime(request.created_at) },
        ...(request.request_type === "DOCTOR" ? [
          { label: t("adminJoinRequests.specialization"), value: specializationLabel(professional?.specialization) },
          { label: t("adminJoinRequests.licenseNumber"), value: professional?.license_number },
        ] : [
          { label: t("adminJoinRequests.organizationName"), value: professional?.organization_name },
          { label: t("adminJoinRequests.registrationNumber"), value: professional?.registration_number },
          { label: t("adminJoinRequests.address"), value: professional?.address },
          { label: t("adminJoinRequests.contactPhone"), value: professional?.contact_phone },
        ]),
      ]}
    />
  );
}

function JoinRequestsSection() {
  const { t } = useTranslation();
  const { dateTime } = useFormatDate();
  const {
    requests, selectedRequest, loading, detailLoading, busyId, activeRejectionId,
    rejectionDrafts, rejectionError, loadError, refresh, selectRequest,
    approve, reject, setActiveRejectionId, changeRejectionDraft,
  } = useJoinRequests();
  const detailRef = useRef(null);

  // Below xl the details panel sits under the list: bring it into view.
  function openDetails(request) {
    selectRequest(request);
    if (!window.matchMedia("(min-width: 1280px)").matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  if (loading) return <div id="admin-join-requests"><LoadingState label={t("adminJoinRequests.loading")} /></div>;
  if (loadError) return <div id="admin-join-requests"><ErrorState message={t(loadError)} onRetry={refresh} /></div>;
  if (requests.length === 0) return <div id="admin-join-requests"><EmptyState title={t("adminJoinRequests.empty")} /></div>;

  const busy = selectedRequest && busyId === selectedRequest.id;
  const draft = selectedRequest ? rejectionDrafts[selectedRequest.id] || "" : "";

  return (
    <div id="admin-join-requests" className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      <div className="space-y-3" aria-label={t("adminJoinRequests.pendingListLabel")}>
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={refresh}>{t("adminJoinRequests.refresh")}</Button>
        </div>
        {requests.map((request) => (
          <Card
            key={request.id}
            as="article"
            padding="sm"
            tone={selectedRequest?.id === request.id ? "info" : "default"}
            title={request.user?.full_name}
            titleLevel={2}
            description={request.user?.email}
            actions={<Badge tone="info">{t(`adminJoinRequests.type.${request.request_type}`)}</Badge>}
          >
            <p className="text-xs text-text-secondary">{t("adminJoinRequests.submittedAt")}: {dateTime(request.created_at)}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => openDetails(request)}>
              {t("adminJoinRequests.viewDetails")}
            </Button>
          </Card>
        ))}
      </div>

      <div ref={detailRef} className="scroll-mt-24 xl:sticky xl:top-24">
      <Card padding="sm">
        {!selectedRequest ? <p className="text-sm text-text-secondary">{t("adminJoinRequests.selectRequest")}</p>
          : detailLoading ? <LoadingState label={t("adminJoinRequests.loadingDetails")} />
            : (
              <article aria-labelledby="join-request-detail-title">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 id="join-request-detail-title" className="text-lg font-bold">{selectedRequest.user?.full_name}</h2>
                    <p className="mt-1 text-sm text-text-secondary">{t(`adminJoinRequests.type.${selectedRequest.request_type}`)}</p>
                  </div>
                  <Badge tone="warning">{t("adminJoinRequests.pending")}</Badge>
                </div>
                <div className="mt-5"><RequestDetails request={selectedRequest} /></div>
                <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
                  <Button loading={busy} loadingText={t("adminJoinRequests.working")} onClick={() => approve(selectedRequest)}>
                    {t("adminJoinRequests.approve")}
                  </Button>
                  <Button variant="danger-outline" disabled={busy} onClick={() => setActiveRejectionId(activeRejectionId === selectedRequest.id ? null : selectedRequest.id)}>
                    {t("adminJoinRequests.reject")}
                  </Button>
                </div>
                {activeRejectionId === selectedRequest.id && (
                  <div className="mt-5 rounded-xl border border-danger/20 bg-danger/5 p-4">
                    <TextareaField
                      label={t("adminJoinRequests.rejectionReason")}
                      rows={4}
                      maxLength={500}
                      value={draft}
                      onChange={(event) => changeRejectionDraft(selectedRequest.id, event.target.value)}
                      hint={`${draft.length}/500`}
                      error={rejectionError}
                    />
                    <Button variant="danger" className="mt-4" loading={busy} loadingText={t("adminJoinRequests.working")} onClick={() => reject(selectedRequest)}>
                      {t("adminJoinRequests.confirmReject")}
                    </Button>
                  </div>
                )}
              </article>
            )}
      </Card>
      </div>
    </div>
  );
}

export default JoinRequestsSection;
