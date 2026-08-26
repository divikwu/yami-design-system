import { describe, expect, it, vi } from "vitest";
import {
  buildTopicPagePlanMatrix,
  type TopicGeneratorDeliverableRenderRequest,
  type TopicGeneratorRunManifestV2,
  type YamiSearchSnapshot,
} from "@yami/topic-generator";

vi.mock("server-only", () => ({}));

import { createTopicGeneratorOfflineRenderer } from "./topic-generator-offline-export";

const manifest: TopicGeneratorRunManifestV2 = {
  schemaVersion: "topic-generator-run/v2",
  product: "TOPIC GENERATOR",
  runId: "matcha-20260821000000000-deadbeef",
  createdAt: "2026-08-21T00:00:00.000Z",
  request: {
    keyword: "Matcha",
    site: "us",
    language: "zh",
    strategy: "relevance",
    goal: "page",
  },
  requestDigest: "a".repeat(64),
  origin: { type: "new" },
  contracts: {
    state: "topic-generator-run-state/v1",
    stageResult: "topic-generator-stage-result/v1",
    pageAutomation: "topic-page-automation-run/v1",
  },
};

const snapshot: YamiSearchSnapshot = {
  keyword: "Matcha",
  site: "us",
  sourceUrl: "https://example.com/search?q=matcha",
  fetchedAt: "2026-08-21T00:00:00.000Z",
  products: [{
    id: "matcha-1",
    title: "Matcha powder",
    brand: "Yami",
    price: "$12.99",
    imageUrl: "https://media.example.com/matcha.webp",
    productUrl: "https://www.yamibuy.com/en/p/matcha-1",
    sourceRank: 1,
  }],
};

function request(
  name: TopicGeneratorDeliverableRenderRequest["name"],
  stages: TopicGeneratorDeliverableRenderRequest["stages"],
): TopicGeneratorDeliverableRenderRequest {
  return { name, manifest, stages };
}

function offlinePayload(html: string) {
  const match = html.match(
    /<script id="topic-generator-offline-payload" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match?.[1]) throw new Error("Offline payload is missing.");
  return JSON.parse(match[1]) as {
    plan?: {
      modules: Array<{
        id: string;
        groups?: Array<{ id: string; productIds: string[] }>;
      }>;
    };
  };
}

function approvedExperienceReview() {
  return {
    experienceReview: {
      status: "review-recommended",
      recommendation: "recommend-approval",
    },
    reviewPackage: {
      status: "review-ready",
      digest: "sha256:review",
    },
  };
}

describe("Topic Generator offline export", () => {
  it("renders a usable topic brief with evidence and blocking diagnostics", async () => {
    const plan = buildTopicPagePlanMatrix(snapshot, "selection").zh.relevance;
    const renderer = createTopicGeneratorOfflineRenderer();
    const html = await renderer.render(request("topic-brief.html", {
      "topic-intent": {
        analysis: { intent: plan.intent, snapshot },
      },
      "background-evidence": {
        backgroundEvidence: {
          status: "partial",
          language: "zh",
          themeIntentDigest: "sha256:intent",
          digest: "sha256:background",
          sources: [{
            id: "source-1",
            type: "authoritative-cultural",
            title: "Tea reference",
            url: "https://example.com/tea",
            publisher: "Example Institute",
          }],
          claims: [{
            id: "claim-1",
            type: "identity",
            text: "Matcha is a powdered tea.",
            sourceIds: ["source-1"],
            usage: "context-only",
          }],
          issues: ["An official primary source is still required."],
        },
      },
    } as never));

    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<meta name="topic-generator-brief-format" content="2">');
    expect(html).toContain("Yami catalog categories");
    expect(html).toContain("Suggested shopping scenarios");
    expect(html).toContain("Workbench language</dt><dd>zh");
    expect(html).toContain("Copy preview languages</dt><dd>English (en), Chinese (zh)");
    expect(html).toContain("Output page language</dt><dd>English (en)");
    expect(html).toContain("background evidence only");
    expect(html).toContain('"outputPageLanguage":"en"');
    expect(html).toContain('"pageDigest":null');
    expect(html).toContain('"topicIntentDigest":"sha256:intent"');
    expect(html).toContain('"backgroundEvidenceDigest":"sha256:background"');
    expect(html).toContain("Tea reference");
    expect(html).toContain("Matcha is a powdered tea.");
    expect(html).toContain("An official primary source is still required.");
    expect(html).toContain("topic-generator-delivery-manifest/v1");
  });

  it("keeps draft product media remote and emits no internal runtime URLs", async () => {
    const plans = buildTopicPagePlanMatrix(snapshot, "selection");
    const renderer = createTopicGeneratorOfflineRenderer();
    const html = await renderer.render(request("page-draft.html", {
      "product-selection": {
        executionPlan: { pageTypeRef: "landing-page/topic@2" },
        selection: { strategyRef: "relevance/intent-themes@5" },
        plans,
      },
      "module-merchandising": {
        plan: { digest: "sha256:page-plan" },
        plans,
      },
    } as never));

    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("topic-generator-delivery-manifest/v1");
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('<meta name="topic-generator-offline-format" content="5">');
    expect(html).toContain('"showChrome":true');
    expect(html).not.toContain(
      '[data-offline-page] [data-slot="topic-landing-global-header"]',
    );
    expect(html).toContain("https://media.example.com/matcha.webp");
    expect(html).toContain("data:image/svg+xml;base64,");
    expect(html).toContain("data:image/png;base64,");
    expect(html).toContain('id="topic-generator-offline-media"');
    expect(html).toContain(
      '<script id="topic-generator-offline-media" type="application/json">[]</script>',
    );
    expect(html).not.toMatch(/new URL\(["']\.\.\/\.\.\/assets\//);
    expect(html).not.toMatch(/new URL\(["']\.\/assets\//);
    expect(html).not.toMatch(/localhost|127\.0\.0\.1|\/_next|\/api\/topic-generator/i);
  });

  it("compacts a large draft to products reachable in the offline preview", async () => {
    const products = Array.from({ length: 160 }, (_, index) => ({
      id: `matcha-${index + 1}`,
      title: `Matcha ${index + 1}`,
      brand: "Yami",
      price: "$12.99",
      imageUrl: `https://media.example.com/matcha-${index + 1}.webp`,
      productUrl: `https://www.yamibuy.com/en/p/matcha-${index + 1}`,
      sourceRank: index + 1,
    }));
    const plans = buildTopicPagePlanMatrix({ ...snapshot, products }, "selection");
    const renderer = createTopicGeneratorOfflineRenderer();

    const html = await renderer.render(request("page-draft.html", {
      "product-selection": {
        executionPlan: { pageTypeRef: "landing-page/topic@2" },
        selection: { strategyRef: "relevance/intent-themes@5" },
        plans,
      },
      "module-merchandising": {
        plan: { digest: "sha256:page-plan" },
        plans,
      },
    } as never));

    expect(html).toContain("https://media.example.com/matcha-1.webp");
    expect(html).not.toContain('"id":"matcha-160"');
  });

  it("keeps one representative from every shortcut group when compacting a draft", async () => {
    const products = Array.from({ length: 64 }, (_, index) => ({
      id: `matcha-${index + 1}`,
      title: `Matcha ${index + 1}`,
      brand: "Yami",
      price: "$12.99",
      imageUrl: `https://media.example.com/matcha-${index + 1}.webp`,
      productUrl: `https://www.yamibuy.com/en/p/matcha-${index + 1}`,
      sourceRank: index + 1,
    }));
    const plans = buildTopicPagePlanMatrix({ ...snapshot, products }, "selection");
    const shortcuts = plans.en.relevance.modules.find(({ id }) => id === "shortcuts");
    if (!shortcuts) throw new Error("Shortcut module is missing from the fixture.");
    const planProductIds = plans.en.relevance.products.map(({ id }) => id);
    shortcuts.groups = Array.from({ length: 8 }, (_, index) => ({
      id: `category-${index + 1}`,
      label: `Category ${index + 1}`,
      role: "core",
      productIds: Array.from(
        { length: 8 },
        (_, offset) => planProductIds[(index + offset) % planProductIds.length]!,
      ),
    }));
    shortcuts.productIds = planProductIds.slice(0, 8);
    const renderer = createTopicGeneratorOfflineRenderer();

    const html = await renderer.render(request("page-draft.html", {
      "product-selection": {
        executionPlan: { pageTypeRef: "landing-page/topic@2" },
        selection: { strategyRef: "relevance/intent-themes@5" },
        plans,
      },
      "module-merchandising": {
        plan: { digest: "sha256:page-plan" },
        plans,
      },
    } as never));
    const payload = offlinePayload(html);
    const exportedShortcuts = payload.plan?.modules.find(({ id }) => id === "shortcuts");

    expect(exportedShortcuts?.groups).toHaveLength(8);
    expect(exportedShortcuts?.groups?.map(({ id }) => id)).toEqual(
      Array.from({ length: 8 }, (_, index) => `category-${index + 1}`),
    );
    expect(exportedShortcuts?.groups?.every(({ productIds }) => productIds.length === 1))
      .toBe(true);
  });

  it("uses a neutral warning placeholder for an unsafe product media URL", async () => {
    const plans = buildTopicPagePlanMatrix({
      ...snapshot,
      products: [{ ...snapshot.products[0]!, imageUrl: "javascript:alert(1)" }],
    }, "selection");
    const renderer = createTopicGeneratorOfflineRenderer();
    const html = await renderer.render(request("page-draft.html", {
      "product-selection": {
        executionPlan: { pageTypeRef: "landing-page/topic@2" },
        selection: { strategyRef: "relevance/intent-themes@5" },
        plans,
      },
      "module-merchandising": {
        plan: { digest: "sha256:page-plan" },
        plans,
      },
    } as never));

    expect(html).toContain("Image unavailable for Matcha powder");
    expect(html).toContain("data:image/svg+xml");
    expect(html).not.toContain("javascript:alert(1)");
  });

  it("renders the latest generated page as the downloadable preview before QA", async () => {
    const plans = buildTopicPagePlanMatrix(snapshot, "selection");
    const renderer = createTopicGeneratorOfflineRenderer();
    const generationSpec = {
      schemaVersion: "topic-page-generation-spec/v1",
      status: "generation-ready",
      keyword: "Matcha",
      site: "us",
      language: "en",
      strategyRef: "relevance/intent-themes@5",
      templateRef: "topic-landing/topic@2",
      bindings: {},
      moduleOrder: ["hero"],
      modules: [{
        id: "hero",
        products: [],
        assets: [{ ref: "hero.webp", mimeType: "image/webp" }],
      }],
      digest: "sha256:latest-preview",
    };
    const html = await renderer.render(request("page-draft.html", {
      "product-selection": {
        executionPlan: { pageTypeRef: "landing-page/topic@2" },
        selection: { strategyRef: "relevance/intent-themes@5" },
        plans,
      },
      "module-merchandising": {
        plan: { digest: "sha256:page-plan" },
        plans,
      },
      "page-generation": { generationSpec },
      "visual-generation": {
        assetBodies: [{
          ref: "hero.webp",
          mimeType: "image/webp",
          dataBase64: "AQID",
        }],
      },
    } as never));

    expect(html).toContain("Matcha · Preview");
    expect(html).toContain('"mode":"generated"');
    expect(html).toContain("sha256:latest-preview");
    expect(html).toContain("data:image/webp;base64,AQID");
    expect(html).toContain("topic-generator-media://0");
    expect(html).not.toContain('"mode":"selection"');
  });

  it("renders approved content in the downloadable preview before images are generated", async () => {
    const plans = buildTopicPagePlanMatrix(snapshot, "selection");
    const renderer = createTopicGeneratorOfflineRenderer();
    const contentSpec = {
      language: "en",
      digest: "sha256:latest-content",
      tasks: [{
        moduleId: "hero",
        copy: {
          title: { text: "Latest approved preview copy", evidenceRefs: [] },
        },
      }],
    };
    const generationSpec = {
      schemaVersion: "topic-page-generation-spec/v1",
      status: "generation-ready",
      keyword: "Matcha",
      site: "us",
      language: "zh",
      strategyRef: "relevance/intent-themes@5",
      templateRef: "topic-landing/topic@2",
      bindings: {},
      moduleOrder: [],
      modules: [],
      digest: "sha256:retained-visuals",
    };
    const html = await renderer.render(request("page-draft.html", {
      "product-selection": {
        executionPlan: { pageTypeRef: "landing-page/topic@2" },
        selection: { strategyRef: "relevance/intent-themes@5" },
        plans,
      },
      "module-merchandising": {
        plan: { digest: "sha256:page-plan" },
        plans,
      },
      "content-review": {
        contentSpec: { ...contentSpec, language: "zh", digest: "sha256:zh-content" },
        contentByLanguage: { en: { contentSpec } },
      },
      "page-generation": { generationSpec },
      "visual-generation": { assetBodies: [] },
    } as never));

    expect(html).toContain('<html lang="en"');
    expect(html).toContain("Matcha · Preview");
    expect(html).toContain('"mode":"content"');
    expect(html).toContain("Latest approved preview copy");
    expect(html).toContain('"retainedVisualSpec"');
    expect(html).toContain("sha256:retained-visuals");
    expect(html).not.toContain("sha256:zh-content");
    expect(html).not.toContain('"mode":"selection"');
  });

  it("refuses a final page when a visible generated asset cannot be inlined", async () => {
    const renderer = createTopicGeneratorOfflineRenderer();
    const generationSpec = {
      schemaVersion: "topic-page-generation-spec/v1",
      status: "generation-ready",
      keyword: "Matcha",
      site: "us",
      language: "zh",
      strategyRef: "relevance/intent-themes@5",
      templateRef: "topic-landing/topic@2",
      bindings: {},
      moduleOrder: ["hero"],
      modules: [{
        id: "hero",
        products: [],
        assets: [{ ref: "hero.webp", mimeType: "image/webp" }],
      }],
      digest: "sha256:generation",
    };
    await expect(renderer.render(request("page-final.html", {
      "product-selection": { executionPlan: { pageTypeRef: "landing-page/topic@2" } },
      "page-generation": { generationSpec },
      "automatic-qa": { qaReport: { status: "passed", digest: "sha256:qa" } },
      "experience-review": approvedExperienceReview(),
      "visual-generation": { assetBodies: [] },
    } as never))).rejects.toThrow("Final media is missing for hero.webp");
  });

  it("records automatic completion instead of a human approval in the final page", async () => {
    const renderer = createTopicGeneratorOfflineRenderer();
    const generationSpec = {
      schemaVersion: "topic-page-generation-spec/v1",
      status: "generation-ready",
      keyword: "Matcha",
      site: "us",
      language: "zh",
      strategyRef: "relevance/intent-themes@5",
      templateRef: "topic-landing/topic@2",
      bindings: {},
      moduleOrder: [],
      modules: [],
      digest: "sha256:generation",
    };
    const html = await renderer.render(request("page-final.html", {
      "product-selection": { executionPlan: { pageTypeRef: "landing-page/topic@2" } },
      "page-generation": { generationSpec },
      "automatic-qa": { qaReport: { status: "passed", digest: "sha256:qa" } },
      "experience-review": approvedExperienceReview(),
      "visual-generation": { assetBodies: [] },
    } as never));

    expect(html).toContain("sha256:qa");
    expect(html).toContain("sha256:review");
    expect(html).toContain('"completion":{"mode":"automatic"');
    expect(html).toContain('"approval":null');
    expect(html).not.toContain('"decision":"approved"');
    expect(html).not.toMatch(/localhost|127\.0\.0\.1|\/_next|\/api\/topic-generator/i);
  });

  it("finalizes a hard-QA-checked page when experience review is unavailable", async () => {
    const renderer = createTopicGeneratorOfflineRenderer();
    const generationSpec = {
      schemaVersion: "topic-page-generation-spec/v1",
      status: "generation-ready",
      keyword: "Matcha",
      site: "us",
      language: "zh",
      strategyRef: "relevance/intent-themes@5",
      templateRef: "topic-landing/topic@2",
      bindings: {},
      moduleOrder: [],
      modules: [],
      digest: "sha256:generation",
    };
    const html = await renderer.render(request("page-final.html", {
      "product-selection": { executionPlan: { pageTypeRef: "landing-page/topic@2" } },
      "page-generation": { generationSpec },
      "automatic-qa": {
        qaReport: { status: "passed", digest: "sha256:qa", checks: [], issues: [] },
      },
      "experience-review": {
        reviewAdvisoryIssues: [
          "Experience review was unavailable; hard QA remains authoritative.",
        ],
      },
      "visual-generation": { assetBodies: [] },
    } as never));

    expect(html).toContain('"completion":{"mode":"automatic"');
    expect(html).toContain('"reviewPackageDigest":null');
  });

  it("keeps only the remote Explore products reachable in the capped preview", async () => {
    const renderer = createTopicGeneratorOfflineRenderer();
    const products = Array.from({ length: 130 }, (_, index) => ({
      id: `matcha-${index + 1}`,
      title: `Matcha ${index + 1}`,
      brand: "Yami",
      price: "$12.99",
      imageUrl: `https://media.example.com/matcha-${index + 1}.webp`,
      productUrl: `https://www.yamibuy.com/en/p/matcha-${index + 1}`,
      sourceRank: index + 1,
      pool: "primary",
      role: "core",
    }));
    const generationSpec = {
      schemaVersion: "topic-page-generation-spec/v1",
      status: "generation-ready",
      keyword: "Matcha",
      site: "us",
      language: "zh",
      strategyRef: "relevance/intent-themes@5",
      templateRef: "topic-landing/topic@2",
      bindings: {},
      moduleOrder: ["explore-more"],
      modules: [{
        id: "explore-more",
        products,
        groups: [{
          id: "more-matcha",
          label: "更多抹茶",
          productIds: products.map(({ id }) => id),
        }],
        assets: [],
      }],
      digest: "sha256:generation",
    };
    const html = await renderer.render(request("page-final.html", {
      "product-selection": { executionPlan: { pageTypeRef: "landing-page/topic@2" } },
      "page-generation": { generationSpec },
      "automatic-qa": { qaReport: { status: "passed", digest: "sha256:qa" } },
      "experience-review": approvedExperienceReview(),
      "visual-generation": { assetBodies: [] },
    } as never));

    expect(html).toContain("https://media.example.com/matcha-36.webp");
    expect(html).not.toContain("https://media.example.com/matcha-37.webp");
  });
});
