import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { TopicPageGenerationSpec } from "@yami/topic-generator";

import { createTopicPageReviewPreviewRegistry } from "./topic-page-review-preview-registry";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

function generationSpec(): TopicPageGenerationSpec {
  return {
    schemaVersion: "topic-page-generation-spec/v1",
    status: "generation-ready",
    keyword: "Matcha",
    site: "us",
    language: "zh",
    strategyRef: "relevance/intent-themes@2",
    templateRef: "topic-landing/topic-relevance@1",
    bindings: {
      themeIntentDigest: "sha256:intent",
      productSelectionDigest: "sha256:selection",
      topicPagePlanDigest: "sha256:plan",
      topicPageContentSpecDigest: "sha256:content",
      topicPageAssetManifestDigest: "sha256:assets",
    },
    moduleOrder: [],
    modules: [],
    digest: "sha256:generation",
  };
}

describe("Topic Page review preview registry", () => {
  it("publishes a generation spec under an unguessable local token and returns absolute refs", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-page-review-preview-"));
    roots.push(root);
    const registry = createTopicPageReviewPreviewRegistry({
      root,
      origin: "http://127.0.0.1:3300",
    });

    const previewRefs = await registry.publish({
      pageTypeRef: "landing-page/topic@2",
      generationSpec: generationSpec(),
    });

    const desktop = new URL(previewRefs.desktop);
    const mobile = new URL(previewRefs.mobile);
    const token = desktop.pathname.split("/").at(-1);
    expect(token).toMatch(/^[a-f0-9]{48}$/);
    expect(mobile.pathname).toBe(desktop.pathname);
    expect(desktop.searchParams.get("viewport")).toBe("desktop");
    expect(mobile.searchParams.get("viewport")).toBe("mobile");
    expect(await readdir(root)).toEqual([`${token}.json`]);
    expect(await registry.read(token!)).toEqual({
      schemaVersion: "topic-page-review-preview/v1",
      pageTypeRef: "landing-page/topic@2",
      generationSpec: generationSpec(),
    });
  });

  it("does not resolve unsafe or missing token paths", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-page-review-preview-"));
    roots.push(root);
    const registry = createTopicPageReviewPreviewRegistry({
      root,
      origin: "http://127.0.0.1:3300",
    });

    await expect(registry.read("../../etc/passwd")).resolves.toBeNull();
    await expect(registry.read("a".repeat(48))).resolves.toBeNull();
  });

  it("rejects relative roots and non-local insecure origins", () => {
    expect(() => createTopicPageReviewPreviewRegistry({
      root: "relative/previews",
      origin: "http://example.com",
    })).toThrow("Preview registry root must be an absolute path.");
    expect(() => createTopicPageReviewPreviewRegistry({
      root: "/tmp/topic-page-review-previews",
      origin: "http://example.com",
    })).toThrow("Preview origin must use HTTPS, except on localhost.");
  });
});
