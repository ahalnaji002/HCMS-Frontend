import { useEffect, useState } from "react";
import { useApplicationServices } from "@/app/useApplicationServices";
import roleDashboardConfig from "@/presentation/features/role-dashboard/roleDashboardConfig";

const emptyMetricKeys = [];

function useRoleDashboard(role) {
  const { dashboard: dashboardService } = useApplicationServices();
  const metricKeys = roleDashboardConfig[role]?.metrics ?? emptyMetricKeys;
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorKind, setErrorKind] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (metricKeys.length === 0) {
      return undefined;
    }

    let isCurrent = true;

    dashboardService.getRoleDashboard(role)
      .then((response) => {
        const metrics = response?.data;
        const hasValidMetrics = metricKeys.every(
          (metric) => Number.isFinite(metrics?.[metric]) && metrics[metric] >= 0,
        );

        if (!hasValidMetrics) {
          throw new Error("Invalid dashboard response");
        }

        if (isCurrent) setDashboard(metrics);
      })
      .catch((requestError) => {
        if (isCurrent) {
          setErrorKind(requestError.response?.status === 404 ? "profileMissing" : "loadFailed");
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [dashboardService, metricKeys, reloadKey, role]);

  function retry() {
    setLoading(true);
    setErrorKind("");
    setReloadKey((key) => key + 1);
  }

  const hasActivity = dashboard
    ? metricKeys.some((metric) => dashboard[metric] > 0)
    : false;

  return { dashboard, loading, errorKind, hasActivity, retry };
}

export default useRoleDashboard;
