import { useTranslation } from "react-i18next";
import RoleLayout from "../../layouts/RoleLayout";

function RoleHome({ role }) {
  const { t } = useTranslation();
  const roleKey = role.toLowerCase();

  return (
    <RoleLayout role={role} mainClassName="flex min-h-[calc(100vh-12rem)] items-center">
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
    </RoleLayout>
  );
}

export default RoleHome;
