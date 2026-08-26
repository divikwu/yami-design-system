import { runPageMerchandisingAgentWorkflow } from "../page-merchandising/workflow.js";
import {
  runTopicContentAgentWorkflow,
  TopicContentAgentWorkflowError,
} from "../page-content/workflow.js";
import { compileDeterministicTopicPageContentRun } from "../page-content/run.js";
import { runTopicPageContentApprovalWorkflow } from "../page-content/approval-workflow.js";
import {
  LANDING_PAGE_EXECUTION_STAGES,
  landingPageExecutionPlanDigest,
  orchestrationThemeIntentDigest,
} from "../page-orchestration/index.js";
import { runTopicPageReviewAgentWorkflow } from "../page-review/workflow.js";
import { runTopicVisualAgentWorkflow } from "../page-visual/workflow.js";
import type { TopicPageVisualAssetBody } from "../page-visual/contracts.js";
import {
  compileTopicPageGenerationSpec,
  compileTopicPageReviewPackage,
  runTopicPageQa,
  sha256Bytes,
} from "../page-generation/index.js";
import type {
  TopicPageAutomationRun,
  TopicPageAutomationStage,
  TopicPageAutomationStageId,
  TopicPageAutomationWorkflowOptions,
} from "./contracts.js";

const STAGE_IDS: readonly TopicPageAutomationStageId[] = [
  "workflow-planning",
  "background-evidence",
  "product-selection",
  "module-merchandising",
  "content-writing",
  "content-review",
  "visual-generation",
  "asset-persistence",
  "page-generation",
  "automatic-qa",
  "experience-review",
];

function stageState(): TopicPageAutomationStage[] {
  return STAGE_IDS.map((id) => ({ id, status: "pending" }));
}

function mark(stages: TopicPageAutomationStage[], id: TopicPageAutomationStageId, status: TopicPageAutomationStage["status"]) {
  stages.find((stage) => stage.id === id)!.status = status;
}

function blocked(
  stages: TopicPageAutomationStage[],
  stage: TopicPageAutomationStageId,
  issues: string[],
  artifacts: Omit<Extract<TopicPageAutomationRun, { status: "blocked" }>,
    "schemaVersion" | "status" | "stage" | "stages" | "issues"> = {},
): TopicPageAutomationRun {
  mark(stages, stage, "blocked");
  return {
    schemaVersion: "topic-page-automation-run/v1",
    status: "blocked",
    stage,
    stages,
    issues,
    ...artifacts,
  };
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Unknown automation failure.";
}

function exactOrder(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function executionPlanIssues(options: TopicPageAutomationWorkflowOptions) {
  const { executionPlan, intent, selection, language } = options;
  const issues: string[] = [];
  if (executionPlan.digest !== landingPageExecutionPlanDigest(executionPlan)) {
    issues.push("LandingPageExecutionPlan digest is invalid.");
  }
  if (executionPlan.themeIntentDigest !== orchestrationThemeIntentDigest(intent)) {
    issues.push("LandingPageExecutionPlan themeIntentDigest does not match ThemeIntent.");
  }
  if (executionPlan.keyword !== selection.keyword || executionPlan.site !== selection.site ||
      executionPlan.language !== language ||
      executionPlan.selectionStrategyRef !== selection.strategyRef) {
    issues.push("LandingPageExecutionPlan identity does not match the selected workflow inputs.");
  }
  if (!exactOrder(
    executionPlan.stages.map(({ id }) => id),
    LANDING_PAGE_EXECUTION_STAGES.map(({ id }) => id),
  )) {
    issues.push("LandingPageExecutionPlan stages do not match the registered workflow.");
  }
  return issues;
}

function decodeBase64(value: string) {
  try {
    const bytes = Buffer.from(value, "base64");
    const normalizedInput = value.replace(/=+$/, "");
    const normalizedOutput = bytes.toString("base64").replace(/=+$/, "");
    return normalizedInput === normalizedOutput ? new Uint8Array(bytes) : null;
  } catch {
    return null;
  }
}

export async function validateTopicPageVisualAssetBodies(
  assetBodies: TopicPageVisualAssetBody[] | undefined,
  manifest: NonNullable<Extract<TopicPageAutomationRun, { status: "ready" }>["assetManifest"]>,
  imageDecoder: TopicPageAutomationWorkflowOptions["imageDecoder"],
) {
  const bodies = assetBodies ?? [];
  const issues: string[] = [];
  if (bodies.length !== manifest.assets.length) {
    issues.push(`Visual Agent must return exactly ${manifest.assets.length} image bodies.`);
  }
  const decoded: Array<{ ref: string; bytes: Uint8Array }> = [];
  for (const [index, asset] of manifest.assets.entries()) {
    const body = bodies[index];
    if (!body || body.taskId !== asset.taskId || body.ref !== asset.artifact.ref ||
        body.mimeType !== asset.artifact.mimeType) {
      issues.push(`Image body ${index + 1} does not match visual task ${asset.taskId}.`);
      continue;
    }
    const bytes = decodeBase64(body.dataBase64);
    if (!bytes || bytes.byteLength === 0 || bytes.byteLength > 12 * 1024 * 1024) {
      issues.push(`Asset ${asset.taskId} must contain a valid image body no larger than 12 MiB.`);
      continue;
    }
    if (sha256Bytes(bytes) !== asset.artifact.digest) {
      issues.push(`Asset ${asset.taskId} byte digest does not match the accepted visual proposal.`);
    }
    const image = await imageDecoder.inspect(bytes);
    if (!image) {
      issues.push(`Asset ${asset.taskId} is not a decodable PNG, JPEG, or WebP image.`);
    } else {
      if (image.mimeType !== asset.artifact.mimeType) {
        issues.push(`Asset ${asset.taskId} byte MIME does not match the accepted visual proposal.`);
      }
      if (image.width !== asset.artifact.width || image.height !== asset.artifact.height) {
        issues.push(`Asset ${asset.taskId} byte dimensions do not match the accepted visual proposal.`);
      }
    }
    decoded.push({ ref: body.ref, bytes });
  }
  return { issues, decoded };
}

export async function runTopicPageAutomationWorkflow(
  options: TopicPageAutomationWorkflowOptions,
): Promise<TopicPageAutomationRun> {
  const stages = stageState();
  const advisoryIssues: string[] = [];
  const block = (
    stage: TopicPageAutomationStageId,
    issues: string[],
    artifacts: Parameters<typeof blocked>[3] = {},
  ) => blocked(stages, stage, issues, { executionPlan: options.executionPlan, ...artifacts });
  const planIssues = executionPlanIssues(options);
  if (planIssues.length > 0) return block("workflow-planning", planIssues);
  mark(stages, "workflow-planning", "completed");
  mark(stages, "background-evidence", "completed");
  mark(stages, "product-selection", "completed");
  let plan;
  if (options.contentResume) {
    plan = options.contentResume.plan;
    if (plan.templateRef !== options.executionPlan.templateRef) {
      return block(
        "module-merchandising",
        ["Resumed TopicPagePlan templateRef does not match LandingPageExecutionPlan."],
        {
          plan,
          faultKind: "upstream-invalid",
          rollbackStage: "module-merchandising",
        },
      );
    }
  } else {
    let merchandising;
    try {
      merchandising = await runPageMerchandisingAgentWorkflow({
        intent: options.intent,
        selection: options.selection,
        language: options.language,
        templateRef: options.executionPlan.templateRef,
        agent: options.agents.merchandising,
      });
    } catch (error) {
      return block("module-merchandising", [message(error)]);
    }
    if (merchandising.run.status !== "ready") {
      return block(
        "module-merchandising",
        merchandising.run.status === "blocked"
          ? merchandising.run.issues
          : ["PageMerchandising Agent did not return a proposal."],
      );
    }
    plan = merchandising.run.plan;
  }
  mark(stages, "module-merchandising", "completed");

  let content: Awaited<ReturnType<typeof runTopicContentAgentWorkflow>> | undefined;
  let contentAttempt;
  try {
    content = await runTopicContentAgentWorkflow({
      intent: options.intent,
      selection: options.selection,
      plan,
      language: options.language,
      audienceContext: options.audienceContext,
      backgroundEvidence: options.backgroundEvidence,
      agent: options.agents.content,
      selectorAgent: options.agents.contentSelector,
      ...(options.contentResume
        ? {
            resume: {
              attempt: options.contentResume.attempt,
              proposal: options.contentResume.proposal,
            },
          }
        : {}),
    });
  } catch (error) {
    advisoryIssues.push(message(error));
    if (error instanceof TopicContentAgentWorkflowError) contentAttempt = error.attempt;
  }
  if (content?.artifacts) contentAttempt = content.artifacts;
  let contentRun = content?.run;
  if (contentRun?.status !== "ready") {
    if (contentRun?.status === "blocked") {
      advisoryIssues.push(...contentRun.issues);
    } else if (content) {
      advisoryIssues.push("Content Agent did not return a proposal.");
    }
    contentRun = compileDeterministicTopicPageContentRun({
      intent: options.intent,
      selection: options.selection,
      plan,
      language: options.language,
      audienceContext: options.audienceContext,
      backgroundEvidence: options.backgroundEvidence,
    });
    if (contentRun.status !== "ready") {
      return block(
        "content-writing",
        contentRun.status === "blocked"
          ? contentRun.issues
          : ["Deterministic Host copy could not be compiled."],
        {
          plan,
          contentRun,
          ...(contentAttempt ? { contentAttempt } : {}),
        },
      );
    }
    advisoryIssues.push("Content Agent output was replaced with deterministic Host copy.");
  }
  const initialContentSpec = contentRun.spec;
  mark(stages, "content-writing", "completed");

  const contentApproval = await runTopicPageContentApprovalWorkflow({
    intent: options.intent,
    selection: options.selection,
    plan,
    language: options.language,
    audienceContext: options.audienceContext,
    backgroundEvidence: options.backgroundEvidence,
    contentSpec: initialContentSpec,
    contentAgent: options.agents.content,
    reviewAgent: options.agents.contentReview,
  });
  if (contentApproval.status !== "ready") {
    return block(
      contentApproval.stage,
      contentApproval.issues,
      {
        plan,
        ...(contentApproval.contentSpec
          ? { contentSpec: contentApproval.contentSpec }
          : { contentSpec: initialContentSpec }),
        ...(contentApproval.copyBrief ? { copyBrief: contentApproval.copyBrief } : {}),
        ...(contentApproval.contentReview
          ? { contentReview: contentApproval.contentReview }
          : {}),
        ...(contentApproval.contentRun ? { contentRun: contentApproval.contentRun } : {}),
        ...(contentApproval.contentAttempt
          ? { contentAttempt: contentApproval.contentAttempt }
          : {}),
        faultKind: contentApproval.faultKind,
        rollbackStage: contentApproval.rollbackStage,
      },
    );
  }
  const contentSpec = contentApproval.contentSpec;
  const copyBrief = contentApproval.copyBrief;
  const contentReview = contentApproval.contentReview;
  const contentReviewRun = {
    schemaVersion: "topic-page-content-review-run/v1" as const,
    status: "ready" as const,
    decision: contentReview,
  };
  mark(stages, "content-review", "completed");

  let visual;
  try {
    visual = await runTopicVisualAgentWorkflow({
      intent: options.intent,
      selection: options.selection,
      plan,
      contentSpec,
      backgroundEvidence: options.backgroundEvidence,
      productionMode: options.visualProductionMode,
      agent: options.agents.visual,
    });
  } catch (error) {
    return block("visual-generation", [message(error)], {
      plan,
      contentSpec,
      copyBrief,
      contentReview: contentReviewRun,
    });
  }
  if (visual.run.status !== "ready") {
    return block(
      "visual-generation",
      visual.run.status === "blocked"
        ? visual.run.issues
        : ["Visual Agent did not return a proposal."],
      { plan, contentSpec, copyBrief, contentReview: contentReviewRun },
    );
  }
  const assetManifest = visual.run.manifest;
  mark(stages, "visual-generation", "completed");

  const validatedBodies = await validateTopicPageVisualAssetBodies(
    visual.artifacts.assetBodies,
    assetManifest,
    options.imageDecoder,
  );
  if (validatedBodies.issues.length > 0) {
    return block("asset-persistence", validatedBodies.issues, {
      plan,
      contentSpec,
      assetManifest,
    });
  }
  try {
    for (const body of validatedBodies.decoded) {
      await options.assetStore.put(body.ref, body.bytes);
    }
  } catch (error) {
    return block("asset-persistence", [message(error)], {
      plan,
      contentSpec,
      assetManifest,
    });
  }
  mark(stages, "asset-persistence", "completed");

  let generationSpec;
  try {
    generationSpec = compileTopicPageGenerationSpec({
      intent: options.intent,
      selection: options.selection,
      plan,
      contentSpec,
      backgroundEvidence: options.backgroundEvidence,
      manifest: assetManifest,
      assetUrl: (ref) => options.assetStore.publicUrl(ref),
    });
  } catch (error) {
    return block("page-generation", [message(error)], {
      plan,
      contentSpec,
      assetManifest,
    });
  }
  mark(stages, "page-generation", "completed");

  const qaReport = await runTopicPageQa({
    intent: options.intent,
    selection: options.selection,
    plan,
    contentSpec,
    manifest: assetManifest,
    generationSpec,
    reader: options.assetStore,
    imageDecoder: options.imageDecoder,
  });
  if (qaReport.status !== "passed") {
    return block("automatic-qa", qaReport.issues, {
      plan,
      contentSpec,
      assetManifest,
      generationSpec,
      qaReport,
    });
  }
  mark(stages, "automatic-qa", "completed");

  let previewRefs = options.previewRefs;
  let experienceReview;
  let reviewPackage;
  try {
    if (options.previewResolver) {
      previewRefs = await options.previewResolver({
        executionPlan: options.executionPlan,
        generationSpec,
        qaReport: qaReport as typeof qaReport & { status: "passed" },
      });
    }
    if (!previewRefs) {
      throw new Error("Page review preview refs are not configured.");
    }
  } catch (error) {
    advisoryIssues.push(message(error));
  }

  if (previewRefs) {
    try {
      const experienceReviewRun = await runTopicPageReviewAgentWorkflow({
        executionPlan: options.executionPlan,
        generationSpec,
        qaReport,
        previewRefs,
        agent: options.agents.review,
      });
      if (experienceReviewRun.run.status === "ready") {
        experienceReview = experienceReviewRun.run.decision;
        if (experienceReview.status === "review-recommended") {
          reviewPackage = compileTopicPageReviewPackage({
            executionPlan: options.executionPlan,
            generationSpec,
            qaReport,
            experienceReview,
            previewRefs,
          });
        } else {
          advisoryIssues.push(...experienceReview.issues.map(({ message: issue }) => issue));
        }
      } else {
        advisoryIssues.push(...(experienceReviewRun.run.status === "blocked"
          ? experienceReviewRun.run.issues
          : ["Review Agent did not return a proposal."]));
      }
    } catch (error) {
      advisoryIssues.push(message(error));
    }
  }
  mark(stages, "experience-review", "completed");
  return {
    schemaVersion: "topic-page-automation-run/v1",
    status: "ready",
    stage: "review-ready",
    stages,
    issues: [...new Set(advisoryIssues)],
    executionPlan: options.executionPlan,
    plan,
    ...(contentApproval.revisionAttempt
      ? { contentAttempt: contentApproval.revisionAttempt }
      : contentAttempt
      ? { contentAttempt }
      : {}),
    contentSpec,
    copyBrief,
    contentReview,
    assetManifest,
    generationSpec,
    qaReport: qaReport as typeof qaReport & { status: "passed" },
    ...(experienceReview ? { experienceReview } : {}),
    ...(reviewPackage ? { reviewPackage } : {}),
  };
}
