import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("Topic Generator development runtime", () => {
  it("starts the Agent-enabled stack from the default development command", async () => {
    const packageJson = JSON.parse(
      await readFile(fileURLToPath(new URL("../../../package.json", import.meta.url)), "utf8"),
    ) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.["dev:topic-generator"]).toBe(
      "pnpm dev:topic-generator-stack",
    );
    expect(packageJson.scripts?.["dev:topic-generator-web"]).toBe(
      "pnpm --filter @yami/topic-generator-app dev",
    );
  });
});
