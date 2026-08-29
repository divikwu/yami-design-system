import { StrictMode, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { Sheet } from "../../../packages/design-system/components/Sheet";
import { Checkbox } from "../../../packages/design-system/components/Checkbox";
import "@yami/design-system/tokens.css";

function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open sheet</button>
      <Sheet open={open} title="Details" closeLabel="Close details" onClose={() => setOpen(false)} footer={<button>Apply</button>}>
        <input aria-label="Search" />
        <button disabled>Disabled</button>
        <div hidden><button>Hidden</button></div>
        <textarea aria-label="Notes" />
        {Array.from({ length: 30 }, (_, index) => <p key={index}>Content {index}</p>)}
      </Sheet>
    </>
  );
}

const brands = ["SKIN1004", "COSRX", "Anua"];

function ChildDemo() {
  const [open, setOpen] = useState(false);
  const [child, setChild] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const entry = useRef<HTMLButtonElement>(null);
  const goBack = () => {
    setChild(false);
    requestAnimationFrame(() => entry.current?.focus());
  };

  return (
    <>
      <button onClick={() => { setChild(false); setOpen(true); }}>Open filters</button>
      <Sheet
        open={open}
        title={child ? "Brand" : "All filters"}
        closeLabel="Close filters"
        onClose={() => setOpen(false)}
        back={child ? { label: "Back to filters", onClick: goBack } : undefined}
        contentPadding="compact"
        footer={<button onClick={() => setOpen(false)}>View results</button>}
      >
        <div hidden={child}>
          <button ref={entry} onClick={() => setChild(true)}>
            Brand{selected.length > 0 ? ` ${selected.length} selected` : ""}
          </button>
        </div>
        {child && (
          <div role="group" aria-label="Brand options">
            {brands.map((brand) => (
              <label key={brand}>
                <Checkbox
                  checked={selected.includes(brand)}
                  onCheckedChange={(checked) => setSelected((current) => (
                    checked ? [...current, brand] : current.filter((item) => item !== brand)
                  ))}
                />
                {brand}
              </label>
            ))}
          </div>
        )}
      </Sheet>
    </>
  );
}

test("Sheet confines focus, keeps its footer fixed and releases its modal lock across breakpoints", async () => {
  const viewport = { width: innerWidth, height: innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const originalOverflow = document.documentElement.style.overflow;
  try {
    flushSync(() => root.render(<StrictMode><Demo /></StrictMode>));
    for (const width of [375, 768, 1440]) {
      await page.viewport(width, 812);
      await page.getByRole("button", { name: "Open sheet" }).click();
      const dialog = container.querySelector<HTMLDialogElement>("dialog")!;
      expect(dialog.matches(":modal")).toBe(true);
      const bounds = dialog.getBoundingClientRect();
      expect(bounds.width).toBe(width < 1024 ? width : 560);
      if (width < 1024) {
        expect(bounds.bottom).toBe(innerHeight);
        expect(bounds.height).toBe(innerHeight - 48);
      } else expect(Math.abs(bounds.top - (innerHeight - bounds.height) / 2)).toBeLessThan(1);
      expect(getComputedStyle(document.documentElement).overflow).toBe("hidden");
      const close = dialog.querySelector<HTMLButtonElement>("button")!;
      const closeBounds = close.getBoundingClientRect();
      const closeIcon = close.querySelector<HTMLImageElement>("img")!;
      const closeIconBounds = closeIcon.getBoundingClientRect();
      expect(closeBounds.width).toBe(32);
      expect(closeBounds.height).toBe(32);
      expect(getComputedStyle(close, "::before").width).toBe("44px");
      expect(getComputedStyle(close, "::before").height).toBe("44px");
      expect(closeIconBounds.width).toBe(20);
      expect(closeIconBounds.height).toBe(20);
      expect(bounds.right - closeIconBounds.right).toBe(18);
      expect(closeIconBounds.top - bounds.top).toBe(14);
      expect(document.activeElement).toBe(close);
      await userEvent.tab();
      expect(document.activeElement?.getAttribute("aria-label")).toBe("Search");
      await userEvent.tab();
      expect(document.activeElement?.getAttribute("aria-label")).toBe("Notes");
      await userEvent.tab();
      expect(document.activeElement?.textContent).toBe("Apply");
      await userEvent.tab();
      expect(document.activeElement).toBe(close);
      await userEvent.tab({ shift: true });
      expect(document.activeElement?.textContent).toBe("Apply");
      const content = dialog.querySelector<HTMLElement>("[data-sheet-content]")!;
      const footer = dialog.querySelector<HTMLElement>('[data-slot="sheet-footer"]')!;
      const footerTop = footer.getBoundingClientRect().top;
      content.scrollTop = content.scrollHeight;
      expect(content.scrollTop).toBeGreaterThan(100);
      expect(footer.getBoundingClientRect().top).toBe(footerTop);
      await userEvent.keyboard("{Escape}");
      await expect.poll(() => container.querySelector("dialog")).toBeNull();
      expect(document.activeElement?.textContent).toBe("Open sheet");
      expect(document.documentElement.style.overflow).toBe(originalOverflow);
      expect(getComputedStyle(document.documentElement).overflow).not.toBe("hidden");
    }
  } finally {
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});

test("Sheet keeps content clicks open, dismisses the backdrop, and preserves an existing scroll lock", async () => {
  const viewport = { width: innerWidth, height: innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const originalOverflow = document.documentElement.style.overflow;
  try {
    await page.viewport(375, 812);
    document.documentElement.style.overflow = "hidden";
    flushSync(() => root.render(<Demo />));
    await page.getByRole("button", { name: "Open sheet" }).click();
    const dialog = container.querySelector<HTMLDialogElement>("dialog")!;
    await page.getByRole("textbox", { name: "Search" }).click();
    expect(dialog.matches(":modal")).toBe(true);
    dialog.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 1, clientY: 1 }));
    await expect.poll(() => container.querySelector("dialog")).toBeNull();
    expect(document.documentElement.style.overflow).toBe("hidden");
    await page.getByRole("button", { name: "Open sheet" }).click();
    flushSync(() => root.render(null));
    expect(document.querySelector("dialog:modal[data-sheet]")).toBeNull();
    expect(document.documentElement.style.overflow).toBe("hidden");
  } finally {
    root.unmount();
    container.remove();
    document.documentElement.style.overflow = originalOverflow;
    await page.viewport(viewport.width, viewport.height);
  }
});

test("Sheet child view returns to its parent without closing the dialog and keeps selections", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    flushSync(() => root.render(<ChildDemo />));
    await page.getByRole("button", { name: "Open filters" }).click();
    expect(getComputedStyle(container.querySelector<HTMLElement>("[data-sheet-content]")!).padding).toBe("8px");
    await page.getByRole("button", { name: "Brand" }).click();
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Back to filters");
    expect(page.getByRole("checkbox").elements()).toHaveLength(3);
    await page.getByRole("checkbox", { name: "SKIN1004" }).click();
    await page.getByRole("checkbox", { name: "COSRX" }).click();
    await userEvent.keyboard("{Escape}");
    expect(page.getByRole("dialog", { name: "All filters" })).toBeVisible();
    expect(page.getByRole("button", { name: "Brand 2 selected" })).toBeVisible();
    expect(document.activeElement?.textContent).toContain("Brand 2 selected");
    await page.getByRole("button", { name: "View results" }).click();
    await expect.poll(() => container.querySelector("dialog")).toBeNull();
  } finally {
    root.unmount();
    container.remove();
  }
});
