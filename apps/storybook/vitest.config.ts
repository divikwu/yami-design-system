import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const directory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      "@base-ui/react/checkbox",
      "@base-ui/react/radio",
      "@base-ui/react/radio-group",
      "@storybook/react-vite",
      "react/jsx-dev-runtime",
      "storybook/test",
    ],
  },
  test: {
    projects: [
      {
        plugins: [
          storybookTest({
            configDir: path.join(directory, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            provider: playwright({}),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [path.join(directory, ".storybook/vitest.setup.ts")],
        },
      },
      {
        plugins: [react()],
        optimizeDeps: { include: ["@storybook/react-vite", "storybook/test"] },
        test: {
          name: "browser",
          include: ["tests/**/*.browser.test.tsx"],
          browser: {
            enabled: true,
            provider: playwright({}),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
