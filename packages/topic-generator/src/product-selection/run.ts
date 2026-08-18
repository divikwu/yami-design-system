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
import { selectByRelevance } from "./relevance.js";

export function advanceProductSelectionRun(
  request: ProductSelectionRequest,
): ProductSelectionRun {
  const config = getProductSelectionStrategyConfig(request.strategyRef);
  if (config.engine === "relevance") {
    return {
      schemaVersion: "product-selection-run/v1",
      status: "ready",
      result: selectByRelevance(request.snapshot, config),
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
