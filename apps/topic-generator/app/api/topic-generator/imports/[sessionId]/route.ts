import { getTopicGeneratorManagedRunRuntime } from "@/lib/managed-run-runtime";
import { managedRunErrorResponse } from "@/lib/managed-run-api";
import { TopicGeneratorImportService } from "@/lib/topic-generator-imports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const { root } = await getTopicGeneratorManagedRunRuntime();
    await new TopicGeneratorImportService(root).cancel(sessionId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return managedRunErrorResponse(error);
  }
}
