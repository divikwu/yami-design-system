import { getPageMerchandisingTemplateConfig } from "../page-merchandising/config.js";
import type { TopicPageTemplateRef } from "../page-merchandising/contracts.js";
import {
  getProductSelectionStrategyConfig,
  type ProductSelectionStrategyRef,
} from "../product-selection/config.js";
import { sha256Digest } from "../product-selection/digest.js";
import type { ThemeIntent, YamiSite } from "../types.js";
import { getLandingPageTypeConfig } from "./config.js";
import type {
  LandingPageExecutionPlan,
  LandingPageExecutionPlanProposalReview,
  LandingPageTypeRef,
} from "./contracts.js";

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function orchestrationThemeIntentDigest(intent: ThemeIntent) {
  return sha256Digest(intent);
}

export function landingPageExecutionPlanDigest(
  value: LandingPageExecutionPlan | Omit<LandingPageExecutionPlan, "digest">,
) {
  if ("digest" in value) {
    const base: Partial<LandingPageExecutionPlan> = { ...value };
    delete base.digest;
    return sha256Digest(base);
  }
  return sha256Digest(value);
}

export function reviewLandingPageExecutionPlanProposal(options: {
  intent: ThemeIntent;
  keyword: string;
  site: YamiSite;
  language: "en" | "zh";
  requestedPageTypeRef?: LandingPageTypeRef;
  requestedSelectionStrategyRef?: ProductSelectionStrategyRef;
  value: unknown;
}): LandingPageExecutionPlanProposalReview {
  const proposal = objectValue(options.value);
  const issues: string[] = [];
  if (!proposal) {
    return {
      status: "rejected",
      issues: ["LandingPageExecutionPlanProposal must be a JSON object."],
    };
  }

  if (proposal.schemaVersion !== "landing-page-execution-plan-proposal/v1") {
    issues.push('schemaVersion must be "landing-page-execution-plan-proposal/v1".');
  }
  if (proposal.keyword !== options.keyword) issues.push("Proposal keyword does not match the orchestration task.");
  if (proposal.site !== options.site) issues.push("Proposal site does not match the orchestration task.");
  if (proposal.language !== options.language) issues.push("Proposal language does not match the orchestration task.");
  if (proposal.themeIntentDigest !== orchestrationThemeIntentDigest(options.intent)) {
    issues.push("Proposal themeIntentDigest does not match ThemeIntent.");
  }

  const requestedPageTypeRef = options.requestedPageTypeRef ?? null;
  const requestedSelectionStrategyRef = options.requestedSelectionStrategyRef ?? null;
  if (proposal.requestedPageTypeRef !== requestedPageTypeRef) {
    issues.push("Proposal requestedPageTypeRef does not match the caller constraint.");
  }
  if (proposal.requestedSelectionStrategyRef !== requestedSelectionStrategyRef) {
    issues.push("Proposal requestedSelectionStrategyRef does not match the caller constraint.");
  }

  const pageTypeRef = stringValue(proposal.pageTypeRef) as LandingPageTypeRef;
  const selectionStrategyRef = stringValue(proposal.selectionStrategyRef) as ProductSelectionStrategyRef;
  const templateRef = stringValue(proposal.templateRef) as TopicPageTemplateRef;
  let pageType;
  try {
    pageType = getLandingPageTypeConfig(pageTypeRef);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "Unknown landing page type.");
  }
  try {
    getProductSelectionStrategyConfig(selectionStrategyRef);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "Unknown product selection strategy.");
  }
  try {
    getPageMerchandisingTemplateConfig(templateRef);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "Unknown page template.");
  }

  if (requestedPageTypeRef && pageTypeRef !== requestedPageTypeRef) {
    issues.push("Proposal pageTypeRef does not match the caller request.");
  }
  if (requestedSelectionStrategyRef && selectionStrategyRef !== requestedSelectionStrategyRef) {
    issues.push("Proposal selectionStrategyRef does not match the caller request.");
  }
  if (pageType) {
    if (!pageType.supportedThemeTypes.includes(options.intent.themeType)) {
      issues.push(`Page type ${pageType.ref} does not support ThemeIntent type ${options.intent.themeType}.`);
    }
    if (pageType.requiresExplicitRequest && requestedPageTypeRef !== pageType.ref) {
      issues.push(`Page type ${pageType.ref} requires an explicit caller request.`);
    }
    if (!pageType.routes.some((route) =>
      route.selectionStrategyRef === selectionStrategyRef && route.templateRef === templateRef
    )) {
      issues.push(
        `Page type ${pageType.ref} does not register route ${selectionStrategyRef} -> ${templateRef}.`,
      );
    }
  }

  const reason = stringValue(proposal.reason);
  if (!reason) issues.push("Proposal requires a concise reviewable reason.");
  if (issues.length > 0) return { status: "rejected", issues };

  return {
    status: "accepted",
    issues: [],
    proposal: {
      schemaVersion: "landing-page-execution-plan-proposal/v1",
      keyword: options.keyword,
      site: options.site,
      language: options.language,
      themeIntentDigest: orchestrationThemeIntentDigest(options.intent),
      requestedPageTypeRef,
      requestedSelectionStrategyRef,
      pageTypeRef,
      selectionStrategyRef,
      templateRef,
      reason,
    },
  };
}
