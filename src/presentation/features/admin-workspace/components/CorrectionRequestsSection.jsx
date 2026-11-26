import { Button, Card, EmptyState, StatusBadge, TextareaField } from "@/presentation/components/ui";

function CorrectionRequestsSection({ t, requests, responses, onResponseChange, busyId, onResolve }) {
  if (requests.length === 0) return <div id="admin-support"><EmptyState title={t("adminIntakes.noCorrections")} /></div>;

  return (
    <div id="admin-support" className="space-y-4">
      {requests.map((request) => {
        const busy = busyId === `correction-${request.id}`;
        return (
          <Card
            key={request.id}
            as="article"
            padding="sm"
            title={request.patient_name}
            description={request.patient_email}
            actions={<StatusBadge status={request.status} labelPrefix="adminIntakes.correctionStatus" />}
          >
            <p className="whitespace-pre-wrap text-sm leading-6">{request.message}</p>
            {request.admin_response && (
              <p className="mt-3 rounded-xl bg-background p-3 text-sm leading-6">
                <span className="font-semibold">{t("adminIntakes.adminResponse")}: </span>{request.admin_response}
              </p>
            )}
            {request.status === "OPEN" && (
              <div className="mt-4 space-y-3">
                <TextareaField
                  label={t("adminIntakes.adminResponse")}
                  rows={3}
                  maxLength={10000}
                  placeholder={t("adminIntakes.responsePlaceholder")}
                  value={responses[request.id] || ""}
                  onChange={(event) => onResponseChange(request.id, event.target.value)}
                />
                <Button loading={busy} loadingText={t("adminIntakes.working")} disabled={busyId !== null} onClick={() => onResolve(request)}>
                  {t("adminIntakes.resolveCorrection")}
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export default CorrectionRequestsSection;
