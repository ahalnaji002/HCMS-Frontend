function PatientTreatmentResourceCard({ item, type, planTitle, t }) {
  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      {planTitle && <p className="mb-3 text-xs font-semibold text-primary">{planTitle}</p>}
      {type === "medications" ? <>
        <p className="font-semibold">{item.medication_name}</p>
        <p className="mt-2 text-sm text-text-secondary">{item.dosage} · {item.frequency}{item.duration ? ` · ${item.duration}` : ""}</p>
        {item.instructions && <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.instructions}</p>}
      </> : <>
        <p className="font-semibold">{item.purpose}</p>
        <p className="mt-2 text-sm text-text-secondary">{item.appointment_date}</p>
        {item.location && <p className="mt-2 text-sm">{item.location}</p>}
        {item.notes && <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.notes}</p>}
        <p className="mt-2 text-xs text-text-secondary">{t(`patientTreatmentResources.appointmentStatuses.${item.status}`, { defaultValue: item.status })}</p>
      </>}
    </li>
  );
}

function PatientTreatmentResourceList({ items, type, planTitle, t }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => <PatientTreatmentResourceCard
        key={`${item.treatment_plan_id}-${item.id}`}
        item={item}
        type={type}
        planTitle={planTitle ?? item.planTitle}
        t={t}
      />)}
    </ul>
  );
}

export default PatientTreatmentResourceList;
