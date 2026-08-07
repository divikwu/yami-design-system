import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : entry.name.endsWith(".stories.tsx") ? [path.join(dir, entry.name)] : []));
  return nested.flat();
}
const stories = [...await walk(path.join(root, "packages/design-system")), ...await walk(path.join(root, "packages/prototypes"))];
if (stories.length !== 30) throw new Error(`Expected 30 stories, received ${stories.length}`);
const indexPath = path.join(root, "apps/storybook/storybook-static/index.json");
const index = JSON.parse(await fs.readFile(indexPath, "utf8"));
const entries = Object.values(index.entries ?? {});
if (!entries.some((entry) => entry.type === "docs")) throw new Error("Storybook docs entries were not generated");
if (!entries.some((entry) => entry.title === "YAMI/Pages/Ecommerce Home")) throw new Error("Ecommerce Home story is missing");
console.log(`Storybook verified: ${stories.length} source files, ${entries.length} indexed entries, docs present.`);
