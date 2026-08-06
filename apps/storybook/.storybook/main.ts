import type { StorybookConfig } from "@storybook/react-vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");

const config: StorybookConfig = {
  stories: [
    path.join(root, "packages/design-system/**/*.stories.@(ts|tsx|mdx)"),
    path.join(root, "packages/prototypes/**/*.stories.@(ts|tsx|mdx)")
  ],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: { name: "@storybook/react-vite", options: {} },
  staticDirs: [{ from: path.join(root, "packages/design-system/assets"), to: "/assets" }],
  typescript: { reactDocgen: "react-docgen" },
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    resolve: { ...viteConfig.resolve, preserveSymlinks: false }
  })
};

export default config;
