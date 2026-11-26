import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { Button, EmptyState, ErrorState, LoadingState, PageHeader, SelectField, Tabs } from "@/presentation/components/ui";
import { useFormatDate } from "@/presentation/hooks/useFormatDate";

const REPORTS = [
  { id: "patients", titleKey: "patients", service: "getPatientReport", columns: ["id", "user_id", "full_name", "created_at"] },
  { id: "treatment-plans", titleKey: "treatmentPlans", service: "getTreatmentPlanReport", columns: ["id", "patient_id", "doctor_id", "status", "start_date", "end_date", "created_at"] },
  { id: "assistance-requests", titleKey: "assistanceRequests", service: "getAssistanceRequestReport", columns: ["id", "patient_id", "doctor_id", "ngo_id", "status", "request_type", "created_at", "updated_at"], filter: true },
];
const PAGE_SIZES = [10, 20, 50, 100];
const ASSISTANCE_STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "COMPLETED"];
const DATE_COLUMNS = new Set(["start_date", "end_date"]);
const DATE_TIME_COLUMNS = new Set(["created_at", "updated_at"]);

function errorKind(error) {
  if (!error.response) return "network";
  if (error.response.status === 401) return "unauthorized";
  if (error.response.status === 403) return "forbidden";
  if (error.response.status === 400) return "validation";
  return "server";
}

function AdminReportsFeature() {
  const { t, i18n } = useTranslation();
  const { adminReports } = useApplicationServices();
  const { date, dateTime } = useFormatDate();
  const [reportId, setReportId] = useState("patients");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ requestKey: "", error: "", items: [], page: 1, total: 0, totalPages: 0 });

  const report = REPORTS.find((item) => item.id === reportId) ?? REPORTS[0];
  const requestKey = JSON.stringify({ reportId, page, limit, status: report.filter ? status : "", reloadKey });
  const loading = state.requestKey !== requestKey;
  const visibleError = loading ? "" : state.error;

  useEffect(() => {
    let active = true;
    const params = { page, limit };
    if (report.filter && status) params.status = status;
    adminReports[report.service](params)
      .then((response) => {
        if (!active) return;
        const data = response?.data;
        setState({
          requestKey,
          error: "",
          items: Array.isArray(data?.items) ? data.items : [],
          page: Number.isFinite(data?.page) ? data.page : page,
          total: Number.isFinite(data?.total) ? data.total : 0,
          totalPages: Number.isFinite(data?.total_pages) ? data.total_pages : 0,
        });
      })
      .catch((error) => {
        if (active) setState({ requestKey, error: errorKind(error), items: [], page, total: 0, totalPages: 0 });
      });
    return () => { active = false; };
  }, [adminReports, report, page, limit, status, reloadKey, requestKey]);

  function selectReport(nextReportId) {
    setReportId(nextReportId);
    setPage(1);
    setStatus("");
  }

  function retry() {
    setReloadKey((current) => current + 1);
  }

  function cellValue(item, column) {
    const value = item[column];
    if (value === null || value === undefined || value === "") return t("adminReports.notAvailable");
    if (column === "status") return t(`adminReports.statuses.${value}`, { defaultValue: value });
    if (DATE_COLUMNS.has(column)) return date(value) || String(value);
    if (DATE_TIME_COLUMNS.has(column)) return dateTime(value) || String(value);
    return String(value);
  }

  const formatNumber = (value) => new Intl.NumberFormat(i18n.language || undefined).format(value);

  const panel = (
    <>
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div>
          <h2 className="text-xl font-bold">{t(`adminReports.types.${report.titleKey}`)}</h2>
          <p className="mt-1 text-sm text-text-secondary">{t("adminReports.totalRecords", { count: formatNumber(state.total) })}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {report.filter && (
            <SelectField
              label={t("adminReports.statusFilter")}
              value={status}
              onChange={(event) => { setStatus(event.target.value); setPage(1); }}
              disabled={loading}
              placeholder={t("adminReports.allStatuses")}
              options={ASSISTANCE_STATUSES.map((value) => ({ value, label: t(`adminReports.statuses.${value}`) }))}
              className="min-w-44"
            />
          )}
          <SelectField
            label={t("adminReports.pageSize")}
            value={limit}
            onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}
            disabled={loading}
            options={PAGE_SIZES.map((size) => ({ value: size, label: String(size) }))}
            className="min-w-24"
          />
        </div>
      </div>

      {loading ? <LoadingState label={t("adminReports.loading")} />
        : visibleError ? <ErrorState message={t(`adminReports.errors.${visibleError}`)} onRetry={retry} retryLabel={t("adminReports.retry")} />
          : state.items.length === 0 ? <EmptyState title={t("adminReports.empty")} />
            : (
              <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
                <table className="w-full min-w-max border-collapse text-start text-sm">
                  <caption className="sr-only">{t("adminReports.tableCaption", { report: t(`adminReports.types.${report.titleKey}`) })}</caption>
                  <thead className="bg-background text-start">
                    <tr>{report.columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap border-b border-border px-4 py-3 text-start font-semibold">{t(`adminReports.columns.${column}`)}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {state.items.map((item, rowIndex) => (
                      <tr key={item.id ?? rowIndex} className="transition-colors hover:bg-background">
                        {report.columns.map((column) => <td key={column} className="whitespace-nowrap px-4 py-3 text-text-secondary">{cellValue(item, column)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

      {!loading && !visibleError && state.total > 0 && (
        <nav aria-label={t("adminReports.pagination")} className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">{t("adminReports.pageOf", { page: formatNumber(state.page), totalPages: formatNumber(state.totalPages) })}</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>{t("adminReports.previous")}</Button>
            <Button variant="secondary" size="sm" onClick={() => setPage((current) => Math.min(state.totalPages, current + 1))} disabled={page >= state.totalPages || loading}>{t("adminReports.next")}</Button>
          </div>
        </nav>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow={t("adminReports.eyebrow")} title={t("roleNavigation.admin.reports")} description={t("adminReports.description")} />
      <Tabs
        label={t("adminReports.reportTypes")}
        value={report.id}
        onChange={selectReport}
        tabs={REPORTS.map((item) => ({ id: item.id, label: t(`adminReports.types.${item.titleKey}`), content: panel }))}
      />
    </div>
  );
}

export default AdminReportsFeature;
