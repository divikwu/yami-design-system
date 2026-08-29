import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const globalsCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const controlsCss = readFileSync(
  new URL("../app/ui/workbench-controls.module.css", import.meta.url),
  "utf8",
);
const productDetailCss = readFileSync(
  new URL(
    "../../../packages/prototypes/pages/ProductDetailPage/ProductDetailPage.module.css",
    import.meta.url,
  ),
  "utf8",
);

describe("Canvas typography rules", () => {
  it("maps both locale emphasis weights to GT Walsheim Medium", () => {
    expect(layout).toMatch(/GT-Walsheim-Medium\.woff2[^}]*weight:\s*"500"/);
    expect(layout).toMatch(/GT-Walsheim-Medium\.woff2[^}]*weight:\s*"600"/);
  });

  it("uses locale-aware emphasis tokens in workbench controls", () => {
    expect(globalsCss).toMatch(
      /\.panel-heading span\s*\{[^}]*font-weight:\s*var\(--font-weight-emphasize\)/s,
    );

    for (const selector of [
      "selectItem\\[data-selected\\]",
      "button",
      "segmentedInput:checked \\+ \\.segmentedLabel",
    ]) {
      expect(controlsCss).toMatch(
        new RegExp(`\\.${selector}\\s*\\{[^}]*font-weight:\\s*var\\(--font-weight-emphasize\\)`, "s"),
      );
    }

    expect(`${globalsCss}\n${controlsCss}`).not.toMatch(/font-weight:\s*(?:500|600|700)\s*;/);
  });

  it("uses locale-aware emphasis for the sans-serif Nutrition Facts title", () => {
    const titleRules = productDetailCss.matchAll(/\.details \.nutritionTitle\s*\{([^}]*)\}/gs);
    const declarations = [...titleRules].map((match) => match[1]).join("\n");

    expect(declarations).toContain("font-weight: var(--font-weight-emphasize);");
    expect(declarations).not.toMatch(
      /font-weight:\s*(?:600|700|var\(--font-weight-semibold\))\s*;/,
    );
  });
});
