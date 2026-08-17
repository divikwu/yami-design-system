import { fetchYamiCatalogSnapshot } from "./yami-catalog.js";
import { searchYamiProducts } from "./yami-search.js";
import { YAMI_SITE, type YamiSearchSnapshot, type YamiSite } from "./types.js";

export interface CatalogSnapshotRequest {
  keyword: string;
  site: YamiSite;
}

export interface CatalogSnapshotAdapter {
  readonly id: string;
  load(request: CatalogSnapshotRequest): Promise<YamiSearchSnapshot>;
}

export interface CatalogSnapshotAttempt {
  adapterId: string;
  status: "succeeded" | "failed";
  errorCode?: string;
  message?: string;
}

export interface CatalogSnapshotLoad {
  snapshot: YamiSearchSnapshot;
  fallbackUsed: boolean;
  attempts: CatalogSnapshotAttempt[];
}

export interface LoadCatalogSnapshotOptions {
  adapters?: CatalogSnapshotAdapter[];
}

export class CatalogSnapshotLoadError extends Error {
  readonly attempts: CatalogSnapshotAttempt[];

  constructor(attempts: CatalogSnapshotAttempt[]) {
    super("No CatalogSnapshot Adapter returned usable evidence.");
    this.name = "CatalogSnapshotLoadError";
    this.attempts = attempts;
  }
}

function errorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return "unexpected_error";
}

const yamiCatalogAdapter: CatalogSnapshotAdapter = {
  id: "yami-catalog-search",
  async load({ keyword }) {
    return fetchYamiCatalogSnapshot(keyword);
  },
};

const yamiWebSearchAdapter: CatalogSnapshotAdapter = {
  id: "yami-web-search",
  async load({ keyword }) {
    return searchYamiProducts(keyword);
  },
};

export const DEFAULT_CATALOG_SNAPSHOT_ADAPTERS = [
  yamiCatalogAdapter,
  yamiWebSearchAdapter,
] satisfies CatalogSnapshotAdapter[];

export async function loadCatalogSnapshot(
  keyword: string,
  options: LoadCatalogSnapshotOptions = {},
): Promise<CatalogSnapshotLoad> {
  const adapters = options.adapters ?? DEFAULT_CATALOG_SNAPSHOT_ADAPTERS;
  const attempts: CatalogSnapshotAttempt[] = [];
  const request = { keyword: keyword.trim(), site: YAMI_SITE } satisfies CatalogSnapshotRequest;

  for (const [index, adapter] of adapters.entries()) {
    try {
      const snapshot = await adapter.load(request);
      attempts.push({ adapterId: adapter.id, status: "succeeded" });
      return { snapshot, fallbackUsed: index > 0, attempts };
    } catch (error) {
      attempts.push({
        adapterId: adapter.id,
        status: "failed",
        errorCode: errorCode(error),
        message: error instanceof Error ? error.message : "CatalogSnapshot loading failed.",
      });
    }
  }

  throw new CatalogSnapshotLoadError(attempts);
}
