import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import { collectNamedExports } from "../design-system/typescript-exports.mjs";
import { isRepositoryPath, routeMatchesSource } from "./contracts.mjs";

const root = process.cwd();
const manifestPath = path.join(root, "packages/prototypes/page-validation.json");
const schemaPath = path.join(root, "packages/prototypes/schema/page-validation.json");
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const schema = JSON.parse(await fs.readFile(schemaPath, "utf8"));
const validate = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true }).compile(schema);
const errors = [];

if (!validate(manifest)) {
  for (const issue of validate.errors ?? []) errors.push(`manifest${issue.instancePath || "/"} ${issue.message}`);
}

const expectedIds = ["AppDownloadPage", "Categories", "EcommerceHome", "EmailTemplates", "MobileSearchPage", "ProductDetailPage", "SearchResultsPage", "TopicLandingPage"];
const actualIds = manifest.pages.map((page) => page.id);
if (new Set(actualIds).size !== actualIds.length) errors.push("page ids must be unique");
if ([...actualIds].sort().join("\n") !== expectedIds.sort().join("\n")) errors.push(`page ids must equal ${expectedIds.join(", ")}`);

async function readReferencedFile(owner, relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (!isRepositoryPath(root, relativePath)) {
    errors.push(`${owner}: path escapes repository: ${relativePath}`);
    return null;
  }
  return fs.readFile(absolutePath, "utf8").catch(() => {
    errors.push(`${owner}: missing referenced file ${relativePath}`);
    return null;
  });
}

async function readReferencedDirectory(owner, relativePath) {
  if (!isRepositoryPath(root, relativePath)) {
    errors.push(`${owner}: path escapes repository: ${relativePath}`);
    return;
  }
  const stat = await fs.stat(path.resolve(root, relativePath)).catch(() => null);
  if (!stat?.isDirectory()) errors.push(`${owner}: missing source directory ${relativePath}`);
}

for (const page of manifest.pages) {
  await readReferencedDirectory(page.id, page.source);
  const storySources = [];
  for (const story of page.stories) {
    const source = await readReferencedFile(page.id, story);
    if (source !== null) storySources.push(source);
  }
  const hasPlay = storySources.some((source) => /\bplay\s*:/.test(source));
  if (page.evidence.storyPlay === "covered" && !hasPlay) errors.push(`${page.id}: storyPlay is covered but no play function was found`);

  const fixtureSource = await readReferencedFile(page.id, page.fixture.path);
  if (fixtureSource !== null && page.fixture.mode === "file" && !collectNamedExports(fixtureSource, page.fixture.path).has(page.fixture.exportName)) {
    errors.push(`${page.id}: fixture export ${page.fixture.exportName} was not found`);
  }

  if (page.route) {
    await readReferencedFile(page.id, page.route.source);
    if (!routeMatchesSource(page.route.path, page.route.source)) errors.push(`${page.id}: route ${page.route.path} does not match App Router source ${page.route.source}`);
  }
  else if (!page.routeReason) errors.push(`${page.id}: pages without a route require routeReason`);
  if (page.route && page.routeReason !== null) errors.push(`${page.id}: routed pages must set routeReason to null`);

  for (const testPath of page.evidence.tests) await readReferencedFile(page.id, testPath);
  for (const visualCase of page.evidence.visual) {
    const testSource = await readReferencedFile(page.id, visualCase.test);
    if (testSource !== null && !testSource.includes(visualCase.id)) errors.push(`${page.id}: visual case ${visualCase.id} is not declared in ${visualCase.test}`);
  }
}

if (errors.length > 0) {
  console.error(`Page validation contract failures (${errors.length}):\n${errors.join("\n")}`);
  process.exitCode = 1;
} else {
  const core = manifest.pages.filter((page) => page.tier === "core").length;
  const smoke = manifest.pages.filter((page) => page.tier === "smoke").length;
  console.log(`Page validation contracts verified: ${manifest.pages.length} pages (${core} core, ${smoke} smoke).`);
}
