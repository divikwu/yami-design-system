import type { TopicPagePlan } from "../src/types";
import { themeIntentDisplayCopy } from "./theme-intent-copy";
import styles from "./topic-generator.module.css";

const TYPE_LABELS = {
  zh: {
    brand: "品牌主题",
    product: "商品导购",
    activity: "场景活动",
    uncertain: "需要确认",
  },
  en: {
    brand: "Brand topic",
    product: "Product guide",
    activity: "Shopping scenario",
    uncertain: "Needs review",
  },
} as const;

function joined(values: string[], emptyLabel: string) {
  return values.length > 0 ? values.join(" · ") : emptyLabel;
}

export function TopicAnalysisView({ plan }: { plan: TopicPagePlan }) {
  const zh = plan.language === "zh";
  const intent = plan.intent;
  const entityLabel = intent.canonicalEntity?.label ?? plan.keyword;
  const confidence = Math.round(intent.confidence * 100);
  const emptyLabel = zh ? "无" : "None";
  const displayCopy = themeIntentDisplayCopy(intent, plan.keyword, plan.language);

  return (
    <section
      className={styles.analysisView}
      lang={zh ? "zh-CN" : "en"}
      aria-labelledby="topic-analysis-title"
    >
      <header className={styles.analysisHeader}>
        <div>
          <span>02 · ThemeIntent</span>
          <h2 id="topic-analysis-title">{zh ? "主题词分析" : "Keyword analysis"}</h2>
          <p>
            {zh
              ? `根据 Yami 商品目录证据解释“${plan.keyword}”指向什么，以及用户希望完成什么购物任务。`
              : `Explain what “${plan.keyword}” refers to and which shopping task it expresses using Yami catalog evidence.`}
          </p>
        </div>
        <div className={styles.analysisConfidence}>
          <strong>{confidence}%</strong>
          <span>{zh ? "置信度" : "Confidence"}</span>
        </div>
      </header>

      <div className={styles.analysisSummary}>
        <article>
          <span>{zh ? "分析结论" : "Conclusion"}</span>
          <h3>{entityLabel}</h3>
          <p>
            {TYPE_LABELS[plan.language][intent.themeType]} · {intent.entityType} · {intent.shoppingIntent}
          </p>
          <strong>{displayCopy.shoppingGoal}</strong>
        </article>
        <article className={styles.analysisReason}>
          <span>{zh ? "判断原因" : "Why this result"}</span>
          <p>{displayCopy.reason}</p>
          <small>
            {zh ? "证据来源" : "Evidence source"}: {intent.source} · {intent.attributeSchemaVersion}
          </small>
        </article>
      </div>

      <section className={styles.analysisSection}>
        <header>
          <span>01</span>
          <div>
            <h3>{zh ? "购物意图与检索条件" : "Shopping intent and retrieval constraints"}</h3>
            <p>{zh ? "这些字段会约束后续商品检索。" : "These fields constrain subsequent product retrieval."}</p>
          </div>
        </header>
        <dl className={styles.analysisFields}>
          <div>
            <dt>{zh ? "原始关键词" : "Input keyword"}</dt>
            <dd>{plan.keyword}</dd>
          </div>
          <div>
            <dt>{zh ? "规范实体" : "Canonical entity"}</dt>
            <dd>{intent.canonicalEntity ? `${intent.entityType} · ${entityLabel}` : emptyLabel}</dd>
          </div>
          <div>
            <dt>{zh ? "用户需求" : "Needs"}</dt>
            <dd>{joined(intent.needs, emptyLabel)}</dd>
          </div>
          <div>
            <dt>{zh ? "必须包含" : "Must include"}</dt>
            <dd>{joined(intent.mustInclude, emptyLabel)}</dd>
          </div>
          <div>
            <dt>{zh ? "搜索词" : "Search terms"}</dt>
            <dd>{joined(intent.searchTerms, emptyLabel)}</dd>
          </div>
          <div>
            <dt>{zh ? "排除条件" : "Must exclude"}</dt>
            <dd>{joined(intent.mustExclude, emptyLabel)}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.analysisSection}>
        <header>
          <span>02</span>
          <div>
            <h3>{zh ? "目录证据" : "Catalog evidence"}</h3>
            <p>
              {zh
                ? "候选分类及其在首轮目录快照中的商品覆盖量。"
                : "Candidate categories and their product coverage in the first catalog snapshot."}
            </p>
          </div>
        </header>
        {intent.categories.length > 0 ? (
          <ol className={styles.analysisEvidence}>
            {intent.categories.map((category, index) => (
              <li key={category.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{category.label}</strong>
                  <small>{category.path.join(" / ")}</small>
                </div>
                <b>{category.evidenceCount}</b>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.analysisNoEvidence}>
            {zh
              ? "当前没有结构化分类证据；需要根据判断原因 Review 本次结果。"
              : "No structured category evidence is available; review the result using the stated reason."}
          </p>
        )}
      </section>
    </section>
  );
}
