import { sha256Digest } from "../product-selection/digest.js";
import { productSelectionDigest, themeIntentDigest } from "../page-merchandising/review.js";
import type { TopicPageAssetManifest } from "../page-visual/contracts.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type { ThemeIntent } from "../types.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type { TopicPageContentSpec } from "../page-content/contracts.js";
import type {
  TopicPageAssetReader,
  TopicPageGenerationSpec,
  TopicPageQaCheck,
  TopicPageQaCheckId,
  TopicPageQaReport,
  TopicPageReviewPackage,
} from "./contracts.js";
import type { TopicPageExperienceReviewDecision } from "../page-review/contracts.js";
import { topicPageExperienceReviewDecisionDigest } from "../page-review/review.js";
import type { LandingPageExecutionPlan } from "../page-orchestration/contracts.js";
import { landingPageExecutionPlanDigest } from "../page-orchestration/review.js";
import {
  sha256Bytes,
  topicPageAssetManifestDigest,
  topicPageGenerationSpecDigest,
  topicPageQaReportDigest,
} from "./digest.js";
import type { TopicPageImageDecoder } from "./image.js";

export interface RunTopicPageQaOptions {
  intent: ThemeIntent;
  selection: ProductSelectionResult;
  plan: TopicPagePlanV2;
  contentSpec: TopicPageContentSpec;
  manifest: TopicPageAssetManifest;
  generationSpec: TopicPageGenerationSpec;
  reader: TopicPageAssetReader;
  imageDecoder: TopicPageImageDecoder;
}

function exactOrder(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export async function runTopicPageQa(options: RunTopicPageQaOptions): Promise<TopicPageQaReport> {
  const { intent, selection, plan, contentSpec, manifest, generationSpec, reader, imageDecoder } = options;
  const issuesByCheck = new Map<TopicPageQaCheckId, string[]>([
    ["sources", []],
    ["bindings", []],
    ["modules", []],
    ["content", []],
    ["assets", []],
    ["accessibility-structure", []],
  ]);
  const add = (id: TopicPageQaCheckId, issue: string) => issuesByCheck.get(id)!.push(issue);

  if (plan.themeIntentDigest !== themeIntentDigest(intent)) {
    add("sources", "TopicPagePlan themeIntentDigest does not match ThemeIntent.");
  }
  if (plan.productSelectionDigest !== productSelectionDigest(selection)) {
    add("sources", "TopicPagePlan productSelectionDigest does not match ProductSelectionResult.");
  }
  if (manifest.digest !== topicPageAssetManifestDigest(manifest)) {
    add("bindings", "TopicPageAssetManifest digest is invalid.");
  }
  if (generationSpec.digest !== topicPageGenerationSpecDigest(generationSpec)) {
    add("bindings", "PageGenerationSpec digest is invalid.");
  }
  const expectedBindings = {
    themeIntentDigest: themeIntentDigest(intent),
    productSelectionDigest: productSelectionDigest(selection),
    topicPagePlanDigest: plan.digest,
    topicPageContentSpecDigest: contentSpec.digest,
    topicPageAssetManifestDigest: manifest.digest,
  };
  if (JSON.stringify(generationSpec.bindings) !== JSON.stringify(expectedBindings)) {
    add("bindings", "PageGenerationSpec bindings do not match frozen workflow artifacts.");
  }

  const visibleModules = plan.modules.filter(({ visible }) => visible);
  if (!exactOrder(generationSpec.moduleOrder, visibleModules.map(({ id }) => id)) ||
      !exactOrder(generationSpec.modules.map(({ id }) => id), generationSpec.moduleOrder)) {
    add("modules", "PageGenerationSpec module order does not match visible PagePlan modules.");
  }
  for (const module of generationSpec.modules) {
    const planModule = visibleModules.find(({ id }) => id === module.id);
    if (!planModule || planModule.component !== module.component) {
      add("modules", `Generated module ${module.id} does not match TopicPagePlan.`);
      continue;
    }
    if (!module.copy.title.text.trim()) {
      add("content", `Generated module ${module.id} requires non-empty title copy.`);
    }
    if (!exactOrder(
      module.products.map(({ id }) => id),
      planModule.assignments.map(({ productId }) => productId),
    )) {
      add("modules", `Generated module ${module.id} products do not match TopicPagePlan assignments.`);
    }
  }

  const seenTaskIds = new Set<string>();
  const seenRefs = new Set<string>();
  for (const asset of manifest.assets) {
    if (seenTaskIds.has(asset.taskId)) add("assets", `Asset task ${asset.taskId} is duplicated.`);
    if (seenRefs.has(asset.artifact.ref)) add("assets", `Asset ref ${asset.artifact.ref} is duplicated.`);
    seenTaskIds.add(asset.taskId);
    seenRefs.add(asset.artifact.ref);
    let bytes: Uint8Array;
    try {
      bytes = await reader.get(asset.artifact.ref);
    } catch {
      add("assets", `Asset ${asset.taskId} is missing from the configured asset store.`);
      continue;
    }
    if (sha256Bytes(bytes) !== asset.artifact.digest) {
      add("assets", `Asset ${asset.taskId} byte digest does not match TopicPageAssetManifest.`);
    }
    const inspected = await imageDecoder.inspect(bytes);
    if (!inspected) {
      add("assets", `Asset ${asset.taskId} is not a decodable PNG, JPEG, or WebP image.`);
      continue;
    }
    if (inspected.mimeType !== asset.artifact.mimeType) {
      add("assets", `Asset ${asset.taskId} MIME ${inspected.mimeType} does not match declared MIME ${asset.artifact.mimeType}.`);
    }
    if (inspected.width !== asset.artifact.width || inspected.height !== asset.artifact.height) {
      add(
        "assets",
        `Asset ${asset.taskId} dimensions ${inspected.width}x${inspected.height} do not match declared dimensions ${asset.artifact.width}x${asset.artifact.height}.`,
      );
    }
    if (asset.kind === "shortcut-image") {
      if (asset.altText !== null) {
        add("accessibility-structure", `Decorative shortcut asset ${asset.taskId} must have null altText.`);
      }
    } else if (!asset.altText?.text.trim()) {
      add("accessibility-structure", `Asset ${asset.taskId} requires non-empty alt text.`);
    }
  }

  const checks: TopicPageQaCheck[] = [...issuesByCheck].map(([id, checkIssues]) => ({
    id,
    status: checkIssues.length === 0 ? "passed" : "failed",
    issueCount: checkIssues.length,
  }));
  const issues = [...issuesByCheck.values()].flat();
  const base = {
    schemaVersion: "topic-page-qa-report/v1" as const,
    status: issues.length === 0 ? "passed" as const : "qa-blocked" as const,
    generationSpecDigest: generationSpec.digest,
    topicPageAssetManifestDigest: manifest.digest,
    checks,
    issues,
  };
  return { ...base, digest: topicPageQaReportDigest(base) };
}

export function compileTopicPageReviewPackage(options: {
  executionPlan: LandingPageExecutionPlan;
  generationSpec: TopicPageGenerationSpec;
  qaReport: TopicPageQaReport;
  experienceReview: TopicPageExperienceReviewDecision;
  previewRefs: TopicPageReviewPackage["previewRefs"];
}): TopicPageReviewPackage {
  if (options.qaReport.status !== "passed") {
    throw new Error("ReviewPackage requires a passed QAReport.");
  }
  if (options.executionPlan.digest !== landingPageExecutionPlanDigest(options.executionPlan)) {
    throw new Error("ReviewPackage requires a valid LandingPageExecutionPlan digest.");
  }
  if (options.generationSpec.digest !== topicPageGenerationSpecDigest(options.generationSpec)) {
    throw new Error("ReviewPackage requires a valid PageGenerationSpec digest.");
  }
  if (options.qaReport.digest !== topicPageQaReportDigest(options.qaReport) ||
      options.qaReport.generationSpecDigest !== options.generationSpec.digest) {
    throw new Error("ReviewPackage requires a valid QAReport bound to PageGenerationSpec.");
  }
  if (options.experienceReview.status !== "review-recommended" ||
      options.experienceReview.recommendation !== "recommend-approval") {
    throw new Error("ReviewPackage requires an approval recommendation from ExperienceReview.");
  }
  if (options.experienceReview.digest !==
      topicPageExperienceReviewDecisionDigest(options.experienceReview) ||
      options.experienceReview.executionPlanDigest !== options.executionPlan.digest ||
      options.experienceReview.generationSpecDigest !== options.generationSpec.digest ||
      options.experienceReview.qaReportDigest !== options.qaReport.digest) {
    throw new Error("ReviewPackage requires a valid ExperienceReview bound to ExecutionPlan and QAReport.");
  }
  const base = {
    schemaVersion: "topic-page-review-package/v1" as const,
    status: "review-ready" as const,
    executionPlanDigest: options.executionPlan.digest,
    generationSpecDigest: options.generationSpec.digest,
    qaReportDigest: options.qaReport.digest,
    experienceReviewDigest: options.experienceReview.digest,
    evidenceManifestDigest: sha256Digest({
      executionPlanDigest: options.executionPlan.digest,
      generationSpecDigest: options.generationSpec.digest,
      qaReportDigest: options.qaReport.digest,
      experienceReviewDigest: options.experienceReview.digest,
      checks: options.qaReport.checks,
    }),
    previewRefs: { ...options.previewRefs },
  };
  return { ...base, digest: sha256Digest(base) };
}
