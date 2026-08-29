import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const tokensCss = readFileSync("generated/tokens.css", "utf8");
const desktopTokens = JSON.parse(
  readFileSync("tokens/typography/mobile.tokens.json", "utf8"),
);
const desktopLgTokens = JSON.parse(
  readFileSync("tokens/typography/desktop-lg.tokens.json", "utf8"),
);

function cssBlock(pattern: RegExp) {
  const match = tokensCss.match(pattern);
  if (!match?.[1]) throw new Error(`Missing CSS block: ${pattern}`);
  return match[1];
}

function cssFilesWithin(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return cssFilesWithin(path);
    return entry.isFile() && entry.name.endsWith(".css") ? [path] : [];
  });
}

function desktopLgBlocks(css: string) {
  const marker = "@media (min-width: 1440px)";
  const blocks: string[] = [];
  let cursor = 0;

  while ((cursor = css.indexOf(marker, cursor)) !== -1) {
    const openingBrace = css.indexOf("{", cursor + marker.length);
    let depth = 1;
    let index = openingBrace + 1;
    while (index < css.length && depth > 0) {
      if (css[index] === "{") depth += 1;
      if (css[index] === "}") depth -= 1;
      index += 1;
    }
    blocks.push(css.slice(openingBrace + 1, index - 1));
    cursor = index;
  }

  return blocks;
}

describe("YAMI typography scale", () => {
  it("keeps Desktop and Desktop-LG typography aligned as separate authored modes", () => {
    const root = cssBlock(/^:root \{([\s\S]*?)^\}/m);

    for (const [name, value] of Object.entries({
      "font-size-display-xl": "32px",
      "line-height-display-xl": "40px",
      "font-size-display-md": "28px",
      "line-height-display-md": "36px",
      "font-size-display-sm": "24px",
      "line-height-display-sm": "32px",
      "font-size-heading-4xl": "40px",
      "line-height-heading-4xl": "48px",
      "font-size-heading-3xl": "32px",
      "line-height-heading-3xl": "40px",
      "font-size-heading-2xl": "28px",
      "line-height-heading-2xl": "36px",
      "font-size-heading-xl": "20px",
      "line-height-heading-xl": "28px",
      "font-size-caption-md": "14px",
      "line-height-caption-md": "20px",
      "font-size-caption-sm": "12px",
      "line-height-caption-sm": "14px",
      "font-size-link-sm": "12px",
      "line-height-link-sm": "16px",
      "font-size-price-md": "24px",
      "line-height-price-md": "32px",
      "font-size-price-sm": "18px",
      "line-height-price-sm": "24px",
      "font-size-strike-sm": "12px",
      "line-height-strike-sm": "16px",
    })) {
      expect(root).toContain(`--${name}: ${value};`);
    }

    expect(desktopLgTokens).toEqual(desktopTokens);
    expect(desktopLgBlocks(tokensCss)).toEqual([]);
  });

  it("does not swap component type roles at the desktop-lg breakpoint", () => {
    const componentCss = [
      ...cssFilesWithin("components"),
      ...cssFilesWithin("../prototypes/pages"),
    ];
    const typographyOverrides = componentCss.filter((path) =>
      desktopLgBlocks(readFileSync(path, "utf8")).some((block) =>
        /(?:font-size|line-height)\s*:/.test(block),
      ),
    );

    expect(typographyOverrides).toEqual([]);
  });
});
