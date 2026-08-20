import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { TopicPageGenerationSpec } from "@yami/topic-generator";

import { createConfiguredTopicPageReviewPreviewRegistry } from "../../../../../lib/topic-page-review-preview-registry";
import { RealTopicPagePreview } from "../../../../topic-generator-workbench";
import TopicPageReviewPreviewPage from "./page";

const roots: string[] = [];
const originalAssetRoot = process.env.TOPIC_GENERATOR_ASSET_ROOT;
const originalPreviewOrigin = process.env.TOPIC_GENERATOR_PREVIEW_ORIGIN;

afterEach(async () => {
  if (originalAssetRoot === undefined) delete process.env.TOPIC_GENERATOR_ASSET_ROOT;
  else process.env.TOPIC_GENERATOR_ASSET_ROOT = originalAssetRoot;
  if (originalPreviewOrigin === undefined) delete process.env.TOPIC_GENERATOR_PREVIEW_ORIGIN;
  else process.env.TOPIC_GENERATOR_PREVIEW_ORIGIN = originalPreviewOrigin;
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

const generationSpec = {
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
} satisfies TopicPageGenerationSpec;

describe("internal Topic Page review preview", () => {
  it("loads the token-bound page type and generation spec into the real preview", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-page-review-route-"));
    roots.push(root);
    process.env.TOPIC_GENERATOR_ASSET_ROOT = root;
    process.env.TOPIC_GENERATOR_PREVIEW_ORIGIN = "http://127.0.0.1:3300";
    const registry = createConfiguredTopicPageReviewPreviewRegistry();
    const refs = await registry.publish({
      pageTypeRef: "landing-page/topic@2",
      generationSpec,
    });
    const token = new URL(refs.desktop).pathname.split("/").at(-1)!;

    const element = await TopicPageReviewPreviewPage({
      params: Promise.resolve({ token }),
    }) as ReactElement<{
      pageTypeRef: string;
      generationSpec: TopicPageGenerationSpec;
    }>;

    expect(element.type).toBe(RealTopicPagePreview);
    expect(element.props).toEqual({
      pageTypeRef: "landing-page/topic@2",
      generationSpec,
    });
  });
});
