import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sourceDir = path.join(root, "packages/design-system/tokens");
const outputDir = path.join(root, "packages/design-system/generated");
const check = process.argv.includes("--check");

async function list(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? list(path.join(dir, entry.name)) : entry.name.endsWith(".tokens.json") ? [path.join(dir, entry.name)] : []));
  return nested.flat().sort();
}

function collect(node, trail = [], inheritedType, output = []) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return output;
  const type = node.$type ?? inheritedType;
  if (Object.hasOwn(node, "$value")) {
    output.push({ id: trail.join("."), css: `--${trail.join("-")}`, type, value: node.$value, description: node.$description });
    return output;
  }
  for (const [key, value] of Object.entries(node)) if (!key.startsWith("$")) collect(value, [...trail, key], type, output);
  return output;
}

function valueForCss(value) {
  const selected = value && typeof value === "object" && !Array.isArray(value) ? value.EN ?? Object.values(value)[0] : value;
  if (typeof selected === "string" && /^\{[^}]+\}$/.test(selected)) return `var(--${selected.slice(1, -1).replaceAll(".", "-")})`;
  if (typeof selected === "number") return String(selected);
  return String(selected);
}

const files = await list(sourceDir);
const tokens = [];
for (const file of files) {
  const start = tokens.length;
  collect(JSON.parse(await fs.readFile(file, "utf8")), [], undefined, tokens);
  for (const token of tokens.slice(start)) token.sourcePath = path.relative(path.join(root, "packages/design-system"), file);
}
tokens.sort((a, b) => a.id.localeCompare(b.id));
const flat = Object.fromEntries(tokens.map((token) => [token.id, { $type: token.type, $value: token.value, ...(token.description ? { $description: token.description } : {}) }]));
const tokenDocument = {
  brandId: "yami",
  contexts: [{ id: "root", selector: ":root" }],
  tokens: tokens.map((token) => ({
    id: token.id,
    name: token.id,
    cssVar: token.css,
    type: token.type ?? "unknown",
    group: token.id.split(".")[0],
    ...(token.description ? { description: token.description } : {}),
    sourceRef: { path: token.sourcePath, pointer: `/${token.id.split(".").join("/")}/$value` },
    values: [{ contextId: "root", rawValue: token.value, cssValue: valueForCss(token.value), resolvedValue: valueForCss(token.value), ...(typeof token.value === "string" && /^\{[^}]+\}$/.test(token.value) ? { aliasOf: token.value.slice(1, -1) } : {}) }]
  }))
};
const css = `/* Generated from DTCG token sources. Do not edit. */\n:root {\n${tokens.map((token) => `  ${token.css}: ${valueForCss(token.value)};`).join("\n")}\n}\n`;
const ts = `/* Generated from DTCG token sources. Do not edit. */\nexport const tokens = ${JSON.stringify(flat, null, 2)} as const;\n`;
const md = `# YAMI tokens\n\nGenerated from DTCG sources.\n\n| Token | Type | Value |\n| --- | --- | --- |\n${tokens.map((token) => `| \`${token.id}\` | ${token.type ?? ""} | \`${valueForCss(token.value)}\` |`).join("\n")}\n`;
const flatJson = `${JSON.stringify(flat, null, 2)}\n`;
const json = `${JSON.stringify(tokenDocument, null, 2)}\n`;
const digest = `${createHash("sha256").update(files.map((file) => path.relative(root, file)).join("\n") + json).digest("hex")}\n`;
const outputs = new Map([["tokens.css", css], ["tokens.ts", ts], ["tokens.flat.json", flatJson], ["tokens.json", json], ["tokens.md", md], ["tokens.sha256", digest]]);

await fs.mkdir(outputDir, { recursive: true });
let drift = false;
for (const [name, content] of outputs) {
  const target = path.join(outputDir, name);
  if (check) {
    const current = await fs.readFile(target, "utf8").catch(() => "");
    if (current !== content) { console.error(`Generated token drift: ${path.relative(root, target)}`); drift = true; }
  } else await fs.writeFile(target, content);
}
if (drift) process.exitCode = 1;
else console.log(`${check ? "Verified" : "Generated"} ${tokens.length} tokens from ${files.length} DTCG files.`);
