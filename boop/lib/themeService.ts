import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeName = "lilac" | "blue" | "green" | "pink" | "orange" | "purple";

export interface Theme {
  name: ThemeName;
  displayName: string;
  colors: {
    bg: {
      dark: string;
      DEFAULT: string;
      light: string;
    };
    text: {
      DEFAULT: string;
      muted: string;
    };
    highlight: string;
    border: {
      DEFAULT: string;
      muted: string;
    };
    primary: string;
    secondary: string;
    danger: string;
    warning: string;
    success: string;
    info: string;
  };
}

export const themes: Record<ThemeName, Theme> = {
  lilac: {
    name: "lilac",
    displayName: "Lilac",
    colors: {
      bg: {
        dark: "#ede9fe",
        DEFAULT: "#f5f3ff",
        light: "#ffffff",
      },
      text: {
        DEFAULT: "#2e1065",
        muted: "#6d28d9",
      },
      highlight: "#ffffff",
      border: {
        DEFAULT: "#c4b5fd",
        muted: "#ddd6fe",
      },
      primary: "#c8a2c8",
      secondary: "#8b5cf6",
      danger: "#ef4444",
      warning: "#f59e0b",
      success: "#10b981",
      info: "#3b82f6",
    },
  },
  blue: {
    name: "blue",
    displayName: "Ocean",
    colors: {
      bg: {
        dark: "#dbeafe",
        DEFAULT: "#eff6ff",
        light: "#ffffff",
      },
      text: {
        DEFAULT: "#1e3a8a",
        muted: "#3b82f6",
      },
      highlight: "#ffffff",
      border: {
        DEFAULT: "#93c5fd",
        muted: "#bfdbfe",
      },
      primary: "#60a5fa",
      secondary: "#3b82f6",
      danger: "#ef4444",
      warning: "#f59e0b",
      success: "#10b981",
      info: "#3b82f6",
    },
  },
  green: {
    name: "green",
    displayName: "Forest",
    colors: {
      bg: {
        dark: "#d1fae5",
        DEFAULT: "#ecfdf5",
        light: "#ffffff",
      },
      text: {
        DEFAULT: "#065f46",
        muted: "#10b981",
      },
      highlight: "#ffffff",
      border: {
        DEFAULT: "#6ee7b7",
        muted: "#a7f3d0",
      },
      primary: "#34d399",
      secondary: "#10b981",
      danger: "#ef4444",
      warning: "#f59e0b",
      success: "#10b981",
      info: "#3b82f6",
    },
  },
  pink: {
    name: "pink",
    displayName: "Rose",
    colors: {
      bg: {
        dark: "#fce7f3",
        DEFAULT: "#fdf2f8",
        light: "#ffffff",
      },
      text: {
        DEFAULT: "#831843",
        muted: "#ec4899",
      },
      highlight: "#ffffff",
      border: {
        DEFAULT: "#f9a8d4",
        muted: "#fbcfe8",
      },
      primary: "#f472b6",
      secondary: "#ec4899",
      danger: "#ef4444",
      warning: "#f59e0b",
      success: "#10b981",
      info: "#3b82f6",
    },
  },
  orange: {
    name: "orange",
    displayName: "Sunset",
    colors: {
      bg: {
        dark: "#fed7aa",
        DEFAULT: "#fff7ed",
        light: "#ffffff",
      },
      text: {
        DEFAULT: "#7c2d12",
        muted: "#f97316",
      },
      highlight: "#ffffff",
      border: {
        DEFAULT: "#fdba74",
        muted: "#fed7aa",
      },
      primary: "#fb923c",
      secondary: "#f97316",
      danger: "#ef4444",
      warning: "#f59e0b",
      success: "#10b981",
      info: "#3b82f6",
    },
  },
  purple: {
    name: "purple",
    displayName: "Amethyst",
    colors: {
      bg: {
        dark: "#e9d5ff",
        DEFAULT: "#faf5ff",
        light: "#ffffff",
      },
      text: {
        DEFAULT: "#581c87",
        muted: "#a855f7",
      },
      highlight: "#ffffff",
      border: {
        DEFAULT: "#c084fc",
        muted: "#d8b4fe",
      },
      primary: "#a78bfa",
      secondary: "#a855f7",
      danger: "#ef4444",
      warning: "#f59e0b",
      success: "#10b981",
      info: "#3b82f6",
    },
  },
};

export class ThemeService {
  private static readonly STORAGE_KEY = "boop_theme";
  private static currentTheme: ThemeName = "lilac";
  private static listeners: Set<(theme: ThemeName) => void> = new Set();

  // Initialize theme from storage
  static async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const themeName = stored as ThemeName;
        if (themes[themeName]) {
          this.currentTheme = themeName;
        }
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    }
  }

  // Get current theme name
  static getCurrentTheme(): ThemeName {
    return this.currentTheme;
  }

  // Get current theme object
  static getTheme(): Theme {
    return themes[this.currentTheme];
  }

  // Get all available themes
  static getAllThemes(): Theme[] {
    return Object.values(themes);
  }

  // Set theme
  static async setTheme(themeName: ThemeName): Promise<boolean> {
    if (!themes[themeName]) {
      return false;
    }

    try {
      this.currentTheme = themeName;
      await AsyncStorage.setItem(this.STORAGE_KEY, themeName);
      
      // Notify listeners
      this.listeners.forEach((listener) => listener(themeName));
      
      return true;
    } catch (error) {
      console.error("Failed to save theme:", error);
      return false;
    }
  }

  // Subscribe to theme changes
  static subscribe(listener: (theme: ThemeName) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

