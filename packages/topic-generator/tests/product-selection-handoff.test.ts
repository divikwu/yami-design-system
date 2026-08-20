import { describe, expect, it } from "vitest";
import {
  createProductSelectionHandoffTask,
  parseProductSelectionHandoffResponse,
  type ProductSelectionRun,
} from "../src/index.js";

const categoryRun: ProductSelectionRun = {
  schemaVersion: "product-selection-run/v1",
  status: "needs-category-proposal",
  strategyRef: "category-role/landing-page-agent@1",
  context: {
    keyword: "Matcha",
    taxonomyDigest: "sha256:taxonomy",
    categories: [],
  },
};

describe("ProductSelection Codex/Kiro handoff", () => {
  it("exports a product-semantic proposal task", () => {
    const run: ProductSelectionRun = {
      schemaVersion: "product-selection-run/v1",
      status: "needs-product-semantic-proposal",
      strategyRef: "relevance/intent-themes@5",
      context: {
        keyword: "Matcha",
        language: "zh",
        minimumGroups: 2,
        maximumScenes: 6,
        minimumProductsPerScene: 4,
        maximumProductsPerScene: 16,
        products: [],
      },
    };
    expect(createProductSelectionHandoffTask(run)).toEqual({
      schemaVersion: "product-selection-handoff-task/v1",
      stage: "product-semantic-proposal",
      run,
    });
  });

  it("exports only the proposal task requested by the current run", () => {
    expect(createProductSelectionHandoffTask(categoryRun)).toEqual({
      schemaVersion: "product-selection-handoff-task/v1",
      stage: "category-role-proposal",
      run: categoryRun,
    });
    expect(() => createProductSelectionHandoffTask({
      schemaVersion: "product-selection-run/v1",
      status: "blocked",
      strategyRef: "category-role/landing-page-agent@1",
      issues: ["blocked"],
    })).toThrow("does not request an interactive proposal");
  });

  it("imports only a response for the expected stage", () => {
    const proposal = { schemaVersion: "category-role-proposal/v1" };
    expect(parseProductSelectionHandoffResponse({
      schemaVersion: "product-selection-handoff-response/v1",
      stage: "category-role-proposal",
      proposal,
    }, "category-role-proposal")).toBe(proposal);
    expect(() => parseProductSelectionHandoffResponse({
      schemaVersion: "product-selection-handoff-response/v1",
      stage: "scene-proposal",
      proposal,
    }, "category-role-proposal")).toThrow("stage does not match");
  });
});
