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

const TOPIC_BRIEF_FORMAT = '<meta name="topic-generator-brief-format" content="2">';

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

export async function refreshStaleTopicGeneratorDeliverables(options: {
  store: TopicGeneratorRunStore;
  renderer: TopicGeneratorDeliverableRenderer;
  runId: string;
}) {
  await options.store.refreshDeliverable(
    options.runId,
    "topic-brief.html",
    async (run) => {
      const brief = run.state.deliverables.find(({ name }) => name === "topic-brief.html");
      const backgroundCompletedAt = run.state.stages.find(
        ({ id }) => id === "background-evidence",
      )?.completedAt;
      if (brief?.status !== "ready" || !brief.generatedAt) return undefined;
      const html = new TextDecoder().decode(
        await options.store.readDeliverable(options.runId, "topic-brief.html"),
      );
      if ((!backgroundCompletedAt || brief.generatedAt >= backgroundCompletedAt) &&
          html.includes(TOPIC_BRIEF_FORMAT) && html.includes(run.manifest.runId)) {
        return undefined;
      }
      try {
        return await renderTopicGeneratorManagedDeliverable(
          "topic-brief.html",
          run.manifest,
          (stageId) => options.store.readStageResult(options.runId, stageId),
          options.renderer,
        );
      } catch {
        return undefined;
      }
    },
  );
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
