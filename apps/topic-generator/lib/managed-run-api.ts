import {
  TopicGeneratorRunBusyError,
  TopicGeneratorRunNotFoundError,
  TopicGeneratorRunValidationError,
} from "@yami/topic-generator";

export function managedRunErrorResponse(error: unknown) {
  if (error instanceof TopicGeneratorRunBusyError) {
    return Response.json(
      { error: error.message, code: "RUN_BUSY" },
      { status: 409 },
    );
  }
  if (error instanceof TopicGeneratorRunNotFoundError) {
    return Response.json(
      { error: error.message, code: "RUN_NOT_FOUND" },
      { status: 404 },
    );
  }
  if (error instanceof TopicGeneratorRunValidationError || error instanceof SyntaxError) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Request is invalid.",
        code: "RUN_INVALID",
      },
      { status: 400 },
    );
  }
  console.error("TOPIC GENERATOR managed run failed", error);
  return Response.json(
    { error: "TOPIC GENERATOR run service failed.", code: "RUN_SERVICE_FAILED" },
    { status: 500 },
  );
}

export async function jsonBody<T>(request: Request): Promise<T> {
  const type = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
  if (type !== "application/json") {
    throw new TopicGeneratorRunValidationError("Request must use application/json.");
  }
  return request.json() as Promise<T>;
}
