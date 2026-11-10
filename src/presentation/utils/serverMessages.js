// Backend error messages are English text. Known messages are shown through
// translation keys so they follow the interface language; unknown ones fall
// back to a localized general message instead of raw server text.
const SERVER_MESSAGE_KEYS = {
  "Unavailable doctors cannot receive routine assignments": "serverMessages.doctorUnavailable",
  "An active assignment already exists for this doctor and patient": "serverMessages.activeAssignmentExists",
  "A non-empty internal assignment reason is required": "serverMessages.assignmentReasonRequired",
  "Doctor account is not active": "serverMessages.doctorInactive",
  "Patient account is not active": "serverMessages.patientInactive",
  "Doctor not found": "serverMessages.doctorNotFound",
  "Active Doctor not found": "serverMessages.doctorNotFound",
  "Patient not found": "serverMessages.patientNotFound",
  "Doctor-patient assignment not found": "serverMessages.assignmentNotFound",
  "Patient intake must be under review before assignment": "serverMessages.intakeReviewRequired",
  "Only a submitted intake can enter review": "serverMessages.intakeNotSubmitted",
  "Doctor specialization is not eligible for Emergency Alert assignment": "serverMessages.doctorNotEligibleForEmergency",
  "Emergency Alert is not pending assignment": "serverMessages.emergencyNoLongerPending",
  "Emergency Alert can no longer be assigned": "serverMessages.emergencyNoLongerPending",
  "Emergency Alert not found": "serverMessages.emergencyNotFound",
  "Intake correction request not found": "serverMessages.correctionNotFound",
  "Intake correction request is already resolved": "serverMessages.correctionAlreadyResolved",
  "Correction requests are available after administration starts review": "serverMessages.correctionBeforeReview",
  "Submit a patient intake before requesting a correction": "serverMessages.correctionWithoutIntake",
  "Validation failed": "serverMessages.validationFailed",
};

const PREFIX_KEYS = [
  ["Doctor-patient assignment is already", "serverMessages.assignmentStatusUnchanged"],
];

export function serverMessageKey(message) {
  if (typeof message !== "string") return null;
  if (SERVER_MESSAGE_KEYS[message]) return SERVER_MESSAGE_KEYS[message];
  const prefix = PREFIX_KEYS.find(([start]) => message.startsWith(start));
  return prefix ? prefix[1] : null;
}

export function translateServerMessage(t, message, fallbackKey) {
  const key = serverMessageKey(message);
  return t(key || fallbackKey);
}
