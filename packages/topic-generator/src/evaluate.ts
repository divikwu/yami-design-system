import { analyzeTopicIntent, type TopicIntentAnalysis } from "./analyze.js";
import type {
  IntentDecisionStatus,
  ShopperAction,
  ThemeEntityType,
  ThemeType,
} from "./types.js";

/** Live semantic-contract evaluation without freezing catalog inventory. */

export interface TopicIntentEvalExpectation {
  themeType: ThemeType;
  entityType: ThemeEntityType;
  shopperAction: ShopperAction;
  canonicalLabel?: string;
  requiredConditions?: string[];
  decisionStatus?: IntentDecisionStatus;
}

export interface TopicIntentEvalCase {
  id: string;
  keyword: string;
  description: string;
  expected: TopicIntentEvalExpectation;
}

export interface TopicIntentEvalResult {
  id: string;
  keyword: string;
  status: "passed" | "failed" | "error";
  mismatches: string[];
  actual?: {
    themeType: ThemeType;
    entityType: ThemeEntityType;
    shopperAction: ShopperAction;
    canonicalLabel: string | null;
    conditions: string[];
    decisionStatus: IntentDecisionStatus;
    evidenceLevel: TopicIntentAnalysis["intent"]["decision"]["evidenceLevel"];
  };
  error?: string;
}

export interface TopicIntentEvaluationReport {
  schemaVersion: "topic-intent-evaluation/v1";
  evaluatedAt: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    errors: number;
    passRate: number;
  };
  results: TopicIntentEvalResult[];
}

export class TopicIntentEvalInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TopicIntentEvalInputError";
  }
}

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function sameMeaning(actual: string, expected: string) {
  const left = normalized(actual);
  const right = normalized(expected);
  return left === right || left.includes(right) || right.includes(left);
}

function parseString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TopicIntentEvalInputError(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

export function parseTopicIntentEvalCases(value: unknown): TopicIntentEvalCase[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TopicIntentEvalInputError("Evaluation cases must be a non-empty array.");
  }

  const themeTypes: ThemeType[] = ["brand", "product", "activity", "uncertain"];
  const entityTypes: ThemeEntityType[] = ["brand", "category", "attribute", "scenario", "unknown"];
  const shopperActions: ShopperAction[] = [
    "browse", "find", "compare", "filter", "replenish", "bundle", "gift", "clarify",
  ];
  const decisionStatuses: IntentDecisionStatus[] = ["resolved", "ambiguous", "needs-review"];

  return value.map((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new TopicIntentEvalInputError(`cases[${index}] must be an object.`);
    }
    const record = item as Record<string, unknown>;
    if (typeof record.expected !== "object" || record.expected === null) {
      throw new TopicIntentEvalInputError(`cases[${index}].expected must be an object.`);
    }
    const expected = record.expected as Record<string, unknown>;
    if (!themeTypes.includes(expected.themeType as ThemeType)) {
      throw new TopicIntentEvalInputError(`cases[${index}].expected.themeType is unsupported.`);
    }
    if (!entityTypes.includes(expected.entityType as ThemeEntityType)) {
      throw new TopicIntentEvalInputError(`cases[${index}].expected.entityType is unsupported.`);
    }
    if (!shopperActions.includes(expected.shopperAction as ShopperAction)) {
      throw new TopicIntentEvalInputError(`cases[${index}].expected.shopperAction is unsupported.`);
    }
    if (
      expected.decisionStatus !== undefined &&
      !decisionStatuses.includes(expected.decisionStatus as IntentDecisionStatus)
    ) {
      throw new TopicIntentEvalInputError(`cases[${index}].expected.decisionStatus is unsupported.`);
    }
    if (
      expected.requiredConditions !== undefined &&
      (!Array.isArray(expected.requiredConditions) ||
        expected.requiredConditions.some((condition) => typeof condition !== "string"))
    ) {
      throw new TopicIntentEvalInputError(`cases[${index}].expected.requiredConditions must be strings.`);
    }

    return {
      id: parseString(record.id, `cases[${index}].id`),
      keyword: parseString(record.keyword, `cases[${index}].keyword`),
      description: parseString(record.description, `cases[${index}].description`),
      expected: {
        themeType: expected.themeType as ThemeType,
        entityType: expected.entityType as ThemeEntityType,
        shopperAction: expected.shopperAction as ShopperAction,
        ...(typeof expected.canonicalLabel === "string"
          ? { canonicalLabel: expected.canonicalLabel }
          : {}),
        ...(Array.isArray(expected.requiredConditions)
          ? { requiredConditions: expected.requiredConditions as string[] }
          : {}),
        ...(expected.decisionStatus
          ? { decisionStatus: expected.decisionStatus as IntentDecisionStatus }
          : {}),
      },
    };
  });
}

function compareIntent(
  testCase: TopicIntentEvalCase,
  analysis: TopicIntentAnalysis,
): TopicIntentEvalResult {
  const intent = analysis.intent;
  const mismatches: string[] = [];
  if (intent.themeType !== testCase.expected.themeType) {
    mismatches.push(`themeType: expected ${testCase.expected.themeType}, received ${intent.themeType}`);
  }
  if (intent.entityType !== testCase.expected.entityType) {
    mismatches.push(`entityType: expected ${testCase.expected.entityType}, received ${intent.entityType}`);
  }
  if (intent.shopperAction !== testCase.expected.shopperAction) {
    mismatches.push(`shopperAction: expected ${testCase.expected.shopperAction}, received ${intent.shopperAction}`);
  }
  if (
    testCase.expected.canonicalLabel &&
    !sameMeaning(intent.canonicalEntity?.label ?? "", testCase.expected.canonicalLabel)
  ) {
    mismatches.push(
      `canonicalLabel: expected ${testCase.expected.canonicalLabel}, received ${intent.canonicalEntity?.label ?? "null"}`,
    );
  }
  testCase.expected.requiredConditions?.forEach((condition) => {
    if (!intent.conditions.some((actual) => sameMeaning(actual, condition))) {
      mismatches.push(`condition: missing ${condition}`);
    }
  });
  if (
    testCase.expected.decisionStatus &&
    intent.decision.status !== testCase.expected.decisionStatus
  ) {
    mismatches.push(
      `decisionStatus: expected ${testCase.expected.decisionStatus}, received ${intent.decision.status}`,
    );
  }

  return {
    id: testCase.id,
    keyword: testCase.keyword,
    status: mismatches.length === 0 ? "passed" : "failed",
    mismatches,
    actual: {
      themeType: intent.themeType,
      entityType: intent.entityType,
      shopperAction: intent.shopperAction,
      canonicalLabel: intent.canonicalEntity?.label ?? null,
      conditions: intent.conditions,
      decisionStatus: intent.decision.status,
      evidenceLevel: intent.decision.evidenceLevel,
    },
  };
}

export async function evaluateTopicIntentCases(
  cases: TopicIntentEvalCase[],
  analyze: (keyword: string) => Promise<TopicIntentAnalysis> = analyzeTopicIntent,
): Promise<TopicIntentEvaluationReport> {
  const results: TopicIntentEvalResult[] = [];
  for (const testCase of cases) {
    try {
      results.push(compareIntent(testCase, await analyze(testCase.keyword)));
    } catch (error) {
      results.push({
        id: testCase.id,
        keyword: testCase.keyword,
        status: "error",
        mismatches: [],
        error: error instanceof Error ? error.message : "Evaluation failed.",
      });
    }
  }

  const passed = results.filter((result) => result.status === "passed").length;
  const failed = results.filter((result) => result.status === "failed").length;
  const errors = results.filter((result) => result.status === "error").length;
  return {
    schemaVersion: "topic-intent-evaluation/v1",
    evaluatedAt: new Date().toISOString(),
    summary: {
      total: results.length,
      passed,
      failed,
      errors,
      passRate: results.length > 0 ? Number((passed / results.length).toFixed(4)) : 0,
    },
    results,
  };
}
