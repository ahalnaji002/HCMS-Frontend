import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";

const REPORTS = [
  { id: "patients", titleKey: "patients", service: "getPatientReport", columns: ["id", "user_id", "full_name", "created_at"] },
  { id: "treatment-plans", titleKey: "treatmentPlans", service: "getTreatmentPlanReport", columns: ["id", "patient_id", "doctor_id", "status", "start_date", "end_date", "created_at"] },
  { id: "assistance-requests", titleKey: "assistanceRequests", service: "getAssistanceRequestReport", columns: ["id", "patient_id", "doctor_id", "ngo_id", "status", "request_type", "created_at", "updated_at"], filter: true },
];
const PAGE_SIZES = [10, 20, 50, 100];
const ASSISTANCE_STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "COMPLETED"];

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
  const [reportId, setReportId] = useState("patients");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ requestKey: "", error: "", items: [], total: 0, totalPages: 0 });

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
          total: Number.isFinite(data?.total) ? data.total : 0,
          totalPages: Number.isFinite(data?.total_pages) ? data.total_pages : 0,
        });
      })
      .catch((error) => {
        if (active) setState({ requestKey, error: errorKind(error), items: [], total: 0, totalPages: 0 });
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
    return String(value);
  }

  const formatNumber = (value) => new Intl.NumberFormat(i18n.language || undefined).format(value);

  return (
    <section aria-labelledby="admin-reports-title" className="mx-auto max-w-7xl">
      <header className="mb-7">
        <p className="text-sm font-semibold text-primary">{t("adminReports.eyebrow")}</p>
        <h1 id="admin-reports-title" className="mt-2 text-3xl font-bold">{t("roleNavigation.admin.reports")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">{t("adminReports.description")}</p>
      </header>

      <div role="tablist" aria-label={t("adminReports.reportTypes")} className="mb-6 flex flex-wrap gap-2 border-b border-border">
        {REPORTS.map((item) => <button
          key={item.id}
          id={`report-tab-${item.id}`}
          type="button"
          role="tab"
          aria-selected={report.id === item.id}
          aria-controls="admin-report-panel"
          onClick={() => selectReport(item.id)}
          className={`min-h-11 border-b-2 px-4 py-2 text-sm font-semibold ${report.id === item.id ? "border-primary text-primary" : "border-transparent text-text-secondary"}`}
        >{t(`adminReports.types.${item.titleKey}`)}</button>)}
      </div>

      <div id="admin-report-panel" role="tabpanel" aria-labelledby={`report-tab-${report.id}`}>
        <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <div>
            <h2 className="text-xl font-bold">{t(`adminReports.types.${report.titleKey}`)}</h2>
              <p className="mt-1 text-sm text-text-secondary">{t("adminReports.totalRecords", { count: formatNumber(state.total) })}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {report.filter && <label className="text-sm font-semibold">{t("adminReports.statusFilter")}
              <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} disabled={loading} className="mt-1 block min-h-10 min-w-44 rounded-lg border border-border bg-background px-3 py-2 font-normal">
                <option value="">{t("adminReports.allStatuses")}</option>
                {ASSISTANCE_STATUSES.map((value) => <option key={value} value={value}>{t(`adminReports.statuses.${value}`)}</option>)}
              </select>
            </label>}
            <label className="text-sm font-semibold">{t("adminReports.pageSize")}
              <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} disabled={loading} className="mt-1 block min-h-10 min-w-24 rounded-lg border border-border bg-background px-3 py-2 font-normal">
                {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
          </div>
        </div>

        {loading ? <p role="status" className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-secondary">{t("adminReports.loading")}</p>
          : visibleError ? <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
            <p>{t(`adminReports.errors.${visibleError}`)}</p>
            <button type="button" onClick={retry} className="mt-4 min-h-10 rounded-lg border border-current px-4 py-2 font-semibold">{t("adminReports.retry")}</button>
          </div>
            : state.items.length === 0 ? <p role="status" className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-secondary">{t("adminReports.empty")}</p>
              : <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
                <table className="w-full min-w-max border-collapse text-start text-sm">
                  <caption className="sr-only">{t("adminReports.tableCaption", { report: t(`adminReports.types.${report.titleKey}`) })}</caption>
                  <thead className="bg-background text-start"><tr>{report.columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap border-b border-border px-4 py-3 text-start font-semibold">{t(`adminReports.columns.${column}`)}</th>)}</tr></thead>
                  <tbody className="divide-y divide-border">{state.items.map((item, rowIndex) => <tr key={item.id ?? rowIndex}>
                    {report.columns.map((column) => <td key={column} className="whitespace-nowrap px-4 py-3 text-text-secondary">{cellValue(item, column)}</td>)}
                  </tr>)}</tbody>
                </table>
              </div>}

        {!loading && !visibleError && state.total > 0 && <nav aria-label={t("adminReports.pagination")} className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">{t("adminReports.pageOf", { page: formatNumber(state.page), totalPages: formatNumber(state.totalPages) })}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading} className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">{t("adminReports.previous")}</button>
            <button type="button" onClick={() => setPage((current) => Math.min(state.totalPages, current + 1))} disabled={page >= state.totalPages || loading} className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">{t("adminReports.next")}</button>
          </div>
        </nav>}
      </div>
    </section>
  );
}

export default AdminReportsFeature;
