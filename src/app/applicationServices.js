import { createApplicationServices } from "@/application/createApplicationServices";
import * as admin from "@/infrastructure/repositories/adminPatientIntakesRepository";
import * as auth from "@/infrastructure/repositories/authRepository";
import * as dashboard from "@/infrastructure/repositories/roleDashboardRepository";
import * as doctorWorkspace from "@/infrastructure/repositories/doctorWorkspaceRepository";
import * as patientIntake from "@/infrastructure/repositories/patientIntakeRepository";
import * as patientWorkspace from "@/infrastructure/repositories/patientWorkspaceRepository";
import { sessionRepository as session } from "@/infrastructure/repositories/sessionRepository";

const applicationServices = createApplicationServices({
  admin,
  auth,
  dashboard,
  doctorWorkspace,
  patientIntake,
  patientWorkspace,
  session,
});

export default applicationServices;
