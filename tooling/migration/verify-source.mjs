import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const lock = JSON.parse(await fs.readFile(path.join(root, "docs/migration/source-lock.json"), "utf8"));
const source = "/Users/divikwu/diw/workspace/projects/design-labs";
const hashes = (await fs.readFile(path.join(root, "docs/migration/source-files.sha256"), "utf8")).trim().split("\n");
if (hashes.length !== 669) throw new Error(`Expected 669 source hashes, received ${hashes.length}`);
if (await fs.stat(path.join(source, ".git")).then(() => true).catch(() => false)) {
  const tree = execFileSync("git", ["rev-parse", `${lock.sourceSha}:${lock.sourcePath}`], { cwd: source, encoding: "utf8" }).trim();
  const status = execFileSync("git", ["status", "--porcelain", "--", lock.sourcePath], { cwd: source, encoding: "utf8" }).trim();
  if (tree !== lock.sourceTreeOid) throw new Error(`Source tree mismatch: ${tree}`);
  if (status) throw new Error(`Source working tree is not clean:\n${status}`);
}
if (lock.sourceSha !== "e22f1e14ac74d1e024d8dffc47935e8f43e115cf" || lock.sourceTreeOid !== "babc3f8d006789d336cab13d880acd9298d2e8b8") throw new Error("Source lock changed");
console.log(`Source lock verified: ${lock.sourceSha} / ${lock.sourceTreeOid} / ${hashes.length} files.`);
