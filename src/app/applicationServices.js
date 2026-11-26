import { createApplicationServices } from "@/application/createApplicationServices";
import * as admin from "@/infrastructure/repositories/adminPatientIntakesRepository";
import * as adminReports from "@/infrastructure/repositories/adminReportsRepository";
import * as auth from "@/infrastructure/repositories/authRepository";
import * as dashboard from "@/infrastructure/repositories/roleDashboardRepository";
import * as doctorWorkspace from "@/infrastructure/repositories/doctorWorkspaceRepository";
import * as ngoWorkspace from "@/infrastructure/repositories/ngoWorkspaceRepository";
import * as patientIntake from "@/infrastructure/repositories/patientIntakeRepository";
import * as publicEmergency from "@/infrastructure/repositories/publicEmergencyRepository";
import * as patientWorkspace from "@/infrastructure/repositories/patientWorkspaceRepository";
import * as reminders from "@/infrastructure/repositories/remindersRepository";
import * as messaging from "@/infrastructure/repositories/messagingRepository";
import * as notifications from "@/infrastructure/repositories/notificationsRepository";
import { sessionRepository as session } from "@/infrastructure/repositories/sessionRepository";

const applicationServices = createApplicationServices({
  admin,
  adminReports,
  auth,
  dashboard,
  doctorWorkspace,
  ngoWorkspace,
  patientIntake,
  patientWorkspace,
  publicEmergency,
  reminders,
  messaging,
  notifications,
  session,
});

export default applicationServices;
