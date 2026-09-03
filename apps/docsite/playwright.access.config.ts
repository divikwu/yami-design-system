import { defineConfig } from "@playwright/test";

// These credentials are public test fixtures, never production defaults.
const env = {
  NODE_ENV: "production",
  VERCEL: "",
  YAMI_SITE_PASSWORD: "yami-local-preview-only",
  YAMI_SESSION_SECRET: "local-preview-session-secret-not-for-production-2026",
};

export default defineConfig({
  testDir: "tests/access",
  workers: 1,
  reporter: "list",
  use: { viewport: { width: 1345, height: 950 } },
  webServer: [
    {
      command: "node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3402",
      url: "http://127.0.0.1:3402/__access/login",
      env,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm --filter @yami/storybook preview:protected",
      url: "http://127.0.0.1:6007/__access/login",
      env,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
