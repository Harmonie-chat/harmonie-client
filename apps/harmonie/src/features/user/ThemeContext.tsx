import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { THEMES, type Theme } from '@harmonie/ui';

export type { Theme };
export { THEMES };

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'default',
  setTheme: () => {},
});

const updatePwaThemeChrome = () => {
  const rootStyles = getComputedStyle(document.documentElement);
  const backgroundColor = rootStyles.getPropertyValue('--color-background').trim();
  const resolvedBackgroundColor = backgroundColor || '#f5f0eb';

  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = resolvedBackgroundColor;
  });
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('default');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    updatePwaThemeChrome();
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => use(ThemeContext);
