import type { ProductRole } from "../types.js";
import { getProductSelectionStrategyConfig, type ProductSelectionStrategyRef } from "./config.js";
import type { CatalogCandidateSnapshot } from "./contracts.js";

export type CatalogCandidateQualityStatus = "ok" | "warning" | "error";
export type CatalogCandidateQualitySeverity = "medium" | "high";

export type CatalogCandidateQualityIssueCode =
  | "request-failed"
  | "missing-request"
  | "empty-category"
  | "low-category-coverage"
  | "missing-product-reference"
  | "category-membership-mismatch"
  | "duplicate-product-in-category"
  | "cross-category-duplicate"
  | "category-semantic-mismatch"
  | "missing-discovery-product"
  | "unassigned-product";

export interface CatalogCandidateQualityIssue {
  code: CatalogCandidateQualityIssueCode;
  severity: CatalogCandidateQualitySeverity;
  message: string;
  categoryId?: string;
  productId?: string;
  requestId?: string;
  actual?: number;
  expectedMinimum?: number;
}

export interface CatalogCandidateCategoryQuality {
  id: string;
  label: string;
  role: ProductRole;
  productCount: number;
  uniqueProductCount: number;
  missingProductCount: number;
  membershipMismatchCount: number;
  duplicateProductCount: number;
}

export interface CatalogCandidateQualityReport {
  schemaVersion: "catalog-candidate-quality-report/v1";
  snapshotDigest: string;
  strategyRef: ProductSelectionStrategyRef;
  status: CatalogCandidateQualityStatus;
  summary: {
    attempts: { total: number; succeeded: number; failed: number; expected: number };
    categories: { total: number; empty: number; lowCoverage: number };
    products: {
      total: number;
      assigned: number;
      discovery: number;
      unassigned: number;
      crossCategoryDuplicates: number;
    };
  };
  categories: CatalogCandidateCategoryQuality[];
  issues: CatalogCandidateQualityIssue[];
}

const CATEGORY_TOKEN_STOP_WORDS = new Set(["and", "for", "the", "with"]);

function semanticTokens(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.length > 4 && token.endsWith("s") ? token.slice(0, -1) : token)
    .filter((token) => token.length >= 4 && !CATEGORY_TOKEN_STOP_WORDS.has(token));
}

export function analyzeCatalogCandidateQuality(
  snapshot: CatalogCandidateSnapshot,
): CatalogCandidateQualityReport {
  const config = getProductSelectionStrategyConfig(snapshot.strategyRef);
  if (config.engine !== "category-role") {
    throw new Error("Catalog candidate quality requires a category-role strategy.");
  }

  const issues: CatalogCandidateQualityIssue[] = [];
  const productsById = new Map(snapshot.products.map((product) => [product.id, product]));
  const expectedRequestIds = [
    ...snapshot.categories.map(({ id }) => `category:${id}`),
    "discovery",
  ];
  const receivedRequestIds = new Set(snapshot.source.attempts.map(({ requestId }) => requestId));

  snapshot.source.attempts.forEach((attempt) => {
    if (attempt.status === "failed") {
      issues.push({
        code: "request-failed",
        severity: "high",
        requestId: attempt.requestId,
        message: `Candidate request ${attempt.requestId} failed${attempt.errorCode ? ` (${attempt.errorCode})` : ""}.`,
      });
    }
  });
  expectedRequestIds.forEach((requestId) => {
    if (!receivedRequestIds.has(requestId)) {
      issues.push({
        code: "missing-request",
        severity: "high",
        requestId,
        message: `Candidate request ${requestId} is missing from retrieval evidence.`,
      });
    }
  });

  const categoriesByProductId = new Map<string, Set<string>>();
  const categories = snapshot.categories.map((category) => {
    const uniqueProductIds = [...new Set(category.productIds)];
    const duplicateProductCount = category.productIds.length - uniqueProductIds.length;
    let missingProductCount = 0;
    let membershipMismatchCount = 0;

    uniqueProductIds.forEach((productId) => {
      const categoryIds = categoriesByProductId.get(productId) ?? new Set<string>();
      categoryIds.add(category.id);
      categoriesByProductId.set(productId, categoryIds);
      const product = productsById.get(productId);
      if (!product) {
        missingProductCount += 1;
        issues.push({
          code: "missing-product-reference",
          severity: "high",
          categoryId: category.id,
          productId,
          message: `Category ${category.id} references missing product ${productId}.`,
        });
      } else if (String(product.categoryL3Id ?? "") !== category.id) {
        membershipMismatchCount += 1;
        issues.push({
          code: "category-membership-mismatch",
          severity: "medium",
          categoryId: category.id,
          productId,
          message: `Product ${productId} does not belong to category ${category.id}.`,
        });
      }
    });

    if (uniqueProductIds.length === 0) {
      issues.push({
        code: "empty-category",
        severity: "medium",
        categoryId: category.id,
        actual: 0,
        expectedMinimum: config.quality.minimumProductsPerCategory,
        message: `Category ${category.id} returned no matching products.`,
      });
    }
    if (uniqueProductIds.length < config.quality.minimumProductsPerCategory) {
      issues.push({
        code: "low-category-coverage",
        severity: "medium",
        categoryId: category.id,
        actual: uniqueProductIds.length,
        expectedMinimum: config.quality.minimumProductsPerCategory,
        message: `Category ${category.id} has ${uniqueProductIds.length} products; expected at least ${config.quality.minimumProductsPerCategory}.`,
      });
      const categoryTokens = semanticTokens(category.label);
      const titleTokens = new Set(uniqueProductIds.flatMap((productId) =>
        semanticTokens(productsById.get(productId)?.title ?? "")
      ));
      if (
        uniqueProductIds.length > 0 &&
        categoryTokens.length > 0 &&
        !categoryTokens.some((token) => titleTokens.has(token))
      ) {
        issues.push({
          code: "category-semantic-mismatch",
          severity: "medium",
          categoryId: category.id,
          message: `Category ${category.label} has low coverage and its label is not reflected in product titles.`,
        });
      }
    }
    if (duplicateProductCount > 0) {
      issues.push({
        code: "duplicate-product-in-category",
        severity: "medium",
        categoryId: category.id,
        actual: duplicateProductCount,
        message: `Category ${category.id} contains ${duplicateProductCount} duplicate product reference${duplicateProductCount === 1 ? "" : "s"}.`,
      });
    }

    return {
      id: category.id,
      label: category.label,
      role: category.role,
      productCount: category.productIds.length,
      uniqueProductCount: uniqueProductIds.length,
      missingProductCount,
      membershipMismatchCount,
      duplicateProductCount,
    };
  });

  let crossCategoryDuplicates = 0;
  categoriesByProductId.forEach((categoryIds, productId) => {
    if (categoryIds.size <= 1) return;
    crossCategoryDuplicates += 1;
    issues.push({
      code: "cross-category-duplicate",
      severity: "medium",
      productId,
      actual: categoryIds.size,
      message: `Product ${productId} appears in ${categoryIds.size} category buckets.`,
    });
  });

  const discoveryIds = new Set(snapshot.discoveryProductIds);
  discoveryIds.forEach((productId) => {
    if (!productsById.has(productId)) {
      issues.push({
        code: "missing-discovery-product",
        severity: "high",
        productId,
        message: `Discovery pool references missing product ${productId}.`,
      });
    }
  });
  const assignedIds = new Set(categoriesByProductId.keys());
  const unassignedProducts = snapshot.products.filter(({ id }) =>
    !assignedIds.has(id) && !discoveryIds.has(id)
  );
  unassignedProducts.forEach(({ id }) => {
    issues.push({
      code: "unassigned-product",
      severity: "medium",
      productId: id,
      message: `Product ${id} is not assigned to a category or discovery pool.`,
    });
  });

  const failed = snapshot.source.attempts.filter(({ status }) => status === "failed").length;
  const empty = categories.filter(({ uniqueProductCount }) => uniqueProductCount === 0).length;
  const lowCoverage = categories.filter(({ uniqueProductCount }) =>
    uniqueProductCount < config.quality.minimumProductsPerCategory
  ).length;
  const status = issues.some(({ severity }) => severity === "high")
    ? "error"
    : issues.length > 0 ? "warning" : "ok";

  return {
    schemaVersion: "catalog-candidate-quality-report/v1",
    snapshotDigest: snapshot.digest,
    strategyRef: snapshot.strategyRef,
    status,
    summary: {
      attempts: {
        total: snapshot.source.attempts.length,
        succeeded: snapshot.source.attempts.length - failed,
        failed,
        expected: expectedRequestIds.length,
      },
      categories: { total: categories.length, empty, lowCoverage },
      products: {
        total: snapshot.products.length,
        assigned: assignedIds.size,
        discovery: discoveryIds.size,
        unassigned: unassignedProducts.length,
        crossCategoryDuplicates,
      },
    },
    categories,
    issues,
  };
}
