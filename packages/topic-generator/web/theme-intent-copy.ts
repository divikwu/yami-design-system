import type {
  ContentLanguage,
  ThemeIntent,
} from "../src/types";

export function themeIntentDisplayCopy(
  intent: ThemeIntent,
  keyword: string,
  language: ContentLanguage,
) {
  if (language === "en") {
    return { shoppingGoal: intent.shoppingGoal, reason: intent.reason };
  }

  const entity = intent.canonicalEntity?.label ?? keyword;
  const evidenceCount = intent.categories.reduce(
    (total, category) => total + category.evidenceCount,
    0,
  );
  const shoppingGoal = intent.shoppingIntent === "browse-brand"
    ? `浏览并比较 Yami 上可售的 ${entity} 商品。`
    : intent.shoppingIntent === "find-product"
      ? intent.entityType === "category"
        ? `在 Yami 上查找并比较 ${entity} 商品。`
        : `查找符合“${keyword}”及目录约束的商品。`
      : intent.shoppingIntent === "assemble-scenario"
        ? `组合能够共同支持“${keyword}”场景的商品。`
        : `复核“${keyword}”的回退搜索结果并确认购物目标。`;

  let reason: string;
  if (intent.source === "search-fallback") {
    reason = "结构化目录接口不可用，本次结果使用公开搜索页证据，需要人工复核。";
  } else if (intent.entityType === "brand") {
    reason = `关键词精确命中目录品牌；本次目录快照中有 ${evidenceCount} 件可售商品作为证据。`;
  } else if (intent.entityType === "category") {
    reason = intent.confidence >= 0.9
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

  return { shoppingGoal, reason };
}
