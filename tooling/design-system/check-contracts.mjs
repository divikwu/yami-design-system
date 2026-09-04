import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import { collectNamedExports } from "./typescript-exports.mjs";

const root = process.cwd();
const designSystemDir = process.env.YAMI_CONTRACTS_DESIGN_SYSTEM_DIR
  ? path.resolve(process.env.YAMI_CONTRACTS_DESIGN_SYSTEM_DIR)
  : path.join(root, "packages/design-system");
const componentsDir = path.join(designSystemDir, "components");
const schemaPath = path.join(designSystemDir, "schema/component.json");
const tokensPath = path.join(designSystemDir, "generated/tokens.css");
const principlesPath = path.join(designSystemDir, "principles/principles.ts");
const registryItemsDir = path.join(designSystemDir, "generated/registry-items");

const schema = JSON.parse(await fs.readFile(schemaPath, "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateComponent = ajv.compile(schema);
const tokenSource = await fs.readFile(tokensPath, "utf8");
const principleSource = await fs.readFile(principlesPath, "utf8");
const knownTokens = new Set([...tokenSource.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1]));
const knownRules = new Set([...principleSource.matchAll(/ruleId:\s*['"]([^'"]+)['"]/g)].map((match) => match[1]));

const errors = [];
const counts = { total: 0, stable: 0, interactionCovered: 0, interactionNotApplicable: 0 };

function slug(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function collectRuleIds(value, ids = []) {
  if (Array.isArray(value)) for (const item of value) collectRuleIds(item, ids);
  else if (value && typeof value === "object") {
    if (typeof value.ruleId === "string") ids.push(value.ruleId);
    for (const child of Object.values(value)) collectRuleIds(child, ids);
  }
  return ids;
}

function report(component, message) {
  errors.push(`${component}: ${message}`);
}

const directories = (await fs.readdir(componentsDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

for (const directory of directories) {
  counts.total += 1;
  const componentDir = path.join(componentsDir, directory);
  const metaPath = path.join(componentDir, "meta.json");
  const meta = JSON.parse(await fs.readFile(metaPath, "utf8"));

  if (!validateComponent(meta)) {
    for (const issue of validateComponent.errors ?? []) {
      report(directory, `meta.json${issue.instancePath || "/"} ${issue.message}`);
    }
  }
  if (meta.name !== directory) report(directory, `meta name must match directory name (${directory})`);

  for (const token of meta.tokens ?? []) {
    if (!knownTokens.has(token)) report(directory, `unknown token ${token}`);
  }
  for (const token of Object.keys(meta.tokenBindings ?? {})) {
    if (!knownTokens.has(token)) report(directory, `unknown token binding ${token}`);
    else if (!(meta.tokens ?? []).includes(token)) report(directory, `token binding ${token} must also be declared in tokens`);
  }
  for (const ruleId of collectRuleIds(meta.rules)) {
    if (!knownRules.has(ruleId)) report(directory, `unknown rule ${ruleId}`);
  }

  const usagePath = path.resolve(componentDir, meta.usageRef ?? "");
  if (!usagePath.startsWith(`${componentDir}${path.sep}`)) report(directory, "usageRef escapes the component directory");
  else await fs.access(usagePath).catch(() => report(directory, `missing usage reference ${meta.usageRef}`));

  for (const example of meta.examples ?? []) {
    const [relativePath, exportName] = example.split("#");
    const examplePath = path.resolve(componentDir, relativePath);
    if (!examplePath.startsWith(`${componentDir}${path.sep}`)) {
      report(directory, `example reference escapes the component directory: ${example}`);
      continue;
    }
    const source = await fs.readFile(examplePath, "utf8").catch(() => null);
    if (source === null) report(directory, `missing example source ${relativePath}`);
    else if (!collectNamedExports(source, examplePath).has(exportName)) report(directory, `missing example export ${exportName}`);
  }

  if (meta.status !== "stable") continue;
  counts.stable += 1;

  if (!Array.isArray(meta.exports) || meta.exports.length === 0) {
    report(directory, "stable components must declare public exports");
  } else {
    const indexPath = path.join(componentDir, "index.ts");
    const indexSource = await fs.readFile(indexPath, "utf8").catch(() => "");
    const publicExports = collectNamedExports(indexSource, indexPath);
    for (const exportedName of meta.exports) {
      if (!publicExports.has(exportedName)) report(directory, `declared export ${exportedName} is missing from index.ts`);
    }
  }

  const storyPath = path.join(componentDir, `${directory}.stories.tsx`);
  const storySource = await fs.readFile(storyPath, "utf8").catch(() => null);
  if (storySource === null) report(directory, `missing canonical story ${directory}.stories.tsx`);
  else if (!collectNamedExports(storySource, storyPath).has("Showcase")) report(directory, "canonical story must export Showcase");

  const registryPath = path.join(registryItemsDir, `${slug(directory)}.json`);
  await fs.access(registryPath).catch(() => report(directory, `missing registry item ${slug(directory)}.json`));

  if (meta.testing?.interaction === "not-applicable") {
    counts.interactionNotApplicable += 1;
  } else if (/\bplay\s*:/.test(storySource ?? "")) {
    counts.interactionCovered += 1;
  } else {
    report(directory, "stable interactive components require a Storybook play test or testing.interaction=not-applicable");
  }
}

if (errors.length > 0) {
  console.error(`Design-system contract failures (${errors.length}):\n${errors.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Design-system contracts verified: ${counts.total} components, ${counts.stable} stable, ${counts.interactionCovered} interaction-covered, ${counts.interactionNotApplicable} interaction-not-applicable.`);
}
