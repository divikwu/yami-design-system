import type { TopicContentAgent } from "../page-content/workflow.js";
import type { TopicBackgroundEvidenceAgent } from "../background-evidence/workflow.js";
import type { TopicPageContentReviewAgent } from "../page-content/content-review.js";
import type { TopicPageContentCandidateSelectorAgent } from "../page-content/candidates.js";
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
  | "background-evidence"
  | "workflow-planning"
  | "module-merchandising"
  | "content-writing"
  | "content-review"
  | "visual-generation"
  | "experience-review";

export type HttpTopicPageAgent = TopicIntentAgent & TopicBackgroundEvidenceAgent &
  LandingPageOrchestratorAgent & PageMerchandisingAgent & TopicContentAgent &
  TopicPageContentCandidateSelectorAgent & TopicPageContentReviewAgent &
  TopicVisualAgent & TopicPageReviewAgent & {
    reviewerAgentId: string;
    selectorAgentId: string;
  };

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
const VISUAL_REQUEST_CONCURRENCY = 2;

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

function generatedImageVisualTasks(run: unknown) {
  const value = objectValue(run);
  const context = objectValue(value?.context);
  if (value?.schemaVersion !== "topic-page-visual-run/v1" ||
      value.status !== "needs-visual-proposal" ||
      context?.productionMode !== "generated-images" ||
      !Array.isArray(context.tasks) || context.tasks.length < 2) {
    return null;
  }
  const tasks = context.tasks.map(objectValue);
  const taskIds = tasks.map((task) =>
    typeof task?.taskId === "string" ? task.taskId.trim() : ""
  );
  if (tasks.some((task) => task === null) || taskIds.some((taskId) => !taskId) ||
      new Set(taskIds).size !== taskIds.length) {
    return null;
  }
  return {
    context,
    run: value,
    tasks: tasks as Record<string, unknown>[],
    taskIds,
  };
}

async function mapWithConcurrency<T, U>(
  values: T[],
  concurrency: number,
  worker: (value: T, index: number) => Promise<U>,
) {
  const results = new Array<U>(values.length);
  let nextIndex = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (nextIndex < values.length) {
        const index = nextIndex++;
        results[index] = await worker(values[index]!, index);
      }
    }),
  );
  return results;
}

function reindexedVisualRef(ref: string, index: number) {
  const separator = ref.lastIndexOf("/") + 1;
  const directory = ref.slice(0, separator);
  const filename = ref.slice(separator).replace(/^\d+-/, "");
  const nextRef = `${directory}${String(index + 1).padStart(2, "0")}-${filename}`;
  return safeRelativeRef(nextRef) ? nextRef : null;
}

function mergeVisualTaskOutputs(
  outputs: TopicPageVisualAgentOutput[],
  taskIds: string[],
  agentId: string,
) {
  const proposalAssets: Record<string, unknown>[] = [];
  const assetBodies: TopicPageVisualAssetBody[] = [];
  let proposalMetadata: Record<string, unknown> | undefined;
  let proposalMetadataDigest: string | undefined;

  outputs.forEach((output, index) => {
    const expectedTaskId = taskIds[index]!;
    const proposal = objectValue(output.proposal);
    const rawProposalAssets = Array.isArray(proposal?.assets) ? proposal.assets : [];
    const proposalAsset = rawProposalAssets.length === 1
      ? objectValue(rawProposalAssets[0])
      : null;
    const artifact = objectValue(proposalAsset?.artifact);
    const body = output.assets.length === 1 ? output.assets[0] : undefined;
    if (proposal?.schemaVersion !== "topic-page-visual-proposal/v1" || !proposalAsset ||
        !artifact || proposalAsset.taskId !== expectedTaskId ||
        typeof artifact.ref !== "string" || body?.taskId !== expectedTaskId ||
        body.ref !== artifact.ref) {
      throw new HttpTopicPageAgentError({
        agentId,
        stage: "visual-generation",
        message: `Topic Page Agent visual task "${expectedTaskId}" returned an invalid response.`,
      });
    }
    const ref = reindexedVisualRef(body.ref, index);
    if (!ref) {
      throw new HttpTopicPageAgentError({
        agentId,
        stage: "visual-generation",
        message: `Topic Page Agent visual task "${expectedTaskId}" returned an invalid asset ref.`,
      });
    }
    const metadata = Object.fromEntries(
      Object.entries(proposal).filter(([key]) => key !== "assets"),
    );
    const metadataDigest = JSON.stringify(metadata);
    if (proposalMetadataDigest !== undefined && metadataDigest !== proposalMetadataDigest) {
      throw new HttpTopicPageAgentError({
        agentId,
        stage: "visual-generation",
        message: `Topic Page Agent visual task "${expectedTaskId}" changed shared proposal metadata.`,
      });
    }
    proposalMetadata ??= metadata;
    proposalMetadataDigest ??= metadataDigest;
    proposalAssets.push({
      ...proposalAsset,
      artifact: { ...artifact, ref },
    });
    assetBodies.push({ ...body, ref });
  });

  return {
    schemaVersion: "topic-page-visual-agent-output/v1" as const,
    proposal: { ...proposalMetadata, assets: proposalAssets },
    assets: assetBodies,
  };
}

export function createHttpTopicPageAgent(
  options: CreateHttpTopicPageAgentOptions,
): HttpTopicPageAgent {
  const fetchImplementation = options.fetch ?? fetch;
  const agentIdFor = (stage: HttpTopicPageAgentStage) =>
    options.agentIds?.[stage] ?? options.id;
  const requestSingleProposal = async (
    stage: HttpTopicPageAgentStage,
    run: unknown,
  ): Promise<unknown | TopicPageVisualAgentOutput> => {
    const agentId = agentIdFor(stage);
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
  const requestProposal = async (
    stage: HttpTopicPageAgentStage,
    run: unknown,
  ): Promise<unknown | TopicPageVisualAgentOutput> => {
    if (stage !== "visual-generation") return await requestSingleProposal(stage, run);
    const visualRun = generatedImageVisualTasks(run);
    if (!visualRun) return await requestSingleProposal(stage, run);
    const agentId = agentIdFor(stage);
    const outputs = await mapWithConcurrency(
      visualRun.tasks,
      VISUAL_REQUEST_CONCURRENCY,
      async (task, index) => {
        const taskId = visualRun.taskIds[index]!;
        try {
          return await requestSingleProposal(stage, {
            ...visualRun.run,
            context: { ...visualRun.context, tasks: [task] },
          }) as TopicPageVisualAgentOutput;
        } catch (error) {
          if (error instanceof HttpTopicPageAgentError) {
            throw new HttpTopicPageAgentError({
              agentId: error.agentId,
              code: error.code,
              stage: error.stage,
              status: error.status,
              message: `Visual task "${taskId}" failed: ${error.message}`,
            });
          }
          throw error;
        }
      },
    );
    return mergeVisualTaskOutputs(outputs, visualRun.taskIds, agentId);
  };

  return {
    id: options.id,
    reviewerAgentId: agentIdFor("content-review"),
    selectorAgentId: agentIdFor("content-review"),
    proposeSemanticIntent: (run) => requestProposal("topic-intent", run),
    proposeBackgroundEvidence: (run) => requestProposal("background-evidence", run),
    proposeExecutionPlan: (run) => requestProposal("workflow-planning", run),
    proposeModuleMerchandising: (run) => requestProposal("module-merchandising", run),
    proposePageContent: (run) => requestProposal("content-writing", run),
    selectPageContentCandidates: (run) => requestProposal("content-review", run),
    reviewPageContent: (run) => requestProposal("content-review", run),
    generatePageVisuals: (run) => requestProposal("visual-generation", run),
    reviewPageExperience: (run) => requestProposal("experience-review", run),
  };
}
