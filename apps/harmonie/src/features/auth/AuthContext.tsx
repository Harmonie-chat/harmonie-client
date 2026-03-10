import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { refreshTokens } from '@/api/auth';
import { clearTokens, getRefreshToken, storeTokens } from '@/api/authStorage';
import { setLogoutHandler } from '@/api/client';
import type { ApiError } from '@/api/errors';

interface AuthContextValue {
  isAuthenticated: boolean;
  isInitializing: boolean;
  setIsAuthenticated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isInitializing: true,
  setIsAuthenticated: () => {},
});

const FATAL_REFRESH_CODES = new Set([
  'AUTH_INVALID_REFRESH_TOKEN',
  'AUTH_REFRESH_TOKEN_REUSE_DETECTED',
  'AUTH_USER_INACTIVE',
]);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // useRef guard intentional: POST /auth/refresh consumes the token.
  // A double call (StrictMode) would trigger AUTH_REFRESH_TOKEN_REUSE_DETECTED
  // and invalidate the entire token family server-side.
  const initialized = useRef(false);

  useEffect(() => {
    setLogoutHandler(() => {
      clearTokens();
      setIsAuthenticated(false);
    });
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const response = await refreshTokens({ refreshToken });
          storeTokens(response);
          setIsAuthenticated(true);
        } catch (err) {
          const apiError = err as ApiError;
          if (FATAL_REFRESH_CODES.has(apiError?.code)) clearTokens();
        }
      }
      setIsInitializing(false);
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isInitializing, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
