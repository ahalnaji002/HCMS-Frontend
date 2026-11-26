import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import {
  Button, Card, EmptyState, ErrorState, LoadingState, SelectableCard, SelectField, StatusBadge,
  TextareaField, TextField, useToast,
} from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";
import TreatmentPlanResourcesSection from "./TreatmentPlanResourcesSection";

function errorKey(error) {
  const status = error.response?.status;
  if (status === 400) return "doctorTreatmentPlans.errors.validation";
  if (status === 401) return "doctorTreatmentPlans.errors.unauthorized";
  if (status === 403) return "doctorTreatmentPlans.errors.forbidden";
  if (status === 404) return "doctorTreatmentPlans.errors.notFound";
  if (status === 409) return "doctorTreatmentPlans.errors.conflict";
  if (status >= 500) return "doctorTreatmentPlans.errors.server";
  if (!error.response) return "doctorTreatmentPlans.errors.network";
  return "doctorTreatmentPlans.errors.unknown";
}

function formFromPlan(plan) {
  return {
    title: plan?.title || "",
    general_instructions: plan?.general_instructions || "",
    start_date: plan?.start_date || "",
    end_date: plan?.end_date || "",
    status: plan?.status || "ACTIVE",
  };
}

function DoctorTreatmentPlansSection({ patientId }) {
  const { t } = useTranslation();
  const { doctorWorkspace } = useApplicationServices();
  const toast = useToast();
  const { date } = useFormatDate();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [mode, setMode] = useState("none");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    doctorWorkspace.listPatientTreatmentPlans(patientId)
      .then((response) => {
        if (active) setPlans(response.data.treatment_plans);
      })
      .catch((requestError) => {
        if (active) {
          setPlans([]);
          setLoadError(errorKey(requestError));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [doctorWorkspace, patientId]);

  async function refreshPlans() {
    const response = await doctorWorkspace.listPatientTreatmentPlans(patientId);
    setPlans(response.data.treatment_plans);
  }

  async function openPlan(plan) {
    setMode("detail");
    setSelectedPlanId(plan.id);
    setSelectedPlan(null);
    setDetailLoading(true);
    try {
      const response = await doctorWorkspace.getPatientTreatmentPlan(patientId, plan.id);
      setSelectedPlan(response.data.treatment_plan);
    } catch (requestError) {
      if (requestError.response?.status === 403 || requestError.response?.status === 404) {
        setPlans([]);
        setSelectedPlanId(null);
        setMode("none");
      }
      toast.error({ key: errorKey(requestError) });
    } finally {
      setDetailLoading(false);
    }
  }

  function startCreate() {
    setMode("create");
    setSelectedPlan(null);
    setSelectedPlanId(null);
  }

  async function savePlan(form) {
    if (form.end_date && form.end_date < form.start_date) {
      toast.error({ key: "doctorTreatmentPlans.errors.dateRange" });
      return;
    }

    setBusy(true);
    const payload = {
      title: form.title.trim(),
      start_date: form.start_date,
      ...(mode === "create" && form.general_instructions.trim()
        ? { general_instructions: form.general_instructions.trim() } : {}),
      ...(mode === "create" && form.end_date ? { end_date: form.end_date } : {}),
      ...(mode === "detail" ? {
        general_instructions: form.general_instructions,
        end_date: form.end_date || null,
        status: form.status,
      } : {}),
    };

    try {
      if (mode === "create") {
        const response = await doctorWorkspace.createPatientTreatmentPlan(patientId, payload);
        const plan = response.data.treatment_plan;
        setSelectedPlan(plan);
        setSelectedPlanId(plan.id);
        setMode("detail");
        toast.success({ key: "doctorTreatmentPlans.created" });
      } else {
        const response = await doctorWorkspace.updatePatientTreatmentPlan(patientId, selectedPlanId, payload);
        setSelectedPlan(response.data.treatment_plan);
        toast.success({ key: "doctorTreatmentPlans.updated" });
      }
      try {
        await refreshPlans();
      } catch (refreshError) {
        toast.error({ key: errorKey(refreshError) });
      }
    } catch (requestError) {
      if (requestError.response?.status === 403) {
        setPlans([]);
        setSelectedPlan(null);
        setSelectedPlanId(null);
        setMode("none");
      }
      toast.error({ key: errorKey(requestError) });
    } finally {
      setBusy(false);
    }
  }

  const planDates = (plan) => `${date(plan.start_date)} – ${plan.end_date ? date(plan.end_date) : t("doctorTreatmentPlans.noEndDate")}`;

  return (
    <Card
      id="doctor-treatment-plans"
      title={t("doctorTreatmentPlans.title")}
      description={t("doctorTreatmentPlans.description")}
      actions={<Button onClick={startCreate}>{t("doctorTreatmentPlans.create")}</Button>}
    >
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <h3 className="font-bold">{t("doctorTreatmentPlans.listTitle")}</h3>
          <div className="mt-4">
            {loading ? <LoadingState label={t("doctorTreatmentPlans.loading")} />
              : loadError ? <ErrorState message={t(loadError)} />
                : plans.length === 0 ? <EmptyState title={t("doctorTreatmentPlans.empty")} />
                  : (
                    <ul className="space-y-2">
                      {plans.map((plan) => (
                        <li key={plan.id}>
                          <SelectableCard
                            title={plan.title}
                            meta={planDates(plan)}
                            selected={selectedPlanId === plan.id}
                            disabled={detailLoading}
                            onClick={() => openPlan(plan)}
                            aside={<StatusBadge status={plan.status} labelPrefix="doctorTreatmentPlans.statuses" />}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          {mode === "none" && <p className="text-sm text-text-secondary">{t("doctorTreatmentPlans.selectPlan")}</p>}
          {mode === "detail" && detailLoading && <LoadingState label={t("doctorTreatmentPlans.loadingDetails")} />}
          {mode === "detail" && !detailLoading && selectedPlan && <>
            <PlanEditor key={`${selectedPlan.id}-${selectedPlan.updated_at || selectedPlan.status}`} plan={selectedPlan} t={t} busy={busy} onSave={savePlan} />
            <TreatmentPlanResourcesSection key={`resources-${selectedPlan.id}`} plan={selectedPlan} />
          </>}
          {mode === "create" && <PlanEditor key="new-treatment-plan" plan={null} t={t} busy={busy} onSave={savePlan} />}
        </div>
      </div>
    </Card>
  );
}

function PlanEditor({ plan, t, busy, onSave }) {
  const [form, setForm] = useState(() => formFromPlan(plan));

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="text-lg font-bold">{plan ? t("doctorTreatmentPlans.editTitle") : t("doctorTreatmentPlans.createTitle")}</h3>
      <TextField label={t("doctorTreatmentPlans.fields.title")} name="title" required value={form.title} onChange={updateField} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("doctorTreatmentPlans.fields.startDate")} name="start_date" type="date" required value={form.start_date} onChange={updateField} />
        <TextField
          label={t("doctorTreatmentPlans.fields.endDate")}
          name="end_date"
          type="date"
          min={form.start_date || undefined}
          value={form.end_date}
          onChange={updateField}
          hint={t("doctorTreatmentPlans.noEndDateHelp")}
        />
      </div>
      <TextareaField label={t("doctorTreatmentPlans.fields.instructions")} name="general_instructions" rows={4} value={form.general_instructions} onChange={updateField} />
      {plan && (
        <SelectField
          label={t("doctorTreatmentPlans.status")}
          name="status"
          value={form.status}
          onChange={updateField}
          options={Object.entries(t("doctorTreatmentPlans.statuses", { returnObjects: true })).map(([value, label]) => ({ value, label }))}
        />
      )}
      <Button type="submit" disabled={!form.title.trim() || !form.start_date} loading={busy} loadingText={t("doctorTreatmentPlans.saving")}>
        {plan ? t("doctorTreatmentPlans.saveChanges") : t("doctorTreatmentPlans.create")}
      </Button>
    </form>
  );
}

export default DoctorTreatmentPlansSection;
