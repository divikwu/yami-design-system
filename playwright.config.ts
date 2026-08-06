import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: { baseURL: "http://localhost:3200", trace: "on-first-retry" },
  webServer: { command: "pnpm --filter @yami/canvas dev", url: "http://localhost:3200", reuseExistingServer: !process.env.CI },
  projects: [
    { name: "e2e", testDir: "tests/e2e", use: { ...devices["Desktop Chrome"] } },
    { name: "a11y", testDir: "tests/a11y", use: { ...devices["Desktop Chrome"], reducedMotion: "reduce" } },
    { name: "visual", testDir: "tests/visual", use: { ...devices["Desktop Chrome"], reducedMotion: "reduce" } }
  ]
});
