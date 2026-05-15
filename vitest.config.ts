import { defineConfig } from "vitest/config";

/**
 * Vitest config for Pocket Money backend lib tests.
 *
 * Scope:
 *   - Pure helpers under `convex/lib/*` (no Convex `ctx`, no Clerk, no React).
 *   - Tests live under `__tests__/` at the repo root.
 *
 * Why `node` env: these helpers do pure money math, rank math, and date
 * arithmetic — no DOM, no jsdom shimming required. Keeps the test run fast.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    // Convex generated dir + Next build dir are not test code.
    exclude: ["node_modules/**", ".next/**", "convex/_generated/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      // Vitest 4 collects coverage for all `include`-matched files by default.
      include: ["convex/lib/**/*.ts"],
      exclude: ["convex/_generated/**", "convex/lib/auth.ts"],
    },
  },
});
