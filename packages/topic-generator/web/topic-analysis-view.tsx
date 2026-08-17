import type { ContentLanguage, TopicPagePlan } from "../src/types";
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

const ENTITY_LABELS = {
  zh: {
    brand: "目录品牌",
    category: "目录品类",
    attribute: "商品属性",
    scenario: "购物场景",
    unknown: "尚未归一",
  },
  en: {
    brand: "Catalog brand",
    category: "Catalog category",
    attribute: "Product attribute",
    scenario: "Shopping scenario",
    unknown: "Not normalized",
  },
} as const;

const ACTION_LABELS = {
  zh: {
    browse: "浏览品牌",
    find: "查找商品",
    compare: "比较商品",
    filter: "按条件筛选",
    replenish: "补货补给",
    bundle: "组合选购",
    gift: "挑选礼物",
    clarify: "确认目标",
  },
  en: {
    browse: "Browse brand",
    find: "Find products",
    compare: "Compare products",
    filter: "Filter by conditions",
    replenish: "Restock",
    bundle: "Build a set",
    gift: "Choose gifts",
    clarify: "Clarify goal",
  },
} as const;

function joined(values: string[], emptyLabel: string) {
  return values.length > 0 ? values.join(" · ") : emptyLabel;
}

function AnalysisValueList({ values, emptyLabel }: { values: string[]; emptyLabel: string }) {
  if (values.length === 0) return <>{emptyLabel}</>;

  return (
    <ul className={styles.analysisValueList}>
      {values.map((value, index) => (
        <li key={`${value}-${index}`}>{value}</li>
      ))}
    </ul>
  );
}

const EVIDENCE_LEVEL_LABELS = {
  zh: { high: "高证据", medium: "中证据", low: "低证据" },
  en: { high: "High evidence", medium: "Medium evidence", low: "Low evidence" },
} as const;

const DECISION_STATUS_LABELS = {
  zh: { resolved: "已确认", ambiguous: "存在歧义", "needs-review": "需要复核" },
  en: { resolved: "Resolved", ambiguous: "Ambiguous", "needs-review": "Needs review" },
} as const;

const CONSTRAINT_STATUS_LABELS = {
  zh: { verified: "已验证", unverified: "待验证", rejected: "已拒绝" },
  en: { verified: "Verified", unverified: "Unverified", rejected: "Rejected" },
} as const;

const SOURCE_LABELS = {
  zh: {
    "catalog-evidence": "Yami 结构化目录",
    "search-fallback": "Yami 公开搜索",
  },
  en: {
    "catalog-evidence": "Yami structured catalog",
    "search-fallback": "Yami public search",
  },
} as const;

export function TopicAnalysisView({
  plan,
  uiLanguage = plan.language,
}: {
  plan: TopicPagePlan;
  uiLanguage?: ContentLanguage;
}) {
  const zh = uiLanguage === "zh";
  const intent = plan.intent;
  const entityLabel = intent.canonicalEntity?.label ?? plan.keyword;
  const emptyLabel = zh ? "无" : "None";
  const displayCopy = themeIntentDisplayCopy(intent, plan.keyword, uiLanguage);
  const actionLabel = ACTION_LABELS[uiLanguage][intent.shopperAction];
  const entityTypeLabel = ENTITY_LABELS[uiLanguage][intent.entityType];
  const unverifiedCount = intent.constraints.filter(({ status }) => status === "unverified").length;
  const conditionValue = joined(
    intent.conditions,
    zh ? "无附加条件" : "No additional conditions",
  );
  const conditionNote = intent.conditions.length === 0
    ? zh ? `仅使用${entityTypeLabel}进行检索` : `Retrieve using the ${entityTypeLabel.toLowerCase()} only`
    : unverifiedCount > 0
      ? zh ? `${unverifiedCount} 项仍需商品详情验证` : `${unverifiedCount} item(s) still require product-detail evidence`
      : zh ? "条件已获得目录证据" : "Conditions have catalog evidence";
  const hasCandidates = intent.candidates.length > 1;
  const competingCandidates = intent.candidates.filter(
    (candidate) => candidate.id !== intent.decision.selectedCandidateId,
  );
  const showCandidateReview = hasCandidates && intent.decision.status !== "resolved";
  const showResolvedAlternatives = competingCandidates.length > 0 && intent.decision.status === "resolved";
  const rulesSectionNumber = showCandidateReview ? "03" : "02";
  const evidenceSectionNumber = showCandidateReview ? "04" : "03";
  const maxCategoryEvidence = Math.max(
    1,
    ...intent.categories.map((category) => category.evidenceCount),
  );

  return (
    <section
      className={styles.analysisView}
      lang={zh ? "zh-CN" : "en"}
      aria-labelledby="topic-analysis-title"
    >
      <header className={styles.analysisHeader}>
        <div>
          <span>{zh ? "关键词分析&购物预测" : "Keyword analysis & shopping prediction"}</span>
          <h2 id="topic-analysis-title">{plan.keyword}</h2>
          <p>
            {zh
              ? `把“${plan.keyword}”拆解为目录实体、购物动作和检索条件，并展示可核验依据。`
              : `Break “${plan.keyword}” into a catalog entity, shopper action, and retrieval conditions with reviewable evidence.`}
          </p>
        </div>
        <div className={styles.analysisConfidence}>
          <strong>{EVIDENCE_LEVEL_LABELS[uiLanguage][intent.decision.evidenceLevel]}</strong>
          <span>{DECISION_STATUS_LABELS[uiLanguage][intent.decision.status]}</span>
        </div>
      </header>

      <div className={styles.analysisSummary}>
        <article className={styles.analysisConclusion}>
          <span>{zh ? "一句话结论" : "Conclusion"}</span>
          <h3>{displayCopy.conclusion}</h3>
          <p>{TYPE_LABELS[uiLanguage][intent.themeType]} · {actionLabel}</p>
          <div className={styles.analysisCanonical}>
            <small>{zh ? "目录归一" : "Catalog normalization"}</small>
            <strong>{entityLabel}</strong>
          </div>
        </article>
        <article className={styles.analysisReason}>
          <span>{zh ? "为什么这样判断" : "Why this result"}</span>
          <p>{displayCopy.reason}</p>
          <div className={styles.analysisReasonMeta}>
            <span>{DECISION_STATUS_LABELS[uiLanguage][intent.decision.status]}</span>
            <span>{SOURCE_LABELS[uiLanguage][intent.source]} · {intent.attributeSchemaVersion}</span>
          </div>
        </article>
      </div>

      <section className={styles.analysisSection}>
        <header>
          <span>01</span>
          <div>
            <h3>{zh ? "分析拆解" : "Analysis breakdown"}</h3>
            <p>{zh ? "从主题词到可执行检索，共三步。" : "Three steps turn the keyword into an executable retrieval plan."}</p>
          </div>
        </header>
        <ol className={styles.analysisBreakdown}>
          <li>
            <div>
              <small>{zh ? "识别对象" : "Entity"}</small>
              <strong>{entityLabel}</strong>
              <p>{entityTypeLabel}</p>
            </div>
          </li>
          <li>
            <div>
              <small>{zh ? "购物任务" : "Shopping task"}</small>
              <strong>{actionLabel}</strong>
              <p>{displayCopy.shoppingGoal}</p>
            </div>
          </li>
          <li>
            <div>
              <small>{zh ? "附加条件" : "Conditions"}</small>
              <strong>{conditionValue}</strong>
              <p>{conditionNote}</p>
            </div>
          </li>
        </ol>
      </section>

      {showCandidateReview ? (
        <section className={styles.analysisSection}>
          <header>
            <span>02</span>
            <div>
              <h3>{zh ? "候选解释" : "Interpretation candidates"}</h3>
              <p>
                {zh
                  ? "同时保留目录支持的其他解释；候选接近时不会伪装成确定结论。"
                  : "Keep other catalog-supported interpretations instead of hiding close alternatives."}
              </p>
            </div>
          </header>
          <ol className={styles.analysisEvidence}>
            {intent.candidates.map((candidate, index) => (
              <li key={candidate.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{candidate.canonicalEntity?.label ?? plan.keyword}</strong>
                  <small>{ENTITY_LABELS[uiLanguage][candidate.entityType]} · {ACTION_LABELS[uiLanguage][candidate.shopperAction]}</small>
                </div>
                <b>{EVIDENCE_LEVEL_LABELS[uiLanguage][candidate.evidenceLevel]}</b>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {showResolvedAlternatives ? (
        <details className={styles.analysisAlternatives}>
          <summary>
            <div>
              <strong>{zh ? "其他目录解释" : "Other catalog interpretations"}</strong>
              <small>
                {zh
                  ? `${competingCandidates.length} 项 · 当前结论已确认，展开可审阅低优先级解释`
                  : `${competingCandidates.length} item(s) · The current result is resolved; expand to review lower-priority interpretations`}
              </small>
            </div>
            <b aria-hidden="true" />
          </summary>
          <ol className={styles.analysisEvidence}>
            {competingCandidates.map((candidate, index) => (
              <li key={candidate.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{candidate.canonicalEntity?.label ?? plan.keyword}</strong>
                  <small>{ENTITY_LABELS[uiLanguage][candidate.entityType]} · {ACTION_LABELS[uiLanguage][candidate.shopperAction]}</small>
                </div>
                <b>{EVIDENCE_LEVEL_LABELS[uiLanguage][candidate.evidenceLevel]}</b>
              </li>
            ))}
          </ol>
        </details>
      ) : null}

      <section className={styles.analysisSection}>
        <header>
          <span>{rulesSectionNumber}</span>
          <div>
            <h3>{zh ? "检索边界" : "Retrieval boundaries"}</h3>
            <p>{zh ? "后续检索只使用这些边界；待验证条件不会被当作事实。" : "Downstream retrieval uses only these boundaries; unverified conditions are not treated as facts."}</p>
          </div>
        </header>
        <dl className={styles.analysisRules}>
          <div>
            <dt>{zh ? "必须满足" : "Must match"}</dt>
            <dd>
              <AnalysisValueList
                values={intent.constraints.map((constraint) =>
                  `${constraint.value}（${CONSTRAINT_STATUS_LABELS[uiLanguage][constraint.status]}）`
                )}
                emptyLabel={emptyLabel}
              />
            </dd>
          </div>
          <div>
            <dt>{zh ? "召回词" : "Retrieval terms"}</dt>
            <dd><AnalysisValueList values={intent.searchTerms} emptyLabel={emptyLabel} /></dd>
          </div>
          <div>
            <dt>{zh ? "目录范围" : "Catalog scope"}</dt>
            <dd><AnalysisValueList values={intent.needs} emptyLabel={emptyLabel} /></dd>
          </div>
          <div>
            <dt>{zh ? "排除条件" : "Must exclude"}</dt>
            <dd><AnalysisValueList values={intent.mustExclude} emptyLabel={emptyLabel} /></dd>
          </div>
        </dl>
      </section>

      <section className={styles.analysisSection}>
        <header>
          <span>{evidenceSectionNumber}</span>
          <div>
            <h3>{zh ? "目录证据" : "Catalog evidence"}</h3>
            <p>
              {zh
                ? `${intent.categories.length} 个候选品类；条形长度表示首轮目录快照中的商品覆盖量。`
                : `${intent.categories.length} candidate categories; bar length represents product coverage in the first catalog snapshot.`}
            </p>
          </div>
        </header>
        {intent.categories.length > 0 ? (
          <ol className={styles.analysisCatalogEvidence}>
            {intent.categories.map((category, index) => {
              const parentPath = category.path[category.path.length - 1] === category.label
                ? category.path.slice(0, -1)
                : category.path;
              const evidenceRatio = category.evidenceCount > 0
                ? Math.max(2, Math.round((category.evidenceCount / maxCategoryEvidence) * 100))
                : 0;

              return (
                <li
                  key={category.id}
                  className={index === 0
                    ? styles.analysisCatalogEvidenceLead
                    : undefined}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div className={styles.analysisCatalogLabel}>
                    <strong>{category.label}</strong>
                    <small>{parentPath.join(" / ") || (zh ? "目录根级" : "Catalog root")}</small>
                  </div>
                  <div className={styles.analysisCatalogMeter} aria-hidden="true">
                    <span style={{ width: `${evidenceRatio}%` }} />
                  </div>
                  <b>{category.evidenceCount}{zh ? " 件" : ""}</b>
                </li>
              );
            })}
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
