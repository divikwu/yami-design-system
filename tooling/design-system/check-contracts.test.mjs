import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const toolingDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(toolingDir, "../..");
const source = path.join(root, "packages/design-system");

test("stable contracts reject escaped references, import-only exports, fabricated bindings, invalid versions, and missing Showcase stories", async (context) => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "yami-contracts-"));
  context.after(() => fs.rm(temporaryRoot, { recursive: true, force: true }));

  for (const relativePath of ["components", "schema", "principles/principles.ts", "generated/tokens.css", "generated/registry-items"]) {
    const from = path.join(source, relativePath);
    const to = path.join(temporaryRoot, relativePath);
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.cp(from, to, { recursive: true });
  }

  const metaPath = path.join(temporaryRoot, "components/Button/meta.json");
  const meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
  meta.usageRef = "../../DESIGN.md";
  meta.version = "1.0.0-..";
  meta.tokenBindings["--fabricated-contract-token"] = {
    property: "color",
    selector: ".fabricated",
  };
  await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);

  const indexPath = path.join(temporaryRoot, "components/Button/index.ts");
  const indexSource = await fs.readFile(indexPath, "utf8");
  await fs.writeFile(indexPath, indexSource.replace("export { Button } from './Button'", "import { Button } from './Button'"));

  const storyPath = path.join(temporaryRoot, "components/Button/Button.stories.tsx");
  const storySource = await fs.readFile(storyPath, "utf8");
  await fs.writeFile(storyPath, storySource.replace("export const Showcase", "export const RenamedShowcase"));

  const result = spawnSync(process.execPath, [path.join(toolingDir, "check-contracts.mjs")], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, YAMI_CONTRACTS_DESIGN_SYSTEM_DIR: temporaryRoot },
  });
  const output = `${result.stdout}\n${result.stderr}`;

  assert.notEqual(result.status, 0);
  assert.match(output, /usageRef escapes the component directory/);
  assert.match(output, /meta\.json\/version must match pattern/);
  assert.match(output, /unknown token binding --fabricated-contract-token/);
  assert.match(output, /declared export Button is missing from index\.ts/);
  assert.match(output, /canonical story must export Showcase/);
});
