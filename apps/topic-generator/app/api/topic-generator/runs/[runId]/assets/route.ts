import { extname } from "node:path";
import { getTopicGeneratorManagedRunRuntime } from "@/lib/managed-run-runtime";
import { managedRunErrorResponse } from "@/lib/managed-run-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await params;
    const ref = new URL(request.url).searchParams.get("ref")?.trim() ?? "";
    const contentType = MIME[extname(ref).toLowerCase()];
    if (!contentType) {
      return Response.json({ error: "Asset type is not supported." }, { status: 415 });
    }
    const { store } = await getTopicGeneratorManagedRunRuntime();
    await store.read(runId);
    const bytes = await store.assetStore(runId).get(ref);
    return new Response(Buffer.from(bytes), {
      headers: {
        "content-type": contentType,
        "cache-control": "private, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return managedRunErrorResponse(error);
  }
}
