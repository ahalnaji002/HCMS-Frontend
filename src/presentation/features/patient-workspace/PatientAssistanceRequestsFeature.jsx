import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";

function getErrorKind(error) {
  if (!error.response) return "network";
  if (error.response.status === 401) return "unauthorized";
  if (error.response.status === 403) return "forbidden";
  return "loadFailed";
}

function formatDate(value, locale) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale || undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function PatientAssistanceRequestsFeature() {
  const { t, i18n } = useTranslation();
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
      <header className="mb-6">
        <p className="text-sm font-semibold text-primary">{t("patientAssistance.eyebrow")}</p>
        <h1 id="patient-assistance-title" className="mt-2 text-3xl font-bold">{t("patientAssistance.title")}</h1>
        <p className="mt-2 max-w-3xl leading-7 text-text-secondary">{t("patientAssistance.description")}</p>
      </header>

      {currentResult.loading
        ? <p role="status" aria-live="polite" className="rounded-xl border border-border bg-surface p-5 text-text-secondary">{t("patientAssistance.loading")}</p>
        : currentResult.errorKind
          ? <div role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-5">
            <p className="text-sm text-danger">{t(`patientAssistance.errors.${currentResult.errorKind}`)}</p>
            <button type="button" onClick={retry} className="mt-4 min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{t("patientAssistance.retry")}</button>
          </div>
          : currentResult.requests.length === 0
            ? <p role="status" className="rounded-xl border border-border bg-surface p-5 text-text-secondary">{t("patientAssistance.empty")}</p>
            : <ul className="grid gap-4 lg:grid-cols-2">
              {currentResult.requests.map(({ request, resources, resourceErrorKind }) => (
                <li key={request.id}>
                  <article className="h-full rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="text-lg font-bold">{t("patientAssistance.requestNumber", { id: request.id })}</h2>
                      <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                        {t(`patientAssistance.statuses.${request.status}`, { defaultValue: request.status })}
                      </span>
                    </div>
                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold text-text-secondary">{t("patientAssistance.requestType")}</dt>
                        <dd className="mt-1 break-words text-sm font-medium">{request.request_type}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-text-secondary">{t("patientAssistance.submittedAt")}</dt>
                        <dd className="mt-1 text-sm font-medium">{formatDate(request.submitted_at, i18n.resolvedLanguage || i18n.language)}</dd>
                      </div>
                    </dl>
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-text-secondary">{request.description}</p>

                    <div className="mt-6 border-t border-border pt-5">
                      <h3 className="font-bold">{t("patientAssistance.resourcesTitle")}</h3>
                      {resourceErrorKind
                        ? <div role="alert" className="mt-3 rounded-lg bg-danger/5 p-3 text-sm text-danger">
                          <p>{t(`patientAssistance.errors.${resourceErrorKind}`)}</p>
                          <button type="button" onClick={retry} className="mt-2 min-h-10 rounded-lg border border-danger px-3 py-1 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger">{t("patientAssistance.retry")}</button>
                        </div>
                        : resources.length === 0
                          ? <p className="mt-3 text-sm text-text-secondary">{t("patientAssistance.noResources")}</p>
                          : <ul className="mt-3 space-y-3">
                            {resources.map((resource) => (
                              <li key={resource.id} className="rounded-xl border border-border bg-background p-4">
                                <p className="font-semibold">{resource.resource_name}</p>
                                <p className="mt-1 text-sm text-text-secondary">{t("patientAssistance.quantity", { count: resource.quantity })}</p>
                                {resource.delivery_date && <p className="mt-1 text-sm text-text-secondary">{t("patientAssistance.deliveryDate", { date: formatDate(resource.delivery_date, i18n.resolvedLanguage || i18n.language) })}</p>}
                                {resource.notes && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-text-secondary">{resource.notes}</p>}
                              </li>
                            ))}
                          </ul>}
                    </div>
                  </article>
                </li>
              ))}
            </ul>}
    </section>
  );
}

export default PatientAssistanceRequestsFeature;
