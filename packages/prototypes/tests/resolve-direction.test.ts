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
});
