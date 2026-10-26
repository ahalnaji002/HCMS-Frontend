function AssignedPatientsList({ t, patients, selectedPatientId, onSelect }) {
  return (
    <aside className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-bold">{t("doctorWorkspace.patients")}</h2>
      <div className="mt-4 space-y-2">
        {patients.map((patient) => (
          <button
            key={patient.id}
            type="button"
            onClick={() => onSelect(String(patient.id))}
            className={`w-full rounded-xl px-4 py-3 text-start text-sm font-semibold ${String(patient.id) === String(selectedPatientId) ? "bg-primary text-white" : "bg-background hover:bg-primary/10"}`}
          >
            {patient.full_name}
          </button>
        ))}
      </div>
    </aside>
  );
}

export default AssignedPatientsList;
