import { describe, expect, it, vi } from "vitest";
import {
  createHttpProductSelectionAgent,
  HttpProductSelectionAgentError,
  type ProductSelectionRun,
} from "../src/index.js";

const categoryRun = {
  schemaVersion: "product-selection-run/v1",
  status: "needs-category-proposal",
  strategyRef: "category-role/landing-page-agent@1",
  context: {
    keyword: "Matcha",
    taxonomyDigest: "sha256:taxonomy",
    categories: [],
  },
} as const satisfies ProductSelectionRun;

describe("HTTP ProductSelection Agent", () => {
  it("sends the requested state to a server Agent and returns only its proposal", async () => {
    const proposal = {
      schemaVersion: "category-role-proposal/v1",
      keyword: "Matcha",
      strategyRef: "category-role/landing-page-agent@1",
      taxonomyDigest: "sha256:taxonomy",
      categories: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      schemaVersion: "product-selection-agent-response/v1",
      proposal,
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const agent = createHttpProductSelectionAgent({
      id: "topic-product-agent",
      endpoint: "https://agent.example.com/product-selection",
      token: "server-secret",
      fetch: fetchMock,
    });

    await expect(agent.proposeCategoryRoles(categoryRun)).resolves.toEqual(proposal);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://agent.example.com/product-selection");
    expect(init.headers).toMatchObject({
      authorization: "Bearer server-secret",
      "content-type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual({
      schemaVersion: "product-selection-agent-request/v1",
      stage: "category-role-proposal",
      agentId: "topic-product-agent",
      run: categoryRun,
    });
  });

  it("returns a typed operational error when the Agent endpoint rejects a request", async () => {
    const agent = createHttpProductSelectionAgent({
      id: "topic-product-agent",
      endpoint: "https://agent.example.com/product-selection",
      fetch: vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })),
    });

    await expect(agent.proposeCategoryRoles(categoryRun)).rejects.toMatchObject({
      name: "HttpProductSelectionAgentError",
      agentId: "topic-product-agent",
      stage: "category-role-proposal",
      status: 503,
    } satisfies Partial<HttpProductSelectionAgentError>);
  });
});
