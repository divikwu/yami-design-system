import type { ContentLanguage, ThemeIntent, TopicModuleId } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type {
  TopicPageContentCopyRule,
  TopicPageContentCopySlot,
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
  "popular-picks": [{ slot: "title", maxCharacters: 64 }],
  "brand-spotlight": [{ slot: "title", maxCharacters: 64 }],
  reviews: [{ slot: "title", maxCharacters: 64 }],
  "explore-more": [
    { slot: "title", maxCharacters: 64 },
    { slot: "description", maxCharacters: 180 },
  ],
};

export function topicPageCopySlots(moduleId: TopicModuleId) {
  return COPY_RULES[moduleId].map(({ slot }) => slot);
}

export function topicPageCopyRules(moduleId: TopicModuleId) {
  return COPY_RULES[moduleId];
}

export function topicPageCopyMaxCharacters(
  moduleId: TopicModuleId,
  slot: TopicPageContentCopySlot,
) {
  return COPY_RULES[moduleId].find((rule) => rule.slot === slot)?.maxCharacters;
}

export function usesStrictPageCopyPolicy(templateRef: string) {
  return STRICT_TEMPLATE_REFS.has(templateRef);
}

export function topicPageCopyPolicyRef(templateRef: string) {
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
  const generatedText = properNouns.reduce(
    (value, noun) => value.replace(new RegExp(escapeRegExp(noun), "giu"), " "),
    text,
  );
  return language === "zh"
    ? !/\p{Script=Latin}/u.test(generatedText)
    : !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u
      .test(generatedText);
}
