import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { Card, DescriptionList, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";

function getErrorKind(error) {
  if (!error.response) return "network";
  if (error.response.status === 401) return "unauthorized";
  if (error.response.status === 403) return "forbidden";
  return "loadFailed";
}

function PatientAssistanceRequestsFeature() {
  const { t } = useTranslation();
  const { date } = useFormatDate();
  const { patientWorkspace } = useApplicationServices();
  const [result, setResult] = useState({ key: null, requests: [], loading: true, errorKind: "" });
  const [reloadKey, setReloadKey] = useState(0);
  const queryKey = `assistance-requests:${reloadKey}`;

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await patientWorkspace.listPatientAssistanceRequests();
        const requests = response?.data?.assistance_requests ?? [];
        const trackedRequests = await Promise.all(requests.map(async (request) => {
          try {
            const resourceResponse = await patientWorkspace.listPatientAssistanceRequestResources(request.id);
            return {
              request,
              resources: resourceResponse?.data?.resource_allocations ?? [],
              resourceErrorKind: "",
            };
          } catch {
            return { request, resources: [], resourceErrorKind: "resourceLoadFailed" };
          }
        }));

        if (active) setResult({ key: queryKey, requests: trackedRequests, loading: false, errorKind: "" });
      } catch (error) {
        if (active) setResult({ key: queryKey, requests: [], loading: false, errorKind: getErrorKind(error) });
      }
    }

    load();
    return () => { active = false; };
  }, [patientWorkspace, queryKey]);

  const retry = useCallback(() => {
    setResult((current) => ({ ...current, loading: true, errorKind: "" }));
    setReloadKey((key) => key + 1);
  }, []);

  const currentResult = result.key === queryKey
    ? result
    : { requests: [], loading: true, errorKind: "" };

  return (
    <section aria-labelledby="patient-assistance-title">
      <PageHeader id="patient-assistance-title" eyebrow={t("patientAssistance.eyebrow")} title={t("patientAssistance.title")} description={t("patientAssistance.description")} />

      {currentResult.loading ? <LoadingState label={t("patientAssistance.loading")} />
        : currentResult.errorKind ? <ErrorState message={t(`patientAssistance.errors.${currentResult.errorKind}`)} onRetry={retry} retryLabel={t("patientAssistance.retry")} />
          : currentResult.requests.length === 0 ? <EmptyState title={t("patientAssistance.empty")} />
            : (
              <ul className="grid items-start gap-4 lg:grid-cols-2">
                {currentResult.requests.map(({ request, resources, resourceErrorKind }) => (
                  <li key={request.id}>
                    <Card
                      as="article"
                      padding="sm"
                      title={t("patientAssistance.requestNumber", { id: request.id })}
                      actions={<StatusBadge status={request.status} labelPrefix="patientAssistance.statuses" />}
                    >
                      <DescriptionList
                        columns={2}
                        items={[
                          { label: t("patientAssistance.requestType"), value: request.request_type },
                          { label: t("patientAssistance.submittedAt"), value: date(request.submitted_at) },
                        ]}
                      />
                      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-text-secondary">{request.description}</p>

                      <div className="mt-6 border-t border-border pt-5">
                        <h3 className="font-bold">{t("patientAssistance.resourcesTitle")}</h3>
                        <div className="mt-3">
                          {resourceErrorKind ? <ErrorState message={t(`patientAssistance.errors.${resourceErrorKind}`)} onRetry={retry} retryLabel={t("patientAssistance.retry")} />
                            : resources.length === 0 ? <p className="text-sm text-text-secondary">{t("patientAssistance.noResources")}</p>
                              : (
                                <ul className="space-y-3">
                                  {resources.map((resource) => (
                                    <li key={resource.id} className="rounded-xl border border-border bg-background p-4">
                                      <p className="font-semibold">{resource.resource_name}</p>
                                      <p className="mt-1 text-sm text-text-secondary">{t("patientAssistance.quantity", { count: resource.quantity })}</p>
                                      {resource.delivery_date && <p className="mt-1 text-sm text-text-secondary">{t("patientAssistance.deliveryDate", { date: date(resource.delivery_date) })}</p>}
                                      {resource.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-text-secondary">{resource.notes}</p>}
                                    </li>
                                  ))}
                                </ul>
                              )}
                        </div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
    </section>
  );
}

export default PatientAssistanceRequestsFeature;
