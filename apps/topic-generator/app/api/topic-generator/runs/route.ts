import type { TopicGeneratorRunRequest } from "@yami/topic-generator";
import { getTopicGeneratorManagedRunRuntime } from "@/lib/managed-run-runtime";
import { jsonBody, managedRunErrorResponse } from "@/lib/managed-run-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { root, store } = await getTopicGeneratorManagedRunRuntime();
    const url = new URL(request.url);
    const parsedLimit = Number(url.searchParams.get("limit") ?? "25");
    const limit = Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 100)
      : 25;
    const cursor = url.searchParams.get("cursor");
    const runs = await store.list();
    const start = cursor ? Math.max(runs.findIndex(({ runId }) => runId === cursor) + 1, 0) : 0;
    const items = runs.slice(start, start + limit);
    return Response.json({
      schemaVersion: "topic-generator-run-list/v1",
      items,
      nextCursor: start + limit < runs.length ? items.at(-1)?.runId ?? null : null,
      storage: {
        status: "ready",
        runCount: runs.length,
        ...(process.env.NODE_ENV === "production" ? {} : { root }),
      },
    });
  } catch (error) {
    return managedRunErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await jsonBody<{ request: TopicGeneratorRunRequest }>(request);
    const { store } = await getTopicGeneratorManagedRunRuntime();
    const run = await store.create(body.request);
    return Response.json(run, { status: 201 });
  } catch (error) {
    return managedRunErrorResponse(error);
  }
}
