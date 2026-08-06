import { describe, expect, it } from "vitest";
import { DirectionManifestV1Schema, TokenOverridesSchema } from "../src";

describe("direction contracts", () => {
  it("accepts a renderable kinded overlay", () => {
    expect(DirectionManifestV1Schema.parse({ schemaVersion: 1, id: "warm-market", name: "Warm Market", extends: "current", pages: { home: { sections: [{ id: "trending", kind: "products", props: { title: "本周热卖" } }] } } }).id).toBe("warm-market");
  });

  it("rejects component rebinding and CSS injection", () => {
    expect(() => DirectionManifestV1Schema.parse({ schemaVersion: 1, id: "bad", name: "Bad", extends: "current", pages: { home: { sections: [{ id: "trending", kind: "products", component: "Footer" }] } } })).toThrow();
    expect(() => TokenOverridesSchema.parse({ "--surface-primary": "url(https://example.com/x)" })).toThrow();
    expect(() => TokenOverridesSchema.parse({ "--surface-primary": "8px" })).toThrow();
    expect(() => TokenOverridesSchema.parse({ "--space-100": "#ffffff" })).toThrow();
  });
});
