// Survives the redirect to /login so the login page can explain what happened.
const SESSION_EXPIRED_KEY = "hcms-session-expired";

export function markSessionExpired() {
  try { sessionStorage.setItem(SESSION_EXPIRED_KEY, "1"); } catch { /* storage unavailable */ }
}

export function consumeSessionExpired() {
  try {
    const expired = sessionStorage.getItem(SESSION_EXPIRED_KEY) === "1";
    sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    return expired;
  } catch {
    return false;
  }
}
