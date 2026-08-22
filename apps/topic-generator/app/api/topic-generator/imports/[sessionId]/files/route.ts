import { TopicGeneratorRunValidationError } from "@yami/topic-generator";
import { getTopicGeneratorManagedRunRuntime } from "@/lib/managed-run-runtime";
import { managedRunErrorResponse } from "@/lib/managed-run-api";
import { TopicGeneratorImportService } from "@/lib/topic-generator-imports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const url = new URL(request.url);
    const path = url.searchParams.get("path") ?? "";
    const offset = Number(request.headers.get("x-file-offset") ?? "-1");
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.byteLength === 0 && Number(request.headers.get("content-length")) !== 0) {
      throw new TopicGeneratorRunValidationError("Import chunk is empty.");
    }
    const { root } = await getTopicGeneratorManagedRunRuntime();
    return Response.json(
      await new TopicGeneratorImportService(root).upload(sessionId, path, offset, bytes),
    );
  } catch (error) {
    return managedRunErrorResponse(error);
  }
}
