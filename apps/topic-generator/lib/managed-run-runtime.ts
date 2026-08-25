import "server-only";

import {
  TopicGeneratorRunStore,
  createTopicGeneratorManagedStageExecutor,
} from "@yami/topic-generator";
import { loadTopicGeneratorPageAutomationRuntime } from "./page-automation-runtime";
import { loadTopicGeneratorProductSelectionRuntime } from "./product-selection-runtime";
import { createManagedTopicPageReviewPreviewRegistry } from "./topic-page-review-preview-registry";
import { createTopicGeneratorOfflineRenderer } from "./topic-generator-offline-export";
import { resolveTopicGeneratorRunStorageRoot } from "./topic-generator-storage";

type RuntimeEnvironment = Record<string, string | undefined>;

export async function resolveTopicGeneratorRunRoot(options: {
  environment?: RuntimeEnvironment;
  cwd?: string;
  homeDirectory?: string;
} = {}) {
  return resolveTopicGeneratorRunStorageRoot(options);
}

export async function loadTopicGeneratorManagedRunRuntime(options: {
  environment?: RuntimeEnvironment;
  cwd?: string;
  fetch?: typeof fetch;
} = {}) {
  const environment = options.environment ?? process.env;
  const root = await resolveTopicGeneratorRunRoot({
    environment,
    cwd: options.cwd,
  });
  const [productRuntime, pageRuntime] = await Promise.all([
    loadTopicGeneratorProductSelectionRuntime({ environment, fetch: options.fetch }),
    loadTopicGeneratorPageAutomationRuntime({ environment, fetch: options.fetch }),
  ]);
  const store = new TopicGeneratorRunStore({ root });
  const renderer = createTopicGeneratorOfflineRenderer();
  const previewRegistry = createManagedTopicPageReviewPreviewRegistry({
    runRoot: root,
    environment,
  });
  const execute = createTopicGeneratorManagedStageExecutor({
    ...productRuntime,
    ...pageRuntime,
    topicPageAssetStore: undefined,
    topicPagePreviewResolver: ({ executionPlan, generationSpec }) =>
      previewRegistry.publish({
        pageTypeRef: executionPlan.pageTypeRef,
        generationSpec,
      }),
    pageAutomationConfigurationIssues: pageRuntime.pageAutomationConfigurationIssues.filter(
      (issue) => !issue.includes("TOPIC_GENERATOR_ASSET_ROOT"),
    ),
    requireAutomaticCategoryRole: true,
    requireAutomaticModuleReview: true,
    requireAutomaticPage: true,
    deliverableRenderer: renderer,
  });
  return { root, store, renderer, execute };
}

let runtimePromise: ReturnType<typeof loadTopicGeneratorManagedRunRuntime> | undefined;

export function getTopicGeneratorManagedRunRuntime() {
  runtimePromise ??= loadTopicGeneratorManagedRunRuntime();
  return runtimePromise;
}
