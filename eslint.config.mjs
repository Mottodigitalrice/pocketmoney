import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Disable ESLint style rules that conflict with Prettier (must be last).
  prettierConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "convex/_generated/**",
    // Coverage output: vitest/c8 emit ts-nocheck'd files with stale
    // eslint-disable directives that trigger "Unused eslint-disable" warnings.
    "coverage/**",
  ]),
]);

export default eslintConfig;
