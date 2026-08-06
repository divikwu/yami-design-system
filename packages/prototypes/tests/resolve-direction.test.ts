import { describe, expect, it, vi } from "vitest";
import { resolveEcommerceHome } from "../src";

describe("EcommerceHome direction resolution", () => {
  it("keeps current as the fixture and overlays titles shallowly", () => {
    const current = resolveEcommerceHome("zh", null, vi.fn());
    const products = current.sections.find((section) => section.kind === "products")!;
    const changed = resolveEcommerceHome("zh", { schemaVersion: 1, id: "editorial", name: "Editorial", extends: "current", pages: { home: { sections: [{ id: products.id, kind: "products", props: { title: "编辑精选" } }] } } }, vi.fn());
    expect(changed.sections.find((section) => section.id === products.id)!.props.title).toBe("编辑精选");
    expect(changed.sections).toHaveLength(current.sections.length);
  });

  it("adds a new section only when its props are complete", () => {
    const manifest = {
      schemaVersion: 1 as const,
      id: "campaign",
      name: "Campaign",
      extends: "current" as const,
      pages: { home: { sections: [{
        id: "campaign-band",
        kind: "billboard" as const,
        props: { image: { src: "/assets/campaign.png", alt: "Campaign" }, href: "/campaign", label: "Campaign" },
      }] } },
    };
    const resolved = resolveEcommerceHome("en", manifest, vi.fn());
    expect(resolved.sections.at(-1)).toMatchObject({ id: "campaign-band", kind: "billboard" });

    expect(() => resolveEcommerceHome("en", {
      ...manifest,
      pages: { home: { sections: [{ id: "broken", kind: "billboard" as const, props: { label: "Missing image" } }] } },
    }, vi.fn())).toThrow();
  });

  it("rejects duplicate patches and kind changes", () => {
    const current = resolveEcommerceHome("en", null, vi.fn());
    const products = current.sections.find((section) => section.kind === "products")!;
    const base = { schemaVersion: 1 as const, id: "invalid", name: "Invalid", extends: "current" as const };
    expect(() => resolveEcommerceHome("en", { ...base, pages: { home: { sections: [
      { id: products.id, kind: "products" as const },
      { id: products.id, kind: "products" as const },
    ] } } }, vi.fn())).toThrow("unique");
    expect(() => resolveEcommerceHome("en", { ...base, pages: { home: { sections: [
      { id: products.id, kind: "billboard" as const },
    ] } } }, vi.fn())).toThrow("cannot change kind");
  });
});
