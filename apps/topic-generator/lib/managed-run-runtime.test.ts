import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { resolveTopicGeneratorRunRoot } from "./managed-run-runtime";

const workspaceRoot = join(import.meta.dirname, "../../..");

describe("Topic Generator managed run root", () => {
  it("uses the workspace-local managed directory outside production", async () => {
    await expect(resolveTopicGeneratorRunRoot({
      cwd: join(workspaceRoot, "apps/topic-generator"),
      environment: { NODE_ENV: "development" },
    })).resolves.toBe(join(workspaceRoot, ".topic-generator/runs"));
  });

  it("requires explicitly configured persistent storage in production", async () => {
    await expect(resolveTopicGeneratorRunRoot({
      cwd: workspaceRoot,
      environment: { NODE_ENV: "production" },
    })).rejects.toThrow("TOPIC_GENERATOR_RUN_ROOT is required in production");
  });

  it("accepts only an absolute configured root", async () => {
    await expect(resolveTopicGeneratorRunRoot({
      cwd: workspaceRoot,
      environment: { TOPIC_GENERATOR_RUN_ROOT: "relative/runs" },
    })).rejects.toThrow("TOPIC_GENERATOR_RUN_ROOT must be an absolute path");

    await expect(resolveTopicGeneratorRunRoot({
      cwd: workspaceRoot,
      environment: { TOPIC_GENERATOR_RUN_ROOT: "/var/lib/topic-generator/runs" },
    })).resolves.toBe("/var/lib/topic-generator/runs");
  });
});
