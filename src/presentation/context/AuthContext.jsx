import { useEffect, useState } from "react";
import { useApplicationServices } from "@/app/useApplicationServices";
import AuthContext from "@/presentation/context/authContext";
import { SESSION_EXPIRED_EVENT } from "@/infrastructure/http/apiClient";
import { markSessionExpired } from "@/presentation/context/sessionExpiry";

export function AuthProvider({ children }) {
  const { auth, session } = useApplicationServices();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (!session.getToken()) {
        if (isMounted) {
          setIsLoading(false);
        }

        return;
      }

      try {
        const response = await auth.getCurrentUser();

        if (isMounted) {
          setUser(response.data.user);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          session.clear();
          markSessionExpired();
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
  }, [auth, session]);

  // A request failed with 401 while signed in: the token expired (1 hour).
  useEffect(() => {
    function endExpiredSession() {
      markSessionExpired();
      setUser(null);
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, endExpiredSession);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, endExpiredSession);
  }, []);

  function startSession(token, authenticatedUser) {
    session.setToken(token);
    setUser(authenticatedUser);
  }

  function logout() {
    session.clear();
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
