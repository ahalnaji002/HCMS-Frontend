import { isUserRole } from "@/domain/auth/roles";

function execute(repositoryOperation) {
  return (...args) => repositoryOperation(...args).then((response) => response.data);
}

export function createApplicationServices(repositories) {
  const { admin, auth, dashboard, doctorWorkspace, patientIntake, patientWorkspace, session } = repositories;

  return {
    session,
    auth: {
      login: execute(auth.login),
      getCurrentUser: execute(auth.getCurrentUser),
      registerPatient: execute(auth.registerPatient),
      registerDoctor: execute(auth.registerDoctor),
      registerNgo: execute(auth.registerNgo),
    },
    patientIntake: {
      getPatientIntake: execute(patientIntake.getPatientIntake),
      submitPatientIntake: execute(patientIntake.submitPatientIntake),
      updatePatientIntake: execute(patientIntake.updatePatientIntake),
    },
    patientWorkspace: {
      getOwnProfile: execute(patientWorkspace.getOwnProfile),
      getPatientAlerts: execute(patientWorkspace.getPatientAlerts),
      createPatientAlert: execute(patientWorkspace.createPatientAlert),
      getPatientAssignments: execute(patientWorkspace.getPatientAssignments),
      listOwnDiagnoses: execute(patientWorkspace.listOwnDiagnoses),
      listPatientIntakeCorrectionRequests: execute(patientWorkspace.listPatientIntakeCorrectionRequests),
      createPatientIntakeCorrectionRequest: execute(patientWorkspace.createPatientIntakeCorrectionRequest),
    },
    doctorWorkspace: {
      listAssignedPatients: execute(doctorWorkspace.listAssignedPatients),
      getAssignedPatientIntake: execute(doctorWorkspace.getAssignedPatientIntake),
      listOwnPatientNotes: execute(doctorWorkspace.listOwnPatientNotes),
      listPatientDiagnoses: execute(doctorWorkspace.listPatientDiagnoses),
      createPatientDiagnosis: execute(doctorWorkspace.createPatientDiagnosis),
      getPatientMedicalRecord: execute(doctorWorkspace.getPatientMedicalRecord),
      createPatientMedicalRecord: execute(doctorWorkspace.createPatientMedicalRecord),
      updatePatientMedicalRecord: execute(doctorWorkspace.updatePatientMedicalRecord),
      createPatientMedicalNote: execute(doctorWorkspace.createPatientMedicalNote),
    },
    admin: {
      listJoinRequests: execute(admin.listJoinRequests),
      getJoinRequest: execute(admin.getJoinRequest),
      approveJoinRequest: execute(admin.approveJoinRequest),
      rejectJoinRequest: execute(admin.rejectJoinRequest),
      listPatientIntakes: execute(admin.listPatientIntakes),
      listActiveDoctors: execute(admin.listActiveDoctors),
      listAdminEmergencyAlerts: execute(admin.listAdminEmergencyAlerts),
      assignDoctorToEmergencyAlert: execute(admin.assignDoctorToEmergencyAlert),
      updateDoctorWorkload: execute(admin.updateDoctorWorkload),
      startPatientIntakeReview: execute(admin.startPatientIntakeReview),
      assignDoctorToPatient: execute(admin.assignDoctorToPatient),
      listDoctorPatientAssignments: execute(admin.listDoctorPatientAssignments),
      updateDoctorPatientAssignmentStatus: execute(admin.updateDoctorPatientAssignmentStatus),
      listIntakeCorrectionRequests: execute(admin.listIntakeCorrectionRequests),
      resolveIntakeCorrectionRequest: execute(admin.resolveIntakeCorrectionRequest),
    },
    dashboard: {
      getRoleDashboard(role) {
        if (!isUserRole(role)) throw new Error(`Unsupported dashboard role: ${role}`);
        return execute(dashboard.getRoleDashboard)(role);
      },
    },
  };
}
