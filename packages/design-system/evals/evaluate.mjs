import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import { ruleIds, validateDesign } from "../principles/index.ts";
import { collectNamedExports } from "../../../tooling/design-system/typescript-exports.mjs";

const root = process.cwd();
const evalDir = path.join(root, "packages/design-system/evals");
const casesDocument = JSON.parse(await fs.readFile(path.join(evalDir, "skill-cases.json"), "utf8"));
const casesSchema = JSON.parse(await fs.readFile(path.join(evalDir, "skill-cases.schema.json"), "utf8"));
const validateCases = new Ajv2020({ allErrors: true, strict: true }).compile(casesSchema);

if (!validateCases(casesDocument)) {
  const details = (validateCases.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");
  throw new Error(`Skill evaluation cases failed schema validation: ${details}`);
}

const catalog = JSON.parse(await fs.readFile(path.join(root, "packages/design-system/generated/catalog.json"), "utf8"));
const registry = JSON.parse(await fs.readFile(path.join(root, "packages/design-system/generated/registry.json"), "utf8"));
const pageValidation = JSON.parse(await fs.readFile(path.join(root, "packages/prototypes/page-validation.json"), "utf8"));
const skillSource = await fs.readFile(path.join(root, "packages/design-system/SKILL.md"), "utf8");
const tokensSource = await fs.readFile(path.join(root, "packages/design-system/generated/tokens.css"), "utf8");

const catalogComponents = new Map(catalog.components.map((component) => [component.id, component]));
const registryItems = new Map(registry.items.map((item) => [item.name, item]));
const pages = new Map(pageValidation.pages.map((page) => [page.id, page]));
const rules = new Set(ruleIds);
const tokens = new Set([...tokensSource.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1]));

function slug(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

async function componentRegistryItem(name) {
  if (!catalogComponents.has(name)) return null;
  const summary = registryItems.get(slug(name));
  if (!summary) return null;
  const item = JSON.parse(await fs.readFile(path.join(root, "packages/design-system/generated", summary.path), "utf8"));
  return item.title === name && item.type === "component" ? item : null;
}

async function itemHasStoryExport(item, exportName) {
  const stories = item.documentation?.stories;
  if (!Array.isArray(stories) || stories.length === 0) return false;
  for (const story of stories) {
    const storyPath = path.join(root, "packages/design-system", story);
    const source = await fs.readFile(storyPath, "utf8").catch(() => null);
    if (source !== null && collectNamedExports(source, storyPath).has(exportName)) return true;
  }
  return false;
}

async function resolveReference(reference) {
  const separator = reference.indexOf(":");
  const kind = separator === -1 ? "" : reference.slice(0, separator);
  const value = separator === -1 ? reference : reference.slice(separator + 1);
  if (kind === "token") return tokens.has(value);
  if (kind === "page") return pages.has(value);
  if (kind === "registry") return registryItems.has(value);
  if (kind === "story") {
    const [componentName, exportName] = value.split("#");
    if (!componentName || !exportName) return false;
    const item = await componentRegistryItem(componentName);
    return item !== null && await itemHasStoryExport(item, exportName);
  }
  if (kind !== "component") return false;
  const item = await componentRegistryItem(value);
  return item !== null && await itemHasStoryExport(item, "Showcase");
}

function unstableComponents(references) {
  return references
    .filter((reference) => reference.startsWith("component:"))
    .map((reference) => reference.slice("component:".length))
    .filter((name) => catalogComponents.get(name)?.meta?.status !== "stable");
}

const seenIds = new Set();
const results = [];
for (const testCase of casesDocument.cases) {
  const checks = [];
  if (seenIds.has(testCase.id)) checks.push(`duplicate case id ${testCase.id}`);
  seenIds.add(testCase.id);

  for (const reference of testCase.expectedStartingPoints) {
    if (!await resolveReference(reference)) checks.push(`unresolved starting reference ${reference}`);
  }
  for (const reference of testCase.missingReferences ?? []) {
    if (await resolveReference(reference)) checks.push(`reference expected to be missing is available: ${reference}`);
  }
  for (const ruleId of [...testCase.requiredRuleIds, ...testCase.forbiddenRuleIds]) {
    if (!rules.has(ruleId)) checks.push(`unknown rule ${ruleId}`);
  }
  const overlappingRules = testCase.requiredRuleIds.filter((ruleId) => testCase.forbiddenRuleIds.includes(ruleId));
  if (overlappingRules.length > 0) checks.push(`rules cannot be required and forbidden: ${overlappingRules.join(", ")}`);

  let validation = null;
  if (testCase.fixture) {
    const fixturePath = path.resolve(root, testCase.fixture.path);
    const code = await fs.readFile(fixturePath, "utf8");
    validation = validateDesign(code, { filename: testCase.fixture.path, projectRoot: root, platform: "web" });
    if (validation.pass !== testCase.fixture.expectedPass) {
      checks.push(`fixture pass expected ${testCase.fixture.expectedPass}, received ${validation.pass}`);
    }
    const actualRules = new Set(validation.violations.map((violation) => violation.ruleId));
    for (const ruleId of testCase.fixture.expectedViolationRuleIds) {
      if (!actualRules.has(ruleId)) checks.push(`fixture did not report expected violation ${ruleId}`);
    }
  }

  const hasNegativeEvidence = Boolean((testCase.missingReferences ?? []).length) || testCase.fixture?.expectedPass === false;
  if (testCase.expectedOutcome === "pass" && hasNegativeEvidence) checks.push("pass cases cannot depend on negative evidence");
  if (testCase.expectedOutcome === "reject" && !hasNegativeEvidence) checks.push("reject cases require a failing fixture or missing reference");
  if (testCase.expectedOutcome === "needs-review" && !hasNegativeEvidence && unstableComponents(testCase.expectedStartingPoints).length === 0) {
    checks.push("needs-review cases require a missing reference or non-stable component");
  }

  results.push({
    id: testCase.id,
    status: checks.length === 0 ? "passed" : "failed",
    expectedOutcome: testCase.expectedOutcome,
    checks,
    ...(validation ? {
      validation: {
        pass: validation.pass,
        violationRuleIds: [...new Set(validation.violations.map((violation) => violation.ruleId))].sort(),
      },
    } : {}),
  });
}

const failed = results.filter((result) => result.status === "failed").length;
const skillVersion = skillSource.match(/^version:\s*(.+)$/m)?.[1] ?? "unknown";
const report = {
  schemaVersion: "design-system-skill-evaluation/v1",
  sources: {
    skillVersion,
    catalogSchemaVersion: catalog.schemaVersion,
    registrySchemaVersion: registry.schemaVersion,
    pageValidationSchemaVersion: pageValidation.schemaVersion,
  },
  summary: {
    total: results.length,
    passed: results.length - failed,
    failed,
    passRate: Number(((results.length - failed) / results.length).toFixed(4)),
  },
  results,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed > 0) process.exitCode = 1;
