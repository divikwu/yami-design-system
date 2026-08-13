import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const pageRoot = path.join(
  root,
  "packages/prototypes/pages/EcommerceHome",
);
const outputRoot = path.join(pageRoot, "assets/optimized");
const generatedModule = path.join(pageRoot, "optimizedImages.generated.ts");
const checkOnly = process.argv.includes("--check");

const heroRoot = "packages/design-system/components/HeroBanner/assets";
const shortcutRoot = "packages/design-system/components/ShortcutRail/assets";
const socialRoot = "packages/design-system/components/SocialMediaGallery/assets";
const brandRoot = "packages/design-system/components/BrandProductRail/assets";
const billboardRoot = "packages/design-system/components/Billboard/assets";
const productListRoot = "packages/design-system/components/ProductList/assets";

const specs = [];
// These checked-in sources are already the largest available originals. Their
// upper candidate stops at the source ceiling instead of violating the global
// no-upsample rule. Keep the exception list explicit so a future replacement
// cannot silently lose 2x coverage elsewhere.
const sourceCeilingSpecs = new Set([
  "socialPosterImages:3",
  "billboardImages:enDesktop",
  "billboardImages:zhDesktop",
]);

function add(group, key, input, widths, sizes, kind, maxBytes) {
  specs.push({ group, key, input, widths, sizes, kind, maxBytes });
}

for (const name of [
  "back-to-school",
  "glow-skin-like-makeup",
  "japanese-summer-festival",
  "midnight-street-food",
  "trending-summer",
  "sale-image",
]) {
  add(
    "heroCampaignImages",
    name,
    `${heroRoot}/${name}.webp`,
    [480, 960],
    "(min-width: 1440px) 25vw, (min-width: 1024px) 33vw, 320px",
    "marketing",
    220_000,
  );
}

for (const name of [
  "glow-foundation",
  "glow-patches",
  "glow-palette",
  "yuzu-chips",
  "hokkaido-caramel-cookies",
  "matcha-dango",
  "green-tea",
  "buldak-snack",
  "turtle-chips",
  "skin-care",
  "summer-snack",
  "summer-drink",
]) {
  add(
    "heroProductImages",
    name,
    `${heroRoot}/${name}.webp`,
    [256, 512],
    "150px",
    "product",
    180_000,
  );
}

for (let index = 1; index <= 23; index += 1) {
  const prefix = String(index).padStart(2, "0");
  const match = {
    "01": "trending",
    "02": "celebrity-shops",
    "03": "new-arrivals",
    "04": "summer-festival",
    "05": "family-wellness",
    "06": "beach-living",
    "07": "save-20",
    "08": "hot-pot",
    "09": "face-masks",
    "10": "better-sleep",
    "11": "baby-favorites",
    "12": "seasonal-hair",
    "13": "easy-meals",
    "14": "travel-list",
    "15": "flash-finds",
    "16": "popular-shops",
    "17": "stock-up",
    "18": "korean-trends",
    "19": "japan-finds",
    "20": "thai-style",
    "21": "weekly-picks",
    "22": "popular-posts",
    "23": "subscribe",
  }[prefix];
  add(
    "shortcutImages",
    prefix,
    `${shortcutRoot}/${prefix}-${match}.png`,
    [48, 96],
    "48px",
    "product",
    24_000,
  );
}

for (let index = 1; index <= 6; index += 1) {
  add(
    "socialPosterImages",
    String(index),
    `${socialRoot}/social-${index}.jpg`,
    index === 3 ? [240, 405] : [240, 480],
    "(min-width: 1440px) 16vw, (min-width: 1024px) 24vw, 240px",
    "marketing",
    130_000,
  );
}

for (let index = 1; index <= 5; index += 1) {
  add(
    "socialProductImages",
    String(index),
    `${socialRoot}/product-${index}.png`,
    [56, 112],
    "56px",
    "product",
    32_000,
  );
}

for (const name of [
  "maogeping",
  "bb-lab",
  "biodance",
  "glow",
  "teabless",
  "voolga",
]) {
  add(
    "brandBannerImages",
    name,
    `${brandRoot}/${name}-banner.webp`,
    [320, 444, 640, 888],
    "(min-width: 1024px) 30vw, 320px",
    "marketing",
    150_000,
  );
}

add(
  "billboardImages",
  "mobile",
  `${productListRoot}/campaign-banner-mobile.png`,
  [579, 1158],
  "100vw",
  "marketing",
  180_000,
);
add(
  "billboardImages",
  "zhDesktop",
  `${billboardRoot}/weekly-picks-zh-desktop.png`,
  [1600, 3170],
  "100vw",
  "marketing",
  220_000,
);
add(
  "billboardImages",
  "enDesktop",
  `${billboardRoot}/new-user-offer.png`,
  [793, 1585],
  "100vw",
  "marketing",
  160_000,
);

add(
  "atmosphericImages",
  "mobile",
  `${productListRoot}/atmospheric-mobile.jpg`,
  [600, 1200],
  "100vw",
  "marketing",
  180_000,
);
add(
  "atmosphericImages",
  "desktop",
  `${productListRoot}/atmospheric-pc.jpg`,
  [1920, 3840],
  "100vw",
  "marketing",
  420_000,
);

const metadata = new Map();

async function inputMetadata(spec) {
  const cached = metadata.get(spec.input);
  if (cached) return cached;
  const value = await sharp(path.join(root, spec.input)).metadata();
  if (!value.width || !value.height) {
    throw new Error(`Missing source dimensions: ${spec.input}`);
  }
  metadata.set(spec.input, value);
  return value;
}

function outputPath(spec, width) {
  const stem = path.basename(spec.input, path.extname(spec.input));
  return path.join(outputRoot, spec.group, `${stem}-${width}.webp`);
}

async function generate(spec) {
  const source = await inputMetadata(spec);
  for (const width of spec.widths) {
    if (width > source.width) {
      throw new Error(
        `Upsampling is forbidden: ${spec.input} is ${source.width}px, requested ${width}px`,
      );
    }
    const destination = outputPath(spec, width);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    const pipeline = sharp(path.join(root, spec.input)).resize({
      width,
      withoutEnlargement: true,
    });
    const webpOptions =
      spec.kind === "product"
        ? {
            quality: 90,
            alphaQuality: 100,
            nearLossless: true,
          }
        : { quality: 86, alphaQuality: 100 };
    await pipeline.webp(webpOptions).toFile(destination);
  }
}

async function check(spec) {
  const source = await inputMetadata(spec);
  const widths = [...new Set(spec.widths)].sort((left, right) => left - right);
  if (widths.length !== spec.widths.length) {
    throw new Error(`Duplicate candidate width: ${spec.group}:${spec.key}`);
  }
  const densityPairs =
    widths.length === 4
      ? [
          [widths[0], widths[2]],
          [widths[1], widths[3]],
        ]
      : [[widths[0], widths.at(-1)]];
  if (
    !sourceCeilingSpecs.has(`${spec.group}:${spec.key}`) &&
    densityPairs.some(([oneX, twoX]) => !oneX || !twoX || twoX < oneX * 2)
  ) {
    throw new Error(`Missing 2x coverage: ${spec.group}:${spec.key}`);
  }
  for (const width of spec.widths) {
    if (width > source.width) {
      throw new Error(
        `Upsampling is forbidden: ${spec.input} is ${source.width}px, requested ${width}px`,
      );
    }
    const destination = outputPath(spec, width);
    const [output, stat] = await Promise.all([
      sharp(destination).metadata(),
      fs.stat(destination),
    ]);
    const expectedHeight = Math.round((source.height * width) / source.width);
    if (
      output.format !== "webp" ||
      output.width !== width ||
      !output.height ||
      Math.abs(output.height - expectedHeight) > 1
    ) {
      throw new Error(
        `Invalid output ${path.relative(root, destination)}: expected WebP ${width}x${expectedHeight}, received ${output.format} ${output.width}x${output.height}`,
      );
    }
    if (stat.size > spec.maxBytes) {
      throw new Error(
        `Image budget exceeded: ${path.relative(root, destination)} is ${stat.size} bytes (limit ${spec.maxBytes})`,
      );
    }
  }
}

async function sourceLiteral(spec) {
  const stem = path.basename(spec.input, path.extname(spec.input));
  const candidates = spec.widths
    .map(
      (width) =>
        `{ src: new URL("./assets/optimized/${spec.group}/${stem}-${width}.webp", import.meta.url).href, width: ${width} }`,
    )
    .join(", ");
  const largest = spec.widths.at(-1);
  const output = await sharp(outputPath(spec, largest)).metadata();
  if (!output.height) {
    throw new Error(`Missing generated height: ${outputPath(spec, largest)}`);
  }
  const height = output.height;
  return `{
    src: new URL("./assets/optimized/${spec.group}/${stem}-${largest}.webp", import.meta.url).href,
    width: ${largest},
    height: ${height},
    candidates: [${candidates}],
    sizes: ${JSON.stringify(spec.sizes)},
  }`;
}

async function generatedSource() {
  const groups = new Map();
  for (const spec of specs) {
    const entries = groups.get(spec.group) ?? [];
    entries.push(`  ${JSON.stringify(spec.key)}: ${await sourceLiteral(spec)}`);
    groups.set(spec.group, entries);
  }

  return `/* Generated by tooling/images/ecommerce-home.mjs. */
import type { ResponsiveImageSource } from "@yami/design-system";

${Array.from(groups, ([group, entries]) => `export const ${group} = {
${entries.join(",\n")},
} as const satisfies Record<string, ResponsiveImageSource>;`).join("\n\n")}
`;
}

if (checkOnly) {
  for (const spec of specs) await check(spec);
  const expected = await generatedSource();
  const actual = await fs.readFile(generatedModule, "utf8");
  if (actual !== expected) {
    throw new Error(
      "optimizedImages.generated.ts is stale; run pnpm generate:images:ecommerce-home",
    );
  }
  console.log(`Validated ${specs.length} responsive image sets.`);
} else {
  for (const spec of specs) await generate(spec);
  await fs.writeFile(generatedModule, await generatedSource());
  console.log(`Generated ${specs.length} responsive image sets.`);
}
