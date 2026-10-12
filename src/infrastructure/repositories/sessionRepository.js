import { clearAuthToken, getAuthToken, setAuthToken } from "@/infrastructure/http/apiClient";

export const sessionRepository = {
  clear: clearAuthToken,
  getToken: getAuthToken,
  setToken: setAuthToken,
};
