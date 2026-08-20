export function localRunnerHostname(value: string | undefined) {
  const hostname = value?.trim() || "127.0.0.1";
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error("TOPIC_AGENT_RUNNER_HOST must be 127.0.0.1 or localhost.");
  }
  return hostname;
}
