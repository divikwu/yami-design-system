import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const generatorCss = [
  "../web/topic-generator.module.css",
  "../web/workbench-controls.module.css",
].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");

describe("Topic Generator typography", () => {
  it("uses GT Walsheim Medium for non-serif emphasis", () => {
    expect(generatorCss).toMatch(
      /\.generatorShell :where\(strong, b\)\s*\{[^}]*font-weight:\s*var\(--font-weight-emphasize\)/s,
    );
    expect(generatorCss).not.toMatch(
      /font-weight:\s*(?:600|700|var\(--font-weight-semibold\))\s*;/,
    );
  });
});
