import { useEffect, useState } from "react";
import { useApplicationServices } from "@/app/useApplicationServices";
import AuthContext from "@/presentation/context/authContext";

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
