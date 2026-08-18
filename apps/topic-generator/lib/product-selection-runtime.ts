import "server-only";

import { readFile, stat } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import {
  createHttpProductSelectionAgent,
  createLandingPageAgentTaxonomySnapshot,
  parseCatalogTaxonomySnapshot,
  type CatalogTaxonomySnapshot,
  type ProductSelectionAgent,
} from "@yami/topic-generator";

type RuntimeEnvironment = Record<string, string | undefined>;

export interface TopicGeneratorProductSelectionRuntime {
  taxonomySnapshot?: CatalogTaxonomySnapshot;
  productSelectionAgent?: ProductSelectionAgent;
  categoryRoleConfigurationIssues: string[];
}

function validAgentEndpoint(value: string) {
  const endpoint = new URL(value);
  const localHttp = endpoint.protocol === "http:" &&
    (endpoint.hostname === "127.0.0.1" || endpoint.hostname === "localhost");
  if (endpoint.protocol !== "https:" && !localHttp) {
    throw new Error("Product Agent endpoint must use HTTPS, except on localhost.");
  }
  if (endpoint.username || endpoint.password) {
    throw new Error("Product Agent endpoint must not contain credentials.");
  }
  return endpoint.toString();
}

function agentTimeout(value: string | undefined) {
  if (!value) return 30_000;
  const timeout = Number(value);
  if (!Number.isInteger(timeout) || timeout < 1_000 || timeout > 120_000) {
    throw new Error("TOPIC_GENERATOR_AGENT_TIMEOUT_MS must be between 1000 and 120000.");
  }
  return timeout;
}

async function loadTaxonomySnapshot(
  taxonomyPath: string,
  sourceRef: string,
): Promise<CatalogTaxonomySnapshot> {
  const resolvedPath = resolve(taxonomyPath);
  const [contents, fileStat] = await Promise.all([
    readFile(resolvedPath, "utf8"),
    stat(resolvedPath),
  ]);
  if (extname(resolvedPath).toLowerCase() === ".json") {
    return parseCatalogTaxonomySnapshot(JSON.parse(contents) as unknown);
  }
  return createLandingPageAgentTaxonomySnapshot({
    site: "us",
    sourceRef,
    fetchedAt: fileStat.mtime.toISOString(),
    tsv: contents,
  });
}

export async function loadTopicGeneratorProductSelectionRuntime(options: {
  environment?: RuntimeEnvironment;
  fetch?: typeof fetch;
} = {}): Promise<TopicGeneratorProductSelectionRuntime> {
  const environment = options.environment ?? process.env;
  const issues: string[] = [];
  const taxonomyPath = environment.TOPIC_GENERATOR_TAXONOMY_PATH?.trim();
  let taxonomySnapshot: CatalogTaxonomySnapshot | undefined;
  if (!taxonomyPath) {
    issues.push("TOPIC_GENERATOR_TAXONOMY_PATH is not configured.");
  } else {
    try {
      taxonomySnapshot = await loadTaxonomySnapshot(
        taxonomyPath,
        environment.TOPIC_GENERATOR_TAXONOMY_SOURCE_REF?.trim() || basename(taxonomyPath),
      );
    } catch {
      issues.push("Configured taxonomy artifact could not be loaded or parsed.");
    }
  }

  const agentEndpoint = environment.TOPIC_GENERATOR_AGENT_ENDPOINT?.trim();
  let productSelectionAgent: ProductSelectionAgent | undefined;
  if (!agentEndpoint) {
    issues.push("TOPIC_GENERATOR_AGENT_ENDPOINT is not configured.");
  } else {
    try {
      productSelectionAgent = createHttpProductSelectionAgent({
        id: environment.TOPIC_GENERATOR_AGENT_ID?.trim() || "topic-product-agent",
        endpoint: validAgentEndpoint(agentEndpoint),
        token: environment.TOPIC_GENERATOR_AGENT_TOKEN?.trim() || undefined,
        timeoutMs: agentTimeout(environment.TOPIC_GENERATOR_AGENT_TIMEOUT_MS),
        fetch: options.fetch,
      });
    } catch (error) {
      issues.push(
        error instanceof Error
          ? `Configured Product Agent is invalid: ${error.message}`
          : "Configured Product Agent is invalid.",
      );
    }
  }

  return {
    taxonomySnapshot,
    productSelectionAgent,
    categoryRoleConfigurationIssues: issues,
  };
}

let runtimePromise: Promise<TopicGeneratorProductSelectionRuntime> | undefined;

export function getTopicGeneratorProductSelectionRuntime() {
  runtimePromise ??= loadTopicGeneratorProductSelectionRuntime();
  return runtimePromise;
}
