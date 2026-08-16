import type {
  ContentLanguage,
  ProductRole,
  ProductSelectionStrategy,
  TopicCategorySelection,
  TopicGroup,
  TopicModulePlan,
  TopicPagePlan,
  TopicPlanMatrix,
  TopicPlanVariants,
  TopicProduct,
  YamiProduct,
  YamiSearchSnapshot,
} from "./types";

const PRIMARY_LIMIT = 18;
const RELATED_LIMIT = 6;

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
  Cleansers: "洁面",
  Toners: "爽肤水",
  "Serums & Essences": "精华与精粹",
  Moisturizers: "面霜与保湿",
  "Sun Care": "防晒护理",
  Masks: "面膜",
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

const ACCESSORY_PRODUCT_TYPES = new Set([
  "Kitchen & Dining",
  "Home Care",
  "Personal Care",
]);

const PAIRING_PRODUCT_TYPES = new Set([
  "Snacks",
  "Sweets",
  "Drinks",
  "Pantry",
]);

const ROLE_ORDER: ProductRole[] = ["core", "pairing", "accessory"];
const CATEGORY_LIMIT = 10;
const CATEGORY_TARGETS: Record<ProductRole, number> = {
  core: 5,
  pairing: 3,
  accessory: 2,
};
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

function productTitleMatchesTopic(product: YamiProduct, keyword: string) {
  const title = normalized(product.title);
  const phrase = normalized(keyword);
  const terms = keywordTerms(keyword);
  return Boolean(
    phrase &&
    (title.includes(phrase) || (terms.length > 0 && terms.every((term) => title.includes(term)))),
  );
}

function keywordNamesBrand(products: YamiProduct[], keyword: string) {
  const query = normalized(keyword);
  const brandMatchCount = products.filter((product) => {
    const brand = normalized(product.brand);
    return brand === query || brand.includes(query) || query.includes(brand);
  }).length;
  return brandMatchCount >= Math.min(3, products.length);
}

function deriveProductType(product: YamiProduct) {
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
  strategy: ProductSelectionStrategy,
  role: ProductRole,
  productType: string,
  pool: "primary" | "related",
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

  if (strategy !== "category-role" || pool !== "primary") return reason;
  const roleLabel = language === "zh"
    ? { core: "核心", pairing: "搭配", accessory: "周边" }[role]
    : { core: "Core", pairing: "Pairing", accessory: "Accessory" }[role];
  return `${roleLabel}${language === "zh" ? "分类" : " category"} · ${productType} · ${reason}`;
}

function buildCategoryRoleMap(products: YamiProduct[], keyword: string) {
  const productsByType = new Map<string, YamiProduct[]>();

  products.forEach((product) => {
    const productType = deriveProductType(product);
    const group = productsByType.get(productType) ?? [];
    group.push(product);
    productsByType.set(productType, group);
  });

  const roles = new Map<string, ProductRole>();
  const topicProductType = deriveProductType({
    id: "topic",
    title: keyword,
    brand: "",
    price: "",
    imageUrl: "",
    productUrl: "",
    sourceRank: 0,
  });
  const isBrandTopic = keywordNamesBrand(products, keyword);
  const hasKnownTopicType = topicProductType !== "More to Explore";

  productsByType.forEach((group, productType) => {
    const hasTitleMatch = group.some((product) =>
      productTitleMatchesTopic(product, keyword),
    );
    roles.set(
      productType,
      hasKnownTopicType && productType === topicProductType
        ? "core"
        : ACCESSORY_PRODUCT_TYPES.has(productType)
          ? "accessory"
          : PAIRING_PRODUCT_TYPES.has(productType)
            ? "pairing"
            : hasKnownTopicType
              ? "pairing"
              : isBrandTopic
                ? productType === "More to Explore"
                  ? "pairing"
                  : "core"
                : hasTitleMatch
                  ? "core"
                  : "pairing",
    );
  });

  return roles;
}

function categorySelectionReason(
  productType: string,
  role: ProductRole,
  products: YamiProduct[],
  keyword: string,
  language: ContentLanguage,
) {
  const topicProductType = deriveProductType({
    id: "topic",
    title: keyword,
    brand: "",
    price: "",
    imageUrl: "",
    productUrl: "",
    sourceRank: 0,
  });
  const isDirectTopicType = topicProductType !== "More to Explore" &&
    productType === topicProductType;
  const isBrandTopic = keywordNamesBrand(products, keyword);

  if (isDirectTopicType) {
    return language === "zh"
      ? "主题词直接对应此商品类型。"
      : "The topic directly maps to this product type.";
  }
  if (ACCESSORY_PRODUCT_TYPES.has(productType)) {
    return language === "zh"
      ? "规则识别为工具或辅助用品分类。"
      : "Rules identify this as a tool or supporting-product category.";
  }
  if (PAIRING_PRODUCT_TYPES.has(productType)) {
    return language === "zh"
      ? "规则识别为可搭配购买的食品或饮品分类。"
      : "Rules identify this as a complementary food or drink category.";
  }
  if (topicProductType !== "More to Explore" && productType !== topicProductType) {
    return language === "zh"
      ? "商品标题包含主题词，但分类不同于核心购物意图，暂归为搭配分类。"
      : "Titles contain the topic, but the category differs from the core shopping intent and remains pairing.";
  }
  if (isBrandTopic && role === "core") {
    return language === "zh"
      ? "关键词命中品牌，且该分类属于品牌的主要商品范围。"
      : "The keyword names the brand and this category is part of its main assortment.";
  }
  if (products.some((product) =>
    deriveProductType(product) === productType && productTitleMatchesTopic(product, keyword)
  )) {
    return language === "zh"
      ? "分类中的商品标题完整覆盖主题词。"
      : "Product titles in this category cover the complete topic phrase.";
  }
  return language === "zh"
    ? "来自 Yami 搜索上下文，暂归为搭配分类，等待人工 Review。"
    : "Inferred from Yami search context as a pairing category pending review.";
}

function selectCategories(
  products: YamiProduct[],
  roles: Map<string, ProductRole>,
) {
  const categoryFirstRank = new Map<string, number>();
  products.forEach((product) => {
    const productType = deriveProductType(product);
    if (!categoryFirstRank.has(productType)) {
      categoryFirstRank.set(productType, product.sourceRank);
    }
  });

  const categoriesByRole = new Map(
    ROLE_ORDER.map((role) => [
      role,
      [...new Set(
        products
          .map((product) => deriveProductType(product))
          .filter((productType) => roles.get(productType) === role),
      )].sort(
        (left, right) =>
          (categoryFirstRank.get(left) ?? Number.MAX_SAFE_INTEGER) -
          (categoryFirstRank.get(right) ?? Number.MAX_SAFE_INTEGER),
      ),
    ]),
  );

  const selectedByRole = new Map<ProductRole, string[]>(
    ROLE_ORDER.map((role) => [
      role,
      (categoriesByRole.get(role) ?? []).slice(0, CATEGORY_TARGETS[role]),
    ]),
  );
  const selectedCount = () =>
    ROLE_ORDER.reduce(
      (total, role) => total + (selectedByRole.get(role)?.length ?? 0),
      0,
    );
  const nextUnselected = (role: ProductRole) =>
    (categoriesByRole.get(role) ?? [])[selectedByRole.get(role)?.length ?? 0];
  const shortages = ROLE_ORDER.filter(
    (role) => (selectedByRole.get(role)?.length ?? 0) < CATEGORY_TARGETS[role],
  );
  const fillOrder = shortages.includes("core")
    ? (["pairing", "accessory", "core"] as ProductRole[])
    : shortages.includes("pairing")
      ? (["accessory", "core", "pairing"] as ProductRole[])
      : shortages.includes("accessory")
        ? (["core", "pairing", "accessory"] as ProductRole[])
        : ROLE_ORDER;

  while (selectedCount() < CATEGORY_LIMIT) {
    let added = false;
    for (const role of fillOrder) {
      const category = nextUnselected(role);
      if (!category) continue;
      selectedByRole.get(role)?.push(category);
      added = true;
      if (selectedCount() === CATEGORY_LIMIT) break;
    }
    if (!added) break;
  }

  return ROLE_ORDER.flatMap((role) => selectedByRole.get(role) ?? []);
}

function selectProductsByCategory(
  products: YamiProduct[],
  selectedCategories: string[],
  limit: number,
) {
  const productsByCategory = new Map(
    selectedCategories.map((category) => [
      category,
      products.filter((product) => deriveProductType(product) === category),
    ]),
  );
  const selected: YamiProduct[] = [];
  let categoryIndex = 0;

  while (selected.length < limit) {
    let added = false;
    selectedCategories.forEach((category) => {
      const product = productsByCategory.get(category)?.[categoryIndex];
      if (!product || selected.length === limit) return;
      selected.push(product);
      added = true;
    });
    if (!added) break;
    categoryIndex += 1;
  }

  return selected;
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
  strategy: ProductSelectionStrategy,
): TopicModulePlan[] {
  const usesRoles = strategy === "category-role";
  const coreProducts = primary.filter((product) => product.role === "core");
  const pairingProducts = primary.filter((product) => product.role === "pairing");
  const accessoryProducts = primary.filter((product) => product.role === "accessory");
  const coreGroups = groups.filter((group) => group.role === "core").slice(0, 5);
  const shortcutGroups = usesRoles ? coreGroups : groups.slice(0, 6);
  const groupRepresentatives = shortcutGroups.flatMap((group) =>
    group.productIds.slice(0, 1),
  );
  const startHereProducts = usesRoles
    ? coreProducts.slice(0, 2).flatMap((product, index) => [
        product.id,
        pairingProducts[index]?.id,
        accessoryProducts[index]?.id,
      ].filter((id): id is string => Boolean(id)))
    : groups.slice(0, 3).flatMap((group) => group.productIds.slice(0, 2));
  const heroProducts = usesRoles && coreProducts.length > 0 ? coreProducts : primary;
  const popularProducts = usesRoles ? coreProducts : primary;
  const exploreMoreProducts = usesRoles
    ? [...pairingProducts, ...accessoryProducts]
    : primary;
  const brand = dominantBrand(primary, keyword);
  const zh = language === "zh";

  return [
    {
      id: "hero",
      label: zh ? "主题 Hero" : "Theme Hero",
      heading: `${zh ? "探索" : "Explore"} ${displayKeyword(keyword)}`,
      description: zh
        ? "一个主题命题，由 3 张真实商品图提供证据。"
        : "One topic proposition supported by three source product images.",
      required: true,
      visible: primary.length > 0,
      productIds: heroProducts.slice(0, 3).map((product) => product.id),
      reason: zh
        ? usesRoles
          ? "使用最多 3 件核心角色商品；不生成虚构包装。"
          : "使用 PrimaryPool 前 3 件商品；不生成虚构包装。"
        : usesRoles
          ? "Uses up to three core-role products; no synthetic packaging."
          : "Uses the first three products from PrimaryPool; no synthetic packaging.",
    },
    {
      id: "shortcuts",
      label: zh ? "精选分类" : "Featured Categories",
      heading: zh ? "按类型选购" : "Shop by type",
      description: zh
        ? "依据商品标题规则生成轻量分类入口。"
        : "Product-title rules create lightweight category shortcuts.",
      required: true,
      visible: shortcutGroups.length > 1,
      productIds: groupRepresentatives,
      reason:
        shortcutGroups.length > 1
          ? zh
            ? usesRoles
              ? `展示 ${shortcutGroups.length} 个核心分类的代表商品。`
              : `展示 ${Math.min(groups.length, 6)} 个商品类型的代表商品。`
            : usesRoles
              ? `Shows one representative from each of ${shortcutGroups.length} core categories.`
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
        ? usesRoles
          ? "按核心、搭配、周边顺序展开两组商品组合。"
          : "覆盖三个主要商品类型的紧凑入口。"
        : usesRoles
          ? "Two product groups ordered as core, pairing, and accessory."
          : "A compact entry point across the three strongest product types.",
      required: false,
      visible: usesRoles
        ? coreProducts.length >= 2
        : groups.length >= 3 && primary.length >= 6,
      productIds: startHereProducts,
      reason:
        usesRoles
          ? coreProducts.length >= 2
            ? zh
              ? "已有 2 件核心商品；搭配或周边不足时保留空位，不伪造商品。"
              : "Two core products are available; missing pairing or accessory slots remain empty."
            : zh
              ? "至少需要 2 件核心商品才会显示。"
              : "Hidden until at least two core products are available."
          : groups.length >= 3 && primary.length >= 6
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
      visible: popularProducts.length >= 4,
      productIds: popularProducts.slice(0, 8).map((product) => product.id),
      reason: zh
        ? usesRoles
          ? "只使用核心角色商品，并保留各角色内的 Yami 原始顺序。"
          : "按 Yami 原始结果顺序使用最多 8 件 PrimaryPool 商品。"
        : usesRoles
          ? "Uses core-role products only and preserves Yami order within the role."
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
        ? "搜索结果不提供评论证据，因此 MVP 中隐藏。"
        : "Hidden in MVP because search results do not provide review evidence.",
    },
    {
      id: "explore-more",
      label: zh ? "探索更多" : "Explore More",
      heading: zh ? "探索更多" : "Explore more",
      description: zh
        ? usesRoles
          ? "只展示搭配和周边角色商品。"
          : "完整 PrimaryPool，按推断的商品类型分组。"
        : usesRoles
          ? "Pairing- and accessory-role products only."
          : "The complete PrimaryPool, grouped by inferred product type.",
      required: true,
      visible: exploreMoreProducts.length > 0,
      productIds: exploreMoreProducts.map((product) => product.id),
      reason: zh
        ? usesRoles
          ? "使用 PrimaryPool 中的 pairing / accessory；RelatedPool 不参与补位。"
          : "仅包含 PrimaryPool；RelatedPool 不会填充核心模块。"
        : usesRoles
          ? "Uses pairing and accessory products from PrimaryPool; RelatedPool never fills gaps."
          : "Contains PrimaryPool only; RelatedPool never fills a core module.",
    },
  ];
}

export function buildTopicPagePlan(
  snapshot: YamiSearchSnapshot,
  strategy: ProductSelectionStrategy,
  language: ContentLanguage = "en",
): TopicPagePlan {
  const directProducts = snapshot.products.filter((product) => {
    const match = productMatches(product, snapshot.keyword);
    return match.direct || match.matchedTerms.length > 0;
  });
  const minimumDirectCount = Math.min(6, snapshot.products.length);
  const usesContextualFallback = strategy === "relevance" && directProducts.length < minimumDirectCount;
  const eligiblePrimarySource = usesContextualFallback
    ? snapshot.products.slice(0, 12)
    : directProducts;
  const categoryRoles = buildCategoryRoleMap(snapshot.products, snapshot.keyword);
  const selectedCategories = selectCategories(snapshot.products, categoryRoles);
  const primarySource = strategy === "category-role"
    ? selectProductsByCategory(snapshot.products, selectedCategories, PRIMARY_LIMIT)
    : eligiblePrimarySource;
  const primaryIds = new Set(
    primarySource.slice(0, PRIMARY_LIMIT).map((product) => product.id),
  );
  const relatedSource = snapshot.products
    .filter((product) => !primaryIds.has(product.id))
    .slice(0, RELATED_LIMIT);

  const primary = primarySource.slice(0, PRIMARY_LIMIT).map<TopicProduct>((product) => {
    const productType = deriveProductType(product);
    const localizedProductType = productTypeLabel(productType, language);
    const role = categoryRoles.get(productType) ?? "pairing";
    return {
      ...product,
      pool: "primary",
      role,
      productType,
      productTypeLabel: localizedProductType,
      selectionReason: selectionReason(
        product,
        snapshot.keyword,
        usesContextualFallback,
        strategy,
        role,
        localizedProductType,
        "primary",
        language,
      ),
    };
  });
  const related = relatedSource.map<TopicProduct>((product) => {
    const productType = deriveProductType(product);
    const localizedProductType = productTypeLabel(productType, language);
    const role = categoryRoles.get(productType) ?? "pairing";
    return {
      ...product,
      pool: "related",
      role,
      productType,
      productTypeLabel: localizedProductType,
      selectionReason: selectionReason(
        product,
        snapshot.keyword,
        false,
        strategy,
        role,
        localizedProductType,
        "related",
        language,
      ),
    };
  });
  const categorySelections = strategy === "category-role"
    ? selectedCategories.map<TopicCategorySelection>((productType) => {
        const role = categoryRoles.get(productType) ?? "pairing";
        return {
          id: slug(productType),
          label: productTypeLabel(productType, language),
          role,
          source: "inferred-product-type",
          productIds: primary
            .filter((product) => product.productType === productType)
            .map((product) => product.id),
          reason: categorySelectionReason(
            productType,
            role,
            snapshot.products,
            snapshot.keyword,
            language,
          ),
        };
      })
    : [];
  const groups = buildGroups(primary);
  const modules = createModules(primary, groups, snapshot.keyword, language, strategy);
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
  } else if (hasInsufficientCategoryCoverage) {
    status = "degraded";
    statusReason = language === "zh"
      ? `仅识别到 ${categorySelections.length} 个候选分类（${categoryRoleCounts.core} core / ${categoryRoleCounts.pairing} pairing / ${categoryRoleCounts.accessory} accessory），需要人工 Review。`
      : `Only ${categorySelections.length} candidate categories were identified (${categoryRoleCounts.core} core / ${categoryRoleCounts.pairing} pairing / ${categoryRoleCounts.accessory} accessory); manual review is required.`;
  } else if (usesContextualFallback || primary.length < 8) {
    status = "degraded";
    statusReason = usesContextualFallback
      ? language === "zh"
        ? "标题或品牌的直接匹配不足，已将 Yami 排名前列结果作为上下文候选。"
        : "Too few literal title or brand matches; top-ranked Yami results were used as contextual candidates."
      : language === "zh"
        ? "PrimaryPool 可用，但少于 8 件的目标数量。"
        : "The PrimaryPool is usable but smaller than the eight-product target.";
  }

  const qualityNotes = language === "zh"
    ? [
        "商品目录固定为 Yami 美国站；规划器不会推断站点。",
        "构建商品池前会移除不可售商品卡片。",
        "价格不在当前页面展示，也不参与过滤、相关性或模块排序。",
        "所有可见页面模块仅使用 PrimaryPool 商品。",
        "MVP 使用模板文案并保留来源商品图，确保商品身份不变。",
        strategy === "relevance"
          ? "精准匹配在关键词和品牌匹配后保留 Yami 原始顺序。"
          : `分类由当前商品快照推断；实际为 ${categoryRoleCounts.core} core / ${categoryRoleCounts.pairing} pairing / ${categoryRoleCounts.accessory} accessory，目标配比为 5:3:2。`,
      ]
    : [
        "Catalog is fixed to Yami United States; site is never inferred by the planner.",
        "Unavailable cards are removed before pool construction.",
        "Price is not displayed and is never used for filtering, relevance, or module order.",
        "All visible page modules use PrimaryPool products only.",
        "Copy is template-based and source images preserve product identity in this MVP.",
        strategy === "relevance"
          ? "Precise relevance preserves Yami order after keyword and brand matching."
          : `Categories are inferred from the current product snapshot; actual coverage is ${categoryRoleCounts.core} core / ${categoryRoleCounts.pairing} pairing / ${categoryRoleCounts.accessory} accessory against a 5:3:2 target.`,
      ];
  if (usesContextualFallback) {
    qualityNotes.push(
      language === "zh"
        ? "每件商品的入选原因都会标记上下文回退，发布前需要人工 Review。"
        : "Contextual fallback is visible in each product reason and should be reviewed before publishing.",
    );
  }

  return {
    keyword: snapshot.keyword,
    site: snapshot.site,
    language,
    selectionStrategy: {
      id: strategy,
      ...strategyMeta,
    },
    status,
    statusReason,
    generatedAt: snapshot.fetchedAt,
    source: {
      provider: "yami-web-search",
      searchUrl: snapshot.sourceUrl,
      note: language === "zh"
        ? "数据来自 Yami 公开搜索结果第一页；目录 API 可用后替换此数据源。"
        : "Public Yami search page, page 1. Replace this provider when the catalog API is available.",
    },
    content: {
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
    },
    assetStrategy: {
      mode: "source-product-images",
      note: language === "zh"
        ? "使用经过验证的 Yami 商品图；当前明确禁用生成式图片编辑。"
        : "Uses verified product imagery from Yami; generative image editing is intentionally disabled.",
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
      {
        stage: "04",
        label: language === "zh" ? "分配页面模块" : "Assign modules",
        output: language === "zh"
          ? `${modules.filter((module) => module.visible).length} 个显示 · ${modules.filter((module) => !module.visible).length} 个隐藏`
          : `${modules.filter((module) => module.visible).length} visible · ${modules.filter((module) => !module.visible).length} hidden`,
      },
      {
        stage: "05",
        label: language === "zh" ? "生成内容" : "Compose content",
        output: language === "zh"
          ? "模板文案 · 来源商品图 · 页面预览"
          : "Template copy · source product images · page preview",
      },
      {
        stage: "06",
        label: language === "zh" ? "执行自动 QA" : "Run automatic QA",
        output: status === "ready"
          ? language === "zh" ? "等待用户 Review" : "Ready for user review"
          : statusReason,
      },
    ],
    qualityNotes,
  };
}

export function buildTopicPagePlans(
  snapshot: YamiSearchSnapshot,
  language: ContentLanguage = "en",
): TopicPlanVariants {
  return {
    relevance: buildTopicPagePlan(snapshot, "relevance", language),
    "category-role": buildTopicPagePlan(snapshot, "category-role", language),
  };
}

export function buildTopicPagePlanMatrix(snapshot: YamiSearchSnapshot): TopicPlanMatrix {
  return {
    en: buildTopicPagePlans(snapshot, "en"),
    zh: buildTopicPagePlans(snapshot, "zh"),
  };
}
