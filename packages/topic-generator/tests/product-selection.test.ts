import { describe, expect, it, vi } from "vitest";
import {
  advanceProductSelectionRun,
  buildTopicPagePlanFromProductSelection,
  getProductSelectionStrategyConfig,
  listProductSelectionStrategyConfigs,
  loadYamiBrandCatalogCoverage,
  refineYamiCatalogSnapshotForIntent,
  runProductSelectionWorkflow,
  type CatalogTaxonomySnapshot,
  type CatalogCandidateSnapshot,
  type CategoryRoleProposal,
  type ProductRole,
  type YamiSearchSnapshot,
} from "../src/index.js";

function brandIntent(
  categories: Array<{ id: string; label: string; evidenceCount: number }>,
): NonNullable<YamiSearchSnapshot["intent"]> {
  return {
    schemaVersion: "theme-intent/v2",
    source: "catalog-evidence",
    themeType: "brand",
    catalogDomain: "Beauty",
    attributeSchemaVersion: "catalog-v1",
    entityType: "brand",
    canonicalEntity: { id: "11712", label: "ANUA" },
    shoppingIntent: "browse-brand",
    shopperAction: "browse",
    shoppingGoal: "Browse ANUA products by category.",
    needs: categories.map(({ label }) => label),
    conditions: [],
    mustInclude: ["ANUA"],
    mustExclude: [],
    searchTerms: ["ANUA"],
    categories: categories.map((category) => ({
      ...category,
      path: ["Beauty", category.label],
    })),
    constraints: [{
      id: "core-entity:anua",
      kind: "core-entity",
      value: "ANUA",
      status: "verified",
      evidenceIds: ["catalog-brand:11712"],
    }],
    evidenceRefs: [{
      id: "catalog-brand:11712",
      source: "catalog-brand",
      label: "ANUA",
    }],
    candidates: [],
    decision: {
      status: "resolved",
      selectedCandidateId: "brand:brand:11712:browse-brand:browse",
      evidenceLevel: "high",
      selectedCandidateMargin: 1,
      requiresAgentReview: false,
    },
    reason: "The catalog brand exactly matches the keyword.",
    confidence: 0.99,
  };
}

function categoryRoleFixture() {
  const roles: ProductRole[] = [
    "core", "core", "core", "core", "core",
    "pairing", "pairing", "pairing",
    "accessory", "accessory",
  ];
  const categories = roles.map((role, index) => ({
    id: `${1000 + index}`,
    parentId: null,
    label: `Category ${index + 1}`,
    aliases: [],
    path: ["Catalog", `Category ${index + 1}`],
    level: 3,
    enabled: true,
    role,
  }));
  const snapshot: YamiSearchSnapshot = {
    keyword: "Matcha",
    site: "us",
    sourceUrl: "https://example.com/search?q=Matcha",
    fetchedAt: "2026-08-17T00:00:00.000Z",
    products: [],
  };
  const taxonomySnapshot: CatalogTaxonomySnapshot = {
    schemaVersion: "catalog-taxonomy-snapshot/v1",
    site: "us",
    source: "imported-artifact",
    sourceRef: "fixtures/yami-us-taxonomy.json",
    fetchedAt: "2026-08-17T00:00:00.000Z",
    digest: "sha256:taxonomy",
    categories: categories.map(({ role: _role, ...category }) => category),
  };
  const categoryRoleProposal: CategoryRoleProposal = {
    schemaVersion: "category-role-proposal/v1",
    keyword: "Matcha",
    strategyRef: "category-role/landing-page-agent@1",
    taxonomyDigest: "sha256:taxonomy",
    categories: categories.map(({ id, role }) => ({
      categoryId: id,
      role,
      reason: `Reason for ${id}`,
    })),
  };
  return { categories, snapshot, taxonomySnapshot, categoryRoleProposal };
}

function candidateSnapshotFixture(
  categories: ReturnType<typeof categoryRoleFixture>["categories"],
  perCategory = 1,
): CatalogCandidateSnapshot {
  const products = categories.flatMap(({ id, label }, categoryIndex) =>
    Array.from({ length: perCategory }, (_, productIndex) => {
      const productId = perCategory === 1
        ? `product-${id}`
        : `product-${id}-${productIndex}`;
      return {
        id: productId,
        title: `${label} Product ${productIndex + 1}`,
        brand: `Brand ${categoryIndex + 1}`,
        brandId: categoryIndex + 1,
        price: "$1.00",
        imageUrl: `https://example.com/${productId}.webp`,
        productUrl: `https://example.com/${productId}`,
        sourceRank: categoryIndex * perCategory + productIndex + 1,
        categoryL3Id: Number(id),
        categoryL3Name: label,
        soldCount: 10_000 - categoryIndex * 100 - productIndex,
      };
    })
  );
  return {
    schemaVersion: "catalog-candidate-snapshot/v1",
    strategyRef: "category-role/landing-page-agent@1",
    keyword: "Matcha",
    site: "us",
    taxonomyDigest: "sha256:taxonomy",
    fetchedAt: "2026-08-17T00:01:00.000Z",
    digest: "sha256:candidates",
    source: { adapterId: "fixture", attempts: [] },
    categories: categories.map(({ id, label, role }) => ({
      id,
      label,
      role,
      productIds: products
        .filter(({ categoryL3Id }) => String(categoryL3Id) === id)
        .map(({ id: productId }) => productId),
    })),
    discoveryProductIds: [],
    products,
  };
}

function repeatedSceneProposalFixture(productGroups: Array<{
  core: string;
  pairing: string | null;
  accessory: string | null;
}>) {
  return {
    schemaVersion: "scene-proposal/v1" as const,
    keyword: "Matcha",
    strategyRef: "category-role/landing-page-agent@1" as const,
    candidateSnapshotDigest: "sha256:candidates",
    scenes: Array.from({ length: 4 }, (_, index) => ({
      id: `scene-${index + 1}`,
      name: `Scene ${index + 1}`,
      title: `Scene title ${index + 1}`,
      description: `Scene description ${index + 1}`,
      productGroups,
    })),
  };
}

function sceneProposalFixture() {
  const categoryIds = {
    core: ["1000", "1001", "1002", "1003", "1004"],
    pairing: ["1005", "1006", "1007"],
    accessory: ["1008", "1009"],
  } as const;
  const productId = (role: keyof typeof categoryIds, slot: number) => {
    const ids = categoryIds[role];
    return `product-${ids[slot % ids.length]}-${Math.floor(slot / ids.length)}`;
  };

  return {
    schemaVersion: "scene-proposal/v1" as const,
    keyword: "Matcha",
    strategyRef: "category-role/landing-page-agent@1" as const,
    candidateSnapshotDigest: "sha256:candidates",
    scenes: Array.from({ length: 4 }, (_, sceneIndex) => ({
      id: `scene-${sceneIndex + 1}`,
      name: `Scene ${sceneIndex + 1}`,
      title: `Scene title ${sceneIndex + 1}`,
      description: `Scene description ${sceneIndex + 1}`,
      productGroups: Array.from({ length: 2 }, (_, groupIndex) => {
        const slot = sceneIndex * 2 + groupIndex;
        return {
          core: productId("core", slot),
          pairing: productId("pairing", slot),
          accessory: productId("accessory", slot),
        };
      }),
    })),
  };
}

describe("ProductSelection Module", () => {
  it("exposes versioned strategy configs without making callers know their implementation", () => {
    expect(
      listProductSelectionStrategyConfigs().map(({ ref, engine }) => ({ ref, engine })),
    ).toEqual([
      { ref: "relevance/default@1", engine: "relevance" },
      { ref: "relevance/intent-themes@2", engine: "relevance" },
      { ref: "relevance/intent-themes@3", engine: "relevance" },
      { ref: "relevance/intent-themes@4", engine: "relevance" },
      { ref: "relevance/intent-themes@5", engine: "relevance" },
      {
        ref: "category-role/landing-page-agent@1",
        engine: "category-role",
      },
    ]);

    expect(getProductSelectionStrategyConfig("relevance/intent-themes@3"))
      .toMatchObject({ themeCollections: { minimumProducts: 4, maximumProducts: 8 } });
    expect(getProductSelectionStrategyConfig("relevance/intent-themes@4"))
      .toMatchObject({ themeCollections: { minimumProducts: 4, maximumProducts: 16 } });
    expect(getProductSelectionStrategyConfig("relevance/intent-themes@5"))
      .toMatchObject({ productSemanticGrouping: true });

    expect(
      getProductSelectionStrategyConfig("category-role/landing-page-agent@1"),
    ).toMatchObject({
      schemaVersion: "product-selection-strategy/v1",
      categoryRoles: {
        total: 10,
        target: { core: 5, pairing: 3, accessory: 2 },
      },
      retrieval: {
        perCategory: { limit: 100, sort: "featured" },
        discoveryPool: { limit: 200, sort: "sold" },
      },
      dedupePriority: [
        "start-here",
        "popular-picks",
        "brand-spotlight",
        "explore-more",
      ],
    });
  });

  it("keeps the complete eligible pool while preserving the legacy four-to-eight replay limit", () => {
    const categories = [
      { id: "102", label: "Sheet Masks", evidenceCount: 4 },
      { id: "101", label: "Serums", evidenceCount: 10 },
      { id: "103", label: "Toning Pads", evidenceCount: 3 },
    ];
    const products = [
      ...Array.from({ length: 10 }, (_, index) => ({
        id: `serum-${index + 1}`,
        title: `ANUA Serum ${index + 1}`,
        brand: "ANUA",
        price: "$20.00",
        imageUrl: `https://example.com/serum-${index + 1}.webp`,
        productUrl: `https://example.com/serum-${index + 1}`,
        sourceRank: index + 1,
        categoryL3Id: 101,
        categoryL3Name: "Serums",
      })),
      ...Array.from({ length: 4 }, (_, index) => ({
        id: `mask-${index + 1}`,
        title: `ANUA Sheet Mask ${index + 1}`,
        brand: "ANUA",
        price: "$6.00",
        imageUrl: `https://example.com/mask-${index + 1}.webp`,
        productUrl: `https://example.com/mask-${index + 1}`,
        sourceRank: index + 11,
        categoryL3Id: 102,
        categoryL3Name: "Sheet Masks",
      })),
      ...Array.from({ length: 3 }, (_, index) => ({
        id: `pad-${index + 1}`,
        title: `ANUA Toning Pad ${index + 1}`,
        brand: "ANUA",
        price: "$18.00",
        imageUrl: `https://example.com/pad-${index + 1}.webp`,
        productUrl: `https://example.com/pad-${index + 1}`,
        sourceRank: index + 15,
        categoryL3Id: 103,
        categoryL3Name: "Toning Pads",
      })),
    ];
    const run = advanceProductSelectionRun({
      snapshot: {
        keyword: "ANUA",
        site: "us",
        sourceUrl: "https://example.com/search?q=ANUA",
        fetchedAt: "2026-08-19T00:00:00.000Z",
        provider: "yami-catalog-search",
        products,
        intent: brandIntent(categories),
      },
      strategyRef: "relevance/intent-themes@2",
    });

    expect(run.status).toBe("ready");
    if (run.status !== "ready") return;
    expect(run.result.selectedCategories.map(({ id }) => id)).toEqual(["102", "101"]);
    expect(run.result.pools.primaryIds).toEqual([
      "mask-1", "mask-2", "mask-3", "mask-4",
      "serum-1", "serum-2", "serum-3", "serum-4",
      "serum-5", "serum-6", "serum-7", "serum-8",
      "serum-9", "serum-10",
      "pad-1", "pad-2", "pad-3",
    ]);
    expect(run.result.modules.find(({ id }) => id === "start-here")?.groups)
      .toEqual([
        { id: "theme-102", label: "Sheet Masks", role: "core", productIds: ["mask-1", "mask-2", "mask-3", "mask-4"] },
        { id: "theme-101", label: "Serums", role: "core", productIds: ["serum-1", "serum-2", "serum-3", "serum-4", "serum-5", "serum-6", "serum-7", "serum-8"] },
      ]);
  });

  it("compiles merged shopper-facing groups while preserving complete product coverage", () => {
    const baseIntent = brandIntent([
      { id: "101", label: "Serums", evidenceCount: 6 },
      { id: "102", label: "Sheet Masks", evidenceCount: 5 },
      { id: "103", label: "Cleansers", evidenceCount: 5 },
      { id: "104", label: "Toners", evidenceCount: 4 },
    ]);
    const intent: NonNullable<YamiSearchSnapshot["intent"]> = {
      ...baseIntent,
      categoryHypotheses: [
        {
          label: "Daily cleansing",
          role: "core",
          categoryIds: ["103"],
          evidenceIds: ["catalog-category:103"],
          reason: "A verified daily-use category.",
        },
        {
          label: "Targeted care",
          role: "pairing",
          categoryIds: ["101", "104"],
          evidenceIds: ["catalog-category:101", "catalog-category:104"],
          reason: "Verified treatment categories.",
        },
        {
          label: "Mask moments",
          role: "accessory",
          categoryIds: ["102"],
          evidenceIds: ["catalog-category:102"],
          reason: "A verified mask category.",
        },
      ],
      scenarioHypotheses: [
        {
          name: "Simple daily routine",
          shoppingGoal: "Build a cleanser and toner routine.",
          categoryIds: ["103", "104"],
          evidenceIds: ["catalog-category:103", "catalog-category:104"],
          reason: "Two verified routine steps.",
        },
        {
          name: "Focused treatment",
          shoppingGoal: "Pair a serum with a mask.",
          categoryIds: ["101", "102"],
          evidenceIds: ["catalog-category:101", "catalog-category:102"],
          reason: "Two verified treatment categories.",
        },
      ],
    };
    const categoryProducts = (categoryId: number, label: string, count: number, rank: number) =>
      Array.from({ length: count }, (_, index) => ({
        id: `${categoryId}-${index + 1}`,
        title: `ANUA ${label} ${index + 1}`,
        brand: "ANUA",
        price: "$20.00",
        imageUrl: `https://example.com/${categoryId}-${index + 1}.webp`,
        productUrl: `https://example.com/${categoryId}-${index + 1}`,
        sourceRank: rank + index,
        categoryL3Id: categoryId,
        categoryL3Name: label,
      }));
    const products = [
      ...categoryProducts(101, "Serums", 6, 1),
      ...categoryProducts(102, "Sheet Masks", 5, 7),
      ...categoryProducts(103, "Cleansers", 5, 12),
      ...categoryProducts(104, "Toners", 4, 17),
    ];
    const run = advanceProductSelectionRun({
      snapshot: {
        keyword: "ANUA",
        site: "us",
        sourceUrl: "https://example.com/search?q=ANUA",
        fetchedAt: "2026-08-20T00:00:00.000Z",
        provider: "yami-catalog-search",
        products,
        intent,
      },
      strategyRef: "relevance/intent-themes@5",
    });

    expect(run.status).toBe("ready");
    if (run.status !== "ready") return;
    expect(run.result.pools.primaryIds).toEqual(products.map(({ id }) => id));
    expect(run.result.modules.find(({ id }) => id === "shortcuts")?.groups)
      .toEqual([
        {
          id: "category-hypothesis-1",
          label: "Daily cleansing",
          role: "core",
          productIds: ["103-1", "103-2", "103-3", "103-4", "103-5"],
          sourceCategoryIds: ["103"],
          classificationReason: "A verified daily-use category.",
          semanticSource: "agent-proposal",
        },
        {
          id: "category-hypothesis-2",
          label: "Targeted care",
          role: "pairing",
          productIds: [
            "101-1", "101-2", "101-3", "101-4", "101-5", "101-6",
            "104-1", "104-2", "104-3", "104-4",
          ],
          sourceCategoryIds: ["101", "104"],
          classificationReason: "Verified treatment categories.",
          semanticSource: "agent-proposal",
        },
        {
          id: "category-hypothesis-3",
          label: "Mask moments",
          role: "accessory",
          productIds: ["102-1", "102-2", "102-3", "102-4", "102-5"],
          sourceCategoryIds: ["102"],
          classificationReason: "A verified mask category.",
          semanticSource: "agent-proposal",
        },
      ]);
    expect(run.result.modules.find(({ id }) => id === "start-here")?.groups)
      .toEqual([
        {
          id: "scenario-hypothesis-1",
          label: "Simple daily routine",
          role: "core",
          productIds: [
            "103-1", "103-2", "103-3", "103-4", "103-5",
            "104-1", "104-2", "104-3", "104-4",
          ],
          sourceCategoryIds: ["103", "104"],
          shoppingGoal: "Build a cleanser and toner routine.",
          scenarioReason: "Two verified routine steps.",
          semanticSource: "agent-proposal",
        },
        {
          id: "scenario-hypothesis-2",
          label: "Focused treatment",
          role: "core",
          productIds: [
            "101-1", "101-2", "101-3", "101-4", "101-5", "101-6",
            "102-1", "102-2", "102-3", "102-4", "102-5",
          ],
          sourceCategoryIds: ["101", "102"],
          shoppingGoal: "Pair a serum with a mask.",
          scenarioReason: "Two verified treatment categories.",
          semanticSource: "agent-proposal",
        },
      ]);
    expect(run.result.modules.find(({ id }) => id === "popular-picks"))
      .toMatchObject({
        productIds: [
          "101-1", "101-2", "101-3", "101-4", "101-5", "101-6",
          "102-1", "102-2", "102-3", "102-4", "102-5", "103-1",
          "104-1", "104-2", "104-3", "104-4",
        ],
        groups: [
          expect.objectContaining({
            id: "popular-picks-all",
            productIds: [
              "101-1", "101-2", "101-3", "101-4", "101-5", "101-6",
              "102-1", "102-2", "102-3", "102-4", "102-5", "103-1",
            ],
          }),
          expect.objectContaining({
            id: "category-hypothesis-2",
            productIds: [
              "101-1", "101-2", "101-3", "101-4", "101-5", "101-6",
              "104-1", "104-2", "104-3", "104-4",
            ],
          }),
        ],
      });
    expect(run.result.modules.find(({ id }) => id === "explore-more"))
      .toMatchObject({
        productIds: products.map(({ id }) => id),
        groups: run.result.modules.find(({ id }) => id === "shortcuts")?.groups,
      });
    expect(run.result.scenes).toEqual([
      expect.objectContaining({
        id: "scenario-hypothesis-1",
        name: "Simple daily routine",
        title: "Build a cleanser and toner routine.",
        description: "Two verified routine steps.",
      }),
      expect.objectContaining({
        id: "scenario-hypothesis-2",
        name: "Focused treatment",
        title: "Pair a serum with a mask.",
        description: "Two verified treatment categories.",
      }),
    ]);
  });

  it("recovers verified category context when an ambiguous intent would leave one primary product", () => {
    const categories = [
      { id: "1499", label: "Tea Bags", evidenceCount: 12 },
      { id: "1498", label: "Tea Drinks", evidenceCount: 2 },
      { id: "1501", label: "Instant Tea & Concentrate", evidenceCount: 1 },
      { id: "1607", label: "Wellness Teas & Soups", evidenceCount: 1 },
    ];
    const baseIntent = brandIntent(categories);
    const intent: NonNullable<YamiSearchSnapshot["intent"]> = {
      ...baseIntent,
      themeType: "product",
      catalogDomain: "Beverage",
      entityType: "category",
      canonicalEntity: { id: "1501", label: "Instant Tea & Concentrate" },
      shoppingIntent: "find-product",
      shopperAction: "filter",
      shoppingGoal: "Find products matching Heytea.",
      needs: categories.map(({ label }) => label),
      conditions: ["heytea"],
      mustInclude: ["Instant Tea & Concentrate"],
      searchTerms: ["Heytea", ...categories.map(({ label }) => label)],
      constraints: [
        {
          id: "core-entity:instant-tea-concentrate",
          kind: "core-entity",
          value: "Instant Tea & Concentrate",
          status: "verified",
          evidenceIds: ["catalog-category:1501"],
        },
        {
          id: "modifier:heytea",
          kind: "modifier",
          value: "heytea",
          status: "unverified",
          evidenceIds: [],
        },
      ],
      categoryHypotheses: [
        {
          label: "Tea bags and floral tea",
          role: "core",
          categoryIds: ["1499", "1607"],
          evidenceIds: ["catalog-category:1499", "catalog-category:1607"],
          reason: "Verified brewed tea categories.",
        },
        {
          label: "Ready-to-drink tea",
          role: "core",
          categoryIds: ["1498"],
          evidenceIds: ["catalog-category:1498"],
          reason: "Verified bottled tea category.",
        },
        {
          label: "Instant tea",
          role: "core",
          categoryIds: ["1501"],
          evidenceIds: ["catalog-category:1501"],
          reason: "Verified instant tea category.",
        },
      ],
      decision: {
        ...baseIntent.decision,
        status: "ambiguous",
        selectedCandidateId: "product:category:1501:find-product:filter",
        evidenceLevel: "medium",
        selectedCandidateMargin: 0.01,
        requiresAgentReview: true,
      },
      reason: "The selected category narrowly leads a competing interpretation.",
      confidence: 0.75,
    };
    const products = categories.flatMap((category, categoryIndex) =>
      Array.from({ length: category.evidenceCount }, (_, productIndex) => ({
        id: `${category.id}-${productIndex + 1}`,
        title: `HEYTEA ${category.label} ${productIndex + 1}`,
        brand: "HEYTEA",
        brandId: 7535,
        price: "$10.00",
        imageUrl: `https://example.com/${category.id}-${productIndex + 1}.webp`,
        productUrl: `https://example.com/${category.id}-${productIndex + 1}`,
        sourceRank: categoryIndex * 20 + productIndex + 1,
        categoryL3Id: Number(category.id),
        categoryL3Name: category.label,
      }))
    );

    const snapshot: YamiSearchSnapshot = {
      keyword: "Heytea",
      site: "us",
      sourceUrl: "https://example.com/search?q=Heytea",
      fetchedAt: "2026-08-25T00:00:00.000Z",
      provider: "yami-catalog-search",
      products,
      intent,
    };
    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "relevance/intent-themes@5",
    });

    expect(run.status).toBe("ready");
    if (run.status !== "ready") return;
    expect(run.result.pools.primaryIds).toEqual(products.map(({ id }) => id));
    expect(run.result.pools.relatedIds).toEqual([]);
    expect(run.result.diagnostics).toEqual({
      candidateCount: 16,
      directMatchCount: 1,
      primaryCount: 16,
      relatedCount: 0,
      recoveryStrategy: "verified-category-context",
    });
    expect(run.result.modules.find(({ id }) => id === "shortcuts")?.groups)
      .toHaveLength(3);
    expect(buildTopicPagePlanFromProductSelection(snapshot, run.result, "zh")
      .selectionDiagnostics).toEqual(run.result.diagnostics);
  });

  it("keeps a genuine single-product category without inventing recovery products", () => {
    const baseIntent = brandIntent([
      { id: "1501", label: "Instant Tea & Concentrate", evidenceCount: 1 },
    ]);
    const intent: NonNullable<YamiSearchSnapshot["intent"]> = {
      ...baseIntent,
      themeType: "product",
      entityType: "category",
      canonicalEntity: { id: "1501", label: "Instant Tea & Concentrate" },
      shoppingIntent: "find-product",
      shopperAction: "find",
      decision: {
        ...baseIntent.decision,
        status: "needs-review",
        requiresAgentReview: true,
      },
    };
    const run = advanceProductSelectionRun({
      snapshot: {
        keyword: "Instant Tea & Concentrate",
        site: "us",
        sourceUrl: "https://example.com/search?q=instant+tea",
        fetchedAt: "2026-08-25T00:00:00.000Z",
        provider: "yami-catalog-search",
        products: [{
          id: "instant-tea-1",
          title: "Instant Tea & Concentrate",
          brand: "Tea Brand",
          price: "$10.00",
          imageUrl: "https://example.com/instant-tea-1.webp",
          productUrl: "https://example.com/instant-tea-1",
          sourceRank: 1,
          categoryL3Id: 1501,
          categoryL3Name: "Instant Tea & Concentrate",
        }],
        intent,
      },
      strategyRef: "relevance/intent-themes@5",
    });

    expect(run).toMatchObject({
      status: "ready",
      result: {
        pools: { primaryIds: ["instant-tea-1"], relatedIds: [] },
        diagnostics: {
          candidateCount: 1,
          directMatchCount: 1,
          primaryCount: 1,
          relatedCount: 0,
          recoveryStrategy: "none",
        },
      },
    });
  });

  it("requests an Agent product-semantic proposal when one catalog leaf cannot form useful themes", () => {
    const products = [
      ...Array.from({ length: 4 }, (_, index) => ({
        id: `powder-${index + 1}`,
        title: `Ceremonial matcha powder ${index + 1}`,
        brand: "Tea House",
        price: "$20.00",
        imageUrl: `https://example.com/powder-${index + 1}.webp`,
        productUrl: `https://example.com/powder-${index + 1}`,
        sourceRank: index + 1,
        categoryL3Id: 1691,
        categoryL3Name: "Matcha",
      })),
      ...Array.from({ length: 4 }, (_, index) => ({
        id: `latte-${index + 1}`,
        title: `Matcha latte mix ${index + 1}`,
        brand: "Cafe Brand",
        price: "$12.00",
        imageUrl: `https://example.com/latte-${index + 1}.webp`,
        productUrl: `https://example.com/latte-${index + 1}`,
        sourceRank: index + 5,
        categoryL3Id: 1691,
        categoryL3Name: "Matcha",
      })),
      ...Array.from({ length: 4 }, (_, index) => ({
        id: `snack-${index + 1}`,
        title: `Matcha snack ${index + 1}`,
        brand: "Snack Brand",
        price: "$8.00",
        imageUrl: `https://example.com/snack-${index + 1}.webp`,
        productUrl: `https://example.com/snack-${index + 1}`,
        sourceRank: index + 9,
        categoryL3Id: 1691,
        categoryL3Name: "Matcha",
      })),
    ];
    const intent: NonNullable<YamiSearchSnapshot["intent"]> = {
      ...brandIntent([{ id: "1691", label: "Matcha", evidenceCount: products.length }]),
      themeType: "product",
      catalogDomain: "Beverage",
      entityType: "category",
      canonicalEntity: { id: "1691", label: "Matcha" },
      shoppingIntent: "find-product",
      shopperAction: "browse",
      shoppingGoal: "Browse matcha products.",
      mustInclude: ["Matcha"],
      reason: "The catalog category exactly matches the keyword.",
    };
    const snapshot: YamiSearchSnapshot = {
      keyword: "Matcha",
      site: "us",
      sourceUrl: "https://example.com/search?q=Matcha",
      fetchedAt: "2026-08-20T00:00:00.000Z",
      provider: "yami-catalog-search",
      products,
      intent,
    };

    const pending = advanceProductSelectionRun({
      snapshot,
      strategyRef: "relevance/intent-themes@5",
    });

    expect(pending).toMatchObject({
      status: "needs-product-semantic-proposal",
      context: {
        keyword: "Matcha",
        minimumGroups: 2,
        products: { length: 12 },
      },
    });

    const ready = advanceProductSelectionRun({
      snapshot,
      strategyRef: "relevance/intent-themes@5",
      productSemanticProposal: {
        schemaVersion: "product-semantic-proposal/v1",
        keyword: "Matcha",
        strategyRef: "relevance/intent-themes@5",
        groups: [
          {
            id: "pure-matcha",
            label: "Pure matcha powder",
            productIds: [
              ...products.slice(0, 4).map(({ id }) => id),
              products[0]!.id,
            ],
            reason: "Product titles identify ceremonial matcha powder.",
          },
          {
            id: "matcha-latte",
            label: "Matcha latte",
            productIds: products.slice(4, 8).map(({ id }) => id),
            reason: "Product titles identify latte mixes.",
          },
          {
            id: "matcha-snacks",
            label: "Matcha snacks",
            productIds: products.slice(8, 11).map(({ id }) => id),
            reason: "Product titles identify snack products.",
          },
        ],
        scenes: [
          {
            id: "daily-matcha",
            name: "Daily matcha",
            shoppingGoal: "Choose matcha for a daily drink.",
            groupIds: ["pure-matcha"],
            reason: "Powder and latte products support daily preparation.",
          },
          {
            id: "matcha-treats",
            name: "Matcha treats",
            shoppingGoal: "Choose matcha snacks and treats.",
            groupIds: ["matcha-latte", "matcha-snacks"],
            reason: "Snack products support a distinct treat occasion.",
          },
        ],
      },
    });

    expect(ready.status).toBe("ready");
    if (ready.status !== "ready") return;
    expect(ready.productSemanticProposalReview?.status).toBe("accepted");
    expect(ready.productSemanticProposalReview?.warnings).toHaveLength(2);
    expect(ready.result.modules.find(({ id }) => id === "shortcuts")?.groups)
      .toHaveLength(4);
    expect(ready.result.modules.find(({ id }) => id === "start-here")?.groups)
      .toHaveLength(2);
    expect(
      ready.result.modules.find(({ id }) => id === "shortcuts")?.groups
        .flatMap(({ productIds }) => productIds),
    ).toEqual(products.map(({ id }) => id));
  });

  it("keeps every verified category group in Shortcuts and the recommendation tabs", () => {
    const categories = Array.from({ length: 7 }, (_, index) => ({
      id: String(101 + index),
      label: `Category ${index + 1}`,
      evidenceCount: 4,
    }));
    const intent: NonNullable<YamiSearchSnapshot["intent"]> = {
      ...brandIntent(categories),
      categoryHypotheses: categories.map((category, index) => ({
        label: `Navigation ${index + 1}`,
        role: "core",
        categoryIds: [category.id],
        evidenceIds: [`catalog-category:${category.id}`],
        reason: "Verified catalog navigation group.",
      })),
      scenarioHypotheses: [],
    };
    const products = categories.flatMap((category, categoryIndex) =>
      Array.from({ length: 4 }, (_, productIndex) => ({
        id: `${category.id}-${productIndex + 1}`,
        title: `ANUA ${category.label} ${productIndex + 1}`,
        brand: "ANUA",
        price: "$20.00",
        imageUrl: `https://example.com/${category.id}-${productIndex + 1}.webp`,
        productUrl: `https://example.com/${category.id}-${productIndex + 1}`,
        sourceRank: categoryIndex * 4 + productIndex + 1,
        categoryL3Id: Number(category.id),
        categoryL3Name: category.label,
      }))
    );
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: "https://example.com/search?q=ANUA",
      fetchedAt: "2026-08-20T00:00:00.000Z",
      provider: "yami-catalog-search",
      products,
      intent,
    };

    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "relevance/intent-themes@4",
    });

    expect(run.status).toBe("ready");
    if (run.status !== "ready") return;
    const plan = buildTopicPagePlanFromProductSelection(snapshot, run.result, "zh", "selection");
    const shortcutGroups = plan.modules.find(({ id }) => id === "shortcuts")?.groups ?? [];
    const recommendationGroups = plan.modules.find(({ id }) => id === "explore-more")?.groups ?? [];
    expect(shortcutGroups).toHaveLength(7);
    expect(recommendationGroups.map(({ id }) => id)).toEqual(
      shortcutGroups.map(({ id }) => id),
    );
  });

  it("keeps small groups and restores omitted or uncategorized products in Shortcuts", () => {
    const categories = [
      { id: "101", label: "Serums", evidenceCount: 2 },
      { id: "102", label: "Sheet Masks", evidenceCount: 1 },
      { id: "103", label: "Toners", evidenceCount: 4 },
    ];
    const intent: NonNullable<YamiSearchSnapshot["intent"]> = {
      ...brandIntent(categories),
      categoryHypotheses: [
        {
          label: "Targeted care",
          role: "core",
          categoryIds: ["101"],
          evidenceIds: ["catalog-category:101"],
          reason: "Verified serum group.",
        },
        {
          label: "Mask care",
          role: "pairing",
          categoryIds: ["102"],
          evidenceIds: ["catalog-category:102"],
          reason: "Verified mask group.",
        },
      ],
      scenarioHypotheses: [],
    };
    const products = [
      ...Array.from({ length: 2 }, (_, index) => ({
        id: `101-${index + 1}`,
        title: `ANUA Serum ${index + 1}`,
        brand: "ANUA",
        price: "$20.00",
        imageUrl: `https://example.com/101-${index + 1}.webp`,
        productUrl: `https://example.com/101-${index + 1}`,
        sourceRank: index + 1,
        categoryL3Id: 101,
        categoryL3Name: "Serums",
      })),
      {
        id: "102-1",
        title: "ANUA Sheet Mask",
        brand: "ANUA",
        price: "$20.00",
        imageUrl: "https://example.com/102-1.webp",
        productUrl: "https://example.com/102-1",
        sourceRank: 3,
        categoryL3Id: 102,
        categoryL3Name: "Sheet Masks",
      },
      ...Array.from({ length: 4 }, (_, index) => ({
        id: `103-${index + 1}`,
        title: `ANUA Toner ${index + 1}`,
        brand: "ANUA",
        price: "$20.00",
        imageUrl: `https://example.com/103-${index + 1}.webp`,
        productUrl: `https://example.com/103-${index + 1}`,
        sourceRank: index + 4,
        categoryL3Id: 103,
        categoryL3Name: "Toners",
      })),
      {
        id: "uncategorized-1",
        title: "ANUA Limited Product",
        brand: "ANUA",
        price: "$20.00",
        imageUrl: "https://example.com/uncategorized-1.webp",
        productUrl: "https://example.com/uncategorized-1",
        sourceRank: 8,
      },
    ];
    const run = advanceProductSelectionRun({
      snapshot: {
        keyword: "ANUA",
        site: "us",
        sourceUrl: "https://example.com/search?q=ANUA",
        fetchedAt: "2026-08-20T00:00:00.000Z",
        provider: "yami-catalog-search",
        products,
        intent,
      },
      strategyRef: "relevance/intent-themes@4",
    });

    expect(run.status).toBe("ready");
    if (run.status !== "ready") return;
    const shortcutGroups = run.result.modules.find(({ id }) => id === "shortcuts")?.groups ?? [];
    expect(shortcutGroups).toEqual([
      {
        id: "category-hypothesis-1",
        label: "Targeted care",
        role: "core",
        productIds: ["101-1", "101-2"],
        sourceCategoryIds: ["101"],
        classificationReason: "Verified serum group.",
        semanticSource: "agent-proposal",
      },
      {
        id: "category-hypothesis-2",
        label: "Mask care",
        role: "pairing",
        productIds: ["102-1"],
        sourceCategoryIds: ["102"],
        classificationReason: "Verified mask group.",
        semanticSource: "agent-proposal",
      },
      {
        id: "theme-103",
        label: "Toners",
        role: "core",
        productIds: ["103-1", "103-2", "103-3", "103-4"],
        sourceCategoryIds: ["103"],
        semanticSource: "catalog-fallback",
      },
      {
        id: "theme-more-to-explore",
        label: "More to Explore",
        role: "core",
        productIds: ["uncategorized-1"],
        sourceCategoryIds: [],
      },
    ]);
    const groupedIds = shortcutGroups.flatMap(({ productIds }) => productIds);
    expect(groupedIds).toHaveLength(run.result.pools.primaryIds.length);
    expect(new Set(groupedIds)).toEqual(new Set(run.result.pools.primaryIds));
  });

  it("supplements an incomplete semantic proposal with verified catalog categories", () => {
    const intent: NonNullable<YamiSearchSnapshot["intent"]> = {
      ...brandIntent([
        { id: "101", label: "Serums", evidenceCount: 4 },
        { id: "102", label: "Sheet Masks", evidenceCount: 4 },
      ]),
      categoryHypotheses: [{
        label: "Too small",
        role: "core",
        categoryIds: ["101"],
        evidenceIds: ["catalog-category:101"],
        reason: "Only one proposed group.",
      }],
      scenarioHypotheses: [],
    };
    const products = [101, 102].flatMap((categoryId, categoryIndex) =>
      Array.from({ length: 4 }, (_, index) => ({
        id: `${categoryId}-${index + 1}`,
        title: `ANUA Product ${categoryId}-${index + 1}`,
        brand: "ANUA",
        price: "$20.00",
        imageUrl: `https://example.com/${categoryId}-${index + 1}.webp`,
        productUrl: `https://example.com/${categoryId}-${index + 1}`,
        sourceRank: categoryIndex * 4 + index + 1,
        categoryL3Id: categoryId,
        categoryL3Name: categoryId === 101 ? "Serums" : "Sheet Masks",
      })),
    );
    const run = advanceProductSelectionRun({
      snapshot: {
        keyword: "ANUA",
        site: "us",
        sourceUrl: "https://example.com/search?q=ANUA",
        fetchedAt: "2026-08-20T00:00:00.000Z",
        provider: "yami-catalog-search",
        products,
        intent,
      },
      strategyRef: "relevance/intent-themes@4",
    });

    expect(run.status).toBe("ready");
    if (run.status !== "ready") return;
    expect(run.result.modules.find(({ id }) => id === "shortcuts")?.groups)
      .toEqual([
        {
          id: "category-hypothesis-1",
          label: "Too small",
          role: "core",
          productIds: ["101-1", "101-2", "101-3", "101-4"],
          sourceCategoryIds: ["101"],
          classificationReason: "Only one proposed group.",
          semanticSource: "agent-proposal",
        },
        {
          id: "theme-102",
          label: "Sheet Masks",
          role: "core",
          productIds: ["102-1", "102-2", "102-3", "102-4"],
          sourceCategoryIds: ["102"],
          semanticSource: "catalog-fallback",
        },
      ]);
    expect(run.result.modules.find(({ id }) => id === "start-here")?.groups)
      .toEqual([
        {
          id: "theme-101",
          label: "Serums",
          role: "core",
          productIds: ["101-1", "101-2", "101-3", "101-4"],
          sourceCategoryIds: ["101"],
          semanticSource: "catalog-fallback",
        },
        {
          id: "theme-102",
          label: "Sheet Masks",
          role: "core",
          productIds: ["102-1", "102-2", "102-3", "102-4"],
          sourceCategoryIds: ["102"],
          semanticSource: "catalog-fallback",
        },
      ]);
  });

  it("retrieves every page for an exact catalog brand before theme display limits are applied", async () => {
    const intent = brandIntent([
      { id: "101", label: "Serums", evidenceCount: 3 },
      { id: "102", label: "Sheet Masks", evidenceCount: 2 },
    ]);
    const item = (id: string, categoryId: number) => ({
      item_number: id,
      goods_ename: `ANUA Product ${id}`,
      brand_id: 11712,
      brand_ename: "ANUA",
      category_l1_id: 5,
      category_l2_id: 50,
      category_l3_id: categoryId,
      image_url: `/item/${id}.webp`,
      slug: `anua-${id}`,
      status: "A",
      goods_number: 10,
    });
    const pages = [
      [item("a1", 101), item("a2", 101)],
      [item("a3", 101), item("b1", 102)],
      [item("b2", 102)],
    ];
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as {
        brand_ids?: string;
        page_index: number;
        page_size: number;
      };
      expect(request.brand_ids).toBe("11712");
      expect(request.page_size).toBe(2);
      return Response.json({
        messageId: "10000",
        body: {
          page: {
            total: 5,
            page_index: request.page_index,
            page_size: request.page_size,
            hasNext: request.page_index < pages.length,
          },
          items: pages[request.page_index - 1],
        },
      });
    });
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: "https://example.com/search?q=ANUA",
      fetchedAt: "2026-08-19T00:00:00.000Z",
      provider: "yami-catalog-search",
      products: [],
      evidence: {
        brands: [{ id: "11712", label: "ANUA", aliases: ["ANUA"], resultCount: 2 }],
        categories: [],
        attributes: [],
      },
      intent,
    };

    const refined = await refineYamiCatalogSnapshotForIntent(snapshot, intent, {
      fetch: fetchMock as typeof fetch,
      pageSize: 2,
    });

    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(3);
    expect(refined.products.map(({ id }) => id)).toEqual(["a1", "a2", "a3", "b1", "b2"]);
    expect(refined.evidence?.brands[0]?.resultCount).toBe(5);
    expect(refined.retrievalTerms).toContain("brand:11712");
    expect(refined.catalogRefinement).toMatchObject({
      status: "fallback",
      target: "brand",
      completedKeys: ["structured-brand:11712"],
      failedKeys: ["brand-page:11712"],
    });
  });

  it("loads complete brand coverage and sorts products by weekly sales", async () => {
    const item = (
      id: string,
      sellerType: 0 | 1,
      goodsNumber: number,
      soldCount: number,
      weeklyQuantity?: string,
    ) => ({
      item_number: id,
      goods_ename: `Beauty Product ${id}`,
      brand_id: 10757,
      brand_ename: "Beauty of Joseon",
      image_url: `/item/${id}.webp`,
      slug: `beauty-product-${id}`,
      shop_price: 19.99,
      status: "A",
      goods_number: goodsNumber,
      sold_count: soldCount,
      seller_type: sellerType,
      seller_name: sellerType === 0 ? "亚米自营" : "第三方店铺",
      seller_ename: sellerType === 0 ? "YAMI" : "Marketplace seller",
      weekly_qty: weeklyQuantity ?? "",
    });
    const pages = [
      [item("yami-low", 0, 1, 10, "300+"), item("third-oos", 1, 0, 80)],
      [item("yami-high", 0, 1, 100, "100+"), item("third-high", 1, 1, 90, "100+")],
      [item("yami-oos", 0, 0, 70, "20+"), item("third-low", 1, 1, 20)],
    ];
    const encode = (value: unknown) => JSON.stringify(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;");
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      const page = Number(url.searchParams.get("page") ?? "1");
      return new Response(
        `<input id="itemsData" type="hidden" value="${encode(pages[page - 1])}">` +
        `<input id="pageData" type="hidden" value="${encode({
          all_item_count: 6,
          page_index: page,
          page_size: 2,
          page_count: 3,
          hasNext: page < 3,
        })}">`,
      );
    });

    const coverage = await loadYamiBrandCatalogCoverage(
      { id: "10757", label: "Beauty of Joseon" },
      { fetch: fetchMock as typeof fetch },
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(coverage.totalCount).toBe(6);
    expect(coverage.sort).toBe("weekly-sales-descending");
    expect(coverage.products.map(({ id }) => id)).toEqual([
      "yami-low", "yami-high", "third-high", "yami-oos", "third-oos", "third-low",
    ]);
    expect(coverage.groups).toEqual({
      yami: { inStock: 2, outOfStock: 1 },
      thirdParty: { inStock: 2, outOfStock: 1 },
    });
    expect(coverage.products.find(({ id }) => id === "yami-high")).toMatchObject({
      sellerKind: "yami",
      availability: "in-stock",
      weeklySalesLabel: "100+ Sold",
    });
  });

  it("uses all in-stock brand-page products for selection while preserving out-of-stock coverage", async () => {
    const intent = brandIntent([]);
    const item = (id: string, goodsNumber: number, soldCount: number, sellerType = 0) => ({
      item_number: id,
      goods_ename: `ANUA Product ${id}`,
      brand_id: 11712,
      brand_ename: "ANUA",
      image_url: `/item/${id}.webp`,
      slug: `anua-${id}`,
      shop_price: 19.99,
      status: "A",
      goods_number: goodsNumber,
      sold_count: soldCount,
      weekly_qty: `${soldCount}+`,
      seller_type: sellerType,
      seller_ename: sellerType === 0 ? "YAMI" : "Marketplace seller",
    });
    const brandItems = [
      item("yami-low", 1, 5),
      item("third-high", 1, 80, 1),
      item("yami-high", 1, 100),
      item("third-oos", 0, 90, 1),
    ];
    const encode = (value: unknown) => JSON.stringify(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;");
    const fetchMock = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      if (init?.method === "POST") {
        const request = JSON.parse(String(init.body)) as { sort_by: number };
        expect(request.sort_by).toBe(6);
        return Response.json({
          messageId: "10000",
          body: {
            page: { total: 2, page_index: 1, page_size: 60, hasNext: false },
            items: [brandItems[0], brandItems[1]],
          },
        });
      }
      return new Response(
        `<input id="itemsData" value="${encode(brandItems)}">` +
        `<input id="pageData" value="${encode({ page_count: 1, all_item_count: 4 })}">`,
      );
    });
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: "https://example.com/search?q=ANUA",
      fetchedAt: "2026-08-19T00:00:00.000Z",
      provider: "yami-catalog-search",
      products: [],
      intent,
    };

    const refined = await refineYamiCatalogSnapshotForIntent(snapshot, intent, {
      fetch: fetchMock as typeof fetch,
    });

    expect(refined.products.map(({ id }) => id)).toEqual([
      "yami-high", "third-high", "yami-low",
    ]);
    expect(refined.catalogCoverage?.products).toHaveLength(4);
    expect(refined.catalogCoverage?.groups.thirdParty).toEqual({
      inStock: 1,
      outOfStock: 1,
    });
    expect(refined.quality).toMatchObject({
      observedProductCount: 4,
      acceptedProductCount: 3,
      rejectedProductCount: 1,
    });
    expect(refined.catalogRefinement).toMatchObject({
      status: "complete",
      target: "brand",
      completedKeys: ["structured-brand:11712", "brand-page:11712"],
      failedKeys: [],
    });
  });

  it("paginates every ThemeIntent category while leaving four-to-sixteen limits to display themes", async () => {
    const categories = [
      { id: "101", label: "Serums", evidenceCount: 1 },
      { id: "102", label: "Sheet Masks", evidenceCount: 1 },
    ];
    const intent: NonNullable<YamiSearchSnapshot["intent"]> = {
      ...brandIntent(categories),
      themeType: "product",
      entityType: "unknown",
      canonicalEntity: null,
      shoppingIntent: "find-product",
      shopperAction: "find",
      shoppingGoal: "Find products across verified categories.",
      decision: {
        ...brandIntent(categories).decision,
        selectedCandidateId: "product:unknown:verified-categories:find-product:find",
      },
    };
    const item = (categoryId: number, id: string) => ({
      item_number: id,
      goods_ename: `ANUA Product ${id}`,
      brand_ename: "ANUA",
      category_l1_id: 5,
      category_l2_id: 50,
      category_l3_id: categoryId,
      image_url: `/item/${id}.webp`,
      slug: `anua-${id}`,
      status: "A",
      goods_number: 10,
    });
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as {
        category_ids: string;
        page_index: number;
      };
      const categoryId = Number(request.category_ids);
      const ids = categoryId === 101
        ? request.page_index === 1 ? ["a1", "a2", "a3"] : ["a4", "a5"]
        : ["b1", "b2", "b3", "b4"];
      return Response.json({
        messageId: "10000",
        body: {
          page: {
            total: categoryId === 101 ? 5 : 4,
            page_index: request.page_index,
            page_size: 3,
            hasNext: categoryId === 101 && request.page_index === 1,
          },
          items: ids.map((id) => item(categoryId, id)),
        },
      });
    });
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: "https://example.com/search?q=ANUA",
      fetchedAt: "2026-08-19T00:00:00.000Z",
      provider: "yami-catalog-search",
      products: [],
      intent,
    };

    const refined = await refineYamiCatalogSnapshotForIntent(snapshot, intent, {
      fetch: fetchMock as typeof fetch,
      pageSize: 3,
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refined.products.filter(({ categoryL3Id }) => categoryL3Id === 101))
      .toHaveLength(5);
    expect(refined.products.filter(({ categoryL3Id }) => categoryL3Id === 102))
      .toHaveLength(4);
    expect(refined.catalogRefinement).toMatchObject({
      status: "complete",
      target: "categories",
      completedKeys: ["category:101", "category:102"],
      failedKeys: [],
    });
  });

  it("marks category refinement partial instead of hiding a failed category page", async () => {
    const categories = [
      { id: "101", label: "Serums", evidenceCount: 4 },
      { id: "102", label: "Toners", evidenceCount: 4 },
    ];
    const intent: NonNullable<YamiSearchSnapshot["intent"]> = {
      ...brandIntent(categories),
      themeType: "product",
      entityType: "unknown",
      canonicalEntity: null,
      shoppingIntent: "find-product",
      shopperAction: "find",
      shoppingGoal: "Find products across verified categories.",
      decision: {
        ...brandIntent(categories).decision,
        selectedCandidateId: "product:unknown:verified-categories:find-product:find",
      },
    };
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as { category_ids: string };
      if (request.category_ids === "102") throw new Error("catalog timeout");
      return Response.json({
        messageId: "10000",
        body: {
          page: { total: 1, page_index: 1, page_size: 60, hasNext: false },
          items: [{
            item_number: "serum-1",
            goods_ename: "Verified Serum",
            category_l3_id: 101,
            image_url: "/item/serum-1.webp",
            slug: "verified-serum",
            status: "A",
            goods_number: 10,
          }],
        },
      });
    });
    const snapshot: YamiSearchSnapshot = {
      keyword: "skincare",
      site: "us",
      sourceUrl: "https://example.com/search?q=skincare",
      fetchedAt: "2026-08-19T00:00:00.000Z",
      provider: "yami-catalog-search",
      products: [],
      intent,
    };

    const refined = await refineYamiCatalogSnapshotForIntent(snapshot, intent, {
      fetch: fetchMock as typeof fetch,
    });

    expect(refined.products.map(({ id }) => id)).toEqual(["serum-1"]);
    expect(refined.catalogRefinement).toMatchObject({
      status: "partial",
      target: "categories",
      completedKeys: ["category:101"],
      failedKeys: ["category:102"],
    });
    expect(refined.catalogRefinement?.issues[0]).toContain("category:102");
  });

  it("does not fill a review-required modifier intent with unrelated category products", () => {
    const base = brandIntent([{ id: "102", label: "Toners", evidenceCount: 8 }]);
    const intent: NonNullable<YamiSearchSnapshot["intent"]> = {
      ...base,
      themeType: "product",
      entityType: "category",
      canonicalEntity: { id: "102", label: "Toners" },
      shoppingIntent: "find-product",
      shopperAction: "find",
      shoppingGoal: "Find heartleaf toners.",
      mustInclude: ["Toners"],
      searchTerms: ["heartleaf toner", "Toners"],
      constraints: [
        {
          id: "core-entity:toners",
          kind: "core-entity",
          value: "Toners",
          status: "verified",
          evidenceIds: ["catalog-category:102"],
        },
        {
          id: "modifier:heartleaf",
          kind: "modifier",
          value: "heartleaf",
          status: "unverified",
          evidenceIds: [],
        },
      ],
      decision: {
        ...base.decision,
        status: "needs-review",
        selectedCandidateId: "product:category:102:find-product:find",
        evidenceLevel: "medium",
        requiresAgentReview: true,
      },
    };
    const product = (id: string, title: string, sourceRank: number) => ({
      id,
      title,
      brand: "ANUA",
      price: "$20.00",
      imageUrl: `https://example.com/${id}.webp`,
      productUrl: `https://example.com/${id}`,
      sourceRank,
      categoryL3Id: 102,
      categoryL3Name: "Toners",
    });
    const run = advanceProductSelectionRun({
      snapshot: {
        keyword: "heartleaf toner",
        site: "us",
        sourceUrl: "https://example.com/search?q=heartleaf+toner",
        fetchedAt: "2026-08-19T00:00:00.000Z",
        provider: "yami-catalog-search",
        products: [
          product("heartleaf", "Heartleaf 77 Toner", 1),
          product("rice", "Rice Glow Toner", 2),
          product("peach", "Peach Brightening Toner", 3),
        ],
        intent,
      },
      strategyRef: "relevance/intent-themes@2",
    });

    expect(run.status).toBe("ready");
    if (run.status !== "ready") return;
    expect(run.result.pools.primaryIds).toEqual(["heartleaf"]);
    expect(run.result.pools.relatedIds).toEqual(["rice", "peach"]);
  });

  it("uses bilingual catalog aliases to verify a Chinese modifier against English-site products", () => {
    const base = brandIntent([{ id: "178", label: "Mooncakes", evidenceCount: 20 }]);
    const intent: NonNullable<YamiSearchSnapshot["intent"]> = {
      ...base,
      themeType: "activity",
      entityType: "category",
      canonicalEntity: { id: "178", label: "Mooncakes" },
      shoppingIntent: "assemble-scenario",
      shopperAction: "gift",
      shoppingGoal: "Shop Mid-Autumn Festival mooncakes.",
      mustInclude: ["Mooncakes"],
      searchTerms: ["中秋节", "Mooncakes"],
      constraints: [
        {
          id: "core-entity:mooncakes",
          kind: "core-entity",
          value: "Mooncakes",
          status: "verified",
          evidenceIds: ["catalog-category:178"],
        },
        {
          id: "modifier:中秋节",
          kind: "modifier",
          value: "中秋节",
          status: "unverified",
          evidenceIds: [],
        },
      ],
      decision: {
        ...base.decision,
        status: "needs-review",
        selectedCandidateId: "activity:category:178:assemble-scenario:gift",
        evidenceLevel: "medium",
        requiresAgentReview: true,
      },
    };
    const product = (
      id: string,
      title: string,
      sourceRank: number,
      searchAliases: string[] = [],
    ) => ({
      id,
      title,
      brand: "Yami",
      price: "$20.00",
      imageUrl: `https://example.com/${id}.webp`,
      productUrl: `https://example.com/${id}`,
      sourceRank,
      categoryL3Id: 178,
      categoryL3Name: "Mooncakes",
      searchAliases,
    });
    const run = advanceProductSelectionRun({
      snapshot: {
        keyword: "中秋节",
        site: "us",
        sourceUrl: "https://www.yami.com/us/en/search?q=%E4%B8%AD%E7%A7%8B%E8%8A%82",
        fetchedAt: "2026-08-19T00:00:00.000Z",
        provider: "yami-catalog-search",
        products: [
          product("festival", "Mid-Autumn Festival Mooncake Gift Box", 1, ["中秋节月饼礼盒"]),
          product("plain", "Classic Mooncake Gift Box", 2),
        ],
        intent,
      },
      strategyRef: "relevance/intent-themes@2",
    });

    expect(run.status).toBe("ready");
    if (run.status !== "ready") return;
    expect(run.result.pools.primaryIds).toEqual(["festival"]);
    expect(run.result.pools.relatedIds).toEqual(["plain"]);
  });

  it("caps a resolved single-category occasion before page theme expansion", () => {
    const base = brandIntent([{ id: "178", label: "Mooncakes", evidenceCount: 30 }]);
    const intent: NonNullable<YamiSearchSnapshot["intent"]> = {
      ...base,
      themeType: "activity",
      entityType: "scenario",
      canonicalEntity: { id: "中秋节", label: "中秋节" },
      shoppingIntent: "assemble-scenario",
      shopperAction: "gift",
      shoppingGoal: "Shop Mooncakes for 中秋节.",
      mustInclude: ["Mooncakes"],
      searchTerms: ["中秋节", "Mooncakes"],
      categories: [{
        id: "178",
        label: "Mooncakes",
        path: ["Snack", "Mooncakes"],
        evidenceCount: 30,
      }],
      constraints: [
        {
          id: "scenario:中秋节",
          kind: "scenario",
          value: "中秋节",
          status: "verified",
          evidenceIds: ["catalog-products:occasion-中秋节"],
        },
        {
          id: "core-entity:mooncakes",
          kind: "core-entity",
          value: "Mooncakes",
          status: "verified",
          evidenceIds: ["catalog-category:178"],
        },
      ],
      decision: {
        ...base.decision,
        status: "resolved",
        selectedCandidateId: "activity:scenario:中秋节:assemble-scenario:gift",
        evidenceLevel: "high",
        requiresAgentReview: false,
      },
    };
    const products = Array.from({ length: 30 }, (_, index) => ({
      id: `mooncake-${index + 1}`,
      title: `Mooncake Gift Box ${index + 1}`,
      brand: "Yami",
      price: "$20.00",
      imageUrl: `https://example.com/mooncake-${index + 1}.webp`,
      productUrl: `https://example.com/mooncake-${index + 1}`,
      sourceRank: index + 1,
      categoryL3Id: 178,
      categoryL3Name: "Mooncakes",
      searchAliases: [`中秋节月饼礼盒 ${index + 1}`],
    }));
    const run = advanceProductSelectionRun({
      snapshot: {
        keyword: "中秋节",
        site: "us",
        sourceUrl: "https://www.yami.com/us/en/search?q=%E4%B8%AD%E7%A7%8B%E8%8A%82",
        fetchedAt: "2026-08-19T00:00:00.000Z",
        provider: "yami-catalog-search",
        products,
        intent,
      },
      strategyRef: "relevance/intent-themes@2",
    });

    expect(run.status).toBe("ready");
    if (run.status !== "ready") return;
    expect(run.result.pools.primaryIds).toEqual(
      products.slice(0, 20).map(({ id }) => id),
    );
    expect(run.result.pools.relatedIds).toEqual(
      products.slice(20, 26).map(({ id }) => id),
    );
  });

  it("does not expand an exact category through unrelated keyword matches", async () => {
    const base = brandIntent([
      { id: "1496", label: "Instant Coffee", evidenceCount: 8 },
      { id: "1495", label: "Cold Brew & Bottled", evidenceCount: 8 },
      { id: "1231", label: "Household Essentials", evidenceCount: 8 },
    ]);
    const intent: NonNullable<YamiSearchSnapshot["intent"]> = {
      ...base,
      themeType: "product",
      catalogDomain: "Beverage",
      entityType: "category",
      canonicalEntity: { id: "312", label: "Coffee" },
      shoppingIntent: "find-product",
      shopperAction: "find",
      shoppingGoal: "Find Coffee products.",
      needs: ["Instant Coffee", "Cold Brew & Bottled"],
      mustInclude: ["Coffee"],
      mustExclude: ["decaf"],
      searchTerms: ["coffee", "Coffee"],
      categories: [
        { id: "1496", label: "Instant Coffee", path: ["Beverage", "Coffee", "Instant Coffee"], evidenceCount: 8 },
        { id: "1495", label: "Cold Brew & Bottled", path: ["Beverage", "Coffee", "Cold Brew & Bottled"], evidenceCount: 8 },
        { id: "1231", label: "Household Essentials", path: ["Home", "Household", "Household Essentials"], evidenceCount: 8 },
      ],
      constraints: [{
        id: "core-entity:coffee",
        kind: "core-entity",
        value: "Coffee",
        status: "verified",
        evidenceIds: ["catalog-category:312"],
      }],
      evidenceRefs: [{
        id: "catalog-category:312",
        source: "catalog-category",
        label: "Coffee",
      }],
      decision: {
        ...base.decision,
        selectedCandidateId: "product:category:312:find-product:find",
      },
      reason: "The catalog category exactly matches the keyword.",
      confidence: 0.92,
    };
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as { category_ids: string };
      const categoryId = Number(request.category_ids);
      return Response.json({
        messageId: "10000",
        body: {
          page: { total: 4, page_index: 1, page_size: 60, hasNext: false },
          items: Array.from({ length: 4 }, (_, index) => ({
            item_number: `${categoryId}-${index + 1}`,
            goods_ename: categoryId === 1496 && index === 0
              ? "Decaf Coffee Product"
              : `Coffee Product ${index + 1}`,
            category_l1_id: categoryId === 1231 ? 8 : 3,
            category_l2_id: categoryId === 1231 ? 80 : 312,
            category_l3_id: categoryId,
            image_url: `/item/${categoryId}-${index + 1}.webp`,
            slug: `coffee-${categoryId}-${index + 1}`,
            status: "A",
            goods_number: 10,
          })),
        },
      });
    });
    const snapshot: YamiSearchSnapshot = {
      keyword: "coffee",
      site: "us",
      sourceUrl: "https://example.com/search?q=coffee",
      fetchedAt: "2026-08-19T00:00:00.000Z",
      provider: "yami-catalog-search",
      products: [],
      intent,
    };

    const refined = await refineYamiCatalogSnapshotForIntent(snapshot, intent, {
      fetch: fetchMock as typeof fetch,
    });

    expect(fetchMock.mock.calls.map(([, init]) =>
      JSON.parse(String(init?.body)).category_ids
    )).toEqual(["1496", "1495"]);
    expect(refined.products.every(({ categoryL2Id }) => categoryL2Id === 312)).toBe(true);
    expect(refined.products).toHaveLength(7);
    expect(refined.products.some(({ title }) => title.includes("Decaf"))).toBe(false);
  });

  it("selects relevance pools once without requiring PagePlan or language", () => {
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: "https://example.com/search?q=ANUA",
      fetchedAt: "2026-08-17T00:00:00.000Z",
      provider: "yami-catalog-search",
      products: Array.from({ length: 12 }, (_, index) => ({
        id: `${index + 1}`,
        title: index < 10 ? `ANUA Product ${index + 1}` : `Related Product ${index + 1}`,
        brand: index < 10 ? "ANUA" : "Related Brand",
        price: index === 0 ? "$999.00" : "$1.00",
        imageUrl: `https://example.com/${index + 1}.webp`,
        productUrl: `https://example.com/${index + 1}`,
        sourceRank: index + 1,
      })),
    };

    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "relevance/default@1",
    });

    expect(run).toMatchObject({
      schemaVersion: "product-selection-run/v1",
      status: "ready",
      result: {
        schemaVersion: "product-selection-result/v1",
        strategyRef: "relevance/default@1",
        pools: {
          primaryIds: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
          relatedIds: ["11", "12"],
        },
      },
    });
  });

  it("freezes two to six Brand Spotlight groups with exactly three products each", () => {
    const products = Array.from({ length: 8 }, (_, brandIndex) =>
      Array.from({ length: 4 }, (_, productIndex) => ({
        id: `brand-${brandIndex + 1}-product-${productIndex + 1}`,
        title: `Matcha product ${brandIndex + 1}-${productIndex + 1}`,
        brand: `Matcha Brand ${brandIndex + 1}`,
        brandId: brandIndex + 1,
        price: "$10.00",
        imageUrl: `https://example.com/brand-${brandIndex + 1}-${productIndex + 1}.webp`,
        productUrl: `https://example.com/brand-${brandIndex + 1}-${productIndex + 1}`,
        sourceRank: brandIndex * 4 + productIndex + 1,
        soldCount: 1_000 - brandIndex * 100 - productIndex,
      }))
    ).flat();
    const run = advanceProductSelectionRun({
      snapshot: {
        keyword: "matcha",
        site: "us",
        sourceUrl: "https://example.com/search?q=matcha",
        fetchedAt: "2026-08-20T00:00:00.000Z",
        products,
      },
      strategyRef: "relevance/default@1",
    });

    expect(run.status).toBe("ready");
    if (run.status !== "ready") return;
    const brandModule = run.result.modules.find(({ id }) => id === "brand-spotlight")!;
    expect(brandModule.groups).toHaveLength(6);
    expect(brandModule.groups.map(({ label }) => label)).toEqual([
      "Matcha Brand 1",
      "Matcha Brand 2",
      "Matcha Brand 3",
      "Matcha Brand 4",
      "Matcha Brand 5",
      "Matcha Brand 6",
    ]);
    expect(brandModule.groups.every(({ productIds }) => productIds.length === 3)).toBe(true);
    expect(brandModule.productIds).toEqual(
      brandModule.groups.flatMap(({ productIds }) => productIds),
    );
  });

  it("leaves Brand Spotlight empty when fewer than two brands have three products", () => {
    const products = [
      ...Array.from({ length: 3 }, (_, index) => ({
        id: `eligible-${index + 1}`,
        title: `Matcha eligible ${index + 1}`,
        brand: "Eligible Brand",
        brandId: 1,
        price: "$10.00",
        imageUrl: `https://example.com/eligible-${index + 1}.webp`,
        productUrl: `https://example.com/eligible-${index + 1}`,
        sourceRank: index + 1,
      })),
      ...Array.from({ length: 2 }, (_, index) => ({
        id: `small-${index + 1}`,
        title: `Matcha small ${index + 1}`,
        brand: "Small Brand",
        brandId: 2,
        price: "$10.00",
        imageUrl: `https://example.com/small-${index + 1}.webp`,
        productUrl: `https://example.com/small-${index + 1}`,
        sourceRank: index + 4,
      })),
    ];
    const run = advanceProductSelectionRun({
      snapshot: {
        keyword: "matcha",
        site: "us",
        sourceUrl: "https://example.com/search?q=matcha",
        fetchedAt: "2026-08-20T00:00:00.000Z",
        products,
      },
      strategyRef: "relevance/default@1",
    });

    expect(run.status).toBe("ready");
    if (run.status !== "ready") return;
    expect(run.result.modules.find(({ id }) => id === "brand-spotlight"))
      .toMatchObject({ productIds: [], groups: [] });
  });

  it("does not refill a resolved non-brand pool with unrelated search results after filtering", () => {
    const base = brandIntent([]);
    const intent: NonNullable<YamiSearchSnapshot["intent"]> = {
      ...base,
      themeType: "product",
      entityType: "category",
      canonicalEntity: { id: "312", label: "Coffee" },
      shoppingIntent: "find-product",
      shopperAction: "find",
      shoppingGoal: "Find coffee products.",
      mustInclude: ["Coffee"],
      searchTerms: ["coffee"],
      decision: {
        ...base.decision,
        selectedCandidateId: "product:category:312:find-product:find",
      },
    };
    const products = [
      ...Array.from({ length: 2 }, (_, index) => ({
        id: `coffee-${index + 1}`,
        title: `Coffee Product ${index + 1}`,
        brand: "Coffee Brand",
        price: "$10.00",
        imageUrl: `https://example.com/coffee-${index + 1}.webp`,
        productUrl: `https://example.com/coffee-${index + 1}`,
        sourceRank: index + 1,
        categoryL2Id: 312,
        categoryL2Name: "Coffee",
      })),
      ...Array.from({ length: 8 }, (_, index) => ({
        id: `unrelated-${index + 1}`,
        title: `Household Product ${index + 1}`,
        brand: "Home Brand",
        price: "$10.00",
        imageUrl: `https://example.com/unrelated-${index + 1}.webp`,
        productUrl: `https://example.com/unrelated-${index + 1}`,
        sourceRank: index + 3,
        categoryL2Id: 999,
        categoryL2Name: "Household",
      })),
    ];

    const run = advanceProductSelectionRun({
      snapshot: {
        keyword: "coffee",
        site: "us",
        sourceUrl: "https://example.com/search?q=coffee",
        fetchedAt: "2026-08-19T00:00:00.000Z",
        provider: "yami-catalog-search",
        products,
        intent,
      },
      strategyRef: "relevance/intent-themes@2",
    });

    expect(run.status).toBe("ready");
    if (run.status !== "ready") return;
    expect(run.result.pools.primaryIds).toEqual(["coffee-1", "coffee-2"]);
    expect(run.result.pools.relatedIds).toEqual([]);
  });

  it("deduplicates relevance pools by product ID while preserving first source order", () => {
    const firstProduct = {
      id: "1",
      title: "ANUA First Result",
      brand: "ANUA",
      price: "$10.00",
      imageUrl: "https://example.com/first.webp",
      productUrl: "https://example.com/first",
      sourceRank: 1,
    };
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: "https://example.com/search?q=ANUA",
      fetchedAt: "2026-08-17T00:00:00.000Z",
      products: [
        firstProduct,
        { ...firstProduct, title: "ANUA Duplicate Result", sourceRank: 2 },
        {
          id: "2",
          title: "ANUA Second Product",
          brand: "ANUA",
          price: "$12.00",
          imageUrl: "https://example.com/second.webp",
          productUrl: "https://example.com/second",
          sourceRank: 3,
        },
      ],
    };

    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "relevance/default@1",
    });

    expect(run.status).toBe("ready");
    if (run.status === "ready") {
      expect(run.result.pools.primaryIds).toEqual(["1", "2"]);
      expect(run.result.products.map(({ id }) => id)).toEqual(["1", "2"]);
      expect(run.result.products[0]?.title).toBe("ANUA First Result");
    }
  });

  it("asks the Agent for category roles only after receiving a complete taxonomy snapshot", () => {
    const snapshot: YamiSearchSnapshot = {
      keyword: "Matcha",
      site: "us",
      sourceUrl: "https://example.com/search?q=Matcha",
      fetchedAt: "2026-08-17T00:00:00.000Z",
      products: [],
    };
    const taxonomySnapshot = {
      schemaVersion: "catalog-taxonomy-snapshot/v1" as const,
      site: "us" as const,
      source: "imported-artifact" as const,
      sourceRef: "fixtures/yami-us-taxonomy.json",
      fetchedAt: "2026-08-17T00:00:00.000Z",
      digest: "sha256:taxonomy",
      categories: [
        {
          id: "1691",
          parentId: null,
          label: "Matcha",
          aliases: ["抹茶"],
          path: ["Beverage", "Tea", "Matcha"],
          level: 3,
          enabled: true,
        },
      ],
    };

    expect(
      advanceProductSelectionRun({
        snapshot,
        strategyRef: "category-role/landing-page-agent@1",
        taxonomySnapshot,
      }),
    ).toMatchObject({
      schemaVersion: "product-selection-run/v1",
      status: "needs-category-proposal",
      strategyRef: "category-role/landing-page-agent@1",
      context: {
        keyword: "Matcha",
        taxonomyDigest: "sha256:taxonomy",
        categories: [{ id: "1691", label: "Matcha" }],
      },
    });
  });

  it("accepts a catalog-backed 5:3:2 proposal before requesting candidate retrieval", () => {
    const { categories, snapshot, taxonomySnapshot, categoryRoleProposal } =
      categoryRoleFixture();

    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      categoryRoleProposal,
    });

    expect(run).toMatchObject({
      schemaVersion: "product-selection-run/v1",
      status: "needs-candidate-snapshot",
      strategyRef: "category-role/landing-page-agent@1",
      categoryProposalReview: { status: "accepted", issues: [] },
      context: {
        keyword: "Matcha",
        retrieval: {
          perCategory: { limit: 100, sort: "featured" },
          discoveryPool: { limit: 200, sort: "sold" },
        },
      },
    });
    if (run.status === "needs-candidate-snapshot") {
      expect(run.context.categories.map(({ id, label, role }) => ({ id, label, role })))
        .toEqual(categories.map(({ id, label, role }) => ({ id, label, role })));
    }
  });

  it("rejects category proposals that break role order or select a parent with its child", () => {
    const { snapshot, taxonomySnapshot, categoryRoleProposal } = categoryRoleFixture();
    const outOfOrder = {
      ...categoryRoleProposal,
      categories: [...categoryRoleProposal.categories],
    };
    [outOfOrder.categories[4], outOfOrder.categories[5]] = [
      outOfOrder.categories[5],
      outOfOrder.categories[4],
    ];

    expect(advanceProductSelectionRun({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      categoryRoleProposal: outOfOrder,
    })).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Categories must be ordered as core, pairing, then accessory.",
      ]),
    });

    const hierarchyTaxonomy: CatalogTaxonomySnapshot = {
      ...taxonomySnapshot,
      categories: [
        ...taxonomySnapshot.categories.map((category) =>
          category.id === "1000" ? { ...category, parentId: "900" } : category
        ),
        {
          id: "900",
          parentId: null,
          label: "Parent category",
          aliases: [],
          path: ["Catalog", "Parent category"],
          level: 2,
          enabled: true,
        },
      ],
    };
    const overlappingProposal: CategoryRoleProposal = {
      ...categoryRoleProposal,
      categories: categoryRoleProposal.categories.map((category, index) =>
        index === 1
          ? { ...category, categoryId: "900", reason: "Selected parent" }
          : category
      ),
    };

    expect(advanceProductSelectionRun({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot: hierarchyTaxonomy,
      categoryRoleProposal: overlappingProposal,
    })).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Category 1000 overlaps with selected ancestor 900.",
      ]),
    });
  });

  it("rejects Agent category claims that are absent from the taxonomy snapshot", () => {
    const { snapshot, taxonomySnapshot, categoryRoleProposal } = categoryRoleFixture();
    categoryRoleProposal.categories[9] = {
      categoryId: "not-in-taxonomy",
      role: "accessory",
      reason: "Invented category",
    };

    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      categoryRoleProposal,
    });

    expect(run).toMatchObject({
      status: "blocked",
      categoryProposalReview: { status: "rejected" },
    });
    expect(run.status === "blocked" ? run.issues : []).toContain(
      "Category not-in-taxonomy is not enabled in the taxonomy snapshot.",
    );
  });

  it("asks the Agent for scenes only after validating category candidate evidence", () => {
    const { categories, snapshot, taxonomySnapshot, categoryRoleProposal } =
      categoryRoleFixture();
    const candidateSnapshot = candidateSnapshotFixture(categories);

    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      categoryRoleProposal,
      candidateSnapshot,
    });

    expect(run).toMatchObject({
      schemaVersion: "product-selection-run/v1",
      status: "needs-scene-proposal",
      strategyRef: "category-role/landing-page-agent@1",
      categoryProposalReview: { status: "accepted" },
      candidateSnapshotDigest: "sha256:candidates",
      context: {
        keyword: "Matcha",
        sceneRange: [4, 6],
        groupsPerScene: 2,
      },
    });
    if (run.status === "needs-scene-proposal") {
      expect(run.context.products[0]).toMatchObject({ id: "product-1000", role: "core" });
      expect(run.context.products).toHaveLength(10);
    }
  });

  it("accepts four reviewable scenes and returns role-correct pools", () => {
    const { categories, snapshot, taxonomySnapshot, categoryRoleProposal } =
      categoryRoleFixture();
    const candidateSnapshot = candidateSnapshotFixture(categories, 4);

    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      categoryRoleProposal,
      candidateSnapshot,
      sceneProposal: sceneProposalFixture(),
    });

    expect(run).toMatchObject({
      status: "ready",
      result: {
        strategyRef: "category-role/landing-page-agent@1",
      },
    });
    if (run.status === "ready") {
      expect(run.result.pools.relatedIds).toEqual([]);
      const startHere = run.result.modules.find(({ id }) => id === "start-here")!;
      expect(startHere.productIds).toHaveLength(24);
      expect(new Set(startHere.productIds).size).toBe(24);
      expect(startHere.groups).toHaveLength(4);
    }
  });

  it("rejects a scene proposal that reuses a product across scenes", () => {
    const { categories, snapshot, taxonomySnapshot, categoryRoleProposal } =
      categoryRoleFixture();
    const candidateSnapshot = candidateSnapshotFixture(categories, 4);
    const sceneProposal = repeatedSceneProposalFixture([
      {
        core: "product-1000-0",
        pairing: "product-1005-0",
        accessory: "product-1008-0",
      },
      {
        core: "product-1001-0",
        pairing: "product-1006-0",
        accessory: "product-1009-0",
      },
    ]);

    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      categoryRoleProposal,
      candidateSnapshot,
      sceneProposal,
    });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Scene product product-1000-0 is used more than once.",
      ]),
    });
  });

  it("reports candidate retrieval quality errors without blocking a valid selection", async () => {
    const { categories, snapshot, taxonomySnapshot, categoryRoleProposal } =
      categoryRoleFixture();
    const candidateSnapshot = candidateSnapshotFixture(categories, 4);
    candidateSnapshot.source.attempts = [
      ...categories.map(({ id }) => ({
        requestId: `category:${id}`,
        status: "succeeded" as const,
      })),
      {
        requestId: "discovery",
        status: "failed" as const,
        errorCode: "timeout",
      },
    ];

    const result = await runProductSelectionWorkflow({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      categoryRoleProposal,
      candidateSnapshot,
      sceneProposal: sceneProposalFixture(),
    });

    expect(result.artifacts.candidateQualityReport?.status).toBe("error");
    expect(result.run).toMatchObject({
      status: "ready",
      result: {
        strategyRef: "category-role/landing-page-agent@1",
      },
    });
  });

  it("fills Popular Picks from five core categories after excluding scene products", () => {
    const { categories, snapshot, taxonomySnapshot, categoryRoleProposal } =
      categoryRoleFixture();
    const candidateSnapshot = candidateSnapshotFixture(categories, 12);
    const sceneProposal = sceneProposalFixture();

    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      categoryRoleProposal,
      candidateSnapshot,
      sceneProposal,
    });

    expect(run.status).toBe("ready");
    if (run.status === "ready") {
      const startHere = run.result.modules.find(({ id }) => id === "start-here")!;
      const popular = run.result.modules.find(({ id }) => id === "popular-picks")!;
      expect(popular.productIds).toHaveLength(50);
      expect(popular.productIds.some((id) => startHere.productIds.includes(id))).toBe(false);
      expect(
        popular.productIds.every((id) =>
          ["1000", "1001", "1002", "1003", "1004"].some((categoryId) =>
            id.startsWith(`product-${categoryId}-`)
          )
        ),
      ).toBe(true);
      expect(popular.productIds.slice(0, 3)).toEqual([
        "product-1000-2",
        "product-1000-3",
        "product-1000-4",
      ]);
    }
  });

  it("selects six brands with a 3:2:1 role target after Scene and Popular Picks", () => {
    const { categories, snapshot, taxonomySnapshot, categoryRoleProposal } =
      categoryRoleFixture();
    const candidateSnapshot = candidateSnapshotFixture(categories, 15);
    const sceneProposal = sceneProposalFixture();

    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      categoryRoleProposal,
      candidateSnapshot,
      sceneProposal,
    });

    expect(run.status).toBe("ready");
    if (run.status === "ready") {
      const previousIds = run.result.modules
        .filter(({ id }) => id === "start-here" || id === "popular-picks")
        .flatMap(({ productIds }) => productIds);
      const brand = run.result.modules.find(({ id }) => id === "brand-spotlight")!;
      expect(brand.productIds).toHaveLength(18);
      expect(brand.groups).toHaveLength(6);
      expect(brand.groups.map(({ role }) => role)).toEqual([
        "core", "core", "core", "pairing", "pairing", "accessory",
      ]);
      expect(brand.groups.every(({ productIds }) => productIds.length === 3)).toBe(true);
      expect(brand.productIds.some((id) => previousIds.includes(id))).toBe(false);
      const brandRoles = brand.productIds.map((id) =>
        run.result.products.find((product) => product.id === id)?.role
      );
      expect(brandRoles.filter((role) => role === "core")).toHaveLength(9);
      expect(brandRoles.filter((role) => role === "pairing")).toHaveLength(6);
      expect(brandRoles.filter((role) => role === "accessory")).toHaveLength(3);
    }
  });

  it("does not infer brand identity when catalog brand IDs are absent", () => {
    const { categories, snapshot, taxonomySnapshot, categoryRoleProposal } =
      categoryRoleFixture();
    const candidateSnapshot = candidateSnapshotFixture(categories, 15);
    candidateSnapshot.products = candidateSnapshot.products.map(({ brandId: _brandId, ...product }) =>
      product
    );
    const sceneProposal = sceneProposalFixture();

    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      categoryRoleProposal,
      candidateSnapshot,
      sceneProposal,
    });

    expect(run.status).toBe("ready");
    if (run.status === "ready") {
      expect(run.result.modules.find(({ id }) => id === "brand-spotlight"))
        .toMatchObject({ productIds: [], groups: [] });
    }
  });

  it("keeps discovery-only products out of Brand Spotlight", () => {
    const { categories, snapshot, taxonomySnapshot, categoryRoleProposal } =
      categoryRoleFixture();
    const candidateSnapshot = candidateSnapshotFixture(categories, 15);
    const discoveryProducts = Array.from({ length: 20 }, (_, index) => ({
      id: `discovery-brand-${index}`,
      title: `Discovery Brand Product ${index}`,
      brand: "Discovery Brand",
      brandId: 999,
      price: "$1.00",
      imageUrl: `https://example.com/discovery-brand-${index}.webp`,
      productUrl: `https://example.com/discovery-brand-${index}`,
      sourceRank: 10_000 + index,
      categoryL3Id: 1000,
      categoryL3Name: "Category 1",
      soldCount: 100_000 - index,
    }));
    candidateSnapshot.products.push(...discoveryProducts);
    candidateSnapshot.discoveryProductIds = discoveryProducts.map(({ id }) => id);
    const sceneProposal = sceneProposalFixture();

    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      categoryRoleProposal,
      candidateSnapshot,
      sceneProposal,
    });

    expect(run.status).toBe("ready");
    if (run.status === "ready") {
      const brand = run.result.modules.find(({ id }) => id === "brand-spotlight")!;
      expect(brand.productIds.some((id) => id.startsWith("discovery-brand-"))).toBe(false);
    }
  });

  it("selects Explore More from three pairing and two accessory categories after global dedupe", () => {
    const { categories, snapshot, taxonomySnapshot, categoryRoleProposal } =
      categoryRoleFixture();
    const candidateSnapshot = candidateSnapshotFixture(categories, 25);
    candidateSnapshot.discoveryProductIds = ["1005", "1006", "1007", "1008"]
      .flatMap((categoryId) =>
        Array.from({ length: 5 }, (_, index) => `product-${categoryId}-${20 + index}`)
      );
    const sceneProposal = sceneProposalFixture();

    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      categoryRoleProposal,
      candidateSnapshot,
      sceneProposal,
    });

    expect(run.status).toBe("ready");
    if (run.status === "ready") {
      const previousIds = run.result.modules
        .filter(({ id }) => id !== "explore-more")
        .flatMap(({ productIds }) => productIds);
      const explore = run.result.modules.find(({ id }) => id === "explore-more")!;
      expect(explore.productIds).toHaveLength(38);
      expect(explore.groups.map(({ role }) => role)).toEqual([
        "pairing", "pairing", "pairing", "accessory", "accessory",
      ]);
      expect(explore.productIds.some((id) => previousIds.includes(id))).toBe(false);
      expect(explore.productIds.slice(0, 5)).toEqual([
        "product-1005-20",
        "product-1005-21",
        "product-1005-22",
        "product-1005-23",
        "product-1005-24",
      ]);
      expect(explore.productIds.slice(-18)).toEqual(
        Array.from({ length: 18 }, (_, index) => `product-1009-${index + 4}`),
      );
    }
  });
});
