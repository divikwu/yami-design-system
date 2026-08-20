import type { ContentLanguage, YamiProduct } from "../types.js";
import type { RelevanceStrategyConfig } from "./config.js";
import type {
  ProductSemanticProposalGroup,
  ProductSemanticProposalReview,
  ProductSemanticProposalScene,
} from "./contracts.js";

function objectValue(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

export function reviewProductSemanticProposal(
  value: unknown,
  keyword: string,
  products: YamiProduct[],
  config: RelevanceStrategyConfig,
  language: ContentLanguage,
): ProductSemanticProposalReview {
  const proposal = objectValue(value);
  const policy = config.themeCollections;
  const issues: string[] = [];
  const warnings: string[] = [];
  const groups: ProductSemanticProposalGroup[] = [];
  const scenes: ProductSemanticProposalScene[] = [];
  if (!proposal || proposal.schemaVersion !== "product-semantic-proposal/v1") {
    return {
      status: "rejected",
      issues: ['schemaVersion must be "product-semantic-proposal/v1".'],
      warnings,
      groups,
      scenes,
    };
  }
  if (proposal.keyword !== keyword) issues.push("Proposal keyword does not match the selection run.");
  if (proposal.strategyRef !== config.ref) {
    issues.push("Proposal strategyRef does not match the selection run.");
  }
  if (!policy) {
    issues.push("Product-semantic grouping requires a themeCollections policy.");
    return { status: "rejected", issues, warnings, groups, scenes };
  }

  const knownIds = new Set(products.map(({ id }) => id));
  const assignedIds = new Set<string>();
  const groupIds = new Set<string>();
  const groupLabels = new Set<string>();
  let repeatedAssignments = 0;
  const rawGroups = Array.isArray(proposal.groups) ? proposal.groups : [];
  if (rawGroups.length < policy.minimumThemes) {
    issues.push(`Proposal must contain at least ${policy.minimumThemes} semantic groups.`);
  }
  rawGroups.forEach((rawGroup, index) => {
    const group = objectValue(rawGroup);
    const id = text(group?.id);
    const label = text(group?.label);
    const reason = text(group?.reason);
    const proposedProductIds = strings(group?.productIds);
    if (!id || !label || !reason || proposedProductIds.length === 0) {
      issues.push(`Group ${index + 1} requires id, label, reason, and productIds.`);
      return;
    }
    if (groupIds.has(id)) issues.push(`Group id ${id} is duplicated.`);
    if (groupLabels.has(label.toLocaleLowerCase())) issues.push(`Group label ${label} is duplicated.`);
    groupIds.add(id);
    groupLabels.add(label.toLocaleLowerCase());
    const localIds = new Set<string>();
    const productIds: string[] = [];
    proposedProductIds.forEach((productId) => {
      if (!knownIds.has(productId)) {
        issues.push(`Group ${id} references unknown product ${productId}.`);
        return;
      }
      if (localIds.has(productId) || assignedIds.has(productId)) {
        repeatedAssignments += 1;
        return;
      }
      localIds.add(productId);
      assignedIds.add(productId);
      productIds.push(productId);
    });
    if (productIds.length === 0) issues.push(`Group ${id} has no unique known products.`);
    groups.push({ id, label, reason, productIds });
  });
  if (repeatedAssignments > 0) {
    warnings.push(
      `${repeatedAssignments} repeated product assignments were removed; the first group keeps each product.`,
    );
  }
  const unassignedProducts = products.filter(({ id }) => !assignedIds.has(id));
  if (unassignedProducts.length > 0) {
    warnings.push(
      `${unassignedProducts.length} unassigned PrimaryPool products were placed in the deterministic More to Explore group.`,
    );
    groups.push({
      id: "product-semantic-more-to-explore",
      label: language === "zh" ? "更多选择" : "More to Explore",
      productIds: unassignedProducts.map(({ id }) => id),
      reason: language === "zh"
        ? "Agent 未明确归类的已验证商品，由系统保留在可审阅的补充分组中。"
        : "Verified products not classified by the Agent are retained in a reviewable fallback group.",
    });
  }

  const rawScenes = Array.isArray(proposal.scenes) ? proposal.scenes : [];
  if (rawScenes.length < policy.minimumThemes || rawScenes.length > policy.maximumThemes) {
    issues.push(`Proposal must contain ${policy.minimumThemes}-${policy.maximumThemes} shopping scenes.`);
  }
  const sceneIds = new Set<string>();
  const sceneNames = new Set<string>();
  const usedSceneProductIds = new Set<string>();
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  rawScenes.forEach((rawScene, index) => {
    const scene = objectValue(rawScene);
    const id = text(scene?.id);
    const name = text(scene?.name);
    const shoppingGoal = text(scene?.shoppingGoal);
    const reason = text(scene?.reason);
    const referencedGroupIds = strings(scene?.groupIds);
    if (!id || !name || !shoppingGoal || !reason || referencedGroupIds.length === 0) {
      issues.push(`Scene ${index + 1} requires id, name, shoppingGoal, reason, and groupIds.`);
      return;
    }
    if (sceneIds.has(id)) issues.push(`Scene id ${id} is duplicated.`);
    if (sceneNames.has(name.toLocaleLowerCase())) issues.push(`Scene name ${name} is duplicated.`);
    sceneIds.add(id);
    sceneNames.add(name.toLocaleLowerCase());
    const sceneProductIds = referencedGroupIds.flatMap((groupId) => {
      const group = groupsById.get(groupId);
      if (!group) {
        issues.push(`Scene ${id} references unknown group ${groupId}.`);
        return [];
      }
      return group.productIds;
    }).filter((productId) => !usedSceneProductIds.has(productId));
    if (sceneProductIds.length < policy.minimumProducts) {
      issues.push(`Scene ${id} must provide at least ${policy.minimumProducts} distinct products.`);
    }
    sceneProductIds.slice(0, policy.maximumProducts)
      .forEach((productId) => usedSceneProductIds.add(productId));
    scenes.push({ id, name, shoppingGoal, reason, groupIds: referencedGroupIds });
  });

  return {
    status: issues.length === 0 ? "accepted" : "rejected",
    issues,
    warnings,
    groups,
    scenes,
  };
}
