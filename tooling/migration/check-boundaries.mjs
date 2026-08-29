import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const ignoredDirectories = new Set([".next", "coverage", "dist", "node_modules"]);
const rules = [
  { dir: "apps/canvas", forbidden: ["@yami/topic-generator"] },
  { dir: "packages/design-system", forbidden: ["@yami/contracts", "@yami/prototypes", "next/", "motion/", "zod", "@design-labs/", "@astryxdesign/"] },
  { dir: "packages/contracts", forbidden: ["@yami/design-system", "@yami/prototypes", "next/", "motion/", "react", "@design-labs/", "@astryxdesign/"] },
  { dir: "packages/commerce-catalog", forbidden: ["@yami/design-system", "@yami/prototypes", "@yami/topic-generator", "next/", "motion/", "react", "@design-labs/", "@astryxdesign/"] },
  { dir: "packages/prototypes", forbidden: ["next/", "motion/", "@design-labs/", "@astryxdesign/"] }
];

async function files(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const values = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? ignoredDirectories.has(entry.name) ? [] : files(path.join(dir, entry.name))
    : /\.(ts|tsx|js|mjs)$/.test(entry.name) ? [path.join(dir, entry.name)] : []));
  return values.flat();
}

const failures = [];
for (const rule of rules) for (const file of await files(path.join(root, rule.dir))) {
  const source = await fs.readFile(file, "utf8");
  for (const dependency of rule.forbidden) if (new RegExp(`(?:from\\s+|import\\s*\\()?["']${dependency.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(source)) failures.push(`${path.relative(root, file)} imports forbidden ${dependency}`);
}
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
else console.log("Package boundaries verified.");
