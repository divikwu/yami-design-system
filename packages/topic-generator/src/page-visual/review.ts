import type { ContentLanguage, ThemeIntent } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import {
  productSelectionDigest,
  themeIntentDigest,
} from "../page-merchandising/review.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type { TopicPageContentSpec } from "../page-content/contracts.js";
import type { TopicBackgroundEvidenceBundle } from "../background-evidence/contracts.js";
import {
  reviewTopicPageContentPreflight,
  topicPageContentSpecDigest,
} from "../page-content/review.js";
import type {
  TopicPageVisualAltText,
  TopicPageVisualArtifact,
  TopicPageVisualAssetProposal,
  TopicPageVisualDirection,
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

function reviewGenerationProvenance(
  value: unknown,
): TopicPageVisualGenerationProvenance | undefined {
  if (value === undefined) return undefined;
  const provenance = objectValue(value);
  const provider = stringValue(provenance?.provider);
  const model = stringValue(provenance?.model);
  const modelSource = provenance?.modelSource;
  const attempts = numberInRange(provenance?.attempts, 1, 3);
  const hasTimings = provenance?.queueDurationMs !== undefined ||
    provenance?.taskDurationMs !== undefined || provenance?.attemptDurationsMs !== undefined ||
    provenance?.attemptIssues !== undefined;
  const queueDurationMs = numberInRange(provenance?.queueDurationMs, 0, 3_600_000);
  const taskDurationMs = numberInRange(provenance?.taskDurationMs, 0, 3_600_000);
  const attemptDurationsMs = Array.isArray(provenance?.attemptDurationsMs)
    ? provenance.attemptDurationsMs.map((duration) => numberInRange(duration, 0, 300_000))
    : [];
  const attemptIssues = Array.isArray(provenance?.attemptIssues)
    ? provenance.attemptIssues.filter((issue): issue is string =>
      typeof issue === "string" && Boolean(issue.trim()) && issue.length <= 500
    ).map((issue) => issue.trim())
    : [];
  const timingsValid = !hasTimings || (
    attempts !== undefined && queueDurationMs !== undefined && taskDurationMs !== undefined &&
    attemptDurationsMs.length === attempts && attemptDurationsMs.every((duration) =>
      duration !== undefined
    ) && Array.isArray(provenance?.attemptIssues) &&
    attemptIssues.length === provenance.attemptIssues.length && attemptIssues.length <= attempts
  );
  if (!provenance || !provider ||
      (modelSource !== "configured" && modelSource !== "runtime-reported" &&
        modelSource !== "unreported") || attempts === undefined || !Number.isInteger(attempts) ||
      typeof provenance.cacheHit !== "boolean" ||
      !timingsValid ||
      (modelSource === "unreported" && model) ||
      (modelSource !== "unreported" && !model)) {
    return undefined;
  }
  return {
    provider,
    ...(model ? { model } : {}),
    modelSource,
    attempts,
    cacheHit: provenance.cacheHit,
    ...(hasTimings
      ? {
          queueDurationMs: queueDurationMs!,
          taskDurationMs: taskDurationMs!,
          attemptDurationsMs: attemptDurationsMs as number[],
          attemptIssues,
        }
      : {}),
  };
}

export function reviewTopicPageVisualPreflight(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  plan: TopicPagePlanV2,
  contentSpec: TopicPageContentSpec,
  _backgroundEvidence?: TopicBackgroundEvidenceBundle,
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

  if (issues.length === 0) {
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

function reviewDirection(
  value: unknown,
  task: TopicPageVisualTaskContext,
): TopicPageVisualDirection {
  const direction = objectValue(value);
  const prompt = stringValue(direction?.prompt) || task.sceneBrief.content.texts[0] ||
    task.sceneBrief.module.shoppingGoal;
  const negativePrompt = stringValue(direction?.negativePrompt);
  const referenceProductIds = task.products.map(({ id }) => id);
  const availableProducts = task.products.filter(({ imageUrl }) => Boolean(imageUrl));
  const attachedReferenceProductIds = task.kind === "hero-image"
    ? availableProducts.map(({ id }) => id)
    : task.kind === "shortcut-image"
    ? availableProducts.slice(0, 1).map(({ id }) => id)
    : task.kind === "scene-image"
    ? availableProducts.slice(0, 3).map(({ id }) => id)
    : [];
  const reviewedEvidenceRefs = [...task.sceneBrief.evidenceRefs];
  const fallbackReason = typeof direction?.fallbackReason === "string"
    ? direction.fallbackReason.trim()
    : "";
  const generationProvenance = reviewGenerationProvenance(direction?.generationProvenance);
  return {
    prompt,
    ...(negativePrompt ? { negativePrompt } : {}),
    evidenceRefs: reviewedEvidenceRefs,
    referenceProductIds,
    attachedReferenceProductIds,
    ...(generationProvenance ? { generationProvenance } : {}),
    ...(direction?.fallbackUsed === true && fallbackReason
      ? { fallbackUsed: true, fallbackReason }
      : {}),
  };
}

function reviewAltText(
  value: unknown,
  task: TopicPageVisualTaskContext,
  language: ContentLanguage,
): TopicPageVisualAltText | null {
  if (task.altTextMode === "decorative") {
    return null;
  }
  const altText = objectValue(value);
  const subject = task.sceneBrief.scene?.shoppingGoal || task.sceneBrief.content.texts[0] ||
    task.sceneBrief.module.shoppingGoal;
  const text = stringValue(altText?.text) ||
    (language === "zh" ? `${subject}的自然场景` : `A natural scene inspired by ${subject}`);
  return {
    language,
    text,
    evidenceRefs: [...task.sceneBrief.evidenceRefs],
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
  const seenTaskIds = new Set<string>();
  const seenArtifactRefs = new Set<string>();
  const assets: TopicPageVisualAssetProposal[] = [];
  let previousTaskIndex = -1;
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
    const taskIndex = tasks.findIndex((candidate) => candidate.taskId === taskId);
    if (taskIndex <= previousTaskIndex) {
      issues.push("Visual assets must preserve TopicPagePlan task order.");
    }
    previousTaskIndex = Math.max(previousTaskIndex, taskIndex);
    const direction = reviewDirection(
      asset.direction,
      task,
    );
    const altText = reviewAltText(
      asset.altText,
      task,
      contentSpec.language,
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
  if (issues.length > 0) return { status: "rejected", issues };
  const advisoryIssues = tasks
    .filter(({ taskId }) => !seenTaskIds.has(taskId))
    .map(({ taskId }) => `Visual task ${taskId} has no generated asset and was skipped.`);
  return {
    status: "accepted",
    issues: advisoryIssues,
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
