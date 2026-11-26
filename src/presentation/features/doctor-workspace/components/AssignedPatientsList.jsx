import { Card, SelectableCard } from "@/presentation/components/ui";

// Compact list that sticks beside the patient file on wide screens instead of
// stretching to the height of the whole page (UX-14).
function AssignedPatientsList({ t, patients, selectedPatientId, onSelect }) {
  return (
    <Card as="aside" padding="sm" title={t("doctorWorkspace.patients")} className="self-start lg:sticky lg:top-24">
      <div className="space-y-2">
        {patients.map((patient) => (
          <SelectableCard
            key={patient.id}
            title={patient.full_name}
            selected={String(patient.id) === String(selectedPatientId)}
            onClick={() => onSelect(String(patient.id))}
          />
        ))}
      </div>
    </Card>
  );
}

export default AssignedPatientsList;
