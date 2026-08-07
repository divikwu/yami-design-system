import { describe, expect, test } from "vitest";

import {
  formatUsageMarkdown,
  loadUsageForTitle,
} from "../.storybook/component-docs";

describe("component docs usage content", () => {
  test("resolves a spaced Storybook title to its component usage guide", async () => {
    const usage = await loadUsageForTitle(
      "YAMI/Components/Commerce/Product Card",
    );

    expect(usage).toContain("# ProductCard — Usage");
    expect(usage).toContain("## When to use");
  });

  test("resolves Card, which previously had no Storybook docs entry", async () => {
    expect(await loadUsageForTitle("YAMI/Components/Layout/Card")).toContain(
      "# Card — Usage",
    );
  });

  test("demotes the usage title below the component page title", () => {
    expect(formatUsageMarkdown("# Button — Usage\n\n## When to use")).toBe(
      "## Button — Usage\n\n## When to use",
    );
  });
});
