import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

import legacyDocRedirects from "./lib/legacy-doc-redirects.json" with { type: "json" };

const appDirectory = path.dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  transpilePackages: ["@yami/design-system", "@yami/site-access"],
  experimental: { externalDir: true },
  turbopack: { root: path.resolve(appDirectory, "../..") },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/zh",
        permanent: false,
      },
      ...["zh", "en"].flatMap((locale) =>
        Object.entries(legacyDocRedirects).map(([slug, destination]) => ({
          source: `/${locale}/docs/${slug}`,
          destination: destination.startsWith("https://") ? destination : `/${locale}${destination}`,
          permanent: true,
        })),
      ),
    ];
  },
};

export default config;
