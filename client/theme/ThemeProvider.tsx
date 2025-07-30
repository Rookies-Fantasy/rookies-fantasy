import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";

type ThemeName = "purple" | "green";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: Dispatch<SetStateAction<ThemeName>>;
}

const defaultContext: ThemeContextType = {
  theme: "purple",
  setTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);
export function ThemeProvider({ children }: any) {
  const [theme, setTheme] = useState<ThemeName>("purple");
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
