import { Badge, Button, Card, EmptyState, SelectField, TextField } from "@/presentation/components/ui";

function DoctorWorkloadSection({ t, doctors, drafts, onDraftChange, busyId, onSave }) {
  if (doctors.length === 0) return <div id="admin-workload"><EmptyState title={t("adminIntakes.noDoctors")} /></div>;

  return (
    <div id="admin-workload" className="grid gap-4 lg:grid-cols-2">
      {doctors.map((doctor) => {
        const draft = drafts[doctor.id] || { availability: doctor.availability, capacity_limit: doctor.capacity_limit ?? "" };
        const load = Number(doctor.active_assignment_count || 0);
        const full = doctor.capacity_limit !== null && doctor.capacity_limit !== undefined && load >= Number(doctor.capacity_limit);
        return (
          <Card
            key={doctor.id}
            as="article"
            padding="sm"
            title={doctor.full_name}
            description={doctor.specialization}
            actions={full && <Badge tone="warning">{t("adminIntakes.capacityAlert")}</Badge>}
          >
            <p className="text-sm text-text-secondary">{t("adminIntakes.activeAssignments")}: {load} / {doctor.capacity_limit ?? t("adminIntakes.notConfigured")}</p>
            <p className="mt-1 text-sm text-text-secondary">{t("adminIntakes.openEmergencies")}: {doctor.open_emergency_alert_count || 0}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SelectField
                label={t("adminIntakes.availability")}
                value={draft.availability}
                onChange={(event) => onDraftChange(doctor.id, { ...draft, availability: event.target.value })}
                options={[
                  { value: "AVAILABLE", label: t("adminIntakes.available") },
                  { value: "UNAVAILABLE", label: t("adminIntakes.unavailable") },
                ]}
              />
              <TextField
                label={t("adminIntakes.capacity")}
                type="number"
                min="0"
                max="4294967295"
                value={draft.capacity_limit}
                onChange={(event) => onDraftChange(doctor.id, { ...draft, capacity_limit: event.target.value })}
              />
            </div>
            <Button variant="secondary" className="mt-4" loading={busyId === `doctor-${doctor.id}`} disabled={busyId !== null} onClick={() => onSave(doctor)}>
              {t("adminIntakes.saveWorkload")}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}

export default DoctorWorkloadSection;
