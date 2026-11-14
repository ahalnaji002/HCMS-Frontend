// Sidebar entries per role. Only items with `available: true` are shown.
// Entries without it are planned screens (mostly Sprint 10): when a screen is
// built, add its route and set `available: true` with its `href` here.
const roleNavigation = {
  PATIENT: [
    { label: "roleNavigation.patient.home", href: "/patient", available: true },
    { label: "roleNavigation.patient.profile", href: "/patient/profile", available: true },
    { label: "roleNavigation.patient.intake", href: "/patient/health-information", available: true },
    { label: "roleNavigation.patient.medicalRecords", href: "/patient/medical-record", available: true },
    { label: "roleNavigation.patient.treatmentPlans", href: "/patient/treatment-plans", available: true },
    { label: "roleNavigation.patient.medicationsAppointments", href: "/patient/medications-appointments", available: true },
    { label: "roleNavigation.patient.emergencyAlerts", href: "/patient/emergency-alerts", available: true },
    { label: "roleNavigation.patient.assistanceRequests" },
    { label: "roleNavigation.patient.messages" },
    { label: "roleNavigation.patient.reminders" },
    { label: "roleNavigation.patient.notifications" },
  ],
  DOCTOR: [
    { label: "roleNavigation.doctor.home", href: "/doctor", available: true },
    { label: "roleNavigation.doctor.patients", href: "/doctor/patients", available: true },
    { label: "roleNavigation.doctor.profile" },
    { label: "roleNavigation.doctor.emergencyAlerts" },
    { label: "roleNavigation.doctor.assistanceRequests" },
    { label: "roleNavigation.doctor.messages" },
    { label: "roleNavigation.doctor.notifications" },
  ],
  NGO: [
    { label: "roleNavigation.ngo.home", href: "/ngo", available: true },
    { label: "roleNavigation.ngo.profile" },
    { label: "roleNavigation.ngo.assistanceRequests", href: "/ngo/assistance-requests", available: true },
    { label: "roleNavigation.ngo.resources" },
    { label: "roleNavigation.ngo.notifications" },
  ],
  ADMIN: [
    { label: "roleNavigation.admin.home", href: "/admin", available: true },
    { label: "roleNavigation.admin.emergencyAlerts", href: "/admin/emergency-alerts", available: true },
    { label: "roleNavigation.admin.patientIntakes", href: "/admin/patient-intakes", available: true },
    { label: "roleNavigation.admin.assignments", href: "/admin/assignments", available: true },
    { label: "roleNavigation.admin.doctorWorkload", href: "/admin/doctor-workload", available: true },
    { label: "roleNavigation.admin.joinRequests", href: "/admin/join-requests", available: true },
    { label: "roleNavigation.admin.support", href: "/admin/support", available: true },
    { label: "roleNavigation.admin.profile" },
    { label: "roleNavigation.admin.userManagement" },
    { label: "roleNavigation.admin.assistanceRequests" },
    { label: "roleNavigation.admin.reports" },
    { label: "roleNavigation.admin.activityLogs" },
    { label: "roleNavigation.admin.settings" },
    { label: "roleNavigation.admin.notifications" },
  ],
};

export default roleNavigation;
