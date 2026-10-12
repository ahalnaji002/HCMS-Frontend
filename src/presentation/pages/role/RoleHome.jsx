import { useTranslation } from "react-i18next";
import RoleLayout from "@/presentation/layouts/RoleLayout";
import RoleDashboard from "@/presentation/features/role-dashboard/RoleDashboard";

function RoleHome({ role }) {
  const { t } = useTranslation();
  const roleKey = role.toLowerCase();

  return (
    <RoleLayout role={role}>
        <h1 className="sr-only">{t(`roleHome.roles.${roleKey}.title`)}</h1>
        <RoleDashboard role={role} />
    </RoleLayout>
  );
}

export default RoleHome;
