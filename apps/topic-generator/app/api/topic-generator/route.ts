import { handleTopicGeneratorPost } from "@yami/topic-generator";
import { getTopicGeneratorProductSelectionRuntime } from "@/lib/product-selection-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const runtime = await getTopicGeneratorProductSelectionRuntime();
  return handleTopicGeneratorPost(request, {
    ...runtime,
    requireAutomaticCategoryRole: true,
  });
}
