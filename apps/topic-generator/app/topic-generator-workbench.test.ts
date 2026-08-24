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

  it("renders current copy with retained visuals from the previous page version", () => {
    const plan = {
      generationMode: "selection",
      keyword: "ANUA",
      site: "us",
      language: "zh",
      content: {
        eyebrow: "",
        headline: "",
        description: "",
        tags: [],
        copyMode: "not-generated",
      },
      selectedCategories: [],
      products: [{
        id: "1",
        title: "ANUA Cleanser",
        brand: "ANUA",
        price: "$12.00",
        imageUrl: "/products/1.webp",
        productUrl: "/products/1",
        sourceRank: 1,
      }],
      modules: [{
        id: "hero",
        label: "Hero",
        heading: "",
        description: "",
        required: true,
        visible: true,
        productIds: ["1"],
        reason: "Hero product",
      }, {
        id: "shortcuts",
        label: "Shortcuts",
        heading: "",
        description: "",
        required: true,
        visible: true,
        productIds: ["1"],
        groups: [{ id: "cleanser", label: "清洁", role: "core", productIds: ["1"] }],
        reason: "Shortcut product",
      }, {
        id: "start-here",
        label: "Start here",
        heading: "",
        description: "",
        required: true,
        visible: true,
        productIds: ["1"],
        groups: [{ id: "daily", label: "日常护理", role: "core", productIds: ["1"] }],
        reason: "Daily scene",
      }],
      generatedAt: "2026-08-24T01:00:00.000Z",
    } as unknown as Extract<TopicPagePreviewRendererProps, { mode: "selection" }>["plan"];
    const contentSpec = {
      tasks: [{
        moduleId: "hero",
        copy: {
          title: { text: "ANUA 温和有效的韩系护肤", evidenceRefs: [] },
          description: { text: "这是重新生成的文案。", evidenceRefs: [] },
        },
      }, {
        moduleId: "shortcuts",
        copy: {
          title: { text: "按品类探索", evidenceRefs: [] },
          items: [{ label: { text: "温和清洁", evidenceRefs: [] } }],
        },
      }, {
        moduleId: "start-here",
        copy: {
          title: { text: "建立你的 ANUA 护理路径", evidenceRefs: [] },
          scenes: [{
            sceneId: "daily",
            label: { text: "每日基础", evidenceRefs: [] },
            title: { text: "搭好每日基础", evidenceRefs: [] },
            description: { text: "这是重新生成的主题专辑文案。", evidenceRefs: [] },
          }],
        },
      }],
    } as unknown as Extract<TopicPagePreviewRendererProps, { mode: "content" }>["contentSpec"];
    const retainedVisualSpec = {
      language: "zh",
      modules: [{
        id: "hero",
        assets: [{
          url: "/assets/retained-hero.webp",
          width: 1600,
          height: 900,
          focalPoint: { x: 0.5, y: 0.45 },
          backgroundColor: "#b69e7d",
          altText: { text: "ANUA 护肤场景" },
        }],
      }, {
        id: "shortcuts",
        assets: [{
          url: "/assets/retained-shortcut.webp",
          focalPoint: { x: 0.5, y: 0.5 },
          altText: null,
        }],
      }, {
        id: "start-here",
        scenes: [{ id: "daily" }],
        assets: [{
          url: "/assets/retained-daily.webp",
          focalPoint: { x: 0.25, y: 0.4 },
          backgroundColor: "#e8e1d5",
          altText: { text: "每日护理场景" },
        }],
      }],
      digest: "sha256:retained-visual",
    } as unknown as GenerationSpec;

    const props = contentPrototypeProps(
      "landing-page/topic@2",
      plan,
      contentSpec,
      retainedVisualSpec,
    );

    expect(props.hero).toMatchObject({
      title: "ANUA 温和有效的韩系护肤",
      description: "这是重新生成的文案。",
      image: { src: "/assets/retained-hero.webp" },
      backgroundImageSrc: "/assets/retained-hero.webp",
    });
    expect(props.shortcutRail.items[0]).toMatchObject({
      label: "温和清洁",
      iconSrc: "/assets/retained-shortcut.webp",
      imagePresentation: "full-bleed",
    });
    expect(props.standardRail?.themes?.[0]).toMatchObject({
      value: "daily",
      label: "每日基础",
      content: {
        title: "搭好每日基础",
        description: "这是重新生成的主题专辑文案。",
        image: {
          src: "/assets/retained-daily.webp",
          objectPosition: "25% 40%",
        },
      },
    });
    const markup = renderToStaticMarkup(createElement(RealTopicPagePreview, {
      mode: "content",
      pageTypeRef: "landing-page/topic@2",
      plan,
      contentSpec,
      retainedVisualSpec,
    }));
    expect(markup).toContain("ANUA 温和有效的韩系护肤");
    expect(markup).toContain("/assets/retained-hero.webp");
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

  it("links generated category shortcuts to the matching recommendation tab", () => {
    const generationSpec = {
      keyword: "ANUA",
      language: "en",
      modules: [{
        id: "shortcuts",
        copy: {
          title: { text: "Featured categories" },
          items: [{ label: { text: "Cleansers" } }, { label: { text: "Serums" } }],
        },
        products: ["1", "2"].map((id) => ({
          id,
          title: `ANUA ${id}`,
          brand: "ANUA",
          price: "$10.00",
          imageUrl: `/products/${id}.webp`,
          productUrl: `/products/${id}`,
        })),
        groups: [{ id: "cleansers", label: "Cleansers", productIds: ["1"] }, {
          id: "serums",
          label: "Serums",
          productIds: ["2"],
        }],
        assets: [
          { url: "/assets/generated-cleanser-lifestyle.webp" },
          { url: "/assets/generated-serum-lifestyle.webp" },
        ],
      }],
    } as unknown as GenerationSpec;

    const props = generatedPrototypeProps("landing-page/brand@2", generationSpec);

    expect(props.shortcutRail.items.map(({ href }) => href)).toEqual([
      "#explore-more-cleansers",
      "#explore-more-serums",
    ]);
    expect(props.shortcutRail.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        iconSrc: "/assets/generated-cleanser-lifestyle.webp",
        imagePresentation: "full-bleed",
      }),
      expect.objectContaining({
        iconSrc: "/assets/generated-serum-lifestyle.webp",
        imagePresentation: "full-bleed",
      }),
    ]));
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
          title: index < 2 ? "ANUA Heartleaf Cleanser" : `ANUA ${id}`,
          brand: "ANUA",
          price: "$10.00",
          imageUrl: index < 2 ? "https://cdn.example.com/shared.webp" : `/products/${id}.webp`,
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
      { value: "explore-more-all", label: "全部" },
      { value: "treatment", label: "护理" },
      { value: "all-treatments", label: "全部护理" },
    ]);
    expect(props.waterfall.productsByTab?.treatment.map(({ id }) => id)).toEqual(["2"]);
    expect(props.waterfall.defaultValue).toBe("explore-more-all");
    expect(props.waterfall.productsByTab?.["explore-more-all"]).toHaveLength(12);
    expect(props.waterfall.productsByTab?.["explore-more-all"].map(({ id }) => id))
      .not.toContain("2");
    expect(props.waterfall.productsByTab?.["explore-more-all"].map(({ id }) => id))
      .toContain("13");
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
      { value: "explore-more-all", label: "全部" },
      { value: "cleansers", label: "清洁" },
      { value: "treatments", label: "护理" },
    ]);
    expect(props.waterfall.productsByTab?.["explore-more-all"].map(({ id }) => id)).toEqual([
      "1",
      "2",
    ]);
    expect(props.waterfall.productsByTab?.treatments.map(({ id }) => id)).toEqual(["2", "1"]);
    expect(props.waterfall.defaultValue).toBe("explore-more-all");
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
        groups: [{
          id: "tea",
          label: "茶饮",
          role: "core",
          productIds: ["1"],
        }, {
          id: "snacks",
          label: "零食",
          role: "core",
          productIds: ["2"],
        }],
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
    expect(props.shortcutRail.items.map(({ href }) => href)).toEqual([
      "#explore-more-tea",
      "#explore-more-snacks",
    ]);
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
        copy: {
          title: { text: "Build Your Matcha Routine", evidenceRefs: [] },
          scenes: [{
            sceneId: "daily",
            label: { text: "Daily Routine", evidenceRefs: [] },
            title: { text: "Choose Your Daily Matcha", evidenceRefs: [] },
            description: {
              text: "Compare the selected matcha products for a daily routine.",
              evidenceRefs: [],
            },
          }],
        },
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
    expect(generatedCopyProps.standardRail).toMatchObject({
      title: "Build Your Matcha Routine",
      content: {
        title: "Choose Your Daily Matcha",
        description: "Compare the selected matcha products for a daily routine.",
      },
      themes: [{
        value: "daily",
        label: "Daily Routine",
        content: {
          title: "Choose Your Daily Matcha",
          description: "Compare the selected matcha products for a daily routine.",
        },
      }],
    });
    expect(generatedCopyProps.waterfall.description).toBeUndefined();
    expect(generatedCopyProps.primaryTabs.items.map(({ label }) => label)).toEqual([
      "生成后的精选分类",
      "Build Your Matcha Routine",
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
      { value: "explore-more-all", label: "全部" },
      { value: "matcha-tools", label: "Matcha Tools and More" },
    ]);
  });
});
