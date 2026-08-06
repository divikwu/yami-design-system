import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const componentsDir = path.join(root, "packages/design-system/components");
const outputDir = path.join(root, "packages/design-system/generated");
const check = process.argv.includes("--check");
const directories = (await fs.readdir(componentsDir, { withFileTypes: true })).filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
const components = [];
for (const directory of directories) {
  const metaPath = path.join(componentsDir, directory.name, "meta.json");
  try {
    const meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
    components.push({ id: directory.name, source: `components/${directory.name}`, meta });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const catalog = `${JSON.stringify({ schemaVersion: 1, generatedFrom: "components/*/meta.json", components }, null, 2)}\n`;
const target = path.join(outputDir, "catalog.json");
await fs.mkdir(outputDir, { recursive: true });
if (check) {
  const current = await fs.readFile(target, "utf8").catch(() => "");
  if (current !== catalog) { console.error("Generated catalog drift: packages/design-system/generated/catalog.json"); process.exitCode = 1; }
  else console.log(`Verified ${components.length} catalog entries.`);
} else {
  await fs.writeFile(target, catalog);
  console.log(`Generated ${components.length} catalog entries.`);
}
