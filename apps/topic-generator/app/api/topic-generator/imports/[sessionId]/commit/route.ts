import { getTopicGeneratorManagedRunRuntime } from "@/lib/managed-run-runtime";
import { jsonBody, managedRunErrorResponse } from "@/lib/managed-run-api";
import { TopicGeneratorImportService } from "@/lib/topic-generator-imports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const body = await jsonBody<{ candidateIds: string[] }>(request);
    const { root } = await getTopicGeneratorManagedRunRuntime();
    return Response.json(
      await new TopicGeneratorImportService(root).commit(sessionId, body.candidateIds),
    );
  } catch (error) {
    return managedRunErrorResponse(error);
  }
}
