import { describe, expect, it } from "vitest";

import { validateDesign } from "../principles";
import { _resetTokenCache } from "../principles/validators/token-exists";

describe("token-exists principle", () => {
  it("loads the generated token contract and rejects fabricated tokens", () => {
    _resetTokenCache();
    const result = validateDesign(
      '.title { color: var(--text-primary); font-size: var(--font-size-heading-lg); }',
      { filename: "generated-example.css" },
    );

    expect(result.pass).toBe(false);
    expect(result.violations.map((violation) => violation.ruleId)).toContain("token-exists");
  });
});
