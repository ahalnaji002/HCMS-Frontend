import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";
import { Button, Card, EmptyState, ErrorState, LoadingState, StatusBadge, useToast } from "@/presentation/components/ui";
import { useSpecializationLabel } from "@/presentation/hooks/useSpecializationLabel";

function errorKey(error) {
  const status = error.response?.status;
  if (status === 400) return "adminAssignments.errors.validation";
  if (status === 403) return "adminAssignments.errors.forbidden";
  if (status === 404) return "adminAssignments.errors.notFound";
  if (status === 409) return "adminAssignments.errors.conflict";
  return "adminAssignments.errors.server";
}

function DoctorPatientAssignmentsSection() {
  const { t } = useTranslation();
  const specializationLabel = useSpecializationLabel();
  const { admin } = useApplicationServices();
  const toast = useToast();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;
    admin.listDoctorPatientAssignments()
      .then((response) => { if (active) { setAssignments(response.data.assignments); setLoadError(""); } })
      .catch((requestError) => { if (active) setLoadError(errorKey(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [admin, reloadCount]);

  async function changeStatus(assignment) {
    const status = assignment.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setBusyId(assignment.id);
    try {
      await admin.updateDoctorPatientAssignmentStatus(assignment.id, status);
      const response = await admin.listDoctorPatientAssignments();
      setAssignments(response.data.assignments);
      toast.success({ key: "adminAssignments.saved" });
    } catch (requestError) {
      toast.error({ key: errorKey(requestError) });
    } finally {
      setBusyId(null);
    }
  }

  function retry() {
    setLoading(true);
    setReloadCount((count) => count + 1);
  }

  if (loading) return <div id="admin-assignments"><LoadingState label={t("adminAssignments.loading")} /></div>;
  if (loadError) return <div id="admin-assignments"><ErrorState message={t(loadError)} onRetry={retry} /></div>;
  if (assignments.length === 0) return <div id="admin-assignments"><EmptyState title={t("adminAssignments.empty")} /></div>;

  return (
    <div id="admin-assignments" className="space-y-3">
      {assignments.map((assignment) => {
        const active = assignment.status === "ACTIVE";
        return (
          <Card
            key={assignment.id}
            as="article"
            padding="sm"
            title={assignment.patient?.full_name || assignment.patient_name}
            description={[assignment.doctor?.full_name || assignment.doctor_name, specializationLabel(assignment.doctor?.specialization || assignment.specialization)].filter(Boolean).join(" · ")}
            actions={(
              <>
                <StatusBadge status={assignment.status} tone={active ? "success" : "neutral"} labelPrefix="adminAssignments.statuses" />
                <Button
                  variant={active ? "danger-outline" : "secondary"}
                  size="sm"
                  loading={busyId === assignment.id}
                  loadingText={t("adminAssignments.working")}
                  disabled={busyId !== null}
                  onClick={() => changeStatus(assignment)}
                >
                  {active ? t("adminAssignments.deactivate") : t("adminAssignments.activate")}
                </Button>
              </>
            )}
          />
        );
      })}
    </div>
  );
}

export default DoctorPatientAssignmentsSection;
