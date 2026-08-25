import { getTopicGeneratorManagedRunRuntime } from "@/lib/managed-run-runtime";
import { managedRunErrorResponse } from "@/lib/managed-run-api";
import {
  createTopicGeneratorPreviewArchive,
  createTopicGeneratorRunArchive,
} from "@/lib/topic-generator-run-archive";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await params;
    const { store, renderer } = await getTopicGeneratorManagedRunRuntime();
    const archive = new URL(request.url).searchParams.get("type") === "run"
      ? await createTopicGeneratorRunArchive(store, runId)
      : await createTopicGeneratorPreviewArchive(store, renderer, runId);
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
