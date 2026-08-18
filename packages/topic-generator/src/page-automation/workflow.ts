import { runPageMerchandisingAgentWorkflow } from "../page-merchandising/workflow.js";
import { runTopicContentAgentWorkflow } from "../page-content/workflow.js";
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
  inspectImageBytes,
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
  "product-selection",
  "module-merchandising",
  "content-writing",
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

function validateAssetBodies(
  assetBodies: TopicPageVisualAssetBody[] | undefined,
  manifest: NonNullable<Extract<TopicPageAutomationRun, { status: "ready" }>["assetManifest"]>,
) {
  const bodies = assetBodies ?? [];
  const issues: string[] = [];
  if (bodies.length !== manifest.assets.length) {
    issues.push(`Visual Agent must return exactly ${manifest.assets.length} image bodies.`);
  }
  const decoded: Array<{ ref: string; bytes: Uint8Array }> = [];
  manifest.assets.forEach((asset, index) => {
    const body = bodies[index];
    if (!body || body.taskId !== asset.taskId || body.ref !== asset.artifact.ref ||
        body.mimeType !== asset.artifact.mimeType) {
      issues.push(`Image body ${index + 1} does not match visual task ${asset.taskId}.`);
      return;
    }
    const bytes = decodeBase64(body.dataBase64);
    if (!bytes || bytes.byteLength === 0 || bytes.byteLength > 12 * 1024 * 1024) {
      issues.push(`Asset ${asset.taskId} must contain a valid image body no larger than 12 MiB.`);
      return;
    }
    if (sha256Bytes(bytes) !== asset.artifact.digest) {
      issues.push(`Asset ${asset.taskId} byte digest does not match the accepted visual proposal.`);
    }
    const image = inspectImageBytes(bytes);
    if (!image) {
      issues.push(`Asset ${asset.taskId} is not a supported PNG, JPEG, or WebP image.`);
    } else {
      if (image.mimeType !== asset.artifact.mimeType) {
        issues.push(`Asset ${asset.taskId} byte MIME does not match the accepted visual proposal.`);
      }
      if (image.width !== asset.artifact.width || image.height !== asset.artifact.height) {
        issues.push(`Asset ${asset.taskId} byte dimensions do not match the accepted visual proposal.`);
      }
    }
    decoded.push({ ref: body.ref, bytes });
  });
  return { issues, decoded };
}

export async function runTopicPageAutomationWorkflow(
  options: TopicPageAutomationWorkflowOptions,
): Promise<TopicPageAutomationRun> {
  const stages = stageState();
  const block = (
    stage: TopicPageAutomationStageId,
    issues: string[],
    artifacts: Parameters<typeof blocked>[3] = {},
  ) => blocked(stages, stage, issues, { executionPlan: options.executionPlan, ...artifacts });
  const planIssues = executionPlanIssues(options);
  if (planIssues.length > 0) return block("workflow-planning", planIssues);
  mark(stages, "workflow-planning", "completed");
  mark(stages, "product-selection", "completed");
  let merchandising;
  try {
    merchandising = await runPageMerchandisingAgentWorkflow({
      intent: options.intent,
      selection: options.selection,
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
  const plan = merchandising.run.plan;
  mark(stages, "module-merchandising", "completed");

  let content;
  try {
    content = await runTopicContentAgentWorkflow({
      intent: options.intent,
      selection: options.selection,
      plan,
      language: options.language,
      agent: options.agents.content,
    });
  } catch (error) {
    return block("content-writing", [message(error)], { plan });
  }
  if (content.run.status !== "ready") {
    return block(
      "content-writing",
      content.run.status === "blocked"
        ? content.run.issues
        : ["Content Agent did not return a proposal."],
      { plan },
    );
  }
  const contentSpec = content.run.spec;
  mark(stages, "content-writing", "completed");

  let visual;
  try {
    visual = await runTopicVisualAgentWorkflow({
      intent: options.intent,
      selection: options.selection,
      plan,
      contentSpec,
      agent: options.agents.visual,
    });
  } catch (error) {
    return block("visual-generation", [message(error)], { plan, contentSpec });
  }
  if (visual.run.status !== "ready") {
    return block(
      "visual-generation",
      visual.run.status === "blocked"
        ? visual.run.issues
        : ["Visual Agent did not return a proposal."],
      { plan, contentSpec },
    );
  }
  const assetManifest = visual.run.manifest;
  mark(stages, "visual-generation", "completed");

  const validatedBodies = validateAssetBodies(visual.artifacts.assetBodies, assetManifest);
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

  let experienceReviewRun;
  try {
    experienceReviewRun = await runTopicPageReviewAgentWorkflow({
      executionPlan: options.executionPlan,
      generationSpec,
      qaReport,
      previewRefs: options.previewRefs,
      agent: options.agents.review,
    });
  } catch (error) {
    return block("experience-review", [message(error)], {
      plan,
      contentSpec,
      assetManifest,
      generationSpec,
      qaReport,
    });
  }
  if (experienceReviewRun.run.status !== "ready") {
    return block(
      "experience-review",
      experienceReviewRun.run.status === "blocked"
        ? experienceReviewRun.run.issues
        : ["Review Agent did not return a proposal."],
      { plan, contentSpec, assetManifest, generationSpec, qaReport },
    );
  }
  const experienceReview = experienceReviewRun.run.decision;
  if (experienceReview.status === "revision-requested") {
    return block(
      "experience-review",
      experienceReview.issues.map(({ message: issue }) => issue),
      { plan, contentSpec, assetManifest, generationSpec, qaReport, experienceReview },
    );
  }
  mark(stages, "experience-review", "completed");
  const reviewPackage = compileTopicPageReviewPackage({
    executionPlan: options.executionPlan,
    generationSpec,
    qaReport,
    experienceReview,
    previewRefs: options.previewRefs,
  });
  return {
    schemaVersion: "topic-page-automation-run/v1",
    status: "ready",
    stage: "review-ready",
    stages,
    issues: [],
    executionPlan: options.executionPlan,
    plan,
    contentSpec,
    assetManifest,
    generationSpec,
    qaReport: qaReport as typeof qaReport & { status: "passed" },
    experienceReview: experienceReview as typeof experienceReview & { status: "review-recommended" },
    reviewPackage,
  };
}
