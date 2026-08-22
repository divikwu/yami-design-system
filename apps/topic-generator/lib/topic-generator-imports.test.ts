import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildTopicGeneratorRunArtifacts,
  buildTopicPagePlanMatrix,
  TopicGeneratorRunStore,
  writeTopicGeneratorRunArtifacts,
  type TopicIntentAnalysis,
  type ThemeIntent,
} from "@yami/topic-generator";

vi.mock("server-only", () => ({}));

import { TopicGeneratorImportService } from "./topic-generator-imports";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) =>
    rm(root, { recursive: true, force: true })
  ));
});

function digest(bytes: Uint8Array | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function analysis(): TopicIntentAnalysis {
  const intent = {
    schemaVersion: "theme-intent/v2",
    source: "catalog-evidence",
    themeType: "product",
    catalogDomain: "Food",
    attributeSchemaVersion: "catalog-v1",
    entityType: "category",
    canonicalEntity: { id: "matcha", label: "Matcha" },
    shoppingIntent: "find-product",
    shopperAction: "find",
    shoppingGoal: "Find matcha products.",
    needs: ["matcha"],
    conditions: [],
    mustInclude: ["matcha"],
    mustExclude: [],
    searchTerms: ["matcha"],
    categories: [],
    constraints: [],
    evidenceRefs: [],
    candidates: [{
      id: "product:matcha",
      themeType: "product",
      entityType: "category",
      canonicalEntity: { id: "matcha", label: "Matcha" },
      shoppingIntent: "find-product",
      shopperAction: "find",
      score: 0.9,
      evidenceLevel: "high",
      reason: "Catalog evidence.",
      supportingEvidenceIds: [],
      competingCandidateIds: [],
    }],
    decision: {
      status: "resolved",
      selectedCandidateId: "product:matcha",
      evidenceLevel: "high",
      selectedCandidateMargin: null,
      requiresAgentReview: false,
    },
    reason: "Catalog evidence.",
    confidence: 0.9,
  } satisfies ThemeIntent;
  return {
    intent,
    fallbackUsed: false,
    attempts: [],
    proposalReview: {
      status: "not-provided",
      acceptedFields: [],
      rejectedFields: [],
      warnings: [],
    },
    snapshot: {
      keyword: "matcha",
      site: "us",
      sourceUrl: "https://example.com/search?q=matcha",
      fetchedAt: "2026-08-21T00:00:00.000Z",
      products: [],
      intent,
    },
  };
}

async function legacyFiles() {
  const sourceRoot = await mkdtemp(join(tmpdir(), "topic-import-source-"));
  roots.push(sourceRoot);
  const value = analysis();
  const artifacts = buildTopicGeneratorRunArtifacts(
    value,
    buildTopicPagePlanMatrix(value.snapshot),
  );
  const directory = await writeTopicGeneratorRunArtifacts(sourceRoot, artifacts);
  const files = await Promise.all((await readdir(directory)).map(async (path) => {
    const bytes = await readFile(join(directory, path));
    return { path, bytes, size: bytes.byteLength, sha256: digest(bytes) };
  }));
  return { artifacts, directory, files };
}

async function filesBelow(root: string, prefix = ""): Promise<Array<{
  path: string;
  bytes: Buffer;
  size: number;
  sha256: string;
}>> {
  const entries = await readdir(join(root, prefix), { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return filesBelow(root, path);
    const bytes = await readFile(join(root, path));
    return [{ path, bytes, size: bytes.byteLength, sha256: digest(bytes) }];
  }))).flat();
}

describe("Topic Generator directory import", () => {
  it("validates, chunk-uploads, atomically copies, and deduplicates a v1 run", async () => {
    const managedRoot = await mkdtemp(join(tmpdir(), "topic-import-managed-"));
    roots.push(managedRoot);
    const source = await legacyFiles();
    const before = await Promise.all(source.files.map(({ path }) =>
      readFile(join(source.directory, path))
    ));
    const service = new TopicGeneratorImportService(managedRoot);
    const start = await service.start({
      files: source.files.map(({ path, size, sha256 }) => ({ path, size, sha256 })),
      manifests: [{
        path: "run.json",
        contents: (await readFile(join(source.directory, "run.json"), "utf8")),
      }],
    });
    expect(start.candidates).toMatchObject([{
      runId: source.artifacts.manifest.runId,
      schemaVersion: "topic-generator-run/v1",
      valid: true,
    }]);
    for (const file of source.files) {
      let offset = 0;
      while (offset < file.bytes.byteLength) {
        const chunk = file.bytes.subarray(offset, Math.min(offset + 17, file.bytes.byteLength));
        await service.upload(start.id, file.path, offset, chunk);
        offset += chunk.byteLength;
      }
    }
    const committed = await service.commit(start.id, [start.candidates[0]!.id]);
    expect(committed.results).toEqual([{
      runId: source.artifacts.manifest.runId,
      deduplicated: false,
      legacy: true,
    }]);
    const after = await Promise.all(source.files.map(({ path }) =>
      readFile(join(source.directory, path))
    ));
    expect(after).toEqual(before);

    const repeated = await service.start({
      files: source.files.map(({ path, size, sha256 }) => ({ path, size, sha256 })),
      manifests: [{
        path: "run.json",
        contents: await readFile(join(source.directory, "run.json"), "utf8"),
      }],
    });
    for (const file of source.files) {
      await service.upload(repeated.id, file.path, 0, file.bytes);
    }
    await expect(service.commit(repeated.id, [repeated.candidates[0]!.id]))
      .resolves.toEqual({
        results: [{
          runId: source.artifacts.manifest.runId,
          deduplicated: true,
          legacy: true,
        }],
      });
  });

  it("rejects traversal paths before creating an import session", async () => {
    const managedRoot = await mkdtemp(join(tmpdir(), "topic-import-traversal-"));
    roots.push(managedRoot);
    const service = new TopicGeneratorImportService(managedRoot);
    await expect(service.start({
      files: [{ path: "../run.json", size: 2, sha256: digest("{}") }],
      manifests: [{ path: "../run.json", contents: "{}" }],
    })).rejects.toThrow("Import descriptor is invalid");
  });

  it("recognizes a direct-child v2 run, copies it, and deduplicates a second import", async () => {
    const sourceRoot = await mkdtemp(join(tmpdir(), "topic-import-v2-source-"));
    const managedRoot = await mkdtemp(join(tmpdir(), "topic-import-v2-managed-"));
    roots.push(sourceRoot, managedRoot);
    const sourceStore = new TopicGeneratorRunStore({ root: sourceRoot });
    const sourceRun = await sourceStore.create({
      keyword: "ramen",
      site: "us",
      language: "en",
      strategy: "relevance",
      goal: "selection",
    });
    const sourceFiles = await filesBelow(sourceRoot);
    const sourceManifestPath = join(sourceRoot, sourceRun.manifest.runId, "run.json");
    const sourceManifestBefore = await readFile(sourceManifestPath);
    const service = new TopicGeneratorImportService(managedRoot);

    const importOnce = async () => {
      const start = await service.start({
        files: sourceFiles.map(({ path, size, sha256 }) => ({ path, size, sha256 })),
        manifests: [{
          path: `${sourceRun.manifest.runId}/run.json`,
          contents: await readFile(sourceManifestPath, "utf8"),
        }],
      });
      expect(start.candidates).toMatchObject([{
        sourceRoot: sourceRun.manifest.runId,
        runId: sourceRun.manifest.runId,
        schemaVersion: "topic-generator-run/v2",
        valid: true,
      }]);
      for (const file of sourceFiles) {
        await service.upload(start.id, file.path, 0, file.bytes);
      }
      return service.commit(start.id, [start.candidates[0]!.id]);
    };

    await expect(importOnce()).resolves.toEqual({
      results: [{
        runId: sourceRun.manifest.runId,
        deduplicated: false,
        legacy: false,
      }],
    });
    await expect(importOnce()).resolves.toEqual({
      results: [{
        runId: sourceRun.manifest.runId,
        deduplicated: true,
        legacy: false,
      }],
    });
    expect(await readFile(sourceManifestPath)).toEqual(sourceManifestBefore);
    await expect(new TopicGeneratorRunStore({ root: managedRoot }).read(
      sourceRun.manifest.runId,
    )).resolves.toMatchObject({
      manifest: {
        origin: { type: "imported", sourceLabel: sourceRun.manifest.runId },
      },
    });
  });
});
