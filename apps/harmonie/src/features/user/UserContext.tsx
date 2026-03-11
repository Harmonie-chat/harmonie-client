import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getMe } from '@/api/users';
import type { UserProfile } from '@/api/users';
import { useAuth } from '@/features/auth/AuthContext';
import i18n from '@/i18n';

interface UserContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  updateUser: (user: UserProfile) => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  isLoading: false,
  updateUser: () => {},
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
      .then((profile) => {
        setUser(profile);
        // Apply the user's saved language preference immediately
        if (profile.language) i18n.changeLanguage(profile.language);
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  return (
    <UserContext.Provider value={{ user, isLoading, updateUser: setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
