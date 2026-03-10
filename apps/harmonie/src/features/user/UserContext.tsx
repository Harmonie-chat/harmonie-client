import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getMe } from '@/api/users';
import type { UserProfile } from '@/api/users';
import { useAuth } from '@/features/auth/AuthContext';

interface UserContextValue {
  user: UserProfile | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  isLoading: false,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setUser(null);
      return;
    }
    setIsLoading(true);
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  return <UserContext.Provider value={{ user, isLoading }}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
