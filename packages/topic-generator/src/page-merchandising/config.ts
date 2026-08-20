import type { ProductPool, ProductRole, TopicModuleId } from "../types.js";
import type { TopicPageComponent, TopicPageTemplateRef } from "./contracts.js";

export type PageMerchandisingAssetTaskMode =
  | "none"
  | "module"
  | "assignment"
  | "scene"
  | "brand";

export interface PageMerchandisingModuleRule {
  id: TopicModuleId;
  component: TopicPageComponent;
  required: boolean;
  minimumProducts: number;
  maximumProducts: number;
  allowedPools: readonly ProductPool[];
  allowedRoles: readonly ProductRole[];
  sceneRange?: readonly [number, number];
  productsPerSceneRange?: readonly [number, number];
  requireSceneTargetProductCount?: boolean;
  assetTaskMode: PageMerchandisingAssetTaskMode;
}

export interface PageMerchandisingTemplateConfig {
  schemaVersion: "page-merchandising-template/v1";
  ref: TopicPageTemplateRef;
  assignmentAuthority: "proposal" | "product-selection";
  moduleOrder: readonly TopicModuleId[];
  modules: readonly PageMerchandisingModuleRule[];
}

const ALL_ROLES = ["core", "pairing", "accessory"] as const;
const PRIMARY = ["primary"] as const;
const ALL_POOLS = ["primary", "related"] as const;

const MODULE_ORDER = [
  "hero",
  "shortcuts",
  "start-here",
  "popular-picks",
  "brand-spotlight",
  "reviews",
  "explore-more",
] as const;

function modules(brandMaximumProducts: number): PageMerchandisingModuleRule[] {
  return [
    {
      id: "hero",
      component: "ThemeHero",
      required: true,
      minimumProducts: 3,
      maximumProducts: 5,
      allowedPools: PRIMARY,
      allowedRoles: ["core"],
      assetTaskMode: "module",
    },
    {
      id: "shortcuts",
      component: "ShortcutRail",
      required: true,
      minimumProducts: 2,
      maximumProducts: Number.MAX_SAFE_INTEGER,
      allowedPools: PRIMARY,
      allowedRoles: ["core"],
      assetTaskMode: "assignment",
    },
    {
      id: "start-here",
      component: "ThemeProductList",
      required: true,
      minimumProducts: 6,
      maximumProducts: 36,
      allowedPools: PRIMARY,
      allowedRoles: ALL_ROLES,
      sceneRange: [4, 6],
      assetTaskMode: "scene",
    },
    {
      id: "popular-picks",
      component: "ProductList",
      required: true,
      minimumProducts: 4,
      maximumProducts: 50,
      allowedPools: PRIMARY,
      allowedRoles: ["core"],
      assetTaskMode: "none",
    },
    {
      id: "brand-spotlight",
      component: "BrandProductRail",
      required: false,
      minimumProducts: brandMaximumProducts > 0 ? 3 : 0,
      maximumProducts: brandMaximumProducts,
      allowedPools: PRIMARY,
      allowedRoles: ALL_ROLES,
      assetTaskMode: brandMaximumProducts > 0 ? "brand" : "none",
    },
    {
      id: "reviews",
      component: "ReviewList",
      required: false,
      minimumProducts: 0,
      maximumProducts: 0,
      allowedPools: PRIMARY,
      allowedRoles: ALL_ROLES,
      assetTaskMode: "none",
    },
    {
      id: "explore-more",
      component: "ProductList",
      required: true,
      minimumProducts: 1,
      maximumProducts: 90,
      allowedPools: ALL_POOLS,
      allowedRoles: ["pairing", "accessory"],
      assetTaskMode: "none",
    },
  ];
}

function relevanceModules(
  brandMaximumProducts: number,
  maximumProductsPerScene = 8,
  requireSceneTargetProductCount = false,
): PageMerchandisingModuleRule[] {
  return [
    {
      id: "hero",
      component: "ThemeHero",
      required: true,
      minimumProducts: 3,
      maximumProducts: 5,
      allowedPools: PRIMARY,
      allowedRoles: ["core"],
      assetTaskMode: "module",
    },
    {
      id: "shortcuts",
      component: "ShortcutRail",
      required: true,
      minimumProducts: 1,
      maximumProducts: Number.MAX_SAFE_INTEGER,
      allowedPools: PRIMARY,
      allowedRoles: ["core"],
      assetTaskMode: "assignment",
    },
    {
      id: "start-here",
      component: "ThemeProductList",
      required: false,
      minimumProducts: 8,
      maximumProducts: 6 * maximumProductsPerScene,
      allowedPools: PRIMARY,
      allowedRoles: ALL_ROLES,
      sceneRange: [2, 6],
      productsPerSceneRange: [4, maximumProductsPerScene],
      ...(requireSceneTargetProductCount ? { requireSceneTargetProductCount: true } : {}),
      assetTaskMode: "scene",
    },
    {
      id: "popular-picks",
      component: "ProductList",
      required: true,
      minimumProducts: 1,
      maximumProducts: 8,
      allowedPools: PRIMARY,
      allowedRoles: ["core"],
      assetTaskMode: "none",
    },
    {
      id: "brand-spotlight",
      component: "BrandProductRail",
      required: false,
      minimumProducts: brandMaximumProducts > 0 ? 3 : 0,
      maximumProducts: brandMaximumProducts,
      allowedPools: PRIMARY,
      allowedRoles: ["core"],
      assetTaskMode: brandMaximumProducts > 0 ? "brand" : "none",
    },
    {
      id: "reviews",
      component: "ReviewList",
      required: false,
      minimumProducts: 0,
      maximumProducts: 0,
      allowedPools: PRIMARY,
      allowedRoles: ALL_ROLES,
      assetTaskMode: "none",
    },
    {
      id: "explore-more",
      component: "ProductList",
      required: true,
      minimumProducts: 1,
      maximumProducts: 6,
      allowedPools: ALL_POOLS,
      allowedRoles: ALL_ROLES,
      assetTaskMode: "none",
    },
  ];
}

const LEGACY_CONFIGS: readonly PageMerchandisingTemplateConfig[] = [
  {
    schemaVersion: "page-merchandising-template/v1",
    ref: "topic-landing/brand@1",
    assignmentAuthority: "proposal",
    moduleOrder: MODULE_ORDER,
    modules: modules(0),
  },
  {
    schemaVersion: "page-merchandising-template/v1",
    ref: "topic-landing/topic@1",
    assignmentAuthority: "proposal",
    moduleOrder: MODULE_ORDER,
    modules: modules(18),
  },
  {
    schemaVersion: "page-merchandising-template/v1",
    ref: "topic-landing/campaign@1",
    assignmentAuthority: "proposal",
    moduleOrder: MODULE_ORDER,
    modules: modules(18),
  },
  {
    schemaVersion: "page-merchandising-template/v1",
    ref: "topic-landing/relevance@1",
    assignmentAuthority: "proposal",
    moduleOrder: MODULE_ORDER,
    modules: relevanceModules(12).map((rule) => rule.id === "start-here"
      ? { ...rule, required: false, minimumProducts: 0, maximumProducts: 0 }
      : rule),
  },
];

const CONFIGS: readonly PageMerchandisingTemplateConfig[] = [
  {
    schemaVersion: "page-merchandising-template/v1",
    ref: "topic-landing/brand@2",
    assignmentAuthority: "product-selection",
    moduleOrder: MODULE_ORDER,
    modules: modules(0),
  },
  {
    schemaVersion: "page-merchandising-template/v1",
    ref: "topic-landing/topic@2",
    assignmentAuthority: "product-selection",
    moduleOrder: MODULE_ORDER,
    modules: modules(18),
  },
  {
    schemaVersion: "page-merchandising-template/v1",
    ref: "topic-landing/campaign@2",
    assignmentAuthority: "product-selection",
    moduleOrder: MODULE_ORDER,
    modules: modules(18),
  },
  {
    schemaVersion: "page-merchandising-template/v1",
    ref: "topic-landing/brand-relevance@1",
    assignmentAuthority: "proposal",
    moduleOrder: MODULE_ORDER,
    modules: relevanceModules(0),
  },
  {
    schemaVersion: "page-merchandising-template/v1",
    ref: "topic-landing/topic-relevance@1",
    assignmentAuthority: "proposal",
    moduleOrder: MODULE_ORDER,
    modules: relevanceModules(12),
  },
  {
    schemaVersion: "page-merchandising-template/v1",
    ref: "topic-landing/campaign-relevance@1",
    assignmentAuthority: "proposal",
    moduleOrder: MODULE_ORDER,
    modules: relevanceModules(12),
  },
  {
    schemaVersion: "page-merchandising-template/v1",
    ref: "topic-landing/brand-relevance@2",
    assignmentAuthority: "proposal",
    moduleOrder: MODULE_ORDER,
    modules: relevanceModules(0, 16, true),
  },
  {
    schemaVersion: "page-merchandising-template/v1",
    ref: "topic-landing/topic-relevance@2",
    assignmentAuthority: "proposal",
    moduleOrder: MODULE_ORDER,
    modules: relevanceModules(12, 16, true),
  },
  {
    schemaVersion: "page-merchandising-template/v1",
    ref: "topic-landing/campaign-relevance@2",
    assignmentAuthority: "proposal",
    moduleOrder: MODULE_ORDER,
    modules: relevanceModules(12, 16, true),
  },
];

export function listPageMerchandisingTemplateConfigs() {
  return CONFIGS;
}

export function getPageMerchandisingTemplateConfig(
  ref: TopicPageTemplateRef,
): PageMerchandisingTemplateConfig {
  const config = [...LEGACY_CONFIGS, ...CONFIGS].find((candidate) => candidate.ref === ref);
  if (!config) throw new Error(`Unknown PageMerchandising template: ${ref}`);
  return config;
}

export function evidenceSizedSceneProductRange(
  productsPerSceneRange: readonly [number, number],
  sourceProductCount: number,
  sourceCategoryCount: number,
): readonly [number, number] {
  const [hardMinimum, hardMaximum] = productsPerSceneRange;
  const maximum = Math.min(hardMaximum, sourceProductCount);
  const categorySizedMinimum = hardMinimum + (Math.max(0, sourceCategoryCount - 2) * 2);
  return [Math.min(maximum, categorySizedMinimum), maximum];
}
