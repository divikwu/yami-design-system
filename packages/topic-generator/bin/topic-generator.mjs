#!/usr/bin/env node
// Portable CLI entrypoint for the TOPIC GENERATOR product package.

try {
  const { runTopicGeneratorCli } = await import("../dist/cli.js");
  await runTopicGeneratorCli(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : "Unable to start TOPIC GENERATOR.";
  process.stderr.write(`${message}\nRun the package build before using the CLI.\n`);
  process.exitCode = 1;
}
