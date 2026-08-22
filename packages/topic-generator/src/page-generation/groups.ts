import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type { TopicPageContentGroupCopy } from "../page-content/contracts.js";

export function topicPageGeneratedProductGroups(
  selection: ProductSelectionResult,
  module: TopicPagePlanV2["modules"][number],
  localizedGroups: readonly TopicPageContentGroupCopy[] = [],
) {
  const assignedProductIds = new Set(
    module.assignments.map(({ productId }) => productId),
  );
  const labelsByGroupId = new Map(
    localizedGroups.map(({ groupId, label }) => [groupId, label.text]),
  );
  return (selection.modules.find(({ id }) => id === module.id)?.groups ?? [])
    .map(({ id, label, productIds }) => ({
      id,
      label: labelsByGroupId.get(id) ?? label,
      productIds: productIds.filter((productId) => assignedProductIds.has(productId)),
    }))
    .filter(({ productIds }) => productIds.length > 0);
}
