// variant options
export type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "h7"
  | "h8"
  | "sh1"
  | "sh2"
  | "sh3"
  | "bl"
  | "b1"
  | "b2"
  | "b3";

// color options
export type TypographyColor =
  | "base-white"
  | "gray-25"
  | "gray-50"
  | "gray-100"
  | "gray-200"
  | "gray-300"
  | "gray-400"
  | "gray-500"
  | "gray-600"
  | "gray-700"
  | "gray-800"
  | "gray-900"
  | "gray-920"
  | "gray-950"
  | "purple-25"
  | "purple-50"
  | "purple-100"
  | "purple-200"
  | "purple-300"
  | "purple-400"
  | "purple-500"
  | "purple-600"
  | "purple-700"
  | "purple-800"
  | "purple-900"
  | "purple-950"
  | "green-25"
  | "green-50"
  | "green-100"
  | "green-200"
  | "green-300"
  | "green-400"
  | "green-500"
  | "green-600"
  | "green-700"
  | "green-800"
  | "green-900"
  | "green-950"
  | "yellow-25"
  | "yellow-50"
  | "yellow-100"
  | "yellow-200"
  | "yellow-300"
  | "yellow-400"
  | "yellow-500"
  | "yellow-600"
  | "yellow-700"
  | "yellow-800"
  | "yellow-900"
  | "yellow-950"
  | "red-25"
  | "red-50"
  | "red-100"
  | "red-200"
  | "red-300"
  | "red-400"
  | "red-500"
  | "red-600"
  | "red-700"
  | "red-800"
  | "red-900"
  | "red-950";

// Map variants
export const variantClasses: Record<TypographyVariant, string> = {
  h1: "text-pbk-h1 font-pbk-h1 font-clash",
  h2: "text-pbk-h2 font-pbk-h2 font-clash",
  h3: "text-pbk-h3 font-pbk-h3 font-clash",
  h4: "text-pbk-h4 font-pbk-h4 font-clash",
  h5: "text-pbk-h5 font-pbk-h5 font-clash",
  h6: "text-pbk-h6 font-pbk-h6 font-clash",
  h7: "text-pbk-h7 font-pbk-h7 font-clash",
  h8: "text-pbk-h8 font-pbk-h8 font-clash",
  sh1: "text-pbk-sh1 font-pbk-sh1 font-clash",
  sh2: "text-pbk-sh2 font-pbk-sh2 font-clash",
  sh3: "text-pbk-sh3 font-pbk-sh3 font-manrope",
  bl: "text-pbk-bl font-pbk-bl font-manrope",
  b1: "text-pbk-b1 font-pbk-b1 font-manrope",
  b2: "text-pbk-b2 font-pbk-b2 font-manrope",
  b3: "text-pbk-b3 font-pbk-b3 font-manrope",
};

// Map colors
export const colorClasses: Record<TypographyColor, string> = {
  "base-white": "text-base-white",
  "gray-25": "text-gray-25",
  "gray-50": "text-gray-50",
  "gray-100": "text-gray-100",
  "gray-200": "text-gray-200",
  "gray-300": "text-gray-300",
  "gray-400": "text-gray-400",
  "gray-500": "text-gray-500",
  "gray-600": "text-gray-600",
  "gray-700": "text-gray-700",
  "gray-800": "text-gray-800",
  "gray-900": "text-gray-900",
  "gray-920": "text-gray-920",
  "gray-950": "text-gray-950",
  "purple-25": "text-purple-25",
  "purple-50": "text-purple-50",
  "purple-100": "text-purple-100",
  "purple-200": "text-purple-200",
  "purple-300": "text-purple-300",
  "purple-400": "text-purple-400",
  "purple-500": "text-purple-500",
  "purple-600": "text-purple-600",
  "purple-700": "text-purple-700",
  "purple-800": "text-purple-800",
  "purple-900": "text-purple-900",
  "purple-950": "text-purple-950",
  "green-25": "text-green-25",
  "green-50": "text-green-50",
  "green-100": "text-green-100",
  "green-200": "text-green-200",
  "green-300": "text-green-300",
  "green-400": "text-green-400",
  "green-500": "text-green-500",
  "green-600": "text-green-600",
  "green-700": "text-green-700",
  "green-800": "text-green-800",
  "green-900": "text-green-900",
  "green-950": "text-green-950",
  "yellow-25": "text-yellow-25",
  "yellow-50": "text-yellow-50",
  "yellow-100": "text-yellow-100",
  "yellow-200": "text-yellow-200",
  "yellow-300": "text-yellow-300",
  "yellow-400": "text-yellow-400",
  "yellow-500": "text-yellow-500",
  "yellow-600": "text-yellow-600",
  "yellow-700": "text-yellow-700",
  "yellow-800": "text-yellow-800",
  "yellow-900": "text-yellow-900",
  "yellow-950": "text-yellow-950",
  "red-25": "text-red-25",
  "red-50": "text-red-50",
  "red-100": "text-red-100",
  "red-200": "text-red-200",
  "red-300": "text-red-300",
  "red-400": "text-red-400",
  "red-500": "text-red-500",
  "red-600": "text-red-600",
  "red-700": "text-red-700",
  "red-800": "text-red-800",
  "red-900": "text-red-900",
  "red-950": "text-red-950",
};
