import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = path.dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  transpilePackages: ["@yami/contracts", "@yami/design-system", "@yami/prototypes"],
  experimental: { externalDir: true },
  turbopack: { root: path.resolve(appDirectory, "../..") }
};

export default config;
