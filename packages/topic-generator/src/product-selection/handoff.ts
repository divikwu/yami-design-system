import type { ProductSelectionRun } from "./contracts.js";

export type ProductSelectionHandoffStage =
  | "product-semantic-proposal"
  | "category-role-proposal"
  | "scene-proposal";

export interface ProductSelectionHandoffTask {
  schemaVersion: "product-selection-handoff-task/v1";
  stage: ProductSelectionHandoffStage;
  run: Extract<ProductSelectionRun,
    { status: "needs-product-semantic-proposal" | "needs-category-proposal" | "needs-scene-proposal" }>;
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

export function productSelectionHandoffStage(
  run: ProductSelectionRun,
): ProductSelectionHandoffStage | null {
  if (run.status === "needs-product-semantic-proposal") return "product-semantic-proposal";
  if (run.status === "needs-category-proposal") return "category-role-proposal";
  if (run.status === "needs-scene-proposal") return "scene-proposal";
  return null;
}

export function createProductSelectionHandoffTask(
  run: ProductSelectionRun,
): ProductSelectionHandoffTask {
  const stage = productSelectionHandoffStage(run);
  if (!stage || (
    run.status !== "needs-product-semantic-proposal" &&
    run.status !== "needs-category-proposal" &&
    run.status !== "needs-scene-proposal"
  )) {
    throw new Error(`ProductSelection run ${run.status} does not request an interactive proposal.`);
  }
  return {
    schemaVersion: "product-selection-handoff-task/v1",
    stage,
    run,
  };
}

export function parseProductSelectionHandoffResponse(
  value: unknown,
  expectedStage: ProductSelectionHandoffStage,
) {
  const response = objectValue(value, "ProductSelection handoff response");
  if (response.schemaVersion !== "product-selection-handoff-response/v1") {
    throw new Error('ProductSelection handoff response schemaVersion must be "product-selection-handoff-response/v1".');
  }
  if (response.stage !== expectedStage) {
    throw new Error("ProductSelection handoff response stage does not match the pending task.");
  }
  if (!("proposal" in response)) {
    throw new Error("ProductSelection handoff response proposal is required.");
  }
  return response.proposal;
}
