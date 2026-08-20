import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadTopicGeneratorProductSelectionRuntime } from "./product-selection-runtime";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Topic Generator ProductSelection runtime", () => {
  it("uses the full five-minute local Runner budget by default", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout")
      .mockReturnValue(new AbortController().signal);
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json({
      schemaVersion: "product-selection-agent-response/v1",
      proposal: { schemaVersion: "category-role-proposal/v1" },
    }));
    const runtime = await loadTopicGeneratorProductSelectionRuntime({
      environment: {
        TOPIC_GENERATOR_AGENT_ENDPOINT: "http://127.0.0.1:4400/product-selection",
      },
      fetch: fetchMock,
    });

    await runtime.productSelectionAgent?.proposeCategoryRoles({} as never);

    expect(timeout).toHaveBeenCalledWith(330_000);
  });
});
