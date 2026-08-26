import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
async function walk(dir, predicate) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name), predicate) : predicate(entry.name) ? [path.join(dir, entry.name)] : []));
  return nested.flat();
}
const normalizeComponentName = (value) => value.replace(/[^a-z0-9]/gi, "").toLowerCase();
const componentsRoot = path.join(root, "packages/design-system/components");
const componentDirectories = (await fs.readdir(componentsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const componentDocs = await Promise.all(componentDirectories.map(async (directory) => {
  const componentRoot = path.join(componentsRoot, directory);
  const meta = JSON.parse(await fs.readFile(path.join(componentRoot, "meta.json"), "utf8"));
  const usagePath = path.join(componentRoot, "usage.md");
  const storyPath = path.join(componentRoot, `${directory}.stories.tsx`);
  const usage = await fs.readFile(usagePath, "utf8");

  await fs.access(storyPath);
  if (meta.usageRef !== "./usage.md") {
    throw new Error(`${directory} must declare usageRef as ./usage.md`);
  }
  if (!usage.startsWith("# ")) {
    throw new Error(`${directory}/usage.md must start with a level-one heading`);
  }

  return { directory, name: meta.name, storyPath, usage };
}));

const stories = [
  ...await walk(path.join(root, "packages/design-system"), (name) => name.endsWith(".stories.tsx")),
  ...await walk(path.join(root, "packages/prototypes"), (name) => name.endsWith(".stories.tsx")),
];
const indexPath = path.join(root, "apps/storybook/storybook-static/index.json");
const index = JSON.parse(await fs.readFile(indexPath, "utf8"));
const entries = Object.values(index.entries ?? {});
const docsEntries = entries.filter((entry) => entry.type === "docs");
const docsComponentNames = new Set(docsEntries.map((entry) => normalizeComponentName(entry.title.split("/").at(-1))));
const storySources = new Map(await Promise.all(componentDocs.map(async (component) => [
  normalizeComponentName(component.name),
  await fs.readFile(component.storyPath, "utf8"),
])));

function hasOwningDocsEntry(componentName) {
  const normalizedName = normalizeComponentName(componentName);
  if (docsComponentNames.has(normalizedName)) return true;

  return componentDocs.some((owner) => {
    if (!docsComponentNames.has(normalizeComponentName(owner.name))) return false;
    const source = storySources.get(normalizeComponentName(owner.name)) ?? "";
    const subcomponents = source.match(/subcomponents\s*:\s*{([^}]*)}/s)?.[1] ?? "";
    return new RegExp(`\\b${componentName}\\b`).test(subcomponents);
  });
}

for (const component of componentDocs) {
  if (!hasOwningDocsEntry(component.name)) {
    throw new Error(`${component.name} is missing its Storybook docs entry`);
  }
}

const staticAssets = await walk(
  path.join(root, "apps/storybook/storybook-static/assets"),
  (name) => name.endsWith(".js"),
);
const bundledDocs = (await Promise.all(staticAssets.map((file) => fs.readFile(file, "utf8")))).join("\n");
if (!bundledDocs.includes("data-yami-docs")) {
  throw new Error("The component usage docs template was not bundled");
}
for (const component of componentDocs) {
  const heading = component.usage.split(/\r?\n/, 1)[0];
  if (!bundledDocs.includes(heading)) {
    throw new Error(`${component.name} usage content was not bundled into Storybook`);
  }
}

if (!entries.some((entry) => entry.title === "YAMI/Pages/Ecommerce Home")) throw new Error("Ecommerce Home story is missing");
console.log(`Storybook verified: ${stories.length} source files, ${componentDocs.length} component usage guides, ${docsEntries.length} docs entries, ${entries.length} indexed entries.`);
