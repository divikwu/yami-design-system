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

  it("keeps the workbench control typography at its desktop-lg size", () => {
    expect(generatorCss).toMatch(
      /\.generatorControls button,\s*\.generatorControls input\s*\{[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;/s,
    );
    expect(generatorCss).toMatch(
      /\.generatorControls \[data-slot="workbench-field-label"\]\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*14px;/s,
    );
    expect(generatorCss).not.toMatch(
      /\.generatorControls label span\s*\{[^}]*font-size:/s,
    );
    for (const selector of [
      "textInput",
      "selectTrigger",
      "selectItem",
      "button",
      "segmentedLabel",
    ]) {
      expect(generatorCss).toMatch(
        new RegExp(`\\.${selector}\\s*\\{[^}]*font-size:\\s*14px;[^}]*font-weight:\\s*var\\(--font-weight-normal\\);[^}]*line-height:\\s*20px;`, "s"),
      );
    }
    expect(generatorCss).toMatch(
      /\.selectItem\[data-selected\]\s*\{[^}]*font-weight:\s*var\(--font-weight-normal\)/s,
    );
    expect(generatorCss).toMatch(
      /\.segmentedInput:checked \+ \.segmentedLabel\s*\{[^}]*font-weight:\s*var\(--font-weight-normal\)/s,
    );
    expect(generatorCss).toMatch(
      /\.topicPackageDownload\s*\{[^}]*font-size:\s*14px;[^}]*font-weight:\s*var\(--font-weight-normal\);[^}]*line-height:\s*20px;/s,
    );
  });

  it("keeps saved topic metadata at a 12px minimum", () => {
    expect(generatorCss).toMatch(
      /\.managedRunOption small\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s,
    );
  });

  it("keeps localized generator actions readable without wrapping", () => {
    expect(generatorCss).toMatch(
      /\.generatorActions\s*\{[^}]*padding-top:\s*16px;[^}]*border-top:\s*1px solid var\(--divider-default\);[^}]*gap:\s*8px;/s,
    );
    expect(generatorCss).toMatch(
      /\.capabilityActions\s*\{[^}]*grid-template-columns:\s*1fr;[^}]*gap:\s*8px;/s,
    );
    expect(generatorCss).toMatch(
      /\.capabilityActions button\s*\{[^}]*width:\s*100%;[^}]*white-space:\s*nowrap;/s,
    );
  });

  it("anchors the topic package download to the sidebar footer", () => {
    expect(generatorCss).toMatch(
      /\.generatorControls\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s,
    );
    expect(generatorCss).toMatch(
      /\.generatorForm\s*\{[^}]*display:\s*flex;[^}]*flex:\s*1;[^}]*flex-direction:\s*column;/s,
    );
    expect(generatorCss).toMatch(
      /\.managedRunOutput\s*\{[^}]*display:\s*flex;[^}]*flex:\s*1;[^}]*flex-direction:\s*column;/s,
    );
    expect(generatorCss).toMatch(
      /\.deliverableLinks\s*\{[^}]*margin-top:\s*auto;/s,
    );
  });

  it("keeps input and loaded topic sources on the same vertical rhythm", () => {
    expect(generatorCss).toMatch(
      /\.runLibrary\s*\{[^}]*gap:\s*16px;/s,
    );
    expect(generatorCss).toMatch(
      /\.runLibrary:has\(> \.sourceLoadPanel\)\s*\{[^}]*margin-bottom:\s*0;/s,
    );
    expect(generatorCss).toMatch(
      /\.sourceLoadPanel,\s*\.sourceInputPanel\s*\{[^}]*gap:\s*0;/s,
    );
  });
});
