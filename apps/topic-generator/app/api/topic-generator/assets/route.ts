import { extname } from "node:path";

import { getTopicGeneratorPageAutomationRuntime } from "@/lib/page-automation-runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(request: Request) {
  const ref = new URL(request.url).searchParams.get("ref")?.trim() ?? "";
  if (!ref) return Response.json({ error: "Missing asset ref." }, { status: 400 });
  const runtime = await getTopicGeneratorPageAutomationRuntime();
  if (!runtime.topicPageAssetStore) {
    return Response.json(
      { error: "Topic Page asset store is not configured." },
      { status: 503 },
    );
  }
  try {
    const bytes = await runtime.topicPageAssetStore.get(ref);
    const contentType = MIME_BY_EXTENSION[extname(ref).toLowerCase()];
    if (!contentType) {
      return Response.json({ error: "Unsupported asset type." }, { status: 415 });
    }
    return new Response(Buffer.from(bytes), {
      headers: {
        "content-type": contentType,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Asset not found." }, { status: 404 });
  }
}
