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
  "Do not depict bottles, jars, tubes, pumps, droppers, sachets, or product boxes, even when blank or unbranded.",
  "Do not generate or alter packaging, labels, logos, or product claims.",
] as const;

const PRODUCT_FIRST_SHORTCUT_REQUIREMENTS = [
  "Use the assigned representative product as the single primary visual subject.",
  "Use the verified source product image as a strict visual reference for shape, color, proportions, and packaging identity.",
  "Place the product near the center with enough clear margin for a circular crop.",
  "Build a natural lifestyle setting around the product; props and environment remain secondary.",
  "Do not add another product, duplicate the product, crop it, or invent or rewrite packaging details.",
] as const;

const HERO_COMPOSITE_REQUIREMENTS = [
  "Let the visual Agent derive the setting and supporting elements from the accepted Hero copy and assigned product mix.",
  "Aim to feature 3 to 5 representative assigned products when available; treat this count as guidance rather than a generation blocker.",
  "Generate the scene background without product containers, then add the assigned products as separate source-backed layers.",
  "Compose the verified source product images as locked real-product layers; do not ask the image model to redraw their packaging.",
  "Let the Agent choose the camera, support surface, depth pattern, materials, and light while preserving natural environmental shadows in the central placement area.",
  "Avoid steep or internally inconsistent perspective, missing credible product footholds, a placement zone that forces a single flat row, and conflicting light or shadow directions.",
  "Do not pre-render empty product silhouettes, empty product-shaped shadows, or other placeholders for products that are not yet present.",
  "After inspecting the background, return non-blocking x/y/scale/depth placement guidance for each assigned product when credible footholds can be identified; each contact point must lie on an upward-facing support surface, never a vertical face, wall, or open air.",
  "Visually verify every placement point against the actual generated pixels before returning it; omission falls back safely and never blocks generation.",
  "During Host composition, keep the central representative product unobscured in front, stagger secondary products across middle and rear depths, and add restrained same-direction contact shadows.",
  "Keep the combined product group at the visual center and keep the bottom quarter free of principal products or scene elements.",
  "Do not prescribe category-specific props or environments; let the Agent choose them from the theme and cross-category product evidence.",
] as const;

const KIND_REQUIREMENT: Record<TopicPageVisualAssetKind, string> = {
  "hero-image": "Establish the page theme through a broad lifestyle setting with a clear focal area.",
  "shortcut-image": "Represent the assigned category through a compact contextual micro-scene.",
  "scene-image": "Show the activity, environment, and props implied by the PagePlan scene and accepted copy.",
  "brand-banner": "Express the module theme and brand atmosphere without turning the banner into a product lineup.",
};

function contentTexts(
  contentTask: TopicPageVisualTaskContext["contentTask"],
  sceneId?: string,
) {
  const copy = contentTask.copy;
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
  const heroComposite = options.kind === "hero-image";
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
      texts: contentTexts(options.contentTask, options.scene?.id),
    },
    evidenceRefs: [...new Set(evidenceRefs)],
  };
  return heroComposite
    ? {
        priority: "scene-composite",
        productRole: "locked-source-products",
        ...brief,
        requirements: [...HERO_COMPOSITE_REQUIREMENTS, KIND_REQUIREMENT[options.kind]],
      }
    : productFirst
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
        requirements: [...SCENE_FIRST_REQUIREMENTS, KIND_REQUIREMENT[options.kind]],
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
