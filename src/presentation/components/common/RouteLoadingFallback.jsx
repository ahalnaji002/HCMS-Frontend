import { useTranslation } from "react-i18next";

function RouteLoadingFallback() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center" role="status">
      <span>{t("roleDashboard.loading")}</span>
    </div>
  );
}

export default RouteLoadingFallback;
