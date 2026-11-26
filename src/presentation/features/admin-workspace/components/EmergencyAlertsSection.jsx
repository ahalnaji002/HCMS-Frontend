import EmergencyAlertContact from "@/presentation/components/common/EmergencyAlertContact";
import { Button, Card, EmptyState, ErrorState, LoadingState, SelectField, StatusBadge } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";

const EMERGENCY_SPECIALTIES = ["General Medicine", "Emergency Medicine"];

function EmergencyAlertsSection({ t, alerts, doctors, selectedDoctorIds, busyId, loading, loadError, onDoctorChange, onRefresh, onAssign }) {
  const { dateTime } = useFormatDate();
  const eligibleDoctors = doctors.filter((doctor) => EMERGENCY_SPECIALTIES.includes(doctor.specialization));
  const doctorOptions = eligibleDoctors.map((doctor) => ({
    value: String(doctor.id),
    label: `${doctor.full_name} — ${doctor.specialization} (${t(`adminIntakes.availabilityValues.${doctor.availability}`)}; ${doctor.active_assignment_count}/${doctor.capacity_limit ?? "∞"})`,
  }));

  return (
    <div id="admin-emergencies">
      {loading ? <LoadingState label={t("adminIntakes.emergencyLoading")} />
        : loadError ? <ErrorState message={t("adminIntakes.emergencyLoadError")} onRetry={onRefresh} retryLabel={t("adminIntakes.retry")} />
          : alerts.length === 0 ? <EmptyState title={t("adminIntakes.noEmergencies")} />
            : (
              <div className="space-y-4">
                {alerts.map((alert) => {
                  const pending = alert.status === "PENDING_ASSIGNMENT";
                  const busy = busyId === `emergency-${alert.id}`;
                  return (
                    <Card key={alert.id} as="article" padding="sm" tone={pending ? "danger" : "default"}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <EmergencyAlertContact t={t} phone={alert.phone} location={alert.location} />
                        <StatusBadge status={alert.status} labelPrefix="patientWorkspace.alertStatuses" />
                      </div>
                      {alert.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{alert.description}</p>}
                      {alert.sent_at && <p className="mt-2 text-xs text-text-secondary">{dateTime(alert.sent_at)}</p>}
                      {pending && (
                        <div className="mt-4 flex flex-wrap items-end gap-3">
                          <SelectField
                            label={t("adminIntakes.emergencyDoctor")}
                            placeholder={t("adminIntakes.selectDoctor")}
                            options={doctorOptions}
                            value={selectedDoctorIds[alert.id] || ""}
                            onChange={(event) => onDoctorChange(alert.id, event.target.value)}
                            className="min-w-64 flex-1"
                          />
                          <Button variant="danger" loading={busy} loadingText={t("adminIntakes.working")} disabled={busyId !== null || eligibleDoctors.length === 0} onClick={() => onAssign(alert)}>
                            {t("adminIntakes.assignEmergency")}
                          </Button>
                          {eligibleDoctors.length === 0 && <p className="w-full text-sm text-text-secondary">{t("adminIntakes.noEmergencyDoctors")}</p>}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
    </div>
  );
}

export default EmergencyAlertsSection;
