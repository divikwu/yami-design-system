import { describe, expect, it } from "vitest";
import { DirectionManifestV1Schema, PreviewNavigateMessageSchema, TokenOverridesSchema, tokenOverridesToStyle } from "../src";

describe("direction contracts", () => {
  it("accepts a renderable kinded overlay", () => {
    expect(DirectionManifestV1Schema.parse({ schemaVersion: 1, id: "warm-market", name: "Warm Market", extends: "current", pages: { home: { sections: [{ id: "trending", kind: "products", props: { title: "本周热卖" } }] } } }).id).toBe("warm-market");
  });

  it("accepts serializable fixed-slot replacements", () => {
    const manifest = DirectionManifestV1Schema.parse({
      schemaVersion: 1,
      id: "editorial-home",
      name: "Editorial Home",
      extends: "current",
      pages: { home: {
        header: { searchPlaceholder: "Search the edit", categories: [{ id: "new", label: "New", href: "/categories/new" }] },
        hero: { items: [{ id: "hero-edit", href: "/categories/edit", image: { src: "/assets/hero-edit.jpg", alt: "Editorial selection" }, title: "The weekly edit", description: "Selected by YAMI" }] },
        shortcutRail: { items: [{ id: "beauty", label: "Beauty", iconSrc: "/assets/beauty.svg", href: "/categories/beauty" }] },
        footer: { appTitle: "YAMI on the go", copyright: ["YAMI", "All rights reserved"] },
      } },
    });

    expect(manifest.pages.home?.hero?.items).toHaveLength(1);
    expect(manifest.pages.home?.shortcutRail?.items?.[0]?.id).toBe("beauty");
  });

  it("rejects component rebinding and CSS injection", () => {
    expect(() => DirectionManifestV1Schema.parse({ schemaVersion: 1, id: "bad", name: "Bad", extends: "current", pages: { home: { sections: [{ id: "trending", kind: "products", component: "Footer" }] } } })).toThrow();
    expect(() => TokenOverridesSchema.parse({ "--surface-primary": "url(https://example.com/x)" })).toThrow();
    expect(() => TokenOverridesSchema.parse({ "--surface-primary": "8px" })).toThrow();
    expect(() => TokenOverridesSchema.parse({ "--space-100": "#ffffff" })).toThrow();
    expect(() => TokenOverridesSchema.parse({ "--surface-primary": "{missing.token}" })).toThrow();
    expect(() => TokenOverridesSchema.parse({ "--surface-primary": "{space.100}" })).toThrow();
    expect(() => TokenOverridesSchema.parse({ "--surface-primary": "{surface.primary}" })).toThrow();
    expect(() => DirectionManifestV1Schema.parse({
      schemaVersion: 1,
      id: "unsafe-color",
      name: "Unsafe color",
      extends: "current",
      pages: { home: { hero: { items: [{ id: "hero", href: "/", title: "Unsafe", products: [{ src: "/assets/product.png", alt: "Product" }], backgroundColor: "red; background:url(x)" }] } } },
    })).toThrow();
  });

  it("accepts registered same-type token references and converts them to CSS vars", () => {
    const overrides = TokenOverridesSchema.parse({ "--surface-primary": "{surface.secondary}", "--space-100": "{space.150}" });
    expect(tokenOverridesToStyle(overrides)).toEqual({ "--surface-primary": "var(--surface-secondary)", "--space-100": "var(--space-150)" });
  });

  it("rejects protocol-relative navigation and non-local assets", () => {
    expect(() => PreviewNavigateMessageSchema.parse({ type: "yami-canvas:v1:navigate", path: "//products" })).toThrow();
    expect(() => DirectionManifestV1Schema.parse({
      schemaVersion: 1,
      id: "unsafe-assets",
      name: "Unsafe assets",
      extends: "current",
      pages: { home: { sections: [{ id: "promo", kind: "billboard", props: { image: { src: "data:image/svg+xml,bad", alt: "Bad" }, href: "/products", label: "Bad" } }] } },
    })).toThrow();
  });
});
