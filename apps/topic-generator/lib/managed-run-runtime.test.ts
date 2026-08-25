import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { resolveTopicGeneratorRunRoot } from "./managed-run-runtime";

describe("Topic Generator managed run root", () => {
  it("uses stable user application storage outside production", async () => {
    await expect(resolveTopicGeneratorRunRoot({
      environment: { NODE_ENV: "development" },
      homeDirectory: "/Users/topic-generator-test",
    })).resolves.toBe(
      "/Users/topic-generator-test/Yami Topic Generator/runs",
    );
  });

  it("requires explicitly configured persistent storage in production", async () => {
    await expect(resolveTopicGeneratorRunRoot({
      environment: { NODE_ENV: "production" },
    })).rejects.toThrow("TOPIC_GENERATOR_STORAGE_ROOT is required in production");
  });

  it("derives the run directory from an absolute unified storage root", async () => {
    await expect(resolveTopicGeneratorRunRoot({
      environment: { TOPIC_GENERATOR_STORAGE_ROOT: "relative/storage" },
    })).rejects.toThrow("TOPIC_GENERATOR_STORAGE_ROOT must be an absolute path");

    await expect(resolveTopicGeneratorRunRoot({
      environment: { TOPIC_GENERATOR_STORAGE_ROOT: "/var/lib/topic-generator" },
    })).resolves.toBe("/var/lib/topic-generator/runs");
  });

  it("keeps the legacy absolute run root as the highest-priority override", async () => {
    await expect(resolveTopicGeneratorRunRoot({
      environment: {
        TOPIC_GENERATOR_STORAGE_ROOT: "/var/lib/topic-generator",
        TOPIC_GENERATOR_RUN_ROOT: "/srv/topic-generator/runs",
      },
    })).resolves.toBe("/srv/topic-generator/runs");

    await expect(resolveTopicGeneratorRunRoot({
      environment: { TOPIC_GENERATOR_RUN_ROOT: "relative/runs" },
    })).rejects.toThrow("TOPIC_GENERATOR_RUN_ROOT must be an absolute path");
  });
});
