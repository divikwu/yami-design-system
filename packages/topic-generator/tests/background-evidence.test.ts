import { describe, expect, it, vi } from "vitest";

import {
  advanceTopicBackgroundEvidenceRun,
  runTopicBackgroundEvidenceAgentWorkflow,
  themeIntentDigest,
  type ThemeIntent,
  type TopicBackgroundEvidenceAgent,
} from "../src/index.js";

function brandIntentFixture(): ThemeIntent {
  return {
    schemaVersion: "theme-intent/v2",
    source: "catalog-evidence",
    themeType: "brand",
    catalogDomain: "beauty",
    attributeSchemaVersion: "catalog-v1",
    entityType: "brand",
    canonicalEntity: { id: "brand:anua", label: "ANUA" },
    shoppingIntent: "browse-brand",
    shopperAction: "browse",
    shoppingGoal: "Browse ANUA products by category and routine",
    needs: ["cleansers", "toners", "serums"],
    conditions: [],
    mustInclude: ["ANUA"],
    mustExclude: [],
    searchTerms: ["ANUA"],
    categories: [],
    constraints: [{
      id: "brand:anua",
      kind: "core-entity",
      value: "ANUA",
      status: "verified",
      evidenceIds: ["catalog-brand:anua"],
    }],
    evidenceRefs: [{
      id: "catalog-brand:anua",
      source: "catalog-brand",
      label: "ANUA",
    }],
    candidates: [{
      id: "brand:anua",
      themeType: "brand",
      entityType: "brand",
      canonicalEntity: { id: "brand:anua", label: "ANUA" },
      shoppingIntent: "browse-brand",
      shopperAction: "browse",
      score: 1,
      evidenceLevel: "high",
      reason: "ANUA is an exact catalog brand.",
      supportingEvidenceIds: ["catalog-brand:anua"],
      competingCandidateIds: [],
    }],
    decision: {
      status: "resolved",
      selectedCandidateId: "brand:anua",
      evidenceLevel: "high",
      selectedCandidateMargin: null,
      requiresAgentReview: false,
    },
    reason: "ANUA is an exact catalog brand.",
    confidence: 1,
  };
}

function proposal(intent = brandIntentFixture()) {
  return {
    schemaVersion: "topic-background-evidence-proposal/v1",
    keyword: "ANUA",
    site: "us",
    language: "zh",
    themeIntentDigest: themeIntentDigest(intent),
    sources: [
      {
        id: "source:anua-official",
        type: "official-brand",
        title: "ANUA About",
        url: "https://anua.global/pages/about-anua",
        publisher: "ANUA",
      },
      {
        id: "source:anua-wikipedia",
        type: "wikipedia",
        title: "Anua",
        url: "https://en.wikipedia.org/wiki/Anua",
        publisher: "Wikipedia",
      },
    ],
    claims: [
      {
        id: "claim:anua-identity",
        type: "identity",
        text: "ANUA is a Korean skincare brand.",
        sourceIds: ["source:anua-official"],
        usage: "context-only",
      },
      {
        id: "claim:anua-name-context",
        type: "terminology",
        text: "Use ANUA as the immutable brand name in localized copy.",
        sourceIds: ["source:anua-official", "source:anua-wikipedia"],
        usage: "context-only",
      },
    ],
  };
}

describe("TopicBackgroundEvidence", () => {
  it("requests bounded public background evidence during topic understanding", () => {
    const intent = brandIntentFixture();
    const run = advanceTopicBackgroundEvidenceRun({
      intent,
      keyword: "ANUA",
      site: "us",
      language: "zh",
    });

    expect(run).toMatchObject({
      status: "needs-background-evidence-proposal",
      context: {
        audienceContext: {
          schemaVersion: "topic-audience-context/v1",
          familiarity: "unfamiliar",
          marketContext: "non-asian-us",
        },
        sourcePolicy: {
          officialBrandPriority: "required-when-brand",
          officialBrandResearchDepth: "homepage-plus-relevant-context-pages",
          brandContextGoal: "identity-plus-shopping-context-when-supported",
          wikipediaRole: "secondary-background-only",
        },
      },
    });
    if (run.status !== "needs-background-evidence-proposal") {
      throw new Error("Expected a pending background evidence run.");
    }
    expect(run.context.themeIntentDigest).toBe(themeIntentDigest(intent));
    expect(run.context.prohibitedClaimTypes).toContain("efficacy");
  });

  it("accepts a digest-bound bundle and marks official brand evidence ready", () => {
    const intent = brandIntentFixture();
    const run = advanceTopicBackgroundEvidenceRun({
      intent,
      keyword: "ANUA",
      site: "us",
      language: "zh",
      proposal: proposal(intent),
    });

    expect(run.status).toBe("ready");
    if (run.status !== "ready") throw new Error("Expected ready evidence.");
    expect(run.bundle).toMatchObject({
      schemaVersion: "topic-background-evidence/v1",
      status: "ready",
      themeIntentDigest: themeIntentDigest(intent),
    });
    expect(run.bundle.claims.map(({ id }) => id)).toEqual([
      "claim:anua-identity",
      "claim:anua-name-context",
    ]);
    expect(run.bundle.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("rejects source type drift and unsupported claim evidence", () => {
    const intent = brandIntentFixture();
    const invalid = proposal(intent);
    invalid.sources[0] = {
      ...invalid.sources[0],
      type: "official-brand",
      url: "https://en.wikipedia.org/wiki/Anua",
    };
    invalid.claims[0] = {
      ...invalid.claims[0],
      sourceIds: ["source:missing"],
    };
    const run = advanceTopicBackgroundEvidenceRun({
      intent,
      keyword: "ANUA",
      site: "us",
      language: "zh",
      proposal: invalid,
    });

    expect(run.status).toBe("blocked");
    if (run.status !== "blocked") throw new Error("Expected blocked evidence.");
    expect(run.issues).toEqual(expect.arrayContaining([
      expect.stringContaining("official-brand source cannot use a Wikipedia URL"),
      expect.stringContaining("unknown source source:missing"),
    ]));
  });

  it("degrades to an explicit unavailable bundle when research fails", async () => {
    const intent = brandIntentFixture();
    const proposeBackgroundEvidence = vi.fn(async () => {
      throw new Error("Research transport unavailable");
    });
    const agent: TopicBackgroundEvidenceAgent = {
      id: "background-evidence-agent",
      proposeBackgroundEvidence,
    };
    const result = await runTopicBackgroundEvidenceAgentWorkflow({
      intent,
      keyword: "ANUA",
      site: "us",
      language: "zh",
      agent,
    });

    expect(proposeBackgroundEvidence).toHaveBeenCalledOnce();
    expect(result.bundle).toMatchObject({
      status: "unavailable",
      sources: [],
      claims: [],
      issues: [expect.stringContaining("Research transport unavailable")],
    });
  });

  it("does not research background before ThemeIntent is resolved", async () => {
    const intent = brandIntentFixture();
    intent.decision = {
      ...intent.decision,
      status: "needs-review",
      requiresAgentReview: true,
    };
    const proposeBackgroundEvidence = vi.fn(async () => proposal(intent));
    const result = await runTopicBackgroundEvidenceAgentWorkflow({
      intent,
      keyword: "ANUA",
      site: "us",
      language: "zh",
      agent: { id: "background-evidence-agent", proposeBackgroundEvidence },
    });

    expect(proposeBackgroundEvidence).not.toHaveBeenCalled();
    expect(result.run).toMatchObject({
      status: "blocked",
      issues: [expect.stringContaining("requires a resolved ThemeIntent")],
    });
    expect(result.bundle.status).toBe("unavailable");
  });
});
