import { describe, expect, it } from "vitest";
import {
  advanceProductSelectionRun,
  getProductSelectionStrategyConfig,
  listProductSelectionStrategyConfigs,
  type CatalogTaxonomySnapshot,
  type CatalogCandidateSnapshot,
  type CategoryRoleProposal,
  type ProductRole,
  type YamiSearchSnapshot,
} from "../src/index.js";

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

function sceneProposalFixture(productGroups: Array<{
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

describe("ProductSelection Module", () => {
  it("exposes versioned strategy configs without making callers know their implementation", () => {
    expect(
      listProductSelectionStrategyConfigs().map(({ ref, engine }) => ({ ref, engine })),
    ).toEqual([
      { ref: "relevance/default@1", engine: "relevance" },
      {
        ref: "category-role/landing-page-agent@1",
        engine: "category-role",
      },
    ]);

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
    const candidateSnapshot = candidateSnapshotFixture(categories);
    const productGroups = [
      {
        core: "product-1000",
        pairing: "product-1005",
        accessory: "product-1008",
      },
      {
        core: "product-1001",
        pairing: "product-1006",
        accessory: "product-1009",
      },
    ];

    const run = advanceProductSelectionRun({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      categoryRoleProposal,
      candidateSnapshot,
      sceneProposal: {
        schemaVersion: "scene-proposal/v1",
        keyword: "Matcha",
        strategyRef: "category-role/landing-page-agent@1",
        candidateSnapshotDigest: "sha256:candidates",
        scenes: Array.from({ length: 4 }, (_, index) => ({
          id: `scene-${index + 1}`,
          name: `Scene ${index + 1}`,
          title: `Scene title ${index + 1}`,
          description: `Scene description ${index + 1}`,
          productGroups,
        })),
      },
    });

    expect(run).toMatchObject({
      status: "ready",
      result: {
        strategyRef: "category-role/landing-page-agent@1",
      },
    });
    if (run.status === "ready") {
      expect(run.result.pools.primaryIds).toEqual([
        "product-1000",
        "product-1005",
        "product-1008",
        "product-1001",
        "product-1006",
        "product-1009",
        "product-1002",
        "product-1003",
        "product-1004",
        "product-1007",
      ]);
      expect(run.result.pools.relatedIds).toEqual([]);
      expect(run.result.modules.find(({ id }) => id === "start-here")).toMatchObject({
        id: "start-here",
        productIds: [
          "product-1000",
          "product-1005",
          "product-1008",
          "product-1001",
          "product-1006",
          "product-1009",
        ],
      });
      expect(
        run.result.modules.find(({ id }) => id === "start-here")?.groups,
      ).toHaveLength(4);
    }
  });

  it("fills Popular Picks from five core categories after excluding scene products", () => {
    const { categories, snapshot, taxonomySnapshot, categoryRoleProposal } =
      categoryRoleFixture();
    const candidateSnapshot = candidateSnapshotFixture(categories, 12);
    const sceneProductIds = [
      "product-1000-0",
      "product-1005-0",
      "product-1008-0",
      "product-1001-0",
      "product-1006-0",
      "product-1009-0",
    ];
    const sceneProposal = {
      schemaVersion: "scene-proposal/v1" as const,
      keyword: "Matcha",
      strategyRef: "category-role/landing-page-agent@1" as const,
      candidateSnapshotDigest: "sha256:candidates",
      scenes: Array.from({ length: 4 }, (_, index) => ({
        id: `scene-${index + 1}`,
        name: `Scene ${index + 1}`,
        title: `Scene title ${index + 1}`,
        description: `Scene description ${index + 1}`,
        productGroups: [
          {
            core: sceneProductIds[0],
            pairing: sceneProductIds[1],
            accessory: sceneProductIds[2],
          },
          {
            core: sceneProductIds[3],
            pairing: sceneProductIds[4],
            accessory: sceneProductIds[5],
          },
        ],
      })),
    };

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
        "product-1000-1",
        "product-1000-2",
        "product-1000-3",
      ]);
    }
  });

  it("selects six brands with a 3:2:1 role target after Scene and Popular Picks", () => {
    const { categories, snapshot, taxonomySnapshot, categoryRoleProposal } =
      categoryRoleFixture();
    const candidateSnapshot = candidateSnapshotFixture(categories, 15);
    const sceneProposal = sceneProposalFixture([
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
    const sceneProposal = sceneProposalFixture([
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
    const sceneProposal = sceneProposalFixture([
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
    const sceneProposal = sceneProposalFixture([
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
        Array.from({ length: 18 }, (_, index) => `product-1009-${index + 1}`),
      );
    }
  });
});
