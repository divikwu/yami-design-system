import "server-only";

import { access, readFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { build } from "esbuild";
import {
  getProductSelectionStrategyConfig,
  type AutomaticQaStageOutput,
  type BackgroundEvidenceStageOutput,
  type ContentReviewStageOutput,
  type ExperienceReviewStageOutput,
  type ModuleMerchandisingStageOutput,
  type PageGenerationStageOutput,
  type ProductSelectionStageOutput,
  type TopicGeneratorDeliverableRenderRequest,
  type TopicGeneratorDeliverableRenderer,
  type TopicIntentStageOutput,
} from "@yami/topic-generator";

const MAX_MEDIA_FILES = 128;
const MAX_MEDIA_BYTES = 64 * 1024 * 1024;
const OFFLINE_GROUP_PRODUCT_LIMIT = 12;
const OFFLINE_MODULE_PRODUCT_LIMITS: Partial<Record<string, number>> = {
  hero: 4,
  shortcuts: 8,
  "start-here": 24,
  "popular-picks": 24,
  "explore-more": 36,
};
const OFFLINE_MEDIA_REF_PREFIX = "topic-generator-media://";
const DEFAULT_OFFLINE_PREVIEW_LANGUAGE = "en" as const;
const NEUTRAL_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23f3f3f3'/%3E%3C/svg%3E";

interface OfflineBundle {
  javascript: string;
  css: string;
}

interface OfflinePayload {
  mode: "selection" | "content" | "generated";
  showChrome?: boolean;
  pageTypeRef: string;
  plan?: unknown;
  contentSpec?: unknown;
  retainedVisualSpec?: unknown;
  generationSpec?: unknown;
  warnings: string[];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function scriptJson(value: unknown) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function extractOfflineMedia(payload: OfflinePayload) {
  const media: string[] = [];
  const indexes = new Map<string, number>();
  const visit = (value: unknown): unknown => {
    if (typeof value === "string" && value.startsWith("data:image/")) {
      let index = indexes.get(value);
      if (index === undefined) {
        index = media.length;
        indexes.set(value, index);
        media.push(value);
      }
      return `${OFFLINE_MEDIA_REF_PREFIX}${index}`;
    }
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, visit(item)]));
    }
    return value;
  };
  return { payload: visit(payload) as OfflinePayload, media };
}

const OFFLINE_ASSET_MEDIA_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

async function inlineStaticAssetUrls(path: string, source: string) {
  const pattern = /new URL\(\s*(["'])([^"']+\.(?:avif|gif|jpe?g|png|svg|webp))\1\s*,\s*import\.meta\.url\s*,?\s*\)\s*\.href/g;
  const replacements = await Promise.all([...source.matchAll(pattern)].map(async (match) => {
    const assetPath = resolve(dirname(path), match[2]!);
    const mediaType = OFFLINE_ASSET_MEDIA_TYPES[extname(assetPath).toLowerCase()];
    if (!mediaType) throw new Error(`Offline asset type is unsupported: ${assetPath}`);
    const bytes = await readFile(assetPath);
    const start = match.index;
    return {
      end: start + match[0].length,
      start,
      value: JSON.stringify(`data:${mediaType};base64,${bytes.toString("base64")}`),
    };
  }));
  if (replacements.length === 0) return source;
  let cursor = 0;
  return replacements.map(({ start, end, value }) => {
    const chunk = `${source.slice(cursor, start)}${value}`;
    cursor = end;
    return chunk;
  }).join("") + source.slice(cursor);
}

async function offlineEntryPath() {
  const candidates = [
    resolve(process.cwd(), "lib/topic-page-offline-entry.tsx"),
    resolve(process.cwd(), "apps/topic-generator/lib/topic-page-offline-entry.tsx"),
  ];
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue to the workspace-root candidate.
    }
  }
  throw new Error("Topic Generator offline browser entry could not be located.");
}

let bundlePromise: Promise<OfflineBundle> | undefined;

async function buildOfflineBundle(): Promise<OfflineBundle> {
  const result = await build({
    entryPoints: [await offlineEntryPath()],
    bundle: true,
    write: false,
    outdir: "offline",
    platform: "browser",
    format: "iife",
    target: ["es2022"],
    minify: true,
    charset: "utf8",
    legalComments: "none",
    define: {
      "process.env.NODE_ENV": '"production"',
      "import.meta.env.DEV": "false",
    },
    plugins: [{
      name: "inline-static-asset-urls",
      setup(context) {
        context.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async ({ path }) => {
          const source = await readFile(path, "utf8");
          if (!source.includes("import.meta.url")) return undefined;
          const contents = await inlineStaticAssetUrls(path, source);
          if (contents === source) return undefined;
          const extension = extname(path);
          const loader = extension === ".tsx" ? "tsx"
            : extension === ".ts" || extension === ".mts" || extension === ".cts" ? "ts"
            : extension === ".jsx" ? "jsx"
            : "js";
          return { contents, loader, resolveDir: dirname(path) };
        });
      },
    }],
    loader: {
      ".png": "dataurl",
      ".jpg": "dataurl",
      ".jpeg": "dataurl",
      ".webp": "dataurl",
      ".svg": "dataurl",
      ".woff": "dataurl",
      ".woff2": "dataurl",
      ".ttf": "dataurl",
    },
  });
  const javascript = result.outputFiles.find(({ path }) => path.endsWith(".js"))?.text;
  const css = result.outputFiles.find(({ path }) => path.endsWith(".css"))?.text;
  if (!javascript || !css) {
    throw new Error("Offline page bundle did not contain JavaScript and CSS.");
  }
  return { javascript, css };
}

function offlineBundle() {
  bundlePromise ??= buildOfflineBundle();
  return bundlePromise;
}

function remoteProductImageUrl(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("Product media must use HTTPS.");
  return parsed.toString();
}

async function inlineDraftPlan(
  source: ProductSelectionStageOutput["plans"]["en"]["relevance"],
) {
  const plan = structuredClone(source);
  for (const module of plan.modules) {
    const moduleLimit = OFFLINE_MODULE_PRODUCT_LIMITS[module.id];
    if (!moduleLimit) continue;
    const groupProductLimit = module.id === "shortcuts" ? 1 : OFFLINE_GROUP_PRODUCT_LIMIT;
    let remaining = moduleLimit;
    module.groups = module.groups?.flatMap((group) => {
      const productIds = group.productIds.slice(0, Math.min(groupProductLimit, remaining));
      remaining -= productIds.length;
      return productIds.length > 0 ? [{ ...group, productIds }] : [];
    });
    const visibleProductIds = new Set([
      ...module.productIds.slice(0, moduleLimit),
      ...(module.groups ?? []).flatMap(({ productIds }) => productIds),
    ]);
    module.productIds = module.productIds.filter((id) => visibleProductIds.has(id));
  }
  const keptProductIds = new Set<string>();
  for (const module of plan.modules) {
    if (!module.visible) continue;
    const reachableIds = [
      ...module.productIds,
      ...(["start-here", "popular-picks", "brand-spotlight", "explore-more"]
          .includes(module.id)
        ? (module.groups ?? []).flatMap(({ productIds }) => productIds)
        : []),
    ];
    for (const id of reachableIds) {
      if (keptProductIds.size >= MAX_MEDIA_FILES) break;
      keptProductIds.add(id);
    }
  }
  plan.products = plan.products.filter(({ id }) => keptProductIds.has(id));
  plan.pools.primaryIds = plan.pools.primaryIds.filter((id) => keptProductIds.has(id));
  plan.pools.relatedIds = plan.pools.relatedIds.filter((id) => keptProductIds.has(id));
  plan.modules = plan.modules.map((module) => ({
    ...module,
    productIds: module.productIds.filter((id) => keptProductIds.has(id)),
    ...(module.groups
      ? {
          groups: module.groups.flatMap((group) => {
            const productIds = group.productIds.filter((id) => keptProductIds.has(id));
            return productIds.length > 0 ? [{ ...group, productIds }] : [];
          }),
        }
      : {}),
  }));
  const warnings: string[] = [];
  for (const product of plan.products) {
    try {
      product.imageUrl = remoteProductImageUrl(product.imageUrl);
    } catch {
      warnings.push(`Image unavailable for ${product.title}; a neutral placeholder is shown.`);
      product.imageUrl = NEUTRAL_IMAGE;
    }
  }
  return { plan, warnings: [...new Set(warnings)] };
}

async function inlineFinalSpec(
  source: PageGenerationStageOutput["generationSpec"],
  request: TopicGeneratorDeliverableRenderRequest,
) {
  const generationSpec = structuredClone(source);
  for (const module of generationSpec.modules) {
    const moduleLimit = OFFLINE_MODULE_PRODUCT_LIMITS[module.id];
    if (!moduleLimit) continue;
    const groupProductLimit = module.id === "shortcuts" ? 1 : OFFLINE_GROUP_PRODUCT_LIMIT;
    const visibleProductIds = new Set(
      module.products.slice(0, moduleLimit).map(({ id }) => id),
    );
    let remaining = moduleLimit;
    module.groups = module.groups?.flatMap((group) => {
      const productIds = group.productIds.slice(0, Math.min(groupProductLimit, remaining));
      remaining -= productIds.length;
      productIds.forEach((id) => visibleProductIds.add(id));
      return productIds.length > 0 ? [{ ...group, productIds }] : [];
    });
    module.products = module.products.filter(({ id }) => visibleProductIds.has(id));
  }
  const visual = request.stages["visual-generation"] as {
    assetBodies?: Array<{ ref: string; mimeType: string; dataBase64: string }>;
  } | undefined;
  const bodies = new Map((visual?.assetBodies ?? []).map((body) => [body.ref, body]));
  const budget = { files: 0, bytes: 0 };
  for (const module of generationSpec.modules) {
    for (const product of module.products) {
      try {
        product.imageUrl = remoteProductImageUrl(product.imageUrl);
      } catch {
        product.imageUrl = NEUTRAL_IMAGE;
      }
    }
    for (const asset of module.assets) {
      const body = bodies.get(asset.ref);
      if (!body || body.mimeType !== asset.mimeType) {
        throw new Error(`Final media is missing for ${asset.ref}.`);
      }
      const bytes = Buffer.from(body.dataBase64, "base64");
      budget.files += 1;
      budget.bytes += bytes.byteLength;
      if (budget.files > MAX_MEDIA_FILES || budget.bytes > MAX_MEDIA_BYTES) {
        throw new Error("Final offline media limits were exceeded.");
      }
      asset.url = `data:${asset.mimeType};base64,${body.dataBase64}`;
    }
  }
  return generationSpec;
}

function deliveryManifest(
  request: TopicGeneratorDeliverableRenderRequest,
  outputLanguage: "en" | "zh",
  digests: {
    page?: string;
    pagePlan?: string;
    content?: string;
    topicIntent?: string;
    backgroundEvidence?: string;
  } = {},
) {
  const qa = request.stages["automatic-qa"] as AutomaticQaStageOutput | undefined;
  const review = request.stages["experience-review"] as ExperienceReviewStageOutput | undefined;
  return {
    schemaVersion: "topic-generator-delivery-manifest/v1",
    deliverable: request.name,
    runId: request.manifest.runId,
    requestDigest: request.manifest.requestDigest,
    sourceDigest: request.manifest.origin.sourceDigest ?? null,
    workbenchLanguage: request.manifest.request.language,
    outputPageLanguage: outputLanguage,
    topicIntentDigest: digests.topicIntent ?? null,
    backgroundEvidenceDigest: digests.backgroundEvidence ?? null,
    pagePlanDigest: digests.pagePlan ?? null,
    contentDigest: digests.content ?? null,
    pageDigest: digests.page ?? null,
    qaDigest: qa?.qaReport.digest ?? null,
    completion: request.name === "page-final.html"
      ? {
          mode: "automatic",
          qaDigest: qa?.qaReport.digest ?? null,
          reviewPackageDigest: review?.reviewPackage?.digest ?? null,
        }
      : null,
    approval: null,
  };
}

function documentHtml(options: {
  title: string;
  language: "en" | "zh";
  payload: OfflinePayload;
  manifest: unknown;
  bundle: OfflineBundle;
}) {
  const { payload, media } = extractOfflineMedia({
    ...options.payload,
    showChrome: true,
  });
  const html = `<!doctype html>
<html lang="${options.language}" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="topic-generator-offline-format" content="5">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(options.title)}</title>
<style>${options.bundle.css}
html,body,#topic-generator-offline-root{margin:0;min-height:100%}
.topic-generator-offline-warning{margin:16px;padding:12px 16px;border:1px solid var(--border-default);border-radius:var(--radius-component-default);background:var(--background-secondary);font:14px/1.5 var(--font-family-ios)}
.topic-generator-offline-warning ul{margin:6px 0 0;padding-left:20px}
</style>
</head>
<body>
<div id="topic-generator-offline-root"></div>
<script id="topic-generator-delivery-manifest" type="application/json">${scriptJson(options.manifest)}</script>
<script id="topic-generator-offline-media" type="application/json">${scriptJson(media)}</script>
<script id="topic-generator-offline-payload" type="application/json">${scriptJson(payload)}</script>
<script type="module">${options.bundle.javascript}</script>
</body>
</html>`;
  if (/localhost|127\.0\.0\.1|\/_next|\/api\/topic-generator/i.test(html)) {
    throw new Error("Offline HTML contains an internal runtime URL.");
  }
  return html;
}

function topicBriefHtml(request: TopicGeneratorDeliverableRenderRequest) {
  const intent = request.stages["topic-intent"] as TopicIntentStageOutput | undefined;
  const background = request.stages["background-evidence"] as BackgroundEvidenceStageOutput | undefined;
  if (!intent) throw new Error("Topic brief requires a completed topic-intent stage.");
  const evidence = background?.backgroundEvidence;
  const manifest = deliveryManifest(request, DEFAULT_OFFLINE_PREVIEW_LANGUAGE, {
    topicIntent: evidence?.themeIntentDigest,
    backgroundEvidence: evidence?.digest,
  });
  const status = evidence?.status === "ready"
    ? "Ready — verified background context is available"
    : evidence?.status === "partial"
      ? "Partial — review the open evidence issues below"
      : "Unavailable — no verified background context is available";
  const parentRun = request.manifest.parentRunId
    ? `<p><strong>Parent run:</strong> <code>${escapeHtml(request.manifest.parentRunId)}</code></p>`
    : "";
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="topic-generator-brief-format" content="2"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(request.manifest.request.keyword)} · Topic brief</title>
<style>:root{font-family:"GT Walsheim","Noto Sans SC",sans-serif;color:rgba(0,0,0,.87);background:#fff}body{max-width:880px;margin:0 auto;padding:48px 24px;line-height:1.55}h1{font-size:36px;line-height:1.15}h2{margin-top:32px;font-size:22px}dl{display:grid;grid-template-columns:minmax(160px,220px) 1fr;gap:10px 18px}dt{font-weight:500}dd{margin:0}.meta{color:rgba(0,0,0,.55)}.issues{padding:16px 20px;background:#f5f5f5;border-radius:8px}li+li{margin-top:8px}a{color:inherit}code{overflow-wrap:anywhere}@media(max-width:600px){body{padding:32px 16px}dl{grid-template-columns:1fr;gap:4px}dd+dt{margin-top:8px}}</style></head>
<body><main>
<p>TOPIC GENERATOR · TOPIC BRIEF</p>
<h1>${escapeHtml(request.manifest.request.keyword)}</h1>
<h2>Topic intent</h2>
<dl><dt>Theme type</dt><dd>${escapeHtml(intent.analysis.intent.themeType)}</dd><dt>Entity</dt><dd>${escapeHtml(intent.analysis.intent.canonicalEntity?.label ?? "—")}</dd><dt>Shopping goal</dt><dd>${escapeHtml(intent.analysis.intent.shoppingGoal)}</dd><dt>Yami catalog categories</dt><dd>${escapeHtml(intent.analysis.intent.needs.join(", ") || "—")}</dd><dt>Suggested shopping scenarios</dt><dd>${escapeHtml(intent.analysis.intent.conditions.join(", ") || "—")}</dd><dt>Intent resolution confidence</dt><dd>${escapeHtml(String(intent.analysis.intent.confidence))} <span class="meta">(compatibility score)</span></dd><dt>Workbench language</dt><dd>${escapeHtml(request.manifest.request.language)}</dd><dt>Copy preview languages</dt><dd>English (en), Chinese (zh)</dd><dt>Output page language</dt><dd>English (en)</dd></dl>
<p class="meta">Workbench language controls the operating UI and copy preview. Exported topic pages are always generated in English.</p>
<h2>Background evidence</h2>
<p><strong>${escapeHtml(status)}</strong></p>
<p class="meta">This status describes background evidence only; it is not the overall page-generation status.</p>
<dl><dt>Evidence language</dt><dd>${escapeHtml(evidence?.language ?? request.manifest.request.language)}</dd><dt>Catalog snapshot collected</dt><dd>${escapeHtml(intent.analysis.snapshot.fetchedAt)}</dd></dl>
${evidence?.sources.length ? `<h3>Sources</h3><ul>${evidence.sources.map((source) => `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.title)}</a> · ${escapeHtml(source.publisher)} · ${escapeHtml(source.type)}</li>`).join("")}</ul>` : "<p>No verified background sources were recorded.</p>"}
${evidence?.claims.length ? `<h3>Context claims</h3><ul>${evidence.claims.map((claim) => `<li>${escapeHtml(claim.text)} <small>[${escapeHtml(claim.sourceIds.join(", "))}]</small></li>`).join("")}</ul>` : ""}
${evidence?.issues?.length ? `<div class="issues"><strong>Open evidence issues</strong><ul>${evidence.issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul></div>` : "<p>No open background evidence issues were recorded.</p>"}
<h2>Traceability</h2><p><strong>Current run:</strong> <code>${escapeHtml(request.manifest.runId)}</code></p>${parentRun}<p><strong>Request digest:</strong> <code>${escapeHtml(request.manifest.requestDigest)}</code></p><p><strong>Topic intent digest:</strong> <code>${escapeHtml(evidence?.themeIntentDigest ?? "unavailable")}</code></p><p><strong>Background evidence digest:</strong> <code>${escapeHtml(evidence?.digest ?? "unavailable")}</code></p>
</main><script id="topic-generator-delivery-manifest" type="application/json">${scriptJson(manifest)}</script></body></html>`;
}

export function createTopicGeneratorOfflineRenderer(): TopicGeneratorDeliverableRenderer {
  return {
    async render(request) {
      if (request.name === "topic-brief.html") return topicBriefHtml(request);
      const outputLanguage = request.outputLanguage ?? DEFAULT_OFFLINE_PREVIEW_LANGUAGE;
      const selection = request.stages["product-selection"] as ProductSelectionStageOutput | undefined;
      if (!selection) throw new Error("Offline page requires product selection.");
      const bundle = await offlineBundle();
      if (request.name === "page-draft.html") {
        const page = request.stages["page-generation"] as PageGenerationStageOutput | undefined;
        if (page?.generationSpec.language === outputLanguage) {
          const generationSpec = await inlineFinalSpec(page.generationSpec, request);
          return documentHtml({
            title: `${request.manifest.request.keyword} · Preview`,
            language: outputLanguage,
            payload: {
              mode: "generated",
              pageTypeRef: selection.executionPlan.pageTypeRef,
              generationSpec,
              warnings: [],
            },
            manifest: deliveryManifest(request, outputLanguage, {
              page: page.generationSpec.digest,
            }),
            bundle,
          });
        }
        const merchandising = request.stages["module-merchandising"] as
          ModuleMerchandisingStageOutput | undefined;
        if (!merchandising) throw new Error("Draft page requires a compiled PagePlan.");
        const strategy = getProductSelectionStrategyConfig(selection.selection.strategyRef).engine;
        const sourcePlan = merchandising.plans[outputLanguage][strategy] ??
          merchandising.plans[outputLanguage].relevance;
        const { plan, warnings } = await inlineDraftPlan(sourcePlan);
        const content = request.stages["content-review"] as ContentReviewStageOutput | undefined;
        const localizedContent = content?.contentByLanguage?.[outputLanguage] ??
          (content?.contentSpec.language === outputLanguage
            ? { contentSpec: content.contentSpec }
            : undefined);
        if (localizedContent) {
          const retainedVisualSpec = page
            ? await inlineFinalSpec(page.generationSpec, request)
            : undefined;
          if (retainedVisualSpec && retainedVisualSpec.language !== outputLanguage) {
            for (const module of retainedVisualSpec.modules) {
              for (const asset of module.assets) asset.altText = null;
            }
          }
          return documentHtml({
            title: `${request.manifest.request.keyword} · Preview`,
            language: outputLanguage,
            payload: {
              mode: "content",
              pageTypeRef: selection.executionPlan.pageTypeRef,
              plan,
              contentSpec: localizedContent.contentSpec,
              ...(retainedVisualSpec ? { retainedVisualSpec } : {}),
              warnings,
            },
            manifest: deliveryManifest(request, outputLanguage, {
              page: page?.generationSpec.digest,
              content: localizedContent.contentSpec.digest,
            }),
            bundle,
          });
        }
        return documentHtml({
          title: `${request.manifest.request.keyword} · Draft`,
          language: outputLanguage,
          payload: {
            mode: "selection",
            pageTypeRef: selection.executionPlan.pageTypeRef,
            plan,
            warnings,
          },
          manifest: deliveryManifest(request, outputLanguage, {
            pagePlan: merchandising.plan.digest,
          }),
          bundle,
        });
      }
      const page = request.stages["page-generation"] as PageGenerationStageOutput | undefined;
      const qa = request.stages["automatic-qa"] as AutomaticQaStageOutput | undefined;
      const integrityFailure = qa?.qaReport.checks?.some(({ id, status }) =>
        status === "failed" && ["sources", "bindings", "modules", "assets"].includes(id)
      ) ?? false;
      if (!page || !qa?.qaReport || integrityFailure) {
        throw new Error("Final page requires completed integrity QA.");
      }
      const generationSpec = await inlineFinalSpec(page.generationSpec, request);
      return documentHtml({
        title: request.manifest.request.keyword,
        language: outputLanguage,
        payload: {
          mode: "generated",
          pageTypeRef: selection.executionPlan.pageTypeRef,
          generationSpec,
          warnings: [],
        },
        manifest: deliveryManifest(request, outputLanguage, {
          page: page.generationSpec.digest,
        }),
        bundle,
      });
    },
  };
}
