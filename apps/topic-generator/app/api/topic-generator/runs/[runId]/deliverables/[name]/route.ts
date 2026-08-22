import type { TopicGeneratorDeliverableName } from "@yami/topic-generator";
import { getTopicGeneratorManagedRunRuntime } from "@/lib/managed-run-runtime";
import { managedRunErrorResponse } from "@/lib/managed-run-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NAMES = new Set<TopicGeneratorDeliverableName>([
  "topic-brief.html",
  "page-draft.html",
  "page-final.html",
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string; name: string }> },
) {
  try {
    const { runId, name } = await params;
    if (!NAMES.has(name as TopicGeneratorDeliverableName)) {
      return Response.json({ error: "Deliverable is not allowed." }, { status: 404 });
    }
    const { store } = await getTopicGeneratorManagedRunRuntime();
    const contents = await store.readDeliverable(runId, name as TopicGeneratorDeliverableName);
    const inline = new URL(request.url).searchParams.get("view") === "1";
    return new Response(contents, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": `${inline ? "inline" : "attachment"}; filename="${name}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return managedRunErrorResponse(error);
  }
}
