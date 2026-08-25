import "server-only";

import {
  renderTopicGeneratorManagedDeliverable,
  type TopicGeneratorDeliverableRenderer,
  type TopicGeneratorManagedRun,
  type TopicGeneratorRunStore,
} from "@yami/topic-generator";

const PREVIEW_REFRESH_STAGES = [
  "module-merchandising",
  "content-review",
  "page-generation",
] as const;

async function previewNeedsRefresh(
  run: TopicGeneratorManagedRun,
  store: TopicGeneratorRunStore,
) {
  const preview = run.state.deliverables.find(({ name }) => name === "page-draft.html");
  if (preview?.status !== "ready" || !preview.generatedAt) return false;
  const latestStageAt = PREVIEW_REFRESH_STAGES
    .map((stageId) => run.state.stages.find(({ id }) => id === stageId)?.completedAt)
    .filter((completedAt): completedAt is string => Boolean(completedAt))
    .sort()
    .at(-1);
  if (latestStageAt && preview.generatedAt < latestStageAt) return true;
  const html = new TextDecoder().decode(
    await store.readDeliverable(run.manifest.runId, "page-draft.html"),
  );
  return !html.includes('<meta name="topic-generator-offline-format" content="5">');
}

export async function refreshStaleTopicGeneratorPreview(options: {
  store: TopicGeneratorRunStore;
  renderer: TopicGeneratorDeliverableRenderer;
  runId: string;
}) {
  await options.store.refreshDeliverable(
    options.runId,
    "page-draft.html",
    async (run) => {
      if (!await previewNeedsRefresh(run, options.store)) return undefined;
      try {
        return await renderTopicGeneratorManagedDeliverable(
          "page-draft.html",
          run.manifest,
          (stageId) => options.store.readStageResult(options.runId, stageId),
          options.renderer,
        );
      } catch {
        return undefined;
      }
    },
  );
}
