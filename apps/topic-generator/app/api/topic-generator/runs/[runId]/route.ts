import { getTopicGeneratorManagedRunRuntime } from "@/lib/managed-run-runtime";
import { managedRunErrorResponse } from "@/lib/managed-run-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await params;
    const { store } = await getTopicGeneratorManagedRunRuntime();
    return Response.json(await store.detail(runId));
  } catch (error) {
    return managedRunErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await params;
    const { store } = await getTopicGeneratorManagedRunRuntime();
    return Response.json(await store.deleteRun(runId));
  } catch (error) {
    return managedRunErrorResponse(error);
  }
}
