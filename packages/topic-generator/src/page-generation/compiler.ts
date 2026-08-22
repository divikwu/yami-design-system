import type { ThemeIntent } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import { productSelectionDigest, themeIntentDigest } from "../page-merchandising/review.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import { topicPageContentSpecDigest, topicPagePlanDigest } from "../page-content/review.js";
import type { TopicPageContentSpec } from "../page-content/contracts.js";
import type { TopicBackgroundEvidenceBundle } from "../background-evidence/contracts.js";
import { reviewTopicPageVisualPreflight, reviewTopicPageVisualProposal } from "../page-visual/review.js";
import type { TopicPageAssetManifest } from "../page-visual/contracts.js";
import type { TopicPageGenerationSpec } from "./contracts.js";
import { topicPageAssetManifestDigest, topicPageGenerationSpecDigest } from "./digest.js";
import { topicPageGeneratedProductGroups } from "./groups.js";

export interface CompileTopicPageGenerationSpecOptions {
  intent: ThemeIntent;
  selection: ProductSelectionResult;
  plan: TopicPagePlanV2;
  contentSpec: TopicPageContentSpec;
  backgroundEvidence?: TopicBackgroundEvidenceBundle;
  manifest: TopicPageAssetManifest;
  assetUrl(ref: string): string;
}

function exactOrder(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function preflightIssues(options: CompileTopicPageGenerationSpecOptions) {
  const { intent, selection, plan, contentSpec, backgroundEvidence, manifest } = options;
  const issues = reviewTopicPageVisualPreflight(
    intent,
    selection,
    plan,
    contentSpec,
    backgroundEvidence,
  );
  if (plan.digest !== topicPagePlanDigest(plan)) issues.push("TopicPagePlan digest is invalid.");
  if (contentSpec.digest !== topicPageContentSpecDigest(contentSpec)) {
    issues.push("TopicPageContentSpec digest is invalid.");
  }
  if (contentSpec.topicPagePlanDigest !== plan.digest) {
    issues.push("TopicPageContentSpec topicPagePlanDigest does not match TopicPagePlan.");
  }
  if (manifest.schemaVersion !== "topic-page-asset-manifest/v1" ||
      manifest.status !== "asset-manifest-ready") {
    issues.push("PageGenerationSpec requires a ready topic-page-asset-manifest/v1.");
  }
  if (manifest.digest !== topicPageAssetManifestDigest(manifest)) {
    issues.push("TopicPageAssetManifest digest is invalid.");
  }
  if (manifest.topicPagePlanDigest !== plan.digest) {
    issues.push("TopicPageAssetManifest topicPagePlanDigest does not match TopicPagePlan.");
  }
  if (manifest.topicPageContentSpecDigest !== contentSpec.digest) {
    issues.push("TopicPageAssetManifest topicPageContentSpecDigest does not match TopicPageContentSpec.");
  }
  if (manifest.themeIntentDigest !== themeIntentDigest(intent) ||
      manifest.themeIntentDigest !== plan.themeIntentDigest) {
    issues.push("TopicPageAssetManifest themeIntentDigest does not match frozen inputs.");
  }
  if (manifest.productSelectionDigest !== productSelectionDigest(selection) ||
      manifest.productSelectionDigest !== plan.productSelectionDigest) {
    issues.push("TopicPageAssetManifest productSelectionDigest does not match frozen inputs.");
  }
  if (manifest.keyword !== plan.keyword || manifest.site !== plan.site ||
      manifest.language !== contentSpec.language || manifest.strategyRef !== plan.strategyRef ||
      manifest.templateRef !== plan.templateRef) {
    issues.push("TopicPageAssetManifest identity does not match PagePlan and ContentSpec.");
  }
  const reconstructedProposal = {
    schemaVersion: "topic-page-visual-proposal/v1",
    keyword: manifest.keyword,
    site: manifest.site,
    language: manifest.language,
    topicPagePlanDigest: manifest.topicPagePlanDigest,
    topicPageContentSpecDigest: manifest.topicPageContentSpecDigest,
    themeIntentDigest: manifest.themeIntentDigest,
    productSelectionDigest: manifest.productSelectionDigest,
    assets: manifest.assets,
  };
  issues.push(...reviewTopicPageVisualProposal(
    intent,
    selection,
    plan,
    contentSpec,
    reconstructedProposal,
  ).issues);
  const visibleModules = plan.modules.filter(({ visible }) => visible);
  if (!exactOrder(
    visibleModules.flatMap(({ assetTaskIds }) => assetTaskIds),
    manifest.assets.map(({ taskId }) => taskId),
  )) {
    issues.push("TopicPageAssetManifest assets do not match visible PagePlan asset tasks.");
  }
  return [...new Set(issues)];
}

export function compileTopicPageGenerationSpec(
  options: CompileTopicPageGenerationSpecOptions,
): TopicPageGenerationSpec {
  const issues = preflightIssues(options);
  if (issues.length > 0) {
    throw new Error(`PageGenerationSpec preflight failed: ${issues.join(" ")}`);
  }
  const { intent, selection, plan, contentSpec, manifest, assetUrl } = options;
  const productsById = new Map(selection.products.map((product) => [product.id, product]));
  const contentByTaskId = new Map(contentSpec.tasks.map((task) => [task.taskId, task]));
  const assetsByModuleId = new Map(plan.modules.map((module) => [
    module.id,
    manifest.assets.filter((asset) => asset.moduleId === module.id),
  ]));
  const visibleModules = plan.modules.filter(({ visible }) => visible);
  const base = {
    schemaVersion: "topic-page-generation-spec/v1" as const,
    status: "generation-ready" as const,
    keyword: plan.keyword,
    site: plan.site,
    language: contentSpec.language,
    strategyRef: plan.strategyRef,
    templateRef: plan.templateRef,
    bindings: {
      themeIntentDigest: themeIntentDigest(intent),
      productSelectionDigest: productSelectionDigest(selection),
      topicPagePlanDigest: plan.digest,
      topicPageContentSpecDigest: contentSpec.digest,
      topicPageAssetManifestDigest: manifest.digest,
    },
    moduleOrder: visibleModules.map(({ id }) => id),
    modules: visibleModules.map((module) => {
      const content = contentByTaskId.get(module.contentTaskId!)!;
      return {
        id: module.id,
        component: module.component,
        shoppingGoal: module.shoppingGoal,
        reason: module.reason,
        copy: structuredClone(content.copy),
        products: module.assignments.map(({ productId, pool, role }) => {
          const product = productsById.get(productId)!;
          return {
            id: product.id,
            title: product.title,
            brand: product.brand,
            price: product.price,
            imageUrl: product.imageUrl,
            productUrl: product.productUrl,
            sourceRank: product.sourceRank,
            pool,
            role,
          };
        }),
        groups: topicPageGeneratedProductGroups(selection, module, content.copy.groups),
        scenes: module.scenes.map((scene) => ({
          ...scene,
          productIds: [...scene.productIds],
        })),
        assets: (assetsByModuleId.get(module.id) ?? []).map((asset) => ({
          taskId: asset.taskId,
          kind: asset.kind,
          ref: asset.artifact.ref,
          url: assetUrl(asset.artifact.ref),
          mimeType: asset.artifact.mimeType,
          width: asset.artifact.width,
          height: asset.artifact.height,
          digest: asset.artifact.digest,
          focalPoint: { ...asset.artifact.focalPoint },
          ...(asset.artifact.backgroundColor
            ? { backgroundColor: asset.artifact.backgroundColor }
            : {}),
          altText: asset.altText ? structuredClone(asset.altText) : null,
        })),
      };
    }),
  };
  return { ...base, digest: topicPageGenerationSpecDigest(base) };
}
