const ZH_DOMAIN_LABELS = {
  beauty: "护肤",
  grocery: "食品",
  household: "居家",
};

const ZH_CATEGORY_LABELS = {
  "Instant Noodles & Self-heating HotPot": "方便面与自热火锅",
  "Instant Noodles & Ramen & Cup Noodles & Tteokbokki": "方便面、拉面、杯面与年糕",
  "Cleanser & Exfoliators": "洁面与去角质",
  "Toning Pads": "爽肤棉",
  "Serums & Value Sets": "精华与套装",
  "Lotions & Creams": "乳液与面霜",
  "Sheet Masks": "片状面膜",
  Sunscreen: "防晒",
  Toners: "爽肤水",
};

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function joinLabels(labels, language) {
  if (labels.length <= 1) return labels[0] ?? "";
  if (language === "zh") return labels.join("、");
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)}`;
}

function copy(text, evidenceRefs) {
  const refs = unique(evidenceRefs);
  if (refs.length === 0) {
    throw new Error("Content Agent requires evidence for every copy segment.");
  }
  return { text, evidenceRefs: refs };
}

function intentRef(context) {
  const evidence = context.themeIntent.evidenceRefs[0];
  return evidence ? `theme-intent:${evidence.id}` : null;
}

function productRef(product) {
  return product ? `product:${product.id}` : null;
}

function categoryRef(category) {
  return category ? `selected-category:${category.id}` : null;
}

function localizedCategoryLabel(context, label) {
  return context.language === "zh" ? ZH_CATEGORY_LABELS[label] ?? label : label;
}

function categoryEvidenceRefs(category) {
  return category?.evidenceRefs ?? [categoryRef(category)];
}

function categoryForProduct(context, product) {
  if (!product?.categoryL3Id) return null;
  const selected = context.selectedCategories.find(
    ({ id }) => String(id) === String(product.categoryL3Id),
  );
  if (selected) {
    return {
      ...selected,
      label: localizedCategoryLabel(context, selected.label),
      evidenceRefs: [categoryRef(selected)],
    };
  }
  if (!product.categoryL3Name) return null;
  return {
    id: String(product.categoryL3Id),
    label: localizedCategoryLabel(context, product.categoryL3Name),
    evidenceRefs: [productRef(product)],
  };
}

function categoriesForProducts(context, products) {
  const categories = new Map();
  for (const product of products) {
    const category = categoryForProduct(context, product);
    if (category && !categories.has(category.id)) categories.set(category.id, category);
  }
  if (categories.size > 0) return [...categories.values()];
  return context.selectedCategories.map((category) => ({
    ...category,
    label: localizedCategoryLabel(context, category.label),
    evidenceRefs: [categoryRef(category)],
  }));
}

function evidenceFor(context, task, categories = []) {
  return unique([
    intentRef(context),
    ...categories.flatMap(categoryEvidenceRefs),
    ...task.products.slice(0, 3).map(productRef),
  ]);
}

function conciseProductTitle(product) {
  if (!product) return "";
  const brandPattern = new RegExp(`^${product.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i");
  const title = product.title
    .replace(brandPattern, "")
    .split(/[,，(（]/)[0]
    .trim();
  return title.length > 28 ? `${title.slice(0, 27).trim()}…` : title;
}

function domainLabel(context) {
  const domain = context.themeIntent.catalogDomain?.toLocaleLowerCase();
  if (context.language === "zh") {
    return ZH_DOMAIN_LABELS[domain] ?? "主题";
  }
  return domain === "beauty"
    ? "beauty"
    : domain === "grocery"
      ? "food"
      : "everyday";
}

function heroCopy(context, task) {
  const categories = categoriesForProducts(context, task.products).slice(0, 3);
  const categoryLabels = categories.map(({ label }) => label);
  const focus = joinLabels(categoryLabels, context.language);
  const refs = evidenceFor(context, task, categories);
  const firstProductRef = productRef(task.products[0]);
  const themeRef = intentRef(context);
  const fallbackTagRefs = unique([
    themeRef,
    firstProductRef,
    ...categories.flatMap(categoryEvidenceRefs),
  ]);
  let title;
  let description;

  if (context.language === "zh") {
    title = context.themeIntent.themeType === "brand"
      ? `${context.keyword} ${domainLabel(context)}选购指南`
      : context.themeIntent.themeType === "activity"
        ? `${context.keyword}，按场景轻松选`
        : `${context.keyword} 怎么选？从${categoryLabels[0] ?? "实际商品"}开始`;
    description = focus
      ? `从${focus}入手，按品类浏览本次选中的 ${context.keyword} 商品，更快找到符合日常需求的选择。`
      : `围绕 ${context.keyword} 的实际商品信息整理选择，帮你更快比较并找到需要的商品。`;
  } else {
    title = context.themeIntent.themeType === "brand"
      ? `A practical ${context.keyword} ${domainLabel(context)} edit`
      : context.themeIntent.themeType === "activity"
        ? `${context.keyword}, organized by occasion`
        : `How to shop ${context.keyword}`;
    description = focus
      ? `Browse the selected ${context.keyword} products across ${focus} to compare the options that fit your everyday needs.`
      : `Compare the selected ${context.keyword} products using their catalog-backed details and find the options you need.`;
  }

  const tags = categories.slice(0, 4).map((category) =>
    copy(category.label, categoryEvidenceRefs(category))
  );
  const fallbackTags = context.language === "zh"
    ? [`${context.keyword} 选购`, `日常${domainLabel(context)}`]
    : [`Shop ${context.keyword}`, `Everyday ${domainLabel(context)}`];
  for (const text of fallbackTags) {
    if (tags.length >= 2) break;
    if (!tags.some((tag) => tag.text === text)) tags.push(copy(text, fallbackTagRefs));
  }

  return {
    title: copy(title, unique([
      themeRef,
      ...categories.slice(0, 1).flatMap(categoryEvidenceRefs),
      firstProductRef,
    ])),
    description: copy(description, refs),
    tags,
  };
}

function shortcutCopy(context, task) {
  const productsById = new Map(task.products.map((product) => [product.id, product]));
  const categories = categoriesForProducts(context, task.products);
  const title = context.language === "zh" ? "按品类快速查找" : "Browse by category";
  return {
    title: copy(title, evidenceFor(context, task, categories.slice(0, 2))),
    items: task.assignments.map((assignment) => {
      const product = productsById.get(assignment.productId) ?? task.products[0];
      const category = categoryForProduct(context, product);
      const label = category?.label || conciseProductTitle(product) || context.keyword;
      return {
        slotId: assignment.slotId,
        label: copy(label, [productRef(product)]),
      };
    }),
  };
}

function sceneCopy(context, task) {
  const productsById = new Map(task.products.map((product) => [product.id, product]));
  return {
    title: copy(
      context.language === "zh" ? `按场景搭配 ${context.keyword}` : `Build your ${context.keyword} by occasion`,
      evidenceFor(context, task),
    ),
    scenes: task.scenes.map((scene, index) => {
      const products = scene.productIds.flatMap((id) => {
        const product = productsById.get(id);
        return product ? [product] : [];
      });
      const categories = categoriesForProducts(context, products).slice(0, 3);
      const focus = joinLabels(categories.map(({ label }) => label), context.language);
      const refs = unique([
        `scene:${scene.id}`,
        ...products.map(productRef),
        ...categories.flatMap(categoryEvidenceRefs),
      ]);
      if (context.language === "zh") {
        return {
          sceneId: scene.id,
          label: copy(focus || `场景 ${index + 1}`, refs),
          title: copy(`从${focus || context.keyword}开始搭配`, refs),
          description: copy("把主要选择和配套商品放在同一组，按这一场景完成选购。", refs),
        };
      }
      return {
        sceneId: scene.id,
        label: copy(focus || `Occasion ${index + 1}`, refs),
        title: copy(`Start with ${focus || context.keyword}`, refs),
        description: copy("See the main picks and complementary products together to complete this occasion.", refs),
      };
    }),
  };
}

function simpleModuleCopy(context, task) {
  const refs = evidenceFor(context, task);
  if (task.moduleId === "popular-picks") {
    return {
      title: copy(
        context.language === "zh"
          ? context.themeIntent.themeType === "brand"
            ? `先看这些 ${context.keyword} 单品`
            : `${context.keyword} 的重点选择`
          : context.themeIntent.themeType === "brand"
            ? `${context.keyword} picks to start with`
            : `Start with these ${context.keyword} picks`,
        refs,
      ),
    };
  }
  if (task.moduleId === "brand-spotlight") {
    return {
      title: copy(
        context.language === "zh" ? "按品牌继续探索" : "Explore more by brand",
        refs,
      ),
    };
  }
  if (task.moduleId === "explore-more") {
    const categories = categoriesForProducts(context, task.products).slice(0, 3);
    const focus = joinLabels(categories.map(({ label }) => label), context.language);
    return {
      title: copy(
        context.language === "zh" ? `继续探索 ${context.keyword}` : `Keep exploring ${context.keyword}`,
        evidenceFor(context, task, categories),
      ),
      description: copy(
        context.language === "zh"
          ? focus
            ? `按${focus}等方向继续浏览本次选中的商品。`
            : `继续比较本次选中的 ${context.keyword} 商品。`
          : focus
            ? `Continue through the selected products across ${focus}.`
            : `Continue comparing the selected ${context.keyword} products.`,
        evidenceFor(context, task, categories),
      ),
    };
  }
  return {
    title: copy(context.keyword, refs),
  };
}

export function contentProposal(run) {
  const context = run.context;
  return {
    schemaVersion: "topic-page-content-proposal/v1",
    keyword: context.keyword,
    site: context.site,
    language: context.language,
    topicPagePlanDigest: context.topicPagePlanDigest,
    themeIntentDigest: context.themeIntentDigest,
    productSelectionDigest: context.productSelectionDigest,
    tasks: context.tasks.map((task) => {
      const taskCopy = task.moduleId === "hero"
        ? heroCopy(context, task)
        : task.moduleId === "shortcuts"
          ? shortcutCopy(context, task)
          : task.moduleId === "start-here"
            ? sceneCopy(context, task)
            : simpleModuleCopy(context, task);
      return {
        taskId: task.taskId,
        moduleId: task.moduleId,
        component: task.component,
        copy: taskCopy,
      };
    }),
  };
}
