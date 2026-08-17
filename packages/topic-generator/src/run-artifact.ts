import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { TopicIntentAnalysis } from "./analyze.js";
import type { TopicPlanMatrix } from "./types.js";

export interface RunArtifactDescriptor {
  name: "theme-intent" | "catalog-snapshot" | "page-plans";
  file: string;
  schemaVersion: string;
  sha256: string;
}

export interface TopicGeneratorRunManifest {
  schemaVersion: "topic-generator-run/v1";
  product: "TOPIC GENERATOR";
  runId: string;
  keyword: string;
  createdAt: string;
  fallbackUsed: boolean;
  proposalStatus: TopicIntentAnalysis["proposalReview"]["status"];
  artifacts: RunArtifactDescriptor[];
}

export interface TopicGeneratorRunArtifacts {
  manifest: TopicGeneratorRunManifest;
  files: Record<string, string>;
}

function serialized(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(contents: string) {
  return createHash("sha256").update(contents).digest("hex");
}

function runSlug(keyword: string) {
  const slug = keyword
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug || "topic";
}

export function buildTopicGeneratorRunArtifacts(
  analysis: TopicIntentAnalysis,
  plans: TopicPlanMatrix,
): TopicGeneratorRunArtifacts {
  const payloads = [
    {
      name: "theme-intent",
      file: "theme-intent.json",
      schemaVersion: analysis.intent.schemaVersion,
      value: {
        schemaVersion: analysis.intent.schemaVersion,
        keyword: analysis.snapshot.keyword,
        intent: analysis.intent,
        proposalReview: analysis.proposalReview,
      },
    },
    {
      name: "catalog-snapshot",
      file: "catalog-snapshot.json",
      schemaVersion: "catalog-snapshot/v1",
      value: {
        schemaVersion: "catalog-snapshot/v1",
        snapshot: analysis.snapshot,
        attempts: analysis.attempts,
        fallbackUsed: analysis.fallbackUsed,
      },
    },
    {
      name: "page-plans",
      file: "page-plans.json",
      schemaVersion: "page-plans/v1",
      value: { schemaVersion: "page-plans/v1", plans },
    },
  ] as const;
  const files = Object.fromEntries(
    payloads.map((payload) => [payload.file, serialized(payload.value)]),
  );
  const artifacts = payloads.map<RunArtifactDescriptor>((payload) => ({
    name: payload.name,
    file: payload.file,
    schemaVersion: payload.schemaVersion,
    sha256: sha256(files[payload.file]!),
  }));
  const identity = sha256(artifacts.map((artifact) => artifact.sha256).join(":"))
    .slice(0, 12);
  const timestamp = analysis.snapshot.fetchedAt.replace(/[^0-9]/g, "").slice(0, 17);

  return {
    manifest: {
      schemaVersion: "topic-generator-run/v1",
      product: "TOPIC GENERATOR",
      runId: `${runSlug(analysis.snapshot.keyword)}-${timestamp}-${identity}`,
      keyword: analysis.snapshot.keyword,
      createdAt: analysis.snapshot.fetchedAt,
      fallbackUsed: analysis.fallbackUsed,
      proposalStatus: analysis.proposalReview.status,
      artifacts,
    },
    files,
  };
}

export async function writeTopicGeneratorRunArtifacts(
  outputDirectory: string,
  artifacts: TopicGeneratorRunArtifacts,
) {
  const runDirectory = join(outputDirectory, artifacts.manifest.runId);
  await mkdir(outputDirectory, { recursive: true });
  await mkdir(runDirectory);
  await Promise.all([
    ...Object.entries(artifacts.files).map(([file, contents]) =>
      writeFile(join(runDirectory, file), contents, { encoding: "utf8", flag: "wx" })
    ),
    writeFile(
      join(runDirectory, "run.json"),
      serialized(artifacts.manifest),
      { encoding: "utf8", flag: "wx" },
    ),
  ]);
  return runDirectory;
}
