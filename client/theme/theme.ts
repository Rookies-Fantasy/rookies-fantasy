import { vars } from "nativewind";

export enum ThemeName {
  Green = "green",
  Purple = "purple",
}

export enum ThemeMode {
  Dark = "dark",
  Light = "light",
  System = "system",
}

type ThemePalette = {
  25: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  920?: string;
  950: string;
  mode: string;
  modeContrast: string;
};

type PaletteColors = Omit<ThemePalette, "mode" | "modeContrast">;

type PaletteMode = Pick<ThemePalette, "mode" | "modeContrast">;

type ThemeObject = {
  [key in ThemeName]: {
    [mode in Exclude<ThemeMode, ThemeMode.System>]: ThemePalette;
  };
};

const purpleColors: PaletteColors = {
  25: "236 238 255",
  50: "236 238 255",
  100: "221 223 255",
  200: "194 196 255",
  300: "156 156 255",
  400: "129 117 255",
  500: "96 66 255",
  600: "99 54 245",
  700: "86 42 216",
  800: "70 37 174",
  900: "59 38 137",
  950: "36 22 80",
};

const greenColors: PaletteColors = {
  25: "253 254 253",
  50: "238 255 242",
  100: "215 255 228",
  200: "178 255 202",
  300: "118 255 162",
  400: "51 245 115",
  500: "9 222 79",
  600: "0 169 56",
  700: "4 145 52",
  800: "10 113 45",
  900: "10 93 40",
  950: "0 52 19",
};

const darkModeColors: PaletteMode = {
  mode: "10 13 18",
  modeContrast: "255 255 255",
};

const lightModeColors: PaletteMode = {
  mode: "255 255 255",
  modeContrast: "0 0 0",
};

export const themes: ThemeObject = {
  [ThemeName.Purple]: {
    [ThemeMode.Light]: {
      ...purpleColors,
      ...lightModeColors,
    },
    [ThemeMode.Dark]: {
      ...purpleColors,
      ...darkModeColors,
    },
  },
  [ThemeName.Green]: {
    [ThemeMode.Light]: {
      ...greenColors,
      ...lightModeColors,
    },
    [ThemeMode.Dark]: {
      ...greenColors,
      ...darkModeColors,
    },
  },
};

export const applyCssTheme = (
  theme: ThemeName,
  mode: Exclude<ThemeMode, ThemeMode.System>,
) => {
  const palette = themes[theme][mode];

  const cssVars = Object.fromEntries(
    Object.entries(palette).map(([key, value]) => {
      const newKey =
        key === "mode" || key === "modeContrast"
          ? `--color-${key}`
          : `--color-primary-${key}`;
      return [newKey, value];
    }),
  );

  return vars(cssVars);
};
