import type { ProductRole, YamiProduct, YamiSite } from "../types.js";
import {
  getProductSelectionStrategyConfig,
  type ProductSelectionSort,
  type ProductSelectionStrategyRef,
} from "./config.js";
import type {
  CatalogCandidateAttempt,
  CatalogCandidateSnapshot,
  SelectedCategoryRole,
} from "./contracts.js";
import { sha256Digest } from "./digest.js";

export interface CatalogCandidateQuery {
  keyword: string;
  site: YamiSite;
  categoryId?: string;
  limit: number;
  sort: ProductSelectionSort;
}

export interface CatalogCandidateAdapter {
  id: string;
  search(query: CatalogCandidateQuery): Promise<YamiProduct[]>;
}

export interface LoadCatalogCandidateSnapshotOptions {
  keyword: string;
  site: YamiSite;
  strategyRef: ProductSelectionStrategyRef;
  taxonomyDigest: string;
  categories: SelectedCategoryRole[];
  adapter: CatalogCandidateAdapter;
  now?: () => Date;
}

export class CatalogCandidateLoadError extends Error {
  readonly attempts: CatalogCandidateAttempt[];

  constructor(message: string, attempts: CatalogCandidateAttempt[]) {
    super(message);
    this.name = "CatalogCandidateLoadError";
    this.attempts = attempts;
  }
}

function errorDetails(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return { errorCode: "request_failed", message: "Catalog candidate request failed." };
  }
  const value = error as { code?: unknown; message?: unknown };
  return {
    errorCode: typeof value.code === "string" ? value.code : "request_failed",
    message: typeof value.message === "string"
      ? value.message
      : "Catalog candidate request failed.",
  };
}

export async function loadCatalogCandidateSnapshot(
  options: LoadCatalogCandidateSnapshotOptions,
): Promise<CatalogCandidateSnapshot> {
  const config = getProductSelectionStrategyConfig(options.strategyRef);
  if (config.engine !== "category-role") {
    throw new CatalogCandidateLoadError(
      `Strategy ${config.ref} does not use category candidate retrieval.`,
      [],
    );
  }

  const attempts: CatalogCandidateAttempt[] = [];
  const productsById = new Map<string, YamiProduct>();
  const categoryResults: CatalogCandidateSnapshot["categories"] = [];
  const runQuery = async (requestId: string, query: CatalogCandidateQuery) => {
    try {
      const products = await options.adapter.search(query);
      attempts.push({ requestId, status: "succeeded" });
      products.forEach((product) => {
        if (!productsById.has(product.id)) productsById.set(product.id, product);
      });
      return products;
    } catch (error) {
      const details = errorDetails(error);
      attempts.push({ requestId, status: "failed", ...details });
      throw new CatalogCandidateLoadError(
        `Catalog candidate request ${requestId} failed: ${details.message}`,
        attempts,
      );
    }
  };

  for (const category of options.categories) {
    const products = await runQuery(`category:${category.id}`, {
      keyword: options.keyword,
      site: options.site,
      categoryId: category.id,
      ...config.retrieval.perCategory,
    });
    categoryResults.push({
      id: category.id,
      label: category.label,
      role: category.role,
      productIds: products
        .filter(({ categoryL3Id }) => String(categoryL3Id ?? "") === category.id)
        .map(({ id }) => id)
        .filter((id, index, all) => all.indexOf(id) === index),
    });
  }

  const discoveryProducts = await runQuery("discovery", {
    keyword: options.keyword,
    site: options.site,
    ...config.retrieval.discoveryPool,
  });
  const fetchedAt = (options.now ?? (() => new Date()))().toISOString();
  const snapshotWithoutDigest = {
    schemaVersion: "catalog-candidate-snapshot/v1" as const,
    strategyRef: config.ref,
    keyword: options.keyword,
    site: options.site,
    taxonomyDigest: options.taxonomyDigest,
    fetchedAt,
    source: { adapterId: options.adapter.id, attempts },
    categories: categoryResults,
    discoveryProductIds: discoveryProducts
      .map(({ id }) => id)
      .filter((id, index, all) => all.indexOf(id) === index),
    products: [...productsById.values()],
  };
  return {
    ...snapshotWithoutDigest,
    digest: sha256Digest(snapshotWithoutDigest),
  };
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function requiredString(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  return value;
}

export function parseCatalogCandidateSnapshot(value: unknown): CatalogCandidateSnapshot {
  const snapshot = record(value, "CatalogCandidateSnapshot");
  if (snapshot.schemaVersion !== "catalog-candidate-snapshot/v1") {
    throw new Error('CatalogCandidateSnapshot schemaVersion must be "catalog-candidate-snapshot/v1".');
  }
  const strategyRef = requiredString(
    snapshot.strategyRef,
    "CatalogCandidateSnapshot strategyRef",
  ) as ProductSelectionStrategyRef;
  const config = getProductSelectionStrategyConfig(strategyRef);
  if (config.engine !== "category-role") {
    throw new Error("CatalogCandidateSnapshot requires a category-role strategy.");
  }
  if (snapshot.site !== "us") throw new Error('CatalogCandidateSnapshot site must be "us".');
  const source = record(snapshot.source, "CatalogCandidateSnapshot source");
  if (!Array.isArray(source.attempts)) {
    throw new Error("CatalogCandidateSnapshot source attempts must be an array.");
  }
  const attempts = source.attempts.map((rawAttempt, index) => {
    const attempt = record(rawAttempt, `CatalogCandidateSnapshot attempt ${index}`);
    const status = attempt.status;
    if (status !== "succeeded" && status !== "failed") {
      throw new Error(`CatalogCandidateSnapshot attempt ${index} has an invalid status.`);
    }
    return {
      requestId: requiredString(attempt.requestId, `CatalogCandidateSnapshot attempt ${index} requestId`),
      status,
      ...(typeof attempt.errorCode === "string" ? { errorCode: attempt.errorCode } : {}),
      ...(typeof attempt.message === "string" ? { message: attempt.message } : {}),
    } satisfies CatalogCandidateAttempt;
  });
  if (!Array.isArray(snapshot.categories)) {
    throw new Error("CatalogCandidateSnapshot categories must be an array.");
  }
  const categories = snapshot.categories.map((rawCategory, index) => {
    const category = record(rawCategory, `CatalogCandidateSnapshot category ${index}`);
    const role = category.role;
    if (role !== "core" && role !== "pairing" && role !== "accessory") {
      throw new Error(`CatalogCandidateSnapshot category ${index} has an invalid role.`);
    }
    if (!Array.isArray(category.productIds) || !category.productIds.every((id) => typeof id === "string")) {
      throw new Error(`CatalogCandidateSnapshot category ${index} productIds must be strings.`);
    }
    return {
      id: requiredString(category.id, `CatalogCandidateSnapshot category ${index} id`),
      label: requiredString(category.label, `CatalogCandidateSnapshot category ${index} label`),
      role: role as ProductRole,
      productIds: category.productIds,
    };
  });
  if (!Array.isArray(snapshot.discoveryProductIds) ||
      !snapshot.discoveryProductIds.every((id) => typeof id === "string")) {
    throw new Error("CatalogCandidateSnapshot discoveryProductIds must be strings.");
  }
  if (!Array.isArray(snapshot.products)) {
    throw new Error("CatalogCandidateSnapshot products must be an array.");
  }
  const products = snapshot.products.map((rawProduct, index) => {
    const product = record(rawProduct, `CatalogCandidateSnapshot product ${index}`);
    if (typeof product.sourceRank !== "number") {
      throw new Error(`CatalogCandidateSnapshot product ${index} sourceRank must be a number.`);
    }
    const optionalNumber = (key: keyof YamiProduct) =>
      typeof product[key] === "number" ? { [key]: product[key] } : {};
    const optionalString = (key: keyof YamiProduct) =>
      typeof product[key] === "string" ? { [key]: product[key] } : {};
    return {
      id: requiredString(product.id, `CatalogCandidateSnapshot product ${index} id`),
      title: requiredString(product.title, `CatalogCandidateSnapshot product ${index} title`),
      brand: requiredString(product.brand, `CatalogCandidateSnapshot product ${index} brand`),
      price: typeof product.price === "string" ? product.price : "",
      imageUrl: requiredString(product.imageUrl, `CatalogCandidateSnapshot product ${index} imageUrl`),
      productUrl: requiredString(product.productUrl, `CatalogCandidateSnapshot product ${index} productUrl`),
      sourceRank: product.sourceRank,
      ...optionalNumber("brandId"),
      ...optionalNumber("categoryL1Id"),
      ...optionalNumber("categoryL2Id"),
      ...optionalNumber("categoryL3Id"),
      ...optionalString("categoryL1Name"),
      ...optionalString("categoryL2Name"),
      ...optionalString("categoryL3Name"),
      ...optionalNumber("soldCount"),
      ...optionalNumber("rating"),
    } satisfies YamiProduct;
  });
  const parsedWithoutDigest = {
    schemaVersion: "catalog-candidate-snapshot/v1" as const,
    strategyRef: config.ref,
    keyword: requiredString(snapshot.keyword, "CatalogCandidateSnapshot keyword"),
    site: "us" as const,
    taxonomyDigest: requiredString(snapshot.taxonomyDigest, "CatalogCandidateSnapshot taxonomyDigest"),
    fetchedAt: requiredString(snapshot.fetchedAt, "CatalogCandidateSnapshot fetchedAt"),
    source: {
      adapterId: requiredString(source.adapterId, "CatalogCandidateSnapshot source adapterId"),
      attempts,
    },
    categories,
    discoveryProductIds: snapshot.discoveryProductIds,
    products,
  };
  const digest = sha256Digest(parsedWithoutDigest);
  if (snapshot.digest !== digest) {
    throw new Error("CatalogCandidateSnapshot digest does not match its product evidence.");
  }
  return { ...parsedWithoutDigest, digest };
}
