import { timingSafeEqual } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";

import type { AgentExecutor } from "./executor.ts";
import { asObject } from "./json.ts";
import {
  AGENT_ROUTES,
  findAgentRoute,
  repositoryRoot,
  type AgentProtocol,
  type AgentRoute,
} from "./registry.ts";
import {
  inspectExperienceReviewPreviews,
  PreviewInspectionError,
} from "./preview-inspector.ts";
import {
  inspectMerchandisingProductImages,
  type MerchandisingProductInspection,
} from "./merchandising-product-inspector.ts";
import { applyMerchandisingVisualReview } from "./merchandising-visual-review.ts";
import {
  composeSourceProductImages,
  SourceImageCompositorError,
  type SourceImageCompositorInput,
} from "./source-image-compositor.ts";

type SourceImageComposer = (input: SourceImageCompositorInput) => Promise<unknown>;
type MerchandisingProductInspector = (
  run: Record<string, unknown>,
  textProposal: unknown,
) => Promise<MerchandisingProductInspection>;

interface AgentRunnerHandlerOptions {
  executor: AgentExecutor;
  token?: string;
  maxRequestBytes?: number;
  environment?: NodeJS.ProcessEnv;
  composeSourceImages?: SourceImageComposer;
  inspectMerchandisingProducts?: MerchandisingProductInspector;
  inspectPreviews?: typeof inspectExperienceReviewPreviews;
}

class RequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "RequestError";
    this.status = status;
    this.code = code;
  }
}

function authorized(request: Request, token: string | undefined) {
  if (!token) return true;
  const expected = Buffer.from(`Bearer ${token}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function protocolForPath(pathname: string): AgentProtocol | null {
  if (pathname === "/topic-page") return "topic-page";
  if (pathname === "/product-selection") return "product-selection";
  return null;
}

function requestSchema(protocol: AgentProtocol) {
  return protocol === "topic-page"
    ? "topic-page-agent-request/v1"
    : "product-selection-agent-request/v1";
}

async function loadSkillInstructions(root: string, skillPath: string) {
  const absoluteSkillPath = resolve(root, skillPath);
  const skillRoot = dirname(absoluteSkillPath);
  const skill = await readFile(absoluteSkillPath, "utf8");
  const referencePaths = [...skill.matchAll(/\[[^\]]+\]\((references\/[^)#?]+)(?:#[^)]*)?\)/g)]
    .map((match) => match[1])
    .filter((value, index, values): value is string =>
      typeof value === "string" && values.indexOf(value) === index
    );
  const references = await Promise.all(referencePaths.map(async (referencePath) => {
    const absoluteReferencePath = resolve(skillRoot, referencePath);
    const pathFromSkillRoot = relative(skillRoot, absoluteReferencePath);
    if (pathFromSkillRoot.startsWith("..") || pathFromSkillRoot.startsWith("/")) {
      throw new Error(`Skill reference escapes its directory: ${referencePath}`);
    }
    return {
      path: referencePath,
      contents: await readFile(absoluteReferencePath, "utf8"),
    };
  }));
  if (references.length === 0) return skill;
  return `${skill}\n\n${references.map(({ path, contents }) =>
    `---\nReferenced contract: ${path}\n\n${contents}`
  ).join("\n\n")}`;
}

function normalizeResult(route: AgentRoute, result: unknown) {
  const body = asObject(result);
  if (!body) throw new Error("Agent executor returned a non-object result.");
  const isEnvelope = body.schemaVersion === route.responseSchemaVersion && "proposal" in body;
  const isProductHandoff = route.protocol === "product-selection" &&
    body.schemaVersion === "product-selection-handoff-response/v1";
  if (isProductHandoff && body.stage !== route.stage) {
    throw new Error(`Agent response stage must be "${route.stage}".`);
  }
  const isProductHandoffEnvelope = isProductHandoff && "proposal" in body;
  if (isEnvelope && route.protocol === "topic-page" && body.stage !== route.stage) {
    throw new Error(`Agent response stage must be "${route.stage}".`);
  }
  const proposal = isEnvelope || isProductHandoffEnvelope ? body.proposal : body;
  const response: Record<string, unknown> = {
    schemaVersion: route.responseSchemaVersion,
    stage: route.stage,
    proposal,
  };
  if (route.stage === "visual-generation" && isEnvelope && "assets" in body) {
    response.assets = body.assets;
  }
  return response;
}

function isSourceImageVisualRun(route: AgentRoute, run: Record<string, unknown>) {
  const context = asObject(run.context);
  return route.protocol === "topic-page" && route.stage === "visual-generation" &&
    run.schemaVersion === "topic-page-visual-run/v1" &&
    run.status === "needs-visual-proposal" &&
    context?.productionMode === "source-product-images";
}

function isImageAwareMerchandisingRun(route: AgentRoute, run: Record<string, unknown>) {
  return route.protocol === "topic-page" && route.stage === "module-merchandising" &&
    run.schemaVersion === "page-merchandising-run/v1" &&
    run.status === "needs-module-proposal";
}

function decodePreparedAsset(value: unknown, index: number) {
  const asset = asObject(value);
  const taskId = typeof asset?.taskId === "string" ? asset.taskId.trim() : "";
  const ref = typeof asset?.ref === "string" ? asset.ref.trim() : "";
  const mimeType = typeof asset?.mimeType === "string" ? asset.mimeType : "";
  const dataBase64 = typeof asset?.dataBase64 === "string" ? asset.dataBase64 : "";
  if (!taskId || !ref || mimeType !== "image/webp" || !dataBase64) {
    throw new Error(`Prepared source image ${index + 1} is invalid.`);
  }
  const bytes = Buffer.from(dataBase64, "base64");
  if (bytes.byteLength === 0 ||
      bytes.toString("base64").replace(/=+$/, "") !== dataBase64.replace(/=+$/, "")) {
    throw new Error(`Prepared source image ${taskId} has an invalid body.`);
  }
  return { taskId, ref, mimeType, dataBase64, bytes };
}

function mergeSourceVisualInspection(preparedValue: unknown, agentValue: unknown) {
  const prepared = asObject(preparedValue);
  const preparedProposal = asObject(prepared?.proposal);
  const agent = asObject(agentValue);
  const agentProposal = asObject(agent?.proposal);
  const preparedAssets = Array.isArray(preparedProposal?.assets) ? preparedProposal.assets : [];
  const agentAssets = Array.isArray(agentProposal?.assets) ? agentProposal.assets : [];
  if (!prepared || !preparedProposal || !Array.isArray(prepared?.assets) ||
      preparedAssets.length === 0 || preparedAssets.length !== agentAssets.length) {
    throw new Error("Visual Agent inspection does not cover every prepared source image.");
  }
  const mergedAssets = preparedAssets.map((preparedAssetValue, index) => {
    const preparedAsset = asObject(preparedAssetValue);
    const agentAsset = asObject(agentAssets[index]);
    if (!preparedAsset || !agentAsset || agentAsset.taskId !== preparedAsset.taskId ||
        !asObject(agentAsset.direction) || !("altText" in agentAsset)) {
      throw new Error(`Visual Agent inspection does not match prepared task ${index + 1}.`);
    }
    return {
      ...preparedAsset,
      direction: agentAsset.direction,
      altText: agentAsset.altText,
    };
  });
  return {
    schemaVersion: "topic-page-agent-response/v1",
    stage: "visual-generation",
    proposal: { ...preparedProposal, assets: mergedAssets },
    assets: prepared.assets,
  };
}

async function executeSourceImageVisual(options: {
  route: AgentRoute;
  requestAgentId: string;
  run: Record<string, unknown>;
  repositoryRoot: string;
  skillInstructions: string;
  agentInstructions: string;
  executor: AgentExecutor;
  compose: SourceImageComposer;
}) {
  if (options.executor.supportsImageInput !== true) {
    throw new RequestError(
      422,
      "capability_unavailable",
      `${options.executor.id} cannot inspect composed source images for visual-generation.`,
    );
  }
  const prepared = await options.compose({ stage: options.route.stage, run: options.run });
  const preparedBody = asObject(prepared);
  const preparedProposal = asObject(preparedBody?.proposal);
  const preparedAssets = Array.isArray(preparedBody?.assets) ? preparedBody.assets : [];
  if (!preparedProposal || preparedAssets.length === 0) {
    throw new Error("Source image compositor returned an invalid response.");
  }
  const inspectionRoot = await mkdtemp(join(tmpdir(), "yami-topic-visual-inspection-"));
  try {
    const decoded = preparedAssets.map(decodePreparedAsset);
    const attachments = await Promise.all(decoded.map(async (asset, index) => {
      const path = join(inspectionRoot, `${String(index + 1).padStart(2, "0")}.webp`);
      await writeFile(path, asset.bytes, { flag: "wx" });
      return { path, label: `${asset.taskId}:${asset.ref}` };
    }));
    const context = asObject(options.run.context) ?? {};
    const result = await options.executor.execute({
      route: options.route,
      requestAgentId: options.requestAgentId,
      run: {
        ...options.run,
        context: {
          ...context,
          preparedSourceImageProposal: preparedProposal,
        },
      },
      repositoryRoot: options.repositoryRoot,
      skillInstructions: options.skillInstructions,
      agentInstructions: options.agentInstructions,
      attachments,
    });
    return mergeSourceVisualInspection(prepared, normalizeResult(options.route, result));
  } finally {
    await rm(inspectionRoot, { recursive: true, force: true });
  }
}

async function executeExperienceReview(options: {
  route: AgentRoute;
  requestAgentId: string;
  run: Record<string, unknown>;
  repositoryRoot: string;
  skillInstructions: string;
  agentInstructions: string;
  executor: AgentExecutor;
  inspect: typeof inspectExperienceReviewPreviews;
  allowedOrigin?: string;
}) {
  if (options.executor.supportsImageInput !== true) {
    throw new RequestError(
      422,
      "capability_unavailable",
      `${options.executor.id} cannot inspect desktop and mobile review screenshots.`,
    );
  }
  const inspection = await options.inspect(
    { stage: options.route.stage, run: options.run },
    { allowedOrigin: options.allowedOrigin },
  );
  try {
    return await options.executor.execute({
      route: options.route,
      requestAgentId: options.requestAgentId,
      run: options.run,
      repositoryRoot: options.repositoryRoot,
      skillInstructions: options.skillInstructions,
      agentInstructions: options.agentInstructions,
      attachments: inspection.attachments,
    });
  } finally {
    await inspection.cleanup();
  }
}

function errorResponse(error: unknown) {
  const previewError = error instanceof PreviewInspectionError;
  const compositorError = error instanceof SourceImageCompositorError;
  const status = error instanceof RequestError
    ? error.status
    : previewError && error.code !== "preview_capture_failed"
      ? 422
      : compositorError
        ? 422
        : 502;
  const code = error instanceof RequestError || previewError || compositorError
    ? error.code
    : "agent_execution_failed";
  const message = error instanceof Error ? error.message : "Agent execution failed.";
  const body = JSON.stringify({
    schemaVersion: "topic-agent-runner-error/v1",
    code,
    message,
  });
  return new Response(body, {
    status,
    headers: {
      "content-length": String(Buffer.byteLength(body)),
      "content-type": "application/json",
    },
  });
}

export function createAgentRunnerHandler(options: AgentRunnerHandlerOptions) {
  const environment = options.environment ?? process.env;
  const root = repositoryRoot(environment);
  const maxRequestBytes = options.maxRequestBytes ?? 2 * 1024 * 1024;

  return async function handleAgentRunnerRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (request.method === "GET" && url.pathname === "/health") {
        return Response.json({
          schemaVersion: "topic-agent-runner-health/v1",
          status: "ready",
          executor: options.executor.id,
          routes: AGENT_ROUTES.map(({ protocol, stage, agentId, skill }) => ({
            protocol,
            stage,
            agentId,
            skill,
          })),
        });
      }
      const protocol = protocolForPath(url.pathname);
      if (!protocol) throw new RequestError(404, "route_not_found", "Agent route not found.");
      if (request.method !== "POST") {
        throw new RequestError(405, "method_not_allowed", "Agent routes require POST.");
      }
      if (!authorized(request, options.token)) {
        throw new RequestError(401, "unauthorized", "Agent token is invalid.");
      }
      const contentLength = Number(request.headers.get("content-length") ?? "0");
      if (contentLength > maxRequestBytes) {
        throw new RequestError(413, "request_too_large", "Agent request exceeds the size limit.");
      }
      const source = await request.text();
      if (Buffer.byteLength(source) > maxRequestBytes) {
        throw new RequestError(413, "request_too_large", "Agent request exceeds the size limit.");
      }
      let value: unknown;
      try {
        value = JSON.parse(source) as unknown;
      } catch {
        throw new RequestError(400, "invalid_json", "Agent request must be valid JSON.");
      }
      const body = asObject(value);
      if (!body || body.schemaVersion !== requestSchema(protocol) ||
          typeof body.stage !== "string" || typeof body.agentId !== "string" ||
          !asObject(body.run)) {
        throw new RequestError(400, "invalid_request", "Agent request contract is invalid.");
      }
      const route = findAgentRoute(protocol, body.stage);
      if (!route) {
        throw new RequestError(400, "unsupported_stage", "Agent stage is not registered.");
      }
      const [skillInstructions, agentInstructions] = await Promise.all([
        loadSkillInstructions(root, route.skillPath),
        readFile(resolve(root, route.agentConfigPath), "utf8"),
      ]);
      if (isSourceImageVisualRun(route, body.run as Record<string, unknown>)) {
        const response = await executeSourceImageVisual({
          route,
          requestAgentId: body.agentId,
          run: body.run as Record<string, unknown>,
          repositoryRoot: root,
          skillInstructions,
          agentInstructions,
          executor: options.executor,
          compose: options.composeSourceImages ?? composeSourceProductImages,
        });
        return Response.json(response);
      }
      let result: unknown;
      if (route.protocol === "topic-page" && route.stage === "experience-review") {
        result = await executeExperienceReview({
          route,
          requestAgentId: body.agentId,
          run: body.run as Record<string, unknown>,
          repositoryRoot: root,
          skillInstructions,
          agentInstructions,
          executor: options.executor,
          inspect: options.inspectPreviews ?? inspectExperienceReviewPreviews,
          allowedOrigin: environment.TOPIC_AGENT_RUNNER_PREVIEW_ORIGIN?.trim() || undefined,
        });
      } else if (options.executor.supportsImageInput === true &&
          isImageAwareMerchandisingRun(route, body.run as Record<string, unknown>)) {
        const textResult = await options.executor.execute({
          route,
          requestAgentId: body.agentId,
          run: body.run as Record<string, unknown>,
          repositoryRoot: root,
          skillInstructions,
          agentInstructions,
        });
        const textProposal = normalizeResult(route, textResult).proposal;
        const inspection = await (options.inspectMerchandisingProducts ??
          inspectMerchandisingProductImages)(
            body.run as Record<string, unknown>,
            textProposal,
          );
        try {
          if (inspection.attachments.length === 0) {
            result = textProposal;
          } else {
            const run = body.run as Record<string, unknown>;
            const context = asObject(run.context) ?? {};
            const visualResult = await options.executor.execute({
              route,
              requestAgentId: body.agentId,
              run: {
                ...run,
                context: {
                  ...context,
                  visualReviewTask: {
                    schemaVersion: "module-merchandising-visual-review-task/v1",
                    inspectedProductIds: inspection.productIds,
                    textProposal,
                  },
                },
              },
              repositoryRoot: root,
              skillInstructions,
              agentInstructions,
              attachments: inspection.attachments,
            });
            result = applyMerchandisingVisualReview(
              run,
              inspection.productIds,
              visualResult,
            );
          }
        } finally {
          await inspection.cleanup();
        }
      } else {
        result = await options.executor.execute({
          route,
          requestAgentId: body.agentId,
          run: body.run as Record<string, unknown>,
          repositoryRoot: root,
          skillInstructions,
          agentInstructions,
        });
      }
      return Response.json(normalizeResult(route, result));
    } catch (error) {
      return errorResponse(error);
    }
  };
}
