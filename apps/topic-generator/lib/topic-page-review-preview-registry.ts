import { randomBytes } from "node:crypto";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import type {
  LandingPageTypeRef,
  TopicPageGenerationSpec,
  TopicPageReviewPackage,
} from "@yami/topic-generator";

const TOKEN_PATTERN = /^[a-f0-9]{48}$/;

export interface TopicPageReviewPreviewRecord {
  schemaVersion: "topic-page-review-preview/v1";
  pageTypeRef: LandingPageTypeRef;
  generationSpec: TopicPageGenerationSpec;
}

export interface TopicPageReviewPreviewRegistry {
  publish(input: {
    pageTypeRef: LandingPageTypeRef;
    generationSpec: TopicPageGenerationSpec;
  }): Promise<TopicPageReviewPackage["previewRefs"]>;
  read(token: string): Promise<TopicPageReviewPreviewRecord | null>;
}

function isInside(root: string, target: string) {
  const fromRoot = relative(root, target);
  return fromRoot === "" || (!fromRoot.startsWith("..") && !isAbsolute(fromRoot));
}

function previewOrigin(value: string) {
  const url = new URL(value);
  const localHttp = url.protocol === "http:" &&
    (url.hostname === "127.0.0.1" || url.hostname === "localhost" || url.hostname === "[::1]");
  if (url.protocol !== "https:" && !localHttp) {
    throw new Error("Preview origin must use HTTPS, except on localhost.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("Preview origin must not contain credentials, query, or fragment values.");
  }
  return url.origin;
}

function isPreviewRecord(value: unknown): value is TopicPageReviewPreviewRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<TopicPageReviewPreviewRecord>;
  return record.schemaVersion === "topic-page-review-preview/v1" &&
    typeof record.pageTypeRef === "string" &&
    record.generationSpec?.schemaVersion === "topic-page-generation-spec/v1" &&
    record.generationSpec.status === "generation-ready" &&
    typeof record.generationSpec.digest === "string";
}

export function createTopicPageReviewPreviewRegistry(options: {
  root: string;
  origin: string;
}): TopicPageReviewPreviewRegistry {
  if (!isAbsolute(options.root)) {
    throw new Error("Preview registry root must be an absolute path.");
  }
  const resolvedRoot = resolve(options.root);
  const origin = previewOrigin(options.origin);
  const targetPath = (token: string) => {
    if (!TOKEN_PATTERN.test(token)) return null;
    const target = resolve(resolvedRoot, `${token}.json`);
    if (!isInside(resolvedRoot, target)) return null;
    return target;
  };

  return {
    publish: async ({ pageTypeRef, generationSpec }) => {
      await mkdir(resolvedRoot, { recursive: true });
      const realRoot = await realpath(resolvedRoot);
      const record: TopicPageReviewPreviewRecord = {
        schemaVersion: "topic-page-review-preview/v1",
        pageTypeRef,
        generationSpec,
      };
      let token = "";
      for (let attempt = 0; attempt < 3; attempt += 1) {
        token = randomBytes(24).toString("hex");
        const target = targetPath(token);
        if (!target || !isInside(realRoot, await realpath(resolvedRoot))) {
          throw new Error("Preview token resolves outside the configured registry root.");
        }
        try {
          await writeFile(target, JSON.stringify(record), { encoding: "utf8", flag: "wx", mode: 0o600 });
          break;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "EEXIST" || attempt === 2) throw error;
        }
      }
      const path = `/internal/topic-generator/review-preview/${token}`;
      return {
        desktop: new URL(`${path}?viewport=desktop`, origin).toString(),
        mobile: new URL(`${path}?viewport=mobile`, origin).toString(),
      };
    },
    read: async (token) => {
      const target = targetPath(token);
      if (!target) return null;
      try {
        const [realRoot, realTarget] = await Promise.all([
          realpath(resolvedRoot),
          realpath(target),
        ]);
        if (!isInside(realRoot, realTarget)) return null;
        const value: unknown = JSON.parse(await readFile(realTarget, "utf8"));
        return isPreviewRecord(value) ? value : null;
      } catch (error) {
        return (error as NodeJS.ErrnoException).code === "ENOENT" ? null : Promise.reject(error);
      }
    },
  };
}

export function createConfiguredTopicPageReviewPreviewRegistry(
  environment: Record<string, string | undefined> = process.env,
) {
  const assetRoot = environment.TOPIC_GENERATOR_ASSET_ROOT?.trim();
  if (!assetRoot) {
    throw new Error("TOPIC_GENERATOR_ASSET_ROOT is not configured.");
  }
  return createTopicPageReviewPreviewRegistry({
    root: resolve(assetRoot, ".topic-page-review-previews"),
    origin: environment.TOPIC_GENERATOR_PREVIEW_ORIGIN?.trim() || "http://127.0.0.1:3300",
  });
}
