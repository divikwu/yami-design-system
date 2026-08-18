import type { ProductSelectionRun } from "./contracts.js";
import type { ProductSelectionAgent } from "./workflow.js";

export type HttpProductSelectionAgentStage =
  | "category-role-proposal"
  | "scene-proposal";

export interface CreateHttpProductSelectionAgentOptions {
  id: string;
  endpoint: string;
  token?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export class HttpProductSelectionAgentError extends Error {
  readonly agentId: string;
  readonly stage: HttpProductSelectionAgentStage;
  readonly status?: number;

  constructor(options: {
    agentId: string;
    stage: HttpProductSelectionAgentStage;
    message: string;
    status?: number;
  }) {
    super(options.message);
    this.name = "HttpProductSelectionAgentError";
    this.agentId = options.agentId;
    this.stage = options.stage;
    this.status = options.status;
  }
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function createHttpProductSelectionAgent(
  options: CreateHttpProductSelectionAgentOptions,
): ProductSelectionAgent {
  const fetchImplementation = options.fetch ?? fetch;
  const requestProposal = async (
    stage: HttpProductSelectionAgentStage,
    run: ProductSelectionRun,
  ) => {
    let response: Response;
    try {
      response = await fetchImplementation(options.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        },
        body: JSON.stringify({
          schemaVersion: "product-selection-agent-request/v1",
          stage,
          agentId: options.id,
          run,
        }),
        signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
      });
    } catch (error) {
      throw new HttpProductSelectionAgentError({
        agentId: options.id,
        stage,
        message: error instanceof Error
          ? `Product Agent request failed: ${error.message}`
          : "Product Agent request failed.",
      });
    }
    if (!response.ok) {
      throw new HttpProductSelectionAgentError({
        agentId: options.id,
        stage,
        status: response.status,
        message: `Product Agent returned HTTP ${response.status}.`,
      });
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new HttpProductSelectionAgentError({
        agentId: options.id,
        stage,
        status: response.status,
        message: "Product Agent response must be valid JSON.",
      });
    }
    const result = objectValue(payload);
    if (result?.schemaVersion !== "product-selection-agent-response/v1" ||
        !("proposal" in result)) {
      throw new HttpProductSelectionAgentError({
        agentId: options.id,
        stage,
        status: response.status,
        message: 'Product Agent response must use "product-selection-agent-response/v1".',
      });
    }
    return result.proposal;
  };

  return {
    id: options.id,
    proposeCategoryRoles: (run) => requestProposal("category-role-proposal", run),
    proposeScenes: (run) => requestProposal("scene-proposal", run),
  };
}
