import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import PatientTreatmentResourceList from "@/presentation/features/patient-workspace/components/PatientTreatmentResourceList";

function currentHebronWallClock() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hebron",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
}

function splitAppointmentsByTime(appointments) {
  const now = currentHebronWallClock();
  return appointments.reduce((groups, appointment) => {
    const group = appointment.appointment_date >= now ? "upcoming" : "past";
    groups[group].push(appointment);
    return groups;
  }, { upcoming: [], past: [] });
}

function apiError(error, t) {
  const status = error.response?.status;
  if (status === 401) return t("patientTreatmentResources.errors.unauthorized");
  if (status === 403) return t("patientTreatmentResources.errors.forbidden");
  if (status === 404) return t("patientTreatmentResources.errors.notFound");
  if (status >= 500) return t("patientTreatmentResources.errors.server");
  if (!error.response) return t("patientTreatmentResources.errors.network");
  return t("patientTreatmentResources.errors.generic");
}

function PatientTreatmentResourcesSection() {
  const { t } = useTranslation();
  const { patientWorkspace } = useApplicationServices();
  const [medications, setMedications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResources = useCallback(async (isActive = () => true) => {
    try {
      const response = await patientWorkspace.listOwnTreatmentPlans();
      const plans = response.data.treatment_plans;
      const resources = await Promise.all(plans.map(async (plan) => {
        const [medicationResponse, appointmentResponse] = await Promise.all([
          patientWorkspace.listOwnTreatmentPlanMedications(plan.id),
          patientWorkspace.listOwnTreatmentPlanAppointments(plan.id),
        ]);
        return {
          medications: medicationResponse.data.medications.map((item) => ({ ...item, planTitle: plan.title })),
          appointments: appointmentResponse.data.appointments.map((item) => ({ ...item, planTitle: plan.title })),
        };
      }));
      if (!isActive()) return;
      setMedications(resources.flatMap((resource) => resource.medications));
      setAppointments(resources.flatMap((resource) => resource.appointments));
      setError("");
    } catch (requestError) {
      if (!isActive()) return;
      setMedications([]);
      setAppointments([]);
      setError(apiError(requestError, t));
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [patientWorkspace, t]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => loadResources(() => active));
    return () => { active = false; };
  }, [loadResources]);

  async function retry() {
    setLoading(true);
    setError("");
    await loadResources();
  }

  const appointmentGroups = splitAppointmentsByTime(appointments);

  return (
    <section id="patient-medications-appointments" className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div>
        <p className="text-sm font-semibold text-primary">{t("patientTreatmentResources.eyebrow")}</p>
        <h2 className="mt-1 text-xl font-bold">{t("patientTreatmentResources.title")}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{t("patientTreatmentResources.description")}</p>
      </div>

      {loading && <p role="status" className="mt-5 text-sm text-text-secondary">{t("patientTreatmentResources.loading")}</p>}
      {!loading && error && <div role="alert" className="mt-5 rounded-xl bg-danger/10 p-4 text-sm text-danger">
        <p>{error}</p>
        <button type="button" onClick={retry} disabled={loading} className="mt-3 min-h-10 rounded-lg border border-danger px-3 py-2 font-semibold disabled:opacity-60">{t("patientTreatmentResources.retry")}</button>
      </div>}

      {!loading && !error && <div className="mt-6 grid gap-8 xl:grid-cols-2">
        <section aria-labelledby="patient-medications-heading">
          <h3 id="patient-medications-heading" className="text-lg font-bold">{t("patientTreatmentResources.medications")}</h3>
          {medications.length === 0
            ? <p className="mt-4 rounded-xl border border-border bg-background p-4 text-sm text-text-secondary">{t("patientTreatmentResources.emptyMedications")}</p>
            : <PatientTreatmentResourceList items={medications} type="medications" t={t} />}
        </section>

        <section aria-labelledby="patient-appointments-heading">
          <h3 id="patient-appointments-heading" className="text-lg font-bold">{t("patientTreatmentResources.appointments")}</h3>
          <div className="mt-5">
            <h4 className="font-semibold">{t("patientTreatmentResources.upcoming")}</h4>
            {appointmentGroups.upcoming.length === 0
              ? <p className="mt-3 rounded-xl border border-border bg-background p-4 text-sm text-text-secondary">{t("patientTreatmentResources.emptyUpcoming")}</p>
              : <PatientTreatmentResourceList items={appointmentGroups.upcoming} type="appointments" t={t} />}
          </div>
          <div className="mt-6">
            <h4 className="font-semibold">{t("patientTreatmentResources.past")}</h4>
            {appointmentGroups.past.length === 0
              ? <p className="mt-3 rounded-xl border border-border bg-background p-4 text-sm text-text-secondary">{t("patientTreatmentResources.emptyPast")}</p>
              : <PatientTreatmentResourceList items={appointmentGroups.past} type="appointments" t={t} />}
          </div>
        </section>
      </div>}
    </section>
  );
}

export default PatientTreatmentResourcesSection;
