import type {
  CatalogDataset,
  CatalogSearchRequest,
  CatalogSearchResult,
  CommerceCatalog,
  CategoryTreeRequest,
  CategoryTreeResult,
  NormalizedCatalogSearchRequest,
  PrototypeCatalogSnapshot,
} from "./types";

export type CatalogErrorCode =
  | "invalid_request"
  | "snapshot_mismatch"
  | "request_failed"
  | "invalid_response"
  | "server_only";

export class CatalogError extends Error {
  readonly code: CatalogErrorCode;

  constructor(code: CatalogErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "CatalogError";
    this.code = code;
  }
}

export function normalizeCatalogRequest(request: CatalogSearchRequest) {
  const query = request.query.trim();
  const page = request.page ?? 1;
  const pageSize = request.pageSize ?? 30;
  const sort = request.sort ?? "featured";
  const categoryIds = (request.categoryIds ?? [])
    .map((id) => id.trim())
    .filter((id, index, values) => id.length > 0 && values.indexOf(id) === index);

  if (!query) {
    throw new CatalogError("invalid_request", "Catalog search query is required.");
  }
  if (!Number.isInteger(page) || page < 1) {
    throw new CatalogError("invalid_request", "Catalog page must be a positive integer.");
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 60) {
    throw new CatalogError("invalid_request", "Catalog pageSize must be between 1 and 60.");
  }

  return {
    query,
    locale: request.locale,
    page,
    pageSize,
    sort,
    categoryIds,
  } as const;
}

function sameNormalizedRequest(
  requested: NormalizedCatalogSearchRequest,
  captured: NormalizedCatalogSearchRequest,
) {
  return requested.query.toLocaleLowerCase() === captured.query.toLocaleLowerCase()
    && requested.locale === captured.locale
    && requested.page === captured.page
    && requested.pageSize === captured.pageSize
    && requested.sort === captured.sort
    && requested.categoryIds.length === captured.categoryIds.length
    && requested.categoryIds.every((id, index) => id === captured.categoryIds[index]);
}

function resultFromDataset(
  request: ReturnType<typeof normalizeCatalogRequest>,
  dataset: CatalogDataset,
  mode: "scenario" | "snapshot",
  now: () => Date,
): CatalogSearchResult {
  const start = (request.page - 1) * request.pageSize;
  const total = dataset.total ?? dataset.products.length;
  return {
    request,
    products: dataset.products.slice(start, start + request.pageSize),
    categories: dataset.categories ?? [],
    pagination: {
      page: request.page,
      pageSize: request.pageSize,
      total,
      pageCount: Math.ceil(total / request.pageSize),
    },
    meta: {
      mode,
      source: dataset.id,
      fetchedAt: dataset.capturedAt ?? now().toISOString(),
      cacheStatus: "hit",
    },
  };
}

export class ScenarioCatalogAdapter implements CommerceCatalog {
  constructor(
    private readonly dataset: CatalogDataset,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async search(request: CatalogSearchRequest): Promise<CatalogSearchResult> {
    return resultFromDataset(normalizeCatalogRequest(request), this.dataset, "scenario", this.now);
  }

  async getCategoryTree(request: CategoryTreeRequest): Promise<CategoryTreeResult> {
    if (this.dataset.locale && request.locale !== this.dataset.locale) {
      throw new CatalogError(
        "invalid_request",
        `Scenario ${this.dataset.id} does not match this locale.`,
      );
    }
    return {
      categories: this.dataset.categories ?? [],
      meta: {
        mode: "scenario",
        source: this.dataset.id,
        fetchedAt: this.dataset.capturedAt ?? this.now().toISOString(),
        cacheStatus: "hit",
      },
    };
  }
}

export class SnapshotCatalogAdapter implements CommerceCatalog {
  constructor(private readonly artifact: PrototypeCatalogSnapshot) {}

  async search(request: CatalogSearchRequest): Promise<CatalogSearchResult> {
    const normalized = normalizeCatalogRequest(request);
    const capturedRequest = normalizeCatalogRequest(this.artifact.request);
    if (!sameNormalizedRequest(normalized, capturedRequest)) {
      throw new CatalogError(
        "snapshot_mismatch",
        `Snapshot ${this.artifact.id} does not match this normalized request.`,
      );
    }
    if (
      this.artifact.result.pagination.page !== normalized.page
      || this.artifact.result.pagination.pageSize !== normalized.pageSize
      || this.artifact.result.products.length > normalized.pageSize
    ) {
      throw new CatalogError(
        "invalid_response",
        `Snapshot ${this.artifact.id} contains an invalid captured result.`,
      );
    }
    return {
      request: normalized,
      ...this.artifact.result,
      meta: {
        mode: "snapshot",
        source: this.artifact.id,
        fetchedAt: this.artifact.capturedAt,
        cacheStatus: "hit",
      },
    };
  }

  async getCategoryTree(request: CategoryTreeRequest): Promise<CategoryTreeResult> {
    if (request.locale !== this.artifact.request.locale) {
      throw new CatalogError(
        "snapshot_mismatch",
        `Snapshot ${this.artifact.id} does not match this locale.`,
      );
    }
    return {
      categories: this.artifact.result.categories,
      meta: {
        mode: "snapshot",
        source: this.artifact.id,
        fetchedAt: this.artifact.capturedAt,
        cacheStatus: "hit",
      },
    };
  }
}
