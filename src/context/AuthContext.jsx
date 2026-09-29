import { useEffect, useState } from "react";
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "../services/api";
import { getCurrentUser } from "../services/auth";
import AuthContext from "./authContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (!getAuthToken()) {
        if (isMounted) {
          setIsLoading(false);
        }

        return;
      }

      try {
        const response = await getCurrentUser();

        if (isMounted) {
          setUser(response.data.user);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          clearAuthToken();
        }

        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  function startSession(token, authenticatedUser) {
    setAuthToken(token);
    setUser(authenticatedUser);
  }

  function logout() {
    clearAuthToken();
    setUser(null);
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    startSession,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}