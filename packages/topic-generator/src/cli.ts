#!/usr/bin/env node

/** Command-line adapter for the portable TOPIC GENERATOR package. */

import { pathToFileURL } from "node:url";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { analyzeTopicIntent, type TopicIntentAnalysis } from "./analyze.js";
import {
  buildTopicPagePlanFromProductSelection,
  buildTopicPagePlanMatrix,
} from "./planner.js";
import {
  parseCatalogCandidateSnapshot,
  parseCatalogTaxonomySnapshot,
  createLandingPageAgentTaxonomySnapshot,
  runProductSelectionWorkflow,
  type ProductSelectionStrategyRef,
} from "./product-selection/index.js";
import {
  buildTopicGeneratorRunArtifacts,
  writeTopicGeneratorRunArtifacts,
  type TopicGeneratorRunManifest,
} from "./run-artifact.js";
import {
  advancePageMerchandisingRun,
  type TopicPageTemplateRef,
} from "./page-merchandising/index.js";
import { advanceTopicPageContentRun } from "./page-content/index.js";
import {
  advanceTopicPageVisualRun,
  type TopicPageVisualProductionMode,
} from "./page-visual/index.js";
import { parseSemanticProposal } from "./topic-intent.js";
import type { ContentLanguage } from "./types.js";
import { yamiCatalogCandidateAdapter } from "./yami-catalog.js";

export interface TopicGeneratorCliOptions {
  help: boolean;
  keyword: string;
  pretty: boolean;
  proposalPath: string;
  outputDir: string;
  selectionStrategy: ProductSelectionStrategyRef | "";
  taxonomyPath: string;
  taxonomyTsvPath: string;
  categoryProposalPath: string;
  candidateSnapshotPath: string;
  sceneProposalPath: string;
  pageTemplateRef: TopicPageTemplateRef | "";
  moduleProposalPath: string;
  contentLanguage: ContentLanguage | "";
  contentProposalPath: string;
  visual: boolean;
  visualProposalPath: string;
  visualProductionMode: TopicPageVisualProductionMode;
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
  topic-generator "Matcha" --selection-strategy category-role/landing-page-agent@1 \
    --taxonomy taxonomy.json --category-proposal categories.json

Options:
  -k, --keyword   Keyword to analyze
  --proposal      Optional semantic-proposal/v1 or v2 JSON from the Topic Intent Agent
  --selection-strategy  Versioned ProductSelection config ref
  --taxonomy            CatalogTaxonomySnapshot JSON for category-role
  --taxonomy-tsv        LandingPageAgent category TSV; imported and digest-bound
  --category-proposal   CategoryRoleProposal JSON from the product Agent
  --candidate-snapshot  CatalogCandidateSnapshot JSON from a previous run
  --scene-proposal      SceneProposal JSON from the product Agent
  --page-template       Versioned PageMerchandising template ref
  --module-proposal     ModuleMerchandisingProposal JSON from the Topic Generator Agent
  --content-language    Content language: en or zh
  --content-proposal    TopicPageContentProposal JSON from the Content Agent
  --visual              Request bounded Visual Agent tasks after a ready ContentSpec
  --visual-proposal     TopicPageVisualProposal JSON from the Visual Agent
  --visual-production-mode  generated-images or source-product-images
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
  let selectionStrategy: ProductSelectionStrategyRef | "" = "";
  let taxonomyPath = "";
  let taxonomyTsvPath = "";
  let categoryProposalPath = "";
  let candidateSnapshotPath = "";
  let sceneProposalPath = "";
  let pageTemplateRef: TopicPageTemplateRef | "" = "";
  let moduleProposalPath = "";
  let contentLanguage: ContentLanguage | "" = "";
  let contentProposalPath = "";
  let visual = false;
  let visualProposalPath = "";
  let visualProductionMode: TopicPageVisualProductionMode = "generated-images";

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "-h" || argument === "--help") {
      help = true;
    } else if (argument === "--") {
      continue;
    } else if (argument === "--pretty") {
      pretty = true;
    } else if (argument === "--visual") {
      visual = true;
    } else if (argument === "-k" || argument === "--keyword") {
      const value = args[index + 1];
      if (!value || value.startsWith("-")) {
        throw new TopicGeneratorCliError(`${argument} requires a keyword.`);
      }
      keyword = value;
      index += 1;
    } else if (argument === "--content-language") {
      const value = args[index + 1];
      if (value !== "en" && value !== "zh") {
        throw new TopicGeneratorCliError("--content-language must be en or zh.");
      }
      contentLanguage = value;
      index += 1;
    } else if (argument === "--visual-production-mode") {
      const value = args[index + 1];
      if (value !== "generated-images" && value !== "source-product-images") {
        throw new TopicGeneratorCliError(
          "--visual-production-mode must be generated-images or source-product-images.",
        );
      }
      visualProductionMode = value;
      visual = true;
      index += 1;
    } else if ([
      "--proposal",
      "-o",
      "--output",
      "--selection-strategy",
      "--taxonomy",
      "--taxonomy-tsv",
      "--category-proposal",
      "--candidate-snapshot",
      "--scene-proposal",
      "--page-template",
      "--module-proposal",
      "--content-proposal",
      "--visual-proposal",
    ].includes(argument)) {
      const value = args[index + 1];
      if (!value || value.startsWith("-")) {
        throw new TopicGeneratorCliError(`${argument} requires a path.`);
      }
      if (argument === "--proposal") proposalPath = value;
      else if (argument === "-o" || argument === "--output") outputDir = value;
      else if (argument === "--selection-strategy") {
        selectionStrategy = value as ProductSelectionStrategyRef;
      } else if (argument === "--taxonomy") taxonomyPath = value;
      else if (argument === "--taxonomy-tsv") taxonomyTsvPath = value;
      else if (argument === "--category-proposal") categoryProposalPath = value;
      else if (argument === "--candidate-snapshot") candidateSnapshotPath = value;
      else if (argument === "--scene-proposal") sceneProposalPath = value;
      else if (argument === "--page-template") {
        pageTemplateRef = value as TopicPageTemplateRef;
      } else if (argument === "--module-proposal") moduleProposalPath = value;
      else if (argument === "--content-proposal") contentProposalPath = value;
      else if (argument === "--visual-proposal") {
        visualProposalPath = value;
        visual = true;
      }
      index += 1;
    } else if (argument.startsWith("-")) {
      throw new TopicGeneratorCliError(`Unknown option: ${argument}`);
    } else {
      positional.push(argument);
    }
  }

  if (!keyword) keyword = positional.join(" ");
  if (taxonomyPath && taxonomyTsvPath) {
    throw new TopicGeneratorCliError("Choose either --taxonomy or --taxonomy-tsv.");
  }
  return {
    help,
    keyword: keyword.trim(),
    pretty,
    proposalPath,
    outputDir,
    selectionStrategy,
    taxonomyPath,
    taxonomyTsvPath,
    categoryProposalPath,
    candidateSnapshotPath,
    sceneProposalPath,
    pageTemplateRef,
    moduleProposalPath,
    contentLanguage,
    contentProposalPath,
    visual,
    visualProposalPath,
    visualProductionMode,
  };
}

async function loadJsonFile(path: string, label: string) {
  try {
    return JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch (error) {
    throw new TopicGeneratorCliError(
      error instanceof SyntaxError
        ? `${label} is not valid JSON: ${path}`
        : `${label} could not be read: ${path}`,
    );
  }
}

export async function loadSemanticProposal(path: string) {
  return parseSemanticProposal(await loadJsonFile(path, "Semantic Proposal"));
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
    const resolveInputPath = (path: string) =>
      resolveTopicGeneratorPath(path, callerDirectory);
    const taxonomySnapshot = options.taxonomyPath
      ? parseCatalogTaxonomySnapshot(await loadJsonFile(
          resolveInputPath(options.taxonomyPath),
          "CatalogTaxonomySnapshot",
        ))
      : options.taxonomyTsvPath
        ? await (async () => {
            const taxonomyPath = resolveInputPath(options.taxonomyTsvPath);
            try {
              const [tsv, fileStat] = await Promise.all([
                readFile(taxonomyPath, "utf8"),
                stat(taxonomyPath),
              ]);
              return createLandingPageAgentTaxonomySnapshot({
                site: "us",
                sourceRef: options.taxonomyTsvPath,
                fetchedAt: fileStat.mtime.toISOString(),
                tsv,
              });
            } catch (error) {
              throw new TopicGeneratorCliError(
                error instanceof Error
                  ? `LandingPageAgent taxonomy could not be imported: ${error.message}`
                  : `LandingPageAgent taxonomy could not be imported: ${taxonomyPath}`,
              );
            }
          })()
      : undefined;
    const categoryRoleProposal = options.categoryProposalPath
      ? await loadJsonFile(resolveInputPath(options.categoryProposalPath), "CategoryRoleProposal")
      : undefined;
    const candidateSnapshot = options.candidateSnapshotPath
      ? parseCatalogCandidateSnapshot(await loadJsonFile(
          resolveInputPath(options.candidateSnapshotPath),
          "CatalogCandidateSnapshot",
        ))
      : undefined;
    const sceneProposal = options.sceneProposalPath
      ? await loadJsonFile(resolveInputPath(options.sceneProposalPath), "SceneProposal")
      : undefined;
    const moduleProposal = options.moduleProposalPath
      ? await loadJsonFile(
          resolveInputPath(options.moduleProposalPath),
          "ModuleMerchandisingProposal",
        )
      : undefined;
    const contentProposal = options.contentProposalPath
      ? await loadJsonFile(
          resolveInputPath(options.contentProposalPath),
          "TopicPageContentProposal",
        )
      : undefined;
    const visualProposal = options.visualProposalPath
      ? await loadJsonFile(
          resolveInputPath(options.visualProposalPath),
          "TopicPageVisualProposal",
        )
      : undefined;
    if ((options.pageTemplateRef || moduleProposal) && !options.selectionStrategy) {
      throw new TopicGeneratorCliError(
        "PageMerchandising requires --selection-strategy and a ready ProductSelectionResult.",
      );
    }
    if (contentProposal !== undefined && !options.contentLanguage) {
      throw new TopicGeneratorCliError(
        "--content-proposal requires --content-language en or zh.",
      );
    }
    if ((options.contentLanguage || contentProposal) && !moduleProposal) {
      throw new TopicGeneratorCliError(
        "TopicPageContent requires --module-proposal and a ready TopicPagePlan v2.",
      );
    }
    if (options.visual && (!options.contentLanguage || contentProposal === undefined)) {
      throw new TopicGeneratorCliError(
        "TopicPageVisual requires --content-language and --content-proposal for a ready TopicPageContentSpec.",
      );
    }
    const productSelection = options.selectionStrategy
      ? await runProductSelectionWorkflow({
          snapshot: analysis.snapshot,
          strategyRef: options.selectionStrategy,
          taxonomySnapshot,
          categoryRoleProposal,
          candidateSnapshot,
          sceneProposal,
          candidateAdapter: yamiCatalogCandidateAdapter,
        })
      : undefined;
    const pageMerchandising = productSelection?.run.status === "ready" &&
        (options.pageTemplateRef || moduleProposal)
      ? advancePageMerchandisingRun({
          intent: analysis.intent,
          selection: productSelection.run.result,
          ...(options.pageTemplateRef ? { templateRef: options.pageTemplateRef } : {}),
          ...(moduleProposal === undefined ? {} : { proposal: moduleProposal }),
        })
      : undefined;
    const pageContent = productSelection?.run.status === "ready" &&
        pageMerchandising?.status === "ready" && options.contentLanguage
      ? advanceTopicPageContentRun({
          intent: analysis.intent,
          selection: productSelection.run.result,
          plan: pageMerchandising.plan,
          language: options.contentLanguage,
          ...(contentProposal === undefined ? {} : { proposal: contentProposal }),
        })
      : undefined;
    const pageVisual = productSelection?.run.status === "ready" &&
        pageMerchandising?.status === "ready" && pageContent?.status === "ready" &&
        options.visual
      ? advanceTopicPageVisualRun({
          intent: analysis.intent,
          selection: productSelection.run.result,
          plan: pageMerchandising.plan,
          contentSpec: pageContent.spec,
          productionMode: options.visualProductionMode,
          ...(visualProposal === undefined ? {} : { proposal: visualProposal }),
        })
      : undefined;
    const pagePlans = buildTopicPagePlanMatrix(analysis.snapshot);
    if (productSelection?.run.status === "ready" &&
        productSelection.run.result.strategyRef.startsWith("category-role/")) {
      pagePlans.en["category-role"] = buildTopicPagePlanFromProductSelection(
        analysis.snapshot,
        productSelection.run.result,
        "en",
      );
      pagePlans.zh["category-role"] = buildTopicPagePlanFromProductSelection(
        analysis.snapshot,
        productSelection.run.result,
        "zh",
      );
    }
    let runArtifact: { directory: string; manifest: TopicGeneratorRunManifest } | undefined;
    if (options.outputDir) {
      const artifacts = buildTopicGeneratorRunArtifacts(
        analysis,
        pagePlans,
      );
      runArtifact = {
        directory: await writeTopicGeneratorRunArtifacts(
          resolveTopicGeneratorPath(options.outputDir, callerDirectory),
          artifacts,
        ),
        manifest: artifacts.manifest,
      };
    }
    const report = {
      ...buildTopicIntentReport(analysis, runArtifact),
      ...(productSelection ? {
        productSelection: {
          run: productSelection.run,
          artifacts: productSelection.artifacts,
        },
        ...(productSelection.run.status === "ready" ? { pagePlans } : {}),
        ...(pageMerchandising ? { pageMerchandising } : {}),
        ...(pageContent ? { pageContent } : {}),
        ...(pageVisual ? { pageVisual } : {}),
      } : {}),
    };
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
