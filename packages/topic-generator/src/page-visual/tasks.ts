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
  TopicPageVisualTaskContext,
} from "./contracts.js";

interface VisualRule {
  kind: TopicPageVisualAssetKind;
  targetAspectRatio: TopicPageVisualAspectRatio;
  minimumWidth: number;
  minimumHeight: number;
  altTextMode: TopicPageVisualAltTextMode;
  requiresBackgroundColor: boolean;
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
  return {
    taskId,
    moduleId: module.id,
    component: module.component,
    ...rule,
    ...extra,
    assignments: assignments.map((assignment) => ({ ...assignment })),
    products: assignments.map(({ productId }) => {
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
    }),
    contentTask: structuredClone(contentTask),
  };
}

export function deriveTopicPageVisualTasks(
  plan: TopicPagePlanV2,
  selection: ProductSelectionResult,
  contentSpec: TopicPageContentSpec,
) {
  return plan.modules.flatMap((module): TopicPageVisualTaskContext[] => {
    if (!module.visible) return [];
    if (module.component === "ThemeHero") {
      return [task(module, contentSpec, selection, `asset-${module.id}`, RULES.hero, module.assignments)];
    }
    if (module.component === "ShortcutRail") {
      return module.assignments.map((assignment, index) =>
        task(
          module,
          contentSpec,
          selection,
          `asset-${module.id}-${index + 1}`,
          RULES.shortcut,
          [assignment],
          { slotId: assignment.slotId },
        )
      );
    }
    if (module.component === "ThemeProductList") {
      return module.scenes.map((scene) =>
        task(
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
