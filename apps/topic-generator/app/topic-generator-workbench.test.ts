import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { TopicPagePreviewRendererProps } from "@yami/topic-generator/web";

import {
  baseFixture,
  generatedPrototypeProps,
  RealTopicPagePreview,
} from "./topic-generator-workbench";

describe("Topic Generator Workbench preview", () => {
  it.each([
    "landing-page/brand@2",
    "landing-page/topic@2",
    "landing-page/campaign@2",
  ] as const)("renders the active %s page type", (pageTypeRef) => {
    expect(() => baseFixture(pageTypeRef, "zh")).not.toThrow();
  });

  it("passes a generated scene focal point to the ThemeProductList image", () => {
    const generationSpec = {
      schemaVersion: "topic-page-generation-spec/v1",
      status: "generation-ready",
      keyword: "Matcha",
      site: "us",
      language: "zh",
      strategyRef: "category-role/landing-page-agent@1",
      templateRef: "topic-landing/topic@2",
      bindings: {
        themeIntentDigest: "sha256:intent",
        productSelectionDigest: "sha256:selection",
        topicPagePlanDigest: "sha256:plan",
        topicPageContentSpecDigest: "sha256:content",
        topicPageAssetManifestDigest: "sha256:assets",
      },
      moduleOrder: ["start-here"],
      modules: [{
        id: "start-here",
        component: "ThemeProductList",
        shoppingGoal: "Build a daily ritual",
        reason: "The selected products form a scene.",
        copy: {
          title: { text: "从这里开始", evidenceRefs: ["scene:scene-1"] },
          scenes: [{
            sceneId: "scene-1",
            label: { text: "每日仪式", evidenceRefs: ["scene:scene-1"] },
            title: { text: "抹茶日常", evidenceRefs: ["scene:scene-1"] },
            description: { text: "从一杯抹茶开始。", evidenceRefs: ["scene:scene-1"] },
          }],
        },
        products: [],
        scenes: [{
          id: "scene-1",
          sourceSceneId: "source-scene-1",
          shoppingGoal: "Build a daily ritual",
          reason: "Catalog evidence supports the scene.",
          productIds: [],
        }],
        assets: [{
          taskId: "asset-start-here-scene-1",
          kind: "scene-image",
          ref: "assets/scene.webp",
          url: "/assets/scene.webp",
          mimeType: "image/webp",
          width: 1200,
          height: 1200,
          digest: `sha256:${"a".repeat(64)}`,
          focalPoint: { x: 0.25, y: 0.4 },
          backgroundColor: "#102030",
          altText: {
            language: "zh",
            text: "抹茶日常场景",
            evidenceRefs: ["scene:scene-1"],
          },
        }],
      }],
      digest: "sha256:generation",
    } satisfies TopicPagePreviewRendererProps["generationSpec"];

    const props = generatedPrototypeProps("landing-page/topic@2", generationSpec);

    expect(props.standardRail?.themes?.[0]?.content.image).toMatchObject({
      src: "/assets/scene.webp",
      objectPosition: "25% 40%",
    });
    expect(renderToStaticMarkup(createElement(RealTopicPagePreview, {
      pageTypeRef: "landing-page/topic@2",
      generationSpec,
    }))).toContain('data-generation-spec="sha256:generation"');
  });

  it("keeps internal shopping goals out of localized preview copy and marks generated hero media", () => {
    const generationSpec = {
      schemaVersion: "topic-page-generation-spec/v1",
      status: "generation-ready",
      keyword: "ANUA",
      site: "us",
      language: "zh",
      strategyRef: "relevance/intent-themes@3",
      templateRef: "topic-landing/brand-relevance@1",
      bindings: {
        themeIntentDigest: "sha256:intent",
        productSelectionDigest: "sha256:selection",
        topicPagePlanDigest: "sha256:plan",
        topicPageContentSpecDigest: "sha256:content",
        topicPageAssetManifestDigest: "sha256:assets",
      },
      moduleOrder: ["hero", "start-here"],
      modules: [{
        id: "hero",
        component: "ThemeHero",
        shoppingGoal: "Internal English hero goal",
        reason: "Internal merchandising rationale.",
        copy: {
          title: { text: "探索 ANUA", evidenceRefs: ["product:1"] },
          tags: [{ text: "洁面", evidenceRefs: ["product:1"] }],
        },
        products: [],
        scenes: [],
        assets: [{
          taskId: "asset-hero",
          kind: "hero-image",
          ref: "assets/hero.webp",
          url: "/assets/hero.webp",
          mimeType: "image/webp",
          width: 1200,
          height: 675,
          digest: `sha256:${"a".repeat(64)}`,
          focalPoint: { x: 0.5, y: 0.5 },
          backgroundColor: "#f4f3ef",
          altText: {
            language: "zh",
            text: "ANUA 商品组合",
            evidenceRefs: ["product:1"],
          },
        }],
      }, {
        id: "start-here",
        component: "ThemeProductList",
        shoppingGoal: "Help shoppers compare products across a basic ANUA routine",
        reason: "Internal merchandising rationale.",
        copy: {
          title: { text: "从基础护肤开始", evidenceRefs: ["product:1"] },
          scenes: [],
        },
        products: [],
        scenes: [],
        assets: [],
      }],
      digest: "sha256:generation",
    } satisfies TopicPagePreviewRendererProps["generationSpec"];
    const localizedBase = baseFixture("landing-page/brand@2", "zh");

    const props = generatedPrototypeProps("landing-page/brand@2", generationSpec);

    expect(props.hero.description).toEqual(localizedBase.hero.description);
    expect(props.hero.className).toBeTruthy();
    expect(props.standardRail?.content.description).toEqual(
      localizedBase.standardRail?.content.description,
    );
  });
});
