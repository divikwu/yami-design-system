import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import { collectReferenceIds, contentDigest } from "./contracts.mjs";

const root = process.cwd();
const designSystemDir = path.join(root, "packages/design-system");
const componentsDir = path.join(designSystemDir, "components");
const generatedDir = path.join(designSystemDir, "generated");
const itemsDir = path.join(generatedDir, "registry-items");
const check = process.argv.includes("--check");

const ajv = new Ajv2020({ allErrors: true, strict: true });
const componentSchema = JSON.parse(await fs.readFile(path.join(designSystemDir, "schema/component.json"), "utf8"));
const registrySchema = JSON.parse(await fs.readFile(path.join(designSystemDir, "schema/registry.json"), "utf8"));
const itemSchema = JSON.parse(await fs.readFile(path.join(designSystemDir, "schema/registry-item.json"), "utf8"));
const validateComponent = ajv.compile(componentSchema);
const validateRegistry = ajv.compile(registrySchema);
const validateItem = ajv.compile(itemSchema);

function slug(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function schemaFailure(label, validate) {
  const details = (validate.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");
  throw new Error(`${label} failed schema validation: ${details}`);
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

async function readEntries(relativePaths) {
  return Promise.all([...new Set(relativePaths)].sort((a, b) => a.localeCompare(b)).map(async (relativePath) => ({
    path: relativePath,
    content: await fs.readFile(path.join(designSystemDir, relativePath), "utf8"),
  })));
}

const directories = (await fs.readdir(componentsDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name));

const componentItems = [];
for (const directory of directories) {
  const componentRoot = path.join(componentsDir, directory.name);
  const meta = JSON.parse(await fs.readFile(path.join(componentRoot, "meta.json"), "utf8"));
  if (!validateComponent(meta)) schemaFailure(`${directory.name}/meta.json`, validateComponent);

  const source = `components/${directory.name}`;
  const runtime = (await runtimeFiles(componentRoot)).map((file) => `${source}/${file}`);
  const story = `${source}/${directory.name}.stories.tsx`;
  const examples = (meta.examples ?? []).map((reference) => `${source}/${reference.replace(/^\.\//, "")}`);
  const digestPaths = [
    ...runtime,
    `${source}/meta.json`,
    `${source}/usage.md`,
    story,
    ...examples.map((reference) => reference.split("#")[0]),
  ];
  const storySource = await fs.readFile(path.join(componentRoot, `${directory.name}.stories.tsx`), "utf8");
  const interactionCoverage = meta.testing?.interaction === "not-applicable"
    ? "not-applicable"
    : /\bplay\s*:/.test(storySource) ? "covered" : "missing";

  const item = {
    $schema: "../../schema/registry-item.json",
    schemaVersion: 2,
    name: slug(directory.name),
    title: meta.name ?? directory.name,
    type: "component",
    status: meta.status,
    version: meta.version,
    description: meta.description,
    source,
    files: runtime.map((file) => ({ source: file, target: file })),
    exports: [...(meta.exports ?? [])].sort((a, b) => a.localeCompare(b)),
    composes: [...(meta.composes ?? [])].sort((a, b) => a.localeCompare(b)),
    dependencies: meta.dependencies,
    documentation: {
      usage: `${source}/usage.md`,
      stories: [story],
      examples,
    },
    design: {
      tokens: [...meta.tokens].sort((a, b) => a.localeCompare(b)),
      rules: collectReferenceIds(meta.rules, "ruleId"),
      tokenBindings: meta.tokenBindings ?? {},
    },
    quality: {
      accessibility: meta.accessibility,
      interactionCoverage,
    },
    contentDigest: contentDigest(await readEntries(digestPaths)),
  };
  if (!validateItem(item)) schemaFailure(`${directory.name} registry item`, validateItem);
  componentItems.push(item);
}

const designSystemMeta = JSON.parse(await fs.readFile(path.join(designSystemDir, "design-system.meta.json"), "utf8"));
const baseFiles = [
  "design-system.meta.json",
  "manifest.json",
  "DESIGN.compact.md",
  "SKILL.md",
  "SKILL.zh-CN.md",
  "styles/base.css",
  "generated/tokens.css",
  "generated/tokens.json",
];
const baseItem = {
  $schema: "../../schema/registry-item.json",
  schemaVersion: 2,
  name: "yami-design-system",
  title: designSystemMeta.name,
  type: "design-system",
  status: designSystemMeta.status,
  version: designSystemMeta.version,
  description: designSystemMeta.description,
  source: "design-system.meta.json",
  files: baseFiles.map((file) => ({ source: file, target: file })),
  distribution: {
    package: "@yami/design-system",
    registry: "internal-source",
  },
  documentation: {
    spec: "DESIGN.compact.md",
    skill: "SKILL.md",
    skillZh: "SKILL.zh-CN.md",
  },
  contentDigest: contentDigest(await readEntries(baseFiles)),
};
if (!validateItem(baseItem)) schemaFailure("design-system registry item", validateItem);

const items = [baseItem, ...componentItems];
const registryObject = {
  $schema: "../schema/registry.json",
  schemaVersion: 2,
  name: "yami",
  visibility: "private",
  version: designSystemMeta.version,
  status: designSystemMeta.status,
  generatedFrom: "design-system.meta.json + components/*/meta.json",
  distribution: {
    package: "@yami/design-system",
    registry: "internal-source",
  },
  items: items.map((item) => ({
    name: item.name,
    title: item.title,
    type: item.type,
    status: item.status,
    version: item.version,
    path: `registry-items/${item.name}.json`,
    digest: item.contentDigest,
  })),
};
if (!validateRegistry(registryObject)) schemaFailure("registry", validateRegistry);

const registry = `${JSON.stringify(registryObject, null, 2)}\n`;
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
  } else console.log(`Verified ${items.length} registry v2 items.`);
} else {
  await fs.writeFile(registryPath, registry);
  const expectedNames = new Set(expectedItems.keys());
  for (const file of await fs.readdir(itemsDir)) if (file.endsWith(".json") && !expectedNames.has(file)) await fs.unlink(path.join(itemsDir, file));
  for (const [file, value] of expectedItems) await fs.writeFile(path.join(itemsDir, file), value);
  console.log(`Generated ${items.length} registry v2 items.`);
}
