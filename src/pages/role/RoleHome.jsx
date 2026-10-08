import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/useAuth";
import LanguageToggle from "../../components/common/LanguageToggle";

function RoleHome({ role }) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const roleKey = role.toLowerCase();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link to="/" className="text-lg font-bold text-primary" aria-label={t("accessibility.home")}>
            HCMS
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t("roleHome.logout")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl items-center px-5 py-12 sm:px-6 lg:px-8">
        <section className="w-full rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-primary/5 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t(`roleHome.roles.${roleKey}.label`)}
          </p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            {t(`roleHome.roles.${roleKey}.title`)}
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-text-secondary">
            {t("roleHome.dashboardPending")}
          </p>
        </section>
      </main>
    </div>
  );
}

export default RoleHome;
