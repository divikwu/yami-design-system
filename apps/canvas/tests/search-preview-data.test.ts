import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { searchPreviewSnapshots } from "../app/data/search-preview-snapshots";
import {
  catalogProductsToProductListItems,
  createSearchPreviewCatalog,
  isSearchPreviewLiveEnabled,
} from "../app/lib/search-preview-data";

describe("Search Preview catalog selection", () => {
  it("keeps each versioned Snapshot digest aligned with its captured content", () => {
    for (const artifact of Object.values(searchPreviewSnapshots)) {
      const { digest, ...content } = artifact;
      const actual = createHash("sha256").update(JSON.stringify(content)).digest("hex");
      expect(digest).toBe(`sha256:${actual}`);
    }
  });

  it("uses a reproducible snapshot for the matching evaluation query", async () => {
    const request = { query: "matcha powder", locale: "en" as const, pageSize: 12 };
    const result = await createSearchPreviewCatalog("snapshot", request, "baseline").search(request);

    expect(result.meta).toMatchObject({
      mode: "snapshot",
      source: "matcha-search-en-2026-08-26-v1",
    });
    expect(catalogProductsToProductListItems(result.products)[0]?.id).toMatch(/^search-/u);
  });

  it("rejects pagination drift instead of re-slicing a captured Snapshot", async () => {
    const request = { query: "matcha powder", locale: "en" as const, page: 2, pageSize: 12 };

    await expect(
      createSearchPreviewCatalog("snapshot", request, "baseline").search(request),
    ).rejects.toMatchObject({ code: "snapshot_mismatch" });
  });

  it("keeps the empty EvaluationScenario deterministic", async () => {
    const request = { query: "matcha powder", locale: "en" as const };
    const result = await createSearchPreviewCatalog("scenario", request, "empty").search(request);

    expect(result.products).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.meta.mode).toBe("scenario");
  });

  it("keeps Live disabled in production unless the host explicitly enables it", () => {
    expect(isSearchPreviewLiveEnabled({}, "production")).toBe(false);
    expect(isSearchPreviewLiveEnabled({ CANVAS_LIVE_CATALOG_ENABLED: "true" }, "production"))
      .toBe(true);
    expect(isSearchPreviewLiveEnabled({}, "development")).toBe(true);
  });
});
