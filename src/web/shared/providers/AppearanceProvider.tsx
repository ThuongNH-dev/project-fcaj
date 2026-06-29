import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ThemeProvider as NextThemeProvider } from "next-themes";

export type AccentColor =
  | "green"
  | "blue"
  | "violet"
  | "pink"
  | "amber"
  | "red";
export type DensityMode = "compact" | "default" | "comfortable";

interface AppearanceContextValue {
  accentColor: AccentColor;
  density: DensityMode;
  setAccentColor: (accentColor: AccentColor) => void;
  setDensity: (density: DensityMode) => void;
}

const APPEARANCE_STORAGE_KEYS = {
  accentColor: "splitly-accent-color",
  density: "splitly-density",
} as const;

const APPEARANCE_PRESETS: Record<
  AccentColor,
  {
    brand50: string;
    brand100: string;
    brand400: string;
    brand500: string;
    brand600: string;
    brand700: string;
  }
> = {
  green: {
    brand50: "#F0FAF5",
    brand100: "#D1FAE5",
    brand400: "#7EDDBA",
    brand500: "#16A34A",
    brand600: "#15803D",
    brand700: "#065F46",
  },
  blue: {
    brand50: "#EFF6FF",
    brand100: "#DBEAFE",
    brand400: "#60A5FA",
    brand500: "#2563EB",
    brand600: "#1D4ED8",
    brand700: "#1E3A8A",
  },
  violet: {
    brand50: "#F5F3FF",
    brand100: "#EDE9FE",
    brand400: "#A78BFA",
    brand500: "#7C3AED",
    brand600: "#6D28D9",
    brand700: "#4C1D95",
  },
  pink: {
    brand50: "#FDF2F8",
    brand100: "#FCE7F3",
    brand400: "#F472B6",
    brand500: "#DB2777",
    brand600: "#BE185D",
    brand700: "#9D174D",
  },
  amber: {
    brand50: "#FFFBEB",
    brand100: "#FEF3C7",
    brand400: "#FBBF24",
    brand500: "#D97706",
    brand600: "#B45309",
    brand700: "#92400E",
  },
  red: {
    brand50: "#FEF2F2",
    brand100: "#FEE2E2",
    brand400: "#F87171",
    brand500: "#DC2626",
    brand600: "#B91C1C",
    brand700: "#991B1B",
  },
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function getStoredAccentColor(): AccentColor {
  if (typeof window === "undefined") {
    return "green";
  }

  const storedAccentColor = window.localStorage.getItem(
    APPEARANCE_STORAGE_KEYS.accentColor,
  );

  if (
    storedAccentColor === "green" ||
    storedAccentColor === "blue" ||
    storedAccentColor === "violet" ||
    storedAccentColor === "pink" ||
    storedAccentColor === "amber" ||
    storedAccentColor === "red"
  ) {
    return storedAccentColor;
  }

  return "green";
}

function getStoredDensity(): DensityMode {
  if (typeof window === "undefined") {
    return "default";
  }

  const storedDensity = window.localStorage.getItem(
    APPEARANCE_STORAGE_KEYS.density,
  );

  if (
    storedDensity === "compact" ||
    storedDensity === "default" ||
    storedDensity === "comfortable"
  ) {
    return storedDensity;
  }

  return "default";
}

function AppearanceSettingsProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColor] = useState<AccentColor>(getStoredAccentColor);
  const [density, setDensity] = useState<DensityMode>(getStoredDensity);

  useEffect(() => {
    const root = document.documentElement;
    const preset = APPEARANCE_PRESETS[accentColor];

    root.style.setProperty("--brand-50", preset.brand50);
    root.style.setProperty("--brand-100", preset.brand100);
    root.style.setProperty("--brand-400", preset.brand400);
    root.style.setProperty("--brand-500", preset.brand500);
    root.style.setProperty("--brand-600", preset.brand600);
    root.style.setProperty("--brand-700", preset.brand700);
    root.style.setProperty("--primary", preset.brand400);
    root.style.setProperty("--primary-foreground", preset.brand700);
    root.style.setProperty("--secondary", preset.brand100);
    root.style.setProperty("--secondary-foreground", preset.brand700);
    root.style.setProperty("--accent", preset.brand500);
    root.style.setProperty("--accent-foreground", "#ffffff");
    root.style.setProperty("--ring", preset.brand400);
    root.style.setProperty("--switch-background", preset.brand100);
    root.style.setProperty("--sidebar-primary", preset.brand500);
    root.style.setProperty("--sidebar-ring", preset.brand400);

    window.localStorage.setItem(
      APPEARANCE_STORAGE_KEYS.accentColor,
      accentColor,
    );
  }, [accentColor]);

  useEffect(() => {
    const root = document.documentElement;

    root.dataset.density = density;
    window.localStorage.setItem(APPEARANCE_STORAGE_KEYS.density, density);
  }, [density]);

  return (
    <AppearanceContext.Provider
      value={{
        accentColor,
        density,
        setAccentColor,
        setDensity,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
      storageKey="splitly-theme"
    >
      <AppearanceSettingsProvider>{children}</AppearanceSettingsProvider>
    </NextThemeProvider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);

  if (!context) {
    throw new Error("useAppearance must be used within an AppearanceProvider.");
  }

  return context;
}
