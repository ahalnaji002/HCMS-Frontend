import NgoWorkspaceFeature from "@/presentation/features/ngo-workspace/NgoWorkspaceFeature";
import RoleLayout from "@/presentation/layouts/RoleLayout";

function NgoHome() {
  return (
    <RoleLayout role="NGO">
      <NgoWorkspaceFeature />
    </RoleLayout>
  );
}

export default NgoHome;
