import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { Alert, Button, Card, DescriptionList, EmptyState, ErrorState, LoadingState, PageHeader, SelectableCard, StatusBadge } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";
import PatientTreatmentResourceList from "@/presentation/features/patient-workspace/components/PatientTreatmentResourceList";

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
  const { date } = useFormatDate();
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

  const planDates = (plan) => `${date(plan.start_date)} – ${plan.end_date ? date(plan.end_date) : t("patientTreatmentPlans.noEndDate")}`;

  return (
    <div id="patient-treatment-plans">
      <PageHeader eyebrow={t("patientTreatmentPlans.eyebrow")} title={t("patientTreatmentPlans.title")} description={t("patientTreatmentPlans.description")} />

      {listError ? <ErrorState message={listError} onRetry={retryPlans} retrying={loading} retryLabel={t("patientTreatmentPlans.retry")} />
        : loading ? <LoadingState label={t("patientTreatmentPlans.loading")} />
          : plans.length === 0 ? <EmptyState title={t("patientTreatmentPlans.empty")} />
            : (
              <>
                {detailError && !selectedPlanId && <Alert tone="error" className="mb-5">{detailError}</Alert>}
                <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <Card title={t("patientTreatmentPlans.listTitle")} titleLevel={2} padding="sm">
                    <ul className="space-y-2">
                      {plans.map((plan) => (
                        <li key={plan.id}>
                          <SelectableCard
                            title={plan.title}
                            meta={planDates(plan)}
                            selected={selectedPlanId === plan.id}
                            disabled={detailLoading}
                            onClick={() => openPlan(plan)}
                            aside={<StatusBadge status={plan.status} labelPrefix="patientTreatmentPlans.statuses" />}
                          />
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card padding="sm" className="min-w-0">
                    {detailError && selectedPlanId ? (
                      <ErrorState
                        message={detailError}
                        onRetry={plans.some((plan) => plan.id === selectedPlanId) ? () => openPlan(plans.find((plan) => plan.id === selectedPlanId)) : undefined}
                        retrying={detailLoading}
                        retryLabel={t("patientTreatmentPlans.retry")}
                      />
                    ) : detailLoading ? <LoadingState label={t("patientTreatmentPlans.loadingDetails")} />
                      : !selectedPlan ? <p className="text-sm text-text-secondary">{t("patientTreatmentPlans.selectPlan")}</p>
                        : (
                          <>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <h3 className="text-lg font-bold">{selectedPlan.title}</h3>
                              <Button variant="secondary" size="sm" onClick={closePlan}>{t("patientTreatmentPlans.backToList")}</Button>
                            </div>
                            <DescriptionList
                              className="mt-5"
                              columns={2}
                              items={[
                                { label: t("patientTreatmentPlans.status"), value: t(`patientTreatmentPlans.statuses.${selectedPlan.status}`, { defaultValue: selectedPlan.status }) },
                                { label: t("patientTreatmentPlans.dates"), value: planDates(selectedPlan) },
                                { label: t("patientTreatmentPlans.instructions"), value: selectedPlan.general_instructions || t("patientTreatmentPlans.noInstructions"), wide: true },
                              ]}
                            />
                            <div className="mt-6">
                              <h4 className="font-bold">{t("patientTreatmentPlans.relatedTitle")}</h4>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button variant={relatedType === "medications" ? "primary" : "secondary"} size="sm" aria-pressed={relatedType === "medications"} onClick={() => openRelated("medications")}>
                                  {t("patientTreatmentPlans.viewMedications")}
                                </Button>
                                <Button variant={relatedType === "appointments" ? "primary" : "secondary"} size="sm" aria-pressed={relatedType === "appointments"} onClick={() => openRelated("appointments")}>
                                  {t("patientTreatmentPlans.viewAppointments")}
                                </Button>
                              </div>
                              {relatedType && (
                                <div className="mt-4">
                                  <RelatedItems t={t} type={relatedType} items={relatedItems} loading={relatedLoading} error={relatedError} onRetry={() => openRelated(relatedType)} />
                                </div>
                              )}
                            </div>
                          </>
                        )}
                  </Card>
                </div>
              </>
            )}
    </div>
  );
}

function RelatedItems({ t, type, items, loading, error, onRetry }) {
  const title = type === "medications" ? t("patientTreatmentPlans.medications") : t("patientTreatmentPlans.appointments");
  if (loading) return <LoadingState label={t("patientTreatmentPlans.relatedLoading", { resource: title })} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} retryLabel={t("patientTreatmentPlans.retry")} />;
  if (items.length === 0) return <EmptyState title={t("patientTreatmentPlans.relatedEmpty", { resource: title })} />;
  return <PatientTreatmentResourceList items={items} type={type} t={t} />;
}

export default PatientTreatmentPlansSection;
