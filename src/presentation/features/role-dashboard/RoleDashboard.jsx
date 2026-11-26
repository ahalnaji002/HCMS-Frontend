import { useTranslation } from "react-i18next";
import { useAuth } from "@/presentation/context/useAuth";
import { ButtonLink, Card, ErrorState, LoadingState, PageHeader } from "@/presentation/components/ui";
import useRoleDashboard from "@/presentation/features/role-dashboard/useRoleDashboard";
import roleDashboardConfig from "@/presentation/features/role-dashboard/roleDashboardConfig";
import DashboardMetricCard from "@/presentation/features/role-dashboard/DashboardMetricCard";
import AttentionPanel from "@/presentation/features/role-dashboard/AttentionPanel";

// Overview page of every role: one header (the greeting is the page title, so
// there is no second "welcome" block, UX-17), what needs attention, the
// summary metrics, and next actions.
// `attention(dashboard)` returns the role's "needs your attention" items.
function RoleDashboard({ role, attention, eyebrow }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const config = roleDashboardConfig[role];
  const { dashboard, loading, errorKind, hasActivity, retry } = useRoleDashboard(role);

  if (!config) return null;

  return (
    <div id="role-dashboard">
      <PageHeader
        eyebrow={eyebrow || t("roleDashboard.eyebrow")}
        title={user?.full_name ? t("roleDashboard.greeting", { name: user.full_name }) : t(`roleHome.roles.${role.toLowerCase()}.title`)}
        description={t(`roleDashboard.descriptions.${role.toLowerCase()}`)}
      />

      {attention && <AttentionPanel t={t} items={attention(dashboard)} />}

      <Card title={t("roleDashboard.summary")} className="mb-8">
        {loading ? <LoadingState label={t("roleDashboard.loading")} />
          : errorKind ? <ErrorState message={t(`roleDashboard.errors.${errorKind}`)} onRetry={retry} retryLabel={t("roleDashboard.retry")} />
            : (
              <>
                <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
        <DashboardActions actions={config.actions} dashboard={dashboard} />
      </Card>
    </div>
  );
}

function DashboardActions({ actions, dashboard }) {
  const { t } = useTranslation();
  // Planned actions (available: false) stay hidden until their screen exists.
  const visibleActions = actions.filter((action) => action.available !== false);
  if (visibleActions.length === 0) return null;

  return (
    <section aria-labelledby="role-dashboard-actions" className="mt-6 border-t border-border pt-5">
      <h3 id="role-dashboard-actions" className="text-lg font-bold">
        {t("roleDashboard.nextActions")}
      </h3>
      <ul className="mt-3 flex flex-wrap gap-3">
        {visibleActions.map((action) => {
          const waitingForPatient = action.requiresMetric && dashboard?.[action.requiresMetric] === 0;
          return (
            <li key={action.label}>
              {waitingForPatient ? (
                <span aria-disabled="true" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-text-secondary">
                  {t(`roleDashboard.actions.${action.label}`)}
                  <span className="rounded-full bg-background px-2 py-1 text-xs">{t("roleDashboard.noAssignedPatients")}</span>
                </span>
              ) : (
                <ButtonLink to={action.href} variant="secondary" size="sm">{t(`roleDashboard.actions.${action.label}`)}</ButtonLink>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default RoleDashboard;
