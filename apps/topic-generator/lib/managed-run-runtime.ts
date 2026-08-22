import "server-only";

import { access } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import {
  TopicGeneratorRunStore,
  createTopicGeneratorManagedStageExecutor,
} from "@yami/topic-generator";
import { loadTopicGeneratorPageAutomationRuntime } from "./page-automation-runtime";
import { loadTopicGeneratorProductSelectionRuntime } from "./product-selection-runtime";
import { createManagedTopicPageReviewPreviewRegistry } from "./topic-page-review-preview-registry";
import { createTopicGeneratorOfflineRenderer } from "./topic-generator-offline-export";

type RuntimeEnvironment = Record<string, string | undefined>;

async function workspaceRoot(cwd: string) {
  let current = resolve(cwd);
  for (let depth = 0; depth < 6; depth += 1) {
    try {
      await access(join(current, "pnpm-workspace.yaml"));
      return current;
    } catch {
      const parent = resolve(current, "..");
      if (parent === current) break;
      current = parent;
    }
  }
  throw new Error("TOPIC GENERATOR workspace root could not be resolved.");
}

export async function resolveTopicGeneratorRunRoot(options: {
  environment?: RuntimeEnvironment;
  cwd?: string;
} = {}) {
  const environment = options.environment ?? process.env;
  const configured = environment.TOPIC_GENERATOR_RUN_ROOT?.trim();
  if (configured) {
    if (!isAbsolute(configured)) {
      throw new Error("TOPIC_GENERATOR_RUN_ROOT must be an absolute path.");
    }
    return resolve(configured);
  }
  if (environment.NODE_ENV === "production") {
    throw new Error(
      "TOPIC_GENERATOR_RUN_ROOT is required in production and must point to persistent storage.",
    );
  }
  return join(await workspaceRoot(options.cwd ?? process.cwd()), ".topic-generator", "runs");
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
  const renderer = createTopicGeneratorOfflineRenderer({ fetch: options.fetch });
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
