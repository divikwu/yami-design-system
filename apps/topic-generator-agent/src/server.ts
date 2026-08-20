import { createServer } from "node:http";

import { createConfiguredExecutor } from "./executor.ts";
import { createAgentRunnerHandler } from "./handler.ts";
import { localRunnerHostname } from "./server-config.ts";

function integerEnvironment(name: string, fallback: number, maximum: number) {
  const value = process.env[name]?.trim();
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new Error(`${name} must be an integer between 1 and ${maximum}.`);
  }
  return parsed;
}

const hostname = localRunnerHostname(process.env.TOPIC_AGENT_RUNNER_HOST);
const port = integerEnvironment("TOPIC_AGENT_RUNNER_PORT", 4400, 65_535);
const maxRequestBytes = integerEnvironment(
  "TOPIC_AGENT_RUNNER_MAX_REQUEST_BYTES",
  2 * 1024 * 1024,
  16 * 1024 * 1024,
);
const executor = createConfiguredExecutor();
const handleRequest = createAgentRunnerHandler({
  executor,
  token: process.env.TOPIC_AGENT_RUNNER_TOKEN?.trim() || undefined,
  maxRequestBytes,
});

const server = createServer(async (incoming, outgoing) => {
  try {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of incoming) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > maxRequestBytes) {
        outgoing.writeHead(413, { "content-type": "application/json" });
        outgoing.end(JSON.stringify({
          schemaVersion: "topic-agent-runner-error/v1",
          code: "request_too_large",
          message: "Agent request exceeds the size limit.",
        }));
        return;
      }
      chunks.push(buffer);
    }
    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) {
      if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
      else if (value !== undefined) headers.set(name, value);
    }
    const method = incoming.method ?? "GET";
    const request = new Request(`http://${hostname}:${port}${incoming.url ?? "/"}`, {
      method,
      headers,
      ...(method === "GET" || method === "HEAD"
        ? {}
        : { body: Buffer.concat(chunks) }),
    });
    const response = await handleRequest(request);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    outgoing.writeHead(500, { "content-type": "application/json" });
    outgoing.end(JSON.stringify({
      schemaVersion: "topic-agent-runner-error/v1",
      code: "internal_error",
      message: error instanceof Error ? error.message : "Internal Agent Runner error.",
    }));
  }
});

server.listen(port, hostname, () => {
  process.stdout.write(
    `TOPIC GENERATOR Agent Runner (${executor.id}) listening on http://${hostname}:${port}\n`,
  );
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
