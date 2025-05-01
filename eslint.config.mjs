// https://docs.expo.dev/guides/using-eslint/
import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";
import importPlugin from "eslint-plugin-import";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default defineConfig([
  expoConfig,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  eslintPluginPrettierRecommended,
  {
    ignores: ["dist/*"],
  },
  {
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      "react/jsx-sort-props": ["error", { ignoreCase: true }],
      "react/sort-prop-types": "error",
      "import/order": [
        "error",
        {
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
  },
]);
