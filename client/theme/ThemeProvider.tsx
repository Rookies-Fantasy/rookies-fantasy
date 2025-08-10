import { useColorScheme } from "nativewind";
import { createContext, ReactNode, useContext, useState } from "react";
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
  const [mode, _setMode] = useState<ThemeMode>(ThemeMode.System);
  const { setColorScheme } = useColorScheme();

  const setMode = (mode: ThemeMode) => {
    _setMode(mode);
    setColorScheme(mode);
  };

  // Default to dark if null gets returned for some reason
  const systemMode =
    useColorScheme().colorScheme === "light" ? ThemeMode.Light : ThemeMode.Dark;
  const resolvedMode = mode === ThemeMode.System ? systemMode : mode;

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, mode: resolvedMode, setMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
