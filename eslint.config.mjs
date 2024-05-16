import { FlatCompat } from "@eslint/eslintrc"
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});


export default [
  {
    languageOptions: {
      globals: {...globals.browser, ...globals.node, ...globals.es2021},
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.strict,
  ...compat.extends("next"),
];
