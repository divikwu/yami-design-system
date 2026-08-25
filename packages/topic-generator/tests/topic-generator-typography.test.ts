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
    expect(generatorCss).toMatch(
      /\.agentArchitectureCard h5\s*\{[^}]*font-size:\s*var\(--font-size-heading-xs\);[^}]*font-weight:\s*var\(--font-weight-emphasize\);[^}]*line-height:\s*var\(--line-height-heading-xs\);/s,
    );
    expect(generatorCss).not.toMatch(
      /font-weight:\s*(?:600|700|var\(--font-weight-semibold\))\s*;/,
    );
  });

  it("reserves serif typography for editorial preview headings", () => {
    expect(generatorCss).toMatch(
      /\.analysisHeader h2\s*\{[^}]*font-size:\s*var\(--font-size-heading-xl\);[^}]*font-weight:\s*var\(--font-weight-emphasize\);[^}]*letter-spacing:\s*var\(--letter-spacing-normal\);[^}]*line-height:\s*var\(--line-height-heading-xl\);/s,
    );
    expect(generatorCss).toMatch(
      /\.viewHeading h3\s*\{[^}]*font-size:\s*var\(--font-size-heading-xl\);[^}]*font-weight:\s*var\(--font-weight-emphasize\);[^}]*letter-spacing:\s*var\(--letter-spacing-normal\);[^}]*line-height:\s*var\(--line-height-heading-xl\);/s,
    );
    expect(generatorCss).not.toMatch(
      /\.moduleHeading h3,\s*\.viewHeading h3\s*\{/s,
    );
    for (const selector of ["moduleHeading h3", "heroCopy h1", "generatedScene h4"]) {
      expect(generatorCss).toMatch(
        new RegExp(`\\.${selector.replace(" ", "\\s+")}\\s*\\{[^}]*font-family:\\s*var\\(--font-family-serif\\);`, "s"),
      );
    }
  });

  it("wraps agent stage metadata only when the row cannot fit", () => {
    expect(generatorCss).toMatch(
      /\.workflowDiagramNode\.agentArchitectureFlowNode\s*\{[^}]*grid-template-columns:\s*24px 28px minmax\(0, 1fr\);/s,
    );
    expect(generatorCss).toMatch(
      /\.agentArchitectureFlowCopy\s*\{[^}]*display:\s*flex;[^}]*min-width:\s*0;[^}]*flex-wrap:\s*wrap;[^}]*column-gap:\s*var\(--space-150\);[^}]*row-gap:\s*var\(--space-050\);/s,
    );
    expect(generatorCss).toMatch(
      /\.agentArchitectureFlowCopy > strong\s*\{[^}]*min-width:\s*max-content;/s,
    );
    expect(generatorCss).toMatch(
      /\.agentArchitectureFlowCopy > small\s*\{[^}]*box-sizing:\s*border-box;[^}]*width:\s*max-content;[^}]*max-width:\s*100%;[^}]*white-space:\s*normal;/s,
    );
  });

  it("uses matching gray caption typography and spacing around agent card titles", () => {
    expect(generatorCss).toMatch(
      /\.agentArchitectureSummary > div\s*\{[^}]*display:\s*grid;[^}]*gap:\s*4px;/s,
    );
    expect(generatorCss).toMatch(
      /\.agentArchitectureSummary code\s*\{[^}]*color:\s*var\(--text-secondary\);[^}]*font-family:\s*var\(--font-mono\);[^}]*font-size:\s*var\(--font-size-caption-sm\);[^}]*line-height:\s*var\(--line-height-caption-sm\);[^}]*letter-spacing:\s*\.06em;/s,
    );
  });

  it("aligns agent detail tables with their summary titles", () => {
    expect(generatorCss).toMatch(
      /\.agentArchitectureBody\s*\{[^}]*display:\s*grid;[^}]*padding:\s*16px 18px 18px;[^}]*column-gap:\s*14px;[^}]*grid-template-columns:\s*42px minmax\(0, 1fr\);/s,
    );
    expect(generatorCss).toMatch(
      /\.agentArchitectureBody \.agentArchitectureDetails\s*\{[^}]*margin:\s*0;[^}]*grid-column:\s*2;/s,
    );
  });

  it("uses the small caption token for every agent Skill tag", () => {
    expect(generatorCss).toMatch(
      /\.agentSkillList code\s*\{[^}]*font-size:\s*var\(--font-size-caption-sm\);/s,
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
