const roleDashboardConfig = {
  PATIENT: {
    metrics: [
      "active_treatment_plans",
      "pending_reminders",
      "active_emergency_alerts",
      "pending_assistance_requests",
      "unread_notifications",
    ],
    actions: [
      { label: "intake", href: "#patient-intake" },
      { label: "emergencyAlerts", href: "#emergency-alerts" },
      { label: "profile", href: "#patient-profile" },
    ],
  },
  DOCTOR: {
    metrics: [
      "active_patients",
      "assigned_emergency_alerts",
      "submitted_assistance_requests",
    ],
    actions: [
      { label: "assignedPatients", href: "#doctor-patients" },
    ],
  },
  NGO: {
    metrics: ["assigned_assistance_requests", "resource_allocations"],
    actions: [{ label: "assistanceRequests", available: false }],
  },
  ADMIN: {
    metrics: [
      "total_patients",
      "total_doctors",
      "total_ngos",
      "pending_join_requests",
      "active_emergency_alerts",
      "pending_assistance_requests",
    ],
    actions: [
      { label: "patientIntakes", href: "#admin-intakes" },
      { label: "doctorWorkload", href: "#admin-workload" },
      { label: "emergencyAlerts", href: "#admin-emergencies" },
    ],
  },
};

export default roleDashboardConfig;
