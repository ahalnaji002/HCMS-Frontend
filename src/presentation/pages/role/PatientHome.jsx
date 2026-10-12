import PatientWorkspaceFeature from "@/presentation/features/patient-workspace/PatientWorkspaceFeature";
import RoleLayout from "@/presentation/layouts/RoleLayout";

function PatientHome() {
  return (
    <RoleLayout role="PATIENT">
      <PatientWorkspaceFeature />
    </RoleLayout>
  );
}

export default PatientHome;
