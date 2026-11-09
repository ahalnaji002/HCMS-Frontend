import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";

function apiError(error, t) {
  const status = error.response?.status;
  if (status === 401) return t("patientTreatmentPlans.errors.unauthorized");
  if (status === 403) return t("patientTreatmentPlans.errors.forbidden");
  if (status === 404) return t("patientTreatmentPlans.errors.notFound");
  if (status >= 500) return t("patientTreatmentPlans.errors.server");
  if (!error.response) return t("patientTreatmentPlans.errors.network");
  return t("patientTreatmentPlans.errors.generic");
}

function PatientTreatmentPlansSection() {
  const { t } = useTranslation();
  const { patientWorkspace } = useApplicationServices();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [relatedType, setRelatedType] = useState("");
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState("");
  const [relatedItems, setRelatedItems] = useState([]);

  const loadPlans = useCallback(async (isActive = () => true) => {
    try {
      const response = await patientWorkspace.listOwnTreatmentPlans();
      if (!isActive()) return;
      setPlans(response.data.treatment_plans);
      setListError("");
    } catch (error) {
      if (!isActive()) return;
      setPlans([]);
      setSelectedPlan(null);
      setSelectedPlanId(null);
      setListError(apiError(error, t));
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [patientWorkspace, t]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => loadPlans(() => active));
    return () => { active = false; };
  }, [loadPlans]);

  async function retryPlans() {
    setLoading(true);
    setListError("");
    setSelectedPlan(null);
    setSelectedPlanId(null);
    setDetailError("");
    setRelatedType("");
    setRelatedItems([]);
    await loadPlans();
  }

  async function openPlan(plan) {
    setSelectedPlanId(plan.id);
    setSelectedPlan(null);
    setDetailLoading(true);
    setDetailError("");
    setRelatedType("");
    setRelatedItems([]);
    setRelatedError("");
    try {
      const response = await patientWorkspace.getOwnTreatmentPlan(plan.id);
      setSelectedPlan(response.data.treatment_plan);
    } catch (error) {
      setSelectedPlan(null);
      if (error.response?.status === 403) {
        setPlans([]);
        setSelectedPlanId(null);
        setListError(apiError(error, t));
      } else if (error.response?.status === 404) {
        setSelectedPlanId(null);
        setDetailError(apiError(error, t));
      } else {
        setDetailError(apiError(error, t));
      }
    } finally {
      setDetailLoading(false);
    }
  }

  async function openRelated(type) {
    if (!selectedPlan) return;
    setRelatedType(type);
    setRelatedLoading(true);
    setRelatedError("");
    setRelatedItems([]);
    try {
      const request = type === "medications"
        ? patientWorkspace.listOwnTreatmentPlanMedications
        : patientWorkspace.listOwnTreatmentPlanAppointments;
      const response = await request(selectedPlan.id);
      setRelatedItems(type === "medications" ? response.data.medications : response.data.appointments);
    } catch (error) {
      setRelatedError(apiError(error, t));
      if (error.response?.status === 403) {
        setPlans([]);
        setSelectedPlan(null);
        setSelectedPlanId(null);
        setRelatedType("");
        setListError(apiError(error, t));
      }
    } finally {
      setRelatedLoading(false);
    }
  }

  function closePlan() {
    setSelectedPlan(null);
    setSelectedPlanId(null);
    setDetailError("");
    setRelatedType("");
    setRelatedItems([]);
    setRelatedError("");
  }

  return (
    <section id="patient-treatment-plans" className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div>
        <p className="text-sm font-semibold text-primary">{t("patientTreatmentPlans.eyebrow")}</p>
        <h2 className="mt-1 text-xl font-bold">{t("patientTreatmentPlans.title")}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{t("patientTreatmentPlans.description")}</p>
      </div>

      {listError && <div role="alert" className="mt-5 rounded-xl bg-danger/10 p-4 text-sm text-danger">
        <p>{listError}</p>
        <button type="button" onClick={retryPlans} disabled={loading} className="mt-3 min-h-10 rounded-lg border border-danger px-3 py-2 font-semibold disabled:opacity-60">{t("patientTreatmentPlans.retry")}</button>
      </div>}

      {!loading && !listError && detailError && !selectedPlanId && <p role="alert" className="mt-5 rounded-xl bg-danger/10 p-4 text-sm text-danger">{detailError}</p>}

      {loading && <p role="status" className="mt-5 text-sm text-text-secondary">{t("patientTreatmentPlans.loading")}</p>}
      {!loading && !listError && plans.length === 0 && <p className="mt-5 rounded-xl border border-border bg-background p-4 text-sm text-text-secondary">{t("patientTreatmentPlans.empty")}</p>}

      {!loading && !listError && plans.length > 0 && <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <h3 className="font-bold">{t("patientTreatmentPlans.listTitle")}</h3>
          <ul className="mt-4 space-y-3">{plans.map((plan) => (
            <li key={plan.id}>
              <button type="button" onClick={() => openPlan(plan)} disabled={detailLoading} aria-current={selectedPlanId === plan.id ? "true" : undefined} className={`w-full rounded-xl border p-4 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70 ${selectedPlanId === plan.id ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                <span className="block font-semibold">{plan.title}</span>
                <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                  <span>{t("patientTreatmentPlans.status")}: {t(`patientTreatmentPlans.statuses.${plan.status}`, { defaultValue: plan.status })}</span>
                  <span>{plan.start_date}{plan.end_date ? ` – ${plan.end_date}` : ` – ${t("patientTreatmentPlans.noEndDate")}`}</span>
                </span>
              </button>
            </li>
          ))}</ul>
        </div>

        <div className="min-w-0 rounded-xl border border-border bg-background p-5">
          {detailError && selectedPlanId && <div role="alert" className="rounded-xl bg-danger/10 p-4 text-sm text-danger">
            <p>{detailError}</p>
            {plans.some((plan) => plan.id === selectedPlanId) && <button type="button" onClick={() => openPlan(plans.find((plan) => plan.id === selectedPlanId))} disabled={detailLoading} className="mt-3 min-h-10 rounded-lg border border-danger px-3 py-2 font-semibold disabled:opacity-60">{t("patientTreatmentPlans.retry")}</button>}
          </div>}
          {detailLoading && <p role="status" className="text-sm text-text-secondary">{t("patientTreatmentPlans.loadingDetails")}</p>}
          {!detailLoading && !detailError && !selectedPlan && <p className="text-sm text-text-secondary">{t("patientTreatmentPlans.selectPlan")}</p>}
          {!detailLoading && selectedPlan && <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-lg font-bold">{selectedPlan.title}</h3>
              <button type="button" onClick={closePlan} className="min-h-10 rounded-lg border border-border px-3 py-2 text-sm font-semibold">{t("patientTreatmentPlans.backToList")}</button>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <ReadOnlyField label={t("patientTreatmentPlans.status")} value={t(`patientTreatmentPlans.statuses.${selectedPlan.status}`, { defaultValue: selectedPlan.status })} />
              <ReadOnlyField label={t("patientTreatmentPlans.dates")} value={`${selectedPlan.start_date}${selectedPlan.end_date ? ` – ${selectedPlan.end_date}` : ` – ${t("patientTreatmentPlans.noEndDate")}`}`} />
              <div className="rounded-xl border border-border bg-surface p-4 sm:col-span-2">
                <dt className="text-xs font-semibold text-text-secondary">{t("patientTreatmentPlans.instructions")}</dt>
                <dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{selectedPlan.general_instructions || t("patientTreatmentPlans.noInstructions")}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <h4 className="font-bold">{t("patientTreatmentPlans.relatedTitle")}</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => openRelated("medications")} aria-pressed={relatedType === "medications"} className="min-h-10 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary">{t("patientTreatmentPlans.viewMedications")}</button>
                <button type="button" onClick={() => openRelated("appointments")} aria-pressed={relatedType === "appointments"} className="min-h-10 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary">{t("patientTreatmentPlans.viewAppointments")}</button>
              </div>
              {relatedType && <RelatedItems
                t={t}
                type={relatedType}
                items={relatedItems}
                loading={relatedLoading}
                error={relatedError}
                onRetry={() => openRelated(relatedType)}
              />}
            </div>
          </>}
        </div>
      </div>}
    </section>
  );
}

function ReadOnlyField({ label, value }) {
  return <div className="rounded-xl border border-border bg-surface p-4"><dt className="text-xs font-semibold text-text-secondary">{label}</dt><dd className="mt-2 break-words text-sm">{value}</dd></div>;
}

function RelatedItems({ t, type, items, loading, error, onRetry }) {
  const title = type === "medications" ? t("patientTreatmentPlans.medications") : t("patientTreatmentPlans.appointments");
  if (loading) return <p role="status" className="mt-4 text-sm text-text-secondary">{t("patientTreatmentPlans.relatedLoading", { resource: title })}</p>;
  if (error) return <div role="alert" className="mt-4 rounded-xl bg-danger/10 p-4 text-sm text-danger"><p>{error}</p><button type="button" onClick={onRetry} className="mt-3 min-h-10 rounded-lg border border-danger px-3 py-2 font-semibold">{t("patientTreatmentPlans.retry")}</button></div>;
  if (items.length === 0) return <p className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">{t("patientTreatmentPlans.relatedEmpty", { resource: title })}</p>;

  return <ul className="mt-4 space-y-3">{items.map((item) => (
    <li key={item.id} className="rounded-xl border border-border bg-surface p-4">
      {type === "medications" ? <>
        <p className="font-semibold">{item.medication_name}</p>
        <p className="mt-2 text-sm text-text-secondary">{item.dosage} · {item.frequency}{item.duration ? ` · ${item.duration}` : ""}</p>
        {item.instructions && <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.instructions}</p>}
      </> : <>
        <p className="font-semibold">{item.purpose}</p>
        <p className="mt-2 text-sm text-text-secondary">{item.appointment_date}</p>
        {item.location && <p className="mt-2 text-sm">{item.location}</p>}
        {item.notes && <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.notes}</p>}
      </>}
    </li>
  ))}</ul>;
}

export default PatientTreatmentPlansSection;
