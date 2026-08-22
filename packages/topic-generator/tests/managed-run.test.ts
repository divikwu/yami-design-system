import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { TopicIntentAnalysis } from "../src/analyze.js";
import {
  TopicGeneratorRunBusyError,
  TopicGeneratorRunStore,
  TopicGeneratorRunValidationError,
} from "../src/managed-run/index.js";
import { buildTopicPagePlanMatrix } from "../src/planner.js";
import {
  buildTopicGeneratorRunArtifacts,
  writeTopicGeneratorRunArtifacts,
} from "../src/run-artifact.js";
import type { ThemeIntent } from "../src/types.js";

function request() {
  return {
    keyword: "matcha",
    site: "us" as const,
    language: "zh" as const,
    strategy: "relevance" as const,
    goal: "page" as const,
  };
}

function analysis(): TopicIntentAnalysis {
  const intent: ThemeIntent = {
    schemaVersion: "theme-intent/v2",
    source: "catalog-evidence",
    themeType: "product",
    catalogDomain: "Food",
    attributeSchemaVersion: "catalog-v1",
    entityType: "category",
    canonicalEntity: { id: "500", label: "Matcha" },
    shoppingIntent: "find-product",
    shopperAction: "find",
    shoppingGoal: "Find matcha products.",
    needs: ["Matcha"],
    conditions: [],
    mustInclude: ["matcha"],
    mustExclude: [],
    searchTerms: ["matcha"],
    categories: [{
      id: "500",
      label: "Matcha",
      path: ["Food", "Tea", "Matcha"],
      evidenceCount: 1,
    }],
    constraints: [{
      id: "core-entity:matcha",
      kind: "core-entity",
      value: "matcha",
      status: "verified",
      evidenceIds: ["catalog-category:500"],
    }],
    evidenceRefs: [{
      id: "catalog-category:500",
      source: "catalog-category",
      label: "Matcha",
    }],
    candidates: [{
      id: "product:category:500:find-product:find",
      themeType: "product",
      entityType: "category",
      canonicalEntity: { id: "500", label: "Matcha" },
      shoppingIntent: "find-product",
      shopperAction: "find",
      score: 0.94,
      evidenceLevel: "high",
      reason: "Exact catalog category evidence.",
      supportingEvidenceIds: ["catalog-category:500"],
      competingCandidateIds: [],
    }],
    decision: {
      status: "resolved",
      selectedCandidateId: "product:category:500:find-product:find",
      evidenceLevel: "high",
      selectedCandidateMargin: null,
      requiresAgentReview: false,
    },
    reason: "Exact catalog category evidence.",
    confidence: 0.94,
  };
  return {
    intent,
    fallbackUsed: false,
    attempts: [{ adapterId: "yami-catalog-search", status: "succeeded" }],
    proposalReview: {
      status: "not-provided",
      acceptedFields: [],
      rejectedFields: [],
      warnings: [],
    },
    snapshot: {
      keyword: "matcha",
      site: "us",
      sourceUrl: "https://example.com/catalog?q=matcha",
      fetchedAt: "2026-08-21T00:00:00.000Z",
      provider: "yami-catalog-search",
      intent,
      products: [{
        id: "1001",
        title: "Matcha powder",
        brand: "Yami",
        price: "$9.99",
        imageUrl: "https://example.com/1001.webp",
        productUrl: "https://example.com/1001",
        sourceRank: 1,
        categoryL1Name: "Food",
        categoryL3Name: "Matcha",
      }],
      evidence: {
        brands: [],
        categories: [{
          id: "500",
          label: "Matcha",
          aliases: ["Matcha"],
          path: ["Food", "Tea", "Matcha"],
          resultCount: 1,
          productCount: 1,
        }],
        attributes: [],
      },
    },
  };
}

describe("TopicGeneratorRunStore", () => {
  it("creates a v2 run, advances one stage, and deduplicates request ids", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-"));
    let tick = 0;
    const store = new TopicGeneratorRunStore({
      root,
      now: () => new Date(Date.UTC(2026, 7, 21, 0, 0, tick++)),
    });
    try {
      const created = await store.create(request());
      expect(created.manifest).toMatchObject({
        schemaVersion: "topic-generator-run/v2",
        request: { keyword: "matcha", goal: "page" },
      });
      expect(created.state.nextStage).toBe("topic-intent");
      let calls = 0;
      const execute = async ({ stageId }: { stageId: string }) => {
        calls += 1;
        return {
          status: "completed" as const,
          request: { keyword: "matcha" },
          proposal: null,
          output: { stageId, value: "ready" },
        };
      };
      const advanced = await store.advanceRun(created.manifest.runId, {
        requestId: "request-1",
        execute,
      });
      expect(advanced.state.stages[0]).toMatchObject({
        id: "topic-intent",
        status: "completed",
        attempts: 1,
      });
      expect(advanced.state.nextStage).toBe("background-evidence");
      const repeated = await store.advanceRun(created.manifest.runId, {
        requestId: "request-1",
        execute,
      });
      expect(calls).toBe(1);
      expect(repeated.state.nextStage).toBe("background-evidence");
      await expect(
        store.readStageResult(created.manifest.runId, "topic-intent"),
      ).resolves.toEqual({ stageId: "topic-intent", value: "ready" });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("does not rerun a blocked content-review stage outside its internal rewrite budget", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-content-review-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const run = await store.create({ ...request(), goal: "content" });
      for (let index = 0; index < 5; index += 1) {
        await store.advanceRun(run.manifest.runId, {
          requestId: `upstream-${index}`,
          execute: async ({ stageId }) => ({
            status: "completed",
            output: { stageId },
          }),
        });
      }

      let reviewExecutions = 0;
      const execute = async () => {
        reviewExecutions += 1;
        return {
          status: "blocked" as const,
          output: { status: "revision-required" },
          issues: ["The bounded content rewrite still requires revision."],
        };
      };
      const blocked = await store.advanceRun(run.manifest.runId, {
        requestId: "content-review-1",
        execute,
      });
      const repeated = await store.advanceRun(run.manifest.runId, {
        requestId: "content-review-2",
        execute,
      });

      expect(reviewExecutions).toBe(1);
      expect(blocked.state.stages.find(({ id }) => id === "content-review"))
        .toMatchObject({ status: "blocked", attempts: 1 });
      expect(repeated.state.stages.find(({ id }) => id === "content-review"))
        .toMatchObject({ status: "blocked", attempts: 1 });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("moves a deleted managed run into the recoverable trash area", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-delete-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const run = await store.create(request());

      const deletion = await store.deleteRun(run.manifest.runId);

      expect(deletion).toMatchObject({
        schemaVersion: "topic-generator-run-deletion/v1",
        runId: run.manifest.runId,
        recoverable: true,
      });
      await expect(store.list()).resolves.toEqual([]);
      const trashEntries = await readdir(join(root, ".trash"));
      expect(trashEntries).toHaveLength(1);
      expect(trashEntries[0]).toMatch(new RegExp(`^${run.manifest.runId}-`));
      await expect(readFile(join(root, ".trash", trashEntries[0]!, "run.json"), "utf8"))
        .resolves.toContain(run.manifest.runId);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("refuses to move a managed run through a symlinked trash directory", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-delete-root-"));
    const outside = await mkdtemp(join(tmpdir(), "topic-generator-managed-delete-outside-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const run = await store.create(request());
      await symlink(outside, join(root, ".trash"), "dir");

      await expect(store.deleteRun(run.manifest.runId)).rejects.toBeInstanceOf(
        TopicGeneratorRunValidationError,
      );
      await expect(store.list()).resolves.toEqual([
        expect.objectContaining({ runId: run.manifest.runId }),
      ]);
      await expect(readdir(outside)).resolves.toEqual([]);
    } finally {
      await Promise.all([
        rm(root, { recursive: true, force: true }),
        rm(outside, { recursive: true, force: true }),
      ]);
    }
  });

  it("keeps one run locked while a stage is executing", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-lock-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const created = await store.create(request());
      let releaseExecution!: () => void;
      const executionGate = new Promise<void>((resolve) => {
        releaseExecution = resolve;
      });
      let started!: () => void;
      const startedGate = new Promise<void>((resolve) => {
        started = resolve;
      });
      const first = store.advanceRun(created.manifest.runId, {
        requestId: "request-lock-1",
        execute: async () => {
          started();
          await executionGate;
          return { status: "completed", output: { ok: true } };
        },
      });
      await startedGate;
      await expect(store.advanceRun(created.manifest.runId, {
        requestId: "request-lock-2",
        execute: async () => ({ status: "completed", output: { ok: true } }),
      })).rejects.toBeInstanceOf(TopicGeneratorRunBusyError);
      await expect(store.deleteRun(created.manifest.runId)).rejects.toBeInstanceOf(
        TopicGeneratorRunBusyError,
      );
      releaseExecution();
      await first;
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("reclaims a fresh lock owned by a process that no longer exists", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-dead-lock-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const run = await store.create(request());
      const lockRoot = join(root, run.manifest.runId, ".run-lock");
      await mkdir(lockRoot);
      await writeFile(join(lockRoot, "owner.json"), `${JSON.stringify({
        pid: 2_147_483_647,
        acquiredAt: new Date().toISOString(),
      }, null, 2)}\n`);

      await expect(store.advanceRun(run.manifest.runId, {
        requestId: "dead-owner-stage",
        execute: async ({ stageId }) => ({
          status: "completed",
          output: { stageId },
        }),
      })).resolves.toMatchObject({
        state: { nextStage: "background-evidence" },
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("recovers a durably written stage result after an interrupted state update", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-recovery-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const run = await store.create(request());
      const statePath = join(root, run.manifest.runId, "state.json");
      const state = JSON.parse(await readFile(statePath, "utf8")) as {
        status: string;
        nextStage: string;
        updatedAt: string;
        stages: Array<Record<string, unknown>>;
      };
      const startedAt = "2026-08-21T00:00:01.000Z";
      const completedAt = "2026-08-21T00:00:02.000Z";
      Object.assign(state.stages[0]!, { status: "running", startedAt });
      state.status = "running";
      state.nextStage = "topic-intent";
      state.updatedAt = startedAt;
      await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
      const output = { recovered: true };
      const outputDigest = createHash("sha256")
        .update(`${JSON.stringify(output, null, 2)}\n`)
        .digest("hex");
      const attemptRoot = join(
        root,
        run.manifest.runId,
        "stages/topic-intent/attempt-0001",
      );
      await mkdir(attemptRoot, { recursive: true });
      await Promise.all([
        writeFile(join(attemptRoot, "request.json"), "null\n"),
        writeFile(join(attemptRoot, "proposal.json"), "null\n"),
        writeFile(join(attemptRoot, "result.json"), `${JSON.stringify({
          schemaVersion: "topic-generator-stage-result/v1",
          requestId: "interrupted-request",
          stageId: "topic-intent",
          attempt: 1,
          status: "completed",
          startedAt,
          completedAt,
          issues: [],
          runRequestDigest: run.manifest.requestDigest,
          upstreamResultDigests: {},
          output,
          outputDigest,
        }, null, 2)}\n`),
      ]);
      let executions = 0;
      const recovered = await store.advanceRun(run.manifest.runId, {
        requestId: "recovery-request",
        execute: async () => {
          executions += 1;
          return { status: "completed", output: { shouldNotRun: true } };
        },
      });
      expect(executions).toBe(0);
      expect(recovered.state.stages[0]).toMatchObject({
        status: "completed",
        attempts: 1,
        resultDigest: outputDigest,
      });
      expect(recovered.state.processedRequests).toContainEqual(expect.objectContaining({
        requestId: "interrupted-request",
        stageId: "topic-intent",
      }));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("derives a child and only reuses stages before the rollback point", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-derive-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const parent = await store.create(request());
      for (const requestId of ["stage-1", "stage-2"]) {
        await store.advanceRun(parent.manifest.runId, {
          requestId,
          execute: async ({ stageId }) => ({
            status: "completed",
            output: { stageId },
          }),
        });
      }
      const child = await store.derive(parent.manifest.runId, {
        origin: "revision",
        rollbackStage: "product-selection",
      });
      expect(child.manifest.parentRunId).toBe(parent.manifest.runId);
      expect(child.manifest.origin.type).toBe("revision");
      expect(child.state.stages.slice(0, 3).map(({ status }) => status)).toEqual([
        "completed",
        "completed",
        "pending",
      ]);
      expect(child.state.nextStage).toBe("product-selection");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("reuses topic evidence when only the selection strategy changes", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-strategy-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const parent = await store.create(request());
      for (const requestId of ["strategy-stage-1", "strategy-stage-2"]) {
        await store.advanceRun(parent.manifest.runId, {
          requestId,
          execute: async ({ stageId }) => ({
            status: "completed",
            output: { stageId },
          }),
        });
      }
      const parentAfterEvidence = await store.read(parent.manifest.runId);
      await expect(store.derive(parent.manifest.runId, {
        origin: "derived",
        rollbackStage: "content-writing",
        request: { strategy: "category-role" },
      })).rejects.toThrow("requires rollback to product-selection");
      const child = await store.derive(parent.manifest.runId, {
        origin: "derived",
        rollbackStage: "product-selection",
        request: { strategy: "category-role" },
      });

      expect(child.manifest).toMatchObject({
        parentRunId: parent.manifest.runId,
        request: { strategy: "category-role" },
      });
      expect(child.state.stages.slice(0, 3).map(({ status }) => status)).toEqual([
        "completed",
        "completed",
        "pending",
      ]);
      expect(child.state.stages.slice(0, 2).map(({ resultDigest }) => resultDigest)).toEqual(
        parentAfterEvidence.state.stages.slice(0, 2).map(({ resultDigest }) => resultDigest),
      );
      expect(await store.readStageResult(child.manifest.runId, "topic-intent")).toEqual({
        stageId: "topic-intent",
      });
      expect(await store.readStageResult(child.manifest.runId, "background-evidence")).toEqual({
        stageId: "background-evidence",
      });
      expect((await store.read(parent.manifest.runId)).manifest.request.strategy).toBe("relevance");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("validates legacy v1 artifact hashes and refuses tampered files", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-legacy-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const artifacts = buildTopicGeneratorRunArtifacts(
        analysis(),
        buildTopicPagePlanMatrix(analysis().snapshot),
      );
      const directory = await writeTopicGeneratorRunArtifacts(root, artifacts);
      const valid = await store.validateLegacy(artifacts.manifest.runId);
      expect(valid).toMatchObject({ valid: true, issues: [] });
      expect((await store.list())[0]).toMatchObject({
        runId: artifacts.manifest.runId,
        legacy: true,
      });
      await writeFile(join(directory, "theme-intent.json"), "{}\n");
      const invalid = await store.validateLegacy(artifacts.manifest.runId);
      expect(invalid.valid).toBe(false);
      expect(invalid.issues).toContain(
        "Legacy artifact digest is invalid: theme-intent.json",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("migrates a valid v1 run into a v2 child without treating the old PagePlan as complete", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-migrate-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const artifacts = buildTopicGeneratorRunArtifacts(
        analysis(),
        buildTopicPagePlanMatrix(analysis().snapshot),
      );
      await writeTopicGeneratorRunArtifacts(root, artifacts);

      const child = await store.migrateLegacy(artifacts.manifest.runId);

      expect(child.manifest).toMatchObject({
        schemaVersion: "topic-generator-run/v2",
        parentRunId: artifacts.manifest.runId,
        origin: { type: "legacy-migration" },
      });
      expect(child.state.stages[0]).toMatchObject({
        id: "topic-intent",
        status: "completed",
        attempts: 1,
      });
      expect(child.state.stages[3]).toMatchObject({
        id: "module-merchandising",
        status: "pending",
      });
      expect(child.state.nextStage).toBe("background-evidence");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects a v2 manifest when its immutable request no longer matches the input digest", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-request-digest-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const run = await store.create(request());
      const path = join(root, run.manifest.runId, "run.json");
      const manifest = JSON.parse(await readFile(path, "utf8")) as {
        request: { keyword: string };
      };
      manifest.request.keyword = "tampered topic";
      await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);

      await expect(store.read(run.manifest.runId)).rejects.toBeInstanceOf(
        TopicGeneratorRunValidationError,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("invalidates and regenerates from the first completed stage with a damaged result", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-reconcile-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const run = await store.create(request());
      await store.advanceRun(run.manifest.runId, {
        requestId: "reconcile-1",
        execute: async () => ({ status: "completed", output: { version: 1 } }),
      });
      const resultPath = join(
        root,
        run.manifest.runId,
        "stages/topic-intent/attempt-0001/result.json",
      );
      const result = JSON.parse(await readFile(resultPath, "utf8")) as {
        output: { version: number };
      };
      result.output.version = 99;
      await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);

      const recovered = await store.advanceRun(run.manifest.runId, {
        requestId: "reconcile-2",
        execute: async ({ stageId }) => ({
          status: "completed",
          output: { stageId, version: 2 },
        }),
      });

      expect(recovered.state.stages[0]).toMatchObject({
        status: "completed",
        attempts: 2,
      });
      expect(recovered.state.nextStage).toBe("background-evidence");
      await expect(
        store.readStageResult(run.manifest.runId, "topic-intent"),
      ).resolves.toMatchObject({ version: 2 });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("binds approval to the current review package and writes page-final.html", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-approval-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const run = await store.create(request());
      for (let index = 0; index < 11; index += 1) {
        await store.advanceRun(run.manifest.runId, {
          requestId: `approval-stage-${index}`,
          execute: async ({ stageId }) => stageId === "experience-review"
            ? {
                status: "completed",
                output: { stageId },
                runStatus: "awaiting-approval",
                reviewPackageDigest: "review-package-digest",
              }
            : { status: "completed", output: { stageId } },
        });
      }
      await expect(
        store.approve(
          run.manifest.runId,
          "wrong-digest",
          `<!doctype html><title>Final</title>${"x".repeat(120)}`,
        ),
      ).rejects.toBeInstanceOf(TopicGeneratorRunValidationError);

      const approved = await store.approve(
        run.manifest.runId,
        "review-package-digest",
        `<!doctype html><html><title>Final</title><body>${"x".repeat(120)}</body></html>`,
      );

      expect(approved.state.status).toBe("completed");
      expect(approved.state.deliverables.find(({ name }) => name === "page-final.html"))
        .toMatchObject({ status: "ready" });
      await expect(store.readDeliverable(run.manifest.runId, "page-final.html"))
        .resolves.toBeInstanceOf(Buffer);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("verifies deliverable bytes before returning them", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-delivery-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const run = await store.create(request());
      const advanced = await store.advanceRun(run.manifest.runId, {
        requestId: "delivery-stage",
        execute: async () => ({
          status: "completed",
          output: { ok: true },
          deliverables: { "topic-brief.html": "<!doctype html><title>Matcha</title>" },
        }),
      });
      const deliverable = advanced.state.deliverables[0];
      expect(deliverable.status).toBe("ready");
      expect(deliverable.sha256).toBe(
        createHash("sha256")
          .update("<!doctype html><title>Matcha</title>")
          .digest("hex"),
      );
      await expect(
        store.readDeliverable(run.manifest.runId, "topic-brief.html"),
      ).resolves.toEqual(Buffer.from("<!doctype html><title>Matcha</title>"));
      await writeFile(
        join(root, run.manifest.runId, "deliverables", "topic-brief.html"),
        "tampered",
      );
      await expect(
        store.readDeliverable(run.manifest.runId, "topic-brief.html"),
      ).rejects.toBeInstanceOf(TopicGeneratorRunValidationError);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("keeps event logs metadata-only when a stage is blocked", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-events-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const run = await store.create(request());
      await store.advanceRun(run.manifest.runId, {
        requestId: "blocked-stage",
        execute: async () => ({
          status: "blocked",
          output: null,
          issues: ["Failed at /Users/example/private/prompt.txt"],
        }),
      });
      const contents = await readFile(
        join(root, run.manifest.runId, "events.jsonl"),
        "utf8",
      );
      const events = contents.trim().split("\n").map((line) => JSON.parse(line) as {
        errorCode?: string;
      });
      expect(contents).not.toContain("/Users/example");
      expect(contents).not.toContain("prompt.txt");
      expect(events.at(-1)?.errorCode).toBe("STAGE_BLOCKED");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("requires a full rollback when immutable run parameters change", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-derive-input-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const run = await store.create(request());
      await expect(store.derive(run.manifest.runId, {
        origin: "derived",
        rollbackStage: "content-writing",
        request: { language: "en" },
      })).rejects.toThrow("requires rollback to topic-intent");
      await expect(store.derive(run.manifest.runId, {
        origin: "derived",
        rollbackStage: "topic-intent",
        request: { language: "en" },
      })).resolves.toMatchObject({
        manifest: { parentRunId: run.manifest.runId, request: { language: "en" } },
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("shows a damaged historical run but marks it non-continuable", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-damaged-list-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const run = await store.create(request());
      await store.advanceRun(run.manifest.runId, {
        requestId: "damaged-list-stage",
        execute: async () => ({ status: "completed", output: { ok: true } }),
      });
      await rm(join(
        root,
        run.manifest.runId,
        "stages/topic-intent/attempt-0001/result.json",
      ));

      await expect(store.list()).resolves.toMatchObject([{
        runId: run.manifest.runId,
        status: "blocked",
        continuable: false,
        diagnostics: [expect.stringContaining("RUN_INTEGRITY_FAILED")],
      }]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("invalidates a downstream stage when its recorded upstream digest no longer matches", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-managed-upstream-"));
    const store = new TopicGeneratorRunStore({ root });
    try {
      const run = await store.create(request());
      for (const requestId of ["upstream-1", "upstream-2"]) {
        await store.advanceRun(run.manifest.runId, {
          requestId,
          execute: async ({ stageId }) => ({
            status: "completed",
            output: { stageId, version: 1 },
          }),
        });
      }
      const resultPath = join(
        root,
        run.manifest.runId,
        "stages/topic-intent/attempt-0001/result.json",
      );
      const result = JSON.parse(await readFile(resultPath, "utf8")) as {
        output: { version: number };
        outputDigest: string;
      };
      result.output.version = 2;
      result.outputDigest = createHash("sha256")
        .update(`${JSON.stringify(result.output, null, 2)}\n`)
        .digest("hex");
      await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`);
      const statePath = join(root, run.manifest.runId, "state.json");
      const state = JSON.parse(await readFile(statePath, "utf8")) as {
        stages: Array<{ resultDigest?: string }>;
      };
      state.stages[0]!.resultDigest = result.outputDigest;
      await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);

      const reconciled = await store.advanceRun(run.manifest.runId, {
        requestId: "upstream-3",
        execute: async ({ stageId }) => ({
          status: "completed",
          output: { stageId, version: 2 },
        }),
      });
      expect(reconciled.state.stages[0]).toMatchObject({
        status: "completed",
        attempts: 1,
      });
      expect(reconciled.state.stages[1]).toMatchObject({
        status: "completed",
        attempts: 2,
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
