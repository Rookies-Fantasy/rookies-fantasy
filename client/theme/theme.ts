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

export const themes = {
  purple: {
    light: vars({
      "--color-primary": "96 66 255",
      "--color-background": "96 66 255",
      "--color-text": "0 0 0",
    }),
    dark: vars({
      "--color-primary": "129 117 255",
      "--color-background": "96 66 255",
      "--color-text": "255 255 255",
    }),
  },
  green: {
    light: vars({
      "--color-primary": "9 222 79",
      "--color-background": "9 222 79",
      "--color-text": "0 0 0",
    }),
    dark: vars({
      "--color-primary": "51 245 115",
      "--color-background": "9 222 79",
      "--color-text": "255 255 255",
    }),
  },
  // More themes
};
