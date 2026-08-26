import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { strFromU8, unzipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TopicGeneratorRunStore,
  type TopicGeneratorDeliverableRenderer,
} from "@yami/topic-generator";

const runtime = vi.hoisted(() => ({ current: undefined as unknown as {
  root: string;
  store: TopicGeneratorRunStore;
  execute: Parameters<TopicGeneratorRunStore["advanceRun"]>[1]["execute"];
  renderer: TopicGeneratorDeliverableRenderer;
} }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/managed-run-runtime", () => ({
  getTopicGeneratorManagedRunRuntime: async () => runtime.current,
}));

import { POST as advanceRun } from "./[runId]/advance/route";
import { GET as downloadRunArchive } from "./[runId]/archive/route";
import { GET as downloadDeliverable } from "./[runId]/deliverables/[name]/route";
import { POST as reviewRun } from "./[runId]/review/route";
import { DELETE as deleteRun, GET as getRun } from "./[runId]/route";
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
      root,
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
      storage: {
        status: "ready",
        runCount: 1,
        root: runtime.current.root,
      },
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
        deliverables: {
          "topic-brief.html": "<!doctype html><title>Matcha</title>",
          "page-draft.html": "<!doctype html><title>Stored preview</title>",
        },
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

    const render = vi.fn(async () =>
      '<!doctype html><meta name="topic-generator-offline-format" content="5">' +
      "<title>Latest preview</title>"
    );
    runtime.current.renderer = { render };
    const preview = await downloadDeliverable(
      new Request("http://localhost/deliverable"),
      { params: Promise.resolve({
        runId: run.manifest.runId,
        name: "page-draft.html",
      }) },
    );
    expect(preview.status).toBe(200);
    expect(await preview.text()).toContain("Stored preview");
    expect(render).not.toHaveBeenCalled();

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
    const render = vi.fn(async () => "<!doctype html><title>Latest preview</title>");
    runtime.current.renderer = { render };
    await writeFile(
      join(runtime.current.store.root, run.manifest.runId, "server-debug.tmp"),
      "must not be exported",
    );

    const response = await downloadRunArchive(
      new Request("http://localhost/archive?type=run"),
      { params: Promise.resolve({ runId: run.manifest.runId }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/zip");
    expect(response.headers.get("content-disposition")).toBe(
      `attachment; filename="${run.manifest.runId}-run-archive.zip"`,
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
      `${directory}archive-manifest.json`,
    ]));
    expect(strFromU8(files[`${directory}run.json`]!)).toContain(run.manifest.runId);
    expect(strFromU8(files[`${directory}deliverables/page-draft.html`]!))
      .toContain("Draft");
    expect(files[`${directory}deliverables/page-preview.html`]).toBeUndefined();
    expect(strFromU8(files[`${directory}deliverables/page-final.html`]!)).toContain("Final");
    expect(Array.from(files[`${directory}assets/products/matcha.png`]!)).toEqual([1, 2, 3, 4]);
    expect(files[`${directory}server-debug.tmp`]).toBeUndefined();
    expect(render).not.toHaveBeenCalled();
  });

  it("downloads a compact bilingual preview package with shared runtime and media", async () => {
    const run = await runtime.current.store.create(runRequest());
    await runtime.current.store.advanceRun(run.manifest.runId, {
      requestId: "preview-package-stage",
      execute: async () => ({
        status: "completed",
        output: { ok: true },
        deliverables: {
          "topic-brief.html": "<!doctype html><title>Brief</title>",
          "page-draft.html": "<!doctype html><title>Stored preview</title>",
        },
      }),
    });
    runtime.current.renderer = {
      async render({ outputLanguage }) {
        return `<!doctype html><html lang="${outputLanguage}"><head><style>body{color:#222}</style></head><body><script id="topic-generator-offline-media" type="application/json">["data:image/webp;base64,AQID"]</script><script id="topic-generator-offline-payload" type="application/json">{"language":"${outputLanguage}"}</script><script type="module">globalThis.__topicPreview=true;</script></body></html>`;
      },
    };

    const response = await downloadRunArchive(
      new Request("http://localhost/archive?type=preview"),
      { params: Promise.resolve({ runId: run.manifest.runId }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe(
      `attachment; filename="${run.manifest.runId}-topic-package.zip"`,
    );
    const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
    const root = `${run.manifest.runId}-topic-package/`;
    expect(Object.keys(files)).toEqual(expect.arrayContaining([
      `${root}README.html`,
      `${root}package-manifest.json`,
      `${root}deliverables/topic-brief.html`,
      `${root}deliverables/page-preview.en.html`,
      `${root}deliverables/page-preview.zh.html`,
      `${root}runtime/topic-page.css`,
      `${root}runtime/topic-page.js`,
    ]));
    expect(Object.keys(files).filter((path) => path.includes("/assets/media/"))).toHaveLength(1);
    expect(strFromU8(files[`${root}deliverables/page-preview.en.html`]!))
      .toContain('<html lang="en">');
    expect(strFromU8(files[`${root}deliverables/page-preview.zh.html`]!))
      .toContain('<html lang="zh">');
    const packageManifest = JSON.parse(
      strFromU8(files[`${root}package-manifest.json`]!),
    ) as { packageType: string; mediaPolicy: string };
    expect(packageManifest).toMatchObject({
      packageType: "bilingual-preview",
      mediaPolicy: "hybrid",
    });
    const readme = strFromU8(files[`${root}README.html`]!);
    expect(readme).toContain("Generated visuals are included in this package");
    expect(readme).toContain("Product images require an internet connection");
  });

  it("packages the final renderer output after automatic completion", async () => {
    const run = await runtime.current.store.create(runRequest());
    for (let index = 0; index < 12; index += 1) {
      await runtime.current.store.advanceRun(run.manifest.runId, {
        requestId: `automatic-package-stage-${index}`,
        execute: async ({ stageId }) => ({
          status: "completed",
          output: { stageId },
          ...(stageId === "user-approval" ? { runStatus: "completed" as const } : {}),
          ...(stageId === "topic-intent"
            ? { deliverables: { "topic-brief.html": "<!doctype html><title>Brief</title>" } }
            : {}),
          ...(stageId === "user-approval"
            ? { deliverables: { "page-final.html": "<!doctype html><title>Final</title>" } }
            : {}),
        }),
      });
    }
    const render = vi.fn(async ({ name, outputLanguage }) =>
      `<!doctype html><html lang="${outputLanguage}"><head><style></style></head><body data-deliverable="${name}"><script id="topic-generator-offline-media" type="application/json">[]</script><script id="topic-generator-offline-payload" type="application/json">{}</script><script type="module"></script></body></html>`
    );
    runtime.current.renderer = { render };

    const response = await downloadRunArchive(
      new Request("http://localhost/archive?type=preview"),
      { params: Promise.resolve({ runId: run.manifest.runId }) },
    );

    expect(response.status).toBe(200);
    expect(render.mock.calls.map(([request]) => request.name)).toEqual([
      "page-final.html",
      "page-final.html",
    ]);
  });

  it("refreshes and persists stale deliverables once when a historical run is loaded", async () => {
    const run = await runtime.current.store.create(runRequest());
    for (let index = 0; index <= 8; index += 1) {
      await runtime.current.store.advanceRun(run.manifest.runId, {
        requestId: `archive-stale-${index}`,
        execute: async ({ stageId }) => ({
          status: "completed",
          output: { stageId },
          ...(index === 0
            ? { deliverables: {
                "topic-brief.html": "<!doctype html><title>Old brief</title>",
                "page-draft.html": "<!doctype html><title>Old preview</title>",
              } }
            : {}),
        }),
      });
    }
    const stale = await runtime.current.store.read(run.manifest.runId);
    stale.state.deliverables.find(({ name }) => name === "page-draft.html")!.generatedAt =
      "2020-01-01T00:00:00.000Z";
    await runtime.current.store.writeState(stale.manifest, stale.state);

    const render = vi.fn(async ({ name, manifest }) => name === "topic-brief.html"
      ? '<!doctype html><meta name="topic-generator-brief-format" content="2">' +
        `<title>Latest brief</title><p>${manifest.runId}</p>`
      : '<!doctype html><meta name="topic-generator-offline-format" content="5">' +
        "<title>Latest preview</title>");
    runtime.current.renderer = { render };

    const first = await getRun(
      new Request("http://localhost/run"),
      { params: Promise.resolve({ runId: run.manifest.runId }) },
    );
    expect(first.status).toBe(200);
    expect(new TextDecoder().decode(await runtime.current.store.readDeliverable(
      run.manifest.runId,
      "page-draft.html",
    ))).toContain("Latest preview");
    expect(new TextDecoder().decode(await runtime.current.store.readDeliverable(
      run.manifest.runId,
      "topic-brief.html",
    ))).toContain("Latest brief");

    const second = await getRun(
      new Request("http://localhost/run"),
      { params: Promise.resolve({ runId: run.manifest.runId }) },
    );
    expect(second.status).toBe(200);
    expect(render).toHaveBeenCalledTimes(2);

    render.mockClear();
    const archive = await downloadRunArchive(
      new Request("http://localhost/archive?type=run"),
      { params: Promise.resolve({ runId: run.manifest.runId }) },
    );
    const files = unzipSync(new Uint8Array(await archive.arrayBuffer()));
    expect(strFromU8(files[
      `${run.manifest.runId}/deliverables/page-draft.html`
    ]!)).toContain("Latest preview");
    expect(strFromU8(files[
      `${run.manifest.runId}/deliverables/topic-brief.html`
    ]!)).toContain("Latest brief");
    expect(render).not.toHaveBeenCalled();
  });
});
