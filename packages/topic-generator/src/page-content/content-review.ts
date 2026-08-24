import type { TopicModuleId } from "../types.js";
import type { TopicBackgroundEvidenceBundle } from "../background-evidence/contracts.js";
import { sha256Digest } from "../product-selection/digest.js";
import type {
  TopicPageContentLocalizationReference,
  TopicPageContentSpec,
  TopicPageCopyBrief,
} from "./contracts.js";
import {
  topicPageContentSpecDigest,
} from "./review.js";
import { topicPageCopyBriefDigest } from "./brief.js";

export type TopicPageContentReviewCriterion =
  | "newcomer-orientation"
  | "theme-specificity"
  | "scene-specificity"
  | "shopping-decision-usefulness"
  | "module-differentiation"
  | "evidence-claim-alignment"
  | "language-quality"
  | "brand-distinctiveness"
  | "consumer-relevance"
  | "editorial-quality"
  | "meta-navigation-avoidance"
  | "module-redundancy-avoidance"
  | "cross-locale-semantic-alignment";

export interface TopicPageContentReviewIssue {
  code: string;
  severity: "warning" | "error";
  moduleId?: TopicModuleId;
  message: string;
}

export interface TopicPageContentReviewProposal {
  schemaVersion: "topic-page-content-review-proposal/v1";
  contentSpecDigest: string;
  copyBriefDigest: string;
  backgroundEvidenceDigest: string | null;
  verdict: "approved" | "revision-required";
  issues: TopicPageContentReviewIssue[];
}

export interface TopicPageContentReviewDecision
  extends Omit<TopicPageContentReviewProposal, "schemaVersion"> {
  schemaVersion: "topic-page-content-review/v1";
  reviewerAgentId: string;
  digest: string;
}

export interface TopicPageContentReviewContext {
  contentSpecDigest: string;
  copyBriefDigest: string;
  backgroundEvidenceDigest: string | null;
  contentSpec: TopicPageContentSpec;
  copyBrief: TopicPageCopyBrief;
  backgroundEvidence: TopicBackgroundEvidenceBundle | null;
  criteria: readonly TopicPageContentReviewCriterion[];
  reviewBoundary: "copy-only-no-upstream-mutation";
  qualityPolicy: "advisory-optimize-never-block";
  advisoryWarnings: TopicPageContentReviewIssue[];
  localizationReference: TopicPageContentLocalizationReference | null;
}

export type TopicPageContentReviewRun =
  | {
      schemaVersion: "topic-page-content-review-run/v1";
      status: "needs-content-review-proposal";
      context: TopicPageContentReviewContext;
    }
  | {
      schemaVersion: "topic-page-content-review-run/v1";
      status: "ready";
      decision: TopicPageContentReviewDecision & { verdict: "approved" };
    }
  | {
      schemaVersion: "topic-page-content-review-run/v1";
      status: "blocked";
      faultKind: "content-quality" | "review-invalid" | "structural-invalid" | "agent-failed";
      rollbackStage: "content-writing";
      issues: string[];
      decision?: TopicPageContentReviewDecision;
    };

export interface TopicPageContentReviewRequest {
  contentSpec: TopicPageContentSpec;
  copyBrief: TopicPageCopyBrief;
  backgroundEvidence?: TopicBackgroundEvidenceBundle;
  localizationReference?: TopicPageContentLocalizationReference;
  proposal?: unknown;
  reviewerAgentId?: string;
}

export interface TopicPageContentReviewAgent {
  id: string;
  reviewerAgentId?: string;
  reviewPageContent(
    run: Extract<TopicPageContentReviewRun, { status: "needs-content-review-proposal" }>,
  ): Promise<unknown>;
}

const CRITERIA: readonly TopicPageContentReviewCriterion[] = [
  "newcomer-orientation",
  "theme-specificity",
  "scene-specificity",
  "shopping-decision-usefulness",
  "module-differentiation",
  "evidence-claim-alignment",
  "language-quality",
  "consumer-relevance",
  "editorial-quality",
  "meta-navigation-avoidance",
  "module-redundancy-avoidance",
];

const MODULE_IDS = new Set<TopicModuleId>([
  "hero",
  "shortcuts",
  "start-here",
  "popular-picks",
  "brand-spotlight",
  "reviews",
  "explore-more",
]);

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function topicPageContentReviewDecisionDigest<T extends object>(decision: T) {
  const bound = { ...decision } as { digest?: string };
  delete bound.digest;
  return sha256Digest(bound);
}

function titleKey(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase();
}

function segmentReferences(value: unknown): string[] {
  if (typeof value !== "object" || value === null) return [];
  if ("evidenceRefs" in value && Array.isArray(value.evidenceRefs)) {
    return value.evidenceRefs.filter((item): item is string => typeof item === "string");
  }
  return Object.values(value).flatMap(segmentReferences);
}

function structuralIssues(request: TopicPageContentReviewRequest) {
  const issues: string[] = [];
  if (request.contentSpec.digest !== topicPageContentSpecDigest(request.contentSpec)) {
    issues.push("TopicPageContentSpec digest is invalid.");
  }
  if (request.copyBrief.digest !== topicPageCopyBriefDigest(request.copyBrief)) {
    issues.push("TopicPageCopyBrief digest is invalid.");
  }
  if (request.contentSpec.copyBriefDigest !== undefined &&
      request.contentSpec.copyBriefDigest !== request.copyBrief.digest) {
    issues.push("TopicPageContentSpec copyBriefDigest does not match TopicPageCopyBrief.");
  }
  const backgroundDigest = request.backgroundEvidence?.digest;
  if (request.contentSpec.backgroundEvidenceDigest !== backgroundDigest ||
      request.copyBrief.backgroundEvidenceDigest !== (backgroundDigest ?? null)) {
    issues.push("Content review background evidence bindings do not match.");
  }
  return issues;
}

function advisoryDeterministicIssues(
  request: TopicPageContentReviewRequest,
): TopicPageContentReviewIssue[] {
  const issues: TopicPageContentReviewIssue[] = [];
  const eligibleBackgroundRefs = new Set(
    request.backgroundEvidence?.claims.map(({ id }) => `background:${id}`) ?? [],
  );
  if (eligibleBackgroundRefs.size > 0) {
    const hero = request.contentSpec.tasks.find(({ moduleId }) => moduleId === "hero");
    const heroRefs = hero ? segmentReferences({
      title: hero.copy.title,
      description: hero.copy.description,
    }) : [];
    if (!heroRefs.some((ref) => eligibleBackgroundRefs.has(ref))) {
      issues.push({
        code: "hero-background-context-missing",
        severity: "warning",
        moduleId: "hero",
        message: "Hero copy should cite at least one eligible background claim for newcomer orientation.",
      });
    }
  }
  const seenTitles = new Set<string>();
  for (const task of request.contentSpec.tasks) {
    const key = titleKey(task.copy.title.text);
    if (seenTitles.has(key)) {
      issues.push({
        code: "duplicate-module-title",
        severity: "warning",
        moduleId: task.moduleId,
        message: "Visible module titles should be distinct and support different shopper decisions.",
      });
      break;
    }
    seenTitles.add(key);
    task.copy.scenes?.forEach((scene) => {
      const sceneRef = `scene:${scene.sceneId}`;
      const refs = [
        ...scene.title.evidenceRefs,
        ...scene.description.evidenceRefs,
      ];
      if (!refs.includes(sceneRef)) {
        issues.push({
          code: "scene-evidence-reference-missing",
          severity: "warning",
          moduleId: task.moduleId,
          message: `Scene ${scene.sceneId} title or description should cite its scene evidence.`,
        });
      }
    });
  }
  return issues;
}

function reviewProposal(
  request: TopicPageContentReviewRequest,
): { proposal?: TopicPageContentReviewProposal; issues: string[] } {
  const value = objectValue(request.proposal);
  const issues: string[] = [];
  if (!value) return { issues: ["TopicPageContentReviewProposal must be a JSON object."] };
  if (value.schemaVersion !== "topic-page-content-review-proposal/v1") {
    issues.push('schemaVersion must be "topic-page-content-review-proposal/v1".');
  }
  if (value.contentSpecDigest !== request.contentSpec.digest) {
    issues.push("Content review contentSpecDigest does not match TopicPageContentSpec.");
  }
  if (value.copyBriefDigest !== request.copyBrief.digest) {
    issues.push("Content review copyBriefDigest does not match TopicPageCopyBrief.");
  }
  const expectedBackgroundDigest = request.backgroundEvidence?.digest ?? null;
  if (value.backgroundEvidenceDigest !== expectedBackgroundDigest) {
    issues.push("Content review backgroundEvidenceDigest does not match.");
  }
  const verdict = value.verdict === "approved" || value.verdict === "revision-required"
    ? value.verdict
    : null;
  if (!verdict) issues.push("Content review verdict is invalid.");
  const rawIssues = Array.isArray(value.issues) ? value.issues : [];
  if (!Array.isArray(value.issues) || rawIssues.length > 20) {
    issues.push("Content review issues must be an array with at most 20 items.");
  }
  const reviewedIssues: TopicPageContentReviewIssue[] = [];
  rawIssues.forEach((rawIssue, index) => {
    const issue = objectValue(rawIssue);
    if (!issue) {
      issues.push(`Content review issue ${index} must be an object.`);
      return;
    }
    const code = stringValue(issue.code);
    const message = stringValue(issue.message);
    const severity = issue.severity === "warning" || issue.severity === "error"
      ? issue.severity
      : null;
    const moduleId = stringValue(issue.moduleId) as TopicModuleId;
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(code)) {
      issues.push(`Content review issue ${index} code is invalid.`);
    }
    if (!severity) issues.push(`Content review issue ${index} severity is invalid.`);
    if (!message || message.length > 300) {
      issues.push(`Content review issue ${index} requires a message no longer than 300 characters.`);
    }
    if (moduleId && !MODULE_IDS.has(moduleId)) {
      issues.push(`Content review issue ${index} moduleId is invalid.`);
    }
    if (code && severity && message) {
      reviewedIssues.push({ code, severity, ...(moduleId ? { moduleId } : {}), message });
    }
  });
  if (verdict === "approved" && reviewedIssues.some(({ severity }) => severity === "error")) {
    issues.push("Approved content review cannot contain error issues.");
  }
  if (verdict === "revision-required" &&
      !reviewedIssues.some(({ severity }) => severity === "error")) {
    issues.push("Revision-required content review requires at least one error issue.");
  }
  if (issues.length > 0 || !verdict) return { issues };
  return {
    issues: [],
    proposal: {
      schemaVersion: "topic-page-content-review-proposal/v1",
      contentSpecDigest: request.contentSpec.digest,
      copyBriefDigest: request.copyBrief.digest,
      backgroundEvidenceDigest: expectedBackgroundDigest,
      verdict,
      issues: reviewedIssues,
    },
  };
}

export function reviewTopicPageContentReviewDecision(
  request: Omit<TopicPageContentReviewRequest, "proposal" | "reviewerAgentId">,
  value: unknown,
) {
  const issues = structuralIssues(request);
  const decision = objectValue(value);
  if (!decision) {
    return [...issues, "TopicPageContentReviewDecision must be a JSON object."];
  }
  if (decision.schemaVersion !== "topic-page-content-review/v1") {
    issues.push('Content review decision schemaVersion must be "topic-page-content-review/v1".');
  }
  const reviewerAgentId = stringValue(decision.reviewerAgentId);
  if (!reviewerAgentId) issues.push("Content review decision requires reviewerAgentId.");
  const proposalReview = reviewProposal({
    ...request,
    proposal: {
      schemaVersion: "topic-page-content-review-proposal/v1",
      contentSpecDigest: decision.contentSpecDigest,
      copyBriefDigest: decision.copyBriefDigest,
      backgroundEvidenceDigest: decision.backgroundEvidenceDigest,
      verdict: decision.verdict,
      issues: decision.issues,
    },
  });
  issues.push(...proposalReview.issues);
  if (proposalReview.proposal?.verdict !== "approved") {
    issues.push("Visual generation requires an approved content review decision.");
  }
  if (decision.digest !== topicPageContentReviewDecisionDigest(decision)) {
    issues.push("Content review decision digest is invalid.");
  }
  return issues;
}

function issueMessage(issue: TopicPageContentReviewIssue) {
  const moduleLabel = issue.moduleId
    ? `${issue.moduleId.charAt(0).toUpperCase()}${issue.moduleId.slice(1).replaceAll("-", " ")}: `
    : "";
  return `${moduleLabel}${issue.message}`;
}

export function advanceTopicPageContentReviewRun(
  request: TopicPageContentReviewRequest,
): TopicPageContentReviewRun {
  const hardIssues = structuralIssues(request);
  if (hardIssues.length > 0) {
    return {
      schemaVersion: "topic-page-content-review-run/v1",
      status: "blocked",
      faultKind: "structural-invalid",
      rollbackStage: "content-writing",
      issues: hardIssues,
    };
  }
  if (request.proposal === undefined) {
    const brandCriteria = request.copyBrief.schemaVersion === "topic-page-copy-brief/v3" &&
        request.copyBrief.heroStrategy.kind === "brand"
      ? (["brand-distinctiveness"] as const)
      : [];
    return {
      schemaVersion: "topic-page-content-review-run/v1",
      status: "needs-content-review-proposal",
      context: {
        contentSpecDigest: request.contentSpec.digest,
        copyBriefDigest: request.copyBrief.digest,
        backgroundEvidenceDigest: request.backgroundEvidence?.digest ?? null,
        contentSpec: structuredClone(request.contentSpec),
        copyBrief: structuredClone(request.copyBrief),
        backgroundEvidence: request.backgroundEvidence
          ? structuredClone(request.backgroundEvidence)
          : null,
        criteria: [
          ...CRITERIA,
          ...brandCriteria,
          ...(request.localizationReference
            ? (["cross-locale-semantic-alignment"] as const)
            : []),
        ],
        reviewBoundary: "copy-only-no-upstream-mutation",
        qualityPolicy: "advisory-optimize-never-block",
        advisoryWarnings: advisoryDeterministicIssues(request),
        localizationReference: request.localizationReference
          ? structuredClone(request.localizationReference)
          : null,
      },
    };
  }
  const review = reviewProposal(request);
  if (!review.proposal) {
    return {
      schemaVersion: "topic-page-content-review-run/v1",
      status: "blocked",
      faultKind: "review-invalid",
      rollbackStage: "content-writing",
      issues: review.issues,
    };
  }
  const decision = {
    schemaVersion: "topic-page-content-review/v1" as const,
    contentSpecDigest: review.proposal.contentSpecDigest,
    copyBriefDigest: review.proposal.copyBriefDigest,
    backgroundEvidenceDigest: review.proposal.backgroundEvidenceDigest,
    verdict: review.proposal.verdict,
    issues: [
      ...advisoryDeterministicIssues(request),
      ...review.proposal.issues,
    ],
    reviewerAgentId: request.reviewerAgentId ?? "unknown-review-agent",
  };
  const compiledDecision = {
    ...decision,
    digest: topicPageContentReviewDecisionDigest(decision),
  };
  if (compiledDecision.verdict === "revision-required") {
    return {
      schemaVersion: "topic-page-content-review-run/v1",
      status: "blocked",
      faultKind: "content-quality",
      rollbackStage: "content-writing",
      issues: compiledDecision.issues
        .filter(({ severity }) => severity === "error")
        .map(issueMessage),
      decision: compiledDecision,
    };
  }
  return {
    schemaVersion: "topic-page-content-review-run/v1",
    status: "ready",
    decision: { ...compiledDecision, verdict: "approved" },
  };
}

export async function runTopicPageContentReviewAgentWorkflow(
  request: Omit<TopicPageContentReviewRequest, "proposal" | "reviewerAgentId"> & {
    agent: TopicPageContentReviewAgent;
  },
): Promise<{ run: TopicPageContentReviewRun }> {
  const pending = advanceTopicPageContentReviewRun(request);
  if (pending.status === "blocked") return { run: pending };
  if (pending.status !== "needs-content-review-proposal") {
    return { run: pending };
  }
  let proposal: unknown;
  try {
    proposal = await request.agent.reviewPageContent(pending);
  } catch (error) {
    return {
      run: {
        schemaVersion: "topic-page-content-review-run/v1",
        status: "blocked",
        faultKind: "agent-failed",
        rollbackStage: "content-writing",
        issues: [error instanceof Error ? error.message : "Content Review Agent failed."],
      },
    };
  }
  return {
    run: advanceTopicPageContentReviewRun({
      ...request,
      proposal,
      reviewerAgentId: request.agent.reviewerAgentId ?? request.agent.id,
    }),
  };
}
