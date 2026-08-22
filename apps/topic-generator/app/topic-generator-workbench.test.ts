import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { TopicPagePreviewRendererProps } from "@yami/topic-generator/web";

import {
  baseFixture,
  contentPrototypeProps,
  generatedPrototypeProps,
  RealTopicPagePreview,
  selectionPrototypeProps,
} from "./topic-generator-workbench";

type GenerationSpec = Extract<
  TopicPagePreviewRendererProps,
  { mode: "generated" }
>["generationSpec"];

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
      moduleOrder: ["start-here", "brand-spotlight"],
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
      }, {
        id: "brand-spotlight",
        component: "BrandProductRail",
        shoppingGoal: "Compare Matcha brands",
        reason: "The selected products include multiple brands.",
        copy: {
          title: { text: "精选品牌", evidenceRefs: [] },
        },
        products: [],
        scenes: [],
        assets: [],
      }],
      digest: "sha256:generation",
    } satisfies GenerationSpec;

    const props = generatedPrototypeProps("landing-page/topic@2", generationSpec);

    expect(props.standardRail?.themes?.[0]?.content.image).toMatchObject({
      src: "/assets/scene.webp",
      objectPosition: "25% 40%",
    });
    expect(props.brandRail?.onAddToCart).toBeTypeOf("function");
    expect(renderToStaticMarkup(createElement(RealTopicPagePreview, {
      mode: "generated",
      pageTypeRef: "landing-page/topic@2",
      generationSpec,
    }))).toContain('data-generation-spec="sha256:generation"');
  });

  it("does not restore template descriptions when generated modules omit them", () => {
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
    } satisfies GenerationSpec;
    const props = generatedPrototypeProps("landing-page/brand@2", generationSpec);

    expect(props.hero.description).toBeUndefined();
    expect(props.hero.className).toBeTruthy();
    expect(props.standardRail?.content.description).toBeUndefined();
  });

  it("preserves generated Popular Picks and Explore More product groups as tabs", () => {
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
      moduleOrder: ["popular-picks", "explore-more"],
      modules: [{
        id: "popular-picks",
        component: "ProductList",
        shoppingGoal: "Surface popular products",
        reason: "Frozen selection groups",
        copy: { title: { text: "热门精选", evidenceRefs: ["product:1"] } },
        products: ["1", "2"].map((id, index) => ({
          id,
          title: `ANUA ${id}`,
          brand: "ANUA",
          price: "$10.00",
          imageUrl: `/products/${id}.webp`,
          productUrl: `/products/${id}`,
          sourceRank: index + 1,
          pool: "primary" as const,
          role: "core" as const,
        })),
        groups: [{ id: "all", label: "全部", productIds: ["1", "2"] }, {
          id: "cleanser",
          label: "清洁",
          productIds: ["1"],
        }],
        scenes: [],
        assets: [],
      }, {
        id: "explore-more",
        component: "ProductList",
        shoppingGoal: "Help shoppers explore",
        reason: "Frozen selection groups",
        copy: {
          title: { text: "综合推荐", evidenceRefs: ["product:2"] },
          description: { text: "按品类继续探索。", evidenceRefs: ["product:2"] },
        },
        products: Array.from({ length: 14 }, (_, index) => String(index + 1)).map((id, index) => ({
          id,
          title: `ANUA ${id}`,
          brand: "ANUA",
          price: "$10.00",
          imageUrl: `/products/${id}.webp`,
          productUrl: `/products/${id}`,
          sourceRank: index + 1,
          pool: "primary" as const,
          role: "core" as const,
        })),
        groups: [{ id: "treatment", label: "护理", productIds: ["2"] }, {
          id: "all-treatments",
          label: "全部护理",
          productIds: Array.from({ length: 14 }, (_, index) => String(index + 1)),
        }],
        scenes: [],
        assets: [],
      }],
      digest: "sha256:generation",
    } satisfies GenerationSpec;

    const props = generatedPrototypeProps("landing-page/brand@2", generationSpec);

    expect(props.productRail.tabs).toEqual([
      { value: "all", label: "全部" },
      { value: "cleanser", label: "清洁" },
    ]);
    expect(props.productRail.productsByTab?.cleanser.map(({ id }) => id)).toEqual(["1"]);
    expect(props.waterfall.tabs).toEqual([
      { value: "treatment", label: "护理" },
      { value: "all-treatments", label: "全部护理" },
    ]);
    expect(props.waterfall.productsByTab?.treatment.map(({ id }) => id)).toEqual(["2"]);
    expect(props.waterfall.defaultValue).toBe("all-treatments");
    expect(props.waterfall.productsByTab?.["all-treatments"]).toHaveLength(12);
  });

  it("fills the final page with selection products and marks ungenerated content as placeholders", () => {
    const plan = {
      generationMode: "selection",
      keyword: "Matcha",
      site: "us",
      language: "zh",
      content: {
        eyebrow: "Matcha",
        headline: "Matcha",
        description: "默认选品文案",
        tags: [],
        copyMode: "not-generated",
      },
      products: ["1", "2"].map((id, index) => ({
        id,
        title: `Matcha ${id}`,
        brand: "Matcha Brand",
        price: "$10.00",
        imageUrl: `/products/${id}.webp`,
        productUrl: `/products/${id}`,
        sourceRank: index + 1,
      })),
      modules: [{
        id: "hero",
        label: "Hero",
        heading: "Matcha",
        description: "默认选品文案",
        required: true,
        visible: true,
        productIds: ["1"],
        reason: "Reviewed hero selection.",
      }, {
        id: "popular-picks",
        label: "热门精选",
        heading: "热门精选",
        description: "默认热门文案",
        required: true,
        visible: true,
        productIds: ["2", "1"],
        groups: [{
          id: "popular-picks-all",
          label: "全部",
          role: "core",
          productIds: ["2", "1"],
        }, {
          id: "cleansers",
          label: "清洁",
          role: "core",
          productIds: ["1"],
        }],
        reason: "Reviewed product order.",
      }, {
        id: "reviews",
        label: "顾客评价",
        heading: "顾客评价",
        description: "默认评价文案",
        required: false,
        visible: true,
        productIds: ["1"],
        reason: "Reviewed review product.",
      }, {
        id: "explore-more",
        label: "综合推荐",
        heading: "综合推荐",
        description: "默认综合推荐文案",
        required: true,
        visible: true,
        productIds: ["1", "2"],
        groups: [{
          id: "cleansers",
          label: "清洁",
          role: "core",
          productIds: ["1"],
        }, {
          id: "treatments",
          label: "护理",
          role: "core",
          productIds: ["2", "1"],
        }],
        reason: "Reviewed recommendation groups.",
      }],
      generatedAt: "2026-08-21T00:00:00.000Z",
    } as unknown as Extract<TopicPagePreviewRendererProps, { mode: "selection" }>["plan"];

    const props = selectionPrototypeProps("landing-page/topic@2", plan);
    expect(props.hero.title).toBe("Matcha");
    expect(props.hero.description).toBe("默认选品文案");
    expect(props.productRail.products.map(({ id }) => id)).toEqual(["2", "1"]);
    expect(props.productRail.tabs).toEqual([
      { value: "popular-picks-all", label: "全部" },
      { value: "cleansers", label: "清洁" },
    ]);
    expect(props.productRail.productsByTab?.cleansers.map(({ id }) => id)).toEqual(["1"]);
    expect(props.waterfall.tabs).toEqual([
      { value: "cleansers", label: "清洁" },
      { value: "treatments", label: "护理" },
    ]);
    expect(props.waterfall.productsByTab?.treatments.map(({ id }) => id)).toEqual(["2", "1"]);
    expect(props.waterfall.defaultValue).toBe("treatments");
    expect(props.reviewList).toBeUndefined();
    expect(props.hiddenModules).toContain("reviews");
    const markup = renderToStaticMarkup(createElement(RealTopicPagePreview, {
      mode: "selection",
      pageTypeRef: "landing-page/topic@2",
      plan,
    }));
    expect(markup).toContain('data-page-preview-state="selection"');
    expect(markup).not.toContain("图片待生成");
  });

  it("uses one neutral default copy set before generated copy is available", () => {
    const plan = {
      generationMode: "selection",
      keyword: "Matcha",
      site: "us",
      language: "zh",
      content: {
        eyebrow: "",
        headline: "",
        description: "",
        tags: [],
        copyMode: "not-generated",
      },
      selectedCategories: [{ id: "tea", label: "茶饮", path: ["茶饮"] }, {
        id: "snacks",
        label: "零食",
        path: ["零食"],
      }],
      products: ["1", "2"].map((id, index) => ({
        id,
        title: `Matcha ${id}`,
        brand: index === 0 ? "Brand A" : "Brand B",
        price: "$10.00",
        imageUrl: `/products/${id}.webp`,
        productUrl: `/products/${id}`,
        sourceRank: index + 1,
      })),
      modules: [{
        id: "hero",
        label: "Hero",
        heading: "",
        description: "",
        required: true,
        visible: true,
        productIds: ["1"],
        reason: "Reviewed hero selection.",
      }, {
        id: "shortcuts",
        label: "Shortcuts",
        heading: "",
        description: "",
        required: true,
        visible: true,
        productIds: ["1", "2"],
        reason: "Reviewed category shortcuts.",
      }, {
        id: "start-here",
        label: "Start here",
        heading: "",
        description: "",
        required: true,
        visible: true,
        productIds: ["1", "2"],
        groups: [{
          id: "daily",
          label: "日常选择",
          role: "core",
          productIds: ["1", "2"],
        }],
        reason: "Reviewed shopping scene.",
      }, {
        id: "popular-picks",
        label: "Popular picks",
        heading: "",
        description: "",
        required: true,
        visible: true,
        productIds: ["1", "2"],
        groups: [{
          id: "pure-matcha",
          label: "纯抹茶与茶道用粉",
          role: "core",
          productIds: ["1", "2"],
        }],
        reason: "Reviewed popular products.",
      }, {
        id: "brand-spotlight",
        label: "Brands",
        heading: "",
        description: "",
        required: false,
        visible: true,
        productIds: ["1", "2"],
        groups: [{
          id: "brand-a",
          label: "Brand A",
          role: "core",
          productIds: ["1"],
        }, {
          id: "brand-b",
          label: "Brand B",
          role: "core",
          productIds: ["2"],
        }],
        reason: "Multiple brands are available.",
      }, {
        id: "explore-more",
        label: "Explore more",
        heading: "",
        description: "",
        required: true,
        visible: true,
        productIds: ["1", "2"],
        groups: [{
          id: "matcha-tools",
          label: "抹茶器具、食品与功能饮品",
          role: "core",
          productIds: ["1", "2"],
        }],
        reason: "Reviewed product order.",
      }],
      generatedAt: "2026-08-21T00:00:00.000Z",
    } as unknown as Extract<TopicPagePreviewRendererProps, { mode: "selection" }>["plan"];

    const props = selectionPrototypeProps("landing-page/topic@2", plan);

    expect(props.hero.title).toBe("浏览 Matcha 商品");
    expect(props.hero.description).toBe(
      "查看本次选中的 Matcha 商品，并按品类和选购场景继续浏览。",
    );
    expect(props.hero.tags).toEqual(["茶饮", "零食"]);
    expect(props.shortcutRail.title).toBe("按品类浏览 Matcha");
    expect(props.standardRail?.title).toBe("按选购场景开始浏览");
    expect(props.standardRail?.content.title).toBe("日常选择");
    expect(props.standardRail?.content.description).toBe(
      "查看这一场景下已选的 Matcha 商品。",
    );
    expect(props.productRail.title).toBe("Matcha 精选商品");
    expect(props.brandRail?.title).toBe("按品牌浏览");
    expect(props.brandRail?.onAddToCart).toBeTypeOf("function");
    expect(props.waterfall.title).toBe("继续浏览 Matcha 商品");
    expect(props.waterfall.description).toBe("按更多品类查看本次选中的商品。");

    const contentSpec = {
      tasks: [{
        moduleId: "hero",
        copy: { title: { text: "生成后的 Hero", evidenceRefs: [] } },
      }, {
        moduleId: "shortcuts",
        copy: { title: { text: "生成后的精选分类", evidenceRefs: [] }, items: [] },
      }, {
        moduleId: "start-here",
        copy: { title: { text: "生成后的场景模块", evidenceRefs: [] }, scenes: [] },
      }, {
        moduleId: "popular-picks",
        copy: {
          title: { text: "生成后的热门精选", evidenceRefs: [] },
          groups: [{
            groupId: "pure-matcha",
            label: { text: "Pure Matcha Powder", evidenceRefs: [] },
          }],
        },
      }, {
        moduleId: "brand-spotlight",
        copy: { title: { text: "生成后的精选品牌", evidenceRefs: [] } },
      }, {
        moduleId: "explore-more",
        copy: {
          title: { text: "生成后的更多商品", evidenceRefs: [] },
          groups: [{
            groupId: "matcha-tools",
            label: { text: "Matcha Tools and More", evidenceRefs: [] },
          }],
        },
      }],
    } as unknown as Extract<TopicPagePreviewRendererProps, { mode: "content" }>["contentSpec"];
    const generatedCopyProps = contentPrototypeProps(
      "landing-page/topic@2",
      plan,
      contentSpec,
    );
    expect(generatedCopyProps.hero.description).toBeUndefined();
    expect(generatedCopyProps.standardRail?.content.description).toBeUndefined();
    expect(generatedCopyProps.waterfall.description).toBeUndefined();
    expect(generatedCopyProps.primaryTabs.items.map(({ label }) => label)).toEqual([
      "生成后的精选分类",
      "生成后的场景模块",
      "生成后的热门精选",
      "生成后的精选品牌",
      "生成后的更多商品",
    ]);
    expect(generatedCopyProps.primaryTabs.items.map(({ targetId }) => targetId)).toEqual([
      "explore",
      "shop",
      "popular-picks",
      "brand-spotlight",
      "product-list",
    ]);
    expect(generatedCopyProps.productRail.tabs).toEqual([
      { value: "pure-matcha", label: "Pure Matcha Powder" },
    ]);
    expect(generatedCopyProps.waterfall.tabs).toEqual([
      { value: "matcha-tools", label: "Matcha Tools and More" },
    ]);
  });
});
