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
        analysis: { intent: plan.intent },
      },
      "background-evidence": {
        backgroundEvidence: {
          status: "partial",
          themeIntentDigest: "sha256:intent",
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

    expect(html).toContain('<html lang="zh">');
    expect(html).toContain("Tea reference");
    expect(html).toContain("Matcha is a powdered tea.");
    expect(html).toContain("An official primary source is still required.");
    expect(html).toContain("topic-generator-delivery-manifest/v1");
  });

  it("inlines draft product media and emits no internal runtime URLs", async () => {
    const plans = buildTopicPagePlanMatrix(snapshot, "selection");
    const renderer = createTopicGeneratorOfflineRenderer({
      fetch: vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "image/webp" },
      })),
    });
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
    expect(html).toContain("data:image/webp;base64,AQID");
    expect(html).not.toContain("https://media.example.com/matcha.webp");
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
    const fetchMedia = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "content-type": "image/webp" },
    }));
    const renderer = createTopicGeneratorOfflineRenderer({ fetch: fetchMedia });

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

    expect(fetchMedia.mock.calls.length).toBeLessThanOrEqual(128);
    expect(html).not.toContain("Image unavailable for");
    expect(html).not.toContain('"id":"matcha-160"');
  });

  it("uses a neutral warning placeholder when draft product media is unavailable", async () => {
    const plans = buildTopicPagePlanMatrix(snapshot, "selection");
    const renderer = createTopicGeneratorOfflineRenderer({
      fetch: vi.fn(async () => new Response(null, { status: 404 })),
    });
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
    expect(html).not.toContain("https://media.example.com/matcha.webp");
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

  it("embeds QA and approval summaries in an approved final page", async () => {
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
    expect(html).toContain('"decision":"approved"');
    expect(html).not.toMatch(/localhost|127\.0\.0\.1|\/_next|\/api\/topic-generator/i);
  });

  it("inlines only the Explore products reachable in the capped offline view", async () => {
    const fetchMedia = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "content-type": "image/webp" },
    }));
    const renderer = createTopicGeneratorOfflineRenderer({ fetch: fetchMedia });
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

    expect(fetchMedia).toHaveBeenCalledTimes(12);
    expect(html).not.toContain("https://media.example.com/matcha-13.webp");
  });
});
