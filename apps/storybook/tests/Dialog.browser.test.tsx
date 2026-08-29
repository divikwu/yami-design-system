import { StrictMode, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { Dialog } from "../../../packages/design-system/components/Dialog";
import "@yami/design-system/tokens.css";

function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open dialog</button>
      <Dialog
        open={open}
        title="Confirm settings"
        closeLabel="Close confirmation"
        onClose={() => setOpen(false)}
        footer={<><button>Cancel</button><button>Confirm</button></>}
      >
        <input aria-label="Name" />
        {Array.from({ length: 30 }, (_, index) => <p key={index}>Content {index}</p>)}
      </Dialog>
    </>
  );
}

function ConfirmationDemo() {
  const [open, setOpen] = useState(true);
  return (
    <Dialog
      open={open}
      title="Confirm settings"
      variant="confirmation"
      onClose={() => setOpen(false)}
      footer={<><button>Cancel</button><button>Confirm</button></>}
    >
      Apply the current settings?
    </Dialog>
  );
}

test("Dialog stays centered, scrolls its body, traps focus and restores the opener", async () => {
  const viewport = { width: innerWidth, height: innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const originalOverflow = document.documentElement.style.overflow;
  try {
    flushSync(() => root.render(<StrictMode><Demo /></StrictMode>));
    for (const width of [375, 768, 1440]) {
      await page.viewport(width, 812);
      await page.getByRole("button", { name: "Open dialog" }).click();
      const dialog = container.querySelector<HTMLDialogElement>("dialog")!;
      expect(dialog.matches(":modal")).toBe(true);
      const bounds = dialog.getBoundingClientRect();
      expect(bounds.width).toBe(width === 375 ? 343 : 400);
      expect(Math.abs(bounds.left - (innerWidth - bounds.width) / 2)).toBeLessThan(1);
      expect(Math.abs(bounds.top - (innerHeight - bounds.height) / 2)).toBeLessThan(1);
      expect(bounds.top).toBeGreaterThanOrEqual(48);
      const header = dialog.querySelector<HTMLElement>('[data-slot="dialog-header"]')!;
      const title = dialog.querySelector<HTMLHeadingElement>("h2")!;
      expect(getComputedStyle(title).fontSize).toBe("16px");
      expect(getComputedStyle(header).borderBottomWidth).toBe("0px");
      const close = dialog.querySelector<HTMLButtonElement>("button")!;
      const icon = close.querySelector<HTMLImageElement>("img")!;
      expect(close.getBoundingClientRect().width).toBe(32);
      expect(close.getBoundingClientRect().height).toBe(32);
      expect(icon.getBoundingClientRect().width).toBe(20);
      expect(icon.getBoundingClientRect().height).toBe(20);
      expect(getComputedStyle(close, "::before").width).toBe("44px");
      expect(document.activeElement).toBe(close);
      await userEvent.tab();
      expect(document.activeElement?.getAttribute("aria-label")).toBe("Name");
      await userEvent.tab();
      expect(document.activeElement?.textContent).toBe("Cancel");
      await userEvent.tab();
      expect(document.activeElement?.textContent).toBe("Confirm");
      await userEvent.tab();
      expect(document.activeElement).toBe(close);
      const content = dialog.querySelector<HTMLElement>("[data-dialog-content]")!;
      const footer = dialog.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const footerTop = footer.getBoundingClientRect().top;
      content.scrollTop = content.scrollHeight;
      expect(content.scrollTop).toBeGreaterThan(100);
      expect(footer.getBoundingClientRect().top).toBe(footerTop);
      expect(getComputedStyle(document.documentElement).overflow).toBe("hidden");
      await userEvent.keyboard("{Escape}");
      await expect.poll(() => container.querySelector("dialog")).toBeNull();
      expect(document.activeElement?.textContent).toBe("Open dialog");
      expect(document.documentElement.style.overflow).toBe(originalOverflow);
    }
  } finally {
    root.unmount();
    container.remove();
    document.documentElement.style.overflow = originalOverflow;
    await page.viewport(viewport.width, viewport.height);
  }
});

test("Dialog dismisses the backdrop and supports alertdialog semantics", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    flushSync(() => root.render(
      <Dialog open title="Delete item" closeLabel="Close warning" onClose={() => root.render(null)} role="alertdialog">
        This action cannot be undone.
      </Dialog>
    ));
    const dialog = container.querySelector<HTMLDialogElement>("dialog")!;
    expect(dialog.getAttribute("role")).toBe("alertdialog");
    const bounds = dialog.getBoundingClientRect();
    dialog.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: bounds.left - 1, clientY: bounds.top - 1 }));
    await expect.poll(() => container.querySelector("dialog")).toBeNull();
  } finally {
    root.unmount();
    container.remove();
  }
});

test("Confirmation dialog centers its title, omits Close and focuses the first action", () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    flushSync(() => root.render(<ConfirmationDemo />));
    const dialog = container.querySelector<HTMLDialogElement>('dialog[data-variant="confirmation"]')!;
    const body = dialog.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
    const content = body.querySelector<HTMLElement>("[data-dialog-content]")!;
    const footer = dialog.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
    const title = dialog.querySelector("h2")!;
    expect(getComputedStyle(title).fontSize).toBe("16px");
    expect(getComputedStyle(title).textAlign).toBe("center");
    expect(body.querySelector('[data-slot="dialog-header"]')).not.toBeNull();
    expect(getComputedStyle(content).textAlign).toBe("center");
    expect(getComputedStyle(body).gap).toBe("8px");
    expect(getComputedStyle(body).paddingRight).toBe("12px");
    expect(getComputedStyle(body).paddingBottom).toBe("8px");
    expect(getComputedStyle(body).paddingLeft).toBe("12px");
    expect(getComputedStyle(footer).borderTopWidth).toBe("0px");
    expect(getComputedStyle(footer).paddingTop).toBe("12px");
    expect(getComputedStyle(footer).paddingRight).toBe("12px");
    expect(getComputedStyle(footer).paddingBottom).toBe("12px");
    expect(getComputedStyle(footer).paddingLeft).toBe("12px");
    expect(dialog.querySelector('[data-slot="dialog-header"] button')).toBeNull();
    expect(document.activeElement?.textContent).toBe("Cancel");
  } finally {
    root.unmount();
    container.remove();
  }
});
