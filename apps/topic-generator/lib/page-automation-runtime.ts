import "server-only";

import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import {
  createHttpTopicPageAgent,
  type HttpTopicPageAgent,
  type TopicPageAssetStore,
  type TopicPageImageDecoder,
} from "@yami/topic-generator";
import { topicPageImageDecoder } from "./topic-page-image-decoder";

type RuntimeEnvironment = Record<string, string | undefined>;

export interface TopicGeneratorPageAutomationRuntime {
  topicPageAgent?: HttpTopicPageAgent;
  topicPageAssetStore?: TopicPageAssetStore;
  topicPageImageDecoder: TopicPageImageDecoder;
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
  if (!value) return 120_000;
  const timeout = Number(value);
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 300_000) {
    throw new Error(
      "TOPIC_GENERATOR_PAGE_AGENT_TIMEOUT_MS must be between 1000 and 300000.",
    );
  }
  return timeout;
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
          "workflow-planning": environment.TOPIC_GENERATOR_ORCHESTRATOR_AGENT_ID?.trim() ||
            "topic-page-orchestrator",
          "module-merchandising": environment.TOPIC_GENERATOR_STRATEGY_AGENT_ID?.trim() ||
            "topic-strategy",
          "content-writing": environment.TOPIC_GENERATOR_CONTENT_AGENT_ID?.trim() ||
            "topic-content",
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

  return {
    topicPageAgent,
    topicPageAssetStore,
    topicPageImageDecoder,
    pageAutomationConfigurationIssues: issues,
  };
}

let runtimePromise: Promise<TopicGeneratorPageAutomationRuntime> | undefined;

export function getTopicGeneratorPageAutomationRuntime() {
  runtimePromise ??= loadTopicGeneratorPageAutomationRuntime();
  return runtimePromise;
}
