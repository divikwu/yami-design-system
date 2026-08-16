import { buildTopicPagePlanMatrix } from "@/app/lib/topic-generator/planner";
import {
  searchYamiProducts,
  YamiSearchError,
} from "@/app/lib/topic-generator/yami-search";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function errorResponse(
  status: number,
  code: string,
  message: string,
  sourceUrl?: string,
) {
  return Response.json(
    { error: { code, message, sourceUrl } },
    { status },
  );
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "invalid_json", "Request body must be valid JSON.");
  }

  const keyword =
    typeof payload === "object" &&
    payload !== null &&
    "keyword" in payload &&
    typeof payload.keyword === "string"
      ? payload.keyword.trim()
      : "";
  if (keyword.length < 2 || keyword.length > 80) {
    return errorResponse(
      400,
      "invalid_keyword",
      "Keyword must contain between 2 and 80 characters.",
    );
  }
  try {
    const snapshot = await searchYamiProducts(keyword);
    return Response.json({ plans: buildTopicPagePlanMatrix(snapshot) });
  } catch (error) {
    if (error instanceof YamiSearchError) {
      return errorResponse(
        error.code === "no_products" ? 404 : 502,
        error.code,
        error.message,
        error.searchUrl,
      );
    }

    return errorResponse(
      500,
      "generation_failed",
      "The topic plan could not be generated. Try again.",
    );
  }
}
