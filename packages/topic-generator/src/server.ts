import {
  analyzeTopicIntent,
  type AnalyzeTopicIntentOptions,
} from "./analyze.js";
import { CatalogSnapshotLoadError } from "./catalog-snapshot.js";
import { buildTopicPagePlanMatrix } from "./planner.js";
import type { TopicGenerationMode } from "./types.js";

function errorResponse(
  status: number,
  code: string,
  message: string,
  sourceUrl?: string,
  details?: Record<string, unknown>,
) {
  return Response.json(
    { error: { code, message, sourceUrl, ...details } },
    { status },
  );
}

/** Handle the product's JSON HTTP endpoint without coupling it to a Web framework. */
export async function handleTopicGeneratorPost(
  request: Request,
  options: AnalyzeTopicIntentOptions = {},
) {
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
  const generationMode: TopicGenerationMode =
    typeof payload === "object" &&
    payload !== null &&
    "mode" in payload &&
    payload.mode === "selection"
      ? "selection"
      : "page";

  if (keyword.length < 2 || keyword.length > 80) {
    return errorResponse(
      400,
      "invalid_keyword",
      "Keyword must contain between 2 and 80 characters.",
    );
  }

  try {
    const { snapshot } = await analyzeTopicIntent(keyword, options);
    return Response.json({ plans: buildTopicPagePlanMatrix(snapshot, generationMode) });
  } catch (error) {
    if (error instanceof CatalogSnapshotLoadError) {
      return errorResponse(
        error.attempts.every((attempt) => attempt.errorCode === "no_products")
          ? 404
          : 502,
        "catalog_unavailable",
        error.message,
        undefined,
        { attempts: error.attempts },
      );
    }

    return errorResponse(
      500,
      "generation_failed",
      "The topic plan could not be generated. Try again.",
    );
  }
}
