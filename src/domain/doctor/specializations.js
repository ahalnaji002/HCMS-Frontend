// The fixed list of Doctor specializations. The API stores and returns the
// English value; the UI shows the translated label (specializations.<key>).
// Keep this list in sync with HCMS-Backend src/utils/specializations.js.
export const SPECIALIZATIONS = Object.freeze([
  { value: "General Medicine", key: "generalMedicine" },
  { value: "Emergency Medicine", key: "emergencyMedicine" },
  { value: "Family Medicine", key: "familyMedicine" },
  { value: "Internal Medicine", key: "internalMedicine" },
  { value: "General Surgery", key: "generalSurgery" },
  { value: "Orthopedics", key: "orthopedics" },
  { value: "Plastic and Reconstructive Surgery", key: "plasticSurgery" },
  { value: "Pediatrics", key: "pediatrics" },
  { value: "Obstetrics and Gynecology", key: "obstetricsGynecology" },
  { value: "Cardiology", key: "cardiology" },
  { value: "Neurology", key: "neurology" },
  { value: "Psychiatry", key: "psychiatry" },
  { value: "Physical Medicine and Rehabilitation", key: "rehabilitation" },
  { value: "Dermatology", key: "dermatology" },
  { value: "Ophthalmology", key: "ophthalmology" },
  { value: "Otolaryngology", key: "otolaryngology" },
  { value: "Anesthesiology", key: "anesthesiology" },
]);

// Doctors with these specializations can take Emergency Alerts.
export const EMERGENCY_ELIGIBLE_SPECIALIZATIONS = Object.freeze(["General Medicine", "Emergency Medicine"]);

const KEY_BY_VALUE = new Map(SPECIALIZATIONS.map(({ value, key }) => [value, key]));

export function specializationKey(value) {
  return KEY_BY_VALUE.get(value) || null;
}

export function isEmergencyEligibleSpecialization(value) {
  return EMERGENCY_ELIGIBLE_SPECIALIZATIONS.includes(value);
}
