import { describe, expect, it, vi } from "vitest";
import { normalizePrototypePath, resolveEcommerceHome } from "../src";

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

  it("replaces arrays in full and enforces complete visible section order", () => {
    const current = resolveEcommerceHome("en", null, vi.fn());
    const products = current.sections.find((section) => section.kind === "products")!;
    const replacement = [{ id: "replacement-1", title: "Replacement", priceCurrent: "$12.00", href: "/products/replacement-1", image: "/assets/replacement.png", imageAlt: "Replacement" }];
    const changed = resolveEcommerceHome("en", {
      schemaVersion: 1,
      id: "single-product",
      name: "Single product",
      extends: "current",
      pages: { home: { sections: [{ id: products.id, kind: "products", props: { products: replacement } }], sectionOrder: current.sections.map((section) => section.id) } },
    }, vi.fn());
    const changedProducts = changed.sections.find((section) => section.id === products.id);
    if (!changedProducts || changedProducts.kind !== "products") throw new Error("Expected products section");
    expect(changedProducts.props.products).toEqual(replacement);
    expect(() => resolveEcommerceHome("en", {
      schemaVersion: 1,
      id: "bad-order",
      name: "Bad order",
      extends: "current",
      pages: { home: { sectionOrder: [products.id] } },
    }, vi.fn())).toThrow("every visible section");
  });

  it("normalizes every storefront destination into an allowed prototype route", () => {
    expect(normalizePrototypePath("#home")).toBe("/");
    expect(normalizePrototypePath("#account")).toBe("/account");
    expect(normalizePrototypePath("#product-featured-1")).toBe("/products/product-featured-1");
    expect(normalizePrototypePath("/zh/products/torriden-1")).toBe("/products/torriden-1");
    expect(normalizePrototypePath("https://www.yami.com/us/zh/p/item/1022112801")).toBe("/products/1022112801");
    expect(normalizePrototypePath("https://www.yami.com/us/zh/b/maogeping/5445")).toBe("/brands/5445");

    const navigate = vi.fn();
    const current = resolveEcommerceHome("zh", null, navigate);
    const hrefs: string[] = [];
    const visit = (value: unknown) => {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) {
        if (key === "href" && typeof item === "string") hrefs.push(item);
        else visit(item);
      }
    };
    visit(current);
    expect(hrefs.length).toBeGreaterThan(20);
    expect(hrefs.every((href) => /^\/(?:$|products|categories|search|cart|brands|account)(?:\/|$)/.test(href))).toBe(true);
  });
});
