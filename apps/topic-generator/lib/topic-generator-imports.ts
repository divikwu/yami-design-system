import "server-only";

import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import {
  TopicGeneratorRunStore,
  TopicGeneratorRunValidationError,
} from "@yami/topic-generator";

const SESSION_PATTERN = /^[a-f0-9-]{36}$/;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/;
const MAX_FILES = 2_000;
const MAX_TOTAL_BYTES = 256 * 1024 * 1024;
const MAX_FILE_BYTES = 32 * 1024 * 1024;
const MAX_CHUNK_BYTES = 5 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 1024 * 1024;
const SESSION_MAX_AGE_MS = 60 * 60 * 1_000;
const V2_STAGE_IDS = new Set([
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
]);
const DELIVERABLE_NAMES = new Set([
  "topic-brief.html",
  "page-draft.html",
  "page-final.html",
]);

interface ImportDescriptor {
  path: string;
  size: number;
  sha256: string;
}

interface ImportManifestInput {
  path: string;
  contents: string;
}

interface ImportCandidate {
  id: string;
  sourceRoot: string;
  runId: string;
  schemaVersion: "topic-generator-run/v1" | "topic-generator-run/v2" | "unknown";
  keyword: string;
  createdAt: string;
  valid: boolean;
  issues: string[];
}

interface ImportSession {
  schemaVersion: "topic-generator-import-session/v1";
  id: string;
  createdAt: string;
  descriptors: ImportDescriptor[];
  candidates: ImportCandidate[];
  completedPaths: string[];
}

function serialized(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function safePath(path: string) {
  return path.length > 0 && path.length <= 512 && !isAbsolute(path) &&
    !path.includes("\\") && !/^[a-z][a-z0-9+.-]*:/i.test(path) &&
    path.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function isInside(root: string, target: string) {
  const fromRoot = relative(root, target);
  return fromRoot === "" || (!fromRoot.startsWith("..") && !isAbsolute(fromRoot));
}

function candidateRootForManifest(path: string) {
  if (path === "run.json") return "";
  const parts = path.split("/");
  return parts.length === 2 && parts[1] === "run.json" ? parts[0]! : null;
}

function parseCandidate(input: ImportManifestInput): ImportCandidate | null {
  const sourceRoot = candidateRootForManifest(input.path);
  if (sourceRoot === null) return null;
  const issues: string[] = [];
  let value: Record<string, unknown> = {};
  try {
    value = JSON.parse(input.contents) as Record<string, unknown>;
  } catch {
    issues.push("run.json is not valid JSON.");
  }
  const schemaVersion = value.schemaVersion === "topic-generator-run/v1" ||
      value.schemaVersion === "topic-generator-run/v2"
    ? value.schemaVersion
    : "unknown";
  if (schemaVersion === "unknown") issues.push("Run schema is not supported.");
  if (value.product !== "TOPIC GENERATOR") issues.push("Run product identity is invalid.");
  const runId = typeof value.runId === "string" ? value.runId : "";
  if (!/^[a-z0-9][a-z0-9-]{0,95}$/.test(runId)) issues.push("Run id is invalid.");
  const request = value.request as Record<string, unknown> | undefined;
  const keyword = schemaVersion === "topic-generator-run/v2"
    ? (typeof request?.keyword === "string" ? request.keyword : "")
    : (typeof value.keyword === "string" ? value.keyword : "");
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : "";
  if (!keyword) issues.push("Run keyword is missing.");
  if (!Number.isFinite(Date.parse(createdAt))) issues.push("Run creation date is invalid.");
  return {
    id: sha256(`${sourceRoot}\n${runId}`).slice(0, 16),
    sourceRoot,
    runId,
    schemaVersion,
    keyword,
    createdAt,
    valid: issues.length === 0,
    issues,
  };
}

function sourcePathInsideCandidate(path: string, candidate: ImportCandidate) {
  return candidate.sourceRoot === ""
    ? path
    : path.startsWith(`${candidate.sourceRoot}/`)
      ? path.slice(candidate.sourceRoot.length + 1)
      : null;
}

export function isTopicGeneratorV2RunFilePath(path: string) {
  if (path === "run.json" || path === "state.json" || path === "events.jsonl") return true;
  const parts = path.split("/");
  if (parts[0] === "assets") return parts.length > 1;
  if (parts[0] === "deliverables") {
    return parts.length === 2 && DELIVERABLE_NAMES.has(parts[1]!);
  }
  return parts.length === 4 && parts[0] === "stages" && V2_STAGE_IDS.has(parts[1]!) &&
    /^attempt-[0-9]{4}$/.test(parts[2]!) &&
    (parts[3] === "request.json" || parts[3] === "proposal.json" ||
      parts[3] === "result.json");
}

export class TopicGeneratorImportService {
  readonly managedRoot: string;
  readonly root: string;

  constructor(managedRoot: string) {
    this.managedRoot = resolve(managedRoot);
    this.root = join(this.managedRoot, ".imports");
  }

  private sessionDirectory(sessionId: string) {
    if (!SESSION_PATTERN.test(sessionId)) {
      throw new TopicGeneratorRunValidationError("Import session id is invalid.");
    }
    const target = resolve(this.root, sessionId);
    if (!isInside(this.root, target)) {
      throw new TopicGeneratorRunValidationError("Import session path is invalid.");
    }
    return target;
  }

  private async readSession(sessionId: string) {
    try {
      const session = JSON.parse(
        await readFile(join(this.sessionDirectory(sessionId), "session.json"), "utf8"),
      ) as ImportSession;
      if (session.schemaVersion !== "topic-generator-import-session/v1" ||
          session.id !== sessionId ||
          Date.now() - Date.parse(session.createdAt) > SESSION_MAX_AGE_MS) {
        throw new TopicGeneratorRunValidationError("Import session is invalid or expired.");
      }
      return session;
    } catch (error) {
      if (error instanceof TopicGeneratorRunValidationError) throw error;
      throw new TopicGeneratorRunValidationError("Import session was not found.");
    }
  }

  private async writeSession(session: ImportSession) {
    const directory = this.sessionDirectory(session.id);
    const temporary = join(directory, `.session-${randomUUID()}.tmp`);
    await writeFile(temporary, serialized(session), { flag: "wx" });
    await rename(temporary, join(directory, "session.json"));
  }

  async cleanupExpired() {
    await mkdir(this.root, { recursive: true });
    const entries = await readdir(this.root, { withFileTypes: true });
    await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
      try {
        const info = await stat(join(this.root, entry.name));
        if (Date.now() - info.mtimeMs > SESSION_MAX_AGE_MS) {
          await rm(join(this.root, entry.name), { recursive: true, force: true });
        }
      } catch {
        // A concurrent cleanup or commit already removed it.
      }
    }));
  }

  async start(input: {
    files: ImportDescriptor[];
    manifests: ImportManifestInput[];
  }) {
    await this.cleanupExpired();
    if (!Array.isArray(input.files) || input.files.length < 1 || input.files.length > MAX_FILES) {
      throw new TopicGeneratorRunValidationError("Import file count is invalid.");
    }
    const seen = new Set<string>();
    let totalBytes = 0;
    const descriptors = input.files.map((descriptor) => {
      if (!safePath(descriptor.path) || seen.has(descriptor.path) ||
          !Number.isInteger(descriptor.size) || descriptor.size < 0 ||
          descriptor.size > MAX_FILE_BYTES || !DIGEST_PATTERN.test(descriptor.sha256)) {
        throw new TopicGeneratorRunValidationError(
          `Import descriptor is invalid: ${descriptor.path || "unnamed"}`,
        );
      }
      seen.add(descriptor.path);
      totalBytes += descriptor.size;
      return { ...descriptor };
    });
    if (totalBytes > MAX_TOTAL_BYTES) {
      throw new TopicGeneratorRunValidationError("Import total byte limit was exceeded.");
    }
    const manifestByPath = new Map(input.manifests.map((manifest) => [manifest.path, manifest]));
    const manifestDescriptors = descriptors.filter(({ path }) =>
      candidateRootForManifest(path) !== null
    );
    if (manifestDescriptors.length < 1) {
      throw new TopicGeneratorRunValidationError(
        "The selected directory does not contain a root or direct-child run.json.",
      );
    }
    const candidates = manifestDescriptors.flatMap((descriptor) => {
      const manifest = manifestByPath.get(descriptor.path);
      if (!manifest || manifest.contents.length > MAX_MANIFEST_BYTES ||
          new TextEncoder().encode(manifest.contents).byteLength !== descriptor.size ||
          sha256(manifest.contents) !== descriptor.sha256) {
        throw new TopicGeneratorRunValidationError(
          `Manifest contents do not match ${descriptor.path}.`,
        );
      }
      const candidate = parseCandidate(manifest);
      return candidate ? [candidate] : [];
    });
    if (new Set(candidates.map(({ runId }) => runId)).size !== candidates.length) {
      throw new TopicGeneratorRunValidationError(
        "Import candidates must have unique run ids.",
      );
    }
    if (candidates.some(({ sourceRoot }) => sourceRoot === "") && candidates.length > 1) {
      throw new TopicGeneratorRunValidationError(
        "A single-run directory cannot also contain direct-child runs.",
      );
    }
    const id = randomUUID();
    const session: ImportSession = {
      schemaVersion: "topic-generator-import-session/v1",
      id,
      createdAt: new Date().toISOString(),
      descriptors,
      candidates,
      completedPaths: [],
    };
    const directory = this.sessionDirectory(id);
    await mkdir(join(directory, "candidates"), { recursive: true });
    await this.writeSession(session);
    return { id, candidates, limits: { maxChunkBytes: MAX_CHUNK_BYTES } };
  }

  async upload(sessionId: string, path: string, offset: number, chunk: Uint8Array) {
    const session = await this.readSession(sessionId);
    const descriptor = session.descriptors.find((item) => item.path === path);
    if (!descriptor || !safePath(path) || !Number.isInteger(offset) || offset < 0 ||
        chunk.byteLength > MAX_CHUNK_BYTES) {
      throw new TopicGeneratorRunValidationError("Import upload request is invalid.");
    }
    const candidate = session.candidates.find((item) =>
      sourcePathInsideCandidate(path, item) !== null
    );
    if (!candidate) {
      throw new TopicGeneratorRunValidationError("File is outside an import candidate.");
    }
    const relativePath = sourcePathInsideCandidate(path, candidate)!;
    if (!safePath(relativePath)) {
      throw new TopicGeneratorRunValidationError("Imported relative path is invalid.");
    }
    const root = join(this.sessionDirectory(sessionId), "candidates", candidate.runId);
    const target = resolve(root, relativePath);
    if (!isInside(root, target)) {
      throw new TopicGeneratorRunValidationError("Imported path escapes its candidate.");
    }
    await mkdir(dirname(target), { recursive: true });
    const part = `${target}.part`;
    let currentSize = 0;
    try {
      const file = await lstat(part);
      if (!file.isFile() || file.isSymbolicLink()) {
        throw new TopicGeneratorRunValidationError("Import target is not a regular file.");
      }
      currentSize = file.size;
    } catch (error) {
      if (error instanceof TopicGeneratorRunValidationError) throw error;
    }
    if (currentSize !== offset || currentSize + chunk.byteLength > descriptor.size) {
      throw new TopicGeneratorRunValidationError("Import chunk offset or size is invalid.");
    }
    const handle = await open(part, currentSize === 0 ? "wx" : "r+");
    try {
      await handle.write(chunk, 0, chunk.byteLength, offset);
    } finally {
      await handle.close();
    }
    const completed = currentSize + chunk.byteLength === descriptor.size;
    if (completed) {
      const bytes = await readFile(part);
      if (sha256(bytes) !== descriptor.sha256) {
        await rm(part, { force: true });
        throw new TopicGeneratorRunValidationError("Imported file digest does not match.");
      }
      await rename(part, target);
      session.completedPaths = [...new Set([...session.completedPaths, path])];
      await this.writeSession(session);
    }
    return { path, received: currentSize + chunk.byteLength, completed };
  }

  async commit(sessionId: string, candidateIds: string[]) {
    const session = await this.readSession(sessionId);
    if (!Array.isArray(candidateIds) || candidateIds.length < 1) {
      throw new TopicGeneratorRunValidationError("At least one import candidate is required.");
    }
    const selected = candidateIds.map((id) => {
      const candidate = session.candidates.find((item) => item.id === id);
      if (!candidate || !candidate.valid) {
        throw new TopicGeneratorRunValidationError("Import candidate is invalid.");
      }
      return candidate;
    });
    const managedStore = new TopicGeneratorRunStore({ root: this.managedRoot });
    const existing = await managedStore.list();
    const results: Array<{ runId: string; deduplicated: boolean; legacy: boolean }> = [];
    for (const candidate of selected) {
      const files = session.descriptors.filter(({ path }) =>
        sourcePathInsideCandidate(path, candidate) !== null
      );
      const relativeFiles = files.map(({ path }) =>
        sourcePathInsideCandidate(path, candidate)!
      );
      if (candidate.schemaVersion === "topic-generator-run/v2" &&
          (relativeFiles.some((path) => !isTopicGeneratorV2RunFilePath(path)) ||
            !["run.json", "state.json", "events.jsonl"].every((path) =>
              relativeFiles.includes(path)
            ))) {
        throw new TopicGeneratorRunValidationError(
          `Imported v2 run ${candidate.runId} contains an unknown path or is incomplete.`,
        );
      }
      const missing = files.filter(({ path }) => !session.completedPaths.includes(path));
      if (missing.length > 0) {
        throw new TopicGeneratorRunValidationError(
          `Import candidate ${candidate.runId} has ${missing.length} incomplete files.`,
        );
      }
      const candidateRoot = join(
        this.sessionDirectory(sessionId),
        "candidates",
        candidate.runId,
      );
      const temporaryStore = new TopicGeneratorRunStore({
        root: join(this.sessionDirectory(sessionId), "candidates"),
      });
      let sourceDigest = sha256(files
        .map(({ path, sha256: digest }) => `${sourcePathInsideCandidate(path, candidate)}:${digest}`)
        .sort()
        .join("\n"));
      let legacyValidation: Awaited<ReturnType<TopicGeneratorRunStore["validateLegacy"]>> |
        undefined;
      if (candidate.schemaVersion === "topic-generator-run/v1") {
        legacyValidation = await temporaryStore.validateLegacy(candidate.runId);
        if (!legacyValidation.valid || !legacyValidation.sourceDigest) {
          throw new TopicGeneratorRunValidationError(legacyValidation.issues.join(" "));
        }
        const expectedLegacyFiles = new Set([
          "run.json",
          ...(legacyValidation.manifest?.artifacts.map(({ file }) => file) ?? []),
        ]);
        if (relativeFiles.some((path) => !expectedLegacyFiles.has(path)) ||
            [...expectedLegacyFiles].some((path) => !relativeFiles.includes(path))) {
          throw new TopicGeneratorRunValidationError(
            `Imported legacy run ${candidate.runId} contains an unknown path or is incomplete.`,
          );
        }
        sourceDigest = legacyValidation.sourceDigest;
      }
      const sameRun = existing.find(({ runId }) => runId === candidate.runId);
      let sameRunBytes = false;
      if (sameRun) {
        sameRunBytes = (await Promise.all(files.map(async ({ path, sha256: digest }) => {
          const relativePath = sourcePathInsideCandidate(path, candidate)!;
          try {
            const target = join(this.managedRoot, candidate.runId, relativePath);
            const file = await lstat(target);
            return file.isFile() && !file.isSymbolicLink() &&
              sha256(await readFile(target)) === digest;
          } catch {
            return false;
          }
        }))).every(Boolean);
      }
      const duplicate = existing.find(({ origin }) => origin.sourceDigest === sourceDigest) ??
        (sameRunBytes ? sameRun : undefined);
      if (duplicate) {
        results.push({
          runId: duplicate.runId,
          deduplicated: true,
          legacy: duplicate.legacy,
        });
        continue;
      }
      if (candidate.schemaVersion === "topic-generator-run/v2") {
        const detail = await temporaryStore.detail(candidate.runId);
        if (detail.schemaVersion !== "topic-generator-run-detail/v1" ||
            detail.diagnostics.length > 0) {
          throw new TopicGeneratorRunValidationError(
            `Imported v2 run ${candidate.runId} failed stage integrity validation.`,
          );
        }
        for (const deliverable of detail.state.deliverables) {
          if (deliverable.status === "ready") {
            await temporaryStore.readDeliverable(candidate.runId, deliverable.name);
          }
        }
        const manifest = detail.manifest;
        manifest.origin = {
          type: "imported",
          sourceDigest,
          sourceLabel: candidate.runId,
        };
        await writeFile(join(candidateRoot, "run.json"), serialized(manifest));
      } else {
        if (!legacyValidation?.valid) {
          throw new TopicGeneratorRunValidationError("Legacy import validation failed.");
        }
      }
      const target = join(this.managedRoot, candidate.runId);
      try {
        await lstat(target);
        throw new TopicGeneratorRunValidationError(
          `Run id ${candidate.runId} already exists with different source bytes.`,
        );
      } catch (error) {
        if (error instanceof TopicGeneratorRunValidationError) throw error;
      }
      await rename(candidateRoot, target);
      results.push({
        runId: candidate.runId,
        deduplicated: false,
        legacy: candidate.schemaVersion === "topic-generator-run/v1",
      });
    }
    await rm(this.sessionDirectory(sessionId), { recursive: true, force: true });
    return { results };
  }

  async cancel(sessionId: string) {
    await rm(this.sessionDirectory(sessionId), { recursive: true, force: true });
  }
}
