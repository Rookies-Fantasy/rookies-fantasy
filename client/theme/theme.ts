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

export const themes = {
  purple: {
    light: vars({
      ...purpleColors,
      // "--color-background": "96 66 255",
      // "--color-text": "0 0 0",
    }),
    dark: vars({
      ...purpleColors,
      // "--color-background": "96 66 255",
      // "--color-text": "255 255 255",
    }),
  },
  green: {
    light: vars({
      ...greenColors,
      // "--color-background": "9 222 79",
      // "--color-text": "0 0 0",
    }),
    dark: vars({
      ...greenColors,
      // "--color-background": "9 222 79",
      // "--color-text": "255 255 255",
    }),
  },
  // More themes
};
