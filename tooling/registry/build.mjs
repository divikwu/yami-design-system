import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const componentsDir = path.join(root, "packages/design-system/components");
const generatedDir = path.join(root, "packages/design-system/generated");
const itemsDir = path.join(generatedDir, "registry-items");
const check = process.argv.includes("--check");

function slug(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

async function runtimeFiles(directory, relative = "") {
  const entries = await fs.readdir(path.join(directory, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await runtimeFiles(directory, next));
    else if (!/(?:\.stories|\.figma)\.tsx$/.test(entry.name) && !["examples.tsx", "meta.json", "usage.md"].includes(entry.name)) files.push(next.split(path.sep).join("/"));
  }
  return files;
}

const directories = (await fs.readdir(componentsDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name));

const componentItems = [];
for (const directory of directories) {
  const meta = JSON.parse(await fs.readFile(path.join(componentsDir, directory.name, "meta.json"), "utf8"));
  componentItems.push({
    schemaVersion: 1,
    name: slug(directory.name),
    title: meta.name ?? directory.name,
    type: "component",
    status: meta.status ?? "unknown",
    source: `components/${directory.name}`,
    files: (await runtimeFiles(path.join(componentsDir, directory.name))).map((file) => `components/${directory.name}/${file}`),
  });
}

const baseItem = {
  schemaVersion: 1,
  name: "yami-design-system",
  title: "Yami Design System",
  type: "design-system",
  source: "design-system.meta.json",
  files: [
    "design-system.meta.json",
    "manifest.json",
    "DESIGN.compact.md",
    "SKILL.md",
    "styles/base.css",
    "generated/tokens.css",
    "generated/tokens.json",
  ],
};
const items = [baseItem, ...componentItems];
const registry = `${JSON.stringify({ schemaVersion: 1, name: "yami", visibility: "private", generatedFrom: ["design-system.meta.json", "components/*/meta.json"], items: items.map((item) => ({ name: item.name, title: item.title, type: item.type, path: `registry-items/${item.name}.json` })) }, null, 2)}\n`;
const expectedItems = new Map(items.map((item) => [`${item.name}.json`, `${JSON.stringify(item, null, 2)}\n`]));

await fs.mkdir(itemsDir, { recursive: true });
const failures = [];
const registryPath = path.join(generatedDir, "registry.json");
if (check) {
  if (await fs.readFile(registryPath, "utf8").catch(() => "") !== registry) failures.push("packages/design-system/generated/registry.json");
  const currentFiles = (await fs.readdir(itemsDir).catch(() => [])).filter((file) => file.endsWith(".json")).sort();
  if (currentFiles.join("\n") !== [...expectedItems.keys()].sort().join("\n")) failures.push("packages/design-system/generated/registry-items file list");
  for (const [file, value] of expectedItems) if (await fs.readFile(path.join(itemsDir, file), "utf8").catch(() => "") !== value) failures.push(`packages/design-system/generated/registry-items/${file}`);
  if (failures.length) {
    console.error(`Generated registry drift:\n${failures.join("\n")}`);
    process.exitCode = 1;
  } else console.log(`Verified ${items.length} registry items.`);
} else {
  await fs.writeFile(registryPath, registry);
  const expectedNames = new Set(expectedItems.keys());
  for (const file of await fs.readdir(itemsDir)) if (file.endsWith(".json") && !expectedNames.has(file)) await fs.unlink(path.join(itemsDir, file));
  for (const [file, value] of expectedItems) await fs.writeFile(path.join(itemsDir, file), value);
  console.log(`Generated ${items.length} registry items.`);
}
