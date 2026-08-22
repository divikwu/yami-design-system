import "server-only";

import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import {
  createHttpTopicPageAgent,
  type HttpTopicPageAgent,
  type TopicIntentAgent,
  type TopicPageAssetStore,
  type TopicPageImageDecoder,
  type TopicPageReviewPreviewResolver,
  type TopicPageVisualProductionMode,
} from "@yami/topic-generator";
import { topicPageImageDecoder } from "./topic-page-image-decoder";
import { createConfiguredTopicPageReviewPreviewRegistry } from "./topic-page-review-preview-registry";

type RuntimeEnvironment = Record<string, string | undefined>;

export interface TopicGeneratorPageAutomationRuntime {
  topicIntentAgent?: TopicIntentAgent;
  topicPageAgent?: HttpTopicPageAgent;
  topicPageAssetStore?: TopicPageAssetStore;
  topicPageImageDecoder: TopicPageImageDecoder;
  topicPagePreviewResolver?: TopicPageReviewPreviewResolver;
  visualProductionMode: TopicPageVisualProductionMode;
  pageAutomationConfigurationIssues: string[];
}

function validAgentEndpoint(value: string) {
  const endpoint = new URL(value);
  const localHttp = endpoint.protocol === "http:" &&
    (endpoint.hostname === "127.0.0.1" || endpoint.hostname === "localhost");
  if (endpoint.protocol !== "https:" && !localHttp) {
    throw new Error("Topic Page Agent endpoint must use HTTPS, except on localhost.");
  }
  if (endpoint.username || endpoint.password) {
    throw new Error("Topic Page Agent endpoint must not contain credentials.");
  }
  return endpoint.toString();
}

function agentTimeout(value: string | undefined) {
  if (!value) return 330_000;
  const timeout = Number(value);
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 330_000) {
    throw new Error(
      "TOPIC_GENERATOR_PAGE_AGENT_TIMEOUT_MS must be between 1000 and 330000.",
    );
  }
  return timeout;
}

function visualProductionMode(
  value: string | undefined,
  issues: string[],
): TopicPageVisualProductionMode {
  const mode = value?.trim() || "generated-images";
  if (mode === "generated-images" || mode === "source-product-images") return mode;
  issues.push(
    "TOPIC_GENERATOR_VISUAL_PRODUCTION_MODE must be generated-images or source-product-images.",
  );
  return "generated-images";
}

function safeAssetRef(ref: string) {
  return ref.length > 0 && !ref.startsWith("/") && !ref.includes("\\") &&
    !/^[a-z][a-z0-9+.-]*:/i.test(ref) &&
    ref.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function createFileSystemAssetStore(root: string): TopicPageAssetStore {
  if (!isAbsolute(root)) {
    throw new Error("TOPIC_GENERATOR_ASSET_ROOT must be an absolute path.");
  }
  const resolvedRoot = resolve(root);
  const isInsideRoot = (rootPath: string, target: string) => {
    const fromRoot = relative(rootPath, target);
    return fromRoot === "" || (!fromRoot.startsWith("..") && !isAbsolute(fromRoot));
  };
  const targetPath = (ref: string) => {
    if (!safeAssetRef(ref)) throw new Error("Asset ref must be a safe relative path.");
    const target = resolve(resolvedRoot, ref);
    if (!isInsideRoot(resolvedRoot, target)) {
      throw new Error("Asset ref escapes TOPIC_GENERATOR_ASSET_ROOT.");
    }
    return target;
  };
  return {
    put: async (ref, bytes) => {
      const target = targetPath(ref);
      await mkdir(resolvedRoot, { recursive: true });
      await mkdir(dirname(target), { recursive: true });
      const [realRoot, realParent] = await Promise.all([
        realpath(resolvedRoot),
        realpath(dirname(target)),
      ]);
      if (!isInsideRoot(realRoot, realParent)) {
        throw new Error("Asset ref resolves outside TOPIC_GENERATOR_ASSET_ROOT.");
      }
      await writeFile(target, bytes);
    },
    get: async (ref) => {
      const [realRoot, realTarget] = await Promise.all([
        realpath(resolvedRoot),
        realpath(targetPath(ref)),
      ]);
      if (!isInsideRoot(realRoot, realTarget)) {
        throw new Error("Asset ref resolves outside TOPIC_GENERATOR_ASSET_ROOT.");
      }
      return new Uint8Array(await readFile(realTarget));
    },
    publicUrl: (ref) => {
      targetPath(ref);
      return `/api/topic-generator/assets?ref=${encodeURIComponent(ref)}`;
    },
  };
}

export async function loadTopicGeneratorPageAutomationRuntime(options: {
  environment?: RuntimeEnvironment;
  fetch?: typeof fetch;
} = {}): Promise<TopicGeneratorPageAutomationRuntime> {
  const environment = options.environment ?? process.env;
  const issues: string[] = [];
  const configuredVisualProductionMode = visualProductionMode(
    environment.TOPIC_GENERATOR_VISUAL_PRODUCTION_MODE,
    issues,
  );
  let topicPageAgent: HttpTopicPageAgent | undefined;
  const endpoint = environment.TOPIC_GENERATOR_PAGE_AGENT_ENDPOINT?.trim();
  if (!endpoint) {
    issues.push("TOPIC_GENERATOR_PAGE_AGENT_ENDPOINT is not configured.");
  } else {
    try {
      topicPageAgent = createHttpTopicPageAgent({
        id: environment.TOPIC_GENERATOR_PAGE_AGENT_ID?.trim() || "topic-page-agent",
        endpoint: validAgentEndpoint(endpoint),
        token: environment.TOPIC_GENERATOR_PAGE_AGENT_TOKEN?.trim() || undefined,
        timeoutMs: agentTimeout(environment.TOPIC_GENERATOR_PAGE_AGENT_TIMEOUT_MS),
        fetch: options.fetch,
        agentIds: {
          "topic-intent": environment.TOPIC_GENERATOR_TOPIC_INTENT_AGENT_ID?.trim() ||
            environment.TOPIC_GENERATOR_STRATEGY_AGENT_ID?.trim() ||
            "topic-strategy",
          "background-evidence":
            environment.TOPIC_GENERATOR_BACKGROUND_EVIDENCE_AGENT_ID?.trim() ||
            "topic-background-evidence",
          "workflow-planning": environment.TOPIC_GENERATOR_ORCHESTRATOR_AGENT_ID?.trim() ||
            "topic-page-orchestrator",
          "module-merchandising": environment.TOPIC_GENERATOR_STRATEGY_AGENT_ID?.trim() ||
            "topic-strategy",
          "content-writing": environment.TOPIC_GENERATOR_CONTENT_AGENT_ID?.trim() ||
            "topic-content",
          "content-review": environment.TOPIC_GENERATOR_CONTENT_REVIEW_AGENT_ID?.trim() ||
            "topic-content-review",
          "visual-generation": environment.TOPIC_GENERATOR_VISUAL_AGENT_ID?.trim() ||
            "topic-visual",
          "experience-review": environment.TOPIC_GENERATOR_REVIEW_AGENT_ID?.trim() ||
            "topic-review",
        },
      });
    } catch (error) {
      issues.push(
        error instanceof Error
          ? `Configured Topic Page Agent is invalid: ${error.message}`
          : "Configured Topic Page Agent is invalid.",
      );
    }
  }

  let topicPageAssetStore: TopicPageAssetStore | undefined;
  let topicPagePreviewResolver: TopicPageReviewPreviewResolver | undefined;
  const assetRoot = environment.TOPIC_GENERATOR_ASSET_ROOT?.trim();
  if (!assetRoot) {
    issues.push("TOPIC_GENERATOR_ASSET_ROOT is not configured.");
  } else {
    try {
      topicPageAssetStore = createFileSystemAssetStore(assetRoot);
    } catch (error) {
      issues.push(
        error instanceof Error
          ? `Configured Topic Page asset store is invalid: ${error.message}`
          : "Configured Topic Page asset store is invalid.",
      );
    }
  }
  if (topicPageAssetStore) {
    try {
      const previewRegistry = createConfiguredTopicPageReviewPreviewRegistry(environment);
      topicPagePreviewResolver = ({ executionPlan, generationSpec }) =>
        previewRegistry.publish({
          pageTypeRef: executionPlan.pageTypeRef,
          generationSpec,
        });
    } catch (error) {
      issues.push(
        error instanceof Error
          ? `Configured Topic Page preview registry is invalid: ${error.message}`
          : "Configured Topic Page preview registry is invalid.",
      );
    }
  }

  return {
    topicIntentAgent: topicPageAgent,
    topicPageAgent,
    topicPageAssetStore,
    topicPageImageDecoder,
    topicPagePreviewResolver,
    visualProductionMode: configuredVisualProductionMode,
    pageAutomationConfigurationIssues: issues,
  };
}

let runtimePromise: Promise<TopicGeneratorPageAutomationRuntime> | undefined;

export function getTopicGeneratorPageAutomationRuntime() {
  runtimePromise ??= loadTopicGeneratorPageAutomationRuntime();
  return runtimePromise;
}
