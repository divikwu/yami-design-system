import { defineConfig, devices } from "@playwright/test";

const useProductionServer = process.env.PLAYWRIGHT_USE_PRODUCTION === "1";
const useExistingProductionBuild = process.env.PLAYWRIGHT_USE_EXISTING_BUILD === "1";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:3400",
    trace: "on-first-retry",
  },
  webServer: {
    command: useExistingProductionBuild
      ? "pnpm start"
      : useProductionServer
        ? "pnpm build && pnpm start"
        : "pnpm dev",
    url: "http://127.0.0.1:3400/zh",
    reuseExistingServer: !process.env.CI && !useProductionServer && !useExistingProductionBuild,
    timeout: 180_000,
  },
  projects: [
    {
      name: "docsite-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
