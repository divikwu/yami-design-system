import { describe, expect, it } from "vitest";
import { acquire } from "./rate-limit";

describe("direction generation rate limit", () => {
  it("allows one concurrent request per client", () => {
    const first = acquire(crypto.randomUUID());
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const client = crypto.randomUUID();
    const active = acquire(client);
    const blocked = acquire(client);
    expect(active.ok).toBe(true);
    expect(blocked.ok).toBe(false);
    if (active.ok) active.release();
    first.release();
  });

  it("limits a client to five starts per minute", () => {
    const client = crypto.randomUUID();
    for (let index = 0; index < 5; index += 1) {
      const result = acquire(client);
      expect(result.ok).toBe(true);
      if (result.ok) result.release();
    }
    expect(acquire(client).ok).toBe(false);
  });
});
