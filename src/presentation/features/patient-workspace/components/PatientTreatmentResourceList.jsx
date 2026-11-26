import { StatusBadge } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";

function PatientTreatmentResourceCard({ item, type, planTitle }) {
  const { dateTime } = useFormatDate();
  return (
    <li className="rounded-xl border border-border bg-background p-4">
      {planTitle && <p className="mb-3 text-xs font-semibold text-primary">{planTitle}</p>}
      {type === "medications" ? (
        <>
          <p className="font-semibold">{item.medication_name}</p>
          <p className="mt-2 text-sm text-text-secondary">{[item.dosage, item.frequency, item.duration].filter(Boolean).join(" · ")}</p>
          {item.instructions && <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.instructions}</p>}
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-semibold">{item.purpose}</p>
            <StatusBadge status={item.status} labelPrefix="patientTreatmentResources.appointmentStatuses" />
          </div>
          <p className="mt-2 text-sm text-text-secondary">{dateTime(item.appointment_date)}</p>
          {item.location && <p className="mt-2 text-sm">{item.location}</p>}
          {item.notes && <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.notes}</p>}
        </>
      )}
    </li>
  );
}

function PatientTreatmentResourceList({ items, type, planTitle }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <PatientTreatmentResourceCard
          key={`${item.treatment_plan_id}-${item.id}`}
          item={item}
          type={type}
          planTitle={planTitle ?? item.planTitle}
        />
      ))}
    </ul>
  );
}

export default PatientTreatmentResourceList;
