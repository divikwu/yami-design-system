import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";

export function topicPageGeneratedProductGroups(
  selection: ProductSelectionResult,
  module: TopicPagePlanV2["modules"][number],
) {
  const assignedProductIds = new Set(
    module.assignments.map(({ productId }) => productId),
  );
  return (selection.modules.find(({ id }) => id === module.id)?.groups ?? [])
    .map(({ id, label, productIds }) => ({
      id,
      label,
      productIds: productIds.filter((productId) => assignedProductIds.has(productId)),
    }))
    .filter(({ productIds }) => productIds.length > 0);
}
