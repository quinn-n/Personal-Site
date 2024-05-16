import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import pluginJs from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.strict,
  ...compat.extends("next"),
];
