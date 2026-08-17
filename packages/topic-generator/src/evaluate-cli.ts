#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  evaluateTopicIntentCases,
  parseTopicIntentEvalCases,
} from "./evaluate.js";

interface EvaluationCliOptions {
  casesPath: string;
  limit: number | null;
  pretty: boolean;
  help: boolean;
}

export const TOPIC_INTENT_EVAL_USAGE = `TOPIC INTENT EVALUATION

Compare semantic expectations with live Yami catalog analysis.

Usage:
  topic-intent-eval [--cases evals/topic-intent-cases.json] [--limit 5] [--pretty]

Options:
  --cases   Semantic-contract case file; product inventory is queried live
  --limit   Evaluate only the first N cases
  --pretty  Pretty-print the JSON report
  -h, --help  Show this help`;

export function parseEvaluationCliArgs(args: string[]): EvaluationCliOptions {
  let casesPath = fileURLToPath(new URL("../evals/topic-intent-cases.json", import.meta.url));
  let limit: number | null = null;
  let pretty = false;
  let help = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "-h" || argument === "--help") {
      help = true;
    } else if (argument === "--") {
      continue;
    } else if (argument === "--pretty") {
      pretty = true;
    } else if (argument === "--cases" || argument === "--limit") {
      const value = args[index + 1];
      if (!value || value.startsWith("-")) {
        throw new Error(`${argument} requires a value.`);
      }
      if (argument === "--cases") {
        casesPath = resolve(process.env.INIT_CWD ?? process.cwd(), value);
      } else {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 1) {
          throw new Error("--limit must be a positive integer.");
        }
        limit = parsed;
      }
      index += 1;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }

  return { casesPath, limit, pretty, help };
}

export async function runTopicIntentEvaluationCli(args = process.argv.slice(2)) {
  try {
    const options = parseEvaluationCliArgs(args);
    if (options.help) {
      process.stdout.write(`${TOPIC_INTENT_EVAL_USAGE}\n`);
      return;
    }
    const cases = parseTopicIntentEvalCases(
      JSON.parse(await readFile(options.casesPath, "utf8")),
    );
    const selectedCases = options.limit ? cases.slice(0, options.limit) : cases;
    const report = await evaluateTopicIntentCases(selectedCases);
    process.stdout.write(`${JSON.stringify(report, null, options.pretty ? 2 : 0)}\n`);
    if (report.summary.failed > 0 || report.summary.errors > 0) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Evaluation failed."}\n\n${TOPIC_INTENT_EVAL_USAGE}\n`,
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void runTopicIntentEvaluationCli();
}
