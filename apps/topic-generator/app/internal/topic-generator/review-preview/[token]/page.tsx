import { notFound } from "next/navigation";

import { resolveTopicGeneratorRunRoot } from "../../../../../lib/managed-run-runtime";
import {
  createConfiguredTopicPageReviewPreviewRegistry,
  createManagedTopicPageReviewPreviewRegistry,
} from "../../../../../lib/topic-page-review-preview-registry";
import { RealTopicPagePreview } from "../../../../topic-generator-workbench";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function TopicPageReviewPreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const runRoot = await resolveTopicGeneratorRunRoot();
  const managedRegistry = createManagedTopicPageReviewPreviewRegistry({
    runRoot,
    environment: process.env,
  });
  const managedPreview = await managedRegistry.read(token);
  const preview = managedPreview ?? (process.env.TOPIC_GENERATOR_ASSET_ROOT?.trim()
    ? await createConfiguredTopicPageReviewPreviewRegistry().read(token)
    : null);
  if (!preview) notFound();
  return (
    <RealTopicPagePreview
      mode="generated"
      pageTypeRef={preview.pageTypeRef}
      generationSpec={preview.generationSpec}
    />
  );
}
