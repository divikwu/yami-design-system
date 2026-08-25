import "server-only";

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { Zip, ZipDeflate, ZipPassThrough, strToU8 } from "fflate";
import type {
  ContentLanguage,
  TopicGeneratorDeliverableRenderer,
  TopicGeneratorRunDetail,
  TopicGeneratorRunStore,
} from "@yami/topic-generator";
import { isTopicGeneratorV2RunFilePath } from "./topic-generator-imports";

interface ArchiveFile {
  absolutePath: string;
  relativePath: string;
}

interface ArchiveEntry {
  path: string;
  bytes?: Uint8Array;
  absolutePath?: string;
}

async function listArchiveFiles(directory: string, runDirectory: string): Promise<ArchiveFile[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: ArchiveFile[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listArchiveFiles(absolutePath, runDirectory));
      continue;
    }
    if (!entry.isFile()) continue;
    const relativePath = relative(runDirectory, absolutePath).split("\\").join("/");
    if (isTopicGeneratorV2RunFilePath(relativePath)) files.push({ absolutePath, relativePath });
  }
  return files;
}

function shouldCompress(path: string) {
  return /\.(?:css|html|js|json|jsonl|svg)$/.test(path);
}

function sha256(bytes: Uint8Array | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

async function fileDigest(path: string) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

function zipEntries(entries: ArchiveEntry[], updatedAt: string) {
  let zip: Zip | undefined;
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      zip = new Zip((error, chunk, final) => {
        if (cancelled) return;
        if (error) {
          cancelled = true;
          controller.error(error);
          return;
        }
        controller.enqueue(chunk);
        if (final) controller.close();
      });
      void (async () => {
        try {
          for (const entry of entries) {
            if (cancelled) return;
            const target = shouldCompress(entry.path)
              ? new ZipDeflate(entry.path, { level: 6 })
              : new ZipPassThrough(entry.path);
            target.mtime = new Date(updatedAt);
            zip!.add(target);
            if (entry.bytes) {
              target.push(entry.bytes, true);
              continue;
            }
            for await (const chunk of createReadStream(entry.absolutePath!)) {
              if (cancelled) return;
              target.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
            }
            target.push(new Uint8Array(), true);
          }
          zip!.end();
        } catch (error) {
          if (!cancelled) {
            cancelled = true;
            zip?.terminate();
            controller.error(error);
          }
        }
      })();
    },
    cancel() {
      cancelled = true;
      zip?.terminate();
    },
  });
}

function serialize(value: unknown) {
  return strToU8(`${JSON.stringify(value, null, 2)}\n`);
}

function mediaExtension(mimeType: string) {
  return mimeType === "image/jpeg" ? "jpg"
    : mimeType === "image/svg+xml" ? "svg"
    : mimeType === "image/avif" ? "avif"
    : mimeType === "image/gif" ? "gif"
    : mimeType === "image/png" ? "png"
    : "webp";
}

function decodeDataUrl(value: string) {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(value);
  if (!match) throw new Error("Offline preview media is not a supported data URL.");
  const bytes = match[2]
    ? new Uint8Array(Buffer.from(match[3]!, "base64"))
    : new TextEncoder().encode(decodeURIComponent(match[3]!));
  return { mimeType: match[1]!, bytes };
}

function extractSharedPageFiles(html: string, shared: Map<string, ArchiveEntry>) {
  const styleMatch = /<style>([\s\S]*?)<\/style>/.exec(html);
  const scriptMatch = /<script type="module">([\s\S]*?)<\/script>/.exec(html);
  const mediaMatch = /<script id="topic-generator-offline-media" type="application\/json">([\s\S]*?)<\/script>/.exec(html);
  if (!styleMatch || !scriptMatch || !mediaMatch) {
    throw new Error("Offline preview does not match the portable package format.");
  }
  shared.set("runtime/topic-page.css", {
    path: "runtime/topic-page.css",
    bytes: strToU8(styleMatch[1]!),
  });
  shared.set("runtime/topic-page.js", {
    path: "runtime/topic-page.js",
    bytes: strToU8(scriptMatch[1]!),
  });
  const media = JSON.parse(mediaMatch[1]!) as string[];
  const portableMedia = media.map((value) => {
    const decoded = decodeDataUrl(value);
    const digest = sha256(decoded.bytes);
    const path = `assets/media/${digest}.${mediaExtension(decoded.mimeType)}`;
    shared.set(path, { path, bytes: decoded.bytes });
    return `../${path}`;
  });
  return html
    .replace(styleMatch[0], '<link rel="stylesheet" href="../runtime/topic-page.css">')
    .replace(scriptMatch[0], '<script src="../runtime/topic-page.js"></script>')
    .replace(mediaMatch[1]!, JSON.stringify(portableMedia));
}

function packageReadme(run: TopicGeneratorRunDetail) {
  const ready = run.state.stages.filter(({ status }) => status === "completed").length;
  const status = run.state.status === "completed" ? "Completed"
    : run.state.status === "awaiting-approval" ? "Awaiting approval"
    : "Preview — workflow not yet complete";
  return strToU8(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(run.summary.keyword)} · Topic package</title><style>body{max-width:760px;margin:0 auto;padding:48px 24px;font:16px/1.6 Arial,sans-serif;color:#222}a{color:inherit}code{overflow-wrap:anywhere}.meta{color:#666}</style></head><body><main><p>TOPIC GENERATOR · BILINGUAL PREVIEW PACKAGE</p><h1>${escapeHtml(run.summary.keyword)}</h1><p><strong>${status}</strong></p><p>This package contains independent English and Chinese previews. Both pages share the same product selection, structure, and visual assets; their approved copy is language-specific.</p><ul><li><a href="deliverables/page-preview.en.html">Open English preview</a></li><li><a href="deliverables/page-preview.zh.html">打开中文预览</a></li><li><a href="deliverables/topic-brief.html">Open topic brief</a></li></ul><h2>Media</h2><p>Generated visuals are included in this package and remain available offline. Product images require an internet connection and load from their original Yami CDN URLs.</p><p class="meta">Workflow progress: ${ready}/${run.state.stages.length} stages. Catalog and price information is a snapshot from generation time and may change. This preview is not a publication approval.</p><h2>Traceability</h2><p>Run: <code>${escapeHtml(run.manifest.runId)}</code></p>${run.manifest.parentRunId ? `<p>Parent run: <code>${escapeHtml(run.manifest.parentRunId)}</code></p>` : ""}</main></body></html>`);
}

export async function createTopicGeneratorPreviewArchive(
  store: TopicGeneratorRunStore,
  renderer: TopicGeneratorDeliverableRenderer,
  runId: string,
) {
  const run = await store.detail(runId);
  if (run.schemaVersion !== "topic-generator-run-detail/v1") {
    throw new Error("Legacy runs must be imported before creating a preview package.");
  }
  const stages = { ...run.stageResults };
  if (!stages["page-generation"] && run.retainedVisualPreview) {
    stages["page-generation"] = run.retainedVisualPreview.pageGeneration;
  }
  const shared = new Map<string, ArchiveEntry>();
  const rendered = await Promise.all((["en", "zh"] as const).map(async (language) => {
    const html = await renderer.render({
      name: "page-draft.html",
      manifest: run.manifest,
      stages,
      outputLanguage: language,
    });
    return { language, bytes: strToU8(extractSharedPageFiles(html, shared)) };
  }));
  const brief = await store.readDeliverable(runId, "topic-brief.html");
  const root = `${run.manifest.runId}-topic-package`;
  const contentEntries: ArchiveEntry[] = [
    { path: "README.html", bytes: packageReadme(run) },
    { path: "deliverables/topic-brief.html", bytes: brief },
    ...rendered.map(({ language, bytes }) => ({
      path: `deliverables/page-preview.${language}.html`,
      bytes,
    })),
    ...shared.values(),
  ];
  const files = contentEntries.map(({ path, bytes }) => ({
    path,
    bytes: bytes!.byteLength,
    sha256: sha256(bytes!),
  }));
  const packageManifest = serialize({
    schemaVersion: "topic-generator-package/v1",
    packageType: "bilingual-preview",
    mediaPolicy: "hybrid",
    runId: run.manifest.runId,
    parentRunId: run.manifest.parentRunId ?? null,
    languages: ["en", "zh"] satisfies ContentLanguage[],
    defaultLanguage: "en",
    runStatus: run.state.status,
    nextStage: run.state.nextStage,
    catalogSnapshotAt: ((run.stageResults["topic-intent"] as {
      analysis?: { snapshot?: { fetchedAt?: string } };
    } | undefined)?.analysis?.snapshot?.fetchedAt) ?? null,
    qa: ((run.stageResults["automatic-qa"] as {
      qaReport?: { status?: string; digest?: string };
    } | undefined)?.qaReport) ?? null,
    files,
  });
  const entries = [
    { path: `${root}/package-manifest.json`, bytes: packageManifest },
    ...contentEntries.map((entry) => ({ ...entry, path: `${root}/${entry.path}` })),
  ];
  return {
    fileName: `${run.manifest.runId}-topic-package.zip`,
    stream: zipEntries(entries, run.state.updatedAt),
  };
}

export async function createTopicGeneratorRunArchive(store: TopicGeneratorRunStore, runId: string) {
  const run = await store.detail(runId);
  if (run.schemaVersion !== "topic-generator-run-detail/v1") {
    throw new Error("Legacy runs must be imported before creating an archive.");
  }
  const runDirectory = resolve(store.root, run.manifest.runId);
  const files = await listArchiveFiles(runDirectory, runDirectory);
  const manifestFiles = await Promise.all(files.map(async (file) => ({
    path: file.relativePath,
    bytes: (await stat(file.absolutePath)).size,
    sha256: await fileDigest(file.absolutePath),
  })));
  const archiveManifest = serialize({
    schemaVersion: "topic-generator-run-archive/v1",
    packageType: "importable-run",
    runId: run.manifest.runId,
    exportedAt: new Date().toISOString(),
    files: manifestFiles,
  });
  const root = run.manifest.runId;
  const entries: ArchiveEntry[] = [
    ...files.map((file) => ({ path: `${root}/${file.relativePath}`, absolutePath: file.absolutePath })),
    { path: `${root}/archive-manifest.json`, bytes: archiveManifest },
  ];
  return {
    fileName: `${run.manifest.runId}-run-archive.zip`,
    stream: zipEntries(entries, run.state.updatedAt),
  };
}
