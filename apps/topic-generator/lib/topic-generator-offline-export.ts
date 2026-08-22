import "server-only";

import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";
import {
  getProductSelectionStrategyConfig,
  type AutomaticQaStageOutput,
  type BackgroundEvidenceStageOutput,
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
const NEUTRAL_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%23f3f3f3'/%3E%3C/svg%3E";

interface OfflineBundle {
  javascript: string;
  css: string;
}

interface OfflinePayload {
  mode: "selection" | "generated";
  pageTypeRef: string;
  plan?: unknown;
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
    format: "esm",
    target: ["es2022"],
    minify: true,
    charset: "utf8",
    legalComments: "none",
    define: { "process.env.NODE_ENV": '"production"' },
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

function mediaType(response: Response, url: string) {
  const header = response.headers.get("content-type")?.split(";", 1)[0]?.trim();
  if (header?.startsWith("image/")) return header;
  const extension = new URL(url).pathname.split(".").at(-1)?.toLowerCase();
  return extension === "png" ? "image/png"
    : extension === "jpg" || extension === "jpeg" ? "image/jpeg"
    : extension === "webp" ? "image/webp"
    : undefined;
}

async function inlineUrl(
  url: string,
  fetchMedia: typeof fetch,
  cache: Map<string, string>,
  budget: { files: number; bytes: number },
) {
  if (url.startsWith("data:")) return url;
  const cached = cache.get(url);
  if (cached) return cached;
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Unsupported media URL protocol: ${parsed.protocol}`);
  }
  if (budget.files >= MAX_MEDIA_FILES) throw new Error("Offline media file limit exceeded.");
  const response = await fetchMedia(parsed, { redirect: "follow" });
  if (!response.ok) throw new Error(`Media request failed with ${response.status}.`);
  const type = mediaType(response, parsed.toString());
  if (!type) throw new Error("Media response is not a supported image.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  budget.files += 1;
  budget.bytes += bytes.byteLength;
  if (budget.bytes > MAX_MEDIA_BYTES) throw new Error("Offline media byte limit exceeded.");
  const dataUri = `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
  cache.set(url, dataUri);
  return dataUri;
}

async function inlineDraftPlan(
  source: ProductSelectionStageOutput["plans"]["en"]["relevance"],
  fetchMedia: typeof fetch,
) {
  const plan = structuredClone(source);
  const warnings: string[] = [];
  const cache = new Map<string, string>();
  const budget = { files: 0, bytes: 0 };
  for (const product of plan.products) {
    try {
      product.imageUrl = await inlineUrl(product.imageUrl, fetchMedia, cache, budget);
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
  fetchMedia: typeof fetch,
) {
  const generationSpec = structuredClone(source);
  for (const module of generationSpec.modules) {
    if (module.id !== "explore-more") continue;
    const visibleProductIds = new Set(
      module.products.slice(0, 12).map(({ id }) => id),
    );
    module.groups = module.groups?.map((group) => {
      const productIds = group.productIds.slice(0, 12);
      productIds.forEach((id) => visibleProductIds.add(id));
      return { ...group, productIds };
    });
    module.products = module.products.filter(({ id }) => visibleProductIds.has(id));
  }
  const visual = request.stages["visual-generation"] as {
    assetBodies?: Array<{ ref: string; mimeType: string; dataBase64: string }>;
  } | undefined;
  const bodies = new Map((visual?.assetBodies ?? []).map((body) => [body.ref, body]));
  const cache = new Map<string, string>();
  const budget = { files: 0, bytes: 0 };
  for (const module of generationSpec.modules) {
    for (const product of module.products) {
      product.imageUrl = await inlineUrl(product.imageUrl, fetchMedia, cache, budget);
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
  pageDigest?: string,
) {
  const qa = request.stages["automatic-qa"] as AutomaticQaStageOutput | undefined;
  const review = request.stages["experience-review"] as ExperienceReviewStageOutput | undefined;
  return {
    schemaVersion: "topic-generator-delivery-manifest/v1",
    deliverable: request.name,
    runId: request.manifest.runId,
    requestDigest: request.manifest.requestDigest,
    sourceDigest: request.manifest.origin.sourceDigest ?? null,
    pageDigest: pageDigest ?? null,
    qaDigest: qa?.qaReport.digest ?? null,
    approval: request.name === "page-final.html"
      ? { decision: "approved", packageDigest: review?.reviewPackage.digest ?? null }
      : null,
  };
}

function documentHtml(options: {
  title: string;
  language: "en" | "zh";
  payload: OfflinePayload;
  manifest: unknown;
  bundle: OfflineBundle;
}) {
  const html = `<!doctype html>
<html lang="${options.language}" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(options.title)}</title>
<style>${options.bundle.css}
html,body,#topic-generator-offline-root{margin:0;min-height:100%}
[data-offline-page] [data-slot="topic-landing-global-header"],[data-offline-page] [data-slot="topic-landing-activity-header"]{display:none}
.topic-generator-offline-warning{margin:16px;padding:12px 16px;border:1px solid var(--border-secondary);border-radius:var(--radius-md);background:var(--background-secondary);font:14px/1.5 var(--font-family-ios)}
.topic-generator-offline-warning ul{margin:6px 0 0;padding-left:20px}
</style>
</head>
<body>
<div id="topic-generator-offline-root"></div>
<script id="topic-generator-delivery-manifest" type="application/json">${scriptJson(options.manifest)}</script>
<script id="topic-generator-offline-payload" type="application/json">${scriptJson(options.payload)}</script>
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
  const manifest = deliveryManifest(
    request,
    background?.backgroundEvidence.themeIntentDigest ?? request.manifest.requestDigest,
  );
  return `<!doctype html>
<html lang="${request.manifest.request.language}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(request.manifest.request.keyword)} · Topic brief</title>
<style>:root{font-family:Arial,sans-serif;color:#1f1f1f;background:#fff}body{max-width:880px;margin:0 auto;padding:48px 24px;line-height:1.55}h1{font-size:36px;line-height:1.15}h2{margin-top:32px;font-size:22px}dl{display:grid;grid-template-columns:minmax(120px,180px) 1fr;gap:10px 18px}dt{font-weight:700}dd{margin:0}.issues{padding:16px 20px;background:#f5f5f5;border-radius:8px}li+li{margin-top:8px}a{color:inherit}code{overflow-wrap:anywhere}</style></head>
<body><main>
<p>TOPIC GENERATOR · ${escapeHtml(request.manifest.runId)}</p>
<h1>${escapeHtml(request.manifest.request.keyword)}</h1>
<h2>Topic intent</h2>
<dl><dt>Theme</dt><dd>${escapeHtml(intent.analysis.intent.themeType)}</dd><dt>Entity</dt><dd>${escapeHtml(intent.analysis.intent.canonicalEntity?.label ?? "—")}</dd><dt>Shopping goal</dt><dd>${escapeHtml(intent.analysis.intent.shoppingGoal)}</dd><dt>Needs</dt><dd>${escapeHtml(intent.analysis.intent.needs.join(", ") || "—")}</dd><dt>Conditions</dt><dd>${escapeHtml(intent.analysis.intent.conditions.join(", ") || "—")}</dd><dt>Confidence</dt><dd>${escapeHtml(String(intent.analysis.intent.confidence))}</dd><dt>Language</dt><dd>${escapeHtml(request.manifest.request.language)}</dd></dl>
<h2>Background evidence</h2>
<p>Status: <strong>${escapeHtml(evidence?.status ?? "unavailable")}</strong></p>
${evidence?.sources.length ? `<h3>Sources</h3><ul>${evidence.sources.map((source) => `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.title)}</a> · ${escapeHtml(source.publisher)} · ${escapeHtml(source.type)}</li>`).join("")}</ul>` : "<p>No verified background sources were recorded.</p>"}
${evidence?.claims.length ? `<h3>Context claims</h3><ul>${evidence.claims.map((claim) => `<li>${escapeHtml(claim.text)} <small>[${escapeHtml(claim.sourceIds.join(", "))}]</small></li>`).join("")}</ul>` : ""}
${evidence?.issues?.length ? `<div class="issues"><strong>Open issues</strong><ul>${evidence.issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul></div>` : "<p>No blocking evidence issues were recorded.</p>"}
<h2>Traceability</h2><p>Request digest: <code>${escapeHtml(request.manifest.requestDigest)}</code></p>
</main><script id="topic-generator-delivery-manifest" type="application/json">${scriptJson(manifest)}</script></body></html>`;
}

export function createTopicGeneratorOfflineRenderer(options: {
  fetch?: typeof fetch;
} = {}): TopicGeneratorDeliverableRenderer {
  const fetchMedia = options.fetch ?? fetch;
  return {
    async render(request) {
      if (request.name === "topic-brief.html") return topicBriefHtml(request);
      const selection = request.stages["product-selection"] as ProductSelectionStageOutput | undefined;
      if (!selection) throw new Error("Offline page requires product selection.");
      const bundle = await offlineBundle();
      if (request.name === "page-draft.html") {
        const merchandising = request.stages["module-merchandising"] as
          ModuleMerchandisingStageOutput | undefined;
        if (!merchandising) throw new Error("Draft page requires a compiled PagePlan.");
        const strategy = getProductSelectionStrategyConfig(selection.selection.strategyRef).engine;
        const sourcePlan = merchandising.plans[request.manifest.request.language][strategy] ??
          merchandising.plans[request.manifest.request.language].relevance;
        const { plan, warnings } = await inlineDraftPlan(sourcePlan, fetchMedia);
        return documentHtml({
          title: `${request.manifest.request.keyword} · Draft`,
          language: request.manifest.request.language,
          payload: {
            mode: "selection",
            pageTypeRef: selection.executionPlan.pageTypeRef,
            plan,
            warnings,
          },
          manifest: deliveryManifest(request, merchandising.plan.digest),
          bundle,
        });
      }
      const page = request.stages["page-generation"] as PageGenerationStageOutput | undefined;
      const qa = request.stages["automatic-qa"] as AutomaticQaStageOutput | undefined;
      const review = request.stages["experience-review"] as ExperienceReviewStageOutput | undefined;
      if (!page || qa?.qaReport.status !== "passed" ||
          review?.experienceReview.status !== "review-recommended" ||
          review.experienceReview.recommendation !== "recommend-approval" ||
          review.reviewPackage.status !== "review-ready" || !review.reviewPackage.digest) {
        throw new Error("Final page requires passed QA and a complete review package.");
      }
      const generationSpec = await inlineFinalSpec(page.generationSpec, request, fetchMedia);
      return documentHtml({
        title: request.manifest.request.keyword,
        language: request.manifest.request.language,
        payload: {
          mode: "generated",
          pageTypeRef: selection.executionPlan.pageTypeRef,
          generationSpec,
          warnings: [],
        },
        manifest: deliveryManifest(request, page.generationSpec.digest),
        bundle,
      });
    },
  };
}
