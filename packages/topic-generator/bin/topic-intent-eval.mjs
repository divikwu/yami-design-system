#!/usr/bin/env node

try {
  const { runTopicIntentEvaluationCli } = await import("../dist/evaluate-cli.js");
  await runTopicIntentEvaluationCli(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : "Unable to evaluate topic intent.";
  process.stderr.write(`${message}\nRun the package build before using the CLI.\n`);
  process.exitCode = 1;
}
