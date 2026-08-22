import { getTopicGeneratorManagedRunRuntime } from "@/lib/managed-run-runtime";
import { managedRunErrorResponse } from "@/lib/managed-run-api";
import { createTopicGeneratorRunArchive } from "@/lib/topic-generator-run-archive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await params;
    const { store } = await getTopicGeneratorManagedRunRuntime();
    const archive = await createTopicGeneratorRunArchive(store, runId);
    return new Response(archive.stream, {
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${archive.fileName}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return managedRunErrorResponse(error);
  }
}
