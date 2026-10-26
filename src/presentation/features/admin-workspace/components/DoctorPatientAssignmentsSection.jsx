import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApplicationServices } from "@/app/useApplicationServices";

function errorMessage(error, t) {
  const status = error.response?.status;
  if (status === 400) return t("adminAssignments.errors.validation");
  if (status === 403) return t("adminAssignments.errors.forbidden");
  if (status === 404) return t("adminAssignments.errors.notFound");
  if (status === 409) return t("adminAssignments.errors.conflict");
  return t("adminAssignments.errors.server");
}

function DoctorPatientAssignmentsSection() {
  const { t } = useTranslation();
  const { admin } = useApplicationServices();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const response = await admin.listDoctorPatientAssignments();
    setAssignments(response.data.assignments);
  }

  useEffect(() => {
    let active = true;
    admin.listDoctorPatientAssignments()
      .then((response) => active && setAssignments(response.data.assignments))
      .catch((requestError) => active && setError(errorMessage(requestError, t)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [admin, t]);

  async function changeStatus(assignment) {
    const status = assignment.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setBusyId(assignment.id); setError(""); setNotice("");
    try {
      await admin.updateDoctorPatientAssignmentStatus(assignment.id, status);
      await load();
      setNotice(t("adminAssignments.saved"));
    } catch (requestError) {
      setError(errorMessage(requestError, t));
    } finally { setBusyId(null); }
  }

  return <section id="admin-assignments" className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
    <p className="text-sm font-semibold text-primary">{t("adminAssignments.eyebrow")}</p>
    <h2 className="mt-1 text-xl font-bold">{t("adminAssignments.title")}</h2>
    <p className="mt-2 text-sm text-text-secondary">{t("adminAssignments.description")}</p>
    {error && <p role="alert" className="mt-5 rounded-xl bg-danger/10 p-4 text-sm text-danger">{error}</p>}
    {notice && <p role="status" className="mt-5 rounded-xl bg-primary/10 p-4 text-sm text-primary">{notice}</p>}
    {loading ? <p className="mt-5 text-sm text-text-secondary">{t("adminAssignments.loading")}</p> : assignments.length === 0 ? <p className="mt-5 text-sm text-text-secondary">{t("adminAssignments.empty")}</p> : <div className="mt-5 space-y-3">{assignments.map((assignment) => <article key={assignment.id} className="rounded-xl border border-border bg-background p-4"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-bold">{assignment.patient?.full_name || assignment.patient_name}</p><p className="mt-1 text-sm text-text-secondary">{assignment.doctor?.full_name || assignment.doctor_name} · {assignment.doctor?.specialization || assignment.specialization || "—"}</p><p className="mt-2 text-xs text-text-secondary">{t("adminAssignments.status")}: {t(`adminAssignments.statuses.${assignment.status}`)}</p></div><button type="button" disabled={busyId === assignment.id} onClick={() => changeStatus(assignment)} className="min-h-11 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60">{busyId === assignment.id ? t("adminAssignments.working") : assignment.status === "ACTIVE" ? t("adminAssignments.deactivate") : t("adminAssignments.activate")}</button></div></article>)}</div>}
  </section>;
}

export default DoctorPatientAssignmentsSection;
