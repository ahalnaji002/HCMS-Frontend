import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import TreatmentPlanResourcesSection from "./TreatmentPlanResourcesSection";

function errorMessage(error, t) {
  const status = error.response?.status;
  if (status === 400) return t("doctorTreatmentPlans.errors.validation");
  if (status === 401) return t("doctorTreatmentPlans.errors.unauthorized");
  if (status === 403) return t("doctorTreatmentPlans.errors.forbidden");
  if (status === 404) return t("doctorTreatmentPlans.errors.notFound");
  if (status === 409) return t("doctorTreatmentPlans.errors.conflict");
  if (status >= 500) return t("doctorTreatmentPlans.errors.server");
  if (!error.response) return t("doctorTreatmentPlans.errors.network");
  return t("doctorTreatmentPlans.errors.unknown");
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
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [mode, setMode] = useState("none");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    doctorWorkspace.listPatientTreatmentPlans(patientId)
      .then((response) => {
        if (active) setPlans(response.data.treatment_plans);
      })
      .catch((requestError) => {
        if (active) {
          setPlans([]);
          setError(errorMessage(requestError, t));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [doctorWorkspace, patientId, t]);

  async function refreshPlans() {
    const response = await doctorWorkspace.listPatientTreatmentPlans(patientId);
    setPlans(response.data.treatment_plans);
  }

  async function openPlan(plan) {
    setMode("detail");
    setSelectedPlanId(plan.id);
    setSelectedPlan(null);
    setDetailLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await doctorWorkspace.getPatientTreatmentPlan(patientId, plan.id);
      setSelectedPlan(response.data.treatment_plan);
    } catch (requestError) {
      if (requestError.response?.status === 403 || requestError.response?.status === 404) {
        setPlans([]);
        setSelectedPlanId(null);
        setMode("none");
      }
      setError(errorMessage(requestError, t));
    } finally {
      setDetailLoading(false);
    }
  }

  function startCreate() {
    setMode("create");
    setSelectedPlan(null);
    setSelectedPlanId(null);
    setError("");
    setNotice("");
  }

  async function savePlan(form) {
    if (form.end_date && form.end_date < form.start_date) {
      setError(t("doctorTreatmentPlans.errors.dateRange"));
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
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
        setNotice(t("doctorTreatmentPlans.created"));
        try {
          await refreshPlans();
        } catch (refreshError) {
          setError(errorMessage(refreshError, t));
        }
      } else {
        const response = await doctorWorkspace.updatePatientTreatmentPlan(patientId, selectedPlanId, payload);
        const plan = response.data.treatment_plan;
        setSelectedPlan(plan);
        setNotice(t("doctorTreatmentPlans.updated"));
        try {
          await refreshPlans();
        } catch (refreshError) {
          setError(errorMessage(refreshError, t));
        }
      }
    } catch (requestError) {
      if (requestError.response?.status === 403) {
        setPlans([]);
        setSelectedPlan(null);
        setSelectedPlanId(null);
        setMode("none");
      }
      setError(errorMessage(requestError, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="doctor-treatment-plans" className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">{t("doctorTreatmentPlans.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-bold">{t("doctorTreatmentPlans.title")}</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{t("doctorTreatmentPlans.description")}</p>
        </div>
        <button type="button" onClick={startCreate} className="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          {t("doctorTreatmentPlans.create")}
        </button>
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl bg-primary/10 p-4 text-sm text-primary">{notice}</p>}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <h3 className="font-bold">{t("doctorTreatmentPlans.listTitle")}</h3>
          {loading ? <p className="mt-4 text-sm text-text-secondary">{t("doctorTreatmentPlans.loading")}</p> : plans.length === 0 ? (
            <p className="mt-4 rounded-xl border border-border bg-background p-4 text-sm text-text-secondary">{t("doctorTreatmentPlans.empty")}</p>
          ) : (
            <ul className="mt-4 space-y-3">{plans.map((plan) => (
              <li key={plan.id}>
                <button type="button" disabled={detailLoading} onClick={() => openPlan(plan)} aria-current={selectedPlanId === plan.id ? "true" : undefined} className={`w-full rounded-xl border p-4 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70 ${selectedPlanId === plan.id ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                  <span className="block font-semibold">{plan.title}</span>
                  <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                    <span>{t("doctorTreatmentPlans.status")}: {t(`doctorTreatmentPlans.statuses.${plan.status}`)}</span>
                    <span>{plan.start_date}{plan.end_date ? ` – ${plan.end_date}` : ` – ${t("doctorTreatmentPlans.noEndDate")}`}</span>
                  </span>
                </button>
              </li>
            ))}</ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          {mode === "none" && <p className="text-sm text-text-secondary">{t("doctorTreatmentPlans.selectPlan")}</p>}
          {mode === "detail" && detailLoading && <p className="text-sm text-text-secondary">{t("doctorTreatmentPlans.loadingDetails")}</p>}
          {mode === "detail" && !detailLoading && selectedPlan && <>
            <PlanEditor key={`${selectedPlan.id}-${selectedPlan.updated_at || selectedPlan.status}`} plan={selectedPlan} t={t} busy={busy} onSave={savePlan} />
            <TreatmentPlanResourcesSection key={`resources-${selectedPlan.id}`} plan={selectedPlan} />
          </>}
          {mode === "create" && <PlanEditor key="new-treatment-plan" plan={null} t={t} busy={busy} onSave={savePlan} />}
        </div>
      </div>
    </section>
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
      <label className="block text-sm font-semibold">{t("doctorTreatmentPlans.fields.title")}
        <input name="title" required value={form.title} onChange={updateField} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 font-normal" />
      </label>
      <label className="block text-sm font-semibold">{t("doctorTreatmentPlans.fields.startDate")}
        <input name="start_date" type="date" required value={form.start_date} onChange={updateField} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 font-normal" />
      </label>
      <label className="block text-sm font-semibold">{t("doctorTreatmentPlans.fields.endDate")}
        <input name="end_date" type="date" min={form.start_date || undefined} value={form.end_date} onChange={updateField} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 font-normal" />
        <span className="mt-1 block text-xs font-normal text-text-secondary">{t("doctorTreatmentPlans.noEndDateHelp")}</span>
      </label>
      <label className="block text-sm font-semibold">{t("doctorTreatmentPlans.fields.instructions")}
        <textarea name="general_instructions" rows={4} value={form.general_instructions} onChange={updateField} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 font-normal" />
      </label>
      {plan && <label className="block text-sm font-semibold">{t("doctorTreatmentPlans.status")}
        <select name="status" value={form.status} onChange={updateField} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 font-normal">
          {Object.entries(t("doctorTreatmentPlans.statuses", { returnObjects: true })).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>}
      <button type="submit" disabled={busy || !form.title.trim() || !form.start_date} className="min-h-11 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        {busy ? t("doctorTreatmentPlans.saving") : plan ? t("doctorTreatmentPlans.saveChanges") : t("doctorTreatmentPlans.create")}
      </button>
    </form>
  );
}

export default DoctorTreatmentPlansSection;
