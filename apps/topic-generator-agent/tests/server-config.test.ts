import { describe, expect, it } from "vitest";

import { localRunnerHostname } from "../src/server-config.ts";

describe("Agent Runner server configuration", () => {
  it.each([undefined, "", "127.0.0.1", "localhost"])(
    "accepts the local bind address %s",
    (hostname) => {
      expect(localRunnerHostname(hostname)).toBe(hostname?.trim() || "127.0.0.1");
    },
  );

  it.each(["0.0.0.0", "192.168.1.10", "agent.example.com", "::1"])(
    "rejects the unsupported bind address %s",
    (hostname) => {
      expect(() => localRunnerHostname(hostname)).toThrow(
        "TOPIC_AGENT_RUNNER_HOST must be 127.0.0.1 or localhost.",
      );
    },
  );
});
