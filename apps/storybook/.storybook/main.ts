import type { StorybookConfig } from "@storybook/react-vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");

const config: StorybookConfig = {
  stories: [
    "../../../packages/design-system/*.stories.@(ts|tsx|mdx)",
    "../../../packages/design-system/components/**/*.stories.@(ts|tsx|mdx)",
    "../../../packages/prototypes/pages/**/*.stories.@(ts|tsx|mdx)"
  ],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: { name: "@storybook/react-vite", options: {} },
  staticDirs: [{ from: path.join(root, "packages/design-system/assets"), to: "/assets" }],
  typescript: { reactDocgen: "react-docgen" },
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    resolve: { ...viteConfig.resolve, preserveSymlinks: false }
  })
};

export default config;
