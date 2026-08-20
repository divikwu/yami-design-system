import { getProductSelectionStrategyConfig } from "./config.js";
import {
  finalizeCategoryRoleSelection,
  reviewCatalogCandidateSnapshot,
  reviewCategoryRoleProposal,
  reviewSceneProposal,
  sceneCandidateProducts,
} from "./category-role.js";
import type {
  ProductSelectionRequest,
  ProductSelectionRun,
} from "./contracts.js";
import { reviewProductSemanticProposal } from "./product-semantic.js";
import { selectByRelevance } from "./relevance.js";

export function advanceProductSelectionRun(
  request: ProductSelectionRequest,
): ProductSelectionRun {
  const config = getProductSelectionStrategyConfig(request.strategyRef);
  if (config.engine === "relevance") {
    const baseline = selectByRelevance(request.snapshot, config);
    const policy = config.themeCollections;
    const shortcutGroups = baseline.modules.find(({ id }) => id === "shortcuts")?.groups ?? [];
    const primaryProducts = baseline.products
      .filter(({ pool }) => pool === "primary")
      .map(({ pool: _pool, role: _role, ...product }) => product);
    const needsProductSemantics = Boolean(
      config.productSemanticGrouping &&
      policy &&
      shortcutGroups.length < policy.minimumThemes &&
      primaryProducts.length >= policy.minimumThemes * policy.minimumProducts,
    );
    if (needsProductSemantics && request.productSemanticProposal === undefined && policy) {
      return {
        schemaVersion: "product-selection-run/v1",
        status: "needs-product-semantic-proposal",
        strategyRef: config.ref,
        context: {
          keyword: request.snapshot.keyword,
          language: request.language ?? "en",
          minimumGroups: policy.minimumThemes,
          maximumScenes: policy.maximumThemes,
          minimumProductsPerScene: policy.minimumProducts,
          maximumProductsPerScene: policy.maximumProducts,
          products: primaryProducts,
        },
      };
    }
    if (needsProductSemantics && request.productSemanticProposal !== null) {
      const productSemanticProposalReview = reviewProductSemanticProposal(
        request.productSemanticProposal,
        request.snapshot.keyword,
        primaryProducts,
        config,
        request.language ?? "en",
      );
      if (productSemanticProposalReview.status === "rejected") {
        return {
          schemaVersion: "product-selection-run/v1",
          status: "blocked",
          strategyRef: config.ref,
          productSemanticProposalReview,
          issues: productSemanticProposalReview.issues,
        };
      }
      return {
        schemaVersion: "product-selection-run/v1",
        status: "ready",
        productSemanticProposalReview,
        result: selectByRelevance(request.snapshot, config, productSemanticProposalReview),
      };
    }
    return {
      schemaVersion: "product-selection-run/v1",
      status: "ready",
      result: baseline,
    };
  }

  if (request.taxonomySnapshot && request.categoryRoleProposal) {
    const categoryProposalReview = reviewCategoryRoleProposal(
      request.categoryRoleProposal,
      request.snapshot.keyword,
      request.taxonomySnapshot,
      config,
    );
    if (categoryProposalReview.status === "rejected") {
      return {
        schemaVersion: "product-selection-run/v1",
        status: "blocked",
        strategyRef: config.ref,
        categoryProposalReview,
        issues: categoryProposalReview.issues,
      };
    }
    if (request.candidateSnapshot) {
      const candidateSnapshotReview = reviewCatalogCandidateSnapshot(
        request.candidateSnapshot,
        request.snapshot.keyword,
        request.taxonomySnapshot.digest,
        categoryProposalReview.categories,
        config,
      );
      if (candidateSnapshotReview.status === "rejected") {
        return {
          schemaVersion: "product-selection-run/v1",
          status: "blocked",
          strategyRef: config.ref,
          categoryProposalReview,
          candidateSnapshotReview,
          issues: candidateSnapshotReview.issues,
        };
      }
      if (request.sceneProposal) {
        const sceneProposalReview = reviewSceneProposal(
          request.sceneProposal,
          request.snapshot.keyword,
          request.candidateSnapshot,
          categoryProposalReview.categories,
          config,
        );
        if (sceneProposalReview.status === "rejected") {
          return {
            schemaVersion: "product-selection-run/v1",
            status: "blocked",
            strategyRef: config.ref,
            categoryProposalReview,
            candidateSnapshotReview,
            issues: sceneProposalReview.issues,
          };
        }
        return {
          schemaVersion: "product-selection-run/v1",
          status: "ready",
          categoryProposalReview,
          candidateSnapshotReview,
          sceneProposalReview,
          result: finalizeCategoryRoleSelection(
            request.candidateSnapshot,
            config,
            categoryProposalReview.categories,
            sceneProposalReview,
          ),
        };
      }
      return {
        schemaVersion: "product-selection-run/v1",
        status: "needs-scene-proposal",
        strategyRef: config.ref,
        categoryProposalReview,
        candidateSnapshotReview,
        candidateSnapshotDigest: request.candidateSnapshot.digest,
        context: {
          keyword: request.snapshot.keyword,
          sceneRange: config.modules.startHere.sceneRange,
          groupsPerScene: config.modules.startHere.groupsPerScene,
          products: sceneCandidateProducts(
            request.candidateSnapshot,
            categoryProposalReview.categories,
          ),
        },
      };
    }
    return {
      schemaVersion: "product-selection-run/v1",
      status: "needs-candidate-snapshot",
      strategyRef: config.ref,
      categoryProposalReview,
      context: {
        keyword: request.snapshot.keyword,
        categories: categoryProposalReview.categories,
        retrieval: config.retrieval,
      },
    };
  }

  if (request.taxonomySnapshot) {
    return {
      schemaVersion: "product-selection-run/v1",
      status: "needs-category-proposal",
      strategyRef: config.ref,
      context: {
        keyword: request.snapshot.keyword,
        taxonomyDigest: request.taxonomySnapshot.digest,
        categories: request.taxonomySnapshot.categories.filter(({ enabled }) => enabled),
      },
    };
  }

  return {
    schemaVersion: "product-selection-run/v1",
    status: "blocked",
    strategyRef: config.ref,
    issues: ["CategoryRole selection requires a CatalogTaxonomySnapshot."],
  };
}
