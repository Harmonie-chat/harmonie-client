import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { getMe } from '@/api/users';
import { getAccessToken } from '@/api/authStorage';
import type { UserProfile } from '@/types/user';
import { useAuth } from '@/features/auth/AuthContext';
import i18n from '@/i18n';
import { useTheme, THEMES, type Theme } from './ThemeContext';

interface UserContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  updateUser: (user: UserProfile) => void;
}

interface UserState {
  authKey: string | null;
  user: UserProfile | null;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  isLoading: false,
  updateUser: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const { setTheme } = useTheme();
  const authKey = isAuthenticated ? getAccessToken() : null;
  const [state, setState] = useState<UserState>({ authKey: null, user: null });
  const user = authKey !== null && state.authKey === authKey ? state.user : null;
  const isLoading = authKey !== null && state.authKey !== authKey;

  useEffect(() => {
    if (authKey === null) return;
    let active = true;
    getMe()
      .then((profile) => {
        if (!active) return;
        setState({ authKey, user: profile });
        if (profile.language) i18n.changeLanguage(profile.language);
        if (THEMES.includes(profile.theme as Theme)) setTheme(profile.theme as Theme);
      })
      .catch(() => {
        if (active) setState({ authKey, user: null });
      });
    return () => {
      active = false;
    };
  }, [authKey, setTheme]);

  const updateUser = (nextUser: UserProfile) => {
    setState({ authKey, user: nextUser });
  };

  return (
    <UserContext.Provider value={{ user, isLoading, updateUser }}>{children}</UserContext.Provider>
  );
};

export const useUser = () => use(UserContext);
