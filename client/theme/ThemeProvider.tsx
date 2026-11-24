import { colorScheme, useColorScheme } from "nativewind";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ThemeMode, ThemeName } from "./theme";

type ThemeContextType = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  mode: Exclude<ThemeMode, ThemeMode.System>;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<ThemeName>(ThemeName.Purple);
  const [mode, _setMode] = useState<ThemeMode>(ThemeMode.Dark);

  // Use NativeWind's imperative colorScheme API rather than the hook's
  // setColorScheme: its identity changes every render, which re-ran the
  // effect and reset NativeWind to dark after the user picked another mode.
  // ThemeMode values ("dark" | "light" | "system") match what
  // colorScheme.set() accepts, so System hands control back to the OS.
  useEffect(() => {
    colorScheme.set(ThemeMode.Dark);
  }, []);

  const setMode = useCallback((mode: ThemeMode) => {
    _setMode(mode);
    colorScheme.set(mode);
  }, []);

  // In System mode NativeWind follows the OS, so its resolved scheme is the
  // system preference. Default to dark if null gets returned for some reason.
  const systemMode =
    useColorScheme().colorScheme === "light" ? ThemeMode.Light : ThemeMode.Dark;
  const resolvedMode = mode === ThemeMode.System ? systemMode : mode;

  // Memoize the context value so consumers only re-render when the theme
  // actually changes, not on every ThemeProvider render.
  const value = useMemo(
    () => ({ theme, setTheme, mode: resolvedMode, setMode }),
    [theme, resolvedMode, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
