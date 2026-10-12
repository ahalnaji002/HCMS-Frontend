import AdminWorkspaceFeature from "@/presentation/features/admin-workspace/AdminWorkspaceFeature";
import RoleLayout from "@/presentation/layouts/RoleLayout";

function AdminHome() {
  return (
    <RoleLayout role="ADMIN">
      <AdminWorkspaceFeature />
    </RoleLayout>
  );
}

export default AdminHome;
