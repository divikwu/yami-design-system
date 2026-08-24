import { createHash, randomUUID } from "node:crypto";
import {
  appendFile,
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import type { TopicGeneratorRunManifest } from "../run-artifact.js";
import type { TopicIntentAnalysis } from "../analyze.js";
import type { TopicGeneratorRunRequest } from "./contracts.js";
import {
  TOPIC_GENERATOR_RUN_STAGE_IDS,
  TOPIC_GENERATOR_RUN_STAGE_MAX_ATTEMPTS,
  type TopicGeneratorDeliverable,
  type TopicGeneratorDeliverableName,
  type TopicGeneratorAnyRunDetail,
  type TopicGeneratorLegacyRunValidation,
  type TopicGeneratorManagedRun,
  type TopicGeneratorRunEvent,
  type TopicGeneratorRunDeletion,
  type TopicGeneratorRunManifestV2,
  type TopicGeneratorRunOrigin,
  type TopicGeneratorRunStageId,
  type TopicGeneratorRunState,
  type TopicGeneratorRunSummary,
  type TopicGeneratorStageExecutionResult,
  type TopicGeneratorStageResultEnvelope,
} from "./contracts.js";

const RUN_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,95}$/;
const MAX_PROCESSED_REQUESTS = 100;
const DEFAULT_LOCK_TIMEOUT_MS = 10 * 60 * 1_000;
const MAX_EVENT_LOG_BYTES = 1024 * 1024;
const DELIVERABLE_NAMES: readonly TopicGeneratorDeliverableName[] = [
  "topic-brief.html",
  "page-draft.html",
  "page-final.html",
];
const EVENT_TYPES = new Set<TopicGeneratorRunEvent["type"]>([
  "run-created",
  "stage-started",
  "stage-completed",
  "stage-blocked",
  "stage-recovered",
  "run-derived",
  "run-approved",
]);
const RUN_STATUSES = new Set([
  "pending",
  "running",
  "paused",
  "awaiting-approval",
  "completed",
  "blocked",
  "interrupted",
]);
const STAGE_STATUSES = new Set([
  "pending",
  "running",
  "completed",
  "blocked",
  "interrupted",
  "invalidated",
]);
const ORIGIN_TYPES = new Set([
  "new",
  "derived",
  "refresh",
  "revision",
  "imported",
  "legacy-migration",
]);
const EVENT_KEYS = new Set([
  "schemaVersion",
  "runId",
  "at",
  "type",
  "stageId",
  "attempt",
  "status",
  "digest",
  "errorCode",
]);

export class TopicGeneratorRunNotFoundError extends Error {
  constructor(runId: string) {
    super(`Topic Generator run was not found: ${runId}`);
    this.name = "TopicGeneratorRunNotFoundError";
  }
}

export class TopicGeneratorRunBusyError extends Error {
  constructor(runId: string) {
    super(`Topic Generator run is already advancing: ${runId}`);
    this.name = "TopicGeneratorRunBusyError";
  }
}

export class TopicGeneratorRunValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TopicGeneratorRunValidationError";
  }
}

export interface TopicGeneratorRunStoreOptions {
  root: string;
  now?: () => Date;
  lockTimeoutMs?: number;
}

export interface CreateTopicGeneratorRunOptions {
  parentRunId?: string;
  origin?: TopicGeneratorRunOrigin;
}

export interface AdvanceTopicGeneratorRunOptions {
  requestId: string;
  execute(input: {
    manifest: TopicGeneratorRunManifestV2;
    state: TopicGeneratorRunState;
    stageId: TopicGeneratorRunStageId;
    attempt: number;
    readStageResult(stageId: TopicGeneratorRunStageId): Promise<unknown | undefined>;
    assetStore: ReturnType<TopicGeneratorRunStore["assetStore"]>;
  }): Promise<TopicGeneratorStageExecutionResult>;
}

export interface DeriveTopicGeneratorRunOptions {
  origin: Extract<TopicGeneratorRunOrigin["type"], "derived" | "refresh" | "revision">;
  rollbackStage: TopicGeneratorRunStageId;
  request?: Partial<TopicGeneratorRunRequest>;
}

export interface MigrateLegacyTopicGeneratorRunOptions {
  request?: Partial<TopicGeneratorRunRequest>;
}

function sha256(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function serialized(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function valueDigest(value: unknown) {
  return sha256(serialized(value));
}

function runSlug(keyword: string) {
  const slug = keyword
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug || "topic";
}

function assertRunId(runId: string) {
  if (!RUN_ID_PATTERN.test(runId)) {
    throw new TopicGeneratorRunValidationError("Run id is invalid.");
  }
}

function safeRelativePath(path: string) {
  return path.length > 0 && !isAbsolute(path) && !path.includes("\\") &&
    !/^[a-z][a-z0-9+.-]*:/i.test(path) &&
    path.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function isInside(root: string, target: string) {
  const fromRoot = relative(root, target);
  return fromRoot === "" || (!fromRoot.startsWith("..") && !isAbsolute(fromRoot));
}

function initialDeliverables(): TopicGeneratorDeliverable[] {
  return DELIVERABLE_NAMES.map((name) => ({
    name,
    status: "pending",
    file: `deliverables/${name}`,
    mediaType: "text/html",
    issues: [],
  }));
}

function nextPendingStage(state: TopicGeneratorRunState) {
  return state.stages.find((stage) =>
    stage.status === "pending" || stage.status === "running" ||
    stage.status === "interrupted" ||
    stage.status === "invalidated" || stage.status === "blocked"
  )?.id ?? null;
}

function validIsoDate(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validDigest(value: unknown) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function validStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function upstreamResultDigests(
  state: TopicGeneratorRunState,
  stageId: TopicGeneratorRunStageId,
) {
  const stageIndex = TOPIC_GENERATOR_RUN_STAGE_IDS.indexOf(stageId);
  return Object.fromEntries(state.stages
    .slice(0, stageIndex)
    .flatMap((stage) => stage.status === "completed" && stage.resultDigest
      ? [[stage.id, stage.resultDigest] as const]
      : []));
}

function summary(
  manifest: TopicGeneratorRunManifestV2,
  state: TopicGeneratorRunState,
): TopicGeneratorRunSummary {
  return {
    schemaVersion: "topic-generator-run-summary/v1",
    runId: manifest.runId,
    ...(manifest.parentRunId ? { parentRunId: manifest.parentRunId } : {}),
    keyword: manifest.request.keyword,
    site: manifest.request.site,
    language: manifest.request.language,
    strategy: manifest.request.strategy,
    goal: manifest.request.goal,
    status: state.status,
    nextStage: state.nextStage,
    completedStageCount: state.stages.filter(({ status }) => status === "completed").length,
    stageCount: state.stages.length,
    deliverables: structuredClone(state.deliverables),
    createdAt: manifest.createdAt,
    updatedAt: state.updatedAt,
    legacy: false,
    continuable: true,
    diagnostics: [],
    origin: structuredClone(manifest.origin),
  };
}

function legacySummary(
  validation: TopicGeneratorLegacyRunValidation,
): TopicGeneratorRunSummary | null {
  if (!validation.valid || !validation.manifest) return null;
  return {
    schemaVersion: "topic-generator-run-summary/v1",
    runId: validation.manifest.runId,
    keyword: validation.manifest.keyword,
    site: "us",
    language: "zh",
    strategy: "relevance",
    goal: "selection",
    status: "paused",
    nextStage: "background-evidence",
    completedStageCount: 1,
    stageCount: TOPIC_GENERATOR_RUN_STAGE_IDS.length,
    deliverables: initialDeliverables(),
    createdAt: validation.manifest.createdAt,
    updatedAt: validation.manifest.createdAt,
    legacy: true,
    continuable: true,
    diagnostics: [],
    origin: { type: "imported", sourceDigest: validation.sourceDigest },
  };
}

function parseJson<T>(contents: string, label: string): T {
  try {
    return JSON.parse(contents) as T;
  } catch {
    throw new TopicGeneratorRunValidationError(`${label} is not valid JSON.`);
  }
}

function validateRequest(request: TopicGeneratorRunRequest) {
  const keyword = request.keyword.trim();
  if (keyword.length < 2 || keyword.length > 80) {
    throw new TopicGeneratorRunValidationError(
      "Keyword must contain between 2 and 80 characters.",
    );
  }
  if (request.site !== "us") {
    throw new TopicGeneratorRunValidationError("Only the US Yami catalog is supported.");
  }
  if (request.language !== "en" && request.language !== "zh") {
    throw new TopicGeneratorRunValidationError("Content language is invalid.");
  }
  if (request.strategy !== "relevance" && request.strategy !== "category-role") {
    throw new TopicGeneratorRunValidationError("Product selection strategy is invalid.");
  }
  if (!["selection", "content", "visual", "page"].includes(request.goal)) {
    throw new TopicGeneratorRunValidationError("Run goal is invalid.");
  }
  return { ...request, keyword };
}

function requiredRollbackStageForRequestChange(
  parent: TopicGeneratorRunRequest,
  child: TopicGeneratorRunRequest,
): TopicGeneratorRunStageId | null {
  if (valueDigest(parent) === valueDigest(child)) return null;
  const selectionIndependentFields = (request: TopicGeneratorRunRequest) => ({
    keyword: request.keyword,
    site: request.site,
    language: request.language,
    goal: request.goal,
    requestedPageTypeRef: request.requestedPageTypeRef,
  });
  return valueDigest(selectionIndependentFields(parent)) ===
      valueDigest(selectionIndependentFields(child))
    ? "product-selection"
    : "topic-intent";
}

function validManagedContracts(
  manifest: TopicGeneratorRunManifestV2,
  state: TopicGeneratorRunState,
  runId: string,
) {
  const manifestValid = manifest.schemaVersion === "topic-generator-run/v2" &&
    manifest.product === "TOPIC GENERATOR" && manifest.runId === runId &&
    (!manifest.parentRunId || RUN_ID_PATTERN.test(manifest.parentRunId)) &&
    validIsoDate(manifest.createdAt) &&
    validDigest(manifest.requestDigest) &&
    manifest.requestDigest === valueDigest(validateRequest(manifest.request)) &&
    Boolean(manifest.origin) && ORIGIN_TYPES.has(manifest.origin.type) &&
    (manifest.origin.sourceDigest === undefined ||
      typeof manifest.origin.sourceDigest === "string") &&
    (manifest.origin.sourceLabel === undefined ||
      typeof manifest.origin.sourceLabel === "string") &&
    manifest.contracts?.state === "topic-generator-run-state/v1" &&
    manifest.contracts?.stageResult === "topic-generator-stage-result/v1" &&
    manifest.contracts?.pageAutomation === "topic-page-automation-run/v1";
  if (!manifestValid || state.schemaVersion !== "topic-generator-run-state/v1" ||
      state.runId !== runId || !RUN_STATUSES.has(state.status) ||
      !validIsoDate(state.updatedAt) || !validStringArray(state.issues) ||
      state.stages.length !== TOPIC_GENERATOR_RUN_STAGE_IDS.length ||
      state.deliverables.length !== DELIVERABLE_NAMES.length ||
      !Array.isArray(state.processedRequests) ||
      state.processedRequests.length > MAX_PROCESSED_REQUESTS) {
    return false;
  }
  if (state.stages.some((stage, index) =>
    stage.id !== TOPIC_GENERATOR_RUN_STAGE_IDS[index] ||
    !STAGE_STATUSES.has(stage.status) || !Number.isInteger(stage.attempts) ||
    stage.attempts < 0 || !validStringArray(stage.issues) ||
    (stage.startedAt !== undefined && !validIsoDate(stage.startedAt)) ||
    (stage.completedAt !== undefined && !validIsoDate(stage.completedAt)) ||
    ((stage.status === "completed" || stage.status === "blocked") &&
      (stage.attempts < 1 || !validDigest(stage.resultDigest))) ||
    ((stage.status === "pending" || stage.status === "running" ||
      stage.status === "invalidated") && stage.resultDigest !== undefined)
  )) return false;
  if (state.deliverables.some((deliverable, index) =>
    deliverable.name !== DELIVERABLE_NAMES[index] ||
    deliverable.file !== `deliverables/${deliverable.name}` ||
    deliverable.mediaType !== "text/html" ||
    !["pending", "ready", "failed"].includes(deliverable.status) ||
    !validStringArray(deliverable.issues) ||
    (deliverable.status === "ready" &&
      (!validDigest(deliverable.sha256) || !Number.isInteger(deliverable.bytes) ||
        (deliverable.bytes ?? -1) < 0 || !validIsoDate(deliverable.generatedAt)))
  )) return false;
  if (state.processedRequests.some((processed) =>
    typeof processed.requestId !== "string" || !processed.requestId ||
    processed.requestId.length > 120 ||
    !TOPIC_GENERATOR_RUN_STAGE_IDS.includes(processed.stageId) ||
    !validDigest(processed.stateDigest) || !validIsoDate(processed.completedAt)
  ) || new Set(state.processedRequests.map(({ requestId }) => requestId)).size !==
      state.processedRequests.length) return false;
  if (state.review &&
      (typeof state.review.packageDigest !== "string" ||
        !state.review.packageDigest || state.review.packageDigest.length > 128 ||
        (state.review.approvedAt !== undefined && !validIsoDate(state.review.approvedAt)))) {
    return false;
  }
  return state.nextStage === nextPendingStage(state);
}

export class TopicGeneratorRunStore {
  readonly root: string;
  readonly lockTimeoutMs: number;
  private readonly now: () => Date;

  constructor(options: TopicGeneratorRunStoreOptions) {
    if (!isAbsolute(options.root)) {
      throw new TopicGeneratorRunValidationError(
        "TOPIC_GENERATOR_RUN_ROOT must be an absolute path.",
      );
    }
    this.root = resolve(options.root);
    this.now = options.now ?? (() => new Date());
    this.lockTimeoutMs = options.lockTimeoutMs ?? DEFAULT_LOCK_TIMEOUT_MS;
  }

  private timestamp() {
    return this.now().toISOString();
  }

  private runDirectory(runId: string) {
    assertRunId(runId);
    const target = resolve(this.root, runId);
    if (!isInside(this.root, target)) {
      throw new TopicGeneratorRunValidationError("Run path escapes the managed root.");
    }
    return target;
  }

  private async atomicWrite(path: string, contents: string | Uint8Array) {
    await mkdir(dirname(path), { recursive: true });
    const temporary = join(
      dirname(path),
      `.${basename(path)}.${process.pid}.${randomUUID()}.tmp`,
    );
    await writeFile(temporary, contents, { flag: "wx" });
    await rename(temporary, path);
  }

  private async appendEvent(runId: string, event: TopicGeneratorRunEvent) {
    await appendFile(
      join(this.runDirectory(runId), "events.jsonl"),
      `${JSON.stringify(event)}\n`,
      "utf8",
    );
  }

  async create(
    request: TopicGeneratorRunRequest,
    options: CreateTopicGeneratorRunOptions = {},
  ): Promise<TopicGeneratorManagedRun> {
    const validatedRequest = validateRequest(request);
    const createdAt = this.timestamp();
    const runId = `${runSlug(validatedRequest.keyword)}-${createdAt
      .replace(/[^0-9]/g, "")
      .slice(0, 17)}-${randomUUID().slice(0, 8)}`;
    if (options.parentRunId) assertRunId(options.parentRunId);
    const manifest: TopicGeneratorRunManifestV2 = {
      schemaVersion: "topic-generator-run/v2",
      product: "TOPIC GENERATOR",
      runId,
      ...(options.parentRunId ? { parentRunId: options.parentRunId } : {}),
      createdAt,
      request: validatedRequest,
      requestDigest: valueDigest(validatedRequest),
      origin: options.origin ?? { type: "new" },
      contracts: {
        state: "topic-generator-run-state/v1",
        stageResult: "topic-generator-stage-result/v1",
        pageAutomation: "topic-page-automation-run/v1",
      },
    };
    const state: TopicGeneratorRunState = {
      schemaVersion: "topic-generator-run-state/v1",
      runId,
      status: "pending",
      nextStage: TOPIC_GENERATOR_RUN_STAGE_IDS[0],
      stages: TOPIC_GENERATOR_RUN_STAGE_IDS.map((id) => ({
        id,
        status: "pending",
        attempts: 0,
        issues: [],
      })),
      deliverables: initialDeliverables(),
      issues: [],
      processedRequests: [],
      updatedAt: createdAt,
    };
    const temporary = join(this.root, `.create-${runId}-${randomUUID()}`);
    const target = this.runDirectory(runId);
    await mkdir(this.root, { recursive: true });
    await mkdir(join(temporary, "stages"), { recursive: true });
    await mkdir(join(temporary, "assets"), { recursive: true });
    await mkdir(join(temporary, "deliverables"), { recursive: true });
    await writeFile(join(temporary, "run.json"), serialized(manifest), { flag: "wx" });
    await writeFile(join(temporary, "state.json"), serialized(state), { flag: "wx" });
    await writeFile(
      join(temporary, "events.jsonl"),
      `${JSON.stringify({
        schemaVersion: "topic-generator-run-event/v1",
        runId,
        at: createdAt,
        type: "run-created",
        status: state.status,
      } satisfies TopicGeneratorRunEvent)}\n`,
      { flag: "wx" },
    );
    await rename(temporary, target);
    return { manifest, state, summary: summary(manifest, state) };
  }

  async read(runId: string): Promise<TopicGeneratorManagedRun> {
    const directory = this.runDirectory(runId);
    let manifestContents: string;
    let stateContents: string;
    try {
      [manifestContents, stateContents] = await Promise.all([
        readFile(join(directory, "run.json"), "utf8"),
        readFile(join(directory, "state.json"), "utf8"),
      ]);
    } catch {
      throw new TopicGeneratorRunNotFoundError(runId);
    }
    const manifest = parseJson<TopicGeneratorRunManifestV2>(manifestContents, "run.json");
    const state = parseJson<TopicGeneratorRunState>(stateContents, "state.json");
    if (!validManagedContracts(manifest, state, runId)) {
      throw new TopicGeneratorRunValidationError("Managed run contracts are invalid.");
    }
    await this.validateEventLog(runId);
    return { manifest, state, summary: summary(manifest, state) };
  }

  private async validateEventLog(runId: string) {
    let contents: string;
    try {
      contents = await readFile(join(this.runDirectory(runId), "events.jsonl"), "utf8");
    } catch {
      throw new TopicGeneratorRunValidationError("Managed run event log is missing.");
    }
    if (Buffer.byteLength(contents) > MAX_EVENT_LOG_BYTES) {
      throw new TopicGeneratorRunValidationError("Managed run event log is too large.");
    }
    const lines = contents.split("\n").filter(Boolean);
    if (lines.length < 1) {
      throw new TopicGeneratorRunValidationError("Managed run event log is empty.");
    }
    for (const line of lines) {
      const event = parseJson<Record<string, unknown>>(line, "events.jsonl entry");
      if ([...Object.keys(event)].some((key) => !EVENT_KEYS.has(key)) ||
          event.schemaVersion !== "topic-generator-run-event/v1" ||
          event.runId !== runId || typeof event.at !== "string" ||
          !Number.isFinite(Date.parse(event.at)) ||
          !EVENT_TYPES.has(event.type as TopicGeneratorRunEvent["type"]) ||
          !RUN_STATUSES.has(event.status as string) ||
          (event.stageId !== undefined &&
            !TOPIC_GENERATOR_RUN_STAGE_IDS.includes(
              event.stageId as TopicGeneratorRunStageId,
            )) ||
          (event.attempt !== undefined &&
            (!Number.isInteger(event.attempt) || (event.attempt as number) < 1)) ||
          (event.digest !== undefined && typeof event.digest !== "string") ||
          (event.errorCode !== undefined && event.errorCode !== "STAGE_BLOCKED" &&
            event.errorCode !== "STAGE_RECOVERED_BLOCKED")) {
        throw new TopicGeneratorRunValidationError("Managed run event log is invalid.");
      }
    }
    const first = parseJson<Record<string, unknown>>(lines[0]!, "events.jsonl entry");
    if (first.type !== "run-created") {
      throw new TopicGeneratorRunValidationError(
        "Managed run event log must begin with run-created.",
      );
    }
  }

  async writeState(manifest: TopicGeneratorRunManifestV2, state: TopicGeneratorRunState) {
    state.updatedAt = this.timestamp();
    state.nextStage = nextPendingStage(state);
    await this.atomicWrite(
      join(this.runDirectory(manifest.runId), "state.json"),
      serialized(state),
    );
  }

  async list(): Promise<TopicGeneratorRunSummary[]> {
    await mkdir(this.root, { recursive: true });
    const entries = await readdir(this.root, { withFileTypes: true });
    const runs = await Promise.all(entries
      .filter((entry) => entry.isDirectory() && RUN_ID_PATTERN.test(entry.name))
      .map(async (entry) => {
        try {
          const run = await this.read(entry.name);
          const detail = await this.detail(entry.name);
          if (detail.schemaVersion === "topic-generator-run-detail/v1" &&
              detail.diagnostics.length > 0) {
            return this.damagedSummary(entry.name);
          }
          return run.summary;
        } catch {
          const legacy = await this.validateLegacy(entry.name);
          return legacySummary(legacy) ?? this.damagedSummary(entry.name);
        }
      }));
    return runs
      .filter((run): run is TopicGeneratorRunSummary => run !== null)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async deleteRun(runId: string): Promise<TopicGeneratorRunDeletion> {
    const source = this.runDirectory(runId);
    try {
      const sourceStat = await lstat(source);
      if (!sourceStat.isDirectory() || sourceStat.isSymbolicLink()) {
        throw new TopicGeneratorRunNotFoundError(runId);
      }
    } catch (error) {
      if (error instanceof TopicGeneratorRunNotFoundError) throw error;
      throw new TopicGeneratorRunNotFoundError(runId);
    }

    const release = await this.acquireLock(runId);
    const deletedAt = this.timestamp();
    const trashRoot = resolve(this.root, ".trash");
    const trashName = `${runId}-${deletedAt.replace(/[^0-9]/g, "").slice(0, 17)}-${
      randomUUID().slice(0, 8)
    }`;
    const target = resolve(trashRoot, trashName);
    if (!isInside(this.root, target)) {
      await release();
      throw new TopicGeneratorRunValidationError("Trash path escapes the managed root.");
    }

    try {
      try {
        await mkdir(trashRoot);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
      const trashStat = await lstat(trashRoot);
      if (!trashStat.isDirectory() || trashStat.isSymbolicLink()) {
        throw new TopicGeneratorRunValidationError(
          "Managed run trash must be a local directory.",
        );
      }
      await rename(source, target);
      await rm(join(target, ".run-lock"), { recursive: true, force: true });
      return {
        schemaVersion: "topic-generator-run-deletion/v1",
        runId,
        deletedAt,
        recoverable: true,
      };
    } finally {
      await release();
    }
  }

  private async damagedSummary(runId: string): Promise<TopicGeneratorRunSummary> {
    let manifest: Record<string, unknown> = {};
    let state: Record<string, unknown> = {};
    try {
      manifest = JSON.parse(
        await readFile(join(this.runDirectory(runId), "run.json"), "utf8"),
      ) as Record<string, unknown>;
    } catch {
      // The directory identity remains enough to expose a safe diagnostic row.
    }
    try {
      state = JSON.parse(
        await readFile(join(this.runDirectory(runId), "state.json"), "utf8"),
      ) as Record<string, unknown>;
    } catch {
      // A missing or malformed state is represented by the blocked summary below.
    }
    const request = typeof manifest.request === "object" && manifest.request !== null
      ? manifest.request as Record<string, unknown>
      : {};
    const createdAt = typeof manifest.createdAt === "string" &&
        Number.isFinite(Date.parse(manifest.createdAt))
      ? manifest.createdAt
      : "1970-01-01T00:00:00.000Z";
    const updatedAt = typeof state.updatedAt === "string" &&
        Number.isFinite(Date.parse(state.updatedAt))
      ? state.updatedAt
      : createdAt;
    return {
      schemaVersion: "topic-generator-run-summary/v1",
      runId,
      ...(typeof manifest.parentRunId === "string"
        ? { parentRunId: manifest.parentRunId }
        : {}),
      keyword: typeof request.keyword === "string" ? request.keyword : runId,
      site: "us",
      language: request.language === "en" ? "en" : "zh",
      strategy: request.strategy === "category-role" ? "category-role" : "relevance",
      goal: request.goal === "selection" || request.goal === "content" ||
          request.goal === "visual"
        ? request.goal
        : "page",
      status: "blocked",
      nextStage: null,
      completedStageCount: 0,
      stageCount: TOPIC_GENERATOR_RUN_STAGE_IDS.length,
      deliverables: initialDeliverables(),
      createdAt,
      updatedAt,
      legacy: manifest.schemaVersion === "topic-generator-run/v1",
      continuable: false,
      diagnostics: [
        "RUN_INTEGRITY_FAILED: manifest, state, or artifact digests do not match.",
      ],
      origin: { type: "imported" },
    };
  }

  async detail(runId: string): Promise<TopicGeneratorAnyRunDetail> {
    try {
      const run = await this.read(runId);
      const stageResults: Partial<Record<TopicGeneratorRunStageId, unknown>> = {};
      const diagnostics: string[] = [];
      for (const stage of run.state.stages) {
        if (stage.attempts < 1) continue;
        try {
          const envelope = await this.readStageEnvelope(runId, stage.id);
          if (envelope) {
            stageResults[stage.id] = envelope.output;
          } else if (stage.status === "completed" || stage.status === "blocked") {
            diagnostics.push(`Stage result for ${stage.id} is missing.`);
          }
        } catch (error) {
          diagnostics.push(error instanceof Error ? error.message : `${stage.id} is invalid.`);
        }
      }
      for (const deliverable of run.state.deliverables) {
        if (deliverable.status !== "ready") continue;
        try {
          await this.readDeliverable(runId, deliverable.name);
        } catch {
          diagnostics.push(`Deliverable ${deliverable.name} failed integrity validation.`);
        }
      }
      let retainedVisualPreview: {
        sourceRunId: string;
        pageGeneration: unknown;
      } | undefined;
      let ancestorRunId = run.manifest.parentRunId;
      const visitedRunIds = new Set([run.manifest.runId]);
      while (!stageResults["page-generation"] && ancestorRunId &&
          !visitedRunIds.has(ancestorRunId)) {
        visitedRunIds.add(ancestorRunId);
        try {
          const ancestor = await this.read(ancestorRunId);
          const pageStage = ancestor.state.stages.find(({ id }) => id === "page-generation");
          if (pageStage?.status === "completed" && pageStage.attempts > 0) {
            const envelope = await this.readStageEnvelope(ancestorRunId, "page-generation");
            if (envelope?.status === "completed") {
              const assetEnvelope = await this.readStageEnvelope(
                ancestorRunId,
                "asset-persistence",
              );
              const assetOutput = recordValue(assetEnvelope?.output);
              const assetManifest = recordValue(assetOutput?.assetManifest);
              const assets = assetManifest?.assets;
              if (assetEnvelope?.status !== "completed" || !Array.isArray(assets) ||
                  assets.length === 0) {
                diagnostics.push(
                  `Retained visual assets for ${ancestorRunId} are unavailable or undeclared.`,
                );
                ancestorRunId = ancestor.manifest.parentRunId;
                continue;
              }
              const assetStore = this.assetStore(ancestorRunId);
              const assetsAreValid = await Promise.all(assets.map(async (value) => {
                const asset = recordValue(value);
                const artifact = recordValue(asset?.artifact);
                const ref = artifact?.ref;
                const digest = artifact?.digest;
                if (typeof ref !== "string" || typeof digest !== "string" ||
                    !/^sha256:[a-f0-9]{64}$/.test(digest)) return false;
                try {
                  return `sha256:${sha256(await assetStore.get(ref))}` === digest;
                } catch {
                  return false;
                }
              }));
              if (assetsAreValid.some((valid) => !valid)) {
                diagnostics.push(
                  `Retained visual assets for ${ancestorRunId} failed integrity validation.`,
                );
                ancestorRunId = ancestor.manifest.parentRunId;
                continue;
              }
              retainedVisualPreview = {
                sourceRunId: ancestorRunId,
                pageGeneration: envelope.output,
              };
              break;
            }
          }
          ancestorRunId = ancestor.manifest.parentRunId;
        } catch (error) {
          if (!(error instanceof TopicGeneratorRunNotFoundError) &&
              !(error instanceof TopicGeneratorRunValidationError)) throw error;
          break;
        }
      }
      return {
        schemaVersion: "topic-generator-run-detail/v1",
        ...run,
        stageResults,
        ...(retainedVisualPreview ? { retainedVisualPreview } : {}),
        diagnostics,
      };
    } catch (error) {
      if (!(error instanceof TopicGeneratorRunNotFoundError) &&
          !(error instanceof TopicGeneratorRunValidationError)) throw error;
      const legacy = await this.validateLegacy(runId);
      const legacyRunSummary = legacySummary(legacy);
      if (!legacyRunSummary || !legacy.manifest) {
        throw new TopicGeneratorRunValidationError(
          legacy.issues.join(" ") || "Run is not a valid managed or legacy run.",
        );
      }
      return {
        schemaVersion: "topic-generator-legacy-run-detail/v1",
        summary: legacyRunSummary,
        manifest: legacy.manifest,
        artifacts: legacy.artifacts ?? {},
        diagnostics: legacy.issues,
      };
    }
  }

  async readStageEnvelope(
    runId: string,
    stageId: TopicGeneratorRunStageId,
    attempt?: number,
  ): Promise<TopicGeneratorStageResultEnvelope | undefined> {
    const run = await this.read(runId);
    const stage = run.state.stages.find(({ id }) => id === stageId);
    const selectedAttempt = attempt ?? stage?.attempts ?? 0;
    if (selectedAttempt < 1) return undefined;
    try {
      const contents = await readFile(
        join(
          this.runDirectory(runId),
          "stages",
          stageId,
          `attempt-${String(selectedAttempt).padStart(4, "0")}`,
          "result.json",
        ),
        "utf8",
      );
      const envelope = parseJson<TopicGeneratorStageResultEnvelope>(
        contents,
        `${stageId} result.json`,
      );
      if (envelope.schemaVersion !== "topic-generator-stage-result/v1" ||
          typeof envelope.requestId !== "string" || !envelope.requestId ||
          envelope.stageId !== stageId || envelope.attempt !== selectedAttempt ||
          envelope.runRequestDigest !== run.manifest.requestDigest ||
          valueDigest(envelope.upstreamResultDigests) !== valueDigest(
            upstreamResultDigests(run.state, stageId),
          ) ||
          envelope.outputDigest !== sha256(serialized(envelope.output))) {
        throw new TopicGeneratorRunValidationError(
          `Stage result for ${stageId} failed integrity validation.`,
        );
      }
      return envelope;
    } catch (error) {
      if (error instanceof TopicGeneratorRunValidationError) throw error;
      return undefined;
    }
  }

  async readStageResult(runId: string, stageId: TopicGeneratorRunStageId) {
    return (await this.readStageEnvelope(runId, stageId))?.output;
  }

  async writeDeliverable(
    manifest: TopicGeneratorRunManifestV2,
    state: TopicGeneratorRunState,
    name: TopicGeneratorDeliverableName,
    html: string,
  ) {
    if (!DELIVERABLE_NAMES.includes(name)) {
      throw new TopicGeneratorRunValidationError("Deliverable name is not allowed.");
    }
    const contents = new TextEncoder().encode(html);
    await this.atomicWrite(
      join(this.runDirectory(manifest.runId), "deliverables", name),
      contents,
    );
    const deliverable = state.deliverables.find((item) => item.name === name)!;
    deliverable.status = "ready";
    deliverable.sha256 = sha256(contents);
    deliverable.bytes = contents.byteLength;
    deliverable.generatedAt = this.timestamp();
    deliverable.issues = [];
  }

  async readDeliverable(runId: string, name: TopicGeneratorDeliverableName) {
    if (!DELIVERABLE_NAMES.includes(name)) {
      throw new TopicGeneratorRunValidationError("Deliverable name is not allowed.");
    }
    const run = await this.read(runId);
    const deliverable = run.state.deliverables.find((item) => item.name === name);
    if (!deliverable || deliverable.status !== "ready") {
      throw new TopicGeneratorRunNotFoundError(`${runId}/${name}`);
    }
    const contents = await readFile(
      join(this.runDirectory(runId), "deliverables", name),
    );
    if (deliverable.sha256 !== sha256(contents)) {
      throw new TopicGeneratorRunValidationError("Deliverable digest is invalid.");
    }
    return contents;
  }

  assetStore(runId: string) {
    const root = join(this.runDirectory(runId), "assets");
    const pathFor = (ref: string) => {
      if (!safeRelativePath(ref)) {
        throw new TopicGeneratorRunValidationError("Asset ref must be a safe relative path.");
      }
      const target = resolve(root, ref);
      if (!isInside(root, target)) {
        throw new TopicGeneratorRunValidationError("Asset ref escapes the run directory.");
      }
      return target;
    };
    return {
      put: async (ref: string, bytes: Uint8Array) => {
        await this.atomicWrite(pathFor(ref), bytes);
      },
      get: async (ref: string) => new Uint8Array(await readFile(pathFor(ref))),
      publicUrl: (ref: string) => {
        pathFor(ref);
        return `/api/topic-generator/runs/${encodeURIComponent(runId)}/assets?ref=${encodeURIComponent(ref)}`;
      },
    };
  }

  async readPersistedAsset(runId: string, ref: string) {
    const envelope = await this.readStageEnvelope(runId, "asset-persistence");
    const output = recordValue(envelope?.output);
    const manifest = recordValue(output?.assetManifest);
    const asset = Array.isArray(manifest?.assets)
      ? manifest.assets
        .map(recordValue)
        .find((value) => recordValue(value?.artifact)?.ref === ref)
      : undefined;
    const artifact = recordValue(asset?.artifact);
    const digest = artifact?.digest;
    if (typeof digest !== "string" || !/^sha256:[a-f0-9]{64}$/.test(digest)) {
      throw new TopicGeneratorRunValidationError("Asset is not declared by the persisted manifest.");
    }
    let bytes: Uint8Array;
    try {
      bytes = await this.assetStore(runId).get(ref);
    } catch {
      throw new TopicGeneratorRunValidationError("Persisted asset could not be read.");
    }
    if (`sha256:${sha256(bytes)}` !== digest) {
      throw new TopicGeneratorRunValidationError("Persisted asset digest is invalid.");
    }
    return bytes;
  }

  private async acquireLock(runId: string) {
    const lockDirectory = join(this.runDirectory(runId), ".run-lock");
    try {
      await mkdir(lockDirectory);
    } catch {
      try {
        const lockStat = await stat(lockDirectory);
        let ownerIsDead = false;
        try {
          const owner = parseJson<{ pid?: unknown }>(
            await readFile(join(lockDirectory, "owner.json"), "utf8"),
            "Run lock owner",
          );
          if (Number.isInteger(owner.pid) && (owner.pid as number) > 0) {
            try {
              process.kill(owner.pid as number, 0);
            } catch (error) {
              ownerIsDead = (error as NodeJS.ErrnoException).code === "ESRCH";
            }
          }
        } catch {
          // A concurrent owner may still be writing owner.json; use the timeout below.
        }
        if (!ownerIsDead &&
            this.now().getTime() - lockStat.mtimeMs <= this.lockTimeoutMs) {
          throw new TopicGeneratorRunBusyError(runId);
        }
        await rm(lockDirectory, { recursive: true, force: true });
        await mkdir(lockDirectory);
      } catch (error) {
        if (error instanceof TopicGeneratorRunBusyError) throw error;
        throw new TopicGeneratorRunBusyError(runId);
      }
    }
    await writeFile(
      join(lockDirectory, "owner.json"),
      serialized({ pid: process.pid, acquiredAt: this.timestamp() }),
      { flag: "wx" },
    );
    return async () => rm(lockDirectory, { recursive: true, force: true });
  }

  private async persistAttempt(
    runId: string,
    stageId: TopicGeneratorRunStageId,
    attempt: number,
    request: unknown,
    proposal: unknown,
    envelope: TopicGeneratorStageResultEnvelope,
  ) {
    const stageRoot = join(this.runDirectory(runId), "stages", stageId);
    const attemptName = `attempt-${String(attempt).padStart(4, "0")}`;
    const temporary = join(stageRoot, `.${attemptName}.${randomUUID()}.tmp`);
    const target = join(stageRoot, attemptName);
    await mkdir(temporary, { recursive: true });
    await Promise.all([
      writeFile(join(temporary, "request.json"), serialized(request ?? null), { flag: "wx" }),
      writeFile(join(temporary, "proposal.json"), serialized(proposal ?? null), { flag: "wx" }),
      writeFile(join(temporary, "result.json"), serialized(envelope), { flag: "wx" }),
    ]);
    await rename(temporary, target);
  }

  private async reconcileCompletedStages(
    manifest: TopicGeneratorRunManifestV2,
    state: TopicGeneratorRunState,
  ) {
    let invalidFrom = -1;
    let issue = "";
    for (const [index, stage] of state.stages.entries()) {
      if (stage.status !== "completed") continue;
      try {
        const envelope = await this.readStageEnvelope(manifest.runId, stage.id);
        if (!envelope || envelope.status !== "completed" ||
            envelope.outputDigest !== stage.resultDigest) {
          invalidFrom = index;
          issue = `Completed stage ${stage.id} is missing or no longer matches its recorded digest.`;
          break;
        }
      } catch (error) {
        invalidFrom = index;
        issue = error instanceof Error ? error.message : `Completed stage ${stage.id} is invalid.`;
        break;
      }
    }
    if (invalidFrom < 0) {
      for (const deliverable of state.deliverables) {
        if (deliverable.status !== "ready") continue;
        try {
          await this.readDeliverable(manifest.runId, deliverable.name);
        } catch {
          const owningStage: TopicGeneratorRunStageId =
            deliverable.name === "topic-brief.html"
              ? "background-evidence"
              : deliverable.name === "page-draft.html"
                ? "module-merchandising"
                : "user-approval";
          invalidFrom = TOPIC_GENERATOR_RUN_STAGE_IDS.indexOf(owningStage);
          issue = `Deliverable ${deliverable.name} failed integrity validation.`;
          break;
        }
      }
    }
    if (invalidFrom < 0) return;
    state.stages.forEach((stage, index) => {
      if (index < invalidFrom) return;
      stage.status = "invalidated";
      stage.issues = index === invalidFrom ? [issue] : [
        `Invalidated because ${state.stages[invalidFrom]!.id} must be regenerated.`,
      ];
      stage.completedAt = undefined;
      stage.resultDigest = undefined;
    });
    state.deliverables.forEach((deliverable) => {
      const owningStage: TopicGeneratorRunStageId = deliverable.name === "topic-brief.html"
        ? "background-evidence"
        : deliverable.name === "page-draft.html"
          ? "module-merchandising"
          : "user-approval";
      if (TOPIC_GENERATOR_RUN_STAGE_IDS.indexOf(owningStage) < invalidFrom) return;
      Object.assign(deliverable, {
        status: "pending" as const,
        sha256: undefined,
        bytes: undefined,
        generatedAt: undefined,
        issues: [issue],
      });
    });
    state.review = undefined;
    state.status = "interrupted";
    state.issues = [issue];
    await this.writeState(manifest, state);
  }

  async advanceRun(
    runId: string,
    options: AdvanceTopicGeneratorRunOptions,
  ): Promise<TopicGeneratorManagedRun> {
    if (!options.requestId.trim() || options.requestId.length > 120) {
      throw new TopicGeneratorRunValidationError("Advance requestId is invalid.");
    }
    const release = await this.acquireLock(runId);
    try {
      const run = await this.read(runId);
      await this.reconcileCompletedStages(run.manifest, run.state);
      const processed = run.state.processedRequests.find(
        ({ requestId }) => requestId === options.requestId,
      );
      if (processed) return this.read(runId);
      if (run.state.status === "completed" || run.state.status === "awaiting-approval") {
        return run;
      }
      const stageId = run.state.nextStage;
      if (!stageId || stageId === "user-approval") {
        return run;
      }
      const stage = run.state.stages.find(({ id }) => id === stageId)!;
      if (stage.status === "blocked" &&
          stage.attempts >= TOPIC_GENERATOR_RUN_STAGE_MAX_ATTEMPTS[stageId]) {
        return run;
      }
      const recoverable = await this.readStageEnvelope(
        runId,
        stageId,
        stage.attempts + 1,
      );
      if (stage.status === "running" && recoverable) {
        stage.attempts = recoverable.attempt;
        stage.status = recoverable.status === "completed" ? "completed" : "blocked";
        stage.completedAt = recoverable.completedAt;
        stage.resultDigest = recoverable.outputDigest;
        stage.issues = [...recoverable.issues];
        run.state.status = recoverable.status === "completed" ? "paused" : "blocked";
        run.state.issues = [...recoverable.issues];
        run.state.nextStage = nextPendingStage(run.state);
        const stateDigest = sha256(serialized(run.state));
        run.state.processedRequests = [
          ...run.state.processedRequests,
          {
            requestId: recoverable.requestId,
            stageId,
            stateDigest,
            completedAt: recoverable.completedAt,
          },
        ].slice(-MAX_PROCESSED_REQUESTS);
        await this.writeState(run.manifest, run.state);
        await this.appendEvent(runId, {
          schemaVersion: "topic-generator-run-event/v1",
          runId,
          at: this.timestamp(),
          type: "stage-recovered",
          stageId,
          attempt: recoverable.attempt,
          status: run.state.status,
          digest: recoverable.outputDigest,
          ...(recoverable.status === "blocked"
            ? { errorCode: "STAGE_RECOVERED_BLOCKED" as const }
            : {}),
        });
        return this.read(runId);
      }
      if (stage.status === "running") {
        stage.status = "interrupted";
        run.state.status = "interrupted";
      }
      const attempt = stage.attempts + 1;
      const startedAt = this.timestamp();
      stage.status = "running";
      stage.startedAt = startedAt;
      stage.completedAt = undefined;
      stage.resultDigest = undefined;
      stage.issues = [];
      run.state.status = "running";
      run.state.issues = [];
      await this.writeState(run.manifest, run.state);
      await this.appendEvent(runId, {
        schemaVersion: "topic-generator-run-event/v1",
        runId,
        at: startedAt,
        type: "stage-started",
        stageId,
        attempt,
        status: "running",
      });

      let execution: TopicGeneratorStageExecutionResult;
      try {
        execution = await options.execute({
          manifest: run.manifest,
          state: structuredClone(run.state),
          stageId,
          attempt,
          readStageResult: (upstreamStageId) => this.readStageResult(runId, upstreamStageId),
          assetStore: this.assetStore(runId),
        });
      } catch (error) {
        execution = {
          status: "blocked",
          output: null,
          issues: [error instanceof Error ? error.message : "Stage execution failed."],
        };
      }
      const completedAt = this.timestamp();
      const issues = [...new Set(execution.issues ?? [])];
      const outputDigest = sha256(serialized(execution.output));
      const envelope: TopicGeneratorStageResultEnvelope = {
        schemaVersion: "topic-generator-stage-result/v1",
        requestId: options.requestId,
        stageId,
        attempt,
        status: execution.status,
        startedAt,
        completedAt,
        issues,
        runRequestDigest: run.manifest.requestDigest,
        upstreamResultDigests: upstreamResultDigests(run.state, stageId),
        output: execution.output,
        outputDigest,
      };
      await this.persistAttempt(
        runId,
        stageId,
        attempt,
        execution.request,
        execution.proposal,
        envelope,
      );
      for (const [name, html] of Object.entries(execution.deliverables ?? {})) {
        if (html !== undefined) {
          await this.writeDeliverable(
            run.manifest,
            run.state,
            name as TopicGeneratorDeliverableName,
            html,
          );
        }
      }
      stage.attempts = attempt;
      stage.completedAt = completedAt;
      stage.resultDigest = outputDigest;
      stage.issues = issues;
      stage.status = execution.status === "completed" ? "completed" : "blocked";
      if (execution.reviewPackageDigest) {
        run.state.review = { packageDigest: execution.reviewPackageDigest };
      }
      run.state.status = execution.runStatus ??
        (execution.status === "completed" ? "paused" : "blocked");
      run.state.issues = issues;
      run.state.nextStage = nextPendingStage(run.state);
      const stateDigest = sha256(serialized(run.state));
      run.state.processedRequests = [
        ...run.state.processedRequests,
        { requestId: options.requestId, stageId, stateDigest, completedAt },
      ].slice(-MAX_PROCESSED_REQUESTS);
      await this.writeState(run.manifest, run.state);
      await this.appendEvent(runId, {
        schemaVersion: "topic-generator-run-event/v1",
        runId,
        at: completedAt,
        type: execution.status === "completed" ? "stage-completed" : "stage-blocked",
        stageId,
        attempt,
        status: run.state.status,
        digest: outputDigest,
        ...(execution.status === "blocked"
          ? { errorCode: "STAGE_BLOCKED" as const }
          : {}),
      });
      return this.read(runId);
    } finally {
      await release();
    }
  }

  async validateLegacy(runId: string): Promise<TopicGeneratorLegacyRunValidation> {
    const directory = this.runDirectory(runId);
    const issues: string[] = [];
    let manifest: TopicGeneratorRunManifest;
    try {
      const manifestPath = join(directory, "run.json");
      const file = await lstat(manifestPath);
      if (!file.isFile() || file.isSymbolicLink()) {
        return { valid: false, issues: ["Legacy run.json must be a regular file."] };
      }
      manifest = parseJson<TopicGeneratorRunManifest>(
        await readFile(manifestPath, "utf8"),
        "Legacy run.json",
      );
    } catch {
      return { valid: false, issues: ["Legacy run.json could not be read."] };
    }
    if (manifest.schemaVersion !== "topic-generator-run/v1" ||
        manifest.product !== "TOPIC GENERATOR" || manifest.runId !== runId ||
        !Array.isArray(manifest.artifacts)) {
      return { valid: false, issues: ["Legacy run manifest is invalid."] };
    }
    const artifacts: Record<string, unknown> = {};
    const sourceParts: string[] = [];
    for (const artifact of manifest.artifacts) {
      if (!safeRelativePath(artifact.file) || basename(artifact.file) !== artifact.file) {
        issues.push(`Legacy artifact path is unsafe: ${artifact.file}`);
        continue;
      }
      try {
        const artifactPath = join(directory, artifact.file);
        const file = await lstat(artifactPath);
        if (!file.isFile() || file.isSymbolicLink()) {
          issues.push(`Legacy artifact is not a regular file: ${artifact.file}`);
          continue;
        }
        const contents = await readFile(artifactPath, "utf8");
        const digest = sha256(contents);
        if (digest !== artifact.sha256) {
          issues.push(`Legacy artifact digest is invalid: ${artifact.file}`);
          continue;
        }
        artifacts[artifact.file] = parseJson(contents, artifact.file);
        sourceParts.push(`${artifact.file}:${digest}`);
      } catch {
        issues.push(`Legacy artifact could not be read: ${artifact.file}`);
      }
    }
    return {
      valid: issues.length === 0,
      issues,
      manifest: manifest as TopicGeneratorLegacyRunValidation["manifest"],
      artifacts,
      sourceDigest: sha256(sourceParts.sort().join("\n")),
    };
  }

  async migrateLegacy(
    runId: string,
    options: MigrateLegacyTopicGeneratorRunOptions = {},
  ): Promise<TopicGeneratorManagedRun> {
    const legacy = await this.validateLegacy(runId);
    if (!legacy.valid || !legacy.manifest || !legacy.artifacts || !legacy.sourceDigest) {
      throw new TopicGeneratorRunValidationError(
        legacy.issues.join(" ") || "Legacy run cannot be migrated.",
      );
    }
    const themeArtifact = legacy.artifacts["theme-intent.json"] as {
      keyword?: unknown;
      intent?: unknown;
      proposalReview?: unknown;
    } | undefined;
    const catalogArtifact = legacy.artifacts["catalog-snapshot.json"] as {
      snapshot?: unknown;
      attempts?: unknown;
      fallbackUsed?: unknown;
    } | undefined;
    if (!themeArtifact || !catalogArtifact ||
        typeof themeArtifact.intent !== "object" || themeArtifact.intent === null ||
        typeof catalogArtifact.snapshot !== "object" || catalogArtifact.snapshot === null ||
        !Array.isArray(catalogArtifact.attempts) ||
        typeof catalogArtifact.fallbackUsed !== "boolean" ||
        typeof themeArtifact.proposalReview !== "object" ||
        themeArtifact.proposalReview === null) {
      throw new TopicGeneratorRunValidationError(
        "Legacy topic intent and catalog snapshot do not satisfy the migration contract.",
      );
    }
    const analysis = {
      intent: themeArtifact.intent,
      snapshot: catalogArtifact.snapshot,
      attempts: catalogArtifact.attempts,
      fallbackUsed: catalogArtifact.fallbackUsed,
      proposalReview: themeArtifact.proposalReview,
    } as TopicIntentAnalysis;
    if (analysis.snapshot.keyword !== legacy.manifest.keyword ||
        analysis.intent.schemaVersion !== "theme-intent/v2") {
      throw new TopicGeneratorRunValidationError(
        "Legacy topic intent does not match the run identity or current intent contract.",
      );
    }
    const child = await this.create(
      {
        keyword: legacy.manifest.keyword,
        site: "us",
        language: "zh",
        strategy: "relevance",
        goal: "page",
        ...options.request,
      },
      {
        parentRunId: legacy.manifest.runId,
        origin: {
          type: "legacy-migration",
          sourceDigest: legacy.sourceDigest,
          sourceLabel: legacy.manifest.runId,
        },
      },
    );
    const completedAt = this.timestamp();
    const output = {
      analysis,
      runtime: { mode: "legacy-reused", sourceDigest: legacy.sourceDigest },
    };
    const outputDigest = valueDigest(output);
    const envelope: TopicGeneratorStageResultEnvelope = {
      schemaVersion: "topic-generator-stage-result/v1",
      requestId: `legacy-migration:${legacy.sourceDigest}`,
      stageId: "topic-intent",
      attempt: 1,
      status: "completed",
      startedAt: legacy.manifest.createdAt,
      completedAt,
      issues: [],
      runRequestDigest: child.manifest.requestDigest,
      upstreamResultDigests: {},
      output,
      outputDigest,
    };
    await this.persistAttempt(
      child.manifest.runId,
      "topic-intent",
      1,
      { source: "topic-generator-run/v1", sourceDigest: legacy.sourceDigest },
      null,
      envelope,
    );
    const stage = child.state.stages[0]!;
    stage.status = "completed";
    stage.attempts = 1;
    stage.startedAt = legacy.manifest.createdAt;
    stage.completedAt = completedAt;
    stage.resultDigest = outputDigest;
    child.state.status = "paused";
    await this.writeState(child.manifest, child.state);
    await this.appendEvent(child.manifest.runId, {
      schemaVersion: "topic-generator-run-event/v1",
      runId: child.manifest.runId,
      at: completedAt,
      type: "run-derived",
      stageId: "background-evidence",
      status: "paused",
      digest: legacy.sourceDigest,
    });
    return this.read(child.manifest.runId);
  }

  async derive(
    runId: string,
    options: DeriveTopicGeneratorRunOptions,
  ): Promise<TopicGeneratorManagedRun> {
    const parent = await this.read(runId);
    await this.reconcileCompletedStages(parent.manifest, parent.state);
    const rollbackIndex = TOPIC_GENERATOR_RUN_STAGE_IDS.indexOf(options.rollbackStage);
    if (rollbackIndex < 0 || options.rollbackStage === "user-approval") {
      throw new TopicGeneratorRunValidationError("Rollback stage is invalid.");
    }
    const childRequestInput: TopicGeneratorRunRequest = {
      ...parent.manifest.request,
      ...options.request,
    };
    if (options.request?.strategy !== undefined &&
        !Object.prototype.hasOwnProperty.call(options.request, "requestedSelectionStrategyRef")) {
      delete childRequestInput.requestedSelectionStrategyRef;
    }
    const childRequest = validateRequest(childRequestInput);
    const requiredRollbackStage = requiredRollbackStageForRequestChange(
      parent.manifest.request,
      childRequest,
    );
    const requiredRollbackIndex = requiredRollbackStage
      ? TOPIC_GENERATOR_RUN_STAGE_IDS.indexOf(requiredRollbackStage)
      : -1;
    if (requiredRollbackStage && rollbackIndex > requiredRollbackIndex) {
      throw new TopicGeneratorRunValidationError(
        `Changing run parameters requires rollback to ${requiredRollbackStage}.`,
      );
    }
    const child = await this.create(
      childRequest,
      {
        parentRunId: parent.manifest.runId,
        origin: { type: options.origin },
      },
    );
    const reusableStages = parent.state.stages.filter((stage) =>
      stage.status === "completed" &&
      TOPIC_GENERATOR_RUN_STAGE_IDS.indexOf(stage.id) < rollbackIndex
    );
    for (const stage of reusableStages) {
      await cp(
        join(this.runDirectory(parent.manifest.runId), "stages", stage.id),
        join(this.runDirectory(child.manifest.runId), "stages", stage.id),
        { recursive: true, errorOnExist: true, force: false },
      );
      if (child.manifest.requestDigest !== parent.manifest.requestDigest) {
        const resultPath = join(
          this.runDirectory(child.manifest.runId),
          "stages",
          stage.id,
          `attempt-${String(stage.attempts).padStart(4, "0")}`,
          "result.json",
        );
        const envelope = parseJson<TopicGeneratorStageResultEnvelope>(
          await readFile(resultPath, "utf8"),
          `${stage.id} result.json`,
        );
        envelope.runRequestDigest = child.manifest.requestDigest;
        await writeFile(resultPath, serialized(envelope));
      }
      const childStage = child.state.stages.find(({ id }) => id === stage.id)!;
      Object.assign(childStage, structuredClone(stage));
    }
    for (const deliverable of parent.state.deliverables) {
      const owningStage: TopicGeneratorRunStageId = deliverable.name === "topic-brief.html"
        ? "background-evidence"
        : deliverable.name === "page-draft.html"
          ? "module-merchandising"
          : "user-approval";
      if (deliverable.status !== "ready" ||
          TOPIC_GENERATOR_RUN_STAGE_IDS.indexOf(owningStage) >= rollbackIndex) continue;
      await cp(
        join(this.runDirectory(parent.manifest.runId), deliverable.file),
        join(this.runDirectory(child.manifest.runId), deliverable.file),
        { errorOnExist: true, force: false },
      );
      Object.assign(
        child.state.deliverables.find(({ name }) => name === deliverable.name)!,
        structuredClone(deliverable),
      );
    }
    if (rollbackIndex > TOPIC_GENERATOR_RUN_STAGE_IDS.indexOf("asset-persistence")) {
      await cp(
        join(this.runDirectory(parent.manifest.runId), "assets"),
        join(this.runDirectory(child.manifest.runId), "assets"),
        { recursive: true, force: true },
      );
    }
    child.state.status = "paused";
    child.state.nextStage = options.rollbackStage;
    await this.writeState(child.manifest, child.state);
    await this.appendEvent(child.manifest.runId, {
      schemaVersion: "topic-generator-run-event/v1",
      runId: child.manifest.runId,
      at: this.timestamp(),
      type: "run-derived",
      stageId: options.rollbackStage,
      status: "paused",
    });
    return this.read(child.manifest.runId);
  }

  async approve(runId: string, packageDigest: string, finalHtml: string) {
    const release = await this.acquireLock(runId);
    try {
      const run = await this.read(runId);
      if (run.state.status !== "awaiting-approval" ||
          !run.state.review || run.state.review.packageDigest !== packageDigest) {
        throw new TopicGeneratorRunValidationError(
          "Approval must match the current review package.",
        );
      }
      if (!finalHtml.startsWith("<!doctype html>") || finalHtml.length < 100) {
        throw new TopicGeneratorRunValidationError(
          "The final offline HTML deliverable is invalid.",
        );
      }
      const approvedAt = this.timestamp();
      await this.writeDeliverable(
        run.manifest,
        run.state,
        "page-final.html",
        finalHtml,
      );
      const finalDeliverable = run.state.deliverables.find(
        ({ name }) => name === "page-final.html",
      )!;
      const approvalOutput = {
        packageDigest,
        approvedAt,
        deliverableSha256: finalDeliverable.sha256,
      };
      await this.persistAttempt(
        runId,
        "user-approval",
        1,
        { packageDigest },
        { decision: "approved" },
        {
          schemaVersion: "topic-generator-stage-result/v1",
          requestId: `approval:${packageDigest}`,
          stageId: "user-approval",
          attempt: 1,
          status: "completed",
          startedAt: approvedAt,
          completedAt: approvedAt,
          issues: [],
          runRequestDigest: run.manifest.requestDigest,
          upstreamResultDigests: upstreamResultDigests(run.state, "user-approval"),
          output: approvalOutput,
          outputDigest: valueDigest(approvalOutput),
        },
      );
      run.state.review.approvedAt = approvedAt;
      const approvalStage = run.state.stages.find(({ id }) => id === "user-approval")!;
      approvalStage.status = "completed";
      approvalStage.attempts = 1;
      approvalStage.startedAt = approvedAt;
      approvalStage.completedAt = approvedAt;
      approvalStage.resultDigest = valueDigest(approvalOutput);
      run.state.status = "completed";
      run.state.nextStage = null;
      run.state.issues = [];
      await this.writeState(run.manifest, run.state);
      await this.appendEvent(runId, {
        schemaVersion: "topic-generator-run-event/v1",
        runId,
        at: approvedAt,
        type: "run-approved",
        stageId: "user-approval",
        attempt: 1,
        status: "completed",
        digest: packageDigest,
      });
      return this.read(runId);
    } finally {
      await release();
    }
  }
}
