import axios from "axios";

export const TOKEN_STORAGE_KEY = "hcms_access_token";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

// Fired when a signed-in request is rejected with 401 (the token expired or
// was revoked). AuthProvider listens and ends the session in the UI.
export const SESSION_EXPIRED_EVENT = "hcms:session-expired";

// A request that gets no answer within this time fails like a lost
// connection, so the screen shows its "check your connection" message
// instead of loading forever on a weak network.
export const REQUEST_TIMEOUT_MS = 20000;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuth && getAuthToken()) {
      clearAuthToken();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  },
);

export default api;