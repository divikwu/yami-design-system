import type {
  TopicGeneratorRunRequest,
  TopicGeneratorRunStageId,
} from "@yami/topic-generator";
import { TopicGeneratorRunValidationError } from "@yami/topic-generator";
import { getTopicGeneratorManagedRunRuntime } from "@/lib/managed-run-runtime";
import { jsonBody, managedRunErrorResponse } from "@/lib/managed-run-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface DeriveBody {
  origin: "derived" | "refresh" | "revision" | "legacy-migration";
  rollbackStage?: TopicGeneratorRunStageId;
  request?: Partial<TopicGeneratorRunRequest>;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await params;
    const body = await jsonBody<DeriveBody>(request);
    const { store } = await getTopicGeneratorManagedRunRuntime();
    if (body.origin === "legacy-migration") {
      return Response.json(await store.migrateLegacy(runId, { request: body.request }), {
        status: 201,
      });
    }
    if (!body.rollbackStage) {
      throw new TopicGeneratorRunValidationError("rollbackStage is required.");
    }
    return Response.json(await store.derive(runId, {
      origin: body.origin,
      rollbackStage: body.rollbackStage,
      request: body.request,
    }), { status: 201 });
  } catch (error) {
    return managedRunErrorResponse(error);
  }
}
