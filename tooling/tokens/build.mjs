import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const packageRoot = path.join(root, "packages/design-system");
const sourceDir = path.join(packageRoot, "tokens");
const outputDir = path.join(packageRoot, "generated");
const contractsGeneratedPath = path.join(root, "packages/contracts/src/generated-token-references.ts");
const check = process.argv.includes("--check");

const contexts = [
  { id: "root", selector: ":root" },
  { id: "dark", selector: ".dark" },
  { id: "desktop", media: "(min-width: 1024px)" },
  { id: "desktop-lg", media: "(min-width: 1440px)" },
  { id: "locale-en", selector: ":root:lang(en), :where(:lang(en))" },
  { id: "locale-zh", selector: ":root:lang(zh), :where(:lang(zh))" },
];

async function list(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory()
    ? list(path.join(dir, entry.name))
    : entry.name.endsWith(".tokens.json") ? [path.join(dir, entry.name)] : []));
  return nested.flat().sort();
}

function collect(node, trail = [], inheritedType, output = []) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return output;
  const type = node.$type ?? inheritedType;
  if (Object.hasOwn(node, "$value")) {
    output.push({
      id: trail.join("."),
      css: cssName(trail),
      type,
      value: node.$value,
      description: node.$description,
      extensions: node.$extensions,
    });
    return output;
  }
  for (const [key, value] of Object.entries(node)) {
    if (!key.startsWith("$")) collect(value, [...trail, key], type, output);
  }
  return output;
}

function cssName(trail) {
  const property = trail.at(-1);
  if (property === "font-size" || property === "line-height") {
    return `--${property}-${trail.slice(0, -1).join("-")}`;
  }
  return `--${trail.join("-")}`;
}

function valueForCss(value, type, extensions) {
  if (type === "fontFamily" && value && typeof value === "object" && !Array.isArray(value)) {
    const families = [...new Set(Object.values(value).filter((item) => typeof item === "string"))];
    const genericFamily = extensions?.["com.yami.generic-family"] ?? "sans-serif";
    return [...families.map((family) => family.includes(" ") ? `'${family}'` : family), genericFamily].join(", ");
  }
  const selected = value && typeof value === "object" && !Array.isArray(value)
    ? value.EN ?? Object.values(value)[0]
    : value;
  if (type === "fontWeight" && typeof selected === "string") {
    const weights = { Regular: 400, Medium: 500, SemiBold: 600, Bold: 700 };
    if (weights[selected] !== undefined) return String(weights[selected]);
  }
  if (typeof selected === "string" && /^\{[^}]+\}$/.test(selected)) {
    return `var(--${selected.slice(1, -1).replaceAll(".", "-")})`;
  }
  return String(selected);
}

function sourceContext(relativePath) {
  if (relativePath === "tokens/themes/dark.tokens.json") return "dark";
  if (relativePath === "tokens/typography/desktop-lg.tokens.json") return "desktop-lg";
  if (relativePath === "tokens/typography/_base.tokens.json") return "documentation";
  if (relativePath === "tokens/typography/tablet.tokens.json") return "tablet-alias";
  return "root";
}

function asValue(token, contextId) {
  const cssValue = valueForCss(token.value, token.type, token.extensions);
  return {
    contextId,
    rawValue: token.value,
    cssValue,
    resolvedValue: cssValue,
    ...(typeof token.value === "string" && /^\{[^}]+\}$/.test(token.value)
      ? { aliasOf: token.value.slice(1, -1) }
      : {}),
  };
}

function renderBlock(selector, tokens) {
  if (tokens.length === 0) return "";
  return `${selector} {\n${tokens.map((token) => `  ${token.css}: ${valueForCss(token.value, token.type, token.extensions)};`).join("\n")}\n}\n`;
}

const files = await list(sourceDir);
const byContext = new Map(contexts.map(({ id }) => [id, []]));
const tokenRecords = new Map();
let mobileTypography;
let tabletTypography;

for (const file of files) {
  const relativePath = path.relative(packageRoot, file);
  const document = JSON.parse(await fs.readFile(file, "utf8"));
  if (sourceContext(relativePath) === "tablet-alias") tabletTypography = document;
  if (relativePath === "tokens/typography/mobile.tokens.json") mobileTypography = document;

  const contextId = sourceContext(relativePath);
  if (contextId === "documentation" || contextId === "tablet-alias") continue;

  for (const token of collect(document)) {
    const enriched = { ...token, sourcePath: relativePath };
    byContext.get(contextId).push(enriched);

    const record = tokenRecords.get(token.id) ?? {
      id: token.id,
      name: token.id,
      cssVar: token.css,
      type: token.type ?? "unknown",
      group: token.id.split(".")[0],
      ...(token.description ? { description: token.description } : {}),
      sourceRef: { path: relativePath, pointer: `/${token.id.split(".").join("/")}/$value` },
      values: [],
    };
    record.values.push(asValue(token, contextId));
    tokenRecords.set(token.id, record);

    // Keep language-specific weights in the generated runtime and catalog.
    // Match inherited language on every element so nested lang switches reset.
    if (token.type === "fontWeight" && token.value?.EN !== token.value?.CN && token.value?.CN) {
      for (const [locale, key] of [["en", "EN"], ["zh", "CN"]]) {
        const override = { ...enriched, value: token.value[key] };
        byContext.get(`locale-${locale}`).push(override);
        record.values.push(asValue(override, `locale-${locale}`));
      }
    }

    const breakpointOverrides = token.extensions?.["com.yami.breakpoints"];
    if (breakpointOverrides?.desktop !== undefined) {
      const override = { ...enriched, value: breakpointOverrides.desktop };
      byContext.get("desktop").push(override);
      record.values.push(asValue(override, "desktop"));
    }
  }
}

if (JSON.stringify(mobileTypography) !== JSON.stringify(tabletTypography)) {
  throw new Error("Tablet typography differs from mobile; add an explicit tablet runtime context before generating.");
}

const rootValues = new Map(byContext.get("root").map((token) => [token.id, valueForCss(token.value, token.type, token.extensions)]));
const desktopLgOverrides = byContext.get("desktop-lg").filter(
  (token) => rootValues.get(token.id) !== valueForCss(token.value, token.type, token.extensions),
);
const desktopLgIds = new Set(desktopLgOverrides.map((token) => token.id));
byContext.set("desktop-lg", desktopLgOverrides);
for (const record of tokenRecords.values()) {
  record.values = record.values.filter(
    (value) => value.contextId !== "desktop-lg" || desktopLgIds.has(record.id),
  );
}

for (const tokens of byContext.values()) tokens.sort((a, b) => a.id.localeCompare(b.id));
const records = [...tokenRecords.values()].sort((a, b) => a.id.localeCompare(b.id));
const rootTokens = byContext.get("root");
const flat = Object.fromEntries(rootTokens.map((token) => [token.id, {
  $type: token.type,
  $value: token.value,
  ...(token.description ? { $description: token.description } : {}),
}]));
const tokenDocument = { brandId: "yami", contexts, tokens: records };

const css = [
  "/* Generated from DTCG token sources. Do not edit. */\n",
  renderBlock(":root", rootTokens),
  renderBlock(".dark", byContext.get("dark")),
  `@media (min-width: 1024px) {\n${renderBlock("  :root", byContext.get("desktop")).replaceAll("\n", "\n  ").trimEnd()}\n}\n`,
  `@media (min-width: 1440px) {\n${renderBlock("  :root", byContext.get("desktop-lg")).replaceAll("\n", "\n  ").trimEnd()}\n}\n`,
  ...contexts.filter(({ id }) => id.startsWith("locale-")).map(({ id, selector }) => renderBlock(selector, byContext.get(id))),
].join("");
const ts = `/* Generated from DTCG token sources. Do not edit. */\nexport const tokens = ${JSON.stringify(flat, null, 2)} as const;\n`;
const md = `# YAMI tokens\n\nGenerated from DTCG sources. Contextual values are listed separately.\n\n| Token | Context | Type | Value |\n| --- | --- | --- | --- |\n${records.flatMap((token) => token.values.map((value) => `| \`${token.id}\` | ${value.contextId} | ${token.type} | \`${value.cssValue}\` |`)).join("\n")}\n`;
const flatJson = `${JSON.stringify(flat, null, 2)}\n`;
const json = `${JSON.stringify(tokenDocument, null, 2)}\n`;
const digestInput = `${files.map((file) => path.relative(root, file)).join("\n")}\n${json}`;
const digest = `${createHash("sha256").update(digestInput).digest("hex")}\n`;
const contractReferences = `/* Generated from YAMI DTCG token sources. Do not edit. */\nexport const registeredTokenReferenceTypes = ${JSON.stringify(Object.fromEntries(records.map((token) => [token.id, token.type])), null, 2)} as const;\n`;
const outputs = new Map([
  ["tokens.css", css],
  ["tokens.ts", ts],
  ["tokens.flat.json", flatJson],
  ["tokens.json", json],
  ["tokens.md", md],
  ["tokens.sha256", digest],
]);

await fs.mkdir(outputDir, { recursive: true });
let drift = false;
for (const [name, content] of outputs) {
  const target = path.join(outputDir, name);
  if (check) {
    const current = await fs.readFile(target, "utf8").catch(() => "");
    if (current !== content) {
      console.error(`Generated token drift: ${path.relative(root, target)}`);
      drift = true;
    }
  } else {
    await fs.writeFile(target, content);
  }
}

if (check) {
  const current = await fs.readFile(contractsGeneratedPath, "utf8").catch(() => "");
  if (current !== contractReferences) {
    console.error(`Generated token drift: ${path.relative(root, contractsGeneratedPath)}`);
    drift = true;
  }
} else {
  await fs.writeFile(contractsGeneratedPath, contractReferences);
}

if (drift) process.exitCode = 1;
else console.log(`${check ? "Verified" : "Generated"} ${records.length} runtime tokens from ${files.length} DTCG files.`);
