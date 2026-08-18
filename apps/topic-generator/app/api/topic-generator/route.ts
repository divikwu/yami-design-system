import { handleTopicGeneratorPost } from "@yami/topic-generator";
import { getTopicGeneratorPageAutomationRuntime } from "@/lib/page-automation-runtime";
import { getTopicGeneratorProductSelectionRuntime } from "@/lib/product-selection-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const [runtime, pageRuntime] = await Promise.all([
    getTopicGeneratorProductSelectionRuntime(),
    getTopicGeneratorPageAutomationRuntime(),
  ]);
  return handleTopicGeneratorPost(request, {
    ...runtime,
    ...pageRuntime,
    requireAutomaticCategoryRole: true,
    requireAutomaticPage: true,
  });
}
