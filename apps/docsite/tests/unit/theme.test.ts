import { describe, expect, it } from "vitest";

import { isStoredTheme, resolveTheme, themeStorageKey } from "../../lib/theme";

describe("theme preference", () => {
  it("uses an explicit stored choice before the system preference", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the system when no valid choice is stored", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme("unexpected", false)).toBe("light");
  });

  it("accepts only the two persisted values", () => {
    expect(themeStorageKey).toBe("yami-docsite-theme");
    expect(isStoredTheme("light")).toBe(true);
    expect(isStoredTheme("dark")).toBe(true);
    expect(isStoredTheme("system")).toBe(false);
  });
});
