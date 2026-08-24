import type { LandingPageTypeRef } from "../page-orchestration/contracts.js";
import type { ProductSelectionStrategyRef } from "../product-selection/config.js";
import type {
  ContentLanguage,
  ProductSelectionStrategy,
  YamiSite,
} from "../types.js";

export const TOPIC_GENERATOR_RUN_STAGE_IDS = [
  "topic-intent",
  "background-evidence",
  "product-selection",
  "module-merchandising",
  "content-writing",
  "content-review",
  "visual-generation",
  "asset-persistence",
  "page-generation",
  "automatic-qa",
  "experience-review",
  "user-approval",
] as const;

export type TopicGeneratorRunStageId =
  (typeof TOPIC_GENERATOR_RUN_STAGE_IDS)[number];

export const TOPIC_GENERATOR_RUN_STAGE_MAX_ATTEMPTS: Readonly<
  Record<TopicGeneratorRunStageId, number>
> = {
  "topic-intent": 1,
  "background-evidence": 1,
  "product-selection": 1,
  "module-merchandising": 2,
  "content-writing": 2,
  "content-review": 1,
  "visual-generation": 1,
  "asset-persistence": 1,
  "page-generation": 1,
  "automatic-qa": 1,
  "experience-review": 1,
  "user-approval": 1,
};

export type TopicGeneratorRunGoal =
  | "selection"
  | "content"
  | "visual"
  | "page";

export type TopicGeneratorRunStatus =
  | "pending"
  | "running"
  | "paused"
  | "awaiting-approval"
  | "completed"
  | "blocked"
  | "interrupted";

export type TopicGeneratorRunStageStatus =
  | "pending"
  | "running"
  | "completed"
  | "blocked"
  | "interrupted"
  | "invalidated";

export type TopicGeneratorDeliverableName =
  | "topic-brief.html"
  | "page-draft.html"
  | "page-final.html";

export interface TopicGeneratorRunRequest {
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  strategy: ProductSelectionStrategy;
  goal: TopicGeneratorRunGoal;
  requestedPageTypeRef?: LandingPageTypeRef;
  requestedSelectionStrategyRef?: ProductSelectionStrategyRef;
}

export interface TopicGeneratorRunOrigin {
  type: "new" | "derived" | "refresh" | "revision" | "imported" | "legacy-migration";
  sourceDigest?: string;
  sourceLabel?: string;
}

export interface TopicGeneratorRunManifestV2 {
  schemaVersion: "topic-generator-run/v2";
  product: "TOPIC GENERATOR";
  runId: string;
  parentRunId?: string;
  createdAt: string;
  request: TopicGeneratorRunRequest;
  requestDigest: string;
  origin: TopicGeneratorRunOrigin;
  contracts: {
    state: "topic-generator-run-state/v1";
    stageResult: "topic-generator-stage-result/v1";
    pageAutomation: "topic-page-automation-run/v1";
  };
}

export interface TopicGeneratorStageState {
  id: TopicGeneratorRunStageId;
  status: TopicGeneratorRunStageStatus;
  attempts: number;
  startedAt?: string;
  completedAt?: string;
  resultDigest?: string;
  issues: string[];
}

export interface TopicGeneratorDeliverable {
  name: TopicGeneratorDeliverableName;
  status: "pending" | "ready" | "failed";
  file: `deliverables/${TopicGeneratorDeliverableName}`;
  mediaType: "text/html";
  sha256?: string;
  bytes?: number;
  generatedAt?: string;
  issues: string[];
}

export interface TopicGeneratorProcessedRequest {
  requestId: string;
  stageId: TopicGeneratorRunStageId;
  stateDigest: string;
  completedAt: string;
}

export interface TopicGeneratorRunState {
  schemaVersion: "topic-generator-run-state/v1";
  runId: string;
  status: TopicGeneratorRunStatus;
  nextStage: TopicGeneratorRunStageId | null;
  stages: TopicGeneratorStageState[];
  deliverables: TopicGeneratorDeliverable[];
  issues: string[];
  processedRequests: TopicGeneratorProcessedRequest[];
  review?: {
    packageDigest: string;
    approvedAt?: string;
  };
  updatedAt: string;
}

export interface TopicGeneratorRunSummary {
  schemaVersion: "topic-generator-run-summary/v1";
  runId: string;
  parentRunId?: string;
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  strategy: ProductSelectionStrategy;
  goal: TopicGeneratorRunGoal;
  status: TopicGeneratorRunStatus;
  nextStage: TopicGeneratorRunStageId | null;
  completedStageCount: number;
  stageCount: number;
  deliverables: TopicGeneratorDeliverable[];
  createdAt: string;
  updatedAt: string;
  legacy: boolean;
  continuable: boolean;
  diagnostics: string[];
  origin: TopicGeneratorRunOrigin;
}

export interface TopicGeneratorRunDeletion {
  schemaVersion: "topic-generator-run-deletion/v1";
  runId: string;
  deletedAt: string;
  recoverable: true;
}

export interface TopicGeneratorManagedRun {
  manifest: TopicGeneratorRunManifestV2;
  state: TopicGeneratorRunState;
  summary: TopicGeneratorRunSummary;
}

export interface TopicGeneratorRunDetail extends TopicGeneratorManagedRun {
  schemaVersion: "topic-generator-run-detail/v1";
  stageResults: Partial<Record<TopicGeneratorRunStageId, unknown>>;
  retainedVisualPreview?: {
    sourceRunId: string;
    pageGeneration: unknown;
  };
  diagnostics: string[];
}

export interface TopicGeneratorLegacyRunDetail {
  schemaVersion: "topic-generator-legacy-run-detail/v1";
  summary: TopicGeneratorRunSummary;
  manifest: NonNullable<TopicGeneratorLegacyRunValidation["manifest"]>;
  artifacts: Record<string, unknown>;
  diagnostics: string[];
}

export type TopicGeneratorAnyRunDetail =
  | TopicGeneratorRunDetail
  | TopicGeneratorLegacyRunDetail;

export interface TopicGeneratorStageResultEnvelope {
  schemaVersion: "topic-generator-stage-result/v1";
  requestId: string;
  stageId: TopicGeneratorRunStageId;
  attempt: number;
  status: "completed" | "blocked";
  startedAt: string;
  completedAt: string;
  issues: string[];
  runRequestDigest: string;
  upstreamResultDigests: Partial<Record<TopicGeneratorRunStageId, string>>;
  output: unknown;
  outputDigest: string;
}

export interface TopicGeneratorStageExecutionResult {
  status: "completed" | "blocked";
  request?: unknown;
  proposal?: unknown;
  output: unknown;
  issues?: string[];
  runStatus?: TopicGeneratorRunStatus;
  deliverables?: Partial<Record<TopicGeneratorDeliverableName, string>>;
  reviewPackageDigest?: string;
}

export interface TopicGeneratorRunEvent {
  schemaVersion: "topic-generator-run-event/v1";
  runId: string;
  at: string;
  type:
    | "run-created"
    | "stage-started"
    | "stage-completed"
    | "stage-blocked"
    | "stage-recovered"
    | "run-derived"
    | "run-approved";
  stageId?: TopicGeneratorRunStageId;
  attempt?: number;
  status: TopicGeneratorRunStatus;
  digest?: string;
  errorCode?: "STAGE_BLOCKED" | "STAGE_RECOVERED_BLOCKED";
}

export interface TopicGeneratorLegacyRunValidation {
  valid: boolean;
  issues: string[];
  manifest?: {
    schemaVersion: "topic-generator-run/v1";
    product: "TOPIC GENERATOR";
    runId: string;
    keyword: string;
    createdAt: string;
    fallbackUsed: boolean;
    proposalStatus: string;
    artifacts: Array<{
      name: string;
      file: string;
      schemaVersion: string;
      sha256: string;
    }>;
  };
  artifacts?: Record<string, unknown>;
  sourceDigest?: string;
}
