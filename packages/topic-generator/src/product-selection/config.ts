import type { ProductRole, ProductSelectionStrategy, TopicModuleId } from "../types.js";

export type ProductSelectionSort = "featured" | "sold";
export type ProductSelectionStrategyRef = `${string}@${number}`;
export type CategoryRoleDistribution = readonly [number, number, number];

export interface ProductSelectionStrategyConfigBase {
  schemaVersion: "product-selection-strategy/v1";
  ref: ProductSelectionStrategyRef;
  id: string;
  version: number;
  engine: ProductSelectionStrategy;
  label: { en: string; zh: string };
  description: { en: string; zh: string };
}

export interface RelevanceStrategyConfig extends ProductSelectionStrategyConfigBase {
  engine: "relevance";
}

export interface CategoryRoleStrategyConfig extends ProductSelectionStrategyConfigBase {
  engine: "category-role";
  quality: {
    minimumProductsPerCategory: number;
  };
  categoryRoles: {
    total: number;
    target: Record<ProductRole, number>;
    allowedDistributions: readonly CategoryRoleDistribution[];
    priority: readonly ProductRole[];
  };
  retrieval: {
    perCategory: { limit: number; sort: ProductSelectionSort };
    discoveryPool: { limit: number; sort: ProductSelectionSort };
  };
  modules: {
    startHere: {
      sceneRange: readonly [number, number];
      groupsPerScene: number;
    };
    popularPicks: {
      role: "core";
      categories: number;
      perCategory: number;
    };
    brandSpotlight: {
      brandsByRole: Record<ProductRole, number>;
      perBrand: number;
    };
    exploreMore: {
      categoriesByRole: Pick<Record<ProductRole, number>, "pairing" | "accessory">;
      perCategory: number;
    };
  };
  dedupePriority: readonly Extract<
    TopicModuleId,
    "start-here" | "popular-picks" | "brand-spotlight" | "explore-more"
  >[];
}

export type ProductSelectionStrategyConfig =
  | RelevanceStrategyConfig
  | CategoryRoleStrategyConfig;

const RELEVANCE_DEFAULT = {
  schemaVersion: "product-selection-strategy/v1",
  ref: "relevance/default@1",
  id: "relevance/default",
  version: 1,
  engine: "relevance",
  label: { en: "Precise relevance", zh: "精准匹配" },
  description: {
    en: "Prioritizes keyword and brand matches while preserving Yami result order.",
    zh: "优先关键词和品牌匹配，并保留 Yami 搜索结果顺序。",
  },
} as const satisfies RelevanceStrategyConfig;

const CATEGORY_ROLE_LANDING_PAGE_AGENT = {
  schemaVersion: "product-selection-strategy/v1",
  ref: "category-role/landing-page-agent@1",
  id: "category-role/landing-page-agent",
  version: 1,
  engine: "category-role",
  label: { en: "Category roles", zh: "分类角色" },
  description: {
    en: "An Agent selects ten catalog categories before deterministic product retrieval and module allocation.",
    zh: "由 Agent 先选择 10 个目录分类，再确定性召回商品并分配模块。",
  },
  quality: {
    minimumProductsPerCategory: 3,
  },
  categoryRoles: {
    total: 10,
    target: { core: 5, pairing: 3, accessory: 2 },
    allowedDistributions: [
      [5, 3, 2],
      [4, 4, 2],
      [3, 4, 3],
      [5, 4, 1],
      [6, 3, 1],
      [3, 3, 4],
      [6, 4, 0],
    ],
    priority: ["core", "pairing", "accessory"],
  },
  retrieval: {
    perCategory: { limit: 100, sort: "featured" },
    discoveryPool: { limit: 200, sort: "sold" },
  },
  modules: {
    startHere: { sceneRange: [4, 6], groupsPerScene: 2 },
    popularPicks: { role: "core", categories: 5, perCategory: 10 },
    brandSpotlight: {
      brandsByRole: { core: 3, pairing: 2, accessory: 1 },
      perBrand: 3,
    },
    exploreMore: {
      categoriesByRole: { pairing: 3, accessory: 2 },
      perCategory: 18,
    },
  },
  dedupePriority: [
    "start-here",
    "popular-picks",
    "brand-spotlight",
    "explore-more",
  ],
} as const satisfies CategoryRoleStrategyConfig;

const BUILT_IN_CONFIGS: readonly ProductSelectionStrategyConfig[] = [
  RELEVANCE_DEFAULT,
  CATEGORY_ROLE_LANDING_PAGE_AGENT,
];

export function listProductSelectionStrategyConfigs() {
  return BUILT_IN_CONFIGS;
}

export function getProductSelectionStrategyConfig(
  ref: ProductSelectionStrategyRef,
): ProductSelectionStrategyConfig {
  const config = BUILT_IN_CONFIGS.find((candidate) => candidate.ref === ref);
  if (!config) throw new Error(`Unknown ProductSelection strategy config: ${ref}`);
  return config;
}
