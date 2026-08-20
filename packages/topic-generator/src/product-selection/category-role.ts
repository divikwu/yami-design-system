import type { ProductRole } from "../types.js";
import type { CategoryRoleStrategyConfig } from "./config.js";
import type {
  CatalogCandidateSnapshot,
  CatalogCandidateSnapshotReview,
  CatalogTaxonomySnapshot,
  CategoryRoleProposalReview,
  ProductSelectionResult,
  ProductSelectionModuleGroup,
  ProductSelectionScene,
  SceneProposalReview,
  SelectedCategoryRole,
  SceneCandidateProduct,
} from "./contracts.js";

const PRODUCT_ROLES: ProductRole[] = ["core", "pairing", "accessory"];

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function reviewCategoryRoleProposal(
  value: unknown,
  keyword: string,
  taxonomy: CatalogTaxonomySnapshot,
  config: CategoryRoleStrategyConfig,
): CategoryRoleProposalReview {
  const proposal = objectValue(value);
  const issues: string[] = [];
  if (!proposal) {
    return {
      status: "rejected",
      issues: ["CategoryRoleProposal must be a JSON object."],
      categories: [],
    };
  }
  if (proposal.schemaVersion !== "category-role-proposal/v1") {
    issues.push('schemaVersion must be "category-role-proposal/v1".');
  }
  if (proposal.keyword !== keyword) issues.push("Proposal keyword does not match the SelectionRun.");
  if (proposal.strategyRef !== config.ref) {
    issues.push("Proposal strategyRef does not match the SelectionRun.");
  }
  if (proposal.taxonomyDigest !== taxonomy.digest) {
    issues.push("Proposal taxonomyDigest does not match the CatalogTaxonomySnapshot.");
  }

  const rawCategories = Array.isArray(proposal.categories) ? proposal.categories : [];
  if (!Array.isArray(proposal.categories)) issues.push("categories must be an array.");
  if (rawCategories.length !== config.categoryRoles.total) {
    issues.push(`Proposal must select exactly ${config.categoryRoles.total} categories.`);
  }

  const taxonomyById = new Map(
    taxonomy.categories.filter(({ enabled }) => enabled).map((category) => [category.id, category]),
  );
  const seenIds = new Set<string>();
  const categories: SelectedCategoryRole[] = [];
  let previousRoleIndex = -1;

  rawCategories.forEach((rawCategory, index) => {
    const category = objectValue(rawCategory);
    if (!category) {
      issues.push(`categories[${index}] must be an object.`);
      return;
    }
    const categoryId = typeof category.categoryId === "string"
      ? category.categoryId.trim()
      : "";
    const role = category.role;
    const reason = typeof category.reason === "string" ? category.reason.trim() : "";
    if (!categoryId) issues.push(`categories[${index}].categoryId is required.`);
    if (seenIds.has(categoryId)) issues.push(`Category ${categoryId} is selected more than once.`);
    seenIds.add(categoryId);
    const catalogCategory = taxonomyById.get(categoryId);
    if (!catalogCategory) issues.push(`Category ${categoryId || index} is not enabled in the taxonomy snapshot.`);
    if (!PRODUCT_ROLES.includes(role as ProductRole)) {
      issues.push(`Category ${categoryId || index} has an unsupported role.`);
    } else {
      const roleIndex = config.categoryRoles.priority.indexOf(role as ProductRole);
      if (roleIndex < previousRoleIndex) {
        issues.push("Categories must be ordered as core, pairing, then accessory.");
      }
      previousRoleIndex = Math.max(previousRoleIndex, roleIndex);
    }
    if (!reason) issues.push(`Category ${categoryId || index} requires a reviewable reason.`);
    if (catalogCategory && PRODUCT_ROLES.includes(role as ProductRole) && reason) {
      categories.push({
        id: catalogCategory.id,
        label: catalogCategory.label,
        path: catalogCategory.path,
        role: role as ProductRole,
        reason,
      });
    }
  });

  const selectedIds = new Set(categories.map(({ id }) => id));
  const taxonomyByAllIds = new Map(taxonomy.categories.map((category) => [category.id, category]));
  categories.forEach((category) => {
    let parentId = taxonomyByAllIds.get(category.id)?.parentId ?? null;
    while (parentId) {
      if (selectedIds.has(parentId)) {
        issues.push(`Category ${category.id} overlaps with selected ancestor ${parentId}.`);
        break;
      }
      parentId = taxonomyByAllIds.get(parentId)?.parentId ?? null;
    }
  });

  const distribution = PRODUCT_ROLES.map((role) =>
    categories.filter((category) => category.role === role).length
  ) as [number, number, number];
  const allowed = config.categoryRoles.allowedDistributions.some((candidate) =>
    candidate.every((count, index) => count === distribution[index])
  );
  if (!allowed) {
    issues.push(`Category role distribution ${distribution.join(":")} is not allowed.`);
  }

  return {
    status: issues.length === 0 ? "accepted" : "rejected",
    issues,
    categories: issues.length === 0 ? categories : [],
  };
}

export function reviewCatalogCandidateSnapshot(
  snapshot: CatalogCandidateSnapshot,
  keyword: string,
  taxonomyDigest: string,
  categories: SelectedCategoryRole[],
  config: CategoryRoleStrategyConfig,
): CatalogCandidateSnapshotReview {
  const issues: string[] = [];
  if (snapshot.schemaVersion !== "catalog-candidate-snapshot/v1") {
    issues.push('schemaVersion must be "catalog-candidate-snapshot/v1".');
  }
  if (snapshot.keyword !== keyword) issues.push("Candidate keyword does not match the SelectionRun.");
  if (snapshot.strategyRef !== config.ref) {
    issues.push("Candidate strategyRef does not match the SelectionRun.");
  }
  if (snapshot.taxonomyDigest !== taxonomyDigest) {
    issues.push("Candidate taxonomyDigest does not match the CatalogTaxonomySnapshot.");
  }
  const productsById = new Map(snapshot.products.map((product) => [product.id, product]));
  const expectedById = new Map(categories.map((category) => [category.id, category]));
  const receivedIds = new Set(snapshot.categories.map((category) => category.id));
  categories.forEach((category) => {
    if (!receivedIds.has(category.id)) issues.push(`Candidate snapshot is missing category ${category.id}.`);
  });
  snapshot.categories.forEach((category) => {
    const expected = expectedById.get(category.id);
    if (!expected) {
      issues.push(`Candidate snapshot includes unselected category ${category.id}.`);
      return;
    }
    if (category.role !== expected.role) issues.push(`Candidate category ${category.id} changed role.`);
    if (category.productIds.length > config.retrieval.perCategory.limit) {
      issues.push(`Candidate category ${category.id} exceeds its product limit.`);
    }
    category.productIds.forEach((productId) => {
      const product = productsById.get(productId);
      if (!product) {
        issues.push(`Candidate product ${productId} is missing from the product map.`);
        return;
      }
      if (String(product.categoryL3Id ?? "") !== category.id) {
        issues.push(`Candidate product ${productId} does not belong to category ${category.id}.`);
      }
    });
  });
  if (snapshot.discoveryProductIds.length > config.retrieval.discoveryPool.limit) {
    issues.push("Discovery candidate pool exceeds its product limit.");
  }
  snapshot.discoveryProductIds.forEach((productId) => {
    if (!productsById.has(productId)) {
      issues.push(`Discovery product ${productId} is missing from the product map.`);
    }
  });
  return { status: issues.length === 0 ? "accepted" : "rejected", issues };
}

export function sceneCandidateProducts(
  snapshot: CatalogCandidateSnapshot,
  categories: SelectedCategoryRole[],
): SceneCandidateProduct[] {
  const roleByCategoryId = new Map(categories.map(({ id, role }) => [id, role]));
  return snapshot.products.flatMap((product) => {
    const role = roleByCategoryId.get(String(product.categoryL3Id ?? ""));
    return role ? [{ ...product, role }] : [];
  });
}

export function reviewSceneProposal(
  value: unknown,
  keyword: string,
  candidateSnapshot: CatalogCandidateSnapshot,
  categories: SelectedCategoryRole[],
  config: CategoryRoleStrategyConfig,
): SceneProposalReview {
  const proposal = objectValue(value);
  const issues: string[] = [];
  if (!proposal) {
    return {
      status: "rejected",
      issues: ["SceneProposal must be a JSON object."],
      scenes: [],
    };
  }
  if (proposal.schemaVersion !== "scene-proposal/v1") {
    issues.push('schemaVersion must be "scene-proposal/v1".');
  }
  if (proposal.keyword !== keyword) issues.push("Scene keyword does not match the SelectionRun.");
  if (proposal.strategyRef !== config.ref) {
    issues.push("Scene strategyRef does not match the SelectionRun.");
  }
  if (proposal.candidateSnapshotDigest !== candidateSnapshot.digest) {
    issues.push("Scene candidateSnapshotDigest does not match the candidate evidence.");
  }

  const rawScenes = Array.isArray(proposal.scenes) ? proposal.scenes : [];
  if (!Array.isArray(proposal.scenes)) issues.push("scenes must be an array.");
  const [minimumScenes, maximumScenes] = config.modules.startHere.sceneRange;
  if (rawScenes.length < minimumScenes || rawScenes.length > maximumScenes) {
    issues.push(`SceneProposal must contain ${minimumScenes}-${maximumScenes} scenes.`);
  }

  const products = sceneCandidateProducts(candidateSnapshot, categories);
  const roleByProductId = new Map(products.map(({ id, role }) => [id, role]));
  const seenSceneIds = new Set<string>();
  const seenSceneProductIds = new Set<string>();
  const scenes: ProductSelectionScene[] = [];

  rawScenes.forEach((rawScene, sceneIndex) => {
    const scene = objectValue(rawScene);
    if (!scene) {
      issues.push(`scenes[${sceneIndex}] must be an object.`);
      return;
    }
    const id = typeof scene.id === "string" ? scene.id.trim() : "";
    const name = typeof scene.name === "string" ? scene.name.trim() : "";
    const title = typeof scene.title === "string" ? scene.title.trim() : "";
    const description = typeof scene.description === "string" ? scene.description.trim() : "";
    if (!id) issues.push(`scenes[${sceneIndex}].id is required.`);
    if (seenSceneIds.has(id)) issues.push(`Scene ${id} is defined more than once.`);
    seenSceneIds.add(id);
    if (!name || !title || !description) {
      issues.push(`Scene ${id || sceneIndex} requires name, title, and description.`);
    }
    const rawGroups = Array.isArray(scene.productGroups) ? scene.productGroups : [];
    if (rawGroups.length !== config.modules.startHere.groupsPerScene) {
      issues.push(
        `Scene ${id || sceneIndex} must contain exactly ${config.modules.startHere.groupsPerScene} product groups.`,
      );
    }
    const productGroups = rawGroups.flatMap((rawGroup, groupIndex) => {
      const group = objectValue(rawGroup);
      if (!group) {
        issues.push(`Scene ${id || sceneIndex} group ${groupIndex} must be an object.`);
        return [];
      }
      const core = typeof group.core === "string" ? group.core.trim() : "";
      const pairing = typeof group.pairing === "string" && group.pairing.trim()
        ? group.pairing.trim()
        : null;
      const accessory = typeof group.accessory === "string" && group.accessory.trim()
        ? group.accessory.trim()
        : null;
      if (!core) issues.push(`Scene ${id || sceneIndex} group ${groupIndex} requires core.`);
      ([
        ["core", core],
        ["pairing", pairing],
        ["accessory", accessory],
      ] as const).forEach(([expectedRole, productId]) => {
        if (!productId) return;
        if (seenSceneProductIds.has(productId)) {
          issues.push(`Scene product ${productId} is used more than once.`);
        }
        seenSceneProductIds.add(productId);
        const actualRole = roleByProductId.get(productId);
        if (!actualRole) issues.push(`Scene product ${productId} is absent from candidate evidence.`);
        else if (actualRole !== expectedRole) {
          issues.push(`Scene product ${productId} cannot fill the ${expectedRole} role.`);
        }
      });
      return [{ core, pairing, accessory }];
    });
    if (id && name && title && description) {
      scenes.push({ id, name, title, description, productGroups });
    }
  });

  return {
    status: issues.length === 0 ? "accepted" : "rejected",
    issues,
    scenes: issues.length === 0 ? scenes : [],
  };
}

function unique(values: string[]) {
  return values.filter((value, index, all) => all.indexOf(value) === index);
}

function sortBySoldCount(productIds: string[], productsById: Map<string, CatalogCandidateSnapshot["products"][number]>) {
  return [...productIds].sort((leftId, rightId) => {
    const left = productsById.get(leftId);
    const right = productsById.get(rightId);
    return (right?.soldCount ?? 0) - (left?.soldCount ?? 0) ||
      (left?.sourceRank ?? Number.MAX_SAFE_INTEGER) -
        (right?.sourceRank ?? Number.MAX_SAFE_INTEGER) ||
      leftId.localeCompare(rightId);
  });
}

function productBrandKey(product: CatalogCandidateSnapshot["products"][number]) {
  return product.brandId ? `id:${product.brandId}` : null;
}

export function finalizeCategoryRoleSelection(
  candidateSnapshot: CatalogCandidateSnapshot,
  config: CategoryRoleStrategyConfig,
  categories: SelectedCategoryRole[],
  sceneReview: SceneProposalReview,
): ProductSelectionResult {
  const roleByCategoryId = new Map(categories.map(({ id, role }) => [id, role]));
  const productsById = new Map(candidateSnapshot.products.map((product) => [product.id, product]));
  const startHereIds = unique(
    sceneReview.scenes.flatMap((scene) =>
      scene.productGroups.flatMap(({ core, pairing, accessory }) =>
        [core, pairing, accessory].filter((id): id is string => Boolean(id))
      )
    ),
  );
  const startHereGroups: ProductSelectionModuleGroup[] = sceneReview.scenes.map((scene) => ({
    id: scene.id,
    label: scene.name,
    productIds: unique(scene.productGroups.flatMap(({ core, pairing, accessory }) =>
      [core, pairing, accessory].filter((id): id is string => Boolean(id))
    )),
  }));
  const usedIds = new Set(startHereIds);
  const candidateCategoriesById = new Map(
    candidateSnapshot.categories.map((category) => [category.id, category]),
  );
  const popularIds: string[] = [];
  const popularGroups: ProductSelectionModuleGroup[] = [];
  categories
    .filter(({ role }) => role === config.modules.popularPicks.role)
    .slice(0, config.modules.popularPicks.categories)
    .forEach(({ id, label, role }) => {
      const availableIds = sortBySoldCount(
        candidateCategoriesById.get(id)?.productIds ?? [],
        productsById,
      ).filter((productId) => !usedIds.has(productId));
      const groupProductIds = availableIds.slice(0, config.modules.popularPicks.perCategory);
      groupProductIds.forEach((productId) => {
        popularIds.push(productId);
        usedIds.add(productId);
      });
      if (groupProductIds.length > 0) {
        popularGroups.push({ id, label, role, productIds: groupProductIds });
      }
    });

  type BrandCandidate = {
    label: string;
    productIds: string[];
    roleCounts: Record<ProductRole, number>;
    firstSourceRank: number;
  };
  const brandCandidates = new Map<string, BrandCandidate>();
  const categoryCandidateIds = new Set(
    candidateSnapshot.categories.flatMap(({ productIds }) => productIds),
  );
  candidateSnapshot.products.forEach((product) => {
    if (!categoryCandidateIds.has(product.id)) return;
    const role = roleByCategoryId.get(String(product.categoryL3Id ?? ""));
    if (!role) return;
    const key = productBrandKey(product);
    if (!key) return;
    const candidate = brandCandidates.get(key) ?? {
      productIds: [],
      label: product.brand,
      roleCounts: { core: 0, pairing: 0, accessory: 0 },
      firstSourceRank: product.sourceRank,
    };
    candidate.productIds.push(product.id);
    candidate.roleCounts[role] += 1;
    candidate.firstSourceRank = Math.min(candidate.firstSourceRank, product.sourceRank);
    brandCandidates.set(key, candidate);
  });

  const brandRole = (candidate: BrandCandidate) =>
    config.categoryRoles.priority.reduce((selectedRole, role) =>
      candidate.roleCounts[role] > candidate.roleCounts[selectedRole] ? role : selectedRole
    );
  const rankedBrands = [...brandCandidates.entries()]
    .map(([key, candidate]) => ({
      key,
      candidate,
      role: brandRole(candidate),
      availableIds: sortBySoldCount(candidate.productIds, productsById)
        .filter((productId) => !usedIds.has(productId)),
    }))
    .filter(({ availableIds }) => availableIds.length >= config.modules.brandSpotlight.perBrand)
    .sort((left, right) =>
      right.candidate.productIds.length - left.candidate.productIds.length ||
      left.candidate.firstSourceRank - right.candidate.firstSourceRank ||
      left.key.localeCompare(right.key)
    );
  const selectedBrandKeys = new Set<string>();
  const brandIds: string[] = [];
  const brandGroups: ProductSelectionModuleGroup[] = [];
  const selectBrand = (brand: (typeof rankedBrands)[number]) => {
    selectedBrandKeys.add(brand.key);
    const groupProductIds = brand.availableIds.slice(0, config.modules.brandSpotlight.perBrand);
    groupProductIds.forEach((productId) => {
      brandIds.push(productId);
      usedIds.add(productId);
    });
    brandGroups.push({
      id: brand.key.slice("id:".length),
      label: brand.candidate.label,
      role: brand.role,
      productIds: groupProductIds,
    });
  };
  config.categoryRoles.priority.forEach((role) => {
    rankedBrands
      .filter((brand) => brand.role === role && !selectedBrandKeys.has(brand.key))
      .slice(0, config.modules.brandSpotlight.brandsByRole[role])
      .forEach(selectBrand);
  });
  const totalBrandTarget = Object.values(config.modules.brandSpotlight.brandsByRole)
    .reduce((total, count) => total + count, 0);
  config.categoryRoles.priority.forEach((role) => {
    rankedBrands
      .filter((brand) => brand.role === role && !selectedBrandKeys.has(brand.key))
      .slice(0, Math.max(0, totalBrandTarget - selectedBrandKeys.size))
      .forEach(selectBrand);
  });
  if (brandGroups.length < 2) {
    brandIds.forEach((productId) => usedIds.delete(productId));
    brandIds.length = 0;
    brandGroups.length = 0;
  }

  const pairingCategories = categories.filter(({ role }) => role === "pairing");
  const accessoryCategories = categories.filter(({ role }) => role === "accessory");
  let pairingTarget = config.modules.exploreMore.categoriesByRole.pairing;
  let accessoryTarget = config.modules.exploreMore.categoriesByRole.accessory;
  if (pairingCategories.length < pairingTarget) {
    accessoryTarget += pairingTarget - pairingCategories.length;
    pairingTarget = pairingCategories.length;
  }
  if (accessoryCategories.length < accessoryTarget) {
    pairingTarget = Math.min(
      pairingTarget + accessoryTarget - accessoryCategories.length,
      pairingCategories.length,
    );
    accessoryTarget = accessoryCategories.length;
  }
  const exploreIds: string[] = [];
  const exploreGroups: ProductSelectionModuleGroup[] = [];
  [
    ...pairingCategories.slice(0, pairingTarget),
    ...accessoryCategories.slice(0, accessoryTarget),
  ].forEach(({ id, label, role }) => {
    const discoveryIds = candidateSnapshot.discoveryProductIds.filter((productId) =>
      String(productsById.get(productId)?.categoryL3Id ?? "") === id
    );
    const sourceIds = discoveryIds.length > 0
      ? discoveryIds
      : candidateCategoriesById.get(id)?.productIds ?? [];
    const groupProductIds = sortBySoldCount(sourceIds, productsById)
      .filter((productId) => !usedIds.has(productId))
      .slice(0, config.modules.exploreMore.perCategory);
    groupProductIds.forEach((productId) => {
      exploreIds.push(productId);
      usedIds.add(productId);
    });
    if (groupProductIds.length > 0) {
      exploreGroups.push({ id, label, role, productIds: groupProductIds });
    }
  });

  const selectedIds = [...startHereIds, ...popularIds, ...brandIds, ...exploreIds];
  const selectedProducts = selectedIds.flatMap((id) => {
    const product = productsById.get(id);
    const role = product
      ? roleByCategoryId.get(String(product.categoryL3Id ?? ""))
      : undefined;
    if (!product || !role) return [];
    return [{
      ...product,
      pool: "primary" as const,
      role,
    }];
  });

  return {
    schemaVersion: "product-selection-result/v1",
    strategyRef: config.ref,
    keyword: candidateSnapshot.keyword,
    site: candidateSnapshot.site,
    selectedAt: candidateSnapshot.fetchedAt,
    pools: {
      primaryIds: selectedProducts.map(({ id }) => id),
      relatedIds: [],
    },
    products: selectedProducts,
    selectedCategories: categories,
    scenes: sceneReview.scenes,
    modules: [
      { id: "start-here", productIds: startHereIds, groups: startHereGroups },
      { id: "popular-picks", productIds: popularIds, groups: popularGroups },
      { id: "brand-spotlight", productIds: brandIds, groups: brandGroups },
      { id: "explore-more", productIds: exploreIds, groups: exploreGroups },
    ],
  };
}
