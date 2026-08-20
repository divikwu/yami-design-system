import { createHash } from "node:crypto";

import sharp from "sharp";

const ALLOWED_IMAGE_HOSTS = new Set(["cdn.yamibuy.net"]);
const BACKGROUND_COLOR = "#f4f3ef";
const DEFAULT_MAX_REDIRECTS = 2;
const DEFAULT_MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const DEFAULT_MAX_OUTPUT_BYTES = 12 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_OUTPUT_DIMENSION = 4_096;
const MAX_OUTPUT_PIXELS = 20_000_000;
const MAX_SOURCE_PIXELS = 40_000_000;
const MAX_TASKS = 64;

type VisualAssetKind = "hero-image" | "shortcut-image" | "scene-image" | "brand-banner";
type VisualAspectRatio = "16:9" | "1:1" | "111:40";
type ContentLanguage = "en" | "zh";

interface SourceProduct {
  id: string;
  title: string;
  brand: string;
  imageUrl: string;
}

interface SourceVisualTask {
  taskId: string;
  moduleId: string;
  component: string;
  kind: VisualAssetKind;
  targetAspectRatio: VisualAspectRatio;
  minimumWidth: number;
  minimumHeight: number;
  altTextMode: "required" | "decorative";
  requiresBackgroundColor: boolean;
  products: SourceProduct[];
}

interface SourceVisualContext {
  keyword: string;
  site: "us";
  language: ContentLanguage;
  topicPagePlanDigest: string;
  topicPageContentSpecDigest: string;
  themeIntentDigest: string;
  productSelectionDigest: string;
  productionMode: "source-product-images";
  tasks: SourceVisualTask[];
}

export interface SourceImageCompositorInput {
  stage: unknown;
  run: unknown;
}

export interface SourceImageCompositorOptions {
  fetch?: typeof globalThis.fetch;
  maxOutputBytes?: number;
  maxRedirects?: number;
  maxSourceBytes?: number;
  timeoutMs?: number;
}

export class SourceImageCompositorError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "SourceImageCompositorError";
    this.code = code;
  }
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function requiredString(value: unknown, path: string) {
  const result = typeof value === "string" ? value.trim() : "";
  if (!result) {
    throw new SourceImageCompositorError("invalid_visual_run", `${path} must be a non-empty string.`);
  }
  return result;
}

function requiredInteger(value: unknown, path: string) {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new SourceImageCompositorError("invalid_visual_run", `${path} must be a positive integer.`);
  }
  return value as number;
}

const TASK_RULES: Record<VisualAssetKind, {
  component: string;
  ratio: VisualAspectRatio;
  altTextMode: "required" | "decorative";
  requiresBackgroundColor: boolean;
  minimumWidth: number;
  minimumHeight: number;
  maximumProducts: number;
}> = {
  "hero-image": {
    component: "ThemeHero",
    ratio: "16:9",
    altTextMode: "required",
    requiresBackgroundColor: true,
    minimumWidth: 1200,
    minimumHeight: 675,
    maximumProducts: 8,
  },
  "shortcut-image": {
    component: "ShortcutRail",
    ratio: "1:1",
    altTextMode: "decorative",
    requiresBackgroundColor: false,
    minimumWidth: 512,
    minimumHeight: 512,
    maximumProducts: 8,
  },
  "scene-image": {
    component: "ThemeProductList",
    ratio: "1:1",
    altTextMode: "required",
    requiresBackgroundColor: true,
    minimumWidth: 1024,
    minimumHeight: 1024,
    maximumProducts: 8,
  },
  "brand-banner": {
    component: "BrandProductRail",
    ratio: "111:40",
    altTextMode: "required",
    requiresBackgroundColor: false,
    minimumWidth: 888,
    minimumHeight: 320,
    maximumProducts: 18,
  },
};

function parseProduct(value: unknown, path: string): SourceProduct {
  const product = objectValue(value);
  if (!product) {
    throw new SourceImageCompositorError("invalid_visual_run", `${path} must be an object.`);
  }
  if (typeof product.imageUrl !== "string" || !product.imageUrl.trim()) {
    throw new SourceImageCompositorError(
      "source_image_missing",
      `${path} requires a catalog image URL.`,
    );
  }
  return {
    id: requiredString(product.id, `${path}.id`),
    title: requiredString(product.title, `${path}.title`),
    brand: typeof product.brand === "string" ? product.brand.trim() : "",
    imageUrl: product.imageUrl.trim(),
  };
}

function parseTask(value: unknown, index: number): SourceVisualTask {
  const path = `run.context.tasks[${index}]`;
  const task = objectValue(value);
  if (!task) {
    throw new SourceImageCompositorError("invalid_visual_run", `${path} must be an object.`);
  }
  const rawKind = requiredString(task.kind, `${path}.kind`);
  if (!Object.hasOwn(TASK_RULES, rawKind)) {
    throw new SourceImageCompositorError("invalid_visual_run", `${path}.kind is unsupported.`);
  }
  const kind = rawKind as VisualAssetKind;
  const rule = TASK_RULES[kind];
  const component = requiredString(task.component, `${path}.component`);
  const targetAspectRatio = requiredString(
    task.targetAspectRatio,
    `${path}.targetAspectRatio`,
  ) as VisualAspectRatio;
  if (component !== rule.component || targetAspectRatio !== rule.ratio ||
      task.altTextMode !== rule.altTextMode ||
      (task.requiresBackgroundColor === true) !== rule.requiresBackgroundColor) {
    throw new SourceImageCompositorError(
      "invalid_visual_run",
      `${path} does not match the maintained ${kind} slot.`,
    );
  }
  const minimumWidth = requiredInteger(task.minimumWidth, `${path}.minimumWidth`);
  const minimumHeight = requiredInteger(task.minimumHeight, `${path}.minimumHeight`);
  if (minimumWidth < rule.minimumWidth || minimumHeight < rule.minimumHeight) {
    throw new SourceImageCompositorError(
      "invalid_visual_run",
      `${path} is smaller than the maintained ${kind} slot.`,
    );
  }
  if (minimumWidth > MAX_OUTPUT_DIMENSION || minimumHeight > MAX_OUTPUT_DIMENSION ||
      minimumWidth * minimumHeight > MAX_OUTPUT_PIXELS) {
    throw new SourceImageCompositorError(
      "visual_dimensions_too_large",
      `${path} exceeds the local composition dimension limit.`,
    );
  }
  if (!Array.isArray(task.products) || task.products.length === 0) {
    throw new SourceImageCompositorError(
      "source_image_missing",
      `${path} requires at least one assigned product image.`,
    );
  }
  if (task.products.length > rule.maximumProducts) {
    throw new SourceImageCompositorError(
      "invalid_visual_run",
      `${path} exceeds the assigned product limit.`,
    );
  }
  return {
    taskId: requiredString(task.taskId, `${path}.taskId`),
    moduleId: requiredString(task.moduleId, `${path}.moduleId`),
    component,
    kind,
    targetAspectRatio,
    minimumWidth,
    minimumHeight,
    altTextMode: rule.altTextMode,
    requiresBackgroundColor: rule.requiresBackgroundColor,
    products: task.products.map((product, productIndex) =>
      parseProduct(product, `${path}.products[${productIndex}]`)
    ),
  };
}

function parseInput(input: SourceImageCompositorInput): SourceVisualContext {
  if (input.stage !== "visual-generation") {
    throw new SourceImageCompositorError(
      "unsupported_visual_request",
      "Source image composition only handles the visual-generation stage.",
    );
  }
  const run = objectValue(input.run);
  if (run?.schemaVersion !== "topic-page-visual-run/v1" ||
      run.status !== "needs-visual-proposal") {
    throw new SourceImageCompositorError(
      "unsupported_visual_request",
      "Source image composition requires a needs-visual-proposal run.",
    );
  }
  const context = objectValue(run.context);
  if (!context || context.productionMode !== "source-product-images") {
    throw new SourceImageCompositorError(
      "unsupported_visual_request",
      "Source image composition requires source-product-images mode.",
    );
  }
  if (!Array.isArray(context.tasks) || context.tasks.length === 0) {
    throw new SourceImageCompositorError(
      "invalid_visual_run",
      "run.context.tasks must contain at least one visual task.",
    );
  }
  if (context.tasks.length > MAX_TASKS) {
    throw new SourceImageCompositorError(
      "invalid_visual_run",
      "run.context.tasks exceeds the local composition task limit.",
    );
  }
  const language = context.language;
  if (language !== "en" && language !== "zh") {
    throw new SourceImageCompositorError(
      "invalid_visual_run",
      "run.context.language must be en or zh.",
    );
  }
  if (context.site !== "us") {
    throw new SourceImageCompositorError("invalid_visual_run", "run.context.site must be us.");
  }
  const tasks = context.tasks.map(parseTask);
  if (new Set(tasks.map(({ taskId }) => taskId)).size !== tasks.length) {
    throw new SourceImageCompositorError(
      "invalid_visual_run",
      "run.context.tasks must use unique task IDs.",
    );
  }
  return {
    keyword: requiredString(context.keyword, "run.context.keyword"),
    site: "us",
    language,
    topicPagePlanDigest: requiredString(
      context.topicPagePlanDigest,
      "run.context.topicPagePlanDigest",
    ),
    topicPageContentSpecDigest: requiredString(
      context.topicPageContentSpecDigest,
      "run.context.topicPageContentSpecDigest",
    ),
    themeIntentDigest: requiredString(context.themeIntentDigest, "run.context.themeIntentDigest"),
    productSelectionDigest: requiredString(
      context.productSelectionDigest,
      "run.context.productSelectionDigest",
    ),
    productionMode: "source-product-images",
    tasks,
  };
}

function positiveOption(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;
}

function nonNegativeOption(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : fallback;
}

function assertAllowedImageUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new SourceImageCompositorError("source_image_url_invalid", "Product image URL is invalid.");
  }
  if (url.protocol !== "https:" || url.username || url.password ||
      !ALLOWED_IMAGE_HOSTS.has(url.hostname.toLowerCase())) {
    throw new SourceImageCompositorError(
      "source_image_host_not_allowed",
      "Product image URL must use the approved HTTPS Yami image host.",
    );
  }
  return url;
}

async function readResponseBytes(response: Response, maxBytes: number) {
  const contentLength = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new SourceImageCompositorError(
      "source_image_too_large",
      "Product image exceeds the source byte limit.",
    );
  }
  if (!response.body) {
    throw new SourceImageCompositorError("source_image_unavailable", "Product image has no body.");
  }
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new SourceImageCompositorError(
          "source_image_too_large",
          "Product image exceeds the source byte limit.",
        );
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  if (total === 0) {
    throw new SourceImageCompositorError("source_image_unavailable", "Product image is empty.");
  }
  return Buffer.concat(chunks, total);
}

async function fetchSourceImage(
  sourceUrl: string,
  fetchImpl: typeof globalThis.fetch,
  options: Required<Pick<SourceImageCompositorOptions, "maxRedirects" | "maxSourceBytes" | "timeoutMs">>,
) {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutFailure = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new SourceImageCompositorError("source_image_timeout", "Product image request timed out."));
    }, options.timeoutMs);
  });
  const download = async () => {
    let url = assertAllowedImageUrl(sourceUrl);
    for (let redirectCount = 0; redirectCount <= options.maxRedirects; redirectCount += 1) {
      let response: Response;
      try {
        response = await fetchImpl(url, {
          headers: { accept: "image/avif,image/webp,image/png,image/jpeg" },
          redirect: "manual",
          signal: controller.signal,
        });
      } catch (error) {
        if (error instanceof SourceImageCompositorError) throw error;
        if (controller.signal.aborted) {
          throw new SourceImageCompositorError(
            "source_image_timeout",
            "Product image request timed out.",
          );
        }
        throw new SourceImageCompositorError(
          "source_image_unavailable",
          "Product image request failed.",
        );
      }
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirectCount === options.maxRedirects) {
          throw new SourceImageCompositorError(
            "source_image_redirect_limit",
            "Product image exceeded the redirect limit.",
          );
        }
        const location = response.headers.get("location");
        if (!location) {
          throw new SourceImageCompositorError(
            "source_image_unavailable",
            "Product image redirect has no destination.",
          );
        }
        url = assertAllowedImageUrl(new URL(location, url).href);
        continue;
      }
      if (!response.ok) {
        throw new SourceImageCompositorError(
          "source_image_unavailable",
          `Product image request returned HTTP ${response.status}.`,
        );
      }
      return readResponseBytes(response, options.maxSourceBytes);
    }
    throw new SourceImageCompositorError(
      "source_image_redirect_limit",
      "Product image exceeded the redirect limit.",
    );
  };
  try {
    return await Promise.race([download(), timeoutFailure]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function fetchApprovedSourceImage(
  sourceUrl: string,
  compositorOptions: SourceImageCompositorOptions = {},
) {
  const fetchImpl = compositorOptions.fetch ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new SourceImageCompositorError(
      "source_image_fetch_unavailable",
      "No product image fetch implementation is available.",
    );
  }
  return fetchSourceImage(sourceUrl, fetchImpl, {
    maxRedirects: nonNegativeOption(compositorOptions.maxRedirects, DEFAULT_MAX_REDIRECTS),
    maxSourceBytes: positiveOption(compositorOptions.maxSourceBytes, DEFAULT_MAX_SOURCE_BYTES),
    timeoutMs: positiveOption(compositorOptions.timeoutMs, DEFAULT_TIMEOUT_MS),
  });
}

const RATIO_UNITS: Record<VisualAspectRatio, readonly [number, number]> = {
  "16:9": [16, 9],
  "1:1": [1, 1],
  "111:40": [111, 40],
};

function outputDimensions(task: SourceVisualTask) {
  const [ratioWidth, ratioHeight] = RATIO_UNITS[task.targetAspectRatio];
  const scale = Math.ceil(Math.max(
    task.minimumWidth / ratioWidth,
    task.minimumHeight / ratioHeight,
  ));
  const width = ratioWidth * scale;
  const height = ratioHeight * scale;
  if (width > MAX_OUTPUT_DIMENSION || height > MAX_OUTPUT_DIMENSION ||
      width * height > MAX_OUTPUT_PIXELS) {
    throw new SourceImageCompositorError(
      "visual_dimensions_too_large",
      `Visual task ${task.taskId} exceeds the local composition dimension limit.`,
    );
  }
  return { width, height };
}

function gridLayout(task: SourceVisualTask, width: number, height: number) {
  const count = task.products.length;
  const columns = count <= 3 ? count : Math.ceil(count / 2);
  const rows = Math.ceil(count / columns);
  const gap = Math.max(12, Math.round(Math.min(width, height) * 0.025));
  const padding = Math.max(16, Math.round(Math.min(width, height) * 0.05));
  const subjectBottom = task.kind === "scene-image" ? Math.floor(height * 0.72) : height;
  const availableWidth = width - padding * 2 - gap * (columns - 1);
  const availableHeight = subjectBottom - padding * 2 - gap * (rows - 1);
  const cellWidth = Math.floor(availableWidth / columns);
  const cellHeight = Math.floor(availableHeight / rows);
  if (cellWidth <= 0 || cellHeight <= 0) {
    throw new SourceImageCompositorError(
      "invalid_visual_run",
      `Visual task ${task.taskId} cannot fit its assigned products.`,
    );
  }
  return task.products.map((_product, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      width: cellWidth,
      height: cellHeight,
      left: padding + column * (cellWidth + gap),
      top: padding + row * (cellHeight + gap),
    };
  });
}

async function renderProduct(bytes: Buffer, width: number, height: number) {
  try {
    const image = sharp(bytes, {
      failOn: "error",
      limitInputPixels: MAX_SOURCE_PIXELS,
      sequentialRead: true,
    });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error("Image dimensions are missing.");
    }
    return await image
      .rotate()
      .resize({
        width,
        height,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .ensureAlpha()
      .png()
      .toBuffer();
  } catch {
    throw new SourceImageCompositorError(
      "source_image_invalid",
      "Product image could not be decoded safely.",
    );
  }
}

async function composeTask(
  task: SourceVisualTask,
  sourceBytes: Buffer[],
  maxOutputBytes: number,
) {
  const { width, height } = outputDimensions(task);
  const layout = gridLayout(task, width, height);
  const inputs = await Promise.all(sourceBytes.map((bytes, index) =>
    renderProduct(bytes, layout[index]!.width, layout[index]!.height)
  ));
  const bytes = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BACKGROUND_COLOR,
    },
  })
    .composite(inputs.map((input, index) => ({
      input,
      left: layout[index]!.left,
      top: layout[index]!.top,
    })))
    .webp({ quality: 90, effort: 4, smartSubsample: true })
    .toBuffer();
  if (bytes.byteLength > maxOutputBytes) {
    throw new SourceImageCompositorError(
      "composed_asset_too_large",
      `Visual task ${task.taskId} exceeds the output byte limit.`,
    );
  }
  return { bytes, width, height };
}

function artifactRef(planDigest: string, taskId: string, index: number) {
  const runKey = createHash("sha256").update(planDigest).digest("hex").slice(0, 12);
  const safeTaskId = taskId.toLowerCase().replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 64) || "visual-task";
  return `assets/${runKey}/${String(index + 1).padStart(2, "0")}-${safeTaskId}.webp`;
}

function altText(context: SourceVisualContext, task: SourceVisualTask) {
  if (task.altTextMode === "decorative") return null;
  const evidenceRefs = task.products.map(({ id }) => `product:${id}`);
  const first = task.products[0]!;
  const text = context.language === "zh"
    ? task.products.length === 1
      ? `${first.brand ? `${first.brand} ` : ""}${first.title} 商品图`
      : `${context.keyword}主题的${task.products.length}件商品组合图`
    : task.products.length === 1
      ? `Product image of ${first.brand ? `${first.brand} ` : ""}${first.title}`
      : `A composition of ${task.products.length} products for ${context.keyword}`;
  return { language: context.language, text, evidenceRefs };
}

/**
 * Deterministically composes the PagePlan-assigned Yami catalog images. This function intentionally
 * does not choose products or generate claims; the existing visual proposal reviewer remains the
 * authority for task membership, evidence scope, and artifact metadata.
 */
export async function composeSourceProductImages(
  input: SourceImageCompositorInput,
  compositorOptions: SourceImageCompositorOptions = {},
) {
  const context = parseInput(input);
  const maxOutputBytes = positiveOption(compositorOptions.maxOutputBytes, DEFAULT_MAX_OUTPUT_BYTES);
  const sourceCache = new Map<string, Promise<Buffer>>();
  const proposalAssets = [];
  const assets = [];

  for (const [index, task] of context.tasks.entries()) {
    const sourceBytes = await Promise.all(task.products.map(({ imageUrl }) => {
      const cached = sourceCache.get(imageUrl);
      if (cached) return cached;
      const request = fetchApprovedSourceImage(imageUrl, compositorOptions);
      sourceCache.set(imageUrl, request);
      return request;
    }));
    const composed = await composeTask(task, sourceBytes, maxOutputBytes);
    const ref = artifactRef(context.topicPagePlanDigest, task.taskId, index);
    const evidenceRefs = task.products.map(({ id }) => `product:${id}`);
    const referenceProductIds = task.products.map(({ id }) => id);
    proposalAssets.push({
      taskId: task.taskId,
      moduleId: task.moduleId,
      component: task.component,
      kind: task.kind,
      direction: {
        prompt: "Compose the assigned Yami product images without changing packaging or identity.",
        negativePrompt: "generated packaging, altered labels, unsupported claims, added text",
        evidenceRefs,
        referenceProductIds,
      },
      altText: altText(context, task),
      artifact: {
        ref,
        mimeType: "image/webp",
        width: composed.width,
        height: composed.height,
        digest: `sha256:${createHash("sha256").update(composed.bytes).digest("hex")}`,
        focalPoint: { x: 0.5, y: task.kind === "scene-image" ? 0.36 : 0.5 },
        ...(task.requiresBackgroundColor ? { backgroundColor: BACKGROUND_COLOR } : {}),
      },
    });
    assets.push({
      taskId: task.taskId,
      ref,
      mimeType: "image/webp",
      dataBase64: composed.bytes.toString("base64"),
    });
  }

  return {
    schemaVersion: "topic-page-agent-response/v1",
    stage: "visual-generation",
    proposal: {
      schemaVersion: "topic-page-visual-proposal/v1",
      keyword: context.keyword,
      site: context.site,
      language: context.language,
      topicPagePlanDigest: context.topicPagePlanDigest,
      topicPageContentSpecDigest: context.topicPageContentSpecDigest,
      themeIntentDigest: context.themeIntentDigest,
      productSelectionDigest: context.productSelectionDigest,
      productionMode: context.productionMode,
      assets: proposalAssets,
    },
    assets,
  };
}
