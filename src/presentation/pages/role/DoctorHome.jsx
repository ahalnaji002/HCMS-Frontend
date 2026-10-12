import DoctorWorkspaceFeature from "@/presentation/features/doctor-workspace/DoctorWorkspaceFeature";
import RoleLayout from "@/presentation/layouts/RoleLayout";

function DoctorHome() {
  return (
    <RoleLayout role="DOCTOR">
      <DoctorWorkspaceFeature />
    </RoleLayout>
  );
}

export default DoctorHome;
