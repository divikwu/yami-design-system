import type {
  ContentLanguage,
  ProductRole,
  ProductSelectionStrategy,
  TopicCategorySelection,
  TopicGroup,
  TopicGenerationMode,
  TopicModulePlan,
  TopicPagePlan,
  TopicPlanMatrix,
  TopicPlanVariants,
  TopicProduct,
  YamiProduct,
  YamiSearchSnapshot,
} from "./types.js";
import { buildSearchFallbackIntent } from "./yami-catalog.js";
import { getProductSelectionStrategyConfig } from "./product-selection/config.js";
import type { ProductSelectionResult } from "./product-selection/contracts.js";
import { advanceProductSelectionRun } from "./product-selection/run.js";

/** Compile verified intent evidence into reviewable page-plan variants. */

const STRATEGY_META: Record<
  ContentLanguage,
  Record<ProductSelectionStrategy, { label: string; description: string }>
> = {
  en: {
    relevance: {
      label: "Precise relevance",
      description: "Prioritizes keyword and brand matches while preserving Yami result order.",
    },
    "category-role": {
      label: "Category roles",
      description: "Selects category roles first, then fills page modules from those categories.",
    },
  },
  zh: {
    relevance: {
      label: "精准匹配",
      description: "优先关键词和品牌匹配，并保留 Yami 搜索结果顺序。",
    },
    "category-role": {
      label: "分类角色",
      description: "先按 5:3:2 选择核心、搭配和周边分类，再从分类中分配商品。",
    },
  },
};

const PRODUCT_TYPE_LABELS_ZH: Record<string, string> = {
  "Noodles & Meals": "面食与即食",
  "Instant Noodles & Self-heating HotPot": "方便面与自热火锅",
  "Instant Noodles & Ramen & Cup Noodles & Tteokbokki": "方便面、拉面、杯面与年糕",
  "Dry Noodle & Vermicelli": "干面与粉丝",
  "Spicy Rice Noodles": "辣味米粉",
  "Chips, Rice Crackers, Noodle Snack": "薯片、米饼与面食零食",
  Cleansers: "洁面",
  "Cleanser & Exfoliators": "洁面与去角质",
  Toners: "爽肤水",
  "Toning Pads": "爽肤棉",
  "Serums & Essences": "精华与精粹",
  "Serums & Value Sets": "精华与套装",
  Moisturizers: "面霜与保湿",
  "Lotions & Creams": "乳液与面霜",
  "Sun Care": "防晒护理",
  Sunscreen: "防晒",
  Masks: "面膜",
  "Sheet Masks": "片状面膜",
  Makeup: "彩妆",
  "Hair & Body": "洗护与身体护理",
  Snacks: "零食",
  Sweets: "糖果甜点",
  Drinks: "饮品",
  Pantry: "厨房食材",
  "Kitchen & Dining": "厨具餐具",
  "Home Care": "家居清洁",
  "Personal Care": "个人护理",
  Wellness: "营养健康",
  "More to Explore": "更多发现",
};

const PRODUCT_TYPE_RULES = [
  { label: "Noodles & Meals", terms: ["ramen", "noodle", "udon", "vermicelli", "instant meal", "hot pot"] },
  { label: "Cleansers", terms: ["cleanser", "cleansing", "face wash", "exfoliat"] },
  { label: "Toners", terms: ["toner", "mist"] },
  { label: "Serums & Essences", terms: ["serum", "essence", "ampoule"] },
  { label: "Moisturizers", terms: ["cream", "moistur", "lotion", "emulsion"] },
  { label: "Sun Care", terms: ["sunscreen", "sun cream", "sun stick", "spf"] },
  { label: "Masks", terms: ["mask", "patch"] },
  { label: "Makeup", terms: ["lip", "mascara", "foundation", "eyeliner", "blush", "cushion"] },
  { label: "Hair & Body", terms: ["shampoo", "conditioner", "hair", "body wash", "body lotion"] },
  { label: "Kitchen & Dining", terms: ["bowl", "cup", "mug", "pan", "pot", "knife", "chopstick", "kitchen", "whisk"] },
  { label: "Snacks", terms: ["chip", "cracker", "snack", "seaweed", "popcorn", "jerky"] },
  { label: "Sweets", terms: ["candy", "chocolate", "cookie", "gummy", "cake", "mochi", "jelly"] },
  { label: "Drinks", terms: ["matcha", "tea", "coffee", "drink", "beverage", "juice", "soda", "milk"] },
  { label: "Pantry", terms: ["sauce", "seasoning", "oil", "vinegar", "rice", "flour", "paste"] },
  { label: "Home Care", terms: ["cleaning", "detergent", "tissue", "storage", "laundry", "household"] },
  { label: "Personal Care", terms: ["toothpaste", "toothbrush", "deodorant", "sanitary", "hand soap"] },
  { label: "Wellness", terms: ["vitamin", "supplement", "probiotic", "collagen", "health"] },
] as const;

const ROLE_ORDER: ProductRole[] = ["core", "pairing", "accessory"];
const PREFIX_PRODUCT_TERMS = new Set(["exfoliat", "moistur"]);

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function keywordTerms(keyword: string) {
  return normalized(keyword)
    .split(" ")
    .filter((term) => term.length > 1);
}

function productMatches(product: YamiProduct, keyword: string) {
  const haystack = normalized(`${product.brand} ${product.title}`);
  const phrase = normalized(keyword);
  const terms = keywordTerms(keyword);
  const matchedTerms = terms.filter((term) => haystack.includes(term));

  return {
    direct: Boolean(phrase && haystack.includes(phrase)),
    matchedTerms,
  };
}

function deriveProductType(product: YamiProduct) {
  if (product.categoryL3Name) return product.categoryL3Name;
  const title = normalized(product.title);
  return (
    PRODUCT_TYPE_RULES.find((rule) =>
      rule.terms.some((term) => {
        const normalizedTerm = normalized(term);
        if (PREFIX_PRODUCT_TERMS.has(normalizedTerm)) {
          return title.startsWith(normalizedTerm) || title.includes(` ${normalizedTerm}`);
        }
        return title === normalizedTerm || title.startsWith(`${normalizedTerm} `) ||
          title.includes(` ${normalizedTerm} `) || title.endsWith(` ${normalizedTerm}`);
      }),
    )?.label ?? "More to Explore"
  );
}

function productTypeLabel(productType: string, language: ContentLanguage) {
  return language === "zh"
    ? PRODUCT_TYPE_LABELS_ZH[productType] ?? productType
    : productType;
}

function slug(value: string) {
  return normalized(value).replace(/\s+/g, "-") || "more";
}

function displayKeyword(keyword: string) {
  const trimmed = keyword.trim();
  if (/^[A-Z0-9][A-Z0-9\s&+-]{1,11}$/.test(trimmed)) return trimmed;
  return trimmed.replace(/\b\p{L}/gu, (character) => character.toLocaleUpperCase());
}

function selectionReason(
  product: YamiProduct,
  keyword: string,
  contextualFallback: boolean,
  language: ContentLanguage,
) {
  const match = productMatches(product, keyword);
  let reason: string;
  if (match.direct) {
    reason = language === "zh"
      ? `关键词直接命中 · Yami 排名 #${product.sourceRank}`
      : `Direct keyword match · Yami rank #${product.sourceRank}`;
  } else if (match.matchedTerms.length > 0) {
    reason = language === "zh"
      ? `命中 ${match.matchedTerms.join("、")} · Yami 排名 #${product.sourceRank}`
      : `Matches ${match.matchedTerms.join(", ")} · Yami rank #${product.sourceRank}`;
  } else if (contextualFallback) {
    reason = language === "zh"
      ? `Yami 上下文候选 · 排名 #${product.sourceRank}`
      : `Contextual Yami result · rank #${product.sourceRank}`;
  } else {
    reason = language === "zh"
      ? `Yami 相关候选 · 排名 #${product.sourceRank}`
      : `Related Yami result · rank #${product.sourceRank}`;
  }

  return reason;
}

function buildGroups(products: TopicProduct[]): TopicGroup[] {
  const groups = new Map<string, TopicGroup>();

  products.forEach((product) => {
    const id = slug(product.productType);
    const group = groups.get(id) ?? {
      id,
      label: product.productTypeLabel,
      role: product.role,
      productIds: [],
    };
    group.productIds.push(product.id);
    groups.set(id, group);
  });

  return [...groups.values()].sort((left, right) => {
    const countDifference = right.productIds.length - left.productIds.length;
    if (countDifference !== 0) return countDifference;
    return (
      products.findIndex((product) => product.id === left.productIds[0]) -
      products.findIndex((product) => product.id === right.productIds[0])
    );
  });
}

function dominantBrand(products: TopicProduct[], keyword: string) {
  const counts = new Map<string, { label: string; productIds: string[] }>();
  products.forEach((product) => {
    const key = normalized(product.brand);
    const entry = counts.get(key) ?? { label: product.brand, productIds: [] };
    entry.productIds.push(product.id);
    counts.set(key, entry);
  });

  const winner = [...counts.entries()].sort(
    (left, right) => right[1].productIds.length - left[1].productIds.length,
  )[0];
  if (!winner) return null;

  const [key, value] = winner;
  const query = normalized(keyword);
  const queryNamesBrand = query === key || query.includes(key) || key.includes(query);
  return value.productIds.length >= 4 && queryNamesBrand ? value : null;
}

function createModules(
  primary: TopicProduct[],
  groups: TopicGroup[],
  keyword: string,
  language: ContentLanguage,
): TopicModulePlan[] {
  const shortcutGroups = groups.slice(0, 6);
  const groupRepresentatives = shortcutGroups.flatMap((group) =>
    group.productIds.slice(0, 1),
  );
  const startHereProducts = groups.slice(0, 3).flatMap((group) =>
    group.productIds.slice(0, 2)
  );
  const brand = dominantBrand(primary, keyword);
  const zh = language === "zh";
  const usesCatalogCategories = primary.some((product) => product.categoryL3Name);

  return [
    {
      id: "hero",
      label: zh ? "主题主视觉" : "Theme Hero",
      heading: `${zh ? "探索" : "Explore"} ${displayKeyword(keyword)}`,
      description: zh
        ? "一个主题命题，由 3 张真实商品图提供证据。"
        : "One topic proposition supported by three source product images.",
      required: true,
      visible: primary.length > 0,
      productIds: primary.slice(0, 3).map((product) => product.id),
      reason: zh
        ? "使用主商品池前 3 件商品；不生成虚构包装。"
        : "Uses the first three products from PrimaryPool; no synthetic packaging.",
    },
    {
      id: "shortcuts",
      label: zh ? "精选分类" : "Featured Categories",
      heading: zh ? "按类型选购" : "Shop by type",
      description: zh
        ? usesCatalogCategories
          ? "依据 Yami 真实商品目录生成分类入口。"
          : "依据商品标题规则生成轻量分类入口。"
        : usesCatalogCategories
          ? "Yami catalog categories create the category shortcuts."
          : "Product-title rules create lightweight category shortcuts.",
      required: true,
      visible: shortcutGroups.length > 1,
      productIds: groupRepresentatives,
      reason:
        shortcutGroups.length > 1
          ? zh
            ? `展示 ${Math.min(groups.length, 6)} 个商品类型的代表商品。`
            : `Shows one representative from each of ${Math.min(groups.length, 6)} product types.`
          : zh
            ? "当前商品池只有一个可识别类型，因此隐藏。"
            : "Hidden because the current pool only contains one identifiable product type.",
    },
    {
      id: "start-here",
      label: zh ? "从这里开始" : "Start Here",
      heading: zh ? "从这里开始" : "Start here",
      description: zh
        ? "覆盖三个主要商品类型的紧凑入口。"
        : "A compact entry point across the three strongest product types.",
      required: false,
      visible: groups.length >= 3 && primary.length >= 6,
      productIds: startHereProducts,
      reason:
        groups.length >= 3 && primary.length >= 6
          ? zh
            ? "至少有 3 个类型和 6 件主商品，因此显示。"
            : "Enabled because at least three types and six primary products are available."
          : zh
            ? "至少需要 3 个类型和 6 件主商品才会显示。"
            : "Hidden until at least three types and six primary products are available.",
    },
    {
      id: "popular-picks",
      label: zh ? "热门精选" : "Popular Picks",
      heading: zh ? "热门精选" : "Popular picks",
      description: zh
        ? "保留 Yami 搜索顺序；不展示价格，也不按价格排序。"
        : "Keeps Yami search order; price is hidden and never affects rank.",
      required: true,
      visible: primary.length >= 4,
      productIds: primary.slice(0, 8).map((product) => product.id),
      reason: zh
        ? "按 Yami 原始结果顺序使用最多 8 件主商品池商品。"
        : "Uses up to eight PrimaryPool products in original Yami result order.",
    },
    {
      id: "brand-spotlight",
      label: zh ? "品牌精选" : "Brand Spotlight",
      heading: brand
        ? `${zh ? "认识" : "Meet"} ${brand.label}`
        : zh ? "品牌精选" : "Brand spotlight",
      description: zh
        ? "仅当关键词明确指向主导品牌时显示。"
        : "Only appears when the keyword clearly names the dominant brand.",
      required: false,
      visible: Boolean(brand),
      productIds: brand?.productIds.slice(0, 6) ?? [],
      reason: brand
        ? zh
          ? `${brand.label} 匹配查询，且至少有 4 件主商品。`
          : `${brand.label} matches the query and has at least four primary products.`
        : zh
          ? "没有匹配查询且拥有至少 4 件主商品的品牌，因此隐藏。"
          : "Hidden because no query-matched brand has at least four primary products.",
    },
    {
      id: "reviews",
      label: zh ? "顾客怎么说" : "Customer Reviews",
      heading: zh ? "顾客怎么说" : "What customers say",
      description: zh
        ? "评论文案必须来自已验证的评论记录。"
        : "Review copy requires verified review records.",
      required: false,
      visible: false,
      productIds: [],
      reason: zh
        ? "搜索结果不提供评论证据，因此当前版本中隐藏。"
        : "Hidden in MVP because search results do not provide review evidence.",
    },
    {
      id: "explore-more",
      label: zh ? "探索更多" : "Explore More",
      heading: zh ? "探索更多" : "Explore more",
      description: zh
        ? usesCatalogCategories
          ? "完整主商品池，按 Yami 目录分类分组。"
          : "完整主商品池，按推断的商品类型分组。"
        : usesCatalogCategories
          ? "The complete PrimaryPool, grouped by Yami catalog category."
          : "The complete PrimaryPool, grouped by inferred product type.",
      required: true,
      visible: primary.length > 0,
      productIds: primary.map((product) => product.id),
      reason: zh
        ? "仅包含主商品池；关联商品池不会填充核心模块。"
        : "Contains PrimaryPool only; RelatedPool never fills a core module.",
    },
  ];
}

function createCategoryRoleModules(
  products: TopicProduct[],
  groups: TopicGroup[],
  result: ProductSelectionResult,
  language: ContentLanguage,
): TopicModulePlan[] {
  const zh = language === "zh";
  const selectedModule = new Map(result.modules.map((module) => [module.id, module]));
  const modulePlan = (
    id: Extract<TopicModulePlan["id"], "start-here" | "popular-picks" | "brand-spotlight" | "explore-more">,
    label: string,
    heading: string,
    description: string,
    required: boolean,
  ): TopicModulePlan => {
    const productIds = selectedModule.get(id)?.productIds ?? [];
    return {
      id,
      label,
      heading,
      description,
      required,
      visible: productIds.length > 0,
      productIds,
      reason: productIds.length > 0
        ? zh
          ? `商品由 ${result.strategyRef} 按 Scene → Popular → Brand → Explore 优先级分配并全局去重。`
          : `Products were assigned by ${result.strategyRef} with Scene → Popular → Brand → Explore priority and global deduplication.`
        : zh
          ? "当前候选证据不足，模块不做回填。"
          : "Hidden because candidate evidence is insufficient; no fallback products were invented.",
    };
  };
  const coreProducts = products.filter(({ role }) => role === "core");
  const coreGroups = groups.filter(({ role }) => role === "core").slice(0, 5);

  return [
    {
      id: "hero",
      label: zh ? "主题主视觉" : "Theme Hero",
      heading: `${zh ? "探索" : "Explore"} ${displayKeyword(result.keyword)}`,
      description: zh
        ? "使用分类角色策略已验证的核心商品图。"
        : "Uses verified core-role product imagery from the category-role selection.",
      required: true,
      visible: coreProducts.length > 0,
      productIds: coreProducts.slice(0, 3).map(({ id }) => id),
      reason: zh
        ? "只使用核心角色商品；不生成或替换商品包装。"
        : "Uses core-role products only; product packaging is never generated or replaced.",
    },
    {
      id: "shortcuts",
      label: zh ? "精选分类" : "Featured Categories",
      heading: zh ? "按类型选购" : "Shop by type",
      description: zh
        ? "来自 Agent 已选并经 taxonomy 校验的核心分类。"
        : "Uses Agent-selected core categories validated against the taxonomy snapshot.",
      required: true,
      visible: coreGroups.length > 0,
      productIds: coreGroups.flatMap(({ productIds }) => productIds.slice(0, 1)),
      reason: zh
        ? `展示 ${coreGroups.length} 个核心分类的代表商品。`
        : `Shows one representative from each of ${coreGroups.length} core categories.`,
    },
    modulePlan(
      "start-here",
      zh ? "从这里开始" : "Start Here",
      zh ? "从这里开始" : "Start here",
      zh ? "4–6 个场景，每个场景两组核心、搭配与周边商品。" : "Four to six scenes with two core, pairing, and accessory groups each.",
      false,
    ),
    modulePlan(
      "popular-picks",
      zh ? "热门精选" : "Popular Picks",
      zh ? "热门精选" : "Popular picks",
      zh ? "前 5 个核心分类各取销量前 10，排除场景商品。" : "Takes the top ten sold products from each of the first five core categories after Scene deduplication.",
      true,
    ),
    modulePlan(
      "brand-spotlight",
      zh ? "品牌精选" : "Brand Spotlight",
      zh ? "品牌精选" : "Brand spotlight",
      zh ? "按核心 3、搭配 2、周边 1 选择品牌，每品牌 3 件商品。" : "Selects brands with a 3 core, 2 pairing, and 1 accessory target and three products per brand.",
      false,
    ),
    {
      id: "reviews",
      label: zh ? "顾客怎么说" : "Customer Reviews",
      heading: zh ? "顾客怎么说" : "What customers say",
      description: zh ? "评论文案必须来自已验证的评论记录。" : "Review copy requires verified review records.",
      required: false,
      visible: false,
      productIds: [],
      reason: zh ? "当前选品证据不包含评论，因此隐藏。" : "Hidden because ProductSelection evidence does not contain reviews.",
    },
    modulePlan(
      "explore-more",
      zh ? "探索更多" : "Explore More",
      zh ? "探索更多" : "Explore more",
      zh ? "优先使用销量 Top 200 发现池中的 3 个搭配和 2 个周边分类。" : "Prefers three pairing and two accessory categories from the sold Top 200 discovery pool.",
      true,
    ),
  ];
}

export function buildTopicPagePlanFromProductSelection(
  snapshot: YamiSearchSnapshot,
  selection: ProductSelectionResult,
  language: ContentLanguage = "en",
  generationMode: TopicGenerationMode = "page",
): TopicPagePlan {
  const config = getProductSelectionStrategyConfig(selection.strategyRef);
  const strategy = config.engine;
  if (selection.keyword !== snapshot.keyword || selection.site !== snapshot.site) {
    throw new Error("ProductSelectionResult does not belong to this CatalogSnapshot.");
  }
  const directProducts = snapshot.products.filter((product) => {
    const match = productMatches(product, snapshot.keyword);
    return match.direct || match.matchedTerms.length > 0;
  });
  const minimumDirectCount = Math.min(6, snapshot.products.length);
  const usesContextualFallback = strategy === "relevance" && directProducts.length < minimumDirectCount;
  const selectedCategoryById = new Map(
    selection.selectedCategories.map((category) => [category.id, category]),
  );
  const topicProductById = new Map(selection.products.map((product) => {
    const selectedCategory = selectedCategoryById.get(String(product.categoryL3Id ?? ""));
    const productType = selectedCategory?.label ?? deriveProductType(product);
    const localizedProductType = productTypeLabel(productType, language);
    const topicProduct: TopicProduct = {
      ...product,
      productType,
      productTypeLabel: localizedProductType,
      selectionReason: selectedCategory
        ? language === "zh"
          ? `${{ core: "核心", pairing: "搭配", accessory: "周边" }[product.role]}分类 · ${localizedProductType} · ${selectedCategory.reason}`
          : `${{ core: "Core", pairing: "Pairing", accessory: "Accessory" }[product.role]} category · ${localizedProductType} · ${selectedCategory.reason}`
        : selectionReason(
            product,
            snapshot.keyword,
            usesContextualFallback,
            language,
          ),
    };
    return [product.id, topicProduct] as const;
  }));
  const primary = selection.pools.primaryIds.flatMap((id) => {
    const product = topicProductById.get(id);
    return product ? [product] : [];
  });
  const related = selection.pools.relatedIds.flatMap((id) => {
    const product = topicProductById.get(id);
    return product ? [product] : [];
  });
  const categorySelections = selection.selectedCategories.map<TopicCategorySelection>((category) => ({
    id: category.id,
    label: productTypeLabel(category.label, language),
    role: category.role,
    source: "catalog-category",
    productIds: selection.products
      .filter((product) => String(product.categoryL3Id ?? "") === category.id)
      .map(({ id }) => id),
    reason: category.reason,
  }));
  const groups = buildGroups(primary);
  const modules = generationMode === "page"
    ? strategy === "category-role"
      ? createCategoryRoleModules(primary, groups, selection, language)
      : createModules(primary, groups, snapshot.keyword, language)
    : [];
  const strategyMeta = STRATEGY_META[language][strategy];
  const siteName = language === "zh" ? "美国站" : "United States";
  const topic = displayKeyword(snapshot.keyword);
  const groupNames = (strategy === "category-role"
    ? groups.filter((group) => group.role === "core")
    : groups
  ).slice(0, 3).map((group) => group.label);
  const categoryRoleCounts = Object.fromEntries(
    ROLE_ORDER.map((role) => [
      role,
      categorySelections.filter((category) => category.role === role).length,
    ]),
  ) as Record<ProductRole, number>;
  const hasInsufficientCategoryCoverage = strategy === "category-role" &&
    (categorySelections.length < 3 || categoryRoleCounts.core === 0);
  const hasWeakIntentEvidence = Boolean(
    snapshot.intent && (
      snapshot.intent.confidence < 0.75 ||
      snapshot.intent.decision.status !== "resolved" ||
      snapshot.intent.constraints.some((constraint) => constraint.status !== "verified")
    ),
  );
  let status: TopicPagePlan["status"] = "ready";
  let statusReason = strategy === "category-role"
    ? language === "zh"
      ? `${primary.length} 件分类入选商品已可用于模块规划。`
      : `${primary.length} category-selected products are ready for module planning.`
    : language === "zh"
      ? `${primary.length} 件直接匹配商品已可用于模块规划。`
      : `${primary.length} direct matches are ready for module planning.`;
  if (primary.length < 3) {
    status = "blocked";
    statusReason = language === "zh"
      ? "可用商品少于 3 件，无法安全装配页面。"
      : "Fewer than three usable products were found; the page cannot be assembled safely.";
  } else if (hasWeakIntentEvidence) {
    status = "degraded";
    statusReason = language === "zh"
      ? `购物意图证据不足（${snapshot.intent?.decision.evidenceLevel === "high" ? "高" : snapshot.intent?.decision.evidenceLevel === "medium" ? "中" : "低"}证据），必须复核未验证的关键词约束。`
      : `Shopping-intent evidence is incomplete (${snapshot.intent?.decision.evidenceLevel ?? "low"} evidence, ${snapshot.intent?.decision.status ?? "needs-review"}); unverified keyword constraints require review.`;
  } else if (hasInsufficientCategoryCoverage) {
    status = "degraded";
    statusReason = language === "zh"
      ? `仅识别到 ${categorySelections.length} 个候选分类（${categoryRoleCounts.core} 个核心 / ${categoryRoleCounts.pairing} 个搭配 / ${categoryRoleCounts.accessory} 个周边），需要人工复核。`
      : `Only ${categorySelections.length} candidate categories were identified (${categoryRoleCounts.core} core / ${categoryRoleCounts.pairing} pairing / ${categoryRoleCounts.accessory} accessory); manual review is required.`;
  } else if (usesContextualFallback || primary.length < 8) {
    status = "degraded";
    statusReason = usesContextualFallback
      ? language === "zh"
        ? "标题或品牌的直接匹配不足，已将 Yami 排名前列结果作为上下文候选。"
        : "Too few literal title or brand matches; top-ranked Yami results were used as contextual candidates."
      : language === "zh"
        ? "主商品池可用，但少于 8 件的目标数量。"
        : "The PrimaryPool is usable but smaller than the eight-product target.";
  }

  const qualityNotes = language === "zh"
    ? [
        "商品目录固定为 Yami 美国站；规划器不会推断站点。",
        "构建商品池前会移除不可售商品卡片。",
        "价格不在当前页面展示，也不参与过滤、相关性或模块排序。",
        generationMode === "page"
          ? "所有可见页面模块仅使用主商品池商品。"
          : "本次仅输出商品池；未生成标题、描述、页面模块或图片装配。",
        ...(generationMode === "page"
          ? ["当前版本使用模板文案并保留来源商品图，确保商品身份不变。"]
          : []),
        strategy === "relevance"
          ? "精准匹配在关键词和品牌匹配后保留 Yami 原始顺序。"
          : `分类来自已验证的 Yami taxonomy artifact；实际为 ${categoryRoleCounts.core} 个核心 / ${categoryRoleCounts.pairing} 个搭配 / ${categoryRoleCounts.accessory} 个周边，目标配比为 5:3:2。`,
      ]
    : [
        "Catalog is fixed to Yami United States; site is never inferred by the planner.",
        "Unavailable cards are removed before pool construction.",
        "Price is not displayed and is never used for filtering, relevance, or module order.",
        generationMode === "page"
          ? "All visible page modules use PrimaryPool products only."
          : "This run stops at product pools; no title, description, page modules, or image assembly was generated.",
        ...(generationMode === "page"
          ? ["Copy is template-based and source images preserve product identity in this MVP."]
          : []),
        strategy === "relevance"
          ? "Precise relevance preserves Yami order after keyword and brand matching."
          : `Categories come from a validated Yami taxonomy artifact; actual coverage is ${categoryRoleCounts.core} core / ${categoryRoleCounts.pairing} pairing / ${categoryRoleCounts.accessory} accessory against a 5:3:2 target.`,
      ];
  if (usesContextualFallback) {
    qualityNotes.push(
      language === "zh"
        ? "每件商品的入选原因都会标记上下文回退，发布前需要人工复核。"
        : "Contextual fallback is visible in each product reason and should be reviewed before publishing.",
    );
  }

  return {
    generationMode,
    keyword: snapshot.keyword,
    site: snapshot.site,
    language,
    selectionStrategy: {
      id: strategy,
      ...strategyMeta,
    },
    status,
    statusReason,
    intent: snapshot.intent ?? buildSearchFallbackIntent(snapshot.keyword, snapshot.products),
    generatedAt: snapshot.fetchedAt,
    source: {
      provider: snapshot.provider ?? "yami-web-search",
      searchUrl: snapshot.sourceUrl,
      note: snapshot.provider === "yami-catalog-search"
        ? language === "zh"
          ? "数据来自 Yami 商品目录接口；品牌、分类与商品身份保留为本次生成证据。"
          : "Data comes from the Yami catalog interface; brand, category, and product identities are retained as run evidence."
        : language === "zh"
          ? "目录接口不可用，本次回退到 Yami 公开搜索结果第一页。"
          : "The catalog interface was unavailable; this run fell back to page 1 of public Yami search.",
    },
    content: generationMode === "page" ? {
      eyebrow: `${siteName} · ${language === "zh" ? "Yami 精选" : "Yami edit"}`,
      headline: `${language === "zh" ? "探索" : "Explore"} ${topic}`,
      description: language === "zh"
        ? `从 Yami 美国站目录中精选 ${primary.length} 件商品，围绕${
            groupNames.length > 0 ? groupNames.join("、") : "最强搜索匹配"
          }组织页面。`
        : `A focused edit of ${primary.length} products from Yami's ${siteName} catalog, organized around ${
            groupNames.length > 0 ? groupNames.join(", ") : "the strongest search matches"
          }.`,
      tags: groupNames.length > 0
        ? groupNames
        : [language === "zh" ? "精选匹配" : "Top matches"],
      copyMode: "deterministic-template",
    } : {
      eyebrow: "",
      headline: "",
      description: "",
      tags: [],
      copyMode: "not-generated",
    },
    assetStrategy: generationMode === "page" ? {
      mode: "source-product-images",
      note: language === "zh"
        ? "使用经过验证的 Yami 商品图；当前明确禁用生成式图片编辑。"
        : "Uses verified product imagery from Yami; generative image editing is intentionally disabled.",
    } : {
      mode: "not-generated",
      note: language === "zh"
        ? "本次仅执行选品，未装配页面图片。"
        : "This run only selected products; no page imagery was assembled.",
    },
    pools: {
      primaryIds: primary.map((product) => product.id),
      relatedIds: related.map((product) => product.id),
    },
    products: [...primary, ...related],
    selectedCategories: categorySelections,
    groups,
    modules,
    workflow: [
      {
        stage: "03",
        label: language === "zh" ? "构建商品池" : "Build product pools",
        output: language === "zh"
          ? `${strategyMeta.label} · ${primary.length} 件主商品 · ${related.length} 件关联商品`
          : `${strategyMeta.label} · ${primary.length} primary · ${related.length} related`,
      },
      ...(generationMode === "page" ? [{
        stage: "04",
        label: language === "zh" ? "分配页面模块" : "Assign modules",
        output: language === "zh"
          ? `${modules.filter((module) => module.visible).length} 个显示 · ${modules.filter((module) => !module.visible).length} 个隐藏`
          : `${modules.filter((module) => module.visible).length} visible · ${modules.filter((module) => !module.visible).length} hidden`,
      } as const,
      {
        stage: "05",
        label: language === "zh" ? "生成内容" : "Compose content",
        output: language === "zh"
          ? "模板文案 · 来源商品图 · 页面预览"
          : "Template copy · source product images · page preview",
      } as const,
      {
        stage: "06",
        label: language === "zh" ? "执行自动 QA" : "Run automatic QA",
        output: status === "ready"
          ? language === "zh" ? "等待用户 Review" : "Ready for user review"
          : statusReason,
      } as const] : []),
    ],
    qualityNotes,
  };
}

export function buildTopicPagePlan(
  snapshot: YamiSearchSnapshot,
  strategy: ProductSelectionStrategy,
  language: ContentLanguage = "en",
  generationMode: TopicGenerationMode = "page",
): TopicPagePlan {
  if (strategy === "category-role") {
    throw new Error(
      "Category-role PagePlan requires a validated ProductSelectionResult; legacy category inference is disabled.",
    );
  }
  const run = advanceProductSelectionRun({
    snapshot,
    strategyRef: "relevance/default@1",
  });
  if (run.status !== "ready") {
    throw new Error("Relevance ProductSelection did not produce a ready result.");
  }
  return buildTopicPagePlanFromProductSelection(
    snapshot,
    run.result,
    language,
    generationMode,
  );
}

export function buildTopicPagePlans(
  snapshot: YamiSearchSnapshot,
  language: ContentLanguage = "en",
  generationMode: TopicGenerationMode = "page",
): TopicPlanVariants {
  return {
    relevance: buildTopicPagePlan(snapshot, "relevance", language, generationMode),
  };
}

export function buildTopicPagePlanMatrix(
  snapshot: YamiSearchSnapshot,
  generationMode: TopicGenerationMode = "page",
): TopicPlanMatrix {
  return {
    en: buildTopicPagePlans(snapshot, "en", generationMode),
    zh: buildTopicPagePlans(snapshot, "zh", generationMode),
  };
}
