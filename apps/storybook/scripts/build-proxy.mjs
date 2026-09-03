import { build } from "esbuild";

// Vercel's Node tracer renames workspace .ts files without updating package
// exports. Bundle the password gate so the deployed proxy needs no TS resolver.
await build({
  entryPoints: ["proxy.ts"],
  outfile: "dist/proxy.js",
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
});
