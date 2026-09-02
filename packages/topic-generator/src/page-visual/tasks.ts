import type { ThemeIntent } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type {
  TopicPagePlanModuleV2,
  TopicPagePlanV2,
} from "../page-merchandising/contracts.js";
import type { TopicPageContentSpec } from "../page-content/contracts.js";
import type {
  TopicPageVisualAltTextMode,
  TopicPageVisualAspectRatio,
  TopicPageVisualAssetKind,
  TopicPageVisualCompositionGuidance,
  TopicPageVisualSceneBrief,
  TopicPageVisualTaskContext,
} from "./contracts.js";

interface VisualRule {
  kind: TopicPageVisualAssetKind;
  targetAspectRatio: TopicPageVisualAspectRatio;
  minimumWidth: number;
  minimumHeight: number;
  altTextMode: TopicPageVisualAltTextMode;
  requiresBackgroundColor: boolean;
  compositionGuidance?: TopicPageVisualCompositionGuidance;
}

const RULES = {
  hero: {
    kind: "hero-image",
    targetAspectRatio: "16:9",
    minimumWidth: 1200,
    minimumHeight: 675,
    altTextMode: "required",
    requiresBackgroundColor: true,
  },
  shortcut: {
    kind: "shortcut-image",
    targetAspectRatio: "1:1",
    minimumWidth: 512,
    minimumHeight: 512,
    altTextMode: "decorative",
    requiresBackgroundColor: false,
  },
  scene: {
    kind: "scene-image",
    targetAspectRatio: "1:1",
    minimumWidth: 1024,
    minimumHeight: 1024,
    altTextMode: "required",
    requiresBackgroundColor: true,
    compositionGuidance: {
      preferredSubjectArea: "upper-three-quarters",
      lowerAreaUsage: "low-contrast-decoration-preferred",
    },
  },
  brand: {
    kind: "brand-banner",
    targetAspectRatio: "111:40",
    minimumWidth: 888,
    minimumHeight: 320,
    altTextMode: "required",
    requiresBackgroundColor: false,
  },
} as const satisfies Record<string, VisualRule>;

const SCENE_FIRST_REQUIREMENTS = [
  "Depict a coherent, naturalistic scene that expresses this module's shopping goal.",
  "Treat assigned products as visual references only; they do not need to appear.",
  "Do not use isolated product packshots, tiled product grids, or product montages as the primary visual.",
  "Environmental vessels and category-relevant containers may appear when they support the scene.",
  "Do not generate or alter packaging, labels, logos, or product claims.",
] as const;

const SCENE_IMAGE_REQUIREMENTS = [
  "Depict a coherent, naturalistic scene that expresses this module's shopping goal.",
  "Use products assigned to the current scene as visual references for regenerating one complete lifestyle image.",
  "Products are optional; a product-free scene is valid.",
  "For every referenced product that appears, reproduce the source packaging as faithfully as the image model allows, including visible brand name and logo, key label text, typography hierarchy, layout, primary colors, silhouette, closure, and material character.",
  "Never simplify a referenced product into blank or generic packaging; copy only packaging text visible in the reference and do not invent claims.",
  "Do not require an exact product count or one-to-one coverage; packaging fidelity is a strong generation priority rather than a rejection gate.",
  "Do not copy source-image backdrops, swatches, discs, badges, white canvases, or studio props into the scene.",
  "Do not use isolated product packshots, tiled product grids, or product montages as the primary visual.",
  "Keep the scene and activity primary, and do not introduce products assigned to another scene.",
  "Keep the key action in the upper-right area, preserve it in centered wide and card crops, and reserve a quiet lower-left copy-safe area.",
  "Do not bake text, a gradient, a text panel, or a scrim into the image.",
] as const;

const BRAND_BANNER_REQUIREMENTS = [
  "Treat each non-empty brand binding as an independent wide brand-expression task; never borrow products or brand identity from another brand.",
  "Use up to three available product images assigned to the current brand as optional visual references.",
  "Product packaging and logos are permitted but optional; do not require either unless the task explicitly makes it required.",
  "Reference availability does not require reference visibility; product-led, logo-led, and atmosphere-led banners are all valid when supported by the brief.",
  "For every referenced product or package that appears, reproduce the visible brand name and logo, key label text, typography hierarchy, layout, primary colors, silhouette, closure, and material as faithfully as the image model allows.",
  "Do not invent, redraw, restyle, merge, translate, complete, or substitute a logo, wordmark, package design, label, brand mark, or marketing claim.",
  "Do not force packaging or a logo into the image merely because a reference is available; their absence is not a defect unless the task makes them required.",
  "When no referenced brand asset appears, keep the scene category-relevant and do not infer a distinct visual identity from the brand name or product mix alone.",
  "Compose any visible product, packaging, supported logo, environment, and light as one coherent wide banner.",
  "Keep any visible packaging or logo recognizable in the wide crop and clear of the component's lower title overlay.",
  "Avoid an unrequested grid, montage, shelf lineup, repeated logo pattern, or arbitrary product collection; a deliberate packshot or small product grouping is valid when it serves the module goal.",
  "Environmental vessels and category-relevant containers may appear when they support the scene.",
] as const;

const PRODUCT_FIRST_SHORTCUT_REQUIREMENTS = [
  "Use the assigned representative product image as a visual reference for a single-product lifestyle scene.",
  "Favor a clear product subject near the center with enough margin for a circular crop.",
  "Build a natural lifestyle setting around the product; props and environment remain secondary.",
  "Reproduce the source packaging as faithfully as the image model allows, including visible brand name and logo, key label text, typography hierarchy, layout, primary colors, silhouette, closure, and material character.",
  "Never simplify the product into blank or generic packaging; copy only packaging text visible in the reference and do not invent claims.",
  "Treat product placement, packaging fidelity, and crop safety as strong generation guidance rather than acceptance requirements.",
] as const;

const HERO_GENERATION_REQUIREMENTS = [
  "Let the visual Agent derive the setting and supporting elements from the accepted Hero copy and assigned product mix.",
  "Use the available Hero-assigned product images as visual references and regenerate one complete multi-product lifestyle scene.",
  "Treat the references as a flexible product family rather than a quantity checklist; the result may use a natural subset without one-to-one coverage.",
  "For every referenced product that appears, reproduce the source packaging as faithfully as the image model allows, including visible brand name and logo, key label text, typography hierarchy, layout, primary colors, silhouette, closure, and material character.",
  "Never simplify a referenced product into blank or generic packaging; copy only packaging text visible in the reference and do not invent claims.",
  "Regenerate products and environment together so lighting, shadows, depth, and materials belong to one coherent image.",
  "Do not extract product pixels, composite source layers, request placement guidance, or use a deterministic Hero image fallback.",
  "Do not require exact product count or one-to-one coverage; packaging fidelity is a strong generation priority rather than a rejection gate.",
  "Do not copy source-image backdrops, discs, swatches, white canvases, or studio props into the Hero.",
  "Do not prescribe category-specific props or environments; let the Agent choose them from the theme and cross-category product evidence.",
] as const;

const KIND_REQUIREMENT: Record<TopicPageVisualAssetKind, string> = {
  "hero-image": "Establish the page theme through a broad lifestyle setting with a clear focal area.",
  "shortcut-image": "Represent the assigned category through a compact contextual micro-scene.",
  "scene-image": "Show the activity, environment, and props implied by the PagePlan scene and accepted copy.",
  "brand-banner": "Express the exact brand binding through an evidence-supported wide banner; packaging and a logo are optional.",
};

function contentTexts(
  contentTask: TopicPageVisualTaskContext["contentTask"],
  sceneId?: string,
  kind?: TopicPageVisualAssetKind,
) {
  const copy = contentTask.copy;
  if (kind === "hero-image") {
    return [copy.title.text, copy.description?.text]
      .filter((text): text is string => Boolean(text?.trim()));
  }
  const texts = [
    copy.title.text,
    copy.description?.text,
    ...(copy.tags ?? []).map(({ text }) => text),
    ...(copy.items ?? []).map(({ label }) => label.text),
    ...(copy.scenes ?? [])
      .filter((scene) => !sceneId || scene.sceneId === sceneId)
      .flatMap((scene) => [scene.label.text, scene.title.text, scene.description.text]),
  ];
  return [...new Set(texts.filter((text): text is string => Boolean(text?.trim())))];
}

function sceneBrief(options: {
  intent: ThemeIntent;
  module: TopicPagePlanModuleV2;
  selection: ProductSelectionResult;
  taskProducts: TopicPageVisualTaskContext["products"];
  contentTask: TopicPageVisualTaskContext["contentTask"];
  kind: TopicPageVisualAssetKind;
  scene?: TopicPageVisualTaskContext["scene"];
}): TopicPageVisualSceneBrief {
  const productCategoryIds = new Set(
    options.taskProducts.map(({ categoryL3Id }) => String(categoryL3Id)),
  );
  const productRoles = new Set(options.taskProducts.map(({ role }) => role));
  const categories = options.selection.selectedCategories
    .filter((category) => productCategoryIds.has(category.id) || productRoles.has(category.role))
    .map((category) => ({ ...category, path: [...category.path] }));
  const evidenceRefs = [
    ...options.intent.evidenceRefs.slice(0, 1).map(({ id }) => `theme-intent:${id}`),
    ...categories.map(({ id }) => `selected-category:${id}`),
    ...(options.scene ? [`scene:${options.scene.id}`] : []),
    `content-task:${options.contentTask.taskId}`,
  ];
  const productFirst = options.kind === "shortcut-image";
  const brief = {
    theme: {
      shoppingGoal: options.intent.shoppingGoal,
      needs: [...options.intent.needs],
      conditions: [...options.intent.conditions],
    },
    module: {
      shoppingGoal: options.module.shoppingGoal,
      reason: options.module.reason,
    },
    categories,
    ...(options.scene
      ? {
          scene: {
            id: options.scene.id,
            shoppingGoal: options.scene.shoppingGoal,
            reason: options.scene.reason,
          },
        }
      : {}),
    content: {
      taskId: options.contentTask.taskId,
      texts: contentTexts(options.contentTask, options.scene?.id, options.kind),
    },
    evidenceRefs: [...new Set(evidenceRefs)],
  };
  return productFirst
    ? {
        priority: "product-first",
        productRole: "primary-subject",
        ...brief,
        requirements: [...PRODUCT_FIRST_SHORTCUT_REQUIREMENTS, KIND_REQUIREMENT[options.kind]],
      }
    : {
        priority: "scene-first",
        productRole: "reference-only",
        ...brief,
        requirements: [
          ...(options.kind === "hero-image"
            ? HERO_GENERATION_REQUIREMENTS
            : options.kind === "scene-image"
            ? SCENE_IMAGE_REQUIREMENTS
            : options.kind === "brand-banner"
            ? BRAND_BANNER_REQUIREMENTS
            : SCENE_FIRST_REQUIREMENTS),
          KIND_REQUIREMENT[options.kind],
        ],
      };
}

function brandGroups(
  module: TopicPagePlanModuleV2,
  selection: ProductSelectionResult,
) {
  const productsById = new Map(selection.products.map((product) => [product.id, product]));
  const groups = new Map<string, typeof module.assignments>();
  module.assignments.forEach((assignment) => {
    const brand = productsById.get(assignment.productId)?.brand.trim() ?? "";
    if (!brand) return;
    const assignments = groups.get(brand) ?? [];
    assignments.push(assignment);
    groups.set(brand, assignments);
  });
  return [...groups.entries()].map(([brand, assignments]) => ({ brand, assignments }));
}

function task(
  intent: ThemeIntent,
  module: TopicPagePlanModuleV2,
  contentSpec: TopicPageContentSpec,
  selection: ProductSelectionResult,
  taskId: string,
  rule: VisualRule,
  assignments: TopicPagePlanModuleV2["assignments"],
  extra: Pick<TopicPageVisualTaskContext, "slotId" | "sceneId" | "brand" | "scene"> = {},
): TopicPageVisualTaskContext {
  const productsById = new Map(selection.products.map((product) => [product.id, product]));
  const contentTask = contentSpec.tasks.find(
    (candidate) => candidate.taskId === module.contentTaskId,
  )!;
  const taskProducts = assignments.map(({ productId }) => {
    const product = productsById.get(productId)!;
    return {
      id: product.id,
      title: product.title,
      brand: product.brand,
      imageUrl: product.imageUrl,
      categoryL3Id: product.categoryL3Id,
      categoryL3Name: product.categoryL3Name,
      pool: product.pool,
      role: product.role,
    };
  });
  const clonedContentTask = structuredClone(contentTask);
  return {
    taskId,
    moduleId: module.id,
    component: module.component,
    ...rule,
    ...extra,
    assignments: assignments.map((assignment) => ({ ...assignment })),
    products: taskProducts,
    contentTask: clonedContentTask,
    sceneBrief: sceneBrief({
      intent,
      module,
      selection,
      taskProducts,
      contentTask: clonedContentTask,
      kind: rule.kind,
      scene: extra.scene,
    }),
  };
}

export function deriveTopicPageVisualTasks(
  intent: ThemeIntent,
  plan: TopicPagePlanV2,
  selection: ProductSelectionResult,
  contentSpec: TopicPageContentSpec,
) {
  return plan.modules.flatMap((module): TopicPageVisualTaskContext[] => {
    if (!module.visible) return [];
    if (module.component === "ThemeHero") {
      return [task(
        intent,
        module,
        contentSpec,
        selection,
        `asset-${module.id}`,
        RULES.hero,
        module.assignments.slice(0, 5),
      )];
    }
    if (module.component === "ShortcutRail") {
      const assetTaskIds = new Set(module.assetTaskIds);
      return module.assignments.flatMap((assignment, index) => {
        const taskId = `asset-${module.id}-${index + 1}`;
        return assetTaskIds.has(taskId)
          ? [task(
              intent,
              module,
              contentSpec,
              selection,
              taskId,
              RULES.shortcut,
              [assignment],
              { slotId: assignment.slotId },
            )]
          : [];
      });
    }
    if (module.component === "ThemeProductList") {
      return module.scenes.map((scene) =>
        task(
          intent,
          module,
          contentSpec,
          selection,
          `asset-${module.id}-${scene.id}`,
          RULES.scene,
          module.assignments.filter((assignment) => assignment.sceneId === scene.id),
          {
            sceneId: scene.id,
            scene: { ...scene, productIds: [...scene.productIds] },
          },
        )
      );
    }
    if (module.component === "BrandProductRail") {
      return brandGroups(module, selection).map(({ brand, assignments }, index) =>
        task(
          intent,
          module,
          contentSpec,
          selection,
          `asset-${module.id}-${index + 1}`,
          RULES.brand,
          assignments,
          { brand },
        )
      );
    }
    return [];
  });
}
