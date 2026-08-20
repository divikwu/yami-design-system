import type { TopicContentAgent } from "../page-content/workflow.js";
import type { LandingPageOrchestratorAgent } from "../page-orchestration/workflow.js";
import type { PageMerchandisingAgent } from "../page-merchandising/workflow.js";
import type { TopicPageReviewAgent } from "../page-review/workflow.js";
import type {
  TopicPageVisualAgentOutput,
  TopicPageVisualAssetBody,
  TopicPageVisualMimeType,
} from "../page-visual/contracts.js";
import type { TopicVisualAgent } from "../page-visual/workflow.js";
import type { TopicIntentAgent } from "../topic-intent.js";

export type HttpTopicPageAgentStage =
  | "topic-intent"
  | "workflow-planning"
  | "module-merchandising"
  | "content-writing"
  | "visual-generation"
  | "experience-review";

export type HttpTopicPageAgent = TopicIntentAgent & LandingPageOrchestratorAgent & PageMerchandisingAgent &
  TopicContentAgent & TopicVisualAgent & TopicPageReviewAgent;

export interface CreateHttpTopicPageAgentOptions {
  id: string;
  endpoint: string;
  token?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
  agentIds?: Partial<Record<HttpTopicPageAgentStage, string>>;
}

export class HttpTopicPageAgentError extends Error {
  readonly agentId: string;
  readonly code?: string;
  readonly stage: HttpTopicPageAgentStage;
  readonly status?: number;

  constructor(options: {
    agentId: string;
    code?: string;
    stage: HttpTopicPageAgentStage;
    message: string;
    status?: number;
  }) {
    super(options.message);
    this.name = "HttpTopicPageAgentError";
    this.agentId = options.agentId;
    this.code = options.code;
    this.stage = options.stage;
    this.status = options.status;
  }
}

const MAX_RUNNER_ERROR_BYTES = 8 * 1024;

async function boundedRunnerError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const declaredLength = response.headers.get("content-length");
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }
  if (declaredLength !== null) {
    const contentLength = Number(declaredLength);
    if (!Number.isInteger(contentLength) || contentLength < 0 ||
        contentLength > MAX_RUNNER_ERROR_BYTES) {
      return null;
    }
  }
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RUNNER_ERROR_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const payload = objectValue(JSON.parse(new TextDecoder().decode(bytes)) as unknown);
    const code = typeof payload?.code === "string" ? payload.code.trim() : "";
    const message = typeof payload?.message === "string" ? payload.message.trim() : "";
    if (payload?.schemaVersion !== "topic-agent-runner-error/v1" ||
        !/^[a-z][a-z0-9_]{0,63}$/.test(code) || !message || message.length > 512) {
      return null;
    }
    return { code, message };
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function safeRelativeRef(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    value.split("/").every((part) => part !== "" && part !== "." && part !== "..");
}

function mimeType(value: unknown): value is TopicPageVisualMimeType {
  return value === "image/png" || value === "image/jpeg" || value === "image/webp";
}

function base64Value(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length % 4 === 0 &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function visualAssetBody(value: unknown): TopicPageVisualAssetBody | null {
  const body = objectValue(value);
  if (!body || typeof body.taskId !== "string" || !body.taskId.trim() ||
      !safeRelativeRef(body.ref) || !mimeType(body.mimeType) ||
      !base64Value(body.dataBase64)) {
    return null;
  }
  return {
    taskId: body.taskId,
    ref: body.ref,
    mimeType: body.mimeType,
    dataBase64: body.dataBase64,
  };
}

export function createHttpTopicPageAgent(
  options: CreateHttpTopicPageAgentOptions,
): HttpTopicPageAgent {
  const fetchImplementation = options.fetch ?? fetch;
  const requestProposal = async (
    stage: HttpTopicPageAgentStage,
    run: unknown,
  ): Promise<unknown | TopicPageVisualAgentOutput> => {
    const agentId = options.agentIds?.[stage] ?? options.id;
    let response: Response;
    try {
      response = await fetchImplementation(options.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        },
        body: JSON.stringify({
          schemaVersion: "topic-page-agent-request/v1",
          stage,
          agentId,
          run,
        }),
        signal: AbortSignal.timeout(options.timeoutMs ?? 60_000),
      });
    } catch (error) {
      throw new HttpTopicPageAgentError({
        agentId,
        stage,
        message: error instanceof Error
          ? `Topic Page Agent request failed: ${error.message}`
          : "Topic Page Agent request failed.",
      });
    }
    if (!response.ok) {
      const runnerError = await boundedRunnerError(response);
      throw new HttpTopicPageAgentError({
        agentId,
        code: runnerError?.code,
        stage,
        status: response.status,
        message: runnerError?.message ?? `Topic Page Agent returned HTTP ${response.status}.`,
      });
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new HttpTopicPageAgentError({
        agentId,
        stage,
        status: response.status,
        message: "Topic Page Agent response must be valid JSON.",
      });
    }
    const result = objectValue(payload);
    if (result?.schemaVersion !== "topic-page-agent-response/v1" || !("proposal" in result)) {
      throw new HttpTopicPageAgentError({
        agentId,
        stage,
        status: response.status,
        message: 'Topic Page Agent response must use "topic-page-agent-response/v1".',
      });
    }
    if (result.stage !== stage) {
      throw new HttpTopicPageAgentError({
        agentId,
        stage,
        status: response.status,
        message: `Topic Page Agent response stage must be "${stage}".`,
      });
    }
    if (stage !== "visual-generation") return result.proposal;
    const rawAssets = Array.isArray(result.assets) ? result.assets : [];
    const assets = rawAssets.map(visualAssetBody);
    if (!Array.isArray(result.assets) || assets.some((asset) => asset === null)) {
      throw new HttpTopicPageAgentError({
        agentId,
        stage,
        status: response.status,
        message: "Topic Page Agent visual response contains an invalid asset body.",
      });
    }
    return {
      schemaVersion: "topic-page-visual-agent-output/v1",
      proposal: result.proposal,
      assets: assets as TopicPageVisualAssetBody[],
    };
  };

  return {
    id: options.id,
    proposeSemanticIntent: (run) => requestProposal("topic-intent", run),
    proposeExecutionPlan: (run) => requestProposal("workflow-planning", run),
    proposeModuleMerchandising: (run) => requestProposal("module-merchandising", run),
    proposePageContent: (run) => requestProposal("content-writing", run),
    generatePageVisuals: (run) => requestProposal("visual-generation", run),
    reviewPageExperience: (run) => requestProposal("experience-review", run),
  };
}
