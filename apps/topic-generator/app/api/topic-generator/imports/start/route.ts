import { getTopicGeneratorManagedRunRuntime } from "@/lib/managed-run-runtime";
import { jsonBody, managedRunErrorResponse } from "@/lib/managed-run-api";
import { TopicGeneratorImportService } from "@/lib/topic-generator-imports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await jsonBody<Parameters<TopicGeneratorImportService["start"]>[0]>(request);
    const { root } = await getTopicGeneratorManagedRunRuntime();
    return Response.json(await new TopicGeneratorImportService(root).start(body), {
      status: 201,
    });
  } catch (error) {
    return managedRunErrorResponse(error);
  }
}
