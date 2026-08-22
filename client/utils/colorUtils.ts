// Colour tokens live in tailwind.config.js and are normally consumed through
// NativeWind `className` props. A few third-party props (LinearGradient's
// `colors`) take raw colour values instead, and TypeScript cannot import
// tailwind.config.js — it mixes an ESM `import` with `module.exports`, so TS
// resolves it to a module with no exports. This is the single place those raw
// values are declared; every entry must match its token in tailwind.config.js.
export const themeColors = {
  gray920: "#12151C",
} as const;

const HEX_COLOR = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

// Converts a 6-digit hex colour into an rgba() string, so a translucent variant
// of a token is derived from the token rather than written out by hand.
export const hexToRgba = (hex: string, alpha: number): string => {
  const match = HEX_COLOR.exec(hex);

  if (!match) {
    throw new Error(`Expected a 6-digit hex colour, received "${hex}"`);
  }

  const [red, green, blue] = match
    .slice(1)
    .map((channel) => parseInt(channel, 16));

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};
