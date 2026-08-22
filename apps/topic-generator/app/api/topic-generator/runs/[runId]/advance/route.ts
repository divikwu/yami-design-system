import { TopicGeneratorRunValidationError } from "@yami/topic-generator";
import { getTopicGeneratorManagedRunRuntime } from "@/lib/managed-run-runtime";
import { jsonBody, managedRunErrorResponse } from "@/lib/managed-run-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await params;
    const body = await jsonBody<{ requestId?: string }>(request);
    if (!body.requestId) {
      throw new TopicGeneratorRunValidationError("Advance requestId is required.");
    }
    const { store, execute } = await getTopicGeneratorManagedRunRuntime();
    const run = await store.advanceRun(runId, {
      requestId: body.requestId,
      execute,
    });
    return Response.json({
      ...run,
      detail: await store.detail(runId),
    });
  } catch (error) {
    return managedRunErrorResponse(error);
  }
}
