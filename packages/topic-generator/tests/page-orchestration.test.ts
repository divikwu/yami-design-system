import { describe, expect, it, vi } from "vitest";

import {
  advanceLandingPageOrchestrationRun,
  runLandingPageOrchestratorAgentWorkflow,
  type LandingPageOrchestratorAgent,
  type ThemeIntent,
} from "../src/index.js";

function brandIntent(): ThemeIntent {
  return {
    schemaVersion: "theme-intent/v2",
    source: "catalog-evidence",
    themeType: "brand",
    catalogDomain: "beauty",
    attributeSchemaVersion: "catalog-v1",
    entityType: "brand",
    canonicalEntity: { id: "anua", label: "ANUA" },
    shoppingIntent: "browse-brand",
    shopperAction: "browse",
    shoppingGoal: "Browse ANUA products",
    needs: [],
    conditions: [],
    mustInclude: ["ANUA"],
    mustExclude: [],
    searchTerms: ["ANUA"],
    categories: [],
    constraints: [],
    evidenceRefs: [{ id: "brand:anua", source: "catalog-brand", label: "ANUA" }],
    candidates: [],
    decision: {
      status: "resolved",
      selectedCandidateId: "brand:anua",
      evidenceLevel: "high",
      selectedCandidateMargin: null,
      requiresAgentReview: false,
    },
    reason: "Exact catalog brand match.",
    confidence: 0.96,
  };
}

function activityIntent(): ThemeIntent {
  return {
    ...brandIntent(),
    themeType: "activity",
    entityType: "scenario",
    canonicalEntity: { id: "hot-pot-night", label: "Hot pot night" },
    shoppingIntent: "assemble-scenario",
    shopperAction: "bundle",
    shoppingGoal: "Build a complete hot pot night assortment",
    mustInclude: ["hot pot"],
    searchTerms: ["hot pot"],
    evidenceRefs: [{
      id: "scenario:hot-pot-night",
      source: "scenario-vocabulary",
      label: "Hot pot night",
    }],
    decision: {
      status: "resolved",
      selectedCandidateId: "scenario:hot-pot-night",
      evidenceLevel: "high",
      selectedCandidateMargin: null,
      requiresAgentReview: false,
    },
    reason: "Scenario vocabulary and catalog evidence resolve an activity intent.",
  };
}

describe("Landing page orchestration", () => {
  it("exposes registered page-type routes and compiles only a supported execution plan", () => {
    const intent = brandIntent();
    const pending = advanceLandingPageOrchestrationRun({
      intent,
      language: "zh",
      requestedSelectionStrategyRef: "relevance/default@1",
    });

    expect(pending).toMatchObject({
      schemaVersion: "landing-page-orchestration-run/v1",
      status: "needs-execution-plan-proposal",
      context: {
        requestedSelectionStrategyRef: "relevance/default@1",
        requestedPageTypeRef: null,
      },
    });
    if (pending.status !== "needs-execution-plan-proposal") throw new Error("Expected task context.");
    expect(pending.context.pageTypes.map(({ ref }) => ref)).toEqual([
      "landing-page/brand@2",
      "landing-page/topic@2",
      "landing-page/campaign@2",
    ]);

    const ready = advanceLandingPageOrchestrationRun({
      intent,
      language: "zh",
      requestedSelectionStrategyRef: "relevance/default@1",
      proposal: {
        schemaVersion: "landing-page-execution-plan-proposal/v1",
        keyword: "ANUA",
        site: "us",
        language: "zh",
        themeIntentDigest: pending.context.themeIntentDigest,
        requestedPageTypeRef: null,
        requestedSelectionStrategyRef: "relevance/default@1",
        pageTypeRef: "landing-page/brand@1",
        selectionStrategyRef: "relevance/default@1",
        templateRef: "topic-landing/relevance@1",
        reason: "Use the registered brand route requested by the caller.",
      },
    });

    expect(ready).toMatchObject({
      status: "ready",
      plan: {
        schemaVersion: "landing-page-execution-plan/v1",
        status: "execution-ready",
        pageTypeRef: "landing-page/brand@1",
        selectionStrategyRef: "relevance/default@1",
        templateRef: "topic-landing/relevance@1",
        workflowRef: "landing-page/default@1",
        stages: [
          { id: "background-evidence", actor: "research-agent" },
          { id: "product-selection", actor: "strategy-agent" },
          { id: "module-merchandising", actor: "strategy-agent" },
          { id: "content-writing", actor: "content-agent" },
          { id: "content-review", actor: "review-agent" },
          { id: "visual-generation", actor: "visual-agent" },
          { id: "asset-persistence", actor: "system" },
          { id: "page-generation", actor: "system" },
          { id: "automatic-qa", actor: "system" },
          { id: "experience-review", actor: "review-agent" },
        ],
      },
    });
    if (ready.status !== "ready") throw new Error("Expected an execution-ready plan.");
    expect(ready.plan.stages.find(({ id }) => id === "content-writing")?.maxAttempts).toBe(2);
    expect(ready.plan.stages.find(({ id }) => id === "content-review")?.maxAttempts).toBe(1);
  });

  it("accepts the unique Campaign route for activity intent and rejects incompatible intent", () => {
    const intent = activityIntent();
    const pending = advanceLandingPageOrchestrationRun({
      intent,
      language: "en",
      requestedSelectionStrategyRef: "relevance/default@1",
    });
    if (pending.status !== "needs-execution-plan-proposal") throw new Error("Expected task context.");

    const campaign = advanceLandingPageOrchestrationRun({
      intent,
      language: "en",
      requestedSelectionStrategyRef: "relevance/default@1",
      proposal: {
        schemaVersion: "landing-page-execution-plan-proposal/v1",
        keyword: "Hot pot night",
        site: "us",
        language: "en",
        themeIntentDigest: pending.context.themeIntentDigest,
        requestedPageTypeRef: null,
        requestedSelectionStrategyRef: "relevance/default@1",
        pageTypeRef: "landing-page/campaign@1",
        selectionStrategyRef: "relevance/default@1",
        templateRef: "topic-landing/relevance@1",
        reason: "Use the registered Campaign route for the resolved activity intent.",
      },
    });
    expect(campaign).toMatchObject({
      status: "ready",
      plan: { pageTypeRef: "landing-page/campaign@1" },
    });

    const brand = brandIntent();
    const brandPending = advanceLandingPageOrchestrationRun({ intent: brand, language: "en" });
    if (brandPending.status !== "needs-execution-plan-proposal") throw new Error("Expected task context.");
    const invalid = advanceLandingPageOrchestrationRun({
      intent: brand,
      language: "en",
      proposal: {
        schemaVersion: "landing-page-execution-plan-proposal/v1",
        keyword: "ANUA",
        site: "us",
        language: "en",
        themeIntentDigest: brandPending.context.themeIntentDigest,
        requestedPageTypeRef: null,
        requestedSelectionStrategyRef: null,
        pageTypeRef: "landing-page/campaign@1",
        selectionStrategyRef: "relevance/default@1",
        templateRef: "topic-landing/relevance@1",
        reason: "Try to use Campaign for a brand intent.",
      },
    });
    expect(invalid).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Page type landing-page/campaign@1 does not support ThemeIntent type brand.",
      ]),
    });

    const unresolved = advanceLandingPageOrchestrationRun({
      intent: {
        ...intent,
        themeType: "uncertain",
        decision: { ...intent.decision, status: "needs-review" },
      },
      language: "en",
    });
    expect(unresolved).toMatchObject({
      status: "needs-execution-plan-proposal",
      context: {
        themeIntent: {
          themeType: "uncertain",
          decision: { status: "needs-review" },
        },
      },
    });
    if (unresolved.status !== "needs-execution-plan-proposal") {
      throw new Error("Expected unresolved intent to continue with an advisory draft route.");
    }
    const unresolvedReady = advanceLandingPageOrchestrationRun({
      intent: unresolved.context.themeIntent,
      language: "en",
      proposal: {
        schemaVersion: "landing-page-execution-plan-proposal/v1",
        keyword: "Hot pot night",
        site: "us",
        language: "en",
        themeIntentDigest: unresolved.context.themeIntentDigest,
        requestedPageTypeRef: null,
        requestedSelectionStrategyRef: null,
        pageTypeRef: "landing-page/topic@2",
        selectionStrategyRef: "relevance/intent-themes@5",
        templateRef: "topic-landing/topic-relevance@2",
        reason: "Use the topic draft route while intent uncertainty remains advisory.",
      },
    });
    expect(unresolvedReady).toMatchObject({
      status: "ready",
      plan: { pageTypeRef: "landing-page/topic@2" },
    });
  });

  it("invokes the constrained Orchestrator Agent once and revalidates its proposal", async () => {
    const proposeExecutionPlan = vi.fn<LandingPageOrchestratorAgent["proposeExecutionPlan"]>(
      async (run) => ({
        schemaVersion: "landing-page-execution-plan-proposal/v1",
        keyword: run.context.keyword,
        site: run.context.site,
        language: run.context.language,
        themeIntentDigest: run.context.themeIntentDigest,
        requestedPageTypeRef: run.context.requestedPageTypeRef,
        requestedSelectionStrategyRef: run.context.requestedSelectionStrategyRef,
        pageTypeRef: "landing-page/brand@2",
        selectionStrategyRef: "category-role/landing-page-agent@1",
        templateRef: "topic-landing/brand@2",
        reason: "Use the registered category-role brand route.",
      }),
    );
    const agent: LandingPageOrchestratorAgent = {
      id: "topic-page-orchestrator",
      proposeExecutionPlan,
    };

    const result = await runLandingPageOrchestratorAgentWorkflow({
      intent: brandIntent(),
      language: "en",
      requestedSelectionStrategyRef: "category-role/landing-page-agent@1",
      agent,
    });

    expect(result.run.status).toBe("ready");
    expect(result.artifacts.agentId).toBe("topic-page-orchestrator");
    expect(proposeExecutionPlan).toHaveBeenCalledTimes(1);
  });

  it("falls back to a registered deterministic route when the Agent proposal is invalid", async () => {
    const result = await runLandingPageOrchestratorAgentWorkflow({
      intent: brandIntent(),
      language: "en",
      requestedSelectionStrategyRef: "relevance/intent-themes@5",
      agent: {
        id: "topic-page-orchestrator",
        proposeExecutionPlan: async () => ({ pageTypeRef: "invented/page@99" }),
      },
    });

    expect(result).toMatchObject({
      run: {
        status: "ready",
        plan: {
          pageTypeRef: "landing-page/brand@2",
          selectionStrategyRef: "relevance/intent-themes@5",
          templateRef: "topic-landing/brand-relevance@2",
        },
      },
      artifacts: {
        fallbackUsed: true,
        agentProposal: { pageTypeRef: "invented/page@99" },
      },
    });
  });
});
