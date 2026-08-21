import type { ContentLanguage, ThemeIntent, TopicModuleId } from "../types.js";
import type {
  TopicAudienceContext,
  TopicBackgroundEvidenceBundle,
} from "../background-evidence/contracts.js";
import { sha256Digest } from "../product-selection/digest.js";
import type {
  TopicPageContentTaskContext,
  TopicPageCopyBrief,
} from "./contracts.js";

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
    hero: `先用可核验的背景说明“${keyword}”是什么，再把这个身份连接到一个由当前品类、商品或场景支持的具体选购起点；不能只写“认识 / 浏览 ${keyword}”。`,
    shortcuts: "把已选品类转译成清晰的入门路径；标题说明按什么维度进入，标签帮助用户预判点击后能比较什么，而不是只复制目录名称。",
    "start-here": "解释每个选购场景中的用户情境、比较顺序或选择任务，以及用户为何可以从这里开始；不能只说查看该场景商品。",
    "popular-picks": "用已分配商品或品类点明这组商品的实际比较轴或搭配任务；不能只写精选、热门、跨品类比较或浏览商品，模块名也不能被当作流行度或销量证据。",
    "brand-spotlight": "使用可核验背景说明品牌与当前主题的具体关系，并给出下一步浏览理由；不虚构品牌历史、定位或功效。",
    reviews: "只呈现已验证的评价记录；没有记录时保持模块隐藏。",
    "explore-more": "给出与前面不同的查漏补缺或深入比较方向，并点明哪些当前品类支撑这一步；不能只写继续浏览、探索更多或完整品类。",
  };
  const en: Record<TopicModuleId, string> = {
    hero: `Use verified background to explain what “${keyword}” is, then connect that identity to one concrete entry point supported by the current categories, products, or scenes; do not stop at “meet / browse ${keyword}.”`,
    shortcuts: "Translate selected categories into entry paths: the heading names the navigation dimension and labels preview what shoppers can compare instead of merely repeating catalog labels.",
    "start-here": "Explain each scenario's shopper situation, comparison sequence, or decision and why a newcomer might start there; do not merely say to view the scene's products.",
    "popular-picks": "Name the actual comparison axis or pairing job supported by assigned products or categories; do not stop at picks, popular, cross-category comparison, or browse products, and never treat the module name as popularity or sales evidence.",
    "brand-spotlight": "Use verified background to explain the brand's specific relationship to the topic and a next browsing reason without inventing history, positioning, or efficacy.",
    reviews: "Use verified review records only; keep the module hidden when none are available.",
    "explore-more": "Offer a gap-filling or deeper comparison direction that differs from earlier modules and name which current categories support it; do not stop at explore more, keep browsing, or the full assortment.",
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
  keyword: string;
  language: ContentLanguage;
  audienceContext: TopicAudienceContext;
  backgroundEvidence?: TopicBackgroundEvidenceBundle;
  tasks: TopicPageContentTaskContext[];
}): TopicPageCopyBrief {
  const brief = {
    schemaVersion: "topic-page-copy-brief/v2" as const,
    audienceContext: options.audienceContext,
    pageProposition: options.intent.shoppingGoal,
    newcomerQuestions: newcomerQuestions(options.language),
    moduleObjectives: options.tasks.map((task) => ({
      taskId: task.taskId,
      moduleId: task.moduleId,
      objective: moduleObjective(task.moduleId, options.keyword, options.language),
      shoppingGoal: task.shoppingGoal,
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
