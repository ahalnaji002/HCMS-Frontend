export const USER_ROLES = Object.freeze({
  PATIENT: "PATIENT",
  DOCTOR: "DOCTOR",
  NGO: "NGO",
  ADMIN: "ADMIN",
});

export function isUserRole(role) {
  return Object.hasOwn(USER_ROLES, role);
}
