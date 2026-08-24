import type { ContentLanguage, ThemeIntent, TopicModuleId } from "../types.js";
import type {
  TopicAudienceContext,
  TopicBackgroundEvidenceClaimType,
  TopicBackgroundEvidenceBundle,
} from "../background-evidence/contracts.js";
import { sha256Digest } from "../product-selection/digest.js";
import type {
  TopicPageContentTaskContext,
  TopicPageCopyBrief,
  TopicPageHeroStrategy,
} from "./contracts.js";

type HeroStrategyKind = TopicPageHeroStrategy["kind"];

function heroStrategyKind(templateRef: string, intent: ThemeIntent): HeroStrategyKind {
  if (templateRef.startsWith("topic-landing/brand")) return "brand";
  if (templateRef.startsWith("topic-landing/campaign")) return "campaign";
  if (templateRef.startsWith("topic-landing/topic")) return "topic";
  if (intent.themeType === "brand") return "brand";
  if (intent.themeType === "activity") return "campaign";
  return "topic";
}

function heroStrategy(
  kind: HeroStrategyKind,
  language: ContentLanguage,
): TopicPageHeroStrategy {
  const zh: Record<HeroStrategyKind, Omit<TopicPageHeroStrategy, "kind">> = {
    brand: {
      titleFocus: "优先形成对初次了解者清晰的品牌定位：在自然且简洁时，标题本身带出规范品牌名或主题关键词，并在有证据时交代品牌身份或品类与差异化定位；直接说出差异点，不用‘主张、构思、视角’等抽象包装词代替。当单一主品类有证据且能清晰代表品牌时，标题优先使用该精确品类；多品类品牌不强行收窄，优先使用有证据支持的最窄且准确的上位品类或品牌身份。没有可信上位身份时，标题保留品牌名与差异点，把具体品类范围交给说明、标签和分类导航。中文标题可在减少名词堆叠时优先采用“品牌名：差异点 + 品类身份”，但冒号和句式都不强制。仍可表达品牌定位、理念、特色或使用流程，但不套用固定句式。这只是写作偏好，不是生成门槛。",
      descriptionFocus: "补充标题未表达的品牌身份、差异化方法与用户价值，再连接到有证据支持的 2–3 个需求、选择价值或代表性品类；避免罗列完整品类，也不把‘有效’等质量或功效词当作默认定位。",
    },
    topic: {
      titleFocus: "突出主题带来的体验、用途、享用方式或选购启发，不套用固定句式。",
      descriptionFocus: "补充主题身份、独特背景、文化语境或使用价值，并结合当前商品说明主要品类、用途或场景。",
    },
    campaign: {
      titleFocus: "突出活动或节日的氛围、情感、仪式或具体场合任务，不套用固定句式。",
      descriptionFocus: "补充活动或节日语境，并结合当前商品说明礼赠、聚会、准备或其他相关场景。",
    },
  };
  const en: Record<HeroStrategyKind, Omit<TopicPageHeroStrategy, "kind">> = {
    brand: {
      titleFocus: "Prefer a clear brand position for a newcomer: when it reads naturally and stays concise, let the headline itself include the canonical brand name or topic keyword, supported category or identity context, and a distinctive position. State the distinction directly instead of hiding it behind abstract wrapper labels such as brand promise, concept, approach, or perspective. When one precise category clearly represents the brand and is supported, prefer it in the headline. For a multi-category brand, do not falsely narrow it; use the narrowest accurate supported umbrella category or identity. When no umbrella identity is supported, keep the brand and distinction in the headline and leave category breadth to the description, tags, and category navigation. A brand idea, distinction, or routine may still lead without a fixed construction. This is an editorial preference, not a generation gate.",
      descriptionFocus: "Add the identity, distinctive approach, and shopper value left unsaid by the headline, then connect them to two or three supported needs, choice benefits, or representative categories without listing the full taxonomy or treating words such as effective as default positioning.",
    },
    topic: {
      titleFocus: "Express the topic's experience, use, way to enjoy it, or shopping inspiration without forcing a fixed construction.",
      descriptionFocus: "Add the topic identity, distinctive context, cultural setting, or use value, then connect it to supported categories, uses, or scenes.",
    },
    campaign: {
      titleFocus: "Express the occasion's atmosphere, emotion, ritual, or concrete shopping task without forcing a fixed construction.",
      descriptionFocus: "Add the occasion context, then connect it to supported gifting, gathering, preparation, or other relevant scenes.",
    },
  };
  return { kind, ...(language === "zh" ? zh : en)[kind] };
}

function topicSignature(
  kind: HeroStrategyKind,
  backgroundEvidence?: TopicBackgroundEvidenceBundle,
) {
  const priorities: Record<HeroStrategyKind, readonly TopicBackgroundEvidenceClaimType[]> = {
    brand: ["meaning", "identity", "origin", "tradition", "terminology"],
    topic: ["tradition", "origin", "terminology", "identity", "meaning"],
    campaign: ["meaning", "tradition", "origin", "identity", "terminology"],
  };
  const rankedClaims = priorities[kind].flatMap((type) =>
    backgroundEvidence?.claims.filter((claim) => claim.type === type) ?? []
  );
  return {
    primaryClaimId: rankedClaims[0]?.id ?? null,
    supportingClaimIds: rankedClaims.slice(1, 2).map(({ id }) => id),
    usage: "preferred-topic-context-only" as const,
  };
}

function pageProposition(
  kind: HeroStrategyKind,
  keyword: string,
  language: ContentLanguage,
  intent: ThemeIntent,
) {
  if (kind !== "brand") return intent.shoppingGoal;
  return language === "zh"
    ? `向初次了解者说明“${keyword}”的品牌特色，并把有证据支持的品牌主张连接到相关需求、日常与商品选择。`
    : `Explain what distinguishes ${keyword}, then connect the evidence-supported brand idea to relevant needs, routines, and product choices.`;
}

function newcomerQuestions(language: ContentLanguage) {
  return language === "zh"
    ? [
        "这个主题是什么？",
        "它与我熟悉的商品或场景有什么关系？",
        "我应该从哪个品类或场景开始？",
        "每个模块会帮助我做出什么不同的选购决定？",
      ]
    : [
        "What is this topic?",
        "How does it relate to products or occasions I may already know?",
        "Which category or scenario should I start with?",
        "What different shopping decision will each section help me make?",
      ];
}

function moduleObjective(
  moduleId: TopicModuleId,
  keyword: string,
  language: ContentLanguage,
) {
  const zh: Record<TopicModuleId, string> = {
    hero: `根据 copyBrief.heroStrategy，围绕“${keyword}”写一个简短、自然、有辨识度且面向用户的核心命题，可表达品牌定位、核心体验、使用方式、选购任务或场合主张。当规范品牌名或主题关键词能够自然增强识别时，优先在标题中带出一次；这只是候选偏好，不是生成门槛，标题已经带出后不要让说明机械重复。标题可采用定位式、陈述式、动作式、情绪式或问句，不要求固定动词或句式，也不因使用“找到、探索、选择”等通用动词自动重写。百科式定义、历史、品类罗列和选购跨度通常放在说明中；如果它们本身构成自然且有价值的主题定位，也可以进入标题。说明补充标题未表达的主题身份、背景、使用价值与当前商品范围，优先一句，必要时两句，避免简单复述。主题背景与商品主张都不得超出证据，尤其不能把文化关联扩大为全部商品产地，也不能加入未获支持的感官、功效或结果主张。标签优先保留 2–3 个具体浏览方向；第四个方向确有不同价值时可以保留。标签只写证据支持的浏览方向或品类，不使用“先、再、最后、补充”等词暗示未经证据支持的护理先后。`,
    shortcuts: "模块标题使用返回的通用模板文案；标签把已选品类转译成清晰、简短的浏览入口。",
    "start-here": `模块标题概括整个主题的入门路径、流程或日常，可采用“打造你的 ${keyword} …流程 / 日常”这类上位表达，不能收窄到任一单一场景；每个场景再解释具体情境、比较顺序或选择任务。场景标题保持为紧凑的决策短语，描述用一句短句补充关键选择，不逐项罗列页面已有的所有分类，并遵守返回的场景 copyRules。`,
    "popular-picks": "模块标题使用返回的通用模板文案；商品组合、排序和标签承担具体的热门选购入口，不要把流行度或销量写成未经证实的事实。",
    "brand-spotlight": "模块标题使用返回的通用模板文案；品牌与当前主题的关系由已分配商品和品牌分组表达，不虚构品牌历史、定位或功效。",
    reviews: "只呈现已验证的评价记录；没有记录时保持模块隐藏。",
    "explore-more": `这是全页唯一可以轻量补充主题锚点的结构型标题。优先用“更多本地化主题短名选择”这类简短表达，让滚动到页面末段的用户仍能识别与“${keyword}”的关系；不要复述 Hero、罗列品类或写成分析句。主题短名加入后不自然时可使用简短通用标题。说明使用返回的通用模板文案，更深的浏览方向由标签、品类和商品分配表达。`,
  };
  const en: Record<TopicModuleId, string> = {
    hero: `Follow copyBrief.heroStrategy and write a concise, natural, distinctive, user-facing proposition for “${keyword}.” When the canonical brand name or topic keyword naturally strengthens orientation, prefer to include it once in the headline; this is a candidate preference, not a generation gate, and the description should not mechanically repeat an anchor already used in the title. It may express a brand position, core experience, way to use, shopping task, or occasion idea through a positioning line, statement, action, emotion, or question; it does not require a fixed verb or construction, and words such as find, discover, or choose are not automatic reasons to rewrite it. A dictionary definition, history, category list, or shopping range usually belongs in the description, but it may enter the headline when it is itself a natural and useful proposition. Use the description to add identity, context, use value, and the supported shopping range that the headline leaves unsaid; prefer one sentence and allow two when needed, without simply restating the headline. Keep cultural context and product claims within evidence, never turning association into blanket origin or adding unsupported sensory, efficacy, or outcome claims. Prefer 2–3 concrete browsing tags and use a fourth only when it adds a genuinely distinct direction. Tags name evidence-supported browsing directions or categories; do not use first, next, then, last, or add to imply an unsupported care order.`,
    shortcuts: "Use the returned template copy for the module heading; translate selected categories into concise browsing labels.",
    "start-here": `Make the module heading describe the whole topic journey, routine, or getting-started path, using an umbrella direction such as “Build Your ${keyword} Routine” instead of narrowing it to one scenario; keep each scene specific to its situation, sequence, or choice. Keep the scene title as a compact decision phrase and use one short description sentence for the key choice instead of enumerating every category already visible on the page; obey the returned scene copyRules.`,
    "popular-picks": "Use the returned template copy for the module heading; let product composition, ordering, and tabs carry the concrete entry point without presenting popularity or sales as an unsupported fact.",
    "brand-spotlight": "Use the returned template copy for the module heading; let assigned products and brand groups show the relationship to the topic without inventing history, positioning, or efficacy.",
    reviews: "Use verified review records only; keep the module hidden when none are available.",
    "explore-more": `This is the only structural heading that may add one light topic anchor. Prefer a compact expression such as “Explore More ${keyword}” so the relationship remains clear near the end of the page; do not repeat the Hero, list categories, or turn the heading into analysis. Use a short generic heading when adding the topic reads unnaturally. Use the returned template description, and let tabs, categories, and product assignments carry the deeper browsing directions.`,
  };
  return (language === "zh" ? zh : en)[moduleId];
}

export function topicPageCopyBriefDigest<T extends object>(brief: T) {
  const bound = { ...brief } as { digest?: string };
  delete bound.digest;
  return sha256Digest(bound);
}

export function buildTopicPageCopyBrief(options: {
  intent: ThemeIntent;
  templateRef: string;
  keyword: string;
  language: ContentLanguage;
  audienceContext: TopicAudienceContext;
  backgroundEvidence?: TopicBackgroundEvidenceBundle;
  tasks: TopicPageContentTaskContext[];
}): TopicPageCopyBrief {
  const strategy = heroStrategy(
    heroStrategyKind(options.templateRef, options.intent),
    options.language,
  );
  const brief = {
    schemaVersion: "topic-page-copy-brief/v3" as const,
    audienceContext: options.audienceContext,
    pageProposition: pageProposition(
      strategy.kind,
      options.keyword,
      options.language,
      options.intent,
    ),
    heroStrategy: strategy,
    topicSignature: topicSignature(strategy.kind, options.backgroundEvidence),
    localizationStrategy: {
      requestedLanguage: options.language,
      supportedLanguages: ["zh", "en"] as const,
      generationMode: "separate-proposals" as const,
      adaptation: "locale-native-not-literal" as const,
    },
    newcomerQuestions: newcomerQuestions(options.language),
    moduleObjectives: options.tasks.map((task) => ({
      taskId: task.taskId,
      moduleId: task.moduleId,
      objective: moduleObjective(task.moduleId, options.keyword, options.language),
      shoppingGoal: task.shoppingGoal,
      copyRules: task.copyRules.map((rule) => ({
        ...rule,
        ...(rule.preferredLength
          ? { preferredLength: { ...rule.preferredLength } }
          : {}),
      })),
      ...(task.templateCopy ? { templateCopy: { ...task.templateCopy } } : {}),
    })),
    backgroundEvidenceDigest: options.backgroundEvidence?.digest ?? null,
    backgroundEvidenceStatus: options.backgroundEvidence?.status ?? "not-provided" as const,
    evidenceRules: [
      "background-context-does-not-prove-product-performance",
      "catalog-evidence-does-not-prove-popularity",
      "every-claim-requires-an-explicit-reference",
    ] as const,
  };
  return { ...brief, digest: topicPageCopyBriefDigest(brief) };
}
