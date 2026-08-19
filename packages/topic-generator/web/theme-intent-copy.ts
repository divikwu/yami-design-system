import type {
  ContentLanguage,
  ThemeIntent,
} from "../src/types";

export function themeIntentDisplayCopy(
  intent: ThemeIntent,
  keyword: string,
  language: ContentLanguage,
) {
  const entity = intent.canonicalEntity?.label ?? keyword;
  if (language === "en") {
    const conclusion = intent.shopperAction === "browse"
      ? `Browse ${entity} products`
      : intent.shopperAction === "filter"
        ? `Filter products for “${keyword}”`
        : intent.shopperAction === "replenish"
          ? `Restock products for “${keyword}”`
          : intent.shopperAction === "bundle"
            ? `Build a product set for “${keyword}”`
            : intent.shopperAction === "gift"
              ? `Choose gifts for “${keyword}”`
              : intent.shopperAction === "clarify"
                ? `Clarify the shopping goal for “${keyword}”`
                : `Find products for “${keyword}”`;
    return { conclusion, shoppingGoal: intent.shoppingGoal, reason: intent.reason };
  }

  const evidenceCount = intent.categories.reduce(
    (total, category) => total + category.evidenceCount,
    0,
  );
  const shoppingGoal = intent.shoppingIntent === "browse-brand"
    ? `浏览 Yami 上可售的 ${entity} 商品。`
    : intent.shoppingIntent === "find-product"
      ? intent.entityType === "category"
        ? `在 Yami 上查找并比较与“${keyword}”匹配的商品。`
        : `查找符合“${keyword}”及目录约束的商品。`
      : intent.shoppingIntent === "assemble-scenario"
        ? `组合能够共同支持“${keyword}”场景的商品。`
        : `复核“${keyword}”的回退搜索结果并确认购物目标。`;

  let reason: string;
  if (intent.source === "search-fallback") {
    reason = "结构化目录接口不可用，本次结果使用公开搜索页证据，需要人工复核。";
  } else if (intent.entityType === "brand") {
    const categoryCoverage = intent.categories.length > 0
      ? `，覆盖 ${intent.categories.length} 个候选品类`
      : "";
    reason = `关键词精确命中 Yami 品牌目录。当前目录快照包含 ${evidenceCount} 件可售商品${categoryCoverage}；商品数表示本次检索覆盖，不代表品牌全量商品数。`;
  } else if (intent.entityType === "category") {
    reason = intent.decision.evidenceLevel === "high"
      ? "关键词精确命中已启用的目录品类，并在商品结果中得到验证。"
      : "关键词不是规范目录标签；系统根据可售商品覆盖最强的分类推断实体。";
  } else if (intent.entityType === "attribute") {
    reason = intent.canonicalEntity?.id.startsWith("tag:")
      ? "关键词直接包含目录支持的属性，并得到商品分类证据支持。"
      : "目录属性仅与关键词部分重合，完整关键词仍作为待验证的商品约束。";
  } else if (intent.entityType === "scenario") {
    reason = intent.reason.includes("Semantic Proposal")
      ? `Agent SemanticProposal 将关键词解释为购物场景，并得到 ${intent.categories.length} 个目录分类的商品证据支持。`
      : "关键词表达购物场景，目录结果覆盖多个商品分类。";
  } else {
    reason = "当前目录证据不足，需要人工复核本次判断。";
  }

  const conclusion = intent.shopperAction === "browse"
    ? `浏览 ${entity} 品牌商品`
    : intent.shopperAction === "filter"
      ? `按条件筛选“${keyword}”商品`
      : intent.shopperAction === "replenish"
        ? `补齐“${keyword}”所需商品`
        : intent.shopperAction === "bundle"
          ? `组合“${keyword}”场景商品`
          : intent.shopperAction === "gift"
            ? `为“${keyword}”挑选礼物`
            : intent.shopperAction === "clarify"
              ? `确认“${keyword}”的购物目标`
              : `查找“${keyword}”相关商品`;

  return { conclusion, shoppingGoal, reason };
}
