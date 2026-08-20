import { notFound } from "next/navigation";

import { createConfiguredTopicPageReviewPreviewRegistry } from "../../../../../lib/topic-page-review-preview-registry";
import { RealTopicPagePreview } from "../../../../topic-generator-workbench";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function TopicPageReviewPreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await createConfiguredTopicPageReviewPreviewRegistry().read(token);
  if (!preview) notFound();
  return (
    <RealTopicPagePreview
      pageTypeRef={preview.pageTypeRef}
      generationSpec={preview.generationSpec}
    />
  );
}
