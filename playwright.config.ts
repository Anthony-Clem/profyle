import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "tests/e2e",
  // Specs share one app server and database; run them in order.
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // CI builds in its own step first.
    command: isCI ? "pnpm start" : "pnpm build && pnpm start",
    url: "http://localhost:3000",
    // Locally, reuse a running `pnpm dev` or `pnpm start`.
    reuseExistingServer: !isCI,
    timeout: 300_000,
  },
});
