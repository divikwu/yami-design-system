import type { ProductRole } from "../types.js";
import type { ProductSelectionStrategyRef } from "./config.js";
import type { CatalogCandidateSnapshot, ProductSelectionRun } from "./contracts.js";
import type {
  CatalogCandidateQualityReport,
  CatalogCandidateQualityStatus,
} from "./quality.js";

const MODULE_IDS = ["popular-picks", "brand-spotlight", "explore-more"] as const;
type GoldenModuleId = (typeof MODULE_IDS)[number];

export interface ProductSelectionGoldenCase {
  id: string;
  keyword: string;
  description: string;
  themeKind: "brand" | "category" | "scenario";
  strategyRef: ProductSelectionStrategyRef;
  expected: {
    categoryRoleDistribution: Record<ProductRole, number>;
    candidateAttempts: { total: number; succeeded: number };
    maximumQualityStatus: CatalogCandidateQualityStatus;
    scenes: { minimum: number; maximum: number; groupsPerScene: number };
    moduleGroups: Record<GoldenModuleId, {
      minimum: number;
      maximum: number;
      productsPerGroup: { minimum: number; maximum: number };
    }>;
    relatedPoolSize: number;
    maximumCrossModuleDuplicates: number;
  };
}

export interface ProductSelectionGoldenCases {
  schemaVersion: "product-selection-golden-cases/v1";
  cases: ProductSelectionGoldenCase[];
}

export interface ProductSelectionGoldenEvaluation {
  schemaVersion: "product-selection-golden-evaluation/v1";
  caseId: string;
  keyword: string;
  strategyRef: ProductSelectionStrategyRef;
  status: "passed" | "failed";
  mismatches: string[];
}

export interface ProductSelectionGoldenInput {
  run: ProductSelectionRun;
  candidateSnapshot?: CatalogCandidateSnapshot;
  candidateQualityReport?: CatalogCandidateQualityReport;
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  return value;
}

function numberValue(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
  return value;
}

function rangeValue(value: unknown, label: string) {
  const range = objectValue(value, label);
  return {
    minimum: numberValue(range.minimum, `${label} minimum`),
    maximum: numberValue(range.maximum, `${label} maximum`),
  };
}

export function parseProductSelectionGoldenCases(value: unknown): ProductSelectionGoldenCases {
  const document = objectValue(value, "ProductSelection golden cases");
  if (document.schemaVersion !== "product-selection-golden-cases/v1") {
    throw new Error('ProductSelection golden cases schemaVersion must be "product-selection-golden-cases/v1".');
  }
  if (!Array.isArray(document.cases)) {
    throw new Error("ProductSelection golden cases must contain a cases array.");
  }
  const defaults = document.defaults === undefined
    ? {}
    : objectValue(document.defaults, "ProductSelection golden defaults");
  const cases = document.cases.map((rawCase, caseIndex) => {
    const goldenCase = objectValue(rawCase, `Golden case ${caseIndex}`);
    const expected = objectValue(
      goldenCase.expected ?? defaults.expected,
      `Golden case ${caseIndex} expected`,
    );
    const distribution = objectValue(
      expected.categoryRoleDistribution,
      `Golden case ${caseIndex} categoryRoleDistribution`,
    );
    const attempts = objectValue(
      expected.candidateAttempts,
      `Golden case ${caseIndex} candidateAttempts`,
    );
    const scenes = objectValue(expected.scenes, `Golden case ${caseIndex} scenes`);
    const rawModuleGroups = objectValue(
      expected.moduleGroups,
      `Golden case ${caseIndex} moduleGroups`,
    );
    const rawMaximumQualityStatus = expected.maximumQualityStatus;
    if (rawMaximumQualityStatus !== "ok" && rawMaximumQualityStatus !== "warning" && rawMaximumQualityStatus !== "error") {
      throw new Error(`Golden case ${caseIndex} maximumQualityStatus is invalid.`);
    }
    const maximumQualityStatus: CatalogCandidateQualityStatus = rawMaximumQualityStatus;
    const rawThemeKind = goldenCase.themeKind;
    if (rawThemeKind !== "brand" && rawThemeKind !== "category" && rawThemeKind !== "scenario") {
      throw new Error(`Golden case ${caseIndex} themeKind is invalid.`);
    }
    const themeKind: ProductSelectionGoldenCase["themeKind"] = rawThemeKind;
    const moduleGroups = Object.fromEntries(MODULE_IDS.map((moduleId) => {
      const moduleGroup = objectValue(
        rawModuleGroups[moduleId],
        `Golden case ${caseIndex} ${moduleId}`,
      );
      return [moduleId, {
        ...rangeValue(moduleGroup, `Golden case ${caseIndex} ${moduleId}`),
        productsPerGroup: rangeValue(
          moduleGroup.productsPerGroup,
          `Golden case ${caseIndex} ${moduleId} productsPerGroup`,
        ),
      }];
    })) as ProductSelectionGoldenCase["expected"]["moduleGroups"];
    return {
      id: stringValue(goldenCase.id, `Golden case ${caseIndex} id`),
      keyword: stringValue(goldenCase.keyword, `Golden case ${caseIndex} keyword`),
      description: stringValue(goldenCase.description, `Golden case ${caseIndex} description`),
      themeKind,
      strategyRef: stringValue(
        goldenCase.strategyRef ?? defaults.strategyRef,
        `Golden case ${caseIndex} strategyRef`,
      ) as ProductSelectionStrategyRef,
      expected: {
        categoryRoleDistribution: {
          core: numberValue(distribution.core, `Golden case ${caseIndex} core count`),
          pairing: numberValue(distribution.pairing, `Golden case ${caseIndex} pairing count`),
          accessory: numberValue(distribution.accessory, `Golden case ${caseIndex} accessory count`),
        },
        candidateAttempts: {
          total: numberValue(attempts.total, `Golden case ${caseIndex} attempt total`),
          succeeded: numberValue(attempts.succeeded, `Golden case ${caseIndex} succeeded attempts`),
        },
        maximumQualityStatus,
        scenes: {
          ...rangeValue(scenes, `Golden case ${caseIndex} scenes`),
          groupsPerScene: numberValue(
            scenes.groupsPerScene,
            `Golden case ${caseIndex} groupsPerScene`,
          ),
        },
        moduleGroups,
        relatedPoolSize: numberValue(
          expected.relatedPoolSize,
          `Golden case ${caseIndex} relatedPoolSize`,
        ),
        maximumCrossModuleDuplicates: numberValue(
          expected.maximumCrossModuleDuplicates,
          `Golden case ${caseIndex} maximumCrossModuleDuplicates`,
        ),
      },
    };
  });
  return { schemaVersion: "product-selection-golden-cases/v1", cases };
}

export function evaluateProductSelectionGoldenCase(
  goldenCase: ProductSelectionGoldenCase,
  input: ProductSelectionGoldenInput,
): ProductSelectionGoldenEvaluation {
  const mismatches: string[] = [];
  if (input.run.status !== "ready") {
    mismatches.push(`Selection run expected ready but received ${input.run.status}.`);
  } else {
    const result = input.run.result;
    if (result.keyword !== goldenCase.keyword) {
      mismatches.push(`Keyword expected ${goldenCase.keyword} but received ${result.keyword}.`);
    }
    if (result.strategyRef !== goldenCase.strategyRef) {
      mismatches.push(`Strategy expected ${goldenCase.strategyRef} but received ${result.strategyRef}.`);
    }
    (["core", "pairing", "accessory"] as const).forEach((role) => {
      const actual = result.selectedCategories.filter((category) => category.role === role).length;
      const expected = goldenCase.expected.categoryRoleDistribution[role];
      if (actual !== expected) {
        mismatches.push(`${role} category count expected ${expected} but received ${actual}.`);
      }
    });
    const sceneCount = result.scenes.length;
    const sceneExpected = goldenCase.expected.scenes;
    if (sceneCount < sceneExpected.minimum || sceneCount > sceneExpected.maximum) {
      mismatches.push(`Scene count expected ${sceneExpected.minimum}-${sceneExpected.maximum} but received ${sceneCount}.`);
    }
    result.scenes.forEach((scene) => {
      if (scene.productGroups.length !== sceneExpected.groupsPerScene) {
        mismatches.push(`Scene ${scene.id} group count expected ${sceneExpected.groupsPerScene} but received ${scene.productGroups.length}.`);
      }
    });
    MODULE_IDS.forEach((moduleId) => {
      const module = result.modules.find(({ id }) => id === moduleId);
      const actual = module?.groups.length ?? 0;
      const expected = goldenCase.expected.moduleGroups[moduleId];
      if (actual < expected.minimum || actual > expected.maximum) {
        mismatches.push(`${moduleId} group count expected ${expected.minimum}-${expected.maximum} but received ${actual}.`);
      }
      module?.groups.forEach((group) => {
        const productCount = group.productIds.length;
        const quota = expected.productsPerGroup;
        if (productCount < quota.minimum || productCount > quota.maximum) {
          mismatches.push(`${moduleId} group ${group.id} product count expected ${quota.minimum}-${quota.maximum} but received ${productCount}.`);
        }
      });
    });
    if (result.pools.relatedIds.length !== goldenCase.expected.relatedPoolSize) {
      mismatches.push(`Related pool size expected ${goldenCase.expected.relatedPoolSize} but received ${result.pools.relatedIds.length}.`);
    }
    const moduleProductIds = result.modules.flatMap(({ productIds }) => productIds);
    const crossModuleDuplicates = moduleProductIds.length - new Set(moduleProductIds).size;
    if (crossModuleDuplicates > goldenCase.expected.maximumCrossModuleDuplicates) {
      mismatches.push(`Cross-module duplicates expected at most ${goldenCase.expected.maximumCrossModuleDuplicates} but received ${crossModuleDuplicates}.`);
    }
  }

  const attempts = input.candidateSnapshot?.source.attempts;
  if (!attempts) {
    mismatches.push("Candidate request evidence is missing.");
  } else {
    const succeeded = attempts.filter(({ status }) => status === "succeeded").length;
    if (attempts.length !== goldenCase.expected.candidateAttempts.total) {
      mismatches.push(`Candidate attempt count expected ${goldenCase.expected.candidateAttempts.total} but received ${attempts.length}.`);
    }
    if (succeeded !== goldenCase.expected.candidateAttempts.succeeded) {
      mismatches.push(`Succeeded candidate attempts expected ${goldenCase.expected.candidateAttempts.succeeded} but received ${succeeded}.`);
    }
  }

  const quality = input.candidateQualityReport;
  if (!quality) {
    mismatches.push("Candidate quality report is missing.");
  } else {
    const rank: Record<CatalogCandidateQualityStatus, number> = { ok: 0, warning: 1, error: 2 };
    if (rank[quality.status] > rank[goldenCase.expected.maximumQualityStatus]) {
      mismatches.push(`Candidate quality expected at most ${goldenCase.expected.maximumQualityStatus} but received ${quality.status}.`);
    }
    if (input.candidateSnapshot && quality.snapshotDigest !== input.candidateSnapshot.digest) {
      mismatches.push("Candidate quality report does not match the candidate snapshot digest.");
    }
  }

  return {
    schemaVersion: "product-selection-golden-evaluation/v1",
    caseId: goldenCase.id,
    keyword: goldenCase.keyword,
    strategyRef: goldenCase.strategyRef,
    status: mismatches.length === 0 ? "passed" : "failed",
    mismatches,
  };
}
