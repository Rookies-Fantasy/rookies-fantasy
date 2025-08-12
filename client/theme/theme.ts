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

const purpleColors = {
  "--color-primary-25": "236 238 255",
  "--color-primary-50": "236 238 255",
  "--color-primary-100": "221 223 255",
  "--color-primary-200": "194 196 255",
  "--color-primary-300": "156 156 255",
  "--color-primary-400": "129 117 255",
  "--color-primary-500": "96 66 255",
  "--color-primary-600": "99 54 245",
  "--color-primary-700": "86 42 216",
  "--color-primary-800": "70 37 174",
  "--color-primary-900": "59 38 137",
  "--color-primary-950": "36 22 80",
};

const greenColors = {
  "--color-primary-25": "253 254 253",
  "--color-primary-50": "238 255 242",
  "--color-primary-100": "215 255 228",
  "--color-primary-200": "178 255 202",
  "--color-primary-300": "118 255 162",
  "--color-primary-400": "51 245 115",
  "--color-primary-500": "9 222 79",
  "--color-primary-600": "0 169 56",
  "--color-primary-700": "4 145 52",
  "--color-primary-800": "10 113 45",
  "--color-primary-900": "10 93 40",
  "--color-primary-950": "0 52 19",
};

const darkModeColors = {
  "--color-mode": "10 13 18",
  "--color-mode-contrast": "255 255 255",
};

const lightModeColors = {
  "--color-mode": "255 255 255",
  "--color-mode-contrast": "0 0 0",
};

export const themes = {
  purple: {
    light: vars({
      ...purpleColors,
      ...lightModeColors,
    }),
    dark: vars({
      ...purpleColors,
      ...darkModeColors,
    }),
  },
  green: {
    light: vars({
      ...greenColors,
      ...lightModeColors,
    }),
    dark: vars({
      ...greenColors,
      ...darkModeColors,
    }),
  },
  // More themes
};

type ThemePalettes = {
  [key in ThemeName]: {
    [mode in Exclude<ThemeMode, ThemeMode.System>]: any;
  };
};

export const colorPalettes: ThemePalettes = {
  [ThemeName.Purple]: {
    [ThemeMode.Light]: {
      25: "#FDFDFF",
      50: "#ECEEFF",
      100: "#DDDFFF",
      200: "#C2C4FF",
      300: "#9C9CFF",
      400: "#8175FF",
      500: "#6042FF",
      600: "#6336F5",
      700: "#562AD8",
      800: "#4625AE",
      900: "#3B2689",
      950: "#241650",
      background: "#FFFFFF",
      contrast: "#000000",
    },
    [ThemeMode.Dark]: {
      25: "#FDFDFF",
      50: "#ECEEFF",
      100: "#DDDFFF",
      200: "#C2C4FF",
      300: "#9C9CFF",
      400: "#8175FF",
      500: "#6042FF",
      600: "#6336F5",
      700: "#562AD8",
      800: "#4625AE",
      900: "#3B2689",
      950: "#241650",
      background: "#0A0D12",
      contrast: "#FFFFFF",
    },
  },
  [ThemeName.Green]: {
    [ThemeMode.Light]: {
      25: "#FDFEFD",
      50: "#EEFFF2",
      100: "#D7FFE4",
      200: "#B2FFCA",
      300: "#76FFA2",
      400: "#33F573",
      500: "#09DE4F",
      600: "#00A938",
      700: "#049134",
      800: "#0A712D",
      900: "#0A5D28",
      950: "#003413",
      background: "#FFFFFF",
      contrast: "#000000",
    },
    [ThemeMode.Dark]: {
      25: "#FDFEFD",
      50: "#EEFFF2",
      100: "#D7FFE4",
      200: "#B2FFCA",
      300: "#76FFA2",
      400: "#33F573",
      500: "#09DE4F",
      600: "#00A938",
      700: "#049134",
      800: "#0A712D",
      900: "#0A5D28",
      950: "#003413",
      background: "#0A0D12",
      contrast: "#FFFFFF",
    },
  },
};
