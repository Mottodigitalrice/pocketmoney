import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for PocketMoney.
 *
 * Layout:
 *   - `setup` project runs `auth.setup.ts` and writes `e2e/.auth/parent.json`
 *     (Clerk session cookies). All real test projects depend on it and reuse
 *     the saved storageState.
 *   - `chromium` desktop project (1440x1000) — parent dashboard / admin flows.
 *   - `mobile` project (iPhone 13, WebKit) — kid-side flows (F20 will consume).
 *
 * Boot: `webServer` boots `next dev` if not already running. Convex is hosted
 * (cloud dev URL in .env.local), so we don't need a separate Convex process.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // 1. Auth setup — runs first, writes storageState to e2e/.auth/parent.json.
    {
      name: "setup",
      testMatch: /.*\.setup\.ts$/,
    },

    // 2. Desktop (Chromium) — parent dashboard, admin flows.
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
        storageState: "e2e/.auth/parent.json",
      },
      dependencies: ["setup"],
    },

    // 3. Mobile (WebKit / iPhone 13) — kid-side flows for F20.
    {
      name: "mobile",
      use: {
        ...devices["iPhone 13"],
        storageState: "e2e/.auth/parent.json",
      },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
