import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from "@/presentation/components/ui";
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
    <div id="patient-medications-appointments">
      <PageHeader eyebrow={t("patientTreatmentResources.eyebrow")} title={t("patientTreatmentResources.title")} description={t("patientTreatmentResources.description")} />

      {loading ? <LoadingState label={t("patientTreatmentResources.loading")} />
        : error ? <ErrorState message={error} onRetry={retry} retryLabel={t("patientTreatmentResources.retry")} />
          : (
            <div className="grid items-start gap-8 xl:grid-cols-2">
              <Card title={t("patientTreatmentResources.medications")} id="patient-medications">
                {medications.length === 0
                  ? <EmptyState title={t("patientTreatmentResources.emptyMedications")} />
                  : <PatientTreatmentResourceList items={medications} type="medications" t={t} />}
              </Card>

              <Card title={t("patientTreatmentResources.appointments")} id="patient-appointments">
                <h3 className="font-semibold">{t("patientTreatmentResources.upcoming")}</h3>
                <div className="mt-3">
                  {appointmentGroups.upcoming.length === 0
                    ? <EmptyState title={t("patientTreatmentResources.emptyUpcoming")} />
                    : <PatientTreatmentResourceList items={appointmentGroups.upcoming} type="appointments" t={t} />}
                </div>
                <h3 className="mt-6 font-semibold">{t("patientTreatmentResources.past")}</h3>
                <div className="mt-3">
                  {appointmentGroups.past.length === 0
                    ? <EmptyState title={t("patientTreatmentResources.emptyPast")} />
                    : <PatientTreatmentResourceList items={appointmentGroups.past} type="appointments" t={t} />}
                </div>
              </Card>
            </div>
          )}
    </div>
  );
}

export default PatientTreatmentResourcesSection;
