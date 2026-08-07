import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { expect, test, vi } from "vitest";

import { Button } from "@yami/design-system/components/Button";

test("warns when an icon button has no accessible label in the Vite browser runtime", () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  try {
    flushSync(() => {
      root.render(
        <Button form="icon">
          <span aria-hidden="true">+</span>
        </Button>,
      );
    });

    expect(warning).toHaveBeenCalledWith(expect.stringContaining("rendered without aria-label"));
  } finally {
    root.unmount();
    container.remove();
    warning.mockRestore();
  }
});
