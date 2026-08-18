import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import {
  buildTopicIntentReport,
  parseTopicGeneratorCliArgs,
  resolveTopicGeneratorPath,
} from "../src/cli.js";
import type { TopicIntentAnalysis } from "../src/analyze.js";
import { handleTopicGeneratorPost } from "../src/server.js";
import type { CatalogSnapshotAdapter } from "../src/catalog-snapshot.js";

describe("TOPIC GENERATOR portable entry points", () => {
  it("shares seven stage Skills while keeping five logical Agents separate", async () => {
    const integrationRoot = new URL("../integrations/", import.meta.url);
    const topicIntentSkill = await readFile(
      new URL("codex/topic-intent/SKILL.md", integrationRoot),
      "utf8",
    );
    const kiroTopicIntentSkill = await readFile(
      new URL("../../../.kiro/skills/topic-intent/SKILL.md", import.meta.url),
      "utf8",
    );
    const productSelectionSkill = await readFile(
      new URL("codex/product-selection/SKILL.md", integrationRoot),
      "utf8",
    );
    const pageMerchandisingSkill = await readFile(
      new URL("codex/page-merchandising/SKILL.md", integrationRoot),
      "utf8",
    );
    const contentWritingSkill = await readFile(
      new URL("codex/content-writing/SKILL.md", integrationRoot),
      "utf8",
    );
    const visualGenerationSkill = await readFile(
      new URL("codex/visual-generation/SKILL.md", integrationRoot),
      "utf8",
    );
    const pageOrchestrationSkill = await readFile(
      new URL("codex/page-orchestration/SKILL.md", integrationRoot),
      "utf8",
    );
    const pageReviewSkill = await readFile(
      new URL("codex/page-review/SKILL.md", integrationRoot),
      "utf8",
    );
    const orchestratorAgent = JSON.parse(await readFile(
      new URL("kiro/topic-page-orchestrator.json", integrationRoot),
      "utf8",
    )) as {
      prompt: string;
      tools: string[];
      allowedTools: string[];
      resources: string[];
      permissions: { rules: Array<Record<string, unknown>> };
    };
    const strategyAgent = JSON.parse(await readFile(
      new URL("kiro/topic-strategy.json", integrationRoot),
      "utf8",
    )) as typeof orchestratorAgent;
    const contentAgent = JSON.parse(await readFile(
      new URL("kiro/topic-content.json", integrationRoot),
      "utf8",
    )) as typeof orchestratorAgent;
    const visualAgent = JSON.parse(await readFile(
      new URL("kiro/topic-visual.json", integrationRoot),
      "utf8",
    )) as typeof orchestratorAgent;
    const reviewAgent = JSON.parse(await readFile(
      new URL("kiro/topic-review.json", integrationRoot),
      "utf8",
    )) as typeof orchestratorAgent;

    expect(topicIntentSkill).toContain(
      "description: This skill should be used when the user asks to",
    );
    expect(kiroTopicIntentSkill).toBe(topicIntentSkill);
    expect(productSelectionSkill).toContain(
      "description: This skill should be used when the user asks to",
    );
    expect(pageMerchandisingSkill).toContain(
      "description: This skill should be used when the user asks to",
    );
    expect(contentWritingSkill).toContain(
      "description: This skill should be used when the user asks to",
    );
    expect(visualGenerationSkill).toContain(
      "description: This skill should be used when the user asks to",
    );
    expect(pageOrchestrationSkill).toContain(
      "description: This skill should be used when the user asks to",
    );
    expect(pageReviewSkill).toContain(
      "description: This skill should be used when the user asks to",
    );
    expect(visualGenerationSkill).toContain("topic-page-agent-response/v1");
    expect(orchestratorAgent.resources).toContain(
      "skill://.kiro/skills/page-orchestration/SKILL.md",
    );
    expect(orchestratorAgent.resources).not.toContain(
      "skill://.kiro/skills/product-selection/SKILL.md",
    );
    expect(strategyAgent.resources).toContain(
      "skill://.kiro/skills/topic-intent/SKILL.md",
    );
    expect(strategyAgent.resources).toContain(
      "skill://.kiro/skills/product-selection/SKILL.md",
    );
    expect(strategyAgent.resources).toContain(
      "skill://.kiro/skills/page-merchandising/SKILL.md",
    );
    expect(strategyAgent.resources).not.toContain(
      "skill://.kiro/skills/content-writing/SKILL.md",
    );
    expect(strategyAgent.resources).not.toContain(
      "skill://.kiro/skills/visual-generation/SKILL.md",
    );
    expect(contentAgent.resources).toEqual(expect.arrayContaining([
      "skill://.kiro/skills/content-writing/SKILL.md",
    ]));
    expect(contentAgent.resources).not.toContain(
      "skill://.kiro/skills/product-selection/SKILL.md",
    );
    expect(contentAgent.resources).not.toContain(
      "skill://.kiro/skills/visual-generation/SKILL.md",
    );
    expect(visualAgent.resources).toEqual([
      "file://packages/topic-generator/README.md",
      "file://packages/topic-generator/docs/core.md",
      "skill://.kiro/skills/visual-generation/SKILL.md",
    ]);
    expect(visualAgent.resources).not.toContain(
      "skill://.kiro/skills/content-writing/SKILL.md",
    );
    expect(reviewAgent.resources).toEqual([
      "file://packages/topic-generator/README.md",
      "file://packages/topic-generator/docs/core.md",
      "skill://.kiro/skills/page-review/SKILL.md",
    ]);
    expect(orchestratorAgent.prompt).toContain("Never invent or execute an unregistered route");
    expect(strategyAgent.prompt).toContain("Never infer catalog facts");
    expect(contentAgent.prompt).toContain("independent Topic Content Agent");
    expect(contentAgent.prompt).toContain("customer-facing copy");
    expect(contentAgent.prompt).toContain("Do not require codex or kiro-cli");
    expect(contentWritingSkill).toContain("Host tool or API");
    expect(contentWritingSkill).toContain("not a\n  prerequisite");
    expect(contentWritingSkill).toContain("已验证的商品池");
    expect(visualAgent.prompt).toContain("independent Topic Visual Agent");
    expect(visualAgent.prompt).toContain("never fabricate an artifact or metadata");
    expect(reviewAgent.prompt).toContain("Never repair generated output");
    expect(orchestratorAgent.tools).toEqual(["read", "write"]);
    expect(reviewAgent.tools).toEqual(["read", "write"]);
    expect(contentAgent.tools).toEqual(["read", "write", "shell"]);
    expect(contentAgent.allowedTools).toEqual(["read"]);
    expect(contentAgent.permissions.rules).toContainEqual({
      capability: "shell",
      match: ["pnpm topic-generator:analyze *"],
      effect: "allow",
    });
    expect(visualAgent.tools).toEqual(["read", "write", "shell"]);
    expect(visualAgent.allowedTools).toEqual(["read"]);
    expect(visualAgent.permissions.rules).toContainEqual({
      capability: "shell",
      match: ["pnpm topic-generator:analyze *"],
      effect: "allow",
    });
  });

  it("publishes the complete automatic page contract set in the product manifest", async () => {
    const manifest = JSON.parse(await readFile(
      new URL("../product.manifest.json", import.meta.url),
      "utf8",
    )) as {
      contracts: Record<string, string>;
      standaloneReadiness: Record<string, string>;
    };

    expect(manifest.contracts).toMatchObject({
      landingPageExecutionPlan: "landing-page-execution-plan/v1",
      topicPageAgentRequest: "topic-page-agent-request/v1",
      topicPageAutomationRun: "topic-page-automation-run/v1",
      topicPageGenerationSpec: "topic-page-generation-spec/v1",
      topicPageQaReport: "topic-page-qa-report/v1",
      topicPageExperienceReviewDecision: "topic-page-experience-review-decision/v1",
      topicPageReviewPackage: "topic-page-review-package/v1",
    });
    expect(manifest.standaloneReadiness.webRuntime).toBe("standalone-automation-host");
  });

  it("accepts either an explicit or positional keyword", () => {
    expect(parseTopicGeneratorCliArgs([
      "--keyword",
      "ANUA",
      "--pretty",
      "--proposal",
      "proposal.json",
      "--output",
      "runs",
    ])).toEqual({
      help: false,
      keyword: "ANUA",
      pretty: true,
      proposalPath: "proposal.json",
      outputDir: "runs",
      selectionStrategy: "",
      taxonomyPath: "",
      taxonomyTsvPath: "",
      categoryProposalPath: "",
      candidateSnapshotPath: "",
      sceneProposalPath: "",
      pageTemplateRef: "",
      moduleProposalPath: "",
      contentLanguage: "",
      contentProposalPath: "",
      visual: false,
      visualProposalPath: "",
    });
    expect(parseTopicGeneratorCliArgs(["home", "storage"]).keyword).toBe("home storage");
    expect(parseTopicGeneratorCliArgs(["--", "--help"]).help).toBe(true);
  });

  it("accepts versioned ProductSelection inputs without changing the default CLI", () => {
    expect(parseTopicGeneratorCliArgs([
      "Matcha",
      "--selection-strategy", "category-role/landing-page-agent@1",
      "--taxonomy-tsv", "taxonomy.tsv",
      "--category-proposal", "categories.json",
      "--candidate-snapshot", "candidates.json",
      "--scene-proposal", "scenes.json",
    ])).toMatchObject({
      keyword: "Matcha",
      selectionStrategy: "category-role/landing-page-agent@1",
      taxonomyTsvPath: "taxonomy.tsv",
      categoryProposalPath: "categories.json",
      candidateSnapshotPath: "candidates.json",
      sceneProposalPath: "scenes.json",
    });
  });

  it("accepts a versioned PageMerchandising template and proposal", () => {
    expect(parseTopicGeneratorCliArgs([
      "Matcha",
      "--selection-strategy", "category-role/landing-page-agent@1",
      "--page-template", "topic-landing/topic@1",
      "--module-proposal", "modules.json",
    ])).toMatchObject({
      keyword: "Matcha",
      pageTemplateRef: "topic-landing/topic@1",
      moduleProposalPath: "modules.json",
    });
  });

  it("accepts one explicit Content language and proposal", () => {
    expect(parseTopicGeneratorCliArgs([
      "Matcha",
      "--selection-strategy", "category-role/landing-page-agent@1",
      "--page-template", "topic-landing/topic@1",
      "--module-proposal", "modules.json",
      "--content-language", "zh",
      "--content-proposal", "content.zh.json",
    ])).toMatchObject({
      keyword: "Matcha",
      contentLanguage: "zh",
      contentProposalPath: "content.zh.json",
    });
    expect(() => parseTopicGeneratorCliArgs([
      "Matcha",
      "--content-language", "fr",
    ])).toThrow("--content-language must be en or zh");
  });

  it("accepts an independent Visual stage and proposal", () => {
    expect(parseTopicGeneratorCliArgs([
      "Matcha",
      "--visual",
      "--visual-proposal", "visual.zh.json",
    ])).toMatchObject({
      keyword: "Matcha",
      visual: true,
      visualProposalPath: "visual.zh.json",
    });
    expect(parseTopicGeneratorCliArgs([
      "Matcha",
      "--visual-proposal", "visual.zh.json",
    ]).visual).toBe(true);
  });

  it("does not accept both canonical JSON and source TSV taxonomy inputs", () => {
    expect(() => parseTopicGeneratorCliArgs([
      "Matcha",
      "--taxonomy", "taxonomy.json",
      "--taxonomy-tsv", "taxonomy.tsv",
    ])).toThrow("Choose either --taxonomy or --taxonomy-tsv");
  });

  it("resolves proposal and output paths from the caller workspace", () => {
    expect(resolveTopicGeneratorPath("proposal.json", "/workspace")).toBe(
      "/workspace/proposal.json",
    );
    expect(resolveTopicGeneratorPath("/tmp/runs", "/workspace")).toBe("/tmp/runs");
  });

  it("returns a portable ThemeIntent report with evidence", () => {
    const analysis = {
      fallbackUsed: false,
      attempts: [{ adapterId: "yami-catalog-search", status: "succeeded" }],
      proposalReview: {
        status: "not-provided",
        acceptedFields: [],
        rejectedFields: [],
        warnings: [],
      },
      intent: {
        schemaVersion: "theme-intent/v2",
        source: "catalog-evidence",
        themeType: "brand",
        catalogDomain: "beauty",
        attributeSchemaVersion: "catalog-v1",
        entityType: "brand",
        canonicalEntity: { id: "1", label: "ANUA" },
        shoppingIntent: "browse-brand",
        shopperAction: "browse",
        shoppingGoal: "Browse ANUA products",
        needs: [],
        conditions: [],
        mustInclude: ["ANUA"],
        mustExclude: [],
        searchTerms: ["ANUA"],
        categories: [],
        constraints: [{
          id: "core-entity:anua",
          kind: "core-entity",
          value: "ANUA",
          status: "verified",
          evidenceIds: ["catalog-brand:1"],
        }],
        evidenceRefs: [{
          id: "catalog-brand:1",
          source: "catalog-brand",
          label: "ANUA",
        }],
        candidates: [{
          id: "brand:brand:1:browse-brand:browse",
          themeType: "brand",
          entityType: "brand",
          canonicalEntity: { id: "1", label: "ANUA" },
          shoppingIntent: "browse-brand",
          shopperAction: "browse",
          score: 0.96,
          evidenceLevel: "high",
          reason: "Exact catalog brand match.",
          supportingEvidenceIds: ["catalog-brand:1"],
          competingCandidateIds: [],
        }],
        decision: {
          status: "resolved",
          selectedCandidateId: "brand:brand:1:browse-brand:browse",
          evidenceLevel: "high",
          selectedCandidateMargin: null,
          requiresAgentReview: false,
        },
        reason: "Exact catalog brand match.",
        confidence: 0.96,
      },
      snapshot: {
        keyword: "ANUA",
        site: "us",
        sourceUrl: "https://example.com/search?q=ANUA",
        fetchedAt: "2026-08-16T00:00:00.000Z",
        provider: "yami-catalog-search",
        products: [{
          id: "1001",
          title: "ANUA Toner",
          brand: "ANUA",
          price: "$19.99",
          imageUrl: "https://example.com/1001.webp",
          productUrl: "https://example.com/1001",
          sourceRank: 1,
          categoryL1Name: "Beauty",
        }],
      },
    } satisfies TopicIntentAnalysis;

    expect(buildTopicIntentReport(analysis)).toMatchObject({
      product: "TOPIC GENERATOR",
      schemaVersion: "theme-intent/v2",
      intent: { reason: "Exact catalog brand match." },
      evidence: {
        provider: "yami-catalog-search",
        fallbackUsed: false,
        productCount: 1,
        topProducts: [{ categoryPath: ["Beauty"] }],
      },
    });
  });

  it("keeps HTTP input validation inside the product package", async () => {
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({ keyword: "A" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "invalid_keyword" },
    });
  });

  it("stops selection HTTP mode after module assignment", async () => {
    const adapters: CatalogSnapshotAdapter[] = [{
      id: "fixture",
      load: async () => ({
        keyword: "ANUA",
        site: "us",
        sourceUrl: "https://example.com/search?q=ANUA",
        fetchedAt: "2026-08-17T00:00:00.000Z",
        provider: "yami-catalog-search",
        products: ["1", "2", "3"].map((id, index) => ({
          id,
          title: `ANUA product ${id}`,
          brand: "ANUA",
          price: "$19.99",
          imageUrl: `https://example.com/${id}.webp`,
          productUrl: `https://example.com/${id}`,
          sourceRank: index + 1,
        })),
        evidence: {
          brands: [{ id: "anua", label: "ANUA", aliases: ["ANUA"], resultCount: 3 }],
          categories: [],
          attributes: [],
        },
      }),
    }];
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({ keyword: "ANUA", mode: "selection" }),
      }),
      { adapters },
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      plans: {
        en: {
          relevance: {
            generationMode: "selection",
            content: { copyMode: "not-generated" },
            assetStrategy: { mode: "not-generated" },
          },
        },
      },
    });
    expect(payload.plans.en.relevance.modules.length).toBeGreaterThan(0);
    expect(payload.plans.en.relevance.modules.every(
      (module: { heading: string; description: string }) =>
        module.heading === "" && module.description === "",
    )).toBe(true);
    expect(payload.plans.en.relevance.workflow.map(({ stage }: { stage: string }) => stage))
      .toEqual(["03", "04"]);
    expect(payload.automation).toBeUndefined();
  });

  it("reports category-role as blocked instead of inferring categories from search results", async () => {
    const adapters: CatalogSnapshotAdapter[] = [{
      id: "fixture",
      load: async () => ({
        keyword: "Matcha",
        site: "us",
        sourceUrl: "https://example.com/search?q=Matcha",
        fetchedAt: "2026-08-18T00:00:00.000Z",
        provider: "yami-catalog-search",
        products: ["1", "2", "3"].map((id, index) => ({
          id,
          title: `Matcha product ${id}`,
          brand: "Matcha",
          price: "$1.00",
          imageUrl: `https://example.com/${id}.webp`,
          productUrl: `https://example.com/${id}`,
          sourceRank: index + 1,
        })),
        evidence: {
          brands: [{ id: "matcha", label: "Matcha", aliases: ["Matcha"], resultCount: 3 }],
          categories: [],
          attributes: [],
        },
      }),
    }];
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({ keyword: "Matcha", strategy: "category-role" }),
      }),
      { adapters },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      selectionRuns: {
        "category-role": {
          status: "blocked",
          strategyRef: "category-role/landing-page-agent@1",
          issues: ["CategoryRole selection requires a CatalogTaxonomySnapshot."],
        },
      },
      plans: {
        en: { relevance: { selectionStrategy: { id: "relevance" } } },
      },
    });
  });

  it("returns CatalogSnapshot Adapter attempts when every source fails", async () => {
    const adapters: CatalogSnapshotAdapter[] = [
      {
        id: "structured",
        load: async () => {
          throw Object.assign(new Error("catalog down"), { code: "request_failed" });
        },
      },
      {
        id: "fallback",
        load: async () => {
          throw Object.assign(new Error("no cards"), { code: "no_products" });
        },
      },
    ];
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({ keyword: "ANUA" }),
      }),
      { adapters },
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "catalog_unavailable",
        attempts: [
          { adapterId: "structured", errorCode: "request_failed" },
          { adapterId: "fallback", errorCode: "no_products" },
        ],
      },
    });
  });
});
