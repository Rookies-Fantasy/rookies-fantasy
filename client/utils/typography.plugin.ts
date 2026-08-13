import plugin from "tailwindcss/plugin";

const typographyPlugin = plugin(function ({ addComponents }) {
  addComponents({
    ".pbk-h1": {
      "@apply font-clash text-pbk-h1 font-pbk-h1": {},
    },
    ".pbk-h2": {
      "@apply font-clash text-pbk-h2 font-pbk-h2": {},
    },
    ".pbk-h3": {
      "@apply font-clash text-pbk-h3 font-pbk-h3": {},
    },
    ".pbk-h4": {
      "@apply font-clash text-pbk-h4 font-pbk-h4": {},
    },
    ".pbk-h5": {
      "@apply font-clash text-pbk-h5 font-pbk-h5": {},
    },
    ".pbk-h6": {
      "@apply font-clash text-pbk-h6 font-pbk-h6": {},
    },
    ".pbk-h7": {
      "@apply font-clash text-pbk-h7 font-pbk-h7": {},
    },
    ".pbk-h8": {
      "@apply font-clash text-pbk-h8 font-pbk-h8": {},
    },
    ".pbk-sh1": {
      "@apply font-clash text-pbk-sh1 font-pbk-sh1": {},
    },
    ".pbk-sh2": {
      "@apply font-clash text-pbk-sh2 font-pbk-sh2": {},
    },
    ".pbk-sh3": {
      "@apply font-manrope text-pbk-sh3 font-pbk-sh3": {},
    },
    ".pbk-bl": {
      "@apply font-manrope text-pbk-bl font-pbk-bl": {},
    },
    ".pbk-b1": {
      "@apply font-manrope text-pbk-b1 font-pbk-b1": {},
    },
    ".pbk-b2": {
      "@apply font-manrope text-pbk-b2 font-pbk-b2": {},
    },
    ".pbk-b3": {
      "@apply font-manrope text-pbk-b3 font-pbk-b3": {},
    },
  });
});

export default typographyPlugin;
