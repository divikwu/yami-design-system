import "server-only";

import { createReadStream } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { Zip, ZipDeflate, ZipPassThrough } from "fflate";
import type { TopicGeneratorRunStore } from "@yami/topic-generator";
import { isTopicGeneratorV2RunFilePath } from "./topic-generator-imports";

interface TopicGeneratorRunArchiveFile {
  absolutePath: string;
  relativePath: string;
}

async function listArchiveFiles(
  directory: string,
  runDirectory: string,
): Promise<TopicGeneratorRunArchiveFile[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: TopicGeneratorRunArchiveFile[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listArchiveFiles(absolutePath, runDirectory));
      continue;
    }
    if (!entry.isFile()) continue;
    const relativePath = relative(runDirectory, absolutePath).split("\\").join("/");
    if (isTopicGeneratorV2RunFilePath(relativePath)) {
      files.push({ absolutePath, relativePath });
    }
  }
  return files;
}

function shouldCompress(path: string) {
  return path.endsWith(".json") || path.endsWith(".jsonl") || path.endsWith(".html");
}

export async function createTopicGeneratorRunArchive(
  store: TopicGeneratorRunStore,
  runId: string,
) {
  const run = await store.read(runId);
  const runDirectory = resolve(store.root, run.manifest.runId);
  const files = await listArchiveFiles(runDirectory, runDirectory);
  let zip: Zip | undefined;
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      zip = new Zip((error, chunk, final) => {
        if (cancelled) return;
        if (error) {
          cancelled = true;
          controller.error(error);
          return;
        }
        controller.enqueue(chunk);
        if (final) controller.close();
      });
      void (async () => {
        try {
          for (const file of files) {
            if (cancelled) return;
            const archivePath = `${run.manifest.runId}/${file.relativePath}`;
            const target = shouldCompress(file.relativePath)
              ? new ZipDeflate(archivePath, { level: 6 })
              : new ZipPassThrough(archivePath);
            target.mtime = new Date(run.state.updatedAt);
            zip!.add(target);
            for await (const chunk of createReadStream(file.absolutePath)) {
              if (cancelled) return;
              target.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
            }
            target.push(new Uint8Array(), true);
          }
          zip!.end();
        } catch (error) {
          if (!cancelled) {
            cancelled = true;
            zip?.terminate();
            controller.error(error);
          }
        }
      })();
    },
    cancel() {
      cancelled = true;
      zip?.terminate();
    },
  });
  return {
    fileName: `${run.manifest.runId}.zip`,
    stream,
  };
}
