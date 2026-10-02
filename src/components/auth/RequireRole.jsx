import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/useAuth";
import { roleRoutes } from "../../services/roleRoutes";

function RequireRole({ role, children }) {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-background px-5 text-text-secondary"
        aria-live="polite"
      >
        {t("roleHome.loading")}
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={roleRoutes[user.role] ?? "/"} replace />;
  }

  return children;
}

export default RequireRole;
