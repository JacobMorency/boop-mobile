import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ThemeService, ThemeName, Theme } from "./themeService";

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (themeName: ThemeName) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>("lilac");
  const [theme, setTheme] = useState<Theme>(ThemeService.getTheme());

  useEffect(() => {
    // Initialize theme service
    ThemeService.initialize().then(() => {
      const currentTheme = ThemeService.getCurrentTheme();
      setThemeName(currentTheme);
      setTheme(ThemeService.getTheme());
    });

    // Subscribe to theme changes
    const unsubscribe = ThemeService.subscribe((newThemeName) => {
      setThemeName(newThemeName);
      setTheme(ThemeService.getTheme());
    });

    return unsubscribe;
  }, []);

  const handleSetTheme = async (newThemeName: ThemeName) => {
    await ThemeService.setTheme(newThemeName);
    // Theme will update via subscription
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeName,
        setTheme: handleSetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

