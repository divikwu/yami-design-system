import type { ContentLanguage, ThemeIntent, TopicModuleId } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type {
  TopicPageContentCopyRule,
  TopicPageContentTemplateCopy,
} from "./contracts.js";

const STRICT_TEMPLATE_REFS = new Set([
  "topic-landing/brand@2",
  "topic-landing/topic@2",
  "topic-landing/campaign@2",
  "topic-landing/brand-relevance@1",
  "topic-landing/topic-relevance@1",
  "topic-landing/campaign-relevance@1",
  "topic-landing/brand-relevance@2",
  "topic-landing/topic-relevance@2",
  "topic-landing/campaign-relevance@2",
]);

const COPY_RULES: Readonly<Record<TopicModuleId, readonly TopicPageContentCopyRule[]>> = {
  hero: [
    { slot: "title", maxCharacters: 64 },
    { slot: "description", maxCharacters: 180 },
    { slot: "tags", maxCharacters: 32 },
  ],
  shortcuts: [
    { slot: "title", maxCharacters: 64 },
    { slot: "items[].label", maxCharacters: 32 },
  ],
  "start-here": [
    { slot: "title", maxCharacters: 64 },
    { slot: "scenes[].label", maxCharacters: 32 },
    { slot: "scenes[].title", maxCharacters: 72 },
    { slot: "scenes[].description", maxCharacters: 180 },
  ],
  "popular-picks": [
    { slot: "title", maxCharacters: 64 },
    { slot: "groups[].label", maxCharacters: 48 },
  ],
  "brand-spotlight": [{ slot: "title", maxCharacters: 64 }],
  reviews: [{ slot: "title", maxCharacters: 64 }],
  "explore-more": [
    { slot: "title", maxCharacters: 64 },
    { slot: "description", maxCharacters: 180 },
    { slot: "groups[].label", maxCharacters: 48 },
  ],
};

const HERO_COPY_RULES: Readonly<
  Record<ContentLanguage, readonly TopicPageContentCopyRule[]>
> = {
  zh: [
    {
      slot: "title",
      maxCharacters: 24,
      preferredLength: { minCharacters: 8, maxCharacters: 18 },
    },
    {
      slot: "description",
      maxCharacters: 80,
      preferredLength: { minCharacters: 28, maxCharacters: 50 },
    },
    { slot: "tags", maxCharacters: 32 },
  ],
  en: [
    {
      slot: "title",
      maxCharacters: 60,
      preferredLength: {
        minWords: 4,
        maxWords: 8,
        maxCharacters: 48,
      },
    },
    {
      slot: "description",
      maxCharacters: 180,
      preferredLength: {
        minWords: 14,
        maxWords: 24,
        maxCharacters: 140,
      },
    },
    { slot: "tags", maxCharacters: 32 },
  ],
};

const START_HERE_COPY_RULES: Readonly<
  Record<ContentLanguage, readonly TopicPageContentCopyRule[]>
> = {
  zh: [
    { slot: "title", maxCharacters: 64 },
    { slot: "scenes[].label", maxCharacters: 32 },
    {
      slot: "scenes[].title",
      maxCharacters: 12,
      preferredLength: { minCharacters: 4, maxCharacters: 10 },
    },
    {
      slot: "scenes[].description",
      maxCharacters: 40,
      preferredLength: { minCharacters: 14, maxCharacters: 28 },
    },
  ],
  en: [
    { slot: "title", maxCharacters: 64 },
    { slot: "scenes[].label", maxCharacters: 32 },
    {
      slot: "scenes[].title",
      maxCharacters: 30,
      preferredLength: {
        minWords: 3,
        maxWords: 4,
        maxCharacters: 26,
      },
    },
    {
      slot: "scenes[].description",
      maxCharacters: 84,
      preferredLength: {
        minWords: 8,
        maxWords: 12,
        maxCharacters: 72,
      },
    },
  ],
};

const EXPLORE_COPY_RULES: Readonly<
  Record<ContentLanguage, readonly TopicPageContentCopyRule[]>
> = {
  zh: [
    {
      slot: "title",
      maxCharacters: 20,
      preferredLength: { minCharacters: 4, maxCharacters: 12 },
    },
    { slot: "description", maxCharacters: 180 },
    { slot: "groups[].label", maxCharacters: 32 },
  ],
  en: [
    {
      slot: "title",
      maxCharacters: 48,
      preferredLength: {
        minWords: 2,
        maxWords: 5,
        maxCharacters: 40,
      },
    },
    { slot: "description", maxCharacters: 180 },
    { slot: "groups[].label", maxCharacters: 48 },
  ],
};

const TEMPLATE_COPY: Readonly<
  Record<ContentLanguage, Partial<Record<TopicModuleId, TopicPageContentTemplateCopy>>>
> = {
  zh: {
    shortcuts: { title: "精选分类" },
    "popular-picks": { title: "热门精选" },
    "brand-spotlight": { title: "精选品牌" },
    "explore-more": {
      description: "浏览更多商品选择。",
    },
  },
  en: {
    shortcuts: { title: "Featured Categories" },
    "popular-picks": { title: "Popular Picks" },
    "brand-spotlight": { title: "Featured Brands" },
    "explore-more": {
      description: "Browse more product options.",
    },
  },
};

export function topicPageCopySlots(moduleId: TopicModuleId) {
  return COPY_RULES[moduleId].map(({ slot }) => slot);
}

export function topicPageCopyRules(
  moduleId: TopicModuleId,
  language?: ContentLanguage,
) {
  if (language && moduleId === "hero") return HERO_COPY_RULES[language];
  if (language && moduleId === "start-here") return START_HERE_COPY_RULES[language];
  if (language && moduleId === "explore-more") return EXPLORE_COPY_RULES[language];
  return COPY_RULES[moduleId];
}

export function topicPageTemplateCopy(
  moduleId: TopicModuleId,
  language: ContentLanguage,
) {
  const copy = TEMPLATE_COPY[language][moduleId];
  return copy ? { ...copy } : undefined;
}

export function usesStrictPageCopyPolicy(templateRef: string) {
  return STRICT_TEMPLATE_REFS.has(templateRef);
}

export function topicPageCopyPolicyRef(templateRef: string, noviceGuided = false) {
  if (noviceGuided && usesStrictPageCopyPolicy(templateRef)) {
    return "topic-page-copy/novice-guided@3" as const;
  }
  return usesStrictPageCopyPolicy(templateRef)
    ? "topic-page-copy/evidence-bound@1" as const
    : "topic-page-copy/legacy@1" as const;
}

export function eligibleThemeIntentEvidenceIds(intent: ThemeIntent) {
  const selectedCandidate = intent.candidates.find(
    ({ id }) => id === intent.decision.selectedCandidateId,
  );
  return [...new Set([
    ...(selectedCandidate?.supportingEvidenceIds ?? []),
    ...intent.constraints
      .filter(({ status }) => status === "verified")
      .flatMap(({ evidenceIds }) => evidenceIds),
  ])];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function pageCopyProperNouns(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  keyword: string,
) {
  return [...new Set([
    keyword,
    intent.canonicalEntity?.label,
    ...selection.products.flatMap((product) => [product.brand, product.title]),
    ...selection.selectedCategories.flatMap((category) => [category.label, ...category.path]),
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0))]
    .sort((left, right) => right.length - left.length);
}

export function pageCopyUsesRequestedLanguage(
  text: string,
  language: ContentLanguage,
  properNouns: readonly string[],
) {
  const catalogAcronyms = properNouns.flatMap(
    (noun) => noun.match(/\b[A-Z]{2,}[A-Z0-9+.-]*\b/g) ?? [],
  );
  const allowedTerms = [...new Set([...properNouns, ...catalogAcronyms])]
    .sort((left, right) => right.length - left.length);
  const generatedText = allowedTerms.reduce(
    (value, noun) => value.replace(new RegExp(escapeRegExp(noun), "giu"), " "),
    text,
  );
  return language === "zh"
    ? !/\p{Script=Latin}/u.test(generatedText)
    : !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u
      .test(generatedText);
}
