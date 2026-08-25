#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, lstat, mkdir, readdir } from "node:fs/promises";
import { COPYFILE_EXCL } from "node:constants";
import { dirname, isAbsolute, relative, resolve } from "node:path";

function usage() {
  return [
    "Usage: pnpm topic-generator:migrate-storage -- --source <absolute-path> --target <absolute-path> [--dry-run|--verify-only]",
    "",
    "Copies only missing files, never overwrites the source or target, and verifies every file with SHA-256.",
  ].join("\n");
}

function parseArguments(argv) {
  const options = { dryRun: false, verifyOnly: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") {
      continue;
    }
    if (argument === "--source" || argument === "--target") {
      const value = argv[index + 1];
      if (!value) throw new Error(`${argument} requires a path.`);
      options[argument.slice(2)] = value;
      index += 1;
    } else if (argument === "--dry-run") {
      options.dryRun = true;
    } else if (argument === "--verify-only") {
      options.verifyOnly = true;
    } else if (argument === "--help" || argument === "-h") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!options.source || !options.target) {
    throw new Error("--source and --target are required.");
  }
  if (options.dryRun && options.verifyOnly) {
    throw new Error("--dry-run and --verify-only cannot be combined.");
  }
  return options;
}

function validateRoots(source, target) {
  if (!isAbsolute(source) || !isAbsolute(target)) {
    throw new Error("Source and target paths must be absolute.");
  }
  const resolvedSource = resolve(source);
  const resolvedTarget = resolve(target);
  const sourceToTarget = relative(resolvedSource, resolvedTarget);
  const targetToSource = relative(resolvedTarget, resolvedSource);
  if (
    resolvedSource === resolvedTarget ||
    (!sourceToTarget.startsWith("..") && sourceToTarget !== "") ||
    (!targetToSource.startsWith("..") && targetToSource !== "")
  ) {
    throw new Error("Source and target must be separate, non-nested directories.");
  }
  return { source: resolvedSource, target: resolvedTarget };
}

async function filesUnder(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(current, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not supported: ${relative(root, path)}`);
    }
    if (entry.isDirectory()) files.push(...await filesUnder(root, path));
    else if (entry.isFile()) files.push(relative(root, path));
    else throw new Error(`Unsupported filesystem entry: ${relative(root, path)}`);
  }
  return files.sort();
}

async function fileDigest(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function existingFile(path) {
  try {
    const stats = await lstat(path);
    if (!stats.isFile()) throw new Error(`Target entry is not a regular file: ${path}`);
    return stats;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function migrate({ source, target, dryRun, verifyOnly }) {
  const sourceFiles = await filesUnder(source);
  let copied = 0;
  let bytes = 0;
  for (const relativePath of sourceFiles) {
    const sourcePath = resolve(source, relativePath);
    const targetPath = resolve(target, relativePath);
    const [sourceStats, targetStats] = await Promise.all([
      lstat(sourcePath),
      existingFile(targetPath),
    ]);
    bytes += sourceStats.size;
    if (!targetStats) {
      if (verifyOnly) throw new Error(`Target is missing: ${relativePath}`);
      if (!dryRun) {
        await mkdir(dirname(targetPath), { recursive: true });
        await copyFile(sourcePath, targetPath, COPYFILE_EXCL);
      }
      copied += 1;
      continue;
    }
    if (sourceStats.size !== targetStats.size) {
      throw new Error(`Existing target size differs: ${relativePath}`);
    }
    const [sourceDigest, targetDigest] = await Promise.all([
      fileDigest(sourcePath),
      fileDigest(targetPath),
    ]);
    if (sourceDigest !== targetDigest) {
      throw new Error(`Existing target content differs: ${relativePath}`);
    }
  }
  if (dryRun) return { files: sourceFiles.length, bytes, copied, verified: 0 };

  for (const relativePath of sourceFiles) {
    const [sourceDigest, targetDigest] = await Promise.all([
      fileDigest(resolve(source, relativePath)),
      fileDigest(resolve(target, relativePath)),
    ]);
    if (sourceDigest !== targetDigest) {
      throw new Error(`Verification failed: ${relativePath}`);
    }
  }
  return { files: sourceFiles.length, bytes, copied, verified: sourceFiles.length };
}

try {
  const options = parseArguments(process.argv.slice(2));
  const roots = validateRoots(options.source, options.target);
  const result = await migrate({ ...roots, ...options });
  process.stdout.write(`${JSON.stringify({ ...roots, ...result }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n\n${usage()}\n`);
  process.exitCode = 1;
}
