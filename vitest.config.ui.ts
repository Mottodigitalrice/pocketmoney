import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * G4: jsdom-env Vitest config for React component tests.
 *
 * Scope:
 *   - Component tests under `__tests__-ui/**\/*.test.tsx`.
 *   - Uses jsdom so RTL can render into a DOM. Backend lib tests still run
 *     in node via `vitest.config.ts` (cheaper, faster).
 *
 * The two configs are deliberately separate — see `package.json`:
 *   - `npm run test:backend` → vitest.config.ts (node env, 8 suites)
 *   - `npm run test:ui`      → this config (jsdom env, RTL suites)
 *   - `npm test`             → both, sequentially
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["__tests__-ui/**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**", "convex/_generated/**"],
    setupFiles: ["./__tests__-ui/setup.ts"],
    // QA-2026-06-06 (G1): the default 5s testTimeout is too tight when ~35
    // jsdom suites run in parallel — heavy per-suite environment setup
    // intermittently pushed individual tests past 5s and flaked the gate
    // (GoalWishlist empty-state, KanbanBoard tablist-aria), even though each
    // passes in ~2.5s in isolation. Give real work headroom so CI is
    // deterministic.
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // Node v25 enables the Web Storage API by default, which collides with
    // jsdom's own localStorage implementation and ends up serving a stub
    // missing `clear()` / `setItem()`. The `test:ui` script in package.json
    // passes `NODE_OPTIONS=--no-experimental-webstorage` so jsdom owns the
    // storage object cleanly. When jsdom ships a fix, drop that env var.
  },
});
