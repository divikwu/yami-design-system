import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TopicGeneratorRunStore } from "@yami/topic-generator";

const runtime = vi.hoisted(() => ({ current: undefined as unknown as {
  store: TopicGeneratorRunStore;
  execute: Parameters<TopicGeneratorRunStore["advanceRun"]>[1]["execute"];
  renderer: { render(): Promise<string> };
} }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/managed-run-runtime", () => ({
  getTopicGeneratorManagedRunRuntime: async () => runtime.current,
}));

import { POST as advanceRun } from "./[runId]/advance/route";
import { GET as downloadRunArchive } from "./[runId]/archive/route";
import { GET as downloadDeliverable } from "./[runId]/deliverables/[name]/route";
import { POST as reviewRun } from "./[runId]/review/route";
import { DELETE as deleteRun } from "./[runId]/route";
import { GET as listRuns, POST as createRun } from "./route";

const roots: string[] = [];

function runRequest() {
  return {
    keyword: "matcha",
    site: "us" as const,
    language: "zh" as const,
    strategy: "relevance" as const,
    goal: "page" as const,
  };
}

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("managed run API routes", () => {
  beforeEach(async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-generator-routes-"));
    roots.push(root);
    runtime.current = {
      store: new TopicGeneratorRunStore({ root }),
      execute: async ({ stageId }) => ({
        status: "completed",
        output: { stageId },
      }),
      renderer: {
        async render() {
          return `<!doctype html><html><title>Final</title><body>${"x".repeat(160)}</body></html>`;
        },
      },
    };
  });

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) =>
      rm(root, { recursive: true, force: true })
    ));
  });

  it("creates, lists, and advances exactly one stage", async () => {
    const createdResponse = await createRun(jsonRequest(
      "http://localhost/api/topic-generator/runs",
      { request: runRequest() },
    ));
    expect(createdResponse.status).toBe(201);
    const created = await createdResponse.json() as { manifest: { runId: string } };

    const listResponse = await listRuns(new Request(
      "http://localhost/api/topic-generator/runs?limit=1",
    ));
    expect(listResponse.status).toBe(200);
    await expect(listResponse.json()).resolves.toMatchObject({
      items: [{ runId: created.manifest.runId }],
      nextCursor: null,
    });

    const advanced = await advanceRun(
      jsonRequest("http://localhost/advance", { requestId: "route-stage-1" }),
      { params: Promise.resolve({ runId: created.manifest.runId }) },
    );
    expect(advanced.status).toBe(200);
    const detail = await advanced.json() as {
      detail: { state: { nextStage: string; stages: Array<Record<string, unknown>> } };
    };
    expect(detail.detail.state.nextStage).toBe("background-evidence");
    expect(detail.detail.state.stages[0]).toMatchObject({
      id: "topic-intent",
      status: "completed",
      attempts: 1,
    });
  });

  it("maps a concurrent advance to 409 RUN_BUSY", async () => {
    const run = await runtime.current.store.create(runRequest());
    let start!: () => void;
    let release!: () => void;
    const started = new Promise<void>((resolve) => { start = resolve; });
    const gate = new Promise<void>((resolve) => { release = resolve; });
    runtime.current.execute = async ({ stageId }) => {
      start();
      await gate;
      return { status: "completed", output: { stageId } };
    };
    const first = advanceRun(
      jsonRequest("http://localhost/advance", { requestId: "route-lock-1" }),
      { params: Promise.resolve({ runId: run.manifest.runId }) },
    );
    await started;
    const conflict = await advanceRun(
      jsonRequest("http://localhost/advance", { requestId: "route-lock-2" }),
      { params: Promise.resolve({ runId: run.manifest.runId }) },
    );
    expect(conflict.status).toBe(409);
    await expect(conflict.json()).resolves.toMatchObject({ code: "RUN_BUSY" });
    release();
    expect((await first).status).toBe(200);
  });

  it("moves a managed run to recoverable trash and removes it from the list", async () => {
    const run = await runtime.current.store.create(runRequest());

    const response = await deleteRun(
      new Request("http://localhost/delete", { method: "DELETE" }),
      { params: Promise.resolve({ runId: run.manifest.runId }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      schemaVersion: "topic-generator-run-deletion/v1",
      runId: run.manifest.runId,
      recoverable: true,
    });
    await expect(runtime.current.store.list()).resolves.toEqual([]);
  });

  it("binds approval to the current package digest", async () => {
    const run = await runtime.current.store.create(runRequest());
    for (let index = 0; index < 11; index += 1) {
      await runtime.current.store.advanceRun(run.manifest.runId, {
        requestId: `review-stage-${index}`,
        execute: async ({ stageId }) => stageId === "experience-review"
          ? {
              status: "completed",
              output: { stageId },
              runStatus: "awaiting-approval",
              reviewPackageDigest: "sha256:current-review",
            }
          : { status: "completed", output: { stageId } },
      });
    }

    const stale = await reviewRun(
      jsonRequest("http://localhost/review", {
        decision: "approve",
        packageDigest: "sha256:stale-review",
      }),
      { params: Promise.resolve({ runId: run.manifest.runId }) },
    );
    expect(stale.status).toBe(400);

    const approved = await reviewRun(
      jsonRequest("http://localhost/review", {
        decision: "approve",
        packageDigest: "sha256:current-review",
      }),
      { params: Promise.resolve({ runId: run.manifest.runId }) },
    );
    expect(approved.status).toBe(200);
    await expect(approved.json()).resolves.toMatchObject({
      state: { status: "completed", nextStage: null },
    });
  });

  it("serves only whitelisted deliverables with explicit inline or attachment headers", async () => {
    const run = await runtime.current.store.create(runRequest());
    await runtime.current.store.advanceRun(run.manifest.runId, {
      requestId: "deliverable-route-stage",
      execute: async () => ({
        status: "completed",
        output: { ok: true },
        deliverables: { "topic-brief.html": "<!doctype html><title>Matcha</title>" },
      }),
    });
    const inline = await downloadDeliverable(
      new Request("http://localhost/deliverable?view=1"),
      { params: Promise.resolve({
        runId: run.manifest.runId,
        name: "topic-brief.html",
      }) },
    );
    expect(inline.status).toBe(200);
    expect(inline.headers.get("content-disposition")).toBe(
      'inline; filename="topic-brief.html"',
    );

    const rejected = await downloadDeliverable(
      new Request("http://localhost/deliverable"),
      { params: Promise.resolve({ runId: run.manifest.runId, name: "../run.json" }) },
    );
    expect(rejected.status).toBe(404);
  });

  it("downloads one complete managed run directory as an importable zip archive", async () => {
    const run = await runtime.current.store.create(runRequest());
    await runtime.current.store.assetStore(run.manifest.runId).put(
      "products/matcha.png",
      new Uint8Array([1, 2, 3, 4]),
    );
    await runtime.current.store.advanceRun(run.manifest.runId, {
      requestId: "archive-route-stage",
      execute: async () => ({
        status: "completed",
        request: { keyword: "matcha" },
        proposal: { title: "Matcha" },
        output: { ok: true },
        deliverables: {
          "topic-brief.html": "<!doctype html><title>Brief</title>",
          "page-draft.html": "<!doctype html><title>Draft</title>",
          "page-final.html": "<!doctype html><title>Final</title>",
        },
      }),
    });
    await writeFile(
      join(runtime.current.store.root, run.manifest.runId, "server-debug.tmp"),
      "must not be exported",
    );

    const response = await downloadRunArchive(
      new Request("http://localhost/archive"),
      { params: Promise.resolve({ runId: run.manifest.runId }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/zip");
    expect(response.headers.get("content-disposition")).toBe(
      `attachment; filename="${run.manifest.runId}.zip"`,
    );
    const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
    const directory = `${run.manifest.runId}/`;
    expect(Object.keys(files)).toEqual(expect.arrayContaining([
      `${directory}run.json`,
      `${directory}state.json`,
      `${directory}events.jsonl`,
      `${directory}stages/topic-intent/attempt-0001/request.json`,
      `${directory}stages/topic-intent/attempt-0001/proposal.json`,
      `${directory}stages/topic-intent/attempt-0001/result.json`,
      `${directory}assets/products/matcha.png`,
      `${directory}deliverables/topic-brief.html`,
      `${directory}deliverables/page-draft.html`,
      `${directory}deliverables/page-final.html`,
    ]));
    expect(strFromU8(files[`${directory}run.json`]!)).toContain(run.manifest.runId);
    expect(strFromU8(files[`${directory}deliverables/page-final.html`]!)).toContain("Final");
    expect(Array.from(files[`${directory}assets/products/matcha.png`]!)).toEqual([1, 2, 3, 4]);
    expect(files[`${directory}server-debug.tmp`]).toBeUndefined();
  });
});
