import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { contentDigest } from "./contracts.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("contentDigest is stable across input order", () => {
  const first = contentDigest([
    { path: "components/Button/index.ts", content: "export { Button }" },
    { path: "components/Button/meta.json", content: "{}" },
  ]);
  const second = contentDigest([
    { path: "components/Button/meta.json", content: "{}" },
    { path: "components/Button/index.ts", content: "export { Button }" },
  ]);
  assert.equal(first, second);
});

test("contentDigest changes when source content changes", () => {
  const before = contentDigest([{ path: "components/Button/index.ts", content: "before" }]);
  const after = contentDigest([{ path: "components/Button/index.ts", content: "after" }]);
  assert.notEqual(before, after);
});

test("all Registry v2 items expose the unified item contract", async () => {
  const generated = path.join(root, "packages/design-system/generated");
  const registry = JSON.parse(await fs.readFile(path.join(generated, "registry.json"), "utf8"));
  const requiredKeys = ["exports", "composes", "dependencies", "documentation", "design", "quality"];

  for (const summary of registry.items) {
    const item = JSON.parse(await fs.readFile(path.join(generated, summary.path), "utf8"));
    for (const key of requiredKeys) assert.ok(Object.hasOwn(item, key), `${summary.name} must expose ${key}`);
  }
});

test("Registry v2 schemas reject invalid semantic versions", async () => {
  const designSystem = path.join(root, "packages/design-system");
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const registrySchema = JSON.parse(await fs.readFile(path.join(designSystem, "schema/registry.json"), "utf8"));
  const itemSchema = JSON.parse(await fs.readFile(path.join(designSystem, "schema/registry-item.json"), "utf8"));
  const registry = JSON.parse(await fs.readFile(path.join(designSystem, "generated/registry.json"), "utf8"));
  const item = JSON.parse(await fs.readFile(path.join(designSystem, "generated/registry-items/yami-design-system.json"), "utf8"));

  registry.version = "1.0.0-..";
  item.version = "1.0.0-..";
  assert.equal(ajv.compile(registrySchema)(registry), false);
  assert.equal(ajv.compile(itemSchema)(item), false);
});
