import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/presentation/context/useAuth";
import { roleRoutes } from "@/presentation/routing/roleRoutes";

function RequireRole({ role, children }) {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const location = useLocation();

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
    // Remember the page so signing in again returns here.
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (user.role !== role) {
    return <Navigate to={roleRoutes[user.role] ?? "/"} replace />;
  }

  return children;
}

export default RequireRole;
