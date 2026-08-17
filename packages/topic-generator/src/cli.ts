#!/usr/bin/env node

/** Command-line adapter for the portable TOPIC GENERATOR package. */

import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { analyzeTopicIntent, type TopicIntentAnalysis } from "./analyze.js";
import { buildTopicPagePlanMatrix } from "./planner.js";
import {
  buildTopicGeneratorRunArtifacts,
  writeTopicGeneratorRunArtifacts,
  type TopicGeneratorRunManifest,
} from "./run-artifact.js";
import { parseSemanticProposal } from "./topic-intent.js";

export interface TopicGeneratorCliOptions {
  help: boolean;
  keyword: string;
  pretty: boolean;
  proposalPath: string;
  outputDir: string;
}

export class TopicGeneratorCliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TopicGeneratorCliError";
  }
}

export const TOPIC_GENERATOR_USAGE = `TOPIC GENERATOR

Analyze a keyword with live Yami catalog evidence.

Usage:
  topic-generator --keyword "ANUA" [--pretty]
  topic-generator "home storage" [--proposal proposal.json] [--output runs]

Options:
  -k, --keyword   Keyword to analyze
  --proposal      Optional semantic-proposal/v1 JSON from the product Agent
  -o, --output    Explicit directory for versioned Run Artifacts
  --pretty        Pretty-print the JSON result
  -h, --help      Show this help`;

export function parseTopicGeneratorCliArgs(args: string[]): TopicGeneratorCliOptions {
  const positional: string[] = [];
  let keyword = "";
  let pretty = false;
  let help = false;
  let proposalPath = "";
  let outputDir = "";

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "-h" || argument === "--help") {
      help = true;
    } else if (argument === "--") {
      continue;
    } else if (argument === "--pretty") {
      pretty = true;
    } else if (argument === "-k" || argument === "--keyword") {
      const value = args[index + 1];
      if (!value || value.startsWith("-")) {
        throw new TopicGeneratorCliError(`${argument} requires a keyword.`);
      }
      keyword = value;
      index += 1;
    } else if (argument === "--proposal" || argument === "-o" || argument === "--output") {
      const value = args[index + 1];
      if (!value || value.startsWith("-")) {
        throw new TopicGeneratorCliError(`${argument} requires a path.`);
      }
      if (argument === "--proposal") proposalPath = value;
      else outputDir = value;
      index += 1;
    } else if (argument.startsWith("-")) {
      throw new TopicGeneratorCliError(`Unknown option: ${argument}`);
    } else {
      positional.push(argument);
    }
  }

  if (!keyword) keyword = positional.join(" ");
  return {
    help,
    keyword: keyword.trim(),
    pretty,
    proposalPath,
    outputDir,
  };
}

export async function loadSemanticProposal(path: string) {
  let value: unknown;
  try {
    value = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new TopicGeneratorCliError(
      error instanceof SyntaxError
        ? `Semantic Proposal is not valid JSON: ${path}`
        : `Semantic Proposal could not be read: ${path}`,
    );
  }
  return parseSemanticProposal(value);
}

export function resolveTopicGeneratorPath(path: string, baseDirectory: string) {
  return resolve(baseDirectory, path);
}

export function buildTopicIntentReport(
  analysis: TopicIntentAnalysis,
  runArtifact?: { directory: string; manifest: TopicGeneratorRunManifest },
) {
  return {
    product: "TOPIC GENERATOR",
    schemaVersion: analysis.intent.schemaVersion,
    keyword: analysis.snapshot.keyword,
    analyzedAt: analysis.snapshot.fetchedAt,
    intent: analysis.intent,
    evidence: {
      provider: analysis.snapshot.provider,
      sourceUrl: analysis.snapshot.sourceUrl,
      retrievalTerms: analysis.snapshot.retrievalTerms ?? [analysis.snapshot.keyword],
      fallbackUsed: analysis.fallbackUsed,
      attempts: analysis.attempts,
      productCount: analysis.snapshot.products.length,
      topProducts: analysis.snapshot.products.slice(0, 5).map((product) => ({
        id: product.id,
        title: product.title,
        brand: product.brand,
        categoryPath: [
          product.categoryL1Name,
          product.categoryL2Name,
          product.categoryL3Name,
        ].filter((value): value is string => Boolean(value)),
      })),
    },
    proposalReview: analysis.proposalReview,
    ...(runArtifact ? { runArtifact } : {}),
  };
}

export async function runTopicGeneratorCli(args = process.argv.slice(2)) {
  try {
    const options = parseTopicGeneratorCliArgs(args);
    if (options.help) {
      process.stdout.write(`${TOPIC_GENERATOR_USAGE}\n`);
      return;
    }
    if (!options.keyword) {
      throw new TopicGeneratorCliError("A keyword is required.");
    }

    const callerDirectory = process.env.INIT_CWD ?? process.cwd();
    const semanticProposal = options.proposalPath
      ? await loadSemanticProposal(
          resolveTopicGeneratorPath(options.proposalPath, callerDirectory),
        )
      : undefined;
    const analysis = await analyzeTopicIntent(options.keyword, { semanticProposal });
    let runArtifact: { directory: string; manifest: TopicGeneratorRunManifest } | undefined;
    if (options.outputDir) {
      const artifacts = buildTopicGeneratorRunArtifacts(
        analysis,
        buildTopicPagePlanMatrix(analysis.snapshot),
      );
      runArtifact = {
        directory: await writeTopicGeneratorRunArtifacts(
          resolveTopicGeneratorPath(options.outputDir, callerDirectory),
          artifacts,
        ),
        manifest: artifacts.manifest,
      };
    }
    const report = buildTopicIntentReport(analysis, runArtifact);
    process.stdout.write(`${JSON.stringify(report, null, options.pretty ? 2 : 0)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Keyword analysis failed.";
    process.stderr.write(`${message}\n\n${TOPIC_GENERATOR_USAGE}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void runTopicGeneratorCli();
}
