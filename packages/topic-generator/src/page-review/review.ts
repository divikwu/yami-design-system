import {
  topicPageGenerationSpecDigest,
  topicPageQaReportDigest,
} from "../page-generation/digest.js";
import type {
  TopicPageGenerationSpec,
  TopicPageQaReport,
  TopicPageReviewPackage,
} from "../page-generation/contracts.js";
import type {
  LandingPageExecutionPlan,
  LandingPageReviewRollbackStage,
} from "../page-orchestration/contracts.js";
import { landingPageExecutionPlanDigest } from "../page-orchestration/review.js";
import { sha256Digest } from "../product-selection/digest.js";
import type { TopicModuleId } from "../types.js";
import type {
  TopicPageExperienceReviewDecision,
  TopicPageExperienceReviewIssue,
  TopicPageExperienceReviewProposalReview,
  TopicPageExperienceReviewRecommendation,
  TopicPageExperienceReviewScope,
  TopicPageExperienceReviewSeverity,
} from "./contracts.js";

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function topicPageExperienceReviewDecisionDigest(
  value: TopicPageExperienceReviewDecision | Omit<TopicPageExperienceReviewDecision, "digest">,
) {
  if ("digest" in value) {
    const base: Partial<TopicPageExperienceReviewDecision> = { ...value };
    delete base.digest;
    return sha256Digest(base);
  }
  return sha256Digest(value);
}

export function reviewEvidenceRefs(options: {
  generationSpec: TopicPageGenerationSpec;
  qaReport: TopicPageQaReport;
}) {
  return [
    ...options.generationSpec.modules.map(({ id }) => `module:${id}`),
    ...options.generationSpec.modules.flatMap(({ products }) =>
      products.map(({ id }) => `product:${id}`)
    ),
    ...options.generationSpec.modules.flatMap(({ assets }) =>
      assets.map(({ taskId }) => `asset:${taskId}`)
    ),
    ...options.qaReport.checks.map(({ id }) => `qa:${id}`),
    "preview:desktop",
    "preview:mobile",
  ];
}

export function topicPageExperienceReviewPreflightIssues(options: {
  executionPlan: LandingPageExecutionPlan;
  generationSpec: TopicPageGenerationSpec;
  qaReport: TopicPageQaReport;
  previewRefs: TopicPageReviewPackage["previewRefs"];
}) {
  const issues: string[] = [];
  if (options.executionPlan.digest !== landingPageExecutionPlanDigest(options.executionPlan)) {
    issues.push("Experience review requires a valid LandingPageExecutionPlan digest.");
  }
  if (options.generationSpec.digest !== topicPageGenerationSpecDigest(options.generationSpec)) {
    issues.push("Experience review requires a valid PageGenerationSpec digest.");
  }
  if (options.qaReport.status !== "passed") {
    issues.push("Experience review requires a passed hard QA report.");
  }
  if (options.qaReport.digest !== topicPageQaReportDigest(options.qaReport) ||
      options.qaReport.generationSpecDigest !== options.generationSpec.digest) {
    issues.push("Experience review requires a valid QAReport bound to PageGenerationSpec.");
  }
  if (options.executionPlan.keyword !== options.generationSpec.keyword ||
      options.executionPlan.site !== options.generationSpec.site ||
      options.executionPlan.language !== options.generationSpec.language ||
      options.executionPlan.selectionStrategyRef !== options.generationSpec.strategyRef ||
      options.executionPlan.templateRef !== options.generationSpec.templateRef) {
    issues.push("PageGenerationSpec identity does not match LandingPageExecutionPlan.");
  }
  if (!options.previewRefs.desktop.trim() || !options.previewRefs.mobile.trim()) {
    issues.push("Experience review requires desktop and mobile preview references.");
  }
  return issues;
}

const ROLLBACK_BY_SCOPE: Record<
  Exclude<TopicPageExperienceReviewScope, "experience">,
  LandingPageReviewRollbackStage
> = {
  merchandising: "module-merchandising",
  content: "content-writing",
  visual: "visual-generation",
};

export function reviewTopicPageExperienceProposal(options: {
  executionPlan: LandingPageExecutionPlan;
  generationSpec: TopicPageGenerationSpec;
  qaReport: TopicPageQaReport & { status: "passed" };
  value: unknown;
}): TopicPageExperienceReviewProposalReview {
  const proposal = objectValue(options.value);
  const issues: string[] = [];
  if (!proposal) {
    return {
      status: "rejected",
      issues: ["TopicPageExperienceReviewProposal must be a JSON object."],
    };
  }
  if (proposal.schemaVersion !== "topic-page-experience-review-proposal/v1") {
    issues.push('schemaVersion must be "topic-page-experience-review-proposal/v1".');
  }
  if (proposal.executionPlanDigest !== options.executionPlan.digest) {
    issues.push("Proposal executionPlanDigest does not match LandingPageExecutionPlan.");
  }
  if (proposal.generationSpecDigest !== options.generationSpec.digest) {
    issues.push("Proposal generationSpecDigest does not match PageGenerationSpec.");
  }
  if (proposal.qaReportDigest !== options.qaReport.digest) {
    issues.push("Proposal qaReportDigest does not match QAReport.");
  }
  const recommendation = stringValue(proposal.recommendation) as TopicPageExperienceReviewRecommendation;
  if (recommendation !== "recommend-approval" && recommendation !== "request-revision") {
    issues.push("Proposal recommendation must be recommend-approval or request-revision.");
  }
  const summary = stringValue(proposal.summary);
  if (!summary) issues.push("Proposal requires a concise review summary.");

  const allowedEvidence = new Set(reviewEvidenceRefs(options));
  const allowedRollback = new Set(options.executionPlan.allowedReviewRollbackStages);
  const rawIssues = Array.isArray(proposal.issues) ? proposal.issues : [];
  if (!Array.isArray(proposal.issues)) issues.push("Proposal issues must be an array.");
  const seenIds = new Set<string>();
  const normalizedIssues: TopicPageExperienceReviewIssue[] = [];
  rawIssues.forEach((rawIssue, index) => {
    const issue = objectValue(rawIssue);
    if (!issue) {
      issues.push(`Review issue ${index} must be an object.`);
      return;
    }
    const id = stringValue(issue.id);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      issues.push(`Review issue ${index} id must use lowercase kebab-case.`);
    }
    if (seenIds.has(id)) issues.push(`Review issue ${id} is duplicated.`);
    seenIds.add(id);
    const severity = stringValue(issue.severity) as TopicPageExperienceReviewSeverity;
    if (severity !== "warning" && severity !== "blocking") {
      issues.push(`Review issue ${id || index} severity must be warning or blocking.`);
    }
    const scope = stringValue(issue.scope) as TopicPageExperienceReviewScope;
    if (!["merchandising", "content", "visual", "experience"].includes(scope)) {
      issues.push(`Review issue ${id || index} scope is unsupported.`);
    }
    const moduleId = stringValue(issue.moduleId) as TopicModuleId;
    if (moduleId && !options.generationSpec.modules.some((module) => module.id === moduleId)) {
      issues.push(`Review issue ${id || index} references unknown module ${moduleId}.`);
    }
    const message = stringValue(issue.message);
    if (!message) issues.push(`Review issue ${id || index} requires a message.`);
    const rawRefs = Array.isArray(issue.evidenceRefs) ? issue.evidenceRefs : [];
    if (!Array.isArray(issue.evidenceRefs)) {
      issues.push(`Review issue ${id || index} evidenceRefs must be an array.`);
    }
    const evidenceRefs = rawRefs
      .filter((ref): ref is string => typeof ref === "string")
      .map((ref) => ref.trim())
      .filter(Boolean);
    if (evidenceRefs.length !== rawRefs.length || evidenceRefs.length === 0) {
      issues.push(`Review issue ${id || index} requires non-empty evidenceRefs.`);
    }
    evidenceRefs.forEach((ref) => {
      if (!allowedEvidence.has(ref)) issues.push(`Unsupported review evidence reference: ${ref}.`);
    });
    const rollbackStage = stringValue(issue.rollbackStage) as LandingPageReviewRollbackStage;
    if (severity === "blocking" && !rollbackStage) {
      issues.push(`Blocking review issue ${id || index} requires rollbackStage.`);
    }
    if (rollbackStage && !allowedRollback.has(rollbackStage)) {
      issues.push(`Review issue ${id || index} rollbackStage is not allowed by the execution plan.`);
    }
    if (rollbackStage && scope !== "experience" &&
        Object.hasOwn(ROLLBACK_BY_SCOPE, scope) &&
        ROLLBACK_BY_SCOPE[scope as keyof typeof ROLLBACK_BY_SCOPE] !== rollbackStage) {
      issues.push(`Review issue ${id || index} rollbackStage does not match its scope.`);
    }
    normalizedIssues.push({
      id,
      severity,
      scope,
      ...(moduleId ? { moduleId } : {}),
      message,
      evidenceRefs,
      ...(rollbackStage ? { rollbackStage } : {}),
    });
  });

  const blockingCount = normalizedIssues.filter(({ severity }) => severity === "blocking").length;
  if (recommendation === "recommend-approval" && blockingCount > 0) {
    issues.push("recommend-approval cannot include blocking issues.");
  }
  if (recommendation === "request-revision" && blockingCount === 0) {
    issues.push("request-revision requires at least one blocking issue.");
  }
  if (issues.length > 0) return { status: "rejected", issues };

  return {
    status: "accepted",
    issues: [],
    proposal: {
      schemaVersion: "topic-page-experience-review-proposal/v1",
      executionPlanDigest: options.executionPlan.digest,
      generationSpecDigest: options.generationSpec.digest,
      qaReportDigest: options.qaReport.digest,
      recommendation,
      summary,
      issues: normalizedIssues,
    },
  };
}
