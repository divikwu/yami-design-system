import {
  TopicGeneratorRunValidationError,
  renderTopicGeneratorManagedDeliverable,
  type TopicGeneratorRunStageId,
} from "@yami/topic-generator";
import { getTopicGeneratorManagedRunRuntime } from "@/lib/managed-run-runtime";
import { jsonBody, managedRunErrorResponse } from "@/lib/managed-run-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ReviewBody {
  decision: "approve" | "request-revision";
  packageDigest: string;
  rollbackStage?: TopicGeneratorRunStageId;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await params;
    const body = await jsonBody<ReviewBody>(request);
    const { store, renderer } = await getTopicGeneratorManagedRunRuntime();
    if (typeof body.packageDigest !== "string" || !body.packageDigest.trim() ||
        body.packageDigest.length > 128) {
      throw new TopicGeneratorRunValidationError(
        "Review decision requires a valid ReviewPackage digest.",
      );
    }
    const run = await store.read(runId);
    if (run.state.status !== "awaiting-approval" ||
        run.state.review?.packageDigest !== body.packageDigest) {
      throw new TopicGeneratorRunValidationError(
        "Review decision must match the current ReviewPackage digest.",
      );
    }
    if (body.decision === "request-revision") {
      if (!body.rollbackStage) {
        throw new TopicGeneratorRunValidationError(
          "A revision request must identify its rollbackStage.",
        );
      }
      return Response.json(await store.derive(runId, {
        origin: "revision",
        rollbackStage: body.rollbackStage,
      }), { status: 201 });
    }
    const finalHtml = await renderTopicGeneratorManagedDeliverable(
      "page-final.html",
      run.manifest,
      (stageId) => store.readStageResult(runId, stageId),
      renderer,
    );
    return Response.json(await store.approve(runId, body.packageDigest, finalHtml));
  } catch (error) {
    return managedRunErrorResponse(error);
  }
}
