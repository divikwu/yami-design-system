import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const check = process.argv.includes("--check");
const sourceHashPath = path.join(root, "docs/migration/source-files.sha256");
const target = path.join(root, "docs/migration/migration-map.json");
const generatedTokenFiles = new Set(["tokens.css", "tokens.flat.json", "tokens.json", "tokens.md", "tokens.ts"]);
const retiredRuleFiles = new Set([
  "principles/runtime/__tests__/no-gradient.test.ts",
  "principles/runtime/validators/no-gradient.ts",
  "principles/validators/no-gradient.ts",
]);

function classify(source) {
  if (source === "readiness-baseline.json") return { disposition: "excluded", reason: "Design Labs evaluation output" };
  if (retiredRuleFiles.has(source)) return { disposition: "excluded", reason: "Retired no-gradient rule" };
  if (source === "design-system.meta.json") return { disposition: "rebuilt", destination: "packages/design-system/design-system.meta.json" };
  if (source === "figma.meta.json") return { disposition: "rebuilt", destination: "packages/design-system/figma.meta.json" };
  if (source === "package.json") return { disposition: "rebuilt", destination: "packages/design-system/package.json" };
  if (source === "catalog.json" || source === "catalog-sources.json") return { disposition: "regenerated", destination: "packages/design-system/generated/catalog.json" };
  if (generatedTokenFiles.has(source)) return { disposition: "regenerated", destination: `packages/design-system/generated/${source}` };
  if (source === "registry.json" || source === "registry.source.json") return { disposition: "regenerated", destination: "packages/design-system/generated/registry.json" };
  if (source.startsWith("registry-items/")) return { disposition: "regenerated", destination: "packages/design-system/generated/registry.json" };
  if (source.startsWith("pages/EcommerceHome/")) return { disposition: "migrated", destination: `packages/prototypes/${source}` };
  if (source === "pages/index.ts" || source === "pages/page-templates.json") return { disposition: "incubated", destination: `archive/incubator/${source}` };
  if (source.startsWith("pages/recipes/") || source.startsWith("pages/templates/")) return { disposition: "incubated", destination: `archive/incubator/${source.slice("pages/".length)}` };
  if (source.startsWith("preview/") || source.startsWith("ui_kits/")) return { disposition: "incubated", destination: `archive/incubator/${source}` };
  return { disposition: "migrated", destination: `packages/design-system/${source}` };
}

async function sha256(relativePath) {
  const content = await fs.readFile(path.join(root, relativePath));
  return createHash("sha256").update(content).digest("hex");
}

const lines = (await fs.readFile(sourceHashPath, "utf8")).trim().split("\n");
const entries = [];
for (const line of lines) {
  const match = /^([a-f0-9]{64})\s{2}\.\/(.+)$/.exec(line);
  if (!match) throw new Error(`Invalid source hash entry: ${line}`);
  const [, sourceSha256, source] = match;
  const classification = classify(source);
  const entry = { source, sourceSha256, ...classification };
  if (classification.destination) {
    entry.destinationSha256 = await sha256(classification.destination).catch(() => null);
    if (!entry.destinationSha256) throw new Error(`Missing migration destination for ${source}: ${classification.destination}`);
  }
  entries.push(entry);
}

const summary = entries.reduce((result, entry) => ({ ...result, [entry.disposition]: (result[entry.disposition] ?? 0) + 1 }), {});
const output = `${JSON.stringify({ schemaVersion: 1, sourceSha: "e22f1e14ac74d1e024d8dffc47935e8f43e115cf", sourceFiles: entries.length, summary, entries }, null, 2)}\n`;
if (check) {
  if (await fs.readFile(target, "utf8").catch(() => "") !== output) {
    console.error("Generated migration map drift: docs/migration/migration-map.json");
    process.exitCode = 1;
  } else console.log(`Verified ${entries.length} migration map entries.`);
} else {
  await fs.writeFile(target, output);
  console.log(`Generated ${entries.length} migration map entries.`);
}
