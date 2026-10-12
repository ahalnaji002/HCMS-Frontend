import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/presentation/context/useAuth";
import useRoleDashboard from "@/presentation/features/role-dashboard/useRoleDashboard";
import roleDashboardConfig from "@/presentation/features/role-dashboard/roleDashboardConfig";
import DashboardMetricCard from "@/presentation/features/role-dashboard/DashboardMetricCard";

function RoleDashboard({ role }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const config = roleDashboardConfig[role];
  const { dashboard, loading, errorKind, hasActivity, retry } = useRoleDashboard(role);

  if (!config) return null;

  return (
    <section id="role-dashboard" aria-labelledby="role-dashboard-title" className="mb-8 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
      <header>
        <p className="text-sm font-semibold text-primary">{t("roleDashboard.eyebrow")}</p>
        <h2 id="role-dashboard-title" className="mt-2 text-2xl font-bold">
          {user?.full_name
            ? t("roleDashboard.greeting", { name: user.full_name })
            : t(`roleHome.roles.${role.toLowerCase()}.title`)}
        </h2>
        <p className="mt-2 max-w-3xl leading-7 text-text-secondary">
          {t(`roleDashboard.descriptions.${role.toLowerCase()}`)}
        </p>
      </header>

      <section aria-labelledby="role-dashboard-summary" className="mt-6">
        <h3 id="role-dashboard-summary" className="text-lg font-bold">
          {t("roleDashboard.summary")}
        </h3>
        {loading ? (
          <p role="status" aria-live="polite" className="mt-4 rounded-xl border border-border bg-background p-4 text-sm text-text-secondary">
            {t("roleDashboard.loading")}
          </p>
        ) : errorKind ? (
          <DashboardLoadError errorKind={errorKind} onRetry={retry} />
        ) : (
          <>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {config.metrics.map((metric) => (
                <DashboardMetricCard
                  key={metric}
                  label={t(`roleDashboard.metrics.${role.toLowerCase()}.${metric}`)}
                  value={dashboard[metric]}
                />
              ))}
            </dl>
            {!hasActivity && (
              <p role="status" className="mt-4 rounded-xl bg-background px-4 py-3 text-sm text-text-secondary">
                {t("roleDashboard.noActivity")}
              </p>
            )}
          </>
        )}
      </section>

      <DashboardActions actions={config.actions} dashboard={dashboard} />
    </section>
  );
}

function DashboardLoadError({ errorKind, onRetry }) {
  const { t } = useTranslation();

  return (
    <div role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/5 p-4">
      <p className="text-sm text-danger">{t(`roleDashboard.errors.${errorKind}`)}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {t("roleDashboard.retry")}
      </button>
    </div>
  );
}

function DashboardActions({ actions, dashboard }) {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="role-dashboard-actions" className="mt-6 border-t border-border pt-5">
      <h3 id="role-dashboard-actions" className="text-lg font-bold">
        {t("roleDashboard.nextActions")}
      </h3>
      <ul className="mt-3 flex flex-wrap gap-3">
        {actions.map((action) => {
          const waitingForPatient =
            action.requiresMetric && dashboard?.[action.requiresMetric] === 0;
          const unavailable = action.available === false || waitingForPatient;

          return (
            <li key={action.label}>
              {unavailable ? (
                <span aria-disabled="true" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary">
                  {t(`roleDashboard.actions.${action.label}`)}
                  <span className="rounded-full bg-background px-2 py-1 text-xs">
                    {waitingForPatient
                      ? t("roleDashboard.noAssignedPatients")
                      : t("roleDashboard.comingSoon")}
                  </span>
                </span>
              ) : (
                <Link to={action.href} className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  {t(`roleDashboard.actions.${action.label}`)}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default RoleDashboard;
