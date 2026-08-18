import type { YamiSite } from "../types.js";
import type {
  CatalogTaxonomyCategory,
  CatalogTaxonomySnapshot,
} from "./contracts.js";
import { sha256Digest } from "./digest.js";

export interface CreateCatalogTaxonomySnapshotOptions {
  site: YamiSite;
  source: CatalogTaxonomySnapshot["source"];
  sourceRef: string;
  fetchedAt: string;
  categories: CatalogTaxonomyCategory[];
}

export interface CreateLandingPageAgentTaxonomySnapshotOptions {
  site: YamiSite;
  sourceRef: string;
  fetchedAt: string;
  tsv: string;
}

export function createCatalogTaxonomySnapshot(
  options: CreateCatalogTaxonomySnapshotOptions,
): CatalogTaxonomySnapshot {
  const snapshotWithoutDigest = {
    schemaVersion: "catalog-taxonomy-snapshot/v1" as const,
    site: options.site,
    source: options.source,
    sourceRef: options.sourceRef,
    fetchedAt: options.fetchedAt,
    categories: options.categories,
  };
  return {
    ...snapshotWithoutDigest,
    digest: sha256Digest(snapshotWithoutDigest),
  };
}

const LANDING_PAGE_AGENT_TAXONOMY_COLUMNS = [
  "category_id",
  "category_name",
  "category_ename",
  "parent_category_id",
  "level",
] as const;

/** Imports the category TSV contract emitted by StoneNan/LandingPageAgent. */
export function createLandingPageAgentTaxonomySnapshot(
  options: CreateLandingPageAgentTaxonomySnapshotOptions,
): CatalogTaxonomySnapshot {
  const lines = options.tsv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  const headers = lines.shift()?.split("\t").map((header) => header.trim()) ?? [];
  LANDING_PAGE_AGENT_TAXONOMY_COLUMNS.forEach((column) => {
    if (!headers.includes(column)) {
      throw new Error(`LandingPageAgent taxonomy TSV is missing column ${column}.`);
    }
  });
  const columnIndex = new Map(headers.map((header, index) => [header, index]));
  const cell = (values: string[], column: typeof LANDING_PAGE_AGENT_TAXONOMY_COLUMNS[number]) =>
    values[columnIndex.get(column) ?? -1]?.trim() ?? "";
  const rows = lines.map((line, index) => {
    const values = line.split("\t");
    const id = cell(values, "category_id");
    const localLabel = cell(values, "category_name");
    const englishLabel = cell(values, "category_ename");
    const label = englishLabel || localLabel;
    const rawParentId = cell(values, "parent_category_id");
    const level = Number(cell(values, "level"));
    if (!id || !label) {
      throw new Error(`LandingPageAgent taxonomy TSV row ${index + 2} requires category_id and a label.`);
    }
    if (!Number.isInteger(level) || level < 0) {
      throw new Error(`LandingPageAgent taxonomy TSV category ${id} has an invalid level.`);
    }
    return {
      id,
      parentId: rawParentId && rawParentId !== "0" ? rawParentId : null,
      label,
      aliases: localLabel && localLabel !== label ? [localLabel] : [],
      level,
    };
  });
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const pathsById = new Map<string, string[]>();
  const buildPath = (id: string, visiting = new Set<string>()): string[] => {
    const cached = pathsById.get(id);
    if (cached) return cached;
    const row = rowsById.get(id);
    if (!row) throw new Error(`LandingPageAgent taxonomy has unknown category ${id}.`);
    if (visiting.has(id)) {
      throw new Error(`LandingPageAgent taxonomy category ${id} has a cyclic parent chain.`);
    }
    visiting.add(id);
    const parentId = row.parentId && rowsById.has(row.parentId) ? row.parentId : null;
    const path = parentId
      ? [...buildPath(parentId, visiting), row.label]
      : [row.label];
    visiting.delete(id);
    pathsById.set(id, path);
    return path;
  };
  const snapshot = createCatalogTaxonomySnapshot({
    site: options.site,
    source: "imported-artifact",
    sourceRef: options.sourceRef,
    fetchedAt: options.fetchedAt,
    categories: rows.map((row) => ({
      ...row,
      parentId: row.parentId && rowsById.has(row.parentId) ? row.parentId : null,
      path: buildPath(row.id),
      enabled: true,
    })),
  });
  return parseCatalogTaxonomySnapshot(snapshot);
}

function objectValue(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("CatalogTaxonomySnapshot must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

export function parseCatalogTaxonomySnapshot(value: unknown): CatalogTaxonomySnapshot {
  const snapshot = objectValue(value);
  if (snapshot.schemaVersion !== "catalog-taxonomy-snapshot/v1") {
    throw new Error('CatalogTaxonomySnapshot schemaVersion must be "catalog-taxonomy-snapshot/v1".');
  }
  if (snapshot.site !== "us") throw new Error('CatalogTaxonomySnapshot site must be "us".');
  if (snapshot.source !== "approved-http" && snapshot.source !== "imported-artifact") {
    throw new Error("CatalogTaxonomySnapshot source is unsupported.");
  }
  if (typeof snapshot.sourceRef !== "string" || !snapshot.sourceRef.trim()) {
    throw new Error("CatalogTaxonomySnapshot sourceRef is required.");
  }
  if (typeof snapshot.fetchedAt !== "string" || !snapshot.fetchedAt.trim()) {
    throw new Error("CatalogTaxonomySnapshot fetchedAt is required.");
  }
  if (!Array.isArray(snapshot.categories)) {
    throw new Error("CatalogTaxonomySnapshot categories must be an array.");
  }

  const seenIds = new Set<string>();
  const categories = snapshot.categories.map((rawCategory, index) => {
    const category = objectValue(rawCategory);
    const id = typeof category.id === "string" ? category.id.trim() : "";
    const parentId = category.parentId === null
      ? null
      : typeof category.parentId === "string" && category.parentId.trim()
        ? category.parentId.trim()
        : undefined;
    const label = typeof category.label === "string" ? category.label.trim() : "";
    if (!id || !label) throw new Error(`CatalogTaxonomySnapshot category ${index} requires id and label.`);
    if (parentId === undefined) {
      throw new Error(`CatalogTaxonomySnapshot category ${id} parentId must be a string or null.`);
    }
    if (seenIds.has(id)) throw new Error(`CatalogTaxonomySnapshot category ${id} is duplicated.`);
    seenIds.add(id);
    if (!Array.isArray(category.aliases) || !category.aliases.every((alias) => typeof alias === "string")) {
      throw new Error(`CatalogTaxonomySnapshot category ${id} aliases must be strings.`);
    }
    if (!Array.isArray(category.path) || !category.path.every((segment) => typeof segment === "string")) {
      throw new Error(`CatalogTaxonomySnapshot category ${id} path must contain strings.`);
    }
    if (typeof category.level !== "number" || typeof category.enabled !== "boolean") {
      throw new Error(`CatalogTaxonomySnapshot category ${id} requires level and enabled.`);
    }
    return {
      id,
      parentId,
      label,
      aliases: category.aliases,
      path: category.path,
      level: category.level,
      enabled: category.enabled,
    } satisfies CatalogTaxonomyCategory;
  });
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  categories.forEach(({ id, parentId }) => {
    if (parentId && !categoriesById.has(parentId)) {
      throw new Error(`CatalogTaxonomySnapshot category ${id} has unknown parent ${parentId}.`);
    }
    const ancestors = new Set([id]);
    let nextParentId = parentId;
    while (nextParentId) {
      if (ancestors.has(nextParentId)) {
        throw new Error(`CatalogTaxonomySnapshot category ${id} has a cyclic parent chain.`);
      }
      ancestors.add(nextParentId);
      nextParentId = categoriesById.get(nextParentId)?.parentId ?? null;
    }
  });
  const parsed = createCatalogTaxonomySnapshot({
    site: snapshot.site,
    source: snapshot.source,
    sourceRef: snapshot.sourceRef,
    fetchedAt: snapshot.fetchedAt,
    categories,
  });
  if (snapshot.digest !== parsed.digest) {
    throw new Error("CatalogTaxonomySnapshot digest does not match its category evidence.");
  }
  return parsed;
}
