import type { ContentLanguage, ThemeIntent } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import {
  productSelectionDigest,
  themeIntentDigest,
} from "../page-merchandising/review.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type { TopicPageContentSpec } from "../page-content/contracts.js";
import type { TopicBackgroundEvidenceBundle } from "../background-evidence/contracts.js";
import { reviewTopicBackgroundEvidenceBundle } from "../background-evidence/review.js";
import {
  reviewTopicPageContentPreflight,
  reviewTopicPageContentProposal,
  topicPageContentSpecDigest,
} from "../page-content/review.js";
import type {
  TopicPageVisualAltText,
  TopicPageVisualArtifact,
  TopicPageVisualAssetProposal,
  TopicPageVisualDirection,
  TopicPageHeroCompositionAudit,
  TopicPageHeroPlacementPlan,
  TopicPageVisualGenerationProvenance,
  TopicPageVisualMimeType,
  TopicPageVisualProposalReview,
  TopicPageVisualProductionMode,
  TopicPageVisualTaskContext,
} from "./contracts.js";
import { deriveTopicPageVisualTasks } from "./tasks.js";

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function exactOrder(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function numberInRange(value: unknown, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum
    ? value
    : undefined;
}

function reviewHeroPlacementPlan(
  value: unknown,
  task: TopicPageVisualTaskContext,
  issues: string[],
): TopicPageHeroPlacementPlan | undefined {
  if (value === undefined) return undefined;
  if (task.kind !== "hero-image") {
    issues.push(`Only Hero asset ${task.taskId} may define a placementPlan.`);
    return undefined;
  }
  const plan = objectValue(value);
  const rawAnchors = Array.isArray(plan?.anchors) ? plan.anchors : [];
  if (!plan || rawAnchors.length !== task.products.length) {
    issues.push(`Hero asset ${task.taskId} placementPlan must contain one anchor per product.`);
    return undefined;
  }
  const anchors = rawAnchors.map((rawAnchor) => {
    const anchor = objectValue(rawAnchor);
    const x = numberInRange(anchor?.x, 0.1, 0.9);
    const y = numberInRange(anchor?.y, 0.25, 0.74);
    const scale = numberInRange(anchor?.scale, 0.5, 1.35);
    const depth = numberInRange(anchor?.depth, 0, 2);
    return x === undefined || y === undefined || scale === undefined || depth === undefined
      ? undefined
      : { x, y, scale, depth };
  });
  const primaryIndex = plan.primaryIndex;
  const shadowDirection = objectValue(plan.shadowDirection);
  const shadowX = numberInRange(shadowDirection?.x, -1, 1);
  const shadowY = numberInRange(shadowDirection?.y, -1, 1);
  const supportRegion = objectValue(plan.supportRegion);
  const supportLeft = numberInRange(supportRegion?.left, 0.05, 0.45);
  const supportRight = numberInRange(supportRegion?.right, 0.55, 0.95);
  const supportTop = numberInRange(supportRegion?.top, 0.25, 0.68);
  const supportBottom = numberInRange(supportRegion?.bottom, 0.5, 0.74);
  if (anchors.some((anchor) => !anchor) || !Number.isInteger(primaryIndex) ||
      (primaryIndex as number) < 0 || (primaryIndex as number) >= anchors.length ||
      shadowX === undefined || shadowY === undefined || supportLeft === undefined ||
      supportRight === undefined || supportTop === undefined || supportBottom === undefined ||
      supportRegion?.surface !== "horizontal-light-neutral" ||
      supportRight - supportLeft < 0.45 || supportBottom - supportTop < 0.06) {
    issues.push(`Hero asset ${task.taskId} placementPlan is outside the supported geometry bounds.`);
    return undefined;
  }
  const parsedAnchors = anchors as TopicPageHeroPlacementPlan["anchors"];
  if (parsedAnchors.some(({ x, y }) =>
    x < supportLeft || x > supportRight || y < supportTop || y > supportBottom
  )) {
    issues.push(`Hero asset ${task.taskId} placement contact points must be inside supportRegion.`);
    return undefined;
  }
  return {
    primaryIndex: primaryIndex as number,
    anchors: parsedAnchors,
    shadowDirection: { x: shadowX, y: shadowY },
    supportRegion: {
      left: supportLeft,
      right: supportRight,
      top: supportTop,
      bottom: supportBottom,
      surface: "horizontal-light-neutral",
    },
  };
}

function reviewHeroCompositionAudit(
  value: unknown,
  task: TopicPageVisualTaskContext,
  placementPlan: TopicPageHeroPlacementPlan | undefined,
  issues: string[],
): TopicPageHeroCompositionAudit | undefined {
  if (value === undefined) return undefined;
  if (task.kind !== "hero-image" || !placementPlan) {
    issues.push(`Only a placed Hero asset ${task.taskId} may define compositionAudit.`);
    return undefined;
  }
  const audit = objectValue(value);
  const supportSurfaceLightness = numberInRange(audit?.supportSurfaceLightness, 0, 1);
  const maximumOverlapRatio = numberInRange(audit?.maximumOverlapRatio, 0, 0.32);
  const rawProducts = Array.isArray(audit?.products) ? audit.products : [];
  if (!audit || audit.verification !== "host-geometry-v1" ||
      (audit.semanticVerification !== "agent-vision-v1" &&
        audit.semanticVerification !== "known-safe-neutral-v1" &&
        audit.semanticVerification !== "host-geometry-only") ||
      supportSurfaceLightness === undefined || supportSurfaceLightness < 0.68 ||
      maximumOverlapRatio === undefined || audit.bottomSafeAreaStart !== 0.75 ||
      rawProducts.length !== task.products.length) {
    issues.push(`Hero asset ${task.taskId} compositionAudit is incomplete or unsafe.`);
    return undefined;
  }
  const products = rawProducts.map((rawProduct, index) => {
    const product = objectValue(rawProduct);
    const bounds = objectValue(product?.bounds);
    const contactPoint = objectValue(product?.contactPoint);
    const preparationConfidence = numberInRange(product?.preparationConfidence, 0, 1);
    const left = numberInRange(bounds?.left, 0, 1);
    const top = numberInRange(bounds?.top, 0, 0.75);
    const right = numberInRange(bounds?.right, 0, 1);
    const bottom = numberInRange(bounds?.bottom, 0, 0.749999);
    const contactX = numberInRange(contactPoint?.x, 0, 1);
    const contactY = numberInRange(contactPoint?.y, 0, 0.749999);
    const preparationMethod = product?.preparationMethod;
    const anchor = placementPlan.anchors[index];
    if (product?.productId !== task.products[index]?.id ||
        typeof product?.sourceDigest !== "string" ||
        !/^sha256:[a-f0-9]{64}$/.test(product.sourceDigest) ||
        (preparationMethod !== "source-alpha" &&
          preparationMethod !== "white-background-direct" &&
          preparationMethod !== "source-studio-tile") ||
        preparationConfidence === undefined || left === undefined || top === undefined ||
        right === undefined || bottom === undefined || left >= right || top >= bottom ||
        contactX === undefined || contactY === undefined || !anchor ||
        Math.abs(contactX - anchor.x) > 0.005 || Math.abs(contactY - anchor.y) > 0.005) {
      return undefined;
    }
    return {
      productId: product.productId as string,
      sourceDigest: product.sourceDigest,
      preparationMethod,
      preparationConfidence,
      bounds: { left, top, right, bottom },
      contactPoint: { x: contactX, y: contactY },
    };
  });
  if (products.some((product) => !product)) {
    issues.push(`Hero asset ${task.taskId} compositionAudit product layers are invalid.`);
    return undefined;
  }
  return {
    verification: "host-geometry-v1",
    semanticVerification: audit.semanticVerification as TopicPageHeroCompositionAudit["semanticVerification"],
    supportSurfaceLightness,
    maximumOverlapRatio,
    bottomSafeAreaStart: 0.75,
    products: products as TopicPageHeroCompositionAudit["products"],
  };
}

function reviewGenerationProvenance(
  value: unknown,
  task: TopicPageVisualTaskContext,
  issues: string[],
): TopicPageVisualGenerationProvenance | undefined {
  if (value === undefined) return undefined;
  const provenance = objectValue(value);
  const provider = stringValue(provenance?.provider);
  const model = stringValue(provenance?.model);
  const modelSource = provenance?.modelSource;
  const attempts = numberInRange(provenance?.attempts, 1, 2);
  if (!provenance || !provider ||
      (modelSource !== "configured" && modelSource !== "runtime-reported" &&
        modelSource !== "unreported") || attempts === undefined || !Number.isInteger(attempts) ||
      typeof provenance.cacheHit !== "boolean" ||
      (modelSource === "unreported" && model) ||
      (modelSource !== "unreported" && !model)) {
    issues.push(`Asset ${task.taskId} generationProvenance is invalid.`);
    return undefined;
  }
  return {
    provider,
    ...(model ? { model } : {}),
    modelSource,
    attempts,
    cacheHit: provenance.cacheHit,
  };
}

function reconstructedContentProposal(contentSpec: TopicPageContentSpec) {
  return {
    schemaVersion: "topic-page-content-proposal/v1",
    keyword: contentSpec.keyword,
    site: contentSpec.site,
    language: contentSpec.language,
    topicPagePlanDigest: contentSpec.topicPagePlanDigest,
    themeIntentDigest: contentSpec.themeIntentDigest,
    productSelectionDigest: contentSpec.productSelectionDigest,
    tasks: contentSpec.tasks,
  };
}

export function reviewTopicPageVisualPreflight(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  plan: TopicPagePlanV2,
  contentSpec: TopicPageContentSpec,
  backgroundEvidence?: TopicBackgroundEvidenceBundle,
) {
  const issues = reviewTopicPageContentPreflight(intent, selection, plan);
  if (
    contentSpec.schemaVersion !== "topic-page-content-spec/v1" ||
    contentSpec.status !== "content-ready"
  ) {
    issues.push("TopicPageVisual requires a ready topic-page-content-spec/v1.");
  }
  if (contentSpec.digest !== topicPageContentSpecDigest(contentSpec)) {
    issues.push("TopicPageContentSpec digest is invalid.");
  }
  if (contentSpec.keyword !== plan.keyword) {
    issues.push("TopicPageContentSpec keyword does not match TopicPagePlan.");
  }
  if (contentSpec.site !== plan.site) {
    issues.push("TopicPageContentSpec site does not match TopicPagePlan.");
  }
  if (contentSpec.strategyRef !== plan.strategyRef) {
    issues.push("TopicPageContentSpec strategyRef does not match TopicPagePlan.");
  }
  if (contentSpec.templateRef !== plan.templateRef) {
    issues.push("TopicPageContentSpec templateRef does not match TopicPagePlan.");
  }
  if (contentSpec.topicPagePlanDigest !== plan.digest) {
    issues.push("TopicPageContentSpec topicPagePlanDigest does not match TopicPagePlan.");
  }
  if (contentSpec.themeIntentDigest !== themeIntentDigest(intent)) {
    issues.push("TopicPageContentSpec themeIntentDigest does not match ThemeIntent.");
  }
  if (contentSpec.productSelectionDigest !== productSelectionDigest(selection)) {
    issues.push("TopicPageContentSpec productSelectionDigest does not match ProductSelectionResult.");
  }
  if (contentSpec.language !== "en" && contentSpec.language !== "zh") {
    issues.push("TopicPageContentSpec language must be en or zh.");
  }

  if (contentSpec.backgroundEvidenceDigest) {
    if (!backgroundEvidence) {
      issues.push("TopicPageVisual requires the BackgroundEvidence bound to TopicPageContentSpec.");
    } else {
      issues.push(...reviewTopicBackgroundEvidenceBundle(intent, backgroundEvidence));
      if (backgroundEvidence.digest !== contentSpec.backgroundEvidenceDigest) {
        issues.push("BackgroundEvidence digest does not match TopicPageContentSpec.");
      }
      if (backgroundEvidence.keyword !== plan.keyword || backgroundEvidence.site !== plan.site ||
          backgroundEvidence.language !== contentSpec.language) {
        issues.push("BackgroundEvidence identity does not match TopicPageContentSpec.");
      }
    }
  }

  const contentReview = reviewTopicPageContentProposal(
    intent,
    selection,
    plan,
    contentSpec.language,
    reconstructedContentProposal(contentSpec),
    contentSpec.backgroundEvidenceDigest === backgroundEvidence?.digest
      ? backgroundEvidence
      : undefined,
  );
  issues.push(...contentReview.issues);

  if (contentReview.status === "accepted") {
    const tasks = deriveTopicPageVisualTasks(intent, plan, selection, contentSpec);
    const taskIds = new Set<string>();
    tasks.forEach(({ taskId }) => {
      if (taskIds.has(taskId)) {
        issues.push(`Derived visual task ${taskId} is duplicated.`);
      }
      taskIds.add(taskId);
    });
    plan.modules.forEach((module) => {
      const expectedTaskIds = tasks
        .filter(({ moduleId }) => moduleId === module.id)
        .map(({ taskId }) => taskId);
      if (!exactOrder(module.assetTaskIds, expectedTaskIds)) {
        issues.push(`Module ${module.id} assetTaskIds do not match its visual slots.`);
      }
    });
  }
  return issues;
}

function reviewEvidenceRef(
  evidenceRef: string,
  task: TopicPageVisualTaskContext,
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  issues: string[],
) {
  if (evidenceRef.startsWith("theme-intent:")) {
    const id = evidenceRef.slice("theme-intent:".length);
    if (!intent.evidenceRefs.some((evidence) => evidence.id === id)) {
      issues.push(`Unknown ThemeIntent evidence reference: ${evidenceRef}.`);
    }
    return;
  }
  if (evidenceRef.startsWith("selected-category:")) {
    const id = evidenceRef.slice("selected-category:".length);
    if (!selection.selectedCategories.some((category) => category.id === id)) {
      issues.push(`Unknown selected category evidence reference: ${evidenceRef}.`);
    }
    return;
  }
  if (evidenceRef.startsWith("product:")) {
    const id = evidenceRef.slice("product:".length);
    if (!task.products.some((product) => product.id === id)) {
      issues.push(`Evidence reference ${evidenceRef} is outside visual task ${task.taskId}.`);
    }
    return;
  }
  if (evidenceRef.startsWith("scene:")) {
    const id = evidenceRef.slice("scene:".length);
    if (task.sceneId !== id) {
      issues.push(`Evidence reference ${evidenceRef} is outside visual task ${task.taskId}.`);
    }
    return;
  }
  if (evidenceRef.startsWith("content-task:")) {
    const id = evidenceRef.slice("content-task:".length);
    if (task.contentTask.taskId !== id) {
      issues.push(`Evidence reference ${evidenceRef} is outside visual task ${task.taskId}.`);
    }
    return;
  }
  issues.push(`Unsupported visual evidence reference: ${evidenceRef}.`);
}

function evidenceRefs(
  value: unknown,
  path: string,
  task: TopicPageVisualTaskContext,
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  issues: string[],
) {
  const rawRefs = Array.isArray(value) ? value : [];
  if (!Array.isArray(value)) issues.push(`${path} evidenceRefs must be an array.`);
  const refs = rawRefs
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  if (refs.length !== rawRefs.length) {
    issues.push(`${path} evidenceRefs may contain only non-empty strings.`);
  }
  if (refs.length === 0) issues.push(`${path} requires at least one evidence reference.`);
  refs.forEach((ref) => reviewEvidenceRef(ref, task, intent, selection, issues));
  return refs;
}

function reviewDirection(
  value: unknown,
  task: TopicPageVisualTaskContext,
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  productionMode: TopicPageVisualProductionMode,
  issues: string[],
): TopicPageVisualDirection {
  const direction = objectValue(value);
  if (!direction) issues.push(`Asset ${task.taskId} direction must be an object.`);
  const prompt = stringValue(direction?.prompt);
  if (!prompt) issues.push(`Asset ${task.taskId} direction requires prompt.`);
  const negativePrompt = stringValue(direction?.negativePrompt);
  const rawProductIds = Array.isArray(direction?.referenceProductIds)
    ? direction.referenceProductIds
    : [];
  if (!Array.isArray(direction?.referenceProductIds)) {
    issues.push(`Asset ${task.taskId} referenceProductIds must be an array.`);
  }
  const referenceProductIds = rawProductIds
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  if (referenceProductIds.length !== rawProductIds.length) {
    issues.push(`Asset ${task.taskId} referenceProductIds may contain only non-empty strings.`);
  }
  if (!exactOrder(referenceProductIds, task.products.map(({ id }) => id))) {
    issues.push(`Asset ${task.taskId} referenceProductIds must match its assigned products.`);
  }
  const reviewedEvidenceRefs = evidenceRefs(
    direction?.evidenceRefs,
    `Asset ${task.taskId} direction`,
    task,
    intent,
    selection,
    issues,
  );
  task.sceneBrief.evidenceRefs.forEach((requiredRef) => {
    if (!reviewedEvidenceRefs.includes(requiredRef)) {
      issues.push(
        `Asset ${task.taskId} direction requires scene brief evidence reference ${requiredRef}.`,
      );
    }
  });
  const placementPlan = reviewHeroPlacementPlan(direction?.placementPlan, task, issues);
  const placementSource = direction?.placementSource;
  if (placementSource !== undefined && placementSource !== "agent" &&
      placementSource !== "agent-recovered" &&
      placementSource !== "safe-fallback") {
    issues.push(`Asset ${task.taskId} placementSource is unsupported.`);
  }
  if ((placementPlan && placementSource === undefined) || (!placementPlan && placementSource !== undefined)) {
    issues.push(`Asset ${task.taskId} placementPlan and placementSource must be provided together.`);
  }
  const compositionAudit = reviewHeroCompositionAudit(
    direction?.compositionAudit,
    task,
    placementPlan,
    issues,
  );
  const rawPlacementIssues = direction?.placementIssues;
  const placementIssues = Array.isArray(rawPlacementIssues)
    ? rawPlacementIssues
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
    : [];
  if (rawPlacementIssues !== undefined && !Array.isArray(rawPlacementIssues)) {
    issues.push(`Asset ${task.taskId} placementIssues must be an array.`);
  } else if (Array.isArray(rawPlacementIssues) && placementIssues.length !== rawPlacementIssues.length) {
    issues.push(`Asset ${task.taskId} placementIssues may contain only non-empty strings.`);
  }
  if (direction?.fallbackUsed !== undefined && typeof direction.fallbackUsed !== "boolean") {
    issues.push(`Asset ${task.taskId} fallbackUsed must be a boolean.`);
  }
  const fallbackReason = typeof direction?.fallbackReason === "string"
    ? direction.fallbackReason.trim()
    : "";
  if (direction?.fallbackReason !== undefined && !fallbackReason) {
    issues.push(`Asset ${task.taskId} fallbackReason must be a non-empty string.`);
  }
  if (direction?.fallbackUsed === true && !fallbackReason) {
    issues.push(`Fallback asset ${task.taskId} requires a fallbackReason.`);
  } else if (direction?.fallbackUsed !== true && fallbackReason) {
    issues.push(`Asset ${task.taskId} may provide fallbackReason only when fallbackUsed is true.`);
  }
  const generationProvenance = reviewGenerationProvenance(
    direction?.generationProvenance,
    task,
    issues,
  );
  if (productionMode === "generated-images" && direction?.fallbackUsed === true &&
      task.kind !== "hero-image" && task.kind !== "shortcut-image") {
    issues.push(`Asset ${task.taskId} may not use a fallback for a scene-first visual task.`);
  }
  return {
    prompt,
    ...(negativePrompt ? { negativePrompt } : {}),
    evidenceRefs: reviewedEvidenceRefs,
    referenceProductIds,
    ...(placementPlan && (placementSource === "agent" || placementSource === "agent-recovered" ||
      placementSource === "safe-fallback")
      ? { placementPlan, placementSource }
      : {}),
    ...(placementIssues.length ? { placementIssues } : {}),
    ...(compositionAudit ? { compositionAudit } : {}),
    ...(generationProvenance ? { generationProvenance } : {}),
    ...(typeof direction?.fallbackUsed === "boolean"
      ? { fallbackUsed: direction.fallbackUsed }
      : {}),
    ...(fallbackReason ? { fallbackReason } : {}),
  };
}

function reviewAltText(
  value: unknown,
  task: TopicPageVisualTaskContext,
  language: ContentLanguage,
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  issues: string[],
): TopicPageVisualAltText | null {
  if (task.altTextMode === "decorative") {
    if (value !== null) {
      issues.push(`Decorative asset ${task.taskId} must use null altText.`);
    }
    return null;
  }
  const altText = objectValue(value);
  if (!altText) {
    issues.push(`Asset ${task.taskId} requires altText.`);
  }
  const text = stringValue(altText?.text);
  if (!text) issues.push(`Asset ${task.taskId} altText requires text.`);
  if (altText?.language !== language) {
    issues.push(`Asset ${task.taskId} altText language does not match TopicPageContentSpec.`);
  }
  return {
    language,
    text,
    evidenceRefs: evidenceRefs(
      altText?.evidenceRefs,
      `Asset ${task.taskId} altText`,
      task,
      intent,
      selection,
      issues,
    ),
  };
}

function isSafeRelativeRef(ref: string) {
  if (!ref || ref.startsWith("/") || ref.includes("\\") || /^[a-z][a-z0-9+.-]*:/i.test(ref)) {
    return false;
  }
  const segments = ref.split("/");
  return segments.every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

const MIME_EXTENSIONS: Record<TopicPageVisualMimeType, readonly string[]> = {
  "image/webp": [".webp"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

const TARGET_RATIOS = {
  "16:9": 16 / 9,
  "1:1": 1,
  "111:40": 111 / 40,
} as const;

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number.NaN;
}

function reviewArtifact(
  value: unknown,
  task: TopicPageVisualTaskContext,
  issues: string[],
): TopicPageVisualArtifact {
  const artifact = objectValue(value);
  if (!artifact) issues.push(`Asset ${task.taskId} artifact must be an object.`);
  const ref = stringValue(artifact?.ref);
  if (!isSafeRelativeRef(ref)) {
    issues.push(`Asset ${task.taskId} artifact ref must be a safe relative path.`);
  }
  const mimeType = stringValue(artifact?.mimeType) as TopicPageVisualMimeType;
  if (!Object.hasOwn(MIME_EXTENSIONS, mimeType)) {
    issues.push(`Asset ${task.taskId} artifact mimeType is unsupported.`);
  } else if (!MIME_EXTENSIONS[mimeType].some((extension) => ref.toLowerCase().endsWith(extension))) {
    issues.push(`Asset ${task.taskId} artifact extension does not match mimeType.`);
  }
  const width = numberValue(artifact?.width);
  const height = numberValue(artifact?.height);
  if (!Number.isInteger(width) || width < task.minimumWidth) {
    issues.push(`Asset ${task.taskId} width must be at least ${task.minimumWidth}.`);
  }
  if (!Number.isInteger(height) || height < task.minimumHeight) {
    issues.push(`Asset ${task.taskId} height must be at least ${task.minimumHeight}.`);
  }
  const actualRatio = width / height;
  const targetRatio = TARGET_RATIOS[task.targetAspectRatio];
  if (!Number.isFinite(actualRatio) || Math.abs(actualRatio - targetRatio) / targetRatio > 0.02) {
    issues.push(
      `Asset ${task.taskId} dimensions do not match target aspect ratio ${task.targetAspectRatio}.`,
    );
  }
  const digest = stringValue(artifact?.digest);
  if (!/^sha256:[a-f0-9]{64}$/.test(digest)) {
    issues.push(`Asset ${task.taskId} artifact digest must be a SHA-256 digest.`);
  }
  const rawFocalPoint = objectValue(artifact?.focalPoint);
  const x = numberValue(rawFocalPoint?.x);
  const y = numberValue(rawFocalPoint?.y);
  if (!Number.isFinite(x) || x < 0 || x > 1 || !Number.isFinite(y) || y < 0 || y > 1) {
    issues.push(`Asset ${task.taskId} focalPoint must use x and y values from 0 to 1.`);
  }
  const backgroundColor = stringValue(artifact?.backgroundColor);
  if (task.requiresBackgroundColor && !backgroundColor) {
    issues.push(`Asset ${task.taskId} requires backgroundColor.`);
  }
  if (backgroundColor && !/^#[a-f0-9]{6}$/i.test(backgroundColor)) {
    issues.push(`Asset ${task.taskId} backgroundColor must be a six-digit hex color.`);
  }
  return {
    ref,
    mimeType,
    width,
    height,
    digest,
    focalPoint: { x, y },
    ...(backgroundColor ? { backgroundColor } : {}),
  };
}

export function reviewTopicPageVisualProposal(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  plan: TopicPagePlanV2,
  contentSpec: TopicPageContentSpec,
  value: unknown,
  productionMode: TopicPageVisualProductionMode = "generated-images",
): TopicPageVisualProposalReview {
  const proposal = objectValue(value);
  const issues: string[] = [];
  if (!proposal) {
    return {
      status: "rejected",
      issues: ["TopicPageVisualProposal must be a JSON object."],
    };
  }
  if (proposal.schemaVersion !== "topic-page-visual-proposal/v1") {
    issues.push('schemaVersion must be "topic-page-visual-proposal/v1".');
  }
  if (proposal.keyword !== plan.keyword) issues.push("Proposal keyword does not match TopicPagePlan.");
  if (proposal.site !== plan.site) issues.push("Proposal site does not match TopicPagePlan.");
  if (proposal.language !== contentSpec.language) {
    issues.push("Proposal language does not match TopicPageContentSpec.");
  }
  if (proposal.topicPagePlanDigest !== plan.digest) {
    issues.push("Proposal topicPagePlanDigest does not match TopicPagePlan.");
  }
  if (proposal.topicPageContentSpecDigest !== contentSpec.digest) {
    issues.push("Proposal topicPageContentSpecDigest does not match TopicPageContentSpec.");
  }
  if (proposal.themeIntentDigest !== themeIntentDigest(intent)) {
    issues.push("Proposal themeIntentDigest does not match ThemeIntent.");
  }
  if (proposal.productSelectionDigest !== productSelectionDigest(selection)) {
    issues.push("Proposal productSelectionDigest does not match ProductSelectionResult.");
  }
  const proposalProductionMode = proposal.productionMode ?? "generated-images";
  if (proposalProductionMode !== productionMode) {
    issues.push("Proposal productionMode does not match the requested visual production mode.");
  }

  const tasks = deriveTopicPageVisualTasks(intent, plan, selection, contentSpec);
  const rawAssets = Array.isArray(proposal.assets) ? proposal.assets : [];
  if (!Array.isArray(proposal.assets)) issues.push("Visual proposal assets must be an array.");
  if (rawAssets.length !== tasks.length) {
    issues.push(`Visual proposal must define exactly ${tasks.length} assets.`);
  }
  const seenTaskIds = new Set<string>();
  const seenArtifactRefs = new Set<string>();
  const assets: TopicPageVisualAssetProposal[] = [];
  rawAssets.forEach((rawAsset, index) => {
    const asset = objectValue(rawAsset);
    if (!asset) {
      issues.push(`Visual asset ${index} must be an object.`);
      return;
    }
    const taskId = stringValue(asset.taskId);
    const task = tasks.find((candidate) => candidate.taskId === taskId);
    if (!task) {
      issues.push(`Asset task ${taskId || index} is not declared by TopicPagePlan.`);
      return;
    }
    if (seenTaskIds.has(taskId)) issues.push(`Asset task ${taskId} is defined more than once.`);
    seenTaskIds.add(taskId);
    if (tasks[index]?.taskId !== taskId) {
      issues.push("Visual assets must preserve TopicPagePlan task order.");
    }
    if (asset.moduleId !== task.moduleId) {
      issues.push(`Asset ${taskId} moduleId does not match PagePlan module ${task.moduleId}.`);
    }
    if (asset.component !== task.component) {
      issues.push(`Asset ${taskId} component does not match PagePlan module ${task.moduleId}.`);
    }
    if (asset.kind !== task.kind) {
      issues.push(`Asset ${taskId} kind does not match its visual slot.`);
    }
    const direction = reviewDirection(
      asset.direction,
      task,
      intent,
      selection,
      productionMode,
      issues,
    );
    const altText = reviewAltText(
      asset.altText,
      task,
      contentSpec.language,
      intent,
      selection,
      issues,
    );
    const artifact = reviewArtifact(asset.artifact, task, issues);
    if (seenArtifactRefs.has(artifact.ref)) {
      issues.push(`Artifact ref ${artifact.ref} is assigned to more than one visual task.`);
    }
    seenArtifactRefs.add(artifact.ref);
    assets.push({
      taskId,
      moduleId: task.moduleId,
      component: task.component,
      kind: task.kind,
      direction,
      altText,
      artifact,
    });
  });
  tasks.forEach(({ taskId }) => {
    if (!seenTaskIds.has(taskId)) {
      issues.push(`Visual task ${taskId} is missing from the proposal.`);
    }
  });

  if (issues.length > 0) return { status: "rejected", issues };
  return {
    status: "accepted",
    issues: [],
    proposal: {
      schemaVersion: "topic-page-visual-proposal/v1",
      keyword: plan.keyword,
      site: plan.site,
      language: contentSpec.language,
      topicPagePlanDigest: plan.digest,
      topicPageContentSpecDigest: contentSpec.digest,
      themeIntentDigest: themeIntentDigest(intent),
      productSelectionDigest: productSelectionDigest(selection),
      productionMode,
      assets,
    },
  };
}
