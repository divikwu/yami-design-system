import type {
  ProductPool,
  ProductRole,
  YamiProduct,
  YamiSearchSnapshot,
  TopicModuleId,
} from "../types.js";
import type { ProductSelectionStrategyRef } from "./config.js";

export interface ProductSelectionProduct extends YamiProduct {
  pool: ProductPool;
  role: ProductRole;
}

export interface ProductSelectionResult {
  schemaVersion: "product-selection-result/v1";
  strategyRef: ProductSelectionStrategyRef;
  keyword: string;
  site: YamiSearchSnapshot["site"];
  selectedAt: string;
  pools: {
    primaryIds: string[];
    relatedIds: string[];
  };
  products: ProductSelectionProduct[];
  selectedCategories: SelectedCategoryRole[];
  scenes: ProductSelectionScene[];
  modules: ProductSelectionModuleResult[];
}

export interface CatalogTaxonomyCategory {
  id: string;
  parentId: string | null;
  label: string;
  aliases: string[];
  path: string[];
  level: number;
  enabled: boolean;
}

export interface CatalogTaxonomySnapshot {
  schemaVersion: "catalog-taxonomy-snapshot/v1";
  site: YamiSearchSnapshot["site"];
  source: "approved-http" | "imported-artifact";
  sourceRef: string;
  fetchedAt: string;
  digest: string;
  categories: CatalogTaxonomyCategory[];
}

export interface CategoryRoleProposalCategory {
  categoryId: string;
  role: ProductRole;
  reason: string;
}

export interface CategoryRoleProposal {
  schemaVersion: "category-role-proposal/v1";
  keyword: string;
  strategyRef: ProductSelectionStrategyRef;
  taxonomyDigest: string;
  categories: CategoryRoleProposalCategory[];
}

export interface SelectedCategoryRole {
  id: string;
  label: string;
  path: string[];
  role: ProductRole;
  reason: string;
}

export interface CategoryRoleProposalReview {
  status: "accepted" | "rejected";
  issues: string[];
  categories: SelectedCategoryRole[];
}

export interface CatalogCandidateCategory {
  id: string;
  label: string;
  role: ProductRole;
  productIds: string[];
}

export interface CatalogCandidateAttempt {
  requestId: string;
  status: "succeeded" | "failed";
  errorCode?: string;
  message?: string;
}

export interface CatalogCandidateSnapshot {
  schemaVersion: "catalog-candidate-snapshot/v1";
  strategyRef: ProductSelectionStrategyRef;
  keyword: string;
  site: YamiSearchSnapshot["site"];
  taxonomyDigest: string;
  fetchedAt: string;
  digest: string;
  source: {
    adapterId: string;
    attempts: CatalogCandidateAttempt[];
  };
  categories: CatalogCandidateCategory[];
  discoveryProductIds: string[];
  products: YamiProduct[];
}

export interface CatalogCandidateSnapshotReview {
  status: "accepted" | "rejected";
  issues: string[];
}

export interface SceneCandidateProduct extends YamiProduct {
  role: ProductRole;
}

export interface SceneProductGroup {
  core: string;
  pairing: string | null;
  accessory: string | null;
}

export interface ProductSelectionScene {
  id: string;
  name: string;
  title: string;
  description: string;
  productGroups: SceneProductGroup[];
}

export interface SceneProposal {
  schemaVersion: "scene-proposal/v1";
  keyword: string;
  strategyRef: ProductSelectionStrategyRef;
  candidateSnapshotDigest: string;
  scenes: ProductSelectionScene[];
}

export interface SceneProposalReview {
  status: "accepted" | "rejected";
  issues: string[];
  scenes: ProductSelectionScene[];
}

export interface ProductSelectionModuleResult {
  id: Extract<
    TopicModuleId,
    "start-here" | "popular-picks" | "brand-spotlight" | "explore-more"
  >;
  productIds: string[];
  groups: ProductSelectionModuleGroup[];
}

export interface ProductSelectionModuleGroup {
  id: string;
  label: string;
  role?: ProductRole;
  productIds: string[];
}

export interface ProductSelectionRequest {
  snapshot: YamiSearchSnapshot;
  strategyRef: ProductSelectionStrategyRef;
  taxonomySnapshot?: CatalogTaxonomySnapshot;
  categoryRoleProposal?: unknown;
  candidateSnapshot?: CatalogCandidateSnapshot;
  sceneProposal?: unknown;
}

export type ProductSelectionRun =
  | {
      schemaVersion: "product-selection-run/v1";
      status: "ready";
      result: ProductSelectionResult;
      categoryProposalReview?: CategoryRoleProposalReview;
      candidateSnapshotReview?: CatalogCandidateSnapshotReview;
      sceneProposalReview?: SceneProposalReview;
    }
  | {
      schemaVersion: "product-selection-run/v1";
      status: "needs-category-proposal";
      strategyRef: ProductSelectionStrategyRef;
      context: {
        keyword: string;
        taxonomyDigest: string;
        categories: CatalogTaxonomyCategory[];
      };
    }
  | {
      schemaVersion: "product-selection-run/v1";
      status: "needs-candidate-snapshot";
      strategyRef: ProductSelectionStrategyRef;
      categoryProposalReview: CategoryRoleProposalReview;
      context: {
        keyword: string;
        categories: SelectedCategoryRole[];
        retrieval: {
          perCategory: { limit: number; sort: "featured" | "sold" };
          discoveryPool: { limit: number; sort: "featured" | "sold" };
        };
      };
    }
  | {
      schemaVersion: "product-selection-run/v1";
      status: "needs-scene-proposal";
      strategyRef: ProductSelectionStrategyRef;
      categoryProposalReview: CategoryRoleProposalReview;
      candidateSnapshotReview: CatalogCandidateSnapshotReview;
      candidateSnapshotDigest: string;
      context: {
        keyword: string;
        sceneRange: readonly [number, number];
        groupsPerScene: number;
        products: SceneCandidateProduct[];
      };
    }
  | {
      schemaVersion: "product-selection-run/v1";
      status: "blocked";
      strategyRef: ProductSelectionStrategyRef;
      categoryProposalReview?: CategoryRoleProposalReview;
      candidateSnapshotReview?: CatalogCandidateSnapshotReview;
      issues: string[];
    };
